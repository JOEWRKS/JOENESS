# Apply one comparison arm (B/T/F/L) to a pilot-3 fixture, plus a per-copy vitest cache dir.
import sys, pathlib, shutil
root, arm = pathlib.Path(sys.argv[1]), sys.argv[2]
here = pathlib.Path(__file__).parent
first = 'after real work, update TASK and the affected ROADMAP item.'
agents = (root / 'AGENTS.md').read_text(encoding='utf-8')
assert first in agents
if arm == 'T':
    agents = agents.replace(first, first + '\n  Each new piece of work gets its own dated TASK entry; never append it under an unrelated entry.', 1)
if arm == 'L':
    agents = agents.replace(first, first + '\n  After recording, run `node .joeness/record-check.mjs` and fix what it reports.', 1)
    shutil.copy(here / 'long4-tools' / 'record-check.mjs', root / '.joeness' / 'record-check.mjs')
(root / 'AGENTS.md').write_text(agents, encoding='utf-8', newline='\n')
if arm == 'F':
    task = (root / 'TASK.md').read_text(encoding='utf-8').rstrip('\n')
    task += '\n\n<!-- New entry format: add each new piece of work below as its own entry.\n## YYYY-MM-DD — work title\n- result, checks, links to evidence\n-->\n'
    (root / 'TASK.md').write_text(task, encoding='utf-8', newline='\n')
cfg = root / 'vitest.config.ts'
cfg.write_text(cfg.read_text(encoding='utf-8').replace("defineConfig({ test:", "defineConfig({ cacheDir: '.vitest-cache', test:"), encoding='utf-8', newline='\n')
with open(root / '.git' / 'info' / 'exclude', 'a', encoding='utf-8') as f: f.write('\n.vitest-cache/\n')
print(arm, 'ok')
