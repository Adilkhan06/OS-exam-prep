OS.addModule({
  id: 'linux-proc',
  num: 11,
  group: 'lab',
  title: 'Linux Processes',
  titleRu: 'Процессы в Linux (лаба)',
  icon: '🐧',
  sources: ['ES2-Linux_processes.pdf'],
  summary: 'ps, top, kill и сигналы, foreground/background, job control (&, Ctrl+Z, jobs, bg, fg), wait-me.sh, жизнь процесса fork/wait/exit на практике, несколько дочерних процессов.',
  sections: [
    {
      id: 'ps',
      h: 'Command: ps — список процессов',
      html: `
<p><code>ps</code> показывает процессы. <b>Без параметров</b> — процессы, запущенные <b>текущим пользователем в этом терминале</b>. Параметр <code>-f</code> (full format) добавляет столбцы с дополнительной информацией.</p>
<pre class="code" data-lang="bash">debian@debian:/mnt/macos$ ps
    PID TTY          TIME CMD
   2058 pts/0    00:00:00 bash
   2453 pts/0    00:00:00 ps
debian@debian:/mnt/macos$ ps -f
UID          PID    PPID  C STIME TTY          TIME CMD
debian      2058    2032  0 13:01 pts/0    00:00:00 bash
debian      2454    2058  0 13:06 pts/0    00:00:00 ps -f</pre>
<ul>
  <li>Сам <code>ps</code> — тоже процесс: каждый запуск команды — <b>новый процесс</b> с новым PID (2453, затем 2454).</li>
  <li><b>PPID</b> у <code>ps -f</code> = 2058 → его parent — <b>bash</b>, который делает fork + exec для каждой команды.</li>
</ul>
<table class="t">
  <tr><th>Столбец</th><th>Смысл</th></tr>
  <tr><td><b>PID</b> / <b>PPID</b></td><td>id процесса / id его parent</td></tr>
  <tr><td><b>UID</b> / <b>USER</b></td><td>владелец процесса</td></tr>
  <tr><td><b>TTY</b></td><td>управляющий терминал (<code>pts/0</code>); <code>?</code> — нет терминала (демоны, потоки ядра)</td></tr>
  <tr><td><b>TIME</b></td><td>суммарное использованное CPU-время</td></tr>
  <tr><td><b>CMD</b> / <b>COMMAND</b></td><td>команда, запустившая процесс</td></tr>
  <tr><td><b>C</b>, <b>STIME</b></td><td>загрузка CPU, время старта (в <code>-f</code>)</td></tr>
  <tr><td><b>%CPU</b>, <b>%MEM</b>, <b>VSZ</b>, <b>RSS</b>, <b>STAT</b>, <b>START</b></td><td>доля CPU и памяти, виртуальный и резидентный размер (KiB), состояние, время старта (в <code>aux</code>)</td></tr>
</table>
<p>С параметрами <b>-f -a -u -x</b> можно получить список <b>всех</b> работающих процессов с подробностями:</p>
<pre class="code" data-lang="bash">debian@debian:/mnt/macos$ ps -aux
USER    PID %CPU %MEM    VSZ   RSS TTY   STAT START   TIME COMMAND
root      1  0.1  0.2 168624 11852 ?     Ss   13:00   0:00 /sbin/init
root      2  0.0  0.0      0     0 ?     S    13:00   0:00 [kthreadd]
root      3  0.0  0.0      0     0 ?     I&lt;   13:00   0:00 [rcu_gp]
root      9  0.0  0.0      0     0 ?     I    13:00   0:00 [kworker/u16:0-events_unbound]
root     13  0.0  0.0      0     0 ?     S    13:00   0:00 [ksoftirqd/0]
...</pre>
<ul>
  <li><b>PID 1</b> — <code>/sbin/init</code>, предок всех процессов (в теории: init/systemd, pid 1).</li>
  <li>Имена в <b>[квадратных скобках]</b> — потоки ядра (kernel threads), у них нет терминала (<code>?</code>) и VSZ = 0.</li>
</ul>
<table class="t">
  <tr><th>Вариант</th><th>Что показывает</th></tr>
  <tr><td><code>ps</code></td><td>свои процессы в текущем терминале</td></tr>
  <tr><td><code>ps -f</code></td><td>то же, полный формат (UID, PPID, C, STIME)</td></tr>
  <tr><td><code>ps -e</code> (<code>ps -ef</code>)</td><td><b>every</b> — все процессы системы (с <code>-f</code> — в полном формате)</td></tr>
  <tr><td><code>ps aux</code> (<code>ps -aux</code>)</td><td>все процессы всех пользователей (a), user-oriented формат (u), включая процессы без терминала (x)</td></tr>
  <tr><td><code>ps -u wiehe</code></td><td>процессы пользователя wiehe</td></tr>
</table>
<table class="t">
  <tr><th>STAT</th><th>Состояние</th></tr>
  <tr><td><b>R</b></td><td>running / runnable (в ready queue)</td></tr>
  <tr><td><b>S</b></td><td>interruptible sleep — ждёт события (waiting)</td></tr>
  <tr><td><b>D</b></td><td>uninterruptible sleep (обычно I/O)</td></tr>
  <tr><td><b>T</b></td><td>stopped (например, после Ctrl+Z)</td></tr>
  <tr><td><b>Z</b></td><td><b>zombie</b> — завершился, parent ещё не вызвал wait()</td></tr>
  <tr><td><b>I</b></td><td>idle kernel thread</td></tr>
  <tr><td>доп. символы</td><td><b>s</b> — session leader, <b>&lt;</b> — высокий приоритет, <b>+</b> — в foreground группе терминала</td></tr>
</table>`,
      exam: 'ps vs ps -f vs ps aux/-e; что значит PPID, TTY ?, STAT Z/T/S; кто parent у ps (bash).'
    },
    {
      id: 'top',
      h: 'Command: top — загрузка CPU в реальном времени',
      html: `
<p><code>top</code> показывает <b>использование CPU всеми процессами</b> и обновляет экран в реальном времени (в отличие от <code>ps</code>, который делает один «снимок»). Выход — клавиша <b>q</b>.</p>
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
<table class="t">
  <tr><th>Часть</th><th>Смысл</th></tr>
  <tr><td>Заголовок</td><td>время, uptime, число пользователей, <b>load average</b></td></tr>
  <tr><td><b>Tasks</b></td><td>сколько процессов total / running / sleeping / stopped / zombie — те же состояния, что в теории</td></tr>
  <tr><td><b>Cpu(s)</b></td><td>us — user mode, sy — kernel (system), ni — nice-процессы, id — idle</td></tr>
  <tr><td><b>Mem / Swap</b></td><td>использование RAM и swap</td></tr>
  <tr><td><b>PR / NI</b></td><td>приоритет (RT — real-time) / nice value</td></tr>
  <tr><td><b>VIRT / RES / SHR</b></td><td>виртуальная / резидентная / разделяемая память</td></tr>
  <tr><td><b>S</b></td><td>состояние (R, S, D, T, Z)</td></tr>
  <tr><td><b>%CPU / %MEM</b></td><td>доля CPU и памяти</td></tr>
</table>`,
      exam: 'top — динамический мониторинг CPU, ps — снимок; строка Tasks показывает состояния процессов.'
    },
    {
      id: 'kill',
      h: 'Command: kill — сигналы',
      html: `
<p>Процесс завершают командой <code>kill</code> — она отправляет процессу <b>signal</b>.</p>
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
<ul>
  <li><code>ps -u wiehe</code> — найти PID нужного процесса (ACTG.pl = 1255).</li>
  <li><code>kill -9 1255</code> — послать сигнал <b>9 (SIGKILL)</b>. Bash сообщает <code>[1]+ Killed ./ACTG.pl</code>: это был его background job №1.</li>
  <li>Во втором <code>ps</code> процесса 1255 нет, а у <code>ps</code> новый PID 1289.</li>
</ul>
<table class="t">
  <tr><th>Сигнал</th><th>№ (Linux)</th><th>Кто посылает / смысл</th></tr>
  <tr><td><b>SIGTERM</b></td><td>15</td><td><code>kill PID</code> <b>по умолчанию</b> — вежливая просьба завершиться; процесс может перехватить</td></tr>
  <tr><td><b>SIGKILL</b></td><td>9</td><td><code>kill -9 PID</code> — немедленное завершение; <b>нельзя перехватить или игнорировать</b></td></tr>
  <tr><td><b>SIGINT</b></td><td>2</td><td><b>Ctrl+C</b> — прервать foreground процесс</td></tr>
  <tr><td><b>SIGTSTP</b></td><td>20</td><td><b>Ctrl+Z</b> — приостановить foreground процесс (Stopped)</td></tr>
  <tr><td><b>SIGSTOP</b> / <b>SIGCONT</b></td><td>19 / 18</td><td>остановить / продолжить (<code>bg</code> и <code>fg</code> продолжают stopped job)</td></tr>
</table>
<ul>
  <li><code>kill -l</code> — список сигналов; можно по имени: <code>kill -SIGKILL 1255</code>, <code>kill -KILL 1255</code>.</li>
  <li><code>kill %1</code> — сигнал <b>job №1</b> текущего shell; <code>kill 1</code> — процессу с <b>PID 1</b> (init) — обычному пользователю запрещено.</li>
</ul>
<div class="callout note">Связь с теорией: если parent ждёт такого child через <code>wait(&amp;status)</code>, то после <code>kill -9</code> <code>WIFSIGNALED(status)</code> истинно, а <code>WTERMSIG(status) == 9</code>.</div>`,
      exam: 'kill PID = SIGTERM (15); kill -9 = SIGKILL, нельзя перехватить; Ctrl+C = SIGINT, Ctrl+Z = SIGTSTP; kill %1 vs kill 1.'
    },
    {
      id: 'fg-bg',
      h: 'Foreground vs Background',
      html: `
<div class="cols">
  <div><b>Foreground</b>
    <ul>
      <li>Терминальная сессия запускает и контролирует <b>интерактивные</b> процессы в foreground.</li>
      <li>Процесс <b>занимает терминал</b>: пока он работает, другие команды запустить нельзя.</li>
      <li><b>Foreground job</b> подключён к терминалу — общается с пользователем через экран и клавиатуру.</li>
    </ul></div>
  <div><b>Background</b>
    <ul>
      <li>Терминал, запустивший программу, <b>принимает новые команды</b>, пока она работает.</li>
      <li>Обычно — для <b>неинтерактивных</b> процессов.</li>
      <li><b>Background job</b> отключён от терминала и не может общаться с пользователем.</li>
      <li>Если background job требует взаимодействия с пользователем — он <b>останавливается</b> и ждёт подключения к терминалу.</li>
    </ul></div>
</div>
<div class="callout key">В background ставят задачи, которым не нужен пользователь: терминал остаётся свободным, не нужно ждать окончания долгой задачи.</div>`,
      exam: 'Чем foreground отличается от background; что происходит с background job, которому нужен ввод.'
    },
    {
      id: 'job-control',
      h: 'Job control: &, Ctrl+Z, jobs, bg, fg',
      html: `
<p><b>Job control</b> — возможность shell удобно управлять несколькими процессами: перемещать их между <b>foreground</b> и <b>background</b>, <b>приостанавливать (suspend)</b> и <b>возобновлять (resume)</b>.</p>
<div class="callout note"><b>What is a Job?</b> Job — целая единица выполняемой работы. Job состоит из многих tasks, tasks — из многих processes. Множество tasks называют job; программы создаются, чтобы выполнять tasks. Термины job и task в вычислениях взаимозаменяемы.</div>
<table class="t">
  <tr><th>Действие</th><th>Команда</th><th>Результат</th></tr>
  <tr><td>запустить в foreground</td><td><code>$ cmd</code></td><td>Foreground, терминал занят</td></tr>
  <tr><td>запустить в background</td><td><code>$ cmd &amp;</code></td><td>Background; shell печатает <code>[1] 12345</code> (job №, PID)</td></tr>
  <tr><td>приостановить foreground</td><td><b>Ctrl+Z</b></td><td>Stopped: <code>[1]+  Stopped  cmd</code></td></tr>
  <tr><td>список jobs</td><td><code>jobs</code></td><td><code>[n]</code>, статус Running / Stopped; <b>+</b> — текущий job, <b>−</b> — предыдущий</td></tr>
  <tr><td>продолжить в background</td><td><code>bg</code> / <code>bg %n</code></td><td>Stopped → Background</td></tr>
  <tr><td>вернуть в foreground</td><td><code>fg</code> / <code>fg %n</code></td><td>Stopped или Background → Foreground</td></tr>
  <tr><td>остановить background job</td><td><code>kill -STOP %n</code> («stop job#»)</td><td>Background → Stopped</td></tr>
  <tr><td>прервать foreground</td><td><b>Ctrl+C</b></td><td>Killed</td></tr>
  <tr><td>убить job</td><td><code>kill %n</code> («kill job#»)</td><td>Killed</td></tr>
</table>
<div class="callout warn"><code>bg</code> и <code>fg</code> без аргумента работают с <b>текущим</b> job (помечен <b>+</b> в выводе <code>jobs</code>) — обычно последний запущенный в background или последний остановленный.</div>`,
      viz: [{ name: 'graph', caption: 'Background and Foreground Jobs: диаграмма состояний со слайда', props: { w: 620, h: 300,
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
      exam: 'Диаграмма: cmd / cmd & → Foreground / Background; Ctrl+Z → Stopped; bg, fg; Ctrl+C и kill job# → Killed.'
    },
    {
      id: 'wait-me',
      h: 'Example: ./wait-me.sh',
      html: `
<p>На слайде упомянут только запуск <code>./wait-me.sh</code>; текст скрипта не приведён. Для отработки job control подойдёт любой долгий скрипт, например:</p>
<pre class="code" data-lang="bash">#!/bin/bash
# wait-me.sh — долгий процесс для экспериментов с job control
echo "wait-me: PID = $$"
for i in 1 2 3 4 5 6 7 8 9 10
do
    echo "waiting... $i"
    sleep 3
done
echo "done!"</pre>
<pre class="code" data-lang="bash">$ chmod +x wait-me.sh     # сделать исполняемым
$ ./wait-me.sh            # запуск в foreground</pre>
<p>Типичная сессия job control (вывод bash):</p>
<div data-viz="0"></div>
<div class="callout note">Background job может <b>печатать</b> в терминал, но если попытается <b>читать</b> с клавиатуры (например, <code>read</code>), он будет остановлен (Stopped) до <code>fg</code> — это «stop and wait until establishing a connection to the terminal» со слайда.</div>`,
      viz: [{ name: 'stepper', caption: 'wait-me.sh: foreground → Stopped → background → foreground', props: { lang: 'bash', code: `$ ./wait-me.sh
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
        { line: [1, 2], note: 'Скрипт запущен в foreground: терминал занят, новые команды не принимаются.', vars: { 'job [1]': 'Foreground' } },
        { line: [3, 4], note: 'Ctrl+Z → SIGTSTP: job приостановлен, shell снова показывает prompt.', vars: { 'job [1]': 'Stopped' } },
        { line: [5, 6], note: 'jobs: единственный job — текущий (+), статус Stopped.', vars: { 'job [1]': 'Stopped' } },
        { line: [7, 8], note: 'bg %1: job продолжает выполнение в background (получает SIGCONT).', vars: { 'job [1]': 'Background' } },
        { line: [9, 10], note: 'jobs: Running, в конце «&» — работает в фоне. Терминал свободен.', vars: { 'job [1]': 'Background' } },
        { line: [11, 12], note: 'fg %1: job снова в foreground, bash печатает его команду.', vars: { 'job [1]': 'Foreground' } },
        { line: [13, 14], note: 'Ctrl+C → SIGINT: job завершён (Killed), вернулся prompt.', vars: { 'job [1]': 'Killed' } }] } }],
      exam: 'Пройти последовательность Ctrl+Z → jobs → bg → jobs → fg и назвать статусы.'
    },
    {
      id: 'life',
      h: 'The Life of a Process — fork, wait, exit на практике',
      html: String.raw`
<p>В UNIX-like ОС каждый процесс идентифицируется:</p>
<ul>
  <li><b>PID (Process ID)</b> — уникальное целое число процесса (<code>getpid()</code>);</li>
  <li><b>PPID (Parent Process ID)</b> — PID его parent (<code>getppid()</code>).</li>
</ul>
<p>Когда процесс вызывает <code>fork()</code>:</p>
<ul>
  <li>создаётся новый child process, <b>идентичный</b> parent;</li>
  <li>в <b>parent</b> <code>fork()</code> возвращает <b>PID child</b>;</li>
  <li>в <b>child</b> <code>fork()</code> возвращает <b>0</b>.</li>
</ul>
<p>Процесс завершается через <code>exit()</code>, parent ждёт завершения child через <code>wait()</code>.</p>
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
<ul>
  <li>«Parent PPID» — это PID shell (bash), из которого запущена программа.</li>
  <li>В child <code>getppid()</code> = PID parent; в parent переменная <code>pid</code> = PID child.</li>
  <li>Строки child и «Created a child…» parent могут чередоваться по-разному, но «Child has finished.» parent печатает <b>всегда после</b> «Finished!» child — из-за <code>wait(NULL)</code>.</li>
</ul>
<div data-viz="0"></div>
<p><b>Questions (and Answers)</b> со слайдов:</p>
<table class="t">
  <tr><th>Вопрос</th><th>Ответ</th></tr>
  <tr><td>1. Когда процессы меняют состояние?</td><td>При <code>fork()</code> child входит в <b>ready</b>, parent остаётся <b>running</b>. При <code>wait()</code> parent становится <b>waiting</b>; после <code>exit()</code> child становится <b>terminated</b>.</td></tr>
  <tr><td>2. Что вызывает переход waiting → ready?</td><td><b>Завершение child</b> будит parent.</td></tr>
  <tr><td>3. Как смоделировать несколько concurrent processes?</td><td>Создать несколько child через <code>fork()</code> <b>в цикле</b>.</td></tr>
  <tr><td>4. Кто решает, какой процесс получит CPU?</td><td><b>Scheduler</b> операционной системы.</td></tr>
</table>`,
      viz: [{ name: 'stepper', caption: 'Состояния parent и child по ходу программы (parent PID 3000, shell 2058)', props: { lang: 'c', code: String.raw`int main() {
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
        { line: [3, 4], note: 'Один процесс. getpid() = 3000.', vars: { parent: 'running' }, out: '=== Parent process running ===\nParent PID: 3000' },
        { line: 5, note: 'getppid() — PID shell, который запустил программу.', vars: { parent: 'running' }, out: 'Parent PPID: 2058' },
        { line: 6, note: 'fork(): child 3001 создан и входит в ready, parent остаётся running. В parent pid = 3001, в child pid = 0.', vars: { parent: 'running', child: 'ready', 'pid в parent': 3001, 'pid в child': 0 } },
        { line: 17, note: 'Parent печатает PID child.', vars: { parent: 'running', child: 'ready' }, out: '[Parent] Created a child with PID = 3001' },
        { line: [18, 19], note: 'wait(NULL): parent переходит в waiting; scheduler отдаёт CPU child.', vars: { parent: 'waiting', child: 'running' }, out: '[Parent] Waiting for child termination...' },
        { line: [11, 12], note: 'Child: getppid() = 3000 — PID parent.', vars: { parent: 'waiting', child: 'running' }, out: '>>> [Child] I am the child process.\n>>> [Child] PID: 3001, PPID: 3000' },
        { line: [13, 14], note: 'sleep(2): child тоже waiting (ждёт таймер).', vars: { parent: 'waiting', child: 'waiting' }, out: '>>> [Child] Doing a task and terminating...' },
        { line: [15, 23], note: 'Child печатает и выходит (return 0 → exit) → terminated. Его завершение будит parent: waiting → ready.', vars: { parent: 'ready', child: 'terminated' }, out: '>>> [Child] Finished!' },
        { line: [20, 21], note: 'Parent снова running и завершает работу.', vars: { parent: 'running', child: 'terminated' }, out: '[Parent] Child has finished.\n[Parent] End of parent process.' }] } }],
      exam: 'Что возвращает fork() в parent и child; getpid/getppid; какие переходы состояний вызывают fork, wait, exit.'
    },
    {
      id: 'multi-child',
      h: 'Simulating multiple child processes',
      html: String.raw`
<p>Программа создаёт <b>несколько children</b> в цикле и показывает их PID и PPID — моделирует «ready queue» процессов.</p>
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
<ul>
  <li>Children выполняются в <b>недетерминированном порядке</b>: какой запустить первым, решает ОС.</li>
  <li>У каждого child <b>свой PID</b>, но <b>одинаковый PPID</b> (PID parent).</li>
  <li>Parent ждёт <b>всех</b> children перед выходом: каждый <code>wait(NULL)</code> дожидается одного child → <b>n</b> вызовов.</li>
</ul>
<div class="callout warn"><code>exit(0)</code> в child обязателен: без него child продолжил бы цикл и сам вызвал <code>fork()</code> → вместо 1 + 3 = <b>4</b> процессов получилось бы 2³ = <b>8</b>.</div>
<div class="callout note">Тонкость: <code>srand()</code> вызывается в parent <b>до</b> fork, а сам parent <code>rand()</code> не вызывает. Каждый child получает <b>копию одного и того же</b> состояния генератора → первый <code>rand()</code> у всех children даёт одно и то же число, и все спят одинаковое время.</div>`,
      viz: [{ name: 'tree', caption: 'С exit(0): один parent и n = 3 children с общим PPID', props: { root: { label: 'parent', note: 'PID 3000 · wait() × 3', tone: 'acc', children: [
        { label: 'Child 1', note: 'PID 3001 · PPID 3000', tone: 'ok' },
        { label: 'Child 2', note: 'PID 3002 · PPID 3000', tone: 'ok' },
        { label: 'Child 3', note: 'PID 3003 · PPID 3000', tone: 'ok' }] } } }],
      exam: 'Сколько процессов создаст цикл с exit(0) и без него; одинаковый PPID; зачем n вызовов wait(NULL).'
    }
  ],
  terms: [
    { en: 'ps', ru: 'Список процессов', def: 'Снимок процессов: без параметров — свои в текущем терминале; -f — полный формат; -e / aux — все процессы.' },
    { en: 'top', ru: 'Монитор процессов', def: 'Показывает загрузку CPU и памяти всеми процессами в реальном времени; выход — q.' },
    { en: 'PID / PPID', ru: 'ID процесса / ID родителя', def: 'Уникальный номер процесса и номер его parent (getpid(), getppid()).' },
    { en: 'TTY', ru: 'Терминал', def: 'Управляющий терминал процесса (pts/0); ? — без терминала.' },
    { en: 'STAT', ru: 'Состояние в ps', def: 'R running, S sleeping, D uninterruptible, T stopped, Z zombie, I idle.' },
    { en: 'kill', ru: 'Послать сигнал', def: 'kill PID — SIGTERM (15) по умолчанию; kill -9 PID — SIGKILL; kill %n — job n.' },
    { en: 'SIGKILL (9)', ru: 'Сигнал убийства', def: 'Немедленное завершение; нельзя перехватить или игнорировать.' },
    { en: 'SIGTERM (15)', ru: 'Сигнал завершения', def: 'Сигнал kill по умолчанию; процесс может перехватить его и завершиться корректно.' },
    { en: 'SIGINT / SIGTSTP', ru: 'Ctrl+C / Ctrl+Z', def: 'Прерывание foreground процесса / его приостановка (Stopped).' },
    { en: 'Foreground job', ru: 'Задание переднего плана', def: 'Подключено к терминалу, общается через экран и клавиатуру; терминал занят.' },
    { en: 'Background job', ru: 'Фоновое задание', def: 'Отключено от терминала (cmd &); терминал свободен; при запросе ввода останавливается.' },
    { en: 'Job', ru: 'Задание', def: 'Единица работы: состоит из tasks, tasks — из processes.' },
    { en: 'Job control', ru: 'Управление заданиями', def: 'Возможность shell перемещать процессы между foreground и background, приостанавливать и возобновлять их.' },
    { en: 'jobs / bg / fg', ru: 'Команды job control', def: 'Список заданий; продолжить в фоне; вернуть на передний план (%n — номер job, + — текущий).' }
  ],
  questions: [
    { id: 'lproc-01', type: 'single', q: 'Что показывает ps без параметров?', options: ['Все процессы всех пользователей', 'Процессы текущего пользователя, запущенные в этом терминале', 'Только процессы ядра', 'Загрузку CPU в реальном времени'], answer: 1, explain: 'Без параметров ps показывает процессы текущего пользователя в текущем терминале. Все процессы — ps aux / ps -e; реальное время — top.', section: 'ps', diff: 1 },
    { id: 'lproc-02', type: 'single', q: 'Какой параметр ps добавляет столбцы UID, PPID, C, STIME?', options: ['-f', '-u', '-x', '-e'], answer: 0, explain: '-f (full format) добавляет столбцы, в т.ч. PPID.', section: 'ps', diff: 1 },
    { id: 'lproc-03', type: 'code', q: 'По выводу определите parent процесса ps -f.', lang: 'bash', code: `debian@debian:/mnt/macos$ ps -f
UID          PID    PPID  C STIME TTY          TIME CMD
debian      2058    2032  0 13:01 pts/0    00:00:00 bash
debian      2454    2058  0 13:06 pts/0    00:00:00 ps -f`, options: ['bash (PID 2058)', 'процесс 2032', 'сам ps -f (PID 2454)', 'init (PID 1)'], answer: 0, explain: 'PPID у ps -f = 2058 — это PID bash: shell создал процесс для команды (fork + exec). 2032 — parent самого bash.', section: 'ps', diff: 2 },
    { id: 'lproc-04', type: 'single', q: 'Пользователь выполнил ps, затем ps -f. В первом выводе ps имел PID 2453, во втором — 2454. Почему?', options: ['PID процесса меняется каждую секунду', 'Каждый запуск команды — новый процесс с новым PID', 'ps -f — поток процесса ps', 'Из-за перезапуска bash'], answer: 1, explain: 'Bash для каждой команды создаёт новый child process; PID выдаются заново.', section: 'ps', diff: 1 },
    { id: 'lproc-05', type: 'code', q: 'Фрагмент вывода ps -aux. Что верно?', lang: 'bash', code: `USER    PID %CPU %MEM    VSZ   RSS TTY   STAT START   TIME COMMAND
root      1  0.1  0.2 168624 11852 ?     Ss   13:00   0:00 /sbin/init
root      2  0.0  0.0      0     0 ?     S    13:00   0:00 [kthreadd]
root      3  0.0  0.0      0     0 ?     I<   13:00   0:00 [rcu_gp]`, options: ['/sbin/init имеет PID 1 и не связан с терминалом', 'kthreadd запущен из терминала pts/0', 'rcu_gp использует 168624 KiB виртуальной памяти', 'Все процессы принадлежат текущему пользователю debian'], answer: 0, explain: 'PID 1 — init, TTY ? — нет управляющего терминала. kthreadd и rcu_gp — потоки ядра с VSZ 0; владелец — root.', section: 'ps', diff: 2 },
    { id: 'lproc-06', type: 'single', q: 'Какая STAT в ps означает zombie process (завершился, parent не вызвал wait())?', options: ['S', 'T', 'Z', 'R'], answer: 2, explain: 'Z — zombie; T — stopped, S — sleeping, R — running.', section: 'ps', diff: 2 },
    { id: 'lproc-07', type: 'single', q: 'Чем top отличается от ps?', options: ['top показывает только процессы текущего терминала', 'top показывает использование CPU всеми процессами и обновляется в реальном времени', 'top завершает процессы по умолчанию', 'top выводит дерево процессов'], answer: 1, explain: 'ps — одномоментный снимок, top — постоянно обновляемая картина загрузки CPU/памяти.', section: 'top', diff: 1 },
    { id: 'lproc-08', type: 'code', q: 'Какой сигнал получил процесс ACTG.pl?', lang: 'bash', code: `zhome:~/linux_tutorial$ ps -u wiehe
  PID TTY          TIME CMD
 1196 pts/2    00:00:00 bash
 1255 pts/2    00:00:01 ACTG.pl
zhome:~/linux_tutorial$ kill -9 1255
[1]+  Killed                  ./ACTG.pl`, options: ['SIGTERM (15)', 'SIGKILL (9)', 'SIGINT (2)', 'SIGTSTP (20)'], answer: 1, explain: 'kill -9 — сигнал 9 SIGKILL; bash сообщает «Killed» для своего job №1.', section: 'kill', diff: 1 },
    { id: 'lproc-09', type: 'single', q: 'Какой сигнал отправляет kill PID без указания сигнала?', options: ['SIGKILL (9)', 'SIGTERM (15)', 'SIGINT (2)', 'SIGSTOP (19)'], answer: 1, explain: 'По умолчанию kill посылает SIGTERM; -9 нужно указывать явно.', section: 'kill', diff: 2 },
    { id: 'lproc-10', type: 'single', q: 'Процесс игнорирует kill PID. Почему kill -9 PID всё равно его завершит?', options: ['SIGKILL нельзя перехватить или игнорировать', 'kill -9 перезагружает систему', 'kill -9 отправляет сигнал parent', 'kill -9 приостанавливает процесс'], answer: 0, explain: 'SIGTERM процесс может перехватить/игнорировать, SIGKILL — нет.', section: 'kill', diff: 2 },
    { id: 'lproc-11', type: 'code', q: 'Нужно завершить job №1 текущего shell. Какая команда это делает?', lang: 'bash', code: `$ ./wait-me.sh &
[1] 4321
$ jobs
[1]+  Running                 ./wait-me.sh &`, options: ['kill %1', 'kill 1', 'kill -1', 'fg 4321'], answer: 0, explain: '%1 — номер job. kill 1 — процессу с PID 1 (init), обычному пользователю запрещено. Также подойдёт kill 4321 (PID).', section: 'kill', diff: 2 },
    { id: 'lproc-12', type: 'single', q: 'Что характерно для foreground процесса?', options: ['Терминал принимает новые команды, пока процесс работает', 'Процесс занимает терминал: другие команды нельзя запустить, пока он работает', 'Процесс не может читать с клавиатуры', 'Процесс всегда неинтерактивный'], answer: 1, explain: 'Foreground job подключён к терминалу и занимает его. Свободный терминал — признак background.', section: 'fg-bg', diff: 1 },
    { id: 'lproc-13', type: 'single', q: 'Что произойдёт с background job, которому понадобился ввод пользователя?', options: ['Он завершится', 'Он остановится и будет ждать подключения к терминалу', 'Он прочитает пустую строку и продолжит', 'Он автоматически перейдёт в foreground'], answer: 1, explain: 'Со слайда: если background job требует взаимодействия, он stops and waits until establishing a connection to the terminal (вернуть — fg).', section: 'fg-bg', diff: 2 },
    { id: 'lproc-14', type: 'single', q: 'Как сразу запустить команду в background?', options: ['cmd &', 'bg cmd', 'cmd | bg', 'Ctrl+Z cmd'], answer: 0, explain: 'Символ & в конце команды запускает её в фоне; bg продолжает уже остановленный job.', section: 'job-control', diff: 1 },
    { id: 'lproc-15', type: 'single', q: 'Что делает Ctrl+Z с foreground процессом?', options: ['Завершает его (Killed)', 'Приостанавливает его (Stopped)', 'Переводит в background с продолжением выполнения', 'Ничего'], answer: 1, explain: 'Ctrl+Z (SIGTSTP) → Stopped. Чтобы продолжить в фоне — bg; Ctrl+C — Killed.', section: 'job-control', diff: 1 },
    { id: 'lproc-16', type: 'code', q: 'Что выведет последняя команда jobs?', lang: 'bash', code: `$ ./wait-me.sh
^Z
[1]+  Stopped                 ./wait-me.sh
$ bg
[1]+ ./wait-me.sh &
$ jobs`, options: ['[1]+  Running                 ./wait-me.sh &', '[1]+  Stopped                 ./wait-me.sh', '[1]+  Done                    ./wait-me.sh', 'Ничего — job завершён'], answer: 0, explain: 'bg продолжил остановленный job в фоне: статус Running, в конце &.', section: 'job-control', diff: 2 },
    { id: 'lproc-17', type: 'code', q: 'Какой job вернёт на передний план команда fg без аргументов?', lang: 'bash', code: `$ sleep 100 &
[1] 5001
$ sleep 200 &
[2] 5002
$ jobs
[1]-  Running                 sleep 100 &
[2]+  Running                 sleep 200 &
$ fg`, options: ['sleep 200 (job 2, помечен +)', 'sleep 100 (job 1)', 'Оба job', 'Ошибка: нужно указать %n'], answer: 0, explain: 'Без аргумента fg/bg работают с текущим job — помеченным + (последний запущенный в фоне).', section: 'job-control', diff: 3 },
    { id: 'lproc-18', type: 'single', q: 'По диаграмме Background and Foreground Jobs: как перевести Stopped job в Background?', options: ['fg', 'bg', 'ctrl-C', 'stop job#'], answer: 1, explain: 'Stopped → bg → Background; fg → Foreground; ctrl-C убивает foreground; stop job# — Background → Stopped.', section: 'job-control', diff: 1 },
    { id: 'lproc-19', type: 'multi', q: 'Что позволяет job control? (несколько ответов)', options: ['Перемещать процессы между foreground и background', 'Приостанавливать выполнение (suspend)', 'Возобновлять выполнение (resume)', 'Менять PID процесса', 'Менять parent процесса'], answer: [0, 1, 2], explain: 'Job control двигает процессы между fg/bg и suspend/resume; PID и parent не меняет.', section: 'job-control', diff: 1 },
    { id: 'lproc-20', type: 'code', q: 'Последовательность: запуск, Ctrl+Z, bg, fg, Ctrl+C. В каком состоянии job после каждого шага?', lang: 'bash', code: `$ ./wait-me.sh     # 1
^Z                 # 2
$ bg               # 3
$ fg               # 4
^C                 # 5`, options: ['Foreground → Stopped → Background → Foreground → Killed', 'Foreground → Killed → Background → Foreground → Stopped', 'Background → Stopped → Foreground → Background → Killed', 'Foreground → Background → Stopped → Foreground → Killed'], answer: 0, explain: 'Ctrl+Z — Stopped, bg — Background, fg — Foreground, Ctrl+C — Killed.', section: 'wait-me', diff: 2 },
    { id: 'lproc-21', type: 'code', q: 'Parent имеет PID 3000, fork() создал child с PID 3001. Что напечатает child?', lang: 'c', code: String.raw`pid = fork();
if (pid == 0) {
    printf(">>> [Child] PID: %d, PPID: %d\n", getpid(), getppid());
} else {
    printf("[Parent] Created a child with PID = %d\n", pid);
    wait(NULL);
}`, options: ['>>> [Child] PID: 3001, PPID: 3000', '>>> [Child] PID: 0, PPID: 3000', '>>> [Child] PID: 3000, PPID: 3001', '>>> [Child] PID: 3001, PPID: 0'], answer: 0, explain: 'В child fork() вернул 0, но getpid() — его реальный PID 3001, getppid() — PID parent 3000.', section: 'life', diff: 2 },
    { id: 'lproc-22', type: 'code', q: 'Какая из строк гарантированно печатается ПОСЛЕ «>>> [Child] Finished!»?', lang: 'c', code: String.raw`} else if (pid == 0) {
    printf(">>> [Child] PID: %d, PPID: %d\n", getpid(), getppid());
    sleep(2);
    printf(">>> [Child] Finished!\n\n");
} else {
    printf("[Parent] Created a child with PID = %d\n", pid);
    printf("[Parent] Waiting for child termination...\n");
    wait(NULL);
    printf("[Parent] Child has finished.\n");
}`, options: ['[Parent] Child has finished.', '[Parent] Created a child with PID = …', '[Parent] Waiting for child termination...', '>>> [Child] PID: …, PPID: …'], answer: 0, explain: 'Parent блокирован в wait(NULL) до завершения child, поэтому «Child has finished.» всегда после. Строки до wait могут идти в любом порядке относительно child.', section: 'life', diff: 2 },
    { id: 'lproc-23', type: 'single', q: 'По слайду Life of a Process: что происходит с состояниями при fork() и wait()?', options: ['При fork() child — ready, parent остаётся running; при wait() parent — waiting', 'При fork() parent — waiting; при wait() child — terminated', 'При fork() оба running; при wait() parent — terminated', 'При fork() child — running, parent — ready'], answer: 0, explain: 'A.1 со слайда: fork → child ready, parent running; wait → parent waiting; exit → child terminated.', section: 'life', diff: 2 },
    { id: 'lproc-24', type: 'single', q: 'Что переводит parent из waiting в ready в этом примере?', options: ['Истечение кванта', 'Завершение child (его exit) будит parent', 'Вызов fork()', 'Нажатие Ctrl+Z'], answer: 1, explain: 'A.2: the child’s termination wakes the parent process.', section: 'life', diff: 1 },
    { id: 'lproc-25', type: 'code', q: 'Сколько всего процессов (включая parent) существует в этой программе?', lang: 'c', code: String.raw`int n = 3;
for (int i = 0; i < n; i++) {
    pid = fork();
    if (pid == 0) {
        printf("Child %d\n", i + 1);
        sleep(1);
        exit(0);
    }
}
for (int i = 0; i < n; i++)
    wait(NULL);`, options: ['3', '4', '7', '8'], answer: 1, explain: 'Каждый child делает exit(0) и не продолжает цикл; fork вызывает только parent, 3 раза → 1 + 3 = 4.', section: 'multi-child', diff: 2 },
    { id: 'lproc-26', type: 'code', q: 'Из того же кода убрали exit(0). Сколько теперь процессов (включая исходный)?', lang: 'c', code: String.raw`int n = 3;
for (int i = 0; i < n; i++) {
    pid = fork();
    if (pid == 0) {
        printf("Child %d\n", i + 1);
        sleep(1);
    }
}`, options: ['4', '6', '8', '3'], answer: 2, explain: 'Children продолжают цикл и тоже вызывают fork() → каждая итерация удваивает число процессов: 2³ = 8.', section: 'multi-child', diff: 3 },
    { id: 'lproc-27', type: 'tf', q: 'В программе Simulating multiple child processes все children имеют одинаковый PPID.', answer: true, explain: 'Всех children создаёт один parent, поэтому PPID у всех — PID parent; PID у каждого свой.', section: 'multi-child', diff: 1 },
    { id: 'lproc-28', type: 'single', q: 'Зачем parent вызывает wait(NULL) в цикле n раз?', options: ['Каждый wait(NULL) дожидается завершения одного child; нужно дождаться всех n', 'wait(NULL) создаёт нового child', 'Чтобы children выполнялись по порядку', 'Чтобы задать время сна children'], answer: 0, explain: 'Один wait — один завершившийся child; parent должен дождаться всех n перед «All children finished».', section: 'multi-child', diff: 2 },
    { id: 'lproc-29', type: 'tf', q: 'Children в этой программе всегда завершаются в порядке создания (Child 1, Child 2, Child 3).', answer: false, explain: 'Порядок недетерминирован: какой процесс выполнять, решает scheduler ОС.', section: 'multi-child', diff: 1 },
    { id: 'lproc-30', type: 'single', q: 'srand(time(NULL)) вызван в parent до цикла, parent сам rand() не вызывает; каждый child вычисляет tempo = rand() % 5 + 1. Что будет с tempo у трёх children?', options: ['У всех одинаковое значение', 'Всегда 1, 2, 3', 'Всегда разные случайные значения', 'Ошибка: rand() нельзя вызывать после fork()'], answer: 0, explain: 'Каждый child получает копию одного и того же состояния генератора (parent его не продвигает), поэтому первый rand() у всех даёт одно и то же число.', section: 'multi-child', diff: 3 }
  ]
});
