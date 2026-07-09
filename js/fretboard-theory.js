/* ============================================================================
 * FretboardTheory — Fonte di verità (corda,tasto) ⇄ (nota,classe altezza,freq)
 *                   ⇄ (grado in tonalità/modo). Agente B.
 *
 * Funzioni PURE, zero stato, zero DOM. Enarmonia coerente con la tonalità.
 *
 * CONTRATTI DATI (rispettati alla lettera):
 *   Note        = { string, fret, name, pitchClass, octave, midi, freq }
 *   MasteryCell = { string, fret, level(0-4), lastSeen, box }   (helper factory)
 *
 * Convenzione corde: string 0 = mi cantino (E4) … string 5 = MI basso (E2),
 * identica al rendering di index.html (OPEN_STRING_MIDI = [64,59,55,50,45,40]).
 *
 * Accordatura: NON reinventata. Le tabelle TUNINGS rispecchiano i TUNER_PRESETS
 * già configurati in index.html (standard + alternative), in ordine alto→basso.
 * ==========================================================================*/
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FretboardTheory = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const MAJOR_REF = [0, 2, 4, 5, 7, 9, 11]; // intervalli della scala maggiore (riferimento gradi)

  // Modi heptatonici (7 modi richiesti) + qualche estensione utile.
  const MODE_INTERVALS = {
    ionian: [0, 2, 4, 5, 7, 9, 11], dorian: [0, 2, 3, 5, 7, 9, 10], phrygian: [0, 1, 3, 5, 7, 8, 10],
    lydian: [0, 2, 4, 6, 7, 9, 11], mixolydian: [0, 2, 4, 5, 7, 9, 10], aeolian: [0, 2, 3, 5, 7, 8, 10],
    locrian: [0, 1, 3, 5, 6, 8, 10],
    major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], // alias comodi
  };

  // Accordature (open-string MIDI, ordine alto→basso). Rispecchia TUNER_PRESETS.
  const TUNINGS = {
    standard: [64, 59, 55, 50, 45, 40], // e B G D A E
    drop_d: [64, 59, 55, 50, 45, 38],   // e B G D A D
    dadgad: [62, 57, 55, 50, 45, 38],   // d A G D A D
    open_g: [62, 59, 55, 50, 43, 38],   // d B G D G D
    open_d: [62, 57, 54, 50, 45, 38],   // d A F# D A D
    open_e: [64, 59, 56, 52, 47, 40],   // e B G# E B E
    open_a: [64, 61, 57, 52, 45, 40],   // e C# A E A E
    drop_c: [62, 57, 53, 48, 43, 36],   // d A F C G C
  };
  const DEFAULT_MAX_FRET = 22;
  const A_REF = 440;

  const mod12 = (n) => ((n % 12) + 12) % 12;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // ── util: parsing nome nota → {letter, acc, pc} ────────────────────────────
  function parseNoteName(str) {
    const letter = str[0].toUpperCase();
    let acc = 0;
    for (let i = 1; i < str.length; i++) {
      const ch = str[i];
      if (ch === '#' || ch === '♯') acc++;
      else if (ch === 'b' || ch === 'B' || ch === '♭') acc--;
    }
    return { letter, acc, pc: mod12((LETTER_PC[letter] || 0) + acc) };
  }
  // La tonalità può essere una stringa ('F#','Bb','A') o una classe d'altezza numerica.
  function parseKey(key) {
    if (typeof key === 'number') { const pc = mod12(key); const n = SHARP_NAMES[pc]; return parseNoteName(n); }
    return parseNoteName(String(key));
  }
  function accStr(n) { if (!n) return ''; return (n > 0 ? '#' : 'b').repeat(Math.abs(n)); }

  // ── Spelling diatonico della scala del modo (enarmonia corretta) ───────────
  // Ritorna 7 voci: { degreeNum, degree, letter, acc, name, pitchClass, interval }
  function spellScale(key, mode) {
    const k = parseKey(key);
    const intervals = MODE_INTERVALS[mode] || MODE_INTERVALS.ionian;
    const tonicLetterIdx = LETTERS.indexOf(k.letter);
    const out = [];
    for (let i = 0; i < intervals.length; i++) {
      const targetPc = mod12(k.pc + intervals[i]);
      const letter = LETTERS[(tonicLetterIdx + i) % 7];
      const natural = LETTER_PC[letter];
      let acc = mod12(targetPc - natural);
      if (acc > 6) acc -= 12;                       // scegli l'alterazione più corta (−2..+2)
      const alt = intervals[i] - MAJOR_REF[i % 7];  // alterazione del grado vs scala maggiore
      out.push({
        degreeNum: i + 1, degree: accStr(alt) + (i + 1),
        letter, acc, name: letter + accStr(acc),
        pitchClass: targetPc, interval: intervals[i],
      });
    }
    return out;
  }

  // ── Nome nota enarmonico per una classe d'altezza in una tonalità ──────────
  function spellPitchClass(pitchClass, key, mode) {
    const pc = mod12(pitchClass);
    if (key != null) {
      const scale = spellScale(key, mode || 'ionian');
      const hit = scale.find((s) => s.pitchClass === pc);
      if (hit) return hit.name;                     // tono della scala → spelling diatonico
      // cromatico: segui la tendenza (diesis/bemolle) della tonalità
      const k = parseKey(key);
      return (k.acc < 0 ? FLAT_NAMES : SHARP_NAMES)[pc];
    }
    return SHARP_NAMES[pc];
  }

  // ── (1) noteAt(string, fret[, opts]) → Note ────────────────────────────────
  // opts: { key, mode, tuning, aRef }. Senza key → spelling con diesis (default app).
  function noteAt(string, fret, opts) {
    opts = opts || {};
    const tuning = opts.tuning ? (Array.isArray(opts.tuning) ? opts.tuning : TUNINGS[opts.tuning] || TUNINGS.standard) : TUNINGS.standard;
    const aRef = opts.aRef || A_REF;
    const midi = tuning[string] + fret;
    const pitchClass = mod12(midi);
    return {
      string, fret,
      name: spellPitchClass(pitchClass, opts.key != null ? opts.key : null, opts.mode),
      pitchClass, octave: Math.floor(midi / 12) - 1, midi,
      freq: aRef * Math.pow(2, (midi - 69) / 12),
    };
  }

  // ── (2) degreeOf(pitchClass, key, mode) → { degree, isChordTone, role } ─────
  const CHROMATIC_DEG = { 0: '1', 1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4', 6: 'b5', 7: '5', 8: 'b6', 9: '6', 10: 'b7', 11: '7' };
  const ROLE_BY_DEG = { 1: 'root', 2: 'ninth', 3: 'third', 4: 'eleventh', 5: 'fifth', 6: 'thirteenth', 7: 'seventh' };
  function degreeOf(pitchClass, key, mode) {
    const pc = mod12(pitchClass);
    const k = parseKey(key);
    const scale = spellScale(key, mode || 'ionian');
    const hit = scale.find((s) => s.pitchClass === pc);
    if (hit) {
      const isChordTone = hit.degreeNum === 1 || hit.degreeNum === 3 || hit.degreeNum === 5 || hit.degreeNum === 7;
      return { degree: hit.degree, isChordTone, role: ROLE_BY_DEG[hit.degreeNum] };
    }
    // nota cromatica (fuori scala): etichetta chromatica, non chord-tone
    return { degree: CHROMATIC_DEG[mod12(pc - k.pc)], isChordTone: false, role: 'chromatic' };
  }

  // ── (3) Ancora-e-deriva ────────────────────────────────────────────────────
  // Tutte le posizioni (corda,tasto) di una classe d'altezza sul manico.
  function octaveShapes(pitchClass, opts) {
    opts = opts || {};
    const tuning = opts.tuning ? (Array.isArray(opts.tuning) ? opts.tuning : TUNINGS[opts.tuning] || TUNINGS.standard) : TUNINGS.standard;
    const maxFret = opts.maxFret != null ? opts.maxFret : DEFAULT_MAX_FRET;
    const pc = mod12(pitchClass);
    const out = [];
    for (let s = 0; s < tuning.length; s++) {
      for (let f = 0; f <= maxFret; f++) {
        if (mod12(tuning[s] + f) === pc) out.push({ string: s, fret: f });
      }
    }
    return out;
  }
  // Da un'ancora (posizione) deriva la posizione a `interval` semitoni sopra.
  // Preferisce la posizione più vicina alla mano (economia di movimento).
  function deriveFrom(anchor, interval, opts) {
    opts = opts || {};
    const tuning = opts.tuning ? (Array.isArray(opts.tuning) ? opts.tuning : TUNINGS[opts.tuning] || TUNINGS.standard) : TUNINGS.standard;
    const maxFret = opts.maxFret != null ? opts.maxFret : DEFAULT_MAX_FRET;
    const anchorMidi = tuning[anchor.string] + anchor.fret;
    const targetMidi = anchorMidi + interval;
    // candidati con l'ottava esatta del target
    let cands = [];
    for (let s = 0; s < tuning.length; s++) {
      const f = targetMidi - tuning[s];
      if (f >= 0 && f <= maxFret) cands.push({ string: s, fret: f });
    }
    // fuori range → ripiega sulla classe d'altezza (qualsiasi ottava)
    if (!cands.length) cands = octaveShapes(mod12(targetMidi), { tuning, maxFret });
    if (!cands.length) return null;
    // più vicino alla mano: minimizza distanza tasto + (cambio corda pesato)
    let best = cands[0], bestCost = Infinity;
    for (const c of cands) {
      const cost = Math.abs(c.fret - anchor.fret) + Math.abs(c.string - anchor.string) * 1.5;
      if (cost < bestCost) { bestCost = cost; best = c; }
    }
    return { string: best.string, fret: best.fret };
  }

  // ── (4) Ponte verso lo YIN: freq → classe d'altezza con tolleranza in cent ─
  function pitchClassFromFreq(freq, opts) {
    opts = opts || {};
    const aRef = opts.aRef || A_REF;
    if (!freq || freq <= 0) return null;
    const midiFloat = 12 * Math.log2(freq / aRef) + 69;
    const midi = Math.round(midiFloat);
    const cents = Math.round((midiFloat - midi) * 100);
    const pitchClass = mod12(midi);
    const res = { pitchClass, cents, midi, name: SHARP_NAMES[pitchClass] };
    if (opts.toleranceCents != null) res.inTolerance = Math.abs(cents) <= opts.toleranceCents;
    return res;
  }

  // ── Helper factory MasteryCell (contratto) ─────────────────────────────────
  function masteryCell(string, fret, extra) {
    return Object.assign({ string, fret, level: 0, lastSeen: 0, box: 1 }, extra || {});
  }

  return {
    // costanti/dati
    TUNINGS, MODE_INTERVALS, SHARP_NAMES, FLAT_NAMES,
    // API richieste
    noteAt, degreeOf, octaveShapes, deriveFrom, pitchClassFromFreq,
    // supporto enarmonico / round-trip
    spellScale, spellPitchClass, parseKey, parseNoteName,
    // factory contratto
    masteryCell,
  };
}));
