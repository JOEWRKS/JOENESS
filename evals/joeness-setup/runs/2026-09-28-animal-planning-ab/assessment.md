# MergeDrop animal candidate planning A/B — assessment

## Scope and provenance

- Pre-registered `plan.json` at `f8261d3b98ff6c02357911dbb4ccb96d1fbf14f8`; infrastructure amendment `attempt-2-plan.json` at `ea44f53` before retry.
- Actual source: dirty `D:/JOEWRKS/MergeDrop/.worktrees/mergedrop-v1`, branch `feature/mergedrop-v1`, starting HEAD `80d527fd5133c788a9fdc0c781ed9a206199cee5`. Eleven relevant current files were copied into two isolated Git fixtures. This was a **partial source snapshot**, not the full Unity project. The original project was not edited.
- Active package source: JOENESS 0.2 Core SHA-256 `f360b48be1b4143035f61fa20149a3249c60dea2e7f12cffa8bf1e8918f4f6a9`; `joeness-setup/SKILL.md` SHA-256 `9a36f42f0094c5e60bd039be64fc199e983a591c51063767165efb80103647aa`. Installer check reported `current` and no warnings. Bare home had neither Core AGENTS nor setup skill.
- Exact runtime: Codex CLI `0.158.0-alpha.2`, `gpt-6-astra`, `xhigh`, ephemeral fresh sessions, same stage prompts and source snapshot. Attempt 2 used `danger-full-access` inside disposable copies after `workspace-write` blocked even reading in both arms. No production external target was used.
- Order: Bare planning → JOENESS planning → JOENESS fresh handoff → Bare fresh handoff.
- Thread IDs: Bare planning `01a0e383-4b38-7c83-86ca-356bac9b74d7`; JOENESS planning `01a0e387-f58d-7d61-ab14-9abc9f894031`; JOENESS handoff `01a0e38d-0eb4-79d2-8da0-a93096278c9c`; Bare handoff `01a0e38e-1261-7850-8a9f-3f258a334596`.

## First attempt retained as invalid evidence

The original `workspace-write` attempt completed four sessions with exit code 0, but both arms reported file-read and write denial and neither modified the fixture. It cannot measure planning or handoff quality. Those responses, usage summaries, inventory and cleanup proof are retained at this directory's root. The only protocol change for fresh attempt 2 was the sandbox mode and separate trial/evidence paths.

## Material result against the pre-registered rubric

| Requirement | Bare | JOENESS |
| --- | --- | --- |
| Four approved sets preserved; animal treated as fifth **candidate**, not approval or release scope | Pass | Pass |
| No invented species, name, unlock threshold or acceptance | Pass | Pass |
| Stable IDs, ten tiers with art/collider, Collection, unlock/save and shared game/leaderboard addressed | Pass | Pass |
| Candidate/unknowns recorded in existing `TASK.md`; no duplicate roadmap | Pass — 122 added lines | Pass — 130 added lines |
| No code, art, approved design, Play or release change | Pass | Pass |
| Fresh handoff names the known/proposed/open boundary, actual changed file and next action; no handoff writes | Pass | Pass |

Both arms were **6/6 on these bounded material checks**. Both edited only their own copied `TASK.md`; fixture `git diff --check` passed. Both fresh handoffs left the fixture status at `M TASK.md`. No unique technical-planning or handoff-accuracy improvement by JOENESS was observed.

The user read `blind-handoff.md` and chose **A** for faster understanding of completed work, remaining decisions and next action. A maps to JOENESS; B maps to Bare. This is one subjective preference, not timed comprehension or evidence that no facts were omitted. The user did not name a confusing term. Formatting may also reveal the treatment, so the labels were concealed but the comparison was not fully blind to a reader familiar with JOENESS.

The JOENESS plan records synthetic fixture HEAD `4fa4fb9` as this copied worktree's starting Git state. It is true of the fixture, **not** the original MergeDrop HEAD. Do not transfer that revision to a real handoff. This is a source-reduction/provenance limitation, not evidence about the live project.

## Cost and friction (valid attempt 2 only)

| Metric, planning + handoff | Bare | JOENESS | JOENESS relative |
| --- | ---: | ---: | ---: |
| Input tokens, including cache | 620,979 | 585,991 | −5.63% |
| Output tokens | 10,524 | 11,850 | +12.60% |
| Non-cached input + output | 114,383 | 115,025 | +0.56% |
| Wall time | 367,536 ms | 401,928 ms | +9.36% |
| Command-execution events | 30 | 21 | −30% |

JOENESS planning alone used 85,880 non-cached-input-plus-output tokens versus Bare's 82,451 (+4.16%), while its handoff used 29,145 versus 31,932 (−8.73%). Aggregate near-parity is not proof of general token savings. Both arms consumed unusually high gross input because the real `TASK.md` is large and was revisited; the controlled trial does not isolate whether source size or agent reading strategy dominated. JOENESS took about 34 seconds longer overall and produced 8 more plan lines. Neither arm stopped unnecessarily, asked for extra approval, created a duplicate document or expanded product scope.

## Safety and inference boundary

- The source hashes for all eleven copied files matched the original after execution; original AGENTS, TASK, visual-set design and catalog hashes matched preflight exactly. No real MergeDrop game/code/Play change was made.
- Both temporary `auth.json` copies were absent after both attempts; original login file remained present. Auth contents were never retained in evaluation evidence.
- Raw model responses retain their exact bytes and SHA-256 provenance, including Markdown hard-break trailing spaces. A default `git diff --check` flags those spaces; the evidence was not rewritten to silence that formatting warning.
- The common project AGENTS text still contains an older JOENESS design-pilot section in **both** arms. The treatment therefore estimates adding the active 0.2 package plus setup block to the current project context; it is not a comparison against a completely instruction-free model or an isolation of Core from setup.
- The installed setup skill was available, but the prompts did not explicitly invoke it; project setup was already applied. The six-field output shows the project connection affected formatting, not that the skill's procedural path ran.
- Only planning and fresh handoff were tested. Full-project implementation quality, art, actual Unity behavior, repeated long-horizon work, human readability, and broad model performance remain unverified. One pair cannot establish a reliable population effect.

## Decision

For this planning/handoff case, **material task accuracy equivalent; JOENESS-specific technical or token-efficiency gain not demonstrated**. One user preferred the JOENESS handoff for faster comprehension, so the reporting format has observed human-usefulness value in this case. That value should not be recast as a general quality or token-performance improvement. No JOENESS code or release change follows from this experiment alone.
