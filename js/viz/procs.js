/* Processes & threads: procStates, forkTree, threadModels, amdahl */
(function () {
  'use strict';
  const { h, svgEl, fmt } = OS;

  /* ---------- process states ---------- */
  OS.viz.procStates = function (el, p) {
    const D = !!p.decisions;
    const spec = {
      w: 660, h: 320,
      nodes: [
        { id: 'new', label: 'new', x: 70, y: 40, shape: 'pill', w: 96, h: 38 },
        { id: 'terminated', label: 'terminated', x: 590, y: 40, shape: 'pill', w: 124, h: 38 },
        { id: 'ready', label: 'ready', x: 150, y: 152, w: 110, h: 46 },
        { id: 'running', label: 'running', x: 510, y: 152, w: 110, h: 46 },
        { id: 'waiting', label: 'waiting', x: 330, y: 288, w: 110, h: 46 }
      ],
      edges: [
        { from: 'new', to: 'ready', label: 'admitted' },
        { from: 'ready', to: 'running', label: 'scheduler dispatch', bend: -22 },
        { from: 'running', to: 'ready', label: D ? '(2) interrupt' : 'interrupt', bend: -22 },
        { from: 'running', to: 'waiting', label: D ? '(1) I/O or event wait' : 'I/O or event wait' },
        { from: 'waiting', to: 'ready', label: D ? '(3) I/O or event\ncompletion' : 'I/O or event\ncompletion' },
        { from: 'running', to: 'terminated', label: D ? '(4) exit' : 'exit' }
      ]
    };
    const box = h('div');
    el.append(box);
    const g = OS.viz.graph(box, spec);
    const EV = {
      new: [['admit', 'admitted', 'ready', 'ОС приняла процесс: PCB создан, процесс в ready queue.']],
      ready: [['dispatch', 'scheduler dispatch', 'running', 'Scheduler выбрал процесс, dispatcher передал ему CPU.']],
      running: [
        ['int', 'interrupt', 'ready', (D ? '(2) ' : '') + 'Прерывание (например, истёк квант таймера) — процесс вытеснен обратно в ready.'],
        ['io', 'I/O or event wait', 'waiting', (D ? '(1) ' : '') + 'Процесс запросил I/O или ждёт событие — уходит в waiting.'],
        ['exit', 'exit', 'terminated', (D ? '(4) ' : '') + 'Процесс завершился (exit()).']
      ],
      waiting: [['done', 'I/O or event completion', 'ready', (D ? '(3) ' : '') + 'I/O завершён / событие произошло — процесс снова готов.']],
      terminated: [['reset', 'начать заново', 'new', 'Новый процесс создан.']]
    };
    let cur = 'new';
    const btns = h('div', { class: 'proc-btns', style: { marginTop: '10px' } });
    const log = h('div', { class: 'viz-result' });
    el.append(btns, log);
    function paint() {
      Object.entries(g.nodes).forEach(([id, ng]) => {
        const sh = ng.querySelector('.n-shape');
        sh.setAttribute('class', 'n-shape ' + (id === cur ? 'tone-acc' : id === 'terminated' && cur === 'terminated' ? 'tone-muted' : ''));
      });
      btns.innerHTML = '';
      btns.append(h('span', { class: 'small muted', style: { alignSelf: 'center' }, html: 'Состояние: <b>' + cur + '</b> · событие:' }));
      EV[cur].forEach(([, label, to, text]) => {
        const b = h('button', { class: 'btn sm', type: 'button', text: label });
        b.onclick = () => { cur = to; log.innerHTML = text; paint(); };
        btns.append(b);
      });
    }
    log.textContent = 'Нажимай события и смотри, как процесс переходит между состояниями.';
    paint();
  };

  /* ---------- fork tree ---------- */
  OS.viz.forkTree = function (el, p) {
    const max = Math.min(p.max || 5, 6);
    let n = Math.min(p.n || 3, max);
    const input = h('input', { type: 'range', min: 1, max, value: n });
    const val = h('b', { class: 'mono' });
    const ctr = h('div', { class: 'viz-controls' }, h('label', {}, 'Число fork()', input, val));
    const codeBox = h('pre', { class: 'code', 'data-lang': 'c', style: { margin: '0 0 10px' } });
    const svgBox = h('div');
    const res = h('div', { class: 'viz-result' });
    el.append(ctr, codeBox, svgBox, res);
    input.addEventListener('input', () => { n = +input.value; draw(); });
    function draw() {
      val.textContent = n;
      const code = 'int main() {\n' + Array.from({ length: n }, () => '    fork();').join('\n') + '\n    printf("hello\\n");\n    return 0;\n}';
      codeBox.innerHTML = OS.highlight(code, 'c');
      // build processes: process created at fork k executes forks k+1..n
      const nodes = [];
      let counter = 0;
      function make(k, L, parent) {
        const node = { id: counter++, k, L, parent, x: L + 0.5 };
        nodes.push(node);
        let off = L + 1;
        for (let j = k + 1; j <= n; j++) { make(j, off, node); off += 2 ** (n - j); }
        return node;
      }
      make(0, 0, null);
      // rename by row (creation order)
      const byRow = [...nodes].sort((a, b) => a.k - b.k || a.L - b.L);
      byRow.forEach((nd, i) => { nd.name = 'P' + i; });
      const cols = 2 ** n, colW = 40, rowH = 62;
      const W = Math.max(cols * colW, 200), H = (n + 1) * rowH;
      const svg = svgEl('svg', { class: 'd', viewBox: `0 -6 ${W} ${H}` });
      svg.style.maxWidth = Math.min(W, 860) + 'px';
      svg.style.margin = '0 auto';
      const X = nd => nd.x * colW, Y = nd => nd.k * rowH + 22;
      nodes.forEach(nd => {
        if (nd.parent) svg.append(svgEl('path', { d: `M${X(nd.parent)},${Y(nd.parent) + 13} L${X(nd)},${Y(nd) - 14}`, class: 'e-line tone-muted' }));
      });
      for (let r = 1; r <= n; r++) svg.append(svgEl('text', { x: 2, y: r * rowH + 2, class: 'sm' }, `fork #${r}`));
      nodes.forEach(nd => {
        const gg = svgEl('g', { class: 'node' });
        gg.append(svgEl('circle', { cx: X(nd), cy: Y(nd), r: 14, class: 'n-shape ' + (nd.k === 0 ? 'tone-acc' : 'tone-c' + ((nd.k % 6) + 1)) }));
        gg.append(svgEl('text', { x: X(nd), y: Y(nd), 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'sm b' }, nd.name));
        svg.append(gg);
      });
      svgBox.innerHTML = '';
      svgBox.append(svg);
      res.innerHTML = `Процессов всего: <b>2<sup>${n}</sup> = ${2 ** n}</b> (создано новых: ${2 ** n - 1}). Строка <code>hello</code> напечатана <b>${2 ** n}</b> ${OS.plural(2 ** n, 'раз', 'раза', 'раз')}. На каждом fork() число процессов удваивается.`;
    }
    draw();
  };

  /* ---------- thread models ---------- */
  OS.viz.threadModels = function (el, p) {
    const MODELS = [['m1', 'Many-to-One'], ['11', 'One-to-One'], ['mm', 'Many-to-Many'], ['2l', 'Two-level']];
    const INFO = {
      m1: 'Много user threads → <b>один</b> kernel thread. Управление потоками в user space (быстро), но блокирующий system call <b>блокирует весь процесс</b>; потоки <b>не выполняются параллельно</b> на multicore. Примеры: Solaris Green Threads, GNU Portable Threads.',
      11: 'Каждый user thread → <b>свой</b> kernel thread. Больше concurrency, блокировка одного не мешает другим, настоящий параллелизм. Минус: создание user thread = создание kernel thread (overhead), число потоков может ограничиваться. Примеры: Windows, Linux.',
      mm: 'Много user threads мультиплексируются на <b>меньшее или равное</b> число kernel threads. ОС создаёт достаточно kernel threads; нет минусов M:1 и 1:1. Сложно реализовать, встречается редко (Windows с ThreadFiber).',
      '2l': 'Как Many-to-Many, но дополнительно позволяет <b>привязать (bind)</b> user thread к отдельному kernel thread.'
    };
    let model = p.model || 'm1';
    const svgBox = h('div');
    const info = h('div', { class: 'viz-result' });
    el.append(h('div', { class: 'viz-controls' }, OS.seg(MODELS, model, v => { model = v; draw(); })), svgBox, info);
    function draw() {
      const W = 520, H = 210;
      const svg = svgEl('svg', { class: 'd', viewBox: `0 0 ${W} ${H}` });
      svg.style.maxWidth = '560px'; svg.style.margin = '0 auto';
      const uN = 4, kN = model === 'm1' ? 1 : model === '11' ? 4 : 3;
      const ux = i => 90 + i * ((W - 180) / (uN - 1));
      const kx = i => (kN === 1 ? W / 2 : 120 + i * ((W - 240) / (kN - 1)));
      const uy = 40, ky = 168;
      const line = (x1, x2, strong) => svg.append(svgEl('path', { d: `M${x1},${uy + 16} L${x2},${ky - 17}`, class: 'e-line ' + (strong ? 'tone-acc' : 'tone-muted') }));
      if (model === 'm1') for (let i = 0; i < uN; i++) line(ux(i), kx(0));
      if (model === '11') for (let i = 0; i < uN; i++) line(ux(i), kx(i), true);
      if (model === 'mm' || model === '2l') {
        const pool = model === '2l' ? 3 : 4;
        for (let i = 0; i < pool; i++) for (let j = 0; j < (model === '2l' ? 2 : kN); j++) line(ux(i), kx(j));
        if (model === '2l') line(ux(3), kx(2), true);
      }
      svg.append(svgEl('text', { x: 8, y: uy + 4, class: 'sm' }, 'user'), svgEl('text', { x: 8, y: ky + 4, class: 'sm' }, 'kernel'));
      for (let i = 0; i < uN; i++) {
        svg.append(svgEl('path', { d: `M${ux(i) - 8},${uy - 14} q 8,7 0,14 q -8,7 0,14`, class: 'e-line tone-acc', style: 'marker-end:none' }));
        svg.append(svgEl('text', { x: ux(i) + 14, y: uy + 2, class: 'sm' }, 'U' + (i + 1)));
      }
      for (let j = 0; j < kN; j++) {
        svg.append(svgEl('circle', { cx: kx(j), cy: ky, r: 16, class: 'n-shape tone-warn' }));
        svg.append(svgEl('text', { x: kx(j), y: ky, 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'sm b' }, 'K'));
      }
      svgBox.innerHTML = '';
      svgBox.append(svg);
      info.innerHTML = INFO[model];
    }
    draw();
  };

  /* ---------- Amdahl ---------- */
  OS.viz.amdahl = function (el, p) {
    let S = p.s != null ? p.s : 0.25, N = p.n || 4;
    const sp = (s, n) => 1 / (s + (1 - s) / n);
    const sIn = h('input', { type: 'range', min: 0, max: 100, value: Math.round(S * 100) });
    const nIn = h('input', { type: 'range', min: 1, max: 64, value: N });
    const sV = h('b', { class: 'mono' }), nV = h('b', { class: 'mono' });
    const ctr = h('div', { class: 'viz-controls' }, h('label', {}, 'S (serial)', sIn, sV), h('label', {}, 'N (cores)', nIn, nV));
    const formula = h('div', { class: 'formula' });
    const chart = h('div');
    el.append(ctr, formula, chart);
    sIn.addEventListener('input', () => { S = +sIn.value / 100; draw(); });
    nIn.addEventListener('input', () => { N = +nIn.value; draw(); });
    function draw() {
      sV.textContent = Math.round(S * 100) + '%';
      nV.textContent = N;
      const v = sp(S, N);
      formula.innerHTML = `speedup ≤ 1 / (S + (1 − S) / N) = 1 / (${fmt(S)} + ${fmt(1 - S)} / ${N}) = <b>${fmt(v)}</b>` +
        (S > 0 ? ` &nbsp;·&nbsp; при N → ∞ предел = 1 / S = <b>${fmt(1 / S)}</b>` : ' &nbsp;·&nbsp; S = 0: идеальное линейное ускорение');
      const W = 560, H = 250, L = 40, B = 30, T = 10, R = 12;
      const xMax = 64;
      const yMax = Math.max(4, Math.ceil(Math.min(xMax, Math.max(sp(S, xMax), sp(0.05, xMax))) / 4) * 4);
      const X = n => L + ((n - 1) / (xMax - 1)) * (W - L - R);
      const Y = y => H - B - (Math.min(y, yMax) / yMax) * (H - B - T);
      const svg = svgEl('svg', { class: 'd', viewBox: `0 0 ${W} ${H}` });
      svg.style.maxWidth = '620px';
      for (let y = 0; y <= yMax; y += yMax / 4) {
        svg.append(svgEl('line', { x1: L, x2: W - R, y1: Y(y), y2: Y(y), class: 'grid' }));
        svg.append(svgEl('text', { x: L - 6, y: Y(y) + 4, 'text-anchor': 'end', class: 'sm mono' }, fmt(y, 1)));
      }
      [1, 8, 16, 32, 48, 64].forEach(n => svg.append(svgEl('text', { x: X(n), y: H - 10, 'text-anchor': 'middle', class: 'sm mono' }, n)));
      svg.append(svgEl('text', { x: W - R, y: H - B - 6, 'text-anchor': 'end', class: 'sm' }, 'cores →'));
      const curve = (s, cls) => {
        let d = '';
        for (let n = 1; n <= xMax; n++) d += (n === 1 ? 'M' : 'L') + X(n) + ',' + Y(sp(s, n));
        svg.append(svgEl('path', { d, class: cls, style: 'marker-end:none' }));
      };
      [0.05, 0.1, 0.25, 0.5].forEach(s => {
        if (Math.abs(s - S) < 0.005) return;
        curve(s, 'e-line tone-muted');
        svg.append(svgEl('text', { x: W - R - 2, y: Y(sp(s, xMax)) - 4, 'text-anchor': 'end', class: 'sm' }, 'S=' + s * 100 + '%'));
      });
      if (S > 0 && 1 / S <= yMax) svg.append(svgEl('line', { x1: L, x2: W - R, y1: Y(1 / S), y2: Y(1 / S), class: 'e-line dashed tone-bad', style: 'marker-end:none' }));
      curve(S, 'e-line tone-acc');
      svg.lastChild.setAttribute('stroke-width', '3');
      svg.append(svgEl('circle', { cx: X(N), cy: Y(v), r: 5, class: 'n-shape tone-acc' }));
      chart.innerHTML = '';
      chart.append(svg);
    }
    draw();
  };
})();
