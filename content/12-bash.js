OS.addModule({
  id: 'bash',
  num: 12,
  group: 'lab',
  title: 'Bash Scripting',
  titleRu: 'Скрипты на Bash',
  icon: '📜',
  sources: ['ES3-ScriptBash.pdf'],
  summary: 'Writing bash scripts: scripting languages, the shell and the shebang, variables and quoting, arithmetic and strings, script arguments and read, decisions (if, test, [[ ]], case), loops (for, while, until, break/continue), arrays, and the slide examples and exercises 1–6.',
  bridge: 'In the two Linux labs you typed commands one at a time — ls, grep, chmod, ps, kill — and connected them with pipes. A bash script is those same commands saved in a file, plus variables, conditions and loops, so that the file can make decisions. This is the "automation" reason for a command-line interpreter from the OS Services module.',
  intro: `
<p>Whenever you repeat the same sequence of commands, you can write it once into a file and let the shell read it from there. That file is a <b>shell script</b>. It is read by the same bash you already know: what you type at the prompt also works in a script, and what is in a script also works at the prompt.</p>
<p>The module builds the language step by step, and each step removes a limit of the previous one: a file of fixed commands (shebang, Examples 1–3) → values that can change (<b>variables</b>, and <b>quoting</b> to control how the shell replaces them) → numbers and text (<b>arithmetic</b>, <b>concatenation</b>) → data from outside (<b>arguments</b> and <b>read</b>) → decisions (<b>if</b>, <b>test</b>, <b>[[ ]]</b>, <b>case</b>) → repetition (<b>for</b>, <b>while</b>, <b>until</b>, <b>break/continue</b>) → collections (<b>arrays</b>). One fact connects all of it: <b>every command returns an exit status, and 0 means success</b>. Bash's if and while do nothing more than look at that status.</p>`,
  sections: [
    {
      id: 'scripting',
      h: 'Scripting languages',
      why: 'what kind of language bash is',
      lead: 'Before learning bash it helps to know which family of languages it belongs to. Scripting languages give up some speed and strictness in exchange for something else: getting a job done with very little code.',
      html: `
<p><b>Scripting languages</b> stress <b>flexibility, rapid development</b> and <b>dynamic checking</b> (errors are found while the program runs, not before). <b>Scripts</b> are code used to <b>automate</b> processes that otherwise would have to be run step by step. Their type systems work with very high-level concepts such as <b>tables, patterns, lists and files</b>. And they are based on an <b>interpreter</b>: a program that translates and executes the code directly, without a separate compilation step.</p>
<p>Scripting languages descend from <b>two main types of ancestors</b>:</p>
<table class="t">
  <tr><th>Ancestor</th><th>Examples</th></tr>
  <tr><td>Languages designed to execute terminal commands in <b>batch mode</b> (a list of commands run one after another, without a user)</td><td>bash scripts, <code>.bat</code> files of MS-DOS</td></tr>
  <tr><td>Languages designed for <b>text processing</b> and report generation</td><td>sed and awk</td></tr>
</table>
<p>From these two lines grew <b>Perl</b>. Perl and Python are known as <b>"glue" languages</b>, because they were designed to glue existing programs together — exactly what a script does when it runs one program and passes the result to another. Other members of the family are the extensible languages of the web (<b>JavaScript, PHP</b>) and general-purpose scripting languages such as <b>Tcl, Ruby, VBScript and AppleScript</b>.</p>
<p>Despite their differences, scripting languages share <b>six common characteristics</b>. Each one follows from the goal of rapid development:</p>
<table class="t">
  <tr><th>#</th><th>Common characteristic</th><th>What it means</th></tr>
  <tr><td>1</td><td><b>Interpreted for both batch and interactive use</b></td><td>Perl has a JIT (just-in-time) compiler — sometimes called a "compreter" (compiler + interpreter) — that reads the entire program before execution; other languages execute each line as soon as it has been read; Python, Tcl and Ruby also accept commands typed at the keyboard</td></tr>
  <tr><td>2</td><td><b>Economy of expression</b></td><td>very little boilerplate code: <code>public static void main(String args[]) { System.out.println("Hello!"); }</code> in Java vs <code>echo "Hello!"</code></td></tr>
  <tr><td>3</td><td><b>Lack of declarations; simple scoping rules</b></td><td>most scripting languages have no declarations; in Perl every name is <b>global</b> by default; in Tcl and PHP everything is <b>local</b> by default; in Python a variable is local to the block in which it is assigned a value</td></tr>
  <tr><td>4</td><td><b>Flexible dynamic typing</b></td><td>in PHP, Ruby and Python the type of a variable is checked immediately before it is used; in Tcl and Perl a variable can be interpreted differently in different contexts</td></tr>
  <tr><td>5</td><td><b>Easy access to other programs</b></td><td>OS commands and their output are available cleanly and directly (unlike the convoluted <code>Runtime.exec</code> in Java); Perl provides 100 built-in commands for the OS, Python has the <code>os</code> module</td></tr>
  <tr><td>6</td><td><b>Sophisticated pattern matching</b></td><td><b>Pattern matching</b> tests whether a string has certain characteristics. Inherited from the text-processing ancestors: very good facilities for searching and string manipulation, based on <b>extended regular expressions</b>; <b>sed</b> is a very powerful language for text processing</td></tr>
</table>
<p>Characteristic 4 is easiest to see in the slide's Perl example: the same variable is used as a string or as a number, depending on the operator next to it.</p>
<pre class="code" data-lang="text">$a = "4";
print $a . 3 . "\\n";    # 43 : "." concatenates, so $a is used as a string
print $a + 4 . "\\n";    # 8  : "+" adds, so $a is used as a number</pre>
<p>Characteristic 6 ends with a puzzle on the slide:</p>
<div class="callout note">What does <code>sed '1!G;h;$!d'</code> do? It prints the lines of a file in <b>reverse order</b>: the input <code>1 2 3</code> (one per line) becomes <code>3 2 1</code>. For every line except the first, sed appends the lines collected so far (<code>G</code>), saves the result (<code>h</code>) and deletes it from the output (<code>d</code>) — except on the last line (<code>$</code>), which is printed.</div>
<p>All six characteristics fit bash: it is interpreted line by line and also works interactively at the prompt; <code>echo "Hello!"</code> is a complete program; variables need no declaration; every program on the system is one command away; and wildcards and <code>grep</code> give pattern matching.</p>`,
      takeaway: 'Scripting languages: interpreted (batch and interactive), little boilerplate, no declarations, dynamic typing, easy access to other programs, strong pattern matching. Ancestors: batch command files and text processors (sed, awk); Perl and Python are "glue" languages.',
      exam: 'List the 6 characteristics; glue languages (Perl, Python); the two types of ancestors (batch / text processing).'
    },
    {
      id: 'shell',
      h: 'The shell as an interpreter',
      why: 'which program runs a script',
      lead: 'A script needs an interpreter. For shell scripts the interpreter is the shell itself — the same program that reads your commands at the prompt.',
      html: `
<p>Recall from the Linux labs: the <b>shell</b> is simply another program on top of the kernel, which provides a basic human–OS interface. It is a <b>command interpreter</b>, built on top of the kernel, that enables users to run the services provided by the UNIX OS. In its simplest form, <b>a series of commands in a file is already a shell program</b>: it saves you from retyping the commands of common tasks.</p>
<div data-viz="0"></div>
<p>There are several UNIX shells. They form two families — the Bourne family (sh, then ksh, bash, zsh) and the C-shell family (csh, then tcsh). The table shows where each one comes from:</p>
<table class="t">
  <tr><th>Shell</th><th>Description</th></tr>
  <tr><td><code>sh</code></td><td><b>Bourne Shell</b> — the original shell (Steven Bourne, AT&amp;T)</td></tr>
  <tr><td><code>csh</code></td><td><b>C-Shell</b> — C-like syntax (Bill Joy, University of California)</td></tr>
  <tr><td><code>bash</code></td><td><b>Bourne Again Shell</b> — the GNU improved Bourne Shell</td></tr>
  <tr><td><code>ksh</code></td><td><b>Korn Shell</b> — Bourne + some C-shell (David Korn, AT&amp;T)</td></tr>
  <tr><td><code>tcsh</code></td><td><b>Turbo C-Shell</b> — a more user-friendly C-Shell</td></tr>
  <tr><td><code>zsh</code></td><td>an extension of bash (Paul Falstad, 1990)</td></tr>
</table>
<p>Because several shells may be installed, you should know which one you are using and how to switch:</p>
<pre class="code" data-lang="bash">$ echo $SHELL      # default shell (SHELL is a pre-defined variable)
$ cat /etc/shells  # available shells
$ exec bash        # switch to another shell (or simply type: bash)
$ exit             # go back to the previous shell</pre>
<p>You can switch to another shell just by typing its name; <code>exit</code> returns you to the previous one. Since shells differ in their syntax, a script written for bash may not work in another shell — so a script must say which interpreter it needs. That is the job of its first line.</p>`,
      viz: [{ name: 'layers', caption: 'The shell wraps the OS; users work through it.', props: { layers: [
        { label: 'users', tone: 'muted' },
        { label: 'Shell', sub: 'command interpreter', tone: 'acc' },
        { label: 'OS (kernel)', tone: 'warn' }] } }],
      takeaway: 'The shell is a command interpreter on top of the kernel; bash = Bourne Again Shell, the GNU improved sh. echo $SHELL shows your default shell, cat /etc/shells the available ones.',
      exam: 'Names and origins of sh, csh, bash, ksh, tcsh, zsh; how to check the default shell.'
    },
    {
      id: 'script',
      h: 'From a text file to a program: shebang and chmod +x',
      why: 'make a file runnable',
      lead: 'A script is just a text file. Two things turn it into a program that you can run like ls: a first line that names the interpreter, and the execute permission.',
      html: `
<p>A <b>shell script</b> is a script written for the shell. It has two key ingredients: <b>UNIX/Linux commands</b> and <b>shell programming syntax</b> (variables, if, loops…). It is a text file containing a sequence of commands, created with a text editor.</p>
<p><b>Step 1 — the header.</b> The first line is the <b>she-bang</b> (sometimes called sha-bang), the two characters <code>#!</code>, followed by the interpreter:</p>
<div class="callout key"><code>#!/bin/bash</code> tells the operating system that what follows is a script and not a regular text file, and which interpreter must execute it.</div>
<p><b>Step 2 — the permission.</b> After you create the script, you tell the OS that the file is a program that can be executed, by changing its mode with <code>chmod</code> — the execute bit from the Linux basics lab. Then you run it by its path:</p>
<pre class="code" data-lang="bash">$ chmod +x test.sh
$ ./test.sh</pre>
<p>Why <code>./test.sh</code> and not just <code>test.sh</code>? The shell looks for commands only in the directories listed in the <code>PATH</code> variable (see Variables), and the current directory is normally not one of them. <code>./</code> is a relative path that means "the file test.sh right here".</p>
<p><b>How scripts work.</b> When the script runs, the OS reads the shebang and starts that interpreter; the interpreter then executes every command of the script, one after another. The slide draws it like this:</p>
<div class="cols">
<pre class="code" data-lang="bash">#!/bin/bash --
echo "Hello"
ls -al</pre>
<pre class="code" data-lang="text">/bin/bash echo "Hello"
/bin/bash ls -al</pre>
</div>
<p>(The <code>--</code> after <code>/bin/bash</code> only means "no more options for bash"; it can be left out.) Two consequences follow from this design:</p>
<ul>
  <li><b>No compiler</b> is required to run a shell script, because the shell acts as an interpreter when it reads the script file.</li>
  <li>Shell programs run <b>less quickly</b> than compiled programs, because the shell must interpret each command inside the script before it is executed.</li>
</ul>
<p><b>Commenting.</b> Lines starting with <code>#</code> are comments — except the very first line, where <code>#!</code> indicates the shell that will run the script. On any line, the characters after an <b>unquoted</b> <code>#</code> are ignored (<code>echo "a # b"</code> prints the # because it is inside quotes). Comments are used to:</p>
<ul>
  <li>identify who wrote the script and when;</li>
  <li>identify the input variables;</li>
  <li>make the code easy to read and explain complex sections;</li>
  <li>track versions and record modifications.</li>
</ul>`,
      takeaway: 'A script is a text file of commands. #!/bin/bash on line 1 names the interpreter; chmod +x makes the file executable; run it as ./name.sh. Interpreted: no compiler needed, but slower than compiled code. # starts a comment.',
      exam: 'Meaning of #!/bin/bash; why chmod +x; why scripts are slower than compiled programs; # as a comment.'
    },
    {
      id: 'examples',
      h: 'Examples 1–3: commands in a file',
      why: 'the simplest scripts',
      lead: 'The first three examples contain no programming at all — only commands you already know from the Linux lab, one per line. They show that a script is, first of all, "commands you no longer have to retype".',
      html: `
<p><b>Example 1</b> — <code>hello.sh</code>: create the folder <code>hello</code> and inside it the file <code>hello.txt</code> with the text "hello guys!".</p>
<pre class="code" data-lang="bash">#!/bin/bash --
mkdir hello
echo "hello guys!" &gt; hello/hello.txt</pre>
<p><b>Example 2</b> — <code>list_files.sh</code>: create the folder <code>my_files</code>, create three empty files file1.txt, file2.txt and file3.txt inside it, and print the list of files in the folder.</p>
<pre class="code" data-lang="bash">#!/bin/bash
# Creating the my_files folder
mkdir my_files
# Creating three empty files
touch my_files/file1.txt
touch my_files/file2.txt
touch my_files/file3.txt
# List of files within the folder
ls my_files</pre>
<p><b>Example 3</b> — <code>backup.sh</code>: create the folder <code>backup_folder</code>; create the file <code>data.txt</code> with the text "Important data" in the current folder; copy it into backup_folder with the new name <code>data_backup.txt</code>.</p>
<pre class="code" data-lang="bash">#!/bin/bash
# Creating the Backup Folder
mkdir backup_folder
# Creating the data.txt file with text
echo "Important data" &gt; data.txt
# Copy the data.txt file to the backup_folder folder and rename
cp data.txt backup_folder/data_backup.txt</pre>
<p>The three examples use three ways to create a file: <code>touch</code> creates an empty file; <code>echo "text" &gt; file</code> creates a file containing the text (redirection from the Linux lab); <code>cp</code> with a new name copies and renames in one step. All paths are relative, so the files appear in the directory from which you run the script.</p>
<div class="callout warn">The shell runs the lines one after another and does <b>not stop</b> when a command fails. Run Example 1 a second time: <code>mkdir hello</code> fails with "File exists", but the next line still runs and <code>&gt;</code> overwrites hello.txt. To react to errors, a script must check the exit status of commands — which is exactly what <code>if</code> does later in this module.</div>
<p>These scripts always do the same thing. To make them flexible — another folder name, another text — we need values that can change: variables.</p>`,
      takeaway: 'A script runs its commands in order, exactly as if you typed them. touch = empty file, echo "text" > file = file with text, cp src dir/newname = copy and rename. A failing command does not stop the script.',
      exam: 'What a simple script does when it is run twice (mkdir error, > overwrites).'
    },
    {
      id: 'variables',
      h: 'Variables and environment variables',
      why: 'values that can change',
      lead: 'Fixed commands always do the same thing. To make a script flexible we need names for values that can change — variables. In bash a variable is simply a named piece of text.',
      html: `
<p><b>Variables</b> are symbolic names that represent values stored in memory. In bash you create one by assignment and read it with <code>$</code>:</p>
<pre class="code" data-lang="bash">#!/bin/bash
location=World
echo "Hello &#36;{location}"        # Hello World

cmd_to_run=echo
&#36;{cmd_to_run} "Hello World"     # Hello World</pre>
<ul>
  <li>Assignment is <code>name=value</code> with <b>no spaces around =</b>. With spaces, <code>location = World</code>, the shell would try to run a command named <code>location</code> with the arguments <code>=</code> and <code>World</code>.</li>
  <li>Reading is <code>$name</code>. Before it runs a line, the shell <b>replaces</b> <code>$name</code> with the value; this is called <b>variable expansion</b>. The command (echo here) never sees the name, only the value.</li>
  <li><code>$foobar</code> is interpreted as <code>&#36;{foobar}</code>. The braces mark where the name ends. You need them when the name is followed by characters that could be part of a name: <code>&#36;{VAR1}World</code>.</li>
  <li>Because expansion happens before the command runs, a variable can even hold a <b>command name</b>: <code>&#36;{cmd_to_run} "Hello World"</code> becomes <code>echo "Hello World"</code>.</li>
  <li>There are no declarations and no types: every value is a string. A variable that was never assigned simply expands to an empty string — no error.</li>
</ul>
<p>Not all variables are created by you. The slides distinguish three types:</p>
<table class="t">
  <tr><th>Type</th><th>Description</th></tr>
  <tr><td><b>Global (environment) variables</b></td><td>global system variables, written in <b>capitals</b>: <code>HOME</code>, <code>PATH</code>, <code>SHELL</code>, <code>USERNAME</code>, <code>PWD</code>. When you log in, many of them are already defined, and you can freely use them in your scripts</td></tr>
  <tr><td><b>Local variables</b></td><td>created in a script, as many as needed; a variable created this way exists only within that shell</td></tr>
  <tr><td><b>Special variables</b></td><td>reserved for the OS and the shell, such as the positional parameters <code>$0</code>, <code>$1</code>, …</td></tr>
</table>
<p>Environment variables are how the system passes information to every program and script. A few useful ones:</p>
<table class="t">
  <tr><th>Environment variable</th><th>Value</th></tr>
  <tr><td><code>USER</code></td><td>the user currently logged in</td></tr>
  <tr><td><code>HOME</code></td><td>the home directory of the current user</td></tr>
  <tr><td><code>EDITOR</code></td><td>the default text editor (used by the <code>edit</code> command)</td></tr>
  <tr><td><code>SHELL</code></td><td>the path of the user's shell (bash, zsh)</td></tr>
  <tr><td><code>LOGNAME</code></td><td>the name of the current user</td></tr>
  <tr><td><code>PATH</code></td><td>the list of directories searched for commands — tried in order, the first executable found is run</td></tr>
  <tr><td><code>LANG</code></td><td>the current locale settings</td></tr>
</table>
<p><code>PATH</code> explains why you can type <code>ls</code> instead of <code>/bin/ls</code>: the shell tries each directory in PATH and runs the first executable named ls. It also explains the <code>./test.sh</code> of the previous section — the current directory is not in PATH.</p>`,
      takeaway: 'name=value (no spaces), $name or ${name} to read it; the shell replaces the name with its value before the command runs. Environment variables (HOME, PATH, SHELL, USER…) are global and in capitals; local ones exist only in their shell; special ones ($0, $1…) are set by the shell.',
      exam: 'Why ${var} needs braces before letters; the three types of variables; what PATH contains.'
    },
    {
      id: 'quotes',
      h: 'Quoting: controlling expansion',
      why: 'literal text vs substitution',
      lead: 'Expansion is useful, but sometimes you want the text $name literally, or you want a phrase with spaces to stay one argument. Quote characters tell the shell what to expand and what to leave alone.',
      html: `
<p>Before it runs a command line, the shell performs replacements: <code>$variable</code> → its value, a command in backquotes → its output, <code>*</code> → file names; it also splits the line into words at spaces. The three quote characters switch these steps on or off:</p>
<table class="t">
  <tr><th>Character</th><th>Name</th><th>Behaviour</th></tr>
  <tr><td><code>'</code></td><td>single quote, <b>strong quote</b></td><td>everything inside is taken <b>literally</b>; nothing is treated as special</td></tr>
  <tr><td><code>"</code></td><td>double quote, <b>weak quote</b></td><td>references to variables (<code>$variable</code>) are replaced by their values; backquotes and the escape character <code>&#92;</code> are also treated specially</td></tr>
  <tr><td><code>&#96;</code></td><td><b>back quote</b> (backtick)</td><td>the string inside is treated as a <b>command</b>; the shell executes it, and if that succeeds, the command's output replaces the string</td></tr>
</table>
<p>So single quotes are <b>strong</b> — they protect everything — and double quotes are <b>weak</b> — they keep spaces and wildcards together but still let <code>$</code>, the backquote and <code>&#92;</code> work. The backquote is not really a quote: it means <b>command substitution</b>, "run this and put its output here". The slide example:</p>
<pre class="code" data-lang="bash">$ echo 'Today is:' &#96;date&#96;
Today is: Wed Nov 4 16:49:43 2026</pre>
<p><code>'Today is:'</code> is printed literally; then <code>date</code> runs, and its output replaces <code>&#96;date&#96;</code>. Compare all the cases side by side:</p>
<pre class="code" data-lang="bash">$ name=World
$ echo 'Hello $name'          # strong: nothing is replaced
Hello $name
$ echo "Hello $name"          # weak: $name is replaced
Hello World
$ echo "Cost: &#92;$name"         # inside "..." a backslash cancels the $
Cost: $name
$ echo Today is &#96;echo Monday&#96;  # command substitution
Today is Monday
$ echo "Files: *"             # quotes stop * from becoming file names
Files: *</pre>
<div class="callout note">If there is no backquote on your keyboard: Mac — <code>option+&#92;</code>, Windows — <code>ALT+96</code>, Linux — <code>ALTGR+'</code>.</div>`,
      takeaway: '\'single\' = everything literal; "double" = $variables, backquotes and \\ still work, but spaces and * are kept as they are; `command` = replaced by the output of the command.',
      exam: 'What echo prints for a variable inside single vs double quotes; backquote = substitution of a command\'s output.'
    },
    {
      id: 'arith',
      h: 'Arithmetic: $(( )), let and expr',
      why: 'numbers in a world of strings',
      lead: 'Every bash variable is a string, so a + sign means nothing special: a=5; a=$a+1 gives the text 5+1. To calculate, you must tell bash explicitly that this is arithmetic.',
      html: `
<p>Bash offers three ways to evaluate arithmetic:</p>
<ul>
  <li><code>$(( expression ))</code> — <b>arithmetic expansion</b>: computes the expression and is replaced by the result, like a variable. This is the slide's tip for Example 4: the syntax for operations is <code>$((var1 op var2))</code>.</li>
  <li><code>let "expression"</code> — evaluates an arithmetic expression, usually an assignment.</li>
  <li><code>expr</code> — an older external command that prints the result; you capture its output with backquotes (used in Exercise 4).</li>
</ul>
<p><b>Example 4</b> — <code>math_operations.sh</code>: define two variables a and b with numbers (e.g. a=5, b=3), create a variable sum with their sum and a variable product with their product, and print both.</p>
<pre class="code" data-lang="bash">#!/bin/bash
# Defining variables
a=5
b=3
# Sum and product
sum=$((a + b))
product=$((a * b))
# Printing Results
echo "Sum of a and b is: $sum"
echo "Product of a and b is: $product"</pre>
<pre class="code" data-lang="text">Sum of a and b is: 8
Product of a and b is: 15</pre>
<p>The slide "Operations on variables" shows three equivalent ways to decrease x by 1, and the compound assignment operators:</p>
<pre class="code" data-lang="bash">let "x=x-1"    # decrease x by 1
let "x-=1"     # decrease x by 1
x=$(($x-1))    # decrease x by 1
# +=  increment variable
# -=  decrement variable
# *=  multiply variable
# /=  divide variable</pre>
<ul>
  <li>Inside <code>let "…"</code> and <code>$(( ))</code> you may write variables with or without <code>$</code>: there, bash treats every name as a number.</li>
  <li>Bash arithmetic is <b>integer only</b>: <code>$((7 / 2))</code> = 3 (the fraction is cut off), and <code>%</code> gives the remainder (<code>$((7 % 2))</code> = 1).</li>
  <li><code>expr</code> needs spaces around every operator, because each number and each operator is a separate argument: <code>sd=&#96;expr $n % 10&#96;</code>. The multiplication sign must be escaped, <code>expr $rev &#92;* 10 + $sd</code>; otherwise the shell would expand <code>*</code> as a wildcard into file names before expr sees it.</li>
</ul>
<div class="callout warn">Without <code>let</code> or <code>$(( ))</code> the operators work on <b>strings</b>: <code>n=5; n+=1</code> gives <code>51</code>, and <code>i=$i+1</code> gives the string <code>0+1</code>. This is the most common arithmetic mistake in bash.</div>`,
      takeaway: 'Use $(( )) or let for arithmetic (integers only: 7/2 = 3, % = remainder); expr is the old way (spaces needed, escape \\*). Without them, + and += just join strings.',
      exam: 'Evaluate $(( )) with integer division; a sequence of let "x-=1", let "x*=2"…'
    },
    {
      id: 'strings',
      h: 'Concatenating strings',
      why: 'join text together',
      lead: 'The other side of "everything is a string": joining strings needs no operator at all — you simply write them next to each other. The only trap is where a variable name ends.',
      html: `
<p>The simplest way to concatenate two or more string variables is to write them one after another. You can also mix variables with literal text:</p>
<pre class="code" data-lang="bash">VAR1="Hello,"
VAR2=" World"
VAR3="$VAR1$VAR2"
echo "$VAR3"            # Hello, World

VAR1="Hello, "
VAR2="&#36;{VAR1}World"
echo "$VAR2"            # Hello, World</pre>
<p>In the second example the variable name is enclosed in braces to protect it from the characters around it. When a variable is followed by another character that is valid in a name, you must write <code>&#36;{VAR1}</code>; without braces bash would look for a variable named <code>VAR1World</code>, find nothing, and insert an empty string.</p>
<p>Another way is to append to a variable with the <code>+=</code> operator. Without <code>let</code> or <code>$(( ))</code>, <code>+=</code> means "add this text at the end" — which is also why <code>n=5; n+=1</code> gives 51:</p>
<pre class="code" data-lang="bash">VAR1="Hello, "
VAR1+=" World"
echo "$VAR1"            # Hello,  World

VAR=""
for ELEMENT in 'Hydrogen' 'Helium' 'Lithium' 'Beryllium'; do
  VAR+="&#36;{ELEMENT} "
done
echo "$VAR"             # Hydrogen Helium Lithium Beryllium</pre>
<p>The loop builds a string piece by piece: on each pass it appends one element and a space (the for loop is explained later in this module).</p>
<div class="callout warn">Slide detail: the output of the first += example is shown as "Hello, World", but <code>"Hello, "</code> + <code>" World"</code> actually gives two spaces in a row.</div>`,
      takeaway: 'Join strings by writing them next to each other ("$A$B"); use ${VAR} when letters follow the name; VAR+="text" appends text.',
      exam: 'Why ${VAR} is needed; what += does to a string (and to a "number" without let).'
    },
    {
      id: 'builtin',
      h: 'Script arguments and built-in variables',
      why: 'input from the command line',
      lead: 'A script becomes really useful when it works on data you give it at start, the way ls works on the directory you name. Bash stores these arguments, and some other facts about the run, in built-in variables.',
      html: `
<p>When you run <code>./script.sh Hello World</code>, the shell splits the line into words and stores them in <b>positional parameters</b> — variables whose names are numbers: <code>$0</code> = <code>./script.sh</code> (the script name), <code>$1</code> = <code>Hello</code>, <code>$2</code> = <code>World</code>. The number of positional parameters is in <code>$#</code> (here 2; <code>$0</code> is not counted).</p>
<div class="cols">
<pre class="code" data-lang="bash">#!/bin/bash
echo "Benvenuti $1 e $2!"</pre>
<pre class="code" data-lang="text">$ ./welcome.sh Pippo Pluto
Benvenuti Pippo e Pluto!</pre>
</div>
<p>("Benvenuti … e …!" is Italian for "Welcome … and …!".) Arguments are split at spaces unless they are quoted: <code>./count.sh a "b c" d</code> has three arguments, because "b c" is one word for the shell.</p>
<p>Built-in variables are set by the shell: you can <b>only read</b> their values, never assign to them. The complete list from the slides:</p>
<table class="t">
  <tr><th>Variable</th><th>Value</th></tr>
  <tr><td><code>$*</code></td><td>the positional parameters, starting from the first; inside <code>"…"</code> they form <b>one word</b>, separated by the first character of IFS (a space)</td></tr>
  <tr><td><code>$@</code></td><td>the positional parameters, starting from the first; inside <code>"…"</code> <b>each parameter is a separate word</b></td></tr>
  <tr><td><code>$#</code></td><td>the number of positional parameters (in decimal)</td></tr>
  <tr><td><code>$?</code></td><td>the exit status of the most recently executed foreground pipeline (0 = success)</td></tr>
  <tr><td><code>$-</code></td><td>the current option flags (set at start, by the <code>set</code> command, or by the shell itself, e.g. <code>-i</code>)</td></tr>
  <tr><td><code>$$</code></td><td>the process ID of the current shell</td></tr>
  <tr><td><code>$!</code></td><td>the process ID of the most recent command started in the background</td></tr>
  <tr><td><code>$0</code></td><td>the name of the current shell or shell script</td></tr>
</table>
<p>Three of them need a closer look:</p>
<ul>
  <li><b>"$*" vs "$@"</b>: both mean "all arguments". The difference appears only inside double quotes: <code>"$*"</code> glues them into <b>one</b> word, <code>"$@"</code> keeps <b>each argument as a separate word</b>. When you pass arguments on to another command, "$@" is almost always what you want, because it keeps arguments with spaces intact.</li>
  <li><b>$?</b> is the exit status of the last command: 0 means success, any other value means failure. It is the key to if and while (coming next).</li>
  <li><b>$$</b> and <b>$!</b> are PIDs, the link to the Processes lab: $$ is the PID of the shell running the script, $! the PID of the last command started in the background with <code>&amp;</code>.</li>
</ul>
<p><b>shift</b> moves the parameters one position to the left: <code>$2</code> becomes <code>$1</code>, <code>$3</code> becomes <code>$2</code>, and so on; the old <code>$1</code> is lost and <code>$#</code> decreases by 1. It lets a script handle "the first argument, then all the others":</p>
<div class="cols">
<pre class="code" data-lang="bash">#!/bin/bash
echo "Benvenuto $1!"
shift
echo "Benvenuti anche a voi $@!"</pre>
<pre class="code" data-lang="text">$ ./welcome.sh Pippo Pluto Topolino
Benvenuto Pippo!
Benvenuti anche a voi Pluto Topolino!</pre>
</div>
<p>("Benvenuti anche a voi" = "welcome to you too".) Combined with a loop, shift processes any number of arguments one by one — you will see it in the while section.</p>`,
      takeaway: '$0 = script name, $1, $2… = arguments, $# = how many; "$@" keeps each argument separate, "$*" joins them into one word; $? = exit status of the last command (0 = success); $$ = PID of the shell, $! = PID of the last background job; shift drops $1.',
      exam: '$# counts arguments (quotes join words); $0 is the script name; "$*" vs "$@"; the effect of shift.'
    },
    {
      id: 'read',
      h: 'Reading input: read — Example 5',
      why: 'input while the script runs',
      lead: 'Arguments must be known when the script starts. Sometimes the script has to ask the user while it is running — for a name, a number, a password. The built-in command read does that.',
      html: `
<p>The built-in <code>read NAME</code> waits until the user types a line on standard input and stores it in the variable NAME. (Because it reads stdin, it also works with redirection: <code>./script.sh &lt; answers.txt</code>.) The slide example, in Italian ("What is your name?" … "Hi NAME — all ok?"):</p>
<pre class="code" data-lang="bash">echo Come ti chiami?
read NOME
echo "Ciao $NOME - tutto ok?"</pre>
<p><b>Example 5</b> — <code>calculator.sh</code>: accept two numbers as input, then calculate and print the sum, the difference and the product.</p>
<pre class="code" data-lang="bash">#!/bin/bash
echo "Give me the first number:"
read num1
echo "Give me the second number:"
read num2
# results
echo "Sum: $((num1 + num2))"
echo "Diff: $((num1 - num2))"
echo "Product: $((num1 * num2))"</pre>
<pre class="code" data-lang="text">Give me the first number:
3
Give me the second number:
7
Sum: 10
Diff: -4
Product: 21</pre>
<p>The input arrives as text ("3", "7"), but inside <code>$(( ))</code> it is used as a number, so the arithmetic works — including the negative result 3 − 7 = −4. The script now has data; next it must make decisions based on that data.</p>`,
      takeaway: 'read VAR waits for one line on standard input and stores it in VAR. Use echo before it as a prompt and $(( )) to compute with the answer.',
      exam: 'Trace Example 5 for given inputs.'
    },
    {
      id: 'if',
      h: 'Decisions: if, exit status and test',
      why: 'run code only when…',
      lead: 'Bash\'s if works differently from if in C: it does not evaluate a boolean expression. It runs a command and looks at that command\'s exit status.',
      html: `
<p>Bash has these <b>control structures</b>: <code>if-then-else</code>, <code>case</code>, and the loops <code>for</code>, <code>while</code>, <code>until</code> and <code>select</code>. The basic if:</p>
<pre class="code" data-lang="bash">if command
then
  statements
fi</pre>
<div class="callout key">The statements are executed only if <code>command</code> <b>succeeds</b>, i.e. returns the <b>exit status 0</b>.</div>
<p>So in bash, "true" means "the command succeeded" (status 0) and "false" means "it failed" (any non-zero status). This is the opposite of C, where 0 is false — but it makes sense: there is only one way to succeed and many ways to fail, so the codes 1, 2, … can tell <i>what</i> went wrong. Any command can be a condition: <code>if grep -q x file</code> means "if file contains x".</p>
<p>To compare numbers or strings, bash provides the <b>test command</b>. It evaluates an expression and returns true (status 0) or false (status 1). It has two spellings:</p>
<div class="formula">test expression &nbsp;&nbsp;≡&nbsp;&nbsp; [ expression ]</div>
<p><code>[</code> is really a command named "[" whose last argument must be "]". That is why the spaces are mandatory: <b>a space after [ and before ]</b>. Without them the shell sees a word like <code>[5</code> and looks for a command with that name.</p>
<pre class="code" data-lang="bash">if test 5 -eq 7
then
  echo "same"
fi

if [ 5 -eq 7 ]
then
  echo "same"
fi</pre>
<p>The operators of test come in three groups. Notice that numbers and strings use <b>different</b> operators: <code>-eq</code> compares numerically, <code>=</code> compares text (so <code>[ 01 -eq 1 ]</code> is true, but <code>[ 01 = 1 ]</code> is false).</p>
<div class="cols">
<table class="t">
  <tr><th>Integer comparison</th><th>Function</th></tr>
  <tr><td><code>-gt</code></td><td>greater than</td></tr>
  <tr><td><code>-lt</code></td><td>less than</td></tr>
  <tr><td><code>-ge</code></td><td>greater than or equal to</td></tr>
  <tr><td><code>-le</code></td><td>less than or equal to</td></tr>
  <tr><td><code>-eq</code></td><td>equal to</td></tr>
  <tr><td><code>-ne</code></td><td>not equal to</td></tr>
</table>
<table class="t">
  <tr><th>String comparison</th><th>Function</th></tr>
  <tr><td><code>-z</code></td><td>test for an empty string</td></tr>
  <tr><td><code>=</code></td><td>equality of strings</td></tr>
  <tr><td><code>!=</code></td><td>inequality of strings</td></tr>
  <tr><th>Logical</th><th>Function</th></tr>
  <tr><td><code>-a</code></td><td>logical AND</td></tr>
  <tr><td><code>-o</code></td><td>logical OR</td></tr>
  <tr><td><code>!</code></td><td>logical NOT</td></tr>
</table>
</div>
<p>Because test is a command, its result is stored in the built-in variable <b>$?</b> like for any command (0 = true, 1 = false). The slide example — pay attention to the spaces:</p>
<pre class="code" data-lang="bash">#!/bin/bash
i="abc"
j="def"
[ $j != $i ]
echo $?
# output: 0   ("def" != "abc" is true)</pre>
<p><b>if-then-else</b> executes statements-1 if the condition is true and statements-2 if it is false. <b>elif</b> ("else if") chains further conditions; it is part of the if statement and cannot be used by itself:</p>
<div class="cols">
<pre class="code" data-lang="bash">if [ condition ];
then
  statements-1
else
  statements-2
fi</pre>
<pre class="code" data-lang="bash">if [ condition ]; then
  statements
elif [ condition ]; then
  statement
else
  statements
fi</pre>
</div>
<p><b>Exercise</b> <code>simple_if.sh</code>: assign a value to the variable n; if n is less than 10 print "It is a one digit number", otherwise "It is a two digit number".</p>
<pre class="code" data-lang="bash">#!/bin/bash
n=10
if [ $n -lt 10 ]
then
echo "It is a one digit number"
else
echo "It is a two digit number"
fi
# output: It is a two digit number   (10 -lt 10 is false)</pre>
<div class="callout warn">Without the spaces, <code>if [$n -lt 10]</code>, the shell looks for a command named <code>[5</code> → "command not found" (status 127). 127 is not 0, so the <b>else</b> branch runs — the script prints a wrong answer instead of stopping.</div>`,
      takeaway: 'if runs a command and checks its exit status (0 = true). test expr = [ expr ] — spaces required! Numbers: -eq -ne -gt -lt -ge -le; strings: = != -z; logic: -a -o !. The result is in $?.',
      exam: 'The operators -eq -ne -gt -lt -ge -le, -z = !=, -a -o !; $? = 0 means true; the spaces in [ ].'
    },
    {
      id: 'brackets',
      h: '[[ ]] and combining conditions — Example 6',
      why: 'safer, richer tests',
      lead: 'Single brackets have two weak points: a variable that is empty or contains spaces can break them, and combining conditions is clumsy. Bash added [[ ]] to fix both.',
      html: `
<p>Why can a variable break <code>[ ]</code>? Because <code>[</code> is an ordinary command, the shell expands and splits its arguments first. If <code>file="my file.txt"</code>, then <code>[ -f $file ]</code> becomes <code>[ -f my file.txt ]</code> — one word too many — and test fails with an error. The cure with single brackets is to quote every variable: <code>[ -f "$file" ]</code>.</p>
<p><b><code>[[</code></b> is bash's improvement to the <code>[</code> command. It changes the way the shell parses and interprets the code, up to the matching <code>]]</code>:</p>
<ul>
  <li>you no longer have to quote variables "like mad", because <code>[[</code> handles empty strings and strings with whitespace more intuitively (no word splitting inside);</li>
  <li>you can use the <code>&amp;&amp;</code> and <code>||</code> operators for boolean tests, and <code>&lt;</code> and <code>&gt;</code> for <b>string comparisons</b>;</li>
  <li><code>[[</code> works in <b>bash</b>, but not in <b>pure sh</b> — a script that uses it needs <code>#!/bin/bash</code>.</li>
</ul>
<pre class="code" data-lang="bash">if [ -f "$file" ]
if [[ -f $file ]]
if [[ $x &gt; 5 &amp;&amp; $y &lt; 10 ]]; then echo " x is greater than 5 and y is less than 10"; fi</pre>
<div class="callout warn">Two traps in the slide's last line. (1) Inside <code>[[ ]]</code>, <code>&gt;</code> and <code>&lt;</code> compare <b>strings alphabetically</b>, not numbers: with <code>x=10</code>, <code>[[ $x &gt; 5 ]]</code> is <b>false</b>, because the character "1" comes before "5". For numbers use <code>-gt</code> / <code>-lt</code>. (2) On the slide the semicolons before <code>then</code> and <code>fi</code> are missing; without them bash reports a syntax error.</div>
<p><b>AND and OR.</b> There are two styles, and it matters where you write them:</p>
<ul>
  <li><code>&amp;&amp;</code> / <code>||</code> <b>between</b> separate <code>[ ]</code> commands, or <b>inside</b> <code>[[ ]]</code>: <code>[ $n -gt 0 ] &amp;&amp; [ $n -le 10 ]</code>;</li>
  <li><code>-a</code> / <code>-o</code> <b>inside</b> a single <code>[ ]</code>: <code>[ $n -gt 0 -a $n -le 10 ]</code>.</li>
</ul>
<p>The slide's login check uses <code>[[ ]]</code> with <code>==</code> (string equality) and <code>&amp;&amp;</code>:</p>
<pre class="code" data-lang="bash">#!/bin/bash
echo "Enter username"
read username
echo "Enter password"
read password
if [[ ( $username == "admin" &amp;&amp; $password == "secret" ) ]]; then
echo "valid user"
else
echo "invalid user"
fi</pre>
<p><b>Example 6</b> — <code>number_check.sh</code>: ask the user for a number and use logical operators to check whether it is greater than 0 and at most 10, greater than 10 and at most 20, or greater than 20; print a different message for each case.</p>
<pre class="code" data-lang="bash">#!/bin/bash
# Prompt the user to enter a number
echo "Enter a number:"
read number
# Check the range using logical operators
if [ $number -gt 0 ] &amp;&amp; [ $number -le 10 ]; then
echo "The number is between 1 and 10"
elif [ $number -gt 10 ] &amp;&amp; [ $number -le 20 ]; then
echo "The number is between 11 and 20"
elif [ $number -gt 20 ]; then
echo "The number is greater than 20"
else
echo "The number is 0 or less"
fi</pre>
<p>Read the conditions as intervals: (0, 10], (10, 20], (20, ∞) and everything else. Each boundary value belongs to exactly one branch, because one side uses <code>-gt</code> and the other <code>-le</code>. Try the boundaries: 10 → "between 1 and 10"; 11 and 20 → "between 11 and 20"; 21 → "greater than 20"; 0 or −5 → "0 or less".</p>`,
      takeaway: '[[ ]] is bash-only: no word splitting inside, && and || allowed inside, < and > compare strings (not numbers!). With [ ], quote your variables and use -a/-o inside one bracket or && / || between brackets.',
      exam: 'How [[ ]] differs from [ ] (quoting, && ||, < > for strings, bash only); run Example 6 on the boundary values (10, 20, 0).'
    },
    {
      id: 'filetests',
      h: 'Testing files — Example 7 and Exercise 1',
      why: 'decide by file type',
      lead: 'Scripts work with files all the time, and many errors come from a file that does not exist or turns out to be a directory. test can answer questions about a file before you touch it.',
      html: `
<p>The test command can also analyze files:</p>
<pre class="code" data-lang="bash">if test -w "$1"
then
  echo "file $1 is write-able"
fi</pre>
<p>The most useful file operators — each is true if the path…</p>
<table class="t">
  <tr><th>Operator</th><th>True if the path…</th></tr>
  <tr><td><code>-e</code></td><td>exists</td></tr>
  <tr><td><code>-f</code></td><td>exists and is a regular <b>file</b></td></tr>
  <tr><td><code>-d</code></td><td>exists and is a <b>directory</b></td></tr>
  <tr><td><code>-r</code> / <code>-w</code> / <code>-x</code></td><td>is readable / writable / executable for you</td></tr>
  <tr><td><code>-s</code></td><td>exists and has a size greater than zero</td></tr>
</table>
<p><code>-r</code>, <code>-w</code> and <code>-x</code> ask the same question the kernel asks before an access: do the permission bits allow it for the user running the script?</p>
<p><b>Example 7</b>: a script takes one argument (a path) and says whether it is a file, a directory or neither. Tip: use <code>$#</code> to check that exactly one argument was given.</p>
<pre class="code" data-lang="bash">#!/bin/bash
# Check if exactly one argument was provided
if test "$#" -ne 1; then
  echo "Error in the number of parameters"
   exit 1
fi
# Check if the argument is a file, directory or neither
if test -f "$1"; then
  echo " $1 is a file."
elif test -d "$1"; then
  echo "$1 is a directory."
else
  echo "$1 is neither a file nor a directory."
fi</pre>
<p>The script is built in two blocks. The first block <b>validates the input</b>: with the wrong number of arguments it prints an error and stops with <code>exit 1</code>. <code>exit</code> ends the script, and its number becomes the script's exit status — 1 tells the caller "I failed", the same $? mechanism seen from the other side. Only then does the second block do the real work.</p>
<p><b>Exercise 1</b>: a script receives a string; if it is a <b>file</b>, print its first 10 lines; if it is a <b>directory</b>, print how many files/directories it contains. Hints from the slides: <code>head -n 10 &lt;nomefile&gt;</code> for the first 10 lines, <code>ls &lt;nomedir&gt; | wc -l</code> to count the entries (nomefile / nomedir = file name / directory name). The slide solution ("parametri non corretti" = "wrong parameters"):</p>
<pre class="code" data-lang="bash">#!/bin/bash

if test $# -ne 1
	then echo "parametri non corretti"

elif test -d "$1"
	then echo $1
	ls $1 |wc -l
elif test -f "$1"
	then head -c 10 $1
fi</pre>
<div class="callout warn">Slide error: for a file the solution uses <code>head -c 10</code>, which prints the first 10 <b>characters (bytes)</b>, not lines. The task asks for <code>head -n 10 $1</code>.</div>`,
      takeaway: '-e exists, -f regular file, -d directory, -r/-w/-x permission, -s non-empty. Check $# first and exit 1 on bad input. The slide solution of Exercise 1 uses head -c 10 (10 bytes) instead of head -n 10 (10 lines).',
      exam: '-f / -d / -w / -e; the check $# -ne 1 + exit 1; spot the head -c vs head -n mistake.'
    },
    {
      id: 'case',
      h: 'case and patterns — Example 8',
      why: 'choose among many values',
      lead: 'When one value must be compared with many alternatives, a chain of elif gets long and hard to read. case compares a value with a list of patterns and runs the branch of the first one that matches.',
      html: `
<p>The <b>case</b> statement executes statements based on specific values. It is often used in place of an if when there are many conditions. The value can be an expression; each set of statements must end with a pair of semicolons <code>;;</code>; and <code>*)</code> accepts any value not matched by the other patterns.</p>
<pre class="code" data-lang="bash">case $var in
val1)
  statements;;
val2)
  statements;;
*)
  statements;;
esac</pre>
<p>The patterns are tried <b>from top to bottom</b>, and only the first matching branch runs. That is why <code>*)</code>, which matches everything, must be last. The slide example (<code>case.sh</code>):</p>
<pre class="code" data-lang="bash">#!/bin/bash
echo -n "Enter a number 1 &lt; x &lt; 10: "
read x
case $x in
1) echo "Value of x is 1.";;
2) echo "Value of x is 2.";;
3) echo "Value of x is 3.";;
4) echo "Value of x is 4.";;
5) echo "Value of x is 5.";;
6) echo "Value of x is 6.";;
7) echo "Value of x is 7.";;
8) echo "Value of x is 8.";;
9) echo "Value of x is 9.";;
0 | 10) echo "wrong number.";;
*) echo "Unrecognized value.";;
esac</pre>
<p>case compares text, not numbers: the input <code>10</code> does not match the pattern <code>1)</code>, because "10" and "1" are different strings; it matches <code>0 | 10)</code>.</p>
<p>The patterns of case are the same <b>shell expansions</b> you met with file names. The shell expands names with the "jolly characters" <code>*</code>, <code>?</code> and <code>[..]</code> into the list of matching file names: in <code>ls -al *.sh</code>, the pattern <code>*.sh</code> is replaced by all file names with the extension .sh. These patterns are a special kind of regular expression whose meaning depends on the context. In case they are matched against the value instead of file names:</p>
<pre class="code" data-lang="bash">case $1 in
aa|ab) echo A ;;
b?)      echo B ;;
c*)      echo C ;;
*)       echo D ;;
esac</pre>
<table class="t">
  <tr><th>Pattern</th><th>Meaning</th><th>$1 → output</th></tr>
  <tr><td><code>aa|ab</code></td><td><code>|</code> = alternative</td><td>ab → A</td></tr>
  <tr><td><code>b?</code></td><td><code>?</code> = exactly one character (any)</td><td>bc → B, but b and bcd → D</td></tr>
  <tr><td><code>c*</code></td><td><code>*</code> = any string, also an empty one</td><td>c, cat → C</td></tr>
  <tr><td><code>*</code></td><td>anything else</td><td>xyz → D</td></tr>
</table>
<p><b>Example 8</b>: a script takes a file name as its only argument and uses case to decide whether it starts with a <b>lowercase</b> "a".</p>
<pre class="code" data-lang="bash">#!/bin/bash
# Check if exactly one argument was provided
if test "$#" -ne 1; then
  echo "Error: Please provide a single filename as an argument."
  exit 1
fi
# Use the case structure to check if $1 starts with "a" in lowercase
case "$1" in
  a*)
    echo "The filename starts with 'a'."
    ;;
  *)
    echo "The filename does not start with 'a'."
    ;;
esac</pre>
<p>Patterns are case sensitive, like everything in the shell: <code>a*</code> matches "apple.txt" but not "Apple.txt".</p>`,
      takeaway: 'case $var in pattern) commands;; … esac — the first matching pattern wins; | = alternatives, ? = exactly one character, * = any string; *) catches the rest. Patterns compare text and are case sensitive.',
      exam: 'Which case branch runs for a given argument (?, *, |); ;; and esac; case is case sensitive.'
    },
    {
      id: 'for',
      h: 'for loops — Exercises 2 and 3',
      why: 'repeat for each item',
      lead: 'Decisions are not enough when the same work must be done for many items — every argument, every file in a directory. The for loop repeats a block once for each word of a list.',
      html: `
<p>The for structure loops through a list of values:</p>
<pre class="code" data-lang="bash">for var in list
do
  statements
done</pre>
<p>The statements are executed with <code>var</code> set to each value in the <code>list</code>, one after another. The list is an ordinary command line, so it is expanded first — variables are replaced and split at whitespace, <code>*</code> becomes file names — and the loop then runs once per resulting word. Two slide examples:</p>
<div class="cols">
<pre class="code" data-lang="bash">#!/bin/bash
let sum=0
for num in 1 2 3 4 5
do
let "sum = $sum + $num"
done
echo $sum
# output: 15</pre>
<pre class="code" data-lang="bash">#!/bin/bash
lista="antonio
michele
paolo
luca"
for x in $lista
do
echo "The value of variable x is: $x"
sleep 1
done
# The value of variable x is: antonio
# The value of variable x is: michele
# The value of variable x is: paolo
# The value of variable x is: luca</pre>
</div>
<p>In the second example <code>$lista</code> is not quoted, so its value is split at the newlines into four words — four iterations. With <code>"$lista"</code> in quotes there would be only one iteration.</p>
<pre class="code" data-lang="bash">#!/bin/bash
for x in *
do
ls -l "$x"
sleep 1
done
# Lists all files in current directory

#!/bin/bash
for x in /bin
do
ls -l "$x"
done
# Lists all files in /bin</pre>
<div class="callout note"><code>for x in *</code> gets one file name of the current directory per iteration. <code>for x in /bin</code> is a list of <b>one</b> word: a single iteration, and it is <code>ls -l "/bin"</code> itself that lists the files of /bin.</div>
<p>There is also a <b>C-style for</b> (used in "Analyzing scripts" below): <code>for ((nr=1; nr&lt;$MAX; nr++))</code> — initialisation; condition; step, exactly as in C.</p>
<p><b>Exercise 2</b>: building on Exercise 1, write a script as a new command <code>&lt;new_command&gt; &lt;dir&gt;</code> that scans the directory and, for every element, prints the name and the first 10 lines of each file, and the name and the number of elements of each directory.</p>
<pre class="code" data-lang="bash">#!/bin/bash
if  [ $# -ne 1 ]; then
	echo "you did not specify the directory"
	exit
fi

if ! test -d $1; then
	echo "$1 is not a valid directory"
	exit
fi

cd $1

for i in *
do
	if test -d "$i"; then
		echo "$i:" &#96;ls $i |wc -l&#96; "elements"
	elif test -f "$i"; then
		echo "$i:" &#96;head -n 10 $i&#96;
	fi
done</pre>
<p>The structure is the same as in Example 7: validate the input (number of arguments, is it a directory?), then do the work. <code>cd $1</code> moves into the directory so that <code>*</code> expands to its entries; the loop then applies the Exercise 1 logic to each entry.</p>
<div class="callout note">Command substitution without quotes (<code>&#96;head -n 10 $i&#96;</code>) is split into words, and echo joins them with spaces: the 10 lines of the file are printed on one line.</div>
<p><b>Exercise 3</b>: <code>&lt;new_command&gt; &lt;dir&gt; &lt;filter&gt;</code> — like Exercise 2, but exclude the files/directories that contain the string filter.</p>
<pre class="code" data-lang="bash">#!/bin/bash

if ! test -d $1; then
	echo "$1 is not a valid directory"
	exit
fi

cd $1

for i in *
do

	case $i in

		$2*)
		;;

		*)
			if test -d "$i"; then
				echo "$i:" &#96;ls $i |wc -l&#96; "elements"
			elif test -f "$i"; then
				echo "$i:" &#96;head -n 10 $i&#96;
			fi
		;;
	esac
done</pre>
<div class="callout warn">The pattern <code>$2*)</code> excludes only the names that <b>start</b> with filter; "contains" would need <code>*$2*)</code>. The empty branch <code>;;</code> means "do nothing" — that is how the filtered names are skipped.</div>`,
      takeaway: 'for var in list runs the body once per word of the expanded list ($var is split at whitespace, * becomes file names). C-style: for ((i=1; i<=n; i++)). Exercises 2–3 combine for, test -d / -f and case.',
      exam: 'How many iterations a for loop makes for a given list; C-style for; read Exercises 2 and 3.'
    },
    {
      id: 'while',
      h: 'while and until — Exercise 4',
      why: 'repeat while a condition holds',
      lead: 'A for loop needs its list in advance. When you do not know how many repetitions are needed — "while there are arguments left", "until the number has no digits left" — you need a loop driven by a condition.',
      html: `
<p>The <b>while</b> structure executes a set of commands while a condition is true. The loop ends as soon as the condition becomes false; if the condition never becomes false, the loop never ends (an <b>infinite loop</b>). As with if, the condition is a command and "true" means exit status 0.</p>
<pre class="code" data-lang="bash">while expression
do
  statements
done</pre>
<p>Slide example: the sum of the numbers from 0 to x.</p>
<pre class="code" data-lang="bash">#!/bin/bash
echo -n  "Enter a number: "; read x
sum=0
i=0
while [[ $i -le $x ]]; do
     let "sum = sum + i"
        i=$i+1
    done
echo "the sum of the first $x numbers is: $sum"</pre>
<div class="callout warn"><code>i=$i+1</code> assigns a <b>string</b> ("0+1", then "0+1+1", …), not a number. The script still works, because inside <code>[[ … -le … ]]</code> and <code>let</code> the operands are evaluated as arithmetic expressions. For the input 4 it prints 10. The clean version is <code>let "i=i+1"</code> or <code>i=$((i+1))</code>.</div>
<p><b>while + shift</b> processes all the arguments of a script, one per iteration (<code>shift</code>: move on to the next parameter). The loop runs as long as there are arguments left:</p>
<pre class="code" data-lang="bash">while [ $# -gt 0 ]
do
echo $1
shift
done</pre>
<div data-viz="0"></div>
<p><b>Exercise 4</b>: write a script that prints a number in reverse order. The input comes from the command line; without input it prints an error message. Example: <code>./reverse.sh 134</code> → <code>Reverse number is 431</code>. The slide's algorithm:</p>
<ol>
  <li>Let the input number be n.</li>
  <li>Set rev = 0 and sd = 0 (sd = single digit).</li>
  <li><code>n % 10</code> gives the rightmost digit; store it in sd.</li>
  <li>Append it to the reversed number: <code>rev = rev * 10 + sd</code>.</li>
  <li>Remove the rightmost digit from n: <code>n = n / 10</code>.</li>
  <li>If n is greater than 0, go back to step 3; otherwise go to step 7.</li>
  <li>Print the result.</li>
</ol>
<p>"Repeat until n has no digits left" is exactly a condition-driven loop:</p>
<pre class="code" data-lang="bash">if [ $# -ne 1 ]
then
  echo "Please provide a number as input in the script"
  exit 1
fi
n=$1
rev=0
sd=0
while [ $n -gt 0 ]
  do
  sd=&#96;expr $n % 10&#96;
  echo $sd
  rev=&#96;expr $rev \\* 10  + $sd&#96;
  n=&#96;expr $n / 10&#96;
done
echo  "Reverse number is $rev"</pre>
<div data-viz="1"></div>
<p><b>until</b> is very similar to while, but it loops <b>until the condition is true</b>, i.e. as long as it is false ("until this condition is true, do this"):</p>
<pre class="code" data-lang="bash">until [expression]
do
  statements
done</pre>
<pre class="code" data-lang="bash">#!/bin/bash
echo "Enter a number: "; read x
echo ; echo Count Down
until test $x -le 0; do
  echo $x
  let "x=x-1"
  sleep 1
done
echo ; echo GO !</pre>
<p>The countdown prints x, x−1, …, 1: when x reaches 0 the condition <code>$x -le 0</code> becomes true and the loop stops, so 0 itself is not printed.</p>`,
      viz: [
        { name: 'stepper', caption: 'Trace: ./args.sh a b c', props: { lang: 'bash', code: "while [ $# -gt 0 ]\ndo\necho $1\nshift\ndone", steps: [
          { line: 1, note: 'Three arguments: $# = 3 > 0 → enter the loop', vars: { '$#': 3, '$1': 'a', '$2': 'b', '$3': 'c' } },
          { line: 3, note: 'Print the first argument', vars: { '$#': 3, '$1': 'a' }, out: 'a' },
          { line: 4, note: 'shift: b becomes $1, c becomes $2', vars: { '$#': 2, '$1': 'b', '$2': 'c' } },
          { line: 1, note: '$# = 2 > 0 → continue', vars: { '$#': 2, '$1': 'b' } },
          { line: 3, vars: { '$#': 2, '$1': 'b' }, note: 'Print b', out: 'b' },
          { line: 4, note: 'shift', vars: { '$#': 1, '$1': 'c' } },
          { line: [1, 3], note: '$# = 1 > 0 → print c', vars: { '$#': 1, '$1': 'c' }, out: 'c' },
          { line: 4, note: 'shift: no arguments left', vars: { '$#': 0, '$1': '' } },
          { line: [1, 5], note: '$# = 0 → the condition is false, leave the loop', vars: { '$#': 0 } }] } },
        { name: 'stepper', caption: 'Exercise 4: ./reverse.sh 134', props: { lang: 'bash', code: "if [ $# -ne 1 ]\nthen\n  echo \"Please provide a number as input in the script\"\n  exit 1\nfi\nn=$1\nrev=0\nsd=0\nwhile [ $n -gt 0 ]\n  do\n  sd=`expr $n % 10`\n  echo $sd\n  rev=`expr $rev \\* 10  + $sd`\n  n=`expr $n / 10`\ndone\necho  \"Reverse number is $rev\"", steps: [
          { line: 1, note: '$# = 1 → the condition is false, no error', vars: { '$#': 1, '$1': 134 } },
          { line: [6, 7, 8], note: 'Initialisation', vars: { n: 134, rev: 0, sd: 0 } },
          { line: 9, note: '134 -gt 0 → enter the loop', vars: { n: 134, rev: 0, sd: 0 } },
          { line: [11, 12], note: 'sd = 134 % 10 = 4', vars: { n: 134, rev: 0, sd: 4 }, out: '4' },
          { line: [13, 14], note: 'rev = 0*10 + 4 = 4; n = 134/10 = 13', vars: { n: 13, rev: 4, sd: 4 } },
          { line: [9, 11, 12], note: '13 > 0; sd = 3', vars: { n: 13, rev: 4, sd: 3 }, out: '3' },
          { line: [13, 14], note: 'rev = 4*10 + 3 = 43; n = 1', vars: { n: 1, rev: 43, sd: 3 } },
          { line: [9, 11, 12], note: '1 > 0; sd = 1', vars: { n: 1, rev: 43, sd: 1 }, out: '1' },
          { line: [13, 14], note: 'rev = 43*10 + 1 = 431; n = 0', vars: { n: 0, rev: 431, sd: 1 } },
          { line: 9, note: '0 -gt 0 is false → leave the loop', vars: { n: 0, rev: 431 } },
          { line: 16, note: 'Result', vars: { rev: 431 }, out: 'Reverse number is 431' }] } }
      ],
      takeaway: 'while repeats while the condition command succeeds; until repeats while it fails. while [ $# -gt 0 ] + shift walks through all arguments. Exercise 4: sd = n % 10, rev = rev*10 + sd, n = n / 10 until n = 0.',
      exam: 'Trace a while loop (reverse number, sum); while + shift; how many times an until loop runs.'
    },
    {
      id: 'analyze',
      h: 'Loop control: continue and break',
      why: 'skip or leave a loop early',
      lead: 'Sometimes a loop must skip the rest of one iteration, or stop completely as soon as it has found what it was looking for. continue and break do exactly that, and the slides\' "Analyzing scripts" exercise tests both.',
      html: `
<p>Two commands change the normal flow of any loop:</p>
<ul>
  <li><b>continue</b> skips the rest of the current iteration and jumps to the next one (in a C-style for, the step <code>nr++</code> still runs);</li>
  <li><b>break</b> leaves the loop immediately; the script continues after <code>done</code>.</li>
</ul>
<p>Analyze the script from the slides:</p>
<pre class="code" data-lang="bash">MAX=10000
 for((nr=1; nr&lt;$MAX; nr++))
 do
  let "t1 = nr % 5"
  if [ "$t1" -ne 0 ]
  then
   continue
  fi
  let "t2 = nr % 7"
  if [ "$t2" -ne 0 ]
  then
   continue
  fi
  let "t3 = nr % 9"
  if [ "$t3" -ne 0 ]
  then
   continue
  fi
 break  # What happens when you comment out this line? Why?
 done
 echo "Number = $nr"</pre>
<ol class="steps">
  <li>The loop tries nr = 1, 2, 3, …</li>
  <li>Each <code>continue</code> is a filter: if nr is not divisible by 5, or not by 7, or not by 9, the rest of the iteration is skipped.</li>
  <li>Only a number divisible by 5, 7 <b>and</b> 9 gets past all three filters and reaches <code>break</code>. The first such number is 5 · 7 · 9 = <b>315</b>, so the script prints <code>Number = 315</code>.</li>
</ol>
<p><b>What if the break line is commented out?</b> Then nothing stops the loop early: it runs through all values up to 9999. After the last iteration <code>nr++</code> makes nr = 10000, the condition <code>nr &lt; MAX</code> is false, and the loop ends. The script prints <code>Number = 10000</code> — the value of nr after the loop, not a number that passed the filters.</p>`,
      takeaway: 'continue = skip to the next iteration; break = leave the loop. The analyzed script finds the first number divisible by 5, 7 and 9 (315); without break the loop runs to the end and prints 10000.',
      exam: 'Explain the result 315 and what happens without break (10000).'
    },
    {
      id: 'arrays',
      h: 'Arrays — Exercise 5',
      why: 'many values under one name',
      lead: 'A plain variable holds one string. When a script must keep many values — all the words of a file, a list of names — it needs an array: one name with numbered slots.',
      html: `
<p>In the bash shell we can use arrays. The simplest ways to create one are with explicit indexes or with a list in parentheses:</p>
<pre class="code" data-lang="bash">pet[0]=dog
pet[1]=cat
pet[2]=fish
pet[4]=apple
# or
pet=( dog cat fish apple )

$ echo &#36;{pet[0]}
dog
$ echo &#36;{pet[2]}
fish

echo &#36;{arrayname[*]}        # all elements
for x in &#36;{arrayname[*]}
do
echo $x
done
echo &#36;{#arrayname[*]}       # number of elements</pre>
<p>The notation is easy to confuse, so here it is in one place:</p>
<ul>
  <li><code>&#36;{arr[i]}</code> — the element with index i (braces are required; an array can have up to 1024 elements);</li>
  <li><code>&#36;{arr[*]}</code> (or <code>&#36;{arr[@]}</code>) — all elements, e.g. as the list of a for loop;</li>
  <li><code>&#36;{#arr[*]}</code> — the <b>number of elements</b>;</li>
  <li><code>&#36;{#var}</code> — the <b>length of a string</b>; so <code>&#36;{#arr[0]}</code> is the length of element 0.</li>
</ul>
<div class="callout warn">Indexes may have gaps: after <code>pet[0..2]</code> and <code>pet[4]</code> the array has <b>4</b> elements (not 5), and <code>&#36;{pet[3]}</code> is empty. <code>&#36;{#pet[*]}</code> counts the elements that exist, not the highest index + 1.</div>
<p><b>Exercise 5</b>: print the shortest string (word) in a file.</p>
<pre class="code" data-lang="bash">echo "Enter the name of the file"
read file
file=( &#96;cat "$file"&#96;)
min=&#36;{#file[0]}
ref=&#36;{file[0]}
for l in &#36;{file[@]}
do
  if test $min -gt &#36;{#l} ; then
    min=&#36;{#l}
    ref=$l
  fi
done
echo "$ref"</pre>
<ul>
  <li><code>file=( &#96;cat "$file"&#96; )</code> turns the output of cat, split at whitespace, into an array of the file's words (the variable <code>file</code> is reused: first the file name, then the array).</li>
  <li>This is the classic "minimum search": <code>min</code> and <code>ref</code> start with the first word; every word is compared with the current minimum and replaces it only if it is <b>strictly</b> shorter (<code>-gt</code>). With equal lengths the first word found stays.</li>
</ul>`,
      takeaway: 'arr=( a b c ) or arr[i]=x; ${arr[i]} one element, ${arr[*]} / ${arr[@]} all elements, ${#arr[*]} number of elements (gaps not counted), ${#var} length of a string.',
      exam: '${#arr[*]} = number of elements (with gaps), ${#var} = string length; read Exercise 5.'
    },
    {
      id: 'ex6',
      h: 'Exercise 6: a password strength checker',
      why: 'put everything together',
      lead: 'The last exercise uses almost everything from the module at once: read, string length, pipes, grep, the exit status $? and nested ifs. It is a good final check that all the pieces fit together.',
      html: `
<p>Write a script that validates password strength. A password is strong if it has: a length of <b>at least 8</b> characters; both letters and <b>numbers</b>; both <b>lowercase</b> and <b>uppercase</b> letters. If any condition fails, the script reports a "Weak Password". The slide tips:</p>
<ul>
  <li><code>grep</code> searches its input for lines containing a match to the given string or pattern; <code>-q</code> (quiet) is used when you do not care which lines matched, only <i>whether</i> some line matched;</li>
  <li><code>$?</code> is the built-in variable with the return value of the last executed command: 0 if grep found a match.</li>
</ul>
<pre class="code" data-lang="bash">echo "Enter your password"
read password
len="&#36;{#password}"
if test $len -ge 8 ; then
  echo "$password" | grep -q [0-9]
  if test $? -eq 0 ; then
     echo "$password" | grep -q [A-Z]
        if test $? -eq 0 ; then
          echo "$password" | grep -q [a-z]
           if test $? -eq 0 ; then
           echo "Strong Password"
         else
           echo "Weak Password -&gt; Should include a lower case letter."
         fi
      else
       echo "Weak Password -&gt; Should include a capital case letter."
      fi
  else
   echo "Weak Password -&gt; Should use numbers in your password."
  fi
else
  echo "Weak Password -&gt; Password length should have at least 8 characters."
fi</pre>
<p>How the pieces work together: <code>&#36;{#password}</code> gives the length (string length from the Arrays section); <code>echo "$password" | grep -q [0-9]</code> pipes the password into grep, which only sets its exit status; <code>test $? -eq 0</code> turns that status into a decision. The ifs are nested, so the checks run in a fixed order — length → digits → capitals → lowercase — and the script prints the <b>first</b> condition that fails:</p>
<table class="t">
  <tr><th>Input</th><th>Output</th></tr>
  <tr><td>Abc1</td><td>Weak Password -&gt; Password length should have at least 8 characters.</td></tr>
  <tr><td>Password</td><td>Weak Password -&gt; Should use numbers in your password.</td></tr>
  <tr><td>hello123</td><td>Weak Password -&gt; Should include a capital case letter.</td></tr>
  <tr><td>PASSWORD12</td><td>Weak Password -&gt; Should include a lower case letter.</td></tr>
  <tr><td>Passw0rd</td><td>Strong Password</td></tr>
</table>
<div class="callout note">A quoting detail: <code>[0-9]</code> is not in quotes, so the shell may treat it as a file-name pattern. If the current directory contains a file whose name is a single digit (say <code>5</code>), the shell replaces <code>[0-9]</code> with <code>5</code> and grep searches only for "5". Writing <code>grep -q '[0-9]'</code> avoids this.</div>`,
      takeaway: 'Exercise 6 = read + ${#password} + echo | grep -q + test $? -eq 0 in nested ifs. The checks run in order (length, digits, capitals, lowercase) and the first failure is reported.',
      exam: 'Predict the output of Exercise 6 for a given password.'
    }
  ],
  terms: [
    { en: 'Scripting language', ru: 'скриптовый язык', def: 'An interpreted language for automation that stresses flexibility, rapid development and dynamic checking.' },
    { en: 'Interpreter', ru: 'интерпретатор', def: 'A program that reads source code and executes it directly, without a separate compilation step.' },
    { en: 'Batch mode', ru: 'пакетный режим', def: 'Running a list of commands one after another without user interaction.' },
    { en: 'Glue language', ru: 'язык-«клей»', def: 'A language designed to glue existing programs together (Perl, Python).' },
    { en: 'Economy of expression', ru: 'краткость выражения', def: 'Very little boilerplate code is needed: echo "Hello!" is a complete program.' },
    { en: 'Dynamic typing', ru: 'динамическая типизация', def: 'Types are checked while the program runs; a value may be used as a string or a number depending on context.' },
    { en: 'Pattern matching', ru: 'сопоставление с образцом', def: 'Testing whether a string has certain characteristics, e.g. with regular expressions.' },
    { en: 'Regular expression', ru: 'регулярное выражение', def: 'A pattern language for searching and manipulating text (used by sed, grep).' },
    { en: 'Command interpreter', ru: 'командный интерпретатор', def: 'The shell: a program on top of the kernel that reads and runs commands.' },
    { en: 'Bourne Again Shell', ru: 'командная оболочка bash', def: 'bash: the GNU improved Bourne Shell (sh).' },
    { en: 'Shell script', ru: 'сценарий командной оболочки', def: 'A text file of UNIX commands and shell syntax, executed by the shell without compilation.' },
    { en: 'Shebang', ru: 'шебанг (строка #!)', def: 'The first line #!/bin/bash: tells the OS that the file is a script and which interpreter runs it.' },
    { en: 'Comment', ru: 'комментарий', def: 'Text after an unquoted # that the shell ignores.' },
    { en: 'Variable expansion', ru: 'подстановка значения переменной', def: 'The shell replaces $name / ${name} with the value before running the command.' },
    { en: 'Environment variable', ru: 'переменная окружения', def: 'A global system variable in capitals (HOME, PATH, SHELL, USER…), defined at login.' },
    { en: 'Local variable', ru: 'локальная переменная', def: 'A variable created in a script; it exists only within that shell.' },
    { en: 'Special variable', ru: 'специальная переменная', def: 'A variable reserved for the shell, such as $0, $1, $#, $?.' },
    { en: 'PATH', ru: 'переменная PATH', def: 'The list of directories searched, in order, for a command name.' },
    { en: 'Strong quote', ru: 'строгие (одинарные) кавычки', def: '\'…\': everything inside is literal; nothing is expanded.' },
    { en: 'Weak quote', ru: 'нестрогие (двойные) кавычки', def: '"…": $variables, backquotes and \\ are processed; spaces and * are kept.' },
    { en: 'Backquote', ru: 'обратная кавычка', def: 'Backtick: the text inside is run as a command and replaced by its output.' },
    { en: 'Command substitution', ru: 'подстановка вывода команды', def: 'Replacing `command` with the output of the command.' },
    { en: 'Arithmetic expansion', ru: 'арифметическая подстановка', def: '$(( expression )): computes an integer expression and is replaced by the result.' },
    { en: 'Integer arithmetic', ru: 'целочисленная арифметика', def: 'Bash computes only with integers: 7 / 2 = 3, % = remainder.' },
    { en: 'let', ru: 'команда let', def: 'Evaluates an arithmetic expression: let "x-=1".' },
    { en: 'expr', ru: 'команда expr', def: 'An external command that evaluates an expression and prints it; spaces required, * must be escaped.' },
    { en: 'String concatenation', ru: 'конкатенация строк', def: 'Joining strings by writing them next to each other ("$A$B") or with +=.' },
    { en: 'Positional parameters', ru: 'позиционные параметры', def: '$1, $2, … = the arguments of the script; $0 = its name; $# = how many.' },
    { en: 'Built-in variable', ru: 'встроенная переменная', def: 'A read-only variable set by the shell: $#, $@, $*, $?, $$, $!, $0, $-.' },
    { en: 'Exit status', ru: 'код завершения', def: 'The number a command returns: 0 = success (true), non-zero = failure; stored in $?.' },
    { en: 'shift', ru: 'сдвиг параметров', def: 'Shifts the positional parameters left: $2 becomes $1, $# decreases by 1.' },
    { en: 'read', ru: 'чтение ввода', def: 'Built-in: reads one line from standard input into a variable.' },
    { en: 'Control structure', ru: 'управляющая конструкция', def: 'if-then-else, case, for, while, until, select.' },
    { en: 'test command', ru: 'команда test', def: 'test expr or [ expr ]: evaluates a condition and returns exit status 0 (true) or 1 (false).' },
    { en: 'Integer comparison', ru: 'сравнение целых чисел', def: 'test operators -eq -ne -gt -lt -ge -le.' },
    { en: 'String comparison', ru: 'сравнение строк', def: 'test operators = != -z; inside [[ ]] also < and > (alphabetical).' },
    { en: 'Word splitting', ru: 'разбиение на слова', def: 'The shell splits an unquoted expanded value into separate words at whitespace.' },
    { en: 'Double brackets', ru: 'двойные квадратные скобки [[ ]]', def: 'Bash\'s improved test: no word splitting, && || inside, < > for strings; not available in sh.' },
    { en: 'case statement', ru: 'оператор case', def: 'Runs the branch of the first pattern that matches the value; branches end with ;; and *) catches the rest.' },
    { en: 'Shell expansion', ru: 'раскрытие шаблонов оболочкой', def: 'Replacing patterns with jolly characters (*, ?, [..]) by the list of matching file names.' },
    { en: 'for loop', ru: 'цикл for', def: 'Repeats the body once for each word of a list; C-style: for ((i=0; i<n; i++)).' },
    { en: 'while loop', ru: 'цикл while', def: 'Repeats the body while the condition command succeeds.' },
    { en: 'until loop', ru: 'цикл until', def: 'Repeats the body until the condition becomes true (while it is false).' },
    { en: 'Infinite loop', ru: 'бесконечный цикл', def: 'A loop whose condition never becomes false.' },
    { en: 'continue', ru: 'переход к следующей итерации', def: 'Skips the rest of the current iteration of a loop.' },
    { en: 'break', ru: 'выход из цикла', def: 'Leaves the loop immediately.' },
    { en: 'Array', ru: 'массив', def: 'pet=( dog cat ); ${pet[0]} one element, ${pet[*]} all, ${#pet[*]} number of elements.' },
    { en: 'String length', ru: 'длина строки', def: '${#var}: the number of characters in a variable.' }
  ],
  questions: [
    { id: 'sh-01', type: 'single', q: 'Which of these is NOT one of the 6 common characteristics of scripting languages?', options: ['Interpreted for both batch and interactive use', 'Economy of expression', 'Mandatory variable declarations and static typing', 'Sophisticated pattern matching'], answer: 2, explain: 'The opposite is true: scripting languages have a lack of declarations and flexible dynamic typing. The other three options are on the list of six.', section: 'scripting', diff: 1 },
    { id: 'sh-02', type: 'single', q: 'Which command shows the user\'s default shell?', options: ['cat /etc/shells', 'echo $SHELL', 'exec bash', 'echo $0SHELL'], answer: 1, explain: 'SHELL is a pre-defined variable with the path of the default shell. cat /etc/shells lists the available shells, exec bash switches shell.', section: 'shell', diff: 1 },
    { id: 'sh-03', type: 'single', q: 'What is the first line #!/bin/bash for?', options: ['It is a comment, the shell ignores it', 'It tells the OS that the file is a script and which interpreter runs it', 'It makes the file executable', 'It loads the bash library'], answer: 1, explain: 'She-bang + path of the interpreter. chmod +x makes the file executable; other lines starting with # are comments, but not the first line with #!.', section: 'script', diff: 1 },
    { id: 'sh-04', type: 'code', lang: 'bash', q: 'What does this fragment print? (lines separated by |)', code: "name=World\necho 'Hello $name'\necho \"Hello $name\"", options: ['Hello World | Hello World', 'Hello $name | Hello World', 'Hello World | Hello $name', 'Hello $name | Hello $name'], answer: 1, explain: 'Single quotes are strong quotes: everything is literal. Double quotes are weak: $name is replaced by World.', section: 'quotes', diff: 1 },
    { id: 'sh-05', type: 'code', lang: 'bash', q: 'What does this fragment print?', code: "a=3\necho \"a=$a\" 'a=$a' `echo a`", options: ['a=3 a=3 a', 'a=3 a=$a a', 'a=3 a=$a echo a', 'a=$a a=$a a'], answer: 1, explain: 'Inside "…" $a is replaced, inside \'…\' it is not, and the backquotes run the command echo a and insert its output "a".', section: 'quotes', diff: 2 },
    { id: 'sh-06', type: 'code', lang: 'bash', q: 'What does this fragment print? (lines separated by |)', code: "fruit=apple\necho \"[$fruits]\"\necho \"${fruit}s\"", options: ['[apples] | apples', '[] | apples', '[apple] | apple s', 'Error: the variable fruits is not declared'], answer: 1, explain: '$fruits is a different variable that was never set, so it expands to an empty string (no error). ${fruit}s ends the name with braces → apples.', section: 'variables', diff: 2 },
    { id: 'sh-07', type: 'code', lang: 'bash', q: 'What does this fragment print?', code: "a=7\nb=2\necho \"$((a + b)) $((a * b)) $((a / b)) $((a % b))\"", options: ['9 14 3.5 1', '9 14 3 1', '72 14 3 1', '9 14 3 0'], answer: 1, explain: 'Bash arithmetic is integer only: 7/2 = 3 and 7%2 = 1; 7+2 = 9 and 7*2 = 14.', section: 'arith', diff: 2 },
    { id: 'sh-08', type: 'code', lang: 'bash', q: 'What does this fragment print?', code: "x=10\nlet \"x-=1\"\nlet \"x*=2\"\nx=$(($x-3))\necho $x", options: ['15', '17', '9', '14'], answer: 0, explain: 'x = 10 → let "x-=1" → 9 → let "x*=2" → 18 → x=$(($x-3)) → 15.', section: 'arith', diff: 2 },
    { id: 'sh-09', type: 'code', lang: 'bash', q: 'The script welcome.sh is run as ./welcome.sh Pippo Pluto Topolino. What does it print?', code: "#!/bin/bash\necho \"Benvenuti $1 e $2!\"", options: ['Benvenuti Pippo e Pluto!', 'Benvenuti Pippo e Pluto Topolino!', 'Benvenuti ./welcome.sh e Pippo!', 'Benvenuti $1 e $2!'], answer: 0, explain: '$1 = Pippo and $2 = Pluto; the third argument is simply not used. $0 would be ./welcome.sh.', section: 'builtin', diff: 1 },
    { id: 'sh-10', type: 'code', lang: 'bash', q: 'The script is run as ./count.sh a "b c" d. What does it print?', code: "#!/bin/bash\necho $#", options: ['3', '4', '5', '2'], answer: 0, explain: '$# is the number of positional parameters. "b c" is quoted, so it is one argument: a, "b c", d → 3.', section: 'builtin', diff: 2 },
    { id: 'sh-11', type: 'single', q: 'Which built-in variable holds the process ID of the current shell?', options: ['$!', '$?', '$$', '$#'], answer: 2, explain: '$$ = PID of the current shell; $! = PID of the last background command; $? = exit status; $# = number of arguments.', section: 'builtin', diff: 1 },
    { id: 'sh-12', type: 'code', lang: 'bash', q: 'The script is run as ./s.sh x "y z". How many lines does it print?', code: "#!/bin/bash\nfor a in \"$*\"; do echo \"[$a]\"; done\nfor a in \"$@\"; do echo \"<$a>\"; done", options: ['2', '3', '4', '5'], answer: 1, explain: '"$*" is one word, [x y z] → 1 line; "$@" keeps every argument separate: <x> and <y z> → 2 lines. Total 3.', section: 'builtin', diff: 3 },
    { id: 'sh-13', type: 'code', lang: 'bash', q: 'The user types 3, then 7. Which Diff line is printed?', code: "#!/bin/bash\necho \"Give me the first number:\"\nread num1\necho \"Give me the second number:\"\nread num2\n# results\necho \"Sum: $((num1 + num2))\"\necho \"Diff: $((num1 - num2))\"\necho \"Product: $((num1 * num2))\"", options: ['Diff: 4', 'Diff: -4', 'Diff: 3-7', 'Diff: 10'], answer: 1, explain: 'num1 = 3 and num2 = 7, so $((num1 - num2)) = -4. Inside $(( )) the text is computed, so "3-7" is not printed.', section: 'read', diff: 1 },
    { id: 'sh-14', type: 'code', lang: 'bash', q: 'What does the script print?', code: "#!/bin/bash\ni=\"abc\"\nj=\"def\"\n[ $j != $i ]\necho $?", options: ['0', '1', 'true', 'def'], answer: 0, explain: '"def" != "abc" is true, so test returns status 0, and $? = 0. In bash 0 means true.', section: 'if', diff: 2 },
    { id: 'sh-15', type: 'code', lang: 'bash', q: 'What does this fragment print? (lines separated by |)', code: "[ 10 -lt 9 ]\necho $?\n[ 5 -gt 3 -a -z \"\" ]\necho $?", options: ['0 | 1', '1 | 0', '1 | 1', '0 | 0'], answer: 1, explain: '10 -lt 9 is false → $? = 1. In the second test 5 -gt 3 is true and -z "" (empty string) is true; -a (AND) → true → 0.', section: 'if', diff: 2 },
    { id: 'sh-16', type: 'code', lang: 'bash', q: 'What happens when this runs?', code: "n=5\nif [$n -lt 10]\nthen\n  echo \"one digit\"\nelse\n  echo \"two digits\"\nfi", options: ['It prints one digit', 'Error "[5: command not found", then it prints two digits', 'Syntax error: the script runs nothing', 'It prints one digit and two digits'], answer: 1, explain: 'Without spaces after [ and before ], the shell looks for a command named "[5", does not find it (status 127, not 0) → the else branch runs.', section: 'if', diff: 3 },
    { id: 'sh-17', type: 'multi', q: 'Which test operators compare INTEGERS? (select all that apply)', options: ['-eq', '-lt', '=', '-z', '-ge', '!='], answer: [0, 1, 4], explain: '-eq -ne -gt -lt -ge -le are the integer comparisons. = and != compare strings, -z tests for an empty string.', section: 'if', diff: 1 },
    { id: 'sh-18', type: 'code', lang: 'bash', q: 'The user types 20. What does the last line print?', code: "#!/bin/bash\n# Prompt the user to enter a number\necho \"Enter a number:\"\nread number\n# Check the range using logical operators\nif [ $number -gt 0 ] && [ $number -le 10 ]; then\necho \"The number is between 1 and 10\"\nelif [ $number -gt 10 ] && [ $number -le 20 ]; then\necho \"The number is between 11 and 20\"\nelif [ $number -gt 20 ]; then\necho \"The number is greater than 20\"\nelse\necho \"The number is 0 or less\"\nfi", options: ['The number is between 1 and 10', 'The number is between 11 and 20', 'The number is greater than 20', 'The number is 0 or less'], answer: 1, explain: '20 -gt 10 && 20 -le 20 is true in the second branch: the boundary 20 is included because of -le.', section: 'brackets', diff: 2 },
    { id: 'sh-19', type: 'code', lang: 'bash', q: 'What does this fragment print? (lines separated by |; ignore error messages)', code: "file=\"my file.txt\"\ntouch \"$file\"\nif [ -f $file ]; then echo yes; else echo no; fi\nif [[ -f $file ]]; then echo yes; else echo no; fi", options: ['yes | yes', 'no | yes', 'yes | no', 'no | no'], answer: 1, explain: 'In [ ] the unquoted $file is split into two words: [ -f my file.txt ] → error "binary operator expected", status ≠ 0 → no. [[ ]] does no word splitting → yes.', section: 'brackets', diff: 3 },
    { id: 'sh-20', type: 'code', lang: 'bash', q: 'What does this fragment print?', code: "x=10\ny=3\nif [[ $x > 5 && $y < 10 ]]; then echo yes; else echo no; fi", options: ['yes', 'no', 'Syntax error', 'Nothing'], answer: 1, explain: 'Inside [[ ]] the signs > and < compare STRINGS alphabetically: "10" > "5" is false because \'1\' comes before \'5\'. Use -gt for numbers.', section: 'brackets', diff: 3 },
    { id: 'sh-21', type: 'tf', q: 'The [[ ]] construct works in every shell, including pure sh.', answer: false, explain: '[[ is bash\'s improvement to [; it does not work in pure sh.', section: 'brackets', diff: 1 },
    { id: 'sh-22', type: 'code', lang: 'bash', q: 'Example 7 is run as ./check.sh /etc /tmp. What happens?', code: "#!/bin/bash\n# Check if exactly one argument was provided\nif test \"$#\" -ne 1; then\n  echo \"Error in the number of parameters\"\n   exit 1\nfi\n# Check if the argument is a file, directory or neither\nif test -f \"$1\"; then\n  echo \" $1 is a file.\"\nelif test -d \"$1\"; then\n  echo \"$1 is a directory.\"\nelse\n  echo \"$1 is neither a file nor a directory.\"\nfi", options: ['/etc is a directory.', 'Error in the number of parameters, and the script ends with exit status 1', '/etc is a directory. and /tmp is a directory.', '/etc /tmp is neither a file nor a directory.'], answer: 1, explain: '$# = 2 ≠ 1, so the first check prints the error and runs exit 1; the -f / -d checks are never reached.', section: 'filetests', diff: 2 },
    { id: 'sh-23', type: 'code', lang: 'bash', q: 'Exercise 1 should print the first 10 lines of a file. report.txt contains the numbers 1…15, one per line. What does ./ex1.sh report.txt print, and what is wrong?', code: "#!/bin/bash\n\nif test $# -ne 1\n\tthen echo \"parametri non corretti\"\n\nelif test -d \"$1\"\n\tthen echo $1\n\tls $1 |wc -l\nelif test -f \"$1\"\n\tthen head -c 10 $1\nfi", options: ['Lines 1…10 — nothing is wrong', 'Lines 1…5: head -c 10 prints 10 bytes, but head -n 10 is needed', 'The number 15: the command counts lines', 'parametri non corretti'], answer: 1, explain: 'head -c 10 prints the first 10 characters: "1\\n2\\n3\\n4\\n5\\n" is exactly 10 bytes. For the first 10 lines you need head -n 10.', section: 'filetests', diff: 2 },
    { id: 'sh-24', type: 'code', lang: 'bash', q: 'The script is run with the argument bcd. What does it print?', code: "case $1 in\naa|ab) echo A ;;\nb?)      echo B ;;\nc*)      echo C ;;\n*)       echo D ;;\nesac", options: ['A', 'B', 'C', 'D'], answer: 3, explain: 'b? means exactly two characters (b + any one), so bcd does not match; c* and aa|ab do not match either → *) → D.', section: 'case', diff: 2 },
    { id: 'sh-25', type: 'code', lang: 'bash', q: 'The user types 10. What does the script print (after the prompt)?', code: "#!/bin/bash\necho -n \"Enter a number 1 < x < 10: \"\nread x\ncase $x in\n1) echo \"Value of x is 1.\";;\n2) echo \"Value of x is 2.\";;\n3) echo \"Value of x is 3.\";;\n4) echo \"Value of x is 4.\";;\n5) echo \"Value of x is 5.\";;\n6) echo \"Value of x is 6.\";;\n7) echo \"Value of x is 7.\";;\n8) echo \"Value of x is 8.\";;\n9) echo \"Value of x is 9.\";;\n0 | 10) echo \"wrong number.\";;\n*) echo \"Unrecognized value.\";;\nesac", options: ['Value of x is 1.', 'wrong number.', 'Unrecognized value.', 'Value of x is 10.'], answer: 1, explain: 'The pattern 0 | 10) is an alternative and 10 matches it → "wrong number.". The pattern 1) needs an exact match, and "10" is not "1".', section: 'case', diff: 1 },
    { id: 'sh-26', type: 'code', lang: 'bash', q: 'Example 8 is run as ./ex8.sh Apple.txt. What does it print?', code: "#!/bin/bash\n# Check if exactly one argument was provided\nif test \"$#\" -ne 1; then\n  echo \"Error: Please provide a single filename as an argument.\"\n  exit 1\nfi\n# Use the case structure to check if $1 starts with \"a\" in lowercase\ncase \"$1\" in\n  a*)\n    echo \"The filename starts with 'a'.\"\n    ;;\n  *)\n    echo \"The filename does not start with 'a'.\"\n    ;;\nesac", options: ["The filename starts with 'a'.", "The filename does not start with 'a'.", 'Error: Please provide a single filename as an argument.', 'Nothing'], answer: 1, explain: 'case patterns are case sensitive: Apple.txt starts with a capital A, so a* does not match → the *) branch.', section: 'case', diff: 2 },
    { id: 'sh-27', type: 'code', lang: 'bash', q: 'What does the script print?', code: "#!/bin/bash\nlet sum=0\nfor num in 2 4 6\ndo\nlet \"sum = $sum + $num\"\ndone\necho $sum", options: ['6', '12', '246', '0'], answer: 1, explain: 'sum = 0 + 2 + 4 + 6 = 12: let evaluates the arithmetic expression in every iteration.', section: 'for', diff: 1 },
    { id: 'sh-28', type: 'code', lang: 'bash', q: 'What does this C-style for print?', code: "for ((i=1; i<=10; i+=3))\ndo\n  echo -n \"$i \"\ndone", options: ['1 4 7', '1 4 7 10', '1 2 3 … 10', '3 6 9'], answer: 1, explain: 'i = 1, 4, 7, 10 (10 <= 10 still runs), then i = 13 and the loop ends.', section: 'for', diff: 2 },
    { id: 'sh-29', type: 'code', lang: 'bash', q: 'What does this fragment print?', code: "n=5\nn+=1\ns=\"ab\"\ns+=\"cd\"\necho \"$n $s\"", options: ['6 abcd', '51 abcd', '6 ab+cd', '5 cd'], answer: 1, explain: 'Without let or $(( )), += works on strings: "5" + "1" → "51"; "ab" + "cd" → "abcd".', section: 'strings', diff: 3 },
    { id: 'sh-30', type: 'code', lang: 'bash', q: 'The user types 2. What does the script print? (lines separated by |)', code: "#!/bin/bash\nread x\nsum=0\ni=0\nwhile [[ $i -le $x ]]; do\n     let \"sum = sum + i\"\n        i=$i+1\n    done\necho \"sum=$sum\"\necho \"i=$i\"", options: ['sum=3 | i=3', 'sum=3 | i=0+1+1+1', 'sum=6 | i=3', 'Infinite loop'], answer: 1, explain: 'i=$i+1 assigns a string ("0+1", "0+1+1"…), but [[ -le ]] and let evaluate it as arithmetic, so the loop works: 0+1+2 = 3. echo prints the string itself.', section: 'while', diff: 3 },
    { id: 'sh-31', type: 'code', lang: 'bash', q: 'The script is run as ./s.sh a b c. What does it print? (lines separated by |)', code: "#!/bin/bash\nwhile [ $# -gt 1 ]\ndo\n  echo $1\n  shift\ndone\necho \"last: $1\"", options: ['a | b | c | last: ', 'a | b | last: c', 'a | last: b', 'a | b | c | last: c'], answer: 1, explain: 'The loop runs while there is MORE than one argument: it prints a, shifts, prints b, shifts; now $# = 1 → exit, and "last: c" is printed.', section: 'while', diff: 2 },
    { id: 'sh-32', type: 'code', lang: 'bash', q: 'Exercise 4 is run as ./reverse.sh 1200. What is the last line of output?', code: "if [ $# -ne 1 ]\nthen\n  echo \"Please provide a number as input in the script\"\n  exit 1\nfi\nn=$1\nrev=0\nsd=0\nwhile [ $n -gt 0 ]\n  do\n  sd=`expr $n % 10`\n  echo $sd\n  rev=`expr $rev \\* 10  + $sd`\n  n=`expr $n / 10`\ndone\necho  \"Reverse number is $rev\"", options: ['Reverse number is 0021', 'Reverse number is 21', 'Reverse number is 2100', 'Reverse number is 1200'], answer: 1, explain: 'Digits from right to left: 0, 0, 2, 1; rev = 0 → 0 → 2 → 21. rev is a number, not a string, so there are no leading zeros.', section: 'while', diff: 3 },
    { id: 'sh-33', type: 'code', lang: 'bash', q: 'The user types 3. Which numbers does the until loop print?', code: "#!/bin/bash\nread x\nuntil test $x -le 0; do\n  echo $x\n  let \"x=x-1\"\ndone\necho GO !", options: ['3 2 1 0', '3 2 1', '2 1 0', 'Nothing: the condition is false at once'], answer: 1, explain: 'until repeats while the condition ($x -le 0) is false: x = 3, 2, 1 are printed; at x = 0 the condition is true → the loop ends, then GO ! is printed.', section: 'while', diff: 2 },
    { id: 'sh-34', type: 'code', lang: 'bash', q: 'What does this fragment print?', code: "pet[0]=dog\npet[1]=cat\npet[2]=fish\npet[4]=apple\necho ${#pet[*]}", options: ['3', '4', '5', 'apple'], answer: 1, explain: '${#pet[*]} is the number of elements, not the highest index + 1: the indexes 0, 1, 2, 4 are set → 4 elements (pet[3] does not exist).', section: 'arrays', diff: 3 },
    { id: 'sh-35', type: 'code', lang: 'bash', q: 'What does the script from "Analyzing scripts" print?', code: "MAX=10000\n for((nr=1; nr<$MAX; nr++))\n do\n  let \"t1 = nr % 5\"\n  if [ \"$t1\" -ne 0 ]\n  then\n   continue\n  fi\n  let \"t2 = nr % 7\"\n  if [ \"$t2\" -ne 0 ]\n  then\n   continue\n  fi\n  let \"t3 = nr % 9\"\n  if [ \"$t3\" -ne 0 ]\n  then\n   continue\n  fi\n break  # What happens when you comment out this line? Why?\n done\n echo \"Number = $nr\"", options: ['Number = 35', 'Number = 315', 'Number = 9999', 'Number = 63'], answer: 1, explain: 'continue skips every number that is not divisible by 5, 7 or 9; the first number divisible by all three is 5·7·9 = 315, where break stops the loop.', section: 'analyze', diff: 2 },
    { id: 'sh-36', type: 'code', lang: 'bash', q: 'In the same script the break line has been commented out. What does it print?', code: "MAX=10000\n for((nr=1; nr<$MAX; nr++))\n do\n  let \"t1 = nr % 5\"\n  if [ \"$t1\" -ne 0 ]\n  then\n   continue\n  fi\n  let \"t2 = nr % 7\"\n  if [ \"$t2\" -ne 0 ]\n  then\n   continue\n  fi\n  let \"t3 = nr % 9\"\n  if [ \"$t3\" -ne 0 ]\n  then\n   continue\n  fi\n #break  # What happens when you comment out this line? Why?\n done\n echo \"Number = $nr\"", options: ['Number = 315', 'Number = 9999', 'Number = 10000', 'Infinite loop'], answer: 2, explain: 'Without break the loop runs to the end: the last iteration has nr = 9999, then nr++ → 10000, the condition nr < MAX is false and the loop ends. 10000 is printed.', section: 'analyze', diff: 3 },
    { id: 'sh-37', type: 'code', lang: 'bash', q: 'Exercise 6: the user types hello123. What is the last line of output?', code: "echo \"Enter your password\"\nread password\nlen=\"${#password}\"\nif test $len -ge 8 ; then\n  echo \"$password\" | grep -q [0-9]\n  if test $? -eq 0 ; then\n     echo \"$password\" | grep -q [A-Z]\n        if test $? -eq 0 ; then\n          echo \"$password\" | grep -q [a-z]\n           if test $? -eq 0 ; then\n           echo \"Strong Password\"\n         else\n           echo \"Weak Password -> Should include a lower case letter.\"\n         fi\n      else\n       echo \"Weak Password -> Should include a capital case letter.\"\n      fi\n  else\n   echo \"Weak Password -> Should use numbers in your password.\"\n  fi\nelse\n  echo \"Weak Password -> Password length should have at least 8 characters.\"\nfi", options: ['Strong Password', 'Weak Password -> Should include a capital case letter.', 'Weak Password -> Should include a lower case letter.', 'Weak Password -> Password length should have at least 8 characters.'], answer: 1, explain: 'Length 8 (≥ 8) is fine; digits are present ($? = 0); [A-Z] is not found → grep -q returns 1 → the capital-letter message.', section: 'ex6', diff: 2 },
    { id: 'sh-38', type: 'code', lang: 'bash', q: 'Example 1 (hello.sh) is run a second time in the same directory. What happens?', code: "#!/bin/bash --\nmkdir hello\necho \"hello guys!\" > hello/hello.txt", options: ['mkdir prints a "File exists" error, but echo still overwrites hello.txt — it contains one line', 'mkdir prints an error and the script stops immediately', 'hello.txt now contains two lines "hello guys!"', 'A directory hello/hello is created'], answer: 0, explain: 'A failing command does not stop the script — the next line still runs. > overwrites the file (it does not append like >>), so there is still one line.', section: 'examples', diff: 2 },
    { id: 'sh-39', type: 'code', lang: 'bash', q: 'The slide asks: what does sed \'1!G;h;$!d\' do? What does this pipeline print? (lines separated by |)', code: "printf '1\\n2\\n3\\n' | sed '1!G;h;$!d'", options: ['3 | 2 | 1', '1 | 2 | 3', '1', '3'], answer: 0, explain: 'This sed program prints the lines in reverse order: on every line except the first it appends the lines collected so far (G), saves the result (h) and deletes it from the output (d) — except on the last line, which is printed. 1 2 3 → 3 2 1.', section: 'scripting', diff: 3 },
    { id: 'sh-40', type: 'code', lang: 'bash', q: 'What does this fragment print?', code: "pet=( dog cat fish )\necho ${#pet[*]} ${#pet[2]}", options: ['3 4', '3 3', '4 3', '3 fish'], answer: 0, explain: '${#pet[*]} is the number of elements (3); ${#pet[2]} is the length of the string in element 2, "fish" = 4 characters.', section: 'arrays', diff: 2 },
    { id: 'sh-41', type: 'code', lang: 'bash', q: 'What happens when these two lines run?', code: "x = 5\necho \"[$x]\"", options: ['It prints [5]', 'Error "x: command not found", then it prints []', 'It prints [ 5]', 'Syntax error: nothing is printed'], answer: 1, explain: 'With spaces around =, the line is not an assignment: the shell runs a command named x with the arguments = and 5, which does not exist. x stays unset, so the second line prints [].', section: 'variables', diff: 2 },
    { id: 'sh-42', type: 'code', lang: 'bash', q: 'What does this fragment print? (lines separated by |)', code: "[ 01 -eq 1 ]\necho $?\n[ 01 = 1 ]\necho $?", options: ['0 | 1', '0 | 0', '1 | 0', '1 | 1'], answer: 0, explain: '-eq compares numbers: 01 and 1 are the same number → true → 0. = compares strings: "01" and "1" are different texts → false → 1.', section: 'if', diff: 2 }
  ]
});
