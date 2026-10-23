# Score long-context pilot 3 (appended-paragraph TASK tail): S1 status-line freshness, S2 record units, S3 duplication, sizes.
import re, json, pathlib
here = pathlib.Path(__file__).parent
STAGES = {'P7': ['H1', 'H2', 'H3'], 'P8': ['R1', 'R2', 'R3']}

def read(p):
    return p.read_text(encoding='utf-8-sig') if p.exists() else ''

def stage_state(rm, st):
    head = re.search(rf'^### {st} — .*?— (.+)$', rm, re.M)
    rows = {i: re.search(rf'^\| {i} \|[^|]*\| ([^|]+) \|', rm, re.M) for i in STAGES[st]}
    return head.group(1).strip() if head else None, {i: (m.group(1).strip() if m else None) for i, m in rows.items()}

def s1(rm):
    out = {}
    nxt = re.search(r'^\*\*다음 작업:\*\*(.*)$', rm, re.M)
    nxt = nxt.group(1) if nxt else ''
    for st in STAGES:
        head, rows = stage_state(rm, st)
        done = all(v and v.startswith('complete') for v in rows.values())
        any_started = any(v and not v.startswith('not started') for v in rows.values())
        h = head or ''
        ok = (done and h.startswith('complete')) or (not done and any_started and h.startswith('in progress')) or (not any_started and h.startswith('not started'))
        out[st] = {'head': h[:40], 'rows': rows, 'consistent': ok}
    out['next'] = nxt.strip()[:160]
    return out

def sections(task):
    parts = re.split(r'^(## .*)$', task, flags=re.M)
    return {parts[i].strip(): parts[i + 1] for i in range(1, len(parts) - 1, 2)}

res = {}
for tid in ['lc3a41f', 'lc3c86d']:
    base = here / 'long3-snaps' / tid
    turns = sorted(base.iterdir())
    rows, prev = [], None
    for t in turns:
        rm, task = read(t / 'ROADMAP.md'), read(t / 'TASK.md')
        secs = sections(task)
        grown, new = [], []
        if prev is not None:
            for k, v in secs.items():
                if k not in prev: new.append(k[3:60])
                elif len(v) > len(prev[k]) + 40: grown.append((k[3:60], len(v) - len(prev[k])))
        dup = {kw: len(re.findall(kw, rm + task)) for kw in ['Wágner|Wagner', 'Taraguchi', 'Soos']}
        rows.append({'turn': t.name, 'S1': s1(rm), 'new_sections': new, 'grown_old_sections': grown,
                     'S3_research_in_records': dup, 'task_kb': round(len(task.encode()) / 1024, 1),
                     'roadmap_kb': round(len(rm.encode()) / 1024, 1)})
        prev = secs
    res[tid] = rows
(here / 'long3-scores.json').write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding='utf-8')
for tid, rows in res.items():
    print('==', tid)
    for r in rows:
        s = r['S1']
        print(r['turn'], 'P7', s['P7']['head'][:22], s['P7']['consistent'], '| P8', s['P8']['head'][:22], s['P8']['consistent'],
              '| new', r['new_sections'], '| grown', r['grown_old_sections'], '| S3', r['S3_research_in_records'], '| TASK', r['task_kb'], 'KB')
# Pilot 3 extra: count "추가 —" paragraphs appended after the fixture line, and new "## " headings, per trial.
for tid in res:
    base = here / 'long3-snaps' / tid
    t0, tN = read(base / 'turn00' / 'TASK.md'), read(base / sorted(p.name for p in base.iterdir())[-1] / 'TASK.md')
    print(tid, 'appended 추가 paragraphs:', tN.count('\n2026-10-23 추가 —') - t0.count('\n2026-10-23 추가 —'),
          '| new ## headings:', len(re.findall(r'^## ', tN, re.M)) - len(re.findall(r'^## ', t0, re.M)))
