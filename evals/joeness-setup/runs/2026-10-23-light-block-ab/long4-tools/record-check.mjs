// Generic record check (JOENESS candidate L): warns about TASK entries growing by appended
// dated paragraphs and ROADMAP stage headings that disagree with their item rows.
import { readFileSync, existsSync } from 'node:fs';
const warn = [];
if (existsSync('TASK.md')) {
  const sections = readFileSync('TASK.md', 'utf8').split(/^(?=## )/m).filter(s => s.startsWith('## '));
  const last = sections.at(-1);
  if (last) {
    const dated = last.split('\n').filter(l => /^\d{4}-\d{2}-\d{2}\b/.test(l)).length;
    if (dated > 3) warn.push(`TASK: the last entry "${last.split('\n')[0].slice(3, 70)}" has ${dated} dated paragraphs appended under it. Write new work as its own "## YYYY-MM-DD — title" entry unless it belongs to that entry's topic (leave existing paragraphs where they are).`);
  }
}
if (existsSync('ROADMAP.md')) {
  for (const block of readFileSync('ROADMAP.md', 'utf8').split(/^(?=### )/m).filter(b => b.startsWith('### '))) {
    const head = block.split('\n')[0];
    const status = (head.split(' — ').at(-1) || '').trim();
    const rows = block.split('\n').filter(l => /^\| *[A-Z]+\d+ *\|/.test(l)).map(l => l.split('|')[3]?.trim() || '');
    if (!rows.length) continue;
    const allDone = rows.every(r => r.startsWith('complete'));
    const started = rows.some(r => !r.startsWith('not started'));
    if (allDone && !status.startsWith('complete')) warn.push(`ROADMAP: "${head.slice(4, 60)}" has every item complete but the stage says "${status.slice(0, 30)}".`);
    if (!allDone && status.startsWith('complete')) warn.push(`ROADMAP: "${head.slice(4, 60)}" says complete but some items are not.`);
    if (started && status.startsWith('not started')) warn.push(`ROADMAP: "${head.slice(4, 60)}" says not started but some items have started.`);
  }
}
console.log(warn.length ? warn.map(w => '- ' + w).join('\n') : 'record-check: no warnings');
