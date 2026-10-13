# JOENESS 설치·업데이트·복구

설치 진입점은 저장소 루트의 `JOENESS.ps1`입니다. 버전 원본은 `vendor/source-manifest.json`의 `release.version`이며, 정확한 설치본은 버전뿐 아니라 manifest 해시로 구분합니다. 현재 1.0.0은 검토 후보입니다.

## 새 설치

Windows PowerShell에서 사용할 패키지 폴더를 연 뒤 실행합니다.

```powershell
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
# ready인 경우에만:
powershell.exe -NoProfile -File .\JOENESS.ps1 -Apply
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
```

`current`가 설치 완료입니다. 공개 스킬 `joeness-setup` 하나와 `joeness-skills-state.json`만 관리합니다. 전역 `AGENTS.md`·개인 설정·프로젝트 파일은 변경하지 않습니다. 사용자 지정 `CODEX_HOME`이 있으면 그 경로, 없으면 사용자 홈의 `.codex`가 기본 대상입니다. 다른 위치를 시험할 때는 **매 명령에** `-CodexHome <명시 경로>`를 지정하세요.

설치 후 스킬은 다음 요청에서 사용할 수 있습니다. 기존 대화가 새 내용을 받았다고 가정하지 말고, 프로젝트를 연 새 채팅에서 `이 프로젝트에 JOENESS 설치해줘.`라고 요청합니다. 변경안 확인·승인 후 표준 문서와 짧은 연결 구역을 적용합니다. [새 프로젝트·기존 프로젝트 사용법](../skills/joeness-setup/references/usage.md).

## 기존 설치 업데이트

새 설치기의 `blocked`는 기존 파일을 보존했다는 뜻입니다. 같은 버전 문자열이라도 manifest가 다르면 별도 설치본입니다. 상태 파일 삭제나 강제 덮어쓰기로 우회하지 않습니다.

1. **기존 설치와 정확히 일치하는 패키지**에서 `-Check`가 `current`인지 확인합니다. 태그나 버전명만 같다는 이유로 일치한다고 판단하지 않습니다.
2. 관리 스킬 파일과 `joeness-skills-state.json`을 스킬 탐색 경로 밖에 백업하고 해시를 비교합니다. 인증 파일을 증거·Git에 복사하지 않습니다.
3. 그 **기존 패키지**에서 `powershell.exe -NoProfile -File .\JOENESS.ps1 -Remove`를 실행합니다.
4. 새 패키지 폴더로 이동해 `-Check`의 `ready` 확인 후 `-Apply`, 다시 `-Check`로 `current`를 확인합니다.
5. manifest의 전체 파일 목록·해시와 설치 상태를 대조합니다. 기존 프로젝트 연결은 별도 변경안·승인 없이 갱신하지 않습니다.

경로를 지정했다면 다섯 단계 모두 같은 `-CodexHome`을 사용합니다. 기존 소스·소유권을 확인할 수 없거나 사용자 수정이 발견되면 중단합니다. 이전 전역 Core 표시·상태는 자동 이전하지 않습니다.

## 실패·제거·복구

- `partial` 또는 실패: 실제 파일과 복구 결과를 먼저 확인합니다. 적용 여부를 모르는 상태에서 반복 실행하지 않습니다.
- 새 설치 실패 후 원복: 대상이 깨끗하거나 소유 파일만 남았음을 확인한 뒤, 검증된 백업·기존 패키지로 복구 범위를 정합니다. 불명확한 파일은 삭제하지 않습니다.
- 현재 패키지 제거: 해당 패키지의 `JOENESS.ps1 -Remove`. 변경된 관리 파일은 보존하며 제거가 차단됩니다.
- 프로젝트 연결 해제: `이 프로젝트에서 JOENESS 연결을 해제해줘.`라고 별도 요청. 일반 문서와 작업 이력은 남습니다. 개인 패키지 제거가 프로젝트 연결을 지우지는 않습니다.

개인 설치와 프로젝트 연결은 별도로 확인합니다.

```powershell
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
powershell.exe -NoProfile -File .\skills\joeness-setup\scripts\project-setup.ps1 -Check -ProjectPath <프로젝트-루트>
```

첫 결과의 `current`는 개인 설치, 두 번째의 `current/clean`은 연결 구역 상태입니다. 연결 성공은 문서 내용·작업 결과의 검증 완료가 아닙니다.

자동화에서 설치기는 stdout으로 JSON, stderr로 사람용 안내를 출력합니다. 종료 코드와 JSON 상태로 판단하며, stderr에 안내가 있다는 이유만으로 실패로 보지 않습니다.
