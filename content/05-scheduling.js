OS.addModule({
  id: 'scheduling',
  num: 5,
  group: 'theory',
  title: 'CPU Scheduling',
  titleRu: 'Планирование процессора',
  icon: '⏱',
  sources: ['5-Scheduling.pdf'],
  summary: 'Scheduler и dispatcher, критерии, preemptive/non-preemptive, FCFS, SJF, SRTF, RR, Priority, MLQ, MLFQ, планирование потоков и многоядерность.',
  sections: [
    {
      id: 'basics',
      h: 'Basic Concepts — CPU–I/O burst cycle',
      html: `
<ul>
  <li>Цель multiprogramming — <b>maximum CPU utilization</b>: пока один процесс ждёт I/O, CPU выполняет другой.</li>
  <li><b>CPU–I/O Burst Cycle</b> — выполнение процесса = чередование <b>CPU burst</b> (вычисления) и <b>I/O burst</b> (ожидание ввода-вывода). Планировщика интересует распределение длин CPU burst.</li>
  <li><b>CPU scheduler</b> выбирает процесс из <b>ready queue</b> и выделяет ему ядро CPU. Очередь может быть упорядочена по-разному (FIFO, по приоритету, по длине burst…).</li>
</ul>
<table class="t">
  <tr><th></th><th>Single-core</th><th>Multi-core</th></tr>
  <tr><td>Выделение ядра</td><td>одно ядро, CPU bursts в очереди, выполняется один процесс</td><td>ОС распределяет процессы по ядрам, bursts выполняются параллельно</td></tr>
  <tr><td>Метод</td><td>time-slicing, context switch между bursts</td><td>многоуровневое планирование по ядрам</td></tr>
  <tr><td><b>CPU affinity</b></td><td>—</td><td>опционально: привязка процесса/потока к ядру (Linux <code>taskset</code>)</td></tr>
  <tr><td>Примеры</td><td>Windows 7, macOS 10.6, Linux до 2.6.23</td><td>Windows 10/11, Linux, macOS 11+</td></tr>
</table>`,
      viz: [{ name: 'timeline', caption: 'Чередование CPU burst и I/O burst одного процесса', props: {
        max: 24, rows: [{ label: 'Process', segs: [
          { from: 0, to: 4, label: 'CPU', tone: 'acc' }, { from: 4, to: 9, label: 'I/O wait', tone: 'muted' },
          { from: 9, to: 12, label: 'CPU', tone: 'acc' }, { from: 12, to: 18, label: 'I/O wait', tone: 'muted' },
          { from: 18, to: 24, label: 'CPU', tone: 'acc' }] }] } }]
    },
    {
      id: 'dispatcher',
      h: 'Dispatcher и dispatch latency',
      html: `
<p><b>Dispatcher</b> — модуль ОС, который передаёт CPU процессу, выбранному CPU scheduler. Делает три вещи:</p>
<ol>
  <li><b>Switching context</b> — сохраняет/загружает контекст;</li>
  <li><b>Switching to user mode</b>;</li>
  <li><b>Jumping to the proper location</b> в пользовательской программе, чтобы продолжить её.</li>
</ol>
<div class="callout key"><b>Dispatch latency</b> — время, за которое dispatcher останавливает один процесс и запускает другой.</div>
<table class="t">
  <tr><th>Dispatcher</th><th>Scheduler</th></tr>
  <tr><td>Зависит от scheduler: ждёт, пока тот выберет процесс</td><td>Работает независимо, сразу когда нужно</td></tr>
  <tr><td>Нет собственного алгоритма</td><td>Использует алгоритмы: FCFS, SJF, RR…</td></tr>
  <tr><td>Его время = <b>dispatch latency</b></td><td>Время работы обычно пренебрежимо мало</td></tr>
  <tr><td>Context switch, переход в user mode, прыжок в нужное место программы</td><td>Единственная задача — <b>выбор</b> процесса</td></tr>
</table>`,
      viz: [{ name: 'flow', caption: 'Кто что делает', props: { dir: 'h', steps: [
        { label: 'Ready queue', sub: 'процессы ждут CPU' },
        { label: 'CPU scheduler', sub: 'ВЫБИРАЕТ процесс', tone: 'acc' },
        { label: 'Dispatcher', sub: 'context switch → user mode → jump', tone: 'warn' },
        { label: 'Running', sub: 'процесс на CPU', tone: 'ok' }] } }],
      exam: 'Различие scheduler (выбирает) vs dispatcher (переключает); определение dispatch latency.'
    },
    {
      id: 'criteria',
      h: 'Scheduling Criteria — критерии',
      html: `
<table class="t">
  <tr><th>Критерий</th><th>Определение</th><th>Цель</th></tr>
  <tr><td><b>CPU utilization</b></td><td>доля времени, когда CPU занят</td><td>max</td></tr>
  <tr><td><b>Throughput</b></td><td>число процессов, завершённых за единицу времени</td><td>max</td></tr>
  <tr><td><b>Turnaround time</b></td><td>время выполнения процесса целиком: от поступления до завершения</td><td>min</td></tr>
  <tr><td><b>Waiting time</b></td><td>суммарное время ожидания в <b>ready queue</b></td><td>min</td></tr>
  <tr><td><b>Response time</b></td><td>от поступления запроса до <b>первого</b> ответа (не до конца вывода)</td><td>min</td></tr>
</table>
<div class="formula">Turnaround = Completion − Arrival &nbsp;&nbsp;|&nbsp;&nbsp; Waiting = Turnaround − Burst &nbsp;&nbsp;|&nbsp;&nbsp; Response = First run − Arrival</div>`,
      exam: 'Какие критерии максимизируются (utilization, throughput), какие минимизируются (turnaround, waiting, response). Отличие waiting от response.'
    },
    {
      id: 'preemption',
      h: 'Preemptive vs Non-preemptive',
      html: `
<p>Решение о планировании принимается, когда процесс:</p>
<ol>
  <li>переходит <b>running → waiting</b> (I/O, wait());</li>
  <li>переходит <b>running → ready</b> (прерывание по таймеру);</li>
  <li>переходит <b>waiting → ready</b> (I/O завершён);</li>
  <li><b>завершается</b>.</li>
</ol>
<div class="callout key">В случаях <b>1 и 4</b> выбора нет — нужно выбрать новый процесс. Если планирование происходит <b>только</b> в 1 и 4 — схема <b>non-preemptive</b> (cooperative). Если также в <b>2 и 3</b> — <b>preemptive</b>.</div>
<div class="cols">
  <div><b>Non-preemptive</b>: процесс держит CPU, пока сам не завершится или не перейдёт в waiting.
    <div class="pros"><b>+</b><ul><li>минимальный overhead</li><li>прост в реализации</li><li>выше throughput</li></ul></div>
    <div class="cons"><b>−</b><ul><li>плохое среднее response time (все ждут предыдущих)</li><li>жёсткий: процесс держит CPU до конца</li></ul></div>
  </div>
  <div><b>Preemptive</b>: ресурс дают на время и отбирают; если burst не закончен — процесс возвращается в ready queue.
    <div class="pros"><b>+</b><ul><li>никто не монополизирует CPU</li><li>лучше среднее response time</li><li>процесс с более высоким приоритетом может сразу получить CPU</li></ul></div>
    <div class="cons"><b>−</b><ul><li>overhead: прерывания, context switch</li><li>возможен <b>starvation</b> низкоприоритетных</li><li><b>race conditions</b> на общих данных</li></ul></div>
  </div>
</div>
<div class="callout warn"><b>Preemption и race condition</b>: процесс вытеснен посреди обновления общих данных → второй процесс читает данные в несогласованном состоянии.</div>
<table class="t">
  <tr><th></th><th>Preemptive</th><th>Non-preemptive</th></tr>
  <tr><td>Алгоритмы</td><td>RR, SRTF, preemptive Priority</td><td>FCFS, SJF (SJN), non-preemptive Priority</td></tr>
  <tr><td>Отзывчивость</td><td>высокая (интерактивные системы)</td><td>низкая</td></tr>
  <tr><td>Context switch</td><td>часто → выше overhead</td><td>редко → ниже overhead</td></tr>
  <tr><td>Где</td><td>time-sharing, GUI, soft real-time</td><td>batch, простые embedded, hard real-time с известной нагрузкой</td></tr>
</table>
<table class="t">
  <tr><th>ОС</th><th>Планирование</th></tr>
  <tr><td>Windows</td><td>preemptive Priority + Round Robin</td></tr>
  <tr><td>Linux</td><td><b>CFS — Completely Fair Scheduler</b> (preemptive, fairness)</td></tr>
  <tr><td>macOS</td><td>preemptive Priority + time-sharing</td></tr>
  <tr><td>RTOS (FreeRTOS)</td><td>preemptive Priority</td></tr>
  <tr><td>Early UNIX batch, DOS, µC/OS-II</td><td>non-preemptive (FCFS/SJN, задачи сами отдают CPU)</td></tr>
</table>
<p>Все современные ОС (Windows, macOS, Linux, UNIX) — <b>preemptive</b>.</p>`,
      viz: [{ name: 'procStates', caption: 'Переходы 1–4 на диаграмме состояний: 1 running→waiting, 2 running→ready, 3 waiting→ready, 4 exit', props: { decisions: true } }],
      exam: 'Номера ситуаций 1–4 и какие из них дают non-preemptive схему; примеры алгоритмов каждого типа.'
    },
    {
      id: 'fcfs',
      h: 'First-Come, First-Served (FCFS)',
      html: `
<ul>
  <li>Процессы обслуживаются в порядке прихода; <b>FIFO ready queue</b>: PCB добавляется в хвост, CPU получает голова.</li>
  <li><b>Non-preemptive</b>.</li>
  <li>Производительность непредсказуема — зависит от порядка прихода.</li>
  <li><b>Convoy effect</b> — короткие процессы ждут за одним длинным (например, один CPU-bound и много I/O-bound).</li>
</ul>
<div class="formula">Порядок P1(24), P2(3), P3(3): wait = 0, 24, 27 → avg = 51/3 = <b>17</b></div>
<div class="formula">Порядок P2(3), P3(3), P1(24): wait = 6, 0, 3 → avg = 9/3 = <b>3</b></div>
<div data-viz="0"></div>
<div data-viz="1"></div>`,
      viz: [
        { name: 'scheduler', caption: 'Пример со слайдов: порядок P1, P2, P3', props: { algo: 'FCFS', processes: [{ name: 'P1', arrival: 0, burst: 24 }, { name: 'P2', arrival: 0, burst: 3 }, { name: 'P3', arrival: 0, burst: 3 }] } },
        { name: 'scheduler', caption: 'Тот же набор, порядок P2, P3, P1 — convoy effect исчез', props: { algo: 'FCFS', lockAlgo: true, processes: [{ name: 'P2', arrival: 0, burst: 3 }, { name: 'P3', arrival: 0, burst: 3 }, { name: 'P1', arrival: 0, burst: 24 }] } }
      ],
      exam: 'Посчитать avg waiting time по Gantt chart; объяснить convoy effect.'
    },
    {
      id: 'sjf',
      h: 'Shortest-Job-First (SJF)',
      html: `
<ul>
  <li>Каждому процессу сопоставляется длина <b>следующего CPU burst</b>; выбирается процесс с наименьшей.</li>
  <li><b>SJF оптимален</b>: даёт <b>минимальное average waiting time</b> для данного набора процессов.</li>
  <li>Бывает non-preemptive и preemptive (preemptive = <b>SRTF</b>).</li>
  <li>Проблема: длина следующего burst неизвестна → <b>спросить пользователя</b> или <b>оценить (estimate)</b>.</li>
</ul>
<div class="formula">P1=8, P2=4, P3=9, P4=5 → порядок P2, P4, P1, P3: wait = 9, 0, 17, 4 → avg = 30/4 = <b>7.5</b></div>`,
      viz: [{ name: 'scheduler', caption: 'Пример со слайдов (все приходят в 0)', props: { algo: 'SJF', processes: [{ name: 'P1', arrival: 0, burst: 8 }, { name: 'P2', arrival: 0, burst: 4 }, { name: 'P3', arrival: 0, burst: 9 }, { name: 'P4', arrival: 0, burst: 5 }] } }],
      exam: 'SJF — минимальное среднее ожидание; главная проблема — неизвестная длина следующего burst.'
    },
    {
      id: 'srtf',
      h: 'Shortest Remaining Time First (SRTF)',
      html: `
<ul>
  <li><b>Preemptive SJF</b>: при каждом поступлении нового процесса решение пересматривается — выполняется процесс с наименьшим <b>оставшимся</b> временем.</li>
  <li>Если пришёл процесс с burst меньше, чем остаток текущего, — текущий вытесняется.</li>
</ul>
<table class="t">
  <tr><th>Process</th><th>Arrival</th><th>Burst</th></tr>
  <tr><td>P1</td><td>0</td><td>8</td></tr><tr><td>P2</td><td>1</td><td>4</td></tr><tr><td>P3</td><td>2</td><td>9</td></tr><tr><td>P4</td><td>3</td><td>5</td></tr>
</table>
<div class="formula">Gantt: P1 0–1 | P2 1–5 | P4 5–10 | P1 10–17 | P3 17–26<br>wait = (10−1−0) + (1−1) + (17−2) + (5−3) = 9 + 0 + 15 + 2 = 26 → avg = 26/4 = <b>6.5</b></div>
<div class="callout note">Для вытесненного процесса: wait = T<sub>resume</sub> − T<sub>executed</sub> − T<sub>arrival</sub> (P1: 10 − 1 − 0 = 9). Для остальных: wait = T<sub>start</sub> − T<sub>arrival</sub>.</div>`,
      viz: [{ name: 'scheduler', caption: 'Пример со слайдов: SRTF с разным временем прихода', props: { algo: 'SRTF', processes: [{ name: 'P1', arrival: 0, burst: 8 }, { name: 'P2', arrival: 1, burst: 4 }, { name: 'P3', arrival: 2, burst: 9 }, { name: 'P4', arrival: 3, burst: 5 }] } }],
      exam: 'Построить Gantt для SRTF с arrival times и посчитать avg waiting (6.5).'
    },
    {
      id: 'rr',
      h: 'Round Robin (RR)',
      html: `
<ul>
  <li>Каждый процесс получает <b>time quantum q</b> (обычно <b>10–100 ms</b>). По истечении — <b>preempted</b> и в <b>конец ready queue</b>.</li>
  <li>n процессов, квант q → каждый получает 1/n времени CPU порциями ≤ q; никто не ждёт больше <b>(n − 1)·q</b>.</li>
  <li><b>Timer interrupt</b> каждый квант → планирование следующего процесса.</li>
  <li>Обычно <b>больше average turnaround, чем у SJF, но лучше response</b>.</li>
</ul>
<div class="formula">q = 4; P1=24, P2=3, P3=3 → P1 0–4 | P2 4–7 | P3 7–10 | P1 10–14–18–22–26–30<br>wait: P1 = 10 − 4 = 6, P2 = 4, P3 = 7 → avg = 17/3 ≈ <b>5.67</b></div>
<table class="t">
  <tr><th>Process time = 10</th><th>Quantum</th><th>Context switches</th></tr>
  <tr><td>0 ———————— 10</td><td>12</td><td>0</td></tr>
  <tr><td>0 —— 6 —— 10</td><td>6</td><td>1</td></tr>
  <tr><td>0|1|2|…|9|10</td><td>1</td><td>9</td></tr>
</table>
<div class="cols">
  <div class="callout key"><b>q большой</b> → RR вырождается в <b>FIFO (FCFS)</b>.</div>
  <div class="callout warn"><b>q маленький</b> → слишком много context switch. q должен быть велик относительно времени context switch (<b>&lt; 10 µs</b>).</div>
</div>`,
      viz: [{ name: 'scheduler', caption: 'Пример со слайдов: RR, q = 4 (поменяй квант и посмотри на число переключений)', props: { algo: 'RR', quantum: 4, processes: [{ name: 'P1', arrival: 0, burst: 24 }, { name: 'P2', arrival: 0, burst: 3 }, { name: 'P3', arrival: 0, burst: 3 }] } }],
      exam: 'Gantt для RR; формула (n−1)q; что будет при большом/маленьком q.'
    },
    {
      id: 'priority',
      h: 'Priority Scheduling (+ Round Robin)',
      html: `
<ul>
  <li>Каждому процессу — целое число priority; CPU получает процесс с наивысшим приоритетом (<b>меньшее число = выше приоритет</b>).</li>
  <li>Бывает <b>preemptive</b> и <b>non-preemptive</b>.</li>
  <li><b>SJF</b> — частный случай priority scheduling: priority = обратная величина предсказанного следующего CPU burst.</li>
  <li><b>Starvation</b> — низкоприоритетный процесс может никогда не выполниться. Решение — <b>Aging</b>: со временем приоритет ожидающего процесса повышается.</li>
</ul>
<div class="formula">P1(10, pr 3), P2(1, pr 1), P3(2, pr 4), P4(1, pr 5), P5(5, pr 2)<br>Gantt: P2 0–1 | P5 1–6 | P1 6–16 | P3 16–18 | P4 18–19 → wait = 6, 0, 16, 18, 1 → avg = 41/5 = <b>8.2</b></div>
<div data-viz="0"></div>
<p><b>Priority + Round Robin</b>: выполняется процесс с наивысшим приоритетом; процессы с <b>одинаковым</b> приоритетом — по RR.</p>
<div class="formula">q = 2: P4 0–7 | P2 7–9 | P3 9–11 | P2 11–13 | P3 13–15 | P2 15–16 | P3 16–20 | P1 20–22 | P5 22–24 | P1 24–26 | P5 26–27</div>
<div data-viz="1"></div>`,
      viz: [
        { name: 'scheduler', caption: 'Пример со слайдов: non-preemptive priority, avg waiting = 8.2', props: { algo: 'PRIO', processes: [{ name: 'P1', arrival: 0, burst: 10, priority: 3 }, { name: 'P2', arrival: 0, burst: 1, priority: 1 }, { name: 'P3', arrival: 0, burst: 2, priority: 4 }, { name: 'P4', arrival: 0, burst: 1, priority: 5 }, { name: 'P5', arrival: 0, burst: 5, priority: 2 }] } },
        { name: 'scheduler', caption: 'Пример со слайдов: Priority + RR, q = 2', props: { algo: 'PRIO_RR', quantum: 2, processes: [{ name: 'P1', arrival: 0, burst: 4, priority: 3 }, { name: 'P2', arrival: 0, burst: 5, priority: 2 }, { name: 'P3', arrival: 0, burst: 8, priority: 2 }, { name: 'P4', arrival: 0, burst: 7, priority: 1 }, { name: 'P5', arrival: 0, burst: 3, priority: 3 }] } }
      ],
      exam: 'Starvation ↔ aging; SJF как частный случай priority; посчитать avg waiting (8.2).'
    },
    {
      id: 'mlq',
      h: 'Multilevel Queue (MLQ)',
      html: `
<ul>
  <li>Ready queue разбита на <b>несколько очередей</b> по типу процессов; процесс <b>навсегда</b> закреплён за своей очередью.</li>
  <li>С priority scheduling — отдельная очередь на каждый приоритет; выполняется процесс из <b>самой приоритетной непустой</b> очереди.</li>
  <li>Параметры MLQ scheduler:
    <ul><li>число очередей;</li><li>алгоритм планирования для каждой очереди;</li><li>метод выбора очереди, в которую попадает процесс;</li><li>планирование <b>между</b> очередями.</li></ul>
  </li>
</ul>`,
      viz: [{ name: 'layers', caption: 'Приоритизация по типу процесса', props: { top: 'highest priority', bottom: 'lowest priority', layers: [
        { label: 'real-time processes', tone: 'bad' }, { label: 'system processes', tone: 'warn' },
        { label: 'interactive processes', tone: 'acc' }, { label: 'batch processes', tone: 'muted' }] } }]
    },
    {
      id: 'mlfq',
      h: 'Multilevel Feedback Queue (MLFQ)',
      html: `
<ul>
  <li>Как MLQ, но процесс <b>может перемещаться</b> между очередями.</li>
  <li>Параметры: число очередей; алгоритм для каждой; метод <b>upgrade</b> (повышения); метод <b>demote</b> (понижения); в какую очередь процесс входит при запросе обслуживания.</li>
  <li><b>Aging</b> можно реализовать через MLFQ (долго ждущий процесс поднимается выше).</li>
</ul>
<p><b>Пример</b> (3 очереди):</p>
<ul>
  <li><b>Q0</b> — RR, q = 8 ms; <b>Q1</b> — RR, q = 16 ms; <b>Q2</b> — FCFS.</li>
  <li>Новый процесс → Q0, получает 8 ms. Не успел → переходит в Q1, получает ещё 16 ms. Не успел → вытесняется в Q2 (FCFS).</li>
</ul>
<div class="formula">Burst = 30 ms: 8 ms в Q0 → 16 ms в Q1 → оставшиеся 6 ms в Q2</div>`,
      viz: [{ name: 'mlfq', caption: 'Процесс с burst 30 ms спускается по очередям', props: { queues: [{ label: 'Q0', algo: 'RR q=8' }, { label: 'Q1', algo: 'RR q=16' }, { label: 'Q2', algo: 'FCFS' }], burst: 30 } }],
      exam: 'Отличие MLQ (процесс закреплён) от MLFQ (перемещается); пройти пример с Q0/Q1/Q2.'
    },
    {
      id: 'threads',
      h: 'Thread Scheduling — PCS и SCS',
      html: `
<ul>
  <li>Если ОС поддерживает потоки, планируются <b>потоки</b>, а не процессы. Различают user-level и kernel-level threads.</li>
  <li>Модели <b>many-to-one</b> и <b>many-to-many</b>: thread library планирует user threads на <b>LWP (lightweight process)</b>.
    <ul>
      <li>LWP — промежуточная структура между user и kernel thread; для библиотеки выглядит как <b>виртуальный процессор</b>.</li>
      <li>Каждый LWP привязан к kernel thread; ОС планирует именно kernel threads на физические CPU.</li>
      <li>Это <b>Process-Contention Scope (PCS)</b> — конкуренция <b>внутри процесса</b>; обычно по приоритету, заданному программистом.</li>
      <li>Kernel thread блокируется (I/O) → блокируется LWP → блокируется user thread над ним.</li>
    </ul>
  </li>
  <li>Модель <b>one-to-one</b>: kernel thread планируется на CPU — <b>System-Contention Scope (SCS)</b>, конкуренция среди <b>всех потоков системы</b>.</li>
</ul>
<table class="t">
  <tr><th>Pthread константа</th><th>Scope</th></tr>
  <tr><td><code>PTHREAD_SCOPE_PROCESS</code></td><td>PCS</td></tr>
  <tr><td><code>PTHREAD_SCOPE_SYSTEM</code></td><td>SCS</td></tr>
</table>
<div class="callout warn">Может ограничиваться ОС: <b>Linux и macOS разрешают только PTHREAD_SCOPE_SYSTEM</b>.</div>
<pre class="code" data-lang="c">pthread_attr_t attr;
pthread_attr_init(&amp;attr);                       /* атрибуты по умолчанию */
pthread_attr_getscope(&amp;attr, &amp;scope);           /* узнать текущий scope */
pthread_attr_setscope(&amp;attr, PTHREAD_SCOPE_SYSTEM); /* PCS или SCS */
for (i = 0; i &lt; NUM_THREADS; i++)
    pthread_create(&amp;tid[i], &amp;attr, runner, NULL);
for (i = 0; i &lt; NUM_THREADS; i++)
    pthread_join(tid[i], NULL);</pre>`,
      viz: [{ name: 'flow', caption: 'PCS: цепочка от user thread к CPU', props: { dir: 'h', steps: [
        { label: 'User thread', sub: 'планирует библиотека' }, { label: 'LWP', sub: '«виртуальный процессор»', tone: 'acc' },
        { label: 'Kernel thread', sub: 'планирует ОС', tone: 'warn' }, { label: 'CPU', tone: 'ok' }] } }],
      exam: 'PCS vs SCS, роль LWP, какие scope поддерживают Linux/macOS.'
    },
    {
      id: 'multicore',
      h: 'Multithreaded Multicore System (CMT)',
      html: `
<ul>
  <li><b>Chip-multithreading (CMT)</b> — у каждого ядра несколько <b>hardware threads</b> (у Intel — <b>hyperthreading</b>).</li>
  <li>4 ядра × 2 hardware threads → ОС видит <b>8 logical processors</b>. Intel Core i7 — 2 потока на ядро; SPARC M7 — 8 ядер × 8 потоков.</li>
  <li>Решает проблему <b>memory stall</b>: пока один поток ждёт данные из памяти, ядро выполняет другой поток.</li>
  <li><b>Два уровня планирования</b>:
    <ol><li>ОС решает, какой <b>software thread</b> запустить на <b>logical CPU</b>;</li><li>каждое ядро решает, какой <b>hardware thread</b> выполнять на физическом ядре.</li></ol>
  </li>
</ul>`,
      viz: [{ name: 'timeline', caption: 'Memory stall: ядро переключается между hardware threads', props: {
        max: 16, rows: [
          { label: 'thread 0', segs: [{ from: 0, to: 3, label: 'C', tone: 'acc' }, { from: 3, to: 7, label: 'M stall', tone: 'muted' }, { from: 7, to: 10, label: 'C', tone: 'acc' }, { from: 10, to: 14, label: 'M stall', tone: 'muted' }] },
          { label: 'thread 1', segs: [{ from: 3, to: 6, label: 'C', tone: 'ok' }, { from: 6, to: 10, label: 'M stall', tone: 'muted' }, { from: 10, to: 13, label: 'C', tone: 'ok' }] }] } }]
    },
    {
      id: 'summary',
      h: 'Сводная таблица алгоритмов',
      html: `
<table class="t">
  <tr><th>Алгоритм</th><th>Preemptive?</th><th>Выбирает</th><th>Плюс</th><th>Минус</th></tr>
  <tr><td><b>FCFS</b></td><td>нет</td><td>первый пришедший</td><td>простота</td><td>convoy effect</td></tr>
  <tr><td><b>SJF</b></td><td>нет</td><td>кратчайший next burst</td><td>min avg waiting</td><td>длина burst неизвестна; starvation длинных</td></tr>
  <tr><td><b>SRTF</b></td><td>да</td><td>кратчайший остаток</td><td>ещё меньше waiting</td><td>частые переключения</td></tr>
  <tr><td><b>RR</b></td><td>да (timer)</td><td>следующий по кругу, квант q</td><td>хороший response, честность</td><td>turnaround выше, чем у SJF</td></tr>
  <tr><td><b>Priority</b></td><td>оба варианта</td><td>наименьшее число priority</td><td>важные — первыми</td><td>starvation → aging</td></tr>
  <tr><td><b>MLQ</b></td><td>—</td><td>очередь по типу процесса</td><td>разные политики по классам</td><td>процесс не меняет очередь</td></tr>
  <tr><td><b>MLFQ</b></td><td>—</td><td>очередь меняется по поведению</td><td>гибкость, aging</td><td>много параметров</td></tr>
</table>`
    }
  ],
  terms: [
    { en: 'CPU–I/O Burst Cycle', ru: 'Цикл CPU–I/O', def: 'Выполнение процесса — чередование CPU burst (вычисления) и I/O burst (ожидание ввода-вывода).' },
    { en: 'CPU scheduler', ru: 'Планировщик CPU', def: 'Выбирает процесс из ready queue и выделяет ему ядро CPU.' },
    { en: 'Dispatcher', ru: 'Диспетчер', def: 'Передаёт CPU выбранному процессу: context switch, переход в user mode, прыжок в нужное место программы.' },
    { en: 'Dispatch latency', ru: 'Задержка диспетчеризации', def: 'Время, за которое dispatcher останавливает один процесс и запускает другой.' },
    { en: 'Throughput', ru: 'Пропускная способность', def: 'Число процессов, завершённых за единицу времени (максимизируется).' },
    { en: 'Turnaround time', ru: 'Время оборота', def: 'Время от поступления процесса до его завершения: completion − arrival.' },
    { en: 'Waiting time', ru: 'Время ожидания', def: 'Суммарное время, проведённое процессом в ready queue: turnaround − burst.' },
    { en: 'Response time', ru: 'Время отклика', def: 'Время от поступления запроса до первого ответа (первого запуска).' },
    { en: 'Non-preemptive scheduling', ru: 'Невытесняющее планирование', def: 'Планирование только при переходе running→waiting и при завершении; процесс сам отдаёт CPU.' },
    { en: 'Preemptive scheduling', ru: 'Вытесняющее планирование', def: 'ОС может отобрать CPU у процесса (также при running→ready и waiting→ready).' },
    { en: 'Convoy effect', ru: 'Эффект конвоя', def: 'В FCFS короткие процессы ждут за одним длинным.' },
    { en: 'SJF', ru: 'Shortest-Job-First', def: 'Выбор процесса с наименьшим следующим CPU burst; даёт минимальное среднее время ожидания.' },
    { en: 'SRTF', ru: 'Shortest Remaining Time First', def: 'Preemptive SJF: при приходе процесса выбирается тот, у кого меньше всего осталось.' },
    { en: 'Time quantum', ru: 'Квант времени', def: 'Порция CPU в Round Robin (10–100 ms); по истечении процесс уходит в конец очереди.' },
    { en: 'Starvation', ru: 'Голодание', def: 'Низкоприоритетный процесс бесконечно долго не получает CPU.' },
    { en: 'Aging', ru: 'Старение', def: 'Постепенное повышение приоритета долго ждущего процесса — решение starvation.' },
    { en: 'Multilevel Queue', ru: 'Многоуровневая очередь', def: 'Несколько очередей по типам процессов, процесс закреплён за очередью.' },
    { en: 'Multilevel Feedback Queue', ru: 'MLQ с обратной связью', def: 'Процесс может перемещаться между очередями (demote/upgrade); реализует aging.' },
    { en: 'LWP', ru: 'Lightweight process', def: 'Промежуточная структура между user и kernel thread; для библиотеки выглядит как виртуальный процессор.' },
    { en: 'PCS', ru: 'Process-Contention Scope', def: 'Конкуренция потоков внутри процесса (many-to-one, many-to-many); PTHREAD_SCOPE_PROCESS.' },
    { en: 'SCS', ru: 'System-Contention Scope', def: 'Конкуренция среди всех потоков системы (one-to-one); PTHREAD_SCOPE_SYSTEM.' },
    { en: 'Chip-multithreading (CMT)', ru: 'Аппаратная многопоточность', def: 'Несколько hardware threads на ядро (Intel hyperthreading); скрывает memory stall.' },
    { en: 'CFS', ru: 'Completely Fair Scheduler', def: 'Preemptive планировщик Linux, ориентированный на справедливость.' }
  ],
  questions: [
    { id: 'sch-01', type: 'single', q: 'Какой критерий определяется как время от поступления запроса до первого ответа?', options: ['Turnaround time', 'Waiting time', 'Response time', 'Throughput'], answer: 2, explain: 'Response time — до первого ответа. Turnaround — до полного завершения, waiting — время в ready queue.', section: 'criteria', diff: 1 },
    { id: 'sch-02', type: 'multi', q: 'Какие критерии планирования нужно МИНИМИЗИРОВАТЬ? (несколько ответов)', options: ['CPU utilization', 'Turnaround time', 'Waiting time', 'Throughput', 'Response time'], answer: [1, 2, 4], explain: 'Utilization и throughput максимизируются; turnaround, waiting и response — минимизируются.', section: 'criteria', diff: 1 },
    { id: 'sch-03', type: 'single', q: 'Waiting time процесса — это…', options: ['время от поступления до завершения', 'суммарное время в ready queue', 'время выполнения на CPU', 'время до первого запуска'], answer: 1, explain: 'Waiting time = время ожидания в ready queue (= turnaround − burst). Время до первого запуска — response time.', section: 'criteria', diff: 1 },
    { id: 'sch-04', type: 'multi', q: 'Что входит в работу dispatcher? (несколько ответов)', options: ['Switching context', 'Выбор следующего процесса из ready queue', 'Switching to user mode', 'Jumping to the proper location in the user program'], answer: [0, 2, 3], explain: 'Выбор процесса — задача CPU scheduler. Dispatcher переключает контекст, режим и передаёт управление программе.', section: 'dispatcher', diff: 2 },
    { id: 'sch-05', type: 'single', q: 'Dispatch latency — это…', options: ['время работы алгоритма планирования', 'время, за которое dispatcher останавливает один процесс и запускает другой', 'время ожидания процесса в ready queue', 'интервал timer interrupt'], answer: 1, explain: 'По определению со слайдов: время на остановку одного процесса и запуск другого.', section: 'dispatcher', diff: 1 },
    { id: 'sch-06', type: 'tf', q: 'Dispatcher использует алгоритмы FCFS, SJF, RR для выбора процесса.', answer: false, explain: 'Алгоритмы использует scheduler. У dispatcher нет собственного алгоритма — он лишь передаёт CPU выбранному процессу.', section: 'dispatcher', diff: 1 },
    { id: 'sch-07', type: 'single', q: 'Схема планирования non-preemptive, если решения принимаются только когда процесс…', options: ['переходит running→ready и waiting→ready', 'переходит running→waiting и завершается', 'переходит waiting→ready и завершается', 'переходит running→ready и завершается'], answer: 1, explain: 'Ситуации 1 (running→waiting) и 4 (terminate) — выбора нет; если планирование только в них — non-preemptive.', section: 'preemption', diff: 2 },
    { id: 'sch-08', type: 'multi', q: 'Какие алгоритмы являются preemptive? (несколько ответов)', options: ['Round Robin', 'FCFS', 'SRTF', 'Non-preemptive SJF', 'Preemptive Priority'], answer: [0, 2, 4], explain: 'RR (по таймеру), SRTF (preemptive SJF) и preemptive priority вытесняют процесс. FCFS и обычный SJF — non-preemptive.', section: 'preemption', diff: 1 },
    { id: 'sch-09', type: 'single', q: 'Какой недостаток характерен именно для preemptive scheduling?', options: ['Плохое среднее response time', 'Процесс может монополизировать CPU', 'Race conditions на общих данных и overhead на context switch', 'Невозможность приоритетов'], answer: 2, explain: 'Вытеснение посреди обновления данных даёт race condition; частые переключения — overhead. Остальные варианты — минусы non-preemptive.', section: 'preemption', diff: 2 },
    { id: 'sch-10', type: 'single', q: 'Какой планировщик используется в Linux (desktop/server)?', options: ['Multilevel Queue', 'Completely Fair Scheduler (CFS)', 'Non-preemptive FCFS', 'Shortest Job Next'], answer: 1, explain: 'Linux использует CFS — preemptive, ориентированный на справедливость.', section: 'preemption', diff: 1 },
    { id: 'sch-11', type: 'single', q: 'FCFS, процессы пришли в порядке P1 (24), P2 (3), P3 (3). Average waiting time = ?', options: ['3', '10', '17', '27'], answer: 2, explain: 'Wait: P1 = 0, P2 = 24, P3 = 27 → 51/3 = 17.', section: 'fcfs', diff: 1 },
    { id: 'sch-12', type: 'single', q: 'FCFS, те же процессы в порядке P2 (3), P3 (3), P1 (24). Average waiting time = ?', options: ['3', '6', '9', '17'], answer: 0, explain: 'Wait: P2 = 0, P3 = 3, P1 = 6 → 9/3 = 3. Порядок прихода сильно влияет на FCFS.', section: 'fcfs', diff: 1 },
    { id: 'sch-13', type: 'single', q: 'Convoy effect — это…', options: ['процессы с одинаковым приоритетом выполняются по кругу', 'короткие процессы ждут за одним длинным', 'низкоприоритетные процессы никогда не выполняются', 'частые context switch при малом кванте'], answer: 1, explain: 'Convoy effect (FCFS): один длинный (CPU-bound) процесс задерживает много коротких (I/O-bound). Третий вариант — starvation.', section: 'fcfs', diff: 1 },
    { id: 'sch-14', type: 'tf', q: 'SJF даёт минимальное среднее время ожидания для заданного набора процессов.', answer: true, explain: 'Это ключевое свойство SJF — он оптимален по average waiting time.', section: 'sjf', diff: 1 },
    { id: 'sch-15', type: 'single', q: 'SJF (non-preemptive), все приходят в 0: P1=8, P2=4, P3=9, P4=5. Average waiting time = ?', options: ['6.5', '7.5', '10.25', '13'], answer: 1, explain: 'Порядок P2(0–4), P4(4–9), P1(9–17), P3(17–26): wait 9 + 0 + 17 + 4 = 30 → 30/4 = 7.5.', section: 'sjf', diff: 2 },
    { id: 'sch-16', type: 'single', q: 'Главная практическая проблема SJF:', options: ['высокий overhead на context switch', 'неизвестна длина следующего CPU burst', 'не работает с приоритетами', 'convoy effect'], answer: 1, explain: 'Длину следующего burst нужно спросить у пользователя или оценить (estimate).', section: 'sjf', diff: 1 },
    { id: 'sch-17', type: 'single', q: 'SRTF: P1 (arr 0, burst 8), P2 (1, 4), P3 (2, 9), P4 (3, 5). Average waiting time = ?', options: ['5.75', '6.5', '7.5', '8.75'], answer: 1, explain: 'Gantt: P1 0–1, P2 1–5, P4 5–10, P1 10–17, P3 17–26. Wait: 9 + 0 + 15 + 2 = 26 → 6.5.', section: 'srtf', diff: 3 },
    { id: 'sch-18', type: 'single', q: 'В примере SRTF выше в какой момент P1 возобновляет выполнение?', options: ['5', '9', '10', '17'], answer: 2, explain: 'P1 вытеснен в t=1 приходом P2 (4 < 7). После P2 (1–5) и P4 (5–10) остаток P1 = 7 меньше P3 = 9 → P1 возобновляется в 10.', section: 'srtf', diff: 3 },
    { id: 'sch-19', type: 'single', q: 'RR: n процессов в ready queue, квант q. Максимальное время ожидания до следующего кванта:', options: ['n·q', '(n − 1)·q', 'q / n', '(n + 1)·q'], answer: 1, explain: 'Перед процессом в очереди максимум n − 1 других, каждый занимает не больше q.', section: 'rr', diff: 2 },
    { id: 'sch-20', type: 'single', q: 'Что происходит с RR при очень большом кванте q?', options: ['Он превращается в SJF', 'Он превращается в FIFO (FCFS)', 'Растёт число context switch', 'Возникает starvation'], answer: 1, explain: 'Если q больше любого burst, каждый процесс выполняется до конца в порядке очереди — это FCFS.', section: 'rr', diff: 1 },
    { id: 'sch-21', type: 'single', q: 'RR, q = 4: P1=24, P2=3, P3=3 (все в 0). Когда завершится P3?', options: ['7', '10', '14', '30'], answer: 1, explain: 'P1 0–4, P2 4–7, P3 7–10 — P3 завершается в 10.', section: 'rr', diff: 2 },
    { id: 'sch-22', type: 'single', q: 'Процесс с burst 10, RR с квантом 1. Сколько context switch?', options: ['0', '1', '9', '10'], answer: 2, explain: 'По слайду: q = 12 → 0, q = 6 → 1, q = 1 → 9 переключений.', section: 'rr', diff: 2 },
    { id: 'sch-23', type: 'tf', q: 'По сравнению с SJF, RR обычно даёт большее average turnaround time, но лучший response time.', answer: true, explain: 'Это вывод со слайда примера RR (q = 4).', section: 'rr', diff: 1 },
    { id: 'sch-24', type: 'single', q: 'Решение проблемы starvation в priority scheduling:', options: ['Convoy', 'Aging', 'Увеличить квант', 'Dispatch latency'], answer: 1, explain: 'Aging — постепенное повышение приоритета ждущего процесса.', section: 'priority', diff: 1 },
    { id: 'sch-25', type: 'single', q: 'Non-preemptive priority (меньшее число = выше): P1(10, pr 3), P2(1, pr 1), P3(2, pr 4), P4(1, pr 5), P5(5, pr 2). Average waiting time = ?', options: ['6.2', '8.2', '9.6', '12'], answer: 1, explain: 'P2 0–1, P5 1–6, P1 6–16, P3 16–18, P4 18–19. Wait: 6 + 0 + 16 + 18 + 1 = 41 → 8.2.', section: 'priority', diff: 2 },
    { id: 'sch-26', type: 'single', q: 'SJF — частный случай priority scheduling, где priority =', options: ['время прихода', 'обратная величина предсказанного следующего CPU burst', 'номер процесса', 'оставшееся время ожидания'], answer: 1, explain: 'Чем короче ожидаемый burst, тем выше приоритет.', section: 'priority', diff: 2 },
    { id: 'sch-27', type: 'single', q: 'Priority + RR (q = 2): P1(4, pr 3), P2(5, pr 2), P3(8, pr 2), P4(7, pr 1), P5(3, pr 3). Когда P1 впервые получает CPU?', options: ['0', '7', '16', '20'], answer: 3, explain: 'Сначала P4 (pr 1) 0–7, затем P2 и P3 (pr 2) по RR до 20, только потом P1 и P5 (pr 3).', section: 'priority', diff: 3 },
    { id: 'sch-28', type: 'single', q: 'Чем Multilevel Feedback Queue отличается от Multilevel Queue?', options: ['Использует только FCFS', 'Процесс может перемещаться между очередями', 'Имеет одну очередь', 'Не поддерживает приоритеты'], answer: 1, explain: 'В MLQ процесс закреплён за очередью, в MLFQ — может быть понижен (demote) или повышен (upgrade).', section: 'mlfq', diff: 1 },
    { id: 'sch-29', type: 'single', q: 'MLFQ: Q0 — RR q=8, Q1 — RR q=16, Q2 — FCFS. Процесс с burst 30 ms. Сколько он выполнится в Q2?', options: ['0 ms', '6 ms', '14 ms', '22 ms'], answer: 1, explain: '8 ms в Q0, 16 ms в Q1, остаток 30 − 24 = 6 ms в Q2.', section: 'mlfq', diff: 2 },
    { id: 'sch-30', type: 'single', q: 'В MLQ с приоритизацией по типу процесса какая очередь имеет наивысший приоритет?', options: ['batch processes', 'interactive processes', 'system processes', 'real-time processes'], answer: 3, explain: 'Порядок сверху вниз: real-time → system → interactive → batch.', section: 'mlq', diff: 1 },
    { id: 'sch-31', type: 'single', q: 'Process-Contention Scope (PCS) используется в моделях…', options: ['только one-to-one', 'many-to-one и many-to-many', 'только в ядре Linux', 'только для kernel threads'], answer: 1, explain: 'В M:1 и M:M библиотека планирует user threads на LWP — конкуренция внутри процесса. One-to-one — SCS.', section: 'threads', diff: 2 },
    { id: 'sch-32', type: 'code', q: 'Программа запущена на Linux. Что она напечатает?', lang: 'c', code: 'pthread_attr_t attr;\nint scope;\npthread_attr_init(&attr);\npthread_attr_setscope(&attr, PTHREAD_SCOPE_PROCESS);\npthread_attr_getscope(&attr, &scope);\nif (scope == PTHREAD_SCOPE_PROCESS)\n    printf("PCS");\nelse if (scope == PTHREAD_SCOPE_SYSTEM)\n    printf("SCS");', options: ['PCS', 'SCS', 'Ничего: ошибка компиляции', 'PCS, затем SCS'], answer: 1, explain: 'Linux поддерживает только PTHREAD_SCOPE_SYSTEM: установка PCS не проходит (setscope возвращает ошибку), scope остаётся SYSTEM → печатается SCS.', section: 'threads', diff: 3 },
    { id: 'sch-33', type: 'single', q: 'Что такое LWP для user-thread library?', options: ['Физический процессор', 'Виртуальный процессор, на котором библиотека запускает user thread', 'Отдельный процесс', 'Очередь ready'], answer: 1, explain: 'LWP — промежуточная структура, выглядит для библиотеки как виртуальный процессор; каждый LWP привязан к kernel thread.', section: 'threads', diff: 2 },
    { id: 'sch-34', type: 'single', q: 'Quad-core процессор, 2 hardware threads на ядро. Сколько logical processors видит ОС?', options: ['2', '4', '6', '8'], answer: 3, explain: '4 ядра × 2 потока = 8 логических процессоров.', section: 'multicore', diff: 1 },
    { id: 'sch-35', type: 'single', q: 'Какую проблему решает chip-multithreading (несколько hardware threads на ядро)?', options: ['Starvation', 'Memory stall', 'Convoy effect', 'Deadlock'], answer: 1, explain: 'Пока один поток ждёт память, ядро выполняет другой hardware thread.', section: 'multicore', diff: 1 },
    { id: 'sch-36', type: 'tf', q: 'В multithreaded multicore системе два уровня планирования: ОС выбирает software thread для logical CPU, а ядро выбирает hardware thread для выполнения.', answer: true, explain: 'Именно так описаны два уровня на слайде.', section: 'multicore', diff: 2 },
    { id: 'sch-37', type: 'single', q: 'Какой алгоритм страдает от convoy effect сильнее всего?', options: ['RR', 'SRTF', 'FCFS', 'MLFQ'], answer: 2, explain: 'FCFS не вытесняет длинный процесс, поэтому короткие собираются «конвоем» за ним.', section: 'summary', diff: 1 },
    { id: 'sch-38', type: 'single', q: 'CPU–I/O Burst Cycle означает, что…', options: ['CPU и I/O никогда не работают одновременно', 'выполнение процесса чередует CPU burst и I/O burst', 'каждый процесс делает ровно один I/O', 'планировщик вызывается только при I/O'], answer: 1, explain: 'Процесс чередует вычисления (CPU burst) и ожидание I/O (I/O burst).', section: 'basics', diff: 1 }
  ]
});
