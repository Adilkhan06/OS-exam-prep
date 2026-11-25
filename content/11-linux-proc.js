OS.addModule({
  id: 'linux-proc',
  num: 13,
  group: 'lab',
  title: 'Linux Processes',
  titleRu: 'Процессы в Linux (лаба)',
  icon: '🐧',
  sources: ['ES2-Linux_processes.pdf'],
  summary: 'Processes seen from the shell: ps and top to observe them, kill and signals to stop them, foreground and background jobs with job control (&, Ctrl+Z, jobs, bg, fg), and C programs that create children with fork(), wait() and exit().',
  bridge: 'The Processes module explained processes in theory — PID and parent, process states, fork/exec/wait. The Linux basics lab gave you a shell. Here the two meet: every command you type in the shell becomes a process, and Linux gives you tools to watch, stop and steer those processes.',
  intro: `
<p>Recall the theory: a <b>process</b> is a program in execution. It has a PID, a parent, and it moves between states (ready, running, waiting, terminated). The shell itself is a process. When you type a command, the shell creates a <b>child process</b> to run it (fork + exec), so a terminal session is a small process tree with the shell near its root.</p>
<p>The module follows what you naturally want to do with those processes. First <b>see</b> them: <code>ps</code> takes a snapshot, <code>top</code> shows a live view. Then <b>stop</b> them: <code>kill</code> sends signals. Then <b>organize</b> them, so that one terminal can run several programs at once: foreground, background and job control. Finally we look at the same mechanism from the inside, with small C programs that call <code>fork()</code>, <code>wait()</code> and <code>exit()</code> exactly as the shell does.</p>`,
  sections: [
    {
      id: 'ps',
      h: 'ps — a snapshot of the processes',
      why: 'see which processes exist',
      lead: 'The first thing to do with processes is to see them. ps prints a snapshot: the processes that exist at the moment you run it, with their PIDs, owners and states.',
      html: `
<p><code>ps</code> (process status) reports the running processes. <b>Without parameters</b> it reports only the processes launched by the <b>current user in this terminal</b>. The <b>-f</b> parameter (full format) adds more columns with more information about them:</p>
<pre class="code" data-lang="bash">debian@debian:/mnt/macos$ ps
    PID TTY          TIME CMD
   2058 pts/0    00:00:00 bash
   2453 pts/0    00:00:00 ps
debian@debian:/mnt/macos$ ps -f
UID          PID    PPID  C STIME TTY          TIME CMD
debian      2058    2032  0 13:01 pts/0    00:00:00 bash
debian      2454    2058  0 13:06 pts/0    00:00:00 ps -f</pre>
<p>This tiny output already shows the theory at work:</p>
<ul>
  <li><code>ps</code> is itself a process. Every command you run is a <b>new process</b> with a new PID: 2453 the first time, 2454 the second.</li>
  <li>The <b>PPID</b> (parent PID) of <code>ps -f</code> is 2058 — the PID of <b>bash</b>. The shell created it: for every command, bash calls fork() (create a child) and the child calls exec() (load the command's program). Bash itself has the parent 2032, the process that started the shell.</li>
</ul>
<p>The columns you will meet most often:</p>
<table class="t">
  <tr><th>Column</th><th>Meaning</th></tr>
  <tr><td><b>PID</b> / <b>PPID</b></td><td>ID of the process / ID of its parent</td></tr>
  <tr><td><b>UID</b> / <b>USER</b></td><td>owner of the process</td></tr>
  <tr><td><b>TTY</b></td><td>controlling terminal (<code>pts/0</code>); <code>?</code> = no terminal (daemons, kernel threads)</td></tr>
  <tr><td><b>TIME</b></td><td>total CPU time used so far</td></tr>
  <tr><td><b>CMD</b> / <b>COMMAND</b></td><td>the command that started the process</td></tr>
  <tr><td><b>C</b>, <b>STIME</b></td><td>CPU usage, start time (with <code>-f</code>)</td></tr>
  <tr><td><b>%CPU</b>, <b>%MEM</b>, <b>VSZ</b>, <b>RSS</b>, <b>STAT</b>, <b>START</b></td><td>share of CPU and memory, virtual and resident size (KiB), state, start time (with <code>aux</code>)</td></tr>
</table>
<p>With the parameters <b>-f -a -u -x</b> you can get a list of <b>all</b> the running processes, with many details:</p>
<pre class="code" data-lang="bash">debian@debian:/mnt/macos$ ps -aux
USER    PID %CPU %MEM    VSZ   RSS TTY   STAT START   TIME COMMAND
root      1  0.1  0.2 168624 11852 ?     Ss   13:00   0:00 /sbin/init
root      2  0.0  0.0      0     0 ?     S    13:00   0:00 [kthreadd]
root      3  0.0  0.0      0     0 ?     I&lt;   13:00   0:00 [rcu_gp]
root      9  0.0  0.0      0     0 ?     I    13:00   0:00 [kworker/u16:0-events_unbound]
root     13  0.0  0.0      0     0 ?     S    13:00   0:00 [ksoftirqd/0]
...</pre>
<ul>
  <li><b>PID 1</b> is <code>/sbin/init</code>: the first process started at boot and the ancestor of all other processes (in the theory: init/systemd, pid 1).</li>
  <li>Names in <b>[square brackets]</b> are <b>kernel threads</b>, work done by the kernel itself. They have no terminal (<code>?</code>) and no user memory (VSZ = 0).</li>
</ul>
<p>The ps variants differ only in <i>which</i> processes they show and <i>how many columns</i> they print:</p>
<table class="t">
  <tr><th>Variant</th><th>What it shows</th></tr>
  <tr><td><code>ps</code></td><td>your processes in the current terminal</td></tr>
  <tr><td><code>ps -f</code></td><td>the same, in full format (UID, PPID, C, STIME)</td></tr>
  <tr><td><code>ps -e</code> (<code>ps -ef</code>)</td><td><b>every</b> process in the system (with <code>-f</code>, in full format)</td></tr>
  <tr><td><code>ps aux</code> (<code>ps -aux</code>)</td><td>processes of all users (a), in user-oriented format (u), including processes without a terminal (x)</td></tr>
  <tr><td><code>ps -u wiehe</code></td><td>the processes of user wiehe</td></tr>
</table>
<p>The STAT column is the process state from the theory diagram, written as one letter:</p>
<table class="t">
  <tr><th>STAT</th><th>State</th></tr>
  <tr><td><b>R</b></td><td>running or runnable (in the ready queue)</td></tr>
  <tr><td><b>S</b></td><td>interruptible sleep: waiting for an event (the "waiting" state)</td></tr>
  <tr><td><b>D</b></td><td>uninterruptible sleep (usually waiting for I/O)</td></tr>
  <tr><td><b>T</b></td><td>stopped (for example after Ctrl+Z)</td></tr>
  <tr><td><b>Z</b></td><td><b>zombie</b>: terminated, but the parent has not called wait() yet</td></tr>
  <tr><td><b>I</b></td><td>idle kernel thread</td></tr>
  <tr><td>extra characters</td><td><b>s</b> = session leader, <b>&lt;</b> = high priority, <b>+</b> = in the foreground group of the terminal</td></tr>
</table>
<p>Two states will matter later. <b>T (stopped)</b> is what Ctrl+Z produces — the basis of job control. <b>Z (zombie)</b> is a process that has finished but whose exit status nobody has collected yet; only its entry in the process table remains until the parent calls wait().</p>`,
      takeaway: 'ps = a snapshot. Plain ps: your processes in this terminal; -f adds UID, PPID, C, STIME; -e or aux: all processes. Every command is a new child of bash; PID 1 is init; STAT shows the state (R, S, D, T, Z, I).',
      exam: 'ps vs ps -f vs ps aux / -e; meaning of PPID, TTY ?, STAT Z / T / S; who is the parent of ps (bash).'
    },
    {
      id: 'top',
      h: 'top — a live view of CPU usage',
      why: 'watch processes over time',
      lead: 'A snapshot cannot tell you which process is using the CPU right now, or how that changes over time. top answers this: it shows the CPU usage of all processes and keeps refreshing the screen.',
      html: `
<p><code>top</code> shows the <b>CPU usage of all processes</b> and updates it in real time, unlike <code>ps</code>, which prints once and exits. By default the busiest processes are at the top of the list — hence the name. Press <b>q</b> to quit.</p>
<pre class="code" data-lang="text">top - 13:46:33 up 50 days, 4:26,  2 users,  load average: ...
Tasks:  ... total,  ... running,  ... sleeping,  ... stopped,  ... zombie
Cpu(s): ... us,  ... sy,  ... ni,  ... id,  ...
Mem:    ... total,  ... used,  ... free,  ...
Swap:   ... total,  ... used,  ... free,  ...

  PID USER   PR  NI  VIRT  RES  SHR S %CPU %MEM
 3403 root   15   0     0    0    0 S  0.7  0.0
    1 root   16   0  1604  324  292 S  0.0  0.0
    2 root   RT   0     0    0    0 S  0.0  0.0
    3 root   34  19     0    0    0 S  0.0  0.0</pre>
<p>The screen has two parts: a <b>summary</b> of the whole system at the top, and a <b>process table</b> below it with one line per process. The table explains every part:</p>
<table class="t">
  <tr><th>Part</th><th>Meaning</th></tr>
  <tr><td>Header line</td><td>current time, uptime, number of users, <b>load average</b></td></tr>
  <tr><td><b>Tasks</b></td><td>how many processes are total / running / sleeping / stopped / zombie — the same states as in the theory</td></tr>
  <tr><td><b>Cpu(s)</b></td><td>us = time in user mode, sy = time in kernel (system) mode, ni = time of "niced" (lower-priority) processes, id = idle time</td></tr>
  <tr><td><b>Mem / Swap</b></td><td>use of RAM and of swap space</td></tr>
  <tr><td><b>PR / NI</b></td><td>priority (RT = real-time) / nice value</td></tr>
  <tr><td><b>VIRT / RES / SHR</b></td><td>virtual / resident / shared memory</td></tr>
  <tr><td><b>S</b></td><td>state (R, S, D, T, Z)</td></tr>
  <tr><td><b>%CPU / %MEM</b></td><td>share of CPU and of memory</td></tr>
</table>
<p>Notice how much theory fits on this one screen: the <b>Tasks</b> line counts processes per state; <b>us</b> vs <b>sy</b> splits CPU time between user mode and kernel mode; <b>PR/NI</b> are scheduling priorities (RT, real-time, is the most urgent class); and <b>id</b> is the idle CPU time that the scheduler tries to keep low.</p>`,
      takeaway: 'top = a live, continuously updated view of CPU and memory usage (quit with q); ps = one snapshot. The Tasks line shows how many processes are in each state.',
      exam: 'top = dynamic monitoring of the CPU, ps = a snapshot; the Tasks line shows the process states.'
    },
    {
      id: 'kill',
      h: 'kill — stopping a process with a signal',
      why: 'stop a process',
      lead: 'Once you can see a process, you may want to stop it — for example a program stuck in a loop. You cannot reach into another process directly; instead you ask the kernel to deliver a signal to it. The command for this is kill.',
      html: `
<p>A <b>signal</b> is a short notification that the kernel delivers to a process: "terminate", "stop", "continue", "you were interrupted"… Every signal has a name and a number. For most signals the process can install its own reaction (for example: save the work, then exit), but some signals cannot be caught. Despite its name, <code>kill</code> simply <b>sends a signal</b> to a process; terminating it is only the most common use.</p>
<p>The slide example: find the PID first, then send signal 9.</p>
<pre class="code" data-lang="bash">zhome:~/linux_tutorial$ ps -u wiehe
  PID TTY          TIME CMD
 1194 ?        00:00:00 sshd
 1196 pts/2    00:00:00 bash
 1255 pts/2    00:00:01 ACTG.pl
 1287 pts/2    00:00:00 ps
zhome:~/linux_tutorial$ kill -9 1255
[1]+  Killed                  ./ACTG.pl
zhome:~/linux_tutorial$ ps -u wiehe
  PID TTY          TIME CMD
 1194 ?        00:00:00 sshd
 1196 pts/2    00:00:00 bash
 1289 pts/2    00:00:00 ps</pre>
<ol class="steps">
  <li><code>ps -u wiehe</code> lists the processes of user wiehe; the program to stop, <code>ACTG.pl</code>, has PID 1255.</li>
  <li><code>kill -9 1255</code> sends signal <b>9, SIGKILL</b>. Bash reports <code>[1]+ Killed ./ACTG.pl</code>, because the program was the shell's background job number 1 (jobs are explained below).</li>
  <li>In the second <code>ps</code> the process 1255 is gone, and <code>ps</code> itself has a new PID, 1289.</li>
</ol>
<p>These are the signals you need for this lab. Two of them are sent from the keyboard: the terminal turns the key combination into a signal for the foreground process.</p>
<table class="t">
  <tr><th>Signal</th><th>No. (Linux)</th><th>Who sends it / meaning</th></tr>
  <tr><td><b>SIGTERM</b></td><td>15</td><td><code>kill PID</code> <b>by default</b>: a polite request to terminate; the process can catch it</td></tr>
  <tr><td><b>SIGKILL</b></td><td>9</td><td><code>kill -9 PID</code>: immediate termination; <b>cannot be caught or ignored</b></td></tr>
  <tr><td><b>SIGINT</b></td><td>2</td><td><b>Ctrl+C</b>: interrupt the foreground process</td></tr>
  <tr><td><b>SIGTSTP</b></td><td>20</td><td><b>Ctrl+Z</b>: suspend the foreground process (Stopped)</td></tr>
  <tr><td><b>SIGSTOP</b> / <b>SIGCONT</b></td><td>19 / 18</td><td>stop / continue (<code>bg</code> and <code>fg</code> continue a stopped job)</td></tr>
</table>
<p>Why are there two ways to terminate, SIGTERM and SIGKILL? SIGTERM is the <b>polite</b> request and the default of <code>kill PID</code>: the process can catch it, clean up (close files, delete temporary files) and then exit — or even ignore it. SIGKILL is the <b>last resort</b>: the kernel removes the process at once, and the process gets no chance to react. So try plain <code>kill</code> first and use <code>kill -9</code> only when the process does not respond.</p>
<ul>
  <li><code>kill -l</code> lists all signals. A signal can also be given by name: <code>kill -SIGKILL 1255</code>, <code>kill -KILL 1255</code>.</li>
  <li><code>kill %1</code> sends the signal to <b>job number 1</b> of the current shell; <code>kill 1</code> sends it to the process with <b>PID 1</b> (init), which a normal user is not allowed to do.</li>
</ul>
<div class="callout note">Link to the theory: if a parent waits for such a child with <code>wait(&amp;status)</code>, then after <code>kill -9</code> the macro <code>WIFSIGNALED(status)</code> is true and <code>WTERMSIG(status) == 9</code>.</div>`,
      takeaway: 'kill sends a signal. kill PID = SIGTERM (15, polite, can be caught); kill -9 PID = SIGKILL (cannot be caught or ignored). Ctrl+C = SIGINT, Ctrl+Z = SIGTSTP. kill %1 = job 1, kill 1 = PID 1.',
      exam: 'kill PID = SIGTERM (15); kill -9 = SIGKILL, cannot be caught; Ctrl+C = SIGINT, Ctrl+Z = SIGTSTP; kill %1 vs kill 1.'
    },
    {
      id: 'fg-bg',
      h: 'Foreground vs background',
      why: 'one terminal, many programs',
      lead: 'So far every command took over the terminal until it finished. That is fine for ls, but not for a job that runs for an hour. The shell solves this by running a process either in the foreground or in the background.',
      html: `
<p>The difference is <b>who owns the terminal</b> — its keyboard and its screen:</p>
<div class="cols">
  <div><b>Foreground</b>
    <ul>
      <li>A terminal session starts and controls <b>interactive</b> processes in the foreground.</li>
      <li>The process <b>occupies the terminal</b> that started it: as long as it runs, you cannot start other programs.</li>
      <li>A <b>foreground job</b> is connected to the terminal: it communicates with the user through the screen and the keyboard.</li>
    </ul></div>
  <div><b>Background</b>
    <ul>
      <li>The terminal that started the program <b>accepts new commands</b> while the program runs.</li>
      <li>Generally used for <b>non-interactive</b> processes.</li>
      <li>A <b>background job</b> is disconnected from the terminal and cannot communicate with the user.</li>
      <li>If a background job needs interaction with the user, it <b>stops and waits</b> until it is connected to the terminal again.</li>
    </ul></div>
</div>
<p>Why not run everything in the background? Because only the foreground process can talk to you. A background job has no keyboard, so when it needs input it cannot get it: it is stopped and must wait until you bring it back to the foreground. That gives the rule of thumb:</p>
<div class="callout key">Put in the background the jobs that do not need the user while they run. The terminal stays free and you can keep working instead of waiting for a long job to finish.</div>
<p>Behind the scenes this is the process-state idea again. For a foreground command the shell calls wait() and sleeps until its child finishes. For a background command the shell does <i>not</i> wait: it prints the next prompt immediately, and the child runs concurrently.</p>`,
      takeaway: 'Foreground = connected to the terminal, the shell waits for it. Background = disconnected, the terminal stays free; a background job that needs input is stopped until it is brought to the foreground.',
      exam: 'How foreground differs from background; what happens to a background job that needs input.'
    },
    {
      id: 'job-control',
      h: 'Job control: &, Ctrl+Z, jobs, bg, fg',
      why: 'move processes between modes',
      lead: 'Choosing foreground or background once is not enough: you start a command, notice it takes long and want to push it to the background — or you want a background job back to type into it. Job control is the shell feature that moves processes between these modes.',
      html: `
<p>The shell offers a feature called <b>job control</b> that allows easy handling of multiple processes. Job control can move processes between the <b>foreground</b> and the <b>background</b>, and <b>suspend</b> (pause) and <b>resume</b> their execution.</p>
<div class="callout note"><b>What is a job?</b> A job is a whole unit of work that is being carried out. A job is made up of many tasks, and tasks are made up of many processes; a set of tasks is called a job. Programs are created to carry out tasks. In computing, the terms job and task are interchangeable.</div>
<p>In the shell, a job is what you typed on one command line. It can be one process, or several processes connected by pipes. The shell numbers jobs <code>[1]</code>, <code>[2]</code>, … — separately from PIDs — and you refer to them as <code>%1</code>, <code>%2</code>.</p>
<p>A job is always in one of three states — <b>Foreground</b>, <b>Background</b> or <b>Stopped</b> — until it ends (<b>Killed</b> or finished). The diagram from the slides shows every transition, and the table gives the command behind each arrow:</p>
<div data-viz="0"></div>
<table class="t">
  <tr><th>Action</th><th>Command</th><th>Result</th></tr>
  <tr><td>start in the foreground</td><td><code>$ cmd</code></td><td>Foreground, the terminal is busy</td></tr>
  <tr><td>start in the background</td><td><code>$ cmd &amp;</code></td><td>Background; the shell prints <code>[1] 12345</code> (job number, PID)</td></tr>
  <tr><td>suspend the foreground job</td><td><b>Ctrl+Z</b></td><td>Stopped: <code>[1]+  Stopped  cmd</code></td></tr>
  <tr><td>list the jobs</td><td><code>jobs</code></td><td><code>[n]</code> and the status Running / Stopped; <b>+</b> = current job, <b>−</b> = previous job</td></tr>
  <tr><td>continue in the background</td><td><code>bg</code> / <code>bg %n</code></td><td>Stopped → Background</td></tr>
  <tr><td>bring to the foreground</td><td><code>fg</code> / <code>fg %n</code></td><td>Stopped or Background → Foreground</td></tr>
  <tr><td>stop a background job</td><td><code>kill -STOP %n</code> ("stop job#")</td><td>Background → Stopped</td></tr>
  <tr><td>interrupt the foreground job</td><td><b>Ctrl+C</b></td><td>Killed</td></tr>
  <tr><td>kill a job</td><td><code>kill %n</code> ("kill job#")</td><td>Killed</td></tr>
</table>
<div class="callout warn"><code>bg</code> and <code>fg</code> without an argument act on the <b>current</b> job, marked <b>+</b> in the output of <code>jobs</code> — usually the job most recently started in the background or most recently stopped.</div>
<p>How does it work underneath? Everything is built from the signals of the previous sections: Ctrl+Z sends <b>SIGTSTP</b>, which stops the process; <code>bg</code> and <code>fg</code> send <b>SIGCONT</b>, which lets it continue — and <code>fg</code> also gives it the terminal and makes the shell wait for it again.</p>`,
      viz: [{ name: 'graph', caption: 'Background and Foreground Jobs: the state diagram from the slides.', props: { w: 620, h: 300,
        nodes: [
          { id: 's1', label: '$ cmd', x: 70, y: 50, shape: 'pill', tone: 'muted' },
          { id: 'fg', label: 'Foreground', x: 270, y: 50, tone: 'acc' },
          { id: 'st', label: 'Stopped', x: 270, y: 150, tone: 'warn' },
          { id: 'bg', label: 'Background', x: 270, y: 250, tone: 'ok' },
          { id: 's2', label: '$ cmd &', x: 70, y: 250, shape: 'pill', tone: 'muted' },
          { id: 'k', label: 'Killed', x: 530, y: 150, shape: 'circle', tone: 'bad' }],
        edges: [
          { from: 's1', to: 'fg' }, { from: 's2', to: 'bg' },
          { from: 'fg', to: 'st', label: 'ctrl-Z', bend: 25 }, { from: 'st', to: 'fg', label: 'fg', bend: 25 },
          { from: 'st', to: 'bg', label: 'bg', bend: 25 }, { from: 'bg', to: 'st', label: 'stop job#', bend: 25 },
          { from: 'bg', to: 'fg', label: 'fg', bend: -120 },
          { from: 'fg', to: 'k', label: 'ctrl-C' }, { from: 'st', to: 'k', label: 'kill job#' }, { from: 'bg', to: 'k', label: 'kill job#' }] } }],
      takeaway: 'cmd & starts in the background; Ctrl+Z stops the foreground job; bg continues it in the background, fg brings it to the foreground; jobs lists them (+ = current job); Ctrl+C or kill %n kills.',
      exam: 'The diagram: cmd / cmd & → Foreground / Background; Ctrl+Z → Stopped; bg, fg; Ctrl+C and kill job# → Killed.'
    },
    {
      id: 'wait-me',
      h: 'Hands-on: ./wait-me.sh',
      why: 'try every transition once',
      lead: 'The slides end the job-control part with a single line: run ./wait-me.sh. Here is a script to try it with, and a complete session that takes one job through every state of the diagram.',
      html: `
<p>The slide shows only the command <code>./wait-me.sh</code>; the script itself is not given. Any long-running script will do for practising job control, for example:</p>
<pre class="code" data-lang="bash">#!/bin/bash
# wait-me.sh — a long-running process for job-control experiments
echo "wait-me: PID = $$"
for i in 1 2 3 4 5 6 7 8 9 10
do
    echo "waiting... $i"
    sleep 3
done
echo "done!"</pre>
<pre class="code" data-lang="bash">$ chmod +x wait-me.sh     # make it executable
$ ./wait-me.sh            # run it in the foreground</pre>
<p>A typical job-control session (bash output). Step through it and watch the state of job [1]:</p>
<div data-viz="0"></div>
<div class="callout note">A background job may still <b>print</b> to the terminal. But if it tries to <b>read</b> from the keyboard (for example with <code>read</code>), it is stopped until you run <code>fg</code> — this is the slide's "stop and wait until establishing a connection to the terminal".</div>`,
      viz: [{ name: 'stepper', caption: 'wait-me.sh: foreground → Stopped → background → foreground.', props: { lang: 'bash', code: `$ ./wait-me.sh
waiting... 1
^Z
[1]+  Stopped                 ./wait-me.sh
$ jobs
[1]+  Stopped                 ./wait-me.sh
$ bg %1
[1]+ ./wait-me.sh &
$ jobs
[1]+  Running                 ./wait-me.sh &
$ fg %1
./wait-me.sh
^C
$`, steps: [
        { line: [1, 2], note: 'The script runs in the foreground: the terminal is busy and accepts no new commands.', vars: { 'job [1]': 'Foreground' } },
        { line: [3, 4], note: 'Ctrl+Z sends SIGTSTP: the job is suspended and the shell shows the prompt again.', vars: { 'job [1]': 'Stopped' } },
        { line: [5, 6], note: 'jobs: the only job is the current one (+), status Stopped.', vars: { 'job [1]': 'Stopped' } },
        { line: [7, 8], note: 'bg %1: the job continues in the background (it receives SIGCONT).', vars: { 'job [1]': 'Background' } },
        { line: [9, 10], note: 'jobs: Running, with "&" at the end — it runs in the background. The terminal is free.', vars: { 'job [1]': 'Background' } },
        { line: [11, 12], note: 'fg %1: the job is in the foreground again; bash prints its command line.', vars: { 'job [1]': 'Foreground' } },
        { line: [13, 14], note: 'Ctrl+C sends SIGINT: the job terminates (Killed) and the prompt comes back.', vars: { 'job [1]': 'Killed' } }] } }],
      takeaway: 'Ctrl+Z → Stopped, bg → Running in the background, fg → Foreground, Ctrl+C → Killed; jobs shows the state at any moment.',
      exam: 'Walk through Ctrl+Z → jobs → bg → jobs → fg and name the state after each step.'
    },
    {
      id: 'life',
      h: 'The life of a process: fork, wait and exit in C',
      why: 'what the shell does inside',
      lead: 'The shell creates a child for every command and, in the foreground, waits for it. Now we write that mechanism ourselves in C, with the same system calls the shell uses: fork(), wait() and exit().',
      html: String.raw`
<p>In a UNIX-like operating system each process is identified by:</p>
<ul>
  <li><b>PID (Process ID)</b> — a unique integer identifying the process (<code>getpid()</code> returns it);</li>
  <li><b>PPID (Parent Process ID)</b> — the PID of its parent process (<code>getppid()</code>).</li>
</ul>
<p>When a process calls <code>fork()</code>:</p>
<ul>
  <li>a new child process is created, <b>identical</b> to the parent (a copy of its memory, continuing from the same point);</li>
  <li>in the <b>parent</b>, <code>fork()</code> returns the <b>PID of the child</b>;</li>
  <li>in the <b>child</b>, <code>fork()</code> returns <b>0</b>.</li>
</ul>
<p>So fork is called once but <b>returns twice</b>, once in each process, with different values. That return value is how the code decides "am I the parent or the child?". Each process can terminate with <code>exit()</code>, and the parent can wait for its child to finish with <code>wait()</code>. The slide program (comments in Italian and English):</p>
<pre class="code" data-lang="c">#include &lt;stdio.h&gt;
#include &lt;unistd.h&gt;
#include &lt;sys/types.h&gt;
#include &lt;sys/wait.h&gt;
int main() {
    pid_t pid;
    printf("=== Processo padre in esecuzione / Parent process running ===\n");
    printf("PID padre / Parent PID: %d\n", getpid());
    printf("PPID padre / Parent PPID: %d\n\n", getppid());
    pid = fork(); // Creazione del processo figlio / Create child process
    if (pid &lt; 0) {
        perror("Errore nella fork / Fork error");
        return 1;
    }
    else if (pid == 0) {
        // Codice del processo figlio / Child process code
        printf("&gt;&gt;&gt; [Figlio / Child] Sono il processo figlio.\n");
        printf("&gt;&gt;&gt; [Figlio / Child] PID: %d, PPID: %d\n", getpid(), getppid());
        printf("&gt;&gt;&gt; [Figlio / Child] Eseguo un compito e termino...\n");
        sleep(2);
        printf("&gt;&gt;&gt; [Figlio / Child] Terminato! / Finished!\n\n");
    }
    else {
        // Codice del processo padre / Parent process code
        printf("[Padre / Parent] Ho creato un figlio con PID = %d\n", pid);
        printf("[Padre / Parent] Attendo la terminazione del figlio / Waiting for child termination...\n");
        wait(NULL);
        printf("[Padre / Parent] Il processo figlio è terminato / Child has finished.\n");
        printf("[Padre / Parent] Fine del padre / End of parent process.\n");
    }
    return 0;
}</pre>
<p>The <code>if</code> has three branches: <code>pid &lt; 0</code> means fork failed and no child exists; <code>pid == 0</code> is the code of the child; the <code>else</code> branch is the parent, where <code>pid</code> holds the child's PID. Things to notice when you run it:</p>
<ul>
  <li>The "Parent PPID" is the PID of the shell (bash) that started the program — the program is itself a child of the shell.</li>
  <li>In the child, <code>getppid()</code> = the PID of the parent; in the parent, the variable <code>pid</code> = the PID of the child.</li>
  <li>The child's lines and the parent's "Created a child…" line may interleave differently from run to run, but the parent's "Child has finished." is <b>always after</b> the child's "Finished!", because of <code>wait(NULL)</code>.</li>
</ul>
<p>Step through the program and follow the state of each process:</p>
<div data-viz="0"></div>
<p>The slides close with four questions. Try to answer them from the stepper before reading the answers:</p>
<table class="t">
  <tr><th>Question</th><th>Answer</th></tr>
  <tr><td>1. When do processes change state?</td><td>At <code>fork()</code> the child enters <b>ready</b> and the parent stays <b>running</b>. With <code>wait()</code> the parent becomes <b>waiting</b>, and after <code>exit()</code> the child becomes <b>terminated</b>.</td></tr>
  <tr><td>2. What causes the transition from waiting to ready?</td><td>The <b>child's termination</b> wakes the parent process.</td></tr>
  <tr><td>3. How can we simulate multiple concurrent processes?</td><td>By creating multiple child processes with <code>fork()</code> <b>inside a loop</b> (next section).</td></tr>
  <tr><td>4. Who decides which process gets the CPU?</td><td>The operating system <b>scheduler</b>.</td></tr>
</table>
<p>This is exactly what bash does with every foreground command: fork, the child execs the command, the parent waits. The only difference is the exec step.</p>`,
      viz: [{ name: 'stepper', caption: 'States of parent and child while the program runs (parent PID 3000, shell 2058).', props: { lang: 'c', code: String.raw`int main() {
    pid_t pid;
    printf("=== Parent process running ===\n");
    printf("Parent PID: %d\n", getpid());
    printf("Parent PPID: %d\n\n", getppid());
    pid = fork();
    if (pid < 0) {
        perror("Fork error");
        return 1;
    } else if (pid == 0) {
        printf(">>> [Child] I am the child process.\n");
        printf(">>> [Child] PID: %d, PPID: %d\n", getpid(), getppid());
        printf(">>> [Child] Doing a task and terminating...\n");
        sleep(2);
        printf(">>> [Child] Finished!\n\n");
    } else {
        printf("[Parent] Created a child with PID = %d\n", pid);
        printf("[Parent] Waiting for child termination...\n");
        wait(NULL);
        printf("[Parent] Child has finished.\n");
        printf("[Parent] End of parent process.\n");
    }
    return 0;
}`, steps: [
        { line: [3, 4], note: 'Only one process exists. getpid() = 3000.', vars: { parent: 'running' }, out: '=== Parent process running ===\nParent PID: 3000' },
        { line: 5, note: 'getppid() is the PID of the shell that started the program.', vars: { parent: 'running' }, out: 'Parent PPID: 2058' },
        { line: 6, note: 'fork(): child 3001 is created and enters ready; the parent stays running. In the parent pid = 3001, in the child pid = 0.', vars: { parent: 'running', child: 'ready', 'pid in parent': 3001, 'pid in child': 0 } },
        { line: 17, note: 'The parent prints the PID of the child.', vars: { parent: 'running', child: 'ready' }, out: '[Parent] Created a child with PID = 3001' },
        { line: [18, 19], note: 'wait(NULL): the parent becomes waiting; the scheduler gives the CPU to the child.', vars: { parent: 'waiting', child: 'running' }, out: '[Parent] Waiting for child termination...' },
        { line: [11, 12], note: 'Child: getppid() = 3000, the PID of its parent.', vars: { parent: 'waiting', child: 'running' }, out: '>>> [Child] I am the child process.\n>>> [Child] PID: 3001, PPID: 3000' },
        { line: [13, 14], note: 'sleep(2): the child is waiting too (for a timer).', vars: { parent: 'waiting', child: 'waiting' }, out: '>>> [Child] Doing a task and terminating...' },
        { line: [15, 23], note: 'The child prints and returns (return 0 → exit) → terminated. Its termination wakes the parent: waiting → ready.', vars: { parent: 'ready', child: 'terminated' }, out: '>>> [Child] Finished!' },
        { line: [20, 21], note: 'The parent is running again and finishes.', vars: { parent: 'running', child: 'terminated' }, out: '[Parent] Child has finished.\n[Parent] End of parent process.' }] } }],
      takeaway: 'fork() returns the child\'s PID in the parent and 0 in the child. wait() puts the parent in the waiting state until a child exits; the child\'s exit wakes the parent (waiting → ready). The scheduler decides who runs.',
      exam: 'What fork() returns in parent and child; getpid / getppid; which state transitions fork, wait and exit cause.'
    },
    {
      id: 'multi-child',
      h: 'Many children: simulating concurrent processes',
      why: 'several processes at once',
      lead: 'Question 3 of the slides asks how to simulate several concurrent processes. The answer is to call fork() inside a loop — but the loop hides a trap, which is why every child must call exit().',
      html: String.raw`
<p>This program creates <b>multiple children</b> in a loop and displays their PIDs and PPIDs, simulating a "ready queue" of processes:</p>
<pre class="code" data-lang="c">#include &lt;stdio.h&gt;
#include &lt;unistd.h&gt;
#include &lt;sys/types.h&gt;
#include &lt;sys/wait.h&gt;
#include &lt;stdlib.h&gt;
#include &lt;time.h&gt;
int main() {
    pid_t pid;
    int n = 3; // Numero di processi figli / Number of child processes
    srand(time(NULL));
    printf("=== Simulazione di %d processi figli / Simulating %d child processes ===\n\n", n, n);
    printf("PID padre / Parent PID: %d\n\n", getpid());
    for (int i = 0; i &lt; n; i++) {
        pid = fork();
        if (pid &lt; 0) {
            perror("Errore nella fork / Fork error");
            return 1;
        }
        else if (pid == 0) {
            // Codice del figlio
            int tempo = rand() % 5 + 1;
            printf("&gt;&gt;&gt; [Figlio %d / Child %d] PID: %d, PPID: %d, eseguo per %d secondi...\n",
                   i + 1, i + 1, getpid(), getppid(), tempo);
            sleep(tempo);
            printf("&gt;&gt;&gt; [Figlio %d / Child %d] Terminato dopo %d secondi.\n", i + 1, i + 1, tempo);
            exit(0);
        }
        // Il padre continua il ciclo e genera altri figli
    }
    // Il padre attende la terminazione di tutti i figli
    for (int i = 0; i &lt; n; i++) {
        wait(NULL);
    }
    printf("\n[Tutti i figli terminati / All children finished]\n");
    printf("[Padre / Parent] Fine del programma.\n");
    return 0;
}</pre>
<p>(Italian: "figlio" = child, "padre" = parent, "eseguo per %d secondi" = I run for %d seconds, "terminato dopo" = finished after.) The parent goes round the loop n times and creates one child per iteration; each child sleeps a few seconds and exits. The slides draw three conclusions:</p>
<ul>
  <li>Children run in a <b>non-deterministic order</b>: the OS decides which one to execute first.</li>
  <li>Each child has its <b>own PID</b>, but they all share the <b>same PPID</b> — the parent's PID.</li>
  <li>The parent waits for <b>all</b> child processes to finish before exiting: each <code>wait(NULL)</code> waits for one child, so it needs <b>n</b> calls.</li>
</ul>
<div data-viz="0"></div>
<div class="callout warn">The <code>exit(0)</code> in the child is essential. Remember that a child continues from the same point as its parent — here, inside the loop. Without <code>exit(0)</code> the child would go on with the next iterations and call <code>fork()</code> itself. Every iteration would then double the number of processes: instead of 1 + 3 = <b>4</b> processes you would get 2³ = <b>8</b>.</div>
<div class="callout note">A subtle detail: <code>srand()</code> is called in the parent <b>before</b> the forks, and the parent itself never calls <code>rand()</code>. Each child receives a <b>copy of the same</b> random-generator state, so the first <code>rand()</code> gives the same number in every child, and all children sleep for the same time.</div>`,
      viz: [{ name: 'tree', caption: 'With exit(0): one parent and n = 3 children with the same PPID.', props: { root: { label: 'parent', note: 'PID 3000 · wait() × 3', tone: 'acc', children: [
        { label: 'Child 1', note: 'PID 3001 · PPID 3000', tone: 'ok' },
        { label: 'Child 2', note: 'PID 3002 · PPID 3000', tone: 'ok' },
        { label: 'Child 3', note: 'PID 3003 · PPID 3000', tone: 'ok' }] } } }],
      takeaway: 'fork() in a loop + exit(0) in the child = n children of one parent (same PPID, different PIDs); the parent needs n wait() calls; the scheduler decides the order. Without exit(0) the children fork too: 2ⁿ processes.',
      exam: 'How many processes the loop creates with and without exit(0); same PPID; why n calls of wait(NULL).'
    }
  ],
  terms: [
    { en: 'Process', ru: 'процесс', def: 'A program in execution, identified by a PID.' },
    { en: 'Process ID', ru: 'идентификатор процесса', def: 'PID: the unique integer that identifies a process (getpid()).' },
    { en: 'Parent process ID', ru: 'идентификатор родительского процесса', def: 'PPID: the PID of the process that created this one (getppid()).' },
    { en: 'Child process', ru: 'дочерний процесс', def: 'A process created by another process with fork().' },
    { en: 'Parent process', ru: 'родительский процесс', def: 'The process that called fork() to create a child.' },
    { en: 'ps', ru: 'список процессов (ps)', def: 'Prints a snapshot of processes: plain = yours in this terminal; -f = full format; -e / aux = all processes.' },
    { en: 'top', ru: 'монитор процессов (top)', def: 'Shows the CPU and memory usage of all processes in real time; quit with q.' },
    { en: 'Snapshot', ru: 'моментальный снимок', def: 'The state at one moment (ps), as opposed to a continuously updated view (top).' },
    { en: 'Controlling terminal', ru: 'управляющий терминал', def: 'TTY column of ps: the terminal a process belongs to (pts/0); ? = none.' },
    { en: 'Process state', ru: 'состояние процесса', def: 'STAT in ps: R running, S sleeping, D uninterruptible sleep, T stopped, Z zombie, I idle.' },
    { en: 'Kernel thread', ru: 'поток ядра', def: 'Work done by the kernel itself; shown in [brackets] in ps, without a terminal.' },
    { en: 'Zombie process', ru: 'процесс-зомби', def: 'A terminated process whose parent has not yet called wait() to collect its status.' },
    { en: 'Load average', ru: 'средняя загрузка', def: 'Header value of top: the average number of processes ready to run or running.' },
    { en: 'Nice value', ru: 'значение nice (уступчивость)', def: 'NI in top: a user-adjustable part of a process priority; a higher nice value means lower priority.' },
    { en: 'Signal', ru: 'сигнал', def: 'A short notification the kernel delivers to a process (terminate, stop, continue, interrupt…).' },
    { en: 'kill', ru: 'послать сигнал (kill)', def: 'Sends a signal: kill PID = SIGTERM; kill -9 PID = SIGKILL; kill %n = to job n; kill -l lists signals.' },
    { en: 'SIGTERM', ru: 'сигнал завершения', def: 'Signal 15, the default of kill: a polite request to terminate; can be caught.' },
    { en: 'SIGKILL', ru: 'сигнал безусловного уничтожения', def: 'Signal 9: immediate termination; cannot be caught or ignored.' },
    { en: 'SIGINT', ru: 'сигнал прерывания', def: 'Signal 2, sent by Ctrl+C: interrupt the foreground process.' },
    { en: 'SIGTSTP', ru: 'сигнал остановки с терминала', def: 'Signal 20, sent by Ctrl+Z: suspend the foreground process (Stopped).' },
    { en: 'SIGCONT', ru: 'сигнал продолжения', def: 'Signal 18: lets a stopped process continue (used by bg and fg).' },
    { en: 'Foreground job', ru: 'задание переднего плана', def: 'Connected to the terminal; communicates through screen and keyboard; the terminal is busy.' },
    { en: 'Background job', ru: 'фоновое задание', def: 'Disconnected from the terminal (cmd &); the terminal stays free; stopped if it needs input.' },
    { en: 'Job', ru: 'задание', def: 'A whole unit of work, made of tasks and processes; in the shell, one command line with a job number.' },
    { en: 'Job control', ru: 'управление заданиями', def: 'The shell feature that moves processes between foreground and background and suspends and resumes them.' },
    { en: 'Current job', ru: 'текущее задание', def: 'The job marked + in jobs; bg and fg act on it when no %n is given.' },
    { en: 'jobs', ru: 'список заданий', def: 'Lists the jobs of the shell with their number and status (Running / Stopped).' },
    { en: 'bg', ru: 'продолжить в фоне', def: 'Continues a stopped job in the background.' },
    { en: 'fg', ru: 'вернуть на передний план', def: 'Brings a stopped or background job to the foreground.' },
    { en: 'Suspend', ru: 'приостановить', def: 'Pause a process without terminating it (state Stopped).' },
    { en: 'Resume', ru: 'возобновить', def: 'Let a suspended process continue.' },
    { en: 'fork()', ru: 'системный вызов fork', def: 'Creates a child identical to the parent; returns the child PID in the parent and 0 in the child.' },
    { en: 'wait()', ru: 'системный вызов wait', def: 'Puts the parent in the waiting state until one child terminates.' },
    { en: 'exit()', ru: 'системный вызов exit', def: 'Terminates the calling process.' }
  ],
  questions: [
    { id: 'lproc-01', type: 'single', q: 'What does ps show without parameters?', options: ['All processes of all users', 'The processes of the current user started in this terminal', 'Only kernel processes', 'CPU usage in real time'], answer: 1, explain: 'Without parameters ps reports the processes launched by the current user in the current terminal. All processes: ps aux or ps -e; real-time view: top.', section: 'ps', diff: 1 },
    { id: 'lproc-02', type: 'single', q: 'Which ps parameter adds the columns UID, PPID, C and STIME?', options: ['-f', '-u', '-x', '-e'], answer: 0, explain: '-f (full format) adds extra columns, including PPID. -e selects every process, it does not add columns.', section: 'ps', diff: 1 },
    { id: 'lproc-03', type: 'code', q: 'Using this output, which process is the parent of ps -f?', lang: 'bash', code: `debian@debian:/mnt/macos$ ps -f
UID          PID    PPID  C STIME TTY          TIME CMD
debian      2058    2032  0 13:01 pts/0    00:00:00 bash
debian      2454    2058  0 13:06 pts/0    00:00:00 ps -f`, options: ['bash (PID 2058)', 'process 2032', 'ps -f itself (PID 2454)', 'init (PID 1)'], answer: 0, explain: 'The PPID of ps -f is 2058, the PID of bash: the shell created the process for the command (fork + exec). 2032 is the parent of bash itself.', section: 'ps', diff: 2 },
    { id: 'lproc-04', type: 'single', q: 'A user runs ps and then ps -f. In the first output ps had PID 2453, in the second 2454. Why?', options: ['The PID of a process changes every second', 'Every command you run is a new process with a new PID', 'ps -f is a thread of the ps process', 'Because bash was restarted'], answer: 1, explain: 'For every command bash creates a new child process, and each new process gets a new PID. A process keeps its PID for its whole life.', section: 'ps', diff: 1 },
    { id: 'lproc-05', type: 'code', q: 'Part of the output of ps -aux. Which statement is true?', lang: 'bash', code: `USER    PID %CPU %MEM    VSZ   RSS TTY   STAT START   TIME COMMAND
root      1  0.1  0.2 168624 11852 ?     Ss   13:00   0:00 /sbin/init
root      2  0.0  0.0      0     0 ?     S    13:00   0:00 [kthreadd]
root      3  0.0  0.0      0     0 ?     I<   13:00   0:00 [rcu_gp]`, options: ['/sbin/init has PID 1 and is not attached to a terminal', 'kthreadd was started from the terminal pts/0', 'rcu_gp uses 168624 KiB of virtual memory', 'All processes belong to the current user debian'], answer: 0, explain: 'PID 1 is init, and TTY ? means no controlling terminal. kthreadd and rcu_gp are kernel threads with VSZ 0; the owner of all three is root.', section: 'ps', diff: 2 },
    { id: 'lproc-06', type: 'single', q: 'Which ps STAT letter means a zombie process (terminated, but the parent has not called wait() yet)?', options: ['S', 'T', 'Z', 'R'], answer: 2, explain: 'Z = zombie; T = stopped, S = sleeping, R = running.', section: 'ps', diff: 2 },
    { id: 'lproc-07', type: 'single', q: 'How does top differ from ps?', options: ['top shows only the processes of the current terminal', 'top shows the CPU usage of all processes and updates it in real time', 'top terminates processes by default', 'top prints the process tree'], answer: 1, explain: 'ps takes a single snapshot; top keeps updating the picture of CPU and memory usage until you press q.', section: 'top', diff: 1 },
    { id: 'lproc-08', type: 'code', q: 'Which signal did the process ACTG.pl receive?', lang: 'bash', code: `zhome:~/linux_tutorial$ ps -u wiehe
  PID TTY          TIME CMD
 1196 pts/2    00:00:00 bash
 1255 pts/2    00:00:01 ACTG.pl
zhome:~/linux_tutorial$ kill -9 1255
[1]+  Killed                  ./ACTG.pl`, options: ['SIGTERM (15)', 'SIGKILL (9)', 'SIGINT (2)', 'SIGTSTP (20)'], answer: 1, explain: 'kill -9 sends signal 9, SIGKILL; bash reports "Killed" for its job number 1.', section: 'kill', diff: 1 },
    { id: 'lproc-09', type: 'single', q: 'Which signal does kill PID send when no signal is given?', options: ['SIGKILL (9)', 'SIGTERM (15)', 'SIGINT (2)', 'SIGSTOP (19)'], answer: 1, explain: 'By default kill sends SIGTERM, the polite request; -9 (SIGKILL) has to be written explicitly.', section: 'kill', diff: 2 },
    { id: 'lproc-10', type: 'single', q: 'A process ignores kill PID. Why does kill -9 PID still terminate it?', options: ['SIGKILL cannot be caught or ignored', 'kill -9 reboots the system', 'kill -9 sends the signal to the parent', 'kill -9 suspends the process'], answer: 0, explain: 'A process can catch or ignore SIGTERM, but not SIGKILL: the kernel removes the process directly.', section: 'kill', diff: 2 },
    { id: 'lproc-11', type: 'code', q: 'You want to terminate job number 1 of the current shell. Which command does it?', lang: 'bash', code: `$ ./wait-me.sh &
[1] 4321
$ jobs
[1]+  Running                 ./wait-me.sh &`, options: ['kill %1', 'kill 1', 'kill -1', 'fg 4321'], answer: 0, explain: '%1 refers to the job number. kill 1 targets the process with PID 1 (init), which a normal user may not signal. kill 4321 (the PID) would also work.', section: 'kill', diff: 2 },
    { id: 'lproc-12', type: 'single', q: 'What is typical of a foreground process?', options: ['The terminal accepts new commands while the process runs', 'The process occupies the terminal: no other command can be started while it runs', 'The process cannot read from the keyboard', 'The process is always non-interactive'], answer: 1, explain: 'A foreground job is connected to the terminal and occupies it. A terminal that stays free is the sign of a background job.', section: 'fg-bg', diff: 1 },
    { id: 'lproc-13', type: 'single', q: 'What happens to a background job that needs input from the user?', options: ['It terminates', 'It stops and waits until it is connected to the terminal again', 'It reads an empty line and continues', 'It moves to the foreground automatically'], answer: 1, explain: 'From the slide: if the background job requires interaction, it stops and waits until establishing a connection to the terminal. You bring it back with fg.', section: 'fg-bg', diff: 2 },
    { id: 'lproc-14', type: 'single', q: 'How do you start a command directly in the background?', options: ['cmd &', 'bg cmd', 'cmd | bg', 'Ctrl+Z cmd'], answer: 0, explain: 'An & at the end of the command line starts it in the background. bg only continues a job that is already stopped.', section: 'job-control', diff: 1 },
    { id: 'lproc-15', type: 'single', q: 'What does Ctrl+Z do to a foreground process?', options: ['Terminates it (Killed)', 'Suspends it (Stopped)', 'Moves it to the background and lets it continue', 'Nothing'], answer: 1, explain: 'Ctrl+Z sends SIGTSTP → Stopped. To continue it in the background you then type bg; Ctrl+C would kill it.', section: 'job-control', diff: 1 },
    { id: 'lproc-16', type: 'code', q: 'What does the last jobs command print?', lang: 'bash', code: `$ ./wait-me.sh
^Z
[1]+  Stopped                 ./wait-me.sh
$ bg
[1]+ ./wait-me.sh &
$ jobs`, options: ['[1]+  Running                 ./wait-me.sh &', '[1]+  Stopped                 ./wait-me.sh', '[1]+  Done                    ./wait-me.sh', 'Nothing — the job has finished'], answer: 0, explain: 'bg continued the stopped job in the background, so its status is Running, with & at the end.', section: 'job-control', diff: 2 },
    { id: 'lproc-17', type: 'code', q: 'Which job does fg without arguments bring to the foreground?', lang: 'bash', code: `$ sleep 100 &
[1] 5001
$ sleep 200 &
[2] 5002
$ jobs
[1]-  Running                 sleep 100 &
[2]+  Running                 sleep 200 &
$ fg`, options: ['sleep 200 (job 2, marked +)', 'sleep 100 (job 1)', 'Both jobs', 'Error: %n must be given'], answer: 0, explain: 'Without an argument fg and bg act on the current job, the one marked + (here the last one started in the background).', section: 'job-control', diff: 3 },
    { id: 'lproc-18', type: 'single', q: 'In the Background and Foreground Jobs diagram, how do you move a Stopped job to the Background?', options: ['fg', 'bg', 'ctrl-C', 'stop job#'], answer: 1, explain: 'Stopped → bg → Background. fg leads to Foreground, ctrl-C kills the foreground job, stop job# goes from Background to Stopped.', section: 'job-control', diff: 1 },
    { id: 'lproc-19', type: 'multi', q: 'What does job control allow? (select all that apply)', options: ['Moving processes between foreground and background', 'Suspending their execution', 'Resuming their execution', 'Changing the PID of a process', 'Changing the parent of a process'], answer: [0, 1, 2], explain: 'Job control moves processes between foreground and background and suspends/resumes them; it never changes a PID or a parent.', section: 'job-control', diff: 1 },
    { id: 'lproc-20', type: 'code', q: 'Sequence: start, Ctrl+Z, bg, fg, Ctrl+C. Which state is the job in after each step?', lang: 'bash', code: `$ ./wait-me.sh     # 1
^Z                 # 2
$ bg               # 3
$ fg               # 4
^C                 # 5`, options: ['Foreground → Stopped → Background → Foreground → Killed', 'Foreground → Killed → Background → Foreground → Stopped', 'Background → Stopped → Foreground → Background → Killed', 'Foreground → Background → Stopped → Foreground → Killed'], answer: 0, explain: 'A plain command starts in the foreground; Ctrl+Z → Stopped, bg → Background, fg → Foreground, Ctrl+C → Killed.', section: 'wait-me', diff: 2 },
    { id: 'lproc-21', type: 'code', q: 'The parent has PID 3000 and fork() created a child with PID 3001. What does the child print?', lang: 'c', code: String.raw`pid = fork();
if (pid == 0) {
    printf(">>> [Child] PID: %d, PPID: %d\n", getpid(), getppid());
} else {
    printf("[Parent] Created a child with PID = %d\n", pid);
    wait(NULL);
}`, options: ['>>> [Child] PID: 3001, PPID: 3000', '>>> [Child] PID: 0, PPID: 3000', '>>> [Child] PID: 3000, PPID: 3001', '>>> [Child] PID: 3001, PPID: 0'], answer: 0, explain: 'In the child fork() returned 0, but getpid() still gives its real PID 3001, and getppid() gives the parent\'s PID 3000. The 0 is only the return value of fork.', section: 'life', diff: 2 },
    { id: 'lproc-22', type: 'code', q: 'Which line is guaranteed to be printed AFTER ">>> [Child] Finished!"?', lang: 'c', code: String.raw`} else if (pid == 0) {
    printf(">>> [Child] PID: %d, PPID: %d\n", getpid(), getppid());
    sleep(2);
    printf(">>> [Child] Finished!\n\n");
} else {
    printf("[Parent] Created a child with PID = %d\n", pid);
    printf("[Parent] Waiting for child termination...\n");
    wait(NULL);
    printf("[Parent] Child has finished.\n");
}`, options: ['[Parent] Child has finished.', '[Parent] Created a child with PID = …', '[Parent] Waiting for child termination...', '>>> [Child] PID: …, PPID: …'], answer: 0, explain: 'The parent is blocked in wait(NULL) until the child terminates, so "Child has finished." always comes after. The lines before wait() may appear in any order relative to the child.', section: 'life', diff: 2 },
    { id: 'lproc-23', type: 'single', q: 'According to the slide "The Life of a Process", what happens to the states at fork() and wait()?', options: ['At fork() the child becomes ready and the parent stays running; at wait() the parent becomes waiting', 'At fork() the parent becomes waiting; at wait() the child becomes terminated', 'At fork() both are running; at wait() the parent becomes terminated', 'At fork() the child is running and the parent becomes ready'], answer: 0, explain: 'Answer A.1 on the slide: fork → child ready, parent running; wait → parent waiting; exit → child terminated.', section: 'life', diff: 2 },
    { id: 'lproc-24', type: 'single', q: 'In this example, what moves the parent from waiting to ready?', options: ['The time quantum expires', 'The child\'s termination (its exit) wakes the parent', 'A call to fork()', 'Pressing Ctrl+Z'], answer: 1, explain: 'Answer A.2 on the slide: the child\'s termination wakes the parent process.', section: 'life', diff: 1 },
    { id: 'lproc-25', type: 'code', q: 'How many processes in total (including the parent) exist in this program?', lang: 'c', code: String.raw`int n = 3;
for (int i = 0; i < n; i++) {
    pid = fork();
    if (pid == 0) {
        printf("Child %d\n", i + 1);
        sleep(1);
        exit(0);
    }
}
for (int i = 0; i < n; i++)
    wait(NULL);`, options: ['3', '4', '7', '8'], answer: 1, explain: 'Each child calls exit(0) and never continues the loop, so only the parent calls fork — 3 times → 1 + 3 = 4 processes.', section: 'multi-child', diff: 2 },
    { id: 'lproc-26', type: 'code', q: 'exit(0) was removed from the same code. How many processes are there now (including the original one)?', lang: 'c', code: String.raw`int n = 3;
for (int i = 0; i < n; i++) {
    pid = fork();
    if (pid == 0) {
        printf("Child %d\n", i + 1);
        sleep(1);
    }
}`, options: ['4', '6', '8', '3'], answer: 2, explain: 'The children continue the loop and call fork() too, so every iteration doubles the number of processes: 2³ = 8.', section: 'multi-child', diff: 3 },
    { id: 'lproc-27', type: 'tf', q: 'In the program "Simulating multiple child processes" all children have the same PPID.', answer: true, explain: 'All children are created by the same parent, so their PPID is the parent\'s PID; each child has its own PID.', section: 'multi-child', diff: 1 },
    { id: 'lproc-28', type: 'single', q: 'Why does the parent call wait(NULL) n times in a loop?', options: ['Each wait(NULL) waits for the termination of one child; the parent must wait for all n', 'wait(NULL) creates a new child', 'So that the children run in order', 'To set the sleep time of the children'], answer: 0, explain: 'One wait collects one terminated child; the parent must collect all n before printing "All children finished".', section: 'multi-child', diff: 2 },
    { id: 'lproc-29', type: 'tf', q: 'The children in this program always terminate in the order they were created (Child 1, Child 2, Child 3).', answer: false, explain: 'The order is non-deterministic: the OS scheduler decides which process runs.', section: 'multi-child', diff: 1 },
    { id: 'lproc-30', type: 'single', q: 'srand(time(NULL)) is called in the parent before the loop, and the parent itself never calls rand(); each child computes tempo = rand() % 5 + 1. What happens to tempo in the three children?', options: ['All children get the same value', 'Always 1, 2, 3', 'Always different random values', 'Error: rand() cannot be called after fork()'], answer: 0, explain: 'Every child receives a copy of the same generator state (the parent never advances it), so the first rand() returns the same number in each child.', section: 'multi-child', diff: 3 },
    { id: 'lproc-31', type: 'single', q: 'Which signal does Ctrl+C send to the foreground process?', options: ['SIGINT (2)', 'SIGTSTP (20)', 'SIGKILL (9)', 'SIGCONT (18)'], answer: 0, explain: 'Ctrl+C = SIGINT (interrupt), which normally terminates the process. Ctrl+Z = SIGTSTP (stop); SIGKILL is sent with kill -9; SIGCONT is used by bg and fg.', section: 'kill', diff: 1 },
    { id: 'lproc-32', type: 'multi', q: 'The Tasks line of top counts processes by state. Which states does it show? (select all that apply)', options: ['running', 'sleeping', 'stopped', 'zombie', 'compiling'], answer: [0, 1, 2, 3], explain: 'Tasks: total, running, sleeping, stopped, zombie — the process states from the theory. "Compiling" is not a process state.', section: 'top', diff: 1 }
  ]
});
