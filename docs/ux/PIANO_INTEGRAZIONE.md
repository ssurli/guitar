# Piano di integrazione — Setlist-as-Launchpad (lead)

> Stato: **FINALE v1.0** (2026-07-11) — gate A, B e C superati. Questo piano autorizza
> l'Agente D a scrivere codice nei limiti qui definiti. Contratti: `00-contratti-dati.md`
> (congelati). Baseline: `IA_AUDIT.md` · Attriti: `HEURISTICS.md` · Target IA: `IA_REDESIGN.md`.

## Sequenza e gate

| Fase | Agente | Deliverable | Gate |
|---|---|---|---|
| 1 | A — Audit & Inventario IA | `IA_AUDIT.md` | ✅ A superato: 44 viste, MenuNode con tapDepth/usage, percorsi tap, rischi |
| 2 | B — Valutazione euristica | `HEURISTICS.md` | FrictionPt con evidenza file:linea, priorità esplicita, time-to-play quantificato |
| 3 | C — Redesign IA & navigazione | `IA_REDESIGN.md` | Ogni drop/merge motivato da FrictionPt/usage; tap-count target ≤ attuale; zero nuovi schemi dati |
| 4 | D — Integrazione Setlist (codice) | modifiche a `index.html` | Migrazione v1→v2 non distruttiva; test FC.* verdi; flussi chiave verificati |
| 5 | E — Visual & polish (codice) | CSS/markup | Solo presentazione; target ≥44px; nessun cambio di logica/schema |

## Fatti vincolanti dall'audit (baseline)

- Menu base: header sticky **in alto**, 9 voci a scroll orizzontale — nessuna bottom-nav
  (index.html:75-85, 2868-2879). Setlist a tapDepth 2 (Basi → 🎼 Canzoni), target ~33px.
- SONGLAB: `gil_songs_v1`, Song `{ id, title, artist, sections:[{name, chords:"A7:4 D9:2"}] }`,
  senza versioning né campi tonalità/tempo/scala/CAGED (index.html:6204, 6229-6252).
- Play canzone passa dal DOM: `#jam-custom-chords` → `jamLoadCustomProgression`
  (index.html:6475-6477) ed eredita sync base/drum, evidenziazione accordo, sequenza scale.
- Time-to-play attuale: backing in tonalità = **4 tap**; scala in tonalità = **4 tap**;
  canzone in play = **3-4 tap**. Obiettivo: ridurre, mai peggiorare.
- Audio: fino a 5 AudioContext, tutti dietro gesto utente (mantenere la garanzia).
- FC.*: 4/5 moduli coperti da 50 test verdi; fc-ui accoppiato ai global del monolite.

## Architettura dell'integrazione (direzione, da confermare con B/C)

1. **Dati**: migrazione `gil_songs_v1 → gil_songs_v2` come da contratto (additiva,
   default espliciti, v1 conservata). Ordine/set in `Setlist = { sets, version }`.
2. **Launchpad**: un tap su una canzone della setlist invoca una funzione unica
   `songlabLaunch(song)` che riusa i ponti esistenti (`jamLoadCustomProgression`,
   `songlabGoStudy`) e i setter già presenti per tonalità/stile/BPM del motore jam;
   configura fretboard/scale/CAGED **solo** dai campi `launch` opzionali, con fallback
   ai default attuali se assenti. Nessuna nuova dipendenza, nessun nuovo AudioContext.
3. **Superficie UI**: la setlist entra nel menu base come punto d'accesso primario
   (forma decisa da C su evidenze di B), con riuso dei componenti lista/tab esistenti.
4. **Rollout sicuro**: modifiche additive; nessun rename delle funzioni globali usate
   da fc-ui/pitch-loop; test `test/*.test.js` eseguiti prima e dopo; verifica manuale
   dei 3 percorsi chiave e della sessione Coscienza (FCUI.init) dopo ogni fase.

## Rischi presidiati

1. Accoppiamento lessicale fc-ui/pitch-loop → global del monolite (no rename, no spostamenti di `const`).
2. Stato-nel-DOM del play SONGLAB (`#jam-custom-chords`): il launchpad ci passa attraverso, non lo bypassa.
3. Ordine di init fragile (14 init eager + lazy per-tab): nessun nuovo init eager; lazy-init del launchpad al primo accesso.
4. Sovraccarico del menu base: l'ingresso della setlist non deve aggiungere una 10ª voce a scroll — decisione a C su evidenza B.
5. Cache GitHub Pages su `index.html` (~556 KB): nessun asset rinominato; documentare hard-refresh in nota di release.
6. Perdita dati: migrazione testata su payload reali esportati; `v1` mai cancellata.

## Metriche di accettazione (prima → dopo)

- Time-to-play backing in tonalità: 4 tap → **≤ 2 tap** dalla setlist.
- Canzone della setlist in play con contesto (tonalità+scala+backing): 3-4 tap senza contesto → **1 tap** con contesto.
- Target touch dei controlli di lancio: ≥ 44px.
- Test FC.*: 50/50 verdi prima e dopo.
- Canzoni salvate: 100% sopravvissute alla migrazione (campi esistenti invariati).

## Esiti B e C recepiti (vincolanti per D ed E)

- [x] **B**: 23 FrictionPt (5 di severità 4). Top-10 = B-01..B-09, B-12. A D competono
      in particolare B-04 (Song senza tonalità/BPM → campi `launch`) e B-13 (play via
      `#jam-custom-chords`: il launchpad ci passa attraverso, bonifica solo se a rischio zero).
      B-10/B-11 (leggibilità) delegati a E.
- [x] **C**: menu base a 4 voci in **bottom-nav** (🎼 Setlist · ▶ Suona · 🎸 Manico · 🧠 Allena)
      + header con tonalità globale e accordatore 1-tap. Setlist = vista d'avvio alla prima
      esecuzione, poi ripristino ultimo contesto. Mapping 47/47 nodi senza orfani.
      Meccanismi nuovi ammessi (6, minimi): bottom-nav su `showPage` esistente; `page-setlist`
      con scheda canzone; store tonalità globale two-way; chiave `gil_ctx_v1` versionata
      (pattern srs-analytics); return-stack; hash-view opzionale.
- [x] Time-to-play autorizzato come criterio di accettazione: backing in tonalità ≤3 tap
      (1-2 dalla setlist); canzone in play = 1 tap; contesto completo ≤3 tap.

## Autorizzazione

Piano firmato dal lead (v1.0). L'Agente D è autorizzato a implementare **solo** quanto
sopra; l'Agente E interviene dopo D, solo su presentazione. Ogni deviazione dai contratti
congelati o dai meccanismi ammessi va riportata al lead prima di procedere.
