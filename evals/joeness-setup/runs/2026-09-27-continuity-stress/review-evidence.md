# Saved-project continuity stress — review evidence

## Decision

The preregistered four-stage saved-project sequence completed once per arm at `gpt-6-astra / xhigh`. **Material history and successor accuracy were equivalent.** Both arms repaired and verified R1/R2, classified the old duplicate diagnostic as pre-repair evidence, preserved the required R3 gap, recorded the explicit CSV deferral without waiving R3, and gave a correct no-write successor handoff. No unique material JOENESS improvement or regression was demonstrated. Stop this experiment under its preregistered rule; do not repeat a clear result to seek a favorable sample.

In the blind [handoff comparison](handoff-samples.md), the user chose **B as easier to understand**. A was Setup and B was Bare; the mapping was not disclosed in the sample file or rating request. The user did not provide a reason. This is one sample and does not establish a general readability regression. It reverses the earlier reading-shelf preference for a JOENESS handoff, so a consistent readability benefit is not demonstrated.

## Identity and control

- [Preregistration](preregister.md) committed before execution at work-harness `fa74eddde1ffca43d2773b152f2b462295781cf0`.
- Bare saved project `JOENESS_TEST-02`, cwd `D:/JOEWRKS/JOENESS-Accuracy-Bare-20260927`, initial continuity commit `b4521d23ce97027b73b12ab171e7a4582c5e8bf1`.
- Setup saved project `JOENESS_TEST-01`, cwd `D:/JOEWRKS/JOENESS-Accuracy-Setup-20260927`, initial continuity commit `d2107dc79493c045e65a0c8878bac95e5a93023a`.
- The 33 non-AGENTS visible common files matched byte-for-byte before S1; Setup alone had a helper-current JOENESS-SETUP block and state, while Bare had an empty AGENTS and no setup state. Both arms retained the same account-wide Independent Judgment Core and installed skills.
- All eight local rollouts explicitly showed `gpt-6-astra` and `xhigh`. Source and personal install were not changed.

## Stage results

| Stage / order | Bare thread, duration | Setup thread, duration | Observed boundary |
| --- | --- | --- | --- |
| S1 — Bare → Setup | `01a0e171-3008-7373-9181-0eed5fe15a18`, 151.4 s | `01a0e171-4a38-7843-a961-045c4b6b7ba0`, 144.6 s | Both reproduced route loss, then implemented route preservation **and** the already-required duplicate-id guard; 4/4 local tests passed. R1/R2 checked, R3 and M2 left open. Both wrote TASKS/ISSUES/ROADMAP. Bare also annotated the old HANDOFF. |
| S2 — Setup → Bare | `01a0e174-803f-70c3-ba55-16e0a2b0e9ed`, 145.0 s | `01a0e174-629c-75d0-a99f-c236900547ee`, 100.9 s | The newly supplied historical duplicate diagnostic was not a current failure; both ran 5/5 tests, probed repeat confirmation, avoided code replay, and updated TASKS/ISSUES. Bare additionally rewrote HANDOFF and ROADMAP and included a long probe transcript in TASKS. |
| S3 — Bare → Setup | `01a0e177-259f-7693-871a-62e3ab672f28`, 70.2 s | `01a0e177-4648-7702-980f-ccb1f64d06d8`, 67.7 s | Both recorded the authorized CSV deferral, retained R3 as required, left M2 and user acceptance open. Setup reran unchanged local tests; Bare accurately cited the previous result without a rerun. |
| S4 — Setup → Bare | `01a0e178-e361-7cd3-9e56-39659ff2ced4`, 49.6 s | `01a0e178-c1ff-7dd2-8dbf-cce4d83a0dc5`, 72.1 s | Both fresh successors reconstructed R1/R2, two confirmed causes/fixes, historical-probe timing, CSV deferral, missing actual handheld proof, M2 incomplete, user acceptance unrecorded, and the next target-verification action. Neither edited files or misrepresented prior tests as a fresh run. |

The test orchestration committed each arm's actual S1, S2, and S3 outcomes on its local test branch before the next stage; it did not repair one arm or show it the other's outputs. S1 outcome commits: Bare `e82298ef4c16ac37ccbf9ece8e2c52f74258a7c2`, Setup `4d4e1b09294e56b94ab80d0264e7491e4b0a0833`. S2: Bare `f6987a25e9aee0559bb3a816015b1de8d066bc47`, Setup `bb13bfac9bfd5798db09f6143e9374cc4849d6fd`. S3: Bare `64b73dddf616456d524bebf1a88b243899991924`, Setup `e0d113601e701da0a94b8d27e1d87e2639d0ff0b`.

Independent final host checks: both working trees clean; `PRODUCT.md` SHA-256 `109fe3de64fa921f9c66ec4f910134f5b88a6ac9e415643cf58bfd117c79bf58` unchanged and identical; R1/R2 checked with relevant local proof; R3 unchecked; CSV deferred; ISSUES contains the actual duplicate cause/fix; the incoming diagnostic explicitly marks itself pre-repair. `node --test cases/E/*.test.mjs` passed 5/5 in both arms. No actual handheld target exists in the fixture, so R3 remains unverified.

## Friction and limitations

- Observed command executions: Bare 27 plus one other tool call; Setup 33. Wall time: Bare 416.2 s, Setup 385.3 s. Setup was slower in S4. S3 Setup reran tests for a documentation-only decision, while Bare did not. Neither arm has a consistent advantage on every measure.
- The local rollout counters reported Bare 1,045,033 total tokens and Setup 1,082,847 across four chats; these totals include large cached-input counts and are not uncached spend or a stable per-task cost estimate. Bare output tokens were 10,702 and Setup 9,278.
- Agent-authored tracked documentation/code diff across S1–S3 was broader in Bare, notably extra HANDOFF/ROADMAP updates in S2 and a long TASKS probe transcript. Setup kept the old HANDOFF as historical, while Bare turned it into a current handoff. Both final successors nevertheless found the right state. This is bounded record-friction evidence, not a material accuracy win.
- The fixture did not fully stress independent defect repair in S2: both S1 agents proactively fixed R2, so S2 became a stale-report recheck. The common TASKS and ISSUES files also explicitly described their roles, reducing the incremental role-discovery burden on Bare. This limits how strongly the experiment can test ambiguous-source classification.
- A single paired fictional project, even with four fresh stages, cannot establish population-level accuracy, latency, or token effects. Human comprehension is assessed separately and should not be inferred from the agents' own prose.

**Outcome for this preregistration:** improvement in material accuracy and handoff readability unproven. Preserve the current JOENESS release; do not change the skill or global Core based on this result alone.
