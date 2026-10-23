# Snapshot record files of a long-context trial after a turn: python long-snap.py <trial-id> <turn>
import sys, shutil, pathlib, subprocess
tid, turn = sys.argv[1], sys.argv[2]
here = pathlib.Path(__file__).parent
root = here / 'fx-long5' / tid
dst = here / 'long5-snaps' / tid / f'turn{int(turn):02d}'
dst.mkdir(parents=True, exist_ok=True)
for f in ['ROADMAP.md', 'TASK.md', 'ISSUES.md', 'DESIGN.md']:
    if (root / f).exists(): shutil.copy2(root / f, dst / f)
lib = root / 'Library'
if lib.exists(): shutil.copytree(lib, dst / 'Library', dirs_exist_ok=True)
st = subprocess.run(['git', '-C', str(root), 'status', '--porcelain'], capture_output=True, text=True, encoding='utf-8').stdout
(dst / 'git-status.txt').write_text(st, encoding='utf-8')
print('snap', tid, turn, len(st.splitlines()), 'changed')
