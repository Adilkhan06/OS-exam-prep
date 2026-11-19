/* Translation mode: click a word → Russian translation (phrase-aware, offline dictionary) */
(function () {
  'use strict';
  const { h, esc } = OS;
  const KEY = 'osprep.tr';
  let on = false;
  let pop = null, mark = null, badge = null;
  let termWord = null, phraseIdx = null;

  const WORD_RE = /[A-Za-z0-9][A-Za-z0-9'’_-]*/g;
  const ZONES = '.tr-zone, .viz-cap, .viz-result, .viz-note, .step-note, .legend, .layer, .flow-step, .tl-label, .exam-tip, .callout';

  /* ---------- dictionaries ---------- */
  function buildIndex() {
    termWord = {};
    phraseIdx = {};
    const addPhrase = (en, ru, src) => {
      const words = (en.toLowerCase().match(WORD_RE) || []).map(w => w.replace(/[’']/g, "'"));
      if (!words.length || !ru) return;
      if (words.length === 1) { if (!termWord[words[0]]) termWord[words[0]] = ru; return; }
      const p = { en: en.trim(), ru, words, src };
      new Set(words).forEach(w => (phraseIdx[w] = phraseIdx[w] || []).push(p));
    };
    OS.modules.forEach(m => m.terms.forEach(t => {
      if (!t.en || !t.ru) return;
      const abbr = /\(([^)]+)\)/.exec(t.en);
      const base = t.en.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
      addPhrase(base, t.ru, m.title);
      if (abbr && /^[A-Za-z0-9 /-]+$/.test(abbr[1])) abbr[1].split(/\s*\/\s*/).forEach(a => addPhrase(a, t.ru, m.title));
    }));
    const extra = OS.dictPhrases || {};
    Object.keys(extra).forEach(en => addPhrase(en, extra[en]));
  }
  const norm = s => String(s).toLowerCase().replace(/[^a-zа-яё0-9]+/g, ' ').trim();
  function lookupWord(w) {
    const dict = OS.dict || {};
    let x = w.toLowerCase().replace(/[’]/g, "'").replace(/^['_-]+|['_-]+$/g, '');
    const tries = [x];
    if (x.endsWith("'s")) tries.push(x.slice(0, -2));
    const add = s => { if (s && s.length > 1 && !tries.includes(s)) tries.push(s); };
    const b = tries[tries.length - 1];
    if (b.endsWith('ies')) add(b.slice(0, -3) + 'y');
    if (b.endsWith('es')) add(b.slice(0, -2));
    if (b.endsWith('s')) add(b.slice(0, -1));
    if (b.endsWith('ied')) add(b.slice(0, -3) + 'y');
    if (b.endsWith('ed')) { add(b.slice(0, -2)); add(b.slice(0, -1)); if (/(.)\1ed$/.test(b)) add(b.slice(0, -3)); }
    if (b.endsWith('ing')) { add(b.slice(0, -3)); add(b.slice(0, -3) + 'e'); if (/(.)\1ing$/.test(b)) add(b.slice(0, -4)); }
    if (b.endsWith('ly')) add(b.slice(0, -2));
    if (b.endsWith('er')) { add(b.slice(0, -2)); add(b.slice(0, -1)); }
    if (b.endsWith('est')) add(b.slice(0, -3));
    let general = null, term = null;
    for (const t of tries) {
      if (!term && termWord[t]) term = { base: t, ru: termWord[t] };
      if (!general && dict[t]) general = { base: t, ru: dict[t] };
    }
    if (general || term) {
      const r = general || { base: term.base, ru: term.ru };
      if (term && general && norm(term.ru) !== norm(general.ru) && !norm(general.ru).includes(norm(term.ru))) r.term = term.ru;
      return r;
    }
    if (x.includes('-')) {
      const parts = x.split('-').filter(Boolean).map(p => { const r = lookupWord(p); return r ? r.ru : null; });
      if (parts.every(Boolean)) return { base: x, ru: parts.join('-') };
    }
    return null;
  }
  function findPhrase(zone, node, start, word) {
    const key = word.toLowerCase().replace(/[’]/g, "'");
    const variants = [key, key.replace(/'s$/, ''), key.replace(/(es|s)$/, '')];
    const cand = [];
    variants.forEach(v => (phraseIdx[v] || []).forEach(p => { if (!cand.includes(p)) cand.push(p); }));
    if (!cand.length) return null;
    // global offset of the clicked word inside the zone text
    let offset = 0;
    const walker = document.createTreeWalker(zone, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) { if (n === node) break; offset += n.textContent.length; }
    if (!n) return null;
    offset += start;
    const text = zone.textContent.toLowerCase().replace(/[’]/g, "'");
    let best = null;
    cand.forEach(p => {
      const re = new RegExp('(^|[^a-z0-9])(' + p.words.map((w, i) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + (i === p.words.length - 1 ? "(?:s|es|'s)?" : '')).join("[\\s\\-/]+") + ')(?![a-z0-9])', 'g');
      let m;
      while ((m = re.exec(text))) {
        const s = m.index + m[1].length, e = s + m[2].length;
        if (offset >= s && offset < e && (!best || m[2].length > best.len)) best = { p, len: m[2].length, text: zone.textContent.slice(s, e) };
        if (re.lastIndex === m.index) re.lastIndex++;
      }
    });
    return best;
  }

  /* ---------- hit testing ---------- */
  function wordAt(x, y) {
    let node, off;
    if (document.caretRangeFromPoint) {
      const r = document.caretRangeFromPoint(x, y);
      if (!r) return null;
      node = r.startContainer; off = r.startOffset;
    } else if (document.caretPositionFromPoint) {
      const p = document.caretPositionFromPoint(x, y);
      if (!p) return null;
      node = p.offsetNode; off = p.offset;
    } else return null;
    if (!node || node.nodeType !== 3) return null;
    const t = node.textContent;
    const isW = c => c && /[A-Za-z0-9'’_-]/.test(c);
    let s = off, e = off;
    while (s > 0 && isW(t[s - 1])) s--;
    while (e < t.length && isW(t[e])) e++;
    while (s < e && /['’_-]/.test(t[s])) s++;
    while (e > s && /['’_-]/.test(t[e - 1])) e--;
    const word = t.slice(s, e);
    if (!/[A-Za-z]/.test(word)) return null;
    const rg = document.createRange();
    rg.setStart(node, s); rg.setEnd(node, e);
    const rects = [...rg.getClientRects()];
    const rect = rects.find(rc => x >= rc.left - 3 && x <= rc.right + 3 && y >= rc.top - 3 && y <= rc.bottom + 3);
    if (!rect) return null;
    return { node, s, e, word, rect };
  }

  /* ---------- popup ---------- */
  function close() {
    if (pop) { pop.remove(); pop = null; }
    if (mark) { mark.remove(); mark = null; }
  }
  function show(rect, html) {
    close();
    mark = h('div', { class: 'tp-mark' });
    Object.assign(mark.style, { left: rect.left + scrollX - 2 + 'px', top: rect.top + scrollY - 1 + 'px', width: rect.width + 4 + 'px', height: rect.height + 2 + 'px' });
    pop = h('div', { class: 'tp-pop', html });
    document.body.append(mark, pop);
    const pw = pop.offsetWidth, ph = pop.offsetHeight;
    let left = rect.left + scrollX + rect.width / 2 - pw / 2;
    left = Math.max(scrollX + 8, Math.min(left, scrollX + innerWidth - pw - 8));
    let top = rect.bottom + scrollY + 8;
    if (rect.bottom + ph + 16 > innerHeight) top = rect.top + scrollY - ph - 8;
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
  }
  const gt = w => `<a class="tp-gt" href="https://translate.google.com/?sl=en&tl=ru&text=${encodeURIComponent(w)}" target="_blank" rel="noopener">Google Translate ↗</a>`;
  function render(word, phrase) {
    let html = '';
    if (phrase) html += `<div class="tp-row tp-phrase"><b>${esc(phrase.text)}</b><span>${esc(phrase.p.ru)}</span></div>`;
    const r = lookupWord(word);
    if (r) {
      html += `<div class="tp-row"><b>${esc(word)}</b><span>${esc(r.ru)}</span></div>`;
      if (r.term && !phrase) html += `<div class="tp-row tp-term"><b>OS term</b><span>${esc(r.term)}</span></div>`;
    }
    else if (!phrase) html += `<div class="tp-row"><b>${esc(word)}</b><span class="tp-none">no translation in the dictionary</span></div>` + gt(word);
    return html;
  }

  function onClick(e) {
    if (!on) return;
    if (pop && pop.contains(e.target)) return;
    const zone = e.target.closest && e.target.closest(ZONES);
    if (!zone || e.target.closest('pre, code, input, select, textarea, .k, .tl-seg')) { close(); return; }
    // SVG labels: translate the whole label
    if (e.target.closest('svg')) {
      const t = e.target.closest('text');
      if (!t) { close(); return; }
      const label = t.textContent.trim();
      e.preventDefault(); e.stopPropagation();
      const words = label.match(WORD_RE) || [];
      if (!words.length) return close();
      const whole = buildPhraseForLabel(label);
      let html = whole ? `<div class="tp-row tp-phrase"><b>${esc(label)}</b><span>${esc(whole)}</span></div>` : '';
      words.slice(0, 6).forEach(w => { const r = lookupWord(w); html += `<div class="tp-row"><b>${esc(w)}</b><span>${r ? esc(r.ru) : '—'}</span></div>`; });
      show(t.getBoundingClientRect(), html);
      return;
    }
    const hit = wordAt(e.clientX, e.clientY);
    if (!hit) { close(); return; }
    e.preventDefault();
    e.stopPropagation();
    if (!phraseIdx) buildIndex();
    const phrase = findPhrase(zone, hit.node, hit.s, hit.word);
    show(hit.rect, render(hit.word, phrase));
  }
  function buildPhraseForLabel(label) {
    if (!phraseIdx) buildIndex();
    const key = label.toLowerCase().replace(/s$/, '');
    for (const list of Object.values(phraseIdx)) for (const p of list) if (p.en.toLowerCase().replace(/s$/, '') === key) return p.ru;
    return null;
  }

  /* ---------- toggle ---------- */
  function setMode(v) {
    on = !!v;
    document.body.classList.toggle('tr-mode', on);
    const b = document.getElementById('trBtn');
    if (b) { b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); }
    try { localStorage.setItem(KEY, on ? '1' : ''); } catch (e) { /* ignore */ }
    if (!on) close();
    if (badge) badge.classList.toggle('hidden', !on);
  }
  OS.setTranslate = setMode;
  OS.translateWord = w => { if (!phraseIdx) buildIndex(); return lookupWord(w); };

  document.addEventListener('DOMContentLoaded', () => {
    badge = h('div', { class: 'tr-badge hidden', html: 'Translation mode — click any word · <span class="kbd">T</span> or <a href="#" data-off>turn off</a>' });
    badge.querySelector('[data-off]').addEventListener('click', e => { e.preventDefault(); setMode(false); });
    document.body.append(badge);
    const b = document.getElementById('trBtn');
    if (b) b.addEventListener('click', () => setMode(!on));
    let saved = '';
    try { saved = localStorage.getItem(KEY) || ''; } catch (e) { /* ignore */ }
    setMode(saved === '1');
  });
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') close();
    if ((e.key === 't' || e.key === 'T') && !e.ctrlKey && !e.metaKey && !e.altKey && !/input|textarea|select/i.test(document.activeElement.tagName)) setMode(!on);
  });
  window.addEventListener('hashchange', close);
  window.addEventListener('resize', close);
})();
