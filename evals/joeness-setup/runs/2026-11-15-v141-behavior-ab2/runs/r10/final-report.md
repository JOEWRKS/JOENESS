- 작업: JOENESS 프로젝트 연결, 첫 작업 '요청 폼 글자 수 표시' 등록(구현 안 함), 커밋
- 업데이트 파일: 작업 규칙 연결(AGENTS.md), 연결 기준 기록(.joeness/setup-state.json), 로드맵(ROADMAP.md), 작업 기록(TASK.md), 문제 기록(ISSUES.md), 디자인 기준(DESIGN.md)
- 이슈: 없음
- 해결: 없음
- 남은 문제: 글자 수 표시 형식 미정(문구·위치·세는 기준·500자 도달 시 표현), 디자인 검사 방법 미정, 새 채팅에서 지침 전달 미확인, 장기 목표 방향 미정
- 다음 작업: 글자 수 표시 형식 결정(S1-D) → 구현 지시 시 구현(S1-R1) → JOEDESIGN 디자인 검사(S1-R2)

design checks: none ran

상세 보고
- 연결: 설치 스크립트 `-Apply` 후 `-Check` 결과 `current`(blockState `clean`). 이 결과는 AGENTS 연결 구역만 확인한 것이고, 새 채팅에서 지침이 실제로 읽히는지는 확인하지 않았습니다.
- 기록 범위: 승인하신 대로 TASK·ROADMAP·ISSUES·DESIGN. DESIGN에는 승인된 결정과 측정값·제안 표시만 씁니다. 제품 기준은 README.md(최대 500자, 360·768·1280 지원)입니다.
- ROADMAP: 단계 S1 '요청 폼 글자 수 표시'(not started)에 필수 항목 셋을 두었습니다. S1-D 표시 형식 결정(사용자), S1-R1 동작(빈 칸·입력 중·500자·제출 후 관찰), S1-R2 디자인(DESIGN.md#rule-coverage D1~D2 행, JOEDESIGN 보고는 report-check `--verify` exit 0 필요). 요청이 "글자 수 표시"만 정했으므로 형식은 제가 정하지 않고 결정 대기로 두었습니다. 사용자 수락이 필요한지도 미정입니다.
- DESIGN: JOEDESIGN 양식, 상태 DRAFT. 승인된 시각 원본은 없고, 현재 CSS 값은 측정값으로만 적었습니다. D1·D2 규칙은 제안 상태이며 검사 방법은 구현 전에 JOEDESIGN이 정합니다. 참고로 1280px 이상에서 input 높이는 40px, button은 44px입니다. 의도한 것인지 확인되지 않아 결함으로 기록하지 않았습니다.
- ISSUES: 확인된 결함이 없어 "none"으로 두었습니다. Library/는 저장할 자료가 생기면 만듭니다.
- 커밋: `025e9d5`(6개 파일). 기록에 이 기계의 경로는 넣지 않았고, JOEDESIGN 위치는 `<joedesign>`으로만 적었습니다.
- 선택 사항: Claude Code용 턴 사이 변경 알림 hook은 설치하지 않았습니다. 원하시면 따로 승인해 주세요.
- 평소 사용: "로드맵의 다음 작업 이어서 진행해"로 재개합니다. 기록을 남기지 않으려면 "이번 작업은 문서에 기록하지 마"라고 하시면 됩니다.
