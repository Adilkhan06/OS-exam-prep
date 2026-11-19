/* CPU scheduling simulator + MLFQ */
(function () {
  'use strict';
  const { h, fmt } = OS;

  const ALGOS = [
    ['FCFS', 'FCFS'], ['SJF', 'SJF'], ['SRTF', 'SRTF'], ['RR', 'RR'],
    ['PRIO', 'Priority'], ['PRIO_P', 'Priority (preempt.)'], ['PRIO_RR', 'Priority + RR']
  ];
  const usesPrio = a => a.startsWith('PRIO');
  const usesQ = a => a === 'RR' || a === 'PRIO_RR';

  function cmp(keys) {
    return (a, b) => { for (const k of keys) { const d = k(a) - k(b); if (d) return d; } return 0; };
  }

  OS.schedule = function (procs, algo, quantum) {
    const P = procs.map((p, i) => ({ name: p.name, arrival: +p.arrival || 0, burst: Math.max(0, +p.burst || 0), priority: +p.priority || 0, idx: i, rem: Math.max(0, +p.burst || 0), start: null, finish: null }));
    const q = Math.max(1, +quantum || 1);
    const segs = [];
    let t = 0;
    const alive = () => P.filter(p => p.rem > 0);
    const arrivedAt = time => P.filter(p => p.rem > 0 && p.arrival <= time);
    const nextArr = time => { const f = P.filter(p => p.rem > 0 && p.arrival > time).map(p => p.arrival); return f.length ? Math.min(...f) : Infinity; };
    const run = (p, from, to) => {
      if (to <= from) return;
      if (p.start == null) p.start = from;
      segs.push({ p, from, to });
      p.rem -= to - from;
      if (p.rem <= 1e-9) { p.rem = 0; p.finish = to; }
    };
    const idleTo = to => { if (to > t) { segs.push({ p: null, from: t, to }); t = to; } };
    let guard = 0;

    if (algo === 'FCFS' || algo === 'SJF' || algo === 'PRIO') {
      const key = algo === 'FCFS' ? cmp([p => p.arrival, p => p.idx])
        : algo === 'SJF' ? cmp([p => p.burst, p => p.arrival, p => p.idx])
          : cmp([p => p.priority, p => p.arrival, p => p.idx]);
      while (alive().length && guard++ < 1000) {
        const R = arrivedAt(t);
        if (!R.length) { idleTo(nextArr(t)); continue; }
        const p = R.sort(key)[0];
        run(p, t, t + p.rem); t = p.finish;
      }
    } else if (algo === 'SRTF' || algo === 'PRIO_P') {
      const key = algo === 'SRTF' ? cmp([p => p.rem, p => p.arrival, p => p.idx]) : cmp([p => p.priority, p => p.arrival, p => p.idx]);
      let cur = null;
      while (alive().length && guard++ < 5000) {
        const R = arrivedAt(t);
        if (!R.length) { cur = null; idleTo(nextArr(t)); continue; }
        let best = R.sort(key)[0];
        if (cur && cur.rem > 0 && key(cur, best) <= 0) best = cur;
        cur = best;
        const end = Math.min(t + cur.rem, nextArr(t));
        run(cur, t, end); t = end;
      }
    } else if (algo === 'RR') {
      const queue = [];
      const inQ = new Set();
      const admit = () => P.filter(p => p.rem > 0 && p.arrival <= t && !inQ.has(p)).sort(cmp([p => p.arrival, p => p.idx])).forEach(p => { queue.push(p); inQ.add(p); });
      admit();
      while (alive().length && guard++ < 5000) {
        if (!queue.length) { idleTo(nextArr(t)); admit(); continue; }
        const p = queue.shift();
        const slice = Math.min(q, p.rem);
        run(p, t, t + slice); t += slice;
        admit();
        if (p.rem > 0) queue.push(p);
      }
    } else if (algo === 'PRIO_RR') {
      const queues = {};
      const inQ = new Set();
      const admit = () => P.filter(p => p.rem > 0 && p.arrival <= t && !inQ.has(p)).sort(cmp([p => p.arrival, p => p.idx])).forEach(p => {
        (queues[p.priority] = queues[p.priority] || []).push(p); inQ.add(p);
      });
      const top = () => { const ks = Object.keys(queues).map(Number).filter(k => queues[k].length).sort((a, b) => a - b); return ks.length ? queues[ks[0]] : null; };
      admit();
      while (alive().length && guard++ < 5000) {
        const Q = top();
        if (!Q) { idleTo(nextArr(t)); admit(); continue; }
        const p = Q.shift();
        const hi = P.filter(x => x.rem > 0 && x.arrival > t && x.priority < p.priority).map(x => x.arrival);
        const limit = hi.length ? Math.min(...hi) - t : Infinity;
        const slice = Math.min(q, p.rem, limit);
        run(p, t, t + slice); t += slice;
        admit();
        if (p.rem > 0) queues[p.priority].push(p);
      }
    }
    // merge consecutive segments of the same process (RR keeps quantum boundaries, as on the slides)
    if (algo !== 'RR') for (let i = segs.length - 1; i > 0; i--) if (segs[i].p === segs[i - 1].p && segs[i].from === segs[i - 1].to) { segs[i - 1].to = segs[i].to; segs.splice(i, 1); }
    let switches = 0;
    const busy = segs.filter(s => s.p);
    for (let i = 1; i < busy.length; i++) if (busy[i].p !== busy[i - 1].p) switches++;
    const rows = P.map(p => ({
      name: p.name, arrival: p.arrival, burst: p.burst, priority: p.priority, idx: p.idx,
      completion: p.finish, turnaround: p.finish - p.arrival, waiting: p.finish - p.arrival - p.burst, response: p.start - p.arrival
    }));
    return { segs, rows, switches, end: segs.length ? segs[segs.length - 1].to : 0 };
  };

  OS.viz.scheduler = function (el, p) {
    const preset = JSON.parse(JSON.stringify(p.processes || [{ name: 'P1', arrival: 0, burst: 5 }]));
    let procs = JSON.parse(JSON.stringify(preset));
    let algo = p.algo || 'FCFS';
    let quantum = p.quantum || 4;

    const ctr = h('div', { class: 'viz-controls' });
    const qInput = h('input', { type: 'number', min: 1, value: quantum });
    const qLabel = h('label', {}, 'Quantum q', qInput);
    qInput.addEventListener('input', () => { quantum = Math.max(1, +qInput.value || 1); compute(); });
    if (!p.lockAlgo) ctr.append(OS.seg(ALGOS, algo, v => { algo = v; drawTable(); compute(); }));
    else ctr.append(h('span', { class: 'tag acc', text: (ALGOS.find(a => a[0] === algo) || [0, algo])[1] }));
    ctr.append(qLabel);

    const tblWrap = h('div', { class: 'tbl-wrap' });
    const addBtn = h('button', { class: 'btn sm', type: 'button', text: '+ process' });
    const resetBtn = h('button', { class: 'btn sm ghost', type: 'button', text: 'Reset example' });
    addBtn.onclick = () => {
      if (procs.length >= 8) return;
      procs.push({ name: 'P' + (procs.length + 1), arrival: 0, burst: 3, priority: 1 });
      drawTable(); compute();
    };
    resetBtn.onclick = () => { procs = JSON.parse(JSON.stringify(preset)); quantum = p.quantum || 4; qInput.value = quantum; drawTable(); compute(); };
    const gantt = h('div', { style: { margin: '14px 0 6px' } });
    const res = h('div', { class: 'tbl-wrap' });
    const formula = h('div', { class: 'formula', style: { marginBottom: 0 } });
    el.append(ctr, tblWrap, h('div', { class: 'row', style: { margin: '8px 0 4px' } }, addBtn, resetBtn), gantt, res, formula);

    function drawTable() {
      qLabel.classList.toggle('hidden', !usesQ(algo));
      const pr = usesPrio(algo);
      const t = h('table', { class: 'vt' });
      t.append(h('tr', {}, h('th', { text: 'Process' }), h('th', { text: 'Arrival' }), h('th', { text: 'Burst' }), pr ? h('th', { text: 'Priority' }) : null, h('th', { text: '' })));
      procs.forEach((pc, i) => {
        const inp = (k, cls) => {
          const x = h('input', { type: k === 'name' ? 'text' : 'number', min: k === 'burst' ? 1 : 0, value: pc[k] != null ? pc[k] : (k === 'priority' ? 1 : 0), class: cls || '' });
          x.addEventListener('input', () => { pc[k] = k === 'name' ? x.value : +x.value; compute(); });
          return h('td', {}, x);
        };
        const del = h('button', { class: 'btn sm ghost', type: 'button', text: '×', title: 'Remove' });
        del.onclick = () => { if (procs.length > 1) { procs.splice(i, 1); drawTable(); compute(); } };
        t.append(h('tr', {}, inp('name', 'name'), inp('arrival'), inp('burst'), pr ? inp('priority') : null, h('td', {}, del)));
      });
      tblWrap.innerHTML = '';
      tblWrap.append(t);
    }
    function compute() {
      const valid = procs.filter(x => +x.burst > 0);
      const r = OS.schedule(valid, algo, quantum);
      gantt.innerHTML = '';
      const toneOf = i => 'c' + ((i % 6) + 1);
      OS.renderTimeline(gantt, {
        max: r.end || 1,
        rows: [{ label: 'CPU', segs: r.segs.map(s => ({ from: s.from, to: s.to, label: s.p ? s.p.name : 'idle', tone: s.p ? toneOf(s.p.idx) : 'muted' })) }]
      });
      const pr = usesPrio(algo);
      const t = h('table', { class: 'vt' });
      t.append(h('tr', {}, ...['Process', 'Arrival', 'Burst'].map(x => h('th', { text: x })), pr ? h('th', { text: 'Priority' }) : null,
        ...['Completion', 'Turnaround', 'Waiting', 'Response'].map(x => h('th', { text: x }))));
      r.rows.forEach(x => t.append(h('tr', {}, h('td', { text: x.name }), h('td', { text: x.arrival }), h('td', { text: x.burst }), pr ? h('td', { text: x.priority }) : null,
        h('td', { text: x.completion }), h('td', { text: x.turnaround }), h('td', { html: '<b>' + x.waiting + '</b>' }), h('td', { text: x.response }))));
      const n = r.rows.length || 1;
      const avg = k => fmt(r.rows.reduce((s, x) => s + x[k], 0) / n);
      t.append(h('tr', {}, h('td', { html: '<b>avg</b>', colspan: pr ? 5 : 4, class: 'l' }), h('td', { html: '<b>' + avg('turnaround') + '</b>' }), h('td', { html: '<b>' + avg('waiting') + '</b>' }), h('td', { html: '<b>' + avg('response') + '</b>' })));
      res.innerHTML = '';
      res.append(t);
      formula.innerHTML = `Avg waiting = (${r.rows.map(x => x.waiting).join(' + ')}) / ${n} = <b>${avg('waiting')}</b> &nbsp;·&nbsp; Avg turnaround = <b>${avg('turnaround')}</b> &nbsp;·&nbsp; context switches: <b>${r.switches}</b>`;
    }
    drawTable();
    compute();
  };

  /* ---------- MLFQ ---------- */
  OS.viz.mlfq = function (el, p) {
    const queues = p.queues || [{ label: 'Q0', algo: 'RR q=8' }, { label: 'Q1', algo: 'RR q=16' }, { label: 'Q2', algo: 'FCFS' }];
    let burst = p.burst || 30;
    const qOf = a => { const m = /q\s*=\s*(\d+)/i.exec(a || ''); return m ? +m[1] : Infinity; };
    const input = h('input', { type: 'range', min: 1, max: 60, value: burst });
    const val = h('b', { class: 'mono', text: burst + ' ms' });
    const ctr = h('div', { class: 'viz-controls' }, h('label', {}, 'CPU burst of the process', input, val));
    const out = h('div');
    const sum = h('div', { class: 'viz-result' });
    el.append(ctr, out, sum);
    input.addEventListener('input', () => { burst = +input.value; val.textContent = burst + ' ms'; draw(); });
    function draw() {
      let rem = burst, t = 0;
      const parts = [];
      const rows = queues.map((q, i) => {
        const used = rem > 0 ? Math.min(qOf(q.algo), rem) : 0;
        const segs = used ? [{ from: t, to: t + used, label: used + ' ms', tone: ['acc', 'warn', 'bad', 'c4', 'c5'][i % 5] }] : [];
        if (used) parts.push(`${used} ms in ${q.label}`);
        t += used; rem -= used;
        return { label: `${q.label} <span class="muted small">${q.algo}</span>`, segs };
      });
      out.innerHTML = '';
      OS.renderTimeline(out, { max: Math.max(t, 1), rows });
      const lastIdx = rows.reduce((a, r, i) => (r.segs.length ? i : a), 0);
      sum.innerHTML = parts.join(' → ') + `. The process finishes in <b>${queues[lastIdx].label}</b>` + (lastIdx > 0 ? `, after being demoted ${lastIdx} time${lastIdx > 1 ? 's' : ''}.` : ' — it was never demoted.');
    }
    draw();
  };
})();
