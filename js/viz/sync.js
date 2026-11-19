/* Synchronization & deadlock: race, peterson, semaphore, philosophers, banker */
(function () {
  'use strict';
  const { h, svgEl } = OS;

  /* ---------- race condition ---------- */
  OS.viz.race = function (el, p) {
    const start = p.start != null ? p.start : 5;
    const PROD = ['register1 = counter', 'register1 = register1 + 1', 'counter = register1'];
    const CONS = ['register2 = counter', 'register2 = register2 - 1', 'counter = register2'];
    let st, pi, ci, log;
    const reset = () => { st = { counter: start, register1: '—', register2: '—' }; pi = 0; ci = 0; log = []; };
    reset();
    const exec = who => {
      if (who === 'P' && pi < 3) {
        if (pi === 0) st.register1 = st.counter; else if (pi === 1) st.register1 = st.register1 + 1; else st.counter = st.register1;
        log.push(['producer', PROD[pi], { ...st }]); pi++;
      } else if (who === 'C' && ci < 3) {
        if (ci === 0) st.register2 = st.counter; else if (ci === 1) st.register2 = st.register2 - 1; else st.counter = st.register2;
        log.push(['consumer', CONS[ci], { ...st }]); ci++;
      }
    };
    const col = (title, lines, idx, who) => {
      const box = h('div', { class: 'code-view', style: { padding: '8px 0' } });
      lines.forEach((ln, i) => box.append(h('div', { class: 'code-line' + (i === idx ? ' cur' : ''), style: { opacity: i < idx ? .55 : 1 } }, h('span', { class: 'ln', text: (i < idx ? '✓' : String(i + 1)) }), h('span', { text: ln }))));
      const b = h('button', { class: 'btn sm', type: 'button', text: 'Execute next instruction', disabled: idx >= 3 });
      b.onclick = () => { exec(who); draw(); };
      return h('div', {}, h('div', { class: 'small', style: { fontWeight: 600, marginBottom: '6px' }, html: title }), box, h('div', { style: { marginTop: '8px' } }, b));
    };
    const presets = [
      ['As on the slide → 4', 'PPCCPC'], ['Other order → 6', 'PPCCCP'], ['No interleaving → 5', 'PPPCCC']
    ];
    const body = h('div');
    const ctr = h('div', { class: 'viz-controls' });
    presets.forEach(([label, seq]) => {
      const b = h('button', { class: 'btn sm', type: 'button', text: label });
      b.onclick = () => { reset(); [...seq].forEach(c => exec(c)); draw(); };
      ctr.append(b);
    });
    const rb = h('button', { class: 'btn sm ghost', type: 'button', text: 'Reset' });
    rb.onclick = () => { reset(); draw(); };
    ctr.append(rb);
    el.append(ctr, body);
    function draw() {
      body.innerHTML = '';
      body.append(h('div', { class: 'cols' }, col('Producer: <code>counter++</code>', PROD, pi, 'P'), col('Consumer: <code>counter--</code>', CONS, ci, 'C')));
      body.append(h('div', { class: 'vars', style: { marginTop: '12px' } }, ...Object.entries(st).map(([k, v]) => h('div', { class: 'var' }, h('small', { text: k }), h('b', { text: String(v) })))));
      if (log.length) {
        const t = h('table', { class: 'vt', style: { marginTop: '10px' } });
        t.append(h('tr', {}, h('th', { text: 'T' }), h('th', { text: 'who', class: 'l' }), h('th', { text: 'instruction', class: 'l' }), h('th', { text: 'counter' }), h('th', { text: 'reg1' }), h('th', { text: 'reg2' })));
        log.forEach(([who, ins, s], i) => t.append(h('tr', {}, h('td', { text: 'T' + i }), h('td', { class: 'l', text: who }), h('td', { class: 'l mono', text: ins }), h('td', { text: s.counter }), h('td', { text: s.register1 }), h('td', { text: s.register2 }))));
        body.append(h('div', { class: 'tbl-wrap' }, t));
      }
      if (pi === 3 && ci === 3) {
        const ok = st.counter === start;
        body.append(h('div', { class: 'viz-result ' + (ok ? 'ok' : 'bad'), html: ok ? `Result: counter = <b>${st.counter}</b> — correct (one ++ and one −−).` : `Result: counter = <b>${st.counter}</b>, but it should be ${start}. <b>Race condition</b>: the result depends on how the instructions interleave.` }));
      }
    }
    draw();
  };

  /* ---------- Peterson ---------- */
  OS.viz.peterson = function (el) {
    const code = i => {
      const j = 1 - i;
      return ['while (true) {', `  flag[${i}] = true;`, `  turn = ${j};`, `  while (flag[${j}] && turn == ${j}) ;`, '  /* critical section */', `  flag[${i}] = false;`, '  /* remainder section */', '}'];
    };
    let S;
    const reset = () => { S = { flag: [false, false], turn: 0, pc: [6, 6], msg: 'Both processes are in the remainder section. Take steps in any order and try to break mutual exclusion.' }; };
    reset();
    // pc = line index (0-based in code array) of the NEXT line to execute: 1 flag,2 turn,3 while,4 CS,5 flag=false,6 remainder
    function step(i) {
      const j = 1 - i, pc = S.pc[i];
      if (pc === 6) { S.pc[i] = 1; S.msg = `P${i} wants to enter its critical section.`; }
      else if (pc === 1) { S.flag[i] = true; S.pc[i] = 2; S.msg = `P${i}: flag[${i}] = true — "I am ready".`; }
      else if (pc === 2) { S.turn = j; S.pc[i] = 3; S.msg = `P${i}: turn = ${j} — politely gives the turn to P${j}.`; }
      else if (pc === 3) {
        if (S.flag[j] && S.turn === j) S.msg = `P${i} spins in the loop (busy waiting): flag[${j}] = true and turn = ${j}.`;
        else { S.pc[i] = 4; S.msg = `P${i} enters the critical section (${!S.flag[j] ? `flag[${j}] = false` : `turn = ${i}`}).`; }
      } else if (pc === 4) { S.pc[i] = 5; S.msg = `P${i} leaves the critical section.`; }
      else if (pc === 5) { S.flag[i] = false; S.pc[i] = 6; S.msg = `P${i}: flag[${i}] = false — lets P${j} enter.`; }
    }
    const body = h('div');
    el.append(body);
    function draw() {
      body.innerHTML = '';
      const cols = h('div', { class: 'cols' });
      [0, 1].forEach(i => {
        const box = h('div', { class: 'code-view', style: { padding: '8px 0' } });
        code(i).forEach((ln, k) => box.append(h('div', { class: 'code-line' + (k === S.pc[i] ? ' cur' : '') }, h('span', { class: 'ln', text: String(k + 1) }), h('span', { html: OS.highlight(ln, 'c') }))));
        const b = h('button', { class: 'btn sm primary', type: 'button', text: `Step P${i}` });
        b.onclick = () => { step(i); draw(); };
        const inCS = S.pc[i] === 4 || S.pc[i] === 5;
        cols.append(h('div', {}, h('div', { class: 'row', style: { marginBottom: '6px' } }, h('b', { text: 'P' + i }), inCS ? h('span', { class: 'tag acc', text: 'in critical section' }) : null), box, h('div', { style: { marginTop: '8px' } }, b)));
      });
      body.append(cols);
      body.append(h('div', { class: 'vars', style: { marginTop: '12px' } },
        h('div', { class: 'var' }, h('small', { text: 'flag[0]' }), h('b', { text: String(S.flag[0]) })),
        h('div', { class: 'var' }, h('small', { text: 'flag[1]' }), h('b', { text: String(S.flag[1]) })),
        h('div', { class: 'var' }, h('small', { text: 'turn' }), h('b', { text: String(S.turn) }))));
      const both = (S.pc[0] === 4 || S.pc[0] === 5) && (S.pc[1] === 4 || S.pc[1] === 5);
      body.append(h('div', { class: 'viz-result ' + (both ? 'bad' : ''), html: S.msg }));
      const rnd = h('button', { class: 'btn sm', type: 'button', text: 'Random step' });
      rnd.onclick = () => { step(Math.random() < .5 ? 0 : 1); draw(); };
      const rs = h('button', { class: 'btn sm ghost', type: 'button', text: 'Reset' });
      rs.onclick = () => { reset(); draw(); };
      body.append(h('div', { class: 'row', style: { marginTop: '10px' } }, rnd, rs));
    }
    draw();
  };

  /* ---------- counting semaphore ---------- */
  OS.viz.semaphore = function (el, p) {
    const N = p.value || 3, label = p.label || 'resources', nP = Math.min(p.procs || 6, 10);
    let S, procs, slots, queue, msg;
    const reset = () => {
      S = N; slots = Array(N).fill(null); queue = [];
      procs = Array.from({ length: nP }, (_, i) => ({ name: 'P' + (i + 1), st: 'idle', slot: null }));
      msg = `The semaphore is initialized to ${N} (= the number of ${label}).`;
    };
    reset();
    const grab = pr => { const k = slots.indexOf(null); slots[k] = pr.name; pr.slot = k; pr.st = 'using'; };
    function wait(pr) {
      S--;
      if (S < 0) { pr.st = 'blocked'; queue.push(pr); msg = `${pr.name}: wait() → S = ${S} &lt; 0 → the process <b>blocks</b> and joins the semaphore queue.`; }
      else { grab(pr); msg = `${pr.name}: wait() → S = ${S} ≥ 0 → it gets resource #${pr.slot + 1}.`; }
    }
    function signal(pr) {
      slots[pr.slot] = null; pr.slot = null; pr.st = 'idle'; S++;
      if (S <= 0) { const w = queue.shift(); grab(w); msg = `${pr.name}: signal() → S = ${S} ≤ 0 → <b>wakeup(${w.name})</b> from the queue; it gets resource #${w.slot + 1}.`; }
      else msg = `${pr.name}: signal() → S = ${S}, the queue is empty.`;
    }
    const body = h('div');
    el.append(body);
    function draw() {
      body.innerHTML = '';
      const top = h('div', { class: 'row', style: { gap: '18px', alignItems: 'center' } },
        h('div', {}, h('div', { class: 'small muted', text: 'S.value' }), h('div', { class: 'big-num', text: String(S), style: { color: S < 0 ? 'var(--bad)' : 'var(--text)' } })),
        h('div', { class: 'row' }, ...slots.map((s, i) => h('div', { class: 'slot' + (s ? ' busy' : '') , html: `${label.replace(/s$/, '')} ${i + 1}<br>${s ? '<b>' + s + '</b>' : '—'}` }))),
        h('div', {}, h('div', { class: 'small muted', text: 'waiting queue (S.list)' }), h('div', { class: 'queue-row' }, ...(queue.length ? queue.map(q => h('span', { class: 'pill tone-bad', text: q.name })) : [h('span', { class: 'small muted', text: 'empty' })]))));
      body.append(top);
      const cards = h('div', { class: 'row', style: { marginTop: '14px' } });
      procs.forEach(pr => {
        const b = pr.st === 'idle' ? h('button', { class: 'btn sm', type: 'button', text: 'wait()' }) : pr.st === 'using' ? h('button', { class: 'btn sm primary', type: 'button', text: 'signal()' }) : h('button', { class: 'btn sm', type: 'button', text: 'blocked', disabled: true });
        b.onclick = () => { if (pr.st === 'idle') wait(pr); else if (pr.st === 'using') signal(pr); draw(); };
        cards.append(h('div', { class: 'proc-card st-' + pr.st }, h('b', { text: pr.name }), h('span', { class: 'st', text: pr.st === 'using' ? 'using #' + (pr.slot + 1) : pr.st === 'blocked' ? 'blocked' : 'not using' }), b));
      });
      body.append(cards);
      const rs = h('button', { class: 'btn sm ghost', type: 'button', text: 'Reset' });
      rs.onclick = () => { reset(); draw(); };
      body.append(h('div', { class: 'viz-result', html: msg + (S < 0 ? ` &nbsp;|S| = ${-S} = number of waiting processes.` : '') }), h('div', { style: { marginTop: '8px' } }, rs));
    }
    draw();
  };

  /* ---------- dining philosophers ---------- */
  OS.viz.philosophers = function (el, p) {
    const n = p.n || 5;
    let mode = 'sem', ph, chop, msg;
    const reset = () => {
      ph = Array.from({ length: n }, () => ({ st: 'thinking', left: false, right: false }));
      chop = Array(n).fill(null);
      msg = mode === 'sem' ? 'Each chopstick is a semaphore. A philosopher takes the left one first (chopstick[i]), then the right one (chopstick[(i+1)%5]). Click the philosophers.' : 'Monitor: a philosopher eats only if neither neighbour is eating (test(i)) and takes both chopsticks at once. Click the philosophers.';
    };
    const L = i => i, R = i => (i + 1) % n;
    function clickSem(i) {
      const f = ph[i];
      if (f.st === 'thinking') { f.st = 'hungry'; msg = `P${i} is hungry.`; }
      else if (f.st === 'hungry') {
        if (!f.left) {
          if (chop[L(i)] == null) { chop[L(i)] = i; f.left = true; msg = `P${i}: wait(chopstick[${L(i)}]) — took the left one.`; }
          else msg = `P${i} waits for the left chopstick ${L(i)} (held by P${chop[L(i)]}).`;
        } else if (!f.right) {
          if (chop[R(i)] == null) { chop[R(i)] = i; f.right = true; f.st = 'eating'; msg = `P${i}: wait(chopstick[${R(i)}]) — took the right one and eats.`; }
          else msg = `P${i} holds the left chopstick and waits for the right one ${R(i)} (held by P${chop[R(i)]}).`;
        }
      } else if (f.st === 'eating') { chop[L(i)] = chop[R(i)] = null; f.left = f.right = false; f.st = 'thinking'; msg = `P${i}: signal() on both chopsticks, thinking.`; }
    }
    function test(i) {
      const f = ph[i];
      if (f.st === 'hungry' && ph[(i + n - 1) % n].st !== 'eating' && ph[(i + 1) % n].st !== 'eating') {
        f.st = 'eating'; chop[L(i)] = chop[R(i)] = i; f.left = f.right = true; return true;
      }
      return false;
    }
    function clickMon(i) {
      const f = ph[i];
      if (f.st === 'thinking') { f.st = 'hungry'; msg = test(i) ? `pickup(${i}): neighbours are not eating → P${i} eats.` : `pickup(${i}): a neighbour is eating → P${i} waits (self[${i}].wait()).`; }
      else if (f.st === 'eating') {
        f.st = 'thinking'; f.left = f.right = false; chop[L(i)] = chop[R(i)] = null;
        const a = test((i + n - 1) % n), b = test((i + 1) % n);
        msg = `putdown(${i}): test(${(i + n - 1) % n}) and test(${(i + 1) % n})` + (a || b ? ' → woke up a neighbour, who now eats.' : '.');
      } else msg = `P${i} waits: a neighbour is eating.`;
    }
    const deadlocked = () => mode === 'sem' && ph.every(f => f.st === 'hungry' && f.left && !f.right);
    const body = h('div');
    const ctr = h('div', { class: 'viz-controls' }, OS.seg([['sem', 'Semaphores (naive)'], ['mon', 'Monitor']], mode, v => { mode = v; reset(); draw(); }));
    const allLeft = h('button', { class: 'btn sm', type: 'button', text: 'Everyone takes the left one at once' });
    allLeft.onclick = () => { mode = 'sem'; reset(); ph.forEach((f, i) => { f.st = 'hungry'; f.left = true; chop[i] = i; }); msg = 'Everyone took the left chopstick and waits for the right one…'; draw(); };
    const rs = h('button', { class: 'btn sm ghost', type: 'button', text: 'Reset' });
    rs.onclick = () => { reset(); draw(); };
    ctr.append(allLeft, rs);
    el.append(ctr, body);
    reset();
    function draw() {
      allLeft.classList.toggle('hidden', mode !== 'sem');
      ctr.querySelectorAll('.seg button').forEach((b, k) => b.classList.toggle('on', (k === 0) === (mode === 'sem')));
      body.innerHTML = '';
      const W = 400, C = 200, RP = 140, RC = 82;
      const svg = svgEl('svg', { class: 'd', viewBox: `0 0 ${W} ${W}` });
      svg.style.maxWidth = '380px'; svg.style.margin = '0 auto';
      svg.append(svgEl('circle', { cx: C, cy: C, r: 70, class: 'n-shape tone-muted' }));
      svg.append(svgEl('text', { x: C, y: C, 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'sm' }, '🍚 rice'));
      const ang = k => -Math.PI / 2 + (2 * Math.PI * k) / n;
      for (let c = 0; c < n; c++) {
        const a = ang(c + 0.5);
        const x1 = C + Math.cos(a) * (RC - 18), y1 = C + Math.sin(a) * (RC - 18), x2 = C + Math.cos(a) * (RC + 18), y2 = C + Math.sin(a) * (RC + 18);
        let x1b = x1, y1b = y1, x2b = x2, y2b = y2;
        if (chop[c] != null) { const ha = ang(chop[c]); const dx = Math.cos(ha) * 34, dy = Math.sin(ha) * 34; const mx = (x1 + x2) / 2, my = (y1 + y2) / 2; x1b = mx + dx - Math.cos(a) * 14; y1b = my + dy - Math.sin(a) * 14; x2b = mx + dx + Math.cos(a) * 14; y2b = my + dy + Math.sin(a) * 14; }
        svg.append(svgEl('line', { x1: x1b, y1: y1b, x2: x2b, y2: y2b, class: 'e-line ' + (chop[c] != null ? 'tone-acc' : 'tone-muted'), 'stroke-width': 5, 'stroke-linecap': 'round', style: 'marker-end:none' }));
        svg.append(svgEl('text', { x: C + Math.cos(a) * (RC + 34), y: C + Math.sin(a) * (RC + 34), 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'sm mono' }, 'c' + c));
      }
      ph.forEach((f, i) => {
        const a = ang(i), x = C + Math.cos(a) * RP, y = C + Math.sin(a) * RP;
        const g = svgEl('g', { class: 'node', style: 'cursor:pointer' });
        g.append(svgEl('circle', { cx: x, cy: y, r: 30, class: 'n-shape ' + (f.st === 'eating' ? 'tone-ok' : f.st === 'hungry' ? (deadlocked() ? 'tone-bad' : 'tone-warn') : '') }));
        g.append(svgEl('text', { x, y: y - 7, 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'b' }, 'P' + i));
        g.append(svgEl('text', { x, y: y + 10, 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'sm' }, f.st));
        g.addEventListener('click', () => { if (mode === 'sem') clickSem(i); else clickMon(i); draw(); });
        svg.append(g);
      });
      body.append(svg);
      const dl = deadlocked();
      body.append(h('div', { class: 'viz-result ' + (dl ? 'bad' : ''), html: dl ? '<b>DEADLOCK</b>: everyone holds the left chopstick and waits forever for the right one — <b>circular wait</b>. Remedies: at most 4 philosophers at the table; pick up chopsticks only if both are free (inside a critical section); asymmetry — odd philosophers take the left first, even ones the right first.' : msg }));
      body.append(h('div', { class: 'legend' }, h('span', {}, h('i', { class: 'tone-none' }), 'thinking'), h('span', {}, h('i', { class: 'tone-warn' }), 'hungry'), h('span', {}, h('i', { class: 'tone-ok' }), 'eating'), h('span', {}, h('i', { class: 'tone-acc' }), 'chopstick taken')));
    }
    draw();
  };

  /* ---------- Banker's algorithm ---------- */
  OS.viz.banker = function (el, p) {
    const res = p.res || ['A', 'B', 'C'];
    const names = p.names || p.alloc.map((_, i) => 'T' + i);
    const orig = { available: p.available.slice(), max: p.max.map(r => r.slice()), alloc: p.alloc.map(r => r.slice()) };
    let D, work, finish, seq, msg;
    const need = () => D.max.map((r, i) => r.map((v, k) => v - D.alloc[i][k]));
    const le = (a, b) => a.every((v, k) => v <= b[k]);
    const vec = a => '(' + a.join(', ') + ')';
    const resetSafety = () => { work = D.available.slice(); finish = names.map(() => false); seq = []; msg = 'Work = Available = ' + vec(work) + '. Find a thread with Need ≤ Work (click its row) or press "Safety step".'; };
    const resetAll = () => { D = JSON.parse(JSON.stringify(orig)); resetSafety(); };
    resetAll();
    function runFull(state) {
      const N = state.max.map((r, i) => r.map((v, k) => v - state.alloc[i][k]));
      const w = state.available.slice(), f = names.map(() => false), s = [];
      let last = -1;
      for (let iter = 0; iter < names.length; iter++) {
        let found = -1;
        for (let d = 1; d <= names.length; d++) { const i = (last + d) % names.length; if (!f[i] && le(N[i], w)) { found = i; break; } }
        if (found < 0) break;
        f[found] = true; s.push(found); state.alloc[found].forEach((v, k) => { w[k] += v; }); last = found;
      }
      return { safe: f.every(Boolean), seq: s };
    }
    function finishThread(i) {
      const N = need();
      if (finish[i]) { msg = `${names[i]} has already finished.`; return; }
      if (!le(N[i], work)) { msg = `${names[i]}: Need ${vec(N[i])} > Work ${vec(work)} — it cannot finish now.`; return; }
      const before = work.slice();
      D.alloc[i].forEach((v, k) => { work[k] += v; });
      finish[i] = true; seq.push(i);
      msg = `${names[i]}: Need ${vec(N[i])} ≤ Work ${vec(before)} → it can finish and returns its Allocation ${vec(D.alloc[i])}. Work = ${vec(work)}.`;
      if (finish.every(Boolean)) msg += ` <b>All threads finished → the state is SAFE</b>, safe sequence: &lt;${seq.map(k => names[k]).join(', ')}&gt;.`;
    }
    function autoStep() {
      const N = need();
      const last = seq.length ? seq[seq.length - 1] : -1;
      for (let d = 1; d <= names.length; d++) { const i = (last + d) % names.length; if (!finish[i] && le(N[i], work)) return finishThread(i); }
      msg = finish.every(Boolean) ? msg : `No unfinished thread has Need ≤ Work ${vec(work)} → the state is <b>UNSAFE</b>.`;
    }
    const body = h('div');
    el.append(body);
    const reqWho = h('select');
    names.forEach((n, i) => reqWho.append(h('option', { value: i, text: n })));
    if (p.request) reqWho.value = p.request.who;
    const reqVec = res.map((r, k) => h('input', { type: 'number', min: 0, value: p.request ? p.request.vec[k] : 0 }));
    const reqBtn = h('button', { class: 'btn sm primary', type: 'button', text: 'Check request' });
    const reqRes = h('div');
    reqBtn.onclick = () => {
      const i = +reqWho.value, R = reqVec.map(x => Math.max(0, +x.value || 0)), N = need();
      let html;
      if (!le(R, N[i])) html = `<b>Error</b>: Request ${vec(R)} &gt; Need ${vec(N[i])} — the thread exceeded its declared maximum.`;
      else if (!le(R, D.available)) html = `Request ${vec(R)} &gt; Available ${vec(D.available)} → ${names[i]} must <b>wait</b>.`;
      else {
        const st = JSON.parse(JSON.stringify(D));
        st.available = st.available.map((v, k) => v - R[k]);
        st.alloc[i] = st.alloc[i].map((v, k) => v + R[k]);
        const r = runFull(st);
        html = `1) Request ≤ Need ✓ 2) Request ≤ Available ✓ 3) Pretend to allocate: Available = ${vec(st.available)}, Allocation[${names[i]}] = ${vec(st.alloc[i])}. ` +
          (r.safe ? `Safety algorithm: <b>SAFE</b> (&lt;${r.seq.map(k => names[k]).join(', ')}&gt;) → the request is <b>granted</b>.` : `Safety algorithm: <b>UNSAFE</b> → the request is <b>denied</b>; the old state is restored and the thread waits.`);
        reqRes.dataset.apply = r.safe ? JSON.stringify(st) : '';
      }
      reqRes.innerHTML = '';
      reqRes.append(h('div', { class: 'viz-result ' + (/SAFE<\/b> \(/.test(html) ? 'ok' : 'bad'), html }));
      if (reqRes.dataset.apply) {
        const ap = h('button', { class: 'btn sm', type: 'button', text: 'Apply the request to the table' });
        ap.onclick = () => { D = JSON.parse(reqRes.dataset.apply); reqRes.dataset.apply = ''; reqRes.innerHTML = ''; resetSafety(); draw(); };
        reqRes.append(h('div', { style: { marginTop: '8px' } }, ap));
      }
    };
    function draw() {
      body.innerHTML = '';
      const N = need();
      const t = h('table', { class: 'vt' });
      const hdr = (label) => h('th', { colspan: res.length, text: label });
      t.append(h('tr', {}, h('th', { rowspan: 2, text: 'Thread' }), hdr('Allocation'), hdr('Max'), hdr('Need = Max − Alloc'), h('th', { rowspan: 2, text: 'Finish' })));
      t.append(h('tr', {}, ...[0, 1, 2].flatMap(() => res.map(r => h('th', { text: r })))));
      names.forEach((nm, i) => {
        const cell = (arr, k, key) => {
          const inp = h('input', { type: 'number', min: 0, value: arr[k] });
          inp.addEventListener('change', () => { D[key][i][k] = Math.max(0, +inp.value || 0); resetSafety(); draw(); });
          return h('td', {}, inp);
        };
        const can = !finish[i] && le(N[i], work);
        const tr = h('tr', { style: { cursor: 'pointer', background: finish[i] ? 'var(--ok-soft)' : can ? 'var(--acc-soft)' : '' } },
          h('td', { html: `<b>${nm}</b>` }), ...res.map((_, k) => cell(D.alloc[i], k, 'alloc')), ...res.map((_, k) => cell(D.max[i], k, 'max')),
          ...res.map((_, k) => h('td', { html: `<b style="color:${N[i][k] < 0 ? 'var(--bad)' : 'inherit'}">${N[i][k]}</b>` })), h('td', { text: finish[i] ? '✓' : '' }));
        tr.addEventListener('click', e => { if (e.target.tagName === 'INPUT') return; finishThread(i); draw(); });
        t.append(tr);
      });
      const avRow = h('tr', {}, h('td', { html: '<b>Available</b>' }));
      D.available.forEach((v, k) => {
        const inp = h('input', { type: 'number', min: 0, value: v });
        inp.addEventListener('change', () => { D.available[k] = Math.max(0, +inp.value || 0); resetSafety(); draw(); });
        avRow.append(h('td', {}, inp));
      });
      avRow.append(h('td', { colspan: res.length * 2 + 1, class: 'l', html: `Work = <b class="mono">${vec(work)}</b>` }));
      t.append(avRow);
      body.append(h('div', { class: 'tbl-wrap' }, t));
      const bStep = h('button', { class: 'btn sm primary', type: 'button', text: 'Safety step' });
      bStep.onclick = () => { autoStep(); draw(); };
      const bAll = h('button', { class: 'btn sm', type: 'button', text: 'Run to the end' });
      bAll.onclick = () => { for (let k = 0; k < names.length && !finish.every(Boolean); k++) { const before = seq.length; autoStep(); if (seq.length === before) break; } draw(); };
      const bReset = h('button', { class: 'btn sm ghost', type: 'button', text: 'Reset safety' });
      bReset.onclick = () => { resetSafety(); draw(); };
      const bOrig = h('button', { class: 'btn sm ghost', type: 'button', text: 'Original data' });
      bOrig.onclick = () => { resetAll(); reqRes.innerHTML = ''; draw(); };
      body.append(h('div', { class: 'row', style: { margin: '10px 0' } }, bStep, bAll, bReset, bOrig,
        h('span', { class: 'chips' }, ...seq.map(k => h('span', { class: 'chip tone-ok', text: names[k] })))));
      body.append(h('div', { class: 'viz-result ' + (finish.every(Boolean) ? 'ok' : /UNSAFE/.test(msg) ? 'bad' : ''), html: msg }));
      body.append(h('div', { class: 'small muted', style: { marginTop: '6px' }, text: 'A safe sequence need not be unique: any order in which each next thread fits into Work is correct.' }));
      body.append(h('div', { style: { marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed var(--border)' } },
        h('div', { class: 'small', style: { fontWeight: 600, marginBottom: '8px' }, text: 'Resource-request algorithm' }),
        h('div', { class: 'viz-controls' }, h('label', {}, 'Thread', reqWho), h('label', {}, 'Request', ...reqVec), reqBtn), reqRes));
    }
    draw();
  };
})();
