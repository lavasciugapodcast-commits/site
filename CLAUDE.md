# Lavasciuga — Sito Web

Sito ufficiale di **Lavasciuga**: podcast, blog e sport. Per ora le sezioni sono queste tre; in futuro potranno aggiungersene altre.

## Stack

- HTML, CSS e JavaScript "vanilla". **Nessun framework, nessun build step, nessuna dipendenza npm.**
- Si apre direttamente `index.html` nel browser, oppure si serve la cartella con un server statico
  (es. `npx serve .`, `python -m http.server 8080` oppure l'estensione Live Server di VS Code).
  Per vederlo dal telefono (stessa Wi-Fi): `http://<IP-del-PC>:8080`.

## Struttura

```
index.html        Home: claim, player con l'ultimo episodio + 3 precedenti, ultimi contenuti delle sezioni
podcast.html      Player, link alle piattaforme, elenco di tutti gli episodi con ricerca
blog.html         Elenco articoli del blog (a mano, più recente in cima)
blog/             Un file .html per articolo (es. blog/ciclo-delicato.html)
sport.html        Rubriche sport
news.html         Notizie e annunci
contatti.html     Email e social
about.html        Chi siamo
css/style.css     Unico foglio di stile (palette del logo in :root, dark mode inclusa)
js/main.js        Menu mobile, voce attiva, anno nel footer, tema chiaro/scuro
js/podcast.js     Player audio del podcast + elenco episodi (solo index e podcast)
assets/           Logo ridimensionato (logo-64/192/512.png), immagini, copertine
media/            Originali ad alta risoluzione (logo 2048px): non linkarli dalle pagine
```

## Layout e stile

- Header antracite con il logo grande che sborda sotto la riga turchese (`--logo`, `--head-top` in `:root`) e il menu orizzontale allineato a destra.
  Sotto i 1120px il menu diventa un pannello a tutto schermo aperto dal pulsante "Menu"; sotto i 600px logo e header si rimpiccioliscono.
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
- Nuova pagina: copia `blog.html` come base, aggiorna `<title>`, meta description e aggiungi il link nel menu (`.main-nav`) di tutte le pagine.

## Sostieni (Ko-fi)

- Link: `https://ko-fi.com/lavasciugapodcast` (costante `KOFI_URL` in `js/main.js`).
- Pulsante "Sostieni" turchese come ultima voce del menu (`<li class="nav-cta">`) in **tutte** le pagine, più "Ko-fi" nel footer.
  Se il menu cresce ancora, ricontrolla che stia su una riga a 1121px (sotto passa al menu mobile).
- Banner negli articoli: li aggiunge `js/main.js` da solo, uno a metà (prima del `<h2>` più vicino al centro, solo se
  l'articolo ha almeno 8 blocchi) e uno in fondo. Per sceglierne la posizione a mano: `<div data-sostieni></div>` nel testo
  (in quel caso quelli automatici non vengono aggiunti).
- Banner: quello a metà dice "Ti sta piacendo?", quello in fondo "Ti è piaciuto?" (`supportBanner(titolo)`).
- Popup "Ciclo completo!" a fine puntata (`js/podcast.js`): negli ultimi 20 secondi o alla fine dell'episodio, una volta
  per episodio (`localStorage` "sostieni-<id>"). È un `<dialog>` modale: Esc, clic fuori o "Non ora" lo chiudono.

## Blog: aggiungere un articolo

1. Copia `blog/ciclo-delicato.html` in `blog/<slug>.html` (slug: minuscolo, parole separate da trattini, senza accenti).
2. Aggiorna `<title>` ("Titolo — Blog — Lavasciuga"), meta description e i tag `og:` (titolo e descrizione).
3. Nel `<header class="article-head">`: categoria nel kicker, `<h1>` (una parola chiave può andare in `<span class="hl">`),
   `lead` di una-due frasi, data in `<time datetime="AAAA-MM-GG">`, autore e minuti di lettura (~200 parole al minuto).
4. Testo dentro `<div class="prose">`: `<p>`, `<h2>`, `<ul>`, `<blockquote>`. Togli il `<p class="note">` dell'esempio.
5. Box `related` facoltativo: episodio collegato, link `../podcast.html#ep-<episode_id>` (l'id è nell'URL Spreaker dell'episodio).
6. Aggiungi l'articolo in cima alla lista di `blog.html` e sostituisci quello nella colonna Blog di `index.html`.
- Gli articoli stanno in `blog/`, quindi tutti i percorsi locali iniziano con `../` (css, js, assets, link alle pagine).
- La voce "Blog" del menu si accende da sola sulle pagine dentro `blog/` (`js/main.js`).
- L'articolo `ciclo-delicato` è un esempio fittizio (marcato TODO): va sostituito o cancellato prima di andare davvero online.

## Da fare

- [x] Logo in `assets/`
- [ ] Immagini reali (foto, copertine)
- [ ] Link alle piattaforme del podcast (Spotify, Apple Podcasts, YouTube)
- [ ] Primi articoli del blog (per ora c'è solo l'esempio `blog/ciclo-delicato.html`)
- [ ] Contenuti sport (rubriche, risultati, commenti)
- [ ] Scegliere hosting (es. GitHub Pages, Netlify) e dominio
