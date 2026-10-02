# Lavasciuga — Sito Web

Podcast, blog e sport. Online su GitHub Pages.

## Anteprima in locale

Serve Ruby con Bundler (installato in `C:\Ruby33-x64`). La prima volta:

```bash
bundle install
```

Poi, per avviare il sito su http://localhost:8080 (anche dal telefono sulla stessa Wi-Fi, con l'IP del PC):

```bash
bundle exec jekyll serve --host 0.0.0.0 --port 8080 --baseurl ""
```

## Scrivere articoli

Dal pannello `/admin` (es. http://localhost:8080/admin/ in locale), accedendo con GitHub. Dettagli in `CLAUDE.md`.

## Lavorare con Claude Code

Apri questa cartella con Claude Code: le istruzioni del progetto sono in `CLAUDE.md`.
