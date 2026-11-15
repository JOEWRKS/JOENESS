- 작업: JOENESS 연결, 기준 문서 4개 생성, 첫 작업 T1 '요청 폼 글자 수 표시' 등록 (구현 안 함), 커밋.
- 업데이트 파일: 작업 규칙 연결(AGENTS.md), 연결 기준 상태(.joeness/setup-state.json), 로드맵(ROADMAP.md), 작업 기록(TASK.md), 문제 목록(ISSUES.md), 디자인 규칙(DESIGN.md).
- 이슈: 없음.
- 해결: 없음.
- 남은 문제: 글자 수 표시 형식·위치 미결정, 구현·기술 검사·디자인 검사 미실행, 새 채팅에서 지침 전달 확인 안 함.
- 다음 작업: 표시 형식 결정(예: `N/500`, 입력란 아래 오른쪽 등) 후 구현 지시 → S1-1 기술 확인, S1-3 JOEDESIGN 검사.

design checks: none ran

상세 보고
- 연결: 설치 스크립트 `-Check`(ready) → `-Apply`(current) → 재확인 `-Check`(current, blocker 없음). AGENTS 연결 본문의 `<joedesign>`은 기기 경로 대신 문자 그대로 두었고, "작업 기기에 설치된 JOEDESIGN 폴더(JOEDESIGN_HOME이 있으면 그것)"라는 뜻을 한 줄 덧붙였습니다. 커밋된 파일에 기기 경로 없음 확인.
- 기록 범위: TASK·ROADMAP·ISSUES·DESIGN (2026-11-15 승인). 제품 기준은 README.md(500자 제한, 360·768·1280 지원), 별도 승인 기록 없음.
- ROADMAP: 단계 S1 하나만 등록(not started). S1-1 글자 수 표시 동작(기술 확인), S1-2 표시 형식 결정(사용자 확인 필요 — README와 요청 모두 형식을 정하지 않음), S1-3 레이아웃(DESIGN 규칙표 L1·C1 행, 저장된 JOEDESIGN 보고서 `report-check --verify` 통과 필요). S1 이후 프로젝트 목표는 결정 대기로 두었습니다.
- DESIGN: DRAFT Rev 1. 승인된 시각 원본 없음. 현재 CSS 값은 measured로만 기록(승인 아님). C1 규칙은 형식 결정 후 확정.
- TASK T1: 등록만, 변경 코드 없음, Report stamp `none ran`.
- 선택 사항(미적용): Claude Code용 턴 사이 변경 알림 hook은 별도 승인 시에만 추가합니다.
- 커밋: `0122393` (master). 이 보고 파일은 커밋하지 않았습니다. 연결 정상과 문서 적합성은 확인했고, 새 채팅에서의 지침 전달과 작업 결과 검증은 아직 확인하지 않았습니다.
