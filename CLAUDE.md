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
blog.html         Articoli del blog
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
  Sotto i 960px il menu diventa un pannello a tutto schermo aperto dal pulsante "Menu"; sotto i 600px logo e header si rimpiccioliscono.
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
  - `<div class="lv-player" data-show-id="6470341">`: player principale (ultimo episodio, o quello di `#ep-<id>` nell'URL).
  - `<ol class="episodes" id="..." data-show-id="6470341">`: elenco; "Ascolta" carica l'episodio nel player.
    Opzioni `data-offset`, `data-limit`. Ricerca e contatore opzionali (`data-episode-search` / `data-episode-count`).
  - Mini barra fissa in basso quando il player è fuori schermo; posizione di ascolto (`pos-<id>`) e velocità
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

## Da fare

- [x] Logo in `assets/`
- [ ] Immagini reali (foto, copertine)
- [ ] Link alle piattaforme del podcast (Spotify, Apple Podcasts, YouTube)
- [ ] Primi articoli del blog
- [ ] Contenuti sport (rubriche, risultati, commenti)
- [ ] Scegliere hosting (es. GitHub Pages, Netlify) e dominio
