OS.addModule({
  id: 'io',
  num: 8,
  group: 'theory',
  title: 'I/O Systems',
  titleRu: 'Системы ввода-вывода',
  icon: '🔌',
  sources: ['11-IO.pdf'],
  summary: 'Разнородность устройств, шина и транзакции, controller и его registers, режимы I/O (program controlled, polling, interrupt driven, DMA), прерывания и исключения, приоритеты, device drivers, buffering vs caching, user-space I/O и spooling.',
  sections: [
    {
      id: 'heterogeneity',
      h: 'I/O device heterogeneity',
      html: `
<p>I/O устройства очень разные; их классифицируют по <b>3 измерениям</b>:</p>
<ul>
  <li><b>Behavior</b> — input / output или data storage;</li>
  <li><b>Counterparty (partners)</b> — человек (human) или машина (machine);</li>
  <li><b>Data transfer rate</b> — скорость передачи от устройства в память и обратно.</li>
</ul>
<table class="t">
  <tr><th>Device</th><th>Function</th><th>Partner</th><th>Speed (Mb/sec)</th></tr>
  <tr><td>Keyboard</td><td>input</td><td>human</td><td>0.0001</td></tr>
  <tr><td>Mouse</td><td>input</td><td>human</td><td>0.0038</td></tr>
  <tr><td>Laser printer</td><td>output</td><td>human</td><td>3.2</td></tr>
  <tr><td>Network / Wireless LAN</td><td>inputs or outputs</td><td>machine</td><td>11–54</td></tr>
  <tr><td>Network / LAN</td><td>inputs or outputs</td><td>machine</td><td>100–1000</td></tr>
  <tr><td>Optical disc</td><td>storage (memorization)</td><td>machine</td><td>80</td></tr>
  <tr><td>Magnetic disk</td><td>storage (memorization)</td><td>machine</td><td>240–2560</td></tr>
  <tr><td>Graphic card</td><td>output</td><td>human</td><td>800–8000</td></tr>
</table>
<div class="callout key">Разброс скоростей огромный: от 0.0001 (keyboard) до 8000 Mb/s (graphic card) — поэтому нужны разные механизмы I/O.</div>`,
      exam: 'Три измерения (behavior, partner, data rate); примеры из таблицы — partner и порядок скорости.'
    },
    {
      id: 'organization',
      h: 'Организация компьютера (Von Neumann) и транзакции на шине',
      html: `
<p><b>Possible organization of a calculator (Von Neumann Architecture)</b>: processor с cache и main memory подключены к общей <b>memory – I/O bus</b>; устройства (disks, graphics output, network) — через свои <b>I/O controllers</b>; контроллеры сигнализируют процессору по линиям <b>interrupts</b>.</p>
<svg class="d" viewBox="0 0 600 330">
  <line class="d-line" x1="290" y1="215" x2="290" y2="30"/>
  <line class="d-line" x1="435" y1="215" x2="435" y2="30"/>
  <line class="d-line" x1="570" y1="215" x2="570" y2="30"/>
  <line class="d-arrow" x1="570" y1="30" x2="162" y2="30"/>
  <text class="d-txt sm" x="225" y="22" text-anchor="middle">Interrupts</text>
  <rect class="d-box acc" x="40" y="12" width="120" height="40" rx="6"/>
  <text class="d-txt b" x="100" y="37" text-anchor="middle">Processor</text>
  <rect class="d-box" x="55" y="80" width="90" height="34" rx="6"/>
  <text class="d-txt" x="100" y="102" text-anchor="middle">Cache</text>
  <line class="d-line" x1="100" y1="52" x2="100" y2="80"/>
  <line class="d-line" x1="100" y1="114" x2="100" y2="150"/>
  <rect class="d-box warn" x="20" y="150" width="560" height="30" rx="6"/>
  <text class="d-txt b" x="330" y="170" text-anchor="middle">Memory – I/O bus</text>
  <line class="d-line" x1="100" y1="180" x2="100" y2="215"/>
  <line class="d-line" x1="245" y1="180" x2="245" y2="215"/>
  <line class="d-line" x1="390" y1="180" x2="390" y2="215"/>
  <line class="d-line" x1="525" y1="180" x2="525" y2="215"/>
  <rect class="d-box ok" x="40" y="215" width="120" height="60" rx="6"/>
  <text class="d-txt" x="100" y="250" text-anchor="middle">Main memory</text>
  <rect class="d-box" x="190" y="215" width="110" height="44" rx="6"/>
  <text class="d-txt sm" x="245" y="242" text-anchor="middle">I/O controller</text>
  <rect class="d-box" x="335" y="215" width="110" height="44" rx="6"/>
  <text class="d-txt sm" x="390" y="242" text-anchor="middle">I/O controller</text>
  <rect class="d-box" x="470" y="215" width="110" height="44" rx="6"/>
  <text class="d-txt sm" x="525" y="242" text-anchor="middle">I/O controller</text>
  <line class="d-line" x1="215" y1="259" x2="215" y2="285"/>
  <line class="d-line" x1="275" y1="259" x2="275" y2="285"/>
  <line class="d-line" x1="390" y1="259" x2="390" y2="285"/>
  <line class="d-line" x1="525" y1="259" x2="525" y2="285"/>
  <rect class="d-box muted" x="190" y="285" width="50" height="34" rx="6"/>
  <text class="d-txt sm" x="215" y="307" text-anchor="middle">Disk</text>
  <rect class="d-box muted" x="250" y="285" width="50" height="34" rx="6"/>
  <text class="d-txt sm" x="275" y="307" text-anchor="middle">Disk</text>
  <rect class="d-box muted" x="335" y="285" width="110" height="34" rx="6"/>
  <text class="d-txt sm" x="390" y="307" text-anchor="middle">Graphics output</text>
  <rect class="d-box muted" x="470" y="285" width="110" height="34" rx="6"/>
  <text class="d-txt sm" x="525" y="307" text-anchor="middle">Network</text>
</svg>
<p><b>Transactions on the bus</b>:</p>
<table class="t">
  <tr><th>Операция</th><th>Название транзакции</th><th>Направление</th><th>Control lines</th><th>Data lines</th></tr>
  <tr><td><b>Input operation</b></td><td><b>write transaction</b></td><td>I/O device → memory</td><td>указывают, что надо <b>записать</b> в память</td><td>адрес памяти, куда писать</td></tr>
  <tr><td><b>Output operation</b></td><td><b>read transaction</b></td><td>memory → I/O device</td><td>указывают, что надо <b>прочитать</b> из памяти</td><td>адрес памяти, откуда читать</td></tr>
</table>
<div class="callout warn">Названия даны <b>с точки зрения памяти</b>: ввод (input) = запись в память (write), вывод (output) = чтение из памяти (read).</div>`,
      exam: 'Input = write transaction (device → memory), output = read transaction (memory → device) — частая ловушка.'
    },
    {
      id: 'bus',
      h: 'Bus и Bus types',
      html: `
<ul>
  <li><b>Bus</b> — канал связи между компонентами компьютера; <b>shared transmission medium</b>, к которому подключено несколько компонентов; в компьютере несколько шин.</li>
  <li>Потенциальное <b>bottleneck</b>: производительность ограничена <b>length</b> и <b>number of connected devices</b>.</li>
  <li>Состав шины:
    <ul>
      <li><b>Data lines</b> (и адресные): передают data, addresses (даже complex commands); <b>width</b> — число data lines; линии можно делить между данными и адресами — <b>multiplexing</b>;</li>
      <li><b>Control lines</b>: управляют доступом и использованием data/address lines; <b>requests</b> и <b>acks</b>, тип информации на data lines.</li>
    </ul>
  </li>
</ul>
<table class="t">
  <tr><th>Bus type</th><th>Характеристики</th></tr>
  <tr><td><b>Processor-memory bus</b></td><td>короткая, <b>высокая скорость</b>; проприетарная (на слайде «overall owner»); спроектирована для максимального bandwidth processor ↔ memory</td></tr>
  <tr><td><b>I/O buses</b></td><td>обычно длиннее и медленнее; много разных устройств; стандарты: <b>PCI</b> (Peripheral Component Interconnect), <b>FireWire</b> (IEEE 1394), <b>USB</b>, <b>SCSI</b></td></tr>
  <tr><td><b>Backplane buses</b></td><td>interconnect structure внутри корпуса (chassis); часто — промежуточная структура между I/O bus и processor-memory bus</td></tr>
</table>`,
      viz: [{ name: 'layers', caption: 'Типы шин: от процессора к устройствам', props: { layers: [
        { label: 'Processor-memory bus', sub: 'short, high speed, max CPU ↔ memory bandwidth', tone: 'acc' },
        { label: 'Backplane bus', sub: 'внутри chassis, посредник', tone: 'warn' },
        { label: 'I/O buses', sub: 'PCI, FireWire, USB, SCSI — длиннее, медленнее', tone: 'ok' }] } }],
      exam: 'Чем ограничена производительность шины; data vs control lines; multiplexing; три типа шин и стандарты I/O buses.'
    },
    {
      id: 'devices',
      h: 'I/O device = controller + device; команды и registers контроллера',
      html: `
<ul>
  <li><b>I/O device</b> состоит из двух компонентов:
    <ul>
      <li><b>actual physical device</b> (disk, printer, mouse, video…);</li>
      <li><b>device controller</b> (или <b>interface</b>), управляющий всеми операциями, которые умеет устройство.</li>
    </ul>
  </li>
  <li>Device controller — подсистема, специализированная на управлении I/O devices:
    <ul>
      <li>предоставляет <b>registers</b> для данных передачи и команд;</li>
      <li><b>стандартизирует</b> подключение устройства к остальной системе;</li>
      <li>может управлять <b>несколькими устройствами</b> одновременно.</li>
    </ul>
  </li>
</ul>
<p><b>Sending commands to an I/O device</b>:</p>
<ul>
  <li>Команды посылаются соответствующему <b>device controller</b>.</li>
  <li>I/O-инструкция языка высокого уровня превращается в <b>серию команд для контроллера</b>.</li>
  <li>Во время выполнения ОС вызывает один из своих модулей управления I/O — <b>device driver</b>.</li>
</ul>
<div data-viz="0"></div>
<p><b>Controller registers</b> (<b>I/O ports</b>):</p>
<table class="t">
  <tr><th>Register</th><th>Хранит</th></tr>
  <tr><td><code>status</code></td><td>состояние периферии (idle, busy, down…)</td></tr>
  <tr><td><code>control</code></td><td><b>команду</b> для выполнения</td></tr>
  <tr><td><code>data-in</code></td><td>данные ввода, пришедшие от устройства</td></tr>
  <tr><td><code>data-out</code></td><td>данные для вывода на устройство</td></tr>
</table>
<p>Чтобы запросить I/O, процессор должен: (1) <b>подготовить содержимое</b> предопределённых регистров контроллера; (2) <b>запустить</b> сам контроллер.</p>`,
      viz: [{ name: 'layers', caption: 'Sending commands: software (kernel, I/O subsystem, drivers) → hardware (controllers, devices)', props: { layers: [
        { label: 'kernel', tone: 'acc' },
        { label: 'kernel I/O subsystem', tone: 'acc' },
        { label: 'device drivers', sub: 'SAS · keyboard · mouse · … · PCIe bus · 802.11 · USB', tone: 'c2' },
        { label: 'device controllers', sub: 'SAS · keyboard · mouse · … · PCIe bus · 802.11 · USB', tone: 'warn' },
        { label: 'devices', sub: 'SAS devices · keyboard · mouse · PCIe bus · 802.11 devices · USB devices (disks, tapes, drives)', tone: 'muted' }] } }],
      exam: 'Два компонента I/O device; 4 регистра контроллера (I/O ports) и что в control/status; два шага запроса I/O.'
    },
    {
      id: 'modes',
      h: 'Mode of execution of I/O operations',
      html: `
<ul>
  <li>I/O devices <b>намного медленнее</b> процессора и работают <b>автономно</b>.</li>
  <li>Поэтому нужен механизм <b>синхронизации</b> для управления I/O operations.</li>
</ul>
<p>Основные техники:</p>
<table class="t">
  <tr><th>Technique</th><th>Как CPU узнаёт о готовности</th><th>Кто переносит данные</th><th>Проблема</th></tr>
  <tr><td><b>Program controlled</b></td><td>непрерывно опрашивает один контроллер (<b>busy waiting</b>)</td><td>CPU</td><td>CPU тратит время впустую</td></tr>
  <tr><td><b>Polling</b></td><td>во время busy waiting опрашивает и другие устройства</td><td>CPU</td><td>улучшение ограниченное</td></tr>
  <tr><td><b>I/O interrupt driven</b></td><td>контроллер шлёт <b>interrupt request</b>, CPU тем временем считает</td><td>CPU (interrupt handler)</td><td>для быстрых устройств CPU всё ещё занят передачей</td></tr>
  <tr><td><b>Direct Memory Access</b></td><td>DMA controller шлёт <b>одно</b> прерывание по окончании</td><td>DMA controller</td><td>—</td></tr>
</table>`,
      viz: [{ name: 'ioModes', caption: 'Что делает CPU во времени при Programmed I/O, Interrupt-driven и DMA', props: {} }],
      exam: 'Перечислить 4 техники по порядку и для каждой — кто ждёт и кто передаёт данные.'
    },
    {
      id: 'programmed',
      h: 'Program controlled I/O — busy waiting',
      html: `
<ul>
  <li><b>Полное участие процессора</b> в операции I/O.</li>
  <li>Процессор готовит контроллер, затем <b>непрерывно опрашивает</b> его, проверяя результат операции.</li>
  <li>Когда операция завершена, процессор переносит данные (для input) или выполняет новую инструкцию.</li>
  <li>Процессор всё время операции играет роль контроллера.</li>
  <li>Цикл ожидания процессора называется <b>busy waiting</b>.</li>
</ul>
<pre class="code" data-lang="c">/* CPU записал команду в control register и запустил контроллер */
while (status_reg == BUSY)
    ;                    /* busy waiting: только смотрим на status */
data = data_in_reg;      /* операция завершена: CPU сам забирает данные */</pre>
<div class="cols">
  <div class="pros"><b>+</b><ul><li>очень простой</li></ul></div>
  <div class="cons"><b>−</b><ul><li>дорогой: CPU в busy waiting ничего не делает, кроме наблюдения за устройством</li><li>не использовать для <b>медленных</b> периферийных устройств: CPU вынужден работать со скоростью периферии → вычислительная мощность теряется</li></ul></div>
</div>
<div class="callout note">Небольшое (slight) улучшение program-controlled техники — <b>polling</b>.</div>`,
      viz: [{ name: 'timeline', caption: 'Program controlled I/O: CPU занят всё время операции', props: {
        max: 12, rows: [
          { label: 'CPU', segs: [{ from: 0, to: 1, label: 'prep', tone: 'acc' }, { from: 1, to: 10, label: 'busy waiting', tone: 'bad' }, { from: 10, to: 12, label: 'transfer', tone: 'acc' }] },
          { label: 'Device', segs: [{ from: 1, to: 10, label: 'executes operation', tone: 'ok' }] }] } }],
      exam: 'Определение busy waiting; почему не подходит для медленных устройств.'
    },
    {
      id: 'polling',
      h: 'Polling',
      html: `
<ul>
  <li>Во время busy waiting на одном устройстве процессор <b>опрашивает (polls) другие I/O devices</b>.</li>
  <li>Если устройству нужно внимание — процессор выполняет передачу и продолжает опрос.</li>
  <li>Улучшение по сравнению с program control <b>ограниченное</b>.</li>
</ul>
<table class="t">
  <tr><th>Проблема polling</th><th>Суть</th></tr>
  <tr><td>С <b>медленными</b> периферийными устройствами</td><td>чрезмерная трата времени процессора — большую часть времени он в busy waiting</td></tr>
  <tr><td>С <b>быстрыми</b> периферийными устройствами</td><td>работа процессора почти исключительно сводится к собственно передаче данных</td></tr>
</table>`,
      viz: [{ name: 'flow', caption: 'Polling: CPU по кругу опрашивает устройства; нужна работа — передаёт данные и продолжает', props: { dir: 'h', loop: true, steps: [
        { label: 'busy waiting', sub: 'device A', tone: 'bad' },
        { label: 'poll device B', tone: 'muted' },
        { label: 'poll device C', tone: 'muted' },
        { label: 'transfer', sub: 'если устройство просит', tone: 'acc' }] } }],
      exam: 'Чем polling отличается от program controlled; две проблемы (медленные / быстрые устройства).'
    },
    {
      id: 'interrupt-io',
      h: 'I/O interrupt driven и Interrupt-driven I/O cycle',
      html: `
<ul>
  <li>Чтобы избежать busy waiting, нужен метод на основе <b>interrupts</b>.</li>
  <li>Процессор посылает команду контроллеру и <b>продолжает вычисления</b>, не следя за выполнением операции.</li>
  <li>Контроллер выполняет команду; когда готов к обмену данными, посылает <b>interrupt request</b>.</li>
  <li>Процессор проверяет состояние interrupt line <b>после выполнения каждой инструкции</b>.</li>
  <li>Прерывание обрабатывает <b>interrupt handler routine</b>.</li>
  <li><b>Перед</b> обработкой процессор <b>сохраняет информацию</b>, позволяющую продолжить текущую программу с точки прерывания.</li>
</ul>
<p><b>Interrupt-driven I/O cycle</b>: 1 device driver initiates I/O → 2 controller initiates I/O (CPU тем временем выполняет код, проверяя прерывания между инструкциями) → 3 input ready / output complete / error → interrupt signal → 4 CPU передаёт управление interrupt handler → 5 handler обрабатывает данные, return from interrupt → 6 CPU resumes прерванную задачу → 7 снова к шагу 1.</p>`,
      viz: [{ name: 'flow', caption: 'Interrupt-driven I/O cycle', props: { dir: 'v', loop: true, steps: [
        { label: '1. Device driver initiates I/O', sub: 'CPU', tone: 'acc' },
        { label: '2. Controller initiates I/O', sub: 'CPU checks interrupts between instructions', tone: 'muted' },
        { label: '3. Input ready / output complete / error', sub: 'controller generates interrupt signal', tone: 'warn' },
        { label: '4. CPU receives interrupt', sub: 'transfers control to interrupt handler', tone: 'bad' },
        { label: '5. Handler processes data', sub: 'returns from interrupt', tone: 'c2' },
        { label: '6. CPU resumes interrupted task', tone: 'ok' }] } }],
      exam: 'Когда CPU проверяет interrupt line (после каждой инструкции); что сохраняется перед обработкой; шаги цикла.'
    },
    {
      id: 'interrupts',
      h: 'Interruption concept, interrupt vector',
      html: `
<div class="cols">
  <div><b>Break</b> (прерывание):
    <ul><li><b>forced suspension</b> выполняемой программы;</li><li>передача управления подходящей <b>service routine</b>.</li></ul>
  </div>
  <div><b>Service routines</b>:
    <ul><li>удовлетворяют потребность, вызвавшую прерывание, и по завершении <b>возвращают управление</b> приостановленной программе.</li></ul>
  </div>
</div>
<ul>
  <li><b>Interrupt request line</b> CPU выставляется I/O device.</li>
  <li><b>Interrupt handler</b> принимает и обрабатывает прерывания.</li>
  <li>Некоторые типы прерываний можно <b>замаскировать</b> — игнорировать навсегда или отложить обслуживание.</li>
  <li><b>Interrupt vector</b> — адреса памяти специализированных handlers (interrupt handling routines); <b>priority based</b>; некоторые — <b>unmaskable</b>.</li>
  <li>Механизм прерываний используется и для <b>exceptions</b>.</li>
</ul>
<p>Интерпретация вектора прерываний (Intel):</p>
<table class="t">
  <tr><th>Vector number</th><th>Description</th></tr>
  <tr><td>0</td><td>divide error</td></tr>
  <tr><td>1</td><td>debug exception</td></tr>
  <tr><td>2</td><td>null interrupt</td></tr>
  <tr><td>3</td><td>breakpoint</td></tr>
  <tr><td>4</td><td>INTO-detected overflow</td></tr>
  <tr><td>5</td><td>bound range exception</td></tr>
  <tr><td>6</td><td>invalid opcode</td></tr>
  <tr><td>7</td><td>device not available</td></tr>
  <tr><td>8</td><td>double fault</td></tr>
  <tr><td>9</td><td>coprocessor segment overrun (reserved)</td></tr>
  <tr><td>10</td><td>invalid task state segment</td></tr>
  <tr><td>11</td><td>segment not present</td></tr>
  <tr><td>12</td><td>stack fault</td></tr>
  <tr><td>13</td><td>general protection</td></tr>
  <tr><td>14</td><td>page fault</td></tr>
  <tr><td>15</td><td>(Intel reserved, do not use)</td></tr>
  <tr><td>16</td><td>floating-point error</td></tr>
  <tr><td>17</td><td>alignment check</td></tr>
  <tr><td>18</td><td>machine check</td></tr>
  <tr><td>19–31</td><td>(Intel reserved, do not use)</td></tr>
  <tr><td><b>32–255</b></td><td><b>maskable interrupts</b></td></tr>
</table>`,
      exam: 'Break и service routine; что лежит в interrupt vector; какие векторы — maskable (32–255); примеры номеров (0 divide error, 14 page fault).'
    },
    {
      id: 'classification',
      h: 'Классификация прерываний; Requests and Interrupts',
      html: `
<p><b>Interrupt-driven I/O</b> — виды прерываний (по схеме слайда):</p>
<div data-viz="0"></div>
<table class="t">
  <tr><th>Тип запроса</th><th>Свойства</th></tr>
  <tr><td><b>External interrupt requests</b></td><td>могут прийти в любой момент — <b>asynchronous</b> относительно программы; процессор <b>завершает текущую инструкцию</b> и проверяет запросы перед fetch следующей; внешнее прерывание <b>не может</b> прервать инструкцию посередине</td></tr>
  <tr><td><b>Exceptions</b></td><td><b>приостанавливают выполнение инструкции</b>, вызвавшей аномалию (например, divide error — вектор 0)</td></tr>
  <tr><td><b>Program generated requests</b></td><td>порождаются выполнением инструкций — <b>synchronous</b> относительно программы</td></tr>
</table>`,
      viz: [{ name: 'tree', caption: 'Interrupts: hardware (external, internal) и software (program generated)', props: { root: { label: 'Interrupts', tone: 'acc', children: [
        { label: 'Hardware Interrupts', children: [
          { label: 'External or I/O Interrupts', tone: 'ok', note: 'от I/O subsystem: успешное завершение I/O, ready status, ошибка I/O' },
          { label: 'Internal Interrupts (Exceptions)', tone: 'warn', note: 'сбой, обнаруженный CPU hardware (EXCEPTION/TRAP): divide overflow, arithmetic errors, invalid instructions, address range errors; page fault — не ошибка, а замена страницы в virtual memory; debug mode' }] },
        { label: 'Software Interrupts', children: [
          { label: 'Program Generated', tone: 'c2', note: 'инструкция INT в user program: для system calls и при написании device drivers' }] }] } } }],
      exam: 'External — асинхронные, не прерывают инструкцию посередине; exceptions — прерывают «виновную» инструкцию; program generated — синхронные (INT, system calls).'
    },
    {
      id: 'exceptions',
      h: 'Exceptions — trap, fault, abort',
      html: `
<table class="t">
  <tr><th>Exception</th><th>Когда</th><th>Восстановимо?</th><th>Примеры</th></tr>
  <tr><td><b>trap</b></td><td>в конце выполнения инструкции, чтобы вызвать функциональность ОС; происходит после или во время выполнения</td><td>да (выполнение продолжается)</td><td>debugger <b>breakpoint</b>, overflow</td></tr>
  <tr><td><b>fault</b></td><td><b>recoverable</b> ошибка во время выполнения инструкции; происходит до того, как CPU сможет выполнить инструкцию</td><td>да</td><td>divide by zero, bogus instruction</td></tr>
  <tr><td><b>abort</b></td><td><b>unrecoverable</b> ошибка</td><td>нет — принудительное завершение</td><td>—</td></tr>
</table>`,
      exam: 'Trap (breakpoint, вызов ОС) vs fault (recoverable, divide by zero) vs abort (unrecoverable).'
    },
    {
      id: 'service-routines',
      h: 'Classification of service routines — maskable / non-maskable',
      html: `
<table class="t">
  <tr><th>Источник</th><th>Причина</th><th>Service routine</th></tr>
  <tr><td><b>Non-maskable external interrupt</b></td><td><b>катастрофические</b> причины, например падение напряжения питания ниже порога</td><td>единственная (тип один): выполняет recovery actions</td></tr>
  <tr><td><b>Maskable external interrupt</b></td><td>обычно <b>I/O interfaces</b></td><td><b>drivers</b>: выполняют передачу данных</td></tr>
  <tr><td><b>Exceptions</b></td><td>аномалия в программе</td><td>заменяя выполняемую программу, не дают ей продолжать работать некорректно (могут просто выдать сообщение об ошибке)</td></tr>
</table>`,
      exam: 'Non-maskable — катастрофы (питание); maskable — I/O, обслуживаются drivers.'
    },
    {
      id: 'identify',
      h: 'Как определить устройство; приоритет и вложенные прерывания',
      html: `
<p>Mechanisms to identify the I/O device that generated the interrupt:</p>
<table class="t">
  <tr><th>Механизм</th><th>Как работает</th><th>Замечания</th></tr>
  <tr><td><b>More break lines</b> (несколько линий прерываний)</td><td>отдельные линии для устройств</td><td>непрактично выделять много линий шины; используется вместе с одним из двух других; просто реализует приоритет</td></tr>
  <tr><td><b>Software poll</b></td><td>обнаружив прерывание, процессор запускает рутину, которая <b>опрашивает</b> I/O devices, чтобы найти виновника</td><td>недостаток: <b>waste of time</b></td></tr>
  <tr><td><b>Hardware interrogation, vectorized</b></td><td>общая для всех устройств interrupt request line; процессор посылает <b>acknowledgment</b>; запросившее устройство отвечает <b>interrupt vector code</b> — указатель на нужную handling routine</td><td>—</td></tr>
</table>
<p><b>Priority of interrupts</b>: когда прерывания могут посылать несколько устройств, кроме определения устройства и routine нужно:</p>
<ul>
  <li>управлять <b>приоритетом</b> прерываний;</li>
  <li>обрабатывать <b>nested breaks</b> — прерывание приходит, пока обрабатывается другое.</li>
</ul>`,
      viz: [{ name: 'timeline', caption: 'Nested interrupts: высокоприоритетное прерывание вытесняет обработку низкоприоритетного', props: {
        max: 16, rows: [
          { label: 'CPU', segs: [{ from: 0, to: 4, label: 'user program', tone: 'acc' }, { from: 4, to: 7, label: 'ISR low', tone: 'warn' }, { from: 7, to: 10, label: 'ISR high', tone: 'bad' }, { from: 10, to: 12, label: 'ISR low', tone: 'warn' }, { from: 12, to: 16, label: 'user program', tone: 'acc' }] }],
        marks: [{ t: 4, label: 'IRQ low' }, { t: 7, label: 'IRQ high' }, { t: 10, label: 'return' }, { t: 12, label: 'return' }] } }],
      exam: 'Три механизма идентификации и недостаток software poll; как работает vectorized (ack → vector code); nested interrupts.'
    },
    {
      id: 'dma',
      h: 'Direct Memory Access (DMA)',
      html: `
<ul>
  <li>При interrupt driven I/O для <b>быстрых</b> устройств передача данных всё ещё преобладает — процессор занят переносом данных между устройством и памятью.</li>
  <li><b>DMA</b> избавляет процессор от участия в передаче.</li>
  <li><b>DMA controller</b> — процессор, специализированный на передаче данных между I/O devices и main memory; передаёт данные <b>без участия процессора</b>.</li>
</ul>
<p>Процессор выполняет только <b>supervisory duties</b>. По запросу I/O он передаёт DMA controller:</p>
<ol>
  <li><b>тип операции</b>;</li>
  <li><b>I/O device</b>;</li>
  <li><b>адрес памяти</b>, с которого начинать чтение/запись;</li>
  <li><b>число байт</b> для чтения/записи.</li>
</ol>
<ul>
  <li>DMA controller запускает операцию и передаёт данные в/из памяти.</li>
  <li>По окончании передачи DMA controller посылает процессору <b>interrupt</b> о завершении.</li>
  <li>Между отправкой команды и получением прерывания процессор <b>полностью свободен</b> от I/O и может заниматься другим.</li>
</ul>
<p><b>Operations during a DMA transfer</b>: 1 — CPU программирует DMA controller (регистры Address, Count, Control) → 2 — DMA requests transfer to memory (запрос disk controller) → 3 — data transferred (из buffer контроллера диска в main memory по шине) → 4 — Ack (disk controller → DMA controller) → по окончании — <b>interrupt when done</b> к CPU.</p>`,
      viz: [{ name: 'graph', caption: 'Operations during a DMA transfer', props: { w: 600, h: 240,
        nodes: [
          { id: 'cpu', label: 'CPU', x: 60, y: 140, w: 90, tone: 'acc' },
          { id: 'dma', label: 'DMA controller', sub: 'Address · Count · Control', x: 225, y: 140, w: 150, h: 60, tone: 'warn' },
          { id: 'dc', label: 'Disk controller', sub: 'buffer', x: 400, y: 140, w: 130, h: 60, tone: 'c2' },
          { id: 'mem', label: 'Main memory', x: 540, y: 140, w: 100, tone: 'ok' },
          { id: 'drv', label: 'Drive', x: 400, y: 35, shape: 'pill', tone: 'muted' }],
        edges: [
          { from: 'cpu', to: 'dma', label: '1. CPU programs DMA', bend: -40 },
          { from: 'dma', to: 'dc', label: '2. request transfer', bend: -40 },
          { from: 'dc', to: 'mem', label: '3. data' },
          { from: 'dc', to: 'dma', label: '4. Ack', bend: -40 },
          { from: 'dma', to: 'cpu', label: 'interrupt when done', bend: -40, tone: 'bad' },
          { from: 'drv', to: 'dc', both: true }] } }],
      exam: 'Что CPU сообщает DMA controller (4 пункта); когда приходит прерывание; порядок шагов 1–4 на схеме.'
    },
    {
      id: 'drivers',
      h: 'Device Drivers',
      html: `
<ul>
  <li><b>User program</b> работает в <b>user space</b> и обращается к ОС.</li>
  <li>Остальная часть ОС вызывает конкретный <b>device driver</b> (printer, camcorder, CD-ROM) — драйверы работают в <b>kernel space</b>.</li>
  <li>Драйвер управляет своим <b>controller</b> (hardware), а контроллер — устройством.</li>
</ul>`,
      viz: [{ name: 'layers', caption: 'Device Drivers: user space → kernel space → hardware → devices', props: { layers: [
        { label: 'User program', sub: 'user space', tone: 'c2' },
        { label: 'Rest of the operating system', sub: 'kernel space', tone: 'acc' },
        { label: 'Printer driver · Camcorder driver · CD-ROM driver', sub: 'kernel space', tone: 'acc' },
        { label: 'Printer controller · Camcorder controller · CD-ROM controller', sub: 'hardware', tone: 'warn' },
        { label: 'Devices', sub: 'printer · camcorder · CD-ROM', tone: 'muted' }] } }],
      exam: 'Драйверы — в kernel space, по одному на тип контроллера; цепочка user program → OS → driver → controller → device.'
    },
    {
      id: 'buffering',
      h: 'Buffering vs Caching',
      html: `
<table class="t">
  <tr><th>Basis</th><th>Buffering</th><th>Caching</th></tr>
  <tr><td>Definition</td><td>временное хранение данных в памяти (буфере) перед записью в постоянное место хранения</td><td>временное хранение данных в памяти для быстрого доступа</td></tr>
  <tr><td>Basic</td><td>буфер хранит данные, <b>пока они не обработаны</b></td><td>ускоряет доступ к <b>повторно используемым</b> данным</td></tr>
  <tr><td>Storage</td><td>хранит <b>оригинал</b> данных</td><td>хранит <b>копию</b> данных</td></tr>
  <tr><td>Location</td><td>область памяти в <b>RAM</b></td><td>в процессоре; может быть реализован также в RAM и на диске</td></tr>
</table>`,
      exam: 'Buffer — оригинал, до обработки, в RAM; cache — копия, для повторного доступа, в процессоре/RAM/диске.'
    },
    {
      id: 'user-io',
      h: 'User space I/O software и spooling',
      html: `
<p>Части I/O software, работающие в <b>user space</b>:</p>
<ul>
  <li><b>Libraries</b>, линкуемые с user programs (например, <code>stdio</code>, <code>unistd</code>):
    <ul>
      <li>правильно передают параметры в <b>system calls (SCs)</b>;</li>
      <li>выполняют <b>форматирование</b> (например, <code>printf()</code> в C).</li>
    </ul>
  </li>
  <li><b>Spooling</b>:
    <ul>
      <li>user process — <b>printer daemon</b>;</li>
      <li><b>spool directory</b> — куда пользователь копирует файл для печати.</li>
    </ul>
  </li>
</ul>
<pre class="code" data-lang="c">#include &lt;stdio.h&gt;
int main(void)
{
    int x = 42;
    printf("x = %d\\n", x);  /* форматирование — в user space (stdio),
                                затем библиотека вызывает system call write() */
    return 0;
}</pre>`,
      viz: [{ name: 'flow', caption: 'Spooling печати', props: { dir: 'h', steps: [
        { label: 'User', sub: 'копирует файл', tone: 'c2' },
        { label: 'Spool directory', tone: 'warn' },
        { label: 'Printer daemon', sub: 'user process', tone: 'acc' },
        { label: 'Printer', tone: 'muted' }] } }],
      exam: 'Что делает user-space I/O library (параметры SC, форматирование); из чего состоит spooling (printer daemon + spool directory).'
    }
  ],
  terms: [
    { en: 'Data transfer rate', ru: 'Скорость передачи', def: 'Одно из 3 измерений классификации I/O devices (вместе с behavior и partner).' },
    { en: 'Write transaction', ru: 'Транзакция записи', def: 'Input operation: передача данных от I/O device в память.' },
    { en: 'Read transaction', ru: 'Транзакция чтения', def: 'Output operation: передача данных из памяти на I/O device.' },
    { en: 'Bus', ru: 'Шина', def: 'Shared transmission medium между компонентами; data lines + control lines; потенциальное bottleneck.' },
    { en: 'Multiplexing', ru: 'Мультиплексирование', def: 'Совместное использование одних линий шины для данных и адресов.' },
    { en: 'Processor-memory bus', ru: 'Шина процессор–память', def: 'Короткая, быстрая, максимизирует bandwidth processor ↔ memory.' },
    { en: 'I/O bus', ru: 'Шина ввода-вывода', def: 'Длиннее и медленнее, много устройств; стандарты PCI, FireWire, USB, SCSI.' },
    { en: 'Backplane bus', ru: 'Объединительная шина', def: 'Interconnect внутри chassis; посредник между I/O bus и processor-memory bus.' },
    { en: 'Device controller', ru: 'Контроллер устройства', def: 'Interface, управляющий операциями устройства; имеет registers; может управлять несколькими устройствами.' },
    { en: 'I/O ports', ru: 'Порты ввода-вывода', def: 'Registers контроллера: status, control, data-in, data-out.' },
    { en: 'Program controlled I/O', ru: 'Программно-управляемый ввод-вывод', def: 'CPU готовит контроллер и непрерывно опрашивает его; сам переносит данные.' },
    { en: 'Busy waiting', ru: 'Активное ожидание', def: 'Цикл, в котором процессор ждёт завершения операции, только проверяя статус.' },
    { en: 'Polling', ru: 'Опрос', def: 'Во время busy waiting процессор опрашивает и другие устройства; ограниченное улучшение.' },
    { en: 'Interrupt-driven I/O', ru: 'Ввод-вывод по прерываниям', def: 'CPU продолжает работу; контроллер шлёт interrupt request, когда готов.' },
    { en: 'Interrupt vector', ru: 'Вектор прерываний', def: 'Адреса специализированных interrupt handlers; priority based.' },
    { en: 'Interrupt handler', ru: 'Обработчик прерываний', def: 'Routine, принимающая и обрабатывающая прерывание, затем возвращающая управление.' },
    { en: 'Maskable interrupt', ru: 'Маскируемое прерывание', def: 'Можно игнорировать или отложить; обычно от I/O interfaces (Intel vectors 32–255).' },
    { en: 'Non-maskable interrupt', ru: 'Немаскируемое прерывание', def: 'Катастрофические причины (падение напряжения); единственная recovery routine.' },
    { en: 'Trap', ru: 'Ловушка', def: 'Exception в конце инструкции для вызова функциональности ОС (breakpoint, overflow).' },
    { en: 'Fault', ru: 'Отказ (восстановимый)', def: 'Recoverable ошибка при выполнении инструкции (divide by zero, bogus instruction).' },
    { en: 'Abort', ru: 'Аварийное прекращение', def: 'Unrecoverable ошибка, принудительное завершение.' },
    { en: 'Software poll', ru: 'Программный опрос', def: 'Рутина опрашивает устройства, чтобы найти источник прерывания; тратит время.' },
    { en: 'Vectorized hardware interrogation', ru: 'Векторное аппаратное опрашивание', def: 'CPU шлёт acknowledgment, устройство отвечает interrupt vector code — указателем на handler.' },
    { en: 'Nested interrupts', ru: 'Вложенные прерывания', def: 'Прерывание, пришедшее во время обработки другого прерывания.' },
    { en: 'DMA controller', ru: 'Контроллер DMA', def: 'Специализированный процессор, передающий данные между I/O и памятью без CPU; одно прерывание в конце.' },
    { en: 'Device driver', ru: 'Драйвер устройства', def: 'Модуль ОС в kernel space, управляющий конкретным контроллером.' },
    { en: 'Buffering', ru: 'Буферизация', def: 'Хранение оригинала данных в RAM до их обработки/записи.' },
    { en: 'Caching', ru: 'Кэширование', def: 'Хранение копии повторно используемых данных для быстрого доступа.' },
    { en: 'Spooling', ru: 'Спулинг', def: 'Printer daemon + spool directory, куда пользователь копирует файл для печати.' }
  ],
  questions: [
    { id: 'io-01', type: 'multi', q: 'По каким 3 измерениям классифицируют I/O devices? (несколько ответов)', options: ['Data transfer rate', 'Price', 'Physical size', 'Behavior', 'Counterparty (partners)'], answer: [0, 3, 4], explain: 'Behavior (input/output/storage), partner (human/machine), data transfer rate.', section: 'heterogeneity', diff: 1 },
    { id: 'io-02', type: 'single', q: 'Какое устройство в таблице со слайда имеет наибольшую скорость передачи?', options: ['Magnetic disk (240–2560 Mb/s)', 'Network/LAN (100–1000 Mb/s)', 'Laser printer (3.2 Mb/s)', 'Graphic card (800–8000 Mb/s)'], answer: 3, explain: 'Graphic card — до 8000 Mb/s; keyboard — самое медленное (0.0001).', section: 'heterogeneity', diff: 2 },
    { id: 'io-03', type: 'single', q: 'Input operation на шине — это…', options: ['write transaction: данные из памяти в I/O device', 'read transaction: данные из памяти в CPU', 'write transaction: данные от I/O device в память', 'read transaction: данные от I/O device в память'], answer: 2, explain: 'Названия с точки зрения памяти: input = запись в память (write), output = чтение из памяти (read transaction).', section: 'organization', diff: 3 },
    { id: 'io-04', type: 'single', q: 'Что характерно для processor-memory bus?', options: ['Стандартизирована как USB или SCSI', 'Короткая, высокая скорость, максимизирует bandwidth processor ↔ memory', 'Длинная и медленная, много разных устройств', 'Interconnect внутри chassis между другими шинами'], answer: 1, explain: 'Второй вариант — I/O buses, третий — backplane buses.', section: 'bus', diff: 2 },
    { id: 'io-05', type: 'single', q: 'PCI, FireWire (IEEE 1394), USB, SCSI — это стандарты…', options: ['I/O buses', 'Processor-memory bus', 'Backplane buses', 'DMA controllers'], answer: 0, explain: 'Слайд Bus types: стандарты I/O buses.', section: 'bus', diff: 1 },
    { id: 'io-06', type: 'multi', q: 'Какие registers (I/O ports) есть у device controller? (несколько ответов)', options: ['data-in', 'data-out', 'interrupt vector', 'status', 'control'], answer: [0, 1, 3, 4], explain: 'Четыре регистра контроллера. Interrupt vector — таблица в памяти с адресами handlers.', section: 'devices', diff: 2 },
    { id: 'io-07', type: 'single', q: 'В каком регистре контроллера хранится команда для выполнения?', options: ['data-in', 'data-out', 'control', 'status'], answer: 2, explain: 'control — команда; status — состояние (idle, busy, down…); data-in/data-out — данные.', section: 'devices', diff: 1 },
    { id: 'io-08', type: 'multi', q: 'Какие техники управления I/O devices названы на слайде? (несколько ответов)', options: ['Direct Memory Access', 'Swapping', 'Program controlled', 'Polling', 'I/O interrupt driven'], answer: [0, 2, 3, 4], explain: 'Четыре техники; swapping относится к управлению памятью.', section: 'modes', diff: 1 },
    { id: 'io-09', type: 'code', q: 'Какая техника I/O реализована и как называется цикл while?', lang: 'c', code: '/* CPU записал команду в control register и запустил контроллер */\nwhile (status_reg == BUSY)\n    ;                    /* ничего не делаем */\ndata = data_in_reg;      /* CPU сам забирает данные */', options: ['Program controlled I/O; цикл — busy waiting', 'Interrupt-driven I/O; цикл — interrupt handler', 'DMA; цикл — передача блока DMA controller', 'Spooling; цикл — printer daemon'], answer: 0, explain: 'CPU непрерывно опрашивает один контроллер и сам переносит данные — program controlled I/O, цикл ожидания = busy waiting. Polling опрашивал бы ещё и другие устройства.', section: 'programmed', diff: 2 },
    { id: 'io-10', type: 'tf', q: 'Program controlled I/O хорошо подходит для медленных периферийных устройств.', answer: false, explain: 'Наоборот: с медленными устройствами CPU вынужден работать со скоростью периферии, вычислительная мощность теряется.', section: 'programmed', diff: 2 },
    { id: 'io-11', type: 'single', q: 'В чём проблема polling при работе с быстрыми периферийными устройствами?', options: ['Устройства не могут посылать прерывания', 'DMA controller перегружается', 'Работа процессора почти полностью сводится к собственно передаче данных', 'Процессор большую часть времени в busy waiting'], answer: 2, explain: 'С быстрыми — почти только передача данных; с медленными — чрезмерная трата времени в busy waiting.', section: 'polling', diff: 3 },
    { id: 'io-12', type: 'single', q: 'Когда в interrupt-driven I/O процессор проверяет состояние interrupt line?', options: ['Посреди выполнения каждой инструкции', 'После выполнения каждой инструкции', 'Каждые 10 ms по таймеру', 'Только при system call'], answer: 1, explain: '«The processor checks the state of the interrupt line after the execution of each instruction».', section: 'interrupt-io', diff: 1 },
    { id: 'io-13', type: 'single', q: 'Что процессор обязан сделать перед обработкой прерывания?', options: ['Сохранить информацию для продолжения текущей программы с точки прерывания', 'Очистить cache', 'Замаскировать все прерывания навсегда', 'Перезапустить контроллер'], answer: 0, explain: 'Слайд I/O interrupt driven: процессор сохраняет информацию, позволяющую возобновить программу.', section: 'interrupt-io', diff: 2 },
    { id: 'io-14', type: 'single', q: 'Что означают векторы 32–255 в таблице прерываний Intel?', options: ['Non-maskable interrupts', 'Intel reserved, do not use', 'Page faults', 'Maskable interrupts'], answer: 3, explain: '0–18 — exceptions и служебные векторы (divide error, page fault…), 19–31 — Intel reserved, 32–255 — maskable interrupts.', section: 'interrupts', diff: 2 },
    { id: 'io-15', type: 'single', q: 'Какое событие соответствует вектору 0 в таблице Intel?', options: ['breakpoint', 'general protection', 'divide error', 'page fault'], answer: 2, explain: '0 — divide error, 3 — breakpoint, 13 — general protection, 14 — page fault.', section: 'interrupts', diff: 2 },
    { id: 'io-16', type: 'single', q: 'Как схема Interrupt-driven I/O классифицирует page fault?', options: ['Non-maskable interrupt по питанию', 'Internal interrupt (exception), но не ошибка — способ заменить страницу в virtual memory', 'External I/O interrupt', 'Program generated software interrupt через INT'], answer: 1, explain: 'В ветке Internal Interrupts (Exceptions): «Page Fault is not an error but a method to replace page in Virtual memory».', section: 'classification', diff: 3 },
    { id: 'io-17', type: 'single', q: 'Что верно для external interrupt requests?', options: ['Асинхронны; процессор завершает текущую инструкцию и проверяет запросы перед fetch следующей', 'Синхронны и порождаются выполнением инструкций', 'Прерывают инструкцию посередине', 'Приостанавливают инструкцию, вызвавшую аномалию'], answer: 0, explain: 'Синхронные — program generated; приостанавливают «виновную» инструкцию — exceptions. Внешнее прерывание не может прервать инструкцию посередине.', section: 'classification', diff: 2 },
    { id: 'io-18', type: 'tf', q: 'Program generated (software) interrupts порождаются user programs с помощью инструкции INT и используются для system calls.', answer: true, explain: 'Схема Interrupt-driven I/O: generated by user programs using INT instruction; useful for system calls, нужно при написании device drivers.', section: 'classification', diff: 1 },
    { id: 'io-19', type: 'single', q: 'Recoverable error, возникающая при выполнении инструкции (например, divide by zero), — это…', options: ['abort', 'non-maskable interrupt', 'fault', 'trap'], answer: 2, explain: 'Fault — recoverable; trap — в конце инструкции для вызова ОС (breakpoint); abort — unrecoverable.', section: 'exceptions', diff: 2 },
    { id: 'io-20', type: 'single', q: 'Срабатывание debugger breakpoint по классификации слайда — это…', options: ['maskable external interrupt', 'trap', 'fault', 'abort'], answer: 1, explain: 'Trap происходит после или во время выполнения инструкции: debugger breakpoint, overflow.', section: 'exceptions', diff: 2 },
    { id: 'io-21', type: 'single', q: 'Чем вызывается non-maskable external interrupt?', options: ['Катастрофическими причинами, например падением напряжения питания ниже порога', 'Обычными I/O interfaces', 'Инструкцией INT в программе', 'Завершением DMA-передачи'], answer: 0, explain: 'Maskable — обычно от I/O interfaces (их обслуживают drivers); non-maskable — катастрофы, единственная recovery routine.', section: 'service-routines', diff: 2 },
    { id: 'io-22', type: 'single', q: 'Как при vectorized hardware interrogation процессор узнаёт, какое устройство прервало?', options: ['Запускает рутину, опрашивающую все устройства', 'У каждого устройства своя отдельная линия прерывания', 'Читает device-status table', 'Посылает acknowledgment; устройство отвечает interrupt vector code — указателем на handling routine'], answer: 3, explain: 'Второй вариант — software poll (тратит время), третий — more break lines.', section: 'identify', diff: 3 },
    { id: 'io-23', type: 'single', q: 'Недостаток software poll при определении источника прерывания:', options: ['Невозможны приоритеты', 'Требуется DMA controller', 'Waste of time', 'Нужно много линий шины'], answer: 2, explain: 'Процессор тратит время на опрос устройств. Много линий шины — проблема механизма more break lines.', section: 'identify', diff: 2 },
    { id: 'io-24', type: 'multi', q: 'Что процессор передаёт DMA controller при запросе I/O? (несколько ответов)', options: ['I/O device', 'Адрес памяти начала чтения/записи', 'Число байт', 'Сами данные побайтно', 'Тип операции'], answer: [0, 1, 2, 4], explain: 'Данные переносит сам DMA controller без участия процессора.', section: 'dma', diff: 2 },
    { id: 'io-25', type: 'single', q: 'Правильный порядок операций при DMA-передаче (по схеме):', options: ['CPU programs DMA controller → DMA requests transfer → data transferred → Ack → interrupt when done', 'DMA requests transfer → CPU programs DMA controller → Ack → data transferred → interrupt', 'CPU programs DMA controller → interrupt → data transferred → Ack', 'Data transferred → CPU programs DMA controller → Ack → interrupt'], answer: 0, explain: 'Шаги 1–4 на схеме и в конце interrupt when done от DMA controller к CPU.', section: 'dma', diff: 3 },
    { id: 'io-26', type: 'single', q: 'Где работают device drivers по схеме Device Drivers?', options: ['В user space', 'В hardware контроллера', 'В spool directory', 'В kernel space'], answer: 3, explain: 'User program — user space; rest of the OS и драйверы — kernel space; controllers — hardware.', section: 'drivers', diff: 1 },
    { id: 'io-27', type: 'single', q: 'Какое утверждение о buffering и caching верно?', options: ['Buffer находится в процессоре; cache — только на диске', 'Buffer ускоряет повторный доступ к часто используемым данным', 'Buffer хранит оригинал данных до обработки; cache хранит копию для быстрого повторного доступа', 'Buffer хранит копию; cache — оригинал'], answer: 2, explain: 'Таблица buffering vs caching: buffer — original data, RAM; cache — copy, processor (также RAM и disk).', section: 'buffering', diff: 2 },
    { id: 'io-28', type: 'code', q: 'Где выполняется форматирование ("%d" → "42") перед выводом?', lang: 'c', code: '#include <stdio.h>\nint main(void)\n{\n    int x = 42;\n    printf("x = %d\\n", x);\n    return 0;\n}', options: ['В interrupt handler ядра', 'В user-space библиотеке stdio, которая затем вызывает system call', 'В device driver терминала', 'В контроллере дисплея'], answer: 1, explain: 'User space I/O software: библиотеки (stdio) выполняют форматирование (printf) и правильно передают параметры в system calls.', section: 'user-io', diff: 2 },
    { id: 'io-29', type: 'single', q: 'Из чего состоит spooling по слайду User space I/O software?', options: ['User process (printer daemon) и spool directory, куда пользователь копирует файл для печати', 'Device driver принтера в kernel space', 'DMA controller и buffer контроллера', 'Interrupt vector и handler'], answer: 0, explain: 'Spooling реализован в user space: printer daemon + spool directory.', section: 'user-io', diff: 2 }
  ]
});
