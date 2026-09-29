# JOENESS setup-only 배포 설계

> 상태: 사용자 승인 범위를 문서화한 구현 전 설계. 이번 작업은 **제품 소스만** 바꾼다. 현재 개인 설치, 연결된 실제 프로젝트, 기본 브랜치와 원격 배포는 변경하지 않는다.

## 목적과 성공 기준

사용자는 상시 Independent Judgment Core를 제거하고 `joeness-setup`은 유지하기로 결정했다. 셋업은 요청할 때 프로젝트 문서 역할을 연결하는 도구이며, 연결 후 해당 프로젝트의 짧은 `AGENTS.md` 안내만 지속된다. 제품 자체가 모든 채팅에 판단 규칙을 자동 주입하지 않아야 한다.

성공 기준은 새 개발 후보의 설치·확인·해제가 공개 스킬 `joeness-setup` 하나만 관리하고, 사용자의 전역 `AGENTS.md` 바이트를 바꾸지 않는 것이다. 이전 Core 설치 또는 소유 상태가 남은 홈은 자동 덮어쓰기·삭제 없이 `blocked`로 알려야 한다. 기존 프로젝트 연결과 스킬의 문서 분류 동작은 유지한다. Core/Bare 실험과 이전 실패 증거는 Git 이력 및 bounded evidence에 남긴다.

## 선택한 방식과 대안

1. **선택: setup-only 배포로 전환.** 다음 개발 후보 식별자는 `0.3.0-beta.3-dev`, manifest 계약은 `schemaVersion: 3`, `runtimeMode: setup-only`, `publicSkills: joeness-setup` 하나로 한다. `activeCommonCore`를 활성 manifest에서 제거한다. 이전 설치를 새 설치기가 자동 이전하지 않는다.
2. **대안: 빈 Core 블록 유지.** 기존 전역 `AGENTS.md` 관리와 상태 파일을 계속 운영하게 되어 상시 주입 제거 목적과 관리 비용 절감에 맞지 않는다.
3. **대안: 설치기 제거·스킬 수동 복사.** 소유권 검사·안전한 해제·일관된 사용 안내를 잃으므로 선택하지 않는다.

## 활성 소스와 설치 경계

- 활성 트리에서 `astra-judgment-core.md`를 제거한다. 과거 버전과 평가 결과는 삭제·수정하지 않고 Git 이력/기존 evidence에 둔다. `AGENTS.md`, `README.md`, `skills/joeness-setup/SKILL.md`의 **현재 활성 구성 설명**만 setup-only에 맞춘다. 과거 실험을 현재 기능으로 소개하지 않는다.
- `JOENESS.ps1` 진입점은 유지한다. `scripts/sync-harness.ps1`은 manifest의 스킬 파일 해시와 빈 vendor/runtime 목록을 검증하고, `joeness-setup` 파일과 `joeness-skills-state.json`만 거래적으로 설치·확인·해제한다. 새 설치에서 전역 `AGENTS.md`와 `joewrks-harness-state.json`을 만들거나 수정하지 않는다.
- 전역 `AGENTS.md`의 기존 `JOEWRKS-HARNESS` 표식, `joewrks-harness-state.json` 또는 소유 불명 스킬이 발견되면 Check/Apply/Remove 모두 `blocked`로 처리하고 바이트를 보존한다. 새 설치기는 이전 Core의 소유권을 추정하거나 제거하지 않는다. 새 패키지가 설치한 스킬의 파일·상태가 달라졌을 때도 기존 fail-closed 규칙을 유지한다.
- 프로젝트별 `JOENESS-SETUP` 관리 블록과 `.joeness/setup-state.json`은 전역 Core가 아니다. 기존 `project-setup.ps1`의 소유권·승인·차단 경계와 프로젝트 문서의 권위는 유지한다. `SKILL.md`에서 Core가 별도로 활성이라는 낡은 설명만 제거한다. 스킬의 트리거·기록 규칙을 확장하지 않는다.

## 이전 설치와 사용자 파일

이번 소스 변경은 `C:\Users\tjdwo\.codex`의 개인 설치를 건드리지 않는다. 현 설치 상태의 manifest SHA-256은 `3a8118fabfd383b619f02c0821244b5b91557d838e312737e0015a42a18ea5fe`이고, 정확히 대응하는 Git 소스 commit은 `089dd6cc17eafc05e46ed66b457e4e0072936f59`로 확인했다. 이는 **향후 이전을 찾는 단서**이지 지금 해제·재설치했다는 증거가 아니다.

향후 개인 이전은 그 정확한 이전 패키지의 Check가 `current`임을 확인하고, 그 패키지의 Remove로 소유 Core와 스킬만 제거한 뒤, 새 패키지를 Apply하는 별도 절차로 다룬다. 어느 단계든 상태·표식·사용자 소유 바이트가 불일치하면 중단한다. 호환 아카이브나 무조건 삭제 명령을 새 배포에 싣지 않는다.

## 검증과 미완 경계

- 새 계약 검사를 먼저 실패시킨다: 깨끗한 홈의 Apply/Check/Remove는 스킬만 다루고 전역 `AGENTS.md` 기존 바이트를 보존한다. 이전 Core 상태·표식, 미소유 스킬, 소유 파일 변형은 변경 없이 차단한다.
- 최소 구현 후 Windows PowerShell 및 PowerShell 7 설치·프로젝트 연결 검사, Node 계약/fixture 검사, 스킬 형식 검사와 Windows CI 명령을 실행한다. Core 전용 릴리스 검사는 현재 패키지 검사가 되도록 이름과 기대 결과를 갱신하되, 과거 A/B 증거의 내용은 변경하지 않는다.
- 제품 소스의 검사 통과는 개인 설치 갱신, 실제 프로젝트 새 채팅 재검증, 사용자 사용성 승인, 정식 출시를 대신하지 않는다. 다음 단계의 개인 이전·새 채팅 확인·최종 출시 승인은 로드맵의 별도 미완 항목으로 유지한다.
