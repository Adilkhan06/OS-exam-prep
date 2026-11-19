/* Core: namespace, modules registry, storage, router, helpers */
(function () {
  'use strict';
  const OS = (window.OS = window.OS || {});
  OS.modules = [];
  OS.byId = {};
  OS.viz = OS.viz || {};
  OS.views = {};

  OS.addModule = function (m) {
    if (!m || !m.id || OS.byId[m.id]) return;
    m.sections = m.sections || [];
    m.terms = m.terms || [];
    m.questions = (m.questions || []).map(q => Object.assign({ module: m.id }, q));
    OS.modules.push(m);
    OS.byId[m.id] = m;
    OS.modules.sort((a, b) => a.num - b.num);
  };

  OS.allQuestions = () => OS.modules.flatMap(m => m.questions);
  OS.qById = id => {
    for (const m of OS.modules) for (const q of m.questions) if (q.id === id) return q;
    return null;
  };

  /* ---------- storage ---------- */
  const KEY = 'osprep.v1';
  const blank = () => ({ read: {}, q: {}, mistakes: {}, exams: [], cards: {}, active: null, last: null });
  let state = blank();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = Object.assign(blank(), JSON.parse(raw));
  } catch (e) { /* storage unavailable */ }
  OS.state = state;
  OS.save = function () {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  };
  OS.resetProgress = function () {
    const theme = OS.getTheme();
    Object.keys(state).forEach(k => delete state[k]);
    Object.assign(state, blank());
    OS.save();
    OS.setTheme(theme);
  };

  OS.isRead = (mid, sid) => !!(state.read[mid] && state.read[mid][sid]);
  OS.setRead = function (mid, sid, v) {
    state.read[mid] = state.read[mid] || {};
    if (v) state.read[mid][sid] = 1; else delete state.read[mid][sid];
    OS.save();
  };
  OS.readCount = mid => Object.keys(state.read[mid] || {}).filter(s => (OS.byId[mid].sections || []).some(x => x.id === s)).length;

  /* records an answer for stats + mistakes bank */
  OS.recordAnswer = function (q, correct) {
    const r = state.q[q.id] || { n: 0, ok: 0 };
    r.n++; if (correct) r.ok++;
    r.last = correct ? 1 : 0;
    state.q[q.id] = r;
    if (correct) delete state.mistakes[q.id];
    else state.mistakes[q.id] = Date.now();
    OS.save();
  };
  OS.moduleStats = function (mid) {
    const m = OS.byId[mid];
    let seen = 0, ok = 0, lastOk = 0;
    m.questions.forEach(q => {
      const r = state.q[q.id];
      if (r) { seen++; ok += r.ok; if (r.last) lastOk++; }
    });
    const totalAns = m.questions.reduce((s, q) => s + ((state.q[q.id] || {}).n || 0), 0);
    return { seen, total: m.questions.length, acc: totalAns ? ok / totalAns : null, lastOk };
  };

  /* ---------- theme ---------- */
  OS.getTheme = () => { try { return localStorage.getItem('osprep.theme') || ''; } catch (e) { return ''; } };
  OS.setTheme = function (t) {
    if (t) document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
    try { if (t) localStorage.setItem('osprep.theme', t); else localStorage.removeItem('osprep.theme'); } catch (e) { /* ignore */ }
  };
  OS.isDark = () => {
    const t = document.documentElement.getAttribute('data-theme');
    if (t) return t === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  };
  OS.setTheme(OS.getTheme());

  /* ---------- helpers ---------- */
  OS.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  OS.h = function (tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    kids.flat().forEach(c => { if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(String(c))); });
    return el;
  };
  OS.svgEl = function (tag, attrs, ...kids) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    if (attrs) for (const k in attrs) if (attrs[k] != null && attrs[k] !== false) el.setAttribute(k, attrs[k]);
    kids.flat().forEach(c => { if (c != null) el.append(c.nodeType ? c : document.createTextNode(String(c))); });
    return el;
  };
  OS.shuffle = function (arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  OS.fmt = (n, d = 2) => (Math.round(n * 10 ** d) / 10 ** d).toString();
  OS.pct = x => Math.round(x * 100) + '%';
  OS.plural = function (n, one, few, many) {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    if (b === 1) return one;
    return many;
  };
  OS.toast = function (msg) {
    const t = OS.h('div', { class: 'toast', text: msg });
    document.body.append(t);
    setTimeout(() => t.remove(), 2200);
  };
  OS.stripHtml = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&#36;/g, '$').replace(/&#96;/g, '`').replace(/\s+/g, ' ').trim();

  /* ---------- syntax highlight (C / bash) ---------- */
  const KW = {
    c: 'auto break case char const continue default do double else enum extern float for goto if int long register return short signed sizeof static struct switch typedef union unsigned void volatile while bool true false NULL pid_t size_t pthread_t pthread_attr_t sem_t pthread_mutex_t',
    bash: 'if then else elif fi for while until do done case esac in function return exit echo read local export let declare shift break continue test'
  };
  OS.highlight = function (code, lang) {
    lang = lang === 'sh' ? 'bash' : lang;
    if (lang !== 'c' && lang !== 'bash') return OS.esc(code);
    const kw = new Set(KW[lang].split(' '));
    const re = lang === 'c'
      ? /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(^[ \t]*#[a-z]+[^\n]*)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)(?=\s*\()|([A-Za-z_]\w*)/gm
      : /((?:^|\s)#(?!!)[^\n]*)|("(?:\\.|[^"\\])*"|'[^']*')|(^#![^\n]*)|(\b\d+\b)|(\$\{[^}]*\}|\$[A-Za-z_]\w*|\$[0-9#?@*$!])|([A-Za-z_][\w-]*)/gm;
    let out = '', last = 0, m;
    while ((m = re.exec(code))) {
      out += OS.esc(code.slice(last, m.index));
      const t = m[0];
      let cls = null;
      if (m[1]) cls = 'com';
      else if (m[2]) cls = 'str';
      else if (m[3]) cls = 'pp';
      else if (m[4]) cls = 'num';
      else if (m[5]) cls = lang === 'c' ? (kw.has(t) ? 'kw' : 'fn') : 'var';
      else if (m[6]) cls = kw.has(t) ? 'kw' : null;
      out += cls ? `<span class="tok-${cls}">${OS.esc(t)}</span>` : OS.esc(t);
      last = m.index + t.length;
    }
    return out + OS.esc(code.slice(last));
  };
  OS.highlightAll = function (root) {
    root.querySelectorAll('pre.code').forEach(pre => {
      if (pre.dataset.hl) return;
      const lang = pre.dataset.lang;
      if (lang === 'c' || lang === 'bash' || lang === 'sh') pre.innerHTML = OS.highlight(pre.textContent, lang);
      pre.dataset.hl = 1;
    });
  };

  /* ---------- viz mounting ---------- */
  OS.mountViz = function (container, spec) {
    const wrap = OS.h('div', { class: 'viz' });
    const body = OS.h('div', { class: 'viz-body' });
    wrap.append(body);
    if (spec.caption) wrap.append(OS.h('div', { class: 'viz-cap', text: spec.caption }));
    container.append(wrap);
    const fn = OS.viz[spec.name];
    try {
      if (!fn) throw new Error('unknown viz: ' + spec.name);
      fn(body, Object.assign({}, spec.props || {}));
    } catch (e) {
      body.append(OS.h('div', { class: 'viz-err', text: 'Visualization error: ' + e.message }));
      console.error(e);
    }
    return wrap;
  };
  OS.seg = function (options, value, onChange) {
    const box = OS.h('div', { class: 'seg' });
    options.forEach(o => {
      const [val, label] = Array.isArray(o) ? o : [o, o];
      const b = OS.h('button', { type: 'button', class: val === value ? 'on' : '', text: label });
      b.addEventListener('click', () => {
        box.querySelectorAll('button').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        onChange(val);
      });
      box.append(b);
    });
    return box;
  };

  /* ---------- router ---------- */
  OS.route = function () {
    const hash = location.hash.replace(/^#\/?/, '');
    const [path, qs] = hash.split('?');
    const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
    const params = new URLSearchParams(qs || '');
    const app = document.getElementById('app');
    if (OS.onLeave) { const f = OS.onLeave; OS.onLeave = null; f(); }
    app.innerHTML = '';
    const name = parts[0] || 'home';
    const view = OS.views[name] || OS.views.home;
    document.querySelectorAll('.nav a').forEach(a => a.classList.toggle('active', a.dataset.nav === name || (name === 'm' && a.dataset.nav === 'home')));
    try { view(app, parts.slice(1), params); } catch (e) {
      console.error(e);
      app.append(OS.h('div', { class: 'page narrow' }, OS.h('div', { class: 'card' }, 'Error: ' + e.message)));
    }
    if (!OS.keepScroll) window.scrollTo(0, 0);
    OS.keepScroll = false;
  };
  OS.go = function (h) { if (location.hash === h) OS.route(); else location.hash = h; };

  window.addEventListener('hashchange', OS.route);
  document.addEventListener('DOMContentLoaded', function () {
    const themeBtn = document.getElementById('themeBtn');
    if (themeBtn) themeBtn.addEventListener('click', () => OS.setTheme(OS.isDark() ? 'light' : 'dark'));
    const sInput = document.getElementById('searchInput');
    if (sInput) {
      sInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') OS.go('#/search?q=' + encodeURIComponent(sInput.value.trim()));
      });
      document.addEventListener('keydown', e => {
        if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); sInput.focus(); }
      });
    }
    OS.route();
  });
})();
