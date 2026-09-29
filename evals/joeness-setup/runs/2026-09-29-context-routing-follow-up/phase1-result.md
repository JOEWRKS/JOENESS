# Phase 1 result — automatic connection not yet verified

Protocol: [phase1-preregistered.md](phase1-preregistered.md). Date: 2026-09-29. The disposable fixture, not any user project, was the only project target.

## Setup result

- Candidate connection source: `skills/joeness-setup/assets/AGENTS.md` SHA-256 `fb1d13609cb406636ec48e65feba50d279677822290ca029595fa6494541719a`.
- Candidate body used actual fixture paths and routine-record scope, applied with `project-setup.ps1`: `ready → current → current`. Installed `AGENTS.md`: 3,833 bytes, SHA-256 `6dd6524b2ca03e3c0229edd6f1a44dce812f8d7f6360d109002299af522a1203`.
- The connection fit the observed 32 KiB initial window. The helper's post-run `-Check` was still `current/clean`, state SHA-256 `4894cb94a1e6a91767d663ce8f5da037e04b70c8e568f884625ce34a0fc67a81`.
- Git after the run showed only the newly applied, untracked `AGENTS.md` and `.joeness/`; tracked file diff was empty. Product, Roadmap, Task, Issues, Design and source hashes matched their pre-run fixture contents.

## Fresh execution

An old `codex-cli 0.146.0` diagnostic failed before model response with HTTP 400 for `gpt-6-sol`; it did not test project behavior. A locally present `codex-cli 0.158.0-alpha.2.1` was then used for the preregistered `gpt-6-astra` / `xhigh` execution, read-only sandbox, ephemeral, ignored user config. CLI thread: `01a0eca3-010b-77c0-ba8d-de40d2f6ce3a`. The prompt contained no JOENESS name, SKILL path, reading order or report-format hint.

The agent initially said it would compare current task and roadmap to files. Three read-only shell calls, including `rg --files` and `Get-Content -LiteralPath TASK.md,ROADMAP.md`, were rejected by the execution policy before file contents were returned. The agent then called `list_mcp_resources`, which returned a large unrelated plugin listing but no project files. Its first final response used the six report fields, said file reading was blocked, refused to invent completed/open work, and requested TASK/ROADMAP contents. It made no file changes. That is correct failure disclosure, **not** the preregistered project handoff pass.

CLI usage for this incomplete run: 152,767 input tokens, of which 126,208 were cached; 867 output tokens. The large MCP resource listing and client/plugin context contributed to this run, so it is not a normal JOENESS daily-work cost sample or a Bare comparison.

## Classification and next condition

- Setup helper and bounded AGENTS placement: **PASS**.
- Fresh response consistent with receiving the report rule: **OBSERVED**, not direct proof of injected instructions.
- Current-file read, selective routing, accurate complete/open/next handoff: **UNVERIFIED — environment blocked read-only file commands**.
- Phase 1 as a whole: **ON HOLD**, not PASS and not a JOENESS semantic failure.
- Independent Phase 2 precondition: the newer CLI elicited a completed Astra/xhigh-requested model response and thread/usage record. Exact internal model identity was not separately exposed. Phase 2 behavior remains gated by Phase 1's incomplete file access.

A valid retry needs a fresh project session in an environment that permits ordinary read-only file inspection, without bypassing security policy or injecting the SKILL into the prompt. Keep this result; do not score a text-only substitute as automatic project routing.
