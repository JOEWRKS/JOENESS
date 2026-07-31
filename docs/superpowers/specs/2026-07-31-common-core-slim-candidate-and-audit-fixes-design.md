# Common Core 축약 후보와 감사 보강 설계

**상태:** 구현 승인

## 목표

상시 로드되는 Common Work Core의 의미는 유지하면서 입력 비용을 줄일 후보를
만들고, 독립 감사에서 재현된 프로젝트 helper 결함 세 건을 최소 수정한다.

## 결정

1. 활성 `AGENTS.md`와 검증된 `evals/candidates/common-core-v1.md`는 이번
   변경에서 교체하지 않는다.
2. 축약안은 `evals/candidates/common-core-v2.md`에 비활성 후보로 둔다.
   기존 일곱 heading과 16개 P0/pressure 사례의 불변식을 모두 보존하고,
   새 라우터·스킬·평가 프레임워크는 만들지 않는다.
3. 후보의 정적 합격 조건은 유효한 UTF-8, 200줄 이하, 개인 경로·runtime
   상태·미구현 스킬 활성화 문구 없음, 기존 Core보다 byte 수 감소, 그리고
   16개 사례별 의미 대응 완료다.
4. 활성 Core 승격은 후보와 같은 revision에서 수집한 fresh Control/Core
   pair가 regression 0과 입력 비용 감소를 모두 보일 때만 별도 작업으로 한다.
   그 전에는 manifest와 기존 평가 산출물의 active Core identity를 바꾸지 않는다.
5. 프로젝트 helper는 reparse metadata 조회 오류를 미존재로 간주하지 않고
   fail-closed한다. 실제 미존재만 허용한다.
6. Windows 경로 동일성은 `OrdinalIgnoreCase`로 비교한다. 경로 포함 여부
   검사는 기존 boundary 비교를 유지한다.
7. 완료된 구현 계획은 원문 checkbox를 재작성하지 않고, 문서 상단에
   역사적 완료 기록·실행 금지·완료 revision·현재 기준 명세를 표시한다.

## 검증

- 축약 후보: 기존 validator와 16개 frozen case 의미 대응을 독립 검토한다.
- helper: 검사 오류가 `blocked`이고 쓰기가 0인지, mixed-case
  `ProjectPath`와 `ExpectedRoot`가 같은 경로로 처리되는지 회귀 테스트한다.
- 변경된 canonical skill 파일의 bytes/SHA-256을 source manifest와 integrity
  test에 동기화한다.
- focused tests 후 전체 PowerShell·Node·Python 검증과 `git diff --check`를
  실행한다.

## 제외

- 활성 Common Core 승격
- 새 live-evaluation generation
- handle 기반 Win32 I/O, 공개 배포, plugin 변환
- 디자인 라우팅·vendor 원문·설치 profile 변경
