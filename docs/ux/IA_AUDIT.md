# IA_AUDIT — Audit & Inventario dell'architettura informativa esistente

> **Agente A · pacchetto UX Setlist-as-Launchpad.** Solo audit, zero proposte di
> redesign (i flag keep/merge/move/drop in §3 sono preliminari, non progettati).
> Ogni affermazione è verificata seguendo gli handler reali con riferimento `file:linea`.
> Base: branch `claude/guitar-app-ux-setlist-gws05r`, commit `319ce72`.
> Contratti dati congelati: `docs/ux/00-contratti-dati.md`.

**Verifica della baseline del lead** — confermata con una correzione:

- ✅ 9 tab via `showPage()`; sotto-alberi scales/caged/jam/technique come da brief (dettaglio in §2, incluse le tab annidate s2c/c2s, inversioni, string-set).
- ⚠️ **Correzione: il menu base NON è una bottom-nav.** La nav è la **seconda riga di un header sticky in alto** (`header { position:sticky; top:0 }` index.html:75-85; `<nav>` con i 9 `.nav-btn` index.html:2868-2879), a scroll orizzontale (index.html:113-122). Nessuna bottom bar esiste (verificato: nessun elemento fisso in basso salvo il bottone contestuale `#nav-return-bar`, index.html:8435-8443).
- ✅ Setlist sepolta a tapDepth 2: nav "🎸 Basi" (2875) → subtab "🎼 Canzoni" `data-tab="canzoni"` con `showBasiSubpage('canzoni');songlabRenderAll()` (index.html:9153).
- ✅ SONGLAB: schema, storage, export/import, play via `jamLoadCustomProgression`, ponti `songlabGoStudy`/`songlabAddFromRepertoire` — dettaglio con righe in §4. Confermato che **mancano** tonalità/tempo/scala/CAGED per canzone: lo schema Song reale ha solo `{id, title, artist, sections[].chords}` (index.html:6217-6226, 6329-6334, 6718-6723); nessun campo `launch`/`key`/`bpm` esiste (assente, verificato).

Perimetro dei file:

| File | Righe | Ruolo |
|---|---|---|
| `index.html` | 12.197 | monolite: CSS + HTML + JS inline (tutte le schermate) |
| `js/fc-ui.js` | 626 | UI "Coscienza del Manico" (`window.FCUI`) |
| `js/fretboard-theory.js` | 211 | teoria pura (`window.FretboardTheory`) |
| `js/pedagogy-engine.js` | 562 | motore drill (`window.PedagogyEngine`) |
| `js/pitch-loop.js` | 268 | pitch detection loop (`FC.pitch`) |
| `js/srs-analytics.js` | 297 | SRS + persistenza (`FC.store` / `FC.srs`) |
| `guitar-improv.html` | 22 | redirect a `index.html` (guitar-improv.html:10-11) |
| `test/*.test.js` | 4 suite | 13+10+13+14 = 50 test, tutti verdi (eseguiti in audit) |

---

## 1. Meccanismo di navigazione (handler reali)

- **Nessun routing**: niente hash, history o pushState — grep `location.hash|hashchange|pushState` = 0 risultati in `index.html` (assente, verificato). Refresh = si riparte sempre dal Fretboard.
- **Livello 1**: `showPage(name)` toglie `.active` a tutte le `.page` e attiva `#page-<name>` (index.html:8413-8422); le pagine sono `div.page` `display:none` / `.active{display:block}` (index.html:184-185). Bottoni nav: index.html:2870-2878.
- **Livello 2 — subtab**: `.cpage-tab-btn` → `div.cpage-view` via funzioni per-pagina: `showScalesSubpage` (12045), `showChordScaleSubpage` (12051) — **due famiglie sulla stessa tab-bar** di page-scales (3014-3020); `showCagedSubpage` (11517), `showCircleSubpage` (12027), `showBasiSubpage` (12033), `showTechSubpage` (12039).
- **Livello 3 — tab annidate**: `showTechTab(id)` per i 10 tab Tecnica (11524; costruiti runtime in `initTechPage` 10828-10843); `setCsMode('s2c'|'c2s')` in Scala↔Accordi (3058-3059, 8696-8702); tab tipo-accordo costruite runtime (`triad-type-tabs` 3103/6995, `s7-type-tabs` 6667, `n9-type-tabs` 6676); inversioni `setInversion(0..2)` (3111-3113) e set di corde `setStringSet(0..4)` (3119-3123) per le triadi; `setS7Inversion(0..3)` (3155-3158, 7284) e `setS7StringSet(0..2)` (3164-3166, 7290) per le settime; subnav Coscienza `buildSubnav` train/neck/progress (fc-ui.js:87-95).
- **Back contestuale**: bottone flottante `#nav-return-bar` creato da `navArm()` (index.html:8424-8456), usato dai rimandi cross-pagina (es. `songlabGoStudy` 6683-6686).
- **Stato iniziale**: `#page-fretboard` ha `class="page active"` nel markup (2883); a `DOMContentLoaded` vengono renderizzate tutte le pagine eager (9131-9147). Init lazy al primo tap per: Tecnica (`initTechPage` 10824, flag `_techInitialized` 10822), Manico Live (`micFbInit` 9155), Transizione modale (`initTransition` 3384), Coscienza (`FCUI.init()` 2878 — ma fc-ui si auto-inizializza anche a DOMContentLoaded, fc-ui.js:624-625).

---

## 2. Albero di navigazione completo (ASCII)

Tra parentesi: handler e riga del punto d'ingresso. `[d=N]` = tapDepth dall'avvio.

```
AVVIO → index.html (nessun routing; guitar-improv.html → redirect, guitar-improv.html:10-11)
│
├─ HEADER sticky TOP (75-85): logo + <nav> scroll orizzontale (2868-2879)
│
├─ Fretboard [d=0, default: class="page active" 2883]  (showPage('fretboard') 2870)
│   ├─ selettori: #fb-key (2890) · #fb-scale 18 scale (2907) · #fb-frets (2938) · #fb-label (2947)
│   ├─ modalità: Tutte le note / 3 note per corda / Tecnica (setFbMode, toggleTech 2959-2961)
│   └─ ▶ Play scala (playScale 2954→3946) · pattern lines (2983)
│
├─ Scale & Accordi [d=1]  (showPage('scales') 2871)  — TAB-BAR UNICA, 7 voci, 2 famiglie di view
│   ├─ Scale          → spage-scales   [d=1 default] (showScalesSubpage 3014)
│   ├─ Modi           → spage-modi     [d=2] (3015)
│   ├─ Progressioni   → spage-progressioni [d=2] (3016)
│   │    └─ chip accordo → MODALE chord-modal [d=3] (openChordPopup 8977, chip 9036)
│   ├─ Scala↔Accordi  → cspage-chordscale [d=2] (showChordScaleSubpage 3017)
│   │    ├─ Scala → Accordi (s2c) [d=3 default] (setCsMode 3058, 8696)
│   │    └─ Accordo → Scale (c2s) [d=3] (3059)
│   ├─ Triadi         → cspage-triadi  [d=2] (3018)
│   │    ├─ tab tipo (runtime, triad-type-tabs 3103/6995) [d=3]
│   │    ├─ Inversione ×3 (setInversion 3111-3113) [d=3]
│   │    └─ Set di corde ×5 (setStringSet 3119-3123) [d=3]
│   ├─ Acc. 7ª        → cspage-seventh [d=2] (3019)
│   │    ├─ tab tipo (6667) · Inversione ×4 (3155-3158) · Set corde ×3 (3164-3166) [d=3]
│   └─ Acc. 9ª        → cspage-ninth   [d=2] (3020)
│        └─ tab tipo (n9-type-tabs, 6676) [d=3]
│
├─ CAGED [d=1]  (showPage('caged') 2872)
│   ├─ Forme CAGED     → cpage-caged-forms   [d=1 default] (showCagedSubpage 3213)
│   ├─ Modi diatonici  → cpage-caged-modi    [d=2] (3214, renderModi)
│   └─ Sistema Connesso→ cpage-caged-sistema [d=2] (3215, renderCagedSystem)
│
├─ 5 Box Penta [d=1]  (showPage('penta5') 2873) — quality/key/box in P5_STATE (8071)
│
├─ ♯♭ Circolo [d=1]  (showPage('circle');renderCircleOfFifths() 2874)
│   ├─ Circolo delle Quinte → cpage-circolo [d=1 default] (3383)
│   └─ Transizione Modale   → cpage-transizione [d=2] (3384, initTransition lazy)
│
├─ 🎸 Basi [d=1]  (showPage('jam') 2875)
│   ├─ 🎸 Basi        → bpage-basi [d=1 default] (showBasiSubpage 9152)
│   │    ├─ progressione custom: #jam-custom-chords + ▶ Carica / ✕ Base (9169-9173) + chip rapidi (9175)
│   │    ├─ metronomo standalone (metroToggle 9183, suddivisioni 9186-9191)
│   │    ├─ Tonalità/Modo/Stile (9199/9216/9235 → jamUpdateSettings 5421)
│   │    ├─ transport: ▶ #jam-play-btn (9251→jamTogglePlay 5394) · BPM ▲▼/slider/TAP (9258-9268)
│   │    ├─ mix Master/Drums/Bass/Chords (9288-9305)
│   │    └─ manico live: SCALA/ARPEGGIO (9319-9320) · 🎤 Suona live (jamLiveToggle 9322→6047)
│   ├─ 🎼 Canzoni     → bpage-canzoni = SONGLAB [d=2] (9153) ← **posizione attuale della setlist**
│   │    ├─ pill canzoni + ＋nuova/🎸repertorio/⬇export/⬆import (songlabRenderList 6261-6281)
│   │    ├─ editor sezioni (songlabRenderEditor 6362) · chart (songlabRenderChart 6422)
│   │    ├─ tap su accordo → pannello #song-chordlab [d=3] (songOpenChord 6501)
│   │    │    └─ 🎯 Studia → salta a Triadi/7ª/9ª con back-bar (songlabGoStudy 6650-6687)
│   │    └─ ▶ Suona (songTogglePlay 6464 → jamLoadCustomProgression 5706 + jamTogglePlay 5394)
│   ├─ 🎵 Accordatore → bpage-accordatore [d=2] (9154)
│   │    ├─ preset ×8 + A ref 432-446Hz (9372-9387) · 🎤 Avvia (tunerToggle 9392→10090)
│   │    └─ toni di riferimento per corda (tunerPlayRef 9403-9408)
│   ├─ 🎤 Manico Live → bpage-micfb [d=2] (9155, micFbInit lazy) — micFbToggle 9416→10281
│   └─ 🔁 Looper      → bpage-looper [d=2] (9156)
│        └─ REC/PLAY/OVERDUB/CLEAR + volume (9444-9469; looperRec 10435, looperOverdub 10483)
│
├─ 🎛 Audio [d=1]  (showPage('audio') 2876) — NESSUNA subtab (verificato: nessun .cpage-tabs
│   in page-audio, 9485-9534): 4 slider reverb/distorsione + ▶ Test Sound (9489-9524). Vicolo cieco.
│
├─ ⚡ Tecnica [d=1]  (showPage('technique');showTechSubpage('pratica') 2877)
│   ├─ Pratica   → tpage-pratica [d=1 default] (9539) — griglia statica da PRACTICE_DATA (4839)
│   └─ ⚡ Tecnica → tpage-tecnica [d=2] (9540, initTechPage lazy 10824)
│        └─ 10 tech-tab [d=3] (showTechTab 11524; lista 10828-10839):
│           sweep(default) · alternate · legato · tapping · skipping · dwps ·
│           legato-phrasing · equator · doublestops · masters (MAESTRI 10756)
│
└─ 🧠 Coscienza [d=1]  (showPage('coscienza');FCUI&&FCUI.init() 2878) → #fc-root (12180)
    ├─ Allena    [d=1 default] (buildSubnav fc-ui.js:87-95; renderTrain fc-ui.js:98)
    │    ├─ selettori Tonalità/Modo/Zona (fc-ui.js:115-119) · toggle solo-tap (123-126)
    │    ├─ ▶ Avvia sessione [d=2] → SCHERMO SESSIONE (startSession 221, renderSession 250)
    │    └─ ladder 7 drill, tap su drill [d=2] → sessione forzata (startDrill 227)
    │         └─ drill 7 → SCHERMO TARGET-TONE [d=2] (startTargetTone 460, renderTargetTone 501)
    ├─ Manico    [d=2] (renderNeck fc-ui.js:152) — heat-map, learn mode, tap-cella→quick drill (379)
    └─ Progressi [d=2] (renderProgress fc-ui.js:187) — indice, copertura, trend, Esporta dati (615)
```

Profondità massima: **3 tap** dal lancio (es. nav → subtab → tab annidata/accordo). Il nav di livello 1 scrolla orizzontalmente: su viewport stretti le voci Audio/Tecnica/Coscienza richiedono anche uno swipe (nav overflow-x:auto, 113-122; 9 bottoni uppercase Space Mono 12px, 124-138).

---

## 3. Tabella MenuNode

`tapDepth` = tap minimi dall'avvio per vedere la vista (il default attivo eredita la profondità del genitore). `usage` = **stima 0-3 motivata** (core = nel percorso primario suonare/imparare; accessoria = consultazione occasionale). Nessuna telemetria esiste nell'app (verificato: zero analytics in index.html). `racc.` = solo flag preliminare.

| id | label | icon | parent | screen (riga) | tapDepth | usage (motivo) | racc. |
|---|---|---|---|---|---|---|---|
| fretboard | Fretboard | — | nav | page-fretboard (2883) | 0 | 3 — default all'avvio, strumento core | keep |
| scales | Scale & Accordi | — | nav | page-scales (3012) | 1 | 2 — consultazione teoria, alimenta il resto | keep |
| caged | CAGED | — | nav | page-caged (3208) | 1 | 2 — studio forme, core didattico | keep |
| penta5 | 5 Box Penta | — | nav | page-penta5 (3329) | 1 | 2 — studio box, core didattico | keep |
| circle | ♯♭ Circolo | ♯♭ | nav | page-circle (3381) | 1 | 1 — consultazione occasionale | keep |
| jam | Basi | 🎸 | nav | page-jam (9150) | 1 | 3 — è il "suonare": backing, canzoni, tuner | keep |
| audio | Audio | 🎛 | nav | page-audio (9485) | 1 | 0 — 4 slider di settaggio synth, si tocca una tantum | merge |
| technique | Tecnica | ⚡ | nav | page-technique (9537) | 1 | 2 — esercizi guidati con playback | keep |
| coscienza | Coscienza | 🧠 | nav | page-coscienza (12179) | 1 | 2 — training quotidiano (streak/SRS) | keep |
| scales.scales | Scale | — | scales | spage-scales (3022) | 1 (default) | 2 — reference scale | keep |
| scales.modi | Modi | — | scales | spage-modi (3027) | 2 | 1 — approfondimento | keep |
| scales.progressioni | Progressioni | — | scales | spage-progressioni (3036) | 2 | 1 — consultazione | keep |
| scales.chordscale | Scala↔Accordi | — | scales | cspage-chordscale (3054) | 2 | 1 — consultazione mirata | keep |
| scales.cs.s2c | Scala → Accordi | — | scales.chordscale | cs-panel-s2c (3061) | 2 (default) | 1 | keep |
| scales.cs.c2s | Accordo → Scale | — | scales.chordscale | cs-panel-c2s (3082) | 3 | 1 | keep |
| scales.triadi | Triadi | — | scales | cspage-triadi (3087) | 2 | 2 — studio voicing, target di songlabGoStudy | keep |
| scales.tr.inv | Inversione (×3) | — | scales.triadi | inv-tabs (3110-3114) | 3 | 2 — parte integrante dello studio triadi | keep |
| scales.tr.strset | Set di corde (×5) | — | scales.triadi | strset-tabs (3118-3124) | 3 | 2 | keep |
| scales.seventh | Acc. 7ª | — | scales | cspage-seventh (3131) | 2 | 1 | keep |
| scales.s7.inv | Inversione (×4) | — | scales.seventh | s7-inv-tabs (3154-3158) | 3 | 1 | keep |
| scales.s7.strset | Set di corde (×3) | — | scales.seventh | strset (3163-3166) | 3 | 1 | keep |
| scales.ninth | Acc. 9ª | — | scales | cspage-ninth (3174) | 2 | 1 | keep |
| caged.forms | Forme CAGED | — | caged | cpage-caged-forms (3219) | 1 (default) | 2 | keep |
| caged.modi | Modi diatonici | — | caged | cpage-caged-modi (3261) | 2 | 1 | keep |
| caged.sistema | Sistema Connesso | — | caged | cpage-caged-sistema (3288) | 2 | 1 | keep |
| circle.circolo | ♯♭ Circolo delle Quinte | ♯♭ | circle | cpage-circolo (3386) | 1 (default) | 1 | keep |
| circle.transizione | Transizione Modale | — | circle | cpage-transizione (3400) | 2 | 1 | keep |
| jam.basi | 🎸 Basi | 🎸 | jam | bpage-basi (9158) | 1 (default) | 3 — backing generativo, cuore del "suonare" | keep |
| jam.canzoni | 🎼 Canzoni (SONGLAB) | 🎼 | jam | bpage-canzoni (9351) | 2 | 2 — setlist reale dell'utente, **sepolta** (uso potenziale 3) | keep |
| jam.accordatore | 🎵 Accordatore | 🎵 | jam | bpage-accordatore (9365) | 2 | 2 — primo gesto di ogni sessione con chitarra vera | keep |
| jam.micfb | 🎤 Manico Live | 🎤 | jam | bpage-micfb (9411) | 2 | 1 — duplica il "🎤 Suona live" di bpage-basi (9322/6047) | merge |
| jam.looper | 🔁 Looper | 🔁 | jam | bpage-looper (9438) | 2 | 1 — nicchia, richiede cuffie | keep |
| technique.pratica | Pratica | — | technique | tpage-pratica (9542) | 1 (default) | 1 — testo statico (PRACTICE_DATA 4839) | move |
| technique.tecnica | ⚡ Tecnica | ⚡ | technique | tpage-tecnica (9547) | 2 | 2 — esercizi interattivi, più usati del default | keep |
| tech.sweep | Sweep Picking | — | technique.tecnica | tab sweep (10829) | 2 (default liv.3) | 2 | keep |
| tech.alternate | Alternate Picking | — | technique.tecnica | tab (10830) | 3 | 2 | keep |
| tech.legato | Legato | — | technique.tecnica | tab (10831) | 3 | 2 | keep |
| tech.tapping | Tapping | — | technique.tecnica | tab (10832) | 3 | 1 | keep |
| tech.skipping | String Skipping | — | technique.tecnica | tab (10833) | 3 | 1 | keep |
| tech.dwps | Downward Pickslanting | — | technique.tecnica | tab (10834) | 3 | 1 | keep |
| tech.legato-phrasing | Legato Phrasing | — | technique.tecnica | tab (10835) | 3 | 1 | keep |
| tech.equator | Equator Trick (Mayer) | — | technique.tecnica | tab (10836) | 3 | 1 | keep |
| tech.doublestops | Double Stops | — | technique.tecnica | tab (10837) | 3 | 1 | keep |
| tech.masters | I Maestri | — | technique.tecnica | tab (10838) | 3 | 1 — ma alimenta il repertorio SONGLAB (6299) | keep |
| fc.train | Allena | — | coscienza | subnav train (fc-ui.js:89) | 1 (default) | 2 — entry del training | keep |
| fc.neck | Manico | — | coscienza | subnav neck (fc-ui.js:89) | 2 | 1 — heat-map consultiva | keep |
| fc.progress | Progressi | — | coscienza | subnav progress (fc-ui.js:89) | 2 | 1 — dashboard | keep |

Voce fuori menu: `guitar-improv.html` = redirect permanente a index (guitar-improv.html:10-11) → drop di fatto già eseguito.

---

## 4. Inventario SONGLAB (setlist esistente)

Blocco "CHORD LAB · CANZONI", index.html:6196-6736. UI nella subtab `bpage-canzoni` (9351-9364). **Posizione nella IA: tapDepth 2** (nav 🎸 Basi 2875 → subtab 🎼 Canzoni 9153).

### 4.1 Persistenza e schema

- Chiave: `const SONGLAB_LS_KEY = 'gil_songs_v1'` (index.html:6204).
- Payload: **array JSON di Song nudo** (`JSON.stringify(SONGLAB.songs)`, 6238). **Nessun campo schemaVersion** (verificato, 6237-6239); il "v1" vive solo nel nome della chiave.
- **Schema reale di Song** (dal seed 6217-6226, `songlabNew` 6329-6334, import 6718-6723):

```js
Song = {
  id: string,        // 's'+Date.now().toString(36)+random, anti-collisione (6209-6214)
  title: string,
  artist: string,    // opzionale, default ''
  sections: [ { name: string, chords: string } ]
  // chords = stringa "A7:4 D9:2 A7:2" — sintassi di parseProgressionInput:
  //   separatori spazio/virgola/| ; battute ":N"/"*N" clamp 1..8 (songParseTokens 6245-6252)
}
```

- **Mancano** (verificato, nessuna occorrenza): tonalità, tempo/BPM, scala suggerita, CAGED focus, set/order/status/notes — cioè tutti i campi che i contratti (00-contratti-dati.md:40-47) prevedono come estensioni opzionali.
- Stato runtime: `const SONGLAB = { songs, curId, playingId, editing, selChord }` (6205).
- **Load**: `songlabLoad()` (6229-6235) — chiave assente → seed demo "Blues in A" (6216-6227) + save; JSON corrotto → `[]`. **Nessuna funzione migrate** (assente, verificato).
- **Save**: `songlabSave()` (6237-6239) ad ogni `oninput` dell'editor (6385, 6387, 6399, 6401).

### 4.2 CRUD

| Operazione | Funzione | Riga |
|---|---|---|
| Create | `songlabNew()` | 6329 |
| Create da repertorio MAESTRI | `songlabAddFromRepertoire(artist,title)` | 6318 (pannello 6287-6317; dati `MAESTRI` 10756 — ponte con tech.masters) |
| Read corrente | `songlabCur()` | 6241 |
| Update live | handler in `songlabRenderEditor()` | 6362-6409 |
| Aggiungi sezione | `songlabAddSection()` (default Intro/Strofa/…) | 6411-6418 |
| Delete (confirm nativo) | `songlabDelete()` | 6342-6352 |

### 4.3 UI esistente

- Lista pill + azioni `＋ nuova / 🎸 repertorio / ⬇ export / ⬆ import` (`songlabRenderList` 6261-6281).
- Editor `#song-editor` con datalist sezioni (9360-9363).
- Chart `#song-chart`: pill-accordo per sezione, battute, evidenza `.now` in play (6422-6461); follow da `jamUpdateChordBlocks` → `songChartFollow` (6486-6491).
- Chord Lab per accordo: `songOpenChord` (6501-6566) → manico SVG a livelli SCALA/ARPEGGIO/GRIP (`SCL_FB` 6499, `sclDrawFretboard` 6582-6639) + voicing + "🎯 Studia" → Triadi/7ª/9ª con `navArm()` (6650-6687).

### 4.4 Play

`songTogglePlay()` (6464-6481): appiattisce le sezioni, **scrive la stringa nell'input `#jam-custom-chords`** (6475-6476), chiama `jamLoadCustomProgression()` (5706) e `jamTogglePlay()` (5394). Eredita quindi dal motore jam: sync base/drum, evidenziazione accordo corrente, sequenza scale suggerite (commento di design 6199-6201). La tonalità è implicita negli accordi assoluti (`btBuildProg` li traspone rispetto a `BT.rootIdx`, 5262-5281).

### 4.5 Export / Import JSON

- Export: `songlabExport()` → `guitar-improv-canzoni.json` (6697-6704).
- Import: `#songlab-file` (9359) → `songlabImportFile` (6706-6736): array o oggetto singolo, valida solo `Array.isArray(s.sections)` (6717), rigenera id duplicati, coercizza a stringa (6718-6723). Append, non replace. Nessuna migrazione.

---

## 5. Stato & persistenza

### 5.1 Chiavi localStorage (TUTTE — grep su `*.html` + `js/*.js`, verificato)

| Chiave | Definita in | Contenuto | Versioning |
|---|---|---|---|
| `gil_songs_v1` | index.html:6204 | array di Song (SONGLAB) | **nessuno** (array nudo) |
| `gil_fc_v1` | js/srs-analytics.js:34 (`STORE_KEY`) | `{ schemaVersion:1, history[], settings, createdAt, updatedAt }` (srs-analytics.js:275) | `SCHEMA_VERSION=1` (js/srs-analytics.js:33) + `migrate()` non distruttiva (247-260); load tollera corrotto/quota (261-277) |

Uniche occorrenze di `localStorage`: index.html:6231, 6238; srs-analytics.js:235. `sessionStorage`/cookie/IndexedDB: assenti (verificato). Le impostazioni FC (tonalità/modo/zona) persistono in `gil_fc_v1.settings` (`persistSettings`, fc-ui.js:54).

**Non persiste nulla** di: tonalità/scala Fretboard, impostazioni jam (tonalità/modo/stile/BPM/mix), preset accordatore, stato CAGED/penta/triadi — solo in memoria (5.2).

### 5.2 Stato globale in memoria (variabili top-level)

| Oggetto | Riga | Dominio |
|---|---|---|
| `audioCtx`, `_reverbNode`, `_masterComp`, `_masterOut` | index.html:3677-3680 | catena audio condivisa |
| `FB_STATE` | 4195 | fretboard (all/nps + posizione) |
| `BT` | 5228 | backing: bpm 95, rootIdx 9 (A), 'dorian', 'rock', progression, useCustom/customProgression |
| `JLIVE`, `LIVE_SINGLE`, `LIVE_ANCHOR` | 5961, 5976, 5981 | mic live sul manico jam |
| `SONGLAB`, `SCL_FB` | 6205, 6499 | setlist + chord-lab |
| `TR_STATE` / `S7_STATE` / `N9_STATE` | 6779 / 7077 / 7311 | triadi / 7ª / 9ª (type+inversion+stringSet) |
| `CAGED_STATE`, `P5_STATE` | 7492, 8071 | CAGED, 5 box |
| `_navReturn` | 8429 | back contestuale |
| `METRO` | 8459 | metronomo |
| `CS_STATE` | 8680 | scala↔accordi (mode s2c/c2s) |
| `TUNER`, `MICFB`, `LOOPER` | 9864, 10147, 10330 | accordatore, manico live, looper |
| `_techInitialized`, `EQ_STATE`, `MDX_STATE` | 10822, 10927, 11279 | pagina tecnica |
| `FCUI._S` (S) | fc-ui.js:29-33 | stato UI Coscienza |
| `MIC` | js/pitch-loop.js:179-182 | shell mic FC.pitch |

Handler tutti `onclick` inline nell'HTML (es. 2870-2878); nessun modulo ES, nessuna event delegation.

---

## 6. Superficie API dei moduli FC.*

Caricamento: 5 `<script defer>` in coda al body (index.html:12183-12187), ordine pedagogy → fretboard-theory → pitch-loop → srs-analytics → fc-ui. Pattern UMD (global browser + CommonJS per i test).

| Modulo | Global | API pubblica (export) | Chiamato da | Test |
|---|---|---|---|---|
| pedagogy-engine.js | `PedagogyEngine` (r.21) | `DRILLS, PREREQ, WEIGHTS, BOX_INTERVALS, SCALES, NOTES, INTERVAL_LABELS, ZONES; cellToNote, midiToCells, dualLabels, octaveShapesOf, intervalFrom, cellId, pairId; newRec, updateRec, replay, computeIndexFromHistory; drillMastered, unlockedDrills, recomputeDrillState; initState, generateItem, nextItem, check, buildEvent, applyResult; planSession, buildSession; makeRng, shuffle` (546-561) | fc-ui.js:11 (uso: 50, 136-146, 222-241, 312, 335…); srs-analytics.js:58-64 (`resolveEngine`) | pedagogy-engine.test.js — 10 ✓ |
| fretboard-theory.js | `FretboardTheory` (r.19) | `TUNINGS, MODE_INTERVALS, SHARP_NAMES, FLAT_NAMES; noteAt, degreeOf, octaveShapes, deriveFrom, pitchClassFromFreq; spellScale, spellPitchClass, parseKey, parseNoteName; masteryCell` (201-210) | fc-ui.js:11; `buildNeck` (fc-ui.js:561-562) | fretboard-theory.test.js — 13 ✓ |
| pitch-loop.js | `PitchLoop` + `FC.pitch` (r.20) | core: `analyzeFrame, matchFrame, expectedMidi, expectedPitchClass, createSession, freqToMidiFloat, midiToFreq, pitchClassOf, parseNoteName`; shell: `listenForAnswer, requestMic, stopMic, isMicAvailable, micDenied` (259-267) | fc-ui.js:323 (drill 2/5/6), 487-491 (drill 7 downbeat), 468/542 (stopMic) | pitch-loop.test.js — 13 ✓ (**solo core**; shell mic non testata, dichiarato in test/pitch-loop.test.js:4-5) |
| srs-analytics.js | `SRSAnalytics` + `FC.store`/`FC.srs` (r.22) | `store:{KEY, SCHEMA_VERSION, initState, load, save, migrate, export, import}`; `srs:{cellItemId, pairItemId, parseItemId, SPACE_BY_DRILL, newBucket, updateBucket, bucketsFromHistory, bucketAccuracy, selectNext, masteryMap, coverage, reactionTrend, index, analytics, buildAttempt, record, setEngine, BOX_INTERVALS, FLUENT_MS}` (286-296) | fc-ui.js:71 (load), 54/334/498 (save/record), 107/170/194 (analytics), 55 (index) | srs-analytics.test.js — 14 ✓ |
| fc-ui.js | `FCUI = { init, _S, _tt }` (fc-ui.js:623) | — | index.html:2878; auto-init DOMContentLoaded (fc-ui.js:624-625) | **nessun test** (verificato) |

**Aggancio inverso (fc-ui → monolite)**: fc-ui legge i `const` top-level di index.html via ambiente lessicale condiviso, NON via `window` (commento fc-ui.js:398-399): `gBT()/gLIB()/gQUAL()` per `BT`, `CHORD_LIB`, `CHORD_QUAL_LABEL` (fc-ui.js:400-402); chiama `getAudioCtx()`, `btInit()`, `btBuildProg()`, `btSchedulerLoop()`, `btVisualLoop()` (407-419), `btChordAt()` (451). pitch-loop risolve `autocorrelate` e `TUNER.aRef` dal global scope (js/pitch-loop.js:192, 211).

---

## 7. Audio

- **AudioContext principale**: lazy in `getAudioCtx()` (index.html:3682-3689) con resume; master chain gain 0.82 → compressor → destination + convolver reverb sintetizzato (`_buildMasterChain` 3691-3717).
- **Dietro gesto utente: sì (verificato)** — call site solo in handler di click: `playScale` (3946), `btInit`←`jamTogglePlay` (5395/9251), `metroStart` (8463/9183), `looperGain` (10341), `tunerPlayRef` (9898), preview (7894, 7961, 8360). Il DOMContentLoaded (9131-9147) fa solo rendering.
- **Ma non è un contesto unico**: fino a **5 AudioContext** distinti: `audioCtx` (3684), `JLIVE.ctx` (6076), `TUNER.ctx` (10120), `MICFB.ctx` (10309), `MIC.ctx` di FC.pitch (js/pitch-loop.js:203-204; il drill 7 gli passa il contesto condiviso, fc-ui.js:490).
- **Backing generativo**: `BACKING_TRACKS` (4913) — 8 chiavi modali (major, dorian, phrygian, lydian, mixolydian, natural_minor, harmonic_minor, blues; 4914-4998) × 5 stili (rock, blues, metal, funk, ballad) + `DRUM_PATTERNS` per stile (5014-5047). Default: **A dorico · rock · 95 BPM** (`BT` 5228-5239). BPM slider 50-200 (9264), clamp 40-200 (`jamSetBPM` 5449-5450), tap tempo (`jamTap` 5456). Mix a 4 canali (9285-9307).
- **Progressione custom**: `parseChordSymbol` (5611), `parseProgressionInput` (5652), `jamLoadCustomProgression` (5706), chip rapidi (6187-6194), scale suggerite `JAM_SCALE_MAP` (5560).
- **Metronomo standalone**: `METRO` (8459), suddivisioni 4/8/12/16 (9186-9191); usa il BPM del jam ma è "indipendente dalla base" (etichetta 9193).
- **Mic**: YIN `autocorrelate` (9923); accordatore con 8 preset (9853) e A ref 432-446 Hz (9385); `MICFB` (10147); `JLIVE` (5961); Looper MediaRecorder + overdub con wrap di fase (10435, 10483).
- **Audio Enhancement**: reverb wet/duration/decay + distorsione + Test Sound (9489-9524).
- **Service worker / manifest PWA: assenti (verificato)** — grep = 0. Dipendenze runtime esterne: Google Fonts (34-36) e bridge cross-repo `improv_lab_bridge.js` da ssurli.github.io/guitarzorn (12194-12195).

---

## 8. Percorsi-chiave con conteggio tap

Convenzione: `<select>` nativo su mobile = 2 tap (apri picker + scegli). Avvio = `page-fretboard` attivo (2883). Il nav può richiedere +1 swipe su schermi stretti (113-122).

### P1 — Avvio → suonare su un backing in una tonalità scelta: **4 tap** (2 col default A dorico/rock/95)
1. nav "🎸 Basi" (2875) · 2-3. select `#jam-key` + opzione (9199) · 4. ▶ `#jam-play-btn` (9251 → `jamTogglePlay` 5394). (+2 per Modo 9216, +2 per Stile 9235, +n per BPM 9258-9265.)

### P2 — Avvio → canzone SONGLAB in play: **3 tap** (prima canzone) / **4 tap** (altra)
1. nav "🎸 Basi" (2875) · 2. subtab "🎼 Canzoni" (9153; il chart mostra già la corrente, `songlabLoad` 6234) · 3. (eventuale) pill canzone (6266-6270) · 4. "▶ Suona" (6452 → `songTogglePlay` 6464). Tonalità non scelta: implicita negli accordi.

### P3 — Avvio → scala sul fretboard in una tonalità: **4 tap** (0 per C maggiore, già renderizzata al load 9132)
1-2. select `#fb-key` + opzione (2890) · 3-4. select `#fb-scale` + opzione (2907) → `renderFretboard()` (4346).

### P4 — Avvio → accordare la chitarra: **3 tap** (+ dialog permesso mic al primo uso)
1. nav "🎸 Basi" (2875) · 2. subtab "🎵 Accordatore" (9154) · 3. "🎤 Avvia accordatore" (9392 → `tunerToggle` 10090, `getUserMedia` 10116).

### P5 — Avvio → sessione drill Coscienza: **2 tap** al primo quesito
1. nav "🧠 Coscienza" (2878, `FCUI.init`) · 2. "▶ Avvia sessione" (fc-ui.js:128-129 → `startSession` 221). Drill specifico: 2 tap (tap sulla riga della ladder, fc-ui.js:145); drill 7 target-tone parte backing+mic da sé (`ensureBacking` fc-ui.js:407).

Attrito trasversale: non esiste un selettore di tonalità globale — `#fb-key`, `#jam-key`, `#tr-key`, `#s7-key`, `#n9-key` e la tonalità FC sono indipendenti (verificato; il CSS `.global-key-wrap` 147-166 e 1520-1526 è **orfano**: nessun elemento nel markup lo usa).

---

## 9. Reperti IA espliciti (senza proposte)

### 9.1 Voci ridondanti
- **🎤 Manico Live (bpage-micfb, 9411) duplica "🎤 Suona live" dentro Basi** (9322 → `jamLiveToggle` 6047): stessa pipeline YIN+manico, stato separato (`MICFB` vs `JLIVE`; il commento 10144-10146 lo dichiara). Due AudioContext distinti per la stessa funzione.
- **Tre viste "manico + scala" parallele**: Fretboard (2883), manico jam (9347-9349), manico FC (fc-ui.js:547) + manico SVG del chord-lab (6582) — quattro renderer indipendenti dello stesso concetto.
- **Metronomo** dentro Basi (9181-9194) accanto al backing che già scandisce il tempo; usa lo stesso BPM ma trasporto separato (`METRO` 8459).
- Costanti teoriche duplicate: `NOTES` ×4 (index.html:3431; pedagogy-engine.js:39; fretboard-theory.js:23; pitch-loop.js:25) + cloni `NOTES_TECH` (10538), `MDX_NOTE_NAMES` (11278), `CM_NOTES` (11929), `NOTE_STRINGS` (9872).

### 9.2 Funzioni sepolte (valore alto, profondità/visibilità basse)
- **SONGLAB (setlist)**: tapDepth 2, terza voce di una subtab-bar, dentro la 6ª voce di un nav che scrolla (9153) — è l'unico contenuto creato dall'utente ed è il perno dei contratti UX.
- **Accordatore**: tapDepth 2 (9154) — tipicamente primo gesto di ogni sessione con chitarra reale.
- **Drill 7 target-tone** (sintesi di backing+mic+SRS): tapDepth 2-3 dentro Coscienza (fc-ui.js:145, 228), invisibile finché non si scorre la ladder.
- **Progressione custom jam** (`#jam-custom-chords`, 9169): il ponte testo→backing esiste già a d=1 ma non è collegato visivamente alla setlist se non passando da Canzoni.

### 9.3 Vicoli ciechi
- **🎛 Audio (9485-9534)**: nessuna subtab, nessun rimando in/out salvo il nav; 4 slider + Test Sound; le modifiche agiscono globalmente ma la pagina non porta da nessuna parte.
- **tpage-pratica (9542-9546)**: griglia statica senza azioni né link.
- **CSS orfano `.global-key-wrap`** (147-166, 1520-1526): resto di un selettore di tonalità globale mai presente nel markup attuale (il commento 2861 dice "logo + key selector" ma l'header contiene solo logo+immagine, 2862-2867).
- **`#inapp-banner`**: markup presente (2837-2848) ma auto-rimosso allo startup (2850-2857) — codice morto.
- **`guitar-improv.html`**: pagina-fantasma di solo redirect (10-11).

### 9.4 Incoerenze naming / icone
- "Tecnica" duplicato su due livelli: nav "⚡ Tecnica" (2877) → subtab "⚡ Tecnica" (9540) dentro sé stessa, con default però su "Pratica" (2877 forza `showTechSubpage('pratica')`).
- Icona 🎸 usata per tre cose diverse: nav "Basi" (2875), subtab "Basi" (9152), azione "repertorio" in SONGLAB (6278).
- La subtab si chiama "🎼 Canzoni" (9153) ma il titolo interno è "Chord Lab · Canzoni" (9352) e il codice la chiama SONGLAB (6204) — tre nomi per la stessa cosa.
- 🎤 usato sia per "Manico Live" (9155) sia per "Suona live" (9322) sia per i bottoni mic di FC (fc-ui.js:281) — non disambigua.
- La tab-bar di page-scales mescola due famiglie di view con due funzioni diverse (`showScalesSubpage` 3014-3016 vs `showChordScaleSubpage` 3017-3020) — incoerenza strutturale invisibile all'utente ma vincolante per il refactor.
- Nav testuale senza icone per le prime 4 voci, con icone per le ultime 5 (2870-2878).

### 9.5 Posizione e profondità della setlist (sintesi)
Setlist = SONGLAB, `bpage-canzoni` (9351), raggiungibile SOLO via nav "🎸 Basi" (2875, 6ª voce su 9 di un nav a scroll) → subtab "🎼 Canzoni" (9153, 2ª di 5). tapDepth 2; con play a 3 tap totali (P2). Nessun deep-link (nessun routing, §1). Infrastruttura pronta: storage (6204), CRUD (§4.2), export/import (§4.5), play nel motore jam (§4.4), ponti verso studio accordi (6650-6687) e repertorio maestri (6318).

---

## 10. Vincoli mobile

- **Viewport**: `width=device-width, initial-scale=1.0, minimum-scale=1.0` (index.html:5) + fix runtime per WebView in-app (6-17). `overflow-x:clip` sul body (71).
- **Breakpoint**: principale 900px (1503-1552); secondari 560px (277), 650px (908), 700px (1400), 760px (2530), 800px (1558, 2081), 480px (1841), 860px (2312), `prefers-reduced-motion` (2825).
- **Target touch**:
  - `.nav-btn` min-height **44px** (132, 1534) ✓
  - `.cpage-tab-btn` (tutte le subtab, incluse quelle che portano alla setlist): padding 8px 14px, font 12px, **nessun min-height** (2687-2690) → ~33px reali, sotto i 44px; idem `.tech-tab` (884-886) e `.inv-tab`/`.strset-tab`/`.cs-mode-tab` (2506-2516, 2058-2073).
  - select 40px e `.play-btn/.pos-btn/.tap-btn` 40px su mobile (1543-1544); play jam 64×64 (1689-1690) ✓.
  - Coscienza dichiara e rispetta ≥44px (fc-ui.js:4; CSS 12064, 12081-12089, 12130 56px, 12133 64px; celle 40×44, 12062/12104).
- **Navigazione tutta in alto** (header sticky 80-82; nav seconda riga 2868-2879). Nessuna bottom bar (assente, verificato). Uso a una mano: cambio pagina/subtab fuori zona pollice; transport jam raggiungibile solo dopo scroll.
- **Manico scrollabile**: `.fretboard` min-width 700px in wrap overflow-x:auto (249-263); manico FC idem con auto-scroll alla cella target (12099; fc-ui.js:581).
- Google Fonts remoto (34-36): offline → fallback di sistema.

---

## 11. Rischi per l'integrazione

1. **Accoppiamento lessicale fc-ui ↔ monolite** — fc-ui.js accede a `BT`, `CHORD_LIB`, `CHORD_QUAL_LABEL`, `getAudioCtx`, `btInit/btBuildProg/btSchedulerLoop/btVisualLoop/btChordAt` come identificatori globali non-window (fc-ui.js:398-419, 451): rinominarli/spostarli in index.html rompe il drill 7 in silenzio (fallback `typeof !== 'undefined'` → degrado non segnalato). Stesso pattern in pitch-loop per `autocorrelate`/`TUNER.aRef` (js/pitch-loop.js:192, 211).
2. **UI-as-state nel play SONGLAB** — `songTogglePlay` scrive la stringa accordi nell'input `#jam-custom-chords` e richiama `jamLoadCustomProgression` (6475-6477): qualunque ridisegno di bpage-basi che tocchi quell'input o l'ordine dei render rompe il play delle canzoni; inoltre `jamUpdateChordBlocks` chiama `songChartFollow` (6486) — dipendenza incrociata jam→songlab.
3. **Ordine di init fragile** — 14 init in sequenza fissa a DOMContentLoaded (9131-9147); moduli FC `defer` dopo (12183-12187) con auto-init proprio (fc-ui.js:624-625) e re-init ad ogni tap sul nav (2878); molte subpage sono lazy al primo tap (`initTechPage` 10824 + `_techInitialized` 10822, `micFbInit` 9155, `initTransition` 3384). Nuove schermate devono rispettare questo doppio regime eager/lazy.
4. **AudioContext multipli e clock diversi** — 5 contesti possibili (3684, 6076, 10120, 10309; pitch-loop.js:203-204): iOS limita il numero di contesti e i clock non sono confrontabili; il drill 7 già oggi forza il contesto condiviso e stoppa il mic (fc-ui.js:468, 490). Ogni feature audio/mic nuova deve scegliere esplicitamente il contesto.
5. **Persistenza SONGLAB senza versioning + cache GitHub Pages** — `gil_songs_v1` è un array nudo senza `schemaVersion` né `migrate()` (6229-6239), a differenza di `gil_fc_v1` (srs-analytics.js:33, 247-260): l'estensione Song dei contratti richiede la migrazione v1→v2 (00-contratti-dati.md:50-55). Non c'è service worker (verificato) quindi niente stale-SW, ma c'è cache HTTP di Pages su un singolo index.html da 556 KB (evidenza: build-tag manuale "build v8 · 05-07 17:20" nella UI, 9345) e una dipendenza runtime cross-repo non versionata (`improv_lab_bridge.js`, 12194-12195) fuori dal controllo di questo repo.
6. (minore) Costanti teoriche duplicate (§9.1) — modifiche enarmoniche da replicare a mano in 7+ posti.
7. (minore) Doppia famiglia di subpage su page-scales (§9.4) — ogni refactor della tab-bar deve gestire `spage-*` e `cspage-*` insieme (12045-12056).

---

*Fine audit. Nessuna proposta di redesign inclusa, come da mandato. GATE A: inventario costruito seguendo gli handler (`showPage`/`show*Subpage`/`showTechTab`/`setCsMode`/`setInversion`/`setStringSet`/subnav FCUI), ogni nodo con tapDepth e usage motivati, setlist e infrastruttura SONGLAB documentate con file:linea.*
