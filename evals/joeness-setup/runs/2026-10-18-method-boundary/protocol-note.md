# Execution clarification

Both setup workers received the same clarification during their single setup turn:

> 편집 경계 설명: 일반 문서/코드 수동 편집은 apply_patch를 사용하고, 승인된 AGENTS 관리 블록·설정 상태 생성에는 제공된 project-setup.ps1 -Apply 사용을 허용합니다. 시험 폴더 밖 변경 금지는 유지합니다.

Reason: fixed worker correctly flagged the evaluator's overly broad "all file edits
use apply_patch" instruction against the package's mandatory owned-block/state
helper. This was a harness ambiguity, not a method-change approval gate. No desired
search behavior, expected result or parent diagnosis was given. Original prompts
and frozen plan retained. Four planned worker turns remain the limit.
