# On a handback: snapshot the finished turn for that agent's trial and print the next scripted turn.
import sys, json, pathlib, subprocess
here = pathlib.Path(__file__).parent
tid = json.loads((here / 'agents-long4.json').read_text())[sys.argv[1]]
state = here / 'long4-state.json'
st = json.loads(state.read_text()) if state.exists() else {}
done = st.get(tid, 0) + 1
subprocess.run([sys.executable, str(here / 'long4-snap.py'), tid, str(done)], check=True)
st[tid] = done
state.write_text(json.dumps(st))
turns = json.loads((here / 'long3-turns.json').read_text(encoding='utf-8'))
nxt = turns[done] if done < len(turns) else 'END'
(here / 'long4-next.txt').write_text(nxt, encoding='utf-8')
print(tid, 'finished turn', done, '| next:', 'END' if nxt == 'END' else done + 1)
