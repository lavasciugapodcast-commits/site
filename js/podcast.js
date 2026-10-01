// Podcast: player audio fatto su misura + elenco episodi, tutto dall'API pubblica di Spreaker.
// Caricato solo dalle pagine che lo usano (index.html, podcast.html), dopo js/main.js.
//
// <div class="lv-player" data-show-id="6470341">          player principale (ultimo episodio)
// <ol class="episodes" id="..." data-show-id="6470341"      elenco; "Ascolta" lo carica nel player
//     data-offset="1" data-limit="3">                       quali episodi mostrare (di default tutti)
//
// L'audio è il link ufficiale dell'episodio (playback_url), quindi gli ascolti contano su Spreaker.
// Cambiare tema non tocca l'audio: il player è nella pagina, cambiano solo i colori.

const SHOW_URL = 'https://www.spreaker.com/podcast/lavasciuga--6470341';

// Sugli indirizzi locali (es. http://192.168.1.52:8080 per provare dal telefono) Spreaker non fa
// partire l'audio se riceve l'indirizzo della pagina: lì non lo mandiamo. Online sì.
if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[::1\])/.test(location.hostname)) {
  const meta = document.createElement('meta');
  meta.name = 'referrer';
  meta.content = 'no-referrer';
  document.head.append(meta);
}

/* ---------- Dati ---------- */

const episodeRequests = new Map();
function getEpisodes(showId) {
  if (!episodeRequests.has(showId)) {
    episodeRequests.set(showId, (async () => {
      let url = `https://api.spreaker.com/v2/shows/${showId}/episodes?limit=100`;
      const all = [];
      while (url) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Spreaker ${res.status}`);
        const { response } = await res.json();
        all.push(...response.items);
        url = response.next_url;
      }
      return all;
    })());
  }
  return episodeRequests.get(showId);
}

const waveforms = new Map();
function getWaveform(ep) {
  if (!ep.waveform_url) return Promise.resolve(null);
  if (!waveforms.has(ep.episode_id)) {
    waveforms.set(ep.episode_id, fetch(ep.waveform_url)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.response?.points ?? null)
      .catch(() => null));
  }
  return waveforms.get(ep.episode_id);
}

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

const ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>';
const ICON_PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor"/></svg>';

/* ---------- Player ---------- */

const SPEEDS = [1, 1.25, 1.5, 1.75, 2];
const audio = new Audio();
audio.preload = 'metadata';
let current = null;      // episodio caricato
let pendingSeek = null;  // posizione da applicare quando l'audio ha i metadati
const listeners = [];    // chi deve aggiornarsi quando cambia lo stato (righe dell'elenco)
const onChange = (fn) => listeners.push(fn);
const notify = () => listeners.forEach((fn) => fn());

const duration = () => (Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : (current ? current.duration / 1000 : 0));
const position = () => (pendingSeek ?? audio.currentTime);
const isPlaying = () => Boolean(current) && !audio.paused && !audio.ended;

function seek(sec) {
  const t = Math.max(0, Math.min(sec, duration() - 0.5));
  if (audio.readyState >= 1) audio.currentTime = t;
  else pendingSeek = t;
  render();
}

function load(ep, { autoplay = false } = {}) {
  if (current && current.episode_id === ep.episode_id) {
    if (autoplay) play();
    return;
  }
  savePosition();
  current = ep;
  audio.src = ep.playback_url;
  audio.playbackRate = Number(store('velocita')) || 1;
  const saved = Number(store(`pos-${ep.episode_id}`)) || 0;
  pendingSeek = saved > 15 && saved < ep.duration / 1000 - 20 ? saved : null;
  hideError();
  ui.points = null;
  fillCard();
  getWaveform(ep).then((points) => { if (current === ep) drawWave(points); });
  if ('mediaSession' in navigator) {
    const { num, title } = parseTitle(ep.title);
    navigator.mediaSession.metadata = new MediaMetadata({
      title: num ? `${num} · ${title}` : title,
      artist: 'Lavasciuga',
      album: 'Lavasciuga Podcast',
      artwork: [{ src: ep.image_original_url || ep.image_url, sizes: '512x512' }],
    });
  }
  if (autoplay) play();
  render();
  notify();
}

function play() {
  const p = audio.play();
  if (p) p.catch((err) => { if (err.name !== 'AbortError') showError(); });
}
const togglePlay = () => (isPlaying() ? audio.pause() : play());

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
audio.addEventListener('timeupdate', () => { savePosition(false); render(); });
audio.addEventListener('play', () => { render(); notify(); });
audio.addEventListener('pause', () => { savePosition(); render(); notify(); });
audio.addEventListener('ended', () => { store(`pos-${current.episode_id}`, null); render(); notify(); });
audio.addEventListener('seeked', () => savePosition());
audio.addEventListener('ratechange', render);
audio.addEventListener('error', () => { if (audio.src) showError(); });
window.addEventListener('pagehide', () => savePosition());

if ('mediaSession' in navigator) {
  const ms = navigator.mediaSession;
  const set = (action, fn) => { try { ms.setActionHandler(action, fn); } catch (e) { /* azione non supportata */ } };
  set('play', play);
  set('pause', () => audio.pause());
  set('seekbackward', () => seek(position() - 15));
  set('seekforward', () => seek(position() + 30));
  set('seekto', (d) => seek(d.seekTime));
}

/* ---------- Scheda del player ---------- */

const card = document.querySelector('.lv-player[data-show-id]');
const ui = {};

function buildCard() {
  ui.cover = el('img', { alt: '', width: 132, height: 132, decoding: 'async' });
  ui.kicker = el('p', { class: 'lv-kicker' });
  ui.title = el('h3', { class: 'lv-title' });
  ui.play = el('button', { type: 'button', class: 'lv-play', 'aria-label': 'Riproduci' });
  ui.canvas = el('canvas', { 'aria-hidden': 'true' });
  ui.seek = el('input', { type: 'range', class: 'lv-seek', min: 0, max: 100, step: 1, value: 0, 'aria-label': "Posizione nell'episodio" });
  ui.back = el('button', { type: 'button', class: 'lv-btn', 'aria-label': 'Indietro di 15 secondi' }, '−15');
  ui.fwd = el('button', { type: 'button', class: 'lv-btn', 'aria-label': 'Avanti di 30 secondi' }, '+30');
  ui.speed = el('button', { type: 'button', class: 'lv-btn lv-speed', 'aria-label': 'Velocità di riproduzione' }, '1×');
  ui.time = el('span', { class: 'lv-time' });
  ui.ext = el('a', { class: 'lv-ext', target: '_blank', rel: 'noopener' }, 'Apri su Spreaker');
  ui.error = el('p', { class: 'lv-error', hidden: true });

  card.replaceChildren(
    el('div', { class: 'lv-cover' }, ui.cover),
    el('div', { class: 'lv-head' }, ui.kicker, ui.title),
    el('div', { class: 'lv-deck' }, ui.play, el('div', { class: 'lv-wave' }, ui.canvas, ui.seek)),
    el('div', { class: 'lv-controls' }, ui.back, ui.fwd, ui.speed, ui.time, ui.ext),
    ui.error,
  );

  ui.play.addEventListener('click', togglePlay);
  ui.back.addEventListener('click', () => seek(position() - 15));
  ui.fwd.addEventListener('click', () => seek(position() + 30));
  ui.speed.addEventListener('click', () => {
    const next = SPEEDS[(SPEEDS.indexOf(audio.playbackRate) + 1) % SPEEDS.length] || 1;
    audio.playbackRate = next;
    store('velocita', next === 1 ? null : String(next));
  });
  ui.seek.addEventListener('input', () => seek(Number(ui.seek.value)));
  new ResizeObserver(() => drawWave()).observe(ui.canvas);
  document.addEventListener('themechange', () => drawWave());
}

function fillCard() {
  if (!ui.title) return;
  const { num, title } = parseTitle(current.title);
  ui.cover.src = current.image_url;
  ui.kicker.textContent = `${num ? `Ep. ${num} · ` : ''}${pubDate(current)}`;
  ui.title.textContent = title;
  ui.ext.href = current.site_url || SHOW_URL;
  ui.seek.max = String(Math.round(duration()));
  drawWave();
}

function showError() {
  if (!ui.error) return;
  ui.error.replaceChildren("Non riesco a riprodurre l'episodio. ", el('a', { href: current?.site_url || SHOW_URL }, 'Ascoltalo su Spreaker'));
  ui.error.hidden = false;
}
function hideError() { if (ui.error) ui.error.hidden = true; }

function render() {
  const dur = duration();
  const pos = position();
  if (ui.play) {
    ui.play.innerHTML = isPlaying() ? ICON_PAUSE : ICON_PLAY;
    ui.play.setAttribute('aria-label', isPlaying() ? 'Metti in pausa' : 'Riproduci');
    ui.time.textContent = `${clock(pos)} / ${clock(dur)}`;
    ui.speed.textContent = `${String(audio.playbackRate).replace('.', ',')}×`;
    ui.seek.max = String(Math.round(dur));
    ui.seek.value = String(Math.round(pos));
    ui.seek.setAttribute('aria-valuetext', `${clock(pos)} di ${clock(dur)}`);
    drawWave();
  }
  renderMini(pos, dur);
}

// Forma d'onda a barre: la parte ascoltata è turchese, come l'acqua del logo
function drawWave(points) {
  if (!ui.canvas || !current) return;
  if (Array.isArray(points) || points === null) ui.points = points;
  const c = ui.canvas;
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
  const bar = 3;
  const gap = 2;
  const n = Math.max(1, Math.floor((w + gap) / (bar + gap)));
  const pts = ui.points;
  const progress = duration() ? position() / duration() : 0;

  for (let i = 0; i < n; i++) {
    let v = 0.25;
    if (pts && pts.length) {
      const a = Math.floor((i / n) * pts.length);
      const b = Math.max(a + 1, Math.floor(((i + 1) / n) * pts.length));
      v = Math.max(...pts.slice(a, b));
    }
    const bh = Math.max(3, Math.min(1, v) * h);
    ctx.fillStyle = (i + 0.5) / n <= progress ? played : rest;
    ctx.fillRect(i * (bar + gap), (h - bh) / 2, bar, bh);
  }
}

/* ---------- Mini barra in basso (quando il player è fuori schermo) ---------- */

const mini = {};
let cardVisible = true;

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
  mini.info.addEventListener('click', () => card.scrollIntoView({ block: 'center', behavior: 'instant' }));
  new IntersectionObserver(([entry]) => { cardVisible = entry.isIntersecting; render(); }, { threshold: 0.15 }).observe(card);
}

function renderMini(pos, dur) {
  if (!mini.root || !current) return;
  // compare solo dopo che l'utente ha fatto partire qualcosa
  const show = !cardVisible && (audio.currentTime > 0 || isPlaying());
  mini.root.classList.toggle('show', show);
  document.body.classList.toggle('has-mini', show);
  mini.root.inert = !show;
  const { num, title } = parseTitle(current.title);
  mini.num.textContent = num;
  mini.title.textContent = title;
  mini.time.textContent = `${clock(pos)} / ${clock(dur)}`;
  mini.play.innerHTML = isPlaying() ? ICON_PAUSE : ICON_PLAY;
  mini.play.setAttribute('aria-label', isPlaying() ? 'Metti in pausa' : 'Riproduci');
  mini.bar.style.width = `${dur ? (pos / dur) * 100 : 0}%`;
}

/* ---------- Elenco episodi ---------- */

function renderEpisode(ep) {
  const { num, title } = parseTitle(ep.title);
  const btn = el('button', { type: 'button', class: 'ep-play' }, 'Ascolta');
  const li = el('li', { class: 'episode', id: `ep-${ep.episode_id}`, 'data-search': `${num} ${title}`.toLowerCase() },
    el('span', { class: 'ep-num' }, num),
    el('div', { class: 'ep-body' },
      el('h3', {}, title),
      el('p', { class: 'ep-meta' }, `${pubDate(ep)} · ${Math.max(1, Math.round(ep.duration / 60000))} min`)),
    btn);

  btn.addEventListener('click', () => {
    if (current && current.episode_id === ep.episode_id) togglePlay();
    else load(ep, { autoplay: true });
  });
  onChange(() => {
    const mine = current && current.episode_id === ep.episode_id;
    li.classList.toggle('is-current', Boolean(mine));
    if (!mine) btn.textContent = 'Ascolta';
    else if (isPlaying()) btn.textContent = 'Pausa';
    else btn.textContent = audio.ended ? 'Riascolta' : 'Riprendi';
    btn.setAttribute('aria-label', `${btn.textContent}: ${title}`);
  });
  return li;
}

function failed(box) {
  box.replaceChildren(el('p', { class: 'episodes-status' }, 'Non riesco a caricare gli episodi in questo momento. ',
    el('a', { href: SHOW_URL }, 'Ascoltali su Spreaker')));
}

document.querySelectorAll('.episodes[data-show-id]').forEach(async (list) => {
  const offset = Number(list.dataset.offset || 0);
  const limit = list.dataset.limit ? Number(list.dataset.limit) : Infinity;
  let episodes;
  try {
    episodes = (await getEpisodes(list.dataset.showId)).slice(offset, offset + limit);
  } catch (err) {
    failed(list);
    return;
  }
  list.replaceChildren(...episodes.map(renderEpisode));
  notify();

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
});

/* ---------- Avvio ---------- */

if (card) {
  getEpisodes(card.dataset.showId).then((episodes) => {
    if (!episodes.length) { failed(card); return; }
    buildCard();
    buildMini();
    // Link diretto a un episodio (es. podcast.html#ep-73897509): lo carica nel player
    const fromHash = () => episodes.find((e) => `#ep-${e.episode_id}` === location.hash);
    load(fromHash() || episodes[0]);
    if (fromHash()) card.scrollIntoView({ block: 'center', behavior: 'instant' });
    window.addEventListener('hashchange', () => {
      const ep = fromHash();
      if (ep) { load(ep); card.scrollIntoView({ block: 'center', behavior: 'instant' }); }
    });
  }).catch(() => failed(card));
}
