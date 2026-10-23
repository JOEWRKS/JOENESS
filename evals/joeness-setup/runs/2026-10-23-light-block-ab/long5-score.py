# Score the S1 pilot (B3 = v3 block, S = v3 + status-line sentence): after each turn, do ROADMAP's
# current/next lines reflect the new P7 stage, and does the next line still claim nothing is left?
import re, json, pathlib
here = pathlib.Path(__file__).parent
arms = {**json.loads((here / 'trials-long5.json').read_text()), **json.loads((here / 'trials-long6.json').read_text())}
out = {}
for tid, arm in arms.items():
    base = here / ('long6-snaps' if tid.startswith('l6') else 'long5-snaps') / tid
    rows = []
    base_nxt = None
    for t in sorted(base.iterdir()):
        rm = (t / 'ROADMAP.md').read_text(encoding='utf-8-sig')
        cur = re.search(r'^\*\*현재:\*\*(.*)$', rm, re.M).group(1)
        nxt = re.search(r'^\*\*다음 작업:\*\*(.*)$', rm, re.M).group(1)
        stage = re.search(r'^### P7 .*$', rm, re.M)
        base_nxt = nxt if base_nxt is None else base_nxt
        has_p7 = bool(stage)
        ok = (not has_p7) or (('P7' in cur or '장목' in cur) and nxt != base_nxt and '필수 잔여 없음' not in nxt)
        rows.append({'turn': t.name, 'p7_stage': stage.group(0)[:60] if stage else None,
                     'cur_mentions_p7': 'P7' in cur or '장목' in cur, 'next_mentions_p7': 'P7' in nxt or '장목' in nxt,
                     'next_says_nothing_left': '필수 잔여 없음' in nxt, 'S1_ok': ok})
    out[tid] = {'arm': arm, 'turns': rows, 'S1_ok_after_P7': f"{sum(r['S1_ok'] for r in rows if r['p7_stage'])}/{sum(1 for r in rows if r['p7_stage'])}"}
(here / 'long5-scores.json').write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
for tid, r in sorted(out.items(), key=lambda x: x[1]['arm']):
    print(r['arm'], tid, 'S1 ok after P7 created:', r['S1_ok_after_P7'],
          '|', ' '.join(f"{x['turn'][-2:]}:{'O' if x['S1_ok'] else 'X'}{'(nothing-left)' if x['next_says_nothing_left'] and x['p7_stage'] else ''}" for x in r['turns']))
