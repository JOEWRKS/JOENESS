# Between-turn change notice (optional, Claude Code)

Read only when proposing, revising or detaching this hook. It is an optional
offer for a Git project used with Claude Code, never part of the required setup.
Codex and other hosts do not run it; do not claim the notice there.

Problem it addresses: a commit lands between two user messages (a teammate, the
user, another session) and the agent reuses checks from an earlier turn. A
connection-body rule barely fixed this; the hook fixed it in Claude Code
(JOENESS evals 41st run: new commit noticed 10/10 vs 0/4, real CLI 5/5 vs 0/5).

[changes-hook.mjs](../scripts/changes-hook.mjs) keeps HEAD in
`.git/joeness-last-head`. On each user message it prints commits and changed
files since the agent's previous turn ended, plus a line that earlier checks of
those files are out of date. The Stop event (`--record`) records HEAD when the
agent finishes, so its own commits are not reported back. It prints nothing on
the first message or when HEAD did not move, and never blocks a prompt.

## Proposal

Offer it in the setup proposal as a separate yes/no item; setup is complete
without it. Show, and apply only after approval:
- Copy the script unchanged to `.claude/hooks/joeness-changes.mjs`.
- Add two entries to `.claude/settings.json` (shared with the team; offer
  `.claude/settings.local.json` for a personal-only install). Merge into
  existing `hooks`; never replace or reorder other entries:

```json
{"hooks":{
  "UserPromptSubmit":[{"hooks":[{"type":"command","command":"node .claude/hooks/joeness-changes.mjs"}]}],
  "Stop":[{"hooks":[{"type":"command","command":"node .claude/hooks/joeness-changes.mjs --record"}]}]
}}
```

Requires `node` and `git` on PATH. Settings are the project owner's; if the file
is invalid JSON, user-owned or policy-managed, report and stop instead of
rewriting it. Already open sessions need a restart to load the hook.

## Limits

- Reports commits only. Uncommitted edits by others are not detected.
- An interrupted turn may skip Stop, so the agent's own commits can be reported once.
- The notice is context, not enforcement or approval; the ordinary check rules decide.

## Detach

Remove only the two entries above and the hook file if unchanged, then
`.git/joeness-last-head`. Keep other hooks and settings. Report a changed hook
file or edited entry instead of deleting it.
