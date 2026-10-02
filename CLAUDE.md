# Lavasciuga — Sito Web

Sito ufficiale di **Lavasciuga** ("Podcast & more"): podcast e articoli di blog, sport, spettacolo (musica, cinema,
teatro…) e cucina.

## Stack

- HTML, CSS e JavaScript "vanilla". **Nessun framework, nessuna dipendenza npm.**
- **Jekyll solo per il blog**: GitHub Pages costruisce il sito con Jekyll a ogni push (nessuna installazione lato GitHub).
  Passano dal modello solo i file con front matter (`---` in cima): gli articoli in `_posts/`, `index.html`, `blog.html`,
  `sport.html`, `spettacolo.html` e `cucina.html`.
  Tutte le altre pagine non hanno front matter e vengono copiate così come sono.
- Anteprima in locale (Ruby 3.3 in `C:\Ruby33-x64`, gemme in `vendor/` con Bundler, vedi `Gemfile`):
  `bundle exec jekyll serve --host 0.0.0.0 --port 8080 --baseurl ""` (prima volta: `bundle install`).
  Si aggiorna da solo quando cambi un file. Da telefono (stessa Wi-Fi): `http://<IP-del-PC>:8080`.
  Con `python -m http.server 8080` si vedono tutte le pagine tranne articoli ed elenchi di articoli (home e sezioni).
- `Gemfile` usa `github-pages`: stesse versioni di Jekyll e plugin di GitHub Pages (Jekyll 3.10). `_site/`, `vendor/`,
  `Gemfile.lock` non vanno nel repository (`.gitignore`).

## Struttura

```
index.html        Home: claim, player con l'ultimo episodio + 3 precedenti, ultimo articolo di ogni sezione
podcast.html      Player, link alle piattaforme, elenco di tutti gli episodi con ricerca
blog.html         Articoli della sezione blog, generati da Jekyll (più recente in cima)
sport.html        Articoli della sezione sport
spettacolo.html   Articoli della sezione spettacolo (musica, cinema, teatro…)
cucina.html       Articoli della sezione cucina
_data/autori/     Profili degli autori, uno per file (<id>.yml): nome, foto, bio, social
_posts/           Articoli in Markdown: AAAA-MM-GG-slug.md  ->  /<sezione>/slug.html
_layouts/         articolo.html: modello della pagina articolo
_config.yml       Configurazione Jekyll (indirizzi degli articoli, file esclusi)
admin/            Pannello per i collaboratori (Sveltia CMS): index.html + config.yml
privacy.html      Privacy policy
cookie.html       Cookie policy
contatti.html     Email e social
about.html        Chi siamo
css/style.css     Unico foglio di stile (palette del logo in :root, dark mode inclusa)
js/main.js        Menu mobile, voce attiva, anno nel footer, tema chiaro/scuro
js/podcast.js     Player audio del podcast + elenco episodi (solo index e podcast)
assets/           Logo ridimensionato (logo-64/192/512.png); assets/blog/ e assets/autori/ immagini dal pannello
media/            Originali ad alta risoluzione (logo 2048px): non linkarli dalle pagine
```

## Layout e stile

- Header antracite con solo il logo (il nome è già nel logo), grande, che sborda sotto la riga turchese (`--logo`,
  `--head-top` in `:root`), e il menu orizzontale allineato a destra.
  Sotto i 1050px il menu diventa un pannello a tutto schermo aperto dal pulsante "Menu"; sotto i 600px logo e header si rimpiccioliscono.
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
- Nuova pagina: copia `about.html` come base, aggiorna `<title>`, meta description e aggiungi il link nel menu (`.main-nav`) di tutte le pagine.

## Sostieni (Ko-fi)

- Link: `https://ko-fi.com/lavasciugapodcast` (costante `KOFI_URL` in `js/main.js`).
- Pulsante "Sostieni" turchese come ultima voce del menu (`<li class="nav-cta">`) in **tutte** le pagine, più "Ko-fi" nel footer.
  Se il menu cresce ancora, ricontrolla che stia su una riga a 1051px (sotto passa al menu mobile). Oggi l'header ne occupa 1009px.
- Banner negli articoli: li aggiunge `js/main.js` da solo, uno a metà del testo (articoli di almeno ~250 parole) e uno
  in fondo. La posizione si misura sulla lunghezza del testo (`textBreak`), quindi funziona anche senza titoletti: se c'è
  un `<h2>` vicino al punto giusto cade prima di quello, altrimenti tra due paragrafi. Per sceglierne la posizione a mano: `<div data-sostieni></div>` nel testo
  (in quel caso quelli automatici non vengono aggiunti).
- Banner: quello a metà dice "Ti sta piacendo?", quello in fondo "Ti è piaciuto?" (`supportBanner(titolo)`).
- Popup "Ciclo completo!" a fine puntata (`js/podcast.js`): negli ultimi 20 secondi o alla fine dell'episodio, una volta
  per episodio (`localStorage` "sostieni-<id>"). È un `<dialog>` modale: Esc, clic fuori o "Non ora" lo chiudono.

## Articoli (Blog, Sport, Spettacolo, Cucina)

- Un solo tipo di articolo per tre sezioni. Ogni articolo è un file Markdown in `_posts/AAAA-MM-GG-slug.md` con il campo
  `categories` = `blog`, `sport`, `spettacolo` o `cucina`: decide la pagina in cui compare e l'indirizzo
  (`/spettacolo/slug.html`).
  **Va sempre scritto** (il pannello lo fa da solo, "Blog" preselezionato): un articolo senza finisce in `/slug.html`
  e in nessun elenco. Niente valore predefinito in `_config.yml`: Jekyll lo sommerebbe a quello dell'articolo.
- La pagina la genera `_layouts/articolo.html` (sezione nel kicker e nel link "Tutti gli articoli di …"); gli elenchi in
  `blog.html`, `sport.html`, `spettacolo.html`, `cucina.html` (`site.categories.<sezione>`) e l'ultimo articolo di ogni
  sezione in home
  li genera Jekyll: **non si scrivono a mano**.
- Campi in testa al file (front matter): `title`, `categories` (sezione), `categoria` (Musica, Cinema, Opinioni…, compare
  accanto alla sezione), `evidenzia` (parole del titolo da mettere in rosa, facoltativo), `lead` (sottotitolo), `date`,
  `autore` (id di un profilo in `_data/autori/`), `copertina` + `copertina_alt` (facoltativi), `episodio` (link Spreaker dell'episodio collegato: il box
  "Ne abbiamo parlato in puntata" si completa da solo con l'API), `nota` (avviso in cima).
- Nuova sezione: aggiungere l'opzione in `admin/config.yml` (campo Sezione), una pagina come `spettacolo.html`, il `case`
  in `_layouts/articolo.html`, la colonna in `index.html` e la voce di menu in tutte le pagine (ricontrollare la
  larghezza del menu, vedi sezione Sostieni).
- Il modo normale di scrivere è il pannello `/admin`; a mano basta creare il file con gli stessi campi.
- Tempo di lettura e data in italiano li calcola il modello (~200 parole al minuto).
- Le immagini caricate dal pannello vanno in `assets/blog/` e nel testo hanno percorso `/assets/blog/...`: il modello
  lo corregge in `../assets/blog/...` (il sito sta in una sottocartella finché non c'è il dominio).
- Gli articoli `2026-10-01-ciclo-delicato.md` e `2026-10-02-articolo-di-prova.md` sono esempi (il primo marcato TODO):
  vanno sostituiti o cancellati.

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
- [ ] Primi articoli veri (ora ci sono solo i due di prova nel Blog; Sport e Spettacolo sono vuote)
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
