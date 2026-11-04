# Content guide — OS Exam Prep

Платформа — статический сайт без сборки. Каждый модуль — файл `content/NN-<id>.js`, который вызывает `OS.addModule({...})`.
Эталон стиля и плотности: `content/05-scheduling.js`. **Перед написанием модуля прочитай эталон целиком.**

## Язык и стиль
- Объяснения **на русском**, все термины, названия алгоритмов, системных вызовов, команд — **на английском, как на слайдах**: `<b>Process Control Block (PCB)</b> — структура ядра, …`.
- **Без воды.** Только то, что есть на слайдах (и что нужно для их понимания). Никаких вступлений «В этом разделе мы рассмотрим…», никаких выводов «Таким образом…». Буллеты, таблицы, короткие определения.
- Каждый содержательный слайд должен быть отражён. Повторяющиеся слайды (одинаковый текст на нескольких страницах) — один раз. Слайды-картинки (диаграммы/таблицы) — рендерить и смотреть, затем переносить смысл в таблицу или визуализацию.
- Где на слайде пример с числами/кодом — переносим пример (он часто бывает на экзамене).
- Шпаргалку `OS_and_Virtualization_Cheatsheet (3).pdf` можно использовать как вспомогательный источник **только для тем, которые есть на слайдах**. Темы, которых нет на слайдах (Main Memory, Virtual Memory, File systems, Security, Virtualization part 2), **не добавлять**.

## Схема модуля
```js
OS.addModule({
  id: 'scheduling',            // латиница, kebab-case, уникальный
  num: 5,                      // порядковый номер (см. таблицу модулей)
  group: 'theory',             // 'theory' (лекции) | 'lab' (ES*)
  title: 'CPU Scheduling',     // EN название
  titleRu: 'Планирование ЦП',  // RU название
  icon: '⏱',                   // один эмодзи
  sources: ['5-Scheduling.pdf'],
  summary: 'Одна строка: о чём модуль.',
  sections: [
    {
      id: 'criteria',          // уникален внутри модуля, kebab-case
      h: 'Scheduling Criteria — критерии',
      html: `...`,             // контент (см. «HTML-разметка»)
      viz: [ { name: 'scheduler', props: { ... }, caption: '...' } ],   // опционально, рендерится ПОСЛЕ html
      exam: 'Что спрашивают: …' // опционально — короткая подсказка «🎯 На экзамене»
    }
  ],
  terms: [ { en: 'Dispatch latency', ru: 'Задержка диспетчеризации', def: 'Время, за которое dispatcher останавливает один процесс и запускает другой.' } ],
  questions: [ ... ]           // см. «Вопросы»
});
```
Внутри `html` можно вставить визуализацию в конкретное место: `<div data-viz="0"></div>` — индекс в массиве `viz` этой секции. Тогда она рендерится там, а не в конце.

## HTML-разметка внутри `html`
Используй template literals (обратные кавычки). Внутри **не используй** обратные кавычки и `${`.
- Списки: `<ul><li>…</li></ul>`, `<ol>`.
- Термин: `<b>Term</b>`; inline-код/команды: `<code>fork()</code>`.
- Таблица: `<table class="t"><tr><th>…</th></tr><tr><td>…</td></tr></table>`.
- Блок кода: `<pre class="code" data-lang="c">…</pre>` (`c` | `bash` | `text`). Экранируй `<` `>` `&` как `&lt;` `&gt;` `&amp;`.
- Плашки: `<div class="callout key">главное</div>`, `<div class="callout warn">типичная ошибка / ловушка</div>`, `<div class="callout note">заметка</div>`.
- Две колонки (сравнение): `<div class="cols"><div>…</div><div>…</div></div>`.
- Формула: `<div class="formula">Average waiting time = (0 + 24 + 27) / 3 = 17</div>`.
- Pros/cons: `<div class="cols"><div class="pros"><b>+</b><ul>…</ul></div><div class="cons"><b>−</b><ul>…</ul></div></div>`.
- Inline SVG допускается для единичных схем (см. «Inline SVG»), но сначала проверь, нельзя ли собрать схему из компонентов `graph` / `flow` / `layers` / `timeline` / `tree`.

## Визуализации (`viz`)
Все компоненты адаптивны и поддерживают тёмную тему. Тоны (`tone`): `'acc'` (основной акцент), `'ok'` (зелёный), `'warn'` (жёлтый), `'bad'` (красный), `'muted'` (серый), `'c1'..'c6'` (категориальные цвета). По умолчанию — нейтральный.

### Универсальные
- **`flow`** — цепочка блоков со стрелками.
  `{ dir:'h'|'v', steps:[{label, sub?, tone?}], loop?:false }` — `loop:true` рисует стрелку от последнего к первому.
- **`layers`** — стопка слоёв (структура ядра, иерархия памяти, слои системы).
  `{ layers:[{label, sub?, tone?}], pyramid?:false, top?:'подпись сверху', bottom?:'подпись снизу' }` — первый слой рисуется сверху. `pyramid:true` → сужение кверху.
- **`graph`** — узлы и рёбра в координатах (диаграммы состояний, RAG, wait-for graph, схемы).
  `{ w:600, h:300, nodes:[{id, label, x, y, shape?:'rect'|'circle'|'pill'|'res', tone?, w?, h?, sub?, inst?}], edges:[{from, to, label?, tone?, dashed?, bend?:0, both?:false}] }`
  - `x,y` — центр узла в координатах viewBox `w×h`. Размер rect по умолчанию 110×44, circle r=26.
  - `shape:'res'` — ресурс для Resource-Allocation Graph: прямоугольник с `inst` точками-экземплярами (по умолчанию 1).
  - `bend` — изгиб ребра (например 30 или -30) — для пар встречных рёбер и петель.
  - `dashed:true` — пунктир (claim edge).
- **`timeline`** — дорожки с отрезками (Gantt-подобные схемы, interrupt timeline, сравнение режимов I/O).
  `{ max:30, rows:[{label, segs:[{from, to, label?, tone?}]}], marks?:[{t, label}], ticks?:[0,4,7,…] }`
- **`stepper`** — пошаговая трассировка кода: подсвечивает строку и показывает состояние переменных/пояснение.
  `{ code:'...', lang:'c'|'bash'|'text', steps:[{line: 3 | [3,4], note:'что происходит', vars?:{counter:5, 'register1':6}, out?:'вывод на этом шаге'}] }` — строки нумеруются с 1.
- **`tree`** — дерево (иерархия каталогов, дерево процессов).
  `{ root:{label, note?, tone?, children:[...]}, mono?:true }` — `mono:true` рисует моноширинным шрифтом.

### Специализированные (интерактивные)
- **`scheduler`** — симулятор CPU scheduling: таблица процессов (редактируемая) → Gantt + waiting/turnaround/response + средние.
  `{ algo:'FCFS'|'SJF'|'SRTF'|'RR'|'PRIO'|'PRIO_P'|'PRIO_RR', quantum?:4, processes:[{name:'P1', arrival:0, burst:24, priority?:3}], lockAlgo?:false }`
  (PRIO — non-preemptive priority, PRIO_P — preemptive, PRIO_RR — priority + RR среди равных; меньшее число = выше приоритет.)
- **`mlfq`** — схема Multilevel Feedback Queue с анимацией понижения процесса. `{ queues:[{label:'Q0', algo:'RR q=8'}, …], burst:30 }`
- **`procStates`** — интерактивная диаграмма состояний процесса (new/ready/running/waiting/terminated) с кнопками событий. `{}`
- **`forkTree`** — дерево процессов для `n` последовательных `fork()` (2ⁿ процессов) со слайдером. `{ n:3, max:5 }`
- **`threadModels`** — модели многопоточности с переключателем. `{ model:'m1'|'11'|'mm'|'2l' }`
- **`amdahl`** — закон Амдала: слайдеры S (последовательная доля) и N (ядра) + график speedup. `{ s:0.25, n:4 }`
- **`race`** — пошаговое чередование `counter++` / `counter--` на уровне регистров (пример со слайдов: counter=5 → 4 или 6). `{ start:5 }`
- **`peterson`** — пошаговый Peterson's solution для P0/P1 (flag[], turn). `{}`
- **`semaphore`** — counting semaphore: N ресурсов, процессы делают wait()/signal(), очередь ожидающих. `{ value:3, label:'printers', procs:6 }`
- **`philosophers`** — Dining Philosophers: 5 философов, палочки-семафоры, демонстрация deadlock и решений. `{ n:5 }`
- **`banker`** — Banker's algorithm: Allocation/Max/Need/Available, пошаговый safety algorithm и проверка запроса.
  `{ res:['A','B','C'], names:['T0','T1','T2','T3','T4'], available:[3,3,2], max:[[7,5,3],…], alloc:[[0,1,0],…], request?:{who:1, vec:[1,0,2]} }`
- **`diskSched`** — симулятор disk scheduling (FCFS/SSTF/SCAN/LOOK/C-SCAN/C-LOOK): график движения головки + суммарное перемещение.
  `{ queue:[98,183,37,122,14,124,65,67], head:53, max:199, algo:'FCFS', dir:'down' }`
- **`hddCalc`** — калькулятор времени доступа HDD. `{ rpm:7200, seek:5, rateGbps:1, kb:4, overheadMs:0.1 }`
- **`raid`** — раскладка блоков по дискам для RAID 0/1/4/5/6/0+1/1+0 + XOR-паритет. `{ level:5, disks:4 }`
- **`chmod`** — калькулятор прав: чекбоксы rwx ↔ octal ↔ symbolic ↔ строка `ls -l`. `{ mode:'754', file:'script.sh' }`
- **`ioModes`** — сравнение Programmed I/O / Interrupt-driven / DMA (что делает CPU во времени). `{}`

Если нужна визуализация, которой нет в списке, — собери её из универсальных компонентов или inline SVG. Не изобретай новые имена компонентов.

### Inline SVG
`<svg class="d" viewBox="0 0 600 200">…</svg>`; классы: `d-box` (прямоугольник), `d-box acc|ok|warn|bad|muted`, `d-txt`, `d-txt sm`, `d-txt b` (жирный), `d-line`, `d-arrow` (линия со стрелкой; маркер уже определён глобально, `marker-end` не нужен). Никаких жёстко заданных цветов (`fill="#..."`) — только классы.

## Вопросы
Формат экзамена: тест + вопросы по коду. **~30 вопросов на модуль** (лабы: 20–30). Распределение сложности `diff`: ~30% 1, ~50% 2, ~20% 3.
```js
{ id:'sch-01', type:'single', q:'…?', options:['…','…','…','…'], answer:2, explain:'Почему верно 2 и почему остальные неверны (кратко).', section:'criteria', diff:2 }
{ id:'sch-02', type:'multi',  q:'Какие … ? (несколько ответов)', options:[…], answer:[0,2], explain:'…', section:'…', diff:2 }
{ id:'sch-03', type:'tf',     q:'Утверждение.', answer:true, explain:'…', section:'…', diff:1 }
{ id:'sch-04', type:'code',   q:'Что выведет программа?', lang:'c', code:'…', options:[…], answer:1, explain:'…', section:'…', diff:3 }
```
- `id`: `<префикс модуля>-NN`, уникален глобально. Префиксы: basics `bas`, services `svc`, processes `proc`, threads `thr`, scheduling `sch`, sync `syn`, deadlock `dl`, io `io`, storage `ms`, linux `lin`, linux-proc `lproc`, bash `sh`, devices `dev`.
- `section` — `id` существующей секции этого модуля (по нему делается ссылка «к теории»).
- Вопрос на русском, термины на английском, как на слайдах. 4 варианта (иногда 3–5). Дистракторы правдоподобные, без «все вышеперечисленное» без нужды.
- Варианты **перемешиваются при показе**, поэтому не пиши варианты, зависящие от позиции («оба выше», «A и B», «все перечисленные» допустимо только как самостоятельный вариант).
- `explain` обязателен: 1–3 предложения, объясняет и правильный, и ключевой неверный вариант.
- `type:'code'` — фрагмент кода (C или Bash) из стиля слайдов: «что выведет», «сколько раз напечатает», «какая строка нужна», «чем закончится». Код в `code` — обычная строка с `\n` (или template literal), без HTML-экранирования. Ответ должен быть однозначным и проверенным (Bash — прогони мысленно очень аккуратно; если можешь — проверь в реальном bash).
- Проверь каждый ответ дважды. Неверный ключ хуже, чем отсутствие вопроса.
- Вопросы покрывают все секции модуля, а не только первые.

## Проверка
После написания файла: `node tools/validate.js content/NN-<id>.js` (если файла validate.js ещё нет — проверь синтаксис через `node --check content/NN-<id>.js`).
