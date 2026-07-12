# IA_REDESIGN — Nuova architettura informativa e navigazione (Agente C)

> **Pacchetto UX Setlist-as-Launchpad · Agente C.** Solo design, zero codice.
> Input: `00-contratti-dati.md` (contratti congelati — nessuno schema dati viene
> modificato qui), `IA_AUDIT.md` (Agente A, 44 viste / 47 nodi MenuNode),
> `HEURISTICS.md` (Agente B, 23 FrictionPt, Top-10 = mandato), `PIANO_INTEGRAZIONE.md`.
> Output per D: tabella MenuNode target + mappa transizioni + modello di stato,
> come richiesto dai contratti (00-contratti-dati.md:61-62).

**Principio guida: consolidare prima di aggiungere.** Le 9 voci nav attuali sono
il prodotto di accrezione (B-01): si riducono a **4 destinazioni base + 2 controlli
persistenti in header**, senza uccidere nessuna funzione (mapping completo in §3).
La Setlist diventa voce di primo livello **e** vista d'avvio (B-03).

---

## 0. Le tre decisioni strutturali (sintesi, motivate)

| # | Decisione | FrictionPt / dato che la motiva |
|---|---|---|
| D1 | **Bottom-nav fissa a 4 voci** (Setlist · Suona · Manico · Allena) al posto delle 9 voci in header sticky top a scroll nascosto | B-01 (sev 4: 9 voci, ~4-5 visibili, scrollbar soppressa, "Basi" usage-3 fuori schermo all'avvio) + B-02 (sev 4: 100% della nav fuori zona pollice, legge di Fitts). Introdurre la bottom-nav è una decisione di redesign vera — oggi non esiste (audit §10) — ed è l'unico modo di soddisfare insieme "voci usage-3 sempre visibili" e "navigazione in zona pollice". 4 voci su ~390px = ~97px l'una, target ≥44px garantito senza scroll. |
| D2 | **Setlist = vista d'avvio (prima esecuzione) + ripristino dell'ultimo contesto (esecuzioni successive)** | B-03 (sev 4: l'unico contenuto creato dall'utente è a d=2 dietro una voce fuori schermo; "la setlist non è mai il punto d'ingresso") + B-08 (refresh=reset, il costo si ripaga a ogni avvio) + B-12 (nessuno stato di lancio indirizzabile). Chi usa abitualmente il Fretboard lo ritrova a d=0 via ripristino: nessun peggioramento per l'abitudine, guadagno secco per il contesto live. |
| D3 | **Tonalità globale in header** (unica sorgente di verità, propagata a fretboard/jam/triadi/7ª/9ª/penta/CAGED; la canzone la imposta al lancio) | B-05 (sev 4: 5+ selettori indipendenti, incoerenza silenziosa; il CSS `.global-key-wrap` index.html:147-166 è orfano — il redesign lo riattiva invece di inventare markup nuovo) + vincolo (e) continuità canzone→scala→backing→drill. |

---

## 1. Nuovo albero di navigazione (ASCII completo)

Convenzioni come nell'audit: `[d=N]` = tap minimi dall'avvio a freddo (prima
esecuzione, avvio su Setlist·Elenco); il default attivo eredita la profondità del
genitore. Ogni hub **ricorda l'ultima subtab attiva** (persistita, §4.3): dalla
seconda visita in poi le subtab d=2 costano di fatto d=1.

```
AVVIO → Setlist·Elenco (prima esecuzione) | ultima vista persistita (esecuzioni successive)
│
├─ HEADER (sticky top, alleggerito: solo logo + 2 controlli persistenti)
│   ├─ ♪ TONALITÀ GLOBALE [d=1] — badge tonalità corrente; tap → bottom-sheet chip 12 tonalità ≥44px
│   │     (riusa il CSS orfano .global-key-wrap 147-166; sheet in zona pollice, B-15)
│   └─ 🎵 ACCORDATORE [d=1] — icona persistente; tap = apre E AVVIA l'ascolto
│         (il tap è il gesto utente richiesto da AudioContext; era d=2+avvio, B-14)
│
├─ BOTTOM-NAV fissa (4 voci, ~97px l'una su 390px, ≥44px, MAI scroll) ← B-01, B-02
│
├─ 🎼 SETLIST [d=0 all'avvio; 1 tap da altrove] ← era jam.canzoni a d=2 (B-03)
│   ├─ Elenco [default] — canzoni raggruppate per Set 1 / Set 2 / Bis (contratto Setlist),
│   │   │  riga ≥44px: titolo + badge tonalità (launch.fretboardKey) + pallino status + ▶ inline
│   │   ├─ ▶ inline sulla riga [d=1] → LANCIO IMMEDIATO (songlabLaunch, §5) — 1 tap e suona
│   │   ├─ tap riga [d=1] → SCHEDA CANZONE (launch view, §5)
│   │   │    ├─ chart grande + accordo corrente ingrandito in play (spec per E, B-11)
│   │   │    ├─ ▶ Suona (64px, zona pollice) · chip: 🎸 Manico in tonalità · CAGED focus ·
│   │   │    │   🎯 Drill target-tone · ✏️ Modifica
│   │   │    └─ tap accordo → CHORD-LAB [d=2] (songOpenChord esistente)
│   │   │         └─ 🎯 Studia → Triadi/7ª/9ª con return-stack (§4.2)
│   │   ├─ ✏️ Modifica [d=2] → EDITOR (songlabRenderEditor esistente: sezioni, accordi)
│   │   └─ azioni elenco: ＋ nuova · 📚 repertorio (songlabAddFromRepertoire) ·
│   │       ⬇ export · ⬆ import (tutte esistenti)
│   └─ (in play) VISTA PERFORMANCE: chart che segue, accordo corrente/prossimo leggibili
│       a distanza-leggìo (vincolo per E, B-10/B-11); stop/BPM nel transport sticky
│
├─ ▶ SUONA [d=1] ← era 🎸 Basi (usage 3, 6ª di 9 e fuori schermo, B-01)
│   ├─ Basi [d=1 default] — motore jam esistente, RIORDINATO:
│   │   ├─ TRANSPORT STICKY IN BASSO (▶ 64px + BPM ±/TAP), docked sopra la bottom-nav ← B-09
│   │   ├─ tonalità = chip-row 12 tonalità ≥44px legata alla TONALITÀ GLOBALE (1 tap) ← B-05, B-15
│   │   ├─ Modo/Stile (select esistenti) · progressione custom #jam-custom-chords + chip rapidi
│   │   ├─ metronomo standalone (resta qui, sotto i controlli backing, non sopra — B-09)
│   │   ├─ mix Master/Drums/Bass/Chords
│   │   └─ banner "sta suonando: <canzone>" quando la sorgente è la setlist (spec per D, B-13)
│   ├─ 🎤 Live [d=2] — UNIFICA "Manico Live" (bpage-micfb) + "Suona live" (jamLiveToggle) ← B-23
│   ├─ 🔁 Looper [d=2] — invariato
│   └─ 🎛 Suono [d=2] — ex page-audio (4 slider reverb/distorsione + Test Sound) ← B-16, usage 0
│
├─ 🎸 MANICO [d=1] ← consolida 5 voci nav (Fretboard, Scale&Accordi, CAGED, Penta, Circolo) — B-01
│   ├─ Fretboard [d=1 default] — tonalità/scala inizializzate dalla TONALITÀ GLOBALE (B-05);
│   │     modalità all/3nps/tecnica, ▶ Play scala: invariati
│   ├─ Scale [d=2] — spage-scales; segmented: Scale [default] | Modi [d=3]
│   ├─ Accordi [d=2] — default Triadi (usage 2, target di songlabGoStudy: profondità invariata)
│   │   ├─ Triadi [d=2 default] — tab tipo + Inversione ×3 + Set corde ×5 [d=3, invariati]
│   │   ├─ Acc. 7ª [d=3] — tab tipo + Inversione ×4 + Set corde ×3 [d=4… no: restano
│   │   │     controlli interni alla vista, d=3 come oggi contati alla vista attiva]
│   │   ├─ Acc. 9ª [d=3] — tab tipo
│   │   ├─ Scala↔Accordi [d=3] — s2c [default] | c2s [d=4]
│   │   └─ Progressioni [d=3] — con modale accordo (openChordPopup) [d=4]
│   ├─ CAGED [d=2] — segmented: Forme [default] | Modi diatonici [d=3] | Sistema Connesso [d=3]
│   ├─ Penta [d=2] — 5 box, quality/key/box (key dalla TONALITÀ GLOBALE)
│   └─ Circolo [d=2] — segmented: Quinte [default] | Transizione Modale [d=3]
│
└─ 🧠 ALLENA [d=1] ← consolida Tecnica + Coscienza (entrambe usage 2, oggi 8ª e 9ª voce,
    │                  sempre fuori schermo all'avvio — B-01)
    ├─ Coscienza [d=1 default] — subnav FCUI invariata: Allena [default] | Manico [d=2] | Progressi [d=2]
    │     └─ ▶ Avvia sessione [d=2] · ladder drill [d=2] · drill 7 target-tone [d=2]
    ├─ ⚡ Tecnica [d=2] — DIVENTA LA SECONDA VOCE, default interno sweep; 10 tech-tab [d=3] invariati
    └─ 📖 Guide [d=2] — ex tpage-pratica (griglia statica PRACTICE_DATA) ← B-21: mai più default
```

**Profondità massima**: 4 tap, solo su foglie usage-1 (c2s, modale accordo di
Progressioni). Massimo invariato a 3 per tutto ciò che ha usage ≥2. Nessuno
scroll/swipe nascosto in nessuna barra: le subtab-bar hanno max 6 voci ≥44px
(vincolo per E: B-06, B-19 — una sola classe tab, `min-height:44px`).

---

## 2. Menu base: 4 voci + 2 controlli header — motivazione voce per voce

### 2.1 Le 4 voci della bottom-nav

| Voce | Icona | Contenuto | Perché è nel menu base (usage/tapDepth di A + FrictionPt di B) |
|---|---|---|---|
| **Setlist** | 🎼 | SONGLAB promosso: elenco per set, scheda-lancio, editor, repertorio, chord-lab | Unico contenuto creato dall'utente (audit §9.2), uso potenziale 3 (audit §3, riga jam.canzoni), perno dei contratti (principio 7). Oggi a d=2 dietro nav fuori schermo (B-03, P=12). Nome unico "Setlist" chiude anche B-17 (3 nomi per la stessa cosa). |
| **Suona** | ▶ | Motore jam (basi generative + progressione custom), Live unificato, Looper, Suono | usage 3 — "è il suonare" (audit §3, riga jam). Oggi 6ª di 9, fuori schermo all'avvio (B-01). Il transport, controllo più usato, passa da sotto-il-fold a sticky in zona pollice (B-09, B-02). |
| **Manico** | 🎸 | Fretboard (default) + Scale + Accordi + CAGED + Penta + Circolo | Famiglia "improv/teoria" cresciuta per accrezione: 5 voci nav che insieme valgono usage 2-3 ma si cannibalizzano lo spazio (B-01). Fretboard usage 3 resta default del hub; con la tonalità globale (B-05) arriva già configurato, eliminando il difetto "C maggiore che quasi mai è il contesto voluto" (B-18). |
| **Allena** | 🧠 | Coscienza (default) + Tecnica + Guide | Famiglia training: due voci usage 2 (audit §3) oggi 8ª e 9ª, le più penalizzate dallo scroll nascosto (B-01). Il drill quotidiano resta a 2 tap (P5 audit). Default su Coscienza; Tecnica default interno su sweep, mai più su Pratica (B-21). |

### 2.2 I 2 controlli persistenti in header (non sono "voci": nessuna pagina propria nel nav)

| Controllo | Perché in header e non nel menu | Evidenza |
|---|---|---|
| **♪ Tonalità globale** | Non è una destinazione: è **stato** trasversale a tutte le viste. Badge sempre visibile (Nielsen #1: oggi "fretboard in C, jam in A: nessun avviso"). Tap → bottom-sheet di chip in zona pollice. | B-05 (P=12); CSS `.global-key-wrap` orfano 147-166 = il posto era già previsto in header. |
| **🎵 Accordatore** | Primo gesto di ogni sessione con chitarra vera (audit §9.2), ma si usa **prima** di suonare, a due mani libere: non merita un quarto di bottom-nav permanente (usage 2, non 3), merita 1 tap da ovunque. Tap = apre e avvia (il tap è il gesto per l'AudioContext). | B-14 (3 tap + target 33px → 1 tap ≥44px). |

### 2.3 Esclusioni dal primo livello (ognuna motivata)

| Voce attuale (usage) | Destino | Motivazione |
|---|---|---|
| 🎛 Audio (0) | subtab "Suono" dentro Suona | usage 0, vicolo cieco (audit §9.3), "si tocca una tantum"; B-16: occupa un posto primario spingendo fuori schermo voci usage 2. I 4 slider agiscono sul motore audio: la casa naturale è accanto al mix del jam. |
| Scale & Accordi (2), CAGED (2), Penta (2), Circolo (1) | subtab del hub Manico | B-01: 5 voci della stessa famiglia concettuale (manico+teoria) non possono occupare 5/9 del gateway. Costo: +1 tap sul primo accesso a Scale/CAGED/Penta/Circolo (usage ≤2, consultazione), ripagato dal subtab-memory (§4.3) e dall'eliminazione dello swipe nav (oggi non conteggiato ma reale, B-01). |
| Tecnica (2), Coscienza (2) | subtab del hub Allena | Stessa logica; profondità delle funzioni interattive invariata (drill 2 tap, tech-tab d=3). |
| 🎤 Manico Live (1) | fuso in Suona·Live | B-23: duplica "Suona live" (stessa pipeline YIN+manico, 2 AudioContext per la stessa feature, audit §9.1). Un solo ingresso; per D: convergere su un solo stato/contesto. |
| Pratica (1) | Allena·Guide | flag `move` già nell'audit; B-21: era il default della voce Tecnica pur essendo la vista meno usata. |
| Accordatore (2) | icona header | B-14, vedi §2.2. |

**Conteggio: 4 voci di menu base (≤6 ✓), Setlist di primo livello ✓.**

---

## 3. Mapping completo vecchio → nuovo (tutti i nodi MenuNode di A)

Formato: MenuNode congelato (`id, label, icon, parent, screen, tapDepth, usage, action`).
`d` = tapDepth vecchio→nuovo (avvio a freddo, prima esecuzione; con subtab-memory §4.3
i valori nuovi ≥2 scendono di 1 dalla seconda visita). Copre **tutte le 47 righe**
della tabella MenuNode dell'audit (= 44 viste + 3 nodi-controllo inv/strset contati
dall'audit dentro le viste). **Nessun `drop` di funzioni**: l'unico drop è una voce
di menu ridondante la cui funzione sopravvive altrove.

### 3.1 Voci nav di livello 1 (9)

| id vecchio | usage | action | nuovo id (parent) | d | Motivazione |
|---|---|---|---|---|---|
| fretboard | 3 | **move** | neck.fretboard (neck, default) | 0→1 | B-01/B-02: entra nel hub Manico come default. Il +1 nominale è compensato: (a) ripristino ultima vista (B-08/B-12) → chi lo usa lo ritrova a d=0; (b) tonalità globale (B-05) → arriva configurato, risparmiando i 4 tap di key+scala (P3 audit). |
| scales | 2 | **merge** | neck (hub) | 1→1 | B-01: la tab-bar "due famiglie" (audit §9.4, rischio 7) si scioglie: le 7 subtab si ridistribuiscono in Scale/Accordi (§3.2). |
| caged | 2 | **move** | neck.caged (neck) | 1→2 | B-01: famiglia manico. usage 2 consultivo; subtab-memory mitiga. |
| penta5 | 2 | **move** | neck.penta (neck) | 1→2 | Idem. Key dal contesto globale (B-05). |
| circle | 1 | **move** | neck.circle (neck) | 1→2 | usage 1, consultazione occasionale (audit §3). |
| jam | 3 | **move** | play (hub Suona) | 1→1 | Voce usage-3 oggi fuori schermo all'avvio (B-01): diventa sempre visibile in bottom-nav; transport sticky (B-09). |
| audio | 0 | **merge** | play.sound (play) | 1→2 | B-16 + flag `merge` dell'audit: usage 0, vicolo cieco. Funzione intatta come subtab. |
| technique | 2 | **merge** | train (hub Allena) | 1→1 | B-01; il default non è più Pratica (B-21). |
| coscienza | 2 | **move** | train.fc (train, default) | 1→1 | B-01: da 9ª voce fuori schermo a default di una voce sempre visibile. |

### 3.2 Sotto-albero Scale & Accordi (13)

| id vecchio | usage | action | nuovo id (parent) | d | Motivazione |
|---|---|---|---|---|---|
| scales.scales | 2 | **move** | neck.scale (neck) — segmented "Scale" default | 1→2 | B-01 consolidamento; -1 dalla 2ª visita (subtab-memory). |
| scales.modi | 1 | **move** | neck.scale.modi | 2→3 | usage 1 approfondimento; sta con le scale (coerenza N4). |
| scales.progressioni | 1 | **move** | neck.chords.prog | 2→3 | usage 1 consultazione; famiglia accordi. |
| scales.chordscale | 1 | **move** | neck.chords.sa | 2→3 | usage 1 consultazione mirata. |
| scales.cs.s2c | 1 | **keep** | neck.chords.sa.s2c (default) | 2→3 | segue il genitore. |
| scales.cs.c2s | 1 | **keep** | neck.chords.sa.c2s | 3→4 | usage 1: unica foglia (con la modale di prog) a d=4 — trade-off dichiarato del consolidamento B-01. |
| scales.triadi | 2 | **move** | neck.chords (default "Triadi") | 2→2 | **profondità invariata di proposito**: è il target di songlabGoStudy (audit §4.3) e del chip Studia (§5). |
| scales.tr.inv | 2 | **keep** | neck.chords.triadi.inv | 3→3 | controlli interni invariati; target ≥44px (B-19, spec per E). |
| scales.tr.strset | 2 | **keep** | neck.chords.triadi.strset | 3→3 | idem. |
| scales.seventh | 1 | **move** | neck.chords.s7 | 2→3 | usage 1; resta raggiungibile dal ponte Studia con return-stack (§4.2). |
| scales.s7.inv | 1 | **keep** | neck.chords.s7.inv | 3→3 | controlli interni della vista attiva. |
| scales.s7.strset | 1 | **keep** | neck.chords.s7.strset | 3→3 | idem. |
| scales.ninth | 1 | **move** | neck.chords.n9 | 2→3 | usage 1. |

### 3.3 CAGED (3) · Circolo (2)

| id vecchio | usage | action | nuovo id (parent) | d | Motivazione |
|---|---|---|---|---|---|
| caged.forms | 2 | **move** | neck.caged.forms (default) | 1→2 | B-01; key dal contesto globale + chip CAGED dal launchpad (§5) lo raggiunge configurato. |
| caged.modi | 1 | **move** | neck.caged.modi | 2→3 | usage 1. |
| caged.sistema | 1 | **move** | neck.caged.sistema | 2→3 | usage 1. |
| circle.circolo | 1 | **move** | neck.circle.quinte (default) | 1→2 | usage 1. |
| circle.transizione | 1 | **move** | neck.circle.trans | 2→3 | usage 1; resta lazy-init (initTransition). |

### 3.4 Basi/Jam (5)

| id vecchio | usage | action | nuovo id (parent) | d | Motivazione |
|---|---|---|---|---|---|
| jam.basi | 3 | **keep** | play.basi (play, default) | 1→1 | Cuore del suonare; riordino interno: transport sticky in basso (B-09), tonalità a chip 1-tap (B-15) legata al contesto globale (B-05), metronomo sotto il backing. |
| jam.canzoni | 2 (pot. 3) | **move** | **setlist** (PRIMO LIVELLO, vista d'avvio) | 2→0 | B-03 (P=12): il perno dei contratti passa da d=2-dietro-nav-fuori-schermo a d=0. Naming unico "Setlist" (B-17). |
| jam.accordatore | 2 | **move** | header.tuner (header, globale) | 2→1 | B-14: 1 tap da qualunque vista, avvio automatico all'apertura (il tap è il gesto utente per mic/AudioContext). |
| jam.micfb | 1 | **merge** | play.live | 2→2 | B-23 + flag `merge` audit: duplicato di "Suona live" (stessa pipeline, 2 AudioContext). Un solo punto d'ingresso; nessuna funzione persa (manico live + segui tonalità confluiscono). |
| jam.looper | 1 | **keep** | play.looper | 2→2 | Nicchia (usage 1) ma senza duplicati: resta subtab. |

### 3.5 Tecnica (12)

| id vecchio | usage | action | nuovo id (parent) | d | Motivazione |
|---|---|---|---|---|---|
| technique.pratica | 1 | **move** | train.guide | 1→2 | Flag `move` audit + B-21: griglia statica usage 1, non deve essere il default. |
| technique.tecnica | 2 | **keep** | train.tech (default interno sweep) | 2→2 | B-21: non più dietro il default sbagliato; profondità invariata. |
| tech.sweep | 2 | **keep** | train.tech.sweep (default) | 2→2 | invariato. |
| tech.alternate | 2 | **keep** | train.tech.alternate | 3→3 | invariato. |
| tech.legato | 2 | **keep** | train.tech.legato | 3→3 | invariato. |
| tech.tapping | 1 | **keep** | train.tech.tapping | 3→3 | invariato. |
| tech.skipping | 1 | **keep** | train.tech.skipping | 3→3 | invariato. |
| tech.dwps | 1 | **keep** | train.tech.dwps | 3→3 | invariato. |
| tech.legato-phrasing | 1 | **keep** | train.tech.legato-phrasing | 3→3 | invariato. |
| tech.equator | 1 | **keep** | train.tech.equator | 3→3 | invariato. |
| tech.doublestops | 1 | **keep** | train.tech.doublestops | 3→3 | invariato. |
| tech.masters | 1 | **keep** | train.tech.masters | 3→3 | invariato — alimenta il repertorio Setlist (ponte MAESTRI → songlabAddFromRepertoire, audit §4.2): la transizione va armata col return-stack (§4.2). |

### 3.6 Coscienza (3)

| id vecchio | usage | action | nuovo id (parent) | d | Motivazione |
|---|---|---|---|---|---|
| fc.train | 2 | **keep** | train.fc.train (default) | 1→1 | Drill quotidiano: 2 tap alla sessione, invariato (P5 audit). |
| fc.neck | 1 | **keep** | train.fc.neck | 2→2 | invariato. |
| fc.progress | 1 | **keep** | train.fc.progress | 2→2 | invariato. |

### 3.7 Nodi nuovi (solo di navigazione — zero schemi dati nuovi)

| nuovo id | label | parent | d | screen | Nota |
|---|---|---|---|---|---|
| setlist.launch | Scheda canzone | setlist | 1 | nuova vista (riusa chart 6422 + chord-lab 6501) | §5. |
| setlist.perf | Vista performance | setlist | — (stato in-play) | variante della scheda | leggibilità leggìo, spec per E (B-10/B-11). |
| header.key | Tonalità globale | header | 1 | bottom-sheet chip | B-05; riusa `.global-key-wrap`. |
| header.tuner | Accordatore | header | 1 | bpage-accordatore promossa a overlay/pagina | B-14; markup esistente 9365-9408. |

**Drop:** l'unica voce che sparisce come *voce di menu* è "🎤 Manico Live"
(merge motivato B-23); `guitar-improv.html` è già un redirect (drop di fatto,
audit §3). **Nessuna vista perde il proprio schermo: 47/47 nodi mappati, 0 orfani.**

---

## 4. Pattern di navigazione e modello di stato

### 4.1 Bottom-nav (decisione: bottom-nav, non hub-home)

Scartata l'alternativa "hub-home con griglia di icone": costa +1 tap su ogni
cambio di destinazione (peggiora il time-to-play, vietato dal piano del lead) e
lascia la zona pollice vuota durante l'uso (B-02). La bottom-nav invece:

- **4 bottoni fissi**, `position:fixed; bottom:0`, altezza ≥56px, target ≥44px,
  icona+label sempre visibili, **mai scroll** (B-01). Stato attivo evidente (N1).
- Coesistenza col back contestuale: `#nav-return-bar` (già `fixed; bottom:14px`,
  1890-1895) si aggancia **sopra** la bottom-nav.
- In Suona, il **transport sticky** (▶ 64px + BPM) si docka sopra la bottom-nav
  (B-09): play/stop e cambio pagina convivono in zona pollice.
- L'header, liberato dalle 9 voci, ospita solo logo + tonalità globale + accordatore:
  una riga, niente scroll orizzontale.

### 4.2 Back coerente (tre regole)

1. **Cambio laterale** (tap bottom-nav): nessuna nozione di "back" — le 4
   destinazioni sono pari grado; ogni hub conserva la sua subtab attiva.
2. **Ponti contestuali** (Studia→Triadi/7ª/9ª, chip del launchpad, Maestri→Setlist):
   `navArm` diventa un **return-stack** (array, max 3 livelli) invece dell'attuale
   variabile singola `_navReturn` (8429) — risolve B-20: canzone → Triadi → altro →
   ritorno alla canzone non si perde più. Il bottone di ritorno resta l'unico
   overlay sopra la bottom-nav, con target portato a ≥44px (spec per E).
3. **Back di sistema / refresh**: la vista corrente è riflessa nell'hash
   (`#setlist`, `#play/basi`, `#song=<id>` — B-12): il back del browser/Android
   percorre l'hash-history; il refresh e l'avvio ripristinano l'ultima vista dal
   contesto persistito (§4.3). Deep-link/bookmark verso setlist o singola canzone
   diventano possibili (oggi impossibili: zero routing, audit §1).

### 4.3 Stato persistente (cosa si salva, dove — versioning rispettato)

Nessuno schema congelato viene toccato. Si aggiunge **una** chiave nuova, con
`schemaVersion` come già fa `gil_fc_v1` (pattern esistente, srs-analytics.js:33):

```js
// NUOVA chiave: 'gil_ctx_v1' — contesto di lavoro (B-05, B-08, B-12)
{ schemaVersion: 1,
  key: 'A', mode: 'dorian', style: 'rock', bpm: 95,   // contesto musicale globale
  lastPage: 'setlist', lastSubtab: { play:'basi', neck:'fretboard', train:'fc' },
  lastSongId: null,                                    // ultima canzone aperta/lanciata
  updatedAt }
```

- **Scrittura**: on-change (throttled), mai in loop di audio. **Lettura**: una
  volta all'avvio. Corrotto/assente → default attuali (A dorico/rock/95, avvio
  Setlist): degrado identico a oggi, non distruttivo.
- **Song/Setlist**: restano in `gil_songs_v1→v2` **esattamente come da contratto**
  (migrazione a carico di D, 00-contratti-dati.md:50-55). C non aggiunge campi.
- **FC**: `gil_fc_v1` intatto; i ponti verso i drill *passano* la tonalità corrente
  come parametro di avvio, non scrivono nelle settings FC.
- **Non si persiste**: stati mic/looper (audio runtime), stato di play (mai
  auto-play all'avvio: AudioContext solo su gesto, vincolo immutabile).

### 4.4 Continuità canzone → strumento (risposta a B-05)

**Tonalità globale = unica sorgente di verità** (`gil_ctx_v1.key` + stato runtime):

- Il badge in header la mostra **sempre** (N1: mai più "fretboard in C, jam in A"
  senza saperlo).
- `#fb-key`, `#jam-key` (→ chip-row), `#tr-key`, `#s7-key`, `#n9-key`, key di
  Penta/CAGED diventano **viste sincronizzate** della stessa tonalità: cambiarne
  una aggiorna il contesto e quindi tutte le altre (two-way). La modifica locale
  resta possibile — semplicemente *è* la modifica globale.
- **La canzone imposta la tonalità**: `songlabLaunch` scrive `launch.fretboardKey`
  nel contesto globale → passando a Manico/Allena si trova tutto già in tonalità.
  Se `launch` è assente (canzone legacy), il contesto non viene toccato: fallback
  = comportamento attuale (garanzia di non-regressione del piano lead).
- Mode/style seguono la stessa logica (dal `backingPreset` della canzone).

---

## 5. Setlist-as-launchpad: flusso passo-passo

Solo flusso/viste/transizioni: lo schema `Song.launch` è congelato
(00-contratti-dati.md:40-47), il codice è dell'Agente D.

### 5.1 Vista Elenco (default, d=0 all'avvio prima esecuzione)

- Canzoni raggruppate **Set 1 / Set 2 / Bis** (campi `set`/`order` del contratto);
  le canzoni con `set:null` in gruppo "Senza set". Riordino con handle (o ▲▼) —
  scrive `order`, niente drag obbligatorio.
- **Riga canzone** (target riga ≥44px, B-07): titolo (16-18px, leggibilità B-10) ·
  badge tonalità da `launch.fretboardKey` (assente se `launch:null`) · pallino
  `status` (rodata/da_rivedere/nuova) · **▶ inline ≥44px**.
- Azioni elenco (barra in basso, zona pollice): ＋ nuova · 📚 repertorio · ⬇/⬆
  export-import (tutte funzioni esistenti, audit §4.2/§4.5).

### 5.2 Tap su ▶ inline — lancio immediato (percorso live, 1 tap)

1. **Tap ▶** (gesto utente → AudioContext ok) → `songlabLaunch(song)`:
   a. se `launch` presente: tonalità globale ← `fretboardKey`; stile/BPM ←
      `backingPreset` (setter jam esistenti); scala suggerita ← `suggestedScales[0]`
      annotata nel contesto per Manico; CAGED focus registrato per il chip.
   b. progressione → percorso esistente `songTogglePlay` → `#jam-custom-chords` →
      `jamLoadCustomProgression` → `jamTogglePlay` (il launchpad *passa attraverso*
      lo stato-nel-DOM, non lo bypassa — rischio 2 del piano lead / B-13).
2. La Setlist entra in **vista performance**: chart che segue, accordo
   corrente+prossimo ingranditi (28-48px, pattern `.chord-block` esistente — B-11),
   transport sticky (stop/BPM) sopra la bottom-nav.
3. In Suona compare il banner "sta suonando: <titolo>" (B-13: stato visibile da
   entrambe le viste; sorgente unica di verità = stato jam, non il DOM).

### 5.3 Tap sulla riga — scheda canzone (launch view, d=1)

Vista di preparazione (prova, studio): titolo + tonalità + status + notes; chart
completo; **chip di lancio** (tutti ≥44px, metà bassa dello schermo — B-02/B-07):

| Chip | Transizione | Meccanismo riusato |
|---|---|---|
| **▶ Suona** (primario, 64px) | come §5.2 ma restando in scheda→performance | songTogglePlay |
| **🎸 Manico in <key>** | Manico·Fretboard con tonalità globale = key e scala = `suggestedScales[0]`; return-stack armato | showPage + setter fretboard + navArm(stack) |
| **CAGED <cagedFocus>** | Manico·CAGED nella tonalità; return-stack | showPage + showCagedSubpage |
| **🎯 Drill in <key>** | Allena·Coscienza, drill 7 target-tone avviato nella tonalità della canzone; return-stack | FCUI/startTargetTone (già usa il backing condiviso, fc-ui.js:407) — passaggio del parametro tonalità: nuovo, minimale (flag per D) |
| **✏️ Modifica** | editor esistente (sezioni/accordi + nuovi campi opzionali set/status/notes/launch) | songlabRenderEditor |
| tap su un accordo del chart | chord-lab esistente (voicing, 🎯 Studia → Triadi/7ª/9ª) | songOpenChord + songlabGoStudy |

I chip con campo `launch` mancante appaiono disabilitati con hint "imposta in
✏️ Modifica" (N1: lo stato è visibile, niente magia silenziosa).

### 5.4 Ritorno

Da qualsiasi ponte (Manico/CAGED/Drill/Triadi) il return-stack riporta **alla
scheda canzone** (non genericamente alla pagina, B-20), con `lastSongId` che
sopravvive anche al refresh (§4.3).

---

## 6. Time-to-play atteso (contro la baseline di B, §1 di HEURISTICS)

Convenzioni identiche a B: select nativo = 2 tap; chip = 1 tap; scroll/swipe
contati come gesti. Avvio a freddo = prima esecuzione (Setlist·Elenco); "contesto
ripristinato" = esecuzioni successive con `gil_ctx_v1`.

| Scenario | Oggi (B §1) | Nuovo | Nuovo flusso passo-passo |
|---|---|---|---|
| **A — backing default** | 2 tap + 2 gesti (swipe nav + scroll al transport) | **2 tap + 0 gesti** | 1. tap "Suona" in bottom-nav (sempre visibile — B-01) · 2. tap ▶ nel transport sticky (niente scroll — B-09). |
| **B — backing in tonalità scelta** (metrica primaria) | 4 tap + 1-2 gesti | **3 tap + 0 gesti** (2 tap se la tonalità è già nel contesto ripristinato — B-08) | 1. tap "Suona" · 2. tap chip tonalità (chip-row 1-tap ≥44px al posto del select 2-tap — B-15, B-05) · 3. tap ▶ sticky. |
| **B-bis — stesso obiettivo partendo dalla setlist** (metrica del lead: ≤2) | — | **1-2 tap** | 1. (eventuale pill/riga) · 2. tap ▶ inline: tonalità+stile+BPM applicati da `launch` (B-04, campi a carico di D). |
| **C — canzone della setlist in play** | 3-4 tap + ritocco BPM manuale + tonalità non verificabile | **1 tap, BPM e tonalità inclusi** (2 tap da altra vista: +1 di bottom-nav) | avvio su Setlist → tap ▶ inline sulla riga → §5.2 (BPM da `backingPreset`, tonalità visibile sul badge — niente più ritocco a mano). |
| **D — contesto completo canzone→scala→backing** | 8-9 tap, tonalità tenuta a memoria | **3 tap, zero da ricordare** | 1. tap riga canzone (scheda) · 2. tap ▶ Suona (backing in tonalità) · 3. tap "Manico" in bottom-nav → fretboard **già** in tonalità con scala suggerita (tonalità globale scritta dal lancio — B-05). In alternativa 1+chip "🎸 Manico in <key>" = 2 tap senza backing. |
| **Accordatore** (P4 audit) | 3 tap (di cui uno su target 33px) | **1 tap** | tap icona header → apre e avvia (gesto utente = ok AudioContext) — B-14. |
| **Drill Coscienza** (P5 audit) | 2 tap | **2 tap (invariato)** | tap "Allena" (default Coscienza) · tap ▶ Avvia. Vincolo del lead "mai peggiorare" rispettato. |

**Tutti gli scenari misurati da B calano o restano invariati; nessuno peggiora.**
Costi in aumento dichiarati (fuori dagli scenari misurati): primo accesso di
sessione a Scale/CAGED/Penta/Circolo/7ª/9ª/Modi/Progressioni: +1 tap (foglie
usage ≤2, mitigate dal subtab-memory); c2s e modale-accordo di Progressioni a d=4
(usage 1). È lo scambio esplicito del consolidamento B-01: profondità in più dove
la frequenza è bassa, in meno dove si suona.

---

## 7. Note di fattibilità per l'Agente D

### 7.1 Cosa si riusa (nessuna modifica ai meccanismi)

| Meccanismo esistente | Uso nel redesign |
|---|---|
| `showPage(name)` (8413) — generico su `#page-<name>` | invariato: la bottom-nav chiama `showPage` esattamente come i vecchi `.nav-btn`; una nuova `div#page-setlist` funziona senza toccare la funzione. |
| `show*Subpage` per-pagina (12027-12056) + `.cpage-view` | le subtab dei hub sono le stesse funzioni; il "hub" è **solo raggruppamento visivo**: i bottoni del hub Manico chiamano `showPage('scales')`, `showPage('caged')`, ecc. — le 5 pagine teoria **restano div separati**, cambia solo la barra che le collega (markup ripetuto in testa a ciascuna, come già oggi ogni pagina ha la sua tab-bar). Zero spostamenti di DOM per la famiglia Manico. |
| `songTogglePlay` → `#jam-custom-chords` → `jamLoadCustomProgression` → `jamTogglePlay` (6464-6481) | il lancio ci passa attraverso (rischio 2 del lead); l'input resta nel DOM di page-jam anche se non visibile. |
| `songOpenChord`, `songlabGoStudy`, `songlabAddFromRepertoire`, export/import (audit §4) | invariati, richiamati dalla scheda canzone. |
| setter jam esistenti (`jamUpdateSettings` 5421, `jamSetBPM` 5449) | applicazione di `launch.backingPreset`. |
| pattern lazy-init (`initTechPage`, `micFbInit`, `initTransition`) | la scheda canzone e la vista performance si inizializzano al primo accesso (rischio 3 del lead: nessun nuovo init eager). |
| `#nav-return-bar` + `navArm/navReturn/navDisarm` (8424-8456) | base del return-stack (§7.2). |
| CSS `.global-key-wrap` (147-166) | markup del selettore tonalità in header: il posto era già previsto. |
| `bpage-accordatore` (9365-9408) | promosso a overlay/pagina richiamata dall'icona header; stessa UI. |
| Regola AudioContext su gesto | tutti i nuovi ingressi (▶ inline, icona tuner, chip drill) sono tap. |

### 7.2 Cosa serve di NUOVO (tenuto al minimo — 6 elementi, in ordine di necessità)

1. **Bottom-nav** (markup + CSS): 4 bottoni fissi in basso che chiamano handler
   *esistenti* (`showPage` + eventuale `show*Subpage`). Rimozione della vecchia
   `<nav>` dall'header. Nessuna logica nuova oltre allo stato attivo. [B-01, B-02]
2. **`div#page-setlist`**: spostamento del blocco `bpage-canzoni` (9351-9364) in
   una pagina propria + nuova scheda canzone/vista performance. Attenzione: id
   invariati (`#song-editor`, `#song-chart`, `#song-chordlab`); `#jam-custom-chords`
   resta in page-jam (dipendenza incrociata `jamUpdateChordBlocks`→`songChartFollow`
   6486-6491 da preservare). [B-03]
3. **Tonalità globale**: piccolo store runtime + sync dei 5+ selettori esistenti
   (two-way). È il meccanismo nuovo più delicato: NON rinominare i global usati da
   fc-ui/pitch-loop (rischio 1 del lead); i select esistenti restano nel DOM e
   vengono sincronizzati, non sostituiti (tranne `#jam-key` → chip-row). [B-05]
4. **`gil_ctx_v1`** (persistenza contesto, §4.3): chiave nuova, `schemaVersion:1`,
   pattern copiato da `srs-analytics.js` (load tollerante, default non distruttivi).
   [B-08] — La migrazione `gil_songs_v1→v2` è già a contratto e resta com'è.
5. **Return-stack**: `_navReturn` da variabile a array max-3 con label; API
   `navArm/navReturn` invariate all'esterno. [B-20, richiesto dai ponti §5.3]
6. **Hash-view** (raccomandato, il più rinunciabile dei sei): scrittura
   `location.hash` su navigazione + parse all'avvio (`#setlist`, `#play/basi`,
   `#song=<id>`) e listener `hashchange` per il back di sistema. Nessun router:
   una mappa hash→(showPage, subtab). Se D lo taglia per budget, B-12 resta
   coperto a metà dal solo ripristino `gil_ctx_v1` (senza deep-link/bookmark). [B-12]

Più un **parametro nuovo minimale**: il chip "🎯 Drill in <key>" richiede di poter
avviare il drill 7 target-tone in una tonalità data (oggi la prende dalle settings
FC). Da fare come parametro d'avvio, senza scrivere in `gil_fc_v1`. [§5.3]

### 7.3 Vincoli passati a E (visual)

- Classe tab unica con `min-height:44px` per tutta la famiglia subtab/segmented
  (B-06, B-19); righe/azioni/▶ della Setlist ≥44px, ▶ primario 64px (B-07).
- Scala tipografica "distanza leggìo" per vista performance e transport
  (accordo corrente 28-48px, tonalità/BPM ben visibili — B-10, B-11).
- Bottom-nav ≥56px con label; `#nav-return-bar` ≥44px sopra la bottom-nav.
- `padding-bottom` dei contenuti per non finire sotto bottom-nav/transport
  (safe-area iOS inclusa).

---

## GATE C — dichiarazione

- **Menu base ≤6 voci con Setlist di primo livello**: ✅ 4 voci (Setlist · Suona ·
  Manico · Allena) + 2 controlli header non-destinazione; Setlist è voce di primo
  livello **e** vista d'avvio (§1, §2).
- **Mapping completo vecchio→nuovo senza funzioni orfane**: ✅ §3 — 47/47 nodi
  della tabella MenuNode di A mappati con action keep/merge/move; unico merge
  distruttivo di *voce* (non di funzione) = Manico Live (B-23); ogni drop/merge/move
  cita FrictionPt o usage; 0 viste orfane.
- **Time-to-play in calo, motivato passo-passo**: ✅ §6 — backing in tonalità
  4→3 tap (1-2 dalla setlist, ≤2 come da metrica del lead); canzone in play
  3-4 tap+BPM manuale→1 tap con BPM/tonalità inclusi; contesto completo 8-9→3 tap;
  accordatore 3→1; nessuno scenario misurato peggiora; costi residui (+1 su foglie
  usage ≤2) dichiarati.

*Fine redesign. Nessun codice scritto, nessuno schema dati toccato, come da mandato.*
