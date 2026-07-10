/* Test del core DSP di PitchLoop (Agente C) — node:assert, zero dipendenze.
 * Testa la logica pura (analyzeFrame/matchFrame/createSession) alimentandola con
 * sequenze di frame { freq, t } sintetici — la stessa forma che il loop condiviso
 * (autocorrelate) produce a runtime. Lo shell mic/AudioContext non è unit-testato
 * (richiede il browser); qui si verifica tutta la logica di decisione.
 *
 * Criteri di accettazione:
 *   - distingue le ottave in modalità 'exact'; accetta qualsiasi ottava in 'pitchClass'
 *   - rifiuta armonici spuri (finestra di stabilità)
 *   - restituisce latencyMs plausibile (onset)
 * Esecuzione: node test/pitch-loop.test.js
 */
'use strict';
const assert = require('node:assert');
const C = require('../js/pitch-loop.js');

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ✓ ' + name); }
  catch (e) { console.error('  ✗ ' + name + '\n    ' + e.message); process.exitCode = 1; }
}
const f = (midi) => C.midiToFreq(midi);           // frequenza esatta di un MIDI
// Alimenta una sessione con una lista di frame [{freq,t}] finché non termina.
function run(session, frames) {
  for (const fr of frames) { const out = session.feed(fr.freq, fr.t); if (out.done) return out.result; }
  return session.result; // eventualmente null se non conclusa
}
// Genera N frame della stessa frequenza a passo dt, partendo da t0.
function steady(freq, n, t0, dt) { const a = []; for (let i = 0; i < n; i++) a.push({ freq, t: t0 + i * (dt || 20) }); return a; }
const SIL = (t) => ({ freq: -1, t });

console.log('\nPitchLoop (core DSP) — suite di test\n');

// ── Conversioni base ────────────────────────────────────────────────────────
test('conversioni: 440Hz→A(pc9), E2→pc4, silenzio→null', () => {
  assert.strictEqual(C.pitchClassOf(C.freqToMidiFloat(440)), 9);
  const e2 = C.analyzeFrame(f(40)); // E2
  assert.strictEqual(e2.pitchClass, 4);
  assert.strictEqual(e2.midi, 40);
  assert.strictEqual(C.analyzeFrame(-1), null);
  assert.strictEqual(C.analyzeFrame(0), null);
});

// ── Distinzione ottava in modalità 'exact' ─────────────────────────────────
test("'exact' distingue l'ottava: E3 richiesto → E2 rifiutato, E3 accettato", () => {
  // atteso E3 (midi 52). Nota stabile ma sbagliata → resta in ascolto fino al timeout.
  const cfgBase = { expected: { name: 'E', octave: 3 }, mode: 'exact', startTime: 1000, stableFrames: 3, window: 400 };
  const wrongOct = run(C.createSession(Object.assign({}, cfgBase)), [SIL(1000), ...steady(f(40), 6, 1100), SIL(1500)]); // E2 poi timeout
  assert.strictEqual(wrongOct.ok, false, 'ottava sbagliata deve fallire in exact');
  const right = run(C.createSession(Object.assign({}, cfgBase)), [SIL(1000), ...steady(f(52), 6, 1100)]); // E3
  assert.strictEqual(right.ok, true, 'ottava giusta deve passare');
  assert.strictEqual(right.playedPitchClass, 4);
});

// ── Qualsiasi ottava in modalità 'pitchClass' ──────────────────────────────
test("'pitchClass' accetta qualsiasi ottava (E2 vale per pc E)", () => {
  const s = C.createSession({ expected: { pitchClass: 4, octave: 4 }, mode: 'pitchClass', startTime: 1000, stableFrames: 3 });
  const r = run(s, [SIL(1000), ...steady(f(40), 6, 1100)]); // E2, ottava diversa
  assert.strictEqual(r.ok, true, 'pitch-class deve accettare qualsiasi ottava');
  assert.strictEqual(r.playedPitchClass, 4);
});

// ── Rifiuto armonici spuri / finestra di stabilità ─────────────────────────
test('rifiuta glitch isolati: pochi frame sotto la soglia di stabilità non confermano', () => {
  // 2 frame corretti (< stableFrames=3) poi silenzio → nessuna conferma; timeout → ok:false
  const s = C.createSession({ expected: { pitchClass: 4 }, mode: 'pitchClass', startTime: 1000, stableFrames: 3, window: 500 });
  const r = run(s, [SIL(1000), { freq: f(40), t: 1050 }, { freq: f(40), t: 1070 }, SIL(1090), SIL(1600)]);
  assert.strictEqual(r.ok, false, '2 frame + silenzio non bastano');
});

test('rifiuta armonico spurio con pitch-class sbagliato anche se stabile', () => {
  // atteso E (pc4); l'utente/armonico produce un B stabile (pc11) → non deve passare
  const s = C.createSession({ expected: { pitchClass: 4 }, mode: 'pitchClass', startTime: 1000, stableFrames: 3, window: 400 });
  const r = run(s, [SIL(1000), ...steady(f(47), 8, 1050), SIL(1450)]); // B2 (pc11) stabile
  assert.strictEqual(r.ok, false, 'pitch-class errato non deve confermare');
});

test('glitch di 1 frame in mezzo al segnale giusto non impedisce la conferma', () => {
  // sequenza: E, E, (glitch B), E, E, E → il consenso modale resta su E → conferma
  const s = C.createSession({ expected: { pitchClass: 4 }, mode: 'pitchClass', startTime: 1000, stableFrames: 3 });
  const frames = [SIL(1000), { freq: f(40), t: 1050 }, { freq: f(40), t: 1070 }, { freq: f(47), t: 1090 },
    { freq: f(40), t: 1110 }, { freq: f(40), t: 1130 }, { freq: f(40), t: 1150 }];
  const r = run(s, frames);
  assert.strictEqual(r.ok, true, 'un glitch isolato non deve bloccare il consenso');
});

// ── Soglia in cent configurabile ────────────────────────────────────────────
test('soglia in cent: entro tolleranza passa, oltre no', () => {
  const target = 52; // E3
  const within = run(C.createSession({ expected: { name: 'E', octave: 3 }, mode: 'exact', startTime: 1000, stableFrames: 3, centsTol: 40 }),
    [SIL(1000), ...steady(C.midiToFreq(target + 0.30), 5, 1100)]); // +30 cent
  assert.strictEqual(within.ok, true, '+30 cent entro tol 40 → ok');
  const beyond = run(C.createSession({ expected: { name: 'E', octave: 3 }, mode: 'exact', startTime: 1000, stableFrames: 3, centsTol: 20, window: 400 }),
    [SIL(1000), ...steady(C.midiToFreq(target + 0.30), 5, 1100), SIL(1500)]); // +30 cent, tol 20, poi timeout
  assert.strictEqual(beyond.ok, false, '+30 cent oltre tol 20 → rifiutato');
});

// ── latencyMs plausibile (misurata dall'onset) ─────────────────────────────
test('latencyMs plausibile: misurata dal primo attacco dopo il silenzio', () => {
  // start 1000, silenzio fino a 1300, attacco a 1300 → latenza ≈ 300ms
  const s = C.createSession({ expected: { pitchClass: 4 }, mode: 'pitchClass', startTime: 1000, stableFrames: 3 });
  const frames = [SIL(1000), SIL(1150), SIL(1290), ...steady(f(40), 5, 1300)];
  const r = run(s, frames);
  assert.strictEqual(r.ok, true);
  assert.ok(r.latencyMs >= 280 && r.latencyMs <= 320, 'latenza ~300ms, ottenuta ' + r.latencyMs);
});

// ── Drill 7: gating sul downbeat ────────────────────────────────────────────
test("downbeat: nota giusta DENTRO la finestra → ok", () => {
  const s = C.createSession({ expected: { pitchClass: 4 }, mode: 'downbeat', startTime: 4800, downbeatAt: 5000, window: 150, stableFrames: 3 });
  const r = run(s, [SIL(4800), ...steady(f(40), 5, 4950, 20)]); // attorno a 5000
  assert.strictEqual(r.ok, true, 'nota giusta sul beat deve passare');
});

test("downbeat: nota giusta FUORI dalla finestra → non validata (miss)", () => {
  const s = C.createSession({ expected: { pitchClass: 4 }, mode: 'downbeat', startTime: 4800, downbeatAt: 5000, window: 150, stableFrames: 3 });
  // frame corretti ma tutti dopo la finestra (t>5150); alla chiusura → ok:false
  const r = run(s, [SIL(4800), ...steady(f(40), 6, 5200, 20)]);
  assert.strictEqual(r.ok, false, 'fuori finestra non deve validare');
});

test("downbeat: nota sbagliata sul beat → miss", () => {
  const s = C.createSession({ expected: { pitchClass: 4 }, mode: 'downbeat', startTime: 4800, downbeatAt: 5000, window: 150, stableFrames: 3 });
  const r = run(s, [SIL(4800), ...steady(f(47), 5, 4950, 20)]); // B invece di E, sul beat
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.playedPitchClass, 11);
});

// ── Timeout senza suono ────────────────────────────────────────────────────
test('timeout senza suono → ok:false, latencyMs null', () => {
  const s = C.createSession({ expected: { pitchClass: 4 }, mode: 'pitchClass', startTime: 1000, window: 300 });
  const r = run(s, [SIL(1000), SIL(1200), SIL(1400)]);
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.latencyMs, null);
});

// ── matchFrame diretto ─────────────────────────────────────────────────────
test('matchFrame: byOctave segnalato in pitch-class quando cambia ottava', () => {
  const frame = C.analyzeFrame(f(40)); // E2
  const m = C.matchFrame(frame, { pitchClass: 4, octave: 4 }, 'pitchClass', { centsTol: 40 });
  assert.strictEqual(m.match, true);
  assert.strictEqual(m.byOctave, true, 'E2 vs E4 richiesto → match per pitch-class ma ottava diversa');
});

console.log(`\n${passed} test superati\n`);
