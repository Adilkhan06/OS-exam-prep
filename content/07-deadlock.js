OS.addModule({
  id: 'deadlock',
  num: 7,
  group: 'theory',
  title: 'Deadlocks',
  titleRu: 'Взаимоблокировки',
  icon: '🔁',
  sources: ['7-Deadlock.pdf'],
  summary: 'When waiting never ends: the system model, the four necessary conditions, the resource-allocation graph, and the four ways to handle deadlock — prevention, avoidance (safe state, claim edges, Banker’s algorithm), detection (wait-for graph) and recovery.',
  bridge: 'The Synchronization module ended with the dining philosophers: every philosopher held one chopstick and waited forever for the next one. Locks and semaphores make processes wait for each other — and if the waiting goes around in a circle, it never ends. This module studies that situation, deadlock, and what an OS can do about it.',
  intro: `
<p>Processes do not only share data; they also compete for <b>resources</b> — locks, semaphores, memory, devices. A process asks for a resource, uses it and gives it back. If the resource is busy, the process waits, and normally the holder soon releases it. But if the waiting closes into a circle — A waits for B, and B waits for A — nobody will ever release anything. This is a <b>deadlock</b>, and no amount of waiting can fix it.</p>
<p>The module follows one line of thought. First we define deadlock precisely and find the <b>four conditions</b> that must all hold for it to happen. Then we get a picture to reason with, the <b>resource-allocation graph</b>, where a deadlock shows up as a cycle. With these two tools we study the possible strategies, ordered by <i>when</i> they act: <b>prevention</b> (design the system so that one condition can never hold), <b>avoidance</b> (check every request and grant it only if the system stays in a <i>safe state</i> — Banker's algorithm), <b>detection</b> (let deadlocks happen, then find them) and <b>recovery</b> (break them by terminating processes or taking resources away) — plus the option of simply ignoring the problem.</p>`,
  sections: [
    {
      id: 'model',
      h: 'System model and what a deadlock is',
      why: 'define the problem precisely',
      lead: 'To talk about deadlock precisely we first need a simple model: what a resource is, and how processes use resources.',
      html: `
<p>A system consists of <b>resources</b>, grouped into <b>resource types</b> R<sub>1</sub>, R<sub>2</sub>, …, R<sub>m</sub> — for example CPU cycles, memory space and I/O devices (and, from the previous module, locks and semaphores). Each resource type R<sub>i</sub> has W<sub>i</sub> <b>instances</b>: identical copies, any of which can satisfy a request. A computer with two identical printers has one resource type "printer" with 2 instances.</p>
<p>Each process utilizes a resource in three steps:</p>
<ol class="steps">
  <li><b>Request</b> — ask for an instance. If none is free, the process waits.</li>
  <li><b>Use</b> — work with it (print, update the buffer, run the critical section…).</li>
  <li><b>Release</b> — give it back so that others can use it.</li>
</ol>
<p>Waiting in step 1 is normal: sooner or later the holder reaches step 3. The trouble starts when the holder is itself waiting — for something that the first process holds.</p>
<div class="callout key"><b>Deadlock</b> is a situation in which two or more processes are unable to proceed because <b>each is waiting for the other to release resources</b>.</div>
<p>The slide's picture shows the smallest example. Follow the arrows: R1 is assigned to P1, and P1 is waiting for R2; R2 is assigned to P2, and P2 is waiting for R1. Each process needs the resource that the other one holds, and neither will release its own resource before it gets the other one — so both wait forever.</p>
<div data-viz="0"></div>
<p>Compare deadlock with <b>starvation</b> from the earlier modules. A starving process waits for a very long time, but the system keeps working and the process <i>could</i> still run one day. The processes in a deadlock <i>can never</i> run again unless something outside the group intervenes.</p>`,
      viz: [
        { name: 'graph', caption: 'Slide "What is a deadlock": P1 holds R1 and waits for R2; P2 holds R2 and waits for R1.', props: {
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
      ],
      takeaway: 'Resources have types and instances; a process requests, uses and releases them. A deadlock is when two or more processes each wait for a resource held by another one of them, so none of them can ever continue on its own.',
      exam: 'The definition of deadlock; request → use → release; how deadlock differs from starvation.'
    },
    {
      id: 'sem-deadlock',
      h: 'Deadlock with semaphores',
      why: 'how it happens in real code',
      lead: 'The definition can feel abstract. Here is how a deadlock appears in ordinary code with the semaphores of the previous module — although no single line is wrong.',
      html: `
<p>Data: a semaphore <code>S1</code> initialized to 1, a semaphore <code>S2</code> initialized to 1, and two threads, T1 and T2. Each thread needs both semaphores, but they take them in a <b>different order</b>:</p>
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
<p>Let us assume that the scheduler interleaves them like this:</p>
<ol class="steps">
  <li>T1 executes <code>wait(s1)</code> (s1: 1 → 0) and is <b>preempted</b>.</li>
  <li>T2 executes <code>wait(s2)</code> (s2: 1 → 0) and then <code>wait(s1)</code> → s1 is 0, so T2 blocks.</li>
  <li>T1 resumes and executes <code>wait(s2)</code> → s2 is 0, so T1 blocks. The resource will not be released by T2, because T2 first needs s1, which T1 would have to release first.</li>
  <li>T1 and T2 are in a <b>deadlock</b>.</li>
</ol>
<div data-viz="0"></div>
<div class="callout note">The deadlock <b>does not occur</b> if T1 executes both <code>wait(s1)</code> and <code>wait(s2)</code> before T2 starts: then T2 simply waits until T1 signals. Whether the unlucky interleaving happens <b>depends on the OS scheduler</b>.</div>
<p>This is what makes deadlocks dangerous in practice: the code works in thousands of test runs and then freezes once, when the timing is unlucky. Instead of hoping for good timing, we want to know exactly <i>which conditions</i> make a deadlock possible — then we can attack those conditions.</p>`,
      viz: [{ name: 'stepper', caption: 'An unlucky interleaving of T1 and T2.', props: {
        lang: 'c',
        code: ['/* T1 */', 'wait(s1);', 'wait(s2);', '/* ... */', 'signal(s2);', 'signal(s1);', '', '/* T2 */', 'wait(s2);', 'wait(s1);', '/* ... */', 'signal(s1);', 'signal(s2);'].join('\n'),
        steps: [
          { line: 2, note: 'T1: wait(s1) → s1 = 0, T1 holds s1. The scheduler preempts T1.', vars: { s1: 0, s2: 1, T1: 'holds s1', T2: '—' } },
          { line: 9, note: 'T2: wait(s2) → s2 = 0, T2 holds s2.', vars: { s1: 0, s2: 0, T1: 'holds s1', T2: 'holds s2' } },
          { line: 10, note: 'T2: wait(s1) → s1 is taken → T2 blocks.', vars: { s1: 0, s2: 0, T1: 'holds s1', T2: 'holds s2, waits s1' } },
          { line: 3, note: 'T1: wait(s2) → s2 is taken → T1 blocks. Each one waits for the other → DEADLOCK.', vars: { s1: 0, s2: 0, T1: 'holds s1, waits s2', T2: 'holds s2, waits s1' } }
        ] } }],
      takeaway: 'Two threads that take the same two semaphores in opposite orders can deadlock, but only under an unlucky interleaving chosen by the scheduler. The bug is in the combination of the two threads, not in any single line.',
      exam: 'Find an interleaving that leads to deadlock and explain why it depends on the scheduler.'
    },
    {
      id: 'conditions',
      h: 'Deadlock characterization: four necessary conditions',
      why: 'what a deadlock needs',
      lead: 'Look again at T1 and T2 (or at the philosophers) and ask: what exactly had to be true for them to get stuck? There are four answers, and a deadlock can arise only if all four hold at the same time.',
      html: `
<p>A deadlock can arise if the following four conditions hold <b>simultaneously</b>. The table gives each condition and shows where it appears in the T1/T2 example:</p>
<table class="t">
  <tr><th>Condition</th><th>Meaning</th><th>In the T1/T2 example</th></tr>
  <tr><td><b>Mutual exclusion</b></td><td>only one thread at a time can use a resource</td><td>a semaphore with value 1 lets only one thread through</td></tr>
  <tr><td><b>Hold and wait</b></td><td>a thread holding at least one resource is waiting to acquire additional resources held by other threads</td><td>T1 holds s1 and waits for s2</td></tr>
  <tr><td><b>No preemption</b></td><td>a resource can be released only voluntarily by the thread holding it, after that thread has completed its task</td><td>nobody can take s1 away from T1</td></tr>
  <tr><td><b>Circular wait</b></td><td>there exists a set {T<sub>0</sub>, T<sub>1</sub>, …, T<sub>n</sub>} of waiting threads such that T<sub>0</sub> is waiting for a resource held by T<sub>1</sub>, T<sub>1</sub> for one held by T<sub>2</sub>, …, T<sub>n−1</sub> for one held by T<sub>n</sub>, and T<sub>n</sub> for one held by T<sub>0</sub></td><td>T1 waits for T2, and T2 waits for T1</td></tr>
</table>
<p>Read the four rows as a chain of causes: resources are exclusive (1), so threads have to wait for them; a thread waits while still holding something (2); nobody can force it to let go (3); and the waits close into a loop (4). Remove any link and the chain breaks.</p>
<div class="callout key">The conditions are <b>necessary</b>: if even one of them does not hold, a deadlock is impossible. This simple fact is the basis of deadlock <b>prevention</b>.</div>
<p>Do not confuse these four <i>deadlock conditions</i> with the three <i>requirements</i> for a critical-section solution (mutual exclusion, progress, bounded waiting). Only "mutual exclusion" appears in both lists.</p>`,
      takeaway: 'A deadlock needs all four: mutual exclusion, hold and wait, no preemption and circular wait. Break any one of them and deadlock cannot happen.',
      exam: 'List the four conditions with their definitions; recognize a condition from its description.'
    },
    {
      id: 'rag',
      h: 'Resource-allocation graph (RAG)',
      why: 'who holds what, who waits',
      lead: 'Circular wait is a loop of “waits for” relations, and a loop is easiest to see in a picture. So we draw the system as a graph: who holds what, and who waits for what.',
      html: `
<p><b>Deadlock detection</b> is the process of finding out whether any processes are stuck waiting in a loop. One of the techniques is the <b>resource-allocation graph (RAG)</b>: a graph with a set of vertices <b>V</b> and a set of edges <b>E</b>.</p>
<p>The vertices <b>V</b> are partitioned into two types:</p>
<ul>
  <li><b>Thread vertices</b>: T = {T<sub>1</sub>, T<sub>2</sub>, …, T<sub>n</sub>}, the set of all the threads in the system — drawn as <b>circles</b>;</li>
  <li><b>Resource vertices</b>: R = {R<sub>1</sub>, R<sub>2</sub>, …, R<sub>m</sub>}, the set of all resource types in the system — drawn as <b>boxes</b>. The number of <b>dots</b> inside a box shows how many instances there are: a <b>single-instance</b> resource type is a box with one dot, a <b>multi-instance</b> resource type is a box with many dots.</li>
</ul>
<p>The edges <b>E</b> are of two types, and their direction carries the meaning:</p>
<ul>
  <li><b>Request edge</b> — the directed edge <b>T<sub>i</sub> → R<sub>j</sub></b>: thread T<sub>i</sub> has requested an instance of R<sub>j</sub> and is waiting for it (the arrow points from the thread to what it wants);</li>
  <li><b>Assignment edge</b> — the directed edge <b>R<sub>j</sub> → T<sub>i</sub></b>: an instance of R<sub>j</sub> has been allocated to T<sub>i</sub> (the arrow points from the resource to its holder).</li>
</ul>
<p>The first figure shows the edge types and two kinds of resource boxes. (The dashed <b>claim edge</b> is used later, for avoidance.)</p>
<div data-viz="0"></div>
<p>Now follow the arrows. A path T → R → T reads "this thread waits for a resource held by that thread". So a <b>cycle</b> in the graph is exactly a circular wait. <b>Example 1</b>: if there is a cycle in the RAG and each resource in the cycle provides <b>only one instance</b>, then the processes in the cycle are deadlocked:</p>
<div data-viz="1"></div>
<p><b>Example 2</b> (the slide's RAG example, which we reuse in the next section): one instance of R<sub>1</sub>, two instances of R<sub>2</sub>, one instance of R<sub>3</sub>, three instances of R<sub>4</sub>.</p>
<ul>
  <li>T<sub>1</sub> holds one instance of R<sub>2</sub> and is waiting for an instance of R<sub>1</sub>;</li>
  <li>T<sub>2</sub> holds one instance of R<sub>1</sub> and one instance of R<sub>2</sub>, and is waiting for an instance of R<sub>3</sub>;</li>
  <li>T<sub>3</sub> holds one instance of R<sub>3</sub>.</li>
</ul>
<div data-viz="2"></div>
<div class="callout note">There is <b>no cycle</b>, so there is <b>no deadlock</b>. The chain of waits ends at T<sub>3</sub>, which waits for nothing: T<sub>3</sub> finishes and releases R<sub>3</sub> → T<sub>2</sub> gets it, finishes and releases R<sub>1</sub> → T<sub>1</sub> gets it and finishes.</div>`,
      viz: [
        { name: 'graph', caption: 'Edge types: request, assignment (and claim — used for avoidance); a resource with 1 instance and one with 3 instances.', props: {
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
        { name: 'graph', caption: 'Cycle T1 → R1 → T2 → R2 → T1 with one instance per resource → deadlock.', props: {
          w: 440, h: 300,
          nodes: [
            { id: 'R1', label: 'R1', x: 220, y: 45, shape: 'res', inst: 1, w: 70, h: 40 },
            { id: 'T1', label: 'T1', x: 100, y: 150, shape: 'circle', tone: 'bad' },
            { id: 'T2', label: 'T2', x: 340, y: 150, shape: 'circle', tone: 'bad' },
            { id: 'R2', label: 'R2', x: 220, y: 255, shape: 'res', inst: 1, w: 70, h: 40 }],
          edges: [
            { from: 'T1', to: 'R1', tone: 'bad' }, { from: 'R1', to: 'T2', tone: 'bad' },
            { from: 'T2', to: 'R2', tone: 'bad' }, { from: 'R2', to: 'T1', tone: 'bad' }] } },
        { name: 'graph', caption: 'The slide’s RAG example: no cycles, so no deadlock.', props: {
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
      takeaway: 'In a RAG, circles are threads and boxes with dots are resource types with their instances. Request edge T → R (waiting), assignment edge R → T (holding). A cycle is a circular wait; if every resource in it has one instance, it is a deadlock.',
      exam: 'Edge directions (request T → R, assignment R → T); read a graph: who holds what and who waits for what.'
    },
    {
      id: 'rag-examples',
      h: 'Cycles in the RAG: deadlock or not?',
      why: 'read the graph correctly',
      lead: 'With one instance per resource, a cycle means deadlock. But what if a resource has several instances? Then a thread in the cycle may still get a free instance — or one released by a thread outside the cycle.',
      html: `
<p><b>RAG with a deadlock.</b> Take Example 2 and add one request: <b>T<sub>3</sub> → R<sub>2</sub></b>. Both instances of R<sub>2</sub> are already held (by T<sub>1</sub> and T<sub>2</sub>). Now the graph contains two cycles:</p>
<div class="formula">T1 → R1 → T2 → R3 → T3 → R2 → T1 &nbsp;&nbsp;|&nbsp;&nbsp; T2 → R3 → T3 → R2 → T2</div>
<p>T<sub>1</sub>, T<sub>2</sub> and T<sub>3</sub> are deadlocked. T<sub>3</sub> waits for R<sub>2</sub>, which is held by T<sub>1</sub> and T<sub>2</sub>; but T<sub>1</sub> waits for R<sub>1</sub> (held by T<sub>2</sub>), and T<sub>2</sub> waits for R<sub>3</sub> (held by T<sub>3</sub>). Every holder of R<sub>2</sub> is itself stuck in the cycle, so no instance of R<sub>2</sub> will ever be freed.</p>
<div data-viz="0"></div>
<p><b>RAG without a deadlock</b> (the third graph on the slide): the same graph, but R<sub>2</sub> has <b>3 instances</b>. The cycle is still drawn, but one instance of R<sub>2</sub> is free, so T<sub>3</sub>'s request can be granted. T<sub>3</sub> finishes and releases R<sub>3</sub> → T<sub>2</sub> continues → T<sub>1</sub> continues. The chain unwinds.</p>
<div data-viz="1"></div>
<p><b>"Deadlock — yes or no?"</b> R<sub>1</sub> and R<sub>2</sub> have 2 instances each. R<sub>1</sub> is held by T<sub>2</sub> and T<sub>3</sub>, R<sub>2</sub> by T<sub>1</sub> and T<sub>4</sub>; T<sub>1</sub> waits for R<sub>1</sub>, and T<sub>3</sub> waits for R<sub>2</sub>:</p>
<div data-viz="2"></div>
<div class="callout key"><b>No deadlock.</b> There is a cycle T1 → R1 → T3 → R2 → T1, but T<sub>2</sub> and T<sub>4</sub> are outside it and wait for nothing. T<sub>4</sub> will release its instance of R<sub>2</sub> → T<sub>3</sub> gets it (or T<sub>2</sub> releases R<sub>1</sub> → T<sub>1</sub> gets it), and the cycle breaks.</div>
<p>The three examples lead to the slide's <b>basic facts</b>:</p>
<ul>
  <li>If the graph contains <b>no cycles</b> → <b>no deadlock</b>.</li>
  <li>If the graph contains a <b>cycle</b>:
    <ul><li>if there is only <b>one instance per resource type</b> → <b>deadlock</b>;</li>
    <li>if there are <b>several instances per resource type</b> → a <b>possibility</b> of deadlock.</li></ul></li>
</ul>
<div class="callout warn">In a RAG with multi-instance resource types, a cycle is a <b>necessary but not sufficient</b> condition for deadlock. Always ask: can some instance in the cycle be freed by a thread that is <i>not</i> stuck, or is an instance already free?</div>`,
      viz: [
        { name: 'graph', caption: 'RAG with a deadlock (R2 has 2 instances, both held; T3 waits for R2).', props: {
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
        { name: 'graph', caption: 'RAG without a deadlock: R2 has 3 instances, and one of them is free.', props: {
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
        { name: 'graph', caption: 'Deadlock yes or no? — there is a cycle, but no deadlock.', props: {
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
      takeaway: 'No cycle → no deadlock. Cycle + single instances → deadlock. Cycle + multiple instances → only a possible deadlock: check whether a free instance or a thread outside the cycle can break it.',
      exam: 'Given a RAG picture, answer "deadlock: yes or no" with a reason; the rule "cycle + single instance = deadlock".'
    },
    {
      id: 'methods',
      h: 'Methods for handling deadlocks',
      why: 'the possible strategies',
      lead: 'We can now recognize a deadlock. What should the operating system do about it? There are only a few possible attitudes, from “never let it happen” to “pretend it never happens”.',
      html: `
<p>The table groups the methods by their attitude towards deadlock:</p>
<table class="t">
  <tr><th>Strategy</th><th>Methods</th></tr>
  <tr><td>Ensure that the system will <b>never enter</b> a deadlock state</td><td><b>Deadlock prevention</b>; <b>deadlock avoidance</b></td></tr>
  <tr><td><b>Allow</b> the system to enter a deadlock state and then <b>recover</b></td><td><b>Deadlock detection</b> (+ recovery)</td></tr>
  <tr><td><b>Ignore</b> the problem and pretend that deadlocks never occur in the system</td><td>—</td></tr>
</table>
<p>The two "never" methods work very differently. <b>Prevention</b> designs the system so that one of the four conditions can never hold — a fixed rule, with no checking at run time. <b>Avoidance</b> allows all four conditions in principle, but examines every request at run time and delays those that could lead to a deadlock later. <b>Detection</b> does no checking in advance: it looks for deadlocks from time to time and then repairs them. Ignoring the problem is a real option too: if deadlocks are rare, the other methods may cost more than an occasional frozen program (Silberschatz notes that most general-purpose operating systems, such as Linux and Windows, leave deadlock handling to the application developers).</p>
<div data-viz="0"></div>
<p>The rest of the module follows this order, from the earliest moment of action to the latest: prevention → avoidance → detection → recovery.</p>`,
      viz: [{ name: 'flow', caption: 'From "never allow it" to "ignore it".', props: { dir: 'h', steps: [
        { label: 'Prevention', sub: 'break one of the 4 conditions', tone: 'ok' },
        { label: 'Avoidance', sub: 'never enter an unsafe state', tone: 'acc' },
        { label: 'Detection + Recovery', sub: 'find it and break it', tone: 'warn' },
        { label: 'Ignore', sub: 'pretend it never happens', tone: 'muted' }] } }],
      takeaway: 'Prevention and avoidance make sure a deadlock never happens; detection lets it happen, finds it and recovers; or the system simply ignores the problem.',
      exam: 'Name the methods and say which ones allow deadlocks to occur (detection) and which do not (prevention, avoidance).'
    },
    {
      id: 'prevention',
      h: 'Deadlock prevention',
      why: 'make one condition impossible',
      lead: 'All four conditions are necessary. So if we design the system so that just one of them can never hold, deadlock becomes impossible. Prevention goes through the conditions one by one and asks: can we invalidate this one, and what does it cost?',
      html: `
<p><b>Idea:</b> invalidate one of the four necessary conditions for deadlock. The table goes through all four. For each row, read the middle column (the rule) and then the last column (the price) — no rule is free.</p>
<table class="t">
  <tr><th>Condition</th><th>How to invalidate it</th><th>Price / limitation</th></tr>
  <tr><td><b>Mutual exclusion</b></td><td>not required for <b>sharable</b> resources (e.g. read-only files: many threads can read them at once)</td><td>must hold for <b>non-sharable</b> resources (a printer, a mutex lock), so in general it cannot be removed</td></tr>
  <tr><td><b>Hold and wait</b></td><td>guarantee that whenever a thread requests a resource, it does <b>not hold any other resources</b>: either the thread requests and is allocated <b>all</b> its resources before it begins execution, or it may request resources only when it has <b>none allocated</b></td><td><b>low resource utilization</b> (resources are held long before they are used); <b>starvation</b> is possible (a thread that needs many popular resources may wait forever)</td></tr>
  <tr><td><b>No preemption</b></td><td>if a thread that is holding some resources requests another resource that cannot be immediately allocated to it, <b>all resources it currently holds are released</b> (preempted); they are added to the list of resources for which the thread is waiting; the thread is restarted only when it can regain its old resources as well as the new ones it is requesting</td><td>not usable for every resource: it fits resources whose state can be saved and restored later (e.g. CPU registers, memory), not locks or printers</td></tr>
  <tr><td><b>Circular wait</b></td><td>impose a <b>total ordering</b> of all resource types, and require that each thread requests resources in an <b>increasing order</b> of enumeration</td><td>every programmer must respect the order</td></tr>
</table>
<p>Why does each rule work? With the hold-and-wait rule a thread never waits while holding something. With the no-preemption rule the system itself takes resources away, so nobody holds a resource while blocked. And with ordered requests a cycle cannot form: every thread waits only for a resource with a higher number than any resource it holds, so if we follow the waits, the numbers only grow and can never come back to the start.</p>
<p>Of the four, the first is usually impossible and the second and third are expensive. That leaves circular wait as the practical choice — the next section looks at it in real code.</p>`,
      takeaway: 'Prevention breaks one condition: sharable resources (mutual exclusion — rarely possible), all-or-nothing requests (hold and wait — low utilization, starvation), forced release (no preemption — only for some resources), resource ordering (circular wait — the usual choice).',
      exam: 'For each condition: how to invalidate it and what it costs.'
    },
    {
      id: 'circular-wait',
      h: 'Preventing circular wait: lock ordering',
      why: 'the most common prevention',
      lead: 'Invalidating the circular-wait condition is the most common way to prevent deadlock, because it costs only discipline: number the locks and always take them in increasing order.',
      html: `
<p>Simply assign each resource (for example, each mutex lock) a <b>unique number</b>. Resources must be acquired <b>in order</b>: a thread may request a resource only if its number is higher than the numbers of all the resources it already holds.</p>
<p>Example: <code>first_mutex = 1</code> and <code>second_mutex = 5</code>. Then the code for <code>thread_two</code> (on the right) <b>could not be written</b> like this, because it takes lock 5 before lock 1:</p>
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
    pthread_mutex_lock(&amp;first_mutex);    /* 1 &lt; 5 — order violated! */
    /* Do some work */
    pthread_mutex_unlock(&amp;first_mutex);
    pthread_mutex_unlock(&amp;second_mutex);
    pthread_exit(0);
}</pre>
</div>
<div class="callout warn">With this code, thread_one can hold first_mutex and wait for second_mutex while thread_two holds second_mutex and waits for first_mutex → <b>deadlock</b>. It is exactly the T1/T2 semaphore example, written with pthread mutexes. The fix: thread_two must also lock <code>first_mutex</code> (1) first, and then <code>second_mutex</code> (5).</div>
<p>Once both threads follow the order, whichever thread gets first_mutex first will also be able to get second_mutex; the other thread waits at the first lock while holding nothing, so no cycle can form. Prevention thus decides everything when the program is written. The next strategy decides at run time instead.</p>`,
      takeaway: 'Give every lock a number and always acquire locks in increasing order; then a cycle of waits cannot form. Two threads that take the same locks in opposite orders is the classic deadlock bug.',
      exam: 'Find the lock-ordering violation in code and fix it.'
    },
    {
      id: 'avoidance',
      h: 'Deadlock avoidance',
      why: 'decide request by request',
      lead: 'Prevention restricts how every program is written, even when no deadlock would ever happen. Avoidance is more flexible: threads request resources freely, but the system checks each request at run time and delays the dangerous ones. For that, it needs to know a little about the future.',
      html: `
<p>Avoidance requires that the system has some <b>additional information a priori</b> (in advance) about how threads will use resources.</p>
<ul>
  <li>The simplest and most useful model requires that each thread <b>declares the maximum number of resources of each type</b> that it may need — its <b>maximum claim</b>.</li>
  <li>The deadlock-avoidance algorithm <b>dynamically examines the resource-allocation state</b> to ensure that there can never be a circular-wait condition.</li>
  <li>The <b>resource-allocation state</b> is defined by the number of <b>available</b> and <b>allocated</b> resources, and the <b>maximum demands</b> of the processes.</li>
</ul>
<p>Why are the maximum claims needed? Because a request that looks harmless now can be fatal later. Giving away the last free resource is fine if its new owner can then finish; it is dangerous if every thread may still ask for more. Only by knowing how much each thread <i>might still</i> request can the system tell the two cases apart.</p>
<p>The table compares the two strategies that both promise "never a deadlock":</p>
<table class="t">
  <tr><th></th><th>Prevention</th><th>Avoidance</th></tr>
  <tr><td>When is the decision made?</td><td>when the system / program is designed (a fixed rule)</td><td>at run time, for every request</td></tr>
  <tr><td>What extra information is needed?</td><td>none</td><td>the maximum claim of every thread</td></tr>
  <tr><td>Which condition is attacked?</td><td>one of the four, always</td><td>circular wait — the system stays away from states that could lead to it</td></tr>
  <tr><td>Cost</td><td>restricted programs, low utilization</td><td>a check on every request; threads must know their maximum in advance</td></tr>
</table>
<p>So prevention is simple but rigid, while avoidance is flexible but needs information and computation. The key concept that avoidance works with is the <b>safe state</b>.</p>`,
      takeaway: 'Avoidance needs a priori information — each thread’s maximum claim — and checks every request against the current resource-allocation state (available, allocated, maximum demands), so that a circular wait can never arise.',
      exam: 'The difference between avoidance (a decision for every request, based on maximum claims) and prevention (a structural rule against one condition).'
    },
    {
      id: 'safe-state',
      h: 'Safe state',
      why: 'the test that avoidance uses',
      lead: 'For every request, avoidance must answer one question: “If I grant this, can all threads still be sure to finish?” A state in which the answer is yes is called safe.',
      html: `
<p>When a thread requests an available resource, the system must decide whether <b>immediate allocation</b> leaves the system in a <b>safe state</b>.</p>
<div class="callout key">The system is in a <b>safe state</b> if there exists a sequence &lt;T<sub>1</sub>, T<sub>2</sub>, …, T<sub>n</sub>&gt; of <b>ALL</b> the threads in the system such that, for each T<sub>i</sub>, the resources that T<sub>i</sub> can still request can be satisfied by the <b>currently available resources + the resources held by all the T<sub>j</sub>, with j &lt; i</b>. Such a sequence is called a <b>safe sequence</b>.</div>
<p>In plain words: we can find an order in which to let the threads finish. The first thread can finish with what is free now; when it finishes it returns everything it holds, so the second thread has more to work with; and so on, until all threads are done. If such an order exists even in the worst case — every thread asks for its full maximum — then nobody can get stuck.</p>
<p><b>Example.</b> Threads t1, t2 and t3 compete for <b>12 resources</b> of the same type (drives). In the tables, "could want" = max need − in use: how many more drives the thread may still request.</p>
<div class="cols">
<div>
<table class="t">
  <tr><th></th><th>max need</th><th>in use</th><th>could want</th></tr>
  <tr><td>t1</td><td>4</td><td>3</td><td>1</td></tr>
  <tr><td>t2</td><td>8</td><td>4</td><td>4</td></tr>
  <tr><td>t3</td><td>12</td><td>4</td><td>8</td></tr>
</table>
<div class="formula">in use = 3 + 4 + 4 = 11 → available = 12 − 11 = 1</div>
<p>The current state is <b>safe</b>: there is the safe sequence <b>&lt;t1, t2, t3&gt;</b>, in which every thread may obtain its maximum number of resources:</p>
<ul>
  <li>t1 can complete with its current allocation plus the 1 unallocated drive (it could want 1 ≤ 1); it then releases its drives → available = 1 + 3 = 4;</li>
  <li>t2 can complete with its current drives plus all of t1's drives and the unallocated one (it could want 4 ≤ 4) → available = 4 + 4 = 8;</li>
  <li>t3 can complete with its current drives plus all the drives of t1 and t2 and the unallocated one (it could want 8 ≤ 8).</li>
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
<p>This table shows what would happen if <b>t3 requested one more drive</b> and got it. Now there are 0 available drives, but each thread might need at least one more (1, 4 and 7). No thread is sure to finish, so no safe sequence exists: the state is <b>unsafe</b>. Therefore, in the safe state on the left, t3's request must <b>wait</b>, because allocating the drive would lead to an unsafe state.</p>
</div>
</div>
<p>Notice what happened: the request could physically be satisfied (one drive was free), but granting it would have used up the "reserve" that guaranteed that someone could finish. Avoidance refuses such requests for now.</p>
<p><b>Keeping a safe state.</b> Consider a safe sequence &lt;T<sub>1</sub>, T<sub>2</sub>, …, T<sub>n</sub>&gt;, with j &lt; i:</p>
<ul>
  <li>if the resource needs of T<sub>i</sub> are not immediately available (granting them would lead to an unsafe state), T<sub>i</sub> can wait until all T<sub>j</sub> have finished;</li>
  <li>when the T<sub>j</sub> are finished, T<sub>i</sub> can obtain the needed resources, execute, return the allocated resources and terminate;</li>
  <li>when T<sub>i</sub> terminates, T<sub>i+1</sub> can obtain its needed resources, and so on.</li>
</ul>
<p>The tool below runs this check as Banker's algorithm (two sections ahead) with one resource type. Try t3's request for 1 drive:</p>
<div data-viz="0"></div>
<p><b>Basic facts.</b> The diagram shows how the three kinds of states relate:</p>
<div class="cols">
<ul>
  <li>if a system is in a safe state → <b>no deadlocks</b>;</li>
  <li>if a system is in an unsafe state → <b>possibility</b> of deadlock;</li>
  <li><b>avoidance</b> → ensure that a system will <b>never enter an unsafe state</b>.</li>
</ul>
<svg class="d" viewBox="0 0 320 180">
  <rect class="d-box ok" x="10" y="10" width="300" height="160"/>
  <rect class="d-box warn" x="10" y="10" width="300" height="80"/>
  <rect class="d-box bad" x="30" y="25" width="110" height="45"/>
  <text class="d-txt b" x="85" y="52" text-anchor="middle">deadlock</text>
  <text class="d-txt" x="260" y="40" text-anchor="middle">unsafe</text>
  <text class="d-txt" x="160" y="135" text-anchor="middle">safe</text>
</svg>
</div>
<p>This is the key picture: the deadlock states are a <b>subset</b> of the unsafe states. An unsafe state is not yet a deadlock — threads may release resources before they ask for their maximum — but the system can no longer <i>guarantee</i> that everyone finishes. Avoidance plays it safe and never leaves the safe region.</p>`,
      viz: [{ name: 'banker', caption: 'The slide example as Banker’s algorithm (1 resource type, 12 drives in total): t3 requests 1 drive → unsafe → it must wait.', props: {
        res: ['drives'], names: ['t1', 't2', 't3'], available: [1],
        max: [[4], [8], [12]], alloc: [[3], [4], [4]],
        request: { who: 2, vec: [1] } } }],
      takeaway: 'Safe state = there is an order (a safe sequence) in which every thread can get its remaining maximum and finish. Safe → no deadlock; unsafe → deadlock possible; avoidance never grants a request that would make the state unsafe.',
      exam: 'The definition of a safe state; compute available and a safe sequence from a table; why t3’s request is delayed.'
    },
    {
      id: 'rag-avoid',
      h: 'Avoidance with a resource-allocation graph: claim edges',
      why: 'avoidance for single-instance resources',
      lead: 'How does the system actually check whether a state is safe? It depends on the resources: with one instance of each type, a cycle test on an extended RAG is enough; with several instances we need Banker’s algorithm.',
      html: `
<p>The slide gives two deadlock-avoidance algorithms, and the table shows that the choice depends only on the number of instances:</p>
<table class="t">
  <tr><th>Resources</th><th>Avoidance algorithm</th></tr>
  <tr><td><b>Single instance</b> of each resource type</td><td>use a <b>resource-allocation graph</b> (with claim edges)</td></tr>
  <tr><td><b>Multiple instances</b> of a resource type</td><td>use the <b>Banker's algorithm</b></td></tr>
</table>
<p>With single instances a cycle means deadlock, so the RAG is enough. We only need to add the information about the future that avoidance requires.</p>
<p><b>Resource-allocation graph scheme.</b></p>
<ul>
  <li>A <b>claim edge</b> T<sub>i</sub> ⇢ R<sub>j</sub> indicates that thread T<sub>i</sub> <b>may</b> request resource R<sub>j</sub> in the future; it is represented by a <b>dashed line</b>. Claim edges are the maximum claims, drawn in the graph.</li>
  <li>A claim edge converts to a <b>request edge</b> when the thread requests the resource.</li>
  <li>A request edge is converted to an <b>assignment edge</b> when the resource is allocated to the thread.</li>
  <li>When the thread releases the resource, the assignment edge reconverts to a <b>claim edge</b>.</li>
  <li>Resources must be <b>claimed a priori</b> in the system: all claim edges of a thread are in the graph before the thread starts.</li>
</ul>
<p>The left graph is the current state: R<sub>1</sub> is assigned to T<sub>1</sub>, T<sub>2</sub> has requested R<sub>1</sub>, and both threads may later request R<sub>2</sub> (claim edges). Suppose T<sub>2</sub> now requests R<sub>2</sub>, which is free. The right graph shows the state we would get if we granted it:</p>
<div class="cols">
  <div data-viz="0"></div>
  <div data-viz="1"></div>
</div>
<p><b>Unsafe state</b> (right graph): R<sub>2</sub> cannot be assigned to T<sub>2</sub>, because then the graph contains a <b>cycle</b> T<sub>1</sub> ⇢ R<sub>2</sub> → T<sub>2</sub> → R<sub>1</sub> → T<sub>1</sub>. It is not a deadlock yet, because one edge of the cycle is only a claim. But if R<sub>2</sub> is assigned to T<sub>2</sub> and then T<sub>1</sub> asks for R<sub>2</sub>, the claim becomes a request and there is a deadlock.</p>
<div class="callout key"><b>Resource-allocation graph algorithm.</b> Suppose that thread T<sub>i</sub> requests a resource R<sub>j</sub>. The request can be granted <b>only if converting the request edge to an assignment edge does not result in the formation of a cycle</b> in the resource-allocation graph (claim edges included).</div>`,
      viz: [
        { name: 'graph', caption: 'RAG for avoidance: R1 is held by T1, T2 has requested R1, and both may request R2.', props: {
          w: 480, h: 290,
          nodes: [
            { id: 'R1', label: 'R1', x: 240, y: 45, shape: 'res', inst: 1, w: 70, h: 40 },
            { id: 'T1', label: 'T1', x: 100, y: 150, shape: 'circle' },
            { id: 'T2', label: 'T2', x: 380, y: 150, shape: 'circle' },
            { id: 'R2', label: 'R2', x: 240, y: 250, shape: 'res', inst: 1, w: 70, h: 40 }],
          edges: [
            { from: 'R1', to: 'T1', label: 'assign' }, { from: 'T2', to: 'R1', label: 'request', tone: 'warn' },
            { from: 'T1', to: 'R2', label: 'claim', dashed: true }, { from: 'T2', to: 'R2', label: 'claim', dashed: true }] } },
        { name: 'graph', caption: 'Unsafe state: R2 given to T2 → cycle T1 ⇢ R2 → T2 → R1 → T1.', props: {
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
      takeaway: 'For single-instance resources, avoidance adds dashed claim edges (possible future requests) to the RAG. A request is granted only if turning it into an assignment edge creates no cycle, counting the claim edges; such a cycle means an unsafe state.',
      exam: 'What a claim edge is and how it turns into a request edge and an assignment edge; the rule "grant only if no cycle is formed".'
    },
    {
      id: 'banker',
      h: "Banker's algorithm",
      why: 'avoidance for multiple instances',
      lead: 'With several instances per resource, a cycle no longer decides anything, so the graph test does not work. Banker’s algorithm checks safety by simulation: pretend to grant the request, then try to find a safe sequence.',
      html: `
<p>The <b>Banker's algorithm</b> is a deadlock-avoidance algorithm used to determine whether allocating resources to a process is safe. It <b>simulates</b> the allocation for each request and checks whether the system would remain in a <b>safe state</b> — that is, whether there exists at least one sequence of execution in which all processes can complete without causing a deadlock.</p>
<div class="callout analogy">Key idea: the system acts like a <b>banker</b>. A bank has a limited amount of cash, and each customer has a credit limit. The banker lends money only if, even after the loan, he can still satisfy every customer up to their limit in <i>some</i> order, so that all loans are eventually paid back. In the same way, the system grants a resource request only if it can guarantee that all processes can eventually finish.</div>
<p>The conditions from the slide: there are <b>multiple instances</b> of resources; each thread must <b>a priori</b> claim its maximum use; when a thread requests a resource it <b>may have to wait</b>; when a thread gets all its resources it must <b>return them in a finite amount of time</b>.</p>
<div class="callout note">The slides stop here ("No more details for our purposes!"). The data structures, algorithms and worked example below are the standard ones from Silberschatz; they are what you need to solve exercises.</div>
<p><b>Data structures</b> (n threads, m resource types). Each one is simply a name for a quantity we already used in the 12-drives example, as the last column shows:</p>
<table class="t">
  <tr><th>Structure</th><th>Meaning</th><th>In the drives example</th></tr>
  <tr><td><b>Available[m]</b></td><td>Available[j] = k → k instances of R<sub>j</sub> are free</td><td>available</td></tr>
  <tr><td><b>Max[n][m]</b></td><td>Max[i][j] = k → T<sub>i</sub> may request at most k instances of R<sub>j</sub></td><td>max need</td></tr>
  <tr><td><b>Allocation[n][m]</b></td><td>how many instances of R<sub>j</sub> are allocated to T<sub>i</sub> now</td><td>in use</td></tr>
  <tr><td><b>Need[n][m]</b></td><td>how many more instances T<sub>i</sub> may still need: <b>Need = Max − Allocation</b></td><td>could want</td></tr>
</table>
<p>The algorithm has two parts. The <b>safety algorithm</b> answers "is this state safe?" by trying to build a safe sequence. The <b>resource-request algorithm</b> uses it to decide about one request:</p>
<div class="cols">
<pre class="code" data-lang="text">/* Safety algorithm */
1. Work = Available;
   Finish[i] = false for all i
2. find i: Finish[i] == false
            and Need[i] &lt;= Work
   if there is none → step 4
3. Work = Work + Allocation[i];
   Finish[i] = true;  → step 2
4. if Finish[i] == true for all i
   → the state is SAFE</pre>
<pre class="code" data-lang="text">/* Resource-request algorithm for Ti */
1. if Request[i] &lt;= Need[i] → step 2,
   else error (max claim exceeded)
2. if Request[i] &lt;= Available → step 3,
   else Ti waits (not available)
3. pretend to allocate:
   Available     -= Request[i]
   Allocation[i] += Request[i]
   Need[i]       -= Request[i]
   safe   → allocate for real
   unsafe → Ti waits, the old state
            is restored</pre>
</div>
<p>In words: <code>Work</code> is the pool of resources we could use. Repeatedly pick any unfinished thread whose remaining <code>Need</code> fits into <code>Work</code>; pretend it runs to the end and returns its <code>Allocation</code> to the pool. If every thread can be finished this way, the state is safe. (It does not matter which fitting thread we pick first: finishing a thread only adds resources to <code>Work</code>, so it never hurts.)</p>
<p><b>Worked example</b> (the classic one from Silberschatz): 5 threads T0–T4 and three resource types, A (10 instances), B (5) and C (7). First compute Need = Max − Allocation:</p>
<table class="t">
  <tr><th></th><th>Allocation<br>A B C</th><th>Max<br>A B C</th><th>Need<br>A B C</th></tr>
  <tr><td>T0</td><td>0 1 0</td><td>7 5 3</td><td>7 4 3</td></tr>
  <tr><td>T1</td><td>2 0 0</td><td>3 2 2</td><td>1 2 2</td></tr>
  <tr><td>T2</td><td>3 0 2</td><td>9 0 2</td><td>6 0 0</td></tr>
  <tr><td>T3</td><td>2 1 1</td><td>2 2 2</td><td>0 1 1</td></tr>
  <tr><td>T4</td><td>0 0 2</td><td>4 3 3</td><td>4 3 1</td></tr>
</table>
<div class="formula">Available = (3 3 2). A safe sequence is, for example, &lt;T1, T3, T4, T0, T2&gt;:<br>
Work 3 3 2 → +T1 (2 0 0) = 5 3 2 → +T3 (2 1 1) = 7 4 3 → +T4 (0 0 2) = 7 4 5 → +T0 (0 1 0) = 7 5 5 → +T2 (3 0 2) = 10 5 7</div>
<p>Check each step: T1 needs (1 2 2) ≤ (3 3 2) ✓; T3 needs (0 1 1) ≤ (5 3 2) ✓; T4 needs (4 3 1) ≤ (7 4 3) ✓; T0 needs (7 4 3) ≤ (7 4 5) ✓; T2 needs (6 0 0) ≤ (7 5 5) ✓. At the end Work = (10 5 7) — all the resources, as it must be. The state is safe. Now three requests in a row, each checked with the resource-request algorithm:</p>
<ul>
  <li><b>T1 requests (1 0 2)</b>: ≤ Need<sub>1</sub> (1 2 2) ✓ and ≤ Available (3 3 2) ✓. Pretend: Available = (2 3 0), Allocation<sub>1</sub> = (3 0 2), Need<sub>1</sub> = (0 2 0). The sequence &lt;T1, T3, T4, T0, T2&gt; is still safe → <b>grant</b>.</li>
  <li>Then <b>T4 requests (3 3 0)</b>: only 2 instances of A are free (3 &gt; 2) → T4 must <b>wait</b> (resources not available).</li>
  <li>Then <b>T0 requests (0 2 0)</b>: the resources are available, but after pretending, Available = (2 1 0) and no thread's Need fits into it → <b>unsafe → the request is refused</b> (T0 waits).</li>
</ul>
<p>The last two cases show the two different reasons to wait: "there are not enough resources now" and "there are enough now, but granting would be dangerous later". Only the second reason is specific to avoidance.</p>
<div data-viz="0"></div>`,
      viz: [{ name: 'banker', caption: 'Step through the safety algorithm and the check of T1’s request (1, 0, 2).', props: {
        res: ['A', 'B', 'C'], names: ['T0', 'T1', 'T2', 'T3', 'T4'], available: [3, 3, 2],
        max: [[7, 5, 3], [3, 2, 2], [9, 0, 2], [2, 2, 2], [4, 3, 3]],
        alloc: [[0, 1, 0], [2, 0, 0], [3, 0, 2], [2, 1, 1], [0, 0, 2]],
        request: { who: 1, vec: [1, 0, 2] } } }],
      takeaway: 'Banker’s algorithm: Need = Max − Allocation. Safety algorithm: repeatedly finish any thread with Need ≤ Work and add its Allocation to Work; the state is safe if all threads finish. A request is granted only if Request ≤ Need, Request ≤ Available, and the resulting state is safe.',
      exam: 'Compute Need, find a safe sequence, decide whether a request can be granted (three checks: ≤ Need, ≤ Available, the new state is safe).'
    },
    {
      id: 'detection',
      h: 'Deadlock detection',
      why: 'find a deadlock after it happens',
      lead: 'Prevention and avoidance cost something for every program or every request. If deadlocks are rare, it can be cheaper to let them happen, notice them and repair them. That needs two parts: a detection algorithm and a recovery scheme.',
      html: `
<p>The approach: <b>allow</b> the system to enter a deadlock state, then use a <b>detection algorithm</b> to find the deadlock and a <b>recovery scheme</b> to get out of it. As with avoidance, the detection algorithm depends on the number of instances.</p>
<p><b>Single instance of each resource type.</b> Here a cycle means deadlock, so we only need to find cycles — and we can simplify the graph first:</p>
<ul>
  <li>Maintain a <b>wait-for graph</b>: its nodes are <b>threads</b> only, and there is an edge <b>T<sub>i</sub> → T<sub>j</sub></b> if T<sub>i</sub> is waiting for T<sub>j</sub> (that is, for a resource that T<sub>j</sub> holds).</li>
  <li>It is obtained from the RAG by removing the resource nodes and collapsing each pair of edges T<sub>i</sub> → R → T<sub>j</sub> into one edge T<sub>i</sub> → T<sub>j</sub>.</li>
  <li><b>Periodically</b> invoke an algorithm that searches for a cycle in the graph: <b>if there is a cycle, there exists a deadlock</b>.</li>
  <li>An algorithm to detect a cycle in a graph requires an order of <b>n²</b> operations, where n is the number of vertices in the graph.</li>
</ul>
<p>Compare the two graphs below: (a) is a RAG, (b) is the corresponding wait-for graph. For example, T1 → R1 → T2 in (a) becomes T1 → T2 in (b). T2 waits for three resources (R3, R4 and R5), held by T5, T3 and T4, so in (b) T2 has three outgoing edges.</p>
<div data-viz="0"></div>
<div data-viz="1"></div>
<div class="callout key">Cycles in the wait-for graph: <b>T1 → T2 → T4 → T1</b> and <b>T1 → T2 → T3 → T4 → T1</b> → deadlock of T1, T2, T3 and T4. T5 waits for nothing, so it is not part of the deadlock.</div>
<p><b>Multiple instances of a resource type.</b> Here a cycle is not enough, so we use an algorithm very similar to the Banker's safety algorithm (Silberschatz). The difference: instead of the maximum future <code>Need</code>, it uses the current <b>Request</b> — what each thread is actually waiting for <i>now</i>. It optimistically assumes that a thread whose current request can be met will finish and release everything it holds.</p>
<pre class="code" data-lang="text">Available[m], Allocation[n][m], Request[n][m]   /* Request = current requests */
1. Work = Available;
   Finish[i] = (Allocation[i] == 0) ? true : false
2. find i: Finish[i] == false and Request[i] &lt;= Work;  none → step 4
3. Work = Work + Allocation[i];  Finish[i] = true;  → step 2
4. if Finish[i] == false for some i → the system is deadlocked,
   and Ti is deadlocked                          /* O(m × n²) */</pre>
<div class="formula">Example: A = 7, B = 2, C = 6; Available = (0 0 0)<br>
Allocation: T0 (0 1 0), T1 (2 0 0), T2 (3 0 3), T3 (2 1 1), T4 (0 0 2)<br>
Request: T0 (0 0 0), T1 (2 0 2), T2 (0 0 0), T3 (1 0 0), T4 (0 0 2) → all Finish = true (e.g. T0, T2, T3, T1, T4) → <b>no deadlock</b><br>
If T2 requests one more instance of C, (0 0 1): only T0 can finish → <b>deadlock: T1, T2, T3, T4</b></div>
<p>Let us check the second case. T0 requests nothing, so it finishes and returns (0 1 0): Work = (0 1 0). Now every other thread asks for at least one A or one C — T1 (2 0 2), T2 (0 0 1), T3 (1 0 0), T4 (0 0 2) — and Work has none of them. Nobody else can finish, so T1–T4 are deadlocked.</p>`,
      viz: [
        { name: 'graph', caption: '(a) Resource-allocation graph', props: {
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
      takeaway: 'Detection lets deadlocks happen and looks for them periodically. Single instances: build the wait-for graph (threads only) and search for a cycle, O(n²). Multiple instances: a Banker-like algorithm that uses the current Request instead of Need; the threads that cannot finish are deadlocked.',
      exam: 'Build a wait-for graph from a RAG and find a cycle; the O(n²) complexity; how the detection algorithm differs from Banker’s (Request instead of Need).'
    },
    {
      id: 'detect-examples',
      h: 'Is there a deadlock? — slide examples',
      why: 'practise with wait-for graphs',
      lead: 'The recipe is always the same: turn the RAG into a wait-for graph (who waits for whom), then look for a cycle. Here are two examples from the slides — one “yes” and one “no”.',
      html: `
<p><b>Example 1.</b> P1 waits for R1 (held by P2), P2 waits for R4 (held by P3), P3 waits for R3 (held by P4), and P4 waits for R2 (held by P1). All resources have one instance.</p>
<div data-viz="0"></div>
<p>Collapse each "waits for a resource held by" into one edge: P1 → P2, P2 → P3, P3 → P4, P4 → P1.</p>
<div data-viz="1"></div>
<div class="callout warn"><b>Yes</b>: the wait-for graph contains the cycle P1 → P2 → P3 → P4 → P1, and all resources are single-instance → all four processes are deadlocked.</div>
<p><b>Example 2.</b> P1 waits for R1 (held by P2) and for R2 (held by P4); P2 and P4 both wait for R3 (held by P3); P3 waits for nothing.</p>
<div data-viz="2"></div>
<p>The wait-for graph has the edges P1 → P2, P1 → P4, P2 → P3 and P4 → P3. There are many arrows, but they all flow towards P3, and none comes back.</p>
<div data-viz="3"></div>
<div class="callout key"><b>No</b>: there are no cycles. P3 finishes and releases R3 → P2 and P4 get it in turn and finish → then P1 gets R1 and R2 and finishes.</div>
<p>The lesson of Example 2: a process that waits for <i>several</i> others, or several processes that wait for the <i>same</i> one, do not make a deadlock. Only a closed loop does.</p>`,
      viz: [
        { name: 'graph', caption: 'RAG (example 1)', props: {
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
        { name: 'graph', caption: 'Wait-for graph (example 1): a cycle → deadlock', props: {
          w: 400, h: 260,
          nodes: [
            { id: 'P1', label: 'P1', x: 70, y: 130, shape: 'circle', tone: 'bad' },
            { id: 'P2', label: 'P2', x: 200, y: 45, shape: 'circle', tone: 'bad' },
            { id: 'P3', label: 'P3', x: 330, y: 130, shape: 'circle', tone: 'bad' },
            { id: 'P4', label: 'P4', x: 200, y: 215, shape: 'circle', tone: 'bad' }],
          edges: [
            { from: 'P1', to: 'P2', tone: 'bad' }, { from: 'P2', to: 'P3', tone: 'bad' },
            { from: 'P3', to: 'P4', tone: 'bad' }, { from: 'P4', to: 'P1', tone: 'bad' }] } },
        { name: 'graph', caption: 'RAG (example 2)', props: {
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
        { name: 'graph', caption: 'Wait-for graph (example 2): no cycles', props: {
          w: 400, h: 240,
          nodes: [
            { id: 'P1', label: 'P1', x: 60, y: 120, shape: 'circle' },
            { id: 'P2', label: 'P2', x: 200, y: 45, shape: 'circle' },
            { id: 'P4', label: 'P4', x: 200, y: 195, shape: 'circle' },
            { id: 'P3', label: 'P3', x: 340, y: 120, shape: 'circle', tone: 'ok' }],
          edges: [
            { from: 'P1', to: 'P2' }, { from: 'P1', to: 'P4' }, { from: 'P2', to: 'P3' }, { from: 'P4', to: 'P3' }] } }
      ],
      takeaway: 'To answer “is there a deadlock?”, draw the wait-for graph and look for a closed loop. Single-instance resources + a cycle → deadlock; no cycle → no deadlock, however many arrows there are.',
      exam: 'Draw the wait-for graph from a RAG and say whether there is a deadlock.'
    },
    {
      id: 'detection-usage',
      h: 'When to run the detection algorithm',
      why: 'how often to check',
      lead: 'Detection is not free: a cycle search costs about n² operations. So how often should the OS run it?',
      html: `
<p>When, and how often, to invoke the detection algorithm depends on two questions:</p>
<ul>
  <li><b>How often is a deadlock likely to occur?</b></li>
  <li><b>How many processes will need to be rolled back?</b> — at least <b>one for each disjoint cycle</b>. Disjoint cycles share no process, so they are separate deadlocks, and each one needs its own victim.</li>
</ul>
<p>The trade-off is between the cost of checking and the cost of finding a deadlock late. While a deadlock goes unnoticed, the resources held by the deadlocked processes sit idle, and more and more processes may get stuck waiting for them, so the deadlock grows. If deadlocks happen often, the algorithm should therefore run often. If they are rare, running it all the time wastes CPU for nothing, so it can run rarely (Silberschatz gives examples such as once per hour, or whenever CPU utilization drops noticeably).</p>
<div class="callout note">The more frequent the deadlocks, the more frequently detection must run; otherwise resources stay idle and the cycle can grow, involving new threads.</div>
<p>Once a deadlock is found, someone has to break it. That is recovery.</p>`,
      takeaway: 'Run detection more often when deadlocks are frequent. The number of processes to roll back is at least one per disjoint cycle. Late detection leaves resources idle and lets the deadlock grow.',
      exam: 'The two factors that decide when and how often to run detection.'
    },
    {
      id: 'recovery',
      h: 'Recovery from deadlock',
      why: 'break the deadlock',
      lead: 'A deadlock lasts forever unless the system breaks it by force. Recovery attacks the circular wait in one of two ways: kill processes in the cycle, or take resources away from them.',
      html: `
<p>There are two ways to recover. <b>Process termination</b> kills processes involved in the deadlock. <b>Resource preemption</b> takes resources away from the processes involved in the deadlock and gives them to other processes, so that the system has a chance to recover. Both break the circular wait; they differ in what is lost.</p>
<div class="cols">
<div>
<p><b>Process termination</b>:</p>
<ul>
  <li><b>Abort all</b> deadlocked threads — simple and certain, but expensive: all their work is lost.</li>
  <li><b>Abort one process at a time</b> until the deadlock cycle is eliminated: after killing each process, check for deadlock again, and repeat until the system recovers. Killing processes one by one breaks the circular wait with less lost work, but needs many detection runs.</li>
</ul>
<p>In which order should we choose the process to abort? The slide lists the factors; each one tries to make the damage as small as possible:</p>
<ol>
  <li>the priority of the thread;</li>
  <li>how long the thread has computed, and how much longer it needs to complete;</li>
  <li>the resources the thread has used;</li>
  <li>the resources the thread needs to complete;</li>
  <li>how many threads will need to be terminated;</li>
  <li>whether the thread is interactive or batch.</li>
</ol>
</div>
<div>
<p><b>Resource preemption</b>: preempt some resources from processes and give them to other processes until the deadlock is broken. This method raises three issues:</p>
<ul>
  <li><b>Selecting a victim</b> — decide which resources and which processes are to be preempted, in order to <b>minimize the cost</b>.</li>
  <li><b>Rollback</b> — decide what to do with the process that lost its resources: it cannot simply continue as if nothing happened. The simplest idea is <b>total rollback</b>: abort the process and restart it.</li>
  <li><b>Starvation</b> — the same process may always be picked as the victim, so it never completes its task. This must be avoided; one solution is that a process may be picked as a victim only a <b>finite number of times</b>.</li>
</ul>
</div>
</div>
<p>Notice that starvation appears again here, as it did with priority scheduling (cured by aging) and with the dining philosophers. Whenever a system repeatedly makes the same choice against one process, starvation is the risk, and the cure is to remember how often that process has already lost.</p>`,
      takeaway: 'Recovery = terminate processes (all at once, or one at a time with a new check after each, choosing the victim by priority, work done, resources, number of threads, interactivity) or preempt resources (select a victim, roll it back, and avoid starving it by limiting how often it is chosen).',
      exam: 'The two recovery methods; the criteria for choosing a victim; the three issues of resource preemption (victim, rollback, starvation).'
    },
    {
      id: 'summary',
      h: 'Summary: the strategies compared',
      why: 'see the whole chain at once',
      lead: 'Every strategy in this module deals with the same four conditions, but at a different moment: before programs run, before each request, or after the deadlock has happened.',
      html: `
<p>Read the table as a timeline: prevention acts at design time, avoidance at every request, detection and recovery after the fact.</p>
<table class="t">
  <tr><th>Strategy</th><th>When it acts</th><th>How</th><th>Needs</th><th>Price</th></tr>
  <tr><td><b>Prevention</b></td><td>design time</td><td>one of the 4 conditions can never hold (usually lock ordering against circular wait)</td><td>nothing at run time</td><td>restricted programs, low utilization, possible starvation</td></tr>
  <tr><td><b>Avoidance</b></td><td>every request</td><td>grant only if the state stays safe (RAG with claim edges; Banker's algorithm)</td><td>maximum claims a priori</td><td>a safety check on every request</td></tr>
  <tr><td><b>Detection</b></td><td>periodically</td><td>cycle in the wait-for graph (single instance) or a Banker-like algorithm with Request (multiple instances)</td><td>nothing in advance</td><td>about n² work per check; deadlocks do happen</td></tr>
  <tr><td><b>Recovery</b></td><td>after detection</td><td>terminate processes or preempt resources (victim, rollback)</td><td>a policy for choosing victims</td><td>lost work; risk of starvation</td></tr>
  <tr><td><b>Ignore</b></td><td>never</td><td>pretend that deadlocks never occur</td><td>—</td><td>an occasional frozen program that must be restarted by hand</td></tr>
</table>
<p>The common thread of the module: a deadlock needs all four conditions; the resource-allocation graph makes circular wait visible as a cycle; and every strategy is either a way to keep that cycle from forming or a way to break it after it has formed.</p>`,
      takeaway: 'Prevention breaks a condition by design, avoidance stays in safe states using maximum claims, detection finds cycles after the fact, and recovery breaks them by killing processes or preempting resources. The right choice depends on how often deadlocks happen and how much checking costs.'
    }
  ],
  terms: [
    { en: 'Deadlock', ru: 'взаимоблокировка (тупик)', def: 'Two or more processes cannot proceed because each is waiting for another to release resources.' },
    { en: 'System model', ru: 'модель системы', def: 'Resources grouped into types R1…Rm, each with Wi instances; processes request, use and release them.' },
    { en: 'Resource type', ru: 'тип ресурса', def: 'A class of resources (CPU cycles, memory space, I/O devices, locks), written Ri.' },
    { en: 'Instance', ru: 'экземпляр (ресурса)', def: 'One identical copy of a resource type; any free instance can satisfy a request.' },
    { en: 'Request, use, release', ru: 'запрос, использование, освобождение', def: 'The three steps in which a process utilizes a resource.' },
    { en: 'Mutual exclusion', ru: 'взаимное исключение', def: 'Only one thread at a time can use a resource.' },
    { en: 'Hold and wait', ru: 'удержание и ожидание', def: 'A thread holding at least one resource is waiting for additional resources held by other threads.' },
    { en: 'No preemption', ru: 'отсутствие вытеснения', def: 'A resource can be released only voluntarily by the thread holding it.' },
    { en: 'Circular wait', ru: 'циклическое ожидание', def: 'A set {T0, …, Tn} of waiting threads where each waits for a resource held by the next, and Tn waits for T0.' },
    { en: 'Necessary condition', ru: 'необходимое условие', def: 'A condition that must hold for something to happen; if it does not hold, the event is impossible.' },
    { en: 'Sufficient condition', ru: 'достаточное условие', def: 'A condition that, when it holds, guarantees the event.' },
    { en: 'Resource-allocation graph', ru: 'граф распределения ресурсов', def: 'RAG: thread vertices (circles) and resource vertices (boxes with dots); request edges T → R, assignment edges R → T.' },
    { en: 'Thread vertex', ru: 'вершина-поток', def: 'A node of the RAG that represents a thread (drawn as a circle).' },
    { en: 'Resource vertex', ru: 'вершина-ресурс', def: 'A node of the RAG that represents a resource type (a box; dots = instances).' },
    { en: 'Request edge', ru: 'ребро запроса', def: 'Ti → Rj: the thread has requested the resource and is waiting for it.' },
    { en: 'Assignment edge', ru: 'ребро назначения', def: 'Rj → Ti: an instance of the resource has been allocated to the thread.' },
    { en: 'Claim edge', ru: 'ребро заявки', def: 'Dashed Ti ⇢ Rj: the thread may request the resource in the future (used for avoidance).' },
    { en: 'Single-instance resource', ru: 'ресурс с одним экземпляром', def: 'A resource type with exactly one instance (one dot in the RAG box).' },
    { en: 'Multi-instance resource', ru: 'ресурс с несколькими экземплярами', def: 'A resource type with several instances (several dots in the RAG box).' },
    { en: 'Cycle', ru: 'цикл', def: 'A closed path in a graph; in a RAG it represents a circular wait.' },
    { en: 'Deadlock prevention', ru: 'предотвращение взаимоблокировок', def: 'Design the system so that one of the four necessary conditions can never hold.' },
    { en: 'Deadlock avoidance', ru: 'избегание взаимоблокировок', def: 'Using a priori maximum claims, grant a request only if the system stays in a safe state.' },
    { en: 'Deadlock detection', ru: 'обнаружение взаимоблокировок', def: 'Allow deadlocks, look for them periodically (cycle search or a detection algorithm), then recover.' },
    { en: 'Deadlock recovery', ru: 'восстановление после взаимоблокировки', def: 'Breaking a detected deadlock by process termination or resource preemption.' },
    { en: 'Sharable resource', ru: 'разделяемый ресурс', def: 'A resource that many threads can use at once, e.g. a read-only file.' },
    { en: 'Non-sharable resource', ru: 'неразделяемый ресурс', def: 'A resource that only one thread can use at a time, e.g. a printer or a mutex lock.' },
    { en: 'Resource utilization', ru: 'использование (загрузка) ресурсов', def: 'How much of the time resources are actually being used.' },
    { en: 'Total ordering', ru: 'полное упорядочивание', def: 'Giving every resource type a unique number so that all of them can be compared.' },
    { en: 'Lock ordering', ru: 'упорядочивание захвата блокировок', def: 'Always acquiring locks in increasing order of their numbers; prevents circular wait.' },
    { en: 'A priori information', ru: 'априорная информация', def: 'Information known in advance, e.g. the maximum number of resources a thread may request.' },
    { en: 'Maximum claim', ru: 'максимальная заявка', def: 'The maximum number of resources of each type that a thread declares it may need.' },
    { en: 'Resource-allocation state', ru: 'состояние распределения ресурсов', def: 'The numbers of available and allocated resources and the maximum demands of the processes.' },
    { en: 'Safe state', ru: 'безопасное состояние', def: 'A state in which a safe sequence of all threads exists; no deadlock is possible.' },
    { en: 'Unsafe state', ru: 'небезопасное состояние', def: 'A state with no safe sequence; a deadlock is possible but not certain.' },
    { en: 'Safe sequence', ru: 'безопасная последовательность', def: 'An order of all threads in which each one can get its remaining needs from Available + resources of the threads before it.' },
    { en: "Banker's algorithm", ru: 'алгоритм банкира', def: 'Deadlock avoidance for multiple instances: grant a request only if the simulated new state is safe.' },
    { en: 'Safety algorithm', ru: 'алгоритм проверки безопасности', def: 'Part of Banker’s algorithm: repeatedly finish a thread with Need ≤ Work and add its Allocation to Work.' },
    { en: 'Resource-request algorithm', ru: 'алгоритм обработки запроса', def: 'Part of Banker’s algorithm: check Request ≤ Need, Request ≤ Available, then pretend to allocate and test safety.' },
    { en: 'Need matrix', ru: 'матрица Need (остаточная потребность)', def: 'Need = Max − Allocation: how many more instances each thread may still request.' },
    { en: 'Allocation matrix', ru: 'матрица Allocation (выделено)', def: 'How many instances of each resource type are currently allocated to each thread.' },
    { en: 'Max matrix', ru: 'матрица Max (максимум)', def: 'The maximum number of instances of each type that each thread may request.' },
    { en: 'Available vector', ru: 'вектор Available (свободно)', def: 'How many instances of each resource type are currently free.' },
    { en: 'Wait-for graph', ru: 'граф ожидания', def: 'Nodes are threads; Ti → Tj if Ti waits for a resource held by Tj; with single instances, a cycle ⇔ deadlock.' },
    { en: 'Detection algorithm', ru: 'алгоритм обнаружения', def: 'Finds deadlocked threads: a cycle search in the wait-for graph or a Banker-like algorithm with the current requests.' },
    { en: 'Disjoint cycle', ru: 'непересекающийся цикл', def: 'A cycle that shares no process with another cycle; each one needs its own rollback.' },
    { en: 'Process termination', ru: 'завершение процессов', def: 'Recovery: abort all deadlocked threads, or one at a time until the cycle disappears.' },
    { en: 'Resource preemption', ru: 'вытеснение (отбор) ресурсов', def: 'Recovery: take resources from some processes and give them to others; issues — victim, rollback, starvation.' },
    { en: 'Victim', ru: 'жертва', def: 'The process chosen to be terminated or to lose its resources during recovery.' },
    { en: 'Rollback', ru: 'откат', def: 'Returning a victim process to an earlier state after its resources were taken.' },
    { en: 'Total rollback', ru: 'полный откат', def: 'The simplest rollback: abort the process and restart it.' },
    { en: 'Starvation', ru: 'голодание', def: 'A process waits indefinitely, e.g. because it is always chosen as the victim.' }
  ],
  questions: [
    { id: 'dl-01', type: 'single', q: 'A deadlock is a situation in which…', options: ['a process waits indefinitely for the CPU because of its low priority', 'two or more processes cannot proceed because each is waiting for another to release resources', 'the result depends on the order in which threads execute', 'a process spins in a busy-waiting loop'], answer: 1, explain: 'This is the slide definition. The first option describes starvation, the third a race condition, the fourth busy waiting.', section: 'model', diff: 1 },
    { id: 'dl-02', type: 'code', q: 'S1 = S2 = 1. Which order of operations leads to a deadlock?', lang: 'c', code: '/* T1 */            /* T2 */\nwait(s1);           wait(s2);\nwait(s2);           wait(s1);\n...                 ...\nsignal(s2);         signal(s1);\nsignal(s1);         signal(s2);', options: ['T1: wait(s1), T1: wait(s2), T2: wait(s2)', 'T1: wait(s1), T2: wait(s2), T2: wait(s1), T1: wait(s2)', 'T2: wait(s2), T2: wait(s1), T1: wait(s1)', 'T1: wait(s1), T1: wait(s2), T1: signal(s2), T1: signal(s1), T2: wait(s2)'], answer: 1, explain: 'T1 holds s1 and T2 holds s2, then each waits for the other’s semaphore — a deadlock. In the other orders one thread gets both semaphores first, and the other one simply waits until they are released.', section: 'sem-deadlock', diff: 2 },
    { id: 'dl-03', type: 'tf', q: 'In the T1/T2 example with semaphores s1 and s2, a deadlock occurs with every possible order of execution.', answer: false, explain: 'If T1 executes wait(s1) and wait(s2) before T2 starts, there is no deadlock — it depends on the OS scheduler.', section: 'sem-deadlock', diff: 1 },
    { id: 'dl-04', type: 'multi', q: 'Which conditions are necessary for a deadlock? (select all that apply)', options: ['Mutual exclusion', 'Hold and wait', 'Bounded waiting', 'No preemption', 'Circular wait', 'Starvation'], answer: [0, 1, 3, 4], explain: 'The four necessary conditions are mutual exclusion, hold and wait, no preemption and circular wait. Bounded waiting is a requirement for critical-section solutions; starvation is a different problem.', section: 'conditions', diff: 1 },
    { id: 'dl-05', type: 'single', q: '“A thread holding at least one resource is waiting to acquire additional resources held by other threads.” Which condition is this?', options: ['Circular wait', 'No preemption', 'Mutual exclusion', 'Hold and wait'], answer: 3, explain: 'This is hold and wait. Circular wait is the closed chain formed by such waits.', section: 'conditions', diff: 1 },
    { id: 'dl-06', type: 'single', q: 'How is an assignment edge drawn in a resource-allocation graph?', options: ['Ti → Rj', 'Rj → Ti', 'Ti → Tj', 'dashed Ti ⇢ Rj'], answer: 1, explain: 'An assignment edge goes from the resource to the thread (Rj → Ti). Ti → Rj is a request edge, the dashed edge is a claim edge, and Ti → Tj belongs to a wait-for graph.', section: 'rag', diff: 1 },
    { id: 'dl-07', type: 'single', q: 'R1 (1 instance), R2 (2 instances), R3 (1 instance). T1 holds R2 and waits for R1; T2 holds R1 and R2 and waits for R3; T3 holds R3. Is there a deadlock?', options: ['Yes: T1 and T2 wait for each other', 'Yes: all three threads are deadlocked', 'No: T3 waits for nothing; it releases R3 → T2 finishes → releases R1 for T1', 'Impossible to say without Banker’s algorithm'], answer: 2, explain: 'The graph has no cycle (T3 waits for nobody), so there is no deadlock. This is the slide’s RAG example.', section: 'rag', diff: 2 },
    { id: 'dl-08', type: 'single', q: 'To the previous example we add the edge T3 → R2; both instances of R2 are held by T1 and T2. What now?', options: ['Deadlock: T1, T2 and T3 form the cycles T1→R1→T2→R3→T3→R2→T1 and T2→R3→T3→R2→T2', 'No deadlock: R2 has 2 instances', 'Only T3 is deadlocked', 'No deadlock: a cycle in a multi-instance graph means nothing'], answer: 0, explain: 'No instance of R2 is free, and every holder of R2 is itself waiting inside the cycle → deadlock (slide “RAG with a Deadlock”).', section: 'rag-examples', diff: 2 },
    { id: 'dl-09', type: 'single', q: 'R1 and R2 have 2 instances each. R1 is allocated to T2 and T3, R2 to T1 and T4; T1 waits for R1, and T3 waits for R2. Is there a deadlock?', options: ['Yes: the cycle T1 → R1 → T3 → R2 → T1', 'Yes: all four threads are blocked', 'No: there is no cycle', 'No: there is a cycle, but T2 and T4 wait for nothing and will release their instances'], answer: 3, explain: 'Slide “Deadlock yes or no?”: the cycle exists, but the resources have several instances; T4 releases R2 → T3 gets it (or T2 releases R1 for T1) → no deadlock.', section: 'rag-examples', diff: 3 },
    { id: 'dl-10', type: 'multi', q: 'Which statements about the RAG are true? (select all that apply)', options: ['No cycles → no deadlock', 'A cycle with one instance of each resource → deadlock', 'A cycle in a graph with multi-instance resources → always a deadlock', 'With multi-instance resources a cycle is a necessary but not a sufficient condition'], answer: [0, 1, 3], explain: 'Basic facts: with several instances per resource type, a cycle only means that a deadlock is possible.', section: 'rag-examples', diff: 2 },
    { id: 'dl-11', type: 'single', q: 'Which method allows the system to enter a deadlock and then recovers from it?', options: ['Deadlock prevention', 'Deadlock avoidance', 'Deadlock detection (+ recovery)', 'Ignoring the problem'], answer: 2, explain: 'Prevention and avoidance ensure that a deadlock never happens; detection allows it, finds it and then recovers.', section: 'methods', diff: 1 },
    { id: 'dl-12', type: 'single', q: 'The rule “a thread must request and be allocated all its resources before it begins execution” invalidates which condition?', options: ['Mutual exclusion', 'Hold and wait', 'No preemption', 'Circular wait'], answer: 1, explain: 'A thread never holds some resources while waiting for others, so hold and wait is impossible. The price is low resource utilization and possible starvation.', section: 'prevention', diff: 1 },
    { id: 'dl-13', type: 'single', q: 'What are the drawbacks of preventing deadlock by invalidating hold and wait?', options: ['Low resource utilization and possible starvation', 'It is impossible for read-only files', 'It requires knowing the Need of every process', 'It causes circular wait'], answer: 0, explain: 'Resources are allocated long before they are used and sit idle; a thread that needs many popular resources may wait forever.', section: 'prevention', diff: 2 },
    { id: 'dl-14', type: 'single', q: '“If a thread holding resources requests a resource that cannot be allocated immediately, all its resources are released.” Which condition does this invalidate?', options: ['Hold and wait', 'Mutual exclusion', 'No preemption', 'Circular wait'], answer: 2, explain: 'The thread’s resources are effectively taken away (preempted), so the no-preemption condition no longer holds.', section: 'prevention', diff: 2 },
    { id: 'dl-15', type: 'code', q: 'first_mutex = 1, second_mutex = 5. What is wrong with thread_two?', lang: 'c', code: 'void *do_work_one(void *param) {\n    pthread_mutex_lock(&first_mutex);\n    pthread_mutex_lock(&second_mutex);\n    /* Do some work */\n    pthread_mutex_unlock(&second_mutex);\n    pthread_mutex_unlock(&first_mutex);\n    pthread_exit(0);\n}\n\nvoid *do_work_two(void *param) {\n    pthread_mutex_lock(&second_mutex);\n    pthread_mutex_lock(&first_mutex);\n    /* Do some work */\n    pthread_mutex_unlock(&first_mutex);\n    pthread_mutex_unlock(&second_mutex);\n    pthread_exit(0);\n}', options: ['Nothing: the order of unlocking matters more than the order of locking', 'The locking order is violated (5 before 1): a deadlock is possible — each thread holds one mutex and waits for the other', 'Error: a mutex cannot be locked twice in one program', 'Only starvation of thread_one is possible'], answer: 1, explain: 'Locks must be acquired in increasing order: first_mutex (1), then second_mutex (5). Otherwise a circular wait is possible.', section: 'circular-wait', diff: 2 },
    { id: 'dl-16', type: 'single', q: 'What does deadlock avoidance require in its simplest model?', options: ['Acquiring resources in increasing order of their numbers', 'That each thread declares in advance the maximum number of resources of each type it may need', 'Releasing all resources on every new request', 'Searching the wait-for graph for cycles periodically'], answer: 1, explain: 'Avoidance relies on a priori information (maximum claims). The first option is prevention of circular wait; the last one is detection.', section: 'avoidance', diff: 1 },
    { id: 'dl-17', type: 'single', q: '12 resources. t1: max 4, in use 3; t2: max 8, in use 4; t3: max 12, in use 4. Which is a safe sequence?', options: ['<t3, t2, t1>', '<t2, t1, t3>', '<t1, t2, t3>', 'There is none — the state is unsafe'], answer: 2, explain: 'Available = 12 − 11 = 1. t1 needs 1 → afterwards 4 are free; t2 needs 4 → afterwards 8; t3 needs 8 → OK. t2 cannot go first (it needs 4 > 1).', section: 'safe-state', diff: 2 },
    { id: 'dl-18', type: 'single', q: 'In the same state, t3 requests 1 more resource. What does the system do?', options: ['Grants it: a resource is free', 't3 waits: the allocation would lead to an unsafe state (0 free, every thread may need more)', 'Terminates t3', 'Takes a resource away from t1'], answer: 1, explain: 'After the allocation available = 0, while the threads could still want 1, 4 and 7 — none is sure to finish → unsafe. Avoidance never enters an unsafe state.', section: 'safe-state', diff: 2 },
    { id: 'dl-19', type: 'single', q: 'In the original state (available = 1), t1 (not t3) requests 1 resource. Can it be granted?', options: ['Yes: t1 reaches its maximum (4), finishes and returns 4 resources → <t1, t2, t3> is still safe', 'No: available becomes 0 → unsafe', 'No: t1 already holds the most', 'Only if t3 releases a resource'], answer: 0, explain: 'Available becomes 0, but t1 now needs 0 more → it finishes and available = 4 → t2 (needs 4) → 8 → t3 (needs 8). The state is safe: 0 free resources do not automatically mean unsafe.', section: 'safe-state', diff: 3 },
    { id: 'dl-20', type: 'tf', q: 'An unsafe state always means a deadlock.', answer: false, explain: 'Unsafe means that a deadlock is possible; deadlock states are a subset of the unsafe states. Only a safe state guarantees that there is no deadlock.', section: 'safe-state', diff: 1 },
    { id: 'dl-21', type: 'single', q: 'A claim edge Ti ⇢ Rj means that…', options: ['Ti is waiting for Rj now', 'Rj is allocated to Ti', 'Ti may request Rj in the future', 'Ti is waiting for the thread that holds Rj'], answer: 2, explain: 'A claim edge (dashed) is an a priori claim. It becomes a request edge when Ti asks, an assignment edge when Rj is allocated, and a claim edge again after the release.', section: 'rag-avoid', diff: 1 },
    { id: 'dl-22', type: 'single', q: 'R1 is assigned to T1, T2 has requested R1, and both threads have claim edges to R2. T2 requests R2, which is free. What does the RAG algorithm answer?', options: ['Grant it: R2 is free', 'Grant it: there is no cycle of request/assignment edges', 'Refuse: the assignment R2 → T2 together with the claim edge T1 ⇢ R2 forms the cycle T1 ⇢ R2 → T2 → R1 → T1 (unsafe)', 'Refuse: T2 already has a request edge'], answer: 2, explain: 'Slide “Unsafe State”: R2 cannot be given to T2 — if T1 then requests R2, there is a deadlock. Claim edges count when checking for a cycle.', section: 'rag-avoid', diff: 2 },
    { id: 'dl-23', type: 'single', q: 'In Banker’s algorithm, Need is computed as…', options: ['Max + Allocation', 'Available − Allocation', 'Max − Allocation', 'Max − Available'], answer: 2, explain: 'Need[i][j] = Max[i][j] − Allocation[i][j]: how many more instances the thread may still request.', section: 'banker', diff: 1 },
    { id: 'dl-24', type: 'single', q: 'Available = (3 3 2). Allocation: T0 (0 1 0), T1 (2 0 0), T2 (3 0 2), T3 (2 1 1), T4 (0 0 2). Max: T0 (7 5 3), T1 (3 2 2), T2 (9 0 2), T3 (2 2 2), T4 (4 3 3). Which sequence is safe?', options: ['<T0, T1, T2, T3, T4>', '<T1, T3, T4, T0, T2>', '<T4, T3, T1, T0, T2>', '<T2, T1, T3, T4, T0>'], answer: 1, explain: 'Need: T0 (7 4 3), T1 (1 2 2), T2 (6 0 0), T3 (0 1 1), T4 (4 3 1). Work: 332 → T1 → 532 → T3 → 743 → T4 → 745 → T0 → 755 → T2 → 10 5 7. T0, T4 and T2 cannot go first: their Need does not fit into (3 3 2).', section: 'banker', diff: 3 },
    { id: 'dl-25', type: 'single', q: 'In the same state, T1 requests (1 0 2). What is the result?', options: ['Granted: Request ≤ Need, Request ≤ Available, and the new state is safe', 'Error: the request exceeds Need', 'T1 waits: not enough resources', 'Refused: the new state is unsafe'], answer: 0, explain: '(1 0 2) ≤ Need1 (1 2 2) and ≤ Available (3 3 2). After pretending, Available = (2 3 0) and Need1 = (0 2 0), and <T1, T3, T4, T0, T2> is still safe.', section: 'banker', diff: 3 },
    { id: 'dl-26', type: 'single', q: 'After T1’s request has been granted (Available = (2 3 0)), T0 requests (0 2 0). What happens?', options: ['The request is granted', 'Error: the maximum claim is exceeded', 'T0 waits: the resources are available, but after the allocation (Available = (2 1 0)) the state is unsafe', 'T0 waits: not enough resources'], answer: 2, explain: 'Request ≤ Need0 (7 4 3) and ≤ Available. But with Available = (2 1 0) no thread’s Need fits into Work → there is no safe sequence → refused.', section: 'banker', diff: 3 },
    { id: 'dl-27', type: 'code', q: 'Which line is missing in the safety algorithm at ???', lang: 'text', code: 'Work = Available;\nFinish[i] = false for all i;\nrepeat:\n    find i such that Finish[i] == false && Need[i] <= Work\n    if found:\n        ???\n        Finish[i] = true;\nuntil no such i\nif Finish[i] == true for all i: state is SAFE', options: ['Work = Work - Need[i];', 'Work = Work + Allocation[i];', 'Work = Work + Max[i];', 'Available = Available - Request[i];'], answer: 1, explain: 'Thread Ti finishes and returns everything allocated to it — Allocation[i]. Need and Max describe the future; they are not resources that the thread holds.', section: 'banker', diff: 2 },
    { id: 'dl-28', type: 'single', q: 'How do you get the wait-for graph from a RAG (single instances)?', options: ['Remove the resource nodes and replace each pair Ti → Rj → Tk with an edge Ti → Tk', 'Remove the thread nodes', 'Reverse all edges', 'Add claim edges'], answer: 0, explain: 'Ti → Tk if Ti waits for a resource held by Tk. With single instances, a cycle in the wait-for graph ⇔ deadlock.', section: 'detection', diff: 1 },
    { id: 'dl-29', type: 'single', q: 'Detection with multiple instances: Available = (0 0 0); Allocation T0 (0 1 0), T1 (2 0 0), T2 (3 0 3), T3 (2 1 1), T4 (0 0 2); Request T0 (0 0 0), T1 (2 0 2), T2 (0 0 1), T3 (1 0 0), T4 (0 0 2). Which threads are deadlocked?', options: ['None', 'Only T2', 'T1, T2, T3, T4', 'All five'], answer: 2, explain: 'T0 (Request 0) finishes → Work = (0 1 0). None of the requests of T1–T4 fits into (0 1 0) → T1, T2, T3 and T4 are deadlocked.', section: 'detection', diff: 3 },
    { id: 'dl-30', type: 'single', q: 'RAG: P1 → R1 → P2 → R4 → P3 → R3 → P4 → R2 → P1 (all resources single-instance). Is there a deadlock?', options: ['No: more information about Max is needed', 'Yes: the wait-for graph P1 → P2 → P3 → P4 → P1 contains a cycle', 'No: each process holds only one resource', 'Yes, but only P1 and P2'], answer: 1, explain: 'Slide “Is there a deadlock? — Yes”: single instances + a cycle → all four processes are deadlocked.', section: 'detect-examples', diff: 2 },
    { id: 'dl-31', type: 'single', q: 'RAG: P1 waits for R1 (held by P2) and R2 (held by P4); P2 and P4 wait for R3 (held by P3); P3 waits for nothing. Is there a deadlock?', options: ['Yes: P1 waits for two processes', 'Yes: P2 and P4 compete for R3', 'No: the wait-for graph P1→P2, P1→P4, P2→P3, P4→P3 has no cycles', 'Impossible to say'], answer: 2, explain: 'There are no cycles: P3 finishes and releases R3 → P2 and P4 finish → then P1.', section: 'detect-examples', diff: 2 },
    { id: 'dl-32', type: 'single', q: 'What decides when and how often to run the detection algorithm?', options: ['The number of resources in Available', 'How often a deadlock is likely to occur and how many processes will need to be rolled back', 'Only the priority of the processes', 'The size of the wait-for graph — run it every n² ticks'], answer: 1, explain: 'Slide “Detection-Algorithm Usage”: how often deadlocks occur and how many rollbacks are needed (one for each disjoint cycle).', section: 'detection-usage', diff: 2 },
    { id: 'dl-33', type: 'multi', q: 'Which criteria are used to choose the thread to abort during recovery? (select all that apply)', options: ['The priority of the thread', 'How long it has computed and how much longer it needs', 'How many threads will need to be terminated', 'Whether it is interactive or batch', 'The alphabetical order of the program name'], answer: [0, 1, 2, 3], explain: 'The criteria from the slide: priority, time computed and time left, resources used and still needed, number of threads to terminate, interactive or batch.', section: 'recovery', diff: 2 },
    { id: 'dl-34', type: 'single', q: 'During resource preemption the same process is chosen as the victim every time. What is this problem called, and what is the solution?', options: ['Rollback; do a total rollback', 'Starvation; allow a process to be a victim only a finite number of times', 'Deadlock; kill all processes', 'Selecting a victim; choose by pid'], answer: 1, explain: 'This is starvation; the slide’s solution is that a process may be picked as a victim only a finite number of times.', section: 'recovery', diff: 2 },
    { id: 'dl-35', type: 'single', q: 'A resource type “printer” has W = 2 instances. What does that mean?', options: ['There are two identical printers, and a request can be satisfied by either of them', 'Two processes may use the same printer at the same time', 'A printer can be requested at most twice', 'There are two different resource types'], answer: 0, explain: 'Instances are identical copies of one resource type: any free instance can satisfy a request. Each instance is still used by only one process at a time.', section: 'model', diff: 1 },
    { id: 'dl-36', type: 'single', q: 'Why does requesting resources in increasing order of their numbers prevent deadlock?', options: ['A thread only waits for resources with higher numbers than those it holds, so a cycle of waits can never close', 'It makes every resource sharable', 'It forces threads to release all their resources before a new request', 'It lets the OS take resources away from threads'], answer: 0, explain: 'If we follow the waits, the resource numbers only increase, so the chain can never return to its start — circular wait is impossible. The other options describe attacks on the other three conditions.', section: 'circular-wait', diff: 2 },
    { id: 'dl-37', type: 'single', q: 'Which strategy needs every thread to declare its maximum resource needs in advance?', options: ['Prevention by lock ordering', 'Avoidance (e.g. Banker’s algorithm)', 'Detection with a wait-for graph', 'Recovery by process termination'], answer: 1, explain: 'Avoidance decides about each request using the maximum claims, so they must be known a priori. Prevention, detection and recovery do not need them.', section: 'summary', diff: 1 },
    { id: 'dl-38', type: 'tf', q: 'Deadlock avoidance allows the system to enter a deadlock and then recovers from it.', answer: false, explain: 'Avoidance, like prevention, makes sure that the system never enters a deadlock: it delays any request that would lead to an unsafe state. Detection + recovery is the method that lets deadlocks happen.', section: 'methods', diff: 1 },
    { id: 'dl-39', type: 'single', q: 'Two disjoint cycles are found in the wait-for graph. At least how many processes must be rolled back (or terminated)?', options: ['0', '1', '2', 'All processes in the system'], answer: 2, explain: 'Disjoint cycles share no process, so breaking one does not break the other: at least one process per disjoint cycle, i.e. 2.', section: 'detection-usage', diff: 2 }
  ]
});
