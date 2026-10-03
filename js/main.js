// Menu mobile (sopra gli 800px il menu è sempre visibile in orizzontale)
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
  window.matchMedia('(min-width: 801px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
}

// Voce attiva nel menu. Le pagine delle categorie e gli articoli (in blog/) accendono anche "Blog";
// negli articoli la categoria arriva da <body data-categoria="..."> (modello _layouts/articolo.html).
const here = location.pathname;
const articleCat = document.body.dataset.categoria;
document.querySelectorAll('.main-nav a').forEach((a) => {
  if (a.origin !== location.origin) return;   // es. "Sostieni" su Ko-fi
  const section = a.pathname.replace(/\.html$/, '/');   // ".../blog.html" -> ".../blog/"
  if (a.pathname === here) a.setAttribute('aria-current', 'page');
  else if (here.startsWith(section) || (articleCat && a.pathname.endsWith(`/${articleCat}.html`))) a.classList.add('is-current');
});
document.querySelectorAll('.main-nav .has-sub').forEach((item) => {
  if (item.querySelector('.sub-menu [aria-current], .sub-menu .is-current')) item.querySelector(':scope > a').classList.add('is-current');
});

// Sottomenu del Blog: su desktop si apre al passaggio del mouse (CSS) o con la freccia; Esc e clic fuori lo chiudono.
// Nel menu mobile le categorie sono sempre visibili sotto "Blog".
document.querySelectorAll('.main-nav .has-sub').forEach((item) => {
  const btn = item.querySelector('.sub-toggle');
  const setSub = (open) => {
    item.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
  };
  btn.addEventListener('click', (e) => { e.stopPropagation(); setSub(!item.classList.contains('open')); });
  document.addEventListener('click', (e) => { if (!item.contains(e.target)) setSub(false); });
  item.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && item.classList.contains('open')) { setSub(false); btn.focus(); }
  });
  item.addEventListener('focusout', (e) => { if (!item.contains(e.relatedTarget)) setSub(false); });
});

// Logo come il cestello di una lavatrice: al passaggio del mouse (o col focus da tastiera) parte e gira di continuo;
// quando si esce rallenta piano e si ferma dritto. Niente animazione se il sistema chiede di ridurre i movimenti.
const brand = document.querySelector('.brand');
const drum = document.querySelector('.brand-logo');
if (brand && drum && drum.animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const TURN_MS = 1400;   // un giro a regime
  let spin = null;

  const currentAngle = () => {
    const m = getComputedStyle(drum).transform;
    if (!m || m === 'none') return 0;
    const [a, b] = m.match(/matrix\(([^)]+)\)/)[1].split(',').map(Number);
    return Math.round((Math.atan2(b, a) * 180) / Math.PI * 10) / 10;   // arrotondato: evita 0.0000001° = un giro in più
  };
  const stopAll = () => drum.getAnimations().forEach((an) => an.cancel());

  const start = () => {
    const from = currentAngle();
    stopAll();
    // mezzo giro per prendere velocità, poi giri costanti
    spin = drum.animate(
      [{ transform: `rotate(${from}deg)` }, { transform: `rotate(${from + 180}deg)` }],
      { duration: TURN_MS * 0.75, easing: 'cubic-bezier(.5,0,1,1)', fill: 'forwards' },
    );
    spin.onfinish = () => {
      if (!spin) return;
      stopAll();
      spin = drum.animate(
        [{ transform: `rotate(${from + 180}deg)` }, { transform: `rotate(${from + 540}deg)` }],
        { duration: TURN_MS, iterations: Infinity },
      );
    };
  };

  const stop = () => {
    if (!spin) return;
    spin = null;
    const from = currentAngle();
    stopAll();
    // centrifuga che si spegne: almeno un giro, poi si ferma a 0° (logo dritto)
    const toUpright = (360 - (((from % 360) + 360) % 360)) % 360;   // quanto manca per tornare dritto
    const to = from + toUpright + 360;
    const down = drum.animate(
      [{ transform: `rotate(${from}deg)` }, { transform: `rotate(${to}deg)` }],
      { duration: TURN_MS * 1.6, easing: 'cubic-bezier(.15,.6,.35,1)' },
    );
    down.onfinish = () => down.cancel();
  };

  brand.addEventListener('pointerenter', start);
  brand.addEventListener('pointerleave', stop);
  brand.addEventListener('focus', start);
  brand.addEventListener('blur', stop);
}

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
// uno a metà del testo (solo negli articoli di almeno ~250 parole) e uno in fondo.
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

// Punto del testo dove inserire un banner, misurato sulla lunghezza del testo (funziona anche senza titoletti):
// restituisce l'elemento prima del quale inserire, il più vicino alla frazione voluta (0.5 = metà articolo).
// Preferisce cadere prima di un titoletto, non stacca mai un titoletto dal suo testo e lascia almeno un blocco
// di testo tra un banner e l'altro.
const isInsert = (el) => el.matches('.support, .ad-slot');
const textLength = (el) => (isInsert(el) ? 0 : el.textContent.trim().length);

function textBreak(container, fraction) {
  const blocks = [...container.children];
  const total = blocks.reduce((sum, b) => sum + textLength(b), 0);
  if (!total) return null;
  let before = 0;
  let best = null;
  let bestScore = Infinity;
  blocks.forEach((el, i) => {
    const at = before / total;   // quanta parte del testo c'è prima di questo blocco
    before += textLength(el);
    const prev = blocks[i - 1];
    if (!prev || /^H[2-4]$/.test(prev.tagName) || isInsert(prev) || isInsert(el)) return;
    const distance = Math.abs(at - fraction);
    const score = distance - (el.tagName === 'H2' ? 0.1 : 0);
    if (distance <= 0.2 && score < bestScore) { best = el; bestScore = score; }
  });
  return best;
}

const prose = document.querySelector('.article .prose');
const proseLength = prose ? [...prose.children].reduce((sum, b) => sum + textLength(b), 0) : 0;
if (prose) {
  const spots = prose.querySelectorAll('[data-sostieni]');
  if (spots.length) {
    spots.forEach((spot) => spot.replaceWith(supportBanner()));
  } else {
    // "Ti sta piacendo?" a metà, solo se l'articolo è abbastanza lungo (~250 parole)
    const middle = proseLength >= 1500 ? textBreak(prose, 0.5) : null;
    if (middle) prose.insertBefore(supportBanner(), middle);
    (document.querySelector('.article .author-box') || prose).after(supportBanner('Ti è piaciuto?'));
  }
}

// Box "Ne abbiamo parlato in puntata" negli articoli: numero e titolo dell'episodio dall'API di Spreaker
// (nell'articolo basta il link dell'episodio, campo "episodio").
document.querySelectorAll('.related[data-episode-id]').forEach(async (box) => {
  const id = box.dataset.episodeId;
  if (!/^\d+$/.test(id)) return;
  try {
    const res = await fetch(`https://api.spreaker.com/v2/episodes/${id}`);
    const ep = (await res.json())?.response?.episode;
    if (!ep) return;
    const m = ep.title.match(/^(\d{1,4})\s*[-–]\s*(.*)$/);
    const title = box.querySelector('.related-title');
    title.textContent = (m ? m[2] : ep.title).replace(/^Lavasciuga\s*[-–]\s*/i, '');
    if (m) {
      const num = document.createElement('span');
      num.className = 'related-num';
      num.textContent = m[1];
      title.prepend(num, ' ');
    }
  } catch (e) { /* resta il testo generico, il link funziona comunque */ }
});

// Spazi pubblicitari (Google AdSense). Finché ADSENSE.client è vuoto non compare niente online;
// in locale, o online aggiungendo ?annunci all'indirizzo, si vedono dei segnaposto per valutarne la posizione.
//   - <div data-annuncio="home"></div> in una pagina = uno spazio lì
//   - articoli del blog: uno a circa un quarto del testo (articoli di almeno ~150 parole)
//   - elenchi con data-annunci-ogni="N": uno ogni N elementi (elenco del blog, elenco episodi)
// Per attivarli: client "ca-pub-..." e gli ID delle unità pubblicitarie create su AdSense (vedi CLAUDE.md).
const ADSENSE = {
  client: '',                                   // es. 'ca-pub-1234567890123456'
  slots: { home: '', articolo: '', elenco: '' }, // ID delle unità pubblicitarie, una per tipo di spazio
};
const LOCAL_HOST = /^(localhost|0\.0\.0\.0|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[::1\])/.test(location.hostname);
const ADS_PREVIEW = !ADSENSE.client && (LOCAL_HOST || new URLSearchParams(location.search).has('annunci'));

let adsScriptLoaded = false;
let adsScriptBlocked = false;
function adSlot(kind, tag = 'aside') {
  if (!ADSENSE.client && !ADS_PREVIEW) return null;
  const slot = document.createElement(tag);
  slot.className = `ad-slot ad-${kind}`;
  slot.setAttribute('aria-label', 'Pubblicità');
  const label = Object.assign(document.createElement('span'), { className: 'ad-label', textContent: 'Pubblicità' });
  const box = document.createElement('div');
  box.className = 'ad-box';
  slot.append(label, box);
  if (ADSENSE.client) {
    if (!adsScriptLoaded) {
      adsScriptLoaded = true;
      const sc = document.createElement('script');
      sc.async = true;
      sc.crossOrigin = 'anonymous';
      sc.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE.client}`;
      sc.onerror = () => { adsScriptBlocked = true; };   // segnale usato da checkAdblock()
      document.head.append(sc);
    }
    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.dataset.adClient = ADSENSE.client;
    ins.dataset.adSlot = ADSENSE.slots[kind] || '';
    ins.dataset.adFormat = 'auto';
    ins.dataset.fullWidthResponsive = 'true';
    box.append(ins);
    // la richiesta dell'annuncio parte quando lo spazio è nella pagina
    queueMicrotask(() => { (window.adsbygoogle = window.adsbygoogle || []).push({}); });
  } else {
    box.textContent = `Spazio pubblicitario · ${kind}`;
  }
  return slot;
}

function placeListAds(list) {
  const every = Number(list.dataset.annunciOgni);
  if (!every) return;
  list.querySelectorAll('.ad-item').forEach((a) => a.remove());
  const items = [...list.children].filter((li) => !li.classList.contains('ad-item'));
  items.forEach((li, i) => {
    if ((i + 1) % every !== 0 || i === items.length - 1) return;
    const slot = adSlot('elenco', 'li');
    if (slot) { slot.classList.add('ad-item'); li.after(slot); }
  });
}

document.querySelectorAll('[data-annuncio]').forEach((spot) => {
  const slot = adSlot(spot.dataset.annuncio);
  if (slot) spot.replaceWith(slot); else spot.remove();
});
document.querySelectorAll('ul[data-annunci-ogni], ol[data-annunci-ogni]').forEach(placeListAds);
// Articoli: un annuncio a circa un quarto del testo (prima del banner "Ti sta piacendo?", mai attaccato a lui)
if (prose && proseLength >= 900) {
  const at = textBreak(prose, 0.25);
  const slot = at ? adSlot('articolo') : null;
  if (slot) prose.insertBefore(slot, at);
}

// Adblocker: un invito gentile a disattivarlo, mai un blocco. Solo con AdSense attivo (senza pubblicità non ha senso);
// per vederlo prima: ?adblock nell'indirizzo. La verifica resta nel browser: il risultato non si salva né si invia.
// Chiuso l'avviso, si salva solo la data (localStorage "adblock-avviso") e non ricompare per 7 giorni.
const ADBLOCK_EVERY_MS = 7 * 24 * 60 * 60 * 1000;
const ADBLOCK_PREVIEW = new URLSearchParams(location.search).has('adblock');

// Esca: un elemento con i nomi che i filtri degli adblocker nascondono. Se sparisce, o se lo script di AdSense non
// si carica, c'è un adblocker.
function checkAdblock() {
  return new Promise((resolve) => {
    const bait = document.createElement('div');
    bait.className = 'adsbox ad-banner textads banner-ads pub_300x250';
    bait.setAttribute('aria-hidden', 'true');
    bait.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;';
    bait.innerHTML = '&nbsp;';
    document.body.append(bait);
    setTimeout(() => {
      const hidden = !bait.offsetHeight || getComputedStyle(bait).display === 'none' || getComputedStyle(bait).visibility === 'hidden';
      bait.remove();
      resolve(hidden || adsScriptBlocked);
    }, 1500);
  });
}

function showAdblockNotice() {
  const notice = document.createElement('aside');
  notice.className = 'adblock-notice';
  notice.setAttribute('role', 'region');
  notice.setAttribute('aria-labelledby', 'adblock-titolo');
  notice.innerHTML = `
    <button type="button" class="adblock-close" aria-label="Chiudi">×</button>
    <p class="adblock-kicker">Una richiesta</p>
    <h2 class="adblock-title" id="adblock-titolo">Ci lasci a secco?</h2>
    <p class="adblock-text">Sembra che tu abbia un blocco della pubblicità. Lo capiamo, ma qui gli annunci sono pochi e discreti
      e ci aiutano a tenere in piedi il progetto: disattivarlo su questo sito è il modo più semplice per sostenerci.</p>
    <div class="adblock-how" id="adblock-come" hidden>
      <p>Clicca sull'icona del tuo blocco pubblicità, di solito in alto a destra nel browser, e scegli
        «Disattiva su questo sito» o «Metti in pausa». Poi ricarica la pagina.</p>
      <button type="button" class="adblock-reload">Ricarica la pagina</button>
    </div>
    <div class="adblock-actions">
      <button type="button" class="adblock-toggle" aria-expanded="false" aria-controls="adblock-come">Come si fa</button>
    </div>`;
  notice.querySelector('.adblock-actions').append(kofiButton('Oppure offrici un caffè'));
  document.body.append(notice);

  const close = () => {
    try { localStorage.setItem('adblock-avviso', String(Date.now())); } catch (e) { /* storage bloccato */ }
    notice.remove();
  };
  notice.querySelector('.adblock-close').addEventListener('click', close);
  notice.querySelector('.adblock-reload').addEventListener('click', () => location.reload());
  const toggleBtn = notice.querySelector('.adblock-toggle');
  toggleBtn.addEventListener('click', () => {
    const how = notice.querySelector('.adblock-how');
    how.hidden = !how.hidden;
    toggleBtn.setAttribute('aria-expanded', String(!how.hidden));
  });
  requestAnimationFrame(() => notice.classList.add('show'));
}

if ((ADSENSE.client || ADBLOCK_PREVIEW) && !location.pathname.includes('/admin')) {
  let last = 0;
  try { last = Number(localStorage.getItem('adblock-avviso')) || 0; } catch (e) { /* storage bloccato */ }
  if (ADBLOCK_PREVIEW || Date.now() - last > ADBLOCK_EVERY_MS) {
    checkAdblock().then((blocked) => { if (blocked || ADBLOCK_PREVIEW) showAdblockNotice(); });
  }
}
