# OS Exam Prep

Exam preparation for **Operating Systems** (Università degli Studi di Messina).
Every topic of the lectures and labs is explained step by step in English — *why* each mechanism exists, *how* it
works and *what follows from it* — with interactive visualizations, practice questions and a timed exam mode.

## Features
- **13 modules** forming one logical chain: OS basics → OS services & structure → processes → threads → CPU
  scheduling → synchronization → deadlock → I/O systems → mass storage, plus labs: Linux basics, Linux processes,
  Bash scripting, device management.
- Each module starts with the big picture and how it follows from the previous one, then a roadmap; each section has
  a **Why this matters** lead, the explanation, and a **Key idea** takeaway.
- **Translation mode** (`EN→RU` button or the `T` key): click any word to see its Russian translation; technical
  phrases such as *race condition* or *context switch* are translated as a whole. Works offline.
- **Simulators**: CPU scheduling (FCFS/SJF/SRTF/RR/Priority), disk scheduling, Banker's algorithm, race condition,
  Peterson, semaphores, dining philosophers, fork tree, Amdahl's law, RAID with XOR parity, chmod and more.
- **Practice** per module or section with instant feedback, **flashcards**, **search**, **mistakes bank**.
- **Exam**: choose topics, number and type of questions (theory / code), timer, flags, result in % and on the /30
  scale, review, retake mistakes, history. Progress is stored in the browser (`localStorage`).

## Run locally
No build step — it is a static site.
```bash
python -m http.server 5173
```
then open http://localhost:5173 (or just open `index.html`).

## Deploy on Vercel
Import the repository → Framework Preset: **Other**, Build Command: empty, Output Directory: `.`.

## Structure
```
index.html             shell
css/styles.css         styles (light/dark)
js/core.js             router, storage, code highlighting
js/viz/*.js            visualizations and simulators
js/learn.js            home (course map), modules, practice, flashcards, search, mistakes
js/exam.js             exam mode and history
js/translate.js        click-a-word translation mode
js/dict.js             EN→RU dictionary (generated from the site vocabulary)
content/NN-*.js        module content (OS.addModule)
docs/CONTENT_GUIDE.md  content format and writing rules
tools/validate.js      content checks: node tools/validate.js
```
