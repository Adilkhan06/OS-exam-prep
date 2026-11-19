OS.addModule({
  id: 'linux',
  num: 10,
  group: 'lab',
  title: 'Linux OS — basics',
  titleRu: 'Основы Linux',
  icon: '🐧',
  sources: ['ES1-Linux_basic.pdf'],
  summary: 'Using Linux from the command line: terminal and shell, the file-system tree and paths, the standard directories, basic file commands, redirection and pipes, users and groups (/etc/passwd, /etc/shadow), file permissions and chmod.',
  bridge: 'In the OS Services module the command-line interpreter (the shell) was one of the ways a user asks the OS for services. This first lab puts you in front of a real one — bash on Linux — and shows what the theory ideas (files, users, protection) look like when you type commands.',
  intro: `
<p>A Linux system is used mostly through text: you type a command, a program called the <b>shell</b> reads it, asks the kernel to do the work, and prints the result. To work comfortably you need answers to three questions, and the module follows them in this order.</p>
<p><b>1. How do I talk to the system?</b> — terminal, shell, command syntax and the manual. <b>2. Where are things, and how do I work with them?</b> — all data lives in one tree of directories; you name a file by its path, and small commands (ls, cp, grep, wc…) can be chained with redirection and pipes. <b>3. Who is allowed to do what?</b> — Linux is a multi-user system: every user is a number (UID), every file has an owner, a group and permission bits, and every program runs with the rights of the user who started it. Keep that last sentence in mind: it explains the whole second half of the module.</p>`,
  sections: [
    {
      id: 'shell',
      h: 'Terminal and shell: how you talk to Linux',
      why: 'who reads your commands',
      lead: 'The kernel does not read keyboards or write messages for people — it only answers system calls from programs. So between you and the kernel there must be a program that understands typed commands. That program is the shell.',
      html: `
<p>A <b>terminal</b> is a text-based interface for command-line interaction: a window that shows characters and sends your keystrokes, nothing more. The program that actually <i>understands</i> what you type is the <b>shell</b>:</p>
<ul>
  <li>after you log in, Linux/Unix starts the shell for you;</li>
  <li>the shell <b>interprets</b> each command you type and manages its execution (it starts the program, waits for it, shows you the next prompt);</li>
  <li>to do real work the shell communicates with the internal part of the operating system, the <b>kernel</b>.</li>
</ul>
<div data-viz="0"></div>
<p>This is exactly the <b>command-line interpreter (CLI)</b> from the OS Services module. Because the shell is an ordinary program, there are several to choose from: the most popular are <b>tcsh, csh, korn (ksh) and bash</b>. Most of the time the differences between them are subtle. In this course we use <b>bash</b>.</p>
<div class="callout warn">Shell commands are <b>CASE SENSITIVE</b>: <code>ls</code> works, <code>LS</code> gives "command not found". The same rule holds for file names, as we will see with paths.</div>`,
      viz: [{ name: 'flow', caption: 'The shell sits between the user and the kernel.', props: { dir: 'h', steps: [
        { label: 'User', sub: 'types a command' },
        { label: 'Shell (bash)', sub: 'interprets it, starts programs', tone: 'acc' },
        { label: 'Kernel', sub: 'does the actual work', tone: 'warn' },
        { label: 'Hardware', tone: 'muted' }] } }],
      takeaway: 'Terminal = the text window; shell = the program that interprets your commands and asks the kernel to execute them. We use bash, and everything is case sensitive.'
    },
    {
      id: 'connect',
      h: 'The prompt, command syntax and man',
      why: 'read and write a command line',
      lead: 'The shell tells you it is ready by printing a prompt. Then you type a command — and almost every command follows the same pattern, so once you know the pattern you can read any command line.',
      html: `
<p>A typical prompt looks like <code>zhome:~/linux_tutorial$</code>. It has three parts:</p>
<ul>
  <li><b>the host</b> — <code>zhome</code>, the machine you are connected to;</li>
  <li><b>the current directory ("path")</b> — <code>~/linux_tutorial</code>, where you are now in the file system (<code>~</code> is short for your home directory);</li>
  <li><b>the prompt</b> itself — <code>$</code>, which means "type your command here".</li>
</ul>
<p>Many systems also show the user name, as in <code>john@ubuntu:~$</code> (user john, host ubuntu, directory ~).</p>
<p>A command can run by itself, or it can accept <b>arguments</b> that alter its behavior. A typical syntax looks like this:</p>
<div class="formula">command [-argument] [--long-argument] file</div>
<p>The square brackets mean "optional". Arguments that start with dashes are <b>options</b>: switches that change what the command does. A <b>short option</b> is one dash and one letter (<code>-h</code>); a <b>long option</b> is two dashes and a word (<code>--human-readable</code>). At the end comes what the command works on, for example a file. In the session below every line runs the same command, <code>ls</code> (list files), with different options:</p>
<pre class="code" data-lang="bash">john@ubuntu:~$ ls
john_directory  john_file
john@ubuntu:~$ ls -l
total 8
drwxrwxr-x 2 john john   40 Oct  1 11:10 john_directory
-rw-rw-r-- 1 john john 5120 Oct  1 11:17 john_file
john@ubuntu:~$ ls -l -h
total 8.0K
drwxrwxr-x 2 john john   40 Oct  1 11:10 john_directory
-rw-rw-r-- 1 john john 5.0K Oct  1 11:17 john_file
john@ubuntu:~$ ls -lh john_file
-rw-rw-r-- 1 john john 5.0K Oct  1 11:17 john_file
john@ubuntu:~$ ls -l --human-readable john_file
-rw-rw-r-- 1 john john 5.0K Oct  1 11:17 john_file</pre>
<p>Plain <code>ls</code> prints only names; <code>-l</code> adds details (permissions, owner, size, date); <code>-h</code> turns 5120 bytes into 5.0K; a file name at the end limits the output to that file. Two rules follow from the example:</p>
<div class="callout note">Short options can be combined: <code>ls -l -h</code> = <code>ls -lh</code>. A short option and its long form are the same thing: <code>-h</code> = <code>--human-readable</code>.</div>
<p>Nobody remembers all options. Whenever you need help with a command, type <b><code>man</code></b> and the command name: it opens the command's <b>manual page</b>. NAME says what the command does, SYNOPSIS how to call it, DESCRIPTION explains the options. <code>man</code> without an argument only asks back <code>What manual page do you want?</code>. Press <b>q</b> to leave the page.</p>
<pre class="code" data-lang="bash">zhome:~/linux_tutorial$ man echo
ECHO(1)                 User Commands                 ECHO(1)
NAME
       echo - display a line of text
SYNOPSIS
       echo [OPTION]... [STRING]...
DESCRIPTION
       Echo the STRING(s) to standard output.
       -n     do not output the trailing newline
zhome:~/linux_tutorial$ echo hello world
hello world</pre>
<p>The SYNOPSIS line <code>echo [OPTION]... [STRING]...</code> uses the same notation as the general syntax above: optional options, then the things to work on (<code>...</code> means "one or more").</p>`,
      takeaway: 'Prompt = host + current directory + $. Command line = command, then optional options (-x short, --word long, short ones can be combined), then the target. When in doubt: man <command>.',
      exam: 'Parts of the prompt (host / path / $); the general form command [-argument] [--long-argument] file; combining short options.'
    },
    {
      id: 'paths',
      h: 'The file system tree and paths',
      why: 'how to name a file',
      lead: 'Commands work on files, so first we must be able to say which file we mean. Linux keeps every file in one big tree, and a path is the route through that tree.',
      html: `
<p>The Linux file system is a <b>hierarchical tree</b>. The top directory is called <b>root</b> and is written <code>/</code>. Every other directory hangs below it, and every directory can contain files and further directories. There are no drive letters like <code>C:</code> — even other disks appear somewhere inside this one tree (see <code>/mnt</code> in the next section).</p>
<p>A <b>path</b> is the list of directories you walk through to reach a file, separated by <code>/</code>. For example <code>/home/john/portfolio/</code> means "start at root, go into home, then into john, then into portfolio".</p>
<div data-viz="0"></div>
<p>There are two ways to write a path. The only difference is <i>where you start walking</i>:</p>
<div class="cols">
  <div><b>Absolute pathname</b>
    <ul><li>begins with a forward slash <code>/</code>;</li><li>a complete "road map" from root to the file;</li><li>can be used any time, from any directory.</li></ul>
    <code>/home/john/portfolio</code>
  </div>
  <div><b>Relative pathname</b>
    <ul><li>does <b>not</b> begin with a slash;</li><li>gives the location relative to your <b>current working directory</b>;</li><li>a shorter way to name a file.</li></ul>
    from <code>/home/john</code>: <code>portfolio</code>, <code>../mary</code>
  </div>
</div>
<p>Why have both? An absolute path is unambiguous — it names the same file wherever you are — so it is the safe choice in scripts and configuration files. A relative path is shorter and convenient while you work inside one part of the tree. In the relative examples, <code>..</code> means "one level up", the <b>parent directory</b>: from <code>/home/john</code>, the path <code>../mary</code> goes up to <code>/home</code> and then down into <code>mary</code>.</p>
<div class="callout warn">Unix file names are <b>CASE SENSITIVE</b>: <code>File.txt</code> and <code>file.txt</code> are two different files.</div>`,
      viz: [{ name: 'tree', caption: 'Slide example: the paths /home/john/portfolio/ and /home/mary/.', props: { mono: true, root: { label: '/', note: 'root', children: [
        { label: 'bin' }, { label: 'etc' },
        { label: 'home', children: [
          { label: 'john', children: [{ label: 'portfolio', note: '/home/john/portfolio/', tone: 'acc' }] },
          { label: 'mary', note: '/home/mary/', tone: 'ok' }] },
        { label: 'usr' }] } } }],
      takeaway: 'One tree, rooted at /. An absolute path starts with / and works from anywhere; a relative path starts from the current working directory (.. = parent directory).',
      exam: 'Tell an absolute path (starts with /) from a relative one (starts from the current directory); resolve a path containing ..'
    },
    {
      id: 'dirs',
      h: 'The standard directory layout',
      why: 'where things live',
      lead: 'Now that we can name any place in the tree, the next question is: what is already there? Every Linux system has the same top-level directories, and each one exists for a reason.',
      html: `
<p>The layout is not random: directories group files by <b>purpose</b> — programs, libraries, configuration, user data, data that changes, and special "files" that are really windows into devices and the kernel. If you know the purpose, you can guess where something is. Here is the tree from the slides:</p>
<div data-viz="0"></div>
<p>The table gives the details, grouped by purpose. Read the first column as "what kind of thing", then look at the examples:</p>
<table class="t">
  <tr><th>Directory</th><th>Purpose</th><th>Examples</th></tr>
  <tr><td colspan="3"><b>Programs</b></td></tr>
  <tr><td><code>/bin</code></td><td><b>Binary files</b>: essential commands that may be used by both the system administrator <b>and</b> users</td><td>cat, chmod, cp, ls, mkdir, mv, ps, pwd, rm, rmdir, sh, su, mount; optional: csh, tar, gzip, netstat, ping</td></tr>
  <tr><td><code>/sbin</code></td><td><b>Super-user binaries</b>: system binaries used by the root user</td><td>fdisk, fsck, mkfs, mkswap, reboot, halt, ifconfig, init, route, swapon</td></tr>
  <tr><td><code>/usr</code></td><td>Secondary hierarchy: shareable, read-only data — most of the installed software</td><td>/usr/bin (most user commands), /usr/include (C header files), /usr/local, /usr/share/man (manual pages)</td></tr>
  <tr><td><code>/opt</code></td><td>Add-on application software packages</td><td>—</td></tr>
  <tr><td colspan="3"><b>Libraries</b></td></tr>
  <tr><td><code>/lib</code></td><td><b>Essential shared libraries and kernel modules</b>: the library images needed to boot the system and to run the binaries in <code>/bin</code> and <code>/sbin</code></td><td>—</td></tr>
  <tr><td><code>/usr/lib</code></td><td>Libraries for programming and packages: object files, libraries and internal binaries that are <b>not intended to be executed directly</b> by users or shell scripts</td><td>—</td></tr>
  <tr><td colspan="3"><b>Booting and configuration</b></td></tr>
  <tr><td><code>/boot</code></td><td><b>Boot files</b>: everything required for the boot process <b>except configuration files</b> (static files of the boot loader)</td><td>kernel (vmlinuz), initrd, grub, System.map</td></tr>
  <tr><td><code>/etc</code></td><td><b>Configuration files</b> and directories (host-specific system configuration)</td><td>passwd, group, fstab, hosts, shells, profile, inittab, mtab, motd, issue, resolv.conf, services</td></tr>
  <tr><td colspan="3"><b>User data</b></td></tr>
  <tr><td><code>/home</code></td><td><b>User area</b>: the users' home directories; each user can write in their own, other users may be able to read it depending on permissions</td><td>/home/john</td></tr>
  <tr><td><code>/root</code></td><td>Home directory of the <b>root</b> user (not inside /home)</td><td>—</td></tr>
  <tr><td colspan="3"><b>Data that changes</b></td></tr>
  <tr><td><code>/tmp</code></td><td>Temporary files of programs; <b>world writable</b> (everyone can write here)</td><td>—</td></tr>
  <tr><td><code>/var</code></td><td>Variable data files: logs, queues, caches</td><td>/var/log, /var/spool, /var/cache, /var/lock, /var/run, /var/tmp</td></tr>
  <tr><td colspan="3"><b>Special file systems and mount points</b></td></tr>
  <tr><td><code>/dev</code></td><td><b>Device files</b>: the location of special or device files</td><td>sda (a disk), tty (a terminal)</td></tr>
  <tr><td><code>/proc</code></td><td><b>Virtual file system</b>: directories and files that report system information and status</td><td>—</td></tr>
  <tr><td><code>/mnt</code></td><td><b>Mount area</b>: mount point where the administrator can temporarily mount a file system as needed; its content is a local issue and should not affect how any program runs</td><td>—</td></tr>
</table>
<p>Three patterns make the table easy to remember:</p>
<ul>
  <li><b>"s" stands for super-user.</b> <code>/bin</code> holds essential commands for <i>everyone</i> (ls, cp…); <code>/sbin</code> holds system commands for <i>root</i> (fdisk, reboot…).</li>
  <li><b>Essential vs everything else.</b> <code>/bin</code> and <code>/lib</code> contain only what is needed to boot and repair the system. The large rest of the programs and libraries lives in the secondary hierarchy <code>/usr</code> (<code>/usr/bin</code>, <code>/usr/lib</code>).</li>
  <li><b>Not everything is a real file.</b> <code>/dev</code> contains device files, and <code>/proc</code> contains files that the kernel creates on the fly to report system information. This is the Unix idea "<b>everything is a file</b>": devices and kernel information are read and written with the same commands as ordinary files. You will meet it again in the file types of <code>ls -l</code> and in the Devices lab.</li>
</ul>
<p>Two directories will matter for permissions later: <code>/tmp</code> is <b>world writable</b>, while in <code>/home</code> each user may write only in their own directory.</p>`,
      viz: [{ name: 'tree', caption: 'The Linux directory tree (slides 11 and 22).', props: { mono: true, root: { label: '/', note: 'the root directory', tone: 'acc', children: [
        { label: 'bin', note: 'essential command binaries' },
        { label: 'boot', note: 'static files of the boot loader' },
        { label: 'dev', note: 'device files' },
        { label: 'etc', note: 'host-specific system configuration' },
        { label: 'home', note: 'user home directories', children: [{ label: 'john' }, { label: 'mary' }] },
        { label: 'lib', note: 'essential shared libraries + kernel modules' },
        { label: 'mnt', note: 'temporary mount point' },
        { label: 'opt', note: 'add-on application packages' },
        { label: 'proc', note: 'virtual FS: system info/status' },
        { label: 'root', note: 'home of root user' },
        { label: 'sbin', note: 'system (super-user) binaries' },
        { label: 'tmp', note: 'temporary files, world writable', tone: 'warn' },
        { label: 'usr', note: 'secondary hierarchy', children: [
          { label: 'bin', note: 'most user commands' }, { label: 'include', note: 'C headers' },
          { label: 'lib', note: 'libraries, internal binaries' }, { label: 'local' }, { label: 'share', children: [{ label: 'man', note: 'manual pages' }] }] },
        { label: 'var', note: 'variable data', children: [{ label: 'log' }, { label: 'spool' }, { label: 'tmp' }] }] } } }],
      takeaway: 'Directories are grouped by purpose: programs (/bin for all, /sbin for root, /usr/bin), libraries (/lib essential, /usr/lib), configuration (/etc), homes (/home, /root), changing data (/tmp world writable, /var), special files (/dev devices, /proc kernel info).',
      exam: 'Purpose of /bin vs /sbin, /lib vs /usr/lib, /etc, /tmp (world writable), /root, /proc, /dev, /mnt, /boot.'
    },
    {
      id: 'nav',
      h: 'Moving around: pwd, cd, ls and the * wildcard',
      why: 'find your way in the tree',
      lead: 'Relative paths depend on "where you are". So the shell remembers a current working directory for you, and three commands let you print it, change it and look inside it.',
      html: `
<p>The <b>current working directory</b> is the directory that relative paths start from; the prompt shows it. These are the basic commands:</p>
<table class="t">
  <tr><th>Command</th><th>What it does</th></tr>
  <tr><td><code>pwd</code></td><td>print working directory: shows your current path</td></tr>
  <tr><td><code>cd &lt;dir&gt;</code></td><td>change directory: go to a specific directory</td></tr>
  <tr><td><code>cd ~</code></td><td><code>~</code> is the location of your <b>home directory</b></td></tr>
  <tr><td><code>cd ..</code></td><td><code>..</code> is the <b>parent</b> directory (one level up the tree)</td></tr>
  <tr><td><code>ls</code></td><td>list the files in the current directory</td></tr>
</table>
<p>The session below goes into a directory with an absolute path and comes back with <code>..</code>. Notice that <code>pwd</code> always prints the full <b>absolute</b> path, while the prompt abbreviates the home directory as <code>~</code>:</p>
<pre class="code" data-lang="bash">zhome:~$ pwd
/fs/zhome05/wiehe
zhome:~$ cd /fs/zhome05/wiehe/linux_tutorial/
zhome:~/linux_tutorial$ pwd
/fs/zhome05/wiehe/linux_tutorial
zhome:~/linux_tutorial$ cd ..
zhome:~$ pwd
/fs/zhome05/wiehe</pre>
<p><code>ls</code> has many options (for all of them: <code>man ls</code>). These six come from the slides; like all short options they can be combined, e.g. <code>ls -ltr</code>:</p>
<table class="t">
  <tr><th>Option</th><th>Meaning</th></tr>
  <tr><td><code>-l</code></td><td>long list (displays lots of information)</td></tr>
  <tr><td><code>-t</code></td><td>sort by modification time (newest first)</td></tr>
  <tr><td><code>-S</code></td><td>sort by size</td></tr>
  <tr><td><code>-h</code></td><td>file sizes in human-readable format (5.0K)</td></tr>
  <tr><td><code>-r</code></td><td>reverse the order</td></tr>
  <tr><td><code>-a</code></td><td>show hidden files (names starting with <code>.</code>)</td></tr>
</table>
<p>Decode <code>ls -ltr</code> option by option: <code>-l</code> long listing, <code>-t</code> sort by time with the newest first, <code>-r</code> reverse that order. Result: the <b>newest file is printed last</b>, right above the next prompt — handy in a big directory when you look for the file you just changed:</p>
<pre class="code" data-lang="bash">zhome:~/linux_tutorial$ ls -ltr
total 20
-rw-rw-r--  1 wiehe wiehe  92 Aug 30 11:54 ACTG.pl
-rw-rw-r--  1 wiehe wiehe 169 Aug 30 12:20 aa_sequence.pl
-rw-rw-r--  1 wiehe wiehe  42 Aug 30 12:22 hello_world.pl
-rw-rw-r--  1 wiehe wiehe  24 Aug 30 12:23 output.txt
-rw-rw-r--  1 wiehe wiehe  21 Aug 30 12:23 data.dat</pre>
<p>Often you want "all files of one kind". The <b>wildcard <code>*</code></b> matches any string of characters (even an empty one). Important: it is the <b>shell</b>, not <code>ls</code>, that replaces <code>*.pl</code> with the list of matching names before the command starts. That is why the wildcard works with every command (<code>cp *.txt …</code>, <code>rm *.dat</code>); the Bash module calls this a <b>shell expansion</b>.</p>
<pre class="code" data-lang="bash">zhome:~/linux_tutorial$ ls *.pl
aa_sequence.pl  ACTG.pl  hello_world.pl</pre>`,
      takeaway: 'pwd = where am I; cd = go there (~ = home, .. = parent); ls = what is here (-l -t -S -h -r -a, combinable: ls -ltr puts the newest file last). The shell expands * into matching file names before the command runs.',
      exam: 'Meaning of ~ and ..; what -l -t -S -h -r -a do; the output order of ls -ltr; how many files *.pl matches.'
    },
    {
      id: 'files',
      h: 'Creating, copying, moving and deleting',
      why: 'change the tree',
      lead: 'Looking around is not enough — we also need to change the tree: create directories, copy files, move or rename them, and delete what we no longer need.',
      html: `
<p>There are separate commands for directories and for files. The table lists them with the slide examples:</p>
<table class="t">
  <tr><th>Command</th><th>What it does</th><th>Slide example</th></tr>
  <tr><td><code>mkdir</code></td><td>create a new directory</td><td><code>mkdir new_directory</code></td></tr>
  <tr><td><code>rmdir</code></td><td>remove an <b>empty</b> directory</td><td><code>rmdir new_directory/</code></td></tr>
  <tr><td><code>cp</code></td><td>copy a file</td><td><code>cp data.dat data2.dat</code></td></tr>
  <tr><td><code>mv</code></td><td>move a file to a different location</td><td><code>mv data2.dat ./new_directory/</code></td></tr>
  <tr><td><code>mv</code></td><td>rename a file</td><td><code>mv output.txt input.txt</code></td></tr>
  <tr><td><code>rm</code></td><td>remove a file</td><td><code>rm data2.dat</code></td></tr>
  <tr><td><code>rm -r</code></td><td>remove <b>recursively</b>: all files and directories inside, then the directory itself</td><td><code>rm -r new_directory</code></td></tr>
</table>
<p>Two details explain most surprises:</p>
<ul>
  <li><b>mv does two jobs.</b> For the file system, moving and renaming are the same operation: both change the path under which the file is found. So <code>mv data2.dat ./new_directory/</code> moves the file (the target is a directory), and <code>mv output.txt input.txt</code> renames it (the target is a new name).</li>
  <li><b>rmdir vs rm -r.</b> <code>rmdir</code> refuses to remove a directory that is not empty — a safety net. <code>rm -r</code> goes inside and deletes every file and subdirectory, then the directory itself.</li>
</ul>
<p>The session below puts it together: create a directory, move a file into it, enter it, delete the file. The last <code>ls</code> prints nothing because the directory is now empty:</p>
<pre class="code" data-lang="bash">zhome:~/linux_tutorial$ ls
aa_sequence.pl  data2.dat  hello_world.pl  output.txt
ACTG.pl         data.dat   lines.txt
zhome:~/linux_tutorial$ mkdir new_directory
zhome:~/linux_tutorial$ mv data2.dat ./new_directory/
zhome:~/linux_tutorial$ cd new_directory/
zhome:~/linux_tutorial/new_directory$ ls
data2.dat
zhome:~/linux_tutorial/new_directory$ rm data2.dat
zhome:~/linux_tutorial/new_directory$ ls
zhome:~/linux_tutorial/new_directory$</pre>
<div class="callout warn">Deletions are <b>permanent</b> in Unix/Linux: there is no recycle bin. Be very careful with <code>rm -r</code>.</div>`,
      takeaway: 'mkdir / rmdir for directories (rmdir only if empty); cp copies; mv moves or renames; rm deletes a file; rm -r deletes a whole subtree — permanently.',
      exam: 'rmdir removes only an empty directory, rm -r removes everything recursively; mv = move and rename.'
    },
    {
      id: 'view',
      h: 'Reading and searching files',
      why: 'look inside files',
      lead: 'Once files exist, we want to see what is in them. What we need differs — the whole file, the beginning, the end, a search, a count — so Linux has one small tool for each question.',
      html: `
<p>Pick the tool by the question you are asking:</p>
<table class="t">
  <tr><th>Question</th><th>Command</th><th>What it does</th></tr>
  <tr><td rowspan="3">Show the whole file</td><td><code>cat</code></td><td>dumps the entire file to standard output (the screen); good for short, simple files</td></tr>
  <tr><td><code>less</code></td><td>displays a file and lets you move forward and backward: <b>Return</b> = one line forward, <b>space</b> = one page forward, <b>y</b> = one line back, <b>b</b> = one page back, <b>/</b> = search for a string, <b>q</b> = quit</td></tr>
  <tr><td><code>more</code></td><td>shows output one page at a time: <code>cat log.txt | more</code></td></tr>
  <tr><td rowspan="2">Show only a part</td><td><code>head</code></td><td>the top of a file; by default the <b>first 10 lines</b>; <code>-n</code> changes the number: <code>head -n50 file.txt</code> shows the first 50 lines</td></tr>
  <tr><td><code>tail</code></td><td>same as head, but the <b>last</b> lines (10 by default)</td></tr>
  <tr><td>Find something</td><td><code>grep</code></td><td>searches files for a specific string and prints the matching lines</td></tr>
  <tr><td>Count</td><td><code>wc</code></td><td>counts lines, words and characters; output columns: <b>first = lines, second = words, last = characters</b></td></tr>
  <tr><td>Compare</td><td><code>diff</code></td><td>compares two files and shows the differences</td></tr>
</table>
<p>Example: <code>lines.txt</code> contains the letters a, b, c, … one per line. Without options, <code>head</code> prints the first 10 lines:</p>
<pre class="code" data-lang="bash">zhome:~/linux_tutorial$ head lines.txt      # file with a, b, c, ... one per line
a
b
c
d
e
f
g
h
i
j
zhome:~/linux_tutorial$ grep "hello world" *.pl
hello_world.pl:print "hello world.\\n";</pre>
<p>In the <code>grep</code> line the shell first expands <code>*.pl</code> into three file names. When grep searches several files at once it prefixes every match with the file name, as <code>file_name:line</code>, so you can see where the match was found.</p>
<div class="callout note">Remember the order of the <code>wc</code> columns: lines, words, characters. An option selects one count: <code>wc -l</code> only lines, <code>wc -m</code> only characters (both appear in the next section and in the Bash module).</div>`,
      takeaway: 'cat = whole file, less/more = page by page, head/tail = first/last 10 lines (-n to change), grep = lines containing a string, wc = lines/words/characters, diff = differences between two files.',
      exam: 'head/tail print 10 lines by default; the order of the wc columns (lines, words, characters); the keys of less.'
    },
    {
      id: 'redirect',
      h: 'Redirection and pipes',
      why: 'combine small tools',
      lead: 'Each tool from the previous section does one small job. The real power of the shell is that you can connect them: send a program\'s output into a file, or straight into another program.',
      html: `
<p>Every program started by the shell has a <b>standard input (stdin)</b>, where it reads data — by default the keyboard — and a <b>standard output (stdout)</b>, where it writes its results — by default the screen. The program does not care where these streams really lead. So, before starting the program, the shell can <b>redirect</b> them to a file or to another program:</p>
<table class="t">
  <tr><th>Syntax</th><th>Meaning</th></tr>
  <tr><td><code>program_a | program_b</code></td><td><b>pipe</b>: program_a's output becomes program_b's input</td></tr>
  <tr><td><code>program_a &gt; file.txt</code></td><td>program_a's output is written to file.txt (the file is <b>overwritten</b>)</td></tr>
  <tr><td><code>program_a &gt;&gt; file.txt</code></td><td>program_a's output is <b>appended</b> to the end of file.txt</td></tr>
  <tr><td><code>program_a &lt; input.txt</code></td><td>program_a gets its input from the file input.txt</td></tr>
</table>
<p>Think of the arrows as showing the direction of the data. The difference to remember is <code>&gt;</code> versus <code>&gt;&gt;</code>: a single arrow <b>replaces</b> the content of the file (the old content is lost), a double arrow <b>adds</b> at the end. Both create the file if it does not exist yet.</p>
<div data-viz="1"></div>
<p>A <b>pipe</b> <code>|</code> connects two programs directly: stdout of the left program becomes stdin of the right one, with no temporary file in between. This is why the slides call redirection "piping": programs can output to other programs. Read a pipeline from left to right, like a sentence:</p>
<div data-viz="0"></div>
<p>The slide's examples of piping, each read in plain words:</p>
<table class="t">
  <tr><th>Command</th><th>Result</th></tr>
  <tr><td><code>ls -l &gt;&gt; log.txt</code></td><td>the long listing is appended to log.txt</td></tr>
  <tr><td><code>head pippo.txt | wc -m</code></td><td>the number of characters in the first 10 lines of pippo.txt</td></tr>
  <tr><td><code>ls -a | grep "pippo"</code></td><td>the files (hidden ones included) whose name contains "pippo"</td></tr>
  <tr><td><code>cat log.txt | more</code></td><td>log.txt shown page by page</td></tr>
</table>
<p>In every example the right-hand command neither knows nor cares that its input comes from another program — it simply reads stdin. So small tools plus pipes give you a new tool without writing any code. Bash scripts, in the Bash module, are built on exactly this idea.</p>`,
      viz: [
        { name: 'flow', caption: 'head pippo.txt | wc -m', props: { dir: 'h', steps: [
          { label: 'pippo.txt', tone: 'muted' },
          { label: 'head', sub: 'stdout: first 10 lines', tone: 'acc' },
          { label: '|  pipe', sub: 'stdout → stdin', tone: 'warn' },
          { label: 'wc -m', sub: 'counts characters', tone: 'acc' },
          { label: 'terminal', sub: 'a number', tone: 'ok' }] } },
        { name: 'graph', caption: 'Where the data goes with each redirection.', props: { w: 600, h: 200, nodes: [
          { id: 'in', label: 'input.txt', x: 80, y: 100, tone: 'muted' },
          { id: 'p', label: 'program_a', x: 300, y: 100, tone: 'acc', w: 130 },
          { id: 'f1', label: 'file.txt', sub: '> overwrite', x: 520, y: 40, tone: 'warn' },
          { id: 'f2', label: 'log.txt', sub: '>> append', x: 520, y: 160, tone: 'ok' }],
          edges: [{ from: 'in', to: 'p', label: '<' }, { from: 'p', to: 'f1', label: '>' }, { from: 'p', to: 'f2', label: '>>' }] } }
      ],
      takeaway: '> writes stdout to a file (overwrite), >> appends, < reads stdin from a file, | feeds one program\'s output into the next program\'s input.',
      exam: 'Difference between > and >>; what | does; read head pippo.txt | wc -m and ls -a | grep "pippo".'
    },
    {
      id: 'users',
      h: 'Users, UIDs and groups',
      why: 'who is who',
      lead: 'So far we have worked on files. But Linux is a multi-user system: many people and system services share one machine, and the OS must protect their files from each other. Protection starts with identity — and for Linux, a user is a number.',
      html: `
<p>When an account is created it is assigned a unique <b>user ID (UID)</b> number; no two accounts on the system have the same UID. Inside the OS it is this number, not the name, that identifies the user (the section on adding users shows what that means in practice). To see the UID of an account, type <code>id &lt;username&gt;</code>.</p>
<p>UIDs are handed out in ranges:</p>
<ul>
  <li><b>root</b>, the superuser, always has <b>UID = 0</b>;</li>
  <li>most Linux distributions reserve the <b>first 100 UIDs</b> for system use (accounts of services, not of people);</li>
  <li>new users get UIDs starting from <b>500 or 1000</b>; in <b>Ubuntu new users start at 1000</b>.</li>
</ul>
<p>Giving rights to every user one by one would be tedious, so Linux also understands <b>groups</b>: named sets of users, each with a <b>group ID (GID)</b>. The rules:</p>
<ul>
  <li>a user can belong to <b>several groups</b>;</li>
  <li>a file belongs to only <b>one user and one group</b> at a time;</li>
  <li>the superuser <b>root</b> (uid = 0) has extra privileges, and <b>only root can change the ownership</b> of a file.</li>
</ul>
<p>How do you get root's privileges when you need them? There are two ways, and they differ in <i>whose</i> password you type:</p>
<div class="cols">
  <div><b><code>su</code></b> + the <b>root password</b>. Everyone who uses it must know root's password.</div>
  <div><b><code>sudo -s</code></b> + <b>your own user password</b>. It works only for users the administrator has allowed to use sudo (on Ubuntu, the members of the <code>sudo</code> group).</div>
</div>
<p>Group information is stored in <code>/etc/group</code>, one line per group, fields separated by <code>:</code></p>
<div class="formula">group_name : password : GID : members</div>
<pre class="code" data-lang="bash">bob@bobs-computer:~$ cat /etc/group
root:x:0:
daemon:x:1:
bin:x:2:
sys:x:3:
adm:x:4:syslog,bob
...
cdrom:x:24:bob
sudo:x:27:bob</pre>
<p>Reading the example: group <code>adm</code> has GID 4 and the members syslog and bob; group <code>sudo</code> (GID 27) has the member bob — that is why bob may use sudo. The <code>x</code> in the password field is a placeholder; we meet the same <code>x</code> in /etc/passwd next.</p>`,
      takeaway: 'Users are numbers: UID (root = 0, the first 100 for the system, people from 500 or 1000, Ubuntu 1000). Groups (GID, /etc/group) give rights to many users at once. su asks for root\'s password, sudo -s for your own.',
      exam: 'UID of root = 0; UID ranges (100 for the system, new users from 500/1000, Ubuntu 1000); su vs sudo -s; a file has one owner and one group.'
    },
    {
      id: 'passwd',
      h: '/etc/passwd and /etc/shadow',
      why: 'where accounts and passwords live',
      lead: 'For every user the system must store who they are (name, UID, home, shell) and how to check their password. These two kinds of data need very different secrecy, so they are kept in two different files.',
      html: `
<p>User information is in <code>/etc/passwd</code>; password information is in <code>/etc/shadow</code>. Like <code>/etc/group</code>, both are plain text, one line per user, with fields separated by <code>:</code></p>
<pre class="code" data-lang="text">/etc/passwd:  joeuser:x:1000:1000:Joe User,,,:/home/joeuser:/bin/bash
/etc/group:   joeuser:x:1000:</pre>
<p><b>/etc/passwd</b> has seven fields. Match them with the example line from left to right:</p>
<div class="formula">Username : Password : UID : GID : Full_Name : Home_Directory : Default_Shell</div>
<table class="t">
  <tr><th>Field</th><th>Meaning</th><th>Example</th></tr>
  <tr><td>Username</td><td>the name the user types when logging in</td><td>joeuser</td></tr>
  <tr><td>Password</td><td><b>legacy field</b>: once the encrypted password was stored here; now it is only <code>x</code>, because the password has been moved to <code>/etc/shadow</code></td><td>x</td></tr>
  <tr><td>UID</td><td>the user ID of the account</td><td>1000</td></tr>
  <tr><td>GID</td><td>the group ID of the user's <b>default group</b></td><td>1000</td></tr>
  <tr><td>Full_Name</td><td>the user's full name</td><td>Joe User</td></tr>
  <tr><td>Home_Directory</td><td>the path to the user's home directory</td><td>/home/joeuser</td></tr>
  <tr><td>Default_Shell</td><td>the shell started at login</td><td>/bin/bash</td></tr>
</table>
<p>Why was the password moved out? Many programs need to read <code>/etc/passwd</code> — for example <code>ls -l</code> uses it to turn UIDs into user names — so the file <b>has to be readable by everyone</b> in the system. If the encrypted passwords stayed there, any user could copy them and try to guess them at leisure. That is why passwords were moved to <code>/etc/shadow</code>, which ordinary users cannot read.</p>
<p><b>/etc/shadow</b> has eight fields: the password itself plus rules about when it expires.</p>
<div class="formula">Username : Password : Last_Modified : Min_Days : Max_Days : Days_Warn : Disabled_Days : Expire</div>
<table class="t">
  <tr><th>Field</th><th>Meaning</th></tr>
  <tr><td>Username</td><td>the user's login name from /etc/passwd</td></tr>
  <tr><td>Password</td><td>the password in encrypted form, in the format <code>$type$salt$hashed</code></td></tr>
  <tr><td>Last_Modified</td><td>number of days since January 1, 1970 when the password was last changed</td></tr>
  <tr><td>Min_Days</td><td>minimum number of days before the password can be changed</td></tr>
  <tr><td>Max_Days</td><td>maximum number of days before the password must be changed; <b>99999</b> means a change is never required</td></tr>
  <tr><td>Days_Warn</td><td>how many days before expiration the user is warned</td></tr>
  <tr><td>Disabled_Days</td><td>how many days to wait after the password has expired before the account is disabled</td></tr>
  <tr><td>Expire</td><td>number of days since January 1, 1970 after which the account is disabled; empty (null) means the account <b>never expires</b></td></tr>
</table>
<p>The stored password is not the password itself but a <b>hash</b> of it: the result of a one-way function that is easy to compute but practically impossible to reverse. <code>$type</code> says which hashing algorithm was used:</p>
<table class="t">
  <tr><th>$type</th><th>Algorithm</th></tr>
  <tr><td><code>$1$</code></td><td>MD5</td></tr>
  <tr><td><code>$2a$</code>, <code>$2y$</code></td><td>Blowfish</td></tr>
  <tr><td><code>$5$</code></td><td>SHA-256</td></tr>
  <tr><td><code>$6$</code></td><td>SHA-512</td></tr>
</table>
<p>Why the <b>salt</b>? Without it, the same password would always give the same hash. An attacker could then compute the hashes of millions of likely passwords once, in advance (a <b>dictionary attack</b> or a <b>rainbow table attack</b>), and simply look up every stolen hash in that list. The salt is a random value stored together with the hash; it is generated by a <b>CSPRNG</b> (cryptographically secure pseudo-random number generator) and is unique to each user. Because every password is mixed with a different salt before hashing, a pre-computed list is useless — the attacker would need a separate list for every salt.</p>
<p>At login the check works like this:</p>
<ol class="steps">
  <li>Linux retrieves the salt stored with the user's account.</li>
  <li>It combines the salt with the password the user typed.</li>
  <li>It hashes the combination with the algorithm named in <code>$type</code>.</li>
  <li>It compares the result with the stored hash: if they match, the user is granted access.</li>
</ol>
<div data-viz="0"></div>
<div class="callout warn">If the Password field contains an asterisk <code>*</code> or an exclamation point <code>!</code>, no typed password can ever match, so the user <b>cannot log in with a password</b>. Other login methods — <b>key-based authentication</b>, or switching to that user — are still allowed.</div>`,
      viz: [{ name: 'flow', caption: 'Checking a password at login.', props: { dir: 'h', steps: [
        { label: 'typed password' },
        { label: '+ salt', sub: 'from /etc/shadow', tone: 'acc' },
        { label: 'hash($type)', tone: 'warn' },
        { label: 'compare', sub: 'with the stored hash', tone: 'ok' }] } }],
      takeaway: '/etc/passwd = public account data (name:x:UID:GID:full name:home:shell), readable by all. /etc/shadow = secret salted hashes ($type$salt$hashed, $6$ = SHA-512) plus password-aging fields. The salt defeats pre-computed (dictionary, rainbow table) attacks.',
      exam: 'Order of the passwd and shadow fields; why the password moved to shadow; $6$ = SHA-512; what the salt is for; meaning of * and !.'
    },
    {
      id: 'manage',
      h: 'Adding and removing users',
      why: 'manage accounts',
      lead: 'Now that we know where account data lives, we can create and delete accounts — the commands write those same files for us. One experiment, two accounts with one UID, shows that the OS really identifies users by number.',
      html: `
<p>A new account is created with <code>useradd</code>, run as root (so with <code>sudo</code>):</p>
<ul>
  <li>a new account is usually given the <b>next-highest unused</b> UID;</li>
  <li>in most Linux distributions <code>useradd</code> does <b>not</b> create the user's home directory; to create it too, use the option <b>-m</b>;</li>
  <li>to log in as the new user, a password must first be set with the <code>passwd</code> command followed by the user name: <code>sudo passwd username</code>;</li>
  <li><b>-u</b> (<code>--uid</code>) creates the user with a specific UID; adding <b>-o</b> allows a duplicate (non-unique) UID.</li>
</ul>
<pre class="code" data-lang="bash">bob@bobs-computer:~$ sudo useradd john
[sudo] password for bob:
bob@bobs-computer:~$ cat /etc/passwd | grep john
john:x:1001:1001::/home/john:
$ sudo passwd username
$ sudo useradd -u 1500 username
$ sudo useradd -o -u 1500 other_user      # same UID 1500</pre>
<p>Look at the line that useradd wrote into /etc/passwd: <code>john:x:1001:1001::/home/john:</code>. The UID 1001 is the next free number after the first user (1000), the Full_Name and Default_Shell fields are empty, and the home path is recorded although, without -m, the directory itself was not created.</p>
<p><b>Multiple accounts with the same UID.</b> The UID is the actual information the operating system uses to identify a user; usernames are provided merely as a convenience for humans. So if two users are assigned the same UID, Linux views them as <b>the same user</b>, even if they have different usernames and passwords. They can freely read and delete each other's files and kill each other's programs. Giving two users the same UID is almost always a <b>bad idea</b>. The slides list the exceptions where several usernames with one UID can make sense:</p>
<ul>
  <li>different users working at different sites can share files;</li>
  <li>logins and activities from the separate sites can be tracked separately (each person logs in with their own name);</li>
  <li>access can be disabled for one person without disabling it for all.</li>
</ul>
<p><b>Removing users</b> has three levels, from the safest to the most destructive:</p>
<pre class="code" data-lang="bash">/home$ sudo deluser maria                       # delete the user, keep their files
/home$ sudo deluser --remove-home maria         # also delete the home directory
/home$ sudo deluser --remove-all-files maria    # also delete every file on the system owned by maria</pre>`,
      takeaway: 'useradd (-m creates the home, -u sets the UID, -o allows a duplicate UID); passwd sets the password; deluser (--remove-home, --remove-all-files). The OS identifies users by UID: same UID = same user.',
      exam: 'useradd without -m creates no home; -u and -o; consequences of a shared UID; the deluser options.'
    },
    {
      id: 'exec',
      h: 'What happens when a program runs',
      why: 'why permissions matter',
      lead: 'Users and files are in place. They meet at one moment: when someone runs a program. That is where the kernel enforces protection — and it explains why every file needs the permission bits of the next section.',
      html: `
<p>A program may be run by a user, by the system when it starts, or by another process. Before the program can execute, the kernel inspects several things:</p>
<ol class="steps">
  <li>Is the file containing the program <b>accessible</b> to the user or group of the process that wants to run it?</li>
  <li>Does the file <b>permit execution</b> by that user or group (or by anybody)?</li>
</ol>
<div data-viz="0"></div>
<p>If both answers are yes, the program runs — and in most cases, while executing, it <b>inherits the privileges</b> of the user or process that started it. In other words, a program can do exactly what its user can do: a program started by john can read john's files, but not the files that john himself is not allowed to read.</p>
<p>So the kernel needs, for every file, a short description of "who may read it, who may change it, who may execute it". That description is the file's <b>permissions</b>.</p>`,
      viz: [{ name: 'flow', caption: 'What the kernel checks before a program starts.', props: { dir: 'h', steps: [
        { label: 'request to run', sub: 'user / system / process' },
        { label: 'file accessible?', sub: 'to the process\'s user/group', tone: 'warn' },
        { label: 'x allowed?', sub: 'for user/group/other', tone: 'warn' },
        { label: 'execution', sub: 'with the starter\'s rights', tone: 'ok' }] } }],
      takeaway: 'Before running a program the kernel checks access and execute permission; the running program then acts with the privileges of the user who started it.'
    },
    {
      id: 'perms',
      h: 'Reading permissions in ls -l',
      why: 'see who may do what',
      lead: 'Every file carries an owner, a group and nine permission bits, and ls -l shows them all. Once you can read one line of ls -l, you can answer any "who may do what" question.',
      html: `
<p>There are three <b>permissions</b>: <b>read (r)</b>, <b>write (w)</b> and <b>execute (x)</b>. What they allow differs a little between files and directories (the last section of the module covers directories). Each permission is granted separately to three <b>categories</b> of users:</p>
<ul>
  <li><b>User</b> — the file owner;</li>
  <li><b>Group</b> — the members of the file's group (users are divided into groups to make administrative tasks easier);</li>
  <li><b>Other</b> — everyone else on the Linux system.</li>
</ul>
<p>Why only three categories instead of a list of users per file? It is simple and fast: with one owner, one group and "the rest", the kernel needs just 9 bits per file, and still the owner, a team and the public can get different rights.</p>
<div class="formula">rwx rwx rwx &nbsp;=&nbsp; user | group | other</div>
<p>Here is a complete <code>ls -l</code> line, column by column:</p>
<pre class="code" data-lang="text">-r-xr-xr-x 1 root root 68524 2011-12-19 07:18 /usr/bin/top
|          | |    |    |     |                |
|          | |    |    |     |                +-- File Name
|          | |    |    |     +------------------- Modification Time/Date
|          | |    |    +------------------------- Size (in bytes)
|          | |    +------------------------------ Group
|          | +----------------------------------- Owner
|          +------------------------------------- "link count"
+------------------------------------------------ File Permissions</pre>
<p>The <b>first character</b> of the permission column is not a permission: it tells the <b>type</b> of the file. Here the "everything is a file" idea shows up again — devices, sockets and pipes appear in a listing just like regular files:</p>
<table class="t">
  <tr><th>Character</th><th>Type</th></tr>
  <tr><td><code>-</code></td><td>regular file</td></tr>
  <tr><td><code>d</code></td><td>directory</td></tr>
  <tr><td><code>l</code></td><td>symbolic link</td></tr>
  <tr><td><code>c</code></td><td>character device file</td></tr>
  <tr><td><code>b</code></td><td>block device file</td></tr>
  <tr><td><code>s</code></td><td>Unix domain socket: a special file for inter-process communication between two processes; besides data, processes can also send file descriptors over it</td></tr>
  <tr><td><code>p</code></td><td>named pipe: a file used by processes to exchange messages through a FIFO</td></tr>
</table>
<p>The remaining nine characters are the three rwx triplets. A <b>hyphen</b> <code>-</code> means "no permission". The slide example:</p>
<div class="formula">-rw-r--r-- 1 martin users 0 2012-04-11 09:20 file1</div>
<ul>
  <li>User (martin): <code>rw-</code> — read and write, but not execute;</li>
  <li>Group (users): <code>r--</code> — read only, no write or execute;</li>
  <li>Other: <code>r--</code> — every user on the system can read it, but not write or execute.</li>
</ul>
<p>In plain words: "a regular file; martin may read and change it; everybody else may only read it". The line for <code>/usr/bin/top</code> above, <code>r-x</code> three times, says: a regular file that everyone may read and run, and that no category may write.</p>`,
      takeaway: 'ls -l: first character = file type (- d l c b s p), then three rwx triplets for user, group and other; a hyphen means "not granted". Then link count, owner, group, size, date, name.',
      exam: 'Read an ls -l line column by column; the first character (- d l c b s p); permissions per category.'
    },
    {
      id: 'chmod',
      h: 'Changing permissions: chmod',
      why: 'set who may do what',
      lead: 'Reading permissions is half of the job; the owner (or root) must also be able to change them. chmod does this, and it understands two notations: one that edits single bits and one that sets all of them at once.',
      html: `
<p><b>chmod</b> (change mode) changes the permissions of files and directories. Syntax: <code>chmod permissions file/directory</code>. The permissions argument can be written in <b>symbolic notation</b> or in <b>numeric notation</b>.</p>
<p><b>Symbolic notation</b> reads like a short sentence: <i>who</i> + <i>operator</i> + <i>which permissions</i>. Take one item from each column:</p>
<table class="t">
  <tr><th>Category</th><th>Operator</th><th>Permission</th></tr>
  <tr><td><code>u</code> (user)</td><td><code>+</code> add to the existing permissions</td><td><code>r</code> (read)</td></tr>
  <tr><td><code>g</code> (group)</td><td><code>-</code> remove from the existing permissions</td><td><code>w</code> (write)</td></tr>
  <tr><td><code>o</code> (other)</td><td><code>=</code> assign exactly (absolute)</td><td><code>x</code> (execute)</td></tr>
  <tr><td><code>a</code> (all)</td><td>one of the operators above</td><td>one or more permissions</td></tr>
</table>
<p>So <code>g+x</code> = "give the group execute", <code>u+wx</code> = "give the user write and execute", <code>ug-x</code> = "take execute away from user and group". The operators <code>+</code> and <code>-</code> change only the bits you name and keep all the others, so the result depends on where you start. Follow the slide example step by step:</p>
<pre class="code" data-lang="bash"># testfile has permissions -r--r--r--
$ chmod g+x testfile     ==&gt;  -r--r-xr--
$ chmod u+wx testfile    ==&gt;  -rwxr-xr--
$ chmod ug-x testfile    ==&gt;  -rw-r--r--</pre>
<div class="callout warn">Slide error: the result of the last command is printed as <code>-rw--r--r--</code> (one hyphen too many). The correct result is <code>-rw-r--r--</code>.</div>
<p><b>Numeric notation</b> (or absolute mode) sets all nine bits at once with octal (base eight) digits. Each permission has a value — <b>r = 4, w = 2, x = 1, - = 0</b> — and for each category (User, Group, Other) you add up the values. Each sum is between 0 and 7:</p>
<table class="t">
  <tr><th>0</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th></tr>
  <tr><td><code>---</code></td><td><code>--x</code></td><td><code>-w-</code></td><td><code>-wx</code></td><td><code>r--</code></td><td><code>r-x</code></td><td><code>rw-</code></td><td><code>rwx</code></td></tr>
</table>
<p>Why does this work? 4, 2 and 1 are powers of two, so every sum can be split back in only one way: 5 can only be 4 + 1 = <code>r-x</code>, 6 only 4 + 2 = <code>rw-</code>. Three digits — user, group, other — therefore describe the complete permission set. The slide shows the two most typical values:</p>
<pre class="code" data-lang="bash">$ chmod 755 index.html
$ ls -l index.html
-rwxr-xr-x 1 root wheel 0 May 24 06:20 index.html
$ chmod 644 index.html
$ ls -l index.html
-rw-r--r-- 1 root wheel 0 May 24 06:20 index.html</pre>
<ul>
  <li><b>755</b> = <code>rwx r-x r-x</code>: the owner may do everything, everyone else may read and execute — typical for programs and directories;</li>
  <li><b>644</b> = <code>rw- r-- r--</code>: the owner may read and write, everyone else may only read — typical for documents and web pages.</li>
</ul>
<p>Use symbolic notation to change one bit and keep the rest; use numeric notation to set an exact final result. Practise converting in both directions with the calculator:</p>
<div data-viz="0"></div>
<p><b>Some special cases.</b> In the Owner, Group and Other columns you may see a letter in place of the x:</p>
<table class="t">
  <tr><th>Letter</th><th>Where</th><th>Meaning</th></tr>
  <tr><td><code>s</code></td><td>in the Owner column</td><td><b>setuid</b></td></tr>
  <tr><td><code>s</code></td><td>in the Group column</td><td><b>setgid</b></td></tr>
  <tr><td><code>t</code></td><td>at the end (Other column)</td><td><b>sticky bit</b></td></tr>
</table>
<div class="callout note">What they do, in one line each: a <b>setuid</b> program runs with the privileges of the file's <i>owner</i> instead of the user who started it — the exception to "a program inherits the privileges of its starter" (this is how the <code>passwd</code> command can update /etc/shadow for a normal user). <b>setgid</b> does the same with the file's group. The <b>sticky bit</b> on a directory means that only the owner of a file may delete it — it is set on the world-writable <code>/tmp</code>.</div>`,
      viz: [{ name: 'chmod', caption: 'Calculator: rwx ↔ octal ↔ symbolic (slide example: index.html).', props: { mode: '755', file: 'index.html' } }],
      takeaway: 'Symbolic: chmod [u g o a][+ - =][r w x] edits bits relative to the current state. Numeric: r = 4, w = 2, x = 1, one digit per category (755 = rwxr-xr-x, 644 = rw-r--r--). s in the owner/group column = setuid/setgid; t at the end = sticky bit.',
      exam: 'Convert rwx ↔ octal (755, 644, 754…); apply chmod g+x / u+wx / ug-x to given permissions; recognise setuid, setgid, sticky bit.'
    },
    {
      id: 'dirperms',
      h: 'Directory permissions and the final exercise',
      why: 'files vs directories',
      lead: 'One puzzle is left: can you delete a file that you are not allowed to write? The answer depends not on the file but on the directory that contains it, because a directory is itself a file whose data is a list of names.',
      html: `
<p>A directory is a special file whose content is the list of the names it contains. Keep that picture in mind and the slides' two critical points become logical:</p>
<div class="callout key"><b>Two critical points</b>:
<ol>
  <li>The permissions of a <b>directory</b> affect whether someone can see its contents or <b>add or remove files</b> in it.</li>
  <li>The permissions of a <b>file</b> determine what a user can do to the <b>data</b> in the file.</li>
</ol></div>
<p>Creating, deleting or renaming a file changes the list of names — that is, the directory's data, not the file's data. So it needs <b>w on the directory</b>. Changing what is written inside the file needs <b>w on the file</b>. The slide's example: if you do not have write permission for a directory, you cannot delete a file in it; if you have write access to the file, you can still update the data in it.</p>
<p>The table shows all three permissions side by side for files and directories:</p>
<table class="t">
  <tr><th>Permission</th><th>On a file</th><th>On a directory</th></tr>
  <tr><td><code>r</code></td><td>read the data</td><td>list the names inside</td></tr>
  <tr><td><code>w</code></td><td>change the data</td><td>create / delete / rename files inside it</td></tr>
  <tr><td><code>x</code></td><td>run it as a program</td><td>enter it (<code>cd</code>) and reach the files inside</td></tr>
</table>
<p>The pattern: on a directory, <code>r</code> lets you <i>see</i> the names, <code>x</code> lets you <i>pass through</i> to the files, and <code>w</code> lets you <i>change the list</i>.</p>
<p><b>Final exercise</b> from the slides: create a file in <code>~</code>; take away all permissions numerically; then, symbolically, give the user full permissions, the group read and execute, and everyone else read only. How would you do the last step numerically?</p>
<pre class="code" data-lang="bash">$ cd ~
$ touch myfile
$ chmod 000 myfile              # ---------- : all permissions removed
$ chmod u=rwx,g=rx,o=r myfile   # symbolic
$ ls -l myfile
-rwxr-xr-- 1 user user 0 ... myfile
$ chmod 754 myfile              # numeric: 7 = rwx, 5 = r-x, 4 = r--</pre>
<p>The symbolic step uses <code>=</code> because we want exact values, not changes; several categories are separated by commas. The numeric answer is built digit by digit: user rwx = 4 + 2 + 1 = 7, group r-x = 4 + 1 = 5, other r-- = 4 → <b>754</b>.</p>
<div data-viz="0"></div>`,
      viz: [{ name: 'chmod', caption: 'Result of the exercise: 754 = rwxr-xr--.', props: { mode: '754', file: 'myfile' } }],
      takeaway: 'w on the directory = create, delete, rename entries; w on the file = change its content. r on a directory = list names, x = enter and access. Final exercise: chmod u=rwx,g=rx,o=r = chmod 754.',
      exam: 'Deleting a file depends on w on the DIRECTORY, not on the file; the final exercise = chmod 754.'
    }
  ],
  terms: [
    { en: 'Terminal', ru: 'терминал', def: 'A text-based interface for command-line interaction.' },
    { en: 'Shell', ru: 'командная оболочка', def: 'The program started after login that interprets typed commands and asks the kernel to execute them (bash, csh, tcsh, ksh).' },
    { en: 'Command-line interpreter', ru: 'интерпретатор командной строки', def: 'CLI: a program that reads commands as text and executes them; on Linux, the shell.' },
    { en: 'Kernel', ru: 'ядро', def: 'The internal part of the OS that does the real work; the shell talks to it.' },
    { en: 'Prompt', ru: 'приглашение командной строки', def: 'The text the shell prints when it is ready for a command, e.g. host:path$.' },
    { en: 'Case sensitive', ru: 'чувствительный к регистру', def: 'Upper and lower case letters are different: ls ≠ LS, File.txt ≠ file.txt.' },
    { en: 'Command option', ru: 'опция команды', def: 'An argument starting with - (short, one letter) or -- (long, a word) that changes how a command behaves.' },
    { en: 'Manual page', ru: 'страница справочного руководства', def: 'The documentation of a command, opened with man <command>.' },
    { en: 'File system tree', ru: 'дерево файловой системы', def: 'The hierarchical structure of directories and files, starting at the root /.' },
    { en: 'Root directory', ru: 'корневой каталог', def: 'The top directory of the tree, written /.' },
    { en: 'Path', ru: 'путь', def: 'The list of directories leading to a file, separated by /.' },
    { en: 'Absolute path', ru: 'абсолютный путь', def: 'Absolute pathname: begins with /, a complete road map from the root; valid from any directory.' },
    { en: 'Relative path', ru: 'относительный путь', def: 'Relative pathname: does not begin with /; location relative to the current working directory.' },
    { en: 'Current working directory', ru: 'текущий рабочий каталог', def: 'The directory where relative paths start; shown by pwd, changed by cd.' },
    { en: 'Home directory', ru: 'домашний каталог', def: 'The personal directory of a user, written ~ (/home/<name>; /root for root).' },
    { en: 'Parent directory', ru: 'родительский каталог', def: 'The directory one level up, written ..' },
    { en: 'Hidden file', ru: 'скрытый файл', def: 'A file whose name starts with a dot; shown only by ls -a.' },
    { en: 'Wildcard', ru: 'подстановочный символ', def: '* matches any string in a file name; the shell expands it into the list of matching names.' },
    { en: 'Everything is a file', ru: 'всё есть файл', def: 'The Unix idea that devices, pipes, sockets and kernel information appear as files and are used with file commands.' },
    { en: 'Device file', ru: 'файл устройства', def: 'A special file in /dev that represents a device (e.g. sda, tty).' },
    { en: 'Virtual file system', ru: 'виртуальная файловая система', def: '/proc: files created by the kernel to report system information and status.' },
    { en: 'World writable', ru: 'доступный на запись всем', def: 'Writable by every user of the system, like /tmp.' },
    { en: 'Mount point', ru: 'точка монтирования', def: 'A directory (e.g. /mnt) where another file system is attached to the tree.' },
    { en: 'Standard input', ru: 'стандартный ввод', def: 'stdin: where a program reads its input; the keyboard by default.' },
    { en: 'Standard output', ru: 'стандартный вывод', def: 'stdout: where a program writes its output; the screen by default.' },
    { en: 'Redirection', ru: 'перенаправление', def: '> writes output to a file (overwrite), >> appends, < reads input from a file.' },
    { en: 'Pipe', ru: 'конвейер (канал)', def: 'program_a | program_b: the output of program_a becomes the input of program_b.' },
    { en: 'Recursively', ru: 'рекурсивно', def: 'Applied to a directory and everything inside it (rm -r).' },
    { en: 'User ID', ru: 'идентификатор пользователя', def: 'UID: the unique number that identifies an account; root has 0. The OS identifies users by UID.' },
    { en: 'Group ID', ru: 'идентификатор группы', def: 'GID: the number of a group; listed in /etc/group; the default GID of a user is in /etc/passwd.' },
    { en: 'Superuser', ru: 'суперпользователь', def: 'root, UID 0: has extra privileges; only root can change file ownership.' },
    { en: '/etc/passwd', ru: 'файл учётных записей /etc/passwd', def: 'Username:Password(x):UID:GID:Full_Name:Home_Directory:Default_Shell; readable by everyone.' },
    { en: '/etc/shadow', ru: 'файл теневых паролей /etc/shadow', def: 'Stores password hashes ($type$salt$hashed) and password-aging fields; not readable by ordinary users.' },
    { en: 'Password hash', ru: 'хэш пароля', def: 'The result of a one-way function applied to the (salted) password; stored instead of the password.' },
    { en: 'Salt', ru: 'соль', def: 'A random value (from a CSPRNG), unique per user, combined with the password before hashing; defeats dictionary and rainbow table attacks.' },
    { en: 'Dictionary attack', ru: 'атака по словарю', def: 'Trying a large list of likely passwords against stolen hashes.' },
    { en: 'Rainbow table attack', ru: 'атака с использованием радужных таблиц', def: 'Looking up stolen hashes in tables of hashes pre-calculated for many possible passwords.' },
    { en: 'CSPRNG', ru: 'криптографически стойкий генератор псевдослучайных чисел', def: 'Cryptographically secure pseudo-random number generator; used to create salts.' },
    { en: 'Key-based authentication', ru: 'аутентификация по ключу', def: 'Logging in with a cryptographic key instead of a password; still possible when the shadow password field is * or !.' },
    { en: 'useradd', ru: 'добавить пользователя', def: 'Creates an account: -m creates the home directory, -u sets the UID, -o allows a duplicate UID.' },
    { en: 'deluser', ru: 'удалить пользователя', def: 'Deletes an account; --remove-home also deletes the home, --remove-all-files all files owned by the user.' },
    { en: 'File permissions', ru: 'права доступа к файлу', def: 'Read, write and execute rights, given separately to user, group and other.' },
    { en: 'Link count', ru: 'число ссылок', def: 'The second column of ls -l: how many names (hard links) point to the file.' },
    { en: 'Symbolic link', ru: 'символическая ссылка', def: 'A file that points to another file by path; type l in ls -l.' },
    { en: 'Named pipe', ru: 'именованный канал', def: 'A FIFO special file that processes use to exchange messages; type p in ls -l.' },
    { en: 'Unix domain socket', ru: 'доменный сокет Unix', def: 'A special file for communication between two processes (also file descriptors); type s in ls -l.' },
    { en: 'chmod', ru: 'изменить права доступа', def: 'change mode: changes the permissions of a file or directory, in symbolic (u+x) or numeric (755) notation.' },
    { en: 'Symbolic notation', ru: 'символьная нотация', def: 'chmod with category (u g o a), operator (+ - =) and permissions (r w x), e.g. g+x.' },
    { en: 'Numeric notation', ru: 'числовая (восьмеричная) нотация', def: 'Absolute mode: r = 4, w = 2, x = 1; one octal digit 0–7 per user, group, other (e.g. 755).' },
    { en: 'setuid', ru: 'бит setuid', def: 's in the owner column: the program runs with the privileges of the file owner.' },
    { en: 'setgid', ru: 'бит setgid', def: 's in the group column: the program runs with the privileges of the file group.' },
    { en: 'Sticky bit', ru: 'липкий бит', def: 't at the end of the permissions: in a directory only the owner of a file may delete it (e.g. /tmp).' }
  ],
  questions: [
    { id: 'lin-01', type: 'single', q: 'The prompt is zhome:~/linux_tutorial$. What does ~/linux_tutorial mean?', options: ['The host name', 'The current directory (path)', 'The user name', 'The shell in use'], answer: 1, explain: 'zhome is the host, ~/linux_tutorial is the current directory (~ = your home directory) and $ is the prompt itself. This prompt does not show a user name.', section: 'connect', diff: 1 },
    { id: 'lin-02', type: 'tf', q: 'In Linux, shell commands and file names are case sensitive.', answer: true, explain: 'The slides stress it twice: ls and LS are different commands, and File.txt and file.txt are different files.', section: 'shell', diff: 1 },
    { id: 'lin-03', type: 'code', lang: 'bash', q: 'The directories /home/john and /home/mary exist. What does the last pwd print?', code: 'cd /home/john\ncd ../mary\npwd', options: ['/home/john/mary', '/home/mary', '/mary', '../mary'], answer: 1, explain: '.. is the parent of /home/john, i.e. /home; from there mary gives /home/mary. pwd always prints an absolute path, never a relative one like ../mary.', section: 'paths', diff: 1 },
    { id: 'lin-04', type: 'single', q: 'Which directory holds configuration files such as passwd, group, fstab and hosts?', options: ['/bin', '/var', '/etc', '/usr/lib'], answer: 2, explain: '/etc contains the configuration files (host-specific system configuration). /bin holds commands, /var variable data such as logs, /usr/lib libraries.', section: 'dirs', diff: 1 },
    { id: 'lin-05', type: 'single', q: 'How does /sbin differ from /bin?', options: ['/sbin holds binaries used by root (system binaries); /bin holds commands for both the administrator and users', '/sbin holds libraries, /bin holds executables', '/sbin holds the boot loader files', '/sbin holds temporary files'], answer: 0, explain: '/bin = essential commands for everyone (ls, cp…); /sbin = super-user binaries (fdisk, fsck, reboot…). The boot loader files are in /boot.', section: 'dirs', diff: 1 },
    { id: 'lin-06', type: 'single', q: 'Which directory is world writable, i.e. every user may write in it?', options: ['/root', '/tmp', '/etc', '/home'], answer: 1, explain: '/tmp is for the temporary files of programs and anyone may write there. In /home each user writes only in their own directory; /root is the home of root.', section: 'dirs', diff: 1 },
    { id: 'lin-07', type: 'single', q: 'Which directory contains the essential shared libraries and kernel modules needed to boot the system and to run the programs in /bin and /sbin?', options: ['/usr/lib', '/lib', '/opt', '/boot'], answer: 1, explain: '/lib = essential shared libraries + kernel modules. /usr/lib holds libraries for programming and packages and internal binaries not meant to be run directly.', section: 'dirs', diff: 2 },
    { id: 'lin-08', type: 'single', q: 'What does ls -ltr do?', options: ['Long listing sorted by time, the newest file last', 'Long listing sorted by size, largest first', 'Shows hidden files recursively', 'Long listing sorted by time, the newest file first'], answer: 0, explain: '-l = long listing, -t = sort by modification time (newest first), -r = reverse the order, so the newest file ends up last.', section: 'nav', diff: 2 },
    { id: 'lin-09', type: 'code', lang: 'bash', q: 'The directory contains aa_sequence.pl, ACTG.pl, data.dat, hello_world.pl and output.txt. How many names does the command print?', code: 'ls *.pl', options: ['1', '2', '3', '5'], answer: 2, explain: 'The shell expands *.pl into the names that end in .pl: aa_sequence.pl, ACTG.pl, hello_world.pl — 3 files.', section: 'nav', diff: 1 },
    { id: 'lin-10', type: 'single', q: 'How do you delete the directory new_directory together with everything inside it?', options: ['rmdir new_directory', 'rm new_directory', 'rm -r new_directory', 'mv new_directory ~'], answer: 2, explain: 'rm -r deletes recursively. rmdir removes only an empty directory, and rm without -r does not remove directories.', section: 'files', diff: 1 },
    { id: 'lin-11', type: 'code', lang: 'bash', q: 'The file n.txt contains the numbers 1 to 20, one per line. What does the command print?', code: 'tail n.txt | head -n 3', options: ['1 2 3', '11 12 13', '18 19 20', '8 9 10'], answer: 1, explain: 'tail prints the last 10 lines by default (11 … 20); the pipe passes them to head -n 3, which keeps the first three of them: 11, 12, 13.', section: 'view', diff: 2 },
    { id: 'lin-12', type: 'single', q: 'wc file.txt prints 3 6 28 file.txt. What does 6 mean?', options: ['The number of lines', 'The number of words', 'The number of characters', 'The size in KB'], answer: 1, explain: 'The wc columns are lines, words, characters: 3 lines, 6 words, 28 characters.', section: 'view', diff: 1 },
    { id: 'lin-13', type: 'code', lang: 'bash', q: 'At the start log.txt contains 5 lines. How many lines does it contain after these commands?', code: 'echo hello > log.txt\necho world >> log.txt', options: ['2', '6', '7', '1'], answer: 0, explain: '> overwrites the file (only "hello" remains), then >> appends "world" — 2 lines. The 5 old lines are lost.', section: 'redirect', diff: 2 },
    { id: 'lin-14', type: 'code', lang: 'bash', q: 'What does this command print?', code: 'head pippo.txt | wc -m', options: ['The number of lines in pippo.txt', 'The number of characters in the first 10 lines of pippo.txt', 'The first 10 characters of pippo.txt', 'The number of words in the whole of pippo.txt'], answer: 1, explain: 'head outputs the first 10 lines, the pipe sends them to the stdin of wc, and -m counts characters.', section: 'redirect', diff: 2 },
    { id: 'lin-15', type: 'single', q: 'What is the UID of root?', options: ['1', '0', '100', '1000'], answer: 1, explain: 'Root has UID = 0.', section: 'users', diff: 1 },
    { id: 'lin-16', type: 'single', q: 'From which UID do new users start in Ubuntu?', options: ['0', '100', '500', '1000'], answer: 3, explain: 'The first 100 UIDs are reserved for the system; new users start from 500 or 1000 — in Ubuntu from 1000.', section: 'users', diff: 1 },
    { id: 'lin-17', type: 'single', q: 'How do you become root by typing YOUR OWN password?', options: ['su', 'sudo -s', 'root -u', 'passwd root'], answer: 1, explain: 'sudo -s asks for the user\'s own password; su asks for the root password.', section: 'users', diff: 2 },
    { id: 'lin-18', type: 'code', lang: 'text', q: 'A line of /etc/passwd. What does the 4th field (the second 1000) mean?', code: 'joeuser:x:1000:1000:Joe User,,,:/home/joeuser:/bin/bash', options: ['UID', 'GID of the user\'s default group', 'Number of days before the password must be changed', 'Terminal number'], answer: 1, explain: 'Username:Password:UID:GID:Full_Name:Home_Directory:Default_Shell — the 4th field is the GID of the default group. The 3rd field is the UID.', section: 'passwd', diff: 2 },
    { id: 'lin-19', type: 'single', q: 'Why were the passwords moved from /etc/passwd to /etc/shadow?', options: ['/etc/passwd has to be readable by every user of the system', '/etc/passwd became too large', 'Colons cannot be stored in /etc/passwd', 'To make login faster'], answer: 0, explain: '/etc/passwd must be readable by everyone (programs use it to map UIDs to names), so the password hashes were moved to the protected /etc/shadow; passwd keeps only an x.', section: 'passwd', diff: 2 },
    { id: 'lin-20', type: 'single', q: 'The Password field in /etc/shadow starts with $6$. Which algorithm was used?', options: ['MD5', 'Blowfish', 'SHA-256', 'SHA-512'], answer: 3, explain: '$1$ = MD5, $2a$/$2y$ = Blowfish, $5$ = SHA-256, $6$ = SHA-512.', section: 'passwd', diff: 2 },
    { id: 'lin-21', type: 'single', q: 'Why is a salt added to the password before hashing?', options: ['It makes hashing faster', 'It protects against dictionary and rainbow table attacks that use pre-computed hashes', 'It allows the password to be recovered', 'It compresses the hash'], answer: 1, explain: 'A unique random salt per user means that hashes pre-computed for common passwords no longer match, so pre-calculated tables are useless.', section: 'passwd', diff: 2 },
    { id: 'lin-22', type: 'tf', q: 'If the Password field in /etc/shadow contains ! or *, the user cannot get into the system in any way.', answer: false, explain: 'Only password authentication is blocked. Key-based authentication and switching to the user are still allowed.', section: 'passwd', diff: 2 },
    { id: 'lin-23', type: 'multi', q: 'A line of /etc/shadow: bob:!$6$Xa9k$Qw3...:19000:0:99999:7::: — which statements are true? (select all that apply)', options: ['bob cannot log in with a password', 'The hash was computed with SHA-512', 'The password must be changed every 7 days', 'The account never expires', 'The password was changed 19000 seconds ago'], answer: [0, 1, 3], explain: '! in the Password field blocks password login; $6$ = SHA-512; 7 is Days_Warn (warning days), and Max_Days = 99999 means no change is required; the empty Expire field means the account never expires; 19000 counts days since 1 Jan 1970, not seconds.', section: 'passwd', diff: 3 },
    { id: 'lin-24', type: 'single', q: 'Which useradd option creates the home directory of the new user?', options: ['-u', '-o', '-m', '-h'], answer: 2, explain: '-m creates the home directory. -u sets the UID, -o allows a duplicate UID.', section: 'manage', diff: 1 },
    { id: 'lin-25', type: 'single', q: 'Two users with different names and passwords are given the same UID. How does Linux treat them?', options: ['As different users who share a group', 'As one user: they can read/delete each other\'s files and kill each other\'s programs', 'The second account is locked', 'As root'], answer: 1, explain: 'The OS identifies a user by the UID; the username is only a convenience for humans. Same UID = same user.', section: 'manage', diff: 2 },
    { id: 'lin-26', type: 'single', q: 'Which deluser option removes all files on the system owned by the user?', options: ['--remove-home', '--remove-all-files', '-m', '--purge-uid'], answer: 1, explain: '--remove-home deletes only the home directory; --remove-all-files deletes every file the user owns.', section: 'manage', diff: 2 },
    { id: 'lin-27', type: 'tf', q: 'In most cases a running program inherits the privileges of the user or process that started it.', answer: true, explain: 'This is the statement on the slide "A program runs…". Before the start the kernel checks access to the file and the execute permission.', section: 'exec', diff: 1 },
    { id: 'lin-28', type: 'code', lang: 'text', q: 'What does the number 68524 mean in this ls -l output?', code: '-r-xr-xr-x 1 root root 68524 2011-12-19 07:18 /usr/bin/top', options: ['Inode', 'Size (in bytes)', 'Link count', 'UID of the owner'], answer: 1, explain: 'The columns are: permissions, link count (1), owner, group, size (68524 bytes), date/time, name.', section: 'perms', diff: 1 },
    { id: 'lin-29', type: 'single', q: 'The first character of an ls -l line is p. What kind of file is it?', options: ['A pipe-like symbolic link', 'A named pipe (FIFO)', 'A printer device', 'A process'], answer: 1, explain: 'p = named pipe, used by processes to exchange messages through a FIFO. l = symbolic link, c/b = device files, s = socket.', section: 'perms', diff: 2 },
    { id: 'lin-30', type: 'code', lang: 'bash', q: 'testfile has permissions -r--r--r--. What are its permissions after the three commands?', code: 'chmod g+x testfile\nchmod u+wx testfile\nchmod ug-x testfile', options: ['-rwxr-xr--', '-rw-r--r--', '-r--r--r--', '-rw-rw-r--'], answer: 1, explain: 'g+x → -r--r-xr--; u+wx → -rwxr-xr--; ug-x removes x from user and group → -rw-r--r--. (The slide prints it with an extra hyphen.)', section: 'chmod', diff: 3 },
    { id: 'lin-31', type: 'single', q: 'Which permission string does chmod 755 index.html produce?', options: ['-rwxr-xr-x', '-rwxrwxr-x', '-rw-r--r--', '-rwxr--r--'], answer: 0, explain: '7 = rwx, 5 = r-x, 5 = r-x.', section: 'chmod', diff: 1 },
    { id: 'lin-32', type: 'single', q: 'The permissions are -rw-r-----. What is the octal value?', options: ['644', '640', '750', '604'], answer: 1, explain: 'rw- = 4 + 2 = 6, r-- = 4, --- = 0 → 640.', section: 'chmod', diff: 2 },
    { id: 'lin-33', type: 'code', lang: 'bash', q: 'What is the octal mode of data.txt after these commands?', code: 'chmod 750 data.txt\nchmod g-x,o+r data.txt\nchmod a-w data.txt', options: ['740', '544', '444', '554'], answer: 1, explain: '750 = rwxr-x---; g-x,o+r → rwxr--r-- (744); a-w removes w from everyone → r-xr--r-- = 544.', section: 'chmod', diff: 3 },
    { id: 'lin-34', type: 'single', q: 'In -rwsr-xr-x, what does the s in the owner column mean?', options: ['sticky bit', 'setgid', 'setuid', 'socket'], answer: 2, explain: 's in the Owner column = setuid; s in the Group column = setgid; t at the end = sticky bit. A socket is s as the FIRST character.', section: 'chmod', diff: 2 },
    { id: 'lin-35', type: 'single', q: 'A user has w permission on report.txt but NO w permission on the directory that contains it. What can the user do?', options: ['Delete report.txt', 'Change the data in report.txt, but not delete the file', 'Nothing at all with the file', 'Rename report.txt'], answer: 1, explain: 'File permissions control the data in the file; deleting, adding or renaming files changes the directory, so it needs w on the directory.', section: 'dirperms', diff: 3 },
    { id: 'lin-36', type: 'single', q: 'Final exercise: user — all permissions, group — read and execute, others — read only. How do you do it numerically?', options: ['chmod 751 file', 'chmod 754 file', 'chmod 764 file', 'chmod 745 file'], answer: 1, explain: 'rwx = 7, r-x = 5, r-- = 4 → 754 (symbolic: chmod u=rwx,g=rx,o=r file).', section: 'dirperms', diff: 2 },
    { id: 'lin-37', type: 'single', q: 'Which command is equivalent to ls -l -h?', options: ['ls -lh', 'ls -l-h', 'ls --lh', 'ls -L -H'], answer: 0, explain: 'Short options can be combined behind one dash: -l -h = -lh. Long options use two dashes and a whole word (--human-readable), and options are case sensitive, so -L and -H are different options.', section: 'connect', diff: 1 },
    { id: 'lin-38', type: 'multi', q: 'Before a program starts, what does the kernel check? (select all that apply)', options: ['Whether the program file is accessible to the user or group of the process that wants to run it', 'Whether the file permits execution by that user or group (or by anybody)', 'Whether the program was compiled by root', 'Whether the file is stored in /bin'], answer: [0, 1], explain: 'The slide lists exactly two checks: access to the file and execute permission for the user/group. Who compiled the program or where it is stored does not matter.', section: 'exec', diff: 1 },
    { id: 'lin-39', type: 'code', lang: 'bash', q: 'n.txt has 20 lines. What does the command print?', code: 'wc -l < n.txt', options: ['20', '20 n.txt', 'n.txt', 'Nothing: wc needs a file name'], answer: 0, explain: 'With < the shell opens n.txt and connects it to the standard input of wc. wc just reads stdin and never learns the file name, so it prints only the count. wc -l n.txt would print "20 n.txt".', section: 'redirect', diff: 2 }
  ]
});
