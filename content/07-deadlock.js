OS.addModule({
  id: 'deadlock',
  num: 7,
  group: 'theory',
  title: 'Deadlocks',
  titleRu: 'Взаимоблокировки',
  icon: '🔁',
  sources: ['7-Deadlock.pdf'],
  summary: 'System model, 4 необходимых условия, Resource-Allocation Graph, prevention, avoidance (safe state, RAG с claim edges, Banker’s algorithm), detection (wait-for graph) и recovery.',
  sections: [
    {
      id: 'model',
      h: 'System Model и определение deadlock',
      html: `
<ul>
  <li>Система состоит из <b>ресурсов</b>: типы <b>R<sub>1</sub>, R<sub>2</sub>, …, R<sub>m</sub></b> — CPU cycles, memory space, I/O devices.</li>
  <li>У каждого типа R<sub>i</sub> есть <b>W<sub>i</sub> экземпляров (instances)</b>.</li>
  <li>Процесс использует ресурс по схеме: <b>request → use → release</b>.</li>
</ul>
<div class="callout key"><b>Deadlock</b> — ситуация, когда два или более процесса не могут продолжить работу, потому что <b>каждый ждёт, пока другой освободит ресурсы</b>.</div>
<div data-viz="0"></div>`,
      viz: [
        { name: 'graph', caption: 'Слайд «What is a deadlock»: P1 держит R1 и ждёт R2, P2 держит R2 и ждёт R1', props: {
          w: 560, h: 260,
          nodes: [
            { id: 'P1', label: 'P1', x: 110, y: 130, shape: 'circle', tone: 'bad' },
            { id: 'P2', label: 'P2', x: 450, y: 130, shape: 'circle', tone: 'bad' },
            { id: 'R1', label: 'R1', x: 280, y: 45, shape: 'res', inst: 1, w: 70, h: 40 },
            { id: 'R2', label: 'R2', x: 280, y: 215, shape: 'res', inst: 1, w: 70, h: 40 }],
          edges: [
            { from: 'R1', to: 'P1', label: 'assigned to' },
            { from: 'P1', to: 'R2', label: 'waiting for', tone: 'warn' },
            { from: 'R2', to: 'P2', label: 'assigned to' },
            { from: 'P2', to: 'R1', label: 'waiting for', tone: 'warn' }] } }
      ]
    },
    {
      id: 'sem-deadlock',
      h: 'Deadlock with Semaphores',
      html: `
<p>Данные: семафоры <code>S1 = 1</code>, <code>S2 = 1</code>, два потока T1 и T2 захватывают их в <b>разном порядке</b>.</p>
<div class="cols">
<pre class="code" data-lang="c">/* T1 */
wait(s1);
wait(s2);
...
signal(s2);
signal(s1);</pre>
<pre class="code" data-lang="c">/* T2 */
wait(s2);
wait(s1);
...
signal(s1);
signal(s2);</pre>
</div>
<ol>
  <li>T1 выполняет <code>wait(s1)</code> и вытесняется (preempted);</li>
  <li>T2 выполняет <code>wait(s2)</code> и <code>wait(s1)</code> → блокируется на s1;</li>
  <li>T1 выполняет <code>wait(s2)</code> → блокируется: s2 не будет освобождён T2, т.к. T2 ждёт s1, а его должен сначала отпустить T1;</li>
  <li>T1 и T2 в <b>deadlock</b>.</li>
</ol>
<div class="callout note">Deadlock <b>не возникает</b>, если T1 успеет выполнить и <code>wait(s1)</code>, и <code>wait(s2)</code> раньше T2 — это <b>зависит от OS scheduler</b>.</div>`,
      viz: [{ name: 'stepper', caption: 'Неудачное чередование T1 и T2', props: {
        lang: 'c',
        code: ['/* T1 */', 'wait(s1);', 'wait(s2);', '/* ... */', 'signal(s2);', 'signal(s1);', '', '/* T2 */', 'wait(s2);', 'wait(s1);', '/* ... */', 'signal(s1);', 'signal(s2);'].join('\n'),
        steps: [
          { line: 2, note: 'T1: wait(s1) → s1 = 0, T1 держит s1. Scheduler вытесняет T1.', vars: { s1: 0, s2: 1, T1: 'holds s1', T2: '—' } },
          { line: 9, note: 'T2: wait(s2) → s2 = 0, T2 держит s2.', vars: { s1: 0, s2: 0, T1: 'holds s1', T2: 'holds s2' } },
          { line: 10, note: 'T2: wait(s1) → s1 занят → T2 блокируется.', vars: { s1: 0, s2: 0, T1: 'holds s1', T2: 'holds s2, waits s1' } },
          { line: 3, note: 'T1: wait(s2) → s2 занят → T1 блокируется. Каждый ждёт другого → DEADLOCK.', vars: { s1: 0, s2: 0, T1: 'holds s1, waits s2', T2: 'holds s2, waits s1' } }
        ] } }],
      exam: 'Найти чередование, приводящее к deadlock, и объяснить, почему оно зависит от scheduler.'
    },
    {
      id: 'conditions',
      h: 'Deadlock Characterization — 4 необходимых условия',
      html: `
<p>Deadlock может возникнуть, только если <b>одновременно</b> выполняются все четыре условия:</p>
<table class="t">
  <tr><th>Условие</th><th>Смысл</th></tr>
  <tr><td><b>Mutual exclusion</b></td><td>ресурс может использовать только один поток одновременно</td></tr>
  <tr><td><b>Hold and wait</b></td><td>поток, удерживающий хотя бы один ресурс, ждёт дополнительные ресурсы, занятые другими потоками</td></tr>
  <tr><td><b>No preemption</b></td><td>ресурс освобождается только добровольно удерживающим потоком, после завершения его задачи</td></tr>
  <tr><td><b>Circular wait</b></td><td>существует набор {T<sub>0</sub>, T<sub>1</sub>, …, T<sub>n</sub>} ждущих потоков: T<sub>0</sub> ждёт ресурс, занятый T<sub>1</sub>, T<sub>1</sub> — занятый T<sub>2</sub>, …, T<sub>n−1</sub> — занятый T<sub>n</sub>, T<sub>n</sub> — занятый T<sub>0</sub></td></tr>
</table>
<div class="callout key">Условия <b>необходимые</b>: если хотя бы одно не выполняется — deadlock невозможен (на этом построена prevention).</div>`,
      exam: 'Перечислить 4 условия с определениями; узнать условие по описанию.'
    },
    {
      id: 'rag',
      h: 'Resource-Allocation Graph (RAG)',
      html: `
<p><b>Deadlock detection</b> — выяснение, не «застряли» ли процессы; один из способов — <b>Resource Allocation Graph</b>. Граф с множеством вершин <b>V</b> и рёбер <b>E</b>.</p>
<ul>
  <li><b>V</b> делится на два типа:
    <ul>
      <li><b>Thread Vertex</b>: T = {T<sub>1</sub>, …, T<sub>n</sub>} — все потоки системы (кружки);</li>
      <li><b>Resource Vertex</b>: R = {R<sub>1</sub>, …, R<sub>m</sub>} — все типы ресурсов (прямоугольники).</li>
    </ul></li>
  <li><b>E</b> двух типов:
    <ul>
      <li><b>Request Edge</b> — направленное ребро <b>T<sub>i</sub> → R<sub>j</sub></b> (поток запросил ресурс и ждёт);</li>
      <li><b>Assignment Edge</b> — направленное ребро <b>R<sub>j</sub> → T<sub>i</sub></b> (экземпляр ресурса выделен потоку).</li>
    </ul></li>
  <li>Resource vertex: <b>single instance</b> — прямоугольник с одной точкой; <b>multi-instance</b> — прямоугольник с несколькими точками (число точек = число экземпляров).</li>
</ul>
<div data-viz="0"></div>
<p><b>Example 1</b>: если в RAG есть <b>цикл</b> и каждый ресурс в цикле имеет <b>только один экземпляр</b> → процессы в deadlock.</p>
<div data-viz="1"></div>
<p><b>Example 2</b>: R<sub>1</sub> — 1 экземпляр, R<sub>2</sub> — 2, R<sub>3</sub> — 1, R<sub>4</sub> — 3.</p>
<ul>
  <li>T<sub>1</sub> держит один экземпляр R<sub>2</sub> и ждёт R<sub>1</sub>;</li>
  <li>T<sub>2</sub> держит один R<sub>1</sub>, один R<sub>2</sub> и ждёт R<sub>3</sub>;</li>
  <li>T<sub>3</sub> держит один R<sub>3</sub>.</li>
</ul>
<div data-viz="2"></div>
<div class="callout note">Циклов нет → deadlock нет: T<sub>3</sub> завершится и освободит R<sub>3</sub> → его получит T<sub>2</sub>, завершится и освободит R<sub>1</sub> → его получит T<sub>1</sub>.</div>`,
      viz: [
        { name: 'graph', caption: 'Типы рёбер: request, assignment (и claim — для avoidance); ресурс с 1 и с 3 экземплярами', props: {
          w: 620, h: 220,
          nodes: [
            { id: 'Ta', label: 'T', x: 80, y: 45, shape: 'circle' }, { id: 'Ra', label: 'R', x: 80, y: 175, shape: 'res', inst: 1, w: 70, h: 40 },
            { id: 'Tb', label: 'T', x: 240, y: 45, shape: 'circle' }, { id: 'Rb', label: 'R', x: 240, y: 175, shape: 'res', inst: 1, w: 70, h: 40 },
            { id: 'Tc', label: 'T', x: 400, y: 45, shape: 'circle' }, { id: 'Rc', label: 'R', x: 400, y: 175, shape: 'res', inst: 1, w: 70, h: 40 },
            { id: 'Rm', label: 'R (3 inst.)', x: 545, y: 110, shape: 'res', inst: 3, w: 90, h: 44 }],
          edges: [
            { from: 'Ta', to: 'Ra', label: 'request', tone: 'warn' },
            { from: 'Rb', to: 'Tb', label: 'assignment', tone: 'ok' },
            { from: 'Tc', to: 'Rc', label: 'claim', dashed: true }] } },
        { name: 'graph', caption: 'Цикл T1 → R1 → T2 → R2 → T1, все ресурсы по 1 экземпляру → deadlock', props: {
          w: 440, h: 300,
          nodes: [
            { id: 'R1', label: 'R1', x: 220, y: 45, shape: 'res', inst: 1, w: 70, h: 40 },
            { id: 'T1', label: 'T1', x: 100, y: 150, shape: 'circle', tone: 'bad' },
            { id: 'T2', label: 'T2', x: 340, y: 150, shape: 'circle', tone: 'bad' },
            { id: 'R2', label: 'R2', x: 220, y: 255, shape: 'res', inst: 1, w: 70, h: 40 }],
          edges: [
            { from: 'T1', to: 'R1', tone: 'bad' }, { from: 'R1', to: 'T2', tone: 'bad' },
            { from: 'T2', to: 'R2', tone: 'bad' }, { from: 'R2', to: 'T1', tone: 'bad' }] } },
        { name: 'graph', caption: 'RAG Example (без deadlock): нет циклов', props: {
          w: 600, h: 320,
          nodes: [
            { id: 'R1', label: 'R1', x: 190, y: 50, shape: 'res', inst: 1, w: 70, h: 40 },
            { id: 'R3', label: 'R3', x: 390, y: 50, shape: 'res', inst: 1, w: 70, h: 40 },
            { id: 'T1', label: 'T1', x: 100, y: 160, shape: 'circle' },
            { id: 'T2', label: 'T2', x: 290, y: 160, shape: 'circle' },
            { id: 'T3', label: 'T3', x: 490, y: 160, shape: 'circle' },
            { id: 'R2', label: 'R2', x: 190, y: 270, shape: 'res', inst: 2, w: 70, h: 40 },
            { id: 'R4', label: 'R4', x: 470, y: 270, shape: 'res', inst: 3, w: 80, h: 40 }],
          edges: [
            { from: 'T1', to: 'R1' }, { from: 'R1', to: 'T2' }, { from: 'T2', to: 'R3' }, { from: 'R3', to: 'T3' },
            { from: 'R2', to: 'T1' }, { from: 'R2', to: 'T2' }] } }
      ],
      exam: 'Направления рёбер (request T→R, assignment R→T); прочитать граф: кто что держит и ждёт.'
    },
    {
      id: 'rag-examples',
      h: 'RAG: с deadlock и без. Basic Facts',
      html: `
<p><b>RAG with a Deadlock</b>: к примеру выше добавляется запрос <b>T<sub>3</sub> → R<sub>2</sub></b>, а оба экземпляра R<sub>2</sub> уже заняты (T<sub>1</sub> и T<sub>2</sub>). Два цикла:</p>
<div class="formula">T1 → R1 → T2 → R3 → T3 → R2 → T1 &nbsp;&nbsp;|&nbsp;&nbsp; T2 → R3 → T3 → R2 → T2</div>
<p>T<sub>1</sub>, T<sub>2</sub>, T<sub>3</sub> в deadlock: T<sub>3</sub> ждёт R<sub>2</sub>, который держат T<sub>1</sub> и T<sub>2</sub>, а они ждут R<sub>1</sub>/R<sub>3</sub>.</p>
<div data-viz="0"></div>
<p><b>RAG without a Deadlock</b> (третий граф слайда): тот же граф, но у R<sub>2</sub> <b>3 экземпляра</b>. Цикл есть, но свободный экземпляр R<sub>2</sub> достаётся T<sub>3</sub> → T<sub>3</sub> завершается → цепочка разматывается.</p>
<div data-viz="1"></div>
<p><b>«Deadlock yes or no?»</b> — R<sub>1</sub> и R<sub>2</sub> по 2 экземпляра:</p>
<div data-viz="2"></div>
<div class="callout key"><b>Нет deadlock.</b> Цикл T1 → R1 → T3 → R2 → T1 есть, но T<sub>2</sub> и T<sub>4</sub> ничего не ждут: T<sub>4</sub> освободит экземпляр R<sub>2</sub> → его получит T<sub>3</sub> (или T<sub>2</sub> освободит R<sub>1</sub> → его получит T<sub>1</sub>), и цикл разрывается.</div>
<p><b>Basic Facts</b>:</p>
<ul>
  <li>Граф <b>без циклов</b> → <b>нет deadlock</b>.</li>
  <li>Граф <b>с циклом</b>:
    <ul><li><b>один экземпляр</b> на каждый тип ресурса → <b>deadlock</b>;</li>
    <li><b>несколько экземпляров</b> → <b>возможен</b> deadlock.</li></ul></li>
</ul>
<div class="callout warn">В RAG с multi-instance ресурсами цикл — <b>необходимое, но не достаточное</b> условие deadlock.</div>`,
      viz: [
        { name: 'graph', caption: 'RAG with a Deadlock (R2 — 2 экземпляра, оба заняты; T3 ждёт R2)', props: {
          w: 600, h: 320,
          nodes: [
            { id: 'R1', label: 'R1', x: 190, y: 50, shape: 'res', inst: 1, w: 70, h: 40 },
            { id: 'R3', label: 'R3', x: 390, y: 50, shape: 'res', inst: 1, w: 70, h: 40 },
            { id: 'T1', label: 'T1', x: 100, y: 160, shape: 'circle', tone: 'bad' },
            { id: 'T2', label: 'T2', x: 290, y: 160, shape: 'circle', tone: 'bad' },
            { id: 'T3', label: 'T3', x: 490, y: 160, shape: 'circle', tone: 'bad' },
            { id: 'R2', label: 'R2', x: 190, y: 270, shape: 'res', inst: 2, w: 70, h: 40 },
            { id: 'R4', label: 'R4', x: 520, y: 270, shape: 'res', inst: 3, w: 80, h: 40 }],
          edges: [
            { from: 'T1', to: 'R1', tone: 'bad' }, { from: 'R1', to: 'T2', tone: 'bad' }, { from: 'T2', to: 'R3', tone: 'bad' }, { from: 'R3', to: 'T3', tone: 'bad' },
            { from: 'R2', to: 'T1', tone: 'bad' }, { from: 'R2', to: 'T2', tone: 'bad' }, { from: 'T3', to: 'R2', tone: 'bad' }] } },
        { name: 'graph', caption: 'RAG without a Deadlock: R2 имеет 3 экземпляра, один свободен', props: {
          w: 600, h: 320,
          nodes: [
            { id: 'R1', label: 'R1', x: 190, y: 50, shape: 'res', inst: 1, w: 70, h: 40 },
            { id: 'R3', label: 'R3', x: 390, y: 50, shape: 'res', inst: 1, w: 70, h: 40 },
            { id: 'T1', label: 'T1', x: 100, y: 160, shape: 'circle' },
            { id: 'T2', label: 'T2', x: 290, y: 160, shape: 'circle' },
            { id: 'T3', label: 'T3', x: 490, y: 160, shape: 'circle', tone: 'ok' },
            { id: 'R2', label: 'R2', x: 190, y: 270, shape: 'res', inst: 3, w: 80, h: 40, tone: 'ok' },
            { id: 'R4', label: 'R4', x: 520, y: 270, shape: 'res', inst: 3, w: 80, h: 40 }],
          edges: [
            { from: 'T1', to: 'R1' }, { from: 'R1', to: 'T2' }, { from: 'T2', to: 'R3' }, { from: 'R3', to: 'T3' },
            { from: 'R2', to: 'T1' }, { from: 'R2', to: 'T2' }, { from: 'T3', to: 'R2', tone: 'ok' }] } },
        { name: 'graph', caption: 'Deadlock yes or no? — цикл есть, deadlock нет', props: {
          w: 560, h: 330,
          nodes: [
            { id: 'T1', label: 'T1', x: 90, y: 175, shape: 'circle' },
            { id: 'R1', label: 'R1', x: 250, y: 90, shape: 'res', inst: 2, w: 70, h: 40 },
            { id: 'R2', label: 'R2', x: 250, y: 260, shape: 'res', inst: 2, w: 70, h: 40 },
            { id: 'T2', label: 'T2', x: 440, y: 40, shape: 'circle', tone: 'ok' },
            { id: 'T3', label: 'T3', x: 440, y: 155, shape: 'circle' },
            { id: 'T4', label: 'T4', x: 440, y: 295, shape: 'circle', tone: 'ok' }],
          edges: [
            { from: 'T1', to: 'R1', tone: 'warn' }, { from: 'R1', to: 'T2' }, { from: 'R1', to: 'T3', tone: 'warn' },
            { from: 'T3', to: 'R2', tone: 'warn' }, { from: 'R2', to: 'T1', tone: 'warn' }, { from: 'R2', to: 'T4' }] } }
      ],
      exam: 'По картинке RAG ответить «deadlock: да/нет» с объяснением; правило «цикл + single instance = deadlock».'
    },
    {
      id: 'methods',
      h: 'Methods for Handling Deadlocks',
      html: `
<table class="t">
  <tr><th>Стратегия</th><th>Методы</th></tr>
  <tr><td>Гарантировать, что система <b>никогда не войдёт</b> в deadlock</td><td><b>Deadlock prevention</b>; <b>Deadlock avoidance</b></td></tr>
  <tr><td>Позволить войти в deadlock и затем <b>восстановиться</b></td><td><b>Deadlock detection</b> (+ recovery)</td></tr>
  <tr><td><b>Игнорировать</b> проблему, считая, что deadlock не бывает</td><td>—</td></tr>
</table>`,
      viz: [{ name: 'flow', caption: 'От «не допустить» до «игнорировать»', props: { dir: 'h', steps: [
        { label: 'Prevention', sub: 'нарушить одно из 4 условий', tone: 'ok' },
        { label: 'Avoidance', sub: 'не входить в unsafe state', tone: 'acc' },
        { label: 'Detection + Recovery', sub: 'найти и разрушить', tone: 'warn' },
        { label: 'Ignore', sub: 'считать, что не бывает', tone: 'muted' }] } }]
    },
    {
      id: 'prevention',
      h: 'Deadlock Prevention',
      html: `
<p>Идея: <b>сделать невозможным одно из четырёх необходимых условий</b>.</p>
<table class="t">
  <tr><th>Условие</th><th>Как нарушить</th><th>Минусы</th></tr>
  <tr><td><b>Mutual Exclusion</b></td><td>не требуется для <b>sharable</b> ресурсов (например, read-only файлы)</td><td>для <b>non-sharable</b> ресурсов должно выполняться → обычно не устранить</td></tr>
  <tr><td><b>Hold and Wait</b></td><td>когда поток запрашивает ресурс, он <b>не держит других</b>: либо запросить и получить <b>все</b> ресурсы до начала выполнения, либо запрашивать, только когда <b>ничего не выделено</b></td><td><b>low resource utilization</b>; возможен <b>starvation</b></td></tr>
  <tr><td><b>No Preemption</b></td><td>если поток, держащий ресурсы, запрашивает ресурс, который нельзя выдать сразу, — <b>все удерживаемые ресурсы освобождаются</b>; они добавляются к списку ожидаемых; поток перезапускается, только когда может снова получить старые и новые</td><td>подходит не для всех ресурсов</td></tr>
  <tr><td><b>Circular Wait</b></td><td><b>total ordering</b> всех типов ресурсов; запросы — в <b>возрастающем</b> порядке нумерации</td><td>программист обязан соблюдать порядок</td></tr>
</table>`,
      exam: 'Для каждого условия — как его нарушить и чем за это платим.'
    },
    {
      id: 'circular-wait',
      h: 'Circular Wait — упорядочивание ресурсов',
      html: `
<ul>
  <li>Нарушение circular wait — <b>самый распространённый</b> способ prevention.</li>
  <li>Каждому ресурсу (например, mutex lock) присваивается <b>уникальный номер</b>; ресурсы захватываются <b>по порядку</b>.</li>
  <li>Если <code>first_mutex = 1</code>, <code>second_mutex = 5</code>, то код <code>thread_two</code> <b>нельзя</b> писать так:</li>
</ul>
<div class="cols">
<pre class="code" data-lang="c">/* thread_one runs in this function */
void *do_work_one(void *param)
{
    pthread_mutex_lock(&amp;first_mutex);
    pthread_mutex_lock(&amp;second_mutex);
    /* Do some work */
    pthread_mutex_unlock(&amp;second_mutex);
    pthread_mutex_unlock(&amp;first_mutex);
    pthread_exit(0);
}</pre>
<pre class="code" data-lang="c">/* thread_two runs in this function */
void *do_work_two(void *param)
{
    pthread_mutex_lock(&amp;second_mutex);   /* 5 */
    pthread_mutex_lock(&amp;first_mutex);    /* 1 &lt; 5 — нарушение! */
    /* Do some work */
    pthread_mutex_unlock(&amp;first_mutex);
    pthread_mutex_unlock(&amp;second_mutex);
    pthread_exit(0);
}</pre>
</div>
<div class="callout warn">thread_one держит first_mutex и ждёт second_mutex, thread_two держит second_mutex и ждёт first_mutex → <b>deadlock</b>. Исправление: thread_two тоже захватывает сначала <code>first_mutex</code> (1), затем <code>second_mutex</code> (5).</div>`,
      exam: 'Найти нарушение порядка захвата mutex в коде и исправить его.'
    },
    {
      id: 'avoidance',
      h: 'Deadlock Avoidance',
      html: `
<p>Требует, чтобы у системы была <b>дополнительная информация a priori</b>.</p>
<ul>
  <li>Простейшая и самая полезная модель: каждый поток <b>заранее объявляет максимальное число ресурсов каждого типа</b>, которые ему могут понадобиться.</li>
  <li>Алгоритм avoidance <b>динамически проверяет resource-allocation state</b>, чтобы circular wait никогда не возник.</li>
  <li><b>Resource-allocation state</b> = число <b>доступных</b> и <b>выделенных</b> ресурсов + <b>максимальные потребности</b> процессов.</li>
</ul>`,
      exam: 'Отличие avoidance (решение по каждому запросу на основе max claims) от prevention (структурный запрет одного условия).'
    },
    {
      id: 'safe-state',
      h: 'Safe State: определение, пример с 12 ресурсами, basic facts',
      html: `
<ul>
  <li>Когда поток запрашивает доступный ресурс, система решает, оставит ли <b>немедленное выделение</b> систему в <b>safe state</b>.</li>
  <li>Система в <b>safe state</b>, если существует последовательность <b>&lt;T<sub>1</sub>, T<sub>2</sub>, …, T<sub>n</sub>&gt;</b> из <b>ВСЕХ</b> потоков, такая что для каждого T<sub>i</sub> ресурсы, которые T<sub>i</sub> ещё может запросить, удовлетворяются <b>доступными сейчас ресурсами + ресурсами, удерживаемыми всеми T<sub>j</sub>, j &lt; i</b>.</li>
</ul>
<p><b>Example</b>: потоки t1, t2, t3 конкурируют за <b>12 ресурсов</b> одного типа (drives).</p>
<div class="cols">
<div>
<table class="t">
  <tr><th></th><th>max need</th><th>in use</th><th>could want</th></tr>
  <tr><td>t1</td><td>4</td><td>3</td><td>1</td></tr>
  <tr><td>t2</td><td>8</td><td>4</td><td>4</td></tr>
  <tr><td>t3</td><td>12</td><td>4</td><td>8</td></tr>
</table>
<div class="formula">in use = 11 → available = 12 − 11 = 1</div>
<p><b>Safe</b>: safe sequence <b>{t1, t2, t3}</b>.</p>
<ul>
  <li>t1 завершится с текущими + 1 свободный (1 ≥ 1) → освободит 3 → available = 4;</li>
  <li>t2: нужно 4 ≤ 4 (свои + ресурсы t1 + свободный) → освободит 4 → available = 8;</li>
  <li>t3: нужно 8 ≤ 8 → завершится.</li>
</ul>
</div>
<div>
<table class="t">
  <tr><th></th><th>max need</th><th>in use</th><th>could want</th></tr>
  <tr><td>t1</td><td>4</td><td>3</td><td>1</td></tr>
  <tr><td>t2</td><td>8</td><td>4</td><td>4</td></tr>
  <tr><td>t3</td><td>12</td><td><b>5</b></td><td><b>7</b></td></tr>
</table>
<div class="formula">in use = 12 → available = 0</div>
<p>Если <b>t3 запросит ещё один drive</b>, он должен <b>ждать</b>: выделение привело бы к <b>unsafe state</b> — свободных 0, а каждый поток может потребовать ещё хотя бы один.</p>
</div>
</div>
<p><b>Keeping Safe State</b> (последовательность &lt;T<sub>1</sub>, …, T<sub>n</sub>&gt;, j &lt; i):</p>
<ul>
  <li>если потребности T<sub>i</sub> нельзя удовлетворить сразу (ведут в unsafe state) — T<sub>i</sub> ждёт, пока завершатся все T<sub>j</sub>;</li>
  <li>когда T<sub>j</sub> завершился, T<sub>i</sub> получает нужное, выполняется, возвращает ресурсы и завершается;</li>
  <li>после T<sub>i</sub> нужные ресурсы получает T<sub>i+1</sub> и т.д.</li>
</ul>
<div data-viz="0"></div>
<p><b>Basic Facts</b>:</p>
<div class="cols">
<ul>
  <li>safe state → <b>нет deadlock</b>;</li>
  <li>unsafe state → <b>возможен</b> deadlock;</li>
  <li><b>Avoidance</b> → гарантировать, что система <b>никогда не войдёт в unsafe state</b>.</li>
</ul>
<svg class="d" viewBox="0 0 320 180">
  <rect class="d-box ok" x="10" y="10" width="300" height="160"/>
  <rect class="d-box warn" x="10" y="10" width="300" height="80"/>
  <rect class="d-box bad" x="30" y="25" width="110" height="45"/>
  <text class="d-txt b" x="85" y="52" text-anchor="middle">deadlock</text>
  <text class="d-txt" x="260" y="40" text-anchor="middle">unsafe</text>
  <text class="d-txt" x="160" y="135" text-anchor="middle">safe</text>
</svg>
</div>`,
      viz: [{ name: 'banker', caption: 'Пример со слайда как Banker (1 тип ресурса, всего 12): запрос t3 на 1 drive → unsafe → ждать', props: {
        res: ['drives'], names: ['t1', 't2', 't3'], available: [1],
        max: [[4], [8], [12]], alloc: [[3], [4], [4]],
        request: { who: 2, vec: [1] } } }],
      exam: 'Определение safe state; посчитать available и safe sequence по таблице; почему запрос t3 откладывается.'
    },
    {
      id: 'rag-avoid',
      h: 'Avoidance Algorithms: RAG Scheme с claim edges',
      html: `
<table class="t">
  <tr><th>Ресурсы</th><th>Алгоритм avoidance</th></tr>
  <tr><td><b>Single instance</b> каждого типа</td><td><b>Resource-Allocation Graph</b> (с claim edges)</td></tr>
  <tr><td><b>Multiple instances</b></td><td><b>Banker’s Algorithm</b></td></tr>
</table>
<p><b>Resource-Allocation Graph Scheme</b>:</p>
<ul>
  <li><b>Claim edge</b> T<sub>i</sub> ⇢ R<sub>j</sub> — поток T<sub>i</sub> <b>может</b> в будущем запросить R<sub>j</sub>; изображается <b>пунктиром</b>.</li>
  <li>Claim edge → <b>request edge</b>, когда поток запрашивает ресурс.</li>
  <li>Request edge → <b>assignment edge</b>, когда ресурс выделен.</li>
  <li>Когда поток освобождает ресурс, assignment edge снова становится <b>claim edge</b>.</li>
  <li>Ресурсы должны быть <b>заявлены a priori</b>.</li>
</ul>
<div class="cols">
  <div data-viz="0"></div>
  <div data-viz="1"></div>
</div>
<p><b>Unsafe State</b> (правый граф): R<sub>2</sub> нельзя выделять T<sub>2</sub>, потому что в графе (с учётом claim edge) образуется <b>цикл</b>. Если R<sub>2</sub> выдать T<sub>2</sub>, а затем T<sub>1</sub> запросит R<sub>2</sub>, — deadlock.</p>
<div class="callout key"><b>Resource-Allocation Graph Algorithm</b>: поток T<sub>i</sub> запрашивает R<sub>j</sub>; запрос удовлетворяется, <b>только если превращение request edge в assignment edge не создаёт цикла</b> в RAG (claim edges учитываются).</div>`,
      viz: [
        { name: 'graph', caption: 'RAG для avoidance: R1 у T1, T2 запросил R1, оба могут запросить R2', props: {
          w: 480, h: 290,
          nodes: [
            { id: 'R1', label: 'R1', x: 240, y: 45, shape: 'res', inst: 1, w: 70, h: 40 },
            { id: 'T1', label: 'T1', x: 100, y: 150, shape: 'circle' },
            { id: 'T2', label: 'T2', x: 380, y: 150, shape: 'circle' },
            { id: 'R2', label: 'R2', x: 240, y: 250, shape: 'res', inst: 1, w: 70, h: 40 }],
          edges: [
            { from: 'R1', to: 'T1', label: 'assign' }, { from: 'T2', to: 'R1', label: 'request', tone: 'warn' },
            { from: 'T1', to: 'R2', label: 'claim', dashed: true }, { from: 'T2', to: 'R2', label: 'claim', dashed: true }] } },
        { name: 'graph', caption: 'Unsafe state: R2 выделен T2 → цикл T1 ⇢ R2 → T2 → R1 → T1', props: {
          w: 480, h: 290,
          nodes: [
            { id: 'R1', label: 'R1', x: 240, y: 45, shape: 'res', inst: 1, w: 70, h: 40 },
            { id: 'T1', label: 'T1', x: 100, y: 150, shape: 'circle', tone: 'warn' },
            { id: 'T2', label: 'T2', x: 380, y: 150, shape: 'circle', tone: 'warn' },
            { id: 'R2', label: 'R2', x: 240, y: 250, shape: 'res', inst: 1, w: 70, h: 40 }],
          edges: [
            { from: 'R1', to: 'T1', tone: 'warn' }, { from: 'T2', to: 'R1', tone: 'warn' },
            { from: 'T1', to: 'R2', label: 'claim', dashed: true, tone: 'warn' }, { from: 'R2', to: 'T2', label: 'assign', tone: 'warn' }] } }
      ],
      exam: 'Что такое claim edge и как он превращается в request/assignment; правило «выдавать, только если нет цикла».'
    },
    {
      id: 'banker',
      h: "Banker's Algorithm",
      html: `
<ul>
  <li><b>Banker’s Algorithm</b> — алгоритм <b>deadlock avoidance</b>: определяет, безопасно ли выделить ресурсы процессу.</li>
  <li><b>Симулирует</b> выделение по каждому запросу и проверяет, останется ли система в <b>safe state</b> (есть хотя бы одна последовательность, в которой все процессы завершатся).</li>
  <li><b>Key idea</b>: система как «банкир» — выдаёт ресурсы, только если может гарантировать, что все процессы рано или поздно завершатся.</li>
  <li>Условия: <b>multiple instances</b>; каждый поток <b>a priori</b> объявляет максимум; при запросе поток <b>может ждать</b>; получив все ресурсы, поток <b>возвращает их за конечное время</b>.</li>
</ul>
<div class="callout note">На слайдах: «No more details for our purposes!». Ниже — стандартные структуры и алгоритмы (Silberschatz), нужные для решения задач.</div>
<p><b>Data structures</b> (n потоков, m типов ресурсов):</p>
<table class="t">
  <tr><th>Структура</th><th>Смысл</th></tr>
  <tr><td><b>Available[m]</b></td><td>Available[j] = k → свободно k экземпляров R<sub>j</sub></td></tr>
  <tr><td><b>Max[n][m]</b></td><td>Max[i][j] = k → T<sub>i</sub> может запросить максимум k экземпляров R<sub>j</sub></td></tr>
  <tr><td><b>Allocation[n][m]</b></td><td>сколько R<sub>j</sub> сейчас выделено T<sub>i</sub></td></tr>
  <tr><td><b>Need[n][m]</b></td><td>сколько ещё может понадобиться: <b>Need = Max − Allocation</b></td></tr>
</table>
<div class="cols">
<pre class="code" data-lang="text">/* Safety algorithm */
1. Work = Available;
   Finish[i] = false для всех i
2. найти i: Finish[i] == false
            и Need[i] &lt;= Work
   если такого нет → шаг 4
3. Work = Work + Allocation[i];
   Finish[i] = true;  → шаг 2
4. если Finish[i] == true для всех i
   → state SAFE</pre>
<pre class="code" data-lang="text">/* Resource-request algorithm для Ti */
1. если Request[i] &lt;= Need[i] → шаг 2,
   иначе ошибка (превышен max claim)
2. если Request[i] &lt;= Available → шаг 3,
   иначе Ti ждёт (ресурсов нет)
3. «притворно» выделить:
   Available     -= Request[i]
   Allocation[i] += Request[i]
   Need[i]       -= Request[i]
   safe   → выделить по-настоящему
   unsafe → Ti ждёт, старое состояние
            восстанавливается</pre>
</div>
<p><b>Пример</b> (классический, Silberschatz): 5 потоков T0–T4, ресурсы A (10), B (5), C (7).</p>
<table class="t">
  <tr><th></th><th>Allocation<br>A B C</th><th>Max<br>A B C</th><th>Need<br>A B C</th></tr>
  <tr><td>T0</td><td>0 1 0</td><td>7 5 3</td><td>7 4 3</td></tr>
  <tr><td>T1</td><td>2 0 0</td><td>3 2 2</td><td>1 2 2</td></tr>
  <tr><td>T2</td><td>3 0 2</td><td>9 0 2</td><td>6 0 0</td></tr>
  <tr><td>T3</td><td>2 1 1</td><td>2 2 2</td><td>0 1 1</td></tr>
  <tr><td>T4</td><td>0 0 2</td><td>4 3 3</td><td>4 3 1</td></tr>
</table>
<div class="formula">Available = (3 3 2). Safe sequence, например, &lt;T1, T3, T4, T0, T2&gt;:<br>
Work 3 3 2 → +T1 (2 0 0) = 5 3 2 → +T3 (2 1 1) = 7 4 3 → +T4 (0 0 2) = 7 4 5 → +T0 (0 1 0) = 7 5 5 → +T2 (3 0 2) = 10 5 7</div>
<ul>
  <li><b>T1 запрашивает (1 0 2)</b>: ≤ Need<sub>1</sub> (1 2 2), ≤ Available (3 3 2) → пробно: Available = (2 3 0), Allocation<sub>1</sub> = (3 0 2), Need<sub>1</sub> = (0 2 0) → &lt;T1, T3, T4, T0, T2&gt; safe → <b>выделить</b>.</li>
  <li>Затем <b>T4 запрашивает (3 3 0)</b> → 3 &gt; 2 свободных A → <b>ждать</b> (ресурсов нет).</li>
  <li>Затем <b>T0 запрашивает (0 2 0)</b> → ресурсы есть, но Available стал бы (2 1 0) и ни один Need не помещается → <b>unsafe → отказ</b>.</li>
</ul>`,
      viz: [{ name: 'banker', caption: 'Пошаговый safety algorithm и проверка запроса T1 = (1, 0, 2)', props: {
        res: ['A', 'B', 'C'], names: ['T0', 'T1', 'T2', 'T3', 'T4'], available: [3, 3, 2],
        max: [[7, 5, 3], [3, 2, 2], [9, 0, 2], [2, 2, 2], [4, 3, 3]],
        alloc: [[0, 1, 0], [2, 0, 0], [3, 0, 2], [2, 1, 1], [0, 0, 2]],
        request: { who: 1, vec: [1, 0, 2] } } }],
      exam: 'Посчитать Need, найти safe sequence, решить, можно ли удовлетворить запрос (3 проверки: ≤ Need, ≤ Available, safe).'
    },
    {
      id: 'detection',
      h: 'Deadlock Detection: wait-for graph и алгоритм для multiple instances',
      html: `
<p>Подход: <b>позволить</b> системе войти в deadlock, затем — <b>detection algorithm</b> + <b>recovery scheme</b>.</p>
<p><b>Single instance</b> каждого типа ресурса:</p>
<ul>
  <li>поддерживать <b>wait-for graph</b>: вершины — <b>потоки</b>; ребро <b>T<sub>i</sub> → T<sub>j</sub></b>, если T<sub>i</sub> ждёт T<sub>j</sub> (ждёт ресурс, который держит T<sub>j</sub>);</li>
  <li>получается из RAG удалением вершин-ресурсов и «склейкой» рёбер T<sub>i</sub> → R → T<sub>j</sub>;</li>
  <li><b>периодически</b> запускать поиск цикла: <b>есть цикл ⇔ есть deadlock</b>;</li>
  <li>поиск цикла в графе требует порядка <b>n²</b> операций, n — число вершин.</li>
</ul>
<div data-viz="0"></div>
<div data-viz="1"></div>
<div class="callout key">Циклы в wait-for graph: <b>T1 → T2 → T4 → T1</b> и <b>T1 → T2 → T3 → T4 → T1</b> → deadlock.</div>
<p><b>Multiple instances</b> — алгоритм, похожий на Banker’s, но вместо Need используется <b>текущий Request</b>:</p>
<pre class="code" data-lang="text">Available[m], Allocation[n][m], Request[n][m]   /* Request — текущие запросы */
1. Work = Available;
   Finish[i] = (Allocation[i] == 0) ? true : false
2. найти i: Finish[i] == false и Request[i] &lt;= Work;  нет такого → шаг 4
3. Work = Work + Allocation[i];  Finish[i] = true;  → шаг 2
4. если Finish[i] == false для какого-то i → система в deadlock,
   и Ti — deadlocked                             /* O(m × n²) */</pre>
<div class="formula">Пример: A = 7, B = 2, C = 6; Available = (0 0 0)<br>
Allocation: T0 (0 1 0), T1 (2 0 0), T2 (3 0 3), T3 (2 1 1), T4 (0 0 2)<br>
Request: T0 (0 0 0), T1 (2 0 2), T2 (0 0 0), T3 (1 0 0), T4 (0 0 2) → все Finish = true (например, T0, T2, T3, T1, T4) → <b>нет deadlock</b><br>
Если T2 запросит ещё (0 0 1): завершится только T0 → <b>deadlock: T1, T2, T3, T4</b></div>`,
      viz: [
        { name: 'graph', caption: '(a) Resource-Allocation Graph', props: {
          w: 520, h: 390,
          nodes: [
            { id: 'T5', label: 'T5', x: 260, y: 40, shape: 'circle' },
            { id: 'R1', label: 'R1', x: 100, y: 130, shape: 'res', inst: 1, w: 60, h: 40 },
            { id: 'R3', label: 'R3', x: 260, y: 130, shape: 'res', inst: 1, w: 60, h: 40 },
            { id: 'R4', label: 'R4', x: 420, y: 130, shape: 'res', inst: 1, w: 60, h: 40 },
            { id: 'T1', label: 'T1', x: 100, y: 235, shape: 'circle', tone: 'bad' },
            { id: 'T2', label: 'T2', x: 260, y: 235, shape: 'circle', tone: 'bad' },
            { id: 'T3', label: 'T3', x: 420, y: 235, shape: 'circle', tone: 'bad' },
            { id: 'R2', label: 'R2', x: 100, y: 345, shape: 'res', inst: 1, w: 60, h: 40 },
            { id: 'T4', label: 'T4', x: 260, y: 345, shape: 'circle', tone: 'bad' },
            { id: 'R5', label: 'R5', x: 420, y: 345, shape: 'res', inst: 1, w: 60, h: 40 }],
          edges: [
            { from: 'T1', to: 'R1' }, { from: 'R1', to: 'T2' }, { from: 'T2', to: 'R3' }, { from: 'R3', to: 'T5' },
            { from: 'T2', to: 'R4' }, { from: 'R4', to: 'T3' }, { from: 'T3', to: 'R5' }, { from: 'T2', to: 'R5' },
            { from: 'R5', to: 'T4' }, { from: 'T4', to: 'R2' }, { from: 'R2', to: 'T1' }] } },
        { name: 'graph', caption: '(b) Corresponding wait-for graph', props: {
          w: 420, h: 300,
          nodes: [
            { id: 'T5', label: 'T5', x: 210, y: 40, shape: 'circle' },
            { id: 'T1', label: 'T1', x: 70, y: 150, shape: 'circle', tone: 'bad' },
            { id: 'T2', label: 'T2', x: 210, y: 150, shape: 'circle', tone: 'bad' },
            { id: 'T3', label: 'T3', x: 350, y: 150, shape: 'circle', tone: 'bad' },
            { id: 'T4', label: 'T4', x: 210, y: 260, shape: 'circle', tone: 'bad' }],
          edges: [
            { from: 'T1', to: 'T2', tone: 'bad' }, { from: 'T2', to: 'T5' }, { from: 'T2', to: 'T3', tone: 'bad' },
            { from: 'T2', to: 'T4', tone: 'bad' }, { from: 'T3', to: 'T4', tone: 'bad' }, { from: 'T4', to: 'T1', tone: 'bad' }] } }
      ],
      exam: 'Построить wait-for graph по RAG и найти цикл; сложность O(n²); отличие detection-алгоритма от Banker (Request вместо Need).'
    },
    {
      id: 'detect-examples',
      h: 'Is there a deadlock? — примеры со слайдов',
      html: `
<p><b>Пример 1</b>: P1 ждёт R1 (у P2), P2 ждёт R4 (у P3), P3 ждёт R3 (у P4), P4 ждёт R2 (у P1).</p>
<div data-viz="0"></div>
<div data-viz="1"></div>
<div class="callout warn"><b>Yes</b>: wait-for graph содержит цикл P1 → P2 → P3 → P4 → P1 (все ресурсы single instance).</div>
<p><b>Пример 2</b>: P1 ждёт R1 (у P2) и R2 (у P4); P2 и P4 ждут R3 (у P3); P3 ничего не ждёт.</p>
<div data-viz="2"></div>
<div data-viz="3"></div>
<div class="callout key"><b>No</b>: в wait-for graph P1 → P2, P1 → P4, P2 → P3, P4 → P3 — циклов нет. P3 завершится и освободит R3 → затем P2 и P4 → затем P1.</div>`,
      viz: [
        { name: 'graph', caption: 'RAG (пример 1)', props: {
          w: 520, h: 300,
          nodes: [
            { id: 'R1', label: 'R1', x: 80, y: 50, shape: 'res', inst: 1, w: 70, h: 40 },
            { id: 'P1', label: 'P1', x: 260, y: 50, shape: 'circle', tone: 'bad' },
            { id: 'R2', label: 'R2', x: 440, y: 50, shape: 'res', inst: 1, w: 70, h: 40 },
            { id: 'P2', label: 'P2', x: 170, y: 150, shape: 'circle', tone: 'bad' },
            { id: 'P4', label: 'P4', x: 440, y: 150, shape: 'circle', tone: 'bad' },
            { id: 'R4', label: 'R4', x: 80, y: 250, shape: 'res', inst: 1, w: 70, h: 40 },
            { id: 'P3', label: 'P3', x: 260, y: 250, shape: 'circle', tone: 'bad' },
            { id: 'R3', label: 'R3', x: 440, y: 250, shape: 'res', inst: 1, w: 70, h: 40 }],
          edges: [
            { from: 'P1', to: 'R1' }, { from: 'R1', to: 'P2' }, { from: 'P2', to: 'R4' }, { from: 'R4', to: 'P3' },
            { from: 'P3', to: 'R3' }, { from: 'R3', to: 'P4' }, { from: 'P4', to: 'R2' }, { from: 'R2', to: 'P1' }] } },
        { name: 'graph', caption: 'Wait-for graph (пример 1): цикл → deadlock', props: {
          w: 400, h: 260,
          nodes: [
            { id: 'P1', label: 'P1', x: 70, y: 130, shape: 'circle', tone: 'bad' },
            { id: 'P2', label: 'P2', x: 200, y: 45, shape: 'circle', tone: 'bad' },
            { id: 'P3', label: 'P3', x: 330, y: 130, shape: 'circle', tone: 'bad' },
            { id: 'P4', label: 'P4', x: 200, y: 215, shape: 'circle', tone: 'bad' }],
          edges: [
            { from: 'P1', to: 'P2', tone: 'bad' }, { from: 'P2', to: 'P3', tone: 'bad' },
            { from: 'P3', to: 'P4', tone: 'bad' }, { from: 'P4', to: 'P1', tone: 'bad' }] } },
        { name: 'graph', caption: 'RAG (пример 2)', props: {
          w: 500, h: 300,
          nodes: [
            { id: 'R1', label: 'R1', x: 90, y: 50, shape: 'res', inst: 1, w: 70, h: 40 },
            { id: 'P1', label: 'P1', x: 90, y: 150, shape: 'circle' },
            { id: 'R2', label: 'R2', x: 90, y: 250, shape: 'res', inst: 1, w: 70, h: 40 },
            { id: 'P2', label: 'P2', x: 240, y: 150, shape: 'circle' },
            { id: 'P4', label: 'P4', x: 240, y: 250, shape: 'circle' },
            { id: 'P3', label: 'P3', x: 400, y: 150, shape: 'circle', tone: 'ok' },
            { id: 'R3', label: 'R3', x: 400, y: 250, shape: 'res', inst: 1, w: 70, h: 40 }],
          edges: [
            { from: 'P1', to: 'R1' }, { from: 'P1', to: 'R2' }, { from: 'R1', to: 'P2' }, { from: 'R2', to: 'P4' },
            { from: 'P2', to: 'R3' }, { from: 'P4', to: 'R3' }, { from: 'R3', to: 'P3' }] } },
        { name: 'graph', caption: 'Wait-for graph (пример 2): циклов нет', props: {
          w: 400, h: 240,
          nodes: [
            { id: 'P1', label: 'P1', x: 60, y: 120, shape: 'circle' },
            { id: 'P2', label: 'P2', x: 200, y: 45, shape: 'circle' },
            { id: 'P4', label: 'P4', x: 200, y: 195, shape: 'circle' },
            { id: 'P3', label: 'P3', x: 340, y: 120, shape: 'circle', tone: 'ok' }],
          edges: [
            { from: 'P1', to: 'P2' }, { from: 'P1', to: 'P4' }, { from: 'P2', to: 'P3' }, { from: 'P4', to: 'P3' }] } }
      ],
      exam: 'Нарисовать wait-for graph по RAG и ответить «есть ли deadlock».'
    },
    {
      id: 'detection-usage',
      h: 'Detection-Algorithm Usage',
      html: `
<p>Когда и как часто запускать detection algorithm, зависит от:</p>
<ul>
  <li><b>как часто</b> deadlock вероятно возникает;</li>
  <li><b>сколько процессов</b> придётся откатить (rolled back) — <b>по одному на каждый непересекающийся (disjoint) цикл</b>.</li>
</ul>
<div class="callout note">Чем чаще возникают deadlocks, тем чаще нужно запускать проверку: иначе ресурсы простаивают, а цикл может разрастаться, вовлекая новые потоки.</div>`
    },
    {
      id: 'recovery',
      h: 'Recovery from Deadlock',
      html: `
<div class="cols">
<div>
<p><b>Process Termination</b>:</p>
<ul>
  <li><b>Abort all</b> deadlocked threads;</li>
  <li>или <b>abort one at a time</b>, пока цикл не исчезнет: после каждого убийства — снова проверка на deadlock (так разрывается circular wait).</li>
</ul>
<p>В каком порядке выбирать жертву:</p>
<ol>
  <li>priority потока;</li>
  <li>сколько уже вычислял и сколько осталось до завершения;</li>
  <li>какие ресурсы использовал;</li>
  <li>сколько ресурсов нужно для завершения;</li>
  <li>сколько потоков придётся завершить;</li>
  <li>interactive или batch.</li>
</ol>
</div>
<div>
<p><b>Resource Preemption</b>: отбираем ресурсы у участников deadlock и отдаём другим процессам. Три проблемы:</p>
<ul>
  <li><b>Selecting a victim</b> — какие ресурсы и у каких процессов отобрать, чтобы <b>минимизировать стоимость</b>;</li>
  <li><b>Rollback</b> — что делать с процессом, у которого отобрали ресурсы; простейшее — <b>total rollback</b>: прервать процесс и перезапустить;</li>
  <li><b>Starvation</b> — один и тот же процесс может всегда выбираться жертвой и никогда не завершиться. Решение: процесс может быть жертвой <b>только конечное число раз</b>.</li>
</ul>
</div>
</div>`,
      exam: 'Два способа recovery; критерии выбора жертвы; три проблемы resource preemption (victim, rollback, starvation).'
    }
  ],
  terms: [
    { en: 'Deadlock', ru: 'Взаимоблокировка', def: 'Два или более процесса не могут продолжить, потому что каждый ждёт освобождения ресурсов другим.' },
    { en: 'Request / use / release', ru: 'Запрос / использование / освобождение', def: 'Схема, по которой процесс использует ресурс.' },
    { en: 'Mutual exclusion', ru: 'Взаимное исключение', def: 'Ресурс одновременно может использовать только один поток.' },
    { en: 'Hold and wait', ru: 'Удержание и ожидание', def: 'Поток держит хотя бы один ресурс и ждёт другие, занятые другими потоками.' },
    { en: 'No preemption', ru: 'Отсутствие вытеснения', def: 'Ресурс освобождается только добровольно удерживающим потоком.' },
    { en: 'Circular wait', ru: 'Циклическое ожидание', def: 'Цепочка T0 → T1 → … → Tn → T0, где каждый ждёт ресурс, занятый следующим.' },
    { en: 'Resource-Allocation Graph (RAG)', ru: 'Граф распределения ресурсов', def: 'Вершины — потоки и типы ресурсов; request edge T→R, assignment edge R→T.' },
    { en: 'Request edge', ru: 'Ребро запроса', def: 'Ti → Rj: поток запросил ресурс и ждёт его.' },
    { en: 'Assignment edge', ru: 'Ребро назначения', def: 'Rj → Ti: экземпляр ресурса выделен потоку.' },
    { en: 'Claim edge', ru: 'Ребро заявки', def: 'Пунктир Ti ⇢ Rj: поток может запросить ресурс в будущем (avoidance).' },
    { en: 'Deadlock prevention', ru: 'Предотвращение', def: 'Структурно запретить одно из четырёх необходимых условий.' },
    { en: 'Deadlock avoidance', ru: 'Избегание', def: 'По a priori информации (max claims) выдавать ресурсы, только если система остаётся в safe state.' },
    { en: 'Safe state', ru: 'Безопасное состояние', def: 'Существует последовательность всех потоков, в которой каждый может получить недостающее из Available + ресурсов предыдущих.' },
    { en: 'Unsafe state', ru: 'Небезопасное состояние', def: 'Safe sequence не существует; deadlock возможен, но не обязателен.' },
    { en: "Banker's Algorithm", ru: 'Алгоритм банкира', def: 'Avoidance для multiple instances: Available, Max, Allocation, Need; safety + resource-request algorithm.' },
    { en: 'Need', ru: 'Остаточная потребность', def: 'Need = Max − Allocation.' },
    { en: 'Wait-for graph', ru: 'Граф ожидания', def: 'Вершины — потоки; Ti → Tj, если Ti ждёт ресурс, который держит Tj; цикл ⇔ deadlock (single instance).' },
    { en: 'Deadlock detection', ru: 'Обнаружение', def: 'Разрешить deadlock, периодически искать его (цикл / алгоритм с Request) и восстанавливаться.' },
    { en: 'Process termination', ru: 'Завершение процессов', def: 'Recovery: убить все deadlocked потоки или по одному, пока цикл не исчезнет.' },
    { en: 'Resource preemption', ru: 'Вытеснение ресурсов', def: 'Recovery: отобрать ресурсы у жертвы; проблемы — victim, rollback, starvation.' },
    { en: 'Rollback', ru: 'Откат', def: 'Возврат процесса-жертвы в безопасное состояние; простейший — total rollback (abort и restart).' }
  ],
  questions: [
    { id: 'dl-01', type: 'single', q: 'Deadlock — это ситуация, когда…', options: ['процесс бесконечно долго не получает CPU из-за низкого приоритета', 'два или более процесса не могут продолжить, потому что каждый ждёт, пока другой освободит ресурсы', 'результат зависит от порядка выполнения потоков', 'процесс крутится в цикле busy waiting'], answer: 1, explain: 'Определение со слайда. Первый вариант — starvation, третий — race condition.', section: 'model', diff: 1 },
    { id: 'dl-02', type: 'code', q: 'S1 = S2 = 1. При каком порядке операций возникнет deadlock?', lang: 'c', code: '/* T1 */            /* T2 */\nwait(s1);           wait(s2);\nwait(s2);           wait(s1);\n...                 ...\nsignal(s2);         signal(s1);\nsignal(s1);         signal(s2);', options: ['T1: wait(s1), T1: wait(s2), T2: wait(s2)', 'T1: wait(s1), T2: wait(s2), T2: wait(s1), T1: wait(s2)', 'T2: wait(s2), T2: wait(s1), T1: wait(s1)', 'T1: wait(s1), T1: wait(s2), T1: signal(s2), T1: signal(s1), T2: wait(s2)'], answer: 1, explain: 'T1 держит s1, T2 держит s2, затем каждый ждёт семафор другого — deadlock. В остальных вариантах один поток успевает захватить оба семафора, второй просто ждёт.', section: 'sem-deadlock', diff: 2 },
    { id: 'dl-03', type: 'tf', q: 'В примере T1/T2 с семафорами s1 и s2 deadlock возникает при любом порядке выполнения.', answer: false, explain: 'Если T1 выполнит wait(s1) и wait(s2) раньше T2, deadlock не будет — это зависит от OS scheduler.', section: 'sem-deadlock', diff: 1 },
    { id: 'dl-04', type: 'multi', q: 'Какие условия необходимы для возникновения deadlock? (несколько ответов)', options: ['Mutual exclusion', 'Hold and wait', 'Bounded waiting', 'No preemption', 'Circular wait', 'Starvation'], answer: [0, 1, 3, 4], explain: 'Четыре необходимых условия: mutual exclusion, hold and wait, no preemption, circular wait. Bounded waiting — требование к решению CS.', section: 'conditions', diff: 1 },
    { id: 'dl-05', type: 'single', q: '«Поток, удерживающий хотя бы один ресурс, ждёт дополнительные ресурсы, занятые другими потоками» — это условие…', options: ['Circular wait', 'No preemption', 'Mutual exclusion', 'Hold and wait'], answer: 3, explain: 'Это hold and wait. Circular wait — замкнутая цепочка ожиданий.', section: 'conditions', diff: 1 },
    { id: 'dl-06', type: 'single', q: 'Как обозначается assignment edge в Resource-Allocation Graph?', options: ['Ti → Rj', 'Rj → Ti', 'Ti → Tj', 'пунктир Ti ⇢ Rj'], answer: 1, explain: 'Assignment edge — от ресурса к потоку (Rj → Ti). Ti → Rj — request edge, пунктир — claim edge.', section: 'rag', diff: 1 },
    { id: 'dl-07', type: 'single', q: 'R1 (1 экз.), R2 (2 экз.), R3 (1 экз.). T1 держит R2 и ждёт R1; T2 держит R1 и R2 и ждёт R3; T3 держит R3. Есть ли deadlock?', options: ['Да: T1 и T2 ждут друг друга', 'Да: все три потока в deadlock', 'Нет: T3 ничего не ждёт, освободит R3 → T2 завершится → освободит R1 для T1', 'Невозможно определить без Banker’s algorithm'], answer: 2, explain: 'В графе нет цикла (T3 никого не ждёт) → deadlock нет. Пример со слайда RAG Example.', section: 'rag', diff: 2 },
    { id: 'dl-08', type: 'single', q: 'К предыдущему примеру добавили ребро T3 → R2, оба экземпляра R2 заняты T1 и T2. Что теперь?', options: ['Deadlock: T1, T2, T3 образуют циклы T1→R1→T2→R3→T3→R2→T1 и T2→R3→T3→R2→T2', 'Нет deadlock: R2 имеет 2 экземпляра', 'Deadlock только у T3', 'Нет deadlock: цикл в multi-instance графе ничего не значит'], answer: 0, explain: 'Свободных экземпляров R2 нет, и все держатели R2 сами ждут в цикле → deadlock (слайд «RAG with a Deadlock»).', section: 'rag-examples', diff: 2 },
    { id: 'dl-09', type: 'single', q: 'R1 и R2 по 2 экземпляра. R1 выделен T2 и T3, R2 выделен T1 и T4; T1 ждёт R1, T3 ждёт R2. Есть ли deadlock?', options: ['Да: цикл T1 → R1 → T3 → R2 → T1', 'Да: все четыре потока заблокированы', 'Нет: цикла нет', 'Нет: цикл есть, но T2 и T4 ничего не ждут и освободят свои экземпляры'], answer: 3, explain: 'Слайд «Deadlock yes or no?»: цикл есть, но ресурсы multi-instance; T4 освободит R2 → T3 получит его (или T2 освободит R1 для T1) → deadlock нет.', section: 'rag-examples', diff: 3 },
    { id: 'dl-10', type: 'multi', q: 'Какие утверждения о RAG верны? (несколько ответов)', options: ['Нет циклов → нет deadlock', 'Цикл и по одному экземпляру каждого ресурса → deadlock', 'Цикл в графе с multi-instance ресурсами → deadlock обязательно', 'При multi-instance ресурсах цикл — необходимое, но не достаточное условие'], answer: [0, 1, 3], explain: 'Basic Facts: с несколькими экземплярами цикл лишь означает возможность deadlock.', section: 'rag-examples', diff: 2 },
    { id: 'dl-11', type: 'single', q: 'Какой метод позволяет системе войти в deadlock, а затем восстанавливается?', options: ['Deadlock prevention', 'Deadlock avoidance', 'Deadlock detection (+ recovery)', 'Ignoring the problem'], answer: 2, explain: 'Prevention и avoidance гарантируют, что deadlock не наступит; detection разрешает его и затем восстанавливает систему.', section: 'methods', diff: 1 },
    { id: 'dl-12', type: 'single', q: 'Требование «поток должен запросить и получить все ресурсы до начала выполнения» нарушает условие…', options: ['Mutual exclusion', 'Hold and wait', 'No preemption', 'Circular wait'], answer: 1, explain: 'Поток никогда не держит одни ресурсы, ожидая другие → hold and wait невозможен. Цена — low utilization и starvation.', section: 'prevention', diff: 1 },
    { id: 'dl-13', type: 'single', q: 'Каковы недостатки prevention через нарушение hold and wait?', options: ['Low resource utilization и возможный starvation', 'Невозможно для read-only файлов', 'Требует знать Need всех процессов', 'Возникает circular wait'], answer: 0, explain: 'Ресурсы выделяются заранее и простаивают; поток, которому нужно много популярных ресурсов, может ждать бесконечно.', section: 'prevention', diff: 2 },
    { id: 'dl-14', type: 'single', q: '«Если поток, держащий ресурсы, запрашивает ресурс, который нельзя выдать сразу, все его ресурсы освобождаются». Какое условие так нарушается?', options: ['Hold and wait', 'Mutual exclusion', 'No preemption', 'Circular wait'], answer: 2, explain: 'Ресурсы у потока фактически отбираются (preempted) — нарушается no preemption.', section: 'prevention', diff: 2 },
    { id: 'dl-15', type: 'code', q: 'first_mutex = 1, second_mutex = 5. Что не так с thread_two?', lang: 'c', code: 'void *do_work_one(void *param) {\n    pthread_mutex_lock(&first_mutex);\n    pthread_mutex_lock(&second_mutex);\n    /* Do some work */\n    pthread_mutex_unlock(&second_mutex);\n    pthread_mutex_unlock(&first_mutex);\n    pthread_exit(0);\n}\n\nvoid *do_work_two(void *param) {\n    pthread_mutex_lock(&second_mutex);\n    pthread_mutex_lock(&first_mutex);\n    /* Do some work */\n    pthread_mutex_unlock(&first_mutex);\n    pthread_mutex_unlock(&second_mutex);\n    pthread_exit(0);\n}', options: ['Ничего, порядок unlock важнее порядка lock', 'Нарушен порядок захвата (5 перед 1): возможен deadlock — каждый держит один mutex и ждёт другой', 'Ошибка: mutex нельзя захватывать дважды в программе', 'Возможна только starvation thread_one'], answer: 1, explain: 'Ресурсы нужно захватывать по возрастанию номеров: first_mutex (1), затем second_mutex (5). Иначе возможен circular wait.', section: 'circular-wait', diff: 2 },
    { id: 'dl-16', type: 'single', q: 'Что требует deadlock avoidance в простейшей модели?', options: ['Захватывать ресурсы в порядке возрастания номеров', 'Чтобы каждый поток заранее объявил максимальное число ресурсов каждого типа', 'Освобождать все ресурсы при каждом новом запросе', 'Периодически искать циклы в wait-for graph'], answer: 1, explain: 'Avoidance опирается на a priori информацию (max claims). Первый вариант — prevention circular wait, последний — detection.', section: 'avoidance', diff: 1 },
    { id: 'dl-17', type: 'single', q: '12 ресурсов. t1: max 4, in use 3; t2: max 8, in use 4; t3: max 12, in use 4. Какая safe sequence?', options: ['<t3, t2, t1>', '<t2, t1, t3>', '<t1, t2, t3>', 'Safe sequence нет — состояние unsafe'], answer: 2, explain: 'Available = 1. t1 нужно 1 → после него 4; t2 нужно 4 → после него 8; t3 нужно 8 → ок. t2 первым не может (нужно 4 > 1).', section: 'safe-state', diff: 2 },
    { id: 'dl-18', type: 'single', q: 'В том же состоянии t3 запрашивает ещё 1 ресурс. Что сделает система?', options: ['Выделит: ресурс свободен', 't3 будет ждать: выделение приводит в unsafe state (0 свободных, каждому может понадобиться ещё)', 'Завершит t3', 'Отберёт ресурс у t1'], answer: 1, explain: 'После выделения available = 0, а could want: 1, 4, 7 → ни один не гарантированно завершится → unsafe. Avoidance не входит в unsafe state.', section: 'safe-state', diff: 2 },
    { id: 'dl-19', type: 'single', q: 'В исходном состоянии (available = 1) не t3, а t1 запрашивает 1 ресурс. Можно ли его выдать?', options: ['Да: t1 достигает max (4), завершится и вернёт 4 ресурса → <t1, t2, t3> остаётся safe', 'Нет: available станет 0 → unsafe', 'Нет: t1 уже держит больше всех', 'Только если t3 освободит ресурс'], answer: 0, explain: 'Available = 0, но Need t1 = 0 → t1 завершается, available = 4 → t2 (нужно 4) → 8 → t3 (нужно 8). Состояние safe.', section: 'safe-state', diff: 3 },
    { id: 'dl-20', type: 'tf', q: 'Unsafe state всегда означает deadlock.', answer: false, explain: 'Unsafe → возможность deadlock; deadlock — подмножество unsafe. Safe → deadlock невозможен.', section: 'safe-state', diff: 1 },
    { id: 'dl-21', type: 'single', q: 'Claim edge Ti ⇢ Rj означает, что…', options: ['Ti сейчас ждёт Rj', 'Rj выделен Ti', 'Ti может запросить Rj в будущем', 'Ti ждёт поток, держащий Rj'], answer: 2, explain: 'Claim edge (пунктир) — заявка a priori. При запросе превращается в request edge, при выделении — в assignment edge, при освобождении — обратно в claim.', section: 'rag-avoid', diff: 1 },
    { id: 'dl-22', type: 'single', q: 'R1 выделен T1, T2 запросил R1, оба имеют claim edges к R2. T2 запрашивает R2 (он свободен). Что ответит RAG algorithm?', options: ['Выдать: R2 свободен', 'Выдать: цикла из request/assignment рёбер нет', 'Отказать: assignment R2 → T2 вместе с claim edge T1 ⇢ R2 образует цикл T1 ⇢ R2 → T2 → R1 → T1 (unsafe)', 'Отказать: у T2 уже есть request edge'], answer: 2, explain: 'Слайд Unsafe State: R2 нельзя выдать T2 — если затем T1 запросит R2, будет deadlock. Claim edges учитываются при проверке цикла.', section: 'rag-avoid', diff: 2 },
    { id: 'dl-23', type: 'single', q: "В Banker's Algorithm Need вычисляется как…", options: ['Max + Allocation', 'Available − Allocation', 'Max − Allocation', 'Max − Available'], answer: 2, explain: 'Need[i][j] = Max[i][j] − Allocation[i][j] — сколько ещё может запросить поток.', section: 'banker', diff: 1 },
    { id: 'dl-24', type: 'single', q: 'Available = (3 3 2). Allocation: T0 (0 1 0), T1 (2 0 0), T2 (3 0 2), T3 (2 1 1), T4 (0 0 2). Max: T0 (7 5 3), T1 (3 2 2), T2 (9 0 2), T3 (2 2 2), T4 (4 3 3). Какая последовательность safe?', options: ['<T0, T1, T2, T3, T4>', '<T1, T3, T4, T0, T2>', '<T4, T3, T1, T0, T2>', '<T2, T1, T3, T4, T0>'], answer: 1, explain: 'Need: T0 (7 4 3), T1 (1 2 2), T2 (6 0 0), T3 (0 1 1), T4 (4 3 1). Work: 332 → T1 → 532 → T3 → 743 → T4 → 745 → T0 → 755 → T2 → 10 5 7. T0, T4 и T2 первыми не помещаются в (3 3 2).', section: 'banker', diff: 3 },
    { id: 'dl-25', type: 'single', q: 'В том же состоянии T1 запрашивает (1 0 2). Результат?', options: ['Запрос удовлетворяется: Request ≤ Need, ≤ Available, новое состояние safe', 'Ошибка: запрос превышает Need', 'T1 ждёт: ресурсов недостаточно', 'Отказ: новое состояние unsafe'], answer: 0, explain: '(1 0 2) ≤ Need1 (1 2 2) и ≤ Available (3 3 2). Пробно Available = (2 3 0), Need1 = (0 2 0) → <T1, T3, T4, T0, T2> safe.', section: 'banker', diff: 3 },
    { id: 'dl-26', type: 'single', q: 'После удовлетворения запроса T1 (Available = (2 3 0)) T0 запрашивает (0 2 0). Что произойдёт?', options: ['Запрос удовлетворяется', 'Ошибка: превышен max claim', 'T0 ждёт: ресурсы есть, но после выделения (Available = (2 1 0)) состояние unsafe', 'T0 ждёт: ресурсов недостаточно'], answer: 2, explain: 'Request ≤ Need0 (7 4 3) и ≤ Available. Но при Available = (2 1 0) ни один Need не ≤ Work → safe sequence нет → отказ.', section: 'banker', diff: 3 },
    { id: 'dl-27', type: 'code', q: 'Какая строка пропущена в safety algorithm на месте ???', lang: 'text', code: 'Work = Available;\nFinish[i] = false for all i;\nrepeat:\n    find i such that Finish[i] == false && Need[i] <= Work\n    if found:\n        ???\n        Finish[i] = true;\nuntil no such i\nif Finish[i] == true for all i: state is SAFE', options: ['Work = Work - Need[i];', 'Work = Work + Allocation[i];', 'Work = Work + Max[i];', 'Available = Available - Request[i];'], answer: 1, explain: 'Поток Ti завершается и возвращает всё, что ему выделено, — Allocation[i]. Need и Max ресурсами не являются.', section: 'banker', diff: 2 },
    { id: 'dl-28', type: 'single', q: 'Как получить wait-for graph из RAG (single instance)?', options: ['Удалить вершины-ресурсы и заменить пары Ti → Rj → Tk ребром Ti → Tk', 'Удалить вершины-потоки', 'Развернуть все рёбра', 'Добавить claim edges'], answer: 0, explain: 'Ti → Tk, если Ti ждёт ресурс, который держит Tk. Цикл в wait-for graph ⇔ deadlock.', section: 'detection', diff: 1 },
    { id: 'dl-29', type: 'single', q: 'Detection для multiple instances: Available = (0 0 0); Allocation T0 (0 1 0), T1 (2 0 0), T2 (3 0 3), T3 (2 1 1), T4 (0 0 2); Request T0 (0 0 0), T1 (2 0 2), T2 (0 0 1), T3 (1 0 0), T4 (0 0 2). Какие потоки в deadlock?', options: ['Никакие', 'Только T2', 'T1, T2, T3, T4', 'Все пять'], answer: 2, explain: 'T0 (Request 0) завершается → Work = (0 1 0). Ни один Request из T1–T4 не ≤ (0 1 0) → T1, T2, T3, T4 deadlocked.', section: 'detection', diff: 3 },
    { id: 'dl-30', type: 'single', q: 'RAG: P1 → R1 → P2 → R4 → P3 → R3 → P4 → R2 → P1 (все ресурсы single instance). Есть ли deadlock?', options: ['Нет: нужно больше информации о Max', 'Да: wait-for graph P1 → P2 → P3 → P4 → P1 содержит цикл', 'Нет: каждый процесс держит только один ресурс', 'Да, но только P1 и P2'], answer: 1, explain: 'Слайд «Is there a deadlock? — Yes»: single instance + цикл → deadlock всех четырёх.', section: 'detect-examples', diff: 2 },
    { id: 'dl-31', type: 'single', q: 'RAG: P1 ждёт R1 (у P2) и R2 (у P4); P2 и P4 ждут R3 (у P3); P3 ничего не ждёт. Есть ли deadlock?', options: ['Да: P1 ждёт двух процессов', 'Да: P2 и P4 конкурируют за R3', 'Нет: wait-for graph P1→P2, P1→P4, P2→P3, P4→P3 без циклов', 'Невозможно определить'], answer: 2, explain: 'Циклов нет: P3 завершится, освободит R3 → P2 и P4 → затем P1.', section: 'detect-examples', diff: 2 },
    { id: 'dl-32', type: 'single', q: 'От чего зависит, когда и как часто запускать detection algorithm?', options: ['От числа ресурсов в Available', 'От того, как часто вероятен deadlock и сколько процессов придётся откатить', 'Только от приоритета процессов', 'От размера wait-for graph — запускать раз в n² тиков'], answer: 1, explain: 'Слайд Detection-Algorithm Usage: частота deadlock и число rollback (по одному на каждый disjoint cycle).', section: 'detection-usage', diff: 2 },
    { id: 'dl-33', type: 'multi', q: 'Какие критерии учитываются при выборе потока для завершения при recovery? (несколько ответов)', options: ['Priority потока', 'Сколько он уже вычислял и сколько осталось', 'Сколько потоков придётся завершить', 'Interactive или batch', 'Алфавитный порядок имени программы'], answer: [0, 1, 2, 3], explain: 'Критерии со слайда: priority, время вычисления и остаток, использованные и нужные ресурсы, число завершаемых потоков, interactive/batch.', section: 'recovery', diff: 2 },
    { id: 'dl-34', type: 'single', q: 'При resource preemption один и тот же процесс всё время выбирается жертвой. Как называется проблема и её решение?', options: ['Rollback; делать total rollback', 'Starvation; разрешить быть жертвой только конечное число раз', 'Deadlock; убить все процессы', 'Selecting a victim; выбирать по pid'], answer: 1, explain: 'Это starvation; решение со слайда — процесс может быть выбран жертвой лишь конечное число раз.', section: 'recovery', diff: 2 },
  ]
});
