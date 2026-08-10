---
name: visual-check
description: Use when work creates, changes, implements, or delivers an output whose acceptance depends on appearance, layout, motion, or target rendering; a user reports or rejects a concrete visual, animation, rendering, direction, motion, viewport, or device-state mismatch; or an approved visual reference must be translated across medium, resolution, size, or derived state. Do not use when the requested work only plans or discusses subjective intent and neither produces nor changes a visual artifact, or for backend or nonvisual work, layout-unaffected copy, or rendering-inert refactors.
---

# Visual Check

## Visual completion gate

Use this completion gate only when authorized work actually created, changed, or implemented an output whose acceptance depends on appearance, layout, motion, or target rendering. Run it before any claim that the affected task or output meets acceptance or is ready for use, delivery, or release, regardless of status wording. It does not trigger for planning or reference discussion without an output, backend or nonvisual work, layout-unaffected copy, or a refactor that cannot affect rendering.

Bind the evidence to the exact produced artifact and version, named target and state, and acceptance intent. Inspect the rendered content or frames in its native target form and the minimum actual-use context needed for the claim: the Figma artifact for Figma work, a real browser for web UI, the runtime or named device for an app or game, and the exact file at native scale for an image or sprite. For an asset-only claim, inspect the exact file at native scale. For an applied, installed, or in-game claim, inspect the exact current build in the named runtime state; file inspection alone is insufficient. Inspect motion in a representative playback state, not only a still frame. Build, test, tool success, filename, or file existence is not visual verification. A capture being created or generated is not enough; open and inspect its content. The completion-reporting agent must inspect the evidence itself; a reviewer or tool PASS does not substitute for that inspection.

Track only applicable layers and keep them separate: implemented, packaged, installed exact artifact, rendered on the named target, interaction rechecked, and user accepted. If exact visual verification is unavailable, preserve the implementation and report in the user's language `implemented, visually unverified` with the missing target or check; do not claim that it meets acceptance or is ready for use, delivery, or release.

## Concrete defect verification

Bind the original failure to the exact named target and state. Add only protected regression states; do not invent a full state matrix.

Use one causal hypothesis and the minimum evidence needed to test it. If the request authorizes inspection or diagnosis only, reproduce and inspect; do not change artifacts. Only with fix authority, use the minimum coherent change set and record why inseparable edits belong together. Retry identity is the causal mechanism plus expected observation, not a tool or command name.

A rejected hypothesis requires new evidence; without it, do not repeat the hypothesis or method.

## Approved-reference translation

For approved-reference translation across medium, resolution, size, or derived state, approved downstream anchors and contracts must not move to fit a failed derivative unless the user separately authorizes an intent change. For each materially different output kind or target form, produce one representative and verify it in its native target form and the minimum actual-use context needed for the next claim before dependent fan-out. If representative verification remains unresolved, whether objective or subjective, pause dependent fan-out. Ask the user only when the remaining judgment is subjective intent; resolve objective evidence without another approval gate. A numeric proxy does not override the approved reference; outside the exact verified target and state it remains a hypothesis. The request authorizes the bounded translation, not unrelated intent changes. Do not add repeated approval gates. When a follow-up variant or task must reuse the approved reference, identify it by a stable project-owned path and version; a temporary attachment path is not durable evidence.

## Shared evidence boundaries

Keep source inspection, build artifact, deployed artifact, visual candidate, and user acceptance as separate states. Automated checks or a different state cannot prove the original visual failure fixed. When a deployable result becomes a future baseline, bind the applicable source commit/worktree, build hash, deployed hash, exact target/state, and user verdict in the project's chosen evidence pointer.

Treat accepted, restorable-copy-present, and restore-tested as different states. Follow the Interaction Safety Core retry and external-process limits. Use project-owned verification tools; do not create a general deployment or screenshot system.
