OS.addModule({
  id: 'io',
  num: 10,
  group: 'theory',
  title: 'I/O Systems',
  titleRu: 'Системы ввода-вывода',
  icon: '🔌',
  sources: ['11-IO.pdf'],
  summary: 'How the CPU talks to slow and very different devices: buses and controllers, the four I/O techniques (program controlled, polling, interrupt driven, DMA), the interrupt mechanism in detail, device drivers, buffering vs caching and user-space I/O.',
  bridge: 'The Main Memory and Intel i7 modules followed data between the CPU, the caches and RAM. But data also has to enter and leave the machine. In the Scheduling and Deadlock modules a device was an abstract resource: a process "waits for I/O" or "requests the printer". Module 1 showed the hardware outline (interrupts, DMA). This module opens the box: how the CPU actually gives a command to a device, how it learns that the device has finished, and how the OS hides the huge differences between devices.',
  intro: `
<p>A CPU executes billions of instructions per second, and every instruction looks the same to it. Devices are the opposite: a keyboard produces a few bytes per second, a graphics card thousands of megabits; a disk stores data, a printer only outputs it. The <b>I/O system</b> is the part of the hardware and of the OS that connects these two worlds. It has two jobs: <b>move data</b> between devices and memory without wasting the CPU, and <b>hide the differences</b> between devices from programs.</p>
<p>Keep one picture in mind: <b>CPU ↔ bus ↔ controller ↔ device</b>. The CPU never touches a device directly; it writes commands into the registers of the device controller. The module first builds this picture (devices, buses, controllers). Then it climbs a ladder of four techniques — program controlled I/O, polling, interrupts, DMA — where each step frees more CPU time than the one before. Next it looks closely at <b>interrupts</b>, the mechanism behind the last two steps. Finally it moves up to software: device drivers, buffering and the I/O code that runs in user space.</p>`,
  sections: [
    {
      id: 'heterogeneity',
      h: 'I/O devices are slow and very different',
      why: 'the problem: slow, different devices',
      lead: 'Before asking how the CPU talks to devices, look at who it has to talk to. Devices differ in what they do, in who uses them and, most of all, in speed.',
      html: `
<p>An <b>I/O device</b> (input/output device) is any piece of hardware that moves data into or out of the computer, or stores it: keyboard, disk, network card, printer. Their characteristics are very different, so the slides classify them along <b>three dimensions</b>:</p>
<ul>
  <li><b>Behavior</b> — what the device does: <i>input</i>, <i>output</i> or <i>data storage</i>.</li>
  <li><b>Counterparty (partner)</b> — who is on the other side: a <i>human</i> (keyboard, screen) or a <i>machine</i> (disk, network).</li>
  <li><b>Data transfer rate</b> — how fast data moves from the device to memory and back.</li>
</ul>
<p>The table places typical devices on these three dimensions. Look mostly at the last column:</p>
<table class="t">
  <tr><th>Device</th><th>Function (behavior)</th><th>Partner</th><th>Speed (Mb/s)</th></tr>
  <tr><td>Keyboard</td><td>input</td><td>human</td><td>0.0001</td></tr>
  <tr><td>Mouse</td><td>input</td><td>human</td><td>0.0038</td></tr>
  <tr><td>Laser printer</td><td>output</td><td>human</td><td>3.2</td></tr>
  <tr><td>Network / wireless LAN</td><td>input or output</td><td>machine</td><td>11–54</td></tr>
  <tr><td>Network / LAN</td><td>input or output</td><td>machine</td><td>100–1000</td></tr>
  <tr><td>Optical disc</td><td>storage</td><td>machine</td><td>80</td></tr>
  <tr><td>Magnetic disk</td><td>storage</td><td>machine</td><td>240–2560</td></tr>
  <tr><td>Graphic card</td><td>output</td><td>human</td><td>800–8000</td></tr>
</table>
<p>The speeds go from 0.0001 Mb/s (keyboard) to 8000 Mb/s (graphic card): the fastest device is about <b>80 million times</b> faster than the slowest. Devices whose partner is a human are mostly slow, because people are slow; the exception is the graphics card, which must redraw a whole screen many times per second. Devices that talk to machines (networks, disks) are fast.</p>
<div class="callout key">No single I/O method fits both ends of this range. For a keyboard the question is <i>"how do we avoid wasting the CPU while we wait?"</i>; for a fast disk or network card it is <i>"how do we move a flood of data without the CPU copying every byte?"</i>. The techniques later in this module answer exactly these two questions.</div>`,
      takeaway: 'Devices are classified by behavior (input / output / storage), partner (human / machine) and data transfer rate. Rates differ enormously (keyboard 0.0001 Mb/s, graphic card up to 8000 Mb/s), so different devices need different I/O techniques.',
      exam: 'The three dimensions; for a device from the table, its function, its partner and the order of magnitude of its speed.'
    },
    {
      id: 'organization',
      h: 'Where devices sit: the organization of a computer',
      why: 'the path from CPU to device',
      lead: 'To talk to a device the CPU needs a physical path to it. In a Von Neumann computer that path is a shared bus, and every device hangs on it through its own controller.',
      html: `
<p>The slide shows a <b>possible organization of a computer</b> in the <b>Von Neumann architecture</b>, the design in which programs and data are kept in the same memory and travel over the same bus. Read the diagram from top to bottom:</p>
<ul>
  <li>The <b>processor</b> with its <b>cache</b> and the <b>main memory</b> are connected to a common <b>memory – I/O bus</b>.</li>
  <li>The devices (disks, graphics output, network) are <i>not</i> connected to the bus directly. Each one sits behind an <b>I/O controller</b>: a piece of electronics that speaks the bus protocol on one side and drives the device on the other.</li>
  <li>Separate <b>interrupt</b> lines go from the controllers back to the processor. Through them a controller can say "I need attention" without waiting to be asked.</li>
</ul>
<svg class="d" viewBox="0 0 600 330">
  <line class="d-line" x1="290" y1="215" x2="290" y2="30"/>
  <line class="d-line" x1="435" y1="215" x2="435" y2="30"/>
  <line class="d-line" x1="570" y1="215" x2="570" y2="30"/>
  <line class="d-arrow" x1="570" y1="30" x2="162" y2="30"/>
  <text class="d-txt sm" x="225" y="22" text-anchor="middle">Interrupts</text>
  <rect class="d-box acc" x="40" y="12" width="120" height="40" rx="6"/>
  <text class="d-txt b" x="100" y="37" text-anchor="middle">Processor</text>
  <rect class="d-box" x="55" y="80" width="90" height="34" rx="6"/>
  <text class="d-txt" x="100" y="102" text-anchor="middle">Cache</text>
  <line class="d-line" x1="100" y1="52" x2="100" y2="80"/>
  <line class="d-line" x1="100" y1="114" x2="100" y2="150"/>
  <rect class="d-box warn" x="20" y="150" width="560" height="30" rx="6"/>
  <text class="d-txt b" x="330" y="170" text-anchor="middle">Memory – I/O bus</text>
  <line class="d-line" x1="100" y1="180" x2="100" y2="215"/>
  <line class="d-line" x1="245" y1="180" x2="245" y2="215"/>
  <line class="d-line" x1="390" y1="180" x2="390" y2="215"/>
  <line class="d-line" x1="525" y1="180" x2="525" y2="215"/>
  <rect class="d-box ok" x="40" y="215" width="120" height="60" rx="6"/>
  <text class="d-txt" x="100" y="250" text-anchor="middle">Main memory</text>
  <rect class="d-box" x="190" y="215" width="110" height="44" rx="6"/>
  <text class="d-txt sm" x="245" y="242" text-anchor="middle">I/O controller</text>
  <rect class="d-box" x="335" y="215" width="110" height="44" rx="6"/>
  <text class="d-txt sm" x="390" y="242" text-anchor="middle">I/O controller</text>
  <rect class="d-box" x="470" y="215" width="110" height="44" rx="6"/>
  <text class="d-txt sm" x="525" y="242" text-anchor="middle">I/O controller</text>
  <line class="d-line" x1="215" y1="259" x2="215" y2="285"/>
  <line class="d-line" x1="275" y1="259" x2="275" y2="285"/>
  <line class="d-line" x1="390" y1="259" x2="390" y2="285"/>
  <line class="d-line" x1="525" y1="259" x2="525" y2="285"/>
  <rect class="d-box muted" x="190" y="285" width="50" height="34" rx="6"/>
  <text class="d-txt sm" x="215" y="307" text-anchor="middle">Disk</text>
  <rect class="d-box muted" x="250" y="285" width="50" height="34" rx="6"/>
  <text class="d-txt sm" x="275" y="307" text-anchor="middle">Disk</text>
  <rect class="d-box muted" x="335" y="285" width="110" height="34" rx="6"/>
  <text class="d-txt sm" x="390" y="307" text-anchor="middle">Graphics output</text>
  <rect class="d-box muted" x="470" y="285" width="110" height="34" rx="6"/>
  <text class="d-txt sm" x="525" y="307" text-anchor="middle">Network</text>
</svg>
<p>Three ideas from this picture drive the rest of the module. First, the CPU reaches a device only <b>through its controller</b>. Second, everybody shares the <b>bus</b>, so the bus can become a bottleneck. Third, the <b>interrupt lines</b> give devices a way to start a conversation with the CPU — the basis of interrupt-driven I/O.</p>`,
      takeaway: 'Processor (with cache) and main memory share a memory – I/O bus; every device is attached through an I/O controller; controllers signal the processor through interrupt lines.'
    },
    {
      id: 'bus',
      h: 'The bus: lines, transactions and bus types',
      why: 'how data travels between parts',
      lead: 'Every transfer between CPU, memory and devices crosses a bus. What is a bus made of, what does one transfer look like, and why does a computer have several kinds of bus?',
      html: `
<p>A <b>bus</b> is the communication channel between the various components of the computer. It is a <b>shared transmission medium</b>: several components are connected to the same wires, and only one transfer can use them at a time. A computer contains <b>several buses</b>.</p>
<p>Because it is shared, a bus is a potential <b>bottleneck</b> — the slowest point, which limits the whole system. Its performance is limited by two physical facts:</p>
<ul>
  <li>its <b>length</b> — signals need more time to travel along long wires;</li>
  <li>the <b>number of connected devices</b> — more devices compete for the same wires.</li>
</ul>
<p>A bus consists of two groups of lines:</p>
<ul>
  <li><b>Data lines</b> (and address lines) carry the information itself: data, addresses, even complex commands. The number of data lines is the bus <b>width</b>. The same lines can be shared, used in turn for addresses and for data; this is called <b>multiplexing</b> (fewer wires, but two steps per transfer).</li>
  <li><b>Control lines</b> control the access to and the use of the data and address lines: they carry <b>requests</b> and <b>acknowledgments (acks)</b>, and they say what type of information is on the data lines right now.</li>
</ul>
<p><b>Transactions on the bus.</b> One complete transfer over the bus is called a <b>transaction</b>. For I/O there are two kinds, and their names surprise many students. The table shows what the control and data lines do in each:</p>
<table class="t">
  <tr><th>Operation</th><th>Transaction name</th><th>Direction</th><th>Control lines say</th><th>Data lines carry</th></tr>
  <tr><td><b>Input operation</b></td><td><b>write transaction</b></td><td>I/O device → memory</td><td>a <b>write</b> must be performed in memory</td><td>the memory address where the data is written</td></tr>
  <tr><td><b>Output operation</b></td><td><b>read transaction</b></td><td>memory → I/O device</td><td>a <b>read</b> must be performed in memory</td><td>the memory address from which the data is read</td></tr>
</table>
<div class="callout warn">The names are given <b>from the point of view of memory</b>. Input means data comes <i>into</i> memory, so memory is written: <b>input = write transaction</b>. Output means data leaves memory, so memory is read: <b>output = read transaction</b>.</div>
<p><b>Bus types.</b> One bus cannot be very fast and, at the same time, long with many devices. So computers use several kinds of bus. The table goes from the fastest one, closest to the CPU, to the slowest:</p>
<table class="t">
  <tr><th>Bus type</th><th>Characteristics</th></tr>
  <tr><td><b>Processor-memory bus</b></td><td>short length, <b>high speed</b>; proprietary (the slide says "overall owner"); designed to <b>maximize the processor-to-memory bandwidth</b></td></tr>
  <tr><td><b>Backplane buses</b></td><td>interconnect structure inside the chassis (the computer case); often used as an <b>intermediate structure</b> between the I/O bus and the processor-memory bus</td></tr>
  <tr><td><b>I/O buses</b></td><td>typically <b>longer and slower</b>; a large variety of connected I/O devices; standards such as <b>PCI</b> (Peripheral Component Interconnect), <b>FireWire</b> (IEEE 1394), <b>USB</b>, <b>SCSI</b></td></tr>
</table>
<p>So the CPU–memory path is kept short and private for speed, the slow and varied devices go on standard I/O buses, and the backplane bus links the two inside the box.</p>`,
      viz: [{ name: 'layers', caption: 'Bus types, from the processor to the devices.', props: { layers: [
        { label: 'Processor-memory bus', sub: 'short, high speed, max CPU ↔ memory bandwidth', tone: 'acc' },
        { label: 'Backplane bus', sub: 'inside the chassis, intermediate structure', tone: 'warn' },
        { label: 'I/O buses', sub: 'PCI, FireWire, USB, SCSI — longer, slower', tone: 'ok' }] } }],
      takeaway: 'A bus = data/address lines + control lines, shared by many components; its length and number of devices limit it. Transaction names are memory-centric: input = write transaction, output = read transaction. Bus types: processor-memory (short, fast), backplane (inside the chassis, in between), I/O buses (longer, slower: PCI, FireWire, USB, SCSI).',
      exam: 'Input = write transaction (device → memory), output = read transaction (memory → device) — a classic trap. Also: what limits bus performance; data vs control lines; multiplexing; the three bus types and the I/O bus standards.'
    },
    {
      id: 'devices',
      h: 'A device = controller + physical device',
      why: 'what the CPU really talks to',
      lead: 'The bus brings the CPU to a controller, not to the device itself. So what is a controller, and how does the CPU give it a command?',
      html: `
<p>An <b>I/O device</b> consists of two components:</p>
<ul>
  <li>the <b>actual physical device</b> — the disk, printer, mouse, screen…;</li>
  <li>the <b>device controller</b> (also called the <b>interface</b>) — the electronics that manage all the operations the device is able to perform.</li>
</ul>
<p>The <b>device controller</b> is a subsystem specialized in controlling I/O devices. It does three useful things:</p>
<ul>
  <li>it provides <b>registers</b> where the data to transfer and the commands for the device can be stored;</li>
  <li>it <b>standardizes</b> the connection between the device and the rest of the system — the CPU sees the same kind of registers, whatever mechanics are behind them;</li>
  <li>it can control <b>several devices</b> at a time (for example, one disk controller for two disks).</li>
</ul>
<div class="callout analogy">Think of a controller as the reception desk of a workshop. You do not walk into the workshop (the device): you leave written instructions at the desk (the registers) and later check the desk for the result.</div>
<p><b>Controller registers.</b> The registers of a controller are also called <b>I/O ports</b>. There are four of them. The table shows what each one stores and who writes it:</p>
<table class="t">
  <tr><th>Register</th><th>Stores</th><th>CPU</th></tr>
  <tr><td><code>status</code></td><td>the status of the peripheral (e.g. idle, busy, down…)</td><td>reads it</td></tr>
  <tr><td><code>control</code></td><td>the <b>command</b> to execute</td><td>writes it</td></tr>
  <tr><td><code>data-in</code></td><td>input data coming from the device</td><td>reads it</td></tr>
  <tr><td><code>data-out</code></td><td>data to be sent to the device</td><td>writes it</td></tr>
</table>
<p>Two registers carry information <i>about</i> the operation (control = what to do, status = how it is going) and two carry the data itself, one for each direction.</p>
<p>So, to request an I/O operation, the processor needs two steps:</p>
<ol class="steps">
  <li><b>Prepare</b> the content of the predetermined controller registers (for example, the command in <code>control</code> and the byte to send in <code>data-out</code>).</li>
  <li><b>Start</b> the controller itself.</li>
</ol>
<p><b>Sending commands to an I/O device.</b> User programs do not write into these registers themselves. The commands must be sent to the corresponding device controller, and an I/O instruction in a high-level language (for example "write this line to a file") is transformed into a <b>series of commands for the controller</b>. At run time this translation is done by the OS module that manages that kind of device: the <b>device driver</b>. The diagram shows the whole stack, from the kernel down to the devices:</p>
<div data-viz="0"></div>
<p>Notice the one-to-one pattern in the middle: every kind of controller has its own driver. The kernel <b>I/O subsystem</b> talks to all drivers in the same way, and each driver knows the registers of one kind of controller.</p>`,
      viz: [{ name: 'layers', caption: 'Sending commands: software (kernel, I/O subsystem, drivers) → hardware (controllers, devices).', props: { layers: [
        { label: 'kernel', tone: 'acc' },
        { label: 'kernel I/O subsystem', tone: 'acc' },
        { label: 'device drivers', sub: 'SAS · keyboard · mouse · … · PCIe bus · 802.11 · USB', tone: 'c2' },
        { label: 'device controllers', sub: 'SAS · keyboard · mouse · … · PCIe bus · 802.11 · USB', tone: 'warn' },
        { label: 'devices', sub: 'SAS devices · keyboard · mouse · PCIe bus · 802.11 devices · USB devices (disks, tapes, drives)', tone: 'muted' }] } }],
      takeaway: 'The CPU talks to the controller, never to the device. The controller exposes four registers (I/O ports): status, control, data-in, data-out. To start I/O the CPU fills the registers and starts the controller; the device driver turns high-level I/O requests into these register commands.',
      exam: 'The two components of an I/O device; the four controller registers and what control and status hold; the two steps of an I/O request.'
    },
    {
      id: 'modes',
      h: 'Four ways to synchronize with a device',
      why: 'the ladder of four techniques',
      lead: 'Now the CPU can start an operation. But the device is much slower and works on its own — so how does the CPU know when the operation has finished?',
      html: `
<p>Once started, a device works <b>autonomously</b>: the disk spins and the printer prints at their own speed, which is <b>much slower</b> than the processor. The CPU and the device are like two people working in parallel at very different speeds, so they need a <b>synchronization mechanism</b>: a way for the CPU to learn "the device is ready" or "the data is here".</p>
<p>The slides list four main techniques for managing I/O devices. They form a ladder: each one removes a waste left by the previous one. The table previews the whole ladder; the next sections explain each step:</p>
<table class="t">
  <tr><th>Technique</th><th>How the CPU learns that the device is ready</th><th>Who moves the data</th><th>What is still wrong</th></tr>
  <tr><td><b>Program controlled</b></td><td>it keeps reading the status of one controller (<b>busy waiting</b>)</td><td>the CPU</td><td>the CPU wastes all the waiting time</td></tr>
  <tr><td><b>Polling</b></td><td>during busy waiting it also checks the other devices</td><td>the CPU</td><td>only a limited improvement</td></tr>
  <tr><td><b>I/O interrupt driven</b></td><td>the controller sends an <b>interrupt request</b>; meanwhile the CPU computes</td><td>the CPU (in the interrupt handler)</td><td>for fast devices the CPU is still busy moving data</td></tr>
  <tr><td><b>Direct Memory Access (DMA)</b></td><td>the DMA controller sends <b>one</b> interrupt at the end</td><td>the DMA controller</td><td>— (the CPU only sets up the transfer)</td></tr>
</table>
<p>Read the last two columns together: going down the table, the CPU first stops <b>waiting</b> (interrupts) and then also stops <b>copying</b> (DMA). The simulator shows what the CPU does over time with three of the techniques:</p>
<div data-viz="0"></div>`,
      viz: [{ name: 'ioModes', caption: 'What the CPU does over time with program controlled I/O (polling), interrupt-driven I/O and DMA. Compare how much of the CPU row is useful work.', props: {} }],
      takeaway: 'Devices are slow and autonomous, so the CPU must synchronize with them. The four techniques — program controlled, polling, interrupt driven, DMA — each free more CPU time than the previous one.',
      exam: 'List the four techniques in order and, for each one, who waits and who moves the data.'
    },
    {
      id: 'programmed',
      h: 'Program controlled I/O and busy waiting',
      why: 'simplest method, highest cost',
      lead: 'The simplest answer to "is the device done yet?" is to keep asking. That is program controlled I/O.',
      html: `
<p>In <b>program controlled I/O</b> (also called programmed I/O) the processor is <b>fully involved</b> in handling the whole I/O operation:</p>
<ol class="steps">
  <li>The processor prepares the controller to execute the operation (fills its registers and starts it).</li>
  <li>Then it <b>continuously interrogates</b> the controller — reads the status register again and again — to check the outcome of the operation.</li>
  <li>When the operation is completed, the processor <b>transfers the data</b> itself (for an input operation) or executes a new instruction.</li>
</ol>
<p>During the whole operation the processor plays the role of the controller. The waiting loop of step 2 has a name: <b>busy waiting</b> — the CPU is busy (it executes instructions), but it does nothing useful except observe the state of the device. In C it looks like this:</p>
<pre class="code" data-lang="c">/* the CPU has written a command into the control register and started the controller */
while (status_reg == BUSY)
    ;                    /* busy waiting: only watch the status */
data = data_in_reg;      /* operation finished: the CPU copies the data itself */</pre>
<p>The method has one advantage and a serious cost:</p>
<div class="cols">
  <div class="pros"><b>+</b><ul><li>very simple</li></ul></div>
  <div class="cons"><b>−</b><ul><li>expensive: in the busy waiting cycle the CPU does nothing except observe the device</li><li>must not be used with <b>slow</b> peripherals: it forces the processor to work at the speed of the peripheral, so the computing power of the processor is wasted</li></ul></div>
</div>
<p>The second point is the real problem. While a slow device finishes one operation, the CPU could have executed millions of useful instructions; instead it executes the same status check millions of times.</p>
<div data-viz="0"></div>
<div class="callout note">A <i>slight</i> improvement of the program controlled technique is <b>polling</b> — the next section.</div>`,
      viz: [{ name: 'timeline', caption: 'Program controlled I/O: the CPU is occupied for the whole operation.', props: {
        max: 12, rows: [
          { label: 'CPU', segs: [{ from: 0, to: 1, label: 'prep', tone: 'acc' }, { from: 1, to: 10, label: 'busy waiting', tone: 'bad' }, { from: 10, to: 12, label: 'transfer', tone: 'acc' }] },
          { label: 'Device', segs: [{ from: 1, to: 10, label: 'executes operation', tone: 'ok' }] }] } }],
      takeaway: 'Program controlled I/O: the CPU starts the controller, loops on the status register (busy waiting) and moves the data itself. Very simple but expensive — never use it with slow peripherals.',
      exam: 'Definition of busy waiting; why program controlled I/O is unsuitable for slow devices.'
    },
    {
      id: 'polling',
      h: 'Polling',
      why: 'use the waiting a little better',
      lead: 'If the CPU must loop anyway, it could at least check the other devices during the loop. That small improvement is polling.',
      html: `
<p>In <b>polling</b>, during a busy waiting cycle on one device, the processor also <b>polls</b> the other I/O devices — it asks each of them in turn "do you need anything?". When a device needs attention, the processor performs the requested transfer and then continues polling.</p>
<div data-viz="0"></div>
<p>One loop now serves several devices, so this is better than pure program control. But the performance improvement is <b>limited</b>, because the CPU is still the one that waits and the one that copies. The table shows how polling fails at both ends of the speed range from the first section:</p>
<table class="t">
  <tr><th>Main polling problem</th><th>What happens</th></tr>
  <tr><td>With <b>slow</b> peripherals</td><td>an excessive waste of processor time: most of the time the CPU is in the busy waiting cycle</td></tr>
  <tr><td>With <b>fast</b> peripherals</td><td>the work done by the processor is almost exclusively the actual data transfer</td></tr>
</table>
<p>So polling wastes the CPU on slow devices and buries it in copying with fast devices. The first problem is solved by interrupts (next section), the second one by DMA.</p>`,
      viz: [{ name: 'flow', caption: 'Polling: the CPU checks the devices in a circle; when one needs work, it transfers the data and goes on.', props: { dir: 'h', loop: true, steps: [
        { label: 'busy waiting', sub: 'device A', tone: 'bad' },
        { label: 'poll device B', tone: 'muted' },
        { label: 'poll device C', tone: 'muted' },
        { label: 'transfer', sub: 'if a device asks for it', tone: 'acc' }] } }],
      takeaway: 'Polling = while busy-waiting on one device, check the other devices too. Limited gain: with slow peripherals the CPU still mostly waits; with fast peripherals it does almost nothing but transfer data.',
      exam: 'How polling differs from program controlled I/O; its two problems (slow vs fast peripherals).'
    },
    {
      id: 'interrupt-io',
      h: 'Interrupt-driven I/O',
      why: 'stop waiting: the device calls back',
      lead: 'Asking again and again wastes time. The fix is to turn the conversation around: the CPU gives the command and goes back to work, and the device calls the CPU when it is ready.',
      html: `
<div class="callout analogy">Polling is like checking your phone every minute for a message. Interrupts are like turning the ringtone on: you do other work and react only when the phone rings.</div>
<p>To avoid busy waiting we need a method based on <b>interrupts</b>. An <b>interrupt</b> is a hardware signal that makes the CPU suspend what it is doing for a moment and run a special routine. With <b>interrupt-driven I/O</b>:</p>
<ol class="steps">
  <li>The processor sends the I/O command to the device controller and <b>continues its computation</b> (for example, it runs another process), ignoring how the controller executes the operation.</li>
  <li>The controller executes the command. When it is ready to exchange data, it sends an <b>interrupt request</b> on the <b>interrupt request line</b>.</li>
  <li>The processor checks the state of the interrupt line <b>after the execution of each instruction</b>.</li>
  <li>If there is a request, the processor first <b>saves the information</b> that will allow it to resume the current program from the point where it was interrupted (the program counter and the registers).</li>
  <li>Then the <b>interrupt handler</b> routine runs and processes the interrupt — for example, it copies the data.</li>
  <li>At the end the handler returns, and the interrupted program continues as if nothing had happened.</li>
</ol>
<p>Saving the state <b>before</b> handling is essential: the handler uses the same CPU registers as the program, and without the saved copy the interrupted program could not continue correctly.</p>
<p><b>The interrupt-driven I/O cycle.</b> The slide diagram puts these steps in a loop between the CPU and the I/O controller. Follow the numbers:</p>
<div data-viz="0"></div>
<p>Compare this with polling: the CPU no longer spends any time waiting. It pays only for the short handler that runs at each interrupt. This is exactly what makes multiprogramming useful — while one process waits for its I/O, the CPU runs another one.</p>`,
      viz: [{ name: 'flow', caption: 'Interrupt-driven I/O cycle (slide diagram). After step 6 the cycle starts again with the next request (arrow 7).', props: { dir: 'v', loop: true, steps: [
        { label: '1. Device driver initiates I/O', sub: 'CPU', tone: 'acc' },
        { label: '2. Controller initiates I/O', sub: 'meanwhile the CPU executes code and checks for interrupts between instructions', tone: 'muted' },
        { label: '3. Input ready / output complete / error', sub: 'the controller generates an interrupt signal', tone: 'warn' },
        { label: '4. CPU receives the interrupt', sub: 'transfers control to the interrupt handler', tone: 'bad' },
        { label: '5. Handler processes the data', sub: 'returns from interrupt', tone: 'c2' },
        { label: '6. CPU resumes the interrupted task', tone: 'ok' }] } }],
      takeaway: 'With interrupts the CPU issues the command and keeps computing; the controller raises an interrupt when it is ready; the CPU checks the line after every instruction, saves the state of the current program, runs the interrupt handler and resumes. No more busy waiting.',
      exam: 'When the CPU checks the interrupt line (after each instruction); what must be saved before handling; the steps of the cycle.'
    },
    {
      id: 'dma',
      h: 'Direct Memory Access (DMA)',
      why: 'stop copying: hardware moves data',
      lead: 'Interrupts removed the waiting, but not the copying. For a fast device that sends a large block of data, the CPU is still interrupted again and again just to move bytes.',
      html: `
<p>With interrupt-driven I/O every piece of data still passes through the CPU: the handler reads it from the controller and stores it in memory. For <b>fast peripherals</b> this <b>transfer activity is still predominant</b> — the processor is busy moving data between the I/O device and memory, one interrupt after another.</p>
<p>The fix is to give the copying job to dedicated hardware. <b>Direct Memory Access (DMA)</b> avoids processor intervention during the transfer. The <b>DMA controller</b> is a processor specialized in transferring data between I/O devices and main memory; it performs the transfer <b>directly, without the processor</b>.</p>
<p>The processor keeps only <b>supervisory duties</b>: it sets up the work and checks the result. Following an I/O request, the processor sends the DMA controller four pieces of information:</p>
<ol>
  <li>the <b>type of operation</b> requested (read or write);</li>
  <li>the <b>I/O device</b> involved;</li>
  <li>the <b>memory address</b> from which to start reading or writing the data;</li>
  <li>the <b>number of bytes</b> to read or write.</li>
</ol>
<p>After that, the work is done without the CPU:</p>
<ul>
  <li>The DMA controller initiates the requested operation and transfers the data to or from memory.</li>
  <li>Once the transfer is complete, the DMA controller sends <b>an interrupt</b> to the processor to signal the completion.</li>
  <li>Between the moment it finishes sending the command and the arrival of that interrupt, the processor is <b>completely free</b> from the I/O operation and can do other work.</li>
</ul>
<p><b>Operations during a DMA transfer.</b> The slide figure shows a disk read with DMA. Follow the numbers:</p>
<ol class="steps">
  <li>The <b>CPU programs the DMA controller</b>: it writes the Address, Count and Control registers.</li>
  <li>The DMA controller <b>requests the transfer</b> to memory from the disk controller.</li>
  <li>The <b>data are transferred</b> from the buffer of the disk controller to main memory over the bus.</li>
  <li>The disk controller sends an <b>acknowledgment (Ack)</b> to the DMA controller. Steps 2–4 repeat until the whole count has been transferred.</li>
</ol>
<p>At the end, the DMA controller raises <b>"interrupt when done"</b> to the CPU.</p>
<div data-viz="0"></div>
<p>Compare the cost: with interrupt-driven I/O a block of N words costs about N interrupts; with DMA it costs one setup and <b>one</b> interrupt. This completes the ladder: program controlled I/O wastes the CPU on waiting and on copying, interrupts remove the waiting, DMA removes the copying.</p>`,
      viz: [{ name: 'graph', caption: 'Operations during a DMA transfer.', props: { w: 600, h: 240,
        nodes: [
          { id: 'cpu', label: 'CPU', x: 60, y: 140, w: 90, tone: 'acc' },
          { id: 'dma', label: 'DMA controller', sub: 'Address · Count · Control', x: 225, y: 140, w: 150, h: 60, tone: 'warn' },
          { id: 'dc', label: 'Disk controller', sub: 'buffer', x: 400, y: 140, w: 130, h: 60, tone: 'c2' },
          { id: 'mem', label: 'Main memory', x: 540, y: 140, w: 100, tone: 'ok' },
          { id: 'drv', label: 'Drive', x: 400, y: 35, shape: 'pill', tone: 'muted' }],
        edges: [
          { from: 'cpu', to: 'dma', label: '1. CPU programs DMA', bend: -40 },
          { from: 'dma', to: 'dc', label: '2. request transfer', bend: -40 },
          { from: 'dc', to: 'mem', label: '3. data' },
          { from: 'dc', to: 'dma', label: '4. Ack', bend: -40 },
          { from: 'dma', to: 'cpu', label: 'interrupt when done', bend: -40, tone: 'bad' },
          { from: 'drv', to: 'dc', both: true }] } }],
      takeaway: 'DMA: the CPU only tells the DMA controller the operation, the device, the start memory address and the byte count; the DMA controller moves the whole block by itself and raises a single interrupt when done. The CPU is free during the transfer.',
      exam: 'What the CPU passes to the DMA controller (4 items); when the interrupt arrives; the order of steps 1–4 in the figure.'
    },
    {
      id: 'interrupts',
      h: 'The interrupt concept and the interrupt vector',
      why: 'finding the right handler fast',
      lead: 'Both interrupt-driven I/O and DMA depend on interrupts. Let us look at the mechanism more closely, starting with the general idea and with how the CPU finds the right routine to run.',
      html: `
<p>The slides use the word <b>break</b> (interruption) for two actions that always happen together:</p>
<ul>
  <li>the <b>forced suspension</b> of the running program;</li>
  <li>the <b>transfer of control</b> to a suitable <b>service routine</b>.</li>
</ul>
<p>A <b>service routine</b> satisfies the need that caused the interruption and, when it is complete, <b>returns control</b> to the suspended program. "Interrupt handler" is another name for the same thing.</p>
<p>On the hardware side it works like this:</p>
<ul>
  <li>The CPU <b>interrupt request line</b> is set by the I/O device.</li>
  <li>The <b>interrupt handler</b> receives and manages the interrupt.</li>
  <li>Some types of interrupts can be <b>masked</b>: the CPU can ignore them permanently or <b>defer</b> their service, for example while it runs a piece of code that must not be interrupted. Some interrupts are <b>unmaskable</b>.</li>
  <li>Interrupts are <b>priority based</b>: a more urgent interrupt is served before a less urgent one.</li>
  <li>The same mechanism is also used for <b>exceptions</b> — errors detected by the CPU itself (next sections).</li>
</ul>
<p><b>The interrupt vector.</b> There are many possible causes of interrupts, and each one needs a different routine. Searching for the right routine at every interrupt would be slow, so the CPU uses a table: the <b>interrupt vector</b> contains the <b>memory addresses of the specialized handlers</b> (interrupt handling routines). Each cause has a number; the number is an index into the table, and the CPU jumps to the address stored there.</p>
<p>The table below is the interpretation of the interrupt vector on Intel processors. Do not try to memorize every line; look at the structure — low numbers are CPU events, high numbers are for devices:</p>
<table class="t">
  <tr><th>Vector number</th><th>Description</th></tr>
  <tr><td>0</td><td>divide error</td></tr>
  <tr><td>1</td><td>debug exception</td></tr>
  <tr><td>2</td><td>null interrupt</td></tr>
  <tr><td>3</td><td>breakpoint</td></tr>
  <tr><td>4</td><td>INTO-detected overflow</td></tr>
  <tr><td>5</td><td>bound range exception</td></tr>
  <tr><td>6</td><td>invalid opcode</td></tr>
  <tr><td>7</td><td>device not available</td></tr>
  <tr><td>8</td><td>double fault</td></tr>
  <tr><td>9</td><td>coprocessor segment overrun (reserved)</td></tr>
  <tr><td>10</td><td>invalid task state segment</td></tr>
  <tr><td>11</td><td>segment not present</td></tr>
  <tr><td>12</td><td>stack fault</td></tr>
  <tr><td>13</td><td>general protection</td></tr>
  <tr><td>14</td><td>page fault</td></tr>
  <tr><td>15</td><td>(Intel reserved, do not use)</td></tr>
  <tr><td>16</td><td>floating-point error</td></tr>
  <tr><td>17</td><td>alignment check</td></tr>
  <tr><td>18</td><td>machine check</td></tr>
  <tr><td>19–31</td><td>(Intel reserved, do not use)</td></tr>
  <tr><td><b>32–255</b></td><td><b>maskable interrupts</b></td></tr>
</table>
<p>Entries <b>0–31</b> are fixed by Intel: errors and special events of the CPU (0 divide error, 3 breakpoint, 13 general protection, 14 page fault…) plus reserved entries. Entries <b>32–255</b> are the <b>maskable interrupts</b>, used by devices. The next section explains these different sources.</p>`,
      takeaway: 'A break = forced suspension of the running program + transfer of control to a service routine, which then returns control. Interrupts can be masked (except the unmaskable ones) and are priority based. The interrupt vector holds the addresses of the handlers; on Intel, 0–31 are CPU events/reserved and 32–255 are maskable interrupts.',
      exam: 'Break and service routine; what the interrupt vector contains; which vectors are maskable (32–255); examples of numbers (0 divide error, 14 page fault).'
    },
    {
      id: 'classification',
      h: 'Kinds of interrupts: external, internal, software',
      why: 'where interrupts come from',
      lead: 'Not every interrupt comes from a device. The CPU itself and the running program can also trigger the same mechanism, and the three sources behave differently in time.',
      html: `
<p>The slide diagram "Interrupt-driven I/O" sorts interrupts into a tree. At the first level there are <b>hardware interrupts</b> (raised by a hardware signal) and <b>software interrupts</b> (raised on purpose by an instruction):</p>
<div data-viz="0"></div>
<ul>
  <li><b>External (I/O) interrupts</b> are generated by the I/O subsystem: to communicate the successful completion of an I/O, to signal the ready status in interrupt-driven I/O, or to report an error in I/O.</li>
  <li><b>Internal interrupts (exceptions)</b> are generated when the CPU hardware detects a malfunction; they are also called <b>EXCEPTION</b> or <b>TRAP</b>. Examples: divide overflow, arithmetic errors, invalid instructions, address range errors, and other conditions set in hardware. Two special cases: a <b>page fault</b> is <i>not an error</i> but the method used to replace a page in the virtual-memory concept, and running a program in <b>debug mode</b> also causes interrupts.</li>
  <li><b>Program-generated (software) interrupts</b> are produced by user programs with the <b>INT</b> instruction. They are useful for <b>system calls</b> — this is how a program enters the kernel — and this feature is needed when writing device drivers.</li>
</ul>
<p>The real difference between these sources is <b>timing</b> with respect to the running program. The slide "Requests and Interrupts" compares the three kinds of requests:</p>
<table class="t">
  <tr><th>Kind of request</th><th>Properties</th></tr>
  <tr><td><b>External interrupt requests</b></td><td>can reach the processor at any time — <b>asynchronous</b> with respect to the program; the processor <b>completes the instruction in progress</b> and examines the requests before fetching the next instruction; an external interrupt <b>cannot</b> suspend an instruction in the middle</td></tr>
  <tr><td><b>Exceptions</b></td><td><b>suspend the execution of the instruction</b> that produced the anomaly (for example divide error — vector 0)</td></tr>
  <tr><td><b>Program generated requests</b></td><td>produced by the execution of instructions — <b>synchronous</b> with respect to the program</td></tr>
</table>
<p><b>Asynchronous</b> means "unrelated to what the program is doing right now": a disk may finish at any moment, so the CPU serves it only between two instructions. <b>Synchronous</b> means "caused by the program itself": the same INT instruction raises the same interrupt every time it runs. Exceptions are also caused by the instruction being executed, but they stop that very instruction instead of waiting for it to finish.</p>`,
      viz: [{ name: 'tree', caption: 'Interrupts: hardware (external, internal) and software (program generated).', props: { root: { label: 'Interrupts', tone: 'acc', children: [
        { label: 'Hardware Interrupts', children: [
          { label: 'External or I/O Interrupts', tone: 'ok', note: 'from the I/O subsystem: successful completion of I/O, ready status, I/O error' },
          { label: 'Internal Interrupts (Exceptions)', tone: 'warn', note: 'malfunction detected by the CPU hardware (EXCEPTION/TRAP): divide overflow, arithmetic errors, invalid instructions, address range errors; page fault — not an error but page replacement in virtual memory; debug mode' }] },
        { label: 'Software Interrupts', children: [
          { label: 'Program Generated', tone: 'c2', note: 'INT instruction in a user program: for system calls and when writing device drivers' }] }] } } }],
      takeaway: 'Hardware interrupts are external (I/O: asynchronous, served only between instructions) or internal (exceptions: they suspend the instruction that caused them). Software interrupts are program generated with INT (synchronous) and are used for system calls. A page fault is an exception but not an error.',
      exam: 'External = asynchronous, never stops an instruction in the middle; exceptions suspend the faulty instruction; program generated = synchronous (INT, system calls).'
    },
    {
      id: 'exceptions',
      h: 'Exceptions: trap, fault, abort',
      why: 'errors detected by the CPU',
      lead: 'Exceptions come from the instruction that is being executed. They differ in when they happen and in whether the program can go on afterwards.',
      html: `
<p>An <b>exception</b> is an interrupt raised by the CPU because of the instruction it is executing. The slides distinguish three kinds. For each one, ask: <i>can the program continue after the exception is handled?</i></p>
<table class="t">
  <tr><th>Exception</th><th>When it happens</th><th>Can the program continue?</th><th>Examples</th></tr>
  <tr><td><b>trap</b></td><td>at the end of the execution of an instruction, to invoke a functionality of the OS; it happens after or during the execution</td><td>yes — execution goes on</td><td>a debugger <b>breakpoint</b>, an overflow situation</td></tr>
  <tr><td><b>fault</b></td><td>a <b>recoverable</b> error that occurs while an instruction is being executed; it happens before the CPU can complete the instruction</td><td>yes — the error can be recovered</td><td>divide by zero, bogus instruction</td></tr>
  <tr><td><b>abort</b></td><td>an <b>unrecoverable</b> error</td><td>no — it produces the forced termination</td><td>(no example on the slides)</td></tr>
</table>
<p>The pattern to remember: a <b>trap</b> is often <i>wanted</i> (the program or the debugger asks for it), a <b>fault</b> is an error the system can recover from, an <b>abort</b> is an error it cannot recover from.</p>`,
      takeaway: 'Trap: at the end of an instruction, to call an OS function (breakpoint, overflow) — execution continues. Fault: recoverable error during an instruction (divide by zero, bogus instruction). Abort: unrecoverable error — forced termination.',
      exam: 'Trap (breakpoint, call to the OS) vs fault (recoverable, divide by zero) vs abort (unrecoverable).'
    },
    {
      id: 'service-routines',
      h: 'Who serves each interrupt: maskable and non-maskable',
      why: 'which routine serves which cause',
      lead: 'A power failure, a finished disk transfer and a program error cannot be handled by the same routine. The slides classify the service routines by the kind of request.',
      html: `
<p>Recall that a <b>maskable</b> interrupt can be ignored or postponed by the CPU, while a <b>non-maskable</b> one cannot. Which interrupts should be impossible to mask? Only those so serious that ignoring them would be a disaster. The table shows the three classes of service routines:</p>
<table class="t">
  <tr><th>Source</th><th>Cause</th><th>Service routine</th></tr>
  <tr><td><b>Non-maskable external interrupt</b></td><td>produced by <b>catastrophic</b> causes, such as the supply voltage dropping below a threshold level</td><td>a single routine (the type is unique) that carries out appropriate <b>recovery actions</b></td></tr>
  <tr><td><b>Maskable external interrupt</b></td><td>typically produced by <b>I/O interfaces</b> (controllers)</td><td><b>drivers</b>: they carry out the data transfer</td></tr>
  <tr><td><b>Exceptions</b></td><td>an anomaly in the running program</td><td>routines that replace the running program and prevent it from continuing to operate incorrectly (they can simply send an error message)</td></tr>
</table>
<p>A non-maskable interrupt must be served even when the CPU has masked everything else: when the power is failing there is very little time left to save what can be saved. The middle row is the link to the software part of this module: the code that serves ordinary device interrupts belongs to the <b>device drivers</b>.</p>`,
      takeaway: 'Non-maskable interrupts are reserved for catastrophic events (power failure) and have one recovery routine. Maskable interrupts usually come from I/O interfaces and are served by drivers. Exceptions are served by routines that stop the faulty program from going on incorrectly.',
      exam: 'Non-maskable = catastrophic causes (power); maskable = I/O interfaces, served by drivers.'
    },
    {
      id: 'identify',
      h: 'Which device interrupted? Priority and nested interrupts',
      why: 'many devices, one CPU',
      lead: 'When an interrupt arrives, the CPU knows that someone needs attention. But if many devices share the line, who is it? And what if two devices want attention at the same time?',
      html: `
<p>The slides list three <b>mechanisms to identify the I/O device that generated the interrupt</b>. They trade hardware cost against time:</p>
<table class="t">
  <tr><th>Mechanism</th><th>How it works</th><th>Comment</th></tr>
  <tr><td><b>More break lines</b> (several interrupt lines)</td><td>separate interrupt lines for different devices</td><td>it is impractical to dedicate many bus lines to interrupts, so it is used in combination with one of the other two mechanisms; it makes <b>interrupt priority</b> simple (line = priority)</td></tr>
  <tr><td><b>Software poll</b></td><td>when it detects an interrupt, the processor runs a routine that <b>polls</b> the I/O devices to find out who caused it</td><td>disadvantage: <b>waste of time</b></td></tr>
  <tr><td><b>Hardware interrogation, vectorized</b></td><td>one interrupt request line common to all I/O devices; when it detects the interrupt, the processor sends an <b>acknowledgment</b>; the requesting device answers with its <b>interrupt vector code</b>, which the processor uses as a pointer to the right handling routine</td><td>fast, and it needs only one line</td></tr>
</table>
<p>The vectorized method connects to the <b>interrupt vector</b> seen earlier: the device itself supplies the index into the table, so no searching is needed.</p>
<p><b>Priority of interrupts.</b> When several devices can send interrupts to the processor, identifying the device and its routine is not enough. The system must also:</p>
<ul>
  <li>manage interrupt <b>priority</b> — decide which pending request is served first;</li>
  <li>handle <b>nested breaks</b> (nested interrupts) — an interrupt that arrives while another interrupt is being handled.</li>
</ul>
<p>With priorities, a high-priority interrupt may interrupt the handler of a low-priority one, as in the timeline below; when the high-priority handler returns, the low-priority handler continues, and finally the user program.</p>
<div data-viz="0"></div>`,
      viz: [{ name: 'timeline', caption: 'Nested interrupts: a high-priority interrupt preempts the handler (ISR) of a low-priority one.', props: {
        max: 16, rows: [
          { label: 'CPU', segs: [{ from: 0, to: 4, label: 'user program', tone: 'acc' }, { from: 4, to: 7, label: 'ISR low', tone: 'warn' }, { from: 7, to: 10, label: 'ISR high', tone: 'bad' }, { from: 10, to: 12, label: 'ISR low', tone: 'warn' }, { from: 12, to: 16, label: 'user program', tone: 'acc' }] }],
        marks: [{ t: 4, label: 'IRQ low' }, { t: 7, label: 'IRQ high' }, { t: 10, label: 'return' }, { t: 12, label: 'return' }] } }],
      takeaway: 'Three ways to find the source of an interrupt: more break lines (few lines available, used with another method), software poll (simple but wastes time), vectorized interrogation (ack → the device sends its vector code → direct jump). With many devices the system must also manage priorities and nested interrupts.',
      exam: 'The three identification mechanisms and the drawback of the software poll; how vectorized interrogation works (ack → vector code); nested interrupts.'
    },
    {
      id: 'drivers',
      h: 'Device drivers',
      why: 'hide device details from the OS',
      lead: 'Every controller has its own registers and its own interrupts. Somebody must know these details for every device — without forcing the rest of the OS to know them. That is the job of the device driver.',
      html: `
<p>A <b>device driver</b> is the part of the OS that knows how to operate one kind of controller: which registers it has, which commands it accepts and how to handle its interrupts. It offers the rest of the OS a standard set of operations (such as "read a block" or "write a character") and translates each request into the register commands we saw earlier. As the previous sections showed, the service routines of maskable I/O interrupts are also part of the drivers.</p>
<p>The slide diagram shows the layers, from the user down to the hardware:</p>
<div data-viz="0"></div>
<ul>
  <li>The <b>user program</b> runs in <b>user space</b> and asks the operating system for I/O (through system calls).</li>
  <li>The <b>rest of the operating system</b> calls the specific <b>device driver</b> — printer driver, camcorder driver, CD-ROM driver. Drivers run in <b>kernel space</b>, with full access to the hardware.</li>
  <li>Each driver controls its <b>controller</b> (hardware), and the controller operates the device.</li>
</ul>
<p>The benefit of this design is that device differences stay inside the drivers: to support a new kind of device you add a driver, and the rest of the kernel and the user programs stay unchanged. The price is that drivers run in kernel space, so an error in a driver can affect the whole system.</p>`,
      viz: [{ name: 'layers', caption: 'Device drivers: user space → kernel space → hardware → devices.', props: { layers: [
        { label: 'User program', sub: 'user space', tone: 'c2' },
        { label: 'Rest of the operating system', sub: 'kernel space', tone: 'acc' },
        { label: 'Printer driver · Camcorder driver · CD-ROM driver', sub: 'kernel space', tone: 'acc' },
        { label: 'Printer controller · Camcorder controller · CD-ROM controller', sub: 'hardware', tone: 'warn' },
        { label: 'Devices', sub: 'printer · camcorder · CD-ROM', tone: 'muted' }] } }],
      takeaway: 'Drivers run in kernel space, one for each type of controller, and translate generic OS requests into controller commands. The chain: user program (user space) → rest of the OS → driver (kernel space) → controller (hardware) → device.',
      exam: 'Drivers live in kernel space, one per type of controller; the chain user program → OS → driver → controller → device.'
    },
    {
      id: 'buffering',
      h: 'Buffering vs caching',
      why: 'absorb speed and size differences',
      lead: 'Devices and programs rarely produce and consume data at the same speed or in units of the same size. The kernel puts memory areas in between — and there are two different kinds, which are easy to confuse.',
      html: `
<p>A <b>buffer</b> is a memory area that holds data while it travels between two places. Example: a program writes a file line by line, but the disk writes whole blocks; the kernel collects the lines in a buffer and writes the block when it is full. The buffer absorbs the difference in speed and in transfer size.</p>
<p>A <b>cache</b> is a memory area that holds a <i>copy</i> of data that is used repeatedly, so that the next access is fast. Example: a file that you read a moment ago is read again, and the kernel serves it from the copy in RAM instead of going to the disk.</p>
<p>The slide compares the two on four points. The key row is <b>Storage</b>: a buffer may hold the <i>only</i> copy of the data, a cache always holds a <i>second</i> copy.</p>
<table class="t">
  <tr><th>Basis</th><th>Buffering</th><th>Caching</th></tr>
  <tr><td>Definition</td><td>temporarily holding data in memory (a buffer) before writing it to a permanent storage location</td><td>temporarily storing data in memory for quick access or retrieval</td></tr>
  <tr><td>Basic</td><td>the buffer stores data <b>until it is processed</b></td><td>caching speeds up access to <b>repeatedly used</b> data</td></tr>
  <tr><td>Storage</td><td>stores the <b>original</b> data</td><td>stores a <b>copy</b> of the data</td></tr>
  <tr><td>Location</td><td>a memory area in <b>RAM</b></td><td>in the <b>processor</b>; can also be implemented with RAM and disk</td></tr>
</table>
<p>A consequence: if a cache is lost, nothing is lost — the original is still in its place. If a buffer is lost before its content is written, the data are gone. That is why buffered data must reach their permanent location in the end.</p>`,
      takeaway: 'Buffer: holds the original data temporarily, until they are processed or written; it lives in RAM. Cache: holds a copy of repeatedly used data for fast access; it is in the processor, and can also be in RAM or on disk.',
      exam: 'Buffer = original data, kept until processed, in RAM; cache = copy, for fast repeated access, in the processor / RAM / disk.'
    },
    {
      id: 'user-io',
      h: 'I/O software in user space and spooling',
      why: 'the top layer of I/O software',
      lead: 'Not all I/O software is in the kernel. The top layer runs in user space, inside or next to the user programs.',
      html: `
<p>We have climbed from the controller to the driver and the kernel. The last layer is the I/O software that runs in <b>user space</b>. The slides name two parts of it.</p>
<p><b>1. Libraries</b> linked with user programs, for example <code>stdio</code> and <code>unistd</code> in C. They:</p>
<ul>
  <li>pass the parameters to the <b>system calls (SCs)</b> in the right way;</li>
  <li>handle <b>formatting</b> — for example <code>printf()</code> turns the number 42 into the characters "4" and "2".</li>
</ul>
<pre class="code" data-lang="c">#include &lt;stdio.h&gt;
int main(void)
{
    int x = 42;
    printf("x = %d\\n", x);  /* formatting happens in user space (stdio),
                                then the library calls the write() system call */
    return 0;
}</pre>
<p><b>2. Spooling.</b> Some devices, like a printer, can serve only one user at a time: if two programs printed at once, their pages would be mixed. <b>Spooling</b> solves this without giving any program direct access to the printer. It consists of:</p>
<ul>
  <li>a <b>spool directory</b>, where the user copies the file to be printed;</li>
  <li>a user process, the <b>printer daemon</b> (a daemon is a process that runs in the background), which takes the files from the directory one at a time and sends them to the printer.</li>
</ul>
<div data-viz="0"></div>
<p>Spooling is the buffering idea on a larger scale: the spool directory is a queue on disk that separates fast programs from a slow device that cannot be shared.</p>
<p>Of all I/O devices, the most important ones are disks: they keep every program and file permanently. The next module looks at them in detail.</p>`,
      viz: [{ name: 'flow', caption: 'Print spooling.', props: { dir: 'h', steps: [
        { label: 'User', sub: 'copies the file', tone: 'c2' },
        { label: 'Spool directory', tone: 'warn' },
        { label: 'Printer daemon', sub: 'user process', tone: 'acc' },
        { label: 'Printer', tone: 'muted' }] } }],
      takeaway: 'User-space I/O software = libraries (stdio, unistd: pass parameters to system calls, format output as printf does) + spooling (a printer daemon process and a spool directory where users copy the files to print).',
      exam: 'What the user-space I/O library does (parameters of SCs, formatting); what spooling consists of (printer daemon + spool directory).'
    }
  ],
  terms: [
    { en: 'I/O device', ru: 'устройство ввода-вывода', def: 'Hardware that moves data into or out of the computer, or stores it; it consists of the physical device and its controller.' },
    { en: 'I/O system', ru: 'система ввода-вывода', def: 'The hardware and OS parts that move data between devices and memory and hide device differences from programs.' },
    { en: 'Behavior', ru: 'поведение (функция устройства)', def: 'Dimension of I/O devices: input, output or data storage.' },
    { en: 'Counterparty', ru: 'партнёр по обмену', def: 'Dimension of I/O devices: whether the other side is a human or a machine.' },
    { en: 'Data transfer rate', ru: 'скорость передачи данных', def: 'How fast data moves between the device and memory (for example in Mb/s).' },
    { en: 'Von Neumann architecture', ru: 'архитектура фон Неймана', def: 'Computer design in which programs and data share one memory reached over a common bus.' },
    { en: 'Bus', ru: 'шина', def: 'Shared transmission medium connecting the components of a computer; one transfer at a time; a potential bottleneck.' },
    { en: 'Shared transmission medium', ru: 'общая среда передачи', def: 'A channel to which several components are connected and which they use in turn.' },
    { en: 'Bottleneck', ru: 'узкое место', def: 'The slowest part of a system, which limits the performance of the whole.' },
    { en: 'Data lines', ru: 'линии данных', def: 'Bus lines that carry data, addresses and even commands; their number is the bus width.' },
    { en: 'Control lines', ru: 'линии управления', def: 'Bus lines that control access to the data lines: requests, acknowledgments, type of information.' },
    { en: 'Bus width', ru: 'ширина шины', def: 'The number of data lines of a bus.' },
    { en: 'Multiplexing', ru: 'мультиплексирование', def: 'Using the same bus lines in turn for addresses and for data.' },
    { en: 'Bus transaction', ru: 'транзакция на шине', def: 'One complete transfer over the bus.' },
    { en: 'Write transaction', ru: 'транзакция записи', def: 'Input operation: data move from the I/O device into memory (named from the point of view of memory).' },
    { en: 'Read transaction', ru: 'транзакция чтения', def: 'Output operation: data move from memory to the I/O device.' },
    { en: 'Processor-memory bus', ru: 'шина процессор–память', def: 'Short, high-speed, proprietary bus designed to maximize processor–memory bandwidth.' },
    { en: 'I/O bus', ru: 'шина ввода-вывода', def: 'Longer and slower bus for many kinds of devices; standards PCI, FireWire, USB, SCSI.' },
    { en: 'Backplane bus', ru: 'объединительная шина', def: 'Interconnect inside the chassis, often between the I/O bus and the processor-memory bus.' },
    { en: 'Device controller', ru: 'контроллер устройства', def: 'Electronics (interface) that operate a device and expose registers to the CPU; can control several devices.' },
    { en: 'I/O port', ru: 'порт ввода-вывода', def: 'A controller register: status, control, data-in or data-out.' },
    { en: 'Status register', ru: 'регистр состояния', def: 'Controller register with the state of the peripheral (idle, busy, down…); read by the CPU.' },
    { en: 'Control register', ru: 'регистр управления', def: 'Controller register with the command to execute; written by the CPU.' },
    { en: 'Data-in register', ru: 'регистр входных данных', def: 'Controller register with the input data coming from the device.' },
    { en: 'Data-out register', ru: 'регистр выходных данных', def: 'Controller register with the data to send to the device.' },
    { en: 'Program controlled I/O', ru: 'программно-управляемый ввод-вывод', def: 'The CPU starts the controller, loops on its status (busy waiting) and moves the data itself.' },
    { en: 'Busy waiting', ru: 'активное ожидание', def: 'A loop in which the CPU only checks a status until an operation ends, doing no useful work.' },
    { en: 'Polling', ru: 'опрос', def: 'While busy-waiting on one device, the CPU also checks the other devices in turn; a limited improvement.' },
    { en: 'Interrupt', ru: 'прерывание', def: 'A signal that suspends the running program and transfers control to a service routine.' },
    { en: 'Interrupt-driven I/O', ru: 'ввод-вывод по прерываниям', def: 'The CPU issues a command and keeps computing; the controller raises an interrupt when it is ready.' },
    { en: 'Interrupt request', ru: 'запрос прерывания', def: 'The signal a controller sends to ask the CPU for attention.' },
    { en: 'Interrupt request line', ru: 'линия запроса прерывания', def: 'CPU input set by an I/O device; the CPU checks it after each instruction.' },
    { en: 'Interrupt handler', ru: 'обработчик прерывания', def: 'The routine that receives and manages an interrupt, then returns control to the interrupted program.' },
    { en: 'Service routine', ru: 'процедура обслуживания', def: 'Routine that satisfies the need that caused an interrupt and returns control to the suspended program.' },
    { en: 'Break', ru: 'прерывание (break)', def: 'Forced suspension of the running program plus transfer of control to a service routine.' },
    { en: 'Interrupt vector', ru: 'вектор прерываний', def: 'Table of the memory addresses of the interrupt handlers, indexed by interrupt number.' },
    { en: 'Maskable interrupt', ru: 'маскируемое прерывание', def: 'An interrupt the CPU can ignore or defer; usually from I/O interfaces (Intel vectors 32–255).' },
    { en: 'Non-maskable interrupt', ru: 'немаскируемое прерывание', def: 'An interrupt that cannot be ignored; produced by catastrophic causes such as a power failure.' },
    { en: 'Hardware interrupt', ru: 'аппаратное прерывание', def: 'Interrupt raised by a hardware signal: external (I/O) or internal (exception).' },
    { en: 'Software interrupt', ru: 'программное прерывание', def: 'Interrupt raised on purpose by an instruction (INT), for example for a system call.' },
    { en: 'External interrupt', ru: 'внешнее прерывание', def: 'Interrupt from the I/O subsystem; asynchronous; served only between two instructions.' },
    { en: 'Internal interrupt', ru: 'внутреннее прерывание', def: 'An exception: interrupt raised by the CPU hardware because of the instruction being executed.' },
    { en: 'Exception', ru: 'исключение', def: 'Interrupt caused by an anomaly in the executing instruction: trap, fault or abort.' },
    { en: 'Program generated request', ru: 'программно-порождённый запрос', def: 'Interrupt request produced by executing an instruction (INT); synchronous with the program.' },
    { en: 'Asynchronous', ru: 'асинхронный', def: 'Not related in time to the instruction being executed; can arrive at any moment.' },
    { en: 'Synchronous', ru: 'синхронный', def: 'Caused by the program itself, at the same point every time it runs.' },
    { en: 'Trap', ru: 'ловушка', def: 'Exception at the end of an instruction to invoke an OS function (breakpoint, overflow); execution continues.' },
    { en: 'Fault', ru: 'восстановимый сбой (fault)', def: 'Recoverable error while an instruction executes (divide by zero, bogus instruction).' },
    { en: 'Abort', ru: 'аварийное прекращение', def: 'Unrecoverable error that produces a forced termination.' },
    { en: 'Page fault', ru: 'страничное прерывание', def: 'Exception used to replace a page in virtual memory; not an error (Intel vector 14).' },
    { en: 'Breakpoint', ru: 'точка останова', def: 'A debugger stop point; raises a trap (Intel vector 3).' },
    { en: 'More break lines', ru: 'несколько линий прерываний', def: 'Separate interrupt lines for devices; impractical alone, so combined with another method; makes priority simple.' },
    { en: 'Software poll', ru: 'программный опрос', def: 'On an interrupt, a routine asks every device who caused it; wastes time.' },
    { en: 'Vectorized hardware interrogation', ru: 'векторный аппаратный опрос', def: 'The CPU sends an acknowledgment; the device answers with an interrupt vector code pointing to its handler.' },
    { en: 'Acknowledgment', ru: 'подтверждение', def: 'A signal that confirms a request (ack).' },
    { en: 'Interrupt vector code', ru: 'код вектора прерывания', def: 'Number sent by the interrupting device; the CPU uses it as a pointer to the handling routine.' },
    { en: 'Interrupt priority', ru: 'приоритет прерываний', def: 'The order in which pending interrupts are served.' },
    { en: 'Nested interrupts', ru: 'вложенные прерывания', def: 'An interrupt that arrives while another interrupt is being handled (nested breaks).' },
    { en: 'Direct Memory Access', ru: 'прямой доступ к памяти', def: 'DMA: transfer between a device and memory performed by a DMA controller without the CPU.' },
    { en: 'DMA controller', ru: 'контроллер DMA', def: 'Processor specialized in moving data between I/O devices and main memory; one interrupt at the end.' },
    { en: 'Supervisory duties', ru: 'контролирующие функции', def: 'With DMA, the only CPU work: set up the transfer and handle the final interrupt.' },
    { en: 'Device driver', ru: 'драйвер устройства', def: 'OS module in kernel space that operates one type of controller and serves its interrupts.' },
    { en: 'Kernel space', ru: 'пространство ядра', def: 'Memory and privilege level where the kernel and the drivers run.' },
    { en: 'User space', ru: 'пространство пользователя', def: 'Memory and privilege level where user programs and libraries run.' },
    { en: 'Buffering', ru: 'буферизация', def: 'Holding the original data in RAM until they are processed or written to permanent storage.' },
    { en: 'Caching', ru: 'кэширование', def: 'Keeping a copy of repeatedly used data in fast memory for quick access.' },
    { en: 'Spooling', ru: 'спулинг', def: 'User-space mechanism: a printer daemon prints the files that users copy into a spool directory.' },
    { en: 'Spool directory', ru: 'каталог спулинга', def: 'Directory where users copy the files to be printed.' },
    { en: 'Printer daemon', ru: 'демон печати', def: 'Background user process that takes files from the spool directory and sends them to the printer.' },
    { en: 'System call', ru: 'системный вызов', def: 'Request from a program to the kernel (SC); libraries pass its parameters correctly.' }
  ],
  questions: [
    { id: 'io-01', type: 'multi', q: 'Along which three dimensions are I/O devices classified? (select all that apply)', options: ['Data transfer rate', 'Price', 'Physical size', 'Behavior', 'Counterparty (partner)'], answer: [0, 3, 4], explain: 'Behavior (input / output / storage), partner (human / machine) and data transfer rate. Price and size are not among the three dimensions on the slide.', section: 'heterogeneity', diff: 1 },
    { id: 'io-02', type: 'single', q: 'Which device in the slide table has the highest data transfer rate?', options: ['Magnetic disk (240–2560 Mb/s)', 'Network/LAN (100–1000 Mb/s)', 'Laser printer (3.2 Mb/s)', 'Graphic card (800–8000 Mb/s)'], answer: 3, explain: 'The graphic card reaches 8000 Mb/s; the keyboard is the slowest (0.0001 Mb/s). The magnetic disk is fast too, but stops at 2560 Mb/s.', section: 'heterogeneity', diff: 2 },
    { id: 'io-03', type: 'single', q: 'On the bus, an input operation is…', options: ['a write transaction: data from memory to the I/O device', 'a read transaction: data from memory to the CPU', 'a write transaction: data from the I/O device to memory', 'a read transaction: data from the I/O device to memory'], answer: 2, explain: 'Transaction names are given from the point of view of memory: input writes into memory (write transaction), output reads from memory (read transaction).', section: 'bus', diff: 3 },
    { id: 'io-04', type: 'single', q: 'What characterizes the processor-memory bus?', options: ['It is standardized, like USB or SCSI', 'Short and high speed, designed to maximize processor–memory bandwidth', 'Long and slow, with many different devices', 'An interconnect inside the chassis between other buses'], answer: 1, explain: 'The third option describes I/O buses, the fourth backplane buses. USB and SCSI are I/O bus standards.', section: 'bus', diff: 2 },
    { id: 'io-05', type: 'single', q: 'PCI, FireWire (IEEE 1394), USB and SCSI are standards for…', options: ['I/O buses', 'the processor-memory bus', 'backplane buses', 'DMA controllers'], answer: 0, explain: 'The "Bus types" slide lists them as I/O bus standards: longer, slower buses with a large variety of devices.', section: 'bus', diff: 1 },
    { id: 'io-06', type: 'multi', q: 'Which registers (I/O ports) does a device controller have? (select all that apply)', options: ['data-in', 'data-out', 'interrupt vector', 'status', 'control'], answer: [0, 1, 3, 4], explain: 'The four controller registers are status, control, data-in and data-out. The interrupt vector is a table in memory with the handler addresses, not a controller register.', section: 'devices', diff: 2 },
    { id: 'io-07', type: 'single', q: 'Which controller register stores the command to execute?', options: ['data-in', 'data-out', 'control', 'status'], answer: 2, explain: 'control holds the command; status holds the state (idle, busy, down…); data-in and data-out hold the data.', section: 'devices', diff: 1 },
    { id: 'io-08', type: 'multi', q: 'Which techniques for managing I/O devices are listed on the slides? (select all that apply)', options: ['Direct Memory Access', 'Swapping', 'Program controlled', 'Polling', 'I/O interrupt driven'], answer: [0, 2, 3, 4], explain: 'The four techniques are program controlled, polling, interrupt driven and DMA. Swapping belongs to memory management.', section: 'modes', diff: 1 },
    { id: 'io-09', type: 'code', q: 'Which I/O technique is implemented here, and what is the while loop called?', lang: 'c', code: '/* the CPU has written a command into the control register and started the controller */\nwhile (status_reg == BUSY)\n    ;                    /* do nothing */\ndata = data_in_reg;      /* the CPU copies the data itself */', options: ['Program controlled I/O; the loop is busy waiting', 'Interrupt-driven I/O; the loop is the interrupt handler', 'DMA; the loop is the block transfer of the DMA controller', 'Spooling; the loop is the printer daemon'], answer: 0, explain: 'The CPU keeps reading the status of one controller and then moves the data itself: program controlled I/O, and the waiting loop is busy waiting. Polling would also check other devices inside the loop.', section: 'programmed', diff: 2 },
    { id: 'io-10', type: 'tf', q: 'Program controlled I/O is a good choice for slow peripherals.', answer: false, explain: 'The opposite: with a slow peripheral the CPU is forced to work at the speed of the device, and its computing power is wasted in busy waiting.', section: 'programmed', diff: 2 },
    { id: 'io-11', type: 'single', q: 'What is the problem of polling with fast peripherals?', options: ['Devices cannot send interrupts', 'The DMA controller is overloaded', 'The work of the processor is almost exclusively the actual data transfer', 'The processor spends most of its time in busy waiting'], answer: 2, explain: 'With fast peripherals the CPU does almost nothing but move data. Spending most of the time in busy waiting is the problem with slow peripherals.', section: 'polling', diff: 3 },
    { id: 'io-12', type: 'single', q: 'In interrupt-driven I/O, when does the processor check the state of the interrupt line?', options: ['In the middle of each instruction', 'After the execution of each instruction', 'Every 10 ms, on a timer', 'Only during a system call'], answer: 1, explain: 'The slide: "the processor checks the state of the interrupt line after the execution of each instruction". An external interrupt never stops an instruction in the middle.', section: 'interrupt-io', diff: 1 },
    { id: 'io-13', type: 'single', q: 'What must the processor do before handling an interrupt?', options: ['Save the information needed to resume the current program from the point where it was interrupted', 'Flush the cache', 'Mask all interrupts permanently', 'Restart the controller'], answer: 0, explain: 'Without saving the state (program counter, registers) the interrupted program could not continue correctly after the handler returns.', section: 'interrupt-io', diff: 2 },
    { id: 'io-14', type: 'single', q: 'In the Intel interrupt vector table, what are vectors 32–255?', options: ['Non-maskable interrupts', 'Intel reserved, do not use', 'Page faults', 'Maskable interrupts'], answer: 3, explain: '0–18 are exceptions and special CPU events (divide error, page fault…), 19–31 are reserved by Intel, 32–255 are maskable interrupts used by devices.', section: 'interrupts', diff: 2 },
    { id: 'io-15', type: 'single', q: 'Which event corresponds to vector 0 in the Intel table?', options: ['breakpoint', 'general protection', 'divide error', 'page fault'], answer: 2, explain: '0 = divide error, 3 = breakpoint, 13 = general protection, 14 = page fault.', section: 'interrupts', diff: 2 },
    { id: 'io-16', type: 'single', q: 'How does the slide diagram "Interrupt-driven I/O" classify a page fault?', options: ['A non-maskable interrupt caused by a power failure', 'An internal interrupt (exception) that is not an error but a way to replace a page in virtual memory', 'An external I/O interrupt', 'A program-generated software interrupt raised with INT'], answer: 1, explain: 'It is under Internal Interrupts (Exceptions), with the note "Page Fault is not an error but a method to replace page in Virtual memory".', section: 'classification', diff: 3 },
    { id: 'io-17', type: 'single', q: 'Which statement is true for external interrupt requests?', options: ['They are asynchronous; the processor completes the current instruction and examines the requests before fetching the next one', 'They are synchronous and produced by the execution of instructions', 'They suspend an instruction in the middle', 'They suspend the instruction that caused the anomaly'], answer: 0, explain: 'Synchronous requests produced by instructions are program generated; suspending the faulty instruction is what exceptions do. An external interrupt cannot stop an instruction in the middle.', section: 'classification', diff: 2 },
    { id: 'io-18', type: 'tf', q: 'Program-generated (software) interrupts are produced by user programs with the INT instruction and are used for system calls.', answer: true, explain: 'From the diagram: generated by user programs using the INT instruction; useful for system calls and needed when writing device drivers.', section: 'classification', diff: 1 },
    { id: 'io-19', type: 'single', q: 'A recoverable error that occurs while an instruction is being executed (for example divide by zero) is a…', options: ['abort', 'non-maskable interrupt', 'fault', 'trap'], answer: 2, explain: 'A fault is recoverable. A trap happens at the end of an instruction to call the OS (breakpoint); an abort is unrecoverable.', section: 'exceptions', diff: 2 },
    { id: 'io-20', type: 'single', q: 'According to the slide classification, reaching a debugger breakpoint is a…', options: ['maskable external interrupt', 'trap', 'fault', 'abort'], answer: 1, explain: 'A trap occurs at the end of (or during) an instruction to invoke an OS functionality: debugger breakpoint, overflow.', section: 'exceptions', diff: 2 },
    { id: 'io-21', type: 'single', q: 'What causes a non-maskable external interrupt?', options: ['Catastrophic causes, such as the supply voltage dropping below a threshold', 'Ordinary I/O interfaces', 'The INT instruction in a program', 'The end of a DMA transfer'], answer: 0, explain: 'Non-maskable interrupts are reserved for catastrophes and have a single recovery routine. Ordinary I/O interfaces (including the end of a DMA transfer) raise maskable interrupts served by drivers.', section: 'service-routines', diff: 2 },
    { id: 'io-22', type: 'single', q: 'With vectorized hardware interrogation, how does the processor learn which device interrupted?', options: ['It runs a routine that polls all devices', 'Each device has its own separate interrupt line', 'It reads a device-status table', 'It sends an acknowledgment; the device answers with an interrupt vector code that points to the handling routine'], answer: 3, explain: 'Polling all devices is the software poll (it wastes time); one line per device is the "more break lines" mechanism. Vectorized interrogation uses one common line plus ack → vector code.', section: 'identify', diff: 3 },
    { id: 'io-23', type: 'single', q: 'What is the disadvantage of a software poll for finding the source of an interrupt?', options: ['Priorities are impossible', 'It requires a DMA controller', 'Waste of time', 'It needs many bus lines'], answer: 2, explain: 'The processor loses time asking every device. Needing many bus lines is the problem of the "more break lines" mechanism.', section: 'identify', diff: 2 },
    { id: 'io-24', type: 'multi', q: 'What does the processor send to the DMA controller for an I/O request? (select all that apply)', options: ['The I/O device', 'The memory address where reading/writing starts', 'The number of bytes', 'The data itself, byte by byte', 'The type of operation'], answer: [0, 1, 2, 4], explain: 'Type of operation, device, start address and byte count. The data are moved by the DMA controller without the processor — that is the whole point of DMA.', section: 'dma', diff: 2 },
    { id: 'io-25', type: 'single', q: 'What is the correct order of operations during a DMA transfer (as in the figure)?', options: ['CPU programs the DMA controller → DMA requests the transfer → data transferred → Ack → interrupt when done', 'DMA requests the transfer → CPU programs the DMA controller → Ack → data transferred → interrupt', 'CPU programs the DMA controller → interrupt → data transferred → Ack', 'Data transferred → CPU programs the DMA controller → Ack → interrupt'], answer: 0, explain: 'Steps 1–4 of the figure, then a single "interrupt when done" from the DMA controller to the CPU. The interrupt always comes last.', section: 'dma', diff: 3 },
    { id: 'io-26', type: 'single', q: 'According to the "Device Drivers" diagram, where do device drivers run?', options: ['In user space', 'In the controller hardware', 'In the spool directory', 'In kernel space'], answer: 3, explain: 'The user program is in user space; the rest of the OS and the drivers are in kernel space; the controllers are hardware.', section: 'drivers', diff: 1 },
    { id: 'io-27', type: 'single', q: 'Which statement about buffering and caching is true?', options: ['A buffer is in the processor; a cache is only on disk', 'A buffer speeds up repeated access to frequently used data', 'A buffer holds the original data until they are processed; a cache holds a copy for fast repeated access', 'A buffer holds a copy; a cache holds the original'], answer: 2, explain: 'From the slide table: buffer = original data, in RAM, until processed; cache = copy of the data, in the processor (also RAM and disk), for repeated access.', section: 'buffering', diff: 2 },
    { id: 'io-28', type: 'code', q: 'Where is the formatting ("%d" → "42") done before the output?', lang: 'c', code: '#include <stdio.h>\nint main(void)\n{\n    int x = 42;\n    printf("x = %d\\n", x);\n    return 0;\n}', options: ['In the kernel interrupt handler', 'In the user-space stdio library, which then makes a system call', 'In the terminal device driver', 'In the display controller'], answer: 1, explain: 'User-space I/O software: libraries such as stdio do the formatting (printf) and pass the parameters to the system calls correctly.', section: 'user-io', diff: 2 },
    { id: 'io-29', type: 'single', q: 'According to the "User space I/O software" slide, what does spooling consist of?', options: ['A user process (printer daemon) and a spool directory where the user copies the file to be printed', 'The printer device driver in kernel space', 'A DMA controller and the controller buffer', 'The interrupt vector and its handler'], answer: 0, explain: 'Spooling runs in user space: a printer daemon process plus a spool directory.', section: 'user-io', diff: 2 },
    { id: 'io-30', type: 'single', q: 'With DMA, how many interrupts does the CPU receive for the transfer of one block?', options: ['One, when the whole transfer is done', 'One for every byte', 'One for every word', 'None: the CPU must poll the DMA controller'], answer: 0, explain: 'The DMA controller moves the whole block by itself and signals the completion with a single interrupt. One interrupt per word is the cost of interrupt-driven I/O without DMA.', section: 'dma', diff: 1 },
    { id: 'io-31', type: 'single', q: 'What does the interrupt vector contain?', options: ['The memory addresses of the interrupt handling routines', 'The saved registers of the interrupted program', 'The list of processes waiting for I/O', 'The status registers of all controllers'], answer: 0, explain: 'The interrupt vector is a table indexed by interrupt number; each entry is the address of a specialized handler, so the CPU can jump to it without searching.', section: 'interrupts', diff: 1 },
    { id: 'io-32', type: 'single', q: 'On the ladder program controlled → polling → interrupt driven → DMA, which technique is the first to eliminate busy waiting?', options: ['Polling', 'Interrupt driven', 'DMA', 'Program controlled'], answer: 1, explain: 'Polling still busy-waits (it only checks other devices during the loop). With interrupts the CPU keeps computing and the device signals when it is ready; DMA then also removes the copying.', section: 'modes', diff: 2 },
    { id: 'io-33', type: 'single', q: 'In the computer organization shown on the slide, how is a disk connected to the memory – I/O bus?', options: ['Through an I/O controller', 'Directly, like main memory', 'Through the processor cache', 'Through the interrupt lines'], answer: 0, explain: 'Every device sits behind an I/O controller attached to the bus. The interrupt lines only carry signals from the controllers to the processor; they do not carry data.', section: 'organization', diff: 1 }
  ]
});
