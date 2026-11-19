OS.addModule({
  id: 'services',
  num: 2,
  group: 'theory',
  title: 'Operating-System Services',
  titleRu: 'Сервисы и структура ОС',
  icon: '🧩',
  sources: ['2-Operating System Services.pdf'],
  summary: 'The OS seen from outside and from inside: design goals, the services it offers, user interfaces (GUI, CLI, shells), system calls (implementation, parameter passing, types), the C library, APIs and POSIX, system services, linkers and loaders, building and booting, debugging, and OS structures (monolithic, layered, microkernel, modules, hybrid).',
  bridge: 'Module 1 showed that user programs may not touch the hardware: they run in user mode and enter the kernel only through system calls. This module looks at that border from both sides — which services the OS offers to users and programs, and how the OS itself is built.',
  intro: `
<p>From the outside, an operating system is a <b>set of services</b>: it runs programs, performs I/O, manages files, lets processes communicate, detects errors and shares resources. People reach these services through a <b>user interface</b> (a GUI or a command line); programs reach them through <b>system calls</b>, usually hidden behind a library <b>API</b> such as the C library or POSIX. Around the kernel there are <b>system programs</b> — compilers, linkers, loaders, daemons — that make the system usable.</p>
<p>The module first follows a request from the top down: design goals and the list of services, then the user interfaces, then system calls, then libraries and APIs, then the system programs, ending with how a program file becomes something the OS can load (linkers and loaders). Then it treats the OS itself as a program: how it is built, booted and debugged. Finally it compares the ways to organize this huge program: monolithic, layered, microkernel, modules and hybrid.</p>`,
  sections: [
    {
      id: 'design',
      h: 'Design goals of an OS',
      why: 'what the designers aim for',
      lead: `An OS is a huge program, and there is no single correct way to build one. Designers start by fixing what the system must achieve — its goals — and which services it must offer.`,
      html: `
<p>The slides are honest about it: the design and implementation of an OS is <b>not "solvable"</b> in the sense of having one right answer, but some approaches have proven successful. That is why the internal structure of different operating systems can <b>vary widely</b> — we compare the main structures at the end of this module.</p>
<p>The design starts by <b>defining goals and services</b>. It is also affected by the choice of <b>hardware</b> and by the <b>type of system</b> (batch, time-sharing, mobile, real-time…). The goals come from two groups of people with different wishes. Compare the two columns:</p>
<div class="cols">
  <div><b>User goals</b> — the OS should be:
    <ul><li>convenient to use</li><li>easy to learn</li><li>reliable</li><li>safe</li><li>fast</li></ul>
  </div>
  <div><b>System goals</b> — the OS should be:
    <ul><li>easy to design, implement and maintain</li><li>flexible</li><li>reliable, error-free</li><li>efficient</li></ul>
  </div>
</div>
<p>The pattern: <b>user goals</b> describe how the system feels to the people who use it; <b>system goals</b> describe how it looks to the people who build and maintain it. "Reliable" appears in both lists, but most items do not: "easy to learn" helps the user, "easy to maintain" helps the developer. These goals are vague and sometimes conflict, so there is no formula to satisfy them.</p>
<div class="callout note">Specifying and designing an OS is a highly creative task of software engineering.</div>
<p>Goals are abstract. The concrete promise an OS makes is its list of services — next section.</p>`,
      takeaway: `Start the design from goals and services; hardware and system type also shape it. User goals: convenient, easy to learn, reliable, safe, fast. System goals: easy to design, implement and maintain; flexible; reliable, error-free; efficient.`,
      exam: `Separate user goals (convenient, easy to learn, reliable, safe, fast) from system goals (easy to design/implement/maintain, flexible, error-free, efficient).`
    },
    {
      id: 'services',
      h: 'Operating-system services',
      why: 'what the OS offers',
      lead: `Goals turn into concrete services. The slides split them into two groups: services that help the user, and services that keep the system itself running efficiently when many users share it.`,
      html: `
<p>Read the table in two halves. The first six services make life easier for <b>one user or one program</b>; the last three exist only because <b>many</b> users and jobs share the same machine.</p>
<table class="t">
  <tr><th colspan="2">Services <b>for the user</b></th></tr>
  <tr><td><b>User interface (UI)</b></td><td>almost all operating systems have one; it varies between <b>Command-Line (CLI)</b>, <b>Graphics User Interface (GUI)</b>, touch-screen and <b>Batch</b> (commands written into files and executed)</td></tr>
  <tr><td><b>Program execution</b></td><td>the system must be able to load a program into memory, run it, and end its execution, either normally or abnormally (indicating an error)</td></tr>
  <tr><td><b>I/O operations</b></td><td>a running program may require I/O, which may involve a file or an I/O device</td></tr>
  <tr><td><b>File-system manipulation</b></td><td>programs need to read and write files and directories, create and delete them, search them, list file information, and manage permissions</td></tr>
  <tr><td><b>Communications</b></td><td>processes may exchange information, on the same computer or between computers over a network, via <b>shared memory</b> (processes read and write a common memory region) or through <b>message passing</b> (packets moved by the OS)</td></tr>
  <tr><td><b>Error detection</b></td><td>the OS must be constantly aware of possible errors — in the CPU and memory hardware, in I/O devices, in user programs; for each type of error it should take the appropriate action to ensure correct and consistent computing; <b>debugging facilities</b> can greatly help users and programmers to use the system efficiently</td></tr>
  <tr><th colspan="2">Services <b>for the efficient operation of the system itself</b></th></tr>
  <tr><td><b>Resource allocation</b></td><td>when multiple users or multiple jobs run concurrently, resources must be allocated to each of them: CPU cycles, main memory, file storage, I/O devices</td></tr>
  <tr><td><b>Logging</b> (accounting)</td><td>keeping track of which users use how much and what kinds of computer resources</td></tr>
  <tr><td><b>Protection and security</b></td><td>the owners of information in a multiuser or networked system may want to control its use, and concurrent processes should not interfere with each other; <b>protection</b> ensures that all access to system resources is controlled; <b>security</b> from outsiders requires <b>user authentication</b> and extends to defending external I/O devices from invalid access attempts</td></tr>
</table>
<p>Notice the logic of the second group. As soon as several users or jobs run at once, someone must <b>share</b> the resources (resource allocation), someone must <b>count</b> who used what (logging), and someone must <b>keep them apart</b> (protection and security).</p>
<p>The slides show where these services live with one diagram, repeated several times with a different part highlighted ("A View of Operating System Services"). Read it from top to bottom: user and system programs reach the OS through <b>user interfaces</b> (GUI, touch screen, command line) and, below them, through <b>system calls</b>; the system calls give access to the <b>services</b>, which run on the <b>hardware</b>.</p>
<div data-viz="0"></div>
<p>This diagram is the map of the module. We now go down through it, starting with the user interfaces.</p>`,
      viz: [{ name: 'layers', caption: 'A view of operating-system services: user interfaces, system calls and services are the parts of the OS between programs and hardware', props: { layers: [
        { label: 'user and other system programs', tone: 'muted' },
        { label: 'user interfaces', sub: 'GUI · touch screen · command line', tone: 'c2' },
        { label: 'system calls', tone: 'warn' },
        { label: 'services', sub: 'program execution · I/O operations · file systems · communication · resource allocation · accounting · error detection · protection and security', tone: 'acc' },
        { label: 'hardware', tone: 'muted' }] } }],
      takeaway: `Services for the user: user interface, program execution, I/O operations, file-system manipulation, communications (shared memory or message passing), error detection. Services for the system’s efficiency: resource allocation, logging (accounting), protection and security. Programs reach the services through user interfaces and system calls.`,
      exam: `Split the services into "for the user" (UI, program execution, I/O, file system, communications, error detection) and "for the efficient operation of the system" (resource allocation, logging, protection and security).`
    },
    {
      id: 'gui',
      h: 'User interfaces: GUI and touchscreen',
      why: 'how people reach the OS',
      lead: `The top layer of the map is the user interface. Most people meet the OS through a graphical interface; phones and tablets needed yet another kind of interface.`,
      html: `
<p>A <b>graphical user interface (GUI)</b> is a user-friendly <b>desktop metaphor</b> interface: the screen imitates an office desk with documents and folders on it.</p>
<ul>
  <li>It usually uses a mouse, a keyboard and a monitor.</li>
  <li><b>Icons</b> represent files, programs, actions, etc.</li>
  <li>Various mouse buttons over objects in the interface cause various actions: provide information, show options, execute a function, open a directory (known as a <b>folder</b>).</li>
  <li>The GUI was invented at <b>Xerox PARC</b> (a research centre).</li>
</ul>
<p>The slides show the Mac OS X GUI as an example.</p>
<p><b>Touchscreen devices</b> require new interfaces, because a mouse is not possible or not desired there. Instead:</p>
<ul>
  <li>actions and selection are based on <b>gestures</b> (tap, swipe, pinch…);</li>
  <li>a <b>virtual keyboard</b> on the screen is used for text entry;</li>
  <li><b>voice commands</b> replace typing.</li>
</ul>
<p>A system does not have to choose a single interface: many systems now include <b>both a CLI and a GUI</b>. The table shows how three families combine them:</p>
<table class="t">
  <tr><th>OS</th><th>Interfaces</th></tr>
  <tr><td>Microsoft Windows</td><td>a GUI with a CLI "command" shell</td></tr>
  <tr><td>Apple Mac OS X</td><td>the "<b>Aqua</b>" GUI, with a <b>UNIX kernel</b> underneath and shells available</td></tr>
  <tr><td>Unix and Linux</td><td>a CLI with optional GUI interfaces (<b>CDE</b>, <b>KDE</b>, <b>GNOME</b>)</td></tr>
</table>
<p>The pattern: Windows starts from the GUI and adds a command shell; Unix and Linux start from the command line and add an optional GUI; Mac OS X puts its GUI on top of a UNIX kernel, so the Unix shells are still there underneath. Why keep a command line at all when a GUI exists? That is the next section.</p>`,
      takeaway: `GUI: desktop metaphor, icons, mouse actions; invented at Xerox PARC. Touchscreens: gestures, virtual keyboard, voice commands. Many systems have both: Windows (GUI + command shell), Mac OS X (Aqua GUI over a UNIX kernel, shells available), Unix/Linux (CLI + optional GUI: CDE, KDE, GNOME).`,
      exam: `Where the GUI was invented (Xerox PARC); what lies under Aqua in Mac OS X; the optional GUIs of Unix/Linux.`
    },
    {
      id: 'cli',
      h: 'The command-line interpreter and shells',
      why: 'why typing commands still matters',
      lead: `A graphical interface is easy to learn, yet the command line is still everywhere. The slides give four reasons for it, and then show how a command interpreter — a shell — works.`,
      html: `
<p>A <b>command-line interface (CLI)</b>, or <b>command interpreter</b>, allows <b>direct command entry</b>: you type a command as text and the system executes it. Why is it useful?</p>
<ul>
  <li>you have <b>direct access</b> to the functions of the OS;</li>
  <li>the GUI software may not be built to use <b>all</b> the available commands;</li>
  <li>you can <b>automate</b> commands — for example with <b>bash scripts</b> (files of commands that run one after another);</li>
  <li>a system may not have the resources to run a graphical program (e.g. a small server or embedded device).</li>
</ul>
<p>Sometimes several variants of the command interpreter are implemented; each variant is called a <b>shell</b>. A shell primarily <b>fetches a command from the user and executes it</b>. But what is a "command"? There are two designs:</p>
<ul>
  <li>sometimes commands are <b>built into</b> the shell: the shell itself contains the code that executes them;</li>
  <li>sometimes commands are just <b>names of programs</b>: the shell finds the program file and runs it. Then <b>adding new features does not require modifying the shell</b> — you simply install a new program.</li>
</ul>
<p>The <b>Bourne shell</b> is the original Unix shell. Unix and Linux systems usually offer several shells, and three commands tell you which ones exist and which one you are using:</p>
<pre class="code" data-lang="bash">$ cat /etc/shells     # list of the paths of all valid login shells installed on the system
$ echo $SHELL         # the user's default shell
$ echo $0             # the shell you are using right now (current shell)

# example session from the slide (Bourne shell):
$ uptime
$ df -kh
$ ps aux | sort -nrk 3,3 | head -n 5
$ ls -l /usr/lpp/mmfs/bin/mmfsd</pre>
<div class="callout warn"><code>$SHELL</code> and <code>$0</code> can differ. <code>$SHELL</code> is your <b>default</b> login shell and does not change; <code>$0</code> is the <b>current</b> shell. If you start <code>sh</code> from bash, <code>$0</code> becomes <code>sh</code> while <code>$SHELL</code> stays <code>/bin/bash</code>.</div>
<p>The example session uses ordinary programs: <code>uptime</code> (how long the system has been running, and its load), <code>df -kh</code> (disk space usage in human-readable units), <code>ps aux | sort -nrk 3,3 | head -n 5</code> (all processes, sorted by CPU usage, top five shown) and <code>ls -l</code> (details of one file).</p>
<p><b>In Windows</b>, the <b>Command Prompt (CMD)</b> lets users interact directly with the system. <b>Windows PowerShell</b> is a more complex version of the command prompt: it includes a scripting language that can easily accomplish many administrative operations.</p>
<p><b>Running Linux on Windows</b>: the <b>Windows Subsystem for Linux (WSL)</b> lets developers install a Linux distribution (such as Ubuntu, OpenSUSE, Kali, Debian, Arch Linux) and use Linux applications, utilities and Bash command-line tools directly on Windows.</p>
<p>Whether you click an icon or type a command, the interface does not do the work itself: it asks the OS. The next layer of the map is that request mechanism — the system call.</p>`,
      takeaway: `CLI: direct access to OS functions, more commands than the GUI, automation (bash scripts), low resource needs. A shell fetches a command and executes it; commands are either built in or names of programs (then new features need no shell change). /etc/shells = valid login shells, $SHELL = default shell, $0 = current shell. Windows: CMD and PowerShell; WSL runs Linux tools on Windows.`,
      exam: `Why the CLI is useful; built-in commands vs program names; /etc/shells, $SHELL (default) vs $0 (current); CMD vs PowerShell; WSL.`
    },
    {
      id: 'syscalls',
      h: 'System calls',
      why: 'how a program asks the kernel',
      lead: `From Module 1 we know that user programs run in user mode and cannot touch the hardware. So every time a program needs the OS — to open a file, print text, start a process — it makes a system call. This section shows how many calls even a tiny program makes, and how the kernel finds the right one.`,
      html: `
<p>Two definitions from the slide "How user processes interact with the OS":</p>
<ul>
  <li><b>System calls</b> are the <b>interface between a program running in user space and the operating system</b>. Application programs use system calls to request services and functionality from the OS kernel.</li>
  <li>An <b>Application Programming Interface (API)</b> allows programs to send information to each other. In practice programs call API functions, which make the system calls for them — see "The C library and the read() API".</li>
</ul>
<p><b>Example: copying a file.</b> The command <code>cp in.txt out.txt</code> copies one file into another (you can check the result with <code>diff in.txt out.txt</code>, <code>sdiff</code> or <code>vimdiff</code>, which show the differences between two files). It looks like one action — but step through the sequence below: almost every line is a system call (write a prompt, read input, open, create, read, write, close, terminate).</p>
<div data-viz="0"></div>
<p>Two lessons from the example. First, even a simple program makes <b>many</b> system calls. Second, a large part of the work is <b>error handling</b>: the input file may not exist, the output file may already exist, a read may fail.</p>
<p><b>How does the kernel find the right code for each call?</b> The system call implementation works like this:</p>
<ol class="steps">
  <li>Typically, a <b>number</b> is associated with each system call.</li>
  <li>The <b>system-call interface</b> maintains a <b>table indexed by these numbers</b>: entry i holds the address of the kernel code for system call i.</li>
  <li>The system-call interface invokes the intended system call in the OS kernel and returns the <b>status</b> of the system call and any <b>return values</b>.</li>
</ol>
<p>The caller needs to know <b>nothing about how the system call is implemented</b>. It just needs to obey the API and understand what the OS will do as a result of the call. Most details of the OS interface are hidden from the programmer by the API and are managed by the <b>run-time support library</b> (a set of functions built into the libraries included with the compiler).</p>
<p>The figure "Application – System Call – OS Relationship" follows one call, <code>open()</code>: the user application calls <code>open()</code> in user mode; the system-call interface switches to kernel mode and uses the call’s number i to look up the table; the implementation of <code>open()</code> runs in the kernel and returns; control goes back to the application.</p>
<div data-viz="1"></div>
<p>One detail is still missing: <code>open()</code> must know <i>which</i> file to open and <i>how</i>. How do such parameters get from user space into the kernel? Next section.</p>`,
      viz: [
        { name: 'stepper', caption: 'Example system call sequence: copy a source file to a destination file', props: { lang: 'text',
          code: 'Acquire input file name\n  Write prompt to screen\n  Accept input\nAcquire output file name\n  Write prompt to screen\n  Accept input\nOpen the input file\n  if file doesn\'t exist, abort\nCreate output file\n  if file exists, abort\nLoop\n  Read from input file\n  Write to output file\nUntil read fails\nClose output file\nWrite completion message to screen\nTerminate normally',
          steps: [
            { line: [1, 2, 3], note: 'Get the input file name: writing the prompt to the screen and reading the answer from the keyboard are already system calls (write, read).' },
            { line: [4, 5, 6], note: 'The same for the output file name.' },
            { line: [7, 8], note: 'open() the input file; if the file does not exist, report the error and abort (abnormal termination).' },
            { line: [9, 10], note: 'Create the output file; if it already exists, abort.' },
            { line: [11, 12, 13, 14], note: 'Loop: read() from the input file and write() to the output file, until read fails (end of file or an error).' },
            { line: 15, note: 'close() the output file.' },
            { line: 16, note: 'write() a completion message to the screen.' },
            { line: 17, note: 'exit(): terminate normally.' }] } },
        { name: 'flow', caption: 'open(): user mode → system-call interface → table entry i → implementation → return', props: { dir: 'h', loop: true, steps: [
          { label: 'user application', sub: 'calls open()', tone: 'c2' },
          { label: 'system call interface', sub: 'user → kernel mode', tone: 'warn' },
          { label: 'table[i]', sub: 'system call number', tone: 'muted' },
          { label: 'implementation of open()', sub: 'kernel → return', tone: 'acc' }] } }
      ],
      takeaway: `A system call is how a program in user space requests a kernel service. Each call has a number; the system-call interface keeps a table indexed by these numbers, runs the kernel code and returns the status and return values. The caller only needs to obey the API, not to know the implementation.`,
      exam: `How the system-call interface finds the call (number → table); why the caller need not know the implementation; the sequence of system calls in the copy example.`
    },
    {
      id: 'params',
      h: 'Passing parameters to system calls',
      why: 'how arguments reach the kernel',
      lead: `The call number tells the kernel which service is wanted, but usually more information is needed: a file name, a buffer, a size. There are three agreed ways to hand such parameters to the OS.`,
      html: `
<p>Often more information is required than simply the identity of the desired system call; the exact type and amount of information vary by OS and by call. Three general methods are used to pass parameters to the OS. Compare them in the table, paying attention to the last column:</p>
<table class="t">
  <tr><th>Method</th><th>How</th><th>Notes</th></tr>
  <tr><td><b>Registers</b></td><td>the parameters are passed in CPU registers</td><td>the simplest; in some cases there may be more parameters than registers</td></tr>
  <tr><td><b>Block (table)</b> in memory</td><td>the parameters are stored in a block in memory, and the <b>address of the block</b> is passed in a register</td><td>the approach taken by <b>Linux and Solaris</b></td></tr>
  <tr><td><b>Stack</b></td><td>the program <b>pushes</b> the parameters onto the stack; the operating system <b>pops</b> them off</td><td>—</td></tr>
</table>
<p>The trade-off: <b>registers</b> are the simplest and fastest, but a CPU has only a few of them. The <b>block</b> and <b>stack</b> methods keep the parameters in memory, so they <b>do not limit the number or length</b> of the parameters being passed. The block method still uses one register — only for the address of the block.</p>
<p><b>Parameter passing via table</b>, as in the diagram: the user program stores the parameters in a table X; it loads the address of X into a register; it executes system call 13; the code for system call 13 in the OS reads the register, finds X, and uses the parameters from table X.</p>
<div data-viz="0"></div>
<p>Now we know how a call is made and how its arguments travel. Which calls exist? Next: the types of system calls.</p>`,
      viz: [{ name: 'graph', caption: 'Parameter passing via table', props: { w: 600, h: 230,
        nodes: [
          { id: 'up', label: 'user program', sub: 'X: parameters for call', x: 110, y: 150, w: 170, h: 60, tone: 'c2' },
          { id: 'reg', label: 'register', sub: 'X (address of the table)', x: 300, y: 45, w: 150, tone: 'warn' },
          { id: 'os', label: 'code for system call 13', sub: 'use parameters from table X', x: 480, y: 150, w: 190, h: 60, tone: 'acc' }],
        edges: [
          { from: 'up', to: 'reg', label: 'load address X' },
          { from: 'reg', to: 'os' },
          { from: 'up', to: 'os', label: 'system call 13' }] } }],
      takeaway: `Three methods: registers (simplest, but limited in number); a block/table in memory whose address goes in a register (Linux, Solaris); the stack (the program pushes, the OS pops). Block and stack do not limit the number or length of parameters.`,
      exam: `The three methods; which one Linux and Solaris use (block/table, according to the slide); which methods do not limit the number of parameters.`
    },
    {
      id: 'types',
      h: 'Types of system calls',
      why: 'the full catalogue, grouped',
      lead: `An OS offers hundreds of system calls. They become easy to remember once you see that they fall into six groups — and that each group serves one of the services from the services list.`,
      html: `
<p>Read the table as "what can a program ask the OS to do?". Each row is one group, and most calls come in pairs: create/delete, open/close, get/set, request/release, send/receive.</p>
<table class="t">
  <tr><th>Type</th><th>Calls</th></tr>
  <tr><td><b>Process control</b></td><td>create process, terminate process; end, abort; load, execute; get process attributes, set process attributes; wait for time; wait event, signal event; allocate and free memory; dump memory if error; debugger for determining bugs, single-step execution; <b>locks</b> for managing access to shared data between processes</td></tr>
  <tr><td><b>File management</b></td><td>create file, delete file; open, close file; read, write, reposition; get and set file attributes</td></tr>
  <tr><td><b>Device management</b></td><td>request device, release device; read, write, reposition; get device attributes, set device attributes; logically attach or detach devices</td></tr>
  <tr><td><b>Information maintenance</b></td><td>get time or date, set time or date; get system data, set system data; get and set process, file or device attributes</td></tr>
  <tr><td><b>Communications</b></td><td>create, delete communication connection; send, receive messages in the <b>message-passing model</b>, to a host name or process name (from client to server); in the <b>shared-memory model</b>, create and gain access to memory regions; transfer status information; attach and detach remote devices</td></tr>
  <tr><td><b>Protection</b></td><td>control access to resources; get and set permissions; allow and deny user access</td></tr>
</table>
<p>Notice the link with the services: process control serves <i>program execution</i>, file management serves <i>file-system manipulation</i>, device management serves <i>I/O operations</i>, communications serves <i>communications</i>, and protection serves <i>protection and security</i>. Two items in process control are less obvious: <b>dump memory if error</b> (write the memory content to a file for later analysis) and <b>locks</b> for shared data.</p>
<p>The same groups exist in every OS, but the names differ. The slides compare Windows and Unix; read across each row — the Windows names are long and descriptive, the Unix names are short:</p>
<table class="t">
  <tr><th>Type</th><th>Windows</th><th>Unix</th></tr>
  <tr><td>Process control</td><td><code>CreateProcess()</code><br><code>ExitProcess()</code><br><code>WaitForSingleObject()</code></td><td><code>fork()</code><br><code>exit()</code><br><code>wait()</code></td></tr>
  <tr><td>File management</td><td><code>CreateFile()</code><br><code>ReadFile()</code><br><code>WriteFile()</code><br><code>CloseHandle()</code></td><td><code>open()</code><br><code>read()</code><br><code>write()</code><br><code>close()</code></td></tr>
  <tr><td>Device management</td><td><code>SetConsoleMode()</code><br><code>ReadConsole()</code><br><code>WriteConsole()</code></td><td><code>ioctl()</code><br><code>read()</code><br><code>write()</code></td></tr>
  <tr><td>Information maintenance</td><td><code>GetCurrentProcessID()</code><br><code>SetTimer()</code><br><code>Sleep()</code></td><td><code>getpid()</code><br><code>alarm()</code><br><code>sleep()</code></td></tr>
  <tr><td>Communications</td><td><code>CreatePipe()</code><br><code>CreateFileMapping()</code><br><code>MapViewOfFile()</code></td><td><code>pipe()</code><br><code>shm_open()</code><br><code>mmap()</code></td></tr>
  <tr><td>Protection</td><td><code>SetFileSecurity()</code><br><code>InitializeSecurityDescriptor()</code><br><code>SetSecurityDescriptorGroup()</code></td><td><code>chmod()</code><br><code>umask()</code><br><code>chown()</code></td></tr>
</table>
<p>Pairs worth memorizing: <code>CreateProcess()</code> ↔ <code>fork()</code>, <code>CreateFile()</code> ↔ <code>open()</code>, <code>SetConsoleMode()</code> ↔ <code>ioctl()</code>, <code>SetTimer()</code> ↔ <code>alarm()</code>, <code>CreatePipe()</code> ↔ <code>pipe()</code>; and the Unix protection calls <code>chmod()</code>, <code>umask()</code>, <code>chown()</code> (change permissions, set the default permission mask, change owner). Note that <code>read()</code> and <code>write()</code> appear in both file and device management: Unix treats devices like files.</p>
<p>Programmers rarely use these names directly, though. They call library functions such as <code>printf()</code>, and the library makes the system call for them. Next: how that works.</p>`,
      takeaway: `Six types: process control, file management, device management, information maintenance, communications (message passing or shared memory), protection. Windows ↔ Unix: CreateProcess ↔ fork, ExitProcess ↔ exit, WaitForSingleObject ↔ wait, CreateFile ↔ open, SetConsoleMode ↔ ioctl, GetCurrentProcessID ↔ getpid, CreatePipe ↔ pipe; Unix protection: chmod, umask, chown.`,
      exam: `The six categories and their calls; matching Windows ↔ Unix (CreateProcess ↔ fork, CreateFile ↔ open, SetConsoleMode ↔ ioctl; chmod/umask/chown = protection).`
    },
    {
      id: 'clib',
      h: 'The C library and the read() API',
      why: 'library call vs system call',
      lead: `A C programmer writes printf(), not a system call. Between the two sits the standard C library, which turns convenient function calls into the raw system calls of the kernel.`,
      html: `
<p>The <b>standard C library</b> provides a portion of the system-call interface for many versions of UNIX and Linux. Follow the slide example:</p>
<pre class="code" data-lang="c">#include &lt;stdio.h&gt;
int main()
{
    printf("Greetings");   /* library call (user mode) */
    return 0;
}</pre>
<ol class="steps">
  <li>The program, in <b>user mode</b>, invokes the <b>library call</b> <code>printf("Greetings")</code>.</li>
  <li>The C library intercepts this call and invokes the necessary <b>system call</b> — here <code>write()</code>.</li>
  <li><code>write()</code> runs in <b>kernel mode</b> and outputs the text.</li>
  <li>The value returned by <code>write()</code> is passed back by the library to the user program.</li>
</ol>
<div data-viz="0"></div>
<p>So <code>printf()</code> is not a system call: it is a library function that <i>uses</i> one.</p>
<p><b>Example of a standard API: <code>read()</code>.</b> In UNIX and Linux the documentation of an API function is shown by <code>man read</code>. Its prototype is:</p>
<pre class="code" data-lang="c">#include &lt;unistd.h&gt;

ssize_t read(int fd, void *buf, size_t count);</pre>
<p>Read the prototype from left to right with the table:</p>
<table class="t">
  <tr><th>Part</th><th>Meaning</th></tr>
  <tr><td><code>ssize_t</code></td><td>the return value</td></tr>
  <tr><td><code>read</code></td><td>the function name</td></tr>
  <tr><td><code>int fd</code></td><td>the <b>file descriptor</b> to read from (a small number the OS gives a program when it opens a file)</td></tr>
  <tr><td><code>void *buf</code></td><td>the buffer into which the data will be read</td></tr>
  <tr><td><code>size_t count</code></td><td>the <b>maximum</b> number of bytes to read into the buffer</td></tr>
</table>
<p>The header <code>unistd.h</code> defines the types <code>ssize_t</code> and <code>size_t</code>. The return value tells you what happened, and a program must check it every time:</p>
<ul>
  <li>on success, the <b>number of bytes read</b> (it can be smaller than <code>count</code>, e.g. near the end of the file);</li>
  <li><b>0</b> = <b>end of file</b>: nothing is left to read;</li>
  <li><b>−1</b> = an <b>error</b> occurred (for example, the file descriptor is not valid).</li>
</ul>
<p>This is exactly the "read until read fails" loop of the copy example: the program keeps calling <code>read()</code> until it returns 0 or −1.</p>
<p>The C library is one example of an API. Why do programmers prefer APIs to raw system calls in general? Next section.</p>`,
      viz: [{ name: 'flow', caption: 'printf() → standard C library → write() system call → result back to the program', props: { dir: 'h', loop: true, steps: [
        { label: 'printf("Greetings")', sub: 'user program', tone: 'c2' },
        { label: 'standard C library', sub: 'user mode', tone: 'warn' },
        { label: 'write() system call', sub: 'kernel mode', tone: 'acc' }] } }],
      takeaway: `printf() is a library call; the C library turns it into the write() system call and passes the result back. read(fd, buf, count) reads up to count bytes from file descriptor fd into buf and returns the number of bytes read, 0 at end of file, −1 on error.`,
      exam: `printf = library call, write = system call; the signature of read() and its return values (n bytes, 0 = end of file, −1 = error).`
    },
    {
      id: 'api',
      h: 'Application Programming Interface (API)',
      why: 'why programmers use APIs',
      lead: `The C library showed one API at work. Now the general idea: an API is a stable set of functions that hides the system calls underneath — and that brings real advantages.`,
      html: `
<p>An <b>API</b> is a set of functions and procedures that allows the creation of applications that access the features or data of an operating system, application or other service. From the programmer’s point of view there are <b>no major distinctions between library functions and system calls</b>: both are functions you call.</p>
<p>So why put an API between programs and system calls? The slides give three advantages:</p>
<ul>
  <li><b>Abstraction</b>: a higher level of abstraction lets developers use complex system functionality without understanding the underlying implementation details. This simplifies development and reduces the likelihood of errors.</li>
  <li><b>Portability</b>: an API can offer a consistent interface across different platforms and operating systems, so code written with it can often be reused on different systems without modification — while system calls are typically specific to one OS.</li>
  <li><b>Ease of use</b>: APIs usually come with comprehensive documentation and libraries, and can provide additional features, such as error handling and data validation, that raw system calls do not have.</li>
</ul>
<p><b>Why applications are OS specific.</b> Portability matters because an app compiled on one system is usually not executable on other operating systems: each OS provides its own unique system calls, its own file formats, etc. A program written to a common API can at least be recompiled for another system instead of rewritten.</p>
<p>The most common APIs — note that each belongs to a platform:</p>
<table class="t">
  <tr><th>API</th><th>Platform</th></tr>
  <tr><td><b>Win32 API</b></td><td>Windows</td></tr>
  <tr><td><b>POSIX API</b></td><td>POSIX-based systems, including virtually all versions of UNIX, Linux and Mac OS X</td></tr>
  <tr><td><b>Java API</b></td><td>the Java virtual machine (<b>JVM</b>)</td></tr>
</table>
<p><b>API endpoints.</b> The word API is also used for services on a network. An <b>API endpoint</b> is a digital location where an API receives API calls, also known as <b>API requests</b>, for resources on its server. In a <b>REST API</b> the client sends a request with a method — GET (read), POST (create), PUT (update), DELETE (remove) — and receives data, usually as JSON or XML; the REST API in turn accesses a database. The address of an endpoint has a fixed structure; read the table column by column:</p>
<table class="t">
  <tr><th colspan="7">RESTful endpoint: http://localhost:1234/hrservices/v1/users/{id}</th></tr>
  <tr><td>http</td><td>localhost</td><td>1234</td><td>hrservices</td><td>v1</td><td>users</td><td>{id}</td></tr>
  <tr><td><b>PROTOCOL</b></td><td><b>HOST</b> (domain name)</td><td><b>PORT</b></td><td><b>APPLICATION CONTEXT</b></td><td><b>VERSION</b></td><td><b>RESOURCE</b></td><td><b>PARAMETER</b></td></tr>
</table>
<p>The parts go from general to specific: how to talk (protocol), which machine (host), which program on it (port), which application, which version of its API, which kind of resource, and finally which single item.</p>
<p>Win32 belongs to Windows and the Java API to the JVM. One API was designed precisely to be shared by many operating systems — POSIX, next section.</p>`,
      takeaway: `An API is a set of functions for building applications on top of an OS or service; to the programmer, library functions and system calls are both just functions. Advantages: abstraction, portability, ease of use. Applications are OS specific because system calls and file formats differ. Common APIs: Win32 (Windows), POSIX (UNIX, Linux, Mac OS X), Java API (JVM). An API endpoint is where an API receives requests.`,
      exam: `The three advantages of APIs; why applications are OS specific; Win32 / POSIX / Java API; the parts of a RESTful endpoint.`
    },
    {
      id: 'posix',
      h: 'POSIX — the Portable Operating System Interface',
      why: 'one standard for all Unix systems',
      lead: `There are many Unix-like systems. If each one had its own API, a program would have to be rewritten for each of them. POSIX solves this with a common standard.`,
      html: `
<p><b>POSIX</b> is a family of standards specified by the <b>IEEE</b> to maintain software compatibility between different operating systems, in particular between Unix variants. It defines three things:</p>
<ul>
  <li>the available <b>API</b> — for example the <b>POSIX C library</b> for the C language;</li>
  <li>the <b>command-line interface</b> usable for shells — such as <b>bash</b> and <b>dash</b> (dash is the more faithful to POSIX);</li>
  <li>other fundamental <b>commands</b>: <code>grep</code>, <code>sed</code>, <code>awk</code>, <code>cat</code>, etc.</li>
</ul>
<p>The consequence: code that uses only the standard libraries (present on every OS) and those provided by POSIX, with only the syntax defined by the standard, <b>will compile on all Unix systems</b>.</p>
<p>The diagram makes this precise. A C application program can use three kinds of library: the <b>C Standard Library</b>, the <b>POSIX Library</b>, and a <b>non-POSIX library</b> (specific to one system). Only the part of the program that uses the first two is <b>portable</b>; any call to a non-POSIX library ties the program to one system.</p>
<div data-viz="0"></div>
<p>Some headers of the <b>C POSIX library</b>, from the slide. Skim the right column: each header covers an OS service you have already met — asynchronous I/O, networking, directories, files, users and groups.</p>
<table class="t">
  <tr><th>Header</th><th>Description</th></tr>
  <tr><td><code>&lt;aio.h&gt;</code></td><td>asynchronous input and output</td></tr>
  <tr><td><code>&lt;arpa/inet.h&gt;</code></td><td>functions for manipulating numeric IP addresses (part of Berkeley sockets)</td></tr>
  <tr><td><code>&lt;assert.h&gt;</code></td><td>verify assumptions</td></tr>
  <tr><td><code>&lt;ctype.h&gt;</code></td><td>character types</td></tr>
  <tr><td><code>&lt;dirent.h&gt;</code></td><td>opening and listing directories</td></tr>
  <tr><td><code>&lt;dlfcn.h&gt;</code></td><td>dynamic linking</td></tr>
  <tr><td><code>&lt;errno.h&gt;</code></td><td>retrieving the error number</td></tr>
  <tr><td><code>&lt;fcntl.h&gt;</code></td><td>file opening, locking and other operations</td></tr>
  <tr><td><code>&lt;fnmatch.h&gt;</code> / <code>&lt;glob.h&gt;</code></td><td>filename matching / pathname "globbing" (pattern matching)</td></tr>
  <tr><td><code>&lt;ftw.h&gt;</code></td><td>file tree traversal</td></tr>
  <tr><td><code>&lt;grp.h&gt;</code></td><td>user group information and control</td></tr>
  <tr><td><code>&lt;inttypes.h&gt;</code></td><td>fixed-size integer types</td></tr>
</table>
<p>Libraries and APIs are tools for programmers. The OS also ships ready-made programs for everybody — the system services, next.</p>`,
      viz: [{ name: 'graph', caption: 'Portable = the part of a C program that uses only the C Standard Library and the POSIX Library', props: { w: 600, h: 300,
        nodes: [
          { id: 'app', label: 'C application program', sub: 'portable part', x: 300, y: 40, w: 260, h: 50, tone: 'c2' },
          { id: 'cstd', label: 'C Standard Library', x: 470, y: 140, w: 160, tone: 'ok' },
          { id: 'posix', label: 'POSIX Library', x: 330, y: 220, w: 150, tone: 'acc' },
          { id: 'np', label: 'Non-POSIX Library', x: 130, y: 220, w: 150, tone: 'bad' },
          { id: 'os', label: 'Operating System', x: 240, y: 280, w: 340, h: 34, tone: 'muted' }],
        edges: [
          { from: 'app', to: 'np', both: true }, { from: 'app', to: 'posix', both: true }, { from: 'app', to: 'cstd', both: true },
          { from: 'cstd', to: 'posix', both: true },
          { from: 'posix', to: 'os', both: true }, { from: 'np', to: 'os', both: true }] } }],
      takeaway: `POSIX is a family of IEEE standards for compatibility between Unix variants. It defines an API (the POSIX C library), a command-line interface for shells (bash, dash) and fundamental commands (grep, sed, awk, cat). Code that uses only the C standard library and POSIX compiles on all Unix systems.`,
      exam: `Who specifies POSIX (IEEE); what POSIX defines (API, shell CLI, fundamental commands); why POSIX code is portable between Unix systems.`
    },
    {
      id: 'system-services',
      h: 'System services (system programs)',
      why: 'the programs that come with the OS',
      lead: `Next to the system calls, every OS ships a set of programs that make the system usable: file tools, compilers, loaders, daemons. Module 1 called them system programs; these slides call them system services.`,
      html: `
<p><b>System services</b> (system programs) provide a convenient environment for program development and execution. Some of them are simply <b>user interfaces to system calls</b> (a "delete file" command does little more than call the delete system call); others are considerably more complex (a compiler). The slides divide them into seven groups — read the table to see what each group does:</p>
<table class="t">
  <tr><th>Category</th><th>What it does</th></tr>
  <tr><td><b>File management</b></td><td>create, delete, copy, rename, print, dump, list, and generally manipulate files and directories</td></tr>
  <tr><td><b>Status information</b></td><td>some programs ask the system for information — date, time, amount of available memory, disk space, number of users; others provide detailed performance, logging and debugging information; typically these programs format and print the output to the terminal or other output devices; some systems implement a <b>registry</b>, used to store and retrieve configuration information (status information is sometimes stored in a file)</td></tr>
  <tr><td><b>Programming-language support</b></td><td>compilers, assemblers, debuggers and interpreters (sometimes provided)</td></tr>
  <tr><td><b>Program loading and execution</b></td><td>absolute loaders, relocatable loaders, linkage editors and overlay-loaders; debugging systems for higher-level and machine language</td></tr>
  <tr><td><b>Communications</b></td><td>the mechanism for creating virtual connections among processes, users and computer systems: sending messages to one another’s screens, browsing web pages, sending e-mail, logging in remotely, transferring files from one machine to another</td></tr>
  <tr><td><b>Background services</b></td><td>launched at boot time; facilities like disk checking, process scheduling, error logging, printing; run in user context; known as services, subsystems, daemons</td></tr>
  <tr><td><b>Application programs</b></td><td>do not pertain to the system; run by users; launched by command line, mouse click or finger poke; not typically considered part of the OS</td></tr>
</table>
<p>Two rows need attention. <b>Background services</b> start at boot time: some are only for system startup and then terminate, others run from system boot to shutdown. They run in <b>user context, not kernel context</b> — they are ordinary processes, not part of the kernel — and are known as <b>services</b>, <b>subsystems</b> or <b>daemons</b>. <b>Application programs</b> are in the list only to mark the border: they are run by users and are not part of the OS.</p>
<p>One group, <b>program loading and execution</b>, deserves a closer look, because it explains how source code becomes a running program. That is the next section.</p>`,
      takeaway: `System services: file management; status information (some systems keep configuration in a registry); programming-language support; program loading and execution; communications; background services (daemons — started at boot, running in user context, not kernel context); application programs (not part of the OS).`,
      exam: `The categories of system services; background services = daemons in user context; the registry.`
    },
    {
      id: 'linkers',
      h: 'Linkers, loaders and the assembler',
      why: 'from source code to a running program',
      lead: `A program on disk is just a file. Before it can run, several tools must turn the source code into machine code, join it with libraries, and place it in memory at real addresses.`,
      html: `
<p>The path from source code to a running program, step by step (slide "Linkers and Loaders"):</p>
<ol class="steps">
  <li>Source code is compiled into <b>object files</b> designed to be loaded into <b>any</b> physical memory location — a <b>relocatable object file</b> (its final addresses are not fixed yet).</li>
  <li>The <b>linker</b> combines these object files into a single binary <b>executable file</b>. It also brings in <b>libraries</b>.</li>
  <li>The program now resides on secondary storage as a binary executable. To be executed, it must be brought into memory by the <b>loader</b>.</li>
  <li><b>Relocation</b> assigns final addresses to the program parts and adjusts the code and data in the program to match those addresses.</li>
</ol>
<p>With gcc on Linux, each line below performs one of these steps — compare it with the diagram "The Role of the Linker and Loader":</p>
<pre class="code" data-lang="bash">gcc -c main.c            # compiler: main.c → main.o (object file)
gcc -o main main.o -lm   # linker: main.o + other object files + libm (math library) → main
./main                   # loader: executable → program in memory (+ dynamically linked libraries)</pre>
<div data-viz="0"></div>
<p>Object and executable files have <b>standard formats</b>, so the operating system knows how to load and start them.</p>
<p><b>The assembler.</b> The compile step hides one more tool. Look at the four boxes: the <b>compiler</b> generates <b>assembly code</b> (machine instructions written as readable text); the <b>assembler</b> translates the assembly code into <b>machine code</b> and stores the result in an <b>object file</b>, which contains the binary representation of the program; the <b>linker</b> links all the libraries; the <b>loader</b> loads everything into memory.</p>
<div data-viz="1"></div>
<p>Step 2 hides an important choice: should the linker copy the libraries into the executable, or only record which libraries are needed? Next section.</p>`,
      viz: [
        { name: 'flow', caption: 'The role of the linker and loader', props: { dir: 'v', steps: [
          { label: 'source program', sub: 'main.c', tone: 'c2' },
          { label: 'compiler', sub: 'gcc -c main.c', tone: 'muted' },
          { label: 'object file', sub: 'main.o', tone: 'c2' },
          { label: 'linker', sub: 'gcc -o main main.o -lm (+ other object files)', tone: 'warn' },
          { label: 'executable file', sub: 'main', tone: 'c2' },
          { label: 'loader', sub: './main (+ dynamically linked libraries)', tone: 'acc' },
          { label: 'program in memory', tone: 'ok' }] } },
        { name: 'flow', caption: 'Compiler → Assembler → Linker → Loader', props: { dir: 'h', steps: [
          { label: 'Compiler', sub: 'generates assembly code', tone: 'c1' },
          { label: 'Assembler', sub: 'generates machine code', tone: 'c2' },
          { label: 'Linker', sub: 'link all libraries', tone: 'c3' },
          { label: 'Loader', sub: 'loads everything in memory', tone: 'c4' }] } }
      ],
      takeaway: `Compiler → assembly code; assembler → machine code in a relocatable object file; linker → one executable file, including libraries; loader → program in memory. Relocation assigns the final addresses. gcc -c = compile, gcc -o … -lm = link, ./main = load and run.`,
      exam: `What each gcc command does; relocatable object file; relocation; the role of the assembler.`
    },
    {
      id: 'static-dynamic',
      h: 'Static vs dynamic linking',
      why: 'copy the library or share it?',
      lead: `Hundreds of programs use the same libraries. If every executable carried its own copy, disks and memory would be full of identical code. Dynamic linking shares a single copy.`,
      html: `
<p>Modern general-purpose systems <b>do not link libraries into executables</b>. Instead, <b>dynamically linked libraries</b> (in Windows, <b>DLLs</b>) are loaded <b>as needed</b> and <b>shared</b> by all programs that use the same version of that library — the library is loaded once.</p>
<p>The diagram shows the difference: with static linking each application has its own copy of the library; with dynamic linking applications A and B use one and the same library.</p>
<div data-viz="0"></div>
<p>Each approach has a price. Read the table row by row; each row is one point of comparison:</p>
<table class="t">
  <tr><th>Static linking</th><th>Dynamic linking</th></tr>
  <tr><td>copies all the libraries the program needs directly into the final executable</td><td>external or shared libraries are referenced by name and linked at run time</td></tr>
  <tr><td>makes it easier to distribute binaries to different environments and OSes</td><td>lower maintenance and support costs</td></tr>
  <tr><td>slightly faster start-up</td><td>library routines can be updated <b>without relinking</b> the program</td></tr>
  <tr><td>programs are much larger and use more resources</td><td><b>smaller</b> file size</td></tr>
  <tr><td>changes in external libraries are not reflected in the executable automatically</td><td>library changes can cause <b>compatibility issues</b></td></tr>
</table>
<p>The conclusion: dynamic linking saves space and makes updates easy (fix the library once and every program benefits, with no relinking), but it creates a dependency — if the library changes in an incompatible way, programs can break. Static linking makes a program self-contained and slightly faster to start, at the cost of size.</p>
<p>So far we have looked at ordinary programs. But the OS kernel is a program too: it must also be built and loaded. That is the topic of the next two sections.</p>`,
      viz: [{ name: 'graph', caption: 'Static: each application has its own copy · Dynamic: one library shared by all', props: { w: 600, h: 200,
        nodes: [
          { id: 's1', label: 'Static Library', x: 75, y: 45, tone: 'ok' }, { id: 's2', label: 'Static Library', x: 215, y: 45, tone: 'ok' },
          { id: 'a1', label: 'Application A', x: 75, y: 160, tone: 'muted' }, { id: 'b1', label: 'Application B', x: 215, y: 160, tone: 'muted' },
          { id: 'd', label: 'Dynamic Library', x: 455, y: 45, w: 130, tone: 'acc' },
          { id: 'a2', label: 'Application A', x: 385, y: 160, tone: 'muted' }, { id: 'b2', label: 'Application B', x: 525, y: 160, tone: 'muted' }],
        edges: [
          { from: 's1', to: 'a1' }, { from: 's2', to: 'b1' },
          { from: 'd', to: 'a2' }, { from: 'd', to: 'b2' }] } }],
      takeaway: `Static linking copies the libraries into the executable: larger files, slightly faster start-up, easy distribution, but library changes are not picked up. Dynamic linking (DLLs in Windows) loads shared libraries at run time: smaller files, updates without relinking, lower maintenance, but possible compatibility issues.`,
      exam: `Properties of static vs dynamic linking (size, start-up, updating without relinking, compatibility issues); DLL.`
    },
    {
      id: 'building',
      h: 'Building an OS: compiling the Linux kernel',
      why: 'the OS is a program too',
      lead: `Like any program, an operating system starts as source code. Usually it comes pre-installed, but it can also be configured and compiled for a specific machine — Linux is the classic example.`,
      html: `
<p>Operating systems are generally designed to run on a <b>class</b> of systems with a variety of peripherals, not on one exact machine. Commonly the OS is already installed on a purchased computer, but you can build and install other operating systems. Generating an OS from scratch takes five steps:</p>
<ol class="steps">
  <li><b>write</b> the operating-system source code;</li>
  <li><b>configure</b> the OS for the system on which it will run (choose the drivers and features for this hardware);</li>
  <li><b>compile</b> the operating system;</li>
  <li><b>install</b> the operating system;</li>
  <li><b>boot</b> the computer and its new operating system.</li>
</ol>
<p><b>Building and booting Linux</b> follows exactly this plan, except that the source code is downloaded instead of written. Match each command with a step:</p>
<pre class="code" data-lang="bash"># 1. download the Linux source code from http://www.kernel.org
make menuconfig       # 2. configure the kernel
make                  # 3. compile the kernel → vmlinuz (the kernel image)
make modules          # 4. compile the kernel modules
make modules_install  # 5. install the kernel modules
make install          # 6. install the new kernel on the system</pre>
<div data-viz="0"></div>
<div class="callout note"><b>vmlinuz</b> is the <b>kernel image</b>: the compiled kernel as one file, produced by <code>make</code>. <b>Kernel modules</b> are parts of the kernel (for example drivers) compiled separately so that they can be loaded only when needed — we meet them again in "Modules (LKMs)".</div>
<div class="callout warn">The slide says that <code>make modules_install</code> installs the kernel modules "into vmlinuz". In practice the modules are copied into a system directory next to the kernel, not inside the image file. For the exam, just remember: <code>make modules_install</code> installs the kernel modules.</div>
<p>After <code>make install</code> the new kernel is on disk. What happens when the computer is switched on and has to find and start it? Next section.</p>`,
      viz: [{ name: 'flow', caption: 'Building the Linux kernel', props: { dir: 'h', steps: [
        { label: 'kernel.org', sub: 'download source', tone: 'muted' },
        { label: 'make menuconfig', sub: 'configure', tone: 'c2' },
        { label: 'make', sub: 'compile → vmlinuz', tone: 'acc' },
        { label: 'make modules', sub: '+ modules_install', tone: 'c3' },
        { label: 'make install', sub: 'install kernel', tone: 'ok' }] } }],
      takeaway: `Generating an OS: write → configure → compile → install → boot. Linux: download the source from kernel.org; make menuconfig (configure); make (compile → vmlinuz, the kernel image); make modules; make modules_install; make install.`,
      exam: `Which command does what; vmlinuz is the kernel image produced by make.`
    },
    {
      id: 'boot',
      h: 'System boot',
      why: 'how the hardware finds the kernel',
      lead: `At power-on the hardware knows nothing about files or operating systems; it can only start executing at one fixed address. A chain of loaders, each smarter than the one before, bridges the gap from that address to a running kernel.`,
      html: `
<p>When power is initialized on the system, execution starts at a <b>fixed memory location</b>. The operating system must be made available to the hardware so that the hardware can start it. Step by step:</p>
<ol class="steps">
  <li>A small piece of code — the <b>bootstrap loader</b>, the <b>BIOS</b> — stored in <b>ROM</b> or <b>EEPROM</b> (memory that survives power-off) runs from that fixed location.</li>
  <li>Sometimes the process has two steps: the ROM code loads a <b>boot block</b> from a fixed location on disk, and the boot block loads the bootstrap loader from disk.</li>
  <li>The bootstrap loader <b>locates the kernel, loads it into memory and starts it</b>.</li>
  <li>The kernel loads, and the system is then running.</li>
</ol>
<p>Why two steps? ROM is small and hard to change, so it holds only the minimum needed to read one block from the disk; the smarter loader on the disk can then be large and easy to update.</p>
<p>Two modern details:</p>
<ul>
  <li>Modern systems replace BIOS with <b>UEFI</b> (Unified Extensible Firmware Interface).</li>
  <li>The common bootstrap loader <b>GRUB</b> allows the selection of the kernel from multiple disks, kernel versions and kernel options. Boot loaders frequently allow various <b>boot states</b>, such as <b>single user mode</b> (a minimal mode for repairs, in which only the administrator works).</li>
</ul>
<div data-viz="0"></div>
<div class="callout note">This is the same chain as in Module 1 ("Computer startup"): BIOS/UEFI → bootloader (GRUB) → kernel → systemd. There the focus was on what each stage does; here it is on how the firmware gets to the kernel. (Module 1’s slide says the bootstrap is in ROM or EPROM, this one says ROM or EEPROM: both are kinds of nonvolatile, reprogrammable ROM.)</div>
<p>Once the system is running, things will sometimes go wrong: programs crash, the kernel crashes, or everything is just slow. How do we find out why? Next: debugging.</p>`,
      viz: [{ name: 'flow', caption: 'System boot', props: { dir: 'h', steps: [
        { label: 'Power on', sub: 'fixed memory location', tone: 'muted' },
        { label: 'BIOS / UEFI', sub: 'ROM / EEPROM', tone: 'warn' },
        { label: 'boot block → bootstrap loader', sub: 'GRUB', tone: 'c2' },
        { label: 'kernel loaded', sub: 'system running', tone: 'ok' }] } }],
      takeaway: `Execution starts at a fixed memory location. The bootstrap loader (BIOS) in ROM/EEPROM locates the kernel, loads it into memory and starts it — sometimes via a boot block loaded first. UEFI replaces BIOS in modern systems. GRUB lets you choose the kernel (disk, version, options) and boot states such as single user mode.`,
      exam: `Where the bootstrap loader is stored (ROM/EEPROM); the two-step boot via a boot block; UEFI instead of BIOS; what GRUB can do.`
    },
    {
      id: 'debugging',
      h: 'Debugging, performance tuning and tracing',
      why: 'finding out what went wrong',
      lead: `A system that runs many processes and makes huge numbers of system calls will sometimes fail or slow down. The OS must help to find the bugs and the bottlenecks — by leaving evidence behind and by offering tools to observe the system.`,
      html: `
<p><b>Debugging</b> is finding and fixing errors, or <b>bugs</b>; it also includes <b>performance tuning</b>. The OS helps by leaving evidence when something fails:</p>
<ul>
  <li>the OS generates <b>log files</b> containing error information;</li>
  <li>the failure of an <b>application</b> can generate a <b>core dump</b> file capturing the memory of the <b>process</b>;</li>
  <li>the failure of the <b>operating system</b> can generate a <b>crash dump</b> file containing the <b>kernel</b> memory.</li>
</ul>
<div class="callout key">Memory trick: <b>core dump = one process</b> crashed; <b>crash dump = the kernel</b> crashed.</div>
<p>Beyond crashes, <b>performance tuning</b> can optimize system performance. It sometimes uses <b>trace listings</b> of activities, recorded for later analysis. <b>Profiling</b> is the periodic sampling of the <b>instruction pointer</b> (the address of the instruction being executed) to look for statistical trends: if most samples fall inside one function, that is where the time is spent.</p>
<div class="callout note"><b>Kernighan’s Law</b> says, in short, that debugging is twice as hard as writing the code; so if you write code as cleverly as you possibly can, you are by definition not smart enough to debug it. The lesson: write simple, clear code.</div>
<p><b>Performance tuning</b> improves performance by removing <b>bottlenecks</b> (the slowest part, which limits the whole system). To find them, the OS must provide means of computing and displaying measures of system behaviour — for example the <code>top</code> program or the Windows <b>Task Manager</b>.</p>
<p><b>Tracing</b> collects data for a specific event, such as the steps involved in a system call invocation. The slides list four tools; each looks at a different level of the system:</p>
<table class="t">
  <tr><th>Tool</th><th>Purpose</th></tr>
  <tr><td><code>strace</code></td><td>traces the system calls invoked by a process</td></tr>
  <tr><td><code>gdb</code></td><td>source-level debugger</td></tr>
  <tr><td><code>perf</code></td><td>a collection of Linux performance tools</td></tr>
  <tr><td><code>tcpdump</code></td><td>collects network packets</td></tr>
</table>
<p><code>strace</code> connects directly to this module: running <code>strace cp in.txt out.txt</code> prints the real system-call sequence of the copy example.</p>
<p>Debugging a kernel is much harder when all of it is one huge program. That leads to the last big question of the module: how should an OS be structured internally?</p>`,
      takeaway: `Debugging = finding and fixing bugs, plus performance tuning. Evidence: log files; core dump = memory of a failed process; crash dump = kernel memory after an OS failure. Profiling samples the instruction pointer. Tuning removes bottlenecks (top, Task Manager). Tracing tools: strace (system calls), gdb (source-level debugger), perf (Linux performance tools), tcpdump (network packets).`,
      exam: `Core dump (process) vs crash dump (kernel); profiling; which tool does what (strace, gdb, perf, tcpdump).`
    },
    {
      id: 'monolithic',
      h: 'OS structure: monolithic kernels',
      why: 'everything in one kernel',
      lead: `A general-purpose OS is a very large program, and there are several ways to organize it. The simplest is to put all OS functions into one big kernel: the monolithic structure of the original UNIX.`,
      html: `
<p>The slides name three main ways to structure an OS: <b>monolithic</b> (UNIX), <b>layered</b> (an abstraction) and <b>microkernel</b> (Mach). Two more, <b>modules</b> and <b>hybrid</b> systems, follow. We start with the oldest.</p>
<p><b>Monolithic structure — original UNIX.</b> Limited by the hardware functionality of its time, the original UNIX operating system had limited structuring. It consists of two separable parts:</p>
<ul>
  <li><b>systems programs</b> (shells, compilers, libraries);</li>
  <li><b>the kernel</b>: <b>everything below the system-call interface and above the physical hardware</b>. It provides the file system, CPU scheduling, memory management and other operating-system functions — <b>a large number of functions for one level</b>.</li>
</ul>
<p>The diagram "Traditional UNIX System Structure" shows this; the slide describes it as "beyond simple but not fully layered". Read it from top to bottom: the users; shells, commands, compilers, interpreters and system libraries; the system-call interface; then <b>one big kernel</b> containing signals and terminal handling, the file system and disk drivers, CPU scheduling and virtual memory; then the kernel interface to the hardware; and finally the controllers and devices.</p>
<div data-viz="0"></div>
<p>The strength of this design is <b>speed</b>: inside the kernel one part calls another with an ordinary function call, with very little overhead. The weakness is that such a kernel is hard to implement and to extend, and a bug anywhere in it can bring down the whole system.</p>
<p><b>Linux</b> is also monolithic. Applications (using <b>glibc</b>, the standard C library) call the system-call interface; below it one kernel contains the file systems, the CPU scheduler, networking (TCP/IP), the memory manager, and block devices (disks, read in blocks) and character devices (keyboards, terminals, read as a stream of bytes); device drivers sit at the bottom, on the hardware. But Linux can also load parts of the kernel at run time, so the slide calls it <b>"monolithic plus modular design"</b>.</p>
<div data-viz="1"></div>
<p>The big single kernel is fast but hard to manage. The first idea for bringing order into it is to cut it into layers — next section.</p>`,
      viz: [
        { name: 'layers', caption: 'Traditional UNIX: the kernel between two interfaces', props: { layers: [
          { label: '(the users)', tone: 'muted' },
          { label: 'shells and commands · compilers and interpreters · system libraries', tone: 'c2' },
          { label: 'system-call interface to the kernel', tone: 'warn' },
          { label: 'kernel', sub: 'signals, terminal handling, character I/O, terminal drivers · file system, swapping, block I/O, disk and tape drivers · CPU scheduling, page replacement, demand paging, virtual memory', tone: 'acc' },
          { label: 'kernel interface to the hardware', tone: 'warn' },
          { label: 'terminal controllers, terminals · device controllers, disks and tapes · memory controllers, physical memory', tone: 'muted' }] } },
        { name: 'layers', caption: 'Linux system structure', props: { layers: [
          { label: 'applications', sub: '+ glibc standard c library', tone: 'c2' },
          { label: 'system-call interface', tone: 'warn' },
          { label: 'file systems · CPU scheduler · networks (TCP/IP) · memory manager · block devices · character devices', tone: 'acc' },
          { label: 'device drivers', tone: 'c3' },
          { label: 'hardware', tone: 'muted' }] } }
      ],
      takeaway: `Monolithic (original UNIX): the kernel is everything between the system-call interface and the physical hardware — file system, CPU scheduling, memory management, all at one level. Fast, but hard to extend, and one bug can affect everything. Linux = monolithic plus modular design.`,
      exam: `What the kernel of the original UNIX contains (everything between the system-call interface and the hardware); Linux = monolithic + modular.`
    },
    {
      id: 'layered',
      h: 'Layered approach',
      why: 'split the kernel into levels',
      lead: `One big kernel is hard to understand and to test. The layered approach splits the OS into levels, each one built only on the levels below it.`,
      html: `
<p>In the <b>layered approach</b> the operating system is divided into a number of <b>layers</b> (levels), each built on top of lower layers. The bottom layer (<b>layer 0</b>) is the <b>hardware</b>; the highest (<b>layer N</b>) is the <b>user interface</b>. The slide draws the layers as concentric rings; here they are stacked.</p>
<div data-viz="0"></div>
<p>The rule that makes it work: with modularity, layers are selected so that each one uses the functions (operations) and services of <b>only lower-level layers</b>. This makes building and testing simple: layer 1 can be debugged using only the hardware; once it works, layer 2 can be debugged on top of it, and so on. When an error appears, it must be in the layer currently being tested.</p>
<p>The catch: it is hard to decide which layer goes below which (some functions need each other), and a request from the top must pass through many layers, each adding some overhead. That is why few real systems are purely layered — the slides call the layered structure "an abstraction".</p>
<p>Instead of slicing the kernel into horizontal layers, another idea is to make the kernel itself as small as possible — the microkernel, next.</p>`,
      viz: [{ name: 'layers', caption: 'Layered approach (drawn as concentric rings on the slide)', props: { layers: [
        { label: 'layer N', sub: 'user interface', tone: 'c2' },
        { label: '…', tone: 'muted' },
        { label: 'layer 1', tone: 'acc' },
        { label: 'layer 0', sub: 'hardware', tone: 'muted' }] } }],
      takeaway: `Layered approach: layer 0 = hardware, layer N = user interface; each layer uses only the functions and services of lower layers. Easy to build and debug layer by layer, but hard to order the layers, and requests must cross many layers.`,
      exam: `Layer 0 = hardware, layer N = user interface; each layer uses only lower layers.`
    },
    {
      id: 'microkernel',
      h: 'Microkernels',
      why: 'keep the kernel as small as possible',
      lead: `The monolithic kernel is fast but big and fragile. The microkernel goes the opposite way: keep only the bare minimum in kernel mode and move everything else out into ordinary user-space programs.`,
      html: `
<p>A <b>microkernel</b> moves <b>as much as possible from the kernel into user space</b>. <b>Mach</b> is an example of a microkernel; the Mac OS X kernel (<b>Darwin</b>) is partly based on Mach. Because the services now live in separate user-space programs, they cannot call each other directly: <b>communication takes place between user modules using message passing</b>, through the microkernel.</p>
<p>The diagram "Microkernel System Structure" shows the result. In <b>user mode</b>: the application program, the file system and the device driver — separate processes that talk through <b>messages</b>. In <b>kernel mode</b>, only the microkernel, with three functions: <b>interprocess communication (IPC)</b>, <b>memory management</b> and <b>CPU scheduling</b>. Below it, the hardware.</p>
<div data-viz="0"></div>
<p>For example, when an application wants to read a file, it sends a message to the file-system process; the microkernel delivers it; the file system answers with another message. In a monolithic kernel the same request would be a single function call inside the kernel.</p>
<p>The benefits and the detriment follow directly from "less code in the kernel, more messages":</p>
<div class="cols">
  <div class="pros"><b>+ Benefits</b><ul><li><b>easier to extend</b> a microkernel: a new service is a new user-space program</li><li><b>easier to port</b> the OS to new architectures: little kernel code to rewrite</li><li><b>more reliable</b>: less code is running in kernel mode, so a failing service does not take the kernel down</li><li><b>more secure</b></li></ul></div>
  <div class="cons"><b>− Detriment</b><ul><li><b>performance overhead</b> of user space to kernel space communication: every request becomes several messages and mode switches</li></ul></div>
</div>
<p>The slide "Microkernel VS Monolithic kernel" puts the two side by side. Look at which components sit above and which below the border between user space and kernel space:</p>
<table class="t">
  <tr><th></th><th>Microkernel</th><th>Monolithic kernel</th></tr>
  <tr><td>User space</td><td>Application; Application IPC, Unix Server, Device Driver, File Server</td><td>Application</td></tr>
  <tr><td>Kernel space</td><td>Basic IPC, Virtual Memory, Scheduling</td><td>VFS (virtual file system), System calls; IPC, File System; Scheduler, Virtual Memory; Device Drivers, Dispatcher</td></tr>
</table>
<p>In the monolithic kernel only the applications are in user space. In the microkernel, application IPC, the Unix server, device drivers and the file server have all moved up, and the kernel keeps only basic IPC, virtual memory and scheduling.</p>
<p>Can we get the flexibility of a microkernel without paying for all those messages? Loadable kernel modules are one answer — next section.</p>`,
      viz: [{ name: 'graph', caption: 'Microkernel system structure: services are user-mode processes that communicate by messages through the microkernel', props: { w: 600, h: 290,
        nodes: [
          { id: 'app', label: 'application program', x: 100, y: 45, w: 150, tone: 'c2' },
          { id: 'fs', label: 'file system', x: 300, y: 45, w: 130, tone: 'c3' },
          { id: 'dd', label: 'device driver', x: 500, y: 45, w: 130, tone: 'c4' },
          { id: 'mk', label: 'microkernel (kernel mode)', sub: 'IPC · memory management · CPU scheduling', x: 300, y: 160, w: 480, h: 56, tone: 'acc' },
          { id: 'hw', label: 'hardware', x: 300, y: 260, w: 480, tone: 'muted' }],
        edges: [
          { from: 'app', to: 'mk', label: 'messages', dashed: true, both: true },
          { from: 'fs', to: 'mk', label: 'messages', dashed: true, both: true },
          { from: 'dd', to: 'mk', label: 'messages', dashed: true, both: true },
          { from: 'mk', to: 'hw', both: true }] } }],
      takeaway: `Microkernel: move as much as possible from the kernel into user space; user modules communicate by message passing (Mach; Darwin is partly based on Mach). The kernel keeps IPC, memory management and CPU scheduling. Benefits: easier to extend and to port, more reliable, more secure. Detriment: performance overhead of user-space ↔ kernel-space communication.`,
      exam: `The four benefits and the main detriment of a microkernel; what stays in the microkernel (IPC, memory management, CPU scheduling); Mach and Darwin.`
    },
    {
      id: 'modules',
      h: 'Modules — loadable kernel modules (LKMs)',
      why: 'extend the kernel while it runs',
      lead: `Microkernels pay for their flexibility with messages. Loadable kernel modules keep everything inside the kernel — no messages, full speed — but still let parts be added and removed separately.`,
      html: `
<p>Many modern operating systems implement <b>loadable kernel modules (LKMs)</b>:</p>
<ul>
  <li>they use an <b>object-oriented approach</b>: each core component is separate;</li>
  <li>each component talks to the others over <b>known interfaces</b>;</li>
  <li>each one is <b>loadable as needed within the kernel</b> — for example, a driver can be loaded only when its device is present.</li>
</ul>
<p>Overall this is <b>similar to layers, but more flexible</b>: in a layered system a layer may only use the layers below it, while a module may call any other module through its interface. And unlike the services of a microkernel, modules run <b>inside the kernel</b>, so they need no message passing. Examples: <b>Linux</b>, <b>Solaris</b>, etc.</p>
<p>You have already seen the Linux side of this in "Building an OS": <code>make modules</code> and <code>make modules_install</code> build and install exactly these loadable pieces.</p>
<p>Each structure so far solves one problem and creates another. Real systems therefore mix them — the last section.</p>`,
      takeaway: `LKMs: each core component is separate, talks to the others over known interfaces, and is loaded into the kernel as needed. Like layers but more flexible (any module can call any other); unlike a microkernel, no message passing. Examples: Linux, Solaris.`,
      exam: `The properties of LKMs and how they differ from layers (more flexible: any module can call any other through known interfaces).`
    },
    {
      id: 'hybrid',
      h: 'Hybrid systems and summary of structures',
      why: 'real OSes mix the models',
      lead: `Every structure has a weak point, so real operating systems rarely choose just one. Most modern OSes are hybrids that combine several approaches.`,
      html: `
<p>Most modern operating systems are <b>not one pure model</b>. A <b>hybrid</b> combines multiple approaches to address <b>performance, security and usability</b> needs. The three examples from the slides:</p>
<ul>
  <li><b>Linux and Solaris</b>: the kernel is in the kernel address space, so they are <b>monolithic</b> (fast), plus <b>modular</b> for dynamic loading of functionality.</li>
  <li><b>Windows</b>: mostly <b>monolithic</b>, plus a <b>microkernel</b> for different <b>subsystem personalities</b> (environments that let programs written for different interfaces run on the same system).</li>
  <li><b>Apple Mac OS X</b>: hybrid and layered. At the top, the <b>Aqua</b> UI plus the <b>Cocoa</b> programming environment. Below them is the kernel, consisting of the <b>Mach</b> microkernel and <b>BSD Unix</b> parts, plus the <b>I/O kit</b> and dynamically loadable modules (called <b>kernel extensions</b>).</li>
</ul>
<div data-viz="0"></div>
<p>The summary table lines up all five structures. Read the "Idea" column from top to bottom as a story: put everything into one kernel → split it into strict layers → move almost everything out of the kernel → keep it in the kernel but make it loadable → mix the approaches.</p>
<table class="t">
  <tr><th>Structure</th><th>Idea</th><th>Example</th></tr>
  <tr><td><b>Monolithic</b></td><td>everything below the system-call interface is one kernel</td><td>original UNIX</td></tr>
  <tr><td><b>Layered</b></td><td>layer 0 = hardware … layer N = user interface; each layer uses only lower ones</td><td>an abstraction</td></tr>
  <tr><td><b>Microkernel</b></td><td>a minimal kernel; services in user space; message passing</td><td>Mach, Darwin (partly)</td></tr>
  <tr><td><b>Modules (LKM)</b></td><td>core components loaded into the kernel as needed, over known interfaces</td><td>Linux, Solaris</td></tr>
  <tr><td><b>Hybrid</b></td><td>a combination of approaches</td><td>Linux/Solaris, Windows, Mac OS X</td></tr>
</table>
<p>This closes the module: we have seen what the OS offers and how it is built. One thing appeared again and again — in program execution, in the loader, in the process-control system calls: the running program, the <b>process</b>. The next module studies processes in detail.</p>`,
      viz: [{ name: 'layers', caption: 'Mac OS X as a hybrid', props: { layers: [
        { label: 'Aqua', sub: 'user interface', tone: 'c2' },
        { label: 'Cocoa', sub: 'programming environment', tone: 'c3' },
        { label: 'kernel', sub: 'Mach microkernel + BSD Unix parts', tone: 'acc' },
        { label: 'I/O kit + kernel extensions', sub: 'dynamically loadable modules', tone: 'warn' }] } }],
      takeaway: `Hybrid = several models combined for performance, security and usability. Linux/Solaris: monolithic + modules. Windows: mostly monolithic + microkernel for subsystem personalities. Mac OS X: Aqua UI + Cocoa on a kernel of Mach + BSD Unix parts, with the I/O kit and kernel extensions.`,
      exam: `How Linux/Solaris, Windows (subsystem personalities) and Mac OS X (Mach + BSD, kernel extensions) are hybrids.`
    }
  ],
  terms: [
    { en: 'User goals', ru: 'цели пользователя', def: 'The OS should be convenient to use, easy to learn, reliable, safe and fast.' },
    { en: 'System goals', ru: 'системные цели (цели разработчиков)', def: 'The OS should be easy to design, implement and maintain, flexible, reliable, error-free and efficient.' },
    { en: 'Operating-system services', ru: 'сервисы операционной системы', def: 'What the OS offers: UI, program execution, I/O, file system, communications, error detection, resource allocation, logging, protection and security.' },
    { en: 'User interface (UI)', ru: 'пользовательский интерфейс', def: 'CLI, GUI, touch-screen or batch; almost every OS has one.' },
    { en: 'Program execution', ru: 'выполнение программ', def: 'Load a program into memory, run it, end it normally or abnormally.' },
    { en: 'I/O operations', ru: 'операции ввода-вывода', def: 'A running program may need I/O with a file or a device.' },
    { en: 'File-system manipulation', ru: 'работа с файловой системой', def: 'Read, write, create, delete, search, list files and directories; manage permissions.' },
    { en: 'Shared memory', ru: 'разделяемая память', def: 'Processes communicate by reading and writing a common memory region.' },
    { en: 'Message passing', ru: 'передача сообщений', def: 'Processes communicate through packets/messages moved by the OS.' },
    { en: 'Error detection', ru: 'обнаружение ошибок', def: 'The OS watches for errors in hardware, devices and programs and takes action.' },
    { en: 'Debugging facilities', ru: 'средства отладки', def: 'Tools that help users and programmers find errors.' },
    { en: 'Resource allocation', ru: 'распределение ресурсов', def: 'Giving CPU cycles, memory, file storage and devices to concurrent users and jobs.' },
    { en: 'Logging (accounting)', ru: 'учёт ресурсов (журналирование)', def: 'Keeping track of which users use how much and what kinds of resources.' },
    { en: 'User authentication', ru: 'аутентификация пользователей', def: 'Checking who the user is; needed for security from outsiders.' },
    { en: 'Graphical user interface (GUI)', ru: 'графический интерфейс пользователя', def: 'Desktop metaphor with icons and mouse actions; invented at Xerox PARC.' },
    { en: 'Desktop metaphor', ru: 'метафора рабочего стола', def: 'The screen imitates an office desk with documents and folders.' },
    { en: 'Touchscreen interface', ru: 'сенсорный интерфейс', def: 'Gestures, a virtual keyboard and voice commands instead of a mouse.' },
    { en: 'Virtual keyboard', ru: 'экранная клавиатура', def: 'A keyboard drawn on the touch screen for text entry.' },
    { en: 'Voice commands', ru: 'голосовые команды', def: 'Controlling the device by speaking.' },
    { en: 'Command-line interface (CLI)', ru: 'интерфейс командной строки', def: 'Direct command entry as text; allows automation with scripts.' },
    { en: 'Command interpreter', ru: 'командный интерпретатор', def: 'Program that reads a command from the user and executes it; a shell.' },
    { en: 'Shell', ru: 'командная оболочка', def: 'A variant of the command interpreter; fetches a command and executes it.' },
    { en: 'Built-in command', ru: 'встроенная команда', def: 'A command whose code is inside the shell itself.' },
    { en: 'Bourne shell', ru: 'оболочка Bourne', def: 'The original Unix shell.' },
    { en: 'Bash script', ru: 'bash-скрипт', def: 'A file of shell commands run one after another; used to automate work.' },
    { en: 'Login shell', ru: 'оболочка входа', def: 'A shell started at login; valid ones are listed in /etc/shells.' },
    { en: 'Default shell', ru: 'оболочка по умолчанию', def: 'The user’s login shell, shown by echo $SHELL.' },
    { en: 'Current shell', ru: 'текущая оболочка', def: 'The shell in use right now, shown by echo $0.' },
    { en: 'Command Prompt (CMD)', ru: 'командная строка Windows', def: 'Windows interface for direct interaction with the system.' },
    { en: 'PowerShell', ru: 'PowerShell (оболочка Windows)', def: 'More complex Windows command prompt with a scripting language for administration.' },
    { en: 'Windows Subsystem for Linux (WSL)', ru: 'подсистема Windows для Linux', def: 'Lets you install a Linux distribution and use Linux tools and Bash directly on Windows.' },
    { en: 'System call', ru: 'системный вызов', def: 'Interface between a program in user space and the OS; used to request kernel services.' },
    { en: 'User space', ru: 'пространство пользователя', def: 'Where ordinary programs run, in user mode.' },
    { en: 'Kernel space', ru: 'пространство ядра', def: 'Where the kernel runs, in kernel mode.' },
    { en: 'System-call interface', ru: 'интерфейс системных вызовов', def: 'Keeps a table indexed by system-call numbers; invokes the call and returns status and values.' },
    { en: 'System-call number', ru: 'номер системного вызова', def: 'The number associated with each system call; index into the system-call table.' },
    { en: 'Return value', ru: 'возвращаемое значение', def: 'The result a function or system call gives back to the caller.' },
    { en: 'Run-time support library', ru: 'библиотека поддержки времени выполнения', def: 'Functions in the compiler’s libraries that hide the details of the OS interface.' },
    { en: 'Parameter passing', ru: 'передача параметров', def: 'Giving system-call arguments to the OS: registers, a block in memory, or the stack.' },
    { en: 'Process control', ru: 'управление процессами', def: 'System calls to create, terminate, load, execute, wait, allocate memory, use locks.' },
    { en: 'File management', ru: 'управление файлами', def: 'System calls (or system programs) to create, delete, open, close, read, write files.' },
    { en: 'Device management', ru: 'управление устройствами', def: 'System calls to request, release, read, write and attach devices.' },
    { en: 'Information maintenance', ru: 'обслуживание информации', def: 'System calls to get/set time, date, system data and attributes.' },
    { en: 'Library call', ru: 'библиотечный вызов', def: 'A call to a library function, such as printf(); may in turn make system calls.' },
    { en: 'Standard C library', ru: 'стандартная библиотека C', def: 'Provides part of the system-call interface: printf() → write().' },
    { en: 'File descriptor', ru: 'файловый дескриптор', def: 'Small integer that identifies an open file in system calls.' },
    { en: 'End of file (EOF)', ru: 'конец файла', def: 'Nothing left to read; read() returns 0.' },
    { en: 'Application Programming Interface (API)', ru: 'программный интерфейс приложений', def: 'Set of functions for building applications that use an OS or service (Win32, POSIX, Java API).' },
    { en: 'Win32 API', ru: 'API Win32', def: 'The API of Windows.' },
    { en: 'Java API', ru: 'API Java', def: 'The API of the Java virtual machine.' },
    { en: 'Java virtual machine (JVM)', ru: 'виртуальная машина Java', def: 'The platform that runs Java programs.' },
    { en: 'API endpoint', ru: 'конечная точка API', def: 'Digital location where an API receives API requests for resources on its server.' },
    { en: 'API request', ru: 'запрос к API', def: 'A call sent to an API endpoint (e.g. GET, POST, PUT, DELETE).' },
    { en: 'REST API', ru: 'REST API (веб-интерфейс)', def: 'Network API: clients send GET/POST/PUT/DELETE and receive JSON or XML.' },
    { en: 'Portable Operating System Interface (POSIX)', ru: 'переносимый интерфейс операционных систем', def: 'IEEE family of standards: API (POSIX C library), shell CLI and basic commands.' },
    { en: 'POSIX C library', ru: 'библиотека C POSIX', def: 'The C API defined by POSIX (headers such as unistd.h, fcntl.h, dirent.h).' },
    { en: 'System services', ru: 'системные службы (системные программы)', def: 'Programs shipped with the OS that give a convenient environment for development and execution.' },
    { en: 'Status information', ru: 'информация о состоянии', def: 'System programs reporting date, time, memory, disk space, users, performance.' },
    { en: 'Registry', ru: 'реестр', def: 'Store for configuration information in some systems (e.g. Windows).' },
    { en: 'Programming-language support', ru: 'поддержка языков программирования', def: 'Compilers, assemblers, debuggers, interpreters.' },
    { en: 'Program loading and execution', ru: 'загрузка и выполнение программ', def: 'Absolute and relocatable loaders, linkage editors, overlay-loaders, debugging systems.' },
    { en: 'Background services', ru: 'фоновые службы', def: 'Launched at boot; run in user context; known as services, subsystems, daemons.' },
    { en: 'Daemon', ru: 'демон (фоновый процесс)', def: 'A background service running in user context.' },
    { en: 'User context', ru: 'контекст пользователя', def: 'Running as an ordinary process, not as part of the kernel.' },
    { en: 'Object file', ru: 'объектный файл', def: 'Machine code produced by the compiler/assembler, not yet linked.' },
    { en: 'Relocatable object file', ru: 'перемещаемый объектный файл', def: 'Object file that can be loaded into any physical memory location.' },
    { en: 'Executable file', ru: 'исполняемый файл', def: 'Single binary file produced by the linker, ready to be loaded.' },
    { en: 'Linker', ru: 'компоновщик', def: 'Combines object files and libraries into one executable file.' },
    { en: 'Loader', ru: 'загрузчик', def: 'Brings a binary executable from secondary storage into memory.' },
    { en: 'Relocation', ru: 'перемещение (релокация)', def: 'Assigning final addresses to program parts and adjusting code and data to match.' },
    { en: 'Assembler', ru: 'ассемблер', def: 'Translates assembly code into machine code and stores it in an object file.' },
    { en: 'Assembly code', ru: 'код на языке ассемблера', def: 'Machine instructions written as readable text; produced by the compiler.' },
    { en: 'Machine code', ru: 'машинный код', def: 'Binary instructions that the CPU executes.' },
    { en: 'Static linking', ru: 'статическая компоновка', def: 'Copies all needed libraries into the executable: larger files, slightly faster start-up.' },
    { en: 'Dynamic linking', ru: 'динамическая компоновка', def: 'Shared libraries linked by name at run time: smaller files, update without relinking.' },
    { en: 'Dynamically linked library (DLL)', ru: 'динамически подключаемая библиотека', def: 'Library loaded as needed and shared by all programs using the same version.' },
    { en: 'Compatibility issues', ru: 'проблемы совместимости', def: 'Programs break because a shared library changed.' },
    { en: 'Kernel image', ru: 'образ ядра', def: 'The compiled kernel as one file (vmlinuz in Linux).' },
    { en: 'vmlinuz', ru: 'vmlinuz (образ ядра Linux)', def: 'The Linux kernel image produced by make.' },
    { en: 'Kernel module', ru: 'модуль ядра', def: 'Part of the kernel compiled separately and loaded when needed.' },
    { en: 'Bootstrap loader', ru: 'начальный загрузчик', def: 'Small code (BIOS) in ROM/EEPROM that locates the kernel, loads it and starts it.' },
    { en: 'Boot block', ru: 'загрузочный блок', def: 'Block at a fixed disk location, loaded by ROM code; it loads the bootstrap loader.' },
    { en: 'BIOS', ru: 'BIOS (базовая система ввода-вывода)', def: 'Classic firmware bootstrap loader in ROM/EEPROM.' },
    { en: 'Unified Extensible Firmware Interface (UEFI)', ru: 'унифицированный расширяемый интерфейс прошивки', def: 'Modern replacement for BIOS.' },
    { en: 'GRUB', ru: 'GRUB (загрузчик ОС)', def: 'Common bootstrap loader: choose kernel, version and options; boot states.' },
    { en: 'Single user mode', ru: 'однопользовательский режим', def: 'Minimal boot state for repairs, offered by boot loaders.' },
    { en: 'Debugging', ru: 'отладка', def: 'Finding and fixing errors (bugs); also performance tuning.' },
    { en: 'Log file', ru: 'файл журнала', def: 'File in which the OS records error information.' },
    { en: 'Core dump', ru: 'дамп памяти процесса', def: 'File capturing the memory of a process after an application failure.' },
    { en: 'Crash dump', ru: 'аварийный дамп ядра', def: 'File containing kernel memory after an OS failure.' },
    { en: 'Performance tuning', ru: 'настройка производительности', def: 'Improving performance by removing bottlenecks.' },
    { en: 'Trace listing', ru: 'трассировочный журнал', def: 'Recorded list of activities, analysed later for performance tuning.' },
    { en: 'Profiling', ru: 'профилирование', def: 'Periodic sampling of the instruction pointer to look for statistical trends.' },
    { en: 'Instruction pointer', ru: 'указатель команд', def: 'Register with the address of the instruction being executed (program counter).' },
    { en: 'Tracing', ru: 'трассировка', def: 'Collecting data for a specific event, e.g. the steps of a system call.' },
    { en: 'Task Manager', ru: 'диспетчер задач', def: 'Windows tool that displays measures of system behaviour.' },
    { en: 'strace', ru: 'strace (трассировка системных вызовов)', def: 'Traces the system calls invoked by a process.' },
    { en: 'gdb', ru: 'gdb (отладчик)', def: 'Source-level debugger.' },
    { en: 'tcpdump', ru: 'tcpdump (захват пакетов)', def: 'Collects network packets.' },
    { en: 'Kernighan’s Law', ru: 'закон Кернигана', def: 'Debugging is twice as hard as writing code, so overly clever code cannot be debugged by its author.' },
    { en: 'Monolithic kernel', ru: 'монолитное ядро', def: 'Everything between the system-call interface and the hardware in one kernel (original UNIX).' },
    { en: 'Systems programs', ru: 'системные программы', def: 'In original UNIX, the part outside the kernel: shells, compilers, libraries.' },
    { en: 'Layered approach', ru: 'многоуровневый подход', def: 'Layer 0 = hardware … layer N = user interface; each layer uses only lower layers.' },
    { en: 'Microkernel', ru: 'микроядро', def: 'Moves as much as possible into user space; modules communicate by message passing (Mach).' },
    { en: 'Interprocess communication (IPC)', ru: 'межпроцессное взаимодействие', def: 'Mechanisms for processes to exchange data; kept in the microkernel.' },
    { en: 'Virtual file system (VFS)', ru: 'виртуальная файловая система', def: 'Common kernel layer over different file systems (monolithic kernel diagram).' },
    { en: 'Loadable kernel module (LKM)', ru: 'загружаемый модуль ядра', def: 'Separate core component, talks over known interfaces, loaded into the kernel as needed.' },
    { en: 'Known interfaces', ru: 'известные (заданные) интерфейсы', def: 'Agreed interfaces through which kernel modules call each other.' },
    { en: 'Hybrid system', ru: 'гибридная система', def: 'Combines several structures for performance, security and usability (Linux, Windows, Mac OS X).' },
    { en: 'Subsystem personalities', ru: 'подсистемы окружения (personalities)', def: 'In Windows, environments for programs written for different interfaces, implemented with a microkernel.' },
    { en: 'Kernel extensions', ru: 'расширения ядра', def: 'Dynamically loadable modules of the Mac OS X kernel.' },
    { en: 'I/O kit', ru: 'I/O Kit (среда драйверов macOS)', def: 'Mac OS X kernel framework for device drivers.' },
    { en: 'Darwin', ru: 'Darwin (ядро macOS)', def: 'The Mac OS X kernel, partly based on Mach.' },
    { en: 'Mach', ru: 'Mach (микроядро)', def: 'Example of a microkernel; basis of part of Darwin.' }
  ],
  questions: [
    { id: 'svc-01', type: 'multi', q: 'Which requirements are system goals rather than user goals? (select all that apply)', options: ['Error-free and efficient', 'Easy to learn', 'Convenient to use', 'Easy to design and implement', 'Easy to maintain'], answer: [0, 3, 4], explain: '"Easy to learn" and "convenient to use" are user goals. System goals: easy to design, implement and maintain; flexible, reliable, error-free and efficient.', section: 'design', diff: 2 },
    { id: 'svc-02', type: 'multi', q: 'Which OS services exist for the efficient operation of the system itself? (select all that apply)', options: ['Resource allocation', 'Logging (accounting)', 'Protection and security', 'User interface', 'File-system manipulation'], answer: [0, 1, 2], explain: 'Resource allocation, logging and protection/security are needed because many users share the system. The user interface and file-system manipulation are services for the user.', section: 'services', diff: 2 },
    { id: 'svc-03', type: 'single', q: 'Through what can the Communications service exchange information between processes?', options: ['Only through signals', 'Only through the device-status table', 'Through shared memory or message passing', 'Only through files'], answer: 2, explain: 'The slide: communications may be via shared memory or through message passing (packets moved by the OS).', section: 'services', diff: 1 },
    { id: 'svc-04', type: 'single', q: 'Where was the GUI invented?', options: ['Bell Labs', 'Xerox PARC', 'Apple', 'Microsoft'], answer: 1, explain: 'The GUI slide says it was invented at Xerox PARC; Apple and Microsoft are later users of the idea.', section: 'gui', diff: 1 },
    { id: 'svc-05', type: 'multi', q: 'Why is a CLI useful, according to the slide? (select all that apply)', options: ['A CLI is always easier for beginners to learn', 'Direct access to the functions of the OS', 'The GUI may not use all the available commands', 'Commands can be automated (bash scripts)', 'The system may not have the resources to run a graphical program'], answer: [1, 2, 3, 4], explain: 'These are the four reasons on the slide. Being easy for beginners is an argument for the GUI, not for the CLI.', section: 'cli', diff: 2 },
    { id: 'svc-06', type: 'code', q: 'The user’s default shell is bash. The user starts sh. What does the last command print?', lang: 'bash', code: '$ echo $SHELL\n/bin/bash\n$ sh\n$ echo $0', options: ['/bin/bash', 'bash', '/etc/shells', 'sh'], answer: 3, explain: '$0 is the current shell, which was started as sh. $SHELL is the default login shell and stays /bin/bash — that is the tempting wrong answer.', section: 'cli', diff: 3 },
    { id: 'svc-07', type: 'single', q: 'Which file contains the paths of all valid login shells installed on the system?', options: ['/bin/sh', '/etc/profile', '/etc/shells', '/etc/passwd'], answer: 2, explain: 'The slide "Shell in Unix/Linux": the list of valid login shells is in /etc/shells.', section: 'cli', diff: 1 },
    { id: 'svc-08', type: 'single', q: 'How does the system-call interface find the requested system call?', options: ['Through the interrupt vector of the device', 'Each system call has a number; the interface keeps a table indexed by these numbers', 'It looks the function up by name in /etc', 'By the program counter value of the caller'], answer: 1, explain: 'Typically a number is associated with each system call, and the system-call interface maintains a table indexed by these numbers.', section: 'syscalls', diff: 2 },
    { id: 'svc-09', type: 'code', q: 'in.txt exists and is 10000 bytes long. How many times is read() called?', lang: 'c', code: 'char buf[4096];\nint in  = open("in.txt", O_RDONLY);\nint out = creat("out.txt", 0644);\nssize_t n;\nwhile ((n = read(in, buf, 4096)) > 0)\n    write(out, buf, n);\nclose(in);\nclose(out);', options: ['4', '5', '2', '3'], answer: 0, explain: 'read returns 4096, 4096, 1808 and then 0 (end of file): 4 calls in total, while write runs only 3 times. It is the "read until read fails" loop of the copy example.', section: 'syscalls', diff: 3 },
    { id: 'svc-10', type: 'single', q: 'According to the slide, which parameter-passing method do Linux and Solaris use?', options: ['Registers only', 'The stack only', 'Environment variables', 'Parameters in a block (table) in memory, with the address of the block in a register'], answer: 3, explain: 'The slide: parameters stored in a block, or table, in memory, and the address of the block passed in a register — the approach taken by Linux and Solaris.', section: 'params', diff: 2 },
    { id: 'svc-11', type: 'multi', q: 'Which parameter-passing methods do not limit the number or length of the parameters? (select all that apply)', options: ['Stack', 'Registers', 'Block (table) in memory'], answer: [0, 2], explain: 'There are only a few registers; the block and stack methods keep the parameters in memory, so they do not limit their number or length.', section: 'params', diff: 2 },
    { id: 'svc-12', type: 'single', q: 'To which type of system calls does the slide assign "locks for managing access to shared data between processes"?', options: ['Information maintenance', 'Process control', 'Communications', 'Protection'], answer: 1, explain: 'Locks are listed under process control, together with "dump memory if error" and the debugger. It is tempting to pick communications, but that group is about connections, messages and shared memory regions.', section: 'types', diff: 3 },
    { id: 'svc-13', type: 'single', q: 'Which Unix system call corresponds to the Windows call CreateProcess()?', options: ['fork()', 'exec()', 'open()', 'pipe()'], answer: 0, explain: 'From the Windows/Unix table: CreateProcess ↔ fork, ExitProcess ↔ exit, WaitForSingleObject ↔ wait.', section: 'types', diff: 1 },
    { id: 'svc-14', type: 'multi', q: 'Which Unix calls in the table belong to Protection? (select all that apply)', options: ['umask()', 'chown()', 'mmap()', 'alarm()', 'chmod()'], answer: [0, 1, 4], explain: 'Protection: chmod, umask, chown. mmap belongs to communications, alarm to information maintenance.', section: 'types', diff: 3 },
    { id: 'svc-15', type: 'code', q: 'Which system call does the standard C library finally execute to output the string?', lang: 'c', code: '#include <stdio.h>\nint main()\n{\n    printf("Greetings");\n    return 0;\n}', options: ['open()', 'read()', 'write()', 'printf()'], answer: 2, explain: 'printf() is a library call, not a system call; the C library intercepts it and invokes the write() system call.', section: 'clib', diff: 1 },
    { id: 'svc-16', type: 'code', q: 'empty.txt exists and its size is 0 bytes. What does the program print?', lang: 'c', code: 'char buf[100];\nint fd = open("empty.txt", O_RDONLY);\nssize_t n = read(fd, buf, sizeof(buf));\nprintf("%zd\\n", n);', options: ['1', '0', '-1', '100'], answer: 1, explain: 'By the read() API, 0 means end of file. −1 would mean an error, but the file was opened successfully.', section: 'clib', diff: 2 },
    { id: 'svc-17', type: 'code', q: 'in.txt exists. What does the program print?', lang: 'c', code: 'char buf[16];\nint fd = open("in.txt", O_RDONLY);\nclose(fd);\nssize_t n = read(fd, buf, 16);\nprintf("%zd\\n", n);', options: ['-1', '0', '16', 'Compilation error'], answer: 0, explain: 'The descriptor was already closed, so read() fails and returns −1. A return value of 0 would mean end of file, which is a different situation.', section: 'clib', diff: 3 },
    { id: 'svc-18', type: 'multi', q: 'Which advantages of an API over raw system calls are listed on the slide? (select all that apply)', options: ['It always runs faster than a system call', 'It does not need the OS kernel', 'Abstraction', 'Portability', 'Ease of use'], answer: [2, 3, 4], explain: 'Abstraction, portability and ease of use. An API still makes system calls underneath, so it is neither faster nor independent of the kernel.', section: 'api', diff: 2 },
    { id: 'svc-19', type: 'single', q: 'What does the part "v1" mean in the RESTful endpoint http://localhost:1234/hrservices/v1/users/{id}?', options: ['APPLICATION CONTEXT', 'PORT', 'VERSION', 'RESOURCE'], answer: 2, explain: 'http = protocol, localhost = host, 1234 = port, hrservices = application context, v1 = version, users = resource, {id} = parameter.', section: 'api', diff: 2 },
    { id: 'svc-20', type: 'tf', q: 'An application compiled on one OS is usually not executable on another OS, because each OS provides its own unique system calls and its own file formats.', answer: true, explain: 'This is the slide "Why Applications are Operating System Specific". A common API such as POSIX reduces the problem.', section: 'api', diff: 2 },
    { id: 'svc-21', type: 'multi', q: 'What does POSIX define? (select all that apply)', options: ['Fundamental commands (grep, sed, awk, cat)', 'A graphical desktop interface', 'The format of Windows DLLs', 'An API (e.g. the POSIX C library)', 'A command-line interface for shells (bash, dash)'], answer: [0, 3, 4], explain: 'POSIX, an IEEE standard, defines the API, the CLI for shells and the fundamental commands. GUIs and Windows DLLs are outside its scope.', section: 'posix', diff: 2 },
    { id: 'svc-22', type: 'single', q: 'Which statement about background services is true?', options: ['They run in kernel context', 'They are started only by a user’s mouse click', 'They are part of the OS kernel', 'They are launched at boot, run in user context (not kernel context), and are known as services, subsystems or daemons'], answer: 3, explain: 'The System Services slide: background services launch at boot, run in user context, not kernel context, and are known as services, subsystems, daemons.', section: 'system-services', diff: 2 },
    { id: 'svc-23', type: 'code', q: 'Which component does the work on the second line?', lang: 'bash', code: 'gcc -c main.c\ngcc -o main main.o -lm\n./main', options: ['Loader', 'Assembler', 'Linker', 'Compiler'], answer: 2, explain: 'Line 1 is the compiler (main.c → main.o), line 2 the linker (main.o + libm → executable main), line 3 the loader.', section: 'linkers', diff: 2 },
    { id: 'svc-24', type: 'single', q: 'What does the assembler do?', options: ['Loads the program into memory', 'Translates assembly code into machine code and stores it in an object file', 'Generates assembly code from source code', 'Links all the libraries'], answer: 1, explain: 'Compiler → assembly code; assembler → machine code in an object file; linker → libraries; loader → memory. Generating assembly code is the compiler’s job.', section: 'linkers', diff: 1 },
    { id: 'svc-25', type: 'single', q: 'Which property belongs to dynamic linking?', options: ['Libraries can be updated without relinking and files are smaller, but compatibility issues are possible', 'All libraries are copied into the executable', 'Slightly faster start-up', 'Changes in external libraries never affect the program'], answer: 0, explain: 'Copying the libraries into the executable and a slightly faster start-up are properties of static linking.', section: 'static-dynamic', diff: 2 },
    { id: 'svc-26', type: 'single', q: 'When building Linux, which command compiles the kernel and produces the kernel image vmlinuz?', options: ['make menuconfig', 'make modules_install', 'make install', 'make'], answer: 3, explain: 'make menuconfig configures, make compiles (vmlinuz), make modules_install installs the modules, make install installs the kernel.', section: 'building', diff: 2 },
    { id: 'svc-27', type: 'single', q: 'What do modern systems use instead of BIOS?', options: ['EEPROM', 'systemd', 'UEFI', 'GRUB'], answer: 2, explain: 'UEFI, the Unified Extensible Firmware Interface. GRUB is a bootstrap loader and EEPROM is a type of memory.', section: 'boot', diff: 1 },
    { id: 'svc-28', type: 'single', q: 'GRUB is…', options: ['a loadable kernel module', 'a common bootstrap loader that lets you choose the kernel from multiple disks, versions and kernel options', 'the firmware that replaces BIOS', 'the first process of the OS'], answer: 1, explain: 'The System Boot slide: the common bootstrap loader GRUB allows selection of the kernel from multiple disks, versions and kernel options. The firmware replacing BIOS is UEFI.', section: 'boot', diff: 2 },
    { id: 'svc-29', type: 'single', q: 'How does a core dump differ from a crash dump?', options: ['A core dump captures the memory of a process after an application failure; a crash dump contains kernel memory after an OS failure', 'A core dump contains kernel memory; a crash dump contains the memory of a process', 'A core dump is a log file; a crash dump is a trace listing', 'They are synonyms'], answer: 0, explain: 'Application failure → core dump (memory of the process); OS failure → crash dump (kernel memory). The tempting wrong answer swaps the two.', section: 'debugging', diff: 2 },
    { id: 'svc-30', type: 'single', q: 'Which tool traces the system calls made by a process?', options: ['gdb', 'perf', 'tcpdump', 'strace'], answer: 3, explain: 'strace traces system calls; gdb is a source-level debugger; perf is a set of Linux performance tools; tcpdump collects network packets.', section: 'debugging', diff: 1 },
    { id: 'svc-31', type: 'single', q: 'In the original UNIX (monolithic structure), what makes up the kernel?', options: ['Shells, compilers and system libraries', 'Everything above the system-call interface', 'Everything below the system-call interface and above the physical hardware', 'Only the CPU scheduler'], answer: 2, explain: 'The kernel lies between the system-call interface and the hardware: file system, CPU scheduling, memory management and more. Shells and libraries are systems programs.', section: 'monolithic', diff: 2 },
    { id: 'svc-32', type: 'single', q: 'How does the slide describe the structure of Linux?', options: ['Mach + BSD hybrid', 'Monolithic plus modular design', 'Pure microkernel', 'Strictly layered'], answer: 1, explain: 'Linux System Structure: "monolithic plus modular design". Mach + BSD describes Mac OS X.', section: 'monolithic', diff: 1 },
    { id: 'svc-33', type: 'single', q: 'In the layered approach, layer 0 is…', options: ['the hardware', 'the user interface', 'the kernel', 'the system-call interface'], answer: 0, explain: 'The bottom layer (layer 0) is the hardware; the highest (layer N) is the user interface.', section: 'layered', diff: 1 },
    { id: 'svc-34', type: 'multi', q: 'Which benefits of a microkernel are listed on the slide? (select all that apply)', options: ['Easier to port the OS to new architectures', 'More reliable (less code runs in kernel mode)', 'More secure', 'No overhead for user ↔ kernel communication', 'Easier to extend'], answer: [0, 1, 2, 4], explain: 'The overhead of user-space ↔ kernel-space communication is exactly the main detriment of a microkernel.', section: 'microkernel', diff: 2 },
    { id: 'svc-35', type: 'single', q: 'What is the main detriment of a microkernel?', options: ['It is hard to port', 'Too much code runs in kernel mode', 'Performance overhead of user-space ↔ kernel-space communication', 'It is hard to extend'], answer: 2, explain: 'The other options are the opposite of the microkernel’s benefits (easy to port, little kernel code, easy to extend).', section: 'microkernel', diff: 1 },
    { id: 'svc-36', type: 'single', q: 'In a microkernel system, where do the file system and the device driver run, and how do they communicate?', options: ['In firmware, through the interrupt vector', 'In user mode, through message passing', 'In kernel mode, through direct function calls', 'In user mode, through shared kernel global variables'], answer: 1, explain: 'In the Microkernel System Structure diagram the file system and device driver are in user mode and communicate with messages; the microkernel keeps only IPC, memory management and CPU scheduling. Direct function calls inside the kernel describe a monolithic kernel.', section: 'microkernel', diff: 3 },
    { id: 'svc-37', type: 'single', q: 'What is characteristic of loadable kernel modules (LKMs)?', options: ['Each core component is separate, talks over known interfaces, and is loaded into the kernel as needed', 'All components are compiled into one indivisible image', 'Modules run only in user space', 'Each layer uses only the layer below it'], answer: 0, explain: 'LKMs use an object-oriented approach; they are similar to layers but more flexible. "Each layer uses only lower layers" describes the layered approach.', section: 'modules', diff: 2 },
    { id: 'svc-38', type: 'single', q: 'How does the Hybrid Systems slide describe Windows?', options: ['A pure microkernel based on Mach', 'Monolithic plus modular, like Linux', 'Layered, with the Aqua UI and Cocoa', 'Mostly monolithic, plus a microkernel for different subsystem personalities'], answer: 3, explain: 'Windows is mostly monolithic plus a microkernel for subsystem personalities. Mach, Aqua and Cocoa belong to Mac OS X; monolithic + modular describes Linux and Solaris.', section: 'hybrid', diff: 3 },
    { id: 'svc-39', type: 'multi', q: 'What do touchscreen interfaces use instead of a mouse, according to the slide? (select all that apply)', options: ['Gestures for actions and selection', 'A virtual keyboard for text entry', 'Voice commands', 'Bash scripts', 'The device-status table'], answer: [0, 1, 2], explain: 'Touchscreen devices use gestures, a virtual keyboard and voice commands. Bash scripts belong to the command line.', section: 'gui', diff: 1 },
    { id: 'svc-40', type: 'single', q: 'What lies underneath the "Aqua" GUI of Apple Mac OS X?', options: ['A UNIX kernel, with shells available', 'The Windows kernel', 'No kernel: Aqua talks directly to the hardware', 'A Java virtual machine'], answer: 0, explain: 'The slide: Mac OS X is the "Aqua" GUI interface with a UNIX kernel underneath and shells available.', section: 'gui', diff: 1 },
    { id: 'svc-41', type: 'single', q: 'What does relocation do?', options: ['Moves a process from memory to disk', 'Assigns final addresses to the program parts and adjusts code and data to match those addresses', 'Copies a library into every executable', 'Translates assembly code into machine code'], answer: 1, explain: 'Relocation fixes the final addresses of a relocatable program. Moving a process to disk is swapping; translating assembly code is the assembler’s job.', section: 'linkers', diff: 2 },
    { id: 'svc-42', type: 'single', q: 'Profiling is…', options: ['the periodic sampling of the instruction pointer to look for statistical trends', 'saving the kernel memory after an OS failure', 'collecting network packets', 'finding and fixing bugs with a source-level debugger'], answer: 0, explain: 'Slide definition of profiling. Saving kernel memory is a crash dump, collecting packets is tcpdump, a source-level debugger is gdb.', section: 'debugging', diff: 2 },
    { id: 'svc-43', type: 'single', q: 'Which system is the example of a microkernel on which the Mac OS X kernel (Darwin) is partly based?', options: ['Linux', 'Mach', 'Original UNIX', 'Solaris'], answer: 1, explain: 'Mach is the microkernel example on the slide. Original UNIX is monolithic; Linux and Solaris are monolithic plus modules.', section: 'microkernel', diff: 1 },
    { id: 'svc-44', type: 'tf', q: 'Static linking produces smaller executable files than dynamic linking.', answer: false, explain: 'Static linking copies the libraries into every executable, so programs are much larger; dynamic linking gives smaller files.', section: 'static-dynamic', diff: 1 },
    { id: 'svc-45', type: 'single', q: 'To which category of system services do compilers, assemblers, debuggers and interpreters belong?', options: ['Status information', 'Programming-language support', 'Background services', 'Communications'], answer: 1, explain: 'They are programming-language support. Loaders and linkage editors would be program loading and execution.', section: 'system-services', diff: 1 },
    { id: 'svc-46', type: 'single', q: 'In the layered approach, which layers may a layer use?', options: ['Only lower-level layers', 'Only higher-level layers', 'Any other layer, through known interfaces', 'Only layer N'], answer: 0, explain: 'Each layer uses the functions and services of only lower-level layers. "Any component through known interfaces" describes loadable kernel modules.', section: 'layered', diff: 1 }
  ]
});
