# MergeDrop real-project pilot — review evidence

Scope: user-selected `D:/JOEWRKS/MergeDrop/.worktrees/mergedrop-v1`, branch `feature/mergedrop-v1`, HEAD `80d527fd5133c788a9fdc0c781ed9a206199cee5`. The worktree already held extensive uncommitted work. The user approved only the short project connection, then separately authorized a `0.1.13` release-preparation audit and record. No game source, device, or Play target was changed by this pilot. Project setup remains uncommitted in that active worktree to avoid bundling unrelated user work.

## What was actually checked and recorded

- The existing AGENTS body was retained byte-for-byte after removing only two legacy boundary marker lines. `joeness-setup` applied its owned block and `.joeness/setup-state.json`; the helper's final `-Check` returned `current/clean`. `TASK.md` remains the sole roadmap/task source; no ROADMAP or ISSUES document was created.
- Ticket 13 now points to a dated `0.1.13 (14)` local audit, preserving the old `0.1.5` checkpoint as history. The audit reports what is verified and explicitly leaves device, Play state, exact dirty-source-to-artifact linkage, and user acceptance open.
- Independent read-only checks: AAB and handoff copy both 43,174,237 bytes with SHA-256 `AEF5814C35C523B577603147335352FB539F7FE5636B735AC82DB86FA6299B29`; bundletool 1.17.2 validation exits 0 and reads package/version `com.joewrks.mergedrop` / `0.1.13 (14)`, min/target SDK 25/36; `jarsigner -verify` exits 0 with `jar verified` and self-signed-chain/timestamp warnings; the stored test XML says 717 passed, 0 failed, 0 skipped; the stored release log says build success/exit 0. The tests and build were **not** rerun for this audit.
- The last local submission record found is `store/release-0.1.11-submission.md`. It does not establish the live Play state for 0.1.12/0.1.13. No live Console, phone, or user-acceptance claim follows from local artifacts.

## Fresh-context handoffs

All three used `codex-cli 0.158.0-alpha.2`, `gpt-6-astra`, reasoning `xhigh`, normal installed personal package, and the real project connection; all were fresh read-only contexts. Each [result](result.json), [post-audit result](post-audit/result.json), and [post-correction result](post-correction/result.json) records prompt/response hashes, thread, token counts, and unchanged HEAD/status/AGENTS/state/TASK hashes. Full rollouts and credentials were not saved.

The raw Markdown responses retain the model's two-space hard line breaks so their recorded SHA-256 hashes remain checkable. A run-local `.gitattributes` exempts only those response files from trailing-space diff warnings; it does not change their bytes or any release source.

| Run | Question and result | Total input+output | Noncached input+output | Time |
| --- | --- | ---: | ---: | ---: |
| [Initial](response.md) | Broad independent handoff; correct current-vs-stale and approval boundaries, but called evidence inspection a `해결` | 506,856 | 85,608 | 258,441 ms |
| [Post-audit](post-audit/response.md) | Narrow `0.1.13` handoff after real TASK update; correct substantive boundaries, but again mislabeled inspection as `해결` | 164,076 | 62,572 | 88,375 ms |
| [Post-correction](post-correction/response.md) | Same post-audit prompt after one managed-block clarification; correct substantive boundaries and `해결: 없음` | 201,442 | 31,074 | 97,072 ms |

The initial and post-audit prompts differ, so their token/time difference is not an optimization effect. The two later prompts match, but are single nondeterministic runs with different project instructions/cache behavior; they do not prove a cost improvement or regression. All absolute token counts are large. The project has a 267 KB TASK and 175 KB historical pilot document, and the broad question invited repository-wide inspection; this is a plausible contributor, **not** measured causal attribution. Prior paired fictional-project A/B evidence had mixed project-level cost direction, so no general JOENESS token saving or overhead is established from this pilot.

## Assessment and limits

- The new handoff identified completed Tickets 1–12, active Ticket 13, current local `0.1.13`, the 717/717 stored test result, uncommitted source state, and the exact next external/device checks. It did not repeat implementation, modify files, turn old Play notes into current status, or equate technical checks with user/Google acceptance.
- The first two answers exposed a report-field defect in the short project connection. The project-only correction added: for a read-only check, use `해결: 없음` unless the current turn actually corrected and verified a problem. The original answers are retained as failure evidence; the third answer confirms the affected field on one fresh run. No shipped `skills/joeness-setup/**` or Core bytes changed.
- The user judged the **post-audit first six lines** immediately understandable. That is a human readability result, not proof of the full onboarding journey, live project benefit, general model-performance superiority, or lower cost. The corrected third answer has not received a separate human rating.
- In later feedback, the user said this `0.1.13` audit was mainly a **test**, not the real work they had intended. Their proposed next real task is an animal-character skin. Therefore this pilot proves project connection and a read-only handoff boundary, but **does not close the real-work usefulness gate**. The roadmap's initial `actual work complete` check was reversed, and this correction is retained here rather than quietly treating audit activity as product value.
- Still unverified: live Play/device state; exact source snapshot of the candidate; user acceptance of the game release; the JOENESS full-use journey and final launch acceptance. Do not mark either product or game release complete from this evidence.
