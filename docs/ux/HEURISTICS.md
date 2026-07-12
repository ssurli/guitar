# HEURISTICS — Valutazione euristica mobile (Agente B)

> **Pacchetto UX Setlist-as-Launchpad · Agente B.** Solo problemi + direzione di fix:
> **zero proposte di redesign dell'IA** (mandato dell'Agente C). Formato dei punti di
> frizione: `FrictionPt = { where, heuristic, severity 1-4, evidence, fix }` come da
> contratti congelati (docs/ux/00-contratti-dati.md:35).
> Base: branch `claude/guitar-app-ux-setlist-gws05r`; input: docs/ux/IA_AUDIT.md (Agente A).

## Metodologia

Walkthrough euristico dell'IA inventariata dall'Agente A (44 viste, tabella MenuNode)
contro due griglie: le 10 euristiche di Nielsen e i 5 vincoli-chitarrista dei contratti
(mani occupate, time-to-play, mobile una mano/zona pollice, contesto prova/live,
continuità di stato). Ogni evidenza quantitativa è stata ri-verificata direttamente nel
CSS/markup di `index.html` (citazioni `file:linea`); le altezze dei target touch sono
calcolate come *line-box del font (font-size × line-height normale ≈1.2-1.3 per Space
Mono) + padding verticale + bordi*, in assenza di `min-height` esplicito. I conteggi tap
riusano la convenzione dell'audit (select nativo = 2 tap: apertura picker + scelta;
avvio = `page-fretboard` attivo, index.html:2883) e distinguono **tap** da **gesti di
scroll/swipe**, che su mobile costano quanto un tap ma non compaiono nei conteggi
ingenui. La frequenza d'uso è il campo `usage` 0-3 dei MenuNode dell'audit (proxy
dichiarato: nessuna telemetria esiste nell'app).

---

## 1. Metrica-guida: TIME-TO-PLAY attuale (quantificata passo-passo)

Definizione (contratti, principio 3): tap dall'apertura dell'app a "sto suonando su un
backing nella tonalità giusta". Misurata su viewport mobile ~390px.

### Scenario A — backing default (A dorico · rock · 95 BPM, `BT` index.html:5228)
| # | Azione | Riferimento | Costo |
|---|---|---|---|
| 1 | (eventuale) swipe del nav per rendere visibile "🎸 Basi", 6ª di 9 voci | nav overflow-x:auto, scrollbar nascosta (113-122); ~900px di nav stimati su ~390px di viewport | +1 swipe |
| 2 | tap nav "🎸 Basi" | index.html:2875 | 1 tap |
| 3 | scroll verticale: il transport è sotto pannello progressione (9163-9178) + metronomo (9181-9194) + 3 select (9196-9243) | ordine DOM 9162→9250 | +1 scroll |
| 4 | tap ▶ `#jam-play-btn` | index.html:9251 → `jamTogglePlay` 5394 | 1 tap |

**Totale: 2 tap + 2 gesti** — ma solo se la tonalità default va bene.

### Scenario B — backing in una tonalità scelta (il caso della metrica)
1. tap nav "🎸 Basi" (2875) — dopo eventuale swipe del nav.
2-3. tap select `#jam-key` + tap opzione (9199).
4. tap ▶ `#jam-play-btn` (9251) — dopo scroll al transport.

**TIME-TO-PLAY ATTUALE = 4 tap + 1-2 gesti di scroll/swipe.**
Aggravanti: +2 tap per il Modo (`#jam-mode` 9216), +2 per lo Stile (9235), +n per il BPM
(bottoni ±5 9258-9259 o slider 9264): il caso realistico "riprodurre il feel di un brano"
sale a **8-10+ interazioni**. Niente persiste (audit §5.1): il costo si ripaga **a ogni
avvio**.

### Scenario C — canzone della setlist (SONGLAB) in play
1. tap nav "🎸 Basi" (2875) · 2. tap subtab "🎼 Canzoni" (9153, target ~33px) ·
3. (eventuale) tap pill canzone (6266-6270, target ~31px) · 4. tap "▶ Suona" (6452,
target ~36px). **3-4 tap**, MA: la Song non ha campi tonalità/BPM/scala (schema
6217-6226) — "tonalità giusta" solo se gli accordi assoluti coincidono col brano;
il BPM resta quello globale corrente e va sistemato a mano dopo il play (+n tap
nella subtab Basi o sullo slider). **Time-to-play "vero" di una canzone: 3-4 tap +
ritocco BPM manuale + tonalità non verificabile a colpo d'occhio.**

### Scenario D — contesto completo (canzone → scala sul manico → backing)
Play canzone (3-4 tap, Scenario C) + nav Fretboard (1 tap) + select tonalità (2 tap) +
select scala (2 tap, `#fb-key`/`#fb-scale` 2890/2907) = **8-9 tap**, con la tonalità
tenuta **a memoria** dall'utente perché non è scritta da nessuna parte (nessun campo
`key` nella Song; nessun selettore globale — i 5 select di tonalità sono indipendenti,
audit §8).

**Baseline da battere per C e D: 4 tap (backing in tonalità) · 3-4 tap + BPM manuale
(canzone) · 8-9 tap (contesto completo).**

---

## 2. Criterio di prioritizzazione (esplicito)

**Priorità P = severity (1-4) × freq (0-3)**, dove:
- `severity`: 1 cosmetico · 2 minore · 3 maggiore (rallenta/ostacola un compito core) ·
  4 critico (blocca o vanifica un principio dei contratti);
- `freq` = `usage` del MenuNode/flusso interessato nella tabella dell'audit (§3); per
  la setlist si usa l'**uso potenziale 3** dichiarato dall'audit ("uso potenziale 3",
  IA_AUDIT §3 riga jam.canzoni); per attriti che colpiscono il nav di primo livello
  (gateway di tutto) freq = 3.
- A parità di P: prima la severity più alta, poi l'impatto sul time-to-play.

---

## 3. FrictionPt (ordinati per P = severity × freq)

### B-01 · P=12
- **where**: Menu base — `<nav>` 2ª riga dell'header sticky top, 9 voci (index.html:2868-2879; CSS nav 113-122)
- **heuristic**: Nielsen #8 (design minimalista) + #1 (visibilità dello stato) · app cresciuta per accrezione
- **severity**: 4
- **evidence**: 9 `.nav-btn` uppercase Space Mono 12px con padding 8px 13px (124-138): larghezza complessiva stimata ~900px contro ~390px di viewport → **~4-5 voci visibili all'avvio**; "🎸 Basi" (usage 3, la voce del *suonare*) è la 6ª ed è **fuori schermo al primo avvio**. La scrollbar è soppressa (`scrollbar-width:none` 117, `::-webkit-scrollbar{display:none}` 122): **zero affordance** che esistano altre 4-5 voci. Una voce su 9 ha usage 0 (Audio, audit §3) e occupa comunque spazio primario.
- **fix**: ridurre le voci di primo livello e dare gerarchia per frequenza d'uso (usage 3 sempre visibili); se resta scroll, renderlo evidente. (Progetto: Agente C.)

### B-02 · P=12
- **where**: Tutta la navigazione — header sticky TOP (index.html:75-85), nessuna bottom-nav (audit §10, verificato)
- **heuristic**: Vincolo-chitarrista (c) mobile-first una mano / zona pollice + legge di Fitts
- **severity**: 4
- **evidence**: `header{position:sticky;top:0}` (80-81) con nav in 2ª riga (2868): **ogni** cambio pagina/subtab richiede il pollice in cima allo schermo. L'unico elemento fisso in basso è il back contestuale `#nav-return-bar` (`position:fixed;bottom:14px`, 1890-1895), che appare solo dopo `navArm()` (8424-8456). Con la chitarra in mano (una mano sola, telefono impugnato in basso) le azioni di navigazione sono tutte fuori dalla zona pollice.
- **fix**: portare le azioni di navigazione/play critiche nella metà bassa dello schermo (direzione; layout all'Agente C).

### B-03 · P=12
- **where**: Setlist SONGLAB — `bpage-canzoni` (index.html:9351), raggiungibile solo via nav "🎸 Basi" (2875) → subtab "🎼 Canzoni" (9153)
- **heuristic**: Nielsen #7 (flessibilità/efficienza) + vincolo (d) contesto prova/live
- **severity**: 4
- **evidence**: l'unico contenuto **creato dall'utente** (audit §9.2) sta a tapDepth 2 dietro: (1) una voce nav fuori schermo all'avvio (6ª di 9, B-01); (2) una subtab `.cpage-tab-btn` alta ~33px (B-04); sotto stress da palco il percorso è swipe nav + 2 tap su target piccoli + eventuale pill + "▶ Suona". Nessun deep-link possibile (zero routing, audit §1). La setlist non è mai il punto d'ingresso: l'app apre sempre su Fretboard (2883).
- **fix**: la setlist deve costare ≤1 interazione dall'avvio ed essere raggiungibile con target ≥44px (riposizionamento: Agente C).

### B-04 · P=12
- **where**: Song schema SONGLAB (index.html:6217-6226, 6329-6334) e chart (6449-6456)
- **heuristic**: Vincolo (e) continuità di stato + Nielsen #6 (riconoscere, non ricordare)
- **severity**: 4
- **evidence**: `Song = {id,title,artist,sections[].chords}` — **mancano tonalità, BPM, scala suggerita, CAGED** (verificato dall'audit §4.1, nessuna occorrenza). Conseguenze misurate: il play eredita il BPM globale corrente (default 95, `BT` 5228) qualunque sia il brano; la tonalità è implicita negli accordi e non è mostrata da nessuna parte del chart (6449-6456); portare la canzone sul fretboard richiede di **ricordare** la tonalità e reimpostarla a mano (+4 tap, Scenario D). L'intero principio 7 dei contratti ("setlist-as-launchpad") è oggi impossibile.
- **fix**: estendere la Song con i campi opzionali `launch` già congelati nei contratti (00-contratti-dati.md:40-47) e mostrarli/applicarli al play (implementazione: Agente D).

### B-05 · P=12
- **where**: Tonalità — 5+ selettori indipendenti: `#fb-key` (2890), `#jam-key` (9199), `#tr-key`/`#s7-key`/`#n9-key`, impostazioni FC (audit §8)
- **heuristic**: Vincolo (e) continuità di stato + Nielsen #4 (coerenza)
- **severity**: 4
- **evidence**: nessun selettore di tonalità globale: il CSS `.global-key-wrap` (147-166, 1520-1526) è **orfano** — il markup dell'header non lo contiene (2862-2867). Il flusso canzone→scala→backing→drill dei contratti costa 2 tap di re-impostazione tonalità **per ogni vista attraversata** (select nativo = 2 tap), con rischio di incoerenza silenziosa (fretboard in C, jam in A: nessun avviso, Nielsen #5).
- **fix**: un'unica sorgente di verità per la tonalità corrente, propagata alle viste (il CSS orfano suggerisce che era già previsto); come, lo decide C/D.

### B-06 · P=9
- **where**: Tutte le subtab-bar di 2° livello — `.cpage-tab-btn` (CSS index.html:2687-2690; usate in page-jam 9151-9157, page-scales 3014-3020, page-caged, page-circle, page-technique)
- **heuristic**: Vincolo (a) mani occupate — target ≥44px (contratti, principio 2)
- **severity**: 3
- **evidence**: `padding:8px 14px; font-size:12px`, **nessun min-height** (2687-2690) → altezza reale ≈ 15px di line-box + 16px padding + 2px bordo = **~33px, il 25% sotto i 44px** richiesti. Sono i target che portano a setlist (9153) e accordatore (9154). Contrasto interno: i `.nav-btn` hanno `min-height:44px` (132, 1534) e la pagina Coscienza dichiara e rispetta ≥44px (fc-ui.js:4; CSS 12081-12089) — lo standard esiste già nel codebase ma non è applicato alle subtab.
- **fix**: `min-height:44px` (e hit-area estesa) su tutta la famiglia di tab di 2°/3° livello (CSS: Agente E, su indicazione di C).

### B-07 · P=9
- **where**: Azioni della setlist — `.song-pill` (1796-1799), `.songlab-action` (1801-1804), "▶ Suona" `.ccp-btn` (1649-1653, usato a 6452)
- **heuristic**: Vincolo (a) mani occupate — target ≥44px sui controlli più critici del flusso live
- **severity**: 3
- **evidence**: misure calcolate dai CSS: `.song-pill` padding 7px 12px font 12px → **~31px**; `.songlab-action` padding 7px 10px font 11px → **~29px** (è anche il target di "🎯 Studia…" 6551 e "✏️ modifica" 6453); il bottone **"▶ Suona"** — l'azione n.1 della setlist — è un `.ccp-btn` padding 9px 14px font 13px → **~36px**. Tutti sotto i 44px; i chip rapidi `.ccp-chip` (1659-1663, padding 4px 9px) scendono a **~25px**.
- **fix**: portare pill/azioni/play della setlist a ≥44px, con "▶ Suona" dimensionato da azione primaria (cfr. `.btn-play-big` 64×64, 1689-1690, che lo standard interno già prevede).

### B-08 · P=9
- **where**: Persistenza dello stato di lavoro — nessuna (audit §5.1: solo `gil_songs_v1` e `gil_fc_v1`) + assenza di routing (audit §1)
- **heuristic**: Vincolo (d) contesto prova/live + Nielsen #7 · continuità (e)
- **severity**: 3
- **evidence**: tonalità/modo/stile/BPM del jam, tonalità+scala del fretboard, canzone corrente in play: tutto solo in memoria (`BT` 5228, `FB_STATE` 4195). Zero `location.hash`/`pushState` (grep = 0, audit §1). Un refresh accidentale su palco (o il reap del tab da parte di iOS/Android in background) **riporta al Fretboard in C maggiore e butta tutto il setup**; il costo di ripristino è l'intero time-to-play (4-10 interazioni, §1).
- **fix**: persistere l'ultimo contesto di lavoro (con versioning, come da vincoli tecnici dei contratti) e/o stato ripristinabile all'avvio; priorità alle impostazioni jam.

### B-09 · P=9
- **where**: Transport del backing — `#jam-play-btn` (index.html:9251) in fondo a `bpage-basi`
- **heuristic**: Vincolo (c) zona pollice + Nielsen #7 — il controllo più usato è il più lontano
- **severity**: 3
- **evidence**: ordine DOM di bpage-basi (9158-9269): pannello progressione custom (9163-9178) + metronomo standalone (9181-9194) + 3 ctrl-group con select (9196-9243) **precedono** il transport (9250). Su mobile (≤900px i controlli si impilano su 2 colonne, 1550) il ▶ è sotto il fold: serve uno scroll a ogni sessione. Il bottone in sé è corretto (64×64, 1689-1690) — è la posizione il problema. Nota: il metronomo (usage marginale, "indipendente dalla base" 9193) sta sopra il play del backing.
- **fix**: transport (play/BPM) sempre raggiungibile senza scroll — in basso o sticky (layout: C/E).

### B-10 · P=9
- **where**: Tipografia dell'intera UI operativa — Space Mono 10-12px diffuso
- **heuristic**: Vincolo (a) leggibilità a distanza (telefono su leggìo/ampli, ~60-80cm)
- **severity**: 3
- **evidence**: campionatura verificata: nav 12px (129), subtab 12px (2688), etichette `.ctrl-label`/hint 10-11px (es. `.sed-hint` 10px 1842, hint metronomo 10px 9193, `.sc-name` 10px 1851, `.bpm-lbl` 10px 1718, `.tap-btn` 10px 1744, `.inv-tab`/`.strset-tab` 10px 2135/2161, `.songlab-action` 11px 1803). A 60-80cm la soglia pratica è ~16-18px: quasi tutta la UI di controllo è illeggibile senza avvicinarsi. Eccezioni corrette che dimostrano la direzione: `.bpm-display` 48px (1709), `.chord-block .chord-root` 28px (1924).
- **fix**: scala tipografica "distanza leggìo" per le informazioni da consultare mentre si suona (accordo corrente, tonalità, prossima sezione); i 10px restino solo per metadati (CSS: Agente E).

### B-11 · P=9
- **where**: Chart canzone in esecuzione — `.sc-chord` (CSS 1855-1863; render 6422-6461)
- **heuristic**: Vincolo (a) colpo d'occhio durante l'esecuzione + Nielsen #1
- **severity**: 3
- **evidence**: gli accordi del chart sono a **font 14px** (1857) con battute in `small` 9px (1860) — da leggere mentre si suona, a distanza. L'accordo corrente `.now` è segnalato solo da bordo/colore ambra (1863) sulla stessa pill 14px: nessuna vista ingrandita dell'accordo attivo (il jam ha `.chord-block .chord-root` a 28px, 1924, ma sta nell'altra subtab). Il follow scrolla `scrollIntoView` (6489-6491) ma la dimensione resta quella.
- **fix**: in play, l'accordo corrente (e il prossimo) devono essere leggibili a distanza-leggìo; il pattern 28-48px esiste già nel jam.

### B-12 · P=9
- **where**: Avvio a freddo verso un pezzo — nessun deep-link/stato di lancio (audit §1, §9.5)
- **heuristic**: Vincolo (d) live: "arrivare a un pezzo sotto stress da palco" + Nielsen #7 (scorciatoie)
- **severity**: 3
- **evidence**: zero routing (grep `hash|pushState` = 0), zero PWA/manifest (audit §7): impossibile creare una scorciatoia/bookmark che apra l'app sulla setlist o su una canzone. Ogni accesso live parte dal Fretboard (2883) e ripaga l'intero percorso B-03. In più 14 init eager a DOMContentLoaded (9131-9147) su un monolite da ~556KB + Google Fonts remoto (34-36) allungano il primo paint proprio nel momento peggiore.
- **fix**: stato di lancio indirizzabile (hash o persistenza dell'ultima vista) e riduzione del lavoro eager all'avvio; il come è di C/D.

### B-13 · P=6
- **where**: Play SONGLAB via DOM — `songTogglePlay` scrive in `#jam-custom-chords` (index.html:6475-6477)
- **heuristic**: Nielsen #1 (visibilità dello stato) + #4 · rischio regressioni (audit rischio 2)
- **severity**: 3
- **evidence**: il play della canzone passa dall'input di un'ALTRA vista (`#jam-custom-chords` in bpage-basi 9169): tornando su "🎸 Basi" l'utente trova l'input riempito "da solo" e la base non più legata alla tonalità/modo dei select (che ora mentono sullo stato reale — `useCustom`). Lo stop/riavvio dalla subtab Basi non aggiorna il chart canzoni se non via callback incrociata (`jamUpdateChordBlocks`→`songChartFollow` 6486-6491). Stato distribuito su due viste senza indicatore "sta suonando: <canzone>".
- **fix**: sorgente unica dello stato di riproduzione con indicazione esplicita di che cosa sta suonando, visibile da entrambe le viste (architettura: D).

### B-14 · P=6
- **where**: Accordatore — `bpage-accordatore` (index.html:9365), subtab 3ª di page-jam (9154)
- **heuristic**: Vincolo (b) time-to-play + Nielsen #7 — il primo gesto di ogni sessione reale è a profondità 2
- **severity**: 3
- **evidence**: accordare = 3 tap (audit P4: nav 2875 + subtab 9154 + "🎤 Avvia" 9392) di cui il 2° su target ~33px (B-06), più permesso mic al primo uso. È tipicamente **il primo gesto di ogni sessione con chitarra vera** (usage 2, audit §3) ma è nascosto dentro "Basi" — nome che non suggerisce l'accordatore (Nielsen #6).
- **fix**: accesso più diretto (1 gesto) all'accordatore dall'avvio; posizione decisa da C.

### B-15 · P=6
- **where**: Select nativi per tonalità/modo/stile (`#jam-key` 9199, `#jam-mode` 9216, `#fb-key` 2890, `#fb-scale` 2907)
- **heuristic**: Vincolo (a) poche interazioni/mani occupate + Nielsen #7
- **severity**: 2
- **evidence**: ogni scelta = 2 tap con picker modale che copre lo schermo; le option (12 tonalità, 18 scale in `#fb-scale` 2907-2936) sono liste native a target di sistema, non ottimizzate per pollice; su mobile i select hanno `min-height:40px` (1543), sotto i 44px. Il pattern chip/pill già usato altrove (es. preset tuner 9372-9387, `.ccp-chip` 6187) costa 1 tap.
- **fix**: per le scelte ad alta frequenza (tonalità), preferire target a 1 tap ≥44px; scelta di pattern a C/E.

### B-16 · P=6
- **where**: Voce nav "🎛 Audio" — page-audio (index.html:9485-9534), voce 7ª di 9 (2876)
- **heuristic**: Nielsen #8 (minimalismo) — costo d'opportunità nel menu sovraccarico
- **severity**: 2
- **evidence**: usage 0 nell'audit ("si tocca una tantum", §3), nessuna subtab, vicolo cieco (audit §9.3): 4 slider + Test Sound. Occupa un posto di primo livello e contribuisce a spingere Tecnica/Coscienza (usage 2) fuori dallo schermo nel nav scrollabile (B-01). Idem, in misura minore, "Pratica" come default di Tecnica: `showPage('technique');showTechSubpage('pratica')` (2877) forza la griglia statica (usage 1) sopra la subtab interattiva (usage 2) — un tap sprecato a ogni visita.
- **fix**: candidati naturali a merge/move segnalati già dall'audit (flag `merge`/`move`); decisione a C.

### B-17 · P=6
- **where**: Naming/iconografia della setlist — "🎼 Canzoni" (9153) vs "Chord Lab · Canzoni" (9352) vs SONGLAB (6204); 🎸 su tre significati (2875, 9152, 6278)
- **heuristic**: Nielsen #4 (coerenza e standard) + #6
- **severity**: 2
- **evidence**: tre nomi per la stessa funzione e la stessa icona 🎸 per nav "Basi", subtab "Basi" e azione "repertorio" dentro Canzoni (audit §9.4); 🎤 ambiguo tra "Manico Live" (9155), "Suona live" (9322) e mic dei drill (fc-ui.js:281). Per un utente sotto stress il riconoscimento a colpo d'occhio (vincolo a) fallisce: nessuna etichetta dice "setlist".
- **fix**: un nome e un'icona univoci per la setlist e per le funzioni mic; nomenclatura a C.

### B-18 · P=6
- **where**: Avvio — 14 init eager a DOMContentLoaded (index.html:9131-9147) su monolite ~556KB
- **heuristic**: Vincolo (b) time-to-play (il tempo di load precede il primo tap) + Nielsen #7
- **severity**: 2
- **evidence**: tutte le pagine vengono renderizzate all'avvio anche se l'utente ne userà una (9131-9147); il fretboard di default renderizza C maggiore (9132) che quasi mai è il contesto voluto; font remoti (34-36) bloccanti per il testo stilizzato. Il "time-to-play" reale = load + parse 12.2k righe + 14 render + i 4 tap del §1.
- **fix**: differire il render delle viste non attive (il pattern lazy esiste già: `initTechPage` 10824, `micFbInit` 9155, `initTransition` 3384); esecuzione a D con cautela sul doppio regime eager/lazy (audit rischio 3).

### B-19 · P=4
- **where**: Famiglie di tab di 3° livello — `.triad-tab` (2058-2071), `.inv-tab` (2130-2144), `.strset-tab` (2156-2168), `.cs-mode-tab` (2509-2514), `.tech-tab` (884-890)
- **heuristic**: Nielsen #4 (coerenza) + vincolo (a) target
- **severity**: 2
- **evidence**: 5 classi per lo stesso concetto "tab", con misure diverse e tutte sotto soglia: `.triad-tab` 11px/7px padding → **~30px**; `.inv-tab` e `.strset-tab` 10px/5px padding → **~25px** (i più piccoli dell'app, e sono target di "🎯 Studia" da SONGLAB via `songlabGoStudy` 6650-6687); `.cs-mode-tab` ~33px; `.tech-tab` ~33px. Stessa semantica, 5 stili: ogni fix va replicato ×5 (costo di manutenzione, audit rischio 7).
- **fix**: unificare la famiglia tab (classe unica ≥44px); CSS a E.

### B-20 · P=4
- **where**: Ritorno dal ponte "🎯 Studia" — `navArm`/`#nav-return-bar` (index.html:8424-8456, 1890-1895)
- **heuristic**: Nielsen #3 (controllo e libertà) + vincolo (e) continuità
- **severity**: 2
- **evidence**: il back contestuale è a un solo livello (`_navReturn` 8429 sovrascritto a ogni `navArm`): canzone → Triadi → (tap su altro) e il ritorno alla canzone è perso; il bottone è piccolo (font 12px, padding 9px 15px → ~33px, 1893-1894) ed è l'**unico** controllo in zona pollice di tutta l'app. Al ritorno il pannello chordlab va riaperto (stato `selChord` non ripristinato a video senza re-render).
- **fix**: ritorno affidabile al contesto canzone (stack o contesto persistente); progettazione a C/D.

### B-21 · P=4
- **where**: Default di page-technique — `onclick="showPage('technique');showTechSubpage('pratica')"` (index.html:2877)
- **heuristic**: Nielsen #7 — il default non è la vista più usata
- **severity**: 2
- **evidence**: l'audit assegna usage 1 a `technique.pratica` (griglia statica, PRACTICE_DATA 4839) e usage 2 a `technique.tecnica` (esercizi interattivi): il default costringe +1 tap su subtab ~33px a ogni visita della maggioranza d'uso; inoltre i 10 tech-tab di 3° livello (10828-10839) sono anch'essi ~33px in barra a scroll nascosto (879-883).
- **fix**: default sulla vista a maggior uso; scelta a C.

### B-22 · P=4
- **where**: Audio engine — 5 AudioContext distinti (index.html:3684, 6076, 10120, 10309; js/pitch-loop.js:203-204)
- **heuristic**: Nielsen #5 (prevenzione errori) — su iOS il passaggio tuner→backing può fallire in silenzio
- **severity**: 2
- **evidence**: accordatore, backing, manico live e drill usano contesti separati con clock non confrontabili (audit rischio 4); iOS limita i contesti concorrenti e sospende quelli in background: nel flusso reale "accordo → suono sul backing" (2 subtab adiacenti, 9154→9152) il secondo contesto può partire sospeso, senza alcun messaggio all'utente. Il drill 7 già oggi deve forzare il contesto condiviso (fc-ui.js:490).
- **fix**: convergere su un contesto condiviso (o gestione esplicita del ciclo di vita) — a D, che è l'unico a toccare codice.

### B-23 · P=2
- **where**: "🎤 Manico Live" (bpage-micfb 9411) vs "🎤 Suona live" dentro Basi (9322 → `jamLiveToggle` 6047)
- **heuristic**: Nielsen #4 (coerenza) + #8 — due ingressi per la stessa funzione
- **severity**: 2
- **evidence**: stessa pipeline YIN+manico con stati separati `MICFB` vs `JLIVE` (il commento 10144-10146 lo dichiara), due AudioContext per la stessa feature (audit §9.1); l'utente non ha criteri per scegliere quale usare, e i risultati (manico, tonalità seguita) differiscono.
- **fix**: consolidare in un solo punto d'ingresso (flag `merge` già nell'audit); a C.

### Tabella riassuntiva

| ID | where (sintesi) | heuristic | sev | freq | P |
|---|---|---|---|---|---|
| B-01 | nav 9 voci scroll nascosto (2868-2879, 113-122) | N8+N1 / accrezione | 4 | 3 | 12 |
| B-02 | tutta la nav in alto, zona pollice vuota (75-85) | vincolo (c) / Fitts | 4 | 3 | 12 |
| B-03 | setlist a d=2 dietro nav fuori schermo (9153) | N7 + vincolo (d) | 4 | 3 | 12 |
| B-04 | Song senza tonalità/BPM/scala (6217-6226) | vincolo (e) + N6 | 4 | 3 | 12 |
| B-05 | nessuna tonalità globale, 5+ select (147-166 orfano) | vincolo (e) + N4 | 4 | 3 | 12 |
| B-06 | subtab ~33px senza min-height (2687-2690) | vincolo (a) ≥44px | 3 | 3 | 9 |
| B-07 | target setlist 25-36px, "▶ Suona" ~36px (1649-1804) | vincolo (a) ≥44px | 3 | 3 | 9 |
| B-08 | zero persistenza contesto + refresh=reset (audit §5.1) | vincolo (d) + N7 | 3 | 3 | 9 |
| B-09 | play backing sotto il fold (DOM 9163→9250) | vincolo (c) + N7 | 3 | 3 | 9 |
| B-10 | UI operativa a 10-12px, illeggibile da leggìo | vincolo (a) leggibilità | 3 | 3 | 9 |
| B-11 | chart canzone 14px anche in play (1855-1863) | vincolo (a) + N1 | 3 | 3 | 9 |
| B-12 | nessun deep-link/lancio verso un pezzo (audit §1) | vincolo (d) + N7 | 3 | 3 | 9 |
| B-13 | play canzone via `#jam-custom-chords` (6475-6477) | N1 + N4 | 3 | 2 | 6 |
| B-14 | accordatore a d=2 (9154) | vincolo (b) + N7 | 3 | 2 | 6 |
| B-15 | select nativi 2-tap, 40px mobile (1543) | vincolo (a) + N7 | 2 | 3 | 6 |
| B-16 | Audio usage-0 nel nav primario (9485) | N8 | 2 | 3 | 6 |
| B-17 | 3 nomi per la setlist, icone ambigue | N4 + N6 | 2 | 3 | 6 |
| B-18 | 14 init eager, 556KB, font remoti (9131-9147) | vincolo (b) + N7 | 2 | 3 | 6 |
| B-19 | 5 classi tab, target 25-33px (2058-2168, 884) | N4 + vincolo (a) | 2 | 2 | 4 |
| B-20 | back contestuale a 1 livello (8424-8456) | N3 + vincolo (e) | 2 | 2 | 4 |
| B-21 | default Tecnica su vista meno usata (2877) | N7 | 2 | 2 | 4 |
| B-22 | 5 AudioContext, switch tuner→backing fragile | N5 | 2 | 2 | 4 |
| B-23 | Manico Live duplicato (9411 vs 9322) | N4 + N8 | 2 | 1 | 2 |

Distribuzione severità: **5×S4 · 9×S3 · 9×S2** (23 FrictionPt totali).

---

## 4. TOP 10 — da indirizzare da C (redesign IA) e D (integrazione setlist)

Selezione = i 10 FrictionPt a P più alto con natura strutturale (i tipografici B-10/B-11
restano prioritari ma sono in carico principale a E, con vincoli fissati da C).

| # | FP | Chi | Perché è nel top |
|---|---|---|---|
| 1 | B-01 nav 9 voci a scroll nascosto | C | il gateway dell'app nasconde le voci core; ogni altro fix passa da qui |
| 2 | B-03 setlist sepolta a d=2 | C | contraddice frontalmente "setlist-as-launchpad" (principio 7 dei contratti) |
| 3 | B-04 Song senza tonalità/tempo/scala | D | senza i campi `launch` il launchpad non può esistere; schema già congelato |
| 4 | B-05 nessuna tonalità globale | C+D | prerequisito della continuità canzone→scala→backing→drill (principio 6) |
| 5 | B-02 zona pollice vuota | C | vincolo mobile-first una mano (principio 4): oggi violato dal 100% della nav |
| 6 | B-08 zero persistenza + refresh=reset | D | il time-to-play si ripaga a ogni avvio; rischio palco concreto |
| 7 | B-06 subtab ~33px | C (spec) + E (CSS) | target sotto soglia sull'intero 2° livello, incluso l'accesso alla setlist |
| 8 | B-07 target setlist 25-36px, "▶ Suona" ~36px | C (spec) + E (CSS) | l'azione primaria del flusso live è tra i target più piccoli dell'app |
| 9 | B-09 transport sotto il fold | C | il controllo più frequente (play backing, usage 3) richiede scroll a ogni uso |
| 10 | B-12 nessun deep-link/lancio a un pezzo | C+D | contesto live: arrivare a un pezzo da freddo costa sempre l'intero percorso |

Menzioni obbligate fuori top (per E): **B-10/B-11** (leggibilità a distanza — la scala
tipografica va definita insieme al redesign di C); **B-13** (per D: il play SONGLAB via
DOM è anche il rischio-regressione n.2 dell'audit, da bonificare prima di costruirci sopra).

---

## GATE B — dichiarazione

- **Evidenza concreta su ogni FrictionPt**: ✅ ogni punto cita `file:linea` verificati in
  questa valutazione (CSS letti direttamente: 113-138, 1503-1552, 1641-1663, 1689-1737,
  1793-1896, 1899-1941, 2058-2170, 2506-2516, 2684-2693, 876-894) e/o conteggi
  tap/misure px calcolate (metodo dichiarato in Metodologia).
- **Prioritizzazione esplicita**: ✅ formula P = severity × freq (usage 0-3 dell'audit),
  §2, applicata in tabella.
- **Time-to-play quantificato**: ✅ §1, quattro scenari passo-passo con riferimenti:
  4 tap + 1-2 gesti (backing in tonalità), 3-4 tap + BPM manuale (canzone), 8-9 tap
  (contesto completo).

*Fine valutazione euristica. Nessuna proposta di redesign IA inclusa, come da mandato.*
