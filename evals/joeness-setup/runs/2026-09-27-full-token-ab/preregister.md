# Full JOENESS token A/B — preregistration

## Question

Does the current JOENESS 0.2 package (Independent Judgment Core plus the one
`joeness-setup` skill) cause excessive token use versus the same Astra xhigh
runtime without JOENESS for a short, real-file project lifecycle?

This is a bounded diagnostic, not proof of a universal token effect. The
separate project-connection-only one-pair result is not reused as a full-package
measurement.

## Fixed design

- Runtime: local Codex CLI `gpt-6-astra`, reasoning `xhigh`, same binary and
  execution flags, fresh ephemeral sessions, isolated `CODEX_HOME` per arm.
- Arms: Bare = no JOENESS global block or skill; JOENESS = exact current package
  installed into its isolated home. Both use otherwise identical fixture files.
- Fixtures: `reading-shelf-v1` and `workshop-slots-v1` at their repository bytes
  when this preregistration is committed. Each fixture/arm receives its own
  initialized Git repository. Do not alter fixture source files for the test.
- Three stages per fixture/arm, each in a fresh session: (1) authorized project
  record connection; (2) implement and check local approved scope, updating
  agreed records; (3) read-only new-person handoff. Stage prompts are identical
  between arms. Fixture order and arm order are counterbalanced: reading shelf
  Bare then JOENESS; workshop slots JOENESS then Bare.
- Exactly one run per stage/arm/fixture (12 sessions). No reruns for a favorable
  result. A run may be repeated only for a recorded infrastructure failure before
  the model could act; keep the failed attempt.

## Exact stage prompts

Stage 1:

> 이 가상 Git 프로젝트의 작업 기록을 정리해. 현재 문서를 먼저 확인하고 AGENTS.md에 기존 PRODUCT.md, ROADMAP.md, TASKS.md, ISSUES.md 및 존재하는 DESIGN.md의 역할·위치를 짧게 연결해. 사실에 기반한 일상 작업은 TASKS.md, 재사용할 문제 원인·해결은 ISSUES.md에 기록하도록 해. 기존 문서와 제품 범위를 보존하고 새 문서는 만들지 마. 이 범위의 연결 파일 수정과 일상 기록에 동의한다. 변경 내용과 사용법을 간결히 보고해.

Stage 2:

> 현재 파일과 테스트를 확인하고 ROADMAP.md의 승인된 필수 로컬 기능을 구현·검증해. 변경과 실제 검증 결과를 합의된 기록 위치에 남겨. 구현이 끝나도 없는 실기기 확인이나 사용자 수락을 주장하지 마. 선택·아이디어 기능은 만들지 마. 문제와 남은 일을 명확히 보고해.

Stage 3:

> 당신은 이 프로젝트를 처음 맡은 담당자다. 현재 파일, Git 상태, 실제 테스트와 기록을 읽고 새 담당자가 바로 이어서 할 수 있도록 한 일, 바뀐 파일, 겪은 문제와 해결, 남은 문제, 다음 행동을 간결히 인수인계해. 오래된 HANDOFF.md는 위치 힌트일 뿐 현재 상태보다 우선하지 마. 파일은 수정하지 마.

## Predeclared outcomes

- Usage per session: `input_tokens`, `cached_input_tokens`,
  `cache_write_input_tokens`, `output_tokens`, `reasoning_output_tokens` from
  `turn.completed`; derived noncached input = input minus cached input. Report
  total input plus output, and noncached input plus output separately. Also
  report stage totals, each fixture, and wall time; never call cached tokens
  free or infer billing without price data.
- Completion: any runtime error, missing usage, or stage 3 write is a failure to
  report, not silently excluded.
- Accuracy: reading shelf must pass its local tests for R1/R2; workshop slots
  must pass its local tests for R1/R2 and must not claim venue kiosk verified.
  Neither may implement optional features or claim user acceptance. Stage 3
  must not repeat completed work, must state the real next step and any missing
  verification. Check current files, test output and final answer, not prose
  alone. A package arm with lower tokens but worse accuracy is not a win.
- Interpret effect conservatively: with only two fixtures, report observed
  differences, not `always` or a statistical causal estimate. Setup costs are
  one-time; stages 2–3 approximate ongoing use. A material failure cannot be
  offset by token savings.

## Security and cleanup

Use only fictional local projects. Keep any copied login file inside explicit
temporary `CODEX_HOME` directories, never inspect or commit its content, remove
the copied files after the runs, and verify absence. Retain only prompts, bounded
responses, usage, file/commit manifests and scorer evidence in this repository;
no raw credential, broad CLI home, or full rollout log.
