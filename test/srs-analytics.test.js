/* Test di SRS & Analytics (Agente D) — node:assert, zero dipendenze esterne.
 * Criteri di accettazione:
 *   - un item sbagliato ripetutamente riemerge più spesso (selectNext)
 *   - la heat-map (masteryMap) riflette lo storico
 *   - l'indice è ricostruibile dallo storico grezzo (formula Agente A)
 *   - persistenza FC.store: nessuna perdita al refresh + migrazione sicura
 *   - abilita il milestone "solo tap" (interop con i DrillItem dell'Agente A)
 * Esecuzione: node test/srs-analytics.test.js
 */
'use strict';
const assert = require('node:assert');
const D = require('../js/srs-analytics.js');
const PE = require('../js/pedagogy-engine.js');

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ✓ ' + name); }
  catch (e) { console.error('  ✗ ' + name + '\n    ' + e.message); process.exitCode = 1; }
}
function memStorage() {
  const m = {};
  return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; }, _dump: () => m };
}
// mappatura di riferimento Attempt → evento PedagogyEngine (deve coincidere con quella interna a D)
function toEng(a) {
  const p = a.itemId.split(':');
  return { drill: a.drillId, correct: a.ok, rtMs: a.latencyMs, at: a.ts,
    cellIds: p[0] === 'c' ? [p[1] + ':' + p[2]] : [], pairId: p[0] === 'p' ? p[1] + ':' + p[2] : null };
}
const mkAtt = (itemId, ok, latencyMs, ts, drillId) => ({ itemId, drillId: drillId || 1, ok, latencyMs, playedPitchClass: null, cents: null, ts });

console.log('\nSRS & Analytics — suite di test\n');

// ── Leitner con latenza ────────────────────────────────────────────────────
test('Leitner: corretto+veloce promuove, corretto+lento resta, sbagliato azzera', () => {
  let r = D.srs.newBucket('c:3:5');
  r = D.srs.updateBucket(r, true, 800, 1000);  assert.strictEqual(r.box, 2, 'veloce → +1');
  r = D.srs.updateBucket(r, true, 4000, 2000); assert.strictEqual(r.box, 2, 'lento → resta');
  r = D.srs.updateBucket(r, true, 700, 3000);  assert.strictEqual(r.box, 3, 'veloce → +1');
  r = D.srs.updateBucket(r, false, 900, 4000); assert.strictEqual(r.box, 1, 'sbagliato → azzera');
  assert.strictEqual(r.seen, 4);
  assert.strictEqual(r.correct, 3);
  assert.ok(r.ewmaLatency > 0);
});

// ── Un item sbagliato ripetutamente riemerge più spesso ────────────────────
test('selectNext: un item sbagliato riemerge prima di celle nuove o padroneggiate', () => {
  const now = 100000;
  const history = [];
  for (let i = 0; i < 3; i++) history.push(mkAtt('c:0:0', false, 3000, 1000 + i * 10)); // punto debole
  for (let i = 0; i < 4; i++) history.push(mkAtt('c:3:5', true, 700, 2000 + i * 10));    // padroneggiato
  const state = { schemaVersion: 1, history, settings: { maxFret: 5, zone: 'low' } };
  // dominante su 30 seed diversi
  let hits = 0;
  for (let s = 1; s <= 30; s++) {
    const pick = D.srs.selectNext(state, { maxFret: 5, zone: 'low' }, { now, rng: PE.makeRng(s) });
    if (pick.itemId === 'c:0:0') hits++;
  }
  assert.strictEqual(hits, 30, 'il punto debole deve essere scelto sempre');
  const one = D.srs.selectNext(state, { maxFret: 5, zone: 'low' }, { now, rng: PE.makeRng(7) });
  assert.strictEqual(one.reason, 'weak');
});

// ── La heat-map riflette lo storico ────────────────────────────────────────
test('masteryMap: heat-map coerente con lo storico + contratto MasteryCell', () => {
  const history = [];
  for (let i = 0; i < 4; i++) history.push(mkAtt('c:2:5', true, 700, 1000 + i * 10)); // → box5, level4
  for (let i = 0; i < 3; i++) history.push(mkAtt('c:1:1', false, 3000, 2000 + i * 10)); // → box1, level0
  const state = { schemaVersion: 1, history, settings: { maxFret: 12 } };
  const mm = D.srs.masteryMap(state);
  const hot = mm.find((c) => c.string === 2 && c.fret === 5);
  const cold = mm.find((c) => c.string === 1 && c.fret === 1);
  assert.strictEqual(hot.level, 4, 'cella padroneggiata → livello 4');
  assert.strictEqual(hot.box, 5);
  assert.strictEqual(cold.level, 0, 'cella sbagliata → livello 0');
  // contratto MasteryCell = { string, fret, level, lastSeen, box }
  assert.deepStrictEqual(Object.keys(hot).sort(), ['box', 'fret', 'lastSeen', 'level', 'string']);
  for (const c of mm) assert.ok(c.level >= 0 && c.level <= 4);
});

test('masteryMap vista "degrees" proietta le coppie (key,degree) sulle celle', () => {
  // In A(9) dorian, grado b3 = C (pc 0). Coppia p:9:3. Alleniamola → deve colorare tutte le celle C.
  const OPEN = [64, 59, 55, 50, 45, 40];
  const history = [];
  for (let i = 0; i < 4; i++) history.push(mkAtt('p:9:3', true, 700, 1000 + i * 10, 4));
  const state = { schemaVersion: 1, history, settings: { maxFret: 12 } };
  const mm = D.srs.masteryMap(state, { keyPitchClass: 9, mode: 'dorian', view: 'degrees', maxFret: 12 });
  assert.ok(mm.length > 0, 'la proiezione deve produrre celle');
  for (const c of mm) {
    assert.strictEqual((OPEN[c.string] + c.fret) % 12, 0, 'ogni cella proiettata è una C (pc 0)');
    assert.strictEqual(c.level, 4, 'coppia padroneggiata → livello 4 sulle celle');
  }
});

// ── Indice ricostruibile dallo storico grezzo (formula Agente A) ───────────
test('index: riusa la formula dell\'Agente A ed è funzione pura dello storico', () => {
  const history = [];
  let ts = 1000;
  for (let i = 0; i < 20; i++) {
    const ok = i % 3 !== 0;
    history.push(mkAtt(i % 2 ? 'c:' + (i % 6) + ':' + (i % 5) : 'p:9:' + (i % 7), ok, ok ? 1100 : 3200, ts, i % 2 ? 1 : 4));
    ts += 1000;
  }
  const got = D.srs.index(history);
  const expected = PE.computeIndexFromHistory(history.map(toEng), {});
  assert.deepStrictEqual(got, expected, 'index(D) deve coincidere con la formula di A');
  assert.ok(got.index >= 0 && got.index <= 100);
});

// ── Persistenza: nessuna perdita al refresh + migrazione ───────────────────
test('FC.store: save → load conserva lo storico (nessuna perdita al refresh)', () => {
  const storage = memStorage();
  let state = D.store.initState();
  state = D.srs.record(state, mkAtt('c:0:0', true, 900, 1000));
  state = D.srs.record(state, mkAtt('p:9:3', false, 3000, 2000, 4));
  assert.ok(D.store.save(state, { storage }));
  const loaded = D.store.load({ storage });
  assert.strictEqual(loaded.schemaVersion, 1);
  assert.deepStrictEqual(loaded.history, state.history);
  // l'indice ricalcolato dopo il reload è identico
  assert.deepStrictEqual(D.srs.index(loaded.history), D.srs.index(state.history));
});

test('FC.store: migrazione da schema legacy (senza schemaVersion) senza perdite', () => {
  const storage = memStorage();
  storage.setItem('gil_fc_v1', JSON.stringify({ history: [mkAtt('c:0:0', true, 800, 1)] }));
  const migrated = D.store.load({ storage });
  assert.strictEqual(migrated.schemaVersion, 1);
  assert.strictEqual(migrated.history.length, 1);
  assert.ok(migrated.settings && migrated.settings.mode);
});

test('FC.store: dato corrotto → stato fresco senza throw', () => {
  const storage = memStorage();
  storage.setItem('gil_fc_v1', '{non-json');
  const fresh = D.store.load({ storage });
  assert.strictEqual(fresh.history.length, 0);
  assert.strictEqual(fresh.schemaVersion, 1);
});

test('FC.store: export/import round-trip', () => {
  let state = D.store.initState();
  state = D.srs.record(state, mkAtt('c:2:2', true, 950, 1000));
  const json = D.store.export(state);
  const back = D.store.import(json);
  assert.deepStrictEqual(back.history, state.history);
});

// ── Copertura + trend RT ────────────────────────────────────────────────────
test('coverage: % celle visitate; selectNext copre le zone mai visitate', () => {
  const state = D.store.initState();
  const cov0 = D.srs.coverage(state, { maxFret: 5 });
  assert.strictEqual(cov0.visited, 0);
  assert.strictEqual(cov0.total, 6 * 6);
  const pick = D.srs.selectNext(state, { maxFret: 5, zone: 'low' }, { now: 1000, rng: PE.makeRng(1) });
  assert.strictEqual(pick.reason, 'coverage');
  assert.strictEqual(pick.space, 'cell');
});

test('reactionTrend: rileva il miglioramento del tempo di reazione', () => {
  const history = [];
  for (let i = 0; i < 6; i++) history.push(mkAtt('c:0:' + i, true, 3000, 1000 + i)); // lento
  for (let i = 0; i < 6; i++) history.push(mkAtt('c:1:' + i, true, 900, 2000 + i));  // veloce
  const t = D.srs.reactionTrend(history);
  assert.strictEqual(t.trend, 'improving');
  assert.ok(t.deltaMs < 0);
});

// ── Interop col milestone "solo tap" (DrillItem dell'Agente A) ─────────────
test('buildAttempt: da DrillItem di A costruisce Attempt canonico (cella vs coppia)', () => {
  const st = PE.initState({ keyPitchClass: 9, mode: 'dorian' });
  const item1 = PE.generateItem(1, st, { rng: PE.makeRng(1), now: 1000 }); // nomi → cella
  const a1 = D.srs.buildAttempt(item1, { ok: true, latencyMs: 850, now: 2000 });
  assert.ok(a1.itemId.startsWith('c:'), 'drill nomi → itemId cella');
  assert.strictEqual(a1.drillId, 1);
  assert.strictEqual(a1.ok, true);
  assert.deepStrictEqual(Object.keys(a1).sort(), ['cents', 'drillId', 'itemId', 'latencyMs', 'ok', 'playedPitchClass', 'ts']);

  const item4 = PE.generateItem(4, st, { rng: PE.makeRng(2), now: 1000 }); // gradi → coppia
  const a4 = D.srs.buildAttempt(item4, { ok: true, latencyMs: 950, now: 2000 });
  assert.ok(a4.itemId.startsWith('p:'), 'drill gradi → itemId coppia');
});

test('milestone solo-tap end-to-end: A genera → D registra → heat-map + indice', () => {
  const engineState = PE.initState({ keyPitchClass: 9, mode: 'dorian' });
  let store = D.store.initState();
  const rng = PE.makeRng(5);
  let now = 1000;
  for (let i = 0; i < 12; i++) {
    const item = PE.generateItem(1, engineState, { rng, now });
    const ok = i % 4 !== 0;
    const att = D.srs.buildAttempt(item, { ok, latencyMs: ok ? 1100 : 3300, now });
    store = D.srs.record(store, att);
    now += 1500;
  }
  const analytics = D.srs.analytics(store, { keyPitchClass: 9, mode: 'dorian' });
  assert.ok(analytics.masteryMap.length > 0, 'la heat-map deve avere celle');
  assert.ok(analytics.index.index >= 0 && analytics.index.index <= 100);
  assert.ok(analytics.coverage.visited > 0);
});

test('record: cappa lo storico a HISTORY_CAP (mobile)', () => {
  let state = D.store.initState();
  for (let i = 0; i < 2005; i++) state = D.srs.record(state, mkAtt('c:0:0', true, 900, i));
  assert.strictEqual(state.history.length, 2000);
  assert.strictEqual(state.history[state.history.length - 1].ts, 2004);
});

console.log(`\n${passed} test superati\n`);
