/* Test di FretboardTheory (Agente B) — node:assert, zero dipendenze.
 * Criteri di accettazione:
 *   - round-trip nota → posizioni → gradi → back
 *   - almeno 3 tonalità e i 7 modi
 *   - gestione enarmonica corretta
 * Esecuzione: node test/fretboard-theory.test.js
 */
'use strict';
const assert = require('node:assert');
const FT = require('../js/fretboard-theory.js');

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ✓ ' + name); }
  catch (e) { console.error('  ✗ ' + name + '\n    ' + e.message); process.exitCode = 1; }
}

console.log('\nFretboardTheory — suite di test\n');

// Formule dei gradi (textbook) per i 7 modi — verità di riferimento.
const MODE_DEGREES = {
  ionian:     ['1', '2', '3', '4', '5', '6', '7'],
  dorian:     ['1', '2', 'b3', '4', '5', '6', 'b7'],
  phrygian:   ['1', 'b2', 'b3', '4', '5', 'b6', 'b7'],
  lydian:     ['1', '2', '3', '#4', '5', '6', '7'],
  mixolydian: ['1', '2', '3', '4', '5', '6', 'b7'],
  aeolian:    ['1', '2', 'b3', '4', '5', 'b6', 'b7'],
  locrian:    ['1', 'b2', 'b3', '4', 'b5', 'b6', 'b7'],
};

// ── noteAt di base ────────────────────────────────────────────────────────
test('noteAt rispetta il contratto Note e la geometria del manico', () => {
  // corda 5 (MI basso) a vuoto = E2
  const e2 = FT.noteAt(5, 0);
  assert.deepStrictEqual(
    { name: e2.name, pitchClass: e2.pitchClass, octave: e2.octave, midi: e2.midi },
    { name: 'E', pitchClass: 4, octave: 2, midi: 40 });
  assert.ok(Math.abs(e2.freq - 82.41) < 0.1, 'freq E2 ≈ 82.41Hz');
  // corda 0 (mi cantino) tasto 0 = E4
  const e4 = FT.noteAt(0, 0);
  assert.strictEqual(e4.midi, 64);
  assert.ok(Math.abs(e4.freq - 329.63) < 0.2, 'freq E4 ≈ 329.63Hz');
  // ha esattamente le chiavi del contratto
  assert.deepStrictEqual(Object.keys(e2).sort(),
    ['freq', 'fret', 'midi', 'name', 'octave', 'pitchClass', 'string'].sort());
});

// ── 3 tonalità × 7 modi: gradi corretti ───────────────────────────────────
test('gradi corretti su 3 tonalità (C, F#, Eb) e tutti i 7 modi', () => {
  const keys = ['C', 'F#', 'Eb'];
  for (const key of keys) {
    for (const mode of Object.keys(MODE_DEGREES)) {
      const scale = FT.spellScale(key, mode);
      const got = scale.map((s) => s.degree);
      assert.deepStrictEqual(got, MODE_DEGREES[mode], `${key} ${mode} gradi errati`);
      // degreeOf deve concordare con lo spelling della scala
      for (const s of scale) {
        assert.strictEqual(FT.degreeOf(s.pitchClass, key, mode).degree, s.degree,
          `${key} ${mode}: degreeOf(${s.pitchClass}) ≠ ${s.degree}`);
      }
    }
  }
});

// ── Enarmonia coerente con la tonalità ─────────────────────────────────────
test('enarmonia: in F# minore la b3 è A (non G##)', () => {
  // F# aeolian: F# G# A B C# D E
  const scale = FT.spellScale('F#', 'aeolian');
  assert.deepStrictEqual(scale.map((s) => s.name), ['F#', 'G#', 'A', 'B', 'C#', 'D', 'E']);
  const b3 = scale.find((s) => s.degree === 'b3');
  assert.strictEqual(b3.name, 'A');
  assert.strictEqual(FT.degreeOf(9 /*A*/, 'F#', 'aeolian').degree, 'b3');
});

test('enarmonia: tonalità bemolle preservano i bemolli (Eb maggiore)', () => {
  const scale = FT.spellScale('Eb', 'ionian');
  assert.deepStrictEqual(scale.map((s) => s.name), ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D']);
});

test('enarmonia: lydian usa #4, locrian usa b5 (non la stessa etichetta)', () => {
  assert.strictEqual(FT.spellScale('C', 'lydian').find((s) => s.degreeNum === 4).degree, '#4');
  assert.strictEqual(FT.spellScale('C', 'locrian').find((s) => s.degreeNum === 5).degree, 'b5');
  // e le note: C lydian 4° = F#, C locrian 5° = Gb
  assert.strictEqual(FT.spellScale('C', 'lydian').find((s) => s.degreeNum === 4).name, 'F#');
});

// ── isChordTone / role ─────────────────────────────────────────────────────
test('isChordTone: gradi 1-3-5-7 sono chord tone, 2-4-6 no', () => {
  const scale = FT.spellScale('A', 'aeolian');
  for (const s of scale) {
    const d = FT.degreeOf(s.pitchClass, 'A', 'aeolian');
    const expected = [1, 3, 5, 7].includes(s.degreeNum);
    assert.strictEqual(d.isChordTone, expected, `grado ${s.degree} isChordTone atteso ${expected}`);
  }
  assert.strictEqual(FT.degreeOf(9, 'A', 'aeolian').role, 'root');
  assert.strictEqual(FT.degreeOf(0, 'A', 'aeolian').role, 'third'); // C = b3 di A
});

test('nota fuori scala → etichetta cromatica, non chord tone', () => {
  // In C ionian, C# (pc 1) è fuori scala
  const d = FT.degreeOf(1, 'C', 'ionian');
  assert.strictEqual(d.degree, 'b2');
  assert.strictEqual(d.isChordTone, false);
  assert.strictEqual(d.role, 'chromatic');
});

// ── Round-trip: nota → posizioni → gradi → back ───────────────────────────
test('round-trip: (corda,tasto) → pitchClass → octaveShapes contiene la posizione', () => {
  for (const [s, f] of [[5, 3], [3, 2], [0, 5], [2, 7], [4, 0]]) {
    const note = FT.noteAt(s, f);
    const shapes = FT.octaveShapes(note.pitchClass);
    const found = shapes.some((p) => p.string === s && p.fret === f);
    assert.ok(found, `octaveShapes(${note.pitchClass}) non contiene (${s},${f})`);
    // ogni posizione ritornata ha davvero quella classe d'altezza
    for (const p of shapes) assert.strictEqual(FT.noteAt(p.string, p.fret).pitchClass, note.pitchClass);
  }
});

test('round-trip completo: pos → nota → grado → risalita alla stessa classe', () => {
  const key = 'G', mode = 'mixolydian';
  const note = FT.noteAt(4, 2); // corda A tasto 2 = B (pc 11)
  assert.strictEqual(note.pitchClass, 11);
  const deg = FT.degreeOf(note.pitchClass, key, mode); // B in G mix = grado 3
  assert.strictEqual(deg.degree, '3');
  // dal grado risali alla classe d'altezza tramite lo spelling della scala
  const back = FT.spellScale(key, mode).find((x) => x.degree === deg.degree);
  assert.strictEqual(back.pitchClass, note.pitchClass);
});

// ── deriveFrom (ancora-e-deriva) ──────────────────────────────────────────
test('deriveFrom: sesta maggiore sopra A2 → F#3 (pitchClass 6)', () => {
  const anchor = { string: 5, fret: 5 }; // A2 (midi 45)
  const derived = FT.deriveFrom(anchor, 9); // +9 semitoni = sesta maggiore
  const dn = FT.noteAt(derived.string, derived.fret);
  assert.strictEqual(dn.pitchClass, 6, 'F#');
  assert.strictEqual(dn.midi, 54, 'F#3');
});

test('deriveFrom sceglie la posizione più vicina alla mano', () => {
  const anchor = { string: 4, fret: 7 }; // E3 (midi 52)
  const derived = FT.deriveFrom(anchor, 5); // +5 = quarta giusta → A3 (midi 57)
  assert.strictEqual(FT.noteAt(derived.string, derived.fret).midi, 57);
  // vicino: differenza di tasto contenuta
  assert.ok(Math.abs(derived.fret - anchor.fret) <= 5);
});

// ── Ponte YIN: pitchClassFromFreq ─────────────────────────────────────────
test('pitchClassFromFreq: 440Hz → A, 261.63Hz → C, con cents e tolleranza', () => {
  const a = FT.pitchClassFromFreq(440);
  assert.strictEqual(a.pitchClass, 9);
  assert.strictEqual(a.name, 'A');
  assert.ok(Math.abs(a.cents) <= 1);
  const c = FT.pitchClassFromFreq(261.63);
  assert.strictEqual(c.pitchClass, 0);
  // tolleranza: 445Hz vs A440 è ~20 cent → fuori tolleranza a 10 cent
  const off = FT.pitchClassFromFreq(445, { toleranceCents: 10 });
  assert.strictEqual(off.pitchClass, 9);
  assert.strictEqual(off.inTolerance, false);
  const near = FT.pitchClassFromFreq(441, { toleranceCents: 10 });
  assert.strictEqual(near.inTolerance, true);
});

// ── Riuso accordature alternative già configurate ─────────────────────────
test('accordature alternative: Drop D abbassa solo la 6ª corda a D2', () => {
  const std = FT.noteAt(5, 0, { tuning: 'standard' });
  const drop = FT.noteAt(5, 0, { tuning: 'drop_d' });
  assert.strictEqual(std.midi, 40); // E2
  assert.strictEqual(drop.midi, 38); // D2
  assert.strictEqual(drop.pitchClass, 2);
  // le altre corde restano invariate
  assert.strictEqual(FT.noteAt(0, 0, { tuning: 'drop_d' }).midi, 64);
});

console.log(`\n${passed} test superati\n`);
