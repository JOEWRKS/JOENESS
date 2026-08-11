---
name: visual-check
description: Use when work creates, changes, implements, or delivers an output whose acceptance depends on appearance, layout, motion, or target rendering; a user reports or rejects a concrete visual, animation, rendering, direction, motion, viewport, or device-state mismatch; or an approved visual reference must be translated across medium, resolution, size, or derived state. Do not use when the requested work only plans or discusses subjective intent and neither produces nor changes a visual artifact, or for backend or nonvisual work, layout-unaffected copy, or rendering-inert refactors.
---

# Visual Check

## Load only the applicable contract

- Always read `references/durable-evidence.md` (REQUIRED).
- Read `references/concrete-defect.md` for a concrete defect or rejected result (REQUIRED in that mode).
- Read `references/approved-reference.md` for approved-reference translation (REQUIRED in that mode).
- If both modes apply, read both; otherwise do not load them.

## Visual completion gate

Use this gate only when authorized work actually created, changed, or implemented an output whose acceptance depends on appearance, layout, motion, or target rendering. Run it before any claim that the affected task or output meets acceptance or is ready for use, delivery, or release, regardless of status wording. It does not trigger for planning or reference discussion without an output, backend or nonvisual work, layout-unaffected copy, or a rendering-inert refactor.

Before verdict, derive the smallest claim-specific checks from the user request, approved reference, project-owned contract, and authoritative target. Cite each source. Excluding an inapplicable layer narrows the claim but is not an acceptance check. With no sourced check, mark UNVERIFIED instead of deriving PASS from the candidate. For each required check record: expected observable; concrete, falsifiable observed fact; PASS, FAIL, or UNVERIFIED. Opening evidence, repeating the expectation, or saying it looks plausible is not an observation. For a relation, name both subjects and their actual anchor, contact, relative position, scale, layer, or occlusion.

Any required FAIL means overall FAIL; otherwise any required UNVERIFIED means overall UNVERIFIED; otherwise overall PASS. State the overall verdict first in the user's language; narrower PASS results follow and never lead with a qualified PASS. A required FAIL or UNVERIFIED blocks only downstream work that inherits or amplifies it. Independent work may proceed only after stating why it is independent and cannot upgrade the overall verdict.

Include only applicable properties. Keep the required per-check record and sources in a project-provided evidence location; otherwise include them in the task result. Do not create a file, document, check, or log solely to fill a report; this never removes a verification required by the original task. Without a fixed format, the user-facing summary puts the overall verdict first in the user's language, identifies the exact artifact/version and target, cites the existing detailed-record pointer or applicable check IDs, and includes only applicable result, actual verification, decisive FAIL or UNVERIFIED check, and dependent boundary. Use no fixed labels, line count, or empty fields. When the detailed record is already linked, add chat detail only when requested or required by the project report.
