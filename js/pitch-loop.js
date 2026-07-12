/* ============================================================================
 * PitchLoop — Loop di verifica con pitch detection. Agente C. Espone FC.pitch.
 *
 * Chiude il loop "l'app chiede → l'utente suona → verifica" riusando lo YIN
 * ESISTENTE (autocorrelate) con UNA sola analisi audio condivisa.
 *
 * Architettura:
 *   - CORE PURO (testabile in Node): analyzeFrame / matchFrame / createSession.
 *     Consuma frame { freq, t } già prodotti dal loop condiviso → niente doppia
 *     analisi. Gestisce onset, finestra di stabilità (N frame concordi), soglia
 *     in cent, distinzione ottava vs pitch-class, gating sul downbeat.
 *   - SHELL BROWSER: requestMic / listenForAnswer / stopMic. Un solo AnalyserNode
 *     + un solo rAF che chiama l'autocorrelate esistente e alimenta le sessioni.
 *
 * Ritorno di listenForAnswer: { ok, playedPitchClass, cents, latencyMs }
 * (mappabile 1:1 nell'Attempt che l'Agente D registra).
 * ==========================================================================*/
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(root);
  else { root.PitchLoop = factory(root); root.FC = root.FC || {}; root.FC.pitch = root.PitchLoop; }
}(typeof self !== 'undefined' ? self : this, function (root) {
  'use strict';

  const A_REF = 440;
  const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const NOTE_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const DEFAULT_STABLE = 3;      // frame concordi richiesti per confermare
  const DEFAULT_CENTS_TOL = 40;  // soglia in cent (tuning gate)
  const DEFAULT_TIMEOUT = 6000;  // ms di ascolto max (modalità non-downbeat)

  const mod12 = (n) => ((n % 12) + 12) % 12;

  // ─── Conversioni ───────────────────────────────────────────────────────────
  function freqToMidiFloat(freq, aRef) { return 12 * Math.log2(freq / (aRef || A_REF)) + 69; }
  function midiToFreq(midi, aRef) { return (aRef || A_REF) * Math.pow(2, (midi - 69) / 12); }
  function pitchClassOf(midi) { return mod12(Math.round(midi)); }

  function parseNoteName(name) {
    const letter = name[0].toUpperCase();
    let acc = 0;
    for (let i = 1; i < name.length; i++) { const c = name[i]; if (c === '#' || c === '♯') acc++; else if (c === 'b' || c === '♭') acc--; }
    return mod12((NOTE_PC[letter] || 0) + acc);
  }
  // MIDI atteso per la modalità "nota esatta" (nome+ottava | pitchClass+octave | midi).
  function expectedMidi(expected) {
    if (!expected) return null;
    if (expected.midi != null) return expected.midi;
    if (expected.name && expected.octave != null) return (expected.octave + 1) * 12 + parseNoteName(expected.name);
    if (expected.pitchClass != null && expected.octave != null) return (expected.octave + 1) * 12 + mod12(expected.pitchClass);
    return null;
  }
  function expectedPitchClass(expected) {
    if (!expected) return null;
    if (expected.pitchClass != null) return mod12(expected.pitchClass);
    if (expected.name) return parseNoteName(expected.name);
    if (expected.midi != null) return mod12(expected.midi);
    return null;
  }

  // ─── Analisi di un singolo frame ───────────────────────────────────────────
  // freq<=0 (silenzio/gate RMS di autocorrelate) → null.
  function analyzeFrame(freq, opts) {
    if (!freq || freq <= 0) return null;
    const aRef = (opts && opts.aRef) || A_REF;
    const midiFloat = freqToMidiFloat(freq, aRef);
    const midi = Math.round(midiFloat);
    const cents = Math.round((midiFloat - midi) * 100);
    return { freq, midiFloat, midi, pitchClass: mod12(midi), cents };
  }

  // ─── Match di un frame contro l'atteso ─────────────────────────────────────
  // mode: 'exact' (nome+ottava) | 'pitchClass' (qualsiasi ottava) | 'downbeat'.
  function matchFrame(frame, expected, mode, opts) {
    const centsTol = (opts && opts.centsTol != null) ? opts.centsTol : DEFAULT_CENTS_TOL;
    const inTune = Math.abs(frame.cents) <= centsTol;
    if (mode === 'exact') {
      const target = expectedMidi(expected);
      return { match: target != null && frame.midi === target && inTune, byOctave: false, cents: frame.cents, pitchClass: frame.pitchClass };
    }
    // pitchClass | downbeat → qualsiasi ottava
    const pc = expectedPitchClass(expected);
    const pcMatch = pc != null && frame.pitchClass === pc;
    const tMidi = expectedMidi(expected);
    return { match: pcMatch && inTune, byOctave: pcMatch && tMidi != null && frame.midi !== tMidi, cents: frame.cents, pitchClass: frame.pitchClass };
  }

  function modal(keys) {
    const c = {}; let best = null, bestN = 0;
    for (const k of keys) { c[k] = (c[k] || 0) + 1; if (c[k] > bestN) { bestN = c[k]; best = k; } }
    return { key: best, count: bestN };
  }

  // ─── Sessione di verifica (macchina a stati pura) ──────────────────────────
  // cfg: { expected, mode, window, startTime, stableFrames, centsTol, aRef,
  //        downbeatAt, timeoutMs }
  //   - exact | pitchClass: `window` = timeout d'ascolto (ms).
  //   - downbeat: `window` = ± tolleranza (ms) attorno a `downbeatAt`; valida
  //     solo i frame dentro la finestra.
  function createSession(cfg) {
    cfg = cfg || {};
    const mode = cfg.mode || 'pitchClass';
    const stable = cfg.stableFrames || DEFAULT_STABLE;
    const centsTol = cfg.centsTol != null ? cfg.centsTol : DEFAULT_CENTS_TOL;
    const aRef = cfg.aRef || A_REF;
    const ringSize = Math.max(stable * 2, 5);
    const timeoutMs = mode === 'downbeat' ? null : (cfg.timeoutMs != null ? cfg.timeoutMs : (cfg.window != null ? cfg.window : DEFAULT_TIMEOUT));
    const dbWindow = cfg.window != null ? cfg.window : 150;

    const S = {
      done: false, result: null,
      startTime: cfg.startTime != null ? cfg.startTime : null,
      onsetAt: null, lastSilence: true, ring: [], lastFrame: null,
    };

    function finish(ok, frame) {
      S.done = true;
      S.result = {
        ok: !!ok,
        playedPitchClass: frame ? frame.pitchClass : (S.lastFrame ? S.lastFrame.pitchClass : null),
        cents: frame ? frame.cents : (S.lastFrame ? S.lastFrame.cents : null),
        latencyMs: (S.onsetAt != null && S.startTime != null) ? Math.round(S.onsetAt - S.startTime) : null,
      };
      return { done: true, result: S.result };
    }

    function feed(freq, t) {
      if (S.done) return { done: true, result: S.result };
      if (S.startTime == null) S.startTime = t;

      const frame = analyzeFrame(freq, { aRef });

      // ── downbeat: chiusura quando la finestra è passata ──
      if (mode === 'downbeat' && cfg.downbeatAt != null && t > cfg.downbeatAt + dbWindow) {
        return finish(false, S.lastFrame);
      }
      // ── timeout (non-downbeat) ──
      if (timeoutMs != null && S.startTime != null && t - S.startTime > timeoutMs) {
        return finish(false, S.lastFrame);
      }

      if (!frame) { S.lastSilence = true; S.ring = []; return { done: false }; } // silenzio → azzera stabilità

      // onset = primo attacco dopo silenzio (tempo di reazione onesto)
      if (S.onsetAt == null && S.lastSilence) S.onsetAt = t;
      S.lastSilence = false;
      S.lastFrame = frame;

      // downbeat: considera solo i frame DENTRO la finestra attorno al beat
      if (mode === 'downbeat' && cfg.downbeatAt != null && Math.abs(t - cfg.downbeatAt) > dbWindow) {
        return { done: false };
      }

      // finestra di stabilità: consenso modale su midi (exact) o pitchClass (pc/downbeat)
      const key = (mode === 'exact') ? frame.midi : frame.pitchClass;
      S.ring.push({ key, frame, t });
      if (S.ring.length > ringSize) S.ring.shift();
      const m = modal(S.ring.map((x) => x.key));
      if (m.count >= stable) {
        let rep = frame; for (let i = S.ring.length - 1; i >= 0; i--) if (S.ring[i].key === m.key) { rep = S.ring[i].frame; break; }
        const res = matchFrame(rep, cfg.expected, mode, { centsTol });
        if (res.match) return finish(true, rep);
        // stabile ma sbagliato: in downbeat è un miss sul beat; altrimenti continua ad ascoltare
        if (mode === 'downbeat') return finish(false, rep);
      }
      return { done: false };
    }

    return {
      feed,
      get done() { return S.done; },
      get result() { return S.result; },
      _state: S,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  SHELL BROWSER — un solo mic/analyser + un solo rAF che riusa autocorrelate
  // ═══════════════════════════════════════════════════════════════════════════
  const MIC = {
    ctx: null, stream: null, analyser: null, buf: null, rafId: null, frame: 0,
    denied: false, sessions: [], yin: null, aRef: A_REF,
  };

  function isMicAvailable() {
    return !MIC.denied && typeof navigator !== 'undefined' && navigator.mediaDevices && !!navigator.mediaDevices.getUserMedia;
  }

  // Risolve lo YIN esistente (autocorrelate di index.html) — nessuna reimplementazione.
  function resolveYin(opts) {
    if (opts && opts.autocorrelate) return opts.autocorrelate;
    if (MIC.yin) return MIC.yin;
    if (root && typeof root.autocorrelate === 'function') return root.autocorrelate;
    return null;
  }

  async function requestMic(opts) {
    if (MIC.ctx && MIC.stream) return true;
    if (!isMicAvailable()) return false;
    try {
      MIC.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true }, video: false,
      });
      const Ctx = root.AudioContext || root.webkitAudioContext;
      MIC.ctx = (opts && opts.audioContext) || new Ctx();
      if (MIC.ctx.state === 'suspended') await MIC.ctx.resume(); // mobile: solo dopo gesto utente
      MIC.analyser = MIC.ctx.createAnalyser();
      MIC.analyser.fftSize = 2048;
      MIC.buf = new Float32Array(MIC.analyser.fftSize);
      MIC.ctx.createMediaStreamSource(MIC.stream).connect(MIC.analyser);
      MIC.yin = resolveYin(opts);
      MIC.aRef = (opts && opts.aRef) || (root.TUNER && root.TUNER.aRef) || A_REF;
      startLoop();
      return true;
    } catch (e) {
      MIC.denied = (e && e.name === 'NotAllowedError');
      return false;
    }
  }

  function startLoop() {
    if (MIC.rafId != null) return;
    const tick = () => {
      MIC.rafId = requestAnimationFrame(tick);
      if (!MIC.analyser || !MIC.sessions.length) return;
      if (++MIC.frame % 2 !== 0) return; // ~30fps: bassa latenza percepita, CPU contenuta
      MIC.analyser.getFloatTimeDomainData(MIC.buf);
      const freq = MIC.yin ? MIC.yin(MIC.buf, MIC.ctx.sampleRate) : -1; // UNA sola analisi, condivisa
      const t = MIC.ctx.currentTime * 1000;                            // stesso clock del backing track
      for (let i = MIC.sessions.length - 1; i >= 0; i--) {
        const s = MIC.sessions[i];
        const out = s.session.feed(freq, t);
        if (out.done) { MIC.sessions.splice(i, 1); s.resolve(out.result); }
      }
    };
    MIC.rafId = requestAnimationFrame(tick);
  }

  function stopMic() {
    if (MIC.rafId != null && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(MIC.rafId);
    MIC.rafId = null;
    if (MIC.stream) MIC.stream.getTracks().forEach((t) => t.stop());
    if (MIC.ctx && !(MIC.ctx === (root.BT && root.BT.ctx))) { try { MIC.ctx.close(); } catch (e) {} }
    MIC.ctx = MIC.stream = MIC.analyser = MIC.buf = null;
    MIC.sessions.forEach((s) => s.resolve({ ok: false, playedPitchClass: null, cents: null, latencyMs: null, aborted: true }));
    MIC.sessions = [];
  }

  // Servizio principale. Degrada con grazia: se il mic non è disponibile/negato,
  // risolve { ok:false, noMic:true } così la UI (E) ripiega sui drill "tap" (1 e 4).
  async function listenForAnswer(cfg) {
    cfg = cfg || {};
    const ok = await requestMic(cfg);
    if (!ok) return { ok: false, playedPitchClass: null, cents: null, latencyMs: null, noMic: true };
    const startTime = MIC.ctx.currentTime * 1000;
    const session = createSession(Object.assign({ aRef: MIC.aRef, startTime }, cfg));
    return new Promise((resolve) => { MIC.sessions.push({ session, resolve }); });
  }

  return {
    // core puro (testabile)
    analyzeFrame, matchFrame, expectedMidi, expectedPitchClass, createSession,
    freqToMidiFloat, midiToFreq, pitchClassOf, parseNoteName,
    // shell browser
    listenForAnswer, requestMic, stopMic, isMicAvailable,
    get micDenied() { return MIC.denied; },
    _mic: MIC,
  };
}));
