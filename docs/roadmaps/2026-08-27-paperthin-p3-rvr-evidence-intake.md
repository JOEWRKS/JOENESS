# Stage P3 pre-Dororong evidence intake — RVR visual verification + tool-boundary incidents

- Status: prepared input only / no P3 verdict / no adoption approved
- Roadmap branch baseline before the first intake: `dbdad2c0b9cfe3413e711ea467d8852924b0f649`
- Previous supplied report fingerprint: `87,748 bytes` / SHA-256 `02292bb797ff796374ff81f161b9757a6dfdb325c746398b27c6febf5494d21a`
- Latest supplied integrated attachment: `붙여넣은 마크다운(1)(7).md`
- Latest supplied report bytes: `99,068`
- Latest supplied report SHA-256: `79740b56627900fa5e67c1de6ad5dfffd7a847eee21e728dc6ec0d4adf72bd0c`
- Report repository / commit / canonical path binding: `UNVERIFIED`
- Incident-time installed JOENESS Core / skill revision binding: `UNVERIFIED`
- Open Design plugin/runtime exact version, manifest hash, raw run IDs/log artifacts, and exact user-instruction transcript binding: `UNVERIFIED`
- Purpose: preserve the two RVR incident families as P3/M4 evidence leads without changing Core v8, public skills, installer, manifest, `TASKS.md`, or the active Dororong pilot.

The latest report supersedes the earlier supplied report only as the current integrated narrative. The earlier fingerprint remains historical evidence that the visual-verification analysis existed before the later Open Design incident and before some later execution mistakes were appended.

## 1. Incident family A — visual verification and deployment

The supplied report describes a repeated visual-verification failure chain, not a single bad sprite:

1. `attempt-01` passed structural checks while losing important revolver pixels and producing a broken diagonal read; the agent still declared visual PASS.
2. A later production/live `4×` rendering preserved the game's native pixel block scale but made the revolver physically oversized relative to the farmer; it was deployed and the failure was confirmed by user-provided live captures.
3. The follow-up `2×` runtime-scale workaround reduced physical size but changed the weapon to `2×2` screen blocks while surrounding world art remained `4×4`; this second visually invalid result was also deployed.
4. ZIP/live identity checks proved exact deployment of the wrong results, not visual correctness.
5. The implementation, mock, and some checks shared the same scale/coordinate assumptions, so agreement among them was internal consistency rather than independent ground truth.
6. The first failure report already described several correct verification principles, yet the later `4×` and `2×` failures repeated the same structure. A written lesson did not automatically become an execution gate.

These are evidence leads for P3, not yet proof of a missing global JOENESS rule.

## 2. Incident family B — Open Design tool identity, side effects, and retry

The appended incident adds a distinct execution-safety failure surface:

1. The agent treated an installed Open Design plugin/mode name as sufficient evidence about how the work would execute, without first binding the plugin to its backing local runtime, daemon, GUI/network behavior, and user-visible side effects.
2. A manual MCP re-registration/recovery action was attempted before the connection/runtime structure was fully diagnosed.
3. Two Local Codex generation runs reportedly ended after roughly `283s` and `313s` with `daemon_shutdown`, produced zero art outputs, and did not change production/runtime/live files.
4. After the first shutdown, the same broad execution structure was attempted again without a proven cause fix or materially new evidence. This is a strong lead for existing Core retry-rule nonexecution, not evidence that a new retry rule is needed.
5. During the second run, `Open Design.exe -e "..."` was used as though it were a Node.js script runner. The Electron executable reportedly launched the desktop application instead, producing GUI/render/GPU/network/daemon side effects and an `EPIPE` error.
6. The report binds the unexpected GUI tree to a root process path, PID, creation time, command line, and child cleanup, while distinguishing it from a separate Codex-owned MCP connection process.
7. A parent/root agent instruction such as “use the plugin” did not sufficiently preserve the user's intended tool/side-effect boundary inside delegated execution.

This incident is a real evidence lead for tool-boundary reasoning, but the exact plugin version/manifest, raw run logs, and exact user instruction are not bound in this research branch. Do not upgrade it to an exact M4 verdict or Core regression without those identities.

## 3. Current JOENESS comparison before any change

### 3.1 Existing visual contract already covers much of family A

Pinned current `visual-check` already requires several behaviors that the incident report says were not executed:

- derive claim-specific checks from user, approved reference, project contract, and authoritative target before verdict;
- give each required check an expected observable, falsifiable observed fact, and `PASS` / `FAIL` / `UNVERIFIED`;
- never treat opening evidence, repeating expectation, plausibility, file identity, or tool PASS as the observation itself;
- keep source/build/deployed/rendered/user-acceptance layers separate;
- reject candidate-derived acceptance authority and self-derived coordinates as correctness proof;
- on user rejection of an observable property, withdraw that property's prior PASS and recheck the corrected exact target;
- use one causal hypothesis and the minimum coherent correction for a concrete defect.

Therefore family A is partly strong evidence of **existing-contract nonexecution**. P3 must not rewrite that as a missing feature merely because the incident was costly.

### 3.2 Existing Core already covers much of family B

Pinned Core v8 already says, in substance:

- the user/project owns tool choice;
- on crash/unexpected exit, contain only task-owned processes, restore/read back relevant temporary state, stop, and do not relaunch;
- the same command/mechanism has retry budget `0` for crash/unexpected-exit handling;
- deterministic errors get at most one retry after an evidenced cause fix or method change;
- GUI/tool fallback remains bounded and delegation/helper/PID changes do not reset the fallback budget;
- narration, liveness, filename, or process survival are not success evidence.

Therefore `daemon_shutdown` followed by another materially same execution path, and reporting a run/mode start as though it satisfied the user's actual tool boundary, are primarily **existing-Core nonexecution leads**. They do not by themselves justify a new Core retry rule.

## 4. Bounded enforcement seams exposed by both incident families

These are questions for P3/M4, not approved rules.

### A. Criteria-before-candidate freeze — visual-check question

Before inspecting a candidate for acceptance, freeze the claim's sourced acceptance axes and invariants that can determine the verdict. The purpose is to stop a visible success — for example preserved SAA identity or reduced size — from becoming the post-hoc whole acceptance criterion.

### B. Change-impact invariant recheck — visual-check question

When a fix changes a mechanism that can affect other acceptance properties, identify the materially affected invariants and recheck those alongside the original failed property. The RVR example is `render scale`: it directly affected both physical screen size and pixel-grid density.

This must stay bounded enough not to become “rerun every check after every edit.”

### C. Tool execution identity resolution — tool/M4 question

When the user's tool constraint is really about execution effects such as GUI, network, cloud, local process launch, external state, or privacy/cost surface, do not infer compatibility from a plugin/mode/helper name alone. Resolve the backing runtime and the materially relevant expected side-effect surface from authoritative docs/manifest/current system evidence before execution. If that identity cannot be resolved and the uncertainty changes the user's boundary, stop or ask only the material choice.

This does **not** mean exhaustively process-map every tool before use. It is conditional on the tool's real execution effects being material to the user's stated boundary.

### D. Delegated authority preservation — tool/M4/ticket question

Delegation does not widen tool or side-effect authority. When a child task can touch a material execution boundary, pass only the concrete constraints needed for that task: permitted execution mechanism or surface, prohibited side effects when relevant, and production/shared/external write limits. Do not turn this into a boilerplate ban list on every subagent prompt.

### E. Procedure-label versus actual-effect check — cross-context maintenance question

Across both incident families the same higher-level shape appears:

- visual case: `visual-check invoked / image opened / tests passed` was treated as if the user's visual acceptance target had been verified;
- tool case: `plugin selected / Local Codex started / Cloud not selected` was treated as if the user's execution-effect boundary had been satisfied.

The reusable question is whether a procedural label or narrow successful step is being widened into the user's actual outcome. This is a cross-context signal **inside one project**, not yet a cross-project Core candidate.

## 5. Paperthin WATCH signals after both incidents

These are pre-P3 signals only; P1 classifications remain historical until P3.

| P1 mechanism | Combined RVR signal before P3 | Boundary |
|---|---|---|
| `readchk` | **new actual lead** | the Open Design incident may involve a user/tool-boundary mistranslation that a silent paraphrase + context cross-check could have exposed; exact user instruction and plugin manifest are still unbound |
| `shower` | partial supporting signal | author/session intent and labeled mocks biased visual self-review, but this does not prove a general artifact-alone comprehension requirement |
| `mandela` | strong supporting signal | implementation, mock, and checks shared assumptions; circular agreement did not provide independent correctness evidence |
| `re0-memo` | reopen at P3 | one-off→global-rule guard is already covered, but the correct written visual lesson failed to become the next execution gate |
| `catchup` | no material signal | neither incident is primarily a human re-entry/context-restoration failure |

`re0-memo` being reopened at P3 does **not** rewrite its P1 `ALREADY_COVERED` classification. P3 may split the already-covered generalization guard from the separate lesson-to-execution transfer question.

## 6. Existing validation-roadmap relation

The Open Design incident also belongs to the existing JOENESS validation-debt roadmap's **M4 external-plugin contract-conflict** scope. This intake does not change M4's current status or `TASKS.md`.

When M4 resumes, this incident should be used as a real-project evidence lead for:

- plugin logical identity versus backing runtime/effect identity;
- actual installed-plugin contract conflict;
- tool-boundary preservation through delegation;
- retry behavior after `daemon_shutdown` or an unexpected GUI/process side effect.

Do not count this as M4 PASS/FAIL until the exact plugin/runtime contract and incident-time identities are bound strongly enough for the claim being made.

## 7. Evidence-boundary corrections for later review

P3/M4 must preserve these distinctions:

- Do not use one global evidence-authority ranking such as `user > image > automation > intent`. User approval/intent, visible artifact facts, structural checks, deployment identity, runtime/process evidence, and tool contracts each govern their own layer.
- A failed visual candidate may still be shown as a diagnostic/failure artifact. The prohibition is against presenting it as approval-ready, accepted, ready-for-use, or complete.
- The report's detailed Gate 0–8 and visual status vocabulary are RVR-local recovery material unless later review independently proves a recurring JOENESS need.
- `Game1.pixelZoom = 4` is important to the RVR diagnosis, but its independent external source binding is not preserved in this JOENESS research branch.
- Do not turn the RVR-local “workspace dependency only” recovery wording into a global runtime rule. The durable principle is to use an execution path whose actual product identity, version, and execution semantics are verified enough for the task.
- Do not require full PID genealogy for every transport error. Process path/command/start-time/lineage evidence is required when ownership or unexpected process/GUI side effects must be distinguished.
- “zero outputs = failure” is valid for the specific art-generation runs; it is not a universal task-status rule.
- The report's Open Design-wide prohibition is authoritative only to the extent it reflects an actual user decision/current project contract. If it was agent-authored after the incident, treat it as a blocked execution path pending new evidence/user scope, not as a globally invented user policy.
- The supplied report is fingerprinted here, but no accessible canonical source repository/commit/path was resolved. Do not invent one.
- The incident-time installed JOENESS revision and exact Open Design plugin/runtime identities were not proven by the supplied report alone.

## 8. What P3/M4 may and may not infer

P3 may use these incidents to test whether:

- `readchk`-like request/boundary understanding has practical value;
- `mandela`-like validation-independence guidance has practical value;
- `re0-memo`'s broader lesson-to-next-run behavior is actually missing despite the existing one-off escalation guard;
- `visual-check` needs a bounded criteria-before-candidate rule;
- `visual-check` needs a bounded change-impact invariant recheck rule.

M4 may use the tool incident to test whether:

- tool logical identity must be resolved to backing runtime/effect identity when side effects matter;
- external-plugin contract conflicts are detected before recovery/re-registration attempts;
- delegated work preserves user/project tool and side-effect authority;
- existing retry rules are correctly applied after plugin/runtime shutdowns and unexpected process side effects.

Neither review may infer from the combined RVR incident alone that:

- Core v8 must change;
- a new public Paperthin-derived skill is required;
- every visual task needs a fresh reviewer or full state matrix;
- every tool invocation needs an exhaustive process audit;
- the six-skill catalog should expand;
- same-model/multi-agent agreement is independent proof;
- the exact installed Core/skill/plugin revision failed unless later evidence binds those identities.

## 9. Pre-Dororong stop boundary

This intake completes the safe incident preparation that can be done before the Dororong pilot is reviewed.

Do not implement, test, install, or route any Paperthin-derived candidate or new JOENESS enforcement rule yet. Let Dororong M1 reach its existing completion / partial / blocked boundary under the unchanged installed JOENESS. Then run Stage P3 once using the P1 matrix and real-project evidence, including this combined RVR intake, while keeping the M4 tool-contract thread separately scoped.
