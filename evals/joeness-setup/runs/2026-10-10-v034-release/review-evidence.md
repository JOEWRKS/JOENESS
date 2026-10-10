# JOENESS 0.3.4 출시 기록

## 배포 결과

- GitHub 배포 완료: 출시 commit `5f16ea00c5c1f46c8c87999a3247739576dd537e`.
- 출시 tree: `3a861d5e4547688095edd42e75ddd3d8debde720`.
- [정확한 커밋 Windows CI](https://github.com/JOEWRKS/JOENESS/actions/runs/38041503037): completed/success.
- main fast-forward와 새 태그 `JOENESS-v0.3.4`를 atomic push하고 원격을 다시 조회해 같은 commit임을 확인했다.
- annotated tag object: `7ba53d7de4b6689135a143cc9b60a2df34d79271`; 기존 태그는 변경하지 않았다.
- 개인 설치는 별도 승인 대기. GitHub 배포 완료를 개인 설치 완료로 보고하지 않는다.

이 배포 결과를 보강하는 후속 문서 커밋은 출시 패키지 bytes를 변경하지 않는다.

## 범위와 식별

2026-10-10 사용자가 정식 버전 결정·main 통합·발행을 진행 승인했다.
버전은 기존0.3.3과 구분하는0.3.4다. 후보 `bd22517be9056422343543fdd121058509f70b20`의
기능과 배포 skill11파일 bytes를 그대로 유지하며 버전·안내·검사 기대값만 갱신한다.

- Manifest SHA-256: `a569ff74f16df210e1e87046c8edfd61f19912653f2c8cfec328ec92e64d8fed`.
- Runtime mode: setup-only. Public skill: joeness-setup 하나. 전역 payload·vendor·router 없음.
- 범위: 필수 외부 결과의 누락·실패·오래된 근거 확인, 완료 판정의 범위 분리, 기록 책임.
- 제외: 전체 디자인 판정, 자동 실행·문서 잠금, 모델 성능·토큰 절감, 다른 프로젝트 자동 갱신.
- [기능·실사용 검증 원본](../2026-10-10-specialist-consumption/review-evidence.md): 후보36개 검사,
  PS5/7 연결 각27개, 설치 소비 각23개, 실제 GEO51개 한정 검사. 같은 브라우저 시험은 반복하지 않는다.

## 출시 검사

로컬 최종 검사(Windows, Node26.3.0, PowerShell5/7):

- `tests/joeness-release.tests.ps1`: PASS.
- Node 계약·fixture·review-gate: 36 PASS / 0 FAIL.
- `tests/joeness-project-setup.tests.ps1`: PS5/7 각각27 PASS.
- `tests/joeness-install.tests.ps1`: PS5/7 설치·제거·사용자 bytes 보존·실패 복구 PASS.
  실제 임시 설치본의 review-gate도 각각23 PASS. 개인 설치의 검증과는 구분한다.
- `git diff bd22517 -- skills`: 차이 없음. `git diff --check`: PASS.

출시 커밋을 고정한 뒤 위 원격 Windows 실행에서 동일 release contract와 PS5/7 설치·연결,
전체 Node 검사, diff 검사를 통과했다. 이전 후보의 CI 결과로 대신하지 않았다.

## 개인 설치

기존 후보 manifest `48e6e4215011f923882f0d14551a27405b48e6ff640fa87e7af17aa263ca1ee1`는 보존했다.
0.3.4 Check는 소유 식별자 불일치로 blocked이며 예상된 안전 차단이다. 파일 손상으로 판정하지 않는다.
자동 제거·state 덮어쓰기를 하지 않고 사용자에게 관리11파일/state 백업·기존 절차 제거·새 버전 설치를 별도로 물었다.
개인 설치 전환과 GitHub 배포는 분리하여 보고한다.

기존 APP-001 이슈 파일과 ROADMAP의 해당 미커밋 부분은 이 출시에서 제외해 원래대로 보존한다.
