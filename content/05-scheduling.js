OS.addModule({
  id: 'scheduling',
  num: 5,
  group: 'theory',
  title: 'CPU Scheduling',
  titleRu: 'Планирование процессора',
  icon: '⏱',
  sources: ['5-Scheduling.pdf'],
  summary: 'Who gets the CPU next, and how we judge that choice: FCFS, SJF, SRTF, Round Robin, Priority, multilevel queues, thread and multicore scheduling.',
  bridge: 'In the Processes and Threads modules many processes are "ready" at the same time, but one CPU core can run only one of them at a time. This module answers the obvious next question: which one runs next, and for how long?',
  intro: `
<p>Multiprogramming keeps several processes in memory so the CPU never sits idle: while one process waits for I/O, another one can compute. That creates a <b>choice</b>: the ready queue holds many processes, and someone must pick the next one. That "someone" is the <b>CPU scheduler</b>, and the rule it uses is the <b>scheduling algorithm</b>.</p>
<p>The whole module follows one line of thought: first we see <i>when</i> a decision is needed and <i>who</i> carries it out (scheduler and dispatcher); then we define <i>how to measure</i> a good decision (criteria); then we try algorithms one by one — each new algorithm fixes a weakness of the previous one and introduces a new trade-off. At the end we see how the same ideas apply to threads and multicore CPUs.</p>`,
  sections: [
    {
      id: 'basics',
      h: 'Basic concepts — the CPU–I/O burst cycle',
      why: 'why scheduling is needed at all',
      lead: 'A process does not use the CPU all the time. It computes for a while, then waits for I/O, then computes again. Those waiting gaps are the reason scheduling exists.',
      html: `
<p>Watch any program run and you will see a repeating pattern: a stretch of computation called a <b>CPU burst</b>, followed by a stretch of waiting for input/output called an <b>I/O burst</b>. This is the <b>CPU–I/O burst cycle</b>. During an I/O burst the process does not need the CPU at all — so if nobody else uses the CPU, it is simply wasted.</p>
<p>The goal of multiprogramming is <b>maximum CPU utilization</b>: whenever the running process starts waiting, give the CPU to another process. For the scheduler, the most important property of a process is the length of its CPU bursts (short bursts = interactive / I/O-bound; long bursts = CPU-bound).</p>
<p>The <b>CPU scheduler</b> selects one process from the <b>ready queue</b> (processes in memory that are ready to run) and allocates a CPU core to it. The ready queue is not necessarily FIFO: it can be ordered by arrival, by priority, by burst length — that ordering <i>is</i> the algorithm.</p>
<p>The table compares one core with several cores. The key difference: on one core bursts of different processes take turns (time-slicing), on many cores they really overlap.</p>
<table class="t">
  <tr><th></th><th>Single-core CPU</th><th>Multi-core CPU</th></tr>
  <tr><td>Core allocation</td><td>one core handles all processes; CPU bursts wait in a queue, one runs at a time</td><td>the OS assigns processes to several cores; several CPU bursts run at the same time</td></tr>
  <tr><td>Method</td><td>time-slicing on one core; a context switch happens between bursts</td><td>multi-level scheduling across cores; bursts of different processes overlap</td></tr>
  <tr><td><b>CPU affinity</b></td><td>not applicable</td><td>optional: the OS can bind a process/thread to a specific core (Linux <code>taskset</code>)</td></tr>
  <tr><td>Performance</td><td>one process at a time — I/O bursts can leave the CPU idle</td><td>a single-threaded program still uses one core; threads of a multithreaded program run in parallel</td></tr>
  <tr><td>Examples</td><td>Windows 7, macOS 10.6, Linux before 2.6.23</td><td>Windows 10/11, Linux, macOS 11+</td></tr>
</table>
<p>So whether we have one core or many, there are more ready processes than cores, and a decision is needed again and again.</p>`,
      viz: [{ name: 'timeline', caption: 'One process alternates CPU bursts and I/O bursts. The grey gaps are time when the CPU could run someone else.', props: {
        max: 24, rows: [{ label: 'Process', segs: [
          { from: 0, to: 4, label: 'CPU', tone: 'acc' }, { from: 4, to: 9, label: 'I/O wait', tone: 'muted' },
          { from: 9, to: 12, label: 'CPU', tone: 'acc' }, { from: 12, to: 18, label: 'I/O wait', tone: 'muted' },
          { from: 18, to: 24, label: 'CPU', tone: 'acc' }] }] } }],
      takeaway: 'Processes alternate CPU bursts and I/O bursts. The scheduler fills the I/O gaps with other processes by choosing who runs next from the ready queue.'
    },
    {
      id: 'dispatcher',
      h: 'Scheduler vs dispatcher',
      why: 'who decides and who switches',
      lead: 'Choosing the next process is one job; actually handing the CPU over to it is another. The OS splits these two jobs between the scheduler and the dispatcher.',
      html: `
<p>Think of a restaurant: the <b>scheduler</b> is the host who decides which guest gets the next free table; the <b>dispatcher</b> is the waiter who actually walks the guest there and seats them. The decision is quick; the seating takes some time.</p>
<p>The <b>dispatcher</b> is the OS module that gives control of the CPU to the process selected by the scheduler. It does three things:</p>
<ol class="steps">
  <li><b>Switching context</b> — saves the registers of the old process into its PCB and loads the registers of the new one.</li>
  <li><b>Switching to user mode</b> — the OS runs in kernel mode; the user process must run in user mode.</li>
  <li><b>Jumping to the proper location</b> in the user program — continue exactly where that program stopped.</li>
</ol>
<p>All of this takes time during which no useful work is done. That time is called <b>dispatch latency</b>: the time the dispatcher needs to stop one process and start another. Because the dispatcher runs at every switch, it must be as fast as possible.</p>
<p>The table sums up the division of labour:</p>
<table class="t">
  <tr><th>Dispatcher</th><th>Scheduler</th></tr>
  <tr><td>Depends on the scheduler: waits until the scheduler has selected a process</td><td>Works independently, immediately when needed</td></tr>
  <tr><td>Has no algorithm of its own</td><td>Uses an algorithm: FCFS, SJF, RR, …</td></tr>
  <tr><td>Its time is the <b>dispatch latency</b></td><td>Its time is usually negligible</td></tr>
  <tr><td>Does the context switch, the switch to user mode and the jump</td><td>Its only job is to <b>select</b> the process</td></tr>
</table>`,
      viz: [{ name: 'flow', caption: 'The scheduler chooses, the dispatcher switches.', props: { dir: 'h', steps: [
        { label: 'Ready queue', sub: 'processes waiting for the CPU' },
        { label: 'CPU scheduler', sub: 'SELECTS a process', tone: 'acc' },
        { label: 'Dispatcher', sub: 'context switch → user mode → jump', tone: 'warn' },
        { label: 'Running', sub: 'the process uses the CPU', tone: 'ok' }] } }],
      takeaway: 'The scheduler decides (cheap); the dispatcher performs the switch (costly). Dispatch latency is pure overhead, paid at every switch.',
      exam: 'Scheduler = selection, dispatcher = context switch + user mode + jump. Definition of dispatch latency.'
    },
    {
      id: 'criteria',
      h: 'Scheduling criteria',
      why: 'how to compare algorithms',
      lead: 'Before comparing algorithms we must agree on what "better" means. Different users care about different things, so there are several criteria.',
      html: `
<p>The system owner wants the hardware to be busy and to finish many jobs. A user at the keyboard wants a quick reaction. A single job wants to finish soon. Each of these wishes is one criterion. Two of them we want <b>as high as possible</b>, three <b>as low as possible</b>:</p>
<table class="t">
  <tr><th>Criterion</th><th>Meaning</th><th>Goal</th></tr>
  <tr><td><b>CPU utilization</b></td><td>fraction of time the CPU is busy</td><td>max</td></tr>
  <tr><td><b>Throughput</b></td><td>number of processes completed per time unit</td><td>max</td></tr>
  <tr><td><b>Turnaround time</b></td><td>total time to execute one process: from arrival to completion</td><td>min</td></tr>
  <tr><td><b>Waiting time</b></td><td>total time the process spends <b>waiting in the ready queue</b></td><td>min</td></tr>
  <tr><td><b>Response time</b></td><td>time from submitting a request until the <b>first</b> response is produced (not the end of the output)</td><td>min</td></tr>
</table>
<p>For exercises you only need three formulas. Note that waiting time counts only the time in the <i>ready</i> queue — the scheduler cannot change how long a process computes, it can only change how long it waits.</p>
<div class="formula">Turnaround = Completion − Arrival<br>Waiting = Turnaround − Burst<br>Response = First time on CPU − Arrival</div>
<div class="callout warn">Common confusion: <b>waiting</b> time is the <i>sum</i> of all waits in the ready queue; <b>response</b> time is only the wait until the <i>first</i> run.</div>`,
      takeaway: 'Maximize CPU utilization and throughput; minimize turnaround, waiting and response time. Algorithms are judged mostly by average waiting time.',
      exam: 'Which criteria are maximized vs minimized; difference between waiting and response time; computing them from a Gantt chart.'
    },
    {
      id: 'preemption',
      h: 'Preemptive vs non-preemptive scheduling',
      why: 'when the OS may take the CPU away',
      lead: 'Now we know who decides and how to judge. The next question is: at which moments is a decision made — and is the OS allowed to take the CPU away from a running process?',
      html: `
<p>A scheduling decision can be needed when a process:</p>
<ol>
  <li>switches from <b>running → waiting</b> (it requested I/O or called <code>wait()</code>);</li>
  <li>switches from <b>running → ready</b> (an interrupt, e.g. the timer, stopped it);</li>
  <li>switches from <b>waiting → ready</b> (its I/O completed);</li>
  <li><b>terminates</b>.</li>
</ol>
<p>In cases <b>1 and 4</b> there is no choice: the running process gave up the CPU, so a new one <i>must</i> be selected. In cases <b>2 and 3</b> there <i>is</i> a choice: the OS may let the current process continue, or switch.</p>
<div class="callout key">If scheduling happens <b>only in cases 1 and 4</b>, the scheme is <b>non-preemptive</b> (cooperative): once a process has the CPU, it keeps it until it terminates or blocks. If the OS also decides in cases <b>2 and 3</b>, the scheme is <b>preemptive</b>: the OS can take the CPU away.</div>
<p>Each choice has a price, as the two columns show:</p>
<div class="cols">
  <div><b>Non-preemptive</b>
    <div class="pros"><b>+</b><ul><li>minimal overhead (few switches)</li><li>very simple to implement</li><li>higher throughput</li></ul></div>
    <div class="cons"><b>−</b><ul><li>poor average response time: everyone waits for those ahead</li><li>rigid: a long process holds the CPU until it finishes</li></ul></div>
  </div>
  <div><b>Preemptive</b>
    <div class="pros"><b>+</b><ul><li>no process can monopolize the CPU</li><li>better average response time</li><li>a higher-priority process can take the CPU immediately</li></ul></div>
    <div class="cons"><b>−</b><ul><li>extra time for interrupts and context switches</li><li><b>starvation</b> of low-priority processes is possible</li><li><b>race conditions</b> on shared data</li></ul></div>
  </div>
</div>
<div class="callout warn"><b>Why preemption causes race conditions:</b> process A is preempted in the middle of updating shared data; process B runs and reads that data in a half-updated (inconsistent) state. This problem is solved in the Synchronization module.</div>
<p>The comparison table and the real-world examples show where each style is used:</p>
<table class="t">
  <tr><th></th><th>Preemptive</th><th>Non-preemptive</th></tr>
  <tr><td>Algorithms</td><td>Round Robin, SRTF, preemptive Priority</td><td>FCFS, SJF (SJN), non-preemptive Priority</td></tr>
  <tr><td>Responsiveness</td><td>high — good for interactive systems</td><td>low — may wait behind a long process</td></tr>
  <tr><td>Context switches</td><td>frequent — higher overhead</td><td>rare — lower overhead</td></tr>
  <tr><td>Used in</td><td>time-sharing, interactive GUIs, soft real-time</td><td>batch systems, simple embedded systems, hard real-time with known workload</td></tr>
</table>
<table class="t">
  <tr><th>OS</th><th>Scheduling</th></tr>
  <tr><td>Windows</td><td>preemptive Priority + Round Robin for time-sharing</td></tr>
  <tr><td>Linux</td><td><b>CFS — Completely Fair Scheduler</b> (preemptive, aims at fairness)</td></tr>
  <tr><td>macOS</td><td>preemptive Priority + time-sharing</td></tr>
  <tr><td>RTOS (e.g. FreeRTOS)</td><td>preemptive Priority</td></tr>
  <tr><td>Early UNIX batch jobs, old DOS, µC/OS-II</td><td>non-preemptive (FCFS / SJN; programs give up the CPU themselves)</td></tr>
</table>
<p>Conclusion from the examples: all modern general-purpose OSes (Windows, macOS, Linux, UNIX) are <b>preemptive</b>; non-preemptive scheduling survives where simplicity and predictability matter more than responsiveness.</p>`,
      viz: [{ name: 'procStates', caption: 'The four decision points on the process state diagram: (1) running→waiting, (2) running→ready, (3) waiting→ready, (4) exit.', props: { decisions: true } }],
      takeaway: 'Non-preemptive = decide only when the process blocks (1) or exits (4). Preemptive = the OS may also interrupt it (2, 3) — better response, but more overhead, possible starvation and race conditions.',
      exam: 'The four situations and which ones define a non-preemptive scheme; examples of preemptive and non-preemptive algorithms.'
    },
    {
      id: 'fcfs',
      h: 'First-Come, First-Served (FCFS)',
      why: 'the simplest possible rule',
      lead: 'The most obvious rule is a queue at a shop: whoever comes first is served first. It is fair and simple — but we will see that it can be very slow on average.',
      html: `
<p><b>FCFS</b> runs processes in order of arrival. It is implemented with a <b>FIFO ready queue</b>: a new process's PCB is linked to the <b>tail</b>; when the CPU is free it is given to the process at the <b>head</b>, which is removed from the queue. FCFS is <b>non-preemptive</b>: the process keeps the CPU until it finishes its burst.</p>
<p>Let us compute the slide example. Three processes arrive at time 0 with bursts P1 = 24, P2 = 3, P3 = 3. If they arrive in the order P1, P2, P3, the two short processes must wait behind the long one:</p>
<div class="formula">Order P1(24), P2(3), P3(3): waits = 0, 24, 27 → average = 51 / 3 = <b>17</b></div>
<p>Now the same three processes in the order P2, P3, P1: the short ones finish quickly and only P1 waits a little.</p>
<div class="formula">Order P2(3), P3(3), P1(24): waits = 6, 0, 3 → average = 9 / 3 = <b>3</b></div>
<p>Same work, average waiting time 17 vs 3. So FCFS performance is <b>unpredictable</b>: it depends only on the order of arrival. The bad case has a name — the <b>convoy effect</b>: many short processes stuck behind one long process, like cars behind a slow truck. A typical case is one CPU-bound process followed by many I/O-bound ones: the I/O devices sit idle while everybody waits for the CPU hog.</p>
<div data-viz="0"></div>
<div data-viz="1"></div>`,
      viz: [
        { name: 'scheduler', caption: 'Slide example, arrival order P1, P2, P3 — average waiting time 17.', props: { algo: 'FCFS', processes: [{ name: 'P1', arrival: 0, burst: 24 }, { name: 'P2', arrival: 0, burst: 3 }, { name: 'P3', arrival: 0, burst: 3 }] } },
        { name: 'scheduler', caption: 'Same processes in order P2, P3, P1 — the convoy effect disappears (average 3).', props: { algo: 'FCFS', lockAlgo: true, processes: [{ name: 'P2', arrival: 0, burst: 3 }, { name: 'P3', arrival: 0, burst: 3 }, { name: 'P1', arrival: 0, burst: 24 }] } }
      ],
      takeaway: 'FCFS is simple and non-preemptive, but a long process at the front makes everyone wait (convoy effect). The fix suggests itself: run short jobs first.',
      exam: 'Compute average waiting time from a Gantt chart; explain the convoy effect.'
    },
    {
      id: 'sjf',
      h: 'Shortest-Job-First (SJF)',
      why: 'fix the convoy: short jobs first',
      lead: 'FCFS showed that putting short processes first gave average waiting 3 instead of 17. SJF turns that observation into a rule.',
      html: `
<p><b>SJF</b> associates with each process the length of its <b>next CPU burst</b> and always runs the process with the <b>shortest</b> one. Why does this help? A short job that runs first makes everyone else wait only a little; a long job that runs first makes everyone wait a lot. Putting short jobs first therefore minimizes the total waiting.</p>
<div class="callout key">SJF is <b>optimal</b>: it gives the <b>minimum average waiting time</b> for a given set of processes.</div>
<p>Slide example (all arrive at time 0): P1 = 8, P2 = 4, P3 = 9, P4 = 5. Sorted by burst: P2, P4, P1, P3.</p>
<div class="formula">Gantt: P2 0–4 | P4 4–9 | P1 9–17 | P3 17–26<br>waits: P1 = 9, P2 = 0, P3 = 17, P4 = 4 → average = 30 / 4 = <b>7.5</b></div>
<p>SJF can be <b>non-preemptive</b> (once started, a process finishes its burst) or <b>preemptive</b> — the preemptive version is called <b>shortest-remaining-time-first</b> (next section).</p>
<div class="callout warn"><b>The catch:</b> the OS does not know the length of the next CPU burst in advance. It can <b>ask the user</b> (possible in batch systems) or <b>estimate</b> it from the lengths of previous bursts. So SJF is an ideal that real schedulers can only approximate.</div>`,
      viz: [{ name: 'scheduler', caption: 'Slide example, all processes arrive at 0 — average waiting time 7.5.', props: { algo: 'SJF', processes: [{ name: 'P1', arrival: 0, burst: 8 }, { name: 'P2', arrival: 0, burst: 4 }, { name: 'P3', arrival: 0, burst: 9 }, { name: 'P4', arrival: 0, burst: 5 }] } }],
      takeaway: 'SJF gives the minimum average waiting time, but needs the next burst length, which must be guessed. Long jobs can wait for a long time.',
      exam: 'SJF is optimal for average waiting time; its main practical problem is knowing the next burst length.'
    },
    {
      id: 'srtf',
      h: 'Shortest Remaining Time First (SRTF)',
      why: 'SJF that reacts to new arrivals',
      lead: 'Non-preemptive SJF cannot react when a very short process arrives while a long one is running. If we allow preemption, we get SRTF.',
      html: `
<p><b>SRTF</b> is the <b>preemptive version of SJF</b>. Every time a new process arrives in the ready queue, the decision is made again: the process with the shortest <b>remaining</b> time runs. If the newcomer's burst is shorter than what the running process still needs, the running process is preempted.</p>
<p>Slide example with different arrival times:</p>
<table class="t">
  <tr><th>Process</th><th>Arrival</th><th>Burst</th></tr>
  <tr><td>P1</td><td>0</td><td>8</td></tr><tr><td>P2</td><td>1</td><td>4</td></tr><tr><td>P3</td><td>2</td><td>9</td></tr><tr><td>P4</td><td>3</td><td>5</td></tr>
</table>
<p>Step by step: at t = 0 only P1 exists, so it runs. At t = 1 P2 arrives needing 4, while P1 still needs 7 → P1 is preempted and P2 runs. P3 (9) and P4 (5) arrive but are not shorter than P2's remainder. P2 finishes at 5; now the shortest is P4 (5) → runs 5–10. Then P1 (7 left) runs 10–17, and finally P3 runs 17–26.</p>
<div class="formula">Gantt: P1 0–1 | P2 1–5 | P4 5–10 | P1 10–17 | P3 17–26<br>waits = (10 − 1 − 0) + (1 − 1) + (17 − 2) + (5 − 3) = 9 + 0 + 15 + 2 = 26 → average = 26 / 4 = <b>6.5</b></div>
<div class="callout note">For a preempted process count all its waiting: wait = T<sub>resume</sub> − T<sub>executed before</sub> − T<sub>arrival</sub> (P1: 10 − 1 − 0 = 9). For the others: wait = T<sub>start</sub> − T<sub>arrival</sub>.</div>
<p>Compare: 6.5 is better than non-preemptive SJF on the same data, because P2 did not have to wait behind P1.</p>`,
      viz: [{ name: 'scheduler', caption: 'Slide example: SRTF with different arrival times — average waiting time 6.5.', props: { algo: 'SRTF', processes: [{ name: 'P1', arrival: 0, burst: 8 }, { name: 'P2', arrival: 1, burst: 4 }, { name: 'P3', arrival: 2, burst: 9 }, { name: 'P4', arrival: 3, burst: 5 }] } }],
      takeaway: 'SRTF = preemptive SJF: re-decide at every arrival, run the shortest remaining time. Even lower average waiting, but more context switches and the same need to know burst lengths.',
      exam: 'Draw the Gantt chart for SRTF with arrival times and compute the average waiting time (6.5).'
    },
    {
      id: 'rr',
      h: 'Round Robin (RR)',
      why: 'fairness and quick response',
      lead: 'SJF and SRTF optimize waiting time but need burst lengths and can delay long jobs. Interactive systems care more about everyone getting the CPU soon. Round Robin gives each process a short turn, in a circle.',
      html: `
<p>In <b>Round Robin</b> each process gets a small unit of CPU time, the <b>time quantum q</b> (usually <b>10–100 milliseconds</b>). When the quantum expires, a <b>timer interrupt</b> preempts the process and puts it at the <b>end of the ready queue</b>; the next process at the head runs. A process that finishes or blocks before the quantum ends simply gives up the CPU early.</p>
<p>This gives a clear guarantee. With n processes in the ready queue and quantum q, each process gets 1/n of the CPU time in chunks of at most q, and <b>no process waits more than (n − 1)·q</b> time units before its next turn (at most n − 1 others run before it, each for at most q).</p>
<p>Slide example with q = 4 and P1 = 24, P2 = 3, P3 = 3 (all arrive at 0):</p>
<div class="formula">Gantt: P1 0–4 | P2 4–7 | P3 7–10 | P1 10–14 | 14–18 | 18–22 | 22–26 | 26–30<br>waits: P1 = 10 − 4 = 6, P2 = 4, P3 = 7 → average = 17 / 3 ≈ <b>5.67</b></div>
<p>Typically RR gives a <b>higher average turnaround than SJF, but better response</b>: every process starts within a few quanta.</p>
<p>Everything depends on choosing q. The slide's figure shows a process of length 10 with three different quanta — the smaller the quantum, the more context switches:</p>
<table class="t">
  <tr><th>Process time = 10</th><th>Quantum</th><th>Context switches</th></tr>
  <tr><td>0 ———————— 10</td><td>12</td><td>0</td></tr>
  <tr><td>0 —— 6 —— 10</td><td>6</td><td>1</td></tr>
  <tr><td>0|1|2|…|9|10</td><td>1</td><td>9</td></tr>
</table>
<div class="cols">
  <div class="callout key"><b>q too large</b> → every process finishes within one quantum, so RR behaves exactly like <b>FIFO (FCFS)</b>.</div>
  <div class="callout warn"><b>q too small</b> → the CPU spends its time switching. q must be large compared with the context-switch time (which is <b>&lt; 10 microseconds</b>).</div>
</div>`,
      viz: [{ name: 'scheduler', caption: 'Slide example: RR with q = 4. Change the quantum and watch the number of context switches.', props: { algo: 'RR', quantum: 4, processes: [{ name: 'P1', arrival: 0, burst: 24 }, { name: 'P2', arrival: 0, burst: 3 }, { name: 'P3', arrival: 0, burst: 3 }] } }],
      takeaway: 'RR = FCFS + a time quantum + preemption. Good response and fairness; the quantum must be much larger than a context switch, otherwise overhead dominates, but not so large that RR degenerates into FCFS.',
      exam: 'Gantt chart for RR; the (n − 1)·q bound; what happens with a very large or very small quantum.'
    },
    {
      id: 'priority',
      h: 'Priority scheduling (and Priority + RR)',
      why: 'important work first',
      lead: 'Some processes are simply more important than others (system tasks vs a background download). Priority scheduling makes importance the rule — and SJF turns out to be a special case of it.',
      html: `
<p>Each process gets a <b>priority number</b> (an integer). The CPU goes to the process with the highest priority; on the slides the <b>smallest integer = highest priority</b>. Priority scheduling can be <b>preemptive</b> (a newly arrived higher-priority process takes the CPU at once) or <b>non-preemptive</b> (it waits for the current burst to end).</p>
<p><b>SJF is a priority algorithm</b> where the priority is the inverse of the predicted next CPU burst: the shorter the burst, the higher the priority.</p>
<div class="callout warn"><b>Problem — starvation:</b> if high-priority processes keep arriving, a low-priority process may <b>never</b> run. <b>Solution — aging:</b> as time passes, gradually increase the priority of a process that keeps waiting, so eventually it becomes the most important one.</div>
<p>Slide example (non-preemptive, all arrive at 0). Order by priority number: P2 (1), P5 (2), P1 (3), P3 (4), P4 (5).</p>
<div class="formula">P1(burst 10, pr 3), P2(1, pr 1), P3(2, pr 4), P4(1, pr 5), P5(5, pr 2)<br>Gantt: P2 0–1 | P5 1–6 | P1 6–16 | P3 16–18 | P4 18–19 → waits = 6, 0, 16, 18, 1 → average = 41 / 5 = <b>8.2</b></div>
<div data-viz="0"></div>
<p>What if several processes have the <b>same</b> priority? Combine the two ideas: <b>Priority + Round Robin</b> — run the highest-priority process; processes with equal priority share the CPU round-robin.</p>
<div class="formula">q = 2: P4 0–7 (alone at priority 1) | P2 and P3 alternate (priority 2): P2 7–9 | P3 9–11 | P2 11–13 | P3 13–15 | P2 15–16 | P3 16–20 | then P1 and P5 (priority 3): P1 20–22 | P5 22–24 | P1 24–26 | P5 26–27</div>
<div data-viz="1"></div>`,
      viz: [
        { name: 'scheduler', caption: 'Slide example: non-preemptive priority, average waiting time 8.2.', props: { algo: 'PRIO', processes: [{ name: 'P1', arrival: 0, burst: 10, priority: 3 }, { name: 'P2', arrival: 0, burst: 1, priority: 1 }, { name: 'P3', arrival: 0, burst: 2, priority: 4 }, { name: 'P4', arrival: 0, burst: 1, priority: 5 }, { name: 'P5', arrival: 0, burst: 5, priority: 2 }] } },
        { name: 'scheduler', caption: 'Slide example: Priority + RR with q = 2.', props: { algo: 'PRIO_RR', quantum: 2, processes: [{ name: 'P1', arrival: 0, burst: 4, priority: 3 }, { name: 'P2', arrival: 0, burst: 5, priority: 2 }, { name: 'P3', arrival: 0, burst: 8, priority: 2 }, { name: 'P4', arrival: 0, burst: 7, priority: 1 }, { name: 'P5', arrival: 0, burst: 3, priority: 3 }] } }
      ],
      takeaway: 'Highest priority (smallest number) runs first; SJF is priority by burst length. The danger is starvation, cured by aging. Equal priorities can be shared with RR.',
      exam: 'Starvation and aging; SJF as a special case of priority; compute the average waiting time (8.2).'
    },
    {
      id: 'mlq',
      h: 'Multilevel Queue (MLQ)',
      why: 'different policies for different process types',
      lead: 'One queue with one algorithm treats all processes the same. But an interactive editor and a nightly batch job have very different needs. Multilevel queues give each class its own queue.',
      html: `
<p>In a <b>multilevel queue</b> the ready queue is split into <b>several queues</b>, one per class of processes. Each process is placed in one queue and <b>stays there</b>. With priority scheduling the simplest version is one queue per priority level: the scheduler always takes a process from the <b>highest-priority non-empty queue</b>.</p>
<p>A typical split is by process type, from highest to lowest priority: real-time → system → interactive → batch (see the diagram). Each queue can use its own algorithm, e.g. RR for interactive processes and FCFS for batch.</p>
<p>To define a multilevel queue scheduler you must specify:</p>
<ul>
  <li>the number of queues;</li>
  <li>the scheduling algorithm for each queue;</li>
  <li>the method that decides which queue a process enters;</li>
  <li>the scheduling <b>among</b> the queues (e.g. fixed priority between queues).</li>
</ul>
<p>The weak point: a process can never change queue, so a batch process may starve if interactive work never stops — and a process whose behaviour changes stays in the wrong class.</p>`,
      viz: [{ name: 'layers', caption: 'Prioritization based on process type.', props: { top: 'highest priority', bottom: 'lowest priority', layers: [
        { label: 'real-time processes', tone: 'bad' }, { label: 'system processes', tone: 'warn' },
        { label: 'interactive processes', tone: 'acc' }, { label: 'batch processes', tone: 'muted' }] } }],
      takeaway: 'MLQ = several ready queues, one per process class, each with its own algorithm; a process is fixed to its queue. The fixed assignment is the limitation that MLFQ removes.'
    },
    {
      id: 'mlfq',
      h: 'Multilevel Feedback Queue (MLFQ)',
      why: 'let processes move between queues',
      lead: 'MLQ fixes each process to one queue forever. MLFQ lets the scheduler move processes between queues based on how they behave — this is how it learns which processes are short and which are long without being told.',
      html: `
<p>A <b>multilevel feedback queue</b> is a multilevel queue in which a process <b>can move</b> between queues. A process that uses too much CPU is moved down (<b>demoted</b>); a process that waits too long can be moved up (<b>upgraded</b>). Moving long-waiting processes up is exactly <b>aging</b>, so MLFQ is also a cure for starvation.</p>
<p>An MLFQ scheduler is defined by: the number of queues; the algorithm for each queue; the method to <b>upgrade</b> a process; the method to <b>demote</b> a process; the method that decides which queue a process enters when it needs service.</p>
<p><b>Slide example</b> with three queues:</p>
<ul>
  <li><b>Q0</b> — RR with quantum 8 ms; <b>Q1</b> — RR with quantum 16 ms; <b>Q2</b> — FCFS.</li>
  <li>A new process enters Q0 and gets 8 ms. If it does not finish, it moves to Q1 and gets 16 more ms. If it still does not finish, it is preempted and moved to Q2, where it runs FCFS.</li>
</ul>
<p>The effect: short (interactive) bursts finish quickly in the top queue with high priority; long CPU-bound jobs sink to the bottom and run when nothing more urgent exists — without anyone telling the scheduler the burst lengths.</p>
<div class="formula">Burst = 30 ms: 8 ms in Q0 → 16 ms in Q1 → remaining 6 ms in Q2</div>`,
      viz: [{ name: 'mlfq', caption: 'A process with a 30 ms burst sinks through the queues. Move the slider to try other burst lengths.', props: { queues: [{ label: 'Q0', algo: 'RR q=8' }, { label: 'Q1', algo: 'RR q=16' }, { label: 'Q2', algo: 'FCFS' }], burst: 30 } }],
      takeaway: 'MLFQ = MLQ where processes move: CPU hogs are demoted, long waiters are upgraded (aging). It approximates SJF without knowing burst lengths.',
      exam: 'Difference between MLQ (fixed queue) and MLFQ (processes move); trace the Q0/Q1/Q2 example.'
    },
    {
      id: 'threads',
      h: 'Thread scheduling — PCS and SCS',
      why: 'the same question for threads',
      lead: 'So far we scheduled processes. On a system with threads, the OS actually schedules threads — and depending on the threading model, there are two levels at which threads compete.',
      html: `
<p>When threads are supported, it is <b>threads</b> that are scheduled, not processes. Remember the distinction between <b>user-level threads</b> (managed by a thread library) and <b>kernel-level threads</b> (managed by the OS).</p>
<p>In the <b>many-to-one</b> and <b>many-to-many</b> models, the thread library schedules user threads onto <b>LWPs (lightweight processes)</b>:</p>
<ul>
  <li>An LWP is an intermediate data structure between user and kernel threads. To the thread library it looks like a <b>virtual processor</b> on which it can run a user thread.</li>
  <li>Each LWP is attached to a kernel thread, and the OS schedules kernel threads onto physical CPUs.</li>
  <li>Because user threads compete only with other threads <b>of the same process</b> for the LWPs, this is called <b>Process-Contention Scope (PCS)</b>. It is usually priority-based, with priorities set by the programmer.</li>
  <li>If a kernel thread blocks (e.g. waiting for I/O), its LWP blocks too, and so does the user thread attached to it.</li>
</ul>
<p>In the <b>one-to-one</b> model every user thread is a kernel thread, so the kernel schedules it onto a CPU in competition with <b>all threads in the system</b>: this is <b>System-Contention Scope (SCS)</b>.</p>
<p>Pthreads lets the programmer choose the scope at thread creation:</p>
<table class="t">
  <tr><th>Pthread constant</th><th>Scope</th></tr>
  <tr><td><code>PTHREAD_SCOPE_PROCESS</code></td><td>PCS</td></tr>
  <tr><td><code>PTHREAD_SCOPE_SYSTEM</code></td><td>SCS</td></tr>
</table>
<div class="callout warn">The OS may limit the choice: <b>Linux and macOS allow only PTHREAD_SCOPE_SYSTEM</b> (they use the one-to-one model).</div>
<pre class="code" data-lang="c">pthread_attr_t attr;
pthread_attr_init(&amp;attr);                          /* default attributes */
pthread_attr_getscope(&amp;attr, &amp;scope);              /* ask for the current scope */
pthread_attr_setscope(&amp;attr, PTHREAD_SCOPE_SYSTEM); /* choose PCS or SCS */
for (i = 0; i &lt; NUM_THREADS; i++)
    pthread_create(&amp;tid[i], &amp;attr, runner, NULL);
for (i = 0; i &lt; NUM_THREADS; i++)
    pthread_join(tid[i], NULL);</pre>`,
      viz: [{ name: 'flow', caption: 'PCS: the chain from a user thread to the CPU.', props: { dir: 'h', steps: [
        { label: 'User thread', sub: 'scheduled by the library' }, { label: 'LWP', sub: '"virtual processor"', tone: 'acc' },
        { label: 'Kernel thread', sub: 'scheduled by the OS', tone: 'warn' }, { label: 'CPU', tone: 'ok' }] } }],
      takeaway: 'PCS: user threads compete within their process for LWPs (M:1, M:M). SCS: kernel threads compete with all threads in the system (1:1). Linux and macOS support only SCS.',
      exam: 'PCS vs SCS, the role of the LWP, which scope Linux/macOS support.'
    },
    {
      id: 'multicore',
      h: 'Multithreaded multicore systems (CMT)',
      why: 'scheduling inside one core',
      lead: 'Even a running thread wastes time: whenever it waits for memory, the core stalls. Modern cores hide this by keeping several hardware threads ready — which adds a second level of scheduling.',
      html: `
<p>Accessing main memory takes much longer than executing an instruction, so a core often sits idle in a <b>memory stall</b>, waiting for data. <b>Chip-multithreading (CMT)</b> gives each core several <b>hardware threads</b> (Intel calls this <b>hyperthreading</b>). When one hardware thread stalls on memory, the core switches to another one and keeps working.</p>
<p>To the OS, every hardware thread looks like a separate CPU: a quad-core processor with 2 hardware threads per core appears as <b>8 logical processors</b>. Examples: Intel Core i7 — 2 threads per core; SPARC M7 — 8 cores × 8 threads per core.</p>
<p>So there are <b>two levels of scheduling</b>:</p>
<ol class="steps">
  <li>The <b>operating system</b> decides which <b>software thread</b> runs on each <b>logical CPU</b> (using the algorithms of this module).</li>
  <li>Each <b>core</b> decides which of its <b>hardware threads</b> runs on the physical core at each moment.</li>
</ol>`,
      viz: [{ name: 'timeline', caption: 'Memory stall: the core switches between two hardware threads, so compute (C) never stops.', props: {
        max: 16, rows: [
          { label: 'thread 0', segs: [{ from: 0, to: 3, label: 'C', tone: 'acc' }, { from: 3, to: 7, label: 'M stall', tone: 'muted' }, { from: 7, to: 10, label: 'C', tone: 'acc' }, { from: 10, to: 14, label: 'M stall', tone: 'muted' }] },
          { label: 'thread 1', segs: [{ from: 3, to: 6, label: 'C', tone: 'ok' }, { from: 6, to: 10, label: 'M stall', tone: 'muted' }, { from: 10, to: 13, label: 'C', tone: 'ok' }] }] } }],
      takeaway: 'CMT/hyperthreading hides memory stalls by switching hardware threads inside a core. The OS sees logical CPUs (cores × threads) and schedules on them; the core schedules its hardware threads.'
    },
    {
      id: 'summary',
      h: 'Summary: comparing the algorithms',
      why: 'see the whole chain at once',
      lead: 'Each algorithm in this module was introduced to fix a weakness of the previous one. Seeing them side by side makes the chain clear.',
      html: `
<p>Read the table top to bottom as a story: FCFS is simple but suffers from the convoy effect → SJF fixes average waiting but needs burst lengths → SRTF adds preemption → RR gives up optimal waiting for fairness and response → Priority adds importance (and starvation, fixed by aging) → MLQ separates process classes → MLFQ lets processes move, combining all ideas.</p>
<table class="t">
  <tr><th>Algorithm</th><th>Preemptive?</th><th>Picks</th><th>Strength</th><th>Weakness</th></tr>
  <tr><td><b>FCFS</b></td><td>no</td><td>first arrived</td><td>simple</td><td>convoy effect</td></tr>
  <tr><td><b>SJF</b></td><td>no</td><td>shortest next burst</td><td>minimum average waiting</td><td>burst length unknown; long jobs may starve</td></tr>
  <tr><td><b>SRTF</b></td><td>yes</td><td>shortest remaining time</td><td>even lower waiting</td><td>many switches; burst length unknown</td></tr>
  <tr><td><b>RR</b></td><td>yes (timer)</td><td>next in the circle, quantum q</td><td>good response, fair</td><td>higher turnaround than SJF</td></tr>
  <tr><td><b>Priority</b></td><td>either</td><td>smallest priority number</td><td>important work first</td><td>starvation → aging</td></tr>
  <tr><td><b>MLQ</b></td><td>—</td><td>queue chosen by process class</td><td>different policy per class</td><td>a process cannot change queue</td></tr>
  <tr><td><b>MLFQ</b></td><td>—</td><td>queue changes with behaviour</td><td>flexible, implements aging</td><td>many parameters to tune</td></tr>
</table>`,
      takeaway: 'No algorithm is best for everything: you always trade average waiting, response time, fairness and overhead against each other.'
    }
  ],
  terms: [
    { en: 'CPU–I/O burst cycle', ru: 'цикл CPU–I/O', def: 'Process execution alternates CPU bursts (computation) and I/O bursts (waiting for I/O).' },
    { en: 'CPU burst', ru: 'интервал работы на CPU', def: 'A stretch of time in which a process computes on the CPU.' },
    { en: 'I/O burst', ru: 'интервал ожидания ввода-вывода', def: 'A stretch of time in which a process waits for an I/O operation.' },
    { en: 'CPU scheduler', ru: 'планировщик процессора', def: 'Selects a process from the ready queue and allocates a CPU core to it.' },
    { en: 'Ready queue', ru: 'очередь готовых процессов', def: 'Processes in memory that are ready to run and wait for the CPU.' },
    { en: 'Dispatcher', ru: 'диспетчер', def: 'Gives the CPU to the selected process: context switch, switch to user mode, jump to the right location.' },
    { en: 'Dispatch latency', ru: 'задержка диспетчеризации', def: 'Time the dispatcher needs to stop one process and start another.' },
    { en: 'CPU utilization', ru: 'загрузка процессора', def: 'Fraction of time the CPU is busy (maximize).' },
    { en: 'Throughput', ru: 'пропускная способность', def: 'Number of processes completed per time unit (maximize).' },
    { en: 'Turnaround time', ru: 'время оборота', def: 'Time from arrival to completion of a process: completion − arrival.' },
    { en: 'Waiting time', ru: 'время ожидания', def: 'Total time a process spends in the ready queue: turnaround − burst.' },
    { en: 'Response time', ru: 'время отклика', def: 'Time from submitting a request until the first response (first run).' },
    { en: 'Non-preemptive scheduling', ru: 'невытесняющее планирование', def: 'Decisions only when the running process blocks or terminates; the process gives up the CPU itself.' },
    { en: 'Preemptive scheduling', ru: 'вытесняющее планирование', def: 'The OS can take the CPU away from a running process (also on running→ready and waiting→ready).' },
    { en: 'Context switch', ru: 'переключение контекста', def: 'Saving the state of one process and loading the state of another.' },
    { en: 'Convoy effect', ru: 'эффект конвоя', def: 'In FCFS, short processes wait behind one long process.' },
    { en: 'Shortest-Job-First', ru: 'сначала самая короткая задача', def: 'Run the process with the shortest next CPU burst; gives the minimum average waiting time.' },
    { en: 'Shortest Remaining Time First', ru: 'сначала наименьшее оставшееся время', def: 'Preemptive SJF: at each arrival, run the process with the least remaining time.' },
    { en: 'Round Robin', ru: 'циклическое планирование', def: 'Each process runs for at most one time quantum, then goes to the end of the ready queue.' },
    { en: 'Time quantum', ru: 'квант времени', def: 'The slice of CPU time in Round Robin (10–100 ms).' },
    { en: 'Priority scheduling', ru: 'приоритетное планирование', def: 'The process with the highest priority (smallest number) runs first.' },
    { en: 'Starvation', ru: 'голодание', def: 'A low-priority process waits indefinitely and never gets the CPU.' },
    { en: 'Aging', ru: 'старение', def: 'Gradually increasing the priority of a waiting process; the cure for starvation.' },
    { en: 'Multilevel queue', ru: 'многоуровневая очередь', def: 'Several ready queues, one per process class, each with its own algorithm; a process stays in its queue.' },
    { en: 'Multilevel feedback queue', ru: 'многоуровневая очередь с обратной связью', def: 'A multilevel queue in which processes move between queues (demote/upgrade); implements aging.' },
    { en: 'Lightweight process', ru: 'облегчённый процесс', def: 'LWP: a structure between user and kernel threads that looks like a virtual processor to the thread library.' },
    { en: 'Process-Contention Scope', ru: 'конкуренция внутри процесса', def: 'PCS: user threads compete with threads of the same process (M:1, M:M); PTHREAD_SCOPE_PROCESS.' },
    { en: 'System-Contention Scope', ru: 'конкуренция в масштабе системы', def: 'SCS: kernel threads compete with all threads in the system (1:1); PTHREAD_SCOPE_SYSTEM.' },
    { en: 'Chip-multithreading', ru: 'аппаратная многопоточность', def: 'CMT: several hardware threads per core (Intel hyperthreading) to hide memory stalls.' },
    { en: 'Memory stall', ru: 'простой из-за ожидания памяти', def: 'A core waits idle for data to arrive from memory.' },
    { en: 'Logical processor', ru: 'логический процессор', def: 'A hardware thread as seen by the OS; cores × threads per core.' },
    { en: 'Completely Fair Scheduler', ru: 'полностью справедливый планировщик', def: 'CFS: the preemptive Linux scheduler that aims at fairness.' },
    { en: 'CPU affinity', ru: 'привязка к процессору', def: 'Binding a process or thread to a specific core (Linux taskset).' }
  ],
  questions: [
    { id: 'sch-01', type: 'single', q: 'Which criterion is defined as the time from the submission of a request until the first response is produced?', options: ['Turnaround time', 'Waiting time', 'Response time', 'Throughput'], answer: 2, explain: 'Response time measures only until the first response. Turnaround goes until completion; waiting time is the time spent in the ready queue.', section: 'criteria', diff: 1 },
    { id: 'sch-02', type: 'multi', q: 'Which scheduling criteria should be MINIMIZED? (select all that apply)', options: ['CPU utilization', 'Turnaround time', 'Waiting time', 'Throughput', 'Response time'], answer: [1, 2, 4], explain: 'Utilization and throughput are maximized; turnaround, waiting and response time are minimized.', section: 'criteria', diff: 1 },
    { id: 'sch-03', type: 'single', q: 'The waiting time of a process is…', options: ['the time from arrival to completion', 'the total time spent in the ready queue', 'the time spent executing on the CPU', 'the time until its first run'], answer: 1, explain: 'Waiting time is the time spent waiting in the ready queue (= turnaround − burst). The time until the first run is the response time.', section: 'criteria', diff: 1 },
    { id: 'sch-04', type: 'multi', q: 'Which of the following are tasks of the dispatcher? (select all that apply)', options: ['Switching context', 'Selecting the next process from the ready queue', 'Switching to user mode', 'Jumping to the proper location in the user program'], answer: [0, 2, 3], explain: 'Selecting the process is the job of the CPU scheduler. The dispatcher switches context, switches to user mode and jumps into the program.', section: 'dispatcher', diff: 2 },
    { id: 'sch-05', type: 'single', q: 'Dispatch latency is…', options: ['the running time of the scheduling algorithm', 'the time the dispatcher takes to stop one process and start another', 'the time a process waits in the ready queue', 'the interval of the timer interrupt'], answer: 1, explain: 'By the slide definition: the time to stop one process and start another running.', section: 'dispatcher', diff: 1 },
    { id: 'sch-06', type: 'tf', q: 'The dispatcher uses algorithms such as FCFS, SJF and RR to select a process.', answer: false, explain: 'The scheduler uses those algorithms. The dispatcher has no algorithm of its own; it only gives the CPU to the selected process.', section: 'dispatcher', diff: 1 },
    { id: 'sch-07', type: 'single', q: 'A scheduling scheme is non-preemptive if decisions are taken only when a process…', options: ['switches running→ready and waiting→ready', 'switches running→waiting and terminates', 'switches waiting→ready and terminates', 'switches running→ready and terminates'], answer: 1, explain: 'Cases 1 (running→waiting) and 4 (terminates) leave no choice; if scheduling happens only there, the scheme is non-preemptive.', section: 'preemption', diff: 2 },
    { id: 'sch-08', type: 'multi', q: 'Which algorithms are preemptive? (select all that apply)', options: ['Round Robin', 'FCFS', 'SRTF', 'Non-preemptive SJF', 'Preemptive Priority'], answer: [0, 2, 4], explain: 'RR (timer), SRTF (preemptive SJF) and preemptive priority can take the CPU away. FCFS and plain SJF are non-preemptive.', section: 'preemption', diff: 1 },
    { id: 'sch-09', type: 'single', q: 'Which drawback is specific to preemptive scheduling?', options: ['Poor average response time', 'A process can monopolize the CPU', 'Race conditions on shared data and context-switch overhead', 'Priorities cannot be used'], answer: 2, explain: 'Preempting a process in the middle of an update causes race conditions; frequent switches cost time. The other options are drawbacks of non-preemptive scheduling.', section: 'preemption', diff: 2 },
    { id: 'sch-10', type: 'single', q: 'Which scheduler does Linux (desktop/server) use?', options: ['Multilevel Queue', 'Completely Fair Scheduler (CFS)', 'Non-preemptive FCFS', 'Shortest Job Next'], answer: 1, explain: 'Linux uses CFS, a preemptive scheduler focused on fairness.', section: 'preemption', diff: 1 },
    { id: 'sch-11', type: 'single', q: 'FCFS, processes arrive in the order P1 (24), P2 (3), P3 (3). Average waiting time = ?', options: ['3', '10', '17', '27'], answer: 2, explain: 'Waits: P1 = 0, P2 = 24, P3 = 27 → 51 / 3 = 17.', section: 'fcfs', diff: 1 },
    { id: 'sch-12', type: 'single', q: 'FCFS, the same processes in the order P2 (3), P3 (3), P1 (24). Average waiting time = ?', options: ['3', '6', '9', '17'], answer: 0, explain: 'Waits: P2 = 0, P3 = 3, P1 = 6 → 9 / 3 = 3. The arrival order strongly affects FCFS.', section: 'fcfs', diff: 1 },
    { id: 'sch-13', type: 'single', q: 'The convoy effect is…', options: ['processes with the same priority running in a circle', 'short processes waiting behind one long process', 'low-priority processes never running', 'many context switches with a small quantum'], answer: 1, explain: 'Convoy effect (FCFS): one long, CPU-bound process delays many short ones. "Never running" is starvation.', section: 'fcfs', diff: 1 },
    { id: 'sch-14', type: 'tf', q: 'SJF gives the minimum average waiting time for a given set of processes.', answer: true, explain: 'This is the key property of SJF: it is optimal for average waiting time.', section: 'sjf', diff: 1 },
    { id: 'sch-15', type: 'single', q: 'Non-preemptive SJF, all arrive at 0: P1 = 8, P2 = 4, P3 = 9, P4 = 5. Average waiting time = ?', options: ['6.5', '7.5', '10.25', '13'], answer: 1, explain: 'Order P2 (0–4), P4 (4–9), P1 (9–17), P3 (17–26): waits 9 + 0 + 17 + 4 = 30 → 30 / 4 = 7.5.', section: 'sjf', diff: 2 },
    { id: 'sch-16', type: 'single', q: 'What is the main practical problem of SJF?', options: ['High context-switch overhead', 'The length of the next CPU burst is unknown', 'It cannot work with priorities', 'The convoy effect'], answer: 1, explain: 'The next burst length must be asked from the user or estimated.', section: 'sjf', diff: 1 },
    { id: 'sch-17', type: 'single', q: 'SRTF: P1 (arrival 0, burst 8), P2 (1, 4), P3 (2, 9), P4 (3, 5). Average waiting time = ?', options: ['5.75', '6.5', '7.5', '8.75'], answer: 1, explain: 'Gantt: P1 0–1, P2 1–5, P4 5–10, P1 10–17, P3 17–26. Waits: 9 + 0 + 15 + 2 = 26 → 6.5.', section: 'srtf', diff: 3 },
    { id: 'sch-18', type: 'single', q: 'In the SRTF example above, at what time does P1 resume execution?', options: ['5', '9', '10', '17'], answer: 2, explain: 'P1 is preempted at t = 1 by P2 (4 < 7). After P2 (1–5) and P4 (5–10), P1 has 7 left, less than P3 (9), so it resumes at 10.', section: 'srtf', diff: 3 },
    { id: 'sch-19', type: 'single', q: 'RR with n processes in the ready queue and quantum q. What is the maximum wait before the next turn of a process?', options: ['n·q', '(n − 1)·q', 'q / n', '(n + 1)·q'], answer: 1, explain: 'At most n − 1 other processes run before it, each for at most q.', section: 'rr', diff: 2 },
    { id: 'sch-20', type: 'single', q: 'What happens to RR when the quantum q is very large?', options: ['It becomes SJF', 'It becomes FIFO (FCFS)', 'The number of context switches grows', 'Starvation appears'], answer: 1, explain: 'If q is larger than every burst, each process runs to the end in queue order — that is FCFS.', section: 'rr', diff: 1 },
    { id: 'sch-21', type: 'single', q: 'RR, q = 4: P1 = 24, P2 = 3, P3 = 3 (all at 0). When does P3 complete?', options: ['7', '10', '14', '30'], answer: 1, explain: 'P1 0–4, P2 4–7, P3 7–10 — P3 completes at 10.', section: 'rr', diff: 2 },
    { id: 'sch-22', type: 'single', q: 'A process with a burst of 10 runs under RR with quantum 1. How many context switches?', options: ['0', '1', '9', '10'], answer: 2, explain: 'From the slide: q = 12 → 0, q = 6 → 1, q = 1 → 9 context switches.', section: 'rr', diff: 2 },
    { id: 'sch-23', type: 'tf', q: 'Compared with SJF, RR typically has a higher average turnaround time but a better response time.', answer: true, explain: 'This is the conclusion of the RR example on the slides (q = 4).', section: 'rr', diff: 1 },
    { id: 'sch-24', type: 'single', q: 'What is the solution to starvation in priority scheduling?', options: ['Convoy', 'Aging', 'A larger quantum', 'Dispatch latency'], answer: 1, explain: 'Aging gradually raises the priority of a waiting process.', section: 'priority', diff: 1 },
    { id: 'sch-25', type: 'single', q: 'Non-preemptive priority (smaller number = higher): P1 (10, pr 3), P2 (1, pr 1), P3 (2, pr 4), P4 (1, pr 5), P5 (5, pr 2). Average waiting time = ?', options: ['6.2', '8.2', '9.6', '12'], answer: 1, explain: 'P2 0–1, P5 1–6, P1 6–16, P3 16–18, P4 18–19. Waits: 6 + 0 + 16 + 18 + 1 = 41 → 8.2.', section: 'priority', diff: 2 },
    { id: 'sch-26', type: 'single', q: 'SJF is a special case of priority scheduling where the priority is…', options: ['the arrival time', 'the inverse of the predicted next CPU burst', 'the process number', 'the remaining waiting time'], answer: 1, explain: 'The shorter the expected burst, the higher the priority.', section: 'priority', diff: 2 },
    { id: 'sch-27', type: 'single', q: 'Priority + RR (q = 2): P1 (4, pr 3), P2 (5, pr 2), P3 (8, pr 2), P4 (7, pr 1), P5 (3, pr 3). When does P1 get the CPU for the first time?', options: ['0', '7', '16', '20'], answer: 3, explain: 'First P4 (pr 1) runs 0–7, then P2 and P3 (pr 2) share the CPU round-robin until 20; only then P1 and P5 (pr 3).', section: 'priority', diff: 3 },
    { id: 'sch-28', type: 'single', q: 'How does a multilevel feedback queue differ from a multilevel queue?', options: ['It uses only FCFS', 'A process can move between queues', 'It has a single queue', 'It does not support priorities'], answer: 1, explain: 'In MLQ a process is fixed to its queue; in MLFQ it can be demoted or upgraded.', section: 'mlfq', diff: 1 },
    { id: 'sch-29', type: 'single', q: 'MLFQ: Q0 — RR q = 8, Q1 — RR q = 16, Q2 — FCFS. A process has a 30 ms burst. How long does it run in Q2?', options: ['0 ms', '6 ms', '14 ms', '22 ms'], answer: 1, explain: '8 ms in Q0, 16 ms in Q1, the remaining 30 − 24 = 6 ms in Q2.', section: 'mlfq', diff: 2 },
    { id: 'sch-30', type: 'single', q: 'In a multilevel queue prioritized by process type, which queue has the highest priority?', options: ['batch processes', 'interactive processes', 'system processes', 'real-time processes'], answer: 3, explain: 'From top to bottom: real-time → system → interactive → batch.', section: 'mlq', diff: 1 },
    { id: 'sch-31', type: 'single', q: 'Process-Contention Scope (PCS) is used in the…', options: ['one-to-one model only', 'many-to-one and many-to-many models', 'Linux kernel only', 'kernel threads only'], answer: 1, explain: 'In M:1 and M:M the library schedules user threads onto LWPs — competition inside the process. One-to-one uses SCS.', section: 'threads', diff: 2 },
    { id: 'sch-32', type: 'code', q: 'This program runs on Linux. What does it print?', lang: 'c', code: 'pthread_attr_t attr;\nint scope;\npthread_attr_init(&attr);\npthread_attr_setscope(&attr, PTHREAD_SCOPE_PROCESS);\npthread_attr_getscope(&attr, &scope);\nif (scope == PTHREAD_SCOPE_PROCESS)\n    printf("PCS");\nelse if (scope == PTHREAD_SCOPE_SYSTEM)\n    printf("SCS");', options: ['PCS', 'SCS', 'Nothing: compilation error', 'PCS, then SCS'], answer: 1, explain: 'Linux supports only PTHREAD_SCOPE_SYSTEM: setting PCS fails (setscope returns an error), the scope stays SYSTEM, so it prints SCS.', section: 'threads', diff: 3 },
    { id: 'sch-33', type: 'single', q: 'What is an LWP for the user-thread library?', options: ['A physical processor', 'A virtual processor on which the library runs a user thread', 'A separate process', 'The ready queue'], answer: 1, explain: 'An LWP is an intermediate structure that looks like a virtual processor; each LWP is attached to a kernel thread.', section: 'threads', diff: 2 },
    { id: 'sch-34', type: 'single', q: 'A quad-core processor has 2 hardware threads per core. How many logical processors does the OS see?', options: ['2', '4', '6', '8'], answer: 3, explain: '4 cores × 2 threads = 8 logical processors.', section: 'multicore', diff: 1 },
    { id: 'sch-35', type: 'single', q: 'Which problem does chip-multithreading (several hardware threads per core) solve?', options: ['Starvation', 'Memory stall', 'Convoy effect', 'Deadlock'], answer: 1, explain: 'While one thread waits for memory, the core runs another hardware thread.', section: 'multicore', diff: 1 },
    { id: 'sch-36', type: 'tf', q: 'In a multithreaded multicore system there are two levels of scheduling: the OS chooses a software thread for each logical CPU, and each core chooses which hardware thread to run.', answer: true, explain: 'These are exactly the two levels described on the slide.', section: 'multicore', diff: 2 },
    { id: 'sch-37', type: 'single', q: 'Which algorithm suffers most from the convoy effect?', options: ['RR', 'SRTF', 'FCFS', 'MLFQ'], answer: 2, explain: 'FCFS never preempts a long process, so short ones queue up behind it.', section: 'summary', diff: 1 },
    { id: 'sch-38', type: 'single', q: 'The CPU–I/O burst cycle means that…', options: ['the CPU and I/O never work at the same time', 'process execution alternates CPU bursts and I/O bursts', 'every process performs exactly one I/O', 'the scheduler runs only on I/O'], answer: 1, explain: 'A process alternates computation (CPU burst) and waiting for I/O (I/O burst).', section: 'basics', diff: 1 }
  ]
});
