너는 아래 프로젝트에서 일하는 코딩 에이전트다.
프로젝트 폴더: <data>\runs\<rNN>\project
이 기계에 설치된 스킬(읽기·스크립트 실행만, 수정 금지):
- JOENESS 설정 스킬: <data>\runs\<rNN>\tools\joeness-setup (SKILL.md부터 읽는다)
- JOEDESIGN 디자인 스킬: <data>\runs\<rNN>\tools\joedesign
<환경 줄>
이 프로젝트 폴더와 위 스킬 폴더 밖의 파일은 읽거나 쓰지 마라. 명령은 프로젝트 폴더를 작업 폴더로 삼아 실행한다.<S2: 먼저 이 폴더의 AGENTS.md를 읽고 그 규칙을 따른다.>

사용자 요청: "<요청>"

작업을 끝내면 사용자에게 줄 최종 보고 전문을 이 폴더의 .final-report.md에 저장하고(커밋하지 않는다), 응답은 "완료" 한 단어로 끝내라.

---
환경 줄:
- S1: `환경 변수: JOEDESIGN_HOME 설정 안 됨. (JOEDESIGN은 위 설치 위치에 있다.)`
- S2: `환경 변수: JOEDESIGN_HOME=<data>\runs\<rNN>\tools\joedesign (이 기계의 설정값. 도구 셸에는 전달되지 않으니 필요하면 이 값을 직접 쓴다.)`

요청:
- S1: 이 프로젝트에 JOENESS를 연결해 줘. 설치 스크립트를 쓰고, 제안 확인은 건너뛰고 바로 적용해도 돼(AGENTS 연결과 ROADMAP·TASK·ISSUES·DESIGN 생성, 기록 범위 TASK·ROADMAP·ISSUES·DESIGN 승인). 디자인 검사는 JOEDESIGN을 쓸 거야. 첫 TASK로 '요청 폼 글자 수 표시'를 등록하고(구현은 아직 안 함), 끝나면 전부 커밋해 줘.
- S2: 입력창 최소 높이 44px(360·768) 규칙을 디자인 규칙 C3으로 추가하고 검사 결과까지 기록해 줘. ROADMAP에 필수 항목 CO3으로 넣고 Check도 갱신해 줘.
