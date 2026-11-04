OS.addModule({
  id: 'linux',
  num: 10,
  group: 'lab',
  title: 'Linux OS — basics',
  titleRu: 'Основы Linux',
  icon: '🐧',
  sources: ['ES1-Linux_basic.pdf'],
  summary: 'Terminal и shell, файловая система и пути, структура каталогов, базовые команды, redirection и pipes, пользователи и группы (/etc/passwd, /etc/shadow), права доступа и chmod.',
  sections: [
    {
      id: 'connect',
      h: 'Terminal, prompt и синтаксис команд',
      html: `
<ul>
  <li><b>Terminal</b> — текстовый интерфейс для взаимодействия через командную строку.</li>
  <li>Строка <code>zhome:~/linux_tutorial$</code> состоит из: <b>host</b> (<code>zhome</code>), <b>current directory («path»)</b> (<code>~/linux_tutorial</code>) и <b>prompt</b> (<code>$</code>) — приглашение к вводу.</li>
</ul>
<p><b>Command syntax</b>: команду можно запустить саму по себе или с аргументами, меняющими её поведение:</p>
<div class="formula">command [-argument] [--long-argument] file</div>
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
<div class="callout note">Короткие опции объединяются: <code>ls -l -h</code> = <code>ls -lh</code>. Длинная форма той же опции: <code>-h</code> = <code>--human-readable</code>.</div>`,
      exam: 'Части prompt (host / path / $); общий вид команды command [-arg] [--long-arg] file.'
    },
    {
      id: 'shell',
      h: 'Shell и справка (man)',
      html: `
<ul>
  <li>После login Linux/Unix запускает программу <b>shell</b>.</li>
  <li>Shell <b>интерпретирует</b> вводимые команды и управляет их выполнением.</li>
  <li>Shell общается с внутренней частью ОС — <b>kernel</b>.</li>
  <li>Популярные shells: <b>tcsh, csh, korn, bash</b>; различия обычно тонкие. В курсе — <b>bash</b>.</li>
  <li>Shell commands <b>CASE SENSITIVE</b>: <code>ls</code> и <code>LS</code> — разные вещи.</li>
</ul>
<p><b>Help</b>: <code>man</code> + имя команды открывает её manual page. Без аргумента: <code>What manual page do you want?</code></p>
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
hello world</pre>`,
      viz: [{ name: 'flow', caption: 'Shell — посредник между пользователем и kernel', props: { dir: 'h', steps: [
        { label: 'User', sub: 'вводит команду' },
        { label: 'Shell (bash)', sub: 'интерпретирует, запускает', tone: 'acc' },
        { label: 'Kernel', sub: 'выполняет запросы', tone: 'warn' },
        { label: 'Hardware', tone: 'muted' }] } }]
    },
    {
      id: 'paths',
      h: 'Файловая система, absolute и relative paths',
      html: `
<ul>
  <li>Файловая система Linux — <b>иерархическое дерево</b>; верхний каталог — <b>root</b> <code>/</code>.</li>
  <li><b>Path</b> — «маршрут» до файла: <code>/home/john/portfolio/</code>, <code>/home/mary/</code>.</li>
  <li>Имена файлов в Unix <b>CASE SENSITIVE</b>: <code>File.txt</code> ≠ <code>file.txt</code>.</li>
</ul>
<div class="cols">
  <div><b>Absolute pathname</b>
    <ul><li>начинается с <code>/</code>;</li><li>полная «карта» до файла от root;</li><li>можно использовать всегда, из любого каталога.</li></ul>
    <code>/home/john/portfolio</code>
  </div>
  <div><b>Relative pathname</b>
    <ul><li><b>не</b> начинается с <code>/</code>;</li><li>задаёт путь относительно <b>current working directory</b>;</li><li>короткий способ указать файл.</li></ul>
    из <code>/home/john</code>: <code>portfolio</code>, <code>../mary</code>
  </div>
</div>`,
      viz: [{ name: 'tree', caption: 'Пример со слайда: путь /home/john/portfolio/', props: { mono: true, root: { label: '/', note: 'root', children: [
        { label: 'bin' }, { label: 'etc' },
        { label: 'home', children: [
          { label: 'john', children: [{ label: 'portfolio', note: '/home/john/portfolio/', tone: 'acc' }] },
          { label: 'mary', note: '/home/mary/', tone: 'ok' }] },
        { label: 'usr' }] } } }],
      exam: 'Отличить absolute (с /) от relative (от текущего каталога) пути.'
    },
    {
      id: 'dirs',
      h: 'Typical Directory Structure',
      html: `
<table class="t">
  <tr><th>Каталог</th><th>Назначение</th><th>Примеры</th></tr>
  <tr><td><code>/bin</code></td><td><b>Binary files</b>: essential commands для администратора <b>и</b> пользователей</td><td>cat, chmod, cp, ls, mkdir, mv, ps, pwd, rm, rmdir, sh, su, mount; optional: csh, tar, gzip, netstat, ping</td></tr>
  <tr><td><code>/sbin</code></td><td><b>Super-user binaries</b>: system binaries, используемые root</td><td>fdisk, fsck, mkfs, mkswap, reboot, halt, ifconfig, init, route, swapon</td></tr>
  <tr><td><code>/boot</code></td><td><b>Boot files</b>: всё для загрузки, <b>кроме конфигурационных файлов</b> (static files of the boot loader)</td><td>kernel (vmlinuz), initrd, grub, System.map</td></tr>
  <tr><td><code>/dev</code></td><td><b>Device files</b>: special / device files</td><td>sda, tty</td></tr>
  <tr><td><code>/proc</code></td><td><b>Virtual File System</b>: каталоги и файлы с информацией о системе и её состоянии</td><td>—</td></tr>
  <tr><td><code>/etc</code></td><td><b>Configuration files</b> (host-specific system configuration)</td><td>passwd, group, fstab, hosts, shells, profile, inittab, mtab, motd, issue, resolv.conf, services</td></tr>
  <tr><td><code>/home</code></td><td><b>User area</b>: home directories; пользователь пишет в свой, другие могут читать — зависит от permissions</td><td>/home/john</td></tr>
  <tr><td><code>/lib</code></td><td><b>Essential shared libraries и kernel modules</b>, нужные для загрузки и для бинарников из <code>/bin</code> и <code>/sbin</code></td><td>—</td></tr>
  <tr><td><code>/mnt</code></td><td><b>Mount area</b>: точка временного монтирования filesystem администратором; содержимое — локальный вопрос, не влияет на запуск программ</td><td>—</td></tr>
  <tr><td><code>/opt</code></td><td>Add-on application software packages</td><td>—</td></tr>
  <tr><td><code>/root</code></td><td>Home directory пользователя <b>root</b></td><td>—</td></tr>
  <tr><td><code>/tmp</code></td><td>Временные файлы программ; <b>world writable</b> (писать могут все)</td><td>—</td></tr>
  <tr><td><code>/usr</code></td><td>Secondary hierarchy: shareable, read-only data</td><td>/usr/bin (most user commands), /usr/include (C headers), /usr/local, /usr/share/man</td></tr>
  <tr><td><code>/usr/lib</code></td><td>Libraries for programming and packages: object files, библиотеки, internal binaries, <b>не предназначенные для прямого запуска</b> пользователем или скриптом</td><td>—</td></tr>
  <tr><td><code>/var</code></td><td>Variable data files</td><td>/var/log, /var/spool, /var/cache, /var/lock, /var/run, /var/tmp</td></tr>
</table>`,
      viz: [{ name: 'tree', caption: 'Дерево каталогов Linux (слайды 11 и 22)', props: { mono: true, root: { label: '/', note: 'the root directory', tone: 'acc', children: [
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
      exam: 'Назначение /bin vs /sbin, /lib vs /usr/lib, /etc, /tmp (world writable), /root, /proc, /dev, /mnt.'
    },
    {
      id: 'nav',
      h: 'Навигация: pwd, cd, ls, wildcard *',
      html: `
<table class="t">
  <tr><th>Команда</th><th>Что делает</th></tr>
  <tr><td><code>pwd</code></td><td>печатает текущий путь (print working directory)</td></tr>
  <tr><td><code>cd &lt;dir&gt;</code></td><td>переход в каталог</td></tr>
  <tr><td><code>cd ~</code></td><td><code>~</code> — <b>home directory</b> пользователя</td></tr>
  <tr><td><code>cd ..</code></td><td><code>..</code> — <b>родительский</b> каталог (на уровень выше по дереву)</td></tr>
  <tr><td><code>ls</code></td><td>список файлов текущего каталога</td></tr>
</table>
<pre class="code" data-lang="bash">zhome:~$ pwd
/fs/zhome05/wiehe
zhome:~$ cd /fs/zhome05/wiehe/linux_tutorial/
zhome:~/linux_tutorial$ pwd
/fs/zhome05/wiehe/linux_tutorial
zhome:~/linux_tutorial$ cd ..
zhome:~$ pwd
/fs/zhome05/wiehe</pre>
<p><b>Опции ls</b> (полный список — <code>man ls</code>; опции объединяются: <code>ls -ltr</code>):</p>
<table class="t">
  <tr><th>Опция</th><th>Смысл</th></tr>
  <tr><td><code>-l</code></td><td>long list (много информации)</td></tr>
  <tr><td><code>-t</code></td><td>сортировка по времени модификации (новые первыми)</td></tr>
  <tr><td><code>-S</code></td><td>сортировка по размеру</td></tr>
  <tr><td><code>-h</code></td><td>размеры в human readable формате (5.0K)</td></tr>
  <tr><td><code>-r</code></td><td>обратный порядок</td></tr>
  <tr><td><code>-a</code></td><td>показать скрытые файлы (начинаются с <code>.</code>)</td></tr>
</table>
<p><code>ls -ltr</code> — long listing по времени в <b>обратном</b> порядке: самый новый файл — <b>последний</b>.</p>
<pre class="code" data-lang="bash">zhome:~/linux_tutorial$ ls -ltr
total 20
-rw-rw-r--  1 wiehe wiehe  92 Aug 30 11:54 ACTG.pl
-rw-rw-r--  1 wiehe wiehe 169 Aug 30 12:20 aa_sequence.pl
-rw-rw-r--  1 wiehe wiehe  42 Aug 30 12:22 hello_world.pl
-rw-rw-r--  1 wiehe wiehe  24 Aug 30 12:23 output.txt
-rw-rw-r--  1 wiehe wiehe  21 Aug 30 12:23 data.dat</pre>
<p><b>Wildcard <code>*</code></b> — любая строка символов:</p>
<pre class="code" data-lang="bash">zhome:~/linux_tutorial$ ls *.pl
aa_sequence.pl  ACTG.pl  hello_world.pl</pre>`,
      exam: 'Значение ~ и ..; что делают -l -t -S -h -r -a; порядок вывода ls -ltr; раскрытие *.pl.'
    },
    {
      id: 'files',
      h: 'Каталоги и файлы: mkdir, rmdir, cp, mv, rm',
      html: `
<table class="t">
  <tr><th>Команда</th><th>Что делает</th><th>Пример со слайдов</th></tr>
  <tr><td><code>mkdir</code></td><td>создать каталог</td><td><code>mkdir new_directory</code></td></tr>
  <tr><td><code>rmdir</code></td><td>удалить <b>пустой</b> каталог</td><td><code>rmdir new_directory/</code></td></tr>
  <tr><td><code>cp</code></td><td>копировать файл</td><td><code>cp data.dat data2.dat</code></td></tr>
  <tr><td><code>mv</code></td><td>переместить файл в другое место</td><td><code>mv data2.dat ./new_directory/</code></td></tr>
  <tr><td><code>mv</code></td><td>переименовать файл</td><td><code>mv output.txt input.txt</code></td></tr>
  <tr><td><code>rm</code></td><td>удалить файл</td><td><code>rm data2.dat</code></td></tr>
  <tr><td><code>rm -r</code></td><td>удалить <b>рекурсивно</b> — все файлы и каталоги</td><td><code>rm -r new_directory</code></td></tr>
</table>
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
<div class="callout warn">Удаление в Unix/Linux <b>окончательное</b> (нет корзины) — с <code>rm -r</code> будь очень осторожен. <code>rmdir</code> не удалит непустой каталог.</div>`,
      exam: 'rmdir — только пустой каталог, rm -r — всё рекурсивно; mv = move и rename.'
    },
    {
      id: 'view',
      h: 'Просмотр и поиск: cat, less, head, tail, grep, wc, diff',
      html: `
<table class="t">
  <tr><th>Команда</th><th>Что делает</th></tr>
  <tr><td><code>cat</code></td><td>выводит весь файл на standard output; для коротких простых файлов</td></tr>
  <tr><td><code>less</code></td><td>просмотр с движением вперёд/назад: <b>Return</b> — строка вперёд, <b>space</b> — страница вперёд, <b>y</b> — строка назад, <b>b</b> — страница назад, <b>/</b> — поиск строки, <b>q</b> — выход</td></tr>
  <tr><td><code>head</code></td><td>начало файла; по умолчанию <b>первые 10 строк</b>; <code>-n</code> меняет число: <code>head -n50 file.txt</code> — первые 50</td></tr>
  <tr><td><code>tail</code></td><td>как head, но <b>последние</b> строки (по умолчанию 10)</td></tr>
  <tr><td><code>grep</code></td><td>поиск заданной строки в файлах</td></tr>
  <tr><td><code>wc</code></td><td>считает lines, words, characters; колонки вывода: <b>1-я — lines, 2-я — words, последняя — characters</b></td></tr>
  <tr><td><code>diff</code></td><td>сравнивает два файла и показывает различия</td></tr>
  <tr><td><code>more</code></td><td>постраничный вывод: <code>cat log.txt | more</code></td></tr>
</table>
<pre class="code" data-lang="bash">zhome:~/linux_tutorial$ head lines.txt      # файл a, b, c, … по строке
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
<div class="callout note">При поиске в нескольких файлах grep печатает <code>имя_файла:строка</code>.</div>`,
      exam: 'head/tail — 10 строк по умолчанию; порядок колонок wc (lines, words, chars); клавиши less.'
    },
    {
      id: 'redirect',
      h: 'Input/Output Redirection и piping',
      html: `
<table class="t">
  <tr><th>Запись</th><th>Смысл</th></tr>
  <tr><td><code>program_a | program_b</code></td><td><b>pipe</b>: output program_a становится input program_b</td></tr>
  <tr><td><code>program_a &gt; file.txt</code></td><td>output program_a записывается в file.txt (файл <b>перезаписывается</b>)</td></tr>
  <tr><td><code>program_a &gt;&gt; file.txt</code></td><td>output <b>дописывается</b> в конец file.txt</td></tr>
  <tr><td><code>program_a &lt; input.txt</code></td><td>program_a берёт input из файла input.txt</td></tr>
</table>
<p><b>Examples of piping</b> (со слайда):</p>
<table class="t">
  <tr><th>Команда</th><th>Результат</th></tr>
  <tr><td><code>ls -l &gt;&gt; log.txt</code></td><td>long listing дописывается в log.txt</td></tr>
  <tr><td><code>head pippo.txt | wc -m</code></td><td>число символов в первых 10 строках pippo.txt</td></tr>
  <tr><td><code>ls -a | grep "pippo"</code></td><td>файлы (включая скрытые), в имени которых есть «pippo»</td></tr>
  <tr><td><code>cat log.txt | more</code></td><td>постраничный просмотр log.txt</td></tr>
</table>`,
      viz: [
        { name: 'flow', caption: 'head pippo.txt | wc -m', props: { dir: 'h', steps: [
          { label: 'pippo.txt', tone: 'muted' },
          { label: 'head', sub: 'stdout: первые 10 строк', tone: 'acc' },
          { label: '|  pipe', sub: 'stdout → stdin', tone: 'warn' },
          { label: 'wc -m', sub: 'считает символы', tone: 'acc' },
          { label: 'terminal', sub: 'число', tone: 'ok' }] } },
        { name: 'graph', caption: 'Куда идут потоки при redirection', props: { w: 600, h: 200, nodes: [
          { id: 'in', label: 'input.txt', x: 80, y: 100, tone: 'muted' },
          { id: 'p', label: 'program_a', x: 300, y: 100, tone: 'acc', w: 130 },
          { id: 'f1', label: 'file.txt', sub: '> перезапись', x: 520, y: 40, tone: 'warn' },
          { id: 'f2', label: 'log.txt', sub: '>> дописать', x: 520, y: 160, tone: 'ok' }],
          edges: [{ from: 'in', to: 'p', label: '<' }, { from: 'p', to: 'f1', label: '>' }, { from: 'p', to: 'f2', label: '>>' }] } }
      ],
      exam: 'Разница > и >>; что делает |; разобрать head pippo.txt | wc -m и ls -a | grep "pippo".'
    },
    {
      id: 'users',
      h: 'User management: UID, users и groups',
      html: `
<ul>
  <li>Каждому аккаунту при создании присваивается уникальный <b>user ID (UID)</b>; два аккаунта не имеют одинаковый UID. Посмотреть: <code>id &lt;username&gt;</code>.</li>
  <li><b>root</b> имеет <b>UID = 0</b>.</li>
  <li>Большинство дистрибутивов резервируют <b>первые 100 UID</b> для системы; новые пользователи получают UID начиная с <b>500 или 1000</b> (в <b>Ubuntu — с 1000</b>).</li>
</ul>
<p><b>Users and Groups</b>:</p>
<ul>
  <li>пользователь может состоять в <b>нескольких группах</b>;</li>
  <li>файл принадлежит <b>одному user и одной group</b> одновременно;</li>
  <li>superuser <b>root</b> (uid = 0) имеет расширенные привилегии; <b>только root может менять владельца файла</b>;</li>
  <li>стать root: <code>su</code> + <b>пароль root</b>; <code>sudo -s</code> + <b>пароль пользователя</b>.</li>
</ul>
<p><b>Groups</b>: информация о группах — <code>/etc/group</code>, <b>GID</b> (group ID). Формат <code>group_name:password:GID:members</code>:</p>
<pre class="code" data-lang="bash">bob@bobs-computer:~$ cat /etc/group
root:x:0:
daemon:x:1:
bin:x:2:
sys:x:3:
adm:x:4:syslog,bob
...
cdrom:x:24:bob
sudo:x:27:bob</pre>`,
      exam: 'UID root = 0; диапазоны UID (100 системных, новые с 500/1000, Ubuntu 1000); su vs sudo -s.'
    },
    {
      id: 'passwd',
      h: '/etc/passwd и /etc/shadow',
      html: `
<ul>
  <li>Информация о пользователях — <code>/etc/passwd</code>; о паролях — <code>/etc/shadow</code>.</li>
  <li><code>/etc/passwd</code> и <code>/etc/group</code> разделяют поля символом <code>:</code>.</li>
</ul>
<pre class="code" data-lang="text">/etc/passwd:  joeuser:x:1000:1000:Joe User,,,:/home/joeuser:/bin/bash
/etc/group:   joeuser:x:1000:</pre>
<div class="formula">Username : Password : UID : GID : Full_Name : Home_Directory : Default_Shell</div>
<table class="t">
  <tr><th>Поле /etc/passwd</th><th>Смысл</th></tr>
  <tr><td>Username</td><td>имя для login</td></tr>
  <tr><td>Password</td><td><b>legacy</b>: раньше здесь хранился зашифрованный пароль, теперь <code>x</code> — пароль перенесён в <code>/etc/shadow</code>, потому что <b>passwd должен быть читаем всеми</b></td></tr>
  <tr><td>UID</td><td>user ID</td></tr>
  <tr><td>GID</td><td>group ID <b>default group</b> пользователя</td></tr>
  <tr><td>Full_Name</td><td>полное имя</td></tr>
  <tr><td>Home_Directory</td><td>путь к home directory</td></tr>
  <tr><td>Default_Shell</td><td>shell по умолчанию</td></tr>
</table>
<div class="formula">Username : Password : Last_Modified : Min_Days : Max_Days : Days_Warn : Disabled_Days : Expire</div>
<table class="t">
  <tr><th>Поле /etc/shadow</th><th>Смысл</th></tr>
  <tr><td>Username</td><td>login name из /etc/passwd</td></tr>
  <tr><td>Password</td><td>зашифрованный пароль в формате <code>$type$salt$hashed</code></td></tr>
  <tr><td>Last_Modified</td><td>дней с 1 января 1970 до последней смены пароля</td></tr>
  <tr><td>Min_Days</td><td>минимум дней до возможности сменить пароль</td></tr>
  <tr><td>Max_Days</td><td>максимум дней, после которых пароль надо сменить; <b>99999</b> — смена не требуется</td></tr>
  <tr><td>Days_Warn</td><td>за сколько дней до истечения предупреждать</td></tr>
  <tr><td>Disabled_Days</td><td>сколько дней после истечения пароля ждать до отключения аккаунта</td></tr>
  <tr><td>Expire</td><td>дней с 1 января 1970, после которых аккаунт отключается; пусто — <b>никогда не истекает</b></td></tr>
</table>
<table class="t">
  <tr><th>$type</th><th>Алгоритм</th></tr>
  <tr><td><code>$1$</code></td><td>MD5</td></tr>
  <tr><td><code>$2a$</code>, <code>$2y$</code></td><td>Blowfish</td></tr>
  <tr><td><code>$5$</code></td><td>SHA-256</td></tr>
  <tr><td><code>$6$</code></td><td>SHA-512</td></tr>
</table>
<p><b>Salting</b>:</p>
<ul>
  <li><code>$salt</code> — случайное значение, хранится вместе с хэшем; генерируется <b>CSPRNG</b> и уникально для каждого пользователя.</li>
  <li>Защищает от <b>dictionary attacks</b> и <b>rainbow table attacks</b> (заранее посчитанные хэши множества паролей).</li>
  <li>При login Linux берёт salt пользователя, соединяет с введённым паролем, хэширует и сравнивает с сохранённым хэшем; совпало — доступ разрешён.</li>
</ul>
<div class="callout warn">Если в поле Password стоит <code>*</code> или <code>!</code> — вход <b>по паролю</b> невозможен. Другие способы (key-based authentication, переключение на пользователя) <b>остаются</b>.</div>`,
      viz: [{ name: 'flow', caption: 'Проверка пароля при login', props: { dir: 'h', steps: [
        { label: 'введённый пароль' },
        { label: '+ salt', sub: 'из /etc/shadow', tone: 'acc' },
        { label: 'hash($type)', tone: 'warn' },
        { label: 'сравнить', sub: 'с сохранённым хэшем', tone: 'ok' }] } }],
      exam: 'Порядок полей passwd/shadow; почему пароль в shadow; $6$ = SHA-512; зачем salt; смысл * и !.'
    },
    {
      id: 'manage',
      h: 'Добавление и удаление пользователей',
      html: `
<ul>
  <li>Новый аккаунт обычно получает <b>следующий наибольший свободный</b> UID.</li>
  <li>В большинстве дистрибутивов <code>useradd</code> <b>не создаёт</b> home directory; чтобы создать — опция <code>-m</code>.</li>
  <li>Чтобы войти под новым пользователем, нужно задать пароль: <code>sudo passwd username</code>.</li>
  <li><code>-u</code> (<code>--uid</code>) — создать пользователя с конкретным UID; вместе с <code>-o</code> — разрешить <b>дублирующийся</b> (non-unique) UID.</li>
</ul>
<pre class="code" data-lang="bash">bob@bobs-computer:~$ sudo useradd john
[sudo] password for bob:
bob@bobs-computer:~$ cat /etc/passwd | grep john
john:x:1001:1001::/home/john:
$ sudo passwd username
$ sudo useradd -u 1500 username
$ sudo useradd -o -u 1500 other_user      # тот же UID 1500</pre>
<p><b>Multiple accounts with the same UID</b>:</p>
<ul>
  <li>ОС идентифицирует пользователя по <b>UID</b>; username — лишь удобство для людей.</li>
  <li>Два пользователя с одним UID для Linux — <b>один и тот же пользователь</b>, даже при разных именах и паролях: свободно читают и удаляют файлы друг друга, убивают программы друг друга.</li>
  <li>Почти всегда <b>плохая идея</b>. Исключения: пользователи на разных площадках делят файлы; раздельное отслеживание логинов и действий; можно отключить доступ одному, не отключая всем.</li>
</ul>
<p><b>Removing users</b>:</p>
<pre class="code" data-lang="bash">/home$ sudo deluser maria                       # удалить пользователя, файлы остаются
/home$ sudo deluser --remove-home maria         # + удалить home directory
/home$ sudo deluser --remove-all-files maria    # + все файлы в системе, принадлежащие maria</pre>`,
      exam: 'useradd без -m не создаёт home; -u / -o; последствия одинакового UID; опции deluser.'
    },
    {
      id: 'exec',
      h: 'Как запускается программа',
      html: `
<ul>
  <li>Программу может запустить пользователь, система при старте или другой процесс.</li>
  <li>Перед выполнением kernel проверяет:
    <ul>
      <li>доступен ли файл программы user/group процесса, который хочет её запустить;</li>
      <li>разрешает ли файл <b>execution</b> этому user/group (или всем).</li>
    </ul>
  </li>
  <li>Как правило, при выполнении программа <b>наследует привилегии</b> пользователя/процесса, который её запустил.</li>
</ul>`,
      viz: [{ name: 'flow', caption: 'Проверки kernel перед запуском', props: { dir: 'h', steps: [
        { label: 'запрос на запуск', sub: 'user / system / процесс' },
        { label: 'файл доступен?', sub: 'user/group процесса', tone: 'warn' },
        { label: 'x разрешён?', sub: 'для user/group/other', tone: 'warn' },
        { label: 'выполнение', sub: 'с правами запустившего', tone: 'ok' }] } }]
    },
    {
      id: 'perms',
      h: 'File permissions и вывод ls -l',
      html: `
<ul>
  <li>Три права: <b>read (r)</b>, <b>write (w)</b>, <b>execute (x)</b>; их смысл различается для файлов и каталогов.</li>
  <li>Три категории: <b>User</b> — владелец файла; <b>Group</b> — группа пользователей (группы облегчают администрирование); <b>Other</b> — все остальные.</li>
</ul>
<div class="formula">rwx rwx rwx &nbsp;=&nbsp; user | group | other</div>
<pre class="code" data-lang="text">-r-xr-xr-x 1 root root 68524 2011-12-19 07:18 /usr/bin/top
|          | |    |    |     |                |
|          | |    |    |     |                +-- File Name
|          | |    |    |     +------------------- Modification Time/Date
|          | |    |    +------------------------- Size (in bytes)
|          | |    +------------------------------ Group
|          | +----------------------------------- Owner
|          +------------------------------------- "link count"
+------------------------------------------------ File Permissions</pre>
<p><b>Первый символ</b> вывода <code>ls -l</code> — тип файла:</p>
<table class="t">
  <tr><th>Символ</th><th>Тип</th></tr>
  <tr><td><code>-</code></td><td>regular file</td></tr>
  <tr><td><code>d</code></td><td>directory</td></tr>
  <tr><td><code>l</code></td><td>symbolic link</td></tr>
  <tr><td><code>c</code></td><td>character device file</td></tr>
  <tr><td><code>b</code></td><td>block device file</td></tr>
  <tr><td><code>s</code></td><td>Unix domain socket — специальный файл для IPC между двумя процессами; кроме данных можно передавать file descriptors</td></tr>
  <tr><td><code>p</code></td><td>named pipe — файл для обмена сообщениями между процессами через FIFO</td></tr>
</table>
<p><b>Пример</b>: <code>-rw-r--r-- 1 martin users 0 2012-04-11 09:20 file1</code></p>
<ul>
  <li>User: <code>rw-</code> — read, write, не execute (<code>-</code> = нет права);</li>
  <li>Group: <code>r--</code> — только read;</li>
  <li>Other: <code>r--</code> — все пользователи системы могут только читать.</li>
</ul>`,
      exam: 'Разобрать строку ls -l по колонкам; первый символ (- d l c b s p); права по категориям.'
    },
    {
      id: 'chmod',
      h: 'chmod: symbolic и numeric notation',
      html: `
<p><b>chmod</b> (change mode) меняет права файлов и каталогов. Синтаксис: <code>chmod permissions file/directory</code>. Две нотации — <b>symbolic</b> и <b>numeric</b>.</p>
<p><b>Symbolic notation</b>:</p>
<table class="t">
  <tr><th>Category</th><th>Operator</th><th>Permission</th></tr>
  <tr><td><code>u</code> (user)</td><td><code>+</code> добавить к существующим</td><td><code>r</code> (read)</td></tr>
  <tr><td><code>g</code> (group)</td><td><code>-</code> убрать из существующих</td><td><code>w</code> (write)</td></tr>
  <tr><td><code>o</code> (other)</td><td><code>=</code> назначить абсолютно</td><td><code>x</code> (execute)</td></tr>
  <tr><td><code>a</code> (all)</td><td>один из операторов выше</td><td>одно или несколько прав</td></tr>
</table>
<pre class="code" data-lang="bash"># testfile имеет права -r--r--r--
$ chmod g+x testfile     ==&gt;  -r--r-xr--
$ chmod u+wx testfile    ==&gt;  -rwxr-xr--
$ chmod ug-x testfile    ==&gt;  -rw-r--r--</pre>
<div class="callout note">На слайде результат последней команды напечатан как <code>-rw--r--r--</code> (лишний дефис); правильно — <code>-rw-r--r--</code>.</div>
<p><b>Numeric notation (Absolute mode)</b> — octal: <b>r = 4, w = 2, x = 1, - = 0</b>; для каждой колонки (User, Group, Other) сумма от 0 до 7:</p>
<table class="t">
  <tr><th>0</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th></tr>
  <tr><td><code>---</code></td><td><code>--x</code></td><td><code>-w-</code></td><td><code>-wx</code></td><td><code>r--</code></td><td><code>r-x</code></td><td><code>rw-</code></td><td><code>rwx</code></td></tr>
</table>
<pre class="code" data-lang="bash">$ chmod 755 index.html
$ ls -l index.html
-rwxr-xr-x 1 root wheel 0 May 24 06:20 index.html
$ chmod 644 index.html
$ ls -l index.html
-rw-r--r-- 1 root wheel 0 May 24 06:20 index.html</pre>
<p><b>Special cases</b> в колонках Owner/Group/Other:</p>
<table class="t">
  <tr><th>Символ</th><th>Где</th><th>Смысл</th></tr>
  <tr><td><code>s</code></td><td>в колонке Owner (на месте x)</td><td><b>setuid</b></td></tr>
  <tr><td><code>s</code></td><td>в колонке Group</td><td><b>setgid</b></td></tr>
  <tr><td><code>t</code></td><td>в конце (колонка Other)</td><td><b>sticky bit</b></td></tr>
</table>
<div data-viz="0"></div>`,
      viz: [{ name: 'chmod', caption: 'Калькулятор: rwx ↔ octal ↔ symbolic (пример со слайда — index.html)', props: { mode: '755', file: 'index.html' } }],
      exam: 'Перевод rwx ↔ octal (755, 644, 754…), применение chmod u+wx / g+x / ug-x к исходным правам; setuid/setgid/sticky.'
    },
    {
      id: 'dirperms',
      h: 'Права каталогов и итоговое упражнение',
      html: `
<div class="callout key"><b>Two critical points</b>:
<ol>
  <li>Права <b>каталога</b> определяют, может ли кто-то видеть его содержимое и <b>добавлять/удалять файлы</b> в нём.</li>
  <li>Права <b>файла</b> определяют, что пользователь может делать с <b>данными</b> в файле.</li>
</ol></div>
<p><b>Пример</b>: нет права write на <b>каталог</b> → нельзя удалить файл в этом каталоге. Есть write на <b>файл</b> → можно менять данные файла.</p>
<table class="t">
  <tr><th>Право</th><th>Для файла</th><th>Для каталога</th></tr>
  <tr><td><code>r</code></td><td>читать данные</td><td>видеть список содержимого</td></tr>
  <tr><td><code>w</code></td><td>изменять данные</td><td>создавать / удалять / переименовывать файлы в нём</td></tr>
  <tr><td><code>x</code></td><td>запускать как программу</td><td>входить в каталог (<code>cd</code>) и обращаться к файлам внутри</td></tr>
</table>
<p><b>Final exercise</b>: создать файл в <code>~</code>; убрать все права численно; затем символьно дать user — все права, group — read и execute, остальным — только read; как то же сделать численно?</p>
<pre class="code" data-lang="bash">$ cd ~
$ touch myfile
$ chmod 000 myfile              # ---------- : все права убраны
$ chmod u=rwx,g=rx,o=r myfile   # symbolic
$ ls -l myfile
-rwxr-xr-- 1 user user 0 ... myfile
$ chmod 754 myfile              # numeric: 7 = rwx, 5 = r-x, 4 = r--</pre>
<div data-viz="0"></div>`,
      viz: [{ name: 'chmod', caption: 'Результат упражнения: 754 = rwxr-xr--', props: { mode: '754', file: 'myfile' } }],
      exam: 'Удаление файла зависит от w на КАТАЛОГ, а не на файл; итоговое упражнение = chmod 754.'
    }
  ],
  terms: [
    { en: 'Terminal', ru: 'Терминал', def: 'Текстовый интерфейс для работы с командной строкой.' },
    { en: 'Prompt', ru: 'Приглашение', def: 'Строка вида host:path$, после которой вводится команда.' },
    { en: 'Shell', ru: 'Командная оболочка', def: 'Программа, запускаемая после login: интерпретирует команды и взаимодействует с kernel (bash, csh, tcsh, korn).' },
    { en: 'man', ru: 'Справка', def: 'Команда для просмотра manual page: man + имя команды.' },
    { en: 'Root directory /', ru: 'Корневой каталог', def: 'Верхний каталог иерархического дерева файловой системы.' },
    { en: 'Absolute pathname', ru: 'Абсолютный путь', def: 'Путь, начинающийся с /; полный маршрут от root.' },
    { en: 'Relative pathname', ru: 'Относительный путь', def: 'Путь без ведущего /; задаётся относительно current working directory.' },
    { en: 'Home directory (~)', ru: 'Домашний каталог', def: 'Личный каталог пользователя (/home/имя_пользователя; для root — /root).' },
    { en: 'Wildcard *', ru: 'Шаблон *', def: 'Заменяет любую строку символов в имени файла (ls *.pl).' },
    { en: 'Pipe |', ru: 'Конвейер', def: 'Output одной программы становится input другой: program_a | program_b.' },
    { en: 'Redirection > >> <', ru: 'Перенаправление', def: '> — записать output в файл (перезапись), >> — дописать, < — взять input из файла.' },
    { en: 'UID', ru: 'Идентификатор пользователя', def: 'Уникальный номер аккаунта; root = 0; ОС различает пользователей по UID.' },
    { en: 'GID', ru: 'Идентификатор группы', def: 'Номер группы; хранится в /etc/group, default GID пользователя — в /etc/passwd.' },
    { en: 'root (superuser)', ru: 'Суперпользователь', def: 'Пользователь с UID 0 и расширенными привилегиями; только он меняет владельца файлов.' },
    { en: '/etc/passwd', ru: 'Файл пользователей', def: 'Username:Password(x):UID:GID:Full_Name:Home_Directory:Default_Shell; читаем всеми.' },
    { en: '/etc/shadow', ru: 'Файл паролей', def: 'Хранит хэши паролей ($type$salt$hashed) и параметры срока действия.' },
    { en: 'Salt', ru: 'Соль', def: 'Случайное значение (CSPRNG), уникальное для пользователя, добавляется к паролю перед хэшированием; защищает от dictionary и rainbow table attacks.' },
    { en: 'useradd', ru: 'Добавить пользователя', def: 'Создаёт аккаунт; -m — создать home, -u — задать UID, -o — разрешить дубль UID.' },
    { en: 'deluser', ru: 'Удалить пользователя', def: 'Удаляет аккаунт; --remove-home — с home directory, --remove-all-files — со всеми файлами пользователя.' },
    { en: 'chmod', ru: 'Изменить права', def: 'change mode: меняет права файла/каталога в symbolic (u+x) или numeric (755) нотации.' },
    { en: 'Numeric (octal) notation', ru: 'Числовая нотация', def: 'r=4, w=2, x=1; по цифре 0–7 на user, group, other.' },
    { en: 'setuid / setgid / sticky bit', ru: 'Специальные биты', def: 's в колонке owner — setuid, s в колонке group — setgid, t в конце — sticky bit.' }
  ],
  questions: [
    { id: 'lin-01', type: 'single', q: 'Prompt: zhome:~/linux_tutorial$. Что означает ~/linux_tutorial?', options: ['Имя host', 'Текущий каталог (path)', 'Имя пользователя', 'Используемый shell'], answer: 1, explain: 'zhome — host, ~/linux_tutorial — current directory, $ — сам prompt.', section: 'connect', diff: 1 },
    { id: 'lin-02', type: 'tf', q: 'Shell commands и имена файлов в Linux чувствительны к регистру (case sensitive).', answer: true, explain: 'На слайдах подчёркнуто: и команды, и имена файлов CASE SENSITIVE.', section: 'shell', diff: 1 },
    { id: 'lin-03', type: 'code', lang: 'bash', q: 'Каталоги /home/john и /home/mary существуют. Что выведет последний pwd?', code: 'cd /home/john\ncd ../mary\npwd', options: ['/home/john/mary', '/home/mary', '/mary', '../mary'], answer: 1, explain: '.. — родительский каталог /home, затем mary → /home/mary. pwd всегда печатает абсолютный путь.', section: 'paths', diff: 1 },
    { id: 'lin-04', type: 'single', q: 'В каком каталоге находятся конфигурационные файлы (passwd, group, fstab, hosts)?', options: ['/bin', '/var', '/etc', '/usr/lib'], answer: 2, explain: '/etc — configuration files (host-specific system configuration).', section: 'dirs', diff: 1 },
    { id: 'lin-05', type: 'single', q: 'Чем /sbin отличается от /bin?', options: ['/sbin — binaries для root (system binaries), /bin — команды и для администратора, и для пользователей', '/sbin — библиотеки, /bin — исполняемые файлы', '/sbin — файлы загрузчика', '/sbin — временные файлы'], answer: 0, explain: '/bin — essential commands для всех; /sbin — Super-user binaries (fdisk, fsck, reboot…). Файлы загрузчика — /boot.', section: 'dirs', diff: 1 },
    { id: 'lin-06', type: 'single', q: 'Какой каталог является world writable — доступен на запись всем пользователям?', options: ['/root', '/tmp', '/etc', '/home'], answer: 1, explain: '/tmp — временные файлы, писать могут все. /home — каждый пишет только в свой home; /root — home root.', section: 'dirs', diff: 1 },
    { id: 'lin-07', type: 'single', q: 'Какой каталог содержит essential shared libraries и kernel modules, нужные для загрузки и для программ из /bin и /sbin?', options: ['/usr/lib', '/lib', '/opt', '/boot'], answer: 1, explain: '/lib — essential shared libraries + kernel modules. /usr/lib — библиотеки для программирования и пакетов, internal binaries.', section: 'dirs', diff: 2 },
    { id: 'lin-08', type: 'single', q: 'Что делает ls -ltr?', options: ['Long listing, сортировка по времени, самый новый файл — последний', 'Long listing, сортировка по размеру по убыванию', 'Показывает скрытые файлы рекурсивно', 'Long listing, самый новый файл — первый'], answer: 0, explain: '-l long, -t по времени модификации (новые первыми), -r — обратный порядок → новые в конце.', section: 'nav', diff: 2 },
    { id: 'lin-09', type: 'code', lang: 'bash', q: 'В каталоге файлы: aa_sequence.pl, ACTG.pl, data.dat, hello_world.pl, output.txt. Сколько имён выведет команда?', code: 'ls *.pl', options: ['1', '2', '3', '5'], answer: 2, explain: '*.pl раскрывается в aa_sequence.pl, ACTG.pl, hello_world.pl — 3 файла.', section: 'nav', diff: 1 },
    { id: 'lin-10', type: 'single', q: 'Как удалить каталог new_directory вместе со всем содержимым?', options: ['rmdir new_directory', 'rm new_directory', 'rm -r new_directory', 'mv new_directory ~'], answer: 2, explain: 'rm -r удаляет рекурсивно. rmdir удаляет только пустой каталог, rm без -r каталог не удаляет.', section: 'files', diff: 1 },
    { id: 'lin-11', type: 'code', lang: 'bash', q: 'Файл n.txt содержит числа от 1 до 20, по одному на строке. Что выведет команда?', code: 'tail n.txt | head -n 3', options: ['1 2 3', '11 12 13', '18 19 20', '8 9 10'], answer: 1, explain: 'tail по умолчанию даёт последние 10 строк (11…20), head -n 3 берёт первые три из них: 11, 12, 13.', section: 'view', diff: 2 },
    { id: 'lin-12', type: 'single', q: 'wc file.txt выводит 3 6 28 file.txt. Что означает 6?', options: ['Число строк', 'Число слов', 'Число символов', 'Размер в KB'], answer: 1, explain: 'Колонки wc: lines, words, characters → 3 строки, 6 слов, 28 символов.', section: 'view', diff: 1 },
    { id: 'lin-13', type: 'code', lang: 'bash', q: 'log.txt изначально содержит 5 строк. Сколько строк в нём после выполнения?', code: 'echo hello > log.txt\necho world >> log.txt', options: ['2', '6', '7', '1'], answer: 0, explain: '> перезаписывает файл (остаётся hello), >> дописывает world → 2 строки.', section: 'redirect', diff: 2 },
    { id: 'lin-14', type: 'code', lang: 'bash', q: 'Что выводит команда?', code: 'head pippo.txt | wc -m', options: ['Число строк в pippo.txt', 'Число символов в первых 10 строках pippo.txt', 'Первые 10 символов pippo.txt', 'Число слов во всём pippo.txt'], answer: 1, explain: 'head отдаёт первые 10 строк, pipe передаёт их на stdin wc, -m считает символы.', section: 'redirect', diff: 2 },
    { id: 'lin-15', type: 'single', q: 'Какой UID у root?', options: ['1', '0', '100', '1000'], answer: 1, explain: 'Root has UID = 0.', section: 'users', diff: 1 },
    { id: 'lin-16', type: 'single', q: 'С какого UID начинаются новые пользователи в Ubuntu?', options: ['0', '100', '500', '1000'], answer: 3, explain: 'Первые 100 UID — для системы; новые — с 500 или 1000, в Ubuntu — с 1000.', section: 'users', diff: 1 },
    { id: 'lin-17', type: 'single', q: 'Как стать root, вводя пароль СВОЕГО пользователя?', options: ['su', 'sudo -s', 'root -u', 'passwd root'], answer: 1, explain: 'sudo -s запрашивает пароль пользователя; su — пароль root.', section: 'users', diff: 2 },
    { id: 'lin-18', type: 'code', lang: 'text', q: 'Строка /etc/passwd. Что означает 4-е поле (второе число 1000)?', code: 'joeuser:x:1000:1000:Joe User,,,:/home/joeuser:/bin/bash', options: ['UID', 'GID default group пользователя', 'Число дней до смены пароля', 'Номер терминала'], answer: 1, explain: 'Username:Password:UID:GID:Full_Name:Home_Directory:Default_Shell — 4-е поле GID.', section: 'passwd', diff: 2 },
    { id: 'lin-19', type: 'single', q: 'Почему пароли перенесли из /etc/passwd в /etc/shadow?', options: ['/etc/passwd должен быть читаем всеми пользователями системы', '/etc/passwd слишком большой', 'В /etc/passwd нельзя хранить двоеточия', 'Чтобы ускорить login'], answer: 0, explain: 'passwd должен быть readable всеми, поэтому хэши паролей вынесены в защищённый /etc/shadow; в passwd осталось x.', section: 'passwd', diff: 2 },
    { id: 'lin-20', type: 'single', q: 'Password в /etc/shadow начинается с $6$. Какой алгоритм?', options: ['MD5', 'Blowfish', 'SHA-256', 'SHA-512'], answer: 3, explain: '$1$ — MD5, $2a$/$2y$ — Blowfish, $5$ — SHA-256, $6$ — SHA-512.', section: 'passwd', diff: 2 },
    { id: 'lin-21', type: 'single', q: 'Зачем к паролю добавляется salt?', options: ['Ускоряет хэширование', 'Защищает от dictionary и rainbow table attacks с заранее посчитанными хэшами', 'Позволяет восстановить пароль', 'Сжимает хэш'], answer: 1, explain: 'Уникальная случайная salt делает бесполезными предвычисленные таблицы хэшей.', section: 'passwd', diff: 2 },
    { id: 'lin-22', type: 'tf', q: 'Если поле Password в /etc/shadow содержит ! или *, пользователь не может попасть в систему никаким способом.', answer: false, explain: 'Запрещён только вход по паролю; key-based authentication и переключение на пользователя остаются.', section: 'passwd', diff: 2 },
    { id: 'lin-23', type: 'multi', q: 'Строка /etc/shadow: bob:!$6$Xa9k$Qw3...:19000:0:99999:7::: — какие утверждения верны? (несколько ответов)', options: ['Вход по паролю для bob невозможен', 'Хэш посчитан алгоритмом SHA-512', 'Пароль нужно менять каждые 7 дней', 'Аккаунт никогда не истекает', 'Пароль менялся 19000 секунд назад'], answer: [0, 1, 3], explain: '! в поле Password запрещает вход по паролю; $6$ — SHA-512; 7 — Days_Warn (предупреждение), Max_Days = 99999 — смена не требуется; пустой Expire — аккаунт не истекает; 19000 — дни с 1.1.1970.', section: 'passwd', diff: 3 },
    { id: 'lin-24', type: 'single', q: 'Какая опция useradd создаёт home directory нового пользователя?', options: ['-u', '-o', '-m', '-h'], answer: 2, explain: '-m создаёт home. -u задаёт UID, -o разрешает дублирующийся UID.', section: 'manage', diff: 1 },
    { id: 'lin-25', type: 'single', q: 'Двум пользователям с разными именами и паролями назначен один UID. Как Linux их воспринимает?', options: ['Как разных пользователей с общей группой', 'Как одного пользователя: могут читать/удалять файлы и убивать программы друг друга', 'Второй аккаунт блокируется', 'Как root'], answer: 1, explain: 'ОС идентифицирует пользователя по UID, username — лишь удобство для людей.', section: 'manage', diff: 2 },
    { id: 'lin-26', type: 'single', q: 'Какая опция deluser удаляет все файлы в системе, принадлежащие пользователю?', options: ['--remove-home', '--remove-all-files', '-m', '--purge-uid'], answer: 1, explain: '--remove-home удаляет только home directory, --remove-all-files — все файлы пользователя.', section: 'manage', diff: 2 },
    { id: 'lin-27', type: 'tf', q: 'Как правило, выполняющаяся программа наследует привилегии пользователя/процесса, который её запустил.', answer: true, explain: 'Это утверждение со слайда «A program runs…». Перед запуском kernel проверяет доступ и право execution.', section: 'exec', diff: 1 },
    { id: 'lin-28', type: 'code', lang: 'text', q: 'Что означает число 68524 в выводе ls -l?', code: '-r-xr-xr-x 1 root root 68524 2011-12-19 07:18 /usr/bin/top', options: ['Inode', 'Size (in bytes)', 'Link count', 'UID владельца'], answer: 1, explain: 'Колонки: permissions, link count (1), owner, group, size (68524), date/time, name.', section: 'perms', diff: 1 },
    { id: 'lin-29', type: 'single', q: 'Первый символ строки ls -l — p. Что это за файл?', options: ['Pipe-символическая ссылка', 'Named pipe (FIFO)', 'Printer device', 'Процесс'], answer: 1, explain: 'p = named pipe для обмена между процессами через FIFO. l — symbolic link, c/b — device files, s — socket.', section: 'perms', diff: 2 },
    { id: 'lin-30', type: 'code', lang: 'bash', q: 'testfile имеет права -r--r--r--. Какими станут права после трёх команд?', code: 'chmod g+x testfile\nchmod u+wx testfile\nchmod ug-x testfile', options: ['-rwxr-xr--', '-rw-r--r--', '-r--r--r--', '-rw-rw-r--'], answer: 1, explain: 'g+x → -r--r-xr--; u+wx → -rwxr-xr--; ug-x убирает x у user и group → -rw-r--r--.', section: 'chmod', diff: 3 },
    { id: 'lin-31', type: 'single', q: 'Какую строку прав даст chmod 755 index.html?', options: ['-rwxr-xr-x', '-rwxrwxr-x', '-rw-r--r--', '-rwxr--r--'], answer: 0, explain: '7 = rwx, 5 = r-x, 5 = r-x.', section: 'chmod', diff: 1 },
    { id: 'lin-32', type: 'single', q: 'Права -rw-r-----. Какое octal значение?', options: ['644', '640', '750', '604'], answer: 1, explain: 'rw- = 4+2 = 6, r-- = 4, --- = 0 → 640.', section: 'chmod', diff: 2 },
    { id: 'lin-33', type: 'code', lang: 'bash', q: 'Какое octal значение прав будет у data.txt после команд?', code: 'chmod 750 data.txt\nchmod g-x,o+r data.txt\nchmod a-w data.txt', options: ['740', '544', '444', '554'], answer: 1, explain: '750 = rwxr-x---; g-x,o+r → rwxr--r-- (744); a-w убирает w у всех → r-xr--r-- = 544.', section: 'chmod', diff: 3 },
    { id: 'lin-34', type: 'single', q: 'В строке -rwsr-xr-x что означает s в колонке owner?', options: ['sticky bit', 'setgid', 'setuid', 'socket'], answer: 2, explain: 's в колонке Owner — setuid; s в колонке Group — setgid; t в конце — sticky bit.', section: 'chmod', diff: 2 },
    { id: 'lin-35', type: 'single', q: 'У пользователя есть право w на файл report.txt, но НЕТ права w на каталог, где он лежит. Что он может?', options: ['Удалить report.txt', 'Изменить данные в report.txt, но не удалить файл', 'Ничего не может сделать с файлом', 'Переименовать report.txt'], answer: 1, explain: 'Права файла управляют данными в нём; удаление/добавление/переименование файлов — правом w на каталог.', section: 'dirperms', diff: 3 },
    { id: 'lin-36', type: 'single', q: 'Итоговое упражнение: user — все права, group — read и execute, остальные — только read. Как сделать численно?', options: ['chmod 751 file', 'chmod 754 file', 'chmod 764 file', 'chmod 745 file'], answer: 1, explain: 'rwx = 7, r-x = 5, r-- = 4 → 754 (symbolic: chmod u=rwx,g=rx,o=r file).', section: 'dirperms', diff: 2 }
  ]
});
