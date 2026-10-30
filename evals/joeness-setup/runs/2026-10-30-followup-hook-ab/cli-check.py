# 41st run, CLI check: does the real Claude Code CLI run the project's UserPromptSubmit hook and hand its output to the
# model? Two single-turn sessions on fresh H fixtures (hook state recorded at build = "previous message"):
#   c1: teammate commit M2 lands after that point -> hook should print it.   c0: no commit -> hook should stay silent.
# Usage: python cli.py build | python cli.py run c1|c0
import json, os, pathlib, subprocess, sys, uuid
HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from build import build
CLI = r'C:\Users\tjdwo\AppData\Roaming\Claude\claude-code\2.1.309\9078b9c1d466\claude.exe'
TOOLS = ('Read,Edit,Write,Glob,Grep,Bash(git status:*),Bash(git diff:*),Bash(git log:*),Bash(git show:*),'
         'Bash(npm run:*),Bash(node:*),Bash(ls:*)')
PRE = ('You are working in the project folder {fx}. Work only inside this folder. node_modules and .browsers are shared '
       'links to another checkout; do not modify, install or delete anything in them. Read AGENTS.md and follow it. Do not '
       'make git commits, branches or tags, and do not deploy or contact external services. Reply in the user\'s '
       'language.\n\nUser message:\n좋아, H5 완료로 기록해줘.')
M2 = ('\n\n/* 휴대폰: 이름 한 줄 유지 */\n@media (max-width: 480px) {\n  .row { overflow: hidden; }\n'
      '  .name { white-space: nowrap; }\n  .toggle { flex: 0 1 44px; min-width: 0; }\n}\n')
DROP = ('CLAUDE_CODE_SESSION_ID', 'CLAUDE_CODE_CHILD_SESSION', 'CLAUDE_CODE_HOST_SESSION_ID', 'CLAUDE_CODE_TERMINAL_MCP_TOOLS',
        'CLAUDE_CODE_REPORT_FINDINGS', 'CLAUDE_CODE_ENABLE_ASK_USER_QUESTION_TOOL')
if sys.argv[1] == 'build':
    for tid in ['c1', 'c0']:
        fx = HERE / 'cli' / tid; build(fx, 'H')
        if tid == 'c1':
            css = fx / 'src/settings.css'
            css.write_text(css.read_text(encoding='utf-8').rstrip('\n') + M2, encoding='utf-8', newline='\n')
            subprocess.run(['git', '-c', 'user.name=teammate', '-c', 'user.email=mate@local', 'commit', '-q', '-m',
                            'fix: 휴대폰에서 습관 이름 한 줄 유지', '--', 'src/settings.css'], cwd=fx, check=True)
        print(tid, 'built')
else:
    tid = sys.argv[2]; fx = HERE / 'cli' / tid; out = HERE / 'cli' / f'{tid}-run'; out.mkdir(exist_ok=True)
    sid = str(uuid.uuid4()); (out / 'session.txt').write_text(sid)
    cmd = [CLI, '-p', PRE.format(fx=fx.as_posix()), '--output-format', 'stream-json', '--verbose', '--model',
           'claude-opus-5-5', '--setting-sources', 'project', '--strict-mcp-config', '--permission-mode', 'acceptEdits',
           '--allowedTools', TOOLS, '--session-id', sid]
    env = {k: v for k, v in os.environ.items() if k not in DROP}
    r = subprocess.run(cmd, cwd=fx, env=env, capture_output=True, text=True, encoding='utf-8', errors='replace',
                       stdin=subprocess.DEVNULL, timeout=1800)
    (out / 'stream.jsonl').write_text(r.stdout, encoding='utf-8'); (out / 'err.txt').write_text(r.stderr, encoding='utf-8')
    print(tid, 'exit', r.returncode)
