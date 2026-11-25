OS.addModule({
  id: 'devices',
  num: 15,
  group: 'lab',
  title: 'Device Management in Linux',
  titleRu: 'Управление устройствами в Linux',
  icon: '🔌',
  sources: ['ES5-Device Management in Linux.pdf'],
  summary: 'The I/O and storage theory seen in a real Linux system: the layers of Linux, "everything is a file", basic I/O calls, character / block / network devices, /dev and special devices, major and minor numbers, /proc, mounting, loadable kernel modules, udev and hotplug.',
  bridge: 'The Bash module taught you to work in the Linux shell. Here we use the shell to see the I/O and storage theory of modules 8 and 9 in a real system: where the drivers live, how a disk appears as /dev/sda, how its partitions are mounted, and how a USB stick gets its driver automatically.',
  intro: `
<p>The I/O module ended with device drivers: kernel code that hides each controller behind a standard interface. Linux takes this idea one step further: <b>every device looks like a file</b>. A program that can open, read and write a file can also talk to a terminal, a printer or a disk, with the same system calls.</p>
<p>The module follows that idea from top to bottom. First we place the drivers in the layers of a Linux system and see the file interface they offer. Then we meet the three classes of devices (character, block, network) and how they appear in <code>/dev</code>, where <b>major and minor numbers</b> tell the kernel which driver to use. Next we see how block devices become part of the directory tree (<b>mount</b>). Finally we see where drivers come from at run time: <b>loadable kernel modules</b>, loaded automatically by <b>udev</b> when you plug in a device (<b>hotplug</b>).</p>`,
  sections: [
    {
      id: 'layers',
      h: 'The layers of a Linux system',
      why: 'where the drivers live',
      lead: 'Before touching devices, locate them in the system. Where do drivers run, and how does a user program reach them?',
      html: `
<p>The slide shows a Linux (UNIX) system as five layers. Each layer talks only to its neighbors, through an <b>interface</b>. Read the table from the top (the person) to the bottom (the hardware):</p>
<table class="t">
  <tr><th>Layer</th><th>Contents</th><th>Interface above it</th><th>Mode</th></tr>
  <tr><td>Users</td><td>the people using the system</td><td><b>user interface</b></td><td rowspan="3">user mode</td></tr>
  <tr><td>Standard utility programs</td><td>shell, editors, compilers…</td><td><b>library interface</b></td></tr>
  <tr><td>Standard library</td><td>open, close, read, write, fork…</td><td><b>system call interface</b></td></tr>
  <tr><td>UNIX operating system</td><td>process management, memory management, file system, <b>I/O</b>…</td><td>—</td><td>kernel mode</td></tr>
  <tr><td>Hardware</td><td>CPU, memory, disks, terminals…</td><td>—</td><td>—</td></tr>
</table>
<p>Three facts follow from this picture:</p>
<ul>
  <li>Users, utilities and the standard library run in <b>user mode</b>; only the operating system runs in <b>kernel mode</b>, with full access to the hardware.</li>
  <li>The only door from user mode into the kernel is the <b>system call interface</b>. Library functions such as <code>read</code> and <code>write</code> are thin wrappers around the system calls with the same names.</li>
  <li>Linux has a <b>monolithic kernel</b>: process management, memory management, the file system and I/O — including all the <b>device drivers</b> — run together inside one kernel, in kernel mode.</li>
</ul>
<div data-viz="0"></div>
<div class="callout key">So a user program can never call a driver directly. It must go through a system call — and, as the next section shows, Linux makes those system calls the same ones used for ordinary files.</div>`,
      viz: [{ name: 'layers', caption: 'The layers of Linux (I/O is part of the monolithic kernel).', props: { pyramid: true, top: 'user mode', bottom: 'kernel mode → hardware', layers: [
        { label: 'Users', sub: '↓ user interface', tone: 'muted' },
        { label: 'Standard utility programs', sub: 'shell, editors, compilers · ↓ library interface', tone: 'ok' },
        { label: 'Standard library', sub: 'open, close, read, write, fork · ↓ system call interface', tone: 'acc' },
        { label: 'UNIX operating system (monolithic kernel)', sub: 'process mgmt, memory mgmt, file system, I/O', tone: 'warn' },
        { label: 'Hardware', sub: 'CPU, memory, disks, terminals', tone: 'muted' }] } }],
      takeaway: 'Users → (user interface) → utilities → (library interface) → standard library → (system call interface) → kernel → hardware. Linux has a monolithic kernel: the drivers run inside it, in kernel mode, and user programs reach them only through system calls.',
      exam: 'The order of the layers and the interfaces between them; which layer runs in kernel mode.'
    },
    {
      id: 'file-oriented',
      h: 'File-oriented approach: everything is a file',
      why: 'one interface for all devices',
      lead: 'Drivers are inside the kernel, out of reach of user processes. Linux gives processes a way in that they already know: files.',
      html: `
<p>Device drivers run as part of the kernel and are <b>not directly accessible</b> to user processes. However, Linux provides a mechanism by which processes can communicate with a device driver — and through it with a hardware device — via <b>file-like objects</b>. These objects appear in the file system, and programs can open them, read from them and write to them practically as if they were normal files. Such an object is called a <b>device file</b> (or <b>device node</b>).</p>
<p><b>Linux I/O.</b> The rule is general:</p>
<ul>
  <li><b>All I/O devices are represented as files.</b> The <code>/dev</code> directory is where all the device files of the system are loaded, for example <code>/dev/sda2</code> (a disk partition, e.g. the one used for <code>/usr</code>) and <code>/dev/tty2</code> (a terminal).</li>
  <li>This elegant mapping of files to devices allows the kernel to export one simple interface, called <b>Unix I/O</b>.</li>
  <li>The important idea: <b>all input and output is handled in a consistent and uniform way</b>.</li>
</ul>
<p>The path of a request is therefore: the process calls <code>open</code> / <code>read</code> / <code>write</code> on a <code>/dev</code> file → the kernel sees that the file is a device and passes the call to the right driver → the driver commands the hardware.</p>
<div data-viz="0"></div>
<p>The benefit is large: tools written for files work on devices without any change. For example, <code>cat</code> can send a file to a printer, as the "/dev directory" section shows.</p>`,
      viz: [{ name: 'flow', caption: 'The path of a request from a process to a device.', props: { dir: 'h', steps: [
        { label: 'User process', sub: 'open/read/write' },
        { label: '/dev/… file', sub: 'file-like object', tone: 'acc' },
        { label: 'Device driver', sub: 'part of the kernel', tone: 'warn' },
        { label: 'Hardware device', tone: 'muted' }] } }],
      takeaway: 'Drivers are kernel code; processes reach them through device files in /dev, with the normal file operations. This uniform interface is Unix I/O: all input and output is handled in the same way.'
    },
    {
      id: 'io-ops',
      h: 'Basic Linux I/O operations',
      why: 'the few calls that do all I/O',
      lead: 'If every device is a file, then a handful of file system calls is enough for all I/O. Here they are.',
      html: `
<p>Unix I/O has only a few basic operations. The table pairs each operation with its system calls:</p>
<table class="t">
  <tr><th>Operation</th><th>System calls</th></tr>
  <tr><td>Opening and closing files</td><td><code>open()</code>, <code>close()</code></td></tr>
  <tr><td>Reading and writing a file</td><td><code>read()</code>, <code>write()</code></td></tr>
  <tr><td>Changing the <b>current file position</b> (seek)</td><td><code>lseek()</code></td></tr>
</table>
<p>The idea that needs an explanation is the <b>current file position</b>. For each open file the kernel keeps an offset: the position (in bytes from the start) where the next <code>read</code> or <code>write</code> will begin. A file is a sequence of bytes B<sub>0</sub>, B<sub>1</sub>, …, B<sub>k−1</sub>, B<sub>k</sub>, B<sub>k+1</sub>, …; if the current file position is <b>k</b>, the next operation starts at byte B<sub>k</sub>.</p>
<ul>
  <li><code>read</code> and <code>write</code> move the position forward by the number of bytes transferred, so consecutive reads return consecutive parts of the file.</li>
  <li><code>lseek()</code> sets the position explicitly, to jump to any byte (a "seek").</li>
</ul>
<p>A typical program uses the calls in this order (<code>open</code> returns a <b>file descriptor</b>, a small number that the other calls use to name the open file):</p>
<div data-viz="0"></div>
<p>Notice that jumping with <code>lseek</code> makes sense mainly for devices that allow random access, such as disks. That difference between devices is the topic of the next section.</p>`,
      viz: [{ name: 'flow', caption: 'A typical sequence of calls.', props: { dir: 'h', steps: [
        { label: 'open()', sub: 'get a file descriptor (fd)', tone: 'acc' },
        { label: 'read() / write()', sub: 'the position moves forward' },
        { label: 'lseek()', sub: 'set position = k', tone: 'warn' },
        { label: 'read() / write()', sub: 'from byte B_k' },
        { label: 'close()', tone: 'ok' }] } }],
      takeaway: 'open/close, read/write and lseek are the basic Unix I/O calls. The current file position is the offset where the next read or write starts; read and write advance it, lseek sets it.',
      exam: 'Which call changes the current file position (lseek); what the current file position means.'
    },
    {
      id: 'classes',
      h: 'Classes of devices: character, block, network',
      why: 'three kinds of device behavior',
      lead: 'Not all devices behave alike: a disk lets you jump to any block, a keyboard gives you a stream of characters, a network card sends packets. Linux groups devices into three classes.',
      html: `
<p>Linux divides devices (and their driver modules) into three classes. Each class offers a different <b>abstraction</b> — a simplified model of what the device is:</p>
<ul>
  <li><b>Character devices</b> — a stream of bytes;</li>
  <li><b>Block devices</b> — an array of fixed-size blocks;</li>
  <li><b>Network devices</b> — a source and destination of packets.</li>
</ul>
<p>The table compares them on the points that matter in practice. The rows to remember are the abstraction, the buffering and the "in /dev" row:</p>
<table class="t">
  <tr><th></th><th>Block devices</th><th>Character devices</th><th>Network devices</th></tr>
  <tr><td>Abstraction</td><td><b>array of fixed-size blocks</b></td><td><b>stream of bytes</b></td><td><b>packets</b></td></tr>
  <tr><td>Access</td><td>random access, in any order</td><td>sequential, character by character</td><td>send / receive packets</td></tr>
  <tr><td>Buffering</td><td><b>buffered I/O</b>: data collected in a buffer until a full block</td><td><b>unbuffered</b> (raw) transfer</td><td>—</td></tr>
  <tr><td>File system</td><td>can host a file system</td><td>no</td><td>no</td></tr>
  <tr><td>In /dev</td><td>yes (<code>b</code>)</td><td>yes (<code>c</code>)</td><td><b>no</b> — unique names (<code>eth0</code>)</td></tr>
  <tr><td>Examples</td><td>disks, partitions, CD-ROM</td><td>console, serial and parallel ports, terminals, sound card</td><td>eth0</td></tr>
</table>
<p>The pattern: block devices are the storage devices of module 9 (random access, they hold file systems); character devices are the slow, sequential devices; network devices are so different that they are not even files. The next three sections look at each class.</p>`,
      takeaway: 'Block devices: array of fixed-size blocks, random access, buffered I/O, can host a file system (disks). Character devices: stream of bytes, sequential, unbuffered (terminals, ports). Network devices: packets, named like eth0, not in /dev.',
      exam: 'The three classes and the abstraction of each; which class does buffered I/O; network devices are not in /dev.'
    },
    {
      id: 'block',
      h: 'Block devices and disk partitions',
      why: 'how disks look in Linux',
      lead: 'Block devices are the disks of the storage module, seen from Linux. What can a program do with them, and how are disks and partitions named?',
      html: `
<p><b>Block devices</b> are nonvolatile mass-storage devices whose information can be accessed <b>in any order</b> (random access). Example: a disk drive. Their properties:</p>
<ul>
  <li>Abstraction: an <b>array of fixed-size blocks</b>; the device provides random access to the data stored on it.</li>
  <li>Applications can still access a block device <b>in bytes</b>: unlike character devices, block devices always allow the programmer to read or write a block of <b>any size</b>, including single characters/bytes. The kernel turns this into whole-block transfers.</li>
  <li>Block and character devices <b>differ only at the kernel level</b>: for the program both are just files.</li>
  <li>A block device can <b>host a file system</b>.</li>
  <li>Block devices do <b>buffered I/O</b>: the data are collected in a buffer until a full block can be transferred — the buffering idea of the I/O module.</li>
</ul>
<p><b>Some common block devices.</b> Each device file has a name and two numbers, major and minor (explained in the "Device numbers" section). Look at the names first: <code>hd</code> = IDE disk, <code>sd</code> = SCSI disk (modern Linux also uses <code>sd</code> names for SATA and USB disks), the letter = which disk, the digit = which partition.</p>
<table class="t">
  <tr><th>Device</th><th>File</th><th>Major</th><th>Minor</th></tr>
  <tr><td>Primary IDE controller, master device</td><td><code>/dev/hda</code></td><td>3</td><td>0</td></tr>
  <tr><td>Primary IDE controller, master device, first partition</td><td><code>/dev/hda1</code></td><td>3</td><td>1</td></tr>
  <tr><td>Primary IDE controller, secondary device</td><td><code>/dev/hdb</code></td><td>3</td><td>64</td></tr>
  <tr><td>Primary IDE controller, secondary device, first partition</td><td><code>/dev/hdb1</code></td><td>3</td><td>65</td></tr>
  <tr><td>Secondary IDE controller, master / secondary device</td><td><code>/dev/hdc</code>, <code>/dev/hdd</code></td><td>22</td><td>0, 64</td></tr>
  <tr><td>First SCSI drive</td><td><code>/dev/sda</code></td><td>8</td><td>0</td></tr>
  <tr><td>First SCSI drive, first partition</td><td><code>/dev/sda1</code></td><td>8</td><td>1</td></tr>
  <tr><td>Second SCSI disk</td><td><code>/dev/sdb</code></td><td>8</td><td>16</td></tr>
  <tr><td>Second SCSI disk, first partition</td><td><code>/dev/sdb1</code></td><td>8</td><td>17</td></tr>
  <tr><td>First / second SCSI CD-ROM drive</td><td><code>/dev/scd0</code>, <code>/dev/scd1</code></td><td>11</td><td>0, 1</td></tr>
</table>
<p>Notice the pattern in the numbers: all SCSI disks share major 8, and the minor encodes the disk and the partition (sda = 0, sda1 = 1, sdb = 16, sdb1 = 17).</p>
<p><b>Disk devices.</b> A hard disk is divided into partitions; each partition is addressed by its own device node, and each partition holds a file system that is mounted on a directory. The slide figure shows three layers — physical, partition and file system:</p>
<div data-viz="0"></div>
<p>(The slide text speaks of "four partitions", but its figure shows three partitions on two disks: <code>/dev/sda1</code> and <code>/dev/sda2</code> on the first disk, <code>/dev/sdb1</code> on the second.)</p>`,
      viz: [{ name: 'graph', caption: 'Physical layer → partition layer → file system layer (slide "Disk Devices").', props: { w: 600, h: 300, nodes: [
        { id: 'd1', label: 'Hard disk 1', sub: '/dev/sda', x: 170, y: 255, w: 220, tone: 'muted' },
        { id: 'd2', label: 'Hard disk 2', sub: '/dev/sdb', x: 470, y: 255, w: 140, tone: 'muted' },
        { id: 'p1', label: '/dev/sda1', x: 105, y: 150, tone: 'acc' },
        { id: 'p2', label: '/dev/sda2', x: 235, y: 150, tone: 'acc' },
        { id: 'p3', label: '/dev/sdb1', x: 470, y: 150, tone: 'acc' },
        { id: 'f1', label: '/home', x: 105, y: 45, tone: 'ok' },
        { id: 'f2', label: '/opt', x: 235, y: 45, tone: 'ok' },
        { id: 'f3', label: '/spare', x: 470, y: 45, tone: 'ok' }],
        edges: [{ from: 'd1', to: 'p1' }, { from: 'd1', to: 'p2' }, { from: 'd2', to: 'p3' },
          { from: 'p1', to: 'f1', label: 'mount' }, { from: 'p2', to: 'f2', label: 'mount' }, { from: 'p3', to: 'f3', label: 'mount' }] } }],
      takeaway: 'Block devices: random access, fixed-size blocks, buffered I/O, can host a file system; programs may still read or write any number of bytes. Disks and partitions are device nodes (sda, sda1, sdb1…), and the file system of each partition is mounted on a directory.',
      exam: 'Properties of block devices (random access, buffered, file system); decode sda / sda1 / sdb1 and their major / minor numbers.'
    },
    {
      id: 'char',
      h: 'Character devices and terminals',
      why: 'devices that are byte streams',
      lead: 'Character devices are the other big class: devices that deliver data one character after another, with no blocks and no random access.',
      html: `
<p><b>Character device</b> files are associated with <b>character</b> or <b>raw</b> device access (raw = directly, without the block buffering of the kernel). Examples: the text console (<code>/dev/console</code>), serial ports (<code>/dev/ttyS0</code>), parallel ports (<code>/dev/lp0</code>)…</p>
<ul>
  <li>Abstraction: a <b>stream of bytes</b>.</li>
  <li>They are used for <b>unbuffered</b> data transfers to and from a device: rather than in blocks, the data are transferred <b>character by character</b>. One transfer can consist of multiple characters.</li>
</ul>
<p><b>Some common character devices</b>, with their major and minor numbers:</p>
<table class="t">
  <tr><th>Device</th><th>File</th><th>Major</th><th>Minor</th></tr>
  <tr><td>Parallel port 0 / 1</td><td><code>/dev/lp0</code> (<code>/dev/par0</code>), <code>/dev/lp1</code></td><td>6</td><td>0, 1</td></tr>
  <tr><td>First / second serial port</td><td><code>/dev/ttyS0</code>, <code>/dev/ttyS1</code></td><td>4</td><td>64, 65</td></tr>
  <tr><td>IDE tape drive</td><td><code>/dev/ht0</code></td><td>37</td><td>0</td></tr>
  <tr><td>First / second SCSI tape drive</td><td><code>/dev/st0</code>, <code>/dev/st1</code></td><td>9</td><td>0, 1</td></tr>
  <tr><td>System console</td><td><code>/dev/console</code></td><td>5</td><td>1</td></tr>
  <tr><td>First / second virtual terminal</td><td><code>/dev/tty1</code>, <code>/dev/tty2</code></td><td>4</td><td>1, 2</td></tr>
  <tr><td>Current terminal device of the process</td><td><code>/dev/tty</code></td><td>5</td><td>0</td></tr>
  <tr><td>Sound card</td><td><code>/dev/audio</code></td><td>14</td><td>4</td></tr>
</table>
<p>All of them are devices that produce or consume data in order, one character after another — you cannot "jump" to byte 1000 of a keyboard.</p>
<p><b>Terminals.</b> Terminals are the most familiar character devices. Linux has three related names:</p>
<ul>
  <li>a <b>tty</b> is a native terminal device; its backend is either hardware or emulated by the kernel (for example the virtual terminals <code>/dev/tty1</code>, <code>/dev/tty2</code>);</li>
  <li>a <b>pty</b> (<b>pseudo terminal</b> device) is a terminal device emulated by another program, for example <b>xterm</b>, <b>screen</b> or <b>ssh</b>;</li>
  <li>a <b>pts</b> is the <b>slave</b> part of a pty — the end that the shell sees as its terminal (files <code>/dev/pts/0</code>, <code>/dev/pts/1</code>, …).</li>
</ul>
<p>So when you open a terminal window or log in with ssh, your shell talks to a pts, not to real hardware.</p>`,
      takeaway: 'Character devices: a stream of bytes, unbuffered, character by character (console, serial and parallel ports, terminals, sound card). tty = native terminal; pty = pseudo terminal emulated by a program (xterm, screen, ssh); pts = slave part of a pty.',
      exam: 'Character device = stream of bytes, unbuffered; tty vs pty vs pts.'
    },
    {
      id: 'network',
      h: 'Network devices',
      why: 'packets, not files',
      lead: 'The third class breaks the "everything is a file" rule. Network devices work with packets, and they do not appear in /dev at all.',
      html: `
<p><b>Network devices</b> do not read and write bytes; they <b>send and receive packets</b>:</p>
<ul>
  <li>each call to write would send one packet, and each call to read would receive one packet;</li>
  <li>if the buffer is too small for the packet to fit, the packet would be <b>lost</b> — unlike a byte stream, the rest is not kept for the next read.</li>
</ul>
<p>Network devices have <b>unique names</b> (for example <code>eth0</code>, the first Ethernet interface) and are <b>not in the /dev file system</b>.</p>
<p>Why the exception? Network applications are more complex than file-accessing applications. Most data exchanges are done with calls similar to read and write, but <b>establishing the connection</b> requires more information than just a file name: an address, a port, a protocol. That is why programs use <b>sockets</b> (a special file type, see the next section) instead of opening a device file.</p>`,
      takeaway: 'Network devices send and receive whole packets (a read buffer that is too small loses the packet), have unique names such as eth0 and are not in /dev, because a connection needs more information than a file name.',
      exam: 'Packets instead of bytes; names like eth0; not in /dev; what happens if the buffer is too small.'
    },
    {
      id: 'filetypes',
      h: 'Linux file types',
      why: 'how ls -l shows each kind of file',
      lead: 'Device files are one of several special kinds of file. ls -l shows the kind in the first character of each line, so you can recognize a device at a glance.',
      html: `
<p>Linux knows seven file types. The table gives each one with the character that <code>ls -l</code> prints at the start of the permission string:</p>
<table class="t">
  <tr><th>Type</th><th>Character in ls -l</th><th>Description</th></tr>
  <tr><td><b>Regular file</b></td><td><code>-</code></td><td>a file with user / application data (binary, text, anything); the OS knows nothing about its format other than "sequence of bytes", akin to main memory</td></tr>
  <tr><td><b>Directory file</b></td><td><code>d</code></td><td>a file that contains the names and locations of other files</td></tr>
  <tr><td><b>Character special file</b></td><td><code>c</code></td><td>a character device, e.g. a <b>terminal</b></td></tr>
  <tr><td><b>Block special file</b></td><td><code>b</code></td><td>a block device, e.g. a <b>disk</b></td></tr>
  <tr><td><b>FIFO (named pipe)</b></td><td><code>p</code></td><td>a file type used for inter-process communication</td></tr>
  <tr><td><b>Symbolic link</b></td><td><code>l</code></td><td>a file that points to another file</td></tr>
  <tr><td><b>Socket</b></td><td><code>s</code></td><td>a file type used for network communication between processes</td></tr>
</table>
<p>For this module the important rows are <code>c</code> and <code>b</code>: <b>terminals</b> are <b>character special</b> files and <b>disks</b> are <b>block special</b> files. The next section reads real <code>ls -l</code> lines from <code>/dev</code>.</p>`,
      takeaway: 'Type characters in ls -l: - regular, d directory, c character special (terminals), b block special (disks), p FIFO / named pipe (IPC), l symbolic link, s socket (network communication between processes).',
      exam: 'The type character in ls -l: - d c b p l s; a terminal is c, a disk is b.'
    },
    {
      id: 'dev-dir',
      h: 'The /dev directory, direct access and special devices',
      why: 'using device files in practice',
      lead: 'Now we can read /dev with ls -l and use device files directly, from the shell and from C.',
      html: `
<p><code>/dev</code> contains the full set of character and block device entries for the devices Linux knows about. The <code>ls -l</code> line of a device file looks almost like that of a normal file:</p>
<pre class="code" data-lang="bash"># ls -lh /dev/
brw-r-----  1 root disk   8,   1 Apr 10  2006 /dev/sda1
crw-rw----  1 root tty    5,  12 Apr 10  2006 /dev/tty2</pre>
<p>Two differences tell you that it is a device:</p>
<ul>
  <li>The <b>first character</b> is <code>b</code> (block device — here the partition <code>sda1</code>) or <code>c</code> (character device — here the terminal <code>tty2</code>).</li>
  <li>Where a normal file shows its <b>size</b>, a device file shows two numbers, <b>major, minor</b> (<code>8, 1</code> and <code>5, 12</code>). A device file has no content of its own: it is only a door to a driver.</li>
</ul>
<p><b>Direct access to character devices.</b> Because devices are files, you can write data directly to a character device with ordinary tools:</p>
<pre class="code" data-lang="bash">% cat document.txt &gt; /dev/lp0                      # to the printer (parallel port)
% cat /usr/share/sndconfig/sample.au &gt; /dev/audio   # to the sound card</pre>
<p>The same thing from a C program uses exactly the calls of the "Basic Linux I/O operations" section:</p>
<pre class="code" data-lang="c">int fd = open("/dev/lp0", O_WRONLY);
write(fd, buffer, buffer_length);
close(fd);</pre>
<p><b>Special devices.</b> Some device files have no hardware behind them at all: the kernel driver simply implements a useful behavior. The two most common ones:</p>
<table class="t">
  <tr><th>Device</th><th>Behavior</th></tr>
  <tr><td><code>/dev/null</code></td><td>Linux <b>discards</b> any data written to it. A common trick is to use it as the output file when the output is unwanted. <b>Reading</b> from /dev/null always gives an <b>end-of-file</b>.</td></tr>
  <tr><td><code>/dev/zero</code></td><td>behaves as if it were an <b>infinitely long file filled with 0 bytes</b>: however much data you try to read, Linux "generates" enough zero bytes.</td></tr>
</table>
<pre class="code" data-lang="bash">% cp /dev/null empty-file      # reading gives EOF at once → empty file
% ls -l empty-file             # size 0
% hexdump /dev/zero
0x000000: 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
0x000010: 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
...</pre>
<p>Typical uses: <code>command &gt; /dev/null</code> throws away unwanted output; reading from <code>/dev/zero</code> gives as many zero bytes as you want, for example to fill a file with zeros.</p>`,
      takeaway: 'In ls -l, device files start with b or c and show "major, minor" instead of a size. You can write to a character device directly (cat file > /dev/lp0, or open / write / close in C). /dev/null discards what is written and gives EOF on read; /dev/zero gives an endless stream of zero bytes.',
      exam: 'Decode an ls -l line from /dev (b/c, major, minor); what writing to /dev/null and reading from /dev/null and /dev/zero do.'
    },
    {
      id: 'numbers',
      h: 'Device numbers and /proc',
      why: 'how the kernel finds the driver',
      lead: 'A device file is only a name in /dev. When a program opens it, how does the kernel know which driver to call and which device to drive? The answer is the pair of device numbers.',
      html: `
<p>Linux identifies a device with <b>two numbers</b>, which you can see with <code># ls -l /dev</code>:</p>
<table class="t">
  <tr><th>Number</th><th>Meaning</th></tr>
  <tr><td><b>major device number</b></td><td>specifies <b>which driver</b> the device corresponds to</td></tr>
  <tr><td><b>minor device number</b></td><td>distinguishes the <b>individual devices or components</b> controlled by a single driver</td></tr>
</table>
<p>So opening a device file works like this: the kernel reads the major number and calls that driver; the driver reads the minor number to know which of its devices is meant. The SCSI disk example makes the pattern clear:</p>
<div class="formula">/dev/sda = 8,0 · /dev/sda1 = 8,1 · /dev/sdb = 8,16 · /dev/sdb1 = 8,17 → one driver (major 8), different disks and partitions (minor)</div>
<p>In these numbers each SCSI disk gets a range of 16 minors: sda uses 0–15, sdb 16–31. That is why <code>sdb1</code> has minor 16 + 1 = 17.</p>
<p><b>The /proc file system.</b> How can we see which drivers are configured? The <b>proc file system</b> (<code>/proc</code>) contains a hierarchy of special files that represent the <b>current state of the kernel</b>. They are not stored on any disk; the kernel generates their content when you read them.</p>
<ul>
  <li><code># cat /proc/devices</code> displays the character and block devices currently configured (not including devices whose modules are not loaded). The <b>major number and the name</b> of each device appear here.</li>
  <li><code># cat /proc/diskstats</code> displays the <b>I/O statistics of block devices</b>.</li>
</ul>
<pre class="code" data-lang="text">debian@debian:~$ cat /proc/diskstats
 254       0 vda 14319 5110 1276898 9489 2023 1400 287761 4558 0 9532 14173 ...
 254       1 vda1 185 254 11400 122 1 0 1 0 0 160 122 ...</pre>
<p>Each line describes one block device. The table gives the meaning of the 14 fields; notice that the first three fields are exactly the major number, minor number and name we have just seen (254, 0, vda):</p>
<table class="t">
  <tr><th>#</th><th>Field</th><th>#</th><th>Field</th></tr>
  <tr><td>1</td><td>major number</td><td>8</td><td>writes completed</td></tr>
  <tr><td>2</td><td>minor number</td><td>9</td><td>writes merged</td></tr>
  <tr><td>3</td><td>device name</td><td>10</td><td>sectors written</td></tr>
  <tr><td>4</td><td>reads completed successfully</td><td>11</td><td>time spent writing (ms)</td></tr>
  <tr><td>5</td><td><b>reads merged</b> — read requests that were merged together in the queue scheduler before being sent to the physical device</td><td>12</td><td>I/Os currently in progress</td></tr>
  <tr><td>6</td><td>sectors read</td><td>13</td><td>time spent doing I/Os (ms)</td></tr>
  <tr><td>7</td><td>time spent reading (ms)</td><td>14</td><td>weighted time spent doing I/Os (ms)</td></tr>
</table>
<p>Field 5 connects to the disk scheduling of module 9: before sending requests to the physical device, the kernel <b>queue scheduler</b> merges adjacent read requests into one larger request, so the disk receives fewer operations.</p>`,
      takeaway: 'Major number = which driver; minor number = which device or partition of that driver (sda 8,0; sda1 8,1; sdb 8,16; sdb1 8,17). /proc shows the live state of the kernel: /proc/devices lists the major numbers and names of the configured devices, /proc/diskstats the I/O statistics of block devices.',
      exam: 'Major = driver, minor = specific device; where to see the major numbers (/proc/devices); what /proc/diskstats shows.'
    },
    {
      id: 'mount',
      h: 'Disks, file systems and mounting',
      why: 'attach a disk to the directory tree',
      lead: 'A disk partition is a block device file, but users want folders and files, not raw blocks. Mounting connects the file system on a block device to the single Linux directory tree.',
      html: `
<p><b>Key concepts</b> from the slides:</p>
<ul>
  <li>Linux allows <b>low-level access</b> to disk drives through device nodes in the <code>/dev</code> directory.</li>
  <li>Usually, however, disks are <b>formatted</b> with a file system and <b>mounted</b> to a directory instead.</li>
  <li>The <b>mount</b> command maps the root directory of the file system of a disk (or of a disk partition) to an <b>already existing</b> directory. That directory is then called a <b>mount point</b>.</li>
  <li>The <b>umount</b> command unmounts a file system from a mount point.</li>
  <li>The <b>df</b> command reports file system usage and lists the currently mounted devices.</li>
</ul>
<p><b>Mount merges two file systems into one.</b> Linux has no drive letters (C:, D:); there is one directory tree that starts at <code>/</code>. In the slide picture: (a) before mounting, the root file system has an empty directory <code>/mnt</code>, while a second file system exists separately on another device; (b) after mounting, the whole tree of the second file system appears under <code>/mnt</code>.</p>
<p>The commands:</p>
<pre class="code" data-lang="bash">shell&gt; sudo mount &lt;device&gt; &lt;directory&gt;   # attach the device into the hierarchy at directory
shell&gt; sudo umount &lt;directory&gt;            # detach it</pre>
<p>The directory is known as the <b>mount point</b> of the device. Note the order of the arguments: <b>device first, directory second</b>.</p>
<p><b>Viewing mount points.</b> How can a user see which directories are mount points? Run <code>mount</code> without arguments. It returns the list of current mount points, the device mounted on each, the type of file system the device is formatted with, and the mount options:</p>
<pre class="code" data-lang="text">[elvis@station elvis]$ mount
/dev/hda3 on / type ext3 (rw)
none on /proc type proc (rw)
usbdevfs on /proc/bus/usb type usbdevfs (rw)
/dev/hda1 on /boot type ext3 (rw)
none on /dev/pts type devpts (rw,gid=5,mode=620)
none on /dev/shm type tmpfs (rw)</pre>
<ul>
  <li><code>/dev/hda3</code> is used as the <b>root partition</b> (mounted on <code>/</code>), and the ext3 file system on partition <code>/dev/hda1</code> is mounted on the directory <code>/boot</code>.</li>
  <li>Several file systems are on the device <b>none</b>. These are <b>virtual file systems</b>: they are implemented by the kernel directly and do not exist on any physical device. <code>/proc</code> from the previous section is one of them.</li>
</ul>
<p><b>Single directory hierarchy and mount points.</b> The slide example builds one tree from four file systems: the root file system is on <code>sda6</code>; <code>sda8</code> is mounted on <code>/home</code>, <code>sda9</code> on <code>/home/mtk/test</code>, and <code>sda1</code> (a Windows partition) on <code>/windows/C</code>. To find which file system holds a given file, walk up its path and stop at the <b>nearest mount point</b>.</p>
<div data-viz="0"></div>`,
      viz: [{ name: 'tree', caption: 'One hierarchy built from four file systems; the mount points are highlighted.', props: { mono: true, root: { label: '/', note: 'sda6 file system (root)', tone: 'acc', children: [
        { label: 'bin', children: [{ label: 'bash' }] },
        { label: 'boot', children: [{ label: 'vmlinuz' }] },
        { label: 'home', note: 'mount point → sda8', tone: 'ok', children: [
          { label: 'avr', tone: 'ok' },
          { label: 'mtk', tone: 'ok', children: [
            { label: 'test', note: 'mount point → sda9', tone: 'warn', children: [{ label: 'copy.c', tone: 'warn' }] }] }] },
        { label: 'windows', children: [
          { label: 'C', note: 'mount point → sda1', tone: 'c4', children: [
            { label: 'britta', tone: 'c4' },
            { label: 'windows', tone: 'c4', children: [{ label: 'explorer.exe', tone: 'c4' }] }] }] }] } } }],
      takeaway: 'mount &lt;device&gt; &lt;directory&gt; attaches the file system of a block device to an existing directory (the mount point); umount detaches it; df shows usage and mounted devices. mount without arguments lists mount points, devices, types and options; device "none" = a virtual file system implemented by the kernel. A file belongs to the file system of its nearest mount point.',
      exam: 'Syntax mount &lt;device&gt; &lt;directory&gt;; mount without arguments; device none = virtual file system; which file system holds a file in the hierarchy.'
    },
    {
      id: 'modules',
      h: 'Device drivers as Loadable Kernel Modules (LKM)',
      why: 'add drivers without rebooting',
      lead: 'A monolithic kernel contains all its drivers — but nobody wants to rebuild the kernel and reboot for every new device. Linux solves this with modules that are loaded into the running kernel.',
      html: `
<p><b>Linux device drivers (modules)</b>, according to the slides:</p>
<ul>
  <li>are a set of API subroutines (typically system calls) that form the interface to the hardware;</li>
  <li>hide the implementation and the hardware-specific details from the user program;</li>
  <li>manage the data flow between a user program and the devices;</li>
  <li>use a <b>file interface metaphor</b> (the device-file idea of this module);</li>
  <li>are self-contained components that can be added to or removed from the kernel — an <b>LKM</b>.</li>
</ul>
<p><b>Loadable Kernel Module (LKM).</b> A driver in Linux can be built in two ways: <b>statically</b> into the kernel image, or as a <b>Loadable Kernel Module</b>.</p>
<ul>
  <li>LKMs are installed into the kernel <b>at run time from user space</b>, to extend the running kernel: they allow code to be added to a running Linux kernel.</li>
  <li>They can be added <b>on the fly</b>, while the OS is still running — no reboot.</li>
  <li>They are files with the extension <b><code>.ko</code></b> (kernel object), generally saved in <code>/lib/modules/</code> or <code>/usr/lib/modules/</code>.</li>
</ul>
<p>This is how Linux keeps the speed of a monolithic kernel (a loaded module runs inside the kernel, in kernel mode) and still gets the flexibility of a modular design. The slide lists four kinds of code that LKMs are used for:</p>
<table class="t">
  <tr><th>LKM used for</th><th>What it does</th></tr>
  <tr><td><b>Device drivers</b></td><td>a driver designed for a specific piece of hardware; the kernel uses it to talk to that hardware without knowing the details of how it works</td></tr>
  <tr><td><b>File system drivers</b></td><td>interpret the contents of a file system (files, references…): for example ext2 (used almost everywhere on Linux disks), MS-DOS, NFS</td></tr>
  <tr><td><b>System calls</b></td><td>user-space applications use system calls to access kernel resources: read a file, create a new process, close a program…</td></tr>
  <tr><td><b>Network drivers</b></td><td>interpret a network protocol; they feed and consume data streams at various stages of kernel communication (for example an IPX driver for an IPX link)</td></tr>
</table>
<p><b>Linux commands for modules.</b> The slides show <code>lsmod</code> (list or display the loaded modules) and <code>modinfo</code> (find more information about any module or driver):</p>
<pre class="code" data-lang="text">debian@debian:~$ lsmod
Module                  Size  Used by
uinput                 28672  1
snd_seq                90112  7 snd_seq_dummy
sr_mod                 28672  0
cdrom                  61440  1 sr_mod
fat                    77824  1 vfat
...
[maria@localhost ~]$ modinfo nf_conntrack | more
filename:   /lib/modules/4.18.0-240.el8.x86_64/kernel/net/netfilter/nf_conntrack.ko.xz
license:    GPL
depends:    nf_defrag_ipv6,libcrc32c,nf_defrag_ipv4
name:       nf_conntrack
...</pre>
<p>In the <code>lsmod</code> output, <b>Used by</b> shows the number of times the module is currently in use, followed by the list of other modules that refer to it. For example <code>cdrom</code> is used once, by <code>sr_mod</code> (the SCSI CD-ROM driver), so <code>cdrom</code> cannot be removed while <code>sr_mod</code> is loaded. The <code>depends</code> line of <code>modinfo</code> shows the other direction: which modules this one needs.</p>
<p>The table sums up the module commands:</p>
<table class="t">
  <tr><th>Command</th><th>What it does</th></tr>
  <tr><td><code>lsmod</code></td><td>lists the loaded modules: name, Size, <b>Used by</b> (number of current uses + modules that refer to it)</td></tr>
  <tr><td><code>modinfo driver-name</code></td><td>detailed information about a module: filename, license, alias, <b>depends</b>, version…</td></tr>
  <tr><td><code>insmod</code></td><td>loads a module from its file (does not resolve dependencies)</td></tr>
  <tr><td><code>rmmod</code></td><td>removes a module</td></tr>
  <tr><td><code>modprobe</code></td><td>loads / removes a module <b>together with its dependencies</b></td></tr>
</table>`,
      takeaway: 'Drivers can be built into the kernel image or as LKMs: .ko files in /lib/modules, loaded into the running kernel without a reboot. LKMs are used for device drivers, file system drivers, system calls and network drivers. lsmod lists modules (Size, Used by), modinfo shows details (filename, license, depends), modprobe loads a module with its dependencies.',
      exam: 'What an LKM is and its four uses; .ko in /lib/modules; lsmod (Used by), modinfo; modprobe vs insmod.'
    },
    {
      id: 'udev',
      h: 'udev, udevadm and hotplug',
      why: 'automatic drivers and /dev entries',
      lead: 'Modules can be loaded by hand, but when you plug in a USB stick nobody types modprobe. The kernel and a user-space daemon called udev do it automatically.',
      html: `
<p>LKMs can be loaded from user space in different ways; <b>udev</b> is a common method of loading kernel modules.</p>
<p><b>udev</b> is a generic <b>device manager</b> that runs as a <b>daemon</b> (a background process) on a Linux system. It listens to <b>uevents</b>: messages that the kernel sends out when a new device is initialized or a device is removed from the system. Its work, step by step:</p>
<ol class="steps">
  <li>The kernel notifies udev of a new device with a uevent.</li>
  <li>udev collects information about the device by consulting the corresponding entries in <code>/sys/</code> (another virtual file system generated by the kernel, like <code>/proc</code>).</li>
  <li>udev consults all the rules in <code>/etc/udev/rules.d/</code> and/or <code>/lib/udev/rules.d/</code>. Based on them it decides <b>which name</b> to give to the device, <b>which symbolic links</b> to create (to have alternative names) and <b>which commands</b> to execute.</li>
  <li>udev creates the corresponding entry in <code>/dev/</code>.</li>
</ol>
<p><b>udev example.</b> The rules directory on the slide contains two rule files:</p>
<pre class="code" data-lang="text">[maria@localhost ~]$ ls -l /etc/udev/rules.d/
totale 8
-rw-r--r--. 1 root root  67  4 ago  2020 69-vdo-start-by-dev.rules
-rw-r--r--. 1 root root 628 13 apr  2020 70-persistent-ipoib.rules</pre>
<ul>
  <li><b>VDO (Virtual Data Optimizer)</b>: when you set up a VDO volume, you specify a block device on which to construct it.</li>
  <li><b>IPoIB</b>: its role is to provide an IP network emulation layer on top of InfiniBand RDMA networks (InfiniBand appeared in the storage module as a SAN network).</li>
</ul>
<p><b>udevadm</b> is the device management tool that manages all the device events and controls the <b>udevd</b> daemon. Its syntax, with the meaning of each subcommand given on the slide:</p>
<table class="t">
  <tr><th>Command</th><th>Purpose</th></tr>
  <tr><td><code>udevadm [--debug] [--version] [--help]</code></td><td>general options</td></tr>
  <tr><td><code>udevadm info options</code></td><td>list all the attributes of a device</td></tr>
  <tr><td><code>udevadm trigger [options]</code>, <code>udevadm settle [options]</code></td><td>(listed on the slide without explanation)</td></tr>
  <tr><td><code>udevadm control command</code></td><td>modify the rules in the udevd daemon</td></tr>
  <tr><td><code>udevadm monitor [options]</code></td><td>monitor all the events of the devices</td></tr>
  <tr><td><code>udevadm test [options] devpath</code></td><td>test the udev rules in the terminal (for debugging only)</td></tr>
</table>
<p><b>Hot connection: hotplug.</b> All of this exists so that devices can be added and removed while the system runs:</p>
<ul>
  <li>The <b>hotplug</b> subsystem of the kernel dynamically handles the addition and removal of devices, loading the appropriate drivers and creating the corresponding device files.</li>
  <li>The kernel has a <b>database</b> that associates each <b>device id</b> with the required driver (major number). It is used during startup, to load the drivers of all devices detected on the different buses, and also when an additional hot-plugged device is added.</li>
  <li>When a hot-pluggable device is plugged in, the base platform driver (<code>usb-core</code>, <code>pci</code>, etc.) generates a <b>uevent</b> with a variable named <code>ACTION</code>, whose value is <b>add</b> or <b>remove</b> (device inserted or removed), plus other environment variables such as <code>idVendor</code>, <code>idProduct</code>, name and subsystem, with values that depend on the device.</li>
  <li>The <b>udevd</b> daemon, which executes in <b>user space</b>, receives these uevents and applies its set of rules (in <code>/etc/udev/rules.d/</code> and <code>/lib/udev/rules.d/</code>).</li>
</ul>
<p>The whole chain, from plugging in a USB stick to a usable <code>/dev</code> file:</p>
<div data-viz="0"></div>
<p>This closes the loop of the I/O and storage modules: the controller signals the kernel, the kernel picks the driver by device id and major number, udev gives the device a file in <code>/dev</code>, and from then on any program can use it with open, read and write.</p>`,
      viz: [{ name: 'flow', caption: 'Hotplug: from plugging in a device to the entry in /dev.', props: { dir: 'v', steps: [
        { label: 'Device plugged in', sub: 'USB / PCI', tone: 'muted' },
        { label: 'Base platform driver (usb-core, pci)', sub: 'uevent: ACTION=add, idVendor, idProduct, subsystem', tone: 'warn' },
        { label: 'udevd (user-space daemon)', sub: 'receives the uevent, reads the device data in /sys/', tone: 'acc' },
        { label: 'Rules', sub: '/etc/udev/rules.d/, /lib/udev/rules.d/ → name, symlinks, commands, module loading', tone: 'c2' },
        { label: 'Entry in /dev/', sub: 'device file created', tone: 'ok' }] } }],
      takeaway: 'udev is a user-space daemon (udevd) that receives kernel uevents, reads device data from /sys, applies the rules in /etc/udev/rules.d and /lib/udev/rules.d and creates the /dev entry (name, symlinks, commands). Hotplug: the base platform driver sends a uevent with ACTION=add/remove, idVendor, idProduct… udevadm info / monitor / control / test inspect and control the process.',
      exam: 'The role of udev (daemon, uevents, /sys, rules, /dev entry); udevadm monitor / info / test; ACTION=add/remove on hotplug.'
    }
  ],
  terms: [
    { en: 'Monolithic kernel', ru: 'монолитное ядро', def: 'Kernel in which process and memory management, file system and I/O (drivers) all run together in kernel mode.' },
    { en: 'User mode', ru: 'пользовательский режим', def: 'Restricted CPU mode of users, utilities and libraries.' },
    { en: 'Kernel mode', ru: 'режим ядра', def: 'Privileged CPU mode of the operating system, with full access to the hardware.' },
    { en: 'User interface', ru: 'пользовательский интерфейс', def: 'Interface between users and the utility programs.' },
    { en: 'Library interface', ru: 'интерфейс библиотеки', def: 'Interface between utility programs and the standard library.' },
    { en: 'System call interface', ru: 'интерфейс системных вызовов', def: 'Boundary between the standard library (user mode) and the kernel (kernel mode).' },
    { en: 'Standard library', ru: 'стандартная библиотека', def: 'Layer with open, close, read, write, fork…; calls the kernel through system calls.' },
    { en: 'Standard utility programs', ru: 'стандартные утилиты', def: 'Shell, editors, compilers and other programs above the library.' },
    { en: 'Device file', ru: 'файл устройства', def: 'File-like object in /dev through which a process talks to a driver and its device.' },
    { en: 'Device node', ru: 'узел устройства', def: 'Another name for a device file in /dev.' },
    { en: 'File-like object', ru: 'файлоподобный объект', def: 'Object that appears in the file system and can be opened, read and written like a file.' },
    { en: 'Unix I/O', ru: 'ввод-вывод Unix', def: 'The uniform interface open / close / read / write / lseek for files and devices.' },
    { en: 'File descriptor', ru: 'файловый дескриптор', def: 'Small number returned by open() that names an open file in later calls.' },
    { en: 'Current file position', ru: 'текущая позиция в файле', def: 'Offset where the next read or write starts; set by lseek().' },
    { en: 'Character device', ru: 'символьное устройство', def: 'Device seen as a stream of bytes, unbuffered, character by character (console, ports, tty).' },
    { en: 'Block device', ru: 'блочное устройство', def: 'Device seen as an array of fixed-size blocks: random access, buffered I/O, can host a file system (disks).' },
    { en: 'Network device', ru: 'сетевое устройство', def: 'Device that sends and receives packets; unique name (eth0); not in /dev.' },
    { en: 'Raw access', ru: 'прямой (сырой) доступ', def: 'Access to a device without the block buffering of the kernel.' },
    { en: 'Buffered I/O', ru: 'буферизованный ввод-вывод', def: 'Data are collected in a buffer until a full block can be transferred.' },
    { en: 'Unbuffered transfer', ru: 'небуферизованная передача', def: 'Data are transferred character by character, without collecting them in blocks.' },
    { en: 'Stream of bytes', ru: 'поток байтов', def: 'Abstraction of a character device: bytes delivered one after another.' },
    { en: 'Random access', ru: 'произвольный доступ', def: 'Access to data in any order.' },
    { en: 'Partition', ru: 'раздел (диска)', def: 'Part of a disk with its own device node (sda1) and its own file system.' },
    { en: 'Terminal', ru: 'терминал', def: 'Character device used for text input and output (tty, pty).' },
    { en: 'tty', ru: 'терминал tty', def: 'Native terminal device; the backend is hardware or emulated by the kernel.' },
    { en: 'Pseudo terminal', ru: 'псевдотерминал', def: 'pty: terminal device emulated by another program (xterm, screen, ssh).' },
    { en: 'pts', ru: 'подчинённая сторона псевдотерминала', def: 'The slave part of a pty, used by the shell as its terminal.' },
    { en: 'Packet', ru: 'пакет', def: 'Unit of data sent or received by a network device.' },
    { en: 'Regular file', ru: 'обычный файл', def: 'File with user/application data; for the OS just a sequence of bytes (- in ls -l).' },
    { en: 'Directory file', ru: 'файл-каталог', def: 'File that contains the names and locations of other files (d).' },
    { en: 'Character special file', ru: 'символьный специальный файл', def: 'Device file of a character device, e.g. a terminal (c).' },
    { en: 'Block special file', ru: 'блочный специальный файл', def: 'Device file of a block device, e.g. a disk (b).' },
    { en: 'Named pipe', ru: 'именованный канал', def: 'FIFO: file type used for inter-process communication (p).' },
    { en: 'Symbolic link', ru: 'символическая ссылка', def: 'File that points to another file (l).' },
    { en: 'Socket', ru: 'сокет', def: 'File type used for network communication between processes (s).' },
    { en: 'Special device', ru: 'специальное устройство', def: 'Device file with no hardware behind it, such as /dev/null and /dev/zero.' },
    { en: '/dev/null', ru: 'пустое устройство /dev/null', def: 'Discards everything written to it; reading gives end-of-file at once.' },
    { en: '/dev/zero', ru: 'источник нулевых байтов /dev/zero', def: 'Gives an endless stream of zero bytes when read.' },
    { en: 'End-of-file', ru: 'конец файла', def: 'EOF: the condition returned when there is nothing more to read.' },
    { en: 'Major device number', ru: 'старший номер устройства', def: 'Specifies which driver the device corresponds to.' },
    { en: 'Minor device number', ru: 'младший номер устройства', def: 'Distinguishes the individual devices or components controlled by one driver.' },
    { en: 'proc file system', ru: 'файловая система proc', def: '/proc: special files that represent the current state of the kernel (/proc/devices, /proc/diskstats).' },
    { en: 'Reads merged', ru: 'объединённые запросы чтения', def: 'Field 5 of /proc/diskstats: read requests merged in the queue scheduler before reaching the device.' },
    { en: 'Queue scheduler', ru: 'планировщик очереди ввода-вывода', def: 'Kernel component that orders and merges block requests before sending them to the device.' },
    { en: 'Mount', ru: 'монтирование', def: 'Mapping the root directory of a device file system onto an existing directory.' },
    { en: 'Mount point', ru: 'точка монтирования', def: 'The existing directory on which a file system is mounted.' },
    { en: 'umount', ru: 'размонтирование (umount)', def: 'Command that detaches a file system from its mount point.' },
    { en: 'df', ru: 'команда df', def: 'Reports file system usage and lists the mounted devices.' },
    { en: 'Root partition', ru: 'корневой раздел', def: 'The partition mounted on /.' },
    { en: 'Virtual file system', ru: 'виртуальная файловая система', def: 'File system implemented by the kernel, not on a physical device (proc, devpts, tmpfs); device "none".' },
    { en: 'Single directory hierarchy', ru: 'единая иерархия каталогов', def: 'One tree starting at /, built by mounting several file systems.' },
    { en: 'Loadable Kernel Module', ru: 'загружаемый модуль ядра', def: 'LKM: .ko file loaded into the running kernel from user space, without a reboot.' },
    { en: 'Kernel image', ru: 'образ ядра', def: 'The kernel binary; drivers can be built into it statically.' },
    { en: 'File system driver', ru: 'драйвер файловой системы', def: 'Module that interprets the contents of a file system (ext2, MS-DOS, NFS).' },
    { en: 'Network driver', ru: 'сетевой драйвер', def: 'Module that interprets a network protocol and feeds / consumes data streams.' },
    { en: 'lsmod', ru: 'список загруженных модулей (lsmod)', def: 'Lists the loaded modules: name, Size, Used by.' },
    { en: 'modinfo', ru: 'сведения о модуле (modinfo)', def: 'Shows information about a module: filename, license, depends…' },
    { en: 'insmod', ru: 'загрузка модуля (insmod)', def: 'Loads one module file without resolving its dependencies.' },
    { en: 'rmmod', ru: 'выгрузка модуля (rmmod)', def: 'Removes a module from the kernel.' },
    { en: 'modprobe', ru: 'загрузка модуля с зависимостями', def: 'Loads or removes a module together with its dependencies.' },
    { en: 'udev', ru: 'менеджер устройств udev', def: 'Device manager daemon: receives uevents, reads /sys, applies rules, creates /dev entries.' },
    { en: 'Device manager', ru: 'менеджер устройств', def: 'Software that names devices and creates their device files (udev).' },
    { en: 'Daemon', ru: 'демон', def: 'A process that runs in the background (udevd, printer daemon).' },
    { en: 'uevent', ru: 'событие устройства (uevent)', def: 'Kernel message about an added or removed device (ACTION=add/remove, idVendor, idProduct…).' },
    { en: 'udevd', ru: 'демон udevd', def: 'The user-space udev daemon that receives uevents.' },
    { en: 'udevadm', ru: 'утилита udevadm', def: 'Tool that manages device events and controls udevd: info, monitor, control, test, trigger, settle.' },
    { en: 'udev rules', ru: 'правила udev', def: 'Files in /etc/udev/rules.d and /lib/udev/rules.d deciding names, symlinks and commands.' },
    { en: 'Hotplug', ru: 'горячее подключение', def: 'Kernel subsystem that handles adding and removing devices at run time, loading drivers and creating device files.' },
    { en: 'Device id', ru: 'идентификатор устройства', def: 'Identifier the kernel maps to the required driver (major number).' },
    { en: 'Base platform driver', ru: 'базовый драйвер шины', def: 'Bus driver (usb-core, pci) that generates the uevent when a device is plugged in.' },
    { en: 'sysfs', ru: 'файловая система sysfs', def: '/sys: virtual file system with device information, read by udev.' },
    { en: 'Virtual Data Optimizer', ru: 'оптимизатор виртуальных данных (VDO)', def: 'VDO: volume built on a specified block device.' },
    { en: 'IPoIB', ru: 'IP поверх InfiniBand', def: 'IP network emulation layer on top of InfiniBand RDMA networks.' }
  ],
  questions: [
    { id: 'dev-01', type: 'single', q: 'Which layer of a Linux system runs in kernel mode?', options: ['Standard library (open, close, read, write, fork)', 'Standard utility programs (shell, editors, compilers)', 'UNIX operating system (process / memory management, file system, I/O)', 'Users'], answer: 2, explain: 'The monolithic kernel is the only layer in kernel mode; the library and the utilities run in user mode.', section: 'layers', diff: 1 },
    { id: 'dev-02', type: 'single', q: 'Through which interface does the standard library call the kernel?', options: ['User interface', 'Library interface', 'System call interface', 'Hardware interface'], answer: 2, explain: 'Users → user interface → utilities → library interface → standard library → system call interface → kernel.', section: 'layers', diff: 2 },
    { id: 'dev-03', type: 'tf', q: 'Device drivers run as part of the kernel, so processes communicate with them through file-like objects in the file system.', answer: true, explain: 'Drivers are not directly accessible to user processes; access goes through device files, which are opened, read and written like normal files.', section: 'file-oriented', diff: 1 },
    { id: 'dev-04', type: 'single', q: 'Which system call changes the current file position?', options: ['open()', 'read()', 'lseek()', 'close()'], answer: 2, explain: 'lseek() sets the offset of the next read or write. read and write move the position only as a side effect.', section: 'io-ops', diff: 1 },
    { id: 'dev-05', type: 'multi', q: 'Which classes of devices does Linux distinguish? (select all that apply)', options: ['Character devices', 'Block devices', 'Network devices', 'Memory devices', 'Virtual devices'], answer: [0, 1, 2], explain: 'The classes of devices are character, block and network.', section: 'classes', diff: 1 },
    { id: 'dev-06', type: 'single', q: 'Which comparison of block and character devices is correct?', options: ['Block — stream of bytes, unbuffered; character — array of blocks, buffered', 'Block — array of fixed-size blocks, buffered I/O, can host a file system; character — stream of bytes, unbuffered', 'Both do buffered I/O and can host a file system', 'Character devices give random access; block devices only sequential access'], answer: 1, explain: 'Block devices: random access, fixed-size blocks, buffered, can host a file system. Character devices: a stream of bytes without buffering.', section: 'block', diff: 2 },
    { id: 'dev-07', type: 'code', lang: 'bash', q: 'What do b, 8 and 1 mean in this output?', code: '# ls -l /dev/sda1\nbrw-r----- 1 root disk 8, 1 Apr 10  2006 /dev/sda1', options: ['Block device; major 8 (driver), minor 1 (first partition of the first SCSI disk)', 'Binary file of 8 KB with 1 link', 'Block device; 8 partitions, partition 1 active', 'Character device; minor 8, major 1'], answer: 0, explain: 'b = block device; for device files the size field is replaced by "major, minor": 8 = SCSI disk driver, 1 = partition sda1.', section: 'dev-dir', diff: 2 },
    { id: 'dev-08', type: 'single', q: 'The major device number specifies…', options: ['the partition number on the disk', 'which driver the device corresponds to', 'the block size of the device', 'the bus number'], answer: 1, explain: 'Major = driver; the minor number distinguishes the individual devices or components handled by that driver.', section: 'numbers', diff: 1 },
    { id: 'dev-09', type: 'code', lang: 'text', q: 'Why do these devices have the same major number but different minor numbers?', code: 'brw-rw---- 1 root disk 8,  0 /dev/sda\nbrw-rw---- 1 root disk 8, 17 /dev/sdb1', options: ['They are the same device', 'They are handled by the same SCSI disk driver (8); minor 17 = second disk (16) + first partition', 'Major 8 is the bus number, the minor is the port number', 'Minor 17 is the partition size in GB'], answer: 1, explain: 'Major 8 = one driver. From the table: sda = 8,0, sdb = 8,16, sdb1 = 8,17 — the minor number tells disks and partitions apart.', section: 'numbers', diff: 3 },
    { id: 'dev-10', type: 'multi', q: 'Which statements are true for network devices? (select all that apply)', options: ['They send and receive packets, not bytes', 'They have unique names such as eth0', 'They are not in /dev', 'They appear as /dev/eth0 and are opened with open()', 'If the read buffer is too small for a packet, the rest of the packet is read later'], answer: [0, 1, 2], explain: 'Network devices: packets, names like eth0, not in /dev. If the buffer is too small, the packet is lost, not kept for later.', section: 'network', diff: 2 },
    { id: 'dev-11', type: 'single', q: 'What is a pty?', options: ['A native terminal device with a hardware backend', 'A pseudo terminal emulated by another program (xterm, screen, ssh)', 'A serial port', 'The slave part of a terminal'], answer: 1, explain: 'tty = native terminal; pty = emulated by a program; pts = slave part of a pty.', section: 'char', diff: 2 },
    { id: 'dev-12', type: 'code', lang: 'bash', q: 'What does the last command print?', code: 'echo hi > /dev/null\ncat /dev/null | wc -c', options: ['0', '2', '3', 'hi'], answer: 0, explain: 'Data written to /dev/null are discarded, and reading /dev/null gives end-of-file at once → 0 bytes.', section: 'dev-dir', diff: 1 },
    { id: 'dev-13', type: 'code', lang: 'bash', q: 'What does this command print?', code: 'head -c 4 /dev/zero | od -An -tx1', options: [' 00 00 00 00', 'Nothing: /dev/zero is empty', ' 30 30 30 30', 'Endless output'], answer: 0, explain: '/dev/zero gives as many zero bytes as you read; head -c 4 takes 4 bytes 0x00. 0x30 is the character "0", not a zero byte.', section: 'dev-dir', diff: 2 },
    { id: 'dev-14', type: 'single', q: 'Terminals and disks are, respectively, which special files?', options: ['Character special and block special', 'Block special and character special', 'Both character special', 'FIFO and socket'], answer: 0, explain: 'Terminals are character special files (c), disks are block special files (b).', section: 'filetypes', diff: 1 },
    { id: 'dev-15', type: 'single', q: 'Where can you see the major number and the name of the currently configured devices?', options: ['/proc/devices', '/etc/fstab', '/dev/major', '/proc/diskstats'], answer: 0, explain: '/proc/devices lists the character and block devices currently configured (not those whose modules are not loaded). /proc/diskstats gives I/O statistics.', section: 'numbers', diff: 2 },
    { id: 'dev-16', type: 'single', q: 'How do you mount the partition /dev/sdb1 on the directory /mnt/usb?', options: ['sudo mount /mnt/usb /dev/sdb1', 'sudo mount /dev/sdb1 /mnt/usb', 'sudo umount /dev/sdb1 /mnt/usb', 'sudo df /dev/sdb1 /mnt/usb'], answer: 1, explain: 'Syntax: mount device directory (device first, then directory); the directory becomes the mount point. umount detaches, df reports usage.', section: 'mount', diff: 1 },
    { id: 'dev-17', type: 'code', lang: 'text', q: 'Output of mount without arguments. Why is the device of /proc "none"?', code: '/dev/hda3 on / type ext3 (rw)\nnone on /proc type proc (rw)\n/dev/hda1 on /boot type ext3 (rw)', options: ['The /proc partition is not mounted', 'It is a virtual file system implemented by the kernel, not stored on any physical device', '/proc is on the same partition as /', 'The device was disabled by udev'], answer: 1, explain: '"none" = virtual file systems implemented by the kernel. /dev/hda3 is the root partition; /dev/hda1 is mounted on /boot.', section: 'mount', diff: 2 },
    { id: 'dev-18', type: 'single', q: 'The root file system is on sda6, sda8 is mounted on /home, sda9 on /home/mtk/test. Which file system holds /home/mtk/test/copy.c?', options: ['sda6', 'sda8', 'sda9', 'sda1'], answer: 2, explain: 'The nearest mount point up the path decides: /home/mtk/test → sda9 (it covers sda8 for that subtree).', section: 'mount', diff: 3 },
    { id: 'dev-19', type: 'multi', q: 'What are Loadable Kernel Modules used for? (select all that apply)', options: ['Device drivers', 'File system drivers', 'System calls', 'Network drivers', 'User shell scripts'], answer: [0, 1, 2, 3], explain: 'The slide "What LKMs are used for": device drivers, file system drivers, system calls, network drivers. Shell scripts run in user space.', section: 'modules', diff: 2 },
    { id: 'dev-20', type: 'code', lang: 'text', q: 'Part of the lsmod output. What does the 7 on the snd_seq line mean?', code: 'Module                  Size  Used by\nsnd_seq                90112  7 snd_seq_dummy\nsnd_seq_dummy          16384  0', options: ['The module version', 'How many times the module is currently in use', 'The number of dependencies of the module', 'The major number'], answer: 1, explain: 'Used by: the number of current uses, followed by the modules that refer to this one (snd_seq_dummy).', section: 'modules', diff: 2 },
    { id: 'dev-21', type: 'single', q: 'Which command loads a kernel module together with its dependencies?', options: ['insmod', 'lsmod', 'modinfo', 'modprobe'], answer: 3, explain: 'modprobe resolves the dependencies. insmod loads a single module file, lsmod lists modules, modinfo shows information about a module.', section: 'modules', diff: 2 },
    { id: 'dev-22', type: 'single', q: 'Where are LKMs usually stored, and what is their extension?', options: ['/dev, .dev', '/lib/modules or /usr/lib/modules, .ko', '/etc/udev/rules.d, .rules', '/proc/modules, .so'], answer: 1, explain: 'Modules are .ko files in /lib/modules/ or /usr/lib/modules/. .rules files are udev rules.', section: 'modules', diff: 1 },
    { id: 'dev-23', type: 'single', q: 'What is udev?', options: ['A tool for formatting disks', 'A generic device manager: a daemon that listens to kernel uevents about new and removed devices', 'A character device for USB', 'A file system driver'], answer: 1, explain: 'udev receives uevents, reads data from /sys/, applies the rules and creates entries in /dev/.', section: 'udev', diff: 1 },
    { id: 'dev-24', type: 'single', q: 'Which udevadm subcommand lets you watch all device events?', options: ['udevadm info', 'udevadm monitor', 'udevadm control', 'udevadm test'], answer: 1, explain: 'monitor = all events; info = device attributes; control = change the rules in udevd; test = debug the rules.', section: 'udev', diff: 2 },
    { id: 'dev-25', type: 'single', q: 'A USB device is plugged in. In what order do things happen?', options: ['udevd creates the /dev entry → the kernel generates a uevent → the driver is loaded', 'The base platform driver (usb-core) generates a uevent with ACTION=add → udevd in user space receives it and reads /sys/ → applies the rules → creates the entry in /dev/', 'The user runs mount → the kernel creates the /dev entry → udev loads the rules', 'udevadm test → uevent → hotplug'], answer: 1, explain: 'uevent from the base platform driver (ACTION=add, idVendor, idProduct…) → udevd collects data from /sys/ → rules (/etc/udev/rules.d/, /lib/udev/rules.d/) → name, symlinks, commands → /dev.', section: 'udev', diff: 3 },
    { id: 'dev-26', type: 'single', q: 'How can a user see which directories are currently mount points?', options: ['Run mount without arguments', 'Run umount without arguments', 'Run lsmod', 'Run udevadm info'], answer: 0, explain: 'mount without arguments lists the current mount points, the mounted devices, the file system types and the mount options. df also lists the mounted devices with their usage.', section: 'mount', diff: 1 },
    { id: 'dev-27', type: 'tf', q: 'A block device always lets the programmer read or write a block of any size, even a single byte.', answer: true, explain: 'From the slide: unlike character devices, block devices always allow reading or writing a block of any size (including single bytes); the kernel turns it into whole-block transfers.', section: 'block', diff: 2 },
    { id: 'dev-28', type: 'single', q: 'A hot-pluggable device is plugged in. What value does the ACTION variable of the uevent have?', options: ['add', 'remove', 'mount', 'insmod'], answer: 0, explain: 'ACTION is add when a device is inserted and remove when it is removed; the uevent also carries idVendor, idProduct, name, subsystem…', section: 'udev', diff: 1 }
  ]
});
