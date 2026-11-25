/* Oral exam prep: shortest answers to the most likely oral questions */
(function () {
  'use strict';
  const { h, esc } = OS;
  OS.oral = OS.oral || { groups: [], tips: [] };
  OS.addOral = (module, items) => OS.oral.groups.push({ module, items });
  const STARS = { 3: ['★★★', 'Very likely'], 2: ['★★', 'Likely'], 1: ['★', 'Possible'] };

  OS.views.oral = function (app) {
    const prefs = OS.state.oralPrefs = OS.state.oralPrefs || { min: 1, hide: false, sort: 'module', mod: '' };
    const ready = OS.state.oral = OS.state.oral || {};
    const page = h('div', { class: 'page narrow' });
    app.append(page);
    // collect items
    const all = [];
    OS.oral.groups.forEach(g => {
      const m = OS.byId[g.module];
      if (!m) return;
      g.items.forEach((it, i) => all.push(Object.assign({ id: g.module + '-' + (i + 1), m }, it)));
    });
    page.append(h('h1', { text: 'Oral exam prep' }));
    page.append(h('p', { class: 'muted tr-zone', html: `The shortest answers that still sound complete, for the questions most likely to be asked at the oral. <b>${all.length}</b> questions ranked ★★★ very likely · ★★ likely · ★ possible. Read the answer aloud in your own words, then open the theory link if you need more.` }));

    if (OS.oral.analysis) {
      const an = h('details', { class: 'card oral-tips', open: !prefs.closedAnalysis });
      an.append(h('summary', { html: '<b>What is most likely to be asked</b> — topic ranking and why' }));
      an.append(h('div', { class: 'content tr-zone', html: OS.oral.analysis }));
      an.addEventListener('toggle', () => { prefs.closedAnalysis = !an.open; OS.save(); });
      page.append(an);
    }
    // strategy card
    const tips = h('details', { class: 'card oral-tips' });
    tips.append(h('summary', { html: '<b>How to answer at the oral</b> — a 4-step recipe that works for almost every question' }));
    tips.append(h('div', { class: 'content tr-zone', html: `
<ol class="steps">
  <li><b>Define</b> it in one sentence using the slide's words (the professor wants the textbook term).</li>
  <li><b>Why it exists</b>: name the problem it solves ("without it, a process could…").</li>
  <li><b>How it works</b>: 2–3 steps, or draw it (state diagram, Gantt chart, page-table translation, RAG). Drawing buys you time and shows understanding.</li>
  <li><b>Trade-off / example</b>: one advantage, one disadvantage, one example from the slides (numbers if there are any).</li>
</ol>
<div class="callout note">If you don't know an answer, connect it to a neighbouring topic you do know — every topic in this course is linked to the previous one (see the course map on the home page). If a word is unclear, turn on translation mode (<span class="kbd">T</span>) and click it.</div>` }));
    page.append(tips);

    // controls
    const ctr = h('div', { class: 'viz-controls oral-ctr' });
    ctr.append(OS.seg([[1, 'All'], [2, '★★ and up'], [3, '★★★ only']], prefs.min, v => { prefs.min = v; OS.save(); draw(); }));
    ctr.append(OS.seg([['module', 'By topic'], ['prob', 'Most likely first']], prefs.sort, v => { prefs.sort = v; OS.save(); draw(); }));
    const hideCb = h('input', { type: 'checkbox', checked: prefs.hide });
    hideCb.addEventListener('change', () => { prefs.hide = hideCb.checked; OS.save(); draw(); });
    ctr.append(h('label', { class: 'learned' }, hideCb, 'Self-test: hide answers'));
    const modSel = h('select', {}, h('option', { value: '', text: 'All topics' }), ...OS.modules.filter(m => OS.oral.groups.some(g => g.module === m.id)).map(m => h('option', { value: m.id, text: `${m.num}. ${m.title}` })));
    modSel.value = prefs.mod || '';
    modSel.addEventListener('change', () => { prefs.mod = modSel.value; OS.save(); draw(); });
    ctr.append(modSel);
    const prog = h('div', { class: 'oral-prog' });
    page.append(ctr, prog);
    const list = h('div');
    page.append(list);

    function card(it, showModule) {
      const [st, stLabel] = STARS[it.stars || 1];
      const c = h('div', { class: 'oral-item' + (ready[it.id] ? ' is-ready' : '') });
      c.append(h('div', { class: 'oral-meta' }, h('span', { class: 'oral-stars s' + (it.stars || 1), title: stLabel, text: st + ' ' + stLabel }), showModule ? h('span', { class: 'tag', text: `${it.m.icon} ${it.m.title}` }) : null));
      c.append(h('div', { class: 'oral-q tr-zone', html: it.q }));
      const ans = h('div', { class: 'oral-a' });
      ans.append(h('div', { class: 'tr-zone', html: it.a }));
      if (it.more && it.more.length) ans.append(h('ul', { class: 'oral-more tr-zone' }, ...it.more.map(x => h('li', { html: x }))));
      if (prefs.hide) {
        ans.classList.add('hidden');
        const show = h('button', { class: 'btn sm', type: 'button', text: 'Show answer' });
        show.onclick = () => { ans.classList.remove('hidden'); show.remove(); };
        c.append(show);
      }
      c.append(ans);
      const cb = h('input', { type: 'checkbox', checked: !!ready[it.id] });
      cb.addEventListener('change', () => { if (cb.checked) ready[it.id] = 1; else delete ready[it.id]; OS.save(); c.classList.toggle('is-ready', cb.checked); updateProg(); });
      const sec = it.sec && it.m.sections.find(s => s.id === it.sec);
      c.append(h('div', { class: 'oral-foot' }, h('label', { class: 'learned' }, cb, 'I can say this'), h('span', { class: 'spacer' }),
        h('a', { class: 'small', href: `#/m/${it.m.id}${sec ? '/' + sec.id : ''}`, text: '→ theory' + (sec ? ': ' + sec.h : '') })));
      return c;
    }
    function filtered() { return all.filter(it => (it.stars || 1) >= prefs.min && (!prefs.mod || it.m.id === prefs.mod)); }
    function updateProg() {
      const f = filtered();
      const r = f.filter(it => ready[it.id]).length;
      prog.innerHTML = '';
      prog.append(h('div', { class: 'small muted', text: `Ready: ${r} of ${f.length} shown` }), h('div', { class: 'bar ok' }, h('i', { style: { width: (f.length ? (r / f.length) * 100 : 0) + '%' } })));
    }
    function draw() {
      list.innerHTML = '';
      const f = filtered();
      if (prefs.sort === 'prob') {
        [3, 2, 1].forEach(s => {
          const part = f.filter(it => (it.stars || 1) === s);
          if (!part.length) return;
          list.append(h('h2', { class: 'oral-group', text: `${STARS[s][0]} ${STARS[s][1]} (${part.length})` }));
          part.forEach(it => list.append(card(it, true)));
        });
      } else {
        OS.modules.forEach(m => {
          const part = f.filter(it => it.m === m).sort((a, b) => (b.stars || 1) - (a.stars || 1));
          if (!part.length) return;
          list.append(h('h2', { class: 'oral-group' }, h('a', { href: '#/m/' + m.id, text: `${m.icon} ${m.num}. ${m.title}` }), h('span', { class: 'small muted', text: ` · ${part.length}` })));
          part.forEach(it => list.append(card(it, false)));
        });
      }
      if (!f.length) list.append(h('div', { class: 'card empty', text: 'Nothing matches the filters.' }));
      updateProg();
    }
    draw();
  };
})();
