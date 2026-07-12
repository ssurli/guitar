/* Test migrazione setlist gil_songs_v1 → gil_songs_v2 (Agente D, pacchetto UX).
 * Criteri di accettazione (docs/ux/00-contratti-dati.md + PIANO_INTEGRAZIONE.md):
 *   - ogni canzone v1 sopravvive INVARIATA nei campi esistenti (id/title/artist/sections)
 *   - i campi nuovi opzionali ricevono i default: set:null, order:indice,
 *     status:'nuova', notes:'', launch:null
 *   - gil_songs_v1 non viene MAI cancellata né modificata (rollback possibile)
 *   - migrazione idempotente: dal secondo load si legge v2
 *   - payload corrotti non distruggono nulla
 *   - un file v1 importato "migra al volo" (normalizeSong)
 * Esecuzione: node test/songlab-migration.test.js
 */
'use strict';
const assert = require('node:assert');
const Store = require('../js/songlab-store.js');

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ✓ ' + name); }
  catch (e) { console.error('  ✗ ' + name + '\n    ' + e.message); process.exitCode = 1; }
}
function memStorage() {
  const m = {};
  return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; }, _dump: () => m };
}

// Payload v1 REALE: stessa forma del seed di index.html (songlabSeed, array nudo
// senza schemaVersion) + una canzone utente con caratteri non banali.
const V1_PAYLOAD = [
  {
    id: 'demo-blues-a',
    title: 'Esempio · Blues in A',
    artist: 'demo — modificami o cancellami',
    sections: [
      { name: 'Intro', chords: 'E7♯9:2' },
      { name: 'Strofa', chords: 'A7:4 D9:2 A7:2' },
      { name: 'Ritornello', chords: 'E7 D9 A7 E7♯9' },
    ],
  },
  {
    id: 'sm3x7abcd',
    title: "Sultans of Swing (l'originale)",
    artist: 'Dire Straits',
    sections: [{ name: 'Strofa', chords: 'Dm:2 C:1 B♭:1 A7:2' }],
  },
];

console.log('\nSONGLAB store — migrazione v1 → v2\n');

test('migrazione: v2 assente + v1 presente → canzoni copiate coi default del contratto', () => {
  const st = memStorage();
  st.setItem(Store.KEY_V1, JSON.stringify(V1_PAYLOAD));
  const res = Store.load(st);
  assert.strictEqual(res.source, 'v1');
  assert.strictEqual(res.migrated, true);
  assert.strictEqual(res.songs.length, 2);
  res.songs.forEach((s, i) => {
    // campi esistenti invariati
    assert.strictEqual(s.id, V1_PAYLOAD[i].id);
    assert.strictEqual(s.title, V1_PAYLOAD[i].title);
    assert.strictEqual(s.artist, V1_PAYLOAD[i].artist);
    assert.deepStrictEqual(s.sections, V1_PAYLOAD[i].sections);
    // default dei campi nuovi (contratto, riga 52-55)
    assert.strictEqual(s.set, null, 'set default null');
    assert.strictEqual(s.order, i, 'order = indice');
    assert.strictEqual(s.status, 'nuova');
    assert.strictEqual(s.notes, '');
    assert.strictEqual(s.launch, null);
  });
});

test('migrazione: v2 scritta, v1 MAI cancellata né modificata', () => {
  const st = memStorage();
  const rawV1 = JSON.stringify(V1_PAYLOAD);
  st.setItem(Store.KEY_V1, rawV1);
  Store.load(st);
  assert.strictEqual(st.getItem(Store.KEY_V1), rawV1, 'v1 byte-identica');
  const v2 = JSON.parse(st.getItem(Store.KEY_V2));
  assert.strictEqual(v2.schemaVersion, 2);
  assert.strictEqual(v2.songs.length, 2);
  assert.deepStrictEqual(v2.setlist, { sets: { 1: [], 2: [], bis: [] }, version: 2 });
});

test('idempotenza: il secondo load legge v2 e non ricambia nulla', () => {
  const st = memStorage();
  st.setItem(Store.KEY_V1, JSON.stringify(V1_PAYLOAD));
  const first = Store.load(st);
  const v2raw = st.getItem(Store.KEY_V2);
  const second = Store.load(st);
  assert.strictEqual(second.source, 'v2');
  assert.strictEqual(second.migrated, false);
  assert.deepStrictEqual(second.songs, first.songs);
  assert.strictEqual(st.getItem(Store.KEY_V2), v2raw, 'v2 non riscritta dal load');
});

test('v2 presente vince su v1 (v1 ignorata dopo la migrazione)', () => {
  const st = memStorage();
  st.setItem(Store.KEY_V1, JSON.stringify(V1_PAYLOAD));
  Store.save(st, [{ id: 'x1', title: 'Solo v2', artist: '', sections: [] }]);
  const res = Store.load(st);
  assert.strictEqual(res.source, 'v2');
  assert.strictEqual(res.songs.length, 1);
  assert.strictEqual(res.songs[0].title, 'Solo v2');
});

test('v1 corrotta → nessun crash, nessuna perdita (v1 resta per il rollback)', () => {
  const st = memStorage();
  st.setItem(Store.KEY_V1, '{non-json!!');
  const res = Store.load(st);
  assert.deepStrictEqual(res.songs, []);
  assert.strictEqual(st.getItem(Store.KEY_V1), '{non-json!!');
});

test('v2 corrotta → si recupera da v1 senza toccarla', () => {
  const st = memStorage();
  st.setItem(Store.KEY_V1, JSON.stringify(V1_PAYLOAD));
  st.setItem(Store.KEY_V2, 'BOOM');
  const res = Store.load(st);
  assert.strictEqual(res.source, 'v1');
  assert.strictEqual(res.songs.length, 2);
  assert.strictEqual(st.getItem(Store.KEY_V1), JSON.stringify(V1_PAYLOAD));
});

test('storage vuoto → songs:null (il chiamante fa il seed), niente scritture', () => {
  const st = memStorage();
  const res = Store.load(st);
  assert.strictEqual(res.songs, null);
  assert.strictEqual(res.source, 'none');
  assert.strictEqual(st.getItem(Store.KEY_V2), null);
});

test('normalizeSong: campi v2 validi conservati, non validi → default (import v1 al volo)', () => {
  const ok = Store.normalizeSong({
    id: 'k1', title: 'T', artist: 'A', sections: [{ name: 'S', chords: 'Am7:2' }],
    set: 2, order: 7, status: 'rodata', notes: 'capo II',
    launch: { fretboardKey: 9, suggestedScales: ['dorian', 42], backingPreset: { style: 'rock', bpm: 132 }, cagedFocus: 'e' },
  }, 0);
  assert.strictEqual(ok.set, 2);
  assert.strictEqual(ok.order, 7);
  assert.strictEqual(ok.status, 'rodata');
  assert.strictEqual(ok.notes, 'capo II');
  assert.strictEqual(ok.launch.fretboardKey, 9);
  assert.deepStrictEqual(ok.launch.suggestedScales, ['dorian'], 'scarta i non-string');
  assert.deepStrictEqual(ok.launch.backingPreset, { style: 'rock', bpm: 132 });
  assert.strictEqual(ok.launch.cagedFocus, 'E', 'shape normalizzata maiuscola');

  const bad = Store.normalizeSong({ id: 'k2', title: 'X', sections: [], set: 5, status: 'boh', order: 'z', launch: { fretboardKey: 99, cagedFocus: 'Z' } }, 3);
  assert.strictEqual(bad.set, null);
  assert.strictEqual(bad.status, 'nuova');
  assert.strictEqual(bad.order, 3);
  assert.strictEqual(bad.launch.fretboardKey, null);
  assert.strictEqual(bad.launch.cagedFocus, null);
});

test('buildSetlist: raggruppa per set e ordina per order (contratto Setlist)', () => {
  const songs = [
    { id: 'a', set: 1, order: 1 }, { id: 'b', set: 1, order: 0 },
    { id: 'c', set: 'bis', order: 0 }, { id: 'd', set: null, order: 0 },
    { id: 'e', set: 2, order: 0 },
  ].map((s, i) => Store.normalizeSong(Object.assign({ title: s.id, sections: [] }, s), i));
  const sl = Store.buildSetlist(songs);
  assert.deepStrictEqual(sl.sets['1'], ['b', 'a']);
  assert.deepStrictEqual(sl.sets['2'], ['e']);
  assert.deepStrictEqual(sl.sets['bis'], ['c']);
  assert.strictEqual(sl.version, 2);
});

test('roundtrip save→load: i campi launch/set/status/notes sopravvivono al refresh', () => {
  const st = memStorage();
  const song = Store.normalizeSong({
    id: 'rt1', title: 'Round Trip', artist: 'Band', sections: [{ name: 'A', chords: 'C G Am F' }],
    set: 'bis', order: 4, status: 'da_rivedere', notes: 'accordatura drop D',
    launch: { fretboardKey: 2, suggestedScales: ['natural_minor'], backingPreset: { style: 'ballad', bpm: 72, mode: 'natural_minor' }, cagedFocus: 'A' },
  }, 0);
  Store.save(st, [song]);
  const back = Store.load(st);
  assert.strictEqual(back.source, 'v2');
  assert.deepStrictEqual(back.songs[0], song);
});

console.log('\n' + passed + ' test superati');
