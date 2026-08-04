# 프로젝트 인지형 작업 하네스 구현 계획

**목표:** 거친 프로젝트 요청을 현재 단계의 실행 계약으로 번역하고, fresh 작업자가 구현부터 출시 준비까지 이어갈 수 있게 한다.

**방식:** 기존 `AGENTS.md`, `joewrks-project-setup`, 설치 manifest와 테스트 경로를 재사용한다. 새 역할 스킬이나 메모리 시스템은 만들지 않는다.

## 작업

- [x] 현재 manifest 무결성 테스트를 새 활성화 정책 기준으로 먼저 바꿔 RED를 확인한다.
- [x] `AGENTS.md`에 프로젝트 선언/계속 요청의 실행 계약, 작업 나침반, 단계 연속성, 협업·출시 준비 기준을 짧게 넣고 중복 문장을 줄인다.
- [x] `skills/joewrks-project-setup/SKILL.md`를 명시 호출 전용 내구성 프로젝트 계약 작성법으로 보강한다. 일반 프로젝트 선언과 `해줘`는 공통 코어가 처리한다.
- [x] `agents/openai.yaml`, `README.md`, `vendor/source-manifest.json`, exact 무결성 기대값을 동기화한다. `project-setup.ps1`과 디자인 스킬은 바꾸지 않는다.
- [x] skill validator, project setup, vendor integrity, installer tests와 `git diff --check`를 실행한다.
- [x] 검증 후 개인 설치본에 `-Check`, `-Apply`, 재검증 순서로 동기화한다.
- [x] 격리된 Control/후보에서 `해줘 → 계속해줘 → 출시 준비`를 각 단계 fresh session으로 실행한다. 원본 프로젝트와 서로의 arm은 수정하지 않는다.
- [x] 실제 빌드·기능, 단계 전진, 협업 재개성, 출시 준비, 범위·사실성, 토큰·시간을 결과 중심으로 비교한다. 실제 배포는 하지 않는다.

## 합격 해석

후보는 객관적 기능·빌드 품질이 Control보다 낮지 않고, 두 번의 fresh 재개가 이미 한 일을 반복하지 않으며 다음 milestone으로 전진해야 한다. 같은 품질이면 토큰 증가는 5% 이내, 명확한 협업·출시 준비 향상이 있으면 15% 이내를 우선 기준으로 본다. 실패하거나 이득이 없으면 활성 규칙을 축소하거나 되돌린다.
