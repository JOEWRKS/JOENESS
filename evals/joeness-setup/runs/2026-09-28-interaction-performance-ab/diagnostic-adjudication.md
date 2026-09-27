# Post-run adjudication: Bare restart test failure

The original eight-run A/B and its grades are frozen. This is a separate, diagnostic-only investigation of `restart-danger-r2-bare` after the score was recorded. No model run, prompt, product source, or original grade was changed.

## Defect contract and baseline

- Observed: Bare's added `WarningZoneTests.LeavingDanger_ResetsTheContinuousInterval` failed in the full Unity EditMode suite with `_dangerTime = 1.00107801` instead of zero. Its hidden restart PlayMode tests both passed.
- Expected: after a fruit actually leaves the warning line, the continuous-danger timer returns to zero.
- Environment: Unity `6000.3.21f1`, Game scene, isolated historical MergeDrop project. Bare test source SHA-256 `371d4f7f8b4756c378923a581fbe570e1d414286d4e972f251681158cc97ed65`.
- Reproduction: same original test failed on Bare in 3/4 observed runs (including the original full-suite grade) and on the historical known-good restart implementation in 2/3 runs. Thus failure did not track the Bare repair uniquely.

## Hypotheses and discriminating evidence

| Hypothesis | Prediction | Observation | Status |
| --- | --- | --- | --- |
| Bare's danger-reset code regressed the leave-zone behavior | Original test fails on Bare but passes consistently on historical known-good code | Original test also failed on known-good code 2/3 times; both implementations have the same danger `Update`/trigger logic | Contradicted as explanation for this score difference |
| Test's position assignment does not reliably establish the required below-line state | Failing run can show fruit still above the line when timer is checked | One-shot position assertion failed at `6.19999981` with warning line `5.69999981` | Supported directly |
| `FreezeAll` constraint alone causes the failure | Releasing constraints before the original `Rigidbody2D.position` assignment makes the fruit leave | Position assertion still failed 3/3 | Contradicted as sufficient explanation |
| Direct transform movement with physics synchronization establishes the intended input | Fruit crosses the line; timer check passes | Historical known-good code passed 3/3; Bare code passed 3/3 focused and 28/28 full EditMode | Supported in this fixture |

The production `WarningZone.Update` reads `piece.transform.position.y`. The original test wrote `fruit.Body.position` and never verified that `transform.position.y` changed. On an instrumented failure it had not changed, so the timer correctly remained nonzero for a fruit still above the line. The exact Unity timing/engine mechanism behind the intermittent position mismatch was not isolated and is not required to adjudicate this A/B score.

## Controlled test-only correction

Only a diagnostic copy of Bare's test changed; the actual Bare implementation files (`WarningZone.cs`, `GameController.cs`, `Game.unity`, runtime assembly definition) match the original run byte-for-byte. The diagnostic test replaces the first `fruit.Body.position = belowLine` with `fruit.transform.position = belowLine`, calls `Physics2D.SyncTransforms()`, and asserts that the fruit is below the warning line before checking `_dangerTime`. No wait duration or product logic changed. Corrected test SHA-256: `f22ab8a756a9e268bea7993fecb6dc1e43d0c1e25443911350d9db340de7a41d`.

Diagnostic result: Bare focused test 3/3 pass; full EditMode suite 28/28 pass. Full-suite NUnit XML SHA-256: `991bc4298fad0d2f280932bd31b9955a725efd8f9956171dacaabc5bd6d1388e`. Large Unity logs and additional repeats remain under `D:/JOEWRKS/JOENESS-Interaction-AB-20260928/diagnostics/`; they are not required by the original grader.

Bounded, repository-verifiable evidence (the folder's `.gitattributes` preserves Unity XML bytes without line-ending conversion):

| File | SHA-256 | What it shows |
| --- | --- | --- |
| [`bare-original-test.cs.txt`](diagnostic-evidence/bare-original-test.cs.txt) | `371d4f7f8b4756c378923a581fbe570e1d414286d4e972f251681158cc97ed65` | Exact Bare-authored test bytes |
| [`bare-original-full.xml`](diagnostic-evidence/bare-original-full.xml) | `3720e74a8a5496ae14093791ac61287f7fce8ed54ee1dcf747a1b8bbf5c78fc7` | Original 27/28 full suite |
| [`historical-green-original-failure.xml`](diagnostic-evidence/historical-green-original-failure.xml) | `7528c810e4c13a39fda3aaa720aeea451f31d16e4ebf16b3fea0935a383bd2de` | Same original test also fails on known-good restart code |
| [`position-precondition-failure.xml`](diagnostic-evidence/position-precondition-failure.xml) | `23287854cff16e4f0c999f0546a48c2a730243f83921464c751b93c84bfaa291` | Fruit remained above the line when original test checked the timer |
| [`bare-corrected-test.cs.txt`](diagnostic-evidence/bare-corrected-test.cs.txt) | `f22ab8a756a9e268bea7993fecb6dc1e43d0c1e25443911350d9db340de7a41d` | Exact diagnostic-only test change |
| [`bare-corrected-full.xml`](diagnostic-evidence/bare-corrected-full.xml) | `991bc4298fad0d2f280932bd31b9955a725efd8f9956171dacaabc5bd6d1388e` | Same Bare production code, corrected test, 28/28 full suite |

## Adjudication

Keep the preregistered strict score as **Bare 3/4 versus JOENESS 4/4**, including the failed test evidence. For causal interpretation, treat the sole difference as an unreliable agent-authored test, not a demonstrated JOENESS improvement. Both arms passed all hidden target-interaction oracles (4/4 each). No new model comparison or broader superiority claim follows from this diagnostic.
