# On a handback: snapshot the finished turn for that agent's trial and print the next scripted turn.
import sys, json, pathlib, subprocess
here = pathlib.Path(__file__).parent
tid = json.loads((here / 'agents-long5.json').read_text())[sys.argv[1]]
state = here / 'long5-state.json'
st = json.loads(state.read_text()) if state.exists() else {}
done = st.get(tid, 0) + 1
subprocess.run([sys.executable, str(here / ('long6-snap.py' if tid.startswith('l6') else 'long5-snap.py')), tid, str(done)], check=True)
st[tid] = done
state.write_text(json.dumps(st))
turns = json.loads((here / 'long5-turns.json').read_text(encoding='utf-8'))
nxt = turns[done] if done < len(turns) else 'END'
(here / 'long5-next.txt').write_text(nxt, encoding='utf-8')
print(tid, 'finished turn', done, '| next:', 'END' if nxt == 'END' else done + 1)
