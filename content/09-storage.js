OS.addModule({
  id: 'storage',
  num: 9,
  group: 'theory',
  title: 'Mass-Storage Systems',
  titleRu: 'Системы внешней памяти',
  icon: '💽',
  sources: ['10-MassStorageSystem.pdf'],
  summary: 'HDD (устройство, seek + rotational latency, расчёт I/O time), NVM/SSD и NAND flash (FTL, GC, wear leveling), disk scheduling FCFS/SSTF/SCAN/LOOK/C-SCAN/C-LOOK, storage attachment (NAS, cloud, SAN, arrays), RAID 0–6, 0+1/1+0, parity и ECC.',
  sections: [
    {
      id: 'overview',
      h: 'Overview of Mass Storage Structure',
      html: `
<ul>
  <li><b>Secondary storage</b> в современных компьютерах:
    <ul><li>как расширение main memory для оптимизации выполнения процессов;</li><li>для <b>постоянного</b> хранения программ и данных.</li></ul></li>
  <li><b>Storage class memory</b> может закрыть разрыв между быстрой рабочей памятью (volatile memory) и дешёвыми устройствами хранения (persistent memory, storage).</li>
  <li>Диски могут быть <b>removable</b>.</li>
  <li>Две технологии:
    <ul>
      <li><b>Magnetic</b> — <b>hard disk drives (HDDs)</b>;</li>
      <li><b>Electronic</b> — <b>nonvolatile memory (NVM)</b>: flash memory, NAND flash, <b>Solid-State Drives (SSD)</b>.</li>
    </ul></li>
</ul>
<p><b>Disks are I/O devices</b>: диск подключён к <b>I/O controller</b>, контроллеры — к общей шине <b>memory I/O bus</b> вместе с main memory; о завершении операций контроллеры сообщают процессору через <b>interrupts</b>.</p>`,
      viz: [{ name: 'layers', caption: 'Слайд «Disks are I/O devices»', props: { top: 'interrupts: от I/O controllers к Processor', layers: [
        { label: 'Processor → Cache', tone: 'acc' },
        { label: 'Memory I/O bus', sub: 'к шине подключены Main memory и I/O controllers', tone: 'warn' },
        { label: 'I/O controller | I/O controller | I/O controller', tone: 'c2' },
        { label: 'Disk, Disk | Graphics output | Network', tone: 'muted' }] } }]
    },
    {
      id: 'hdd',
      h: 'Hard Disk Drives (HDD): устройство и время доступа',
      html: `
<ul>
  <li><b>Platter</b> — магнитная пластина (обе поверхности рабочие); все пластины на одном <b>spindle</b>.</li>
  <li><b>Track</b> — концентрическая окружность на поверхности; делится на <b>sectors</b>.</li>
  <li><b>Cylinder</b> — набор треков, находящихся под головками при одном положении arm (на всех пластинах).</li>
  <li><b>Read-write head</b> — по одной на поверхность; закреплены на <b>arms</b>, которые двигает <b>arm assembly</b> (actuator).</li>
</ul>
<ul>
  <li>Магнитные диски — основная часть secondary storage.</li>
  <li>Диски вращаются <b>60–250 раз в секунду</b>; скорость — в <b>RPM</b> (rounds per minute): <b>7200, 10000, 15000 RPM</b>.</li>
  <li><b>Transfer rate</b> — скорость передачи данных между диском и компьютером (MB/s).</li>
  <li><b>Positioning time (access time) = seek time + rotational latency</b>:
    <ul>
      <li><b>seek time</b> — время перемещения arm к нужному <b>cylinder</b>;</li>
      <li><b>rotational latency</b> — время, пока нужный <b>sector</b> повернётся под головку.</li>
    </ul></li>
  <li><b>Head crash</b> — головка касается поверхности диска (повреждение).</li>
</ul>`,
      viz: [{ name: 'tree', caption: 'Иерархия HDD', props: { root: { label: 'HDD', children: [
        { label: 'spindle', note: 'вращает пластины (RPM)' },
        { label: 'platters', note: '3.5″, 2.5″, 1.8″', children: [
          { label: 'track', note: 'концентрическая окружность', children: [{ label: 'sector', note: 'наименьшая адресуемая часть трека' }] },
          { label: 'cylinder', note: 'треки при одном положении arm на всех пластинах' }] },
        { label: 'arm assembly', note: 'двигает arms → seek', children: [{ label: 'read-write heads', note: 'по одной на поверхность' }] }] } } }],
      exam: 'Определения track/sector/cylinder; access time = seek + rotational latency; что такое seek time и rotational latency.'
    },
    {
      id: 'hdd-perf',
      h: 'Hard Disk Performance: расчёт времени',
      html: `
<div class="cols">
<ul>
  <li><b>Platters</b>: обычно 3.5”, 2.5”, 1.8”.</li>
  <li><b>Storage size</b>: 30 GB – 4 TB на диск.</li>
  <li><b>Transfer rate</b>: 6 GB/sec в теории, 1 GB/sec на практике.</li>
  <li><b>Seek time</b>: 3–12 ms; 9 ms — типично для desktop.</li>
  <li><b>Rotation latency</b> зависит от скорости spindle.</li>
</ul>
<table class="t">
  <tr><th>Spindle [rpm]</th><th>Average latency [ms]</th></tr>
  <tr><td>4200</td><td>7.14</td></tr>
  <tr><td>5400</td><td>5.56</td></tr>
  <tr><td>7200</td><td>4.17</td></tr>
  <tr><td>10000</td><td>3</td></tr>
  <tr><td>15000</td><td>2</td></tr>
</table>
</div>
<div class="formula">Average latency = ½ оборота = 0.5 × 60 000 / RPM [ms] &nbsp;→&nbsp; 7200 RPM: 0.5 × 60 000 / 7200 = 4.17 ms</div>
<div class="formula">Average access time = average seek time + average latency<br>fastest disk: 3 ms + 2 ms = <b>5 ms</b> &nbsp;|&nbsp; slow disk: 9 ms + 5.56 ms = <b>14.56 ms</b></div>
<div class="formula">Average I/O time = average access time + (amount to transfer / transfer rate) + controller overhead</div>
<p><b>Example</b>: average I/O time для блока <b>4 KB</b>, диск <b>7200 RPM</b>, average seek <b>5 ms</b>, transfer rate <b>1 Gb/sec</b>, controller overhead <b>0.1 ms</b>:</p>
<div class="formula">= seek + latency + overhead + transfer = 5 ms + 4.17 ms + 0.1 ms + transfer<br>
transfer = 4 KB / 1 Gb/s = 32 Kb / (1024² Kb/s) = 32 / 1024² s ≈ <b>0.03 ms</b><br>
Average I/O time = 9.27 ms + 0.03 ms = <b>9.3 ms</b></div>
<div class="callout note">Время передачи ничтожно по сравнению с seek и latency — для HDD доминирует механика.</div>`,
      viz: [{ name: 'hddCalc', caption: 'Пример со слайда: 7200 RPM, seek 5 ms, 1 Gb/s, 4 KB, overhead 0.1 ms → 9.3 ms', props: { rpm: 7200, seek: 5, rateGbps: 1, kb: 4, overheadMs: 0.1 } }],
      exam: 'Посчитать average latency по RPM и average I/O time по формуле (пример 9.3 ms).'
    },
    {
      id: 'nvm',
      h: 'Nonvolatile Memory Devices и SSD',
      html: `
<ul>
  <li>NVM, устроенная «как диск», называется <b>Solid-State Disk (SSD)</b>.</li>
  <li>Другие формы: USB drives (thumb drive, flash drive), замена DRAM disk, распаянная на материнской плате память, основное хранилище смартфонов.</li>
</ul>
<div class="cols">
  <div class="pros"><b>+</b><ul><li>может быть <b>надёжнее</b> HDD</li><li><b>намного быстрее</b></li><li><b>нет движущихся частей</b> → нет seek time и rotational latency</li></ul></div>
  <div class="cons"><b>−</b><ul><li><b>дороже за MB</b></li><li>может иметь <b>более короткий срок жизни</b> — нужно аккуратное управление</li><li><b>меньше ёмкость</b></li><li>шины могут быть слишком медленными → подключение напрямую к <b>PCI</b></li></ul></div>
</div>
<p><b>NAND flash</b>: данные хранятся в пуле NAND flash, построенном на <b>floating gate transistors</b>. В отличие от транзисторов RAM, которые нужно обновлять (refresh) много раз в секунду, NAND <b>сохраняет заряд без питания</b> → это <b>non-volatile memory</b>.</p>`
    },
    {
      id: 'nand',
      h: 'NAND Flash: ограничения и алгоритмы контроллера',
      html: `
<p><b>Challenges</b>:</p>
<ul>
  <li>Данные сгруппированы в <b>pages</b>.</li>
  <li>Запись <b>не может перезаписать на месте (no overwrite in place)</b>: сначала нужно <b>стереть (erase)</b>, а стирание идёт крупными <b>blocks</b> из многих pages.</li>
  <li>Число стираний ограничено — <b>~100 000</b>, затем ячейка изнашивается.</li>
  <li>Срок жизни измеряется в <b>drive writes per day (DWPD)</b>: диск 1 TB с рейтингом 5 DWPD должен выдерживать запись <b>5 TB в день</b> в течение гарантийного срока.</li>
</ul>
<p><b>NAND Flash Controller Algorithms</b>:</p>
<table class="t">
  <tr><th>Механизм</th><th>Зачем</th></tr>
  <tr><td><b>Flash Translation Layer (FTL)</b></td><td>таблица: какие <b>logical blocks</b> валидны и где они физически лежат (т.к. без overwrite страницы содержат смесь valid/invalid данных)</td></tr>
  <tr><td><b>Garbage collection (GC)</b></td><td>освобождает место, занятое <b>invalid pages</b> (переносит valid pages, стирает block)</td></tr>
  <tr><td><b>Overprovisioning</b></td><td>резерв ёмкости — <b>рабочее пространство для GC</b></td></tr>
  <tr><td><b>Wear leveling</b></td><td>у каждой ячейки ограниченный ресурс → писать <b>равномерно во все ячейки</b></td></tr>
</table>
<p><b>NAND block with valid and invalid pages</b>:</p>
<table class="t">
  <tr><td>valid page</td><td>valid page</td><td><b>invalid page</b></td><td><b>invalid page</b></td></tr>
  <tr><td><b>invalid page</b></td><td>valid page</td><td><b>invalid page</b></td><td>valid page</td></tr>
</table>`,
      exam: 'Почему нельзя перезаписать на месте; роли FTL, GC, overprovisioning, wear leveling; DWPD.'
    },
    {
      id: 'fcfs',
      h: 'Disk Scheduling и FCFS',
      html: `
<ul>
  <li>Контроллеры дисков имеют небольшие буферы и управляют <b>очередью I/O-запросов</b> (разной «глубины»).</li>
  <li>Алгоритмы планирования определяют порядок обслуживания запросов; цель — уменьшить перемещение головки (seek).</li>
</ul>
<div class="formula">Пример со слайдов (цилиндры 0–199): queue = 98, 183, 37, 122, 14, 124, 65, 67; head starts at 53</div>
<p><b>First Come First Serve (FCFS)</b>:</p>
<ul>
  <li>запросы обслуживаются <b>последовательно</b>, в порядке поступления;</li>
  <li><b>справедлив</b> ко всем процессам;</li>
  <li>при большом числе процессов/запросов производительность приближается к <b>случайному</b> планированию;</li>
  <li>страдает от глобального <b>zigzag effect</b>.</li>
</ul>
<div class="formula">53 → 98 → 183 → 37 → 122 → 14 → 124 → 65 → 67<br>45 + 85 + 146 + 85 + 108 + 110 + 59 + 2 = <b>640 cylinders</b></div>`,
      viz: [{ name: 'diskSched', caption: 'FCFS: total head movement = 640', props: { queue: [98, 183, 37, 122, 14, 124, 65, 67], head: 53, max: 199, algo: 'FCFS', dir: 'down' } }],
      exam: 'Посчитать total head movement для FCFS (640).'
    },
    {
      id: 'sstf',
      h: 'Shortest Seek Time First (SSTF)',
      html: `
<ul>
  <li>Выбирает запрос с <b>минимальным seek time</b> от текущего положения головки.</li>
  <li>Также называется <b>Shortest Seek Distance First (SSDF)</b> — расстояния считать проще.</li>
  <li><b>Смещён в пользу средних цилиндров</b>.</li>
  <li>Форма <b>SJF</b> scheduling → может вызвать <b>starvation</b> некоторых запросов.</li>
</ul>
<div class="formula">53 → 65 → 67 → 37 → 14 → 98 → 122 → 124 → 183<br>12 + 2 + 30 + 23 + 84 + 24 + 2 + 59 = <b>236 cylinders</b></div>`,
      viz: [{ name: 'diskSched', caption: 'SSTF: total head movement = 236', props: { queue: [98, 183, 37, 122, 14, 124, 65, 67], head: 53, max: 199, algo: 'SSTF', dir: 'down' } }],
      exam: 'Порядок обслуживания и total для SSTF (236); почему возможен starvation.'
    },
    {
      id: 'scan-look',
      h: 'Elevator Algorithms: SCAN и LOOK',
      html: `
<p>Алгоритмы по принципу <b>лифта (elevator)</b>. Четыре комбинации: обслуживание в <b>обоих направлениях</b> или <b>только в одном</b>; движение <b>до последнего цилиндра</b> или <b>до последнего запроса</b>.</p>
<table class="t">
  <tr><th>Direction \\ Go until</th><th>last cylinder</th><th>last request</th></tr>
  <tr><td><b>Service both directions</b></td><td><b>SCAN</b></td><td><b>LOOK</b></td></tr>
  <tr><td><b>Service in only one direction</b></td><td><b>C-SCAN</b></td><td><b>C-LOOK</b></td></tr>
</table>
<p><b>SCAN</b>: arm стартует с одного конца диска и движется к другому, обслуживая запросы, <b>до самого края диска</b>; там направление меняется и обслуживание продолжается. Движется в обе стороны до обоих концов. <b>Справедливее к крайним цилиндрам</b>.</p>
<div class="formula">SCAN (головка движется к 0): 53 → 37 → 14 → <b>0</b> → 65 → 67 → 98 → 122 → 124 → 183<br>(53 − 0) + (183 − 0) = 53 + 183 = <b>236 cylinders</b></div>
<div class="callout warn">На слайде «Scan Example» написано <b>208</b>, но по его же рисунку головка доходит до цилиндра <b>0</b> → это <b>236</b>. Число <b>208</b> — это результат <b>LOOK</b> (разворот на 14, а не на 0).</div>
<div data-viz="0"></div>
<p><b>LOOK</b>: arm движется от первого запроса к <b>последнему запросу</b> в этом направлении (не до края диска), затем разворачивается. Склонен лучше обслуживать средние цилиндры.</p>
<div class="formula">LOOK (к 0): 53 → 37 → 14 → 65 → 67 → 98 → 122 → 124 → 183<br>(53 − 14) + (183 − 14) = 39 + 169 = <b>208 cylinders</b></div>
<div data-viz="1"></div>`,
      viz: [
        { name: 'diskSched', caption: 'SCAN к 0: total = 236 (на слайде ошибочно 208)', props: { queue: [98, 183, 37, 122, 14, 124, 65, 67], head: 53, max: 199, algo: 'SCAN', dir: 'down' } },
        { name: 'diskSched', caption: 'LOOK к 0: total = 208', props: { queue: [98, 183, 37, 122, 14, 124, 65, 67], head: 53, max: 199, algo: 'LOOK', dir: 'down' } }
      ],
      exam: 'Таблица 2×2 elevator-алгоритмов; total для SCAN (236 при движении к 0) и LOOK (208).'
    },
    {
      id: 'cscan-clook',
      h: 'C-SCAN и C-LOOK',
      html: `
<p><b>C-SCAN</b>: головка движется от одного конца диска к другому, обслуживая запросы; дойдя до края, <b>сразу возвращается в начало диска, не обслуживая запросы на обратном пути</b>.</p>
<ul>
  <li>Цилиндры — как <b>кольцевой список</b>: после последнего идёт первый.</li>
  <li>Даёт <b>более равномерное время ожидания</b>, чем SCAN: все цилиндры обслуживаются одинаково.</li>
</ul>
<div class="formula">C-SCAN (вверх, как на слайде): 53 → 65 → 67 → 98 → 122 → 124 → 183 → <b>199</b> ⇒ <b>0</b> → 14 → 37<br>
146 (53→199) + 199 (возврат 199→0) + 37 (0→37) = <b>382</b> с учётом возврата; <b>183</b> без возврата</div>
<div data-viz="0"></div>
<p><b>C-LOOK</b> — LOOK-версия C-SCAN: arm идёт только <b>до последнего запроса</b> в направлении, затем сразу переходит к самому дальнему запросу с другого конца, не доходя до края диска.</p>
<div class="formula">C-LOOK (вверх): 53 → 65 → 67 → 98 → 122 → 124 → 183 ⇒ 14 → 37<br>
130 (53→183) + 169 (переход 183→14) + 23 (14→37) = <b>322</b> с учётом перехода; <b>153</b> без него</div>
<div data-viz="1"></div>
<div class="callout key">В общем случае: <b>круговые (C-) версии справедливее</b>, но платят большим суммарным seek; <b>SCAN-версии</b> имеют больший total seek, чем соответствующие <b>LOOK-версии</b>.</div>
<div class="callout warn">На экзамене всегда уточняй, учитывается ли обратный переход (return) в total head movement для C-SCAN/C-LOOK.</div>`,
      viz: [
        { name: 'diskSched', caption: 'C-SCAN вверх: 382 с возвратом 199→0 (183 без него)', props: { queue: [98, 183, 37, 122, 14, 124, 65, 67], head: 53, max: 199, algo: 'C-SCAN', dir: 'up' } },
        { name: 'diskSched', caption: 'C-LOOK вверх: 322 с переходом 183→14 (153 без него)', props: { queue: [98, 183, 37, 122, 14, 124, 65, 67], head: 53, max: 199, algo: 'C-LOOK', dir: 'up' } }
      ],
      exam: 'Отличие C-SCAN от SCAN (возврат без обслуживания, равномерное ожидание); посчитать total с возвратом и без.'
    },
    {
      id: 'select',
      h: 'Selecting a Disk-Scheduling Algorithm',
      html: `
<ul>
  <li>Алгоритм планирования должен быть <b>отдельным модулем ОС</b>, чтобы его можно было заменить.</li>
  <li><b>SSTF</b> распространён и интуитивно привлекателен.</li>
  <li><b>SCAN и C-SCAN</b> лучше работают в системах с <b>высокой нагрузкой на диск</b>.</li>
  <li>Производительность зависит от <b>числа и типов запросов</b>.</li>
  <li>На запросы влияет <b>метод размещения файлов (file-allocation method)</b>.</li>
</ul>
<table class="t">
  <tr><th>Алгоритм</th><th>Total (head 53)</th><th>Особенность</th></tr>
  <tr><td>FCFS</td><td>640</td><td>честный, zigzag</td></tr>
  <tr><td>SSTF</td><td>236</td><td>форма SJF, starvation, любит середину</td></tr>
  <tr><td>SCAN (к 0)</td><td>236</td><td>до края диска, обе стороны</td></tr>
  <tr><td>LOOK (к 0)</td><td>208</td><td>до последнего запроса, обе стороны</td></tr>
  <tr><td>C-SCAN (вверх)</td><td>382 / 183 без возврата</td><td>одна сторона, равномерное ожидание</td></tr>
  <tr><td>C-LOOK (вверх)</td><td>322 / 153 без перехода</td><td>одна сторона, до последнего запроса</td></tr>
</table>`
    },
    {
      id: 'attachment',
      h: 'Storage Attachment: host-attached, NAS, cloud',
      html: `
<p>Компьютеры обращаются к хранилищу тремя способами: <b>host-attached</b>, <b>network-attached</b>, <b>cloud</b>.</p>
<p><b>Host-attached</b> — через локальные I/O ports:</p>
<ul>
  <li>для множества устройств — storage busses: <b>SATA, USB, FireWire, Thunderbolt</b>;</li>
  <li>high-end системы (серверы) — <b>Fibre Channel (FC)</b>: высокоскоростная последовательная архитектура по оптике или меди; к <b>FC fabric</b> подключаются много хостов и устройств.</li>
</ul>
<p><b>Network-Attached Storage (NAS)</b> — хранилище, доступное <b>по сети</b>, а не по локальному соединению (шине):</p>
<ul>
  <li>удалённое подключение <b>файловых систем</b> (file system based);</li>
  <li>реализуется через <b>remote procedure calls (RPCs)</b> между хостом и хранилищем поверх <b>TCP или UDP</b> в IP-сети;</li>
  <li><b>lock functions</b> ограничивают доступ;</li>
  <li>нужна <b>Network Operating System</b>; протоколы: <b>NFS</b> (Network File System, Unix) и <b>SMB</b> (Server Message Block, Windows).</li>
</ul>
<div class="cols">
  <div class="pros"><b>+</b><ul><li>общая (shared) массовая память</li><li>единообразное управление данными</li></ul></div>
  <div class="cons"><b>−</b><ul><li>низкая производительность</li><li>нет прозрачности для конечных пользователей</li></ul></div>
</div>
<p><b>Cloud Storage</b>:</p>
<ul>
  <li>как NAS, даёт доступ к хранилищу по сети, но — через <b>Internet или WAN</b> к удалённому data center; <b>прозрачен</b> для пользователей;</li>
  <li>NAS выглядит как ещё одна файловая система, а cloud storage — <b>API based</b>: программы обращаются через API;</li>
  <li>примеры: <b>Dropbox, Amazon S3, Microsoft OneDrive, Apple iCloud</b>;</li>
  <li>API используются из-за <b>latency и сценариев отказов</b> — протоколы NAS там работали бы плохо.</li>
</ul>`,
      exam: 'Три способа подключения; NAS = RPC поверх TCP/UDP, NFS/SMB, file-based; cloud = API через WAN.'
    },
    {
      id: 'san',
      h: 'Storage Area Network (SAN) и Storage Array',
      html: `
<ul>
  <li><b>SAN</b> распространена в больших хранилищах: <b>много хостов подключены ко многим storage arrays</b> — гибко.</li>
  <li>SAN — один или несколько storage arrays, подключённых к одному или нескольким <b>Fibre Channel switches</b> или сети <b>InfiniBand (IB)</b>; хосты тоже подключаются к коммутаторам.</li>
  <li>Легко добавить/убрать хранилище, добавить новый хост и выделить ему место.</li>
</ul>
<div data-viz="0"></div>
<p><b>Storage Array</b>:</p>
<ul>
  <li>можно подключать просто диски или <b>массивы дисков</b>; избегает недостатка NAS — не тратит пропускную способность сети;</li>
  <li>имеет <b>controller(s)</b> и предоставляет функции подключённым хостам: ports для хостов, память, управляющее ПО (иногда NVRAM);</li>
  <li>общее хранилище → выше эффективность;</li>
  <li>функции, как у некоторых файловых систем: <b>snapshots, clones, thin provisioning, replication, deduplication</b>; комбинация <b>SSD + HDD</b>.</li>
</ul>
<table class="t">
  <tr><th></th><th>NAS</th><th>SAN</th></tr>
  <tr><td>Fabric</td><td>TCP/IP сети, чаще всего Ethernet</td><td>высокоскоростные Fibre Channel сети</td></tr>
  <tr><td>Data processing</td><td><b>file-based</b> данные</td><td><b>block</b> данные</td></tr>
  <tr><td>Protocols</td><td>подключается прямо к Ethernet; NFS, SMB/CIFS, HTTP</td><td><b>SCSI</b> для связи с серверами</td></tr>
  <tr><td>Performance</td><td>ниже throughput, выше latency (медленный слой файловой системы)</td><td>выше — для сред с высокоскоростным трафиком</td></tr>
  <tr><td>Scalability</td><td>entry-level плохо масштабируются; high-end — до петабайт кластерами/scale-out</td><td>главное преимущество: scale-up и scale-out</td></tr>
  <tr><td>Ease of management</td><td>проще: подключается к LAN, простой интерфейс</td><td>требует больше администрирования</td></tr>
  <tr><td>Price</td><td>обычно дешевле (high-end NAS дороже entry-level SAN)</td><td>сложнее в управлении, особенно FC SAN</td></tr>
</table>`,
      viz: [{ name: 'graph', caption: 'Storage Area Network: хранилища — в SAN, клиенты — в LAN/WAN', props: {
        w: 660, h: 320,
        nodes: [
          { id: 'sa1', label: 'storage array', x: 70, y: 60 },
          { id: 'sa2', label: 'storage array', x: 70, y: 160 },
          { id: 'tl', label: 'tape library', x: 70, y: 260 },
          { id: 'san', label: 'SAN', x: 230, y: 160, shape: 'pill', tone: 'acc' },
          { id: 's1', label: 'server', x: 390, y: 40 },
          { id: 's2', label: 'server', x: 390, y: 115 },
          { id: 'dpc', label: 'data-processing center', x: 390, y: 205, w: 160 },
          { id: 'wcp', label: 'web content provider', x: 390, y: 285, w: 160 },
          { id: 'lan', label: 'LAN/WAN', x: 570, y: 100, shape: 'pill', tone: 'c2' },
          { id: 'cl', label: 'clients', x: 590, y: 250 }],
        edges: [
          { from: 'sa1', to: 'san', both: true }, { from: 'sa2', to: 'san', both: true }, { from: 'tl', to: 'san', both: true },
          { from: 'san', to: 's1', both: true }, { from: 'san', to: 's2', both: true }, { from: 'san', to: 'dpc', both: true }, { from: 'san', to: 'wcp', both: true },
          { from: 's1', to: 'lan', both: true }, { from: 's2', to: 'lan', both: true }, { from: 'dpc', to: 'lan', both: true }, { from: 'wcp', to: 'lan', both: true },
          { from: 'lan', to: 'cl', both: true }] } }],
      exam: 'NAS vs SAN: file vs block, Ethernet/TCP-IP vs Fibre Channel, NFS/SMB vs SCSI; функции storage array.'
    },
    {
      id: 'raid',
      h: 'RAID Structure: mirroring и striping',
      html: `
<ul>
  <li><b>RAID</b> — <b>redundant array of independent (inexpensive) disks</b>: несколько дисков дают надёжность через <b>redundancy</b>.</li>
  <li><b>Redundancy</b> — хранение «лишних» данных, уменьшающее потерю информации.</li>
  <li>Увеличивает <b>mean time to failure</b>.</li>
  <li><b>Mean time to repair</b> — время уязвимости, когда ещё один отказ может привести к потере данных.</li>
  <li><b>Mean time to data loss</b> — зависит от этих факторов.</li>
</ul>
<div class="cols">
<div>
<p><b>Mirroring</b> (Copy A = Copy B):</p>
<ul>
  <li>Write — в <b>оба</b> зеркала; Read — с <b>любого</b>.</li>
  <li><b>Стоимость байта удваивается</b>.</li>
  <li>Writes — <b>немного медленнее</b>; reads — <b>до 2× быстрее</b>.</li>
  <li>Надёжность резко возрастает.</li>
  <li>Когда диск сломался: сообщить администратору (beep, лампочка) → он ставит чистый диск → содержимое копируется с уцелевшего зеркала.</li>
</ul>
</div>
<div>
<p><b>Disk striping</b>:</p>
<ul>
  <li>Одна файловая система «нарезается» на части по нескольким дискам; при записи/чтении диски работают <b>параллельно (in tandem)</b> → время передачи заметно уменьшается.</li>
  <li><b>Stripe size</b>: bit, byte, sector.</li>
  <li>Каждый диск участвует в каждом чтении/записи.</li>
  <li><b>Latency</b> (время до первого байта) — <b>не меняется</b>.</li>
  <li><b>Throughput</b> (bytes/s) — растёт <b>линейно</b> с числом дисков → полезно для больших передач данных.</li>
</ul>
</div>
</div>
<div class="formula">Striping «Caffeine» по 4 дискам: Disk1 = C, e &nbsp;|&nbsp; Disk2 = a, i &nbsp;|&nbsp; Disk3 = f, n &nbsp;|&nbsp; Disk4 = f, e</div>
<table class="t">
  <tr><th>Mirroring</th><th>Striping</th></tr>
  <tr><td>повышает <b>надёжность</b>, но дорого</td><td>повышает <b>эффективность передачи</b>, но <b>не даёт надёжности</b></td></tr>
</table>
<div class="callout key">Сочетание mirroring и striping повышает и доступность данных, и производительность — ценой удвоения числа дисков.</div>`,
      exam: 'Mirroring: стоимость ×2, reads быстрее, writes чуть медленнее; striping: latency та же, throughput линейно растёт; MTTF/MTTR.'
    },
    {
      id: 'raid-levels',
      h: 'RAID Levels 0–6, 0+1, 1+0',
      html: `
<ul>
  <li>Disk striping использует группу дисков как <b>одно устройство хранения</b>.</li>
  <li>RAID организован в <b>уровни (levels)</b>; схемы RAID повышают производительность и надёжность за счёт избыточных данных.</li>
  <li><b>RAID 1</b> — mirroring (shadowing): дубликат каждого диска.</li>
  <li><b>Striped mirrors (RAID 1+0)</b> или <b>mirrored stripes (RAID 0+1)</b> — высокая производительность и высокая надёжность.</li>
  <li><b>Block interleaved parity (RAID 4, 5, 6)</b> — гораздо меньше избыточности.</li>
</ul>
<table class="t">
  <tr><th>Level</th><th>Схема</th><th>Избыточность</th><th>Переживает отказ</th></tr>
  <tr><td><b>RAID 0</b></td><td>block striping (Strip 0–3 по 4 дискам, далее 4–7…)</td><td>нет</td><td>0 дисков</td></tr>
  <tr><td><b>RAID 1</b></td><td>mirroring: 4 диска данных + 4 зеркала</td><td>100%</td><td>1 (в каждой паре)</td></tr>
  <tr><td><b>RAID 2</b></td><td>bit-level striping + Hamming ECC (Bit 1–7 на 7 дисках)</td><td>ECC-диски</td><td>1</td></tr>
  <tr><td><b>RAID 3</b></td><td>bit-interleaved: Bit 1–4 + отдельный диск <b>Parity</b></td><td>1 диск</td><td>1</td></tr>
  <tr><td><b>RAID 4</b></td><td>block striping + <b>выделенный parity-диск</b> (P0-3, P4-7, P8-11)</td><td>1 диск</td><td>1</td></tr>
  <tr><td><b>RAID 5</b></td><td>block striping + <b>распределённый parity</b> (по всем дискам)</td><td>1 диск</td><td>1</td></tr>
  <tr><td><b>RAID 6</b></td><td>как RAID 5, но <b>два</b> блока избыточности (P + Q, например Reed-Solomon)</td><td>2 диска</td><td>2</td></tr>
  <tr><td><b>RAID 0+1</b></td><td><b>mirrored stripes</b>: страйп-набор, затем зеркало всего набора</td><td>100%</td><td>1 гарантированно</td></tr>
  <tr><td><b>RAID 1+0</b></td><td><b>striped mirrors</b>: зеркальные пары, затем striping по парам</td><td>100%</td><td>1 гарантированно (по одному в каждой паре)</td></tr>
</table>
<p><b>RAID 5</b> со слайда (5 дисков) — parity «вращается» по дискам:</p>
<table class="t">
  <tr><th>Disk 0</th><th>Disk 1</th><th>Disk 2</th><th>Disk 3</th><th>Disk 4</th></tr>
  <tr><td>Strip 0</td><td>Strip 1</td><td>Strip 2</td><td>Strip 3</td><td><b>P0-3</b></td></tr>
  <tr><td>Strip 4</td><td>Strip 5</td><td>Strip 6</td><td><b>P4-7</b></td><td>Strip 7</td></tr>
  <tr><td>Strip 8</td><td>Strip 9</td><td><b>P8-11</b></td><td>Strip 10</td><td>Strip 11</td></tr>
  <tr><td>Strip 12</td><td><b>P12-15</b></td><td>Strip 13</td><td>Strip 14</td><td>Strip 15</td></tr>
  <tr><td><b>P16-19</b></td><td>Strip 16</td><td>Strip 17</td><td>Strip 18</td><td>Strip 19</td></tr>
</table>
<div class="callout note">RAID 4: каждая запись меняет parity на одном диске → он становится <b>узким местом</b>; RAID 5 распределяет parity и снимает эту проблему. Полезная ёмкость при N дисках: RAID 0 — N, RAID 1 — N/2, RAID 4/5 — N−1, RAID 6 — N−2.</div>
<ul>
  <li>RAID внутри storage array всё равно может отказать вместе с массивом → часто используют <b>автоматическую replication</b> данных между массивами.</li>
  <li>Обычно оставляют несколько <b>hot-spare</b> дисков: они автоматически заменяют отказавший диск, и данные перестраиваются на них.</li>
</ul>
<div data-viz="0"></div>`,
      viz: [
        { name: 'raid', caption: 'Раскладка блоков: переключай уровни 0, 1, 4, 5, 6, 0+1, 1+0 и смотри, где лежит parity', props: { level: 5, disks: 4 } }
      ],
      exam: 'Узнать уровень по описанию/картинке; RAID 4 vs 5 (выделенный vs распределённый parity); RAID 6 — 2 отказа; 0+1 vs 1+0; полезная ёмкость.'
    },
    {
      id: 'ecc',
      h: 'Error Detection and Correction: parity, ECC',
      html: `
<ul>
  <li>Фундаментальный аспект многих частей вычислительной техники: memory, networking, storage.</li>
  <li><b>Error detection</b> определяет, произошла ли проблема (например, <b>bit flipping</b>); если да — операцию можно остановить.</li>
  <li>Detection часто делается через <b>parity bit</b>; любой метод добавляет <b>redundant bits</b> к блоку данных.</li>
  <li>Самые распространённые методы: <b>Parity checking</b> и <b>Cyclic Redundancy Check (CRC)</b>.</li>
</ul>
<p><b>Parity</b> = XOR-«сумма» битов:</p>
<div class="formula">0 ⊕ 1 ⊕ 1 = 0 &nbsp;→&nbsp; correct: (011, 0) &nbsp;|&nbsp; incorrect: (011, 1)</div>
<ul>
  <li>Parity обеспечивает <b>обнаружение одиночной ошибки</b>: получатель видит, что что-то не так, но <b>не знает, какой бит</b>.</li>
  <li><b>Не обнаруживает ошибки в нескольких битах</b> (чётное число переворотов сохраняет parity).</li>
</ul>
<p><b>ECC = error correcting code</b> («super parity»):</p>
<ul>
  <li>code word + <b>несколько</b> «parity» битов, вычисляемых по данным («mysterious math»): <b>Hamming code, Reed-Solomon code</b>;</li>
  <li>может <b>обнаружить N</b> многобитовых ошибок и <b>исправить M &lt; N</b>.</li>
</ul>
<p><b>Parity revisited</b> — parity даёт <b>исправление одного стирания (single erasure correction)</b>:</p>
<ul>
  <li><b>Erasure channel</b> «знает, что не знает»: каждый бит — 0, 1 или «don't know»;</li>
  <li>отправлено (0 1 1 , 0); получено (0 ? 1 , 0) → <b>? = 0 ⊕ 1 ⊕ 0 = 1</b>.</li>
</ul>
<div class="callout key">Именно так работает RAID с parity: отказавший диск — это «стирание» (известно, <b>какой</b> диск пропал), его содержимое = XOR остальных.</div>
<p><b>ECC example</b> — три байта:</p>
<div class="cols">
<pre class="code" data-lang="text">a) 01100011  XOR
b) 10101010  XOR
c) 11001010  =
p) 00000011        /* parity */</pre>
<pre class="code" data-lang="text">/* если потерян a): */
p) 00000011  XOR
b) 10101010  XOR
c) 11001010  =
a) 01100011        /* восстановлен */</pre>
</div>`,
      exam: 'Посчитать parity XOR; восстановить потерянный байт/бит по parity; что parity не умеет (multi-bit, локализация).'
    },
    {
      id: 'features',
      h: 'Other Features: snapshot, replication, hot spare',
      html: `
<p>Независимо от того, где реализован RAID, можно добавить полезные функции:</p>
<table class="t">
  <tr><th>Функция</th><th>Что это</th></tr>
  <tr><td><b>Snapshot</b></td><td>вид файловой системы <b>до набора изменений</b> (на момент времени, point in time)</td></tr>
  <tr><td><b>Replication</b></td><td>автоматическое <b>дублирование записей между удалёнными площадками</b> — для redundancy и <b>disaster recovery</b>; бывает <b>synchronous</b> и <b>asynchronous</b></td></tr>
  <tr><td><b>Hot spare disk</b></td><td>неиспользуемый диск, который RAID <b>автоматически</b> берёт вместо отказавшего и перестраивает на нём RAID set; <b>уменьшает mean time to repair</b></td></tr>
</table>
<p>Также у storage arrays: <b>clones, thin provisioning, deduplication</b>.</p>`,
      exam: 'Snapshot vs replication (sync/async); почему hot spare уменьшает MTTR.'
    }
  ],
  terms: [
    { en: 'HDD', ru: 'Жёсткий диск', def: 'Магнитный накопитель: пластины на шпинделе, головки на подвижных arms.' },
    { en: 'NVM', ru: 'Энергонезависимая память', def: 'Электронное хранилище (flash, NAND, SSD) без движущихся частей.' },
    { en: 'Track / Sector / Cylinder', ru: 'Дорожка / сектор / цилиндр', def: 'Track — окружность на пластине; sector — её часть; cylinder — треки при одном положении arm на всех пластинах.' },
    { en: 'Seek time', ru: 'Время позиционирования', def: 'Время перемещения arm к нужному цилиндру.' },
    { en: 'Rotational latency', ru: 'Задержка вращения', def: 'Время, пока нужный сектор повернётся под головку; в среднем ½ оборота.' },
    { en: 'Positioning (access) time', ru: 'Время доступа', def: 'Seek time + rotational latency.' },
    { en: 'Transfer rate', ru: 'Скорость передачи', def: 'Скорость потока данных между диском и компьютером.' },
    { en: 'Head crash', ru: 'Авария головки', def: 'Головка касается поверхности диска.' },
    { en: 'SSD', ru: 'Твердотельный диск', def: 'NVM в форме диска: быстрее, без seek/latency, дороже за MB, ограниченный ресурс записи.' },
    { en: 'FTL', ru: 'Flash Translation Layer', def: 'Таблица контроллера NAND: какие logical blocks валидны и где лежат.' },
    { en: 'Garbage collection', ru: 'Сборка мусора', def: 'Освобождение места invalid pages в NAND (перенос valid + erase block).' },
    { en: 'Overprovisioning', ru: 'Резерв ёмкости', def: 'Скрытая часть flash — рабочее пространство для GC.' },
    { en: 'Wear leveling', ru: 'Выравнивание износа', def: 'Равномерная запись во все ячейки, т.к. у каждой ограниченное число стираний.' },
    { en: 'DWPD', ru: 'Drive writes per day', def: 'Сколько полных объёмов диска в день можно записывать в течение гарантии.' },
    { en: 'SSTF', ru: 'Shortest Seek Time First', def: 'Обслуживать ближайший к головке запрос; форма SJF, возможен starvation.' },
    { en: 'SCAN / LOOK', ru: 'Лифт', def: 'Головка движется в обе стороны: SCAN — до края диска, LOOK — до последнего запроса.' },
    { en: 'C-SCAN / C-LOOK', ru: 'Круговой лифт', def: 'Обслуживание в одном направлении, затем быстрый возврат к началу без обслуживания.' },
    { en: 'NAS', ru: 'Network-Attached Storage', def: 'Хранилище по сети (RPC поверх TCP/UDP), file-based; NFS, SMB.' },
    { en: 'SAN', ru: 'Storage Area Network', def: 'Сеть хранения (Fibre Channel / InfiniBand) между хостами и storage arrays; block-level.' },
    { en: 'Cloud storage', ru: 'Облачное хранилище', def: 'Доступ к удалённому data center через Internet/WAN по API.' },
    { en: 'RAID', ru: 'Избыточный массив дисков', def: 'Redundant array of independent (inexpensive) disks — надёжность и производительность через избыточность.' },
    { en: 'Mirroring', ru: 'Зеркалирование', def: 'Каждый диск дублируется (RAID 1): стоимость ×2, высокая надёжность.' },
    { en: 'Striping', ru: 'Чередование', def: 'Данные разрезаются по нескольким дискам: throughput растёт линейно, надёжности нет.' },
    { en: 'Parity', ru: 'Чётность', def: 'XOR битов: обнаруживает одиночную ошибку и исправляет одно стирание.' },
    { en: 'ECC', ru: 'Код коррекции ошибок', def: 'Несколько контрольных битов (Hamming, Reed-Solomon): обнаруживает N и исправляет M < N ошибок.' },
    { en: 'Hot spare', ru: 'Горячий резерв', def: 'Запасной диск, автоматически заменяющий отказавший; уменьшает mean time to repair.' },
    { en: 'Snapshot', ru: 'Снимок', def: 'Вид файловой системы на момент времени до набора изменений.' },
    { en: 'Replication', ru: 'Репликация', def: 'Автоматическое дублирование записей между площадками (sync/async).' }
  ],
  questions: [
    { id: 'ms-01', type: 'single', q: 'Какие две технологии mass storage выделяются на слайдах?', options: ['Magnetic (HDD) и electronic (NVM)', 'Optical и magnetic tape', 'DRAM и SRAM', 'NAS и SAN'], answer: 0, explain: 'Two technologies: magnetic (hard disk drives) и electronic (nonvolatile memory: NAND flash, SSD). NAS/SAN — способы подключения.', section: 'overview', diff: 1 },
    { id: 'ms-02', type: 'single', q: 'Cylinder в HDD — это…', options: ['одна концентрическая окружность на поверхности', 'наименьшая адресуемая часть трека', 'набор треков, находящихся под головками при одном положении arm на всех пластинах', 'ось, вращающая пластины'], answer: 2, explain: 'Track — окружность, sector — часть трека, spindle — ось. Cylinder — «вертикальный» набор треков при одном положении arm.', section: 'hdd', diff: 1 },
    { id: 'ms-03', type: 'single', q: 'Positioning time (access time) HDD равно…', options: ['seek time + transfer time', 'seek time + rotational latency', 'rotational latency + controller overhead', 'transfer time + controller overhead'], answer: 1, explain: 'Positioning time = seek time (arm к цилиндру) + rotational latency (сектор под головку).', section: 'hdd', diff: 1 },
    { id: 'ms-04', type: 'single', q: 'Average rotational latency диска 7200 RPM ≈ ?', options: ['8.33 ms', '2 ms', '4.17 ms', '5.56 ms'], answer: 2, explain: 'Один оборот = 60 000 / 7200 = 8.33 ms; среднее — половина оборота = 4.17 ms. 5.56 — для 5400 RPM, 2 — для 15000.', section: 'hdd-perf', diff: 2 },
    { id: 'ms-05', type: 'single', q: 'Самый быстрый диск со слайда: average seek 3 ms, 15000 RPM. Average access time = ?', options: ['3 ms', '5 ms', '14.56 ms', '4.17 ms'], answer: 1, explain: 'Average latency при 15000 RPM = 0.5 × 60 000 / 15 000 = 2 ms; 3 + 2 = 5 ms. 14.56 ms — медленный диск (9 + 5.56).', section: 'hdd-perf', diff: 2 },
    { id: 'ms-06', type: 'single', q: 'Пример со слайда: блок 4 KB, 7200 RPM, average seek 5 ms, 1 Gb/s, controller overhead 0.1 ms. Average I/O time = ?', options: ['9.27 ms', '9.3 ms', '5.1 ms', '14.56 ms'], answer: 1, explain: '5 + 4.17 + 0.1 = 9.27 ms плюс transfer ≈ 0.03 ms → 9.3 ms. 9.27 — если забыть время передачи.', section: 'hdd-perf', diff: 2 },
    { id: 'ms-07', type: 'single', q: 'Время передачи блока 4 KB при transfer rate 1 Gb/s (как на слайде, 1 Gb = 1024² Kb) ≈ ?', options: ['0.03 ms', '4 ms', '0.3 ms', '0.004 ms'], answer: 0, explain: '4 KB = 32 Kb; 32 / 1024² s ≈ 3.05 × 10⁻⁵ s ≈ 0.03 ms.', section: 'hdd-perf', diff: 3 },
    { id: 'ms-08', type: 'single', q: 'Диск 10000 RPM, average seek 4 ms, блок 4 KB при 1 Gb/s, controller overhead 0.1 ms. Average I/O time ≈ ?', options: ['10.13 ms', '4.13 ms', '9.3 ms', '7.13 ms'], answer: 3, explain: 'Latency = 0.5 × 60 000 / 10 000 = 3 ms. 4 + 3 + 0.1 + 0.03 ≈ 7.13 ms.', section: 'hdd-perf', diff: 3 },
    { id: 'ms-09', type: 'multi', q: 'Какие утверждения о SSD верны по слайдам? (несколько ответов)', options: ['Нет seek time и rotational latency', 'Дороже за MB, чем HDD', 'Может иметь более короткий срок жизни', 'Больше ёмкость, чем у HDD', 'Нужно обновлять (refresh) много раз в секунду, как RAM'], answer: [0, 1, 2], explain: 'SSD: нет движущихся частей, дороже за MB, ограниченный ресурс, меньше ёмкость. Refresh нужен RAM, а NAND хранит заряд без питания.', section: 'nvm', diff: 2 },
    { id: 'ms-10', type: 'single', q: 'Что отслеживает Flash Translation Layer (FTL)?', options: ['Число стираний каждого блока для гарантии', 'Какие logical blocks валидны и где они физически лежат', 'Очередь I/O-запросов контроллера', 'Температуру ячеек'], answer: 1, explain: 'Без overwrite in place страницы содержат смесь valid/invalid данных; FTL table отслеживает валидные logical blocks.', section: 'nand', diff: 2 },
    { id: 'ms-11', type: 'single', q: 'NAND-диск 1 TB с рейтингом 5 DWPD. Сколько данных в день можно записывать в течение гарантии?', options: ['1 TB', '200 GB', '5 TB', '100 000 TB'], answer: 2, explain: 'DWPD = drive writes per day: 5 × 1 TB = 5 TB в день.', section: 'nand', diff: 2 },
    { id: 'ms-12', type: 'single', q: 'queue = 98, 183, 37, 122, 14, 124, 65, 67; head = 53. Total head movement для FCFS = ?', options: ['236', '208', '640', '382'], answer: 2, explain: '45 + 85 + 146 + 85 + 108 + 110 + 59 + 2 = 640 cylinders.', section: 'fcfs', diff: 2 },
    { id: 'ms-13', type: 'single', q: 'Та же очередь, head = 53. Total head movement для SSTF = ?', options: ['236', '208', '640', '299'], answer: 0, explain: '53 → 65 → 67 → 37 → 14 → 98 → 122 → 124 → 183: 12 + 2 + 30 + 23 + 84 + 24 + 2 + 59 = 236.', section: 'sstf', diff: 2 },
    { id: 'ms-14', type: 'single', q: 'Главный недостаток SSTF:', options: ['Головка движется только в одну сторону', 'Всегда большее перемещение, чем у FCFS', 'Возможен starvation запросов (форма SJF), предпочтение средних цилиндров', 'Требует знать будущие запросы'], answer: 2, explain: 'SSTF — форма SJF: далёкие (крайние) запросы могут бесконечно откладываться.', section: 'sstf', diff: 2 },
    { id: 'ms-15', type: 'single', q: 'Elevator-алгоритм, который обслуживает запросы в обоих направлениях и разворачивается на последнем запросе (не на краю диска):', options: ['SCAN', 'C-SCAN', 'LOOK', 'C-LOOK'], answer: 2, explain: 'Both directions + until last request = LOOK. До last cylinder — SCAN; one direction — C-версии.', section: 'scan-look', diff: 1 },
    { id: 'ms-16', type: 'single', q: 'Та же очередь, head = 53, головка движется к 0. Total head movement для LOOK = ?', options: ['236', '299', '640', '208'], answer: 3, explain: '53 → 37 → 14, разворот, → 65 … 183: (53 − 14) + (183 − 14) = 39 + 169 = 208.', section: 'scan-look', diff: 2 },
    { id: 'ms-17', type: 'single', q: 'Та же очередь, head = 53, SCAN в сторону 0 (головка доходит до цилиндра 0, затем идёт вверх). Total head movement = ?', options: ['208', '236', '331', '640'], answer: 1, explain: '53 → 37 → 14 → 0 → 65 → … → 183: 53 + 183 = 236. Слайд пишет 208, но 208 — это LOOK (разворот на 14).', section: 'scan-look', diff: 3 },
    { id: 'ms-18', type: 'single', q: 'Та же очередь, head = 53, C-SCAN вверх (cylinders 0–199). Total head movement, если считать возврат 199 → 0?', options: ['183', '331', '382', '236'], answer: 2, explain: '53 → 199 = 146, возврат 199 → 0 = 199, затем 0 → 37 = 37: 146 + 199 + 37 = 382 (без возврата — 183).', section: 'cscan-clook', diff: 3 },
    { id: 'ms-19', type: 'single', q: 'Та же очередь, head = 53, C-LOOK вверх. Total head movement, если считать переход 183 → 14?', options: ['153', '322', '299', '382'], answer: 1, explain: '53 → 183 = 130, переход 183 → 14 = 169, 14 → 37 = 23: всего 322 (без перехода — 153).', section: 'cscan-clook', diff: 3 },
    { id: 'ms-20', type: 'single', q: 'Какие алгоритмы, по слайдам, лучше работают в системах с высокой нагрузкой на диск?', options: ['FCFS', 'SSTF', 'SCAN и C-SCAN', 'Только C-LOOK'], answer: 2, explain: 'SCAN and C-SCAN perform better for systems that place a heavy load on the disk. SSTF — common and natural appeal.', section: 'select', diff: 1 },
    { id: 'ms-21', type: 'single', q: 'Как реализован NAS?', options: ['Через SCSI поверх Fibre Channel', 'Через RPC между хостом и хранилищем поверх TCP или UDP (NFS, SMB)', 'Через локальную шину SATA', 'Через REST API к data center'], answer: 1, explain: 'NAS: remote procedure calls over TCP/UDP on IP network; протоколы NFS (Unix) и SMB (Windows). SCSI/FC — SAN, API — cloud.', section: 'attachment', diff: 1 },
    { id: 'ms-22', type: 'single', q: 'Чем cloud storage отличается от NAS?', options: ['Cloud доступен по Internet/WAN и работает через API, а NAS выглядит как ещё одна файловая система', 'Cloud подключается через SATA', 'NAS работает только через Internet', 'Cloud не требует сети'], answer: 0, explain: 'NAS presented as just another file system, cloud storage is API based — из-за latency и сценариев отказов в WAN.', section: 'attachment', diff: 2 },
    { id: 'ms-23', type: 'single', q: 'NAS vs SAN: какое сопоставление верно?', options: ['NAS — block data, SAN — file-based', 'NAS — file-based data по TCP/IP (Ethernet), SAN — block data по Fibre Channel (SCSI)', 'Оба работают только по Fibre Channel', 'NAS сложнее в управлении, чем SAN'], answer: 1, explain: 'По таблице слайда: NAS — file-based, Ethernet, NFS/SMB; SAN — block, Fibre Channel, SCSI, больше администрирования.', section: 'san', diff: 2 },
    { id: 'ms-24', type: 'single', q: 'Mirroring: как меняются стоимость и производительность?', options: ['Стоимость байта удваивается; reads до 2× быстрее, writes немного медленнее', 'Стоимость не меняется; writes 2× быстрее', 'Стоимость удваивается; latency уменьшается вдвое', 'Стоимость растёт на 1/N; reads не меняются'], answer: 0, explain: 'Write — в оба зеркала (чуть медленнее), read — с любого (до 2×). Cost per byte doubles.', section: 'raid', diff: 1 },
    { id: 'ms-25', type: 'single', q: 'Что даёт striping по N дискам?', options: ['Latency уменьшается в N раз', 'Throughput растёт линейно с N, latency не меняется, надёжности нет', 'Надёжность растёт в N раз', 'Стоимость байта удваивается'], answer: 1, explain: 'Latency (до первого байта) unchanged; throughput — linear increase; striping не обеспечивает reliability.', section: 'raid', diff: 2 },
    { id: 'ms-26', type: 'single', q: 'В каком уровне RAID parity распределён по всем дискам?', options: ['RAID 3', 'RAID 4', 'RAID 5', 'RAID 1'], answer: 2, explain: 'RAID 5 — block-interleaved distributed parity (P0-3, P4-7… на разных дисках). RAID 4 — выделенный parity-диск, RAID 3 — bit-level с parity-диском.', section: 'raid-levels', diff: 1 },
    { id: 'ms-27', type: 'single', q: 'Почему в RAID 4 parity-диск — узкое место?', options: ['Он медленнее остальных по конструкции', 'Каждая запись любого блока требует обновления parity на этом одном диске', 'На нём хранится FTL', 'Он не участвует в чтении'], answer: 1, explain: 'Parity на одном выделенном диске → все записи сериализуются на нём; RAID 5 распределяет parity и снимает проблему.', section: 'raid-levels', diff: 2 },
    { id: 'ms-28', type: 'single', q: 'Striped mirrors — это…', options: ['RAID 0+1', 'RAID 1+0', 'RAID 5', 'RAID 6'], answer: 1, explain: 'RAID 1+0 = striped mirrors (сначала зеркальные пары, потом striping). RAID 0+1 = mirrored stripes.', section: 'raid-levels', diff: 2 },
    { id: 'ms-29', type: 'single', q: 'RAID 5 из 5 дисков по 1 TB. Какова полезная ёмкость?', options: ['5 TB', '4 TB', '2.5 TB', '3 TB'], answer: 1, explain: 'Parity занимает эквивалент одного диска (распределённо): (N − 1) × 1 TB = 4 TB. 2.5 TB было бы при mirroring.', section: 'raid-levels', diff: 2 },
    { id: 'ms-30', type: 'single', q: 'Сколько одновременных отказов дисков переживает RAID 6?', options: ['0', '1', '2', 'N/2'], answer: 2, explain: 'RAID 6 хранит два блока избыточности (P + Q) на страйп → переживает 2 отказа. RAID 5 — 1.', section: 'raid-levels', diff: 1 },
    { id: 'ms-31', type: 'single', q: 'Получено (011, 1): данные 011, parity bit 1. Что можно сказать?', options: ['Ошибок нет', 'Обнаружена ошибка, но нельзя определить, какой бит неверен', 'Ошибка в первом бите, его можно исправить', 'Ошибок ровно две'], answer: 1, explain: '0 ⊕ 1 ⊕ 1 = 0 ≠ 1 → ошибка обнаружена. Parity даёт только single error detection: позицию не знает, multi-bit ошибки не ловит.', section: 'ecc', diff: 2 },
    { id: 'ms-32', type: 'single', q: 'Erasure channel: отправлено (0 1 1, 0), получено (0 ? 1, 0). Чему равен «?»', options: ['0', '1', 'Нельзя восстановить', 'Любое значение'], answer: 1, explain: '? = 0 ⊕ 1 ⊕ 0 = 1 — parity исправляет одно стирание, т.к. известно, какой бит потерян.', section: 'ecc', diff: 2 },
    { id: 'ms-33', type: 'single', q: 'a = 01100011, b = 10101010, c = 11001010. Parity p = a ⊕ b ⊕ c = ?', options: ['11111111', '01100011', '00000011', '10100001'], answer: 2, explain: 'a ⊕ b = 11001001; ⊕ c = 00000011. Если потерян a, то a = p ⊕ b ⊕ c = 01100011.', section: 'ecc', diff: 3 },
    { id: 'ms-34', type: 'single', q: 'Что уменьшает hot spare disk?', options: ['Mean time to failure', 'Mean time to repair', 'Rotational latency', 'Стоимость байта'], answer: 1, explain: 'Hot spare автоматически подменяет отказавший диск и RAID перестраивается сразу → короче окно уязвимости (MTTR).', section: 'features', diff: 2 }
  ]
});
