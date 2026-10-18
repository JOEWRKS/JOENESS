# JOENESS 설치·업데이트·복구

현재 소스: **1.0.2**. 작업자 방법 선택과 필수 요건을 구분한 연결문 수정판. [소스·개인 설치·배포 상태](../evals/joeness-setup/runs/2026-10-18-v102-release/review-evidence.md)를 구분해서 확인. 기존 `JOENESS-v1.0.0`·`JOENESS-v1.0.1` 태그 변경 없음; 기존 프로젝트 연결은 자동 갱신하지 않음.

## 핵심 기준

| 항목 | 기준 |
|---|---|
| 설치 진입점 | 저장소 루트의 `JOENESS.ps1` |
| 버전 원본 | `vendor/source-manifest.json`의 `release.version` |
| 현재 소스 버전 | 1.0.2 |
| 설치본 식별 | 버전과 manifest 해시 함께 대조 |
| 갱신 범위 | 저장소 갱신과 개인 설치 갱신은 별도 |

## 새 설치

Windows PowerShell에서 사용할 패키지 폴더를 연 뒤 실행.

```powershell
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
# ready인 경우에만:
powershell.exe -NoProfile -File .\JOENESS.ps1 -Apply
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
```

- 완료 기준: `-Check` 결과 `current`.
- 관리 대상: 공개 스킬 `joeness-setup` 하나, 설치 기록 `joeness-skills-state.json`.
- 변경 제외: 전역 `AGENTS.md`, 개인 설정, 프로젝트 파일.
- 기본 위치: `CODEX_HOME` 지정 시 해당 경로, 미지정 시 사용자 홈의 `.codex`.
- 별도 위치 시험: **매 명령에** `-CodexHome <명시 경로>` 지정.
- 사용 시작: 설치 다음 요청부터 스킬 사용 가능. 열린 대화의 지침 자동 갱신 가정 금지.
- 프로젝트 연결: 프로젝트를 연 새 채팅에서 `이 프로젝트에 JOENESS 설치해줘.` 요청 → 변경안 확인·승인 → 표준 문서·짧은 연결 구역 적용.

[새 프로젝트·기존 프로젝트 사용법](../skills/joeness-setup/references/usage.md).

## 기존 설치 업데이트

`blocked`: 기존 파일 보존 상태. 같은 버전명이라도 manifest 불일치 시 별도 설치본. 상태 파일 삭제·강제 덮어쓰기 우회 금지.

1. **기존 설치와 정확히 일치하는 패키지**의 `-Check: current` 확인. 태그·버전명 일치만으로 판단 금지.
2. 관리 스킬 파일과 `joeness-skills-state.json`을 스킬 탐색 경로 밖에 백업, 해시 대조. 인증 파일의 증거·Git 복사 금지.
3. **기존 패키지**에서 `powershell.exe -NoProfile -File .\JOENESS.ps1 -Remove` 실행.
4. 새 패키지 폴더에서 `-Check: ready` → `-Apply` → `-Check: current` 확인.
5. manifest 전체 파일 목록·해시·설치 상태 대조. 기존 프로젝트 연결 갱신은 별도 변경안·승인 후 진행.

- 경로 지정 시: 전 단계 동일한 `-CodexHome` 유지.
- 중단 조건: 기존 소스·소유권 미확인, 사용자 수정 발견.
- 자동 이전 제외: 이전 전역 Core 표시·상태.

## 실패·제거·복구

| 상황 | 처리 기준 |
|---|---|
| `partial` 또는 실패 | 실제 파일·복구 결과 우선 확인. 적용 여부 미확인 상태의 반복 실행 금지 |
| 새 설치 실패 후 원복 | 깨끗한 대상 또는 소유 파일만 남은 상태 확인 후, 검증된 백업·기존 패키지로 복구 범위 결정. 불명확한 파일 삭제 금지 |
| 현재 패키지 제거 | 해당 패키지의 `JOENESS.ps1 -Remove`. 사용자 변경 파일 보존·제거 차단 |
| 프로젝트 연결 해제 | `이 프로젝트에서 JOENESS 연결을 해제해줘.` 별도 요청. 일반 문서·작업 이력 보존 |

개인 패키지 제거와 프로젝트 연결 해제는 별도. 개인 패키지 제거만으로 프로젝트 연결 삭제 없음.

## 상태·결과 확인

```powershell
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
powershell.exe -NoProfile -File .\skills\joeness-setup\scripts\project-setup.ps1 -Check -ProjectPath <프로젝트-루트>
```

| 결과 | 의미 |
|---|---|
| 첫 명령의 `current` | 개인 설치가 해당 패키지와 일치 |
| 두 번째 명령의 `current/clean` | 프로젝트 연결 구역 상태 정상 |
| 연결 성공 | 문서 내용·작업 결과의 검증 완료와 별도 |

자동화 출력: stdout은 JSON, stderr는 사람용 안내. 성공·실패는 종료 코드와 JSON 상태로 판정. stderr 안내만으로 실패 판정 금지.

### 갱신 후 기존 프로젝트 확인

개인 설치 갱신만으로 기존 프로젝트의 연결문·로드맵이 바뀌지는 않음.
새 지침 반영이나 잘못된 완료 보고를 확인할 때만 다음 범위 점검. 매 작업 반복 검사 아님.

- **연결:** 실제 AGENTS의 문서 위치·기록 범위·필수 검사 연결 확인. 설정하지 않은 선택형 도구는 설치 누락이나 새 필수 작업으로 취급 금지.
- **내용:** 원래 요구사항 → 실제 검사한 항목 → 근거·미확인 사항 대조. 파일 수·열람·해시 일치는 내용 검증이나 사용자 승인과 별개.
- **현황:** 반려·철회로 달라진 상태와 다음 작업을 현재 원본에서 정정. 이전 판단은 이력으로 보존하고, 현재 지시로 나란히 남기지 않음.

요청 예시: `현재 프로젝트의 JOENESS 연결과 로드맵을 확인해줘. 설치 상태와 문서 적용 상태를 구분하고, 빠진 부분의 변경안을 먼저 보여줘.`

변경은 승인 범위에서만 적용. 이미 연결된 필수 검사의 실패·누락은 계속 미완료로 유지.
검사 입력을 만든 사람이 요구사항을 빼거나 근거를 잘못 해석하면 자동 검사가 놓칠 수 있으므로, 검사 통과만으로 문서 전체 적합 판정 금지.
