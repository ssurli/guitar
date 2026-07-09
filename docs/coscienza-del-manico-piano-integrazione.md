# Coscienza del Manico — Piano di integrazione & contratti dati

> Deliverable dell'orchestratore **prima di scrivere codice**. Tutti e 5 gli agenti
> leggono questo documento come fonte di verità condivisa. Nessun agente inizia a
> scrivere finché i contratti in §2 non sono ratificati.

Modalità operativa concordata: i prompt dei 5 agenti sono definiti qui (§4); l'orchestratore
implementa in sequenza nell'ordine di §3, ogni "agente" corrisponde a un modulo/namespace
isolato appeso al file esistente. **Zero modifiche distruttive** alle feature attuali.

---

## PARTE 0 — Metodo (tesi pedagogica vincolante)

Obiettivo unico: dalla *memoria delle forme* alla *coscienza del manico* — sapere in ogni
istante **nome** e **funzione** della nota suonata, anche in tempo reale nell'improvvisazione.

I quattro pilastri (tutti gli agenti li rispettano):

1. **Doppia etichettatura sempre attiva** — ogni nota porta sempre due etichette: nome
   assoluto (`A`) + grado nella tonalità/modo corrente (`♭3`). Nessun drill mostra o chiede
   una sola delle due: si allena la *connessione*.
2. **Ancora-e-deriva** — si insegnano prima forme d'ottava e intervalli-chiave; l'utente
   ricava ogni nota da un'ancora nota, non memorizza 72+ posizioni isolate.
3. **Richiamo attivo verificato** — dove possibile l'utente *suona* la risposta e lo YIN la
   verifica (produzione, non riconoscimento passivo).
4. **Ripetizione spaziata adattiva** — bucket alla Leitner per ogni cella `(corda, tasto)` e
   per ogni coppia `(tonalità, grado)`; riemergono i punti deboli, misurati per accuratezza e
   tempo di reazione.

**Indice di coscienza (0–100)** = media pesata di
`copertura_manico · accuratezza · velocità · applicazione`.

**Ladder dei 7 drill:**

| # | Drill | Risposta | Verifica |
|---|-------|----------|----------|
| 1 | Nomina nota (app evidenzia tasto → utente nomina) | tap/scelta | logica |
| 2 | Trova nota (app nomina → utente suona ovunque) | suono | YIN |
| 3 | Mappa ottave (suona tutte le ottave entro X sec) | suono | YIN |
| 4 | Nomina grado (data tonalità/modo, app evidenzia tasto → utente nomina il grado) | tap/scelta | logica |
| 5 | Trova grado ("suona la ♭7") | suono | YIN (pitch-class) |
| 6 | Salto d'intervallo ("da A, sesta maggiore sopra") | suono | YIN |
| 7 | **Target-tone improv** (sul backing: "atterra sulla 3ª" sul beat) | suono | YIN sul downbeat |

Il drill 7 è il vero obiettivo: coscienza in tempo reale dentro l'improvvisazione.

---

## 1 · (a) Moduli esistenti riusati e come

Ispezione di `index.html` (12.067 righe). Il nuovo modulo **riusa** — non riscrive — queste
primitive. Colonna "Come" = punto di aggancio esatto.

### 1.1 Pitch detection (YIN) — cuore della verifica (drill 2,3,5,6,7)

| Primitiva esistente | Riga | Come la riusiamo |
|---|---|---|
| `autocorrelate(buf, sampleRate)` | 9922 | YIN CMND → Hz o `-1`. Gate RMS 0.006, range 70–1320 Hz, soglia 0.12, interpolazione parabolica. **Chiamata as-is** dal loop FC. |
| `freqToNote(freq)` | 9905 | → `{name+ottava, cents, freq}` via `TUNER.aRef`. Riusata per display/log. |
| `stabilizePitch(hist, rawMidi)` | 6003 | Anti salto d'ottava (moda ultimi 5). Riusata nel confirm-buffer FC. |
| `livePickDots(fb, midi, state)` | 6019 | Ancora-e-deriva: sceglie l'unisono più vicino all'ancora/ultima posizione. Riusata per accendere la cella suonata sull'heatmap. |
| Config `getUserMedia` | 10302 | `{echoCancellation:false, noiseSuppression:false, autoGainControl:true}`, `fftSize 2048`, analisi ~20fps (`frame%3`). **Pattern replicato** nel loop FC. |
| `TUNER.aRef` | 9863 | Riferimento La (432–446). Letto, non modificato. |

### 1.2 Motore audio sintetizzato (feedback + eventuale sorgente sonora)

| Primitiva | Riga | Uso |
|---|---|---|
| `getAudioCtx()` / `_masterOut` | 3681/3690 | Context condiviso: FC non ne crea un secondo per il playback. |
| `playNote(freq, time, dur, dest, vel)` | 3815 | Feedback "nota giusta/sbagliata", riproduzione della nota-target nei drill di ascolto-guida. |
| `noteToFreq` / `midiToFreq` | 3940/5224 | Conversione per il playback. |
| `drumKick/Snare/Hihat`, `playChordSynth`, `playBassSynth` | 3981–4118 | **Non toccati**; il drill 7 ci si appoggia via BT (sotto). |

### 1.3 Backing track & beat — indispensabile per il drill 7

| Primitiva | Riga | Uso nel drill 7 |
|---|---|---|
| `BT` scheduler (lookahead Web Audio) | 5227 | Sorgente della griglia ritmica; FC **non** ricrea lo scheduler. |
| `btChordAt(absStep)` | 5288 | Accordo corrente → da cui derivare il target-tone ("3ª dell'accordo corrente"). |
| `BT.notesInQueue` `{step, loopStep, time}` | 5235/5300 | Il `time` (AudioContext clock) del **downbeat** è la finestra di verifica precisa — non usare RAF per il timing. |
| `jamHighlightChord(rootPc, chordType)` + `CHORD_LIB[t].ivs` | 5916/5095 | `ivs` = coppie `[semitono, funzione]` → estrai il pc del grado richiesto (R/3/5/♭7…). |
| `jamUpdateChordBlocks` / `jamUpdateLEDs` | 5367/5360 | Sync visuale beat; FC vi si aggancia in sola lettura. |

### 1.4 Teoria musicale (base della doppia etichettatura)

| Primitiva | Riga | Uso |
|---|---|---|
| `NOTES` / `NOTES_FLAT` / `NOTE_STRINGS` | 3430/3431/9871 | Nome assoluto pc→lettera. |
| `OPEN_STRINGS` `[4,11,7,2,9,4]`, `OPEN_STRING_MIDI` `[64,59,55,50,45,40]`, `STRING_NAMES` `['e','B','G','D','A','E']` | 3434–3436 | Geometria manico ↔ pitch (cella→midi→pc). |
| `INTERVAL_NAMES` `{0:'1',1:'♭2',…}` | 4338 | **Etichetta di grado** (la seconda etichetta). |
| `SCALES` + `getScaleDegree(key, semitones)` | 3439/3543 | Tonalità/modo correnti, gradi diatonici. |
| `getIntervalRole` | 4330 | Ruolo dell'intervallo nella scala. |

### 1.5 Rendering fretboard (heat-map & doppia etichetta)

| Primitiva | Riga | Uso |
|---|---|---|
| Geometria `micFbInit()` (fretWidths `58−f*1.1`, `OPEN_COL_W 40`, `NUT_W 14`, `STRING_HEIGHTS`) | 10155 | **Template replicato** per il fretboard FC (stesse misure = look coerente, scroll orizzontale già gestito). |
| Dot `dataset.midi/string/fret` (+ `dataset.pc` nel jam) | 10200/5925 | Identità cella e pitch-class: FC riusa gli stessi attributi dati. |
| `.fretboard-wrap` overflow-x + scrollbar mobile | 249–278 | Layout ~380px già risolto: FC riusa le classi. |

### 1.6 Navigazione, UI, persistenza

| Primitiva | Riga | Uso |
|---|---|---|
| `showPage(name, keepReturn)` + `<button class="nav-btn" onclick="showPage('X')">` + `<div id="page-X" class="page">` | 8412/2870 | Nuova pagina `page-coscienza` + un `nav-btn`. Unico ritocco al markup esistente. |
| Sub-tab pattern (`cpage-tab-btn`, `showCagedSubpage`) | 3212 | Modello per la ladder dei 7 drill come sotto-viste. |
| `navArm/navReturn` | 8430 | "← Torna" per i rimandi cross-pagina. |
| Persistenza `SONGLAB` (`localStorage`, key `gil_songs_v1`, try/catch `JSON.parse/stringify`, export/import via `Blob`) | 6198–6237 | **Pattern replicato** per lo stato FC (key `gil_fc_v1`). |

**Regola d'oro di integrazione:** ogni modulo FC vive in un unico blocco `<script>` con
namespace `FC.*` appeso prima di `</body>`; **non riscrive** funzioni esistenti, le *chiama*.
Le sole modifiche al codice esistente: (1) un `<button class="nav-btn">`; (2) un `<div
id="page-coscienza" class="page">` vuoto; (3) aggiunta di `coscienza` a `NAV_PAGE_LABELS`.

---

## 2 · (b) Contratti dati condivisi (interfacce tra i 5 componenti)

Tutti gli oggetti sono JSON-serializzabili (persistenza `localStorage`). Namespace globale:
`window.FC`. Convenzioni: `pc` = pitch-class 0–11 (0=C); `string` 0–5 (0=e cantino, 5=E basso);
`midi` = nota MIDI assoluta.

> ### ⚠ Nota di riconciliazione contratti (aggiornata in corso d'opera)
> Il brief dell'**Agente B** ha introdotto un set di contratti canonico più esplicito, da
> considerare **la fonte di verità** per l'integrazione finale (gli altri agenti vi si adeguano
> tramite un adapter sottile al momento del merge):
> - `Note = { string, fret, name, pitchClass, octave, midi, freq }` — usa **`pitchClass`** (non
>   `pc`) e aggiunge **`freq`**.
> - `DrillItem = { id, drillId, prompt, expected, responseType, verify, params }`.
> - `Attempt = { itemId, drillId, ok, latencyMs, playedPitchClass, cents, ts }` (era `DrillEvent`).
> - `MasteryCell = { string, fret, level(0-4), lastSeen, box }` (era `LeitnerRec`).
> - Etichette di grado in **ASCII** (`'b3'`, `'#4'`) — non unicode.
>
> **Impatto sui moduli già consegnati:** `PedagogyEngine` (Agente A) usa i nomi interni del
> piano (`pc`, `DrillEvent`, `LeitnerRec`, gradi unicode); resta valido e testato, ma al merge
> passa attraverso un mapper `Attempt ⇄ DrillEvent` e `pitchClass ⇄ pc`. `FretboardTheory`
> (Agente B) espone già i contratti canonici. Gli agenti C/D/E adottano i nomi dell'Agente B.

Segue lo schema `NoteRef` originale del piano (mantenuto per storicità; al merge → `Note`).

### 2.1 `NoteRef` — oggetto-nota atomico (doppia etichettatura incorporata)

```js
/**
 * @typedef {Object} NoteRef
 * @property {number} pc        // 0..11 pitch-class (= dataset.pc)
 * @property {number} midi      // 40..86 nota assoluta (pitch + ottava)
 * @property {number} string    // 0..5 (0=e cantino … 5=E basso) = dataset.string
 * @property {number} fret      // 0..21 = dataset.fret
 * @property {string} name      // NOTES[pc] — ETICHETTA ASSOLUTA
 * @property {number} octave    // Math.floor(midi/12) - 1
 * // --- contesto tonale (relativo a key/mode correnti; presenti solo se c'è contesto) ---
 * @property {number} [degreeSemitone] // (pc - keyPc + 12) % 12
 * @property {string} [degreeLabel]    // INTERVAL_NAMES[degreeSemitone] — ETICHETTA GRADO ('♭3')
 * @property {boolean}[inScale]        // se degreeSemitone ∈ SCALES[mode].intervals
 */
```

Helper canonici (esposti da `FC.core`, li implementa l'Architetto):
```js
FC.core.cellToNote(string, fret, ctx?) -> NoteRef   // ctx = {keyPc, mode}
FC.core.midiToCells(midi) -> NoteRef[]               // tutte le posizioni unisone
FC.core.degreeOf(pc, keyPc) -> {semitone, label}     // doppia etichetta
FC.core.octaveShapesOf(NoteRef) -> NoteRef[]          // ancora-e-deriva (drill 3)
FC.core.intervalFrom(NoteRef, semitones) -> NoteRef[] // salto d'intervallo (drill 6)
```

### 2.2 `DrillSpec` — cosa viene chiesto (Fretboard/UI → Loop)

```js
/**
 * @typedef {Object} DrillSpec
 * @property {number} drill      // 1..7
 * @property {number} keyPc      // tonalità corrente 0..11
 * @property {string} mode       // chiave in SCALES (es. 'ionian','dorian')
 * @property {'tap'|'choice'|'pitch'} method  // modo di risposta
 * @property {NoteRef|{pc:number,degreeSemitone:number}} target // cosa si chiede
 * @property {'note'|'pitchClass'|'chordTone'} matchKind // criterio di correttezza
 * @property {number} [beatTime] // AudioContext time del downbeat (SOLO drill 7)
 * @property {number} [windowMs] // finestra di verifica attorno al target
 * @property {string} promptText // consegna localizzata mostrata all'utente
 */
```

### 2.3 `DrillEvent` — esito di un tentativo (Loop/UI → Analytics)

Evento unico emesso da **ogni** drill (logica o YIN). È la valuta comune.

```js
/**
 * @typedef {Object} DrillEvent
 * @property {number} drill
 * @property {number} keyPc
 * @property {string} mode
 * @property {DrillSpec['target']} target
 * @property {Object}  response
 * @property {'tap'|'choice'|'pitch'} response.method
 * @property {*}       response.value        // etichetta scelta | NoteRef suonata
 * @property {number} [response.detectedMidi]
 * @property {number} [response.detectedPc]
 * @property {number} [response.cents]
 * @property {boolean} correct
 * @property {number}  rtMs                   // reaction time (prompt → risposta)
 * @property {number}  at                     // Date.now()
 * @property {string[]} cellIds               // celle coinvolte → SR per-cella
 * @property {string}  pairId                 // '<keyPc>:<degreeSemitone>' → SR per-coppia
 */
```

Bus eventi (disaccoppia produttori/consumatori):
```js
FC.bus.emit(event: DrillEvent)   // il Loop/UI pubblica
FC.bus.on(fn)                    // Analytics + UI si sottoscrivono
```

### 2.4 `LeitnerRec` — record di ripetizione spaziata (Analytics)

Due spazi SR indipendenti (PARTE 0 §4): **celle** `(corda,tasto)` e **coppie** `(tonalità,grado)`.

```js
/**
 * @typedef {Object} LeitnerRec
 * @property {string}  id         // cellId '<string>:<fret>'  |  pairId '<keyPc>:<degree>'
 * @property {number}  box        // 1..5 (Leitner); 1 = più frequente
 * @property {number}  due        // timestamp prossima revisione
 * @property {number}  seen
 * @property {number}  correct
 * @property {number}  ewmaRt     // reaction time EWMA (ms), α=0.3
 * @property {boolean} lastResult
 * @property {number}  lastSeen
 */
```

Scheduler (esposto da `FC.srs`):
```js
FC.srs.record(event)             // aggiorna box (promuove/retrocede) + due + ewmaRt
FC.srs.pickDue(space, ctx) -> id // seleziona il prossimo item debole/scaduto
FC.srs.boxIntervals = [0, 1, 3, 7, 21] // giorni-equivalenti per box 1..5 (tunable)
```
Regola Leitner: `correct` → `box = min(5, box+1)`; errore → `box = 1`.
`due = lastSeen + boxIntervals[box-1] * DAY` (adattivo; sessione singola usa scala compressa).

### 2.5 `ConsciousnessIndex` — indice sintetico 0–100 (Analytics → UI)

```js
/**
 * @typedef {Object} ConsciousnessIndex
 * @property {number} index        // 0..100 (arrotondato)
 * @property {number} coverage     // 0..1  % celle padroneggiate (box>=4)
 * @property {number} accuracy     // 0..1  accuratezza media pesata (recente)
 * @property {number} speed        // 0..1  velocità normalizzata (rt→[0,1])
 * @property {number} application  // 0..1  accuratezza chord-tone nel drill 7
 * @property {number} updatedAt
 */
```
Formula: `index = 100 * (Wc·coverage + Wa·accuracy + Ws·speed + Wp·application)`
con pesi default `Wc=0.30, Wa=0.30, Ws=0.20, Wp=0.20` (Σ=1, esposti come `FC.srs.weights`).
`speed` = `clamp(1 - (ewmaRt - RT_FLOOR)/(RT_CEIL - RT_FLOOR), 0, 1)` con `RT_FLOOR≈700ms`,
`RT_CEIL≈4000ms`.

### 2.6 `HeatCell` — dato heat-map manico (Analytics → Fretboard)

```js
/** @typedef {Object} HeatCell
 *  @property {string} cellId     // '<string>:<fret>'
 *  @property {number} mastery    // 0..1 (da box + accuratezza cella)
 *  @property {number} box        // 1..5
 */
FC.srs.heatmap(ctx?) -> HeatCell[]   // il Fretboard colora i dot in base a mastery
```

### 2.7 Stato persistito & chiave localStorage

```js
const FC_LS_KEY = 'gil_fc_v1';         // segue la convenzione 'gil_*_v<n>'
/** @typedef {Object} FCState
 *  @property {number} version           // 1
 *  @property {Object<string,LeitnerRec>} cells   // per-cella
 *  @property {Object<string,LeitnerRec>} pairs   // per-coppia
 *  @property {DrillEvent[]} events       // ring buffer (cap ~500) per analytics/velocità
 *  @property {ConsciousnessIndex} consciousness
 *  @property {Object} settings           // {keyPc, mode, tier, weights?}
 */
FC.store.load() -> FCState               // try/catch, default se assente/corrotto
FC.store.save()                          // debounced (≤1/sec), try/catch quota
FC.store.export() / FC.store.import(json)// Blob JSON, come SONGLAB
```

### 2.8 Contratto di verifica pitch (Loop) — anti-falsi-positivi

```js
/** Conferma un pitch suonato contro un target, con debounce multi-frame.
 *  @returns {{ok:boolean, cents:number, matchedMidi:number, byPitchClass:boolean}}
 */
FC.pitch.verify(detectedFreq, target, {matchKind, centsTol=35, minFrames=3}) -> Result
FC.pitch.startListen(spec: DrillSpec, onResult) -> stopFn   // apre mic, confronta, chiama onResult
```
Requisiti di conferma (mitigazione armoniche/transiente):
- N frame consecutivi coerenti (`minFrames`, default 3) via `stabilizePitch`;
- `|cents| ≤ centsTol`;
- scarta i primi ~60 ms (transiente d'attacco/pick noise);
- `matchKind==='pitchClass'|'chordTone'` → confronto solo su `pc` (tollera slittamenti d'ottava);
- `matchKind==='note'` → richiede `midi` esatto (drill 6 può richiedere ottava).

---

## 3 · (c) Ordine di esecuzione degli agenti

Dipendenze → un ordine con una fase parallela. Ogni agente = un modulo/namespace isolato.

```
   ┌─────────────────────────────────────────────────────────────┐
   │ FASE 1  (blocca tutti)                                       │
   │  ① Architetto del Metodo                                     │
   │     → ratifica §2, implementa FC.core (teoria, doppia        │
   │       etichetta, ancora-e-deriva) + scheletro FC.bus/FC.store│
   └───────────────┬─────────────────────────────────────────────┘
                   │ contratti + FC.core disponibili
        ┌──────────┴───────────┐
        ▼                      ▼
   ┌──────────────┐     ┌──────────────────────────┐
   │ FASE 2a      │     │ FASE 2b (parallelo)       │
   │ ② Motore     │     │ ④ Ripetizione Spaziata    │
   │   Fretboard  │     │   & Analytics (FC.srs)    │
   │   & Doppia   │     │   consuma DrillEvent dal   │
   │   Etichetta  │     │   bus; non dipende da UI   │
   │  (render+    │     └──────────────────────────┘
   │   heatmap)   │
   └──────┬───────┘
          │ fretboard con dot dataset + heatmap host
          ▼
   ┌────────────────────────────────┐
   │ FASE 3                          │
   │ ③ Loop Pitch-Detection          │
   │   FC.pitch.* — verifica YIN,     │
   │   accende celle via Fretboard,   │
   │   emette DrillEvent sul bus      │
   └──────────────┬─────────────────┘
                  ▼
   ┌────────────────────────────────────────────┐
   │ FASE 4 (integra tutto)                      │
   │ ⑤ UI/UX — pagina, nav-btn, ladder 7 drill,  │
   │   dashboard indice + heatmap, mobile 380px,  │
   │   cablaggio dei moduli e persistenza         │
   └────────────────────────────────────────────┘
```

Razionale: **①** definisce i tipi → nessuno parte prima. **②** e **④** non si toccano (uno
disegna, l'altro calcola su eventi) → parallelizzabili. **③** ha bisogno del fretboard (per
accendere la cella suonata) e dei contratti → dopo ②. **⑤** cabla e rifinisce → ultimo.

Ordine di merge nel file (per minimizzare i diff): `FC.core` → `FC.store`/`FC.bus` →
`FC.srs` → `FC.render` (fretboard+heatmap) → `FC.pitch` → `FC.ui` → markup (nav + page).

---

## 4 · (d) Rischi & mitigazioni

### R1 — Latenza YIN
`fftSize 2048` ≈ 46 ms/finestra @44.1 kHz; analisi ~20 fps (`frame%3`); conferma multi-frame →
**80–150 ms** di latenza percepita.
- **Drill 2/3/5/6** (non a tempo): accettabile; mostra un feedback "in ascolto → confermato".
- **Drill 7** (a tempo): **non** usare RAF per il downbeat. Leggi il `time` (clock AudioContext)
  da `BT.notesInQueue`, **pre-arma** il target prima del beat, apri una finestra `[beatTime−40ms,
  beatTime+windowMs]` (default `windowMs≈180`) e valuta il picco di stabilità dentro la finestra.
  Il giudizio "atterrato sulla 3ª sul beat" tollera la latenza perché ancorato all'orologio audio.

### R2 — Falsi positivi armonici / errori d'ottava
YIN CMND + `stabilizePitch` (moda di 5) già riducono i salti d'ottava; le corde gravi (E2≈82 Hz)
sono coperte dal gate RMS 0.006 e dal range 70–1320 Hz.
- Confronto per **pitch-class** nei drill 5/7 (tollera slittamenti d'ottava).
- `|cents| ≤ 35`, `minFrames ≥ 3`, scarto del transiente d'attacco (~60 ms).
- Rifiuto se RMS < gate (già in `autocorrelate`) → niente trigger su rumore/riverbero.

### R3 — Mobile
- **Collisione microfono**: `TUNER`, `MICFB`, `JLIVE` aprono **ciascuno** un proprio
  `AudioContext`+stream. FC **deve** garantire mutua esclusione: prima di `startListen`,
  fermare eventuali loop mic attivi (o riusare un singolo stream FC) e rilasciare i track allo
  stop. Contratto: `FC.pitch` possiede un solo stream, lo chiude su `stop`/`visibilitychange`.
- **Gesto utente**: `AudioContext`/`getUserMedia` partono solo dopo tap (già gestito altrove);
  la ladder FC apre il mic al primo "Avvia".
- **Viewport ~380px**: riuso `.fretboard-wrap` (overflow-x + scrollbar), dot ≥28px (open),
  target touch adeguati; dashboard a colonna singola.
- **Batteria/CPU**: throttling già a ~20fps; `cancelAnimationFrame` + stop mic su tab nascosta
  (`visibilitychange`); heatmap ridisegnata solo su evento, non ogni frame.

### R4 — File monolitico (integrazione)
Un solo `index.html` di 12k righe: edit concorrenti = conflitti.
- Ogni modulo in **un blocco `<script>` con namespace `FC.*`**; nessuna riscrittura di
  funzioni esistenti (solo chiamate). Modifiche al markup esistente limitate a 3 punti (§1.6).
- Regressione zero: le pagine/handler esistenti non vengono toccati; test manuale di
  fretboard, CAGED, jam, tuner, backing track dopo l'integrazione.

### R5 — Persistenza
`localStorage` può essere pieno/negato (Safari privato).
- `try/catch` su load/save (come `SONGLAB`), `save()` **debounced**, ring buffer eventi cap ~500.
- `version` nello stato per migrazioni future; export/import JSON come backup manuale.

---

## 5 · Prompt di delega ai 5 agenti

Ogni prompt è autosufficiente e cita solo i contratti di §2 + le primitive di §1. Vincoli comuni
a **tutti**: (i) namespace `FC.*` in un blocco `<script>` isolato; (ii) nessuna dipendenza
esterna nuova; (iii) non riscrivere funzioni esistenti, chiamarle; (iv) mobile-first ~380px,
touch; (v) persistenza solo `localStorage` key `gil_fc_v1`; (vi) rispetta i 4 pilastri PARTE 0.

---

### ① Agente — Architetto del Metodo  *(FASE 1, blocca tutti)*

> **Missione.** Sei il custode della tesi pedagogica. Ratifica i contratti dati (§2) e
> implementa `FC.core`: il livello teorico che traduce geometria del manico ↔ pitch ↔ doppia
> etichettatura, più lo scheletro `FC.bus` (event bus) e `FC.store` (stato+localStorage).
>
> **Riusa (non riscrivere):** `NOTES`/`NOTE_STRINGS` (3430/9871), `OPEN_STRING_MIDI`
> `[64,59,55,50,45,40]` e `STRING_NAMES` (3435/3436), `INTERVAL_NAMES` (4338), `SCALES` +
> `getScaleDegree` (3439/3543), `getIntervalRole` (4330). Pattern persistenza da `SONGLAB`
> (6198–6237).
>
> **Implementa:**
> - `FC.core.cellToNote(string,fret,ctx)`, `midiToCells(midi)`, `degreeOf(pc,keyPc)`,
>   `octaveShapesOf(noteRef)` (ancora-e-deriva/ottave, drill 3), `intervalFrom(noteRef,semitones)`
>   (drill 6). Ogni `NoteRef` porta **sempre** `name` + `degreeLabel` quando c'è contesto tonale.
> - `FC.bus.emit/on` (pub/sub sincrono minimale).
> - `FC.store.load/save/export/import` su `FC_LS_KEY='gil_fc_v1'`, con `try/catch`, `save`
>   debounced, `version:1`, ring buffer eventi cap 500.
> - `FC.srs.weights` e le costanti condivise (`boxIntervals`, `RT_FLOOR/CEIL`) come *default*
>   che l'Analytics userà.
>
> **Done-criteria.** Tutti i tipi di §2 hanno un helper o uno stub tipizzato; `FC.core` supera
> casi noti (es. `cellToNote(5,3)` → G2 pc7; in A dorian `degreeOf(7,9)` → `♭7`). Nessun altro
> agente parte finché questo non è verde.

---

### ② Agente — Motore Fretboard & Doppia Etichettatura  *(FASE 2a)*

> **Missione.** Rendi il manico FC: griglia interattiva con **doppia etichetta sempre attiva**
> (nome assoluto + grado) e overlay **heat-map** della coscienza. È il "canvas" su cui gli altri
> accendono celle.
>
> **Riusa:** geometria di `micFbInit()` (10155): `fretWidths=58−f*1.1`, `OPEN_COL_W=40`,
> `NUT_W=14`, `STRING_HEIGHTS`; dot con `dataset.midi/string/fret` **e `dataset.pc`**; classi
> `.fretboard-wrap`/scrollbar (249–278). Colori grado da `INTERVAL_NAMES`. `livePickDots` (6019)
> per la selezione ancora-e-deriva.
>
> **Implementa (`FC.render`):**
> - `FC.render.buildFretboard(hostEl, opts)` — costruisce i dot; ogni dot mostra **due righe**:
>   nome assoluto + grado (toggle di enfasi ma entrambi presenti/derivabili).
> - `FC.render.setContext({keyPc,mode})` — ricalcola i gradi (chiama `FC.core.degreeOf`).
> - `FC.render.highlightCell(cellId, cls)` / `clear()` — API che il Loop usa per accendere la
>   nota suonata / il target.
> - `FC.render.applyHeatmap(HeatCell[])` — colora i dot per `mastery` (0..1). Consuma
>   `FC.srs.heatmap()`.
>
> **Vincoli.** Scroll orizzontale a 380px senza rompere il layout; le due etichette leggibili su
> dot piccoli (usa il display secondario/tooltip se serve, ma la doppia etichetta non sparisce
> mai — pilastro 1). Nessun accesso al microfono qui.
>
> **Done-criteria.** Il manico si renderizza a 380px con doppia etichetta; cambiando `keyPc/mode`
> i gradi si aggiornano; `applyHeatmap` colora coerentemente; `highlightCell` accende la cella giusta.

---

### ③ Agente — Loop Pitch-Detection  *(FASE 3)*

> **Missione.** Il "richiamo attivo verificato": l'utente suona, lo YIN conferma. Costruisci
> `FC.pitch` per i drill 2,3,5,6,7, con anti-falsi-positivi e — per il drill 7 — verifica
> ancorata al **downbeat** dell'orologio audio.
>
> **Riusa:** `autocorrelate` (9922), `freqToNote` (9905), `stabilizePitch` (6003), config
> `getUserMedia`/analyser (10302–10313). Per il drill 7: `btChordAt` (5288), `BT.notesInQueue`
> `{time}` (5235), `CHORD_LIB[t].ivs` (5095) via `FC.core` per derivare il pc del grado-target.
>
> **Implementa:**
> - `FC.pitch.verify(freq, target, {matchKind, centsTol=35, minFrames=3})` → §2.8.
> - `FC.pitch.startListen(spec, onResult) -> stopFn` — apre **un solo** stream, loop ~20fps,
>   conferma multi-frame, scarta transiente ~60ms; accende la cella via `FC.render.highlightCell`;
>   al successo/timeout costruisce un `DrillEvent` completo (con `cellIds`, `pairId`, `rtMs`,
>   `cents`) e lo pubblica con `FC.bus.emit`.
> - Drill 7: pre-arma il target-tone (grado dell'accordo `btChordAt`), apre finestra
>   `[beatTime−40ms, beatTime+windowMs≈180]`, valuta la stabilità nel picco → correct/miss.
>
> **Vincoli critici.** **Mutua esclusione microfono**: prima di aprire, ferma `TUNER/MICFB/JLIVE`
> se attivi (o coordina un unico stream); rilascia i track su `stop` e su `visibilitychange`
> (tab nascosta). Confronto per `pc` nei drill 5/7 (tollera ottave).
>
> **Done-criteria.** Suonando la nota giusta il loop conferma in <200ms ed emette un `DrillEvent`
> `correct:true`; note sbagliate/rumore non falsano; drill 7 giudica correttamente sul beat; niente
> stream mic orfani dopo lo stop.

---

### ④ Agente — Ripetizione Spaziata & Analytics  *(FASE 2b, parallelo a ②)*

> **Missione.** Il cervello adattivo: bucket alla Leitner per **celle** `(corda,tasto)` e
> **coppie** `(tonalità,grado)`, indice di coscienza 0–100, dati per la heat-map. Consumi
> `DrillEvent` dal bus; non conosci UI né rendering.
>
> **Riusa:** `FC.store` (stato/persistenza), `FC.bus.on` (sottoscrizione eventi), `FC.srs.weights`
> e costanti dall'Architetto.
>
> **Implementa (`FC.srs`):**
> - `FC.srs.record(event)` — aggiorna il `LeitnerRec` di ogni `cellId` e del `pairId`: `correct`
>   → `box=min(5,box+1)`, errore → `box=1`; ricalcola `due` da `boxIntervals`; `ewmaRt` (α=0.3).
> - `FC.srs.pickDue(space, ctx)` — sceglie l'item più debole/scaduto (privilegia box bassi e
>   `due` passato) per far riemergere i punti deboli.
> - `FC.srs.consciousness()` → `ConsciousnessIndex`: `coverage` (% celle box≥4), `accuracy`
>   (media recente pesata), `speed` (da `ewmaRt` normalizzato con `RT_FLOOR/CEIL`), `application`
>   (accuratezza chord-tone sui `DrillEvent` drill 7). Indice = combinazione pesata (§2.5).
> - `FC.srs.heatmap(ctx)` → `HeatCell[]` (mastery 0..1 per cella).
> - Si sottoscrive a `FC.bus` e chiama `FC.store.save()` (debounced) dopo ogni update.
>
> **Done-criteria.** Una sequenza di `DrillEvent` fa salire/scendere i box correttamente;
> `pickDue` ripropone gli item deboli; l'indice 0–100 si muove in modo sensato; heatmap coerente
> con i box; stato sopravvive al reload (localStorage).

---

### ⑤ Agente — UI/UX  *(FASE 4, integra)*

> **Missione.** Confeziona l'esperienza: nuova pagina, ladder dei 7 drill, dashboard indice +
> heat-map, e cabla i moduli. Mobile-first ~380px, touch.
>
> **Riusa:** `showPage`/`nav-btn`/`.page` (8412/2870), sub-tab pattern `cpage-tab-btn` (3212),
> `navArm/navReturn` (8430), stili esistenti (`.nav-btn`, `.fretboard-wrap`, `.beat-led`, card).
> Aggiungi `coscienza` a `NAV_PAGE_LABELS` (8427).
>
> **Implementa (`FC.ui`):**
> - Markup: **un** `<button class="nav-btn" onclick="showPage('coscienza')">🧠 Coscienza</button>`
>   e **un** `<div id="page-coscienza" class="page">` (unici ritocchi al markup esistente).
> - Ladder 7 drill come sotto-viste (drill 1 & 4 = tap/scelta con verifica logica → emette
>   `DrillEvent`; drill 2,3,5,6,7 = delega a `FC.pitch.startListen`).
> - Selettore tonalità/modo → `FC.render.setContext` + `FC.store.settings`.
> - Dashboard: gauge indice di coscienza (0–100) + 4 sotto-metriche + **heat-map** del manico
>   (`FC.render.applyHeatmap(FC.srs.heatmap())`), aggiornata su evento bus.
> - Prossimo item da `FC.srs.pickDue` per guidare la sessione (ripetizione spaziata visibile).
> - Bottone export/import (`FC.store.export/import`).
>
> **Vincoli.** Colonna singola a 380px, target touch ≥40px, nessun overflow orizzontale (eccetto
> il manico che scrolla). Doppia etichetta sempre visibile nei drill (pilastro 1). Avvio mic solo
> su tap. Non rompere le pagine esistenti.
>
> **Done-criteria.** I 7 drill sono giocabili end-to-end su mobile; l'indice e la heat-map si
> aggiornano dopo i tentativi; navigazione e feature esistenti intatte; stato persistito e
> ripristinato al reload.

---

## 6 · Sequenza di implementazione (orchestratore)

1. **①** `FC.core` + `FC.store` + `FC.bus` (contratti vivi).
2. **④** `FC.srs` ‖ **②** `FC.render` (paralleli logici, merge serializzato).
3. **③** `FC.pitch` (verifica YIN + drill 7 su downbeat).
4. **⑤** `FC.ui` + markup (nav + page) → cablaggio finale.
5. **Verifica di non-regressione**: fretboard, scale, CAGED, penta5, circolo, jam/backing, tuner,
   mic-fretboard funzionano come prima. Test manuale mobile ~380px.
6. Commit incrementali sul branch `claude/guitar-fretboard-consciousness-s5c1bw`.

> Prossimo passo operativo: su tuo via, procedo dalla FASE 1 (`FC.core`) integrando tutto nel
> blocco `<script>` FC prima di `</body>`, con commit per fase.
