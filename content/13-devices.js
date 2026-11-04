OS.addModule({
  id: 'devices',
  num: 13,
  group: 'lab',
  title: 'Device Management in Linux',
  titleRu: 'Управление устройствами в Linux',
  icon: '🔌',
  sources: ['ES5-Device Management in Linux.pdf'],
  summary: 'Слои Linux, «всё есть файл», базовые I/O-вызовы, character/block/network devices, /dev и special devices, major/minor numbers, /proc, mount, kernel modules (LKM), udev, udevadm и hotplug.',
  sections: [
    {
      id: 'layers',
      h: 'The layers of a Linux system',
      html: `
<table class="t">
  <tr><th>Слой</th><th>Содержимое</th><th>Интерфейс сверху</th><th>Режим</th></tr>
  <tr><td>Users</td><td>пользователи</td><td><b>user interface</b></td><td rowspan="3">user mode</td></tr>
  <tr><td>Standard utility programs</td><td>shell, editors, compilers…</td><td><b>library interface</b></td></tr>
  <tr><td>Standard library</td><td>open, close, read, write, fork…</td><td><b>system call interface</b></td></tr>
  <tr><td>UNIX operating system</td><td>process management, memory management, file system, <b>I/O</b>…</td><td>—</td><td>kernel mode</td></tr>
  <tr><td>Hardware</td><td>CPU, memory, disks, terminals…</td><td>—</td><td>—</td></tr>
</table>
<div class="callout key">Linux — <b>monolithic kernel</b>: process/memory management, file system и I/O (в т. ч. device drivers) работают в одном ядре в <b>kernel mode</b>. Программы попадают в ядро через <b>system call interface</b>.</div>`,
      viz: [{ name: 'layers', caption: 'Слои Linux (I/O — часть монолитного ядра)', props: { pyramid: true, top: 'user mode', bottom: 'kernel mode → hardware', layers: [
        { label: 'Users', sub: '↓ user interface', tone: 'muted' },
        { label: 'Standard utility programs', sub: 'shell, editors, compilers · ↓ library interface', tone: 'ok' },
        { label: 'Standard library', sub: 'open, close, read, write, fork · ↓ system call interface', tone: 'acc' },
        { label: 'UNIX operating system (monolithic kernel)', sub: 'process mgmt, memory mgmt, file system, I/O', tone: 'warn' },
        { label: 'Hardware', sub: 'CPU, memory, disks, terminals', tone: 'muted' }] } }],
      exam: 'Порядок слоёв и интерфейсов между ними; какой слой в kernel mode.'
    },
    {
      id: 'file-oriented',
      h: 'File-oriented approach: «всё есть файл»',
      html: `
<ul>
  <li><b>Device drivers</b> работают как часть kernel и <b>напрямую недоступны</b> user processes.</li>
  <li>Linux даёт механизм общения процесса с driver (а через него — с hardware) через <b>file-like objects</b>: они появляются в файловой системе, их можно открывать, читать и писать в них практически как в обычные файлы.</li>
</ul>
<p><b>Linux I/O</b>:</p>
<ul>
  <li><b>Все I/O devices представлены как файлы</b>; каталог <code>/dev</code> — место, куда загружены все device files системы:
    <ul><li><code>/dev/sda2</code> — раздел диска (например, для <code>/usr</code>);</li><li><code>/dev/tty2</code> — terminal.</li></ul>
  </li>
  <li>Элегантное отображение файлов на устройства позволяет kernel экспортировать простой интерфейс — <b>Unix I/O</b>.</li>
  <li>Главная идея: весь ввод-вывод обрабатывается <b>единообразно (consistent and uniform)</b>.</li>
</ul>`,
      viz: [{ name: 'flow', caption: 'Путь запроса от процесса к устройству', props: { dir: 'h', steps: [
        { label: 'User process', sub: 'open/read/write' },
        { label: '/dev/… file', sub: 'file-like object', tone: 'acc' },
        { label: 'Device driver', sub: 'часть kernel', tone: 'warn' },
        { label: 'Hardware device', tone: 'muted' }] } }]
    },
    {
      id: 'io-ops',
      h: 'Basic Linux I/O operations',
      html: `
<table class="t">
  <tr><th>Операция</th><th>System calls</th></tr>
  <tr><td>Opening and closing files</td><td><code>open()</code>, <code>close()</code></td></tr>
  <tr><td>Reading and writing a file</td><td><code>read()</code>, <code>write()</code></td></tr>
  <tr><td>Changing the <b>current file position</b> (seek)</td><td><code>lseek()</code></td></tr>
</table>
<p><b>Current file position</b> — смещение в файле, с которого будет следующий read или write. Файл — последовательность байтов B<sub>0</sub>, B<sub>1</sub>, …, B<sub>k−1</sub>, B<sub>k</sub>, B<sub>k+1</sub>, …; при position = k следующая операция начнётся с B<sub>k</sub>.</p>`,
      viz: [{ name: 'flow', caption: 'Типичная последовательность вызовов', props: { dir: 'h', steps: [
        { label: 'open()', sub: 'получить fd', tone: 'acc' },
        { label: 'read() / write()', sub: 'position сдвигается' },
        { label: 'lseek()', sub: 'задать position = k', tone: 'warn' },
        { label: 'read() / write()', sub: 'с байта B_k' },
        { label: 'close()', tone: 'ok' }] } }]
    },
    {
      id: 'classes',
      h: 'Classes of devices: character, block, network',
      html: `
<table class="t">
  <tr><th></th><th>Block devices</th><th>Character devices</th><th>Network devices</th></tr>
  <tr><td>Абстракция</td><td><b>array of fixed-size blocks</b></td><td><b>stream of bytes</b></td><td><b>packets</b></td></tr>
  <tr><td>Доступ</td><td>random access, в любом порядке</td><td>последовательный, символ за символом</td><td>send/receive пакетов</td></tr>
  <tr><td>Буферизация</td><td><b>buffered I/O</b>: данные копятся в буфере до полного блока</td><td><b>unbuffered</b> (raw) передача</td><td>—</td></tr>
  <tr><td>Filesystem</td><td>может содержать filesystem</td><td>нет</td><td>нет</td></tr>
  <tr><td>В /dev</td><td>да (<code>b</code>)</td><td>да (<code>c</code>)</td><td><b>нет</b>, уникальные имена (<code>eth0</code>)</td></tr>
  <tr><td>Примеры</td><td>диски, разделы, CD-ROM</td><td>console, serial/parallel ports, terminals, sound</td><td>eth0</td></tr>
</table>`,
      exam: 'Три класса устройств и абстракция каждого; где buffered I/O; network devices не в /dev.'
    },
    {
      id: 'block',
      h: 'Block devices и разделы диска',
      html: `
<ul>
  <li>Block devices — <b>nonvolatile mass storage</b>, информация доступна <b>в любом порядке</b> (random access). Пример — disk drive.</li>
  <li>Абстракция: <b>массив блоков фиксированного размера</b>.</li>
  <li>Приложения могут обращаться к block device побайтно: в отличие от character devices, block device <b>всегда</b> позволяет программисту читать/писать блок <b>любого размера</b> (даже один символ/байт).</li>
  <li>Block и char devices <b>различаются только на уровне kernel</b>.</li>
  <li>Block device <b>может содержать filesystem</b>.</li>
  <li>Делают <b>buffered I/O</b>: данные собираются в буфере, пока не наберётся полный блок для передачи.</li>
</ul>
<p><b>Some common block devices</b> (имя, major, minor):</p>
<table class="t">
  <tr><th>Устройство</th><th>Файл</th><th>Major</th><th>Minor</th></tr>
  <tr><td>Primary IDE controller, master device</td><td><code>/dev/hda</code></td><td>3</td><td>0</td></tr>
  <tr><td>… master device, first partition</td><td><code>/dev/hda1</code></td><td>3</td><td>1</td></tr>
  <tr><td>Primary IDE controller, secondary device</td><td><code>/dev/hdb</code></td><td>3</td><td>64</td></tr>
  <tr><td>… secondary device, first partition</td><td><code>/dev/hdb1</code></td><td>3</td><td>65</td></tr>
  <tr><td>Secondary IDE controller, master / secondary</td><td><code>/dev/hdc</code>, <code>/dev/hdd</code></td><td>22</td><td>0, 64</td></tr>
  <tr><td>First SCSI drive</td><td><code>/dev/sda</code></td><td>8</td><td>0</td></tr>
  <tr><td>First SCSI drive, first partition</td><td><code>/dev/sda1</code></td><td>8</td><td>1</td></tr>
  <tr><td>Second SCSI disk</td><td><code>/dev/sdb</code></td><td>8</td><td>16</td></tr>
  <tr><td>Second SCSI disk, first partition</td><td><code>/dev/sdb1</code></td><td>8</td><td>17</td></tr>
  <tr><td>First / second SCSI CD-ROM drive</td><td><code>/dev/scd0</code>, <code>/dev/scd1</code></td><td>11</td><td>0, 1</td></tr>
</table>
<p><b>Disk devices</b>: жёсткий диск делится на разделы; каждый раздел адресуется своим device node, на разделе — filesystem, смонтированная в каталог.</p>
<div data-viz="0"></div>`,
      viz: [{ name: 'graph', caption: 'Physical → partition → filesystem layer (слайд «Disk Devices»)', props: { w: 600, h: 300, nodes: [
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
      exam: 'Свойства block devices (random access, buffered, filesystem); расшифровать sda / sda1 / sdb1 и их major/minor.'
    },
    {
      id: 'char',
      h: 'Character devices и terminals',
      html: `
<ul>
  <li>Character device files связаны с <b>character</b> или <b>raw</b> доступом к устройству.</li>
  <li>Примеры: text console (<code>/dev/console</code>), serial ports (<code>/dev/ttyS0</code>), parallel ports (<code>/dev/lp0</code>)…</li>
  <li>Абстракция: <b>stream of bytes</b>.</li>
  <li>Используются для <b>unbuffered</b> передачи: данные идут не блоками, а <b>символ за символом</b>; одна передача может состоять из нескольких символов.</li>
</ul>
<p><b>Some common character devices</b>:</p>
<table class="t">
  <tr><th>Устройство</th><th>Файл</th><th>Major</th><th>Minor</th></tr>
  <tr><td>Parallel port 0 / 1</td><td><code>/dev/lp0</code> (<code>/dev/par0</code>), <code>/dev/lp1</code></td><td>6</td><td>0, 1</td></tr>
  <tr><td>First / second serial port</td><td><code>/dev/ttyS0</code>, <code>/dev/ttyS1</code></td><td>4</td><td>64, 65</td></tr>
  <tr><td>IDE tape drive</td><td><code>/dev/ht0</code></td><td>37</td><td>0</td></tr>
  <tr><td>First / second SCSI tape drive</td><td><code>/dev/st0</code>, <code>/dev/st1</code></td><td>9</td><td>0, 1</td></tr>
  <tr><td>System console</td><td><code>/dev/console</code></td><td>5</td><td>1</td></tr>
  <tr><td>First / second virtual terminal</td><td><code>/dev/tty1</code>, <code>/dev/tty2</code></td><td>4</td><td>1, 2</td></tr>
  <tr><td>Process's current terminal device</td><td><code>/dev/tty</code></td><td>5</td><td>0</td></tr>
  <tr><td>Sound card</td><td><code>/dev/audio</code></td><td>14</td><td>4</td></tr>
</table>
<p><b>Terminals</b>:</p>
<ul>
  <li><b>tty</b> — native terminal device; backend — hardware или эмуляция в kernel.</li>
  <li><b>pty</b> (pseudo terminal device) — терминал, эмулируемый <b>другой программой</b> (xterm, screen, ssh).</li>
  <li><b>pts</b> — <b>slave</b> часть pty.</li>
</ul>`,
      exam: 'Character device = stream of bytes, unbuffered; tty vs pty vs pts.'
    },
    {
      id: 'network',
      h: 'Network devices',
      html: `
<ul>
  <li>Читают и пишут не байты, а <b>отправляют и получают packets</b>: каждый write отправляет пакет, каждый read получает пакет (если буфер слишком мал для пакета — пакет <b>теряется</b>).</li>
  <li>Имеют <b>уникальные имена</b> (например, <code>eth0</code>) и <b>отсутствуют в файловой системе /dev</b>.</li>
  <li>Сетевые приложения сложнее файловых: обмен данными идёт вызовами, аналогичными read и write, но для <b>установления соединения</b> нужно больше информации, чем просто имя файла.</li>
</ul>`
    },
    {
      id: 'filetypes',
      h: 'Linux file types',
      html: `
<table class="t">
  <tr><th>Тип</th><th>Символ в ls -l</th><th>Описание</th></tr>
  <tr><td><b>Regular file</b></td><td><code>-</code></td><td>данные пользователя/приложения (binary, text…); ОС ничего не знает о формате, кроме «sequence of bytes» — как main memory</td></tr>
  <tr><td><b>Directory file</b></td><td><code>d</code></td><td>файл с именами и расположением других файлов</td></tr>
  <tr><td><b>Character special</b> / <b>Block special</b></td><td><code>c</code> / <code>b</code></td><td>terminals — character special, disks — block special</td></tr>
  <tr><td><b>FIFO (named pipe)</b></td><td><code>p</code></td><td>для inter-process communication</td></tr>
  <tr><td><b>Symbolic link</b></td><td><code>l</code></td><td>ссылка на другой файл</td></tr>
  <tr><td><b>Socket</b></td><td><code>s</code></td><td>для сетевого взаимодействия между процессами</td></tr>
</table>`,
      exam: 'Символ типа в ls -l: - d c b p l s; терминал — c, диск — b.'
    },
    {
      id: 'dev-dir',
      h: '/dev, прямой доступ и special devices',
      html: `
<p><code>/dev</code> содержит полный набор character и block device entries для устройств, известных Linux:</p>
<pre class="code" data-lang="bash"># ls -lh /dev/
brw-r-----  1 root disk   8,   1 Apr 10  2006 /dev/sda1
crw-rw----  1 root tty    5,  12 Apr 10  2006 /dev/tty2</pre>
<ul>
  <li>Первый символ: <code>b</code> — block device, <code>c</code> — character device.</li>
  <li>Вместо размера — пара <b>major, minor</b> (<code>8, 1</code>).</li>
</ul>
<p><b>Direct access to character devices</b> — в них можно писать данные напрямую:</p>
<pre class="code" data-lang="bash">% cat document.txt &gt; /dev/lp0                      # на принтер (parallel port)
% cat /usr/share/sndconfig/sample.au &gt; /dev/audio   # на звуковую карту</pre>
<pre class="code" data-lang="c">int fd = open("/dev/lp0", O_WRONLY);
write(fd, buffer, buffer_length);
close(fd);</pre>
<p><b>Special devices</b>:</p>
<table class="t">
  <tr><th>Устройство</th><th>Поведение</th></tr>
  <tr><td><code>/dev/null</code></td><td>Linux <b>отбрасывает</b> всё, что в него записано; удобно как output-файл, когда вывод не нужен. <b>Чтение</b> из /dev/null всегда даёт <b>end-of-file</b></td></tr>
  <tr><td><code>/dev/zero</code></td><td>ведёт себя как <b>бесконечно длинный файл из нулевых байтов</b>: сколько ни читай — Linux «генерирует» достаточно 0</td></tr>
</table>
<pre class="code" data-lang="bash">% cp /dev/null empty-file      # чтение сразу даёт EOF → пустой файл
% ls -l empty-file             # размер 0
% hexdump /dev/zero
0x000000: 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
0x000010: 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
...</pre>`,
      exam: 'Расшифровать строку ls -l из /dev (b/c, major, minor); что делают запись в /dev/null и чтение из /dev/null и /dev/zero.'
    },
    {
      id: 'numbers',
      h: 'Device numbers и /proc',
      html: `
<p>Устройство идентифицируется <b>двумя числами</b> (видны в <code># ls -l /dev</code>):</p>
<table class="t">
  <tr><th>Число</th><th>Смысл</th></tr>
  <tr><td><b>major device number</b></td><td>указывает, <b>какому driver</b> соответствует устройство</td></tr>
  <tr><td><b>minor device number</b></td><td>различает <b>отдельные устройства или компоненты</b>, управляемые одним driver</td></tr>
</table>
<div class="formula">/dev/sda = 8,0 · /dev/sda1 = 8,1 · /dev/sdb = 8,16 · /dev/sdb1 = 8,17 → один driver (major 8), разные диски/разделы (minor)</div>
<p><b>/proc</b> — filesystem из иерархии special files, представляющих <b>текущее состояние kernel</b>.</p>
<ul>
  <li><code># cat /proc/devices</code> — character и block devices, сконфигурированные сейчас (без устройств, чьи modules не загружены); здесь видны <b>major number и имя</b> устройства.</li>
  <li><code># cat /proc/diskstats</code> — <b>I/O statistics of block devices</b>.</li>
</ul>
<pre class="code" data-lang="text">debian@debian:~$ cat /proc/diskstats
 254       0 vda 14319 5110 1276898 9489 2023 1400 287761 4558 0 9532 14173 ...
 254       1 vda1 185 254 11400 122 1 0 1 0 0 160 122 ...</pre>
<table class="t">
  <tr><th>#</th><th>Поле</th><th>#</th><th>Поле</th></tr>
  <tr><td>1</td><td>major number</td><td>8</td><td>writes completed</td></tr>
  <tr><td>2</td><td>minor number</td><td>9</td><td>writes merged</td></tr>
  <tr><td>3</td><td>device name</td><td>10</td><td>sectors written</td></tr>
  <tr><td>4</td><td>reads completed successfully</td><td>11</td><td>time spent writing (ms)</td></tr>
  <tr><td>5</td><td><b>reads merged</b> — read requests, объединённые в queue scheduler перед отправкой на физическое устройство</td><td>12</td><td>I/Os currently in progress</td></tr>
  <tr><td>6</td><td>sectors read</td><td>13</td><td>time spent doing I/Os (ms)</td></tr>
  <tr><td>7</td><td>time spent reading (ms)</td><td>14</td><td>weighted time spent doing I/Os (ms)</td></tr>
</table>`,
      exam: 'Major = driver, minor = конкретное устройство; где смотреть major numbers (/proc/devices); что в /proc/diskstats.'
    },
    {
      id: 'mount',
      h: 'Disks, filesystems и mounting',
      html: `
<ul>
  <li>Linux даёт низкоуровневый доступ к дискам через device nodes в <code>/dev</code>.</li>
  <li>Обычно диски <b>форматируют</b> filesystem и <b>монтируют</b> в каталог.</li>
  <li><b>mount</b> отображает root directory filesystem диска (или раздела) на <b>уже существующий</b> каталог — он называется <b>mount point</b>.</li>
  <li><b>umount</b> — отмонтировать filesystem от mount point.</li>
  <li><b>df</b> — отчёт об использовании filesystems и таблица смонтированных устройств.</li>
  <li>Mount позволяет <b>объединить две файловые системы в одну</b> (single directory hierarchy): (a) до mount у root FS есть пустой каталог <code>/mnt</code>; (b) после mount на его месте видно всё дерево второй FS.</li>
  <li><b>Mount point</b> — каталог (<code>directory</code>), к которому присоединено устройство (<code>device</code>): «directory known as device's mount point».</li>
</ul>
<pre class="code" data-lang="bash">shell&gt; sudo mount &lt;device&gt; &lt;directory&gt;   # attach device в иерархию в directory
shell&gt; sudo umount &lt;directory&gt;            # detach</pre>
<p><b>Viewing mount points</b>: <code>mount</code> без аргументов выводит текущие mount points, смонтированное устройство, тип filesystem и mount options:</p>
<pre class="code" data-lang="text">[elvis@station elvis]$ mount
/dev/hda3 on / type ext3 (rw)
none on /proc type proc (rw)
usbdevfs on /proc/bus/usb type usbdevfs (rw)
/dev/hda1 on /boot type ext3 (rw)
none on /dev/pts type devpts (rw,gid=5,mode=620)
none on /dev/shm type tmpfs (rw)</pre>
<ul>
  <li><code>/dev/hda3</code> — <b>root partition</b>; ext3 filesystem раздела <code>/dev/hda1</code> смонтирована в <code>/boot</code>.</li>
  <li>Device <b>none</b> — <b>virtual filesystems</b>: реализованы прямо в kernel и не существуют ни на каком физическом устройстве.</li>
</ul>
<p><b>Single directory hierarchy and mount points</b> (пример со слайда): root FS — на sda6; в <code>/home</code> смонтирован sda8, в <code>/home/mtk/test</code> — sda9, в <code>/windows/C</code> — sda1.</p>
<div data-viz="0"></div>`,
      viz: [{ name: 'tree', caption: 'Одна иерархия из четырёх filesystems; mount points выделены', props: { mono: true, root: { label: '/', note: 'sda6 file system (root)', tone: 'acc', children: [
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
      exam: 'Синтаксис mount <device> <directory>; mount без аргументов; device none = virtual FS; на каком FS лежит файл в иерархии.'
    },
    {
      id: 'modules',
      h: 'Device drivers и Loadable Kernel Modules (LKM)',
      html: `
<p><b>Linux device drivers (modules)</b>:</p>
<ul>
  <li>набор API-подпрограмм (обычно system calls) — интерфейс к hardware;</li>
  <li>скрывают implementation и hardware-specific детали от user program;</li>
  <li>управляют потоком данных между программой и устройством;</li>
  <li>используют <b>file interface metaphor</b>;</li>
  <li>самодостаточный компонент, который можно добавить/удалить из kernel — <b>LKM</b>.</li>
</ul>
<p><b>Loadable Kernel Module (LKM)</b>:</p>
<ul>
  <li>drivers можно собрать <b>статически</b> в kernel image или как <b>LKM</b>;</li>
  <li>LKM устанавливаются в kernel <b>во время работы</b> из user space и расширяют работающий kernel — <b>on the fly</b>, без перезагрузки ОС;</li>
  <li>файлы с расширением <b><code>.ko</code></b>, обычно в <code>/lib/modules/</code> или <code>/usr/lib/modules/</code>.</li>
</ul>
<table class="t">
  <tr><th>Для чего LKM</th><th>Суть</th></tr>
  <tr><td><b>Device drivers</b></td><td>driver для конкретного hardware; kernel общается с устройством, не зная деталей его работы</td></tr>
  <tr><td><b>Filesystem drivers</b></td><td>интерпретируют содержимое filesystem (файлы, ссылки…): ext2, MS-DOS, NFS</td></tr>
  <tr><td><b>System calls</b></td><td>через них user space обращается к ресурсам kernel (чтение файла, создание процесса…)</td></tr>
  <tr><td><b>Network drivers</b></td><td>интерпретируют network protocol, производят и потребляют потоки данных (например, IPX driver)</td></tr>
</table>
<p><b>Linux commands for modules</b>:</p>
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
<table class="t">
  <tr><th>Команда</th><th>Что делает</th></tr>
  <tr><td><code>lsmod</code></td><td>список загруженных modules: имя, Size, <b>Used by</b> — сколько раз module сейчас используется + список modules, которые ссылаются на него</td></tr>
  <tr><td><code>modinfo driver-name</code></td><td>подробная информация о module: filename, license, alias, <b>depends</b>, version…</td></tr>
  <tr><td><code>insmod</code></td><td>загрузить module из файла (зависимости не разрешает)</td></tr>
  <tr><td><code>rmmod</code></td><td>выгрузить module</td></tr>
  <tr><td><code>modprobe</code></td><td>загрузить/выгрузить module <b>вместе с зависимостями</b></td></tr>
</table>`,
      exam: 'Что такое LKM и зачем (4 вида); .ko в /lib/modules; lsmod (Used by), modinfo; modprobe vs insmod.'
    },
    {
      id: 'udev',
      h: 'udev, udevadm и hotplug',
      html: `
<ul>
  <li>LKM можно загружать из user space разными способами; <b>udev</b> — распространённый способ.</li>
  <li><b>udev</b> — generic <b>Device Manager</b>, работает как <b>daemon</b> и слушает <b>uevents</b>, которые kernel отправляет при инициализации нового устройства или удалении устройства.</li>
  <li>Получив уведомление, udev собирает информацию об устройстве из соответствующих записей в <code>/sys/</code>.</li>
  <li>Затем применяет все правила из <code>/etc/udev/rules.d/</code> и/или <code>/lib/udev/rules.d/</code> и решает: <b>какое имя</b> дать устройству, <b>какие symbolic links</b> создать (альтернативные имена), <b>какие команды</b> выполнить.</li>
  <li>После этого udev создаёт соответствующую запись в <code>/dev/</code>.</li>
</ul>
<pre class="code" data-lang="text">[maria@localhost ~]$ ls -l /etc/udev/rules.d/
totale 8
-rw-r--r--. 1 root root  67  4 ago  2020 69-vdo-start-by-dev.rules
-rw-r--r--. 1 root root 628 13 apr  2020 70-persistent-ipoib.rules</pre>
<ul>
  <li><b>VDO (Virtual Data Optimizer)</b> — при создании VDO volume указывается block device, на котором он строится.</li>
  <li><b>IPoIB</b> — IP network emulation layer поверх InfiniBand RDMA networks.</li>
</ul>
<p><b>udevadm</b> — инструмент управления устройствами: управляет device events и контролирует daemon <b>udevd</b>.</p>
<table class="t">
  <tr><th>Команда</th><th>Назначение</th></tr>
  <tr><td><code>udevadm [--debug] [--version] [--help]</code></td><td>общие опции</td></tr>
  <tr><td><code>udevadm info options</code></td><td>вывести все атрибуты устройства</td></tr>
  <tr><td><code>udevadm trigger [options]</code>, <code>udevadm settle [options]</code></td><td>(без пояснений на слайде)</td></tr>
  <tr><td><code>udevadm control command</code></td><td>изменить rules в daemon udevd</td></tr>
  <tr><td><code>udevadm monitor [options]</code></td><td>следить за всеми events устройств</td></tr>
  <tr><td><code>udevadm test [options] devpath</code></td><td>проверить udev rules в терминале (только для отладки)</td></tr>
</table>
<p><b>Hot connection: hotplug</b>:</p>
<ul>
  <li><b>hotplug</b> subsystem kernel динамически обрабатывает <b>добавление и удаление</b> устройств: загружает нужные drivers и создаёт device files.</li>
  <li>У kernel есть <b>база</b>, связывающая каждый <b>device id</b> с нужным driver (<b>major number</b>); она используется при загрузке системы (drivers для устройств на всех шинах) и при подключении hot-plugged устройства.</li>
  <li>При подключении base platform driver (<code>usb-core</code>, <code>pci</code>…) генерирует <b>uevent</b> с <code>ACTION</code> = <b>add</b> или <b>remove</b> и переменными окружения: <code>idVendor</code>, <code>idProduct</code>, name, subsystem…</li>
  <li>uevents получает daemon <b>udevd</b> в <b>user space</b> и применяет rules из <code>/etc/udev/rules.d/</code> и <code>/lib/udev/rules.d/</code>.</li>
</ul>`,
      viz: [{ name: 'flow', caption: 'Hotplug: от подключения устройства до записи в /dev', props: { dir: 'v', steps: [
        { label: 'Устройство подключено', sub: 'USB / PCI', tone: 'muted' },
        { label: 'Base platform driver (usb-core, pci)', sub: 'uevent: ACTION=add, idVendor, idProduct, subsystem', tone: 'warn' },
        { label: 'udevd (user space daemon)', sub: 'получает uevent, читает данные из /sys/', tone: 'acc' },
        { label: 'Rules', sub: '/etc/udev/rules.d/, /lib/udev/rules.d/ → имя, symlinks, команды, загрузка module', tone: 'c2' },
        { label: 'Запись в /dev/', sub: 'device file создан', tone: 'ok' }] } }],
      exam: 'Роль udev (daemon, uevents, /sys, rules, создание /dev entry); udevadm monitor/info/test; ACTION=add/remove при hotplug.'
    }
  ],
  terms: [
    { en: 'Monolithic kernel', ru: 'Монолитное ядро', def: 'Ядро, где process/memory management, file system и I/O (drivers) работают вместе в kernel mode.' },
    { en: 'System call interface', ru: 'Интерфейс системных вызовов', def: 'Граница между standard library (user mode) и ядром (kernel mode).' },
    { en: 'Device file', ru: 'Файл устройства', def: 'File-like object в /dev, через который процесс общается с driver и устройством.' },
    { en: 'Unix I/O', ru: 'Ввод-вывод Unix', def: 'Единообразный интерфейс open/close/read/write/lseek для файлов и устройств.' },
    { en: 'Current file position', ru: 'Текущая позиция', def: 'Смещение, с которого начнётся следующий read/write; меняется lseek().' },
    { en: 'Block device', ru: 'Блочное устройство', def: 'Random access, массив блоков фиксированного размера, buffered I/O, может содержать filesystem (диски).' },
    { en: 'Character device', ru: 'Символьное устройство', def: 'Stream of bytes, unbuffered, символ за символом (console, serial/parallel ports, tty).' },
    { en: 'Network device', ru: 'Сетевое устройство', def: 'Отправляет/принимает packets; уникальное имя (eth0), в /dev отсутствует.' },
    { en: 'tty / pty / pts', ru: 'Терминалы', def: 'tty — native terminal; pty — pseudo terminal, эмулируемый программой (xterm, ssh); pts — slave часть pty.' },
    { en: 'Major device number', ru: 'Старший номер', def: 'Указывает, какому driver соответствует устройство.' },
    { en: 'Minor device number', ru: 'Младший номер', def: 'Различает отдельные устройства/компоненты одного driver.' },
    { en: '/dev/null', ru: 'Пустое устройство', def: 'Отбрасывает записанные данные; чтение сразу даёт end-of-file.' },
    { en: '/dev/zero', ru: 'Источник нулей', def: 'Бесконечный поток нулевых байтов при чтении.' },
    { en: '/proc', ru: 'Файловая система процессов', def: 'Special files, отражающие текущее состояние kernel (/proc/devices, /proc/diskstats).' },
    { en: 'Mount point', ru: 'Точка монтирования', def: 'Существующий каталог, на который отображается root directory filesystem устройства.' },
    { en: 'mount / umount / df', ru: 'Монтирование', def: 'Подключить filesystem к каталогу / отключить / показать использование и смонтированные устройства.' },
    { en: 'Virtual filesystem (device none)', ru: 'Виртуальная ФС', def: 'Реализована прямо в kernel, без физического устройства (proc, devpts, tmpfs).' },
    { en: 'LKM', ru: 'Loadable Kernel Module', def: 'Модуль (.ko), загружаемый в работающий kernel из user space: drivers, filesystem drivers, system calls, network drivers.' },
    { en: 'lsmod / modinfo', ru: 'Просмотр модулей', def: 'lsmod — загруженные modules (Size, Used by); modinfo — сведения о module (filename, license, depends).' },
    { en: 'modprobe', ru: 'Загрузка с зависимостями', def: 'Загружает/выгружает module вместе с зависимостями (insmod/rmmod — без разрешения зависимостей).' },
    { en: 'udev', ru: 'Менеджер устройств', def: 'Daemon, слушающий uevents kernel; по данным /sys и rules создаёт записи в /dev.' },
    { en: 'uevent', ru: 'Событие устройства', def: 'Сообщение kernel о добавлении/удалении устройства (ACTION=add/remove, idVendor, idProduct…).' },
    { en: 'udevadm', ru: 'Утилита udev', def: 'Управляет device events и daemon udevd: info, monitor, control, test, trigger, settle.' },
    { en: 'hotplug', ru: 'Горячее подключение', def: 'Подсистема kernel для динамического добавления/удаления устройств с загрузкой drivers и созданием device files.' }
  ],
  questions: [
    { id: 'dev-01', type: 'single', q: 'Какой слой Linux работает в kernel mode?', options: ['Standard library (open, close, read, write, fork)', 'Standard utility programs (shell, editors, compilers)', 'UNIX operating system (process/memory management, file system, I/O)', 'Users'], answer: 2, explain: 'Ядро (monolithic kernel) — единственный слой в kernel mode; library и утилиты работают в user mode.', section: 'layers', diff: 1 },
    { id: 'dev-02', type: 'single', q: 'Через какой интерфейс Standard library обращается к ядру?', options: ['User interface', 'Library interface', 'System call interface', 'Hardware interface'], answer: 2, explain: 'Users → user interface → утилиты → library interface → standard library → system call interface → kernel.', section: 'layers', diff: 2 },
    { id: 'dev-03', type: 'tf', q: 'Device drivers работают как часть kernel, поэтому процессы общаются с ними через file-like objects в файловой системе.', answer: true, explain: 'Drivers напрямую недоступны user processes; доступ — через device files, которые открывают, читают и пишут как обычные файлы.', section: 'file-oriented', diff: 1 },
    { id: 'dev-04', type: 'single', q: 'Какой system call меняет current file position?', options: ['open()', 'read()', 'lseek()', 'close()'], answer: 2, explain: 'lseek() задаёт смещение для следующего read/write. read/write сдвигают позицию лишь как побочный эффект.', section: 'io-ops', diff: 1 },
    { id: 'dev-05', type: 'multi', q: 'Какие классы устройств выделяет Linux? (несколько ответов)', options: ['Character devices', 'Block devices', 'Network devices', 'Memory devices', 'Virtual devices'], answer: [0, 1, 2], explain: 'Classes of devices: character, block и network.', section: 'classes', diff: 1 },
    { id: 'dev-06', type: 'single', q: 'Какое сравнение block и character devices верно?', options: ['Block — stream of bytes, unbuffered; character — массив блоков, buffered', 'Block — массив блоков фиксированного размера, buffered I/O, может содержать filesystem; character — stream of bytes, unbuffered', 'Оба делают buffered I/O и содержат filesystem', 'Character devices обеспечивают random access, block — только последовательный'], answer: 1, explain: 'Block devices: random access, fixed-size blocks, buffered, могут хранить filesystem. Character: поток байтов, без буферизации.', section: 'block', diff: 2 },
    { id: 'dev-07', type: 'code', lang: 'bash', q: 'Что означают b, 8 и 1 в выводе?', code: '# ls -l /dev/sda1\nbrw-r----- 1 root disk 8, 1 Apr 10  2006 /dev/sda1', options: ['Block device; major 8 (driver), minor 1 (первый раздел первого SCSI-диска)', 'Binary file размером 8 KB, 1 link', 'Block device; 8 разделов, раздел 1 активен', 'Character device; minor 8, major 1'], answer: 0, explain: 'b — block device; для device files вместо размера стоит пара major, minor: 8 — SCSI disk driver, 1 — раздел sda1.', section: 'dev-dir', diff: 2 },
    { id: 'dev-08', type: 'single', q: 'Major device number указывает…', options: ['номер раздела на диске', 'какому driver соответствует устройство', 'размер блока устройства', 'номер шины'], answer: 1, explain: 'Major — driver; minor различает конкретные устройства/компоненты одного driver.', section: 'numbers', diff: 1 },
    { id: 'dev-09', type: 'code', lang: 'text', q: 'Почему у устройств одинаковый major, но разные minor?', code: 'brw-rw---- 1 root disk 8,  0 /dev/sda\nbrw-rw---- 1 root disk 8, 17 /dev/sdb1', options: ['Это одно и то же устройство', 'Ими управляет один SCSI disk driver (8); minor 17 = второй диск (16) + первый раздел', 'Major 8 — номер шины, minor — номер порта', 'Minor 17 — размер раздела в GB'], answer: 1, explain: 'Major 8 — один driver. По таблице: sda = 8,0, sdb = 8,16, sdb1 = 8,17 — minor различает диски и их разделы.', section: 'numbers', diff: 3 },
    { id: 'dev-10', type: 'multi', q: 'Что верно для network devices? (несколько ответов)', options: ['Отправляют и получают packets, а не байты', 'Имеют уникальные имена, например eth0', 'Отсутствуют в /dev', 'Доступны как /dev/eth0 и открываются open()', 'Если буфер read мал для пакета, пакет дочитывается позже'], answer: [0, 1, 2], explain: 'Network devices: packets, имена вроде eth0, не в /dev. Если буфер мал — пакет теряется.', section: 'network', diff: 2 },
    { id: 'dev-11', type: 'single', q: 'Что такое pty?', options: ['Native terminal device с hardware backend', 'Pseudo terminal, эмулируемый другой программой (xterm, screen, ssh)', 'Последовательный порт', 'Slave-часть терминала'], answer: 1, explain: 'tty — native terminal; pty — эмулируется программой; pts — slave часть pty.', section: 'char', diff: 2 },
    { id: 'dev-12', type: 'code', lang: 'bash', q: 'Что выведет последняя команда?', code: 'echo hi > /dev/null\ncat /dev/null | wc -c', options: ['0', '2', '3', 'hi'], answer: 0, explain: 'Запись в /dev/null отбрасывается, а чтение из /dev/null сразу даёт end-of-file → 0 байт.', section: 'dev-dir', diff: 1 },
    { id: 'dev-13', type: 'code', lang: 'bash', q: 'Что выведет команда?', code: 'head -c 4 /dev/zero | od -An -tx1', options: [' 00 00 00 00', 'Ничего: /dev/zero пуст', ' 30 30 30 30', 'Бесконечный вывод'], answer: 0, explain: '/dev/zero отдаёт сколько угодно нулевых байтов; head -c 4 берёт 4 байта 0x00. 0x30 — это символ «0», а не нулевой байт.', section: 'dev-dir', diff: 2 },
    { id: 'dev-14', type: 'single', q: 'Терминалы и диски — какие special files соответственно?', options: ['Character special и block special', 'Block special и character special', 'Оба character special', 'FIFO и socket'], answer: 0, explain: 'Terminals — character special (c), disks — block special (b).', section: 'filetypes', diff: 1 },
    { id: 'dev-15', type: 'single', q: 'Где посмотреть major number и имя сконфигурированных в данный момент устройств?', options: ['/proc/devices', '/etc/fstab', '/dev/major', '/proc/diskstats'], answer: 0, explain: '/proc/devices — character и block devices, сконфигурированные сейчас (без устройств, чьи modules не загружены). /proc/diskstats — I/O statistics.', section: 'numbers', diff: 2 },
    { id: 'dev-16', type: 'single', q: 'Как смонтировать раздел /dev/sdb1 в каталог /mnt/usb?', options: ['sudo mount /mnt/usb /dev/sdb1', 'sudo mount /dev/sdb1 /mnt/usb', 'sudo umount /dev/sdb1 /mnt/usb', 'sudo df /dev/sdb1 /mnt/usb'], answer: 1, explain: 'Синтаксис: mount device directory (сначала устройство, потом каталог); каталог становится mount point. umount — отмонтировать, df — использование FS.', section: 'mount', diff: 1 },
    { id: 'dev-17', type: 'code', lang: 'text', q: 'Вывод mount без аргументов. Почему для /proc указан device none?', code: '/dev/hda3 on / type ext3 (rw)\nnone on /proc type proc (rw)\n/dev/hda1 on /boot type ext3 (rw)', options: ['Раздел /proc не смонтирован', 'Это virtual filesystem: реализована kernel и не существует на физическом устройстве', '/proc лежит на том же разделе, что и /', 'Device отключён udev'], answer: 1, explain: 'none = virtual filesystems, реализованные kernel. /dev/hda3 — root partition, /dev/hda1 смонтирован в /boot.', section: 'mount', diff: 2 },
    { id: 'dev-18', type: 'single', q: 'Root FS — на sda6, в /home смонтирован sda8, в /home/mtk/test — sda9. На какой filesystem находится файл /home/mtk/test/copy.c?', options: ['sda6', 'sda8', 'sda9', 'sda1'], answer: 2, explain: 'Решает ближайший mount point вверх по пути: /home/mtk/test → sda9 (он перекрывает sda8 для этого поддерева).', section: 'mount', diff: 3 },
    { id: 'dev-19', type: 'multi', q: 'Для чего используются Loadable Kernel Modules? (несколько ответов)', options: ['Device drivers', 'Filesystem drivers', 'System calls', 'Network drivers', 'Shell scripts пользователя'], answer: [0, 1, 2, 3], explain: 'Слайд «What LKMs are used for»: device drivers, filesystem drivers, system calls, network drivers. Scripts выполняются в user space.', section: 'modules', diff: 2 },
    { id: 'dev-20', type: 'code', lang: 'text', q: 'Фрагмент вывода lsmod. Что означает 7 в строке snd_seq?', code: 'Module                  Size  Used by\nsnd_seq                90112  7 snd_seq_dummy\nsnd_seq_dummy          16384  0', options: ['Версия module', 'Сколько раз module сейчас используется', 'Число зависимостей module', 'Major number'], answer: 1, explain: 'Used by: число текущих использований; рядом — modules, которые ссылаются на этот (snd_seq_dummy).', section: 'modules', diff: 2 },
    { id: 'dev-21', type: 'single', q: 'Какая команда загружает kernel module вместе с его зависимостями?', options: ['insmod', 'lsmod', 'modinfo', 'modprobe'], answer: 3, explain: 'modprobe разрешает зависимости (depends). insmod загружает один файл модуля, lsmod — список, modinfo — сведения о module.', section: 'modules', diff: 2 },
    { id: 'dev-22', type: 'single', q: 'Где обычно хранятся LKM и какое у них расширение?', options: ['/dev, .dev', '/lib/modules или /usr/lib/modules, .ko', '/etc/udev/rules.d, .rules', '/proc/modules, .so'], answer: 1, explain: 'Software с расширением .ko в /lib/modules/ или /usr/lib/modules/. .rules — правила udev.', section: 'modules', diff: 1 },
    { id: 'dev-23', type: 'single', q: 'Что такое udev?', options: ['Утилита для форматирования дисков', 'Generic device manager — daemon, слушающий uevents kernel о новых и удалённых устройствах', 'Character device для USB', 'Filesystem driver'], answer: 1, explain: 'udev получает uevents, читает данные из /sys/, применяет rules и создаёт записи в /dev/.', section: 'udev', diff: 1 },
    { id: 'dev-24', type: 'single', q: 'Какая подкоманда udevadm позволяет следить за всеми событиями устройств?', options: ['udevadm info', 'udevadm monitor', 'udevadm control', 'udevadm test'], answer: 1, explain: 'monitor — все events; info — атрибуты устройства; control — изменить rules в udevd; test — отладка rules.', section: 'udev', diff: 2 },
    { id: 'dev-25', type: 'single', q: 'Подключили USB-устройство. В каком порядке идут события?', options: ['udevd создаёт /dev entry → kernel генерирует uevent → driver загружается', 'Base platform driver (usb-core) генерирует uevent ACTION=add → udevd в user space получает его, читает /sys/ → применяет rules → создаёт запись в /dev/', 'Пользователь вызывает mount → kernel создаёт /dev entry → udev загружает rules', 'udevadm test → uevent → hotplug'], answer: 1, explain: 'uevent от base platform driver (ACTION=add, idVendor, idProduct…) → udevd собирает данные из /sys/ → rules (/etc/udev/rules.d/, /lib/udev/rules.d/) → имя, symlinks, команды → /dev.', section: 'udev', diff: 3 }
  ]
});
