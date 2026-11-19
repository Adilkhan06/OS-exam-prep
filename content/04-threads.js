OS.addModule({
  id: 'threads',
  num: 4,
  group: 'theory',
  title: 'Threads',
  titleRu: 'Потоки',
  icon: '🧵',
  sources: ['4-Threads.pdf', '4bis - Recap.pdf'],
  summary: 'Threads vs processes, multicore programming, concurrency vs parallelism, Amdahl\'s law, user and kernel threads and the M:1, 1:1, M:M and two-level models, Pthreads (create, arguments, join, attributes), threading issues, Linux clone(), Java threads.',
  bridge: 'The Processes module ended with a cost: processes are isolated, so creating them is heavy and making them cooperate needs IPC (system calls, copies, explicit shared memory). Threads answer the obvious next question: can several flows of execution live inside one process and share its memory directly?',
  intro: `
<p>A <b>thread</b> is a flow of execution: a program counter, a set of registers and a stack. A traditional process has exactly one. A <b>multithreaded</b> process has several, and all of them share the process's code, data and open files. Keep this mental model: <b>the process is the container of resources</b> (address space, files), <b>the thread is the unit of execution</b> that actually runs on a CPU core.</p>
<p>The module follows one line of thought. First we see <i>why</i> threads exist and what exactly a thread owns. Then we compare threads with processes and see what threads give on <i>multicore</i> hardware — and where the speedup stops (Amdahl's law). Next we ask <i>who</i> manages threads: the program's library or the kernel, and how the two are mapped. Then we program threads with <b>Pthreads</b>: create them, pass them arguments, wait for them. Finally we meet the tricky cases (fork/exec, signals, cancellation, thread-local storage, scheduler activations) and two real implementations (Linux and Java).</p>`,
  sections: [
    {
      id: 'motivation',
      h: 'Motivation — why threads',
      why: 'processes are too heavy',
      lead: 'A word processor must redraw the screen, check spelling and save to disk — all at the same time. With processes only, each task would need its own process with its own memory and IPC between them. That is heavy. Threads are a lighter answer.',
      html: `
<p>Most modern applications are <b>multithreaded</b>: <b>threads run within the application</b>. Multiple tasks of the application can be implemented by separate threads, for example:</p>
<ul>
  <li><b>update the display</b>;</li>
  <li><b>fetch data</b>;</li>
  <li><b>spell checking</b>;</li>
  <li><b>answer a network request</b>.</li>
</ul>
<p>Why not use separate processes for these tasks? Because <b>process creation is heavy-weight</b>: a whole new address space must be built (remember that fork() duplicates the parent's memory). <b>Thread creation is light-weight</b>: the new thread simply uses the address space it is already in. Threads <b>can simplify code and increase efficiency</b>, and the idea is so useful that <b>kernels are generally multithreaded</b> too.</p>
<p><b>Single-threaded and multithreaded processes.</b> The table shows what changes when a process has several threads. The first row is shared by all threads; only the second row is duplicated for each thread:</p>
<table class="t">
  <tr><th></th><th>Single-threaded process</th><th>Multithreaded process</th></tr>
  <tr><td>Shared by all threads</td><td colspan="2"><b>code</b>, <b>data</b>, <b>files</b></td></tr>
  <tr><td>Owned by each thread</td><td>one set: registers, PC, stack</td><td><b>each</b> thread has its own <b>registers</b>, <b>stack</b> and <b>PC</b></td></tr>
</table>
<div data-viz="0"></div>
<p><b>Multithreaded server architecture.</b> A server shows the benefit most clearly. If a server handled requests one at a time in a single thread, every client would wait for all the clients before it. Instead:</p>
<ol class="steps">
  <li>a client sends a <b>request</b> to the server;</li>
  <li>the server <b>creates a new thread</b> to service the request;</li>
  <li>the server <b>resumes listening</b> for additional client requests.</li>
</ol>
<div data-viz="1"></div>
<p>Because creating a thread is cheap, the server can afford one thread per request and stay ready for new clients at all times.</p>`,
      viz: [
        { name: 'layers', caption: 'A multithreaded process: the shared part on top; each thread has its own registers, stack and PC.', props: { layers: [
          { label: 'code · data · files', sub: 'shared by all threads', tone: 'ok' },
          { label: 'Thread 1', sub: 'registers · stack · PC', tone: 'c1' },
          { label: 'Thread 2', sub: 'registers · stack · PC', tone: 'c2' },
          { label: 'Thread 3', sub: 'registers · stack · PC', tone: 'c3' }] } },
        { name: 'graph', caption: 'Multithreaded server: (1) request → (2) new thread → (3) resume listening.', props: { w: 640, h: 200,
          nodes: [
            { id: 'c', label: 'client', x: 55, y: 70, tone: 'acc' },
            { id: 's', label: 'server', x: 255, y: 70, tone: 'warn' },
            { id: 't', label: 'thread', x: 575, y: 70, tone: 'ok' },
            { id: 'l', label: 'resume listening', sub: '(3) new requests', x: 255, y: 160, w: 150, shape: 'pill', tone: 'muted' }],
          edges: [
            { from: 'c', to: 's', label: '(1) request' }, { from: 's', to: 't', label: '(2) create new thread' },
            { from: 's', to: 'l', bend: 30 }, { from: 'l', to: 's', bend: 30 }] } }
      ],
      takeaway: 'Threads let one application do several tasks at once inside one process. Process creation is heavy-weight, thread creation is light-weight, because threads share code, data and files and only own registers, a stack and a PC.',
      exam: 'Why threads: cheap creation, the tasks of an application in separate threads; the multithreaded server scheme.'
    },
    {
      id: 'definition',
      h: 'What is a thread? — shared and private parts',
      why: 'what a thread owns',
      lead: 'Now let us define a thread precisely and draw the line between what threads share and what each thread keeps for itself. This one line explains both the advantages and the dangers of threads.',
      html: `
<p>A <b>thread</b> is the <b>smallest unit of execution</b> within a process. The process provides the resources (memory, files); its threads are what actually runs on the CPU.</p>
<div class="cols">
  <div class="callout key"><b>Shared</b> — threads of the same process share:<ul><li><b>Code</b></li><li><b>Data</b> (heap, global variables)</li><li><b>File descriptors</b></li></ul></div>
  <div class="callout note"><b>Private</b> — each thread has its own:<ul><li><b>Program counter</b></li><li><b>Stack</b></li><li><b>CPU registers</b></li></ul></div>
</div>
<p>Why exactly these private parts? A thread must be able to be at its own place in the code (its own <b>PC</b>), compute with its own values (its own <b>registers</b>), and call functions independently of the other threads (its own <b>stack</b> for local variables and return addresses). Everything else can be shared.</p>
<p><b>Efficiency</b>: for the same reason, creating and switching threads is cheaper than creating and switching processes — there is much less to build and to save.</p>
<p><b>Thread characteristics</b> (Recap). The table describes a thread from the OS's point of view:</p>
<table class="t">
  <tr><th>Characteristic</th><th>Meaning</th></tr>
  <tr><td><b>Thread ID (TID)</b></td><td>each thread within a process gets a unique identifier, so the OS can tell individual threads apart</td></tr>
  <tr><td><b>Program Counter (PC)</b></td><td>each thread has its own PC, the instruction it is executing; this lets threads execute different parts of the program concurrently</td></tr>
  <tr><td><b>Registers and Stack</b></td><td>code, data and heap are shared; each thread has its own set of registers and a <b>separate stack</b>, which keeps it independent during execution</td></tr>
  <tr><td><b>Thread States</b></td><td>threads move between states (like processes) depending on resource availability and thread synchronization</td></tr>
</table>
<p><b>Memory management of threads.</b> Threads share the same <b>address space</b> as their parent process. This one fact has two sides:</p>
<div class="cols">
  <div class="pros"><b>+</b><ul><li>easier and faster communication: memory is shared by default, no IPC is needed</li></ul></div>
  <div class="cons"><b>−</b><ul><li>synchronization mechanisms (<b>mutexes, semaphores, monitors</b>) are needed to avoid <b>race conditions</b></li></ul></div>
</div>
<p>Recall the race condition on <code>counter</code> in the Processes module: there, two processes first had to set up shared memory explicitly. Threads share all global data <i>by default</i>, so the same problem can appear in any multithreaded program.</p>`,
      takeaway: 'Thread = smallest unit of execution in a process. Shared: code, data (heap, globals), file descriptors. Private: PC, stack, registers (plus a TID). Shared memory makes communication easy but requires synchronization to avoid race conditions.',
      exam: 'What threads share (code, data/heap/globals, files) and what each owns (PC, stack, registers); TID.'
    },
    {
      id: 'benefits',
      h: 'Benefits of threads',
      why: 'what we gain',
      lead: 'The shared/private split gives multithreaded programs four advantages. Each of them follows directly from something we have just seen.',
      html: `
<p>Read the last column as "this works because…":</p>
<table class="t">
  <tr><th>Benefit</th><th>Meaning (slide)</th><th>Why it follows</th></tr>
  <tr><td><b>Responsiveness</b></td><td>may allow continued execution if part of the process is blocked — especially important for user interfaces</td><td>one thread can wait for I/O while another keeps serving the user</td></tr>
  <tr><td><b>Resource Sharing</b></td><td>threads share the resources of the process — easier than shared memory or message passing</td><td>they live in the same address space, so nothing must be set up</td></tr>
  <tr><td><b>Economy</b></td><td>cheaper than process creation; thread switching has lower overhead than context switching</td><td>no new address space is built, and memory maps do not change on a switch</td></tr>
  <tr><td><b>Scalability</b></td><td>a process can take advantage of <b>multicore</b> architectures</td><td>different threads of one process can run on different cores at the same time</td></tr>
</table>
<p>Notice what is <i>not</i> on the list: fault isolation. Threads give it up in exchange for sharing — the comparison in the next section shows the price.</p>`,
      takeaway: 'Four benefits: Responsiveness (keep working while part is blocked), Resource Sharing (same address space), Economy (cheap creation and switching), Scalability (use several cores).',
      exam: 'The four benefits and their meaning (Responsiveness, Resource Sharing, Economy, Scalability).'
    },
    {
      id: 'vs-process',
      h: 'Processes vs threads',
      why: 'choosing between the two',
      lead: 'We now have two ways to do several things at once: several processes, or several threads in one process. The comparison shows what each one is good at and what it costs.',
      html: `
<p>Read the table row by row; in each row the process wins on safety and the thread wins on cost:</p>
<table class="t">
  <tr><th>Feature</th><th>Process</th><th>Thread</th></tr>
  <tr><td><b>Resource ownership</b></td><td>owns its own memory and resources</td><td>shares memory and resources with its parent process</td></tr>
  <tr><td><b>Lifetime</b></td><td>independent lifetime</td><td>depends on the lifetime of its parent process</td></tr>
  <tr><td><b>Creation</b></td><td>more expensive</td><td>cheaper</td></tr>
  <tr><td><b>Context switching</b></td><td>expensive</td><td>cheaper</td></tr>
  <tr><td><b>Fault tolerance</b></td><td>a crash doesn't affect other processes</td><td>a crash affects the other threads of the process</td></tr>
</table>
<div data-viz="0"></div>
<p>The slides explain each row:</p>
<ul>
  <li><b>Memory.</b> Processes: each process has its own separate memory space, so one process cannot directly access the memory of another — processes need <b>IPC</b> to exchange data. Threads: threads of the same process share the same memory space and can directly read and write the same variables and data structures.</li>
  <li><b>Isolation.</b> Processes are isolated from each other, which improves security and stability — but makes communication more complex and slower. Threads are not isolated, which allows fast and efficient communication — but can lead to <b>data races</b> and <b>deadlocks</b> if the programmer does not manage them properly.</li>
  <li><b>Creation.</b> Creating a new process involves duplicating the parent's memory space, a resource-intensive task. Creating a thread is less resource-intensive, because threads share the same memory space.</li>
  <li><b>Context switching.</b> Between processes, the resources and environment of one process must be saved and the new process's information loaded. Between threads, less information must be saved and restored: there is <b>no need to change the memory maps</b>, and the CPU only switches the thread's state, such as the <b>program counter and registers</b>.</li>
  <li><b>Fault tolerance.</b> Each process has its own memory, so a problem in one process does not affect others. Threads share memory, so a problem in one thread can affect the other threads of the same process.</li>
</ul>
<p><b>CPU scheduling of processes vs threads</b> (Recap). The same difference shows up in the scheduler:</p>
<table class="t">
  <tr><th>Processes</th><th>Threads</th></tr>
  <tr><td>scheduled independently by the OS scheduler</td><td>can be scheduled independently (if they are <b>kernel-level</b> threads)</td></tr>
  <tr><td>a context switch saves/restores the <b>full</b> process state</td><td>a context switch is lighter: only the <b>CPU registers and stack</b> need to be managed</td></tr>
</table>
<p>The words "if kernel-level" hint at an important detail: not every thread is known to the kernel. The way user threads are mapped onto kernel threads is given by the models Many-to-One, One-to-One and Many-to-Many, which we meet later in this module. First, let us see what threads give on multicore hardware.</p>`,
      viz: [{ name: 'graph', caption: 'Threads communicate through the memory of their process; separate processes communicate only through IPC.', props: { w: 700, h: 160,
        nodes: [
          { id: 't1', label: 'Thread', sub: 'memory space of the process', x: 75, y: 80, w: 130, tone: 'acc' },
          { id: 't2', label: 'Thread', sub: 'same memory space', x: 300, y: 80, w: 130, tone: 'acc' },
          { id: 'p1', label: 'Process', sub: 'own memory space', x: 460, y: 80, w: 130, tone: 'warn' },
          { id: 'p2', label: 'Process', sub: 'own memory space', x: 630, y: 80, w: 130, tone: 'warn' }],
        edges: [{ from: 't1', to: 't2', label: 'shared memory', both: true }, { from: 'p1', to: 'p2', label: 'IPC', both: true }] } }],
      takeaway: 'Processes: own memory, isolated, safe and stable, but expensive to create and switch, and they need IPC. Threads: shared memory, cheap, fast communication, but a crash or data race in one thread affects the whole process.',
      exam: 'The process vs thread table (resource ownership, lifetime, creation, context switching, fault tolerance) and why switching threads is cheaper (no change of memory maps).'
    },
    {
      id: 'multicore',
      h: 'Multicore programming — concurrency vs parallelism',
      why: 'using several cores',
      lead: 'Benefit number four, scalability, needs more than one core. But several cores do not make a program faster by themselves: the work must be split among them, and that is hard. It also forces us to separate two words that are often confused: concurrency and parallelism.',
      html: `
<p>Multicore or multiprocessor systems put pressure on programmers. The slides list five challenges; each one is a question the programmer must answer:</p>
<table class="t">
  <tr><th>Challenge</th><th>The question it asks</th></tr>
  <tr><td><b>Dividing activities</b></td><td>which parts of the work can run separately, at the same time?</td></tr>
  <tr><td><b>Balance</b></td><td>do the parts do a similar amount of work? (one huge part leaves the other cores idle)</td></tr>
  <tr><td><b>Data splitting</b></td><td>how is the data divided among the cores?</td></tr>
  <tr><td><b>Data dependency</b></td><td>does one part need the results of another? then they must be synchronized</td></tr>
  <tr><td><b>Testing and debugging</b></td><td>how do we test a program with many possible execution orders?</td></tr>
</table>
<p>Now the two key definitions:</p>
<div class="cols">
  <div class="callout key"><b>Parallelism</b> means a system can perform <b>more than one task simultaneously</b> — at the same instant. This needs several cores.</div>
  <div class="callout note"><b>Concurrency</b> means <b>more than one task is making progress</b>. On a single processor/core the scheduler provides concurrency by quickly switching between tasks.</div>
</div>
<p>Compare the two timelines. On one core the tasks take turns: at any instant only one runs, but all of them move forward — that is concurrency without parallelism. On two cores two tasks really run at the same instant — that is parallelism.</p>
<div data-viz="0"></div>
<div data-viz="1"></div>
<p>So every parallel system is concurrent, but a concurrent system is not necessarily parallel.</p>
<p><b>Types of parallelism.</b> There are two ways to divide work among cores — divide the <i>data</i> or divide the <i>operations</i>:</p>
<ul>
  <li><b>Data parallelism</b> distributes subsets of <b>the same data</b> across multiple cores, and performs <b>the same operation</b> on each (e.g. each core sums one quarter of an array).</li>
  <li><b>Task parallelism</b> distributes <b>threads</b> across cores, each thread performing a <b>unique operation</b> (different threads may work on the same data).</li>
</ul>
<div data-viz="2"></div>`,
      viz: [
        { name: 'timeline', caption: 'Concurrent execution on a single-core system: the tasks take turns.', props: { max: 9, rows: [
          { label: 'single core', segs: [
            { from: 0, to: 1, label: 'T1', tone: 'c1' }, { from: 1, to: 2, label: 'T2', tone: 'c2' }, { from: 2, to: 3, label: 'T3', tone: 'c3' }, { from: 3, to: 4, label: 'T4', tone: 'c4' },
            { from: 4, to: 5, label: 'T1', tone: 'c1' }, { from: 5, to: 6, label: 'T2', tone: 'c2' }, { from: 6, to: 7, label: 'T3', tone: 'c3' }, { from: 7, to: 8, label: 'T4', tone: 'c4' },
            { from: 8, to: 9, label: 'T1', tone: 'c1' }] }] } },
        { name: 'timeline', caption: 'Parallelism on a multi-core system: two tasks run at the same instant.', props: { max: 5, rows: [
          { label: 'core 1', segs: [{ from: 0, to: 1, label: 'T1', tone: 'c1' }, { from: 1, to: 2, label: 'T3', tone: 'c3' }, { from: 2, to: 3, label: 'T1', tone: 'c1' }, { from: 3, to: 4, label: 'T3', tone: 'c3' }, { from: 4, to: 5, label: 'T1', tone: 'c1' }] },
          { label: 'core 2', segs: [{ from: 0, to: 1, label: 'T2', tone: 'c2' }, { from: 1, to: 2, label: 'T4', tone: 'c4' }, { from: 2, to: 3, label: 'T2', tone: 'c2' }, { from: 3, to: 4, label: 'T4', tone: 'c4' }, { from: 4, to: 5, label: 'T2', tone: 'c2' }] }] } },
        { name: 'graph', caption: 'Data parallelism (data split, one operation) vs task parallelism (same data, different operations).', props: { w: 620, h: 300,
          nodes: [
            { id: 'd0', label: 'data[0..¼)', x: 95, y: 35, w: 120, tone: 'muted' }, { id: 'd1', label: 'data[¼..½)', x: 237, y: 35, w: 120, tone: 'muted' },
            { id: 'd2', label: 'data[½..¾)', x: 380, y: 35, w: 120, tone: 'muted' }, { id: 'd3', label: 'data[¾..1]', x: 522, y: 35, w: 120, tone: 'muted' },
            { id: 'a0', label: 'core 0', x: 95, y: 110, tone: 'acc' }, { id: 'a1', label: 'core 1', x: 237, y: 110, tone: 'acc' },
            { id: 'a2', label: 'core 2', x: 380, y: 110, tone: 'acc' }, { id: 'a3', label: 'core 3', x: 522, y: 110, tone: 'acc' },
            { id: 'D', label: 'data', sub: 'the same data', x: 310, y: 185, w: 420, tone: 'muted' },
            { id: 'b0', label: 'core 0', sub: 'op A', x: 95, y: 265, tone: 'ok' }, { id: 'b1', label: 'core 1', sub: 'op B', x: 237, y: 265, tone: 'ok' },
            { id: 'b2', label: 'core 2', sub: 'op C', x: 380, y: 265, tone: 'ok' }, { id: 'b3', label: 'core 3', sub: 'op D', x: 522, y: 265, tone: 'ok' }],
          edges: [
            { from: 'd0', to: 'a0' }, { from: 'd1', to: 'a1' }, { from: 'd2', to: 'a2' }, { from: 'd3', to: 'a3' },
            { from: 'D', to: 'b0' }, { from: 'D', to: 'b1' }, { from: 'D', to: 'b2' }, { from: 'D', to: 'b3' }] } }
      ],
      takeaway: 'Five challenges: dividing activities, balance, data splitting, data dependency, testing and debugging. Concurrency = several tasks make progress (possible on one core by interleaving); parallelism = several tasks run at the same instant (needs several cores). Data parallelism splits the data, task parallelism splits the operations.',
      exam: 'Concurrency (progress, possible on 1 core) vs parallelism (simultaneous, needs cores); data vs task parallelism; the 5 challenges.'
    },
    {
      id: 'hierarchy',
      h: 'Multithread, multi-core, multi-processor (Recap)',
      why: 'where parallelism comes from',
      lead: 'Parallelism needs hardware. "Multithread", "multi-core" and "multi-processor" sound alike but live at different levels: the first is software, the other two are hardware. Knowing the levels tells you how many threads can really run at once.',
      html: `
<p>The comparative table from the Recap. Look at the "Parallelism type" column: only one row is software.</p>
<table class="t">
  <tr><th>Concept</th><th>Description</th><th>Parallelism type</th><th>Example architectures</th><th>Typical use cases</th></tr>
  <tr><td><b>Multithread</b></td><td>multiple threads within a single program executing concurrently</td><td>Logical / software-level</td><td>Intel Hyper-Threading, Java threads</td><td>web browsers, GUI applications, servers handling multiple requests</td></tr>
  <tr><td><b>Multi-core</b></td><td>a single CPU with multiple independent cores</td><td>Physical / hardware-level</td><td>Intel Core i7/i9, AMD Ryzen, ARM Cortex-A</td><td>video encoding, gaming, parallel computations in scientific applications</td></tr>
  <tr><td><b>Multi-processor</b></td><td>multiple physical CPUs in a system</td><td>Physical / hardware-level</td><td>dual-socket Intel Xeon, AMD EPYC servers</td><td>high-performance computing (HPC), database servers, enterprise servers</td></tr>
</table>
<p>The second table arranges the three concepts as levels, from software down to the whole system:</p>
<table class="t">
  <tr><th>Level</th><th>Concept</th><th>Relationship</th></tr>
  <tr><td>Software level</td><td>Multithreading</td><td>threads are created and managed by programs; they are the smallest units of execution and can run on any available core or CPU</td></tr>
  <tr><td>Hardware level (single CPU)</td><td>Multi-core</td><td>a single CPU with multiple cores can execute multiple threads <b>truly in parallel</b>; threads are scheduled across the cores</td></tr>
  <tr><td>Hardware level (system)</td><td>Multi-processor</td><td>multiple CPUs execute threads on the cores of different processors, increasing overall parallelism</td></tr>
</table>
<p>The server example turns the levels into numbers:</p>
<ul>
  <li><b>Multi-threading</b>: each client request is handled by a separate thread.</li>
  <li><b>Multi-core CPU</b>: the threads are distributed across the N cores of a CPU, so <b>N</b> requests are processed simultaneously.</li>
  <li><b>Multi-processor system</b>: M CPUs with N cores each process <b>M·N</b> requests simultaneously.</li>
</ul>
<div class="formula">2 CPUs × 4 cores = 2·4 = <b>8</b> requests at the same time</div>
<div data-viz="0"></div>
<div class="callout warn">Key point: multi-threading needs cores to run <b>truly in parallel</b>; otherwise the threads are just <b>interleaved</b> on a single core. Multi-core CPUs give multithreaded programs real parallelism, and multi-processor systems scale it to even larger workloads.</div>
<p>So with M·N cores, can a program run M·N times faster? The next section shows that the answer is almost always no.</p>`,
      viz: [{ name: 'flow', caption: 'Hierarchical relationship.', props: { dir: 'v', steps: [
        { label: 'Multithread', sub: 'software: Thread · Thread · Thread · Thread', tone: 'c1' },
        { label: 'Multi-core', sub: '1 CPU × N cores → N threads in parallel', tone: 'c2' },
        { label: 'Multi-processor', sub: 'M CPUs × N cores → M·N threads in parallel', tone: 'c3' }] } }],
      takeaway: 'Multithreading is software (threads of a program); multi-core (one CPU, N cores) and multi-processor (M CPUs) are hardware. True parallelism = number of cores: M CPUs × N cores run M·N threads at once; on one core threads are only interleaved.',
      exam: 'The difference between multithread / multi-core / multi-processor (software vs hardware); computing M·N.'
    },
    {
      id: 'amdahl',
      h: 'Amdahl\'s law',
      why: 'the limit of speedup',
      lead: 'If 8 cores can run 8 threads at once, is the program 8 times faster? Almost never. Amdahl\'s law shows why: the part of the program that cannot be parallelized sets a hard limit.',
      html: `
<p><b>Amdahl's law</b> identifies the performance gains from adding cores to an application that has both <b>serial</b> (must run on one core) and <b>parallel</b> components. Let</p>
<ul>
  <li><b>S</b> = the serial portion (the fraction of the work that cannot be parallelized),</li>
  <li><b>N</b> = the number of processing cores.</li>
</ul>
<div class="formula">speedup ≤ 1 / ( S + (1 − S) / N )</div>
<p>Where does the formula come from? Take the running time on one core as 1. With N cores, the serial part still takes S, whatever N is; only the parallel part (1 − S) is divided among the N cores. The new time is S + (1 − S)/N, and the speedup is the old time divided by the new time.</p>
<p>The slide example: an application that is 75% parallel and 25% serial, moving from 1 to 2 cores:</p>
<div class="formula">1 / (0.25 + 0.75 / 2) = 1 / 0.625 = <b>1.6</b> times faster (not 2)</div>
<p>Now add more and more cores. The term (1 − S)/N shrinks toward 0, but S stays:</p>
<div class="formula">N → ∞: speedup → 1 / S &nbsp; (S = 0.25 → at most <b>4</b>, however many cores you add)</div>
<div class="callout key">The <b>serial portion</b> of an application has a <b>disproportionate effect</b> on the performance gained by adding cores.</div>
<p>The table makes this concrete. Read it by rows: with S = 0.05, 16 cores still give a big gain (9.14); with S = 0.50, even 16 cores give less than 2.</p>
<table class="t">
  <tr><th>S</th><th>N = 2</th><th>N = 4</th><th>N = 16</th><th>N → ∞</th></tr>
  <tr><td>0.05</td><td>1.90</td><td>3.48</td><td>9.14</td><td>20</td></tr>
  <tr><td>0.10</td><td>1.82</td><td>3.08</td><td>6.40</td><td>10</td></tr>
  <tr><td>0.25</td><td>1.60</td><td>2.29</td><td>3.37</td><td>4</td></tr>
  <tr><td>0.50</td><td>1.33</td><td>1.60</td><td>1.88</td><td>2</td></tr>
</table>
<p>The graph on the slide shows the same thing: the ideal speedup (= N) is a straight line, while the curves for S = 0.05, 0.10 and 0.50 (for 1…16 cores) bend and flatten; the S = 0.50 curve hits its ceiling of 2 almost at once. Try it yourself:</p>
<div data-viz="0"></div>
<div class="callout note">Question from the slide: does the law take contemporary multicore systems into account? (The law assumes a fixed amount of work and ignores, for example, hardware details of the cores — so it is a simplified model.)</div>`,
      viz: [{ name: 'amdahl', caption: 'Move S and N: with S = 0.25 the speedup never exceeds 4.', props: { s: 0.25, n: 2 } }],
      takeaway: 'speedup ≤ 1 / (S + (1 − S)/N); the limit for N → ∞ is 1/S. Example: 25% serial → 1.6 on 2 cores, never more than 4. The serial part, not the number of cores, decides the maximum speedup.',
      exam: 'The formula, the 75/25 example → 1.6, the limit 1/S; compute the speedup for given S and N.'
    },
    {
      id: 'user-kernel',
      h: 'User threads and kernel threads',
      why: 'who manages threads',
      lead: 'So far we have said "threads run on cores". But who creates and schedules a thread — a library inside the program, or the kernel? There are two kinds of threads, and the difference decides whether threads can really run in parallel.',
      html: `
<div class="cols">
  <div><b>User threads</b> — thread management is done by a <b>user-level threads library</b>, inside the process.
    <ul><li>Thread library example: <b>POSIX Pthreads</b>.</li></ul></div>
  <div><b>Kernel threads</b> — supported directly by the <b>kernel</b>.
    <ul><li>Examples: virtually all general-purpose operating systems, including <b>Windows, Linux, Mac OS X, iOS, Android</b>.</li></ul></div>
</div>
<p><b>Types of thread</b> (Recap). The key row is "what the kernel sees": the kernel can only schedule what it knows about.</p>
<table class="t">
  <tr><th></th><th><b>User-level threads (ULTs)</b></th><th><b>Kernel-level threads (KLTs)</b></th></tr>
  <tr><td>Managed by</td><td>entirely by user-level libraries or by the application</td><td>directly by the OS kernel</td></tr>
  <tr><td>What the kernel sees</td><td>the kernel is <b>unaware</b> of ULTs and manages the process as if it were <b>single-threaded</b></td><td>the kernel sees and schedules every thread</td></tr>
  <tr><td>Advantage</td><td><b>flexibility</b></td><td>better support for <b>parallelism</b> and resource utilization</td></tr>
  <tr><td>Disadvantage</td><td>limitations in using system resources</td><td>the <b>overhead</b> of kernel involvement can hurt performance</td></tr>
</table>
<p>The trade-off: user threads are flexible (the library can manage them without system calls), but the kernel sees only one flow of execution, so it cannot spread them over cores. Kernel threads can run in parallel, but every operation on them involves the kernel. A real system must decide how the threads a program creates are connected to the threads the kernel schedules — the multithreading models.</p>`,
      takeaway: 'User threads are managed by a library; the kernel does not know them and sees a single-threaded process (flexible, but limited use of resources). Kernel threads are managed by the kernel, as in all modern OSes (real parallelism, but kernel overhead).',
      exam: 'ULT: the kernel does not know about them; KLT: supported by the kernel (all modern OSes); pros and cons.'
    },
    {
      id: 'models',
      h: 'Multithreading models: M:1, 1:1, M:M, two-level',
      why: 'mapping user threads to kernel threads',
      lead: 'A program creates user threads, but only kernel threads can be put on a CPU. So user threads must be mapped onto kernel threads. The mapping model decides what happens when a thread blocks and whether threads can run in parallel.',
      html: `
<p>There are three main models (plus a variant). For each, ask two questions: <i>if one thread makes a blocking system call, what happens to the others?</i> and <i>can the threads run on several cores?</i></p>
<ul>
  <li><b>Many-to-One (M:1).</b> Many user-level threads are mapped to a <b>single</b> kernel thread. The kernel sees only that one thread. So when one user thread blocks in a system call, the kernel thread blocks and <b>all</b> threads of the process stop. And since only one thread of the process can be in the kernel at a time, the threads <b>cannot run in parallel</b> on a multicore system. Few systems use this model today.</li>
  <li><b>One-to-One (1:1).</b> Each user-level thread is mapped to its <b>own</b> kernel thread; creating a user thread creates a kernel thread. This gives <b>more concurrency</b> than M:1: a blocked thread does not stop the others, and threads can run in parallel. The cost: every thread is a kernel object, so the number of threads per process is sometimes <b>restricted</b> because of the overhead.</li>
  <li><b>Many-to-Many (M:M).</b> Many user-level threads are mapped to many kernel threads. It lets the OS create a <b>sufficient</b> number of kernel threads, avoiding the drawbacks of both previous models. Otherwise it is not very common.</li>
  <li><b>Two-level.</b> Like M:M, but it also allows a user thread to be <b>bound</b> to a kernel thread.</li>
</ul>
<p>The table collects the models with the slide examples:</p>
<table class="t">
  <tr><th>Model</th><th>Mapping</th><th>Properties</th><th>Examples</th></tr>
  <tr><td><b>Many-to-One</b></td><td>many user-level threads → <b>one</b> kernel thread</td><td>one thread blocking <b>blocks all</b>; threads <b>cannot</b> run in parallel on multicore, because only one may be in the kernel at a time; few systems use it now</td><td><b>Solaris Green Threads</b>, <b>GNU Portable Threads</b></td></tr>
  <tr><td><b>One-to-One</b></td><td>each user-level thread → its own kernel thread</td><td>creating a user thread creates a kernel thread; <b>more concurrency</b> than M:1; the number of threads per process is sometimes <b>restricted</b> because of overhead</td><td><b>Windows</b>, <b>Linux</b></td></tr>
  <tr><td><b>Many-to-Many</b></td><td>many user-level → many kernel threads</td><td>the OS creates a <b>sufficient</b> number of kernel threads; otherwise not very common</td><td>Windows with the <b>ThreadFiber</b> package</td></tr>
  <tr><td><b>Two-level</b></td><td>like M:M</td><td>also allows a user thread to be <b>bound</b> to a kernel thread</td><td>—</td></tr>
</table>
<div data-viz="0"></div>
<p>The conclusion: the two most common general-purpose systems, Windows and Linux, chose <b>one-to-one</b> — on modern multicore hardware real parallelism is worth the cost of a kernel thread per user thread.</p>`,
      viz: [{ name: 'threadModels', caption: 'Switch between the models: M:1, 1:1, M:M, two-level.', props: { model: 'm1' } }],
      takeaway: 'M:1: one kernel thread — one blocking call blocks all, no parallelism (Solaris Green Threads, GNU Portable Threads). 1:1: one kernel thread per user thread — more concurrency, but the number of threads may be limited (Windows, Linux). M:M: enough kernel threads for many user threads (ThreadFiber). Two-level: M:M + bound threads.',
      exam: 'For each model: what is mapped onto what, what happens on blocking, whether there is parallelism, examples (Linux/Windows = 1:1).'
    },
    {
      id: 'libraries',
      h: 'Thread libraries and the Pthreads API',
      why: 'how a programmer creates threads',
      lead: 'To use threads, a programmer needs an API. A thread library provides it. Pthreads is the standard one on UNIX systems, and the one used in all the code examples of the course.',
      html: String.raw`
<p>A <b>thread library</b> provides the programmer with an API for creating and managing threads. There are two primary ways of implementing it:</p>
<ul>
  <li>a library entirely in <b>user space</b> (calls are plain function calls);</li>
  <li>a <b>kernel-level</b> library supported by the OS (calls become system calls).</li>
</ul>
<p><b>Pthreads — the POSIX specification</b>:</p>
<ul>
  <li>may be provided either as a user-level or as a kernel-level library;</li>
  <li>it is a <b>POSIX standard (IEEE 1003.1c-1995)</b> API for thread creation and synchronization;</li>
  <li>it is a <b>specification, not an implementation</b>: the API defines the behaviour of the library, and the implementation is up to the developers of each library;</li>
  <li>it is common in UNIX operating systems (Linux and Mac OS X).</li>
</ul>
<p>To use Pthreads, include <code>pthread.h</code>. Initially, <code>main()</code> is the only thread of the program; every other thread must be created explicitly by the programmer with:</p>
<pre class="code" data-lang="c">int pthread_create(pthread_t *thread,
                   const pthread_attr_t *attr,
                   void *(*start_routine)(void *),
                   void *arg);</pre>
<p>The four arguments answer four questions: where to store the new thread's id, with which attributes to create it, which function to run, and with which input:</p>
<table class="t">
  <tr><th>Argument</th><th>Meaning</th></tr>
  <tr><td><code>thread</code></td><td>the unique identifier of the new thread, returned by the function</td></tr>
  <tr><td><code>attr</code></td><td>an attribute object for the thread; <code>NULL</code> = default values</td></tr>
  <tr><td><code>start_routine</code></td><td>the C function the thread will execute once it is created</td></tr>
  <tr><td><code>arg</code></td><td>a <b>single</b> argument for start_routine; it is passed <b>by reference</b>, as a pointer cast to <code>void *</code>; <code>NULL</code> if there is no argument</td></tr>
</table>
<ul>
  <li><code>pthread_create</code> creates a new thread and makes it executable (ready to run).</li>
  <li>On success it returns <b>0</b>; on error it returns an <b>error number</b>, and the contents of <code>*thread</code> are undefined.</li>
  <li>Once created, threads can create other threads themselves.</li>
</ul>
<p>Two details will matter in the next sections: the return value is an error code (not the thread id), and the argument is a <i>pointer</i> — whatever it points to must still hold the right value when the thread reads it.</p>`,
      takeaway: 'Pthreads (POSIX IEEE 1003.1c) is a specification, not an implementation, and can be user- or kernel-level. pthread_create(thread, attr, start_routine, arg) creates a thread running start_routine(arg); it returns 0 on success or an error number.',
      exam: 'Pthreads is a specification, not an implementation; the arguments of pthread_create and its return value (0 on success).'
    },
    {
      id: 'pthreads',
      h: 'A first Pthreads program — PrintHello',
      why: 'create threads in practice',
      lead: 'The first example creates five threads that each print a greeting. It shows three things at once: how to create threads, how to give each one a small value, and why main must not simply return at the end.',
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
<p>Walk through it line by line:</p>
<ul>
  <li><b>Passing the number.</b> The thread number is passed <b>by value</b>, packed into the pointer itself: <code>(void *)(size_t)t</code>; the thread unpacks it with <code>(int)threadid</code>. No memory is shared, so each thread gets its own value.</li>
  <li><b>Order of output.</b> The "Creating thread i" lines appear in order, because one thread (main) prints them in a loop. The "i: Hello World!" lines appear in a <b>nondeterministic</b> order: each comes from a different thread, and the scheduler decides which thread runs when.</li>
  <li><b>Error check.</b> <code>rc != 0</code> means that the thread could not be created.</li>
  <li><b>The end of main.</b> main ends with <code>pthread_exit(NULL)</code>, not <code>return</code>. pthread_exit terminates only the main thread; the process lives on until the other threads finish. A <code>return</code> from main would end the whole process, killing all threads — possibly before they print anything.</li>
</ul>`,
      takeaway: 'pthread_create runs PrintHello in 5 new threads; the order of the "Hello World!" lines is nondeterministic. Passing (void *)(size_t)t sends the value itself. main ends with pthread_exit(NULL) so that the process waits for the other threads instead of killing them.',
      exam: 'What PrintHello prints (order not defined); why pthread_exit(NULL) is used at the end of main.'
    },
    {
      id: 'args',
      h: 'Thread argument passing — "Does it work?" / "It works!"',
      why: 'the classic argument bug',
      lead: 'pthread_create() passes exactly one argument, as a void pointer. That is flexible but dangerous: if you pass a pointer to a variable that keeps changing, every thread may read the wrong value. The slides show this mistake and its fix.',
      html: String.raw`
<p>The rules for arguments:</p>
<ul>
  <li><code>pthread_create()</code> lets the programmer pass <b>one</b> argument to the start routine.</li>
  <li>To pass several arguments, create a <b>structure</b> that contains all of them and pass a pointer to it.</li>
  <li>All arguments must be passed <b>by reference</b> and cast to <code>(void *)</code>.</li>
</ul>
<p>"By reference" means the thread receives an <i>address</i>, and reads the value only later, when it runs. So the safe way is to give each thread <b>its own memory</b> for its argument — memory that nobody changes afterwards:</p>
<pre class="code" data-lang="c">int *inputids[NUM_THREADS];
...
for (t = 0; t &lt; NUM_THREADS; t++) {
    inputids[t] = (int *) malloc(sizeof(int));
    *inputids[t] = t;
    printf("Creating thread %d\n", t);
    rc = pthread_create(&amp;threads[t], NULL, PrintHello, (void *) inputids[t]);
    ...
}</pre>
<p><b>Example — Does it work?</b> Now look at a version that passes the address of the loop variable. Each thread sleeps 3 seconds and then prints the message for its number:</p>
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
<div class="callout warn"><b>It does not work.</b> Every thread receives the address of the <b>same</b> variable <code>t</code>. The threads read it only after 3 seconds — by then the loop has finished and <code>t == 8</code>. All threads see the same value (most likely 8), and <code>messages[8]</code> is outside the array. This is a race condition between main (which writes t) and the threads (which read it).</div>
<p>Step through the run to see the moment the value goes wrong:</p>
<div data-viz="0"></div>
<p><b>Example — It works!</b> The fix gives each thread its own array cell:</p>
<pre class="code" data-lang="c">int param[NUM_THREADS];
...
for (t = 0; t &lt; NUM_THREADS; t++) {
    printf("Creating thread %d\n", t);
    param[t] = t;
    rc = pthread_create(&amp;threads[t], NULL, PrintHello, (void *) &amp;param[t]);
    ...
}</pre>
<div class="callout key">Each thread gets a pointer to <b>its own</b> <code>param[t]</code>, which never changes afterwards → it prints "Thread i: messages[i]" for i = 0…7 (in some order).</div>`,
      viz: [{ name: 'stepper', caption: 'Why (void *) &t does not work.', props: { lang: 'c', code: String.raw`void *PrintHello(void *threadid) {
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
        { line: [10, 11, 12], note: 't = 0: thread 0 is created and receives the ADDRESS of t (not its value).', vars: { t: 0, 'arg of thread 0': '&t' }, out: 'Creating thread 0' },
        { line: 3, note: 'Thread 0 immediately sleeps for 3 s; it has not read *threadid yet.', vars: { t: 0 } },
        { line: [10, 11, 12], note: 'main continues the loop: threads 1…7 receive the same address &t.', vars: { t: 7, 'arg of all threads': '&t' }, out: 'Creating thread 1\nCreating thread 2\nCreating thread 3\nCreating thread 4\nCreating thread 5\nCreating thread 6\nCreating thread 7' },
        { line: 14, note: 'The loop has finished: t = 8. The main thread ends with pthread_exit; the process stays alive.', vars: { t: 8 } },
        { line: [4, 5], note: 'After 3 s every thread reads *id_ptr — the current value of t, which is 8 for all of them.', vars: { t: 8, taskid: 8 } },
        { line: 6, note: 'messages[8] is outside the 8-element array: garbage or a crash. Fix: param[t] = t; pass &param[t].', vars: { taskid: 8 }, out: 'Thread 8: ???   (×8 — the same for every thread)' }] } }],
      takeaway: 'pthread_create passes one argument by reference (void *); several arguments go in a struct. Never pass the address of a variable that keeps changing (&t): give each thread its own memory (param[t], or malloc per thread), or pass the value itself.',
      exam: '"Does it work?" — no: all threads get &t; how to fix it (param[t] or malloc per thread).'
    },
    {
      id: 'fork-join',
      h: 'Fork-join parallelism',
      why: 'split the work, then combine',
      lead: 'Creating threads is half of the job; at some point the program must wait for their results and combine them. The fork-join pattern describes this: split the work (fork), then wait and combine (join).',
      html: `
<p>In the <b>fork-join</b> model, multiple threads (tasks) are <b>forked</b> — started to work in parallel — and then <b>joined</b>: the parent waits for them to finish and combines their results. It is the old strategy of <b>divide et impera</b> (divide and conquer).</p>
<div class="callout warn">Do not confuse the words: "fork" here means <i>starting a parallel task</i> (usually a thread), not the <code>fork()</code> system call that copies a process.</div>
<p>The simplest form: start two threads, then wait for both before continuing (Java-like pseudocode from the slide):</p>
<pre class="code" data-lang="text">// Fork: create two threads (pseudocode)
Thread t1 = new Thread(() -&gt; ParallelWork1());
Thread t2 = new Thread(() -&gt; ParallelWork2());
t1.start();   // starting in parallel
t2.start();
// Join: wait they end
t1.join();
t2.join();
System.out.println("Both threads end, it is possible to continue!");</pre>
<p>The <b>general algorithm for the fork-join strategy</b> is recursive: a task that is too big splits itself into subtasks, forks them, and then joins their results.</p>
<pre class="code" data-lang="text">Task(problem)
   if problem is small enough
      solve the problem directly
   else
      subtask1 = fork(new Task(subset of problem))
      subtask2 = fork(new Task(subset of problem))

      result1 = join(subtask1)
      result2 = join(subtask2)

      return combined results</pre>
<p>The tree shows the recursion: forks go down until the pieces are small enough, and results are combined on the way back up.</p>
<div data-viz="0"></div>`,
      viz: [{ name: 'tree', caption: 'Recursive splitting: fork going down, join (combining results) going up.', props: { root: { label: 'task', note: 'fork ×2 → join', tone: 'acc', children: [
        { label: 'task', note: 'fork ×2 → join', tone: 'c2', children: [{ label: 'task', note: 'small: solve directly', tone: 'ok' }, { label: 'task', note: 'small: solve directly', tone: 'ok' }] },
        { label: 'task', note: 'fork ×2 → join', tone: 'c2', children: [{ label: 'task', note: 'small: solve directly', tone: 'ok' }, { label: 'task', note: 'small: solve directly', tone: 'ok' }] }] } } }],
      takeaway: 'Fork-join = divide and conquer with threads: if the problem is small enough, solve it directly; otherwise fork subtasks, join them (wait for their results) and combine the results.',
      exam: 'The fork-join algorithm: problem small enough → solve directly; otherwise fork subtasks and join their results.'
    },
    {
      id: 'join',
      h: 'Join, joinable/detached attributes, checking concurrency',
      why: 'waiting for threads in Pthreads',
      lead: 'In Pthreads, the "join" step of fork-join is pthread_join(). This section shows how join fixes the order of a program\'s output, which threads can be joined at all, and how to check that threads really run concurrently.',
      html: String.raw`
<p><b>Join.</b> The master thread creates a worker with <code>pthread_create()</code>; the worker does its work and calls <code>pthread_exit()</code>; meanwhile the master calls <code>pthread_join()</code>, which blocks it until that worker has terminated, and then continues. It plays for threads the role that wait() plays for child processes.</p>
<div data-viz="0"></div>
<p><b>Join example.</b> Two threads print one word each; main joins both and then prints the values returned by pthread_create:</p>
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
<div class="callout key">Output: "Hello" and "World" in <b>any order</b>, then <b>always</b> "thr1 returns: 0" and "thr2 returns: 0" — main prints them only after both <code>pthread_join</code> calls have returned. The 0 is the return code of <code>pthread_create</code> (success), not a result of the thread.</div>
<p><b>Attributes — joinable or detached.</b> Not every thread can be joined:</p>
<ul>
  <li>When a thread is created, one of its attributes defines whether it is <b>joinable</b> or <b>detached</b>.</li>
  <li><b>Only</b> threads created as joinable can be joined. A thread created as <b>detached</b> can <b>never</b> be joined (nobody will wait for it; its resources are freed as soon as it ends).</li>
  <li>To set the attribute: declare a <code>pthread_attr_t</code> variable; initialize it with <code>pthread_attr_init()</code>; set the state with <code>pthread_attr_setdetachstate()</code>.</li>
  <li><code>pthread_detach()</code> explicitly detaches a thread, even one that was created as joinable. <b>There is no converse routine</b>: a detached thread cannot become joinable again.</li>
</ul>
<pre class="code" data-lang="c">int rc;
pthread_t thread;
pthread_attr_t attr;
pthread_attr_init(&amp;attr);
pthread_attr_setdetachstate(&amp;attr, PTHREAD_CREATE_JOINABLE);
rc = pthread_create(&amp;thread[t], &amp;attr, BusyWork, NULL);</pre>
<p><b>Check concurrency.</b> How can we see that threads really run at the same time? Each of 5 threads sleeps for 5 seconds; we measure how long the whole program takes:</p>
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
  <li>All 5 threads are created at once and sleep <b>at the same time</b>, so the program runs for <b>≈ 5 s</b>, not 5 × 5 = 25 s. This is what shows concurrency.</li>
  <li>The lines "IN MAIN: Thread i has ended." are printed <b>strictly in order 1…5</b>: the order is set by the sequence of <code>pthread_join</code> calls, not by when the threads actually finish.</li>
</ul>
<div class="callout warn">The slide passes <code>&amp;i</code> to <code>pthread_create</code> instead of <code>&amp;thread_args[i]</code> — the same mistake as in "Does it work?" (and <code>i</code> is declared <code>short</code> but read as <code>int</code>). So the numbers in "THREAD n: …" may be wrong; the correct argument is <code>&amp;thread_args[i]</code>.</div>`,
      viz: [{ name: 'graph', caption: 'Join: the master thread waits for the worker in pthread_join().', props: { w: 620, h: 190,
        nodes: [
          { id: 'm', label: 'Master Thread', x: 75, y: 45, w: 120, tone: 'acc' },
          { id: 'c', label: 'pthread_create()', x: 240, y: 45, w: 140 },
          { id: 'j', label: 'pthread_join()', x: 450, y: 45, w: 140, tone: 'warn' },
          { id: 'go', label: 'continue', x: 575, y: 45, w: 80, shape: 'pill', tone: 'muted' },
          { id: 'w', label: 'Worker Thread', sub: 'DO WORK', x: 240, y: 145, w: 140, tone: 'ok' },
          { id: 'e', label: 'pthread_exit()', x: 450, y: 145, w: 140, tone: 'ok' }],
        edges: [{ from: 'm', to: 'c' }, { from: 'c', to: 'j' }, { from: 'j', to: 'go' }, { from: 'c', to: 'w' }, { from: 'w', to: 'e' }, { from: 'e', to: 'j' }] } }],
      takeaway: 'pthread_join() blocks until a given thread ends, so code after it runs only after that thread (the order of joins fixes the order of output). Only joinable threads can be joined; pthread_detach() makes a thread detached, with no way back. Concurrent sleeping threads finish in ≈ 5 s, not 25 s.',
      exam: 'The output order of the Join example; joinable vs detached, pthread_detach with no converse; the running time of Check concurrency.'
    },
    {
      id: 'fork-exec',
      h: 'Threading issues: semantics of fork() and exec()',
      why: 'old calls, new meaning',
      lead: 'Threads change the meaning of some calls we already know from processes. The first question: what should fork() copy when the process that calls it has several threads?',
      html: `
<p>The slides list five <b>threading issues</b> — places where threads make the design harder:</p>
<ul>
  <li>the semantics of <code>fork()</code> and <code>exec()</code>;</li>
  <li><b>signal handling</b> (synchronous and asynchronous);</li>
  <li><b>thread cancellation</b> of a target thread (asynchronous or deferred);</li>
  <li><b>thread-local storage</b>;</li>
  <li><b>scheduler activations</b>.</li>
</ul>
<p>This section and the next four take them in order. First, <b>fork() and exec()</b>:</p>
<ul>
  <li>If one thread of a multithreaded process calls <code>fork()</code>, does the new process duplicate <b>only the calling thread</b> or <b>all threads</b>?</li>
  <li>Some UNIX systems have <b>two versions of fork</b>: one that duplicates all threads, and one that duplicates only the calling thread.</li>
  <li><code>exec()</code> usually works as normal: it <b>replaces the running process, including all its threads</b>.</li>
</ul>
<div class="callout note">Which version to use follows from exec (Silberschatz): if <code>exec()</code> is called immediately after <code>fork()</code>, duplicating all threads is useless, because exec will replace them all anyway — the version that copies only the calling thread is enough. If the child does not call exec, it should get all threads.</div>`,
      takeaway: 'In a multithreaded process, fork() may copy all threads or only the caller — some UNIX systems offer both versions. exec() replaces the whole process with all its threads, so fork + immediate exec needs to copy only the calling thread.',
      exam: 'The two versions of fork in a multithreaded process; exec() replaces the whole process with all its threads.'
    },
    {
      id: 'signals',
      h: 'Signal handling',
      why: 'which thread gets the signal',
      lead: 'The second threading issue concerns signals. A signal is sent to a process — but if the process has several threads, which one should handle it?',
      html: `
<p><b>Signals</b> are used in UNIX systems to notify a process that a particular event has occurred (for example: Ctrl+C was pressed, a child terminated, the program divided by zero). A <b>signal handler</b> is the function that processes signals. Every signal follows the same path:</p>
<ol class="steps">
  <li>the signal is <b>generated</b> by a particular event;</li>
  <li>the signal is <b>delivered</b> to a process;</li>
  <li>the signal is <b>handled</b> by one of two signal handlers: <b>default</b> or <b>user-defined</b>.</li>
</ol>
<ul>
  <li>Every signal has a <b>default handler</b> that the <b>kernel</b> runs when handling the signal.</li>
  <li>A <b>user-defined</b> signal handler can override the default.</li>
  <li>In a single-threaded process, the signal is simply delivered to the process.</li>
</ul>
<p>Signals come in two kinds. A <b>synchronous</b> signal is caused by the running thread itself (for example an illegal memory access or a division by zero) — it clearly belongs to that thread. An <b>asynchronous</b> signal comes from outside (for example Ctrl+C or a timer) — no thread is "the cause".</p>
<p>So where should a signal be delivered in a <b>multithreaded</b> process? The options:</p>
<ol>
  <li>deliver the signal to the thread to which the signal applies (natural for synchronous signals);</li>
  <li>deliver the signal to every thread in the process;</li>
  <li>deliver the signal to certain threads in the process;</li>
  <li>assign a specific thread to receive all signals for the process.</li>
</ol>`,
      takeaway: 'A signal is generated, delivered and handled by a default handler (run by the kernel) or a user-defined one (which overrides it). In a multithreaded process it can go to the thread it applies to, to every thread, to certain threads, or to one thread chosen to receive all signals.',
      exam: 'Default vs user-defined handler; the 4 options for delivering a signal in a multithreaded process.'
    },
    {
      id: 'cancellation',
      h: 'Thread cancellation',
      why: 'stopping a thread safely',
      lead: 'Sometimes a thread must be stopped before it finishes — for example, several threads search for the same item, one finds it, and the others are no longer needed. This is thread cancellation, and doing it safely is harder than it sounds.',
      html: `
<p><b>Thread cancellation</b> means terminating a thread before it has finished. The thread to be cancelled is the <b>target thread</b>. There are two general approaches:</p>
<ul>
  <li><b>Asynchronous cancellation</b> terminates the target thread <b>immediately</b>;</li>
  <li><b>Deferred cancellation</b> lets the target thread <b>periodically check</b> whether it should be cancelled.</li>
</ul>
<p>Why not always stop at once? Because the target thread may be in the middle of updating shared data or holding resources. Killed at a random instant, it can leave data half-updated (the race condition problem again) or resources never released. Deferred cancellation lets the thread stop only at points where this is safe.</p>
<p>In Pthreads:</p>
<pre class="code" data-lang="c">pthread_t tid;

/* create the thread */
pthread_create(&amp;tid, 0, worker, NULL);
. . .
/* cancel the thread */
pthread_cancel(tid);

/* wait for the thread to terminate */
pthread_join(tid, NULL);</pre>
<ul>
  <li>Invoking thread cancellation only <b>requests</b> cancellation; the actual cancellation depends on the thread's state.</li>
  <li>If the thread has cancellation <b>disabled</b>, the request remains <b>pending</b> until the thread enables it.</li>
  <li>The <b>default type is deferred</b>: cancellation happens only when the thread reaches a <b>cancellation point</b> (for example <code>pthread_testcancel()</code>); then a <b>cleanup handler</b> is invoked to release the thread's resources.</li>
  <li>On Linux, thread cancellation is handled through <b>signals</b> (the previous section).</li>
</ul>`,
      takeaway: 'Asynchronous cancellation stops the target thread immediately (risky); deferred cancellation (the default) stops it only at a cancellation point such as pthread_testcancel(), then runs a cleanup handler. pthread_cancel() only requests; if cancellation is disabled, the request stays pending.',
      exam: 'Asynchronous vs deferred; the default type (deferred); cancellation point, pthread_testcancel(), cleanup handler; what happens if cancellation is disabled.'
    },
    {
      id: 'tls',
      h: 'Thread-local storage (TLS)',
      why: 'private data that lasts',
      lead: 'Threads share all global data. But sometimes each thread needs its own copy of some data that survives from one function call to the next — something between a local variable and a global one. Thread-local storage provides exactly that.',
      html: `
<ul>
  <li><b>Thread-local storage (TLS)</b> allows each thread to have <b>its own copy of data</b>.</li>
  <li>It is useful when you do not have control over the thread creation process (for example, when using a <b>thread pool</b> — a set of threads created in advance and reused for many tasks), so you cannot simply pass the data as an argument.</li>
</ul>
<p>Where does TLS fit among the kinds of variables we know? Compare the three:</p>
<table class="t">
  <tr><th></th><th>Local variables</th><th>static / global data</th><th>TLS</th></tr>
  <tr><td>Visible</td><td>only during <b>one function call</b></td><td>across function calls</td><td>across function calls</td></tr>
  <tr><td>Copies</td><td>one per call</td><td>one, shared by all threads</td><td><b>one per thread</b></td></tr>
</table>
<p>So TLS is similar to <b>static</b> data — it lives across function invocations — but it is <b>unique to each thread</b>.</p>`,
      takeaway: 'TLS gives each thread its own copy of data that is visible across function calls: like static data, but unique per thread. Useful when threads are created by someone else, e.g. a thread pool.',
      exam: 'TLS vs local variables vs static data.'
    },
    {
      id: 'sched-act',
      h: 'Scheduler activations — LWP and upcalls',
      why: 'keeping enough kernel threads',
      lead: 'The many-to-many and two-level models raise a practical problem: how many kernel threads should a process get, and how does the thread library learn that one of them has blocked? Scheduler activations solve it.',
      html: `
<ul>
  <li>Both the <b>M:M</b> and the <b>two-level</b> models require communication between the kernel and the thread library, to maintain the appropriate number of kernel threads allocated to the application.</li>
  <li>Typically an intermediate data structure is placed between user and kernel threads — the <b>lightweight process (LWP)</b>:
    <ul>
      <li>to the thread library it appears to be a <b>virtual processor</b> on which the process can schedule a user thread to run;</li>
      <li>each LWP is attached to a <b>kernel thread</b>;</li>
      <li>the open question: how many LWPs should be created?</li>
    </ul></li>
</ul>
<p>Why does the number matter? If a kernel thread blocks (e.g. on I/O), its LWP blocks too, and so does the user thread on it. If all LWPs are blocked, ready user threads cannot run even though the CPU is free. The library needs to know when this happens.</p>
<ul>
  <li><b>Scheduler activations</b> provide <b>upcalls</b> — a communication mechanism <b>from the kernel</b> to an <b>upcall handler</b> in the thread library. (A normal system call goes "down" from the program to the kernel; an upcall goes "up".)</li>
  <li>This communication allows an application to maintain the correct number of kernel threads — for example, the kernel tells the library "this thread is about to block, here is a new virtual processor".</li>
</ul>
<div data-viz="0"></div>`,
      viz: [{ name: 'flow', caption: 'User thread → LWP (virtual processor) → kernel thread; upcalls go from the kernel to the library.', props: { dir: 'h', steps: [
        { label: 'User thread', sub: 'thread library' }, { label: 'LWP', sub: 'virtual processor', tone: 'acc' },
        { label: 'Kernel thread', sub: 'upcall → upcall handler', tone: 'warn' }, { label: 'CPU', tone: 'ok' }] } }],
      takeaway: 'In M:M and two-level models, an LWP (a virtual processor attached to a kernel thread) sits between user and kernel threads. Scheduler activations use upcalls — from the kernel to the library\'s upcall handler — so the application can keep the right number of kernel threads.',
      exam: 'What an LWP and an upcall are; why scheduler activations are needed (M:M and two-level).'
    },
    {
      id: 'linux',
      h: 'Linux threads — tasks and clone()',
      why: 'one mechanism for both',
      lead: 'Linux has its own answer to "process or thread?": it hardly distinguishes them. Everything is a task, and flags decide how much a new task shares with its parent.',
      html: `
<ul>
  <li>Linux refers to them as <b>tasks</b> rather than threads.</li>
  <li>Thread creation is done through the <code>clone()</code> system call.</li>
  <li><code>clone()</code> allows a child task to <b>share the address space</b> of the parent task (process).</li>
  <li>What is shared is controlled by <b>flags</b>:</li>
</ul>
<table class="t">
  <tr><th>flag</th><th>meaning</th></tr>
  <tr><td><code>CLONE_FS</code></td><td>File-system information is shared.</td></tr>
  <tr><td><code>CLONE_VM</code></td><td>The same memory space is shared.</td></tr>
  <tr><td><code>CLONE_SIGHAND</code></td><td>Signal handlers are shared.</td></tr>
  <tr><td><code>CLONE_FILES</code></td><td>The set of open files is shared.</td></tr>
</table>
<p>This is possible because of how the PCB is built: <code>struct task_struct</code> (from the Processes module) does not contain the process data itself but <b>points to</b> the process data structures (memory, open files, signal handlers…). Those structures can be <b>shared or unique</b>: two tasks either point to the same structure or each has its own copy.</p>
<div class="callout key">With the sharing flags, clone() creates what we call a "thread" (shared memory, files, handlers). Without them, it creates a separate process, just like fork().</div>`,
      takeaway: 'Linux calls threads tasks and creates them with clone(). The flags CLONE_VM (memory), CLONE_FILES (open files), CLONE_FS (file-system info) and CLONE_SIGHAND (signal handlers) decide what is shared; with all of them you get a thread, with none a fork-like process.',
      exam: 'Linux: tasks, clone(), the meaning of CLONE_VM / CLONE_FILES / CLONE_FS / CLONE_SIGHAND.'
    },
    {
      id: 'java',
      h: 'Multithreading in Java (Recap)',
      why: 'the same idea in a language',
      lead: 'Java has threads built into the language. The two ways to create one express the same idea as Pthreads — give the thread a function to run — in object-oriented form.',
      html: `
<p>In Java a thread is created in two ways; in both, the code of the thread goes into the method <code>run()</code>, which is overridden:</p>
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
  <li><b>extends Thread</b> — the class itself is a thread;</li>
  <li><b>implements Runnable</b> — the class is only a task (a Runnable), which is passed to a Thread object to run.</li>
  <li>A thread is started with <code>start()</code> and waited for with <code>join()</code> (as in the fork-join example). Compare with Pthreads: <code>run()</code> ≈ the start routine, <code>start()</code> ≈ pthread_create, <code>join()</code> ≈ pthread_join.</li>
</ul>
<p>This completes the picture: a system now contains many processes, each with one or more threads, all wanting a CPU core. Deciding which of them runs next, and for how long, is the job of the CPU scheduler — the topic of the next module.</p>`,
      takeaway: 'Java: extend Thread or implement Runnable; in both cases the thread\'s code goes into run(). start() launches the thread, join() waits for it.',
      exam: 'The two ways: extends Thread and implements Runnable; run() is overridden.'
    }
  ],
  terms: [
    { en: 'Thread', ru: 'поток', def: 'The smallest unit of execution within a process: its own PC, registers and stack; shares code, data and files.' },
    { en: 'Multithreaded process', ru: 'многопоточный процесс', def: 'A process with several threads, each with its own registers, stack and PC.' },
    { en: 'Single-threaded process', ru: 'однопоточный процесс', def: 'A process with exactly one thread of execution.' },
    { en: 'Multithreaded server', ru: 'многопоточный сервер', def: 'A server that creates a new thread for each request and keeps listening for new ones.' },
    { en: 'Heavy-weight', ru: 'тяжеловесный', def: 'Expensive to create; said of process creation.' },
    { en: 'Light-weight', ru: 'легковесный', def: 'Cheap to create; said of thread creation.' },
    { en: 'Thread ID', ru: 'идентификатор потока', def: 'TID: a unique identifier of a thread within a process.' },
    { en: 'File descriptor', ru: 'файловый дескриптор', def: 'A small integer referring to an open file; shared by the threads of a process.' },
    { en: 'Thread states', ru: 'состояния потока', def: 'Threads move between states depending on resource availability and synchronization.' },
    { en: 'Synchronization', ru: 'синхронизация', def: 'Coordinating threads or processes that access shared data, to avoid race conditions.' },
    { en: 'Mutex', ru: 'мьютекс', def: 'A lock that lets only one thread at a time access shared data.' },
    { en: 'Semaphore', ru: 'семафор', def: 'A synchronization tool: an integer counter with atomic wait/signal operations.' },
    { en: 'Monitor', ru: 'монитор', def: 'A high-level synchronization construct.' },
    { en: 'Race condition', ru: 'состояние гонки', def: 'The result depends on the order in which threads access shared data.' },
    { en: 'Data race', ru: 'гонка данных', def: 'Two threads access the same data at the same time and at least one writes it, without synchronization.' },
    { en: 'Deadlock', ru: 'взаимная блокировка', def: 'Threads wait for each other forever.' },
    { en: 'Responsiveness', ru: 'отзывчивость', def: 'The application keeps working even if part of it is blocked.' },
    { en: 'Resource sharing', ru: 'совместное использование ресурсов', def: 'Threads share the resources of their process, which is easier than shared memory or message passing.' },
    { en: 'Economy', ru: 'экономичность', def: 'Creating and switching threads is cheaper than creating and switching processes.' },
    { en: 'Scalability', ru: 'масштабируемость', def: 'A multithreaded process can take advantage of several cores.' },
    { en: 'Resource ownership', ru: 'владение ресурсами', def: 'A process owns its memory and resources; a thread shares them with its process.' },
    { en: 'Fault tolerance', ru: 'отказоустойчивость', def: 'A crashing process does not affect others; a crashing thread can affect the other threads of its process.' },
    { en: 'Memory map', ru: 'карта памяти', def: 'The mapping of a process\'s address space; it does not change when switching between threads of one process.' },
    { en: 'Multicore programming', ru: 'многоядерное программирование', def: 'Writing programs that use several cores; challenges: dividing activities, balance, data splitting, data dependency, testing and debugging.' },
    { en: 'Dividing activities', ru: 'разделение задач', def: 'Finding the parts of a program that can run at the same time.' },
    { en: 'Data splitting', ru: 'разделение данных', def: 'Dividing the data among the cores.' },
    { en: 'Data dependency', ru: 'зависимость по данным', def: 'One task needs the results of another, so they must be synchronized.' },
    { en: 'Testing and debugging', ru: 'тестирование и отладка', def: 'Hard for parallel programs because of the many possible execution orders.' },
    { en: 'Concurrency', ru: 'конкурентность', def: 'More than one task makes progress (possibly by interleaving on one core).' },
    { en: 'Parallelism', ru: 'параллелизм', def: 'More than one task runs at the same instant (needs several cores).' },
    { en: 'Data parallelism', ru: 'параллелизм данных', def: 'Subsets of the same data on different cores, with the same operation on each.' },
    { en: 'Task parallelism', ru: 'параллелизм задач', def: 'Threads on different cores, each performing a unique operation.' },
    { en: 'Interleaving', ru: 'чередование', def: 'Tasks take turns on one core, so they only appear to run at the same time.' },
    { en: 'Multi-core', ru: 'многоядерный', def: 'A single CPU with several independent cores; physical (hardware-level) parallelism.' },
    { en: 'Multi-processor', ru: 'многопроцессорный', def: 'A system with several physical CPUs; M CPUs × N cores run M·N threads at once.' },
    { en: 'Hyper-Threading', ru: 'гиперпоточность', def: 'Intel technology listed under logical/software-level multithreading in the Recap table.' },
    { en: 'Amdahl\'s law', ru: 'закон Амдала', def: 'speedup ≤ 1 / (S + (1 − S)/N); as N → ∞ the speedup approaches 1/S.' },
    { en: 'Serial portion', ru: 'последовательная часть', def: 'S: the fraction of a program that cannot be parallelized.' },
    { en: 'Speedup', ru: 'ускорение', def: 'How many times faster the program runs on N cores than on one.' },
    { en: 'User-level thread', ru: 'поток пользовательского уровня', def: 'ULT: managed entirely by a user-level library; the kernel does not know about it.' },
    { en: 'Kernel-level thread', ru: 'поток уровня ядра', def: 'KLT: managed and scheduled directly by the kernel (Windows, Linux, macOS, iOS, Android).' },
    { en: 'Thread library', ru: 'библиотека потоков', def: 'An API for creating and managing threads; implemented in user space or at kernel level.' },
    { en: 'Multithreading model', ru: 'модель многопоточности', def: 'How user threads are mapped onto kernel threads: M:1, 1:1, M:M, two-level.' },
    { en: 'Many-to-One', ru: 'многие-к-одному', def: 'Many user threads on one kernel thread: one blocking call blocks all, no parallelism.' },
    { en: 'One-to-One', ru: 'один-к-одному', def: 'Each user thread has its own kernel thread (Windows, Linux); the number of threads may be limited.' },
    { en: 'Many-to-Many', ru: 'многие-ко-многим', def: 'Many user threads on many kernel threads (Windows ThreadFiber).' },
    { en: 'Two-level model', ru: 'двухуровневая модель', def: 'M:M plus the option to bind a user thread to a kernel thread.' },
    { en: 'Bound thread', ru: 'привязанный поток', def: 'A user thread permanently attached to its own kernel thread (two-level model).' },
    { en: 'Pthreads', ru: 'потоки POSIX', def: 'POSIX standard (IEEE 1003.1c) API for threads — a specification, not an implementation.' },
    { en: 'pthread_create()', ru: 'функция pthread_create()', def: 'Creates a thread (thread, attr, start_routine, arg); returns 0 on success or an error number.' },
    { en: 'Start routine', ru: 'стартовая функция потока', def: 'The C function a new thread executes.' },
    { en: 'pthread_exit()', ru: 'функция pthread_exit()', def: 'Terminates the calling thread only; in main it lets the other threads continue.' },
    { en: 'pthread_join()', ru: 'функция pthread_join()', def: 'Blocks the calling thread until the given joinable thread terminates.' },
    { en: 'Thread attributes', ru: 'атрибуты потока', def: 'A pthread_attr_t object with properties of a new thread (e.g. joinable/detached, scope).' },
    { en: 'Joinable thread', ru: 'присоединяемый поток', def: 'A thread that another thread can wait for with pthread_join().' },
    { en: 'Detached thread', ru: 'отсоединённый поток', def: 'A thread that can never be joined; pthread_detach() makes a thread detached and there is no converse.' },
    { en: 'Master thread', ru: 'главный поток', def: 'The thread that creates workers and joins them.' },
    { en: 'Worker thread', ru: 'рабочий поток', def: 'A thread created to do part of the work.' },
    { en: 'Fork-join parallelism', ru: 'параллелизм fork-join', def: 'Tasks are forked into parallel subtasks, then joined and their results combined.' },
    { en: 'Divide and conquer', ru: 'разделяй и властвуй', def: 'Divide et impera: split a problem into smaller problems, solve them, combine the results.' },
    { en: 'Threading issues', ru: 'проблемы многопоточности', def: 'fork/exec semantics, signal handling, thread cancellation, thread-local storage, scheduler activations.' },
    { en: 'Signal', ru: 'сигнал', def: 'A UNIX notification to a process that a particular event has occurred.' },
    { en: 'Signal handler', ru: 'обработчик сигнала', def: 'The function that processes a signal: default (run by the kernel) or user-defined.' },
    { en: 'Default signal handler', ru: 'обработчик сигнала по умолчанию', def: 'The handler the kernel runs for a signal unless a user-defined one overrides it.' },
    { en: 'User-defined signal handler', ru: 'пользовательский обработчик сигнала', def: 'A handler written by the programmer that overrides the default.' },
    { en: 'Synchronous signal', ru: 'синхронный сигнал', def: 'A signal caused by the running thread itself (e.g. illegal memory access).' },
    { en: 'Asynchronous signal', ru: 'асинхронный сигнал', def: 'A signal caused by an external event (e.g. Ctrl+C, a timer).' },
    { en: 'Thread cancellation', ru: 'отмена потока', def: 'Terminating a thread before it has finished.' },
    { en: 'Target thread', ru: 'целевой поток', def: 'The thread that is to be cancelled.' },
    { en: 'Asynchronous cancellation', ru: 'асинхронная отмена', def: 'Terminates the target thread immediately.' },
    { en: 'Deferred cancellation', ru: 'отложенная отмена', def: 'The default type: the thread is cancelled only at a cancellation point.' },
    { en: 'Cancellation point', ru: 'точка отмены', def: 'A place where a thread with deferred cancellation may be cancelled, e.g. pthread_testcancel().' },
    { en: 'Cleanup handler', ru: 'обработчик очистки', def: 'A function invoked when a thread is cancelled, to release its resources.' },
    { en: 'Thread-local storage', ru: 'локальная память потока', def: 'TLS: each thread has its own copy of data, visible across function calls (like static, but per thread).' },
    { en: 'Thread pool', ru: 'пул потоков', def: 'A set of threads created in advance and reused for many tasks.' },
    { en: 'Scheduler activations', ru: 'активации планировщика', def: 'A scheme of kernel–library communication (upcalls) that keeps the right number of kernel threads.' },
    { en: 'Lightweight process', ru: 'облегчённый процесс', def: 'LWP: a structure between user and kernel threads; a virtual processor attached to a kernel thread.' },
    { en: 'Virtual processor', ru: 'виртуальный процессор', def: 'How an LWP appears to the thread library: something on which a user thread can be run.' },
    { en: 'Upcall', ru: 'обратный вызов из ядра (апколл)', def: 'A communication from the kernel to the upcall handler in the thread library.' },
    { en: 'Upcall handler', ru: 'обработчик апколлов', def: 'The function in the thread library that receives upcalls from the kernel.' },
    { en: 'Task', ru: 'задача (task в Linux)', def: 'The Linux name for a thread or process.' },
    { en: 'clone()', ru: 'системный вызов clone()', def: 'Linux system call that creates a task; flags (CLONE_VM, CLONE_FILES, CLONE_FS, CLONE_SIGHAND) decide what is shared with the parent.' },
    { en: 'Runnable', ru: 'интерфейс Runnable', def: 'Java interface for a task with a run() method, executed by a Thread object.' }
  ],
  questions: [
    { id: 'thr-01', type: 'single', q: 'According to the Motivation slide, process creation and thread creation are, respectively:', options: ['heavy-weight and light-weight', 'light-weight and heavy-weight', 'both heavy-weight', 'both light-weight'], answer: 0, explain: 'Creating a process is heavy (its address space must be built or copied); creating a thread is light (it shares the existing memory).', section: 'motivation', diff: 1 },
    { id: 'thr-02', type: 'single', q: 'A multithreaded server receives a request and creates a thread to service it. What does the server do next?', options: ['Waits for the thread to finish', 'Resumes listening for new client requests', 'Terminates', 'Forwards the request to another server'], answer: 1, explain: 'Step (3) of the scheme: resume listening for additional client requests; the new thread serves the request.', section: 'motivation', diff: 1 },
    { id: 'thr-03', type: 'multi', q: 'What do threads of the same process share? (select all that apply)', options: ['Code', 'Data (heap, global variables)', 'File descriptors', 'Stack', 'Program counter'], answer: [0, 1, 2], explain: 'The stack, the PC and the CPU registers are private to each thread; code, data and file descriptors are shared.', section: 'definition', diff: 1 },
    { id: 'thr-04', type: 'single', q: 'Which of these is private to each thread?', options: ['Heap', 'Global variables', 'Stack', 'Open files'], answer: 2, explain: 'Private: PC, stack, CPU registers. The heap, globals and open files are shared by all threads of the process.', section: 'definition', diff: 1 },
    { id: 'thr-05', type: 'tf', q: 'Because threads share the address space, they need synchronization mechanisms (mutexes, semaphores, monitors) to avoid race conditions.', answer: true, explain: 'From the "Memory Management of Thread" slide: shared memory is an advantage for communication and a challenge for synchronization.', section: 'definition', diff: 1 },
    { id: 'thr-06', type: 'multi', q: 'Benefits of multithreading according to the slides: (select all that apply)', options: ['Responsiveness', 'Resource Sharing', 'Economy', 'Scalability', 'Fault isolation'], answer: [0, 1, 2, 3], explain: 'The four benefits. Threads do NOT give fault isolation — a crash of one thread can affect the whole process.', section: 'benefits', diff: 1 },
    { id: 'thr-07', type: 'single', q: 'Which benefit means that a process can take advantage of multicore architectures?', options: ['Responsiveness', 'Economy', 'Scalability', 'Resource Sharing'], answer: 2, explain: 'Scalability = using several cores. Economy = cheap creation and switching.', section: 'benefits', diff: 1 },
    { id: 'thr-08', type: 'single', q: 'Fault tolerance: what happens when one thread crashes?', options: ['It does not affect the other threads', 'It may affect the other threads of the same process', 'It affects all processes in the system', 'The thread is restarted automatically'], answer: 1, explain: 'Threads share the memory space, so a problem in one can affect the others in the same process. A crashing process, instead, does not affect other processes.', section: 'vs-process', diff: 1 },
    { id: 'thr-09', type: 'tf', q: 'When switching between threads of the same process, the memory maps do not need to change — only the PC and registers (and the stack) are switched.', answer: true, explain: 'Threads share memory, so a context switch between them is lighter than between processes.', section: 'vs-process', diff: 2 },
    { id: 'thr-10', type: 'single', q: 'Lifetime, in the Processes vs Threads table: the lifetime of a thread…', options: ['is independent of the process', 'depends on the lifetime of its parent process', 'is always longer than that of the process', 'is limited to one time quantum'], answer: 1, explain: 'A process has an independent lifetime; a thread lives inside its process and ends with it.', section: 'vs-process', diff: 2 },
    { id: 'thr-11', type: 'multi', q: 'Challenges of multicore programming according to the slide: (select all that apply)', options: ['Dividing activities', 'Balance', 'Data splitting', 'Data dependency', 'Testing and debugging', 'Increasing clock frequency'], answer: [0, 1, 2, 3, 4], explain: 'The five challenges are for the programmer; the clock frequency is a hardware matter, not one of them.', section: 'multicore', diff: 1 },
    { id: 'thr-12', type: 'single', q: 'What is possible on a single-core system?', options: ['Parallelism, but not concurrency', 'Concurrency, but not parallelism', 'Both concurrency and parallelism', 'Neither'], answer: 1, explain: 'On one core the scheduler interleaves tasks — concurrency. Running tasks at the same instant (parallelism) needs several cores.', section: 'multicore', diff: 1 },
    { id: 'thr-13', type: 'single', q: 'An array is split into 4 parts and each core sums its own part. This is…', options: ['Task parallelism', 'Data parallelism', 'Concurrency without parallelism', 'Many-to-one'], answer: 1, explain: 'Subsets of the same data, with the same operation on each core — data parallelism. Task parallelism would give each core a different operation.', section: 'multicore', diff: 2 },
    { id: 'thr-14', type: 'single', q: 'An application is 75% parallel and 25% serial. What is the speedup when moving from 1 to 2 cores, according to Amdahl\'s law?', options: ['2.0', '1.6', '1.33', '4.0'], answer: 1, explain: '1 / (0.25 + 0.75/2) = 1 / 0.625 = 1.6. 2.0 would be the ideal speedup, ignoring the serial part.', section: 'amdahl', diff: 1 },
    { id: 'thr-15', type: 'single', q: 'S = 0.25. What is the limit of the speedup as N → ∞?', options: ['2', '4', '25', 'Infinity'], answer: 1, explain: 'As N → ∞, the speedup → 1/S = 1/0.25 = 4.', section: 'amdahl', diff: 2 },
    { id: 'thr-16', type: 'single', q: 'S = 0.10, N = 16. The speedup according to Amdahl\'s law is approximately…', options: ['6.4', '9.1', '10', '16'], answer: 0, explain: '1 / (0.1 + 0.9/16) = 1 / (0.1 + 0.05625) = 1 / 0.15625 = 6.4. 10 is the limit for N → ∞.', section: 'amdahl', diff: 3 },
    { id: 'thr-17', type: 'single', q: 'Half of a program is serial (S = 0.5). What is the maximum possible speedup with any number of cores?', options: ['1.5', '2', '4', 'unlimited'], answer: 1, explain: '1/S = 2: the serial portion has a disproportionate effect on the gain from adding cores.', section: 'amdahl', diff: 2 },
    { id: 'thr-18', type: 'single', q: 'A server has 2 CPUs with 4 cores each, and each request is a separate thread. How many requests can be processed truly simultaneously?', options: ['2', '4', '6', '8'], answer: 3, explain: 'M CPUs × N cores = 2 × 4 = 8.', section: 'hierarchy', diff: 1 },
    { id: 'thr-19', type: 'tf', q: 'On a single-core system, a multithreaded program runs its threads truly in parallel.', answer: false, explain: 'Without several cores the threads are only interleaved on one core: concurrency, not parallelism.', section: 'hierarchy', diff: 1 },
    { id: 'thr-20', type: 'single', q: 'In the comparative table, Intel Hyper-Threading and Java threads are listed under…', options: ['Multithread (logical / software-level)', 'Multi-core (physical / hardware-level)', 'Multi-processor', 'Distributed systems'], answer: 0, explain: 'The Multithread row: parallelism type logical/software-level; examples Hyper-Threading and Java threads.', section: 'hierarchy', diff: 2 },
    { id: 'thr-21', type: 'single', q: 'User-level threads (ULTs): how does the kernel see them?', options: ['As separate kernel threads', 'It is unaware of them and manages the process as single-threaded', 'As separate processes', 'As LWPs'], answer: 1, explain: 'ULTs are managed entirely by a library; the kernel does not know they exist.', section: 'user-kernel', diff: 1 },
    { id: 'thr-22', type: 'single', q: 'The main disadvantage of kernel-level threads according to the Recap slide:', options: ['The kernel is unaware of the threads', 'The overhead of kernel involvement can impact performance', 'There is no parallelism', 'One blocking thread blocks all'], answer: 1, explain: 'KLTs support parallelism better, but kernel involvement costs time. The other options describe ULTs or the many-to-one model.', section: 'user-kernel', diff: 2 },
    { id: 'thr-23', type: 'single', q: 'In the Many-to-One model, one thread makes a blocking system call. What happens?', options: ['Only that thread blocks', 'All threads of the process block', 'The kernel creates a new kernel thread', 'The thread moves to another core'], answer: 1, explain: 'All user threads are mapped to one kernel thread; when it blocks, all of them stop.', section: 'models', diff: 1 },
    { id: 'thr-24', type: 'single', q: 'Which model do Windows and Linux use?', options: ['Many-to-One', 'One-to-One', 'Many-to-Many', 'Two-level'], answer: 1, explain: 'The One-to-One slide lists Windows and Linux as examples.', section: 'models', diff: 1 },
    { id: 'thr-25', type: 'single', q: 'How does the two-level model differ from Many-to-Many?', options: ['It does not allow creating kernel threads', 'It allows a user thread to be bound to a kernel thread', 'It maps all user threads to one kernel thread', 'It works only in user space'], answer: 1, explain: 'Two-level = M:M plus the option of a bound thread.', section: 'models', diff: 2 },
    { id: 'thr-26', type: 'tf', q: 'In the Many-to-One model, the threads of a process can run in parallel on several cores.', answer: false, explain: 'Only one thread of the process can be in the kernel at a time (there is one kernel thread), so there is no parallelism.', section: 'models', diff: 2 },
    { id: 'thr-27', type: 'single', q: 'Which examples are given for Many-to-One?', options: ['Windows, Linux', 'Solaris Green Threads, GNU Portable Threads', 'Windows ThreadFiber', 'iOS, Android'], answer: 1, explain: 'M:1 — Solaris Green Threads and GNU Portable Threads; 1:1 — Windows, Linux; M:M — ThreadFiber.', section: 'models', diff: 2 },
    { id: 'thr-28', type: 'single', q: 'Pthreads is…', options: ['a specific implementation of threads in the Linux kernel', 'a POSIX specification (IEEE 1003.1c) of an API, not an implementation', 'a library only for Windows', 'the Many-to-Many model'], answer: 1, explain: 'The API defines the behaviour; the implementation is up to the library developers, and can be user- or kernel-level.', section: 'libraries', diff: 1 },
    { id: 'thr-29', type: 'single', q: 'What does pthread_create() return on success?', options: ['The TID of the new thread', '0', '1', 'A pointer to start_routine'], answer: 1, explain: 'On success it returns 0, on error an error number. The thread id is written into *thread, not returned.', section: 'libraries', diff: 1 },
    { id: 'thr-30', type: 'single', q: 'Why does main in the PrintHello example end with pthread_exit(NULL) instead of return 0?', options: ['To free the threads\' memory', 'So that only the main thread ends and the process keeps running until the other threads finish', 'To cancel all threads', 'It is required for compilation'], answer: 1, explain: 'return from main calls exit() and ends the process with all its threads; pthread_exit ends only the main thread.', section: 'pthreads', diff: 3 },
    { id: 'thr-31', type: 'code', q: 'What is wrong with this code (the "Does it work?" slide)?', lang: 'c', code: String.raw`void *PrintHello(void *threadid) {
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
}`, options: ['All threads receive the address of the same variable t; when they read it, t has already changed (most likely to 8)', 'A pointer to int cannot be passed to pthread_create', 'The threads cannot see the global array messages', 'sleep(3) blocks the whole process for 3 s'], answer: 0, explain: 'The address &t is passed, not the value; after 3 s the loop has ended, so all threads read the same value of t (8), and messages[8] is outside the array.', section: 'args', diff: 2 },
    { id: 'thr-32', type: 'multi', q: 'Which ways of passing the number t to a thread are correct? (select all that apply)', options: ['param[t] = t; pthread_create(..., (void *) &param[t]);', 'p = malloc(sizeof(int)); *p = t; pthread_create(..., (void *) p);', 'pthread_create(..., (void *)(size_t) t); and (int) threadid inside the thread', 'pthread_create(..., (void *) &t);'], answer: [0, 1, 2], explain: 'The first two give each thread its own memory (the "It works!" and inputids slides); the third passes the value itself, as in PrintHello. &t is a shared address that keeps changing — the bug.', section: 'args', diff: 3 },
    { id: 'thr-33', type: 'single', q: 'How do you pass several arguments to a thread?', options: ['Call pthread_create several times', 'Create a structure with all the arguments and pass a pointer to it', 'Only through global variables — there is no other way', 'Pass an array through attr'], answer: 1, explain: 'pthread_create passes one argument; several are packed into a struct and a pointer to it is passed as (void *).', section: 'args', diff: 1 },
    { id: 'thr-34', type: 'single', q: 'In the general fork-join algorithm, what does Task(problem) do if the problem is small enough?', options: ['Forks two subtasks', 'Solves the problem directly', 'Calls join', 'Terminates with an error'], answer: 1, explain: 'If the problem is small enough → solve it directly; otherwise fork subtasks and join their results.', section: 'fork-join', diff: 1 },
    { id: 'thr-35', type: 'code', q: 'What does the program print (the Join example)?', lang: 'c', code: String.raw`pthread_t thr1, thr2;
char *message1 = "Hello";
char *message2 = "World";
int thpoint1, thpoint2;
thpoint1 = pthread_create(&thr1, NULL, print_message_function, (void*) message1);
thpoint2 = pthread_create(&thr2, NULL, print_message_function, (void*) message2);
pthread_join(thr1, NULL);
pthread_join(thr2, NULL);
printf("thr1 returns: %d\n", thpoint1);
printf("thr2 returns: %d\n", thpoint2);
/* print_message_function prints the string ptr and calls pthread_exit(NULL) */`, options: ['Hello and World in any order, then thr1 returns: 0 and thr2 returns: 0', 'Always Hello, World, then thr1 returns: 1 and thr2 returns: 2', 'thr1 returns: 0 may be printed before Hello', 'Hello and World, then thr1 returns: <the thread TID>'], answer: 0, explain: 'main prints only after both pthread_join calls. thpoint holds the return code of pthread_create (0 = success), not a TID or a thread result. The order of Hello/World is not defined.', section: 'join', diff: 3 },
    { id: 'thr-36', type: 'single', q: 'A thread was created as detached. Which statement is true?', options: ['It can be joined later', 'It can never be joined', 'pthread_attach() makes it joinable again', 'It terminates right after creation'], answer: 1, explain: 'A detached thread cannot be joined. pthread_detach() turns a joinable thread into a detached one, and there is no converse routine.', section: 'join', diff: 2 },
    { id: 'thr-37', type: 'code', q: 'Check concurrency: 5 threads are created in a loop, each calls sleep(5), then main joins all of them. Approximately how long does the program run?', lang: 'c', code: String.raw`for (i = 0; i < NUM_THREADS; i++) {      /* NUM_THREADS = 5 */
    printf("IN MAIN: Creating thread %d.\n", i + 1);
    result_code = pthread_create(&threads[i], NULL, perform_work, &i);
}
printf("IN MAIN: All threads are created.\n");
for (i = 0; i < NUM_THREADS; i++) {
    result_code = pthread_join(threads[i], NULL);
    printf("IN MAIN: Thread %d has ended.\n", i + 1);
}
/* perform_work: print, sleep(5), print */`, options: ['≈ 5 s', '≈ 25 s', '≈ 1 s', '≈ 10 s'], answer: 0, explain: 'The threads are created without waiting and sleep at the same time; join waits for them, but in total ≈ 5 s, not 5 × 5 = 25 s.', section: 'join', diff: 2 },
    { id: 'thr-38', type: 'single', q: 'In the same program, in which order are the lines "IN MAIN: Thread i has ended." printed?', options: ['Always 1, 2, 3, 4, 5', 'In the order in which the threads actually finish', 'In random order', 'In reverse order 5…1'], answer: 0, explain: 'main calls pthread_join in order: until thread 1 has ended it cannot print the line about thread 2, even if thread 2 has already finished.', section: 'join', diff: 3 },
    { id: 'thr-39', type: 'single', q: 'What does exec() do when one thread of a multithreaded process calls it?', options: ['Replaces only the calling thread', 'Replaces the whole process, including all threads', 'Creates a new thread running the new program', 'Duplicates all threads'], answer: 1, explain: 'exec() works as usual: it replaces the entire running process with all its threads.', section: 'fork-exec', diff: 1 },
    { id: 'thr-40', type: 'tf', q: 'Some UNIX systems have two versions of fork(): one that duplicates all threads and one that duplicates only the calling thread.', answer: true, explain: 'From the "Semantics of fork() and exec()" slide.', section: 'fork-exec', diff: 1 },
    { id: 'thr-41', type: 'multi', q: 'Where can a signal be delivered in a multithreaded process (options from the slide)? (select all that apply)', options: ['To the thread to which the signal applies', 'To every thread in the process', 'To certain threads in the process', 'To a specific thread assigned to receive all signals of the process', 'Only to the kernel; the process never receives it'], answer: [0, 1, 2, 3], explain: 'These are the four options on the "Signal Handling (Cont.)" slide.', section: 'signals', diff: 2 },
    { id: 'thr-42', type: 'single', q: 'Who runs the default signal handler?', options: ['The kernel', 'The thread library', 'The parent process', 'A user function'], answer: 0, explain: 'Every signal has a default handler that the kernel runs; a user-defined handler can override it.', section: 'signals', diff: 1 },
    { id: 'thr-43', type: 'single', q: 'Which type of thread cancellation is the default in Pthreads?', options: ['Asynchronous', 'Deferred', 'Immediate', 'Cascading'], answer: 1, explain: 'The default type is deferred: cancellation happens only at a cancellation point.', section: 'cancellation', diff: 1 },
    { id: 'thr-44', type: 'code', q: 'The worker thread is cancelled with deferred cancellation. When does it actually terminate?', lang: 'c', code: String.raw`pthread_t tid;
pthread_create(&tid, 0, worker, NULL);
. . .
pthread_cancel(tid);      /* request cancellation */
pthread_join(tid, NULL);  /* wait for termination */`, options: ['Immediately when pthread_cancel is called', 'When it reaches a cancellation point (e.g. pthread_testcancel()), after which a cleanup handler is invoked', 'Never — deferred threads cannot be cancelled', 'Only after pthread_join'], answer: 1, explain: 'pthread_cancel only requests cancellation; with deferred cancellation it happens at a cancellation point. Immediate termination is asynchronous cancellation.', section: 'cancellation', diff: 2 },
    { id: 'thr-45', type: 'single', q: 'The target thread has cancellation disabled. What happens to a pthread_cancel request?', options: ['The thread still terminates immediately', 'The request remains pending until the thread enables cancellation', 'The request is discarded forever', 'The whole process terminates'], answer: 1, explain: 'If a thread has cancellation disabled, the cancellation remains pending until the thread enables it.', section: 'cancellation', diff: 3 },
    { id: 'thr-46', type: 'single', q: 'How does TLS differ from local variables?', options: ['TLS is visible only during one function call', 'TLS is visible across function calls and is unique to each thread', 'TLS is shared by all threads', 'TLS is stored on the stack of the call'], answer: 1, explain: 'Local variables exist during one call; TLS lives across calls, like static data, but each thread has its own copy.', section: 'tls', diff: 2 },
    { id: 'thr-47', type: 'single', q: 'An upcall in scheduler activations is…', options: ['a call from the thread library to the kernel to create a thread', 'a communication from the kernel to the upcall handler in the thread library', 'the fork system call', 'a signal from a parent to a child'], answer: 1, explain: 'Upcalls go from the kernel up to the library\'s upcall handler and let the application keep the right number of kernel threads.', section: 'sched-act', diff: 2 },
    { id: 'thr-48', type: 'single', q: 'To the thread library, an LWP appears as…', options: ['a separate process', 'a virtual processor on which a user thread can run', 'a physical CPU core', 'a signal handler'], answer: 1, explain: 'An LWP is an intermediate structure: a virtual processor attached to a kernel thread.', section: 'sched-act', diff: 2 },
    { id: 'thr-49', type: 'single', q: 'Which system call creates threads (tasks) in Linux?', options: ['fork()', 'clone()', 'pthread_spawn()', 'exec()'], answer: 1, explain: 'clone() with sharing flags lets the child task share the address space of the parent.', section: 'linux', diff: 1 },
    { id: 'thr-50', type: 'single', q: 'Which clone() flag means "The same memory space is shared"?', options: ['CLONE_FS', 'CLONE_VM', 'CLONE_SIGHAND', 'CLONE_FILES'], answer: 1, explain: 'CLONE_VM = shared memory; CLONE_FS = file-system information, CLONE_SIGHAND = signal handlers, CLONE_FILES = open files.', section: 'linux', diff: 2 },
    { id: 'thr-51', type: 'single', q: 'Which method is overridden in both class MyThread extends Thread and class MyRunnable implements Runnable?', options: ['start()', 'run()', 'join()', 'main()'], answer: 1, explain: 'The thread\'s code goes into run(); start() launches the thread and join() waits for it.', section: 'java', diff: 1 },
    { id: 'thr-52', type: 'single', q: 'S = 0.05. What is the upper limit of the speedup as N → ∞?', options: ['5', '10', '20', '95'], answer: 2, explain: 'The limit is 1/S = 1/0.05 = 20 (the last column of the table). Even with only 5% serial work, the speedup can never exceed 20.', section: 'amdahl', diff: 2 },
    { id: 'thr-53', type: 'tf', q: 'In the One-to-One model, when one thread makes a blocking system call, the other threads of the process can continue to run.', answer: true, explain: 'Each user thread has its own kernel thread, so blocking one kernel thread does not stop the others — this is why 1:1 gives more concurrency than M:1.', section: 'models', diff: 1 },
    { id: 'thr-54', type: 'single', q: 'In the PrintHello example (NUM_THREADS = 5, main ends with pthread_exit(NULL)), how many "Hello World!" lines are printed, and in which order?', options: ['5 lines, in a nondeterministic order', '5 lines, always in order 0 to 4', '1 line — only the main thread prints', '0 lines — main exits before the threads run'], answer: 0, explain: 'Each of the 5 threads prints once; the scheduler decides their order. pthread_exit in main keeps the process alive until all threads have printed.', section: 'pthreads', diff: 2 },
    { id: 'thr-55', type: 'single', q: 'Why is switching between two threads of the same process cheaper than switching between two processes?', options: ['The memory maps do not change; only the PC, registers and stack must be switched', 'Threads do not have registers', 'Threads share the same stack, so nothing needs to be saved', 'Threads never block'], answer: 0, explain: 'Threads share the address space, so there is no need to change memory maps. Each thread still has its own registers and stack, which must be saved and restored.', section: 'vs-process', diff: 2 }
  ]
});
