# Contratti dati congelati — pacchetto UX Setlist-as-Launchpad

> **Stato: CONGELATO** (v1, 2026-07-10). Nessun agente (B, C, D, E) può modificare questi
> contratti. Estensioni solo additive e opzionali, previa approvazione del lead.
> Prerequisito rispettato: l'inventario dell'architettura attuale è in `A-audit-inventario.md`.

## Principi vincolanti

1. **Audit prima di redesign** — si migliora ciò che esiste, non si riparte da zero.
2. **Mani occupate** — target touch ≥44px, leggibilità a distanza, poche interazioni.
3. **Time-to-play** — metrica primaria: tap dall'apertura a "sto suonando su un backing
   nella tonalità giusta". Da minimizzare e misurare prima/dopo.
4. **Mobile-first, una mano** — controlli critici nella zona del pollice (metà bassa).
5. **Contesto prova/live** — la setlist porta a suonare un pezzo in fretta.
6. **Continuità di stato** — canzone → tonalità → scala → backing → drill senza perdere contesto.
7. **Setlist-as-launchpad** — ogni canzone è una rampa di lancio che configura l'app
   (fretboard, scale suggerite, tempo/backing, CAGED, drill target-tone in tonalità).

## Vincoli tecnici immutabili

- Integrazione nel monolite `index.html` **senza regressioni** sui moduli `FC.*` testati
  (`pedagogy-engine`, `fretboard-theory`, `pitch-loop`, `srs-analytics`, `fc-ui`).
- Riuso dei componenti UI esistenti; nessuna dipendenza esterna nuova se evitabile.
- Persistenza `localStorage` **con versioning** e migrazione non distruttiva.
- `AudioContext` creato/ripreso **solo su gesto utente**.

## Contratti

```js
// Nodo dell'inventario/redesign di navigazione (usato da A, B, C)
MenuNode   = { id, label, icon, parent, screen, tapDepth, usage /*0-3*/,
               action /* keep|merge|move|drop */ }

// Punto di frizione della valutazione euristica (usato da B, C)
FrictionPt = { where, heuristic, severity /*1-4*/, evidence, fix }

// ⚠️ NON creare un modello nuovo: la setlist ESISTE già come SONGLAB
// (localStorage 'gil_songs_v1'). Song ESTENDE lo schema esistente
// { id, title, artist, sections[].chords } aggiungendo campi OPZIONALI:
Song       = { id, title, artist, sections[],   // ← esistente, non toccare la forma
               set /*1|2|'bis'*/, order,
               status /* 'rodata'|'da_rivedere'|'nuova' */,   // ← nuovi, opzionali
               notes,
               launch: { fretboardKey, suggestedScales /*[]*/,
                         backingPreset, cagedFocus } }        // ← blocco launchpad, opzionale

Setlist    = { sets: { 1: [songId...], 2: [songId...], bis: [songId...] }, version }
```

## Migrazione

`gil_songs_v1` → `gil_songs_v2`: al load, se presente `v1`, copiare le canzoni
aggiungendo i campi mancanti con default (`set: null`, `order: indice`,
`status: 'nuova'`, `notes: ''`, `launch: null`), scrivere `v2`, **non cancellare `v1`**
(rollback possibile). Ogni canzone salvata deve sopravvivere invariata nei campi esistenti.

### Addendum (v1.1) — `gil_songs_v1` come canale INBOUND del ponte chordlab/guitarzorn

Il progetto esterno **guitarzorn/chordlab** gira sullo stesso origine `ssurli.github.io`
(quindi stesso `localStorage`) e consegna la sua playlist scrivendo `gil_songs_v1`.
La vecchia app leggeva `v1` direttamente; la nuova legge `v2` per primo, perciò `v1` non
è solo un formato legacy da migrare una volta, ma un **canale di ingresso vivo**.

Regola di riconciliazione (merge **non distruttivo**, deciso dall'utente):
- a ogni `load`, le canzoni di `v1` il cui `id` non è già in `v2` **né** nel ledger
  vengono **aggiunte** a `v2` (mai sovrascritte le esistenti: gli edit in-app vincono);
- `v2` guadagna il campo **`importedV1Ids: [id…]`** (ledger delle canzoni già importate
  dal ponte): evita i doppioni e impedisce che una canzone cancellata in-app **resusciti**;
- `save` da mutazione in-app **preserva** il ledger; `v1` non viene mai scritta né cancellata.

## Regole per gli agenti

- **B (euristica)**: output solo come lista di `FrictionPt`; nessuna proposta di IA.
- **C (redesign IA)**: output come tabella `MenuNode` target + mappa transizioni;
  ogni `drop`/`merge` motivato da un `FrictionPt` o da `usage` dell'audit.
- **D (integrazione setlist)**: unico agente che scrive codice per il launchpad;
  rispetta schema `Song`/`Setlist` e migrazione qui sopra; test manuali dei flussi FC.*.
- **E (visual polish)**: solo CSS/markup; nessun cambiamento di schema o di logica.
