// Menu mobile (sopra i 960px il menu è sempre visibile in orizzontale)
const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
if (toggle && nav) {
  const setOpen = (open) => {
    nav.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
  };
  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('open')) { setOpen(false); toggle.focus(); }
  });
  window.matchMedia('(min-width: 961px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
}

// Voce attiva nel menu
const page = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.main-nav a').forEach((a) => {
  if (a.getAttribute('href') === page) a.setAttribute('aria-current', 'page');
});

// Anno nel footer
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

// Tema chiaro/scuro. Di default segue il dispositivo; il pulsante sole/luna lo forza e la scelta
// resta salvata (localStorage "tema"). Lo script inline nell'<head> la applica già prima del disegno.
const root = document.documentElement;
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
const isDark = () => (root.dataset.theme ? root.dataset.theme === 'dark' : systemDark.matches);
const themeBtn = document.querySelector('.theme-toggle');

function applyTheme() {
  const dark = isDark();
  root.classList.toggle('is-dark', dark);
  if (themeBtn) themeBtn.setAttribute('aria-label', dark ? 'Passa al tema chiaro' : 'Passa al tema scuro');
  // Avvisa chi disegna con i colori del tema (es. la forma d'onda del player in js/podcast.js)
  document.dispatchEvent(new CustomEvent('themechange', { detail: { dark } }));
}

if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    root.dataset.theme = isDark() ? 'light' : 'dark';
    try { localStorage.setItem('tema', root.dataset.theme); } catch (e) { /* storage bloccato: vale solo per questa pagina */ }
    applyTheme();
  });
}
systemDark.addEventListener('change', applyTheme);
applyTheme();
