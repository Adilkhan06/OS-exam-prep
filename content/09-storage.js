OS.addModule({
  id: 'storage',
  num: 11,
  group: 'theory',
  title: 'Mass-Storage Systems',
  titleRu: 'Системы внешней памяти',
  icon: '💽',
  sources: ['10-MassStorageSystem.pdf'],
  summary: 'How disks work and how the OS gets speed and safety from them: HDD geometry and access time, SSD / NAND flash and its controller algorithms, disk-scheduling algorithms, ways to attach storage (host, NAS, cloud, SAN), RAID, parity and ECC.',
  bridge: 'The I/O module showed how the CPU talks to any device through controllers, interrupts and DMA. The most important of those devices are disks: they keep every program and file permanently. This module looks inside them and asks how the OS gets the best speed and reliability out of them.',
  intro: `
<p>Main memory is fast but small and <b>volatile</b>: it forgets everything when the power goes off. So every computer also needs <b>secondary storage</b> — large, cheap and <b>persistent</b>. It comes in two technologies: the mechanical <b>hard disk drive</b> (HDD) and electronic <b>nonvolatile memory</b> (NVM), used in SSDs. Each technology has its own weakness, and most of this module is about working around those weaknesses.</p>
<p>The chain of the module: first we see how an HDD works and why its access time is dominated by mechanics (<b>seek + rotation</b>). SSDs remove the mechanics but bring new problems (no overwrite in place, wear). Because HDD seeks are so expensive, the OS reorders the waiting requests with <b>disk-scheduling algorithms</b>. Then we zoom out to how storage is attached to computers: locally, over a network, in the cloud, in a SAN. Finally, disks fail: <b>RAID</b> combines several disks for speed and reliability, using mirroring, striping and <b>parity</b> — a few extra bits computed with XOR that are enough to rebuild a lost disk.</p>`,
  sections: [
    {
      id: 'overview',
      h: 'Why mass storage? Two technologies',
      why: 'the role of secondary storage',
      lead: 'Programs and data must survive a power-off, and they do not all fit in RAM. That is the job of secondary storage.',
      html: `
<p><b>Secondary storage</b> (mass storage) is the large, persistent storage below main memory. Modern computers use it in two ways:</p>
<ul>
  <li>as an <b>extension of main memory</b>, to optimize process execution (parts of processes that do not fit in RAM can be kept there);</li>
  <li>to <b>store programs and data permanently</b>.</li>
</ul>
<p>Memory technologies fall into two worlds: <b>volatile memory</b> — fast working memory such as DRAM, which loses its content without power — and <b>persistent memory</b>, i.e. storage, which is slower and cheaper but keeps data without power. <b>Storage class memory</b> is a newer kind of memory that can bridge the gap between the high-performance working memory and the low-cost storage devices. Disks can also be <b>removable</b>.</p>
<p>Secondary storage uses two technologies:</p>
<ul>
  <li><b>Magnetic</b> — <b>hard disk drives (HDDs)</b>, which store bits on spinning magnetic platters;</li>
  <li><b>Electronic</b> — <b>nonvolatile memory (NVM)</b>, including flash memory storage such as <b>NAND flash</b> and <b>Solid-State Drives (SSDs)</b>.</li>
</ul>
<p><b>Disks are I/O devices.</b> Everything from the I/O module applies to them. The slide repeats the computer organization: a disk sits behind an <b>I/O controller</b>; the controllers share the <b>memory – I/O bus</b> with main memory; and they report the end of an operation to the processor with <b>interrupts</b> (large transfers use DMA).</p>
<div data-viz="0"></div>`,
      viz: [{ name: 'layers', caption: 'The slide "Disks are I/O devices".', props: { top: 'interrupts: from the I/O controllers to the processor', layers: [
        { label: 'Processor → Cache', tone: 'acc' },
        { label: 'Memory I/O bus', sub: 'main memory and the I/O controllers are attached to it', tone: 'warn' },
        { label: 'I/O controller | I/O controller | I/O controller', tone: 'c2' },
        { label: 'Disk, Disk | Graphics output | Network', tone: 'muted' }] } }],
      takeaway: 'Secondary storage extends main memory and keeps programs and data permanently. Two technologies: magnetic (HDD) and electronic (NVM: NAND flash, SSD). Disks are I/O devices: controller + bus + interrupts.'
    },
    {
      id: 'hdd',
      h: 'How a hard disk works',
      why: 'where the delay comes from',
      lead: 'An HDD is a mechanical device: to read one sector, an arm must move and a platter must turn. The geometry of the disk explains its access time.',
      html: `
<div class="callout analogy">Think of a stack of vinyl records on one axle, with a reading arm for every surface — and all the arms fixed to one handle, so they move together.</div>
<p>The parts, from the slide figure:</p>
<ul>
  <li><b>Platter</b> — a disk covered with magnetic material; both surfaces store data. All platters are fixed on one <b>spindle</b>, which rotates them.</li>
  <li><b>Track</b> — one concentric circle on a surface. Each track is divided into <b>sectors</b>, the smallest unit the disk reads or writes.</li>
  <li><b>Read-write head</b> — one per surface, flying just above it. The heads are mounted on <b>arms</b>, and all arms are moved together by the <b>arm assembly</b> (the actuator).</li>
  <li><b>Cylinder</b> — because all arms move together, at one position of the arm assembly the heads are over the same track on every surface. This set of tracks is a cylinder.</li>
</ul>
<div data-viz="0"></div>
<p><b>How fast does it go?</b> Magnetic disks provide the bulk of the secondary storage of modern computers. Drives rotate <b>60 to 250 times per second</b>; the rotation speed is given in <b>RPM</b> (rounds per minute), typically <b>7200, 10000 or 15000 RPM</b>. The <b>transfer rate</b> is the rate at which data flow between the drive and the computer (MB/s).</p>
<p>Before any data can flow, the head must be brought to the right place. This <b>positioning time</b>, also called <b>access time</b>, has two parts:</p>
<div class="formula">Positioning time (access time) = seek time + rotational latency</div>
<ol class="steps">
  <li><b>Seek time</b> — the time to move the disk arm to the desired <b>cylinder</b>.</li>
  <li><b>Rotational latency</b> — the time for the desired <b>sector</b> to rotate under the disk head.</li>
</ol>
<p>Both parts are mechanical, so they are measured in milliseconds — millions of CPU cycles. This single fact drives the rest of the HDD story: the OS tries hard to reduce seeks (disk scheduling), and engineers replaced the mechanics altogether (SSD).</p>
<div class="callout warn">A <b>head crash</b> results from the disk head making contact with the disk surface. It damages the surface and normally cannot be repaired — one of the reasons why disks fail and RAID is needed.</div>`,
      viz: [{ name: 'tree', caption: 'HDD hierarchy.', props: { root: { label: 'HDD', children: [
        { label: 'spindle', note: 'rotates the platters (RPM)' },
        { label: 'platters', note: '3.5″, 2.5″, 1.8″', children: [
          { label: 'track', note: 'concentric circle', children: [{ label: 'sector', note: 'smallest addressable part of a track' }] },
          { label: 'cylinder', note: 'the tracks under the heads at one arm position, on all platters' }] },
        { label: 'arm assembly', note: 'moves the arms → seek', children: [{ label: 'read-write heads', note: 'one per surface' }] }] } } }],
      takeaway: 'Platter → tracks → sectors; the same track on all surfaces forms a cylinder; the heads move together on the arm assembly. Access time = seek time (arm to the cylinder) + rotational latency (sector under the head) — both mechanical and slow.',
      exam: 'Definitions of track, sector and cylinder; access time = seek + rotational latency; what seek time and rotational latency measure.'
    },
    {
      id: 'hdd-perf',
      h: 'Hard disk performance: computing the I/O time',
      why: 'put numbers on the delays',
      lead: 'Now we can turn the two mechanical delays into numbers and compute how long one disk request really takes.',
      html: `
<p>The slide gives typical figures for hard disks. Watch the units: seek time and latency are in <b>milliseconds</b>, transfer rates in gigabytes per second.</p>
<div class="cols">
  <div>
    <ul>
      <li><b>Platters</b>: commonly 3.5″, 2.5″ and 1.8″.</li>
      <li><b>Storage size</b>: 30 GB to 4 TB per drive.</li>
      <li><b>Transfer rate</b>: 6 GB/s in theory, 1 GB/s in practice.</li>
      <li><b>Seek time</b>: 3 ms to 12 ms; 9 ms is common for desktop drives.</li>
      <li><b>Rotation latency</b>: depends on the spindle speed (table).</li>
    </ul>
  </div>
  <div>
    <table class="t">
      <tr><th>Spindle [rpm]</th><th>Average latency [ms]</th></tr>
      <tr><td>4200</td><td>7.14</td></tr>
      <tr><td>5400</td><td>5.56</td></tr>
      <tr><td>7200</td><td>4.17</td></tr>
      <tr><td>10000</td><td>3</td></tr>
      <tr><td>15000</td><td>2</td></tr>
    </table>
  </div>
</div>
<p><b>Rotational latency from RPM.</b> On average the wanted sector is half a turn away (sometimes it is right under the head, sometimes almost a full turn away). One turn takes 60 000 / RPM milliseconds, so:</p>
<div class="formula">Average latency = ½ turn = 0.5 × 60 000 / RPM [ms] → 7200 RPM: 0.5 × 60 000 / 7200 = 4.17 ms</div>
<p>That is how the table on the right is built: the faster the spindle, the shorter the latency (15000 RPM → 2 ms).</p>
<p><b>Access time.</b> Adding the two averages:</p>
<div class="formula">Average access time = average seek time + average latency<br>fastest disk: 3 ms + 2 ms = <b>5 ms</b> | slow disk: 9 ms + 5.56 ms = <b>14.56 ms</b></div>
<p><b>Complete I/O time.</b> A real request must also transfer the data and pay the processing time of the controller itself, the <b>controller overhead</b>:</p>
<div class="formula">Average I/O time = average access time + (amount to transfer / transfer rate) + controller overhead</div>
<p><b>Example from the slides</b>: the average I/O time to transfer a <b>4 KB</b> block on a <b>7200 RPM</b> disk with a <b>5 ms</b> average seek time, a <b>1 Gb/s</b> transfer rate and a <b>0.1 ms</b> controller overhead:</p>
<div class="formula">= average seek + average latency + controller overhead + transfer time = 5 ms + 4.17 ms + 0.1 ms + transfer time<br>
transfer time = 4 KB / (1 Gb/s) × 8 Gb/GB × 1 GB / 1024² KB = 32 / 1024² s ≈ <b>0.03 ms</b><br>
Average I/O time = 9.27 ms + 0.03 ms = <b>9.3 ms</b></div>
<div class="callout note"><b>Units.</b> The transfer rate is in giga<b>bits</b> per second, while the block is in kilo<b>bytes</b>, so multiply by 8: 4 KB = 32 Kb. The slide also uses <b>binary units</b>: 1 Gb = 1024² Kb = 1 048 576 Kb. So 32 Kb / (1 048 576 Kb/s) ≈ 3.05 × 10⁻⁵ s ≈ 0.03 ms.</div>
<p>The conclusion matters more than the arithmetic: of the 9.3 ms, the actual data transfer takes 0.03 ms — about 0.3%. For an HDD the <b>mechanics dominate</b>; moving 4 KB or 40 KB costs almost the same. Try it in the calculator: change the RPM or the seek time and watch the total move; change the block size and it barely moves.</p>
<div data-viz="0"></div>`,
      viz: [{ name: 'hddCalc', caption: 'Slide example: 7200 RPM, seek 5 ms, 1 Gb/s, 4 KB, overhead 0.1 ms → 9.3 ms.', props: { rpm: 7200, seek: 5, rateGbps: 1, kb: 4, overheadMs: 0.1 } }],
      takeaway: 'Average latency = half a rotation = 0.5 × 60 000 / RPM ms. Average I/O time = seek + latency + transfer + controller overhead; for a 4 KB block on a 7200 RPM disk: 5 + 4.17 + 0.03 + 0.1 ≈ 9.3 ms. Seek and rotation dominate; the transfer is negligible.',
      exam: 'Compute the average latency from the RPM and the average I/O time with the formula (example: 9.3 ms). Watch bits vs bytes and binary units.'
    },
    {
      id: 'nvm',
      h: 'Nonvolatile memory devices and SSDs',
      why: 'remove the moving parts',
      lead: 'If the mechanical seek and rotation are the problem, why not get rid of the mechanics? Electronic nonvolatile memory does exactly that.',
      html: `
<p><b>Nonvolatile memory (NVM)</b> stores data electronically and keeps them without power. When NVM is built to work like a disk drive (same interface, same use), it is called a <b>Solid-State Disk (SSD)</b>. Other forms of NVM include USB drives (thumb drive, flash drive), DRAM disk replacements, memory surface-mounted on motherboards, and the main storage of devices such as smartphones.</p>
<p>Compared with an HDD, an SSD has clear advantages and some costs:</p>
<div class="cols">
  <div class="pros"><b>+</b><ul><li>can be <b>more reliable</b> than HDDs</li><li><b>much faster</b></li><li><b>no moving parts</b>, so <b>no seek time and no rotational latency</b></li></ul></div>
  <div class="cons"><b>−</b><ul><li><b>more expensive per MB</b></li><li>may have a <b>shorter life span</b> — needs careful management</li><li><b>less capacity</b></li><li>buses can be too slow → connect it directly to <b>PCI</b>, for example</li></ul></div>
</div>
<p>The most important line is the third "+": with no moving parts, all the delays computed in the previous section disappear. In fact SSDs are so fast that the older storage buses become the bottleneck, which is why some SSDs are connected directly to the PCI bus.</p>
<p><b>How NAND flash keeps data.</b> In an SSD, data are saved to a pool of <b>NAND flash</b>. NAND is made of <b>floating gate transistors</b>, which trap an electric charge. Unlike the transistor designs used in RAM, which must be <b>refreshed</b> many times per second, NAND flash is designed to keep its charge state even when it is not powered. This is what makes NAND a type of <b>non-volatile memory</b>.</p>
<p>But the same physics that lets NAND keep its charge also makes writing awkward. The next section shows the new problems that SSDs bring.</p>`,
      takeaway: 'An SSD is NVM (NAND flash) that works like a disk: no moving parts → no seek time and no rotational latency, much faster, possibly more reliable; but more expensive per MB, smaller, and with a shorter life span. NAND floating-gate transistors keep their charge without power.',
      exam: 'Pros and cons of SSDs; why an SSD has no seek time; why NAND is non-volatile.'
    },
    {
      id: 'nand',
      h: 'NAND flash: limits and controller algorithms',
      why: 'the new problems SSDs bring',
      lead: 'SSDs remove the mechanical delays but bring their own rules: data cannot be overwritten in place, and every cell wears out. The SSD controller hides these rules with a few algorithms.',
      html: `
<p>NAND flash has characteristics that present <b>challenges</b>:</p>
<ul>
  <li>Data are grouped in <b>pages</b> (the unit of reading and writing).</li>
  <li>Write operations <b>cannot overwrite in place</b>: a page must first be <b>erased</b>, and erases happen only in larger <b>blocks</b> of many pages.</li>
  <li>A cell can be erased only a limited number of times before it is worn out — about <b>100 000</b>.</li>
  <li>So the life span is measured in <b>drive writes per day (DWPD)</b>: how many times per day the whole capacity can be written during the warranty period. A 1 TB NAND drive rated 5 DWPD is expected to accept <b>5 TB of writes per day</b> within the warranty period without failing.</li>
</ul>
<p>Think about what "no overwrite in place" means for a simple update of one page. The controller cannot rewrite the page where it is; it writes the new version into a free page somewhere else and marks the old one as <b>invalid</b>. After a while, blocks contain a mix of valid and invalid pages, like the block in the slide figure:</p>
<table class="t">
  <tr><td>valid page</td><td>valid page</td><td><b>invalid page</b></td><td><b>invalid page</b></td></tr>
  <tr><td><b>invalid page</b></td><td>valid page</td><td><b>invalid page</b></td><td>valid page</td></tr>
</table>
<p>This creates four jobs for the <b>NAND flash controller algorithms</b>. Each one answers a problem created by the rules above:</p>
<table class="t">
  <tr><th>Mechanism</th><th>Problem → solution</th></tr>
  <tr><td><b>Flash Translation Layer (FTL)</b></td><td>the data of a logical block keep moving to new pages → the controller keeps an <b>FTL table</b> that tracks which <b>logical blocks</b> are valid and where they physically are</td></tr>
  <tr><td><b>Garbage collection (GC)</b></td><td>invalid pages waste space → GC <b>frees the invalid page space</b>: it copies the valid pages of a block elsewhere, then erases the whole block</td></tr>
  <tr><td><b>Overprovisioning</b></td><td>GC needs free pages to copy into → the controller reserves extra capacity (not visible to the user) as <b>working space for GC</b></td></tr>
  <tr><td><b>Wear leveling</b></td><td>each cell has a limited lifespan → <b>write equally to all cells</b>, so that no part wears out early</td></tr>
</table>
<p>So inside, an SSD is not just "a faster disk": it is a small computer that keeps relocating data. The OS sees simple numbered blocks; the controller translates them to physical pages.</p>`,
      takeaway: 'NAND flash: read/write by page, erase by block, no overwrite in place, ~100 000 erases per cell, life span measured in DWPD. The controller uses the FTL (logical → physical map), garbage collection (reclaims invalid pages), overprovisioning (spare space for GC) and wear leveling (spreads the writes).',
      exam: 'Why NAND cannot overwrite in place; the roles of FTL, GC, overprovisioning and wear leveling; DWPD calculation.'
    },
    {
      id: 'fcfs',
      h: 'Disk scheduling and FCFS',
      why: 'order the requests to cut seeks',
      lead: 'Back to HDDs: seek time dominates every request. When many requests are waiting, the order in which we serve them decides how far the arm travels in total — the same kind of choice as in CPU scheduling.',
      html: `
<p>Many processes issue disk requests at the same time, so requests wait in a queue. Drive controllers have small buffers and can manage a <b>queue of I/O requests</b> (of varying "depth"). <b>Disk-scheduling algorithms</b> decide the order in which the waiting requests are served. Their goal is to reduce the seek time, which we measure as the <b>total head movement</b>: the number of cylinders the head crosses.</p>
<p>These algorithms are about moving a mechanical arm, so they matter for HDDs; an SSD has no arm, and for it the order of requests matters much less.</p>
<p>All examples in the slides use the same request queue, so the algorithms can be compared directly:</p>
<div class="formula">Cylinders 0–199; queue = 98, 183, 37, 122, 14, 124, 65, 67; head starts at 53</div>
<p><b>First Come First Served (FCFS)</b> is the simplest rule, the same as in CPU scheduling:</p>
<ul>
  <li>it handles the I/O requests <b>sequentially</b>, in arrival order;</li>
  <li>it is <b>fair</b> to all processes — nobody is overtaken;</li>
  <li>with many processes/requests its performance approaches <b>random scheduling</b>, because the arrival order has nothing to do with the position on the disk;</li>
  <li>it suffers from a global <b>zigzag effect</b>: the arm swings back and forth across the disk.</li>
</ul>
<p>Follow the arm. Each number is the distance between two consecutive cylinders:</p>
<div class="formula">53 → 98 → 183 → 37 → 122 → 14 → 124 → 65 → 67<br>45 + 85 + 146 + 85 + 108 + 110 + 59 + 2 = <b>640 cylinders</b></div>
<div data-viz="0"></div>
<p>Look at the part 183 → 37 → 122 → 14 → 124: the arm crosses the disk four times. Serving 122 and 124 together, or 37 and 14 together, would save a lot of movement. The next algorithms do exactly that.</p>`,
      viz: [{ name: 'diskSched', caption: 'FCFS: total head movement = 640.', props: { queue: [98, 183, 37, 122, 14, 124, 65, 67], head: 53, max: 199, algo: 'FCFS', dir: 'down' } }],
      takeaway: 'Disk scheduling orders the waiting requests to reduce the total head movement. FCFS serves them in arrival order: fair, but it zigzags across the disk (640 cylinders in the slide example).',
      exam: 'Compute the total head movement for FCFS (640).'
    },
    {
      id: 'sstf',
      h: 'Shortest Seek Time First (SSTF)',
      why: 'always go to the nearest request',
      lead: 'FCFS ignores where the requests are. The obvious improvement is greedy: from where the head is now, go to the closest request.',
      html: `
<p><b>SSTF</b> selects the request with the <b>minimum seek time</b> from the current head position. Because seek time grows with distance, it is also called <b>Shortest Seek Distance First (SSDF)</b> — distances are easier to compute than times.</p>
<p>On the slide example: from 53 the nearest request is 65 (distance 12), then 67 (2). From 67 the nearest is 37 (30), slightly closer than 98 (31). Then 14, and only then does the head travel up to 98, 122, 124 and 183.</p>
<div class="formula">53 → 65 → 67 → 37 → 14 → 98 → 122 → 124 → 183<br>12 + 2 + 30 + 23 + 84 + 24 + 2 + 59 = <b>236 cylinders</b></div>
<div data-viz="0"></div>
<p>236 cylinders instead of 640 — a big improvement. But SSTF has two weaknesses:</p>
<ul>
  <li>It is <b>biased in favor of the middle cylinders</b>: the middle of the disk is close to everything, so the head tends to stay there.</li>
  <li>SSTF is a form of <b>SJF</b> scheduling (the "shortest job" is the shortest seek), so, like SJF, it may cause <b>starvation</b> of some requests: if new requests keep arriving near the head, a request at the far edge may wait forever.</li>
</ul>
<p>SSTF is also not optimal. Going 53 → 37 → 14 first and then up to 183 costs only 39 + 169 = 208 cylinders. A greedy choice at each step is not always the best choice overall — which leads to the elevator algorithms.</p>`,
      viz: [{ name: 'diskSched', caption: 'SSTF: total head movement = 236.', props: { queue: [98, 183, 37, 122, 14, 124, 65, 67], head: 53, max: 199, algo: 'SSTF', dir: 'down' } }],
      takeaway: 'SSTF = always go to the closest request (a form of SJF). Much less movement than FCFS (236 vs 640), but biased toward the middle cylinders, it can starve far requests, and it is not optimal.',
      exam: 'Service order and total for SSTF (236); why starvation is possible.'
    },
    {
      id: 'scan-look',
      h: 'Elevator algorithms: SCAN and LOOK',
      why: 'sweep the disk like an elevator',
      lead: 'Starvation in SSTF comes from the head changing direction whenever it likes. An elevator does not do that: it keeps going in one direction until the end, then turns around. That idea gives a whole family of algorithms.',
      html: `
<p>The <b>elevator algorithms</b> are based on the common elevator principle. They differ in two choices, which give <b>four combinations</b>:</p>
<ul>
  <li>serve requests in <b>both directions</b>, or in <b>only one direction</b>;</li>
  <li>go until the <b>last cylinder</b> of the disk, or only until the <b>last I/O request</b>.</li>
</ul>
<p>The table names the four combinations. It is the easiest way to remember the whole family:</p>
<table class="t">
  <tr><th>Direction ↓ / Go until →</th><th>last cylinder</th><th>last request</th></tr>
  <tr><td><b>Service both directions</b></td><td><b>SCAN</b></td><td><b>LOOK</b></td></tr>
  <tr><td><b>Service in only one direction</b></td><td><b>C-SCAN</b></td><td><b>C-LOOK</b></td></tr>
</table>
<p><b>SCAN.</b> The disk arm starts at one end of the disk and moves toward the other end, servicing requests, until it gets to the other end of the disk; there the head movement is reversed and servicing continues. It moves in both directions until both ends. Because the head regularly reaches the edges, SCAN is <b>more fair to the extreme cylinder requests</b> than SSTF.</p>
<div class="formula">SCAN (head moving toward 0): 53 → 37 → 14 → <b>0</b> → 65 → 67 → 98 → 122 → 124 → 183<br>(53 − 0) + (183 − 0) = 53 + 183 = <b>236 cylinders</b></div>
<div class="callout warn"><b>Slide error.</b> The "Scan Example" slide says <b>208</b>, but in its own figure the head goes down to cylinder <b>0</b> before turning, which gives <b>236</b>. The number 208 is the result of <b>LOOK</b> (turning at 14, not at 0). In an exam, compute the movement from the picture instead of recalling the number.</div>
<div data-viz="0"></div>
<p><b>LOOK.</b> SCAN wastes the trip from 14 down to 0: there is no request there. LOOK fixes this. The disk arm starts at the first I/O request and moves toward the last I/O request on the other end, servicing requests; at the extreme <i>request</i> (not the edge of the disk) the movement is reversed. It moves in both directions until both last I/O requests and is <b>more inclined to serve the middle cylinder requests</b>.</p>
<div class="formula">LOOK (head moving toward 0): 53 → 37 → 14 → 65 → 67 → 98 → 122 → 124 → 183<br>(53 − 14) + (183 − 14) = 39 + 169 = <b>208 cylinders</b></div>
<div data-viz="1"></div>
<p>This is where the 208 of the slide comes from, and it is also the "better than SSTF" path we found in the previous section.</p>`,
      viz: [
        { name: 'diskSched', caption: 'SCAN toward 0: total = 236 (the slide says 208 by mistake).', props: { queue: [98, 183, 37, 122, 14, 124, 65, 67], head: 53, max: 199, algo: 'SCAN', dir: 'down' } },
        { name: 'diskSched', caption: 'LOOK toward 0: total = 208.', props: { queue: [98, 183, 37, 122, 14, 124, 65, 67], head: 53, max: 199, algo: 'LOOK', dir: 'down' } }
      ],
      takeaway: 'Elevator family = {both directions, one direction} × {to the last cylinder, to the last request}: SCAN, LOOK, C-SCAN, C-LOOK. SCAN goes to the edge of the disk (236 toward 0 in the example — the 208 on the slide is wrong); LOOK turns at the last request (208).',
      exam: 'The 2×2 table of elevator algorithms; totals for SCAN (236 toward 0) and LOOK (208).'
    },
    {
      id: 'cscan-clook',
      h: 'C-SCAN and C-LOOK',
      why: 'one direction for uniform waiting',
      lead: 'SCAN and LOOK serve requests in both directions, so cylinders near the turning points are treated differently from the others. The circular versions serve in one direction only, so every cylinder is treated the same way.',
      html: `
<p><b>C-SCAN</b> (circular SCAN): the head moves from one end of the disk to the other, servicing requests as it goes. When it reaches the other end, it <b>immediately returns to the beginning of the disk, without servicing any requests on the return trip</b>.</p>
<ul>
  <li>It treats the cylinders as a <b>circular list</b> that wraps around from the last cylinder to the first one.</li>
  <li>It provides a <b>more uniform wait time</b> than SCAN: it treats all cylinders in the same manner.</li>
</ul>
<p>Why is SCAN less uniform? When SCAN turns around at an edge, it first passes again over the cylinders it has just served (few new requests there), while the requests at the far edge have been waiting the longest. C-SCAN always sweeps in the same direction, so every cylinder waits about one full sweep.</p>
<div class="formula">C-SCAN (moving up, as on the slide): 53 → 65 → 67 → 98 → 122 → 124 → 183 → <b>199</b> ⇒ <b>0</b> → 14 → 37<br>
146 (53 → 199) + 199 (return 199 → 0) + 37 (0 → 37) = <b>382</b> counting the return; <b>183</b> without it</div>
<div data-viz="0"></div>
<p><b>C-LOOK</b> is the LOOK version of C-SCAN: the arm goes only as far as the <b>last request</b> in its direction, then jumps back immediately to the farthest request at the other end, without first going all the way to the edge of the disk.</p>
<div class="formula">C-LOOK (moving up): 53 → 65 → 67 → 98 → 122 → 124 → 183 ⇒ 14 → 37<br>
130 (53 → 183) + 169 (jump 183 → 14) + 23 (14 → 37) = <b>322</b> counting the jump; <b>153</b> without it</div>
<div data-viz="1"></div>
<div class="callout key">The general rule from the slides: <b>circular versions are more fair</b> but pay with a <b>larger total seek time</b>; <b>SCAN versions</b> have a larger total seek time than the corresponding <b>LOOK versions</b>.</div>
<div class="callout warn">The return trip (199 → 0 in C-SCAN, 183 → 14 in C-LOOK) is a fast move with no service. Some books count it in the total head movement, some do not. In an exam, say which convention you use, or give both numbers.</div>`,
      viz: [
        { name: 'diskSched', caption: 'C-SCAN moving up: 382 with the return 199 → 0 (183 without it).', props: { queue: [98, 183, 37, 122, 14, 124, 65, 67], head: 53, max: 199, algo: 'C-SCAN', dir: 'up' } },
        { name: 'diskSched', caption: 'C-LOOK moving up: 322 with the jump 183 → 14 (153 without it).', props: { queue: [98, 183, 37, 122, 14, 124, 65, 67], head: 53, max: 199, algo: 'C-LOOK', dir: 'up' } }
      ],
      takeaway: 'C-SCAN serves in one direction up to the edge, then returns to the start without serving (a circular list) → more uniform wait time. C-LOOK does the same but only up to the last request. Example totals: C-SCAN 382 with the return (183 without), C-LOOK 322 with the jump (153 without).',
      exam: 'Difference between C-SCAN and SCAN (return trip without service, uniform wait time); compute the total with and without the return.'
    },
    {
      id: 'select',
      h: 'Selecting a disk-scheduling algorithm',
      why: 'which one to use in practice',
      lead: 'We now have six algorithms and one example. Which one should an OS actually use? The answer depends on the load.',
      html: `
<p>First, the whole comparison on the slide example (head at 53). Read the totals together with the last column — the smallest number does not automatically mean the best algorithm:</p>
<table class="t">
  <tr><th>Algorithm</th><th>Total (head 53)</th><th>Strength</th><th>Weakness</th></tr>
  <tr><td>FCFS</td><td>640</td><td>fair, simple</td><td>zigzag effect, long seeks</td></tr>
  <tr><td>SSTF</td><td>236</td><td>short seeks</td><td>favors the middle, may starve requests, not optimal</td></tr>
  <tr><td>SCAN (toward 0)</td><td>236</td><td>no starvation, fair to the edges</td><td>travels to the edge even with no request there</td></tr>
  <tr><td>LOOK (toward 0)</td><td>208</td><td>turns at the last request</td><td>more inclined to serve the middle</td></tr>
  <tr><td>C-SCAN (up)</td><td>382 (183 without the return)</td><td>most uniform wait time</td><td>long return trip</td></tr>
  <tr><td>C-LOOK (up)</td><td>322 (153 without the jump)</td><td>uniform wait time, no trip to the edge</td><td>the jump back still costs time</td></tr>
</table>
<p>The slides draw these conclusions:</p>
<ul>
  <li>The disk-scheduling algorithm should be written as a <b>separate module of the OS</b>, so that it can be replaced with a different algorithm if necessary.</li>
  <li><b>SSTF</b> is common and has a natural appeal: it is simple and clearly better than FCFS.</li>
  <li><b>SCAN and C-SCAN</b> perform better for systems that place a <b>heavy load</b> on the disk: with many requests in the queue, the sweep serves them in order and no request starves.</li>
  <li>Performance depends on the <b>number and types of requests</b>: with only one request in the queue, all algorithms behave the same.</li>
  <li>Requests for disk service can be influenced by the <b>file-allocation method</b>: if the blocks of a file are stored next to each other, reading it causes little head movement, whatever the algorithm.</li>
</ul>`,
      takeaway: 'Make the disk scheduler a replaceable OS module. SSTF is common and natural; SCAN and C-SCAN are better under heavy load (no starvation). The results depend on the number and type of requests and on how files are allocated on the disk.'
    },
    {
      id: 'attachment',
      h: 'Storage attachment: host-attached, NAS, cloud',
      why: 'how computers reach storage',
      lead: 'So far a disk was simply "inside the computer". In practice storage can also sit on the network or in a remote data center. How a computer reaches its storage changes speed, sharing and management.',
      html: `
<p>Computers access storage in <b>three ways</b>: <b>host-attached</b>, <b>network-attached</b> and <b>cloud</b>. They go from the closest to the farthest.</p>
<p><b>1. Host-attached storage</b> is accessed through local I/O ports, using one of several technologies:</p>
<ul>
  <li>to attach many devices, computers use <b>storage buses</b> such as <b>SATA, USB, FireWire, Thunderbolt</b>;</li>
  <li>high-end systems (e.g. servers) use <b>Fibre Channel (FC)</b>: a high-speed serial architecture using fiber or copper cables. Multiple hosts and storage devices can connect to the same <b>FC fabric</b> (the network of FC links and switches).</li>
</ul>
<p><b>2. Network-Attached Storage (NAS)</b> is storage made available over a <b>network</b> rather than over a local connection (such as a bus):</p>
<ul>
  <li>the host <b>remotely attaches file systems</b>: NAS is <b>file-system based</b> — the client asks for files, not for disk blocks;</li>
  <li>it is implemented via <b>remote procedure calls (RPCs)</b> between host and storage, typically over <b>TCP or UDP</b> on an IP network;</li>
  <li><b>lock functions</b> limit the accesses, so that two clients do not modify the same file at the same time;</li>
  <li>it needs a <b>Network Operating System</b>; common protocols are <b>NFS</b> (Network File System, Unix) and <b>SMB</b> (Server Message Block, Windows).</li>
</ul>
<p>The slides list its pros and cons:</p>
<div class="cols">
  <div class="pros"><b>+</b><ul><li>shared mass memory</li><li>uniform management of data</li></ul></div>
  <div class="cons"><b>−</b><ul><li>low performance</li><li>no transparency for end-users</li></ul></div>
</div>
<p>Both sides come from the network: every file access becomes a network request, so NAS is slower than a local disk, and the storage is visible to users as network storage rather than as their own disk.</p>
<p><b>3. Cloud storage</b> is the farthest option:</p>
<ul>
  <li>similar to NAS, it provides access to storage across a network; unlike NAS, it is accessed over the <b>Internet or a WAN</b> (wide area network) to a remote <b>data center</b>, and it is <b>transparent</b> for end-users;</li>
  <li>NAS is presented as just another file system, while cloud storage is <b>API based</b>: programs use the APIs of the provider to access it;</li>
  <li>examples: <b>Dropbox, Amazon S3, Microsoft OneDrive, Apple iCloud</b>;</li>
  <li>APIs are used because of <b>latency and failure scenarios</b> over a WAN — NAS protocols would not work well there, as they expect a fast and reliable local network.</li>
</ul>
<p>The common thread: the farther away the storage, the more the interface moves from <i>blocks on a bus</i> to <i>files over a network</i> to <i>API calls over the Internet</i>.</p>`,
      takeaway: 'Three ways to reach storage: host-attached (local ports: SATA, USB, FireWire, Thunderbolt; Fibre Channel for servers), NAS (file systems over the network via RPCs on TCP/UDP; NFS, SMB), cloud (API-based access over the Internet / WAN; Dropbox, S3, OneDrive, iCloud).',
      exam: 'The three ways; NAS = RPC over TCP/UDP, NFS/SMB, file-based; cloud = API over a WAN.'
    },
    {
      id: 'san',
      h: 'Storage Area Network (SAN) and storage arrays',
      why: 'shared storage for big systems',
      lead: 'NAS shares files over the ordinary LAN, which costs network bandwidth and speed. Large installations instead build a separate, fast network only for storage: a SAN.',
      html: `
<p>A <b>Storage Area Network (SAN)</b> is common in large storage environments. Its idea: <b>multiple hosts attached to multiple storage arrays</b> through a private storage network — a flexible many-to-many connection.</p>
<ul>
  <li>A SAN is one or more <b>storage arrays</b> connected to one or more <b>Fibre Channel switches</b> or an <b>InfiniBand (IB)</b> network.</li>
  <li>Hosts also attach to the switches.</li>
  <li>It is easy to add or remove storage, to add a new host and to allocate storage to it — the configuration changes, not the cables.</li>
</ul>
<p>In the diagram, notice the two separate networks: storage arrays and the tape library talk to the servers through the <b>SAN</b>, while clients reach the servers through the ordinary <b>LAN/WAN</b>. Storage traffic never loads the client network.</p>
<div data-viz="0"></div>
<p><b>Storage array.</b> The boxes on the left of the diagram are storage arrays: dedicated storage devices with their own intelligence.</p>
<ul>
  <li>You can attach just disks, or arrays of disks; it avoids the NAS drawback of using network bandwidth.</li>
  <li>A storage array has its own <b>controller(s)</b> and provides features to the attached hosts with high flexibility: <b>ports</b> to connect hosts to the array, <b>memory</b>, controlling software (sometimes <b>NVRAM</b>, etc.).</li>
  <li><b>Shared storage</b> → more efficiency: space is pooled among the hosts instead of each host having its own half-empty disk.</li>
  <li>It offers features found in some file systems: <b>snapshots</b> (a view of the data at a point in time), <b>clones</b> (writable copies), <b>thin provisioning</b> (space is given to a host only when it actually writes data), <b>replication</b> (automatic copy to another site), <b>deduplication</b> (identical data stored only once), etc.</li>
  <li>It can combine <b>SSD + HDD</b>.</li>
</ul>
<p><b>NAS vs SAN.</b> The slide compares the two network approaches on seven points. The two most important rows are <i>Fabric</i> and <i>Data processing</i>: NAS sends <b>files</b> over the ordinary <b>TCP/IP</b> network, SAN sends <b>blocks</b> over a dedicated <b>Fibre Channel</b> network.</p>
<table class="t">
  <tr><th></th><th>NAS</th><th>SAN</th></tr>
  <tr><td>Fabric</td><td>uses TCP/IP networks, most commonly Ethernet</td><td>runs on high-speed Fibre Channel networks</td></tr>
  <tr><td>Data processing</td><td>processes <b>file-based</b> data</td><td>processes <b>block</b> data</td></tr>
  <tr><td>Protocols</td><td>connects directly to an Ethernet network; can use several protocols to connect with servers, including NFS, SMB/CIFS and HTTP</td><td>uses the <b>SCSI</b> protocol to communicate with servers</td></tr>
  <tr><td>Performance</td><td>generally lower throughput and higher latency, because of its slower file-system layer</td><td>a higher performer for environments that need high-speed traffic</td></tr>
  <tr><td>Scalability</td><td>entry-level NAS devices are not highly scalable; high-end NAS systems scale to petabytes using clusters or scale-out nodes</td><td>scalability is a major driver: admins can scale performance and capacity in scale-up or scale-out configurations</td></tr>
  <tr><td>Ease of management</td><td>easier: the device plugs into the LAN and offers a simplified management interface</td><td>requires more administration time than NAS</td></tr>
  <tr><td>Price</td><td>in general less expensive to purchase and maintain, although a high-end NAS costs more than an entry-level SAN</td><td>more complex to manage, with FC SANs at the top of the complexity heap</td></tr>
</table>
<p>In short: NAS is simpler and cheaper, good for sharing files; SAN is faster and more scalable, but needs more administration.</p>`,
      viz: [{ name: 'graph', caption: 'Storage Area Network: storage lives in the SAN, clients are on the LAN/WAN.', props: {
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
      takeaway: 'SAN = a dedicated network (Fibre Channel switches or InfiniBand) that connects many hosts to many storage arrays; block data, fast, scalable, more administration. Storage arrays have controllers, ports, memory and features (snapshots, clones, thin provisioning, replication, deduplication). NAS = file-based over TCP/IP, simpler and cheaper.',
      exam: 'NAS vs SAN: file vs block, Ethernet / TCP-IP vs Fibre Channel, NFS/SMB vs SCSI; the features of a storage array.'
    },
    {
      id: 'raid',
      h: 'RAID: why several disks — mirroring and striping',
      why: 'speed and safety from many disks',
      lead: 'Disks fail (remember the head crash), and a single disk has limited speed. Using several disks together can fix both problems — that is RAID.',
      html: `
<p><b>RAID</b> means <b>redundant array of independent (inexpensive) disks</b>: multiple disk drives provide <b>reliability via redundancy</b>. <b>Redundancy</b> is the storage of extra data, not needed in normal operation, that reduces the loss of information when something fails.</p>
<p>Three time measures describe reliability:</p>
<ul>
  <li><b>Mean time to failure (MTTF)</b> — the average time until a failure. Redundancy <b>increases</b> the mean time to failure of the stored data: they are lost only if a disk <i>and</i> its redundant copy fail.</li>
  <li><b>Mean time to repair (MTTR)</b> — the exposure time: how long it takes to replace a failed disk and restore its data. During this window another failure could cause data loss.</li>
  <li><b>Mean time to data loss</b> — based on the two factors above: a long MTTF and a short MTTR give a very long time to data loss.</li>
</ul>
<p>RAID is built from two basic techniques. They solve different problems, so look at them side by side:</p>
<div class="cols">
<div>
<p><b>Mirroring</b> (Copy A = Copy B):</p>
<ul>
  <li>Write: write to <b>both</b> mirrors. Read: read from <b>either</b> mirror.</li>
  <li>The <b>cost per byte doubles</b>.</li>
  <li>Writes are <b>a little slower</b> (both copies must be written); reads may be <b>2× faster</b> (two disks can serve two reads at once).</li>
  <li>Reliability is <b>vastly increased</b>.</li>
  <li>When a disk breaks: identify it to the system administrator (beep, blink a light) → the administrator provides a blank disk → the contents are copied from the surviving mirror.</li>
</ul>
</div>
<div>
<p><b>Disk striping</b>:</p>
<ul>
  <li>A single file system is striped in pieces across multiple disks; when data are written or read back, the drives work <b>in tandem</b> (in parallel), significantly decreasing the transfer time.</li>
  <li>The <b>stripe size</b> can vary: bit, byte, sector.</li>
  <li>Each device is involved in every read and write.</li>
  <li><b>Latency</b> (time to get the first byte): <b>unchanged</b>.</li>
  <li><b>Throughput</b> (bytes per second): <b>linear increase</b> with the number of disks → useful for high data transfer.</li>
</ul>
</div>
</div>
<p>The slide example stripes the word "Caffeine" over 4 disks, one letter at a time (byte striping):</p>
<div class="formula">Disk1 = C, e | Disk2 = a, i | Disk3 = f, n | Disk4 = f, e</div>
<p>Reading the word takes two steps instead of eight, because the four disks deliver one letter each in parallel. But the first letter does not arrive any sooner — that is why latency is unchanged while throughput grows.</p>
<p>The comparison in one table:</p>
<table class="t">
  <tr><th>Mirroring</th><th>Striping</th></tr>
  <tr><td>improves <b>reliability</b>, but with high costs</td><td>improves the <b>efficiency of data transfer</b>, but does <b>not provide reliability</b></td></tr>
</table>
<div class="callout key">Marrying mirroring and striping increases both the availability of the data and the performance, at the cost of doubling the disk drives. Can we get reliability more cheaply than by copying everything? Yes — with parity, explained next.</div>`,
      takeaway: 'RAID uses redundancy to raise the mean time to failure; the mean time to repair is the dangerous window after a failure. Mirroring = two copies: reliable, faster reads, slightly slower writes, cost ×2. Striping = data spread over N disks: throughput ×N, same latency, no reliability.',
      exam: 'Mirroring: cost ×2, faster reads, slightly slower writes; striping: same latency, throughput grows linearly; MTTF and MTTR.'
    },
    {
      id: 'ecc',
      h: 'Error detection and correction: parity and ECC',
      why: 'cheap redundancy with XOR',
      lead: 'Mirroring protects data by storing everything twice. Error-detecting and error-correcting codes protect data by adding only a few extra bits — the idea behind the parity RAID levels.',
      html: `
<p>Error detection and correction is a fundamental aspect of many parts of computing: <b>memory, networking, storage</b>.</p>
<ul>
  <li><b>Error detection</b> determines whether a problem has occurred, for example <b>bit flipping</b> (a 0 that became a 1 or the opposite). If an error is detected, the operation can be halted.</li>
  <li>Detection is frequently done with a <b>parity bit</b>. Every method involves adding extra bits (<b>redundant bits</b>) to the data unit.</li>
  <li>The most common methods are <b>parity checking</b> and the <b>Cyclic Redundancy Check (CRC)</b>.</li>
</ul>
<p><b>Parity.</b> Parity is the XOR "sum" of the bits. XOR (⊕) gives 1 when an odd number of its inputs are 1: 0 ⊕ 0 = 0, 0 ⊕ 1 = 1, 1 ⊕ 1 = 0. The sender provides the code word followed by its parity bit:</p>
<div class="formula">0 ⊕ 1 ⊕ 1 = 0 → correct: (011, 0) | incorrect: (011, 1)</div>
<p>When the receiver gets (011, 1), it recomputes 0 ⊕ 1 ⊕ 1 = 0 ≠ 1: something is wrong with this picture — but what? Parity has two limits:</p>
<ul>
  <li>it provides <b>single error detection</b> only: the receiver knows <i>that</i> a bit is wrong, not <i>which</i> bit;</li>
  <li>it <b>cannot detect multiple-bit errors</b>: two flipped bits cancel each other, and the parity looks correct.</li>
</ul>
<p><b>ECC.</b> An <b>error correcting code (ECC)</b> is a "super parity": the code word is sent with <b>several</b> parity-like bits, computed from the data by more complex ("mysterious") math — for example a <b>Hamming code</b> or a <b>Reed-Solomon code</b>. An ECC can <b>detect N</b> multiple-bit errors and <b>correct M &lt; N</b> of them.</p>
<p><b>Parity revisited: erasure correction.</b> Parity cannot correct an error whose position is unknown. But if we <i>know</i> which bit is missing, parity is enough to rebuild it. This is <b>single erasure correction</b>:</p>
<ul>
  <li>an <b>erasure channel</b> "knows when it does not know something": each bit is 0, 1 or "don't know";</li>
  <li>the sender provides the code word and the parity bit: (0 1 1, 0); the channel delivers the damaged message (0 ? 1, 0);</li>
  <li>? = 0 ⊕ 1 ⊕ 0 = <b>1</b> — the XOR of all the other bits, parity included.</li>
</ul>
<div class="callout key">This is exactly how parity RAID works. When a disk fails, we know <b>which</b> disk is gone — it is an erasure. Its content is the XOR of all the other disks, parity included.</div>
<p><b>ECC example (three bytes).</b> The parity byte p is the bit-by-bit XOR of the data bytes. If byte a) is lost, the XOR of p with the surviving bytes gives a) back:</p>
<div class="cols">
<pre class="code" data-lang="text">a) 01100011  XOR
b) 10101010  XOR
c) 11001010  =
p) 00000011        /* parity */</pre>
<pre class="code" data-lang="text">/* if a) is lost: */
p) 00000011  XOR
b) 10101010  XOR
c) 11001010  =
a) 01100011        /* recovered */</pre>
</div>
<p>So one extra disk of parity can protect any number of data disks against the loss of one disk. The next section shows how the RAID levels place this parity.</p>`,
      takeaway: 'Parity = XOR of the bits: it detects a single error (but not which bit, and not multiple errors) and corrects a single erasure (a missing bit or disk whose position is known). ECC (Hamming, Reed-Solomon) uses several check bits: it detects N errors and corrects M &lt; N.',
      exam: 'Compute a parity with XOR; rebuild a lost bit or byte from the parity; what parity cannot do (multi-bit errors, locating the error).'
    },
    {
      id: 'raid-levels',
      h: 'RAID levels 0–6, 0+1 and 1+0',
      why: 'combining the tools into recipes',
      lead: 'Mirroring, striping and parity are the three tools. A RAID level is a fixed recipe that combines them; each recipe trades capacity, speed and the number of failures it survives.',
      html: `
<p>Disk striping uses a group of disks as <b>one storage unit</b>. RAID schemes improve the performance and the reliability of the storage system by storing redundant data, and they are arranged into <b>levels</b> (the slides speak of six levels and show RAID 0 to 5; RAID 6 and the combinations 0+1 / 1+0 are also named). The slide summary:</p>
<ul>
  <li><b>Mirroring</b> or shadowing (<b>RAID 1</b>) keeps a duplicate of each disk.</li>
  <li><b>Striped mirrors (RAID 1+0)</b> or <b>mirrored stripes (RAID 0+1)</b> provide high performance and high reliability.</li>
  <li><b>Block-interleaved parity (RAID 4, 5, 6)</b> uses much less redundancy.</li>
</ul>
<p>The table lists all the levels. For each one ask three questions: how are the data spread, where is the redundancy, how many disk failures can it survive?</p>
<table class="t">
  <tr><th>Level</th><th>Scheme</th><th>Redundancy</th><th>Survives</th></tr>
  <tr><td><b>RAID 0</b></td><td>block striping (Strip 0–3 on 4 disks, then 4–7…)</td><td>none</td><td>0 failed disks</td></tr>
  <tr><td><b>RAID 1</b></td><td>mirroring: 4 data disks + 4 mirror disks</td><td>100%</td><td>1 (in each pair)</td></tr>
  <tr><td><b>RAID 2</b></td><td>bit-level striping + Hamming ECC (Bit 1–7 on 7 disks)</td><td>ECC disks</td><td>1</td></tr>
  <tr><td><b>RAID 3</b></td><td>bit-interleaved: Bit 1–4 + a separate <b>Parity</b> disk</td><td>1 disk</td><td>1</td></tr>
  <tr><td><b>RAID 4</b></td><td>block striping + a <b>dedicated parity disk</b> (P0-3, P4-7, P8-11)</td><td>1 disk</td><td>1</td></tr>
  <tr><td><b>RAID 5</b></td><td>block striping + <b>distributed parity</b> (spread over all disks)</td><td>1 disk</td><td>1</td></tr>
  <tr><td><b>RAID 6</b></td><td>like RAID 5, but <b>two</b> redundancy blocks per stripe (P + Q, e.g. Reed-Solomon)</td><td>2 disks</td><td>2</td></tr>
  <tr><td><b>RAID 0+1</b></td><td><b>mirrored stripes</b>: a stripe set, then a mirror of the whole set</td><td>100%</td><td>1 guaranteed</td></tr>
  <tr><td><b>RAID 1+0</b></td><td><b>striped mirrors</b>: mirrored pairs, then striping over the pairs</td><td>100%</td><td>1 guaranteed (up to one in each pair)</td></tr>
</table>
<p><b>RAID 4 vs RAID 5 — where to put the parity.</b> RAID 4 stores all the parity on one dedicated disk. Every write to <i>any</i> data block must also update the parity block, so all writes queue on that single disk: it becomes the <b>bottleneck</b>. RAID 5 solves this by <b>distributing the parity</b> over all disks, rotating its position from stripe to stripe, as in the 5-disk layout of the slide:</p>
<table class="t">
  <tr><th>Disk 0</th><th>Disk 1</th><th>Disk 2</th><th>Disk 3</th><th>Disk 4</th></tr>
  <tr><td>Strip 0</td><td>Strip 1</td><td>Strip 2</td><td>Strip 3</td><td><b>P0-3</b></td></tr>
  <tr><td>Strip 4</td><td>Strip 5</td><td>Strip 6</td><td><b>P4-7</b></td><td>Strip 7</td></tr>
  <tr><td>Strip 8</td><td>Strip 9</td><td><b>P8-11</b></td><td>Strip 10</td><td>Strip 11</td></tr>
  <tr><td>Strip 12</td><td><b>P12-15</b></td><td>Strip 13</td><td>Strip 14</td><td>Strip 15</td></tr>
  <tr><td><b>P16-19</b></td><td>Strip 16</td><td>Strip 17</td><td>Strip 18</td><td>Strip 19</td></tr>
</table>
<p><b>Usable capacity</b> with N equal disks follows from where the redundancy is: RAID 0 — N disks of data; RAID 1 — N/2; RAID 4 and 5 — N − 1 (one disk worth of parity); RAID 6 — N − 2 (two disks worth).</p>
<p><b>0+1 vs 1+0.</b> Both combine mirroring and striping, in a different order. RAID 0+1 first builds a stripe set and then mirrors the whole set; RAID 1+0 first builds mirrored pairs and then stripes over the pairs. Both are guaranteed to survive one failure. But in 0+1 a single failure takes down its whole stripe set, while in 1+0 it affects only its own pair, so 1+0 survives more combinations of failures.</p>
<p>RAID protects against disk failures, not against everything:</p>
<ul>
  <li>RAID within a storage array can still fail if the <b>array itself</b> fails, so <b>automatic replication</b> of the data between arrays is common.</li>
  <li>Frequently a small number of <b>hot-spare</b> disks are left unallocated: they automatically replace a failed disk, and the data are rebuilt onto them.</li>
</ul>
<p>Use the simulator to switch between levels and watch where the data and parity blocks land:</p>
<div data-viz="0"></div>`,
      viz: [
        { name: 'raid', caption: 'Block layout: switch between levels 0, 1, 4, 5, 6, 0+1 and 1+0 and see where the parity goes.', props: { level: 5, disks: 4 } }
      ],
      takeaway: 'RAID 0 = striping (no redundancy); 1 = mirroring; 2 = bit striping + Hamming ECC; 3 = bit striping + a parity disk; 4 = block striping + a dedicated parity disk (write bottleneck); 5 = distributed parity; 6 = two redundancy blocks (P + Q), survives 2 failures; 0+1 = mirrored stripes; 1+0 = striped mirrors. Usable capacity: N, N/2, N − 1, N − 2.',
      exam: 'Recognize the level from a description or a picture; RAID 4 vs 5 (dedicated vs distributed parity); RAID 6 survives 2 failures; 0+1 vs 1+0; usable capacity.'
    },
    {
      id: 'features',
      h: 'Other features: snapshot, replication, hot spare',
      why: 'recovering from more than a failed disk',
      lead: 'RAID survives a failed disk, but not a deleted file, a burned building or a slow repair. A few extra features cover those cases.',
      html: `
<p>Regardless of where RAID is implemented (in the OS, in the controller, in a storage array), other useful features can be added. Each one answers a different "what if":</p>
<table class="t">
  <tr><th>Feature</th><th>What it is</th><th>What if…</th></tr>
  <tr><td><b>Snapshot</b></td><td>a view of the file system <b>before a set of changes</b> takes place (i.e. at a point in time)</td><td>a user deletes or damages files → go back to the snapshot</td></tr>
  <tr><td><b>Replication</b></td><td>automatic <b>duplication of writes between separate sites</b>, for redundancy and <b>disaster recovery</b>; it can be <b>synchronous</b> or <b>asynchronous</b></td><td>the whole site is lost (fire, flood) → the other site still has the data</td></tr>
  <tr><td><b>Hot spare disk</b></td><td>an unused disk that RAID <b>automatically</b> uses to replace a failed disk and rebuild the RAID set, if possible</td><td>a disk fails at night → the rebuild starts at once, without waiting for an administrator</td></tr>
</table>
<p>On replication: <b>synchronous</b> replication confirms a write only when both sites have it (safe, but every write waits for the remote site); <b>asynchronous</b> replication confirms locally and sends the write later (faster, but the newest writes may be lost in a disaster).</p>
<p>The hot spare connects back to the reliability measures of the RAID section: because the rebuild starts immediately, a hot spare <b>decreases the mean time to repair</b> — the dangerous window in which a second failure could lose data.</p>
<p>Storage arrays also offer <b>clones</b>, <b>thin provisioning</b> and <b>deduplication</b> (see the SAN section).</p>`,
      takeaway: 'Snapshot = point-in-time view of a file system; replication = automatic copy of the writes to another site (synchronous or asynchronous) for disaster recovery; hot spare = an idle disk that automatically replaces a failed one, which decreases the mean time to repair.',
      exam: 'Snapshot vs replication (synchronous / asynchronous); why a hot spare decreases the MTTR.'
    }
  ],
  terms: [
    { en: 'Secondary storage', ru: 'вторичная (внешняя) память', def: 'Large persistent storage below main memory: extends memory and keeps programs and data permanently.' },
    { en: 'Mass storage', ru: 'массовая (внешняя) память', def: 'Another name for secondary storage: disks and SSDs.' },
    { en: 'Volatile memory', ru: 'энергозависимая память', def: 'Memory that loses its content without power (e.g. DRAM).' },
    { en: 'Persistent memory', ru: 'постоянное хранилище', def: 'Storage that keeps data without power.' },
    { en: 'Storage class memory', ru: 'память класса хранилища', def: 'Memory that can bridge the gap between fast working memory and low-cost storage.' },
    { en: 'Removable disk', ru: 'съёмный диск', def: 'A disk that can be taken out of the computer.' },
    { en: 'Hard disk drive', ru: 'жёсткий диск', def: 'HDD: magnetic storage with spinning platters and moving heads.' },
    { en: 'Nonvolatile memory', ru: 'энергонезависимая память', def: 'NVM: electronic storage that keeps data without power (flash, NAND, SSD).' },
    { en: 'NAND flash', ru: 'флеш-память NAND', def: 'Non-volatile memory made of floating gate transistors; used in SSDs.' },
    { en: 'Solid-state drive', ru: 'твердотельный накопитель', def: 'SSD: NVM that works like a disk; no moving parts, so no seek or rotational latency.' },
    { en: 'Platter', ru: 'пластина (диска)', def: 'Magnetic disk of an HDD; both surfaces store data.' },
    { en: 'Spindle', ru: 'шпиндель', def: 'Axle that rotates all the platters; its speed is given in RPM.' },
    { en: 'Track', ru: 'дорожка', def: 'One concentric circle on a platter surface, divided into sectors.' },
    { en: 'Sector', ru: 'сектор', def: 'The smallest addressable part of a track.' },
    { en: 'Cylinder', ru: 'цилиндр', def: 'The set of tracks under the heads at one arm position, on all platters.' },
    { en: 'Read-write head', ru: 'головка чтения-записи', def: 'Reads and writes one platter surface; mounted on an arm.' },
    { en: 'Arm assembly', ru: 'блок позиционирования головок', def: 'The actuator that moves all the arms (and heads) together; its movement is the seek.' },
    { en: 'RPM', ru: 'оборотов в минуту', def: 'Rounds per minute: rotation speed of a disk (7200, 10000, 15000).' },
    { en: 'Transfer rate', ru: 'скорость передачи', def: 'Rate at which data flow between the drive and the computer.' },
    { en: 'Positioning time', ru: 'время позиционирования', def: 'Access time: seek time + rotational latency.' },
    { en: 'Access time', ru: 'время доступа', def: 'Seek time + rotational latency; average: average seek + half a rotation.' },
    { en: 'Seek time', ru: 'время поиска (перемещения головки)', def: 'Time to move the disk arm to the desired cylinder.' },
    { en: 'Rotational latency', ru: 'задержка вращения', def: 'Time for the desired sector to rotate under the head; on average half a rotation.' },
    { en: 'Head crash', ru: 'касание головкой поверхности', def: 'The head touches the disk surface; damages it, normally not repairable.' },
    { en: 'Controller overhead', ru: 'накладные расходы контроллера', def: 'Processing time added by the disk controller to each request.' },
    { en: 'Average I/O time', ru: 'среднее время ввода-вывода', def: 'Average access time + amount to transfer / transfer rate + controller overhead.' },
    { en: 'Floating gate transistor', ru: 'транзистор с плавающим затвором', def: 'NAND building block that keeps its charge without power.' },
    { en: 'Overwrite in place', ru: 'перезапись на месте', def: 'Rewriting data where they are; impossible in NAND flash (erase first).' },
    { en: 'Erase block', ru: 'блок стирания', def: 'Group of many NAND pages that must be erased together.' },
    { en: 'Drive writes per day', ru: 'полных перезаписей диска в день', def: 'DWPD: how many times per day the full capacity can be written during the warranty.' },
    { en: 'Flash Translation Layer', ru: 'слой трансляции флеш-памяти', def: 'FTL: controller table that tracks which logical blocks are valid and where they are physically.' },
    { en: 'Garbage collection', ru: 'сборка мусора', def: 'Frees invalid NAND pages: copies the valid pages away, then erases the block.' },
    { en: 'Invalid page', ru: 'недействительная страница', def: 'A NAND page holding an old version of data, waiting to be erased.' },
    { en: 'Overprovisioning', ru: 'резервирование избыточной ёмкости', def: 'Hidden extra flash capacity used as working space for garbage collection.' },
    { en: 'Wear leveling', ru: 'выравнивание износа', def: 'Writing equally to all cells, because each cell survives a limited number of erases.' },
    { en: 'Disk scheduling', ru: 'планирование дисковых операций', def: 'Choosing the order in which waiting disk requests are served, to reduce head movement.' },
    { en: 'Total head movement', ru: 'суммарное перемещение головки', def: 'Number of cylinders crossed to serve a queue of requests.' },
    { en: 'Zigzag effect', ru: 'эффект зигзага', def: 'In FCFS, the arm swings back and forth across the disk.' },
    { en: 'Shortest Seek Time First', ru: 'сначала кратчайшее время поиска', def: 'SSTF (or SSDF): serve the request closest to the head; a form of SJF, may cause starvation.' },
    { en: 'Starvation', ru: 'голодание', def: 'A request waits indefinitely because others are always chosen first.' },
    { en: 'Elevator algorithm', ru: 'алгоритм лифта', def: 'Disk scheduling that sweeps in one direction before turning: SCAN, LOOK, C-SCAN, C-LOOK.' },
    { en: 'SCAN', ru: 'алгоритм SCAN (лифт)', def: 'Serve both directions, moving to the edge of the disk before turning.' },
    { en: 'LOOK', ru: 'алгоритм LOOK', def: 'Serve both directions, turning at the last request instead of the edge.' },
    { en: 'C-SCAN', ru: 'круговой SCAN', def: 'Serve in one direction to the edge, then return to the start without serving; uniform wait.' },
    { en: 'C-LOOK', ru: 'круговой LOOK', def: 'Serve in one direction to the last request, then jump to the farthest request at the other end.' },
    { en: 'Circular list', ru: 'кольцевой список', def: 'A list whose last element is followed by the first; C-SCAN treats cylinders this way.' },
    { en: 'File-allocation method', ru: 'метод размещения файлов', def: 'How the blocks of a file are placed on disk; it influences disk requests.' },
    { en: 'Host-attached storage', ru: 'хранилище, подключённое к хосту', def: 'Storage reached through local I/O ports (SATA, USB, FireWire, Thunderbolt, Fibre Channel).' },
    { en: 'Fibre Channel', ru: 'Fibre Channel (оптоволоконный канал)', def: 'FC: high-speed serial storage architecture over fiber or copper cables.' },
    { en: 'FC fabric', ru: 'коммутационная фабрика FC', def: 'The network of Fibre Channel links and switches to which many hosts and storage devices connect.' },
    { en: 'Network-Attached Storage', ru: 'сетевое хранилище', def: 'NAS: file systems reached over a network via RPCs on TCP/UDP (NFS, SMB).' },
    { en: 'Remote procedure call', ru: 'удалённый вызов процедуры', def: 'RPC: calling a procedure on another machine over the network.' },
    { en: 'Network File System', ru: 'сетевая файловая система NFS', def: 'NFS: Unix protocol for NAS.' },
    { en: 'Server Message Block', ru: 'протокол SMB', def: 'SMB: Windows protocol for NAS.' },
    { en: 'Network Operating System', ru: 'сетевая операционная система', def: 'OS support needed to offer and use storage over a network.' },
    { en: 'Lock function', ru: 'функция блокировки', def: 'NAS mechanism that limits concurrent access to the same data.' },
    { en: 'Cloud storage', ru: 'облачное хранилище', def: 'Storage in a remote data center reached over the Internet / WAN through APIs.' },
    { en: 'Wide area network', ru: 'глобальная сеть', def: 'WAN: a network over large distances, such as the Internet.' },
    { en: 'Data center', ru: 'центр обработки данных', def: 'A building full of servers and storage, operated by a provider.' },
    { en: 'Storage Area Network', ru: 'сеть хранения данных', def: 'SAN: dedicated network (Fibre Channel or InfiniBand) connecting many hosts to many storage arrays; block level.' },
    { en: 'Storage array', ru: 'дисковый массив (система хранения)', def: 'Dedicated storage device with controllers, ports, memory and features such as snapshots and replication.' },
    { en: 'InfiniBand', ru: 'InfiniBand', def: 'IB: high-speed network used, among others, for SANs.' },
    { en: 'Thin provisioning', ru: 'тонкое выделение ресурсов', def: 'Space is given to a host only when it actually writes data.' },
    { en: 'Deduplication', ru: 'дедупликация', def: 'Storing identical data only once.' },
    { en: 'Clone', ru: 'клон', def: 'A writable copy of a volume or file system.' },
    { en: 'Snapshot', ru: 'снимок', def: 'A view of the file system before a set of changes, at a point in time.' },
    { en: 'Replication', ru: 'репликация', def: 'Automatic duplication of writes between separate sites; synchronous or asynchronous.' },
    { en: 'Disaster recovery', ru: 'аварийное восстановление', def: 'Recovering data and service after the loss of a whole site.' },
    { en: 'RAID', ru: 'избыточный массив независимых дисков', def: 'Redundant array of independent (inexpensive) disks: reliability and performance from several disks.' },
    { en: 'Redundancy', ru: 'избыточность', def: 'Extra data, not needed in normal operation, that reduce the loss of information.' },
    { en: 'Mean time to failure', ru: 'среднее время до отказа', def: 'MTTF: average time until a failure; redundancy increases it.' },
    { en: 'Mean time to repair', ru: 'среднее время восстановления', def: 'MTTR: exposure time after a failure, when another failure could cause data loss.' },
    { en: 'Mean time to data loss', ru: 'среднее время до потери данных', def: 'Depends on the mean time to failure and the mean time to repair.' },
    { en: 'Mirroring', ru: 'зеркалирование', def: 'Every disk has a copy (RAID 1, shadowing): reliable, reads faster, cost ×2.' },
    { en: 'Shadowing', ru: 'теневое копирование', def: 'Another name for mirroring (RAID 1).' },
    { en: 'Disk striping', ru: 'чередование данных по дискам', def: 'Data split over several disks used in parallel: throughput grows linearly, latency unchanged, no reliability.' },
    { en: 'Stripe size', ru: 'размер полосы', def: 'The unit of striping: bit, byte or sector (or block).' },
    { en: 'Throughput', ru: 'пропускная способность', def: 'Bytes transferred per second.' },
    { en: 'Latency', ru: 'задержка', def: 'Time to get the first byte.' },
    { en: 'Error detection', ru: 'обнаружение ошибок', def: 'Finding out that data have been damaged (e.g. bit flipping).' },
    { en: 'Bit flipping', ru: 'инверсия бита', def: 'A 0 that becomes a 1, or a 1 that becomes a 0, because of an error.' },
    { en: 'Redundant bits', ru: 'избыточные биты', def: 'Extra bits added to a data unit to detect or correct errors.' },
    { en: 'Parity bit', ru: 'бит чётности', def: 'Extra bit equal to the XOR of the data bits.' },
    { en: 'Parity', ru: 'чётность', def: 'XOR of the bits: detects a single error and corrects a single erasure.' },
    { en: 'XOR', ru: 'исключающее ИЛИ', def: 'Bit operation that gives 1 when an odd number of inputs are 1.' },
    { en: 'Cyclic Redundancy Check', ru: 'циклический избыточный код', def: 'CRC: a common error-detection method.' },
    { en: 'Error correcting code', ru: 'код коррекции ошибок', def: 'ECC: several check bits (Hamming, Reed-Solomon); detects N errors and corrects M < N.' },
    { en: 'Hamming code', ru: 'код Хэмминга', def: 'An error correcting code; used by RAID 2.' },
    { en: 'Reed-Solomon code', ru: 'код Рида — Соломона', def: 'An error correcting code; can provide the second redundancy block of RAID 6.' },
    { en: 'Erasure', ru: 'стирание', def: 'A lost bit (or disk) whose position is known.' },
    { en: 'Erasure channel', ru: 'канал со стираниями', def: 'A channel that knows when it does not know: each bit is 0, 1 or "don\'t know".' },
    { en: 'Single erasure correction', ru: 'исправление одного стирания', def: 'Rebuilding one known missing bit as the XOR of the others; what parity RAID does.' },
    { en: 'Block-interleaved parity', ru: 'блочное чередование с чётностью', def: 'Block striping with parity blocks (RAID 4, 5, 6); much less redundancy than mirroring.' },
    { en: 'Dedicated parity disk', ru: 'выделенный диск чётности', def: 'RAID 4: all parity on one disk, which becomes a write bottleneck.' },
    { en: 'Distributed parity', ru: 'распределённая чётность', def: 'RAID 5: parity blocks rotate over all disks, so no single bottleneck.' },
    { en: 'Striped mirrors', ru: 'чередование зеркал', def: 'RAID 1+0: mirrored pairs first, then striping over the pairs.' },
    { en: 'Mirrored stripes', ru: 'зеркалирование полос', def: 'RAID 0+1: a stripe set first, then a mirror of the whole set.' },
    { en: 'Hot spare', ru: 'горячий резерв', def: 'Unused disk that automatically replaces a failed one; decreases the mean time to repair.' },
    { en: 'Usable capacity', ru: 'полезная ёмкость', def: 'Space left for data: RAID 0 N, RAID 1 N/2, RAID 4/5 N − 1, RAID 6 N − 2 disks.' }
  ],
  questions: [
    { id: 'ms-01', type: 'single', q: 'Which two mass-storage technologies do the slides distinguish?', options: ['Magnetic (HDD) and electronic (NVM)', 'Optical and magnetic tape', 'DRAM and SRAM', 'NAS and SAN'], answer: 0, explain: 'Magnetic hard disk drives and electronic nonvolatile memory (NAND flash, SSD). NAS and SAN are ways to attach storage, not technologies.', section: 'overview', diff: 1 },
    { id: 'ms-02', type: 'single', q: 'In an HDD, a cylinder is…', options: ['one concentric circle on a surface', 'the smallest addressable part of a track', 'the set of tracks under the heads at one arm position, on all platters', 'the axle that rotates the platters'], answer: 2, explain: 'A track is a circle, a sector is part of a track, the spindle is the axle. A cylinder is the "vertical" set of tracks at one arm position.', section: 'hdd', diff: 1 },
    { id: 'ms-03', type: 'single', q: 'The positioning time (access time) of an HDD equals…', options: ['seek time + transfer time', 'seek time + rotational latency', 'rotational latency + controller overhead', 'transfer time + controller overhead'], answer: 1, explain: 'Positioning time = seek time (arm to the cylinder) + rotational latency (sector under the head). Transfer time and controller overhead come on top of it in the I/O time.', section: 'hdd', diff: 1 },
    { id: 'ms-04', type: 'single', q: 'Average rotational latency of a 7200 RPM disk ≈ ?', options: ['8.33 ms', '2 ms', '4.17 ms', '5.56 ms'], answer: 2, explain: 'One rotation = 60 000 / 7200 = 8.33 ms; on average half a rotation = 4.17 ms. 5.56 ms is for 5400 RPM, 2 ms for 15000 RPM.', section: 'hdd-perf', diff: 2 },
    { id: 'ms-05', type: 'single', q: 'Fastest disk on the slide: average seek 3 ms, 15000 RPM. Average access time = ?', options: ['3 ms', '5 ms', '14.56 ms', '4.17 ms'], answer: 1, explain: 'Average latency at 15000 RPM = 0.5 × 60 000 / 15 000 = 2 ms; 3 + 2 = 5 ms. 14.56 ms is the slow disk (9 + 5.56).', section: 'hdd-perf', diff: 2 },
    { id: 'ms-06', type: 'single', q: 'Slide example: 4 KB block, 7200 RPM, average seek 5 ms, 1 Gb/s, controller overhead 0.1 ms. Average I/O time = ?', options: ['9.27 ms', '9.3 ms', '5.1 ms', '14.56 ms'], answer: 1, explain: '5 + 4.17 + 0.1 = 9.27 ms, plus a transfer time of ≈ 0.03 ms → 9.3 ms. 9.27 ms is what you get if you forget the transfer.', section: 'hdd-perf', diff: 2 },
    { id: 'ms-07', type: 'single', q: 'Transfer time of a 4 KB block at 1 Gb/s, with binary units as on the slide (1 Gb = 1024² Kb) ≈ ?', options: ['0.03 ms', '4 ms', '0.3 ms', '0.004 ms'], answer: 0, explain: '4 KB = 32 Kb (bytes × 8 = bits); 32 / 1024² s ≈ 3.05 × 10⁻⁵ s ≈ 0.03 ms.', section: 'hdd-perf', diff: 3 },
    { id: 'ms-08', type: 'single', q: 'A 10000 RPM disk, average seek 4 ms, 4 KB block at 1 Gb/s, controller overhead 0.1 ms. Average I/O time ≈ ?', options: ['10.13 ms', '4.13 ms', '9.3 ms', '7.13 ms'], answer: 3, explain: 'Latency = 0.5 × 60 000 / 10 000 = 3 ms. 4 + 3 + 0.1 + 0.03 ≈ 7.13 ms.', section: 'hdd-perf', diff: 3 },
    { id: 'ms-09', type: 'multi', q: 'Which statements about SSDs are true according to the slides? (select all that apply)', options: ['They have no seek time and no rotational latency', 'They are more expensive per MB than HDDs', 'They may have a shorter life span', 'They have more capacity than HDDs', 'They must be refreshed many times per second, like RAM'], answer: [0, 1, 2], explain: 'SSDs: no moving parts, more expensive per MB, possibly shorter life, less capacity. Refresh is needed by RAM; NAND keeps its charge without power.', section: 'nvm', diff: 2 },
    { id: 'ms-10', type: 'single', q: 'What does the Flash Translation Layer (FTL) keep track of?', options: ['The number of erases of each block, for the warranty', 'Which logical blocks are valid and where they are physically stored', 'The I/O request queue of the controller', 'The temperature of the cells'], answer: 1, explain: 'Without overwrite in place, data move to new pages and blocks hold a mix of valid and invalid pages; the FTL table maps logical blocks to their current physical location.', section: 'nand', diff: 2 },
    { id: 'ms-11', type: 'single', q: 'A 1 TB NAND drive is rated 5 DWPD. How much data per day can be written during the warranty?', options: ['1 TB', '200 GB', '5 TB', '100 000 TB'], answer: 2, explain: 'DWPD = drive writes per day: 5 × 1 TB = 5 TB per day.', section: 'nand', diff: 2 },
    { id: 'ms-12', type: 'single', q: 'queue = 98, 183, 37, 122, 14, 124, 65, 67; head = 53. Total head movement for FCFS = ?', options: ['236', '208', '640', '382'], answer: 2, explain: '45 + 85 + 146 + 85 + 108 + 110 + 59 + 2 = 640 cylinders.', section: 'fcfs', diff: 2 },
    { id: 'ms-13', type: 'single', q: 'Same queue, head = 53. Total head movement for SSTF = ?', options: ['236', '208', '640', '299'], answer: 0, explain: '53 → 65 → 67 → 37 → 14 → 98 → 122 → 124 → 183: 12 + 2 + 30 + 23 + 84 + 24 + 2 + 59 = 236.', section: 'sstf', diff: 2 },
    { id: 'ms-14', type: 'single', q: 'What is the main drawback of SSTF?', options: ['The head moves in one direction only', 'It always moves more than FCFS', 'Requests may starve (it is a form of SJF), and the middle cylinders are favored', 'It needs to know the future requests'], answer: 2, explain: 'SSTF is a form of SJF: far (edge) requests can be postponed indefinitely while new requests keep arriving near the head.', section: 'sstf', diff: 2 },
    { id: 'ms-15', type: 'single', q: 'Which elevator algorithm serves requests in both directions and turns around at the last request (not at the edge of the disk)?', options: ['SCAN', 'C-SCAN', 'LOOK', 'C-LOOK'], answer: 2, explain: 'Both directions + until the last request = LOOK. Until the last cylinder = SCAN; one direction only = the C- versions.', section: 'scan-look', diff: 1 },
    { id: 'ms-16', type: 'single', q: 'Same queue, head = 53, moving toward 0. Total head movement for LOOK = ?', options: ['236', '299', '640', '208'], answer: 3, explain: '53 → 37 → 14, turn, → 65 … 183: (53 − 14) + (183 − 14) = 39 + 169 = 208.', section: 'scan-look', diff: 2 },
    { id: 'ms-17', type: 'single', q: 'Same queue, head = 53, SCAN toward 0 (the head goes down to cylinder 0, then up). Total head movement = ?', options: ['208', '236', '331', '640'], answer: 1, explain: '53 → 37 → 14 → 0 → 65 → … → 183: 53 + 183 = 236. The slide writes 208, but 208 is the LOOK result (turning at 14).', section: 'scan-look', diff: 3 },
    { id: 'ms-18', type: 'single', q: 'Same queue, head = 53, C-SCAN moving up (cylinders 0–199). Total head movement, counting the return 199 → 0?', options: ['183', '331', '382', '236'], answer: 2, explain: '53 → 199 = 146, return 199 → 0 = 199, then 0 → 37 = 37: 146 + 199 + 37 = 382 (183 without the return).', section: 'cscan-clook', diff: 3 },
    { id: 'ms-19', type: 'single', q: 'Same queue, head = 53, C-LOOK moving up. Total head movement, counting the jump 183 → 14?', options: ['153', '322', '299', '382'], answer: 1, explain: '53 → 183 = 130, jump 183 → 14 = 169, 14 → 37 = 23: 322 in total (153 without the jump).', section: 'cscan-clook', diff: 3 },
    { id: 'ms-20', type: 'single', q: 'According to the slides, which algorithms perform better for systems that place a heavy load on the disk?', options: ['FCFS', 'SSTF', 'SCAN and C-SCAN', 'Only C-LOOK'], answer: 2, explain: 'The slide: SCAN and C-SCAN perform better under heavy load (the sweep serves everybody, no starvation). SSTF is described as common, with a natural appeal.', section: 'select', diff: 1 },
    { id: 'ms-21', type: 'single', q: 'How is NAS implemented?', options: ['With SCSI over Fibre Channel', 'With RPCs between host and storage over TCP or UDP (NFS, SMB)', 'Through a local SATA bus', 'Through a REST API to a data center'], answer: 1, explain: 'NAS: remote procedure calls over TCP/UDP on an IP network; protocols NFS (Unix) and SMB (Windows). SCSI over Fibre Channel is SAN; APIs are cloud storage.', section: 'attachment', diff: 1 },
    { id: 'ms-22', type: 'single', q: 'How does cloud storage differ from NAS?', options: ['Cloud storage is reached over the Internet / WAN through APIs, while NAS looks like just another file system', 'Cloud storage is attached through SATA', 'NAS works only over the Internet', 'Cloud storage needs no network'], answer: 0, explain: 'NAS is presented as just another file system; cloud storage is API based, because of WAN latency and failure scenarios.', section: 'attachment', diff: 2 },
    { id: 'ms-23', type: 'single', q: 'NAS vs SAN: which pairing is correct?', options: ['NAS — block data, SAN — file-based data', 'NAS — file-based data over TCP/IP (Ethernet); SAN — block data over Fibre Channel (SCSI)', 'Both run only over Fibre Channel', 'NAS is harder to manage than SAN'], answer: 1, explain: 'From the slide table: NAS — file-based, Ethernet, NFS/SMB; SAN — block, Fibre Channel, SCSI, more administration.', section: 'san', diff: 2 },
    { id: 'ms-24', type: 'single', q: 'Mirroring: how do cost and performance change?', options: ['Cost per byte doubles; reads up to 2× faster, writes a little slower', 'Cost unchanged; writes 2× faster', 'Cost doubles; latency is halved', 'Cost grows by 1/N; reads unchanged'], answer: 0, explain: 'Every write goes to both mirrors (a little slower); a read can use either mirror (up to 2× faster). The cost per byte doubles.', section: 'raid', diff: 1 },
    { id: 'ms-25', type: 'single', q: 'What does striping over N disks give?', options: ['Latency decreases N times', 'Throughput grows linearly with N, latency is unchanged, no reliability', 'Reliability grows N times', 'Cost per byte doubles'], answer: 1, explain: 'Latency (time to the first byte) is unchanged; throughput grows linearly; striping alone does not provide reliability.', section: 'raid', diff: 2 },
    { id: 'ms-26', type: 'single', q: 'In which RAID level is the parity distributed over all disks?', options: ['RAID 3', 'RAID 4', 'RAID 5', 'RAID 1'], answer: 2, explain: 'RAID 5 = block-interleaved distributed parity (P0-3, P4-7… on different disks). RAID 4 has a dedicated parity disk; RAID 3 is bit-level with a parity disk.', section: 'raid-levels', diff: 1 },
    { id: 'ms-27', type: 'single', q: 'Why is the parity disk a bottleneck in RAID 4?', options: ['It is slower than the others by design', 'Every write of any block must also update the parity on that one disk', 'It stores the FTL', 'It does not take part in reads'], answer: 1, explain: 'With all parity on one dedicated disk, all writes queue on it; RAID 5 distributes the parity and removes the problem.', section: 'raid-levels', diff: 2 },
    { id: 'ms-28', type: 'single', q: 'Striped mirrors are…', options: ['RAID 0+1', 'RAID 1+0', 'RAID 5', 'RAID 6'], answer: 1, explain: 'RAID 1+0 = striped mirrors (first mirrored pairs, then striping over them). RAID 0+1 = mirrored stripes.', section: 'raid-levels', diff: 2 },
    { id: 'ms-29', type: 'single', q: 'RAID 5 with 5 disks of 1 TB each. What is the usable capacity?', options: ['5 TB', '4 TB', '2.5 TB', '3 TB'], answer: 1, explain: 'Parity takes the equivalent of one disk (spread over all of them): (N − 1) × 1 TB = 4 TB. 2.5 TB would be mirroring.', section: 'raid-levels', diff: 2 },
    { id: 'ms-30', type: 'single', q: 'How many simultaneous disk failures does RAID 6 survive?', options: ['0', '1', '2', 'N/2'], answer: 2, explain: 'RAID 6 stores two redundancy blocks (P + Q) per stripe, so it survives 2 failures. RAID 5 survives 1.', section: 'raid-levels', diff: 1 },
    { id: 'ms-31', type: 'single', q: 'Received (011, 1): data 011, parity bit 1. What can be said?', options: ['There is no error', 'An error is detected, but it is impossible to tell which bit is wrong', 'The first bit is wrong and can be corrected', 'There are exactly two errors'], answer: 1, explain: '0 ⊕ 1 ⊕ 1 = 0 ≠ 1, so an error is detected. Parity gives only single error detection: it does not know the position and cannot detect multi-bit errors.', section: 'ecc', diff: 2 },
    { id: 'ms-32', type: 'single', q: 'Erasure channel: sent (0 1 1, 0), received (0 ? 1, 0). What is "?"', options: ['0', '1', 'It cannot be recovered', 'Any value'], answer: 1, explain: '? = 0 ⊕ 1 ⊕ 0 = 1. Parity corrects one erasure because we know which bit is missing.', section: 'ecc', diff: 2 },
    { id: 'ms-33', type: 'single', q: 'a = 01100011, b = 10101010, c = 11001010. Parity p = a ⊕ b ⊕ c = ?', options: ['11111111', '01100011', '00000011', '10100001'], answer: 2, explain: 'a ⊕ b = 11001001; ⊕ c = 00000011. If a is lost, a = p ⊕ b ⊕ c = 01100011.', section: 'ecc', diff: 3 },
    { id: 'ms-34', type: 'single', q: 'What does a hot spare disk decrease?', options: ['Mean time to failure', 'Mean time to repair', 'Rotational latency', 'Cost per byte'], answer: 1, explain: 'The hot spare replaces the failed disk automatically and the rebuild starts at once, so the window of vulnerability (MTTR) is shorter.', section: 'features', diff: 2 },
    { id: 'ms-35', type: 'tf', q: 'Striping data over several disks, without mirroring or parity, makes the data more reliable.', answer: false, explain: 'Striping improves the efficiency of data transfer but provides no reliability: every disk holds part of the data, so losing any disk loses data.', section: 'raid', diff: 1 },
    { id: 'ms-36', type: 'single', q: 'Why does an SSD controller need garbage collection?', options: ['Pages cannot be overwritten in place, so updates leave invalid pages that must be reclaimed by erasing whole blocks', 'The disk arm must be moved back to cylinder 0', 'RAM must be refreshed many times per second', 'The FTL table is stored on a separate disk'], answer: 0, explain: 'No overwrite in place: new versions go to free pages and the old ones become invalid. GC copies the valid pages away and erases the block; overprovisioning gives it working space.', section: 'nand', diff: 2 },
    { id: 'ms-37', type: 'single', q: 'RAID 6 with 6 disks of 2 TB each. What is the usable capacity?', options: ['12 TB', '10 TB', '8 TB', '6 TB'], answer: 2, explain: 'RAID 6 keeps two disks worth of redundancy (P + Q): (N − 2) × 2 TB = 4 × 2 TB = 8 TB. 10 TB would be RAID 5, 6 TB mirroring.', section: 'raid-levels', diff: 2 },
    { id: 'ms-38', type: 'single', q: 'Why does C-SCAN give a more uniform wait time than SCAN?', options: ['It serves requests in one direction only and treats the cylinders as a circular list, so all cylinders are treated the same way', 'It always serves the closest request first', 'It never moves to the edge of the disk', 'It serves the requests in arrival order'], answer: 0, explain: 'C-SCAN returns to the start without serving and sweeps again in the same direction. "Closest first" is SSTF; "not to the edge" is the LOOK idea; arrival order is FCFS.', section: 'cscan-clook', diff: 2 }
  ]
});
