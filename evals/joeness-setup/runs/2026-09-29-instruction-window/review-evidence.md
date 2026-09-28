# Long AGENTS.md instruction-window safety check

Date: 2026-09-29. Scope: JOENESS project-setup helper and its test fixture. No DungeonGameV3 source, task record, user-owned instruction, or JOENESS-owned project block was edited in this check.

## Observation and cause

The authorized DungeonGameV3 worktree at `D:\JOEWRKS\.worktrees\T081-runtime-pass1` has an `AGENTS.md` of 39,918 UTF-8 bytes (SHA-256 `c6f38ea0b95e28825a6ef2d72e2aa46762ba349b4dc1dd541b665edf22d3571c`). The front JOENESS block and its separator account for 1,334 bytes; the unchanged outside text is 38,584 bytes. The observed Codex CLI run warned that the project document exceeded its remaining 32,768-byte instruction budget and would be truncated. The block itself fits, but its insertion displaces 1,334 bytes of existing project instructions that would otherwise fit within that initial window (SHA-256 of displaced range: `88285752eb703721ddc8ba5bf605d3b13a49e58815436acb1e2c0c207bfd3c68`). That range includes project scope and tool/document-check rules. Earlier helper `-Check` returned `current/clean`, because it only tested whether the owned block ended inside the window. This was a false safety signal, not proof that all user instructions were delivered.

The 32 KiB limit is the observed CLI behavior for this project, not a claim that every Codex host or context has the same limit. Failing closed is appropriate until the complete instruction file is within the observed bound; `clean` only describes ownership integrity.

## Reproduction and correction

Tests were changed first. On the previous helper, the long-AGENTS preflight failed with `expected=blocked actual=ready`. The corrected helper checks the entire composed `AGENTS.md` before Apply or Relocate, and an existing oversized file returns `blocked` on Check. Relocate also blocks when the owned block is already at the front; that no-op path must not claim `current` for an unsafe oversized file. It never truncates or rewrites user-owned text to fit. Detach remains available so an owned connection can be removed without editing outside bytes.

With the corrected source helper, a read-only `-Check` on the real game worktree returned `blocked` with `blockState=clean` and no changed targets. The `AGENTS.md` SHA-256 remained the same. The game's concurrent Git changes were not touched.

The previously installed personal package matched the unmodified source commit `20b02297df7b0f77cf5e25174233ac0b5646ba14` exactly (`-Check: current`). It was removed through that exact prior source, then the corrected candidate was applied from this branch; its fresh personal `-Check` is `current`, with `joeness-setup` as the only active skill. This changes the personal package, not the game project's connection or its user-owned instructions.

Fresh validation: PowerShell 7 project-setup suite 25/25; Windows PowerShell project-setup suite 25/25, including exactly 32,768 bytes and one byte over; installation lifecycle PASS; source sync PASS; Node contract/fixture suite 6/6; skill format validator PASS. These are helper and package checks, not a fresh game-agent runtime test. Prior format-bias and handoff evidence is retained.

## Open boundary

DungeonGameV3 remains connected but unsafe to call `current`: some existing instructions fall outside the observed initial window. Its owner must choose whether to approve a scoped reorganization of user-owned `AGENTS.md` that preserves intended authority and fits the window, or detach only the JOENESS block. Neither action was inferred from the general request to fix JOENESS source. Do not report this project as fully verified or JOENESS as release-ready on this evidence.
