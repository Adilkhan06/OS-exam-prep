/* Main memory: paging (address translation + TLB/EAT), memAlloc (first/best/worst fit), bitSplit (address fields) */
(function () {
  'use strict';
  const { h, fmt } = OS;

  /* ---------- paging: logical → physical through the page table ---------- */
  OS.viz.paging = function (el, p) {
    const size = p.pageSize || 4;
    const table = (p.pages || [5, 6, 1, 2]).slice();
    const frames = p.frames || Math.max(8, Math.max(...table) + 1);
    const maxAddr = table.length * size - 1;
    let a = Math.min(p.address != null ? p.address : 13, maxAddr);
    const pow2 = (size & (size - 1)) === 0;
    const nBits = pow2 ? Math.log2(size) : 0;
    const mBits = pow2 ? Math.ceil(Math.log2(table.length * size)) : 0;
    const inp = h('input', { type: 'range', min: 0, max: maxAddr, value: a });
    const num = h('input', { type: 'number', min: 0, max: maxAddr, value: a });
    const ctr = h('div', { class: 'viz-controls' }, h('label', {}, 'Logical address', inp, num), h('span', { class: 'small muted', text: `page size = ${size} · ${table.length} pages · ${frames} frames` }));
    const body = h('div');
    el.append(ctr, body);
    const set = v => { a = Math.max(0, Math.min(maxAddr, +v || 0)); inp.value = a; num.value = a; draw(); };
    inp.addEventListener('input', () => set(inp.value));
    num.addEventListener('input', () => set(num.value));
    function draw() {
      const pg = Math.floor(a / size), d = a % size, f = table[pg], phys = f * size + d;
      body.innerHTML = '';
      const bin = (v, w) => v.toString(2).padStart(w, '0');
      body.append(h('div', { class: 'formula', html:
        `p = ⌊${a} / ${size}⌋ = <b>${pg}</b> &nbsp;·&nbsp; d = ${a} mod ${size} = <b>${d}</b>` +
        (pow2 ? `<br>binary: <b style="color:var(--acc-text)">${bin(pg, Math.max(1, mBits - nBits))}</b>|<b style="color:var(--warn)">${bin(d, nBits)}</b> &nbsp;(high ${mBits - nBits} bits = page number, low ${nBits} bits = offset)` : '') +
        `<br>page table[${pg}] = frame <b>${f}</b> → physical address = ${f} × ${size} + ${d} = <b>${phys}</b>` }));
      const grid = h('div', { class: 'cols' });
      const pt = h('table', { class: 'vt' }, h('tr', {}, h('th', { text: 'page' }), h('th', { text: 'frame' })));
      table.forEach((fr, i) => pt.append(h('tr', { style: { background: i === pg ? 'var(--acc-soft)' : '' } }, h('td', { text: i }), h('td', { html: i === pg ? `<b>${fr}</b>` : String(fr) }))));
      const pm = h('table', { class: 'vt' }, h('tr', {}, h('th', { text: 'frame' }), h('th', { text: 'owner (page)' }), h('th', { text: 'physical addresses' })));
      for (let fr = 0; fr < frames; fr++) {
        const owner = table.indexOf(fr);
        pm.append(h('tr', { style: { background: fr === f ? 'var(--ok-soft)' : '' } }, h('td', { text: fr }), h('td', { text: owner >= 0 ? 'page ' + owner : '—' }), h('td', { html: `${fr * size}–${fr * size + size - 1}` + (fr === f ? ` → <b>${phys}</b>` : '') })));
      }
      grid.append(h('div', {}, h('div', { class: 'small muted', text: 'Page table (one per process)' }), pt), h('div', {}, h('div', { class: 'small muted', text: 'Physical memory' }), h('div', { class: 'tbl-wrap' }, pm)));
      body.append(grid);
    }
    draw();
    if (p.tlb !== false) {
      const t = Object.assign({ hit: 0.8, mem: 10 }, p.tlb || {});
      const hIn = h('input', { type: 'range', min: 0, max: 100, value: Math.round(t.hit * 100) });
      const mIn = h('input', { type: 'number', min: 1, value: t.mem });
      const out = h('div', { class: 'formula' });
      const box = h('div', { style: { marginTop: '14px', paddingTop: '12px', borderTop: '1px dashed var(--border)' } },
        h('div', { class: 'small', style: { fontWeight: 600, marginBottom: '6px' }, text: 'TLB and effective access time (EAT)' }),
        h('div', { class: 'viz-controls' }, h('label', {}, 'TLB hit ratio', hIn), h('label', {}, 'memory access, ns', mIn)), out);
      el.append(box);
      const calc = () => {
        const al = +hIn.value / 100, m = +mIn.value || 10;
        const eat = al * m + (1 - al) * 2 * m;
        out.innerHTML = `hit (page found in TLB): 1 memory access = ${m} ns · miss: page table + data = 2 × ${m} = ${2 * m} ns<br>EAT = ${fmt(al)} × ${m} + ${fmt(1 - al)} × ${2 * m} = <b>${fmt(eat)} ns</b> → slowdown <b>${fmt((eat / m - 1) * 100, 1)}%</b>`;
      };
      hIn.addEventListener('input', calc);
      mIn.addEventListener('input', calc);
      calc();
    }
  };

  /* ---------- memAlloc: first / best / worst fit ---------- */
  OS.allocate = function (holes, requests, strategy) {
    const H = holes.map((s, i) => ({ id: i, size: s, free: s, parts: [] }));
    const steps = requests.map(r => {
      const fit = H.filter(x => x.free >= r);
      let pick = null;
      if (fit.length) {
        if (strategy === 'first') pick = fit[0];
        else if (strategy === 'best') pick = fit.reduce((b, x) => (x.free < b.free ? x : b));
        else pick = fit.reduce((b, x) => (x.free > b.free ? x : b));
      }
      if (pick) { pick.parts.push(r); pick.free -= r; }
      return { req: r, hole: pick ? pick.id : null, left: pick ? pick.free : null };
    });
    return { holes: H, steps };
  };
  OS.viz.memAlloc = function (el, p) {
    const holes = p.holes || [100, 500, 200, 300, 600];
    const reqs = p.requests || [212, 417, 112, 426];
    let strat = p.strategy || 'first';
    const body = h('div');
    el.append(h('div', { class: 'viz-controls' }, OS.seg([['first', 'First-fit'], ['best', 'Best-fit'], ['worst', 'Worst-fit']], strat, v => { strat = v; draw(); })), body);
    function draw() {
      const r = OS.allocate(holes, reqs, strat);
      body.innerHTML = '';
      const max = Math.max(...holes);
      const lanes = h('div', { style: { display: 'grid', gap: '6px' } });
      r.holes.forEach(x => {
        const bar = h('div', { style: { display: 'flex', height: '30px', width: (x.size / max) * 100 + '%', minWidth: '60px', border: '1.5px solid var(--border-strong)', borderRadius: '6px', overflow: 'hidden' } });
        x.parts.forEach((s, k) => bar.append(h('div', { class: 'tone-c' + ((reqs.indexOf(s) % 6) + 1), style: { width: (s / x.size) * 100 + '%', background: 'var(--ts)', borderRight: '1.5px solid var(--t)', display: 'grid', placeItems: 'center', fontSize: '.72rem', fontWeight: 600 }, text: s })));
        if (x.free) bar.append(h('div', { style: { flex: 1, display: 'grid', placeItems: 'center', fontSize: '.72rem', color: 'var(--text-3)' }, text: x.free + ' free' }));
        lanes.append(h('div', { style: { display: 'grid', gridTemplateColumns: '86px 1fr', gap: '8px', alignItems: 'center' } }, h('span', { class: 'small mono', text: `hole ${x.id + 1}: ${x.size}` }), bar));
      });
      body.append(lanes);
      const t = h('table', { class: 'vt', style: { marginTop: '10px' } }, h('tr', {}, h('th', { text: 'request' }), h('th', { text: 'placed in' }), h('th', { text: 'leftover hole' })));
      r.steps.forEach(s => t.append(h('tr', { style: { background: s.hole == null ? 'var(--bad-soft)' : '' } }, h('td', { text: s.req + ' KB' }), h('td', { text: s.hole == null ? 'must wait (no hole is big enough)' : `hole ${s.hole + 1} (${holes[s.hole]} KB)` }), h('td', { text: s.hole == null ? '—' : s.left + ' KB' }))));
      body.append(h('div', { class: 'tbl-wrap' }, t));
      const waiting = r.steps.filter(s => s.hole == null).length;
      body.append(h('div', { class: 'viz-result ' + (waiting ? 'warn' : 'ok'), html: waiting ? `${waiting} request(s) cannot be placed even though total free memory is ${r.holes.reduce((s, x) => s + x.free, 0)} KB — that is <b>external fragmentation</b>.` : 'All requests placed.' }));
    }
    draw();
  };

  /* ---------- bitSplit: show how an address is divided into fields ---------- */
  OS.viz.bitSplit = function (el, p) {
    const fields = p.fields || [{ label: 'p1', bits: 10 }, { label: 'p2', bits: 10 }, { label: 'd', bits: 12 }];
    const total = fields.reduce((s, f) => s + f.bits, 0);
    const parse = s => { s = String(s).trim(); return s.startsWith('0x') ? parseInt(s, 16) : parseInt(s, 10); };
    let addr = p.address != null ? parse(p.address) : 0x00403004;
    const inp = h('input', { type: 'text', value: '0x' + addr.toString(16).toUpperCase(), style: { width: '140px', fontFamily: 'var(--mono)' } });
    const body = h('div');
    el.append(h('div', { class: 'viz-controls' }, h('label', {}, 'Address (hex or decimal)', inp), h('span', { class: 'small muted', text: `${total}-bit address` })), body);
    inp.addEventListener('input', () => { const v = parse(inp.value); if (Number.isFinite(v) && v >= 0) { addr = v; draw(); } });
    function draw() {
      const bin = (addr >>> 0).toString(2).padStart(total, '0').slice(-total);
      body.innerHTML = '';
      const row = h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '4px', fontFamily: 'var(--mono)' } });
      let pos = 0;
      const vals = [];
      fields.forEach((f, i) => {
        const bits = bin.slice(pos, pos + f.bits); pos += f.bits;
        const v = parseInt(bits, 2);
        vals.push(`${f.label} = ${v}`);
        row.append(h('div', { class: 'tone-c' + ((i % 6) + 1), style: { border: '1.5px solid var(--t)', background: 'var(--ts)', borderRadius: '6px', padding: '4px 6px', textAlign: 'center' } },
          h('div', { style: { fontSize: '.8rem', fontWeight: 700 }, text: `${f.label} (${f.bits} bits)` }), h('div', { style: { fontSize: '.78rem', letterSpacing: '.04em' }, text: bits }), h('div', { style: { fontSize: '.8rem' }, text: '= ' + v })));
      });
      body.append(row, h('div', { class: 'viz-note', text: vals.join(' · ') + (p.note ? ' — ' + p.note : '') }));
    }
    draw();
  };
})();
