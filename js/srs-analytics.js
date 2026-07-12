/* ============================================================================
 * SRS & Analytics — Ripetizione spaziata, heat-map, indice, persistenza.
 * Agente D. Espone FC.store (persistenza) e FC.srs (scheduling + analytics).
 *
 * Principio architetturale: lo STORICO grezzo di Attempt è l'UNICA fonte di
 * verità persistita. Buckets Leitner, masteryMap (heat-map) e indice di
 * coscienza sono FUNZIONI PURE dello storico → nessuna perdita al refresh,
 * indice ricostruibile, heat-map sempre coerente con lo storico.
 *
 * CONTRATTI DATI (rispettati alla lettera):
 *   Attempt     = { itemId, drillId, ok, latencyMs, playedPitchClass, cents, ts }
 *   MasteryCell = { string, fret, level(0-4), lastSeen, box }
 *
 * Unità schedulabili (due spazi, itemId namespaced per evitare collisioni):
 *   cella (nomi)  → itemId "c:<string>:<fret>"     (A produce cellId "s:f")
 *   coppia (gradi)→ itemId "p:<keyPitchClass>:<degreeSemitone>" (A: pairId "k:d")
 *
 * L'indice riusa la formula dell'Agente A (PedagogyEngine.computeIndexFromHistory).
 * ==========================================================================*/
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.SRSAnalytics = factory(); root.FC = root.FC || {}; root.FC.store = root.SRSAnalytics.store; root.FC.srs = root.SRSAnalytics.srs; }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ─── Costanti ──────────────────────────────────────────────────────────────
  const DAY_MS = 86400000;
  const BOX_INTERVALS = [0, 1, 3, 7, 21];   // giorni per box 1..5 (Leitner). box1 → subito dovuto
  const FLUENT_MS = 2500;                    // corretto sotto questa latenza → promozione
  const EWMA_A = 0.3;
  const HISTORY_CAP = 2000;                  // storico compatto (mobile)
  const DEFAULT_MAX_FRET = 12;
  const SCHEMA_VERSION = 1;
  const STORE_KEY = 'gil_fc_v1';
  const OPEN_STRING_MIDI = [64, 59, 55, 50, 45, 40];
  const ZONES = { open: [0, 4], low: [0, 5], mid: [4, 9], high: [9, 12], all: [0, 24] };
  // Spazio SR per drill: nomi → cella; gradi/target-tone → coppia.
  const SPACE_BY_DRILL = { 1: 'cell', 2: 'cell', 3: 'cell', 4: 'pair', 5: 'pair', 6: 'cell', 7: 'pair' };
  // Pesi di selectNext (bilancia scadenza · debolezza · latenza · box basso · copertura).
  const W = { due: 1.0, weak: 1.2, lat: 0.6, box: 0.8, wrong: 0.5, cover: 0.9 };

  const mod12 = (n) => ((n % 12) + 12) % 12;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // ─── Item id (namespaced, self-describing) ─────────────────────────────────
  const cellItemId = (string, fret) => `c:${string}:${fret}`;
  const pairItemId = (keyPitchClass, degreeSemitone) => `p:${keyPitchClass}:${degreeSemitone}`;
  function parseItemId(id) {
    if (!id || typeof id !== 'string') return null;
    const parts = id.split(':');
    if (parts[0] === 'c') return { space: 'cell', string: +parts[1], fret: +parts[2] };
    if (parts[0] === 'p') return { space: 'pair', keyPitchClass: +parts[1], degreeSemitone: +parts[2] };
    return null;
  }

  // ─── Riuso della formula dell'indice (Agente A) ────────────────────────────
  let _engine = null;
  function resolveEngine(opts) {
    if (opts && opts.engine) return opts.engine;
    if (_engine) return _engine;
    if (typeof module === 'object' && module.exports) { try { _engine = require('./pedagogy-engine.js'); return _engine; } catch (e) { /* browser */ } }
    const g = (typeof self !== 'undefined') ? self : (typeof globalThis !== 'undefined' ? globalThis : this);
    if (g && g.PedagogyEngine) { _engine = g.PedagogyEngine; return _engine; }
    return null;
  }
  function setEngine(pe) { _engine = pe; }

  // Attempt (contratto D) → evento nella firma attesa da PedagogyEngine.
  function toEngineEvent(a) {
    const p = parseItemId(a.itemId);
    return {
      drill: a.drillId, correct: !!a.ok, rtMs: a.latencyMs, at: a.ts,
      cellIds: (p && p.space === 'cell') ? [`${p.string}:${p.fret}`] : [],
      pairId: (p && p.space === 'pair') ? `${p.keyPitchClass}:${p.degreeSemitone}` : null,
    };
  }

  // ─── Buckets Leitner (con latenza) — derivati dallo storico ────────────────
  function newBucket(id) { return { id, box: 1, seen: 0, correct: 0, ewmaLatency: 0, lastSeen: 0, lastOk: false, due: 0 }; }
  function updateBucket(rec, ok, latencyMs, ts) {
    const r = Object.assign({}, rec);
    r.seen++; if (ok) r.correct++;
    if (latencyMs != null) r.ewmaLatency = r.ewmaLatency ? Math.round(EWMA_A * latencyMs + (1 - EWMA_A) * r.ewmaLatency) : latencyMs;
    if (ok && latencyMs != null && latencyMs <= FLUENT_MS) r.box = Math.min(5, r.box + 1); // corretto+veloce → promuove
    else if (ok) r.box = r.box;                                                            // corretto+lento → resta
    else r.box = 1;                                                                        // sbagliato → azzera (riemerge)
    r.lastOk = !!ok; r.lastSeen = ts;
    r.due = ts + BOX_INTERVALS[r.box - 1] * DAY_MS;
    return r;
  }
  // Ricostruisce TUTTI i buckets (entrambi gli spazi) dallo storico. Puro.
  function bucketsFromHistory(history) {
    const items = {};
    for (const a of (history || [])) {
      if (!a || !a.itemId) continue;
      items[a.itemId] = updateBucket(items[a.itemId] || newBucket(a.itemId), a.ok, a.latencyMs, a.ts);
    }
    return items;
  }
  const bucketAccuracy = (r) => (r.seen ? r.correct / r.seen : 0);

  // ─── masteryMap → MasteryCell[] per la heat-map del manico ─────────────────
  // ctx: { keyPitchClass, mode, view:'names'|'degrees'|'combined', maxFret }
  function cellMastery(string, fret, rec) {
    return { string, fret, level: clamp(rec.box - 1, 0, 4), lastSeen: rec.lastSeen, box: rec.box };
  }
  function masteryMap(state, ctx) {
    ctx = ctx || {};
    const items = bucketsFromHistory(state.history);
    const view = ctx.view || 'names';
    const maxFret = ctx.maxFret || (state.settings && state.settings.maxFret) || DEFAULT_MAX_FRET;
    const byCell = {}; // "s:f" → MasteryCell (per fondere le viste)
    const put = (mc) => {
      const k = mc.string + ':' + mc.fret;
      if (!byCell[k] || mc.level > byCell[k].level) byCell[k] = mc; // combined → livello massimo
    };
    if (view === 'names' || view === 'combined') {
      for (const id in items) { const p = parseItemId(id); if (p && p.space === 'cell') put(cellMastery(p.string, p.fret, items[id])); }
    }
    if ((view === 'degrees' || view === 'combined') && ctx.keyPitchClass != null) {
      for (let s = 0; s < 6; s++) for (let f = 0; f <= maxFret; f++) {
        const deg = mod12(mod12(OPEN_STRING_MIDI[s] + f) - ctx.keyPitchClass);
        const rec = items[pairItemId(ctx.keyPitchClass, deg)];
        if (rec) put(cellMastery(s, f, rec));
      }
    }
    return Object.keys(byCell).map((k) => byCell[k]);
  }

  // ─── Copertura del manico (% celle visitate) ───────────────────────────────
  function coverage(state, ctx) {
    ctx = ctx || {};
    const maxFret = ctx.maxFret || (state.settings && state.settings.maxFret) || DEFAULT_MAX_FRET;
    const total = 6 * (maxFret + 1);
    const items = bucketsFromHistory(state.history);
    let visited = 0;
    for (const id in items) { const p = parseItemId(id); if (p && p.space === 'cell' && p.fret <= maxFret) visited++; }
    return { visited, total, pct: total ? visited / total : 0 };
  }

  // ─── Trend del tempo di reazione ───────────────────────────────────────────
  function reactionTrend(history) {
    const lat = (history || []).filter((a) => a.ok && a.latencyMs != null).map((a) => a.latencyMs);
    if (!lat.length) return { avgMs: 0, earlyMs: 0, lateMs: 0, deltaMs: 0, trend: 'stable', count: 0 };
    const avg = (arr) => Math.round(arr.reduce((s, x) => s + x, 0) / arr.length);
    const half = Math.floor(lat.length / 2) || 1;
    const early = avg(lat.slice(0, half)), late = avg(lat.slice(-half)), delta = late - early;
    return { avgMs: avg(lat), earlyMs: early, lateMs: late, deltaMs: delta, count: lat.length,
      trend: delta < -100 ? 'improving' : delta > 100 ? 'worsening' : 'stable' };
  }

  // ─── Indice di coscienza (formula dell'Agente A) ───────────────────────────
  function index(history, opts) {
    const pe = resolveEngine(opts);
    if (!pe) throw new Error('PedagogyEngine non disponibile: passa opts.engine o carica pedagogy-engine.js');
    return pe.computeIndexFromHistory((history || []).map(toEngineEvent), opts || {});
  }

  // ─── selectNext: bilancia scadenza · debolezza · latenza · copertura ───────
  function selectNext(state, ctx, opts) {
    ctx = ctx || {}; opts = opts || {};
    const now = opts.now != null ? opts.now : Date.now();
    const rng = opts.rng || Math.random;
    const maxFret = ctx.maxFret || (state.settings && state.settings.maxFret) || DEFAULT_MAX_FRET;
    const zone = ctx.zone || (state.settings && state.settings.zone) || 'all';
    const [lo, hiZ] = ZONES[zone] || ZONES.all;
    const hi = Math.min(hiZ, maxFret);
    const items = bucketsFromHistory(state.history);
    const cands = [];

    // item già visti: scadenza + debolezza + latenza + box basso + ultimo esito
    for (const id in items) {
      const p = parseItemId(id); if (!p) continue;
      const rec = items[id];
      const acc = bucketAccuracy(rec);
      const overdueDays = Math.max(0, (now - rec.due) / DAY_MS);
      const overdue = overdueDays > 0 ? overdueDays / (overdueDays + 1) : 0;   // 0..1
      const weakness = 1 - acc;
      const latNorm = clamp((rec.ewmaLatency - FLUENT_MS) / (6000 - FLUENT_MS), 0, 1);
      const lowBox = (5 - rec.box) / 4;
      let score = W.due * overdue + W.weak * weakness + W.lat * latNorm + W.box * lowBox + (rec.lastOk ? 0 : W.wrong);
      cands.push(Object.assign({ itemId: id, score, reason: rec.lastOk ? (overdue > 0 ? 'due' : 'weak') : 'weak' }, p));
    }
    // copertura: celle mai visitate nella zona
    for (let s = 0; s < 6; s++) for (let f = lo; f <= hi; f++) {
      const id = cellItemId(s, f);
      if (items[id]) continue;
      cands.push({ itemId: id, space: 'cell', string: s, fret: f, score: W.cover, reason: 'coverage' });
    }
    if (!cands.length) return null;
    let best = null, bestScore = -Infinity;
    for (const c of cands) { const sc = c.score + rng() * 0.05; if (sc > bestScore) { bestScore = sc; best = c; } }
    return best;
  }

  // ─── Registrazione tentativi ───────────────────────────────────────────────
  // Costruisce un Attempt canonico da un DrillItem dell'Agente A + esito.
  function buildAttempt(item, o) {
    o = o || {};
    const space = SPACE_BY_DRILL[item.drill || item.drillId] || 'cell';
    let itemId = null;
    if (space === 'cell') {
      const cid = (o.playedCellId) || (item.cellIds && item.cellIds[0]);
      if (cid) itemId = 'c:' + cid;
    } else if (item.pairId) {
      itemId = 'p:' + item.pairId;
    }
    return {
      itemId, drillId: item.drill || item.drillId, ok: !!o.ok,
      latencyMs: o.latencyMs != null ? o.latencyMs : null,
      playedPitchClass: o.playedPitchClass != null ? o.playedPitchClass : null,
      cents: o.cents != null ? o.cents : null,
      ts: o.now != null ? o.now : Date.now(),
    };
  }
  // Applica un Attempt allo stato (append + cap). Puro: non muta `state`.
  function record(state, attempt) {
    const history = (state.history || []).concat([attempt]).slice(-HISTORY_CAP);
    return Object.assign({}, state, { history, updatedAt: attempt.ts || Date.now() });
  }

  // Snapshot analitico completo per la UI (Agente E).
  function analytics(state, ctx) {
    return {
      index: index(state.history, ctx),
      masteryMap: masteryMap(state, ctx),
      coverage: coverage(state, ctx),
      reactionTrend: reactionTrend(state.history),
    };
  }

  // ─── Persistenza (FC.store) — versioning + migrazione sicura ────────────────
  function getStorage(opts) {
    if (opts && opts.storage) return opts.storage;
    try { if (typeof localStorage !== 'undefined') return localStorage; } catch (e) {}
    return null;
  }
  function initState(settings) {
    const now = (settings && settings.now) || Date.now();
    return {
      schemaVersion: SCHEMA_VERSION, history: [],
      settings: Object.assign({ keyPitchClass: 9, mode: 'aeolian', zone: 'all', maxFret: DEFAULT_MAX_FRET }, (settings && settings.settings) || settings || {}),
      createdAt: now, updatedAt: now,
    };
  }
  // Migrazione: porta qualunque stato salvato alla versione corrente senza perdite.
  function migrate(raw) {
    if (!raw || typeof raw !== 'object') return initState();
    let s = raw;
    let v = s.schemaVersion || 0;
    if (v === 0) {                                  // legacy (pre-versioning): recupera lo storico se presente
      s = { schemaVersion: 1, history: Array.isArray(s.history) ? s.history : [], settings: s.settings || {}, createdAt: s.createdAt || Date.now(), updatedAt: s.updatedAt || Date.now() };
      v = 1;
    }
    // (futuri step: if (v === 1) { …; v = 2; })
    if (!Array.isArray(s.history)) s.history = [];
    s.schemaVersion = SCHEMA_VERSION;
    s.settings = Object.assign({ keyPitchClass: 9, mode: 'aeolian', zone: 'all', maxFret: DEFAULT_MAX_FRET }, s.settings || {});
    return s;
  }
  function load(opts) {
    const storage = getStorage(opts);
    const key = (opts && opts.key) || STORE_KEY;
    if (!storage) return initState();
    let raw = null;
    try { raw = storage.getItem(key); } catch (e) { return initState(); }
    if (!raw) return initState();
    let parsed; try { parsed = JSON.parse(raw); } catch (e) { return initState(); } // corrotto → riparti pulito
    return migrate(parsed);
  }
  function save(state, opts) {
    const storage = getStorage(opts);
    const key = (opts && opts.key) || STORE_KEY;
    if (!storage) return false;
    const out = { schemaVersion: SCHEMA_VERSION, history: state.history || [], settings: state.settings || {}, createdAt: state.createdAt || Date.now(), updatedAt: state.updatedAt || Date.now() };
    try { storage.setItem(key, JSON.stringify(out)); return true; } catch (e) { return false; } // quota/privato → no throw
  }
  function exportJSON(state) {
    return JSON.stringify({ schemaVersion: SCHEMA_VERSION, history: state.history || [], settings: state.settings || {} }, null, 2);
  }
  function importJSON(json) {
    let parsed; try { parsed = typeof json === 'string' ? JSON.parse(json) : json; } catch (e) { return null; }
    return migrate(parsed);
  }

  return {
    // esposizione a FC.*
    store: { KEY: STORE_KEY, SCHEMA_VERSION, initState, load, save, migrate, export: exportJSON, import: importJSON },
    srs: {
      cellItemId, pairItemId, parseItemId, SPACE_BY_DRILL,
      newBucket, updateBucket, bucketsFromHistory, bucketAccuracy,
      selectNext, masteryMap, coverage, reactionTrend, index, analytics,
      buildAttempt, record, setEngine,
      BOX_INTERVALS, FLUENT_MS,
    },
  };
}));
