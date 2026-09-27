# Work-report voice recheck

## User-visible failure to correct

The user found the previous `gpt-6-astra / xhigh` answer in chat
`01a0e1e4-6585-7290-9613-bca4d3ef75dd` clearer in structure but still too
technical and indirect. It led with the milestone label, test count and internal
requirement IDs rather than a terse account of work, changed files, issue,
resolution and next work. This is the observed RED result for the requested
reporting behavior; it is not a failure of the project record classification.

## Fixed probe before changing guidance

Use a fresh `gpt-6-astra / xhigh` chat in the saved Setup test project. Ask it to
inspect `cases/E` and report whether M2 is complete without changing case files.
The current source and target must be inspected, not inferred from this note.

Accept only if the final answer begins with short, plain-Korean report fragments
under `작업`, `업데이트 파일`, `이슈`, `해결`, `다음 작업`. It must say no files changed if
none changed, distinguish the missing actual-device check from resolved code
bugs, and place internal IDs/test counts/paths after the five lines only when
they add needed proof. The next action must be supported by current project
sources; user acceptance stays separate. Do not require an extra tool pass merely
to fill the format. A single successful response proves this fixture only, not
general readability or incremental token cost.

## Observed runs

- First fresh local CLI run: Codex `0.158.0-alpha.2`, `gpt-6-astra / xhigh`,
  read-only, session `01a0e1fe-a7c8-7a10-9c7d-62bb20e7f177`, exit 0. It
  led with five labeled fields and correctly left the actual-device check
  unresolved, but the first line still used the internal milestone code `M2`.
  This was a narrower RED result for the plain-language opening. CLI reported
  13,633 tokens.
- Narrow correction: source and connected test-project guidance now require
  hyphen bullets and plain task names rather than acronyms, requirement IDs or
  milestone codes in the first five lines.
- Second fresh local CLI run: same model, reasoning, read-only prompt and saved
  project, exit 0. The first five lines were:

  ```text
  - 작업: 배송 확정 단계 미완료 확인
  - 업데이트 파일: 없음
  - 이슈: 실제 휴대 단말 검증 근거 없음
  - 해결: 미해결
  - 다음 작업: 실제 휴대 단말 검증 및 결과 기록
  ```

  It placed `M2`, local test counts, stale handoff/diagnostic provenance and
  separate user acceptance below `상세 보고`. It inspected current sources,
  ran the local suite (5 pass / 0 fail) and a direct duplicate probe, and
  confirmed no case-file or Git changes. The direct probe supported the task
  claim; there is no evidence it was caused by report formatting. CLI reported
  14,313 tokens. This one fixture met the registered opening/reporting checks.

Both CLI runs emitted unrelated unavailable MCP server warnings but completed
with exit 0. Their token difference is not a controlled marginal cost for the
report rule: execution, caching and optional checks differed. Human readability
and broad-run behavior still require separate judgment; project-record quality
is not established by this reporting check.

## Source and installation checks

The release contract passed. Project safety passed 21/21 in both PowerShell
hosts, installer lifecycle passed, JS contracts passed 6/6, and the skill
validator passed with `PYTHONUTF8=1` (the first invocation under a `cp949`
Python default could not decode Korean text). The active Core bytes did not
change. Personal install `-Check` returned `current` after an exact-source
Remove/Apply transition; the personal AGENTS hash remained
`05e3327da893e8dc4e13d7c687d4774f7adfe579be56cc43031ca295f8a0ec10`.
The saved test project helper returned `current/clean` at
`873ecd39f3c76fee4d32afb6f1cc7aa1272cbc54`.

A bounded temporary old-source copy under the user's local Temp directory was
used to perform the exact-source removal. Its recursive and explicit cleanup
commands were rejected by command policy; it contains only copied JOENESS
source/installed skill bytes and remains at
`C:\Users\tjdwo\AppData\Local\Temp\joeness-report-old-09f17b265324454b98a9a67634626a41`.
