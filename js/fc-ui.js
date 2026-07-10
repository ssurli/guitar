/* ============================================================================
 * FC.ui — UI/UX della modalità "Coscienza del Manico". Agente E.
 * Integra A (PedagogyEngine) + B (FretboardTheory) + C (FC.pitch) + D (FC.store/
 * FC.srs) nel visualizzatore fretboard esistente. Mobile-first (~380px, touch ≥44px).
 *
 * Sorgente di verità persistita: lo storico di Attempt (FC.store). engineState (A)
 * viene ricostruito dallo storico per progressione/generazione item.
 * ==========================================================================*/
(function () {
  'use strict';
  const PE = window.PedagogyEngine, FT = window.FretboardTheory;
  const FC = window.FC || {};
  if (!PE || !FT || !FC.store || !FC.srs) { console.warn('[FC.ui] moduli mancanti'); return; }

  const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const STRINGS = ['e', 'B', 'G', 'D', 'A', 'E'];
  const MODE_OPTS = [['ionian', 'Ionico (magg)'], ['aeolian', 'Eolio (min)'], ['dorian', 'Dorico'], ['mixolydian', 'Misolidio'], ['lydian', 'Lidio'], ['phrygian', 'Frigio'], ['locrian', 'Locrio']];
  const ZONE_OPTS = [['all', 'Tutto il manico'], ['low', 'Basso (0–5)'], ['mid', 'Centro (4–9)'], ['high', 'Alto (9–12)']];
  // Palette viridis 5 livelli — sequenziale, colorblind-safe (non solo rosso/verde).
  const HEAT = ['#440154', '#3b528b', '#21908d', '#5dc863', '#fde725'];
  const HEAT_TXT = ['#fff', '#fff', '#fff', '#04120a', '#04120a'];
  const HEAT_LABELS = ['Nuovo', 'Fragile', 'In crescita', 'Solido', 'Padrone'];

  const mod12 = (n) => ((n % 12) + 12) % 12;
  const prettyDeg = (d) => (d == null ? d : String(d).replace(/b/g, '♭').replace(/#/g, '♯'));
  const prettyTxt = (t) => (t == null ? t : String(t).replace(/\bb([2-7])\b/g, '♭$1').replace(/#([2-7])\b/g, '♯$1'));

  let root = null;
  const S = {
    store: null, engine: null, sub: 'train', session: null, learn: false, tapOnly: true,
    settings: { keyPitchClass: 9, mode: 'aeolian', zone: 'all', maxFret: 12, durationMin: 6 },
    neckView: 'names',
  };

  // ── helper DOM ─────────────────────────────────────────────────────────────
  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }

  // ── stato ↔ storico ─────────────────────────────────────────────────────────
  function attemptToEngineEvent(att) {
    const p = FC.srs.parseItemId(att.itemId) || {};
    return {
      drill: att.drillId, correct: att.ok, rtMs: att.latencyMs, at: att.ts,
      keyPitchClass: S.settings.keyPitchClass, mode: S.settings.mode,
      cellIds: p.space === 'cell' ? [p.string + ':' + p.fret] : [],
      pairId: p.space === 'pair' ? p.keyPitchClass + ':' + p.degreeSemitone : null,
    };
  }
  function rebuildEngine() {
    let e = PE.initState({ keyPitchClass: S.settings.keyPitchClass, mode: S.settings.mode, zone: S.settings.zone, maxFret: S.settings.maxFret });
    for (const att of (S.store.history || [])) e = PE.applyResult(e, attemptToEngineEvent(att), { now: att.ts });
    return e;
  }
  function persistSettings() { S.store.settings = Object.assign({}, S.store.settings, S.settings); FC.store.save(S.store); }
  function indexNow() { try { return FC.srs.index(S.store.history).index; } catch (e) { return 0; } }

  // Costruisce un Attempt canonico (spazio cella per i nomi, coppia per i gradi).
  function attemptFor(item, ok, latencyMs, ppc, cents, now) {
    const space = FC.srs.SPACE_BY_DRILL[item.drill] || 'cell';
    let itemId = null;
    if (space === 'cell' && item.cellIds && item.cellIds.length) itemId = 'c:' + item.cellIds[0];
    else if (item.pairId) itemId = 'p:' + item.pairId;
    else if (item.cellIds && item.cellIds.length) itemId = 'c:' + item.cellIds[0];
    return { itemId, drillId: item.drill, ok: !!ok, latencyMs: latencyMs != null ? latencyMs : null, playedPitchClass: ppc != null ? ppc : null, cents: cents != null ? cents : null, ts: now };
  }

  // ═══ INIT ═══════════════════════════════════════════════════════════════════
  function init() {
    root = document.getElementById('fc-root');
    if (!root) return;
    S.store = FC.store.load();
    S.settings = Object.assign(S.settings, S.store.settings || {});
    S.engine = rebuildEngine();
    render();
  }

  // ═══ RENDER (router) ═════════════════════════════════════════════════════════
  function render() {
    clear(root);
    if (S.tt && S.tt.active) { renderTargetTone(); return; }
    if (S.session) { renderSession(); return; }
    root.appendChild(buildSubnav());
    if (S.sub === 'train') renderTrain();
    else if (S.sub === 'neck') renderNeck();
    else renderProgress();
  }
  function buildSubnav() {
    const bar = el('div', 'fc-subnav');
    [['train', 'Allena'], ['neck', 'Manico'], ['progress', 'Progressi']].forEach(([k, label]) => {
      const b = el('button', 'fc-subbtn' + (S.sub === k ? ' active' : ''), label);
      b.onclick = () => { S.sub = k; render(); };
      bar.appendChild(b);
    });
    return bar;
  }

  // ── ALLENA: avvio sessione + ladder ─────────────────────────────────────────
  function renderTrain() {
    const idx = indexNow();
    const box = el('div', 'fc-card');
    box.appendChild(el('div', 'fc-h', 'Coscienza del Manico'));
    box.appendChild(el('div', 'fc-sub', 'Nome + grado di ogni nota, con richiamo attivo e ripetizione spaziata.'));

    // mini indice
    const mini = el('div', 'fc-minirow');
    mini.appendChild(ring(idx, 64));
    const cov = FC.srs.coverage(S.store, { maxFret: S.settings.maxFret });
    mini.appendChild(el('div', 'fc-ministats',
      `<div><b>${idx}</b><span>coscienza</span></div>` +
      `<div><b>${Math.round(cov.pct * 100)}%</b><span>copertura</span></div>` +
      `<div><b>${dayStreak()}</b><span>giorni</span></div>`));
    box.appendChild(mini);

    // selettori tonalità / modo / zona
    const ctrls = el('div', 'fc-ctrls');
    ctrls.appendChild(sel('Tonalità', NOTES.map((n, i) => [String(i), n]), String(S.settings.keyPitchClass), (v) => { S.settings.keyPitchClass = +v; S.engine = rebuildEngine(); persistSettings(); render(); }));
    ctrls.appendChild(sel('Modo', MODE_OPTS, S.settings.mode, (v) => { S.settings.mode = v; S.engine = rebuildEngine(); persistSettings(); render(); }));
    ctrls.appendChild(sel('Zona', ZONE_OPTS, S.settings.zone, (v) => { S.settings.zone = v; S.engine = rebuildEngine(); persistSettings(); render(); }));
    box.appendChild(ctrls);

    // toggle solo-tap
    const tog = el('label', 'fc-toggle');
    const cb = el('input'); cb.type = 'checkbox'; cb.checked = S.tapOnly;
    cb.onchange = () => { S.tapOnly = cb.checked; };
    tog.appendChild(cb); tog.appendChild(el('span', null, 'Solo tap (senza microfono)'));
    box.appendChild(tog);

    const start = el('button', 'fc-cta', '▶ Avvia sessione');
    start.onclick = startSession;
    box.appendChild(start);
    root.appendChild(box);

    // ladder drill
    const ladder = el('div', 'fc-card');
    ladder.appendChild(el('div', 'fc-h2', 'Percorso — i 7 drill'));
    const unlocked = PE.unlockedDrills(S.engine);
    for (const id of [1, 2, 3, 4, 5, 6, 7]) {
      const spec = PE.DRILLS[id];
      const on = unlocked.indexOf(id) !== -1;
      const st = S.engine.drills[id] || { seen: 0, correct: 0 };
      const acc = st.seen ? Math.round((st.correct / st.seen) * 100) : 0;
      const row = el('div', 'fc-drill' + (on ? '' : ' locked'));
      row.innerHTML = `<span class="fc-dn">${id}</span><span class="fc-dt">${spec.title}</span>` +
        `<span class="fc-dmeta">${id === 7 ? '🎯' : (on ? (st.seen ? acc + '% · ' + st.seen : 'nuovo') : '🔒')}</span>`;
      row.onclick = () => startDrill(id);
      ladder.appendChild(row);
    }
    root.appendChild(ladder);
  }

  // ── MANICO: heat-map + learn mode + tap-to-drill ────────────────────────────
  function renderNeck() {
    const box = el('div', 'fc-card');
    box.appendChild(el('div', 'fc-h2', 'Manico — coscienza'));

    const vrow = el('div', 'fc-segrow');
    [['names', 'Nomi'], ['degrees', 'Gradi'], ['combined', 'Insieme']].forEach(([k, l]) => {
      const b = el('button', 'fc-seg' + (S.neckView === k ? ' active' : ''), l);
      b.onclick = () => { S.neckView = k; render(); };
      vrow.appendChild(b);
    });
    box.appendChild(vrow);

    const tog = el('label', 'fc-toggle');
    const cb = el('input'); cb.type = 'checkbox'; cb.checked = S.learn;
    cb.onchange = () => { S.learn = cb.checked; render(); };
    tog.appendChild(cb); tog.appendChild(el('span', null, 'Learn mode — mostra nome + grado su ogni nota'));
    box.appendChild(tog);

    const heat = FC.srs.masteryMap(S.store, { keyPitchClass: S.settings.keyPitchClass, mode: S.settings.mode, view: S.neckView, maxFret: S.settings.maxFret });
    const heatMap = {}; heat.forEach((c) => { heatMap[c.string + ':' + c.fret] = c.level; });
    box.appendChild(buildNeck({
      heat: heatMap,
      labels: S.learn ? 'both' : 'none',
      onTap: (s, f) => quickDrill(s, f),
    }));

    // legenda accessibile (colore + etichetta + numero livello)
    const leg = el('div', 'fc-legend');
    for (let i = 0; i < 5; i++) leg.appendChild(el('span', 'fc-legitem', `<i style="background:${HEAT[i]}"></i>${i} ${HEAT_LABELS[i]}`));
    box.appendChild(leg);
    box.appendChild(el('div', 'fc-hint', 'Tocca una cella per allenarla. Learn mode mostra nome + grado.'));
    root.appendChild(box);
  }

  // ── PROGRESSI: dashboard ─────────────────────────────────────────────────────
  function renderProgress() {
    const box = el('div', 'fc-card');
    box.appendChild(el('div', 'fc-h2', 'Progressi'));
    const idx = indexNow();
    box.appendChild(ring(idx, 120, true));

    const cov = FC.srs.coverage(S.store, { maxFret: S.settings.maxFret });
    const rt = FC.srs.reactionTrend(S.store.history);
    const grid = el('div', 'fc-dashgrid');
    grid.appendChild(stat('Copertura manico', Math.round(cov.pct * 100) + '%', `${cov.visited}/${cov.total} celle`));
    grid.appendChild(stat('Tempo di reazione', rt.avgMs ? rt.avgMs + ' ms' : '—', rt.count ? ({ improving: '↓ in miglioramento', worsening: '↑ da rivedere', stable: '→ stabile' })[rt.trend] : 'nessun dato'));
    grid.appendChild(stat('Streak', dayStreak() + ' gg', 'giorni consecutivi'));
    grid.appendChild(stat('Tentativi', String(S.store.history.length), 'totali'));
    box.appendChild(grid);

    // barra copertura
    const bar = el('div', 'fc-bar'); bar.appendChild(el('i', null)); bar.firstChild.style.width = Math.round(cov.pct * 100) + '%';
    box.appendChild(el('div', 'fc-barlbl', 'Copertura')); box.appendChild(bar);

    // accuratezza per drill
    box.appendChild(el('div', 'fc-h3', 'Accuratezza per drill'));
    for (const id of [1, 2, 3, 4, 5, 6, 7]) {
      const st = S.engine.drills[id]; if (!st || !st.seen) continue;
      const acc = Math.round((st.correct / st.seen) * 100);
      const r = el('div', 'fc-drow');
      r.innerHTML = `<span>${PE.DRILLS[id].title}</span><span class="fc-dbar"><i style="width:${acc}%"></i></span><b>${acc}%</b>`;
      box.appendChild(r);
    }
    const reset = el('button', 'fc-ghost', 'Esporta dati'); reset.onclick = exportData;
    box.appendChild(reset);
    root.appendChild(box);
  }

  // ── SESSIONE (drill screen) ─────────────────────────────────────────────────
  function startSession() {
    const plan = PE.planSession(S.engine, { durationMin: S.settings.durationMin });
    S.session = { plan, total: Math.min(plan.itemCount, 20), done: 0, correct: 0, streak: 0, best: 0,
      startIndex: indexNow(), rng: PE.makeRng((Date.now() & 0xffffffff) >>> 0), current: null, feedback: null };
    nextItem();
  }
  function startDrill(id) {
    if (id === 7) { startTargetTone(); return; }
    S.session = { plan: {}, total: (id === 1 || id === 4) ? 12 : 8, done: 0, correct: 0, streak: 0, best: 0,
      startIndex: indexNow(), rng: PE.makeRng((Date.now() & 0xffffffff) >>> 0), forceDrill: id, current: null, feedback: null };
    nextItem();
  }
  function pickItem() {
    const rng = S.session.rng, now = Date.now();
    if (S.session.forceDrill) return PE.generateItem(S.session.forceDrill, S.engine, { rng, now, chordRootPitchClass: S.settings.keyPitchClass });
    let pool = PE.unlockedDrills(S.engine);
    if (S.tapOnly) pool = pool.filter((d) => d === 1 || d === 4);
    else pool = pool.filter((d) => d !== 3 && d !== 7); // 3/7 richiedono handling dedicato
    if (!pool.length) pool = [1];
    const drillId = pool[Math.floor(rng() * pool.length)];
    return PE.generateItem(drillId, S.engine, { rng, now, chordRootPitchClass: S.settings.keyPitchClass });
  }
  function nextItem() {
    if (S.session.done >= S.session.total) { endSession(); return; }
    S.session.current = pickItem();
    S.session.feedback = null;
    S.session.itemStart = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    render();
  }
  function renderSession() {
    clear(root);
    const s = S.session, item = s.current;
    const top = el('div', 'fc-sesstop');
    top.innerHTML = `<span>${s.done + 1}/${s.total}</span><span class="fc-streak">🔥 ${s.streak}</span>`;
    const quit = el('button', 'fc-x', '✕'); quit.onclick = () => { S.session = null; render(); };
    top.appendChild(quit);
    root.appendChild(top);

    const prog = el('div', 'fc-bar'); prog.appendChild(el('i', null)); prog.firstChild.style.width = Math.round((s.done / s.total) * 100) + '%';
    root.appendChild(prog);

    const card = el('div', 'fc-card fc-sesscard');
    card.appendChild(el('div', 'fc-prompt', prettyTxt(item.prompt)));

    // fretboard con target evidenziato (nei drill "tap" mostra la cella)
    const showTarget = item.responseType === 'tap' && item.cellIds && item.cellIds.length;
    const hl = showTarget ? parseCell(item.cellIds[0]) : null;
    card.appendChild(buildNeck({ highlight: hl, labels: 'none', compact: true, scrollTo: hl }));

    // area risposta
    const ans = el('div', 'fc-answer');
    if (item.responseType === 'tap') {
      const grid = el('div', 'fc-choices');
      (item.choices || []).forEach((c) => {
        const b = el('button', 'fc-choice', prettyDeg(c));
        b.onclick = () => { if (!s.feedback) answerTap(c); };
        grid.appendChild(b);
      });
      ans.appendChild(grid);
    } else {
      const mic = el('button', 'fc-mic', '🎤 Suona la risposta');
      mic.onclick = () => { if (!s.feedback) answerSound(mic); };
      ans.appendChild(mic);
      ans.appendChild(el('div', 'fc-hint', 'Tocca e suona la nota — lo YIN verifica.'));
    }
    card.appendChild(ans);

    // feedback
    if (s.feedback) card.appendChild(buildFeedback(s.feedback, item));
    root.appendChild(card);
  }
  function buildFeedback(fb, item) {
    const w = el('div', 'fc-fb ' + (fb.ok ? 'ok' : 'no'));
    const played = fb.playedPitchClass != null ? NOTES[fb.playedPitchClass] : null;
    w.innerHTML = `<div class="fc-fbmain">${fb.ok ? '✓ Giusto' : '✗ ' + (fb.noMic ? 'Microfono non disponibile' : 'Riprova')}</div>` +
      `<div class="fc-fbsub">${item.labels.name || ''} · grado ${prettyDeg(item.labels.degree)}` +
      (played ? ` — suonato ${played}${fb.cents != null ? ' (' + (fb.cents >= 0 ? '+' : '') + fb.cents + ' cent)' : ''}` : '') + `</div>`;
    if (fb.noMic) {
      const f = el('button', 'fc-ghost', 'Passa ai drill tap'); f.onclick = () => { S.tapOnly = true; nextItem(); };
      w.appendChild(f);
    } else {
      const nx = el('button', 'fc-cta', s0() >= S.session.total ? 'Riepilogo →' : 'Avanti →');
      nx.onclick = nextItem; w.appendChild(nx);
    }
    return w;
  }
  const s0 = () => S.session.done;

  function answerTap(value) {
    const item = S.session.current;
    const lat = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - S.session.itemStart);
    const ok = PE.check(item, { value });
    commit(item, ok, lat, null, null);
    S.session.feedback = { ok, playedPitchClass: null, cents: null };
    render();
  }
  async function answerSound(btn) {
    const item = S.session.current;
    btn.textContent = '🎤 In ascolto…'; btn.disabled = true;
    const mode = item.matchKind === 'chordTone' ? 'downbeat' : 'pitchClass';
    const expected = { pitchClass: item.expect.pitchClass };
    let res;
    try { res = await FC.pitch.listenForAnswer({ expected, mode, window: mode === 'downbeat' ? 150 : 5000 }); }
    catch (e) { res = { ok: false, noMic: true }; }
    if (res.noMic) { S.session.feedback = { ok: false, noMic: true }; render(); return; }
    commit(item, res.ok, res.latencyMs, res.playedPitchClass, res.cents);
    S.session.feedback = { ok: res.ok, playedPitchClass: res.playedPitchClass, cents: res.cents };
    render();
  }
  function commit(item, ok, lat, ppc, cents) {
    const now = Date.now();
    const att = attemptFor(item, ok, lat, ppc, cents, now);
    if (att.itemId) {
      S.store = FC.srs.record(S.store, att); FC.store.save(S.store);
      S.engine = PE.applyResult(S.engine, attemptToEngineEvent(att), { now });
    }
    S.session.done++; if (ok) { S.session.correct++; S.session.streak++; if (S.session.streak > S.session.best) S.session.best = S.session.streak; } else S.session.streak = 0;
  }
  function endSession() {
    const s = S.session;
    const endIndex = indexNow();
    const delta = endIndex - s.startIndex;
    clear(root);
    const card = el('div', 'fc-card fc-summary');
    card.appendChild(el('div', 'fc-h', 'Sessione completata'));
    card.appendChild(ring(endIndex, 120, true));
    const d = delta > 0 ? `+${delta}` : String(delta);
    card.appendChild(el('div', 'fc-delta ' + (delta >= 0 ? 'up' : 'down'), `Indice di coscienza ${d}`));
    const acc = s.done ? Math.round((s.correct / s.done) * 100) : 0;
    const g = el('div', 'fc-dashgrid');
    g.appendChild(stat('Accuratezza', acc + '%', `${s.correct}/${s.done}`));
    g.appendChild(stat('Miglior streak', String(s.best), 'di fila'));
    card.appendChild(g);

    // prossimo obiettivo
    const nextGoal = computeNextGoal();
    card.appendChild(el('div', 'fc-goal', '🎯 Prossimo obiettivo: ' + nextGoal));

    const again = el('button', 'fc-cta', '▶ Nuova sessione'); again.onclick = startSession;
    const home = el('button', 'fc-ghost', 'Torna alla home'); home.onclick = () => { S.session = null; S.sub = 'train'; render(); };
    card.appendChild(again); card.appendChild(home);
    S.session = null;
    root.appendChild(card);
  }
  function computeNextGoal() {
    const unlocked = PE.unlockedDrills(S.engine);
    const locked = [2, 3, 4, 5, 6, 7].filter((d) => unlocked.indexOf(d) === -1);
    if (locked.length) {
      const next = locked[0];
      const preq = PE.PREREQ[next][0];
      return `sblocca “${PE.DRILLS[next].title}” padroneggiando “${PE.DRILLS[preq].title}” (≥85%, veloce)`;
    }
    const cov = FC.srs.coverage(S.store, { maxFret: S.settings.maxFret });
    if (cov.pct < 0.9) return `copri più manico (ora ${Math.round(cov.pct * 100)}%)`;
    return 'consolida i chord-tone in tempo reale (drill 7)';
  }

  // ── quick drill da tap sul manico ───────────────────────────────────────────
  function quickDrill(string, fret) {
    const kpc = S.settings.keyPitchClass, mode = S.settings.mode;
    const note = PE.cellToNote(string, fret, { keyPitchClass: kpc, mode });
    const choices = PE.shuffle(NOTES.slice(), PE.makeRng((Date.now() & 0xffff) >>> 0)).slice(0, 3);
    if (choices.indexOf(note.name) === -1) choices[0] = note.name;
    PE.shuffle(choices, PE.makeRng((fret * 31 + string) >>> 0));
    const item = {
      drill: 1, drillId: 1, keyPitchClass: kpc, mode, responseType: 'tap', verify: 'logic', matchKind: 'logic', ask: 'name',
      target: note, labels: PE.dualLabels(note.pitchClass, kpc), cellIds: [string + ':' + fret], pairId: kpc + ':' + note.degreeSemitone,
      expect: { name: note.name, pitchClass: note.pitchClass }, choices,
      prompt: `Corda ${STRINGS[string]}, tasto ${fret}: che nota è?`,
    };
    S.session = { plan: {}, total: 1, done: 0, correct: 0, streak: 0, best: 0, startIndex: indexNow(), rng: PE.makeRng(1), current: item, feedback: null,
      itemStart: (typeof performance !== 'undefined' ? performance.now() : Date.now()) };
    render();
  }

  // ── DRILL 7: Target-tone improv (sincronizzato col backing track) ───────────
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  // BT/CHORD_LIB/CHORD_QUAL_LABEL sono `const` top-level in index.html: NON stanno su
  // window, ma sono identificatori globali (lexical env condiviso tra gli script).
  const gBT = () => (typeof BT !== 'undefined' ? BT : null);
  const gLIB = () => (typeof CHORD_LIB !== 'undefined' ? CHORD_LIB : {});
  const gQUAL = () => (typeof CHORD_QUAL_LABEL !== 'undefined' ? CHORD_QUAL_LABEL : {});
  const QUAL = (t) => gQUAL()[t] || '';
  function chordNameOf(rootPc, t) { return NOTES[rootPc] + QUAL(t); }

  // Avvia/garantisce il backing track sul contesto audio CONDIVISO (stesso clock del mic).
  function ensureBacking() {
    if (typeof getAudioCtx !== 'function' || typeof btInit !== 'function' || gBT() == null) return false;
    try {
      btInit();
      const BTx = gBT();
      if (BTx.ctx.state === 'suspended') BTx.ctx.resume();
      BTx.rootIdx = S.settings.keyPitchClass;
      if (!BTx.playing) {
        btBuildProg();
        BTx.playing = true; BTx.absoluteStep = 0;
        BTx.nextNoteTime = BTx.ctx.currentTime + 0.06; BTx.notesInQueue = [];
        btSchedulerLoop();
        requestAnimationFrame(btVisualLoop);
      }
      return true;
    } catch (e) { return false; }
  }
  function stopBacking() {
    const BTx = gBT();
    if (BTx && BTx.playing) { BTx.playing = false; try { clearTimeout(BTx.timerID); } catch (e) {} BTx.notesInQueue = []; }
  }

  // Prossimo downbeat "forte" (mezza battuta: abs%8) con almeno `leadSec` di anticipo.
  function nextDownbeat(leadSec) {
    const BTx = gBT(), stepDur = (60 / BTx.bpm) / 4;
    let abs = BTx.absoluteStep, time = BTx.nextNoteTime;
    const deadline = BTx.ctx.currentTime + (leadSec || 1.6);
    let guard = 0;
    while (!(abs % 8 === 0 && time >= deadline) && guard++ < 4096) { abs++; time += stepDur; }
    return { absStep: abs, timeSec: time };
  }
  // Sceglie il chord-tone target (priorità guide-tone 3ª/7ª), a rotazione.
  function chooseTone(ivs) {
    const byFn = {}; ivs.forEach((p) => { byFn[p[1]] = p[0]; });
    const order = ['3', '♭3', '7', '♭7', '5', 'R', '1'];
    const label = { '3': '3ª', '♭3': '3ª', '7': '7ª', '♭7': '7ª', '5': '5ª', 'R': 'fondamentale', '1': 'fondamentale' };
    const avail = [];
    for (const fn of order) if (byFn[fn] != null) avail.push({ st: byFn[fn], fn, label: label[fn] || fn });
    if (!avail.length) { const p = ivs[0]; return { st: p[0], fn: p[1], label: p[1] }; }
    const i = (S.tt.ti = ((S.tt.ti || 0) + 1)) % avail.length;
    return avail[i];
  }
  // Target chord-tone per un dato step (legge l'accordo corrente dal backing).
  function chordToneTarget(absStep) {
    const BT = gBT(), chord = btChordAt(absStep);
    const rootPc = mod12(BT.rootIdx + chord.s);
    const lib = gLIB()[chord.t];
    const ivs = (lib && lib.ivs) || [[0, 'R'], [4, '3'], [7, '5'], [10, '♭7']];
    const pick = chooseTone(ivs);
    const pc = mod12(rootPc + pick.st);
    return { pitchClass: pc, toneLabel: pick.label, fn: pick.fn, chordName: chordNameOf(rootPc, chord.t), degreeInKey: mod12(pc - S.settings.keyPitchClass) };
  }

  function startTargetTone() {
    S.session = null;
    S.tt = { active: true, running: true, targets: 0, hits: 0, streak: 0, best: 0, startIndex: indexNow(), ti: 0, els: {} };
    renderTargetTone();
    runTargetTone();
  }
  async function runTargetTone() {
    if (!ensureBacking()) { ttMsg('⚠ Backing track non disponibile su questo browser.'); S.tt.running = false; return; }
    if (window.FC && FC.pitch && FC.pitch.stopMic) FC.pitch.stopMic(); // forza il mic sul contesto condiviso
    ttSet('els', 'chord', 'Ascolto il backing…');
    while (S.tt && S.tt.running) {
      let t;
      try { t = await armTarget(); } catch (e) { ttMsg('Errore: ' + e.message); break; }
      if (!S.tt || !S.tt.running) break;
      if (t.noMic) { ttMsg('🎤 Serve il microfono per il drill 7. Concedi il permesso e riprova.'); S.tt.running = false; break; }
      S.tt.targets++;
      if (t.ok) { S.tt.hits++; S.tt.streak++; if (S.tt.streak > S.tt.best) S.tt.best = S.tt.streak; } else S.tt.streak = 0;
      recordTarget(t);
      showTargetResult(t);
      updateTTStats();
      await sleep(750);
    }
  }
  async function armTarget() {
    const db = nextDownbeat(1.6);
    const tgt = chordToneTarget(db.absStep);
    showTargetPrompt(tgt);
    const res = await FC.pitch.listenForAnswer({
      expected: { pitchClass: tgt.pitchClass }, mode: 'downbeat',
      window: 240, downbeatAt: db.timeSec * 1000,
      audioContext: window.getAudioCtx(), centsTol: 45, stableFrames: 2,
    });
    return Object.assign({}, tgt, res);
  }
  function recordTarget(t) {
    const now = Date.now();
    const item = { drill: 7, cellIds: [], pairId: S.settings.keyPitchClass + ':' + t.degreeInKey, expect: { pitchClass: t.pitchClass } };
    const att = attemptFor(item, t.ok, t.latencyMs, t.playedPitchClass, t.cents, now);
    if (att.itemId) { S.store = FC.srs.record(S.store, att); FC.store.save(S.store); S.engine = PE.applyResult(S.engine, attemptToEngineEvent(att), { now }); }
  }

  function renderTargetTone() {
    clear(root);
    const top = el('div', 'fc-sesstop');
    top.appendChild(el('span', null, '🎯 Target-tone'));
    const st = el('span', 'fc-streak'); S.tt.els.streak = st; top.appendChild(st);
    const x = el('button', 'fc-x', '✕'); x.onclick = stopTargetTone; top.appendChild(x);
    root.appendChild(top);

    const card = el('div', 'fc-card fc-ttcard');
    const chord = el('div', 'fc-ttchord', '—'); S.tt.els.chord = chord; card.appendChild(chord);
    const prompt = el('div', 'fc-ttprompt', 'Preparati…'); S.tt.els.prompt = prompt; card.appendChild(prompt);
    const beat = el('div', 'fc-ttbeat'); S.tt.els.beat = beat; card.appendChild(beat);
    const result = el('div', 'fc-ttresult', ''); S.tt.els.result = result; card.appendChild(result);
    const stats = el('div', 'fc-ttstats', ''); S.tt.els.stats = stats; card.appendChild(stats);
    card.appendChild(el('div', 'fc-hint', '🎧 Usa le cuffie: evita che il microfono catturi il backing. Suona il chord-tone sul beat.'));
    root.appendChild(card);
    updateTTStats();
  }
  function ttSet(_ns, key, val) { if (S.tt && S.tt.els && S.tt.els[key]) S.tt.els[key].textContent = val; }
  function showTargetPrompt(t) {
    ttSet('els', 'chord', 'Accordo: ' + t.chordName);
    ttSet('els', 'prompt', 'Atterra sulla ' + t.toneLabel);
    if (S.tt.els.prompt) { S.tt.els.prompt.classList.remove('pulse'); void S.tt.els.prompt.offsetWidth; S.tt.els.prompt.classList.add('pulse'); }
    ttSet('els', 'result', '');
    if (S.tt.els.result) S.tt.els.result.className = 'fc-ttresult';
  }
  function showTargetResult(t) {
    const played = t.playedPitchClass != null ? NOTES[t.playedPitchClass] : '—';
    const txt = t.ok ? `✓ Centrato — ${NOTES[t.pitchClass]}${t.cents != null ? ' (' + (t.cents >= 0 ? '+' : '') + t.cents + ' cent)' : ''}`
      : `✗ Atteso ${NOTES[t.pitchClass]} — suonato ${played}`;
    if (S.tt.els.result) { S.tt.els.result.textContent = txt; S.tt.els.result.className = 'fc-ttresult ' + (t.ok ? 'ok' : 'no'); }
  }
  function updateTTStats() {
    if (S.tt.els.streak) S.tt.els.streak.textContent = '🔥 ' + S.tt.streak;
    const acc = S.tt.targets ? Math.round((S.tt.hits / S.tt.targets) * 100) : 0;
    ttSet('els', 'stats', `${S.tt.hits}/${S.tt.targets} centrati · ${acc}% · best ${S.tt.best}`);
  }
  function ttMsg(m) { if (S.tt && S.tt.els.result) { S.tt.els.result.textContent = m; S.tt.els.result.className = 'fc-ttresult no'; } }
  function stopTargetTone() {
    if (S.tt) S.tt.running = false;
    stopBacking();
    if (window.FC && FC.pitch && FC.pitch.stopMic) FC.pitch.stopMic();
    S.tt = null; S.sub = 'train'; render();
  }

  // ── fretboard builder ───────────────────────────────────────────────────────
  function buildNeck(opts) {
    opts = opts || {};
    const maxFret = S.settings.maxFret;
    const kpc = S.settings.keyPitchClass, mode = S.settings.mode;
    const wrap = el('div', 'fc-neckwrap');
    const grid = el('div', 'fc-neck');
    grid.style.gridTemplateColumns = `28px repeat(${maxFret + 1}, var(--fc-cw))`;
    // header tasti
    grid.appendChild(el('div', 'fc-nlabel', ''));
    for (let f = 0; f <= maxFret; f++) grid.appendChild(el('div', 'fc-fnum', [3, 5, 7, 9, 12, 15, 17, 19, 21, 24].indexOf(f) !== -1 ? String(f) : (f === 0 ? '0' : '')));
    let scrollX = 0;
    for (let s = 0; s < 6; s++) {
      grid.appendChild(el('div', 'fc-nlabel', STRINGS[s]));
      for (let f = 0; f <= maxFret; f++) {
        const note = FT.noteAt(s, f, { key: NOTES[kpc], mode });
        const deg = FT.degreeOf(note.pitchClass, NOTES[kpc], mode);
        const cell = el('button', 'fc-cell');
        const key = s + ':' + f;
        if (opts.heat && opts.heat[key] != null) {
          const lv = opts.heat[key];
          cell.style.background = HEAT[lv]; cell.style.color = HEAT_TXT[lv];
          cell.classList.add('lit');
          cell.setAttribute('aria-label', `${note.name} livello ${lv}`);
        }
        if (opts.highlight && opts.highlight.string === s && opts.highlight.fret === f) { cell.classList.add('target'); scrollX = f; }
        if (opts.labels === 'both') cell.innerHTML = `<b>${note.name}</b><i>${prettyDeg(deg.degree)}</i>`;
        else if (opts.labels === 'name') cell.textContent = note.name;
        else if (opts.heat && opts.heat[key] != null) cell.textContent = String(opts.heat[key]);
        cell.dataset.s = s; cell.dataset.f = f;
        if (opts.onTap) cell.onclick = () => opts.onTap(s, f);
        grid.appendChild(cell);
      }
    }
    wrap.appendChild(grid);
    if (opts.scrollTo) setTimeout(() => { try { wrap.scrollLeft = Math.max(0, (opts.scrollTo.fret - 2) * 44); } catch (e) {} }, 0);
    return wrap;
  }

  // ── widget riusabili ─────────────────────────────────────────────────────────
  function ring(val, size, big) {
    const r = (size / 2) - 8, c = 2 * Math.PI * r, off = c * (1 - val / 100);
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('width', size); svg.setAttribute('height', size); svg.setAttribute('class', 'fc-ring');
    const mk = (cls, dash) => { const p = document.createElementNS(ns, 'circle'); p.setAttribute('cx', size / 2); p.setAttribute('cy', size / 2); p.setAttribute('r', r); p.setAttribute('class', cls); if (dash != null) { p.setAttribute('stroke-dasharray', c); p.setAttribute('stroke-dashoffset', dash); } return p; };
    svg.appendChild(mk('fc-ring-bg'));
    svg.appendChild(mk('fc-ring-fg', off));
    const t = document.createElementNS(ns, 'text'); t.setAttribute('x', size / 2); t.setAttribute('y', size / 2); t.setAttribute('class', 'fc-ring-txt'); t.textContent = val;
    svg.appendChild(t);
    const box = el('div', 'fc-ringbox' + (big ? ' big' : '')); box.appendChild(svg);
    if (big) box.appendChild(el('div', 'fc-ringcap', 'Indice di coscienza'));
    return box;
  }
  function stat(label, val, sub) { return el('div', 'fc-stat', `<div class="fc-statv">${val}</div><div class="fc-statl">${label}</div><div class="fc-stats">${sub}</div>`); }
  function sel(label, opts, cur, on) {
    const w = el('div', 'fc-selw'); w.appendChild(el('div', 'fc-sellbl', label));
    const s = el('select', 'fc-sel');
    opts.forEach(([v, l]) => { const o = el('option', null, l); o.value = v; if (v === cur) o.selected = true; s.appendChild(o); });
    s.onchange = () => on(s.value); w.appendChild(s); return w;
  }
  function parseCell(id) { const p = id.split(':'); return { string: +p[0], fret: +p[1] }; }
  function dayStreak() {
    const days = new Set((S.store.history || []).map((a) => Math.floor(a.ts / 86400000)));
    if (!days.size) return 0;
    let d = Math.floor(Date.now() / 86400000), n = 0;
    while (days.has(d)) { n++; d--; }
    if (n === 0 && days.has(Math.floor(Date.now() / 86400000) - 1)) { d = Math.floor(Date.now() / 86400000) - 1; while (days.has(d)) { n++; d--; } }
    return n;
  }
  function exportData() {
    try {
      const blob = new Blob([FC.store.export(S.store)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'coscienza-manico.json'; a.click();
    } catch (e) {}
  }

  // esponi init per l'attivazione da showPage
  window.FCUI = { init, _S: S, _tt: { nextDownbeat, chordToneTarget, chooseTone, ensureBacking, stopTargetTone } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
