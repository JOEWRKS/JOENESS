# Phase 14 scoring: did new work land under its own new TASK heading, or under an existing (unrelated) entry?
import json, re, subprocess, pathlib, sys
sys.stdout.reconfigure(encoding='utf-8')
here = pathlib.Path(__file__).parent
trials = json.loads((here / 'trials14.json').read_text(encoding='utf-8'))
rows = []
for t in trials:
    root = t['root']
    base = subprocess.run(['git', '-C', root, 'show', 'HEAD:TASK.md'], capture_output=True, encoding='utf-8').stdout.splitlines()
    final = pathlib.Path(root, 'TASK.md').read_text(encoding='utf-8').splitlines()
    base_heads = {l for l in base if l.startswith('## ')}
    base_lines = set(base)
    head, misplaced, new_heads = None, [], []
    for l in final:
        if l.startswith('## '):
            head = l
            if l not in base_heads: new_heads.append(l)
            continue
        if l.strip() and l not in base_lines and head in base_heads:
            misplaced.append((head, l[:80]))
    rows.append({'id': t['id'], 'arm': t['arm'], 'newHeads': new_heads, 'misplaced': misplaced,
                 'pass': len(misplaced) == 0 and len(new_heads) >= 2})
(here / 'scores14.json').write_text(json.dumps(rows, ensure_ascii=False, indent=1), encoding='utf-8')
for r in rows:
    print(r['arm'], r['id'], 'PASS' if r['pass'] else 'FAIL', 'heads', len(r['newHeads']), 'misplaced', len(r['misplaced']), r['misplaced'][:2])
for a in ('N', 'T'):
    s = [r for r in rows if r['arm'] == a]
    print(a, 'pass', sum(r['pass'] for r in s), '/', len(s), '| any misplaced', sum(bool(r['misplaced']) for r in s))
