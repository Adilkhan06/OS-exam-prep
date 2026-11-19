/* Exam mode: setup, run, result, history */
(function () {
  'use strict';
  const { h } = OS;
  const MIN_PER_Q = 1.5;

  function pickQuestions(mods, count, type) {
    const filt = q => type === 'code' ? (q.type === 'code' || !!q.code) : type === 'theory' ? (q.type !== 'code' && !q.code) : true;
    const pools = mods.map(m => OS.shuffle(m.questions.filter(filt))).filter(p => p.length);
    const totalSize = pools.reduce((s, p) => s + p.length, 0);
    const n = Math.min(count, totalSize);
    if (!n) return [];
    // proportional quotas, at least one per module when possible
    let quotas = pools.map(p => (n * p.length) / totalSize);
    let base = quotas.map(Math.floor);
    if (n >= pools.length) base = base.map(b => Math.max(1, b));
    let left = n - base.reduce((a, b) => a + b, 0);
    const order = quotas.map((q, i) => [q - Math.floor(q), i]).sort((a, b) => b[0] - a[0]);
    let k = 0;
    while (left > 0 && k < 10000) { const i = order[k % order.length][1]; if (base[i] < pools[i].length) { base[i]++; left--; } k++; }
    while (left < 0) { const i = base.indexOf(Math.max(...base)); base[i]--; left++; }
    const picked = [];
    pools.forEach((p, i) => {
      // spread across sections: round-robin by section
      const bySec = {};
      p.forEach(q => (bySec[q.section] = bySec[q.section] || []).push(q));
      const lists = OS.shuffle(Object.values(bySec));
      const out = [];
      while (out.length < base[i]) { let added = false; for (const l of lists) { if (l.length && out.length < base[i]) { out.push(l.shift()); added = true; } } if (!added) break; }
      picked.push(...out);
    });
    return OS.shuffle(picked);
  }

  function startExam(qs, settings) {
    const minutes = settings.timer ? Math.max(1, Math.round(settings.minutes || qs.length * MIN_PER_Q)) : null;
    OS.state.active = {
      id: 'e' + Date.now(),
      qids: qs.map(q => q.id),
      orders: qs.map(q => OS.optionOrder(q)),
      answers: {}, flags: {}, cur: 0,
      started: Date.now(),
      deadline: minutes ? Date.now() + minutes * 60000 : null,
      settings: Object.assign({}, settings, { minutes })
    };
    OS.save();
    OS.go('#/exam/run');
  }

  /* ---------- setup ---------- */
  OS.views.exam = function (app, parts, params) {
    if (parts[0] === 'run') return runView(app);
    if (parts[0] === 'result') return resultView(app, parts[1]);
    const page = h('div', { class: 'page narrow' });
    app.append(page);
    page.append(h('h1', { text: 'Exam mode' }));
    const act = OS.state.active;
    if (act && act.qids.every(id => OS.qById(id))) {
      const left = act.deadline ? Math.max(0, act.deadline - Date.now()) : null;
      page.append(h('div', { class: 'callout warn row', style: { justifyContent: 'space-between' } },
        h('span', { html: `You have an unfinished exam: ${Object.keys(act.answers).length} of ${act.qids.length} answered` + (left != null ? `, ${Math.ceil(left / 60000)} min left.` : '.') }),
        h('span', { class: 'row' }, h('a', { class: 'btn sm primary', href: '#/exam/run', text: 'Continue' }),
          h('button', { class: 'btn sm ghost danger', type: 'button', text: 'Cancel', onclick: () => { OS.state.active = null; OS.save(); OS.route(); } }))));
    }
    const fromMistakes = params.get('mistakes') === '1';
    const only = params.get('m');
    const card = h('div', { class: 'card pad-lg setup-grid' });
    page.append(card);
    if (fromMistakes) {
      const qs = Object.keys(OS.state.mistakes).map(OS.qById).filter(Boolean);
      card.append(h('p', { html: `Exam from your mistakes bank: <b>${OS.pl(qs.length, 'question')}</b>. Timer: ${Math.round(qs.length * MIN_PER_Q)} min.` }));
      card.append(h('div', {}, h('button', { class: 'btn primary lg', type: 'button', text: 'Start', disabled: !qs.length, onclick: () => startExam(OS.shuffle(qs), { timer: true, source: 'mistakes' }) })));
      return;
    }
    const chosen = new Set(only && OS.byId[only] ? [only] : OS.modules.map(m => m.id));
    let count = only ? 15 : 30, type = 'mixed', timer = true, minutes = null;

    // modules
    const modBlock = h('div', { class: 'setup-block' });
    const grid = h('div', { class: 'check-grid' });
    const boxes = {};
    OS.modules.forEach(m => {
      const cb = h('input', { type: 'checkbox', checked: chosen.has(m.id) });
      cb.addEventListener('change', () => { if (cb.checked) chosen.add(m.id); else chosen.delete(m.id); update(); });
      boxes[m.id] = cb;
      grid.append(h('label', { class: 'check' }, cb, h('span', { text: `${m.icon} ${m.title}` }), h('span', { class: 'cnt', text: m.questions.length })));
    });
    const setAll = pred => { OS.modules.forEach(m => { const on = pred(m); boxes[m.id].checked = on; if (on) chosen.add(m.id); else chosen.delete(m.id); }); update(); };
    modBlock.append(h('div', { class: 'row', style: { justifyContent: 'space-between', marginBottom: '8px' } }, h('h3', { style: { margin: 0 }, text: 'Topics' }),
      h('div', { class: 'row' }, h('button', { class: 'btn sm ghost', type: 'button', text: 'All', onclick: () => setAll(() => true) }),
        h('button', { class: 'btn sm ghost', type: 'button', text: 'Theory only', onclick: () => setAll(m => m.group === 'theory') }),
        h('button', { class: 'btn sm ghost', type: 'button', text: 'Labs only', onclick: () => setAll(m => m.group === 'lab') }),
        h('button', { class: 'btn sm ghost', type: 'button', text: 'None', onclick: () => setAll(() => false) }))), grid);
    card.append(modBlock);

    const cntBlock = h('div', { class: 'setup-block' }, h('h3', { text: 'Number of questions' }), OS.seg([[10, '10'], [15, '15'], [30, '30'], [45, '45'], [60, '60'], [9999, 'All']], count, v => { count = v; update(); }));
    const typeBlock = h('div', { class: 'setup-block' }, h('h3', { text: 'Question type' }), OS.seg([['mixed', 'Mixed'], ['theory', 'Theory only'], ['code', 'Code only']], type, v => { type = v; update(); }));
    const tCb = h('input', { type: 'checkbox', checked: true });
    const tMin = h('input', { type: 'number', min: 1, style: { width: '80px' } });
    tCb.addEventListener('change', () => { timer = tCb.checked; update(); });
    tMin.addEventListener('input', () => { minutes = +tMin.value || null; });
    const timerBlock = h('div', { class: 'setup-block' }, h('h3', { text: 'Time' }),
      h('div', { class: 'viz-controls', style: { marginBottom: 0 } }, h('label', { class: 'learned' }, tCb, 'Timer'), h('label', {}, tMin, 'min'), h('span', { class: 'small muted', text: `default ${MIN_PER_Q} min per question; the exam is submitted automatically when time runs out` })));
    card.append(cntBlock, typeBlock, timerBlock);
    const summary = h('div', { class: 'viz-result' });
    const go = h('button', { class: 'btn primary lg', type: 'button', text: 'Start exam' });
    card.append(summary, h('div', {}, go));
    page.append(h('p', { class: 'small muted', style: { marginTop: '14px' }, html: 'Answers are not checked during the exam. Keys: <span class="kbd">1</span>–<span class="kbd">5</span> choose, <span class="kbd">←</span> <span class="kbd">→</span> move, <span class="kbd">F</span> flag a question, <span class="kbd">T</span> translation mode. The result is shown in % and on the Italian /30 scale (pass from 18).' }));
    go.onclick = () => {
      const mods = OS.modules.filter(m => chosen.has(m.id));
      const qs = pickQuestions(mods, count, type);
      if (!qs.length) return OS.toast('No questions for these settings');
      startExam(qs, { timer, minutes: minutes || qs.length * MIN_PER_Q, type, modules: [...chosen] });
    };
    function update() {
      const mods = OS.modules.filter(m => chosen.has(m.id));
      const filt = q => type === 'code' ? (q.type === 'code' || !!q.code) : type === 'theory' ? (q.type !== 'code' && !q.code) : true;
      const avail = mods.reduce((s, m) => s + m.questions.filter(filt).length, 0);
      const n = Math.min(count, avail);
      tMin.disabled = !timer;
      if (!minutes || document.activeElement !== tMin) tMin.value = Math.round(n * MIN_PER_Q) || '';
      minutes = null;
      summary.innerHTML = n ? `<b>${OS.pl(n, 'question')}</b> from ${OS.pl(mods.length, 'topic')} (${avail} available)` + (timer ? `, time <b>${Math.round(n * MIN_PER_Q)} min</b>.` : ', no timer.') : 'Select at least one topic with questions.';
      go.disabled = !n;
    }
    update();
  };

  /* ---------- run ---------- */
  function runView(app) {
    const A = OS.state.active;
    if (!A) return OS.go('#/exam');
    const qs = A.qids.map(OS.qById);
    if (qs.some(q => !q)) { OS.state.active = null; OS.save(); return OS.go('#/exam'); }
    const page = h('div', { class: 'page' });
    const layout = h('div', { class: 'exam-layout' });
    const mainCol = h('div');
    const side = h('div', { class: 'exam-side' });
    layout.append(mainCol, side);
    page.append(layout);
    app.append(page);

    const timerEl = h('div', { class: 'timer' });
    const answeredEl = h('div', { class: 'small muted' });
    const qgrid = h('div', { class: 'qgrid' });
    const submitBtn = h('button', { class: 'btn primary', type: 'button', text: 'Submit exam' });
    submitBtn.onclick = () => {
      const left = qs.length - Object.keys(A.answers).filter(k => hasAns(A.answers[k])).length;
      if (confirm(left ? `Unanswered: ${left}. Submit the exam?` : 'Submit the exam?')) submit();
    };
    side.append(h('div', { class: 'card' }, h('div', { class: 'small muted', text: A.deadline ? 'Time left' : 'Elapsed' }), timerEl, answeredEl),
      h('div', { class: 'card' }, qgrid), submitBtn);
    const hasAns = v => v != null && !(Array.isArray(v) && !v.length);
    const gridBtns = qs.map((q, i) => {
      const b = h('button', { type: 'button', text: String(i + 1) });
      b.onclick = () => { A.cur = i; OS.save(); show(); };
      qgrid.append(b);
      return b;
    });
    function paintGrid() {
      gridBtns.forEach((b, i) => {
        b.className = (hasAns(A.answers[i]) ? 'ans ' : '') + (A.flags[i] ? 'flag ' : '') + (i === A.cur ? 'cur' : '');
      });
      const n = Object.keys(A.answers).filter(k => hasAns(A.answers[k])).length;
      answeredEl.textContent = `Answered ${n} of ${qs.length}`;
    }
    let card;
    function show() {
      mainCol.innerHTML = '';
      const i = A.cur, q = qs[i];
      card = OS.renderQuestion(q, {
        mode: 'exam', index: i, total: qs.length, order: A.orders[i], selected: A.answers[i],
        onSelect: sel => { if (hasAns(sel)) A.answers[i] = sel; else delete A.answers[i]; OS.save(); paintGrid(); }
      });
      const flagBtn = h('button', { class: 'btn ghost', type: 'button', html: (A.flags[i] ? '★ Flagged' : '☆ Flag') + ' <span class="kbd">F</span>' });
      flagBtn.onclick = () => { toggleFlag(); };
      const prev = h('button', { class: 'btn', type: 'button', html: '← Back', disabled: i === 0 });
      prev.onclick = () => go(-1);
      const next = h('button', { class: 'btn primary', type: 'button', html: i + 1 < qs.length ? 'Next →' : 'Finish' });
      next.onclick = () => { if (i + 1 < qs.length) go(1); else submitBtn.click(); };
      card.navBar.append(prev, next, h('span', { class: 'spacer' }), flagBtn);
      mainCol.append(card);
      paintGrid();
    }
    function toggleFlag() { const i = A.cur; if (A.flags[i]) delete A.flags[i]; else A.flags[i] = 1; OS.save(); show(); }
    function go(d) { const n = A.cur + d; if (n >= 0 && n < qs.length) { A.cur = n; OS.save(); show(); window.scrollTo(0, 0); } }
    function tick() {
      if (A.deadline) {
        const left = A.deadline - Date.now();
        if (left <= 0) { timerEl.textContent = '0:00'; OS.toast('Time is up — the exam was submitted automatically'); return submit(); }
        const s = Math.ceil(left / 1000);
        timerEl.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
        timerEl.classList.toggle('low', s <= 60);
      } else {
        const s = Math.floor((Date.now() - A.started) / 1000);
        timerEl.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      }
    }
    const iv = setInterval(tick, 1000);
    const onKey = e => {
      if (/input|textarea|select/i.test(document.activeElement.tagName)) return;
      if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'f' || e.key === 'F') toggleFlag();
      else if (card) card.handleKey(e);
    };
    const onUnload = e => { e.preventDefault(); e.returnValue = ''; };
    document.addEventListener('keydown', onKey);
    window.addEventListener('beforeunload', onUnload);
    OS.onLeave = () => { clearInterval(iv); document.removeEventListener('keydown', onKey); window.removeEventListener('beforeunload', onUnload); };
    function submit() {
      clearInterval(iv);
      const items = qs.map((q, i) => {
        const sel = hasAns(A.answers[i]) ? A.answers[i] : null;
        const ok = OS.isCorrect(q, sel);
        OS.recordAnswer(q, ok);
        return { qid: q.id, order: A.orders[i], sel, ok };
      });
      const right = items.filter(x => x.ok).length;
      const score = right / items.length;
      const attempt = {
        id: A.id, date: Date.now(), duration: Date.now() - A.started, settings: A.settings,
        items, right, total: items.length, score, grade: Math.round(score * 30)
      };
      OS.state.exams.push(attempt);
      if (OS.state.exams.length > 50) OS.state.exams.shift();
      OS.state.active = null;
      OS.save();
      OS.go('#/exam/result/' + attempt.id);
    }
    tick();
    show();
  }

  /* ---------- result ---------- */
  function fmtDur(ms) { const s = Math.round(ms / 1000); return `${Math.floor(s / 60)} min ${s % 60} s`; }
  function resultView(app, id) {
    const at = OS.state.exams.find(e => e.id === id);
    const page = h('div', { class: 'page narrow' });
    app.append(page);
    if (!at) { page.append(h('div', { class: 'card empty', text: 'Attempt not found.' })); return; }
    const pass = at.grade >= 18;
    const R = 62, C = 2 * Math.PI * R;
    const ring = h('div', { class: 'ring ' + (pass ? 'pass' : 'fail'), html:
      `<svg viewBox="0 0 140 140"><circle class="bg" cx="70" cy="70" r="${R}" fill="none" stroke-width="12"/><circle class="fg" cx="70" cy="70" r="${R}" fill="none" stroke-width="12" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - at.score)}"/></svg>` +
      `<div class="ring-txt"><div><b>${at.grade}</b><small>out of 30</small></div></div>` });
    page.append(h('div', { class: 'crumbs' }, h('a', { href: '#/history', text: '← History' })));
    page.append(h('div', { class: 'card pad-lg' }, h('div', { class: 'score-hero' }, ring,
      h('div', {},
        h('h1', { style: { marginBottom: '4px' }, text: pass ? 'Passed' : 'Not passed' }),
        h('div', { class: 'kv', style: { marginBottom: '12px' } },
          h('span', { html: `Correct: <b>${at.right}/${at.total}</b>` }), h('span', { html: `Score: <b>${OS.pct(at.score)}</b>` }),
          h('span', { html: `Time: <b>${fmtDur(at.duration)}</b>` }), h('span', { html: `Date: <b>${new Date(at.date).toLocaleString('en-GB')}</b>` })),
        h('div', { class: 'row' },
          at.items.some(x => !x.ok) ? h('button', { class: 'btn primary', type: 'button', text: 'Retake mistakes', onclick: () => startExam(at.items.filter(x => !x.ok).map(x => OS.qById(x.qid)).filter(Boolean), { timer: true, source: 'retry' }) }) : null,
          h('a', { class: 'btn', href: '#/exam', text: 'New exam' }))))));
    // per module
    const per = {};
    at.items.forEach(x => { const q = OS.qById(x.qid); if (!q) return; const p = per[q.module] = per[q.module] || [0, 0]; p[1]++; if (x.ok) p[0]++; });
    const bars = h('div', { class: 'bars' });
    Object.entries(per).sort((a, b) => a[1][0] / a[1][1] - b[1][0] / b[1][1]).forEach(([mid, [ok, n]]) => {
      const m = OS.byId[mid];
      bars.append(h('div', { class: 'bar-row' }, h('a', { href: '#/m/' + mid, text: `${m.icon} ${m.title}` }), h('div', { class: 'bar' + (ok / n >= 0.6 ? ' ok' : '') }, h('i', { style: { width: (ok / n) * 100 + '%', background: ok / n < 0.6 ? 'var(--bad)' : '' } })), h('span', { class: 'v', text: `${ok}/${n}` })));
    });
    page.append(h('div', { class: 'card', style: { marginTop: '14px' } }, h('h3', { text: 'By topic (weakest first)' }), bars));
    // review
    let filter = 'wrong';
    const list = h('div');
    page.append(h('div', { class: 'row', style: { margin: '22px 0 10px', justifyContent: 'space-between' } }, h('h2', { style: { margin: 0 }, text: 'Review' }),
      OS.seg([['wrong', 'Mistakes'], ['all', 'All'], ['right', 'Correct']], filter, v => { filter = v; drawList(); })), list);
    function drawList() {
      list.innerHTML = '';
      at.items.forEach((x, i) => {
        if (filter === 'wrong' && x.ok) return;
        if (filter === 'right' && !x.ok) return;
        const q = OS.qById(x.qid);
        if (!q) return;
        const c = OS.renderQuestion(q, { mode: 'review', index: i, total: at.total, order: x.order, selected: x.sel });
        c.classList.add('review-item', x.ok ? 'r-ok' : 'r-bad');
        list.append(c);
      });
      if (!list.children.length) list.append(h('div', { class: 'card empty', text: filter === 'wrong' ? 'No mistakes 🎉' : 'Empty.' }));
    }
    drawList();
  }

  /* ---------- history ---------- */
  OS.views.history = function (app) {
    const page = h('div', { class: 'page narrow' });
    app.append(page);
    page.append(h('h1', { text: 'Exam history' }));
    const ex = OS.state.exams.slice().reverse();
    if (!ex.length) { page.append(h('div', { class: 'card empty' }, h('div', { class: 'big', text: '📝' }), h('div', { text: 'No attempts yet.' }), h('div', { style: { marginTop: '12px' } }, h('a', { class: 'btn primary', href: '#/exam', text: 'Take an exam' })))); return; }
    const best = Math.max(...ex.map(e => e.grade));
    const avg = ex.reduce((s, e) => s + e.score, 0) / ex.length;
    page.append(h('div', { class: 'stats', style: { gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '16px' } },
      ...[['Attempts', ex.length], ['Best result', best + '/30'], ['Average %', OS.pct(avg)]].map(([l, v]) => h('div', { class: 'stat' }, h('div', { class: 'stat-label', text: l }), h('div', { class: 'stat-value', text: v })))));
    const t = h('table', { class: 'hist-table' });
    t.append(h('tr', {}, ...['Date', 'Questions', 'Correct', 'Grade', 'Time', ''].map(x => h('th', { text: x }))));
    ex.forEach(e => t.append(h('tr', {},
      h('td', { text: new Date(e.date).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) }), h('td', { text: e.total }),
      h('td', { text: OS.pct(e.score) }), h('td', { html: `<b style="color:${e.grade >= 18 ? 'var(--ok)' : 'var(--bad)'}">${e.grade}/30</b>` }),
      h('td', { text: fmtDur(e.duration) }), h('td', {}, h('a', { href: '#/exam/result/' + e.id, text: 'review →' })))));
    page.append(h('div', { class: 'card', style: { overflowX: 'auto' } }, t));
  };
})();
