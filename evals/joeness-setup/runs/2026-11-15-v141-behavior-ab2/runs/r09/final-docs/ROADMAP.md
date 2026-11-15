# Project roadmap

Project scope: 작은 정적 문의 폼(`src/`) 유지·개선. 프로젝트 전체 목표와 단계 순서는 미정(direction pending) — 결정 필요: 글자 수 표시 이후의 목표·단계를 사용자가 정한다.
Product authority: [README.md](README.md) — 요청 내용 최대 500자, 화면 크기 360·768·1280 지원.
Current stage: W1 요청 폼 글자 수 표시 — not started.
Next eligible work: W1-1 구현 전 표시 방식 결정(아래 W1 결정 필요) → 구현. 막힌 의존 없음.
Status words: not started / in progress / verification pending / on hold / complete / removed from scope.

## Stage W1 — 요청 폼 글자 수 표시 — not started

Goal: 요청 내용 입력란에 현재 글자 수를 표시한다(사용자 요청 2026-11-15; 상세 표시 방식은 미정).
Entry condition: none.
Completion condition: W1-1·W1-2 모두 각자의 Check 통과, W1-3 표시 방식이 사용자 확인됨. 사용자 수락은 별도(아래).

| ID | Required outcome | Status | Check / completion criterion | Evidence or gap |
| --- | --- | --- | --- | --- |
| W1-1 | `#body` 입력 시 현재 글자 수가 갱신되어 보이고, 최대 500자(README) 기준과 일치 | not started | Technical: 빈 값·입력 중·500자·폼 제출 후 초기화 상태에서 표시 숫자가 실제 글자 수와 같은지 브라우저 확인. 글자 수 세는 기준(공백·줄바꿈·이모지)은 W1-3에서 확정 | 미구현. [TASK](TASK.md#w1-2026-11-15--요청-폼-글자-수-표시-등록) |
| W1-2 | 카운터가 DESIGN 규칙을 지킴(360·768·1280) | not started | Visual (JOEDESIGN): DESIGN.md#rule-coverage 의 카운터 행(아직 없음 — 구현 전 JOEDESIGN이 추가) on current inputs, 360·768·1280 × 빈 값/입력 중/500자 상태, Spot check per row; 결과 줄과 보고 파일은 TASK, 보고서 `node <joedesign>/scripts/report-check.mjs --verify <file>` exit 0 필요 | 규칙 행 없음(undecided). [DESIGN](DESIGN.md#rule-coverage) |
| W1-3 | 표시 방식(형식 예: `N/500`, 위치, 500자 도달 시 표현, 세는 기준)을 사용자가 확인 | not started | 사용자 결정 기록(누가·언제) | 미결정 — README와 요청에 없음 |

Scope decisions: none.
User acceptance: W1 결과물에 대한 사용자 수락 — pending.
Optional/later: none.
