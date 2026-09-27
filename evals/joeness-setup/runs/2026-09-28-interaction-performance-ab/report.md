# JOENESS interaction-performance A/B — bounded result

## Scope and runtime

- Eight fresh, isolated Git projects: two historical MergeDrop defects, Bare and JOENESS 0.2, two repetitions per arm. Order and prompts are in `plan.json`.
- Runtime: app-bundled `codex-cli 0.158.0-alpha.2`, `gpt-6-astra`, `xhigh`; 15-minute cap per agent run. All eight valid runs exited normally without timeout.
- Treatment used the unchanged JOENESS Independent Judgment Core and `joeness-setup` project connection. Core SHA-256: `f360b48be1b4143035f61fa20149a3249c60dea2e7f12cffa8bf1e8918f4f6a9`; skill SHA-256: `9a36f42f0094c5e60bd039be64fc199e983a591c51063767165efb80103647aa`.
- Agent tasks did not see the hidden tests. The UI test dispatches Unity pointer drag events to the actual scene control; the restart test runs the actual scene and physics/game loop. These are scripted Unity interactions, not human play, device testing, or visual screenshot review. The source product worktree was not edited.

## Outcomes

| Case / repetition | Bare hidden / full | JOENESS hidden / full | Original strict result |
| --- | --- | --- | --- |
| Collection swipe 1 | 1/1; 187/187 | 1/1; 196/196 | both pass |
| Collection swipe 2 | 1/1; 192/192 | 1/1; 194/194 | both pass |
| Restart danger 1 | 2/2; 27/27 | 2/2; 27/27 | both pass |
| Restart danger 2 | 2/2; 27/28 | 2/2; 27/27 | Bare fail, JOENESS pass |

All eight repairs passed their hidden target-interaction checks. Under the preregistered strict rule (hidden interaction plus no new suite failure), the **original** score was Bare 3/4 and JOENESS 4/4. The single Bare failure was its own newly added `WarningZoneTests.LeavingDanger_ResetsTheContinuousInterval`, not the hidden restart test. It expected `_dangerTime` zero after moving a frozen Rigidbody2D and waiting one physics step plus one frame, but observed `1.00107801`. A diagnostic-only rerun of that exact test failed again at `1.00152385` (local NUnit XML SHA-256 `15201b254a094c5891858f24102b32770ddd01fe45fed7d96f78246da2ec462f`); it did not alter the original grade.

Post-run investigation in [`diagnostic-adjudication.md`](diagnostic-adjudication.md) found the test itself unreliable: it also passed/fail intermittently on the historical known-good implementation, and a failing run showed the fruit never actually moved below the warning line. With only the test movement corrected, the Bare implementation passed that test 3/3 and the full EditMode suite 28/28. The original score and failure evidence remain unchanged, but its one-run strict difference is **not valid evidence of a JOENESS coding advantage**.

## Agent cost only (excludes fixture preparation and independent Unity grading)

| Measure, four runs per arm | Bare | JOENESS | JOENESS difference |
| --- | ---: | ---: | ---: |
| Wall time | 2,739,172 ms | 2,395,949 ms | −12.53% |
| Total input tokens, including cached | 7,112,931 | 7,790,316 | +9.52% |
| Noncached input + output tokens | 406,543 | 384,618 | −5.39% |
| Output tokens | 72,620 | 62,334 | −14.16% |
| Command executions | 127 | 145 | +14.17% |

Pairwise direction varied: JOENESS was faster for collection swipe 1 and restart danger 2, but slower for collection swipe 2 and restart danger 1. It also used more commands overall, including task-record updates. Four runs per arm and two defect types cannot establish a stable time, token, or accuracy advantage. Total input and noncached-plus-output move in opposite directions; neither is a measured billing claim.

## Evidence integrity and limitations

- `results/` holds per-run runtime identity, thread, token counts, command count, wall time, response hash, and authentication-copy removal flag. `grades/` holds hidden/full NUnit counts and exact Unity XML hashes. `responses/` contains agent final answers. The original eight-run raw Unity logs/XML and isolated worktrees remain under the local trial root named in `plan.json`; a bounded subset of diagnostic XML is in `diagnostic-evidence/`.
- The initial system CLI rejected Astra before a valid run; its record is retained in `runtime-preflight-failures/`. The first UI hidden grade used an incomplete synthetic drag event (missing `pressPosition`); its invalid record remains in `invalid-oracle-grades/`. The same Bare agent output was regraded under the corrected event. `amendments.md` records both corrections and two grader-only Git status/stderr issues. No completed model run was repeated to erase an unfavorable outcome.
- Independent grader scripts passed 12/12 Node tests. The Bare test failure is attributable to an unverified movement precondition in that test; no corresponding product regression was observed. The diagnostic is separate from the preregistered score and does not retrospectively erase its failed record. No actual touch-device interaction, visual inspection, release build, or production deployment was tested.

Conclusion: JOENESS did not show a demonstrated target-interaction accuracy improvement over Bare in this bounded A/B. It also did not show a stable token or time penalty or saving. The original strict-grade advantage was caused by an unreliable agent-authored test and must not be treated as product superiority.

Post-run supplement: [`rendered-validation/report.md`](rendered-validation/report.md) retains actual Bare/JOENESS collection before/after screen pixels at 1101×510, alongside failed exact-size test results. This does not change the original grades; target desktop/mobile visual proof remains unverified.
