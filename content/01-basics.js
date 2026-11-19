OS.addModule({
  id: 'basics',
  num: 1,
  group: 'theory',
  title: 'Basis on Operating Systems',
  titleRu: 'Основы операционных систем',
  icon: '🖥',
  sources: ['1-Basis on OS.pdf'],
  summary: 'What a computer system is made of and what an OS does; how hardware reports to the OS (interrupts, I/O, DMA); storage and caching; multiprocessors and clusters; booting; multiprogramming, dual mode and the timer; the OS management areas; virtualization, computing environments, the cloud, open source and kernel data structures.',
  bridge: 'This is the first module of the course. Before we study processes, scheduling or synchronization, we need a clear picture of the machine an operating system runs on and of the job the operating system does on it.',
  intro: `
<p>A computer is a set of hardware parts — a CPU, memory, disks, a keyboard, a network card — that can do nothing useful on their own. Many programs want to use these parts at the same time, and they must not get in each other’s way. The <b>operating system (OS)</b> is the program that sits between the programs and the hardware: it shares the hardware out fairly and efficiently, and it protects everybody from mistakes and attacks.</p>
<p>The module follows one line of thought. First we define the parts of a computer system and the role of the OS. Then we look at the hardware the OS must manage: how devices report events (<b>interrupts</b>), how data moves (<b>I/O</b> and <b>DMA</b>), where data is kept (the <b>storage hierarchy</b> and <b>caching</b>) and how several CPUs or computers work together. Next we see how the OS gets started (<b>booting</b>) and how it stays in control when many programs run at once (<b>multiprogramming</b>, <b>dual mode</b>, the <b>timer</b>). After that we list what the OS manages — processes, memory, storage, files, I/O, security — and we finish with the wider world: virtualization, networks, the cloud, open source, and the data structures inside the kernel.</p>`,
  sections: [
    {
      id: 'computer-system',
      h: 'The computer system: hardware and four components',
      why: 'what the OS sits between',
      lead: `Before we can say what an operating system does, we need to know what it works with: the hardware inside the box, and the people and programs that want to use it.`,
      html: `
<p>Open a desktop computer and you find the <b>computer tower</b> (the system unit). Inside it are the <b>motherboard</b> (the main circuit board), the <b>microprocessor</b> (the CPU), the <b>RAM chips</b> (main memory), expansion slots for cards (video, network, audio/video), the power supply and the drives (hard drive, CD/DVD). Outside it are the <b>peripherals</b>: monitor, keyboard, mouse, speakers.</p>
<p>Almost every computer today follows the <b>Von Neumann architecture</b>. Its key idea is simple: <b>one memory holds both the data and the program instructions</b>, and the CPU fetches both from there. The diagram shows the parts:</p>
<ul>
  <li>The <b>CPU</b> contains the <b>PC</b> (<b>program counter</b> — the address of the next instruction to execute), the <b>registers</b> (a few tiny, very fast storage cells inside the CPU) and the <b>ALU</b> (arithmetic logic unit — the circuit that does the calculations).</li>
  <li><b>Memory</b> stores both data and instructions.</li>
  <li>Devices (mass storage, video, keyboard) are connected through an <b>I/O interface</b>.</li>
  <li>Everything is linked by one shared <b>bus</b>, a set of wires made of three groups: <b>data lines</b> (they carry the values), <b>address lines</b> (they say where — which memory cell or device) and <b>control lines</b> (they say what to do, e.g. read or write).</li>
</ul>
<svg class="d" viewBox="0 0 600 230">
  <rect class="d-box acc" x="20" y="20" width="150" height="100" rx="6"/>
  <text class="d-txt b" x="95" y="52" text-anchor="middle">CPU</text>
  <text class="d-txt sm" x="95" y="80" text-anchor="middle">PC · registers · ALU</text>
  <rect class="d-box" x="190" y="20" width="110" height="100" rx="6"/>
  <text class="d-txt b" x="245" y="62" text-anchor="middle">Memory</text>
  <text class="d-txt sm" x="245" y="86" text-anchor="middle">data + instructions</text>
  <rect class="d-box muted" x="320" y="20" width="120" height="40" rx="6"/>
  <text class="d-txt sm" x="380" y="45" text-anchor="middle">mass storage</text>
  <rect class="d-box" x="320" y="80" width="120" height="40" rx="6"/>
  <text class="d-txt sm" x="380" y="105" text-anchor="middle">I/O interface</text>
  <rect class="d-box muted" x="460" y="20" width="120" height="40" rx="6"/>
  <text class="d-txt sm" x="520" y="45" text-anchor="middle">video / keyboard</text>
  <rect class="d-box" x="460" y="80" width="120" height="40" rx="6"/>
  <text class="d-txt sm" x="520" y="105" text-anchor="middle">I/O interface</text>
  <line class="d-line" x1="380" y1="60" x2="380" y2="80"/>
  <line class="d-line" x1="520" y1="60" x2="520" y2="80"/>
  <line class="d-line" x1="95" y1="120" x2="95" y2="160"/>
  <line class="d-line" x1="245" y1="120" x2="245" y2="160"/>
  <line class="d-line" x1="380" y1="120" x2="380" y2="160"/>
  <line class="d-line" x1="520" y1="120" x2="520" y2="160"/>
  <rect class="d-box warn" x="20" y="160" width="560" height="56" rx="6"/>
  <text class="d-txt b" x="60" y="193" text-anchor="middle">BUS</text>
  <text class="d-txt sm" x="330" y="178" text-anchor="middle">data lines</text>
  <text class="d-txt sm" x="330" y="194" text-anchor="middle">address lines</text>
  <text class="d-txt sm" x="330" y="210" text-anchor="middle">control lines</text>
</svg>
<p>Hardware is only half of the picture. The slides divide a <b>computer system</b> into four components, from the people at the top to the hardware at the bottom. Read the table from top to bottom: each component uses the one below it.</p>
<table class="t">
  <tr><th>Component</th><th>Role</th><th>Examples</th></tr>
  <tr><td><b>Users</b></td><td>people, machines or other computers that need computing resources</td><td>—</td></tr>
  <tr><td><b>Application programs</b></td><td>define the ways in which the system resources are used to solve the users’ computing problems</td><td>word processors, compilers, web browsers, database systems, video games</td></tr>
  <tr><td><b>Operating system</b></td><td>controls and coordinates the use of the hardware among the various applications and users</td><td>—</td></tr>
  <tr><td><b>Hardware</b></td><td>provides the basic computing resources</td><td>CPU, memory, I/O devices</td></tr>
</table>
<p>Notice where the OS sits. Application programs do not drive the hardware themselves: they go through the operating system, which <b>controls and coordinates</b> the use of the hardware by everybody. That sentence is the seed of the definition in the next section.</p>
<div data-viz="0"></div>`,
      viz: [{ name: 'layers', caption: 'The four components: the OS is the middle layer between application programs and hardware.', props: { layers: [
        { label: 'Users', sub: 'people, machines, other computers' },
        { label: 'Application programs', sub: 'compilers, browsers, databases, games…', tone: 'c2' },
        { label: 'Operating system', sub: 'controls and coordinates hardware use', tone: 'acc' },
        { label: 'Hardware', sub: 'CPU, memory, I/O devices', tone: 'muted' }] } }],
      takeaway: `Von Neumann: a CPU (PC + registers + ALU), one memory for data and instructions, devices behind I/O interfaces, all joined by a bus of data, address and control lines. A computer system has four components — users, application programs, operating system, hardware — and the OS is the layer that coordinates the use of the hardware.`,
      exam: `Name the four components and the role of the OS; what the CPU contains; which three groups of lines form the bus.`
    },
    {
      id: 'what-is-os',
      h: 'What is an operating system?',
      why: 'definition, goals and roles',
      lead: `We saw that the OS sits between programs and hardware. Now we make that precise: what the OS is, what it tries to achieve, and which of the many programs on a computer actually count as "the" operating system.`,
      html: `
<p>The slides give two short definitions. An <b>operating system</b> is <i>a program that acts as an intermediary between a user of a computer and the computer hardware</i>. More informally, it is <i>the set of basic programs and utilities that make your computer run</i>.</p>
<p>An intermediary is only worth having if it makes things better. So the OS has three <b>goals</b>:</p>
<ol>
  <li><b>execute user programs</b> and make solving user problems easier;</li>
  <li>make the computer system <b>convenient</b> to use;</li>
  <li>use the computer hardware in an <b>efficient</b> manner.</li>
</ol>
<p>Goals 2 and 3 can pull in different directions: convenience serves the person, efficiency serves the machine. Which one wins depends on the kind of system, as we will see in the table below.</p>
<p><b>Which programs are "the OS"?</b> A computer runs many programs, and the slides sort them into three kinds:</p>
<ul>
  <li>The <b>kernel</b> is <i>the one program running at all times</i> on the computer. It is the core part of the operating system.</li>
  <li>A <b>system program</b> ships with the operating system but is <b>not part of the kernel</b> (for example a shell or a file manager).</li>
  <li>An <b>application program</b> is any program not associated with the operating system (a game, a browser).</li>
</ul>
<p>Today’s OSes for general-purpose and mobile computing also include <b>middleware</b>: a set of software frameworks that give application developers additional services, such as databases, multimedia and graphics.</p>
<p><b>What operating systems do</b> depends on the point of view. Read the table row by row and ask: "what does this kind of user care about most?"</p>
<table class="t">
  <tr><th>Kind of system</th><th>What matters</th></tr>
  <tr><td>Personal computer</td><td>the user wants convenience, ease of use and good performance, and does not care about resource utilization</td></tr>
  <tr><td>Shared computer (<b>mainframe</b>, <b>minicomputer</b>)</td><td>the OS must keep all users happy, so it is a <b>resource allocator</b> and a <b>control program</b>: it makes efficient use of the hardware and manages the execution of user programs</td></tr>
  <tr><td>Dedicated systems (<b>workstations</b>)</td><td>users have dedicated resources but frequently use shared resources from servers</td></tr>
  <tr><td>Mobile devices (smartphones, tablets)</td><td>resource poor; optimized for usability and <b>battery life</b>; mobile user interfaces such as touch screens and voice recognition</td></tr>
  <tr><td>Embedded computers (in devices and automobiles)</td><td>little or no user interface; they run primarily without user intervention</td></tr>
</table>
<p>The pattern: when one person owns the machine, the OS optimizes for <b>convenience</b>. When many users share it, the OS becomes a <b>resource allocator</b> (it decides who gets which resource) and a <b>control program</b> (it manages how user programs run). When resources are scarce (mobile) or nobody is watching (embedded), it optimizes for battery life or for running on its own.</p>
<p>Finally, <b>defining</b> operating systems is hard because the term covers many roles: OSes exist in everything from toasters to ships, spacecraft, game machines, TVs and industrial control systems. Historically, OSes were born when fixed-use computers built for the military became general-purpose and therefore needed <b>resource management</b> and <b>program control</b>. Those two needs run through this whole course.</p>`,
      takeaway: `The OS is an intermediary between users and hardware, with three goals: run user programs, be convenient, use hardware efficiently. The kernel is the one program running at all times; system programs ship with the OS but are not the kernel; application programs are everything else. On shared machines the OS is a resource allocator and a control program.`,
      exam: `The three goals of the OS; kernel vs system program vs application program; middleware; the OS as resource allocator and control program.`
    },
    {
      id: 'evolution',
      h: 'Different OSes and the evolution of OSes',
      why: 'a map of where OSes came from',
      lead: `The definition fits very different systems. A quick look at today’s OSes and at the history of OS design gives us a map for the rest of the module: each historical step solved a problem that we meet again later.`,
      html: `
<p>The slides list six well-known operating systems. Use the table to connect each name with its maker and its typical use:</p>
<table class="t">
  <tr><th>OS</th><th>What the slide says</th></tr>
  <tr><td><b>Mac OS</b></td><td>a series of graphical-interface operating systems developed by Apple for Macintosh computers</td></tr>
  <tr><td><b>Linux</b></td><td>a Unix-like OS assembled under the model of free and open-source software</td></tr>
  <tr><td><b>Microsoft Windows</b></td><td>a series of graphical-interface operating systems developed by Microsoft</td></tr>
  <tr><td><b>iOS</b></td><td>Apple’s mobile OS, first for the iPhone (2007), later for the iPod Touch and other devices</td></tr>
  <tr><td><b>Android</b></td><td>a Linux-based OS for touchscreen devices, originally developed by Android, Inc.</td></tr>
  <tr><td><b>BSD/OS</b></td><td>known for its reliability in server roles</td></tr>
</table>
<p>How did OSes get here? The history follows one theme: <b>keep the expensive hardware busy, and share it more and more widely</b>. Read the stages in order:</p>
<ul>
  <li><b>Serial processing</b> (1940): programs run one at a time, set up by hand; the machine waits during every setup.</li>
  <li><b>Batch processing</b> (1950): jobs are collected and run one after another automatically.</li>
  <li><b>Multiprogramming</b> (1960): several jobs are kept in memory; while one waits for I/O, the CPU runs another.</li>
  <li><b>Time sharing</b> (1965): the CPU switches between jobs so often that several users can work interactively at the same time.</li>
  <li><b>Parallel systems</b> (1980): several processors work together in one computer.</li>
  <li><b>Network-based systems</b> (1995): computers connected by networks share files and services.</li>
  <li><b>Distributed systems</b> (2010): many separate computers cooperate and look like one system.</li>
</ul>
<div data-viz="0"></div>
<p>Each stage shares the hardware more widely: first the CPU among jobs, then among users, then among several CPUs, and finally among whole computers on a network. Most of these words return later in this module: multiprogramming and time sharing in "Multiprogramming and multitasking", parallel systems in "Multiprocessors", network-based and distributed systems in "Distributed systems and computing environments".</p>`,
      viz: [{ name: 'flow', caption: 'Evolution of operating systems', props: { dir: 'v', steps: [
        { label: 'Serial Processing', sub: '1940', tone: 'muted' },
        { label: 'Batch Processing', sub: '1950', tone: 'c1' },
        { label: 'Multiprogramming', sub: '1960', tone: 'c2' },
        { label: 'Time Sharing', sub: '1965', tone: 'c3' },
        { label: 'Parallel System', sub: '1980', tone: 'c4' },
        { label: 'Network-based', sub: '1995', tone: 'c5' },
        { label: 'Distributed System', sub: '2010', tone: 'acc' }] } }],
      takeaway: `Order to remember: serial (1940) → batch (1950) → multiprogramming (1960) → time sharing (1965) → parallel (1980) → network-based (1995) → distributed (2010). Each step shares the hardware more widely.`,
      exam: `Put the stages in the right order; match the OS names (Mac OS, Linux, Windows, iOS, Android, BSD/OS) with their descriptions.`
    },
    {
      id: 'organization',
      h: 'Computer-system organization: controllers and drivers',
      why: 'how CPU and devices share the machine',
      lead: `The OS manages hardware, so first we need to know how the hardware is organized. The CPU is not the only active part: every device has its own piece of control hardware, the controller, which works at the same time as the CPU.`,
      html: `
<p>In a typical computer, one or more CPUs and several <b>device controllers</b> are connected through a <b>common bus</b> that gives access to a <b>shared memory</b>. Memory stores both data and instructions (Von Neumann again). The CPUs and the devices can execute <b>at the same time</b> (concurrently) — and because they all use the same memory, they <b>compete for memory cycles</b> (the moments in which memory can be read or written).</p>
<p>How does a device get its work done without the CPU doing everything? By a division of labour:</p>
<ul>
  <li>Each <b>device controller</b> is in charge of one type of device (disks, USB, graphics…) and has a <b>local buffer</b>, its own small memory.</li>
  <li>For each type of controller, the OS has a <b>device driver</b>: software that manages the controller and gives the kernel a <b>uniform interface</b> to it (the kernel talks to every disk in the same way, whatever the disk model).</li>
  <li>The actual I/O goes from the <b>device to the local buffer</b> of the controller. The CPU moves data between <b>main memory and the local buffers</b>.</li>
  <li>When the controller has finished its operation, it informs the CPU by causing an <b>interrupt</b>.</li>
</ul>
<p>The flow follows one input operation from the device to main memory:</p>
<div data-viz="0"></div>
<p>The words "controller" and "driver" are easy to mix up because they always come in pairs. The table compares them aspect by aspect:</p>
<table class="t">
  <tr><th>Aspect</th><th>Controller</th><th>Driver</th></tr>
  <tr><td>Definition</td><td>a <b>hardware</b> component (chip or circuitry) that manages the communication between the CPU and a device</td><td>a <b>software</b> program that allows the operating system to interact with the hardware</td></tr>
  <tr><td>Location</td><td>physical hardware inside the computer or device</td><td>a software layer in the operating system</td></tr>
  <tr><td>Role</td><td>executes low-level control of the device (moving data, signaling readiness)</td><td>translates OS requests into commands that the controller understands</td></tr>
  <tr><td>Example</td><td>disk controller, USB controller, graphics controller</td><td>disk driver, USB driver, graphics driver</td></tr>
</table>
<div class="callout analogy">The slide’s own analogy: the controller is the <b>operator</b> who does the physical work; the driver is the <b>translator</b> who makes communication between the OS and the operator possible.</div>
<p>One step in this story is still unclear: what exactly happens when the controller "causes an interrupt"? That is the next section.</p>`,
      viz: [{ name: 'flow', caption: 'The path of input data and the completion signal', props: { dir: 'h', steps: [
        { label: 'I/O device' },
        { label: 'Device controller', sub: 'local buffer', tone: 'warn' },
        { label: 'CPU', sub: 'receives the interrupt, moves the data', tone: 'acc' },
        { label: 'Main memory', tone: 'ok' }] } }],
      takeaway: `CPUs and device controllers run concurrently on a common bus and compete for memory cycles. A controller is hardware with a local buffer (the "operator"); a driver is OS software that gives the kernel a uniform interface to it (the "translator"). The controller reports completion with an interrupt.`,
      exam: `Controller = hardware ("operator"), driver = software ("translator"); how a controller tells the CPU it has finished (an interrupt).`
    },
    {
      id: 'interrupts',
      h: 'Interrupts',
      why: 'how hardware gets the CPU’s attention',
      lead: `A controller finishes its work at a moment the CPU cannot predict. Instead of the CPU checking again and again, the device interrupts it. This mechanism is the foundation of the whole OS.`,
      html: `
<p>An <b>interrupt</b> is a signal that makes the CPU stop what it is doing and run a special piece of code, the <b>interrupt service routine (ISR)</b>, also called the <b>interrupt handler</b>, which deals with the event. Afterwards the CPU goes back to the interrupted work as if nothing had happened.</p>
<div class="callout analogy">Think of a doorbell. You do not walk to the door every minute to check for visitors (that would waste your time); you keep working, and when the bell rings you stop, open the door, and then go back to what you were doing.</div>
<p>For this to work, three questions must be answered. The slides give the answers:</p>
<ol class="steps">
  <li><b>Where is the right handler?</b> The interrupt transfers control to the service routine, generally through the <b>interrupt vector</b>: a table that contains the <b>addresses of all the service routines</b>, one entry per type of interrupt. The CPU looks up the entry and jumps there — no searching is needed.</li>
  <li><b>How do we get back?</b> The interrupt architecture must <b>save the address of the interrupted instruction</b>. More generally, the OS preserves the state of the CPU by storing the <b>registers</b> and the <b>program counter</b>, so the interrupted program can later continue exactly where it stopped.</li>
  <li><b>What kind of event was it?</b> The OS determines which type of interrupt has occurred; <b>separate segments of code</b> decide what action to take for each type.</li>
</ol>
<p>Interrupts do not come only from hardware. A <b>trap</b> or <b>exception</b> is a <b>software-generated interrupt</b>, caused either by an <b>error</b> (for example a division by zero) or by a <b>user request</b> (a program asking the OS for a service). Because nearly everything the OS does starts with some interrupt, we say that an operating system is <b>interrupt driven</b>.</p>
<p><b>Interrupt timeline.</b> The chart shows a CPU and an I/O device over time. Follow one request: the program asks for I/O; the device transfers data while the CPU keeps running the user program; when the transfer is done, the device signals an interrupt; the CPU briefly runs the I/O interrupt processing (the ISR); then it returns to the user program. The CPU does useful work almost all the time — only the short ISR slices are spent on the interrupt.</p>
<div data-viz="0"></div>
<p><b>The interrupt-driven I/O cycle</b> puts the whole story into seven steps:</p>
<ol>
  <li>the <b>device driver</b> (running on the CPU) <b>initiates I/O</b>;</li>
  <li>the <b>I/O controller initiates I/O</b> on the device; meanwhile the CPU executes other code and <b>checks for interrupts between instructions</b>;</li>
  <li>when input is ready, output is complete or an error occurs, the controller <b>generates an interrupt signal</b>;</li>
  <li>the CPU receives the interrupt and transfers control to the <b>interrupt handler</b>;</li>
  <li>the handler processes the data and returns from the interrupt;</li>
  <li>the CPU <b>resumes</b> the interrupted task;</li>
  <li>the cycle repeats.</li>
</ol>
<div data-viz="1"></div>
<div class="callout key">Look at step 2: the CPU checks for interrupts <b>between</b> instructions, never in the middle of one. When the handler runs, every instruction is either completely done or not started.</div>
<p>The cycle shows how the CPU learns that I/O has finished. But what does the <i>program</i> that asked for the I/O do in the meantime? Next section.</p>`,
      viz: [
        { name: 'timeline', caption: 'Interrupt timeline: two I/O requests in a row', props: {
          max: 30, rows: [
            { label: 'CPU', segs: [
              { from: 0, to: 10, label: 'user program', tone: 'acc' }, { from: 10, to: 12, label: 'ISR', tone: 'warn' },
              { from: 12, to: 24, label: 'user program', tone: 'acc' }, { from: 24, to: 26, label: 'ISR', tone: 'warn' },
              { from: 26, to: 30, label: 'user', tone: 'acc' }] },
            { label: 'I/O device', segs: [
              { from: 0, to: 2, label: 'idle', tone: 'muted' }, { from: 2, to: 9, label: 'transferring', tone: 'ok' },
              { from: 9, to: 16, label: 'idle', tone: 'muted' }, { from: 16, to: 23, label: 'transferring', tone: 'ok' },
              { from: 23, to: 30, label: 'idle', tone: 'muted' }] }],
          marks: [{ t: 2, label: 'I/O request' }, { t: 9, label: 'transfer done' }, { t: 10, label: 'interrupt signaled' }, { t: 12, label: 'interrupt handled' },
            { t: 16, label: 'I/O request' }, { t: 23, label: 'transfer done' }, { t: 24, label: 'interrupt signaled' }, { t: 26, label: 'interrupt handled' }] } },
        { name: 'flow', caption: 'Interrupt-driven I/O cycle (step 7: back to the start)', props: { dir: 'v', loop: true, steps: [
          { label: 'Device driver initiates I/O', sub: 'CPU', tone: 'acc' },
          { label: 'Controller initiates I/O', sub: 'I/O controller', tone: 'muted' },
          { label: 'Input ready / output complete / error', sub: 'controller generates interrupt signal', tone: 'warn' },
          { label: 'CPU receives interrupt', sub: 'transfers control to interrupt handler', tone: 'bad' },
          { label: 'Handler processes data', sub: 'returns from interrupt', tone: 'c2' },
          { label: 'CPU resumes interrupted task', tone: 'ok' }] } }
      ],
      takeaway: `On an interrupt the CPU saves its state (registers + program counter), jumps through the interrupt vector (a table of ISR addresses) to the right handler, handles the event and resumes. A trap/exception is a software-generated interrupt (an error or a user request). The OS is interrupt driven.`,
      exam: `What the interrupt vector contains; what is saved (registers + PC); trap = software-generated interrupt; the steps of the interrupt-driven I/O cycle; interrupts are checked between instructions.`
    },
    {
      id: 'io-structure',
      h: 'I/O structure: waiting or not waiting for I/O',
      why: 'what a program does while I/O runs',
      lead: `Thanks to interrupts, the CPU learns when an I/O operation is finished. But what should the program that started the I/O do until then? There are two designs.`,
      html: `
<p>After an I/O operation starts, the OS can give control back to the user program at two different moments. Compare the two columns:</p>
<div class="cols">
  <div><b>Method 1 — return only when the I/O is complete</b> (synchronous)
    <ul>
      <li>a <b>wait instruction</b> idles the CPU until the next interrupt;</li>
      <li>or a <b>wait loop</b>: the CPU spins in a loop, which also causes contention for memory access;</li>
      <li>at most <b>one</b> I/O request is <b>outstanding</b> (started but not finished) at a time: there is no simultaneous I/O processing.</li>
    </ul>
  </div>
  <div><b>Method 2 — return without waiting for the I/O</b> (asynchronous)
    <ul>
      <li>a <b>system call</b> — a request to the OS — lets the user wait for I/O completion only when the program really needs the result;</li>
      <li>the OS keeps a <b>device-status table</b> with one entry for each I/O device, giving its <b>type, address and state</b>;</li>
      <li>the OS indexes into this table to find the status of a device, and modifies the entry to record the interrupt.</li>
    </ul>
  </div>
</div>
<p>The timeline shows the difference schematically. With method 1 the program simply stops while the device works. With method 2 the program keeps computing, and a short interrupt at the end updates the device-status table.</p>
<div data-viz="0"></div>
<p>Method 1 is simple, but it wastes the CPU and allows only one I/O at a time. Method 2 needs bookkeeping — and that is exactly why the device-status table exists: with many requests outstanding at once, the OS must remember which device is doing what.</p>
<p>Both methods still share one cost: the CPU is interrupted for every piece of data the device delivers. For a fast device that is far too many interrupts — the fix is the next section.</p>`,
      viz: [{ name: 'timeline', caption: 'Schematic: what the program does during the I/O', props: {
        max: 20, rows: [
          { label: '1: waits', segs: [{ from: 0, to: 5, label: 'user', tone: 'acc' }, { from: 5, to: 13, label: 'wait for I/O', tone: 'muted' }, { from: 13, to: 20, label: 'user', tone: 'acc' }] },
          { label: '2: does not wait', segs: [{ from: 0, to: 5, label: 'user', tone: 'acc' }, { from: 5, to: 13, label: 'user program continues', tone: 'ok' }, { from: 13, to: 14, label: 'int', tone: 'warn' }, { from: 14, to: 20, label: 'user', tone: 'acc' }] }],
        marks: [{ t: 5, label: 'I/O start' }, { t: 13, label: 'I/O done' }] } }],
      takeaway: `Synchronous I/O: the program waits (wait instruction or wait loop), and at most one request is outstanding. Asynchronous I/O: control returns at once; the OS tracks every device in a device-status table (type, address, state).`,
      exam: `What the device-status table contains; the limitation of the synchronous method (only one outstanding I/O request at a time).`
    },
    {
      id: 'dma',
      h: 'Direct Memory Access (DMA)',
      why: 'fast devices without CPU overhead',
      lead: `With interrupt-driven I/O, the CPU is interrupted for every small piece of data it has to move. For a slow keyboard that is fine; for a fast disk it would keep the CPU busy all the time. Direct Memory Access takes the CPU out of the data path.`,
      html: `
<p><b>Direct Memory Access (DMA)</b> is used for <b>high-speed I/O devices</b> that can transmit information at close to memory speeds. The idea, step by step:</p>
<ol class="steps">
  <li>The driver, running on the CPU, prepares the transfer: which block of data, and where in memory it should go.</li>
  <li>The device controller transfers the whole <b>block</b> of data from its buffer storage <b>directly to main memory, without CPU intervention</b>.</li>
  <li>When the block is done, the controller generates <b>one interrupt per block</b>, rather than one interrupt per byte.</li>
</ol>
<p>So for a block of 1,000 bytes the CPU handles one interrupt instead of 1,000 — and while the block is moving, the CPU is free to run programs.</p>
<p>The slide "How a Modern Computer Works" (a Von Neumann architecture) puts together everything we have seen about hardware so far. Read the arrows of the diagram:</p>
<ul>
  <li>between the <b>CPUs</b> (N of them, each with a thread of execution and its own <b>cache</b>) and <b>memory</b> (instructions and data): the <b>instruction execution cycle</b> (fetching instructions) and <b>data movement</b>;</li>
  <li>between the CPU and the <b>devices</b> (M of them): <b>I/O requests</b> go to the device, <b>data</b> and <b>interrupts</b> come back;</li>
  <li>between the devices and memory: the direct <b>DMA</b> path, which bypasses the CPU.</li>
</ul>
<div data-viz="0"></div>
<p>DMA writes straight into main memory. That raises a question we have skipped so far: what exactly is main memory, and where are data kept when they are not in memory? Next: storage.</p>`,
      viz: [{ name: 'graph', caption: 'How a modern computer works: DMA is a direct path between devices and memory', props: { w: 600, h: 300,
        nodes: [
          { id: 'cpu', label: 'CPU (×N)', sub: 'thread + cache', x: 120, y: 70, w: 150, h: 56, tone: 'acc' },
          { id: 'mem', label: 'memory', sub: 'instructions and data', x: 470, y: 70, w: 160, h: 56, tone: 'ok' },
          { id: 'dev', label: 'device (×M)', x: 120, y: 245, shape: 'pill', tone: 'warn' }],
        edges: [
          { from: 'cpu', to: 'mem', label: 'instruction execution cycle', both: true, bend: -25 },
          { from: 'cpu', to: 'mem', label: 'data movement', both: true, bend: 25 },
          { from: 'cpu', to: 'dev', label: 'I/O request', bend: -30 },
          { from: 'dev', to: 'cpu', label: 'data', both: true },
          { from: 'dev', to: 'cpu', label: 'interrupt', bend: -30, tone: 'bad' },
          { from: 'dev', to: 'mem', label: 'DMA', both: true, tone: 'acc' }] } }],
      takeaway: `DMA is for high-speed devices: the controller moves whole blocks between its buffer and main memory without the CPU, and raises one interrupt per block instead of one per byte.`,
      exam: `DMA: blocks moved without CPU intervention, one interrupt per block (not per byte), used for high-speed I/O devices.`
    },
    {
      id: 'storage',
      h: 'Storage structure and the storage hierarchy',
      why: 'where data live, and why in levels',
      lead: `A program and its data must be in memory for the CPU to use them — yet memory is limited and forgets everything when the power goes off. So every computer combines several kinds of storage.`,
      html: `
<p><b>Main memory</b> is the only large storage that the CPU can access <b>directly</b>. It is <b>random access</b> (any location can be read equally fast), typically <b>volatile</b> (its content is lost when the power is off), and typically built from <b>DRAM</b> (Dynamic Random-Access Memory).</p>
<p>Because main memory is volatile and limited, we also need <b>secondary storage</b>: an extension of main memory that provides large <b>nonvolatile</b> storage capacity (it keeps data without power). The two main kinds:</p>
<ul>
  <li><b>Hard disk drives (HDD)</b>: rigid metal or glass <b>platters</b> covered with magnetic recording material. The disk surface is logically divided into <b>tracks</b>, which are subdivided into <b>sectors</b>. The <b>disk controller</b> determines the logical interaction between the device and the computer.</li>
  <li><b>Non-volatile memory (NVM) devices</b>: faster than hard disks, and nonvolatile; built with various technologies; becoming more popular as capacity and performance increase and prices drop.</li>
</ul>
<p><b>Units.</b> To compare sizes we need units. The basic unit of storage is the <b>bit</b>, which holds one of two values, 0 or 1; all other storage is built from collections of bits — enough bits can represent numbers, letters, images, movies, sounds, documents and programs. A <b>byte</b> is 8 bits and, on most computers, the smallest convenient chunk of storage. A <b>word</b> is a computer architecture’s native unit of data, made of one or more bytes: a computer with 64-bit registers and 64-bit memory addressing typically has 64-bit (8-byte) words, and executes many operations a word at a time rather than a byte at a time. Storage and throughput are generally measured in bytes and multiples of bytes — note that each step is <b>1,024</b>, not 1,000:</p>
<div class="formula">KB = 1,024 B &nbsp;|&nbsp; MB = 1,024² B &nbsp;|&nbsp; GB = 1,024³ B &nbsp;|&nbsp; TB = 1,024⁴ B &nbsp;|&nbsp; PB = 1,024⁵ B</div>
<p><b>The storage hierarchy.</b> No technology is fast, large, cheap and permanent all at once. So storage systems are organized in a <b>hierarchy</b> by <b>speed</b>, <b>cost</b> and <b>volatility</b>. Read the pyramid from top to bottom: each level is larger and slower (and cheaper per byte) than the one above. The top three levels — registers, cache, main memory — are <b>primary</b> storage and <b>volatile</b>. From nonvolatile memory downwards everything is <b>nonvolatile</b>: <b>secondary</b> storage (NVM, hard disks) and then <b>tertiary</b> storage (optical disks, magnetic tapes).</p>
<div data-viz="0"></div>
<p>How can we get the speed of the top together with the size of the bottom? By <b>caching</b>: copying information into a faster storage system. Main memory, for example, can be viewed as a cache for secondary storage. (And, as for every device, a <b>device driver</b> for each device controller manages its I/O and provides a uniform interface between the controller and the kernel.) Caching is so important that it gets its own section next.</p>`,
      viz: [{ name: 'layers', caption: 'Storage-device hierarchy: primary (volatile) · secondary · tertiary', props: { pyramid: true, top: 'smaller · faster', bottom: 'larger · slower', layers: [
        { label: 'registers', sub: 'primary · volatile', tone: 'acc' },
        { label: 'cache', sub: 'primary · volatile', tone: 'acc' },
        { label: 'main memory', sub: 'primary · volatile', tone: 'acc' },
        { label: 'nonvolatile memory', sub: 'secondary · nonvolatile', tone: 'ok' },
        { label: 'hard-disk drives', sub: 'secondary · nonvolatile', tone: 'ok' },
        { label: 'optical disk', sub: 'tertiary', tone: 'muted' },
        { label: 'magnetic tapes', sub: 'tertiary', tone: 'muted' }] } }],
      takeaway: `Main memory (typically DRAM) is the only large storage the CPU accesses directly, but it is volatile; secondary storage (HDD with tracks and sectors, NVM) is large and nonvolatile. The hierarchy trades speed against size and cost; the volatile/nonvolatile border lies just below main memory. 1 KB = 1,024 bytes; a word is the architecture’s native unit of data.`,
      exam: `The order of the hierarchy and the volatile/nonvolatile border (below main memory); 1 KB = 1,024 B; what a word is; HDD tracks and sectors.`
    },
    {
      id: 'caching',
      h: 'Caching',
      why: 'getting speed and size at once',
      lead: `The hierarchy gives us small-and-fast and big-and-slow storage. Caching is the trick that makes the whole hierarchy feel almost as fast as its top level.`,
      html: `
<p><b>Caching</b> is an important principle, used at many levels of a computer — in hardware, in the operating system and in software. Information in use is <b>copied temporarily</b> from slower to faster storage. It works like this:</p>
<ol class="steps">
  <li>When information is needed, the faster storage (the <b>cache</b>) is <b>checked first</b>.</li>
  <li>If the information is there (a <b>cache hit</b>), it is used directly from the cache — fast.</li>
  <li>If not (a <b>cache miss</b>), the data are copied into the cache and used there, so the next access will be fast.</li>
</ol>
<div class="callout analogy">Think of a desk and a library. You keep the few books you are using on your desk (the cache) and walk to the shelves (the slow storage) only when a book is not on the desk.</div>
<p>The cache is always <b>smaller</b> than the storage being cached, so it cannot hold everything. This makes <b>cache management</b> an important design problem: choosing the <b>cache size</b> and the <b>replacement policy</b> (which item to remove when the cache is full).</p>
<p>The slide table gives the five levels of the hierarchy in numbers. Read it from left to right: the typical size grows from under 1 KB to under 10 TB, while the access time grows from about 0.25 ns to 5,000,000 ns — about twenty million times slower. For this course the most important row is <b>"Managed by"</b>: who decides what is stored at that level.</p>
<table class="t">
  <tr><th>Level</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th></tr>
  <tr><td>Name</td><td>registers</td><td>cache</td><td>main memory</td><td>solid-state disk</td><td>magnetic disk</td></tr>
  <tr><td>Typical size</td><td>&lt; 1 KB</td><td>&lt; 16 MB</td><td>&lt; 64 GB</td><td>&lt; 1 TB</td><td>&lt; 10 TB</td></tr>
  <tr><td>Implementation technology</td><td>custom memory with multiple ports CMOS</td><td>on-chip or off-chip CMOS SRAM</td><td>CMOS SRAM</td><td>flash memory</td><td>magnetic disk</td></tr>
  <tr><td>Access time (ns)</td><td>0.25–0.5</td><td>0.5–25</td><td>80–250</td><td>25,000–50,000</td><td>5,000,000</td></tr>
  <tr><td>Bandwidth (MB/s)</td><td>20,000–100,000</td><td>5,000–10,000</td><td>1,000–5,000</td><td>500</td><td>20–150</td></tr>
  <tr><td><b>Managed by</b></td><td><b>compiler</b></td><td><b>hardware</b></td><td>operating system</td><td>operating system</td><td>operating system</td></tr>
  <tr><td>Backed by</td><td>cache</td><td>main memory</td><td>disk</td><td>disk</td><td>disk or tape</td></tr>
</table>
<p>The pattern: the <b>compiler</b> decides which values go into registers, the <b>hardware</b> moves data into the cache automatically, and the <b>operating system</b> manages everything from main memory downwards. Each level is "backed by" a slower level — it acts as a cache for it. Movement of data between levels can be <b>explicit</b> (done on purpose by an instruction or by the OS) or <b>implicit</b> (done automatically by the hardware).</p>
<div class="callout warn">The table, copied from the slide, gives "CMOS SRAM" as the technology of main memory, while the slide on storage structure says main memory is typically <b>DRAM</b>. If you are asked what main memory is usually made of, answer DRAM.</div>
<p><b>Migration of data "A" from disk to register.</b> To be used in a computation, a value A stored on disk travels up the hierarchy: disk → main memory → cache → hardware register.</p>
<div data-viz="0"></div>
<p>Now A may exist in up to four copies at the same time — and that is the danger of caching. If one copy changes, the others become stale:</p>
<ul>
  <li>in a <b>multitasking</b> environment, every process must use the <b>most recent value</b> of A, no matter where in the hierarchy it is stored;</li>
  <li>in a <b>multiprocessor</b> environment each CPU has its own cache, so the hardware must provide <b>cache coherency</b>: all CPUs must have the most recent value in their cache;</li>
  <li>in a <b>distributed</b> environment the situation is even more complex, because several copies of a datum can exist on different computers.</li>
</ul>
<p>The second bullet mentioned machines with several CPUs. What do they look like, and why build them? Next section.</p>`,
      viz: [{ name: 'flow', caption: 'Migration of data "A" from disk to register', props: { dir: 'h', steps: [
        { label: 'magnetic disk', tone: 'muted' }, { label: 'main memory', tone: 'ok' },
        { label: 'cache', tone: 'warn' }, { label: 'hardware register', tone: 'acc' }] } }],
      takeaway: `Caching copies information in use into faster storage: check the cache first; on a miss, copy the data into it. Caches are small, so their size and replacement policy matter. Registers are managed by the compiler, cache by hardware, the levels below by the OS. Copies at several levels must stay consistent — in multiprocessors this is cache coherency.`,
      exam: `Who manages each level (registers — compiler, cache — hardware, the rest — OS); the path of A: disk → main memory → cache → register; cache coherency.`
    },
    {
      id: 'architecture',
      h: 'Multiprocessors: SMP, multicore and NUMA',
      why: 'more CPUs, more work done',
      lead: `One CPU can only do so much work. The obvious way to do more is to use several processors — but then they must share memory and caches, and the way they share defines the architecture.`,
      html: `
<p>Most systems use a single <b>general-purpose processor</b>, and most also have <b>special-purpose processors</b> (for example inside device controllers). But <b>multiprocessor systems</b> — also known as <b>parallel systems</b> or <b>tightly-coupled systems</b> — are growing in use and importance. They have three advantages:</p>
<ol>
  <li><b>Increased throughput</b>: more work is done in the same time.</li>
  <li><b>Economy of scale</b>: the processors share memory, storage and power supplies, so one multiprocessor costs less than several separate single-processor computers.</li>
  <li><b>Increased reliability</b>: if one processor fails, the others continue. The system either slows down instead of stopping (<b>graceful degradation</b>) or keeps working correctly despite the failure (<b>fault tolerance</b>).</li>
</ol>
<p>There are two ways to divide the work among the processors:</p>
<ul>
  <li><b>Asymmetric multiprocessing</b>: each processor is assigned a <b>specific task</b>.</li>
  <li><b>Symmetric multiprocessing (SMP)</b>: each processor performs <b>all tasks</b>.</li>
</ul>
<p>Physically, the extra processing power can come as separate processor chips or as several cores on one chip. The table compares the two designs shown on the slides; look at the "Shared" row:</p>
<table class="t">
  <tr><th></th><th>SMP architecture</th><th>Dual-core design (multicore)</th></tr>
  <tr><td>Structure</td><td>separate processors (processor<sub>0</sub>, processor<sub>1</sub>); each CPU has its own <b>registers</b> and <b>cache</b></td><td>one chip, processor<sub>0</sub>, with CPU core<sub>0</sub> and core<sub>1</sub>; each core has its own registers and <b>L1 cache</b></td></tr>
  <tr><td>Shared</td><td>main memory</td><td>the <b>L2 cache</b> and main memory</td></tr>
</table>
<p>The difference is what is shared: separate SMP processors share only main memory, while the cores of a multicore chip also share the L2 cache, which makes communication between cores faster. The slide lists the general forms: <b>multi-chip</b> and <b>multicore</b> systems, <b>systems containing all chips</b>, and a <b>chassis containing multiple separate systems</b>.</p>
<p>As more CPUs are added, one shared memory becomes a bottleneck: all CPUs compete for it. <b>Non-Uniform Memory Access (NUMA)</b> addresses this. Each CPU gets its own <b>local memory</b> (memory0…memory3 in the diagram), and the CPUs are connected by a shared <b>interconnect</b>. A CPU reaches its own memory quickly, but reaching another CPU’s memory goes through the interconnect and takes longer — the access time is not uniform, hence the name.</p>
<div data-viz="0"></div>
<p>You can see these ideas on a real <b>PC motherboard</b>: a processor socket for the CPU, <b>DRAM slots</b> for memory, <b>PCIe bus slots</b> for expansion cards, and I/O and power connectors. Once its slots are filled, the board is a working computer. Even a cheap general-purpose CPU contains several cores; some boards have several processor sockets; and more advanced computers allow several system boards, forming <b>NUMA systems</b>.</p>
<p>Multiprocessors put several CPUs into one machine. The next step is to connect several whole machines.</p>`,
      viz: [{ name: 'graph', caption: 'NUMA: each CPU has local memory; the CPUs are joined by an interconnect', props: { w: 600, h: 330,
        nodes: [
          { id: 'm0', label: 'memory0', x: 130, y: 40, tone: 'ok' }, { id: 'm1', label: 'memory1', x: 470, y: 40, tone: 'ok' },
          { id: 'c0', label: 'CPU0', x: 130, y: 120, tone: 'acc' }, { id: 'c1', label: 'CPU1', x: 470, y: 120, tone: 'acc' },
          { id: 'c2', label: 'CPU2', x: 130, y: 210, tone: 'acc' }, { id: 'c3', label: 'CPU3', x: 470, y: 210, tone: 'acc' },
          { id: 'm2', label: 'memory2', x: 130, y: 290, tone: 'ok' }, { id: 'm3', label: 'memory3', x: 470, y: 290, tone: 'ok' }],
        edges: [
          { from: 'm0', to: 'c0', both: true }, { from: 'm1', to: 'c1', both: true }, { from: 'm2', to: 'c2', both: true }, { from: 'm3', to: 'c3', both: true },
          { from: 'c0', to: 'c1', label: 'interconnect', dashed: true, both: true }, { from: 'c2', to: 'c3', dashed: true, both: true },
          { from: 'c0', to: 'c2', dashed: true, both: true }, { from: 'c1', to: 'c3', dashed: true, both: true },
          { from: 'c0', to: 'c3', dashed: true, both: true }, { from: 'c1', to: 'c2', dashed: true, both: true }] } }],
      takeaway: `Multiprocessors give increased throughput, economy of scale and reliability (graceful degradation or fault tolerance). Asymmetric: each processor has a specific task; symmetric (SMP): each processor performs all tasks. Cores of a multicore chip have private registers and L1 cache but share the L2 cache and memory. NUMA: local memory per CPU, slower access to remote memory over the interconnect.`,
      exam: `The three advantages of multiprocessors; asymmetric vs symmetric; what the cores of a multicore chip share (L2 cache + main memory); the idea of NUMA.`
    },
    {
      id: 'clustered',
      h: 'Clustered systems',
      why: 'several machines as one service',
      lead: `Multiprocessors put many CPUs into one computer. Clustered systems go one step further: several complete computers work together — mainly so that the service survives when one of them fails.`,
      html: `
<p>A <b>clustered system</b> is like a multiprocessor system, but made of <b>multiple systems working together</b>. Each member is a complete computer, called a <b>node</b>. The nodes are linked by an <b>interconnect</b> and usually share storage via a <b>storage-area network (SAN)</b> — a dedicated network that gives all nodes access to the same disks.</p>
<div data-viz="0"></div>
<p>The main purpose of a cluster is a <b>high-availability</b> service: a service that survives failures. Because every node can reach the shared storage, another node can take over the work of a failed one. There are two ways to organize this:</p>
<ul>
  <li><b>Asymmetric clustering</b>: one machine is in <b>hot-standby mode</b> — it only monitors the active server and takes over if that server fails.</li>
  <li><b>Symmetric clustering</b>: multiple nodes run applications and <b>monitor each other</b>, so no machine sits idle.</li>
</ul>
<p>Some clusters are built for <b>high-performance computing (HPC)</b> instead: one big job is split over many nodes, so the applications must be written to use <b>parallelization</b>. And because several nodes may access the same shared data, some clusters have a <b>distributed lock manager (DLM)</b> to avoid conflicting operations (two nodes changing the same data at the same time).</p>
<p>We have now seen the hardware, from a single CPU up to a cluster. But when you press the power button, main memory is empty — it is volatile. So how does the operating system get into memory in the first place? Next section.</p>`,
      viz: [{ name: 'graph', caption: 'Clustered system: computers linked by an interconnect and sharing a SAN', props: { w: 600, h: 230,
        nodes: [
          { id: 'a', label: 'computer', x: 100, y: 50 }, { id: 'b', label: 'computer', x: 300, y: 50 }, { id: 'c', label: 'computer', x: 500, y: 50 },
          { id: 'san', label: 'storage-area network', x: 300, y: 185, w: 190, tone: 'acc' }],
        edges: [
          { from: 'a', to: 'b', label: 'interconnect', both: true }, { from: 'b', to: 'c', label: 'interconnect', both: true },
          { from: 'a', to: 'san', both: true }, { from: 'b', to: 'san', both: true }, { from: 'c', to: 'san', both: true }] } }],
      takeaway: `A cluster is several computers working together and sharing storage through a SAN, mainly for high availability. Asymmetric clustering = one machine in hot-standby; symmetric clustering = all nodes run applications and monitor each other. HPC clusters need parallelized applications; a DLM prevents conflicting operations.`,
      exam: `Asymmetric (hot-standby) vs symmetric clustering; what a SAN is; why a DLM is needed.`
    },
    {
      id: 'startup',
      h: 'Computer startup and OS operations',
      why: 'how the OS gets into memory',
      lead: `At power-on, main memory is empty, so there is no operating system to run. Something stored permanently must load the kernel first. That is the job of the bootstrap program.`,
      html: `
<p>The <b>bootstrap program</b> is loaded at power-up or reboot. It is typically stored in <b>ROM</b> or <b>EPROM</b> (memory that keeps its content without power) and is generally known as <b>firmware</b>. It initializes all aspects of the system, then loads the operating-system <b>kernel</b> into RAM and starts its execution.</p>
<p>On a modern Linux PC this happens as a chain of stages. Each stage is small and only knows how to find and start the next one. Read the table from top to bottom:</p>
<table class="t">
  <tr><th>Stage</th><th>What it does</th></tr>
  <tr><td><b>BIOS / UEFI</b> (motherboard firmware)</td><td>initializes the hardware and runs the <b>Power-On Self Test (POST)</b>, checking that RAM, CPU and drives work properly; looks for the <b>boot sector</b> (the start of the drive, where the bootloader is) on the storage drive; then hands control over to software</td></tr>
  <tr><td><b>Bootloader</b> (e.g. <b>GRUB</b>)</td><td>a tiny program at the beginning of the drive; it locates the OS and loads it into RAM; it displays the OS selection menu (<b>dual-boot</b>: choosing between two installed OSes)</td></tr>
  <tr><td><b>Linux kernel</b></td><td>the OS "core" (the resource manager); it initializes the hardware drivers and mounts the <b>root file system</b> (makes the main file tree available)</td></tr>
  <tr><td><b>systemd (PID 1)</b></td><td>the <b>first process</b> launched by the kernel (process identifier 1); it starts all background services (GUI, connectivity, …) and daemons in parallel</td></tr>
  <tr><td>Login screen</td><td>the system is ready</td></tr>
</table>
<div data-viz="0"></div>
<p><b>Operating-system operations.</b> Once loaded, the kernel starts <b>system daemons</b>: services provided outside of the kernel, like the ones systemd launches. After that the kernel mostly waits. It is <b>interrupt driven</b> (by hardware and by software): it runs only when an event arrives. There are two sources of events:</p>
<ul>
  <li>a <b>hardware interrupt</b>, raised by one of the devices;</li>
  <li>a <b>software interrupt</b> (an <b>exception</b> or <b>trap</b>), caused either by a <b>software error</b> (e.g. division by zero) or by a request for an operating-system service — a <b>system call</b>.</li>
</ul>
<p>The slides add a list of other process problems the OS must handle: an <b>infinite loop</b> (a program that never gives the CPU back), and <b>processes modifying each other or the operating system</b>. These problems become serious as soon as several programs share the machine — which is exactly what the next section introduces.</p>`,
      viz: [{ name: 'flow', caption: 'Bootstrap: from power-on to the login screen', props: { dir: 'v', steps: [
        { label: 'Power-On', tone: 'muted' },
        { label: 'BIOS / UEFI', sub: 'HW init, POST, looks for the boot sector', tone: 'warn' },
        { label: 'Bootloader (GRUB)', sub: 'finds the OS, loads it into RAM, dual-boot menu', tone: 'c2' },
        { label: 'Linux kernel', sub: 'HW drivers, mounts the root FS', tone: 'acc' },
        { label: 'systemd (PID 1)', sub: 'starts services and daemons in parallel', tone: 'c3' },
        { label: 'Login screen', sub: 'system is ready', tone: 'ok' }] } }],
      takeaway: `The bootstrap program (firmware in ROM/EPROM) initializes the system and loads the kernel into RAM. On Linux: BIOS/UEFI (POST) → bootloader (GRUB) → kernel → systemd (PID 1) → login screen. The running kernel is interrupt driven: hardware interrupts come from devices, software interrupts (traps/exceptions) from errors or system calls.`,
      exam: `Where the bootstrap program is stored (ROM/EPROM, firmware); the chain BIOS/UEFI → GRUB → kernel → systemd; hardware vs software interrupt (trap: an error or a system call).`
    },
    {
      id: 'multiprogramming',
      h: 'Multiprogramming and multitasking',
      why: 'keep the CPU busy all the time',
      lead: `One program alone cannot keep the CPU busy: whenever it waits for I/O, the CPU sits idle. The fix is to keep several programs in memory and switch between them — and that idea, pushed further, gives interactive time sharing.`,
      html: `
<p>A single user cannot always keep the CPU and the I/O devices busy. <b>Multiprogramming</b> — the idea behind <b>batch systems</b> — organizes <b>jobs</b> (code and data) so that the CPU <b>always has one to execute</b>:</p>
<ol class="steps">
  <li>A subset of all the jobs in the system is kept in memory.</li>
  <li>One job is selected and run; this choice is called <b>job scheduling</b>.</li>
  <li>When the job has to wait (for I/O, for example), the OS <b>switches to another job</b>.</li>
  <li>When the first job has finished waiting, it can get the CPU back later.</li>
</ol>
<p>In the timeline, Job 1 computes and then waits for I/O. Instead of sitting idle, the CPU runs Job 2 and Job 3, and returns to Job 1 when its I/O is complete. The CPU row has no gaps.</p>
<div data-viz="0"></div>
<p><b>Multitasking</b> (<b>timesharing</b>) is a logical extension of batch systems: the CPU switches jobs <b>so frequently</b> that users can interact with each job while it is running. This is <b>interactive computing</b>, and it brings new requirements:</p>
<ul>
  <li>the <b>response time</b> should be <b>&lt; 1 second</b>, or the user feels the system is stuck;</li>
  <li>each user has at least one program executing in memory: a <b>process</b>;</li>
  <li>if several jobs are ready to run at the same time, the OS must choose one: <b>CPU scheduling</b> (a whole module later in the course);</li>
  <li>if the processes do not fit in memory, <b>swapping</b> moves them in and out of memory (to and from the disk) to run;</li>
  <li><b>virtual memory</b> allows the execution of processes that are <b>not completely</b> in memory.</li>
</ul>
<p>The difference in one sentence: batch multiprogramming switches only when a job has to wait (the goal is CPU utilization); timesharing switches often, on purpose, even when the job could continue (the goal is a fast response for interactive users).</p>
<p>With multiprogramming, the OS and several processes share one memory. The <b>memory layout for a multiprogrammed system</b> shows it: from address 0 to the maximum address, the operating system and processes 1–4 each occupy their own region.</p>
<div data-viz="1"></div>
<p>This picture also shows the danger. Nothing in it stops process 2 from writing into the region of process 3 or of the OS, and nothing stops a process from looping forever and never giving the CPU back. The OS needs help from the hardware to prevent this — that is the next section.</p>`,
      viz: [
        { name: 'timeline', caption: 'Multiprogramming: while Job 1 waits for I/O, the CPU runs other jobs', props: {
          max: 16, rows: [
            { label: 'CPU', segs: [{ from: 0, to: 4, label: 'Job 1', tone: 'c1' }, { from: 4, to: 9, label: 'Job 2', tone: 'c2' }, { from: 9, to: 12, label: 'Job 3', tone: 'c3' }, { from: 12, to: 16, label: 'Job 1', tone: 'c1' }] },
            { label: 'Job 1', segs: [{ from: 0, to: 4, label: 'CPU', tone: 'acc' }, { from: 4, to: 12, label: 'waits for I/O', tone: 'muted' }, { from: 12, to: 16, label: 'CPU', tone: 'acc' }] }] } },
        { name: 'layers', caption: 'Memory layout for a multiprogrammed system', props: { top: 'max', bottom: '0', layers: [
          { label: 'operating system', tone: 'muted' }, { label: 'process 1', tone: 'c1' }, { label: 'process 2', tone: 'c2' },
          { label: 'process 3', tone: 'c3' }, { label: 'process 4', tone: 'c4' }] } }
      ],
      takeaway: `Multiprogramming (batch): keep several jobs in memory and, when one waits for I/O, switch to another, so the CPU is always busy. Multitasking (timesharing): switch so often that users can interact (response time < 1 s); it needs processes, CPU scheduling, swapping and virtual memory.`,
      exam: `How timesharing differs from batch multiprogramming; response time &lt; 1 s; swapping vs virtual memory.`
    },
    {
      id: 'dual-mode',
      h: 'Dual-mode operation and the timer',
      why: 'protect the OS from programs',
      lead: `Many programs now share one machine, and any of them could overwrite the OS or loop forever. Software alone cannot stop this — the hardware must help. It does so with two mechanisms: dual-mode operation and the timer.`,
      html: `
<p><b>Dual-mode operation</b> allows the OS to protect itself and the other system components. The CPU runs in one of two modes: <b>user mode</b> (for user programs) or <b>kernel mode</b> (for the OS). A <b>mode bit</b>, provided by the <b>hardware</b>, tells which kind of code is running. In the slide’s diagram, <b>mode bit = 1 means user mode</b> and <b>mode bit = 0 means kernel mode</b>.</p>
<p>The modes matter because some machine instructions are designated as <b>privileged</b>: they can be executed <b>only in kernel mode</b>. If a user program tries one, the hardware does not execute it and traps to the OS instead. Privileged instructions are the dangerous ones — for example, setting the timer (see below).</p>
<p>This raises an obvious question, which the slide asks too: <i>how do we guarantee that a user program does not simply set the mode bit to "kernel" itself?</i> The answer: a user program cannot change the mode directly. The only way into kernel mode is a <b>system call</b>, which changes the mode to kernel; the <b>return from the call</b> resets it to user. So user code can enter the kernel only at the entry points the OS itself has defined.</p>
<p><b>Transition from user to kernel mode</b> — follow the diagram from left to right:</p>
<ol class="steps">
  <li>the user process is executing (user mode, mode bit = 1);</li>
  <li>it calls a system call;</li>
  <li>a <b>trap</b> switches the CPU to kernel mode (mode bit = 0);</li>
  <li>the kernel executes the system call;</li>
  <li><b>return</b> sets the mode bit back to 1;</li>
  <li>the user process continues after "return from system call".</li>
</ol>
<div data-viz="0"></div>
<p><b>The timer.</b> Dual mode stops a program from <i>doing</i> forbidden things, but not from <i>keeping</i> the CPU forever: an <b>infinite loop</b> (or a process hogging resources) contains no forbidden instruction at all. The OS needs a guaranteed way to get control back, whatever the program does. That is the <b>timer</b>:</p>
<ol class="steps">
  <li>The timer is set to interrupt the computer after some time period.</li>
  <li>It keeps a <b>counter</b> that is decremented by the physical clock.</li>
  <li>The operating system sets the counter — this is a <b>privileged instruction</b>, so a user program cannot switch the timer off.</li>
  <li>When the counter reaches zero, an <b>interrupt</b> is generated and the OS runs.</li>
  <li>The timer is set up <b>before</b> scheduling a process, so that the OS can regain control or terminate a program that exceeds its allotted time.</li>
</ol>
<div data-viz="1"></div>
<p>Together the two mechanisms close the gap that multiprogramming opened: dual mode protects memory and devices from user code, and the timer guarantees that the CPU always comes back to the OS. With the OS safely in control, we can now look at what it actually manages.</p>`,
      viz: [
        { name: 'graph', caption: 'Top: user mode (mode bit = 1); bottom: kernel mode (mode bit = 0)', props: { w: 600, h: 240,
          nodes: [
            { id: 'u1', label: 'user process executing', x: 95, y: 55, w: 160 },
            { id: 'u2', label: 'calls system call', x: 290, y: 55, w: 140 },
            { id: 'u3', label: 'return from system call', x: 495, y: 55, w: 170 },
            { id: 'k', label: 'execute system call', sub: 'kernel', x: 390, y: 190, w: 160, tone: 'acc' }],
          edges: [
            { from: 'u1', to: 'u2' },
            { from: 'u2', to: 'k', label: 'trap: mode bit = 0', tone: 'warn' },
            { from: 'k', to: 'u3', label: 'return: mode bit = 1', tone: 'ok' }] } },
        { name: 'flow', caption: 'Timer: the OS is guaranteed to get control back', props: { dir: 'h', loop: true, steps: [
          { label: 'OS sets counter', sub: 'privileged instruction', tone: 'acc' },
          { label: 'Process runs', sub: 'counter-- by clock' },
          { label: 'Counter = 0', sub: 'timer interrupt', tone: 'warn' },
          { label: 'OS regains control', sub: 'schedule / terminate', tone: 'ok' }] } }
      ],
      takeaway: `The hardware mode bit: user = 1, kernel = 0. Privileged instructions run only in kernel mode; user code enters kernel mode only through a system call (trap), and the return switches back to user mode. The timer — a counter set by a privileged instruction, interrupt at zero — guarantees that the OS regains control from infinite loops.`,
      exam: `Mode bit values (user = 1, kernel = 0); why a user cannot switch to kernel mode by itself; why the timer exists and why setting it is privileged.`
    },
    {
      id: 'process-mgmt',
      h: 'OS components and process management',
      why: 'the main unit of work',
      lead: `The OS is now safely in control. What does it manage? The slides show eight components. The first and most central is process management, because every program runs as a process.`,
      html: `
<p>The slide "How an operating system works" draws the OS as a ring of <b>components</b>, each responsible for one kind of resource or task: <b>Process Management</b>, <b>File Management</b>, <b>Network Management</b>, <b>Main Memory Management</b>, <b>Secondary Storage Management</b>, <b>I/O Device Management</b>, <b>Security Management</b> and the <b>Command Interpreter System</b> (the program that reads and executes user commands). The next sections go through the most important ones.</p>
<p><b>Process management.</b> A <b>process</b> is a <b>program in execution</b>; it is the unit of work in the system. The difference matters: a <b>program</b> is a <b>passive entity</b> (a file of instructions on disk), while a <b>process</b> is an <b>active entity</b> (those instructions actually running, with a current position and current data). The same program can run as several processes at once.</p>
<p>A process needs resources to accomplish its task: CPU, memory, I/O, files, and initialization data. When it terminates, the OS must <b>reclaim</b> all reusable resources.</p>
<p>How does a process know where it is in its code? Through the program counter:</p>
<ul>
  <li>a <b>single-threaded</b> process has <b>one program counter</b>, specifying the location of the next instruction to execute; it executes instructions sequentially, one at a time, until completion;</li>
  <li>a <b>multi-threaded</b> process has <b>one program counter per thread</b> — several points of execution inside one process.</li>
</ul>
<p>A system typically has many processes, some user processes and some OS processes, running <b>concurrently</b> on one or more CPUs. Concurrency is obtained by <b>multiplexing</b> the CPUs among the processes/threads: each CPU switches quickly from one to another.</p>
<p>So the OS is responsible for these <b>process management activities</b> (each of them comes back as a whole module later in the course):</p>
<ul>
  <li>creating and deleting both user and system processes;</li>
  <li>suspending and resuming processes;</li>
  <li>providing mechanisms for process <b>synchronization</b>;</li>
  <li>providing mechanisms for process <b>communication</b>;</li>
  <li>providing mechanisms for <b>deadlock handling</b> (a deadlock is a situation in which processes wait for each other forever).</li>
</ul>
<p>Process, thread, interrupt… several of these words sound alike. Before moving on to the other resources, the next section lines them up side by side.</p>`,
      takeaway: `A process is a program in execution (active); a program is passive. A single-threaded process has one program counter; a multi-threaded process has one per thread. The OS creates and deletes, suspends and resumes processes, and provides synchronization, communication and deadlock handling.`,
      exam: `Program (passive) vs process (active); the number of program counters in a multi-threaded process; the five process management activities.`
    },
    {
      id: 'resume',
      h: 'Checkpoint: interrupt, process, thread, task, signal',
      why: 'five terms not to confuse',
      lead: `We have met interrupts, processes and threads; two more words, task and signal, appear all the time in practice. They are easy to confuse, so the slides compare all five side by side.`,
      html: `
<p>The table is the slide summary ("Resume"). Read each row from left to right: what it is → how it behaves → an everyday example.</p>
<table class="t">
  <tr><th>Concept</th><th>Definition</th><th>Key characteristics</th><th>Practical example</th></tr>
  <tr><td><b>Interrupt</b></td><td>an event (hardware or software) that temporarily halts the normal execution of a program to handle an urgent request</td><td>triggered by hardware (keyboard, disk) or software; handled by an <b>Interrupt Service Routine (ISR)</b>; can be <b>maskable</b> (the CPU may temporarily ignore it) or <b>non-maskable</b> (it cannot be ignored)</td><td>pressing a key: the CPU stops normal execution to read the character</td></tr>
  <tr><td><b>Process</b></td><td>a running program (in execution) with its own memory space and resources</td><td>has a state (ready, running, waiting); contains one or more threads; managed by the operating system</td><td>starting an application like Word or Firefox creates a process</td></tr>
  <tr><td><b>Thread</b></td><td>a lightweight unit of execution within a process; it shares memory and resources with the other threads of the same process</td><td>threads of a process share memory but have <b>separate stacks</b>; more efficient multitasking; cheaper to create and manage than processes</td><td>in a browser: one thread for the UI, another for downloading a page, another for executing JavaScript</td></tr>
  <tr><td><b>Task</b></td><td>a generic term for a unit of work (a process, a thread or a scheduled function)</td><td>more abstract than process or thread; often used in embedded systems and concurrency libraries</td><td>in an <b>RTOS</b> (real-time operating system), a task might be a routine that periodically reads a sensor</td></tr>
  <tr><td><b>Signal</b></td><td>a software mechanism for delivering events or notifications to a process</td><td>used to notify conditions (e.g. <b>SIGKILL</b> — kill the process, <b>SIGSEGV</b> — invalid memory access); can stop the process or invoke a <b>signal handler</b></td><td>pressing <b>CTRL+C</b> in a terminal sends <b>SIGINT</b> to the foreground process</td></tr>
</table>
<p>The lines to draw:</p>
<ul>
  <li><b>Interrupt vs signal</b>: an interrupt is an event for the <b>CPU</b>, handled by an ISR in the kernel; a signal is a notification that the OS delivers to a <b>process</b>, handled by the process’s signal handler (or it stops the process).</li>
  <li><b>Process vs thread</b>: a process owns its memory space and resources; threads live inside a process and share its memory, but each thread has its own <b>stack</b> (and, as we saw, its own program counter).</li>
  <li><b>Task</b> is the generic word: depending on the system it can mean a process, a thread or a scheduled function.</li>
</ul>
<p>A process needs resources — memory for its code and data, storage, files, devices. The next section shows how the OS manages each of them.</p>`,
      takeaway: `Interrupt = event that halts the normal flow to handle an urgent request (ISR; maskable or non-maskable). Process = program in execution with its own memory. Thread = lightweight unit inside a process: shared memory, separate stack. Task = generic unit of work. Signal = notification to a process (CTRL+C → SIGINT; SIGKILL, SIGSEGV).`,
      exam: `Distinguish interrupt (event for the CPU) from signal (notification to a process); thread vs process; the example CTRL+C → SIGINT.`
    },
    {
      id: 'resource-mgmt',
      h: 'Memory, storage, file-system and I/O management',
      why: 'what else the OS manages',
      lead: `A running process needs memory for its code and data, disks for long-term data, files to organize that data, and devices to do I/O. Each of these is a management area of the OS, with its own list of activities.`,
      html: `
<p>The table summarizes three management areas. For each, the middle column says <i>why</i> the area exists and the right column lists <i>what the OS does</i> there. Read the "why" column first — the activities follow from it.</p>
<table class="t">
  <tr><th>Area</th><th>Why it is needed</th><th>OS activities</th></tr>
  <tr><td><b>Memory management</b></td><td>to execute a program, all (or part) of its instructions and all (or part) of the data it needs must be in memory; memory management determines what is in memory and when, optimizing CPU utilization and the computer’s response to users</td><td>keeping track of which parts of memory are currently being used and by whom; deciding which processes (or parts of them) and data to move into and out of memory; allocating and deallocating memory space as needed</td></tr>
  <tr><td><b>Mass-storage management</b></td><td>disks store data that do not fit in main memory or that must be kept for a "long" period of time; proper management is of central importance, because the entire speed of the computer hinges on the disk subsystem and its algorithms</td><td>mounting and unmounting; <b>free-space management</b>; storage allocation; <b>disk scheduling</b>; partitioning; protection</td></tr>
  <tr><td><b>File-system management</b></td><td>the OS provides a uniform, logical view of information storage: it abstracts the physical properties into a logical storage unit, the <b>file</b>; each medium is controlled by a device (disk drive, tape drive) with varying properties — access speed, capacity, data-transfer rate, access method (sequential or random); files are usually organized into <b>directories</b>, with access control on most systems to determine who can access what</td><td>creating and deleting files and directories; primitives to manipulate files and directories; mapping files onto secondary storage; backing up files onto stable (non-volatile) storage media</td></tr>
</table>
<p>Two patterns are worth noticing. First, the activities are always of the same kind: <b>keep track</b> of who uses what, <b>allocate and free</b>, and <b>decide</b> what goes where. Second, the file system is an <b>abstraction</b>: the OS hides the physical differences between devices behind one logical unit, the file. (Two terms from the middle row: <b>mounting</b> attaches a device’s file system so its files become accessible; <b>partitioning</b> divides a disk into separate regions.)</p>
<p><b>I/O subsystem.</b> One purpose of the OS is to hide the peculiarities of hardware devices from the user. The I/O subsystem does this, and it is responsible for:</p>
<ul>
  <li>memory management of I/O, with three techniques:
    <ul>
      <li><b>buffering</b> — storing data temporarily while it is being transferred;</li>
      <li><b>caching</b> — storing parts of data in faster storage for performance;</li>
      <li><b>spooling</b> — the overlapping of output of one job with input of other jobs;</li>
    </ul>
  </li>
  <li>a general <b>device-driver interface</b>;</li>
  <li><b>drivers</b> for specific hardware devices.</li>
</ul>
<div class="callout warn">Buffering, caching and spooling all keep data somewhere for a while, so they are easy to confuse. The difference is the purpose: a <b>buffer</b> holds data <i>in transit</i> from one place to another; a <b>cache</b> holds a <i>copy</i> so that repeated access is faster; <b>spooling</b> lets the output of one job (for example to a printer) overlap with the input of other jobs, so a slow device does not hold everyone up.</div>
<p>All these resources are shared by many users and processes, so the OS must also decide <i>who may access what</i>. That is protection and security, next.</p>`,
      takeaway: `Memory management: track usage, decide what to move in and out, allocate and free. Mass-storage management: mounting, free-space management, storage allocation, disk scheduling, partitioning, protection. File-system management: files and directories, mapping onto secondary storage, backup. I/O subsystem: buffering, caching, spooling, a general driver interface and specific drivers.`,
      exam: `Distinguish buffering / caching / spooling; know which area an activity belongs to (e.g. disk scheduling and free-space management are mass-storage management).`
    },
    {
      id: 'protection',
      h: 'Protection and security',
      why: 'who may use what',
      lead: `Every resource in the previous section is shared. The OS must make sure that each user and process touches only what it is allowed to touch — and it must defend the whole system against attacks. These are two different jobs.`,
      html: `
<p>The slides separate two ideas:</p>
<ul>
  <li><b>Protection</b> is any mechanism for <b>controlling access</b> of processes or users to the resources defined by the OS. (Dual mode and the timer, seen earlier, are protection mechanisms.)</li>
  <li><b>Security</b> is the <b>defense</b> of the system against internal and external <b>attacks</b> — a huge range, including denial-of-service (making a service unusable by overloading it), worms, viruses, identity theft and theft of service.</li>
</ul>
<p>In short: protection is about <i>rules</i> (who may do what); security is about <i>attackers</i> (someone trying to break or get around the rules). Perfect protection is still useless if an attacker can steal a valid user’s identity — that is a security problem.</p>
<p>Both start from knowing <b>who</b> is asking. Systems generally first distinguish among users, to determine who can do what:</p>
<ol class="steps">
  <li><b>User identities</b> (<b>user IDs</b>, also called <b>security IDs</b>) include a name and an associated number, one per user.</li>
  <li>The user ID is then associated with all files and processes of that user, to determine access control.</li>
  <li>A <b>group identifier</b> (<b>group ID</b>) allows a set of users to be defined and their access to be managed together; it is also associated with each process and file.</li>
  <li><b>Privilege escalation</b> allows a user to change to an <b>effective ID</b> with more rights (for example, to run one administrative command).</li>
</ol>
<p>So far everything has happened inside one OS on one machine. Virtualization changes that picture: one machine, several complete operating systems.</p>`,
      takeaway: `Protection = controlling the access of processes and users to resources. Security = defending the system against internal and external attacks (denial-of-service, worms, viruses, identity theft, theft of service). Access control uses user IDs and group IDs attached to files and processes; privilege escalation switches to an effective ID with more rights.`,
      exam: `Protection (access control) vs security (defense against attacks); user ID, group ID, privilege escalation.`
    },
    {
      id: 'virtualization',
      h: 'Virtualization',
      why: 'run OSes inside other OSes',
      lead: `Protection keeps processes apart inside one OS. Virtualization goes a level higher: it lets one computer run several complete operating systems at the same time, each one behaving as if it had the machine to itself.`,
      html: `
<p>In the broad sense, virtualization <b>allows operating systems to run applications within other OSes</b> — a vast and growing industry. The slides distinguish three techniques by what is different between the code and the real machine:</p>
<table class="t">
  <tr><th>Technique</th><th>When it is used</th><th>Note</th></tr>
  <tr><td><b>Emulation</b></td><td>the source CPU type is different from the target CPU type (e.g. PowerPC code on Intel x86), so every instruction must be translated</td><td>generally the <b>slowest</b> method</td></tr>
  <tr><td><b>Interpretation</b></td><td>the computer language is not compiled to native code; an interpreter executes the program</td><td>—</td></tr>
  <tr><td><b>Virtualization</b></td><td>the OS is natively compiled for the CPU and runs <b>guest</b> OSes that are also natively compiled for that CPU</td><td>no instruction translation is needed</td></tr>
</table>
<p>The pattern: emulation is slow because it translates every instruction for a foreign CPU; in virtualization the guest code already speaks the language of the real CPU.</p>
<p>The slide’s example: VMware running several Windows XP guests, each running applications, all on a native Windows XP <b>host</b> OS. The <b>host</b> is the OS that owns the real hardware; a <b>guest</b> is an OS running inside a virtual machine. The <b>VMM</b> (<b>virtual machine manager</b>) is the software that provides the virtualization services.</p>
<p><b>Use cases</b>:</p>
<ul>
  <li>laptops and desktops running multiple OSes for exploration or compatibility (an Apple laptop with a Mac OS X host and Windows as a guest);</li>
  <li>developing apps for multiple OSes without having multiple systems;</li>
  <li>quality-assurance (QA) testing of applications without having multiple systems;</li>
  <li>executing and managing compute environments within data centers.</li>
</ul>
<div class="callout note">A VMM can also run <b>natively</b> on the hardware. Then the VMM is itself the host, and there is no general-purpose host OS at all (<b>VMware ESX</b>, <b>Citrix XenServer</b>).</div>
<p>The diagram compares the two situations. In (a), without virtualization, processes use the kernel through its programming interface, and the kernel runs on the hardware. In (b), each virtual machine (VM1–VM3) has its own kernel and its own processes; the virtual machine manager sits between those kernels and the real hardware.</p>
<div data-viz="0"></div>
<p>Virtualization is the foundation of modern data centers and of the cloud. Before the cloud, though, we look at the more general picture: computers connected by networks.</p>`,
      viz: [{ name: 'graph', caption: '(a) without virtualization · (b) VM1–VM3 on top of a virtual machine manager', props: { w: 600, h: 300,
        nodes: [
          { id: 'pa', label: 'processes', x: 75, y: 50 },
          { id: 'ka', label: 'kernel', x: 75, y: 160, tone: 'acc' },
          { id: 'ha', label: 'hardware', x: 75, y: 260, tone: 'muted' },
          { id: 'p1', label: 'processes', x: 290, y: 40 }, { id: 'p2', label: 'processes', x: 410, y: 40 }, { id: 'p3', label: 'processes', x: 530, y: 40 },
          { id: 'k1', label: 'kernel', sub: 'VM1', x: 290, y: 120, tone: 'acc' }, { id: 'k2', label: 'kernel', sub: 'VM2', x: 410, y: 120, tone: 'acc' }, { id: 'k3', label: 'kernel', sub: 'VM3', x: 530, y: 120, tone: 'acc' },
          { id: 'vmm', label: 'virtual machine manager', x: 410, y: 200, w: 340, tone: 'warn' },
          { id: 'hb', label: 'hardware', x: 410, y: 265, w: 340, tone: 'muted' }],
        edges: [
          { from: 'pa', to: 'ka', label: 'programming interface' }, { from: 'ka', to: 'ha' },
          { from: 'p1', to: 'k1' }, { from: 'p2', to: 'k2' }, { from: 'p3', to: 'k3' },
          { from: 'k1', to: 'vmm' }, { from: 'k2', to: 'vmm' }, { from: 'k3', to: 'vmm' }, { from: 'vmm', to: 'hb' }] } }],
      takeaway: `Emulation = a different CPU type (generally the slowest); interpretation = a language not compiled to native code; virtualization = guest OSes natively compiled for the same CPU, run by a VMM on a host. A VMM running natively (VMware ESX, Citrix XenServer) is itself the host.`,
      exam: `Emulation vs interpretation vs virtualization; the role of the VMM; native VMMs (ESX, XenServer).`
    },
    {
      id: 'environments',
      h: 'Distributed systems and computing environments',
      why: 'where OSes run: phones to networks',
      lead: `Most computers today are not alone: they are connected to others. A distributed system is a group of computers that cooperate over a network, and the way they cooperate defines the computing environment.`,
      html: `
<p>A <b>distributed system</b> is a collection of separate, possibly <b>heterogeneous</b> (different hardware and software), systems networked together. The <b>network</b> is the communications path; <b>TCP/IP</b> is the most common protocol. Networks are named after the area they cover:</p>
<ul>
  <li><b>PAN</b> — Personal Area Network (devices around one person);</li>
  <li><b>LAN</b> — Local Area Network (a room, a building, a campus);</li>
  <li><b>MAN</b> — Metropolitan Area Network (a city);</li>
  <li><b>WAN</b> — Wide Area Network (countries, the world).</li>
</ul>
<p>A <b>network operating system</b> provides features between systems across the network: a communication scheme allows the systems to exchange messages, and this creates the <b>illusion of a single system</b>.</p>
<p>The slides list six <b>computing environments</b>: Basic, Mobile, Client-Server, Peer-to-Peer, Cloud computing and Real-time Embedded. The table covers five of them (the cloud has its own section next). For each one, ask: who provides the services, and who uses them?</p>
<table class="t">
  <tr><th>Environment</th><th>What characterizes it</th></tr>
  <tr><td><b>Basic</b> (traditional)</td><td>stand-alone general-purpose machines — but the border is blurred, because most systems interconnect with others (the Internet); <b>portals</b> provide web access to internal systems; <b>network computers (thin clients)</b>, which rely on servers for most of their work, are like Web terminals; mobile computers interconnect via <b>wireless networks</b>; networking is everywhere — even home systems use <b>firewalls</b> to protect home computers from Internet attacks</td></tr>
  <tr><td><b>Mobile</b></td><td>handheld smartphones, tablets, etc.; compared with a "traditional" laptop they have extra OS features (GPS, gyroscope) that allow new types of apps such as <b>augmented reality</b> (digital information laid over the camera image); connectivity via IEEE 802.11 wireless or cellular data networks; the leaders are <b>Apple iOS</b> and <b>Google Android</b></td></tr>
  <tr><td><b>Client-Server</b></td><td>dumb terminals (screens without their own processing) have been supplanted by smart PCs; many systems are now <b>servers</b>, responding to requests generated by <b>clients</b>: a <b>compute-server system</b> provides an interface for a client to request services (e.g. a database); a <b>file-server system</b> provides an interface for clients to store and retrieve files</td></tr>
  <tr><td><b>Peer-to-Peer (P2P)</b></td><td>another model of distributed system: P2P does not distinguish clients and servers — all nodes are <b>peers</b>, and each may act as client, server or both; a node must join the P2P network, either by registering its service with a <b>central lookup service</b> on the network, or by broadcasting requests for service and responding to requests via a <b>discovery protocol</b>; examples: Napster, Gnutella, <b>Voice over IP (VoIP)</b> such as Skype</td></tr>
  <tr><td><b>Real-time embedded</b></td><td>the most prevalent form of computers; they vary considerably — special-purpose, limited-purpose OS, <b>real-time OS</b>; their use is expanding; some have OSes, some perform tasks without an OS; a real-time OS has <b>well-defined fixed time constraints</b>: processing must be done within the constraint, and the operation is correct <b>only if the constraints are met</b></td></tr>
</table>
<p>Note the real-time definition: a result that arrives too late counts as a wrong result, even if its value is right.</p>
<p>Two diagrams contrast the two network models. In <b>client-server</b> computing, one server answers requests that come over the network from many clients (desktop, laptop, smartphone):</p>
<div data-viz="0"></div>
<p>In <b>peer-to-peer</b> computing there is no central server: every node is connected to the others and can play both roles.</p>
<div data-viz="1"></div>
<p>The difference to remember: client-server has fixed roles and a central point (simple to manage, but everything depends on the server); P2P has no fixed roles, and every peer can be client, server or both.</p>`,
      viz: [
        { name: 'graph', caption: 'Client-server computing', props: { w: 600, h: 230,
          nodes: [
            { id: 's', label: 'Server', x: 80, y: 115, shape: 'pill', tone: 'acc' },
            { id: 'n', label: 'Network', x: 290, y: 115, shape: 'pill', tone: 'muted' },
            { id: 'c1', label: 'client desktop', x: 505, y: 35, shape: 'pill' },
            { id: 'c2', label: 'client laptop', x: 505, y: 115, shape: 'pill' },
            { id: 'c3', label: 'client smartphone', x: 505, y: 195, shape: 'pill' }],
          edges: [{ from: 's', to: 'n', both: true }, { from: 'n', to: 'c1', both: true }, { from: 'n', to: 'c2', both: true }, { from: 'n', to: 'c3', both: true }] } },
        { name: 'graph', caption: 'Peer-to-peer: every node is both client and server', props: { w: 420, h: 300,
          nodes: [
            { id: 'a', label: 'peer', x: 210, y: 40, shape: 'pill', tone: 'c1' }, { id: 'b', label: 'peer', x: 360, y: 130, shape: 'pill', tone: 'c2' },
            { id: 'c', label: 'peer', x: 300, y: 260, shape: 'pill', tone: 'c3' }, { id: 'd', label: 'peer', x: 120, y: 260, shape: 'pill', tone: 'c4' },
            { id: 'e', label: 'peer', x: 60, y: 130, shape: 'pill', tone: 'c5' }],
          edges: [
            { from: 'a', to: 'b', both: true }, { from: 'a', to: 'c', both: true }, { from: 'a', to: 'd', both: true }, { from: 'a', to: 'e', both: true },
            { from: 'b', to: 'c', both: true }, { from: 'b', to: 'd', both: true }, { from: 'b', to: 'e', both: true },
            { from: 'c', to: 'd', both: true }, { from: 'c', to: 'e', both: true }, { from: 'd', to: 'e', both: true }] } }
      ],
      takeaway: `A distributed system is a set of separate, possibly heterogeneous systems on a network (TCP/IP; LAN, WAN, MAN, PAN); a network OS gives the illusion of a single system. Environments: basic, mobile, client-server (compute-server, file-server), P2P (all nodes are peers; lookup service or discovery protocol), cloud, real-time embedded (fixed time constraints).`,
      exam: `P2P vs client-server; compute-server vs file-server; the defining property of a real-time OS (well-defined fixed time constraints).`
    },
    {
      id: 'cloud',
      h: 'Cloud computing',
      why: 'computing as a service',
      lead: `Combine virtualization (many virtual machines on one server) with networks (access from anywhere) and you get cloud computing: computing power, storage and applications rented over the Internet.`,
      html: `
<p><b>Cloud computing</b> delivers computing, storage and even applications <b>as a service</b> across a network. It is a logical extension of <b>virtualization</b>, because it uses virtualization as the base of its functionality: the provider runs many virtual machines on its servers and hands them to customers. Example: <b>Amazon EC2</b> has thousands of servers, millions of virtual machines and petabytes of storage available across the Internet, and customers pay based on usage.</p>
<p>The cloud types answer two different questions, so the table has two groups. The first three rows say <b>who can use</b> the cloud; the last three say <b>what is offered</b>, from a complete application down to raw infrastructure:</p>
<table class="t">
  <tr><th>Type</th><th>What it is</th><th>Example (slide)</th></tr>
  <tr><td><b>Public cloud</b></td><td>available via the Internet to anyone willing to pay</td><td>—</td></tr>
  <tr><td><b>Private cloud</b></td><td>run by a company for the company’s own use</td><td>—</td></tr>
  <tr><td><b>Hybrid cloud</b></td><td>includes both public and private cloud components</td><td>—</td></tr>
  <tr><td><b>SaaS</b> (Software as a Service)</td><td>one or more applications available via the Internet</td><td>a word processor</td></tr>
  <tr><td><b>PaaS</b> (Platform as a Service)</td><td>a software stack ready for application use via the Internet</td><td>a database server</td></tr>
  <tr><td><b>IaaS</b> (Infrastructure as a Service)</td><td>servers or storage available over the Internet</td><td>storage available for backup use</td></tr>
</table>
<p>A simple way to remember the second group: SaaS gives you a finished <b>application</b>; PaaS gives you a <b>platform</b> on which to run your own application; IaaS gives you raw <b>infrastructure</b> (servers, storage) and you install everything yourself.</p>
<p>Inside, a cloud is built from familiar parts: <b>traditional OSes</b>, plus <b>VMMs</b>, plus <b>cloud management tools</b>. Follow a request through the diagram: it arrives from the Internet and passes the <b>firewall</b> (Internet connectivity requires security); then a <b>load balancer</b> spreads the traffic across multiple applications running in virtual machines and storage. Separately, customers manage their resources through the <b>cloud customer interface</b>, which sends commands to the <b>cloud management services</b>.</p>
<div data-viz="0"></div>
<p>All these OSes, VMMs and cloud tools are software that somebody wrote. A large part of it is open: anyone can read its source code — next section.</p>`,
      viz: [{ name: 'graph', caption: 'Structure of a cloud computing environment', props: { w: 600, h: 300,
        nodes: [
          { id: 'inet', label: 'Internet', x: 300, y: 30, shape: 'pill', tone: 'acc' },
          { id: 'fw', label: 'firewall', x: 300, y: 100, tone: 'bad' },
          { id: 'lb', label: 'load balancer', x: 300, y: 170, tone: 'warn' },
          { id: 'cci', label: 'cloud customer interface', x: 510, y: 100, w: 150 },
          { id: 'vm1', label: 'virtual machines', x: 85, y: 260, w: 130 },
          { id: 'vm2', label: 'virtual machines', x: 230, y: 260, w: 130 },
          { id: 'st', label: 'storage', x: 365, y: 260, w: 110 },
          { id: 'cms', label: 'cloud management services', x: 515, y: 260, w: 160, tone: 'muted' }],
        edges: [
          { from: 'inet', to: 'fw' }, { from: 'fw', to: 'lb' },
          { from: 'lb', to: 'vm1' }, { from: 'lb', to: 'vm2' }, { from: 'lb', to: 'st' }, { from: 'lb', to: 'cms' },
          { from: 'inet', to: 'cci', label: 'customer requests', dashed: true },
          { from: 'cci', to: 'cms', label: 'cloud management commands', dashed: true }] } }],
      takeaway: `Cloud computing = computing, storage and apps delivered as a service over a network, built on virtualization. Public (anyone who pays), private (one company), hybrid (both). SaaS = applications (word processor), PaaS = software stack (database server), IaaS = servers or storage (storage for backup). Inside: OSes + VMMs + management tools, firewalls, load balancers.`,
      exam: `Distinguish public/private/hybrid, and SaaS/PaaS/IaaS by the slide examples (word processor / database server / storage for backup).`
    },
    {
      id: 'open-source',
      h: 'Free and open-source operating systems',
      why: 'OS code you can read',
      lead: `Most commercial software is sold only as binary code, which people cannot read. Many operating systems, however, are distributed with their source code — and that is what makes it possible to study an OS from the inside.`,
      html: `
<p><b>Free and open-source operating systems</b> are made available in <b>source-code</b> format rather than just binary. The opposite is <b>closed-source</b> (proprietary) software, distributed only as binaries. The open-source movement runs counter to the <b>copy protection</b> and <b>Digital Rights Management (DRM)</b> movement (technologies that restrict how users can copy and use software and media).</p>
<ul>
  <li>It was started by the <b>Free Software Foundation (FSF)</b>, which has the "<b>copyleft</b>" <b>GNU Public License (GPL)</b>. Copyleft means that anyone may use, change and redistribute the code, but changed versions must be distributed under the same free terms.</li>
  <li><b>Free software</b> and <b>open-source software</b> are <b>two different ideas</b>, championed by different groups of people: free software stresses the users’ freedom, open source stresses the practical benefits of shared code.</li>
  <li>Examples: <b>GNU/Linux</b> and <b>BSD UNIX</b> (including the core of Mac OS X), and many more.</li>
  <li>To try them, you can use a VMM such as <b>VMware Player</b> (free on Windows) or <b>VirtualBox</b> (open source and free on many platforms) to run guest operating systems for exploration.</li>
</ul>
<p><b>The study of operating systems.</b> The slides end with why this matters to you:</p>
<ul>
  <li>Many OSes are available in both source and binary (executable) form — Linux, BSD UNIX, Solaris and part of macOS — so you can study an OS <b>from the inside out</b>: questions that once could be answered only from documentation or behaviour can now be answered by reading the code.</li>
  <li>OSes that are no longer commercially viable have been open-sourced too, showing how systems worked with fewer CPU, memory and storage resources.</li>
  <li>Virtualization, mainstream and often free, lets students try hundreds of OSes without dedicated hardware.</li>
  <li>The move from student to OS developer has become easier: with some knowledge, some effort and an Internet connection, a student can even create a new OS distribution.</li>
</ul>
<p>If you open the source code of a kernel such as Linux, one of the first things you meet is how it organizes its data. That is the last section of this module.</p>`,
      takeaway: `Open-source OSes are distributed as source code, not just binaries — the opposite of closed-source software and of copy protection/DRM. The FSF started the movement with the copyleft GPL; free software and open-source software are different ideas. Examples: GNU/Linux, BSD UNIX. Open code and free VMMs make studying OSes easy.`,
      exam: `FSF + copyleft GPL; free software ≠ open-source software; examples of open-source OSes.`
    },
    {
      id: 'kernel-ds',
      h: 'Kernel data structures',
      why: 'how the kernel keeps track of things',
      lead: `The kernel constantly manages collections: lists of processes, free memory blocks, open files, devices. To do it efficiently it uses the same data structures you know from programming courses.`,
      html: `
<p>Many kernel data structures are similar to standard programming data structures. Each one is chosen for what it does best.</p>
<p><b>Linked lists</b> hold collections whose size changes all the time (for example a queue of processes): items can be added or removed without moving the others.</p>
<ul>
  <li><b>Singly linked list</b>: each node stores data and a pointer to the next node; the last node points to null.</li>
  <li><b>Doubly linked list</b>: each node points to both the next and the previous node; the previous pointer of the first node and the next pointer of the last node are null. The list can be walked in both directions.</li>
  <li><b>Circular linked list</b>: the last node points back to the first, so the list has no end — useful for going round in turns.</li>
</ul>
<div data-viz="0"></div>
<div data-viz="1"></div>
<p><b>Binary search tree (BST)</b>: an ordered tree in which, for every node, the left side holds smaller-or-equal values and the right side larger ones (<b>left &lt;= right</b>), so a search follows a single path from the root. On the slide its search performance is <b>O(n)</b>: in the worst case (for example, when items are inserted in sorted order) the tree degenerates into a chain, just like a list. A <b>balanced binary search tree</b> keeps its height small and guarantees <b>O(lg n)</b>.</p>
<div data-viz="2"></div>
<p>In the tree from the slide, searching for 14 takes three steps: 17 → 12 (14 &lt; 17, go left) → 14 (14 &gt; 12, go right).</p>
<p><b>Hash map</b>: a <b>hash function</b> turns a key into an index 0…n, and the value is stored at that index. A lookup therefore takes about the same short time however many items there are.</p>
<div data-viz="3"></div>
<p><b>Bitmap</b>: a string of <b>n binary digits</b> representing the status of <b>n items</b> — for example, bit i is 1 if disk block i is in use and 0 if it is free. It is extremely compact: one bit per item.</p>
<p>In Linux these structures are defined in include files: <code>&lt;linux/list.h&gt;</code> (linked lists), <code>&lt;linux/kfifo.h&gt;</code> (FIFO queues) and <code>&lt;linux/rbtree.h&gt;</code> (red-black trees, a kind of balanced binary search tree).</p>
<p>This closes the module. We now have the basic vocabulary: kernel, interrupts, system calls, dual mode, processes, resources. The next module, Operating-System Services, looks at the OS from the outside — which services it offers and how programs ask for them.</p>`,
      viz: [
        { name: 'flow', caption: 'Singly linked list', props: { dir: 'h', steps: [{ label: 'data', tone: 'acc' }, { label: 'data', tone: 'acc' }, { label: 'data', tone: 'acc' }, { label: 'null', tone: 'muted' }] } },
        { name: 'flow', caption: 'Circular linked list: the last node points back to the first', props: { dir: 'h', loop: true, steps: [{ label: 'data', tone: 'c2' }, { label: 'data', tone: 'c2' }, { label: 'data', tone: 'c2' }, { label: 'data', tone: 'c2' }] } },
        { name: 'tree', caption: 'The binary search tree from the slide', props: { root: { label: '17', tone: 'acc', children: [
          { label: '12', children: [{ label: '6' }, { label: '14' }] },
          { label: '35', children: [{ label: '32' }, { label: '40' }] }] } } },
        { name: 'flow', caption: 'Hash map', props: { dir: 'h', steps: [{ label: 'key' }, { label: 'hash_function(key)', tone: 'acc' }, { label: 'hash map [0…n]', tone: 'warn' }, { label: 'value', tone: 'ok' }] } }
      ],
      takeaway: `Kernel data structures: singly, doubly and circular linked lists; the binary search tree (search O(n) in the worst case) and the balanced BST (O(lg n)); the hash map (hash_function(key) → index → value); the bitmap (n bits for the status of n items). Linux defines them in &lt;linux/list.h&gt;, &lt;linux/kfifo.h&gt;, &lt;linux/rbtree.h&gt;.`,
      exam: `Search complexity: BST O(n), balanced BST O(lg n); the definition of a bitmap; the kinds of linked lists.`
    }
  ],
  terms: [
    { en: 'Computer system', ru: 'вычислительная система', def: 'Four components: users, application programs, operating system, hardware.' },
    { en: 'Motherboard', ru: 'материнская плата', def: 'The main circuit board: CPU socket, DRAM slots, PCIe slots, I/O and power connectors.' },
    { en: 'Peripherals', ru: 'периферийные устройства', def: 'Devices outside the system unit: monitor, keyboard, mouse, speakers.' },
    { en: 'Von Neumann architecture', ru: 'архитектура фон Неймана', def: 'One memory holds both data and instructions; CPU, memory and I/O interfaces are joined by a bus.' },
    { en: 'Program counter', ru: 'счётчик команд', def: 'PC: CPU register holding the address of the next instruction to execute.' },
    { en: 'CPU register', ru: 'регистр процессора', def: 'A tiny, very fast storage cell inside the CPU; managed by the compiler.' },
    { en: 'Arithmetic logic unit (ALU)', ru: 'арифметико-логическое устройство', def: 'The part of the CPU that performs calculations.' },
    { en: 'Bus', ru: 'шина', def: 'Shared set of wires joining CPU, memory and I/O interfaces: data, address and control lines.' },
    { en: 'Data lines', ru: 'линии данных', def: 'Bus lines that carry the values being transferred.' },
    { en: 'Address lines', ru: 'адресные линии', def: 'Bus lines that select the memory location or device.' },
    { en: 'Control lines', ru: 'линии управления', def: 'Bus lines that say what to do (read, write, …).' },
    { en: 'I/O interface', ru: 'интерфейс ввода-вывода', def: 'Connects a device (mass storage, video, keyboard) to the bus.' },
    { en: 'Operating system', ru: 'операционная система', def: 'A program that acts as an intermediary between the user and the hardware; resource allocator and control program.' },
    { en: 'Application program', ru: 'прикладная программа', def: 'A program not associated with the OS; defines how resources are used to solve users’ problems.' },
    { en: 'Kernel', ru: 'ядро', def: 'The one program running at all times on the computer; the core of the OS.' },
    { en: 'System program', ru: 'системная программа', def: 'Ships with the OS but is not part of the kernel.' },
    { en: 'Middleware', ru: 'промежуточное ПО', def: 'Software frameworks giving developers extra services: databases, multimedia, graphics.' },
    { en: 'Resource allocator', ru: 'распределитель ресурсов', def: 'Role of the OS on shared machines: decides who gets which resource.' },
    { en: 'Control program', ru: 'управляющая программа', def: 'Role of the OS: manages the execution of user programs.' },
    { en: 'Mainframe', ru: 'мейнфрейм', def: 'A large shared computer; its OS must keep all users happy.' },
    { en: 'Embedded computer', ru: 'встроенный компьютер', def: 'A computer inside a device or car; little or no UI, runs without user intervention.' },
    { en: 'Serial processing', ru: 'последовательная обработка', def: 'First OS stage (1940): programs run one at a time, set up by hand.' },
    { en: 'Batch processing', ru: 'пакетная обработка', def: 'OS stage (1950): jobs collected and run one after another automatically.' },
    { en: 'Device controller', ru: 'контроллер устройства', def: 'Hardware in charge of one device type; has a local buffer; signals completion with an interrupt.' },
    { en: 'Device driver', ru: 'драйвер устройства', def: 'OS software that manages a controller and gives the kernel a uniform interface to it.' },
    { en: 'Local buffer', ru: 'локальный буфер', def: 'The controller’s own small memory; I/O goes from the device to this buffer.' },
    { en: 'Common bus', ru: 'общая шина', def: 'Connects CPUs and device controllers to the shared memory.' },
    { en: 'Memory cycle', ru: 'цикл обращения к памяти', def: 'A slot in which memory can be read or written; CPUs and devices compete for them.' },
    { en: 'Uniform interface', ru: 'единообразный интерфейс', def: 'The same way of talking to every device of a type, provided by the driver.' },
    { en: 'Interrupt', ru: 'прерывание', def: 'Signal that makes the CPU stop its current work and run a handler for an urgent event.' },
    { en: 'Interrupt vector', ru: 'вектор прерываний', def: 'Table with the addresses of all interrupt service routines.' },
    { en: 'Interrupt service routine (ISR)', ru: 'процедура обработки прерывания', def: 'The code run for a given type of interrupt.' },
    { en: 'Interrupt handler', ru: 'обработчик прерывания', def: 'Another name for the interrupt service routine.' },
    { en: 'Trap', ru: 'ловушка (программное прерывание)', def: 'Software-generated interrupt caused by an error or a user request (system call).' },
    { en: 'Exception', ru: 'исключение', def: 'Software-generated interrupt, e.g. division by zero; synonym of trap on the slides.' },
    { en: 'Interrupt driven', ru: 'управляемый прерываниями', def: 'The OS runs in response to interrupts (hardware and software).' },
    { en: 'Interrupt-driven I/O cycle', ru: 'цикл ввода-вывода по прерываниям', def: 'Driver starts I/O → controller works → interrupt → handler → CPU resumes.' },
    { en: 'Maskable interrupt', ru: 'маскируемое прерывание', def: 'An interrupt that the CPU may temporarily ignore.' },
    { en: 'Non-maskable interrupt', ru: 'немаскируемое прерывание', def: 'An interrupt that cannot be ignored.' },
    { en: 'Wait instruction', ru: 'инструкция ожидания', def: 'Idles the CPU until the next interrupt (synchronous I/O).' },
    { en: 'Wait loop', ru: 'цикл ожидания', def: 'The CPU spins in a loop until I/O completes; causes contention for memory access.' },
    { en: 'Outstanding I/O request', ru: 'незавершённый запрос ввода-вывода', def: 'A request that has started but not finished.' },
    { en: 'Device-status table', ru: 'таблица состояния устройств', def: 'One entry per I/O device: type, address, state.' },
    { en: 'Direct Memory Access (DMA)', ru: 'прямой доступ к памяти', def: 'The controller moves whole blocks to main memory without the CPU; one interrupt per block.' },
    { en: 'Main memory', ru: 'основная память', def: 'The only large storage the CPU accesses directly; random access, volatile, typically DRAM.' },
    { en: 'Random access', ru: 'произвольный доступ', def: 'Any location can be read equally fast.' },
    { en: 'Volatile', ru: 'энергозависимый', def: 'Loses its content when the power is off.' },
    { en: 'Nonvolatile', ru: 'энергонезависимый', def: 'Keeps its content without power.' },
    { en: 'Dynamic Random-Access Memory (DRAM)', ru: 'динамическая память с произвольным доступом', def: 'The usual technology of main memory.' },
    { en: 'Secondary storage', ru: 'вторичная (внешняя) память', def: 'Extension of main memory with large nonvolatile capacity (HDD, NVM).' },
    { en: 'Tertiary storage', ru: 'третичная память', def: 'Bottom of the hierarchy: optical disks, magnetic tapes.' },
    { en: 'Hard disk drive (HDD)', ru: 'жёсткий диск', def: 'Magnetic platters divided into tracks and sectors.' },
    { en: 'Platter', ru: 'пластина диска', def: 'Rigid metal or glass disk covered with magnetic material.' },
    { en: 'Disk sector', ru: 'сектор диска', def: 'A part of a track (a ring on the disk surface); the disk surface is divided into tracks, tracks into sectors.' },
    { en: 'Non-volatile memory (NVM)', ru: 'энергонезависимая память', def: 'Storage devices faster than hard disks and nonvolatile (e.g. flash).' },
    { en: 'Storage hierarchy', ru: 'иерархия памяти', def: 'Storage levels ordered by speed, cost and volatility.' },
    { en: 'Caching', ru: 'кэширование', def: 'Temporarily copying information in use from slower to faster storage.' },
    { en: 'Cache', ru: 'кэш', def: 'Small fast storage checked first for data.' },
    { en: 'Cache hit', ru: 'попадание в кэш', def: 'The data are found in the cache.' },
    { en: 'Cache miss', ru: 'промах кэша', def: 'The data are not in the cache and must be copied in from slower storage.' },
    { en: 'Cache management', ru: 'управление кэшем', def: 'Choosing cache size and replacement policy.' },
    { en: 'Replacement policy', ru: 'политика замещения', def: 'Rule for choosing which item to remove when the cache is full.' },
    { en: 'Cache coherency', ru: 'когерентность кэшей', def: 'Hardware guarantee that all CPUs have the most recent value in their caches.' },
    { en: 'Multiprocessor system', ru: 'многопроцессорная система', def: 'Several processors in one computer; also parallel or tightly-coupled system.' },
    { en: 'Tightly-coupled system', ru: 'сильно связанная система', def: 'Another name for a multiprocessor system.' },
    { en: 'Throughput', ru: 'пропускная способность', def: 'Amount of work done per unit of time.' },
    { en: 'Economy of scale', ru: 'экономия на масштабе', def: 'Shared memory, storage and power make one multiprocessor cheaper than several computers.' },
    { en: 'Graceful degradation', ru: 'плавная деградация', def: 'The system keeps working, slower, when some components fail.' },
    { en: 'Fault tolerance', ru: 'отказоустойчивость', def: 'The system keeps working correctly despite a component failure.' },
    { en: 'Asymmetric multiprocessing', ru: 'асимметричная многопроцессорность', def: 'Each processor is assigned a specific task.' },
    { en: 'Symmetric multiprocessing (SMP)', ru: 'симметричная многопроцессорность', def: 'Each processor performs all tasks; processors share main memory.' },
    { en: 'Multicore', ru: 'многоядерный', def: 'Several cores on one chip: private registers and L1 cache, shared L2 cache and memory.' },
    { en: 'L1 cache', ru: 'кэш первого уровня', def: 'Private cache of each core.' },
    { en: 'L2 cache', ru: 'кэш второго уровня', def: 'Cache shared by the cores of a multicore chip.' },
    { en: 'Non-Uniform Memory Access (NUMA)', ru: 'неоднородный доступ к памяти', def: 'Each CPU has local memory; remote memory is reached over the interconnect, more slowly.' },
    { en: 'Interconnect', ru: 'межсоединение', def: 'The link between CPUs (NUMA) or between cluster nodes.' },
    { en: 'Clustered system', ru: 'кластерная система', def: 'Several computers working together, usually sharing storage via a SAN.' },
    { en: 'Storage-area network (SAN)', ru: 'сеть хранения данных', def: 'Dedicated network giving cluster nodes access to shared storage.' },
    { en: 'High availability', ru: 'высокая доступность', def: 'A service that survives failures.' },
    { en: 'Hot-standby mode', ru: 'режим горячего резерва', def: 'A machine that only monitors the active server and takes over if it fails.' },
    { en: 'Asymmetric clustering', ru: 'асимметричная кластеризация', def: 'One machine in hot-standby mode.' },
    { en: 'Symmetric clustering', ru: 'симметричная кластеризация', def: 'All nodes run applications and monitor each other.' },
    { en: 'High-performance computing (HPC)', ru: 'высокопроизводительные вычисления', def: 'Clusters that split one job over many nodes; needs parallelized applications.' },
    { en: 'Parallelization', ru: 'распараллеливание', def: 'Writing a program so that its parts run at the same time on several processors.' },
    { en: 'Distributed lock manager (DLM)', ru: 'распределённый менеджер блокировок', def: 'Prevents conflicting operations on shared data in a cluster.' },
    { en: 'Bootstrap program', ru: 'программа начальной загрузки', def: 'Firmware in ROM/EPROM; initializes the system and loads the kernel into RAM.' },
    { en: 'Firmware', ru: 'встроенное ПО (прошивка)', def: 'Software stored in ROM/EPROM, e.g. the bootstrap program, BIOS, UEFI.' },
    { en: 'Read-only memory (ROM)', ru: 'постоянное запоминающее устройство (ПЗУ)', def: 'Nonvolatile memory holding firmware.' },
    { en: 'Power-On Self Test', ru: 'самотестирование при включении', def: 'POST: the firmware checks RAM, CPU and drives at power-on.' },
    { en: 'Boot sector', ru: 'загрузочный сектор', def: 'The start of a drive, where the bootloader is stored.' },
    { en: 'Bootloader', ru: 'загрузчик ОС', def: 'Tiny program at the beginning of the drive; locates the OS and loads it into RAM (e.g. GRUB).' },
    { en: 'Dual-boot', ru: 'двойная загрузка', def: 'Choosing at startup between two installed OSes.' },
    { en: 'Root file system', ru: 'корневая файловая система', def: 'The main file tree, mounted by the kernel at startup.' },
    { en: 'systemd', ru: 'systemd (первый процесс)', def: 'PID 1: the first process launched by the Linux kernel; starts services and daemons in parallel.' },
    { en: 'System daemon', ru: 'системный демон', def: 'A service provided outside the kernel, started at boot.' },
    { en: 'Hardware interrupt', ru: 'аппаратное прерывание', def: 'Interrupt raised by a device.' },
    { en: 'Software interrupt', ru: 'программное прерывание', def: 'Exception or trap: a software error or a system call.' },
    { en: 'System call', ru: 'системный вызов', def: 'A program’s request for an OS service; switches the CPU to kernel mode.' },
    { en: 'Infinite loop', ru: 'бесконечный цикл', def: 'A program that never gives the CPU back; stopped by the timer.' },
    { en: 'Multiprogramming', ru: 'мультипрограммирование', def: 'Several jobs in memory; when one waits for I/O, the CPU switches to another.' },
    { en: 'Job scheduling', ru: 'планирование заданий', def: 'Selecting which job in memory to run.' },
    { en: 'Multitasking (timesharing)', ru: 'многозадачность (разделение времени)', def: 'The CPU switches jobs so often that users can interact; response time < 1 s.' },
    { en: 'Interactive computing', ru: 'интерактивные вычисления', def: 'Users interact with their programs while they run.' },
    { en: 'Response time', ru: 'время отклика', def: 'Time until the system reacts to the user; < 1 s in timesharing.' },
    { en: 'CPU scheduling', ru: 'планирование процессора', def: 'Choosing which ready job/process runs next.' },
    { en: 'Swapping', ru: 'подкачка (свопинг)', def: 'Moving processes in and out of memory when they do not all fit.' },
    { en: 'Virtual memory', ru: 'виртуальная память', def: 'Allows execution of processes that are not completely in memory.' },
    { en: 'Dual-mode operation', ru: 'двухрежимная работа', def: 'User mode and kernel mode; lets the OS protect itself and other components.' },
    { en: 'User mode', ru: 'режим пользователя', def: 'CPU mode for user programs; mode bit = 1.' },
    { en: 'Kernel mode', ru: 'режим ядра', def: 'CPU mode for the OS; privileged instructions allowed; mode bit = 0.' },
    { en: 'Mode bit', ru: 'бит режима', def: 'Hardware bit: kernel = 0, user = 1; changed by a system call (trap) and its return.' },
    { en: 'Privileged instruction', ru: 'привилегированная инструкция', def: 'Instruction executable only in kernel mode (e.g. setting the timer).' },
    { en: 'Timer', ru: 'таймер', def: 'Counter decremented by the clock; at zero it interrupts so the OS regains control.' },
    { en: 'Passive entity', ru: 'пассивная сущность', def: 'A program: instructions stored on disk.' },
    { en: 'Active entity', ru: 'активная сущность', def: 'A process: a program that is running.' },
    { en: 'Single-threaded process', ru: 'однопоточный процесс', def: 'Has one program counter; executes instructions one at a time.' },
    { en: 'Multi-threaded process', ru: 'многопоточный процесс', def: 'Has one program counter per thread.' },
    { en: 'Thread', ru: 'поток', def: 'Lightweight unit of execution inside a process; shares memory, has its own stack.' },
    { en: 'Multiplexing', ru: 'мультиплексирование', def: 'Switching a CPU quickly among processes/threads to obtain concurrency.' },
    { en: 'Process synchronization', ru: 'синхронизация процессов', def: 'Coordinating processes that share data.' },
    { en: 'Deadlock', ru: 'взаимоблокировка', def: 'Processes wait for each other forever.' },
    { en: 'Task', ru: 'задача, задание', def: 'Generic unit of work: a process, a thread or a scheduled function.' },
    { en: 'Signal', ru: 'сигнал', def: 'Software notification delivered to a process (SIGINT, SIGKILL, SIGSEGV).' },
    { en: 'Signal handler', ru: 'обработчик сигнала', def: 'Function a process runs when it receives a signal.' },
    { en: 'Real-time operating system (RTOS)', ru: 'операционная система реального времени', def: 'An OS with well-defined fixed time constraints; correct only if they are met.' },
    { en: 'Memory management', ru: 'управление памятью', def: 'Tracking memory use, moving processes and data in and out, allocating and freeing.' },
    { en: 'Mass-storage management', ru: 'управление внешней памятью', def: 'Mounting, free-space management, allocation, disk scheduling, partitioning, protection.' },
    { en: 'Free-space management', ru: 'управление свободным пространством', def: 'Keeping track of free blocks on a disk.' },
    { en: 'Disk scheduling', ru: 'планирование дисковых операций', def: 'Choosing the order in which disk requests are served.' },
    { en: 'Mounting', ru: 'монтирование', def: 'Attaching a device’s file system so its files become accessible.' },
    { en: 'Partitioning', ru: 'разбиение на разделы', def: 'Dividing a disk into separate regions.' },
    { en: 'File-system management', ru: 'управление файловой системой', def: 'Files and directories, mapping onto secondary storage, backup, access control.' },
    { en: 'I/O subsystem', ru: 'подсистема ввода-вывода', def: 'Hides device peculiarities: buffering, caching, spooling, driver interface, drivers.' },
    { en: 'Buffering', ru: 'буферизация', def: 'Storing data temporarily while it is being transferred.' },
    { en: 'Spooling', ru: 'спулинг', def: 'Overlapping the output of one job with the input of other jobs.' },
    { en: 'Protection', ru: 'защита', def: 'Any mechanism controlling access of processes or users to resources.' },
    { en: 'Security', ru: 'безопасность', def: 'Defense of the system against internal and external attacks.' },
    { en: 'Denial-of-service', ru: 'отказ в обслуживании', def: 'Attack that makes a service unusable, e.g. by overloading it.' },
    { en: 'User ID', ru: 'идентификатор пользователя', def: 'Name and number of a user; associated with the user’s files and processes.' },
    { en: 'Group ID', ru: 'идентификатор группы', def: 'Defines a set of users and their access; associated with processes and files.' },
    { en: 'Privilege escalation', ru: 'повышение привилегий', def: 'Changing to an effective ID with more rights.' },
    { en: 'Effective ID', ru: 'эффективный идентификатор', def: 'The ID whose rights a process currently uses.' },
    { en: 'Virtualization', ru: 'виртуализация', def: 'Running guest OSes, natively compiled for the same CPU, on a host through a VMM.' },
    { en: 'Emulation', ru: 'эмуляция', def: 'Running code for a different CPU type (PowerPC → x86); generally the slowest method.' },
    { en: 'Interpretation', ru: 'интерпретация', def: 'Executing a language that is not compiled to native code.' },
    { en: 'Guest OS', ru: 'гостевая ОС', def: 'An OS running inside a virtual machine.' },
    { en: 'Host OS', ru: 'хостовая ОС', def: 'The OS that owns the real hardware and runs the VMM.' },
    { en: 'Virtual machine manager (VMM)', ru: 'монитор виртуальных машин', def: 'Provides virtualization services; can run natively as the host (VMware ESX, Citrix XenServer).' },
    { en: 'Virtual machine', ru: 'виртуальная машина', def: 'A virtual copy of the computer on which a guest OS runs.' },
    { en: 'Distributed system', ru: 'распределённая система', def: 'Separate, possibly heterogeneous systems networked together.' },
    { en: 'Local Area Network (LAN)', ru: 'локальная сеть', def: 'A network inside a room, building or campus.' },
    { en: 'Wide Area Network (WAN)', ru: 'глобальная сеть', def: 'A network across countries or the world.' },
    { en: 'Metropolitan Area Network (MAN)', ru: 'городская сеть', def: 'A network across a city.' },
    { en: 'Personal Area Network (PAN)', ru: 'персональная сеть', def: 'A network of devices around one person.' },
    { en: 'Network operating system', ru: 'сетевая операционная система', def: 'Provides features between systems across a network; illusion of a single system.' },
    { en: 'Computing environment', ru: 'вычислительная среда', def: 'Basic, mobile, client-server, peer-to-peer, cloud, real-time embedded.' },
    { en: 'Thin client', ru: 'тонкий клиент', def: 'A network computer that relies on servers; like a Web terminal.' },
    { en: 'Firewall', ru: 'межсетевой экран', def: 'Protects computers from Internet attacks.' },
    { en: 'Augmented reality', ru: 'дополненная реальность', def: 'Digital information laid over the camera image; enabled by GPS and gyroscope.' },
    { en: 'Client-server computing', ru: 'клиент-серверные вычисления', def: 'Servers respond to requests generated by clients.' },
    { en: 'Compute-server system', ru: 'вычислительный сервер', def: 'Provides an interface for clients to request services (e.g. a database).' },
    { en: 'File-server system', ru: 'файловый сервер', def: 'Provides an interface for clients to store and retrieve files.' },
    { en: 'Peer-to-peer (P2P)', ru: 'одноранговая сеть', def: 'No distinction between clients and servers; each node may be client, server or both.' },
    { en: 'Central lookup service', ru: 'центральная служба поиска', def: 'Where P2P nodes register their services.' },
    { en: 'Discovery protocol', ru: 'протокол обнаружения', def: 'P2P nodes broadcast requests for service and respond to requests.' },
    { en: 'Voice over IP (VoIP)', ru: 'IP-телефония', def: 'Voice calls over the Internet, e.g. Skype; a P2P example.' },
    { en: 'Cloud computing', ru: 'облачные вычисления', def: 'Computing, storage and apps as a service over a network; built on virtualization.' },
    { en: 'Public cloud', ru: 'публичное облако', def: 'Available via the Internet to anyone willing to pay.' },
    { en: 'Private cloud', ru: 'частное облако', def: 'Run by a company for its own use.' },
    { en: 'Hybrid cloud', ru: 'гибридное облако', def: 'Includes both public and private components.' },
    { en: 'Software as a Service (SaaS)', ru: 'программное обеспечение как услуга', def: 'Applications via the Internet (e.g. a word processor).' },
    { en: 'Platform as a Service (PaaS)', ru: 'платформа как услуга', def: 'A software stack ready for applications via the Internet (e.g. a database server).' },
    { en: 'Infrastructure as a Service (IaaS)', ru: 'инфраструктура как услуга', def: 'Servers or storage over the Internet (e.g. storage for backup).' },
    { en: 'Load balancer', ru: 'балансировщик нагрузки', def: 'Spreads traffic across multiple applications.' },
    { en: 'Open-source software', ru: 'ПО с открытым исходным кодом', def: 'Distributed as source code, not just binaries.' },
    { en: 'Closed-source software', ru: 'ПО с закрытым исходным кодом', def: 'Proprietary software distributed only as binaries.' },
    { en: 'Free software', ru: 'свободное ПО', def: 'Movement started by the FSF; a different idea from open source.' },
    { en: 'Digital Rights Management (DRM)', ru: 'управление цифровыми правами', def: 'Technologies restricting copying and use; open source runs counter to it.' },
    { en: 'Free Software Foundation (FSF)', ru: 'Фонд свободного ПО', def: 'Started the free-software movement; has the copyleft GPL.' },
    { en: 'Copyleft', ru: 'копилефт', def: 'License rule: changed versions must be distributed under the same free terms.' },
    { en: 'GNU Public License (GPL)', ru: 'лицензия GNU GPL', def: 'The copyleft license of the Free Software Foundation.' },
    { en: 'Singly linked list', ru: 'односвязный список', def: 'Each node points to the next; the last points to null.' },
    { en: 'Doubly linked list', ru: 'двусвязный список', def: 'Each node points to the next and the previous node.' },
    { en: 'Circular linked list', ru: 'кольцевой список', def: 'The last node points back to the first.' },
    { en: 'Binary search tree', ru: 'двоичное дерево поиска', def: 'Ordered tree, left <= right; search O(n) in the worst case.' },
    { en: 'Balanced binary search tree', ru: 'сбалансированное двоичное дерево поиска', def: 'Keeps its height small; search O(lg n).' },
    { en: 'Hash function', ru: 'хеш-функция', def: 'Turns a key into an index.' },
    { en: 'Hash map', ru: 'хеш-таблица', def: 'hash_function(key) → index → value.' },
    { en: 'Bitmap', ru: 'битовая карта', def: 'String of n binary digits representing the status of n items.' }
  ],
  questions: [
    { id: 'bas-01', type: 'multi', q: 'Which four components make up a computer system, according to the slides? (select all that apply)', options: ['Hardware', 'Bootstrap program', 'Device-status table', 'Users', 'Application programs', 'Operating system'], answer: [0, 3, 4, 5], explain: 'The four components are users, application programs, the operating system and hardware. The bootstrap program and the device-status table are parts of startup and I/O handling, not top-level components.', section: 'computer-system', diff: 1 },
    { id: 'bas-02', type: 'single', q: 'In the Von Neumann architecture, which three groups of lines make up the bus?', options: ['data, instruction, interrupt', 'address, cache, control', 'input, output, storage', 'data, address, control'], answer: 3, explain: 'The bus is made of data lines (the values), address lines (where) and control lines (what to do: read, write…).', section: 'computer-system', diff: 1 },
    { id: 'bas-03', type: 'multi', q: 'Which of these are goals of an operating system, according to the slides? (select all that apply)', options: ['Maximize the number of installed applications', 'Remove the need for device drivers', 'Execute user programs and make solving user problems easier', 'Make the computer system convenient to use', 'Use the computer hardware in an efficient manner'], answer: [2, 3, 4], explain: 'The three goals are: run user programs and make problems easier to solve, convenience, and efficient use of the hardware. Drivers are still needed, and the number of applications is not a goal.', section: 'what-is-os', diff: 1 },
    { id: 'bas-04', type: 'single', q: 'By definition, which program is running at all times on the computer?', options: ['Middleware', 'Kernel', 'Shell', 'Bootstrap program'], answer: 1, explain: 'The one program running at all times on the computer is the kernel. The bootstrap program runs only during startup; the shell is a system program.', section: 'what-is-os', diff: 1 },
    { id: 'bas-05', type: 'tf', q: 'A system program ships with the operating system and is part of the kernel.', answer: false, explain: 'A system program ships with the OS but is NOT part of the kernel. Only the kernel runs at all times.', section: 'what-is-os', diff: 2 },
    { id: 'bas-06', type: 'single', q: 'Which sequence matches the slide "Evolution of Operating Systems"?', options: ['Batch → Serial → Time Sharing → Multiprogramming → Parallel → Distributed → Network-based', 'Serial → Multiprogramming → Batch → Parallel → Time Sharing → Network-based → Distributed', 'Batch → Multiprogramming → Serial → Time Sharing → Network-based → Parallel → Distributed', 'Serial → Batch → Multiprogramming → Time Sharing → Parallel → Network-based → Distributed'], answer: 3, explain: '1940 serial, 1950 batch, 1960 multiprogramming, 1965 time sharing, 1980 parallel, 1995 network-based, 2010 distributed. Each step shares the hardware more widely.', section: 'evolution', diff: 2 },
    { id: 'bas-07', type: 'single', q: 'How does a device controller tell the CPU that it has finished its operation?', options: ['It executes a system call', 'It sends the SIGINT signal to a process', 'It causes an interrupt', 'It writes a flag in main memory that the CPU keeps checking'], answer: 2, explain: 'The controller informs the CPU by causing an interrupt. System calls are made by programs, not by controllers, and signals are delivered to processes.', section: 'organization', diff: 1 },
    { id: 'bas-08', type: 'single', q: 'Which of these is software, not hardware?', options: ['Graphics controller', 'Disk driver', 'Disk controller', 'USB controller'], answer: 1, explain: 'A controller is hardware (the "operator"); a driver is a software layer in the OS (the "translator").', section: 'organization', diff: 2 },
    { id: 'bas-09', type: 'single', q: 'What does the interrupt vector contain?', options: ['The addresses of all interrupt service routines', 'A copy of the registers of the interrupted process', 'The type, address and state of each device', 'The queue of processes waiting for I/O'], answer: 0, explain: 'The interrupt vector is a table of the addresses of the service routines. Type, address and state of each device are kept in the device-status table.', section: 'interrupts', diff: 1 },
    { id: 'bas-10', type: 'single', q: 'A trap (exception) is…', options: ['a hardware interrupt from the disk controller', 'an interrupt that cannot be masked', 'the signal the OS sends to a process when you press CTRL+C', 'a software-generated interrupt caused by an error or a user request'], answer: 3, explain: 'Slide definition: a trap or exception is a software-generated interrupt caused either by an error or a user request. CTRL+C produces a signal (SIGINT), which is a different mechanism.', section: 'interrupts', diff: 2 },
    { id: 'bas-11', type: 'single', q: 'In the interrupt-driven I/O cycle, when does the CPU check for interrupts?', options: ['Only after a process terminates', 'Only when the device driver calls wait', 'Between instructions', 'In the middle of each instruction'], answer: 2, explain: 'The CPU checks for interrupts between instructions, so an interrupt never cuts an instruction in half.', section: 'interrupts', diff: 3 },
    { id: 'bas-12', type: 'tf', q: 'If control returns to the user program only when the I/O completes, several I/O requests can be outstanding at the same time.', answer: false, explain: 'With this synchronous method at most one I/O request is outstanding at a time — there is no simultaneous I/O processing.', section: 'io-structure', diff: 2 },
    { id: 'bas-13', type: 'single', q: 'Using the definitions on the slide, how big is 1 GB?', options: ['1024³ bytes', '1000³ bytes', '1024² bytes', '2³⁰ bits'], answer: 0, explain: 'KB = 1024 B, MB = 1024² B, GB = 1024³ B. 2³⁰ is the right number, but of bytes, not bits.', section: 'storage', diff: 2 },
    { id: 'bas-14', type: 'multi', q: 'Which levels of the storage-device hierarchy are volatile? (select all that apply)', options: ['cache', 'main memory', 'nonvolatile memory', 'hard-disk drives', 'registers'], answer: [0, 1, 4], explain: 'The volatile/nonvolatile border lies just below main memory: registers, cache and main memory are volatile; NVM and hard disks keep data without power.', section: 'storage', diff: 2 },
    { id: 'bas-15', type: 'single', q: 'In the table "Characteristics of Various Types of Storage", who manages the cache (level 2)?', options: ['operating system', 'user program', 'hardware', 'compiler'], answer: 2, explain: 'Registers are managed by the compiler, the cache by hardware, and main memory and disks by the operating system.', section: 'caching', diff: 3 },
    { id: 'bas-16', type: 'single', q: 'In a multiprocessor environment, what is the requirement that all CPUs have the most recent value in their caches called?', options: ['Spooling', 'Cache coherency', 'Virtual memory', 'Swapping'], answer: 1, explain: 'Cache coherency is provided in hardware. Swapping moves processes between memory and disk; spooling overlaps the I/O of different jobs.', section: 'caching', diff: 2 },
    { id: 'bas-17', type: 'multi', q: 'Which advantages of multiprocessor systems are listed on the slide? (select all that apply)', options: ['Increased throughput', 'Economy of scale', 'Increased reliability (graceful degradation / fault tolerance)', 'No operating system is needed', 'No competition for memory'], answer: [0, 1, 2], explain: 'The three advantages are throughput, economy of scale and reliability. The processors still share memory and still need an OS.', section: 'architecture', diff: 1 },
    { id: 'bas-18', type: 'single', q: 'How does asymmetric multiprocessing differ from symmetric multiprocessing (SMP)?', options: ['In asymmetric all processors perform all tasks; in SMP each has its own task', 'In asymmetric the processors do not share memory; in SMP there is no cache', 'They are synonyms', 'In asymmetric each processor is assigned a specific task; in SMP each processor performs all tasks'], answer: 3, explain: 'Asymmetric = one specific task per processor; symmetric = every processor performs all tasks. The tempting wrong answer simply swaps the two definitions.', section: 'architecture', diff: 2 },
    { id: 'bas-19', type: 'single', q: 'Asymmetric clustering means that…', options: ['the cluster is used for HPC with parallelization', 'the cluster has no shared storage', 'one machine is in hot-standby mode', 'several nodes run applications and monitor each other'], answer: 2, explain: 'Asymmetric clustering keeps one machine in hot-standby, ready to take over. Nodes that all run applications and monitor each other form symmetric clustering.', section: 'clustered', diff: 2 },
    { id: 'bas-20', type: 'single', q: 'What does the foreground process receive when you press CTRL+C in a terminal?', options: ['Interrupt vector entry 0', 'SIGINT', 'SIGKILL', 'SIGSEGV'], answer: 1, explain: 'The example from the Resume table: CTRL+C sends SIGINT to the foreground process. SIGKILL and SIGSEGV are other signals (kill, invalid memory access).', section: 'resume', diff: 1 },
    { id: 'bas-21', type: 'single', q: 'What is the correct order when a Linux system boots?', options: ['BIOS/UEFI (POST) → Bootloader (GRUB) → Linux kernel → systemd (PID 1) → login screen', 'Bootloader (GRUB) → BIOS/UEFI → systemd → Linux kernel → login screen', 'BIOS/UEFI → Linux kernel → Bootloader (GRUB) → systemd → login screen', 'systemd → BIOS/UEFI → GRUB → Linux kernel → login screen'], answer: 0, explain: 'The firmware runs POST and finds the boot sector; GRUB loads the kernel; the kernel starts the first process, systemd, which starts the services; then the login screen appears.', section: 'startup', diff: 2 },
    { id: 'bas-22', type: 'multi', q: 'What can cause a software interrupt (exception or trap)? (select all that apply)', options: ['A controller finishing a block transfer', 'A software error, e.g. division by zero', 'A request for an OS service — a system call', 'A key pressed on the keyboard'], answer: [1, 2], explain: 'Software interrupts come from an error in the program or from a system call. Keyboards and controllers raise hardware interrupts.', section: 'startup', diff: 3 },
    { id: 'bas-23', type: 'single', q: 'How many interrupts does a DMA transfer generate?', options: ['None', 'One per word', 'One per block', 'One per byte'], answer: 2, explain: 'With DMA only one interrupt is generated per block, rather than one interrupt per byte.', section: 'dma', diff: 2 },
    { id: 'bas-24', type: 'single', q: 'In a multiprogramming (batch) system, what does the OS do when a job has to wait for I/O?', options: ['Reloads the job from disk', 'Switches to another job', 'Busy-waits until the I/O is done', 'Terminates the job'], answer: 1, explain: 'When a job has to wait (for I/O, for example), the OS switches to another job, so the CPU always has something to execute.', section: 'multiprogramming', diff: 2 },
    { id: 'bas-25', type: 'single', q: 'What should the response time of a timesharing system be?', options: ['< 1 second', '< 1 ms', '< 10 seconds', 'It does not matter'], answer: 0, explain: 'The Multitasking slide: response time should be < 1 second, so that users can interact with their programs.', section: 'multiprogramming', diff: 1 },
    { id: 'bas-26', type: 'single', q: 'According to the diagram "Transition from User to Kernel Mode", what is the value of the mode bit in kernel mode?', options: ['1', '2', 'It depends on the process', '0'], answer: 3, explain: 'The trap sets mode bit = 0 (kernel); the return sets mode bit = 1 (user).', section: 'dual-mode', diff: 2 },
    { id: 'bas-27', type: 'single', q: 'Why does the OS use a timer?', options: ['To synchronize the caches of different CPUs', 'To load the kernel at power-on', 'To stop a process from looping forever or hogging resources: the timer interrupt gives control back to the OS', 'To measure the access time of the disk'], answer: 2, explain: 'The counter reaches 0 → interrupt → the OS regains control and can schedule another process or terminate the program that exceeded its allotted time.', section: 'dual-mode', diff: 2 },
    { id: 'bas-28', type: 'single', q: 'Which statement about programs and processes is correct?', options: ['A process is a file on disk', 'A program is a passive entity; a process is an active entity', 'A program is an active entity; a process is a passive entity', 'A program and a process are the same thing'], answer: 1, explain: 'A process is a program in execution (active); the program file on disk is passive. The tempting wrong answer swaps the two words.', section: 'process-mgmt', diff: 1 },
    { id: 'bas-29', type: 'multi', q: 'Which activities belong to process management? (select all that apply)', options: ['Suspending and resuming processes', 'Mechanisms for deadlock handling', 'Free-space management', 'Mounting and unmounting', 'Creating and deleting user and system processes'], answer: [0, 1, 4], explain: 'Free-space management and mounting/unmounting are activities of mass-storage management.', section: 'process-mgmt', diff: 2 },
    { id: 'bas-30', type: 'single', q: 'According to the I/O subsystem slide, spooling is…', options: ['keeping parts of data in faster storage for performance', 'storing data temporarily while it is being transferred', 'moving processes between memory and disk', 'the overlapping of output of one job with input of other jobs'], answer: 3, explain: 'Spooling overlaps the output of one job with the input of others. Keeping data in faster storage is caching, storing data in transit is buffering, and moving processes between memory and disk is swapping.', section: 'resource-mgmt', diff: 3 },
    { id: 'bas-31', type: 'single', q: 'Which activity belongs to mass-storage management?', options: ['Cache coherency', 'Job scheduling', 'Disk scheduling', 'Process synchronization'], answer: 2, explain: 'Mass-storage management: mounting/unmounting, free-space management, storage allocation, disk scheduling, partitioning, protection.', section: 'resource-mgmt', diff: 2 },
    { id: 'bas-32', type: 'single', q: 'How does protection differ from security?', options: ['Protection is only for networks, security only for disks', 'Protection controls the access of processes and users to resources; security defends the system against internal and external attacks', 'Protection defends against viruses; security controls access to files', 'They are synonyms'], answer: 1, explain: 'These are the slide definitions. The tempting wrong answer swaps the two ideas: virus defense is security, access control is protection.', section: 'protection', diff: 1 },
    { id: 'bas-33', type: 'single', q: 'When is emulation used?', options: ['When the source CPU type differs from the target CPU type (e.g. PowerPC to Intel x86)', 'When guest and host are compiled for the same CPU', 'When a language is not compiled to native code', 'When the VMM runs natively without a host OS'], answer: 0, explain: 'Emulation runs code written for a different CPU and is generally the slowest method. A language not compiled to native code needs interpretation; guests compiled for the same CPU use virtualization.', section: 'virtualization', diff: 3 },
    { id: 'bas-34', type: 'single', q: 'Which statement about peer-to-peer (P2P) is true?', options: ['There is one dedicated server and many clients', 'Nodes cannot discover each other’s services', 'It is used only in LANs', 'There is no distinction between clients and servers: each node can act as client, server or both'], answer: 3, explain: 'In P2P all nodes are peers; services are found through a central lookup service or a discovery protocol. One dedicated server with many clients is the client-server model.', section: 'environments', diff: 2 },
    { id: 'bas-35', type: 'single', q: 'What is the defining property of a real-time OS?', options: ['It always runs without an OS', 'It must support virtualization', 'It has well-defined fixed time constraints and works correctly only if they are met', 'It has a GUI and a touch screen'], answer: 2, explain: 'Processing must be done within the time constraint; a late result counts as an incorrect operation.', section: 'environments', diff: 2 },
    { id: 'bas-36', type: 'single', q: 'Storage available over the Internet for backup use is an example of…', options: ['Private cloud', 'IaaS', 'SaaS', 'PaaS'], answer: 1, explain: 'IaaS offers servers or storage; SaaS offers applications (a word processor); PaaS offers a software stack (a database server).', section: 'cloud', diff: 2 },
    { id: 'bas-37', type: 'single', q: 'Who started the free-software movement, and with which license?', options: ['The Free Software Foundation (FSF), with the copyleft GNU Public License (GPL)', 'Microsoft, with Digital Rights Management (DRM)', 'Apple, with the BSD license', 'VMware, with the VirtualBox license'], answer: 0, explain: 'The FSF started it with the copyleft GPL. DRM is exactly what the open-source movement runs counter to.', section: 'open-source', diff: 2 },
    { id: 'bas-38', type: 'single', q: 'According to the slide, what is the search performance of a binary search tree that is not balanced?', options: ['O(lg n)', 'O(1)', 'O(n²)', 'O(n)'], answer: 3, explain: 'An unbalanced BST can degenerate into a chain, like a list, so search is O(n). O(lg n) is the balanced BST.', section: 'kernel-ds', diff: 3 },
    { id: 'bas-39', type: 'single', q: 'A bitmap is…', options: ['a tree with keys ordered left <= right', 'an array indexed by hash_function(key)', 'a string of n binary digits representing the status of n items', 'a table of the addresses of interrupt service routines'], answer: 2, explain: 'Slide definition of a bitmap. The other options describe a binary search tree, a hash map and the interrupt vector.', section: 'kernel-ds', diff: 1 },
    { id: 'bas-40', type: 'single', q: 'When an interrupt occurs, what does the OS save so that the interrupted program can continue later?', options: ['Only the contents of main memory', 'The registers and the program counter', 'The device-status table', 'The interrupt vector'], answer: 1, explain: 'The OS preserves the state of the CPU by storing the registers and the program counter (which holds the address of the interrupted instruction). Main memory stays where it is.', section: 'interrupts', diff: 1 },
    { id: 'bas-41', type: 'single', q: 'In the dual-core design on the slide, which components are shared by the two cores?', options: ['The registers and the L1 cache', 'Only the registers', 'The L2 cache and main memory', 'Nothing — each core has its own main memory'], answer: 2, explain: 'Each core has its own registers and L1 cache; the L2 cache and main memory are shared.', section: 'architecture', diff: 2 },
    { id: 'bas-42', type: 'single', q: 'What is "non-uniform" in a NUMA system?', options: ['The size of the CPU registers', 'The memory access time: a CPU reaches its local memory faster than the memory of another CPU', 'The clock speed of the cores', 'The number of devices attached to each CPU'], answer: 1, explain: 'In NUMA each CPU has local memory; reaching another CPU’s memory goes through the interconnect and is slower, so access time is not uniform.', section: 'architecture', diff: 2 },
    { id: 'bas-43', type: 'single', q: 'Where is the bootstrap program typically stored?', options: ['In main memory (RAM)', 'On the hard disk, in the root file system', 'In ROM or EPROM, as firmware', 'In the CPU cache'], answer: 2, explain: 'RAM is volatile and empty at power-on, so the bootstrap program must be in ROM or EPROM, known as firmware.', section: 'startup', diff: 1 },
    { id: 'bas-44', type: 'tf', q: 'A signal is an event sent by a hardware device to the CPU and handled by an interrupt service routine.', answer: false, explain: 'That describes an interrupt. A signal is a software notification delivered to a process (e.g. SIGINT), which can stop the process or invoke its signal handler.', section: 'resume', diff: 2 },
    { id: 'bas-45', type: 'single', q: 'What does the device-status table contain for each I/O device?', options: ['Its type, address and state', 'The addresses of its interrupt service routines', 'The list of processes that own it', 'A copy of its local buffer'], answer: 0, explain: 'One entry per device with type, address and state; the OS updates the entry when an interrupt arrives. ISR addresses are in the interrupt vector.', section: 'io-structure', diff: 2 },
    { id: 'bas-46', type: 'single', q: 'On a shared computer such as a mainframe, the slides say the OS acts as…', options: ['a resource allocator and control program', 'a middleware framework', 'a bootstrap program', 'a device controller'], answer: 0, explain: 'A shared computer must keep all users happy, so the OS is a resource allocator and a control program: it uses the hardware efficiently and manages the execution of user programs.', section: 'what-is-os', diff: 1 },
    { id: 'bas-47', type: 'single', q: 'Which two choices make up cache management, according to the slide?', options: ['Cache size and replacement policy', 'Bus width and clock speed', 'Mode bit and timer', 'Track size and sector size'], answer: 0, explain: 'The cache is smaller than the storage it caches, so the designer must choose its size and the policy that decides which data to replace.', section: 'caching', diff: 1 }
  ]
});
