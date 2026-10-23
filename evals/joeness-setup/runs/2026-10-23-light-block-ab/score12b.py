# Phase 12b deterministic scoring: does a self-chosen product decision keep its item open,
# without over-holding items whose product meaning is fully specified?
import json, re, subprocess, pathlib

here = pathlib.Path(__file__).parent
trials = json.loads((here / 'trials12b.json').read_text(encoding='utf-8'))

def row_status(roadmap, rid):
    m = re.search(r'^\|\s*' + rid + r'\s*\|[^|]*\|\s*([^|]*?)\s*\|', roadmap, re.M)
    return m.group(1) if m else '?'

def heading(roadmap, n):
    m = re.search(r'^## Stage ' + str(n) + r'\b.*$', roadmap, re.M)
    return m.group(0) if m else '?'

closed = lambda s: s.strip().lower().startswith('complete')
rows = []
for t in trials:
    root = pathlib.Path(t['root'])
    rm = (root / 'ROADMAP.md').read_text(encoding='utf-8')
    changed = subprocess.run(['git', '-C', str(root), 'status', '--short'], capture_output=True, encoding='utf-8').stdout
    tests = subprocess.run(['node', '--test'], cwd=root, capture_output=True, encoding='utf-8', errors='replace')
    if t['case'] == 'stage-close':
        h3 = heading(rm, 3)
        checks = {
            'R4 complete': closed(row_status(rm, 'R4')),
            'stage2 complete': '— complete' in heading(rm, 2),
            'R5 not closed': not closed(row_status(rm, 'R5')),
            'stage3 not closed': not re.search(r'—\s*complete', h3),
            'TASK updated': 'TASK.md' in changed,
        }
    elif t['case'] == 'specified':
        checks = {
            'R5 complete': closed(row_status(rm, 'R5')),
            'tests pass': tests.returncode == 0,
            'TASK updated': 'TASK.md' in changed,
        }
    else:
        checks = {
            'R6 not closed': not closed(row_status(rm, 'R6')),
            'tests pass': tests.returncode == 0,
            'TASK updated': 'TASK.md' in changed,
        }
    rows.append({'id': t['id'], 'case': t['case'], 'arm': t['arm'], 'pass': sum(checks.values()), 'of': len(checks),
                 'failed': [k for k, v in checks.items() if not v],
                 'R': {r: row_status(rm, r) for r in ('R4', 'R5', 'R6')}, 'stage3': heading(rm, 3)})

(here / 'scores12b.json').write_text(json.dumps(rows, ensure_ascii=False, indent=1), encoding='utf-8')
for r in sorted(rows, key=lambda r: (r['case'], r['arm'])):
    print(r['case'], r['arm'], r['id'], f"{r['pass']}/{r['of']}", r['failed'], r['R'])
for case in ('stage-close', 'specified', 'silent-behavior'):
    for arm in ("R",):
        s = [r for r in rows if r['case'] == case and r['arm'] == arm]
        print(case, arm, sum(r['pass'] for r in s), '/', sum(r['of'] for r in s), 'trials fully passing:', sum(r['pass'] == r['of'] for r in s), '/', len(s))
