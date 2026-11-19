/* Generic visualizations: flow, layers, graph, timeline, stepper, tree */
(function () {
  'use strict';
  const { h, svgEl, esc } = OS;
  const tone = t => 'tone-' + (t || 'none');

  /* ---------- flow ---------- */
  OS.viz.flow = function (el, p) {
    const dir = p.dir === 'v' ? 'v' : 'h';
    const box = h('div', { class: 'flow ' + dir });
    (p.steps || []).forEach((s, i) => {
      if (i) box.append(h('div', { class: 'flow-arrow', html: dir === 'v' ? '↓' : '→' }));
      const st = h('div', { class: 'flow-step ' + tone(s.tone) });
      st.append(h('b', { html: s.label || '' }));
      if (s.sub) st.append(h('small', { html: s.sub }));
      box.append(st);
    });
    el.append(box);
    if (p.loop) el.append(h('div', { class: 'flow-loop', text: '↺ the cycle repeats — from the last step back to the first' }));
  };

  /* ---------- layers ---------- */
  OS.viz.layers = function (el, p) {
    const L = p.layers || [];
    const wrap = h('div', { class: 'layers' });
    const stack = h('div', { class: 'layers-stack' });
    L.forEach((l, i) => {
      const d = h('div', { class: 'layer ' + tone(l.tone) });
      if (p.pyramid && L.length > 1) d.style.width = (38 + (62 * i) / (L.length - 1)) + '%';
      d.append(h('b', { html: l.label || '' }));
      if (l.sub) d.append(h('small', { html: l.sub }));
      stack.append(d);
    });
    if (p.top || p.bottom) {
      const ax = h('div', { class: 'layers-axis' }, h('span', { html: p.top || '' }), h('i', { class: 'ax-line' }), h('span', { html: p.bottom || '' }));
      wrap.append(ax);
    }
    wrap.prepend(stack);
    el.append(wrap);
  };

  /* ---------- graph ---------- */
  function nodeGeom(n) {
    const shape = n.shape || 'rect';
    if (shape === 'circle') { const r = n.r || (n.w ? n.w / 2 : 26); return { shape, r, w: 2 * r, h: 2 * r }; }
    if (shape === 'res') { const inst = n.inst || 1; return { shape, w: n.w || Math.max(60, 22 + inst * 16), h: n.h || 44 }; }
    return { shape, w: n.w || 110, h: n.h || 44 };
  }
  function boundary(n, g, tx, ty) {
    const dx = tx - n.x, dy = ty - n.y;
    const len = Math.hypot(dx, dy) || 1;
    if (g.shape === 'circle') return [n.x + (dx / len) * g.r, n.y + (dy / len) * g.r];
    const hw = g.w / 2 + 1, hh = g.h / 2 + 1;
    const sx = dx === 0 ? Infinity : hw / Math.abs(dx);
    const sy = dy === 0 ? Infinity : hh / Math.abs(dy);
    const s = Math.min(sx, sy);
    return [n.x + dx * s, n.y + dy * s];
  }
  function textLines(parent, str, x, y, cls, lh) {
    const lines = String(str).split('\n');
    const t = svgEl('text', { x, y: y - ((lines.length - 1) * lh) / 2, 'text-anchor': 'middle', 'dominant-baseline': 'central', class: cls || '' });
    lines.forEach((ln, i) => t.append(svgEl('tspan', { x, dy: i ? lh : 0 }, ln)));
    parent.append(t);
    return t;
  }
  OS.viz.graph = function (el, p) {
    const W = p.w || 600, H = p.h || 300;
    const svg = svgEl('svg', { class: 'd', viewBox: `0 0 ${W} ${H}`, role: 'img' });
    svg.style.maxWidth = Math.max(W, 320) + 'px';
    svg.style.margin = '0 auto';
    const nodes = {};
    (p.nodes || []).forEach(n => { nodes[n.id] = Object.assign({}, n, { g: nodeGeom(n) }); });
    const gE = svgEl('g'), gN = svgEl('g'), gL = svgEl('g');
    const edgeEls = [];
    (p.edges || []).forEach(e => {
      const a = nodes[e.from], b = nodes[e.to];
      if (!a || !b) return;
      const cls = 'e-line ' + (e.tone ? 'tone-' + e.tone : '') + (e.dashed ? ' dashed' : '') + (e.both ? ' both' : '');
      let d, lx, ly;
      if (a === b) {
        const top = a.y - a.g.h / 2;
        const x1 = a.x - 12, x2 = a.x + 12;
        d = `M${x1},${top} C${x1 - 30},${top - 46} ${x2 + 30},${top - 46} ${x2},${top}`;
        lx = a.x; ly = top - 40;
      } else {
        const bend = e.bend || 0;
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
        const cx = mx + (-dy / len) * bend * 2, cy = my + (dx / len) * bend * 2;
        const [sx, sy] = boundary(a, a.g, bend ? cx : b.x, bend ? cy : b.y);
        const [ex, ey] = boundary(b, b.g, bend ? cx : a.x, bend ? cy : a.y);
        d = bend ? `M${sx},${sy} Q${cx},${cy} ${ex},${ey}` : `M${sx},${sy} L${ex},${ey}`;
        lx = bend ? 0.25 * sx + 0.5 * cx + 0.25 * ex : (sx + ex) / 2;
        ly = bend ? 0.25 * sy + 0.5 * cy + 0.25 * ey : (sy + ey) / 2;
      }
      const g = svgEl('g', { class: 'edge' });
      g.append(svgEl('path', { d, class: cls }));
      gE.append(g);
      edgeEls.push({ g, e });
      if (e.label) {
        const lg = svgEl('g', { class: 'edge' });
        const lines = String(e.label).split('\n');
        const wMax = Math.max(...lines.map(s => s.length)) * 6.9 + 10;
        lg.append(svgEl('rect', { x: lx - wMax / 2, y: ly - (lines.length * 15) / 2 - 1, width: wMax, height: lines.length * 15 + 2, rx: 4, class: 'e-lbl-bg' }));
        textLines(lg, e.label, lx, ly, 'e-lbl', 15);
        gL.append(lg);
        edgeEls.push({ g: lg, e });
      }
    });
    const nodeEls = {};
    Object.values(nodes).forEach(n => {
      const g = svgEl('g', { class: 'node' });
      const G = n.g;
      const scls = 'n-shape ' + (n.tone ? 'tone-' + n.tone : '');
      if (G.shape === 'circle') g.append(svgEl('circle', { cx: n.x, cy: n.y, r: G.r, class: scls }));
      else g.append(svgEl('rect', { x: n.x - G.w / 2, y: n.y - G.h / 2, width: G.w, height: G.h, rx: G.shape === 'pill' ? G.h / 2 : G.shape === 'res' ? 4 : 9, class: scls }));
      if (G.shape === 'res') {
        const inst = n.inst || 1;
        const gap = Math.min(16, (G.w - 16) / inst);
        for (let i = 0; i < inst; i++) g.append(svgEl('circle', { cx: n.x - ((inst - 1) * gap) / 2 + i * gap, cy: n.y + (n.label ? 8 : 0), r: 4, class: 'dot' }));
        if (n.label) textLines(g, n.label, n.x, n.y - 9, 'b sm', 13);
      } else if (n.label != null) {
        const inside = G.shape !== 'circle' || !n.sub;
        textLines(g, n.label, n.x, n.y - (n.sub && inside ? 7 : 0), 'b', 15);
        if (n.sub) {
          if (inside && G.shape !== 'circle') textLines(g, n.sub, n.x, n.y + 10, 'sm', 13);
          else textLines(g, n.sub, n.x, n.y + G.h / 2 + 12, 'sm', 13);
        }
      }
      g.addEventListener('mouseenter', () => highlight(n.id, true));
      g.addEventListener('mouseleave', () => highlight(n.id, false));
      gN.append(g);
      nodeEls[n.id] = g;
    });
    function highlight(id, on) {
      svg.classList.toggle('dim', on);
      Object.values(nodeEls).forEach(g => g.classList.remove('hl'));
      edgeEls.forEach(x => x.g.classList.remove('hl'));
      if (!on) return;
      nodeEls[id].classList.add('hl');
      edgeEls.forEach(x => {
        if (x.e.from === id || x.e.to === id) {
          x.g.classList.add('hl');
          if (nodeEls[x.e.from]) nodeEls[x.e.from].classList.add('hl');
          if (nodeEls[x.e.to]) nodeEls[x.e.to].classList.add('hl');
        }
      });
    }
    svg.append(gE, gN, gL);
    el.append(svg);
    return { svg, nodes: nodeEls };
  };

  /* ---------- timeline ---------- */
  OS.renderTimeline = function (el, p) {
    const max = p.max || Math.max(1, ...(p.rows || []).flatMap(r => r.segs.map(s => s.to)));
    const grid = h('div', { class: 'tl' });
    const showLabels = (p.rows || []).some(r => r.label);
    if (!showLabels) grid.style.gridTemplateColumns = '0 1fr';
    (p.rows || []).forEach(r => {
      grid.append(h('div', { class: 'tl-label', html: r.label || '' }));
      const tr = h('div', { class: 'tl-track' });
      (r.segs || []).forEach(s => {
        const seg = h('div', { class: 'tl-seg ' + tone(s.tone || 'acc'), title: `${s.label || ''} ${s.from}–${s.to}` });
        seg.style.left = (s.from / max) * 100 + '%';
        seg.style.width = `calc(${((s.to - s.from) / max) * 100}% - 1px)`;
        seg.textContent = s.label || '';
        tr.append(seg);
      });
      (p.marks || []).forEach(m => {
        const mk = h('div', { class: 'tl-mark' }, h('span', { text: m.label || '' }));
        mk.style.left = (m.t / max) * 100 + '%';
        tr.append(mk);
      });
      grid.append(tr);
    });
    let ticks = p.ticks;
    if (!ticks) {
      const set = new Set([0, max]);
      (p.rows || []).forEach(r => r.segs.forEach(s => { set.add(s.from); set.add(s.to); }));
      ticks = [...set].sort((a, b) => a - b);
      if (ticks.length > 24) { const step = Math.ceil(max / 12); ticks = []; for (let t = 0; t <= max; t += step) ticks.push(t); }
    }
    grid.append(h('div'));
    const axis = h('div', { class: 'tl-axis' });
    let lastPct = -10;
    ticks.forEach((t, i) => {
      const pct = (t / max) * 100;
      if (pct - lastPct < 3.2 && i !== ticks.length - 1) return;
      if (i === ticks.length - 1 && pct - lastPct < 3.2) { const prev = axis.lastChild; if (prev && lastPct > 0) prev.remove(); }
      const tk = h('div', { class: 'tl-tick', text: String(+t.toFixed(2)) });
      tk.style.left = pct + '%';
      axis.append(tk);
      lastPct = pct;
    });
    grid.append(axis);
    el.append(grid);
    return grid;
  };
  OS.viz.timeline = function (el, p) { OS.renderTimeline(el, p); };

  /* ---------- stepper ---------- */
  OS.viz.stepper = function (el, p) {
    const lines = String(p.code || '').replace(/\n$/, '').split('\n');
    const steps = p.steps || [];
    let cur = 0, timer = null;
    const codeBox = h('div', { class: 'code-view' });
    const lineEls = lines.map((ln, i) => {
      const d = h('div', { class: 'code-line' }, h('span', { class: 'ln', text: String(i + 1) }), h('span', { html: OS.highlight(ln, p.lang) || ' ' }));
      codeBox.append(d);
      return d;
    });
    const note = h('div', { class: 'step-note' });
    const count = h('div', { class: 'step-count' });
    const vars = h('div', { class: 'vars' });
    const out = h('div', { class: 'console' });
    const hasOut = steps.some(s => s.out != null);
    const hasVars = steps.some(s => s.vars);
    const bPrev = h('button', { class: 'btn sm', type: 'button', title: 'Back', html: '◀' });
    const bNext = h('button', { class: 'btn sm primary', type: 'button', html: 'Step ▶' });
    const bFirst = h('button', { class: 'btn sm', type: 'button', title: 'Restart', html: '⏮' });
    const bPlay = h('button', { class: 'btn sm', type: 'button', html: 'Auto' });
    const ctr = h('div', { class: 'viz-controls' }, bFirst, bPrev, bNext, bPlay, count);
    const panel = h('div', { class: 'step-panel' }, note);
    if (hasVars) panel.append(vars);
    if (hasOut) panel.append(h('div', { class: 'small muted', text: 'Output:' }), out);
    el.append(ctr, h('div', { class: 'stepper' }, codeBox, panel));

    function stateAt(i) {
      const st = {};
      for (let k = 0; k <= i && k < steps.length; k++) Object.assign(st, steps[k].vars || {});
      return st;
    }
    function render() {
      const s = steps[cur] || {};
      const ls = Array.isArray(s.line) ? s.line : s.line != null ? [s.line] : [];
      lineEls.forEach((d, i) => d.classList.toggle('cur', ls.includes(i + 1)));
      const first = lineEls[(ls[0] || 1) - 1];
      if (first && codeBox.scrollHeight > codeBox.clientHeight) first.scrollIntoView({ block: 'nearest' });
      note.innerHTML = s.note || '';
      count.textContent = `step ${cur + 1} / ${steps.length}`;
      const now = stateAt(cur), prev = cur ? stateAt(cur - 1) : {};
      vars.innerHTML = '';
      Object.keys(now).forEach(k => {
        const changed = cur > 0 ? String(prev[k]) !== String(now[k]) : false;
        vars.append(h('div', { class: 'var' + (changed ? ' chg' : '') }, h('small', { text: k }), h('b', { text: String(now[k]) })));
      });
      let o = '';
      for (let k = 0; k <= cur; k++) if (steps[k].out != null) { o += steps[k].out; if (!/\n$/.test(o)) o += '\n'; }
      out.textContent = o.replace(/\n$/, '');
      bPrev.disabled = cur === 0; bFirst.disabled = cur === 0; bNext.disabled = cur >= steps.length - 1;
    }
    bNext.onclick = () => { if (cur < steps.length - 1) { cur++; render(); } };
    bPrev.onclick = () => { if (cur > 0) { cur--; render(); } };
    bFirst.onclick = () => { cur = 0; stop(); render(); };
    function stop() { clearInterval(timer); timer = null; bPlay.textContent = 'Auto'; }
    bPlay.onclick = () => {
      if (timer) return stop();
      if (cur >= steps.length - 1) cur = 0;
      bPlay.textContent = 'Pause';
      render();
      timer = setInterval(() => { if (cur >= steps.length - 1) return stop(); cur++; render(); }, 1300);
    };
    render();
  };

  /* ---------- tree ---------- */
  OS.viz.tree = function (el, p) {
    const box = h('div', { class: 'tree' + (p.mono ? ' mono' : '') });
    function build(n) {
      const li = h('li');
      const tn = h('div', { class: 'tn ' + (n.tone ? tone(n.tone) : '') }, h('b', { html: n.label || '' }));
      if (n.note) tn.append(h('span', { html: n.note }));
      li.append(tn);
      if (n.children && n.children.length) {
        const ul = h('ul');
        n.children.forEach(c => ul.append(build(c)));
        li.append(ul);
      }
      return li;
    }
    const ul = h('ul');
    if (p.root) ul.append(build(p.root));
    box.append(ul);
    el.append(box);
  };
})();
