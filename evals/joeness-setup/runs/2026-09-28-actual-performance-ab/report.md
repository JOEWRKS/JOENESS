# JOENESS 0.2 actual coding-performance A/B

## Scope and runtime

This was a bounded coding-performance test, **not** a readability or long-horizon handoff test. Twelve fresh GPT-6 Astra `xhigh` sessions (Codex CLI `0.158.0-alpha.2`) attempted three real historical MergeDrop repairs twice per arm. Each pair received the same prompt and historical source commit in separate standalone Git repositories. Bare had no JOENESS installation; the JOENESS arm had the frozen 0.2 Core, setup skill, and current project connection. The live MergeDrop worktree and JOENESS package sources were not edited. `plan.json`, `fixture-inventory.json`, per-run `results/`, `responses/`, and independent `grades/` hold bounded evidence. Full Unity XML/logs remain in the external isolated trial root; their hashes are in `grades/`.

All 12 model runs exited normally; each pair's prompt hash and model identity matched. Temporary isolated login copies were removed (12/12). All 12 fixture diffs passed `git diff --check`.

The `responses/` files preserve exact model-output bytes, including Markdown's two-space hard line breaks in several JOENESS reports. Their SHA-256 values are linked from `results/`; they were not reformatted merely to satisfy a repository whitespace check. Non-response evidence passed that check.

## Primary preregistered oracle outcome

| Historical repair | Bare | JOENESS | Interpretation |
| --- | ---: | ---: | --- |
| Unknown visual-set ID | 0/2 | 0/2 | The historical oracle requires `Bit(99)` to throw; all four implementations returned zero, avoiding aliasing to a valid unlock bit. The prompt did not require an exception. The separate existing-selection oracle passed in all four. |
| Deferred ranking authentication | 0/2 | 0/2 | The historical oracle reads private `_authenticationStarted`; all four implementations removed that field and startup authentication while retaining manual authentication. All four therefore fail with `NullReferenceException`, not an observed premature login. |
| Four complete ranking rows | 2/2 | 2/2 | Both arms passed the hidden layout test and had no new full EditMode failures beyond the same 14 pre-existing failures. |

The first two oracles are coupled to the historical implementation, not exclusively to the stated product behavior. Their strict scores remain recorded, but **cannot be counted as verified functional failures or successes**. No correction sessions were run: telling agents to restore a private field or throw a previously unstated exception would measure adaptation to the flawed oracle, not independent task performance. This departs from the conditional correction rule in `plan.json`; no outcome or failed evidence was erased.

The first JOENESS visual-set grade additionally had three scene-related full-suite failures. The scene source bytes matched the Bare fixture; the same extra failures persisted in a full-suite repeat but did not recur in the second JOENESS repetition. Their cause is unresolved, so they are retained as an environment/fixture anomaly, not attributed to JOENESS behavior. The target visual-set oracle failed independently in every arm/run.

## Observed cost

Cost is interpreted for the only strict-oracle task with matched verified success, the ranking-row repair (two pairs):

| Metric, two successful runs per arm | Bare | JOENESS | JOENESS difference |
| --- | ---: | ---: | ---: |
| Agent wall time | 639.9 s | 784.5 s | +22.6% |
| Total input tokens | 1,893,085 | 2,435,497 | +28.7% |
| Noncached input + output tokens | 155,257 | 164,351 | +5.9% |
| Command executions | 36 | 54 | +50.0% |
| Independent Unity verification | 47.9 s | 55.9 s | +16.7% |

Across all six pairs, regardless of oracle validity, JOENESS used 6,707,191 versus 5,007,344 input tokens (+33.9%), 460,685 versus 407,259 noncached-input-plus-output tokens (+13.1%), and 2,487.2 versus 1,949.6 agent seconds (+27.6%). These are **workload costs, not success-adjusted efficiency** for the two invalid-oracle tasks. JOENESS wrote `TASK.md` in its runs; that extra record-keeping is an intended potential handoff benefit but its downstream value was not measured here.

Changed-file scope stayed bounded to each repair's source, scene, and tests; JOENESS additionally updated `TASK.md` in all six runs. One Bare authentication run also corrected a single design-spec sentence that still stated startup authentication. No run changed the live project or added a new feature.

## Decision boundary

This experiment finds **no demonstrated coding-accuracy advantage** from JOENESS 0.2. On the only independently scoreable repair, both arms succeeded and JOENESS cost more in this small sample. It does **not** establish a general performance regression or quantify future handoff savings. A further accuracy claim needs a newly preregistered behavior-level oracle that permits multiple correct implementations; reusing these two historical private-implementation tests would not resolve the question.

JOENESS Core and skill SHA-256 remained `f360b48be1b4143035f61fa20149a3249c60dea2e7f12cffa8bf1e8918f4f6a9` and `9a36f42f0094c5e60bd039be64fc199e983a591c51063767165efb80103647aa`.
