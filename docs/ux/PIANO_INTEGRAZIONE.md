# Piano di integrazione — Setlist-as-Launchpad (lead)

> Stato: **bozza v0.2** — sarà finalizzato con gli esiti di B (HEURISTICS.md) e C
> (redesign IA) **prima** che l'Agente D scriva codice. Contratti: `00-contratti-dati.md`
> (congelati). Baseline verificata: `IA_AUDIT.md` (GATE A superato).

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

## Da completare prima del via a D

- [ ] Esiti B: top-10 FrictionPt → vincoli di design per C.
- [ ] Esiti C: MenuNode target + mappa transizioni → specifica UI per D.
- [ ] Firma del lead su questo piano (versione finale) → **solo allora** D scrive codice.
