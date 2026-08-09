---
name: visual-check
description: Use when a user reports or rejects a concrete visual, animation, rendering, direction, motion, viewport, or device-state mismatch against an implemented or accepted result. Do not use for new design exploration, subjective first-draft preference, or nonvisual defects.
---

# Visual Check

Bind the original failure to the exact named target and state. Add only protected regression states; do not invent a full state matrix.

Use one causal hypothesis and the minimum coherent change set that can test it. Record why inseparable edits belong together. Do not repeat a rejected hypothesis or failed method without new evidence.

Keep source inspection, build artifact, deployed artifact, visual candidate, and user acceptance as separate states. Automated checks or a different state cannot prove the original visual failure fixed. When a deployable result becomes a future baseline, bind the applicable source commit/worktree, build hash, deployed hash, exact target/state, and user verdict in the project's chosen evidence pointer.

Treat accepted, restorable-copy-present, and restore-tested as different states. Follow the Interaction Safety Core retry and external-process limits. Use project-owned verification tools; do not create a general deployment or screenshot system.

A rejected hypothesis requires new evidence; without it, do not repeat the hypothesis or method.
