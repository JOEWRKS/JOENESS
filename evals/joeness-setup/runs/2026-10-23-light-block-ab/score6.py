# Phase 6 deterministic scoring: are all lines that restate status consistent after the stage moves?
import json, re, subprocess, pathlib

here = pathlib.Path(__file__).parent
trials = json.loads((here / 'trials6.json').read_text(encoding='utf-8'))

def row_status(roadmap, rid):
    m = re.search(r'^\|\s*' + rid + r'\s*\|[^|]*\|\s*([^|]*?)\s*\|', roadmap, re.M)
    return m.group(1) if m else '?'

def heading(roadmap, n):
    m = re.search(r'^## Stage ' + str(n) + r'\b.*$', roadmap, re.M)
    return m.group(0) if m else '?'

def current(roadmap):
    m = re.search(r'^\*\*Current:?\*\*.*$', roadmap, re.M)
    return m.group(0) if m else '?'

rows = []
for t in trials:
    root = pathlib.Path(t['root'])
    rm = (root / 'ROADMAP.md').read_text(encoding='utf-8')
    design = (root / 'DESIGN.md').read_text(encoding='utf-8')
    changed = subprocess.run(['git', '-C', str(root), 'status', '--short'], capture_output=True, text=True).stdout
    tests = subprocess.run(['node', '--test', 'main.test.mjs'], cwd=root, capture_output=True, text=True)
    cur, h2 = current(rm), heading(rm, 2)
    if t['case'] == 'design-to-impl':
        checks = {
            'D1 complete': row_status(rm, 'D1') == 'complete',
            'R3 complete+tests': row_status(rm, 'R3') == 'complete' and tests.returncode == 0 and 'cap' in (root / 'main.test.mjs').read_text(encoding='utf-8'),
            'stage heading fresh': 'before implementation' not in h2 and 'design review' not in h2,
            'current line fresh': 'awaiting user review' not in cur and 'implementation not started' not in cur,
            'DESIGN approval fresh': 'no user approval yet' not in design,
            'TASK updated': 'TASK.md' in changed,
        }
    else:
        checks = {
            'R4 complete': row_status(rm, 'R4') == 'complete',
            'stage2 heading complete': 'complete' in h2 and 'in progress' not in h2,
            'current line fresh': 'awaiting user visual check' not in cur and 'Stage 3' in cur,
            'TASK updated': 'TASK.md' in changed,
        }
    rows.append({'id': t['id'], 'case': t['case'], 'arm': t['arm'], 'pass': sum(checks.values()), 'of': len(checks),
                 'failed': [k for k, v in checks.items() if not v], 'current': cur, 'stage2': h2,
                 'stage3': heading(rm, 3), 'changed': changed.split()})

(here / 'scores6.json').write_text(json.dumps(rows, ensure_ascii=False, indent=1), encoding='utf-8')
for r in sorted(rows, key=lambda r: (r['case'], r['arm'])):
    print(r['case'], r['arm'], r['id'], f"{r['pass']}/{r['of']}", r['failed'])
for case in ('design-to-impl', 'stage-close'):
    for arm in ('L', 'P'):
        s = [r for r in rows if r['case'] == case and r['arm'] == arm]
        print(case, arm, sum(r['pass'] for r in s), '/', sum(r['of'] for r in s))
