# Phase 9 scoring: does a persistent status-word legend in ROADMAP keep the open item's status in the standard words?
import json, re, pathlib

here = pathlib.Path(__file__).parent
trials = json.loads((here / 'trials9.json').read_text(encoding='utf-8'))
words = ['not started', 'in progress', 'verification pending', 'on hold', 'complete', 'removed from scope']

def row_status(roadmap, rid):
    m = re.search(r'^\|\s*' + rid + r'\s*\|[^|]*\|\s*([^|]*?)\s*\|', roadmap, re.M)
    return m.group(1) if m else '?'

rows = []
for t in trials:
    rm = (pathlib.Path(t['root']) / 'ROADMAP.md').read_text(encoding='utf-8')
    item = 'R5' if t['case'] == 'stage-close' else 'R6'
    st = row_status(rm, item)
    low = st.lower()
    rows.append({'id': t['id'], 'case': t['case'], 'arm': t['arm'], 'status': st,
                 'open': not low.startswith('complete'),
                 'exact': low in words,
                 'leads': any(low.startswith(w) for w in words) and not low.startswith('complete')})

(here / 'scores9.json').write_text(json.dumps(rows, ensure_ascii=False, indent=1), encoding='utf-8')
for r in sorted(rows, key=lambda r: (r['case'], r['arm'])):
    print(r['case'], r['arm'], r['id'], 'open' if r['open'] else 'CLOSED', 'exact' if r['exact'] else '-', '|', r['status'])
for case in ('stage-close', 'silent-behavior'):
    for arm in ('L', 'V'):
        s = [r for r in rows if r['case'] == case and r['arm'] == arm]
        if s:
            print(case, arm, 'open', sum(r['open'] for r in s), 'exact', sum(r['exact'] for r in s), 'leads-with-word', sum(r['leads'] for r in s), '/', len(s))
