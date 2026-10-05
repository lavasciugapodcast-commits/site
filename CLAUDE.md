# Lavasciuga — Sito Web

Sito ufficiale di **Lavasciuga** ("Podcast & more"): il podcast e un blog con cinque categorie: Generale, Arte,
Sport, Cucina, Finanza.

## Stack

- HTML, CSS e JavaScript "vanilla". **Nessun framework, nessuna dipendenza npm.**
- **Jekyll solo per il blog**: GitHub Pages costruisce il sito con Jekyll a ogni push (nessuna installazione lato GitHub).
  Passano dal modello solo i file con front matter (`---` in cima): gli articoli in `_posts/`, `index.html`, `blog.html`
  e le pagine delle categorie (`generale.html`, `arte.html`, `sport.html`, `cucina.html`, `finanza.html`).
  Tutte le altre pagine non hanno front matter e vengono copiate così come sono.
- Anteprima in locale (Ruby 3.3 in `C:\Ruby33-x64`, gemme in `vendor/` con Bundler, vedi `Gemfile`):
  `bundle exec jekyll serve --host 0.0.0.0 --port 8080 --baseurl ""` (prima volta: `bundle install`).
  Si aggiorna da solo quando cambi un file. Da telefono (stessa Wi-Fi): `http://<IP-del-PC>:8080`.
  Con `python -m http.server 8080` si vedono tutte le pagine tranne articoli ed elenchi di articoli (home, blog, categorie).
- `Gemfile` usa `github-pages`: stesse versioni di Jekyll e plugin di GitHub Pages (Jekyll 3.10). `_site/`, `vendor/`,
  `Gemfile.lock` non vanno nel repository (`.gitignore`).

## Struttura

```
index.html        Home: claim, player con l'ultimo episodio + 3 precedenti, "Dal blog" con gli ultimi 3 articoli
podcast.html      Player, link alle piattaforme, elenco di tutti gli episodi con ricerca
blog.html         Tutti gli articoli, con la categoria accanto alla data (generati da Jekyll, più recente in cima)
generale.html, arte.html, sport.html, cucina.html, finanza.html
                  Una pagina per categoria del blog (voci del sottomenu "Blog")
_data/autori/     Profili degli autori, uno per file (<id>.yml): nome, foto, bio, social
_posts/           Articoli in Markdown: AAAA-MM-GG-slug.md  ->  /blog/slug.html
_layouts/         articolo.html: modello della pagina articolo
_config.yml       Configurazione Jekyll (indirizzi degli articoli, file esclusi)
admin/            Pannello per i collaboratori (Sveltia CMS): index.html + config.yml
privacy.html      Privacy policy
cookie.html       Cookie policy
contatti.html     Email (lavasciuga.podcast@gmail.com) e social
about.html        Chi siamo
css/style.css     Unico foglio di stile (palette del logo in :root, dark mode inclusa)
js/main.js        Menu mobile, voce attiva, anno nel footer, tema chiaro/scuro
js/podcast.js     Player audio del podcast + elenco episodi (solo index e podcast)
assets/           Logo ridimensionato (logo-64/192/512.png); assets/blog/ e assets/autori/ immagini dal pannello
media/            Originali ad alta risoluzione (logo 2048px): non linkarli dalle pagine
caroselli/        Caroselli Instagram in HTML (esclusi dal sito pubblicato, vedi _config.yml)
```

## Layout e stile

- Header antracite con solo il logo (il nome è già nel logo), grande, che sborda sotto la riga turchese (`--logo`,
  `--head-top` in `:root`), e il menu orizzontale allineato a destra.
  Menu: Podcast · Blog ▾ · Contatti · About · Sostieni. "Blog" ha un sottomenu con le categorie (`.has-sub`, `.sub-menu`):
  su desktop si apre al passaggio del mouse o con la freccia (`.sub-toggle`), Esc e clic fuori lo chiudono; nel menu
  mobile le categorie sono sempre visibili, rientrate. Pagine delle categorie e articoli accendono "Blog" (`.is-current`).
  Sotto gli 800px il menu diventa un pannello a tutto schermo aperto dal pulsante "Menu"; sotto i 600px logo e header si rimpiccioliscono.
- Colori dal logo: antracite `--charcoal`, rosa cervello `--pink`, turchese acqua `--teal`, crema cartellino `--paper`.
  Il rosa e il turchese chiaro sono per sfondi/riempimenti, non per testo su crema (contrasto basso): per il testo usare `--teal-ink` / `--pink-deep`.
- Font: Archivo (titoli larghi e pesanti, come la scritta del logo) + IBM Plex Mono per etichette e date, da Google Fonts.
- Stile editoriale: righe nette, liste invece di card, niente ombre, gradienti o emoji.
- Tema: segue il dispositivo; il pulsante sole/luna nell'header lo forza (salvato in `localStorage` "tema", attributo `data-theme` su `<html>`).
  I colori scuri sono definiti due volte in `style.css` (media query + `[data-theme="dark"]`): se ne cambi uno, cambia anche l'altro.
  Ogni pagina ha nell'`<head>` lo script inline che applica il tema prima del disegno: copialo nelle pagine nuove.
- Podcast: player audio nostro in `js/podcast.js` (caricato solo da `index.html` e `podcast.html`, dopo `main.js`).
  Niente widget/iframe di Spreaker: tutto arriva dall'API pubblica (`api.spreaker.com/v2/shows/6470341/episodes`),
  l'audio è il `playback_url` ufficiale (gli ascolti contano su Spreaker), la forma d'onda è il `waveform_url`.
  - `<div class="lv-player" data-show-id="6470341">`: player in evidenza, sempre sull'ultimo episodio.
  - `<ol class="episodes" id="..." data-show-id="6470341">`: elenco; "Ascolta" apre un player compatto sotto la riga
    (uno aperto alla volta, "Chiudi" lo richiude). `#ep-<id>` nell'URL apre quell'episodio nell'elenco.
  - Un solo `<audio>` per pagina e più "viste" legate a un episodio (`createView`): si aggiornano da sole quando il loro
    episodio è quello in riproduzione. Sotto ogni player c'è la descrizione (dal dettaglio `/v2/episodes/<id>`, campo
    `description` in testo semplice: i link li rendiamo cliccabili noi, niente HTML esterno), con "Mostra tutto" se lunga.
    Opzioni `data-offset`, `data-limit`. Ricerca e contatore opzionali (`data-episode-search` / `data-episode-count`).
  - Mini barra fissa in basso quando nessun player dell'episodio in corso è visibile; posizione di ascolto (`pos-<id>`) e velocità
    (`velocita`) salvate in `localStorage`; controlli sulla schermata di blocco del telefono (Media Session).
  - Sugli indirizzi locali (es. `192.168.x.x`) aggiunge `<meta name="referrer" content="no-referrer">`: Spreaker
    non fa partire l'audio se riceve un referrer locale. Online il referrer resta.
  - Il tema cambia solo i colori (evento `themechange` da `main.js` → ridisegna la forma d'onda): l'audio non si ferma.
  - Non scrivere gli episodi a mano e non incollare il codice embed di Spreaker.

## Convenzioni

- Lingua del sito: **italiano**. Testi, `alt`, `title` e meta description in italiano.
- Header e footer sono duplicati in ogni pagina: se li modifichi, aggiornali in **tutte** le pagine `.html`.
- Colori, font e spaziature solo tramite le variabili CSS in `:root` di `css/style.css`. Niente colori hardcoded.
- Mobile-first: verifica sempre il layout a 375px di larghezza.
- Accessibilità: HTML semantico (`header`, `nav`, `main`, `article`, `footer`), contrasto sufficiente, ogni immagine con `alt`.
- I contenuti segnaposto sono marcati con il commento `<!-- TODO: contenuto reale -->`.
- Nuova pagina: copia `about.html` come base, aggiorna `<title>`, meta description e aggiungi il link nel menu (`.main-nav`) di tutte le pagine
  (e in `_layouts/articolo.html`, dove i percorsi iniziano con `../`).

## Sostieni (Ko-fi)

- Link: `https://ko-fi.com/lavasciugapodcast` (costante `KOFI_URL` in `js/main.js`).
- Pulsante "Sostieni" turchese come ultima voce del menu (`<li class="nav-cta">`) in **tutte** le pagine, più "Ko-fi" nel footer.
  Se il menu cresce ancora, ricontrolla che stia su una riga a 801px (sotto passa al menu mobile). Oggi l'header ne occupa 738px.
- Banner negli articoli: li aggiunge `js/main.js` da solo, uno a metà del testo (articoli di almeno ~250 parole) e uno
  in fondo. La posizione si misura sulla lunghezza del testo (`textBreak`), quindi funziona anche senza titoletti: se c'è
  un `<h2>` vicino al punto giusto cade prima di quello, altrimenti tra due paragrafi. Per sceglierne la posizione a mano: `<div data-sostieni></div>` nel testo
  (in quel caso quelli automatici non vengono aggiunti).
- Banner: quello a metà dice "Ti sta piacendo?", quello in fondo "Ti è piaciuto?" (`supportBanner(titolo)`).
- Popup "Ciclo completo!" a fine puntata (`js/podcast.js`): negli ultimi 20 secondi o alla fine dell'episodio, una volta
  per episodio (`localStorage` "sostieni-<id>"). È un `<dialog>` modale: Esc, clic fuori o "Non ora" lo chiudono.

## Articoli e categorie del blog

- Ogni articolo è un file Markdown in `_posts/AAAA-MM-GG-slug.md`; l'indirizzo è sempre `/blog/slug.html`, qualunque sia la
  categoria (cambiarla non rompe il link). La categoria è il campo `categories`: `generale`, `arte`, `sport`, `cucina`
  o `finanza`. **Va sempre scritta** (il pannello lo fa da solo, "Generale" preselezionato): senza, l'articolo non compare in
  nessuna pagina di categoria. Niente valore predefinito in `_config.yml`: Jekyll lo sommerebbe a quello dell'articolo.
- `blog.html` elenca tutti gli articoli (`site.posts`), le pagine delle categorie solo i loro (`site.categories.<cat>`),
  la home gli ultimi 3 ("Dal blog"). Li genera Jekyll: **non si scrivono a mano**. Blog e categorie hanno in cima le
  scorciatoie alle cinque categorie (`.cat-links`).
- La pagina la genera `_layouts/articolo.html`: in cima "Blog / Categoria", in fondo "← Tutti gli articoli di …";
  `<body data-categoria="...">` serve a `js/main.js` per accendere la voce giusta del menu.
- **Bozze**: il campo `published` (nel pannello l'interruttore "Online") decide se l'articolo è sul sito. Gli articoli nuovi
  nascono con `published: false`: il file è salvato nel repository ma Jekyll non crea la pagina e non lo mette negli elenchi.
  Accenderlo e salvare lo pubblica; spegnerlo lo toglie dal sito senza cancellarlo. Nel pannello l'elenco mostra
  "Bozza"/"Online" e ha i filtri "Bozze (offline)" e "Online". Senza il campo Jekyll pubblica: negli articoli scritti a mano
  metterlo sempre. Il repository è pubblico, quindi il testo delle bozze è leggibile su GitHub da chi lo cerca: non è
  un posto per contenuti riservati. In locale le bozze si vedono aggiungendo `--unpublished` a `jekyll serve`.
- Campi in testa al file (front matter): `published`, `title`, `categories` (categoria), `evidenzia` (parole del titolo da mettere in
  rosa, facoltativo), `lead` (sottotitolo), `date`, `autore` (id di un profilo in `_data/autori/`), `copertina` +
  `copertina_alt` (facoltativi), `episodio` (link Spreaker dell'episodio collegato: il box "Ne abbiamo parlato in
  puntata" si completa da solo con l'API), `nota` (avviso in cima), `link` (lista di `titolo` + `url` + `nota`
  facoltativa: box "Da ascoltare, guardare, leggere" dopo il testo, prima del box autore; la piattaforma (YouTube,
  Spotify…) la ricava il modello dall'indirizzo, altrimenti mostra il dominio. Solo link, niente video incorporati).
- Nuova categoria: opzione in `admin/config.yml` (campo Categoria), pagina come `arte.html` (e voce in `.cat-links` di
  tutte le pagine di blog/categoria), `case` in `_layouts/articolo.html`, voce nel sottomenu di tutte le pagine.
- Il modo normale di scrivere è il pannello `/admin`; a mano basta creare il file con gli stessi campi.
- Tempo di lettura e data in italiano li calcola il modello (~200 parole al minuto).
- Le immagini caricate dal pannello vanno in `assets/blog/` e nel testo hanno percorso `/assets/blog/...`: il modello
  lo corregge in `../assets/blog/...` (il sito sta in una sottocartella finché non c'è il dominio).
- Primo articolo vero: `2026-10-03-nasce-il-sito-di-lavasciuga.md` (Generale). Gli articoli `2026-10-01-ciclo-delicato.md`
  e `2026-10-02-articolo-di-prova.md` (Generale) sono esempi (il primo marcato TODO): vanno sostituiti o cancellati.

## Caroselli Instagram

- Un file HTML per carosello in `caroselli/` (es. `2026-10-03-nasce-il-sito.html`), escluso dal sito pubblicato.
  Si apre direttamente dal file: slide 1080×1350 con lo stile del sito, logo incorporato (una volta, variabile `--logo`).
- In ogni slide in alto "Lavasciuga" e il numero (01 / 07); in basso l'acqua turchese che sale slide dopo slide
  (`--h` sulla `.slide`; lo spazio del testo si adatta, `.body` ha `padding-bottom: calc(var(--h) + 110px)`).
- "Scarica PNG" esporta le slide con html-to-image (da jsDelivr, serve la connessione); "Vista ridotta" le mostra
  affiancate. In alternativa: plugin di cattura del browser in "Dimensione reale".
- Per un carosello nuovo: copiare il file e cambiare i testi delle `<section class="slide">`; ricontrollare che il testo
  non finisca sotto l'acqua nelle slide con più contenuto.

## Autori e box "Chi è l'autore"

- Un profilo per file in `_data/autori/<id>.yml` (collezione "Autori" nel pannello): `nome`, `foto` (facoltativa,
  `/assets/autori/...`), `bio`, `social` (lista di `piattaforma` + `url`). L'id è il nome del file (es. `redazione-lavasciuga`).
- Nell'articolo il campo `autore` contiene l'id: nel pannello è un menu che pesca dai profili (con pulsante per crearne
  uno nuovo al volo). Se si rinomina o cancella un profilo, il pannello aggiorna gli articoli collegati.
- Il modello mostra il nome in cima (link a `#autore`) e il box in fondo, subito dopo il testo; il banner "Ti è piaciuto?"
  va dopo il box (`js/main.js`). Senza foto compare l'iniziale del nome nel cerchio.
- Se `autore` è un testo che non corrisponde a nessun profilo (articoli scritti a mano), si vede solo il nome, senza box.
- I dati degli autori sono dati personali pubblicati con il loro consenso: è scritto nella privacy policy.

## Area admin (Sveltia CMS)

- `admin/index.html` carica Sveltia CMS da unpkg; `admin/config.yml` definisce il modulo "Articoli" (campi in italiano).
  Il pannello salva con un commit su `main` del repository `lavasciugapodcast-commits/site`; GitHub Pages ricostruisce.
- **Accesso**: nessuna password nel sito. Si entra con GitHub; serve essere collaboratori del repository con permesso di
  scrittura (GitHub → Settings → Collaborators). Togliere qualcuno da lì = non può più pubblicare.
  Scelta attuale: **solo l'account `lavasciugapodcast-commits`** (nessun collaboratore). Chiunque può aprire `/admin`,
  ma senza permesso di scrittura sul repository non entra né salva. Gli articoli dei collaboratori arrivano per email
  e li carica la redazione.
  - Oggi: "Accedi con Token di Accesso" (`auth_methods: [token]`): il pannello porta alla pagina GitHub per creare il token.
  - Pulsante "Accedi con GitHub": serve un'OAuth App su GitHub + Sveltia CMS Authenticator su Cloudflare Workers
    (gratuito, https://github.com/sveltia/sveltia-cms-auth); poi `base_url` e `auth_methods: [oauth, token]` in config.yml.
  - In locale (Chrome/Edge su `localhost`): "Lavora con Repository Locale" modifica direttamente i file su disco, senza login.
- **Se cambiamo hosting**: il pannello è fatto di file statici e parla direttamente con GitHub, quindi funziona ovunque
  il sito sia pubblicato (Netlify, Cloudflare Pages, server proprio) finché il codice resta su GitHub. Cose da aggiornare:
  `site_url`/`display_url` in config.yml, l'indirizzo del sito nell'OAuth App e nell'autenticatore (se usati).
  Se il codice lasciasse GitHub (es. GitLab), Sveltia ha il backend `gitlab`: si cambia la sezione `backend`.
  Jekyll si costruisce anche su Netlify/Cloudflare Pages (comando `jekyll build`, cartella `_site`).
- Dominio nostro: cambiano solo `site_url`/`display_url` qui; i percorsi del sito sono già tutti relativi.

## Pubblicità (Google AdSense)

- Spazi gestiti da `js/main.js` (`ADSENSE`, `adSlot`): home tra "Ultimo episodio" e "Dalle altre sezioni"
  (`<div data-annuncio="home">`), negli articoli a circa un quarto del testo (almeno ~150 parole, mai attaccato al banner
  Sostieni, stessa funzione `textBreak`), negli elenchi con
  `data-annunci-ogni="N"` (blog ogni 5 articoli, episodi ogni 12; nascosti durante la ricerca).
- Finché `ADSENSE.client` è vuoto online non compare nulla; in locale (localhost, 0.0.0.0, 192.168.x.x) o con `?annunci`
  nell'URL si vedono segnaposto.
- Per attivarli serve il dominio nostro e l'approvazione AdSense, poi: `ADSENSE.client` ("ca-pub-..."), gli ID delle unità
  in `ADSENSE.slots`, il file `ads.txt` nella radice, il banner del consenso di AdSense ("Privacy e messaggi") e
  l'aggiornamento di privacy e cookie policy (sezioni "Pubblicità", marcate TODO).

- **Avviso adblocker** (`js/main.js`, `checkAdblock` / `showAdblockNotice`): riquadro "Ci lasci a secco?" in basso a
  destra, non blocca nulla, con "Come si fa" e Ko-fi. Si attiva solo quando `ADSENSE.client` è compilato; per vederlo
  prima: `?adblock` nell'URL. Rilevamento: elemento "esca" con classi da annuncio + errore di caricamento dello script
  AdSense. Chiuso, non ricompare per 7 giorni (`localStorage` "adblock-avviso"). Zona grigia ePrivacy (lettura dal
  dispositivo): resta solo nel browser e lo dichiara la cookie policy; da far verificare insieme ad AdSense. Alternativa:
  "Recupero delle entrate" di AdSense in "Privacy e messaggi".

## Privacy e cookie

- `privacy.html` e `cookie.html` descrivono il sito com'è oggi: GitHub Pages, Google Fonts, Spreaker, link a Ko-fi,
  preferenze in `localStorage` (`tema`, `pos-<id>`, `velocita`, `sostieni-<id>`, `adblock-avviso`). Link nel footer di tutte le pagine.
- Mancano i dati del titolare (TODO tra parentesi quadre). Se si aggiunge un servizio esterno o una chiave in
  `localStorage`, aggiornare entrambe le pagine.

## Da fare

- [x] Logo in `assets/`
- [ ] Immagini reali (foto, copertine)
- [ ] Link alle piattaforme del podcast (Spotify, Apple Podcasts, YouTube)
- [ ] Primi articoli veri (c'è "Nasce il sito" in Generale più i due di prova; Arte, Sport, Cucina, Finanza sono vuote)
- [x] Hosting: GitHub Pages
- [ ] Dominio nostro, poi AdSense
- [ ] Dati del titolare in privacy/cookie policy
- [ ] Pulsante "Accedi con GitHub" nel pannello admin (OAuth App + autenticatore)
- [ ] (In pausa, per costi) Risultati sportivi nella pagina Sport: calcio (maggiori campionati), NBA, NFL, ATP/WTA, senza
      diretta. Scelta verificata a ottobre 2026: TheSportsDB piano "Single Developer" 9 $/mese (copre tutto, tennis con
      punteggio set per set in `strResult`; da verificare completezza dei turni tennis e classifiche NBA/NFL), dietro un
      Cloudflare Worker che fa da cache ogni 15–30 min e tiene la chiave fuori dal sito. Scartati: BALLDONTLIE (si paga
      per sport, ~50–80 $/mese; classifiche ATP/WTA però gratis), endpoint non ufficiali ESPN.
- [ ] (Idea per il futuro) Aggregatore di notizie sportive nella pagina Sport: feed RSS delle testate, solo titolo +
      estratto brevissimo + link al sito d'origine, nome della testata visibile, niente immagini (diritti delle foto).
      Lecito (link: CGUE Svensson 2014; estratti molto brevi esclusi dal diritto degli editori, direttiva UE 2019/790,
      recepita nel 2021), ma vanno controllate le condizioni d'uso dei feed di ogni testata (alcune vietano l'uso
      commerciale). Aggiornamento gratuito con GitHub Actions (o Cloudflare Worker). Tenerlo come complemento ai
      contenuti originali: un sito fatto di titoli altrui può pesare contro l'approvazione AdSense.
