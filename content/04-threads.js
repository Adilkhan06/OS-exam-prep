OS.addModule({
  id: 'threads',
  num: 4,
  group: 'theory',
  title: 'Threads',
  titleRu: 'Потоки',
  icon: '🧵',
  sources: ['4-Threads.pdf', '4bis - Recap.pdf'],
  summary: 'Потоки vs процессы, многоядерное программирование, concurrency vs parallelism, закон Амдала, user/kernel threads и модели M:1, 1:1, M:M, two-level, Pthreads (create, аргументы, join, attributes), threading issues, Linux clone(), Java.',
  sections: [
    {
      id: 'motivation',
      h: 'Motivation — зачем потоки',
      html: `
<ul>
  <li>Большинство современных приложений — <b>multithreaded</b>; потоки работают внутри приложения.</li>
  <li>Разные задачи приложения можно реализовать отдельными потоками: <b>update display</b>, <b>fetch data</b>, <b>spell checking</b>, <b>answer a network request</b>.</li>
  <li><b>Process creation — heavy-weight</b>, <b>thread creation — light-weight</b>.</li>
  <li>Потоки могут упростить код и повысить эффективность.</li>
  <li><b>Kernels</b> обычно тоже multithreaded.</li>
</ul>
<p><b>Single and Multithreaded Processes</b>:</p>
<table class="t">
  <tr><th></th><th>Single-threaded process</th><th>Multithreaded process</th></tr>
  <tr><td>Общее для всех потоков</td><td colspan="2"><b>code</b>, <b>data</b>, <b>files</b></td></tr>
  <tr><td>Своё у каждого потока</td><td>один набор: registers, PC, stack</td><td>у <b>каждого</b> потока свои <b>registers</b>, <b>stack</b>, <b>PC</b></td></tr>
</table>
<div data-viz="0"></div>
<p><b>Multithreaded Server Architecture</b>:</p>
<ol>
  <li>client отправляет <b>request</b> серверу;</li>
  <li>server <b>создаёт новый thread</b> для обслуживания запроса;</li>
  <li>server <b>продолжает слушать</b> (resume listening) новые запросы клиентов.</li>
</ol>
<div data-viz="1"></div>`,
      viz: [
        { name: 'layers', caption: 'Multithreaded process: общая часть сверху, у каждого потока — свои registers, stack, PC', props: { layers: [
          { label: 'code · data · files', sub: 'общие для всех потоков', tone: 'ok' },
          { label: 'Thread 1', sub: 'registers · stack · PC', tone: 'c1' },
          { label: 'Thread 2', sub: 'registers · stack · PC', tone: 'c2' },
          { label: 'Thread 3', sub: 'registers · stack · PC', tone: 'c3' }] } },
        { name: 'graph', caption: 'Multithreaded server: (1) request → (2) новый поток → (3) снова слушать', props: { w: 640, h: 200,
          nodes: [
            { id: 'c', label: 'client', x: 55, y: 70, tone: 'acc' },
            { id: 's', label: 'server', x: 255, y: 70, tone: 'warn' },
            { id: 't', label: 'thread', x: 575, y: 70, tone: 'ok' },
            { id: 'l', label: 'resume listening', sub: '(3) новые запросы', x: 255, y: 160, w: 150, shape: 'pill', tone: 'muted' }],
          edges: [
            { from: 'c', to: 's', label: '(1) request' }, { from: 's', to: 't', label: '(2) create new thread' },
            { from: 's', to: 'l', bend: 30 }, { from: 'l', to: 's', bend: 30 }] } }
      ],
      exam: 'Почему потоки: дешёвое создание, задачи приложения в отдельных потоках; схема multithreaded server.'
    },
    {
      id: 'definition',
      h: 'What is a Thread? — общее и личное (Recap)',
      html: `
<p><b>Thread</b> — <b>smallest unit of execution</b> внутри процесса.</p>
<div class="cols">
  <div class="callout key"><b>Shared</b> — потоки одного процесса делят:<ul><li><b>Code</b></li><li><b>Data</b> (heap, global variables)</li><li><b>File descriptors</b></li></ul></div>
  <div class="callout note"><b>Private</b> — у каждого потока свои:<ul><li><b>Program counter</b></li><li><b>Stack</b></li><li><b>CPU registers</b></li></ul></div>
</div>
<p><b>Efficiency</b>: создание и переключение потоков дешевле, чем процессов.</p>
<p><b>Threads Characteristics</b>:</p>
<table class="t">
  <tr><th>Характеристика</th><th>Смысл</th></tr>
  <tr><td><b>Thread ID (TID)</b></td><td>уникальный идентификатор потока внутри процесса — ОС различает отдельные потоки</td></tr>
  <tr><td><b>Program Counter (PC)</b></td><td>у каждого потока свой PC → потоки выполняют разные части программы одновременно</td></tr>
  <tr><td><b>Registers and Stack</b></td><td>code, data, heap общие; у каждого потока свой набор регистров и <b>отдельный stack</b></td></tr>
  <tr><td><b>Thread States</b></td><td>потоки переходят между состояниями в зависимости от доступности ресурсов и синхронизации</td></tr>
</table>
<p><b>Memory Management of Thread</b>: потоки разделяют <b>address space</b> родительского процесса.</p>
<div class="cols">
  <div class="pros"><b>+</b><ul><li>проще и быстрее коммуникация (shared memory by default)</li></ul></div>
  <div class="cons"><b>−</b><ul><li>нужна синхронизация (<b>mutexes, semaphores, monitors</b>), чтобы избежать <b>race conditions</b></li></ul></div>
</div>`,
      exam: 'Что общее (code, data/heap/globals, files) и что своё у потока (PC, stack, registers); TID.'
    },
    {
      id: 'benefits',
      h: 'Benefits — преимущества',
      html: `
<table class="t">
  <tr><th>Benefit</th><th>Смысл</th></tr>
  <tr><td><b>Responsiveness</b></td><td>выполнение может продолжаться, даже если часть процесса заблокирована — особенно важно для user interfaces</td></tr>
  <tr><td><b>Resource Sharing</b></td><td>потоки разделяют ресурсы процесса — проще, чем shared memory или message passing</td></tr>
  <tr><td><b>Economy</b></td><td>дешевле создания процесса; переключение потоков — меньший overhead, чем context switching процессов</td></tr>
  <tr><td><b>Scalability</b></td><td>процесс может использовать преимущества <b>multicore</b> архитектуры</td></tr>
</table>`,
      exam: 'Четыре benefits и их смысл (Responsiveness, Resource Sharing, Economy, Scalability).'
    },
    {
      id: 'vs-process',
      h: 'Processes vs Threads',
      html: `
<table class="t">
  <tr><th>Feature</th><th>Process</th><th>Thread</th></tr>
  <tr><td><b>Resource ownership</b></td><td>владеет собственной памятью и ресурсами</td><td>разделяет память и ресурсы с parent process</td></tr>
  <tr><td><b>Lifetime</b></td><td>независимое время жизни</td><td>зависит от времени жизни parent process</td></tr>
  <tr><td><b>Creation</b></td><td>дороже</td><td>дешевле</td></tr>
  <tr><td><b>Context switching</b></td><td>дорогое</td><td>дешевле</td></tr>
  <tr><td><b>Fault tolerance</b></td><td>crash не затрагивает другие процессы</td><td>crash затрагивает другие потоки процесса</td></tr>
</table>
<div data-viz="0"></div>
<ul>
  <li><b>Память</b>. Processes: у каждого своя memory space, процесс не может напрямую обратиться к памяти другого → для обмена данными нужен <b>IPC</b>. Threads: общая memory space, напрямую читают/пишут одни и те же переменные и структуры.</li>
  <li><b>Изоляция</b>. Processes изолированы → выше security и stability, но коммуникация сложнее и медленнее. Threads не изолированы → быстрая коммуникация, но возможны <b>data races</b> и <b>deadlocks</b>, если программист не управляет ими.</li>
  <li><b>Создание</b>. Новый процесс требует дублирования memory space родителя — ресурсоёмко. Поток — дешевле, память общая.</li>
  <li><b>Context switching</b>. Между процессами нужно сохранить ресурсы и окружение одного и загрузить другого. Между потоками сохраняется меньше: <b>не нужно менять memory maps</b>, переключается только состояние потока — <b>program counter и registers</b>.</li>
  <li><b>Fault tolerance</b>. Проблема в одном процессе не влияет на другие процессы; проблема в одном потоке может повлиять на другие потоки того же процесса.</li>
</ul>
<p><b>CPU Scheduling of Processes vs Threads</b> (Recap):</p>
<table class="t">
  <tr><th>Processes</th><th>Threads</th></tr>
  <tr><td>планируются ОС независимо</td><td>могут планироваться независимо (если <b>kernel-level</b>)</td></tr>
  <tr><td>context switch сохраняет/восстанавливает <b>полное</b> состояние процесса</td><td>context switch легче: только <b>CPU registers и stack</b></td></tr>
</table>
<p>Модели отображения: Many-to-One, One-to-One, Many-to-Many.</p>`,
      viz: [{ name: 'graph', caption: 'Threads общаются через общую память процесса; forked processes — только через IPC', props: { w: 700, h: 160,
        nodes: [
          { id: 't1', label: 'Thread', sub: 'memory space процесса', x: 75, y: 80, w: 130, tone: 'acc' },
          { id: 't2', label: 'Thread', sub: 'та же memory space', x: 300, y: 80, w: 130, tone: 'acc' },
          { id: 'p1', label: 'Process', sub: 'своя memory space', x: 460, y: 80, w: 130, tone: 'warn' },
          { id: 'p2', label: 'Process', sub: 'своя memory space', x: 630, y: 80, w: 130, tone: 'warn' }],
        edges: [{ from: 't1', to: 't2', label: 'общая память', both: true }, { from: 'p1', to: 'p2', label: 'IPC', both: true }] } }],
      exam: 'Таблица process vs thread (resource ownership, lifetime, creation, context switching, fault tolerance) и почему переключение потоков дешевле.'
    },
    {
      id: 'multicore',
      h: 'Multicore Programming, Concurrency vs Parallelism',
      html: `
<p>Multicore / multiprocessor системы создают трудности для программистов:</p>
<table class="t">
  <tr><th>Challenge</th><th>Суть</th></tr>
  <tr><td><b>Dividing activities</b></td><td>найти задачи, которые можно выполнять параллельно</td></tr>
  <tr><td><b>Balance</b></td><td>задачи должны выполнять сопоставимый объём работы</td></tr>
  <tr><td><b>Data splitting</b></td><td>данные нужно разделить между ядрами</td></tr>
  <tr><td><b>Data dependency</b></td><td>зависимости между данными задач требуют синхронизации</td></tr>
  <tr><td><b>Testing and debugging</b></td><td>много путей выполнения — сложно тестировать и отлаживать</td></tr>
</table>
<div class="cols">
  <div class="callout key"><b>Parallelism</b> — система может выполнять <b>более одной задачи одновременно</b> (нужно несколько ядер).</div>
  <div class="callout note"><b>Concurrency</b> — поддерживает <b>прогресс</b> более чем одной задачи; на single processor/core concurrency обеспечивает scheduler (чередование).</div>
</div>
<div data-viz="0"></div>
<div data-viz="1"></div>
<p><b>Types of parallelism</b>:</p>
<ul>
  <li><b>Data parallelism</b> — подмножества <b>одних и тех же данных</b> распределяются по ядрам, на каждом — <b>одна и та же операция</b>.</li>
  <li><b>Task parallelism</b> — по ядрам распределяются <b>потоки</b>, каждый выполняет <b>уникальную операцию</b>.</li>
</ul>
<div data-viz="2"></div>`,
      viz: [
        { name: 'timeline', caption: 'Concurrent execution on single-core system: задачи чередуются', props: { max: 9, rows: [
          { label: 'single core', segs: [
            { from: 0, to: 1, label: 'T1', tone: 'c1' }, { from: 1, to: 2, label: 'T2', tone: 'c2' }, { from: 2, to: 3, label: 'T3', tone: 'c3' }, { from: 3, to: 4, label: 'T4', tone: 'c4' },
            { from: 4, to: 5, label: 'T1', tone: 'c1' }, { from: 5, to: 6, label: 'T2', tone: 'c2' }, { from: 6, to: 7, label: 'T3', tone: 'c3' }, { from: 7, to: 8, label: 'T4', tone: 'c4' },
            { from: 8, to: 9, label: 'T1', tone: 'c1' }] }] } },
        { name: 'timeline', caption: 'Parallelism on a multi-core system: задачи выполняются одновременно', props: { max: 5, rows: [
          { label: 'core 1', segs: [{ from: 0, to: 1, label: 'T1', tone: 'c1' }, { from: 1, to: 2, label: 'T3', tone: 'c3' }, { from: 2, to: 3, label: 'T1', tone: 'c1' }, { from: 3, to: 4, label: 'T3', tone: 'c3' }, { from: 4, to: 5, label: 'T1', tone: 'c1' }] },
          { label: 'core 2', segs: [{ from: 0, to: 1, label: 'T2', tone: 'c2' }, { from: 1, to: 2, label: 'T4', tone: 'c4' }, { from: 2, to: 3, label: 'T2', tone: 'c2' }, { from: 3, to: 4, label: 'T4', tone: 'c4' }, { from: 4, to: 5, label: 'T2', tone: 'c2' }] }] } },
        { name: 'graph', caption: 'Data parallelism (данные делятся, операция одна) vs task parallelism (данные общие, операции разные)', props: { w: 620, h: 300,
          nodes: [
            { id: 'd0', label: 'data[0..¼)', x: 95, y: 35, w: 120, tone: 'muted' }, { id: 'd1', label: 'data[¼..½)', x: 237, y: 35, w: 120, tone: 'muted' },
            { id: 'd2', label: 'data[½..¾)', x: 380, y: 35, w: 120, tone: 'muted' }, { id: 'd3', label: 'data[¾..1]', x: 522, y: 35, w: 120, tone: 'muted' },
            { id: 'a0', label: 'core 0', x: 95, y: 110, tone: 'acc' }, { id: 'a1', label: 'core 1', x: 237, y: 110, tone: 'acc' },
            { id: 'a2', label: 'core 2', x: 380, y: 110, tone: 'acc' }, { id: 'a3', label: 'core 3', x: 522, y: 110, tone: 'acc' },
            { id: 'D', label: 'data', sub: 'одни и те же данные', x: 310, y: 185, w: 420, tone: 'muted' },
            { id: 'b0', label: 'core 0', sub: 'op A', x: 95, y: 265, tone: 'ok' }, { id: 'b1', label: 'core 1', sub: 'op B', x: 237, y: 265, tone: 'ok' },
            { id: 'b2', label: 'core 2', sub: 'op C', x: 380, y: 265, tone: 'ok' }, { id: 'b3', label: 'core 3', sub: 'op D', x: 522, y: 265, tone: 'ok' }],
          edges: [
            { from: 'd0', to: 'a0' }, { from: 'd1', to: 'a1' }, { from: 'd2', to: 'a2' }, { from: 'd3', to: 'a3' },
            { from: 'D', to: 'b0' }, { from: 'D', to: 'b1' }, { from: 'D', to: 'b2' }, { from: 'D', to: 'b3' }] } }
      ],
      exam: 'Concurrency (прогресс, возможна на 1 ядре) vs parallelism (одновременно, нужны ядра); data vs task parallelism; 5 challenges.'
    },
    {
      id: 'amdahl',
      h: 'Amdahl’s Law',
      html: `
<ul>
  <li>Оценивает прирост производительности от добавления ядер для приложения с <b>serial</b> и <b>parallel</b> частями.</li>
  <li><b>S</b> — serial portion (доля последовательной части), <b>N</b> — число processing cores.</li>
</ul>
<div class="formula">speedup ≤ 1 / ( S + (1 − S) / N )</div>
<div class="formula">75% parallel / 25% serial, 1 → 2 ядра: 1 / (0.25 + 0.75/2) = 1 / 0.625 = <b>1.6</b></div>
<div class="formula">N → ∞: speedup → 1 / S &nbsp; (S = 0.25 → максимум <b>4</b>, сколько бы ядер ни было)</div>
<div class="callout key"><b>Serial portion</b> приложения оказывает <b>непропорционально большое</b> влияние на прирост от добавления ядер.</div>
<table class="t">
  <tr><th>S</th><th>N = 2</th><th>N = 4</th><th>N = 16</th><th>N → ∞</th></tr>
  <tr><td>0.05</td><td>1.90</td><td>3.48</td><td>9.14</td><td>20</td></tr>
  <tr><td>0.10</td><td>1.82</td><td>3.08</td><td>6.40</td><td>10</td></tr>
  <tr><td>0.25</td><td>1.60</td><td>2.29</td><td>3.37</td><td>4</td></tr>
  <tr><td>0.50</td><td>1.33</td><td>1.60</td><td>1.88</td><td>2</td></tr>
</table>
<p>График на слайде: Ideal Speedup (= N) и кривые S = 0.05, 0.10, 0.50 для 1…16 ядер — при S = 0.50 кривая почти сразу упирается в 2.</p>
<div class="callout note">Вопрос со слайда: учитывает ли закон современные multicore системы? (Закон предполагает фиксированный объём работы и не учитывает, например, аппаратные особенности ядер.)</div>`,
      viz: [{ name: 'amdahl', caption: 'Двигай S и N: при S = 0.25 speedup не превысит 4', props: { s: 0.25, n: 2 } }],
      exam: 'Формула, пример 75/25 → 1.6, предел 1/S; посчитать speedup для заданных S и N.'
    },
    {
      id: 'hierarchy',
      h: 'Multi-Thread / Multi-Core / Multi-Processor (Recap)',
      html: `
<table class="t">
  <tr><th>Concept</th><th>Description</th><th>Parallelism Type</th><th>Example Architectures</th><th>Typical Use Cases</th></tr>
  <tr><td><b>Multithread</b></td><td>несколько потоков одной программы выполняются concurrently</td><td>Logical / software-level</td><td>Intel Hyper-Threading, Java threads</td><td>web browsers, GUI applications, серверы с множеством запросов</td></tr>
  <tr><td><b>Multi-core</b></td><td>один CPU с несколькими независимыми ядрами</td><td>Physical / hardware-level</td><td>Intel Core i7/i9, AMD Ryzen, ARM Cortex-A</td><td>video encoding, gaming, параллельные научные вычисления</td></tr>
  <tr><td><b>Multi-processor</b></td><td>несколько физических CPU в системе</td><td>Physical / hardware-level</td><td>dual-socket Intel Xeon, AMD EPYC servers</td><td>HPC, database servers, enterprise servers</td></tr>
</table>
<table class="t">
  <tr><th>Level</th><th>Concept</th><th>Relationship</th></tr>
  <tr><td>Software level</td><td>Multithreading</td><td>потоки создаются и управляются программами; наименьшие единицы выполнения, могут работать на любом доступном ядре или CPU</td></tr>
  <tr><td>Hardware level (single CPU)</td><td>Multi-core</td><td>один CPU с несколькими ядрами выполняет несколько потоков <b>действительно параллельно</b>; потоки планируются по ядрам</td></tr>
  <tr><td>Hardware level (system)</td><td>Multi-processor</td><td>несколько CPU выполняют потоки на ядрах разных процессоров → ещё больше параллелизма</td></tr>
</table>
<p>Пример с сервером:</p>
<ul>
  <li><b>Multi-threading</b>: каждый client request обрабатывает отдельный поток.</li>
  <li><b>Multi-core CPU</b>: потоки распределены по N ядрам → <b>N</b> запросов одновременно.</li>
  <li><b>Multi-processor system</b>: M CPU по N ядер → <b>M·N</b> запросов одновременно.</li>
</ul>
<div class="formula">2 CPU × 4 cores = 2·4 = <b>8</b> запросов одновременно</div>
<div data-viz="0"></div>
<div class="callout warn">Key point: multi-threading нужны ядра для <b>настоящего</b> параллелизма; иначе потоки просто <b>чередуются (interleaved)</b> на одном ядре. Multi-core даёт multithreaded программам реальный параллелизм, multi-processor масштабирует его на ещё большие нагрузки.</div>`,
      viz: [{ name: 'flow', caption: 'Hierarchical relationship', props: { dir: 'v', steps: [
        { label: 'Multithread', sub: 'software: Thread · Thread · Thread · Thread', tone: 'c1' },
        { label: 'Multi-core', sub: '1 CPU × N cores → N потоков параллельно', tone: 'c2' },
        { label: 'Multi-processor', sub: 'M CPU × N cores → M·N потоков параллельно', tone: 'c3' }] } }],
      exam: 'Различие multithread / multi-core / multi-processor (software vs hardware), расчёт M·N.'
    },
    {
      id: 'user-kernel',
      h: 'User Threads и Kernel Threads',
      html: `
<div class="cols">
  <div><b>User threads</b> — управление выполняет <b>user-level threads library</b>.
    <ul><li>Thread libraries: <b>POSIX Pthreads</b>.</li></ul></div>
  <div><b>Kernel threads</b> — поддерживаются <b>ядром</b>.
    <ul><li>Примеры — практически все general-purpose ОС: <b>Windows, Linux, Mac OS X, iOS, Android</b>.</li></ul></div>
</div>
<p><b>Types of Thread</b> (Recap):</p>
<table class="t">
  <tr><th></th><th><b>User-level Threads (ULTs)</b></th><th><b>Kernel-level Threads (KLTs)</b></th></tr>
  <tr><td>Кто управляет</td><td>целиком user-level libraries или приложение</td><td>ядро ОС напрямую</td></tr>
  <tr><td>Что видит ядро</td><td>ядро <b>не знает</b> о ULT, управляет процессом как <b>single-threaded</b></td><td>ядро видит и планирует каждый поток</td></tr>
  <tr><td>Плюс</td><td><b>flexibility</b></td><td>лучшая поддержка <b>parallelism</b> и использования ресурсов</td></tr>
  <tr><td>Минус</td><td>ограничения в использовании системных ресурсов</td><td><b>overhead</b> участия ядра снижает производительность</td></tr>
</table>`,
      exam: 'ULT: ядро о них не знает; KLT: поддерживаются ядром (все современные ОС); плюсы и минусы.'
    },
    {
      id: 'models',
      h: 'Multithreading Models: M:1, 1:1, M:M, Two-level',
      html: `
<table class="t">
  <tr><th>Модель</th><th>Отображение</th><th>Особенности</th><th>Примеры</th></tr>
  <tr><td><b>Many-to-One</b></td><td>много user-level threads → <b>один</b> kernel thread</td><td>блокировка одного потока <b>блокирует все</b>; потоки <b>не могут</b> выполняться параллельно на multicore — в ядре одновременно может быть только один; сейчас используется редко</td><td><b>Solaris Green Threads</b>, <b>GNU Portable Threads</b></td></tr>
  <tr><td><b>One-to-One</b></td><td>каждый user-level thread → свой kernel thread</td><td>создание user thread создаёт kernel thread; <b>больше concurrency</b>, чем M:1; число потоков на процесс иногда <b>ограничено</b> из-за overhead</td><td><b>Windows</b>, <b>Linux</b></td></tr>
  <tr><td><b>Many-to-Many</b></td><td>много user-level → много kernel threads</td><td>ОС создаёт <b>достаточное</b> число kernel threads; в остальном встречается редко</td><td>Windows с пакетом <b>ThreadFiber</b></td></tr>
  <tr><td><b>Two-level</b></td><td>как M:M</td><td>плюс позволяет <b>привязать (bound)</b> user thread к kernel thread</td><td>—</td></tr>
</table>`,
      viz: [{ name: 'threadModels', caption: 'Переключай модели: M:1, 1:1, M:M, two-level', props: { model: 'm1' } }],
      exam: 'Каждая модель: что на что отображается, что будет при блокировке, есть ли параллелизм, примеры (Linux/Windows — 1:1).'
    },
    {
      id: 'libraries',
      h: 'Thread Libraries и Pthreads API',
      html: String.raw`
<ul>
  <li><b>Thread library</b> даёт программисту API для создания и управления потоками.</li>
  <li>Два основных способа реализации: библиотека <b>целиком в user space</b>; <b>kernel-level</b> библиотека, поддерживаемая ОС.</li>
</ul>
<p><b>Pthreads — POSIX specification</b>:</p>
<ul>
  <li>Может быть реализована как user-level или kernel-level.</li>
  <li><b>POSIX standard (IEEE 1003.1c-1995)</b> API для создания потоков и синхронизации.</li>
  <li><b>Specification, not implementation</b>: API задаёт поведение библиотеки, реализация — на усмотрение разработчиков библиотеки.</li>
  <li>Распространена в UNIX (Linux и Mac OS X).</li>
</ul>
<p>Для Pthreads нужно подключить <code>pthread.h</code>. <code>main()</code> — единственный поток по умолчанию; все остальные потоки программист создаёт явно.</p>
<pre class="code" data-lang="c">int pthread_create(pthread_t *thread,
                   const pthread_attr_t *attr,
                   void *(*start_routine)(void *),
                   void *arg);</pre>
<table class="t">
  <tr><th>Аргумент</th><th>Смысл</th></tr>
  <tr><td><code>thread</code></td><td>уникальный идентификатор нового потока, возвращаемый функцией</td></tr>
  <tr><td><code>attr</code></td><td>объект атрибутов потока; <code>NULL</code> — значения по умолчанию</td></tr>
  <tr><td><code>start_routine</code></td><td>C-функция, которую поток выполнит после создания</td></tr>
  <tr><td><code>arg</code></td><td><b>один</b> аргумент для start_routine; передаётся <b>по ссылке</b> как указатель, приведённый к <code>void *</code>; <code>NULL</code>, если аргумента нет</td></tr>
</table>
<ul>
  <li>Создаёт новый поток и делает его исполняемым.</li>
  <li>При успехе возвращает <b>0</b>; при ошибке — <b>номер ошибки</b>, содержимое <code>*thread</code> не определено.</li>
  <li>Созданные потоки сами могут создавать другие потоки.</li>
</ul>`,
      exam: 'Pthreads — спецификация, а не реализация; аргументы pthread_create и возвращаемое значение (0 при успехе).'
    },
    {
      id: 'pthreads',
      h: 'Pthreads example — PrintHello',
      html: String.raw`
<pre class="code" data-lang="c">#include &lt;pthread.h&gt;
#include &lt;stdio.h&gt;
#include &lt;stdlib.h&gt;
#define NUM_THREADS 5

void *PrintHello(void *threadid)
{
    printf("\n%d: Hello World! \n", (int)threadid);
    pthread_exit(NULL);
}

int main(int argc, char *argv[])
{
    pthread_t threads[NUM_THREADS];
    int rc, t;
    for (t = 0; t &lt; NUM_THREADS; t++) {
        printf("Creating thread %d\n", t);
        rc = pthread_create(&amp;threads[t], NULL, PrintHello, (void *)(size_t)t);
        if (rc) {
            printf("ERROR; return code from pthread_create() is %d\n", rc);
            exit(-1);
        }
    }
    pthread_exit(NULL);
}</pre>
<ul>
  <li>Номер потока передаётся <b>по значению</b>, упакованным в указатель: <code>(void *)(size_t)t</code>; поток распаковывает его <code>(int)threadid</code>. Каждый поток получает своё значение.</li>
  <li>Строки «Creating thread i» идут по порядку, а «i: Hello World!» — в <b>недетерминированном</b> порядке (решает scheduler).</li>
  <li><code>rc != 0</code> → ошибка создания.</li>
  <li>В конце <code>main</code> вызывает <code>pthread_exit(NULL)</code>, а не <code>return</code>: завершается только главный поток, процесс живёт, пока работают остальные потоки. <code>return</code> из main завершил бы процесс со всеми потоками.</li>
</ul>`,
      exam: 'Что напечатает PrintHello (порядок не определён); зачем pthread_exit(NULL) в конце main.'
    },
    {
      id: 'args',
      h: 'Thread Argument Passing — «Does it work?» / «It works!»',
      html: String.raw`
<ul>
  <li><code>pthread_create()</code> позволяет передать в start routine <b>один</b> аргумент.</li>
  <li>Несколько аргументов — создать <b>структуру</b> со всеми аргументами и передать указатель на неё.</li>
  <li>Все аргументы передаются <b>по ссылке</b> и приводятся к <code>(void *)</code>.</li>
</ul>
<p>Корректный способ — отдельная память под аргумент каждого потока:</p>
<pre class="code" data-lang="c">int *inputids[NUM_THREADS];
...
for (t = 0; t &lt; NUM_THREADS; t++) {
    inputids[t] = (int *) malloc(sizeof(int));
    *inputids[t] = t;
    printf("Creating thread %d\n", t);
    rc = pthread_create(&amp;threads[t], NULL, PrintHello, (void *) inputids[t]);
    ...
}</pre>
<p><b>Example — Does it work?</b></p>
<pre class="code" data-lang="c">#define NUM_THREADS 8
char *messages[NUM_THREADS];

void *PrintHello(void *threadid)
{
    int *id_ptr, taskid;
    sleep(3);
    id_ptr = (int *) threadid;
    taskid = *id_ptr;
    printf("Thread %d: %s\n", taskid, messages[taskid]);
    pthread_exit(NULL);
}

int main(int argc, char *argv[])
{
    pthread_t threads[NUM_THREADS];
    int rc, t;
    messages[0] = "English: Hello World!";
    messages[1] = "French: Bonjour, le monde!";
    messages[2] = "Spanish: Hola al mundo";
    messages[3] = "Klingon: Nuq neH!";
    messages[4] = "German: Guten Tag, Welt!";
    messages[5] = "Russian: Zdravstvytye, mir!";
    messages[6] = "Japan: Sekai e konnichiwa!";
    messages[7] = "Latin: Orbis, te saluto!";
    for (t = 0; t &lt; NUM_THREADS; t++) {
        printf("Creating thread %d\n", t);
        rc = pthread_create(&amp;threads[t], NULL, PrintHello, (void *) &amp;t);
        if (rc) {
            printf("ERROR; return code from pthread_create() is %d\n", rc);
            exit(-1);
        }
    }
    pthread_exit(NULL);
}</pre>
<div class="callout warn"><b>Не работает</b>: всем потокам передаётся адрес <b>одной и той же</b> переменной <code>t</code>. Потоки читают её через 3 секунды — к этому моменту цикл закончился и <code>t == 8</code>. Все потоки видят одно и то же (скорее всего 8) значение, а <code>messages[8]</code> — выход за границы массива.</div>
<p><b>Example — It works!</b> — у каждого потока своя ячейка массива:</p>
<pre class="code" data-lang="c">int param[NUM_THREADS];
...
for (t = 0; t &lt; NUM_THREADS; t++) {
    printf("Creating thread %d\n", t);
    param[t] = t;
    rc = pthread_create(&amp;threads[t], NULL, PrintHello, (void *) &amp;param[t]);
    ...
}</pre>
<div class="callout key">Каждый поток получает указатель на <b>свой</b> <code>param[t]</code>, который больше не меняется → «Thread i: messages[i]» для i = 0…7 (в произвольном порядке).</div>`,
      viz: [{ name: 'stepper', caption: 'Почему (void *) &t не работает', props: { lang: 'c', code: String.raw`void *PrintHello(void *threadid) {
    int *id_ptr, taskid;
    sleep(3);
    id_ptr = (int *) threadid;
    taskid = *id_ptr;
    printf("Thread %d: %s\n", taskid, messages[taskid]);
    pthread_exit(NULL);
}
/* main */
for (t = 0; t < NUM_THREADS; t++) {
    printf("Creating thread %d\n", t);
    rc = pthread_create(&threads[t], NULL, PrintHello, (void *) &t);
}
pthread_exit(NULL);`, steps: [
        { line: [10, 11, 12], note: 't = 0: создаётся поток 0, ему передан АДРЕС переменной t (не значение).', vars: { t: 0, 'arg потока 0': '&t' }, out: 'Creating thread 0' },
        { line: 3, note: 'Поток 0 сразу засыпает на 3 s и ещё не прочитал *threadid.', vars: { t: 0 } },
        { line: [10, 11, 12], note: 'main продолжает цикл: потоки 1…7 получают тот же адрес &t.', vars: { t: 7, 'arg всех потоков': '&t' }, out: 'Creating thread 1\nCreating thread 2\nCreating thread 3\nCreating thread 4\nCreating thread 5\nCreating thread 6\nCreating thread 7' },
        { line: 14, note: 'Цикл закончился: t = 8. Главный поток завершается через pthread_exit, процесс живёт.', vars: { t: 8 } },
        { line: [4, 5], note: 'Через 3 s каждый поток читает *id_ptr — это текущее значение t, т.е. 8 у всех.', vars: { t: 8, taskid: 8 } },
        { line: 6, note: 'messages[8] — за границей массива из 8 элементов: мусор или crash. Исправление: param[t] = t; передать &param[t].', vars: { taskid: 8 }, out: 'Thread 8: ???   (×8 — у всех потоков одинаково)' }] } }],
      exam: '«Does it work?» — нет: все потоки получают &t; как исправить (param[t] или malloc на поток).'
    },
    {
      id: 'fork-join',
      h: 'Fork-Join Parallelism',
      html: `
<p>Несколько потоков (задач) <b>forked</b>, затем <b>joined</b> — <b>divide et impera</b>.</p>
<pre class="code" data-lang="text">// Fork: create two threads (pseudocode)
Thread t1 = new Thread(() -&gt; ParallelWork1());
Thread t2 = new Thread(() -&gt; ParallelWork2());
t1.start();   // starting in parallel
t2.start();
// Join: wait they end
t1.join();
t2.join();
System.out.println("Both threads end, it is possible to continue!");</pre>
<p><b>General algorithm for fork-join strategy</b>:</p>
<pre class="code" data-lang="text">Task(problem)
   if problem is small enough
      solve the problem directly
   else
      subtask1 = fork(new Task(subset of problem))
      subtask2 = fork(new Task(subset of problem))

      result1 = join(subtask1)
      result2 = join(subtask2)

      return combined results</pre>`,
      viz: [{ name: 'tree', caption: 'Рекурсивное деление: fork вниз, join (объединение результатов) вверх', props: { root: { label: 'task', note: 'fork ×2 → join', tone: 'acc', children: [
        { label: 'task', note: 'fork ×2 → join', tone: 'c2', children: [{ label: 'task', note: 'small: solve directly', tone: 'ok' }, { label: 'task', note: 'small: solve directly', tone: 'ok' }] },
        { label: 'task', note: 'fork ×2 → join', tone: 'c2', children: [{ label: 'task', note: 'small: solve directly', tone: 'ok' }, { label: 'task', note: 'small: solve directly', tone: 'ok' }] }] } } }],
      exam: 'Алгоритм fork-join: задача достаточно мала → решить; иначе fork подзадач, join результатов.'
    },
    {
      id: 'join',
      h: 'Join, joinable/detached attributes, Check concurrency',
      html: String.raw`
<p><b>Join</b>: master thread создаёт worker (<code>pthread_create()</code>), worker делает работу и вызывает <code>pthread_exit()</code>; master в <code>pthread_join()</code> ждёт его завершения и продолжает.</p>
<div data-viz="0"></div>
<p><b>Join Example</b>:</p>
<pre class="code" data-lang="c">#include &lt;stdio.h&gt;
#include &lt;stdlib.h&gt;
#include &lt;pthread.h&gt;
void *print_message_function(void *ptr);
int main()
{
    pthread_t thr1, thr2;
    char *message1 = "Hello";
    char *message2 = "World";
    int thpoint1, thpoint2;
    thpoint1 = pthread_create(&amp;thr1, NULL, print_message_function, (void*) message1);
    thpoint2 = pthread_create(&amp;thr2, NULL, print_message_function, (void*) message2);
    pthread_join(thr1, NULL);
    pthread_join(thr2, NULL);
    printf("thr1 returns: %d\n", thpoint1);
    printf("thr2 returns: %d\n", thpoint2);
    pthread_exit(NULL);
}
void *print_message_function(void *ptr)
{
    char *message;
    message = (char *) ptr;
    printf("%s\n", message);
    pthread_exit(NULL);
}</pre>
<div class="callout key">Вывод: «Hello» и «World» в <b>любом порядке</b>, затем <b>всегда</b> «thr1 returns: 0» и «thr2 returns: 0» — main печатает их только после обоих <code>pthread_join</code>. 0 — это код возврата <code>pthread_create</code> (успех), а не результат потока.</div>
<p><b>Attributes — joinable или detached</b>:</p>
<ul>
  <li>При создании потока один из его атрибутов определяет, <b>joinable</b> он или <b>detached</b>.</li>
  <li>Join возможен <b>только</b> для потоков, созданных joinable. <b>Detached</b> поток <b>никогда</b> нельзя join.</li>
  <li>Шаги: объявить переменную <code>pthread_attr_t</code>; инициализировать <code>pthread_attr_init()</code>; задать состояние <code>pthread_attr_setdetachstate()</code>.</li>
  <li><code>pthread_detach()</code> явно делает detached даже поток, созданный joinable. <b>Обратной функции нет</b>.</li>
</ul>
<pre class="code" data-lang="c">int rc;
pthread_t thread;
pthread_attr_t attr;
pthread_attr_init(&amp;attr);
pthread_attr_setdetachstate(&amp;attr, PTHREAD_CREATE_JOINABLE);
rc = pthread_create(&amp;thread[t], &amp;attr, BusyWork, NULL);</pre>
<p><b>Check concurrency</b>:</p>
<pre class="code" data-lang="c">#include &lt;stdio.h&gt;
#include &lt;stdlib.h&gt;
#include &lt;assert.h&gt;
#include &lt;pthread.h&gt;
#include &lt;unistd.h&gt;
#define NUM_THREADS 5

void *perform_work(void *arguments) {
    int index = *((int *)arguments);
    int sleep_time = 5;
    printf("THREAD %d: Started.\n", index + 1);
    printf("THREAD %d: Will be sleeping for %d seconds.\n", index + 1, sleep_time);
    sleep(sleep_time);
    printf("THREAD %d: Ended.\n", index + 1);
    pthread_exit((void *)0);
}

int main() {
    pthread_t threads[NUM_THREADS];
    int thread_args[NUM_THREADS];
    short i;
    int result_code;
    //create all threads one by one
    for (i = 0; i &lt; NUM_THREADS; i++) {
        printf("IN MAIN: Creating thread %d.\n", i + 1);
        thread_args[i] = i;
        result_code = pthread_create(&amp;threads[i], NULL, perform_work, &amp;i);
        assert(!result_code);
    }
    printf("IN MAIN: All threads are created.\n");
    //wait for each thread to complete
    for (i = 0; i &lt; NUM_THREADS; i++) {
        result_code = pthread_join(threads[i], NULL);
        assert(!result_code);
        printf("IN MAIN: Thread %d has ended.\n", i + 1);
    }
    printf("MAIN program has ended.\n");
    return 0;
}</pre>
<ul>
  <li>Все 5 потоков создаются сразу и спят <b>одновременно</b> → программа работает <b>≈ 5 s</b>, а не 5 × 5 = 25 s. Это и показывает concurrency.</li>
  <li>«IN MAIN: Thread i has ended.» печатаются <b>строго в порядке 1…5</b> — порядок задают вызовы <code>pthread_join</code>, а не фактическое завершение потоков.</li>
</ul>
<div class="callout warn">На слайде в <code>pthread_create</code> передаётся <code>&amp;i</code>, а не <code>&amp;thread_args[i]</code> — та же ошибка, что в «Does it work?» (плюс <code>i</code> объявлена как <code>short</code>, а читается как <code>int</code>). Номера в «THREAD n: …» могут быть неверными; правильно — <code>&amp;thread_args[i]</code>.</div>`,
      viz: [{ name: 'graph', caption: 'Join: master ждёт worker в pthread_join()', props: { w: 620, h: 190,
        nodes: [
          { id: 'm', label: 'Master Thread', x: 75, y: 45, w: 120, tone: 'acc' },
          { id: 'c', label: 'pthread_create()', x: 240, y: 45, w: 140 },
          { id: 'j', label: 'pthread_join()', x: 450, y: 45, w: 140, tone: 'warn' },
          { id: 'go', label: 'continue', x: 575, y: 45, w: 80, shape: 'pill', tone: 'muted' },
          { id: 'w', label: 'Worker Thread', sub: 'DO WORK', x: 240, y: 145, w: 140, tone: 'ok' },
          { id: 'e', label: 'pthread_exit()', x: 450, y: 145, w: 140, tone: 'ok' }],
        edges: [{ from: 'm', to: 'c' }, { from: 'c', to: 'j' }, { from: 'j', to: 'go' }, { from: 'c', to: 'w' }, { from: 'w', to: 'e' }, { from: 'e', to: 'j' }] } }],
      exam: 'Порядок вывода Join Example; joinable vs detached, pthread_detach без обратной операции; время работы Check concurrency.'
    },
    {
      id: 'fork-exec',
      h: 'Threading Issues: семантика fork() и exec()',
      html: `
<p><b>Threading Issues</b>: семантика <code>fork()</code> и <code>exec()</code>; <b>signal handling</b> (synchronous и asynchronous); <b>thread cancellation</b> target thread (asynchronous или deferred); <b>thread-local storage</b>; <b>scheduler activations</b>.</p>
<ul>
  <li>Если <code>fork()</code> вызывает один поток многопоточного процесса — дублирует ли новый процесс <b>только вызвавший поток</b> или <b>все потоки</b>?</li>
  <li>В некоторых UNIX есть <b>две версии fork</b> (дублирует все потоки / только вызывающий).</li>
  <li><code>exec()</code> обычно работает как обычно — <b>заменяет весь процесс, включая все потоки</b>.</li>
</ul>
<div class="callout note">Следствие (Silberschatz): если сразу после <code>fork()</code> вызывается <code>exec()</code>, дублировать все потоки бессмысленно — достаточно версии, копирующей только вызывающий поток.</div>`,
      exam: 'Две версии fork в многопоточном процессе; exec() заменяет весь процесс со всеми потоками.'
    },
    {
      id: 'signals',
      h: 'Signal Handling',
      html: `
<ul>
  <li><b>Signals</b> в UNIX уведомляют процесс о том, что произошло определённое событие.</li>
  <li>Сигналы обрабатывает <b>signal handler</b>:
    <ol><li>сигнал <b>генерируется</b> определённым событием;</li><li>сигнал <b>доставляется</b> процессу;</li><li>сигнал <b>обрабатывается</b> одним из двух обработчиков: <b>default</b> или <b>user-defined</b>.</li></ol></li>
  <li>У каждого сигнала есть <b>default handler</b>, который выполняет <b>ядро</b>; <b>user-defined</b> handler может его переопределить.</li>
  <li>В single-threaded процессе сигнал доставляется процессу.</li>
</ul>
<p>Куда доставить сигнал в <b>multithreaded</b> процессе? Варианты:</p>
<ol>
  <li>потоку, к которому сигнал относится;</li>
  <li>каждому потоку процесса;</li>
  <li>определённым потокам процесса;</li>
  <li>назначить специальный поток, получающий все сигналы процесса.</li>
</ol>`,
      exam: 'Default vs user-defined handler; 4 варианта доставки сигнала в многопоточном процессе.'
    },
    {
      id: 'cancellation',
      h: 'Thread Cancellation',
      html: `
<ul>
  <li><b>Thread cancellation</b> — завершение потока до того, как он закончил работу. Отменяемый поток — <b>target thread</b>.</li>
  <li>Два подхода:
    <ul>
      <li><b>Asynchronous cancellation</b> — завершает target thread <b>немедленно</b>;</li>
      <li><b>Deferred cancellation</b> — target thread <b>периодически проверяет</b>, не пора ли ему завершиться.</li>
    </ul></li>
</ul>
<pre class="code" data-lang="c">pthread_t tid;

/* create the thread */
pthread_create(&amp;tid, 0, worker, NULL);
. . .
/* cancel the thread */
pthread_cancel(tid);

/* wait for the thread to terminate */
pthread_join(tid, NULL);</pre>
<ul>
  <li>Вызов cancellation лишь <b>запрашивает</b> отмену; фактическая отмена зависит от состояния потока.</li>
  <li>Если у потока cancellation <b>disabled</b> — запрос остаётся <b>pending</b>, пока поток её не включит.</li>
  <li><b>Тип по умолчанию — deferred</b>: отмена происходит только когда поток достигает <b>cancellation point</b> (например, <code>pthread_testcancel()</code>); затем вызывается <b>cleanup handler</b>.</li>
  <li>В Linux thread cancellation реализована через <b>signals</b>.</li>
</ul>`,
      exam: 'Asynchronous vs deferred; тип по умолчанию (deferred); cancellation point, pthread_testcancel(), cleanup handler; что если cancellation disabled.'
    },
    {
      id: 'tls',
      h: 'Thread-Local Storage (TLS)',
      html: `
<ul>
  <li><b>Thread-local storage (TLS)</b> позволяет каждому потоку иметь <b>собственную копию данных</b>.</li>
  <li>Полезно, когда нет контроля над созданием потоков (например, при <b>thread pool</b>).</li>
</ul>
<table class="t">
  <tr><th>Local variables</th><th>TLS</th></tr>
  <tr><td>видны только во время <b>одного вызова функции</b></td><td>видны <b>между вызовами</b> функций</td></tr>
  <tr><td>—</td><td>похожи на <b>static</b> data, но <b>уникальны для каждого потока</b></td></tr>
</table>`,
      exam: 'TLS vs локальные переменные vs static.'
    },
    {
      id: 'sched-act',
      h: 'Scheduler Activations, LWP, upcalls',
      html: `
<ul>
  <li>Модели <b>M:M</b> и <b>Two-level</b> требуют коммуникации, чтобы поддерживать нужное число kernel threads, выделенных приложению.</li>
  <li>Обычно используется промежуточная структура между user и kernel threads — <b>lightweight process (LWP)</b>:
    <ul>
      <li>выглядит как <b>virtual processor</b>, на котором процесс может запускать user thread;</li>
      <li>каждый LWP привязан к <b>kernel thread</b>;</li>
      <li>сколько LWP создавать?</li>
    </ul></li>
  <li><b>Scheduler activations</b> предоставляют <b>upcalls</b> — механизм коммуникации <b>от ядра</b> к <b>upcall handler</b> в thread library.</li>
  <li>Это позволяет приложению поддерживать правильное число kernel threads.</li>
</ul>`,
      viz: [{ name: 'flow', caption: 'User thread → LWP (virtual processor) → kernel thread; upcalls идут от ядра к библиотеке', props: { dir: 'h', steps: [
        { label: 'User thread', sub: 'thread library' }, { label: 'LWP', sub: 'virtual processor', tone: 'acc' },
        { label: 'Kernel thread', sub: 'upcall → upcall handler', tone: 'warn' }, { label: 'CPU', tone: 'ok' }] } }],
      exam: 'Что такое LWP и upcall; зачем scheduler activations (M:M и two-level).'
    },
    {
      id: 'linux',
      h: 'Linux Threads — tasks и clone()',
      html: `
<ul>
  <li>Linux называет их <b>tasks</b>, а не threads.</li>
  <li>Поток создаётся system call'ом <code>clone()</code>.</li>
  <li><code>clone()</code> позволяет child task <b>разделять address space</b> parent task (процесса).</li>
  <li>Поведение задают <b>flags</b>:</li>
</ul>
<table class="t">
  <tr><th>flag</th><th>meaning</th></tr>
  <tr><td><code>CLONE_FS</code></td><td>File-system information is shared.</td></tr>
  <tr><td><code>CLONE_VM</code></td><td>The same memory space is shared.</td></tr>
  <tr><td><code>CLONE_SIGHAND</code></td><td>Signal handlers are shared.</td></tr>
  <tr><td><code>CLONE_FILES</code></td><td>The set of open files is shared.</td></tr>
</table>
<ul>
  <li><code>struct task_struct</code> указывает на структуры данных процесса — <b>shared или unique</b>.</li>
</ul>
<div class="callout key">С флагами разделения clone() создаёт «поток» (общие память, файлы, обработчики); без них — получается отдельный процесс, как при fork().</div>`,
      exam: 'Linux: tasks, clone(), значения флагов CLONE_VM / CLONE_FILES / CLONE_FS / CLONE_SIGHAND.'
    },
    {
      id: 'java',
      h: 'Multi-Thread in Java (Recap)',
      html: `
<p>В Java поток создаётся двумя способами — в обоих переопределяется метод <code>run()</code>:</p>
<div class="cols">
<pre class="code" data-lang="text">class MyThread extends Thread {
    public void run() {
        System.out.println("Thread in execution");
    }
}</pre>
<pre class="code" data-lang="text">class MyRunnable implements Runnable {
    public void run() {
        System.out.println("Runnable in execution");
    }
}</pre>
</div>
<ul>
  <li><b>extends Thread</b> — класс сам является потоком;</li>
  <li><b>implements Runnable</b> — задача (Runnable) передаётся объекту Thread.</li>
  <li>Запуск — <code>start()</code>, ожидание — <code>join()</code> (см. Fork-Join).</li>
</ul>`,
      exam: 'Два способа: extends Thread и implements Runnable; переопределяется run().'
    }
  ],
  terms: [
    { en: 'Thread', ru: 'Поток', def: 'Наименьшая единица выполнения внутри процесса: свои PC, registers, stack; общие code, data, files.' },
    { en: 'Thread ID (TID)', ru: 'Идентификатор потока', def: 'Уникальный идентификатор потока внутри процесса.' },
    { en: 'Multithreaded process', ru: 'Многопоточный процесс', def: 'Процесс с несколькими потоками, каждый со своими registers, stack, PC.' },
    { en: 'Responsiveness', ru: 'Отзывчивость', def: 'Приложение продолжает работу, даже если часть его заблокирована.' },
    { en: 'Economy', ru: 'Экономичность', def: 'Создание и переключение потоков дешевле, чем процессов.' },
    { en: 'Scalability', ru: 'Масштабируемость', def: 'Многопоточный процесс использует несколько ядер.' },
    { en: 'Concurrency', ru: 'Конкурентность', def: 'Несколько задач делают прогресс (возможно чередованием на одном ядре).' },
    { en: 'Parallelism', ru: 'Параллелизм', def: 'Несколько задач выполняются одновременно (нужно несколько ядер).' },
    { en: 'Data parallelism', ru: 'Параллелизм данных', def: 'Подмножества одних данных на разных ядрах, одна и та же операция.' },
    { en: 'Task parallelism', ru: 'Параллелизм задач', def: 'Потоки на разных ядрах выполняют разные операции.' },
    { en: 'Amdahl’s Law', ru: 'Закон Амдала', def: 'speedup ≤ 1 / (S + (1 − S)/N); при N → ∞ стремится к 1/S.' },
    { en: 'User threads (ULT)', ru: 'Пользовательские потоки', def: 'Управляются user-level библиотекой; ядро о них не знает.' },
    { en: 'Kernel threads (KLT)', ru: 'Потоки ядра', def: 'Поддерживаются и планируются ядром (Windows, Linux, macOS, iOS, Android).' },
    { en: 'Many-to-One', ru: 'Многие-к-одному', def: 'Много user threads на один kernel thread: блокировка одного блокирует все, нет параллелизма.' },
    { en: 'One-to-One', ru: 'Один-к-одному', def: 'Каждый user thread — свой kernel thread (Windows, Linux); число потоков может ограничиваться.' },
    { en: 'Many-to-Many', ru: 'Многие-ко-многим', def: 'Много user threads на много kernel threads (Windows ThreadFiber).' },
    { en: 'Two-level model', ru: 'Двухуровневая модель', def: 'M:M плюс возможность привязать (bound) user thread к kernel thread.' },
    { en: 'Pthreads', ru: 'POSIX threads', def: 'POSIX стандарт IEEE 1003.1c API для потоков — спецификация, не реализация.' },
    { en: 'pthread_create()', ru: 'Создание потока', def: 'Создаёт поток (thread, attr, start_routine, arg); возвращает 0 при успехе.' },
    { en: 'pthread_join()', ru: 'Ожидание потока', def: 'Блокирует вызывающий поток до завершения указанного joinable потока.' },
    { en: 'Detached thread', ru: 'Отсоединённый поток', def: 'Поток, который нельзя join; pthread_detach() делает поток detached, обратной функции нет.' },
    { en: 'Fork-join', ru: 'Разделяй и властвуй', def: 'Задачи разветвляются (fork) на подзадачи, затем результаты объединяются (join).' },
    { en: 'Signal handler', ru: 'Обработчик сигнала', def: 'Default (выполняет ядро) или user-defined (переопределяет default).' },
    { en: 'Target thread', ru: 'Отменяемый поток', def: 'Поток, который нужно отменить (thread cancellation).' },
    { en: 'Asynchronous cancellation', ru: 'Асинхронная отмена', def: 'Немедленно завершает target thread.' },
    { en: 'Deferred cancellation', ru: 'Отложенная отмена', def: 'Тип по умолчанию: поток завершается в cancellation point (pthread_testcancel()).' },
    { en: 'Thread-local storage (TLS)', ru: 'Локальная память потока', def: 'Своя копия данных у каждого потока, видна между вызовами функций.' },
    { en: 'LWP', ru: 'Lightweight process', def: 'Промежуточная структура: virtual processor для user threads, привязан к kernel thread.' },
    { en: 'Upcall', ru: 'Вызов «вверх»', def: 'Сообщение от ядра к upcall handler thread library (scheduler activations).' },
    { en: 'clone()', ru: 'Системный вызов Linux', def: 'Создаёт task; флаги (CLONE_VM, CLONE_FILES…) задают, что разделяется с parent.' }
  ],
  questions: [
    { id: 'thr-01', type: 'single', q: 'Согласно слайду Motivation, process creation и thread creation соответственно:', options: ['heavy-weight и light-weight', 'light-weight и heavy-weight', 'обе heavy-weight', 'обе light-weight'], answer: 0, explain: 'Создание процесса тяжёлое (копия адресного пространства), потока — лёгкое (память общая).', section: 'motivation', diff: 1 },
    { id: 'thr-02', type: 'single', q: 'Multithreaded server получил запрос и создал поток для его обслуживания. Что делает сервер дальше?', options: ['Ждёт завершения потока', 'Продолжает слушать новые запросы клиентов', 'Завершается', 'Передаёт запрос другому серверу'], answer: 1, explain: 'Шаг (3) схемы — resume listening for additional client requests; запрос обслуживает созданный поток.', section: 'motivation', diff: 1 },
    { id: 'thr-03', type: 'multi', q: 'Что разделяют потоки одного процесса? (несколько ответов)', options: ['Code', 'Data (heap, global variables)', 'File descriptors', 'Stack', 'Program counter'], answer: [0, 1, 2], explain: 'Stack, PC и CPU registers у каждого потока свои.', section: 'definition', diff: 1 },
    { id: 'thr-04', type: 'single', q: 'Что у каждого потока своё (private)?', options: ['Heap', 'Глобальные переменные', 'Stack', 'Open files'], answer: 2, explain: 'Private: PC, stack, CPU registers. Heap, глобальные и файлы — общие.', section: 'definition', diff: 1 },
    { id: 'thr-05', type: 'tf', q: 'Поскольку потоки разделяют address space, им нужны механизмы синхронизации (mutexes, semaphores, monitors), чтобы избежать race conditions.', answer: true, explain: 'Со слайда Memory Management of Thread: общая память — плюс для коммуникации и вызов для синхронизации.', section: 'definition', diff: 1 },
    { id: 'thr-06', type: 'multi', q: 'Benefits многопоточности по слайдам: (несколько ответов)', options: ['Responsiveness', 'Resource Sharing', 'Economy', 'Scalability', 'Fault isolation'], answer: [0, 1, 2, 3], explain: 'Четыре benefits. Изоляции сбоев у потоков как раз нет — crash потока затрагивает весь процесс.', section: 'benefits', diff: 1 },
    { id: 'thr-07', type: 'single', q: 'Какой benefit означает, что процесс может использовать multicore архитектуру?', options: ['Responsiveness', 'Economy', 'Scalability', 'Resource Sharing'], answer: 2, explain: 'Scalability — использование нескольких ядер. Economy — дешевизна создания/переключения.', section: 'benefits', diff: 1 },
    { id: 'thr-08', type: 'single', q: 'Fault tolerance: что происходит при crash одного потока?', options: ['Не затрагивает другие потоки', 'Может затронуть другие потоки того же процесса', 'Затрагивает все процессы системы', 'Поток автоматически перезапускается'], answer: 1, explain: 'Потоки делят memory space, поэтому проблема одного может повлиять на остальные потоки процесса. У процессов crash не затрагивает другие.', section: 'vs-process', diff: 1 },
    { id: 'thr-09', type: 'tf', q: 'При переключении между потоками одного процесса не нужно менять memory maps — переключаются только PC и registers (и stack).', answer: true, explain: 'Потоки разделяют память, поэтому context switch между ними легче, чем между процессами.', section: 'vs-process', diff: 2 },
    { id: 'thr-10', type: 'single', q: 'Lifetime в таблице Processes vs Threads: время жизни потока…', options: ['независимо от процесса', 'зависит от времени жизни parent process', 'всегда больше времени жизни процесса', 'ограничено одним квантом'], answer: 1, explain: 'Процесс имеет независимое время жизни, поток зависит от процесса-родителя.', section: 'vs-process', diff: 2 },
    { id: 'thr-11', type: 'multi', q: 'Challenges multicore programming по слайду: (несколько ответов)', options: ['Dividing activities', 'Balance', 'Data splitting', 'Data dependency', 'Testing and debugging', 'Increasing clock frequency'], answer: [0, 1, 2, 3, 4], explain: 'Пять challenges; частота процессора — не задача программиста.', section: 'multicore', diff: 1 },
    { id: 'thr-12', type: 'single', q: 'Что возможно на single-core системе?', options: ['Parallelism, но не concurrency', 'Concurrency, но не parallelism', 'И concurrency, и parallelism', 'Ни то, ни другое'], answer: 1, explain: 'На одном ядре scheduler чередует задачи — concurrency. Одновременное выполнение (parallelism) требует нескольких ядер.', section: 'multicore', diff: 1 },
    { id: 'thr-13', type: 'single', q: 'Массив делится на 4 части, каждое ядро суммирует свою часть. Это…', options: ['Task parallelism', 'Data parallelism', 'Concurrency без параллелизма', 'Many-to-one'], answer: 1, explain: 'Подмножества одних данных, одна и та же операция на каждом ядре — data parallelism.', section: 'multicore', diff: 2 },
    { id: 'thr-14', type: 'single', q: 'Приложение 75% parallel / 25% serial. Speedup при переходе с 1 на 2 ядра по Amdahl’s Law:', options: ['2.0', '1.6', '1.33', '4.0'], answer: 1, explain: '1 / (0.25 + 0.75/2) = 1 / 0.625 = 1.6.', section: 'amdahl', diff: 1 },
    { id: 'thr-15', type: 'single', q: 'S = 0.25. Каков предел speedup при N → ∞?', options: ['2', '4', '25', 'Бесконечность'], answer: 1, explain: 'При N → ∞ speedup → 1/S = 1/0.25 = 4.', section: 'amdahl', diff: 2 },
    { id: 'thr-16', type: 'single', q: 'S = 0.10, N = 16. Speedup по Amdahl’s Law ≈', options: ['6.4', '9.1', '10', '16'], answer: 0, explain: '1 / (0.1 + 0.9/16) = 1 / (0.1 + 0.05625) = 1 / 0.15625 = 6.4.', section: 'amdahl', diff: 3 },
    { id: 'thr-17', type: 'single', q: 'Половина программы последовательная (S = 0.5). Максимально возможный speedup при любом числе ядер:', options: ['1.5', '2', '4', 'не ограничен'], answer: 1, explain: '1/S = 2 — serial portion оказывает непропорционально большое влияние.', section: 'amdahl', diff: 2 },
    { id: 'thr-18', type: 'single', q: 'Сервер на 2 CPU по 4 ядра, каждый запрос — отдельный поток. Сколько запросов может обрабатываться действительно одновременно?', options: ['2', '4', '6', '8'], answer: 3, explain: 'M CPU × N cores = 2 × 4 = 8.', section: 'hierarchy', diff: 1 },
    { id: 'thr-19', type: 'tf', q: 'На single-core системе многопоточная программа выполняет потоки по-настоящему параллельно.', answer: false, explain: 'Без нескольких ядер потоки только чередуются (interleaved) на одном ядре.', section: 'hierarchy', diff: 1 },
    { id: 'thr-20', type: 'single', q: 'В сравнительной таблице Intel Hyper-Threading и Java threads относятся к…', options: ['Multithread (logical / software-level)', 'Multi-core (physical / hardware-level)', 'Multi-processor', 'Distributed systems'], answer: 0, explain: 'Строка Multithread: parallelism type logical/software-level, примеры — Hyper-Threading, Java threads.', section: 'hierarchy', diff: 2 },
    { id: 'thr-21', type: 'single', q: 'User-level threads (ULT): как их видит ядро?', options: ['Как отдельные kernel threads', 'Не знает о них и управляет процессом как single-threaded', 'Как отдельные процессы', 'Как LWP'], answer: 1, explain: 'ULT управляются целиком библиотекой; ядро о них не знает.', section: 'user-kernel', diff: 1 },
    { id: 'thr-22', type: 'single', q: 'Главный минус kernel-level threads по слайду Recap:', options: ['Ядро не знает о потоках', 'Overhead участия ядра влияет на производительность', 'Нет параллелизма', 'Блокировка одного блокирует все'], answer: 1, explain: 'KLT лучше поддерживают параллелизм, но участие ядра даёт overhead. Остальные варианты — про ULT / many-to-one.', section: 'user-kernel', diff: 2 },
    { id: 'thr-23', type: 'single', q: 'В модели Many-to-One один поток выполнил блокирующий system call. Что произойдёт?', options: ['Блокируется только он', 'Блокируются все потоки процесса', 'Ядро создаёт новый kernel thread', 'Поток переводится на другое ядро'], answer: 1, explain: 'Все user threads отображены на один kernel thread — его блокировка блокирует всех.', section: 'models', diff: 1 },
    { id: 'thr-24', type: 'single', q: 'Какая модель используется в Windows и Linux?', options: ['Many-to-One', 'One-to-One', 'Many-to-Many', 'Two-level'], answer: 1, explain: 'Слайд One-to-One: Examples — Windows, Linux.', section: 'models', diff: 1 },
    { id: 'thr-25', type: 'single', q: 'Чем Two-level model отличается от Many-to-Many?', options: ['Не позволяет создавать kernel threads', 'Позволяет привязать (bound) user thread к kernel thread', 'Отображает все user threads на один kernel thread', 'Работает только в user space'], answer: 1, explain: 'Two-level — M:M + возможность bound thread.', section: 'models', diff: 2 },
    { id: 'thr-26', type: 'tf', q: 'В модели Many-to-One потоки одного процесса могут выполняться параллельно на нескольких ядрах.', answer: false, explain: 'В ядре одновременно может быть только один поток процесса, поэтому параллелизма нет.', section: 'models', diff: 2 },
    { id: 'thr-27', type: 'single', q: 'Какие примеры приведены для Many-to-One?', options: ['Windows, Linux', 'Solaris Green Threads, GNU Portable Threads', 'Windows ThreadFiber', 'iOS, Android'], answer: 1, explain: 'M:1 — Solaris Green Threads и GNU Portable Threads; 1:1 — Windows, Linux; M:M — ThreadFiber.', section: 'models', diff: 2 },
    { id: 'thr-28', type: 'single', q: 'Pthreads — это…', options: ['конкретная реализация потоков в ядре Linux', 'POSIX спецификация (IEEE 1003.1c) API, а не реализация', 'библиотека только для Windows', 'модель Many-to-Many'], answer: 1, explain: 'API задаёт поведение, реализация — на усмотрение разработчиков; может быть user- или kernel-level.', section: 'libraries', diff: 1 },
    { id: 'thr-29', type: 'single', q: 'Что возвращает pthread_create() при успехе?', options: ['TID нового потока', '0', '1', 'Указатель на start_routine'], answer: 1, explain: 'При успехе — 0, при ошибке — номер ошибки. TID записывается в *thread.', section: 'libraries', diff: 1 },
    { id: 'thr-30', type: 'single', q: 'Зачем в конце main примера PrintHello вызывается pthread_exit(NULL), а не return 0?', options: ['Чтобы освободить память потоков', 'Чтобы завершился только главный поток, а процесс продолжил работать, пока не закончатся остальные потоки', 'Чтобы отменить все потоки', 'Это обязательно для компиляции'], answer: 1, explain: 'return из main вызывает exit() и завершает процесс со всеми потоками; pthread_exit завершает только main thread.', section: 'pthreads', diff: 3 },
    { id: 'thr-31', type: 'code', q: 'Что не так в этом коде (слайд «Does it work?»)?', lang: 'c', code: String.raw`void *PrintHello(void *threadid) {
    int *id_ptr, taskid;
    sleep(3);
    id_ptr = (int *) threadid;
    taskid = *id_ptr;
    printf("Thread %d: %s\n", taskid, messages[taskid]);
    pthread_exit(NULL);
}
...
for (t = 0; t < NUM_THREADS; t++) {
    printf("Creating thread %d\n", t);
    rc = pthread_create(&threads[t], NULL, PrintHello, (void *) &t);
}`, options: ['Все потоки получают адрес одной переменной t; когда они её читают, t уже изменилась (скорее всего 8)', 'pthread_create нельзя передавать указатель на int', 'Потоки не видят глобальный массив messages', 'sleep(3) блокирует весь процесс на 3 s'], answer: 0, explain: 'Передаётся &t, а не значение; через 3 s цикл закончен, все читают одно значение t (8) → messages[8] вне массива.', section: 'args', diff: 2 },
    { id: 'thr-32', type: 'multi', q: 'Какие способы передать потоку номер t корректны? (несколько ответов)', options: ['param[t] = t; pthread_create(..., (void *) &param[t]);', 'p = malloc(sizeof(int)); *p = t; pthread_create(..., (void *) p);', 'pthread_create(..., (void *)(size_t) t); и в потоке (int) threadid', 'pthread_create(..., (void *) &t);'], answer: [0, 1, 2], explain: 'Первые два — отдельная память на каждый поток (слайды It works! и inputids), третий — передача значения как в PrintHello. &t — общий адрес, ошибка.', section: 'args', diff: 3 },
    { id: 'thr-33', type: 'single', q: 'Как передать потоку несколько аргументов?', options: ['Вызвать pthread_create несколько раз', 'Создать структуру со всеми аргументами и передать указатель на неё', 'Через глобальные переменные — других способов нет', 'Передать массив через attr'], answer: 1, explain: 'pthread_create передаёт один аргумент; несколько — упаковать в struct и передать указатель (void *).', section: 'args', diff: 1 },
    { id: 'thr-34', type: 'single', q: 'Общий алгоритм fork-join: что делает Task(problem), если задача достаточно мала?', options: ['fork двух подзадач', 'Решает задачу напрямую', 'Вызывает join', 'Завершается с ошибкой'], answer: 1, explain: 'If problem is small enough → solve directly; иначе fork подзадач и join их результатов.', section: 'fork-join', diff: 1 },
    { id: 'thr-35', type: 'code', q: 'Что выведет программа (Join Example)?', lang: 'c', code: String.raw`pthread_t thr1, thr2;
char *message1 = "Hello";
char *message2 = "World";
int thpoint1, thpoint2;
thpoint1 = pthread_create(&thr1, NULL, print_message_function, (void*) message1);
thpoint2 = pthread_create(&thr2, NULL, print_message_function, (void*) message2);
pthread_join(thr1, NULL);
pthread_join(thr2, NULL);
printf("thr1 returns: %d\n", thpoint1);
printf("thr2 returns: %d\n", thpoint2);
/* print_message_function печатает строку ptr и делает pthread_exit(NULL) */`, options: ['Hello и World в любом порядке, затем thr1 returns: 0 и thr2 returns: 0', 'Всегда Hello, World, затем thr1 returns: 1 и thr2 returns: 2', 'thr1 returns: 0 может напечататься раньше Hello', 'Hello и World, затем thr1 returns: <TID потока>'], answer: 0, explain: 'main печатает после двух pthread_join. thpoint — код возврата pthread_create (0 = успех), не TID и не результат потока. Порядок Hello/World не определён.', section: 'join', diff: 3 },
    { id: 'thr-36', type: 'single', q: 'Поток создан как detached. Что верно?', options: ['Его можно join позже', 'Его никогда нельзя join', 'pthread_attach() вернёт его в joinable', 'Он завершается сразу после создания'], answer: 1, explain: 'Detached поток нельзя join. pthread_detach() превращает joinable в detached, обратной функции нет.', section: 'join', diff: 2 },
    { id: 'thr-37', type: 'code', q: 'Check concurrency: 5 потоков создаются в цикле, каждый делает sleep(5), затем main делает pthread_join для всех. Сколько примерно работает программа?', lang: 'c', code: String.raw`for (i = 0; i < NUM_THREADS; i++) {      /* NUM_THREADS = 5 */
    printf("IN MAIN: Creating thread %d.\n", i + 1);
    result_code = pthread_create(&threads[i], NULL, perform_work, &i);
}
printf("IN MAIN: All threads are created.\n");
for (i = 0; i < NUM_THREADS; i++) {
    result_code = pthread_join(threads[i], NULL);
    printf("IN MAIN: Thread %d has ended.\n", i + 1);
}
/* perform_work: печать, sleep(5), печать */`, options: ['≈ 5 s', '≈ 25 s', '≈ 1 s', '≈ 10 s'], answer: 0, explain: 'Потоки создаются без ожидания и спят одновременно; join ждёт их, но суммарно ≈ 5 s, а не 5 × 5.', section: 'join', diff: 2 },
    { id: 'thr-38', type: 'single', q: 'В той же программе в каком порядке печатаются строки «IN MAIN: Thread i has ended.»?', options: ['Всегда 1, 2, 3, 4, 5', 'В порядке фактического завершения потоков', 'В случайном порядке', 'В обратном порядке 5…1'], answer: 0, explain: 'main вызывает pthread_join по порядку: пока не завершился поток 1, строку про поток 2 он не напечатает, даже если тот уже закончил.', section: 'join', diff: 3 },
    { id: 'thr-39', type: 'single', q: 'Что делает exec(), вызванный одним потоком многопоточного процесса?', options: ['Заменяет только вызвавший поток', 'Заменяет весь процесс, включая все потоки', 'Создаёт новый поток с новой программой', 'Дублирует все потоки'], answer: 1, explain: 'exec() работает как обычно — заменяет весь running process со всеми потоками.', section: 'fork-exec', diff: 1 },
    { id: 'thr-40', type: 'tf', q: 'В некоторых UNIX есть две версии fork(): дублирующая все потоки и дублирующая только вызывающий поток.', answer: true, explain: 'Со слайда «Semantics of fork() and exec()».', section: 'fork-exec', diff: 1 },
    { id: 'thr-41', type: 'multi', q: 'Куда можно доставить сигнал в многопоточном процессе (варианты со слайда)? (несколько ответов)', options: ['Потоку, к которому сигнал относится', 'Каждому потоку процесса', 'Определённым потокам процесса', 'Специальному потоку, получающему все сигналы процесса', 'Только ядру, процесс сигнал не получает'], answer: [0, 1, 2, 3], explain: 'Четыре варианта со слайда Signal Handling (Cont.).', section: 'signals', diff: 2 },
    { id: 'thr-42', type: 'single', q: 'Кто выполняет default signal handler?', options: ['Ядро (kernel)', 'Thread library', 'Parent process', 'Пользовательская функция'], answer: 0, explain: 'Every signal has default handler that kernel runs; user-defined handler может его переопределить.', section: 'signals', diff: 1 },
    { id: 'thr-43', type: 'single', q: 'Какой тип thread cancellation используется по умолчанию в Pthreads?', options: ['Asynchronous', 'Deferred', 'Immediate', 'Cascading'], answer: 1, explain: 'Default type is deferred: отмена только в cancellation point.', section: 'cancellation', diff: 1 },
    { id: 'thr-44', type: 'code', q: 'Поток worker отменяется deferred-способом. Когда он фактически завершится?', lang: 'c', code: String.raw`pthread_t tid;
pthread_create(&tid, 0, worker, NULL);
. . .
pthread_cancel(tid);      /* запрос отмены */
pthread_join(tid, NULL);  /* ждём завершения */`, options: ['Сразу при вызове pthread_cancel', 'Когда достигнет cancellation point (например, pthread_testcancel()), после чего вызовется cleanup handler', 'Никогда — deferred потоки нельзя отменить', 'Только после pthread_join'], answer: 1, explain: 'pthread_cancel лишь запрашивает отмену; при deferred она происходит в cancellation point. Немедленно — это asynchronous.', section: 'cancellation', diff: 2 },
    { id: 'thr-45', type: 'single', q: 'У target thread cancellation disabled. Что происходит с запросом pthread_cancel?', options: ['Поток всё равно немедленно завершается', 'Запрос остаётся pending, пока поток не включит cancellation', 'Запрос отбрасывается навсегда', 'Завершается весь процесс'], answer: 1, explain: 'If thread has cancellation disabled, cancellation remains pending until thread enables it.', section: 'cancellation', diff: 3 },
    { id: 'thr-46', type: 'single', q: 'Чем TLS отличается от локальных переменных?', options: ['TLS видна только внутри одного вызова функции', 'TLS видна между вызовами функций и уникальна для каждого потока', 'TLS общая для всех потоков', 'TLS хранится в stack вызова'], answer: 1, explain: 'Local variables видны в одном вызове; TLS — между вызовами, похожа на static, но своя у каждого потока.', section: 'tls', diff: 2 },
    { id: 'thr-47', type: 'single', q: 'Upcall в scheduler activations — это…', options: ['вызов thread library к ядру для создания потока', 'коммуникация от ядра к upcall handler в thread library', 'системный вызов fork', 'сигнал от parent к child'], answer: 1, explain: 'Upcalls идут от kernel к upcall handler библиотеки и позволяют поддерживать нужное число kernel threads.', section: 'sched-act', diff: 2 },
    { id: 'thr-48', type: 'single', q: 'LWP для thread library выглядит как…', options: ['отдельный процесс', 'virtual processor, на котором можно запускать user thread', 'физическое ядро CPU', 'signal handler'], answer: 1, explain: 'LWP — промежуточная структура: virtual processor, привязанный к kernel thread.', section: 'sched-act', diff: 2 },
    { id: 'thr-49', type: 'single', q: 'Каким системным вызовом в Linux создаются потоки (tasks)?', options: ['fork()', 'clone()', 'pthread_spawn()', 'exec()'], answer: 1, explain: 'clone() с флагами разделения позволяет child task разделять address space parent.', section: 'linux', diff: 1 },
    { id: 'thr-50', type: 'single', q: 'Какой флаг clone() означает «The same memory space is shared»?', options: ['CLONE_FS', 'CLONE_VM', 'CLONE_SIGHAND', 'CLONE_FILES'], answer: 1, explain: 'CLONE_VM — общая память; CLONE_FS — file-system info, CLONE_SIGHAND — signal handlers, CLONE_FILES — open files.', section: 'linux', diff: 2 },
    { id: 'thr-51', type: 'single', q: 'Какой метод переопределяют и в class MyThread extends Thread, и в class MyRunnable implements Runnable?', options: ['start()', 'run()', 'join()', 'main()'], answer: 1, explain: 'Код потока пишется в run(); start() запускает поток, join() ждёт его.', section: 'java', diff: 1 }
  ]
});
