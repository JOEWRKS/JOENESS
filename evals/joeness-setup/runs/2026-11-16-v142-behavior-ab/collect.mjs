#!/usr/bin/env node
// Mechanical scoring, per-run evidence copies and the blind packet for the 46th run (S2 only).
// Adapted from the 45th collect.mjs: S2 judgement unchanged; leak metric widened (version string,
// JOENESS repo path, parent/arm mentions); blind packet uses shuffled p-ids, not run ids.
// usage: node collect.mjs <data-dir> <eval-dir> <subagent-transcript-dir> <judge-setup-script>
// Paths under <data-dir> are rewritten to <data>; user-home paths to <home>.
// <judge-setup-script> is the B-arm project-setup.ps1, used read-only for a final -Check.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { userInfo } from 'node:os';

const [data, evalDir, transcripts, judgeScript] = process.argv.slice(2);
const order = JSON.parse(readFileSync(join(data, 'private/assignment.json'), 'utf8'));
const read = (...p) => { const f = join(...p); return existsSync(f) ? readFileSync(f, 'utf8') : ''; };
const git = (cwd, ...a) => execFileSync('git', a, { cwd, encoding: 'utf8', maxBuffer: 1 << 26 });
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const dataForms = [data, data.replaceAll('/', '\\'), data.replaceAll('\\', '/'), data.replaceAll('\\', '\\\\'),
  data.replace(/^([A-Za-z]):/, (_, d) => '/' + d.toLowerCase()).replaceAll('\\', '/')];
// local profile folder and account name are taken at run time, never written here
const profileDir = new RegExp('<home>[\\\\/]+' + ['App', 'Data'].join('') + '[^\\s`\'"<>|]*', 'gi');
const userName = new RegExp(esc(userInfo().username), 'gi');
const sanitize = (t) => {
  for (const f of dataForms) t = t.replace(new RegExp(esc(f), 'gi'), '<data>');
  return t.replace(/[A-Za-z]:[\\/]+Users[\\/]+[^\\/\s`'"<>|]+/gi, '<home>').replace(/\/(?:c\/)?(?:Users|home)\/[^/\s`'"<>|]+/gi, '<home>')
    .replace(profileDir, '<temp>').replace(userName, '<user>');
};
const outsideWrite = /scratchpad/i;
// same pattern as project-setup.ps1 Get-SetupMachinePaths
const machine = /(?<![A-Za-z0-9])[A-Za-z]:[\\/][^\s`'"<>|]*|(?<![\\A-Za-z0-9])\\\\[A-Za-z0-9._$-]+\\[^\s`'"<>|]*|(?<![A-Za-z0-9._~-])\/(?:Users|home)\/[^\s`'"<>|]+/g;
const leak = /\b1\.4(?:\.\d)?\b/;
const leakRepo = /JOEWRKS[\\/]+JOENESS(?![-\w])|evals[\\/]joeness-setup/i;
const leakParent = /\b(?:arm|parent session|control arm|A\/B)\b|부모 세션|대조군|[AB] 팔|팔을|팔이/i;
const runPath = (id) => new RegExp('runs[\\\\/]+' + id + '(?![0-9])', 'i');
const row = (text, id) => text.split(/\r?\n/).find((l) => new RegExp(`^\\|\\s*${id}\\b`).test(l)) || '';
const cell = (line, n) => (line.split('|')[n] ?? '').trim();
const docs = ['AGENTS.md', 'ROADMAP.md', 'TASK.md', 'ISSUES.md', 'DESIGN.md'];

// transcripts: map "run rNN" description -> parsed jsonl -------------------------
const byRun = {};
for (const f of readdirSync(transcripts).filter((f) => f.endsWith('.meta.json'))) {
  const meta = JSON.parse(readFileSync(join(transcripts, f), 'utf8'));
  const m = /^run (r\d\d)$/.exec(meta.description || ''); if (!m) continue;
  const lines = readFileSync(join(transcripts, f.replace('.meta.json', '.jsonl')), 'utf8').split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l));
  byRun[m[1]] = lines;
}
const textOf = (c) => typeof c === 'string' ? c : Array.isArray(c) ? c.map((x) => x.text ?? (typeof x.content === 'string' ? x.content : textOf(x.content)) ?? '').join('\n') : '';
const digest = (lines) => {
  const calls = []; const results = {}; const ownText = []; let handback = '';
  for (const l of lines) {
    const c = l.message?.content; if (!Array.isArray(c)) continue;
    for (const b of c) {
      if (l.type === 'assistant' && b.type === 'text') ownText.push(b.text);
      if (l.type === 'assistant' && b.type === 'tool_use') {
        calls.push({ id: b.id, name: b.name, input: b.input });
        if (b.name === 'SubagentHandback') handback = b.input?.message ?? '';
      }
      if (b.type === 'tool_result') results[b.tool_use_id] = textOf(b.content);
    }
  }
  return { calls: calls.map((k) => ({ ...k, result: results[k.id] ?? '' })), ownText, handback };
};
const inputLine = (k) => k.input?.command ?? k.input?.file_path ?? k.input?.pattern ?? JSON.stringify(k.input ?? {});

mkdirSync(join(evalDir, 'runs'), { recursive: true });
const rows = order.map((r) => {
  const runDir = join(data, 'runs', r.id);
  const root = join(runDir, 'project');
  const t = digest(byRun[r.id] || []);
  const last = t.handback || t.ownText.at(-1) || '';
  const status = git(root, 'status', '--porcelain', '--untracked-files=all').split(/\r?\n/).filter(Boolean)
    .filter((l) => !l.endsWith('.final-report.md'));
  const commits = Number(git(root, 'rev-list', '--count', `${r.base}..HEAD`).trim());
  const committedFiles = git(root, 'diff', '--name-only', r.base, 'HEAD').split(/\r?\n/).filter(Boolean);
  const untracked = status.filter((l) => l.startsWith('??')).map((l) => l.slice(3));
  const changed = git(root, 'diff', '--name-only', r.base).split(/\r?\n/).filter(Boolean);
  const files = [...new Set([...changed, ...untracked])].filter((f) => f !== '.final-report.md');
  const hits = (diffText) => diffText.split(/\r?\n/).filter((l) => l.startsWith('+') && !l.startsWith('+++')).flatMap((l) => [...l.slice(1).matchAll(machine)].map((m) => sanitize(m[0])));
  const committedHits = [];
  for (const f of committedFiles.filter((f) => f !== '.final-report.md')) for (const p of hits(git(root, 'diff', r.base, 'HEAD', '--', f))) committedHits.push({ file: f, path: p });
  const pendingHits = [];
  for (const f of files) {
    const added = untracked.includes(f) ? read(root, f).split(/\r?\n/).map((l) => '+' + l).join('\n') : git(root, 'diff', 'HEAD', '--', f);
    for (const p of hits(added)) pendingHits.push({ file: f, path: p });
  }
  const diff = sanitize(git(root, 'diff', r.base) + untracked.map((f) => `\n=== untracked: ${f} ===\n${read(root, f)}`).join(''));
  const final = read(root, '.final-report.md');
  const setupCalls = t.calls.filter((k) => /project-setup\.ps1/.test(inputLine(k))).map((k) => {
    const cmd = inputLine(k);
    const mode = /-Apply\b/.test(cmd) ? 'apply' : /-Detach\b/.test(cmd) ? 'detach' : /-Check\b/.test(cmd) ? 'check' : 'other';
    const st = /"status"\s*:\s*"(\w+)"/.exec(k.result)?.[1] ?? (/error|exception/i.test(k.result) ? 'error' : 'unknown');
    const blk = /"blockers"\s*:\s*\[([^\]]*)\]/.exec(k.result)?.[1] ?? '';
    return { mode, status: st, blockers: sanitize(blk).slice(0, 240) };
  });
  const pool = [last, final, ...t.ownText, ...t.calls.map((k) => String(inputLine(k)))];
  const grab = (re) => pool.filter((x) => re.test(x)).map((x) => sanitize(x.match(new RegExp('.{0,60}(?:' + re.source + ').{0,60}', re.flags))?.[0] ?? ''));
  const leakHits = grab(leak); const leakRepoHits = grab(leakRepo); const leakParentHits = grab(leakParent);
  const fileArgs = t.calls.map((k) => String(k.input?.file_path ?? k.input?.path ?? '')).filter((p) => /^[A-Za-z]:|^\//.test(p));
  const outsideFileArgs = fileArgs.filter((p) => !runPath(r.id).test(p) && !/scratchpad/i.test(p)).map(sanitize);
  const out = { id: r.id, arm: r.arm, scene: r.scene, finished: final.length > 0, commits_by_agent: commits,
    uncommitted_left: status.map((l) => sanitize(l)), files, committed_files: committedFiles,
    committed_machine_paths: committedHits.length, committed_machine_path_list: committedHits,
    pending_machine_paths: pendingHits.length, pending_machine_path_list: pendingHits,
    final_report_machine_paths: [...final.matchAll(machine)].length,
    tool_calls: t.calls.length, setup_calls: setupCalls, leak_hits: leakHits, leak_repo_hits: leakRepoHits, leak_parent_hits: leakParentHits, outside_file_args: outsideFileArgs,
    used_session_scratchpad: t.calls.some((k) => outsideWrite.test(String(inputLine(k)))),
    used_browser: t.calls.some((k) => /Claude_Browser/.test(k.name)),
    read_skill_md: t.calls.some((k) => /joeness-setup[\\/]+SKILL\.md/i.test(String(inputLine(k)))),
    ends_with_question: /[?？]\s*$|할까요|드릴까요|원하시면/.test((final || last).trim().split(/\r?\n/).slice(-3).join(' ')) };
  const head = (f) => { try { return git(root, 'show', `HEAD:${f}`); } catch { return ''; } };
  if (r.scene === 'S1') {
    const agents = head('AGENTS.md');
    let judge = {};
    try { judge = JSON.parse(execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', judgeScript, '-Check', '-ProjectPath', root], { encoding: 'utf8' })); }
    catch (e) { try { judge = JSON.parse(e.stdout); } catch { judge = { status: 'error' }; } }
    Object.assign(out, {
      agents_committed: Boolean(agents),
      agents_keeps_placeholder: agents.includes('<joedesign>/scripts/report-check.mjs'),
      agents_machine_paths: [...agents.matchAll(machine)].length,
      state_committed: Boolean(head('.joeness/setup-state.json')),
      judge_check_status: judge.status, judge_check_warnings: (judge.warnings || []).map(sanitize),
      apply_blocked: setupCalls.some((c) => c.mode === 'apply' && c.status === 'blocked'),
      apply_current: setupCalls.some((c) => c.mode === 'apply' && c.status === 'current'),
      docs_committed: docs.filter((d) => head(d)),
      char_count_item: /글자\s*수/.test(head('ROADMAP.md') + head('TASK.md')),
    });
  } else {
    const design = read(root, 'DESIGN.md'); const roadmap = read(root, 'ROADMAP.md');
    const co3 = row(roadmap, 'CO3');
    const headers = design.split(/\r?\n/).filter((l) => /^\|\s*Rule\s*\|/i.test(l));
    const sec = (() => { const i = design.search(/^#+\s*rule coverage\b/im); return i < 0 ? '' : design.slice(i).split(/\n(?=#+\s)/)[0]; })();
    Object.assign(out, {
      rule_coverage_sections: (design.match(/^#+\s*rule coverage\b/gim) || []).length,
      rule_table_headers: headers.length,
      result_column: headers.some((h) => /\|\s*Result\s*\|/i.test(h)),
      result_cells: (() => {
        const cols = (headers[0] || '').split('|').map((c) => c.trim());
        const ri = cols.findIndex((c) => /^Result$/i.test(c));
        if (ri < 0) return [];
        return design.split(/\r?\n/).filter((l) => /^\|\s*C\d/.test(l)).map((l) => sanitize(cell(l, ri)).slice(0, 200));
      })(),
      c3_in_rule_coverage_table: /^\|\s*C3\b/m.test(sec),
      c3_rows_anywhere: (design.match(/^\|\s*C3\b/gm) || []).length,
      other_design_files: files.filter((f) => /design/i.test(f) && /\.md$/i.test(f) && f !== 'DESIGN.md'),
      co3_row: Boolean(co3),
      co3_status: co3 ? cell(co3, 3) : null,
      co3_check: co3 ? sanitize(cell(co3, 4)) : null,
      co3_points_to_table: co3 ? /DESIGN\.md#|rule[ -]coverage/i.test(cell(co3, 4)) : false,
      co3_names_c3: co3 ? /C3/.test(cell(co3, 4)) : false,
      co3_script_only: co3 ? /design-check/.test(cell(co3, 4)) && !/DESIGN\.md|rule[ -]coverage|C3/i.test(cell(co3, 4)) : false,
      check_script_changed: files.includes('scripts/design-check.mjs'),
    });
  }
  const dir = join(evalDir, 'runs', r.id); mkdirSync(join(dir, 'final-docs'), { recursive: true });
  writeFileSync(join(dir, 'final-report.md'), sanitize(final) || '(none)\n');
  writeFileSync(join(dir, 'last-message.txt'), sanitize(last) + '\n');
  writeFileSync(join(dir, 'diff.patch'), diff || '(no change)\n');
  writeFileSync(join(dir, 'files.txt'), files.join('\n') + '\n');
  for (const d of docs) if (existsSync(join(root, d))) writeFileSync(join(dir, 'final-docs', d), sanitize(read(root, d)));
  writeFileSync(join(dir, 'commands.log'), t.calls.map((k) => `> [${k.name}] ${sanitize(String(inputLine(k))).slice(0, 1500)}\n${sanitize(k.result).slice(0, 800)}\n`).join('\n'));
  return out;
});
writeFileSync(join(evalDir, 'trials.json'), JSON.stringify(rows, null, 1) + '\n');

const n = (list, f) => `${list.filter(f).length}/${list.length}`;
const s = [];
for (const arm of ['A', 'B']) {
  const all = rows.filter((r) => r.arm === arm); const by = (sc) => all.filter((r) => r.scene === sc);
  s.push(`## ${arm}`);
  s.push(`all: finished ${n(all, (r) => r.finished)} | runs with committed machine path ${n(all, (r) => r.committed_machine_paths > 0)} (hits ${all.reduce((a, r) => a + r.committed_machine_paths, 0)}) | runs with uncommitted machine path ${n(all, (r) => r.pending_machine_paths > 0)} | leak ${n(all, (r) => r.leak_hits.length > 0)} | leak(repo path) ${n(all, (r) => r.leak_repo_hits.length > 0)} | leak(parent/arm) ${n(all, (r) => r.leak_parent_hits.length > 0)} | file args outside run ${n(all, (r) => r.outside_file_args.length > 0)} | ends with question-like line ${n(all, (r) => r.ends_with_question)} | used session scratchpad ${n(all, (r) => r.used_session_scratchpad)} | used browser ${n(all, (r) => r.used_browser)} | read SKILL.md ${n(all, (r) => r.read_skill_md)}`);
  const l2 = by('S2');
  s.push(`S2: one rule-coverage section ${n(l2, (r) => r.rule_coverage_sections === 1)} | one rule table ${n(l2, (r) => r.rule_table_headers === 1)} | Result column ${n(l2, (r) => r.result_column)} | C3 in Rule Coverage table ${n(l2, (r) => r.c3_in_rule_coverage_table)} | C3 row once ${n(l2, (r) => r.c3_rows_anywhere === 1)} | 2nd DESIGN file ${n(l2, (r) => r.other_design_files.length > 0)} | CO3 row ${n(l2, (r) => r.co3_row)} | CO3 -> table ${n(l2, (r) => r.co3_points_to_table)} | CO3 names C3 ${n(l2, (r) => r.co3_names_c3)} | CO3 script only ${n(l2, (r) => r.co3_script_only)} | check script changed ${n(l2, (r) => r.check_script_changed)}`);
}
writeFileSync(join(evalDir, 'summary.txt'), s.join('\n') + '\n');
console.log(s.join('\n'));

// blind packet: shuffled p-ids only (no run id, no arm, no order) -------------------
mkdirSync(join(data, 'private/packets'), { recursive: true });
const hideRun = (txt, id) => txt.replace(new RegExp('runs[\\\\/]+' + id, 'g'), 'runs/<run>');
const body = [...order].sort((a, b) => Number(a.blind.slice(1)) - Number(b.blind.slice(1))).map((r) =>
  '\n===== ' + r.blind + ' =====\n[diff of project files vs fixture]\n' + hideRun(read(evalDir, 'runs', r.id, 'diff.patch'), r.id) +
  '\n[final report]\n' + hideRun(read(evalDir, 'runs', r.id, 'final-report.md'), r.id)).join('\n');
writeFileSync(join(data, 'private/packets', 'S2.md'), body);
