# Task 8 Report — JOENESS User Guide

## RED / GREEN

- RED: `sync-harness.tests.ps1` failed because the prior README used the old title and entrypoint.
- GREEN: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tests\sync-harness.tests.ps1` passed (`PASS sync-harness contract`).
- Integrity: `node --test .\tests\design-vendor-integrity.tests.mjs .\tests\skill-contracts.tests.mjs` passed (15 tests); `git diff --check` passed.

## Bilingual parity

Both guides provide the same five first-use steps, primary Check/Apply/Remove commands, four roles, PowerShell-versus-chat clarification, separate external-plugin boundary, and compatibility mapping.

## Old-name counts

`JOENESS-0.1.ps1`, `harness.ps1`, `joewrks-project-setup`, and `joewrks-design-frontend` each occur exactly twice: once in each language's compatibility table.

## Beginner flow

The normal path is: extract the complete ZIP, open PowerShell from File Explorer's address bar, Check, Apply only when ready and Check again, then restart Codex or open a new task for a natural-language request.

## External-plugin boundary

Figma, Superpowers, and Ponytail are described as separately installed external plugins selected only for relevant work. Their internal skill names are not presented as JOENESS commands. UI UX Pro Max and Apple Design are documented as `$design` reference material.

## Self-review

The roles table contains only call name, responsibility, and automatic-selection condition. README is deliberately limited to installation, use, compatibility, plugin boundary, and removal.

## Concern

The complete sync-harness suite is intentionally comprehensive and took about 423 seconds; it completed within the required 600-second cap.
