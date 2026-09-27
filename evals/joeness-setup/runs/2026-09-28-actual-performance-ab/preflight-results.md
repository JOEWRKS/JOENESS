# Unity oracle preflight

Source: `D:/JOEWRKS/MergeDrop/.worktrees/mergedrop-v1`; Unity `6000.3.21f1`. Each `red` project is a full archive of the fix commit's parent with only the new test file from the fix commit overlaid. Each `green` project is the full fix commit. Both are isolated from the live MergeDrop worktree. The first attempted red command included `-quit`, exited before writing test results, and is not evidence; subsequent commands omitted it and used `Start-Process -Wait`.

| Case | Parent + oracle | Fix commit | Red result SHA-256 | Green result SHA-256 |
| --- | --- | --- | --- | --- |
| Invalid visual-set writes (`71ada1a`) | 5 pass / 2 fail: unknown ID did not throw; invalid selection returned true | 7 pass / 0 fail | `4b57a56eda29b0b7ead7dc7e4d20f65ff820dc1750b951f5a90666297e20b88a` | `ef6efcee6dabbd56b2ef6cd972d47bcd10f100ee994d83a181a1249742dd50c5` |
| Deferred leaderboard authentication (`5010b03`) | 0 pass / 1 fail: authentication started before ranking action | 1 pass / 0 fail | `49069fa51055f08b15a5f0c2828b3d4fc8944b2697ae1ada9423fccd447059a9` | `249fb68c5afaaa98755fc97daa0b61558c20d91d5fdfbce349f73bfa45b09537` |
| Four complete ranking rows (`565b08f`) | 0 pass / 1 fail: viewport anchor was `(0,0.19)` instead of `(0,1)` | 1 pass / 0 fail | `b218aa2c09fcd4632fc29eeff16cd4ebd633d4cfce41dd3d47c4945464666265` | `cfa8afa1c302c4111c417b526a0031357dece445d09cb8460a3d9328a77bafe7` |

All three cases satisfy the intended RED/GREEN admission gate. These XML files and full Unity logs remain only in the disposable trial root; no raw log or large generated cache is committed. No model A/B result is included here.

Full EditMode baseline: the first fix commit passes `134/134`. The latter two historical fix commits do **not** have clean full suites in this environment: each retains the same 14 failures (`VisualSetControllerTests` 12 and `VisualSetUiTests` 2). Their parent+oracle projects have those same 14 failures plus the single intended oracle failure (`15` total). Failure-name sets differ by exactly the intended oracle test. Therefore a valid outcome for those cases can only claim “oracle passes and no new failures beyond the 14 baseline failures”; it cannot claim a green full suite. This limitation must appear in the final comparison.
