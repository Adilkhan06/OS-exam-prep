#!/usr/bin/env node
// Validates content modules. Usage: node tools/validate.js [content/file.js ...]  (default: all content/*.js)
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const VIZ = ['flow', 'layers', 'graph', 'timeline', 'stepper', 'tree', 'scheduler', 'mlfq', 'procStates', 'forkTree',
  'threadModels', 'amdahl', 'race', 'peterson', 'semaphore', 'philosophers', 'banker', 'diskSched', 'hddCalc', 'raid',
  'chmod', 'ioModes'];
const TYPES = ['single', 'multi', 'tf', 'code'];

let files = process.argv.slice(2);
if (!files.length) {
  files = fs.readdirSync(path.join(ROOT, 'content')).filter(f => f.endsWith('.js')).sort().map(f => path.join('content', f));
}

const modules = [];
const sandbox = { OS: { addModule: m => modules.push(m) }, console };
vm.createContext(sandbox);

const errors = [];
const warns = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warns.push(`${where}: ${msg}`);

for (const f of files) {
  const abs = path.resolve(ROOT, f);
  const before = modules.length;
  try {
    vm.runInContext(fs.readFileSync(abs, 'utf8'), sandbox, { filename: abs });
  } catch (e) {
    err(f, 'JS error: ' + e.message);
    continue;
  }
  if (modules.length === before) err(f, 'no OS.addModule call');
  for (let i = before; i < modules.length; i++) modules[i].__file = f;
}

const ids = new Set();
const qids = new Set();
for (const m of modules) {
  const W = m.__file + (m.id ? ` [${m.id}]` : '');
  for (const k of ['id', 'num', 'group', 'title', 'titleRu', 'icon', 'sources', 'summary', 'bridge', 'intro', 'sections', 'terms', 'questions']) {
    if (m[k] === undefined) err(W, `missing field "${k}"`);
  }
  // v2: English only — Cyrillic allowed only in titleRu and terms[].ru
  const CYR = /[Ѐ-ӿ]/;
  const scan = (obj, path, skip) => {
    if (typeof obj === 'string') { if (CYR.test(obj) && !skip) warn(W, `Cyrillic text at ${path}: "${obj.replace(/\s+/g, ' ').slice(0, 60)}"`); return; }
    if (Array.isArray(obj)) return obj.forEach((x, i) => scan(x, `${path}[${i}]`, skip));
    if (obj && typeof obj === 'object') for (const k of Object.keys(obj)) scan(obj[k], `${path}.${k}`, skip || k === 'ru' || k === 'titleRu' || k === '__file');
  };
  scan(m, 'module', false);
  if (ids.has(m.id)) err(W, 'duplicate module id'); ids.add(m.id);
  if (!['theory', 'lab'].includes(m.group)) err(W, 'group must be theory|lab');
  const secIds = new Set();
  (m.sections || []).forEach((s, i) => {
    const SW = `${W} section#${i} (${s.id})`;
    if (!s.id || !/^[a-z0-9-]+$/.test(s.id)) err(SW, 'bad/missing id');
    if (secIds.has(s.id)) err(SW, 'duplicate section id'); secIds.add(s.id);
    if (!s.h) err(SW, 'missing h');
    if (!s.lead) err(SW, 'missing lead');
    if (!s.takeaway) err(SW, 'missing takeaway');
    if (!s.why) err(SW, 'missing why');
    if (!s.html || s.html.trim().length < 20) err(SW, 'missing/short html');
    if (s.html && /\$\{/.test(s.html)) warn(SW, 'html contains ${');
    if (s.html && /(fill|stroke)="#/.test(s.html)) warn(SW, 'inline SVG uses hardcoded colors');
    const vizArr = s.viz || [];
    vizArr.forEach((v, j) => {
      if (!VIZ.includes(v.name)) err(SW, `unknown viz "${v.name}"`);
    });
    const refs = [...(s.html || '').matchAll(/data-viz="(\d+)"/g)].map(x => +x[1]);
    refs.forEach(r => { if (r >= vizArr.length) err(SW, `data-viz="${r}" out of range`); });
    // tag balance (rough)
    for (const tag of ['ul', 'ol', 'table', 'div', 'pre', 'b', 'code', 'svg']) {
      const open = ((s.html || '').match(new RegExp(`<${tag}[\\s>]`, 'g')) || []).length;
      const close = ((s.html || '').match(new RegExp(`</${tag}>`, 'g')) || []).length;
      if (open !== close) warn(SW, `<${tag}> open ${open} / close ${close}`);
    }
  });
  (m.terms || []).forEach((t, i) => { if (!t.en || !t.def || !t.ru) err(`${W} term#${i}`, 'term needs en + ru + def'); });
  const pos = {};
  (m.questions || []).forEach((q, i) => {
    const QW = `${W} q#${i} (${q.id})`;
    if (!q.id) err(QW, 'missing id');
    if (qids.has(q.id)) err(QW, 'duplicate question id'); qids.add(q.id);
    if (!TYPES.includes(q.type)) err(QW, `bad type "${q.type}"`);
    if (!q.q) err(QW, 'missing q');
    if (!q.explain) err(QW, 'missing explain');
    if (!secIds.has(q.section)) err(QW, `section "${q.section}" not found`);
    if (![1, 2, 3].includes(q.diff)) warn(QW, 'diff should be 1|2|3');
    if (q.type === 'tf') {
      if (typeof q.answer !== 'boolean') err(QW, 'tf answer must be boolean');
    } else {
      if (!Array.isArray(q.options) || q.options.length < 2) { err(QW, 'options missing'); return; }
      if (new Set(q.options.map(String)).size !== q.options.length) err(QW, 'duplicate options');
      if (q.type === 'multi') {
        if (!Array.isArray(q.answer) || !q.answer.length) err(QW, 'multi answer must be non-empty array');
        else q.answer.forEach(a => { if (!(a >= 0 && a < q.options.length)) err(QW, `answer ${a} out of range`); });
      } else {
        if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) err(QW, `answer ${q.answer} out of range`);
        else pos[q.answer] = (pos[q.answer] || 0) + 1;
      }
      if (q.type === 'code' && !q.code) err(QW, 'code question without code');
    }
  });
  const nq = (m.questions || []).length;
  const covered = new Set((m.questions || []).map(q => q.section));
  const uncovered = [...secIds].filter(s => !covered.has(s));
  console.log(`${m.__file.padEnd(28)} ${String(m.id).padEnd(12)} sections=${String(secIds.size).padStart(2)} terms=${String((m.terms || []).length).padStart(3)} questions=${String(nq).padStart(3)} answer-pos=${JSON.stringify(pos)}${uncovered.length ? '  no-questions: ' + uncovered.join(',') : ''}`);
}

warns.forEach(w => console.log('WARN  ' + w));
errors.forEach(e => console.log('ERROR ' + e));
console.log(`\n${modules.length} module(s), ${qids.size} questions, ${errors.length} error(s), ${warns.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
