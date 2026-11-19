# Content guide v2 — OS Exam Prep (English, teaching-first)

The site is a static app. Each module is `content/NN-<id>.js` calling `OS.addModule({...})`.
Reference for style, density and structure: **`content/05-scheduling.js` — read it fully before writing.**

## Why v2
Student feedback on v1: *"I read the explanations and don't understand the point. It's just facts, like in the
professor's slides. There must be a logical chain between topics and explanations. Mixing Russian and English is awkward."*

So v2 is:
1. **Fully in English** (UI, content, questions). The site has a click-a-word translation mode (EN→RU), so write
   clear, simple English — do **not** add Russian anywhere except `terms[].ru` and `titleRu`.
2. **Teaching, not listing.** Every section explains *why the thing exists, how it works, and what follows from it*.
3. **A logical chain.** Each module opens with the big picture and how it follows from the previous module; each
   section starts from what the reader already knows and ends by pointing to the next problem.

## Writing rules
- Write like a good tutor explaining to a classmate who missed the lecture. Plain English (B1–B2): short sentences,
  common words, no idioms, no filler ("In this section we will…", "It is important to note that…" are banned).
- **Problem → idea → mechanism → consequences.** For every concept answer, in this order:
  1. What problem does it solve? (or what question does it answer)
  2. What is the core idea, in one or two sentences? (an analogy is welcome if it is short and accurate)
  3. How does it work, step by step?
  4. What are the trade-offs / what goes wrong / where is it used?
- **Define every term at first use** in plain words: `<b>Dispatch latency</b> is the time the dispatcher needs to stop one process and start another.`
- **Never drop a bare table or list.** Before it, say what to look at; after it, state the conclusion (the pattern).
- **Keep every fact from the slides** (completeness matters for the exam): definitions, lists, numbers, examples,
  code. v1 modules already contain all slide facts — keep them, but explain them. Do not invent new topics.
- Connect: the `lead` of a section links to the previous section; the end of the section (or `takeaway`) hints at the
  next problem. Use phrases like "This raises a question…", "The fix is…", "That is exactly what X does."
- Short paragraphs (2–4 sentences). Bullets for real enumerations only. Bold only key terms.

### Before / after (what v1 did wrong)
v1 (bad — a table with no meaning):
> **Characteristics of Various Types of Storage:** [table: registers, cache, main memory, SSD, disk × size, access time, bandwidth, managed by]

v2 (good):
> **Lead:** The CPU wants data instantly, but fast memory is tiny and expensive. How do we get both speed and size?
>
> The trick is **caching**: keep a *copy* of the data you are using right now in a small fast memory, and leave the
> rest in a big slow one. When the CPU needs something it first checks the fast copy (a **cache hit** — fast); if it is
> not there (a **miss**) the data is copied up from the slower level and then used.
>
> The table shows why we need several levels. Read it top to bottom: every level is **bigger** but **slower** than the
> one above — registers answer in ~0.3 ns, a disk in ~5,000,000 ns. Notice the "Managed by" row: the compiler decides
> what goes into registers, the hardware moves data into cache automatically, and the OS moves data between memory
> and disk. [table]
>
> **Takeaway:** Each level acts as a cache for the level below it. Because the cache is smaller than what it caches,
> someone must choose what to keep — this is **cache management** (cache size + replacement policy).

## Module schema
```js
OS.addModule({
  id: 'scheduling',            // kebab-case, unique (keep the v1 id!)
  num: 5,
  group: 'theory',             // 'theory' | 'lab'
  title: 'CPU Scheduling',
  titleRu: 'Планирование процессора',   // only used by the translator
  icon: '⏱',
  sources: ['5-Scheduling.pdf'],
  summary: 'One line: what the module covers.',
  bridge: 'One or two sentences: how this module follows from the previous one (e.g. "Processes can be ready at the same time, but one core runs one at a time — so who goes next?").',
  intro: `HTML, 1–2 short paragraphs: the big picture — the problem this whole topic solves and the mental model to keep in mind.`,
  sections: [
    {
      id: 'criteria',           // kebab-case, unique in module (keep v1 ids where the topic is the same)
      h: 'Scheduling criteria',   // short English title
      why: 'how to compare algorithms',   // 2–6 words: the purpose of this step (shown in the module roadmap)
      lead: 'Before comparing algorithms we need a way to say which one is "better".',  // 1–3 sentences, plain text or light HTML
      html: `...`,              // the explanation (see HTML conventions)
      viz: [ { name: 'scheduler', props: { ... }, caption: '...' } ],   // optional, rendered after html
      takeaway: 'One or two sentences: what to remember.',            // required
      exam: 'What is typically asked: …'                               // optional
    }
  ],
  terms: [ { en: 'Dispatch latency', ru: 'Задержка диспетчеризации', def: 'Time the dispatcher needs to stop one process and start another.' } ],
  questions: [ ... ]
});
```
The UI renders: module `bridge` + `intro` + an automatic **roadmap** (section titles + `why`), then each section as
`lead` (highlighted "Why this matters" box) → `html` + viz → `takeaway` ("Key idea" box) → `exam` tip.
`terms[].ru` is required: the translator uses `terms` as its phrase dictionary (clicking any word of "dispatch latency"
shows "задержка диспетчеризации"). Include in `terms` every important multi-word technical phrase of the module.

## HTML conventions (inside `html`)
Template literals (backticks); inside them never use backticks or `${` (write `&#96;` and `&#36;{`).
- Lists `<ul><li>`, `<ol>`; terms `<b>`; inline code `<code>`.
- Table `<table class="t"><tr><th>…</th></tr><tr><td>…</td></tr></table>` — always with a sentence before and after.
- Code block `<pre class="code" data-lang="c">…</pre>` (`c` | `bash` | `text`), escape `<` `>` `&`.
- Callouts: `<div class="callout key">`, `<div class="callout warn">` (pitfall / slide error), `<div class="callout note">`.
- Analogy: `<div class="callout analogy">Think of it like …</div>` (max one or two per module section, only if it helps).
- Steps of a mechanism: `<ol class="steps"><li>…</li></ol>` (rendered as numbered step cards).
- Two columns: `<div class="cols"><div>…</div><div>…</div></div>`; pros/cons `<div class="pros">` / `<div class="cons">`.
- Formula / worked example: `<div class="formula">…</div>`.
- Inline viz placement: `<div data-viz="0"></div>` (index into the section's `viz`).
- Inline SVG allowed (`<svg class="d" viewBox="…">` with classes `d-box acc|ok|warn|bad|muted`, `d-txt sm|b`, `d-line`, `d-arrow`), no hard-coded colours.

## Visualizations (`viz`) — unchanged from v1
`flow`, `layers`, `graph`, `timeline`, `stepper`, `tree`, `scheduler`, `mlfq`, `procStates`, `forkTree`,
`threadModels`, `amdahl`, `race`, `peterson`, `semaphore`, `philosophers`, `banker`, `diskSched`, `hddCalc`, `raid`,
`chmod`, `ioModes`. Props are exactly as in v1 (see the v1 modules and `js/viz/*.js`). Keep the v1 viz and their props
(they were verified) but translate every label/caption/note/step text into English. Add more viz only if it clarifies.

## Questions (English)
- Keep the v1 questions and their ids (the mistakes bank uses ids); translate them into clear English and improve
  wording/explanations. You may fix a weak question or add new ones (new ids continue the numbering).
- Types: `single`, `multi`, `tf`, `code` (with `code` + `lang`). Options are shuffled at runtime — no "both above".
- `explain` (required): why the right answer is right and why the tempting wrong one is wrong, 1–3 sentences.
- `section`: an existing section id. `diff`: 1–3.
- Code in `code` fields stays byte-identical to v1 unless it contains Russian text (translate comments/strings only if
  that does not change the answer).
- `q`, `options`, `explain` are plain text (may use `<code>`, `<b>`, or backtick spans for code).

## Check
`node tools/validate.js content/NN-<id>.js` must report 0 errors and 0 warnings. The validator flags Cyrillic text
outside `terms[].ru` / `titleRu`, missing `lead` / `takeaway` / `why` / `bridge` / `intro`, and the usual schema errors.
