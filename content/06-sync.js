OS.addModule({
  id: 'sync',
  num: 6,
  group: 'theory',
  title: 'Synchronization',
  titleRu: 'Синхронизация процессов',
  icon: '🔒',
  sources: ['6-Synchronization.pdf', 'ES4-SynchronizationExamples.pdf', 'ES7-Semaphores.pdf'],
  summary: 'Race condition, critical-section problem и 3 требования, Peterson, reordering и memory barrier, mutex/spinlock, семафоры и их реализация, мониторы и condition variables, Readers–Writers, Dining Philosophers, задача с 3 принтерами.',
  sections: [
    {
      id: 'race',
      h: 'Race Condition',
      html: `
<p><b>Race condition</b> — несколько процессов/потоков одновременно обращаются к общим данным, и результат зависит от порядка (чередования) их выполнения.</p>
<p><b>Пример со слайда — fork()</b>: процессы P<sub>0</sub> и P<sub>1</sub> одновременно создают детей через <code>fork()</code>. Ядро берёт pid из переменной ядра <code>next_available_pid</code> (следующий свободный pid).</p>
<ol>
  <li>P<sub>0</sub>: request pid → читает <code>next_available_pid = 2615</code>;</li>
  <li>P<sub>1</sub>: request pid → тоже читает 2615 (P<sub>0</sub> ещё не успел увеличить переменную);</li>
  <li>оба получают return 2615 → <code>child = 2615</code> у обоих.</li>
</ol>
<div class="callout warn">Если нет механизма, запрещающего P<sub>0</sub> и P<sub>1</sub> одновременно обращаться к <code>next_available_pid</code>, <b>один и тот же pid может быть выдан двум разным процессам</b>.</div>
<div data-viz="0"></div>
<p><b>Тот же эффект на уровне регистров</b> (пример producer/consumer из темы Processes): <code>counter++</code> и <code>counter--</code> — это по 3 машинные инструкции.</p>
<pre class="code" data-lang="text">counter++:  register1 = counter          counter--:  register2 = counter
            register1 = register1 + 1                register2 = register2 - 1
            counter   = register1                    counter   = register2

counter = 5:
S0: producer  register1 = counter        {register1 = 5}
S1: producer  register1 = register1 + 1  {register1 = 6}
S2: consumer  register2 = counter        {register2 = 5}
S3: consumer  register2 = register2 - 1  {register2 = 4}
S4: producer  counter = register1        {counter = 6}
S5: consumer  counter = register2        {counter = 4}   ← правильно было бы 5</pre>
<div data-viz="1"></div>`,
      viz: [
        { name: 'timeline', caption: 'Race на next_available_pid: оба fork() читают 2615 до обновления', props: {
          max: 14, rows: [
            { label: 'P0', segs: [{ from: 0, to: 2, label: 'fork()', tone: 'acc' }, { from: 2, to: 4, label: 'request pid', tone: 'muted' }, { from: 4, to: 8, label: 'return 2615', tone: 'warn' }, { from: 8, to: 12, label: 'child = 2615', tone: 'bad' }] },
            { label: 'P1', segs: [{ from: 1, to: 3, label: 'fork()', tone: 'acc' }, { from: 3, to: 5, label: 'request pid', tone: 'muted' }, { from: 5, to: 9, label: 'return 2615', tone: 'warn' }, { from: 9, to: 13, label: 'child = 2615', tone: 'bad' }] }],
          marks: [{ t: 4, label: 'next_available_pid = 2615' }] } },
        { name: 'race', caption: 'Пошаговое чередование counter++ / counter-- (counter = 5 → 4 или 6)', props: { start: 5 } }
      ],
      exam: 'Объяснить, почему два ребёнка могут получить один pid; какие значения counter возможны при параллельных ++/-- (4, 5, 6).'
    },
    {
      id: 'cs-problem',
      h: 'Critical-Section Problem',
      html: `
<ul>
  <li>Система из n процессов {p<sub>0</sub>, p<sub>1</sub>, … p<sub>n−1</sub>}.</li>
  <li>У каждого есть <b>critical section</b> — сегмент кода, где процесс меняет общие переменные, обновляет таблицу, пишет файл и т.п.</li>
  <li>Когда один процесс в своей critical section, <b>никакой другой</b> не может быть в своей.</li>
  <li><b>Critical-section problem</b> — спроектировать протокол, который это обеспечивает.</li>
  <li>Процесс должен <b>запросить разрешение</b> на вход в <b>entry section</b>, после critical section может идти <b>exit section</b>, затем <b>remainder section</b>.</li>
</ul>
<pre class="code" data-lang="c">/* General structure of process Pi */
while (true) {
    entry section        /* запрос на вход */
        critical section
    exit section         /* сообщить о выходе */
        remainder section
}</pre>`,
      viz: [{ name: 'flow', caption: 'Цикл процесса Pi', props: { dir: 'h', loop: true, steps: [
        { label: 'entry section', sub: 'ask permission', tone: 'acc' },
        { label: 'critical section', sub: 'общие данные', tone: 'bad' },
        { label: 'exit section', sub: 'release', tone: 'acc' },
        { label: 'remainder section', tone: 'muted' }] } }]
    },
    {
      id: 'requirements',
      h: 'Требования к решению: ME, Progress, Bounded Waiting',
      html: `
<ol>
  <li><b>Mutual Exclusion</b> — если P<sub>i</sub> выполняется в своей critical section, никакой другой процесс не может выполняться в своей critical section.</li>
  <li><b>Progress</b> — если в critical section никого нет и есть процессы, желающие войти, то выбор процесса, который войдёт следующим, <b>не может откладываться бесконечно</b> (решают только процессы, не находящиеся в remainder section).</li>
  <li><b>Bounded Waiting</b> — существует <b>граница</b> на число раз, которое другие процессы могут войти в свои critical sections после того, как процесс запросил вход и до того, как запрос удовлетворён.</li>
</ol>
<p>Допущения: каждый процесс выполняется с <b>ненулевой скоростью</b>; <b>никаких предположений об относительной скорости</b> n процессов.</p>
<table class="t">
  <tr><th>Требование</th><th>Нарушение выглядит так</th></tr>
  <tr><td>Mutual Exclusion</td><td>два процесса одновременно в CS</td></tr>
  <tr><td>Progress</td><td>CS свободна, желающие есть, но никто не входит (решение откладывается бесконечно)</td></tr>
  <tr><td>Bounded Waiting</td><td>процесс запросил вход, но его бесконечно «обгоняют» другие → <b>starvation</b></td></tr>
</table>`,
      exam: 'Дословные определения трёх требований; узнать требование по описанию нарушения.'
    },
    {
      id: 'interrupts',
      h: 'Hardware Synchronization и Interrupt-based Solution',
      html: `
<ul>
  <li>Многие системы дают <b>hardware support</b> для реализации critical section.</li>
  <li><b>Uniprocessors</b> — можно <b>disable interrupts</b>: текущий код выполняется <b>без preemption</b>.</li>
  <li>На <b>multiprocessor</b> системах это слишком неэффективно; ОС, использующие этот подход, <b>плохо масштабируются</b>.</li>
</ul>
<p><b>Interrupt-based solution</b>:</p>
<pre class="code" data-lang="text">Entry section:  disable interrupts
Exit section:   enable  interrupts</pre>
<p>Решает ли это проблему? Вопросы со слайда:</p>
<ul>
  <li><b>CS выполняется час?</b> — всё это время прерывания запрещены: таймер, I/O, другие процессы не обслуживаются.</li>
  <li><b>Starvation</b> — некоторые процессы могут никогда не войти в свою critical section.</li>
  <li><b>Два CPU?</b> — запрет прерываний действует только на своём CPU; процесс на другом CPU может войти в CS → mutual exclusion не гарантирован.</li>
</ul>`,
      exam: 'Почему disable interrupts не подходит для multiprocessor и для длинных CS.'
    },
    {
      id: 'peterson',
      h: "Peterson's Solution",
      html: `
<ul>
  <li>Решение для <b>двух процессов</b> (P<sub>i</sub> и P<sub>j</sub>, j = 1 − i).</li>
  <li>Общие переменные: <code>int turn;</code> — <b>чья очередь</b> входить в CS; <code>boolean flag[2];</code> — <code>flag[i] = true</code> означает, что P<sub>i</sub> <b>готов войти</b>.</li>
</ul>
<pre class="code" data-lang="c">/* Algorithm for Process Pi */
while (true) {
    flag[i] = true;                  /* я хочу войти          */
    turn = j;                        /* но уступаю очередь Pj */
    while (flag[j] &amp;&amp; turn == j)
        ;                            /* busy wait             */
    /* critical section */
    flag[i] = false;                 /* exit section          */
    /* remainder section */
}</pre>
<div class="callout key">P<sub>i</sub> входит в CS <b>только если</b> <code>flag[j] == false</code> <b>или</b> <code>turn == i</code>. Если оба записали turn почти одновременно, сохраняется значение, записанное <b>последним</b> → последний записавший уступил и ждёт.</div>
<p><b>Correctness</b> — доказуемо выполняются все три требования:</p>
<ol>
  <li><b>Mutual exclusion</b>: если бы оба были в CS, то <code>flag[0] == flag[1] == true</code>, значит, каждый прошёл цикл по условию <code>turn == i</code>: turn == 0 для P<sub>0</sub> и turn == 1 для P<sub>1</sub> — невозможно, turn имеет одно значение.</li>
  <li><b>Progress</b>: P<sub>i</sub> может застрять только при <code>flag[j] &amp;&amp; turn == j</code>. Если P<sub>j</sub> не хочет входить (в remainder), <code>flag[j] == false</code> → P<sub>i</sub> входит сразу. Если хотят оба — turn равен 0 или 1, один из них войдёт.</li>
  <li><b>Bounded waiting</b>: выходя, P<sub>j</sub> ставит <code>flag[j] = false</code> → P<sub>i</sub> проходит. Если P<sub>j</sub> тут же снова хочет войти, он ставит <code>turn = i</code> и сам ждёт → P<sub>i</sub> ждёт <b>не более одного</b> входа P<sub>j</sub>.</li>
</ol>`,
      viz: [{ name: 'peterson', caption: 'Пошагово: flag[], turn и кто входит в CS', props: {} }],
      exam: 'Написать код Peterson; условие входа (flag[j]==false или turn==i); доказать 3 требования.'
    },
    {
      id: 'reorder',
      h: "Peterson's Solution и Modern Architecture",
      html: `
<ul>
  <li>Peterson полезен для демонстрации алгоритма, но <b>не гарантированно работает на современных архитектурах</b>.</li>
  <li>Для производительности процессоры и/или компиляторы могут <b>переупорядочивать (reorder)</b> операции, не имеющие зависимостей.</li>
  <li>Для <b>single-threaded</b> — ок: результат всегда тот же. Для <b>multithreaded</b> reordering может дать несогласованный/неожиданный результат.</li>
</ul>
<p><b>Modern Architecture Example</b>: два потока разделяют <code>boolean flag = false; int x = 0;</code></p>
<div class="cols">
<pre class="code" data-lang="c">/* Thread 1 */
while (!flag)
    ;
print x;</pre>
<pre class="code" data-lang="c">/* Thread 2 */
x = 100;
flag = true;</pre>
</div>
<p>Ожидаемый вывод — <b>100</b>. Но flag и x независимы, поэтому инструкции Thread 2 могут быть переставлены: <code>flag = true; x = 100;</code> → вывод может быть <b>0</b>.</p>
<p><b>Peterson's Solution Revisited</b> — эффект reordering:</p>
<ol>
  <li>P<sub>0</sub>: <code>turn = 1</code> (запись <code>flag[0] = true</code> переставлена на потом, flag[0] пока false);</li>
  <li>P<sub>1</sub>: <code>turn = 0, flag[1] = true</code>; проверяет <code>flag[0]</code> → false → <b>входит в CS</b>;</li>
  <li>P<sub>0</sub>: <code>flag[0] = true</code>; проверяет <code>flag[1] &amp;&amp; turn == 1</code> → turn == 0 → <b>входит в CS</b>.</li>
</ol>
<div class="callout warn">Оба процесса в critical section одновременно — mutual exclusion нарушен.</div>
<div data-viz="0"></div>
<p><b>Memory barrier (memory fence)</b> — инструкция, запрещающая переупорядочивание: все операции с памятью до барьера завершаются (видны другим CPU) до операций после него.</p>
<pre class="code" data-lang="c">/* Thread 2 */
x = 100;
memory_barrier();   /* x гарантированно записан раньше flag */
flag = true;</pre>`,
      viz: [{ name: 'timeline', caption: 'Слайд «Peterson\'s Solution Revisited»: оба в CS', props: {
        max: 12, rows: [
          { label: 'process 0', segs: [{ from: 0, to: 2, label: 'turn = 1', tone: 'acc' }, { from: 6, to: 8, label: 'flag[0] = true', tone: 'warn' }, { from: 8, to: 12, label: 'CS', tone: 'bad' }] },
          { label: 'process 1', segs: [{ from: 2, to: 5, label: 'turn = 0, flag[1] = true', tone: 'acc' }, { from: 5, to: 12, label: 'CS', tone: 'bad' }] }] } }],
      exam: 'Почему Peterson ломается на современных CPU; пример flag/x (100 или 0); что делает memory barrier.'
    },
    {
      id: 'mutex',
      h: 'Mutex Locks и Spinlock',
      html: `
<ul>
  <li>Разработчики ОС строят программные инструменты для critical-section problem; простейший — <b>mutex lock</b> (mutual exclusion).</li>
  <li>Булева переменная <code>available</code> — свободен ли lock.</li>
  <li>CS защищается так: сначала <code>acquire()</code> lock, затем <code>release()</code>.</li>
  <li>Вызовы <code>acquire()</code> и <code>release()</code> должны быть <b>atomic</b> — выполняться без вмешательства другого процесса посередине. Обычно реализуются через <b>hardware atomic instructions</b>.</li>
  <li>Решение требует <b>busy waiting</b> → такой lock называется <b>spinlock</b>.</li>
</ul>
<div class="cols">
<pre class="code" data-lang="c">while (true) {
    acquire lock
        critical section
    release lock
        remainder section
}</pre>
<pre class="code" data-lang="c">acquire() {
    while (!available)
        ;   /* busy wait */
    available = false;
}
release() {
    available = true;
}</pre>
</div>
<div class="callout note"><b>Busy waiting</b>: ожидающий процесс крутится в цикле и тратит CPU. Если <code>acquire()</code> не атомарен, два потока могут одновременно увидеть <code>available == true</code> и оба войти в CS.</div>`,
      exam: 'Что такое spinlock и busy waiting; почему acquire/release должны быть atomic.'
    },
    {
      id: 'semaphore',
      h: 'Semaphore: wait / signal, binary vs counting, usage',
      html: `
<ul>
  <li><b>Semaphore</b> — инструмент синхронизации, более гибкий, чем mutex lock.</li>
  <li>Semaphore <b>S</b> — целая переменная, доступ только через две <b>indivisible (atomic)</b> операции: <code>wait()</code> и <code>signal()</code>.</li>
</ul>
<pre class="code" data-lang="c">wait(S) {
    while (S &lt;= 0)
        ;   /* busy wait */
    S--;
}

signal(S) {
    S++;
}</pre>
<div class="callout warn">На слайде напечатано <code>while (S &lt; 0)</code>; в классическом определении (Silberschatz) — <code>S &lt;= 0</code>: при S == 0 ресурс занят и процесс должен ждать.</div>
<table class="t">
  <tr><th>Тип</th><th>Значения</th><th>Использование</th></tr>
  <tr><td><b>Binary semaphore</b></td><td>только 0 и 1</td><td>то же, что <b>mutex lock</b></td></tr>
  <tr><td><b>Counting semaphore</b></td><td>неограниченный диапазон</td><td>N экземпляров ресурса (init = N)</td></tr>
</table>
<p><b>Usage 1 — Critical Section</b>: семафор <code>mutex</code>, инициализирован <b>1</b>.</p>
<pre class="code" data-lang="c">wait(mutex);
    /* CS */
signal(mutex);</pre>
<p><b>Usage 2 — порядок</b>: P1 выполняет S1, P2 — S2, требуется <b>S1 раньше S2</b>. Семафор <code>synch</code>, инициализирован <b>0</b>.</p>
<div class="cols">
<pre class="code" data-lang="c">/* P1 */
S1;
signal(synch);</pre>
<pre class="code" data-lang="c">/* P2 */
wait(synch);
S2;</pre>
</div>
<div class="callout key">synch = 0 → если P2 придёт первым, он заблокируется на <code>wait(synch)</code>, пока P1 не выполнит S1 и <code>signal(synch)</code>.</div>`,
      exam: 'Определения wait/signal; binary vs counting; начальные значения: 1 для CS, 0 для упорядочивания.'
    },
    {
      id: 'sem-impl',
      h: 'Semaphore Implementation (без busy waiting)',
      html: `
<ul>
  <li>Нельзя допустить, чтобы два процесса одновременно выполняли <code>wait()</code> и <code>signal()</code> на одном семафоре → реализация сама становится <b>critical-section problem</b> (код wait/signal помещается в CS).</li>
  <li>В этой CS может быть busy waiting, но код реализации <b>короткий</b> → мало busy waiting, если CS редко занята.</li>
  <li>Но приложения могут проводить в critical sections много времени → busy waiting — <b>плохое решение</b>.</li>
</ul>
<p><b>Без busy waiting</b>: у каждого семафора — <b>waiting queue</b>. Запись: <b>value</b> (integer) и <b>указатель</b> на следующую запись в списке.</p>
<pre class="code" data-lang="c">typedef struct {
    int value;
    struct process *list;
} semaphore;

wait(semaphore *S) {
    S-&gt;value--;
    if (S-&gt;value &lt; 0) {
        add this process to S-&gt;list;
        block();
    }
}

signal(semaphore *S) {
    S-&gt;value++;
    if (S-&gt;value &lt;= 0) {
        remove a process P from S-&gt;list;
        wakeup(P);
    }
}</pre>
<ul>
  <li><b>block</b> — поместить вызвавший процесс в соответствующую waiting queue (процесс не тратит CPU).</li>
  <li><b>wakeup(P)</b> — удалить один процесс из waiting queue и поместить его в <b>ready queue</b>.</li>
</ul>
<div class="callout key">Значение может стать <b>отрицательным</b>: если <code>value = −k</code>, то <b>k процессов ждут</b> в <code>S-&gt;list</code>.</div>`,
      viz: [{ name: 'stepper', caption: 'S->value = 1; P1, P2, P3 вызывают wait(), затем по очереди signal()', props: {
        lang: 'c',
        code: ['wait(semaphore *S) {', '    S->value--;', '    if (S->value < 0) {', '        add this process to S->list;', '        block();', '    }', '}', 'signal(semaphore *S) {', '    S->value++;', '    if (S->value <= 0) {', '        remove a process P from S->list;', '        wakeup(P);', '    }', '}'].join('\n'),
        steps: [
          { line: 2, note: 'P1: wait(S). value 1 → 0, не < 0 → P1 входит в CS.', vars: { value: 0, list: '[]', CS: 'P1' } },
          { line: [2, 3, 4, 5], note: 'P2: wait(S). value 0 → −1 < 0 → P2 в S->list, block().', vars: { value: -1, list: '[P2]', CS: 'P1' } },
          { line: [2, 3, 4, 5], note: 'P3: wait(S). value → −2 → P3 тоже заблокирован. |value| = 2 ждущих.', vars: { value: -2, list: '[P2, P3]', CS: 'P1' } },
          { line: [9, 10, 11, 12], note: 'P1: signal(S). value → −1 ≤ 0 → wakeup(P2): P2 в ready queue, затем в CS.', vars: { value: -1, list: '[P3]', CS: 'P2' } },
          { line: [9, 10, 11, 12], note: 'P2: signal(S). value → 0 ≤ 0 → wakeup(P3).', vars: { value: 0, list: '[]', CS: 'P3' } },
          { line: [9, 10], note: 'P3: signal(S). value → 1 > 0 → будить некого.', vars: { value: 1, list: '[]', CS: '—' } }
        ] } }],
      exam: 'Код wait/signal со списком; смысл отрицательного value; block vs wakeup; трассировка значения семафора.'
    },
    {
      id: 'sem-problems',
      h: 'Problems with Semaphores — неправильное использование',
      html: `
<table class="t">
  <tr><th>Ошибка</th><th>Последствие</th></tr>
  <tr><td><code>signal(mutex)</code> … CS … <code>wait(mutex)</code></td><td>порядок перепутан → несколько процессов одновременно в CS (<b>mutual exclusion нарушен</b>)</td></tr>
  <tr><td><code>wait(mutex)</code> … CS … <code>wait(mutex)</code></td><td>второй wait блокирует процесс навсегда (<b>deadlock</b>)</td></tr>
  <tr><td>пропущен <code>wait(mutex)</code></td><td>mutual exclusion нарушен</td></tr>
  <tr><td>пропущен <code>signal(mutex)</code></td><td>остальные процессы навсегда заблокированы</td></tr>
</table>
<p>Такие ошибки (и другие) возникают, когда семафоры и другие инструменты синхронизации используются неправильно; их трудно обнаружить, т.к. проявляются только при определённом чередовании. Отсюда — высокоуровневая абстракция <b>monitor</b>.</p>`,
      exam: 'По фрагменту кода определить: нарушение mutual exclusion или deadlock.'
    },
    {
      id: 'monitors',
      h: 'Monitors',
      html: `
<ul>
  <li><b>Monitor</b> — высокоуровневая абстракция, удобный и эффективный механизм синхронизации процессов.</li>
  <li><b>Abstract Data Type (ADT)</b>: внутренние переменные доступны только коду внутри процедур монитора.</li>
  <li><b>Только один процесс может быть активен внутри монитора в каждый момент.</b> Остальные ждут в <b>entry queue</b>.</li>
</ul>
<pre class="code" data-lang="c">monitor monitor-name
{
    /* shared variable declarations */
    procedure P1 (...) { ... }
    procedure P2 (...) { ... }
    procedure Pn (...) { ... }
    initialization code (...) { ... }
}</pre>
<div data-viz="0"></div>
<p><b>Monitor Implementation Using Semaphores</b>:</p>
<div class="cols">
<pre class="code" data-lang="c">/* Variables */
semaphore mutex;
mutex = 1;</pre>
<pre class="code" data-lang="c">/* Each procedure P is replaced by */
wait(mutex);
    ...
    body of P;
    ...
signal(mutex);</pre>
</div>
<div class="callout key">Так обеспечивается <b>mutual exclusion внутри монитора</b>.</div>`,
      viz: [{ name: 'layers', caption: 'Schematic view of a Monitor', props: { top: 'entry queue → процессы ждут входа', layers: [
        { label: 'shared data', tone: 'acc' },
        { label: 'operations: P1, P2, …, Pn', tone: 'c2' },
        { label: 'initialization code', tone: 'muted' }] } }],
      exam: 'Сколько процессов активно в мониторе (один); как реализовать монитор через семафор mutex = 1.'
    },
    {
      id: 'condvars',
      h: 'Condition Variables, signal-and-wait vs signal-and-continue',
      html: `
<ul>
  <li>Больше возможностей синхронизации в мониторах дают <b>condition variables</b>: позволяют потоку/процессу ждать, пока не наступит событие или условие.</li>
  <li><code>condition x;</code> — явная <b>очередь</b>, в которую потоки ставят себя, когда условие не выполнено (<b>waiting on the condition</b>); когда условие меняется, система будит ждущих (<b>signaling on the condition</b>).</li>
  <li><code>x.wait()</code> — вызвавший процесс <b>приостанавливается</b> до <code>x.signal()</code>.</li>
  <li><code>x.signal()</code> — возобновляет <b>один</b> из процессов (если есть), вызвавших <code>x.wait()</code>. <b>Если x.wait() никто не вызывал — нет эффекта.</b></li>
</ul>
<table class="t">
  <tr><th></th><th>signal() семафора</th><th>x.signal() condition variable</th></tr>
  <tr><td>никто не ждёт</td><td>S++ — «запоминается»</td><td>ничего не происходит — сигнал теряется</td></tr>
</table>
<div data-viz="0"></div>
<p><b>Usage example</b>: P1 и P2 выполняют S1 и S2, нужно <b>S1 раньше S2</b>. Монитор с процедурами F1 (вызывает P1) и F2 (вызывает P2), condition variable <code>x</code> (на слайде «initialized to 0» — очередь пуста), булева <code>done</code>.</p>
<div class="cols">
<pre class="code" data-lang="c">F1:
    S1;
    done = true;
    x.signal();</pre>
<pre class="code" data-lang="c">F2:
    if (done == false)
        x.wait();
    S2;</pre>
</div>
<p><code>done</code> нужен, потому что если F1 выполнится раньше, <code>x.signal()</code> пропадёт и P2 ждал бы вечно.</p>
<div class="callout warn">После <code>x.signal()</code>: P1 «отпускает семафор» и продолжает, P2 просыпается и тоже выполняется → <b>оба процесса активны в мониторе!</b></div>
<table class="t">
  <tr><th>Решение</th><th>Кто ждёт</th></tr>
  <tr><td><b>signal-and-wait</b></td><td>P1 (сигналящий) ждёт, пока P2 покинет монитор (или начнёт ждать на другой condition variable)</td></tr>
  <tr><td><b>signal-and-continue</b></td><td>P2 (разбуженный) ждёт, пока P1 покинет монитор (или начнёт ждать на другой condition variable)</td></tr>
</table>
<div data-viz="1"></div>`,
      viz: [
        { name: 'layers', caption: 'Monitor with Condition Variables', props: { top: 'entry queue → ждут входа в монитор', layers: [
          { label: 'shared data', tone: 'acc' },
          { label: 'queues associated with x, y conditions', sub: 'x → [P] [P] [P],  y → [P] [P]', tone: 'warn' },
          { label: 'operations', tone: 'c2' },
          { label: 'initialization code', tone: 'muted' }] } },
        { name: 'stepper', caption: 'Трассировка F1/F2 с signal-and-wait (P2 пришёл первым)', props: {
          lang: 'c',
          code: ['monitor M {', '  condition x;  boolean done = false;', '  F1() {              /* P1 */', '    S1;', '    done = true;', '    x.signal();', '  }', '  F2() {              /* P2 */', '    if (done == false)', '      x.wait();', '    S2;', '  }', '}'].join('\n'),
          steps: [
            { line: 9, note: 'P2 входит в монитор (F2): done == false.', vars: { done: 'false', inMonitor: 'P2', 'x queue': '[]' } },
            { line: 10, note: 'P2: x.wait() → приостановлен в очереди x, монитор освобождён.', vars: { done: 'false', inMonitor: '—', 'x queue': '[P2]' } },
            { line: 4, note: 'P1 входит в монитор (F1) и выполняет S1.', vars: { done: 'false', inMonitor: 'P1', 'x queue': '[P2]' } },
            { line: 5, note: 'done = true.', vars: { done: 'true', inMonitor: 'P1', 'x queue': '[P2]' } },
            { line: 6, note: 'x.signal(): P2 возобновлён. signal-and-wait → P1 приостанавливается, в мониторе только P2.', vars: { done: 'true', inMonitor: 'P2', suspended: 'P1' } },
            { line: 11, note: 'P2 выполняет S2 (после S1 ✔) и выходит из монитора.', vars: { done: 'true', inMonitor: '—', suspended: 'P1' } },
            { line: 7, note: 'P1 продолжает после x.signal() и выходит. Если бы P1 пришёл первым, x.signal() не имел бы эффекта, а P2 увидел бы done == true и не ждал.', vars: { done: 'true', inMonitor: '—' } }
          ] } }
      ],
      exam: 'Операции x.wait()/x.signal(); отличие от семафора; почему «оба активны в мониторе» и чем signal-and-wait отличается от signal-and-continue.'
    },
    {
      id: 'sw-impl',
      h: 'Signal-and-wait через семафоры',
      html: `
<p><b>Семафоры в мониторе</b>:</p>
<pre class="code" data-lang="c">semaphore mutex;      /* = 1: только один процесс в мониторе                       */
semaphore next;       /* = 0: на нём ждут процессы, выполнившие signal,             */
                      /*      пока разбуженный процесс не покинет монитор          */
int next_count = 0;   /* число процессов, приостановленных внутри монитора (на next) */</pre>
<p>Каждая функция <b>P</b> заменяется на:</p>
<pre class="code" data-lang="c">wait(mutex);
    body of P;
if (next_count &gt; 0)
    signal(next);     /* монитор передаётся приостановленному сигналящему */
else
    signal(mutex);    /* иначе — впускаем новый процесс                    */</pre>
<p>Для <b>каждой condition variable x</b>:</p>
<pre class="code" data-lang="c">semaphore x_sem;      /* initially = 0 */
int x_count = 0;      /* сколько процессов ждут на x */</pre>
<div class="cols">
<pre class="code" data-lang="c">/* x.wait() */
x_count++;
if (next_count &gt; 0)
    signal(next);
else
    signal(mutex);
wait(x_sem);
x_count--;</pre>
<pre class="code" data-lang="c">/* x.signal() */
if (x_count &gt; 0) {
    next_count++;
    signal(x_sem);
    wait(next);
    next_count--;
}</pre>
</div>
<ul>
  <li><code>x.wait()</code>: отдаёт монитор (сначала приостановленным на next, иначе новым через mutex) и блокируется на <code>x_sem</code>.</li>
  <li><code>x.signal()</code>: действует <b>только если кто-то ждёт</b> (<code>x_count &gt; 0</code>); будит ждущего и сам блокируется на <code>next</code> — это и есть <b>signal-and-wait</b>.</li>
</ul>`,
      exam: 'Роль mutex, next, next_count, x_sem, x_count; почему при выходе проверяется next_count.'
    },
    {
      id: 'rw',
      h: 'Readers–Writers Problem',
      html: `
<ul>
  <li>Классическая задача: доступ нескольких потоков/процессов к общим данным (<b>data set</b>).</li>
  <li><b>Readers</b> — только читают; несколько readers могут читать <b>одновременно</b>.</li>
  <li><b>Writers</b> — изменяют данные; в каждый момент доступ только у <b>одного</b> writer (целостность данных).</li>
  <li>Пример: многие пользователи БД одновременно читают, но кто-то в любой момент может обновлять данные.</li>
</ul>
<p><b>Требования схемы</b>: <b>Multiple Readers</b> — читать могут многие одновременно, если никто не пишет; <b>Exclusion for Writers</b> — если writer пишет, никакой другой reader или writer не имеет доступа.</p>
<table class="t">
  <tr><th>Вариант</th><th>Приоритет</th></tr>
  <tr><td><b>“First reader-writer” problem</b></td><td><b>readers</b>: пока readers читают, writers ждут; writer получает доступ, только когда никто не читает</td></tr>
  <tr><td><b>“Second reader-writer” problem</b></td><td><b>writers</b>: пришедший writer выполняет операцию как можно раньше, даже если сейчас есть readers</td></tr>
</table>
<p><b>Решение first readers–writers на семафорах</b> (<code>wait()</code> уменьшает, <code>signal()</code> увеличивает значение). Shared data:</p>
<ul>
  <li>Data set;</li>
  <li><code>semaphore rw_mutex = 1;</code> — взаимное исключение writers (и «первого/последнего» reader);</li>
  <li><code>semaphore mutex = 1;</code> — защищает <code>read_count</code>;</li>
  <li><code>int read_count = 0;</code> — сколько readers читают сейчас.</li>
</ul>
<div class="cols">
<pre class="code" data-lang="c">/* writer */
while (true) {
    wait(rw_mutex);
    /* writing is performed */
    signal(rw_mutex);
}</pre>
<pre class="code" data-lang="c">/* reader */
while (true) {
    wait(mutex);
    read_count++;
    if (read_count == 1)   /* first reader */
        wait(rw_mutex);
    signal(mutex);
    /* reading is performed */
    wait(mutex);
    read_count--;
    if (read_count == 0)   /* last reader */
        signal(rw_mutex);
    signal(mutex);
}</pre>
</div>
<div class="callout warn"><b>Variations / starvation</b>: решение может привести к тому, что <b>writer никогда не запишет</b>: Reader A вошёл, writer сделал <code>sem_wait</code> и заблокирован, приходит Reader B, A уходит и снова входит, B уходит… — <code>read_count</code> никогда не падает до 0. И first, и second варианты могут давать starvation (во втором голодают readers) → появляются новые вариации.</div>
<div data-viz="0"></div>`,
      viz: [{ name: 'stepper', caption: 'R1 и R2 читают одновременно, W ждёт последнего reader', props: {
        lang: 'c',
        code: ['/* writer */', 'wait(rw_mutex);', '/* writing is performed */', 'signal(rw_mutex);', '', '/* reader */', 'wait(mutex);', 'read_count++;', 'if (read_count == 1)', '    wait(rw_mutex);', 'signal(mutex);', '/* reading is performed */', 'wait(mutex);', 'read_count--;', 'if (read_count == 0)', '    signal(rw_mutex);', 'signal(mutex);'].join('\n'),
        steps: [
          { line: [7, 8], note: 'R1: wait(mutex), read_count = 1.', vars: { read_count: 1, mutex: 0, rw_mutex: 1, reading: '—' } },
          { line: [9, 10, 11], note: 'R1 — first reader: wait(rw_mutex) → writers заблокированы. signal(mutex).', vars: { read_count: 1, mutex: 1, rw_mutex: 0, reading: 'R1' } },
          { line: 2, note: 'W: wait(rw_mutex) → rw_mutex занят → W блокируется.', vars: { read_count: 1, mutex: 1, rw_mutex: 0, reading: 'R1', blocked: 'W' } },
          { line: [7, 8, 9, 11], note: 'R2: read_count = 2, не первый → rw_mutex не трогает, сразу читает вместе с R1.', vars: { read_count: 2, mutex: 1, rw_mutex: 0, reading: 'R1, R2', blocked: 'W' } },
          { line: [13, 14, 15, 17], note: 'R1 закончил: read_count = 1, не последний → rw_mutex не освобождает.', vars: { read_count: 1, mutex: 1, rw_mutex: 0, reading: 'R2', blocked: 'W' } },
          { line: [13, 14, 15, 16, 17], note: 'R2 — last reader: read_count = 0 → signal(rw_mutex) → W разбужен.', vars: { read_count: 0, mutex: 1, rw_mutex: 0, reading: '—', writing: 'W' } },
          { line: [3, 4], note: 'W пишет в одиночку, затем signal(rw_mutex). Если бы readers приходили непрерывно, W ждал бы вечно (starvation).', vars: { read_count: 0, mutex: 1, rw_mutex: 1 } }
        ] } }],
      exam: 'Полный код reader/writer; роли rw_mutex, mutex, read_count; почему writer может голодать.'
    },
    {
      id: 'philosophers',
      h: 'Dining-Philosophers Problem (semaphores)',
      html: `
<ul>
  <li>N философов за круглым столом, в центре — миска риса; они чередуют <b>thinking</b> и <b>eating</b>, с соседями не взаимодействуют.</li>
  <li>Чтобы есть, нужны <b>обе</b> соседние палочки (chopsticks); берутся <b>по одной</b>; после еды освобождаются обе.</li>
  <li>Палочку может взять любой из двух соседей, но не оба сразу.</li>
  <li>Для 5 философов shared data: <b>bowl of rice</b> (data set), <code>semaphore chopstick[5]</code>, все инициализированы <b>1</b>.</li>
</ul>
<pre class="code" data-lang="c">/* The structure of Philosopher i */
while (true) {
    wait(chopstick[i]);              /* left  */
    wait(chopstick[(i + 1) % 5]);    /* right */
    /* eat for awhile */
    signal(chopstick[i]);
    signal(chopstick[(i + 1) % 5]);
    /* think for awhile */
}</pre>
<div data-viz="0"></div>
<div class="callout warn"><b>Deadlock</b> — самая серьёзная проблема: все философы одновременно садятся и берут <b>левую</b> палочку → все палочки заняты, никто не может взять правую → <b>circular waiting</b> (каждый ждёт правую палочку, которую держит правый сосед).</div>
<div class="callout note"><b>Starvation</b>: два «быстрых» философа на противоположных местах успевают снова взять палочки и поесть до того, как соседи их захватят → остальные трое не едят никогда. Это <b>не deadlock</b>: нет circular waiting, у каждого формально есть шанс поесть.</div>
<p><b>Способы избежать deadlock</b>:</p>
<ul>
  <li>за столом одновременно <b>не более 4</b> философов;</li>
  <li>брать палочки, <b>только если свободны обе</b> (взятие — внутри critical section) → monitor solution;</li>
  <li><b>asymmetric</b>: нечётный философ берёт сначала левую, затем правую, чётный — сначала правую, затем левую.</li>
</ul>
<div data-viz="1"></div>`,
      viz: [
        { name: 'flow', caption: 'Цикл философа', props: { dir: 'h', loop: true, steps: [
          { label: 'Think', tone: 'muted' }, { label: 'Lock left chop', tone: 'acc' }, { label: 'Lock right chop', tone: 'acc' },
          { label: 'Eat', tone: 'ok' }, { label: 'Unlock left', tone: 'c2' }, { label: 'Unlock right', tone: 'c2' }] } },
        { name: 'philosophers', caption: 'Попробуй: все берут левую палочку → deadlock', props: { n: 5 } }
      ],
      exam: 'Почему решение на семафорах даёт deadlock (circular wait); отличие starvation от deadlock; способы избежать.'
    },
    {
      id: 'philo-monitor',
      h: 'Monitor Solution to Dining Philosophers',
      html: `
<ul>
  <li>Ограничение: философ берёт палочки, <b>только если свободны обе</b>.</li>
  <li>Три состояния: <b>THINKING</b> — палочки не нужны; <b>HUNGRY</b> — хочет войти в critical section; <b>EATING</b> — взял обе палочки.</li>
  <li>Философ i может установить <code>state[i] = EATING</code>, только если оба соседа не едят: <code>(state[(i+4)%5] != EATING) &amp;&amp; (state[(i+1)%5] != EATING)</code>.</li>
  <li><code>condition self[5];</code> — философ i откладывает себя (wait), когда голоден, но не может получить палочки.</li>
  <li>Распределением палочек управляет монитор <b>DiningPhilosophers</b>: перед едой — <code>pickup()</code>, после — <code>putdown()</code>.</li>
</ul>
<pre class="code" data-lang="c">DiningPhilosophers.pickup(i);
    ...
    eat
    ...
DiningPhilosophers.putdown(i);</pre>
<pre class="code" data-lang="c">monitor DiningPhilosophers
{
    enum {THINKING, HUNGRY, EATING} state[5];
    condition self[5];

    void pickup(int i) {
        state[i] = HUNGRY;
        test(i);
        if (state[i] != EATING) self[i].wait();
    }

    void putdown(int i) {
        state[i] = THINKING;
        /* test left and right neighbors */
        test((i + 4) % 5);
        test((i + 1) % 5);
    }

    void test(int i) {
        if ((state[(i + 4) % 5] != EATING) &amp;&amp;
            (state[i] == HUNGRY) &amp;&amp;
            (state[(i + 1) % 5] != EATING)) {
            state[i] = EATING;
            self[i].signal();
        }
    }

    initialization_code() {
        for (int i = 0; i &lt; 5; i++)
            state[i] = THINKING;
    }
}</pre>
<div class="callout key"><b>No deadlock</b> (палочки берутся только парой), <b>но starvation всё ещё возможен</b> (соседи могут поочерёдно есть так, что один философ никогда не получит обе палочки).</div>`,
      viz: [{ name: 'stepper', caption: 'P1 ест, P2 голоден и ждёт; putdown(1) будит P2', props: {
        lang: 'c',
        code: ['monitor DiningPhilosophers {', '  enum {THINKING, HUNGRY, EATING} state[5];', '  condition self[5];', '  void pickup(int i) {', '    state[i] = HUNGRY;', '    test(i);', '    if (state[i] != EATING) self[i].wait();', '  }', '  void putdown(int i) {', '    state[i] = THINKING;', '    test((i + 4) % 5);', '    test((i + 1) % 5);', '  }', '  void test(int i) {', '    if ((state[(i + 4) % 5] != EATING) &&', '        (state[i] == HUNGRY) &&', '        (state[(i + 1) % 5] != EATING)) {', '      state[i] = EATING;', '      self[i].signal();', '    }', '  }', '  initialization_code() {', '    for (int i = 0; i < 5; i++)', '      state[i] = THINKING;', '  }', '}'].join('\n'),
        steps: [
          { line: [23, 24], note: 'Инициализация: все THINKING.', vars: { state: 'T T T T T' } },
          { line: 5, note: 'P1: pickup(1) → state[1] = HUNGRY.', vars: { state: 'T H T T T' } },
          { line: [15, 16, 17, 18, 19], note: 'test(1): state[0] ≠ E, state[1] = H, state[2] ≠ E → EATING; self[1].signal() — никто не ждёт, без эффекта.', vars: { state: 'T E T T T' } },
          { line: 7, note: 'state[1] == EATING → не ждёт, P1 ест.', vars: { state: 'T E T T T', eating: 'P1' } },
          { line: [5, 6], note: 'P2: pickup(2) → HUNGRY; test(2): левый сосед state[1] == EATING → условие ложно.', vars: { state: 'T E H T T', eating: 'P1' } },
          { line: 7, note: 'state[2] ≠ EATING → self[2].wait(): P2 приостановлен.', vars: { state: 'T E H T T', eating: 'P1', waiting: 'P2 on self[2]' } },
          { line: [10, 11], note: 'P1: putdown(1) → THINKING; test(0): state[0] не HUNGRY → ничего.', vars: { state: 'T T H T T', waiting: 'P2 on self[2]' } },
          { line: [12, 15, 16, 17, 18, 19], note: 'test(2): соседи 1 и 3 не едят, state[2] = H → EATING, self[2].signal() → P2 возобновляется и ест.', vars: { state: 'T T E T T', eating: 'P2' } }
        ] } }],
      exam: 'Полный код монитора; условие test(i); индексы соседей (i+4)%5 и (i+1)%5; no deadlock, но starvation возможен.'
    },
    {
      id: 'printers',
      h: 'Exercise: 3 принтера (ES7 — Managing Shared Resources with Semaphores)',
      html: `
<p><b>Scenario</b>: в компьютерном классе <b>3 принтера</b>, их делят много процессов. Каждый процесс: запрашивает принтер → печатает (критическая операция) → освобождает принтер. Требования:</p>
<ul>
  <li><b>не более 3</b> процессов используют принтеры одновременно;</li>
  <li><b>два процесса не используют один и тот же принтер</b> одновременно.</li>
</ul>
<p><b>Step 1 — define the semaphores</b>:</p>
<table class="t">
  <tr><th>Семафор</th><th>Тип</th><th>Init</th><th>Назначение</th></tr>
  <tr><td><code>printers</code></td><td><b>counting</b></td><td><b>3</b></td><td>сколько принтеров свободно (макс. 3 печатают одновременно)</td></tr>
  <tr><td><code>mutex</code></td><td><b>binary</b></td><td><b>1</b></td><td>защищает общую структуру (список свободных принтеров) от race condition</td></tr>
</table>
<p>Нужно <b>2</b> семафора; используются <b>оба типа</b>.</p>
<pre class="code" data-lang="c">/* Global initialization */
semaphore printers = 3;   /* 3 printers available */
semaphore mutex = 1;      /* protects the shared data structure */

User_Process() {
    /* 1. Request a free printer */
    wait(printers);                    /* decrement; if 0, wait */
    /* 2. Safely select a free printer */
    wait(mutex);                       /* enter CS (printer list) */
    printer_id = find_free_printer();
    mark_occupied(printer_id);
    signal(mutex);                     /* exit CS */
    /* 3. Use the printer (actual critical section) */
    print_document(printer_id);
    /* 4. Release the printer */
    wait(mutex);
    mark_free(printer_id);
    signal(mutex);
    signal(printers);                  /* a printer becomes free */
}</pre>
<p><b>Result</b>:</p>
<ul>
  <li><b>printers</b> (counting): каждый процесс вызывает <code>wait(printers)</code>; если все заняты (<code>printers == 0</code>) — процесс <b>блокируется</b>; <code>signal(printers)</code> будит одного из ждущих.</li>
  <li><b>mutex</b> (binary): защищает массив флагов свободных принтеров. Без него два процесса могут одновременно увидеть один принтер свободным, оба пометить его занятым и <b>печатать на одном принтере</b> (race condition).</li>
</ul>
<p><b>Реализация на C</b> (POSIX <code>sem_t</code>, 6 потоков) — ключевые части:</p>
<pre class="code" data-lang="c">#define N_PRINTERS 3
sem_t printers;                       /* counting: free printers */
sem_t mutex;                          /* binary: protects shared data */
int printer_free[N_PRINTERS] = {1, 1, 1};   /* 1 = free, 0 = busy */

int find_free_printer() {             /* вызывается под mutex */
    for (int i = 0; i &lt; N_PRINTERS; i++) {
        if (printer_free[i] == 1) {
            printer_free[i] = 0;
            return i;
        }
    }
    return -1;   /* never happens: semaphore ensures availability */
}

void release_printer(int id) {        /* тоже под mutex */
    printer_free[id] = 1;
}

void *process(void *arg) {
    int process_id = (int)(long)arg;
    sem_wait(&amp;printers);              /* blocks if all printers busy */
    sem_wait(&amp;mutex);
    int printer_id = find_free_printer();
    printf("Process %d is using printer %d\\n", process_id, printer_id);
    sem_post(&amp;mutex);
    sleep(1);                         /* simulate printing */
    sem_wait(&amp;mutex);
    release_printer(printer_id);
    printf("Process %d released printer %d\\n", process_id, printer_id);
    sem_post(&amp;mutex);
    sem_post(&amp;printers);              /* one more printer available */
    return NULL;
}

int main() {
    pthread_t threads[6];
    sem_init(&amp;printers, 0, N_PRINTERS);   /* 3 printers available */
    sem_init(&amp;mutex, 0, 1);
    for (long i = 0; i &lt; 6; i++)
        pthread_create(&amp;threads[i], NULL, process, (void *)i);
    for (int i = 0; i &lt; 6; i++)
        pthread_join(threads[i], NULL);
    sem_destroy(&amp;printers);
    sem_destroy(&amp;mutex);
    return 0;
}</pre>
<div class="callout note">POSIX: <code>sem_wait</code> = wait(), <code>sem_post</code> = signal(), <code>sem_init(&amp;s, 0, value)</code> — второй аргумент 0: семафор разделяется между потоками одного процесса.</div>`,
      viz: [{ name: 'semaphore', caption: '6 процессов и 3 принтера: wait(printers) / signal(printers)', props: { value: 3, label: 'printers', procs: 6 } }],
      exam: 'Сколько семафоров, какие типы и начальные значения (printers = 3, mutex = 1); зачем mutex; что делает sem_wait при 0.'
    }
  ],
  terms: [
    { en: 'Race condition', ru: 'Состояние гонки', def: 'Результат зависит от порядка чередования процессов, одновременно обращающихся к общим данным.' },
    { en: 'Critical section', ru: 'Критическая секция', def: 'Сегмент кода, где процесс работает с общими данными; в ней одновременно может быть только один процесс.' },
    { en: 'Entry / exit / remainder section', ru: 'Секции входа / выхода / остаток', def: 'Entry — запрос разрешения на вход в CS; exit — выход из CS; remainder — остальной код.' },
    { en: 'Mutual exclusion', ru: 'Взаимное исключение', def: 'Если Pi в своей CS, никакой другой процесс не выполняется в своей CS.' },
    { en: 'Progress', ru: 'Прогресс', def: 'Если CS свободна и есть желающие, выбор следующего входящего не откладывается бесконечно.' },
    { en: 'Bounded waiting', ru: 'Ограниченное ожидание', def: 'Есть граница на число входов других процессов в CS после запроса процесса и до его удовлетворения.' },
    { en: "Peterson's solution", ru: 'Алгоритм Петерсона', def: 'Программное решение CS для двух процессов на переменных turn и flag[2]; не гарантировано на современных CPU.' },
    { en: 'Instruction reordering', ru: 'Переупорядочивание инструкций', def: 'Процессор/компилятор меняет порядок независимых операций ради производительности; ломает Peterson в многопоточности.' },
    { en: 'Memory barrier', ru: 'Барьер памяти', def: 'Инструкция, гарантирующая, что операции с памятью до неё завершены и видны до операций после неё.' },
    { en: 'Atomic operation', ru: 'Атомарная операция', def: 'Операция, выполняемая без вмешательства других процессов посередине.' },
    { en: 'Mutex lock', ru: 'Мьютекс', def: 'Простейший инструмент: булева available; acquire() перед CS, release() после; вызовы атомарны.' },
    { en: 'Busy waiting', ru: 'Активное ожидание', def: 'Процесс крутится в цикле, проверяя условие, и тратит CPU.' },
    { en: 'Spinlock', ru: 'Спин-блокировка', def: 'Mutex lock с busy waiting.' },
    { en: 'Semaphore', ru: 'Семафор', def: 'Целая переменная S, доступная только через атомарные wait() (S--) и signal() (S++).' },
    { en: 'Binary semaphore', ru: 'Двоичный семафор', def: 'Значения 0 и 1; эквивалент mutex lock.' },
    { en: 'Counting semaphore', ru: 'Считающий семафор', def: 'Значение в неограниченном диапазоне; например, число свободных экземпляров ресурса.' },
    { en: 'block / wakeup', ru: 'Блокировка / пробуждение', def: 'block — поместить процесс в waiting queue семафора; wakeup(P) — перенести P из неё в ready queue.' },
    { en: 'Monitor', ru: 'Монитор', def: 'Высокоуровневый ADT: общие данные + процедуры; внутри активен только один процесс.' },
    { en: 'Condition variable', ru: 'Условная переменная', def: 'Очередь в мониторе: x.wait() приостанавливает, x.signal() возобновляет одного ждущего (без ждущих — нет эффекта).' },
    { en: 'Signal-and-wait', ru: 'Сигнал и ждать', def: 'После x.signal() сигналящий ждёт, пока разбуженный покинет монитор или начнёт ждать.' },
    { en: 'Signal-and-continue', ru: 'Сигнал и продолжить', def: 'После x.signal() разбуженный ждёт, пока сигналящий покинет монитор или начнёт ждать.' },
    { en: 'Readers–Writers problem', ru: 'Задача читателей–писателей', def: 'Много readers читают одновременно, writer — эксклюзивно; first — приоритет readers, second — writers.' },
    { en: 'Dining-Philosophers problem', ru: 'Обедающие философы', def: '5 философов, 5 палочек-семафоров; наивное решение даёт deadlock (circular wait).' },
    { en: 'Starvation', ru: 'Голодание', def: 'Процесс бесконечно долго не получает ресурс/вход в CS, хотя deadlock нет.' }
  ],
  questions: [
    { id: 'syn-01', type: 'single', q: 'P0 и P1 одновременно вызывают fork(). Что может произойти без синхронизации доступа к next_available_pid?', options: ['fork() вернёт −1 обоим процессам', 'Два разных процесса получат одинаковый pid', 'P0 и P1 попадут в deadlock', 'Ядро выдаст pid в обратном порядке'], answer: 1, explain: 'Оба читают next_available_pid = 2615 до его увеличения → оба ребёнка получают pid 2615. Deadlock тут нет — никто никого не ждёт.', section: 'race', diff: 1 },
    { id: 'syn-02', type: 'code', q: 'counter = 5. Producer выполняет counter++, consumer — counter-- параллельно (каждая операция — 3 машинные инструкции). Какие итоговые значения counter возможны?', lang: 'c', code: '/* counter++ */\nregister1 = counter;\nregister1 = register1 + 1;\ncounter = register1;\n\n/* counter-- */\nregister2 = counter;\nregister2 = register2 - 1;\ncounter = register2;', options: ['Только 5', 'Только 4 или 6', '4, 5 или 6', '5 или 6'], answer: 2, explain: 'Последовательно — 5. Если оба прочитали 5 до записи, результат определяет последний store: 4 (consumer последним) или 6 (producer последним).', section: 'race', diff: 2 },
    { id: 'syn-03', type: 'multi', q: 'Какие требования должно выполнять решение critical-section problem? (несколько ответов)', options: ['Mutual exclusion', 'Hold and wait', 'Progress', 'Bounded waiting', 'No preemption'], answer: [0, 2, 3], explain: 'Три требования: mutual exclusion, progress, bounded waiting. Hold and wait и no preemption — условия возникновения deadlock.', section: 'requirements', diff: 1 },
    { id: 'syn-04', type: 'single', q: 'Процесс запросил вход в CS, но другие процессы могут бесконечно входить раньше него. Какое требование нарушено?', options: ['Mutual exclusion', 'Progress', 'Atomicity', 'Bounded waiting'], answer: 3, explain: 'Bounded waiting требует границу на число чужих входов после запроса. Progress — о том, что при свободной CS выбор не откладывается бесконечно.', section: 'requirements', diff: 2 },
    { id: 'syn-05', type: 'single', q: 'В какой части кода процесс запрашивает разрешение на вход в critical section?', options: ['remainder section', 'entry section', 'exit section', 'critical section'], answer: 1, explain: 'Each process must ask permission to enter critical section in entry section; exit section — после CS, remainder — остальной код.', section: 'cs-problem', diff: 1 },
    { id: 'syn-06', type: 'tf', q: 'Решение «disable interrupts в entry section, enable interrupts в exit section» корректно работает на системе с двумя CPU.', answer: false, explain: 'Запрет прерываний действует только на своём CPU: процесс на другом CPU может войти в CS одновременно. Поэтому подход не масштабируется на multiprocessor.', section: 'interrupts', diff: 1 },
    { id: 'syn-07', type: 'multi', q: 'Какие проблемы у interrupt-based solution? (несколько ответов)', options: ['Если CS выполняется час, всё это время система не обслуживает прерывания', 'Возможен starvation: процесс может никогда не войти в CS', 'Не работает на двух CPU', 'Нарушает mutual exclusion на однопроцессорной системе'], answer: [0, 1, 2], explain: 'На uniprocessor запрет прерываний как раз обеспечивает выполнение без preemption, т.е. mutual exclusion; проблемы — длинные CS, starvation и multiprocessor.', section: 'interrupts', diff: 2 },
    { id: 'syn-08', type: 'code', q: "Какое условие должно стоять в цикле ожидания Peterson's solution для процесса Pi (j = 1 − i)?", lang: 'c', code: 'while (true) {\n    flag[i] = true;\n    turn = j;\n    while ( ??? )\n        ;\n    /* critical section */\n    flag[i] = false;\n    /* remainder section */\n}', options: ['flag[i] && turn == i', 'flag[j] || turn == j', 'flag[j] && turn == j', 'flag[j] && turn == i'], answer: 2, explain: 'Pi ждёт, пока Pj хочет войти И сейчас очередь Pj. С || Pi ждал бы при turn == j даже если Pj не хочет входить — нарушение progress.', section: 'peterson', diff: 2 },
    { id: 'syn-09', type: 'single', q: "В Peterson's solution процесс Pi входит в critical section только если…", options: ['flag[i] == true и turn == j', 'flag[j] == false или turn == i', 'flag[j] == true и turn == j', 'turn == j'], answer: 1, explain: 'Со слайда Correctness: Pi enters CS only if either flag[j] = false or turn = i. Третий вариант — как раз условие ожидания.', section: 'peterson', diff: 2 },
    { id: 'syn-10', type: 'single', q: "Почему в Peterson's solution выполняется bounded waiting?", options: ['Потому что прерывания запрещены во время CS', 'Потому что turn сбрасывается в 0 после каждой CS', 'Потому что flag[] — атомарная переменная', 'Pi ждёт не более одного входа Pj: собираясь войти снова, Pj ставит turn = i и уступает'], answer: 3, explain: 'Выходя, Pj ставит flag[j] = false; если он сразу хочет снова, то пишет turn = i и сам ждёт. Граница ожидания Pi — один вход Pj.', section: 'peterson', diff: 3 },
    { id: 'syn-11', type: 'code', q: 'Thread 1 и Thread 2 работают параллельно на современном процессоре без memory barrier. Что может напечатать Thread 1?', lang: 'c', code: 'boolean flag = false;\nint x = 0;\n\n/* Thread 1 */\nwhile (!flag)\n    ;\nprint x;\n\n/* Thread 2 */\nx = 100;\nflag = true;', options: ['Только 100', 'Только 0', '100 или 0', 'Ничего: Thread 1 зациклится навсегда'], answer: 2, explain: 'flag и x независимы, поэтому записи Thread 2 могут быть переупорядочены (flag = true раньше x = 100) → возможен вывод 0. Ожидаемый вывод — 100.', section: 'reorder', diff: 2 },
    { id: 'syn-12', type: 'code', q: "Из-за reordering операции Peterson's solution выполнились в таком порядке. Чем это закончится?", lang: 'c', code: '/* фактический порядок выполнения */\nP0: turn = 1;                      /* flag[0] ещё false */\nP1: flag[1] = true;\nP1: turn = 0;\nP1: while (flag[0] && turn == 0) ;  /* проверка */\nP0: flag[0] = true;\nP0: while (flag[1] && turn == 1) ;  /* проверка */', options: ['P0 и P1 попадут в deadlock', 'Оба процесса окажутся в critical section одновременно', 'В CS войдёт только P1, P0 будет ждать', 'В CS войдёт только P0'], answer: 1, explain: 'P1 видит flag[0] == false и входит. P0 видит turn == 0 (P1 записал turn последним), условие ложно → тоже входит. Mutual exclusion нарушен — пример со слайда Peterson Revisited.', section: 'reorder', diff: 3 },
    { id: 'syn-13', type: 'single', q: 'Что делает memory barrier?', options: ['Запрещает прерывания на время CS', 'Блокирует процесс до освобождения lock', 'Гарантирует, что операции с памятью до барьера завершены и видны до операций после него', 'Очищает кэш процессора'], answer: 2, explain: 'Барьер запрещает переупорядочивание через него: в примере x = 100; memory_barrier(); flag = true; Thread 1 увидит x = 100.', section: 'reorder', diff: 2 },
    { id: 'syn-14', type: 'code', q: 'acquire() реализован обычным, не атомарным кодом. Что может произойти, если два потока вызовут его одновременно при available == true?', lang: 'c', code: 'acquire() {\n    while (!available)\n        ;   /* busy wait */\n    available = false;\n}\n\nrelease() {\n    available = true;\n}', options: ['Оба потока зациклятся навсегда', 'Ровно один войдёт: код корректен и без атомарности', 'Оба потока пройдут цикл и войдут в critical section', 'Ядро завершит один из потоков'], answer: 2, explain: 'Оба прочитают available == true до того, как кто-то запишет false. Поэтому acquire()/release() должны быть atomic (обычно — hardware atomic instructions).', section: 'mutex', diff: 2 },
    { id: 'syn-15', type: 'code', q: 'Нужно, чтобы S1 (в P1) выполнилось раньше S2 (в P2). Каким должно быть начальное значение synch?', lang: 'c', code: 'semaphore synch = ?;\n\n/* P1 */\nS1;\nsignal(synch);\n\n/* P2 */\nwait(synch);\nS2;', options: ['1', '0', '2', '−1'], answer: 1, explain: 'synch = 0: P2 блокируется на wait(synch), пока P1 не выполнит S1 и signal. При 1 P2 мог бы выполнить S2 раньше S1.', section: 'semaphore', diff: 1 },
    { id: 'syn-16', type: 'code', q: 'Чем закончится выполнение, если семафор для critical section инициализирован так?', lang: 'c', code: 'semaphore mutex = 0;\n\n/* код каждого процесса */\nwait(mutex);\n/* critical section */\nsignal(mutex);', options: ['Всё работает корректно', 'В CS смогут находиться два процесса одновременно', 'Первый процесс войдёт, остальные никогда', 'Ни один процесс не войдёт в CS: все заблокированы на wait()'], answer: 3, explain: 'При mutex = 0 первый же wait() блокирует, а signal() некому выполнить — все ждут вечно. Для CS нужно mutex = 1.', section: 'semaphore', diff: 2 },
    { id: 'syn-17', type: 'code', q: 'Реализация без busy waiting, S->value = 1. P1, P2, P3 по очереди вызывают wait(S), затем P1 вызывает signal(S). Каково состояние?', lang: 'c', code: 'wait(semaphore *S) {\n    S->value--;\n    if (S->value < 0) {\n        add this process to S->list;\n        block();\n    }\n}\nsignal(semaphore *S) {\n    S->value++;\n    if (S->value <= 0) {\n        remove a process P from S->list;\n        wakeup(P);\n    }\n}', options: ['value = 0, P2 и P3 оба разбужены', 'value = −1, P2 перемещён в ready queue, P3 ждёт в S->list', 'value = 1, все процессы в ready queue', 'value = −2, никто не разбужен'], answer: 1, explain: 'wait: 1→0 (P1 входит), 0→−1 (P2 блок), −1→−2 (P3 блок). signal: −2→−1 ≤ 0 → wakeup(P2). P3 остаётся в списке.', section: 'sem-impl', diff: 3 },
    { id: 'syn-18', type: 'single', q: 'В реализации семафора без busy waiting S->value = −3. Что это означает?', options: ['Доступно 3 экземпляра ресурса', '3 процесса находятся в critical section', '3 процесса заблокированы в S->list', 'Ошибка: значение не может быть отрицательным'], answer: 2, explain: 'wait() уменьшает value до проверки, поэтому отрицательное value = −(число ждущих в очереди).', section: 'sem-impl', diff: 2 },
    { id: 'syn-19', type: 'code', q: 'Что не так с этим кодом?', lang: 'c', code: 'signal(mutex);\n/* critical section */\nwait(mutex);', options: ['Процесс навсегда заблокируется', 'Несколько процессов могут одновременно оказаться в critical section', 'Ошибка компиляции', 'Код корректен'], answer: 1, explain: 'signal перед CS увеличивает mutex — вход в CS ничем не ограничен, mutual exclusion нарушен.', section: 'sem-problems', diff: 1 },
    { id: 'syn-20', type: 'code', q: 'Что произойдёт при выполнении этого кода (mutex = 1)?', lang: 'c', code: 'wait(mutex);\n/* critical section */\nwait(mutex);', options: ['Процесс навсегда заблокируется на втором wait() (deadlock)', 'Несколько процессов окажутся в CS', 'mutex вернётся к 1 и всё продолжится', 'Второй wait() будет проигнорирован'], answer: 0, explain: 'Первый wait: 1→0. Второй wait при 0 блокирует процесс, а signal никто не выполнит — deadlock; остальные процессы тоже не войдут.', section: 'sem-problems', diff: 2 },
    { id: 'syn-21', type: 'single', q: 'Сколько процессов могут быть одновременно активны внутри монитора?', options: ['Не более двух', 'Сколько угодно, если они только читают', 'Только один', 'Равно числу condition variables'], answer: 2, explain: 'Ключевое свойство монитора: only one process may be active within the monitor at a time.', section: 'monitors', diff: 1 },
    { id: 'syn-22', type: 'code', q: 'Монитор реализован через семафор. Каким должно быть начальное значение mutex?', lang: 'c', code: 'semaphore mutex = ?;\n\n/* каждая процедура P монитора заменяется на */\nwait(mutex);\n    /* body of P */\nsignal(mutex);', options: ['0', '1', 'число процедур монитора', '−1'], answer: 1, explain: 'mutex = 1 пропускает в монитор ровно один процесс → mutual exclusion внутри монитора. При 0 никто бы не вошёл.', section: 'monitors', diff: 1 },
    { id: 'syn-23', type: 'tf', q: 'Если ни один процесс не вызвал x.wait(), операция x.signal() не имеет эффекта — в отличие от signal() семафора.', answer: true, explain: 'x.signal() возобновляет одного из ждущих, а если их нет — ничего не меняет. signal() семафора всегда увеличивает значение.', section: 'condvars', diff: 2 },
    { id: 'syn-24', type: 'code', q: 'Зачем в F2 нужна проверка done?', lang: 'c', code: 'F1:              /* вызывает P1 */\n    S1;\n    done = true;\n    x.signal();\n\nF2:              /* вызывает P2 */\n    if (done == false)\n        x.wait();\n    S2;', options: ['Чтобы обеспечить mutual exclusion в мониторе', 'Если F1 выполнится раньше, x.signal() потеряется, и без проверки P2 ждал бы вечно', 'Чтобы P1 не выполнил S1 дважды', 'Без неё возникнет ошибка компиляции'], answer: 1, explain: 'x.signal() без ждущих не имеет эффекта (не запоминается). done фиксирует, что S1 уже выполнено, и P2 не уходит в x.wait().', section: 'condvars', diff: 2 },
    { id: 'syn-25', type: 'single', q: 'P1 выполнил x.signal() и разбудил P2. При какой семантике P1 приостанавливается, пока P2 не покинет монитор (или не начнёт ждать на другой condition)?', options: ['signal-and-continue', 'busy waiting', 'signal-and-wait', 'bounded waiting'], answer: 2, explain: 'Signal-and-wait: ждёт сигналящий. При signal-and-continue ждёт разбуженный P2.', section: 'condvars', diff: 2 },
    { id: 'syn-26', type: 'single', q: 'Signal-and-continue означает, что…', options: ['разбуженный процесс ждёт, пока сигналящий покинет монитор (или начнёт ждать)', 'сигналящий процесс ждёт, пока разбуженный покинет монитор', 'оба процесса продолжают работу в мониторе одновременно', 'сигнал откладывается до следующего x.wait()'], answer: 0, explain: 'Сигналящий продолжает, а разбуженный ждёт освобождения монитора. Одновременная работа обоих — как раз проблема, которую решают эти семантики.', section: 'condvars', diff: 2 },
    { id: 'syn-27', type: 'single', q: 'В реализации signal-and-wait через семафоры что хранит next_count?', options: ['Число процессов в entry queue', 'Число процессов, ждущих на condition x', 'Номер следующего процесса для входа', 'Число процессов, приостановленных внутри монитора после x.signal() (ждут на next)'], answer: 3, explain: 'next_count — сколько сигналящих процессов заблокировано на семафоре next. Число ждущих на x хранит x_count.', section: 'sw-impl', diff: 2 },
    { id: 'syn-28', type: 'code', q: 'Почему при выходе из процедуры монитора стоит такая проверка?', lang: 'c', code: 'wait(mutex);\n    /* body of P */\nif (next_count > 0)\n    signal(next);\nelse\n    signal(mutex);', options: ['Чтобы next_count не стал отрицательным', 'Чтобы разбудить все процессы в entry queue', 'Монитор сначала передаётся процессу, приостановленному после x.signal(); только если таких нет — вход открывается новым процессам', 'Чтобы освободить condition variable x'], answer: 2, explain: 'Сигналящие ждут на next внутри монитора и имеют приоритет. Иначе signal(mutex) впускает процесс из entry queue.', section: 'sw-impl', diff: 3 },
    { id: 'syn-29', type: 'single', q: 'В «first reader-writer» problem приоритет отдан…', options: ['readers: пока они читают, writers ждут', 'writers: пришедший writer начинает как можно раньше', 'тому, кто пришёл первым (FIFO)', 'процессу с наименьшим pid'], answer: 0, explain: 'First — preference to readers; second — preference to writers.', section: 'rw', diff: 1 },
    { id: 'syn-30', type: 'code', q: 'Решение first readers-writers, реализация семафоров без busy waiting (value может быть отрицательным). Три reader читают, один writer вызвал wait(rw_mutex) и ждёт. Чему равны read_count и rw_mutex?', lang: 'c', code: '/* rw_mutex = 1, mutex = 1, read_count = 0 */\n/* reader */\nwait(mutex);\nread_count++;\nif (read_count == 1)\n    wait(rw_mutex);\nsignal(mutex);\n/* reading is performed */\nwait(mutex);\nread_count--;\nif (read_count == 0)\n    signal(rw_mutex);\nsignal(mutex);\n\n/* writer */\nwait(rw_mutex);\n/* writing is performed */\nsignal(rw_mutex);', options: ['read_count = 3, rw_mutex = −2', 'read_count = 1, rw_mutex = 0', 'read_count = 3, rw_mutex = 0', 'read_count = 3, rw_mutex = −1'], answer: 3, explain: 'wait(rw_mutex) делает только первый reader: 1→0. Writer: 0→−1 и блокируется. Остальные readers rw_mutex не трогают.', section: 'rw', diff: 3 },
    { id: 'syn-31', type: 'single', q: 'Какую проблему имеет решение first readers-writers на семафорах rw_mutex/mutex/read_count?', options: ['Два writer могут писать одновременно', 'Writer может никогда не получить доступ (starvation), если readers приходят непрерывно', 'Reader и writer могут одновременно работать с данными', 'Deadlock между readers'], answer: 1, explain: 'Пока read_count > 0, rw_mutex не освобождается; новые readers входят без ожидания — writer голодает.', section: 'rw', diff: 2 },
    { id: 'syn-32', type: 'code', q: 'Все 5 философов одновременно выполнили первый wait(). Что произойдёт?', lang: 'c', code: '/* semaphore chopstick[5], все = 1 */\nwhile (true) {\n    wait(chopstick[i]);\n    wait(chopstick[(i + 1) % 5]);\n    /* eat for awhile */\n    signal(chopstick[i]);\n    signal(chopstick[(i + 1) % 5]);\n    /* think for awhile */\n}', options: ['Starvation одного философа, остальные едят', 'Все едят по очереди без проблем', 'Едят ровно двое', 'Deadlock: каждый держит левую палочку и ждёт правую (circular wait)'], answer: 3, explain: 'Все chopstick[i] = 0, второй wait блокирует каждого; каждый ждёт палочку, которую держит правый сосед — circular wait → deadlock.', section: 'philosophers', diff: 1 },
    { id: 'syn-33', type: 'tf', q: 'Два быстрых философа на противоположных местах постоянно едят, а остальные трое не едят никогда. Это deadlock.', answer: false, explain: 'Это starvation: нет circular waiting, и каждый формально имеет шанс поесть.', section: 'philosophers', diff: 2 },
    { id: 'syn-34', type: 'multi', q: 'Какие изменения устраняют deadlock в Dining Philosophers? (несколько ответов)', options: ['Не более 4 философов за столом одновременно', 'Брать палочки, только если свободны обе (взятие в critical section)', 'Asymmetric: нечётный берёт сначала левую, чётный — сначала правую', 'Всем философам брать сначала правую палочку, затем левую'], answer: [0, 1, 2], explain: 'Первые три разрывают circular wait. Если все берут сначала правую — та же симметричная ситуация, deadlock остаётся.', section: 'philosophers', diff: 2 },
    { id: 'syn-35', type: 'code', q: 'state (философы 0–4) = [EATING, HUNGRY, THINKING, THINKING, THINKING]; философ 1 ждёт на self[1]. Философ 0 вызывает putdown(0). Что произойдёт?', lang: 'c', code: 'void putdown(int i) {\n    state[i] = THINKING;\n    test((i + 4) % 5);\n    test((i + 1) % 5);\n}\n\nvoid test(int i) {\n    if ((state[(i + 4) % 5] != EATING) &&\n        (state[i] == HUNGRY) &&\n        (state[(i + 1) % 5] != EATING)) {\n        state[i] = EATING;\n        self[i].signal();\n    }\n}', options: ['Философ 4 начинает есть', 'Философ 1 переходит в EATING и возобновляется через self[1].signal()', 'Ничего: философ 1 ждёт, пока сам не вызовет test(1)', 'Deadlock'], answer: 1, explain: 'test(4): философ 4 THINKING — не голоден. test(1): state[0] = THINKING, state[1] = HUNGRY, state[2] = THINKING → EATING и self[1].signal().', section: 'philo-monitor', diff: 3 },
    { id: 'syn-36', type: 'tf', q: 'Monitor solution задачи Dining Philosophers исключает deadlock, но starvation всё ещё возможен.', answer: true, explain: 'Палочки берутся только парой → нет circular wait. Но соседи могут чередоваться так, что один философ не ест никогда.', section: 'philo-monitor', diff: 1 },
    { id: 'syn-37', type: 'code', q: 'Задача с 3 принтерами. Какие начальные значения семафоров правильные?', lang: 'c', code: 'semaphore printers = ?;\nsemaphore mutex = ?;\n\nwait(printers);\nwait(mutex);\nprinter_id = find_free_printer();\nmark_occupied(printer_id);\nsignal(mutex);\nprint_document(printer_id);\nwait(mutex);\nmark_free(printer_id);\nsignal(mutex);\nsignal(printers);', options: ['printers = 1, mutex = 3', 'printers = 3, mutex = 0', 'printers = 3, mutex = 1', 'printers = 0, mutex = 1'], answer: 2, explain: 'printers — counting semaphore по числу свободных принтеров (3); mutex — binary для списка принтеров (1). При mutex = 0 никто не выберет принтер.', section: 'printers', diff: 2 },
    { id: 'syn-38', type: 'single', q: 'Что может случиться, если убрать wait(mutex)/signal(mutex) вокруг find_free_printer() в задаче с принтерами?', options: ['Больше 3 процессов будут печатать одновременно', 'Два процесса выберут один и тот же свободный принтер (race condition)', 'Deadlock на семафоре printers', 'Ничего: printers уже обеспечивает корректность'], answer: 1, explain: 'printers ограничивает только количество (≤ 3), но не выбор конкретного принтера: два процесса могут одновременно увидеть printer_free[i] == 1.', section: 'printers', diff: 2 },
    { id: 'syn-39', type: 'code', q: 'В задаче с принтерами программист поменял местами первые два wait(). Что может произойти, когда все 3 принтера заняты?', lang: 'c', code: 'User_Process() {\n    wait(mutex);          /* переставлено */\n    wait(printers);\n    printer_id = find_free_printer();\n    mark_occupied(printer_id);\n    signal(mutex);\n    print_document(printer_id);\n    wait(mutex);\n    mark_free(printer_id);\n    signal(mutex);\n    signal(printers);\n}', options: ['Ничего: порядок wait() не важен', 'Deadlock: процесс держит mutex и спит на printers, а печатающие не могут освободить принтер — им нужен mutex', 'Больше 3 процессов будут печатать одновременно', 'Два процесса получат один принтер'], answer: 1, explain: 'При printers = 0 процесс блокируется, удерживая mutex. Печатающий процесс для освобождения делает wait(mutex) — и тоже блокируется. Никто не вызовет signal(printers) → deadlock.', section: 'printers', diff: 3 }
  ]
});
