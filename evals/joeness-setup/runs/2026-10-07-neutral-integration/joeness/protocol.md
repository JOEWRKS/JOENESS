# 중립 연결·재개 검증 — JOENESS 담당

기준 후보: f7f9a2b9c40408312bf8bd4266dd9f021146d484. 배포 파일 변경 없는 한정 검증.
실제 프로젝트·개인 설치·기존 APP-001 기록은 변경하지 않는다. 새 worktree 없음.

1. JOENESS-only: 일반 제품 문서가 있는 합성 Git 프로젝트에 실제 helper Check→Apply→Check.
   기존 AGENTS 본문·제품/운영 원본 보존, 정확한 연결 경로와 current/clean 확인.
   fresh-context 작업자는 AGENTS와 원본만 읽어 현재 작업을 인계한다.
   JOEFLOW schema/ID/Manifest나 두 번째 제품 원본을 만들지 않아야 한다.
2. JOEFLOW 원본을 받은 뒤 combined fixture: 유효한 OPEN state 사본과 낡은 ROADMAP,
   실제 미반영 TASK 항목을 구성하고 원본 변경 후 요약 미갱신 경계를 Git으로 고정한다.
   helper 적용 뒤 fresh-context 작업자가 현재 원본을 읽고 승인된 기록만 재개한다.
   결정 채택/권리 미확인/전체 미승인 구분, stable ID·state byte hash·approval history 보존,
   기존 결정 재생성·재질문·새 승인·무관한 체크 재실행 없음이 판정 조건이다.
3. setup 실행자, 새 문맥 작업자, 산출물 검증자의 근거를 분리한다.
   정답을 작업 프롬프트에 주지 않는다. 실제 조회·파일 변경·전후 diff를 평가한다.
   self-authored fixture의 정적 assert만으로 행동 성공을 주장하지 않는다.

한정: 각 사례 1회. 실패가 있으면 원인 보존 후 해당 범위만 보완한다.
명시적으로 읽는 subagent는 앱의 자동 AGENTS 주입 시험이 아니며 모델/effort 미노출 시 특정 runtime을 주장하지 않는다.
JOEFLOW 엔진 검사는 상대 담당/QA 결과와 구분한다. 실제 중단 fixture는 문서 갱신 사이의
준비된 경계이며 프로세스 강제 종료나 파일시스템 장애 자동 복구 검증이 아니다.
