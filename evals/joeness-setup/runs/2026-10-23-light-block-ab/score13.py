# Unblinds phase 13 (N = committed final 2daf420) verdicts and tallies them per case and arm.
import json, glob, collections, sys, os
sys.stdout.reconfigure(encoding="utf-8")
here = os.path.dirname(os.path.abspath(__file__))
key = json.load(open(os.path.join(here, "blind-key13.json")))
data = {d["id"]: d for d in json.load(open(os.path.join(here, "collected13.json"), encoding="utf-8"))}
pts = {"PASS": 1, "PARTIAL": 0.5, "FAIL": 0}
rows = []
for f in glob.glob(os.path.join(here, "verdicts13", "*.json")):
    v = json.load(open(f, encoding="utf-8-sig"))
    for lab, r in v["runs"].items():
        k = key[f"{v['case']}/{lab}"]
        d = data[k["id"]]
        rows.append(dict(case=v["case"], arm=k["arm"], v=r["verdict"], q=r.get("quality") or 0, fc=r.get("falseClaim"),
                         chars=sum(len(x) for x in d["replies"])))
json.dump(rows, open(os.path.join(here, "scores13.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
by = collections.defaultdict(list)
for r in rows: by[(r["case"], r["arm"])].append(r)
print(f"{'case':16}{"N":>24}")
for c in sorted({r["case"] for r in rows}):
    print(f"{c:16}" + "".join(f"{' '.join(x['v'][:4] for x in by[(c, a)]):>16} q{sum(x['q'] for x in by[(c, a)]) / max(1, len(by[(c, a)])):.1f}  " for a in "N"))
for a in "N":
    rs = [r for r in rows if r["arm"] == a]
    print(a, "score", sum(pts[r["v"]] for r in rs), "/", len(rs), "FAIL", sum(r["v"] == "FAIL" for r in rs),
          "falseClaims", sum(1 for r in rs if r["fc"]), "quality %.2f" % (sum(r["q"] for r in rs) / len(rs)),
          "replyChars %d" % (sum(r["chars"] for r in rs) / len(rs)))
