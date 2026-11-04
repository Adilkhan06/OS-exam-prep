/* Learning views: home, module, practice quiz, flashcards, search, mistakes, history + shared question UI */
(function () {
  'use strict';
  const { h, esc } = OS;

  /* ---------- rich text for questions: escape all, allow a few inline tags ---------- */
  OS.rich = function (s) {
    return esc(s).replace(/&lt;(\/?)(code|b|i|sub|sup|br)\s*\/?&gt;/g, '<$1$2>').replace(/`([^`]+)`/g, '<code>$1</code>');
  };
  const TYPE_LABEL = { single: 'Один ответ', multi: 'Несколько ответов', tf: 'Верно / Неверно', code: 'Код' };
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
  const optText = (q, i) => (q.type === 'tf' ? (i === 0 ? 'Верно' : 'Неверно') : String(q.options[i]));
  const isRight = (q, i) => (q.type === 'tf' ? i === (q.answer ? 0 : 1) : q.type === 'multi' ? q.answer.includes(i) : i === q.answer);
  OS.answerText = function (q) {
    if (q.type === 'tf') return q.answer ? 'Верно' : 'Неверно';
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
    if (opts.index != null) meta.append(h('span', { class: 'tag acc', text: `Вопрос ${opts.index + 1}${opts.total ? ' / ' + opts.total : ''}` }));
    if (opts.showModule !== false && m) meta.append(h('span', { class: 'tag', text: `${m.icon} ${m.titleRu}` }));
    meta.append(h('span', { class: 'tag', text: TYPE_LABEL[q.type] }));
    meta.append(h('span', { class: 'tag', title: 'Сложность', text: diffDots(q.diff) }));
    card.append(meta);
    card.append(h('div', { class: 'q-text', html: OS.rich(q.q) }));
    if (q.type === 'multi' && mode !== 'review') card.append(h('div', { class: 'q-hint', text: 'Выбери все верные варианты.' }));
    if (q.code) card.append(h('pre', { class: 'code', 'data-lang': q.lang || 'text', html: OS.highlight(String(q.code), q.lang) }));
    const order = opts.order || OS.optionOrder(q);
    let sel = opts.selected != null ? (Array.isArray(opts.selected) ? opts.selected.slice() : opts.selected) : (q.type === 'multi' ? [] : null);
    let answered = mode === 'review';
    const list = h('div', { class: 'opts' });
    const btns = [];
    order.forEach((oi, k) => {
      const b = h('button', { type: 'button', class: 'opt' + (q.type === 'multi' ? ' multi' : '') },
        h('span', { class: 'k', text: q.type === 'tf' ? (k === 0 ? 'В' : 'Н') : String.fromCharCode(65 + k) }),
        h('span', { html: OS.rich(optText(q, oi)) }));
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
      checkBtn = h('button', { class: 'btn primary', type: 'button', text: 'Проверить', disabled: true });
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
      if (q.type === 'multi') {
        sel = sel.includes(oi) ? sel.filter(x => x !== oi) : sel.concat(oi);
      } else sel = sel === oi && mode === 'exam' ? null : oi;
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
      const box = h('div', { class: 'explain ' + (ok ? 'ok' : 'bad') });
      box.append(h('b', { class: 'res', text: ok ? '✓ Верно' : unanswered ? '— Нет ответа' : '✗ Неверно' }));
      if (!ok) box.append(h('div', { html: 'Правильный ответ: <b>' + OS.rich(OS.answerText(q)) + '</b>' }));
      box.append(h('div', { html: OS.rich(q.explain || '') }));
      if (m) box.append(h('div', { style: { marginTop: '6px' } }, h('a', { href: `#/m/${m.id}/${q.section}`, text: '→ Теория: ' + ((m.sections.find(s => s.id === q.section) || {}).h || m.titleRu) })));
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
    const cont = last ? h('a', { class: 'btn primary lg', href: `#/m/${last.m}/${last.s || ''}`, text: `Продолжить: ${OS.byId[last.m].titleRu}` })
      : h('a', { class: 'btn primary lg', href: OS.modules[0] ? '#/m/' + OS.modules[0].id : '#/', text: 'Начать с первой темы' });
    const hero = h('div', { class: 'hero' },
      h('div', { class: 'hero-main' },
        h('h1', { text: 'Operating Systems' }),
        h('p', { html: `Все темы курса — сжато, с визуализациями и симуляторами. ${OS.modules.length} модулей, ${totalQ} вопросов. Учи по темам, тренируйся, затем сдавай экзамен на время.` }),
        h('div', { class: 'row' }, cont, h('a', { class: 'btn lg', href: '#/exam', text: 'Режим экзамена' }))),
      h('div', { class: 'stats' },
        stat('Изучено разделов', `${readSecs}/${totalSecs}`, totalSecs ? OS.pct(readSecs / totalSecs) : '—'),
        stat('Вопросов пройдено', `${answered}/${totalQ}`, 'уникальных'),
        stat('Точность', sums[1] ? OS.pct(sums[0] / sums[1]) : '—', sums[1] ? `${sums[0]} из ${sums[1]} ответов` : 'пока нет ответов'),
        stat('Последний экзамен', lastExam ? `${lastExam.grade}/30` : '—', lastExam ? `${OS.pct(lastExam.score)} · ${new Date(lastExam.date).toLocaleDateString('ru-RU')}` : 'ещё не сдавал')));
    page.append(hero);
    const mist = Object.keys(OS.state.mistakes).filter(id => OS.qById(id)).length;
    if (mist) page.append(h('div', { class: 'callout warn row', style: { justifyContent: 'space-between' } }, h('span', { html: `В банке ошибок <b>${mist}</b> ${OS.plural(mist, 'вопрос', 'вопроса', 'вопросов')}.` }), h('a', { class: 'btn sm', href: '#/quiz/mistakes', text: 'Тренировать ошибки' })));
    [['theory', 'Теория', 'лекции'], ['lab', 'Лабораторные', 'Linux, процессы, Bash, устройства']].forEach(([g, title, sub]) => {
      const mods = OS.modules.filter(m => m.group === g);
      if (!mods.length) return;
      page.append(h('div', { class: 'group-title' }, h('h2', { text: title }), h('span', { text: sub })));
      const grid = h('div', { class: 'mod-grid' });
      mods.forEach(m => grid.append(modCard(m)));
      page.append(grid);
    });
    const reset = h('button', { class: 'btn sm ghost danger', type: 'button', text: 'Сбросить весь прогресс' });
    reset.onclick = () => { if (confirm('Удалить прогресс, ошибки и историю экзаменов?')) { OS.resetProgress(); OS.route(); } };
    page.append(h('div', { class: 'foot' }, h('div', { text: 'Прогресс хранится только в этом браузере.' }), reset));
    app.append(page);
    function stat(label, value, sub) { return h('div', { class: 'stat' }, h('div', { class: 'stat-label', text: label }), h('div', { class: 'stat-value', text: value }), h('div', { class: 'stat-sub', text: sub })); }
  };
  function modCard(m) {
    const rc = OS.readCount(m.id), st = OS.moduleStats(m.id);
    const pr = m.sections.length ? rc / m.sections.length : 0;
    return h('a', { class: 'mod-card', href: '#/m/' + m.id },
      h('div', { class: 'mod-top' }, h('div', { class: 'mod-icon', text: m.icon || '•' }),
        h('div', {}, h('div', { class: 'mod-num', text: String(m.num).padStart(2, '0') + (m.group === 'lab' ? ' · LAB' : '') }), h('div', { class: 'mod-title', text: m.titleRu }), h('div', { class: 'mod-sub', text: m.title }))),
      h('div', { class: 'mod-sum', text: m.summary || '' }),
      h('div', { class: 'bar' + (pr >= 1 ? ' ok' : '') }, h('i', { style: { width: pr * 100 + '%' } })),
      h('div', { class: 'mod-meta' }, h('span', { text: `${rc}/${m.sections.length} разделов` }), h('span', { text: `${m.questions.length} вопросов` }), st.acc != null ? h('span', { text: 'точность ' + OS.pct(st.acc) }) : null));
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
    page.append(h('div', { class: 'crumbs' }, h('a', { href: '#/', text: 'Темы' }), ' / ', m.titleRu));
    page.append(layout);

    // header
    const rc = OS.readCount(m.id);
    const headBar = h('div', { class: 'bar' + (rc >= m.sections.length ? ' ok' : '') }, h('i', { style: { width: (m.sections.length ? (rc / m.sections.length) * 100 : 0) + '%' } }));
    main.append(h('div', { class: 'mod-head' },
      h('h1', {}, h('span', { text: m.icon }), h('span', { text: m.titleRu })),
      h('div', { class: 'en', text: `${String(m.num).padStart(2, '0')} · ${m.title}` }),
      m.summary ? h('p', { class: 'muted', text: m.summary }) : null,
      h('div', { class: 'row', style: { margin: '10px 0' } },
        h('a', { class: 'btn primary', href: `#/quiz/${m.id}`, text: `Тренировка (${m.questions.length})` }),
        m.terms.length ? h('a', { class: 'btn', href: `#/cards/${m.id}`, text: `Карточки (${m.terms.length})` }) : null),
      headBar,
      h('div', { class: 'src', text: 'Источник: ' + (m.sources || []).join(', ') })));

    // mobile toc
    const sel = h('select', { 'aria-label': 'Раздел' }, h('option', { value: '', text: 'Перейти к разделу…' }), ...m.sections.map((s, i) => h('option', { value: s.id, text: `${i + 1}. ${s.h}` })));
    sel.onchange = () => { if (sel.value) scrollToSec(sel.value); };
    main.append(h('div', { class: 'toc-mobile' }, sel));

    toc.append(h('div', { class: 'toc-title', text: 'Разделы' }));
    const tocLinks = {};
    m.sections.forEach((s, i) => {
      const chk = h('span', { class: 'chk' + (OS.isRead(m.id, s.id) ? ' on' : '') });
      const a = h('a', { href: `#/m/${m.id}/${s.id}` }, chk, h('span', { text: `${i + 1}. ${s.h}` }));
      a.addEventListener('click', e => { e.preventDefault(); scrollToSec(s.id); history.replaceState(null, '', `#/m/${m.id}/${s.id}`); });
      tocLinks[s.id] = { a, chk };
      toc.append(a);
    });
    toc.append(h('div', { class: 'toc-actions' },
      h('a', { class: 'btn sm', href: `#/quiz/${m.id}`, text: 'Тренировка по модулю' }),
      h('a', { class: 'btn sm ghost', href: '#/exam?m=' + m.id, text: 'Мини-экзамен по модулю' })));

    const secEls = {};
    m.sections.forEach((s, i) => {
      const sec = h('section', { class: 'section', id: 'sec-' + s.id });
      sec.append(h('h2', {}, h('span', { class: 'num', text: String(i + 1).padStart(2, '0') }), h('span', { text: s.h })));
      const content = h('div', { class: 'content', html: s.html || '' });
      sec.append(content);
      const used = new Set();
      content.querySelectorAll('[data-viz]').forEach(ph => {
        const k = +ph.dataset.viz;
        if (s.viz && s.viz[k]) { used.add(k); OS.mountViz(ph, s.viz[k]); }
      });
      (s.viz || []).forEach((v, k) => { if (!used.has(k)) OS.mountViz(sec, v); });
      if (s.exam) sec.append(h('div', { class: 'exam-tip', html: s.exam }));
      const qs = m.questions.filter(q => q.section === s.id);
      const cb = h('input', { type: 'checkbox', checked: OS.isRead(m.id, s.id) });
      cb.addEventListener('change', () => {
        OS.setRead(m.id, s.id, cb.checked);
        tocLinks[s.id].chk.classList.toggle('on', cb.checked);
        const r = OS.readCount(m.id);
        headBar.firstChild.style.width = (r / m.sections.length) * 100 + '%';
        headBar.classList.toggle('ok', r >= m.sections.length);
      });
      sec.append(h('div', { class: 'section-foot' },
        h('label', { class: 'learned' }, cb, 'Раздел изучен'),
        h('span', { class: 'spacer' }),
        qs.length ? h('a', { class: 'btn sm', href: `#/quiz/${m.id}/${s.id}`, text: `Вопросы по разделу (${qs.length})` }) : null));
      OS.highlightAll(sec);
      secEls[s.id] = sec;
      main.append(sec);
    });

    // prev / next
    const idx = OS.modules.indexOf(m);
    const prev = OS.modules[idx - 1], next = OS.modules[idx + 1];
    main.append(h('div', { class: 'row', style: { justifyContent: 'space-between', marginTop: '20px' } },
      prev ? h('a', { class: 'btn', href: '#/m/' + prev.id, text: '← ' + prev.titleRu }) : h('span'),
      next ? h('a', { class: 'btn', href: '#/m/' + next.id, text: next.titleRu + ' →' }) : h('a', { class: 'btn primary', href: '#/exam', text: 'К экзамену →' })));
    app.append(page);

    function scrollToSec(id) {
      const el = secEls[id];
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: 'smooth' });
    }
    // scroll spy
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
      title = 'Работа над ошибками'; back = '#/mistakes';
    } else if (parts[0] === 'all') {
      qs = OS.allQuestions(); title = 'Все вопросы'; back = '#/';
    } else {
      const m = OS.byId[parts[0]];
      if (!m) return OS.views.home(app);
      qs = m.questions.filter(q => !parts[1] || q.section === parts[1]);
      const sec = parts[1] && m.sections.find(s => s.id === parts[1]);
      title = sec ? `${m.titleRu}: ${sec.h}` : `Тренировка: ${m.titleRu}`;
      back = parts[1] ? `#/m/${m.id}/${parts[1]}` : `#/m/${m.id}`;
    }
    const page = h('div', { class: 'page narrow' });
    page.append(h('div', { class: 'crumbs' }, h('a', { href: back, text: '← назад' })));
    page.append(h('h1', { text: title }));
    if (!qs.length) {
      page.append(h('div', { class: 'card empty' }, h('div', { class: 'big', text: '🎉' }), h('div', { text: 'Здесь пока нет вопросов.' })));
      return app.append(page);
    }
    // unseen and previously wrong first, then the rest
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
      counter.textContent = `Вопрос ${i + 1} из ${qs.length} · верно ${right}`;
      holder.innerHTML = '';
      const q = qs[i];
      card = OS.renderQuestion(q, {
        mode: 'practice', showModule: parts[0] === 'mistakes' || parts[0] === 'all',
        onAnswered: ok => {
          OS.recordAnswer(q, ok);
          if (ok) right++;
          results.push({ q, ok });
          counter.textContent = `Вопрос ${i + 1} из ${qs.length} · верно ${right}`;
          const nb = h('button', { class: 'btn primary', type: 'button', html: i + 1 < qs.length ? 'Дальше <span class="kbd">Enter</span>' : 'Результат' });
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
        h('h2', { text: `Результат: ${right} из ${qs.length} (${OS.pct(pct)})` }),
        h('p', { class: 'muted', text: pct >= 0.85 ? 'Отлично — тема усвоена.' : pct >= 0.6 ? 'Хорошо, но есть пробелы — посмотри ошибки ниже.' : 'Стоит перечитать теорию и повторить.' }),
        h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', text: 'Ещё раз', onclick: () => OS.route() }), h('a', { class: 'btn', href: back, text: 'К теории' }))));
      const wrong = results.filter(r => !r.ok);
      if (wrong.length) {
        holder.append(h('h3', { text: 'Ошибки', style: { margin: '20px 0 10px' } }));
        wrong.forEach(r => holder.append(h('div', { class: 'review-item r-bad' }, h('div', { html: OS.rich(r.q.q) }), h('div', { class: 'small', style: { marginTop: '6px' }, html: 'Правильно: <b>' + OS.rich(OS.answerText(r.q)) + '</b>' }), h('div', { class: 'small muted', style: { marginTop: '4px' }, html: OS.rich(r.q.explain) }))));
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
    page.append(h('div', { class: 'crumbs' }, h('a', { href: '#/m/' + m.id, text: '← ' + m.titleRu })));
    page.append(h('h1', { text: 'Карточки: ' + m.titleRu }));
    const info = h('div', { class: 'small muted', style: { marginBottom: '12px' } });
    const ctr = h('div', { class: 'viz-controls' }, OS.seg([[false, 'Термин → определение'], [true, 'Определение → термин']], false, v => { reverse = v; show(); }));
    const holder = h('div');
    page.append(ctr, info, holder);
    app.append(page);
    let cur = 0, flipped = false;
    function show() {
      holder.innerHTML = '';
      const kn = m.terms.filter(t => known[t.en]).length;
      info.textContent = `Знаю ${kn} из ${m.terms.length} · в колоде ${deck.length - cur}`;
      if (cur >= deck.length) {
        holder.append(h('div', { class: 'card empty' }, h('div', { class: 'big', text: '✓' }), h('div', { text: 'Колода пройдена.' }),
          h('div', { class: 'row', style: { justifyContent: 'center', marginTop: '12px' } },
            h('button', { class: 'btn primary', type: 'button', text: 'Повторить незнакомые', onclick: () => { deck = OS.shuffle(m.terms.filter(t => !known[t.en])); if (!deck.length) deck = OS.shuffle(m.terms); cur = 0; show(); } }),
            h('button', { class: 'btn', type: 'button', text: 'Все заново', onclick: () => { deck = OS.shuffle(m.terms); cur = 0; show(); } }))));
        return;
      }
      const t = deck[cur];
      flipped = false;
      const front = reverse ? h('div', { class: 'fc-face' }, h('div', { class: 'def', text: t.def }), h('div', { class: 'hint', text: 'клик / пробел — перевернуть' }))
        : h('div', { class: 'fc-face' }, h('div', { class: 't1', text: t.en }), t.ru ? h('div', { class: 't2', text: t.ru }) : null, h('div', { class: 'hint', text: 'клик / пробел — перевернуть' }));
      const back = reverse ? h('div', { class: 'fc-face fc-back' }, h('div', { class: 't1', text: t.en }), t.ru ? h('div', { class: 't2', text: t.ru }) : null)
        : h('div', { class: 'fc-face fc-back' }, h('div', { class: 'def', text: t.def }));
      const fc = h('div', { class: 'fc' }, front, back);
      fc.onclick = () => { flipped = !flipped; fc.classList.toggle('flip', flipped); };
      holder.append(h('div', { class: 'fc-wrap' }, fc));
      holder.append(h('div', { class: 'row', style: { justifyContent: 'center', marginTop: '16px' } },
        h('button', { class: 'btn lg', type: 'button', html: 'Не знаю <span class="kbd">←</span>', onclick: () => mark(false) }),
        h('button', { class: 'btn lg primary', type: 'button', html: 'Знаю <span class="kbd">→</span>', onclick: () => mark(true) })));
    }
    function mark(ok) {
      const t = deck[cur];
      if (ok) known[t.en] = 1; else { delete known[t.en]; deck.push(t); }
      OS.save();
      cur++; show();
    }
    const onKey = e => {
      if (cur >= deck.length) return;
      if (e.key === ' ') { e.preventDefault(); const fc = holder.querySelector('.fc'); if (fc) fc.click(); }
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
      m.sections.forEach(s => searchIndex.push({ kind: 'Раздел', m, s, title: s.h, text: OS.stripHtml(s.html + ' ' + (s.exam || '')), href: `#/m/${m.id}/${s.id}` }));
      m.terms.forEach(t => searchIndex.push({ kind: 'Термин', m, title: t.en + (t.ru ? ' — ' + t.ru : ''), text: t.def, href: `#/cards/${m.id}` }));
    });
  }
  OS.views.search = function (app, parts, params) {
    const qstr = (params.get('q') || '').trim();
    const inp = document.getElementById('searchInput');
    if (inp) inp.value = qstr;
    const page = h('div', { class: 'page narrow' });
    page.append(h('h1', { text: qstr ? `Поиск: «${qstr}»` : 'Поиск' }));
    app.append(page);
    if (!qstr) { page.append(h('p', { class: 'muted', text: 'Введи запрос в поле поиска сверху (например: fork, semaphore, RAID, chmod).' })); return; }
    if (!searchIndex) buildIndex();
    const words = qstr.toLowerCase().split(/\s+/).filter(Boolean);
    const res = searchIndex.map(r => {
      const T = r.title.toLowerCase(), X = r.text.toLowerCase();
      let sc = 0;
      for (const w of words) { if (!T.includes(w) && !X.includes(w)) return null; sc += (T.includes(w) ? 5 : 0) + (X.split(w).length - 1); }
      return { r, sc };
    }).filter(Boolean).sort((a, b) => b.sc - a.sc).slice(0, 60);
    if (!res.length) { page.append(h('p', { class: 'muted', text: 'Ничего не найдено.' })); return; }
    const re = new RegExp('(' + words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'gi');
    const box = h('div', { class: 'search-res' });
    res.forEach(({ r }) => {
      const X = r.text, pos = X.toLowerCase().indexOf(words[0]);
      const from = Math.max(0, pos - 80), snip = (from ? '…' : '') + X.slice(from, from + 220) + (X.length > from + 220 ? '…' : '');
      box.append(h('a', { class: 'sr', href: r.href },
        h('div', { class: 'where', text: `${r.kind} · ${r.m.icon} ${r.m.titleRu}` }),
        h('div', { html: esc(r.title).replace(re, '<mark>$1</mark>') }),
        h('div', { class: 'snip', html: esc(snip).replace(re, '<mark>$1</mark>') })));
    });
    page.append(h('p', { class: 'muted small', text: `Найдено: ${res.length}` }), box);
  };

  /* ---------- mistakes ---------- */
  OS.views.mistakes = function (app) {
    const page = h('div', { class: 'page narrow' });
    page.append(h('h1', { text: 'Банк ошибок' }));
    const ids = Object.keys(OS.state.mistakes).filter(id => OS.qById(id));
    if (!ids.length) {
      page.append(h('div', { class: 'card empty' }, h('div', { class: 'big', text: '✨' }), h('div', { text: 'Ошибок нет. Вопросы, на которые ответишь неверно в тренировке или на экзамене, появятся здесь и уйдут после верного ответа.' })));
      return app.append(page);
    }
    page.append(h('div', { class: 'row', style: { marginBottom: '16px' } },
      h('a', { class: 'btn primary', href: '#/quiz/mistakes', text: `Тренировать (${ids.length})` }),
      h('a', { class: 'btn', href: '#/exam?mistakes=1', text: 'Экзамен по ошибкам' }),
      h('button', { class: 'btn ghost danger', type: 'button', text: 'Очистить', onclick: () => { if (confirm('Очистить банк ошибок?')) { OS.state.mistakes = {}; OS.save(); OS.route(); } } })));
    OS.modules.forEach(m => {
      const qs = ids.map(OS.qById).filter(q => q.module === m.id);
      if (!qs.length) return;
      page.append(h('h3', { style: { margin: '18px 0 8px' }, text: `${m.icon} ${m.titleRu} · ${qs.length}` }));
      qs.forEach(q => page.append(h('div', { class: 'review-item r-bad' },
        h('div', { html: OS.rich(q.q) }),
        q.code ? h('pre', { class: 'code', 'data-lang': q.lang || 'text', html: OS.highlight(String(q.code), q.lang) }) : null,
        h('div', { class: 'small', style: { marginTop: '6px' }, html: 'Правильно: <b>' + OS.rich(OS.answerText(q)) + '</b>' }),
        h('div', { class: 'small muted', style: { marginTop: '4px' }, html: OS.rich(q.explain) }),
        h('a', { class: 'small', href: `#/m/${m.id}/${q.section}`, text: '→ к теории' }))));
    });
    app.append(page);
  };
})();
