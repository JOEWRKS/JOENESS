# JOENESS 0.2 usability / performance A-B — bounded review

## Scope and provenance

- Pre-registered question and stop rule: [plan.json](plan.json). Exactly 24 fresh sessions: 2 fictional projects × Bare/JOENESS × 6 stages. No clear model result was rerun.
- Runtime: `codex-cli 0.158.0-alpha.2`, `gpt-6-astra`, `xhigh`, `exec --ephemeral --ignore-user-config`. Every result has exit code 0, a thread ID, usage, response hash, and prompt hash in [results](results). Responses are retained in [responses](responses); raw rollouts and credentials are not.
- Bare and JOENESS began at identical Git tree hashes within each fixture: Reading Shelf `0f642c0140667224c9d5f2896cde2fb588adce9a`; Workshop Slots `4045fda8a260dc8ee34cce9606dee32ffb5c1ba1`. The paired prompt SHA-256 values match for every fixture/stage. Arm/stage execution order was counterbalanced as specified in the plan.
- The JOENESS arm used the installed 0.2 package: Independent Judgment Core and one `joeness-setup` skill. Its installed `SKILL.md` SHA-256 matched the source manifest (`50c283f0f8b8fbb9d858dc9b0085d1f1a2f6eae2946a15368f1553f8849f626c`). No release source was changed.
- Temporary `auth.json` copies in the two evaluation homes were removed after session 24; both exact paths tested absent and the original user file tested present. No real project or production service was used.

## Material outcomes

| Criterion | Bare | JOENESS | Difference |
| --- | --- | --- | --- |
| Reading Shelf approved R1/R2 | Implemented; final 8/8 local tests pass | Implemented; final 10/10 local tests pass | Same required behavior; JOENESS added two edge checks, not a demonstrated material outcome difference |
| Workshop Slots approved R1/R2 | Implemented; final 4/4 local tests pass | Implemented; final 6/6 local tests pass | Same required local behavior; JOENESS added edge checks |
| Workshop R3 actual venue kiosk | Unverified; M1 not closed | Unverified; M1 not closed | Both preserved the required boundary; neither fabricated a kiosk result |
| User acceptance | Pending in both projects | Pending in both projects | No false acceptance |
| S4 independent handoff | Accurate current-state account; no files changed | Accurate current-state account; no files changed | Both recovered completed work, remaining work, issue causes, and next action |
| S5 stale-note resume | No duplicate source implementation; no false completion. Added a fresh documentation/recheck entry in both projects. | No duplicate implementation; no false completion. Did not add redundant entries. | No material correctness difference; Bare did more documentary work |

The Reading Shelf Bare arm used the historical `HANDOFF.md` as its dated routine work ledger and explicitly marked its old opening note as superseded. JOENESS left that note historical and used a new `TASK.md` for day-to-day work. This is clearer document-role separation, but the independent S4 reader in both arms still found the correct status. Workshop Slots already had `TASKS.md`; both arms used it and preserved reusable causes/fixes in `ISSUES.md`. Neither arm repurposed `artifacts/attempt-00/local-check.md` as a ledger. Both kept the optional features deferred rather than silently implementing them.

All four final project trees passed a fresh `node --test` and `git diff --check`. These local checks do not replace Workshop R3. The S4 read-only requirement is confirmed by identical pre/post Git status in all four S4 result records.

Evidence-integrity note: the unchanged raw model response `reading-shelf-joeness-S3.md` contains a Markdown hard line break (two trailing spaces on line 8). `git diff --cached --check` flags that one line. It is retained byte-for-byte because `results/reading-shelf-joeness-S3.json` records the exact response hash; editing it merely to satisfy whitespace checking would falsify that provenance.

## Tokens and time

`input` includes cached input; `noncached` = input − cached input + output. Totals are 12 sessions per arm. The [analyzer](analyze.mjs) reads only the bounded result records.

| Scope | Bare input+output | JOENESS input+output | JOENESS change | Bare noncached+output | JOENESS noncached+output | JOENESS change |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Reading Shelf | 780,743 | 868,112 | +11.19% | 148,679 | 150,672 | +1.34% |
| Workshop Slots | 982,771 | 728,409 | −25.88% | 155,635 | 137,817 | −11.45% |
| Both fixtures pooled | 1,763,514 | 1,596,521 | −9.47% | 304,314 | 288,489 | −5.20% |

Pooled wall time: Bare 1,760,009 ms; JOENESS 1,516,915 ms (−13.81%). Reading Shelf JOENESS was +1.14%; Workshop Slots JOENESS was −28.05%. In this one-pass, two-fixture design, direction reverses by project, so the pre-registered both-fixtures criterion for a token-savings signal **fails**. A favorable pooled number is not general token-economy proof. Timing is likewise descriptive, not a stable performance estimate.

## Human readability: relative preference, not comprehension proof

The user reviewed the actual S4 replies after source-identifying machine paths and metadata were mechanically removed. The first pair ([Reading Shelf](pair-1-reading-shelf.md)) mapped A=Bare, B=JOENESS; the user preferred **B** because the report form made it easier to read, but said both used language difficult for a non-developer. The second pair ([Workshop Slots](pair-2-workshop-slots.md)) mapped A=JOENESS, B=Bare; the user preferred **A**, but strongly objected to unintuitive wording and long sentences that discouraged reading. The source mapping was not disclosed until after both responses.

Thus the two relative preferences favor the JOENESS reporting surface, but the absolute usability target is **not met**. The user did not provide a separately checkable restatement of the next action for either pair, so comprehension accuracy is unverified. Do not convert preference into proof of factual understanding or work-quality superiority.

## Decision boundary

- Unique material task-success improvement: **not demonstrated**. Both arms finished authorized local work, preserved the missing kiosk gate, and handled stale notes safely.
- Record-role separation: observed in Reading Shelf; no downstream material advantage shown in these six stages.
- Relative human readability: JOENESS preferred in both blind pairs; still too technical and long for this user. This is a real usability finding, not a completed solution.
- Token savings: **not established** because project-level direction was mixed and the sample was one run per arm.
- Product decision: no Core or setup-skill removal/expansion follows from this evidence alone. A narrow plain-language top-line design can be considered separately, provided exact facts and file references remain available in the detail; it was not implemented in this run.
