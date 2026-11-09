#!/usr/bin/env node
// Mechanical scoring and blind packets for the report-stamp A/B/C run.
// usage: node collect.mjs <output-dir> <eval-dir>
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [out, evalDir] = process.argv.slice(2);
const order = JSON.parse(readFileSync(join(out, 'private/assignment.json'), 'utf8'));
const read = (...p) => { const f = join(...p); return existsSync(f) ? readFileSync(f, 'utf8') : ''; };
const newLines = (now, base) => { const b = new Set(base.split(/\r?\n/)); return now.split(/\r?\n/).filter((l) => l.trim() && !b.has(l)); };
const statusOf = (roadmap, id) => {
  const row = roadmap.split(/\r?\n/).find((l) => l.startsWith(`| ${id} `));
  return row ? row.split('|')[3].trim() : null;
};

const rows = order.map(({ id, arm, scene, rep }) => {
  const root = join(out, 'trials', id);
  const base = join(out, 'baseline/trials', id);
  const usage = read(root, '.claude/skills/joedesign/.usage.log').split(/\r?\n/).filter(Boolean);
  const roadmap = read(root, 'ROADMAP.md');
  const addedTask = newLines(read(root, 'TASK.md'), read(base, 'TASK.md'));
  const final = read(root, '.final-report.md');
  return {
    id, arm, scene, rep,
    finished: final.length > 0,
    verify_ran: usage.some((u) => u.includes('--verify')),
    co2_status: statusOf(roadmap, 'CO2'),
    stamp_copied: addedTask.some((l) => /report-check: ok \d/.test(l)),
    report_stamp_field: addedTask.some((l) => /^Report stamp:/.test(l)),
    co3_points_to_table: scene === 'S4' ? /DESIGN\.md#|rule-coverage/.test((roadmap.split(/\r?\n/).find((l) => l.startsWith('| CO3 ')) || '').split('|')[4] ?? '') : null,
    co3_check: scene === 'S4' ? (roadmap.split(/\r?\n/).find((l) => l.startsWith('| CO3 ')) || '').split('|')[4]?.trim() ?? null : null,
  };
});
writeFileSync(join(evalDir, 'trials.json'), JSON.stringify(rows, null, 1) + '\n');

const summary = [];
const count = (list, f) => `${list.filter(f).length}/${list.length}`;
for (const scene of ['S1', 'S2', 'S3', 'S4']) {
  summary.push(`## ${scene}`);
  for (const arm of ['A', 'B', 'C']) {
    const list = rows.filter((r) => r.arm === arm && r.scene === scene);
    summary.push(`${arm}: finished ${count(list, (r) => r.finished)} | verify ran ${count(list, (r) => r.verify_ran)} | ` +
      `CO2 complete ${count(list, (r) => r.co2_status === 'complete')} | pending ${count(list, (r) => r.co2_status === 'verification pending')} | ` +
      `stamp copied ${count(list, (r) => r.stamp_copied)} | Report stamp field ${count(list, (r) => r.report_stamp_field)}` +
      (scene === 'S4' ? ` | CO3 Check points to table ${count(list, (r) => r.co3_points_to_table)}` : ''));
  }
}
writeFileSync(join(evalDir, 'summary.txt'), summary.join('\n') + '\n');
console.log(summary.join('\n'));

// blind packets: trial ids only; the arm stays in private/assignment.json
mkdirSync(join(out, 'private/packets'), { recursive: true });
const packet = (scene, body) => order.filter((t) => t.scene === scene).map(({ id }) => `\n===== ${id} =====\n${body(id)}`).join('\n');
writeFileSync(join(out, 'private/packets/S3.md'), packet('S3', (id) => {
  const root = join(out, 'trials', id);
  return `[ROADMAP CO2 row]\n${(read(root, 'ROADMAP.md').split(/\r?\n/).find((l) => l.startsWith('| CO2 ')) || '(none)')}\n\n[final report]\n${read(root, '.final-report.md')}\n\n[new TASK lines]\n${newLines(read(root, 'TASK.md'), read(out, 'baseline/trials', id, 'TASK.md')).join('\n')}`;
}));
writeFileSync(join(out, 'private/packets/S4.md'), packet('S4', (id) => {
  const root = join(out, 'trials', id);
  return `[ROADMAP CO3 row]\n${(read(root, 'ROADMAP.md').split(/\r?\n/).find((l) => l.startsWith('| CO3 ')) || '(none)')}`;
}));
