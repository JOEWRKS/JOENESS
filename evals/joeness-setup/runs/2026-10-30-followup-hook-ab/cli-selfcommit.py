# 1.2.0 hook, real CLI check: the agent's own commit in turn 1 must not be reported in turn 2, while a teammate
# commit landing between the turns must be. One 2-turn session on a tiny repo with the shipped hook installed.
# Usage: python selfcommit.py build | python selfcommit.py turn 1|2
import json, os, pathlib, shutil, subprocess, sys, uuid
HERE = pathlib.Path(__file__).resolve().parent
SRC = pathlib.Path(r'D:\JOEWRKS\.claude-worktrees\JOENESS-light\skills\joeness-setup\scripts\changes-hook.mjs')
CLI = r'C:\Users\tjdwo\AppData\Roaming\Claude\claude-code\2.1.309\9078b9c1d466\claude.exe'
DROP = ('CLAUDE_CODE_SESSION_ID', 'CLAUDE_CODE_CHILD_SESSION', 'CLAUDE_CODE_HOST_SESSION_ID', 'CLAUDE_CODE_TERMINAL_MCP_TOOLS',
        'CLAUDE_CODE_REPORT_FINDINGS', 'CLAUDE_CODE_ENABLE_ASK_USER_QUESTION_TOOL')
SETTINGS = {'hooks': {
    'UserPromptSubmit': [{'hooks': [{'type': 'command', 'command': 'node .claude/hooks/joeness-changes.mjs'}]}],
    'Stop': [{'hooks': [{'type': 'command', 'command': 'node .claude/hooks/joeness-changes.mjs --record'}]}]}}
FX = HERE / 'selfcommit' / 'fx'; OUT = HERE / 'selfcommit'
MSGS = ['notes.md 끝에 "- 회의 메모 정리" 한 줄을 추가하고 "docs: 회의 메모 항목 추가" 메시지로 커밋해 줘.',
        '지금 저장소 상태 짧게 알려 줘.']
def git(*a, **k): return subprocess.run(['git', '-c', 'user.name=dev', '-c', 'user.email=dev@local', *a], cwd=FX, check=True, **k)
if sys.argv[1] == 'build':
    if FX.exists(): shutil.rmtree(FX)
    (FX / '.claude/hooks').mkdir(parents=True)
    (FX / 'notes.md').write_text('# 메모\n\n- 첫 항목\n', encoding='utf-8', newline='\n')
    (FX / 'app.css').write_text('body { margin: 0; }\n', encoding='utf-8', newline='\n')
    (FX / '.claude/settings.json').write_text(json.dumps(SETTINGS, indent=2) + '\n', encoding='utf-8', newline='\n')
    shutil.copy(SRC, FX / '.claude/hooks/joeness-changes.mjs')
    git('init', '-q'); git('add', '.'); git('commit', '-q', '-m', 'base')
    (OUT / 'sid.txt').write_text(str(uuid.uuid4())); print('built')
else:
    n = int(sys.argv[2]); sid = (OUT / 'sid.txt').read_text().strip()
    if n == 2:  # teammate commit between the turns
        (FX / 'app.css').write_text('body { margin: 0; padding: 8px; }\n', encoding='utf-8', newline='\n')
        git('commit', '-q', '-m', 'style: 여백 추가', '--', 'app.css')
    cmd = [CLI, '-p', MSGS[n - 1]] + (['--session-id', sid] if n == 1 else ['--resume', sid])
    cmd += ['--output-format', 'stream-json', '--verbose', '--model', 'claude-opus-5-5', '--setting-sources', 'project',
            '--strict-mcp-config', '--permission-mode', 'acceptEdits', '--allowedTools',
            'Read,Edit,Write,Bash(git status:*),Bash(git log:*),Bash(git diff:*),Bash(git add:*),Bash(git commit:*)']
    env = {k: v for k, v in os.environ.items() if k not in DROP}
    r = subprocess.run(cmd, cwd=FX, env=env, capture_output=True, text=True, encoding='utf-8', errors='replace',
                       stdin=subprocess.DEVNULL, timeout=1800)
    (OUT / f't{n}.jsonl').write_text(r.stdout, encoding='utf-8'); (OUT / f't{n}-err.txt').write_text(r.stderr, encoding='utf-8')
    log = subprocess.run(['git', 'log', '--oneline'], cwd=FX, capture_output=True, text=True, encoding='utf-8').stdout
    state = (FX / '.git/joeness-last-head').read_text().strip()
    print('exit', r.returncode, '| state', state[:7], '\n' + log)
