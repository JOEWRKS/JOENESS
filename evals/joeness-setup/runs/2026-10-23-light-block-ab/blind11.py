# Builds one blinded packet per case: trials shuffled and relabeled, arm hidden. Key kept separately.
import json, os, random, re, sys
sys.stdout.reconfigure(encoding="utf-8")
here = os.path.dirname(os.path.abspath(__file__))
data = json.load(open(os.path.join(here, "collected11.json"), encoding="utf-8"))
plan = open(os.path.join(here, "plan.md"), encoding="utf-8").read()
os.makedirs(os.path.join(here, "packets11"), exist_ok=True)
rng = random.Random(11)
key = {}
for case in sorted({d["case"] for d in data}):
    items = [d for d in data if d["case"] == case]
    rng.shuffle(items)
    lines = [f"# Case: {case}\n"]
    for i, d in enumerate(items, 1):
        label = f"R{i}"
        key[f"{case}/{label}"] = {"id": d["id"], "arm": d["arm"]}
        # Strip absolute fixture paths so folder ids cannot leak the arm.
        scrub = lambda s: re.sub(r"[A-Za-z]:[/\\][^\s`)]*?fx[/\\]t[0-9a-f]{6}", "<project>", s or "")
        lines.append(f"\n\n========== {label} ==========\n")
        for n, (turn, reply) in enumerate(zip(d["turns"], d["replies"] + [""] * 3), 1):
            lines.append(f"\n--- Turn {n} user ---\n{turn}\n--- Turn {n} agent reply ---\n{scrub(reply)}\n")
        if len(d["replies"]) > len(d["turns"]):
            lines.append("\n(extra replies)\n" + "\n---\n".join(scrub(r) for r in d["replies"][len(d["turns"]):]))
        lines.append(f"\n--- Final state ---\nchanged files: {[s[3:] for s in d['changed']]}\ntest passes now: {d['testPass']}\nsecret string present in any file: {d['secretInFiles']}\n")
        lines.append("--- git diff (tracked files) ---\n" + scrub(d["diff"])[:6000] + "\n")
        for p, v in d["files"].items():
            if p.startswith("Library/"):
                lines.append(f"--- new file {p} ---\n{scrub(v)[:2500]}\n")
    open(os.path.join(here, "packets11", case + ".md"), "w", encoding="utf-8").write("".join(lines))
json.dump(key, open(os.path.join(here, "blind-key11.json"), "w", encoding="utf-8"), indent=1)
print(len(key), "labeled trials;", len(os.listdir(os.path.join(here, "packets11"))), "packets11")
