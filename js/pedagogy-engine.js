/* ============================================================================
 * PedagogyEngine — Motore pedagogico della modalità "Coscienza del Manico"
 * Agente A (Architetto del Metodo). Funzioni PURE, testabili, senza UI/DOM.
 *
 * Responsabilità:
 *   - specifica formale dei 7 drill come oggetti dati
 *   - doppia etichettatura (nome assoluto + grado) SEMPRE presente su ogni item
 *   - progressione adattiva (sblocco drill) deterministica
 *   - ripetizione spaziata alla Leitner (celle + coppie tonalità/grado)
 *   - indice di coscienza 0–100 RICALCOLABILE dallo storico
 *   - pianificazione sessioni mobile (5–10 min, mix ripasso/nuovo)
 *
 * Contratti condivisi: vedi docs/coscienza-del-manico-piano-integrazione.md §2.
 * Determinismo: ogni funzione che "sceglie" riceve `rng` e `now` iniettati.
 * ==========================================================================*/
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PedagogyEngine = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ─── Costanti condivise (default; l'Analytics può sovrascriverle) ──────────
  const DAY_MS = 86400000;
  const BOX_INTERVALS = [0, 1, 3, 7, 21];      // giorni-equivalenti per box 1..5 (Leitner)
  const EWMA_A = 0.3;                          // coefficiente EWMA del reaction time
  const RT_FLOOR = 700, RT_CEIL = 4000;        // ms: mappa velocità → [0,1]
  const WEIGHTS = { coverage: 0.30, accuracy: 0.30, speed: 0.20, application: 0.20 };
  const UNLOCK = { acc: 0.85, ewmaRtMs: 3000, minSeen: 8 }; // gate di sblocco drill
  const NEW_RATIO = 0.30;                      // quota "nuovo materiale" vs ripasso
  const HISTORY_CAP = 500;                     // ring buffer eventi
  const DEFAULT_MAX_FRET = 12;
  const ACC_DECAY = 0.97;                      // decadimento accuratezza pesata sul recente
  const ITEMS_PER_MIN = 4;                     // stima per pianificare la sessione

  // ─── Teoria musicale (self-contained, allineata a index.html) ──────────────
  const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const OPEN_STRING_MIDI = [64, 59, 55, 50, 45, 40]; // 0=e cantino … 5=E basso
  const STRING_NAMES = ['e', 'B', 'G', 'D', 'A', 'E'];
  const INTERVAL_LABELS = { 0: '1', 1: '♭2', 2: '2', 3: '♭3', 4: '3', 5: '4', 6: '♭5', 7: '5', 8: '♭6', 9: '6', 10: '♭7', 11: '7' };
  const INTERVAL_FULL = { 1: 'seconda minore', 2: 'seconda maggiore', 3: 'terza minore', 4: 'terza maggiore', 5: 'quarta giusta', 6: 'quarta aumentata', 7: 'quinta giusta', 8: 'sesta minore', 9: 'sesta maggiore', 10: 'settima minore', 11: 'settima maggiore', 12: 'ottava' };
  const SCALES = {
    ionian: [0, 2, 4, 5, 7, 9, 11], dorian: [0, 2, 3, 5, 7, 9, 10], phrygian: [0, 1, 3, 5, 7, 8, 10],
    lydian: [0, 2, 4, 6, 7, 9, 11], mixolydian: [0, 2, 4, 5, 7, 9, 10], aeolian: [0, 2, 3, 5, 7, 8, 10],
    locrian: [0, 1, 3, 5, 6, 8, 10], major_pent: [0, 2, 4, 7, 9], minor_pent: [0, 3, 5, 7, 10],
  };
  const MODE_LABELS = {
    ionian: 'ionico', dorian: 'dorico', phrygian: 'frigio', lydian: 'lidio',
    mixolydian: 'misolidio', aeolian: 'eolio', locrian: 'locrio',
    major_pent: 'pentatonica maggiore', minor_pent: 'pentatonica minore',
  };
  const ZONES = { open: [0, 4], low: [0, 5], mid: [4, 9], high: [9, 12], all: [0, 12] };
  // Chord tone del drill 7: semitono dalla fondamentale dell'accordo → etichetta grado
  const CHORD_TONES = [{ st: 0, label: 'fondamentale (1)' }, { st: 4, label: '3ª' }, { st: 7, label: '5ª' }, { st: 10, label: '7ª' }];

  const mod12 = (n) => ((n % 12) + 12) % 12;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // ─── PRNG deterministico (mulberry32) ──────────────────────────────────────
  function makeRng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(arr, rng) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ─── NoteRef & helper geometria/etichette (contratto §2.1) ─────────────────
  const cellId = (string, fret) => `${string}:${fret}`;
  const pairId = (keyPc, degreeSemitone) => `${keyPc}:${degreeSemitone}`;

  function cellToNote(string, fret, ctx) {
    const midi = OPEN_STRING_MIDI[string] + fret;
    const pc = mod12(midi);
    const note = { pc, midi, string, fret, name: NOTES[pc], octave: Math.floor(midi / 12) - 1 };
    if (ctx && ctx.keyPc != null) {
      const deg = mod12(pc - ctx.keyPc);
      note.degreeSemitone = deg;
      note.degreeLabel = INTERVAL_LABELS[deg];
      if (ctx.mode && SCALES[ctx.mode]) note.inScale = SCALES[ctx.mode].indexOf(deg) !== -1;
    }
    return note;
  }
  function midiToCells(midi, opts) {
    const maxFret = (opts && opts.maxFret) || DEFAULT_MAX_FRET;
    const out = [];
    for (let s = 0; s < 6; s++) {
      const f = midi - OPEN_STRING_MIDI[s];
      if (f >= 0 && f <= maxFret) out.push({ string: s, fret: f });
    }
    return out;
  }
  // Doppia etichettatura: nome assoluto + grado. SEMPRE entrambi (pilastro 1).
  function dualLabels(pc, keyPc) {
    return { name: NOTES[pc], degree: keyPc != null ? INTERVAL_LABELS[mod12(pc - keyPc)] : null };
  }
  function octaveShapesOf(note, opts) { return midiToCells(note.midi, opts); }
  function intervalFrom(note, semitones, opts) {
    return midiToCells(note.midi + semitones, opts);
  }

  // ─── Specifica formale dei 7 drill (oggetti dati) ──────────────────────────
  // responseType: 'tap' (scelta) | 'sound' (suono verificato dallo YIN)
  // verify:  'logic' | 'yin' | 'yin-pitchclass' | 'yin-downbeat'
  // given/ask: quale etichetta/entità è DATA e quale è RICHIESTA (doppia etichetta)
  const DRILLS = {
    1: { id: 1, key: 'name-note', title: 'Nomina nota', responseType: 'tap', verify: 'logic',
         given: 'cell', ask: 'name', matchKind: 'logic', needsContext: false, timed: false },
    2: { id: 2, key: 'find-note', title: 'Trova nota', responseType: 'sound', verify: 'yin',
         given: 'name', ask: 'position', matchKind: 'pitchClass', needsContext: false, timed: false },
    3: { id: 3, key: 'octave-map', title: 'Mappa ottave', responseType: 'sound', verify: 'yin',
         given: 'name', ask: 'octaves', matchKind: 'octaves', needsContext: false, timed: true, windowMs: 15000 },
    4: { id: 4, key: 'name-degree', title: 'Nomina grado', responseType: 'tap', verify: 'logic',
         given: 'cell', ask: 'degree', matchKind: 'logic', needsContext: true, timed: false },
    5: { id: 5, key: 'find-degree', title: 'Trova grado', responseType: 'sound', verify: 'yin-pitchclass',
         given: 'degree', ask: 'position', matchKind: 'pitchClass', needsContext: true, timed: false },
    6: { id: 6, key: 'interval-jump', title: "Salto d'intervallo", responseType: 'sound', verify: 'yin',
         given: 'anchor+interval', ask: 'position', matchKind: 'pitchClass', needsContext: false, timed: false },
    7: { id: 7, key: 'target-tone', title: 'Target-tone improv', responseType: 'sound', verify: 'yin-downbeat',
         given: 'chordTone', ask: 'position', matchKind: 'chordTone', needsContext: true, timed: true, windowMs: 180 },
  };
  const PREREQ = { 1: [], 2: [1], 3: [2], 4: [1], 5: [4], 6: [5], 7: [2, 5, 6] };

  // ─── Leitner (ripetizione spaziata) ────────────────────────────────────────
  function newRec(id) { return { id, box: 1, due: 0, seen: 0, correct: 0, ewmaRt: 0, lastResult: false, lastSeen: 0 }; }
  function updateRec(rec, correct, rtMs, now) {
    const r = Object.assign({}, rec);
    r.seen++; if (correct) r.correct++;
    r.box = correct ? Math.min(5, r.box + 1) : 1;                 // promuove / azzera (Leitner)
    r.ewmaRt = r.ewmaRt ? Math.round(EWMA_A * rtMs + (1 - EWMA_A) * r.ewmaRt) : rtMs;
    r.lastResult = !!correct; r.lastSeen = now;
    r.due = now + BOX_INTERVALS[r.box - 1] * DAY_MS;
    return r;
  }

  // ─── Ricostruzione stato derivato dallo STORICO (index ricalcolabile) ──────
  function replay(events, opts) {
    const cells = {}, pairs = {}, drills = {};
    for (const e of events) {
      for (const cid of (e.cellIds || [])) cells[cid] = updateRec(cells[cid] || newRec(cid), e.correct, e.rtMs, e.at);
      if (e.pairId) pairs[e.pairId] = updateRec(pairs[e.pairId] || newRec(e.pairId), e.correct, e.rtMs, e.at);
      const d = drills[e.drill] || { id: e.drill, seen: 0, correct: 0, ewmaRt: 0, accuracy: 0 };
      d.seen++; if (e.correct) d.correct++;
      d.ewmaRt = d.ewmaRt ? Math.round(EWMA_A * e.rtMs + (1 - EWMA_A) * d.ewmaRt) : e.rtMs;
      d.accuracy = d.correct / d.seen;
      drills[e.drill] = d;
    }
    return { cells, pairs, drills };
  }

  function weightedAccuracy(events) {
    let sw = 0, sc = 0, w = 1;
    for (let i = events.length - 1; i >= 0; i--) {
      sw += w; sc += w * (events[i].correct ? 1 : 0);
      w *= ACC_DECAY; if (w < 1e-3) break;
    }
    return sw ? sc / sw : 0;
  }
  function speedScore(events) {
    const arr = [];
    for (let i = events.length - 1; i >= 0 && arr.length < 40; i--) if (events[i].correct) arr.push(events[i].rtMs);
    if (!arr.length) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return clamp(1 - (mean - RT_FLOOR) / (RT_CEIL - RT_FLOOR), 0, 1);
  }

  // Indice di coscienza 0–100 — RICALCOLABILE puramente da uno storico eventi.
  // Pesi: copertura·accuratezza·velocità·applicazione (rinormalizzati se una
  // dimensione non ha ancora dati, es. drill 7 non giocato).
  function computeIndexFromHistory(events, opts) {
    opts = opts || {};
    const maxFret = opts.maxFret || DEFAULT_MAX_FRET;
    const weights = opts.weights || WEIGHTS;
    const derived = replay(events, opts);

    const denom = opts.coverageCells || (6 * (maxFret + 1));
    let mastered = 0;
    for (const id in derived.cells) if (derived.cells[id].box >= 4) mastered++;
    const coverage = clamp(mastered / denom, 0, 1);

    const accuracy = weightedAccuracy(events);
    const speed = speedScore(events);
    const d7 = events.filter((e) => e.drill === 7);
    const application = d7.length ? weightedAccuracy(d7) : null;

    const dims = [['coverage', coverage], ['accuracy', accuracy], ['speed', speed]];
    if (application != null) dims.push(['application', application]);
    let wsum = 0, acc = 0;
    for (const [k, v] of dims) { wsum += weights[k]; acc += weights[k] * v; }
    const index = wsum ? Math.round(100 * acc / wsum) : 0;

    return {
      index, coverage, accuracy, speed, application: application == null ? 0 : application,
      hasApplication: application != null,
      updatedAt: events.length ? events[events.length - 1].at : (opts.now || 0),
    };
  }

  // ─── Progressione adattiva (sblocco drill) ─────────────────────────────────
  function drillMastered(stats) {
    return !!stats && stats.seen >= UNLOCK.minSeen &&
      (stats.correct / stats.seen) >= UNLOCK.acc &&
      stats.ewmaRt > 0 && stats.ewmaRt <= UNLOCK.ewmaRtMs;
  }
  // Ritorna gli id drill sbloccati. Monotòno: uno sblocco già ottenuto resta.
  function unlockedDrills(state) {
    const stats = (state && state.drills) || {};
    const set = new Set([1]);                                   // drill 1 sempre aperto
    for (const idStr of [2, 3, 4, 5, 6, 7]) {
      const prev = stats[idStr] && stats[idStr].unlocked;
      const ok = PREREQ[idStr].every((p) => drillMastered(stats[p]));
      if (prev || ok) set.add(idStr);
    }
    return [...set].sort((a, b) => a - b);
  }
  function recomputeDrillState(prevDrills, derivedDrills) {
    const out = {};
    for (const id of [1, 2, 3, 4, 5, 6, 7]) {
      const d = Object.assign({ id, seen: 0, correct: 0, ewmaRt: 0, accuracy: 0 }, derivedDrills[id] || {});
      d.unlocked = (prevDrills[id] && prevDrills[id].unlocked) || false;
      out[id] = d;
    }
    // seconda passata: applica i gate ora che tutte le stats sono note
    const virtual = { drills: out };
    for (const id of unlockedDrills(virtual)) out[id].unlocked = true;
    return out;
  }

  // ─── Selezione target (SR-driven, deterministica via rng) ──────────────────
  function zoneFrets(state) {
    const z = (state.settings && state.settings.zone) || 'all';
    return ZONES[z] || ZONES.all;
  }
  function candidateCells(state, inScaleOnly) {
    const [lo, hi] = zoneFrets(state);
    const sc = state.settings && state.settings.stringConstraint;
    const keyPc = state.settings && state.settings.keyPc;
    const mode = state.settings && state.settings.mode;
    const cells = [];
    for (let s = 0; s < 6; s++) {
      if (sc != null && sc !== s) continue;
      for (let f = lo; f <= hi; f++) {
        if (inScaleOnly && keyPc != null && mode && SCALES[mode]) {
          const deg = mod12(mod12(OPEN_STRING_MIDI[s] + f) - keyPc);
          if (SCALES[mode].indexOf(deg) === -1) continue;
        }
        cells.push({ string: s, fret: f });
      }
    }
    return cells;
  }
  // Sceglie la cella più "debole/scaduta" (SR), con casualità controllata.
  function weakestCell(cells, state, now, rng, avoidId) {
    let best = null, bestKey = Infinity;
    for (const c of cells) {
      const id = cellId(c.string, c.fret);
      const rec = state.cells && state.cells[id];
      let key;
      if (!rec) key = 0 + rng() * 0.4;                          // mai vista → priorità massima
      else if (rec.due <= now) key = rec.box + rng() * 0.4;     // scaduta → box debole prima
      else key = 10 + rec.box + (rec.due - now) / DAY_MS;       // non scaduta → bassa priorità
      if (id === avoidId) key += 5;                             // evita ripetizione immediata
      if (key < bestKey) { bestKey = key; best = c; }
    }
    return best;
  }
  function weakestPair(state, degrees, keyPc, now, rng, avoidId) {
    let best = null, bestKey = Infinity;
    for (const deg of degrees) {
      const id = pairId(keyPc, deg);
      const rec = state.pairs && state.pairs[id];
      let key;
      if (!rec) key = 0 + rng() * 0.4;
      else if (rec.due <= now) key = rec.box + rng() * 0.4;
      else key = 10 + rec.box + (rec.due - now) / DAY_MS;
      if (id === avoidId) key += 5;
      if (key < bestKey) { bestKey = key; best = deg; }
    }
    return best;
  }

  // ─── Generazione item di drill (doppia etichetta SEMPRE presente) ──────────
  function pickChoices(correct, pool, n, rng) {
    const others = pool.filter((x) => x !== correct);
    shuffle(others, rng);
    const sel = others.slice(0, Math.max(0, n - 1));
    sel.push(correct);
    return shuffle(sel, rng);
  }

  function generateItem(drillId, state, opts) {
    const rng = (opts && opts.rng) || Math.random;
    const now = (opts && opts.now != null) ? opts.now : Date.now();
    const spec = DRILLS[drillId];
    const keyPc = (state.settings && state.settings.keyPc != null) ? state.settings.keyPc : 0;
    const mode = (state.settings && state.settings.mode) || 'ionian';
    const modeLabel = MODE_LABELS[mode] || mode;
    const keyName = NOTES[keyPc];
    const scale = SCALES[mode] || SCALES.ionian;
    const avoid = state.lastTargetId;

    const base = {
      drill: drillId, keyPc, mode, responseType: spec.responseType, verify: spec.verify,
      matchKind: spec.matchKind, ask: spec.ask, given: spec.given, timed: spec.timed,
      windowMs: spec.windowMs || null, createdAt: now,
    };

    switch (drillId) {
      case 1: {  // NOMINA NOTA — dato tasto, chiedi il NOME (grado mostrato dopo)
        const c = weakestCell(candidateCells(state, false), state, now, rng, avoid);
        const note = cellToNote(c.string, c.fret, { keyPc, mode });
        return Object.assign(base, {
          target: note, labels: dualLabels(note.pc, keyPc),
          cellIds: [cellId(c.string, c.fret)], pairId: pairId(keyPc, note.degreeSemitone),
          expect: { name: note.name, pc: note.pc },
          choices: pickChoices(note.name, NOTES.slice(), 4, rng),
          prompt: `Corda ${STRING_NAMES[c.string]}, tasto ${c.fret}: che nota è?`,
          successHint: `${note.name} · grado ${note.degreeLabel} in ${keyName} ${modeLabel}`,
        });
      }
      case 4: {  // NOMINA GRADO — dato tasto, chiedi il GRADO (nome mostrato dopo)
        const c = weakestCell(candidateCells(state, true), state, now, rng, avoid);
        const note = cellToNote(c.string, c.fret, { keyPc, mode });
        const degChoices = scale.map((d) => INTERVAL_LABELS[d]);
        return Object.assign(base, {
          target: note, labels: dualLabels(note.pc, keyPc),
          cellIds: [cellId(c.string, c.fret)], pairId: pairId(keyPc, note.degreeSemitone),
          expect: { degree: note.degreeLabel, degreeSemitone: note.degreeSemitone },
          choices: pickChoices(note.degreeLabel, degChoices, Math.min(4, degChoices.length), rng),
          prompt: `In ${keyName} ${modeLabel}, corda ${STRING_NAMES[c.string]} tasto ${c.fret}: che grado è?`,
          successHint: `${note.degreeLabel} · nota ${note.name}`,
        });
      }
      case 2: {  // TROVA NOTA — dato NOME, suona ovunque (pitch-class)
        const c = weakestCell(candidateCells(state, false), state, now, rng, avoid);
        const note = cellToNote(c.string, c.fret, { keyPc, mode });
        return Object.assign(base, {
          target: { pc: note.pc, name: note.name }, labels: dualLabels(note.pc, keyPc),
          cellIds: [], pairId: pairId(keyPc, note.degreeSemitone),
          expect: { pc: note.pc },
          prompt: `Suona la nota ${note.name} (in qualsiasi posizione)`,
          successHint: `${note.name} · grado ${note.degreeLabel}`,
        });
      }
      case 3: {  // MAPPA OTTAVE — dato NOME, suona tutte le ottave entro X sec
        const c = weakestCell(candidateCells(state, false), state, now, rng, avoid);
        const note = cellToNote(c.string, c.fret, { keyPc, mode });
        const allCells = [];
        for (let s = 0; s < 6; s++) for (let f = 0; f <= DEFAULT_MAX_FRET; f++)
          if (mod12(OPEN_STRING_MIDI[s] + f) === note.pc) allCells.push(cellId(s, f));
        return Object.assign(base, {
          target: { pc: note.pc, name: note.name }, labels: dualLabels(note.pc, keyPc),
          cellIds: [], pairId: pairId(keyPc, note.degreeSemitone),
          expect: { pc: note.pc, octaveCells: allCells },
          prompt: `Suona TUTTE le ottave di ${note.name} entro ${Math.round(spec.windowMs / 1000)}s`,
          successHint: `${allCells.length} posizioni · grado ${note.degreeLabel}`,
        });
      }
      case 5: {  // TROVA GRADO — data tonalità, suona il grado richiesto
        const deg = weakestPair(state, scale, keyPc, now, rng, avoid);
        const pc = mod12(keyPc + deg);
        return Object.assign(base, {
          target: { pc, degreeSemitone: deg }, labels: dualLabels(pc, keyPc),
          cellIds: [], pairId: pairId(keyPc, deg),
          expect: { pc, degreeSemitone: deg },
          prompt: `In ${keyName} ${modeLabel}, suona la ${INTERVAL_LABELS[deg]}`,
          successHint: `${INTERVAL_LABELS[deg]} · nota ${NOTES[pc]}`,
        });
      }
      case 6: {  // SALTO D'INTERVALLO — da un'ancora, suona N sopra
        const c = weakestCell(candidateCells(state, false), state, now, rng, avoid);
        const anchor = cellToNote(c.string, c.fret, { keyPc, mode });
        const intervals = [3, 4, 5, 7, 9, 12];
        const iv = intervals[Math.floor(rng() * intervals.length)];
        const pc = mod12(anchor.pc + iv);
        return Object.assign(base, {
          target: { pc, fromMidi: anchor.midi, interval: iv }, labels: dualLabels(pc, keyPc),
          anchor: anchor, cellIds: [], pairId: pairId(keyPc, mod12(pc - keyPc)),
          expect: { pc },
          prompt: `Da ${anchor.name} (corda ${STRING_NAMES[c.string]}, tasto ${c.fret}): suona una ${INTERVAL_FULL[iv]} sopra`,
          successHint: `${NOTES[pc]} · grado ${INTERVAL_LABELS[mod12(pc - keyPc)]}`,
        });
      }
      case 7: {  // TARGET-TONE IMPROV — atterra sul chord-tone sul downbeat
        // Enfasi sulle guide tone (3ª/7ª): pesi maggiori.
        const bag = [CHORD_TONES[1], CHORD_TONES[3], CHORD_TONES[1], CHORD_TONES[3], CHORD_TONES[0], CHORD_TONES[2]];
        const ct = bag[Math.floor(rng() * bag.length)];
        const chordRootPc = (opts && opts.chordRootPc != null) ? opts.chordRootPc : null;
        // Nome assoluto risolto se conosciamo l'accordo; il grado (chord-tone) è sempre noto.
        let name = null, pc = null, degreeInKey = null;
        if (chordRootPc != null) {
          pc = mod12(chordRootPc + ct.st);
          name = NOTES[pc];
          degreeInKey = INTERVAL_LABELS[mod12(pc - keyPc)];
        }
        return Object.assign(base, {
          target: { chordToneSemitone: ct.st, chordToneLabel: ct.label, pc },
          labels: { name: name || '(risolto sul beat)', degree: ct.label, degreeInKey },
          cellIds: [], pairId: (pc != null ? pairId(keyPc, mod12(pc - keyPc)) : null),
          expect: { chordToneSemitone: ct.st, pc },
          prompt: `Sul beat, atterra sulla ${ct.label} dell'accordo corrente`,
          successHint: `chord-tone ${ct.label}${name ? ' · ' + name : ''}`,
        });
      }
      default:
        throw new Error('Drill sconosciuto: ' + drillId);
    }
  }

  // ─── Selezione del PROSSIMO drill (mix ripasso/nuovo, deterministico) ──────
  function pickDrill(state, unlocked, wantNew, rng, now) {
    if (!unlocked.length) return 1;
    if (wantNew) return unlocked[unlocked.length - 1];   // drill più recente = nuovo materiale
    // ripasso: preferisci i drill con più item scaduti; fallback pesato
    const scored = unlocked.map((id) => {
      const spec = DRILLS[id];
      let due = 0;
      const space = (spec.given === 'degree') ? state.pairs : state.cells;
      for (const k in (space || {})) if (space[k].due <= now && space[k].box < 5) due++;
      return { id, w: 1 + due };
    });
    const total = scored.reduce((a, b) => a + b.w, 0);
    let r = rng() * total;
    for (const s of scored) { r -= s.w; if (r <= 0) return s.id; }
    return scored[scored.length - 1].id;
  }

  // API PRINCIPALE: dato lo stato, ritorna il prossimo item di drill.
  function nextItem(state, opts) {
    opts = opts || {};
    const rng = opts.rng || Math.random;
    const now = opts.now != null ? opts.now : Date.now();
    const unlocked = unlockedDrills(state);
    const wantNew = rng() < (opts.newRatio != null ? opts.newRatio : NEW_RATIO);
    const drillId = pickDrill(state, unlocked, wantNew, rng, now);
    return generateItem(drillId, state, { rng, now, chordRootPc: opts.chordRootPc });
  }

  // ─── Verifica esito (condizione di successo, pura) ─────────────────────────
  // response: {value} per tap/choice ; {pc, midi} per il suono.
  function check(item, response) {
    if (!item || !response) return false;
    switch (item.matchKind) {
      case 'logic': {
        if (item.ask === 'name') return response.value === item.expect.name;
        if (item.ask === 'degree') return response.value === item.expect.degree;
        return false;
      }
      case 'pitchClass':
      case 'chordTone':
        return response.pc != null && item.expect.pc != null && mod12(response.pc) === mod12(item.expect.pc);
      case 'note':
        return response.midi != null && response.midi === item.expect.midi;
      case 'octaves': {
        // response.pcs: set di pitch-class suonate (o cellIds); successo se tutte le ottave coperte
        const set = new Set((response.cellIds || []));
        return (item.expect.octaveCells || []).every((c) => set.has(c));
      }
      default: return false;
    }
  }

  // ─── Costruzione DrillEvent + aggiornamento stato (immutabile) ─────────────
  function buildEvent(item, response, correct, rtMs, now) {
    const cellIds = (response && response.cellIds) || item.cellIds || [];
    return {
      drill: item.drill, keyPc: item.keyPc, mode: item.mode, target: item.target,
      response: {
        method: item.responseType === 'tap' ? 'choice' : 'pitch',
        value: response ? response.value : undefined,
        detectedMidi: response ? response.midi : undefined,
        detectedPc: response ? response.pc : undefined,
        cents: response ? response.cents : undefined,
      },
      correct: !!correct, rtMs: rtMs, at: now,
      cellIds: cellIds, pairId: item.pairId,
    };
  }

  // Applica un evento allo stato: storico + SR + drill stats + sblocchi + indice.
  // Puro: non muta `state`. L'indice risultante è = computeIndexFromHistory(history).
  function applyResult(state, event, opts) {
    opts = opts || {};
    const history = (state.history || []).concat([event]).slice(-HISTORY_CAP);
    const derived = replay(history, opts);
    const drills = recomputeDrillState(state.drills || {}, derived.drills);
    const index = computeIndexFromHistory(history, Object.assign({ now: event.at }, opts));
    return Object.assign({}, state, {
      version: 1, history, cells: derived.cells, pairs: derived.pairs,
      drills, index, lastTargetId: (event.cellIds && event.cellIds[0]) || event.pairId || state.lastTargetId,
    });
  }

  // ─── Sessioni (mobile 5–10 min: conteggi ripasso/nuovo) ────────────────────
  function planSession(state, opts) {
    opts = opts || {};
    const durationMin = opts.durationMin || 7;
    const itemCount = Math.max(6, Math.round(durationMin * (opts.itemsPerMin || ITEMS_PER_MIN)));
    const reviewCount = Math.round(itemCount * (1 - (opts.newRatio != null ? opts.newRatio : NEW_RATIO)));
    return {
      targetMs: durationMin * 60000, itemCount,
      reviewCount, newCount: itemCount - reviewCount,
      unlocked: unlockedDrills(state),
    };
  }
  // Costruisce una sessione deterministica (array di item) senza simulare le risposte.
  function buildSession(state, opts) {
    opts = opts || {};
    const rng = opts.rng || makeRng(opts.seed || 1);
    const now = opts.now != null ? opts.now : Date.now();
    const plan = planSession(state, opts);
    const items = [];
    let cursor = state;
    for (let i = 0; i < plan.itemCount; i++) {
      const wantNew = (i % plan.itemCount) >= plan.reviewCount ? 1 : 0; // coda = nuovo materiale
      const item = nextItem(cursor, { rng, now, newRatio: wantNew, chordRootPc: opts.chordRootPc });
      items.push(item);
      // marca l'ultimo target per evitare ripetizioni consecutive nella build
      cursor = Object.assign({}, cursor, { lastTargetId: (item.cellIds && item.cellIds[0]) || item.pairId });
    }
    return { plan, items };
  }

  function initState(settings) {
    return {
      version: 1, cells: {}, pairs: {}, history: [],
      drills: { 1: { id: 1, seen: 0, correct: 0, ewmaRt: 0, accuracy: 0, unlocked: true } },
      index: { index: 0, coverage: 0, accuracy: 0, speed: 0, application: 0, hasApplication: false, updatedAt: 0 },
      settings: Object.assign({ keyPc: 9, mode: 'aeolian', zone: 'all', stringConstraint: null }, settings || {}),
      lastTargetId: null,
    };
  }

  return {
    // costanti/spec
    DRILLS, PREREQ, WEIGHTS, BOX_INTERVALS, SCALES, NOTES, INTERVAL_LABELS, ZONES,
    // teoria/NoteRef
    cellToNote, midiToCells, dualLabels, octaveShapesOf, intervalFrom, cellId, pairId,
    // SR / indice
    newRec, updateRec, replay, computeIndexFromHistory,
    // progressione
    drillMastered, unlockedDrills, recomputeDrillState,
    // motore
    initState, generateItem, nextItem, check, buildEvent, applyResult,
    // sessioni
    planSession, buildSession,
    // util deterministici
    makeRng, shuffle,
  };
}));
