OS.addModule({
  id: 'processes',
  num: 3,
  group: 'theory',
  title: 'Processes',
  titleRu: 'Процессы',
  icon: '⚙',
  sources: ['3-Processes.pdf', '4bis - Recap.pdf'],
  summary: 'What a process is and how the OS manages it: memory layout, states, PCB, queues and schedulers, context switch, fork/exec/wait, termination (zombie, orphan), and IPC — shared memory, race conditions, message passing, POSIX shared memory, Mach, ALPC, pipes, sockets.',
  bridge: 'The previous module showed which services an OS offers and how programs ask for them through system calls. The most basic service of all is to run programs — many of them at the same time. This module introduces the object the OS uses to do that: the process.',
  intro: `
<p>A program on disk is only a file of instructions. To run it, the OS must give it memory, remember where it is in the code, keep its CPU registers and open files, and protect it from other programs. The bundle of all this is a <b>process</b>. Keep this mental model for the whole module: <b>a process = a program + its memory + its execution state</b>, and the OS keeps one record (the <b>PCB</b>) for each process.</p>
<p>The module follows one line of thought. First we see <i>what</i> a process is and what it looks like in memory. Then we follow its life: the <i>states</i> it goes through, how the OS <i>records</i> it (PCB), <i>queues</i> it, <i>chooses</i> it (schedulers) and <i>switches</i> to it (context switch). Next we see how processes are <i>born and die</i> (fork, exec, wait, exit). Finally, because processes are isolated from each other, we study how they can still <i>cooperate</i>: interprocess communication with shared memory, messages, pipes and sockets.</p>`,
  sections: [
    {
      id: 'concept',
      h: 'Process concept — program vs process',
      why: 'what the OS actually runs',
      lead: 'A computer runs many programs at once, but a program on disk is just a file of instructions — it cannot run by itself. The OS needs an object that holds a program while it is running. That object is the process.',
      html: `
<p>A <b>program</b> is a <b>passive</b> entity: an <b>executable file</b> stored on disk. A <b>process</b> is a <b>program in execution</b> — an <b>active</b> entity. A program becomes a process when its executable file is <b>loaded into memory</b>. You start this, for example, with GUI mouse clicks or by typing the program's name on the command line.</p>
<div class="callout analogy">Think of a recipe and the act of cooking. The recipe (program) is text in a book. Cooking (process) is the recipe being carried out: there is a current step, ingredients on the table, a timer running. Two cooks can follow the same recipe at the same time — two processes, one program.</div>
<p>This explains a fact from the slides: <b>one program can be several processes</b>. If several users run the same program, each run is a separate process with its own data and its own progress.</p>
<p>Inside one process, execution is <b>sequential</b>: instructions run one after another, and there is no parallel execution of instructions of a single process. (The Threads module will relax this rule.)</p>
<p>The table sums up the difference. Look at the last row: what makes a process "alive" is its execution state.</p>
<table class="t">
  <tr><th></th><th>Program</th><th>Process</th></tr>
  <tr><td>Nature</td><td>passive</td><td>active</td></tr>
  <tr><td>Where</td><td>executable file on disk</td><td>loaded into memory, executing on the CPU</td></tr>
  <tr><td>Execution state</td><td>none</td><td>program counter, registers, state (kept in the PCB)</td></tr>
</table>
<p>The Recap slides give the same definition — a process is an <b>instance of a program in execution</b> — and list its components:</p>
<ul>
  <li><b>Program code</b> (the <b>text section</b>);</li>
  <li><b>Data</b> — variables, heap, stack;</li>
  <li><b>Process Control Block (PCB)</b> — metadata about the process: state, program counter, registers, scheduling info, etc.</li>
</ul>
<p>Giving each process its own memory has two consequences that will come back again and again in this course:</p>
<div class="cols">
  <div class="callout key"><b>Isolation</b>: each process has its own <b>address space</b>, so one process cannot touch another's memory. This memory isolation ensures safety.</div>
  <div class="callout warn"><b>Overhead</b>: switching the CPU between processes (a context switch) is relatively <b>expensive</b>, because their memory spaces are separate.</div>
</div>`,
      takeaway: 'A program is a passive file; a process is that program running, with its own memory (text, data, heap, stack) and execution state (kept in the PCB). Separate memory gives isolation (safety) but makes switching between processes expensive.',
      exam: 'Program = passive, process = active; the components of a process (text, data, heap, stack, PCB); one program can be several processes.'
    },
    {
      id: 'memory',
      h: 'Process in memory — text, data, heap, stack',
      why: 'what a process owns',
      lead: 'We said that a process has its own memory. What exactly is in it? The memory of a process is divided into regions, because different kinds of data are created and destroyed at different times.',
      html: `
<p>Read the table thinking about <i>when</i> each kind of data exists — this is the reason why there are separate regions:</p>
<table class="t">
  <tr><th>Part</th><th>What it holds</th><th>Why it is separate</th></tr>
  <tr><td><b>Text section</b></td><td>the program code</td><td>fixed size, does not change while running</td></tr>
  <tr><td><b>Current activity</b></td><td>the <b>program counter</b> (address of the next instruction) and the processor registers</td><td>lives in the CPU, not in memory; saved in the PCB when the process stops</td></tr>
  <tr><td><b>Data section</b></td><td>global variables</td><td>exist for the whole run; size known before the program starts</td></tr>
  <tr><td><b>Stack</b></td><td>temporary data: function parameters, return addresses, local variables</td><td>created when a function is called, removed when it returns</td></tr>
  <tr><td><b>Heap</b></td><td>memory dynamically allocated during run time (e.g. with <code>malloc</code>)</td><td>size and lifetime known only while running</td></tr>
</table>
<p>The stack and the heap both change size while the program runs. So they are placed at opposite ends of the free space and <b>grow toward each other</b>: the stack grows down, the heap grows up. The free gap in the middle can then be used by whichever of the two needs it.</p>
<div data-viz="0"></div>
<p><b>Memory layout of a C program.</b> The slide shows the same idea for a real C program. From low to high memory: text → initialized data → uninitialized data → heap ↑ … ↓ stack → argc, argv. Note that the data section is split in two: globals with an initial value (<code>int y = 15;</code>) and globals without one (<code>int x;</code>). Follow the comments to see where each variable lives:</p>
<pre class="code" data-lang="c">#include &lt;stdio.h&gt;
#include &lt;stdlib.h&gt;

int x;            /* uninitialized data */
int y = 15;       /* initialized data   */

int main(int argc, char *argv[])   /* argc, argv — above the stack */
{
    int *values;  /* stack */
    int i;        /* stack */

    values = (int *)malloc(sizeof(int)*5);   /* 5 ints — in the heap */

    for (i = 0; i &lt; 5; i++)
        values[i] = i;

    return 0;
}</pre>
<div data-viz="1"></div>
<div class="callout warn">A classic trap: the pointer variable <code>values</code> itself is a local variable, so it lives on the <b>stack</b>. The memory it points to (the result of <code>malloc</code>) is in the <b>heap</b>.</div>
<p><b>Address space.</b> The <b>address space</b> of a process is the range of memory addresses that the OS assigns to it. In the slide's figure the process owns the addresses from <b>base = 300040</b> up to <b>base + limit = 420940</b>; the operating system sits at 880000…1024000. Every address the process uses must fall inside its own range:</p>
<div data-viz="2"></div>
<div class="formula">limit = 420940 − 300040 = 120900; &nbsp; a legal address a satisfies: base ≤ a &lt; base + limit</div>
<p><b>Memory management of processes</b> (Recap). In a modern system each process has:</p>
<ul>
  <li>a <b>private virtual address space</b> (code, stack, heap);</li>
  <li><b>page tables</b>, managed by the OS and by the hardware — the <b>MMU</b> (memory-management unit), which translates the addresses a process uses into physical addresses.</li>
</ul>
<p>Two consequences follow, and both matter for the rest of this module:</p>
<ul>
  <li><b>Memory protection</b> prevents one process from corrupting another process's data.</li>
  <li>For the same reason a process <b>cannot simply read another process's memory</b>. Communication between processes requires <b>Inter-Process Communication (IPC)</b>: pipes, shared memory, message queues. We come back to IPC at the end of the module.</li>
</ul>
<p>The last picture places processes in the whole system: they run in <b>user space</b>, and the kernel below them schedules them and manages their memory.</p>
<div data-viz="3"></div>`,
      viz: [
        { name: 'layers', caption: 'Process in memory: the stack and the heap grow toward each other.', props: { top: 'max', bottom: '0', layers: [
          { label: 'stack', sub: 'function parameters, return addresses, local variables · grows down ↓', tone: 'c1' },
          { label: '(free)', sub: 'stack ↓ and heap ↑ grow toward each other', tone: 'muted' },
          { label: 'heap', sub: 'dynamic memory (malloc) · grows up ↑', tone: 'c2' },
          { label: 'data', sub: 'global variables', tone: 'c3' },
          { label: 'text', sub: 'program code', tone: 'c4' }] } },
        { name: 'layers', caption: 'Memory layout of a C program (the slide example).', props: { top: 'high memory', bottom: 'low memory', layers: [
          { label: 'argc, argv', sub: 'command-line arguments', tone: 'c5' },
          { label: 'stack', sub: 'values (the pointer), i', tone: 'c1' },
          { label: '(free)', sub: '↓ ↑', tone: 'muted' },
          { label: 'heap', sub: 'malloc(sizeof(int)*5)', tone: 'c2' },
          { label: 'uninitialized data', sub: 'int x;', tone: 'c3' },
          { label: 'initialized data', sub: 'int y = 15;', tone: 'c3' },
          { label: 'text', sub: 'code of main()', tone: 'c4' }] } },
        { name: 'layers', caption: 'Address space (slide figure): the highlighted process owns 300040 (base) … 420940 (base + limit).', props: { top: '1024000', bottom: '0', layers: [
          { label: 'operating system', sub: '880000 – 1024000', tone: 'muted' },
          { label: 'process', sub: '420940 – 880000' },
          { label: 'process ← base … base + limit', sub: '300040 – 420940 (limit = 120900)', tone: 'acc' },
          { label: 'process', sub: '256000 – 300040' },
          { label: '(free)', sub: '0 – 256000', tone: 'muted' }] } },
        { name: 'layers', caption: 'Recap: processes run in user space; the kernel manages them and their memory.', props: { layers: [
          { label: 'User space', sub: 'Applications · Libraries · Daemons', tone: 'ok' },
          { label: 'Linux kernel', sub: 'Process Scheduling · Memory Management · Device I/O', tone: 'bad' },
          { label: 'Hardware', sub: 'CPU · RAM · Device', tone: 'acc' }] } }
      ],
      takeaway: 'Text = code, data = globals, heap = malloc memory (grows up), stack = function calls and locals (grows down). Each process has a private address space protected by the OS and the MMU — so sharing data between processes needs IPC.',
      exam: 'Where globals (initialized / uninitialized data), locals (stack), malloc memory (heap) and code (text) are stored; the stack and heap grow toward each other; computing limit from base and base + limit.'
    },
    {
      id: 'states',
      h: 'Process state',
      why: 'what each process is doing now',
      lead: 'A process is not always running. It may be waiting for a disk, or waiting for its turn on the CPU. The OS must know which situation each process is in, because only some of them can use the CPU right now.',
      html: `
<p>A process that waits for a keystroke would only waste the CPU; a process that has everything it needs should get the CPU as soon as possible. To tell these cases apart, the OS gives each process a <b>state</b>, and the state changes as the process executes:</p>
<table class="t">
  <tr><th>State</th><th>Meaning</th></tr>
  <tr><td><b>New</b></td><td>the process is being created</td></tr>
  <tr><td><b>Running</b></td><td>its instructions are being executed</td></tr>
  <tr><td><b>Waiting</b></td><td>the process is waiting for some event to occur (I/O completion, a signal, …)</td></tr>
  <tr><td><b>Ready</b></td><td>the process is waiting to be assigned to a processor</td></tr>
  <tr><td><b>Terminated</b></td><td>the process has finished execution</td></tr>
</table>
<p>Notice the difference between the two "waiting" situations: a <b>ready</b> process waits only for the CPU; a <b>waiting</b> process waits for something else and could not use the CPU even if it got it.</p>
<p>Each change of state is caused by a specific event. On the state diagram every arrow has a label — learn each label together with its direction:</p>
<table class="t">
  <tr><th>Transition</th><th>Event (label on the diagram)</th></tr>
  <tr><td>new → ready</td><td><b>admitted</b></td></tr>
  <tr><td>ready → running</td><td><b>scheduler dispatch</b></td></tr>
  <tr><td>running → ready</td><td><b>interrupt</b></td></tr>
  <tr><td>running → waiting</td><td><b>I/O or event wait</b></td></tr>
  <tr><td>waiting → ready</td><td><b>I/O or event completion</b></td></tr>
  <tr><td>running → terminated</td><td><b>exit</b></td></tr>
</table>
<p>Click the events in the diagram to move a process through its life:</p>
<div data-viz="0"></div>
<p>Two rules follow from the diagram, and exam questions like to test them:</p>
<div class="callout warn">There is no arrow <b>waiting → running</b>: when the I/O completes, the process goes to <b>ready</b>, and only the scheduler can give it the CPU. There is also no arrow <b>ready → waiting</b>: a process can start waiting only by asking for I/O, and to ask it must be running. On one core <b>only one process is running</b> at any moment; any number of processes can be ready or waiting.</div>`,
      viz: [{ name: 'procStates', caption: 'Process state diagram: click the events to move the process.', props: {} }],
      takeaway: 'Five states: new, ready, running, waiting, terminated. Ready ↔ running is controlled by the scheduler (dispatch / interrupt); running → waiting → ready is the I/O path. A waiting process must go through ready before it runs again.',
      exam: 'Name the 5 states and the transition labels; impossible transitions (waiting → running, ready → waiting).'
    },
    {
      id: 'pcb',
      h: 'Process Control Block (PCB) and task_struct',
      why: 'how the OS remembers a process',
      lead: 'When a running process is stopped (for example by an interrupt), the next process will overwrite the CPU registers. If the OS did not save them somewhere, the first process could never continue. The PCB is that "somewhere" — and it also holds everything else the OS needs to manage the process.',
      html: String.raw`
<p>The <b>Process Control Block (PCB)</b>, also called <b>task control block</b>, is a data structure the OS uses to manage and store all the information about one specific process. There is one PCB per process. It serves two needs:</p>
<ol>
  <li>to <b>resume</b> a stopped process exactly where it left off — this needs its state, program counter and registers;</li>
  <li>to <b>manage</b> the process — this needs its priority, memory, open files and used time.</li>
</ol>
<p>Read the fields with these two needs in mind: the first three rows are what you need to resume, the rest are what you need to manage.</p>
<table class="t">
  <tr><th>Field</th><th>Contents</th></tr>
  <tr><td><b>Process state</b></td><td>running, waiting, etc.</td></tr>
  <tr><td><b>Program counter</b></td><td>location of the instruction to execute next</td></tr>
  <tr><td><b>CPU registers</b></td><td>contents of all process-centric registers</td></tr>
  <tr><td><b>CPU scheduling information</b></td><td>priorities, scheduling queue pointers</td></tr>
  <tr><td><b>Memory-management information</b></td><td>memory allocated to the process</td></tr>
  <tr><td><b>Accounting information</b></td><td>CPU used, clock time elapsed since start, time limits</td></tr>
  <tr><td><b>I/O status information</b></td><td>I/O devices allocated to the process, list of open files</td></tr>
</table>
<div data-viz="0"></div>
<div class="callout key">PCBs are stored in a specially reserved part of memory for the OS, called <b>kernel space</b>. RAM is logically divided into <b>kernel space</b> (PCB1, PCB2, …, PCBn) and <b>user space</b>. This is a protection decision: a process must not be able to edit its own PCB — for example, to raise its priority or enlarge its memory limits.</div>
<p><b>Process representation in Linux.</b> In Linux the PCB is the C structure <code>task_struct</code>. Each line below matches a PCB field from the table (pid and state, scheduling info, family links, open files, memory):</p>
<pre class="code" data-lang="c">pid_t pid;                    /* process identifier */
long state;                   /* state of the process */
unsigned int time_slice;      /* scheduling information */
struct task_struct *parent;   /* this process's parent */
struct list_head children;    /* this process's children */
struct files_struct *files;   /* list of open files */
struct mm_struct *mm;         /* address space of this process */</pre>
<p>All <code>task_struct</code>s are linked in a list, and the kernel pointer <b>current</b> points to the process that is running now.</p>
<p><b>Threads — a preview.</b> So far a process has a single <b>thread of execution</b>: one program counter, so only one place in the code runs at a time. Now imagine a process with <b>multiple program counters</b>: multiple locations could execute at once — multiple <b>threads</b> of control. The PCB would then need storage for each thread's details (several PCs, several register sets). The Threads module develops this idea.</p>
<p>The Recap block diagram puts the pieces together: the CPU executes Process A; the process has its PCB (state, registers, scheduling info) and its memory (stack, heap, data, code/text segment); each of its threads has its own <b>stack</b> and <b>PC</b>.</p>
<div data-viz="1"></div>`,
      viz: [
        { name: 'layers', caption: 'The PCB (figure from the slide).', props: { layers: [
          { label: 'process state', tone: 'acc' }, { label: 'process number (pid)' }, { label: 'program counter', tone: 'acc' },
          { label: 'registers', tone: 'c2' }, { label: 'memory limits' }, { label: 'list of open files' }, { label: '…', tone: 'muted' }] } },
        { name: 'graph', caption: 'How the OS manages processes and threads (Recap block diagram).', props: { w: 600, h: 240,
          nodes: [
            { id: 'cpu', label: 'CPU', x: 70, y: 120, tone: 'acc' },
            { id: 'p', label: 'Process A', sub: 'PCB + Stack, Heap, Data, Code', x: 280, y: 120, w: 200, h: 60, tone: 'ok' },
            { id: 't1', label: 'Thread 1', sub: 'Stack, PC', x: 510, y: 40, tone: 'warn' },
            { id: 't2', label: 'Thread 2', sub: 'Stack, PC', x: 510, y: 120, tone: 'c5' },
            { id: 't3', label: 'Thread 3', sub: 'Stack, PC', x: 510, y: 200, tone: 'c3' }],
          edges: [{ from: 'cpu', to: 'p' }, { from: 'p', to: 't1' }, { from: 'p', to: 't2' }, { from: 'p', to: 't3' }] } }
      ],
      takeaway: 'The PCB (task_struct in Linux) is the OS record of a process: state, PC, registers, scheduling, memory, accounting and I/O information. It lives in kernel space and is what makes it possible to stop a process and resume it later.',
      exam: 'List the PCB fields; PCBs are stored in kernel space; in Linux the PCB is task_struct.'
    },
    {
      id: 'scheduling',
      h: 'Process scheduling — ready and wait queues',
      why: 'how the OS organizes processes',
      lead: 'Now the OS has a PCB for every process. With dozens of processes in memory, how does it keep track of which ones are ready and which ones are waiting for something? It puts their PCBs into queues.',
      html: `
<p>The <b>process scheduler</b> selects, among the available processes, the next one to execute on a CPU core. Its goal is to <b>maximize CPU use</b>: switch processes onto the core quickly, so that the core is never idle. To find candidates fast, it maintains <b>scheduling queues</b>:</p>
<ul>
  <li><b>Ready queue</b> — the set of all processes residing in main memory that are ready and waiting to execute;</li>
  <li><b>Wait queues</b> — sets of processes waiting for an event (e.g. I/O). There is a separate wait queue for each kind of event.</li>
</ul>
<p>Processes <b>migrate</b> among these queues as their state changes: a process that starts an I/O operation leaves the CPU and joins a wait queue; when the I/O completes it moves to the ready queue.</p>
<p>Each queue is a <b>linked list of PCBs</b>. A <b>queue header</b> holds a pointer to the first PCB (<b>head</b>) and to the last PCB (<b>tail</b>), and each PCB points to the next one. The two pictures show the slide example — note that a queue contains PCBs, not the processes' memory:</p>
<div data-viz="0"></div>
<div data-viz="1"></div>
<p><b>Representation of process scheduling</b> (the queueing diagram). The next figure shows the whole cycle in terms of queues. A process waits in the ready queue, gets the CPU, and then leaves the CPU for one of four reasons:</p>
<ul>
  <li>it makes an <b>I/O request</b> → I/O wait queue → the I/O is performed → back to the ready queue;</li>
  <li>its <b>time slice expired</b> → straight back to the ready queue;</li>
  <li>it <b>creates a child process</b> and waits for it → child termination wait queue → child terminates → ready queue;</li>
  <li>it <b>waits for an interrupt</b> → interrupt wait queue → interrupt occurs → ready queue.</li>
</ul>
<p>Follow any path in the diagram: every one of them ends in the <b>ready queue</b>. The only way out of the cycle is <b>exit</b>.</p>
<div data-viz="2"></div>`,
      viz: [
        { name: 'flow', caption: 'Ready queue: header → PCB7 → PCB2.', props: { dir: 'h', steps: [
          { label: 'ready queue', sub: 'head · tail', tone: 'acc' }, { label: 'PCB 7', sub: 'registers …' }, { label: 'PCB 2', sub: 'registers …' }, { label: 'NULL', tone: 'muted' }] } },
        { name: 'flow', caption: 'Wait queue: header → PCB3 → PCB14 → PCB6.', props: { dir: 'h', steps: [
          { label: 'wait queue', sub: 'head · tail', tone: 'warn' }, { label: 'PCB 3' }, { label: 'PCB 14' }, { label: 'PCB 6' }, { label: 'NULL', tone: 'muted' }] } },
        { name: 'graph', caption: 'Queueing diagram: every path brings the process back to the ready queue.', props: { w: 660, h: 380,
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
      takeaway: 'The OS keeps PCBs in linked-list queues: one ready queue and several wait queues (one per kind of event). A process migrates between them; every path leads back to the ready queue until the process exits.',
      exam: 'What the ready queue and the wait queues are; how a queue is implemented (header with head/tail, linked PCBs); the four reasons a process leaves the CPU in the queueing diagram.'
    },
    {
      id: 'schedulers',
      h: 'Schedulers — long-term and short-term',
      why: 'two different decisions',
      lead: 'Two different decisions are hidden in the queueing picture: which jobs are allowed into memory at all, and which ready process gets the CPU next. Two different schedulers take them, at very different speeds.',
      html: `
<p>The table compares the two. The key row is "how often": it explains why one of them may be slow while the other must be fast.</p>
<table class="t">
  <tr><th></th><th><b>Long-term scheduler</b> (job scheduler)</th><th><b>Short-term scheduler</b> (CPU scheduler)</th></tr>
  <tr><td>What it does</td><td>selects which processes from the <b>job pool on disk</b> are brought <b>into the ready queue</b></td><td>selects which process should be executed next and <b>allocates the CPU</b> to it</td></tr>
  <tr><td>How often</td><td>very infrequently (seconds, minutes) → <b>may be slow</b></td><td>very frequently (milliseconds) → <b>must be fast</b></td></tr>
  <tr><td>Controls</td><td>the <b>degree of multiprogramming</b> (how many processes are in memory)</td><td>who is on the CPU right now</td></tr>
</table>
<p>Why must the short-term scheduler be fast? It runs every few milliseconds. If each decision took, say, as long as the process then runs, half of the CPU time would be spent deciding instead of working.</p>
<div data-viz="0"></div>
<p>What should the long-term scheduler choose? Processes differ in how they use the CPU. Recall the <b>CPU burst</b> — a stretch of time in which a process computes without waiting:</p>
<ul>
  <li>An <b>I/O-bound process</b> spends more time doing I/O than computing: <b>many short CPU bursts</b>.</li>
  <li>A <b>CPU-bound process</b> spends more time computing: <b>very long CPU bursts</b>.</li>
</ul>
<div class="callout key">The long-term scheduler should select a good <b>process mix</b> of I/O-bound and CPU-bound processes, to keep both the ready queue and the I/O wait queues busy. If all processes were I/O-bound, the ready queue would be almost empty and the CPU idle; if all were CPU-bound, the I/O devices would be idle.</div>
<div class="callout note"><b>Medium-term scheduler</b> (Silberschatz; also in the course cheat sheet): it performs <b>swapping</b> — it temporarily removes a process from memory to disk and later brings it back. This reduces the degree of multiprogramming when memory is short.</div>`,
      viz: [{ name: 'flow', caption: 'Where each scheduler works.', props: { dir: 'h', steps: [
        { label: 'Job pool', sub: 'hard disk', tone: 'muted' },
        { label: 'Long-term', sub: 'job scheduler · rarely', tone: 'warn' },
        { label: 'Ready queue', sub: 'RAM', tone: 'acc' },
        { label: 'Short-term', sub: 'CPU scheduler · often', tone: 'warn' },
        { label: 'CPU', tone: 'ok' }] } }],
      takeaway: 'Long-term scheduler: which jobs enter memory — runs rarely, may be slow, controls the degree of multiprogramming and should choose a good mix of I/O-bound and CPU-bound processes. Short-term scheduler: which ready process runs next — runs every few ms, must be fast (the topic of the CPU Scheduling module).',
      exam: 'Long-term vs short-term: what each selects, how often it runs, which one controls the degree of multiprogramming; I/O-bound vs CPU-bound.'
    },
    {
      id: 'context-switch',
      h: 'Context switch',
      why: 'moving the CPU between processes',
      lead: 'Once the short-term scheduler has chosen a new process, the CPU must actually be moved from the old process to the new one. This operation — the context switch — is where the PCB does its job.',
      html: `
<p>A <b>context switch</b> occurs when the CPU switches from one process to another: the system must <b>save the state</b> of the old process and <b>load the saved state</b> of the new one. The <b>context</b> of a process is represented in its <b>PCB</b> (registers, PC, state, memory information).</p>
<p>The slide figure shows the steps for two processes, P0 and P1:</p>
<ol class="steps">
  <li>P0 is executing. An <b>interrupt or system call</b> occurs and the OS takes control.</li>
  <li>The OS <b>saves the state</b> of P0 <b>into PCB0</b>.</li>
  <li>The OS <b>reloads the state from PCB1</b>, and P1 executes. Meanwhile P0 is <b>idle</b>.</li>
  <li>Another interrupt or system call: the OS <b>saves the state into PCB1</b> and <b>reloads the state from PCB0</b>. P0 continues exactly where it stopped.</li>
</ol>
<div data-viz="0"></div>
<p>Look at the OS row in the timeline: during those slots neither P0 nor P1 runs. This gives the main properties of a context switch:</p>
<ul>
  <li>Context-switch time is <b>pure overhead</b>: the system does no useful work while switching.</li>
  <li>The more complex the OS and the PCB, the longer the context switch (more data to save and load).</li>
  <li>The time depends on <b>hardware support</b>: some CPUs provide <b>multiple sets of registers</b>, so several contexts are loaded at once and a switch only selects another register set.</li>
  <li><b>Hidden cost on memory</b> (asked in the written quiz): after a switch the caches are full of the <i>old</i> process's data, so the new process first suffers many <b>cache misses</b>; and the <b>TLB</b> (the cache of address translations, see the Main Memory module) must be flushed or tagged with address-space IDs. So a context switch <b>does</b> impact memory access speed — it does not copy memory to disk and does not erase RAM.</li>
</ul>
<p>Because every switch costs time, the OS cannot switch as often as it likes — a trade-off that the CPU Scheduling module meets again when choosing the time quantum.</p>`,
      viz: [{ name: 'timeline', caption: 'CPU switch from process to process: the OS saves one PCB and loads the other.', props: { max: 13, rows: [
        { label: 'P0', segs: [{ from: 0, to: 3, label: 'executing', tone: 'acc' }, { from: 3, to: 10, label: 'idle', tone: 'muted' }, { from: 10, to: 13, label: 'executing', tone: 'acc' }] },
        { label: 'OS', segs: [{ from: 3, to: 4, label: 'save PCB0', tone: 'warn' }, { from: 4, to: 5, label: 'load PCB1', tone: 'warn' }, { from: 8, to: 9, label: 'save PCB1', tone: 'warn' }, { from: 9, to: 10, label: 'load PCB0', tone: 'warn' }] },
        { label: 'P1', segs: [{ from: 0, to: 5, label: 'idle', tone: 'muted' }, { from: 5, to: 8, label: 'executing', tone: 'ok' }, { from: 8, to: 13, label: 'idle', tone: 'muted' }] }],
        marks: [{ t: 3, label: 'interrupt / syscall' }, { t: 8, label: 'interrupt / syscall' }] } }],
      takeaway: 'A context switch saves the old process state into its PCB and loads the new process state from its PCB. It is pure overhead; its cost grows with the complexity of the OS and PCB and shrinks with hardware support (multiple register sets).',
      exam: 'What is saved and where (state → PCB); why a context switch is overhead; what its duration depends on.'
    },
    {
      id: 'mobile',
      h: 'Multitasking in mobile systems',
      why: 'a real case: limited devices',
      lead: 'Running many processes and switching between them costs memory, CPU time and battery. Early mobile systems with small screens and little memory made a simpler choice, and modern ones relax it in different ways.',
      html: `
<p>Some mobile systems (for example, <b>early versions of iOS</b>) allowed only <b>one process to run</b>; all the others were <b>suspended</b>. Because of limited <b>screen real estate</b> (a small screen shows one app at a time) and user-interface limits, iOS provides for:</p>
<ul>
  <li>a single <b>foreground</b> process — the one controlled via the user interface;</li>
  <li>multiple <b>background</b> processes — in memory and running, but not on the display, and <b>with limits</b>.</li>
</ul>
<p>The limits include: a single short task, receiving notification of events, and specific long-running tasks such as <b>audio playback</b>.</p>
<p><b>Android</b> runs foreground and background processes with <b>fewer limits</b>. A background process uses a <b>service</b> to perform its tasks:</p>
<ul>
  <li>the service can keep running <b>even if the background process is suspended</b>;</li>
  <li>a service has <b>no user interface</b> and uses little memory.</li>
</ul>
<p>So the two systems solve the same problem differently: iOS restricts <i>what</i> a background process may do, while Android moves background work into a small component without a UI that can live on when the app itself is suspended.</p>
<p>So far we have looked at processes that already exist. The next question is how they are created and how they end.</p>`,
      takeaway: 'Mobile OSes separate one foreground process (the one on screen) from background processes. Early iOS allowed only limited background tasks (short task, notifications, audio); Android lets a background process use a service — no UI, little memory, keeps running even if the process is suspended.'
    },
    {
      id: 'creation',
      h: 'Process creation — the process tree',
      why: 'where processes come from',
      lead: 'We have seen how the OS manages processes that already exist. But where do they come from? Every process (except the very first) is created by another process.',
      html: `
<p>The system must provide mechanisms for two operations on processes: <b>process creation</b> and <b>process termination</b>.</p>
<p>A process that creates another one is its <b>parent</b>; the new process is the <b>child</b>. Children can create their own children, so processes form a <b>tree of processes</b>. Generally each process is identified and managed via a <b>process identifier (pid)</b>, a unique integer.</p>
<p>The slide shows a Linux process tree. At the root is <b>systemd</b> (pid 1), the first user process started at boot; every other process descends from it. Follow one branch: systemd → logind → bash → the commands typed in that shell (ps, vim). The <code>task_struct</code> from the PCB section stores exactly these links: a <code>parent</code> pointer and a <code>children</code> list.</p>
<div data-viz="0"></div>
<p>When a parent creates a child, three design questions must be answered: what do they share, who runs while the child runs, and which program does the child run? The slide lists the possible answers:</p>
<table class="t">
  <tr><th>Question</th><th>Options</th></tr>
  <tr><td><b>Resource sharing</b></td><td>parent and children share <b>all</b> resources · children share a <b>subset</b> of the parent's resources · parent and child share <b>no</b> resources</td></tr>
  <tr><td><b>Execution</b></td><td>parent and children execute <b>concurrently</b> · the parent <b>waits</b> until the children terminate</td></tr>
  <tr><td><b>Address space</b></td><td>the child is a <b>duplicate</b> of the parent (<code>fork()</code>) · the child has a <b>new program</b> loaded into it (<code>exec()</code>)</td></tr>
</table>
<p>UNIX answers the last question with two separate system calls: <code>fork()</code> duplicates the parent, and <code>exec()</code> loads a new program. The next two sections look at each of them.</p>`,
      viz: [{ name: 'tree', caption: 'A tree of processes in Linux (from the slide).', props: { mono: true, root: { label: 'systemd', note: 'pid = 1', tone: 'acc', children: [
        { label: 'logind', note: 'pid = 8415', children: [
          { label: 'bash', note: 'pid = 8416', children: [{ label: 'ps', note: 'pid = 9298' }, { label: 'vim', note: 'pid = 9204' }] }] },
        { label: 'python', note: 'pid = 2808' },
        { label: 'sshd', note: 'pid = 3028', children: [
          { label: 'sshd', note: 'pid = 3610', children: [{ label: 'tcsh', note: 'pid = 4005' }] }] }] } } }],
      takeaway: 'Processes form a tree (root: systemd/init, pid 1), each identified by a pid. Creation options: share all / some / no resources; run concurrently or the parent waits; the child is a duplicate (fork) or loads a new program (exec).',
      exam: 'Resource sharing and execution options; the root of the process tree (systemd/init, pid 1).'
    },
    {
      id: 'fork',
      h: 'fork() — creating a process in UNIX',
      why: 'copy the running process',
      lead: 'In UNIX a new process is created in a surprisingly simple way: the running process is copied, and the copy is the child. The only question is how each copy knows which one it is.',
      html: String.raw`
<p><code>unistd.h</code> is the C/C++ header file that gives access to the <b>POSIX operating system API</b> (fork, exec, getpid, pipe, …). The system call <code>fork()</code> creates a <b>new process</b>:</p>
<ul>
  <li>After the child is created, <b>both</b> processes execute the <b>next instruction after fork()</b>.</li>
  <li>The child uses the same CPU registers and open files as the parent — it gets a copy of them, so it starts with the same values and the same open files.</li>
</ul>
<p>Since both copies continue from the same point in the same code, they need a way to tell themselves apart. That is the job of the <b>return value</b> of fork():</p>
<table class="t">
  <tr><th>fork() returns</th><th>Meaning</th></tr>
  <tr><td><b>&lt; 0</b> (negative)</td><td>creation of the child process failed</td></tr>
  <tr><td><b>0</b></td><td>we are in the <b>newly created child</b></td></tr>
  <tr><td><b>&gt; 0</b> (positive)</td><td>we are in the <b>parent</b>; the value is the <b>PID of the new child</b></td></tr>
</table>
<div class="callout key">fork() is called <b>once</b> but returns <b>twice</b>: once in the parent (with the child's PID) and once in the child (with 0).</div>
<p><b>C program forking example.</b> Everything after the fork() call runs in both processes:</p>
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
<p>The line is printed <b>2 times</b> — once by the parent and once by the child — with different pids.</p>
<p><b>How many times is hello printed?</b> Now there are three forks in a row. The trick is to count processes, not calls: every fork() is executed by <i>every</i> process that reaches it, so each fork doubles the number of processes.</p>
<pre class="code" data-lang="c">int main()
{
    fork();
    fork();
    fork();
    printf("Hello world!, process_id(pid) = %d \n", getpid());
    return 0;
}</pre>
<div class="formula">number of prints = number of processes = 2<sup>n</sup>, where n = number of fork() calls → 2<sup>3</sup> = <b>8</b> (1 original + 7 new)</div>
<div data-viz="0"></div>
<p><b>Forking example 2.</b> Now the return value is used to give the parent and the child different work:</p>
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
<p>Both lines are printed, but the <b>order is not defined</b>: after fork there are two independent processes, and the scheduler decides which one runs first.</p>
<p><b>What is the output of the following program?</b> This example tests the most important property of fork: the child gets a <i>copy</i> of the data, not shared data.</p>
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
<div class="callout key">Parent and child run concurrently, so there are <b>two possible outputs</b>: "Parent has x = 0 / Child has x = 2" or "Child has x = 2 / Parent has x = 0". Changing the variable in one process <b>does not affect</b> the other: each process has its own copy of the data.</div>
<div data-viz="1"></div>
<div class="callout warn">The 2<sup>n</sup> formula works only for <b>n consecutive, unconditional</b> fork() calls. If fork() is inside an if/else or in an expression with &amp;&amp; / ||, draw the tree: each fork() doubles only the processes that actually reach it.</div>`,
      viz: [
        { name: 'forkTree', caption: 'n consecutive fork() calls → 2ⁿ processes.', props: { n: 3, max: 5 } },
        { name: 'stepper', caption: 'Tracing the x example: parent and child have separate copies of x.', props: { lang: 'c', code: String.raw`int main()
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
          { line: 3, note: 'Only one process so far (the future parent); x = 1.', vars: { 'parent: x': 1 } },
          { line: 4, note: 'fork(): now there are two processes, each with ITS OWN copy of x = 1. The parent gets the child\'s PID, the child gets 0.', vars: { 'parent: x': 1, 'parent: p': 'PID of child', 'child: x': 1, 'child: p': 0 } },
          { line: [9, 10], note: 'Child: p == 0 → ++x changes only the child\'s copy.', vars: { 'parent: x': 1, 'child: x': 2 }, out: 'Child has x = 2' },
          { line: [11, 12], note: 'Parent: p > 0 → --x changes only the parent\'s copy.', vars: { 'parent: x': 0, 'child: x': 2 }, out: 'Parent has x = 0' },
          { line: 13, note: 'Both processes finish. The order of the two output lines depends on the scheduler — the reverse order is also possible.', vars: { 'parent: x': 0, 'child: x': 2 } }] } }
      ],
      takeaway: 'fork() creates a copy of the calling process; both continue after the call. It returns 0 in the child, the child\'s PID in the parent, and a negative value on error. n unconditional forks give 2ⁿ processes, and parent and child have separate copies of every variable.',
      exam: 'The values returned by fork(); "how many times is it printed" (2ⁿ, or a tree for conditional forks); the output of fork programs that modify a variable.'
    },
    {
      id: 'exec-wait',
      h: 'exec() and wait()',
      why: 'run a new program, wait for it',
      lead: 'fork() gives us a second copy of the same program. But usually we want the child to run a different program — like a shell starting ls. That is the job of exec(); and wait() lets the parent know when the child is done.',
      html: String.raw`
<ul>
  <li><code>exec()</code> is a system call used after <code>fork()</code> to <b>replace the process's memory space with a new program</b>.</li>
  <li>The parent calls <code>wait()</code> to wait for the child to terminate.</li>
</ul>
<p>Why two calls instead of one "create a process running program X"? Because the moment between fork() and exec() is useful: the child is still running the parent's code, so it can prepare its own environment first — for example close or redirect files (in the Pipes section a child closes pipe ends exactly in this way). And fork() alone is useful when parent and child should run the same program, as in the previous examples.</p>
<p><b>C program forking separate process</b> — the classic pattern: fork, exec in the child, wait in the parent:</p>
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
<div class="callout key">The child replaces itself with the program <code>ls</code>; the parent waits in <code>wait()</code>. So the list of files is printed first, then "Child Complete". Code after a successful <code>exec</code> in the child <b>never runs</b>: the old program is gone, so there is nowhere to return to.</div>
<div data-viz="0"></div>
<p><b>C program wait example.</b> <code>wait()</code> does more than block: it tells the parent <i>which</i> child ended and <i>how</i>. The status is decoded with macros:</p>
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
<p>The table lists what each call and macro gives. The two pairs of macros answer one question: did the child end normally, or was it killed by a signal?</p>
<table class="t">
  <tr><th>Call / macro</th><th>Meaning</th></tr>
  <tr><td><code>wait(&amp;status)</code></td><td>blocks the parent until a child terminates; returns the <b>pid</b> of the terminated child and stores its status in <code>status</code></td></tr>
  <tr><td><code>WIFEXITED(status)</code> / <code>WEXITSTATUS(status)</code></td><td>the child ended normally (exit or return from main) / its exit code</td></tr>
  <tr><td><code>WIFSIGNALED(status)</code> / <code>WTERMSIG(status)</code></td><td>the child was killed by a signal / the signal number (e.g. 9 after <code>kill -9</code>)</td></tr>
</table>
<div data-viz="1"></div>`,
      viz: [
        { name: 'graph', caption: 'fork() → exec() in the child, wait() in the parent.', props: { w: 620, h: 220,
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
        { name: 'stepper', caption: 'Wait example: what is printed, and when.', props: { lang: 'c', code: String.raw`int main()
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
          { line: 4, note: 'fork(): the parent gets the child\'s PID (say 1234), the child gets 0.', vars: { 'parent: pid': 1234, 'child: pid': 0 } },
          { line: 6, note: 'The child prints its first line (its order relative to the parent is not defined).', out: 'I am the child.' },
          { line: 11, note: 'The parent prints the child\'s PID.', out: 'I am the parent, the child is 1234.' },
          { line: [7, 12], note: 'The child sleeps for 10 s; the parent is blocked in wait() (state: waiting).', vars: { 'parent': 'waiting', 'child': 'sleep(10)' } },
          { line: 8, note: 'The child wakes up, prints, and reaches return 0 → exit(0) → terminated.', vars: { 'parent': 'waiting', 'child': 'terminated' }, out: 'I am the child, 10 seconds later.' },
          { line: [12, 13, 14, 15], note: 'wait() returns 1234; WIFEXITED is true and WEXITSTATUS = 0.', vars: { 'parent': 'running', 'parent: pid': 1234, status: 'exit(0)' }, out: 'End of process 1234: The process ended with exit(0).' },
          { line: [17, 18], note: 'Alternative: if someone ran kill -9 1234 during the sleep, WIFEXITED would be false, WIFSIGNALED true, WTERMSIG = 9, and the last line would be "End of process 1234: The process ended with kill -9."' }] } }
      ],
      takeaway: 'exec() replaces the program of the calling process; on success it never returns, so the code after it does not run. wait() blocks the parent until a child ends and returns that child\'s pid; the status tells whether it exited (WIFEXITED / WEXITSTATUS) or was killed by a signal (WIFSIGNALED / WTERMSIG).',
      exam: 'What exec() does and why the code after it does not run; what wait() returns; the order of output in a fork + exec + wait program.'
    },
    {
      id: 'windows',
      h: 'Creating a process with the Windows API',
      why: 'the same job in one call',
      lead: 'Windows does not copy the parent. It creates the child and loads the new program in a single call. Comparing it with fork + exec shows what each design gains and loses.',
      html: String.raw`
<p>In the Windows API a process is created with <code>CreateProcess()</code>. It takes <b>10 parameters</b>; here the second one names the program to run (<code>mspaint.exe</code>). The structure <code>STARTUPINFO</code> describes properties of the new process, and <code>PROCESS_INFORMATION</code> receives handles to the new process and to its first thread. A <b>handle</b> is a reference that Windows gives a program to an OS object — here, the role a pid plays in UNIX.</p>
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
<p>The table maps each UNIX call to its Windows counterpart:</p>
<table class="t">
  <tr><th>UNIX</th><th>Windows</th></tr>
  <tr><td><code>fork()</code> + <code>exec()</code></td><td><code>CreateProcess()</code> — creates the process <b>and loads the given program into it</b> (here mspaint.exe) in one call; 10 parameters</td></tr>
  <tr><td><code>wait()</code></td><td><code>WaitForSingleObject(pi.hProcess, INFINITE)</code></td></tr>
  <tr><td>pid</td><td>handles in <code>PROCESS_INFORMATION</code> (<code>hProcess</code>, <code>hThread</code>), released with <code>CloseHandle()</code></td></tr>
</table>
<p>The conclusion: Windows merges fork and exec into one call. This is simpler for the common case, but there is no moment in which the child runs the parent's code to prepare itself — everything must be described through the parameters (inheritance of handles, environment, directory, flags).</p>`,
      takeaway: 'CreateProcess() ≈ fork() + exec() in one call: it creates the process and loads the program. WaitForSingleObject() ≈ wait(). Processes are referred to by handles, released with CloseHandle().',
      exam: 'CreateProcess ≈ fork + exec; WaitForSingleObject ≈ wait.'
    },
    {
      id: 'termination',
      h: 'Process termination — exit, abort, zombie, orphan',
      why: 'how processes end',
      lead: 'Creating processes is only half of the story. When a process ends, its resources must be returned and its parent must learn the result. Two strange situations, zombie and orphan, appear when parent and child do not finish in the expected order.',
      html: `
<p><b>Normal termination.</b> A process executes its last statement and then asks the OS to delete it with the <code>exit()</code> system call. Two things happen:</p>
<ul>
  <li>status data is returned from the child to the parent (via <code>wait()</code>);</li>
  <li>the process's resources are <b>deallocated by the OS</b>.</li>
</ul>
<p><b>Termination by the parent.</b> A parent may terminate the execution of its children with the <code>abort()</code> system call. Some reasons for doing so:</p>
<ul>
  <li>the child has <b>exceeded its allocated resources</b>;</li>
  <li>the task assigned to the child is <b>no longer required</b>;</li>
  <li>the parent is exiting, and the OS <b>does not allow a child to continue</b> if its parent terminates.</li>
</ul>
<p><b>Cascading termination.</b> The last reason leads to a rule of some operating systems: a child may not exist if its parent has terminated. So if a process terminates, all its children must be terminated too — and their children, and so on (children, grandchildren, etc.). This termination is initiated by the <b>operating system</b>.</p>
<p><b>Waiting for a child.</b> The parent waits for the termination of a child with <code>pid = wait(&amp;status);</code>. The call returns the status information and the <b>pid</b> of the terminated process.</p>
<p>Now think about timing. The child's exit status must be kept <i>somewhere</i> until the parent calls wait(), otherwise the parent could never read it. And if the parent dies first, the child is left without anyone to wait for it. These two situations have names:</p>
<table class="t">
  <tr><th></th><th><b>Zombie</b></th><th><b>Orphan</b></th></tr>
  <tr><td>Situation</td><td>the child has terminated, but <b>no parent is waiting</b> — the parent has not called wait() yet</td><td>the <b>parent terminated without calling wait()</b>, while the child is still running</td></tr>
  <tr><td>What happens</td><td>the child's record (pid, exit status) is kept until the parent collects it; its memory and files are already freed</td><td>the orphan is automatically <b>adopted</b> by the special system process <b>init</b>, which will wait() for it</td></tr>
</table>
<div class="callout note">The slide says "init (pid=0)". In Linux, init/systemd has <b>pid = 1</b> (see the process tree); pid 0 belongs to a special kernel process.</div>
<p>One case remains: what happens when the <i>system</i>, not the parent, decides that a process must die? The next section shows two real systems facing this question.</p>`,
      takeaway: 'exit() ends a process, frees its resources and passes a status to the parent via wait(). abort() lets a parent kill a child. Cascading termination = the OS kills all descendants. Zombie = child finished, parent has not called wait() yet. Orphan = parent finished without wait(); init adopts it.',
      exam: 'Zombie vs orphan; who adopts an orphan; reasons for abort(); cascading termination (initiated by the OS).'
    },
    {
      id: 'android-chrome',
      h: 'Android importance hierarchy and Chrome multiprocess architecture',
      why: 'processes in real systems',
      lead: 'Two real systems show why process management matters in practice: Android must decide which processes to kill when memory runs out, and Chrome splits itself into several processes so that one bad web page cannot crash everything.',
      html: `
<p><b>Android process importance hierarchy.</b> Mobile operating systems often have to terminate processes to reclaim system resources such as memory. Android ranks processes by importance, from most to least important:</p>
<div data-viz="0"></div>
<p>Read the list from the bottom up: an <b>empty</b> process is the cheapest to lose, a <b>foreground</b> process (the app the user is working with) the most expensive.</p>
<div class="callout key">When memory is short, Android begins terminating the <b>least important</b> processes first (empty → background → …).</div>
<p><b>Multiprocess architecture — Chrome browser.</b> Many web browsers ran as a <b>single process</b> (some still do). The problem: if one web site causes trouble, the entire browser can hang or crash. Google Chrome is <b>multiprocess</b>, with 3 different types of processes:</p>
<table class="t">
  <tr><th>Process</th><th>Job</th></tr>
  <tr><td><b>Browser</b></td><td>manages the user interface, disk and network I/O</td></tr>
  <tr><td><b>Renderer</b></td><td>renders web pages, deals with HTML and JavaScript. <b>A new renderer is created for each website opened</b>. It runs in a <b>sandbox</b> that restricts disk and network I/O, minimizing the effect of security exploits</td></tr>
  <tr><td><b>Plug-in</b></td><td>one process for each type of plug-in</td></tr>
</table>
<p>This is the isolation of processes (from the first section) used on purpose. A <b>sandbox</b> is a restricted environment: the renderer handles untrusted web content, so even if an attack succeeds inside it, the attacker cannot freely read the disk or use the network. A crash in one renderer stays inside that one process.</p>
<p>But isolation has a price. The browser process and its renderers must still exchange data: the page to draw, the user's clicks, the downloaded files. Isolated processes that must work together need a way to communicate — the topic of the rest of this module.</p>`,
      viz: [{ name: 'layers', caption: 'Android: from the most important to the least important process.', props: { top: 'most important', bottom: 'least important — terminated first', layers: [
        { label: 'Foreground process', tone: 'ok' }, { label: 'Visible process', tone: 'acc' }, { label: 'Service process', tone: 'c2' },
        { label: 'Background process', tone: 'warn' }, { label: 'Empty process', tone: 'bad' }] } }],
      takeaway: 'Android kills processes starting from the least important (empty → background → service → visible → foreground). Chrome runs a browser process, one sandboxed renderer per website and plug-in processes, so one failing site cannot bring down the whole browser.',
      exam: 'The order of the 5 Android levels and which is killed first; the 3 Chrome process types and why the renderer runs in a sandbox.'
    },
    {
      id: 'ipc',
      h: 'Interprocess communication (IPC) — two models',
      why: 'letting isolated processes cooperate',
      lead: 'Processes are isolated by design, yet many of them must work together — like Chrome\'s browser and renderers. Interprocess communication (IPC) is the set of mechanisms that lets isolated processes exchange data.',
      html: `
<p>Processes within a system may be <b>independent</b> — they cannot affect or be affected by other processes — or <b>cooperating</b>: a cooperating process can affect or be affected by other processes, including by sharing data. Why build systems from cooperating processes? The slides give four reasons:</p>
<ul>
  <li><b>Information sharing</b> — several processes need the same data;</li>
  <li><b>Computation speedup</b> — a task is split into subtasks that run at the same time;</li>
  <li><b>Modularity</b> — the system is built from separate parts, each in its own process;</li>
  <li><b>Convenience</b> — a user works on several tasks at once.</li>
</ul>
<p>Cooperating processes need <b>interprocess communication (IPC)</b>. There are two models. Look at the figure: in (a) both processes read and write a common memory area; in (b) process A sends messages into a queue kept by the kernel, and process B receives them.</p>
<div data-viz="0"></div>
<p><b>IPC — shared memory</b>:</p>
<ul>
  <li>an area of memory is shared among the processes that wish to communicate;</li>
  <li>the communication is under the control of the <b>user processes, not the operating system</b>;</li>
  <li>the major issue is to provide a mechanism that lets the user processes <b>synchronize</b> their actions when they access the shared memory.</li>
</ul>
<p>The table compares the two models. Focus on two rows: the role of the kernel, and who is responsible for synchronization.</p>
<table class="t">
  <tr><th></th><th>Shared memory</th><th>Message passing</th></tr>
  <tr><td>How</td><td>a common region in the address spaces of the processes</td><td><code>send()</code> / <code>receive()</code> through the kernel (message queue)</td></tr>
  <tr><td>Role of the kernel</td><td>only when the region is created</td><td>involved in every transfer</td></tr>
  <tr><td>Synchronization</td><td>the processes' own job (otherwise: race conditions)</td><td>provided by the message mechanism</td></tr>
  <tr><td>Good for</td><td>large amounts of data, fast</td><td>no shared variables needed; also works across a network</td></tr>
</table>
<p>The conclusion: shared memory is faster (no kernel in the data path) but leaves synchronization to the programmer; message passing is simpler and safer but every message costs a system call. We study shared memory first — a classic example, its race condition, and the real POSIX API — and then message passing.</p>`,
      viz: [{ name: 'graph', caption: 'Communication models: (a) shared memory, (b) message passing.', props: { w: 640, h: 280,
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
      takeaway: 'Cooperating processes (reasons: information sharing, computation speedup, modularity, convenience) need IPC. Shared memory: fast, controlled by the user processes, who must synchronize themselves. Message passing: send/receive through the kernel, simpler but with a system call per message.',
      exam: 'Independent vs cooperating processes; the 4 reasons for cooperation; the two IPC models and who controls the communication in shared memory.'
    },
    {
      id: 'producer-consumer',
      h: 'Producer–consumer with a bounded buffer',
      why: 'a model problem for shared memory',
      lead: 'To see how shared memory is used, we need a concrete example. The classic one is producer–consumer: one process makes items, another uses them, and a buffer in shared memory sits between them.',
      html: `
<p>The <b>producer–consumer problem</b> is a paradigm (a standard model) for cooperating processes: a <b>producer</b> process produces information that is consumed by a <b>consumer</b> process. Think of a compiler producing code that an assembler consumes, or a web server producing pages that a browser consumes. Because the two do not work at exactly the same speed, items are stored in a <b>buffer</b> between them. There are two variations:</p>
<table class="t">
  <tr><th>Variation</th><th>Producer</th><th>Consumer</th></tr>
  <tr><td><b>Unbounded buffer</b> (no practical limit on size)</td><td>never waits</td><td>waits if the buffer is empty</td></tr>
  <tr><td><b>Bounded buffer</b> (fixed size)</td><td>waits if all buffers are full</td><td>waits if the buffer is empty</td></tr>
</table>
<p>The bounded buffer is the realistic case. It is implemented as a <b>circular array</b> in shared memory with two indexes: <code>in</code> (where the producer puts the next item) and <code>out</code> (where the consumer takes the next item). When an index reaches the end of the array, it wraps around to 0 with <code>% BUFFER_SIZE</code>.</p>
<pre class="code" data-lang="c">#define BUFFER_SIZE 10
typedef struct {
    . . .
} item;

item buffer[BUFFER_SIZE];
int in = 0;    /* next free position */
int out = 0;   /* first full position */</pre>
<p>Each process waits in an empty loop when it cannot proceed — this is called <b>busy waiting</b> (the process keeps using the CPU just to check a condition):</p>
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
<p>The two wait conditions are the heart of the solution. Why does "full" look so odd? If the producer were allowed to fill the last free slot, <code>in</code> would catch up with <code>out</code> and we would get <code>in == out</code> — the same condition as "empty". To keep the two cases different, the producer stops one slot earlier.</p>
<div class="formula">Buffer empty: in == out &nbsp;|&nbsp; Buffer full: (in + 1) % BUFFER_SIZE == out &nbsp;→ at most <b>BUFFER_SIZE − 1</b> items at the same time (9 of 10)</div>
<div class="callout note">On slide 43 the two producer lines are swapped (<code>in = …</code> before <code>buffer[in] = …</code>). The correct order (as in Silberschatz and in the counter version) is: first write into <code>buffer[in]</code>, then advance <code>in</code>.</div>
<p>Step through a small example with a 4-slot buffer to see the wasted slot:</p>
<div data-viz="0"></div>`,
      viz: [{ name: 'stepper', caption: 'Trace with BUFFER_SIZE = 4: only 3 items fit.', props: { lang: 'c', code: `#define BUFFER_SIZE 4
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
        { line: 3, note: 'Start: in == out → the buffer is empty.', vars: { in: 0, out: 0, buffer: '[_, _, _, _]' } },
        { line: [10, 11], note: 'Consumer: in == out → it spins in the empty loop (busy waiting).', vars: { in: 0, out: 0 } },
        { line: [7, 8], note: 'The producer stores A.', vars: { in: 1, out: 0, buffer: '[A, _, _, _]' } },
        { line: [7, 8], note: 'The producer stores B.', vars: { in: 2, out: 0, buffer: '[A, B, _, _]' } },
        { line: [7, 8], note: 'The producer stores C.', vars: { in: 3, out: 0, buffer: '[A, B, C, _]' } },
        { line: [5, 6], note: '(3 + 1) % 4 = 0 == out → the buffer counts as FULL, although one slot is free. The producer waits.', vars: { in: 3, out: 0, buffer: '[A, B, C, _]' } },
        { line: [12, 13], note: 'The consumer takes A; slot 0 becomes free.', vars: { in: 3, out: 1, buffer: '[_, B, C, _]', next_consumed: 'A' } },
        { line: [7, 8], note: '(3 + 1) % 4 = 0 ≠ 1 → the producer stores D in slot 3 and in wraps around to 0. Now (0 + 1) % 4 == out → "full" again (3 items).', vars: { in: 0, out: 1, buffer: '[_, B, C, D]' } }] } }],
      takeaway: 'Bounded buffer as a circular array: empty when in == out, full when (in + 1) % N == out. One slot always stays unused, so at most N − 1 items fit. Each variable has one writer: the producer writes in, the consumer writes out.',
      exam: 'The "empty" (in == out) and "full" ((in + 1) % N == out) conditions; why only N − 1 items fit.'
    },
    {
      id: 'race',
      h: 'Filling all the buffers: counter and the race condition',
      why: 'why shared data needs synchronization',
      lead: 'Wasting one slot is annoying. The obvious fix is a shared counter of filled slots — but it creates a much worse problem: a race condition.',
      html: `
<p>To use <b>all</b> N buffers, we add a shared integer <b>counter</b> that keeps the number of full buffers. Initially it is 0; the producer increments it after adding an item, the consumer decrements it after removing one. Now "full" and "empty" are easy to tell apart:</p>
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
<p>Each routine is correct on its own. The problem appears when they run <i>concurrently</i>. <code>counter++</code> and <code>counter--</code> look like single steps, but they are <b>not atomic</b> (an atomic operation cannot be interrupted in the middle). In machine language each is three instructions — load, modify, store:</p>
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
<p>A context switch can happen between any two of these instructions. Here is one possible interleaving, starting with <b>counter = 5</b>:</p>
<pre class="code" data-lang="text">S0: producer  register1 = counter        {register1 = 5}
S1: producer  register1 = register1 + 1  {register1 = 6}
S2: consumer  register2 = counter        {register2 = 5}
S3: consumer  register2 = register2 - 1  {register2 = 4}
S4: producer  counter = register1        {counter = 6}
S5: consumer  counter = register2        {counter = 4}</pre>
<div class="callout warn">The result is <b>counter = 4</b>, but the correct value is <b>5</b> (one item produced, one consumed). If S4 and S5 are swapped, the result is <b>6</b>. Both processes read the old value 5, and the later write overwrites the earlier one. When the result depends on the order in which processes access shared data, we have a <b>race condition</b>.</div>
<div data-viz="0"></div>
<div class="callout note"><b>Question from the slide</b>: why was there no race condition in the first solution (where at most N − 1 buffers are filled)? Because each shared variable there has <b>only one writer</b>: <code>in</code> is changed only by the producer, <code>out</code> only by the consumer. There is no variable that both processes update. With <code>counter</code>, both write the same variable — and that is where the race comes from. (Details in the Synchronization module.)</div>
<p>So shared memory is fast, but correctness is entirely the programmers' responsibility. Before moving on to message passing, let us see how two processes actually obtain a shared region in a real system.</p>`,
      viz: [{ name: 'race', caption: 'Step through the interleaving of counter++ and counter-- (start = 5).', props: { start: 5 } }],
      takeaway: 'counter++ and counter-- are three machine instructions each; an unlucky interleaving gives 4 or 6 instead of 5. A race condition = the result depends on the order of access to shared data. The in/out version had no race because each variable had only one writer.',
      exam: 'Split counter++ into 3 instructions and show an interleaving that gives 4 or 6; why the in/out version has no race condition.'
    },
    {
      id: 'posix-shm',
      h: 'POSIX shared memory: shm_open, ftruncate, mmap',
      why: 'shared memory in a real API',
      lead: 'The producer–consumer code simply assumed a buffer that both processes can see. But processes are isolated — so how do they get such a common region? On POSIX systems it takes three calls: shm_open, ftruncate and mmap.',
      html: `
<p>POSIX shared memory is organized using <b>memory-mapped files</b>: a region of shared memory is associated with a file-like object, and each process maps that object into its own address space. The steps are:</p>
<ol class="steps">
  <li><b>Create (or open) a shared-memory object</b>: <code>shm_fd = shm_open(name, O_CREAT | O_RDWR, 0666);</code><br>
    — <b>name</b> is the name of the object; other processes that want to use it open it by the same name;<br>
    — <b>O_CREAT | O_RDWR</b>: create the object if it does not exist yet (O_CREAT) and open it for reading and writing (O_RDWR);<br>
    — the last parameter (<b>0666</b>) sets the access permissions of the object.<br>
    A successful <code>shm_open()</code> returns an <b>integer file descriptor</b> for the object.</li>
  <li><b>Set its size</b>: <code>ftruncate(shm_fd, 4096);</code> sets the size of the object in bytes (here 4096).</li>
  <li><b>Map it into memory</b>: <code>mmap()</code> creates a memory-mapped file containing the object and <b>returns a pointer</b> to it. From now on, the process reads and writes the shared memory through this pointer, like any normal memory.</li>
</ol>
<div data-viz="0"></div>
<p><b>Producer–consumer example.</b> The producer creates an object named <b>"OS"</b> and writes "Hello World!" into it; the consumer reads it, prints it and removes the object. Watch three details:</p>
<ul>
  <li>the <b>MAP_SHARED</b> flag of <code>mmap()</code> means that changes to the object are <b>visible to all processes</b> that share it;</li>
  <li>the producer writes through the pointer with <code>sprintf()</code> and then moves the pointer forward;</li>
  <li>the consumer calls <code>shm_unlink()</code> to remove the shared-memory segment after reading it.</li>
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
<pre class="code" data-lang="c">/* same #includes */
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
<div class="callout key">The consumer prints <b>HelloWorld!</b> — the two strings were written one right after the other, with no space. Compare the two programs: the producer opens the object with <code>O_CREAT | O_RDWR</code> and maps it with <code>PROT_WRITE</code>; the consumer uses <code>O_RDONLY</code> and <code>PROT_READ</code>. Only the creator calls <code>ftruncate</code>.</div>
<p>Notice that the example contains no synchronization at all: it works only because the consumer is started after the producer has finished. Shared memory gives speed, not coordination. The other IPC model builds the coordination into the mechanism itself.</p>`,
      viz: [{ name: 'flow', caption: 'The sequence of POSIX shared-memory calls.', props: { dir: 'h', steps: [
        { label: 'shm_open()', sub: 'create/open → fd', tone: 'acc' },
        { label: 'ftruncate()', sub: 'size 4096 B', tone: 'acc' },
        { label: 'mmap()', sub: 'MAP_SHARED → ptr', tone: 'acc' },
        { label: 'sprintf / printf', sub: 'read/write through ptr', tone: 'ok' },
        { label: 'shm_unlink()', sub: 'remove (consumer)', tone: 'warn' }] } }],
      takeaway: 'POSIX shared memory: shm_open (create/open, get an fd) → ftruncate (set size) → mmap with MAP_SHARED (get a pointer) → read/write through the pointer → shm_unlink (remove). The example prints HelloWorld!',
      exam: 'The order shm_open → ftruncate → mmap; the meaning of O_CREAT | O_RDWR and MAP_SHARED; who calls shm_unlink; what the consumer prints.'
    },
    {
      id: 'message-passing',
      h: 'IPC — message passing',
      why: 'let the OS carry the data',
      lead: 'Shared memory is fast, but the processes must organize everything themselves, including synchronization. The second IPC model leaves this work to the OS: processes simply send and receive messages.',
      html: `
<p>With <b>message passing</b>, processes communicate with each other <b>without resorting to shared variables</b>. The IPC facility provides two operations: <code>send(message)</code> and <code>receive(message)</code>. The message size is either <b>fixed</b> or <b>variable</b>.</p>
<p>If processes P and Q wish to communicate, they need to: <b>establish a communication link</b> between them, and exchange messages via send/receive. A link can be implemented in several ways. The table separates the <b>physical</b> implementation (how the bytes move) from the <b>logical</b> properties (how the link behaves for the programmer):</p>
<table class="t">
  <tr><th>Physical</th><th>Logical</th></tr>
  <tr><td><b>Shared memory</b> — messages are placed in one block of memory<br><b>Hardware bus</b> — a microcontroller with hardware peripherals connects processes on different processors<br><b>Network</b> — data goes through a network interface (to a process on the same or another computer)</td>
      <td><b>Direct</b> or <b>indirect</b><br><b>Synchronous</b> or <b>asynchronous</b><br><b>Automatic</b> or <b>explicit buffering</b></td></tr>
</table>
<p>The rest of the section goes through the three logical questions one by one: <i>whom</i> do we address (direct or indirect), <i>do we wait</i> (blocking or not), and <i>where do messages wait</i> (buffering).</p>
<p><b>1. Naming: direct or indirect.</b></p>
<div class="cols">
<div><b>Direct communication</b> — processes must name each other explicitly:
<ul>
  <li><code>send(P, message)</code> — send a message to process P;</li>
  <li><code>receive(Q, message)</code> — receive a message from process Q.</li>
</ul>
Properties of the link:
<ul>
  <li>established <b>automatically</b>;</li>
  <li>associated with exactly <b>one pair</b> of communicating processes;</li>
  <li>between each pair there is <b>exactly one</b> link;</li>
  <li>may be unidirectional, but is usually <b>bidirectional</b>.</li>
</ul></div>
<div><b>Indirect communication</b> — messages are sent to and received from <b>mailboxes</b> (also called <b>ports</b>):
<ul>
  <li>a mailbox is an object into which processes put messages and from which they take them; each mailbox has a <b>unique id</b>;</li>
  <li>processes can communicate only if they <b>share a mailbox</b>.</li>
</ul>
Properties of the link:
<ul>
  <li>established only if the processes share a common mailbox;</li>
  <li>may be associated with <b>many processes</b>;</li>
  <li>each pair of processes may share <b>several</b> links;</li>
  <li>may be unidirectional or bidirectional.</li>
</ul></div>
</div>
<p>Indirect communication needs extra operations: <b>create</b> a new mailbox (port), send and receive messages through the mailbox, <b>delete</b> a mailbox. The primitives are <code>send(A, message)</code> — send a message to mailbox A — and <code>receive(A, message)</code> — receive a message from mailbox A.</p>
<p><b>Mailbox sharing.</b> Mailboxes create a new question. P1, P2 and P3 share mailbox A; P1 sends, and P2 and P3 both execute receive. <b>Who gets the message?</b> Possible solutions (the OS enforces the chosen rule):</p>
<ul>
  <li>allow a link to be associated with at most <b>two</b> processes;</li>
  <li>allow <b>only one</b> process at a time to execute a receive operation;</li>
  <li>let the system select the receiver <b>arbitrarily</b> (for example in Round Robin order, taking turns); the <b>sender is notified</b> who the receiver was.</li>
</ul>
<div data-viz="0"></div>
<p><b>2. Synchronization: blocking or non-blocking.</b> Message passing may be either blocking or non-blocking. <b>Blocking</b> is considered <b>synchronous</b>, <b>non-blocking</b> is considered <b>asynchronous</b>:</p>
<table class="t">
  <tr><th></th><th><b>Blocking</b> = synchronous</th><th><b>Non-blocking</b> = asynchronous</th></tr>
  <tr><td><b>send</b></td><td>the sender is blocked until the message is received</td><td>the sender sends the message and continues</td></tr>
  <tr><td><b>receive</b></td><td>the receiver is blocked until a message is available</td><td>the receiver gets either a valid message or <b>null</b></td></tr>
</table>
<div class="callout key">Different combinations are possible. If both send and receive are <b>blocking</b>, we have a <b>rendezvous</b>: sender and receiver "meet" — neither continues until the message has passed from one to the other.</div>
<p>With blocking calls the producer–consumer problem becomes almost trivial — no buffer indexes, no counter, no busy waiting:</p>
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
<p><b>3. Buffering.</b> Messages that have been sent but not yet received wait in a queue of messages attached to the link. Its capacity decides when the sender must wait:</p>
<table class="t">
  <tr><th>Capacity</th><th>Queue</th><th>Sender</th></tr>
  <tr><td><b>Zero capacity</b></td><td>no messages are queued on the link</td><td>must wait for the receiver (<b>rendezvous</b>)</td></tr>
  <tr><td><b>Bounded capacity</b></td><td>finite length of n messages</td><td>must wait if the link is full</td></tr>
  <tr><td><b>Unbounded capacity</b></td><td>infinite length</td><td>never waits</td></tr>
</table>
<p>Notice the parallel with the producer–consumer variations: bounded capacity behaves like the bounded buffer, unbounded like the unbounded one — but now the OS manages the queue.</p>`,
      viz: [{ name: 'graph', caption: 'Direct (name the process) vs indirect (through mailbox A).', props: { w: 660, h: 220,
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
      takeaway: 'Message passing = send/receive over a link, no shared variables. Direct: name the process, one link per pair. Indirect: mailboxes (ports), many processes per link. Blocking = synchronous, non-blocking = asynchronous; blocking send + blocking receive = rendezvous. Buffering: zero, bounded or unbounded capacity.',
      exam: 'Direct vs indirect and the link properties; who receives a message from a shared mailbox; blocking/non-blocking and rendezvous; the three kinds of buffering.'
    },
    {
      id: 'mach-alpc',
      h: 'Examples of IPC systems — Mach and Windows ALPC',
      why: 'message passing in real systems',
      lead: 'Two real systems show message passing in practice. Mach — the microkernel underneath macOS (see OS structures in the previous module) — is built entirely on messages; Windows uses ALPC for communication between processes on the same machine.',
      html: `
<p><b>Mach</b>:</p>
<ul>
  <li>Mach communication is <b>message based</b>; <b>even system calls are messages</b>.</li>
  <li>Each task (Mach's name for a process) gets <b>two ports</b> at creation: the <b>Kernel</b> port and the <b>Notify</b> port.</li>
  <li>Messages are sent and received with the <code>mach_msg()</code> function; ports needed for communication are created with <code>mach_port_allocate()</code>.</li>
  <li>Send and receive are flexible. For example, if the mailbox is full, the sender has 4 options: <b>wait indefinitely</b>; <b>wait at most n milliseconds</b>; <b>return immediately</b>; <b>temporarily cache</b> the message.</li>
</ul>
<p>The code shows one message from a client to a server. The same function <code>mach_msg()</code> is used for both directions; the second argument (<code>MACH_SEND_MSG</code> or <code>MACH_RCV_MSG</code>) says which:</p>
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
<p><b>Windows</b> provides message passing through the <b>advanced local procedure call (ALPC)</b> facility:</p>
<ul>
  <li>it works <b>only between processes on the same system</b> ("local");</li>
  <li>it uses <b>ports</b> (like mailboxes) to establish and maintain communication channels.</li>
</ul>
<p>A channel is set up in four steps:</p>
<ol class="steps">
  <li>The client opens a handle to the subsystem's <b>connection port</b> object.</li>
  <li>The client sends a <b>connection request</b>.</li>
  <li>The server creates <b>two private communication ports</b> and returns the handle of one of them to the client.</li>
  <li>The client and the server use the corresponding port handles to send messages or callbacks and to listen for replies.</li>
</ol>
<p>In the figure, note the extra <b>shared section object</b>: for large messages (more than 256 bytes) the data is not copied through the port but placed in a shared memory section — the two IPC models working together.</p>
<div data-viz="0"></div>`,
      viz: [{ name: 'graph', caption: 'Local procedure calls in Windows (ALPC).', props: { w: 620, h: 300,
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
      takeaway: 'Mach: everything (even system calls) is a message; each task gets a Kernel and a Notify port; mach_msg() sends and receives; 4 options when the mailbox is full. Windows ALPC: local only; the client contacts a connection port, the server creates two private communication ports.',
      exam: 'Mach: system calls are messages, Kernel and Notify ports, mach_msg(), the 4 options when the mailbox is full. ALPC: only local, connection port → two communication ports.'
    },
    {
      id: 'pipes',
      h: 'Pipes — ordinary and named',
      why: 'the simplest IPC channel',
      lead: 'Pipes are one of the oldest and simplest IPC mechanisms in UNIX: a channel through which one process pours bytes and another reads them. The example program uses almost everything from this module — fork, closing file descriptors, wait.',
      html: String.raw`
<p>A <b>pipe</b> acts as a conduit (a channel) that allows two processes to communicate. There are two kinds:</p>
<ul>
  <li><b>Ordinary pipes</b> cannot be accessed from outside the process that created them. Typically, a parent process creates a pipe and uses it to communicate with a child process it created.</li>
  <li><b>Named pipes</b> can be accessed <b>without a parent–child relationship</b>.</li>
</ul>
<p><b>Ordinary pipes</b>:</p>
<ul>
  <li>allow communication in standard producer–consumer style: the producer writes to one end (the <b>write end</b>), the consumer reads from the other end (the <b>read end</b>);</li>
  <li>therefore ordinary pipes are <b>unidirectional</b> (data flows one way);</li>
  <li>they require a <b>parent–child</b> relationship between the communicating processes;</li>
  <li>Windows calls them <b>anonymous pipes</b>.</li>
</ul>
<p>Why do they need a parent and a child? Because a pipe is accessed through <b>file descriptors</b> (small integers that a process uses to refer to open files), and the only way for another process to get those descriptors is to inherit them through fork().</p>
<p><b>Ordinary pipes in POSIX.</b> <code>pipe(fd)</code> creates a pipe used to pass information from one process to another: <b>fd[0] is the read end</b>, <b>fd[1] is the write end</b>. Since a pipe is unidirectional, two-way communication needs <b>two pipes</b>, one per direction:</p>
<div data-viz="0"></div>
<p><b>Example pipes.</b> The parent sends a string to the child; the child appends " Pippo" and sends the result back. Pay attention to the <code>close()</code> calls: after fork(), both processes have all four descriptors, and each one closes the ends it does not use.</p>
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
<p><b>Named pipes</b> are more powerful than ordinary pipes:</p>
<ul>
  <li>communication is <b>bidirectional</b>;</li>
  <li><b>no parent–child relationship</b> is necessary between the communicating processes;</li>
  <li><b>several processes</b> can use the named pipe for communication;</li>
  <li>they are provided on both <b>UNIX</b> and <b>Windows</b> systems.</li>
</ul>
<p>The table sums up the differences; every row of the "named" column removes one limitation of ordinary pipes:</p>
<table class="t">
  <tr><th></th><th>Ordinary pipe</th><th>Named pipe</th></tr>
  <tr><td>Direction</td><td>unidirectional</td><td>bidirectional</td></tr>
  <tr><td>Relationship between processes</td><td>parent–child required</td><td>not required</td></tr>
  <tr><td>Access from outside the creator</td><td>no</td><td>yes, several processes</td></tr>
  <tr><td>Name in Windows</td><td>anonymous pipes</td><td>named pipes</td></tr>
</table>`,
      viz: [
        { name: 'graph', caption: 'Two pipes for two-way communication: fd1 (parent → child), fd2 (child → parent).', props: { w: 600, h: 200,
          nodes: [
            { id: 'par', label: 'Parent', x: 70, y: 100, tone: 'acc' },
            { id: 'p1', label: 'pipe fd1', sub: 'fd1[1] → fd1[0]', x: 300, y: 45, w: 150, tone: 'warn' },
            { id: 'p2', label: 'pipe fd2', sub: 'fd2[1] → fd2[0]', x: 300, y: 155, w: 150, tone: 'warn' },
            { id: 'ch', label: 'Child', x: 530, y: 100, tone: 'ok' }],
          edges: [
            { from: 'par', to: 'p1', label: 'write fd1[1]' }, { from: 'p1', to: 'ch', label: 'read fd1[0]' },
            { from: 'ch', to: 'p2', label: 'write fd2[1]' }, { from: 'p2', to: 'par', label: 'read fd2[0]' }] } },
        { name: 'stepper', caption: 'Tracing the example (input: Hello).', props: { lang: 'c', code: String.raw`pipe(fd1); pipe(fd2);
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
          { line: 1, note: 'Two pipes are created: fd1 (parent → child) and fd2 (child → parent). [0] is the read end, [1] is the write end.' },
          { line: 2, note: 'fork(): the child inherits BOTH pipes (all 4 descriptors).' },
          { line: [4, 14], note: 'Each process closes the end of fd1 it does not need: the parent closes the read end, the child closes the write end.' },
          { line: [5, 6, 7], note: 'The parent reads "Hello" from the keyboard and writes "Hello\\0" into fd1[1].', vars: { input_str: 'Hello' } },
          { line: 15, note: 'The child reads from fd1[0] (until now it was blocked in read).', vars: { 'child concat_str': 'Hello' } },
          { line: 16, note: 'The child appends fixed_str.', vars: { 'child concat_str': 'Hello Pippo' } },
          { line: [17, 18, 19, 20], note: 'The child closes the read ends, writes the result into fd2[1], and terminates.' },
          { line: [8, 9, 10, 11], note: 'The parent has waited for the child (wait), reads fd2[0] and prints.', vars: { 'parent concat_str': 'Hello Pippo' }, out: 'Concatenated string Hello Pippo' }] } }
      ],
      takeaway: 'pipe(fd): fd[0] = read end, fd[1] = write end; ordinary pipes are one-way and need a parent–child relationship (descriptors are inherited through fork), so two-way communication needs two pipes. Named pipes are bidirectional, need no parent–child relationship and can serve several processes.',
      exam: 'fd[0] = read, fd[1] = write; which ends the parent and the child close; ordinary vs named pipes; the output of the example (Hello → Hello Pippo).'
    },
    {
      id: 'sockets',
      h: 'Client–server communication: sockets',
      why: 'communication across machines',
      lead: 'All the mechanisms so far work between processes on the same machine. To talk to a process on another computer, we need an address that names both the machine and the service on it. That address is a socket.',
      html: `
<p>For <b>communication in client–server systems</b> the slides name two mechanisms: <b>sockets</b> and <b>remote procedure calls (RPC)</b> — calling a function that runs in a process on another machine as if it were local. Here we look at sockets:</p>
<ul>
  <li>A <b>socket</b> is defined as an <b>endpoint for communication</b>.</li>
  <li>It is the concatenation of an <b>IP address</b> and a <b>port</b> — a number included at the start of a message packet to differentiate the network services on a host. The IP address finds the machine; the port finds the service (the process) on that machine.</li>
  <li>The socket <b>161.25.19.8:1625</b> refers to port <b>1625</b> on host <b>161.25.19.8</b>.</li>
  <li>Communication takes place between a <b>pair of sockets</b> — one for each end.</li>
  <li>All ports <b>below 1024</b> are <b>well known</b> and are used for standard services (e.g. port 80 for a web server).</li>
  <li>The special IP address <b>127.0.0.1</b> (<b>loopback</b>) refers to the system on which the process is running.</li>
</ul>
<p>The figure shows the slide example: a client on host X (146.86.5.20) has opened a socket on port 1625 and talks to a web server (161.25.19.8) on the well-known port 80. Each connection is identified by its pair of sockets.</p>
<div data-viz="0"></div>
<p>This closes the picture of processes. Notice what all IPC mechanisms have in common: because processes are isolated, every exchange costs something — a system call, a copy, or careful synchronization of shared memory. The next module asks a natural question: what if several flows of execution could live <i>inside one process</i> and share its memory directly? Those are <b>threads</b>.</p>`,
      viz: [{ name: 'graph', caption: 'Socket communication: host X ↔ web server.', props: { w: 600, h: 200,
        nodes: [
          { id: 'x', label: 'socket 146.86.5.20:1625', sub: 'host X (146.86.5.20)', x: 150, y: 70, w: 210, h: 54, tone: 'acc' },
          { id: 'w', label: 'socket 161.25.19.8:80', sub: 'web server (161.25.19.8)', x: 440, y: 140, w: 210, h: 54, tone: 'ok' }],
        edges: [{ from: 'x', to: 'w', both: true }] } }],
      takeaway: 'Socket = IP address + port, an endpoint for communication; a connection is a pair of sockets. Ports below 1024 are well known (80 = web); 127.0.0.1 is the loopback address (this machine).',
      exam: 'Socket = IP:port; well-known ports < 1024; 127.0.0.1 = loopback.'
    }
  ],
  terms: [
    { en: 'Process', ru: 'процесс', def: 'A program in execution; an active entity with its own memory and execution state.' },
    { en: 'Program', ru: 'программа', def: 'A passive entity: an executable file stored on disk. It becomes a process when loaded into memory.' },
    { en: 'Executable file', ru: 'исполняемый файл', def: 'A file on disk containing a program ready to be loaded and run.' },
    { en: 'Program in execution', ru: 'выполняющаяся программа', def: 'The definition of a process.' },
    { en: 'Text section', ru: 'сегмент кода', def: 'The part of a process\'s memory that holds the program code.' },
    { en: 'Data section', ru: 'сегмент данных', def: 'The part of a process\'s memory that holds global variables (initialized and uninitialized data).' },
    { en: 'Initialized data', ru: 'инициализированные данные', def: 'Global variables that have an initial value, e.g. int y = 15;.' },
    { en: 'Uninitialized data', ru: 'неинициализированные данные', def: 'Global variables without an initial value, e.g. int x;.' },
    { en: 'Stack', ru: 'стек', def: 'Temporary data: function parameters, return addresses, local variables; grows down.' },
    { en: 'Heap', ru: 'куча', def: 'Memory dynamically allocated during run time (malloc); grows up.' },
    { en: 'Program counter', ru: 'счётчик команд', def: 'Register holding the address of the next instruction to execute.' },
    { en: 'Address space', ru: 'адресное пространство', def: 'The range of memory addresses the OS assigns to a process (from base to base + limit).' },
    { en: 'Base and limit', ru: 'база и предел', def: 'The first legal address of a process (base) and the size of its range (limit); legal addresses are base ≤ a < base + limit.' },
    { en: 'Memory-management unit', ru: 'блок управления памятью', def: 'MMU: hardware that translates the addresses used by a process into physical addresses, using page tables.' },
    { en: 'Page table', ru: 'таблица страниц', def: 'A table, managed by the OS and the MMU, that maps a process\'s virtual addresses to physical memory.' },
    { en: 'Memory protection', ru: 'защита памяти', def: 'Prevents one process from corrupting another process\'s data.' },
    { en: 'Isolation', ru: 'изоляция', def: 'Each process has its own address space and cannot access the memory of other processes.' },
    { en: 'Process state', ru: 'состояние процесса', def: 'The current situation of a process: new, ready, running, waiting or terminated.' },
    { en: 'Scheduler dispatch', ru: 'выбор планировщиком (диспетчеризация)', def: 'The event that moves a process from ready to running.' },
    { en: 'Process Control Block', ru: 'блок управления процессом', def: 'PCB: kernel data structure with all information about a process (state, PC, registers, scheduling, memory, accounting, I/O status); stored in kernel space.' },
    { en: 'Task control block', ru: 'блок управления задачей', def: 'Another name for the PCB.' },
    { en: 'task_struct', ru: 'структура task_struct (PCB в Linux)', def: 'The C structure that represents a process in Linux (pid, state, time_slice, parent, children, files, mm).' },
    { en: 'Kernel space', ru: 'пространство ядра', def: 'The part of memory reserved for the operating system; PCBs are stored there.' },
    { en: 'User space', ru: 'пользовательское пространство', def: 'The part of memory where user processes run.' },
    { en: 'Thread of execution', ru: 'поток выполнения', def: 'One sequence of executed instructions, with one program counter.' },
    { en: 'Process scheduler', ru: 'планировщик процессов', def: 'Selects among the available processes the next one to execute on a CPU core.' },
    { en: 'Scheduling queue', ru: 'очередь планирования', def: 'A list of PCBs kept by the scheduler (ready queue, wait queues).' },
    { en: 'Ready queue', ru: 'очередь готовых процессов', def: 'All processes in main memory that are ready and waiting to execute.' },
    { en: 'Wait queue', ru: 'очередь ожидания', def: 'Processes waiting for an event, such as I/O completion.' },
    { en: 'Queue header', ru: 'заголовок очереди', def: 'The start of a queue: pointers to the first (head) and last (tail) PCB.' },
    { en: 'Queueing diagram', ru: 'диаграмма очередей', def: 'A figure showing how processes move between the ready queue, the CPU and the wait queues.' },
    { en: 'Time slice', ru: 'квант времени', def: 'The maximum time a process may use the CPU before it is put back into the ready queue.' },
    { en: 'Long-term scheduler', ru: 'долгосрочный планировщик', def: 'Job scheduler: selects which processes from the job pool on disk enter the ready queue; runs rarely; controls the degree of multiprogramming.' },
    { en: 'Job scheduler', ru: 'планировщик заданий', def: 'Another name for the long-term scheduler.' },
    { en: 'Job pool', ru: 'пул заданий', def: 'Jobs on disk waiting to be brought into memory.' },
    { en: 'Short-term scheduler', ru: 'краткосрочный планировщик', def: 'CPU scheduler: selects the next process to run and allocates the CPU; runs every few milliseconds, so it must be fast.' },
    { en: 'CPU scheduler', ru: 'планировщик процессора', def: 'Another name for the short-term scheduler.' },
    { en: 'Medium-term scheduler', ru: 'среднесрочный планировщик', def: 'Performs swapping: temporarily moves a process out of memory to disk and back.' },
    { en: 'Swapping', ru: 'подкачка (выгрузка процесса)', def: 'Moving a whole process from memory to disk and later back into memory.' },
    { en: 'Degree of multiprogramming', ru: 'степень мультипрограммирования', def: 'The number of processes in memory; controlled by the long-term scheduler.' },
    { en: 'CPU burst', ru: 'интервал работы на CPU', def: 'A stretch of time in which a process computes without waiting for I/O.' },
    { en: 'I/O-bound process', ru: 'процесс, ограниченный вводом-выводом', def: 'Spends more time doing I/O than computing; many short CPU bursts.' },
    { en: 'CPU-bound process', ru: 'процесс, ограниченный вычислениями', def: 'Spends more time computing; very long CPU bursts.' },
    { en: 'Process mix', ru: 'смесь процессов', def: 'A balanced combination of I/O-bound and CPU-bound processes chosen by the long-term scheduler.' },
    { en: 'Context switch', ru: 'переключение контекста', def: 'Saving the state of the old process into its PCB and loading the saved state of the new one; pure overhead.' },
    { en: 'Overhead', ru: 'накладные расходы', def: 'Time or resources spent on management work instead of useful work.' },
    { en: 'Foreground process', ru: 'процесс переднего плана', def: 'The process the user is currently interacting with (on screen).' },
    { en: 'Background process', ru: 'фоновый процесс', def: 'A process in memory and running, but not on the display.' },
    { en: 'Service', ru: 'служба (сервис)', def: 'In Android, a component without UI used by a background process; it can keep running even if the process is suspended.' },
    { en: 'Screen real estate', ru: 'площадь экрана', def: 'The limited space available on a screen.' },
    { en: 'Process creation', ru: 'создание процесса', def: 'The operation by which a parent process creates a child process.' },
    { en: 'Process termination', ru: 'завершение процесса', def: 'The end of a process: exit(), abort() or cascading termination.' },
    { en: 'Parent process', ru: 'родительский процесс', def: 'A process that creates another process.' },
    { en: 'Child process', ru: 'дочерний процесс', def: 'A process created by another process.' },
    { en: 'Tree of processes', ru: 'дерево процессов', def: 'The hierarchy formed by parents and children; in Linux its root is systemd (pid 1).' },
    { en: 'Process identifier', ru: 'идентификатор процесса', def: 'pid: a unique integer by which the OS identifies and manages a process.' },
    { en: 'fork()', ru: 'системный вызов fork()', def: 'Creates a child that is a copy of the parent; returns 0 in the child, the child\'s PID in the parent, < 0 on error.' },
    { en: 'exec()', ru: 'системный вызов exec()', def: 'Replaces the memory space of the process with a new program; does not return on success.' },
    { en: 'wait()', ru: 'системный вызов wait()', def: 'Blocks the parent until a child terminates; returns the child\'s pid and its status.' },
    { en: 'exit()', ru: 'системный вызов exit()', def: 'Asks the OS to delete the process; its status goes to the parent and its resources are freed.' },
    { en: 'abort()', ru: 'системный вызов abort()', def: 'Used by a parent to terminate a child (resources exceeded, task not needed, parent exiting).' },
    { en: 'Exit status', ru: 'код завершения', def: 'The value a terminated process returns to its parent through wait().' },
    { en: 'Cascading termination', ru: 'каскадное завершение', def: 'When a process terminates, the OS also terminates all its descendants (children, grandchildren, …).' },
    { en: 'Zombie process', ru: 'процесс-зомби', def: 'A terminated process whose parent has not yet called wait().' },
    { en: 'Orphan process', ru: 'процесс-сирота', def: 'A process whose parent terminated without calling wait(); it is adopted by init.' },
    { en: 'init', ru: 'процесс init', def: 'The first system process (systemd in modern Linux, pid 1); it adopts orphans.' },
    { en: 'CreateProcess()', ru: 'функция CreateProcess()', def: 'Windows API call that creates a process and loads a program into it (≈ fork + exec).' },
    { en: 'Handle', ru: 'дескриптор (хэндл)', def: 'In Windows, a reference to an OS object such as a process or thread; closed with CloseHandle().' },
    { en: 'Importance hierarchy', ru: 'иерархия важности', def: 'Android ranking: foreground > visible > service > background > empty; the least important are killed first.' },
    { en: 'Renderer process', ru: 'процесс отрисовки', def: 'In Chrome, renders web pages (HTML, JavaScript); one per website, runs in a sandbox.' },
    { en: 'Sandbox', ru: 'песочница', def: 'A restricted environment that limits disk and network access to reduce the effect of security exploits.' },
    { en: 'Independent process', ru: 'независимый процесс', def: 'A process that cannot affect or be affected by other processes.' },
    { en: 'Cooperating process', ru: 'взаимодействующий процесс', def: 'A process that can affect or be affected by other processes, including by sharing data.' },
    { en: 'Interprocess communication', ru: 'межпроцессное взаимодействие', def: 'IPC: mechanisms for processes to exchange data — shared memory or message passing.' },
    { en: 'Shared memory', ru: 'общая (разделяемая) память', def: 'An IPC model: a memory region shared by communicating processes and controlled by them.' },
    { en: 'Message passing', ru: 'передача сообщений', def: 'An IPC model: processes communicate with send/receive, without shared variables.' },
    { en: 'Producer–consumer problem', ru: 'задача производителя и потребителя', def: 'A producer process makes information that a consumer process uses, through a buffer.' },
    { en: 'Bounded buffer', ru: 'ограниченный буфер', def: 'A buffer of fixed size: the producer waits when it is full, the consumer when it is empty.' },
    { en: 'Unbounded buffer', ru: 'неограниченный буфер', def: 'A buffer with no practical size limit: the producer never waits.' },
    { en: 'Circular buffer', ru: 'кольцевой буфер', def: 'An array used in a circle: indexes wrap around to 0 with % BUFFER_SIZE.' },
    { en: 'Busy waiting', ru: 'активное ожидание', def: 'Waiting in an empty loop that keeps checking a condition and uses the CPU.' },
    { en: 'Atomic operation', ru: 'атомарная операция', def: 'An operation that cannot be interrupted in the middle.' },
    { en: 'Race condition', ru: 'состояние гонки', def: 'The result depends on the order in which processes access shared data (e.g. counter = 4 or 6 instead of 5).' },
    { en: 'Communication link', ru: 'канал связи', def: 'The connection between processes over which messages are sent.' },
    { en: 'Direct communication', ru: 'прямая связь', def: 'Processes name each other explicitly: send(P, message), receive(Q, message).' },
    { en: 'Indirect communication', ru: 'косвенная связь', def: 'Messages are sent to and received from mailboxes (ports).' },
    { en: 'Mailbox', ru: 'почтовый ящик', def: 'Also called a port: an object with a unique id into which processes put and from which they take messages.' },
    { en: 'Blocking send', ru: 'блокирующая отправка', def: 'The sender is blocked until the message is received (synchronous).' },
    { en: 'Non-blocking receive', ru: 'неблокирующий приём', def: 'The receiver gets either a valid message or null (asynchronous).' },
    { en: 'Synchronous', ru: 'синхронный', def: 'Blocking: the caller waits until the operation is complete.' },
    { en: 'Asynchronous', ru: 'асинхронный', def: 'Non-blocking: the caller continues without waiting.' },
    { en: 'Rendezvous', ru: 'рандеву', def: 'Both send and receive are blocking (or the link has zero capacity): sender and receiver meet.' },
    { en: 'Zero capacity', ru: 'нулевая ёмкость', def: 'No messages are queued; the sender must wait for the receiver.' },
    { en: 'Bounded capacity', ru: 'ограниченная ёмкость', def: 'A queue of n messages; the sender waits when it is full.' },
    { en: 'Unbounded capacity', ru: 'неограниченная ёмкость', def: 'An infinite queue; the sender never waits.' },
    { en: 'Memory-mapped file', ru: 'файл, отображённый в память', def: 'A file-like object mapped into a process\'s address space; the basis of POSIX shared memory.' },
    { en: 'Shared-memory object', ru: 'объект разделяемой памяти', def: 'The named object created with shm_open() and mapped with mmap().' },
    { en: 'File descriptor', ru: 'файловый дескриптор', def: 'A small integer a process uses to refer to an open file, pipe or shared-memory object.' },
    { en: 'Mach', ru: 'микроядро Mach', def: 'A message-based microkernel (part of macOS); even system calls are messages.' },
    { en: 'Advanced local procedure call', ru: 'расширенный локальный вызов процедур', def: 'ALPC: Windows message passing between processes on the same system, using ports.' },
    { en: 'Connection port', ru: 'порт подключения', def: 'In ALPC, the public port to which a client sends its connection request.' },
    { en: 'Communication port', ru: 'порт связи', def: 'In ALPC, one of the two private ports the server creates for a client–server channel.' },
    { en: 'Pipe', ru: 'канал (пайп)', def: 'A conduit that allows two processes to communicate.' },
    { en: 'Ordinary pipe', ru: 'обычный канал', def: 'A unidirectional pipe between a parent and a child; fd[0] = read end, fd[1] = write end.' },
    { en: 'Anonymous pipe', ru: 'анонимный канал', def: 'The Windows name for an ordinary pipe.' },
    { en: 'Named pipe', ru: 'именованный канал', def: 'A bidirectional pipe that needs no parent–child relationship and can be used by several processes; UNIX and Windows.' },
    { en: 'Read end', ru: 'конец для чтения', def: 'The end of a pipe from which data is read: fd[0].' },
    { en: 'Write end', ru: 'конец для записи', def: 'The end of a pipe into which data is written: fd[1].' },
    { en: 'Socket', ru: 'сокет', def: 'An endpoint for communication: IP address + port (e.g. 161.25.19.8:1625).' },
    { en: 'Well-known port', ru: 'общеизвестный порт', def: 'A port below 1024, used by standard services (e.g. 80 for a web server).' },
    { en: 'Loopback', ru: 'петлевой адрес', def: '127.0.0.1: refers to the system on which the process is running.' },
    { en: 'Remote procedure call', ru: 'удалённый вызов процедуры', def: 'RPC: calling a procedure that runs in a process on another machine.' }
  ],
  questions: [
    { id: 'proc-01', type: 'single', q: 'How does a process differ from a program?', options: ['A program is an active entity in memory; a process is a file on disk', 'A program is a passive entity (an executable file on disk); a process is a program in execution', 'They are synonyms', 'A process is a set of programs started by one user'], answer: 1, explain: 'A program is a passive executable file; it becomes a process when it is loaded into memory and executed. The first option swaps the two definitions.', section: 'concept', diff: 1 },
    { id: 'proc-02', type: 'tf', q: 'One program can correspond to several processes at the same time.', answer: true, explain: 'For example, several users run the same program: each run is a separate process with its own data and progress.', section: 'concept', diff: 1 },
    { id: 'proc-03', type: 'single', q: 'In which part of a process\'s memory are function parameters, return addresses and local variables stored?', options: ['Text section', 'Data section', 'Heap', 'Stack'], answer: 3, explain: 'The stack holds the temporary data of function calls. The heap holds dynamic memory, the data section holds globals, the text section holds code.', section: 'memory', diff: 1 },
    { id: 'proc-04', type: 'code', q: 'In which memory region are the 5 ints allocated by this program?', lang: 'c', code: String.raw`int x;
int y = 15;
int main(int argc, char *argv[]) {
    int *values;
    values = (int *)malloc(sizeof(int) * 5);
    return 0;
}`, options: ['Stack', 'Heap', 'Initialized data', 'Uninitialized data'], answer: 1, explain: 'malloc allocates memory in the heap. The pointer variable values itself is a local variable, so it lives on the stack — a common trap.', section: 'memory', diff: 2 },
    { id: 'proc-05', type: 'single', q: 'In the memory layout of a C program, the global variable int y = 15; is stored in…', options: ['initialized data', 'uninitialized data', 'stack', 'text'], answer: 0, explain: 'Globals with an initial value go to initialized data; globals without one (int x;) go to uninitialized data.', section: 'memory', diff: 1 },
    { id: 'proc-06', type: 'single', q: 'A process owns the addresses from base = 300040 up to base + limit = 420940. What is the limit?', options: ['120900', '420940', '300040', '720980'], answer: 0, explain: 'limit = (base + limit) − base = 420940 − 300040 = 120900. 420940 is base + limit, not the limit itself.', section: 'memory', diff: 2 },
    { id: 'proc-07', type: 'single', q: 'A process is ready to run and is waiting to be assigned to a processor. What is its state?', options: ['New', 'Waiting', 'Ready', 'Running'], answer: 2, explain: 'Ready = waiting only for the CPU. Waiting = waiting for an event such as I/O, not for the processor.', section: 'states', diff: 1 },
    { id: 'proc-08', type: 'single', q: 'Which transition does NOT exist in the process state diagram?', options: ['waiting → running', 'ready → running', 'running → ready', 'waiting → ready'], answer: 0, explain: 'When I/O completes, the process goes to ready (I/O or event completion); only the scheduler can then dispatch it from ready to running.', section: 'states', diff: 2 },
    { id: 'proc-09', type: 'single', q: 'Which event moves a process from running to ready?', options: ['admitted', 'interrupt', 'I/O or event wait', 'exit'], answer: 1, explain: 'An interrupt (e.g. the time slice expired) moves running → ready. I/O wait moves running → waiting; exit moves running → terminated.', section: 'states', diff: 1 },
    { id: 'proc-10', type: 'multi', q: 'What is stored in the PCB? (select all that apply)', options: ['Process state', 'Program counter', 'CPU registers', 'The source code of the program', 'List of open files', 'Accounting information'], answer: [0, 1, 2, 4, 5], explain: 'The program code is in the text section of the process\'s memory, not in the PCB. All the others are PCB fields (open files belong to the I/O status information).', section: 'pcb', diff: 1 },
    { id: 'proc-11', type: 'single', q: 'What is the name of the structure that represents a process (the PCB) in Linux?', options: ['task_struct', 'mm_struct', 'files_struct', 'list_head'], answer: 0, explain: 'task_struct is the Linux PCB. mm_struct (address space) and files_struct (open files) are fields inside it.', section: 'pcb', diff: 1 },
    { id: 'proc-12', type: 'tf', q: 'PCBs are stored in the user space of each process, so that the process can modify them itself.', answer: false, explain: 'PCBs are stored in memory reserved for the OS — kernel space. A process must not be able to change its own PCB (e.g. its priority).', section: 'pcb', diff: 1 },
    { id: 'proc-13', type: 'single', q: 'In the queueing diagram, the time slice of the process on the CPU expires. Where does it go?', options: ['I/O wait queue', 'Ready queue', 'Child termination wait queue', 'Terminated'], answer: 1, explain: 'Time slice expired → the process goes straight back to the ready queue; it is not waiting for any event.', section: 'scheduling', diff: 1 },
    { id: 'proc-14', type: 'single', q: 'How are the ready queue and the wait queues implemented on the slides?', options: ['As a fixed-size array of processes', 'As a linked list of PCBs, with head and tail pointers in a queue header', 'As a stack of processes', 'As a tree of processes'], answer: 1, explain: 'The queue header holds head and tail pointers; the PCBs are linked in a list (e.g. PCB7 → PCB2).', section: 'scheduling', diff: 2 },
    { id: 'proc-15', type: 'single', q: 'Which scheduler controls the degree of multiprogramming?', options: ['Short-term scheduler', 'Long-term scheduler', 'Dispatcher', 'Interrupt handler'], answer: 1, explain: 'The long-term (job) scheduler decides how many processes from the job pool enter memory and the ready queue.', section: 'schedulers', diff: 1 },
    { id: 'proc-16', type: 'single', q: 'Why must the short-term scheduler be fast?', options: ['It is invoked once every few minutes', 'It is invoked very frequently (milliseconds)', 'It loads processes from disk', 'It runs only while the OS boots'], answer: 1, explain: 'The short-term scheduler runs every few milliseconds, so a slow one would waste a large part of CPU time. The long-term scheduler runs rarely and may be slow.', section: 'schedulers', diff: 1 },
    { id: 'proc-17', type: 'single', q: 'An I/O-bound process is characterized by…', options: ['many short CPU bursts', 'very long CPU bursts', 'no I/O at all', 'always the highest priority'], answer: 0, explain: 'An I/O-bound process spends most time on I/O, so it computes only in short bursts. Long CPU bursts characterize CPU-bound processes.', section: 'schedulers', diff: 1 },
    { id: 'proc-18', type: 'multi', q: 'Which statements about the context switch are true? (select all that apply)', options: ['Context-switch time is pure overhead', 'The context of a process is represented in its PCB', 'The more complex the OS and the PCB, the longer the switch', 'Useful work of the process is done during the switch', 'Multiple register sets per CPU allow several contexts to be loaded at once'], answer: [0, 1, 2, 4], explain: 'The system does no useful work while switching — that is why it is overhead. The other statements come from the context-switch slide.', section: 'context-switch', diff: 2 },
    { id: 'proc-19', type: 'single', q: 'Android: which statement about the service used by a background process is true?', options: ['It has its own user interface', 'It can keep running even if the background process is suspended', 'It runs only while the process is in the foreground', 'It uses a lot of memory'], answer: 1, explain: 'A service keeps running even when its background process is suspended; it has no UI and uses little memory.', section: 'mobile', diff: 1 },
    { id: 'proc-59', type: 'single', q: 'Which process is the root of the Linux process tree on the slide?', options: ['bash (pid 8416)', 'systemd (pid 1)', 'sshd (pid 3028)', 'logind (pid 8415)'], answer: 1, explain: 'systemd, with pid 1, is the ancestor of all processes; logind, python and sshd are its children.', section: 'creation', diff: 1 },
    { id: 'proc-60', type: 'multi', q: 'Which resource-sharing options between parent and child are listed on the slide? (select all that apply)', options: ['Parent and children share all resources', 'Children share a subset of the parent\'s resources', 'Parent and child share no resources', 'A child shares resources only with its siblings'], answer: [0, 1, 2], explain: 'Three options: all, a subset, or none. There is no "only with siblings" option.', section: 'creation', diff: 2 },
    { id: 'proc-20', type: 'single', q: 'fork() returned 0. What does this mean?', options: ['Creating the process failed', 'The code is running in the child process', 'The code is running in the parent, and the child\'s PID is 0', 'The child has already terminated'], answer: 1, explain: '0 is returned to the new child; the parent receives the child\'s PID (> 0); a negative value means an error.', section: 'fork', diff: 1 },
    { id: 'proc-21', type: 'code', q: 'How many times is "Hello world!" printed?', lang: 'c', code: String.raw`#include <stdio.h>
#include <sys/types.h>
#include <unistd.h>
int main()
{
    fork();
    fork();
    fork();
    printf("Hello world!, process_id(pid) = %d \n", getpid());
    return 0;
}`, options: ['3', '6', '7', '8'], answer: 3, explain: 'Each fork() doubles the number of processes: 2³ = 8 processes, and each prints once. 7 is the number of children created, not the number of prints.', section: 'fork', diff: 1 },
    { id: 'proc-22', type: 'code', q: 'How many times is "hello" printed?', lang: 'c', code: String.raw`int main()
{
    for (int i = 0; i < 4; i++)
        fork();
    printf("hello\n");
    return 0;
}`, options: ['4', '5', '8', '16'], answer: 3, explain: 'This is 4 consecutive unconditional forks (each child continues the loop with the same i), so there are 2⁴ = 16 processes, each printing once.', section: 'fork', diff: 2 },
    { id: 'proc-23', type: 'code', q: 'What does the program print?', lang: 'c', code: String.raw`int x = 1;
pid_t p = fork();
if (p < 0) {
    perror("fork fail");
    return 1;
}
else if (p == 0)
    printf("Child has x = %d\n", ++x);
else
    printf("Parent has x = %d\n", --x);`, options: ['Child has x = 2 and Parent has x = 0, in either order', 'Always Parent has x = 0 first, then Child has x = 2', 'Child has x = 2 and Parent has x = 1 — x is shared by the processes', 'Child has x = 1 and Parent has x = 1'], answer: 0, explain: 'Each process has its own copy of x = 1: the child makes it 2, the parent makes it 0. The scheduler decides the order of the two lines, so both orders are possible.', section: 'fork', diff: 2 },
    { id: 'proc-24', type: 'code', q: 'How many times is "A" printed?', lang: 'c', code: String.raw`int main()
{
    if (fork() == 0)
        fork();
    printf("A\n");
    return 0;
}`, options: ['2', '3', '4', '1'], answer: 1, explain: 'Parent: fork() > 0, so it does not call the second fork. Child: fork() == 0, so it calls fork() again → child + grandchild. Total: 3 processes, 3 prints.', section: 'fork', diff: 2 },
    { id: 'proc-25', type: 'code', q: 'How many times is "hello" printed?', lang: 'c', code: String.raw`int main()
{
    fork() && fork();
    printf("hello\n");
    return 0;
}`, options: ['2', '3', '4', '8'], answer: 1, explain: 'Parent: the first fork() is > 0 (true), so the second fork() is evaluated → one more child. First child: fork() == 0 (false), so && skips the right side. Processes: parent + 2 children = 3.', section: 'fork', diff: 3 },
    { id: 'proc-26', type: 'code', q: 'In which order does the output appear (exec succeeds)?', lang: 'c', code: String.raw`pid = fork();
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
}`, options: ['First the file list from ls, then Child Complete', 'First Child Complete, then the file list', 'Only Child Complete', 'The file list is printed twice'], answer: 0, explain: 'The child is replaced by ls; the parent is blocked in wait() until the child terminates, and only then prints Child Complete.', section: 'exec-wait', diff: 2 },
    { id: 'proc-27', type: 'code', q: 'How many times is "after exec" printed if execlp succeeds?', lang: 'c', code: String.raw`pid_t pid = fork();
if (pid == 0) {
    execlp("/bin/ls", "ls", NULL);
    printf("after exec\n");
} else {
    wait(NULL);
    printf("parent done\n");
}`, options: ['0', '1', '2', 'It depends on the scheduler'], answer: 0, explain: 'exec() replaces the child\'s memory with the ls program; on success it never returns, so the printf in the child never runs. The parent does not take that branch at all.', section: 'exec-wait', diff: 2 },
    { id: 'proc-28', type: 'code', q: 'While the child is sleeping, someone kills it with kill -9 <child pid>. What does the parent print after "End of process <pid>: "?', lang: 'c', code: String.raw`if (pid > 0) {
    printf("I am the parent, the child is %d.\n", pid);
    pid = wait(&status);
    printf("End of process %d: ", pid);
    if (WIFEXITED(status))
        printf("The process ended with exit(%d).\n", WEXITSTATUS(status));
    if (WIFSIGNALED(status))
        printf("The process ended with kill -%d.\n", WTERMSIG(status));
}`, options: ['The process ended with exit(9).', 'The process ended with kill -9.', 'The process ended with exit(0).', 'Nothing: wait() never returns'], answer: 1, explain: 'The child was terminated by signal 9 (SIGKILL): WIFEXITED is false, WIFSIGNALED is true and WTERMSIG = 9. "exit(9)" would mean a normal exit with code 9.', section: 'exec-wait', diff: 3 },
    { id: 'proc-29', type: 'single', q: 'Which Windows API function plays the role of wait() in the CreateProcess example?', options: ['CloseHandle()', 'WaitForSingleObject()', 'ZeroMemory()', 'CreateProcess()'], answer: 1, explain: 'WaitForSingleObject(pi.hProcess, INFINITE) waits until the child terminates. CloseHandle only releases the handles.', section: 'windows', diff: 1 },
    { id: 'proc-30', type: 'single', q: 'How does CreateProcess() differ from fork()?', options: ['CreateProcess creates a copy of the parent', 'CreateProcess immediately loads the specified program into the new process', 'CreateProcess creates a thread, not a process', 'CreateProcess never returns control to the parent'], answer: 1, explain: 'fork() duplicates the parent (exec() changes the program later), while CreateProcess creates the process and loads a program (mspaint.exe) into it in one call.', section: 'windows', diff: 2 },
    { id: 'proc-31', type: 'single', q: 'A zombie process is…', options: ['a process whose parent terminated without calling wait()', 'a terminated process whose parent has not called wait() yet', 'a process in the waiting state', 'a process killed by abort()'], answer: 1, explain: 'A zombie is a child that has already terminated but whose status has not been collected with wait(). The first option describes an orphan.', section: 'termination', diff: 1 },
    { id: 'proc-32', type: 'single', q: 'What happens to an orphan process?', options: ['The OS destroys it immediately', 'It stays a zombie forever', 'It is adopted by the special system process init', 'It becomes the parent of its siblings'], answer: 2, explain: 'An orphan\'s parent terminated without wait(); the orphan is automatically adopted by init, which will collect its status.', section: 'termination', diff: 1 },
    { id: 'proc-33', type: 'multi', q: 'Reasons for which a parent may terminate a child with abort(): (select all that apply)', options: ['The child has exceeded its allocated resources', 'The task assigned to the child is no longer required', 'The parent is exiting and the OS does not allow the child to continue', 'The child called wait()', 'The child is I/O-bound'], answer: [0, 1, 2], explain: 'These are the three reasons on the slide. Calling wait() or being I/O-bound are not reasons for abort().', section: 'termination', diff: 2 },
    { id: 'proc-34', type: 'tf', q: 'In cascading termination, the termination of the children and grandchildren is initiated by the operating system.', answer: true, explain: 'The slide says: "The termination is initiated by the operating system".', section: 'termination', diff: 2 },
    { id: 'proc-35', type: 'single', q: 'Which processes does Android terminate first when memory is short?', options: ['Foreground process', 'Visible process', 'Service process', 'Empty process'], answer: 3, explain: 'The importance order is foreground > visible > service > background > empty; Android starts with the least important — empty processes.', section: 'android-chrome', diff: 1 },
    { id: 'proc-36', type: 'single', q: 'Which type of Chrome process is created for each website opened and runs in a sandbox?', options: ['Browser process', 'Renderer process', 'Plug-in process', 'Service process'], answer: 1, explain: 'The renderer renders pages (HTML, JavaScript), is created per website and has restricted disk/network I/O. The browser process manages the UI and I/O.', section: 'android-chrome', diff: 1 },
    { id: 'proc-37', type: 'multi', q: 'Reasons for cooperating processes according to the slides: (select all that apply)', options: ['Information sharing', 'Computation speedup', 'Modularity', 'Convenience', 'Memory protection'], answer: [0, 1, 2, 3], explain: 'The four reasons are information sharing, computation speedup, modularity and convenience. Memory protection is a property of process isolation, not a reason to cooperate.', section: 'ipc', diff: 1 },
    { id: 'proc-38', type: 'single', q: 'In IPC through shared memory, the communication is under the control of…', options: ['the OS, which copies every message', 'the user processes, not the OS', 'the hardware timer', 'the long-term scheduler'], answer: 1, explain: 'Once the region exists, the processes read and write it themselves; the main problem is synchronizing their actions.', section: 'ipc', diff: 2 },
    { id: 'proc-39', type: 'code', q: 'Bounded buffer with in/out. What is the maximum number of items that can be in the buffer at the same time?', lang: 'c', code: String.raw`#define BUFFER_SIZE 10
/* producer */
while (((in + 1) % BUFFER_SIZE) == out)
    ; /* do nothing */
buffer[in] = next_produced;
in = (in + 1) % BUFFER_SIZE;`, options: ['10', '9', '11', '1'], answer: 1, explain: 'The buffer counts as full when (in + 1) % N == out, so one slot always stays empty: at most N − 1 = 9 items.', section: 'producer-consumer', diff: 2 },
    { id: 'proc-40', type: 'single', q: 'In the in/out solution, under which condition does the consumer wait (buffer empty)?', options: ['in == out', '(in + 1) % BUFFER_SIZE == out', 'in > out', 'out == BUFFER_SIZE'], answer: 0, explain: 'in == out means empty; (in + 1) % N == out means full.', section: 'producer-consumer', diff: 1 },
    { id: 'proc-41', type: 'code', q: 'counter = 5 before this interleaving. What is the value of counter at the end?', lang: 'text', code: `S0: producer  register1 = counter
S1: producer  register1 = register1 + 1
S2: consumer  register2 = counter
S3: consumer  register2 = register2 - 1
S4: producer  counter = register1
S5: consumer  counter = register2`, options: ['4', '5', '6', '3'], answer: 0, explain: 'register1 = 6 and register2 = 4; S4 writes 6, then S5 overwrites it with 4. The correct value would be 5 — this is a race condition.', section: 'race', diff: 2 },
    { id: 'proc-42', type: 'multi', q: 'counter = 5; the producer executes counter++ and the consumer counter-- (3 machine instructions each), interleaved in any order. Which final values are possible? (select all that apply)', options: ['4', '5', '6', '7', '3'], answer: [0, 1, 2], explain: 'Without overlap the result is 5; if the consumer writes last using a stale value, 4; if the producer writes last, 6. Only one increment and one decrement happen, so 7 and 3 are impossible.', section: 'race', diff: 3 },
    { id: 'proc-43', type: 'single', q: 'Why is there no race condition in the first producer–consumer solution (in/out, at most N − 1 items)?', options: ['Because the buffer is small', 'Each shared variable is modified by only one process: in by the producer, out by the consumer', 'Because a mutex is used', 'Because the producer and consumer run on the same core'], answer: 1, explain: 'No variable is written by both processes. In the counter version both processes write counter — that is where the race comes from.', section: 'race', diff: 3 },
    { id: 'proc-44', type: 'single', q: 'If both send and receive are blocking, this is called…', options: ['Rendezvous', 'Busy waiting', 'Cascading', 'Mailbox sharing'], answer: 0, explain: 'Blocking send + blocking receive = a rendezvous between sender and receiver.', section: 'message-passing', diff: 1 },
    { id: 'proc-45', type: 'single', q: 'What does a non-blocking receive return when there is no message?', options: ['It blocks until a message arrives', 'A null message', 'An error, and the process is terminated', 'The last message received'], answer: 1, explain: 'A non-blocking receive gets either a valid message or null. Blocking until a message arrives is the behaviour of a blocking receive.', section: 'message-passing', diff: 2 },
    { id: 'proc-46', type: 'single', q: 'Buffering with zero capacity means that…', options: ['the sender never waits', 'the sender waits only when the buffer of n messages is full', 'the sender must wait for the receiver (rendezvous)', 'messages are lost'], answer: 2, explain: 'With zero capacity there is no queue, so the sender must wait for the receiver. "Never waits" is unbounded capacity; "waits when full" is bounded capacity.', section: 'message-passing', diff: 2 },
    { id: 'proc-47', type: 'multi', q: 'Properties of the link in direct communication: (select all that apply)', options: ['The link is established automatically', 'The link is associated with exactly one pair of processes', 'Between each pair of processes there is exactly one link', 'The link may be associated with many processes', 'A shared mailbox is required'], answer: [0, 1, 2], explain: 'Many processes per link and a shared mailbox are properties of indirect communication.', section: 'message-passing', diff: 2 },
    { id: 'proc-48', type: 'single', q: 'P1, P2 and P3 share mailbox A; P1 sends. Which "who gets the message" solution was NOT proposed on the slide?', options: ['Allow a link to be associated with at most two processes', 'Allow only one process at a time to execute a receive', 'Let the system pick the receiver arbitrarily (e.g. RR) and notify the sender', 'All processes sharing the mailbox receive the message'], answer: 3, explain: 'The first three are the solutions from the slide. Broadcasting to everyone is not among them.', section: 'message-passing', diff: 2 },
    { id: 'proc-49', type: 'code', q: 'Which call is missing in the producer at /* ??? */?', lang: 'c', code: String.raw`shm_fd = shm_open(name, O_CREAT | O_RDWR, 0666);
/* ??? */
ptr = mmap(0, SIZE, PROT_WRITE, MAP_SHARED, shm_fd, 0);
sprintf(ptr, "%s", message_0);`, options: ['ftruncate(shm_fd, SIZE);', 'shm_unlink(name);', 'pipe(shm_fd);', 'wait(NULL);'], answer: 0, explain: 'After creating the object, its size must be set with ftruncate(). shm_unlink is called by the consumer at the end, to remove the object.', section: 'posix-shm', diff: 2 },
    { id: 'proc-50', type: 'single', q: 'What does the MAP_SHARED flag of mmap() mean?', options: ['The memory is read-only', 'Changes to the object are visible to all processes that share it', 'The object is removed when it is closed', 'A private copy is created on write'], answer: 1, explain: 'With MAP_SHARED, changes to the shared-memory object are visible to every process that has mapped it.', section: 'posix-shm', diff: 2 },
    { id: 'proc-51', type: 'single', q: 'The producer wrote message_0 = "Hello" and message_1 = "World!" (moving ptr forward by strlen each time). What does the consumer print?', options: ['Hello World!', 'HelloWorld!', 'Hello', 'World!'], answer: 1, explain: 'The strings are written one right after the other with no space, because ptr moves exactly strlen(message_0) bytes.', section: 'posix-shm', diff: 2 },
    { id: 'proc-52', type: 'single', q: 'Which two ports does each Mach task receive when it is created?', options: ['Kernel and Notify', 'Client and Server', 'Input and Output', 'Connection and Communication'], answer: 0, explain: 'Kernel and Notify. Connection and communication ports belong to Windows ALPC.', section: 'mach-alpc', diff: 2 },
    { id: 'proc-53', type: 'tf', q: 'Windows ALPC works only between processes on the same system.', answer: true, explain: 'Advanced local procedure call is a local mechanism; for communication across the network, mechanisms such as sockets or RPC are used.', section: 'mach-alpc', diff: 1 },
    { id: 'proc-54', type: 'code', q: 'The parent sends data to the child through an ordinary pipe. Which calls must the parent make?', lang: 'c', code: String.raw`int fd[2];
pipe(fd);
if (fork() > 0) {      /* parent */
    close(fd[?]);
    write(fd[?], msg, strlen(msg) + 1);
}`, options: ['close(fd[0]); write(fd[1], …)', 'close(fd[1]); write(fd[0], …)', 'close(fd[0]); write(fd[0], …)', 'close(fd[1]); write(fd[1], …)'], answer: 0, explain: 'fd[0] is the read end, fd[1] is the write end. The writer closes the read end it does not need and writes into fd[1].', section: 'pipes', diff: 2 },
    { id: 'proc-55', type: 'code', q: 'The user types Hello. What does the parent print in the two-pipe example?', lang: 'c', code: String.raw`char fixed_str[] = " Pippo";
/* parent: scanf("%s", input_str); write(fd1[1], ...); wait(NULL); */
/* child:  read(fd1[0], concat_str, 100); appends fixed_str;         */
/*         write(fd2[1], concat_str, ...);                           */
/* parent: */
read(fd2[0], concat_str, 100);
printf("Concatenated string %s\n", concat_str);`, options: ['Concatenated string Hello', 'Concatenated string Hello Pippo', 'Concatenated string  Pippo', 'Concatenated string PippoHello'], answer: 1, explain: 'The parent sends "Hello" to the child through fd1; the child appends " Pippo" and sends the result back through fd2.', section: 'pipes', diff: 2 },
    { id: 'proc-56', type: 'multi', q: 'Which statements are true for named pipes? (select all that apply)', options: ['Communication is bidirectional', 'No parent–child relationship is required', 'Several processes can use one named pipe', 'They exist only in Windows', 'They are strictly unidirectional'], answer: [0, 1, 2], explain: 'Named pipes exist in both UNIX and Windows. Unidirectional communication is a property of ordinary pipes.', section: 'pipes', diff: 2 },
    { id: 'proc-57', type: 'single', q: 'The socket 161.25.19.8:1625 refers to…', options: ['port 161 on host 25.19.8.1625', 'port 1625 on host 161.25.19.8', 'the process with pid 1625 on host 161.25.19.8', 'host 1625 in network 161.25.19.8'], answer: 1, explain: 'A socket is the concatenation of an IP address and a port: host 161.25.19.8, port 1625. A port identifies a service, not a pid.', section: 'sockets', diff: 1 },
    { id: 'proc-58', type: 'multi', q: 'Which statements about sockets are true according to the slides? (select all that apply)', options: ['Ports below 1024 are well known and used for standard services', '127.0.0.1 is the loopback address and refers to the local system', 'Communication takes place between a pair of sockets', 'A socket is the same thing as a pipe'], answer: [0, 1, 2], explain: 'A socket is an endpoint for communication (IP + port); a pipe is a different IPC mechanism.', section: 'sockets', diff: 1 },
    { id: 'proc-61', type: 'single', q: 'On a single-core CPU, how many processes can be in the running state at the same moment?', options: ['At most one', 'At most two', 'As many as there are in the ready queue', 'There is no limit'], answer: 0, explain: 'One core executes the instructions of one process at a time, so at most one process is running; any number of processes can be ready or waiting.', section: 'states', diff: 1 },
    { id: 'proc-62', type: 'single', q: 'During a context switch from P0 to P1, where does the OS save the state of P0?', options: ['In PCB0', 'In PCB1', 'On the stack of P1', 'In the header of the ready queue'], answer: 0, explain: 'Each process\'s context is stored in its own PCB: the OS saves P0\'s state into PCB0 and then reloads P1\'s state from PCB1.', section: 'context-switch', diff: 1 },
    { id: 'proc-63', type: 'code', q: 'How many times is "1" printed?', lang: 'c', code: String.raw`int main()
{
    if (fork() || fork())
        fork();
    printf("1\n");
    return 0;
}`, options: ['3', '4', '5', '6'], answer: 2, explain: 'Parent: first fork() > 0 → || is true without the second fork → it forks once more (parent + 1 child). First child: first fork() = 0 → it calls the second fork(): it gets > 0 (true) and forks again (2 processes), while its new child gets 0 (false) and does not fork. Total: 2 + 2 + 1 = 5.', section: 'fork', diff: 3 },
    { id: 'proc-64', type: 'tf', q: 'In the shared-memory model, the kernel is involved in every read and write of the shared data.', answer: false, explain: 'The kernel is needed only to set up the shared region; afterwards the processes read and write it directly, like normal memory. Kernel involvement in every transfer is typical of message passing.', section: 'ipc', diff: 2 },
    { id: 'proc-65', type: 'single', q: 'Why does the OS keep a terminated child as a zombie instead of removing it completely at once?', options: ['Its exit status and pid must be kept until the parent collects them with wait()', 'Its memory must stay so that the parent can read its variables', 'The scheduler may restart it later', 'It is waiting to be adopted by init'], answer: 0, explain: 'wait() returns the child\'s pid and status, so this information must survive until the parent asks for it. The child\'s memory is already freed; adoption by init concerns orphans, not zombies.', section: 'termination', diff: 2 },
    {id: "proc-66",type: "single",q: "Context switching never impacts memory. Which statement is correct?",options: ["Context switching can cause cache misses and TLB flushes, slowing down memory access","Context switching copies the entire process memory from RAM to the disk every time","Context switching physically erases all data stored in RAM","Context switching never touches memory at all"],answer: 0,explain: "After a switch the caches hold the old process data (cache misses) and the TLB must be flushed or tagged, so memory access is slower for a while. Nothing is copied to disk or erased.",section: "context-switch",diff: 2}
  ]
});
