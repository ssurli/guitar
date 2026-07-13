/* ============================================================================
 * SonglabStore — persistenza versionata della setlist (Agente D, pacchetto UX).
 * Contratto congelato (docs/ux/00-contratti-dati.md):
 *   Song    = { id, title, artist, sections[] (INTATTI) +
 *               set (1|2|'bis'), order, status ('rodata'|'da_rivedere'|'nuova'),
 *               notes, launch: { fretboardKey, suggestedScales[], backingPreset,
 *                               cagedFocus } | null }
 *   Setlist = { sets: { 1:[songId], 2:[songId], bis:[songId] }, version }
 * Migrazione gil_songs_v1 → gil_songs_v2: al load, se v2 assente e v1 presente,
 * copia le canzoni aggiungendo i campi opzionali con default (set:null,
 * order:indice, status:'nuova', notes:'', launch:null), scrive v2 e NON cancella
 * mai v1 (rollback possibile). Idempotente: dal secondo load in poi legge v2.
 * UMD come gli altri moduli js/ (global browser + CommonJS per i test node).
 * ==========================================================================*/
(function (root, factory) {
  'use strict';
  const mod = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = mod;
  if (root) root.SonglabStore = mod;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const KEY_V1 = 'gil_songs_v1';
  const KEY_V2 = 'gil_songs_v2';
  const SCHEMA_VERSION = 2;
  const SET_VALUES = [1, 2, 'bis'];
  const STATUS_VALUES = ['rodata', 'da_rivedere', 'nuova'];
  const CAGED_SHAPES = ['C', 'A', 'G', 'E', 'D'];

  function isPlainObject(o) { return !!o && typeof o === 'object' && !Array.isArray(o); }

  // launch opzionale: valida i campi senza inventarne (default: null)
  function normalizeLaunch(l) {
    if (!isPlainObject(l)) return null;
    const out = { fretboardKey: null, suggestedScales: [], backingPreset: null, cagedFocus: null };
    if (typeof l.fretboardKey === 'number' && isFinite(l.fretboardKey)) {
      const k = Math.round(l.fretboardKey);
      if (k >= 0 && k < 12) out.fretboardKey = k;
    }
    if (Array.isArray(l.suggestedScales)) {
      out.suggestedScales = l.suggestedScales.filter(function (s) { return typeof s === 'string' && s; });
    }
    if (isPlainObject(l.backingPreset)) {
      const bp = {};
      if (typeof l.backingPreset.style === 'string' && l.backingPreset.style) bp.style = l.backingPreset.style;
      if (typeof l.backingPreset.mode === 'string' && l.backingPreset.mode) bp.mode = l.backingPreset.mode;
      const bpm = parseInt(l.backingPreset.bpm, 10);
      if (isFinite(bpm) && bpm >= 40 && bpm <= 200) bp.bpm = bpm;
      out.backingPreset = Object.keys(bp).length ? bp : null;
    }
    if (typeof l.cagedFocus === 'string' && CAGED_SHAPES.indexOf(l.cagedFocus.toUpperCase()) !== -1) {
      out.cagedFocus = l.cagedFocus.toUpperCase();
    }
    return out;
  }

  // Song v1/v2 → Song v2. I campi esistenti (id, title, artist, sections)
  // sopravvivono invariati; i campi nuovi opzionali ricevono i default del
  // contratto quando assenti o non validi. Idempotente.
  function normalizeSong(s, index) {
    s = isPlainObject(s) ? s : {};
    const sections = Array.isArray(s.sections) ? s.sections.map(function (sec) {
      sec = isPlainObject(sec) ? sec : {};
      return { name: String(sec.name != null ? sec.name : 'Sezione'), chords: String(sec.chords != null ? sec.chords : '') };
    }) : [];
    return {
      id: typeof s.id === 'string' && s.id ? s.id : ('s' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)),
      title: String(s.title != null ? s.title : 'senza titolo'),
      artist: String(s.artist != null ? s.artist : ''),
      sections: sections,
      set: SET_VALUES.indexOf(s.set) !== -1 ? s.set : null,
      order: (typeof s.order === 'number' && isFinite(s.order)) ? s.order : (index || 0),
      status: STATUS_VALUES.indexOf(s.status) !== -1 ? s.status : 'nuova',
      notes: typeof s.notes === 'string' ? s.notes : '',
      launch: normalizeLaunch(s.launch),
    };
  }

  // Setlist derivata dai campi set/order delle Song (sorgente di verità unica,
  // rigenerata a ogni save: nessuna divergenza possibile).
  function buildSetlist(songs) {
    const sets = { 1: [], 2: [], bis: [] };
    SET_VALUES.forEach(function (v) {
      const key = String(v);
      sets[key] = songs
        .filter(function (s) { return s.set === v; })
        .sort(function (a, b) { return (a.order || 0) - (b.order || 0); })
        .map(function (s) { return s.id; });
    });
    return { sets: sets, version: SCHEMA_VERSION };
  }

  // importedV1Ids = "ledger" degli id di canzoni arrivati dal canale v1 (ponte
  // chordlab/guitarzorn) e GIÀ importati almeno una volta. Serve a due cose:
  //  1) non duplicare a ogni load una canzone già portata dentro;
  //  2) non "resuscitare" una canzone che l'utente ha poi cancellato in-app.
  function envelope(songs, importedV1Ids) {
    const norm = songs.map(normalizeSong);
    return { schemaVersion: SCHEMA_VERSION, songs: norm, setlist: buildSetlist(norm),
             importedV1Ids: Array.isArray(importedV1Ids) ? importedV1Ids.slice() : [],
             updatedAt: Date.now() };
  }

  // Legge il ledger dal v2 salvato (per preservarlo quando save è chiamato senza).
  function readImportedIds(storage) {
    try {
      const raw = storage.getItem(KEY_V2);
      if (raw) { const d = JSON.parse(raw); if (isPlainObject(d) && Array.isArray(d.importedV1Ids)) return d.importedV1Ids; }
    } catch (e) {}
    return [];
  }

  // Scrive SOLO gil_songs_v2 — gil_songs_v1 non viene mai toccata né cancellata.
  // Se importedV1Ids non è passato (salvataggio da mutazione in-app), preserva il
  // ledger già presente in v2: gli edit in-app non devono azzerarlo.
  function save(storage, songs, importedV1Ids) {
    const ids = (importedV1Ids !== undefined) ? importedV1Ids : readImportedIds(storage);
    storage.setItem(KEY_V2, JSON.stringify(envelope(songs || [], ids)));
  }

  function parseSongsPayload(raw) {
    const data = JSON.parse(raw);
    if (Array.isArray(data)) return data;                          // array nudo (v1 o export)
    if (isPlainObject(data) && Array.isArray(data.songs)) return data.songs; // envelope v2
    return null;
  }

  // Legge le canzoni dal canale v1 (ponte). v1 è INBOUND: stesso origine di
  // guitarzorn, che ci scrive la playlist di chordlab. Mai cancellato da noi.
  function readV1(storage) {
    let raw = null;
    try { raw = storage.getItem(KEY_V1); } catch (e) {}
    if (raw === null) return { present: false, songs: [] };
    let arr = [];
    try { arr = JSON.parse(raw); } catch (e) { arr = []; }
    if (!Array.isArray(arr)) arr = [];
    return { present: true, songs: arr.map(normalizeSong) };
  }

  // load:
  //  • v2 valido → è lo store di lavoro; ci FONDIAMO le canzoni NUOVE di v1 (id
  //    mai visto e non nel ledger), senza toccare quelle esistenti (merge non
  //    distruttivo). Scrive v2 solo se ha aggiunto qualcosa.
  //  • niente v2 → se c'è v1, MIGRA tutta v1 (che diventa il ledger); v1 intatta.
  //  • niente v2 né v1 → { songs:null } → il chiamante fa il seed.
  // Tollerante al corrotto: un v2 illeggibile ricade sulla migrazione da v1.
  function load(storage) {
    const v1 = readV1(storage);

    let rawV2 = null;
    try { rawV2 = storage.getItem(KEY_V2); } catch (e) {}
    if (rawV2 !== null) {
      try {
        const arr = parseSongsPayload(rawV2);
        if (arr) {
          const songs = arr.map(normalizeSong);
          const data = JSON.parse(rawV2);
          const imported = (isPlainObject(data) && Array.isArray(data.importedV1Ids)) ? data.importedV1Ids.slice() : [];
          const known = {};
          songs.forEach(function (s) { known[s.id] = true; });
          imported.forEach(function (id) { known[id] = true; });
          let added = 0;
          v1.songs.forEach(function (s) {
            if (!known[s.id]) { songs.push(s); imported.push(s.id); known[s.id] = true; added++; }
          });
          if (added) { try { save(storage, songs, imported); } catch (e) {} }
          return { songs: songs, source: 'v2', migrated: false, importedNew: added };
        }
      } catch (e) { /* v2 corrotto → si ritenta da v1, senza distruggere nulla */ }
    }

    if (v1.present) {
      const imported = v1.songs.map(function (s) { return s.id; });
      try { save(storage, v1.songs, imported); } catch (e) {}   // scrive v2; v1 resta com'è (rollback)
      return { songs: v1.songs, source: 'v1', migrated: true, importedNew: v1.songs.length };
    }
    return { songs: null, source: 'none', migrated: false, importedNew: 0 };
  }

  return {
    KEY_V1: KEY_V1,
    KEY_V2: KEY_V2,
    SCHEMA_VERSION: SCHEMA_VERSION,
    SET_VALUES: SET_VALUES,
    STATUS_VALUES: STATUS_VALUES,
    normalizeLaunch: normalizeLaunch,
    normalizeSong: normalizeSong,
    buildSetlist: buildSetlist,
    load: load,
    save: save,
  };
});
