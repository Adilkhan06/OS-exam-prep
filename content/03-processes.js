OS.addModule({
  id: 'processes',
  num: 3,
  group: 'theory',
  title: 'Processes',
  titleRu: 'Процессы',
  icon: '⚙',
  sources: ['3-Processes.pdf', '4bis - Recap.pdf'],
  summary: 'Process vs program, память процесса, состояния, PCB/task_struct, очереди и планировщики, context switch, fork/exec/wait, завершение (zombie/orphan), IPC: shared memory, producer–consumer, race condition, message passing, POSIX shm, Mach, ALPC, pipes, sockets.',
  sections: [
    {
      id: 'concept',
      h: 'Process Concept — процесс и программа',
      html: `
<ul>
  <li><b>Process</b> — <b>program in execution</b>. Выполнение процесса идёт <b>последовательно</b>: инструкции одного процесса не выполняются параллельно.</li>
  <li><b>Program</b> — <b>пассивная</b> сущность на диске (<b>executable file</b>); <b>process</b> — <b>активная</b>.</li>
  <li>Program становится process, когда executable file <b>загружается в память</b>. Запуск — через GUI (mouse clicks), ввод имени в command line и т.д.</li>
  <li><b>Одна программа может быть несколькими процессами</b> — например, несколько пользователей запускают одну и ту же программу.</li>
</ul>
<table class="t">
  <tr><th></th><th>Program</th><th>Process</th></tr>
  <tr><td>Сущность</td><td>пассивная</td><td>активная</td></tr>
  <tr><td>Где</td><td>executable file на диске</td><td>загружен в память, выполняется на CPU</td></tr>
  <tr><td>Состояние выполнения</td><td>нет</td><td>program counter, registers, state (в PCB)</td></tr>
</table>
<p><b>Recap</b>: process — <b>instance of a program in execution</b>. Компоненты процесса:</p>
<ul>
  <li><b>Program code</b> (<b>text section</b>);</li>
  <li><b>Data</b> — variables, heap, stack;</li>
  <li><b>Process Control Block (PCB)</b> — метаданные: state, program counter, registers, scheduling info и т.д.</li>
</ul>
<div class="cols">
  <div class="callout key"><b>Isolation</b>: у каждого процесса своё <b>address space</b> → memory isolation обеспечивает безопасность.</div>
  <div class="callout warn"><b>Overhead</b>: context switching между процессами относительно <b>дорогой</b> — из-за раздельных memory spaces.</div>
</div>`,
      exam: 'Program — passive, process — active; из чего состоит процесс (text, data, heap, stack, PCB).'
    },
    {
      id: 'memory',
      h: 'Process in Memory, C memory layout, address space',
      html: `
<p><b>Process in Memory</b>:</p>
<table class="t">
  <tr><th>Часть</th><th>Что содержит</th></tr>
  <tr><td><b>Text section</b></td><td>код программы (program code)</td></tr>
  <tr><td><b>Current activity</b></td><td><b>program counter</b>, processor registers</td></tr>
  <tr><td><b>Data section</b></td><td>глобальные переменные</td></tr>
  <tr><td><b>Stack</b></td><td>временные данные: параметры функций, return addresses, локальные переменные</td></tr>
  <tr><td><b>Heap</b></td><td>память, динамически выделяемая во время выполнения (run time)</td></tr>
</table>
<div data-viz="0"></div>
<p><b>Memory Layout of a C Program</b> (low → high memory): text → initialized data → uninitialized data → heap ↑ … ↓ stack → argc, argv.</p>
<pre class="code" data-lang="c">#include &lt;stdio.h&gt;
#include &lt;stdlib.h&gt;

int x;            /* uninitialized data */
int y = 15;       /* initialized data   */

int main(int argc, char *argv[])   /* argc, argv — выше stack */
{
    int *values;  /* stack */
    int i;        /* stack */

    values = (int *)malloc(sizeof(int)*5);   /* 5 int — в heap */

    for (i = 0; i &lt; 5; i++)
        values[i] = i;

    return 0;
}</pre>
<div data-viz="1"></div>
<div class="callout warn">Сама переменная-указатель <code>values</code> лежит в <b>stack</b>, а память, на которую она указывает (результат <code>malloc</code>), — в <b>heap</b>.</div>
<p><b>Address space</b> — диапазон адресов памяти, который ОС назначает процессу. На слайде процесс занимает адреса от <b>base = 300040</b> до <b>base + limit = 420940</b>; ОС — 880000…1024000.</p>
<div class="formula">limit = 420940 − 300040 = 120900; &nbsp; допустимый адрес a: base ≤ a &lt; base + limit</div>
<p><b>Memory Management of Processes</b> (Recap). У каждого процесса:</p>
<ul>
  <li><b>Private virtual address space</b> (code, stack, heap);</li>
  <li><b>Page tables</b>, которыми управляют ОС и аппаратура (<b>MMU</b>).</li>
</ul>
<ul>
  <li>Обмен данными между процессами требует <b>Inter-Process Communication (IPC)</b>: pipes, shared memory, message queues.</li>
  <li><b>Memory protection</b> не даёт одному процессу испортить данные другого.</li>
</ul>
<div data-viz="2"></div>`,
      viz: [
        { name: 'layers', caption: 'Process in memory: stack и heap растут навстречу друг другу', props: { top: 'max', bottom: '0', layers: [
          { label: 'stack', sub: 'параметры функций, return addresses, локальные переменные · растёт вниз ↓', tone: 'c1' },
          { label: '(свободно)', sub: 'stack ↓ и heap ↑ растут навстречу', tone: 'muted' },
          { label: 'heap', sub: 'динамическая память (malloc) · растёт вверх ↑', tone: 'c2' },
          { label: 'data', sub: 'глобальные переменные', tone: 'c3' },
          { label: 'text', sub: 'код программы', tone: 'c4' }] } },
        { name: 'layers', caption: 'Memory layout of a C program (пример со слайда)', props: { top: 'high memory', bottom: 'low memory', layers: [
          { label: 'argc, argv', sub: 'аргументы командной строки', tone: 'c5' },
          { label: 'stack', sub: 'values (указатель), i', tone: 'c1' },
          { label: '(свободно)', sub: '↓ ↑', tone: 'muted' },
          { label: 'heap', sub: 'malloc(sizeof(int)*5)', tone: 'c2' },
          { label: 'uninitialized data', sub: 'int x;', tone: 'c3' },
          { label: 'initialized data', sub: 'int y = 15;', tone: 'c3' },
          { label: 'text', sub: 'код main()', tone: 'c4' }] } },
        { name: 'layers', caption: 'Recap: процессы работают в user space, ядро управляет ими и памятью', props: { layers: [
          { label: 'User space', sub: 'Applications · Libraries · Daemons', tone: 'ok' },
          { label: 'Linux kernel', sub: 'Process Scheduling · Memory Management · Device I/O', tone: 'bad' },
          { label: 'Hardware', sub: 'CPU · RAM · Device', tone: 'acc' }] } }
      ],
      exam: 'Где лежат глобальные (data / bss), локальные (stack), malloc (heap), код (text); stack и heap растут навстречу.'
    },
    {
      id: 'states',
      h: 'Process State — состояния процесса',
      html: `
<p>Во время выполнения процесс меняет <b>state</b>:</p>
<table class="t">
  <tr><th>State</th><th>Значение</th></tr>
  <tr><td><b>New</b></td><td>процесс создаётся</td></tr>
  <tr><td><b>Running</b></td><td>инструкции выполняются</td></tr>
  <tr><td><b>Waiting</b></td><td>процесс ждёт какого-то события (I/O, сигнал…)</td></tr>
  <tr><td><b>Ready</b></td><td>процесс ждёт, когда его назначат на процессор</td></tr>
  <tr><td><b>Terminated</b></td><td>выполнение завершено</td></tr>
</table>
<table class="t">
  <tr><th>Переход</th><th>Событие (подпись на диаграмме)</th></tr>
  <tr><td>new → ready</td><td><b>admitted</b></td></tr>
  <tr><td>ready → running</td><td><b>scheduler dispatch</b></td></tr>
  <tr><td>running → ready</td><td><b>interrupt</b></td></tr>
  <tr><td>running → waiting</td><td><b>I/O or event wait</b></td></tr>
  <tr><td>waiting → ready</td><td><b>I/O or event completion</b></td></tr>
  <tr><td>running → terminated</td><td><b>exit</b></td></tr>
</table>
<div class="callout warn">Из <b>waiting</b> нельзя сразу в <b>running</b> — только через <b>ready</b> (CPU выдаёт scheduler). На одном ядре в каждый момент <b>running</b> только один процесс; ready и waiting может быть сколько угодно.</div>`,
      viz: [{ name: 'procStates', caption: 'Диаграмма состояний процесса: нажимай события', props: {} }],
      exam: 'Назвать 5 состояний и подписи переходов; невозможные переходы (waiting → running, ready → waiting).'
    },
    {
      id: 'pcb',
      h: 'Process Control Block (PCB), task_struct, block diagram',
      html: String.raw`
<p><b>Process Control Block (PCB)</b> (он же <b>task control block</b>) — структура данных ОС, в которой хранится вся информация, нужная для управления конкретным процессом:</p>
<table class="t">
  <tr><th>Поле</th><th>Содержимое</th></tr>
  <tr><td><b>Process state</b></td><td>running, waiting, …</td></tr>
  <tr><td><b>Program counter</b></td><td>адрес следующей инструкции</td></tr>
  <tr><td><b>CPU registers</b></td><td>содержимое всех регистров процесса</td></tr>
  <tr><td><b>CPU scheduling information</b></td><td>priorities, указатели на scheduling queues</td></tr>
  <tr><td><b>Memory-management information</b></td><td>память, выделенная процессу</td></tr>
  <tr><td><b>Accounting information</b></td><td>использованное CPU-время, clock time с момента старта, time limits</td></tr>
  <tr><td><b>I/O status information</b></td><td>выделенные процессу I/O devices, list of open files</td></tr>
</table>
<div data-viz="0"></div>
<div class="callout key">PCB хранятся в специально зарезервированной памяти ОС — <b>kernel space</b>. RAM логически делится на <b>kernel space</b> (PCB1, PCB2, …, PCBn) и <b>user space</b>.</div>
<p><b>Process Representation in Linux</b> — C-структура <code>task_struct</code>:</p>
<pre class="code" data-lang="c">pid_t pid;                    /* process identifier */
long state;                   /* state of the process */
unsigned int time_slice;      /* scheduling information */
struct task_struct *parent;   /* this process's parent */
struct list_head children;    /* this process's children */
struct files_struct *files;   /* list of open files */
struct mm_struct *mm;         /* address space of this process */</pre>
<p>Структуры <code>task_struct</code> связаны в список; указатель <b>current</b> указывает на текущий выполняемый процесс.</p>
<p><b>Threads</b> (подробно — в модуле Threads): до сих пор у процесса один <b>thread of execution</b>. Если дать процессу <b>несколько program counters</b>, несколько участков кода выполняются одновременно → несколько <b>threads</b> of control. Тогда PCB должен хранить данные потоков (несколько PC).</p>
<p><b>Block diagram</b> (Recap): CPU выполняет Process A; в процессе — PCB (state, registers, scheduling info) и память (Stack, Heap, Data, Code/text segment); у каждого thread свои <b>Stack</b> и <b>PC</b>.</p>
<div data-viz="1"></div>`,
      viz: [
        { name: 'layers', caption: 'PCB (рисунок со слайда)', props: { layers: [
          { label: 'process state', tone: 'acc' }, { label: 'process number (pid)' }, { label: 'program counter', tone: 'acc' },
          { label: 'registers', tone: 'c2' }, { label: 'memory limits' }, { label: 'list of open files' }, { label: '…', tone: 'muted' }] } },
        { name: 'graph', caption: 'How the OS manages processes and threads', props: { w: 600, h: 240,
          nodes: [
            { id: 'cpu', label: 'CPU', x: 70, y: 120, tone: 'acc' },
            { id: 'p', label: 'Process A', sub: 'PCB + Stack, Heap, Data, Code', x: 280, y: 120, w: 200, h: 60, tone: 'ok' },
            { id: 't1', label: 'Thread 1', sub: 'Stack, PC', x: 510, y: 40, tone: 'warn' },
            { id: 't2', label: 'Thread 2', sub: 'Stack, PC', x: 510, y: 120, tone: 'c5' },
            { id: 't3', label: 'Thread 3', sub: 'Stack, PC', x: 510, y: 200, tone: 'c3' }],
          edges: [{ from: 'cpu', to: 'p' }, { from: 'p', to: 't1' }, { from: 'p', to: 't2' }, { from: 'p', to: 't3' }] } }
      ],
      exam: 'Перечислить поля PCB; PCB лежат в kernel space; в Linux PCB = task_struct.'
    },
    {
      id: 'scheduling',
      h: 'Process Scheduling — ready/wait queues, queueing diagram',
      html: `
<ul>
  <li><b>Process scheduler</b> выбирает среди доступных процессов следующий для выполнения на ядре CPU.</li>
  <li>Цель — <b>maximize CPU use</b>: быстро переключать процессы на ядро.</li>
  <li>Поддерживает <b>scheduling queues</b>:
    <ul>
      <li><b>Ready queue</b> — множество процессов в main memory, готовых и ждущих выполнения;</li>
      <li><b>Wait queues</b> — процессы, ждущие события (например, I/O).</li>
    </ul></li>
  <li>Процессы <b>мигрируют</b> между очередями.</li>
</ul>
<p><b>Ready and Wait Queues</b> — связные списки PCB; у очереди есть <b>queue header</b> с указателями <b>head</b> и <b>tail</b>.</p>
<div data-viz="0"></div>
<div data-viz="1"></div>
<p><b>Representation of Process Scheduling</b> (queueing diagram): процесс из ready queue получает CPU и покидает его, когда:</p>
<ul>
  <li>делает <b>I/O request</b> → I/O wait queue → I/O → обратно в ready queue;</li>
  <li><b>time slice expired</b> → сразу в ready queue;</li>
  <li><b>create child process</b> → child termination wait queue → child terminates → ready queue;</li>
  <li><b>wait for an interrupt</b> → interrupt wait queue → interrupt occurs → ready queue.</li>
</ul>
<div data-viz="2"></div>`,
      viz: [
        { name: 'flow', caption: 'Ready queue: header → PCB7 → PCB2', props: { dir: 'h', steps: [
          { label: 'ready queue', sub: 'head · tail', tone: 'acc' }, { label: 'PCB 7', sub: 'registers …' }, { label: 'PCB 2', sub: 'registers …' }, { label: 'NULL', tone: 'muted' }] } },
        { name: 'flow', caption: 'Wait queue: header → PCB3 → PCB14 → PCB6', props: { dir: 'h', steps: [
          { label: 'wait queue', sub: 'head · tail', tone: 'warn' }, { label: 'PCB 3' }, { label: 'PCB 14' }, { label: 'PCB 6' }, { label: 'NULL', tone: 'muted' }] } },
        { name: 'graph', caption: 'Queueing diagram: все пути возвращают процесс в ready queue', props: { w: 660, h: 380,
          nodes: [
            { id: 'cpu', label: 'CPU', x: 330, y: 40, shape: 'circle', tone: 'ok' },
            { id: 'exit', label: 'exit', x: 560, y: 40, shape: 'pill', tone: 'muted' },
            { id: 'a1', label: 'I/O request', x: 95, y: 120, w: 130 },
            { id: 'a2', label: 'I/O wait queue', x: 95, y: 200, w: 130, tone: 'warn' },
            { id: 'a3', label: 'I/O', x: 95, y: 280, shape: 'circle' },
            { id: 'b1', label: 'time slice\nexpired', x: 235, y: 170, w: 120 },
            { id: 'c1', label: 'create child\nprocess', x: 425, y: 120, w: 130 },
            { id: 'c2', label: 'wait queue', sub: 'child termination', x: 425, y: 200, w: 130, tone: 'warn' },
            { id: 'c3', label: 'child terminates', x: 425, y: 280, w: 130, shape: 'pill' },
            { id: 'd1', label: 'wait for an\ninterrupt', x: 570, y: 120, w: 130 },
            { id: 'd2', label: 'wait queue', sub: 'interrupt', x: 570, y: 200, w: 130, tone: 'warn' },
            { id: 'd3', label: 'interrupt occurs', x: 570, y: 280, w: 130, shape: 'pill' },
            { id: 'rq', label: 'ready queue', x: 330, y: 350, w: 200, tone: 'acc' }],
          edges: [
            { from: 'rq', to: 'cpu' }, { from: 'cpu', to: 'exit' },
            { from: 'cpu', to: 'a1' }, { from: 'a1', to: 'a2' }, { from: 'a2', to: 'a3' }, { from: 'a3', to: 'rq' },
            { from: 'cpu', to: 'b1' }, { from: 'b1', to: 'rq' },
            { from: 'cpu', to: 'c1' }, { from: 'c1', to: 'c2' }, { from: 'c2', to: 'c3' }, { from: 'c3', to: 'rq' },
            { from: 'cpu', to: 'd1' }, { from: 'd1', to: 'd2' }, { from: 'd2', to: 'd3' }, { from: 'd3', to: 'rq' }] } }
      ],
      exam: 'Что такое ready queue и wait queues; четыре причины, по которым процесс покидает CPU на queueing diagram.'
    },
    {
      id: 'schedulers',
      h: 'Schedulers — long-term и short-term',
      html: `
<table class="t">
  <tr><th></th><th><b>Long-term scheduler</b> (job scheduler)</th><th><b>Short-term scheduler</b> (CPU scheduler)</th></tr>
  <tr><td>Что делает</td><td>выбирает, какие процессы из <b>job pool на диске</b> поместить <b>в ready queue</b></td><td>выбирает, какой процесс выполнять следующим, и <b>выделяет ему CPU</b></td></tr>
  <tr><td>Частота вызова</td><td>очень редко (seconds, minutes) → <b>может быть медленным</b></td><td>очень часто (milliseconds) → <b>должен быть быстрым</b></td></tr>
  <tr><td>Контролирует</td><td><b>degree of multiprogramming</b> (сколько процессов в памяти)</td><td>кто сейчас на CPU</td></tr>
</table>
<div data-viz="0"></div>
<ul>
  <li><b>I/O-bound process</b> — больше времени на I/O, чем на вычисления; <b>много коротких CPU bursts</b>.</li>
  <li><b>CPU-bound process</b> — больше времени на вычисления; <b>очень длинные CPU bursts</b>.</li>
</ul>
<div class="callout key">Long-term scheduler должен подобрать хороший <b>process mix</b> из I/O-bound и CPU-bound процессов, чтобы были заняты и ready queue, и I/O wait queues.</div>
<div class="callout note"><b>Medium-term scheduler</b> (Silberschatz, есть в шпаргалке) — <b>swapping</b>: временно выгружает процесс из памяти на диск и позже возвращает его, снижая degree of multiprogramming.</div>`,
      viz: [{ name: 'flow', caption: 'Где работает каждый планировщик', props: { dir: 'h', steps: [
        { label: 'Job pool', sub: 'hard disk', tone: 'muted' },
        { label: 'Long-term', sub: 'job scheduler · редко', tone: 'warn' },
        { label: 'Ready queue', sub: 'RAM', tone: 'acc' },
        { label: 'Short-term', sub: 'CPU scheduler · часто', tone: 'warn' },
        { label: 'CPU', tone: 'ok' }] } }],
      exam: 'Long-term vs short-term: кто что выбирает, частота, кто управляет degree of multiprogramming; I/O-bound vs CPU-bound.'
    },
    {
      id: 'context-switch',
      h: 'Context Switch',
      html: `
<ul>
  <li><b>Context switch</b> — CPU переключается с одного процесса на другой: система <b>сохраняет state</b> старого процесса и <b>загружает сохранённый state</b> нового.</li>
  <li><b>Context</b> процесса представлен в его <b>PCB</b>.</li>
  <li>Время context switch — <b>pure overhead</b>: во время переключения система не делает полезной работы.</li>
  <li>Чем сложнее ОС и PCB — тем дольше context switch.</li>
  <li>Время зависит от <b>hardware support</b>: некоторые CPU имеют <b>несколько наборов регистров</b> → несколько контекстов загружены одновременно.</li>
</ul>
<p>Схема со слайда: P0 executing → <b>interrupt or system call</b> → ОС: <b>save state into PCB0</b> … <b>reload state from PCB1</b> → P1 executing → interrupt or system call → <b>save state into PCB1</b> … <b>reload state from PCB0</b> → P0 executing. Пока выполняется один процесс, другой <b>idle</b>.</p>`,
      viz: [{ name: 'timeline', caption: 'CPU switch from process to process', props: { max: 13, rows: [
        { label: 'P0', segs: [{ from: 0, to: 3, label: 'executing', tone: 'acc' }, { from: 3, to: 10, label: 'idle', tone: 'muted' }, { from: 10, to: 13, label: 'executing', tone: 'acc' }] },
        { label: 'OS', segs: [{ from: 3, to: 4, label: 'save PCB0', tone: 'warn' }, { from: 4, to: 5, label: 'load PCB1', tone: 'warn' }, { from: 8, to: 9, label: 'save PCB1', tone: 'warn' }, { from: 9, to: 10, label: 'load PCB0', tone: 'warn' }] },
        { label: 'P1', segs: [{ from: 0, to: 5, label: 'idle', tone: 'muted' }, { from: 5, to: 8, label: 'executing', tone: 'ok' }, { from: 8, to: 13, label: 'idle', tone: 'muted' }] }],
        marks: [{ t: 3, label: 'interrupt / syscall' }, { t: 8, label: 'interrupt / syscall' }] } }],
      exam: 'Что сохраняется и куда (state → PCB); почему context switch — overhead; от чего зависит его время.'
    },
    {
      id: 'mobile',
      h: 'Multitasking in Mobile Systems',
      html: `
<ul>
  <li>Некоторые мобильные ОС (например, <b>ранние версии iOS</b>) разрешали выполняться только <b>одному</b> процессу, остальные — suspended.</li>
  <li>Из-за ограничений экрана (<b>screen real estate</b>) и UI iOS предусматривает:
    <ul>
      <li>один <b>foreground</b> process — управляется через user interface;</li>
      <li>несколько <b>background</b> processes — в памяти, выполняются, но не на экране, <b>с ограничениями</b>.</li>
      <li>Ограничения: одна короткая задача, получение уведомлений о событиях, отдельные длительные задачи вроде <b>audio playback</b>.</li>
    </ul></li>
  <li><b>Android</b> выполняет foreground и background процессы с <b>меньшими ограничениями</b>:
    <ul>
      <li>background process выполняет задачи через <b>service</b>;</li>
      <li>service может продолжать работать, <b>даже если background process приостановлен</b>;</li>
      <li>у service <b>нет user interface</b>, он использует мало памяти.</li>
    </ul></li>
</ul>`
    },
    {
      id: 'creation',
      h: 'Process Creation — дерево процессов и варианты создания',
      html: `
<p>ОС должна предоставлять механизмы <b>process creation</b> и <b>process termination</b>.</p>
<ul>
  <li><b>Parent</b> process создаёт <b>children</b>, те в свою очередь создают другие процессы → <b>tree of processes</b>.</li>
  <li>Процесс идентифицируется и управляется через <b>process identifier (pid)</b> — целое число.</li>
</ul>
<div data-viz="0"></div>
<p><b>Process Creation options</b>:</p>
<table class="t">
  <tr><th>Аспект</th><th>Варианты</th></tr>
  <tr><td><b>Resource sharing</b></td><td>parent и children делят <b>все</b> ресурсы · children делят <b>подмножество</b> ресурсов parent · parent и child <b>не делят</b> ресурсы</td></tr>
  <tr><td><b>Execution</b></td><td>parent и children выполняются <b>concurrently</b> · parent <b>ждёт</b>, пока children завершатся</td></tr>
  <tr><td><b>Address space</b></td><td>child — <b>дубликат</b> parent (<code>fork()</code>) · в child загружается <b>новая программа</b> (<code>exec()</code>)</td></tr>
</table>`,
      viz: [{ name: 'tree', caption: 'Дерево процессов Linux (со слайда)', props: { mono: true, root: { label: 'systemd', note: 'pid = 1', tone: 'acc', children: [
        { label: 'logind', note: 'pid = 8415', children: [
          { label: 'bash', note: 'pid = 8416', children: [{ label: 'ps', note: 'pid = 9298' }, { label: 'vim', note: 'pid = 9204' }] }] },
        { label: 'python', note: 'pid = 2808' },
        { label: 'sshd', note: 'pid = 3028', children: [
          { label: 'sshd', note: 'pid = 3610', children: [{ label: 'tcsh', note: 'pid = 4005' }] }] }] } } }],
      exam: 'Варианты resource sharing и execution; корень дерева процессов (systemd/init, pid 1).'
    },
    {
      id: 'fork',
      h: 'fork() — создание процесса в UNIX и примеры',
      html: String.raw`
<ul>
  <li><code>unistd.h</code> — заголовочный файл C/C++, дающий доступ к <b>POSIX operating system API</b>.</li>
  <li><code>fork()</code> — system call, создающий <b>новый процесс</b>. После создания child <b>оба</b> процесса выполняют <b>следующую инструкцию после fork()</b>.</li>
  <li>Child использует те же CPU registers и open files, что и parent (получает их копию).</li>
</ul>
<table class="t">
  <tr><th>fork() вернул</th><th>Смысл</th></tr>
  <tr><td><b>&lt; 0</b></td><td>создать child process не удалось</td></tr>
  <tr><td><b>0</b></td><td>мы в <b>новом child</b> process</td></tr>
  <tr><td><b>&gt; 0</b></td><td>мы в <b>parent</b>; значение = <b>PID созданного child</b></td></tr>
</table>
<p><b>C Program Forking Example</b>:</p>
<pre class="code" data-lang="c">#include &lt;stdio.h&gt;
#include &lt;sys/types.h&gt;
#include &lt;unistd.h&gt;
int main()
{
    // make two process which run same program after this instruction
    pid_t p = fork();
    if (p &lt; 0) {
        perror("fork fail");
        return 1;
    }
    printf("Hello world!, process_id(pid) = %d \n", getpid());
    return 0;
}</pre>
<p>Строка печатается <b>2 раза</b> (parent и child) с разными pid.</p>
<p><b>How many times is hello printed?</b></p>
<pre class="code" data-lang="c">int main()
{
    fork();
    fork();
    fork();
    printf("Hello world!, process_id(pid) = %d \n", getpid());
    return 0;
}</pre>
<div class="formula">Число печатей = числу процессов = 2<sup>n</sup>, n — число вызовов fork() → 2<sup>3</sup> = <b>8</b> (1 исходный + 7 новых)</div>
<div data-viz="0"></div>
<p><b>Forking Example 2</b> — разный код для parent и child по значению fork():</p>
<pre class="code" data-lang="c">pid_t p;
p = fork();
if (p &lt; 0) {
    perror("fork fail");
    return 1;
}
else if (p == 0)                   // child process because return value zero
    printf("Hello from Child!\n");
else                               // parent process because return value non-zero
    printf("Hello from Parent!\n");
return 0;</pre>
<p>Печатаются обе строки; <b>порядок не определён</b> (решает scheduler).</p>
<p><b>What is the output of the following program?</b></p>
<pre class="code" data-lang="c">int x = 1;
pid_t p = fork();
if (p &lt; 0) {
    perror("fork fail");
    return 1;
}
else if (p == 0)
    printf("Child has x = %d\n", ++x);
else
    printf("Parent has x = %d\n", --x);</pre>
<div class="callout key">Parent и child выполняются одновременно → <b>два возможных вывода</b>: «Parent has x = 0 / Child has x = 2» или «Child has x = 2 / Parent has x = 0». Изменение переменной в одном процессе <b>не влияет</b> на другой: у каждого своя копия данных.</div>
<div data-viz="1"></div>
<div class="callout warn">Формула 2<sup>n</sup> — только для <b>n последовательных безусловных</b> fork(). Если fork() внутри if/else или в выражении с &amp;&amp; / ||, считай по дереву: каждый fork() удваивает только те процессы, которые до него дошли.</div>`,
      viz: [
        { name: 'forkTree', caption: 'n последовательных fork() → 2ⁿ процессов', props: { n: 3, max: 5 } },
        { name: 'stepper', caption: 'Трассировка примера с x: у parent и child разные копии x', props: { lang: 'c', code: String.raw`int main()
{
    int x = 1;
    pid_t p = fork();
    if (p < 0) {
        perror("fork fail");
        return 1;
    }
    else if (p == 0)
        printf("Child has x = %d\n", ++x);
    else
        printf("Parent has x = %d\n", --x);
    return 0;
}`, steps: [
          { line: 3, note: 'Пока один процесс (будущий parent), x = 1.', vars: { 'parent: x': 1 } },
          { line: 4, note: 'fork(): теперь два процесса, у каждого СВОЯ копия x = 1. Parent получает PID child, child получает 0.', vars: { 'parent: x': 1, 'parent: p': 'PID child', 'child: x': 1, 'child: p': 0 } },
          { line: [9, 10], note: 'Child: p == 0 → ++x меняет только его копию.', vars: { 'parent: x': 1, 'child: x': 2 }, out: 'Child has x = 2' },
          { line: [11, 12], note: 'Parent: p > 0 → --x меняет только его копию.', vars: { 'parent: x': 0, 'child: x': 2 }, out: 'Parent has x = 0' },
          { line: 13, note: 'Оба процесса завершаются. Порядок двух строк вывода зависит от scheduler — возможен и обратный.', vars: { 'parent: x': 0, 'child: x': 2 } }] } }
      ],
      exam: 'Значения, возвращаемые fork(); «сколько раз напечатает» (2ⁿ); вывод программ с fork() и общей переменной.'
    },
    {
      id: 'exec-wait',
      h: 'exec() и wait()',
      html: String.raw`
<ul>
  <li><code>exec()</code> — system call, вызываемый после <code>fork()</code>, чтобы <b>заменить memory space процесса новой программой</b>.</li>
  <li>Parent вызывает <code>wait()</code>, ожидая завершения child.</li>
</ul>
<p><b>C Program Forking Separate Process</b>:</p>
<pre class="code" data-lang="c">#include &lt;sys/types.h&gt;
#include &lt;stdio.h&gt;
#include &lt;unistd.h&gt;

int main()
{
pid_t pid;
    /* fork a child process */
    pid = fork();

    if (pid &lt; 0) { /* error occurred */
        fprintf(stderr, "Fork Failed");
        return 1;
    }
    else if (pid == 0) { /* child process */
        execlp("/bin/ls", "ls", NULL);
    }
    else { /* parent process */
        /* parent will wait for the child to complete */
        wait(NULL);
        printf("Child Complete");
    }
    return 0;
}</pre>
<div class="callout key">Child заменяет себя программой <code>ls</code>; parent ждёт в <code>wait()</code>. Поэтому сначала выводится список файлов, затем «Child Complete». Код после успешного <code>exec</code> в child <b>никогда не выполняется</b> — программа уже другая.</div>
<div data-viz="0"></div>
<p><b>C Program Wait Example</b> — статус завершения child:</p>
<pre class="code" data-lang="c">#include &lt;stdio.h&gt;
#include &lt;sys/types.h&gt;
#include &lt;unistd.h&gt;
#include &lt;sys/wait.h&gt;
int main()
{
    int status;
    pid_t pid = fork();
    if (pid == 0) {
        printf("I am the child.\n");
        sleep(10);
        printf("I am the child, 10 seconds later.\n");
    }
    if (pid &gt; 0) {
        printf("I am the parent, the child is %d.\n", pid);
        pid = wait(&amp;status);
        printf("End of process %d: ", pid);
        if (WIFEXITED(status)) {
            printf("The process ended with exit(%d).\n", WEXITSTATUS(status));
        }
        if (WIFSIGNALED(status)) {
            printf("The process ended with kill -%d.\n", WTERMSIG(status));
        }
    }
    if (pid &lt; 0) {
        perror("In fork():");
    }
    return 0;
}</pre>
<table class="t">
  <tr><th>Макрос</th><th>Значение</th></tr>
  <tr><td><code>wait(&amp;status)</code></td><td>блокирует parent до завершения child; возвращает <b>pid</b> завершившегося child, статус — в status</td></tr>
  <tr><td><code>WIFEXITED(status)</code> / <code>WEXITSTATUS(status)</code></td><td>child завершился нормально (exit / return из main) / его exit code</td></tr>
  <tr><td><code>WIFSIGNALED(status)</code> / <code>WTERMSIG(status)</code></td><td>child убит сигналом / номер сигнала (например, 9 после <code>kill -9</code>)</td></tr>
</table>`,
      viz: [
        { name: 'graph', caption: 'fork() → exec() в child, wait() в parent', props: { w: 620, h: 220,
          nodes: [
            { id: 'p', label: 'parent', x: 60, y: 110, shape: 'pill', tone: 'acc' },
            { id: 'f', label: 'fork()', x: 180, y: 110, tone: 'warn' },
            { id: 'w', label: 'wait()', x: 380, y: 40, tone: 'acc' },
            { id: 'e', label: 'exec()', x: 320, y: 180, tone: 'ok' },
            { id: 'x', label: 'exit()', x: 450, y: 180, tone: 'ok' },
            { id: 'r', label: 'resumes', x: 560, y: 110, shape: 'pill', tone: 'acc' }],
          edges: [
            { from: 'p', to: 'f' }, { from: 'f', to: 'w', label: 'parent (pid > 0)' }, { from: 'f', to: 'e', label: 'child (pid == 0)' },
            { from: 'e', to: 'x' }, { from: 'x', to: 'r' }, { from: 'w', to: 'r' }] } },
        { name: 'stepper', caption: 'Wait Example: что и когда печатается', props: { lang: 'c', code: String.raw`int main()
{
    int status;
    pid_t pid = fork();
    if (pid == 0) {
        printf("I am the child.\n");
        sleep(10);
        printf("I am the child, 10 seconds later.\n");
    }
    if (pid > 0) {
        printf("I am the parent, the child is %d.\n", pid);
        pid = wait(&status);
        printf("End of process %d: ", pid);
        if (WIFEXITED(status)) {
            printf("The process ended with exit(%d).\n", WEXITSTATUS(status));
        }
        if (WIFSIGNALED(status)) {
            printf("The process ended with kill -%d.\n", WTERMSIG(status));
        }
    }
    if (pid < 0) {
        perror("In fork():");
    }
    return 0;
}`, steps: [
          { line: 4, note: 'fork(): parent получает PID child (пусть 1234), child — 0.', vars: { 'parent: pid': 1234, 'child: pid': 0 } },
          { line: 6, note: 'Child печатает первую строку (порядок с parent не определён).', out: 'I am the child.' },
          { line: 11, note: 'Parent печатает PID child.', out: 'I am the parent, the child is 1234.' },
          { line: [7, 12], note: 'Child спит 10 s; parent заблокирован в wait() (состояние waiting).', vars: { 'parent': 'waiting', 'child': 'sleep(10)' } },
          { line: 8, note: 'Child проснулся, печатает и доходит до return 0 → exit(0) → terminated.', vars: { 'parent': 'waiting', 'child': 'terminated' }, out: 'I am the child, 10 seconds later.' },
          { line: [12, 13, 14, 15], note: 'wait() вернул 1234, WIFEXITED истинно, WEXITSTATUS = 0.', vars: { 'parent': 'running', 'parent: pid': 1234, status: 'exit(0)' }, out: 'End of process 1234: The process ended with exit(0).' },
          { line: [17, 18], note: 'Альтернатива: если бы во время sleep выполнили kill -9 1234, то WIFEXITED ложно, WIFSIGNALED истинно, WTERMSIG = 9, и последней строкой было бы «End of process 1234: The process ended with kill -9.»' }] } }
      ],
      exam: 'Что делает exec() и почему код после него не выполняется; что возвращает wait(); порядок вывода в fork+exec+wait.'
    },
    {
      id: 'windows',
      h: 'Creating a Separate Process via Windows API',
      html: String.raw`
<pre class="code" data-lang="c">#include &lt;stdio.h&gt;
#include &lt;windows.h&gt;

int main(VOID)
{
STARTUPINFO si;
PROCESS_INFORMATION pi;

    /* allocate memory */
    ZeroMemory(&amp;si, sizeof(si));
    si.cb = sizeof(si);
    ZeroMemory(&amp;pi, sizeof(pi));

    /* create child process */
    if (!CreateProcess(NULL, /* use command line */
        "C:\\WINDOWS\\system32\\mspaint.exe", /* command */
        NULL,  /* don't inherit process handle */
        NULL,  /* don't inherit thread handle */
        FALSE, /* disable handle inheritance */
        0,     /* no creation flags */
        NULL,  /* use parent's environment block */
        NULL,  /* use parent's existing directory */
        &amp;si,
        &amp;pi))
    {
        fprintf(stderr, "Create Process Failed");
        return -1;
    }
    /* parent will wait for the child to complete */
    WaitForSingleObject(pi.hProcess, INFINITE);
    printf("Child Complete");

    /* close handles */
    CloseHandle(pi.hProcess);
    CloseHandle(pi.hThread);
}</pre>
<table class="t">
  <tr><th>UNIX</th><th>Windows</th></tr>
  <tr><td><code>fork()</code> + <code>exec()</code></td><td><code>CreateProcess()</code> — сразу создаёт процесс <b>и загружает в него указанную программу</b> (здесь mspaint.exe); 10 параметров</td></tr>
  <tr><td><code>wait()</code></td><td><code>WaitForSingleObject(pi.hProcess, INFINITE)</code></td></tr>
  <tr><td>pid</td><td>handles в <code>PROCESS_INFORMATION</code> (<code>hProcess</code>, <code>hThread</code>), закрываются <code>CloseHandle()</code></td></tr>
</table>`,
      exam: 'CreateProcess ≈ fork + exec; WaitForSingleObject ≈ wait.'
    },
    {
      id: 'termination',
      h: 'Process Termination — exit, abort, cascading, zombie, orphan',
      html: `
<ul>
  <li>Процесс выполняет последнюю инструкцию и просит ОС удалить его system call'ом <code>exit()</code>:
    <ul><li>возвращает <b>status</b> от child к parent (через <code>wait()</code>);</li><li>ресурсы процесса <b>освобождаются ОС</b>.</li></ul></li>
  <li>Parent может завершить child system call'ом <code>abort()</code>. Причины:
    <ul>
      <li>child <b>превысил выделенные ресурсы</b>;</li>
      <li>задача, порученная child, <b>больше не нужна</b>;</li>
      <li>parent завершается, а ОС <b>не позволяет child продолжать</b> без parent.</li>
    </ul></li>
  <li><b>Cascading termination</b>: в некоторых ОС child не может существовать без parent → при завершении процесса завершаются все его children, grandchildren и т.д. Завершение инициирует <b>ОС</b>.</li>
  <li>Parent ждёт завершения child через <code>pid = wait(&amp;status);</code> — возвращает status и <b>pid</b> завершившегося процесса.</li>
</ul>
<table class="t">
  <tr><th></th><th><b>Zombie</b></th><th><b>Orphan</b></th></tr>
  <tr><td>Ситуация</td><td>child завершился, но <b>parent ещё не вызвал wait()</b> (никто не ждёт)</td><td><b>parent завершился, не вызвав wait()</b>, а child ещё работает</td></tr>
  <tr><td>Что происходит</td><td>запись о процессе (pid, exit status) остаётся, пока parent не заберёт статус</td><td>orphan автоматически <b>усыновляется</b> (adopted) системным процессом <b>init</b></td></tr>
</table>
<div class="callout note">На слайде написано «init (pid=0)». В Linux у init/systemd <b>pid = 1</b> (см. дерево процессов); 0 — служебный процесс ядра.</div>`,
      exam: 'Zombie vs orphan; кто усыновляет orphan; причины abort(); cascading termination.'
    },
    {
      id: 'android-chrome',
      h: 'Android importance hierarchy, Chrome multiprocess',
      html: `
<p><b>Android Process Importance Hierarchy</b>: мобильным ОС часто приходится завершать процессы, чтобы освободить ресурсы (память). От самого важного к наименее важному:</p>
<div data-viz="0"></div>
<div class="callout key">Android начинает завершать процессы с <b>наименее важных</b> (empty → background → …).</div>
<p><b>Multiprocess Architecture — Chrome Browser</b>:</p>
<ul>
  <li>Многие браузеры работали (некоторые до сих пор) как <b>один процесс</b> → если один сайт создаёт проблемы, может зависнуть или упасть весь браузер.</li>
  <li><b>Google Chrome</b> — multiprocess, 3 типа процессов:</li>
</ul>
<table class="t">
  <tr><th>Процесс</th><th>Задача</th></tr>
  <tr><td><b>Browser</b></td><td>управляет user interface, disk и network I/O</td></tr>
  <tr><td><b>Renderer</b></td><td>рендерит web pages, обрабатывает HTML, JavaScript. <b>Новый renderer на каждый открытый сайт</b>. Работает в <b>sandbox</b>: ограничен disk и network I/O → минимизирует эффект security exploits</td></tr>
  <tr><td><b>Plug-in</b></td><td>отдельный процесс для каждого типа plug-in</td></tr>
</table>`,
      viz: [{ name: 'layers', caption: 'Android: от самого важного к наименее важному', props: { top: 'most important', bottom: 'least important — завершается первым', layers: [
        { label: 'Foreground process', tone: 'ok' }, { label: 'Visible process', tone: 'acc' }, { label: 'Service process', tone: 'c2' },
        { label: 'Background process', tone: 'warn' }, { label: 'Empty process', tone: 'bad' }] } }],
      exam: 'Порядок 5 уровней Android и кого убивают первым; 3 типа процессов Chrome и зачем renderer в sandbox.'
    },
    {
      id: 'ipc',
      h: 'Interprocess Communication (IPC) — модели',
      html: `
<ul>
  <li>Процессы бывают <b>independent</b> или <b>cooperating</b>. Cooperating process может влиять на другие процессы или подвергаться их влиянию, в т.ч. через общие данные.</li>
  <li>Причины для cooperating processes:
    <ul><li><b>Information sharing</b></li><li><b>Computation speedup</b></li><li><b>Modularity</b></li><li><b>Convenience</b></li></ul></li>
  <li>Cooperating processes нужен <b>interprocess communication (IPC)</b>. Две модели: <b>shared memory</b> и <b>message passing</b>.</li>
</ul>
<div data-viz="0"></div>
<p><b>IPC – Shared Memory</b>:</p>
<ul>
  <li>Область памяти, общая для процессов, которые хотят общаться.</li>
  <li>Коммуникация под контролем <b>пользовательских процессов, а не ОС</b>.</li>
  <li>Главная проблема — механизм <b>синхронизации</b> действий процессов при доступе к shared memory.</li>
</ul>
<table class="t">
  <tr><th></th><th>Shared memory</th><th>Message passing</th></tr>
  <tr><td>Как</td><td>общая область в адресных пространствах процессов</td><td><code>send()</code> / <code>receive()</code> через ядро (message queue)</td></tr>
  <tr><td>Роль ядра</td><td>только при создании области</td><td>участвует в каждой передаче</td></tr>
  <tr><td>Синхронизация</td><td>забота процессов (иначе race condition)</td><td>обеспечивается механизмом сообщений</td></tr>
  <tr><td>Где удобно</td><td>большие объёмы данных, быстро</td><td>без общих переменных; работает и по сети</td></tr>
</table>`,
      viz: [{ name: 'graph', caption: 'Communications Models: (a) shared memory, (b) message passing', props: { w: 640, h: 280,
        nodes: [
          { id: 'aA', label: 'process A', x: 160, y: 40, w: 150, tone: 'acc' },
          { id: 'aS', label: 'shared memory', x: 160, y: 110, w: 150, tone: 'warn' },
          { id: 'aB', label: 'process B', x: 160, y: 180, w: 150, tone: 'acc' },
          { id: 'aK', label: 'kernel', sub: '(a)', x: 160, y: 250, w: 150, tone: 'muted' },
          { id: 'bA', label: 'process A', x: 480, y: 40, w: 150, tone: 'acc' },
          { id: 'bB', label: 'process B', x: 480, y: 110, w: 150, tone: 'acc' },
          { id: 'bQ', label: 'message queue', sub: 'm0 m1 m2 … mn', x: 480, y: 190, w: 150, tone: 'warn' },
          { id: 'bK', label: 'kernel', sub: '(b)', x: 480, y: 255, w: 150, tone: 'muted' }],
        edges: [
          { from: 'aA', to: 'aS', label: 'write/read' }, { from: 'aB', to: 'aS', label: 'write/read' },
          { from: 'bA', to: 'bQ', label: 'send', bend: 100 }, { from: 'bQ', to: 'bB', label: 'receive' }] } }],
      exam: 'Независимые vs кооперирующиеся процессы; 4 причины кооперации; две модели IPC и кто управляет коммуникацией в shared memory.'
    },
    {
      id: 'producer-consumer',
      h: 'Producer–Consumer: bounded buffer в shared memory',
      html: `
<p><b>Producer–Consumer Problem</b> — парадигма cooperating processes: <b>producer</b> производит информацию, которую потребляет <b>consumer</b>.</p>
<table class="t">
  <tr><th>Вариант</th><th>Producer</th><th>Consumer</th></tr>
  <tr><td><b>Unbounded buffer</b> (размер не ограничен)</td><td>никогда не ждёт</td><td>ждёт, если буфер пуст</td></tr>
  <tr><td><b>Bounded buffer</b> (фиксированный размер)</td><td>ждёт, если все буферы заполнены</td><td>ждёт, если буфер пуст</td></tr>
</table>
<p><b>Shared data</b> (циклический буфер):</p>
<pre class="code" data-lang="c">#define BUFFER_SIZE 10
typedef struct {
    . . .
} item;

item buffer[BUFFER_SIZE];
int in = 0;    /* следующая свободная позиция */
int out = 0;   /* первая заполненная позиция */</pre>
<div class="cols">
<div><b>Producer</b>
<pre class="code" data-lang="c">item next_produced;
while (true) {
    /* produce an item in next_produced */
    while (((in + 1) % BUFFER_SIZE) == out)
        ; /* do nothing */
    buffer[in] = next_produced;
    in = (in + 1) % BUFFER_SIZE;
}</pre></div>
<div><b>Consumer</b>
<pre class="code" data-lang="c">item next_consumed;
while (true) {
    while (in == out)
        ; /* do nothing */
    next_consumed = buffer[out];
    out = (out + 1) % BUFFER_SIZE;
    /* consume the item in next_consumed */
}</pre></div>
</div>
<div class="formula">Буфер пуст: in == out &nbsp;|&nbsp; Буфер полон: (in + 1) % BUFFER_SIZE == out &nbsp;→ одновременно не более <b>BUFFER_SIZE − 1</b> элементов (9 из 10)</div>
<div class="callout note">На слайде 43 у producer строки переставлены (<code>in = …</code> перед <code>buffer[in] = …</code>). Корректный порядок (как у Silberschatz и в версии с counter): сначала записать в <code>buffer[in]</code>, потом сдвинуть <code>in</code>.</div>`,
      viz: [{ name: 'stepper', caption: 'Трассировка с BUFFER_SIZE = 4: помещается только 3 элемента', props: { lang: 'c', code: `#define BUFFER_SIZE 4
item buffer[BUFFER_SIZE];
int in = 0, out = 0;
/* producer */
while (((in + 1) % BUFFER_SIZE) == out)
    ; /* buffer full: wait */
buffer[in] = next_produced;
in = (in + 1) % BUFFER_SIZE;
/* consumer */
while (in == out)
    ; /* buffer empty: wait */
next_consumed = buffer[out];
out = (out + 1) % BUFFER_SIZE;`, steps: [
        { line: 3, note: 'Начало: in == out → буфер пуст.', vars: { in: 0, out: 0, buffer: '[_, _, _, _]' } },
        { line: [10, 11], note: 'Consumer: in == out → крутится в пустом цикле (busy waiting).', vars: { in: 0, out: 0 } },
        { line: [7, 8], note: 'Producer кладёт A.', vars: { in: 1, out: 0, buffer: '[A, _, _, _]' } },
        { line: [7, 8], note: 'Producer кладёт B.', vars: { in: 2, out: 0, buffer: '[A, B, _, _]' } },
        { line: [7, 8], note: 'Producer кладёт C.', vars: { in: 3, out: 0, buffer: '[A, B, C, _]' } },
        { line: [5, 6], note: '(3 + 1) % 4 = 0 == out → буфер ПОЛОН, хотя один слот свободен. Producer ждёт.', vars: { in: 3, out: 0, buffer: '[A, B, C, _]' } },
        { line: [12, 13], note: 'Consumer забирает A, слот 0 освободился.', vars: { in: 3, out: 1, buffer: '[_, B, C, _]', next_consumed: 'A' } },
        { line: [7, 8], note: '(3 + 1) % 4 = 0 ≠ 1 → producer кладёт D в слот 3, in циклически переходит на 0. Теперь (0 + 1) % 4 == out → снова «полон» (3 элемента).', vars: { in: 0, out: 1, buffer: '[_, B, C, D]' } }] } }],
      exam: 'Условия «пуст» (in == out) и «полон» ((in+1)%N == out); почему помещается N − 1 элемент.'
    },
    {
      id: 'race',
      h: 'Filling all the buffers: counter и Race Condition',
      html: `
<p>Чтобы использовать <b>все</b> N буферов, добавляют общую переменную <b>counter</b> — число заполненных буферов. Изначально 0; producer увеличивает его после записи, consumer уменьшает после чтения.</p>
<div class="cols">
<div><b>Producer</b>
<pre class="code" data-lang="c">while (true) {
    /* produce an item in next_produced */
    while (counter == BUFFER_SIZE)
        ; /* do nothing */
    buffer[in] = next_produced;
    in = (in + 1) % BUFFER_SIZE;
    counter++;
}</pre></div>
<div><b>Consumer</b>
<pre class="code" data-lang="c">while (true) {
    while (counter == 0)
        ; /* do nothing */
    next_consumed = buffer[out];
    out = (out + 1) % BUFFER_SIZE;
    counter--;
    /* consume the item in next_consumed */
}</pre></div>
</div>
<p><b>Race Condition</b>: <code>counter++</code> и <code>counter--</code> — не атомарны, на машинном уровне это 3 инструкции:</p>
<div class="cols">
<pre class="code" data-lang="text">counter++:
register1 = counter
register1 = register1 + 1
counter = register1</pre>
<pre class="code" data-lang="text">counter--:
register2 = counter
register2 = register2 - 1
counter = register2</pre>
</div>
<p>Чередование при <b>counter = 5</b>:</p>
<pre class="code" data-lang="text">S0: producer  register1 = counter        {register1 = 5}
S1: producer  register1 = register1 + 1  {register1 = 6}
S2: consumer  register2 = counter        {register2 = 5}
S3: consumer  register2 = register2 - 1  {register2 = 4}
S4: producer  counter = register1        {counter = 6}
S5: consumer  counter = register2        {counter = 4}</pre>
<div class="callout warn">Итог <b>counter = 4</b>, а правильно <b>5</b> (один произвели, один потребили). Если S4 и S5 поменять местами — получится <b>6</b>. Результат зависит от порядка доступа к общим данным — это и есть <b>race condition</b>.</div>
<div class="callout note"><b>Вопрос со слайда</b>: почему в первом решении (заполняется максимум N − 1 буферов) не было race condition? Там каждая общая переменная имеет <b>одного писателя</b>: <code>in</code> изменяет только producer, <code>out</code> — только consumer. Общего счётчика, который меняют оба, нет. (Подробнее — в Synchronization.)</div>`,
      viz: [{ name: 'race', caption: 'Пошаговое чередование counter++ / counter-- (start = 5)', props: { start: 5 } }],
      exam: 'Разложить counter++ на 3 инструкции и показать чередование, дающее 4 или 6.'
    },
    {
      id: 'message-passing',
      h: 'IPC – Message Passing',
      html: `
<ul>
  <li>Процессы общаются <b>без общих переменных</b>.</li>
  <li>IPC facility даёт две операции: <code>send(message)</code> и <code>receive(message)</code>. Размер сообщения — <b>fixed</b> или <b>variable</b>.</li>
  <li>Чтобы P и Q общались, нужно: <b>установить communication link</b> и обмениваться сообщениями через send/receive.</li>
</ul>
<p><b>Implementation of Communication Link</b>:</p>
<table class="t">
  <tr><th>Physical</th><th>Logical</th></tr>
  <tr><td><b>Shared memory</b> — сообщения в одном блоке памяти<br><b>Hardware bus</b> — MCU с аппаратными периферийными блоками для связи процессов на разных процессорах<br><b>Network</b> — данные через сетевой интерфейс (к процессу на том же или другом компьютере)</td>
      <td><b>Direct</b> или <b>indirect</b><br><b>Synchronous</b> или <b>asynchronous</b><br><b>Automatic</b> или <b>explicit buffering</b></td></tr>
</table>
<div class="cols">
<div><b>Direct Communication</b> — процессы явно называют друг друга:
<ul>
  <li><code>send(P, message)</code> — послать процессу P;</li>
  <li><code>receive(Q, message)</code> — получить от процесса Q.</li>
</ul>
Свойства link:
<ul>
  <li>устанавливается <b>автоматически</b>;</li>
  <li>связан ровно с <b>одной парой</b> процессов;</li>
  <li>между парой — <b>ровно один</b> link;</li>
  <li>может быть однонаправленным, обычно <b>двунаправленный</b>.</li>
</ul></div>
<div><b>Indirect Communication</b> — через <b>mailboxes</b> (<b>ports</b>):
<ul>
  <li>mailbox — сущность, куда процессы кладут и откуда забирают сообщения; у каждого <b>уникальный id</b>;</li>
  <li>общаться можно, только если есть <b>общий mailbox</b>.</li>
</ul>
Свойства link:
<ul>
  <li>устанавливается, только если у процессов есть общий mailbox;</li>
  <li>может быть связан со <b>многими процессами</b>;</li>
  <li>пара процессов может иметь <b>несколько</b> links;</li>
  <li>однонаправленный или двунаправленный.</li>
</ul></div>
</div>
<p>Операции indirect: <b>create</b> mailbox (port), send/receive через mailbox, <b>delete</b> mailbox. Примитивы: <code>send(A, message)</code> — в mailbox A; <code>receive(A, message)</code> — из mailbox A.</p>
<p><b>Mailbox sharing</b>: P1, P2, P3 делят mailbox A; P1 отправляет, P2 и P3 вызывают receive. <b>Кто получит сообщение?</b> Решения (управляет ОС):</p>
<ul>
  <li>разрешить link максимум между <b>двумя</b> процессами;</li>
  <li>разрешить выполнять receive <b>только одному</b> процессу за раз;</li>
  <li>система <b>произвольно</b> выбирает получателя (например, Round Robin — по очереди); <b>отправителю сообщают</b>, кто получил.</li>
</ul>
<div data-viz="0"></div>
<p><b>Synchronization</b> — message passing бывает blocking или non-blocking:</p>
<table class="t">
  <tr><th></th><th><b>Blocking</b> = synchronous</th><th><b>Non-blocking</b> = asynchronous</th></tr>
  <tr><td><b>send</b></td><td>отправитель блокируется, пока сообщение не получено</td><td>отправил и продолжает работу</td></tr>
  <tr><td><b>receive</b></td><td>получатель блокируется, пока сообщение не появится</td><td>получает либо valid message, либо <b>null</b></td></tr>
</table>
<div class="callout key">Возможны разные комбинации. Если и send, и receive — <b>blocking</b>, это <b>rendezvous</b> между отправителем и получателем.</div>
<p><b>Producer–Consumer: Message Passing</b>:</p>
<div class="cols">
<pre class="code" data-lang="c">message next_produced;
while (true) {
    /* produce an item in next_produced */
    send(next_produced);
}</pre>
<pre class="code" data-lang="c">message next_consumed;
while (true) {
    receive(next_consumed);
    /* consume the item in next_consumed */
}</pre>
</div>
<p><b>Buffering</b> — очередь сообщений, прикреплённая к link:</p>
<table class="t">
  <tr><th>Capacity</th><th>Очередь</th><th>Отправитель</th></tr>
  <tr><td><b>Zero capacity</b></td><td>сообщения не ставятся в очередь</td><td>ждёт получателя (<b>rendezvous</b>)</td></tr>
  <tr><td><b>Bounded capacity</b></td><td>конечная длина, n сообщений</td><td>ждёт, если буфер полон</td></tr>
  <tr><td><b>Unbounded capacity</b></td><td>бесконечная длина</td><td>никогда не ждёт</td></tr>
</table>`,
      viz: [{ name: 'graph', caption: 'Direct (именуем процесс) vs indirect (через mailbox A)', props: { w: 660, h: 220,
        nodes: [
          { id: 'P', label: 'P', x: 40, y: 110, shape: 'circle', tone: 'acc' },
          { id: 'Q', label: 'Q', x: 190, y: 110, shape: 'circle', tone: 'acc' },
          { id: 'P1', label: 'P1', x: 300, y: 110, shape: 'circle', tone: 'ok' },
          { id: 'A', label: 'mailbox A', sub: 'unique id', x: 470, y: 110, w: 100, tone: 'warn' },
          { id: 'P2', label: 'P2', x: 625, y: 35, shape: 'circle', tone: 'ok' },
          { id: 'P3', label: 'P3', x: 625, y: 185, shape: 'circle', tone: 'ok' }],
        edges: [
          { from: 'P', to: 'Q', label: 'send(Q, msg)', both: true },
          { from: 'P1', to: 'A', label: 'send(A, msg)' },
          { from: 'A', to: 'P2', label: 'receive(A)' }, { from: 'A', to: 'P3', label: 'receive(A)' }] } }],
      exam: 'Direct vs indirect и свойства link; кто получит сообщение в общем mailbox; blocking/non-blocking и rendezvous; три вида buffering.'
    },
    {
      id: 'posix-shm',
      h: 'POSIX Shared Memory: shm_open, ftruncate, mmap',
      html: `
<ul>
  <li>POSIX shared memory организована через <b>memory-mapped files</b> — область общей памяти связывается с файлом.</li>
  <li>Сначала процесс создаёт <b>shared-memory object</b>: <code>shm_fd = shm_open(name, O_CREAT | O_RDWR, 0666);</code>
    <ul>
      <li><b>name</b> — имя объекта; процессы, желающие доступа, обращаются к нему по этому имени;</li>
      <li><b>O_CREAT | O_RDWR</b> — создать, если не существует (O_CREAT), открыть на чтение и запись (O_RDWR);</li>
      <li>последний параметр — права доступа (<b>0666</b>) к объекту.</li>
    </ul></li>
  <li>Успешный <code>shm_open()</code> возвращает <b>integer file descriptor</b> объекта.</li>
  <li><code>ftruncate(shm_fd, 4096);</code> — задаёт <b>размер объекта</b> в байтах (здесь 4096).</li>
  <li><code>mmap()</code> — создаёт memory-mapped file с объектом и <b>возвращает указатель</b>; чтение/запись shared memory — через этот указатель.</li>
</ul>
<div data-viz="0"></div>
<p><b>Producer–Consumer пример</b>: producer создаёт объект с именем <b>"OS"</b> и пишет в него «Hello World!»; consumer читает, печатает и удаляет объект.</p>
<ul>
  <li>Флаг <b>MAP_SHARED</b> в <code>mmap()</code> — изменения объекта <b>видны всем процессам</b>, которые его разделяют.</li>
  <li>Запись — через <code>sprintf()</code> по указателю.</li>
  <li>Consumer вызывает <code>shm_unlink()</code> — удаляет сегмент shared memory после чтения.</li>
</ul>
<div class="cols">
<div><b>IPC POSIX Producer</b>
<pre class="code" data-lang="c">#include &lt;stdio.h&gt;
#include &lt;stdlib.h&gt;
#include &lt;string.h&gt;
#include &lt;fcntl.h&gt;
#include &lt;sys/shm.h&gt;
#include &lt;sys/stat.h&gt;
#include &lt;sys/mman.h&gt;
#include &lt;unistd.h&gt;
int main()
{
    const int SIZE = 4096;      /* size of shm object */
    const char* name = "OS";    /* name of shm object */
    const char* message_0 = "Hello";
    const char* message_1 = "World!";
    int shm_fd;                 /* shm file descriptor */
    void* ptr;                  /* pointer to shm object */

    /* create the shared memory object */
    shm_fd = shm_open(name, O_CREAT | O_RDWR, 0666);
    /* configure the size of the shared memory object */
    ftruncate(shm_fd, SIZE);
    /* memory map the shared memory object */
    ptr = mmap(0, SIZE, PROT_WRITE, MAP_SHARED, shm_fd, 0);
    /* write to the shared memory object */
    sprintf(ptr, "%s", message_0);
    ptr += strlen(message_0);
    sprintf(ptr, "%s", message_1);
    ptr += strlen(message_1);
    return 0;
}</pre></div>
<div><b>IPC POSIX Consumer</b>
<pre class="code" data-lang="c">/* те же #include */
int main()
{
    const int SIZE = 4096;
    const char* name = "OS";
    int shm_fd;
    void* ptr;

    /* open the shared memory object */
    shm_fd = shm_open(name, O_RDONLY, 0666);
    /* memory map the shared memory object */
    ptr = mmap(0, SIZE, PROT_READ, MAP_SHARED, shm_fd, 0);
    /* read from the shared memory object */
    printf("%s", (char*)ptr);
    /* remove the shared memory object */
    shm_unlink(name);
    return 0;
}</pre></div>
</div>
<div class="callout key">Consumer напечатает <b>HelloWorld!</b> (строки записаны подряд, без пробела). Producer открывает объект с <code>O_CREAT | O_RDWR</code> и <code>PROT_WRITE</code>, consumer — с <code>O_RDONLY</code> и <code>PROT_READ</code>; <code>ftruncate</code> вызывает только создатель.</div>`,
      viz: [{ name: 'flow', caption: 'Последовательность вызовов POSIX shared memory', props: { dir: 'h', steps: [
        { label: 'shm_open()', sub: 'создать/открыть → fd', tone: 'acc' },
        { label: 'ftruncate()', sub: 'размер 4096 B', tone: 'acc' },
        { label: 'mmap()', sub: 'MAP_SHARED → ptr', tone: 'acc' },
        { label: 'sprintf / printf', sub: 'чтение-запись через ptr', tone: 'ok' },
        { label: 'shm_unlink()', sub: 'удалить (consumer)', tone: 'warn' }] } }],
      exam: 'Порядок shm_open → ftruncate → mmap; смысл O_CREAT|O_RDWR, MAP_SHARED; кто вызывает shm_unlink; что напечатает consumer.'
    },
    {
      id: 'mach-alpc',
      h: 'Examples of IPC Systems — Mach и Windows ALPC',
      html: `
<p><b>Mach</b>:</p>
<ul>
  <li>Коммуникация <b>message based</b>; <b>даже system calls — это сообщения</b>.</li>
  <li>Каждая task при создании получает <b>два порта</b>: <b>Kernel</b> и <b>Notify</b>.</li>
  <li>Сообщения отправляются и принимаются функцией <code>mach_msg()</code>; порты для коммуникации создаются <code>mach_port_allocate()</code>.</li>
  <li>Send и receive гибкие; например, 4 варианта, если mailbox полон: <b>ждать бесконечно</b>; <b>ждать не более n миллисекунд</b>; <b>вернуться немедленно</b>; <b>временно закэшировать</b> сообщение.</li>
</ul>
<pre class="code" data-lang="c">#include &lt;mach/mach.h&gt;
struct message {
    mach_msg_header_t header;
    int data;
};
mach_port_t client;
mach_port_t server;

/* Client Code */
struct message message;
// construct the header
message.header.msgh_size = sizeof(message);
message.header.msgh_remote_port = server;
message.header.msgh_local_port = client;
// send the message
mach_msg(&amp;message.header,     // message header
    MACH_SEND_MSG,            // sending a message
    sizeof(message),          // size of message sent
    0,                        // maximum size of received message - unnecessary
    MACH_PORT_NULL,           // name of receive port - unnecessary
    MACH_MSG_TIMEOUT_NONE,    // no time outs
    MACH_PORT_NULL);          // no notify port

/* Server Code */
struct message message;
// receive the message
mach_msg(&amp;message.header,     // message header
    MACH_RCV_MSG,             // receiving a message
    0,                        // size of message sent
    sizeof(message),          // maximum size of received message
    server,                   // name of receive port
    MACH_MSG_TIMEOUT_NONE,    // no time outs
    MACH_PORT_NULL);          // no notify port</pre>
<p><b>Windows</b> — message-passing через <b>advanced local procedure call (ALPC)</b> facility:</p>
<ul>
  <li>работает <b>только между процессами на одной системе</b>;</li>
  <li>использует <b>ports</b> (как mailboxes) для установления и поддержки каналов.</li>
</ul>
<ol>
  <li>Client открывает handle к <b>connection port</b> object подсистемы.</li>
  <li>Client отправляет <b>connection request</b>.</li>
  <li>Server создаёт <b>два private communication ports</b> и возвращает client handle одного из них.</li>
  <li>Client и server используют соответствующие port handles для отправки сообщений или callbacks и ожидания ответов.</li>
</ol>
<div data-viz="0"></div>`,
      viz: [{ name: 'graph', caption: 'Local Procedure Calls in Windows', props: { w: 620, h: 300,
        nodes: [
          { id: 'cl', label: 'Client', x: 60, y: 150, w: 90, h: 260, tone: 'acc' },
          { id: 'sv', label: 'Server', x: 560, y: 150, w: 90, h: 260, tone: 'acc' },
          { id: 'cp', label: 'Connection Port', x: 310, y: 35, w: 160 },
          { id: 'ccp', label: 'Client Communication Port', x: 310, y: 125, w: 200, tone: 'warn' },
          { id: 'scp', label: 'Server Communication Port', x: 310, y: 190, w: 200, tone: 'warn' },
          { id: 'sec', label: 'Shared Section Object', sub: '> 256 bytes', x: 310, y: 262, w: 200, tone: 'muted' }],
        edges: [
          { from: 'cl', to: 'cp', label: 'connection request' }, { from: 'cp', to: 'sv', label: 'handle' },
          { from: 'ccp', to: 'cl', label: 'handle' }, { from: 'scp', to: 'sv', label: 'handle' },
          { from: 'ccp', to: 'scp', both: true },
          { from: 'sec', to: 'cl', both: true }, { from: 'sec', to: 'sv', both: true }] } }],
      exam: 'Mach: system calls — сообщения, порты Kernel и Notify, mach_msg(), 4 варианта при полном mailbox. ALPC: только локально, connection port → два communication ports.'
    },
    {
      id: 'pipes',
      h: 'Pipes — ordinary и named',
      html: String.raw`
<ul>
  <li><b>Pipe</b> — канал (conduit), позволяющий двум процессам общаться.</li>
  <li><b>Ordinary pipes</b> — недоступны извне процесса, который их создал. Обычно parent создаёт pipe и общается через него с созданным child.</li>
  <li><b>Named pipes</b> — доступны <b>без parent–child</b> отношения.</li>
</ul>
<p><b>Ordinary Pipes</b>:</p>
<ul>
  <li>Коммуникация в стиле producer–consumer: producer пишет в <b>write-end</b>, consumer читает из <b>read-end</b>.</li>
  <li>Поэтому ordinary pipes <b>unidirectional</b> (однонаправленные).</li>
  <li>Требуют <b>parent–child</b> отношения между процессами.</li>
  <li>В Windows называются <b>anonymous pipes</b>.</li>
</ul>
<p><b>Ordinary Pipes in POSIX</b>: <code>pipe(fd)</code> передаёт информацию от одного процесса к другому; <b>fd[0] — read end</b>, <b>fd[1] — write end</b>. Pipe однонаправленный → для двусторонней связи создают <b>два pipe</b>, по одному на направление.</p>
<div data-viz="0"></div>
<p><b>Example pipes</b> — parent отправляет строку child, child дописывает " Pippo" и возвращает:</p>
<pre class="code" data-lang="c">#include &lt;stdio.h&gt;
#include &lt;stdlib.h&gt;
#include &lt;string.h&gt;
#include &lt;sys/types.h&gt;
#include &lt;sys/wait.h&gt;
#include &lt;unistd.h&gt;
int main()
{
    // We use two pipes
    // First pipe to send input string from parent
    // Second pipe to send concatenated string from child
    int fd1[2]; // Used to store two ends of first pipe
    int fd2[2]; // Used to store two ends of second pipe
    char fixed_str[] = " Pippo";
    char input_str[100];
    pid_t p;
    if (pipe(fd1) == -1) {
        fprintf(stderr, "Pipe Failed");
        return 1;
    }
    if (pipe(fd2) == -1) {
        fprintf(stderr, "Pipe Failed");
        return 1;
    }
    p = fork();
    if (p &lt; 0) {
        fprintf(stderr, "fork Failed");
        return 1;
    }
    // Parent process
    else if (p &gt; 0) {
        char concat_str[100];
        close(fd1[0]); // Close reading end of first pipe
        // Write input string and close writing end of first pipe.
        scanf("%s", input_str);
        write(fd1[1], input_str, strlen(input_str) + 1);
        close(fd1[1]);
        // Wait for child to send a string
        wait(NULL);
        close(fd2[1]); // Close writing end of second pipe
        // Read string from child, print it and close reading end.
        read(fd2[0], concat_str, 100);
        printf("Concatenated string %s\n", concat_str);
        close(fd2[0]);
    }
    // child process
    else {
        close(fd1[1]); // Close writing end of first pipe
        // Read a string using first pipe
        char concat_str[100];
        read(fd1[0], concat_str, 100);
        // Concatenate a fixed string with it
        int k = strlen(concat_str);
        int i;
        for (i = 0; i &lt; strlen(fixed_str); i++)
            concat_str[k++] = fixed_str[i];
        concat_str[k] = '\0'; // string ends with '\0'
        // Close both reading ends
        close(fd1[0]);
        close(fd2[0]);
        // Write concatenated string and close writing end
        write(fd2[1], concat_str, strlen(concat_str) + 1);
        close(fd2[1]);
        return 0;
    }
}</pre>
<div data-viz="1"></div>
<p><b>Named Pipes</b> — мощнее ordinary:</p>
<ul>
  <li>коммуникация <b>bidirectional</b>;</li>
  <li><b>не нужно parent–child</b> отношения;</li>
  <li><b>несколько процессов</b> могут использовать named pipe;</li>
  <li>есть и в <b>UNIX</b>, и в <b>Windows</b>.</li>
</ul>
<table class="t">
  <tr><th></th><th>Ordinary pipe</th><th>Named pipe</th></tr>
  <tr><td>Направление</td><td>unidirectional</td><td>bidirectional</td></tr>
  <tr><td>Отношение процессов</td><td>нужен parent–child</td><td>не нужно</td></tr>
  <tr><td>Доступ извне создателя</td><td>нет</td><td>да, несколько процессов</td></tr>
  <tr><td>Windows</td><td>anonymous pipes</td><td>named pipes</td></tr>
</table>`,
      viz: [
        { name: 'graph', caption: 'Два pipe для двусторонней связи: fd1 (parent → child), fd2 (child → parent)', props: { w: 600, h: 200,
          nodes: [
            { id: 'par', label: 'Parent', x: 70, y: 100, tone: 'acc' },
            { id: 'p1', label: 'pipe fd1', sub: 'fd1[1] → fd1[0]', x: 300, y: 45, w: 150, tone: 'warn' },
            { id: 'p2', label: 'pipe fd2', sub: 'fd2[1] → fd2[0]', x: 300, y: 155, w: 150, tone: 'warn' },
            { id: 'ch', label: 'Child', x: 530, y: 100, tone: 'ok' }],
          edges: [
            { from: 'par', to: 'p1', label: 'write fd1[1]' }, { from: 'p1', to: 'ch', label: 'read fd1[0]' },
            { from: 'ch', to: 'p2', label: 'write fd2[1]' }, { from: 'p2', to: 'par', label: 'read fd2[0]' }] } },
        { name: 'stepper', caption: 'Трассировка примера (ввод: Hello)', props: { lang: 'c', code: String.raw`pipe(fd1); pipe(fd2);
p = fork();
if (p > 0) {                 /* parent */
    close(fd1[0]);
    scanf("%s", input_str);
    write(fd1[1], input_str, strlen(input_str) + 1);
    close(fd1[1]);
    wait(NULL);
    close(fd2[1]);
    read(fd2[0], concat_str, 100);
    printf("Concatenated string %s\n", concat_str);
    close(fd2[0]);
} else {                     /* child */
    close(fd1[1]);
    read(fd1[0], concat_str, 100);
    /* append fixed_str = " Pippo" */
    close(fd1[0]);
    close(fd2[0]);
    write(fd2[1], concat_str, strlen(concat_str) + 1);
    close(fd2[1]);
}`, steps: [
          { line: 1, note: 'Создаются два pipe: fd1 (parent → child) и fd2 (child → parent). [0] — read end, [1] — write end.' },
          { line: 2, note: 'fork(): child наследует ОБА pipe (все 4 дескриптора).' },
          { line: [4, 14], note: 'Каждый закрывает ненужные концы fd1: parent — read end, child — write end.' },
          { line: [5, 6, 7], note: 'Parent читает «Hello» с клавиатуры и пишет "Hello\\0" в fd1[1].', vars: { input_str: 'Hello' } },
          { line: 15, note: 'Child читает из fd1[0] (до этого он был заблокирован в read).', vars: { 'child concat_str': 'Hello' } },
          { line: 16, note: 'Child дописывает fixed_str.', vars: { 'child concat_str': 'Hello Pippo' } },
          { line: [17, 18, 19, 20], note: 'Child закрывает read ends и пишет результат в fd2[1], затем завершается.' },
          { line: [8, 9, 10, 11], note: 'Parent дождался child (wait), читает fd2[0] и печатает.', vars: { 'parent concat_str': 'Hello Pippo' }, out: 'Concatenated string Hello Pippo' }] } }
      ],
      exam: 'fd[0] — read, fd[1] — write; какие концы закрывает parent/child; ordinary vs named pipes; вывод примера (Hello → Hello Pippo).'
    },
    {
      id: 'sockets',
      h: 'Client-Server: Sockets',
      html: `
<p><b>Communications in Client-Server Systems</b>: <b>Sockets</b> и <b>Remote Procedure Calls (RPC)</b>.</p>
<ul>
  <li><b>Socket</b> — <b>endpoint for communication</b>.</li>
  <li>Это конкатенация <b>IP address</b> и <b>port</b> (числа в начале пакета, различающего сетевые сервисы на хосте).</li>
  <li>Socket <b>161.25.19.8:1625</b> — порт <b>1625</b> на хосте <b>161.25.19.8</b>.</li>
  <li>Коммуникация идёт между <b>парой сокетов</b>.</li>
  <li>Все порты <b>ниже 1024</b> — <b>well known</b>, используются стандартными сервисами (например, 80 — web server).</li>
  <li>Специальный IP <b>127.0.0.1</b> (<b>loopback</b>) обозначает систему, на которой выполняется процесс.</li>
</ul>`,
      viz: [{ name: 'graph', caption: 'Socket Communication: host X ↔ web server', props: { w: 600, h: 200,
        nodes: [
          { id: 'x', label: 'socket 146.86.5.20:1625', sub: 'host X (146.86.5.20)', x: 150, y: 70, w: 210, h: 54, tone: 'acc' },
          { id: 'w', label: 'socket 161.25.19.8:80', sub: 'web server (161.25.19.8)', x: 440, y: 140, w: 210, h: 54, tone: 'ok' }],
        edges: [{ from: 'x', to: 'w', both: true }] } }],
      exam: 'Socket = IP:port; well-known порты < 1024; 127.0.0.1 — loopback.'
    }
  ],
  terms: [
    { en: 'Process', ru: 'Процесс', def: 'Программа в выполнении (активная сущность); выполняется последовательно.' },
    { en: 'Program', ru: 'Программа', def: 'Пассивная сущность — executable file на диске; становится процессом при загрузке в память.' },
    { en: 'Text section', ru: 'Сегмент кода', def: 'Часть памяти процесса с кодом программы.' },
    { en: 'Data section', ru: 'Сегмент данных', def: 'Глобальные переменные (initialized и uninitialized data).' },
    { en: 'Stack', ru: 'Стек', def: 'Временные данные: параметры функций, return addresses, локальные переменные; растёт вниз.' },
    { en: 'Heap', ru: 'Куча', def: 'Память, динамически выделяемая во время выполнения (malloc); растёт вверх.' },
    { en: 'Address space', ru: 'Адресное пространство', def: 'Диапазон адресов памяти, который ОС назначает процессу (base … base + limit).' },
    { en: 'Process state', ru: 'Состояние процесса', def: 'new, ready, running, waiting, terminated.' },
    { en: 'PCB (Process Control Block)', ru: 'Блок управления процессом', def: 'Структура ядра со всей информацией о процессе: state, PC, registers, scheduling, memory, accounting, I/O status. Хранится в kernel space.' },
    { en: 'task_struct', ru: 'PCB в Linux', def: 'C-структура Linux, представляющая процесс (pid, state, time_slice, parent, children, files, mm).' },
    { en: 'Ready queue', ru: 'Очередь готовых', def: 'Процессы в main memory, готовые к выполнению и ждущие CPU.' },
    { en: 'Wait queue', ru: 'Очередь ожидания', def: 'Процессы, ждущие события (например, завершения I/O).' },
    { en: 'Long-term scheduler', ru: 'Долгосрочный планировщик (job scheduler)', def: 'Выбирает процессы из job pool на диске в ready queue; редко; контролирует degree of multiprogramming.' },
    { en: 'Short-term scheduler', ru: 'Краткосрочный планировщик (CPU scheduler)', def: 'Выбирает следующий процесс для CPU; вызывается каждые миллисекунды.' },
    { en: 'Degree of multiprogramming', ru: 'Степень мультипрограммирования', def: 'Число процессов в памяти; контролируется long-term scheduler.' },
    { en: 'I/O-bound / CPU-bound', ru: 'Ограниченный вводом-выводом / вычислениями', def: 'I/O-bound — много коротких CPU bursts; CPU-bound — очень длинные CPU bursts.' },
    { en: 'Context switch', ru: 'Переключение контекста', def: 'Сохранение state текущего процесса в PCB и загрузка state другого; pure overhead.' },
    { en: 'pid', ru: 'Идентификатор процесса', def: 'Целое число, по которому ОС идентифицирует процесс и управляет им.' },
    { en: 'fork()', ru: 'Создание процесса', def: 'Создаёт child — копию parent; возвращает 0 в child, PID child в parent, < 0 при ошибке.' },
    { en: 'exec()', ru: 'Замена программы', def: 'Заменяет memory space процесса новой программой; при успехе не возвращается.' },
    { en: 'wait()', ru: 'Ожидание потомка', def: 'Блокирует parent до завершения child; возвращает pid child и status.' },
    { en: 'abort()', ru: 'Принудительное завершение', def: 'Parent завершает child (превышены ресурсы, задача не нужна, parent завершается).' },
    { en: 'Cascading termination', ru: 'Каскадное завершение', def: 'При завершении процесса ОС завершает всех его потомков (children, grandchildren…).' },
    { en: 'Zombie', ru: 'Зомби', def: 'Завершившийся процесс, чей parent ещё не вызвал wait().' },
    { en: 'Orphan', ru: 'Сирота', def: 'Процесс, parent которого завершился без wait(); усыновляется init.' },
    { en: 'Cooperating process', ru: 'Кооперирующийся процесс', def: 'Может влиять на другие процессы или подвергаться их влиянию (в т.ч. через общие данные).' },
    { en: 'IPC', ru: 'Межпроцессное взаимодействие', def: 'Механизм обмена данными между процессами: shared memory или message passing.' },
    { en: 'Bounded buffer', ru: 'Ограниченный буфер', def: 'Буфер фиксированного размера: producer ждёт при полном, consumer — при пустом.' },
    { en: 'Race condition', ru: 'Состояние гонки', def: 'Результат зависит от порядка доступа нескольких процессов к общим данным (counter = 4 или 6 вместо 5).' },
    { en: 'Mailbox (port)', ru: 'Почтовый ящик', def: 'Объект с уникальным id для indirect communication: процессы кладут и забирают сообщения.' },
    { en: 'Rendezvous', ru: 'Рандеву', def: 'И send, и receive блокирующие (или zero capacity buffer) — отправитель и получатель встречаются.' },
    { en: 'Memory-mapped file', ru: 'Файл, отображённый в память', def: 'Основа POSIX shared memory: shm_open → ftruncate → mmap.' },
    { en: 'ALPC', ru: 'Advanced Local Procedure Call', def: 'Message passing в Windows между процессами одной системы через ports.' },
    { en: 'Ordinary pipe', ru: 'Обычный канал', def: 'Однонаправленный канал между parent и child; fd[0] — read end, fd[1] — write end; в Windows — anonymous pipe.' },
    { en: 'Named pipe', ru: 'Именованный канал', def: 'Двунаправленный канал без parent–child отношения, для нескольких процессов; UNIX и Windows.' },
    { en: 'Socket', ru: 'Сокет', def: 'Endpoint for communication: IP address + port (например, 161.25.19.8:1625).' },
    { en: 'Loopback', ru: 'Петлевой адрес', def: '127.0.0.1 — обращение к системе, на которой выполняется процесс.' }
  ],
  questions: [
    { id: 'proc-01', type: 'single', q: 'Чем process отличается от program?', options: ['Program — активная сущность в памяти, process — файл на диске', 'Program — пассивная сущность (executable file на диске), process — программа в выполнении', 'Это синонимы', 'Process — это набор программ, запущенных одним пользователем'], answer: 1, explain: 'Program — пассивный executable file; становится process, когда загружена в память и выполняется.', section: 'concept', diff: 1 },
    { id: 'proc-02', type: 'tf', q: 'Одной программе может соответствовать несколько процессов одновременно.', answer: true, explain: 'Например, несколько пользователей запускают одну и ту же программу — это разные процессы.', section: 'concept', diff: 1 },
    { id: 'proc-03', type: 'single', q: 'Где в памяти процесса хранятся параметры функций, return addresses и локальные переменные?', options: ['Text section', 'Data section', 'Heap', 'Stack'], answer: 3, explain: 'Stack — временные данные вызовов. Heap — динамическая память, data — глобальные переменные, text — код.', section: 'memory', diff: 1 },
    { id: 'proc-04', type: 'code', q: 'В какой области памяти находятся 5 int, выделенные в этой программе?', lang: 'c', code: String.raw`int x;
int y = 15;
int main(int argc, char *argv[]) {
    int *values;
    values = (int *)malloc(sizeof(int) * 5);
    return 0;
}`, options: ['Stack', 'Heap', 'Initialized data', 'Uninitialized data'], answer: 1, explain: 'malloc выделяет память в heap. Сам указатель values — локальная переменная в stack.', section: 'memory', diff: 2 },
    { id: 'proc-05', type: 'single', q: 'Глобальная переменная int y = 15; в memory layout C-программы находится в…', options: ['initialized data', 'uninitialized data', 'stack', 'text'], answer: 0, explain: 'Инициализированные глобальные — initialized data; без инициализатора (int x;) — uninitialized data.', section: 'memory', diff: 1 },
    { id: 'proc-06', type: 'single', q: 'Процессу выделены адреса с base = 300040 и base + limit = 420940. Чему равен limit?', options: ['120900', '420940', '300040', '720980'], answer: 0, explain: 'limit = (base + limit) − base = 420940 − 300040 = 120900.', section: 'memory', diff: 2 },
    { id: 'proc-07', type: 'single', q: 'Процесс готов к выполнению и ждёт, когда его назначат на процессор. Его состояние —', options: ['New', 'Waiting', 'Ready', 'Running'], answer: 2, explain: 'Ready — ждёт CPU. Waiting — ждёт события (I/O), а не процессора.', section: 'states', diff: 1 },
    { id: 'proc-08', type: 'single', q: 'Какой переход НЕ существует на диаграмме состояний процесса?', options: ['waiting → running', 'ready → running', 'running → ready', 'waiting → ready'], answer: 0, explain: 'После завершения I/O процесс идёт в ready (I/O or event completion); CPU ему выдаёт scheduler dispatch уже из ready.', section: 'states', diff: 2 },
    { id: 'proc-09', type: 'single', q: 'Какое событие переводит процесс из running в ready?', options: ['admitted', 'interrupt', 'I/O or event wait', 'exit'], answer: 1, explain: 'Interrupt (например, истёк квант) — running → ready. I/O wait — running → waiting, exit — running → terminated.', section: 'states', diff: 1 },
    { id: 'proc-10', type: 'multi', q: 'Что хранится в PCB? (несколько ответов)', options: ['Process state', 'Program counter', 'CPU registers', 'Исходный код программы', 'List of open files', 'Accounting information'], answer: [0, 1, 2, 4, 5], explain: 'Код программы лежит в text section памяти процесса, а не в PCB. Остальное — поля PCB (open files — в I/O status information).', section: 'pcb', diff: 1 },
    { id: 'proc-11', type: 'single', q: 'Как называется структура, представляющая процесс (PCB) в Linux?', options: ['task_struct', 'mm_struct', 'files_struct', 'list_head'], answer: 0, explain: 'task_struct — PCB Linux. mm_struct (address space) и files_struct (open files) — поля внутри неё.', section: 'pcb', diff: 1 },
    { id: 'proc-12', type: 'tf', q: 'PCB хранятся в user space процесса, чтобы процесс мог сам их изменять.', answer: false, explain: 'PCB хранятся в специально зарезервированной памяти ОС — kernel space.', section: 'pcb', diff: 1 },
    { id: 'proc-13', type: 'single', q: 'По queueing diagram: у процесса на CPU истёк time slice. Куда он попадает?', options: ['I/O wait queue', 'Ready queue', 'Child termination wait queue', 'Terminated'], answer: 1, explain: 'Time slice expired → процесс сразу возвращается в ready queue, ничего не ожидая.', section: 'scheduling', diff: 1 },
    { id: 'proc-14', type: 'single', q: 'Как реализованы ready queue и wait queues на слайде?', options: ['Как массив фиксированного размера процессов', 'Как связный список PCB с указателями head и tail в queue header', 'Как стек процессов', 'Как дерево процессов'], answer: 1, explain: 'Queue header содержит head и tail; PCB связаны в список (PCB7 → PCB2 и т.д.).', section: 'scheduling', diff: 2 },
    { id: 'proc-15', type: 'single', q: 'Какой планировщик контролирует degree of multiprogramming?', options: ['Short-term scheduler', 'Long-term scheduler', 'Dispatcher', 'Interrupt handler'], answer: 1, explain: 'Long-term (job) scheduler решает, сколько процессов из job pool попадёт в память/ready queue.', section: 'schedulers', diff: 1 },
    { id: 'proc-16', type: 'single', q: 'Почему short-term scheduler должен быть быстрым?', options: ['Он вызывается раз в несколько минут', 'Он вызывается очень часто (milliseconds)', 'Он загружает процессы с диска', 'Он работает только при загрузке ОС'], answer: 1, explain: 'Short-term вызывается каждые миллисекунды, поэтому должен быть быстрым; long-term вызывается редко и может быть медленным.', section: 'schedulers', diff: 1 },
    { id: 'proc-17', type: 'single', q: 'I/O-bound process характеризуется…', options: ['много коротких CPU bursts', 'очень длинные CPU bursts', 'отсутствием I/O', 'всегда наивысшим приоритетом'], answer: 0, explain: 'I/O-bound больше времени тратит на I/O → много коротких CPU bursts. Длинные bursts — у CPU-bound.', section: 'schedulers', diff: 1 },
    { id: 'proc-18', type: 'multi', q: 'Что верно про context switch? (несколько ответов)', options: ['Время context switch — pure overhead', 'Контекст процесса хранится в PCB', 'Чем сложнее ОС и PCB, тем дольше переключение', 'Во время переключения выполняется полезная работа процесса', 'Несколько наборов регистров на CPU позволяют держать несколько контекстов загруженными'], answer: [0, 1, 2, 4], explain: 'Во время переключения система не делает полезной работы — это overhead. Остальное — со слайда о context switch.', section: 'context-switch', diff: 2 },
    { id: 'proc-19', type: 'single', q: 'Android: что верно про service, используемый background process?', options: ['Имеет собственный UI', 'Может продолжать работать, даже если background process приостановлен', 'Работает только пока процесс в foreground', 'Использует много памяти'], answer: 1, explain: 'Service продолжает работать при приостановленном background process; у него нет UI и мало памяти.', section: 'mobile', diff: 1 },
    { id: 'proc-59', type: 'single', q: 'Какой процесс является корнем дерева процессов Linux на слайде?', options: ['bash (pid 8416)', 'systemd (pid 1)', 'sshd (pid 3028)', 'logind (pid 8415)'], answer: 1, explain: 'systemd с pid = 1 — предок всех процессов; logind, python, sshd — его children.', section: 'creation', diff: 1 },
    { id: 'proc-60', type: 'multi', q: 'Какие варианты resource sharing между parent и child перечислены на слайде? (несколько ответов)', options: ['Parent и children делят все ресурсы', 'Children делят подмножество ресурсов parent', 'Parent и child не делят ресурсы', 'Child делит ресурсы только с siblings'], answer: [0, 1, 2], explain: 'Три варианта: все, подмножество, никаких. Варианта «только siblings» нет.', section: 'creation', diff: 2 },
    { id: 'proc-20', type: 'single', q: 'fork() вернул 0. Что это означает?', options: ['Ошибка создания процесса', 'Код выполняется в child process', 'Код выполняется в parent, PID child = 0', 'Child уже завершился'], answer: 1, explain: '0 возвращается новому child; parent получает PID child (> 0); отрицательное значение — ошибка.', section: 'fork', diff: 1 },
    { id: 'proc-21', type: 'code', q: 'Сколько раз будет напечатано Hello world!?', lang: 'c', code: String.raw`#include <stdio.h>
#include <sys/types.h>
#include <unistd.h>
int main()
{
    fork();
    fork();
    fork();
    printf("Hello world!, process_id(pid) = %d \n", getpid());
    return 0;
}`, options: ['3', '6', '7', '8'], answer: 3, explain: 'Каждый fork() удваивает число процессов: 2³ = 8 процессов, каждый печатает один раз. 7 — число созданных child.', section: 'fork', diff: 1 },
    { id: 'proc-22', type: 'code', q: 'Сколько раз будет напечатано hello?', lang: 'c', code: String.raw`int main()
{
    for (int i = 0; i < 4; i++)
        fork();
    printf("hello\n");
    return 0;
}`, options: ['4', '5', '8', '16'], answer: 3, explain: '4 последовательных безусловных fork() (child продолжает цикл с того же i) → 2⁴ = 16 процессов.', section: 'fork', diff: 2 },
    { id: 'proc-23', type: 'code', q: 'Что выведет программа?', lang: 'c', code: String.raw`int x = 1;
pid_t p = fork();
if (p < 0) {
    perror("fork fail");
    return 1;
}
else if (p == 0)
    printf("Child has x = %d\n", ++x);
else
    printf("Parent has x = %d\n", --x);`, options: ['Child has x = 2 и Parent has x = 0, в любом порядке', 'Всегда сначала Parent has x = 0, затем Child has x = 2', 'Child has x = 2 и Parent has x = 1 — x общая для процессов', 'Child has x = 1 и Parent has x = 1'], answer: 0, explain: 'У каждого процесса своя копия x = 1: child → 2, parent → 0. Порядок строк решает scheduler, поэтому возможны оба.', section: 'fork', diff: 2 },
    { id: 'proc-24', type: 'code', q: 'Сколько раз будет напечатано A?', lang: 'c', code: String.raw`int main()
{
    if (fork() == 0)
        fork();
    printf("A\n");
    return 0;
}`, options: ['2', '3', '4', '1'], answer: 1, explain: 'Parent: fork() > 0 → второй fork не вызывает. Child: fork() == 0 → вызывает fork() ещё раз → child + grandchild. Итого 3 процесса.', section: 'fork', diff: 2 },
    { id: 'proc-25', type: 'code', q: 'Сколько раз будет напечатано hello?', lang: 'c', code: String.raw`int main()
{
    fork() && fork();
    printf("hello\n");
    return 0;
}`, options: ['2', '3', '4', '8'], answer: 1, explain: 'Parent: первый fork() > 0 → вычисляется второй fork() → ещё один child. Первый child: fork() == 0 → && не вычисляет правую часть. Процессов: parent + 2 children = 3.', section: 'fork', diff: 3 },
    { id: 'proc-26', type: 'code', q: 'В каком порядке появится вывод (exec успешен)?', lang: 'c', code: String.raw`pid = fork();
if (pid < 0) {
    fprintf(stderr, "Fork Failed");
    return 1;
}
else if (pid == 0) {
    execlp("/bin/ls", "ls", NULL);
}
else {
    wait(NULL);
    printf("Child Complete");
}`, options: ['Сначала список файлов от ls, затем Child Complete', 'Сначала Child Complete, затем список файлов', 'Только Child Complete', 'Список файлов печатается дважды'], answer: 0, explain: 'Child заменяется программой ls; parent блокирован в wait() до завершения child и печатает Child Complete после.', section: 'exec-wait', diff: 2 },
    { id: 'proc-27', type: 'code', q: 'Сколько раз будет напечатано after exec, если execlp выполнился успешно?', lang: 'c', code: String.raw`pid_t pid = fork();
if (pid == 0) {
    execlp("/bin/ls", "ls", NULL);
    printf("after exec\n");
} else {
    wait(NULL);
    printf("parent done\n");
}`, options: ['0', '1', '2', 'Зависит от scheduler'], answer: 0, explain: 'exec() заменяет memory space процесса программой ls; при успехе он не возвращается, и printf в child не выполняется. Parent эту ветку не проходит.', section: 'exec-wait', diff: 2 },
    { id: 'proc-28', type: 'code', q: 'Пока child спит, его убили командой kill -9 <pid child>. Какую строку напечатает parent после End of process <pid>:?', lang: 'c', code: String.raw`if (pid > 0) {
    printf("I am the parent, the child is %d.\n", pid);
    pid = wait(&status);
    printf("End of process %d: ", pid);
    if (WIFEXITED(status))
        printf("The process ended with exit(%d).\n", WEXITSTATUS(status));
    if (WIFSIGNALED(status))
        printf("The process ended with kill -%d.\n", WTERMSIG(status));
}`, options: ['The process ended with exit(9).', 'The process ended with kill -9.', 'The process ended with exit(0).', 'Ничего: wait() не вернётся'], answer: 1, explain: 'Child завершён сигналом 9 (SIGKILL): WIFEXITED ложно, WIFSIGNALED истинно, WTERMSIG = 9.', section: 'exec-wait', diff: 3 },
    { id: 'proc-29', type: 'single', q: 'Какая функция Windows API — аналог wait() в примере с CreateProcess?', options: ['CloseHandle()', 'WaitForSingleObject()', 'ZeroMemory()', 'CreateProcess()'], answer: 1, explain: 'WaitForSingleObject(pi.hProcess, INFINITE) ждёт завершения child. CloseHandle закрывает handles.', section: 'windows', diff: 1 },
    { id: 'proc-30', type: 'single', q: 'Чем CreateProcess() отличается от fork()?', options: ['CreateProcess создаёт копию parent', 'CreateProcess сразу загружает в новый процесс указанную программу', 'CreateProcess создаёт поток, а не процесс', 'CreateProcess не возвращает управление parent'], answer: 1, explain: 'fork() дублирует parent (программу меняют exec()), а CreateProcess создаёт процесс и загружает в него программу (mspaint.exe) одним вызовом.', section: 'windows', diff: 2 },
    { id: 'proc-31', type: 'single', q: 'Zombie process — это…', options: ['процесс, parent которого завершился без wait()', 'завершившийся процесс, parent которого ещё не вызвал wait()', 'процесс в состоянии waiting', 'процесс, убитый через abort()'], answer: 1, explain: 'Zombie — child уже завершился, но его статус не забран через wait(). Первый вариант — orphan.', section: 'termination', diff: 1 },
    { id: 'proc-32', type: 'single', q: 'Что происходит с orphan process?', options: ['Сразу уничтожается ОС', 'Становится zombie навсегда', 'Усыновляется (adopted) системным процессом init', 'Становится parent своих siblings'], answer: 2, explain: 'Orphan — parent завершился без wait(); такого процесса автоматически усыновляет init.', section: 'termination', diff: 1 },
    { id: 'proc-33', type: 'multi', q: 'Причины, по которым parent может завершить child через abort(): (несколько ответов)', options: ['Child превысил выделенные ресурсы', 'Задача child больше не нужна', 'Parent завершается, и ОС не позволяет child продолжать', 'Child вызвал wait()', 'Child является I/O-bound'], answer: [0, 1, 2], explain: 'Три причины со слайда. wait() и I/O-bound — не причины для abort().', section: 'termination', diff: 2 },
    { id: 'proc-34', type: 'tf', q: 'При cascading termination завершение children и grandchildren инициирует операционная система.', answer: true, explain: 'Со слайда: «The termination is initiated by the operating system».', section: 'termination', diff: 2 },
    { id: 'proc-35', type: 'single', q: 'Какие процессы Android завершает первыми при нехватке памяти?', options: ['Foreground process', 'Visible process', 'Service process', 'Empty process'], answer: 3, explain: 'Порядок важности: foreground > visible > service > background > empty; завершают с наименее важных — empty.', section: 'android-chrome', diff: 1 },
    { id: 'proc-36', type: 'single', q: 'Какой тип процесса Chrome создаётся для каждого открытого сайта и работает в sandbox?', options: ['Browser process', 'Renderer process', 'Plug-in process', 'Service process'], answer: 1, explain: 'Renderer рендерит страницы (HTML, JavaScript), создаётся на каждый сайт, ограничен в disk/network I/O. Browser управляет UI и I/O.', section: 'android-chrome', diff: 1 },
    { id: 'proc-37', type: 'multi', q: 'Причины для cooperating processes по слайдам: (несколько ответов)', options: ['Information sharing', 'Computation speedup', 'Modularity', 'Convenience', 'Memory protection'], answer: [0, 1, 2, 3], explain: 'Четыре причины: information sharing, computation speedup, modularity, convenience. Memory protection — свойство изоляции процессов.', section: 'ipc', diff: 1 },
    { id: 'proc-38', type: 'single', q: 'В IPC через shared memory коммуникация находится под контролем…', options: ['ОС, которая копирует каждое сообщение', 'пользовательских процессов, а не ОС', 'аппаратного таймера', 'long-term scheduler'], answer: 1, explain: 'После создания области процессы сами читают/пишут её; главная проблема — синхронизация их действий.', section: 'ipc', diff: 2 },
    { id: 'proc-39', type: 'code', q: 'Bounded buffer с in/out. Сколько элементов максимум может находиться в буфере одновременно?', lang: 'c', code: String.raw`#define BUFFER_SIZE 10
/* producer */
while (((in + 1) % BUFFER_SIZE) == out)
    ; /* do nothing */
buffer[in] = next_produced;
in = (in + 1) % BUFFER_SIZE;`, options: ['10', '9', '11', '1'], answer: 1, explain: 'Буфер считается полным, когда (in + 1) % N == out, т.е. один слот всегда пуст → не более N − 1 = 9.', section: 'producer-consumer', diff: 2 },
    { id: 'proc-40', type: 'single', q: 'При каком условии consumer в решении с in/out ждёт (буфер пуст)?', options: ['in == out', '(in + 1) % BUFFER_SIZE == out', 'in > out', 'out == BUFFER_SIZE'], answer: 0, explain: 'in == out — пусто; (in + 1) % N == out — полно.', section: 'producer-consumer', diff: 1 },
    { id: 'proc-41', type: 'code', q: 'counter = 5 перед этим чередованием. Чему равен counter в конце?', lang: 'text', code: `S0: producer  register1 = counter
S1: producer  register1 = register1 + 1
S2: consumer  register2 = counter
S3: consumer  register2 = register2 - 1
S4: producer  counter = register1
S5: consumer  counter = register2`, options: ['4', '5', '6', '3'], answer: 0, explain: 'register1 = 6, register2 = 4; S4 пишет 6, затем S5 перезаписывает 4. Правильное значение 5 — это race condition.', section: 'race', diff: 2 },
    { id: 'proc-42', type: 'multi', q: 'counter = 5; producer выполняет counter++, consumer — counter-- (каждое — 3 машинные инструкции), чередование произвольное. Какие итоговые значения возможны? (несколько ответов)', options: ['4', '5', '6', '7', '3'], answer: [0, 1, 2], explain: 'Без чередования — 5; если последним записывает consumer по устаревшему значению — 4, если producer — 6. 7 и 3 невозможны.', section: 'race', diff: 3 },
    { id: 'proc-43', type: 'single', q: 'Почему в первом решении producer–consumer (in/out, максимум N − 1 элементов) нет race condition?', options: ['Потому что буфер маленький', 'Каждую общую переменную изменяет только один процесс: in — producer, out — consumer', 'Потому что используется mutex', 'Потому что consumer и producer работают на одном ядре'], answer: 1, explain: 'Нет переменной, которую пишут оба процесса. В версии с counter её пишут оба — отсюда race.', section: 'race', diff: 3 },
    { id: 'proc-44', type: 'single', q: 'Если и send, и receive блокирующие, это называется…', options: ['Rendezvous', 'Busy waiting', 'Cascading', 'Mailbox sharing'], answer: 0, explain: 'Blocking send + blocking receive — rendezvous отправителя и получателя.', section: 'message-passing', diff: 1 },
    { id: 'proc-45', type: 'single', q: 'Что возвращает non-blocking receive, если сообщений нет?', options: ['Блокируется до прихода сообщения', 'Null message', 'Ошибку и завершает процесс', 'Последнее полученное сообщение'], answer: 1, explain: 'Non-blocking receive получает либо valid message, либо null.', section: 'message-passing', diff: 2 },
    { id: 'proc-46', type: 'single', q: 'Buffering с zero capacity означает, что…', options: ['отправитель никогда не ждёт', 'отправитель ждёт, только если буфер из n сообщений полон', 'отправитель должен ждать получателя (rendezvous)', 'сообщения теряются'], answer: 2, explain: 'Zero capacity — очередь отсутствует, поэтому sender ждёт receiver. Never waits — unbounded, ждёт при полном — bounded.', section: 'message-passing', diff: 2 },
    { id: 'proc-47', type: 'multi', q: 'Свойства link при direct communication: (несколько ответов)', options: ['Link устанавливается автоматически', 'Link связан ровно с одной парой процессов', 'Между парой процессов ровно один link', 'Link может быть связан со многими процессами', 'Нужен общий mailbox'], answer: [0, 1, 2], explain: 'Многие процессы на link и общий mailbox — свойства indirect communication.', section: 'message-passing', diff: 2 },
    { id: 'proc-48', type: 'single', q: 'P1, P2, P3 делят mailbox A, P1 отправляет. Какое решение «кто получит» НЕ предлагалось на слайде?', options: ['Разрешить link максимум между двумя процессами', 'Разрешить receive только одному процессу за раз', 'Система выбирает получателя произвольно (например, RR) и сообщает отправителю', 'Сообщение получают все процессы, делящие mailbox'], answer: 3, explain: 'Первые три — решения со слайда. Рассылки всем (broadcast) среди них нет.', section: 'message-passing', diff: 2 },
    { id: 'proc-49', type: 'code', q: 'Какой вызов пропущен в producer на месте /* ??? */?', lang: 'c', code: String.raw`shm_fd = shm_open(name, O_CREAT | O_RDWR, 0666);
/* ??? */
ptr = mmap(0, SIZE, PROT_WRITE, MAP_SHARED, shm_fd, 0);
sprintf(ptr, "%s", message_0);`, options: ['ftruncate(shm_fd, SIZE);', 'shm_unlink(name);', 'pipe(shm_fd);', 'wait(NULL);'], answer: 0, explain: 'После создания объект нужно сконфигурировать по размеру ftruncate(); shm_unlink вызывает consumer в конце.', section: 'posix-shm', diff: 2 },
    { id: 'proc-50', type: 'single', q: 'Что означает флаг MAP_SHARED в mmap()?', options: ['Память доступна только для чтения', 'Изменения объекта видны всем процессам, разделяющим его', 'Объект удаляется после закрытия', 'Создаётся приватная копия при записи'], answer: 1, explain: 'MAP_SHARED — изменения в shared-memory object видны всем процессам, которые его отобразили.', section: 'posix-shm', diff: 2 },
    { id: 'proc-51', type: 'single', q: 'Producer записал message_0 = "Hello" и message_1 = "World!" (ptr сдвигается на strlen). Что напечатает consumer?', options: ['Hello World!', 'HelloWorld!', 'Hello', 'World!'], answer: 1, explain: 'Строки записаны подряд без пробела, ptr сдвигается ровно на strlen(message_0).', section: 'posix-shm', diff: 2 },
    { id: 'proc-52', type: 'single', q: 'Какие два порта получает каждая task в Mach при создании?', options: ['Kernel и Notify', 'Client и Server', 'Input и Output', 'Connection и Communication'], answer: 0, explain: 'Kernel и Notify. Connection/communication ports — это Windows ALPC.', section: 'mach-alpc', diff: 2 },
    { id: 'proc-53', type: 'tf', q: 'Windows ALPC работает только между процессами на одной системе.', answer: true, explain: 'Advanced local procedure call — локальный механизм; для сети используют, например, sockets/RPC.', section: 'mach-alpc', diff: 1 },
    { id: 'proc-54', type: 'code', q: 'Parent пишет данные child через ordinary pipe. Какие вызовы должен сделать parent?', lang: 'c', code: String.raw`int fd[2];
pipe(fd);
if (fork() > 0) {      /* parent */
    close(fd[?]);
    write(fd[?], msg, strlen(msg) + 1);
}`, options: ['close(fd[0]); write(fd[1], …)', 'close(fd[1]); write(fd[0], …)', 'close(fd[0]); write(fd[0], …)', 'close(fd[1]); write(fd[1], …)'], answer: 0, explain: 'fd[0] — read end, fd[1] — write end. Пишущий закрывает ненужный read end и пишет в fd[1].', section: 'pipes', diff: 2 },
    { id: 'proc-55', type: 'code', q: 'Пользователь вводит Hello. Что напечатает parent в примере с двумя pipe?', lang: 'c', code: String.raw`char fixed_str[] = " Pippo";
/* parent: scanf("%s", input_str); write(fd1[1], ...); wait(NULL); */
/* child:  read(fd1[0], concat_str, 100); дописывает fixed_str;      */
/*         write(fd2[1], concat_str, ...);                           */
/* parent: */
read(fd2[0], concat_str, 100);
printf("Concatenated string %s\n", concat_str);`, options: ['Concatenated string Hello', 'Concatenated string Hello Pippo', 'Concatenated string  Pippo', 'Concatenated string PippoHello'], answer: 1, explain: 'Parent → child по fd1 «Hello», child дописывает " Pippo" и возвращает по fd2.', section: 'pipes', diff: 2 },
    { id: 'proc-56', type: 'multi', q: 'Что верно для named pipes? (несколько ответов)', options: ['Коммуникация bidirectional', 'Не требуется parent–child отношение', 'Несколько процессов могут использовать один named pipe', 'Доступны только в Windows', 'Строго однонаправленные'], answer: [0, 1, 2], explain: 'Named pipes есть и в UNIX, и в Windows; однонаправленные — ordinary pipes.', section: 'pipes', diff: 2 },
    { id: 'proc-57', type: 'single', q: 'Socket 161.25.19.8:1625 обозначает…', options: ['порт 161 на хосте 25.19.8.1625', 'порт 1625 на хосте 161.25.19.8', 'процесс с pid 1625 на хосте 161.25.19.8', 'хост 1625 в сети 161.25.19.8'], answer: 1, explain: 'Socket — конкатенация IP address и port: хост 161.25.19.8, порт 1625.', section: 'sockets', diff: 1 },
    { id: 'proc-58', type: 'multi', q: 'Что верно про sockets по слайдам? (несколько ответов)', options: ['Порты ниже 1024 — well known, для стандартных сервисов', '127.0.0.1 — loopback, обозначает собственную систему', 'Коммуникация идёт между парой сокетов', 'Socket — это то же самое, что pipe'], answer: [0, 1, 2], explain: 'Socket — endpoint for communication (IP + port); pipe — другой механизм IPC.', section: 'sockets', diff: 1 }
  ]
});
