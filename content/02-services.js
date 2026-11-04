OS.addModule({
  id: 'services',
  num: 2,
  group: 'theory',
  title: 'Operating-System Services',
  titleRu: 'Сервисы и структура ОС',
  icon: '🧩',
  sources: ['2-Operating System Services.pdf'],
  summary: 'Цели проектирования, сервисы ОС, CLI/GUI/shells, system calls (реализация, передача параметров, типы, Windows vs Unix), C library и API/POSIX, system services, linkers & loaders, сборка и загрузка, отладка, структуры ОС: monolithic, layered, microkernel, modules, hybrid.',
  sections: [
    {
      id: 'design',
      h: 'Design and Implementation of OS',
      html: `
<ul>
  <li>Задача проектирования ОС не «solvable» до конца, но некоторые подходы доказали успешность.</li>
  <li>Внутренняя структура разных ОС может сильно различаться.</li>
  <li>Проектирование начинается с определения <b>goals</b> и <b>services</b>; на него влияют выбор hardware и тип системы.</li>
</ul>
<div class="cols">
  <div><b>User goals</b> — ОС должна быть:
    <ul><li>convenient to use</li><li>easy to learn</li><li>reliable</li><li>safe</li><li>fast</li></ul>
  </div>
  <div><b>System goals</b> — ОС должна быть:
    <ul><li>easy to design, implement, and maintain</li><li>flexible</li><li>reliable, error-free</li><li>efficient</li></ul>
  </div>
</div>
<div class="callout note">Specifying and designing an OS — highly creative task of software engineering.</div>`,
      exam: 'Различать user goals (удобство, простота изучения, скорость) и system goals (лёгкость проектирования/сопровождения, гибкость, эффективность).'
    },
    {
      id: 'services',
      h: 'Operating System Services',
      html: `
<table class="t">
  <tr><th colspan="2">Services <b>for the user</b></th></tr>
  <tr><td><b>User interface (UI)</b></td><td>есть почти у всех ОС: <b>Command-Line (CLI)</b>, <b>Graphics User Interface (GUI)</b>, touch-screen, <b>Batch</b></td></tr>
  <tr><td><b>Program execution</b></td><td>загрузить программу в память, запустить, завершить — нормально или аварийно (с индикацией ошибки)</td></tr>
  <tr><td><b>I/O operations</b></td><td>программе может понадобиться I/O — файл или I/O device</td></tr>
  <tr><td><b>File-system manipulation</b></td><td>read/write файлов и каталогов, create/delete, search, list file information, <b>permission management</b></td></tr>
  <tr><td><b>Communications</b></td><td>обмен информацией между процессами на одном компьютере или по сети — через <b>shared memory</b> или <b>message passing</b> (пакеты перемещает ОС)</td></tr>
  <tr><td><b>Error detection</b></td><td>ОС постоянно отслеживает ошибки в CPU и memory hardware, I/O devices, user program; на каждый тип — своё действие для корректных вычислений; <b>debugging facilities</b> помогают пользователю и программисту</td></tr>
  <tr><th colspan="2">Services <b>for efficient operation of the system itself</b></th></tr>
  <tr><td><b>Resource allocation</b></td><td>при нескольких пользователях/jobs ресурсы (CPU cycles, main memory, file storage, I/O devices) распределяются между ними</td></tr>
  <tr><td><b>Logging</b> (accounting)</td><td>учёт: какие пользователи сколько и каких ресурсов используют</td></tr>
  <tr><td><b>Protection and security</b></td><td><b>protection</b> — весь доступ к ресурсам контролируется, concurrent processes не мешают друг другу; <b>security</b> от посторонних требует <b>user authentication</b> и защиты внешних I/O devices от недопустимого доступа</td></tr>
</table>
<p><b>A View of Operating System Services</b> (повторяется на слайдах, выделяя по очереди user interfaces, system calls и services):</p>`,
      viz: [{ name: 'layers', caption: 'A View of Operating System Services: UI, system calls и services — части ОС между программами и hardware', props: { layers: [
        { label: 'user and other system programs', tone: 'muted' },
        { label: 'user interfaces', sub: 'GUI · touch screen · command line', tone: 'c2' },
        { label: 'system calls', tone: 'warn' },
        { label: 'services', sub: 'program execution · I/O operations · file systems · communication · resource allocation · accounting · error detection · protection and security', tone: 'acc' },
        { label: 'hardware', tone: 'muted' }] } }],
      exam: 'Разделить сервисы на «для пользователя» (UI, program execution, I/O, file system, communications, error detection) и «для эффективности системы» (resource allocation, logging, protection & security).'
    },
    {
      id: 'gui',
      h: 'User Interfaces — GUI, Touchscreen, CLI + GUI',
      html: `
<p><b>GUI</b>:</p>
<ul>
  <li>User-friendly <b>desktop metaphor</b> interface; обычно mouse, keyboard, monitor.</li>
  <li><b>Icons</b> представляют файлы, программы, действия.</li>
  <li>Кнопки мыши над объектами вызывают действия: информация, опции, выполнение функции, открытие каталога (<b>folder</b>).</li>
  <li>Изобретён в <b>Xerox PARC</b>.</li>
</ul>
<p><b>Touchscreen Interfaces</b>: нужны новые интерфейсы — мышь невозможна/нежелательна; действия и выбор — <b>gestures</b>; <b>virtual keyboard</b> для ввода текста; <b>voice commands</b>.</p>
<p>Многие системы имеют <b>и CLI, и GUI</b>:</p>
<table class="t">
  <tr><th>ОС</th><th>Интерфейсы</th></tr>
  <tr><td>Microsoft Windows</td><td>GUI + CLI «command» shell</td></tr>
  <tr><td>Apple Mac OS X</td><td>«<b>Aqua</b>» GUI, под ним <b>UNIX kernel</b>, shells доступны</td></tr>
  <tr><td>Unix и Linux</td><td>CLI с optional GUI (<b>CDE</b>, <b>KDE</b>, <b>GNOME</b>)</td></tr>
</table>`,
      exam: 'Где изобретён GUI (Xerox PARC); что лежит под Aqua в Mac OS X; GUI-оболочки Linux.'
    },
    {
      id: 'cli',
      h: 'Command Line Interpreter, shells, Windows CMD/PowerShell, WSL',
      html: `
<p><b>CLI</b> позволяет вводить команды напрямую. Зачем:</p>
<ul>
  <li>прямой доступ к функциям ОС;</li>
  <li>GUI может не использовать все доступные команды;</li>
  <li>команды можно автоматизировать — <b>bash scripts</b>;</li>
  <li>у системы может не хватать ресурсов для графической программы.</li>
</ul>
<ul>
  <li>Иногда реализовано несколько вариантов — <b>shells</b>.</li>
  <li>Shell в основном получает команду от пользователя и выполняет её.</li>
  <li>Команды бывают <b>built-in</b> (встроены в shell) или просто <b>имена программ</b> — тогда добавление новых функций <b>не требует модификации shell</b>.</li>
  <li><b>Bourne Shell</b> — оригинальный Unix shell.</li>
</ul>
<p><b>Shell in Unix/Linux</b>:</p>
<pre class="code" data-lang="bash">$ cat /etc/shells     # пути ко всем valid login shells системы
$ echo $SHELL         # default shell пользователя
$ echo $0             # текущий (current) shell

# пример сессии со слайда (Bourne shell):
$ uptime
$ df -kh
$ ps aux | sort -nrk 3,3 | head -n 5
$ ls -l /usr/lpp/mmfs/bin/mmfsd</pre>
<p><b>In Windows</b>: <b>Command prompt (CMD)</b> — интерфейс для прямой работы с системой; <b>Windows PowerShell</b> — более сложная версия, включает язык скриптов для административных операций.</p>
<p><b>Windows Subsystem for Linux (WSL)</b> — позволяет установить Linux distribution (Ubuntu, OpenSUSE, Kali, Debian, Arch Linux…) и использовать Linux applications, utilities и Bash command-line tools прямо в Windows.</p>`,
      exam: 'Причины пользы CLI; built-in команды vs программы; /etc/shells, $SHELL (default) vs $0 (current); CMD vs PowerShell; WSL.'
    },
    {
      id: 'syscalls',
      h: 'System Calls — пример copy и реализация',
      html: `
<ul>
  <li><b>System Calls</b> — интерфейс между программой в <b>user space</b> и ОС: приложения через них запрашивают сервисы ядра.</li>
  <li><b>Application Programming Interface (API)</b> — позволяет программам передавать информацию друг другу.</li>
</ul>
<p><b>Example of System Calls</b> — копирование файла <code>cp in.txt out.txt</code> (проверить результат: <code>diff in.txt out.txt</code>, <code>sdiff</code>, <code>vimdiff</code>). Даже простая программа делает много system calls:</p>
<div data-viz="0"></div>
<p><b>System Call Implementation</b>:</p>
<ul>
  <li>С каждым system call связан <b>номер</b>.</li>
  <li><b>System-call interface</b> хранит <b>таблицу, индексированную этими номерами</b>.</li>
  <li>Он вызывает нужный system call в kernel и возвращает его <b>status</b> и <b>return values</b>.</li>
  <li>Вызывающему <b>не нужно знать</b>, как реализован system call — достаточно соблюдать API и понимать, что сделает ОС.</li>
  <li>Большинство деталей интерфейса ОС скрыто API; управляется <b>run-time support library</b> (функции, встроенные в библиотеки компилятора).</li>
</ul>
<p><b>Application – System Call – OS Relationship</b> (пример <code>open()</code>):</p>
<div data-viz="1"></div>`,
      viz: [
        { name: 'stepper', caption: 'Example System Call Sequence: source file → destination file', props: { lang: 'text',
          code: 'Acquire input file name\n  Write prompt to screen\n  Accept input\nAcquire output file name\n  Write prompt to screen\n  Accept input\nOpen the input file\n  if file doesn\'t exist, abort\nCreate output file\n  if file exists, abort\nLoop\n  Read from input file\n  Write to output file\nUntil read fails\nClose output file\nWrite completion message to screen\nTerminate normally',
          steps: [
            { line: [1, 2, 3], note: 'Имя входного файла: write() приглашения на экран и read() с клавиатуры — уже system calls.' },
            { line: [4, 5, 6], note: 'То же для имени выходного файла.' },
            { line: [7, 8], note: 'open() входного файла; если файла нет — ошибка и abort (аварийное завершение).' },
            { line: [9, 10], note: 'create выходного файла; если он уже существует — abort.' },
            { line: [11, 12, 13, 14], note: 'Цикл read() из входного / write() в выходной, пока read не «провалится» (EOF или ошибка).' },
            { line: 15, note: 'close() выходного файла.' },
            { line: 16, note: 'write() сообщения о завершении на экран.' },
            { line: 17, note: 'exit() — нормальное завершение.' }] } },
        { name: 'flow', caption: 'open(): user mode → system call interface → таблица по номеру i → реализация → return', props: { dir: 'h', loop: true, steps: [
          { label: 'user application', sub: 'вызывает open()', tone: 'c2' },
          { label: 'system call interface', sub: 'user → kernel mode', tone: 'warn' },
          { label: 'table[i]', sub: 'номер system call', tone: 'muted' },
          { label: 'implementation of open()', sub: 'kernel → return', tone: 'acc' }] } }
      ],
      exam: 'Как system-call interface находит вызов (номер → таблица); почему caller не обязан знать реализацию; последовательность syscalls в примере копирования.'
    },
    {
      id: 'params',
      h: 'System Call Parameter Passing',
      html: `
<ul>
  <li>Часто нужно больше информации, чем просто номер вызова; тип и объём зависят от ОС и вызова.</li>
  <li>Три общих метода передачи параметров в ОС:</li>
</ul>
<table class="t">
  <tr><th>Метод</th><th>Как</th><th>Замечания</th></tr>
  <tr><td><b>Registers</b></td><td>параметры в регистрах</td><td>самый простой; параметров может быть больше, чем регистров</td></tr>
  <tr><td><b>Block / table</b> in memory</td><td>параметры в блоке памяти, <b>адрес блока</b> передаётся в регистре</td><td>так делают <b>Linux и Solaris</b></td></tr>
  <tr><td><b>Stack</b></td><td>программа делает <b>push</b> параметров, ОС — <b>pop</b></td><td>—</td></tr>
</table>
<div class="callout key"><b>Block</b> и <b>stack</b> методы <b>не ограничивают</b> число и длину параметров.</div>
<p><b>Parameter Passing via Table</b>: user program кладёт параметры в таблицу X, загружает адрес X в регистр и вызывает system call 13; код system call 13 в ОС берёт параметры из таблицы X.</p>`,
      viz: [{ name: 'graph', caption: 'Parameter Passing via Table', props: { w: 600, h: 230,
        nodes: [
          { id: 'up', label: 'user program', sub: 'X: parameters for call', x: 110, y: 150, w: 170, h: 60, tone: 'c2' },
          { id: 'reg', label: 'register', sub: 'X (адрес таблицы)', x: 300, y: 45, w: 150, tone: 'warn' },
          { id: 'os', label: 'code for system call 13', sub: 'use parameters from table X', x: 480, y: 150, w: 190, h: 60, tone: 'acc' }],
        edges: [
          { from: 'up', to: 'reg', label: 'load address X' },
          { from: 'reg', to: 'os' },
          { from: 'up', to: 'os', label: 'system call 13' }] } }],
      exam: 'Три метода; какой используют Linux и Solaris (по слайду — block/table); какие методы не ограничивают число параметров.'
    },
    {
      id: 'types',
      h: 'Types of System Calls; Windows vs Unix',
      html: `
<table class="t">
  <tr><th>Тип</th><th>Вызовы</th></tr>
  <tr><td><b>Process control</b></td><td>create/terminate process; end, abort; load, execute; get/set process attributes; wait for time; wait event, signal event; allocate and free memory; dump memory if error; debugger (single step execution); <b>locks</b> для доступа к shared data между процессами</td></tr>
  <tr><td><b>File management</b></td><td>create/delete file; open/close; read, write, reposition; get/set file attributes</td></tr>
  <tr><td><b>Device management</b></td><td>request/release device; read, write, reposition; get/set device attributes; logically attach or detach devices</td></tr>
  <tr><td><b>Information maintenance</b></td><td>get/set time or date; get/set system data; get/set process, file, device attributes</td></tr>
  <tr><td><b>Communications</b></td><td>create/delete communication connection; send/receive messages (<b>message passing</b> model, к host name или process name, от client к server); <b>shared-memory</b> model — create and gain access to memory regions; transfer status information; attach/detach remote devices</td></tr>
  <tr><td><b>Protection</b></td><td>control access to resources; get/set permissions; allow/deny user access</td></tr>
</table>
<p><b>Examples of Windows and Unix System Calls</b>:</p>
<table class="t">
  <tr><th>Тип</th><th>Windows</th><th>Unix</th></tr>
  <tr><td>Process control</td><td><code>CreateProcess()</code><br><code>ExitProcess()</code><br><code>WaitForSingleObject()</code></td><td><code>fork()</code><br><code>exit()</code><br><code>wait()</code></td></tr>
  <tr><td>File management</td><td><code>CreateFile()</code><br><code>ReadFile()</code><br><code>WriteFile()</code><br><code>CloseHandle()</code></td><td><code>open()</code><br><code>read()</code><br><code>write()</code><br><code>close()</code></td></tr>
  <tr><td>Device management</td><td><code>SetConsoleMode()</code><br><code>ReadConsole()</code><br><code>WriteConsole()</code></td><td><code>ioctl()</code><br><code>read()</code><br><code>write()</code></td></tr>
  <tr><td>Information maintenance</td><td><code>GetCurrentProcessID()</code><br><code>SetTimer()</code><br><code>Sleep()</code></td><td><code>getpid()</code><br><code>alarm()</code><br><code>sleep()</code></td></tr>
  <tr><td>Communications</td><td><code>CreatePipe()</code><br><code>CreateFileMapping()</code><br><code>MapViewOfFile()</code></td><td><code>pipe()</code><br><code>shm_open()</code><br><code>mmap()</code></td></tr>
  <tr><td>Protection</td><td><code>SetFileSecurity()</code><br><code>InitializeSecurityDescriptor()</code><br><code>SetSecurityDescriptorGroup()</code></td><td><code>chmod()</code><br><code>umask()</code><br><code>chown()</code></td></tr>
</table>`,
      exam: '6 категорий и их вызовы; сопоставить Windows ↔ Unix (CreateProcess ↔ fork, CreateFile ↔ open, SetConsoleMode ↔ ioctl, chmod/umask/chown — protection).'
    },
    {
      id: 'clib',
      h: 'Standard C Library Example и Example of Standard API (read)',
      html: `
<p><b>Standard C Library</b> предоставляет часть system-call interface во многих версиях UNIX и Linux. Программа вызывает <b>library call</b> <code>printf()</code>; C library перехватывает вызов и выполняет нужный <b>system call</b> — <code>write()</code>; значение, возвращённое <code>write()</code>, библиотека передаёт обратно программе.</p>
<pre class="code" data-lang="c">#include &lt;stdio.h&gt;
int main()
{
    printf("Greetings");   /* library call (user mode) */
    return 0;
}</pre>
<div data-viz="0"></div>
<p><b>Example of Standard API</b> — функция <code>read()</code> в UNIX/Linux (описание: <code>man read</code>):</p>
<pre class="code" data-lang="c">#include &lt;unistd.h&gt;

ssize_t read(int fd, void *buf, size_t count);</pre>
<table class="t">
  <tr><th>Часть</th><th>Смысл</th></tr>
  <tr><td><code>ssize_t</code></td><td>return value</td></tr>
  <tr><td><code>read</code></td><td>function name</td></tr>
  <tr><td><code>int fd</code></td><td>file descriptor, из которого читаем</td></tr>
  <tr><td><code>void *buf</code></td><td>буфер, куда будут прочитаны данные</td></tr>
  <tr><td><code>size_t count</code></td><td><b>максимальное</b> число байт для чтения в буфер</td></tr>
</table>
<ul>
  <li><code>unistd.h</code> определяет типы <code>ssize_t</code> и <code>size_t</code>.</li>
  <li>Успех → возвращается <b>число прочитанных байт</b>; <b>0</b> → <b>end of file</b>; ошибка → <b>−1</b>.</li>
</ul>`,
      viz: [{ name: 'flow', caption: 'printf() → standard C library → write() system call → результат обратно', props: { dir: 'h', loop: true, steps: [
        { label: 'printf("Greetings")', sub: 'user program', tone: 'c2' },
        { label: 'standard C library', sub: 'user mode', tone: 'warn' },
        { label: 'write() system call', sub: 'kernel mode', tone: 'acc' }] } }],
      exam: 'printf — library call, write — system call; сигнатура read() и значения возврата (n, 0 = EOF, −1 = ошибка).'
    },
    {
      id: 'api',
      h: 'Application Programming Interface (API)',
      html: `
<ul>
  <li><b>API</b> — набор функций и процедур для создания приложений, использующих возможности или данные ОС, приложения или другого сервиса.</li>
  <li>С точки зрения программиста нет существенной разницы между library functions и system calls — <b>и то и другое функции</b>.</li>
</ul>
<p><b>Advantages</b> (по сравнению с «сырыми» system calls):</p>
<ul>
  <li><b>Abstraction</b> — более высокий уровень: работа со сложной функциональностью без знания реализации → проще разработка, меньше ошибок.</li>
  <li><b>Portability</b> — единый интерфейс на разных платформах/ОС; код можно переиспользовать без изменений, а system calls обычно специфичны для ОС.</li>
  <li><b>Ease of Use</b> — документация и библиотеки, дополнительные возможности (error handling, data validation), которых нет у raw system calls.</li>
</ul>
<p><b>Why Applications are OS Specific</b>: приложение, скомпилированное на одной системе, обычно не исполняется на другой ОС — у каждой ОС свои уникальные system calls, свои форматы файлов и т. п.</p>
<p>Самые распространённые API:</p>
<table class="t">
  <tr><th>API</th><th>Где</th></tr>
  <tr><td><b>Win32 API</b></td><td>Windows</td></tr>
  <tr><td><b>POSIX API</b></td><td>POSIX-based системы: практически все версии UNIX, Linux, Mac OS X</td></tr>
  <tr><td><b>Java API</b></td><td>Java virtual machine (<b>JVM</b>)</td></tr>
</table>
<p><b>API endpoint</b> — цифровое место, где API принимает вызовы (<b>API requests</b>) к ресурсам на своём сервере. REST API: client шлёт GET / POST / PUT / DELETE, получает JSON / XML; REST API обращается к database.</p>
<table class="t">
  <tr><th colspan="7">RESTful endpoint: http://localhost:1234/hrservices/v1/users/{id}</th></tr>
  <tr><td>http</td><td>localhost</td><td>1234</td><td>hrservices</td><td>v1</td><td>users</td><td>{id}</td></tr>
  <tr><td><b>PROTOCOL</b></td><td><b>HOST</b> (domain name)</td><td><b>PORT</b></td><td><b>APPLICATION CONTEXT</b></td><td><b>VERSION</b></td><td><b>RESOURCE</b></td><td><b>PARAMETER</b></td></tr>
</table>`,
      exam: 'Три преимущества API (abstraction, portability, ease of use); почему приложения OS-specific; Win32 / POSIX / Java API; части RESTful endpoint.'
    },
    {
      id: 'posix',
      h: 'POSIX — The Portable Operating System Interface',
      html: `
<ul>
  <li><b>POSIX</b> — семейство стандартов <b>IEEE</b> для совместимости ПО между ОС, особенно между вариантами Unix.</li>
  <li>Определяет:
    <ul>
      <li><b>API</b> (например, <b>POSIX C library</b> для языка C);</li>
      <li><b>command line interface</b> для shells (<b>bash</b> и <b>dash</b> — последний строже следует POSIX);</li>
      <li>базовые команды: <code>grep</code>, <code>sed</code>, <code>awk</code>, <code>cat</code> и др.</li>
    </ul>
  </li>
  <li>Код, использующий только стандартные библиотеки и POSIX (и только синтаксис стандарта), компилируется <b>на всех Unix-системах</b>.</li>
</ul>
<div data-viz="0"></div>
<p>Примеры заголовков <b>C POSIX library</b>:</p>
<table class="t">
  <tr><th>Header</th><th>Description</th></tr>
  <tr><td><code>&lt;aio.h&gt;</code></td><td>asynchronous input and output</td></tr>
  <tr><td><code>&lt;arpa/inet.h&gt;</code></td><td>функции для числовых IP-адресов (Berkeley sockets)</td></tr>
  <tr><td><code>&lt;assert.h&gt;</code></td><td>verify assumptions</td></tr>
  <tr><td><code>&lt;ctype.h&gt;</code></td><td>character types</td></tr>
  <tr><td><code>&lt;dirent.h&gt;</code></td><td>открытие и листинг directories</td></tr>
  <tr><td><code>&lt;dlfcn.h&gt;</code></td><td>dynamic linking</td></tr>
  <tr><td><code>&lt;errno.h&gt;</code></td><td>retrieving error number</td></tr>
  <tr><td><code>&lt;fcntl.h&gt;</code></td><td>file opening, locking и другие операции</td></tr>
  <tr><td><code>&lt;fnmatch.h&gt;</code> / <code>&lt;glob.h&gt;</code></td><td>filename matching / pathname «globbing»</td></tr>
  <tr><td><code>&lt;ftw.h&gt;</code></td><td>file tree traversal</td></tr>
  <tr><td><code>&lt;grp.h&gt;</code></td><td>user group information and control</td></tr>
  <tr><td><code>&lt;inttypes.h&gt;</code></td><td>fixed size integer types</td></tr>
</table>`,
      viz: [{ name: 'graph', caption: 'Portable — та часть C-программы, что использует только C Standard Library и POSIX Library', props: { w: 600, h: 300,
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
      exam: 'Кто задаёт POSIX (IEEE); что POSIX определяет (API, CLI shells, базовые команды); почему POSIX-код переносим между Unix.'
    },
    {
      id: 'system-services',
      h: 'System Services (system programs)',
      html: `
<p><b>System services</b> дают удобную среду для разработки и выполнения программ. Одни — просто пользовательский интерфейс к system calls, другие значительно сложнее.</p>
<table class="t">
  <tr><th>Категория</th><th>Что делают</th></tr>
  <tr><td><b>File management</b></td><td>create, delete, copy, rename, print, dump, list и вообще манипуляции файлами и каталогами</td></tr>
  <tr><td><b>Status information</b></td><td>дата, время, свободная память, место на диске, число пользователей; подробная performance, logging, debugging информация; вывод на терминал/устройства; в некоторых системах — <b>registry</b> для хранения и получения конфигурации (status information иногда хранится в файле)</td></tr>
  <tr><td><b>Programming-language support</b></td><td>compilers, assemblers, debuggers, interpreters</td></tr>
  <tr><td><b>Program loading and execution</b></td><td>absolute loaders, relocatable loaders, linkage editors, overlay-loaders, debugging systems для high-level и machine language</td></tr>
  <tr><td><b>Communications</b></td><td>виртуальные соединения между процессами, пользователями, компьютерами: сообщения на экраны, web, e-mail, remote login, передача файлов</td></tr>
  <tr><td><b>Background services</b></td><td>запускаются при загрузке (одни только для старта системы, другие — от boot до shutdown); disk checking, process scheduling, error logging, printing; работают в <b>user context, не в kernel context</b>; называются <b>services</b>, <b>subsystems</b>, <b>daemons</b></td></tr>
  <tr><td><b>Application programs</b></td><td>не относятся к системе; запускаются пользователями (command line, mouse click, finger poke); обычно не считаются частью ОС</td></tr>
</table>`,
      exam: 'Категории system services; background services = daemons в user context; registry.'
    },
    {
      id: 'linkers',
      h: 'Linkers and Loaders, Assembler',
      html: `
<ul>
  <li>Source code компилируется в object files, которые можно загрузить в <b>любое</b> место физической памяти — <b>relocatable object file</b>.</li>
  <li><b>Linker</b> объединяет их в один binary <b>executable file</b>; также подключает libraries.</li>
  <li>Программа лежит на secondary storage как binary executable; для выполнения её должен загрузить в память <b>loader</b>.</li>
  <li><b>Relocation</b> назначает частям программы окончательные адреса и подгоняет код и данные под эти адреса.</li>
  <li>Object и executable files имеют стандартные форматы — ОС знает, как их загрузить и запустить.</li>
</ul>
<pre class="code" data-lang="bash">gcc -c main.c            # compiler: main.c → main.o (object file)
gcc -o main main.o -lm   # linker: main.o + other object files + libm → main
./main                   # loader: executable → program in memory (+ dynamically linked libraries)</pre>
<div data-viz="0"></div>
<p><b>The Assembler</b>: Compiler генерирует <b>assembly code</b> → <b>Assembler</b> переводит его в <b>machine code</b> и сохраняет в <b>object file</b> (двоичное представление программы) → Linker связывает все libraries → Loader загружает всё в память.</p>
<div data-viz="1"></div>`,
      viz: [
        { name: 'flow', caption: 'The Role of the Linker and Loader', props: { dir: 'v', steps: [
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
      exam: 'Что делает каждая команда gcc; relocatable object file; relocation; роль assembler.'
    },
    {
      id: 'static-dynamic',
      h: 'Static vs Dynamic Linking',
      html: `
<ul>
  <li>Современные general purpose системы <b>не</b> вкомпоновывают библиотеки в executables.</li>
  <li>Вместо этого <b>dynamically linked libraries</b> (в Windows — <b>DLLs</b>) загружаются <b>по необходимости</b> и <b>разделяются</b> всеми программами, использующими ту же версию библиотеки (загружается один раз).</li>
</ul>
<table class="t">
  <tr><th>Static Linking</th><th>Dynamic Linking</th></tr>
  <tr><td>копирует все нужные библиотеки прямо в итоговый executable</td><td>external/shared libraries подключаются по имени в момент run time</td></tr>
  <tr><td>упрощает распространение бинарников на разные среды/ОС</td><td>ниже затраты на сопровождение и поддержку</td></tr>
  <tr><td>немного быстрее start-up</td><td>можно обновлять рутины библиотек <b>без relink</b></td></tr>
  <tr><td>программы гораздо больше, используют много ресурсов</td><td><b>меньший размер</b> файлов</td></tr>
  <tr><td>изменения во внешних программах не отражаются в executable автоматически</td><td>изменения библиотеки могут дать <b>compatibility issues</b></td></tr>
</table>`,
      viz: [{ name: 'graph', caption: 'Static: у каждого приложения своя копия · Dynamic: одна библиотека на всех', props: { w: 600, h: 200,
        nodes: [
          { id: 's1', label: 'Static Library', x: 75, y: 45, tone: 'ok' }, { id: 's2', label: 'Static Library', x: 215, y: 45, tone: 'ok' },
          { id: 'a1', label: 'Application A', x: 75, y: 160, tone: 'muted' }, { id: 'b1', label: 'Application B', x: 215, y: 160, tone: 'muted' },
          { id: 'd', label: 'Dynamic Library', x: 455, y: 45, w: 130, tone: 'acc' },
          { id: 'a2', label: 'Application A', x: 385, y: 160, tone: 'muted' }, { id: 'b2', label: 'Application B', x: 525, y: 160, tone: 'muted' }],
        edges: [
          { from: 's1', to: 'a1' }, { from: 's2', to: 'b1' },
          { from: 'd', to: 'a2' }, { from: 'd', to: 'b2' }] } }],
      exam: 'Свойства static vs dynamic linking (размер, start-up, обновление без relink, compatibility issues); DLL.'
    },
    {
      id: 'building',
      h: 'Building and Booting an OS; Building Linux',
      html: `
<ul>
  <li>ОС обычно проектируется для <b>класса</b> систем с разной периферией; обычно уже установлена на купленном компьютере, но можно собрать и установить другую.</li>
  <li>Генерация ОС с нуля: написать source code → <b>configure</b> под систему → <b>compile</b> → <b>install</b> → <b>boot</b> компьютер с новой ОС.</li>
</ul>
<p><b>Building and Booting Linux</b>:</p>
<pre class="code" data-lang="bash"># 1. скачать исходники ядра с http://www.kernel.org
make menuconfig       # 2. configure kernel
make                  # 3. compile kernel → vmlinuz (kernel image)
make modules          # 4. compile kernel modules
make modules_install  # 5. install kernel modules (в vmlinuz — по слайду)
make install          # 6. install new kernel on the system</pre>`,
      viz: [{ name: 'flow', caption: 'Сборка ядра Linux', props: { dir: 'h', steps: [
        { label: 'kernel.org', sub: 'download source', tone: 'muted' },
        { label: 'make menuconfig', sub: 'configure', tone: 'c2' },
        { label: 'make', sub: 'compile → vmlinuz', tone: 'acc' },
        { label: 'make modules', sub: '+ modules_install', tone: 'c3' },
        { label: 'make install', sub: 'install kernel', tone: 'ok' }] } }],
      exam: 'Какая команда что делает; vmlinuz — kernel image, получается после make.'
    },
    {
      id: 'boot',
      h: 'System Boot',
      html: `
<ul>
  <li>При включении питания выполнение начинается с <b>фиксированного адреса памяти</b>.</li>
  <li>ОС должна быть доступна hardware, чтобы hardware мог её запустить.</li>
  <li>Небольшой код — <b>bootstrap loader</b>, <b>BIOS</b>, хранится в <b>ROM</b> или <b>EEPROM</b>: находит kernel, загружает в память и запускает.</li>
  <li>Иногда <b>двухшаговый</b> процесс: ROM-код загружает <b>boot block</b> с фиксированного места, а тот загружает bootstrap loader с диска.</li>
  <li>Современные системы заменяют BIOS на <b>UEFI</b> (Unified Extensible Firmware Interface).</li>
  <li>Распространённый bootstrap loader <b>GRUB</b> позволяет выбрать kernel с нескольких дисков, версии, kernel options.</li>
  <li>Kernel загружается — система работает. Boot loaders часто позволяют разные boot states, например <b>single user mode</b>.</li>
</ul>`,
      viz: [{ name: 'flow', caption: 'System boot', props: { dir: 'h', steps: [
        { label: 'Power on', sub: 'fixed memory location', tone: 'muted' },
        { label: 'BIOS / UEFI', sub: 'ROM / EEPROM', tone: 'warn' },
        { label: 'boot block → bootstrap loader', sub: 'GRUB', tone: 'c2' },
        { label: 'kernel loaded', sub: 'system running', tone: 'ok' }] } }],
      exam: 'Где хранится bootstrap loader (ROM/EEPROM); двухшаговая загрузка через boot block; UEFI вместо BIOS; что умеет GRUB.'
    },
    {
      id: 'debugging',
      h: 'Operating-System Debugging, Performance Tuning, Tracing',
      html: `
<ul>
  <li><b>Debugging</b> — поиск и исправление ошибок (<b>bugs</b>); также <b>performance tuning</b>.</li>
  <li>ОС пишет <b>log files</b> с информацией об ошибках.</li>
  <li>Сбой приложения → <b>core dump</b> — файл с памятью <b>процесса</b>.</li>
  <li>Сбой ОС → <b>crash dump</b> — файл с памятью <b>ядра</b>.</li>
  <li>Performance tuning — иногда через <b>trace listings</b> активности, записанные для анализа.</li>
  <li><b>Profiling</b> — периодическая выборка <b>instruction pointer</b> для поиска статистических тенденций.</li>
</ul>
<div class="callout note"><b>Kernighan’s Law</b>: отлаживать вдвое сложнее, чем писать код; поэтому код, написанный «на пределе хитрости», автор по определению не сможет отладить.</div>
<p><b>Performance Tuning</b>: улучшение производительности устранением <b>bottlenecks</b>; ОС должна уметь вычислять и показывать метрики поведения системы — например, программа <code>top</code> или Windows <b>Task Manager</b>.</p>
<p><b>Tracing</b> — сбор данных о конкретном событии, например о шагах вызова system call.</p>
<table class="t">
  <tr><th>Tool</th><th>Назначение</th></tr>
  <tr><td><code>strace</code></td><td>trace system calls, вызываемых процессом</td></tr>
  <tr><td><code>gdb</code></td><td>source-level debugger</td></tr>
  <tr><td><code>perf</code></td><td>набор Linux performance tools</td></tr>
  <tr><td><code>tcpdump</code></td><td>сбор network packets</td></tr>
</table>`,
      exam: 'Core dump (процесс) vs crash dump (ядро); profiling; какой инструмент что делает (strace, gdb, perf, tcpdump).'
    },
    {
      id: 'monolithic',
      h: 'OS Structure: Monolithic — original UNIX, Linux',
      html: `
<p>General-purpose ОС — очень большая программа. Способы структурирования: <b>Monolithic</b> (UNIX), <b>Layered</b> (абстракция), <b>Microkernel</b> (Mach).</p>
<p><b>Monolithic Structure – Original UNIX</b>:</p>
<ul>
  <li>Ограниченный функционал hardware → ограниченное структурирование.</li>
  <li>Две отделимые части: <b>systems programs</b> и <b>the kernel</b>.</li>
  <li><b>Kernel</b> — всё, что <b>ниже system-call interface и выше physical hardware</b>.</li>
  <li>Даёт file system, CPU scheduling, memory management и другие функции ОС — <b>огромное число функций на одном уровне</b>.</li>
</ul>
<p><b>Traditional UNIX System Structure</b> — «beyond simple but not fully layered»:</p>
<div data-viz="0"></div>
<p><b>Linux System Structure</b> — <b>monolithic plus modular design</b>:</p>
<div data-viz="1"></div>`,
      viz: [
        { name: 'layers', caption: 'Traditional UNIX: kernel между двумя интерфейсами', props: { layers: [
          { label: '(the users)', tone: 'muted' },
          { label: 'shells and commands · compilers and interpreters · system libraries', tone: 'c2' },
          { label: 'system-call interface to the kernel', tone: 'warn' },
          { label: 'kernel', sub: 'signals, terminal handling, character I/O, terminal drivers · file system, swapping, block I/O, disk and tape drivers · CPU scheduling, page replacement, demand paging, virtual memory', tone: 'acc' },
          { label: 'kernel interface to the hardware', tone: 'warn' },
          { label: 'terminal controllers, terminals · device controllers, disks and tapes · memory controllers, physical memory', tone: 'muted' }] } },
        { name: 'layers', caption: 'Linux System Structure', props: { layers: [
          { label: 'applications', sub: '+ glibc standard c library', tone: 'c2' },
          { label: 'system-call interface', tone: 'warn' },
          { label: 'file systems · CPU scheduler · networks (TCP/IP) · memory manager · block devices · character devices', tone: 'acc' },
          { label: 'device drivers', tone: 'c3' },
          { label: 'hardware', tone: 'muted' }] } }
      ],
      exam: 'Что входит в kernel original UNIX (между system-call interface и hardware); Linux = monolithic + modular.'
    },
    {
      id: 'layered',
      h: 'Layered Approach',
      html: `
<ul>
  <li>ОС разделена на несколько <b>layers</b> (levels), каждый построен поверх нижних.</li>
  <li>Нижний слой (<b>layer 0</b>) — <b>hardware</b>; верхний (<b>layer N</b>) — <b>user interface</b>.</li>
  <li>С модульностью слои выбираются так, что каждый использует функции (operations) и сервисы <b>только нижележащих</b> слоёв.</li>
</ul>`,
      viz: [{ name: 'layers', caption: 'Layered Approach (на слайде — концентрические кольца)', props: { layers: [
        { label: 'layer N', sub: 'user interface', tone: 'c2' },
        { label: '…', tone: 'muted' },
        { label: 'layer 1', tone: 'acc' },
        { label: 'layer 0', sub: 'hardware', tone: 'muted' }] } }],
      exam: 'Layer 0 = hardware, layer N = user interface; каждый слой пользуется только нижними.'
    },
    {
      id: 'microkernel',
      h: 'Microkernels; Microkernel vs Monolithic',
      html: `
<ul>
  <li>Переносит <b>как можно больше</b> из kernel в <b>user space</b>.</li>
  <li><b>Mach</b> — пример microkernel; ядро Mac OS X (<b>Darwin</b>) частично основано на Mach.</li>
  <li>Модули в user space общаются через <b>message passing</b>.</li>
</ul>
<div class="cols">
  <div class="pros"><b>+</b><ul><li>легче расширять</li><li>легче портировать на новые архитектуры</li><li>надёжнее (меньше кода в kernel mode)</li><li>безопаснее</li></ul></div>
  <div class="cons"><b>−</b><ul><li><b>performance overhead</b> на коммуникацию user space ↔ kernel space</li></ul></div>
</div>
<p><b>Microkernel System Structure</b>: в user mode — application program, file system, device driver (общаются <b>messages</b>); в kernel mode — microkernel: interprocess communication, memory management, CPU scheduling; ниже — hardware.</p>
<div data-viz="0"></div>
<table class="t">
  <tr><th></th><th>Microkernel</th><th>Monolithic kernel</th></tr>
  <tr><td>User space</td><td>Application, Application IPC, Unix Server, Device Driver, File Server</td><td>Application</td></tr>
  <tr><td>Kernel space</td><td>Basic IPC, Virtual Memory, Scheduling</td><td>VFS, System calls; IPC, File System; Scheduler, Virtual Memory; Device Drivers, Dispatcher</td></tr>
</table>`,
      viz: [{ name: 'graph', caption: 'Microkernel System Structure: сервисы — процессы user mode, общение сообщениями через microkernel', props: { w: 600, h: 290,
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
      exam: '4 преимущества и главный недостаток microkernel; что остаётся в microkernel (IPC, memory mgmt, CPU scheduling); Mach/Darwin.'
    },
    {
      id: 'modules',
      h: 'Modules — Loadable Kernel Modules (LKMs)',
      html: `
<ul>
  <li>Многие современные ОС реализуют <b>loadable kernel modules (LKMs)</b>.</li>
  <li><b>Object-oriented</b> подход: каждый core component отдельный.</li>
  <li>Компоненты общаются через <b>known interfaces</b>.</li>
  <li>Каждый загружается <b>по необходимости внутри kernel</b>.</li>
  <li>В целом похоже на layers, но <b>гибче</b>. Примеры: <b>Linux</b>, <b>Solaris</b>.</li>
</ul>`,
      exam: 'Свойства LKM и отличие от layered (гибче: любой модуль может звать любой через интерфейсы).'
    },
    {
      id: 'hybrid',
      h: 'Hybrid Systems и сводка структур',
      html: `
<ul>
  <li>Большинство современных ОС — <b>не одна чистая модель</b>.</li>
  <li><b>Hybrid</b> комбинирует подходы ради performance, security, usability.</li>
  <li><b>Linux и Solaris</b>: kernel в kernel address space → <b>monolithic</b>, плюс <b>modular</b> для динамической загрузки функциональности.</li>
  <li><b>Windows</b>: в основном <b>monolithic</b>, плюс <b>microkernel</b> для разных subsystem <b>personalities</b>.</li>
  <li><b>Apple Mac OS X</b>: hybrid, layered; <b>Aqua</b> UI + <b>Cocoa</b> programming environment; ниже — kernel из <b>Mach</b> microkernel и частей <b>BSD Unix</b>, плюс <b>I/O kit</b> и динамически загружаемые модули (<b>kernel extensions</b>).</li>
</ul>
<table class="t">
  <tr><th>Структура</th><th>Идея</th><th>Пример</th></tr>
  <tr><td><b>Monolithic</b></td><td>всё ниже system-call interface — одно ядро</td><td>original UNIX</td></tr>
  <tr><td><b>Layered</b></td><td>layer 0 hardware … layer N UI; каждый слой — только нижние</td><td>абстракция</td></tr>
  <tr><td><b>Microkernel</b></td><td>минимум в ядре, сервисы в user space, message passing</td><td>Mach, Darwin (частично)</td></tr>
  <tr><td><b>Modules (LKM)</b></td><td>core components загружаются в ядро по необходимости через known interfaces</td><td>Linux, Solaris</td></tr>
  <tr><td><b>Hybrid</b></td><td>комбинация подходов</td><td>Linux/Solaris, Windows, Mac OS X</td></tr>
</table>`,
      viz: [{ name: 'layers', caption: 'Mac OS X как hybrid', props: { layers: [
        { label: 'Aqua', sub: 'user interface', tone: 'c2' },
        { label: 'Cocoa', sub: 'programming environment', tone: 'c3' },
        { label: 'kernel', sub: 'Mach microkernel + BSD Unix parts', tone: 'acc' },
        { label: 'I/O kit + kernel extensions', sub: 'dynamically loadable modules', tone: 'warn' }] } }],
      exam: 'Как гибридны Linux/Solaris, Windows (personalities), Mac OS X (Mach + BSD, kernel extensions).'
    }
  ],
  terms: [
    { en: 'User goals / System goals', ru: 'Цели пользователя / системы', def: 'User: convenient, easy to learn, reliable, safe, fast. System: easy to design/implement/maintain, flexible, reliable, error-free, efficient.' },
    { en: 'Logging (accounting)', ru: 'Учёт', def: 'Сервис ОС: отслеживать, какие пользователи сколько и каких ресурсов используют.' },
    { en: 'CLI', ru: 'Интерфейс командной строки', def: 'Command-Line Interface: прямой ввод команд; позволяет автоматизацию (bash scripts).' },
    { en: 'Shell', ru: 'Командная оболочка', def: 'Вариант command interpreter: получает команду от пользователя и выполняет её.' },
    { en: 'Bourne Shell', ru: 'Bourne shell', def: 'Оригинальный Unix shell.' },
    { en: 'WSL', ru: 'Windows Subsystem for Linux', def: 'Позволяет установить Linux distribution и использовать Linux-утилиты и Bash прямо в Windows.' },
    { en: 'PowerShell', ru: 'PowerShell', def: 'Более сложная версия Windows command prompt со скриптовым языком для администрирования.' },
    { en: 'System call', ru: 'Системный вызов', def: 'Интерфейс между программой в user space и ОС для запроса сервисов ядра.' },
    { en: 'System-call interface', ru: 'Интерфейс системных вызовов', def: 'Хранит таблицу, индексированную номерами system calls; вызывает нужный и возвращает status и значения.' },
    { en: 'Run-time support library', ru: 'Библиотека поддержки выполнения', def: 'Функции в библиотеках компилятора, скрывающие детали интерфейса ОС.' },
    { en: 'Parameter passing via table', ru: 'Передача параметров через таблицу', def: 'Параметры в блоке памяти, адрес блока — в регистре (Linux, Solaris); не ограничивает число параметров.' },
    { en: 'API', ru: 'Программный интерфейс приложений', def: 'Набор функций для создания приложений, использующих возможности ОС/сервиса (Win32, POSIX, Java API).' },
    { en: 'API endpoint', ru: 'Конечная точка API', def: 'Цифровое место, где API принимает API requests к ресурсам своего сервера.' },
    { en: 'POSIX', ru: 'Portable Operating System Interface', def: 'Семейство стандартов IEEE: API (POSIX C library), CLI shells и базовые команды для совместимости Unix-систем.' },
    { en: 'Standard C library', ru: 'Стандартная библиотека C', def: 'Даёт часть system-call interface: printf() → write().' },
    { en: 'Daemon', ru: 'Демон', def: 'Background service: стартует при загрузке, работает в user context, не в kernel context.' },
    { en: 'Registry', ru: 'Реестр', def: 'Хранилище конфигурационной информации в некоторых системах.' },
    { en: 'Relocatable object file', ru: 'Перемещаемый объектный файл', def: 'Object file, который можно загрузить в любое место физической памяти.' },
    { en: 'Linker', ru: 'Компоновщик', def: 'Объединяет object files и libraries в один executable file.' },
    { en: 'Loader', ru: 'Загрузчик', def: 'Загружает binary executable с secondary storage в память для выполнения.' },
    { en: 'Relocation', ru: 'Перемещение', def: 'Назначение окончательных адресов частям программы и подгонка кода и данных под них.' },
    { en: 'Assembler', ru: 'Ассемблер', def: 'Переводит assembly code в machine code и сохраняет в object file.' },
    { en: 'Dynamic linking (DLL)', ru: 'Динамическая компоновка', def: 'Библиотеки загружаются при необходимости и разделяются всеми программами той же версии.' },
    { en: 'vmlinuz', ru: 'Образ ядра Linux', def: 'Kernel image, получаемый командой make.' },
    { en: 'Bootstrap loader', ru: 'Начальный загрузчик', def: 'Код в ROM/EEPROM (BIOS), находящий kernel, загружающий его в память и запускающий.' },
    { en: 'UEFI', ru: 'Unified Extensible Firmware Interface', def: 'Современная замена BIOS.' },
    { en: 'GRUB', ru: 'GRUB', def: 'Bootstrap loader: выбор kernel с разных дисков, версий, kernel options.' },
    { en: 'Core dump / Crash dump', ru: 'Дамп процесса / ядра', def: 'Core dump — память процесса при сбое приложения; crash dump — память ядра при сбое ОС.' },
    { en: 'Profiling', ru: 'Профилирование', def: 'Периодическая выборка instruction pointer для поиска статистических тенденций.' },
    { en: 'strace', ru: 'strace', def: 'Трассировка system calls, вызываемых процессом.' },
    { en: 'Monolithic kernel', ru: 'Монолитное ядро', def: 'Всё ниже system-call interface и выше hardware — в одном уровне (original UNIX).' },
    { en: 'Layered approach', ru: 'Многоуровневый подход', def: 'Слои от layer 0 (hardware) до layer N (UI); каждый использует только нижние.' },
    { en: 'Microkernel', ru: 'Микроядро', def: 'Максимум функций вынесен в user space, общение message passing (Mach).' },
    { en: 'LKM', ru: 'Загружаемый модуль ядра', def: 'Loadable kernel module: отдельный компонент, загружаемый в ядро по необходимости через known interfaces.' },
    { en: 'Hybrid system', ru: 'Гибридная система', def: 'Комбинация monolithic, microkernel, modules (Linux, Windows, Mac OS X).' }
  ],
  questions: [
    { id: 'svc-01', type: 'multi', q: 'Какие требования относятся к System goals (а не User goals)? (несколько ответов)', options: ['Error-free and efficient', 'Easy to learn', 'Convenient to use', 'Easy to design and implement', 'Easy to maintain'], answer: [0, 3, 4], explain: 'Easy to learn и convenient to use — user goals. System goals: лёгкость проектирования/реализации/сопровождения, flexible, reliable, error-free, efficient.', section: 'design', diff: 2 },
    { id: 'svc-02', type: 'multi', q: 'Какие сервисы ОС предназначены для эффективной работы самой системы? (несколько ответов)', options: ['Resource allocation', 'Logging (accounting)', 'Protection and security', 'User interface', 'File-system manipulation'], answer: [0, 1, 2], explain: 'UI и file-system manipulation — сервисы для пользователя.', section: 'services', diff: 2 },
    { id: 'svc-03', type: 'single', q: 'Через что может происходить сервис Communications между процессами?', options: ['Только через сигналы', 'Только через device-status table', 'Shared memory или message passing', 'Только через файлы'], answer: 2, explain: 'По слайду: communications may be via shared memory or through message passing (packets moved by the OS).', section: 'services', diff: 1 },
    { id: 'svc-04', type: 'single', q: 'Где был изобретён GUI?', options: ['Bell Labs', 'Xerox PARC', 'Apple', 'Microsoft'], answer: 1, explain: 'Слайд User Operating System Interface — GUI: «Invented at Xerox PARC».', section: 'gui', diff: 1 },
    { id: 'svc-05', type: 'multi', q: 'Почему CLI полезен (по слайду)? (несколько ответов)', options: ['CLI всегда проще освоить новичку', 'Прямой доступ к функциям ОС', 'GUI может не использовать все доступные команды', 'Команды можно автоматизировать (bash scripts)', 'У системы может не хватать ресурсов для графики'], answer: [1, 2, 3, 4], explain: 'Четыре причины со слайда. Простота для новичка — аргумент GUI, а не CLI.', section: 'cli', diff: 2 },
    { id: 'svc-06', type: 'code', q: 'Default shell пользователя — bash. Он запускает sh. Что выведет последняя команда?', lang: 'bash', code: '$ echo $SHELL\n/bin/bash\n$ sh\n$ echo $0', options: ['/bin/bash', 'bash', '/etc/shells', 'sh'], answer: 3, explain: '$0 — текущий shell (запущен как sh), $SHELL — default login shell, он остаётся /bin/bash.', section: 'cli', diff: 3 },
    { id: 'svc-07', type: 'single', q: 'Какой файл содержит пути ко всем valid login shells системы?', options: ['/bin/sh', '/etc/profile', '/etc/shells', '/etc/passwd'], answer: 2, explain: 'По слайду Shell in Unix/Linux: список допустимых login shells — в /etc/shells.', section: 'cli', diff: 1 },
    { id: 'svc-08', type: 'single', q: 'Как system-call interface находит нужный системный вызов?', options: ['Через interrupt vector устройства', 'С каждым вызовом связан номер; интерфейс хранит таблицу, индексированную номерами', 'Ищет функцию по имени в /etc', 'По значению program counter вызывающего'], answer: 1, explain: 'Typically a number is associated with each system call; system-call interface maintains a table indexed by these numbers.', section: 'syscalls', diff: 2 },
    { id: 'svc-09', type: 'code', q: 'Файл in.txt существует и имеет размер 10000 байт. Сколько раз будет вызван read()?', lang: 'c', code: 'char buf[4096];\nint in  = open("in.txt", O_RDONLY);\nint out = creat("out.txt", 0644);\nssize_t n;\nwhile ((n = read(in, buf, 4096)) > 0)\n    write(out, buf, n);\nclose(in);\nclose(out);', options: ['4', '5', '2', '3'], answer: 0, explain: 'read вернёт 4096, 4096, 1808 и затем 0 (EOF) — 4 вызова; write выполнится 3 раза. Это цикл «read until read fails» из примера копирования.', section: 'syscalls', diff: 3 },
    { id: 'svc-10', type: 'single', q: 'Какой метод передачи параметров system call, по слайду, используют Linux и Solaris?', options: ['Только регистры', 'Только стек', 'Переменные окружения', 'Параметры в блоке (таблице) памяти, адрес блока — в регистре'], answer: 3, explain: '«Parameters stored in a block, or table, in memory, and address of block passed as a parameter in a register — this approach taken by Linux and Solaris».', section: 'params', diff: 2 },
    { id: 'svc-11', type: 'multi', q: 'Какие методы передачи параметров не ограничивают их число и длину? (несколько ответов)', options: ['Stack', 'Registers', 'Block (table) in memory'], answer: [0, 2], explain: 'Регистров ограниченное число; block и stack методы не ограничивают number or length of parameters.', section: 'params', diff: 2 },
    { id: 'svc-12', type: 'single', q: 'К какому типу system calls слайд относит «locks for managing access to shared data between processes»?', options: ['Information maintenance', 'Process control', 'Communications', 'Protection'], answer: 1, explain: 'Locks перечислены в группе Process control (вместе с dump memory и debugger).', section: 'types', diff: 3 },
    { id: 'svc-13', type: 'single', q: 'Какой Unix system call соответствует Windows CreateProcess()?', options: ['fork()', 'exec()', 'open()', 'pipe()'], answer: 0, explain: 'Таблица Windows ↔ Unix: CreateProcess ↔ fork, ExitProcess ↔ exit, WaitForSingleObject ↔ wait.', section: 'types', diff: 1 },
    { id: 'svc-14', type: 'multi', q: 'Какие Unix-вызовы в таблице относятся к Protection? (несколько ответов)', options: ['umask()', 'chown()', 'mmap()', 'alarm()', 'chmod()'], answer: [0, 1, 4], explain: 'Protection: chmod, umask, chown. mmap — communications, alarm — information maintenance.', section: 'types', diff: 3 },
    { id: 'svc-15', type: 'code', q: 'Какой system call в итоге выполнит стандартная C library, чтобы вывести строку?', lang: 'c', code: '#include <stdio.h>\nint main()\n{\n    printf("Greetings");\n    return 0;\n}', options: ['open()', 'read()', 'write()', 'printf()'], answer: 2, explain: 'printf() — library call; C library перехватывает его и вызывает system call write().', section: 'clib', diff: 1 },
    { id: 'svc-16', type: 'code', q: 'Файл empty.txt существует и имеет размер 0 байт. Что напечатает программа?', lang: 'c', code: 'char buf[100];\nint fd = open("empty.txt", O_RDONLY);\nssize_t n = read(fd, buf, sizeof(buf));\nprintf("%zd\\n", n);', options: ['1', '0', '-1', '100'], answer: 1, explain: 'По описанию API read(): 0 означает end of file. −1 было бы при ошибке, а файл открыт успешно.', section: 'clib', diff: 2 },
    { id: 'svc-17', type: 'code', q: 'Файл in.txt существует. Что напечатает программа?', lang: 'c', code: 'char buf[16];\nint fd = open("in.txt", O_RDONLY);\nclose(fd);\nssize_t n = read(fd, buf, 16);\nprintf("%zd\\n", n);', options: ['-1', '0', '16', 'Ошибка компиляции'], answer: 0, explain: 'Дескриптор уже закрыт → read() завершается ошибкой и возвращает −1 (0 — только при end of file).', section: 'clib', diff: 3 },
    { id: 'svc-18', type: 'multi', q: 'Какие преимущества API перед raw system calls названы на слайде? (несколько ответов)', options: ['Всегда работает быстрее system call', 'Не требует ядра ОС', 'Abstraction', 'Portability', 'Ease of Use'], answer: [2, 3, 4], explain: 'Abstraction, Portability, Ease of Use. API в итоге сам вызывает system calls, поэтому не «быстрее» и не обходится без ядра.', section: 'api', diff: 2 },
    { id: 'svc-19', type: 'single', q: 'Что означает часть «v1» в RESTful endpoint http://localhost:1234/hrservices/v1/users/{id}?', options: ['APPLICATION CONTEXT', 'PORT', 'VERSION', 'RESOURCE'], answer: 2, explain: 'http — protocol, localhost — host, 1234 — port, hrservices — application context, v1 — version, users — resource, {id} — parameter.', section: 'api', diff: 2 },
    { id: 'svc-20', type: 'tf', q: 'Приложение, скомпилированное на одной ОС, обычно не исполняется на другой, потому что каждая ОС предоставляет свои уникальные system calls и форматы файлов.', answer: true, explain: 'Слайд Why Applications are Operating System Specific.', section: 'api', diff: 2 },
    { id: 'svc-21', type: 'multi', q: 'Что определяет POSIX? (несколько ответов)', options: ['Базовые команды (grep, sed, awk, cat)', 'Графический интерфейс рабочего стола', 'Формат DLL в Windows', 'API (например, POSIX C library)', 'Command line interface для shells (bash, dash)'], answer: [0, 3, 4], explain: 'POSIX (стандарт IEEE) задаёт API, CLI для shells и фундаментальные команды; GUI и DLL — не его область.', section: 'posix', diff: 2 },
    { id: 'svc-22', type: 'single', q: 'Что верно для Background services?', options: ['Работают в kernel context', 'Запускаются только пользователем по клику мыши', 'Являются частью ядра ОС', 'Запускаются при загрузке и работают в user context, а не kernel context; называются services, subsystems, daemons'], answer: 3, explain: 'Слайд System Services: background services run in user context not kernel context; known as daemons.', section: 'system-services', diff: 2 },
    { id: 'svc-23', type: 'code', q: 'Какой компонент выполняет работу во второй строке?', lang: 'bash', code: 'gcc -c main.c\ngcc -o main main.o -lm\n./main', options: ['Loader', 'Assembler', 'Linker', 'Compiler'], answer: 2, explain: 'Строка 1 — compiler (main.o), строка 2 — linker (main.o + libm → executable main), строка 3 — loader.', section: 'linkers', diff: 2 },
    { id: 'svc-24', type: 'single', q: 'Что делает assembler?', options: ['Загружает программу в память', 'Переводит assembly code в machine code и сохраняет в object file', 'Генерирует assembly code из source code', 'Связывает все libraries'], answer: 1, explain: 'Compiler → assembly code, assembler → machine code (object file), linker → libraries, loader → память.', section: 'linkers', diff: 1 },
    { id: 'svc-25', type: 'single', q: 'Какое свойство относится к dynamic linking?', options: ['Библиотеку можно обновить без relink, файлы меньше, но возможны compatibility issues', 'Все библиотеки копируются в executable', 'Немного более быстрый start-up', 'Изменения во внешних библиотеках никогда не влияют на программу'], answer: 0, explain: 'Копирование библиотек и более быстрый start-up — свойства static linking.', section: 'static-dynamic', diff: 2 },
    { id: 'svc-26', type: 'single', q: 'Какая команда при сборке Linux компилирует ядро и создаёт kernel image vmlinuz?', options: ['make menuconfig', 'make modules_install', 'make install', 'make'], answer: 3, explain: 'menuconfig — конфигурация, make — компиляция (vmlinuz), modules_install — установка модулей, install — установка ядра.', section: 'building', diff: 2 },
    { id: 'svc-27', type: 'single', q: 'Чем современные системы заменяют BIOS?', options: ['EEPROM', 'systemd', 'UEFI', 'GRUB'], answer: 2, explain: 'Unified Extensible Firmware Interface. GRUB — bootstrap loader, EEPROM — тип памяти.', section: 'boot', diff: 1 },
    { id: 'svc-28', type: 'single', q: 'GRUB — это…', options: ['loadable kernel module', 'распространённый bootstrap loader, позволяющий выбрать kernel с разных дисков, версии и kernel options', 'firmware, заменяющая BIOS', 'первый процесс ОС'], answer: 1, explain: 'Слайд System Boot: «Common bootstrap loader, GRUB, allows selection of kernel from multiple disks, versions, kernel options».', section: 'boot', diff: 2 },
    { id: 'svc-29', type: 'single', q: 'Чем core dump отличается от crash dump?', options: ['Core dump — память процесса при сбое приложения; crash dump — память ядра при сбое ОС', 'Core dump — память ядра; crash dump — память процесса', 'Core dump — log file; crash dump — trace listing', 'Это синонимы'], answer: 0, explain: 'Failure of an application → core dump (memory of the process); OS failure → crash dump (kernel memory).', section: 'debugging', diff: 2 },
    { id: 'svc-30', type: 'single', q: 'Каким инструментом отследить system calls, которые делает процесс?', options: ['gdb', 'perf', 'tcpdump', 'strace'], answer: 3, explain: 'strace — trace system calls; gdb — source-level debugger; perf — performance tools; tcpdump — network packets.', section: 'debugging', diff: 1 },
    { id: 'svc-31', type: 'single', q: 'Что составляет kernel в original UNIX (monolithic structure)?', options: ['Shells, compilers и system libraries', 'Всё, что выше system-call interface', 'Всё, что ниже system-call interface и выше physical hardware', 'Только CPU scheduler'], answer: 2, explain: 'Kernel — между system-call interface и hardware: file system, CPU scheduling, memory management и др. Shells и libraries — systems programs.', section: 'monolithic', diff: 2 },
    { id: 'svc-32', type: 'single', q: 'Как слайд характеризует структуру Linux?', options: ['Mach + BSD hybrid', 'Monolithic plus modular design', 'Pure microkernel', 'Strictly layered'], answer: 1, explain: 'Linux System Structure: «Monolithic plus modular design». Mach + BSD — это Mac OS X.', section: 'monolithic', diff: 1 },
    { id: 'svc-33', type: 'single', q: 'В layered approach layer 0 — это…', options: ['hardware', 'user interface', 'kernel', 'system-call interface'], answer: 0, explain: 'Bottom layer (layer 0) — hardware, highest (layer N) — user interface.', section: 'layered', diff: 1 },
    { id: 'svc-34', type: 'multi', q: 'Какие преимущества microkernel названы на слайде? (несколько ответов)', options: ['Easier to port to new architectures', 'More reliable (less code in kernel mode)', 'More secure', 'Нет overhead на user ↔ kernel коммуникацию', 'Easier to extend'], answer: [0, 1, 2, 4], explain: 'Overhead user space ↔ kernel space — как раз главный недостаток microkernel.', section: 'microkernel', diff: 2 },
    { id: 'svc-35', type: 'single', q: 'Главный недостаток (detriment) microkernel:', options: ['Сложно портировать', 'Слишком много кода в kernel mode', 'Performance overhead коммуникации user space ↔ kernel space', 'Сложно расширять'], answer: 2, explain: 'Остальные варианты — наоборот, преимущества microkernel.', section: 'microkernel', diff: 1 },
    { id: 'svc-36', type: 'single', q: 'Где в microkernel-системе работают file system и device driver и как они общаются?', options: ['В firmware, через interrupt vector', 'В user mode, через message passing', 'В kernel mode, через прямые вызовы функций', 'В user mode, через общие глобальные переменные ядра'], answer: 1, explain: 'На схеме Microkernel System Structure file system и device driver — в user mode, общаются messages; в microkernel остаются IPC, memory management, CPU scheduling.', section: 'microkernel', diff: 3 },
    { id: 'svc-37', type: 'single', q: 'Что характерно для loadable kernel modules (LKMs)?', options: ['Каждый core component отдельный, общается через known interfaces и загружается в kernel по необходимости', 'Все компоненты скомпилированы в один неделимый образ', 'Модули работают только в user space', 'Каждый слой использует только нижележащий'], answer: 0, explain: 'LKM — object-oriented подход; похоже на layers, но гибче. Последний вариант — описание layered approach.', section: 'modules', diff: 2 },
    { id: 'svc-38', type: 'single', q: 'Как слайд Hybrid Systems описывает Windows?', options: ['Pure microkernel на базе Mach', 'Monolithic plus modular, как Linux', 'Layered с Aqua UI и Cocoa', 'Mostly monolithic, plus microkernel для разных subsystem personalities'], answer: 3, explain: 'Windows — в основном monolithic + microkernel для personalities. Mach/Aqua/Cocoa — Mac OS X; monolithic + modular — Linux/Solaris.', section: 'hybrid', diff: 3 }
  ]
});
