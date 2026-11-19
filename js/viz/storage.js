/* Storage / IO / Linux: diskSched, hddCalc, raid, chmod, ioModes */
(function () {
  'use strict';
  const { h, svgEl, fmt } = OS;

  /* ---------- disk scheduling ---------- */
  const DALGOS = ['FCFS', 'SSTF', 'SCAN', 'LOOK', 'C-SCAN', 'C-LOOK'];
  OS.diskPath = function (queue, head, max, algo, dir) {
    const q = queue.slice();
    const up = dir === 'up';
    const lower = q.filter(x => x < head).sort((a, b) => b - a);   // descending
    const upper = q.filter(x => x >= head).sort((a, b) => a - b);  // ascending
    let path = [head], jumps = [];
    if (algo === 'FCFS') path = path.concat(q);
    else if (algo === 'SSTF') {
      let cur = head; const rest = q.slice();
      while (rest.length) {
        let bi = 0;
        rest.forEach((x, i) => { const d = Math.abs(x - cur), bd = Math.abs(rest[bi] - cur); if (d < bd || (d === bd && x < rest[bi])) bi = i; });
        cur = rest.splice(bi, 1)[0]; path.push(cur);
      }
    } else if (algo === 'SCAN' || algo === 'LOOK') {
      const first = up ? upper : lower, second = up ? lower : upper;
      path = path.concat(first);
      if (second.length) {
        if (algo === 'SCAN') path.push(up ? max : 0);
        path = path.concat(second);
      }
    } else if (algo === 'C-SCAN' || algo === 'C-LOOK') {
      const first = up ? upper : lower;
      const second = up ? lower.slice().reverse() : upper.slice().reverse(); // continue in the same direction after wrap
      path = path.concat(first);
      if (second.length) {
        if (algo === 'C-SCAN') { path.push(up ? max : 0); jumps.push(path.length - 1); path.push(up ? 0 : max); }
        else jumps.push(path.length - 1);
        path = path.concat(second);
      }
    }
    // dedupe consecutive equal points
    const P = [], J = [];
    path.forEach((x, i) => { if (P.length && P[P.length - 1] === x) { if (jumps.includes(i)) J.push(P.length - 1); return; } if (jumps.includes(i)) J.push(P.length); P.push(x); });
    let total = 0, noJump = 0;
    for (let i = 1; i < P.length; i++) { const d = Math.abs(P[i] - P[i - 1]); total += d; if (!J.includes(i - 1)) noJump += d; }
    return { path: P, jumps: J, total, noJump };
  };

  OS.viz.diskSched = function (el, p) {
    let queue = (p.queue || [98, 183, 37, 122, 14, 124, 65, 67]).slice();
    let head = p.head != null ? p.head : 53, max = p.max || 199, algo = p.algo || 'FCFS', dir = p.dir || 'down';
    const qIn = h('input', { type: 'text', value: queue.join(', '), style: { width: '240px' } });
    const hIn = h('input', { type: 'number', min: 0, value: head });
    const mIn = h('input', { type: 'number', min: 1, value: max });
    const dirSeg = OS.seg([['down', '← toward 0'], ['up', 'toward max →']], dir, v => { dir = v; draw(); });
    const ctr1 = h('div', { class: 'viz-controls' }, OS.seg(DALGOS.map(a => [a, a]), algo, v => { algo = v; draw(); }));
    const ctr2 = h('div', { class: 'viz-controls' }, h('label', {}, 'Queue', qIn), h('label', {}, 'Head', hIn), h('label', {}, 'Max', mIn), h('label', {}, 'Direction', dirSeg));
    const chart = h('div'), info = h('div'), cmpBox = h('div', { class: 'tbl-wrap', style: { marginTop: '10px' } });
    el.append(ctr1, ctr2, chart, info, cmpBox);
    const parse = () => {
      queue = qIn.value.split(/[\s,;]+/).map(Number).filter(x => Number.isFinite(x) && x >= 0);
      head = Math.max(0, +hIn.value || 0); max = Math.max(1, +mIn.value || 199);
      queue = queue.map(x => Math.min(x, max)); head = Math.min(head, max);
      draw();
    };
    [qIn, hIn, mIn].forEach(x => x.addEventListener('change', parse));
    function draw() {
      const r = OS.diskPath(queue, head, max, algo, dir);
      const W = 640, top = 34, rowH = 26, H = top + (r.path.length - 1) * rowH + 24, L = 16, R = 16;
      const X = c => L + (c / max) * (W - L - R);
      const svg = svgEl('svg', { class: 'd', viewBox: `0 0 ${W} ${H}` });
      svg.style.maxWidth = '720px';
      svg.append(svgEl('line', { x1: X(0), x2: X(max), y1: top - 8, y2: top - 8, class: 'axis' }));
      const ticks = [...new Set([0, max, head, ...queue])].sort((a, b) => a - b);
      let lastX = -100;
      ticks.forEach(c => {
        svg.append(svgEl('line', { x1: X(c), x2: X(c), y1: top - 12, y2: H - 8, class: 'grid' }));
        if (X(c) - lastX > 22 || c === max) { svg.append(svgEl('text', { x: X(c), y: top - 16, 'text-anchor': 'middle', class: 'sm mono' }, c)); lastX = X(c); }
      });
      for (let i = 1; i < r.path.length; i++) {
        const jump = r.jumps.includes(i - 1);
        svg.append(svgEl('path', { d: `M${X(r.path[i - 1])},${top + (i - 1) * rowH} L${X(r.path[i])},${top + i * rowH}`, class: 'e-line ' + (jump ? 'dashed tone-muted' : 'tone-acc') }));
      }
      r.path.forEach((c, i) => {
        const isEnd = (c === 0 || c === max) && !queue.includes(c) && i > 0;
        svg.append(svgEl('circle', { cx: X(c), cy: top + i * rowH, r: i === 0 ? 6 : 4.5, class: 'n-shape ' + (i === 0 ? 'tone-warn' : isEnd ? 'tone-muted' : 'tone-acc') }));
      });
      chart.innerHTML = ''; chart.append(svg);
      const moves = [];
      for (let i = 1; i < r.path.length; i++) moves.push(Math.abs(r.path[i] - r.path[i - 1]));
      info.innerHTML = '';
      info.append(h('div', { class: 'chips', style: { margin: '8px 0' } }, ...r.path.map((c, i) => h('span', { class: 'chip ' + (i === 0 ? 'tone-warn' : r.jumps.includes(i - 1) ? 'tone-muted' : ''), text: (r.jumps.includes(i - 1) ? '↷ ' : '') + c }))));
      info.append(h('div', { class: 'formula', html: `Total head movement = ${moves.join(' + ')} = <b>${r.total}</b>` + (r.jumps.length && r.total !== r.noJump ? ` &nbsp;(without the return jump: <b>${r.noJump}</b>)` : '') }));
      const t = h('table', { class: 'vt' });
      t.append(h('tr', {}, h('th', { class: 'l', text: 'Algorithm' }), ...DALGOS.map(a => h('th', { text: a }))));
      t.append(h('tr', {}, h('td', { class: 'l', text: 'Total' }), ...DALGOS.map(a => { const x = OS.diskPath(queue, head, max, a, dir); return h('td', { html: (a === algo ? '<b>' : '') + x.total + (x.jumps.length && x.total !== x.noJump ? ` <span class="muted">(${x.noJump})</span>` : '') + (a === algo ? '</b>' : '') }); })));
      cmpBox.innerHTML = ''; cmpBox.append(t);
    }
    draw();
  };

  /* ---------- HDD access time ---------- */
  OS.viz.hddCalc = function (el, p) {
    const v = { rpm: p.rpm || 7200, seek: p.seek != null ? p.seek : 5, rateGbps: p.rateGbps || 1, kb: p.kb || 4, overheadMs: p.overheadMs != null ? p.overheadMs : 0.1 };
    const fields = [['rpm', 'RPM'], ['seek', 'Avg seek, ms'], ['rateGbps', 'Transfer, Gb/s'], ['kb', 'Block, KB'], ['overheadMs', 'Controller overhead, ms']];
    const ctr = h('div', { class: 'viz-controls' });
    fields.forEach(([k, label]) => {
      const inp = h('input', { type: 'number', min: 0, step: 'any', value: v[k] });
      inp.addEventListener('input', () => { v[k] = Math.max(0, +inp.value || 0); draw(); });
      ctr.append(h('label', {}, label, inp));
    });
    const out = h('div');
    el.append(ctr, out);
    function draw() {
      const lat = v.rpm ? (0.5 * 60000) / v.rpm : 0;
      const tr = v.rateGbps ? ((v.kb * 8) / (v.rateGbps * 1024 * 1024)) * 1000 : 0;
      const total = v.seek + lat + v.overheadMs + tr;
      out.innerHTML = '';
      out.append(h('div', { class: 'formula', html:
        `Average latency = ½ · 60 000 / ${v.rpm} = <b>${fmt(lat)} ms</b><br>` +
        `Transfer time = ${v.kb} KB · 8 / (${v.rateGbps} Gb/s · 1024²) = <b>${fmt(tr, 3)} ms</b><br>` +
        `Access time = seek + latency + overhead + transfer = ${fmt(v.seek)} + ${fmt(lat)} + ${fmt(v.overheadMs)} + ${fmt(tr, 3)} = <b>${fmt(total, 2)} ms</b>` }));
      const parts = [['seek', v.seek, 'acc'], ['latency', lat, 'bad'], ['overhead', v.overheadMs, 'ok'], ['transfer', tr, 'c4']];
      OS.renderTimeline(out, { max: total || 1, ticks: [0, total], rows: [{ label: 'I/O', segs: (() => { let t = 0; return parts.filter(x => x[1] > 0).map(([n, d, tone]) => { const s = { from: t, to: t + d, label: d / (total || 1) > 0.12 ? n : '', tone }; t += d; return s; }); })() }] });
      out.append(h('div', { class: 'legend' }, ...parts.map(([n, d, tone]) => h('span', {}, h('i', { class: 'tone-' + tone }), `${n}: ${fmt(d, 3)} ms`))));
    }
    draw();
  };

  /* ---------- RAID ---------- */
  OS.viz.raid = function (el, p) {
    const LV = [['0', 'RAID 0'], ['1', 'RAID 1'], ['4', 'RAID 4'], ['5', 'RAID 5'], ['6', 'RAID 6'], ['01', 'RAID 0+1'], ['10', 'RAID 1+0']];
    const INFO = {
      0: ['Striping without redundancy', 'min 2 disks', 'capacity 100%', 'tolerates 0 failures', 'Maximum performance, but losing any disk loses data.'],
      1: ['Mirroring', 'min 2 disks', 'capacity 50%', 'survives the failure of one disk of the pair', 'Reliable and fast reads, but expensive: twice the disks.'],
      4: ['Block-interleaved parity', 'min 3 disks', 'capacity (n−1)/n', 'tolerates 1 failure', 'A dedicated parity disk is a bottleneck for writes (every write updates it).'],
      5: ['Block-interleaved distributed parity', 'min 3 disks', 'capacity (n−1)/n', 'tolerates 1 failure', 'Parity is spread over all disks → no bottleneck. The most common parity level.'],
      6: ['P + Q redundancy', 'min 4 disks', 'capacity (n−2)/n', 'tolerates 2 failures', 'Two independent checks (P = XOR parity, Q = error-correcting code).'],
      '01': ['Stripe first, then mirror', 'min 4 disks', 'capacity 50%', 'one disk failure takes down its whole stripe set', 'Performance of RAID 0 + reliability of RAID 1.'],
      '10': ['Mirror first, then stripe', 'min 4 disks', 'capacity 50%', 'survives one failure in each mirrored pair', 'More robust than 0+1: a failure affects only its own pair.']
    };
    let level = String(p.level != null ? p.level : 5).replace('+', '');
    if (level === '0' && String(p.level) === '0+1') level = '01';
    const vis = h('div'), info = h('div', { class: 'viz-result' });
    el.append(h('div', { class: 'viz-controls' }, OS.seg(LV, level, v => { level = v; draw(); })), vis, info);
    const blk = (txt, tone) => h('div', { class: 'blk tone-' + tone, text: txt });
    function draw() {
      const disks = [];
      const rows = 4;
      const D = (title, blocks) => disks.push(h('div', { class: 'disk' }, h('div', { class: 'disk-h', text: title }), ...blocks));
      if (level === '0') for (let d = 0; d < 4; d++) D('Disk ' + d, Array.from({ length: rows }, (_, r) => blk('A' + (r * 4 + d + 1), 'acc')));
      if (level === '1') for (let d = 0; d < 2; d++) D(d ? 'Mirror' : 'Disk 0', Array.from({ length: rows }, (_, r) => blk('A' + (r + 1), d ? 'c2' : 'acc')));
      if (level === '4') for (let d = 0; d < 4; d++) D(d === 3 ? 'Parity' : 'Disk ' + d, Array.from({ length: rows }, (_, r) => d === 3 ? blk('P' + (r + 1), 'warn') : blk('A' + (r * 3 + d + 1), 'acc')));
      if (level === '5') for (let d = 0; d < 4; d++) D('Disk ' + d, Array.from({ length: rows }, (_, r) => {
        const pd = 3 - (r % 4);
        if (d === pd) return blk('P' + (r + 1), 'warn');
        const idx = d < pd ? d : d - 1;
        return blk('A' + (r * 3 + idx + 1), 'acc');
      }));
      if (level === '6') for (let d = 0; d < 5; d++) D('Disk ' + d, Array.from({ length: rows }, (_, r) => {
        const pd = (4 - r % 5 + 5) % 5, qd = (pd + 1) % 5;
        if (d === pd) return blk('P' + (r + 1), 'warn');
        if (d === qd) return blk('Q' + (r + 1), 'bad');
        const data = [0, 1, 2, 3, 4].filter(x => x !== pd && x !== qd);
        return blk('A' + (r * 3 + data.indexOf(d) + 1), 'acc');
      }));
      if (level === '01') for (let d = 0; d < 4; d++) D((d < 2 ? 'Stripe A' : 'Stripe B') + ' · ' + (d % 2), Array.from({ length: rows }, (_, r) => blk('A' + (r * 2 + (d % 2) + 1), d < 2 ? 'acc' : 'c2')));
      if (level === '10') for (let d = 0; d < 4; d++) D((d < 2 ? 'Pair 0' : 'Pair 1') + (d % 2 ? ' mirror' : ''), Array.from({ length: rows }, (_, r) => blk('A' + (r * 2 + (d < 2 ? 0 : 1) + 1), d % 2 ? 'c2' : 'acc')));
      vis.innerHTML = '';
      vis.append(h('div', { class: 'disk-grid' }, ...disks));
      const [name, min, cap, ft, note] = INFO[level];
      info.innerHTML = `<b>${name}</b> · ${min} · ${cap} · ${ft}<br>${note}`;
    }
    draw();
    // parity demo
    const bits = [[1, 0, 1, 1], [0, 1, 1, 0], [1, 1, 0, 0]];
    let failed = -1;
    const demo = h('div', { style: { marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed var(--border)' } });
    el.append(demo);
    function drawDemo() {
      demo.innerHTML = '';
      demo.append(h('div', { class: 'small', style: { fontWeight: 600, marginBottom: '8px' }, html: 'Parity = XOR of the data. Click bits, then "break" a disk — it is rebuilt by XOR-ing the others.' }));
      const parity = [0, 1, 2, 3].map(k => bits.reduce((x, d) => x ^ d[k], 0));
      const grid = h('div', { style: { display: 'grid', gridTemplateColumns: 'auto auto auto', gap: '8px 12px', alignItems: 'center', justifyContent: 'start' } });
      bits.forEach((d, i) => {
        const shown = failed === i ? [0, 1, 2, 3].map(k => parity[k] ^ bits.filter((_, j) => j !== i).reduce((x, dd) => x ^ dd[k], 0)) : d;
        const row = h('div', { class: 'bits' }, ...shown.map((b, k) => {
          const e = h('span', { class: 'bit' + (b ? ' on' : ''), text: b });
          if (failed === i) e.style.borderStyle = 'dashed';
          else e.onclick = () => { d[k] ^= 1; drawDemo(); };
          return e;
        }));
        const fb = h('button', { class: 'btn sm ' + (failed === i ? 'danger' : 'ghost'), type: 'button', text: failed === i ? 'rebuilt ✓' : 'break' });
        fb.onclick = () => { failed = failed === i ? -1 : i; drawDemo(); };
        grid.append(h('span', { class: 'mono small', text: 'Disk ' + i }), row, fb);
      });
      grid.append(h('span', { class: 'mono small', text: 'Parity' }), h('div', { class: 'bits' }, ...parity.map(b => h('span', { class: 'bit par', text: b }))), h('span'));
      demo.append(grid);
      if (failed >= 0) demo.append(h('div', { class: 'viz-result ok', html: `Disk ${failed} = XOR(other disks, parity) — the data is recovered with no loss.` }));
    }
    drawDemo();
  };

  /* ---------- chmod ---------- */
  OS.viz.chmod = function (el, p) {
    let m = (p.mode || '754').split('').map(Number);
    const file = p.file || 'file.txt';
    const who = ['user (u)', 'group (g)', 'other (o)'], bitsN = [4, 2, 1], letters = ['r', 'w', 'x'];
    const box = h('div');
    const oct = h('input', { type: 'text', value: m.join(''), maxlength: 3, style: { width: '70px', fontFamily: 'var(--mono)' } });
    oct.addEventListener('input', () => { if (/^[0-7]{3}$/.test(oct.value)) { m = oct.value.split('').map(Number); draw(true); } });
    el.append(h('div', { class: 'viz-controls' }, h('label', {}, 'Octal', oct)), box);
    function draw(fromInput) {
      if (!fromInput) oct.value = m.join('');
      box.innerHTML = '';
      const g = h('div', { class: 'perm-grid' }, h('span'), ...letters.map((l, i) => h('span', { class: 'h', text: `${l} (${bitsN[i]})` })), h('span', { class: 'h', text: 'sum' }));
      who.forEach((w, i) => {
        g.append(h('span', { class: 'small', text: w }));
        bitsN.forEach((b, k) => {
          const on = (m[i] & b) !== 0;
          const lab = h('label', { class: on ? 'on' : '', text: on ? letters[k] : '-' });
          lab.onclick = () => { m[i] ^= b; draw(); };
          g.append(lab);
        });
        g.append(h('b', { class: 'mono', style: { textAlign: 'center' }, text: String(m[i]) }));
      });
      const sym = m.map(d => letters.map((l, k) => (d & bitsN[k] ? l : '-')).join('')).join('');
      const symCmd = ['u', 'g', 'o'].map((u, i) => u + '=' + letters.filter((l, k) => m[i] & bitsN[k]).join('')).join(',');
      box.append(g, h('div', { class: 'formula', html:
        `ls -l: <b>-${sym}</b> 1 user group 1024 Jan 1 12:00 ${OS.esc(file)}<br>` +
        `chmod <b>${m.join('')}</b> ${OS.esc(file)} &nbsp;≡&nbsp; chmod <b>${symCmd}</b> ${OS.esc(file)}` }));
    }
    draw();
  };

  /* ---------- I/O modes ---------- */
  OS.viz.ioModes = function (el) {
    const modes = [
      ['Programmed I/O (polling)', 'The CPU polls the status register in a loop (busy waiting) and copies every word itself. The CPU is busy for the whole operation.', [
        { label: 'CPU', segs: [{ from: 0, to: 1, label: 'cmd', tone: 'acc' }, { from: 1, to: 17, label: 'busy waiting: polling the status', tone: 'bad' }, { from: 17, to: 20, label: 'copy', tone: 'acc' }] },
        { label: 'Device', segs: [{ from: 1, to: 17, label: 'operation', tone: 'muted' }] }]],
      ['Interrupt-driven I/O', 'The CPU issues the command and runs other processes; the device raises an interrupt when ready, and the CPU runs the ISR to move the data (once per word/block).', [
        { label: 'CPU', segs: [{ from: 0, to: 1, label: 'cmd', tone: 'acc' }, { from: 1, to: 6, label: 'other process', tone: 'ok' }, { from: 6, to: 7, label: 'ISR', tone: 'warn' }, { from: 7, to: 12, label: 'other process', tone: 'ok' }, { from: 12, to: 13, label: 'ISR', tone: 'warn' }, { from: 13, to: 18, label: 'other process', tone: 'ok' }, { from: 18, to: 19, label: 'ISR', tone: 'warn' }, { from: 19, to: 20, label: '', tone: 'ok' }] },
        { label: 'Device', segs: [{ from: 1, to: 6, label: 'word 1', tone: 'muted' }, { from: 7, to: 12, label: 'word 2', tone: 'muted' }, { from: 13, to: 18, label: 'word 3', tone: 'muted' }] }]],
      ['DMA', 'The CPU only programs the DMA controller (address, count, direction). The controller moves the whole block between device and memory by itself (cycle stealing on the bus) and raises one interrupt at the end.', [
        { label: 'CPU', segs: [{ from: 0, to: 1, label: 'setup', tone: 'acc' }, { from: 1, to: 19, label: 'other processes', tone: 'ok' }, { from: 19, to: 20, label: 'ISR', tone: 'warn' }] },
        { label: 'DMA', segs: [{ from: 1, to: 19, label: 'moves the whole block to memory', tone: 'c4' }] }]]
    ];
    modes.forEach(([title, desc, rows], i) => {
      const box = h('div', { style: { marginBottom: i < 2 ? '18px' : 0 } });
      box.append(h('div', { style: { fontWeight: 650, marginBottom: '2px' }, text: title }), h('div', { class: 'small muted', style: { marginBottom: '8px' }, text: desc }));
      OS.renderTimeline(box, { max: 20, ticks: [0, 20], rows });
      el.append(box);
    });
    el.append(h('div', { class: 'legend' }, h('span', {}, h('i', { class: 'tone-ok' }), 'useful CPU work'), h('span', {}, h('i', { class: 'tone-bad' }), 'CPU wastes time waiting'), h('span', {}, h('i', { class: 'tone-warn' }), 'interrupt handler')));
  };
})();
