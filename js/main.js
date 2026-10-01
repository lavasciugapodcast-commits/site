// Menu mobile (sopra i 1120px il menu è sempre visibile in orizzontale)
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
  window.matchMedia('(min-width: 1121px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
}

// Voce attiva nel menu (gli articoli in blog/ accendono "Blog")
const here = location.pathname;
document.querySelectorAll('.main-nav a').forEach((a) => {
  const section = a.pathname.replace(/\.html$/, '/');   // ".../blog.html" -> ".../blog/"
  if (a.origin !== location.origin) return;   // es. "Sostieni" su Ko-fi
  if (a.pathname === here || here.startsWith(section)) a.setAttribute('aria-current', 'page');
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

// Sostieni (Ko-fi). Usato anche dal popup a fine puntata in js/podcast.js.
const KOFI_URL = 'https://ko-fi.com/lavasciugapodcast';
const CUP_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 9h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3.5v2M12 3.5v2"/></svg>';

function kofiButton(label = 'Offrici un caffè') {
  const a = document.createElement('a');
  a.className = 'support-btn';
  a.href = KOFI_URL;
  a.target = '_blank';
  a.rel = 'noopener';
  a.innerHTML = CUP_ICON;
  a.append(label);
  return a;
}

// Banner negli articoli del blog. Se nel testo c'è <div data-sostieni></div> lo mette lì; altrimenti da solo:
// uno a metà (prima del sottotitolo più vicino al centro, solo negli articoli lunghi) e uno in fondo.
function supportBanner(heading = 'Ti sta piacendo?') {
  const aside = document.createElement('aside');
  aside.className = 'support';
  aside.setAttribute('aria-label', 'Sostieni Lavasciuga');
  const logo = document.createElement('img');
  logo.src = document.querySelector('.brand-logo')?.src || '';
  logo.alt = '';
  const body = document.createElement('div');
  const kicker = Object.assign(document.createElement('p'), { className: 'support-kicker', textContent: 'Sostieni Lavasciuga' });
  const title = Object.assign(document.createElement('p'), { className: 'support-title', textContent: heading });
  const text = Object.assign(document.createElement('p'), {
    className: 'support-text',
    textContent: 'Lavasciuga va avanti grazie a chi lo ascolta e lo legge. Se vuoi darci una mano, offrici un caffè: ogni contributo ci aiuta a continuare.',
  });
  body.append(kicker, title, text, kofiButton());
  aside.append(logo, body);
  return aside;
}

const prose = document.querySelector('.article .prose');
if (prose) {
  const spots = prose.querySelectorAll('[data-sostieni]');
  if (spots.length) {
    spots.forEach((spot) => spot.replaceWith(supportBanner()));
  } else {
    const blocks = [...prose.children];
    const headings = blocks.filter((b) => b.tagName === 'H2');
    if (blocks.length >= 8 && headings.length) {
      const middle = blocks.length / 2;
      const target = headings.reduce((best, h) => (Math.abs(blocks.indexOf(h) - middle) < Math.abs(blocks.indexOf(best) - middle) ? h : best));
      if (blocks.indexOf(target) > 1) prose.insertBefore(supportBanner(), target);
    }
    prose.after(supportBanner('Ti è piaciuto?'));
  }
}
