# JOENESS 0.3.4 출시 기록

## 배포 결과

- GitHub 배포 완료: 출시 commit `5f16ea00c5c1f46c8c87999a3247739576dd537e`.
- 출시 tree: `3a861d5e4547688095edd42e75ddd3d8debde720`.
- [정확한 커밋 Windows CI](https://github.com/JOEWRKS/JOENESS/actions/runs/38041503037): completed/success.
- main fast-forward와 새 태그 `JOENESS-v0.3.4`를 atomic push하고 원격을 다시 조회해 같은 commit임을 확인했다.
- annotated tag object: `7ba53d7de4b6689135a143cc9b60a2df34d79271`; 기존 태그는 변경하지 않았다.
- 개인 설치도 후속 별도 승인으로0.3.4 전환 완료. 아래 실제 설치 결과로 확인하며 GitHub 배포만으로 대신하지 않았다.

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

최초 Check는 이전 후보 manifest `48e6e4215011f923882f0d14551a27405b48e6ff640fa87e7af17aa263ca1ee1`와
새 버전의 소유 식별자 불일치로 blocked였다. 예상된 안전 차단이며 파일 손상으로 판정하지 않았다.
사용자는 개인 설치 업데이트만 남았다는 설명 뒤 `ㅇㅋ`로 전환을 승인했다.

- 이전 소스: `bd22517be9056422343543fdd121058509f70b20`의 설치 패키지를 Git archive로 복구.
- 새 소스: 출시 `5f16ea00c5c1f46c8c87999a3247739576dd537e`의 설치 패키지를 Git archive로 확보.
- 두 manifest의 정확 SHA 확인 → 이전 설치기 Check=current → 관리11파일/state 백업 → Remove=removed → 새 Apply/Check=current.
- 최종 버전0.3.4, manifest `a569ff74f16df210e1e87046c8edfd61f19912653f2c8cfec328ec92e64d8fed`, changesRequired=false.
- 설치11파일 전부 출시 manifest와 SHA 일치. 설치 state SHA `b52caeabdc104d55cfa0e4605f9266bb364a48e67dd49159a29dabd86d0e05cb`.
- 개인 설치본 CLI를 직접 지정한 `tests/joeness-review-gate.tests.mjs`: 23 PASS / 0 FAIL.
- 전환 전후 개인 config.toml·전역 AGENTS.md 해시 불변, legacy Core state 계속 없음. 타 스킬과 프로젝트는 작업 대상이 아니다.
- 복구본: `D:/JOEWRKS/.joeness-install-backups/20261010-v034-install`.
  이전 관리 파일·state와 양쪽 정확 소스만 보존. 인증 파일은 복사하지 않았다.

스킬은 다음 턴부터 사용 가능하다. 이미 열린 세션이 새 지침을 자동 재로딩했다고 주장하지 않는다.
이번 전환은 기능 bytes가 같은 후보에서 정식 버전 식별자를 맞춘 작업이며 새 GEO 측정은 하지 않았다.

기존 APP-001 이슈 파일과 ROADMAP의 해당 미커밋 부분은 이 출시에서 제외해 원래대로 보존한다.
