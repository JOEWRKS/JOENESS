# MergeDrop longitudinal continuation A/B — bounded result

## Decision

**No unique material JOENESS benefit demonstrated.** In one actual historical MergeDrop repair chain, both fresh Astra agents continued a previous authentication repair without redoing it, fixed the next ranking-row defect, passed the independent ranking behavior oracle, and handed the current state to a further fresh agent without a file write or false Android/user-acceptance claim. Both arms retained the same 14 pre-existing EditMode failures. The experiment is complete under its one-run-per-arm stop rule; repeating this clear pair is not justified.

The original strict grader files say `pass: false` **in both arms**. They are not erased or relabeled: its `missingTests` array contains exactly `GameControllerStateTests.Awake_DoesNotStartLeaderboardAuthenticationBeforeRankingAction`, an earlier authentication oracle coupled to the historical private `_authenticationStarted` implementation. The prior [performance report](../2026-09-28-actual-performance-ab/report.md) already identified that oracle as invalid for alternative correct implementations. The current behavior-level ranking oracle passed in both arms; neither full suite had a new failure. The historical authentication change still lacks an independently valid target-device verification.

## Scope and provenance

- [Preregistration](plan.json) was committed at `025e7af` before any new model run. [Preparation amendments](amendments.md) and [inventory](inventory.json) were committed at `95e8fbf` before any new model run. The independent [grader](grade.mjs) was committed at `9ab5e5f` before grading.
- Source: each arm's completed `deferred-ranking-auth-r1` output from the prior real-code A/B. Only the prior agent's meaningful changes were frozen into the isolated copy; `SettingsIcon.png.meta` and `TimeManager.asset` line-ending-only Unity status noise was not claimed as work. This retains a real prior repair but is **not** a parallel pristine-start coding comparison.
- Runtime: app-bundled `codex-cli 0.158.0-alpha.2`, `gpt-6-astra`, `xhigh`, fresh `--ephemeral` sessions. Order: continuation Bare → JOENESS; read-only handoff JOENESS → Bare. Paired prompts matched by SHA-256 in [results](results). All four exited normally; no timeout or retry.
- Bare had no JOENESS package in its isolated home. JOENESS had the unchanged Core and sole `joeness-setup` skill. The copied project setup block matched its saved state hash. The historical project also contains `JOEWRKS-PROJECT` markers, so the current setup helper classifies a fresh Check as `legacy`; this is a fixture limitation, not a new application or a clean helper result.
- Live MergeDrop, personal JOENESS installation, Core, and skill sources were not changed. Temporary authentication copies were removed and verified absent from both isolated homes. Full Unity XML/logs remain under the isolated local trial root named in [plan.json](plan.json); bounded hashes/counts are in [grades](grades).
- Two exact JOENESS `responses/*.md` contain Markdown hard line breaks (two trailing spaces) on the opening report lines. `git diff --cached --check` flags those evidence bytes. They are preserved because the result records hash the original responses; editing them for whitespace would break provenance. Non-response evidence passes whitespace checking.

## Outcome by arm

| Criterion | Bare | JOENESS |
| --- | --- | --- |
| Previous authentication repair repeated or undone | No; frozen `GameController.cs` and `PlayGamesLeaderboard.cs` unchanged in continuation | No; same check |
| New ranking-row behavior oracle | 1/1 pass | 1/1 pass |
| Full EditMode after hidden oracle overlay | 218/232 pass; same 14 known failures; 0 new failures | 218/232 pass; same 14 known failures; 0 new failures |
| Original strict grader | Fail: one known invalid historical auth test missing | Same fail |
| Fresh handoff accuracy | Correctly separated committed auth repair, uncommitted ranking repair, 14 failures, Android/user-acceptance gap, next device check | Same material facts |
| Handoff write | None; identical before/after Git status, command-only events | None; identical before/after Git status, command-only events |
| Record scope | `TASK.md` plus `docs/DEVELOPMENT.md` | `TASK.md` only |

The saved [Bare](responses/handoff-bare.md) and [JOENESS](responses/handoff-joeness.md) handoffs are evidence of factual reconstruction, not proof that a human finds either easier to read. No human-blind comprehension rating was obtained in this run.

## Agent cost for the two new stages only

| Measure | Bare | JOENESS | JOENESS difference |
| --- | ---: | ---: | ---: |
| Wall time | 729,470 ms | 577,443 ms | −20.84% |
| Total input tokens, including cached | 2,010,986 | 1,448,464 | −27.97% |
| Noncached input + output tokens | 139,247 | 145,526 | +4.51% |
| Output tokens | 18,949 | 14,438 | −23.81% |
| Commands | 44 | 38 | −13.64% |

Direction differs by stage. JOENESS's continuation was 28.7% faster and used 9.8% fewer noncached-input-plus-output tokens; its handoff was 19.5% slower and used 39.8% more of that token measure. The pooled total-input decrease and noncached increase also point in opposite directions. One chained pair cannot establish a reliable speed or token saving, a billing result, or a general performance regression. The inherited earlier authentication run is excluded from this new-stage cost table; its costs and invalid-oracle limitation remain in the prior report.

## Remaining boundary

This validates a specific historical code continuation and factual AI-to-AI handoff at Unity EditMode level. It does **not** validate Android authentication, actual touch/layout, release build, human comprehension, or user acceptance. The live MergeDrop release status is unchanged. JOENESS may be useful as a project-recording/reporting aid, but this pair does not prove it improves task correctness over Bare Astra.
