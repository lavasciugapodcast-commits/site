// Podcast: player audio fatto su misura + elenco episodi, tutto dall'API pubblica di Spreaker.
// Caricato solo dalle pagine che lo usano (index.html, podcast.html), dopo js/main.js.
//
// <div class="lv-player" data-show-id="6470341">        player in evidenza (ultimo episodio)
// <ol class="episodes" id="..." data-show-id="6470341"    elenco; "Ascolta" apre il player sotto la riga
//     data-offset="1" data-limit="3">                     quali episodi mostrare (di default tutti)
//
// Un solo audio per pagina, più "viste" (il player in evidenza e quello aperto nell'elenco): ogni vista
// è legata a un episodio e si aggiorna da sola quando quell'episodio è quello in riproduzione.
// L'audio è il link ufficiale dell'episodio (playback_url), quindi gli ascolti contano su Spreaker.
// Cambiare tema non tocca l'audio: cambiano solo i colori (evento "themechange" da main.js).

const SHOW_URL = 'https://www.spreaker.com/podcast/lavasciuga--6470341';
const API = 'https://api.spreaker.com/v2';

// Sugli indirizzi locali (es. http://192.168.1.52:8080 per provare dal telefono) Spreaker non fa
// partire l'audio se riceve l'indirizzo della pagina: lì non lo mandiamo. Online sì.
if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[::1\])/.test(location.hostname)) {
  const meta = document.createElement('meta');
  meta.name = 'referrer';
  meta.content = 'no-referrer';
  document.head.append(meta);
}

/* ---------- Dati dall'API ---------- */

function cached(map, key, load) {
  if (!map.has(key)) map.set(key, load());
  return map.get(key);
}

const showCache = new Map();
const getEpisodes = (showId) => cached(showCache, showId, async () => {
  let url = `${API}/shows/${showId}/episodes?limit=100`;
  const all = [];
  while (url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Spreaker ${res.status}`);
    const { response } = await res.json();
    all.push(...response.items);
    url = response.next_url;
  }
  return all;
});

// L'elenco non contiene la descrizione: arriva dal dettaglio del singolo episodio
const detailCache = new Map();
const getDetails = (ep) => cached(detailCache, ep.episode_id, () => fetch(`${API}/episodes/${ep.episode_id}`)
  .then((r) => (r.ok ? r.json() : null))
  .then((d) => d?.response?.episode ?? null)
  .catch(() => null));

const waveCache = new Map();
const getWaveform = (ep) => (ep.waveform_url ? cached(waveCache, ep.episode_id, () => fetch(ep.waveform_url)
  .then((r) => (r.ok ? r.json() : null))
  .then((d) => d?.response?.points ?? null)
  .catch(() => null)) : Promise.resolve(null));

/* ---------- Utilità ---------- */

// "050 - Speciale estate 2026: ..." -> { num: "050", title: "Speciale estate 2026: ..." }
function parseTitle(raw) {
  const m = raw.match(/^(\d{1,4})\s*[-–]\s*(.*)$/);
  const title = (m ? m[2] : raw).replace(/^Lavasciuga\s*[-–]\s*/i, '');
  return { num: m ? m[1] : '', title };
}

const dateFmt = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
const pubDate = (ep) => dateFmt.format(new Date(ep.published_at.replace(' ', 'T') + 'Z'));

function clock(sec) {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const s = Math.floor(sec % 60);
  const m = Math.floor(sec / 60) % 60;
  const h = Math.floor(sec / 3600);
  const mm = h ? String(m).padStart(2, '0') : String(m);
  return `${h ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`;
}

function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (k === 'class') node.className = v;
    else if (k.startsWith('aria-') || k.startsWith('data-')) node.setAttribute(k, v);
    else node[k] = v;
  });
  node.append(...children);
  return node;
}

function store(key, value) {
  try {
    if (value === undefined) return localStorage.getItem(key);
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch (e) { /* storage bloccato: niente memoria, il player funziona lo stesso */ }
  return null;
}

// Testo semplice della descrizione -> paragrafi, a capo e link cliccabili (niente HTML esterno nella pagina)
function descriptionNodes(text) {
  return text.trim().split(/\n\s*\n/).map((para) => {
    const p = el('p');
    para.split('\n').forEach((line, i) => {
      if (i) p.append(el('br'));
      line.split(/(https?:\/\/[^\s<>"]+)/).forEach((part, j) => {
        if (j % 2 === 0) { if (part) p.append(part); return; }
        const url = part.replace(/[).,;:!?]+$/, '');
        p.append(el('a', { href: url, target: '_blank', rel: 'noopener' }, url.replace(/^https?:\/\/(www\.)?/, '')));
        if (url.length < part.length) p.append(part.slice(url.length));
      });
    });
    return p;
  });
}

const ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>';
const ICON_PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor"/></svg>';

/* ---------- Audio (uno solo per pagina) ---------- */

const SPEEDS = [1, 1.25, 1.5, 1.75, 2];
const audio = new Audio();
audio.preload = 'metadata';
let current = null;      // episodio caricato nell'audio
let pendingSeek = null;  // posizione da applicare quando l'audio ha i metadati
let audioError = false;

const isCurrent = (ep) => Boolean(current) && current.episode_id === ep.episode_id;
const duration = () => (Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : (current ? current.duration / 1000 : 0));
const position = () => (pendingSeek ?? audio.currentTime);
const isPlaying = () => Boolean(current) && !audio.paused && !audio.ended;
const savedPosition = (ep) => Number(store(`pos-${ep.episode_id}`)) || 0;

function load(ep, { autoplay = false } = {}) {
  if (!isCurrent(ep)) {
    savePosition();
    current = ep;
    audioError = false;
    audio.src = ep.playback_url;
    audio.playbackRate = Number(store('velocita')) || 1;
    const saved = savedPosition(ep);
    pendingSeek = saved > 15 && saved < ep.duration / 1000 - 20 ? saved : null;
    if ('mediaSession' in navigator) {
      const { num, title } = parseTitle(ep.title);
      navigator.mediaSession.metadata = new MediaMetadata({
        title: num ? `${num} · ${title}` : title,
        artist: 'Lavasciuga',
        album: 'Lavasciuga Podcast',
        artwork: [{ src: ep.image_original_url || ep.image_url, sizes: '512x512' }],
      });
    }
  }
  if (autoplay) play();
  render();
}

function play() {
  const p = audio.play();
  if (p) p.catch((err) => { if (err.name !== 'AbortError') { audioError = true; render(); } });
}
const togglePlay = () => (isPlaying() ? audio.pause() : play());

function seek(sec) {
  const t = Math.max(0, Math.min(sec, duration() - 0.5));
  if (audio.readyState >= 1) audio.currentTime = t;
  else pendingSeek = t;
  render();
}

let lastSave = 0;
function savePosition(force = true) {
  if (!current) return;
  const now = Date.now();
  if (!force && now - lastSave < 5000) return;
  lastSave = now;
  const t = position();
  store(`pos-${current.episode_id}`, t > 15 ? String(Math.floor(t)) : null);
}

audio.addEventListener('loadedmetadata', () => {
  if (pendingSeek != null) { audio.currentTime = pendingSeek; pendingSeek = null; }
  render();
});
audio.addEventListener('timeupdate', () => { savePosition(false); render(); maybeAskSupport(); });
audio.addEventListener('play', render);
audio.addEventListener('pause', () => { savePosition(); render(); });
audio.addEventListener('seeked', () => savePosition());
audio.addEventListener('ended', () => { store(`pos-${current.episode_id}`, null); render(); maybeAskSupport(); });
audio.addEventListener('ratechange', render);
audio.addEventListener('error', () => { if (audio.src) { audioError = true; render(); } });
window.addEventListener('pagehide', () => savePosition());

if ('mediaSession' in navigator) {
  const set = (action, fn) => { try { navigator.mediaSession.setActionHandler(action, fn); } catch (e) { /* non supportata */ } };
  set('play', play);
  set('pause', () => audio.pause());
  set('seekbackward', () => seek(position() - 15));
  set('seekforward', () => seek(position() + 30));
  set('seekto', (d) => seek(d.seekTime));
}

/* ---------- Invito a sostenere (Ko-fi) a fine puntata ---------- */
// Compare negli ultimi 20 secondi o alla fine dell'episodio, una volta per episodio: ogni episodio diverso
// lo mostra, riascoltare la fine di uno già visto no (localStorage "sostieni-<id>").
// kofiButton e KOFI_URL stanno in js/main.js.

let supportDialog = null;

function maybeAskSupport() {
  if (!current) return;
  const dur = duration();
  if (dur < 60 || (!audio.ended && position() < dur - 20)) return;
  const key = `sostieni-${current.episode_id}`;
  if (store(key)) return;
  store(key, '1');
  showSupportDialog();
}

function showSupportDialog() {
  if (!supportDialog) {
    const close = el('button', { type: 'button', class: 'dialog-close' }, 'Non ora');
    const kofi = kofiButton('Offrici un caffè');
    supportDialog = el('dialog', { class: 'support-dialog', 'aria-labelledby': 'sostieni-titolo' },
      el('img', { class: 'dialog-logo', src: document.querySelector('.brand-logo')?.src || '', alt: '' }),
      el('h2', { id: 'sostieni-titolo' }, 'Ciclo ', el('span', { class: 'hl' }, 'completo'), '!'),
      el('p', {}, 'Grazie per aver ascoltato la puntata fino alla fine. Se Lavasciuga ti fa compagnia, puoi aiutarci a continuare offrendoci un caffè su Ko-fi.'),
      el('div', { class: 'dialog-actions' }, kofi, close));
    close.addEventListener('click', () => supportDialog.close());
    kofi.addEventListener('click', () => supportDialog.close());
    // clic fuori dalla finestra (sullo sfondo scuro) = chiudi
    supportDialog.addEventListener('click', (e) => { if (e.target === supportDialog) supportDialog.close(); });
    document.body.append(supportDialog);
  }
  if (!supportDialog.open) supportDialog.showModal();
}

/* ---------- Viste del player ---------- */

const views = new Set();
const rows = new Map();   // episode_id -> riga dell'elenco

function render() {
  views.forEach(updateView);
  rows.forEach(updateRow);
  renderMini();
}

// full: player in evidenza (copertina e titolo); altrimenti versione compatta dentro l'elenco
function createView(ep, { full = false } = {}) {
  const v = { ep, points: null, visible: false };
  const speedLabel = () => `${String(audio.playbackRate).replace('.', ',')}×`;

  v.play = el('button', { type: 'button', class: 'lv-play', 'aria-label': 'Riproduci' });
  v.canvas = el('canvas', { 'aria-hidden': 'true' });
  v.seek = el('input', { type: 'range', class: 'lv-seek', min: 0, max: 100, step: 1, value: 0, 'aria-label': "Posizione nell'episodio" });
  v.back = el('button', { type: 'button', class: 'lv-btn', 'aria-label': 'Indietro di 15 secondi' }, '−15');
  v.fwd = el('button', { type: 'button', class: 'lv-btn', 'aria-label': 'Avanti di 30 secondi' }, '+30');
  v.speed = el('button', { type: 'button', class: 'lv-btn lv-speed', 'aria-label': 'Velocità di riproduzione' }, speedLabel());
  v.time = el('span', { class: 'lv-time' });
  v.error = el('p', { class: 'lv-error', hidden: true }, "Non riesco a riprodurre l'episodio. ",
    el('a', { href: ep.site_url || SHOW_URL }, 'Ascoltalo su Spreaker'));
  v.descText = el('div', { class: 'lv-desc-text' });
  v.more = el('button', { type: 'button', class: 'lv-more', hidden: true, 'aria-expanded': 'false' }, 'Mostra tutto');
  v.desc = el('div', { class: 'lv-desc', hidden: true }, el('span', { class: 'lv-desc-label' }, "Note dell'episodio"), v.descText, v.more);

  const parts = [];
  if (full) {
    const { num, title } = parseTitle(ep.title);
    parts.push(
      el('div', { class: 'lv-cover' }, el('img', { src: ep.image_url, alt: '', width: 132, height: 132, decoding: 'async' })),
      el('div', { class: 'lv-head' },
        el('p', { class: 'lv-kicker' }, `${num ? `Ep. ${num} · ` : ''}${pubDate(ep)}`),
        el('h3', { class: 'lv-title' }, title)),
    );
  }
  parts.push(
    el('div', { class: 'lv-deck' }, v.play, el('div', { class: 'lv-wave' }, v.canvas, v.seek)),
    el('div', { class: 'lv-controls' }, v.back, v.fwd, v.speed, v.time,
      el('a', { class: 'lv-ext', href: ep.site_url || SHOW_URL, target: '_blank', rel: 'noopener' }, 'Apri su Spreaker')),
    v.desc,
    v.error,
  );
  v.root = el('div', { class: full ? 'lv-player' : 'lv-player lv-player--inline' }, ...parts);

  // I comandi di una vista non in riproduzione prima caricano il suo episodio
  const mine = () => { if (!isCurrent(ep)) load(ep); };
  v.play.addEventListener('click', () => (isCurrent(ep) ? togglePlay() : load(ep, { autoplay: true })));
  v.back.addEventListener('click', () => { mine(); seek(position() - 15); });
  v.fwd.addEventListener('click', () => { mine(); seek(position() + 30); });
  v.seek.addEventListener('input', () => { mine(); seek(Number(v.seek.value)); });
  v.speed.addEventListener('click', () => {
    const next = SPEEDS[(SPEEDS.indexOf(audio.playbackRate) + 1) % SPEEDS.length] || 1;
    audio.playbackRate = next;
    store('velocita', next === 1 ? null : String(next));
    views.forEach((w) => { w.speed.textContent = speedLabel(); });
  });
  v.more.addEventListener('click', () => {
    const open = v.desc.classList.toggle('is-expanded');
    v.more.textContent = open ? 'Mostra meno' : 'Mostra tutto';
    v.more.setAttribute('aria-expanded', String(open));
  });

  v.ro = new ResizeObserver(() => { drawWave(v); if (v.onResize) v.onResize(); });
  v.ro.observe(v.canvas);
  v.io = new IntersectionObserver(([entry]) => { v.visible = entry.isIntersecting; renderMini(); }, { threshold: 0.15 });
  v.io.observe(v.root);
  v.destroy = () => { v.ro.disconnect(); v.io.disconnect(); views.delete(v); v.root.remove(); renderMini(); };

  getWaveform(ep).then((points) => { v.points = points; drawWave(v); });
  getDetails(ep).then((d) => {
    const text = d?.description?.trim();
    if (!text) return;
    v.descText.replaceChildren(...descriptionNodes(text));
    v.desc.hidden = false;
    // "Mostra tutto" solo se il testo è più lungo dello spazio a disposizione (ricontrollato se cambia la larghezza)
    const checkClamp = () => {
      if (v.desc.classList.contains('is-expanded')) return;
      const clamped = v.descText.scrollHeight > v.descText.clientHeight + 4;
      v.more.hidden = !clamped;
      v.descText.classList.toggle('is-clamped', clamped);
    };
    checkClamp();
    v.ro.observe(v.descText);
    v.onResize = checkClamp;
  });

  views.add(v);
  updateView(v);
  return v;
}

function viewState(v) {
  const active = isCurrent(v.ep);
  const dur = active ? duration() : v.ep.duration / 1000;
  const pos = active ? position() : savedPosition(v.ep);
  return { active, dur, pos, playing: active && isPlaying() };
}

function updateView(v) {
  const { active, dur, pos, playing } = viewState(v);
  v.root.classList.toggle('is-active', active);
  v.play.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
  v.play.setAttribute('aria-label', playing ? 'Metti in pausa' : 'Riproduci');
  v.time.textContent = `${clock(pos)} / ${clock(dur)}`;
  v.seek.max = String(Math.round(dur));
  v.seek.value = String(Math.round(pos));
  v.seek.setAttribute('aria-valuetext', `${clock(pos)} di ${clock(dur)}`);
  v.error.hidden = !(active && audioError);
  drawWave(v);
}

// Forma d'onda a barre: la parte ascoltata è turchese, come l'acqua del logo
function drawWave(v) {
  const c = v.canvas;
  const dpr = window.devicePixelRatio || 1;
  const w = c.clientWidth;
  const h = c.clientHeight;
  if (!w || !h) return;
  if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
  }
  const ctx = c.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const css = getComputedStyle(document.documentElement);
  const played = css.getPropertyValue('--teal').trim();
  const rest = css.getPropertyValue('--wave').trim();
  const { dur, pos } = viewState(v);
  const progress = dur ? pos / dur : 0;
  const bar = 3;
  const gap = 2;
  const n = Math.max(1, Math.floor((w + gap) / (bar + gap)));
  const pts = v.points;

  for (let i = 0; i < n; i++) {
    let val = 0.25;
    if (pts && pts.length) {
      const a = Math.floor((i / n) * pts.length);
      const b = Math.max(a + 1, Math.floor(((i + 1) / n) * pts.length));
      val = Math.max(...pts.slice(a, b));
    }
    const bh = Math.max(3, Math.min(1, val) * h);
    ctx.fillStyle = (i + 0.5) / n <= progress ? played : rest;
    ctx.fillRect(i * (bar + gap), (h - bh) / 2, bar, bh);
  }
}
document.addEventListener('themechange', () => views.forEach(drawWave));

/* ---------- Mini barra in basso (quando nessun player dell'episodio è visibile) ---------- */

const mini = {};

function buildMini() {
  mini.play = el('button', { type: 'button', class: 'lv-mini-play', 'aria-label': 'Riproduci' });
  mini.num = el('span', { class: 'lv-mini-num' });
  mini.title = el('span', { class: 'lv-mini-title' });
  mini.time = el('span', { class: 'lv-mini-time' });
  mini.bar = el('div', { class: 'lv-mini-progress', 'aria-hidden': 'true' });
  mini.info = el('button', { type: 'button', class: 'lv-mini-info', 'aria-label': 'Vai al player' }, mini.num, mini.title);
  mini.root = el('div', { class: 'lv-mini', role: 'region', 'aria-label': 'Player del podcast' },
    mini.bar,
    el('div', { class: 'container lv-mini-inner' }, mini.play, mini.info, mini.time));
  document.body.append(mini.root);

  mini.play.addEventListener('click', togglePlay);
  mini.info.addEventListener('click', () => {
    let v = [...views].find((w) => isCurrent(w.ep));
    if (!v && rows.has(current.episode_id)) v = openRow(rows.get(current.episode_id)).view;
    if (v) v.root.scrollIntoView({ block: 'center', behavior: 'instant' });
  });
}

function renderMini() {
  if (!mini.root) return;
  const started = Boolean(current) && (audio.currentTime > 0 || isPlaying());
  const onScreen = [...views].some((v) => isCurrent(v.ep) && v.visible);
  const show = started && !onScreen;
  mini.root.classList.toggle('show', show);
  document.body.classList.toggle('has-mini', show);
  mini.root.inert = !show;
  if (!current) return;
  const { num, title } = parseTitle(current.title);
  mini.num.textContent = num;
  mini.title.textContent = title;
  mini.time.textContent = `${clock(position())} / ${clock(duration())}`;
  mini.play.innerHTML = isPlaying() ? ICON_PAUSE : ICON_PLAY;
  mini.play.setAttribute('aria-label', isPlaying() ? 'Metti in pausa' : 'Riproduci');
  mini.bar.style.width = `${duration() ? (position() / duration()) * 100 : 0}%`;
}

/* ---------- Elenco episodi: "Ascolta" apre il player sotto la riga ---------- */

function openRow(row, { autoplay = false } = {}) {
  rows.forEach((r) => { if (r !== row && r.view) closeRow(r); });   // uno aperto alla volta
  if (!row.view) {
    row.view = createView(row.ep);
    row.li.append(el('div', { class: 'ep-panel' }, row.view.root));
  }
  if (autoplay) load(row.ep, { autoplay: true });
  render();
  return row;
}

function closeRow(row) {
  if (!row.view) return;
  const panel = row.view.root.parentElement;
  row.view.destroy();
  panel.remove();
  row.view = null;
  render();
}

function renderEpisode(ep) {
  const { num, title } = parseTitle(ep.title);
  const btn = el('button', { type: 'button', class: 'ep-play', 'aria-expanded': 'false' }, 'Ascolta');
  const li = el('li', { class: 'episode', id: `ep-${ep.episode_id}`, 'data-search': `${num} ${title}`.toLowerCase() },
    el('span', { class: 'ep-num' }, num),
    el('div', { class: 'ep-body' },
      el('h3', {}, title),
      el('p', { class: 'ep-meta' }, `${pubDate(ep)} · ${Math.max(1, Math.round(ep.duration / 60000))} min`)),
    btn);
  const row = { ep, li, btn, title, view: null };
  rows.set(ep.episode_id, row);
  btn.addEventListener('click', () => (row.view ? closeRow(row) : openRow(row, { autoplay: true })));
  updateRow(row);
  return li;
}

function updateRow(row) {
  const open = Boolean(row.view);
  row.li.classList.toggle('is-open', open);
  row.li.classList.toggle('is-current', isCurrent(row.ep));
  row.btn.textContent = open ? 'Chiudi' : 'Ascolta';
  row.btn.setAttribute('aria-expanded', String(open));
  row.btn.setAttribute('aria-label', `${open ? 'Chiudi il player' : 'Ascolta'}: ${row.title}`);
}

function failed(box) {
  box.replaceChildren(el(box.tagName === 'OL' ? 'li' : 'p', { class: 'episodes-status' }, 'Non riesco a caricare gli episodi in questo momento. ',
    el('a', { href: SHOW_URL }, 'Ascoltali su Spreaker')));
}

async function setupList(list) {
  const offset = Number(list.dataset.offset || 0);
  const limit = list.dataset.limit ? Number(list.dataset.limit) : Infinity;
  const episodes = (await getEpisodes(list.dataset.showId)).slice(offset, offset + limit);
  list.replaceChildren(...episodes.map(renderEpisode));

  const count = document.querySelector(`[data-episode-count="${list.id}"]`);
  const showCount = (shown) => {
    if (count) count.textContent = shown === episodes.length ? `${shown} episodi` : `${shown} di ${episodes.length}`;
  };
  showCount(episodes.length);

  // Ricerca per titolo o numero
  const search = document.querySelector(`[data-episode-search="${list.id}"]`);
  if (search) {
    search.hidden = false;
    search.querySelector('input').addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      let shown = 0;
      list.querySelectorAll('.episode').forEach((li) => {
        li.hidden = Boolean(q) && !li.dataset.search.includes(q);
        if (!li.hidden) shown++;
      });
      showCount(shown);
    });
  }
}

/* ---------- Avvio ---------- */

const card = document.querySelector('.lv-player[data-show-id]');
const lists = document.querySelectorAll('.episodes[data-show-id]');

if (card || lists.length) {
  buildMini();

  if (card) {
    getEpisodes(card.dataset.showId).then((episodes) => {
      if (!episodes.length) { failed(card); return; }
      card.replaceWith(createView(episodes[0], { full: true }).root);
    }).catch(() => failed(card));
  }

  Promise.all([...lists].map((list) => setupList(list).catch(() => failed(list)))).then(() => {
    // Link diretto a un episodio (es. podcast.html#ep-73897509): apre il suo player nell'elenco
    const openFromHash = () => {
      const row = [...rows.values()].find((r) => `#ep-${r.ep.episode_id}` === location.hash);
      if (!row) return;
      openRow(row);
      const go = () => row.li.scrollIntoView({ block: 'start', behavior: 'instant' });
      go();
      setTimeout(go, 600);
    };
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
  });
}
