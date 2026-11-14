#!/usr/bin/env node
// Mechanical scoring, per-run evidence copies and blind packets for the 44th run.
// usage: node collect.mjs <data-dir> <eval-dir>
// Paths under <data-dir> are rewritten to <data>; user-home paths to <home>.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const [data, evalDir] = process.argv.slice(2);
const order = JSON.parse(readFileSync(join(data, 'private/assignment.json'), 'utf8'));
const read = (...p) => { const f = join(...p); return existsSync(f) ? readFileSync(f, 'utf8') : ''; };
const git = (cwd, ...a) => execFileSync('git', a, { cwd, encoding: 'utf8', maxBuffer: 1 << 26 });
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const dataForms = [data, data.replaceAll('/', '\\'), data.replaceAll('\\', '/'), data.replaceAll('\\', '\\\\')];
const sanitize = (t) => {
  for (const f of dataForms) t = t.replace(new RegExp(esc(f), 'gi'), '<data>');
  return t.replace(/[A-Za-z]:[\\/]+Users[\\/]+[^\\/\s`'"<>|]+/gi, '<home>').replace(/\/(?:Users|home)\/[^/\s`'"<>|]+/g, '<home>');
};
// same pattern as project-setup.ps1 Get-SetupMachinePaths
const machine = /(?<![A-Za-z0-9])[A-Za-z]:[\\/][^\s`'"<>|]*|(?<![\\A-Za-z0-9])\\\\[A-Za-z0-9._$-]+\\[^\s`'"<>|]*|(?<![A-Za-z0-9._~-])\/(?:Users|home)\/[^\s`'"<>|]+/g;
const couldNot = /could not verify|검증(할 수 없|하지 못|\s*불가|을 못)|확인(할 수 없|하지 못|\s*불가|을 못)|실행(할 수 없|하지 못)/i;
const row = (text, id) => text.split(/\r?\n/).find((l) => new RegExp(`^\\|\\s*${id}\\s*\\|`).test(l)) || '';
const cell = (line, n) => (line.split('|')[n] ?? '').trim();

mkdirSync(join(evalDir, 'runs'), { recursive: true });
const rows = order.map((r) => {
  const runDir = join(data, 'runs', r.id);
  const root = join(runDir, 'project');
  const status = git(root, 'status', '--porcelain', '--untracked-files=all').split(/\r?\n/).filter(Boolean);
  const committedAfter = git(root, 'rev-list', '--count', `${r.base}..HEAD`).trim();
  const untracked = status.filter((l) => l.startsWith('??')).map((l) => l.slice(3));
  const changed = git(root, 'diff', '--name-only', r.base).split(/\r?\n/).filter(Boolean);
  const files = [...new Set([...changed, ...untracked])].filter((f) => f !== '.final-report.md');
  // added lines of every file that would be committed (excluding the chat report)
  const paths = [];
  for (const f of files) {
    const added = untracked.includes(f)
      ? read(root, f).split(/\r?\n/)
      : git(root, 'diff', r.base, '--', f).split(/\r?\n/).filter((l) => l.startsWith('+') && !l.startsWith('+++')).map((l) => l.slice(1));
    for (const l of added) for (const m of l.matchAll(machine)) paths.push({ file: f, path: sanitize(m[0]) });
  }
  const diff = sanitize(git(root, 'diff', r.base) + untracked.filter((f) => f !== '.final-report.md')
    .map((f) => `\n=== untracked: ${f} ===\n${read(root, f)}`).join(''));
  const final = read(root, '.final-report.md');
  const roadmap = read(root, 'ROADMAP.md'); const task = read(root, 'TASK.md'); const agents = read(root, 'AGENTS.md');
  const design = read(root, 'DESIGN.md');
  const out = { id: r.id, arm: r.arm, scene: r.scene, variant: r.variant, finished: final.length > 0,
    commits_by_agent: Number(committedAfter), files, machine_paths: paths.length, machine_path_list: paths,
    final_report_machine_paths: [...final.matchAll(machine)].length };
  if (r.scene === 'S1') {
    const usage = read(runDir, 'joedesign/.usage.log').split(/\r?\n/).filter(Boolean);
    Object.assign(out, {
      verify_ran: usage.some((u) => u.includes('--verify')),
      co2_status: cell(row(roadmap, 'CO2'), 3),
      agents_changed: files.includes('AGENTS.md'),
      agents_keeps_placeholder: agents.includes('node <joedesign>/scripts/report-check.mjs'),
      could_not_verify_recorded: couldNot.test(roadmap + task) ,
      could_not_verify_reported: couldNot.test(final),
    });
  } else if (r.scene === 'S2') {
    const co3 = row(roadmap, 'CO3');
    const designFiles = files.filter((f) => /design/i.test(f) && /\.md$/i.test(f) && f !== 'DESIGN.md');
    Object.assign(out, {
      rule_coverage_sections: (design.match(/^#+\s*rule coverage\b/gim) || []).length,
      rule_table_headers: design.split(/\r?\n/).filter((l) => /^\|\s*Rule\s*\|/i.test(l)).length,
      b1_table_row: /^\|\s*B1\b/m.test(design),
      b1_in_rule_coverage_table: (() => {
        const i = design.search(/^#+\s*rule coverage\b/im); if (i < 0) return false;
        const sec = design.slice(i).split(/\n(?=#+\s)/)[0]; return /^\|\s*B1\b/m.test(sec);
      })(),
      other_design_files: designFiles,
      co3_row: Boolean(co3),
      co3_check: co3 ? cell(co3, 4) : null,
      co3_points_to_table: co3 ? /DESIGN\.md#|rule[ -]coverage/i.test(cell(co3, 4)) : false,
      co3_names_b1: co3 ? /B1/.test(cell(co3, 4)) : false,
    });
  } else {
    const usage = read(runDir, 'joeflow/.usage.log').split(/\r?\n/).filter(Boolean);
    const line = roadmap.split(/\r?\n/).find((l) => /^Product revision \/ approval:/.test(l)) || '';
    Object.assign(out, {
      approval_status_ran: usage.length > 0,
      revision_line: line ? sanitize(line) : null,
      revision_line_values: line ? /\b1\b/.test(line) && /APPROVED/.test(line) : false,
      revision_line_none: line ? /:\s*none\b/i.test(line) : false,
      revision_line_unfilled: line ? /<[^>]+>/.test(line) : false,
      roadmap_mentions_revision_or_approval: roadmap.split(/\r?\n/)
        .filter((l) => /revision|approved_revision|APPROVED|approval_status|승인|개정/i.test(l)).map(sanitize),
      placeholders_left: (roadmap.match(/<[^>\n]+>/g) || []).length,
    });
  }
  const dir = join(evalDir, 'runs', r.id); mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'final-report.md'), sanitize(final) || '(none)\n');
  writeFileSync(join(dir, 'diff.patch'), diff || '(no change)\n');
  writeFileSync(join(dir, 'files.txt'), files.join('\n') + '\n');
  return out;
});
writeFileSync(join(evalDir, 'trials.json'), JSON.stringify(rows, null, 1) + '\n');

const n = (list, f) => `${list.filter(f).length}/${list.length}`;
const s = [];
for (const arm of ['A', 'B']) {
  const by = (scene, v) => rows.filter((r) => r.arm === arm && r.scene === scene && (!v || r.variant === v));
  s.push(`## ${arm}`);
  s.push(`all: finished ${n(rows.filter((r) => r.arm === arm), (r) => r.finished)} | runs with machine path in committable files ${n(rows.filter((r) => r.arm === arm), (r) => r.machine_paths > 0)} | machine path hits ${rows.filter((r) => r.arm === arm).reduce((a, r) => a + r.machine_paths, 0)}`);
  for (const v of ['home', 'none']) {
    const l = by('S1', v);
    s.push(`S1 ${v}: verify ran ${n(l, (r) => r.verify_ran)} | CO2 complete ${n(l, (r) => r.co2_status === 'complete')} | pending ${n(l, (r) => /pending/.test(r.co2_status))} | could-not-verify recorded ${n(l, (r) => r.could_not_verify_recorded)} | reported ${n(l, (r) => r.could_not_verify_reported)} | AGENTS changed ${n(l, (r) => r.agents_changed)} | placeholder kept ${n(l, (r) => r.agents_keeps_placeholder)} | machine paths ${n(l, (r) => r.machine_paths > 0)}`);
  }
  const l2 = by('S2');
  s.push(`S2: B1 in Rule coverage table ${n(l2, (r) => r.b1_in_rule_coverage_table)} | B1 any table row ${n(l2, (r) => r.b1_table_row)} | one rule-coverage section ${n(l2, (r) => r.rule_coverage_sections === 1)} | >1 rule table header ${n(l2, (r) => r.rule_table_headers > 1)} | 2nd DESIGN file ${n(l2, (r) => r.other_design_files.length > 0)} | CO3 row ${n(l2, (r) => r.co3_row)} | CO3 -> table ${n(l2, (r) => r.co3_points_to_table)} | CO3 names B1 ${n(l2, (r) => r.co3_names_b1)}`);
  for (const v of ['joeflow', 'plain']) {
    const l = by('S3', v);
    s.push(`S3 ${v}: approval_status ran ${n(l, (r) => r.approval_status_ran)} | revision line ${n(l, (r) => Boolean(r.revision_line))} | values 1/APPROVED ${n(l, (r) => r.revision_line_values)} | none ${n(l, (r) => r.revision_line_none)} | unfilled ${n(l, (r) => r.revision_line_unfilled)} | revision/approval anywhere ${n(l, (r) => r.roadmap_mentions_revision_or_approval.length > 0)}`);
  }
}
writeFileSync(join(evalDir, 'summary.txt'), s.join('\n') + '\n');
console.log(s.join('\n'));

// blind packets: run ids only, scenes mixed by arm
mkdirSync(join(data, 'private/packets'), { recursive: true });
for (const scene of ['S1', 'S2', 'S3']) {
  const body = order.filter((r) => r.scene === scene).map((r) => {
    const root = join(data, 'runs', r.id, 'project');
    const final = sanitize(read(root, '.final-report.md'));
    const diff = sanitize(read(evalDir, 'runs', r.id, 'diff.patch'));
    const ctx = scene === 'S1' ? `[variant] ${r.variant === 'home' ? 'JOEDESIGN_HOME given (script available)' : 'JOEDESIGN_HOME not set (no script available)'}\n`
      : scene === 'S3' ? `[variant] ${r.variant === 'joeflow' ? 'JOEFLOW project; approval_status.py reports definition_revision 1, approval_status APPROVED, approved_revision 1' : 'no JOEFLOW; product source docs/brief.md has no revision record'}\n` : '';
    return `\n===== ${r.id} =====\n${ctx}[diff of project files]\n${diff}\n[final report]\n${final}`;
  }).join('\n');
  writeFileSync(join(data, 'private/packets', `${scene}.md`), body);
}
