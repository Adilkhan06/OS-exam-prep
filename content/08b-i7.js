OS.addModule({
  id: 'i7',
  num: 9,
  group: 'theory',
  title: 'Case study: Intel Core i7 memory hierarchy',
  titleRu: 'Пример: иерархия памяти Intel Core i7',
  icon: '🔬',
  sources: ['Week3_TeamA_i7-Presentation.pdf'],
  summary: 'A real memory hierarchy: Core i7 generations, private L1/L2 and a shared inclusive L3, set associativity, the two-level TLB, pseudo-LRU, Haswell improvements, TSX, prefetching and one memory access step by step with latencies.',
  bridge: 'Module 8 explained paging and the TLB in general: every address a program uses is virtual, it must be translated, and a small cache of translations makes that fast. This module opens a real processor, the Intel Core i7, and shows how the storage hierarchy and caching from module 1 and the TLB from module 8 are actually built in silicon.',
  intro: `
<p>A core can start a new instruction every clock cycle, but main memory needs about <b>135 cycles</b> to answer. Without help, the core would spend most of its time waiting — the <b>memory stall</b> from the scheduling module. The Core i7 answers with a stack of caches: two small private levels inside each core (<b>L1</b>, <b>L2</b>), one big level shared by all cores (<b>L3</b>), and a two-level <b>TLB</b> so that address translation does not slow every access down.</p>
<p>Keep one mental model for the whole module: <b>every memory access is a search that starts at the smallest, fastest level and goes one level down only on a miss.</b> Every feature in this presentation (Week 3, Team A) tries to make the search end early (bigger, smarter caches and TLBs, prefetching), to make each level answer faster or move more data per cycle (wider ports, more bandwidth), or to make sharing between cores cheaper (inclusive L3, transactional memory). At the end we follow one access all the way down to memory.</p>`,
  sections: [
    {
      id: 'family',
      h: 'The Core i7 family: timeline and basic structure',
      why: 'which chips we are talking about',
      lead: 'Before looking inside, we need to know which chips the presentation compares. "Core i7" is not one chip: it is a brand name that Intel used for several generations.',
      html: `
<p>Behind the brand <b>Core i7</b> there are several <b>microarchitectures</b> (internal designs). Each one has a code name. The slide timeline lists them in order:</p>
<div data-viz="0"></div>
<p>Intel planned these steps with the <b>tick-tock model</b>. A <b>tick</b> shrinks the manufacturing process, so the transistors become smaller (45 nm → 32 nm → 22 nm → 14 nm). A <b>tock</b> brings a new microarchitecture on the process that already works (Nehalem, Sandy Bridge, Haswell). Only one big thing changes at a time, which lowers the risk. The slide names the goal: increased performance, new capabilities, energy efficiency and form-factor advances.</p>
<p>So Ivy Bridge is the 22 nm tick after Sandy Bridge (general knowledge), and Broadwell is the 14 nm tick after Haswell (the Broadwell slide says "shrunk to 14 nm"). Most numbers in this module are for <b>Haswell</b>, the 4th generation, compared with older generations.</p>
<p>The basic structure of the chip (slide "Core i7 Basic Structure"):</p>
<ul>
  <li><b>4 cores</b> — four independent processors on one chip.</li>
  <li><b>Hyperthreaded — 8 threads.</b> This is the chip-multithreading from the scheduling module: each core has 2 hardware threads, so the OS sees <b>8 logical processors</b>. When one hardware thread waits for memory, the core runs the other one.</li>
  <li><b>Pipelined with 16 stages.</b> A <b>pipeline</b> splits the work on one instruction into steps (fetch, decode, execute, …), like an assembly line. With 16 stages, up to 16 instructions are in progress at once, each in a different step.</li>
</ul>
<p>Why does this matter for memory? Eight threads and a 16-stage pipeline ask for instructions and data several times in every cycle. Main memory cannot answer that fast. The rest of the module is about how the chip keeps them fed.</p>`,
      viz: [{ name: 'flow', caption: 'Intel i7 timeline (slide 2). Nehalem is the 1st generation, Haswell the 4th, Broadwell the 5th.', props: { dir: 'h', steps: [
        { label: 'Nehalem', sub: '2008 · gen 1', tone: 'c1' },
        { label: 'Sandy Bridge', sub: '2011 · gen 2', tone: 'c2' },
        { label: 'Ivy Bridge', sub: '2012 · gen 3', tone: 'c3' },
        { label: 'Haswell', sub: '2013 · gen 4', tone: 'acc' },
        { label: 'Broadwell', sub: '2015 · gen 5', tone: 'c5' },
        { label: 'Skylake', sub: '2015', tone: 'c6' }] } }],
      takeaway: 'Core i7 is a family: Nehalem (2008, gen 1), Sandy Bridge (2011), Ivy Bridge (2012), Haswell (2013, gen 4), Broadwell (2015, gen 5), Skylake (2015). Tick = smaller process, tock = new design. The chip: 4 cores × 2 hyperthreads = 8 threads, 16-stage pipeline.',
      exam: 'Name the generations in order with their years; say what tick and tock mean; "4 cores, hyperthreaded, 8 threads, 16-stage pipeline".'
    },
    {
      id: 'developments',
      h: 'Footprint and major developments',
      why: 'where things sit, what got better',
      lead: 'The die photos show where each part of the chip physically lies — including the L3 cache. Then two developments explain much of Haswell’s speed: a new kind of transistor and much higher cache bandwidth.',
      html: `
<p>The <b>die</b> is the piece of silicon that holds the processor. Its <b>footprint</b> (floor plan) shows how the area is used. The slide compares two photos; the table lists what you can see on each:</p>
<table class="t">
  <tr><th></th><th>Nehalem (first gen)</th><th>Haswell (fourth gen)</th></tr>
  <tr><td>Cores</td><td>4 cores side by side, a "Queue" block between them</td><td>4 cores side by side</td></tr>
  <tr><td>Shared L3 cache</td><td>a large block along the bottom, below the cores</td><td>a strip directly below the cores</td></tr>
  <tr><td>Other blocks</td><td>memory controller along the top; Misc I/O and QPI 0 / QPI 1 links on the sides</td><td>processor graphics on the left; system agent, display engine and memory controller on the right; memory controller I/O at the bottom</td></tr>
</table>
<p>The pattern: in both chips the <b>L3 cache is its own block on the same die, outside the cores</b>, and all cores sit next to it. Haswell also moved a graphics processor onto the same die.</p>
<p><b>Major development: tri-gate (3-D) transistors.</b> In a <b>conventional transistor</b>, electrons flow from the <b>source</b> to the <b>drain</b> through a flat, two-dimensional <b>conducting channel</b>; a <b>gate</b> starts and stops the flow, switching the transistor on or off. In Intel’s new transistor a thin <b>fin</b> rises above the surface and the gate is wrapped around it, forming conducting channels on <b>three sides</b>. The slide gives the benefits: it takes less space on the chip, improves speed and reduces power consumption. (General knowledge: Intel first used it at 22 nm.)</p>
<p><b>Increased cache bandwidth.</b> Two words are needed here. <b>Latency</b> is how long one request takes (for example, 4 cycles for an L1 hit). <b>Bandwidth</b> is how much data can flow per unit of time (bytes per cycle, GB/s).</p>
<div class="callout analogy">Think of a highway: latency is the travel time of one car; bandwidth is the number of lanes. More lanes do not make a single trip shorter, but many more cars arrive per minute.</div>
<p>The slide chart compares an Ivy Bridge chip (i7-3770K) with a Haswell chip (i7-4770K) (generations: general knowledge). The units are not printed on the slide (most likely GB/s from a benchmark):</p>
<table class="t">
  <tr><th>Processor</th><th>L1D cache</th><th>L2 cache</th><th>L3 cache</th></tr>
  <tr><td>Core i7-3770K</td><td>513.31</td><td>304.09</td><td>187.53</td></tr>
  <tr><td>Core i7-4770K</td><td>945.31</td><td>326</td><td>182</td></tr>
</table>
<p>Read the columns: the <b>L1 data cache bandwidth almost doubled</b> (513 → 945), L2 grew a little (304 → 326), and L3 stayed about the same (188 → 182). The "Load and store ports" section shows how Haswell did this: it made the paths between the core, L1 and L2 twice as wide.</p>`,
      takeaway: 'On the die, the shared L3 is a separate block next to the cores, not inside them. Tri-gate transistors (gate around a fin, channels on three sides) are smaller, faster and use less power. Haswell almost doubled L1D bandwidth; latency is a different thing from bandwidth.',
      exam: 'Describe the die: four cores in a row, shared L3 beside them, memory controller on the chip. Explain tri-gate transistors in one sentence. Know the difference between latency and bandwidth.'
    },
    {
      id: 'caching-basics',
      h: 'Caching basics: three levels, private and shared',
      why: 'which cache belongs to whom',
      lead: 'This is the key slide of the presentation and the one most often asked: how many cache levels the i7 has, which ones belong to one core, which one all cores share — and where each one physically sits.',
      html: `
<p>Recall caching from module 1: a small fast memory keeps a <b>copy</b> of the data in use. Data moves between levels in fixed-size blocks called <b>cache lines</b>; on all these i7 caches a line is <b>64 bytes</b> (slide 37: "all caches use 64-byte lines"). If the line is in the level we search, it is a <b>hit</b>; if not, it is a <b>miss</b> and the next, slower level is asked.</p>
<p>The slide "Intel Core i7 Caching Basics" says the i7 has <b>three levels</b> of caching:</p>
<ul>
  <li><b>L1 — separate for each core, split in two halves.</b> A 32 KB <b>instruction cache</b> (L1 I) and a 32 KB <b>data cache</b> (L1 D). Why split? In the same cycle the pipeline fetches the next instruction and loads data for an earlier one; two separate caches serve both requests at once (general knowledge).</li>
  <li><b>L2 — separate for each core.</b> 256 KB, holding data + instructions together (a <b>unified</b> cache).</li>
  <li><b>L3 — shared among all cores, and inclusive.</b> 8 MB, "for all applications to share".</li>
</ul>
<p>Where are they physically? Look at the drawing: <b>L1 and L2 are inside each core</b>. The <b>L3 is on the same die (inside the processor package), but outside the individual cores</b>. Main memory is outside the chip.</p>
<svg class="d" viewBox="0 0 600 330">
  <rect class="d-box" x="10" y="10" width="580" height="252" rx="10"/>
  <text class="d-txt sm" x="22" y="30">processor die (inside the package)</text>
  <rect class="d-box" x="24" y="40" width="128" height="118" rx="6"/>
  <text class="d-txt b" x="88" y="58" text-anchor="middle">Core 0</text>
  <rect class="d-box ok" x="32" y="68" width="54" height="36" rx="4"/>
  <text class="d-txt" x="59" y="83" text-anchor="middle">L1 I</text>
  <text class="d-txt sm" x="59" y="98" text-anchor="middle">32 KB</text>
  <rect class="d-box ok" x="90" y="68" width="54" height="36" rx="4"/>
  <text class="d-txt" x="117" y="83" text-anchor="middle">L1 D</text>
  <text class="d-txt sm" x="117" y="98" text-anchor="middle">32 KB</text>
  <rect class="d-box warn" x="32" y="110" width="112" height="28" rx="4"/>
  <text class="d-txt" x="88" y="129" text-anchor="middle">L2 · 256 KB</text>
  <text class="d-txt sm" x="88" y="152" text-anchor="middle">2 HW threads</text>
  <rect class="d-box" x="164" y="40" width="128" height="118" rx="6"/>
  <text class="d-txt b" x="228" y="58" text-anchor="middle">Core 1</text>
  <rect class="d-box ok" x="172" y="68" width="54" height="36" rx="4"/>
  <text class="d-txt" x="199" y="83" text-anchor="middle">L1 I</text>
  <text class="d-txt sm" x="199" y="98" text-anchor="middle">32 KB</text>
  <rect class="d-box ok" x="230" y="68" width="54" height="36" rx="4"/>
  <text class="d-txt" x="257" y="83" text-anchor="middle">L1 D</text>
  <text class="d-txt sm" x="257" y="98" text-anchor="middle">32 KB</text>
  <rect class="d-box warn" x="172" y="110" width="112" height="28" rx="4"/>
  <text class="d-txt" x="228" y="129" text-anchor="middle">L2 · 256 KB</text>
  <text class="d-txt sm" x="228" y="152" text-anchor="middle">2 HW threads</text>
  <rect class="d-box" x="304" y="40" width="128" height="118" rx="6"/>
  <text class="d-txt b" x="368" y="58" text-anchor="middle">Core 2</text>
  <rect class="d-box ok" x="312" y="68" width="54" height="36" rx="4"/>
  <text class="d-txt" x="339" y="83" text-anchor="middle">L1 I</text>
  <text class="d-txt sm" x="339" y="98" text-anchor="middle">32 KB</text>
  <rect class="d-box ok" x="370" y="68" width="54" height="36" rx="4"/>
  <text class="d-txt" x="397" y="83" text-anchor="middle">L1 D</text>
  <text class="d-txt sm" x="397" y="98" text-anchor="middle">32 KB</text>
  <rect class="d-box warn" x="312" y="110" width="112" height="28" rx="4"/>
  <text class="d-txt" x="368" y="129" text-anchor="middle">L2 · 256 KB</text>
  <text class="d-txt sm" x="368" y="152" text-anchor="middle">2 HW threads</text>
  <rect class="d-box" x="444" y="40" width="128" height="118" rx="6"/>
  <text class="d-txt b" x="508" y="58" text-anchor="middle">Core 3</text>
  <rect class="d-box ok" x="452" y="68" width="54" height="36" rx="4"/>
  <text class="d-txt" x="479" y="83" text-anchor="middle">L1 I</text>
  <text class="d-txt sm" x="479" y="98" text-anchor="middle">32 KB</text>
  <rect class="d-box ok" x="510" y="68" width="54" height="36" rx="4"/>
  <text class="d-txt" x="537" y="83" text-anchor="middle">L1 D</text>
  <text class="d-txt sm" x="537" y="98" text-anchor="middle">32 KB</text>
  <rect class="d-box warn" x="452" y="110" width="112" height="28" rx="4"/>
  <text class="d-txt" x="508" y="129" text-anchor="middle">L2 · 256 KB</text>
  <text class="d-txt sm" x="508" y="152" text-anchor="middle">2 HW threads</text>
  <line class="d-line" x1="88" y1="158" x2="88" y2="176"/>
  <line class="d-line" x1="228" y1="158" x2="228" y2="176"/>
  <line class="d-line" x1="368" y1="158" x2="368" y2="176"/>
  <line class="d-line" x1="508" y1="158" x2="508" y2="176"/>
  <rect class="d-box acc" x="24" y="176" width="548" height="36" rx="6"/>
  <text class="d-txt b" x="298" y="199" text-anchor="middle">L3 · 8 MB · 16-way · shared by all cores · inclusive</text>
  <line class="d-line" x1="298" y1="212" x2="298" y2="222"/>
  <rect class="d-box muted" x="24" y="222" width="548" height="30" rx="6"/>
  <text class="d-txt sm" x="298" y="242" text-anchor="middle">DDR3 memory controller — shared by all cores</text>
  <line class="d-line" x1="298" y1="252" x2="298" y2="282"/>
  <rect class="d-box" x="198" y="282" width="200" height="36" rx="6"/>
  <text class="d-txt b" x="298" y="305" text-anchor="middle">Main memory (DRAM)</text>
  <text class="d-txt sm" x="410" y="305">outside the chip</text>
</svg>
<p><b>Inclusive</b> means: every line that is in any core’s L1 or L2 also has a copy in the L3. Why would anyone store the same data twice? The slide gives the reason: an "inclusive cache policy to minimize traffic from snoops". A <b>snoop</b> is a check whether other cores hold a copy of a line — this is how the hardware keeps <b>cache coherency</b> (module 1). Because the L3 includes everything, the chip looks in the L3 first: if the line is not there, no core has it, and the cores are not disturbed at all. The price is a little space: the L3 also stores copies of 4 × (64 + 256) KB of private cache lines (general knowledge).</p>
<p>The textbook figure on slide 9 ("The Core i7 memory system") shows the same split with more detail. Read it as two groups: what is inside each core, and what is shared.</p>
<table class="t">
  <tr><th>Part</th><th>Where</th><th>Size / organization</th></tr>
  <tr><td>Registers, instruction fetch, MMU (address translation)</td><td>inside each core</td><td>—</td></tr>
  <tr><td>L1 d-cache / L1 i-cache</td><td>inside each core</td><td>32 KB, 8-way / 32 KB, 8-way</td></tr>
  <tr><td>L1 d-TLB / L1 i-TLB</td><td>inside each core</td><td>64 entries, 4-way / 128 entries, 4-way</td></tr>
  <tr><td>L2 unified cache</td><td>inside each core</td><td>256 KB, 8-way</td></tr>
  <tr><td>L2 unified TLB</td><td>inside each core</td><td>512 entries, 4-way</td></tr>
  <tr><td>QuickPath interconnect</td><td>drawn inside the core box; links to other cores and to the I/O bridge</td><td>4 links @ 25.6 GB/s, 102.4 GB/s total</td></tr>
  <tr><td><b>L3 unified cache</b></td><td><b>in the package, outside the cores</b></td><td>8 MB, 16-way, shared by all cores</td></tr>
  <tr><td>DDR3 memory controller</td><td>in the package, outside the cores</td><td>3 × 64 bit @ 10.66 GB/s, 32 GB/s total, shared by all cores</td></tr>
  <tr><td>Main memory</td><td>outside the package</td><td>—</td></tr>
</table>
<p>The pattern: everything one core needs in every cycle (registers, L1, TLBs, L2) is <b>inside the core</b>; shared parts (L3, memory controller) are <b>outside the cores but still on the chip</b>; only DRAM is off-chip. The TLB numbers in this figure belong to the older generation — Haswell changed them (see the TLB section).</p>
<div data-viz="0"></div>`,
      viz: [{ name: 'layers', caption: 'The Core i7 hierarchy: each level is bigger and slower than the one above. Latencies are from the access-steps slides (L2: ~10 cycles on the first i7, 11 cycles on Haswell).', props: { pyramid: true, top: 'smaller · faster', bottom: 'larger · slower', layers: [
        { label: 'Registers', sub: 'inside the core', tone: 'c1' },
        { label: 'L1 — 32 KB I + 32 KB D', sub: 'private, one per core · ~4 cycles', tone: 'ok' },
        { label: 'L2 — 256 KB unified', sub: 'private, one per core · ~10–11 cycles', tone: 'warn' },
        { label: 'L3 — 8 MB, inclusive', sub: 'shared by all cores · on the die, outside the cores · ~35 cycles', tone: 'acc' },
        { label: 'Main memory (DRAM)', sub: 'outside the chip · ~135 cycles', tone: 'muted' }] } }],
      takeaway: 'Three levels. L1 (32 KB instruction + 32 KB data) and L2 (256 KB unified) are private to each core and sit inside it. L3 (8 MB) is shared by all cores, inclusive (to reduce snoop traffic) and sits on the die outside the cores. All lines are 64 bytes.',
      exam: 'A written quiz asked: "L3 cache is located on the CPU die (or package), outside the individual CPU cores" — True. Be ready to draw it: four cores, each with L1 I + L1 D + L2, one shared inclusive L3, the memory controller, DRAM outside.'
    },
    {
      id: 'addressing',
      h: 'Virtual and physical addresses',
      why: 'which address the cache uses',
      lead: 'Module 8 showed that programs use virtual addresses and the hardware translates them into physical ones. The i7 caches work with the translated, physical address, so translation lies on the path of every memory access.',
      html: `
<p>Slide 10 ("Virtual Addressing") recalls the idea. Each virtual page of a program is mapped by <b>address translation</b> either to a page of <b>physical memory</b> or — if the page is not loaded — to a place on <b>disk</b> (the grey entries in the figure). The program never sees the physical addresses.</p>
<p>Slide 11 ("Physical Addressing") shows the other side: how the L1 cache reads a <b>36-bit physical address</b>. The address is cut into three fields:</p>
<table class="t">
  <tr><th>Bits</th><th>Field</th><th>What it does</th></tr>
  <tr><td>35–12 (24 bits)</td><td><b>tag</b> = physical page address, aligned to 4 KB</td><td>says which page the line comes from; compared with the stored tags</td></tr>
  <tr><td>11–6 (6 bits)</td><td><b>set index</b></td><td>chooses the set to look in</td></tr>
  <tr><td>5–0 (6 bits)</td><td><b>offset into the cache line</b></td><td>chooses the byte inside the 64-byte line</td></tr>
</table>
<p>Now notice something useful. The low 12 bits (11–0) are exactly the <b>offset inside a 4 KB page</b> (2<sup>12</sup> = 4096). Translation changes only the page number; it never changes the offset. So the cache can choose the set using bits that are already known, <b>while</b> the TLB is still translating the page number. When the TLB answers, the physical page address is compared with the tags in that set. This is why the Haswell L1 slide can say "TLB access and cache tag can occur in parallel" (the explanation of why it works is general knowledge).</p>
<div data-viz="0"></div>`,
      viz: [{ name: 'flow', caption: 'One L1 lookup. Steps 2 and 3 happen at the same time; only the tag compare needs the TLB result.', props: { dir: 'h', steps: [
        { label: 'Virtual address', sub: 'page number | page offset (12 bits)' },
        { label: 'TLB', sub: 'page number → physical page address (24-bit tag)', tone: 'acc' },
        { label: 'Choose L1 set', sub: 'bits 11–6 of the offset — no translation needed', tone: 'ok' },
        { label: 'Compare tags', sub: 'physical page address vs the 8 tags of the set → hit or miss', tone: 'warn' }] } }],
      takeaway: 'The i7 caches are searched with the physical address: tag (bits 35–12, the physical page address) | set index (11–6) | offset (5–0). Index and offset lie inside the 4 KB page offset, so the TLB and the L1 set lookup can run in parallel.',
      exam: 'Explain why the TLB and the L1 lookup can work in parallel: set index + offset = 12 bits = the page offset, which translation does not change.'
    },
    {
      id: 'associativity',
      h: 'N-way set associativity',
      why: 'where a block may be stored',
      lead: 'We said that bits 11–6 choose a "set". What exactly is a set, and why does the i7 not simply put each block anywhere? This is set associativity — a review from computer architecture.',
      html: `
<p>The problem: the L1 data cache holds only 512 lines (32 KB / 64 B), but memory holds millions of blocks. When a block comes in, <b>where may it go</b>, and how do we <b>find it again</b> quickly? There are three possible answers:</p>
<ul>
  <li><b>Direct-mapped</b>: every block has exactly one possible place. Finding it is trivial (one compare), but two blocks that map to the same place keep throwing each other out.</li>
  <li><b>Fully associative</b>: a block may go anywhere. No such conflicts, but every lookup must compare the address with <i>all</i> tags — too slow and too costly for a large cache.</li>
  <li><b>N-way set associative</b>: the middle way. The cache is divided into <b>sets</b>; each set has N slots called <b>ways</b>. The index bits of the address choose <b>one set</b>; the block may be stored in <b>any of the N ways</b> of that set. A lookup compares only N tags, all at the same time.</li>
</ul>
<div class="callout analogy">Think of a parking garage with 64 floors and 8 spaces per floor. The last digits of your plate decide your floor (the set index); you may park in any free space on that floor (the way). To find your car you check only the 8 spaces of one floor, not the whole garage.</div>
<p>This is what the slide means by "<b>multiple entries per index</b>" (the N ways) and "<b>narrows search area needed to find unused slot</b>" (only one set is searched). The lower half of slide 11 shows the search: the index selects set 2; its eight ways (Way 0 … Way 7, each a 24-bit tag + a 64-byte line) are checked; the tag matches in Way 1 → <b>cache hit</b>.</p>
<p>The slide example is the Haswell desktop chip <b>i7-4790</b>:</p>
<ul>
  <li><b>L1</b>: 4 × 32 KB, 8-way (one per core);</li>
  <li><b>L2</b>: 4 × 256 KB, 8-way (the slide writes "4/256 KB" — one 256 KB cache per core);</li>
  <li><b>L3</b>: shared, 8 MB, 16-way.</li>
</ul>
<p>From these numbers and the 64-byte line we can compute every field of the address. Worked example for L1:</p>
<div class="formula">32 KB / 64 B = 512 lines → 512 / 8 ways = <b>64 sets</b> → 2<sup>6</sup> = 64 → <b>6 index bits</b><br>64-byte line → 2<sup>6</sup> = 64 → <b>6 offset bits</b><br>tag = 36 − 6 − 6 = <b>24 bits</b> — exactly the split on slide 11</div>
<p>The same calculation for all three levels. Look at the last column: a bigger cache has more sets, so it needs more index bits.</p>
<table class="t">
  <tr><th>Level</th><th>Size</th><th>Ways</th><th>Lines (size / 64 B)</th><th>Sets (lines / ways)</th><th>Index bits</th></tr>
  <tr><td>L1 D</td><td>32 KB</td><td>8</td><td>512</td><td>64</td><td>6</td></tr>
  <tr><td>L2</td><td>256 KB</td><td>8</td><td>4,096</td><td>512</td><td>9</td></tr>
  <tr><td>L3</td><td>8 MB</td><td>16</td><td>131,072 (128 K)</td><td>8,192</td><td>13</td></tr>
</table>
<p>The access-steps figure later in the presentation shows exactly these widths: L2 index &lt;9&gt; with "4K blocks", L3 index &lt;13&gt; with "128K blocks". Try the address splitter below: type any address and see which set and which byte it selects.</p>
<div data-viz="0"></div>`,
      viz: [{ name: 'bitSplit', caption: 'An address as the 32 KB, 8-way L1 sees it: 64 sets → 6 index bits, 64-byte lines → 6 offset bits.', props: { fields: [{ label: 'tag', bits: 20 }, { label: 'set index', bits: 6 }, { label: 'block offset', bits: 6 }], address: '0x12345A7C', note: 'the widget shows 32 bits, so the tag has 20 bits; on the slide the physical address has 36 bits and the tag has 24 bits. Index and offset are the same.' } }],
      takeaway: 'An N-way set-associative cache is divided into sets of N ways: the index picks one set, the block may sit in any of its N ways, and only N tags are compared. i7-4790: L1 4 × 32 KB 8-way, L2 4 × 256 KB 8-way, L3 shared 8 MB 16-way. L1: 64 sets, 6 index bits, 6 offset bits, 24-bit tag.',
      exam: 'Define set and way in one sentence each; give the i7-4790 numbers; compute the number of sets of a 32 KB 8-way cache with 64-byte lines (64).'
    },
    {
      id: 'tlb',
      h: 'TLB design and its evolution',
      why: 'making translation fast',
      lead: 'Every access needs a translation, and reading the page table costs extra memory accesses (module 8). The i7 keeps recent translations in a TLB — and, like the data caches, the TLB has two levels.',
      html: `
<p>In the slide’s words, the <b>TLB (translation lookaside buffer)</b> is a memory cache that stores <b>recent translations of virtual memory to physical addresses</b> for faster retrieval. On a TLB hit, the physical page is known almost at once. On a miss, the hardware must read the page tables in memory (a "page walk", general knowledge), which costs many cycles.</p>
<p>The i7 uses a <b>2-level</b> TLB system (slide 13, Haswell):</p>
<ul>
  <li><b>L1 TLB</b>, divided into 2 parts: a <b>data TLB</b> (DTLB) with <b>64</b> entries for 4 KB pages, and an <b>instruction TLB</b> (ITLB) with <b>128</b> entries for 4 KB pages. It is split for the same reason as the L1 cache: instruction fetch and data access happen at the same time.</li>
  <li><b>L2 TLB</b> (also called STLB, the second-level TLB), which services misses in the L1 DTLB. Compared with the previous generation it:
    <ul><li>can hold translations for <b>4 KB and 2 MB pages</b> (before: only 4 KB);</li><li>has <b>1024 entries</b> (before: 512);</li><li>is <b>8-way</b> associative (before: 4-way).</li></ul></li>
</ul>
<p>Why do 2 MB pages matter? One entry for a 2 MB page covers 512 times more memory than one entry for a 4 KB page (2 MB / 4 KB = 512). A program with a big data set therefore misses the TLB much less often. (General knowledge: the amount of memory covered by all TLB entries is called the <b>TLB reach</b>.)</p>
<p>Slide 14 compares three generations. Read the numbers as "number of entries for this page size":</p>
<table class="t">
  <tr><th>TLB</th><th>Level</th><th>Nehalem<br>4 KB / 2 MB</th><th>Sandy Bridge and Ivy Bridge<br>4 KB / 2 MB / 1 GB</th><th>Haswell<br>4 KB / 2 MB / 1 GB</th></tr>
  <tr><td>DTLB</td><td>1st</td><td>64 / 32</td><td>64 / 32 / 4</td><td>64 / 32 / 4</td></tr>
  <tr><td>ITLB</td><td>1st</td><td>128 / 7 per logical core</td><td>128 / 8 per logical core / none</td><td>128 / 8 per logical core / none</td></tr>
  <tr><td>STLB</td><td>2nd</td><td>512 / none</td><td>512 / none / none</td><td><b>1024 (shared by 4 KB and 2 MB)</b> / none</td></tr>
</table>
<p>The pattern: the L1 TLBs barely changed since Nehalem (Sandy Bridge added 4 DTLB entries for 1 GB pages). Haswell’s real step is the <b>second-level TLB</b>: twice the entries, twice the associativity, and now usable for 2 MB pages too. "Per logical core" means per hyperthread: each of the two hardware threads of a core has its own large-page ITLB entries.</p>`,
      takeaway: 'The TLB caches recent virtual → physical translations. Haswell: L1 DTLB 64 and ITLB 128 entries (4 KB pages); L2 TLB 1024 entries, 8-way, for 4 KB and 2 MB pages (previous generation: 512 entries, 4-way, 4 KB only).',
      exam: 'What the TLB is for; the two levels and their sizes; what Haswell changed in the L2 TLB (1024 vs 512, 8-way vs 4-way, 2 MB pages too).'
    },
    {
      id: 'plru',
      h: 'Replacement: pseudo-LRU',
      why: 'which line to throw out',
      lead: 'A set has only 8 (or 16) ways. When a new line arrives and its set is full, one old line must leave. Which one? This is the replacement policy — the cache-management problem from module 1.',
      html: `
<p>The ideal choice is <b>LRU (least recently used)</b>: evict the line that has not been used for the longest time, because recently used data is likely to be used again soon. But exact LRU for 8 ways must remember the full order of 8 lines and update it on <i>every</i> access, in hardware, within a few cycles. That is expensive. So the i7 uses a cheap approximation, <b>pseudo-LRU</b>, described on slide 15:</p>
<ol class="steps">
  <li><b>One bit per cache line.</b> When a line is used (a hit, or newly loaded), its bit is set to 1 — "recently used".</li>
  <li><b>Reset after all lines’ bits are set.</b> When the last 0 would become 1, the bits are cleared to 0, so they keep carrying information. (In the usual version, the bit of the line just used stays 1, so the newest line is not thrown out next — general knowledge.)</li>
  <li><b>The lowest line index with a 0 is replaced.</b> On a miss, scan way 0, 1, 2, … and evict the first line whose bit is 0.</li>
</ol>
<p>Step through a tiny example with a 4-way set (real i7 sets have 8 or 16 ways, but the rule is the same):</p>
<div data-viz="0"></div>
<p>The last step shows why it is only "pseudo": exact LRU would evict <b>C</b>, which was last used at step 3, but pseudo-LRU evicted <b>A</b>, because the reset erased the history. In exchange, the hardware needs just 1 bit per line and very simple logic.</p>`,
      viz: [{ name: 'stepper', caption: 'Pseudo-LRU in one 4-way set. Bits are listed for way 0, 1, 2, 3.', props: { lang: 'text',
        code: 'access A\naccess B\naccess C\naccess A\naccess D\naccess B\naccess E',
        steps: [
          { line: 1, note: 'The set is empty and all bits are 0. A misses. The lowest way with bit 0 is way 0, so A goes there and its bit becomes 1.', vars: { 'way 0': 'A', 'way 1': '—', 'way 2': '—', 'way 3': '—', bits: '1 0 0 0', result: 'miss → way 0' } },
          { line: 2, note: 'B misses. The lowest 0 is now way 1.', vars: { 'way 1': 'B', bits: '1 1 0 0', result: 'miss → way 1' } },
          { line: 3, note: 'C misses and goes to way 2.', vars: { 'way 2': 'C', bits: '1 1 1 0', result: 'miss → way 2' } },
          { line: 4, note: 'A hits in way 0. Its bit is already 1, so nothing changes.', vars: { bits: '1 1 1 0', result: 'hit (way 0)' } },
          { line: 5, note: 'D misses and goes to way 3. Now all four bits would be 1, so they are reset — all except D’s bit, the line just used.', vars: { 'way 3': 'D', bits: '0 0 0 1', result: 'miss → way 3, then reset' } },
          { line: 6, note: 'B hits in way 1; its bit becomes 1.', vars: { bits: '0 1 0 1', result: 'hit (way 1)' } },
          { line: 7, note: 'E misses and the set is full. The lowest index with a 0 is way 0, so A is evicted and E takes its place. Exact LRU would have evicted C (unused since step 3).', vars: { 'way 0': 'E', bits: '1 1 0 1', result: 'miss → evict A from way 0' } }
        ] } }],
      takeaway: 'Pseudo-LRU (Intel Core i7): one bit per cache line, set on use; when all bits are set they are reset; on a miss the line with the lowest index whose bit is 0 is replaced. It approximates LRU at very low hardware cost.',
      exam: 'State the three rules exactly as on the slide and apply them to a small example (which way is replaced for given bits).'
    },
    {
      id: 'ports',
      h: 'Load and store ports',
      why: 'moving more data per cycle',
      lead: 'A big cache is useless if the core cannot move data in and out of it fast enough. Haswell widened the "doors" between the core and the L1 data cache — this is where the doubled L1 bandwidth comes from.',
      html: `
<p>Before a load or store can touch the cache, its memory address must be computed (for example base register + offset). This is the job of an <b>address generation unit (AGU)</b>. The scheduler sends operations to execution units through numbered <b>ports</b>:</p>
<ul>
  <li><b>Ports 2 and 3</b> are the address generation units (64-bit AGUs).</li>
  <li><b>Port 4</b> is for writing data from the core to the L1 cache (store data).</li>
  <li>Haswell adds an <b>additional port</b>, port 7, with a <b>store AGU</b>, so the address of a store no longer occupies port 2 or 3.</li>
</ul>
<p>Result: Haswell can sustain <b>2 loads and 1 store per cycle</b> "under nearly any circumstances". The slide diagrams compare Haswell with Sandy Bridge:</p>
<table class="t">
  <tr><th></th><th>Sandy Bridge</th><th>Haswell</th></tr>
  <tr><td>Load buffer</td><td>64 entries</td><td>72 entries</td></tr>
  <tr><td>Store buffer</td><td>36 entries</td><td>42 entries</td></tr>
  <tr><td>Unified scheduler</td><td>54 entries</td><td>60 entries</td></tr>
  <tr><td>Address units</td><td>port 2, port 3 (AGUs)</td><td>port 2, port 3 (AGUs) + port 7 (store AGU)</td></tr>
  <tr><td>Store data</td><td>port 4</td><td>port 4</td></tr>
  <tr><td>Core → L1 loads</td><td>2 × 16 B</td><td>2 × 32 B</td></tr>
  <tr><td>Core → L1 store</td><td>16 B</td><td>32 B</td></tr>
  <tr><td>L1 ↔ L2</td><td>32 B</td><td>64 B</td></tr>
  <tr><td>Split line buffers</td><td>2</td><td>4</td></tr>
</table>
<p>The pattern: every buffer is larger and every path is <b>twice as wide</b>. The L1 cache itself is the same (32 KB, 8-way); only the data paths changed — which explains the almost doubled L1D number in the bandwidth chart.</p>
<p>Two more details from the slide:</p>
<ul>
  <li><b>AVX</b> is a set of instructions for doing <b>SIMD</b> operations on Intel CPUs. SIMD means "single instruction, multiple data": one instruction works on several values at once (general knowledge: e.g. 8 floats in a 32-byte register — which is why 32-byte load paths matter). The <b>forwarding latency for AVX loads</b> decreased from 2 to 1 cycle.</li>
  <li>An <b>unaligned access</b> reads data that crosses the border between two 64-byte cache lines, so it needs both lines. <b>Split line buffers</b> join the two halves. Haswell has <b>4</b> split line buffers (vs 2 in Sandy Bridge), which decreases the impact of unaligned access.</li>
</ul>`,
      takeaway: 'Ports 2 and 3 are AGUs, port 4 writes store data to L1, Haswell adds port 7 (store AGU) → 2 loads + 1 store per cycle. Paths are doubled (2 × 32 B loads, 32 B store, 64 B to L2), AVX load forwarding 2 → 1 cycle, 4 split line buffers instead of 2.',
      exam: 'What an AGU is; which port does what; "2 loads and 1 store per cycle"; what AVX/SIMD means.'
    },
    {
      id: 'haswell-caches',
      h: 'Haswell L1, L2 and L3',
      why: 'each level’s design goal',
      lead: 'With the ports in place, the presentation looks at each Haswell cache level. Each has its own goal: L1 must be very fast, L2 must feed L1 quickly, and L3 must be big and shared without wasting power.',
      html: `
<p><b>L1 data cache</b> (slide 19):</p>
<ul>
  <li><b>32 KB, 8-way associative.</b></li>
  <li><b>Write-back.</b> A write updates only the cache line; the lower level is updated later, when the line is evicted. The opposite, <b>write-through</b>, sends every write down at once. Write-back saves bandwidth: a line written 100 times goes down only once. (General knowledge: a "dirty" bit — the D column in the access-steps figure — marks lines that must be written back.)</li>
  <li><b>TLB access and cache tag lookup can occur in parallel</b> — possible because the set index lies inside the page offset (see the addressing section).</li>
  <li><b>Does not suffer from bank conflicts</b> (unlike Sandy Bridge). Sandy Bridge’s L1 was divided into <b>banks</b> (slide 37: "32 Bytes/cycle (banked)"); two loads in the same cycle that needed the same bank had to wait for each other — a <b>bank conflict</b>.</li>
  <li><b>Minimum latency: 4 cycles</b> (same as Sandy Bridge).</li>
  <li><b>Minimum lock latency: 12 cycles</b> (Sandy Bridge: 16). Lock latency is the time of an atomic locked instruction — the hardware atomic instructions that implement <code>acquire()</code> of a mutex in the synchronization module. Cheaper locks help every multithreaded program.</li>
</ul>
<p><b>L2 cache</b> (slide 20):</p>
<ul>
  <li><b>Bandwidth doubled.</b></li>
  <li>Can deliver a line to the data or instruction cache <b>every cycle</b>.</li>
  <li><b>11-cycle latency.</b></li>
  <li><b>256 KB for each core.</b></li>
</ul>
<div class="callout warn">Slide 20 says "can deliver 64 <b>bit</b> line". Lines are 64 <b>bytes</b> and slide 37 gives the L2 → L1 bandwidth as 64 <b>Bytes</b>/cycle, so read it as one 64-byte line per cycle.</div>
<p><b>L3 cache</b> (slide 21):</p>
<ul>
  <li><b>Shared between all cores.</b></li>
  <li>Size varies between models and generations, <b>between 6 MB and 15 MB</b>; <b>most Haswell models have 8 MB</b>.</li>
  <li><b>Size reduced for power efficiency.</b> A cache uses power all the time; a smaller L3 uses less. The trade-off is a few more misses that must go to DRAM.</li>
</ul>
<p>Put together, the pattern is clear: Haswell did <b>not</b> make L1 or L2 answer faster (4 and 11 cycles, as before). It made them deliver <b>more data per cycle</b>, removed waiting (bank conflicts), and made locks cheaper.</p>`,
      takeaway: 'Haswell L1: 32 KB, 8-way, write-back, TLB and tag lookup in parallel, no bank conflicts, 4-cycle latency, lock latency 12 cycles (was 16). L2: 256 KB per core, 11 cycles, doubled bandwidth (a 64-byte line per cycle). L3: shared, 6–15 MB, mostly 8 MB, reduced for power.',
      exam: 'Write-back vs write-through; the L1 latency (4 cycles) and L2 latency (11 cycles); L3 size range and why it was reduced.'
    },
    {
      id: 'shared-data',
      h: 'Shared data: Transactional Synchronization Extensions',
      why: 'cheaper synchronization in hardware',
      lead: 'Eight hardware threads that share data must synchronize — that is the whole synchronization module. Locks are correct but slow when conflicts are rare. Haswell adds hardware support for a different approach: transactional memory.',
      html: `
<p>The problem with locks: a lock lets only one thread into the critical section, even when two threads would touch <i>different</i> parts of the shared data and could safely run together. And taking a lock always costs time (the lock latency from the previous section).</p>
<p>The idea of <b>transactional memory</b> comes from databases: run the critical section <b>optimistically</b>, without really taking the lock. The hardware watches which memory lines the code reads and writes (general knowledge: it tracks them in the L1 cache — which is why this feature belongs to a memory-hierarchy talk).</p>
<ol class="steps">
  <li>If no other thread touched the same lines, all writes become visible at once: the transaction <b>commits</b>.</li>
  <li>If a conflict happened, all changes are thrown away: the transaction <b>aborts</b>, and the code runs again in a safe way (with a real lock).</li>
</ol>
<p>Intel calls this <b>Transactional Synchronization Extensions (TSX)</b>. It has two interfaces:</p>
<div class="cols">
  <div class="callout note"><b>Hardware Lock Elision (HLE)</b><ul><li><b>backwards compatible</b>; the slide adds "Windows only"</li><li>uses <b>instruction prefixes</b> on the existing lock and release instructions</li><li>an old CPU ignores the prefixes and simply takes the lock (general knowledge)</li></ul></div>
  <div class="callout note"><b>Restricted Transactional Memory (RTM)</b><ul><li><b>newer, more flexible</b>: the program marks where a transaction begins and ends</li><li>the programmer must write <b>fallback code in case of failure</b> (for example, take a normal lock)</li></ul></div>
</div>
<p>The connection to the synchronization module: TSX does not remove the critical-section problem. It makes the common case (no conflict) fast, and falls back to ordinary locking when threads really collide.</p>`,
      takeaway: 'TSX = transactional memory in hardware: run the critical section as a transaction, commit if there is no conflict, roll back otherwise. HLE: backwards compatible, instruction prefixes on lock and release. RTM: newer and more flexible, needs fallback code in case of failure.',
      exam: 'What transactional memory is; the difference between HLE and RTM; link it to locks and critical sections.'
    },
    {
      id: 'prefetching',
      h: 'Pre-fetching',
      why: 'avoiding misses before they happen',
      lead: 'A miss to memory costs about 135 cycles. The best miss is one that never happens: if the hardware can guess what will be needed next, it can fetch it early.',
      html: `
<p><b>Pre-fetching</b> means fetching instructions or data <b>before they are needed</b>. It works because of <b>spatial locality</b>: programs read code and arrays mostly in order, so after block n, block n + 1 is very likely to be next.</p>
<p>The slide describes the mechanism:</p>
<ol class="steps">
  <li><b>On a miss, 2 blocks are fetched</b>: the block that was asked for, and the next one. The extra block waits in a buffer.</li>
  <li><b>If the guess was successful</b>, the next miss finds its block in the buffer and takes it from there, without a slow trip to memory.</li>
  <li>At that moment the <b>next block is pre-fetched</b>, so a program that walks through memory stays one block ahead.</li>
</ol>
<div data-viz="0"></div>
<p>The trade-off (general knowledge): a wrong guess wastes memory bandwidth and buffer space. That is why the hardware fetches only one block ahead, where the guess is usually right.</p>`,
      viz: [{ name: 'flow', caption: 'Pre-fetching a sequential scan: every miss is served from the buffer and starts the next fetch.', props: { dir: 'h', steps: [
        { label: 'Miss on block n', tone: 'bad' },
        { label: 'Fetch n and n + 1', sub: 'n + 1 waits in a buffer', tone: 'warn' },
        { label: 'Access n + 1', sub: 'taken from the buffer — fast', tone: 'ok' },
        { label: 'Pre-fetch n + 2', tone: 'acc' }] } }],
      takeaway: 'Pre-fetching fetches instructions/data before they are needed: on a miss 2 blocks are fetched; if the guess is right, the next miss takes its block from the buffer and the next block is pre-fetched.',
      exam: '"On a miss 2 blocks are fetched" — explain what happens next and why it works (spatial locality).'
    },
    {
      id: 'access-steps',
      h: 'One memory access, step by step',
      why: 'everything together, with latencies',
      lead: 'Now we can follow one access all the way down, as in the large figure of the presentation (slides 24–34). Every piece we met — TLB, set index, tag compare, L2, L3, memory — appears in order.',
      html: `
<p>The figure shows the whole i7 hierarchy: the instruction side on the left (ITLB, I-cache), the data side on the right (DTLB, D-cache), then the shared path down through L2, L3 and main memory. The slides follow an <b>instruction fetch</b>; a data load goes the same way through the DTLB and the D-cache. Numbers in angle brackets are field widths in bits.</p>
<ol class="steps">
  <li><b>The CPU sends a virtual address</b> (the PC): virtual page number &lt;36&gt; + page offset &lt;12&gt;, a 48-bit virtual address.</li>
  <li><b>TLB and L1 work in parallel.</b> The ITLB (128 PTEs in 4 banks) translates the page number; at the same time the index bits, taken from the page offset, select a set of the L1 I-cache.</li>
  <li><b>Tag compare in L1.</b> The physical page address &lt;24&gt; from the TLB is compared with the tags of the set. <b>Hit → done, latency ~4 clock cycles.</b> Miss → move on to L2.</li>
  <li><b>L2.</b> The physical address is split into tag &lt;21&gt; | index &lt;9&gt; (4K blocks, 8-way). <b>Hit → done, ~10 clock cycles.</b> Miss → move on to L3.</li>
  <li><b>L3.</b> Tag &lt;17&gt; | index &lt;13&gt; (128K blocks, 16-way). <b>Hit → done, ~35 clock cycles; the block is placed in L1 and L3.</b> Miss → a memory access is initiated.</li>
  <li><b>Main memory.</b> The memory interface reads the block from the DIMMs. <b>Done, ~135 clock cycles; the block is placed in L1 and L3.</b></li>
</ol>
<p>(If the ITLB misses in step 2, the L2 TLB is checked; if it misses too, the page table is walked — general knowledge.)</p>
<div data-viz="0"></div>
<p>Now compare the cost of each outcome. Read the bars below as "total time until the data arrives":</p>
<div data-viz="1"></div>
<p>The pattern: each step down costs about 3–4 times more, and memory is about 34 times slower than L1 (135 / 4). That is why the L1 hit rate decides performance, and why every earlier trick — bigger TLBs, prefetching, wider ports — exists.</p>
<p><b>Where does the block go after a miss?</b> The slides say: into <b>L1 and L3</b>. L3 must get a copy because it is <b>inclusive</b> — anything in a core’s L1 must also be in L3. After an L3 hit the block is already in L3, so in practice only L1 receives a new copy. The slides do not mention L2 here.</p>
<div class="callout warn">Two numbers seem to disagree: these slides give ~10 cycles for an L2 hit, the Haswell L2 slide gives 11. Both are right: this figure shows the first-generation i7 (slide 37: Nehalem L2 = 10 cycles; Sandy Bridge and Haswell = 11 cycles). In the exam say "about 4, 10–11, 35 and 135 cycles".</div>`,
      viz: [
        { name: 'flow', caption: 'The access path from slides 24–34. The search stops at the first level that hits.', props: { dir: 'v', steps: [
          { label: 'CPU sends a virtual address', sub: 'virtual page number (36 bits) + page offset (12 bits)' },
          { label: 'TLB lookup ‖ L1 set selection', sub: 'in parallel: the TLB gives the physical page, offset bits pick the L1 set', tone: 'acc' },
          { label: 'L1: tag compare', sub: 'hit → done, ~4 cycles · miss → L2', tone: 'ok' },
          { label: 'L2 (private): tag 21 | index 9', sub: 'hit → done, ~10 cycles · miss → L3', tone: 'warn' },
          { label: 'L3 (shared): tag 17 | index 13', sub: 'hit → ~35 cycles, block placed in L1 and L3 · miss → memory', tone: 'c3' },
          { label: 'Main memory (DRAM)', sub: 'done in ~135 cycles · block placed in L1 and L3', tone: 'muted' }] } },
        { name: 'timeline', caption: 'Latency in clock cycles for each outcome (slides 28, 30, 32, 34). The L1 bar is so short that its label does not fit.', props: { max: 135, ticks: [0, 10, 35, 135], rows: [
          { label: 'L1 hit', segs: [{ from: 0, to: 4, label: '~4', tone: 'ok' }] },
          { label: 'L2 hit', segs: [{ from: 0, to: 10, label: '~10', tone: 'warn' }] },
          { label: 'L3 hit', segs: [{ from: 0, to: 35, label: '~35 cycles', tone: 'acc' }] },
          { label: 'memory', segs: [{ from: 0, to: 135, label: '~135 cycles', tone: 'bad' }] }] } }
      ],
      takeaway: 'Virtual address → TLB and L1 set lookup in parallel → L1 hit ~4 cycles → L2 hit ~10 → L3 hit ~35 → memory ~135 cycles. After an L3 hit or a memory access the block is placed in L1 and L3 (L3 because it is inclusive).',
      exam: 'Tell the walkthrough in order with the latencies; say where the block is placed after a miss and why L3 gets a copy.'
    },
    {
      id: 'outlook',
      h: 'Broadwell, future releases and conclusion',
      why: 'why Haswell is faster',
      lead: 'The presentation ends with the newest chips of its time (early 2015) and answers its main question: why is Haswell faster than the generations before it?',
      html: `
<p><b>Generation 5 (Broadwell)</b>, from the slide:</p>
<ul>
  <li>currently <b>mobile only</b> (lower-power systems), <b>two cores</b>;</li>
  <li>shrunk to <b>14 nm</b> (the "tick" after Haswell);</li>
  <li>power consumption down to <b>15 W</b>;</li>
  <li><b>no low-end desktop processors</b>;</li>
  <li><b>extended instruction set</b>.</li>
</ul>
<p>The slide picture ("Which processor should a buyer choose?") splits the market: Core i3 / i5 / i7 <b>when performance matters most</b> (desktops, workstations, notebooks), and Core M <b>when mobility matters most</b> (ultra-thin notebooks, 2-in-1 devices, tablets).</p>
<p><b>Future releases:</b> many manufacturers plan to skip the Broadwell desktop chips, possibly because of the lack of low-end offerings; <b>Skylake</b> is expected in the second half of 2015.</p>
<p>Slide 37 puts three generations side by side. Read it row by row and look for the cells that change in Haswell:</p>
<table class="t">
  <tr><th>Metric</th><th>Nehalem</th><th>Sandy Bridge</th><th>Haswell</th></tr>
  <tr><td>L1 instruction cache</td><td>32K, 4-way</td><td>32K, 8-way</td><td>32K, 8-way</td></tr>
  <tr><td>L1 data cache</td><td>32K, 8-way</td><td>32K, 8-way</td><td>32K, 8-way</td></tr>
  <tr><td>— fastest load-to-use</td><td>4 cycles</td><td>4 cycles</td><td>4 cycles</td></tr>
  <tr><td>— load bandwidth</td><td>16 bytes/cycle</td><td>32 bytes/cycle (banked)</td><td><b>64 bytes/cycle</b></td></tr>
  <tr><td>— store bandwidth</td><td>16 bytes/cycle</td><td>16 bytes/cycle</td><td><b>32 bytes/cycle</b></td></tr>
  <tr><td>L2 unified cache</td><td>256K, 8-way</td><td>256K, 8-way</td><td>256K, 8-way</td></tr>
  <tr><td>— fastest load-to-use</td><td>10 cycles</td><td>11 cycles</td><td>11 cycles</td></tr>
  <tr><td>— bandwidth to L1</td><td>32 bytes/cycle</td><td>32 bytes/cycle</td><td><b>64 bytes/cycle</b></td></tr>
  <tr><td>L1 instruction TLB</td><td>4K: 128, 4-way; 2M/4M: 7/thread</td><td>4K: 128, 4-way; 2M/4M: 8/thread</td><td>4K: 128, 4-way; 2M/4M: 8/thread</td></tr>
  <tr><td>L1 data TLB</td><td>4K: 64, 4-way; 2M/4M: 32, 4-way; 1G: fractured</td><td>4K: 64, 4-way; 2M/4M: 32, 4-way; 1G: 4, 4-way</td><td>4K: 64, 4-way; 2M/4M: 32, 4-way; 1G: 4, 4-way</td></tr>
  <tr><td>L2 unified TLB</td><td>4K: 512, 4-way</td><td>4K: 512, 4-way</td><td><b>4K + 2M shared: 1024, 8-way</b></td></tr>
</table>
<p>All caches use 64-byte lines. The pattern: sizes and latencies stay the same; what changes in Haswell is <b>bandwidth</b> (load, store, L2 → L1) and the <b>L2 TLB</b>. (Note: this table gives the Nehalem L1 instruction cache as 4-way, while the textbook figure on slide 9 says 8-way.)</p>
<p><b>Conclusion — why is it faster?</b> (slide 38)</p>
<ul>
  <li><b>Increased bandwidth</b> — wider paths between the core, L1 and L2;</li>
  <li><b>doubled the associativity in the L2 TLB</b> (4-way → 8-way, and 512 → 1024 entries) — fewer TLB misses;</li>
  <li><b>tri-gate transistors</b>.</li>
</ul>
<p>And two more results: a <b>smaller chip size</b>, and <b>lower power requirements</b> — partly from the <b>decreased L3 cache size</b>.</p>`,
      takeaway: 'Broadwell (gen 5): mobile only, two cores, 14 nm, down to 15 W. Haswell is faster because of increased bandwidth, a doubled L2 TLB associativity and tri-gate transistors — not because of shorter latency (4 and 11 cycles did not change). A smaller L3 lowers power.',
      exam: 'Give the three reasons from the conclusion; know that L3 size was decreased for power; Broadwell facts (14 nm, 15 W, mobile, two cores).'
    }
  ],
  terms: [
    { en: 'Cache line', ru: 'строка кэша', def: 'The fixed-size block that moves between cache levels; 64 bytes on all Core i7 caches.' },
    { en: 'Cache hit', ru: 'попадание в кэш', def: 'The requested line is found in the level being searched.' },
    { en: 'Cache miss', ru: 'промах кэша', def: 'The line is not in this level, so the next, slower level must be asked.' },
    { en: 'Latency', ru: 'задержка (латентность)', def: 'Time from a request until the data arrives, e.g. ~4 cycles for an L1 hit.' },
    { en: 'Bandwidth', ru: 'пропускная способность', def: 'Amount of data that can be moved per unit of time (bytes per cycle, GB/s).' },
    { en: 'Clock cycle', ru: 'такт', def: 'One tick of the processor clock; the unit used for cache latencies.' },
    { en: 'Private cache', ru: 'частный кэш ядра', def: 'A cache used by one core only (L1 and L2 on the i7).' },
    { en: 'Shared cache', ru: 'общий кэш', def: 'A cache used by all cores (L3 on the i7).' },
    { en: 'Unified cache', ru: 'единый кэш', def: 'One cache for both instructions and data (L2 and L3 on the i7).' },
    { en: 'Split cache', ru: 'раздельный кэш', def: 'A level divided into an instruction cache and a data cache (L1: 32 KB I + 32 KB D).' },
    { en: 'Instruction cache', ru: 'кэш инструкций', def: 'The half of L1 that holds instructions (32 KB).' },
    { en: 'Data cache', ru: 'кэш данных', def: 'The half of L1 that holds data (32 KB).' },
    { en: 'Inclusive cache', ru: 'инклюзивный кэш', def: 'A cache that also holds a copy of every line stored in the levels above it; the i7 L3 is inclusive to minimize snoop traffic.' },
    { en: 'Snoop', ru: 'отслеживание (snoop)', def: 'A check whether other cores hold a copy of a line; part of keeping caches coherent.' },
    { en: 'Hyperthreading', ru: 'гиперпоточность', def: 'Intel chip-multithreading: 2 hardware threads per core, so 4 cores appear as 8 logical processors.' },
    { en: 'Pipeline', ru: 'конвейер', def: 'Instruction execution split into stages that work on different instructions at once; 16 stages on the i7.' },
    { en: 'Tick-tock model', ru: 'модель «тик-так»', def: 'Intel plan: a tick shrinks the manufacturing process, a tock introduces a new microarchitecture.' },
    { en: 'Microarchitecture', ru: 'микроархитектура', def: 'The internal design of a processor generation (Nehalem, Sandy Bridge, Haswell, ...).' },
    { en: 'Tri-gate transistor', ru: 'трёхзатворный транзистор', def: '3-D transistor: the gate wraps a fin on three sides; takes less space, faster, lower power.' },
    { en: 'Die', ru: 'кристалл', def: 'The piece of silicon that holds the cores, the L3 cache and the memory controller.' },
    { en: 'Memory controller', ru: 'контроллер памяти', def: 'On-chip unit that reads and writes main memory (DRAM); shared by all cores.' },
    { en: 'Physical address', ru: 'физический адрес', def: 'The real address in main memory, produced by translation; the i7 caches are searched with it (36 bits on the slide).' },
    { en: 'Virtual address', ru: 'виртуальный адрес', def: 'The address a program uses; it must be translated into a physical address.' },
    { en: 'Set-associative cache', ru: 'множественно-ассоциативный кэш', def: 'A cache divided into sets; a block may be stored in any of the N ways of the one set chosen by its index.' },
    { en: 'Direct-mapped cache', ru: 'кэш прямого отображения', def: 'Each block has exactly one possible place in the cache.' },
    { en: 'Fully associative cache', ru: 'полностью ассоциативный кэш', def: 'A block may be stored anywhere; every lookup compares all tags.' },
    { en: 'Set', ru: 'набор (множество) кэша', def: 'A group of N lines selected by the index bits of the address.' },
    { en: 'Way', ru: 'путь (канал) кэша', def: 'One slot inside a set; an 8-way cache has 8 lines per set.' },
    { en: 'Tag', ru: 'тег', def: 'The high bits of the address stored with a line and compared to detect a hit (24 bits in the i7 L1).' },
    { en: 'Set index', ru: 'индекс набора', def: 'The address bits that choose the set (6 bits for the 32 KB 8-way L1).' },
    { en: 'Block offset', ru: 'смещение в блоке', def: 'The low address bits that choose the byte inside a line (6 bits for 64-byte lines).' },
    { en: 'Translation lookaside buffer', ru: 'буфер ассоциативной трансляции', def: 'TLB: a cache of recent virtual-to-physical address translations.' },
    { en: 'Second-level TLB', ru: 'TLB второго уровня', def: 'STLB / L2 TLB: serves L1 DTLB misses; on Haswell 1024 entries, 8-way, for 4 KB and 2 MB pages.' },
    { en: 'Large page', ru: 'большая страница', def: 'A 2 MB (or 1 GB) page; one TLB entry covers much more memory than for a 4 KB page.' },
    { en: 'Replacement policy', ru: 'политика замещения', def: 'The rule that decides which line to evict when a set is full.' },
    { en: 'Least recently used', ru: 'вытеснение давно не использованной строки (LRU)', def: 'LRU: evict the line that has not been used for the longest time.' },
    { en: 'Pseudo-LRU', ru: 'псевдо-LRU', def: 'Cheap LRU approximation: one bit per line, reset when all are set, replace the lowest index with a 0.' },
    { en: 'Address generation unit', ru: 'блок генерации адресов', def: 'AGU: computes the memory address of a load or store (ports 2 and 3; on Haswell also port 7 for stores).' },
    { en: 'Load buffer', ru: 'буфер загрузок', def: 'Holds loads in flight: 72 entries on Haswell, 64 on Sandy Bridge.' },
    { en: 'Store buffer', ru: 'буфер записей', def: 'Holds stores in flight: 42 entries on Haswell, 36 on Sandy Bridge.' },
    { en: 'SIMD', ru: 'одна инструкция — много данных', def: 'Single instruction, multiple data: one instruction processes several values at once.' },
    { en: 'Advanced Vector Extensions', ru: 'расширенные векторные инструкции (AVX)', def: 'AVX: a set of instructions for SIMD operations on Intel CPUs.' },
    { en: 'Unaligned access', ru: 'невыровненный доступ', def: 'A load whose data crosses a cache-line boundary and needs two lines.' },
    { en: 'Split line buffer', ru: 'буфер разделённой строки', def: 'Joins the two lines of an unaligned load: 4 on Haswell, 2 on Sandy Bridge.' },
    { en: 'Write-back', ru: 'обратная запись', def: 'A write updates only the cache; the lower level is updated when the line is evicted.' },
    { en: 'Write-through', ru: 'сквозная запись', def: 'Every write goes to the cache and to the lower level at once.' },
    { en: 'Bank conflict', ru: 'конфликт банков', def: 'Two accesses in the same cycle need the same bank of a banked cache, so one must wait.' },
    { en: 'Lock latency', ru: 'задержка блокировки', def: 'Time of an atomic locked instruction: 12 cycles on Haswell, 16 on Sandy Bridge.' },
    { en: 'Transactional memory', ru: 'транзакционная память', def: 'Run a critical section as a transaction: commit if there is no conflict, otherwise roll back.' },
    { en: 'Transactional Synchronization Extensions', ru: 'расширения транзакционной синхронизации', def: 'TSX: Haswell hardware support for transactional memory (HLE and RTM).' },
    { en: 'Hardware Lock Elision', ru: 'аппаратное устранение блокировок', def: 'HLE: backwards-compatible TSX mode that uses instruction prefixes to lock and release.' },
    { en: 'Restricted Transactional Memory', ru: 'ограниченная транзакционная память', def: 'RTM: newer, more flexible TSX mode; needs fallback code in case the transaction fails.' },
    { en: 'Pre-fetching', ru: 'предвыборка', def: 'Fetching instructions or data before they are needed; on a miss the i7 fetches 2 blocks.' },
    { en: 'Spatial locality', ru: 'пространственная локальность', def: 'After using an address, a program is likely to use nearby addresses soon.' }
  ],
  questions: [
    { id: 'i7-01', type: 'tf', q: 'In the Intel Core i7, the L3 cache is located on the CPU die (or package), outside the individual CPU cores.', answer: true, explain: 'L1 and L2 are inside each core; the shared L3 is a separate block on the same die, outside the cores. Only main memory is off-chip.', section: 'caching-basics', diff: 1 },
    { id: 'i7-02', type: 'multi', q: 'Which caches of the Core i7 are private to each core? (select all that apply)', options: ['L1 instruction cache', 'L1 data cache', 'L2 cache', 'L3 cache'], answer: [0, 1, 2], explain: 'Each core has its own L1 (split into instruction and data halves) and its own L2. The L3 is shared among all cores.', section: 'caching-basics', diff: 1 },
    { id: 'i7-03', type: 'single', q: 'How is the L1 cache of each Core i7 core organized?', options: ['One unified 64 KB cache for instructions and data', 'Two halves: a 32 KB instruction cache and a 32 KB data cache', 'One 8 MB cache shared by all cores', 'One 256 KB cache for data and instructions'], answer: 1, explain: 'The slide: "L1 cache broken up into two halves, instruction/data" — 32 KB each. 256 KB unified is L2; 8 MB shared is L3.', section: 'caching-basics', diff: 1 },
    { id: 'i7-04', type: 'tf', q: 'The Core i7 L3 cache is inclusive: it also holds a copy of every line that is stored in the cores’ L1 and L2 caches.', answer: true, explain: 'That is the meaning of "inclusive". Because of it, a line that is not in L3 cannot be in any core’s private cache.', section: 'caching-basics', diff: 1 },
    { id: 'i7-05', type: 'single', q: 'According to the slide, why does the Core i7 use an inclusive L3 cache?', options: ['To make the L1 cache larger', 'To avoid the need for a TLB', 'To minimize traffic from snoops', 'To allow write-through in L1'], answer: 2, explain: '"Inclusive cache policy to minimize traffic from snoops": checking the L3 is enough to know whether any core holds a line, so the cores are not disturbed.', section: 'caching-basics', diff: 2 },
    { id: 'i7-06', type: 'single', q: 'Which order of approximate access latencies (in clock cycles) matches the i7 access-steps slides for L1, L2, L3 and main memory?', options: ['~1, ~4, ~10, ~35', '~4, ~35, ~10, ~135', '~10, ~4, ~35, ~135', '~4, ~10, ~35, ~135'], answer: 3, explain: 'L1 hit ~4 cycles, L2 hit ~10, L3 hit ~35, main memory ~135. Each level down is slower.', section: 'access-steps', diff: 1 },
    { id: 'i7-07', type: 'single', q: 'An access misses in L1 and L2 but hits in L3. What is the approximate latency?', options: ['~4 cycles', '~10 cycles', '~35 cycles', '~135 cycles'], answer: 2, explain: 'An L3 hit costs ~35 clock cycles. ~135 is the cost of going all the way to main memory.', section: 'access-steps', diff: 1 },
    { id: 'i7-08', type: 'single', q: 'According to the slides, where is a block placed after it is brought from main memory?', options: ['In L1 and L3', 'Only in L2', 'Only in L1', 'In L2 and L3, but not in L1'], answer: 0, explain: '"Block is placed in L1 and L3 cache." L3 must get a copy because it is inclusive.', section: 'access-steps', diff: 2 },
    { id: 'i7-09', type: 'single', q: 'What does the TLB store?', options: ['Recently used 64-byte data lines', 'The full page table of every process', 'Blocks fetched before they are needed', 'Recent translations of virtual addresses to physical addresses'], answer: 3, explain: 'The slide: a memory cache that stores recent translations of virtual memory to physical addresses. Data lines live in L1–L3; prefetched blocks wait in a buffer.', section: 'tlb', diff: 1 },
    { id: 'i7-10', type: 'multi', q: 'What did Haswell change in the L2 TLB compared with the previous generation? (select all that apply)', options: ['1024 entries instead of 512', '8-way instead of 4-way associative', 'It holds translations for 4 KB and 2 MB pages instead of only 4 KB', 'It replaced the L1 TLB completely', 'It became shared by all four cores'], answer: [0, 1, 2], explain: 'Slide 13: 1024 entries (vs 512), 8-way (vs 4-way), 4 KB and 2 MB pages (vs only 4 KB). The L1 TLB still exists, and the TLBs are per core.', section: 'tlb', diff: 2 },
    { id: 'i7-11', type: 'single', q: 'How many 4 KB-page entries do the Haswell L1 data TLB and L1 instruction TLB have?', options: ['DTLB 64, ITLB 128', 'DTLB 128, ITLB 64', 'DTLB 512, ITLB 1024', 'DTLB 32, ITLB 8'], answer: 0, explain: 'Data TLB: 64 entries; instruction TLB: 128 entries (4 KB pages). 1024 is the L2 TLB; 32 and 8 are large-page entries.', section: 'tlb', diff: 2 },
    { id: 'i7-12', type: 'single', q: 'In the pseudo-LRU algorithm of the Core i7, which line is replaced on a miss?', options: ['The line with the highest index whose bit is 1', 'A randomly chosen line', 'The line with the lowest index whose bit is 0', 'The line with the oldest exact timestamp'], answer: 2, explain: 'One bit per line, bits reset when all are set, and the lowest line index with a 0 is replaced. Exact timestamps would be true LRU, which is too costly.', section: 'plru', diff: 1 },
    { id: 'i7-13', type: 'single', q: 'Pseudo-LRU, one 4-way set. The bits of ways 0, 1, 2, 3 are 1, 0, 1, 0. A miss occurs. Which way is replaced?', options: ['way 0', 'way 1', 'way 2', 'way 3'], answer: 1, explain: 'Scan from the lowest index: way 0 has bit 1, way 1 has bit 0 → way 1 is replaced. Way 3 also has a 0, but it has a higher index.', section: 'plru', diff: 2 },
    { id: 'i7-14', type: 'single', q: 'The i7-4790 L3 cache is…', options: ['8 MB, shared, 16-way', '8 MB per core, 8-way', '256 KB per core, 16-way', '32 KB, shared, 8-way'], answer: 0, explain: 'Slide 12: L1 4 × 32 KB 8-way, L2 4 × 256 KB 8-way, L3 shared 8 MB 16-way.', section: 'associativity', diff: 1 },
    { id: 'i7-15', type: 'single', q: 'A 32 KB, 8-way set-associative cache uses 64-byte lines. How many sets does it have?', options: ['8', '512', '64', '4096'], answer: 2, explain: '32 KB / 64 B = 512 lines; 512 / 8 ways = 64 sets. 512 is the number of lines, not sets.', section: 'associativity', diff: 2 },
    { id: 'i7-16', type: 'single', q: 'For the same L1 (32 KB, 8-way, 64-byte lines), how many address bits are used for the set index and for the block offset?', options: ['6 index bits and 6 offset bits', '9 index bits and 6 offset bits', '6 index bits and 12 offset bits', '3 index bits and 6 offset bits'], answer: 0, explain: '64 sets → 6 index bits; 64-byte lines → 6 offset bits. Slide 11 shows bits 11–6 as set index and 5–0 as offset. 9 index bits belong to the 512-set L2.', section: 'associativity', diff: 2 },
    { id: 'i7-17', type: 'single', q: 'What does "8-way set associative" mean?', options: ['The cache is divided into exactly 8 sets', 'A block may be placed anywhere in the cache', 'Each line holds 8 blocks', 'Each set has 8 lines, and a block may go into any of the 8 lines of the one set chosen by its index'], answer: 3, explain: 'The index picks one set; the block may use any of its 8 ways, and only those 8 tags are compared. "Anywhere" would be fully associative.', section: 'associativity', diff: 1 },
    { id: 'i7-18', type: 'single', q: 'Why can the Haswell L1 do the TLB access and the cache tag lookup in parallel?', options: ['Because the L1 is indexed with virtual page numbers', 'Because the set index and offset bits lie inside the 4 KB page offset, which translation does not change', 'Because the L1 is fully associative', 'Because the TLB is part of the L3'], answer: 1, explain: 'Index (bits 11–6) + offset (5–0) = 12 bits = the page offset. The set can be chosen before translation ends; only the tag compare needs the physical page address.', section: 'addressing', diff: 3 },
    { id: 'i7-19', type: 'single', q: 'With the extra port 7 (store AGU), how many memory operations per cycle can Haswell sustain?', options: ['1 load and 1 store', '4 loads and 2 stores', '2 loads and 2 stores', '2 loads and 1 store'], answer: 3, explain: 'Slide 17: Haswell can sustain 2 loads and 1 store per cycle "under nearly any circumstances". Ports 2 and 3 are AGUs, port 4 store data, port 7 store AGU.', section: 'ports', diff: 1 },
    { id: 'i7-20', type: 'multi', q: 'Which properties belong to the Haswell L1 data cache? (select all that apply)', options: ['32 KB', '8-way associative', 'Write-back', 'Minimum latency of 4 cycles', 'Write-through', '11-cycle latency'], answer: [0, 1, 2, 3], explain: 'L1: 32 KB, 8-way, write-back, TLB and tag lookup in parallel, 4-cycle minimum latency. 11 cycles is the L2 latency; the L1 is write-back, not write-through.', section: 'haswell-caches', diff: 2 },
    { id: 'i7-21', type: 'single', q: 'Which statement about the Haswell L2 cache is correct?', options: ['8 MB shared by all cores, 35-cycle latency', '32 KB per core, 4-cycle latency', '256 KB per core, 11-cycle latency, doubled bandwidth', '256 KB shared, write-through'], answer: 2, explain: 'Slide 20: bandwidth doubled, one line per cycle to L1, 11-cycle latency, 256 KB for each core.', section: 'haswell-caches', diff: 1 },
    { id: 'i7-22', type: 'single', q: 'Transactional Synchronization Extensions offer two interfaces. Which statement is correct?', options: ['RTM is newer and more flexible, and needs fallback code in case the transaction fails', 'HLE is newer than RTM and needs fallback code', 'RTM uses only instruction prefixes and is backwards compatible', 'HLE removes the need for any lock'], answer: 0, explain: 'HLE: backwards compatible, instruction prefixes on lock and release. RTM: newer, more flexible, fallback code in case of failure.', section: 'shared-data', diff: 2 },
    { id: 'i7-23', type: 'single', q: 'How does Core i7 pre-fetching work, according to the slide?', options: ['On a miss, the whole page is loaded into L1', 'On a miss, 2 blocks are fetched; if the guess is right, the next miss takes its block from the buffer and the next block is pre-fetched', 'Blocks are loaded only after the OS asks for them', 'On a hit, the line is copied to L3'], answer: 1, explain: 'Fetch before needed: on a miss 2 blocks are fetched; on success the miss grabs the block from the buffer and pre-fetches the next one.', section: 'prefetching', diff: 1 },
    { id: 'i7-24', type: 'single', q: 'A Core i7 has 4 hyperthreaded cores. How many hardware threads (logical processors) does the OS see?', options: ['4', '2', '16', '8'], answer: 3, explain: '4 cores × 2 hardware threads = 8 threads. 16 is the number of pipeline stages, not threads.', section: 'family', diff: 1 },
    { id: 'i7-25', type: 'single', q: 'What is special about Intel’s tri-gate transistor?', options: ['It has three drains', 'It works only at 45 nm', 'The gate wraps around a fin and forms conducting channels on three sides', 'It replaces the cache with registers'], answer: 2, explain: 'A fin rises above the surface and the gate is wrapped around it: channels on three sides. It takes less space, improves speed and reduces power.', section: 'developments', diff: 1 },
    { id: 'i7-26', type: 'single', q: 'According to the conclusion of the presentation, how did the L3 cache size change, and why?', options: ['It was decreased, for lower power requirements', 'It was increased, to raise the hit rate', 'It stayed the same, because L3 is inclusive', 'It was removed, because L2 became shared'], answer: 0, explain: '"Lower power requirements — decreased L3 cache size." The L3 slide also says "size reduced for power efficiency".', section: 'outlook', diff: 2 }
  ]
});
