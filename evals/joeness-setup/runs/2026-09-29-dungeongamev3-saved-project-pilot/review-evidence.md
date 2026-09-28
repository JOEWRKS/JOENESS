# DungeonGameV3 saved-project handoff pilot — 2026-09-29

## Boundary

- Actual game worktree: `D:/JOEWRKS/.worktrees/T081-runtime-pass1` (detached HEAD `6e46b6d` at the read-only check).
- Codex saved project `JOENESS_TEST-03` (`927516c6-e74e-4b90-a45d-0e7fc80d9564`) points to that exact worktree. The earlier `JOEWRKS-Appdev` entry points elsewhere and was not changed.
- User approved a local pilot of the existing `joeness-setup` connection. The owned block in `AGENTS.md` and `.joeness/setup-state.json` were `current/clean` before and after this run. The game code, roadmap, checklist and task ledger were not edited for the pilot. The worktree already had an unrelated modified `docs/qa/content-scope-2026-09-27/inventory.json`.
- Fresh chat: `codex://threads/01a0e8cc-d7d1-7d30-bc35-b768bc18f7c5`. It was created inside the saved project with a read-only handoff prompt. The prompt did not name `AGENTS.md`, other document paths, JOENESS, or a six-field answer format. This tests a new chat in the correctly registered project, unlike the earlier projectless path-prompted trial. The visible thread result does not expose exact model/reasoning identity or the mechanism by which project instructions entered context.

## Observed result

- The fresh chat's cwd was the exact game worktree. Its first command read `ROADMAP.md` and `COMPLETION_CHECKLIST.md`; it later inspected `AGENTS.md`, `TASKS.md`, Git, product/operating contracts, code and bounded prior evidence. All visible commands were read-only. Post-run Git status still showed only the existing JOENESS block/state and the unrelated inventory modification.
- It distinguished playable implementation from game completion, the single checked scope-inventory item from unfinished experience items, prior test/device evidence from checks it did not rerun, and final user/PM approval from technical progress. It selected the next work from the current roadmap without replaying completed tickets or writing files.
- It found a real handoff ambiguity: `COMPLETION_CHECKLIST.md` B02 still says the T358 resonance candidate awaits a rule decision, while the same file's later T370 note and current `DECISIONS.md` establish the approved cap-6 rule. This is stale present-tense wording inside historical evidence, not proof of a current gameplay defect. No target-project correction was authorized by the read-only prompt.
- The answer used the six requested field concepts, but opened with a separate preamble, used `해결된 부분` for historical fixes despite making no correction in this read-only turn, and expanded into a long ID-heavy handoff. Factual boundary: useful. Non-developer readability and exact first-six-field form: not fully met and not human-rated.

## Interpretation and remaining gates

- Correct saved-project routing and current-file use are observed. The app's hidden instruction-injection mechanism is not directly exposed; the agent's behavior is consistent with receiving project rules but does not independently prove it. The game's pre-existing `AGENTS.md` already required roadmap-first reading, so that behavior cannot be attributed uniquely to JOENESS.
- No Bare/control arm, token comparison, normal game implementation cycle, independent new-owner comprehension rating, or final acceptance occurred. This does not close the JOENESS real-work or fresh-post-work-handoff release gates.
- The local pilot is not committed or pushed from the detached game worktree. Project publication and continuing use remain separate decisions.
