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

  function envelope(songs) {
    const norm = songs.map(normalizeSong);
    return { schemaVersion: SCHEMA_VERSION, songs: norm, setlist: buildSetlist(norm), updatedAt: Date.now() };
  }

  // Scrive SOLO gil_songs_v2 — gil_songs_v1 non viene mai toccata né cancellata.
  function save(storage, songs) {
    storage.setItem(KEY_V2, JSON.stringify(envelope(songs || [])));
  }

  function parseSongsPayload(raw) {
    const data = JSON.parse(raw);
    if (Array.isArray(data)) return data;                          // array nudo (v1 o export)
    if (isPlainObject(data) && Array.isArray(data.songs)) return data.songs; // envelope v2
    return null;
  }

  // load: v2 se presente e valido; altrimenti migra v1 (scrivendo v2, v1 intatta);
  // altrimenti { songs:null } → il chiamante fa il seed. Tollerante al corrotto.
  function load(storage) {
    let rawV2 = null;
    try { rawV2 = storage.getItem(KEY_V2); } catch (e) {}
    if (rawV2 !== null) {
      try {
        const arr = parseSongsPayload(rawV2);
        if (arr) return { songs: arr.map(normalizeSong), source: 'v2', migrated: false };
      } catch (e) { /* v2 corrotto → si ritenta da v1, senza distruggere nulla */ }
    }
    let rawV1 = null;
    try { rawV1 = storage.getItem(KEY_V1); } catch (e) {}
    if (rawV1 !== null) {
      let v1 = [];
      try { v1 = JSON.parse(rawV1); } catch (e) { v1 = []; }
      if (!Array.isArray(v1)) v1 = [];
      const songs = v1.map(normalizeSong);
      try { save(storage, songs); } catch (e) {}   // scrive v2; v1 resta com'è (rollback)
      return { songs: songs, source: 'v1', migrated: true };
    }
    return { songs: null, source: 'none', migrated: false };
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
