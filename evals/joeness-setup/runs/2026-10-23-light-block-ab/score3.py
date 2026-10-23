# Unblinds judge verdicts and tallies them per case and arm (PASS=1, PARTIAL=0.5, FAIL=0).
import json, os, glob, sys, collections
sys.stdout.reconfigure(encoding="utf-8")
here = os.path.dirname(os.path.abspath(__file__))
key = json.load(open(os.path.join(here, "blind-key3.json"), encoding="utf-8"))
data = {d["id"]: d for d in json.load(open(os.path.join(here, "collected.json"), encoding="utf-8"))}
pts = {"PASS": 1, "PARTIAL": 0.5, "FAIL": 0}
rows, missing = [], []
for f in sorted(glob.glob(os.path.join(here, "verdicts3", "*.json"))):
    v = json.load(open(f, encoding="utf-8"))
    case = v.get("case") or os.path.basename(f)[:-5]
    for label, r in v["runs"].items():
        k = key.get(f"{case}/{label}")
        if not k:
            missing.append(f"{case}/{label}"); continue
        d = data[k["id"]]
        rows.append({"case": case, "arm": k["arm"], "id": k["id"], "verdict": r["verdict"], "falseClaim": r.get("falseClaim"),
                     "quality": r.get("quality"), "note": r.get("note", ""), "tools": d["toolCalls"],
                     "replyChars": sum(len(x) for x in d["replies"])})
json.dump(rows, open(os.path.join(here, "scores3.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
by = collections.defaultdict(list)
for r in rows: by[(r["case"], r["arm"])].append(r)
cases = sorted({r["case"] for r in rows})
print(f"{'case':16}" + "".join(f"{a:>22}" for a in "ABC"))
for c in cases:
    line = f"{c:16}"
    for a in "ABC":
        rs = by.get((c, a))
        line += f"{'-':>22}" if not rs else f"{' '.join(r['verdict'][:4] for r in rs):>14} q{sum(r['quality'] or 0 for r in rs)/len(rs):.1f} {'FC' if any(r['falseClaim'] for r in rs) else '':>2}"
    print(line)
for a in "ABC":
    rs = [r for r in rows if r["arm"] == a]
    p1 = [r for r in rs if r["case"] not in ("op-conflict", "op-weak-idea", "mt-chain", "mt-issue")]
    p2 = [r for r in rs if r not in p1]
    s = lambda xs: f"{sum(pts[x['verdict']] for x in xs)}/{len(xs)}" if xs else "-"
    print(f"arm {a}: phase1 {s(p1)}  phase2 {s(p2)}  falseClaims {sum(1 for r in rs if r['falseClaim'])}  "
          f"avgQuality {sum(r['quality'] or 0 for r in rs)/max(1,len(rs)):.2f}  avgReplyChars {sum(r['replyChars'] for r in rs)/max(1,len(rs)):.0f}  avgTools {sum(r['tools'] for r in rs)/max(1,len(rs)):.1f}")
if missing: print("missing keys:", missing)
