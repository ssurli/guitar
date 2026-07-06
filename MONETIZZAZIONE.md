# MONETIZZAZIONE — Guitar Improv Lab

> Analisi di prodotto/strategia per la monetizzazione di Guitar Improv Lab.
> **Nota:** la sezione fiscale/legale è solo un orientamento generale, **non è consulenza fiscale**.
> Prima di incassare qualsiasi cosa in modo strutturato, parlare con un commercialista.

---

## 1. Fotografia del prodotto (da `index.html`)

Prima di parlare di soldi, cosa vende (gratis) oggi l'app. È un **singolo file statico** (~11.000 righe) su GitHub Pages, in italiano, 100% client-side, senza account, senza backend, senza raccolta dati:

| Area | Cosa fa |
|---|---|
| **Visualizzatore manico** | Scale su tutta la tastiera, modalità "tutte le note" / "3 note per corda", overlay tecnica |
| **Scale & Accordi** | Libreria scale, 7 modi, progressioni, Scala↔Accordi (in entrambe le direzioni), triadi con inversioni e string set, accordi di 7ª |
| **CAGED** | Forme, modi diatonici, sistema connesso |
| **5 Box Pentatonica** | Maggiore/minore, navigazione tra box, play audio |
| **Circolo delle quinte** | Circolo interattivo + transizione modale |
| **Basi (jam engine)** | Backing track generate in tempo reale con Web Audio: 8 modi/scale × 5 stili (rock, blues/shuffle, metal, funk, ballad), batteria sintetizzata (kick/snare/hihat), basso, accordi, mixer volumi, progressioni custom via chip |
| **"Sotto-agenti" di feedback** | Riconoscimento tonalità della progressione con scoring, scala consigliata per ogni accordo, striscia "sequenza scale", suggerimenti di pratica |
| **Accordatore** | Microfono, 8 accordature, La di riferimento 432–446 Hz, toni di riferimento |
| **Manico Live** | Pitch detection dal microfono: evidenzia sul manico la nota che stai suonando, anti-jitter d'ottava, posizione ancorata al box della scala |
| **Looper** | REC / PLAY / OVERDUB dal microfono |
| **Tecnica** | Sweep, legato, tapping, "Equator Trick", schede di pratica |

**Cosa implica per la monetizzazione:**

- Il valore percepito più alto e più difficile da trovare altrove è la catena **base generata + feedback live dal microfono** (Manico Live + agenti di consiglio scala). È il candidato naturale a qualunque livello "Pro".
- L'app **richiede gear per essere usata al meglio**: microfono decente o interfaccia audio, cuffie, e ovviamente chitarra/corde/plettri. Questo crea un aggancio *organico* — non forzato — con le affiliazioni gear, dove l'autore ha competenza reale.
- Zero backend e zero account: qualunque modello che richieda identità utente (freemium, licenze) introduce complessità che oggi **non esiste** nel prodotto. Va messa in conto come costo, non solo come feature.
- Nicchia: chitarristi italofoni che studiano improvvisazione/scale. Bacino piccolo ma con intento forte (chi cerca "5 box pentatonica" o "CAGED" sta studiando sul serio).

---

## 2. Modelli di monetizzazione a confronto

Legenda sforzo (su sito statico, solo-dev): 🟢 basso (ore) · 🟡 medio (giorni) · 🔴 alto (settimane + manutenzione continua).

### 2.1 Donazioni — Ko-fi / Buy Me a Coffee / GitHub Sponsors

| | Ko-fi | Buy Me a Coffee | GitHub Sponsors |
|---|---|---|---|
| Commissioni | 0% sulle donazioni (piano free); PayPal/Stripe fees a parte | 5% + fees | 0% (GitHub non trattiene) |
| Pubblico adatto | Pubblico generico, anche non-tech | Pubblico generico | Solo chi ha un account GitHub — pubblico sbagliato per chitarristi |
| Ricorrenza | Sì (membership opzionali) | Sì | Sì |
| Integrazione su statico | Link o widget overlay, 10 minuti | Link o widget | Bottone "Sponsor" sul repo + link |

- **Pro:** sforzo quasi nullo 🟢, nessun impatto sull'esperienza, nessun obbligo verso chi dona, compatibile con il posizionamento "gratis e senza pubblicità".
- **Contro:** rende pochissimo. Le donazioni convertono tipicamente **sotto lo 0,5% degli utenti affezionati**, non dei visitatori. Su un progetto di nicchia parliamo di caffè, non di reddito.
- **Verdetto:** da fare comunque perché costa un'ora, ma **non è un modello di business**, è un termometro dell'affetto degli utenti. Scelta consigliata: **Ko-fi** (0% commissioni, pubblico non-tech, pagina in grado di ospitare anche vendite digitali in futuro). GitHub Sponsors solo come canale aggiuntivo sul repo.

### 2.2 Affiliazioni gear — l'angolo forte 🟢

Qui c'è un vantaggio competitivo reale: l'autore è **esperto di rig** (corde, plettri, interfacce, pedali). I contenuti di affiliazione scritti da chi il gear lo usa davvero convertono e si posizionano meglio di quelli generici.

| | Thomann (Linkbuilder/affiliate) | Amazon Associates |
|---|---|---|
| Commissione | ~5% (variabile per categoria) | ~3–4% su strumenti musicali, in calo storico |
| Cookie | ~ molti giorni | 24 ore |
| Fit col pubblico | **Perfetto**: Thomann è *il* negozio dei chitarristi europei/italiani | Buono ma generico |
| Pagamento | Bonifico, soglie basse | Soglie e regole più rigide, ban facili |

**Come integrarle in modo non invasivo (proposta concreta):**

1. **Pagina/sezione "Gear consigliato per il Manico Live"** — il gancio perfetto: *"Per usare l'accordatore, il Manico Live e il looper al meglio ti serve un segnale pulito. Ecco cosa uso io."* Interfacce audio entry-level, un microfono, cuffie chiuse. È un consiglio che l'utente **sta già cercando** nel momento in cui la pitch detection funziona male col microfono del laptop.
2. **Box contestuali discreti** — es. nella scheda Accordatore: "corde nuove = intonazione migliore" con 2–3 mute di corde consigliate; nella scheda Tecnica: plettri per sweep/alternate picking.
3. **Regole di igiene:** dichiarare sempre che i link sono affiliati (obbligo di trasparenza), mai popup, mai interrompere il flusso di studio, consigli in prima persona e motivati ("perché questa interfaccia e non quella").

- **Pro:** sforzo basso 🟢, zero impatto UX se fatto come sopra, sfrutta una competenza vera, cresce col traffico organico (le pagine gear sono anche pagine SEO).
- **Contro:** ricavi proporzionali al traffico, che oggi è presumibilmente piccolo; commissioni basse in valore assoluto (5% su un set di corde da 8 € = 40 centesimi; il valore vero è su interfacce/pedali da 100–300 €).
- **Verdetto:** **la prima mossa con un rapporto sforzo/resa sensato**, e l'unica che valorizza l'expertise gear dell'autore.

### 2.3 Freemium (FREE vs PRO)

Ripartizione proposta, coerente con l'ipotesi del brief e con il codice attuale:

| FREE (resta gratis) | PRO |
|---|---|
| Manico, scale, modi, CAGED, penta, circolo | Agenti di feedback avanzati (analisi della sessione: note fuori scala, timing, report) |
| Basi con gli stili base (rock, blues) | Tutti gli stili + nuovi stili futuri, progressioni custom illimitate |
| Accordatore, Manico Live base, looper 1 traccia | Export tab/PNG dei diagrammi, salvataggio libreria personale (progressioni, scale preferite) |
| Feedback base (nota rilevata) | Backing track scaricabili, calibrazione avanzata del pitch detection, looper multitraccia |

**Regola d'oro:** il FREE deve restare *il miglior tool gratuito della nicchia* — è la ragione per cui la gente arriva. Il PRO vende **memoria e profondità** (salvataggio, export, analisi), non toglie ciò che oggi è gratis: togliere funzioni esistenti brucerebbe la fiducia degli utenti attuali.

- **Pro:** unico modello con potenziale di reddito vero e ricorrente; il valore c'è (il feedback live è raro anche tra prodotti a pagamento).
- **Contro:** sforzo alto 🔴 — servono account o licenze, gating, pagamenti, supporto clienti, e il paragrafo §3 spiega perché su un sito statico il gating è un compromesso. Inoltre **prima serve traffico**: freemium con 100 utenti/mese non paga nemmeno il commercialista.
- **Verdetto:** giusto come *fase 2*, solo dopo che donazioni+affiliazioni e i dati di traffico confermano un pubblico che torna.

### 2.4 Una-tantum / lifetime vs abbonamento

| | Una-tantum / lifetime | Abbonamento |
|---|---|---|
| Fit con solo-dev hobby | **Ottimo**: nessuna promessa implicita di sviluppo continuo | Rischioso: un abbonamento è una promessa di manutenzione e novità costanti |
| Fit con la nicchia | Ottimo: i chitarristi sono abituati a comprare pedali/plugin una volta | Sofferto: fatica ad accettare l'ennesimo abbonamento da 5 €/mese |
| Ricavo | Picco iniziale, poi code lunghe | Ricorrente ma con churn da gestire |
| Prezzo indicativo | 19–39 € lifetime | 3–5 €/mese |
| Complessità fiscale/tecnica | Identica (vedi §3 e §4) | Identica + gestione rinnovi/churn |

**Verdetto:** per un progetto hobby solo-dev, **lifetime una-tantum**, senza esitazioni. L'abbonamento ha senso solo se in futuro ci fossero costi ricorrenti veri (server, contenuti mensili). Piattaforme: vedi §3.1 — **Lemon Squeezy o Gumroad** (Merchant of Record) battono Stripe Payment Links per un motivo fiscale preciso, spiegato lì.

### 2.5 Vendita di contenuti (tab pack, backing track, mini-lezioni)

- **Cosa:** pack di backing track scaricabili (WAV/MP3 per stile e tonalità — l'engine per generarle c'è già), PDF/tab dei box e delle diagonali CAGED "da stampare", mini-corsi tematici ("le 5 posizioni collegate", "improvvisare sui modi").
- **Pro:** 🟡 sforzo medio e *una tantum* per prodotto; si vende da una pagina Gumroad/Ko-fi Shop **senza toccare il sito**; nessun gating; margine 100% digitale; sinergia naturale col sito (il tool gratuito è il funnel, il contenuto è il prodotto).
- **Contro:** i backing track gratuiti su YouTube sono infiniti — il pack va differenziato (es. "gli stessi groove dell'app, mixati, in tutte le 12 tonalità, con PDF della scala consigliata"); le mini-lezioni richiedono tempo di produzione e concorrenza feroce.
- **Verdetto:** buona **fase 1.5**: è il modo più semplice di testare se il pubblico paga, *prima* di costruire il freemium. Un solo prodotto pilota (es. "Pentatonic Jam Pack" a 9 €) dice più di qualunque analisi.

### 2.6 Licenze / white-label a scuole di musica, embed

- **Cosa:** licenza annuale a scuole di musica o insegnanti (logo personalizzato, nessun link di donazione, eventuale dominio proprio), oppure embed del visualizzatore su altri siti.
- **Pro:** B2B = pochi clienti con scontrino più alto (100–300 €/anno a scuola); il prodotto in italiano è raro nel settore didattico italiano.
- **Contro:** 🔴 richiede vendita attiva (email, telefonate, demo agli insegnanti) — l'opposto del profilo hobby/solo-dev; aspettative di supporto e personalizzazione; contratti; e servono comunque le basi fiscali (P.IVA con fattura, le scuole la chiedono).
- **Verdetto:** **non ora.** Da rivalutare solo se arrivano richieste spontanee da insegnanti (segnale che il canale esiste). Nel frattempo, una riga "Sei un insegnante? Scrivimi" in footer costa zero e fa da sensore.

---

## 3. Fattibilità tecnica su sito statico

### 3.1 Pagamenti senza backend

| Piattaforma | Merchant of Record (gestisce l'IVA UE per te) | Commissioni | Note |
|---|---|---|---|
| **Lemon Squeezy** | ✅ Sì | ~5% + 0,50 $ | Checkout overlay integrabile in pagina statica; API licenze incluse |
| **Gumroad** | ✅ Sì | 10% flat | Il più semplice in assoluto; ottimo per contenuti (§2.5) |
| **Paddle** | ✅ Sì | ~5% + 0,50 $ | Più orientato a software "serio", onboarding più selettivo |
| **Stripe Payment Links** | ❌ **No** | ~1,5–2,9% | Commissioni più basse, ma **sei tu il venditore**: IVA UE, OSS, fatture — tutto a carico tuo |
| **Ko-fi Shop** | ❌ No (ma per importi da donazione il tema è più leggero) | 0–5% | Bene per donazioni e piccoli digitali |

**Punto chiave:** su vendite digitali B2C in UE, l'IVA si applica **nel paese del cliente**. Un Merchant of Record (Lemon Squeezy, Gumroad, Paddle) vende lui al cliente e ti gira il netto: **l'incubo IVA/OSS sparisce** e a te resta "solo" da dichiarare il ricavo. Per un solo-dev questo vale ampiamente il 5–10% di commissione in più rispetto a Stripe. **Stripe Payment Links è sconsigliato** finché i volumi non giustificano un commercialista che gestisca l'OSS.

### 3.2 Il gating: onestà sul trade-off

**Qualunque gating solo client-side su un sito statico è aggirabile in minuti** da chiunque apra i DevTools: il codice "Pro" è già nel browser, il flag `isPro` si forza dalla console. Tre livelli, dal più onesto al più robusto:

1. **Gating "sull'onore" (client-only)** 🟢 — chiave di licenza validata in JS/localStorage. Aggirabile, sì. Ma per un prodotto da 19–39 € in una nicchia affezionata, **chi vuole pagare paga, chi cracka non avrebbe pagato comunque**. È il modello di tanti plugin e app indie. Costo: quasi zero. Difetto reale: il codice Pro è pubblico nel repo/pagina, quindi "gating" è più che altro cortesia.
2. **Verifica licenza via edge function** 🟡 — Cloudflare Workers (free tier: 100k richieste/giorno) o Netlify Functions che chiamano l'API licenze di Lemon Squeezy/Gumroad. Il sito resta statico; solo la verifica passa dal worker. Ferma il 95% degli aggiramenti banali, ma **le feature restano nel bundle client**: un utente determinato le sblocca comunque. Aggiunge un componente da mantenere e un account in più.
3. **Feature servite dal server** 🔴 — le funzioni Pro (es. generazione/export dei backing track, salvataggio cloud) vivono in un worker/API e il client riceve solo il risultato. Unico gating *vero*, ma a quel punto il sito non è più statico: costi, manutenzione, autenticazione. Da considerare solo con ricavi che lo giustificano.

**Raccomandazione tecnica:** se/quando si fa il Pro, partire dal **livello 1 o 2** (chiave Lemon Squeezy + verifica opzionale via Cloudflare Worker), accettando esplicitamente che il gating è morbido. Il valore da proteggere qui non è il segreto industriale — è la comodità: salvataggio, export, contenuti scaricabili. E quelli (livello 3 "parziale": solo il download passa dal server) sono naturalmente più difficili da crackare perché il *contenuto* non è nel client.

---

## 4. Aspetti fiscali/legali (Italia) — solo orientamento

> ⚠️ **Questa NON è consulenza fiscale.** Norme e soglie cambiano; quanto segue serve solo a orientarsi. Verificare tutto con un commercialista prima di incassare in modo strutturato.

- **Donazioni (Ko-fi ecc.):** se occasionali e di modesta entità, in genere rientrano tra le liberalità/redditi da gestire in dichiarazione; non fanno scattare da sole l'obbligo di P.IVA. Vanno comunque dichiarate.
- **Affiliazioni:** i proventi da affiliazione sono redditi. Se l'attività è **occasionale e non organizzata**, si può ricadere nei "redditi diversi" (prestazione occasionale, dichiarazione nel quadro RL, ritenute a seconda del committente). Se diventa **abituale** (link permanenti sul sito che generano commissioni ogni mese = facilmente "abituale" per il Fisco), serve la **P.IVA**.
- **Vendite digitali (Pro, tab pack):** vendere in modo continuativo richiede P.IVA. Per un solo-dev il **regime forfettario** è la via naturale: imposta sostitutiva 15% (5% per i primi 5 anni se nuova attività), niente IVA sulle fatture nazionali, contabilità minima; limite ricavi 85.000 €/anno. Attenzione ai requisiti di accesso (es. redditi da lavoro dipendente oltre soglia possono escluderlo — caso frequente per chi ha già un lavoro).
- **IVA UE su digitale (OSS/ex-MOSS):** vendendo B2C in altri paesi UE, sopra la soglia di 10.000 €/anno l'IVA va versata nel paese del cliente tramite il regime **OSS**. È esattamente la complessità che un **Merchant of Record elimina**: con Lemon Squeezy/Gumroad il venditore verso il cliente finale è la piattaforma, e tu fatturi/dichiari solo quanto la piattaforma ti gira.
- **E-commerce "in proprio":** vendere direttamente (Stripe) può comportare anche adempimenti come la SCIA per commercio elettronico al Comune — un motivo in più per passare da un MoR all'inizio.
- **Obblighi minimi lato sito:** disclosure dei link affiliati (trasparenza pubblicitaria), privacy policy se si introducono analytics/cookie/account, termini d'uso se si vende.
- **Ordine pratico dei rischi:** donazioni < affiliazioni < vendita via MoR < vendita diretta. La roadmap del §5 è ordinata anche per *complessità fiscale crescente*, non solo per sforzo tecnico.

---

## 5. Roadmap prioritizzata

### Fase 0 — Misurare (subito, mezza giornata)
Senza numeri di traffico ogni decisione è al buio. Aggiungere un analytics privacy-friendly senza cookie (es. GoatCounter, gratuito, o Plausible) e guardare per 4–8 settimane: visitatori, ritorno, pagine più usate. *(Unica "feature" tecnica di questa roadmap, ed è minuscola.)*

### Fase 1 — Donazioni + affiliazioni gear (1–2 settimane di lavoro leggero) 🟢
1. Pagina **Ko-fi** + link discreto nel footer/header ("☕ Offrimi un caffè") e bottone Sponsor sul repo.
2. Iscrizione al programma affiliazione **Thomann** (+ eventualmente Amazon).
3. Sezione **"Gear consigliato"**: pagina dedicata (interfacce, microfoni, cuffie per il Manico Live) + 2–3 box contestuali (corde nell'accordatore, plettri in Tecnica). Sempre con disclosure.
4. Verificare col commercialista l'inquadramento dei proventi da affiliazione (occasionale vs abituale).

### Fase 1.5 — Prodotto pilota di contenuti (opzionale, 2–4 settimane) 🟡
Un solo prodotto su **Gumroad o Ko-fi Shop**: es. "Pentatonic Jam Pack" (backing track esportate dall'engine in 12 tonalità + PDF dei 5 box) a ~9 €. Zero modifiche al sito oltre a un link. **Serve a testare la disponibilità a pagare della nicchia con il minimo investimento.**

### Fase 2 — Freemium Pro lifetime (solo se Fase 0–1.5 danno segnali) 🔴
Precondizioni: traffico in crescita, utenti che tornano, qualche vendita del pilota. Poi:
- **Lemon Squeezy** (MoR + API licenze), prezzo lifetime 19–39 €.
- PRO = salvataggio libreria personale, export tab/PNG, tutti gli stili, backing track scaricabili, feedback avanzato, calibrazione. FREE resta intatto.
- Gating livello 1–2 (§3.2): chiave licenza + eventuale verifica via Cloudflare Worker. Accettare il gating morbido.
- P.IVA forfettaria a questo punto è quasi certamente necessaria.

### Fase 3 — B2B scuole (solo se trainata dalla domanda)
Nessun investimento attivo: una riga "Insegnante o scuola di musica? Scrivimi" nel footer. Si costruisce solo se qualcuno bussa.

---

## 6. Stima realistica del potenziale di ricavo

Ipotesi onesta per un sito di nicchia italofona, solo-dev, senza marketing attivo. Sono **ordini di grandezza**, non previsioni.

| Scenario | Traffico mensile | Donazioni | Affiliazioni | Contenuti/Pro | Totale/mese |
|---|---|---|---|---|---|
| **Oggi/basso** (probabile primo anno) | 300–1.000 visite | 0–10 € | 5–30 € | 0–20 € | **≈ 5–60 €** |
| **Medio** (SEO + passaparola, 1–2 anni) | 3.000–10.000 visite | 10–30 € | 30–150 € | 50–200 € | **≈ 100–400 €** |
| **Alto** (top di nicchia IT, forse con canale YouTube a supporto) | 20.000+ visite | 30–80 € | 150–500 € | 300–1.000 € | **≈ 500–1.500 €** |

Letture oneste di questa tabella:

- Nel primo anno il ricavo realistico è **paghetta, non reddito**: decine di euro al mese. Chi promette di più su una nicchia italofona senza canale di distribuzione sta gonfiando.
- La variabile dominante **non è il modello di monetizzazione, è il traffico**. Con 500 visite/mese, nessun modello rende; con 10.000, quasi tutti rendono qualcosa. L'investimento a più alto ritorno potrebbe essere *contenuti/SEO/YouTube*, non feature.
- Il tetto della nicchia in sola lingua italiana è basso; una versione **inglese** moltiplicherebbe il bacino di ~20–30× ed è probabilmente la singola leva di crescita più grande (fuori scope di questo documento, ma va detto).
- Il freemium ha senso economico solo dallo scenario "medio" in su: sotto, i costi fissi (commercialista ~500–1.000 €/anno, tempo di sviluppo del gating/licenze) mangiano tutto.

---

## 7. Raccomandazione finale

**Se si deve partire con UNA sola cosa: la sezione "Gear consigliato" con affiliazione Thomann.**

Perché proprio questa:

1. **È l'unico modello che sfrutta un vantaggio competitivo reale** — la competenza gear dell'autore. Le donazioni le chiedono tutti; il freemium richiede mesi; ma una guida onesta "che interfaccia comprare per far funzionare bene il Manico Live" la può scrivere solo chi il rig lo conosce davvero.
2. **È organica al prodotto**: l'app *ha bisogno* di un segnale audio pulito (accordatore, Manico Live, looper). Il consiglio gear arriva nel momento esatto del bisogno dell'utente — è servizio, non pubblicità.
3. **Sforzo minimo, zero rischio di prodotto**: nessun gating, nessun account, nessuna promessa di manutenzione, nessuna feature da proteggere. Se non rende, si è perso un weekend.
4. **Fiscalmente è il gradino più basso** dopo le donazioni: si può partire come attività occasionale e strutturarsi solo se i numeri lo chiedono.
5. **Genera anche SEO**: le pagine gear portano traffico nuovo, che alimenta tutti i modelli successivi (donazioni, pilota di contenuti, futuro Pro).

Subito dietro, e complementare a costo quasi zero: il link Ko-fi. Il freemium resta la destinazione giusta *sul lungo periodo* — il feedback live è un valore raro anche tra i prodotti a pagamento — ma va costruito solo quando il traffico e un prodotto-pilota avranno dimostrato che la nicchia paga.
