# Project roadmap

Project scope: README.md에 적힌 정적 문의 폼(`src/`) 유지·개선. 현재 승인된 작업은 S1(요청 폼 글자 수 표시) 하나이며, 그 밖의 전체 목표·이후 단계는 결정 대기(direction pending; 사용자 결정 필요).
Product authority: [README.md](README.md) (요청 내용 최대 500자, 화면 크기 360·768·1280 지원). S1의 근거는 2026-11-15 사용자 요청.
Product revision / approval: README.md at commit 490f22d; 별도 제품 승인 기록 없음.
Current stage: S1 — not started (TASK 등록만, 구현 미착수).
Next eligible work: S1-2 표시 형식 결정(사용자 확인) 및 S1-1 구현 — 구현은 사용자 지시 후. 차단된 의존 없음.
Status words: not started / in progress / verification pending / on hold / complete / removed from scope.

## Stage S1 / 요청 폼 글자 수 표시 — not started

Goal: 요청 내용 입력란에 현재 글자 수를 표시한다 (2026-11-15 사용자 요청).
Entry condition: none.
Completion condition: S1-1~S1-3이 각 Check를 현재 입력에서 통과. 사용자 수락은 아래 User acceptance에 따로 둔다.

| ID | Required outcome | Status | Check / completion criterion | Evidence or gap |
| --- | --- | --- | --- | --- |
| S1-1 | 요청 내용 글자 수가 500자 제한과 함께 표시되고 입력·삭제·붙여넣기·전송 후 초기화 때 실제 값과 일치 | not started | Technical: `src/index.html`을 브라우저에서 열어 빈 값·입력·삭제·붙여넣기·500자·전송 후 reset에서 표시 수 = textarea 값 길이, 제한 수 = `maxlength`(500) 확인; 결과 TASK#t1 | 미구현 ([TASK#t1](TASK.md#t1--2026-11-15--요청-폼-글자-수-표시)) |
| S1-2 | 표시 형식(예: `N/500`)·위치·한도 도달 시 표시 결정 | not started | 사용자 확인 (README와 요청 모두 형식을 정하지 않음; 작업자가 고른 형식은 확인 전까지 verification pending) | 미결정 |
| S1-3 | 글자 수 표시가 지원 화면 크기에서 레이아웃을 깨지 않음 | not started | DESIGN.md#rule-coverage L1·C1 rows on current inputs (360·768·1280 × 빈 값·입력 중·500자), Spot check per row; result lines in saved JOEDESIGN report named in TASK#t1, `node <joedesign>/scripts/report-check.mjs --verify <file>` exit 0, stamp in TASK#t1. Technical (separate): S1-1 | 미실행 (C1 규칙은 S1-2 결정 후 확정) |

Scope decisions: none.
User acceptance: 별도 요구 미정 (S1-2의 형식 확인과 구분).
Optional/later: none.
