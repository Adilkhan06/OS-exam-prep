OS.addModule({
  id: 'memory',
  num: 8,
  group: 'theory',
  title: 'Main Memory',
  titleRu: 'Оперативная память',
  icon: '🧠',
  sources: ['8-MainMamory.pdf'],
  summary: 'How many processes share one physical memory safely and efficiently: base and limit registers, address binding, logical vs physical addresses and the MMU, loading and linking, contiguous allocation (first/best/worst fit, fragmentation, compaction), paging (page table, TLB, effective access time, protection, shared pages), page-table structures (hierarchical, hashed, inverted), swapping, and real hardware (Intel IA-32, x86-64, ARM).',
  bridge: 'Until now every process simply "had memory": the Processes module drew its text, data, heap and stack, and the scheduler switched between many such processes. But all of them live in one physical memory at the same time, together with the OS. This module answers the question we skipped: how do many processes share that one memory safely (nobody touches anybody else) and efficiently (little memory is wasted and every access stays fast)?',
  intro: `
<p>The CPU can work only with data that is in its registers or in main memory, so every running program must first be loaded into memory. With multiprogramming (module 1) many programs are there at once, next to the operating system. Two problems follow, and they run through the whole module: <b>protection</b> — a process must not read or write memory that belongs to another process or to the OS; and <b>allocation</b> — the OS must find room for every process, waste as little memory as possible, and still keep every memory access fast.</p>
<p>The key idea is to separate two kinds of addresses. The program uses <b>logical addresses</b> (its own private numbering, starting at 0); the memory chips use <b>physical addresses</b> (real cells of RAM). A piece of hardware, the <b>MMU</b>, translates one into the other on every access. The rest of the module is a chain of better and better translation schemes, each fixing the weakness of the previous one: one base + limit pair per process (<b>contiguous allocation</b>) → scattered holes, <b>external fragmentation</b> → <b>paging</b>, which removes external fragmentation but needs a page-table lookup on every access → the <b>TLB</b>, which makes that lookup fast → page tables that become too big → <b>hierarchical, hashed and inverted</b> page tables. At the end we see what to do when memory is still not enough (<b>swapping</b>) and how real CPUs (Intel IA-32, x86-64, ARM) build these ideas into hardware.</p>`,
  sections: [
    {
      id: 'background',
      h: 'Background — what the CPU can reach',
      why: 'why memory must be managed',
      lead: 'A program on disk cannot run. The CPU can execute instructions and use data only if they sit in its registers or in main memory — so every process must be brought into memory first.',
      html: `
<p><b>Main memory</b> (sometimes called <b>primary storage</b>) is the set of storage locations that the processor can access <b>directly</b>. Main memory and the CPU registers are the <b>only</b> storage the CPU can access directly: no machine instruction takes a disk address. So a program must be brought (from disk) into memory and placed within a process before it can run.</p>
<p>What does the memory itself see? Not variables, not processes — only a stream of requests:</p>
<ul>
  <li>an <b>address + a read request</b> ("give me the content of this cell"), or</li>
  <li>an <b>address + data + a write request</b> ("store this value in this cell").</li>
</ul>
<p>The memory unit does not know how an address was produced or which process sent it. So the OS and the hardware must make sure, <i>before</i> an address reaches memory, that it is a legal address for the running process.</p>
<p>Speed matters as much as safety (Silberschatz). A register is accessed in one CPU clock cycle; main memory needs many cycles, because the data travels over the memory bus. While the CPU waits it <b>stalls</b>. The fix is the one from module 1: a <b>cache</b>, a small fast memory between the CPU and main memory, managed by the hardware. Whatever memory management does, it must be cheap, because it is involved in <i>every</i> memory access.</p>
<p>The slide figure gives the picture to keep in mind. Main memory holds a <b>process list</b> and several processes (A, B, …), each with its own <b>context</b>, <b>data</b> and <b>program (code)</b>. The CPU holds registers: the program counter (PC), a process index, and two special registers, <b>base</b> and <b>limit</b>, which mark the region of the running process (process B in the figure).</p>`,
      viz: [{ name: 'layers', caption: 'Slide "Background": main memory with a process list and two processes. The base and limit registers in the CPU delimit the running process B.', props: { top: 'main memory', bottom: '', layers: [
        { label: 'process list', sub: 'entries i, j point to the processes', tone: 'muted' },
        { label: 'Process A', sub: 'context · data · program (code)' },
        { label: 'Process B — running', sub: 'context · data · program (code) · base register = b (start), limit register = h (size)', tone: 'acc' }] } }],
      takeaway: 'The CPU can reach only registers and main memory, and memory just sees addresses with read or write requests. So the OS and the hardware must (1) bring every process into memory and (2) check every address it produces — and do it fast, because this happens on every access.'
    },
    {
      id: 'base-limit',
      h: 'Protection with base and limit registers',
      why: 'keep each process in its own region',
      lead: 'With many processes in one memory, nothing stops a buggy or malicious program from writing into another process or into the OS. The simplest hardware fix is a pair of registers that fence in the running process.',
      html: `
<p>Each process has a <b>logical address space</b> where it stores its context, data and code. We need to ensure that a process can access <b>only</b> the addresses of its own <b>physical address space</b> — its own region of real memory. The simplest way is a pair of registers:</p>
<ul>
  <li>the <b>base register</b> holds the <b>smallest legal physical address</b> of the process;</li>
  <li>the <b>limit register</b> holds the <b>size</b> of the legal range (Silberschatz).</li>
</ul>
<p>In the slide figure the running process occupies the region from <b>300040</b> (base) up to <b>420940</b> (base + limit), so its limit is 420940 − 300040 = <b>120900</b>. The operating system sits at the top (880000–1024000); other processes sit below and above.</p>
<div data-viz="0"></div>
<p><b>The hardware check.</b> The CPU must check <b>every memory access generated in user mode</b> to be sure it lies between base and base + limit for that user:</p>
<ol class="steps">
  <li>Is the address ≥ base? If not → <b>trap</b> to the operating system (<i>illegal addressing error</i>).</li>
  <li>Is the address &lt; base + limit? If not → trap.</li>
  <li>Both answers are yes → the access goes to memory.</li>
</ol>
<div data-viz="1"></div>
<p>Two details make this safe. First, the instructions that <b>load the base and limit registers are privileged</b>: they can run only in kernel mode, so a user program cannot move its own fence. Second, the OS itself, running in kernel mode, is not limited by these registers (Silberschatz), so it can load programs into the user regions and inspect them.</p>
<div class="callout note">On the slides this check appears under the title "Address Binding" (slide 4). Its content is the protection check; address binding itself is the next topic.</div>`,
      viz: [
        { name: 'layers', caption: 'Slide "Processes and main memory": base = 300040 and base + limit = 420940 fence in one process.', props: { top: '1024000 (high)', bottom: '0 (low)', layers: [
          { label: 'operating system', sub: '880000 – 1024000', tone: 'muted' },
          { label: 'process', sub: '420940 – 880000' },
          { label: 'running process', sub: 'from base = 300040 up to base + limit = 420940', tone: 'acc' },
          { label: 'process', sub: '256000 – 300040' },
          { label: 'other memory', sub: '0 – 256000' }] } },
        { name: 'graph', caption: 'Hardware address protection with base and limit registers: two comparisons on every user-mode access.', props: {
          w: 680, h: 260,
          nodes: [
            { id: 'cpu', label: 'CPU', x: 50, y: 80, w: 70, tone: 'muted' },
            { id: 'ge', label: 'address ≥ base?', x: 215, y: 80, w: 140, tone: 'acc' },
            { id: 'lt', label: 'address < base + limit?', x: 430, y: 80, w: 180, tone: 'acc' },
            { id: 'mem', label: 'memory', x: 615, y: 80, w: 90, tone: 'ok' },
            { id: 'trap', label: 'trap to operating system', sub: 'illegal addressing error', x: 320, y: 205, w: 230, h: 52, tone: 'bad' }],
          edges: [
            { from: 'cpu', to: 'ge', label: 'address' },
            { from: 'ge', to: 'lt', label: 'yes', tone: 'ok' },
            { from: 'lt', to: 'mem', label: 'yes', tone: 'ok' },
            { from: 'ge', to: 'trap', label: 'no', tone: 'bad' },
            { from: 'lt', to: 'trap', label: 'no', tone: 'bad' }] } }
      ],
      takeaway: 'Base = first legal address of the process, limit = size of its region. The hardware compares every user-mode address with base and base + limit and traps to the OS on a violation. Loading base and limit is a privileged instruction.',
      exam: 'Draw the check (≥ base, &lt; base + limit, otherwise trap) and explain why loading the registers must be privileged. With base 300040 and limit 120900 the last legal address is 420939.'
    },
    {
      id: 'binding',
      h: 'Address binding — when do addresses become real?',
      why: 'when program addresses are fixed',
      lead: 'Base and limit assume the program already uses the right physical addresses. But when the program is written or compiled, nobody knows where in memory it will be loaded. At some moment its addresses must be bound to real ones.',
      html: `
<p>Addresses are represented in different ways at different stages of a program’s life:</p>
<ul>
  <li>in the <b>source code</b> addresses are usually <b>symbolic</b> (a name such as <code>count</code>);</li>
  <li>the <b>compiler</b> binds them to <b>relocatable addresses</b>, e.g. "14 bytes from the beginning of this module";</li>
  <li>the <b>linker or loader</b> binds relocatable addresses to <b>absolute addresses</b>, e.g. <b>74014</b>.</li>
</ul>
<p>Each binding maps one address space to another. <b>Address binding</b> of instructions and data to memory addresses can happen at three different stages. Read the table top to bottom: the later the binding, the more flexible the system — and the more hardware it needs.</p>
<table class="t">
  <tr><th>Stage</th><th>What happens</th><th>Consequence</th></tr>
  <tr><td><b>Compile time</b></td><td>the memory location is known a priori, so the compiler generates <b>absolute code</b></td><td>if the starting location changes, the code must be <b>recompiled</b></td></tr>
  <tr><td><b>Load time</b></td><td>the location is not known at compile time, so the compiler must generate <b>relocatable code</b>; the final addresses are fixed when the program is loaded</td><td>to change the starting address, the program only has to be reloaded (Silberschatz); once loaded, it cannot move</td></tr>
  <tr><td><b>Execution time</b></td><td>binding is delayed until <b>run time</b></td><td>the process <b>can be moved</b> during its execution from one memory segment to another; needs <b>hardware support</b> for address maps (e.g. base and limit registers, MMU)</td></tr>
</table>
<p><b>Most general-purpose operating systems use execution-time binding.</b> The rest of the module is about the hardware that makes it possible and cheap.</p>
<p>The slide figure shows the <b>multistep processing of a user program</b> and at which step each kind of binding can happen:</p>
<div data-viz="0"></div>
<p>Note the side inputs: <b>other object modules</b> join at the linkage editor, a <b>system library</b> joins at the loader (load time), and a <b>dynamically loaded system library</b> joins only at execution time through <b>dynamic linking</b>. The loading and linking sections below explain these.</p>`,
      viz: [{ name: 'flow', caption: 'Multistep processing of a user program (slide 7): compile time → load time → execution time.', props: { dir: 'v', steps: [
        { label: 'source program', sub: 'symbolic addresses' },
        { label: 'compiler or assembler', sub: 'COMPILE TIME', tone: 'acc' },
        { label: 'object module', sub: 'relocatable addresses' },
        { label: 'linkage editor', sub: 'LOAD TIME · + other object modules', tone: 'warn' },
        { label: 'load module' },
        { label: 'loader', sub: 'LOAD TIME · + system library', tone: 'warn' },
        { label: 'in-memory binary memory image', sub: 'EXECUTION TIME · + dynamically loaded system library (dynamic linking)', tone: 'ok' }] } }],
      takeaway: 'Symbolic → relocatable → absolute. Binding at compile time gives absolute code (recompile to move), at load time relocatable code (fixed after loading), at execution time the process can move while running but needs hardware (MMU) — the choice of most general-purpose OSes.',
      exam: 'The three binding times, what each requires and allows; the example "14 bytes from the beginning of this module" → 74014.'
    },
    {
      id: 'logical-physical',
      h: 'Logical vs physical addresses and the MMU',
      why: 'the hardware that translates',
      lead: 'With execution-time binding the address the program uses is not the address the memory sees. We need names for the two kinds of address, and a piece of hardware that converts one into the other on every access.',
      html: `
<p>The concept of a <b>logical address space</b> that is bound to a separate <b>physical address space</b> is central to proper memory management:</p>
<ul>
  <li>a <b>logical address</b> is generated by the CPU; it is also called a <b>virtual address</b>. It ranges from 0 to the size of the memory the process needs;</li>
  <li>a <b>physical address</b> is the address seen by the memory unit. It ranges from base to base + limit.</li>
</ul>
<p>With compile-time and load-time binding the two addresses are identical; with execution-time binding they differ (Silberschatz). The conversion is done by the <b>Memory Management Unit (MMU)</b>: the hardware unit that translates virtual (logical) addresses into physical addresses in main memory.</p>
<p><b>The simplest MMU</b> is a generalization of the base-register scheme. The base register is now called the <b>relocation register</b>, and its value is <b>added to every address generated by a user process</b> at the time it is sent to memory:</p>
<div class="formula">relocation register = 14000, logical address = 346 → physical address = 14000 + 346 = <b>14346</b></div>
<div data-viz="0"></div>
<p>The consequence is important: the user program deals with <b>logical</b> addresses only — it <b>never sees the real physical addresses</b>. It can create a pointer to location 346, store it and compare it; only when the address is used for a memory access is it relocated. This is execution-time binding: the logical address is bound to a physical address when a reference is made to a location in memory. To move the process, the OS copies it and changes the relocation register — the program does not notice.</p>
<div class="callout warn">In the PDF of slide 10 the symbol inside the MMU circle may display as "≤". It is an <b>adder (+)</b>: the figure computes 14000 + 346 = 14346 (the small figure on slide 9 shows the same "+" next to a limit check).</div>`,
      viz: [{ name: 'graph', caption: 'Dynamic relocation using a relocation register (slide 10).', props: {
        w: 700, h: 170,
        nodes: [
          { id: 'cpu', label: 'CPU', x: 60, y: 85, w: 80, tone: 'muted' },
          { id: 'mmu', label: 'MMU', sub: 'relocation register 14000 (+)', x: 320, y: 85, w: 200, h: 60, tone: 'acc' },
          { id: 'mem', label: 'memory', x: 635, y: 85, w: 100, tone: 'ok' }],
        edges: [
          { from: 'cpu', to: 'mmu', label: 'logical 346' },
          { from: 'mmu', to: 'mem', label: 'physical 14346' }] } }],
      takeaway: 'Logical (virtual) address = generated by the CPU; physical address = seen by memory. The MMU translates at run time; the simplest MMU adds the relocation register (14000 + 346 = 14346). The program never sees physical addresses.',
      exam: 'Define logical vs physical address and the MMU; compute the relocation-register example.'
    },
    {
      id: 'loading',
      h: 'Static loader vs dynamic loading',
      why: 'must the whole program be in memory?',
      lead: 'So far a process had to be completely in memory before it could run. But large programs contain much code that is rarely used, such as error handling. Must all of it occupy memory?',
      html: `
<p>The <b>loader</b> is the module of the operating system responsible for loading programs from secondary memory into main memory and executing them. There are mainly two types: the <b>static loader</b> and the <b>dynamic loader</b>.</p>
<p>A <b>static loader</b> loads the <b>entire</b> executable program — including the libraries and dependencies it needs — into memory <b>before</b> the program starts.</p>
<p>With <b>dynamic loading</b> a routine is <b>not loaded until it is called</b>, so the entire program does not need to be in memory to execute. All routines are kept on disk in a <b>relocatable load format</b>. When a routine calls another one that is not in memory yet, the loader brings it in, updates the program’s address tables (Silberschatz) and passes control to it.</p>
<div class="callout warn">Slide 13 says "The entire program <i>does</i> need to be in memory to execute". This is a typo: the whole point of dynamic loading is that the entire program does <b>not</b> need to be in memory (Silberschatz).</div>
<p>Dynamic loading needs <b>no special support from the operating system</b>: it is implemented through <b>program design</b> — the programmer structures the program to use it. The OS can help by providing libraries that implement dynamic loading.</p>
<p>The two columns list the trade-offs from the slides:</p>
<div class="cols">
  <div><b>Static loader</b>
    <div class="pros"><b>+</b><ul><li>easy and simple to implement</li><li>the entire program is loaded once, which makes it very fast</li><li>reliable: all external references are resolved before execution</li></ul></div>
    <div class="cons"><b>−</b><ul><li>wastes memory: all data and code are loaded before execution</li><li>not efficient: loaded code may never be executed</li></ul></div>
  </div>
  <div><b>Dynamic loading</b>
    <div class="pros"><b>+</b><ul><li>better memory-space utilization: an unused routine is never loaded</li><li>useful when large amounts of code are needed to handle infrequently occurring cases</li></ul></div>
    <div class="cons"><b>−</b><ul><li>more complex and difficult to implement</li><li>overhead: external dependencies are resolved at run time</li><li>longer time to load the program in memory</li><li>less reliable: resolving dependencies at run time may sometimes lead to errors</li></ul></div>
  </div>
</div>
<p>In short: the static loader trades memory for simplicity and speed; dynamic loading trades some run-time overhead and risk for memory.</p>`,
      takeaway: 'Static loader: everything in memory before the start (simple, fast, reliable, wasteful). Dynamic loading: a routine is loaded only when it is first called (saves memory; more complex, slower to load, can fail at run time). Dynamic loading needs no special OS support.',
      exam: 'Advantages and disadvantages of static vs dynamic loading; who implements dynamic loading (program design, helped by OS libraries).'
    },
    {
      id: 'linking',
      h: 'Static vs dynamic linking and shared libraries',
      why: 'one library copy for all programs',
      lead: 'Almost every program uses the same system libraries, such as the C library. If every program carries its own copy, memory and disk fill up with identical code. Dynamic linking lets all programs use one copy.',
      html: `
<p><b>Static linking</b>: system libraries and program code are combined by the loader into the <b>binary program image</b>. Every program gets its own copy of the library code. In the slide figure, Program X and Program Y each contain their own static libraries (<code>*.a</code>), linked at compile time.</p>
<p><b>Dynamic linking</b>: linking is <b>postponed until execution time</b>. Instead of the library code, the program contains a small piece of code called a <b>stub</b> for each library routine it uses:</p>
<ol class="steps">
  <li>The stub is used to locate the appropriate <b>memory-resident</b> library routine.</li>
  <li>The operating system checks whether the routine is in the process’s memory address space; if it is not, it <b>adds it to the address space</b>.</li>
  <li>The stub <b>replaces itself with the address of the routine</b> and executes the routine. Later calls go straight to the routine.</li>
</ol>
<div data-viz="0"></div>
<p>Dynamic linking is particularly useful for <b>libraries</b>; such a system is also known as <b>shared libraries</b> (<code>*.so</code> in the figure: Program X and Program Y use the <i>same</i> shared library, linked at run time). A further benefit (Silberschatz): when a library is updated, for example with a bug fix, all programs use the new version without being relinked.</p>
<div class="callout key">Do not confuse the two "dynamic" ideas. <b>Dynamic loading</b> is a programming technique and needs no OS support. <b>Dynamic linking</b> generally <b>needs help from the OS</b> (Silberschatz): only the OS can check whether the routine is already in memory and let several processes share the same memory. The "Shared pages" section shows how paging makes this sharing possible.</div>`,
      viz: [{ name: 'flow', caption: 'Dynamic linking: the first call goes through the stub; afterwards the stub is replaced by the routine address.', props: { dir: 'h', steps: [
        { label: 'call to a library routine', sub: 'reaches the stub' },
        { label: 'stub', sub: 'locates the memory-resident routine', tone: 'acc' },
        { label: 'OS', sub: 'routine not in the address space? add it', tone: 'warn' },
        { label: 'stub replaced', sub: 'by the routine address; routine executes', tone: 'ok' }] } }],
      takeaway: 'Static linking copies the libraries into every binary image. Dynamic linking postpones linking to run time: a stub finds the memory-resident routine (the OS adds it to the address space if needed) and replaces itself with the routine’s address — one shared library serves all programs.',
      exam: 'What a stub does; static (*.a, copied into each program) vs dynamic (*.so, shared at run time) linking; difference from dynamic loading.'
    },
    {
      id: 'contiguous',
      h: 'Contiguous allocation',
      why: 'the first way to place processes',
      lead: 'We know how addresses are translated. Next question: where to put each process? Main memory must hold both the OS and the user processes, and it is limited, so it must be allocated efficiently.',
      html: `
<p><b>Memory allocation</b> is the process of assigning blocks of memory on request. The slide "Memory allocation strategies" divides the strategies into two families:</p>
<div data-viz="0"></div>
<ul>
  <li><b>Contiguous</b>: whenever a process asks for main memory, it gets <b>one continuous segment</b> from the empty region, based on its size. Two schemes: <b>variable partition</b> and <b>fixed partition</b>.</li>
  <li><b>Non-contiguous</b>: each process gets a <b>series of non-contiguous blocks</b> that can be located anywhere in physical memory. This leads to paging, later in the module.</li>
</ul>
<p>We start with the simpler family. In <b>contiguous allocation</b> main memory is usually divided into two <b>partitions</b>: the <b>resident operating system</b>, usually held in <b>low memory</b> together with the <b>interrupt vector</b>, and the <b>user processes</b>, held in <b>high memory</b>. Each process is contained in a <b>single contiguous section</b> of memory.</p>
<p><b>Protection</b> combines the two ideas we already have. <b>Relocation registers</b> are used to protect user processes from each other, and from changing operating-system code and data:</p>
<ul>
  <li>the <b>base (relocation) register</b> contains the value of the <b>smallest physical address</b>;</li>
  <li>the <b>limit register</b> contains the <b>range of logical addresses</b> — each logical address must be <b>less than</b> the limit register;</li>
  <li>the <b>MMU</b> maps the logical address <b>dynamically</b>.</li>
</ul>
<div data-viz="1"></div>
<p>Look at the order in the slide figure: the hardware <b>first</b> compares the <b>logical</b> address with the limit, and only <b>then</b> adds the relocation register. The base/limit picture before compared the <b>physical</b> address with base and base + limit. Both protect the same region; here one comparison is enough, because logical addresses always start at 0. Example (Silberschatz): relocation = 100040, limit = 74600 → logical addresses 0 … 74599 are legal and map to physical 100040 … 174639.</p>
<p>When the scheduler selects a process, the dispatcher loads its relocation and limit registers as part of the context switch (Silberschatz). Since every address is checked, the other processes and the OS stay safe.</p>`,
      viz: [
        { name: 'tree', caption: 'Memory allocation strategies (slide 15).', props: { root: { label: 'Memory allocation', children: [
          { label: 'Contiguous', note: 'one continuous segment per process', tone: 'acc', children: [{ label: 'Variable partition scheme' }, { label: 'Fixed partition scheme' }] },
          { label: 'Non-contiguous', note: 'blocks anywhere in memory → paging', tone: 'ok' }] } } },
        { name: 'graph', caption: 'Hardware support for relocation and limit registers (slide 18): check the logical address first, then relocate.', props: {
          w: 720, h: 230,
          nodes: [
            { id: 'cpu', label: 'CPU', x: 45, y: 70, w: 70, tone: 'muted' },
            { id: 'lt', label: 'logical < limit register?', x: 235, y: 70, w: 190, tone: 'acc' },
            { id: 'add', label: '+ relocation register', x: 465, y: 70, w: 170, tone: 'acc' },
            { id: 'mem', label: 'memory', x: 665, y: 70, w: 90, tone: 'ok' },
            { id: 'trap', label: 'trap: addressing error', x: 235, y: 190, w: 200, tone: 'bad' }],
          edges: [
            { from: 'cpu', to: 'lt', label: 'logical' },
            { from: 'lt', to: 'add', label: 'yes', tone: 'ok' },
            { from: 'add', to: 'mem', label: 'physical', tone: 'ok' },
            { from: 'lt', to: 'trap', label: 'no', tone: 'bad' }] } }
      ],
      takeaway: 'Contiguous allocation: the OS in low memory (with the interrupt vector), each user process in one contiguous block in high memory. Relocation register = smallest physical address, limit register = range of logical addresses; the MMU checks logical &lt; limit, then adds the relocation value.',
      exam: 'Contiguous vs non-contiguous allocation; draw the relocation + limit hardware and explain the order of the operations.'
    },
    {
      id: 'partitions',
      h: 'Variable and fixed partitions',
      why: 'how memory is cut into pieces',
      lead: 'Contiguous allocation still leaves a choice: are the partitions cut to fit each arriving process, or is memory divided into fixed pieces in advance?',
      html: `
<p><b>Variable partition</b>: partition sizes are chosen for efficiency — each one is sized to a given process’s needs.</p>
<ul>
  <li>A <b>hole</b> is a block of available memory; holes of various sizes are scattered throughout memory.</li>
  <li>When a process arrives, it is allocated memory from a hole large enough to accommodate it.</li>
  <li>When a process exits, it frees its partition, and <b>adjacent free partitions are combined</b> into one bigger hole.</li>
  <li>The operating system maintains information about (a) <b>allocated partitions</b> and (b) <b>free partitions (holes)</b>.</li>
  <li>The <b>degree of multiprogramming</b> (how many processes are in memory) is limited by the number of partitions.</li>
</ul>
<p>The slide figure shows how holes appear. Read the table row by row (memory listed from high to low addresses):</p>
<table class="t">
  <tr><th>Step</th><th>Memory, high → low</th></tr>
  <tr><td>1. start</td><td>OS · process 5 · process 8 · process 2</td></tr>
  <tr><td>2. process 8 exits</td><td>OS · process 5 · <i>hole</i> · process 2</td></tr>
  <tr><td>3. process 9 arrives and takes part of the hole</td><td>OS · process 5 · process 9 · <i>smaller hole</i> · process 2</td></tr>
  <tr><td>4. process 5 exits</td><td>OS · <i>hole</i> · process 9 · <i>smaller hole</i> · process 2</td></tr>
</table>
<p>After only a few steps the free memory is split into separate holes. That is the seed of <b>external fragmentation</b>.</p>
<p><b>Fixed partition</b>: memory is divided into a <b>fixed number of partitions</b> in advance.</p>
<ul>
  <li>In every partition <b>only one process</b> is accommodated.</li>
  <li>The degree of multiprogramming is restricted by the number of partitions in memory.</li>
  <li>The maximum size of a process is restricted by the maximum size of a partition.</li>
</ul>
<p>Comparing the two: fixed partitions are easy to manage, but a small process in a large partition wastes the rest of it (<b>internal fragmentation</b>). Variable partitions waste nothing inside a partition, but leave scattered holes between partitions (<b>external fragmentation</b>). Before we measure that waste, we need a rule for choosing a hole.</p>`,
      takeaway: 'Variable partitions are cut to size from holes; when a process exits, adjacent holes merge; the OS tracks allocated and free partitions. Fixed partitions are set in advance: one process each, the number of partitions limits multiprogramming, the largest partition limits the process size.',
      exam: 'Definition of a hole; the four-step figure (processes 5, 8, 2, 9); the two limits of fixed partitions.'
    },
    {
      id: 'allocation',
      h: 'Storage-allocation algorithms: first-fit, best-fit, worst-fit',
      why: 'which hole to choose',
      lead: 'With variable partitions the OS keeps a list of holes. When a request of size n arrives, several holes may be big enough. Which one should it use?',
      html: `
<p>How do we satisfy a request of size <b>n</b> from a list of free holes? Three classic rules:</p>
<ul>
  <li><b>First-fit</b>: allocate the <b>first</b> hole that is big enough. The search stops at the first match, so it is fast.</li>
  <li><b>Best-fit</b>: allocate the <b>smallest</b> hole that is big enough. It must search the entire list, unless the list is ordered by size. It produces the <b>smallest leftover hole</b>.</li>
  <li><b>Worst-fit</b>: allocate the <b>largest</b> hole. It must also search the entire list. It produces the <b>largest leftover hole</b> (the hope is that a big leftover is still useful).</li>
</ul>
<p>The slide’s conclusion: <b>first-fit and best-fit are better than worst-fit</b> in terms of speed and storage utilization.</p>
<p>Try the rules on a classic exercise (Silberschatz): holes of 100, 500, 200, 300 and 600 KB, in this order, and requests of 212, 417, 112 and 426 KB, served in this order. Switch between the three strategies:</p>
<div data-viz="0"></div>
<p>The same results in one table (each cell: hole used → what is left of it):</p>
<table class="t">
  <tr><th>Request</th><th>First-fit</th><th>Best-fit</th><th>Worst-fit</th></tr>
  <tr><td>212 KB</td><td>500 → 288 left</td><td>300 → 88 left</td><td>600 → 388 left</td></tr>
  <tr><td>417 KB</td><td>600 → 183 left</td><td>500 → 83 left</td><td>500 → 83 left</td></tr>
  <tr><td>112 KB</td><td>288 → 176 left</td><td>200 → 88 left</td><td>388 → 276 left</td></tr>
  <tr><td>426 KB</td><td><b>must wait</b></td><td>600 → 174 left</td><td><b>must wait</b></td></tr>
</table>
<p>The pattern: only best-fit places all four requests, because it keeps the big 600 KB hole intact for the big last request. With first-fit and worst-fit the 426 KB request must wait, although 959 KB are free in total — the free memory is split into pieces that are each too small. That is <b>external fragmentation</b>, the topic of the next section. (On other request sequences first-fit can win; no rule is best every time.)</p>`,
      viz: [{ name: 'memAlloc', caption: 'Classic exercise (Silberschatz): holes 100, 500, 200, 300, 600 KB; requests 212, 417, 112, 426 KB. Switch the strategy with the tabs.', props: { holes: [100, 500, 200, 300, 600], requests: [212, 417, 112, 426], strategy: 'first' } }],
      takeaway: 'First-fit = first hole that is big enough (fast); best-fit = smallest hole that is big enough (smallest leftover); worst-fit = largest hole (largest leftover). First-fit and best-fit beat worst-fit in speed and storage utilization.',
      exam: 'Apply the three algorithms to a list of holes and requests; say which request must wait and why that is external fragmentation.'
    },
    {
      id: 'fragmentation',
      h: 'Fragmentation and compaction',
      why: 'the price of contiguous allocation',
      lead: 'The fit exercise ended with a request that could not be served although there was enough free memory in total. This waste is called fragmentation, and it is the main weakness of contiguous allocation.',
      html: `
<p>As processes are loaded into memory and removed, the available memory is broken into pieces. When the pieces are too small to be assigned to any process, they stay idle. There are two kinds of this waste:</p>
<div class="cols">
  <div class="callout warn"><b>External fragmentation</b>: the total free memory is enough to satisfy a request, but it is <b>not contiguous</b> — it is scattered in holes <i>between</i> the allocated blocks. Typical of <b>variable partitions</b>.</div>
  <div class="callout warn"><b>Internal fragmentation</b>: the allocated memory is slightly <b>larger</b> than the requested memory; the difference is memory <b>internal to a partition</b> that is not used. Typical of <b>fixed partitions</b>.</div>
</div>
<p>How bad is external fragmentation? <b>Statistical analysis of first-fit</b> shows that, given <b>N</b> allocated blocks, another <b>0.5 N</b> blocks are lost to fragmentation. Of 1.5 N blocks, 0.5 N are wasted, so <b>one third of memory may be unusable</b>. This is the <b>50-percent rule</b>:</p>
<div class="formula">lost / total = 0.5 N / (N + 0.5 N) = 1/3</div>
<p><b>Compaction</b> reduces external fragmentation: <b>shuffle the memory contents</b> to place all free memory together in one large block. It has conditions and costs:</p>
<ul>
  <li>compaction is possible <b>only if relocation is dynamic, done at execution time</b> — moving a process means changing its relocation register; with compile-time or load-time binding its addresses are fixed;</li>
  <li>it is expensive, because a lot of memory must be copied (Silberschatz);</li>
  <li>the <b>I/O problem</b>: if a process waits for I/O into its buffer and we move it, the device would write into the old location. Two fixes: <b>latch</b> (pin) the job in memory while it is involved in I/O, or <b>do I/O only into OS buffers</b> and copy the data afterwards.</li>
</ul>
<p>The other solution (Silberschatz) is more radical: let the physical memory of a process be <b>non-contiguous</b>, so that it can use any free memory, wherever it is. That is the idea of paging.</p>`,
      takeaway: 'External fragmentation = enough free memory in total, but not contiguous (variable partitions); internal fragmentation = unused space inside an allocated block (fixed partitions). 50-percent rule: N blocks → 0.5 N lost → 1/3 unusable. Compaction helps but needs execution-time relocation and has an I/O problem; the real cure is non-contiguous allocation.',
      exam: 'Internal vs external fragmentation and the scheme where each appears; the 50-percent rule; when compaction is possible and the I/O problem.'
    },
    {
      id: 'paging',
      h: 'Non-contiguous allocation and paging',
      why: 'remove external fragmentation',
      lead: 'External fragmentation exists because a process needs one contiguous block. If a process could be split into pieces that go anywhere, every free piece of memory would be usable.',
      html: `
<p>In <b>non-contiguous allocation</b> each process is allocated a series of non-contiguous blocks that can be located anywhere in physical memory; a process gets physical memory wherever it is available. In the slide figure, a process P of two 2 KB blocks is placed into two separate free 2 KB slots, between spaces that are already filled.</p>
<p><b>Paging</b> is the standard way to do this. The trick is to make all pieces the <b>same size</b>:</p>
<ul>
  <li>divide <b>physical memory</b> into fixed-sized blocks called <b>frames</b>. The size is a <b>power of 2</b>, between <b>512 bytes and 16 MB</b>;</li>
  <li>divide <b>logical memory</b> into blocks of the same size called <b>pages</b>;</li>
  <li>the <b>backing store</b> (disk) is likewise split into blocks of the same size;</li>
  <li>keep track of all <b>free frames</b>. To run a program of size <b>N pages</b>, find <b>N free frames</b> (any N, anywhere) and load the program.</li>
</ul>
<p>Since every free frame can hold every page, a hole can never be "too small": paging <b>avoids external fragmentation</b>. It still has <b>internal fragmentation</b>, because the last page of a process is usually not full.</p>
<p>The slide example: frames of 2 KB; process P1 has two pages (2 + 2 = 4 KB), and so does process P2. After loading, physical memory holds P1, P2, P1, P2 in alternating frames, plus one free 2 KB frame. Neither process is contiguous, and it does not matter.</p>
<div class="callout analogy">Think of a parking lot with equal spaces: a company with 4 cars does not need 4 adjacent spaces — any 4 free spaces will do. It only needs a list saying which car is in which space. That list is the page table.</div>`,
      takeaway: 'Paging: physical memory in frames, logical memory in pages of the same power-of-2 size (512 bytes – 16 MB); any free frame can hold any page. No external fragmentation, only internal (in the last page). The price: a table that records which frame holds each page.',
      exam: 'Definitions of frame and page; why paging has no external fragmentation but still has internal fragmentation.'
    },
    {
      id: 'translation',
      h: 'Address translation with a page table',
      why: 'find the frame of every page',
      lead: 'The pages of a process are scattered, but the CPU still generates simple logical addresses 0, 1, 2, … For each address the hardware must find the frame that holds its page. That is the job of the page table.',
      html: `
<p>For each process the OS sets up a <b>page table</b> that translates logical to physical addresses: entry <i>i</i> holds the frame number of page <i>i</i>. In the slide figure the page table is [1, 4, 3, 7]: page 0 is in frame 1, page 1 in frame 4, page 2 in frame 3 and page 3 in frame 7.</p>
<p>Every address generated by the CPU is divided into two parts:</p>
<ul>
  <li>the <b>page number (p)</b> — used as an index into the page table, which contains the base address (frame) of each page in physical memory;</li>
  <li>the <b>page offset (d)</b> — combined with that base address to define the physical memory address that is sent to the memory unit.</li>
</ul>
<p>Because the page size is a power of 2, the split is just a split of bits. For a logical address space of <b>2<sup>m</sup></b> and a page size of <b>2<sup>n</sup></b>, the <b>high-order m − n bits</b> are the page number and the <b>low-order n bits</b> are the offset:</p>
<div class="formula">logical address = [ p : m − n bits | d : n bits ]<br>p = address div 2<sup>n</sup> · d = address mod 2<sup>n</sup><br>physical address = f × 2<sup>n</sup> + d, i.e. the bits [ f | d ]</div>
<p>Example: a 32-bit address with 4 KB = 2<sup>12</sup> pages has a 20-bit page number and a 12-bit offset. Type any address below to see the split:</p>
<div data-viz="0"></div>
<p><b>Paging hardware</b> (slide 30), step by step:</p>
<ol class="steps">
  <li>The CPU produces a logical address; the hardware splits it into p and d.</li>
  <li>p selects an entry of the page table; the entry gives the frame number f.</li>
  <li>f replaces p, and d is copied unchanged: [f | d] is the physical address, d bytes into frame f. (In the figure a frame spans 0x000 to 0xfff, i.e. 4 KB.)</li>
</ol>
<p>Notice the cost: the page table is consulted on <b>every</b> memory access. This becomes the main performance problem a few sections later.</p>`,
      viz: [{ name: 'bitSplit', caption: '32-bit logical address with 4 KB pages: 20-bit page number, 12-bit offset.', props: { fields: [{ label: 'p (page number)', bits: 20 }, { label: 'd (offset)', bits: 12 }], address: '0x00403004', note: 'p indexes the page table, d is copied unchanged into the physical address' } }],
      takeaway: 'Logical address = page number p (high m − n bits) + offset d (low n bits). The page table maps p → frame f; physical address = f × page size + d. The offset never changes during translation.',
      exam: 'Given m and n, how many bits p and d have; translate an address through a page table; draw the paging hardware.'
    },
    {
      id: 'paging-example',
      h: 'Worked example: 32-byte memory, 4-byte pages',
      why: 'translate addresses by hand',
      lead: 'The slides give a tiny paging example that is perfect for the exam: every address can be translated by hand.',
      html: `
<p>Data from the slide: <b>n = 2</b> and <b>m = 4</b>, so the page size is 2<sup>2</sup> = <b>4 bytes</b> and the logical address space is 2<sup>4</sup> = <b>16 bytes</b> (4 pages holding the letters a … p). Physical memory is <b>32 bytes</b>, i.e. 32 / 4 = <b>8 frames</b>. The page table is <b>[5, 6, 1, 2]</b>.</p>
<div class="callout note">The slide says "physical memory of 32 bytes (8 pages)". For physical memory the correct word is <b>frames</b>: 8 frames of 4 bytes.</div>
<p>A logical address has 4 bits: the high 2 bits are p, the low 2 bits are d. To translate: p = address div 4, d = address mod 4, physical address = frame × 4 + d. The table works through the typical exam addresses:</p>
<table class="t">
  <tr><th>Logical address</th><th>Content</th><th>p, d</th><th>Frame</th><th>Physical address</th></tr>
  <tr><td>0</td><td>a</td><td>0, 0</td><td>5</td><td>5 × 4 + 0 = <b>20</b></td></tr>
  <tr><td>3</td><td>d</td><td>0, 3</td><td>5</td><td>5 × 4 + 3 = <b>23</b></td></tr>
  <tr><td>4</td><td>e</td><td>1, 0</td><td>6</td><td>6 × 4 + 0 = <b>24</b></td></tr>
  <tr><td>13</td><td>n</td><td>3, 1</td><td>2</td><td>2 × 4 + 1 = <b>9</b></td></tr>
</table>
<p>Check with the slide picture: physical address 20 holds "a", 24 holds "e", and the frame starting at 8 holds m n o p, so address 9 is "n". Pages 2 and 3 (i … p) sit in frames 1 and 2, physically <i>before</i> pages 0 and 1 — the process never notices. Move the slider to translate any other address:</p>
<div data-viz="0"></div>`,
      viz: [{ name: 'paging', caption: 'Slide 28: page size 4 bytes, 32-byte memory (8 frames), page table [5, 6, 1, 2].', props: { pageSize: 4, pages: [5, 6, 1, 2], frames: 8, address: 13, tlb: false } }],
      takeaway: 'Page table [5, 6, 1, 2], page size 4: logical 0 → 20, 3 → 23, 4 → 24, 13 → 9. Method: p = a div size, d = a mod size, physical = frame × size + d.',
      exam: 'Translate a logical address with the slide page table [5, 6, 1, 2] — for example 13 → 9.'
    },
    {
      id: 'internal-frag',
      h: 'Internal fragmentation in paging — the calculation',
      why: 'what paging still wastes',
      lead: 'Paging removed external fragmentation, but a process is rarely an exact multiple of the page size, so its last frame is partly empty. How much does that cost, and should pages be small?',
      html: `
<p>The slide example:</p>
<div class="formula">page size = 2,048 bytes · process size = 72,766 bytes<br>72,766 = 35 × 2,048 + 1,086 → <b>35 pages + 1,086 bytes</b> → the process needs <b>36 frames</b><br>internal fragmentation = 2,048 − 1,086 = <b>962 bytes</b></div>
<ul>
  <li><b>Worst case</b>: a process needs n pages + 1 byte. It gets n + 1 frames, and almost a whole frame is wasted: <b>1 frame − 1 byte</b>.</li>
  <li><b>On average</b>: fragmentation is <b>1/2 frame</b> per process.</li>
</ul>
<p>So are <b>small frame sizes desirable</b>? They waste less per process — but <b>each page-table entry takes memory to track</b>, and smaller pages mean more entries (and less efficient disk I/O, Silberschatz). In practice <b>page sizes have grown over time</b>, and some systems support more than one size: <b>Solaris supports two page sizes — 8 KB and 4 MB</b>.</p>`,
      takeaway: 'Frames needed = size / page size, rounded up; waste = page size − (size mod page size). 72,766 bytes with 2,048-byte pages → 36 frames, 962 bytes wasted. Worst case 1 frame − 1 byte, average ½ frame. Small pages waste less but need bigger page tables.',
      exam: 'Compute the number of frames and the internal fragmentation for given sizes (962 bytes); worst and average case; why pages are not made very small.'
    },
    {
      id: 'free-frames',
      h: 'Free frames and the per-process page table',
      why: 'how the OS hands out frames',
      lead: 'To load a process of N pages the OS needs N free frames. How does it know which frames are free?',
      html: `
<p>The OS keeps two kinds of information:</p>
<ul>
  <li>a <b>page table for each process</b>, which contains the frame location of each page of that process;</li>
  <li>a pool of free frames, the <b>free-frame list</b>, used to allocate frames dynamically.</li>
</ul>
<p>The slide example. <b>Before allocation</b> the free-frame list is 14, 13, 18, 20, 15, and a new process with 4 pages (pages 0–3) waits on disk. <b>After allocation</b> the OS has taken the first four frames from the list:</p>
<table class="t">
  <tr><th>Page</th><th>0</th><th>1</th><th>2</th><th>3</th></tr>
  <tr><td>Frame</td><td>14</td><td>13</td><td>18</td><td>20</td></tr>
</table>
<p>The new-process page table is [14, 13, 18, 20], and the free-frame list now contains only <b>15</b>. The frames are not in order and not adjacent — paging does not care.</p>
<p>(Silberschatz) The OS also keeps a system-wide <b>frame table</b> with one entry per physical frame, saying whether the frame is free and, if not, which page of which process it holds. And because a user program only knows logical addresses, the OS must translate them itself when a process passes an address to a system call — so the page table is part of each process’s context.</p>`,
      takeaway: 'The OS keeps one page table per process and a free-frame list. Loading a 4-page process with the free list 14, 13, 18, 20, 15 gives the page table [14, 13, 18, 20] and leaves frame 15 free.'
    },
    {
      id: 'tlb',
      h: 'Implementing the page table — and the TLB',
      why: 'make translation fast',
      lead: 'A real page table has thousands or millions of entries, so it cannot live in CPU registers. It stays in main memory — and that doubles the cost of every memory access.',
      html: `
<p>The page table of each process is kept in <b>main memory</b>. Two registers locate it:</p>
<ul>
  <li>the <b>page-table base register (PTBR)</b> points to the page table;</li>
  <li>the <b>page-table length register (PTLR)</b> indicates the size of the page table.</li>
</ul>
<p>A context switch only has to reload the PTBR (Silberschatz). But in this scheme <b>every data/instruction access requires two memory accesses</b>: one for the page-table entry and one for the data or instruction itself. Memory would become twice as slow.</p>
<p>The <b>two-memory-access problem</b> is solved by a special fast-lookup hardware cache called the <b>translation look-aside buffer (TLB)</b>, also called <b>associative memory</b>. It remembers recent translations page → frame.</p>
<p><b>Associative memory</b> means <b>parallel search</b>: the page number is compared with <b>all</b> TLB entries (page #, frame #) at the same time. Address translation (p, d):</p>
<ol class="steps">
  <li>If p is in an associative register (<b>TLB hit</b>), get the frame # out — no page-table access is needed.</li>
  <li>Otherwise (<b>TLB miss</b>), get the frame # from the page table in memory.</li>
  <li>On a TLB miss, the value is <b>loaded into the TLB</b> for faster access next time.</li>
</ol>
<div data-viz="0"></div>
<p>Facts about real TLBs:</p>
<ul>
  <li>TLBs are typically <b>small: 64 to 1,024 entries</b> (parallel-search hardware is expensive).</li>
  <li>Some TLBs store <b>address-space identifiers (ASIDs)</b> in each entry. An ASID uniquely identifies each process and provides address-space protection: an entry is used only if its ASID matches the running process. Without ASIDs the TLB must be <b>flushed</b> (emptied) at every context switch; otherwise the next process would use the old process’s translations.</li>
  <li><b>TLB update algorithms</b>: if the TLB is full, a new translation must replace an entry. Several strategies exist: <b>Least Recently Used (LRU)</b>, <b>Round Robin</b>, <b>Random</b>, …</li>
  <li>Some entries can be <b>wired down</b>: they are never replaced, for permanent fast access — e.g. entries for <b>kernel code</b>.</li>
</ul>
<p>Why can a table of 64–1,024 entries help a process with thousands of pages? Programs show <b>locality</b>: for a while they keep using the same few pages (Silberschatz), so most lookups hit. The next section measures how much that matters.</p>`,
      viz: [{ name: 'graph', caption: 'Paging hardware with TLB (slide 36): a hit gives f directly; a miss reads the page table in memory and loads the entry into the TLB.', props: {
        w: 680, h: 280,
        nodes: [
          { id: 'cpu', label: 'CPU', sub: 'logical p | d', x: 60, y: 90, w: 100, h: 52, tone: 'muted' },
          { id: 'tlb', label: 'TLB', sub: 'parallel search', x: 245, y: 90, w: 130, h: 52, tone: 'acc' },
          { id: 'fd', label: 'f | d', sub: 'physical address', x: 450, y: 90, w: 120, h: 52 },
          { id: 'mem', label: 'physical memory', x: 610, y: 90, w: 120, tone: 'ok' },
          { id: 'pt', label: 'page table', sub: 'in main memory', x: 345, y: 225, w: 150, h: 52, tone: 'warn' }],
        edges: [
          { from: 'cpu', to: 'tlb', label: 'p' },
          { from: 'tlb', to: 'fd', label: 'hit: f', tone: 'ok' },
          { from: 'tlb', to: 'pt', label: 'miss', tone: 'warn' },
          { from: 'pt', to: 'fd', label: 'f (also loaded into TLB)', tone: 'warn' },
          { from: 'fd', to: 'mem' }] } }],
      takeaway: 'The page table lives in memory (PTBR, PTLR), so each reference costs two accesses. The TLB — associative memory, 64 to 1,024 entries, parallel search — caches recent page → frame translations; a miss loads the entry. ASIDs avoid flushing at a context switch; LRU / round robin / random replacement; wired-down entries (kernel code) stay.',
      exam: 'Why simple paging needs two memory accesses; what a TLB is and how hit and miss work; ASIDs vs flushing; wired-down entries.'
    },
    {
      id: 'eat',
      h: 'Effective access time (EAT)',
      why: 'measure the benefit of the TLB',
      lead: 'A TLB hit costs one memory access, a miss costs two. The average cost therefore depends on how often we hit — the hit ratio.',
      html: `
<p>The <b>hit ratio</b> is the percentage of times that the page number is found in the TLB. An 80% hit ratio means that we find the desired page number in the TLB 80% of the time.</p>
<p>Suppose one memory access takes <b>10 nanoseconds</b>:</p>
<ul>
  <li>TLB hit → the mapped-memory access takes <b>10 ns</b> (only the data access);</li>
  <li>TLB miss → two memory accesses (page table + data) → <b>20 ns</b>.</li>
</ul>
<p>The <b>effective access time (EAT)</b> is the weighted average of the two cases:</p>
<div class="formula">EAT = hit ratio × 10 + (1 − hit ratio) × 20<br>80%: EAT = 0.80 × 10 + 0.20 × 20 = <b>12 ns</b> → <b>20% slowdown</b> in access time<br>99%: EAT = 0.99 × 10 + 0.01 × 20 = <b>10.1 ns</b> → only <b>1% slowdown</b></div>
<p>The slowdown is measured against 10 ns, the access time without paging. With a realistic hit ratio of 99%, paging costs almost nothing. In general, with hit ratio α and memory access time m: EAT = α × m + (1 − α) × 2m = (2 − α) × m. (Like the slides, this ignores the time to search the TLB itself, which is tiny compared with a memory access.)</p>
<div data-viz="0"></div>`,
      viz: [{ name: 'paging', caption: 'Scroll to the TLB part: move the hit-ratio slider (80% → 12 ns, 99% → 10.1 ns).', props: { pageSize: 4, pages: [5, 6, 1, 2], frames: 8, address: 13, tlb: { hit: 0.8, mem: 10 } } }],
      takeaway: 'EAT = α × m + (1 − α) × 2m. With m = 10 ns: 80% hits → 12 ns (20% slower), 99% hits → 10.1 ns (1% slower). A good TLB makes paging almost free.',
      exam: 'Compute the EAT for a given hit ratio and memory access time, and state the slowdown (12 ns / 20%, 10.1 ns / 1%).'
    },
    {
      id: 'protection',
      h: 'Memory protection in a paged system',
      why: 'protect pages, catch bad addresses',
      lead: 'With base and limit, protection was one comparison. With paging there is no single region to check — but the page table itself can carry protection information, page by page.',
      html: `
<p><b>Protection bits.</b> Memory protection is implemented by associating a <b>protection bit</b> with each frame to indicate whether <b>read-only</b> or <b>read-write</b> access is allowed. More bits can be added to indicate execute-only pages, and so on. The bits are kept in the page-table entry, so they are checked during translation at no extra cost (Silberschatz).</p>
<p><b>Valid–invalid bit.</b> Each entry in the page table also has a <b>valid–invalid bit</b>:</p>
<ul>
  <li><b>"valid" (v)</b> — the page is in the process’s logical address space, so it is a legal page;</li>
  <li><b>"invalid" (i)</b> — the page is not in the process’s logical address space.</li>
</ul>
<p>Alternatively, the OS can use the <b>page-table length register (PTLR)</b>: a page number beyond the length of the table is illegal. <b>Any violation results in a trap to the kernel.</b></p>
<p>The slide example (the numbers are explained in Silberschatz): a 14-bit address space (addresses 0–16,383), pages of 2 KB, and a program that uses only addresses 0 to 10,468. It needs pages 0–5:</p>
<table class="t">
  <tr><th>Page</th><th>0</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th></tr>
  <tr><td>Frame</td><td>2</td><td>3</td><td>4</td><td>7</td><td>8</td><td>9</td><td>0</td><td>0</td></tr>
  <tr><td>Bit</td><td>v</td><td>v</td><td>v</td><td>v</td><td>v</td><td>v</td><td>i</td><td>i</td></tr>
</table>
<p>Any address in pages 6 or 7 traps. But look at page 5: it covers addresses 10,240–12,287, while the program ends at 10,468. References from 10,469 to 12,287 are wrong for the program, yet the bit says "valid", because the check works per page, not per byte. This is the internal fragmentation of the 2 KB page again.</p>`,
      takeaway: 'Each page-table entry carries protection bits (read-only / read-write / execute-only) and a valid–invalid bit (or the PTLR is used). Any violation traps to the kernel. Protection works per page, so the unused tail of the last page still counts as valid.',
      exam: 'Meaning of the valid–invalid bit; what happens on an invalid access; the 10,468 / 12,287 example.'
    },
    {
      id: 'shared',
      h: 'Shared pages',
      why: 'one copy of code for many processes',
      lead: 'Every process has its own page table, so two page tables can simply point to the same frame. That makes sharing code easy — and finally shows how shared libraries are implemented.',
      html: `
<p><b>Shared code</b>: one copy of <b>read-only (reentrant) code</b> is shared among processes — for example text editors, compilers, window systems. <b>Reentrant</b> code never modifies itself (Silberschatz), so any number of processes can execute it at the same time, each with its own registers and its own data. This is similar to multiple threads sharing the same process space. Sharing is also useful for <b>interprocess communication</b>, if the sharing of read-write pages is allowed.</p>
<p><b>Private code and data</b>: each process keeps a separate copy of its own code and data, and the pages for private code and data can appear anywhere in the logical address space.</p>
<p>The slide example: processes P1, P2 and P3 all use the C library, pages libc 1 – libc 4. Their three page tables contain the same frames for these pages:</p>
<table class="t">
  <tr><th>Page</th><th>libc 1</th><th>libc 2</th><th>libc 3</th><th>libc 4</th></tr>
  <tr><td>Frame (in P1, P2 and P3)</td><td>3</td><td>4</td><td>6</td><td>1</td></tr>
</table>
<p>So physical memory holds <b>one</b> copy of libc (frames 1, 3, 4 and 6) instead of three. The read-only protection bit guarantees that no process can modify the shared code.</p>`,
      takeaway: 'Reentrant (read-only, non-self-modifying) code can be shared: the page tables of several processes point to the same frames (libc 1–4 → frames 3, 4, 6, 1 for P1, P2, P3). Private code and data stay separate. Shared read-write pages can also be used for IPC.',
      exam: 'What reentrant code is; draw or explain the libc example with three processes.'
    },
    {
      id: 'pt-size',
      h: 'The page-table size problem',
      why: 'page tables get huge',
      lead: 'Paging plus a TLB is fast. But we have not asked how big the page table is. For modern address spaces the straightforward table is enormous.',
      html: `
<p>Memory structures for paging can get huge with straightforward methods. Consider a <b>32-bit logical address space</b>, as on modern computers, with a page size of <b>4 KB (2<sup>12</sup>)</b>:</p>
<div class="formula">entries = 2<sup>32</sup> / 2<sup>12</sup> = 2<sup>20</sup> ≈ <b>1 million</b><br>size = 2<sup>20</sup> × 4 bytes = <b>4 MB</b> of page table for <b>each</b> process</div>
<p>And we do not want to allocate those 4 MB <b>contiguously</b> in main memory — that would bring back the contiguous-allocation problem that paging was meant to remove. Most entries would also be useless, because a typical process uses only a small part of its address space.</p>
<p>The simplest solution is to <b>divide the page table into smaller units</b>. The next sections present three structures:</p>
<ol>
  <li><b>Hierarchical paging</b> — page the page table itself;</li>
  <li><b>Hashed page tables</b> — store only the pages in use and find them by hashing;</li>
  <li><b>Inverted page tables</b> — one entry per physical frame instead of one per logical page.</li>
</ol>`,
      takeaway: '32-bit addresses with 4 KB pages → 2<sup>20</sup> (1 million) entries × 4 bytes = 4 MB of page table per process, which we do not want to allocate contiguously. Solutions: hierarchical, hashed, inverted page tables.',
      exam: 'Compute the size of a one-level page table (4 MB) and name the three structures that solve the problem.'
    },
    {
      id: 'hierarchical',
      h: 'Hierarchical (two-level) paging',
      why: 'page the page table',
      lead: 'If the page table is too big to be contiguous, treat it like any other big object: split it into pages, and keep a small table that says where those pages are.',
      html: `
<p><b>Hierarchical paging</b> breaks up the logical address space into multiple page tables. A simple technique is a <b>two-level page table</b>: we <b>page the page table</b>. The <b>outer page table</b> points to the pages of the page table; each of those pages points to frames in memory (slide figure: outer page table → pages of the page table with entries such as 1, 500, 100, 708, 929, 900 → those memory frames).</p>
<p><b>Two-level paging example</b> — a 32-bit machine with 4 KB pages. A logical address is first divided into a <b>20-bit page number</b> and a <b>12-bit page offset</b>. Since the page table is paged, the page number is further divided into a <b>10-bit p1</b> and a <b>10-bit p2</b>:</p>
<div class="formula">[ p1 : 10 | p2 : 10 | d : 12 ]<br>p1 = index into the outer page table · p2 = displacement within the page of the inner page table · d = offset in the frame</div>
<p>Why 10 + 10? One 4 KB page holds 4,096 / 4 = 1,024 = 2<sup>10</sup> entries of 4 bytes, so every piece of the page table fits exactly in one frame (Silberschatz). Try the address 0x00403004:</p>
<div data-viz="0"></div>
<p><b>Address translation</b> (slide 46), step by step:</p>
<ol class="steps">
  <li>p1 selects an entry of the outer page table; it gives the frame that holds one page of the inner page table.</li>
  <li>p2 selects an entry in that page; it gives the frame f of the data.</li>
  <li>d is the offset inside frame f.</li>
</ol>
<p>Because translation works from the outer table inward, this scheme is known as a <b>forward-mapped page table</b>.</p>
<p>Gain and price: inner pages that cover unused parts of the address space need not exist, and no piece of the table needs more than one frame. But without a TLB hit a reference now needs <b>three</b> memory accesses (outer table, inner table, data), so the TLB becomes even more important.</p>`,
      viz: [{ name: 'bitSplit', caption: 'Two-level paging on a 32-bit machine with 4 KB pages (slide 45): 10 | 10 | 12.', props: { fields: [{ label: 'p1', bits: 10 }, { label: 'p2', bits: 10 }, { label: 'd', bits: 12 }], address: '0x00403004', note: 'outer table entry p1, inner table entry p2, offset d' } }],
      takeaway: 'Two-level paging splits the 20-bit page number into p1 (10 bits, outer page table) and p2 (10 bits, page of the inner table); d keeps 12 bits. Each piece of the table fits in one frame. Forward-mapped = translate from the outer table inward. Cost: one more memory access per level.',
      exam: 'Split a 32-bit address into 10 | 10 | 12 (e.g. 0x00403004 → p1 = 1, p2 = 3, d = 4) and explain the role of p1 and p2.'
    },
    {
      id: 'three-level',
      h: '64-bit address spaces — why two levels are not enough',
      why: 'hierarchy does not scale to 64 bits',
      lead: 'Two levels were enough for 32 bits. What happens with a 64-bit logical address space?',
      html: `
<p>With 4 KB (2<sup>12</sup>) pages, a 64-bit address leaves 52 bits for the page number, so the page table has <b>2<sup>52</sup> entries</b>. Try two levels, with inner page tables of one page each (2<sup>10</sup> entries of 4 bytes):</p>
<div class="formula">[ outer page p1 : 42 | inner page p2 : 10 | offset d : 12 ]<br>the outer page table has 2<sup>42</sup> entries = <b>2<sup>44</sup> bytes</b> (16 TB)</div>
<p>One solution is to add a <b>2nd outer page table</b> (three levels):</p>
<div class="formula">[ 2nd outer page p1 : 32 | outer page p2 : 10 | inner page p3 : 10 | offset d : 12 ]<br>the 2nd outer page table is still <b>2<sup>34</sup> bytes</b> (16 GB)</div>
<p>And every level costs one more memory access on a TLB miss: with three levels, possibly <b>4 memory accesses</b> to reach one physical memory location. To make the top table small we would need even more levels, and even more accesses. Conclusion: for 64-bit address spaces, hierarchical page tables are generally considered inappropriate (Silberschatz). We need a structure whose size depends on the pages <b>actually used</b>, not on the size of the address space.</p>`,
      takeaway: '64-bit, 4 KB pages → 2<sup>52</sup> entries. Two levels (42 | 10 | 12) leave an outer table of 2<sup>44</sup> bytes; three levels (32 | 10 | 10 | 12) still leave 2<sup>34</sup> bytes and need up to 4 memory accesses. Hierarchy does not scale to 64 bits.',
      exam: 'Reproduce the numbers 2<sup>52</sup>, 2<sup>44</sup> and 2<sup>34</sup> and the "4 memory accesses" argument.'
    },
    {
      id: 'hashed',
      h: 'Hashed page tables',
      why: 'size follows the pages in use',
      lead: 'A 64-bit process uses only a tiny fraction of its 2<sup>52</sup> possible pages. A hash table stores only those pages and finds them quickly, without walking through many levels.',
      html: `
<p>Hashed page tables are commonly used for address spaces <b>larger than 32 bits</b>. They use a <b>hash table</b>: a data structure in which the index of a data element is generated by a <b>hash function</b> with a <b>key</b> as input. Each slot of the table is a pointer to a <b>linked list</b> of the elements that map to the same hash output.</p>
<p>The slide’s small example: the hash function divides the key (an integer) by 8 and uses the remainder as the index, which gives a number from 0 to 7. Key 16 → slot 0; keys 11, 27 and 19 → slot 3 (all leave remainder 3); keys 22 and 6 → slot 6. Keys that land in the same slot form a chain.</p>
<p><b>As a page table</b>, the key is the logical ("virtual") page number, and the table contains a chain of elements hashing to the same location. Each element contains:</p>
<ol>
  <li>the <b>logical page number</b>;</li>
  <li>the value of the <b>mapped page frame</b>;</li>
  <li>a <b>pointer to the next element</b>.</li>
</ol>
<ol class="steps">
  <li>Hash the page number p of the logical address → one slot of the hash table.</li>
  <li>Walk the chain, comparing p with the logical page number of each element.</li>
  <li>If a match is found, the corresponding physical frame r is extracted; the physical address is [r | d].</li>
</ol>
<p><b>Properties</b> listed on the slides:</p>
<div class="cols">
  <div class="pros"><b>+</b><ul><li>smaller: they store entries only for pages that are currently in use, while a traditional table stores an entry for every possible virtual page number</li><li>more resistant to certain attacks, such as page-table overflow attacks, for the same reason</li><li>can be combined with other structures, such as hierarchical page tables, in a hybrid approach</li></ul></div>
  <div class="cons"><b>−</b><ul><li>more complex to implement: they need a hash function and a collision-resolution strategy</li><li>a long chain means several memory reads (Silberschatz)</li></ul></div>
</div>
<p><b>Clustered page tables</b> are a variation for 64-bit addresses: similar to hashed tables, but each entry refers to <b>several pages</b> (such as 16) rather than one. They are especially useful for <b>sparse</b> address spaces, where memory references are non-contiguous and scattered.</p>`,
      takeaway: 'Hashed page table: hash(p) → slot → chain of (logical page number, frame, next pointer); compare p along the chain. It stores only the pages in use, so it suits address spaces above 32 bits. Clustered page tables: each entry covers several pages (e.g. 16), good for sparse address spaces.',
      exam: 'The three fields of an element and the lookup steps; the mod-8 example; clustered page tables.'
    },
    {
      id: 'inverted',
      h: 'Inverted page tables',
      why: 'one table for the whole machine',
      lead: 'Hierarchical and hashed tables are still one table per process, and with many processes the total is large. The inverted page table turns the idea around: describe the physical frames, not the logical pages.',
      html: `
<p>Rather than each process having a page table and keeping track of all possible logical pages, an <b>inverted page table</b> tracks all <b>physical</b> pages:</p>
<ul>
  <li>there is <b>one entry for each frame</b> of memory: the total number of entries = the number of frames in the physical address space, and there is only one table for the whole system;</li>
  <li>each entry consists of the <b>logical address of the page</b> stored in that physical location, with information about the <b>process that owns that page</b> (its pid).</li>
</ul>
<p><b>Translation</b> (slide 56): the logical address is &lt;pid, p, d&gt;.</p>
<ol class="steps">
  <li>Search the table for the entry that contains &lt;pid, p&gt;.</li>
  <li>If it is found at entry <b>i</b>, then i <i>is</i> the frame number: the physical address is &lt;i, d&gt;.</li>
  <li>If no entry matches, the access is illegal (Silberschatz).</li>
</ol>
<p>Trade-offs:</p>
<ul>
  <li>It <b>decreases the memory</b> needed to store page tables, but <b>increases the time</b> needed to search the table when a page reference occurs: the table is ordered by frame, but we search by page. Real systems limit the search with a hash table and the TLB (Silberschatz).</li>
  <li><b>Shared memory is difficult</b>: the table stores a single entry for each frame, so one frame cannot easily belong to several processes at the same time.</li>
</ul>
<p>The inverted page table and its variations are implemented in <b>PowerPC, UltraSPARC and the IA-64</b> architecture.</p>`,
      takeaway: 'Inverted page table: one entry per physical frame, holding &lt;pid, logical page&gt;; search for &lt;pid, p&gt;, and the index i of the match is the frame. Less memory, but slower search and difficult sharing. Used in PowerPC, UltraSPARC, IA-64.',
      exam: 'Number of entries (= number of frames); how translation works; the two drawbacks.'
    },
    {
      id: 'solaris',
      h: 'Example: Oracle SPARC Solaris',
      why: 'hashing + TLB in a real 64-bit OS',
      lead: 'Solaris on SPARC is a modern 64-bit operating system with tightly integrated hardware. Its goals are efficiency and low overhead, and it shows how hash tables and the TLB work together.',
      html: `
<p>Solaris is based on hashing, but in a more complex way:</p>
<ul>
  <li><b>two hash tables</b>: one for the kernel and one for all user processes; each maps memory addresses from virtual to physical memory;</li>
  <li>each entry represents a <b>contiguous area</b> of mapped virtual memory — more efficient than a separate hash-table entry for each page;</li>
  <li>each entry has a <b>base address</b> and a <b>span</b> (the number of pages the entry represents).</li>
</ul>
<p>Translation is helped by two caches:</p>
<ul>
  <li>the <b>TLB</b> holds <b>translation table entries (TTEs)</b> for fast hardware lookups;</li>
  <li>a cache of TTEs resides in a <b>translation storage buffer (TSB)</b> in memory, which includes an entry per recently accessed page.</li>
</ul>
<div data-viz="0"></div>
<ol class="steps">
  <li>A virtual address reference causes a <b>TLB search</b>. A hit completes the translation.</li>
  <li>On a miss, the <b>hardware walks the in-memory TSB</b> looking for the TTE of that address. If a match is found, the CPU copies the TSB entry into the TLB and the translation completes.</li>
  <li>If no match is found, the <b>kernel is interrupted</b> to search the hash table. The kernel creates a TTE from the appropriate hash table and stores it in the TSB; the interrupt handler returns control to the MMU, which completes the address translation.</li>
</ol>`,
      viz: [{ name: 'flow', caption: 'Solaris address translation: TLB → TSB (hardware walk) → hash table (kernel).', props: { dir: 'h', steps: [
        { label: 'TLB', sub: 'TTEs; hit → done', tone: 'ok' },
        { label: 'TSB in memory', sub: 'walked by the hardware; match → copy into TLB', tone: 'acc' },
        { label: 'hash tables', sub: 'kernel interrupted; builds a TTE, stores it in the TSB', tone: 'warn' },
        { label: 'MMU', sub: 'completes the translation' }] } }],
      takeaway: 'Solaris: two hash tables (kernel, user), entries = base address + span of contiguous virtual memory. Lookup order: TLB (TTEs) → TSB walked by hardware → hash table searched by the kernel, which puts a new TTE into the TSB.',
      exam: 'The three lookup levels (TLB, TSB, hash table) and who handles each (hardware or kernel).'
    },
    {
      id: 'swapping',
      h: 'Swapping',
      why: 'when memory is not enough',
      lead: 'All schemes so far assumed that every process fits in memory at the same time. What if the processes together need more memory than exists?',
      html: `
<p>A process can be <b>swapped</b> temporarily out of memory to a <b>backing store</b>, and then brought back into memory for continued execution. So the <b>total physical memory space of processes can exceed physical memory</b>. Swapping degrades system performance, but it allows larger and more processes to run concurrently.</p>
<p>Swapping has two directions (slide figure):</p>
<ul>
  <li><b>swap out</b> — moving a process from RAM to the disk (step 1 in the figure: process P1 goes to the backing store);</li>
  <li><b>swap in</b> — transferring a program from the disk back into main memory (step 2: process P2 comes back into user space).</li>
</ul>
<p>(Silberschatz) A variant used with priority-based scheduling is called <b>roll out, roll in</b>: a lower-priority process is swapped out so that a higher-priority process can be loaded and executed.</p>
<p><b>The process of swapping</b>:</p>
<ol class="steps">
  <li>When RAM is full and a new program needs to run, the OS selects a program or data that is in RAM but <b>not actively being used</b>.</li>
  <li>The selected data is moved to secondary storage, making space in RAM for the new program.</li>
  <li>When the swapped-out program is needed again, it is swapped back into RAM, replacing another inactive program or data if necessary.</li>
</ol>
<p>Important facts:</p>
<ul>
  <li>The major part of swap time is <b>transfer time</b>; the total transfer time is directly proportional to the <b>amount of memory swapped</b>.</li>
  <li>The system maintains a <b>ready queue</b> of ready-to-run processes whose memory images are on disk.</li>
  <li>Must a swapped-out process come back into the <b>same physical addresses</b>? It depends on the <b>address binding</b> method: with compile- or load-time binding yes; with execution-time binding it can go anywhere. Pending I/O to or from the process memory space must also be considered.</li>
  <li>Modified versions of swapping are found on many systems (UNIX, Linux, Windows): swapping is <b>normally disabled</b>, <b>started</b> if more than a threshold amount of memory is allocated, and <b>disabled again</b> once memory demand falls below the threshold.</li>
</ul>`,
      takeaway: 'Swapping moves a whole process to the backing store (swap out) and back (swap in), so processes can use more memory in total than exists. Swap time is mostly transfer time, proportional to the memory swapped. Whether the process returns to the same addresses depends on address binding.',
      exam: 'Swap in / swap out; why transfer time dominates; the link with address binding; how UNIX/Linux/Windows use a threshold.'
    },
    {
      id: 'swap-cost',
      h: 'Context-switch time with swapping',
      why: 'why whole-process swapping is slow',
      lead: 'Swapping turns a context switch into a disk transfer. The slides compute how long that takes.',
      html: `
<p>If the next process to be put on the CPU is not in memory, the OS must swap out a process and swap in the target process, so the <b>context-switch time can be very high</b>. The slide example:</p>
<div class="formula">process size = 100 MB · disk transfer rate = 50 MB/s<br>swap out: 100 / 50 = 2 s = <b>2000 ms</b><br>plus swap in of a same-sized process: <b>2000 ms</b><br>total context-switch swapping component = <b>4000 ms (4 seconds)</b></div>
<p>Compare: an ordinary context switch takes microseconds (CPU Scheduling module). Four seconds is about a million times more. The time can be reduced by swapping less: reduce the size of memory swapped by knowing how much memory is <b>really being used</b>. A process can inform the OS of its memory use with the system calls <code>request_memory()</code> and <code>release_memory()</code>.</p>
<p><b>Other constraints on swapping</b>:</p>
<ul>
  <li><b>Pending I/O</b>: a process with pending I/O cannot be swapped out, because the I/O would occur to the wrong process (the device would write into memory that now belongs to someone else).</li>
  <li>Or: always transfer I/O to <b>kernel space</b> first, then to the I/O device (or the process). This is known as <b>double buffering</b>, and it adds overhead.</li>
</ul>
<p>The result: <b>standard swapping is not used in modern operating systems</b>. A modified version is common: swap only when free memory is <b>extremely low</b>.</p>`,
      takeaway: '100 MB at 50 MB/s → 2000 ms out + 2000 ms in = 4 s per context switch. Reduce it by swapping only the memory really used (request_memory(), release_memory()). Pending I/O blocks swapping (or needs double buffering). Modern OSes swap only when free memory is extremely low.',
      exam: 'Compute the swap time (4 s); explain the pending-I/O problem and double buffering.'
    },
    {
      id: 'swap-paging',
      h: 'Swapping with paging, and mobile systems',
      why: 'swap pages, not whole processes',
      lead: 'Moving a whole process costs seconds. With paging the OS can move single pages instead — and phones mostly avoid swapping altogether.',
      html: `
<p><b>Swapping with paging</b> (slide 67): instead of swapping entire processes, the OS moves individual <b>pages</b>. A <b>page out</b> moves a page from memory to the backing store; a <b>page in</b> moves it back (Silberschatz). In the figure, pages b, c and e of process A are paged out to slots 4, 5 and 6 of the backing store, while pages f, h and j of process B are paged in from slots 17, 18 and 19. Only a few pages move, which is much cheaper than moving a whole process. (This idea grows into <b>virtual memory</b>, the next topic in Silberschatz.)</p>
<p><b>Swapping on mobile systems</b> is <b>not typically supported</b>. Mobile devices are <b>flash memory based</b>, and flash has:</p>
<ul>
  <li>a small amount of space;</li>
  <li>a limited number of write cycles (swapping would wear it out);</li>
  <li>poor throughput between flash memory and the CPU on mobile platforms.</li>
</ul>
<p>Instead, mobile systems use other methods to free memory when it is low. The two columns compare them:</p>
<table class="t">
  <tr><th>iOS</th><th>Android</th></tr>
  <tr><td><b>asks</b> apps to voluntarily relinquish allocated memory; read-only data is thrown out and reloaded from flash if needed; failure to free memory can result in <b>termination</b></td><td><b>terminates</b> apps if free memory is low, but first writes the <b>application state</b> to flash for a fast restart</td></tr>
</table>
<p>Both operating systems support paging.</p>`,
      takeaway: 'Swapping with paging moves single pages (page out / page in) instead of whole processes — much cheaper. Mobile systems do not swap (small flash, limited write cycles, poor throughput): iOS asks apps to free memory, Android terminates apps after saving their state; both use paging.',
      exam: 'Why mobile systems avoid swapping and what iOS and Android do instead.'
    },
    {
      id: 'intel',
      h: 'Intel IA-32: segmentation + paging',
      why: 'the ideas in a real CPU',
      lead: 'Intel chips dominate the industry. IA-32 combines two translation steps — segmentation first, then paging — so several ideas of this module appear one after the other in one CPU.',
      html: `
<p>Intel 32-bit and 64-bit architectures: Pentium CPUs are 32-bit and called the <b>IA-32</b> architecture; the slides call current 64-bit Intel CPUs the <b>IA-64</b> architecture. There are many variations in the chips; the slides cover the main ideas.</p>
<div class="callout warn">Strictly speaking (Silberschatz), IA-64 is the name of Intel’s Itanium architecture; today’s 64-bit Intel desktop and server CPUs use <b>x86-64</b> (next section). Repeat the slide wording if asked, but know the difference.</div>
<p><b>Segmentation in IA-32.</b> IA-32 supports both segmentation and segmentation with paging. A <b>segment</b> is a variable-size logical block of the program, such as its code or its data (Silberschatz):</p>
<ul>
  <li>each segment can be up to <b>4 GB</b>;</li>
  <li>there can be up to <b>16 K segments per process</b>, divided into two partitions:</li>
  <li>up to <b>8 K</b> segments <b>private</b> to the process, kept in the <b>local descriptor table (LDT)</b>;</li>
  <li>up to <b>8 K</b> segments <b>shared among all processes</b>, kept in the <b>global descriptor table (GDT)</b>.</li>
</ul>
<p><b>Logical → linear → physical.</b></p>
<div data-viz="0"></div>
<ol class="steps">
  <li>The CPU generates a <b>logical address</b> = (selector, offset). The <b>selector</b> is given to the <b>segmentation unit</b>.</li>
  <li>The selector picks a <b>segment descriptor</b> in the descriptor table; the segment base from the descriptor + the offset gives a <b>32-bit linear address</b>.</li>
  <li>The linear address is given to the <b>paging unit</b>, which generates the <b>physical address</b> in main memory. The paging unit forms the equivalent of the MMU.</li>
</ol>
<p>The selector has 16 bits: s (13) | g (1) | p (2). (Silberschatz) s = segment number, g = which table (GDT or LDT), p = protection. 13 bits give 2<sup>13</sup> = 8 K segments per table, and two tables give 16 K — exactly the numbers above.</p>
<div data-viz="1"></div>
<p><b>Paging in IA-32.</b> Page sizes can be <b>4 KB or 4 MB</b>. For 4 KB pages the 32-bit linear address uses the two-level scheme we already know: <b>page directory</b> (bits 31–22, 10 bits) | <b>page table</b> (bits 21–12, 10 bits) | <b>offset</b> (bits 11–0, 12 bits). The <b>CR3 register</b> points to the page directory of the current process (it plays the role of the PTBR). For a <b>4 MB page</b>, the page-directory entry points directly to the page, and the offset takes the remaining 22 bits (bits 21–0):</p>
<div data-viz="2"></div>`,
      viz: [
        { name: 'flow', caption: 'Logical to physical address translation in IA-32 (slide 71).', props: { dir: 'h', steps: [
          { label: 'CPU', sub: 'logical address (selector, offset)', tone: 'muted' },
          { label: 'segmentation unit', sub: 'descriptor base + offset', tone: 'acc' },
          { label: 'paging unit', sub: 'linear address → page directory → page table', tone: 'warn' },
          { label: 'physical memory', sub: 'physical address', tone: 'ok' }] } },
        { name: 'bitSplit', caption: 'IA-32 segment selector: 16 bits (slide 70 figure).', props: { fields: [{ label: 's', bits: 13 }, { label: 'g', bits: 1 }, { label: 'p', bits: 2 }], address: '0x001B', note: 's = segment number, g = GDT or LDT, p = protection (Silberschatz)' } },
        { name: 'bitSplit', caption: 'IA-32 linear address with a 4 MB page: 10-bit page directory index, 22-bit offset (slide 73).', props: { fields: [{ label: 'page directory', bits: 10 }, { label: 'offset', bits: 22 }], address: '0x00403004', note: 'with 4 KB pages the same address splits 10 | 10 | 12' } }
      ],
      takeaway: 'IA-32: logical address (selector, offset) → segmentation unit → 32-bit linear address → paging unit (the MMU) → physical address. Segments up to 4 GB, 16 K per process (8 K private in the LDT, 8 K shared in the GDT). Paging 10 | 10 | 12 with CR3 → page directory; pages of 4 KB or 4 MB.',
      exam: 'The chain logical → linear → physical; LDT vs GDT; the two-level 10 | 10 | 12 paging and the 4 MB page option.'
    },
    {
      id: 'x86-64-arm',
      h: 'PAE, x86-64 and ARM',
      why: 'beyond 4 GB, and mobile CPUs',
      lead: 'A 32-bit address reaches only 4 GB. Intel first stretched IA-32 with PAE, then moved to 64 bits; ARM, the mobile chip, made its own choices.',
      html: `
<p><b>Page address extension (PAE).</b> 32-bit address limits led Intel to create PAE, allowing 32-bit apps access to more than 4 GB of memory space:</p>
<ul>
  <li>paging went to a <b>3-level scheme</b>;</li>
  <li>the <b>top two bits</b> refer to a <b>page directory pointer table</b>;</li>
  <li>page-directory and page-table entries moved to <b>64 bits</b> in size (so they can hold longer frame numbers);</li>
  <li>net effect: the address space grows to <b>36 bits — 64 GB of physical memory</b>.</li>
</ul>
<div data-viz="0"></div>
<p>(Silberschatz) Each process still has 32-bit (4 GB) logical addresses; PAE lets the system as a whole use up to 64 GB of physical memory.</p>
<p><b>Intel x86-64</b> is the current generation of the Intel x86 architecture. 64 bits is "ginormous": more than <b>16 exabytes</b> (2<sup>64</sup> bytes). In practice only <b>48-bit addressing</b> is implemented (2<sup>48</sup> bytes = 256 TB):</p>
<ul>
  <li>page sizes of <b>4 KB, 2 MB and 1 GB</b>;</li>
  <li><b>four levels</b> of paging hierarchy;</li>
  <li>it can also use PAE, so <b>virtual addresses are 48 bits</b> and <b>physical addresses are 52 bits</b>.</li>
</ul>
<p>The slide figure divides the 64-bit address as in the table (bits 63–48 are unused):</p>
<table class="t">
  <tr><th>unused</th><th>page map level 4</th><th>page directory pointer table</th><th>page directory</th><th>page table</th><th>offset</th></tr>
  <tr><td>63–48 (16 bits)</td><td>47–39 (9)</td><td>38–30 (9)</td><td>29–21 (9)</td><td>20–12 (9)</td><td>11–0 (12)</td></tr>
</table>
<p>Notice the pattern: every level uses 9 bits, because a 4 KB page holds 4,096 / 8 = 512 = 2<sup>9</sup> entries of 8 bytes. A four-level walk is exactly the "more levels, more memory accesses" problem from the 64-bit section — which is why the TLB matters so much.</p>
<p><b>ARM</b> is the dominant mobile platform chip (Apple iOS and Google Android devices, for example): a modern, energy-efficient, 32-bit CPU.</p>
<ul>
  <li>pages of <b>4 KB and 16 KB</b>, plus larger <b>1 MB and 16 MB</b> pages, termed <b>sections</b>;</li>
  <li><b>one-level paging for sections, two-level paging for smaller pages</b> (32-bit address: outer page | inner page | offset);</li>
  <li><b>two levels of TLBs</b>: the outer level has <b>two micro TLBs</b> (one for data, one for instructions); the inner level is a single <b>main TLB</b>;</li>
  <li>the slide states: first the inner is checked, on a miss the outers are checked, and on a miss a <b>page table walk</b> is performed by the CPU.</li>
</ul>
<div class="callout warn">The Silberschatz textbook gives the order the other way round: translation <b>begins at the micro TLBs</b> (outer level); on a miss the main TLB (inner level) is checked; if both miss, the hardware walks the page table. If you are asked, give the textbook order and mention that the slide words it differently.</div>`,
      viz: [{ name: 'bitSplit', caption: 'IA-32 with PAE (slide 74): 2-bit page directory pointer table | 9-bit page directory | 9-bit page table | 12-bit offset.', props: { fields: [{ label: 'PDPT', bits: 2 }, { label: 'page directory', bits: 9 }, { label: 'page table', bits: 9 }, { label: 'offset', bits: 12 }], address: '0x00403004', note: 'three levels; table entries are 64 bits; 36-bit physical addresses' } }],
      takeaway: 'PAE: 3-level paging (top 2 bits → page directory pointer table), 64-bit entries, 36-bit physical addresses = 64 GB. x86-64: 48-bit addressing in practice, pages of 4 KB / 2 MB / 1 GB, four levels (9 bits each), 52-bit physical with PAE. ARM: 4 KB / 16 KB pages and 1 MB / 16 MB sections, one level for sections and two for pages, two micro TLBs + one main TLB.',
      exam: 'What PAE changes (3 levels, 64-bit entries, 64 GB); x86-64 facts (48 bits, 4 levels, page sizes); ARM sections and its two TLB levels.'
    },
    {
      id: 'summary',
      h: 'Summary: the chain of memory-management schemes',
      why: 'see the whole chain at once',
      lead: 'Every scheme in this module was introduced to fix a problem of the previous one, and each fix had a price. Side by side, the chain is easy to retell at the oral exam.',
      html: `
<p>Read the table top to bottom as a story: each row’s last column is the problem that the next row solves.</p>
<table class="t">
  <tr><th>Scheme</th><th>Solves</th><th>Price / new problem</th></tr>
  <tr><td><b>Base + limit registers</b></td><td>protection between processes and the OS</td><td>each process must be one contiguous block</td></tr>
  <tr><td><b>Execution-time binding</b> (MMU, relocation register)</td><td>a process can be loaded and moved anywhere</td><td>hardware work on every access</td></tr>
  <tr><td><b>Dynamic loading / dynamic linking</b></td><td>memory wasted on unused routines and duplicate libraries</td><td>run-time overhead and complexity</td></tr>
  <tr><td><b>Contiguous allocation</b> (variable partitions, first/best/worst fit)</td><td>simple placement</td><td><b>external fragmentation</b> (50-percent rule: up to 1/3 lost)</td></tr>
  <tr><td><b>Fixed partitions</b></td><td>very simple management</td><td>internal fragmentation; fixed limits on process size and multiprogramming</td></tr>
  <tr><td><b>Compaction</b></td><td>external fragmentation</td><td>expensive; needs execution-time binding; I/O problem</td></tr>
  <tr><td><b>Paging</b></td><td>external fragmentation (any frame fits any page)</td><td>internal fragmentation (½ page on average); a page table per process; <b>2 memory accesses</b> per reference</td></tr>
  <tr><td><b>TLB</b></td><td>the second memory access (EAT 12 ns at 80%, 10.1 ns at 99%)</td><td>small; needs ASIDs or a flush at every context switch</td></tr>
  <tr><td><b>Protection bits, valid–invalid bit, shared pages</b></td><td>protection and sharing, page by page</td><td>protection only per page</td></tr>
  <tr><td><b>Hierarchical page tables</b></td><td>a huge contiguous page table (4 MB per process at 32 bits)</td><td>one more memory access per level; does not scale to 64 bits</td></tr>
  <tr><td><b>Hashed / clustered page tables</b></td><td>table size follows the pages in use (above 32 bits)</td><td>hash function, collisions, chain walks</td></tr>
  <tr><td><b>Inverted page table</b></td><td>one table for the whole system (one entry per frame)</td><td>slow search, difficult sharing</td></tr>
  <tr><td><b>Swapping</b></td><td>processes need more memory than exists</td><td>very slow (4 s for 100 MB), pending I/O → move pages, not processes</td></tr>
</table>
<p>The real CPUs at the end combine these pieces: IA-32 uses segmentation followed by two-level paging with a TLB; PAE and x86-64 add levels (3 and 4) to reach more memory; ARM mixes one-level paging for big sections with two-level paging for small pages and uses two levels of TLBs.</p>`,
      takeaway: 'Protection (base/limit) → relocation (MMU) → contiguous allocation → external fragmentation → paging → two memory accesses → TLB → huge page tables → hierarchical / hashed / inverted tables → swapping when memory is still not enough.'
    }
  ],
  terms: [
    { en: 'Main memory', ru: 'оперативная память', def: 'Storage locations directly accessible by the processor (primary storage); with the registers, the only storage the CPU can access directly.' },
    { en: 'Primary storage', ru: 'первичная память', def: 'Another name for main memory.' },
    { en: 'Base register', ru: 'базовый регистр', def: 'Holds the smallest legal physical address of the running process.' },
    { en: 'Limit register', ru: 'регистр предела', def: 'Holds the size of the legal address range of the process (range of logical addresses).' },
    { en: 'Logical address space', ru: 'логическое адресное пространство', def: 'The set of logical addresses a process uses for its code, data and context.' },
    { en: 'Physical address space', ru: 'физическое адресное пространство', def: 'The set of physical memory addresses that correspond to the logical addresses of a process.' },
    { en: 'Address binding', ru: 'привязка адресов', def: 'Mapping addresses from one address space to another: symbolic → relocatable → absolute; at compile, load or execution time.' },
    { en: 'Symbolic address', ru: 'символический адрес', def: 'An address in source code, written as a name (e.g. a variable).' },
    { en: 'Relocatable address', ru: 'перемещаемый адрес', def: 'An address relative to the start of a module, e.g. "14 bytes from the beginning of this module".' },
    { en: 'Absolute address', ru: 'абсолютный адрес', def: 'A final memory address, e.g. 74014, produced by the linker or loader.' },
    { en: 'Absolute code', ru: 'абсолютный код', def: 'Code generated at compile time for a known memory location; must be recompiled if the start changes.' },
    { en: 'Relocatable code', ru: 'перемещаемый код', def: 'Code generated when the location is not known at compile time; final addresses are fixed at load time.' },
    { en: 'Execution-time binding', ru: 'привязка во время выполнения', def: 'Binding delayed until run time, so the process can move in memory; needs hardware (MMU).' },
    { en: 'Logical address', ru: 'логический адрес', def: 'Address generated by the CPU; also called virtual address; ranges from 0 to the size of the process memory.' },
    { en: 'Virtual address', ru: 'виртуальный адрес', def: 'Another name for a logical address.' },
    { en: 'Physical address', ru: 'физический адрес', def: 'Address seen by the memory unit; ranges from base to base + limit.' },
    { en: 'Memory management unit', ru: 'блок управления памятью', def: 'MMU: hardware that translates virtual (logical) addresses into physical addresses at run time.' },
    { en: 'Relocation register', ru: 'регистр перемещения', def: 'The base register of the simple MMU; its value is added to every logical address (14000 + 346 = 14346).' },
    { en: 'Loader', ru: 'загрузчик', def: 'OS module that loads programs from secondary memory into main memory and executes them.' },
    { en: 'Static loader', ru: 'статический загрузчик', def: 'Loads the entire program, with libraries and dependencies, into memory before execution.' },
    { en: 'Dynamic loading', ru: 'динамическая загрузка', def: 'A routine is not loaded until it is called; implemented by program design, no special OS support.' },
    { en: 'Static linking', ru: 'статическая компоновка', def: 'System libraries and program code are combined into the binary program image.' },
    { en: 'Dynamic linking', ru: 'динамическая компоновка', def: 'Linking postponed until execution time, using a stub for each library routine.' },
    { en: 'Stub', ru: 'заглушка', def: 'Small piece of code that locates the memory-resident library routine, replaces itself with its address and executes it.' },
    { en: 'Shared library', ru: 'разделяемая библиотека', def: 'A dynamically linked library used by many programs at once (*.so).' },
    { en: 'Contiguous allocation', ru: 'непрерывное выделение памяти', def: 'Each process gets one continuous segment of memory.' },
    { en: 'Non-contiguous allocation', ru: 'несмежное выделение памяти', def: 'A process gets a series of blocks that can be anywhere in physical memory (e.g. paging).' },
    { en: 'Variable partition', ru: 'раздел переменного размера', def: 'Partitions sized to each process’s needs, cut from holes.' },
    { en: 'Fixed partition', ru: 'раздел фиксированного размера', def: 'Memory divided in advance into a fixed number of partitions, one process per partition.' },
    { en: 'Hole', ru: 'свободный блок памяти', def: 'A block of available memory; holes of various sizes are scattered through memory.' },
    { en: 'Degree of multiprogramming', ru: 'степень мультипрограммирования', def: 'The number of processes in memory at the same time.' },
    { en: 'First-fit', ru: 'первый подходящий', def: 'Allocate the first hole that is big enough.' },
    { en: 'Best-fit', ru: 'наилучший подходящий', def: 'Allocate the smallest hole that is big enough; produces the smallest leftover hole.' },
    { en: 'Worst-fit', ru: 'наихудший подходящий', def: 'Allocate the largest hole; produces the largest leftover hole.' },
    { en: 'External fragmentation', ru: 'внешняя фрагментация', def: 'Total free memory is enough for a request but it is not contiguous (variable partitions).' },
    { en: 'Internal fragmentation', ru: 'внутренняя фрагментация', def: 'Allocated memory is larger than requested; the unused part inside the partition or page is wasted.' },
    { en: '50-percent rule', ru: 'правило 50 процентов', def: 'With first-fit, N allocated blocks lose another 0.5 N to fragmentation: 1/3 of memory may be unusable.' },
    { en: 'Compaction', ru: 'уплотнение памяти', def: 'Shuffling memory contents to put all free memory into one block; possible only with execution-time relocation.' },
    { en: 'Paging', ru: 'страничная организация памяти', def: 'Physical memory in frames, logical memory in pages of the same size; avoids external fragmentation.' },
    { en: 'Frame', ru: 'страничный кадр', def: 'Fixed-size block of physical memory (power of 2, 512 bytes – 16 MB).' },
    { en: 'Page', ru: 'страница', def: 'Fixed-size block of logical memory, the same size as a frame.' },
    { en: 'Page table', ru: 'таблица страниц', def: 'Per-process table that maps each page number to the frame that holds it.' },
    { en: 'Page number', ru: 'номер страницы', def: 'p: the high-order m − n bits of a logical address; index into the page table.' },
    { en: 'Page offset', ru: 'смещение в странице', def: 'd: the low-order n bits of a logical address; copied unchanged into the physical address.' },
    { en: 'Backing store', ru: 'резервное хранилище', def: 'Fast disk area that holds swapped-out processes or pages.' },
    { en: 'Free-frame list', ru: 'список свободных кадров', def: 'The OS pool of free frames used to allocate frames dynamically.' },
    { en: 'Frame table', ru: 'таблица кадров', def: '(Silberschatz) System-wide table with one entry per frame: free or allocated, and to which page.' },
    { en: 'Page-table base register', ru: 'регистр базы таблицы страниц', def: 'PTBR: points to the page table of the running process.' },
    { en: 'Page-table length register', ru: 'регистр длины таблицы страниц', def: 'PTLR: indicates the size of the page table; also used to detect illegal page numbers.' },
    { en: 'Translation look-aside buffer', ru: 'буфер ассоциативной трансляции', def: 'TLB: small fast associative cache of recent page → frame translations (64 to 1,024 entries).' },
    { en: 'Associative memory', ru: 'ассоциативная память', def: 'Memory searched in parallel by content; the TLB is built from it.' },
    { en: 'TLB hit', ru: 'попадание в TLB', def: 'The page number is found in the TLB; the frame number comes out directly.' },
    { en: 'TLB miss', ru: 'промах TLB', def: 'The page number is not in the TLB; the frame comes from the page table in memory and is loaded into the TLB.' },
    { en: 'Hit ratio', ru: 'коэффициент попаданий', def: 'Percentage of times that a page number is found in the TLB.' },
    { en: 'Address-space identifier', ru: 'идентификатор адресного пространства', def: 'ASID: identifies the process of each TLB entry, so the TLB need not be flushed at a context switch.' },
    { en: 'Wired down', ru: 'закреплённая запись', def: 'A TLB entry that is never replaced, e.g. for kernel code.' },
    { en: 'Effective access time', ru: 'эффективное время доступа', def: 'EAT = hit ratio × m + (1 − hit ratio) × 2m; 80% → 12 ns, 99% → 10.1 ns with m = 10 ns.' },
    { en: 'Protection bit', ru: 'бит защиты', def: 'Bit in a page-table entry indicating read-only or read-write (or execute-only) access.' },
    { en: 'Valid-invalid bit', ru: 'бит действительности', def: 'Page-table bit: valid = the page is in the process’s logical address space; invalid = it is not (trap).' },
    { en: 'Shared pages', ru: 'разделяемые страницы', def: 'Frames mapped by the page tables of several processes, e.g. one copy of libc.' },
    { en: 'Reentrant code', ru: 'реентерабельный код', def: 'Read-only, non-self-modifying code that many processes can execute at the same time.' },
    { en: 'Hierarchical paging', ru: 'иерархическая страничная организация', def: 'Breaking the page table into multiple page tables: paging the page table.' },
    { en: 'Two-level page table', ru: 'двухуровневая таблица страниц', def: 'Outer page table + pages of the inner page table; 32-bit address split 10 | 10 | 12.' },
    { en: 'Outer page table', ru: 'внешняя таблица страниц', def: 'Top-level table indexed by p1; its entries point to pages of the inner page table.' },
    { en: 'Forward-mapped page table', ru: 'таблица страниц с прямым отображением', def: 'A hierarchical page table translated from the outer table inward.' },
    { en: 'Hashed page table', ru: 'хешированная таблица страниц', def: 'Page table organized as a hash table on the virtual page number; each chain element holds page number, frame, next pointer.' },
    { en: 'Hash function', ru: 'хеш-функция', def: 'Function that turns a key (here a page number) into an index of the hash table.' },
    { en: 'Clustered page table', ru: 'кластеризованная таблица страниц', def: 'Variant of the hashed table where each entry covers several pages (e.g. 16); good for sparse address spaces.' },
    { en: 'Sparse address space', ru: 'разреженное адресное пространство', def: 'An address space whose memory references are non-contiguous and scattered.' },
    { en: 'Inverted page table', ru: 'инвертированная таблица страниц', def: 'One system-wide table with one entry per physical frame, holding the logical page and owning process.' },
    { en: 'Translation table entry', ru: 'запись таблицы трансляции', def: 'TTE: a Solaris/SPARC translation entry held in the TLB.' },
    { en: 'Translation storage buffer', ru: 'буфер хранения трансляций', def: 'TSB: in-memory cache of TTEs in Solaris, walked by hardware on a TLB miss.' },
    { en: 'Swapping', ru: 'подкачка', def: 'Moving a process temporarily to the backing store and back, so processes can use more memory in total than exists.' },
    { en: 'Swap out', ru: 'выгрузка процесса', def: 'Moving a process from RAM to the disk.' },
    { en: 'Swap in', ru: 'загрузка процесса', def: 'Moving a process from the disk back into RAM.' },
    { en: 'Roll out, roll in', ru: 'выгрузка и загрузка по приоритету', def: '(Silberschatz) Swapping variant for priority scheduling: a low-priority process is swapped out for a high-priority one.' },
    { en: 'Double buffering', ru: 'двойная буферизация', def: 'Doing I/O through kernel space first, so a process can be swapped during I/O; adds overhead.' },
    { en: 'Page out', ru: 'выгрузка страницы', def: 'Moving a single page from memory to the backing store.' },
    { en: 'Page in', ru: 'загрузка страницы', def: 'Moving a single page from the backing store into memory.' },
    { en: 'Segmentation', ru: 'сегментация', def: 'Dividing a program into variable-size logical segments; in IA-32 it comes before paging.' },
    { en: 'Linear address', ru: 'линейный адрес', def: 'IA-32: the 32-bit address produced by the segmentation unit and given to the paging unit.' },
    { en: 'Segment selector', ru: 'селектор сегмента', def: 'IA-32: 16-bit part of a logical address (s 13 | g 1 | p 2) that selects a segment descriptor.' },
    { en: 'Local descriptor table', ru: 'локальная таблица дескрипторов', def: 'LDT: up to 8 K segments private to a process.' },
    { en: 'Global descriptor table', ru: 'глобальная таблица дескрипторов', def: 'GDT: up to 8 K segments shared among all processes.' },
    { en: 'Page directory', ru: 'каталог страниц', def: 'IA-32 outer page table, pointed to by the CR3 register.' },
    { en: 'Page address extension', ru: 'расширение физических адресов', def: 'PAE: 3-level paging with 64-bit entries; 36-bit physical addresses (64 GB) on IA-32.' },
    { en: 'Page directory pointer table', ru: 'таблица указателей каталогов страниц', def: 'PAE top level, selected by the top two bits of the address.' },
    { en: 'Micro TLB', ru: 'микро-TLB', def: 'ARM: small outer-level TLB, one for data and one for instructions.' },
    { en: 'Main TLB', ru: 'основной TLB', def: 'ARM: the single inner-level TLB.' }
  ],
  questions: [
    { id: 'mem-01', type: 'single', q: 'Which storage can the CPU access directly?', options: ['The registers and main memory', 'Only the registers', 'Main memory and the disk', 'The registers, main memory and the disk'], answer: 0, explain: 'Main memory and registers are the only storage the CPU can access directly; a program on disk must first be brought into memory.', section: 'background', diff: 1 },
    { id: 'mem-02', type: 'tf', q: 'The memory unit knows which process generated each address it receives.', answer: false, explain: 'Memory sees only a stream of addresses with read requests, or addresses with data and write requests. That is why the hardware must check addresses before they reach memory.', section: 'background', diff: 1 },
    { id: 'mem-03', type: 'single', q: 'A process has base = 300040 and limit = 120900. Which address is NOT legal for it?', options: ['300040', '350000', '420939', '420940'], answer: 3, explain: 'Legal addresses satisfy base ≤ a < base + limit = 420940. So 420939 is the last legal address and 420940 traps.', section: 'base-limit', diff: 2 },
    { id: 'mem-04', type: 'single', q: 'Why must the instructions that load the base and limit registers be privileged?', options: ['Because they are slow', 'Because only the compiler uses them', 'Because the registers are stored on disk', 'Otherwise a user program could change its own bounds and access other processes’ memory'], answer: 3, explain: 'If user mode could load base and limit, any program could move its fence and read or write the OS or other processes.', section: 'base-limit', diff: 1 },
    { id: 'mem-05', type: 'single', q: 'With which binding time can a process be moved from one memory segment to another during its execution?', options: ['Compile time', 'Load time', 'Execution time', 'Edit time'], answer: 2, explain: 'Execution-time binding delays binding until run time, so the process can move; it needs hardware support such as an MMU.', section: 'binding', diff: 1 },
    { id: 'mem-06', type: 'single', q: 'If the memory location of a program is known a priori at compile time, the compiler generates…', options: ['absolute code', 'relocatable code', 'a stub', 'a page table'], answer: 0, explain: 'Compile-time binding produces absolute code; if the starting location changes, the program must be recompiled. Relocatable code is needed when the location is not known at compile time.', section: 'binding', diff: 1 },
    { id: 'mem-07', type: 'single', q: 'The relocation register contains 14000 and the CPU generates logical address 346. Which physical address is sent to memory?', options: ['346', '13654', '14000', '14346'], answer: 3, explain: 'The MMU adds the relocation register to every logical address: 14000 + 346 = 14346.', section: 'logical-physical', diff: 1 },
    { id: 'mem-08', type: 'multi', q: 'Which statements about logical and physical addresses are true? (select all that apply)', options: ['A logical address is generated by the CPU', 'A logical address is also called a virtual address', 'The user program works with real physical addresses', 'The MMU translates logical addresses into physical addresses'], answer: [0, 1, 3], explain: 'The program deals only with logical (virtual) addresses and never sees physical ones; the MMU translates them at run time.', section: 'logical-physical', diff: 1 },
    { id: 'mem-09', type: 'tf', q: 'Dynamic loading requires special support from the operating system.', answer: false, explain: 'Dynamic loading is implemented through program design; the OS can only help by providing libraries. Dynamic linking, by contrast, generally needs OS help.', section: 'loading', diff: 2 },
    { id: 'mem-10', type: 'multi', q: 'Which are advantages of dynamic loading over a static loader? (select all that apply)', options: ['An unused routine is never loaded', 'Useful when large amounts of code handle infrequently occurring cases', 'Simpler to implement', 'All external references are resolved before execution'], answer: [0, 1], explain: 'Dynamic loading saves memory. Simplicity and resolving all references before execution are advantages of the static loader.', section: 'loading', diff: 2 },
    { id: 'mem-11', type: 'single', q: 'In dynamic linking, what does the stub do?', options: ['It copies the whole library into the binary image', 'It swaps the process out to the backing store', 'It locates the memory-resident library routine, replaces itself with the routine’s address and executes it', 'It compacts memory'], answer: 2, explain: 'The stub finds the routine (the OS adds it to the address space if needed), then replaces itself with the routine address. Copying the library into the image is static linking.', section: 'linking', diff: 1 },
    { id: 'mem-12', type: 'single', q: 'In contiguous allocation with relocation and limit registers (slide 18), what does the hardware do with a logical address?', options: ['It adds the relocation register, then compares the result with the limit', 'It compares the logical address with the limit register and, if it is smaller, adds the relocation register', 'It looks the address up in the page table', 'It hashes the address'], answer: 1, explain: 'The limit register holds the range of logical addresses, so the logical address is checked first (logical < limit, else trap) and then relocated.', section: 'contiguous', diff: 2 },
    { id: 'mem-13', type: 'single', q: 'In a fixed-partition scheme, what limits the maximum size of a process?', options: ['The number of partitions', 'The size of the TLB', 'The page size', 'The maximum size of a partition'], answer: 3, explain: 'Each partition holds one process, so a process cannot be larger than the largest partition. The number of partitions limits the degree of multiprogramming.', section: 'partitions', diff: 1 },
    { id: 'mem-14', type: 'single', q: 'Holes of 100, 500, 200, 300, 600 KB (in this order); requests of 212, 417, 112, 426 KB (in this order). With FIRST-fit, which request must wait?', options: ['212 KB', '417 KB', '112 KB', '426 KB'], answer: 3, explain: '212 → 500 (288 left), 417 → 600 (183 left), 112 → 288 (176 left). For 426 the holes are 100, 176, 200, 300, 183 — none is big enough.', section: 'allocation', diff: 2 },
    { id: 'mem-15', type: 'single', q: 'Same holes and requests. With BEST-fit, where is the first request (212 KB) placed?', options: ['in the 300 KB hole', 'in the 500 KB hole', 'in the 600 KB hole', 'in the 200 KB hole'], answer: 0, explain: 'Best-fit takes the smallest hole that is big enough: 100 and 200 are too small, so 300 is the best (88 KB left).', section: 'allocation', diff: 2 },
    { id: 'mem-16', type: 'single', q: 'Same holes and requests. Which strategy places all four requests?', options: ['First-fit', 'Best-fit', 'Worst-fit', 'None of the three'], answer: 1, explain: 'Best-fit: 212 → 300, 417 → 500, 112 → 200, 426 → 600. First-fit and worst-fit both leave the 426 KB request waiting.', section: 'allocation', diff: 3 },
    { id: 'mem-17', type: 'single', q: 'Which strategy produces the largest leftover hole?', options: ['First-fit', 'Best-fit', 'Worst-fit', 'Compaction'], answer: 2, explain: 'Worst-fit allocates the largest hole, so it leaves the largest leftover. Best-fit leaves the smallest one.', section: 'allocation', diff: 1 },
    { id: 'mem-18', type: 'single', q: 'Total free memory is enough to satisfy a request, but it is not contiguous. This is…', options: ['internal fragmentation', 'a TLB miss', 'external fragmentation', 'double buffering'], answer: 2, explain: 'External fragmentation: free space exists only as scattered holes. Internal fragmentation is unused space inside an allocated block.', section: 'fragmentation', diff: 1 },
    { id: 'mem-19', type: 'single', q: 'According to the 50-percent rule, what fraction of memory may be unusable?', options: ['1/2', '1/3', '1/4', '2/3'], answer: 1, explain: 'N allocated blocks lose another 0.5 N blocks: 0.5 N / 1.5 N = 1/3.', section: 'fragmentation', diff: 2 },
    { id: 'mem-20', type: 'single', q: 'Compaction is possible only if…', options: ['relocation is dynamic, done at execution time', 'relocation is static, done at load time', 'the system uses fixed partitions', 'the TLB stores ASIDs'], answer: 0, explain: 'Moving a process requires changing its addresses while it exists, which works only with execution-time binding (change the relocation register).', section: 'fragmentation', diff: 2 },
    { id: 'mem-21', type: 'multi', q: 'Which statements about paging are true? (select all that apply)', options: ['Physical memory is divided into frames', 'Pages and frames have the same size', 'Paging avoids external fragmentation', 'Paging avoids internal fragmentation'], answer: [0, 1, 2], explain: 'Any free frame can hold any page, so there is no external fragmentation; the last page of a process is usually not full, so internal fragmentation remains.', section: 'paging', diff: 1 },
    { id: 'mem-22', type: 'single', q: 'The logical address space is 2<sup>m</sup> and the page size is 2<sup>n</sup>. How many bits form the page number p?', options: ['n', 'm', 'm − n', 'm + n'], answer: 2, explain: 'The low-order n bits are the offset d; the remaining high-order m − n bits are the page number.', section: 'translation', diff: 1 },
    { id: 'mem-23', type: 'single', q: 'Slide example: page size 4 bytes, page table [5, 6, 1, 2]. Logical address 13 maps to physical address…', options: ['9', '13', '21', '53'], answer: 0, explain: 'p = 13 div 4 = 3, d = 13 mod 4 = 1; page 3 is in frame 2 → 2 × 4 + 1 = 9.', section: 'paging-example', diff: 2 },
    { id: 'mem-24', type: 'single', q: 'Same example (page size 4, page table [5, 6, 1, 2]). Logical address 4 maps to…', options: ['4', '16', '20', '24'], answer: 3, explain: 'p = 1, d = 0; page 1 is in frame 6 → 6 × 4 + 0 = 24 (the letter "e").', section: 'paging-example', diff: 2 },
    { id: 'mem-25', type: 'single', q: 'Page size 2,048 bytes, process size 72,766 bytes. How much internal fragmentation?', options: ['1,086 bytes', '962 bytes', '2,047 bytes', '0 bytes'], answer: 1, explain: '72,766 = 35 × 2,048 + 1,086, so the 36th frame holds only 1,086 bytes: 2,048 − 1,086 = 962 bytes are wasted.', section: 'internal-frag', diff: 2 },
    { id: 'mem-26', type: 'single', q: 'How many frames does that process (72,766 bytes, 2,048-byte pages) need?', options: ['35', '36', '37', '71'], answer: 1, explain: '35 full pages + 1,086 bytes → 35 + 1 = 36 frames.', section: 'internal-frag', diff: 1 },
    { id: 'mem-27', type: 'single', q: 'Free-frame list 14, 13, 18, 20, 15. A new process with 4 pages is loaded as in the slide. Which frame is still free afterwards?', options: ['14', '13', '15', '20'], answer: 2, explain: 'Pages 0–3 get frames 14, 13, 18, 20; the free-frame list keeps only 15.', section: 'free-frames', diff: 1 },
    { id: 'mem-28', type: 'single', q: 'With the page table in main memory and no TLB, how many memory accesses does one data access need?', options: ['1', '2', '3', '4'], answer: 1, explain: 'One access for the page-table entry and one for the data itself: the two-memory-access problem that the TLB solves.', section: 'tlb', diff: 1 },
    { id: 'mem-29', type: 'multi', q: 'Which statements about the TLB are true? (select all that apply)', options: ['It is an associative memory searched in parallel', 'It typically has 64 to 1,024 entries', 'Without ASIDs it must be flushed at every context switch', 'It stores the complete page table of every process'], answer: [0, 1, 2], explain: 'The TLB is small and caches only recent translations; the full page tables stay in main memory.', section: 'tlb', diff: 2 },
    { id: 'mem-30', type: 'single', q: 'What does "wired down" mean for a TLB entry?', options: ['It is removed at every context switch', 'It is marked invalid', 'It belongs to a shared page', 'It is never replaced, e.g. an entry for kernel code'], answer: 3, explain: 'Wired-down entries are not substituted by the TLB replacement algorithm, giving permanent fast access.', section: 'tlb', diff: 1 },
    { id: 'mem-31', type: 'single', q: 'TLB hit ratio 80%, memory access 10 ns, a miss needs two memory accesses. Effective access time = ?', options: ['10 ns', '12 ns', '18 ns', '20 ns'], answer: 1, explain: 'EAT = 0.80 × 10 + 0.20 × 20 = 8 + 4 = 12 ns, a 20% slowdown.', section: 'eat', diff: 2 },
    { id: 'mem-32', type: 'single', q: 'TLB hit ratio 99%, memory access 10 ns. Effective access time = ?', options: ['10.01 ns', '10.1 ns', '11 ns', '19.9 ns'], answer: 1, explain: 'EAT = 0.99 × 10 + 0.01 × 20 = 9.9 + 0.2 = 10.1 ns, only a 1% slowdown.', section: 'eat', diff: 2 },
    { id: 'mem-33', type: 'single', q: 'A page-table entry has its valid–invalid bit set to "invalid", and the process accesses that page. What happens?', options: ['A trap to the kernel', 'The access goes to frame 0', 'The TLB is flushed', 'The page becomes shared'], answer: 0, explain: 'Invalid means the page is not in the process’s logical address space; any violation results in a trap to the kernel.', section: 'protection', diff: 1 },
    { id: 'mem-34', type: 'tf', q: 'In the slide example (program uses addresses 0–10,468, pages of 2 KB, pages 0–5 valid), an access to address 11,000 is caught by the valid–invalid bit.', answer: false, explain: 'Address 11,000 is in page 5 (10,240–12,287), which is marked valid. Protection works per page, so the unused tail of page 5 is not detected — internal fragmentation.', section: 'protection', diff: 3 },
    { id: 'mem-35', type: 'single', q: 'Which kind of code can be shared among processes through shared pages?', options: ['Self-modifying code', 'The private data of each process', 'Reentrant (read-only) code', 'The stack of each process'], answer: 2, explain: 'Reentrant code never changes during execution, so one copy can be mapped into many page tables (e.g. libc in frames 3, 4, 6, 1).', section: 'shared', diff: 1 },
    { id: 'mem-36', type: 'single', q: '32-bit logical addresses, 4 KB pages, 4-byte page-table entries. How big is a simple one-level page table per process?', options: ['4 KB', '1 MB', '4 MB', '4 GB'], answer: 2, explain: '2<sup>32</sup> / 2<sup>12</sup> = 2<sup>20</sup> entries (about 1 million) × 4 bytes = 4 MB.', section: 'pt-size', diff: 2 },
    { id: 'mem-37', type: 'single', q: 'Two-level paging on a 32-bit machine, address split 10 | 10 | 12. For the address 0x00403004, what are p1, p2 and d?', options: ['p1 = 1, p2 = 3, d = 4', 'p1 = 4, p2 = 3, d = 1', 'p1 = 0, p2 = 1027, d = 4', 'p1 = 1, p2 = 4, d = 3'], answer: 0, explain: '0x00403004 = 0000000001 | 0000000011 | 000000000100 in binary → p1 = 1, p2 = 3, d = 4. (The 20-bit page number is 1027 = 1 × 1024 + 3.)', section: 'hierarchical', diff: 3 },
    { id: 'mem-38', type: 'single', q: '64-bit addresses, 4 KB pages, two levels split 42 | 10 | 12 with 4-byte entries. How big is the outer page table?', options: ['2<sup>10</sup> entries', '2<sup>42</sup> entries = 2<sup>44</sup> bytes', '2<sup>52</sup> bytes', '2<sup>34</sup> bytes'], answer: 1, explain: 'p1 has 42 bits, so the outer table has 2<sup>42</sup> entries × 4 bytes = 2<sup>44</sup> bytes. 2<sup>34</sup> bytes is the 2nd outer table of the three-level scheme.', section: 'three-level', diff: 2 },
    { id: 'mem-39', type: 'multi', q: 'Each element of a chain in a hashed page table contains… (select all that apply)', options: ['the logical page number', 'the mapped page frame', 'a pointer to the next element', 'the complete page table of the process'], answer: [0, 1, 2], explain: 'The logical page number is compared during the chain walk; on a match the frame is extracted; the pointer links the elements that hash to the same slot.', section: 'hashed', diff: 1 },
    { id: 'mem-40', type: 'single', q: 'How do clustered page tables differ from hashed page tables?', options: ['Each entry refers to several pages (e.g. 16) instead of one', 'Each entry refers to one physical frame', 'They are stored inside the TLB', 'They use base and limit registers'], answer: 0, explain: 'Clustered page tables are a 64-bit variation of hashed tables where one entry covers several pages; they suit sparse address spaces.', section: 'hashed', diff: 2 },
    { id: 'mem-41', type: 'single', q: 'In an inverted page table, the number of entries equals…', options: ['the number of frames in physical memory', 'the number of logical pages of each process', 'the number of processes', 'the number of TLB entries'], answer: 0, explain: 'An inverted page table has one entry per physical frame, holding the logical page and the owning process.', section: 'inverted', diff: 1 },
    { id: 'mem-42', type: 'multi', q: 'Which are drawbacks of the inverted page table? (select all that apply)', options: ['Longer time to search the table on a page reference', 'Shared memory is difficult to implement', 'It needs more memory than per-process page tables', 'It cannot be used by any real architecture'], answer: [0, 1], explain: 'It saves memory but must be searched for <pid, p>, and one entry per frame makes sharing difficult. It is used in PowerPC, UltraSPARC and IA-64.', section: 'inverted', diff: 2 },
    { id: 'mem-43', type: 'single', q: 'In Solaris on SPARC, what happens on a TLB miss?', options: ['The kernel immediately searches the hash table', 'The process is swapped out', 'The hardware walks the in-memory TSB; only if that also misses is the kernel interrupted to search the hash table', 'The TLB is flushed'], answer: 2, explain: 'Order: TLB → TSB (walked by hardware; a match is copied into the TLB) → hash table (kernel), which creates a TTE and stores it in the TSB.', section: 'solaris', diff: 2 },
    { id: 'mem-44', type: 'single', q: 'Whether a swapped-out process must come back into the same physical addresses depends on…', options: ['the address binding method', 'the size of the TLB', 'the page size', 'the CPU scheduling algorithm'], answer: 0, explain: 'With compile- or load-time binding the addresses are fixed; with execution-time binding the process can be swapped in anywhere.', section: 'swapping', diff: 2 },
    { id: 'mem-45', type: 'single', q: 'A 100 MB process is swapped out to a disk with a 50 MB/s transfer rate, and a process of the same size is swapped in. What is the swapping part of the context switch?', options: ['2 s', '4 s', '0.5 s', '5 s'], answer: 1, explain: '100 / 50 = 2 s = 2000 ms out, plus 2000 ms in = 4000 ms (4 seconds).', section: 'swap-cost', diff: 2 },
    { id: 'mem-46', type: 'multi', q: 'Why is swapping not typically supported on mobile systems? (select all that apply)', options: ['Flash memory offers a small amount of space', 'Flash memory has a limited number of write cycles', 'Throughput between flash memory and the CPU is poor', 'Mobile CPUs have no MMU'], answer: [0, 1, 2], explain: 'These are the three flash limits on the slide. Mobile CPUs do have MMUs — iOS and Android both support paging.', section: 'swap-paging', diff: 1 },
    { id: 'mem-47', type: 'single', q: 'In IA-32, the segmentation unit produces a … address, which the paging unit turns into a physical address.', options: ['virtual', 'relocatable', 'linear', 'symbolic'], answer: 2, explain: 'Logical address (selector, offset) → segmentation unit → 32-bit linear address → paging unit → physical address.', section: 'intel', diff: 1 },
    { id: 'mem-48', type: 'single', q: 'IA-32: how many segments can be private to a process (kept in the local descriptor table)?', options: ['up to 4 K', 'up to 8 K', 'up to 16 K', 'up to 4 GB'], answer: 1, explain: 'Up to 16 K segments per process: up to 8 K private (LDT) and up to 8 K shared among all processes (GDT).', section: 'intel', diff: 2 },
    { id: 'mem-49', type: 'single', q: 'PAE increases the IA-32 physical address space to…', options: ['32 bits — 4 GB', '36 bits — 64 GB', '48 bits — 256 TB', '64 bits — 16 exabytes'], answer: 1, explain: 'PAE uses 3-level paging with 64-bit entries; the net effect is 36-bit physical addresses, 64 GB.', section: 'x86-64-arm', diff: 1 },
    { id: 'mem-50', type: 'multi', q: 'Which facts about Intel x86-64 are on the slides? (select all that apply)', options: ['In practice only 48-bit addressing is implemented', 'Page sizes of 4 KB, 2 MB and 1 GB', 'Four levels of paging hierarchy', 'Only one level of paging'], answer: [0, 1, 2], explain: 'x86-64 uses 48-bit addressing, three page sizes and four levels; with PAE, physical addresses are 52 bits.', section: 'x86-64-arm', diff: 2 },
    { id: 'mem-51', type: 'single', q: 'Paging removes external fragmentation. Which new cost does the TLB then remove?', options: ['A second memory access for the page table on every reference', 'Internal fragmentation in the last page', 'The need for a free-frame list', 'The convoy effect'], answer: 0, explain: 'With the page table in memory every reference needs two accesses; the TLB caches translations so that most references need only one.', section: 'summary', diff: 1 }
  ]
});
