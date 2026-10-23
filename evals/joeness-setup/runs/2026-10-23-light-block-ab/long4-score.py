# Score the B/T/F/L comparison on the pilot-3 setup: where each turn's TASK record went
# (own new entry / entry the agent created earlier / pre-existing old entry), plus S1 status-line consistency.
import re, json, pathlib, sys
here = pathlib.Path(__file__).parent
sys.path.insert(0, str(here))
from importlib import util
spec = util.spec_from_file_location('s2', here / 'long2-score.py')
TRIALS = {**{t: 'B' for t in ['lc3a41f', 'lc3c86d']}, **json.loads((here / 'trials-long4.json').read_text())}
SNAPS = {t: (here / ('long3-snaps' if t.startswith('lc3') else 'long4-snaps') / t) for t in TRIALS}
H2_TARGET = '새 채팅 인수'  # H2 legitimately edits this old entry

def read(p): return p.read_text(encoding='utf-8-sig') if p.exists() else ''
def sections(task):
    task = re.sub(r'<!--.*?-->', '', task, flags=re.S)
    parts = re.split(r'^(## .*)$', task, flags=re.M)
    return {parts[i].strip(): parts[i + 1] for i in range(1, len(parts) - 1, 2)}
def stage_ok(rm, st, items):
    head = re.search(rf'^### {st} — .*?— (.+)$', rm, re.M)
    rows = [re.search(rf'^\| {i} \|[^|]*\| ([^|]+) \|', rm, re.M) for i in items]
    rows = [r.group(1).strip() if r else '' for r in rows]
    h = head.group(1).strip() if head else ''
    done = all(r.startswith('complete') for r in rows); started = any(not r.startswith('not started') for r in rows)
    return (done and h.startswith('complete')) or (not done and started and h.startswith('in progress')) or (not started and h.startswith('not started'))

out = {}
for tid, arm in TRIALS.items():
    turns = sorted(SNAPS[tid].iterdir())
    base = sections(read(turns[0] / 'TASK.md'))
    prev, own, mine, old, s1 = base, 0, 0, 0, []
    for t in turns[1:]:
        cur = sections(read(t / 'TASK.md')); rm = read(t / 'ROADMAP.md')
        s1.append(stage_ok(rm, 'P7', ['H1', 'H2', 'H3']) and stage_ok(rm, 'P8', ['R1', 'R2', 'R3']))
        new = [k for k in cur if k not in prev]
        grown_old = [k for k in cur if k in base and k in prev and len(cur[k]) > len(prev[k]) + 40 and H2_TARGET not in k]
        grown_mine = [k for k in cur if k not in base and k in prev and len(cur[k]) > len(prev[k]) + 40]
        if new: own += 1
        elif grown_mine: mine += 1
        if grown_old: old += 1
        prev = cur
    out[tid] = {'arm': arm, 'own_new_entry_turns': own, 'appended_to_own_entry_turns': mine,
                'appended_to_old_entry_turns': old, 'S1_ok': f'{sum(s1)}/{len(s1)}'}
(here / 'long4-scores.json').write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
for tid, r in sorted(out.items(), key=lambda x: x[1]['arm']):
    print(r['arm'], tid, 'own-new', r['own_new_entry_turns'], '| own-topic append', r['appended_to_own_entry_turns'],
          '| OLD append', r['appended_to_old_entry_turns'], '| S1', r['S1_ok'])
