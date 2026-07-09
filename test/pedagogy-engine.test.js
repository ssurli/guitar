/* Test del PedagogyEngine — nessuna dipendenza esterna (node:assert).
 * Verifica i criteri di accettazione dell'Agente A:
 *   1. ogni drill produce SEMPRE entrambe le etichette (nome + grado)
 *   2. la progressione è deterministica e testabile
 *   3. l'indice è ricalcolabile da uno storico
 * Contratti canonici (allineati all'Agente B): pitchClass, Attempt, MasteryCell,
 * etichette di grado ASCII ('b3').
 * Esecuzione: node test/pedagogy-engine.test.js
 */
'use strict';
const assert = require('node:assert');
const PE = require('../js/pedagogy-engine.js');

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ✓ ' + name); }
  catch (e) { console.error('  ✗ ' + name + '\n    ' + e.message); process.exitCode = 1; }
}

// Helper: risponde correttamente e velocemente a un item, producendo un Attempt.
function answerCorrect(item, now, rtMs) {
  let resp;
  if (item.responseType === 'tap') {
    resp = { value: item.ask === 'name' ? item.expect.name : item.expect.degree };
  } else if (item.matchKind === 'octaves') {
    resp = { cellIds: item.expect.octaveCells.slice() };
  } else {
    resp = { pitchClass: item.expect.pitchClass, midi: item.target.midi };
  }
  const ok = PE.check(item, resp);
  return PE.buildEvent(item, resp, ok, rtMs != null ? rtMs : 900, now);
}

console.log('\nPedagogyEngine — suite di test\n');

// ── 1. Doppia etichettatura su OGNI drill ────────────────────────────────────
test('ogni drill genera sempre entrambe le etichette (nome + grado)', () => {
  const state = PE.initState({ keyPitchClass: 9, mode: 'dorian' }); // A dorian
  const rng = PE.makeRng(42);
  for (const id of [1, 2, 3, 4, 5, 6, 7]) {
    const item = PE.generateItem(id, state, { rng, now: 1000, chordRootPitchClass: 9 });
    assert.ok(item.labels, `drill ${id}: labels mancante`);
    assert.ok(item.labels.name, `drill ${id}: etichetta NOME assente`);
    assert.ok(item.labels.degree, `drill ${id}: etichetta GRADO assente`);
    assert.ok(item.prompt && item.prompt.length > 0, `drill ${id}: prompt vuoto`);
    assert.strictEqual(item.drill, id);
  }
});

test('doppia etichetta coerente con la teoria (A dorian: C = b3, ASCII)', () => {
  // Corda D (idx 3), tasto 10 = C4 (midi 60), pitchClass 0. In A(9) dorian → grado b3.
  const note = PE.cellToNote(3, 10, { keyPitchClass: 9, mode: 'dorian' });
  assert.strictEqual(note.name, 'C');
  assert.strictEqual(note.pitchClass, 0);
  assert.strictEqual(note.degreeLabel, 'b3');
  assert.strictEqual(note.inScale, true);
  const dl = PE.dualLabels(0, 9);
  assert.deepStrictEqual(dl, { name: 'C', degree: 'b3' });
});

// ── 2. Determinismo della progressione/selezione ─────────────────────────────
test('nextItem è deterministico a parità di stato + seed', () => {
  const state = PE.initState({ keyPitchClass: 0, mode: 'ionian' });
  const seqA = [], seqB = [];
  let rng = PE.makeRng(7);
  for (let i = 0; i < 20; i++) seqA.push(PE.nextItem(state, { rng, now: 5000 }).prompt);
  rng = PE.makeRng(7);
  for (let i = 0; i < 20; i++) seqB.push(PE.nextItem(state, { rng, now: 5000 }).prompt);
  assert.deepStrictEqual(seqA, seqB, 'due run con lo stesso seed divergono');
});

test('buildSession è deterministica e ha il conteggio item pianificato', () => {
  const state = PE.initState({ keyPitchClass: 2, mode: 'mixolydian' });
  const s1 = PE.buildSession(state, { seed: 99, now: 5000, durationMin: 6, chordRootPitchClass: 2 });
  const s2 = PE.buildSession(state, { seed: 99, now: 5000, durationMin: 6, chordRootPitchClass: 2 });
  assert.strictEqual(s1.items.length, s1.plan.itemCount);
  assert.deepStrictEqual(s1.items.map((i) => i.prompt), s2.items.map((i) => i.prompt));
  // ogni item della sessione rispetta la doppia etichetta
  for (const it of s1.items) { assert.ok(it.labels.name); assert.ok(it.labels.degree); }
});

test('Leitner: risposta corretta promuove il box, errata lo azzera (MasteryCell)', () => {
  let rec = PE.newRec('3:5');
  rec = PE.updateRec(rec, true, 800, 1000);  assert.strictEqual(rec.box, 2);
  rec = PE.updateRec(rec, true, 800, 2000);  assert.strictEqual(rec.box, 3);
  rec = PE.updateRec(rec, false, 3000, 3000); assert.strictEqual(rec.box, 1);
  assert.strictEqual(rec.seen, 3);
  assert.strictEqual(rec.correct, 2);
  assert.ok(rec.ewmaRt > 0);
});

test('progressione: il drill 2 si sblocca solo dopo padronanza del drill 1', () => {
  let state = PE.initState({ keyPitchClass: 9, mode: 'aeolian' });
  assert.deepStrictEqual(PE.unlockedDrills(state), [1], 'all\'inizio solo drill 1');
  // 10 risposte corrette e veloci al drill 1 → supera il gate (acc≥85%, ewmaRt≤3s, seen≥8)
  let now = 1000;
  const rng = PE.makeRng(3);
  for (let i = 0; i < 10; i++) {
    const item = PE.generateItem(1, state, { rng, now });
    const ev = answerCorrect(item, now, 800);
    state = PE.applyResult(state, ev, { now });
    now += 1000;
  }
  const unlocked = PE.unlockedDrills(state);
  assert.ok(unlocked.includes(2), 'drill 2 dovrebbe essere sbloccato');
  assert.ok(unlocked.includes(4), 'drill 4 dovrebbe essere sbloccato');
  assert.ok(!unlocked.includes(3), 'drill 3 non ancora (richiede drill 2)');
});

test('sblocco monotòno: un drill sbloccato resta sbloccato', () => {
  let state = PE.initState({ keyPitchClass: 0, mode: 'ionian' });
  let now = 1000; const rng = PE.makeRng(11);
  for (let i = 0; i < 10; i++) { const it = PE.generateItem(1, state, { rng, now }); state = PE.applyResult(state, answerCorrect(it, now, 700), { now }); now += 1000; }
  assert.ok(state.drills[2].unlocked);
  // ora sbaglia ripetutamente il drill 1: resta comunque sbloccato il 2
  for (let i = 0; i < 5; i++) {
    const it = PE.generateItem(1, state, { rng, now });
    const bad = PE.buildEvent(it, { value: 'X' }, false, 4000, now);
    state = PE.applyResult(state, bad, { now }); now += 1000;
  }
  assert.ok(state.drills[2].unlocked, 'lo sblocco non deve regredire');
});

// ── 3. Indice ricalcolabile dallo storico ────────────────────────────────────
test('indice: applyResult concorda con computeIndexFromHistory(history)', () => {
  let state = PE.initState({ keyPitchClass: 9, mode: 'dorian' });
  let now = 1000; const rng = PE.makeRng(5);
  for (let i = 0; i < 25; i++) {
    const item = PE.nextItem(state, { rng, now, chordRootPitchClass: 9 });
    const correct = i % 4 !== 0; // ~75% corrette
    const ev = correct ? answerCorrect(item, now, 1200)
      : PE.buildEvent(item, { value: 'X', pitchClass: 99, midi: -1 }, false, 3500, now);
    state = PE.applyResult(state, ev, { now });
    now += 1500;
  }
  const recomputed = PE.computeIndexFromHistory(state.history, { now });
  assert.strictEqual(state.index.index, recomputed.index, 'indice incrementale ≠ ricalcolato');
  assert.strictEqual(state.index.coverage, recomputed.coverage);
  assert.strictEqual(state.index.accuracy, recomputed.accuracy);
  assert.ok(state.index.index >= 0 && state.index.index <= 100);
});

test('indice: ricalcolo puro dallo storico è indipendente dall\'ordine di applicazione', () => {
  // Stesso storico → stesso indice, sempre (funzione pura dello storico di Attempt).
  const attempts = [];
  let now = 1000;
  const state0 = PE.initState({ keyPitchClass: 0, mode: 'ionian' });
  const rng = PE.makeRng(21);
  let s = state0;
  for (let i = 0; i < 15; i++) {
    const it = PE.nextItem(s, { rng, now });
    const ev = answerCorrect(it, now, 1000);
    attempts.push(ev); s = PE.applyResult(s, ev, { now }); now += 1000;
  }
  const a = PE.computeIndexFromHistory(attempts, {});
  const b = PE.computeIndexFromHistory(attempts.slice(), {});
  assert.deepStrictEqual(a, b);
});

test('applicazione: senza drill 7 i pesi si rinormalizzano (hasApplication=false)', () => {
  const attempts = [{ drill: 1, keyPitchClass: 0, correct: true, rtMs: 800, at: 1000, cellIds: ['0:5'], pairId: '0:0' }];
  const idx = PE.computeIndexFromHistory(attempts, {});
  assert.strictEqual(idx.hasApplication, false);
  assert.ok(idx.index >= 0 && idx.index <= 100);
});

console.log(`\n${passed} test superati\n`);
