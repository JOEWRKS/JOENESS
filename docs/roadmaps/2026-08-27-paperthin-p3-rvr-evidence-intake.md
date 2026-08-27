# Stage P3 pre-Dororong evidence intake — RVR revolver visual verification incident

- Status: prepared input only / no P3 verdict / no adoption approved
- Roadmap branch baseline before this intake: `dbdad2c0b9cfe3413e711ea467d8852924b0f649`
- User-supplied report filename: `2026-08-27-revolver-visual-verification-joeness-failure-report.md`
- Supplied report bytes: `87,748`
- Supplied report SHA-256: `02292bb797ff796374ff81f161b9757a6dfdb325c746398b27c6febf5494d21a`
- Report repository / commit / canonical path binding: `UNVERIFIED`
- Incident-time installed JOENESS Core / `visual-check` revision binding: `UNVERIFIED`
- Purpose: preserve the RVR incident as a P3 evidence lead without changing Core v8, public skills, installer, manifest, `TASKS.md`, or the active Dororong pilot.

## 1. Observed incident signals worth carrying into P3

The supplied report describes a repeated visual-verification failure chain, not a single bad sprite:

1. `attempt-01` passed structural checks while losing important revolver pixels and producing a broken diagonal read; the agent still declared visual PASS.
2. A later production/live `4×` rendering preserved the game's native pixel block scale but made the revolver physically oversized relative to the farmer; it was deployed and the failure was confirmed by user-provided live captures.
3. The follow-up `2×` runtime-scale workaround reduced physical size but changed the weapon to `2×2` screen blocks while surrounding world art remained `4×4`; this second visually invalid result was also deployed.
4. ZIP/live identity checks proved exact deployment of the wrong results, not visual correctness.
5. The implementation, mock, and some checks shared the same scale/coordinate assumptions, so agreement among them was internal consistency rather than independent ground truth.
6. The first failure report already described several correct verification principles, yet the later `4×` and `2×` failures repeated the same structure. This is evidence that a written lesson did not automatically become an execution gate.

These are evidence leads for P3, not yet proof of a missing global JOENESS rule.

## 2. Current JOENESS comparison before any change

Pinned current `visual-check` already requires several behaviors that the incident report says were not executed:

- derive claim-specific checks from user, approved reference, project contract, and authoritative target before verdict;
- give each required check an expected observable, falsifiable observed fact, and `PASS` / `FAIL` / `UNVERIFIED`;
- never treat opening evidence, repeating expectation, plausibility, file identity, or tool PASS as the observation itself;
- keep source/build/deployed/rendered/user-acceptance layers separate;
- reject candidate-derived acceptance authority and self-derived coordinates as correctness proof;
- on user rejection of an observable property, withdraw that property's prior PASS and recheck the corrected exact target;
- use one causal hypothesis and the minimum coherent correction for a concrete defect.

Therefore the incident is partly strong evidence of **existing-contract nonexecution**. P3 must not rewrite that as a missing feature merely because the incident was costly.

## 3. Two enforcement seams exposed by the incident

The incident also exposes two narrower behaviors that are not stated as clearly in the current general `visual-check` contract and deserve explicit P3 review:

### A. Criteria-before-candidate freeze

Before inspecting a candidate for acceptance, freeze the claim's sourced acceptance axes and invariants that can determine the verdict. This is narrower than adding a global checklist. The purpose is to stop a visible success in the candidate — for example preserved SAA identity or reduced size — from becoming the post-hoc whole acceptance criterion.

This is a **P3 question**, not an approved `visual-check` change.

### B. Change-impact invariant recheck

When a fix changes a mechanism that can affect other acceptance properties, identify the materially affected invariants and recheck those alongside the original failed property. The RVR example is `render scale`: it directly affected both physical screen size and pixel-grid density.

This is also a **P3 question**, not an approved rule. It must remain bounded enough not to become "rerun every check after every edit".

## 4. Paperthin WATCH signals from this incident

These are pre-P3 evidence signals only; the P1 classifications remain historically unchanged until P3.

| P1 mechanism | RVR signal before P3 | Boundary |
|---|---|---|
| `readchk` | no material signal | the incident is not primarily a request-interpretation failure |
| `shower` | partial supporting signal | author/session intent and labeled mocks biased self-review, but this does not prove a general artifact-alone comprehension requirement |
| `mandela` | strong supporting signal | implementation, mock, and checks shared assumptions; circular agreement did not provide independent correctness evidence |
| `re0-memo` | reopen at P3 | the one-off→global-rule guard is already covered, but "lesson actually becomes the next execution gate" failed after the first incident report |
| `catchup` | no material signal | the incident is not a human re-entry/context-restoration failure |

`re0-memo` being reopened at P3 does **not** rewrite its P1 `ALREADY_COVERED` classification. P3 may split the mechanism into an already-covered generalization guard and a separate lesson-to-execution transfer question.

## 5. Evidence-boundary corrections for P3

P3 must preserve these distinctions when using the report:

- Do not use one global evidence-authority ranking such as `user > image > automation > intent`. User approval/intent, visible artifact facts, structural checks, deployment identity, and runtime evidence each govern their own layer; one layer's PASS does not upgrade another.
- A failed candidate may still be shown as a diagnostic/failure artifact. The prohibition is against presenting it as approval-ready, accepted, ready-for-use, or complete.
- The report's detailed Gate 0–8 and visual status vocabulary are RVR-local recovery material unless P3 independently proves a recurring JOENESS need. Do not promote them wholesale into global Core or skill taxonomy.
- The report's external claim that Stardew Valley world pixels use `Game1.pixelZoom = 4` is important to the RVR diagnosis, but the supplied report does not bind that claim to an independently fetched source in this JOENESS research branch. Treat the external source binding as `UNVERIFIED` until a canonical project/source pointer is supplied.
- The supplied report is exact by filename/size/SHA-256 in this intake, but no accessible GitHub repository/commit/path for the source report was resolved. Do not invent one.
- The incident-time installed JOENESS revision was not proven by the supplied report. Do not claim this is an exact Core-v8 behavioral regression unless later evidence binds the incident to the installed Core and `visual-check` identities.

## 6. What P3 may and may not infer

P3 may use this incident to test whether:

- `mandela`-like validation-independence guidance has practical value;
- `re0-memo`'s broader lesson-to-next-run behavior is actually missing despite the existing one-off escalation guard;
- `visual-check` needs a bounded criteria-before-candidate rule;
- `visual-check` needs a bounded change-impact invariant recheck rule.

P3 may **not** infer from this incident alone that:

- Core v8 must change;
- a new public Paperthin-derived skill is required;
- every visual task needs a fresh reviewer, full state matrix, or RVR's nine status labels;
- the current six-skill catalog should expand;
- same-model or multi-agent agreement is independent proof;
- the RVR report by itself proves the exact installed harness revision failed.

## 7. Pre-Dororong stop boundary

This intake completes the safe preparation that can be done before the Dororong pilot is reviewed.

Do not implement, test, install, or route any Paperthin-derived candidate yet. Let Dororong M1 reach its existing completion / partial / blocked boundary under the unchanged installed JOENESS. Then run Stage P3 once using both the P1 matrix and real-project evidence, including this RVR intake, and advance no more than three candidates.
