# Infrastructure attempt 01

- Scope: `reading-shelf-v1` Bare stage 1, before any model turn.
- Fault: the Node runner launched `codex exec` with an open stdin pipe. The CLI
  waited for EOF; no `turn.completed` event or response file was produced.
- Inspection: the fixture Git worktree remained clean. No stage result file or
  response file existed.
- Action: stopped only the evaluation runner and its child CLI process; patched
  the runner to close stdin immediately after spawn. This is the one permitted
  infrastructure rerun, not a repeated model result.
