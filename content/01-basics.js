OS.addModule({
  id: 'basics',
  num: 1,
  group: 'theory',
  title: 'Basis on Operating Systems',
  titleRu: 'Основы операционных систем',
  icon: '🖥',
  sources: ['1-Basis on OS.pdf'],
  summary: 'Компьютерная система и Von Neumann, что такое ОС, interrupts, I/O и storage structure, SMP/multicore/NUMA/clusters, загрузка, DMA, multiprogramming, dual-mode и timer, управление ресурсами, виртуализация, вычислительные среды, kernel data structures.',
  sections: [
    {
      id: 'computer-system',
      h: 'Computer System — Von Neumann и 4 компонента',
      html: `
<p><b>Computer system</b>: системный блок (<b>computer tower</b>) — <b>motherboard</b>, <b>microprocessor</b>, <b>RAM chips</b>, expansion slots (video, network, A/V card), power supply, накопители (hard drive, CD/DVD) + периферия (monitor, keyboard, mouse, speakers).</p>
<p><b>Von Neumann architecture</b>:</p>
<ul>
  <li><b>CPU</b> = <b>PC</b> (program counter) + <b>registers</b> + <b>ALU</b>;</li>
  <li><b>Memory</b> хранит <b>и данные, и инструкции</b>;</li>
  <li>устройства (mass storage, video/keyboard) подключены через <b>I/O interface</b>;</li>
  <li>всё соединено общей <b>BUS</b> из трёх групп линий: <b>data</b>, <b>address</b>, <b>control</b>.</li>
</ul>
<svg class="d" viewBox="0 0 600 230">
  <rect class="d-box acc" x="20" y="20" width="150" height="100" rx="6"/>
  <text class="d-txt b" x="95" y="52" text-anchor="middle">CPU</text>
  <text class="d-txt sm" x="95" y="80" text-anchor="middle">PC · registers · ALU</text>
  <rect class="d-box" x="190" y="20" width="110" height="100" rx="6"/>
  <text class="d-txt b" x="245" y="62" text-anchor="middle">Memory</text>
  <text class="d-txt sm" x="245" y="86" text-anchor="middle">data + instructions</text>
  <rect class="d-box muted" x="320" y="20" width="120" height="40" rx="6"/>
  <text class="d-txt sm" x="380" y="45" text-anchor="middle">mass storage</text>
  <rect class="d-box" x="320" y="80" width="120" height="40" rx="6"/>
  <text class="d-txt sm" x="380" y="105" text-anchor="middle">I/O interface</text>
  <rect class="d-box muted" x="460" y="20" width="120" height="40" rx="6"/>
  <text class="d-txt sm" x="520" y="45" text-anchor="middle">video / keyboard</text>
  <rect class="d-box" x="460" y="80" width="120" height="40" rx="6"/>
  <text class="d-txt sm" x="520" y="105" text-anchor="middle">I/O interface</text>
  <line class="d-line" x1="380" y1="60" x2="380" y2="80"/>
  <line class="d-line" x1="520" y1="60" x2="520" y2="80"/>
  <line class="d-line" x1="95" y1="120" x2="95" y2="160"/>
  <line class="d-line" x1="245" y1="120" x2="245" y2="160"/>
  <line class="d-line" x1="380" y1="120" x2="380" y2="160"/>
  <line class="d-line" x1="520" y1="120" x2="520" y2="160"/>
  <rect class="d-box warn" x="20" y="160" width="560" height="56" rx="6"/>
  <text class="d-txt b" x="60" y="193" text-anchor="middle">BUS</text>
  <text class="d-txt sm" x="330" y="178" text-anchor="middle">data lines</text>
  <text class="d-txt sm" x="330" y="194" text-anchor="middle">address lines</text>
  <text class="d-txt sm" x="330" y="210" text-anchor="middle">control lines</text>
</svg>
<p><b>Computer System Structure</b> — 4 компонента:</p>
<table class="t">
  <tr><th>Компонент</th><th>Роль</th><th>Примеры</th></tr>
  <tr><td><b>Users</b></td><td>люди, машины, другие компьютеры, которым нужны вычислительные ресурсы</td><td>—</td></tr>
  <tr><td><b>Application programs</b></td><td>определяют, как ресурсы системы используются для решения задач пользователей</td><td>word processors, compilers, web browsers, database systems, video games</td></tr>
  <tr><td><b>Operating system</b></td><td>контролирует и координирует использование hardware между приложениями и пользователями</td><td>—</td></tr>
  <tr><td><b>Hardware</b></td><td>базовые вычислительные ресурсы</td><td>CPU, memory, I/O devices</td></tr>
</table>`,
      viz: [{ name: 'layers', caption: '4 компонента: ОС — посредник между приложениями и hardware', props: { layers: [
        { label: 'Users', sub: 'люди, машины, другие компьютеры' },
        { label: 'Application programs', sub: 'compilers, browsers, DB, games…', tone: 'c2' },
        { label: 'Operating system', sub: 'controls and coordinates hardware use', tone: 'acc' },
        { label: 'Hardware', sub: 'CPU, memory, I/O devices', tone: 'muted' }] } }],
      exam: 'Назвать 4 компонента системы и роль ОС; из чего состоит CPU и шина в Von Neumann.'
    },
    {
      id: 'what-is-os',
      h: 'What is an Operating System — определение и роли',
      html: `
<ul>
  <li><b>Operating system</b> — программа-посредник (<b>intermediary</b>) между пользователем компьютера и <b>computer hardware</b>; «the set of basic programs and utilities that make your computer run».</li>
  <li><b>Operating system goals</b>:
    <ol>
      <li>execute user programs and make solving user problems easier;</li>
      <li>make the computer system <b>convenient</b> to use;</li>
      <li>use the computer hardware in an <b>efficient</b> manner.</li>
    </ol>
  </li>
</ul>
<p><b>Operating System Definition</b>:</p>
<ul>
  <li><b>Kernel</b> — единственная программа, работающая <b>всё время</b> (one program running at all times), часть ОС.</li>
  <li>Всё остальное — либо <b>system program</b> (поставляется с ОС, но <b>не часть kernel</b>), либо <b>application program</b> (не связана с ОС).</li>
  <li><b>Middleware</b> — набор software frameworks с доп. сервисами для разработчиков: databases, multimedia, graphics (есть в современных general purpose и mobile ОС).</li>
</ul>
<p><b>What Operating Systems Do</b> — зависит от точки зрения:</p>
<table class="t">
  <tr><th>Система</th><th>Что важно</th></tr>
  <tr><td>Пользователь ПК</td><td>convenience, ease of use, good performance; resource utilization не волнует</td></tr>
  <tr><td>Shared computer (<b>mainframe</b>, <b>minicomputer</b>)</td><td>все пользователи должны быть довольны → ОС = <b>resource allocator</b> и <b>control program</b> (эффективно использует HW, управляет выполнением user programs)</td></tr>
  <tr><td>Dedicated systems (<b>workstations</b>)</td><td>свои ресурсы, но часто используют shared resources серверов</td></tr>
  <tr><td>Mobile (smartphones, tablets)</td><td>resource poor; оптимизация под usability и <b>battery life</b>; touch screens, voice recognition</td></tr>
  <tr><td>Embedded (устройства, автомобили)</td><td>мало или нет UI; работают в основном без вмешательства пользователя</td></tr>
</table>
<p><b>Defining Operating Systems</b>: термин покрывает множество ролей — ОС есть от тостеров до кораблей, spacecraft, game machines, TV, industrial control systems. ОС появились, когда военные fixed use computers стали general purpose и понадобились <b>resource management</b> и <b>program control</b>.</p>`,
      exam: 'Три цели ОС; kernel vs system program vs application program; ОС как resource allocator и control program.'
    },
    {
      id: 'evolution',
      h: 'Different OSes и Evolution of Operating Systems',
      html: `
<table class="t">
  <tr><th>ОС</th><th>Кратко (по слайду)</th></tr>
  <tr><td><b>Mac OS</b></td><td>серия ОС с графическим интерфейсом от Apple для Macintosh</td></tr>
  <tr><td><b>Linux</b></td><td>Unix-like ОС, собранная по модели free and open source software</td></tr>
  <tr><td><b>Microsoft Windows</b></td><td>серия ОС с графическим интерфейсом от Microsoft</td></tr>
  <tr><td><b>iOS</b></td><td>mobile ОС Apple (iPhone, 2007), затем iPod Touch и др.</td></tr>
  <tr><td><b>Android</b></td><td>Linux-based ОС для touchscreen-устройств (изначально Android, Inc.)</td></tr>
  <tr><td><b>BSD/OS</b></td><td>репутация надёжности в server roles</td></tr>
</table>
<p><b>Evolution of Operating Systems</b> (этапы по годам):</p>`,
      viz: [{ name: 'flow', caption: 'Evolution of Operating Systems', props: { dir: 'v', steps: [
        { label: 'Serial Processing', sub: '1940', tone: 'muted' },
        { label: 'Batch Processing', sub: '1950', tone: 'c1' },
        { label: 'Multiprogramming', sub: '1960', tone: 'c2' },
        { label: 'Time Sharing', sub: '1965', tone: 'c3' },
        { label: 'Parallel System', sub: '1980', tone: 'c4' },
        { label: 'Network-based', sub: '1995', tone: 'c5' },
        { label: 'Distributed System', sub: '2010', tone: 'acc' }] } }],
      exam: 'Порядок этапов: serial → batch → multiprogramming → time sharing → parallel → network-based → distributed.'
    },
    {
      id: 'organization',
      h: 'Computer-System Organization, Operation; Controller vs Driver',
      html: `
<p><b>Computer System Organization</b>:</p>
<ul>
  <li>Один или несколько CPU и <b>device controllers</b> подключены к общей шине (<b>common bus</b>), дающей доступ к <b>shared memory</b>.</li>
  <li>Память хранит и данные, и инструкции.</li>
  <li>CPU и устройства работают параллельно, <b>конкурируя за memory cycles</b>.</li>
</ul>
<p><b>Computer-System Operation</b>:</p>
<ul>
  <li>I/O devices и CPU выполняются <b>concurrently</b>.</li>
  <li>Каждый <b>device controller</b> отвечает за конкретный тип устройства и имеет <b>local buffer</b>.</li>
  <li>Для каждого типа контроллера в ОС есть <b>device driver</b>; он даёт <b>uniform interface</b> между контроллером и kernel.</li>
  <li>CPU переносит данные main memory ↔ local buffers; сам I/O идёт <b>device → local buffer</b> контроллера.</li>
  <li>Контроллер сообщает CPU о завершении операции, вызывая <b>interrupt</b>.</li>
</ul>
<div data-viz="0"></div>
<p><b>Controller vs Driver</b>:</p>
<table class="t">
  <tr><th>Aspect</th><th>Controller</th><th>Driver</th></tr>
  <tr><td>Definition</td><td><b>hardware</b>-компонент (chip/circuitry), управляющий обменом между CPU и устройством</td><td><b>software</b>-программа, позволяющая ОС взаимодействовать с hardware</td></tr>
  <tr><td>Location</td><td>физическое железо внутри компьютера/устройства</td><td>программный слой в ОС</td></tr>
  <tr><td>Role</td><td>низкоуровневое управление устройством (перемещение данных, сигнал готовности)</td><td>переводит запросы ОС в команды, понятные контроллеру</td></tr>
  <tr><td>Example</td><td>disk controller, USB controller, graphics controller</td><td>disk driver, USB driver, graphics driver</td></tr>
  <tr><td>Analogy</td><td>«<b>operator</b>», который выполняет работу</td><td>«<b>translator</b>» между ОС и контроллером</td></tr>
</table>`,
      viz: [{ name: 'flow', caption: 'Путь данных при вводе и сигнал завершения', props: { dir: 'h', steps: [
        { label: 'I/O device' },
        { label: 'Device controller', sub: 'local buffer', tone: 'warn' },
        { label: 'CPU', sub: 'получает interrupt, переносит данные', tone: 'acc' },
        { label: 'Main memory', tone: 'ok' }] } }],
      exam: 'Controller = hardware («operator»), driver = software («translator»). Как контроллер сообщает о завершении (interrupt).'
    },
    {
      id: 'interrupts',
      h: 'Interrupts — функции, обработка, timeline, I/O cycle',
      html: `
<p><b>Common Functions of Interrupts</b>:</p>
<ul>
  <li>Прерывание передаёт управление <b>interrupt service routine</b>, обычно через <b>interrupt vector</b> — таблицу с <b>адресами всех service routines</b>.</li>
  <li>Архитектура прерываний должна <b>сохранить адрес прерванной инструкции</b>.</li>
  <li><b>Trap</b> или <b>exception</b> — <b>software-generated interrupt</b>, вызванное ошибкой или запросом пользователя.</li>
  <li>ОС — <b>interrupt driven</b>.</li>
</ul>
<p><b>Interrupt Handling</b>:</p>
<ul>
  <li>ОС сохраняет состояние CPU: <b>registers</b> и <b>program counter</b>.</li>
  <li>Определяет тип прерывания; для каждого типа — отдельный сегмент кода, решающий, что делать.</li>
</ul>
<p><b>Interrupt Timeline</b>: CPU выполняет user program, пока устройство передаёт данные; после <b>transfer done</b> → <b>interrupt signaled</b> → CPU кратко выполняет <b>I/O interrupt processing</b> → <b>interrupt handled</b> → снова user program.</p>
<div data-viz="0"></div>
<p><b>Interrupt-driven I/O Cycle</b>:</p>
<ol>
  <li>(CPU) <b>device driver initiates I/O</b>;</li>
  <li>(I/O controller) <b>initiates I/O</b>; тем временем CPU выполняет код и <b>проверяет прерывания между инструкциями</b>;</li>
  <li>input ready, output complete или error → контроллер <b>генерирует interrupt signal</b>;</li>
  <li>CPU получает прерывание и передаёт управление <b>interrupt handler</b>;</li>
  <li>handler обрабатывает данные и выполняет return from interrupt;</li>
  <li>CPU <b>resumes</b> прерванную задачу;</li>
  <li>цикл повторяется.</li>
</ol>
<div data-viz="1"></div>`,
      viz: [
        { name: 'timeline', caption: 'Interrupt Timeline: два запроса I/O подряд', props: {
          max: 30, rows: [
            { label: 'CPU', segs: [
              { from: 0, to: 10, label: 'user program', tone: 'acc' }, { from: 10, to: 12, label: 'ISR', tone: 'warn' },
              { from: 12, to: 24, label: 'user program', tone: 'acc' }, { from: 24, to: 26, label: 'ISR', tone: 'warn' },
              { from: 26, to: 30, label: 'user', tone: 'acc' }] },
            { label: 'I/O device', segs: [
              { from: 0, to: 2, label: 'idle', tone: 'muted' }, { from: 2, to: 9, label: 'transferring', tone: 'ok' },
              { from: 9, to: 16, label: 'idle', tone: 'muted' }, { from: 16, to: 23, label: 'transferring', tone: 'ok' },
              { from: 23, to: 30, label: 'idle', tone: 'muted' }] }],
          marks: [{ t: 2, label: 'I/O request' }, { t: 9, label: 'transfer done' }, { t: 10, label: 'interrupt signaled' }, { t: 12, label: 'interrupt handled' },
            { t: 16, label: 'I/O request' }, { t: 23, label: 'transfer done' }, { t: 24, label: 'interrupt signaled' }, { t: 26, label: 'interrupt handled' }] } },
        { name: 'flow', caption: 'Interrupt-driven I/O cycle (шаг 7 — возврат к началу)', props: { dir: 'v', loop: true, steps: [
          { label: 'Device driver initiates I/O', sub: 'CPU', tone: 'acc' },
          { label: 'Controller initiates I/O', sub: 'I/O controller', tone: 'muted' },
          { label: 'Input ready / output complete / error', sub: 'controller generates interrupt signal', tone: 'warn' },
          { label: 'CPU receives interrupt', sub: 'transfers control to interrupt handler', tone: 'bad' },
          { label: 'Handler processes data', sub: 'returns from interrupt', tone: 'c2' },
          { label: 'CPU resumes interrupted task', tone: 'ok' }] } }
      ],
      exam: 'Что лежит в interrupt vector; что сохраняется (registers + PC); trap = software-generated interrupt; 7 шагов interrupt-driven I/O cycle.'
    },
    {
      id: 'io-structure',
      h: 'I/O Structure — синхронный и асинхронный I/O',
      html: `
<p>Два метода обработки I/O:</p>
<div class="cols">
  <div><b>1. Управление возвращается программе только по завершении I/O</b>
    <ul>
      <li><b>Wait instruction</b> переводит CPU в простой до следующего прерывания;</li>
      <li>или <b>wait loop</b> (конкуренция за доступ к памяти);</li>
      <li>одновременно не более <b>одного</b> outstanding I/O request — нет параллельной обработки I/O.</li>
    </ul>
  </div>
  <div><b>2. Управление возвращается, не дожидаясь завершения I/O</b>
    <ul>
      <li><b>System call</b> — запрос к ОС, позволяющий пользователю подождать завершения I/O;</li>
      <li><b>Device-status table</b> — запись для каждого I/O device: <b>type, address, state</b>;</li>
      <li>ОС индексирует таблицу, чтобы узнать статус устройства и изменить запись (отметить прерывание).</li>
    </ul>
  </div>
</div>`,
      viz: [{ name: 'timeline', caption: 'Схематично: что делает программа во время I/O', props: {
        max: 20, rows: [
          { label: '1: ждёт', segs: [{ from: 0, to: 5, label: 'user', tone: 'acc' }, { from: 5, to: 13, label: 'wait for I/O', tone: 'muted' }, { from: 13, to: 20, label: 'user', tone: 'acc' }] },
          { label: '2: не ждёт', segs: [{ from: 0, to: 5, label: 'user', tone: 'acc' }, { from: 5, to: 13, label: 'user program continues', tone: 'ok' }, { from: 13, to: 14, label: 'int', tone: 'warn' }, { from: 14, to: 20, label: 'user', tone: 'acc' }] }],
        marks: [{ t: 5, label: 'I/O start' }, { t: 13, label: 'I/O done' }] } }],
      exam: 'Что содержит device-status table; ограничение синхронного варианта (одна outstanding операция).'
    },
    {
      id: 'storage',
      h: 'Storage Structure, единицы и Storage Hierarchy',
      html: `
<ul>
  <li><b>Main memory</b> — единственное большое хранилище, к которому CPU обращается <b>напрямую</b>; random access; обычно <b>volatile</b>; обычно <b>DRAM</b> (Dynamic Random-access Memory).</li>
  <li><b>Secondary storage</b> — расширение main memory: большая <b>nonvolatile</b> ёмкость.</li>
  <li><b>Hard Disk Drives (HDD)</b> — жёсткие металлические/стеклянные пластины (platters) с магнитным покрытием; поверхность делится на <b>tracks</b>, они — на <b>sectors</b>; <b>disk controller</b> определяет логическое взаимодействие устройства и компьютера.</li>
  <li><b>Non-volatile memory (NVM) devices</b> — быстрее HDD, nonvolatile; разные технологии; популярность растёт (ёмкость и скорость растут, цена падает).</li>
</ul>
<p><b>Storage Definitions and Notation</b>:</p>
<ul>
  <li><b>bit</b> — базовая единица (0 или 1); <b>byte</b> = 8 bits — наименьший удобный кусок памяти на большинстве машин.</li>
  <li><b>word</b> — «родная» единица данных архитектуры, из одного или нескольких байт. 64-bit registers и 64-bit addressing → обычно <b>64-bit (8-byte) words</b>. Многие операции выполняются словами, а не байтами.</li>
</ul>
<div class="formula">KB = 1024 B &nbsp;|&nbsp; MB = 1024² B &nbsp;|&nbsp; GB = 1024³ B &nbsp;|&nbsp; TB = 1024⁴ B &nbsp;|&nbsp; PB = 1024⁵ B</div>
<p><b>Storage Hierarchy</b> упорядочена по <b>speed</b>, <b>cost</b>, <b>volatility</b>.</p>
<ul>
  <li><b>Caching</b> — копирование информации в более быструю память; main memory можно считать cache для secondary storage.</li>
  <li><b>Device driver</b> для каждого device controller управляет I/O и даёт uniform interface между контроллером и kernel.</li>
</ul>`,
      viz: [{ name: 'layers', caption: 'Storage-Device Hierarchy: primary (volatile) · secondary · tertiary', props: { pyramid: true, top: 'smaller · faster', bottom: 'larger · slower', layers: [
        { label: 'registers', sub: 'primary · volatile', tone: 'acc' },
        { label: 'cache', sub: 'primary · volatile', tone: 'acc' },
        { label: 'main memory', sub: 'primary · volatile', tone: 'acc' },
        { label: 'nonvolatile memory', sub: 'secondary · nonvolatile', tone: 'ok' },
        { label: 'hard-disk drives', sub: 'secondary · nonvolatile', tone: 'ok' },
        { label: 'optical disk', sub: 'tertiary', tone: 'muted' },
        { label: 'magnetic tapes', sub: 'tertiary', tone: 'muted' }] } }],
      exam: 'Порядок уровней иерархии и граница volatile/nonvolatile (после main memory); 1 KB = 1024 B; что такое word.'
    },
    {
      id: 'caching',
      h: 'Caching, характеристики уровней, Migration of data “A”',
      html: `
<ul>
  <li><b>Caching</b> — важный принцип на многих уровнях (hardware, OS, software): используемая информация временно копируется из медленной памяти в быструю.</li>
  <li>Сначала проверяется быстрая память (<b>cache</b>): есть — используем напрямую (fast); нет — копируем в cache и используем там.</li>
  <li>Cache меньше кэшируемой памяти → <b>cache management</b> — важная задача проектирования: <b>cache size</b> и <b>replacement policy</b>.</li>
</ul>
<p><b>Characteristics of Various Types of Storage</b>:</p>
<table class="t">
  <tr><th>Level</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th></tr>
  <tr><td>Name</td><td>registers</td><td>cache</td><td>main memory</td><td>solid-state disk</td><td>magnetic disk</td></tr>
  <tr><td>Typical size</td><td>&lt; 1 KB</td><td>&lt; 16 MB</td><td>&lt; 64 GB</td><td>&lt; 1 TB</td><td>&lt; 10 TB</td></tr>
  <tr><td>Implementation</td><td>custom memory with multiple ports CMOS</td><td>on-chip or off-chip CMOS SRAM</td><td>CMOS SRAM</td><td>flash memory</td><td>magnetic disk</td></tr>
  <tr><td>Access time (ns)</td><td>0.25–0.5</td><td>0.5–25</td><td>80–250</td><td>25,000–50,000</td><td>5,000,000</td></tr>
  <tr><td>Bandwidth (MB/s)</td><td>20,000–100,000</td><td>5,000–10,000</td><td>1,000–5,000</td><td>500</td><td>20–150</td></tr>
  <tr><td><b>Managed by</b></td><td><b>compiler</b></td><td><b>hardware</b></td><td>operating system</td><td>operating system</td><td>operating system</td></tr>
  <tr><td>Backed by</td><td>cache</td><td>main memory</td><td>disk</td><td>disk</td><td>disk or tape</td></tr>
</table>
<p>Перемещение между уровнями может быть <b>explicit</b> или <b>implicit</b>.</p>
<p><b>Migration of data “A” from Disk to Register</b>:</p>
<div data-viz="0"></div>
<ul>
  <li><b>Multitasking</b>: нужно использовать самое свежее значение A, где бы в иерархии оно ни лежало.</li>
  <li><b>Multiprocessor</b>: hardware должен обеспечивать <b>cache coherency</b> — у всех CPU в cache самое свежее значение.</li>
  <li><b>Distributed</b>: ещё сложнее — может существовать несколько копий данных.</li>
</ul>`,
      viz: [{ name: 'flow', caption: 'Migration of data “A”', props: { dir: 'h', steps: [
        { label: 'magnetic disk', tone: 'muted' }, { label: 'main memory', tone: 'ok' },
        { label: 'cache', tone: 'warn' }, { label: 'hardware register', tone: 'acc' }] } }],
      exam: 'Кто управляет уровнем (registers — compiler, cache — hardware, остальное — OS); путь A disk → memory → cache → register; cache coherency.'
    },
    {
      id: 'architecture',
      h: 'Computer-System Architecture — multiprocessors, SMP, multicore, NUMA',
      html: `
<ul>
  <li>Большинство систем: один <b>general-purpose processor</b> + <b>special-purpose processors</b>.</li>
  <li><b>Multiprocessor systems</b> (они же <b>parallel systems</b>, <b>tightly-coupled systems</b>) — растут в использовании. Преимущества:
    <ol>
      <li><b>Increased throughput</b>;</li>
      <li><b>Economy of scale</b>;</li>
      <li><b>Increased reliability</b> — <b>graceful degradation</b> или <b>fault tolerance</b>.</li>
    </ol>
  </li>
  <li>Два типа:
    <ul>
      <li><b>Asymmetric Multiprocessing</b> — каждому процессору назначена своя (specific) задача;</li>
      <li><b>Symmetric Multiprocessing (SMP)</b> — каждый процессор выполняет все задачи.</li>
    </ul>
  </li>
</ul>
<table class="t">
  <tr><th></th><th>SMP architecture</th><th>Dual-Core Design (multicore)</th></tr>
  <tr><td>Структура</td><td>processor₀, processor₁ — отдельные; у каждого CPU свои <b>registers</b> и <b>cache</b></td><td>один processor₀ с CPU core₀ и core₁ на одном чипе; у ядра свои registers и <b>L1 cache</b></td></tr>
  <tr><td>Общее</td><td>main memory</td><td><b>L2 cache</b> и main memory</td></tr>
</table>
<p>Dual-Core: <b>multi-chip</b> и <b>multicore</b>; системы, содержащие все чипы; chassis с несколькими отдельными системами.</p>
<p><b>Non-Uniform Memory Access (NUMA)</b>: у каждого CPU своя локальная память (memory₀…memory₃), CPU связаны через <b>interconnect</b>; доступ к своей памяти быстрее, чем к чужой — отсюда «non-uniform».</p>
<div data-viz="0"></div>
<p><b>PC Motherboard</b>: processor socket (CPU), <b>DRAM slots</b>, <b>PCIe bus slots</b>, I/O и power connectors. После заполнения слотов это полноценный компьютер. Даже дешёвый general-purpose CPU содержит несколько ядер; некоторые платы имеют несколько processor sockets; продвинутые компьютеры допускают несколько system boards → <b>NUMA systems</b>.</p>`,
      viz: [{ name: 'graph', caption: 'NUMA: локальная память у каждого CPU, interconnect между CPU', props: { w: 600, h: 330,
        nodes: [
          { id: 'm0', label: 'memory0', x: 130, y: 40, tone: 'ok' }, { id: 'm1', label: 'memory1', x: 470, y: 40, tone: 'ok' },
          { id: 'c0', label: 'CPU0', x: 130, y: 120, tone: 'acc' }, { id: 'c1', label: 'CPU1', x: 470, y: 120, tone: 'acc' },
          { id: 'c2', label: 'CPU2', x: 130, y: 210, tone: 'acc' }, { id: 'c3', label: 'CPU3', x: 470, y: 210, tone: 'acc' },
          { id: 'm2', label: 'memory2', x: 130, y: 290, tone: 'ok' }, { id: 'm3', label: 'memory3', x: 470, y: 290, tone: 'ok' }],
        edges: [
          { from: 'm0', to: 'c0', both: true }, { from: 'm1', to: 'c1', both: true }, { from: 'm2', to: 'c2', both: true }, { from: 'm3', to: 'c3', both: true },
          { from: 'c0', to: 'c1', label: 'interconnect', dashed: true, both: true }, { from: 'c2', to: 'c3', dashed: true, both: true },
          { from: 'c0', to: 'c2', dashed: true, both: true }, { from: 'c1', to: 'c3', dashed: true, both: true },
          { from: 'c0', to: 'c3', dashed: true, both: true }, { from: 'c1', to: 'c2', dashed: true, both: true }] } }],
      exam: '3 преимущества multiprocessors; asymmetric vs symmetric; что общее у ядер в multicore (L2 + memory); идея NUMA.'
    },
    {
      id: 'clustered',
      h: 'Clustered Systems',
      html: `
<ul>
  <li>Как multiprocessor systems, но работают вместе <b>несколько систем</b>.</li>
  <li>Обычно разделяют storage через <b>storage-area network (SAN)</b>.</li>
  <li>Дают <b>high-availability</b> service, переживающий отказы:
    <ul>
      <li><b>Asymmetric clustering</b> — одна машина в режиме <b>hot-standby</b>;</li>
      <li><b>Symmetric clustering</b> — несколько узлов выполняют приложения и <b>следят друг за другом</b>.</li>
    </ul>
  </li>
  <li>Некоторые кластеры — для <b>high-performance computing (HPC)</b>: приложения должны быть написаны с <b>parallelization</b>.</li>
  <li>Некоторые имеют <b>distributed lock manager (DLM)</b>, чтобы избежать конфликтующих операций.</li>
</ul>`,
      viz: [{ name: 'graph', caption: 'Clustered system: компьютеры связаны interconnect и разделяют SAN', props: { w: 600, h: 230,
        nodes: [
          { id: 'a', label: 'computer', x: 100, y: 50 }, { id: 'b', label: 'computer', x: 300, y: 50 }, { id: 'c', label: 'computer', x: 500, y: 50 },
          { id: 'san', label: 'storage-area network', x: 300, y: 185, w: 190, tone: 'acc' }],
        edges: [
          { from: 'a', to: 'b', label: 'interconnect', both: true }, { from: 'b', to: 'c', label: 'interconnect', both: true },
          { from: 'a', to: 'san', both: true }, { from: 'b', to: 'san', both: true }, { from: 'c', to: 'san', both: true }] } }],
      exam: 'Asymmetric (hot-standby) vs symmetric clustering; SAN; зачем DLM.'
    },
    {
      id: 'resume',
      h: 'Operating Systems features — Resume (Interrupt, Process, Thread, Task, Signal)',
      html: `
<table class="t">
  <tr><th>Concept</th><th>Definition</th><th>Key characteristics</th><th>Practical example</th></tr>
  <tr><td><b>Interrupt</b></td><td>событие (hardware или software), временно останавливающее нормальное выполнение программы для обработки срочного запроса</td><td>вызывается hardware (keyboard, disk) или software; обрабатывается <b>Interrupt Service Routine (ISR)</b>; бывает <b>maskable</b> или <b>non-maskable</b></td><td>нажатие клавиши: CPU прерывает работу, чтобы прочитать символ</td></tr>
  <tr><td><b>Process</b></td><td>программа в выполнении со своим memory space и ресурсами</td><td>имеет state (ready, running, waiting); содержит один или несколько threads; управляется ОС</td><td>запуск Word или Firefox создаёт процесс</td></tr>
  <tr><td><b>Thread</b></td><td>лёгкая единица выполнения внутри процесса; разделяет память и ресурсы с другими потоками процесса</td><td>потоки процесса делят память, но имеют <b>отдельные stacks</b>; эффективнее multitasking; дешевле создавать/управлять, чем процессы</td><td>браузер: один поток для UI, другой скачивает страницу, третий выполняет JavaScript</td></tr>
  <tr><td><b>Task</b></td><td>общий термин для единицы работы (process, thread или scheduled function)</td><td>абстрактнее process/thread; часто в embedded systems и concurrency libraries</td><td>в <b>RTOS</b> task — рутина, периодически читающая сенсор</td></tr>
  <tr><td><b>Signal</b></td><td>программный механизм доставки событий/уведомлений процессу</td><td>уведомляет об условиях (<b>SIGKILL</b>, <b>SIGSEGV</b>); может остановить процесс или вызвать <b>signal handler</b></td><td><b>CTRL+C</b> в терминале посылает <b>SIGINT</b> foreground-процессу</td></tr>
</table>`,
      exam: 'Различать interrupt (событие для CPU) и signal (уведомление процессу); thread vs process; пример CTRL+C → SIGINT.'
    },
    {
      id: 'startup',
      h: 'Computer Startup (Bootstrap) и Operating-System Operations',
      html: `
<ul>
  <li><b>Bootstrap program</b> загружается при power-up или reboot.</li>
  <li>Обычно хранится в <b>ROM</b> или <b>EPROM</b> — так называемый <b>firmware</b>.</li>
  <li>Инициализирует все компоненты системы; загружает <b>kernel</b> в RAM и запускает его.</li>
</ul>
<table class="t">
  <tr><th>Этап</th><th>Что делает</th></tr>
  <tr><td><b>BIOS / UEFI</b> (motherboard FW)</td><td>HW init, <b>Power-On Self Test (POST)</b>: проверка RAM, CPU, дисков; ищет <b>boot sector</b> на накопителе; передаёт управление ПО</td></tr>
  <tr><td><b>Bootloader</b> (например, <b>GRUB</b>)</td><td>маленькая программа в начале диска: находит ОС и загружает её в RAM; показывает меню выбора ОС (<b>dual-boot</b>)</td></tr>
  <tr><td><b>Linux kernel</b></td><td>«ядро» ОС (resource manager): инициализирует HW drivers, монтирует <b>root file system</b></td></tr>
  <tr><td><b>systemd (PID 1)</b></td><td><b>первый процесс</b>, запущенный ядром; параллельно запускает фоновые сервисы (GUI, connectivity…) и daemons</td></tr>
  <tr><td>Login screen</td><td>система готова</td></tr>
</table>
<div data-viz="0"></div>
<p><b>Operating-System Operations</b>:</p>
<ul>
  <li>Bootstrap — простой код: инициализирует систему, загружает kernel.</li>
  <li>Kernel загружается и запускает <b>system daemons</b> — сервисы, работающие вне ядра.</li>
  <li>Kernel <b>interrupt driven</b> (hardware и software):
    <ul>
      <li><b>Hardware interrupt</b> — от одного из устройств;</li>
      <li><b>Software interrupt</b> (<b>exception</b> или <b>trap</b>): software error (например, <b>division by zero</b>) или запрос сервиса ОС — <b>system call</b>.</li>
    </ul>
  </li>
  <li>Другие проблемы процессов: <b>infinite loop</b>, процессы, изменяющие друг друга или ОС.</li>
</ul>`,
      viz: [{ name: 'flow', caption: 'Bootstrap: от включения до login screen', props: { dir: 'v', steps: [
        { label: 'Power-On', tone: 'muted' },
        { label: 'BIOS / UEFI', sub: 'HW init, POST, поиск boot sector', tone: 'warn' },
        { label: 'Bootloader (GRUB)', sub: 'находит ОС, грузит в RAM, меню dual-boot', tone: 'c2' },
        { label: 'Linux kernel', sub: 'HW drivers, mount root FS', tone: 'acc' },
        { label: 'systemd (PID 1)', sub: 'services и daemons параллельно', tone: 'c3' },
        { label: 'Login screen', sub: 'system is ready', tone: 'ok' }] } }],
      exam: 'Где хранится bootstrap (ROM/EPROM, firmware); цепочка BIOS/UEFI → GRUB → kernel → systemd; hardware vs software interrupt (trap: ошибка или system call).'
    },
    {
      id: 'dma',
      h: 'How a Modern Computer Works и Direct Memory Access (DMA)',
      html: `
<p><b>How a Modern Computer Works</b> (Von Neumann architecture): N CPU (thread of execution + <b>cache</b>) и память (instructions and data) связаны <b>instruction execution cycle</b> и <b>data movement</b>; M устройств связаны с CPU через <b>I/O request</b>, <b>data</b> и <b>interrupt</b>, а с памятью напрямую — через <b>DMA</b>.</p>
<p><b>Direct Memory Access Structure</b>:</p>
<ul>
  <li>Для <b>high-speed I/O devices</b>, передающих данные со скоростью, близкой к скорости памяти.</li>
  <li>Device controller передаёт <b>блоки данных</b> из своего buffer storage <b>прямо в main memory без участия CPU</b>.</li>
  <li>Генерируется <b>одно прерывание на блок</b>, а не одно на байт.</li>
</ul>`,
      viz: [{ name: 'graph', caption: 'How a Modern Computer Works: DMA — прямой путь device ↔ memory', props: { w: 600, h: 300,
        nodes: [
          { id: 'cpu', label: 'CPU (×N)', sub: 'thread + cache', x: 120, y: 70, w: 150, h: 56, tone: 'acc' },
          { id: 'mem', label: 'memory', sub: 'instructions and data', x: 470, y: 70, w: 160, h: 56, tone: 'ok' },
          { id: 'dev', label: 'device (×M)', x: 120, y: 245, shape: 'pill', tone: 'warn' }],
        edges: [
          { from: 'cpu', to: 'mem', label: 'instruction execution cycle', both: true, bend: -25 },
          { from: 'cpu', to: 'mem', label: 'data movement', both: true, bend: 25 },
          { from: 'cpu', to: 'dev', label: 'I/O request', bend: -30 },
          { from: 'dev', to: 'cpu', label: 'data', both: true },
          { from: 'dev', to: 'cpu', label: 'interrupt', bend: -30, tone: 'bad' },
          { from: 'dev', to: 'mem', label: 'DMA', both: true, tone: 'acc' }] } }],
      exam: 'DMA: блоки без участия CPU, одно прерывание на блок (а не на байт), для быстрых устройств.'
    },
    {
      id: 'multiprogramming',
      h: 'Multiprogramming (Batch) и Multitasking (Timesharing), Memory Layout',
      html: `
<div class="cols">
  <div><b>Multiprogramming (Batch system)</b>
    <ul>
      <li>Один пользователь не может всё время держать занятыми CPU и I/O.</li>
      <li>Multiprogramming организует <b>jobs</b> (code and data) так, чтобы у CPU <b>всегда было что выполнять</b>.</li>
      <li>В памяти — подмножество всех jobs системы.</li>
      <li>Один job выбирается и запускается через <b>job scheduling</b>.</li>
      <li>Когда job ждёт (например, I/O), ОС <b>переключается на другой job</b>.</li>
    </ul>
  </div>
  <div><b>Multitasking (Timesharing)</b>
    <ul>
      <li>Логическое расширение batch: CPU переключает jobs <b>так часто</b>, что пользователи могут взаимодействовать с каждым — <b>interactive computing</b>.</li>
      <li><b>Response time</b> должно быть <b>&lt; 1 second</b>.</li>
      <li>У каждого пользователя в памяти выполняется хотя бы одна программа — <b>process</b>.</li>
      <li>Несколько jobs готовы одновременно → <b>CPU scheduling</b>.</li>
      <li>Процессы не помещаются в память → <b>swapping</b> перемещает их in/out.</li>
      <li><b>Virtual memory</b> позволяет выполнять процессы, <b>не полностью</b> находящиеся в памяти.</li>
    </ul>
  </div>
</div>
<div data-viz="0"></div>
<p><b>Memory Layout for Multiprogrammed System</b>: от адреса 0 до max — несколько процессов и ОС в одной памяти.</p>
<div data-viz="1"></div>`,
      viz: [
        { name: 'timeline', caption: 'Multiprogramming: пока Job 1 ждёт I/O, CPU выполняет другие jobs', props: {
          max: 16, rows: [
            { label: 'CPU', segs: [{ from: 0, to: 4, label: 'Job 1', tone: 'c1' }, { from: 4, to: 9, label: 'Job 2', tone: 'c2' }, { from: 9, to: 12, label: 'Job 3', tone: 'c3' }, { from: 12, to: 16, label: 'Job 1', tone: 'c1' }] },
            { label: 'Job 1', segs: [{ from: 0, to: 4, label: 'CPU', tone: 'acc' }, { from: 4, to: 12, label: 'waits for I/O', tone: 'muted' }, { from: 12, to: 16, label: 'CPU', tone: 'acc' }] }] } },
        { name: 'layers', caption: 'Memory Layout for Multiprogrammed System', props: { top: 'max', bottom: '0', layers: [
          { label: 'operating system', tone: 'muted' }, { label: 'process 1', tone: 'c1' }, { label: 'process 2', tone: 'c2' },
          { label: 'process 3', tone: 'c3' }, { label: 'process 4', tone: 'c4' }] } }
      ],
      exam: 'Чем timesharing отличается от batch multiprogramming; response time &lt; 1 s; swapping vs virtual memory.'
    },
    {
      id: 'dual-mode',
      h: 'Dual-mode Operation, переход User → Kernel, Timer',
      html: `
<ul>
  <li><b>Dual-mode operation</b> позволяет ОС защитить себя и другие компоненты системы.</li>
  <li><b>User mode</b> и <b>kernel mode</b>; <b>mode bit</b> обеспечивается <b>hardware</b> — показывает, выполняется user code или kernel code.</li>
  <li>По схеме перехода: <b>user mode — mode bit = 1</b>, <b>kernel mode — mode bit = 0</b>.</li>
  <li>Как гарантировать, что пользователь сам не выставит «kernel»? <b>System call</b> переключает режим в kernel, <b>return from call</b> сбрасывает его в user.</li>
  <li>Некоторые инструкции — <b>privileged</b>: выполняются <b>только в kernel mode</b>.</li>
</ul>
<p><b>Transition from User to Kernel Mode</b>: user process executing → calls system call → <b>trap</b> (mode bit = 0) → execute system call (kernel) → <b>return</b> (mode bit = 1) → return from system call.</p>
<div data-viz="0"></div>
<p><b>Timer</b> — защита от infinite loop / процесса, захватившего ресурсы (process hogging resources):</p>
<ul>
  <li>Таймер настроен прервать компьютер через некоторое время.</li>
  <li>Счётчик (counter) уменьшается физическими часами (physical clock).</li>
  <li>ОС устанавливает счётчик — это <b>privileged instruction</b>.</li>
  <li>Счётчик = 0 → генерируется <b>interrupt</b>.</li>
  <li>Настраивается <b>перед</b> запуском процесса, чтобы ОС вернула управление или завершила программу, превысившую отведённое время.</li>
</ul>
<div data-viz="1"></div>`,
      viz: [
        { name: 'graph', caption: 'Сверху — user mode (mode bit = 1), снизу — kernel mode (mode bit = 0)', props: { w: 600, h: 240,
          nodes: [
            { id: 'u1', label: 'user process executing', x: 95, y: 55, w: 160 },
            { id: 'u2', label: 'calls system call', x: 290, y: 55, w: 140 },
            { id: 'u3', label: 'return from system call', x: 495, y: 55, w: 170 },
            { id: 'k', label: 'execute system call', sub: 'kernel', x: 390, y: 190, w: 160, tone: 'acc' }],
          edges: [
            { from: 'u1', to: 'u2' },
            { from: 'u2', to: 'k', label: 'trap: mode bit = 0', tone: 'warn' },
            { from: 'k', to: 'u3', label: 'return: mode bit = 1', tone: 'ok' }] } },
        { name: 'flow', caption: 'Timer: ОС гарантированно получает управление обратно', props: { dir: 'h', loop: true, steps: [
          { label: 'OS sets counter', sub: 'privileged instruction', tone: 'acc' },
          { label: 'Process runs', sub: 'counter-- by clock' },
          { label: 'Counter = 0', sub: 'timer interrupt', tone: 'warn' },
          { label: 'OS regains control', sub: 'schedule / terminate', tone: 'ok' }] } }
      ],
      exam: 'Значения mode bit (user = 1, kernel = 0); почему пользователь не может сам перейти в kernel mode; зачем timer и почему установка — privileged.'
    },
    {
      id: 'process-mgmt',
      h: 'OS Components и Process Management',
      html: `
<p><b>How an operating system works</b> — компоненты ОС: <b>Process Management</b>, <b>File Management</b>, <b>Network Management</b>, <b>Main Memory Management</b>, <b>Secondary Storage Management</b>, <b>I/O Device Management</b>, <b>Security Management</b>, <b>Command Interpreter System</b>.</p>
<ul>
  <li><b>Process</b> — программа в выполнении (<b>program in execution</b>), единица работы в системе.</li>
  <li><b>Program</b> — <b>passive entity</b>, <b>process</b> — <b>active entity</b>.</li>
  <li>Процессу нужны ресурсы: CPU, memory, I/O, files; initialization data.</li>
  <li>Завершение процесса требует вернуть (reclaim) все повторно используемые ресурсы.</li>
  <li><b>Single-threaded</b> процесс имеет <b>один program counter</b> (адрес следующей инструкции) и выполняет инструкции последовательно до завершения.</li>
  <li><b>Multi-threaded</b> процесс — <b>один program counter на каждый thread</b>.</li>
  <li>В системе много процессов (user и OS), работающих concurrently на одном или нескольких CPU; concurrency — через <b>multiplexing</b> CPU между процессами/потоками.</li>
</ul>
<p><b>Process Management Activities</b> — ОС отвечает за:</p>
<ul>
  <li>creating and deleting user and system processes;</li>
  <li>suspending and resuming processes;</li>
  <li>mechanisms for process <b>synchronization</b>;</li>
  <li>mechanisms for process <b>communication</b>;</li>
  <li>mechanisms for <b>deadlock handling</b>.</li>
</ul>`,
      exam: 'Program (passive) vs process (active); число PC у multi-threaded процесса; 5 activities process management.'
    },
    {
      id: 'resource-mgmt',
      h: 'Memory, Mass-Storage, File-System Management и I/O Subsystem',
      html: `
<table class="t">
  <tr><th>Область</th><th>Суть</th><th>Activities ОС</th></tr>
  <tr><td><b>Memory Management</b></td><td>для выполнения все (или часть) инструкций и данных программы должны быть в памяти; решает, что и когда лежит в памяти; оптимизирует CPU utilization и response</td><td>отслеживать, какие части памяти заняты и кем; решать, какие процессы (или их части) и данные загружать/выгружать; allocate/deallocate memory</td></tr>
  <tr><td><b>Mass-Storage Management</b></td><td>диски — для данных, не помещающихся в память или хранящихся долго; скорость всей системы зависит от disk subsystem и его алгоритмов</td><td>mounting/unmounting, <b>free-space management</b>, storage allocation, <b>disk scheduling</b>, partitioning, protection</td></tr>
  <tr><td><b>File-system Management</b></td><td>единый логический взгляд на хранение: физические свойства абстрагируются в <b>file</b>; носитель управляется устройством (disk drive, tape drive) — свойства: access speed, capacity, data-transfer rate, access method (sequential / random); файлы в directories; access control</td><td>creating/deleting files и directories; primitives для манипуляции ими; mapping files onto secondary storage; backup на stable (non-volatile) носители</td></tr>
</table>
<p><b>I/O Subsystem</b> — скрывает особенности (peculiarities) hardware devices от пользователя. Отвечает за:</p>
<ul>
  <li>memory management of I/O:
    <ul>
      <li><b>buffering</b> — временное хранение данных во время передачи;</li>
      <li><b>caching</b> — хранение части данных в быстрой памяти для производительности;</li>
      <li><b>spooling</b> — перекрытие (overlapping) вывода одного job с вводом других jobs;</li>
    </ul>
  </li>
  <li>general <b>device-driver interface</b>;</li>
  <li>drivers для конкретных hardware devices.</li>
</ul>`,
      exam: 'Различать buffering / caching / spooling; к какой области относится activity (disk scheduling, free-space — mass storage).'
    },
    {
      id: 'protection',
      h: 'Protection and Security',
      html: `
<ul>
  <li><b>Protection</b> — любой механизм контроля доступа процессов или пользователей к ресурсам, определённым ОС.</li>
  <li><b>Security</b> — защита системы от внутренних и внешних атак: denial-of-service, worms, viruses, identity theft, theft of service.</li>
  <li>Системы сначала различают пользователей (кто что может):
    <ul>
      <li><b>User identities</b> (<b>user IDs</b>, <b>security IDs</b>) — имя и номер, один на пользователя;</li>
      <li>user ID связывается со всеми файлами и процессами пользователя для access control;</li>
      <li><b>Group identifier (group ID)</b> — задаёт множество пользователей и управляет правами; тоже связан с каждым процессом и файлом;</li>
      <li><b>Privilege escalation</b> — пользователь может перейти на <b>effective ID</b> с большими правами.</li>
    </ul>
  </li>
</ul>`,
      exam: 'Protection (контроль доступа) vs security (защита от атак); user ID, group ID, privilege escalation.'
    },
    {
      id: 'virtualization',
      h: 'Virtualization',
      html: `
<ul>
  <li>Позволяет ОС запускать приложения внутри других ОС; огромная и растущая индустрия.</li>
  <li><b>Emulation</b> — когда тип CPU источника отличается от целевого (PowerPC → Intel x86); обычно <b>самый медленный</b> метод.</li>
  <li><b>Interpretation</b> — когда язык не компилируется в native code.</li>
  <li><b>Virtualization</b> — ОС нативно скомпилирована для CPU и запускает <b>guest</b> ОС, тоже нативно скомпилированные. Пример: VMware с guests WinXP поверх native WinXP host.</li>
  <li><b>VMM (virtual machine manager)</b> предоставляет сервисы виртуализации.</li>
</ul>
<p>Use cases:</p>
<ul>
  <li>laptops/desktops с несколькими ОС для изучения или совместимости (Mac OS X host, Windows guest);</li>
  <li>разработка приложений под несколько ОС без нескольких машин; QA-тестирование;</li>
  <li>выполнение и управление вычислительными средами в data centers.</li>
</ul>
<div class="callout note">VMM может работать <b>нативно</b> — тогда он сам и есть host, general-purpose host-ОС нет (<b>VMware ESX</b>, <b>Citrix XenServer</b>).</div>
<p><b>Computing Environments – Virtualization</b>: (a) processes → kernel → hardware; (b) у каждой VM свой kernel, под ними — VMM, затем hardware.</p>`,
      viz: [{ name: 'graph', caption: '(a) без виртуализации · (b) VM1–VM3 поверх virtual machine manager', props: { w: 600, h: 300,
        nodes: [
          { id: 'pa', label: 'processes', x: 75, y: 50 },
          { id: 'ka', label: 'kernel', x: 75, y: 160, tone: 'acc' },
          { id: 'ha', label: 'hardware', x: 75, y: 260, tone: 'muted' },
          { id: 'p1', label: 'processes', x: 290, y: 40 }, { id: 'p2', label: 'processes', x: 410, y: 40 }, { id: 'p3', label: 'processes', x: 530, y: 40 },
          { id: 'k1', label: 'kernel', sub: 'VM1', x: 290, y: 120, tone: 'acc' }, { id: 'k2', label: 'kernel', sub: 'VM2', x: 410, y: 120, tone: 'acc' }, { id: 'k3', label: 'kernel', sub: 'VM3', x: 530, y: 120, tone: 'acc' },
          { id: 'vmm', label: 'virtual machine manager', x: 410, y: 200, w: 340, tone: 'warn' },
          { id: 'hb', label: 'hardware', x: 410, y: 265, w: 340, tone: 'muted' }],
        edges: [
          { from: 'pa', to: 'ka', label: 'programming interface' }, { from: 'ka', to: 'ha' },
          { from: 'p1', to: 'k1' }, { from: 'p2', to: 'k2' }, { from: 'p3', to: 'k3' },
          { from: 'k1', to: 'vmm' }, { from: 'k2', to: 'vmm' }, { from: 'k3', to: 'vmm' }, { from: 'vmm', to: 'hb' }] } }],
      exam: 'Emulation vs interpretation vs virtualization; роль VMM; native VMM (ESX, XenServer).'
    },
    {
      id: 'environments',
      h: 'Distributed Systems и Computing Environments',
      html: `
<p><b>Distributed Systems</b>:</p>
<ul>
  <li>Набор отдельных, возможно <b>heterogeneous</b>, систем, объединённых сетью.</li>
  <li>Сеть — путь коммуникации, чаще всего <b>TCP/IP</b>: <b>LAN</b> (Local), <b>WAN</b> (Wide), <b>MAN</b> (Metropolitan), <b>PAN</b> (Personal Area Network).</li>
  <li><b>Network Operating System</b> предоставляет функции между системами по сети; communication scheme позволяет обмениваться сообщениями; создаёт <b>illusion of a single system</b>.</li>
</ul>
<p><b>Computing Environments</b>: Basic, Mobile, Client-Server, Peer-to-Peer, Cloud computing, Real-time Embedded.</p>
<table class="t">
  <tr><th>Environment</th><th>Суть</th></tr>
  <tr><td><b>Basic (traditional)</b></td><td>stand-alone general-purpose machines, но границы размыты — системы связаны (Internet); <b>portals</b> дают web-доступ к внутренним системам; <b>network computers (thin clients)</b> — как Web terminals; mobile — через <b>wireless networks</b>; даже дома — <b>firewalls</b></td></tr>
  <tr><td><b>Mobile</b></td><td>smartphones, tablets; больше OS features (GPS, gyroscope) → новые приложения (<b>augmented reality</b>); IEEE 802.11 wireless или cellular data; лидеры — <b>Apple iOS</b> и <b>Google Android</b></td></tr>
  <tr><td><b>Client-Server</b></td><td>dumb terminals вытеснены smart PCs; многие системы — <b>servers</b>, отвечающие на запросы <b>clients</b>: <b>compute-server system</b> (интерфейс для запроса сервисов, например database), <b>file-server system</b> (хранение и получение файлов)</td></tr>
  <tr><td><b>Peer-to-Peer (P2P)</b></td><td>ещё одна модель distributed system: нет различия client/server, все узлы — <b>peers</b>, каждый может быть client, server или обоими; узел должен join P2P network: зарегистрировать сервис в central lookup service или broadcast запрос и отвечать через <b>discovery protocol</b>; примеры: Napster, Gnutella, <b>VoIP</b> (Skype)</td></tr>
  <tr><td><b>Real-Time Embedded</b></td><td>самая распространённая форма компьютеров; special purpose, limited purpose OS, <b>real-time OS</b>; некоторые без ОС. RTOS имеет <b>well-defined fixed time constraints</b>: обработка должна уложиться в ограничение, работа корректна, <b>только если ограничения соблюдены</b></td></tr>
</table>
<div data-viz="0"></div>
<div data-viz="1"></div>`,
      viz: [
        { name: 'graph', caption: 'Client-Server Computing', props: { w: 600, h: 230,
          nodes: [
            { id: 's', label: 'Server', x: 80, y: 115, shape: 'pill', tone: 'acc' },
            { id: 'n', label: 'Network', x: 290, y: 115, shape: 'pill', tone: 'muted' },
            { id: 'c1', label: 'client desktop', x: 505, y: 35, shape: 'pill' },
            { id: 'c2', label: 'client laptop', x: 505, y: 115, shape: 'pill' },
            { id: 'c3', label: 'client smartphone', x: 505, y: 195, shape: 'pill' }],
          edges: [{ from: 's', to: 'n', both: true }, { from: 'n', to: 'c1', both: true }, { from: 'n', to: 'c2', both: true }, { from: 'n', to: 'c3', both: true }] } },
        { name: 'graph', caption: 'Peer-to-Peer: каждый узел — и client, и server', props: { w: 420, h: 300,
          nodes: [
            { id: 'a', label: 'peer', x: 210, y: 40, shape: 'pill', tone: 'c1' }, { id: 'b', label: 'peer', x: 360, y: 130, shape: 'pill', tone: 'c2' },
            { id: 'c', label: 'peer', x: 300, y: 260, shape: 'pill', tone: 'c3' }, { id: 'd', label: 'peer', x: 120, y: 260, shape: 'pill', tone: 'c4' },
            { id: 'e', label: 'peer', x: 60, y: 130, shape: 'pill', tone: 'c5' }],
          edges: [
            { from: 'a', to: 'b', both: true }, { from: 'a', to: 'c', both: true }, { from: 'a', to: 'd', both: true }, { from: 'a', to: 'e', both: true },
            { from: 'b', to: 'c', both: true }, { from: 'b', to: 'd', both: true }, { from: 'b', to: 'e', both: true },
            { from: 'c', to: 'd', both: true }, { from: 'c', to: 'e', both: true }, { from: 'd', to: 'e', both: true }] } }
      ],
      exam: 'P2P vs client-server; compute-server vs file-server; признак real-time OS (fixed time constraints).'
    },
    {
      id: 'cloud',
      h: 'Cloud Computing',
      html: `
<ul>
  <li>Предоставляет вычисления, хранение и даже приложения <b>как сервис</b> по сети.</li>
  <li>Логическое расширение <b>virtualization</b> — использует её как основу.</li>
  <li><b>Amazon EC2</b>: тысячи серверов, миллионы VM, петабайты storage через Internet, оплата по использованию.</li>
</ul>
<table class="t">
  <tr><th>Type</th><th>Что это</th><th>Пример</th></tr>
  <tr><td><b>Public cloud</b></td><td>доступно через Internet любому, кто платит</td><td>—</td></tr>
  <tr><td><b>Private cloud</b></td><td>компания держит облако для собственных нужд</td><td>—</td></tr>
  <tr><td><b>Hybrid cloud</b></td><td>включает public и private компоненты</td><td>—</td></tr>
  <tr><td><b>SaaS</b> (Software as a Service)</td><td>одно или несколько приложений через Internet</td><td>word processor</td></tr>
  <tr><td><b>PaaS</b> (Platform as a Service)</td><td>программный стек, готовый для приложений, через Internet</td><td>database server</td></tr>
  <tr><td><b>IaaS</b> (Infrastructure as a Service)</td><td>серверы или storage через Internet</td><td>storage для backup</td></tr>
</table>
<p>Cloud-среды = traditional OSes + <b>VMMs</b> + cloud management tools; подключение к Internet требует защиты (<b>firewalls</b>); <b>load balancers</b> распределяют трафик между приложениями.</p>`,
      viz: [{ name: 'graph', caption: 'Структура cloud computing environment', props: { w: 600, h: 300,
        nodes: [
          { id: 'inet', label: 'Internet', x: 300, y: 30, shape: 'pill', tone: 'acc' },
          { id: 'fw', label: 'firewall', x: 300, y: 100, tone: 'bad' },
          { id: 'lb', label: 'load balancer', x: 300, y: 170, tone: 'warn' },
          { id: 'cci', label: 'cloud customer interface', x: 510, y: 100, w: 150 },
          { id: 'vm1', label: 'virtual machines', x: 85, y: 260, w: 130 },
          { id: 'vm2', label: 'virtual machines', x: 230, y: 260, w: 130 },
          { id: 'st', label: 'storage', x: 365, y: 260, w: 110 },
          { id: 'cms', label: 'cloud management services', x: 515, y: 260, w: 160, tone: 'muted' }],
        edges: [
          { from: 'inet', to: 'fw' }, { from: 'fw', to: 'lb' },
          { from: 'lb', to: 'vm1' }, { from: 'lb', to: 'vm2' }, { from: 'lb', to: 'st' }, { from: 'lb', to: 'cms' },
          { from: 'inet', to: 'cci', label: 'customer requests', dashed: true },
          { from: 'cci', to: 'cms', label: 'cloud management commands', dashed: true }] } }],
      exam: 'Различать public/private/hybrid и SaaS/PaaS/IaaS по примерам (word processor / database server / storage for backup).'
    },
    {
      id: 'open-source',
      h: 'Free and Open-Source Operating Systems',
      html: `
<ul>
  <li>ОС распространяются в виде <b>source code</b>, а не только бинарников (<b>closed-source</b>, proprietary).</li>
  <li>Противоположность движению <b>copy protection</b> и <b>Digital Rights Management (DRM)</b>.</li>
  <li>Начато <b>Free Software Foundation (FSF)</b> с «<b>copyleft</b>» лицензией <b>GNU Public License (GPL)</b>.</li>
  <li><b>Free software</b> и <b>open-source software</b> — две разные идеи, продвигаемые разными группами людей.</li>
  <li>Примеры: <b>GNU/Linux</b>, <b>BSD UNIX</b> (включая ядро Mac OS X) и многие другие.</li>
  <li>VMM вроде <b>VMware Player</b> (бесплатен на Windows) и <b>VirtualBox</b> (open source, бесплатен на многих платформах) позволяют запускать guest ОС для изучения.</li>
</ul>
<p><b>The Study of Operating Systems</b>: открытый код позволяет изучать ОС «изнутри» (в source и binary доступны Linux, BSD UNIX, Solaris, часть macOS); коммерчески нежизнеспособные ОС тоже открыты; виртуализация позволяет попробовать сотни ОС без отдельного железа; путь от студента до разработчика ОС стал проще.</p>`,
      exam: 'FSF + copyleft GPL; free software ≠ open-source software; примеры open-source ОС.'
    },
    {
      id: 'kernel-ds',
      h: 'Kernel Data Structures',
      html: `
<p>Многие похожи на стандартные структуры данных:</p>
<ul>
  <li><b>Singly linked list</b> — каждый узел хранит data и указатель на следующий; последний → null.</li>
  <li><b>Doubly linked list</b> — указатели на следующий и предыдущий; у первого prev = null, у последнего next = null.</li>
  <li><b>Circular linked list</b> — последний узел указывает на первый.</li>
</ul>
<div data-viz="0"></div>
<div data-viz="1"></div>
<ul>
  <li><b>Binary search tree</b>: left &lt;= right. Search performance — <b>O(n)</b> (в худшем случае, дерево может выродиться в список); <b>balanced binary search tree</b> — <b>O(lg n)</b>.</li>
</ul>
<div data-viz="2"></div>
<ul>
  <li><b>Hash function</b> может создать <b>hash map</b>: hash_function(key) → индекс 0…n → value.</li>
  <li><b>Bitmap</b> — строка из <b>n двоичных цифр</b>, представляющая статус <b>n элементов</b>.</li>
  <li>В Linux структуры данных определены в include files: <code>&lt;linux/list.h&gt;</code>, <code>&lt;linux/kfifo.h&gt;</code>, <code>&lt;linux/rbtree.h&gt;</code>.</li>
</ul>
<div data-viz="3"></div>`,
      viz: [
        { name: 'flow', caption: 'Singly linked list', props: { dir: 'h', steps: [{ label: 'data', tone: 'acc' }, { label: 'data', tone: 'acc' }, { label: 'data', tone: 'acc' }, { label: 'null', tone: 'muted' }] } },
        { name: 'flow', caption: 'Circular linked list: последний указывает на первый', props: { dir: 'h', loop: true, steps: [{ label: 'data', tone: 'c2' }, { label: 'data', tone: 'c2' }, { label: 'data', tone: 'c2' }, { label: 'data', tone: 'c2' }] } },
        { name: 'tree', caption: 'Binary search tree со слайда', props: { root: { label: '17', tone: 'acc', children: [
          { label: '12', children: [{ label: '6' }, { label: '14' }] },
          { label: '35', children: [{ label: '32' }, { label: '40' }] }] } } },
        { name: 'flow', caption: 'Hash map', props: { dir: 'h', steps: [{ label: 'key' }, { label: 'hash_function(key)', tone: 'acc' }, { label: 'hash map [0…n]', tone: 'warn' }, { label: 'value', tone: 'ok' }] } }
      ],
      exam: 'Сложность поиска: BST O(n), balanced BST O(lg n); определение bitmap; виды списков.'
    }
  ],
  terms: [
    { en: 'Operating system', ru: 'Операционная система', def: 'Программа-посредник между пользователем и hardware; resource allocator и control program.' },
    { en: 'Kernel', ru: 'Ядро', def: 'Единственная программа, работающая на компьютере всё время; часть ОС.' },
    { en: 'System program', ru: 'Системная программа', def: 'Поставляется вместе с ОС, но не является частью kernel.' },
    { en: 'Middleware', ru: 'Промежуточное ПО', def: 'Software frameworks с доп. сервисами для разработчиков (databases, multimedia, graphics).' },
    { en: 'Device controller', ru: 'Контроллер устройства', def: 'Hardware, управляющий устройством определённого типа; имеет local buffer; сообщает о завершении через interrupt.' },
    { en: 'Device driver', ru: 'Драйвер устройства', def: 'Software в ОС: переводит запросы ОС в команды контроллера; uniform interface между контроллером и kernel.' },
    { en: 'Interrupt vector', ru: 'Вектор прерываний', def: 'Таблица адресов всех interrupt service routines.' },
    { en: 'Interrupt Service Routine (ISR)', ru: 'Обработчик прерывания', def: 'Код, которому передаётся управление при прерывании данного типа.' },
    { en: 'Trap / exception', ru: 'Ловушка / исключение', def: 'Software-generated interrupt: ошибка (division by zero) или запрос сервиса ОС (system call).' },
    { en: 'Device-status table', ru: 'Таблица состояния устройств', def: 'Запись на каждое I/O device: type, address, state.' },
    { en: 'DRAM', ru: 'Динамическая RAM', def: 'Dynamic Random-access Memory — типичная реализация main memory (volatile, random access).' },
    { en: 'Caching', ru: 'Кэширование', def: 'Временное копирование используемых данных из медленной памяти в быструю.' },
    { en: 'Cache coherency', ru: 'Согласованность кэшей', def: 'Гарантия (в hardware), что все CPU видят в своих cache самое свежее значение.' },
    { en: 'Symmetric Multiprocessing (SMP)', ru: 'Симметричная многопроцессорность', def: 'Каждый процессор выполняет все задачи; общая main memory.' },
    { en: 'Asymmetric Multiprocessing', ru: 'Асимметричная многопроцессорность', def: 'Каждому процессору назначена своя задача.' },
    { en: 'Multicore', ru: 'Многоядерность', def: 'Несколько ядер на одном чипе: свои registers и L1 cache, общий L2 cache.' },
    { en: 'NUMA', ru: 'Неоднородный доступ к памяти', def: 'Non-Uniform Memory Access: у каждого CPU локальная память, CPU связаны interconnect.' },
    { en: 'Graceful degradation', ru: 'Плавная деградация', def: 'Система продолжает работать (медленнее) при отказе части компонентов — преимущество multiprocessors.' },
    { en: 'Storage-area network (SAN)', ru: 'Сеть хранения данных', def: 'Общее хранилище, через которое узлы кластера разделяют storage.' },
    { en: 'Bootstrap program', ru: 'Загрузчик начальной загрузки', def: 'Хранится в ROM/EPROM (firmware); инициализирует систему и загружает kernel в RAM.' },
    { en: 'systemd (PID 1)', ru: 'systemd', def: 'Первый процесс, запускаемый ядром Linux; стартует сервисы и daemons.' },
    { en: 'DMA', ru: 'Прямой доступ к памяти', def: 'Direct Memory Access: контроллер передаёт блоки прямо в память без CPU, одно прерывание на блок.' },
    { en: 'Multiprogramming', ru: 'Мультипрограммирование', def: 'Batch: в памяти несколько jobs; когда один ждёт I/O, CPU переключается на другой.' },
    { en: 'Multitasking (Timesharing)', ru: 'Разделение времени', def: 'CPU переключает jobs так часто, что пользователи взаимодействуют с ними; response time < 1 s.' },
    { en: 'Swapping', ru: 'Подкачка', def: 'Перемещение процессов между памятью и диском, если они не помещаются в память.' },
    { en: 'Virtual memory', ru: 'Виртуальная память', def: 'Позволяет выполнять процессы, не полностью находящиеся в памяти.' },
    { en: 'Dual-mode operation', ru: 'Двухрежимная работа', def: 'User mode и kernel mode; позволяет ОС защитить себя и компоненты системы.' },
    { en: 'Mode bit', ru: 'Бит режима', def: 'Аппаратный бит: kernel = 0, user = 1; меняется через system call (trap) и return.' },
    { en: 'Privileged instructions', ru: 'Привилегированные инструкции', def: 'Инструкции, выполнимые только в kernel mode (например, установка timer).' },
    { en: 'Timer', ru: 'Таймер', def: 'Счётчик, уменьшаемый часами; при 0 — interrupt, ОС возвращает себе управление.' },
    { en: 'Spooling', ru: 'Спулинг', def: 'Перекрытие вывода одного job с вводом других jobs.' },
    { en: 'Protection / Security', ru: 'Защита / Безопасность', def: 'Protection — контроль доступа к ресурсам; security — защита от внутренних и внешних атак.' },
    { en: 'Privilege escalation', ru: 'Повышение привилегий', def: 'Переход пользователя на effective ID с большими правами.' },
    { en: 'Emulation', ru: 'Эмуляция', def: 'Выполнение кода для другого типа CPU (PowerPC → x86); обычно самый медленный метод.' },
    { en: 'VMM', ru: 'Монитор виртуальных машин', def: 'Virtual machine manager — предоставляет сервисы виртуализации; может быть native host (ESX, XenServer).' },
    { en: 'Peer-to-Peer (P2P)', ru: 'Одноранговая сеть', def: 'Нет различия client/server: каждый узел может быть клиентом, сервером или обоими.' },
    { en: 'SaaS / PaaS / IaaS', ru: 'Модели облака', def: 'Приложения / программная платформа (DB server) / серверы и storage как сервис через Internet.' },
    { en: 'Real-time OS', ru: 'ОС реального времени', def: 'Имеет фиксированные временные ограничения; работа корректна только при их соблюдении.' },
    { en: 'GPL', ru: 'GNU Public License', def: 'Copyleft-лицензия Free Software Foundation.' },
    { en: 'Bitmap', ru: 'Битовая карта', def: 'Строка из n двоичных цифр, представляющая статус n элементов.' }
  ],
  questions: [
    { id: 'bas-01', type: 'multi', q: 'Какие 4 компонента выделяются в Computer System Structure? (несколько ответов)', options: ['Hardware', 'Bootstrap program', 'Device-status table', 'Users', 'Application programs', 'Operating system'], answer: [0, 3, 4, 5], explain: 'Users, application programs, operating system, hardware. Bootstrap и device-status table — части ОС/системы, а не компоненты верхнего уровня.', section: 'computer-system', diff: 1 },
    { id: 'bas-02', type: 'single', q: 'Из каких групп линий состоит BUS в архитектуре Von Neumann?', options: ['data, instruction, interrupt', 'address, cache, control', 'input, output, storage', 'data, address, control'], answer: 3, explain: 'На схеме Von Neumann шина = data lines + address lines + control lines.', section: 'computer-system', diff: 1 },
    { id: 'bas-03', type: 'multi', q: 'Какие цели (goals) ОС названы на слайдах? (несколько ответов)', options: ['Maximize the number of installed applications', 'Remove the need for device drivers', 'Execute user programs and make solving user problems easier', 'Make the computer system convenient to use', 'Use the computer hardware in an efficient manner'], answer: [2, 3, 4], explain: 'Три цели: выполнять программы и облегчать решение задач, удобство, эффективное использование hardware.', section: 'what-is-os', diff: 1 },
    { id: 'bas-04', type: 'single', q: 'Какая программа, по определению, работает на компьютере всё время?', options: ['Middleware', 'Kernel', 'Shell', 'Bootstrap program'], answer: 1, explain: '«The one program running at all times on the computer is the kernel». Bootstrap работает только при загрузке.', section: 'what-is-os', diff: 1 },
    { id: 'bas-05', type: 'tf', q: 'System program поставляется вместе с ОС и является частью kernel.', answer: false, explain: 'System program ships with the OS, но НЕ является частью kernel.', section: 'what-is-os', diff: 2 },
    { id: 'bas-06', type: 'single', q: 'Какая последовательность соответствует слайду Evolution of Operating Systems?', options: ['Batch → Serial → Time Sharing → Multiprogramming → Parallel → Distributed → Network-based', 'Serial → Multiprogramming → Batch → Parallel → Time Sharing → Network-based → Distributed', 'Batch → Multiprogramming → Serial → Time Sharing → Network-based → Parallel → Distributed', 'Serial → Batch → Multiprogramming → Time Sharing → Parallel → Network-based → Distributed'], answer: 3, explain: '1940 Serial, 1950 Batch, 1960 Multiprogramming, 1965 Time Sharing, 1980 Parallel, 1995 Network-based, 2010 Distributed.', section: 'evolution', diff: 2 },
    { id: 'bas-07', type: 'single', q: 'Как device controller сообщает CPU, что закончил операцию?', options: ['Выполняет system call', 'Посылает процессу сигнал SIGINT', 'Вызывает interrupt', 'Записывает флаг в main memory, которую CPU постоянно опрашивает'], answer: 2, explain: '«Device controller informs CPU that it has finished its operation by causing an interrupt». System call делает программа, а не контроллер.', section: 'organization', diff: 1 },
    { id: 'bas-08', type: 'single', q: 'Что из перечисленного является software, а не hardware?', options: ['Graphics controller', 'Disk driver', 'Disk controller', 'USB controller'], answer: 1, explain: 'Controller — hardware («operator»), driver — software-слой в ОС («translator»).', section: 'organization', diff: 2 },
    { id: 'bas-09', type: 'single', q: 'Что содержит interrupt vector?', options: ['Адреса всех interrupt service routines', 'Копию registers прерванного процесса', 'Type, address и state каждого устройства', 'Очередь процессов, ожидающих I/O'], answer: 0, explain: 'Interrupt vector — таблица адресов service routines. Type/address/state — это device-status table.', section: 'interrupts', diff: 1 },
    { id: 'bas-10', type: 'single', q: 'Trap (exception) — это…', options: ['аппаратное прерывание от контроллера диска', 'прерывание, которое нельзя замаскировать', 'сигнал, посылаемый ОС процессу при CTRL+C', 'software-generated interrupt, вызванное ошибкой или запросом пользователя'], answer: 3, explain: 'По слайду: «A trap or exception is a software-generated interrupt caused either by an error or a user request».', section: 'interrupts', diff: 2 },
    { id: 'bas-11', type: 'single', q: 'В interrupt-driven I/O cycle когда CPU проверяет наличие прерываний?', options: ['Только после завершения процесса', 'Только когда device driver вызывает wait', 'Между выполнением инструкций', 'Посреди выполнения каждой инструкции'], answer: 2, explain: '«CPU executing checks for interrupts between instructions» — прерывание не разрывает инструкцию посередине.', section: 'interrupts', diff: 3 },
    { id: 'bas-12', type: 'tf', q: 'Если управление возвращается программе только по завершении I/O, одновременно может быть несколько outstanding I/O requests.', answer: false, explain: 'В этом варианте «at most one I/O request is outstanding at a time» — параллельной обработки I/O нет.', section: 'io-structure', diff: 2 },
    { id: 'bas-13', type: 'single', q: 'Чему равен 1 GB по определениям со слайда?', options: ['1024³ bytes', '1000³ bytes', '1024² bytes', '2³⁰ bits'], answer: 0, explain: 'KB = 1024 B, MB = 1024² B, GB = 1024³ B. 2³⁰ — это bytes, а не bits.', section: 'storage', diff: 2 },
    { id: 'bas-14', type: 'multi', q: 'Какие уровни storage-device hierarchy являются volatile? (несколько ответов)', options: ['cache', 'main memory', 'nonvolatile memory', 'hard-disk drives', 'registers'], answer: [0, 1, 4], explain: 'Граница volatile/nonvolatile проходит под main memory: registers, cache, main memory — volatile; NVM и HDD — nonvolatile.', section: 'storage', diff: 2 },
    { id: 'bas-15', type: 'single', q: 'По таблице Characteristics of Various Types of Storage, кто управляет cache (level 2)?', options: ['operating system', 'user program', 'hardware', 'compiler'], answer: 2, explain: 'Registers — compiler, cache — hardware, main memory и диски — operating system.', section: 'caching', diff: 3 },
    { id: 'bas-16', type: 'single', q: 'Как называется требование, чтобы в multiprocessor environment все CPU имели в cache самое свежее значение?', options: ['Spooling', 'Cache coherency', 'Virtual memory', 'Swapping'], answer: 1, explain: 'Cache coherency обеспечивается в hardware. Swapping и spooling — другие механизмы.', section: 'caching', diff: 2 },
    { id: 'bas-17', type: 'multi', q: 'Какие преимущества multiprocessor systems названы на слайде? (несколько ответов)', options: ['Increased throughput', 'Economy of scale', 'Increased reliability (graceful degradation / fault tolerance)', 'Не нужна ОС', 'Отсутствие конкуренции за память'], answer: [0, 1, 2], explain: 'Три преимущества: throughput, economy of scale, reliability.', section: 'architecture', diff: 1 },
    { id: 'bas-18', type: 'single', q: 'Чем Asymmetric Multiprocessing отличается от Symmetric Multiprocessing?', options: ['В asymmetric все процессоры выполняют все задачи, в SMP у каждого своя задача', 'В asymmetric процессоры не разделяют память, в SMP нет cache', 'Это синонимы', 'В asymmetric каждому процессору назначена своя задача, в SMP каждый процессор выполняет все задачи'], answer: 3, explain: 'Asymmetric — specific task на процессор; symmetric — each processor performs all tasks.', section: 'architecture', diff: 2 },
    { id: 'bas-19', type: 'single', q: 'Asymmetric clustering — это…', options: ['кластер для HPC с parallelization', 'кластер без общего storage', 'одна машина находится в hot-standby mode', 'несколько узлов выполняют приложения и следят друг за другом'], answer: 2, explain: 'Asymmetric — hot-standby; symmetric — все узлы работают и мониторят друг друга.', section: 'clustered', diff: 2 },
    { id: 'bas-20', type: 'single', q: 'Что получает foreground-процесс при нажатии CTRL+C в терминале?', options: ['Interrupt вектора 0', 'SIGINT', 'SIGKILL', 'SIGSEGV'], answer: 1, explain: 'Пример из Resume: CTRL+C посылает SIGINT. SIGKILL/SIGSEGV — другие сигналы.', section: 'resume', diff: 1 },
    { id: 'bas-21', type: 'single', q: 'Правильный порядок загрузки Linux-системы:', options: ['BIOS/UEFI (POST) → Bootloader (GRUB) → Linux kernel → systemd (PID 1) → login screen', 'Bootloader (GRUB) → BIOS/UEFI → systemd → Linux kernel → login screen', 'BIOS/UEFI → Linux kernel → Bootloader (GRUB) → systemd → login screen', 'systemd → BIOS/UEFI → GRUB → Linux kernel → login screen'], answer: 0, explain: 'Firmware делает POST и ищет boot sector, GRUB грузит ядро, ядро запускает первый процесс systemd.', section: 'startup', diff: 2 },
    { id: 'bas-22', type: 'multi', q: 'Что вызывает software interrupt (exception или trap)? (несколько ответов)', options: ['Завершение передачи блока контроллером', 'Software error, например division by zero', 'Запрос сервиса ОС — system call', 'Нажатие клавиши на клавиатуре'], answer: [1, 2], explain: 'Software interrupt = ошибка в программе или system call. Клавиатура и контроллер дают hardware interrupt.', section: 'startup', diff: 3 },
    { id: 'bas-23', type: 'single', q: 'Сколько прерываний генерируется при передаче через DMA?', options: ['Ни одного', 'Одно на каждый word', 'Одно на блок', 'Одно на байт'], answer: 2, explain: '«Only one interrupt is generated per block, rather than the one interrupt per byte».', section: 'dma', diff: 2 },
    { id: 'bas-24', type: 'single', q: 'Что делает ОС в multiprogramming (batch) системе, когда job должен ждать I/O?', options: ['Перезагружает job с диска', 'Переключается на другой job', 'Крутится в busy waiting до конца I/O', 'Завершает job'], answer: 1, explain: '«When job has to wait (for I/O for example), OS switches to another job» — CPU всегда занят.', section: 'multiprogramming', diff: 2 },
    { id: 'bas-25', type: 'single', q: 'Каким должно быть response time в timesharing-системе?', options: ['< 1 second', '< 1 ms', '< 10 seconds', 'Не имеет значения'], answer: 0, explain: 'Слайд Multitasking: response time should be < 1 second.', section: 'multiprogramming', diff: 1 },
    { id: 'bas-26', type: 'single', q: 'Какое значение mode bit в kernel mode (по схеме Transition from User to Kernel Mode)?', options: ['1', '2', 'Зависит от процесса', '0'], answer: 3, explain: 'Trap устанавливает mode bit = 0 (kernel), return — mode bit = 1 (user).', section: 'dual-mode', diff: 2 },
    { id: 'bas-27', type: 'single', q: 'Зачем ОС использует timer?', options: ['Чтобы синхронизировать cache разных CPU', 'Чтобы загрузить kernel при включении', 'Чтобы процесс не зациклился и не захватил ресурсы: по прерыванию ОС возвращает себе управление', 'Чтобы измерять access time диска'], answer: 2, explain: 'Timer предотвращает infinite loop / hogging: счётчик доходит до 0 → interrupt → ОС планирует или завершает программу.', section: 'dual-mode', diff: 2 },
    { id: 'bas-28', type: 'single', q: 'Какое утверждение о program и process верно?', options: ['Process — это файл на диске', 'Program — passive entity, process — active entity', 'Program — active entity, process — passive entity', 'Program и process — одно и то же'], answer: 1, explain: 'Process — program in execution (активная сущность); программа на диске пассивна.', section: 'process-mgmt', diff: 1 },
    { id: 'bas-29', type: 'multi', q: 'Какие activities относятся к process management? (несколько ответов)', options: ['Suspending and resuming processes', 'Mechanisms for deadlock handling', 'Free-space management', 'Mounting and unmounting', 'Creating and deleting user and system processes'], answer: [0, 1, 4], explain: 'Free-space management и mounting — activities mass-storage management.', section: 'process-mgmt', diff: 2 },
    { id: 'bas-30', type: 'single', q: 'Spooling по определению со слайда I/O Subsystem — это…', options: ['хранение части данных в быстрой памяти для производительности', 'временное хранение данных во время передачи', 'перемещение процессов между памятью и диском', 'перекрытие вывода одного job с вводом других jobs'], answer: 3, explain: 'Второй вариант — caching, третий — buffering, четвёртый — swapping.', section: 'resource-mgmt', diff: 3 },
    { id: 'bas-31', type: 'single', q: 'Какая activity относится к Mass-Storage Management?', options: ['Cache coherency', 'Job scheduling', 'Disk scheduling', 'Process synchronization'], answer: 2, explain: 'Mass-storage: mounting, free-space management, storage allocation, disk scheduling, partitioning, protection.', section: 'resource-mgmt', diff: 2 },
    { id: 'bas-32', type: 'single', q: 'Чем protection отличается от security?', options: ['Protection — только для сетей, security — только для дисков', 'Protection — контроль доступа процессов/пользователей к ресурсам; security — защита от внутренних и внешних атак', 'Protection — защита от вирусов; security — контроль доступа к файлам', 'Это синонимы'], answer: 1, explain: 'Определения со слайда Protection and Security.', section: 'protection', diff: 1 },
    { id: 'bas-33', type: 'single', q: 'Когда используется emulation?', options: ['Когда тип CPU источника отличается от целевого (PowerPC → Intel x86)', 'Когда guest и host скомпилированы для одного CPU', 'Когда язык не компилируется в native code', 'Когда VMM работает нативно без host-ОС'], answer: 0, explain: 'Emulation — разные CPU, самый медленный метод. Не-native язык — interpretation; одинаковый CPU — virtualization.', section: 'virtualization', diff: 3 },
    { id: 'bas-34', type: 'single', q: 'Что верно для Peer-to-Peer?', options: ['Есть один выделенный server и много clients', 'Узлы не могут обнаруживать сервисы друг друга', 'Используется только в LAN', 'Нет различия между client и server: каждый узел может быть client, server или обоими'], answer: 3, explain: 'В P2P все узлы — peers; сервисы находятся через central lookup service или discovery protocol.', section: 'environments', diff: 2 },
    { id: 'bas-35', type: 'single', q: 'Главный признак real-time OS:', options: ['Работа только без ОС', 'Обязательная поддержка virtualization', 'Well-defined fixed time constraints; работа корректна, только если они соблюдены', 'Наличие GUI и touch screen'], answer: 2, explain: 'RTOS: обработка должна завершиться в пределах ограничения, иначе система работает некорректно.', section: 'environments', diff: 2 },
    { id: 'bas-36', type: 'single', q: 'Storage, доступный через Internet для backup, — это пример…', options: ['Private cloud', 'IaaS', 'SaaS', 'PaaS'], answer: 1, explain: 'IaaS — servers или storage; SaaS — приложения (word processor); PaaS — программный стек (database server).', section: 'cloud', diff: 2 },
    { id: 'bas-37', type: 'single', q: 'Кто начал движение free software и с какой лицензией?', options: ['Free Software Foundation (FSF), copyleft GNU Public License (GPL)', 'Microsoft, Digital Rights Management (DRM)', 'Apple, BSD license', 'VMware, VirtualBox license'], answer: 0, explain: 'FSF с copyleft GPL; DRM — как раз то, чему open source противостоит.', section: 'open-source', diff: 2 },
    { id: 'bas-38', type: 'single', q: 'Search performance в binary search tree (без балансировки) по слайду —', options: ['O(lg n)', 'O(1)', 'O(n²)', 'O(n)'], answer: 3, explain: 'Несбалансированное BST может выродиться в список → O(n). O(lg n) — у balanced BST.', section: 'kernel-ds', diff: 3 },
    { id: 'bas-39', type: 'single', q: 'Bitmap — это…', options: ['дерево с ключами left <= right', 'массив, индексируемый hash_function(key)', 'строка из n двоичных цифр, представляющая статус n элементов', 'таблица адресов interrupt service routines'], answer: 2, explain: 'Определение со слайда Kernel Data Structures; остальное — interrupt vector, BST, hash map.', section: 'kernel-ds', diff: 1 }
  ]
});
