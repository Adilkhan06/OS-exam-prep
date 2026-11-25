/* Learning views: home (course map), module, practice quiz, flashcards, search, mistakes + shared question UI */
(function () {
  'use strict';
  const { h, esc } = OS;
  const pl = (n, word, plural) => `${n} ${n === 1 ? word : (plural || word + 's')}`;
  OS.pl = pl;

  /* ---------- rich text for questions: escape all, allow a few inline tags ---------- */
  OS.rich = function (s) {
    return esc(s).replace(/&lt;(\/?)(code|b|i|sub|sup|br)\s*\/?&gt;/g, '<$1$2>').replace(/`([^`]+)`/g, '<code>$1</code>');
  };
  const TYPE_LABEL = { single: 'Single choice', multi: 'Multiple choice', tf: 'True / False', code: 'Code' };
  const diffDots = d => '●'.repeat(d || 1) + '○'.repeat(3 - (d || 1));

  OS.optionOrder = function (q, shuffle) {
    if (q.type === 'tf') return [0, 1];
    const idx = q.options.map((_, i) => i);
    return shuffle === false ? idx : OS.shuffle(idx);
  };
  OS.isCorrect = function (q, sel) {
    if (sel == null) return false;
    if (q.type === 'tf') return sel === (q.answer ? 0 : 1);
    if (q.type === 'multi') {
      const a = new Set(q.answer), s = new Set(sel);
      return a.size === s.size && [...a].every(x => s.has(x));
    }
    return sel === q.answer;
  };
  const optText = (q, i) => (q.type === 'tf' ? (i === 0 ? 'True' : 'False') : String(q.options[i]));
  const isRight = (q, i) => (q.type === 'tf' ? i === (q.answer ? 0 : 1) : q.type === 'multi' ? q.answer.includes(i) : i === q.answer);
  OS.answerText = function (q) {
    if (q.type === 'tf') return q.answer ? 'True' : 'False';
    if (q.type === 'multi') return q.answer.map(i => q.options[i]).join('; ');
    return String(q.options[q.answer]);
  };

  /**
   * Renders a question card.
   * opts: { mode: 'practice'|'exam'|'review', order, selected, onSelect(sel), onAnswered(correct), index, total, showModule }
   */
  OS.renderQuestion = function (q, opts) {
    const mode = opts.mode;
    const m = OS.byId[q.module];
    const card = h('div', { class: 'q-card' });
    const meta = h('div', { class: 'q-meta' });
    if (opts.index != null) meta.append(h('span', { class: 'tag acc', text: `Question ${opts.index + 1}${opts.total ? ' / ' + opts.total : ''}` }));
    if (opts.showModule !== false && m) meta.append(h('span', { class: 'tag', text: `${m.icon} ${m.title}` }));
    meta.append(h('span', { class: 'tag', text: TYPE_LABEL[q.type] }));
    meta.append(h('span', { class: 'tag', title: 'Difficulty', text: diffDots(q.diff) }));
    card.append(meta);
    card.append(h('div', { class: 'q-text tr-zone', html: OS.rich(q.q) }));
    if (q.type === 'multi' && mode !== 'review') card.append(h('div', { class: 'q-hint', text: 'Select all correct options.' }));
    if (q.code) card.append(h('pre', { class: 'code', 'data-lang': q.lang || 'text', html: OS.highlight(String(q.code), q.lang) }));
    const order = opts.order || OS.optionOrder(q);
    let sel = opts.selected != null ? (Array.isArray(opts.selected) ? opts.selected.slice() : opts.selected) : (q.type === 'multi' ? [] : null);
    let answered = mode === 'review';
    const list = h('div', { class: 'opts' });
    const btns = [];
    order.forEach((oi, k) => {
      const b = h('button', { type: 'button', class: 'opt' + (q.type === 'multi' ? ' multi' : '') },
        h('span', { class: 'k', text: q.type === 'tf' ? (k === 0 ? 'T' : 'F') : String.fromCharCode(65 + k) }),
        h('span', { class: 'tr-zone', html: OS.rich(optText(q, oi)) }));
      b.dataset.oi = oi;
      b.addEventListener('click', () => choose(oi));
      btns.push(b);
      list.append(b);
    });
    card.append(list);
    const fb = h('div');
    const nav = h('div', { class: 'q-nav' });
    card.append(fb, nav);
    let checkBtn = null;
    if (mode === 'practice' && q.type === 'multi') {
      checkBtn = h('button', { class: 'btn primary', type: 'button', text: 'Check', disabled: true });
      checkBtn.onclick = () => reveal();
      nav.append(checkBtn);
    }
    function paint() {
      btns.forEach(b => {
        const oi = +b.dataset.oi;
        const chosen = q.type === 'multi' ? sel.includes(oi) : sel === oi;
        b.className = 'opt' + (q.type === 'multi' ? ' multi' : '');
        if (!answered) { if (chosen) b.classList.add('sel'); return; }
        b.disabled = true;
        const right = isRight(q, oi);
        if (right && chosen) b.classList.add('right');
        else if (right) b.classList.add(q.type === 'multi' || mode === 'review' ? 'missed' : 'right');
        else if (chosen) b.classList.add('wrong');
      });
      if (checkBtn) checkBtn.disabled = answered || !sel.length;
    }
    function choose(oi) {
      if (answered) return;
      if (q.type === 'multi') sel = sel.includes(oi) ? sel.filter(x => x !== oi) : sel.concat(oi);
      else sel = sel === oi && mode === 'exam' ? null : oi;
      paint();
      if (opts.onSelect) opts.onSelect(q.type === 'multi' ? sel.slice() : sel);
      if (mode === 'practice' && q.type !== 'multi') reveal();
    }
    function reveal() {
      answered = true;
      const ok = OS.isCorrect(q, sel);
      paint();
      showExplain(ok);
      if (opts.onAnswered) opts.onAnswered(ok, sel);
    }
    function showExplain(ok) {
      const unanswered = sel == null || (Array.isArray(sel) && !sel.length);
      fb.innerHTML = '';
      const box = h('div', { class: 'explain tr-zone ' + (ok ? 'ok' : 'bad') });
      box.append(h('b', { class: 'res', text: ok ? '✓ Correct' : unanswered ? '— No answer' : '✗ Wrong' }));
      if (!ok) box.append(h('div', { html: 'Correct answer: <b>' + OS.rich(OS.answerText(q)) + '</b>' }));
      box.append(h('div', { html: OS.rich(q.explain || '') }));
      if (m) box.append(h('div', { style: { marginTop: '6px' } }, h('a', { href: `#/m/${m.id}/${q.section}`, text: '→ Theory: ' + ((m.sections.find(s => s.id === q.section) || {}).h || m.title) })));
      fb.append(box);
    }
    paint();
    if (mode === 'review') showExplain(OS.isCorrect(q, sel));
    card.handleKey = function (e) {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= btns.length) { btns[n - 1].click(); return true; }
      return false;
    };
    card.isAnswered = () => answered;
    card.navBar = nav;
    return card;
  };

  /* ---------- home ---------- */
  OS.views.home = function (app) {
    const page = h('div', { class: 'page' });
    const totalSecs = OS.modules.reduce((s, m) => s + m.sections.length, 0);
    const readSecs = OS.modules.reduce((s, m) => s + OS.readCount(m.id), 0);
    const totalQ = OS.allQuestions().length;
    const answered = Object.keys(OS.state.q).length;
    const sums = Object.values(OS.state.q).reduce((a, r) => [a[0] + r.ok, a[1] + r.n], [0, 0]);
    const lastExam = OS.state.exams[OS.state.exams.length - 1];
    const last = OS.state.last && OS.byId[OS.state.last.m] ? OS.state.last : null;
    const cont = last ? h('a', { class: 'btn primary lg', href: `#/m/${last.m}/${last.s || ''}`, text: `Continue: ${OS.byId[last.m].title}` })
      : h('a', { class: 'btn primary lg', href: OS.modules[0] ? '#/m/' + OS.modules[0].id : '#/', text: 'Start with the first topic' });
    const hero = h('div', { class: 'hero' },
      h('div', { class: 'hero-main' },
        h('h1', { text: 'Operating Systems' }),
        h('p', { class: 'tr-zone', html: `Every topic of the course, explained step by step: why each mechanism exists, how it works, and how it leads to the next one. ${OS.modules.length} modules, ${totalQ} questions, interactive simulators. Learn, practise, then take a timed exam.` }),
        h('div', { class: 'row' }, cont, h('a', { class: 'btn lg', href: '#/oral', text: 'Oral prep' }), h('a', { class: 'btn lg', href: '#/exam', text: 'Exam mode' })),
        h('div', { class: 'small muted', html: 'Tip: turn on <b>translation mode</b> (the <span class="kbd">EN→RU</span> button or the <span class="kbd">T</span> key) and click any word to see its Russian translation.' })),
      h('div', { class: 'stats' },
        stat('Sections studied', `${readSecs}/${totalSecs}`, totalSecs ? OS.pct(readSecs / totalSecs) : '—'),
        stat('Questions seen', `${answered}/${totalQ}`, 'unique'),
        stat('Accuracy', sums[1] ? OS.pct(sums[0] / sums[1]) : '—', sums[1] ? `${sums[0]} of ${sums[1]} answers` : 'no answers yet'),
        stat('Last exam', lastExam ? `${lastExam.grade}/30` : '—', lastExam ? `${OS.pct(lastExam.score)} · ${new Date(lastExam.date).toLocaleDateString('en-GB')}` : 'not taken yet')));
    page.append(hero);
    const mist = Object.keys(OS.state.mistakes).filter(id => OS.qById(id)).length;
    if (mist) page.append(h('div', { class: 'callout warn row', style: { justifyContent: 'space-between' } }, h('span', { html: `Your mistakes bank has <b>${pl(mist, 'question')}</b>.` }), h('a', { class: 'btn sm', href: '#/quiz/mistakes', text: 'Practise mistakes' })));

    // course map: the logical chain of modules
    [['theory', 'Theory — the course as one story', 'each module answers a question raised by the previous one'], ['lab', 'Labs — the same ideas in Linux', 'commands, processes, scripts and devices']].forEach(([g, title, sub]) => {
      const mods = OS.modules.filter(m => m.group === g);
      if (!mods.length) return;
      page.append(h('div', { class: 'group-title' }, h('h2', { text: title }), h('span', { text: sub })));
      const chain = h('div', { class: 'course-map' });
      mods.forEach((m, i) => chain.append(modCard(m, i === mods.length - 1)));
      page.append(chain);
    });
    const reset = h('button', { class: 'btn sm ghost danger', type: 'button', text: 'Reset all progress' });
    reset.onclick = () => { if (confirm('Delete your progress, mistakes and exam history?')) { OS.resetProgress(); OS.route(); } };
    page.append(h('div', { class: 'foot' }, h('div', { text: 'Progress is stored only in this browser.' }), reset));
    app.append(page);
    function stat(label, value, sub) { return h('div', { class: 'stat' }, h('div', { class: 'stat-label', text: label }), h('div', { class: 'stat-value', text: value }), h('div', { class: 'stat-sub', text: sub })); }
  };
  function modCard(m, isLast) {
    const rc = OS.readCount(m.id), st = OS.moduleStats(m.id);
    const pr = m.sections.length ? rc / m.sections.length : 0;
    return h('div', { class: 'cm-step' + (isLast ? ' last' : '') },
      h('div', { class: 'cm-dot' + (pr >= 1 ? ' done' : pr > 0 ? ' part' : ''), text: String(m.num) }),
      h('a', { class: 'mod-card', href: '#/m/' + m.id },
        h('div', { class: 'mod-top' }, h('div', { class: 'mod-icon', text: m.icon || '•' }),
          h('div', {}, h('div', { class: 'mod-num', text: String(m.num).padStart(2, '0') + (m.group === 'lab' ? ' · LAB' : '') }), h('div', { class: 'mod-title', text: m.title }))),
        m.bridge ? h('div', { class: 'mod-bridge tr-zone', text: m.bridge }) : h('div', { class: 'mod-sum', text: m.summary || '' }),
        h('div', { class: 'bar' + (pr >= 1 ? ' ok' : '') }, h('i', { style: { width: pr * 100 + '%' } })),
        h('div', { class: 'mod-meta' }, h('span', { text: `${rc}/${m.sections.length} sections` }), h('span', { text: pl(m.questions.length, 'question') }), st.acc != null ? h('span', { text: 'accuracy ' + OS.pct(st.acc) }) : null)));
  }

  /* ---------- module page ---------- */
  OS.views.m = function (app, parts) {
    const m = OS.byId[parts[0]];
    if (!m) return OS.views.home(app);
    const target = parts[1];
    OS.state.last = { m: m.id, s: target || null };
    OS.save();
    const page = h('div', { class: 'page' });
    const layout = h('div', { class: 'mod-layout' });
    const toc = h('nav', { class: 'toc' });
    const main = h('div');
    layout.append(toc, main);
    page.append(h('div', { class: 'crumbs' }, h('a', { href: '#/', text: 'Topics' }), ' / ', m.title));
    page.append(layout);

    const idx = OS.modules.indexOf(m);
    const prev = OS.modules[idx - 1], next = OS.modules[idx + 1];
    // header
    const rc = OS.readCount(m.id);
    const headBar = h('div', { class: 'bar' + (rc >= m.sections.length ? ' ok' : '') }, h('i', { style: { width: (m.sections.length ? (rc / m.sections.length) * 100 : 0) + '%' } }));
    main.append(h('div', { class: 'mod-head' },
      h('div', { class: 'en', text: `Module ${String(m.num).padStart(2, '0')}${m.group === 'lab' ? ' · Lab' : ''}` }),
      h('h1', {}, h('span', { text: m.icon }), h('span', { class: 'tr-zone', text: m.title })),
      m.summary ? h('p', { class: 'muted tr-zone', text: m.summary }) : null,
      h('div', { class: 'row', style: { margin: '10px 0' } },
        h('a', { class: 'btn primary', href: `#/quiz/${m.id}`, text: `Practice (${m.questions.length})` }),
        m.terms.length ? h('a', { class: 'btn', href: `#/cards/${m.id}`, text: `Flashcards (${m.terms.length})` }) : null),
      headBar,
      h('div', { class: 'src', text: 'Source: ' + (m.sources || []).join(', ') })));

    // big picture: bridge + intro + roadmap
    if (m.bridge || m.intro) {
      const big = h('div', { class: 'section intro-card' });
      if (m.bridge) big.append(h('div', { class: 'bridge tr-zone' }, prev ? h('a', { class: 'bridge-from', href: '#/m/' + prev.id, text: `← from ${prev.title}` }) : h('span', { class: 'bridge-from', text: 'Course start' }), h('div', { html: m.bridge })));
      if (m.intro) big.append(h('div', { class: 'content tr-zone', html: m.intro }));
      const road = h('ol', { class: 'roadmap' });
      m.sections.forEach((s, i) => {
        const li = h('li', {}, h('a', { href: `#/m/${m.id}/${s.id}` }, h('span', { class: 'rm-n', text: String(i + 1) }), h('span', {}, h('b', { class: 'tr-zone', text: s.h }), s.why ? h('small', { class: 'tr-zone', text: s.why }) : null)));
        li.querySelector('a').addEventListener('click', e => { e.preventDefault(); scrollToSec(s.id); history.replaceState(null, '', `#/m/${m.id}/${s.id}`); });
        road.append(li);
      });
      big.append(h('div', { class: 'roadmap-title', text: 'Path through this module' }), road);
      main.append(big);
    }

    // mobile toc
    const sel = h('select', { 'aria-label': 'Section' }, h('option', { value: '', text: 'Jump to section…' }), ...m.sections.map((s, i) => h('option', { value: s.id, text: `${i + 1}. ${s.h}` })));
    sel.onchange = () => { if (sel.value) scrollToSec(sel.value); };
    main.append(h('div', { class: 'toc-mobile' }, sel));

    toc.append(h('div', { class: 'toc-title', text: 'Sections' }));
    const tocLinks = {};
    m.sections.forEach((s, i) => {
      const chk = h('span', { class: 'chk' + (OS.isRead(m.id, s.id) ? ' on' : '') });
      const a = h('a', { href: `#/m/${m.id}/${s.id}` }, chk, h('span', { text: `${i + 1}. ${s.h}` }));
      a.addEventListener('click', e => { e.preventDefault(); scrollToSec(s.id); history.replaceState(null, '', `#/m/${m.id}/${s.id}`); });
      tocLinks[s.id] = { a, chk };
      toc.append(a);
    });
    toc.append(h('div', { class: 'toc-actions' },
      h('a', { class: 'btn sm', href: `#/quiz/${m.id}`, text: 'Practise this module' }),
      h('a', { class: 'btn sm ghost', href: '#/exam?m=' + m.id, text: 'Mini-exam on this module' })));

    const secEls = {};
    m.sections.forEach((s, i) => {
      const sec = h('section', { class: 'section', id: 'sec-' + s.id });
      sec.append(h('h2', {}, h('span', { class: 'num', text: String(i + 1).padStart(2, '0') }), h('span', { class: 'tr-zone', text: s.h })));
      if (s.lead) sec.append(h('div', { class: 'lead tr-zone', html: s.lead }));
      const content = h('div', { class: 'content tr-zone', html: s.html || '' });
      sec.append(content);
      const used = new Set();
      content.querySelectorAll('[data-viz]').forEach(ph => {
        const k = +ph.dataset.viz;
        if (s.viz && s.viz[k]) { used.add(k); OS.mountViz(ph, s.viz[k]); }
      });
      (s.viz || []).forEach((v, k) => { if (!used.has(k)) OS.mountViz(sec, v); });
      if (s.takeaway) sec.append(h('div', { class: 'takeaway tr-zone', html: s.takeaway }));
      if (s.exam) sec.append(h('div', { class: 'exam-tip tr-zone', html: s.exam }));
      const qs = m.questions.filter(q => q.section === s.id);
      const cb = h('input', { type: 'checkbox', checked: OS.isRead(m.id, s.id) });
      cb.addEventListener('change', () => {
        OS.setRead(m.id, s.id, cb.checked);
        tocLinks[s.id].chk.classList.toggle('on', cb.checked);
        const r = OS.readCount(m.id);
        headBar.firstChild.style.width = (r / m.sections.length) * 100 + '%';
        headBar.classList.toggle('ok', r >= m.sections.length);
      });
      const nextSec = m.sections[i + 1];
      sec.append(h('div', { class: 'section-foot' },
        h('label', { class: 'learned' }, cb, 'Got it'),
        h('span', { class: 'spacer' }),
        qs.length ? h('a', { class: 'btn sm', href: `#/quiz/${m.id}/${s.id}`, text: `Questions (${qs.length})` }) : null,
        nextSec ? h('button', { class: 'btn sm ghost', type: 'button', text: `Next: ${nextSec.h} ↓`, onclick: () => { if (!cb.checked) { cb.checked = true; cb.dispatchEvent(new Event('change')); } scrollToSec(nextSec.id); } }) : null));
      OS.highlightAll(sec);
      secEls[s.id] = sec;
      main.append(sec);
    });

    // prev / next module
    main.append(h('div', { class: 'row', style: { justifyContent: 'space-between', marginTop: '20px' } },
      prev ? h('a', { class: 'btn', href: '#/m/' + prev.id, text: '← ' + prev.title }) : h('span'),
      next ? h('a', { class: 'btn', href: '#/m/' + next.id, text: next.title + ' →' }) : h('a', { class: 'btn primary', href: '#/exam', text: 'Go to the exam →' })));
    if (next && next.bridge) main.append(h('div', { class: 'callout note tr-zone', style: { marginTop: '12px' }, html: `<b>Next: ${esc(next.title)}.</b> ${next.bridge}` }));
    app.append(page);

    function scrollToSec(id) {
      const el = secEls[id];
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: 'smooth' });
    }
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          const id = e.target.id.replace('sec-', '');
          Object.values(tocLinks).forEach(t => t.a.classList.remove('active'));
          if (tocLinks[id]) tocLinks[id].a.classList.add('active');
          OS.state.last = { m: m.id, s: id };
        });
      }, { rootMargin: '-80px 0px -65% 0px' });
      Object.values(secEls).forEach(el => io.observe(el));
      OS.onLeave = () => { io.disconnect(); OS.save(); };
    }
    if (target && secEls[target]) setTimeout(() => { const el = secEls[target]; window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 70); }, 30);
    if (target) OS.keepScroll = true;
  };

  /* ---------- practice quiz ---------- */
  OS.views.quiz = function (app, parts) {
    let qs, title, back;
    if (parts[0] === 'mistakes') {
      qs = Object.keys(OS.state.mistakes).map(OS.qById).filter(Boolean);
      title = 'Practise your mistakes'; back = '#/mistakes';
    } else if (parts[0] === 'all') {
      qs = OS.allQuestions(); title = 'All questions'; back = '#/';
    } else {
      const m = OS.byId[parts[0]];
      if (!m) return OS.views.home(app);
      qs = m.questions.filter(q => !parts[1] || q.section === parts[1]);
      const sec = parts[1] && m.sections.find(s => s.id === parts[1]);
      title = sec ? `${m.title}: ${sec.h}` : `Practice: ${m.title}`;
      back = parts[1] ? `#/m/${m.id}/${parts[1]}` : `#/m/${m.id}`;
    }
    const page = h('div', { class: 'page narrow' });
    page.append(h('div', { class: 'crumbs' }, h('a', { href: back, text: '← back' })));
    page.append(h('h1', { text: title }));
    if (!qs.length) {
      page.append(h('div', { class: 'card empty' }, h('div', { class: 'big', text: '🎉' }), h('div', { text: 'No questions here yet.' })));
      return app.append(page);
    }
    const score = q => { const r = OS.state.q[q.id]; return !r ? 0 : r.last ? 2 : 1; };
    qs = OS.shuffle(qs).sort((a, b) => score(a) - score(b));
    let i = 0, right = 0;
    const results = [];
    const prog = h('div', { class: 'progress-line' }, h('i'));
    const counter = h('div', { class: 'small muted', style: { marginBottom: '8px' } });
    const holder = h('div');
    page.append(prog, counter, holder);
    app.append(page);
    let card = null;
    function show() {
      prog.firstChild.style.width = (i / qs.length) * 100 + '%';
      counter.textContent = `Question ${i + 1} of ${qs.length} · correct ${right}`;
      holder.innerHTML = '';
      const q = qs[i];
      card = OS.renderQuestion(q, {
        mode: 'practice', showModule: parts[0] === 'mistakes' || parts[0] === 'all',
        onAnswered: ok => {
          OS.recordAnswer(q, ok);
          if (ok) right++;
          results.push({ q, ok });
          counter.textContent = `Question ${i + 1} of ${qs.length} · correct ${right}`;
          const nb = h('button', { class: 'btn primary', type: 'button', html: i + 1 < qs.length ? 'Next <span class="kbd">Enter</span>' : 'See result' });
          nb.onclick = next;
          card.navBar.append(nb);
          nb.focus({ preventScroll: true });
        }
      });
      holder.append(card);
    }
    function next() { i++; if (i < qs.length) { show(); window.scrollTo(0, 0); } else finish(); }
    function finish() {
      prog.firstChild.style.width = '100%';
      counter.textContent = '';
      holder.innerHTML = '';
      const pct = right / qs.length;
      holder.append(h('div', { class: 'card pad-lg' },
        h('h2', { text: `Result: ${right} of ${qs.length} (${OS.pct(pct)})` }),
        h('p', { class: 'muted', text: pct >= 0.85 ? 'Excellent — you have this topic.' : pct >= 0.6 ? 'Good, but there are gaps — review the mistakes below.' : 'Re-read the theory and try again.' }),
        h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', text: 'Again', onclick: () => OS.route() }), h('a', { class: 'btn', href: back, text: 'Back to theory' }))));
      const wrong = results.filter(r => !r.ok);
      if (wrong.length) {
        holder.append(h('h3', { text: 'Mistakes', style: { margin: '20px 0 10px' } }));
        wrong.forEach(r => holder.append(h('div', { class: 'review-item r-bad tr-zone' }, h('div', { html: OS.rich(r.q.q) }), h('div', { class: 'small', style: { marginTop: '6px' }, html: 'Correct: <b>' + OS.rich(OS.answerText(r.q)) + '</b>' }), h('div', { class: 'small muted', style: { marginTop: '4px' }, html: OS.rich(r.q.explain) }))));
      }
    }
    const onKey = e => {
      if (/input|textarea|select/i.test(document.activeElement.tagName)) return;
      if (!card) return;
      if (e.key === 'Enter' && card.isAnswered()) { e.preventDefault(); next(); }
      else if (!card.isAnswered()) card.handleKey(e);
    };
    document.addEventListener('keydown', onKey);
    OS.onLeave = () => document.removeEventListener('keydown', onKey);
    show();
  };

  /* ---------- flashcards ---------- */
  OS.views.cards = function (app, parts) {
    const m = OS.byId[parts[0]];
    if (!m) return OS.views.home(app);
    const known = OS.state.cards[m.id] = OS.state.cards[m.id] || {};
    let reverse = false;
    let deck = OS.shuffle(m.terms.filter(t => !known[t.en]));
    if (!deck.length) deck = OS.shuffle(m.terms);
    const page = h('div', { class: 'page narrow' });
    page.append(h('div', { class: 'crumbs' }, h('a', { href: '#/m/' + m.id, text: '← ' + m.title })));
    page.append(h('h1', { text: 'Flashcards: ' + m.title }));
    const info = h('div', { class: 'small muted', style: { marginBottom: '12px' } });
    const ctr = h('div', { class: 'viz-controls' }, OS.seg([[false, 'Term → definition'], [true, 'Definition → term']], false, v => { reverse = v; show(); }));
    const holder = h('div');
    page.append(ctr, info, holder);
    app.append(page);
    let cur = 0, flipped = false;
    function show() {
      holder.innerHTML = '';
      const kn = m.terms.filter(t => known[t.en]).length;
      info.textContent = `Known ${kn} of ${m.terms.length} · ${deck.length - cur} left in the deck`;
      if (cur >= deck.length) {
        holder.append(h('div', { class: 'card empty' }, h('div', { class: 'big', text: '✓' }), h('div', { text: 'Deck finished.' }),
          h('div', { class: 'row', style: { justifyContent: 'center', marginTop: '12px' } },
            h('button', { class: 'btn primary', type: 'button', text: 'Repeat unknown cards', onclick: () => { deck = OS.shuffle(m.terms.filter(t => !known[t.en])); if (!deck.length) deck = OS.shuffle(m.terms); cur = 0; show(); } }),
            h('button', { class: 'btn', type: 'button', text: 'Start over', onclick: () => { deck = OS.shuffle(m.terms); cur = 0; show(); } }))));
        return;
      }
      const t = deck[cur];
      flipped = false;
      const termFace = cls => h('div', { class: 'fc-face ' + cls }, h('div', { class: 't1', text: t.en }), t.ru ? h('div', { class: 't2', text: t.ru }) : null, cls ? null : h('div', { class: 'hint', text: 'click / space — flip' }));
      const defFace = cls => h('div', { class: 'fc-face ' + cls }, h('div', { class: 'def tr-zone', text: t.def }), cls ? null : h('div', { class: 'hint', text: 'click / space — flip' }));
      const fc = h('div', { class: 'fc' }, reverse ? defFace('') : termFace(''), reverse ? termFace('fc-back') : defFace('fc-back'));
      fc.onclick = e => { if (document.body.classList.contains('tr-mode') && e.target.closest('.tr-zone')) return; flipped = !flipped; fc.classList.toggle('flip', flipped); };
      holder.append(h('div', { class: 'fc-wrap' }, fc));
      holder.append(h('div', { class: 'row', style: { justifyContent: 'center', marginTop: '16px' } },
        h('button', { class: 'btn lg', type: 'button', html: "Don't know <span class=\"kbd\">←</span>", onclick: () => mark(false) }),
        h('button', { class: 'btn lg primary', type: 'button', html: 'Know it <span class="kbd">→</span>', onclick: () => mark(true) })));
    }
    function mark(ok) {
      const t = deck[cur];
      if (ok) known[t.en] = 1; else { delete known[t.en]; deck.push(t); }
      OS.save();
      cur++; show();
    }
    const onKey = e => {
      if (cur >= deck.length) return;
      if (e.key === ' ') { e.preventDefault(); const fc = holder.querySelector('.fc'); if (fc) { flipped = !flipped; fc.classList.toggle('flip', flipped); } }
      else if (e.key === 'ArrowRight') mark(true);
      else if (e.key === 'ArrowLeft') mark(false);
    };
    document.addEventListener('keydown', onKey);
    OS.onLeave = () => document.removeEventListener('keydown', onKey);
    show();
  };

  /* ---------- search ---------- */
  let searchIndex = null;
  function buildIndex() {
    searchIndex = [];
    OS.modules.forEach(m => {
      m.sections.forEach(s => searchIndex.push({ kind: 'Section', m, title: s.h, text: OS.stripHtml([s.lead, s.html, s.takeaway, s.exam].filter(Boolean).join(' ')), href: `#/m/${m.id}/${s.id}` }));
      m.terms.forEach(t => searchIndex.push({ kind: 'Term', m, title: t.en + (t.ru ? ' — ' + t.ru : ''), text: t.def, href: `#/cards/${m.id}` }));
    });
  }
  OS.views.search = function (app, parts, params) {
    const qstr = (params.get('q') || '').trim();
    const inp = document.getElementById('searchInput');
    if (inp) inp.value = qstr;
    const page = h('div', { class: 'page narrow' });
    page.append(h('h1', { text: qstr ? `Search: "${qstr}"` : 'Search' }));
    app.append(page);
    if (!qstr) { page.append(h('p', { class: 'muted', text: 'Type a query in the search box at the top (e.g. fork, semaphore, RAID, chmod).' })); return; }
    if (!searchIndex) buildIndex();
    const words = qstr.toLowerCase().split(/\s+/).filter(Boolean);
    const res = searchIndex.map(r => {
      const T = r.title.toLowerCase(), X = r.text.toLowerCase();
      let sc = 0;
      for (const w of words) { if (!T.includes(w) && !X.includes(w)) return null; sc += (T.includes(w) ? 5 : 0) + (X.split(w).length - 1); }
      return { r, sc };
    }).filter(Boolean).sort((a, b) => b.sc - a.sc).slice(0, 60);
    if (!res.length) { page.append(h('p', { class: 'muted', text: 'Nothing found.' })); return; }
    const re = new RegExp('(' + words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'gi');
    const box = h('div', { class: 'search-res' });
    res.forEach(({ r }) => {
      const X = r.text, pos = X.toLowerCase().indexOf(words[0]);
      const from = Math.max(0, pos - 80), snip = (from ? '…' : '') + X.slice(from, from + 220) + (X.length > from + 220 ? '…' : '');
      box.append(h('a', { class: 'sr', href: r.href },
        h('div', { class: 'where', text: `${r.kind} · ${r.m.icon} ${r.m.title}` }),
        h('div', { html: esc(r.title).replace(re, '<mark>$1</mark>') }),
        h('div', { class: 'snip', html: esc(snip).replace(re, '<mark>$1</mark>') })));
    });
    page.append(h('p', { class: 'muted small', text: `Found: ${res.length}` }), box);
  };

  /* ---------- mistakes ---------- */
  OS.views.mistakes = function (app) {
    const page = h('div', { class: 'page narrow' });
    page.append(h('h1', { text: 'Mistakes bank' }));
    const ids = Object.keys(OS.state.mistakes).filter(id => OS.qById(id));
    if (!ids.length) {
      page.append(h('div', { class: 'card empty' }, h('div', { class: 'big', text: '✨' }), h('div', { text: 'No mistakes. Questions you answer wrongly in practice or in an exam appear here and leave after you answer them correctly.' })));
      return app.append(page);
    }
    page.append(h('div', { class: 'row', style: { marginBottom: '16px' } },
      h('a', { class: 'btn primary', href: '#/quiz/mistakes', text: `Practise (${ids.length})` }),
      h('a', { class: 'btn', href: '#/exam?mistakes=1', text: 'Exam from mistakes' }),
      h('button', { class: 'btn ghost danger', type: 'button', text: 'Clear', onclick: () => { if (confirm('Clear the mistakes bank?')) { OS.state.mistakes = {}; OS.save(); OS.route(); } } })));
    OS.modules.forEach(m => {
      const qs = ids.map(OS.qById).filter(q => q.module === m.id);
      if (!qs.length) return;
      page.append(h('h3', { style: { margin: '18px 0 8px' }, text: `${m.icon} ${m.title} · ${qs.length}` }));
      qs.forEach(q => page.append(h('div', { class: 'review-item r-bad tr-zone' },
        h('div', { html: OS.rich(q.q) }),
        q.code ? h('pre', { class: 'code', 'data-lang': q.lang || 'text', html: OS.highlight(String(q.code), q.lang) }) : null,
        h('div', { class: 'small', style: { marginTop: '6px' }, html: 'Correct: <b>' + OS.rich(OS.answerText(q)) + '</b>' }),
        h('div', { class: 'small muted', style: { marginTop: '4px' }, html: OS.rich(q.explain) }),
        h('a', { class: 'small', href: `#/m/${m.id}/${q.section}`, text: '→ theory' }))));
    });
    app.append(page);
  };
})();
