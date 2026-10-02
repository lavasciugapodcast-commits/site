# Solo per l'anteprima in locale (jekyll serve): online GitHub Pages usa la sua versione, la stessa di "github-pages".
# Installazione: bundle install    Anteprima: bundle exec jekyll serve --baseurl ""
source "https://rubygems.org"

gem "github-pages", group: :jekyll_plugins
gem "webrick"                                   # server di jekyll serve (non incluso da Ruby 3)

platforms :windows do
  gem "tzinfo-data"                             # fuso orario Europe/Rome su Windows
  gem "wdm", ">= 0.1.0"                         # aggiornamento automatico quando cambi un file
end
