- 작업: 프로젝트에 JOENESS 연결하고 첫 작업 '요청 폼 글자 수 표시' 등록(구현은 안 함)
- 업데이트 파일: 작업 규칙 연결(AGENTS.md, .joeness/setup-state.json), 로드맵(ROADMAP.md), 작업 기록(TASK.md), 문제 기록(ISSUES.md), 디자인 규칙(DESIGN.md)
- 이슈: 없음
- 해결: 없음
- 남은 문제: 글자 수 표시 방식(형식·위치·500자 도달 시 표현·세는 기준) 미결정, 카운터 디자인 규칙 미정, 프로젝트 전체 목표·단계 미정, 새 채팅에서 지침 전달 확인 안 함
- 다음 작업: 글자 수 표시 방식 결정 → 구현 → JOEDESIGN 디자인 검사

상세 보고
- 연결: 설치 스크립트로 확인(Check) 후 적용(Apply)했고, 다시 확인한 결과 `current`. 커밋 `558b086`(전부 커밋, 작업 트리 깨끗함).
- 기록 범위: TASK·ROADMAP·ISSUES·DESIGN(사용자 승인 2026-11-15). 제품 기준은 README.md(최대 500자, 화면 360·768·1280).
- ROADMAP: 단계 W1 '요청 폼 글자 수 표시'를 not started로 둠. W1-1 동작(기술 확인), W1-2 디자인(JOEDESIGN 검사: DESIGN.md#rule-coverage 행 기준, 보고서는 `node <joedesign>/scripts/report-check.mjs --verify` exit 0 필요), W1-3 표시 방식 사용자 확인. 이후 목표·단계는 꾸며 넣지 않고 '미정'으로 표시함.
- TASK: W1 등록 항목 하나(검사 실행 없음, Report stamp: none ran).
- DESIGN: 승인된 시각 원본·규칙 없음(DRAFT). 현재 CSS 값은 measured로만 적음(예: 입력란 높이 44px, 1280 이상에서 입력란만 40px). JOEDESIGN 보고 형식(Report Form)을 넣어 둠. Rule Coverage 행은 아직 없어서 통과한 규칙도 없음.
- JOEDESIGN 경로: 커밋된 문서에는 `<joedesign>`을 글자 그대로 두고, 이 기계의 설치 위치(JOEDESIGN_HOME이 없으면 설치 폴더)를 뜻한다고 적음. 기계 경로는 커밋하지 않음.
- 검증 범위: 연결 구역 적용만 확인함. 문서 내용은 직접 다시 읽어 확인함. 새 채팅에서 지침이 실제로 전달되는지는 확인 안 함. 디자인 검사(design checks: none ran)와 작업 결과 검증은 실행하지 않음.
- 선택 항목: Claude Code용 턴 사이 변경 알림 hook은 승인받지 않아 넣지 않음. 원하면 따로 제안 가능.
