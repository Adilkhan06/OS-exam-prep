OS.addModule({
  id: 'sync',
  num: 6,
  group: 'theory',
  title: 'Synchronization',
  titleRu: 'Синхронизация процессов',
  icon: '🔒',
  sources: ['6-Synchronization.pdf', 'ES4-SynchronizationExamples.pdf', 'ES7-Semaphores.pdf'],
  summary: 'How processes and threads share data safely: race conditions, the critical-section problem and its three requirements, Peterson’s solution and memory barriers, mutex locks, semaphores, monitors with condition variables, and the classic problems (readers–writers, 3 printers, dining philosophers).',
  bridge: 'In CPU Scheduling we saw that a preemptive scheduler can stop a process after almost any instruction. If that process was in the middle of updating data that another process also uses, the other process can see — or overwrite — a half-finished update. This module shows how to prevent that.',
  intro: `
<p>Processes and threads often <b>cooperate</b>: they share variables, buffers, tables or files. The scheduler, not the programmer, decides when each of them runs, and it can switch between them at almost any instruction. So the steps of two processes can be <b>interleaved</b> (mixed together) in many different orders, and some of those orders corrupt the shared data. <b>Synchronization</b> is the set of techniques that make sure only safe orders can happen.</p>
<p>The module follows one chain of ideas. First we see the danger (a <b>race condition</b>) and give it a precise form: the <b>critical-section problem</b> and three requirements that every solution must meet. Then we try solutions from the simplest to the most convenient, and each one fixes the weakness of the one before: disabling interrupts (fails on multiprocessors) → Peterson's software algorithm (fails on modern CPUs that reorder instructions) → <b>mutex locks</b> built on atomic hardware instructions (correct, but waiting wastes CPU) → <b>semaphores</b> (waiting processes sleep, and resources can be counted, but the calls are easy to misuse) → <b>monitors</b> (the language itself enforces mutual exclusion). Finally we use these tools on classic problems — and the dining philosophers reveal a new danger, <b>deadlock</b>, which is the topic of the next module.</p>
<div class="callout analogy">Keep one picture in mind: shared data is a small room that only one person may be in at a time. Every tool in this module is a different kind of lock on its door.</div>`,
  sections: [
    {
      id: 'race',
      h: 'Race condition — the problem',
      why: 'what goes wrong without synchronization',
      lead: 'Two processes that touch the same data can each be correct on their own and still produce a wrong result together. The cause is the order in which their steps happen to be interleaved.',
      html: `
<p>A <b>race condition</b> happens when several processes or threads access the same shared data at the same time and the result depends on the <b>order</b> in which their instructions run. The processes "race" each other, and whoever wins the race decides the result. Because the scheduler can switch processes at almost any moment, the order changes from run to run — so the bug appears only sometimes and is very hard to reproduce.</p>
<p><b>Slide example — two fork() calls.</b> Processes P<sub>0</sub> and P<sub>1</sub> create child processes with the <code>fork()</code> system call at about the same time. To give the child a process identifier (pid), the kernel reads the kernel variable <code>next_available_pid</code> (the next free pid) and then increases it. Watch what happens when the two requests overlap:</p>
<ol class="steps">
  <li>P<sub>0</sub> requests a pid: the kernel reads <code>next_available_pid = 2615</code>.</li>
  <li>Before the variable is increased, P<sub>1</sub> requests a pid: the kernel reads 2615 again.</li>
  <li>Both calls return 2615, so <b>both children get pid 2615</b>.</li>
</ol>
<div data-viz="0"></div>
<div class="callout warn">Unless there is a mechanism that prevents P<sub>0</sub> and P<sub>1</sub> from accessing <code>next_available_pid</code> at the same time, <b>the same pid could be assigned to two different processes</b>.</div>
<p><b>The same effect at the machine level.</b> Recall the producer–consumer example from the Processes module: the producer executes <code>counter++</code> and the consumer executes <code>counter--</code> on a shared variable. In C each one is a single line, but the CPU executes it as <b>three machine instructions</b>: load the value into a register, change the register, store the register back into memory.</p>
<pre class="code" data-lang="text">counter++:  register1 = counter          counter--:  register2 = counter
            register1 = register1 + 1                register2 = register2 - 1
            counter   = register1                    counter   = register2

counter = 5:
S0: producer  register1 = counter        {register1 = 5}
S1: producer  register1 = register1 + 1  {register1 = 6}
S2: consumer  register2 = counter        {register2 = 5}
S3: consumer  register2 = register2 - 1  {register2 = 4}
S4: producer  counter = register1        {counter = 6}
S5: consumer  counter = register2        {counter = 4}   ← should be 5</pre>
<p>Read the interleaving line by line, starting from counter = 5. Both processes load the old value 5 before either of them stores its result. Each then computes its own new value (6 and 4) and stores it, and the second store simply overwrites the first. One of the two updates is <b>lost</b>. After one increment and one decrement the correct value is 5, but we get 4 — or 6 if the two stores happen in the opposite order. Try it step by step:</p>
<div data-viz="1"></div>
<p>What do the two examples have in common? A process <b>reads</b> shared data, and before it <b>writes</b> the result back, another process reads the same old value. This read–modify–write sequence must never be split by another process. That gives the central question of the module: how do we make such a sequence run as one unbroken unit?</p>`,
      viz: [
        { name: 'timeline', caption: 'Race on next_available_pid: both fork() calls read 2615 before the variable is updated.', props: {
          max: 14, rows: [
            { label: 'P0', segs: [{ from: 0, to: 2, label: 'fork()', tone: 'acc' }, { from: 2, to: 4, label: 'request pid', tone: 'muted' }, { from: 4, to: 8, label: 'return 2615', tone: 'warn' }, { from: 8, to: 12, label: 'child = 2615', tone: 'bad' }] },
            { label: 'P1', segs: [{ from: 1, to: 3, label: 'fork()', tone: 'acc' }, { from: 3, to: 5, label: 'request pid', tone: 'muted' }, { from: 5, to: 9, label: 'return 2615', tone: 'warn' }, { from: 9, to: 13, label: 'child = 2615', tone: 'bad' }] }],
          marks: [{ t: 4, label: 'next_available_pid = 2615' }] } },
        { name: 'race', caption: 'Step through an interleaving of counter++ and counter-- (counter = 5 ends as 4 or 6).', props: { start: 5 } }
      ],
      takeaway: 'A race condition occurs when the result depends on how the steps of concurrent processes are interleaved. The typical danger is a read–modify–write on shared data that gets split by a context switch, so one update is lost.',
      exam: 'Explain why two children can get the same pid; list the possible values of counter after concurrent counter++ and counter-- (4, 5 or 6).'
    },
    {
      id: 'cs-problem',
      h: 'The critical-section problem',
      why: 'give the problem a precise form',
      lead: 'The race happened in only a few lines of code — the lines that touch shared data. If we can mark those lines and keep every other process out while one process runs them, the race disappears.',
      html: `
<p>Consider a system of n processes {p<sub>0</sub>, p<sub>1</sub>, … p<sub>n−1</sub>}. Each process has a segment of code called its <b>critical section</b>: the part in which it may be changing common variables, updating a table, writing a file, and so on — in short, where it works with shared data. Outside its critical section a process works only with its own data, so no race is possible there.</p>
<p>The rule is simple: <b>when one process is executing in its critical section, no other process may be executing in its critical section</b>. The <b>critical-section problem</b> is to design a <b>protocol</b> — an agreed set of steps — that the processes follow so that this rule always holds.</p>
<p>To follow the protocol, every process surrounds its critical section with extra code. It must <b>ask permission</b> to enter in the <b>entry section</b>; the critical section may be followed by an <b>exit section</b> (where the process tells the others that it has left); the rest of the code is the <b>remainder section</b>. The general structure of process P<sub>i</sub>:</p>
<pre class="code" data-lang="c">/* General structure of process Pi */
while (true) {
    entry section        /* ask permission to enter */
        critical section
    exit section         /* announce that we have left */
        remainder section
}</pre>
<div data-viz="0"></div>
<p>All the solutions in this module — disabling interrupts, Peterson's algorithm, locks, semaphores, monitors — are simply different ways to write the entry and exit sections. The critical section and the remainder section never change.</p>
<div class="callout analogy">Think of a single-person changing room in a shop. The entry section is checking the door and locking it; the critical section is the time inside; the exit section is unlocking the door; the remainder section is everything you do elsewhere in the shop.</div>`,
      viz: [{ name: 'flow', caption: 'The loop of process Pi: every pass through the critical section is guarded by the entry and exit sections.', props: { dir: 'h', loop: true, steps: [
        { label: 'entry section', sub: 'ask permission', tone: 'acc' },
        { label: 'critical section', sub: 'shared data', tone: 'bad' },
        { label: 'exit section', sub: 'release', tone: 'acc' },
        { label: 'remainder section', sub: 'private work', tone: 'muted' }] } }],
      takeaway: 'Critical section = the code that touches shared data. A solution adds an entry section (ask permission) before it and an exit section (announce leaving) after it, so that only one process at a time is inside.',
      exam: 'Name the four parts of a process in order (entry, critical, exit, remainder) and say in which part a process asks permission.'
    },
    {
      id: 'requirements',
      h: 'Three requirements for a correct solution',
      why: 'how to judge any solution',
      lead: '"Only one process at a time" is not enough to define a good solution: a protocol that never lets anybody in also keeps two processes apart. We need three requirements, and we will test every solution in the module against them.',
      html: `
<p>A solution to the critical-section problem must satisfy all three of these requirements:</p>
<ol>
  <li><b>Mutual exclusion</b> — if process P<sub>i</sub> is executing in its critical section, then no other processes can be executing in their critical sections. <i>(Nothing bad happens: never two inside.)</i></li>
  <li><b>Progress</b> — if no process is executing in its critical section and some processes wish to enter theirs, then the selection of the process that will enter next <b>cannot be postponed indefinitely</b>. Only the processes that are not in their remainder sections take part in this decision. <i>(The door does not stay locked while the room is empty.)</i></li>
  <li><b>Bounded waiting</b> — a <b>bound</b> (a limit) must exist on the number of times that other processes are allowed to enter their critical sections after a process has made a request to enter its critical section and before that request is granted. <i>(Nobody waits forever while others keep going in.)</i></li>
</ol>
<p>Two assumptions come with these requirements: each process executes at a <b>nonzero speed</b> (it never stops forever), and we make <b>no assumption concerning the relative speed</b> of the n processes. The second assumption matters: a solution that works only when one process is "fast enough" is wrong, because the scheduler can make any process slow.</p>
<p>In exam questions the requirements are usually described by what goes wrong. The table shows what a <b>violation</b> of each one looks like:</p>
<table class="t">
  <tr><th>Requirement</th><th>A violation looks like this</th></tr>
  <tr><td>Mutual exclusion</td><td>two processes are in their critical sections at the same time</td></tr>
  <tr><td>Progress</td><td>the critical section is free and some processes want to enter, but nobody enters (the decision is postponed forever)</td></tr>
  <tr><td>Bounded waiting</td><td>a process has asked to enter, but other processes keep overtaking it without limit → <b>starvation</b></td></tr>
</table>
<p>Look at the difference between the last two rows. With a progress violation <i>nobody</i> enters. With a bounded-waiting violation the system is busy — other processes enter again and again — but one particular process never gets its turn. A process that waits indefinitely while others are served is said to <b>starve</b>; this situation is called <b>starvation</b>.</p>`,
      takeaway: 'Mutual exclusion (at most one process inside), progress (if the room is free, someone gets in), bounded waiting (nobody is overtaken forever). Every solution that follows is checked against these three.',
      exam: 'Exact definitions of the three requirements; recognize which requirement is violated from a description.'
    },
    {
      id: 'interrupts',
      h: 'First attempt: disabling interrupts',
      why: 'simplest idea and why it fails',
      lead: 'A race needs a context switch in the middle of the critical section. On a single CPU, context switches are triggered by interrupts (for example, the timer). So the simplest idea is: no interrupts → no switch → no race.',
      html: `
<p>Many systems provide <b>hardware support</b> for implementing critical-section code. On a <b>uniprocessor</b> (a machine with one CPU) the simplest form is to <b>disable interrupts</b>: while interrupts are off, the timer cannot fire and the scheduler cannot run, so the currently running code executes <b>without preemption</b>. This gives the <b>interrupt-based solution</b>:</p>
<pre class="code" data-lang="text">Entry section:  disable interrupts
Exit section:   enable  interrupts</pre>
<p>Will this solve the problem? The slide asks three questions, and each one exposes a weakness:</p>
<ul>
  <li><b>What if the critical section is code that runs for an hour?</b> For that whole hour interrupts are off: the timer, the I/O devices and all other processes are ignored. The whole system freezes for the sake of one process. (This is also why ordinary user programs are not allowed to disable interrupts.)</li>
  <li><b>Can some processes starve — never enter their critical section?</b> Yes. Nothing decides fairly which waiting process enters next, so some processes may never get in: <b>bounded waiting</b> is not guaranteed.</li>
  <li><b>What if there are two CPUs?</b> Disabling interrupts affects only the CPU that executes the instruction. A process on the other CPU keeps running and can enter its critical section at the same moment, so <b>mutual exclusion</b> is lost.</li>
</ul>
<p>That is why the slide concludes that this approach is <b>generally too inefficient on multiprocessor systems</b>, and operating systems that rely on it are <b>not broadly scalable</b> — they work worse and worse as the number of CPUs grows. Almost every computer today is a multiprocessor, so we need a solution that still works when processes really run in parallel. The next attempt uses no special hardware at all: only ordinary shared variables.</p>`,
      takeaway: 'Disabling interrupts gives mutual exclusion only on a single CPU, and only by stopping everything else. It does not scale to multiprocessors, can cause starvation, and is dangerous for long critical sections.',
      exam: 'Why disabling interrupts does not work on a multiprocessor and is a bad idea for long critical sections.'
    },
    {
      id: 'peterson',
      h: "Peterson's solution",
      why: 'a pure software solution',
      lead: 'If we cannot rely on switching interrupts off, can two processes coordinate using nothing but ordinary shared variables? Peterson’s solution shows that, on paper, they can.',
      html: `
<p><b>Peterson's solution</b> is a software solution for <b>two processes</b>, P<sub>i</sub> and P<sub>j</sub>, where j = 1 − i (so the two processes are P<sub>0</sub> and P<sub>1</sub>). The processes share two variables:</p>
<ul>
  <li><code>int turn;</code> — indicates <b>whose turn</b> it is to enter the critical section;</li>
  <li><code>boolean flag[2];</code> — shows whether a process is ready to enter: <code>flag[i] = true</code> means that P<sub>i</sub> is <b>ready</b> (wants to enter).</li>
</ul>
<p>The idea is politeness: "I want to enter (<code>flag[i] = true</code>), but you may go first (<code>turn = j</code>)." Then P<sub>i</sub> waits only while the other process <i>also</i> wants to enter <i>and</i> it is the other process's turn.</p>
<pre class="code" data-lang="c">/* Algorithm for Process Pi */
while (true) {
    flag[i] = true;                  /* I want to enter         */
    turn = j;                        /* but I give way to Pj    */
    while (flag[j] &amp;&amp; turn == j)
        ;                            /* busy wait               */
    /* critical section */
    flag[i] = false;                 /* exit section            */
    /* remainder section */
}</pre>
<p>The empty loop <code>while (…) ;</code> is called <b>busy waiting</b>: the process keeps checking the condition over and over, and uses the CPU while it waits.</p>
<div class="callout key">Turn the waiting condition around and you get the entry rule: P<sub>i</sub> enters its critical section <b>only if</b> <code>flag[j] == false</code> (the other process does not want to enter) <b>or</b> <code>turn == i</code> (it is my turn). If both processes write <code>turn</code> at almost the same time, only the value written <b>last</b> survives — so the process that wrote last is the one that gave way, and it waits.</div>
<p><b>Correctness.</b> It is provable that all three requirements are met:</p>
<ol>
  <li><b>Mutual exclusion is preserved.</b> Suppose both processes were inside. Then <code>flag[0] == flag[1] == true</code>, so each of them passed its loop only because <code>turn</code> was equal to its own number: turn == 0 for P<sub>0</sub> and turn == 1 for P<sub>1</sub>. That is impossible, because turn holds only one value.</li>
  <li><b>Progress is satisfied.</b> P<sub>i</sub> can be stuck only while <code>flag[j] &amp;&amp; turn == j</code>. If P<sub>j</sub> does not want to enter (it is in its remainder section), <code>flag[j] == false</code> and P<sub>i</sub> enters at once. If both want to enter, turn is either 0 or 1, so one of them enters.</li>
  <li><b>Bounded waiting is met.</b> When P<sub>j</sub> leaves, it sets <code>flag[j] = false</code>, which lets P<sub>i</sub> in. If P<sub>j</sub> immediately wants to enter again, it first sets <code>turn = i</code> and so must wait itself. Therefore P<sub>i</sub> waits for <b>at most one</b> entry of P<sub>j</sub>.</li>
</ol>
<div data-viz="0"></div>
<p>So Peterson's solution is correct using nothing but reads and writes of shared variables. But the proof silently assumes that the reads and writes happen in exactly the order in which they are written. The next section shows that modern hardware does not promise this.</p>`,
      viz: [{ name: 'peterson', caption: "Step through Peterson's algorithm: watch flag[], turn and who enters the critical section.", props: {} }],
      takeaway: 'Peterson: flag[i] = true; turn = j; wait while (flag[j] && turn == j). Pi enters if flag[j] == false or turn == i. It meets mutual exclusion, progress and bounded waiting — but only for two processes, with busy waiting.',
      exam: "Write Peterson's code; state the entry condition (flag[j] == false or turn == i); prove the three requirements."
    },
    {
      id: 'reorder',
      h: "Peterson on modern hardware: reordering and memory barriers",
      why: 'why software alone is not enough',
      lead: 'Peterson’s proof assumes that instructions run exactly in the order they are written. Modern processors and compilers do not promise that — and the algorithm breaks.',
      html: `
<p>Although Peterson's solution is useful for demonstrating an algorithm, it is <b>not guaranteed to work on modern architectures</b>. To improve performance, processors and/or compilers may <b>reorder</b> operations that have no dependencies between them — for example, two writes to two different variables. In a <b>single-threaded</b> program this is safe: the result is always the same. In a <b>multithreaded</b> program another thread may observe the writes in the new order, and the reordering may produce inconsistent or unexpected results. Understanding why Peterson's solution fails is a good way to understand race conditions better.</p>
<p><b>Modern architecture example.</b> Two threads share the data <code>boolean flag = false; int x = 0;</code>. Thread 1 waits for the flag and then prints x; Thread 2 sets x and then raises the flag:</p>
<div class="cols">
<pre class="code" data-lang="c">/* Thread 1 */
while (!flag)
    ;
print x;</pre>
<pre class="code" data-lang="c">/* Thread 2 */
x = 100;
flag = true;</pre>
</div>
<p>The expected output is <b>100</b>: Thread 1 prints only after flag becomes true, and Thread 2 sets x before the flag. However, for Thread 2 the variables <code>flag</code> and <code>x</code> are independent of each other, so its two writes may be reordered into <code>flag = true; x = 100;</code>. If this occurs, Thread 1 can see the flag, leave the loop and print <b>0</b>.</p>
<p><b>Peterson's solution revisited.</b> Exactly the same effect breaks Peterson's algorithm. In the slide's timeline (below) the write <code>flag[0] = true</code> of process 0 has been moved after its write <code>turn = 1</code>:</p>
<ol class="steps">
  <li>P<sub>0</sub> executes <code>turn = 1</code>. Its write <code>flag[0] = true</code> has been delayed, so flag[0] is still false.</li>
  <li>P<sub>1</sub> executes <code>turn = 0</code> and <code>flag[1] = true</code>, then checks <code>flag[0] &amp;&amp; turn == 0</code>: flag[0] is false → P<sub>1</sub> <b>enters</b> its critical section.</li>
  <li>P<sub>0</sub> now executes <code>flag[0] = true</code> and checks <code>flag[1] &amp;&amp; turn == 1</code>: turn is 0 (P<sub>1</sub> wrote it last), so the condition is false → P<sub>0</sub> <b>enters</b> too.</li>
</ol>
<div data-viz="0"></div>
<div class="callout warn">Both processes are in their critical sections at the same time — <b>mutual exclusion is violated</b>. The algorithm itself was correct; the hardware changed the order of its steps.</div>
<p><b>The fix: a memory barrier.</b> A <b>memory barrier</b> (also called a <b>memory fence</b>) is an instruction that forbids reordering across it: all memory operations before the barrier are completed and visible to other CPUs before any memory operation after it starts. In the example, a barrier between the two writes of Thread 2 guarantees that x is stored before flag:</p>
<pre class="code" data-lang="c">/* Thread 2 */
x = 100;
memory_barrier();   /* x is guaranteed to be written before flag */
flag = true;</pre>
<p>Memory barriers are very low-level and easy to forget, so programmers rarely write them by hand. Instead, the hardware offers <b>atomic instructions</b>, and the OS builds simpler, safer tools on top of them. The first such tool is the mutex lock.</p>`,
      viz: [{ name: 'timeline', caption: "Slide \"Peterson's Solution Revisited\": because of reordering, both processes end up in the critical section (CS).", props: {
        max: 12, rows: [
          { label: 'process 0', segs: [{ from: 0, to: 2, label: 'turn = 1', tone: 'acc' }, { from: 6, to: 8, label: 'flag[0] = true', tone: 'warn' }, { from: 8, to: 12, label: 'CS', tone: 'bad' }] },
          { label: 'process 1', segs: [{ from: 2, to: 5, label: 'turn = 0, flag[1] = true', tone: 'acc' }, { from: 5, to: 12, label: 'CS', tone: 'bad' }] }] } }],
      takeaway: 'Processors and compilers may reorder independent memory operations. This breaks the flag/x example (it may print 0 instead of 100) and Peterson’s solution (both processes in the critical section). A memory barrier forces the written order.',
      exam: "Why Peterson's solution fails on modern CPUs; the flag/x example (100 or 0); what a memory barrier does."
    },
    {
      id: 'mutex',
      h: 'Mutex locks and spinlocks',
      why: 'a simple lock built on hardware',
      lead: 'Instead of every programmer writing a tricky algorithm, the OS offers a ready-made tool: a lock. A process takes the lock before its critical section and gives it back afterwards.',
      html: `
<p>OS designers build software tools to solve the critical-section problem. The simplest one is the <b>mutex lock</b> (the name comes from <b>mut</b>ual <b>ex</b>clusion). It uses a boolean variable <code>available</code> that indicates whether the lock is free. A process protects its critical section by first calling <code>acquire()</code> to take the lock (this is the entry section) and then <code>release()</code> to give it back (the exit section):</p>
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
<p>Look closely at <code>acquire()</code>: it consists of two steps — test <code>available</code>, then set it to false. If a context switch happens between these two steps, the race from the first section comes back. Step through it below: two threads both see <code>available == true</code>, both leave the loop, and both enter the critical section.</p>
<div data-viz="0"></div>
<p>That is why calls to <code>acquire()</code> and <code>release()</code> must be <b>atomic</b>. <b>Atomic operations</b> execute without interruption by any other process in the middle of their execution: they happen completely or not at all, and nobody can see a half-done state. Atomicity is usually implemented with <b>hardware atomic instructions</b> — special CPU instructions that test and modify a memory word in one indivisible step, even when several CPUs access memory at the same time.</p>
<p>One problem remains. While the lock is taken, a waiting process loops in <code>while (!available);</code> and keeps the CPU busy without doing any useful work. This solution therefore requires <b>busy waiting</b>, and a lock that waits this way is called a <b>spinlock</b> (the waiting process "spins" in the loop).</p>
<div class="cols">
  <div class="pros"><b>+</b><ul><li>waiting needs no context switch, so it is cheap if the lock is held for only a very short time</li></ul></div>
  <div class="cons"><b>−</b><ul><li>the spinning process wastes CPU time that another process could use</li><li>if critical sections are long, a lot of CPU time is wasted</li></ul></div>
</div>
<p>So the next goal is a tool where a waiting process does not spin but <b>sleeps</b> until the resource becomes free. That tool is the semaphore.</p>`,
      viz: [{ name: 'stepper', caption: 'Why acquire() must be atomic: a context switch between the test and the write lets two threads in.', props: {
        lang: 'c',
        code: ['acquire() {', '    while (!available)', '        ;   /* busy wait */', '    available = false;', '}', 'release() {', '    available = true;', '}'].join('\n'),
        steps: [
          { line: 2, note: 'The lock is free (available == true). T1 calls acquire() and tests the loop condition: !available is false, so T1 leaves the loop…', vars: { available: 'true', T1: 'passed the test', T2: '—', 'in CS': '—' } },
          { line: 2, note: '…but before T1 can write false, a context switch happens. T2 calls acquire(): available is still true, so T2 also leaves the loop.', vars: { T2: 'passed the test' } },
          { line: 4, note: 'T2 sets available = false and enters its critical section.', vars: { available: 'false', T2: 'in CS', 'in CS': 'T2' } },
          { line: 4, note: 'T1 resumes after its test, also sets available = false and enters. Two threads are in the critical section: mutual exclusion is broken. If the test and the write were one atomic step, T2 would have seen false and kept waiting.', vars: { T1: 'in CS', 'in CS': 'T1, T2' } }
        ] } }],
      takeaway: 'A mutex lock: acquire() before and release() after the critical section. Both calls must be atomic (implemented with hardware atomic instructions). Waiting in a loop is busy waiting, so this lock is called a spinlock.',
      exam: 'What a spinlock and busy waiting are; why acquire() and release() must be atomic.'
    },
    {
      id: 'semaphore',
      h: 'Semaphores: wait() and signal()',
      why: 'a more flexible tool',
      lead: 'A mutex lock can only say “free” or “taken”. Many problems need more: “3 printers are free”, or “do not start until the other process has finished step S1”. A semaphore is like a lock with a counter.',
      html: `
<p>A <b>semaphore</b> is a synchronization tool that provides more sophisticated ways (than mutex locks) for processes to synchronize their activities. A semaphore S is an <b>integer variable</b> that, apart from its initialization, can only be accessed via two <b>indivisible (atomic)</b> operations: <code>wait()</code> and <code>signal()</code>. A good way to think of S is as a number of <b>permits</b>: <code>wait()</code> takes a permit (and waits if there is none), <code>signal()</code> gives a permit back.</p>
<pre class="code" data-lang="c">wait(S) {
    while (S &lt;= 0)
        ;   /* busy wait */
    S--;
}

signal(S) {
    S++;
}</pre>
<div class="callout warn"><b>Slide typo:</b> the slide prints <code>while (S &lt; 0)</code>. The classic definition (Silberschatz) is <code>while (S &lt;= 0)</code>: when S == 0 no permits are left, so the process must wait. With <code>S &lt; 0</code> a process would pass when S == 0, and S would become negative.</div>
<p>There are two kinds of semaphores. In the table, notice that the only difference is the range of values — and that range decides what each kind is used for:</p>
<table class="t">
  <tr><th>Type</th><th>Values</th><th>Typical use</th></tr>
  <tr><td><b>Binary semaphore</b></td><td>only 0 and 1</td><td>same as a <b>mutex lock</b> (1 = free, 0 = taken)</td></tr>
  <tr><td><b>Counting semaphore</b></td><td>an unrestricted domain</td><td>a resource with N identical instances (initialized to N)</td></tr>
</table>
<p>With semaphores we can solve various synchronization problems. The slide shows the two basic patterns; notice that the only difference between them is the <b>initial value</b>.</p>
<p><b>Usage 1 — the critical-section problem.</b> Create a semaphore <code>mutex</code> initialized to <b>1</b>. The first process that calls <code>wait(mutex)</code> takes the only permit (1 → 0) and enters; all others wait until it calls <code>signal(mutex)</code>.</p>
<pre class="code" data-lang="c">wait(mutex);
    /* CS */
signal(mutex);</pre>
<p><b>Usage 2 — ordering.</b> Processes P1 and P2 contain the statements S1 and S2, and S1 must happen <b>before</b> S2. Create a semaphore <code>synch</code> initialized to <b>0</b> (no permit yet):</p>
<div class="cols">
<pre class="code" data-lang="c">/* P1 */
S1;
signal(synch);</pre>
<pre class="code" data-lang="c">/* P2 */
wait(synch);
S2;</pre>
</div>
<div class="callout key">Because synch starts at 0, if P2 arrives first it blocks on <code>wait(synch)</code> and can continue only after P1 has executed S1 and called <code>signal(synch)</code>. If P1 arrives first, its signal leaves a permit behind (synch = 1), and P2 later passes without waiting. Either way, S1 runs before S2.</div>
<p>A rule of thumb follows: initialize a semaphore to <b>1</b> for mutual exclusion, to <b>0</b> to wait for an event, and to <b>N</b> for N identical resources. However, the definition above still contains <code>while (S &lt;= 0);</code> — busy waiting again. The next section removes it.</p>`,
      takeaway: 'A semaphore is an integer accessed only through atomic wait() (take a permit, wait if there is none) and signal() (return a permit). Binary (0/1) = mutex lock; counting = N resources. Initial value 1 for a critical section, 0 for ordering.',
      exam: 'Definitions of wait() and signal(); binary vs counting semaphores; initial values: 1 for a critical section, 0 for ordering.'
    },
    {
      id: 'sem-impl',
      h: 'Semaphore implementation without busy waiting',
      why: 'let waiting processes sleep',
      lead: 'Busy waiting is acceptable for a few instructions, but a process may wait for a semaphore for a long time. The fix: instead of spinning, the waiting process goes to sleep in a queue and is woken up later.',
      html: `
<p>First, a subtle point. <code>wait()</code> and <code>signal()</code> themselves change shared data — the value of S. So the implementation must guarantee that <b>no two processes can execute wait() and signal() on the same semaphore at the same time</b>. In other words, implementing a semaphore is itself a <b>critical-section problem</b>: the code of wait and signal is placed in a critical section.</p>
<p>That inner critical section could now use busy waiting. This is acceptable, because the implementation code is <b>short</b>: there is little busy waiting if this critical section is rarely occupied. But applications may spend <b>lots of time</b> in <i>their</i> critical sections, so letting a process spin while it waits for an application semaphore is <b>not a good solution</b>.</p>
<p><b>Implementation with no busy waiting.</b> With each semaphore there is an associated <b>waiting queue</b> — a list of the processes waiting for it. The semaphore becomes a record with two data items: an integer <b>value</b> and a <b>pointer</b> to the list of waiting processes:</p>
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
<p>Two operations, provided by the OS, do the sleeping and the waking up:</p>
<ul>
  <li><b>block</b> — place the process invoking the operation on the appropriate waiting queue. The process leaves the CPU and uses no CPU time while it waits.</li>
  <li><b>wakeup(P)</b> — remove one process P from the waiting queue and place it in the <b>ready queue</b>, so that the scheduler can run it again.</li>
</ul>
<p>Note the order of steps inside <code>wait()</code>: the value is decreased <i>first</i> and checked <i>afterwards</i>. That is why the value can become <b>negative</b> — and a negative value has a useful meaning:</p>
<div class="callout key">If <code>value = −k</code>, then <b>k processes are waiting</b> in <code>S-&gt;list</code>. If value ≥ 0, nobody is waiting and value is the number of free permits. This also explains the test in <code>signal()</code>: after the increase, a value ≤ 0 means that somebody was waiting and must be woken up.</div>
<p>Step through an example: the semaphore starts at 1, three processes call <code>wait()</code>, and then each of them calls <code>signal()</code> in turn.</p>
<div data-viz="0"></div>`,
      viz: [{ name: 'stepper', caption: 'S->value = 1; P1, P2, P3 call wait(), then each calls signal() in turn.', props: {
        lang: 'c',
        code: ['wait(semaphore *S) {', '    S->value--;', '    if (S->value < 0) {', '        add this process to S->list;', '        block();', '    }', '}', 'signal(semaphore *S) {', '    S->value++;', '    if (S->value <= 0) {', '        remove a process P from S->list;', '        wakeup(P);', '    }', '}'].join('\n'),
        steps: [
          { line: 2, note: 'P1: wait(S). value 1 → 0, which is not < 0 → P1 enters its critical section.', vars: { value: 0, list: '[]', CS: 'P1' } },
          { line: [2, 3, 4, 5], note: 'P2: wait(S). value 0 → −1 < 0 → P2 is added to S->list and calls block().', vars: { value: -1, list: '[P2]', CS: 'P1' } },
          { line: [2, 3, 4, 5], note: 'P3: wait(S). value → −2 → P3 is blocked too. |value| = 2 waiting processes.', vars: { value: -2, list: '[P2, P3]', CS: 'P1' } },
          { line: [9, 10, 11, 12], note: 'P1: signal(S). value → −1 ≤ 0 → wakeup(P2): P2 moves to the ready queue, then into its critical section.', vars: { value: -1, list: '[P3]', CS: 'P2' } },
          { line: [9, 10, 11, 12], note: 'P2: signal(S). value → 0 ≤ 0 → wakeup(P3).', vars: { value: 0, list: '[]', CS: 'P3' } },
          { line: [9, 10], note: 'P3: signal(S). value → 1 > 0 → there is nobody to wake up.', vars: { value: 1, list: '[]', CS: '—' } }
        ] } }],
      takeaway: 'A semaphore without busy waiting = value + waiting list. wait(): value--, and if value < 0 then block(). signal(): value++, and if value <= 0 then wakeup(P). A negative value −k means that k processes are waiting.',
      exam: 'The wait()/signal() code with a list; the meaning of a negative value; block vs wakeup; tracing the value of a semaphore.'
    },
    {
      id: 'sem-problems',
      h: 'Problems with semaphores',
      why: 'why easy misuse is dangerous',
      lead: 'Semaphores are powerful, but correctness depends entirely on the programmer putting every wait() and signal() in the right place. One mistake in one process can break the whole system.',
      html: `
<p>The slide lists typical examples of <b>incorrect use</b> of semaphore operations. The table shows each mistake (with <code>mutex</code> initialized to 1) and what it causes. Read the right-hand column and notice that there are only two kinds of failure: either too many processes get in, or processes get stuck forever.</p>
<table class="t">
  <tr><th>Mistake</th><th>Effect</th></tr>
  <tr><td><code>signal(mutex)</code> … CS … <code>wait(mutex)</code></td><td>the order is swapped: signal() raises mutex instead of taking it, so several processes can be in the critical section at the same time — <b>mutual exclusion is violated</b></td></tr>
  <tr><td><code>wait(mutex)</code> … CS … <code>wait(mutex)</code></td><td>the second wait() finds mutex == 0 and blocks the process forever; nobody will ever call signal(), so the other processes block too — a <b>deadlock</b></td></tr>
  <tr><td><code>wait(mutex)</code> omitted</td><td>the process enters without asking — <b>mutual exclusion is violated</b></td></tr>
  <tr><td><code>signal(mutex)</code> omitted</td><td>the permit is never returned — all other processes are <b>blocked forever</b></td></tr>
</table>
<p>These — and others — are examples of what can occur when semaphores and other synchronization tools are used incorrectly. Such bugs are especially nasty because they show up only under a particular interleaving: a program can pass every test and still fail later.</p>
<p>The root cause is that <code>wait()</code> and <code>signal()</code> calls are scattered through the code of many processes, and nobody checks that they are correct. The natural next step is to move synchronization <b>into the programming language</b>: put the shared data together with the only procedures that may touch it, and let the compiler insert the locking automatically. That construct is the <b>monitor</b>.</p>`,
      takeaway: 'Swapping or omitting wait()/signal() gives either broken mutual exclusion (too many processes inside) or processes blocked forever (deadlock). Because such errors are easy to make and hard to find, the higher-level monitor was introduced.',
      exam: 'Given a code fragment, decide whether it violates mutual exclusion or causes a deadlock.'
    },
    {
      id: 'monitors',
      h: 'Monitors',
      why: 'let the language enforce mutual exclusion',
      lead: 'Semaphores fail when a programmer forgets or swaps a call. A monitor removes that chance: mutual exclusion is built into the construct, so the programmer never writes wait(mutex) or signal(mutex) at all.',
      html: `
<p>A <b>monitor</b> is a high-level abstraction that provides a convenient and effective mechanism for process synchronization. It is an <b>abstract data type (ADT)</b> — a type that packs shared data together with the procedures that operate on it. Its internal variables are accessible <b>only by code within the monitor's procedures</b>, so no process can touch the shared data "from outside".</p>
<div class="callout key">The key rule: <b>only one process may be active within the monitor at a time.</b> If a process calls a monitor procedure while another process is active inside, it waits in the monitor's <b>entry queue</b>.</div>
<p>The pseudocode syntax of a monitor has three parts: the shared variable declarations, the procedures, and initialization code that gives the variables their starting values.</p>
<pre class="code" data-lang="c">monitor monitor-name
{
    /* shared variable declarations */
    procedure P1 (...) { ... }
    procedure P2 (...) { ... }
    procedure Pn (...) { ... }
    initialization code (...) { ... }
}</pre>
<p>The schematic view shows the same structure: outside, processes wait in the entry queue; inside are the shared data, the operations (procedures) and the initialization code.</p>
<div data-viz="0"></div>
<p><b>How is "only one inside" achieved?</b> With the tool we already have. To implement a monitor using semaphores, the compiler adds a semaphore <code>mutex</code> initialized to 1 and wraps the body of every procedure in <code>wait(mutex)</code> … <code>signal(mutex)</code>:</p>
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
<div class="callout key">This ensures <b>mutual exclusion within the monitor</b>. The difference from plain semaphores is who writes the calls: the compiler — always in the right order, never forgotten.</div>
<p>But mutual exclusion alone is not enough. Often a process inside the monitor must <b>wait for something</b>, for example for another process to finish a step. If it simply waited while staying active in the monitor, nobody else could get in to make that step happen. Monitors need a way to wait <i>and</i> let other processes in: condition variables.</p>`,
      viz: [{ name: 'layers', caption: 'Schematic view of a monitor.', props: { top: 'entry queue → processes wait to enter', layers: [
        { label: 'shared data', tone: 'acc' },
        { label: 'operations: P1, P2, …, Pn', tone: 'c2' },
        { label: 'initialization code', tone: 'muted' }] } }],
      takeaway: 'A monitor = shared data + procedures + initialization code, packed as an ADT. Only one process is active inside at a time; the others wait in the entry queue. It can be implemented by wrapping every procedure in wait(mutex)/signal(mutex) with mutex = 1.',
      exam: 'How many processes can be active in a monitor (one); how to implement a monitor with a semaphore mutex = 1.'
    },
    {
      id: 'condvars',
      h: 'Condition variables: signal-and-wait vs signal-and-continue',
      why: 'waiting for events inside monitors',
      lead: 'A process inside a monitor sometimes cannot continue until something happens. A condition variable lets it step aside — release the monitor and sleep — until another process signals that the situation has changed.',
      html: `
<p>More opportunities for synchronization in monitors come from <b>condition variables</b>. They allow threads or processes to <b>wait until some event or condition has occurred</b>, and they make powerful and efficient synchronization mechanisms possible.</p>
<p>A condition variable is declared as <code>condition x;</code>. It is an <b>explicit queue</b> that threads can put themselves on when a condition is not as desired (<b>waiting on the condition</b>); when the condition changes, the system wakes up those waiting threads and allows them to continue (<b>signaling on the condition</b>). Only two operations are allowed on a condition variable:</p>
<ul>
  <li><code>x.wait()</code> — the process that invokes the operation is <b>suspended</b> until another process calls <code>x.signal()</code>. A suspended process is no longer active, so another process can enter the monitor.</li>
  <li><code>x.signal()</code> — resumes <b>one</b> of the processes (if any) that invoked <code>x.wait()</code>. <b>If no process is waiting on x, it has no effect.</b></li>
</ul>
<p>That last rule is the big difference from a semaphore, so compare the two directly:</p>
<table class="t">
  <tr><th></th><th>semaphore signal()</th><th>condition variable x.signal()</th></tr>
  <tr><td>When nobody is waiting</td><td>S++ — the signal is "remembered", and a later wait() passes</td><td>nothing happens — the signal is lost</td></tr>
</table>
<p>In other words, a semaphore has a memory (its value), while a condition variable has none — it is only a queue. The figure shows where these queues live: inside the monitor, one queue per condition variable (here x and y), next to the shared data.</p>
<div data-viz="0"></div>
<p><b>Usage example.</b> P1 and P2 must execute the statements S1 and S2, with S1 <b>before</b> S2 — the same ordering problem that we solved with the semaphore <code>synch = 0</code>. Now we create a monitor with two procedures, F1 and F2, invoked by P1 and P2 respectively; one condition variable <code>x</code> (the slide says "initialized to 0", meaning its queue starts empty); and one boolean variable <code>done</code>.</p>
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
<p>Why is <code>done</code> needed? Because of the rule above: if F1 runs first, its <code>x.signal()</code> finds nobody waiting and is lost. Without <code>done</code>, P2 would then call <code>x.wait()</code> and wait forever. With <code>done</code>, P2 sees that S1 has already happened and does not wait.</p>
<p><b>A new problem.</b> Suppose P2 came first and is waiting on x. P1 executes S1, sets done and calls <code>x.signal()</code>. The slide describes what happens next: P2 wakes up, because the monitor's semaphore is available to it, and starts its execution; P1 releases the semaphore and continues its own execution.</p>
<div class="callout warn"><b>Both processes are active in the monitor!</b> That breaks the main rule of a monitor. One of the two must wait — but which one?</div>
<p>There are two possible answers. The table shows that they differ only in who gives way:</p>
<table class="t">
  <tr><th>Option</th><th>Who waits</th></tr>
  <tr><td><b>signal-and-wait</b></td><td>P1 (the signaling process) waits until P2 leaves the monitor (or waits on another condition variable) before continuing its execution</td></tr>
  <tr><td><b>signal-and-continue</b></td><td>P2 (the awakened process) waits until P1 leaves the monitor (or waits on another condition variable)</td></tr>
</table>
<p>The slide's possible solution is <b>signal-and-wait</b>: the awakened process runs immediately, so the condition it was waiting for is certainly still true when it runs. Step through the example with this choice (P2 arrives first):</p>
<div data-viz="1"></div>`,
      viz: [
        { name: 'layers', caption: 'Monitor with condition variables.', props: { top: 'entry queue → processes wait to enter the monitor', layers: [
          { label: 'shared data', tone: 'acc' },
          { label: 'queues associated with x, y conditions', sub: 'x → [P] [P] [P],  y → [P] [P]', tone: 'warn' },
          { label: 'operations', tone: 'c2' },
          { label: 'initialization code', tone: 'muted' }] } },
        { name: 'stepper', caption: 'Trace of F1/F2 with signal-and-wait (P2 arrives first).', props: {
          lang: 'c',
          code: ['monitor M {', '  condition x;  boolean done = false;', '  F1() {              /* P1 */', '    S1;', '    done = true;', '    x.signal();', '  }', '  F2() {              /* P2 */', '    if (done == false)', '      x.wait();', '    S2;', '  }', '}'].join('\n'),
          steps: [
            { line: 9, note: 'P2 enters the monitor (F2): done == false.', vars: { done: 'false', inMonitor: 'P2', 'x queue': '[]' } },
            { line: 10, note: 'P2: x.wait() → suspended in the queue of x; the monitor is free again.', vars: { done: 'false', inMonitor: '—', 'x queue': '[P2]' } },
            { line: 4, note: 'P1 enters the monitor (F1) and executes S1.', vars: { done: 'false', inMonitor: 'P1', 'x queue': '[P2]' } },
            { line: 5, note: 'done = true.', vars: { done: 'true', inMonitor: 'P1', 'x queue': '[P2]' } },
            { line: 6, note: 'x.signal(): P2 is resumed. Signal-and-wait → P1 is suspended, so only P2 is active in the monitor.', vars: { done: 'true', inMonitor: 'P2', suspended: 'P1' } },
            { line: 11, note: 'P2 executes S2 (after S1 ✔) and leaves the monitor.', vars: { done: 'true', inMonitor: '—', suspended: 'P1' } },
            { line: 7, note: 'P1 continues after x.signal() and leaves. If P1 had come first, x.signal() would have had no effect, and P2 would have seen done == true and not waited.', vars: { done: 'true', inMonitor: '—' } }
          ] } }
      ],
      takeaway: 'Condition variables let a process wait inside a monitor: x.wait() suspends it and frees the monitor; x.signal() resumes one waiter, or does nothing if nobody waits (unlike a semaphore). After a signal only one process may continue: signal-and-wait (the signaler waits) or signal-and-continue (the awakened process waits).',
      exam: 'The operations x.wait()/x.signal(); the difference from a semaphore; why "both processes are active in the monitor" and how signal-and-wait differs from signal-and-continue.'
    },
    {
      id: 'sw-impl',
      h: 'Implementing signal-and-wait with semaphores',
      why: 'how a monitor is built underneath',
      lead: 'We saw that a monitor can be built from one semaphore, mutex. With condition variables and signal-and-wait we need a little more: a place where a signaling process can wait while staying inside the monitor.',
      html: `
<p>The slides show how a monitor with signal-and-wait can be implemented using only semaphores. Three variables serve the monitor as a whole:</p>
<pre class="code" data-lang="c">semaphore mutex;      /* = 1: only one process in the monitor                     */
semaphore next;       /* = 0: processes that executed signal wait here           */
                      /*      until the awakened process leaves the monitor      */
int next_count = 0;   /* number of processes suspended inside the monitor (on next) */</pre>
<p>Why <code>next</code>? Under signal-and-wait, a process that calls <code>x.signal()</code> must stop and let the awakened process run. But it is still <i>inside</i> the monitor: it has not finished its procedure. So it should not go back to the entry queue behind brand-new processes; instead it waits on the special semaphore <code>next</code>, and <code>next_count</code> counts how many such suspended signalers there are.</p>
<p>Each monitor function <b>P</b> is replaced by:</p>
<pre class="code" data-lang="c">wait(mutex);
    body of P;
if (next_count &gt; 0)
    signal(next);     /* hand the monitor to a suspended signaler */
else
    signal(mutex);    /* otherwise let a new process in           */</pre>
<p>The exit part is the key. When a process leaves the monitor, it first hands the monitor to a suspended signaler if there is one (<code>signal(next)</code>). Only if nobody is suspended inside does it open the door to a new process from the entry queue (<code>signal(mutex)</code>). This keeps the promise "only one process in the monitor" and gives priority to processes that are already halfway through a procedure.</p>
<p>For <b>each condition variable x</b> there is one more semaphore and one more counter:</p>
<pre class="code" data-lang="c">semaphore x_sem;      /* initially = 0 */
int x_count = 0;      /* how many processes wait on x */</pre>
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
<p>Read the two operations as a hand-over of the monitor:</p>
<ul>
  <li><code>x.wait()</code>: count myself as waiting on x; give the monitor away (to a suspended signaler if there is one, otherwise to a new process through mutex); then sleep on <code>x_sem</code>. When woken up, decrease the counter.</li>
  <li><code>x.signal()</code>: acts <b>only if somebody is waiting</b> (<code>x_count &gt; 0</code>) — this is exactly the "no effect" rule. It wakes one waiter through <code>x_sem</code> and then blocks itself on <code>next</code>. The signaler waiting while the awakened process runs <i>is</i> <b>signal-and-wait</b>.</li>
</ul>
<p>Notice that the monitor is passed directly from one process to another and is never left free in between, so no third process can slip in.</p>`,
      takeaway: 'mutex (= 1) lets one process into the monitor; next (= 0) and next_count hold signalers suspended inside; x_sem (= 0) and x_count hold processes waiting on x. On exit the monitor goes first to a suspended signaler (signal(next)), otherwise to a new process (signal(mutex)).',
      exam: 'The roles of mutex, next, next_count, x_sem and x_count; why next_count is checked on exit.'
    },
    {
      id: 'rw',
      h: 'Readers–writers problem',
      why: 'classic problem 1: readers vs writers',
      lead: 'Now we apply the tools to classic problems. The first one starts from an observation: a plain mutex lets only one process at a time touch the data — but readers change nothing, so why should they block each other?',
      html: `
<p>The <b>readers–writers problem</b> is a classic synchronization issue about managing access to shared data by multiple threads or processes. A <b>data set</b> is shared among a number of concurrent processes of two kinds:</p>
<ul>
  <li><b>Readers</b> only read the data. Multiple readers can access it <b>simultaneously</b> without causing any issues, because nobody modifies it.</li>
  <li><b>Writers</b> modify the data. Only <b>one</b> writer can access it at a time, to ensure <b>data integrity</b> (the data stays correct and consistent).</li>
</ul>
<p>For instance, many users of a database can retrieve information at the same time, while any user may update the database at any moment.</p>
<p>So the synchronization scheme must support two rules: <b>multiple readers</b> — any number of readers may access the data simultaneously if no writer is writing; and <b>exclusion for writers</b> — while one writer is writing, no other reader or writer may access the data.</p>
<p>When both readers and writers are waiting, someone must have priority. There are several variations, and all of them involve some form of priority. The two basic ones:</p>
<table class="t">
  <tr><th>Variant</th><th>Priority</th></tr>
  <tr><td><b>"First readers–writers" problem</b></td><td><b>readers</b> are preferred: while readers are reading, writers must wait; a writer gets access only when no reader is accessing the data</td></tr>
  <tr><td><b>"Second readers–writers" problem</b></td><td><b>writers</b> are preferred: once a writer arrives, it performs its operation as soon as possible, even if readers are currently accessing the data</td></tr>
</table>
<p><b>Solution of the first readers–writers problem with semaphores</b> (recall: <code>wait()</code> decrements the semaphore value, <code>signal()</code> increments it). The shared data:</p>
<ul>
  <li>the data set;</li>
  <li><code>semaphore rw_mutex = 1;</code> — mutual exclusion for writers; the readers <i>as a group</i> also hold it (the first reader takes it, the last reader releases it);</li>
  <li><code>semaphore mutex = 1;</code> — protects <code>read_count</code> (updating the counter is itself a critical section);</li>
  <li><code>int read_count = 0;</code> — how many readers are reading right now.</li>
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
<p>The writer is simple: an ordinary critical section protected by <code>rw_mutex</code>. The reader is the clever part. Only the <b>first</b> reader (read_count becomes 1) locks <code>rw_mutex</code>, which keeps writers out for the whole group. Later readers just increase the counter and go straight in. Only the <b>last</b> reader (read_count back to 0) releases <code>rw_mutex</code> and lets a writer in.</p>
<div data-viz="0"></div>
<div class="callout warn"><b>Variations and starvation.</b> This solution can lead to a situation where <b>a writer never writes</b>. Reader A is reading; a writer calls <code>wait(rw_mutex)</code> and blocks; reader B arrives and goes in; A leaves and comes back; B leaves… If readers keep overlapping, <code>read_count</code> never drops to 0 and the writer starves. Both the first and the second variants may result in starvation (in the second one the readers starve), which leads to even more variations.</div>`,
      viz: [{ name: 'stepper', caption: 'R1 and R2 read at the same time; W waits for the last reader.', props: {
        lang: 'c',
        code: ['/* writer */', 'wait(rw_mutex);', '/* writing is performed */', 'signal(rw_mutex);', '', '/* reader */', 'wait(mutex);', 'read_count++;', 'if (read_count == 1)', '    wait(rw_mutex);', 'signal(mutex);', '/* reading is performed */', 'wait(mutex);', 'read_count--;', 'if (read_count == 0)', '    signal(rw_mutex);', 'signal(mutex);'].join('\n'),
        steps: [
          { line: [7, 8], note: 'R1: wait(mutex), read_count = 1.', vars: { read_count: 1, mutex: 0, rw_mutex: 1, reading: '—' } },
          { line: [9, 10, 11], note: 'R1 is the first reader: wait(rw_mutex) → writers are now locked out. Then signal(mutex).', vars: { read_count: 1, mutex: 1, rw_mutex: 0, reading: 'R1' } },
          { line: 2, note: 'W: wait(rw_mutex) → rw_mutex is taken → W blocks.', vars: { read_count: 1, mutex: 1, rw_mutex: 0, reading: 'R1', blocked: 'W' } },
          { line: [7, 8, 9, 11], note: 'R2: read_count = 2, not the first reader → it does not touch rw_mutex and starts reading together with R1.', vars: { read_count: 2, mutex: 1, rw_mutex: 0, reading: 'R1, R2', blocked: 'W' } },
          { line: [13, 14, 15, 17], note: 'R1 finishes: read_count = 1, not the last reader → it does not release rw_mutex.', vars: { read_count: 1, mutex: 1, rw_mutex: 0, reading: 'R2', blocked: 'W' } },
          { line: [13, 14, 15, 16, 17], note: 'R2 is the last reader: read_count = 0 → signal(rw_mutex) → W is woken up.', vars: { read_count: 0, mutex: 1, rw_mutex: 0, reading: '—', writing: 'W' } },
          { line: [3, 4], note: 'W writes alone, then calls signal(rw_mutex). If readers had kept arriving, W would have waited forever (starvation).', vars: { read_count: 0, mutex: 1, rw_mutex: 1 } }
        ] } }],
      takeaway: 'Readers may share the data, writers need exclusive access. In the first readers–writers solution the first reader locks rw_mutex, the last reader unlocks it, and mutex protects read_count. Readers are preferred, so writers can starve.',
      exam: 'The full reader/writer code; the roles of rw_mutex, mutex and read_count; why a writer can starve.'
    },
    {
      id: 'printers',
      h: 'Exercise: 3 shared printers (ES7)',
      why: 'counting + binary semaphore together',
      lead: 'The readers–writers solution used two semaphores with two different jobs. The printer exercise from the lab trains the same skill: decide how many semaphores you need, of which type, and with which initial value.',
      html: `
<p><b>Scenario.</b> A computer lab has <b>3 printers</b> shared by many processes (users) who want to print documents. Each process must: request access to a printer → print (the critical operation) → release the printer. The system must ensure two things:</p>
<ul>
  <li><b>no more than 3</b> processes use the printers at the same time;</li>
  <li><b>no two processes use the same printer</b> simultaneously.</li>
</ul>
<p>Notice that these are two <i>different</i> requirements. The first one is about <b>how many</b> processes print (a count); the second one is about <b>which</b> printer each one gets (protecting the shared list of free printers). Each requirement needs its own semaphore.</p>
<p><b>Step 1 — define the required semaphores:</b> how many are needed, what initial value should each one have, and which type (binary or counting)?</p>
<table class="t">
  <tr><th>Semaphore</th><th>Type</th><th>Initial value</th><th>Purpose</th></tr>
  <tr><td><code>printers</code></td><td><b>counting</b></td><td><b>3</b></td><td>keeps track of how many printers are free (at most 3 processes print at the same time)</td></tr>
  <tr><td><code>mutex</code></td><td><b>binary</b></td><td><b>1</b></td><td>protects the shared data structure (the list of free printers) from race conditions</td></tr>
</table>
<p>So the answer is <b>2</b> semaphores, and <b>both types</b> are used. The complete code of a user process:</p>
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
<p><b>Result — why each semaphore is needed:</b></p>
<ul>
  <li><b>printers</b> (counting semaphore): every process that wants to print calls <code>wait(printers)</code>. If all printers are busy (<code>printers == 0</code>), the process <b>blocks</b>. When a printer becomes free, <code>signal(printers)</code> resumes one of the waiting processes.</li>
  <li><b>mutex</b> (binary semaphore): protects the shared data structure, for example an array of booleans that says which printers are free. Without it, two processes could read the same printer as free at the same time, both mark it as occupied, and end up <b>using the same printer simultaneously</b> (a race condition).</li>
</ul>
<p>Look at the order of the calls. First <code>wait(printers)</code> — wait until <i>some</i> printer is free; then <code>wait(mutex)</code> — lock the list only briefly, to pick <i>which</i> printer. Printing itself happens <b>outside</b> the mutex, so three processes really can print in parallel. Swapping the first two <code>wait()</code> calls would be a serious bug: a process could fall asleep on <code>printers</code> while holding <code>mutex</code>, and the processes that are printing could never get <code>mutex</code> to release their printers — every process would wait forever. This is a first taste of the next topic.</p>
<p><b>A possible implementation in C</b> (POSIX <code>sem_t</code>, 6 threads) — the key parts:</p>
<pre class="code" data-lang="c">#define N_PRINTERS 3
sem_t printers;                       /* counting: free printers */
sem_t mutex;                          /* binary: protects shared data */
int printer_free[N_PRINTERS] = {1, 1, 1};   /* 1 = free, 0 = busy */

int find_free_printer() {             /* called while holding mutex */
    for (int i = 0; i &lt; N_PRINTERS; i++) {
        if (printer_free[i] == 1) {
            printer_free[i] = 0;
            return i;
        }
    }
    return -1;   /* never happens: semaphore ensures availability */
}

void release_printer(int id) {        /* also called while holding mutex */
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
<div class="callout note">POSIX names: <code>sem_wait</code> = wait(), <code>sem_post</code> = signal(), <code>sem_init(&amp;s, 0, value)</code> creates a semaphore with the given initial value; the second argument 0 means the semaphore is shared between the threads of one process.</div>
<p>In the simulation below, 6 processes compete for the 3 printers: at most 3 are ever printing, and the others block on <code>wait(printers)</code> until someone calls <code>signal(printers)</code>.</p>
<div data-viz="0"></div>`,
      viz: [{ name: 'semaphore', caption: '6 processes and 3 printers: wait(printers) / signal(printers).', props: { value: 3, label: 'printers', procs: 6 } }],
      takeaway: 'Two semaphores: printers (counting, = 3) limits how many processes print at once; mutex (binary, = 1) protects the list of free printers so that two processes never pick the same one. Take printers first, then mutex.',
      exam: 'How many semaphores, which types and initial values (printers = 3, mutex = 1); why mutex is needed; what sem_wait does when the value is 0.'
    },
    {
      id: 'philosophers',
      h: 'Dining philosophers (semaphores)',
      why: 'classic problem 2: two resources',
      lead: 'In the printer exercise each process needed one resource at a time. Real processes often need several at once — and that creates a danger we have not met yet. The dining philosophers show it.',
      html: `
<p>N philosophers sit at a round table with a <b>bowl of rice</b> in the middle. They spend their lives alternating <b>thinking</b> and <b>eating</b>, and they do not interact with their neighbors. Between each pair of neighbors lies one chopstick. A philosopher may eat only if he can pick up the <b>two</b> chopsticks next to him; he picks them up <b>one at a time</b>, and when he is done he releases both. A chopstick may be picked up by either of its two neighbors, but not by both at once.</p>
<p>The story is a model: the philosophers are processes, the chopsticks are shared resources, and each process needs <b>two resources at the same time</b>. For 5 philosophers the shared data are the bowl of rice (the data set) and <code>semaphore chopstick[5]</code>, all initialized to <b>1</b> (every chopstick is free).</p>
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
<p>What is the problem with this algorithm? Try to find it in the simulation before reading on.</p>
<div data-viz="1"></div>
<div class="callout warn"><b>Deadlock</b> — the most serious problem. Suppose every philosopher sits down at about the same time and picks up his <b>left</b> chopstick. Now all chopsticks are taken, and nobody can pick up his right one. Every philosopher waits for his right chopstick, which is held by his right neighbor: a <b>circular waiting</b>. Nobody will ever put a chopstick down, so all five wait forever. This is a <b>deadlock</b>: each process in a group waits for a resource held by another process of the same group.</div>
<div class="callout note"><b>Starvation is also a problem.</b> Imagine two fast philosophers (fast thinkers and fast eaters) sitting in opposite chairs. They pick up their chopsticks and eat; after eating, and before their neighbors can grab the chopsticks, they come back and take them again. The other three philosophers, although they have been sitting for a long time, never get a chance to eat. This is <b>starvation, not deadlock</b>: there is no circular waiting, and everyone formally has a chance to eat.</div>
<p>The difference is worth remembering: in a <b>deadlock</b> nobody in the group can ever move again; in <b>starvation</b> the system keeps working, but one process is always unlucky.</p>
<p><b>Ways to avoid the deadlock</b> (Silberschatz). Each one makes the circle of waiting impossible:</p>
<ul>
  <li>allow <b>at most 4</b> philosophers at the table at the same time — with 4 philosophers and 5 chopsticks, at least one of them can always get both;</li>
  <li>let a philosopher pick up the chopsticks <b>only if both are available</b> (picking them up inside a critical section) — this is the monitor solution in the next section;</li>
  <li>use an <b>asymmetric</b> solution: an odd-numbered philosopher picks up first the left and then the right chopstick, while an even-numbered one picks up first the right and then the left.</li>
</ul>`,
      viz: [
        { name: 'flow', caption: 'The life cycle of a philosopher.', props: { dir: 'h', loop: true, steps: [
          { label: 'Think', tone: 'muted' }, { label: 'Lock left chopstick', tone: 'acc' }, { label: 'Lock right chopstick', tone: 'acc' },
          { label: 'Eat', tone: 'ok' }, { label: 'Unlock left', tone: 'c2' }, { label: 'Unlock right', tone: 'c2' }] } },
        { name: 'philosophers', caption: 'Try it: let everyone pick up the left chopstick → deadlock.', props: { n: 5 } }
      ],
      takeaway: 'Taking two semaphores one at a time can deadlock: if everyone holds the left chopstick and waits for the right one, the waiting forms a circle. Starvation is different: the system moves, but someone never eats. Fixes: at most 4 at the table, take both or none, or an asymmetric order.',
      exam: 'Why the semaphore solution can deadlock (circular wait); the difference between starvation and deadlock; ways to avoid the deadlock.'
    },
    {
      id: 'philo-monitor',
      h: 'Monitor solution to the dining philosophers',
      why: 'remove the deadlock with a monitor',
      lead: 'The deadlock appeared because a philosopher could hold one chopstick while waiting for the other. A monitor lets us check both chopsticks and take them in one protected step — or take none at all.',
      html: `
<p>This solution imposes the restriction that a philosopher may pick up her chopsticks <b>only if both of them are available</b>. To code it, we distinguish three states in which a philosopher can be:</p>
<ul>
  <li><b>THINKING</b> — she does not want either chopstick;</li>
  <li><b>HUNGRY</b> — she wants to eat (she wants to enter the critical section);</li>
  <li><b>EATING</b> — she has both chopsticks (she has entered the critical section).</li>
</ul>
<p>Philosopher i can set <code>state[i] = EATING</code> only if her two neighbors are not eating: <code>(state[(i+4)%5] != EATING) &amp;&amp; (state[(i+1)%5] != EATING)</code>. Here <code>(i+4)%5</code> is the left neighbor — it is i − 1, written so that it never becomes negative (for i = 0 it gives 4) — and <code>(i+1)%5</code> is the right neighbor.</p>
<p>We also declare <code>condition self[5];</code> — one condition variable per philosopher. It allows philosopher i to delay herself (<code>self[i].wait()</code>) when she is hungry but unable to obtain the chopsticks she needs.</p>
<p>The distribution of the chopsticks is controlled by the monitor <b>DiningPhilosophers</b>. Each philosopher, before starting to eat, must invoke the operation <code>pickup()</code>; after it completes successfully she may eat; afterwards she invokes <code>putdown()</code>:</p>
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
<p>How the three procedures work together:</p>
<ol class="steps">
  <li><code>pickup(i)</code>: become HUNGRY and call <code>test(i)</code>. If the test switched her to EATING, she eats at once; otherwise she waits on <code>self[i]</code>.</li>
  <li><code>test(i)</code>: if philosopher i is hungry and neither neighbor is eating, switch her to EATING and call <code>self[i].signal()</code> — this wakes her if she was waiting, and has no effect if she was not.</li>
  <li><code>putdown(i)</code>: become THINKING, then <b>test both neighbors</b> — one of them may have been waiting for exactly the chopstick that was just released.</li>
</ol>
<p>Because the whole check-and-take happens inside the monitor, no other philosopher can change the states in between. A philosopher therefore never holds one chopstick while waiting for the other, and the circle of waiting from the previous section cannot form.</p>
<div data-viz="0"></div>
<div class="callout key"><b>No deadlock</b> (chopsticks are taken only in pairs), <b>but starvation is still possible</b>: the two neighbors of a philosopher can take turns eating so that she never finds both chopsticks free.</div>`,
      viz: [{ name: 'stepper', caption: 'P1 eats, P2 is hungry and waits; putdown(1) wakes P2 up.', props: {
        lang: 'c',
        code: ['monitor DiningPhilosophers {', '  enum {THINKING, HUNGRY, EATING} state[5];', '  condition self[5];', '  void pickup(int i) {', '    state[i] = HUNGRY;', '    test(i);', '    if (state[i] != EATING) self[i].wait();', '  }', '  void putdown(int i) {', '    state[i] = THINKING;', '    test((i + 4) % 5);', '    test((i + 1) % 5);', '  }', '  void test(int i) {', '    if ((state[(i + 4) % 5] != EATING) &&', '        (state[i] == HUNGRY) &&', '        (state[(i + 1) % 5] != EATING)) {', '      state[i] = EATING;', '      self[i].signal();', '    }', '  }', '  initialization_code() {', '    for (int i = 0; i < 5; i++)', '      state[i] = THINKING;', '  }', '}'].join('\n'),
        steps: [
          { line: [23, 24], note: 'Initialization: everyone is THINKING.', vars: { state: 'T T T T T' } },
          { line: 5, note: 'P1: pickup(1) → state[1] = HUNGRY.', vars: { state: 'T H T T T' } },
          { line: [15, 16, 17, 18, 19], note: 'test(1): state[0] ≠ E, state[1] = H, state[2] ≠ E → EATING; self[1].signal() — nobody is waiting, so it has no effect.', vars: { state: 'T E T T T' } },
          { line: 7, note: 'state[1] == EATING → P1 does not wait; P1 eats.', vars: { state: 'T E T T T', eating: 'P1' } },
          { line: [5, 6], note: 'P2: pickup(2) → HUNGRY; test(2): the left neighbor state[1] == EATING → the condition is false.', vars: { state: 'T E H T T', eating: 'P1' } },
          { line: 7, note: 'state[2] ≠ EATING → self[2].wait(): P2 is suspended.', vars: { state: 'T E H T T', eating: 'P1', waiting: 'P2 on self[2]' } },
          { line: [10, 11], note: 'P1: putdown(1) → THINKING; test(0): state[0] is not HUNGRY → nothing happens.', vars: { state: 'T T H T T', waiting: 'P2 on self[2]' } },
          { line: [12, 15, 16, 17, 18, 19], note: 'test(2): neighbors 1 and 3 are not eating and state[2] = H → EATING, self[2].signal() → P2 resumes and eats.', vars: { state: 'T T E T T', eating: 'P2' } }
        ] } }],
      takeaway: 'The monitor solution takes both chopsticks or none: test(i) allows EATING only if neither neighbor is eating, a hungry philosopher waits on self[i], and putdown() tests both neighbors. No deadlock, but starvation is still possible.',
      exam: 'The full monitor code; the test(i) condition; the neighbor indices (i+4)%5 and (i+1)%5; no deadlock, but starvation is possible.'
    },
    {
      id: 'summary',
      h: 'Summary: from race condition to monitors',
      why: 'see the whole chain at once',
      lead: 'Each tool in this module was introduced to fix a weakness of the previous one. Side by side, the chain becomes clear.',
      html: `
<p>Read the table from top to bottom as a story: every row answers the problem left open by the row above it. Remember that every tool is just a way to write the entry and exit sections around a critical section.</p>
<table class="t">
  <tr><th>Tool</th><th>Entry / exit section</th><th>What it fixes</th><th>What is still wrong</th></tr>
  <tr><td><b>Disabling interrupts</b></td><td>interrupts off / on</td><td>no preemption inside the critical section (one CPU)</td><td>fails on multiprocessors; long critical sections freeze the system; starvation</td></tr>
  <tr><td><b>Peterson's solution</b></td><td>flag[] + turn, busy wait / flag[i] = false</td><td>pure software; meets all 3 requirements on paper</td><td>only 2 processes; broken by instruction reordering (needs memory barriers)</td></tr>
  <tr><td><b>Mutex lock (spinlock)</b></td><td>atomic acquire() / release()</td><td>correct on multiprocessors, thanks to hardware atomic instructions</td><td>busy waiting wastes CPU</td></tr>
  <tr><td><b>Semaphore</b></td><td>atomic wait() / signal() with a waiting queue</td><td>no busy waiting (block / wakeup); counts N resources; can order events</td><td>easy to misuse: swapped or missing calls → broken mutual exclusion or deadlock</td></tr>
  <tr><td><b>Monitor + condition variables</b></td><td>added by the compiler</td><td>mutual exclusion is automatic; x.wait() / x.signal() to wait for conditions</td><td>the signal semantics must be chosen (signal-and-wait or signal-and-continue)</td></tr>
</table>
<div class="callout key"><b>Levels of abstraction</b> (asked in the written quiz): from the lowest-level to the highest-level construct the order is <b>shared variable → mutex lock → semaphore → monitor</b>. A plain shared variable (like Peterson's flag and turn) is the most basic; a mutex lock is a simple tool built on hardware atomic instructions; a semaphore is "more sophisticated than a mutex" (it counts and blocks); a monitor is a "high-level abstraction" where the compiler adds the mutual exclusion for you.</div>
<p>The classic problems then showed how to combine the tools: readers–writers (a group lock shared by all readers), the printers (a counting semaphore for "how many" and a binary one for "which one") and the dining philosophers (several resources per process).</p>
<p>The dining philosophers also showed something that none of these tools prevents by itself: processes that each hold one resource and wait for another one forever. Correct mutual exclusion is not enough — a system can be perfectly synchronized and still stop. That problem, <b>deadlock</b>, is the subject of the next module.</p>`,
      takeaway: 'Each tool is a way to write the entry and exit sections. Going up the chain — interrupts → Peterson → mutex → semaphore → monitor — the tool becomes safer and easier to use, but none of them prevents deadlock on its own.'
    }
  ],
  terms: [
    { en: 'Synchronization', ru: 'синхронизация', def: 'Techniques that make sure concurrent processes access shared data only in safe orders.' },
    { en: 'Cooperating processes', ru: 'взаимодействующие процессы', def: 'Processes or threads that share data (variables, buffers, tables, files) and can affect each other.' },
    { en: 'Shared data', ru: 'общие (разделяемые) данные', def: 'Data that several processes or threads can read and write.' },
    { en: 'Interleaving', ru: 'чередование (выполнения)', def: 'The order in which the instructions of concurrent processes are mixed together by the scheduler.' },
    { en: 'Race condition', ru: 'состояние гонки', def: 'Several processes access shared data at the same time and the result depends on the order of execution.' },
    { en: 'Read–modify–write', ru: 'чтение–изменение–запись', def: 'Load a value, change it, store it back; if split by a context switch, one update can be lost.' },
    { en: 'Lost update', ru: 'потерянное обновление', def: 'One process overwrites the result of another because both started from the same old value.' },
    { en: 'Critical section', ru: 'критическая секция', def: 'The segment of code in which a process works with shared data; only one process may be in its critical section at a time.' },
    { en: 'Critical-section problem', ru: 'задача критической секции', def: 'Designing a protocol so that no two processes are in their critical sections at the same time.' },
    { en: 'Entry section', ru: 'секция входа', def: 'Code before the critical section where a process asks permission to enter.' },
    { en: 'Exit section', ru: 'секция выхода', def: 'Code after the critical section where a process announces that it has left.' },
    { en: 'Remainder section', ru: 'оставшаяся секция', def: 'The rest of the code of a process, outside the critical section.' },
    { en: 'Mutual exclusion', ru: 'взаимное исключение', def: 'If Pi is executing in its critical section, no other process can be executing in its critical section.' },
    { en: 'Progress', ru: 'прогресс', def: 'If the critical section is free and some processes want to enter, the choice of the next one cannot be postponed indefinitely.' },
    { en: 'Bounded waiting', ru: 'ограниченное ожидание', def: 'There is a limit on how many times others may enter their critical sections after a process has requested entry and before it is granted.' },
    { en: 'Starvation', ru: 'голодание', def: 'A process waits indefinitely while others keep being served; not a deadlock.' },
    { en: 'Hardware support', ru: 'аппаратная поддержка', def: 'Features of the CPU (disabling interrupts, atomic instructions, memory barriers) used to implement critical sections.' },
    { en: 'Disable interrupts', ru: 'запретить прерывания', def: 'Turn interrupts off so that the running code cannot be preempted; works only on a uniprocessor.' },
    { en: 'Interrupt-based solution', ru: 'решение на основе прерываний', def: 'Entry section: disable interrupts; exit section: enable interrupts.' },
    { en: 'Uniprocessor', ru: 'однопроцессорная система', def: 'A computer with a single CPU.' },
    { en: 'Multiprocessor', ru: 'многопроцессорная система', def: 'A computer with several CPUs (or cores) that run processes really in parallel.' },
    { en: 'Scalable', ru: 'масштабируемый', def: 'Keeps working well as the system grows, e.g. as the number of CPUs increases.' },
    { en: "Peterson's solution", ru: 'алгоритм Петерсона', def: 'A software solution for two processes using turn and flag[2]; correct on paper, not guaranteed on modern CPUs.' },
    { en: 'Busy waiting', ru: 'активное ожидание', def: 'A process waits by looping and re-checking a condition, using CPU time.' },
    { en: 'Instruction reordering', ru: 'переупорядочивание инструкций', def: 'The CPU or compiler changes the order of independent memory operations for speed; can break multithreaded code.' },
    { en: 'Memory barrier', ru: 'барьер памяти', def: 'An instruction that makes all memory operations before it complete and become visible before any operation after it.' },
    { en: 'Memory fence', ru: 'барьер памяти (fence)', def: 'Another name for a memory barrier.' },
    { en: 'Atomic operation', ru: 'атомарная операция', def: 'An operation that executes without interruption by any other process in the middle of it.' },
    { en: 'Hardware atomic instruction', ru: 'аппаратная атомарная инструкция', def: 'A CPU instruction that tests and modifies a memory word in one indivisible step.' },
    { en: 'Mutex lock', ru: 'мьютекс (блокировка взаимного исключения)', def: 'The simplest lock: a boolean available; acquire() before the critical section, release() after; both atomic.' },
    { en: 'Spinlock', ru: 'спин-блокировка', def: 'A lock whose waiting processes busy-wait (spin) in a loop.' },
    { en: 'Semaphore', ru: 'семафор', def: 'An integer variable accessed only through the atomic operations wait() and signal().' },
    { en: 'Binary semaphore', ru: 'двоичный семафор', def: 'A semaphore whose value is only 0 or 1; works like a mutex lock.' },
    { en: 'Counting semaphore', ru: 'считающий семафор', def: 'A semaphore with an unrestricted range of values; e.g. the number of free instances of a resource.' },
    { en: 'Waiting queue', ru: 'очередь ожидания', def: 'The list of processes blocked on a semaphore (or condition variable).' },
    { en: 'Ready queue', ru: 'очередь готовых процессов', def: 'Processes that are ready to run and wait for the CPU.' },
    { en: 'block', ru: 'заблокировать (процесс)', def: 'Place the calling process on the waiting queue of the semaphore; it uses no CPU while waiting.' },
    { en: 'wakeup', ru: 'разбудить (процесс)', def: 'wakeup(P): remove process P from the waiting queue and place it in the ready queue.' },
    { en: 'Monitor', ru: 'монитор', def: 'A high-level ADT of shared data + procedures + initialization code; only one process is active inside at a time.' },
    { en: 'Abstract data type', ru: 'абстрактный тип данных', def: 'ADT: data packed with the procedures that operate on it; the data is accessible only through those procedures.' },
    { en: 'Entry queue', ru: 'входная очередь (монитора)', def: 'The queue of processes waiting to enter a monitor.' },
    { en: 'Condition variable', ru: 'условная переменная', def: 'A queue inside a monitor: x.wait() suspends the caller, x.signal() resumes one waiter (no effect if nobody waits).' },
    { en: 'Signal-and-wait', ru: '«сигнал и ждать»', def: 'After x.signal() the signaling process waits until the awakened process leaves the monitor or waits on another condition.' },
    { en: 'Signal-and-continue', ru: '«сигнал и продолжить»', def: 'After x.signal() the awakened process waits until the signaler leaves the monitor or waits on another condition.' },
    { en: 'Readers–writers problem', ru: 'задача читателей и писателей', def: 'Many readers may read the shared data at once; a writer needs exclusive access.' },
    { en: 'First readers–writers problem', ru: 'первая задача читателей-писателей', def: 'Variant that prefers readers: writers wait while any reader is reading (writers may starve).' },
    { en: 'Second readers–writers problem', ru: 'вторая задача читателей-писателей', def: 'Variant that prefers writers: an arriving writer goes as soon as possible (readers may starve).' },
    { en: 'Data set', ru: 'набор данных', def: 'The shared data in a classic synchronization problem.' },
    { en: 'Data integrity', ru: 'целостность данных', def: 'The data stays correct and consistent.' },
    { en: 'Dining-philosophers problem', ru: 'задача об обедающих философах', def: '5 philosophers, 5 chopstick semaphores; each needs two at once; the naive solution can deadlock.' },
    { en: 'Deadlock', ru: 'взаимоблокировка', def: 'Each process in a group waits for a resource held by another process of the group, so none can continue.' },
    { en: 'Circular wait', ru: 'циклическое ожидание', def: 'A closed chain of processes, each waiting for a resource held by the next one.' },
    { en: 'Asymmetric solution', ru: 'асимметричное решение', def: 'Odd philosophers take the left chopstick first, even ones the right first; breaks the circular wait.' },
    { en: 'POSIX semaphore', ru: 'семафор POSIX', def: 'sem_t with sem_init(), sem_wait() (= wait) and sem_post() (= signal).' },
    { en: 'Context switch', ru: 'переключение контекста', def: 'Saving the state of one process and loading the state of another.' },
    { en: 'Preemption', ru: 'вытеснение', def: 'The OS takes the CPU away from a running process.' }
  ],
  questions: [
    { id: 'syn-01', type: 'single', q: 'Processes P0 and P1 call fork() at the same time. What can happen if access to next_available_pid is not synchronized?', options: ['fork() returns −1 to both processes', 'Two different processes get the same pid', 'P0 and P1 end up in a deadlock', 'The kernel assigns the pids in reverse order'], answer: 1, explain: 'Both read next_available_pid = 2615 before it is increased, so both children get pid 2615. It is not a deadlock: nobody waits for anybody.', section: 'race', diff: 1 },
    { id: 'syn-02', type: 'code', q: 'counter = 5. The producer executes counter++ and the consumer executes counter-- concurrently (each operation is 3 machine instructions). Which final values of counter are possible?', lang: 'c', code: '/* counter++ */\nregister1 = counter;\nregister1 = register1 + 1;\ncounter = register1;\n\n/* counter-- */\nregister2 = counter;\nregister2 = register2 - 1;\ncounter = register2;', options: ['Only 5', 'Only 4 or 6', '4, 5 or 6', '5 or 6'], answer: 2, explain: 'If the two operations do not overlap, the result is 5. If both load 5 before either stores, the last store wins: 4 (the consumer stores last) or 6 (the producer stores last).', section: 'race', diff: 2 },
    { id: 'syn-03', type: 'multi', q: 'Which requirements must a solution to the critical-section problem satisfy? (select all that apply)', options: ['Mutual exclusion', 'Hold and wait', 'Progress', 'Bounded waiting', 'No preemption'], answer: [0, 2, 3], explain: 'The three requirements are mutual exclusion, progress and bounded waiting. Hold and wait and no preemption are conditions for deadlock (next module).', section: 'requirements', diff: 1 },
    { id: 'syn-04', type: 'single', q: 'A process has asked to enter its critical section, but other processes can enter before it again and again, without any limit. Which requirement is violated?', options: ['Mutual exclusion', 'Progress', 'Atomicity', 'Bounded waiting'], answer: 3, explain: 'Bounded waiting requires a limit on how many times others may enter after a request. Progress is about the case where the critical section is free and nobody gets in at all.', section: 'requirements', diff: 2 },
    { id: 'syn-05', type: 'single', q: 'In which part of its code does a process ask permission to enter its critical section?', options: ['remainder section', 'entry section', 'exit section', 'critical section'], answer: 1, explain: 'Each process must ask permission to enter in the entry section. The exit section comes after the critical section; the remainder section is the rest of the code.', section: 'cs-problem', diff: 1 },
    { id: 'syn-06', type: 'tf', q: 'The solution “disable interrupts in the entry section, enable interrupts in the exit section” works correctly on a system with two CPUs.', answer: false, explain: 'Disabling interrupts affects only the CPU that does it; a process on the other CPU can enter its critical section at the same time. That is why this approach does not scale to multiprocessors.', section: 'interrupts', diff: 1 },
    { id: 'syn-07', type: 'multi', q: 'What are the problems of the interrupt-based solution? (select all that apply)', options: ['If the critical section runs for an hour, the system serves no interrupts for that whole hour', 'Starvation is possible: a process may never enter its critical section', 'It does not work with two CPUs', 'It violates mutual exclusion on a uniprocessor'], answer: [0, 1, 2], explain: 'On a uniprocessor, disabling interrupts does give mutual exclusion (the code runs without preemption). The problems are long critical sections, starvation and multiprocessors.', section: 'interrupts', diff: 2 },
    { id: 'syn-08', type: 'code', q: "Which condition belongs in the waiting loop of Peterson's solution for process Pi (j = 1 − i)?", lang: 'c', code: 'while (true) {\n    flag[i] = true;\n    turn = j;\n    while ( ??? )\n        ;\n    /* critical section */\n    flag[i] = false;\n    /* remainder section */\n}', options: ['flag[i] && turn == i', 'flag[j] || turn == j', 'flag[j] && turn == j', 'flag[j] && turn == i'], answer: 2, explain: 'Pi waits while Pj wants to enter AND it is Pj’s turn. With || Pi would wait whenever turn == j, even if Pj does not want to enter — a progress violation.', section: 'peterson', diff: 2 },
    { id: 'syn-09', type: 'single', q: "In Peterson's solution, process Pi enters its critical section only if…", options: ['flag[i] == true and turn == j', 'flag[j] == false or turn == i', 'flag[j] == true and turn == j', 'turn == j'], answer: 1, explain: 'From the correctness slide: Pi enters the critical section only if either flag[j] == false or turn == i. The third option is the opposite — the condition for waiting.', section: 'peterson', diff: 2 },
    { id: 'syn-10', type: 'single', q: "Why does Peterson's solution satisfy bounded waiting?", options: ['Because interrupts are disabled during the critical section', 'Because turn is reset to 0 after every critical section', 'Because flag[] is an atomic variable', 'Pi waits for at most one entry of Pj: if Pj wants to enter again, it sets turn = i and gives way'], answer: 3, explain: 'When Pj leaves it sets flag[j] = false; if it immediately wants to enter again, it writes turn = i and waits itself. So Pi waits for at most one entry of Pj.', section: 'peterson', diff: 3 },
    { id: 'syn-11', type: 'code', q: 'Thread 1 and Thread 2 run in parallel on a modern processor without a memory barrier. What can Thread 1 print?', lang: 'c', code: 'boolean flag = false;\nint x = 0;\n\n/* Thread 1 */\nwhile (!flag)\n    ;\nprint x;\n\n/* Thread 2 */\nx = 100;\nflag = true;', options: ['Only 100', 'Only 0', '100 or 0', 'Nothing: Thread 1 loops forever'], answer: 2, explain: 'flag and x are independent, so the writes of Thread 2 may be reordered (flag = true before x = 100), and Thread 1 may print 0. The expected output is 100.', section: 'reorder', diff: 2 },
    { id: 'syn-12', type: 'code', q: "Because of instruction reordering, the operations of Peterson's solution were executed in this order. How does it end?", lang: 'c', code: '/* actual order of execution */\nP0: turn = 1;                      /* flag[0] is still false */\nP1: flag[1] = true;\nP1: turn = 0;\nP1: while (flag[0] && turn == 0) ;  /* check */\nP0: flag[0] = true;\nP0: while (flag[1] && turn == 1) ;  /* check */', options: ['P0 and P1 end up in a deadlock', 'Both processes are in the critical section at the same time', 'Only P1 enters the CS, P0 waits', 'Only P0 enters the CS'], answer: 1, explain: "P1 sees flag[0] == false and enters. P0 then sees turn == 0 (P1 wrote turn last), so its waiting condition is false and it enters too. Mutual exclusion is violated — the slide \"Peterson's Solution Revisited\".", section: 'reorder', diff: 3 },
    { id: 'syn-13', type: 'single', q: 'What does a memory barrier do?', options: ['It disables interrupts during the critical section', 'It blocks a process until a lock is released', 'It guarantees that memory operations before the barrier are completed and visible before the operations after it', 'It clears the CPU cache'], answer: 2, explain: 'A barrier forbids reordering across it: with x = 100; memory_barrier(); flag = true; Thread 1 is sure to see x = 100.', section: 'reorder', diff: 2 },
    { id: 'syn-14', type: 'code', q: 'acquire() is written as ordinary, non-atomic code. What can happen if two threads call it at the same time while available == true?', lang: 'c', code: 'acquire() {\n    while (!available)\n        ;   /* busy wait */\n    available = false;\n}\n\nrelease() {\n    available = true;\n}', options: ['Both threads loop forever', 'Exactly one enters: the code is correct even without atomicity', 'Both threads pass the loop and enter the critical section', 'The kernel terminates one of the threads'], answer: 2, explain: 'Both may read available == true before either of them writes false. That is why acquire() and release() must be atomic (usually implemented with hardware atomic instructions).', section: 'mutex', diff: 2 },
    { id: 'syn-15', type: 'code', q: 'S1 (in P1) must execute before S2 (in P2). What should the initial value of synch be?', lang: 'c', code: 'semaphore synch = ?;\n\n/* P1 */\nS1;\nsignal(synch);\n\n/* P2 */\nwait(synch);\nS2;', options: ['1', '0', '2', '−1'], answer: 1, explain: 'With synch = 0, P2 blocks on wait(synch) until P1 has executed S1 and signal(synch). With 1, P2 could execute S2 before S1.', section: 'semaphore', diff: 1 },
    { id: 'syn-16', type: 'code', q: 'How does this end if the semaphore for the critical section is initialized like this?', lang: 'c', code: 'semaphore mutex = 0;\n\n/* code of every process */\nwait(mutex);\n/* critical section */\nsignal(mutex);', options: ['Everything works correctly', 'Two processes can be in the CS at the same time', 'The first process enters, the others never do', 'No process ever enters the CS: all of them block on wait()'], answer: 3, explain: 'With mutex = 0 the very first wait() blocks, and nobody is able to call signal() — all processes wait forever. A critical section needs mutex = 1.', section: 'semaphore', diff: 2 },
    { id: 'syn-17', type: 'code', q: 'Implementation without busy waiting, S->value = 1. P1, P2 and P3 call wait(S) in this order, then P1 calls signal(S). What is the state now?', lang: 'c', code: 'wait(semaphore *S) {\n    S->value--;\n    if (S->value < 0) {\n        add this process to S->list;\n        block();\n    }\n}\nsignal(semaphore *S) {\n    S->value++;\n    if (S->value <= 0) {\n        remove a process P from S->list;\n        wakeup(P);\n    }\n}', options: ['value = 0, P2 and P3 are both woken up', 'value = −1, P2 has moved to the ready queue, P3 still waits in S->list', 'value = 1, all processes are in the ready queue', 'value = −2, nobody is woken up'], answer: 1, explain: 'wait: 1→0 (P1 enters), 0→−1 (P2 blocks), −1→−2 (P3 blocks). signal: −2→−1, which is ≤ 0, so wakeup(P2). P3 stays in the list.', section: 'sem-impl', diff: 3 },
    { id: 'syn-18', type: 'single', q: 'In the implementation without busy waiting, S->value = −3. What does it mean?', options: ['3 instances of the resource are available', '3 processes are in their critical section', '3 processes are blocked in S->list', 'Error: the value cannot be negative'], answer: 2, explain: 'wait() decreases the value before checking it, so a negative value equals minus the number of processes waiting in the queue.', section: 'sem-impl', diff: 2 },
    { id: 'syn-19', type: 'code', q: 'What is wrong with this code?', lang: 'c', code: 'signal(mutex);\n/* critical section */\nwait(mutex);', options: ['The process blocks forever', 'Several processes can be in the critical section at the same time', 'A compilation error', 'The code is correct'], answer: 1, explain: 'signal() before the critical section increases mutex instead of taking it, so nothing limits entry — mutual exclusion is violated.', section: 'sem-problems', diff: 1 },
    { id: 'syn-20', type: 'code', q: 'What happens when this code runs (mutex = 1)?', lang: 'c', code: 'wait(mutex);\n/* critical section */\nwait(mutex);', options: ['The process blocks forever on the second wait() (deadlock)', 'Several processes end up in the CS', 'mutex returns to 1 and execution continues', 'The second wait() is ignored'], answer: 0, explain: 'The first wait: 1→0. The second wait at 0 blocks the process, and nobody will ever call signal() — a deadlock; other processes cannot enter either.', section: 'sem-problems', diff: 2 },
    { id: 'syn-21', type: 'single', q: 'How many processes can be active inside a monitor at the same time?', options: ['At most two', 'Any number, if they only read', 'Only one', 'As many as there are condition variables'], answer: 2, explain: 'The key property of a monitor: only one process may be active within the monitor at a time; the others wait in the entry queue.', section: 'monitors', diff: 1 },
    { id: 'syn-22', type: 'code', q: 'A monitor is implemented with a semaphore. What should the initial value of mutex be?', lang: 'c', code: 'semaphore mutex = ?;\n\n/* every monitor procedure P is replaced by */\nwait(mutex);\n    /* body of P */\nsignal(mutex);', options: ['0', '1', 'the number of monitor procedures', '−1'], answer: 1, explain: 'mutex = 1 lets exactly one process into the monitor — mutual exclusion within the monitor. With 0 nobody could enter.', section: 'monitors', diff: 1 },
    { id: 'syn-23', type: 'tf', q: 'If no process has called x.wait(), the operation x.signal() has no effect — unlike signal() on a semaphore.', answer: true, explain: 'x.signal() resumes one waiting process, and if there is none it changes nothing. A semaphore signal() always increases the value, so it is remembered.', section: 'condvars', diff: 2 },
    { id: 'syn-24', type: 'code', q: 'Why does F2 need the check of done?', lang: 'c', code: 'F1:              /* called by P1 */\n    S1;\n    done = true;\n    x.signal();\n\nF2:              /* called by P2 */\n    if (done == false)\n        x.wait();\n    S2;', options: ['To ensure mutual exclusion in the monitor', 'If F1 runs first, its x.signal() is lost, and without the check P2 would wait forever', 'So that P1 does not execute S1 twice', 'Without it there is a compilation error'], answer: 1, explain: 'x.signal() with nobody waiting has no effect (it is not remembered). done records that S1 has already happened, so P2 does not call x.wait().', section: 'condvars', diff: 2 },
    { id: 'syn-25', type: 'single', q: 'P1 called x.signal() and woke up P2. Under which semantics is P1 suspended until P2 leaves the monitor (or waits on another condition)?', options: ['signal-and-continue', 'busy waiting', 'signal-and-wait', 'bounded waiting'], answer: 2, explain: 'Signal-and-wait: the signaling process waits. With signal-and-continue the awakened P2 waits instead.', section: 'condvars', diff: 2 },
    { id: 'syn-26', type: 'single', q: 'Signal-and-continue means that…', options: ['the awakened process waits until the signaler leaves the monitor (or starts waiting)', 'the signaling process waits until the awakened process leaves the monitor', 'both processes continue in the monitor at the same time', 'the signal is postponed until the next x.wait()'], answer: 0, explain: 'The signaler continues, and the awakened process waits until the monitor is free. Both running at once is exactly the problem that these semantics solve.', section: 'condvars', diff: 2 },
    { id: 'syn-27', type: 'single', q: 'In the implementation of signal-and-wait with semaphores, what does next_count store?', options: ['The number of processes in the entry queue', 'The number of processes waiting on condition x', 'The number of the next process to enter', 'The number of processes suspended inside the monitor after x.signal() (waiting on next)'], answer: 3, explain: 'next_count counts the signaling processes blocked on the semaphore next. The number of processes waiting on x is stored in x_count.', section: 'sw-impl', diff: 2 },
    { id: 'syn-28', type: 'code', q: 'Why is there this check when a monitor procedure ends?', lang: 'c', code: 'wait(mutex);\n    /* body of P */\nif (next_count > 0)\n    signal(next);\nelse\n    signal(mutex);', options: ['So that next_count does not become negative', 'To wake up all processes in the entry queue', 'The monitor is handed first to a process suspended after x.signal(); only if there is none is the entry opened to new processes', 'To release condition variable x'], answer: 2, explain: 'Signalers wait on next inside the monitor and have priority. Otherwise signal(mutex) lets in a process from the entry queue.', section: 'sw-impl', diff: 3 },
    { id: 'syn-29', type: 'single', q: 'In the “first readers–writers” problem, preference is given to…', options: ['readers: while they are reading, writers wait', 'writers: an arriving writer starts as soon as possible', 'whoever came first (FIFO)', 'the process with the smallest pid'], answer: 0, explain: 'First readers–writers = preference to readers; second readers–writers = preference to writers.', section: 'rw', diff: 1 },
    { id: 'syn-30', type: 'code', q: 'First readers–writers solution, with semaphores implemented without busy waiting (the value can be negative). Three readers are reading, and one writer has called wait(rw_mutex) and is waiting. What are read_count and rw_mutex?', lang: 'c', code: '/* rw_mutex = 1, mutex = 1, read_count = 0 */\n/* reader */\nwait(mutex);\nread_count++;\nif (read_count == 1)\n    wait(rw_mutex);\nsignal(mutex);\n/* reading is performed */\nwait(mutex);\nread_count--;\nif (read_count == 0)\n    signal(rw_mutex);\nsignal(mutex);\n\n/* writer */\nwait(rw_mutex);\n/* writing is performed */\nsignal(rw_mutex);', options: ['read_count = 3, rw_mutex = −2', 'read_count = 1, rw_mutex = 0', 'read_count = 3, rw_mutex = 0', 'read_count = 3, rw_mutex = −1'], answer: 3, explain: 'Only the first reader calls wait(rw_mutex): 1→0. The writer: 0→−1, and it blocks. The other readers do not touch rw_mutex, so read_count = 3 and rw_mutex = −1.', section: 'rw', diff: 3 },
    { id: 'syn-31', type: 'single', q: 'What problem does the first readers–writers solution (rw_mutex / mutex / read_count) have?', options: ['Two writers can write at the same time', 'A writer may never get access (starvation) if readers keep arriving', 'A reader and a writer can work on the data at the same time', 'A deadlock between readers'], answer: 1, explain: 'While read_count > 0, rw_mutex is not released, and new readers enter without waiting — the writer starves.', section: 'rw', diff: 2 },
    { id: 'syn-32', type: 'code', q: 'All 5 philosophers execute their first wait() at the same time. What happens?', lang: 'c', code: '/* semaphore chopstick[5], all = 1 */\nwhile (true) {\n    wait(chopstick[i]);\n    wait(chopstick[(i + 1) % 5]);\n    /* eat for awhile */\n    signal(chopstick[i]);\n    signal(chopstick[(i + 1) % 5]);\n    /* think for awhile */\n}', options: ['One philosopher starves, the others eat', 'Everyone eats in turn without problems', 'Exactly two philosophers eat', 'Deadlock: each holds the left chopstick and waits for the right one (circular wait)'], answer: 3, explain: 'All chopstick[i] become 0, so the second wait() blocks everyone; each waits for the chopstick held by the right neighbor — a circular wait, so a deadlock.', section: 'philosophers', diff: 1 },
    { id: 'syn-33', type: 'tf', q: 'Two fast philosophers in opposite seats keep eating, and the other three never eat. This is a deadlock.', answer: false, explain: 'It is starvation: there is no circular waiting, the system keeps moving, and everyone formally has a chance to eat.', section: 'philosophers', diff: 2 },
    { id: 'syn-34', type: 'multi', q: 'Which changes remove the deadlock in the dining philosophers? (select all that apply)', options: ['At most 4 philosophers at the table at the same time', 'Pick up the chopsticks only if both are free (picking up inside a critical section)', 'Asymmetric: an odd philosopher takes left then right, an even one takes right then left', 'All philosophers take the right chopstick first, then the left'], answer: [0, 1, 2], explain: 'The first three break the circular wait. If everyone takes the right chopstick first, the situation is just as symmetric and the deadlock remains.', section: 'philosophers', diff: 2 },
    { id: 'syn-35', type: 'code', q: 'state (philosophers 0–4) = [EATING, HUNGRY, THINKING, THINKING, THINKING]; philosopher 1 waits on self[1]. Philosopher 0 calls putdown(0). What happens?', lang: 'c', code: 'void putdown(int i) {\n    state[i] = THINKING;\n    test((i + 4) % 5);\n    test((i + 1) % 5);\n}\n\nvoid test(int i) {\n    if ((state[(i + 4) % 5] != EATING) &&\n        (state[i] == HUNGRY) &&\n        (state[(i + 1) % 5] != EATING)) {\n        state[i] = EATING;\n        self[i].signal();\n    }\n}', options: ['Philosopher 4 starts eating', 'Philosopher 1 becomes EATING and is resumed by self[1].signal()', 'Nothing: philosopher 1 waits until it calls test(1) itself', 'Deadlock'], answer: 1, explain: 'test(4): philosopher 4 is THINKING, not hungry. test(1): state[0] = THINKING, state[1] = HUNGRY, state[2] = THINKING → EATING and self[1].signal().', section: 'philo-monitor', diff: 3 },
    { id: 'syn-36', type: 'tf', q: 'The monitor solution to the dining philosophers prevents deadlock, but starvation is still possible.', answer: true, explain: 'Chopsticks are taken only in pairs, so there is no circular wait. But the neighbors can alternate so that one philosopher never eats.', section: 'philo-monitor', diff: 1 },
    { id: 'syn-37', type: 'code', q: 'Printer exercise. Which initial values of the semaphores are correct?', lang: 'c', code: 'semaphore printers = ?;\nsemaphore mutex = ?;\n\nwait(printers);\nwait(mutex);\nprinter_id = find_free_printer();\nmark_occupied(printer_id);\nsignal(mutex);\nprint_document(printer_id);\nwait(mutex);\nmark_free(printer_id);\nsignal(mutex);\nsignal(printers);', options: ['printers = 1, mutex = 3', 'printers = 3, mutex = 0', 'printers = 3, mutex = 1', 'printers = 0, mutex = 1'], answer: 2, explain: 'printers is a counting semaphore equal to the number of free printers (3); mutex is a binary semaphore for the printer list (1). With mutex = 0 nobody could choose a printer.', section: 'printers', diff: 2 },
    { id: 'syn-38', type: 'single', q: 'What can happen if wait(mutex) and signal(mutex) around find_free_printer() are removed in the printer exercise?', options: ['More than 3 processes print at the same time', 'Two processes choose the same free printer (race condition)', 'A deadlock on the semaphore printers', 'Nothing: printers already guarantees correctness'], answer: 1, explain: 'printers limits only how many processes print (≤ 3), not which printer each one picks: two processes can see printer_free[i] == 1 at the same time.', section: 'printers', diff: 2 },
    { id: 'syn-39', type: 'code', q: 'In the printer exercise a programmer swapped the first two wait() calls. What can happen when all 3 printers are busy?', lang: 'c', code: 'User_Process() {\n    wait(mutex);          /* swapped */\n    wait(printers);\n    printer_id = find_free_printer();\n    mark_occupied(printer_id);\n    signal(mutex);\n    print_document(printer_id);\n    wait(mutex);\n    mark_free(printer_id);\n    signal(mutex);\n    signal(printers);\n}', options: ['Nothing: the order of wait() calls does not matter', 'Deadlock: the process holds mutex and sleeps on printers, while the printing processes cannot release their printers because they need mutex', 'More than 3 processes print at the same time', 'Two processes get the same printer'], answer: 1, explain: 'With printers = 0 the process blocks while holding mutex. A printing process calls wait(mutex) to release its printer and blocks too. Nobody can call signal(printers) → deadlock.', section: 'printers', diff: 3 },
    { id: 'syn-40', type: 'single', q: 'Why is the mutex lock with acquire() { while (!available) ; available = false; } called a spinlock?', options: ['Because a waiting process keeps looping on the condition and uses the CPU (busy waiting)', 'Because the lock is passed between processes in a circle', 'Because it relies on the Round Robin scheduler', 'Because it disables interrupts while it is held'], answer: 0, explain: 'The waiting process “spins” in the while loop, checking available again and again — busy waiting. Semaphores with a waiting queue avoid this by putting the waiting process to sleep.', section: 'mutex', diff: 1 },
    { id: 'syn-41', type: 'single', q: 'Which tool makes mutual exclusion automatic, so that a programmer cannot swap or forget the wait()/signal() calls around shared data?', options: ['Counting semaphore', 'Spinlock', 'Monitor', 'Memory barrier'], answer: 2, explain: 'In a monitor the shared data is reachable only through its procedures, and the compiler wraps every procedure in wait(mutex)/signal(mutex). With semaphores and spinlocks the programmer writes the calls by hand.', section: 'summary', diff: 1 },
    { id: 'syn-42', type: 'tf', q: 'A binary semaphore initialized to 1 can be used in the same way as a mutex lock.', answer: true, explain: 'A binary semaphore takes only the values 0 and 1, like a lock that is taken or free: wait() acts as acquire() and signal() acts as release().', section: 'semaphore', diff: 1 },
    { id: 'syn-43', type: 'single', q: 'Which piece of code is a critical section?', options: ['Code that updates a table shared with other processes', 'Code that computes only with local variables', 'The code in which a process asks permission to enter', 'Code that runs after the exit section and touches no shared data'], answer: 0, explain: 'A critical section is where the process changes common variables, updates a table, writes a file — it works with shared data. Asking permission is the entry section; code without shared data is the remainder section.', section: 'cs-problem', diff: 1 },
    { id: 'syn-44', type: 'single', q: 'Why is busy waiting acceptable inside the implementation of wait()/signal(), but not as the way applications wait for a semaphore?', options: ['The wait/signal code is short, so its critical section is held only briefly; applications may stay in their critical sections for a long time', 'Busy waiting is never used inside the kernel', 'Applications run in kernel mode, where busy waiting is forbidden', 'The waiting queue makes busy waiting faster'], answer: 0, explain: 'From the slide: the implementation code is short, so there is little busy waiting; but applications may spend lots of time in critical sections, so spinning there is not a good solution.', section: 'sem-impl', diff: 2 },
    {id: "syn-45",type: "single",q: "From the lowest-level (most basic) construct to the highest-level synchronization mechanism, the order is:",options: ["Variable → Mutex lock → Semaphore → Monitor","Mutex lock → Variable → Semaphore → Monitor","Variable → Mutex lock → Monitor → Semaphore","Variable → Semaphore → Mutex lock → Monitor"],answer: 0,explain: "A shared variable is the most basic; a mutex lock is built on atomic hardware instructions; a semaphore is more sophisticated than a mutex; a monitor is a high-level abstraction where the compiler adds mutual exclusion.",section: "summary",diff: 1}
  ]
});
