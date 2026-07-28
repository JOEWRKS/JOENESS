# Codex App Server Evidence Collector 설계

**상태:** 사용자 설계 승인 — 구현 계획 작성 중

**기준 명세:** `docs/superpowers/specs/2026-07-28-no-harness-baseline-capability-spike-design.md`

**P0 계약:** `evals/p0/cases.json`

**선행 결과:** `evals/p0/baseline-capability-spike.json`

**기준 HEAD:** `08cbdc796bcb1835ad50eca53409ea33187a0ee2`

## 1. 결정

Codex App Server Evidence Collector는 하네스 본체가 아니라 외부 평가 인프라다.

현재 구현은 `pressure-08-claim-integrity`와 `p0-02-unknown-write` 두 사례의 capability spike만 다시 실행한다. Collector가 신뢰할 수 있는 실행 조건과 증거를 확보했을 때만 별도 설계·승인을 거쳐 16개 baseline으로 확대한다.

Collector는 하네스 지침을 수정하지 않는다. 실행 증거, 기계 판정과 검토가 필요한 항목을 기록하며, 개선 권고를 실제 수정이나 완료로 취급하지 않는다.

첫 Desktop spike가 typed tool output과 실행 조건을 노출하지 못해 `blocked`된 뒤 사용자가 v2 방향을 승인했다. 따라서 이 명세는 기준 명세의 Desktop-only 선택과 CLI runner 범위 제외를 **이 두-case Collector에 한해서만** 대체한다. rubric 격리, 외부 효과 금지, 증거 우선과 full-baseline 차단 규칙은 그대로 유지한다.

## 2. 하네스 본체와의 경계

| 영역 | Collector의 권한 |
|---|---|
| `AGENTS.md`, 역할 규칙, 어댑터, 스킬 | 읽기·해시만 가능, 수정 금지 |
| P0 case와 rubric | 읽기 가능, subject에는 허용 필드만 전달 |
| system-temp 합성 fixture | 해당 run root 안에서만 생성·검사 가능 |
| 평가 결과 | 새 v2 결과 JSON 하나만 작성 가능 |
| subject의 connector·업무 시스템 | 읽기·쓰기 호출 금지 |
| 하네스 개선 | 권고만 가능, 별도 승인·브랜치에서 수행 |

Collector는 개인 설치본이나 팀 배포 템플릿에 포함하지 않는다. 일반 작업마다 실행하지 않고 하네스 핵심 규칙이나 선택 스킬의 효과를 평가할 때만 명시적으로 실행한다.

같은 저장소의 `evals/` 아래에 두는 것은 평가 입력·결과와 버전을 함께 고정하기 위해서다. 별도 저장소, 서비스, 데이터베이스와 대시보드는 만들지 않는다.

## 3. 이번 단계의 범위

### 포함

- 공식 standalone Codex CLI의 실제 패키지 바이너리 확인
- 버전이 일치하는 App Server JSON-RPC 연결
- 모델을 거치지 않는 read-only sandbox preflight
- 같은 App Server 프로세스의 실행 조건과 capability 인벤토리 수집
- rubric-free 두 subject 입력 실행
- typed turn/item/command event 수집
- Git·파일·합성 state 독립 확인
- 기계 판정과 review-required 항목 분리
- bounded v2 결과 JSON 생성
- 오프라인 단위 테스트와 명시적 live smoke

### 제외

- 16개 full baseline
- harness-enabled 비교군
- 하네스 규칙·스킬 생성 또는 수정
- Claude Code·Copilot collector
- 자동 prompt 최적화
- LLM grader, grader ensemble 또는 반복 샘플링
- 범용 runner SDK, 큐, DB, 웹 UI와 상시 모니터링
- 실제 외부 쓰기, connector 호출, Figma 변경과 배포

## 4. 관찰된 실행 사실

2026-07-28 현재 사용자 환경에서 다음을 직접 확인했다.

- PATH에서 처음 발견된 Microsoft Store 패키지의 `codex.exe`는 이 shell 표면에서 `Access denied`로 실행되지 않았다.
- 공식 PowerShell 설치기로 설치한 launcher는 `codex-cli 0.145.0`을 실행했지만 버전별 `codex-resources`를 잃어 Windows sandbox setup helper를 bare name으로 찾았다.
- 공식 설치 패키지의 실제 바이너리
  `C:\Users\tjdwo\.codex\packages\standalone\current\bin\codex.exe`와 같은 패키지의 `codex-resources`에는 setup helper와 command runner가 함께 존재했다.
- 실제 패키지 바이너리로 실행한 App Server turn은 정확한 worktree cwd에서 `commandExecution`을 방출했고, `APP_SERVER_COMMAND_OK`, 내부 exit code `0`, `status: Completed`를 관찰했다.
- App Server 응답에서 model, reasoning effort, approval policy, sandbox, active permission profile, runtime roots와 instruction sources를 관찰할 수 있었다.
- CLI process exit code `0`은 내부 `commandExecution` 성공을 보장하지 않았다. launcher 경로 실험에서는 App Server가 정상 종료됐지만 내부 command item은 helper launch error로 실패했다.
- CLI의 별도 `plugin list --json`과 현재 Desktop 표면의 capability 목록은 동일하다고 가정할 수 없다. subject와 같은 App Server 프로세스에서 인벤토리를 수집해야 한다.

이 사실은 영구 환경 가정이 아니다. Collector는 매 run에 실제 경로·버전·resource·프로토콜 응답을 다시 확인하되, 일반 작업마다 전체 capability를 조사하지 않는다.

## 5. 검토한 접근

### 5.1 최소 App Server JSONL client

Node.js 표준 라이브러리로 App Server stdio JSON-RPC를 직접 사용한다. 요청 필드, cwd, 권한, 이벤트와 inventory를 구조적으로 통제할 수 있다.

채택한다.

### 5.2 `codex debug app-server send-message-v2` wrapper

구현량은 가장 적지만 thread/turn 입력과 inventory를 충분히 통제하지 못하고 사람이 읽는 debug trace를 다시 파싱해야 한다. 실제로 process success와 command failure가 동시에 발생했다.

최종 Collector로 사용하지 않는다. 개발 중 수동 smoke에만 사용할 수 있다.

### 5.3 Desktop task API 또는 rollout 파일 scrape

기존 spike가 실제 tool output과 실행 조건을 충분히 노출하지 못했다. 내부 저장 형식 scrape는 공식 typed protocol보다 취약하다.

사용하지 않는다.

## 6. 최소 구현 단위

구현 파일은 다음 둘로 제한한다.

| 파일 | 역할 |
|---|---|
| `evals/support/collect-codex-app-server.mjs` | CLI 해석, JSON-RPC, 두 case 실행, evidence 정규화와 결과 작성 |
| `tests/codex-app-server-collector.tests.mjs` | 오프라인 protocol replay, 입력 누출·중복·판정 검사 |

새 npm package나 dependency를 추가하지 않는다. Node.js의 `child_process`, `readline`, `fs`, `path`, `os`, `crypto`와 `node:test`만 사용한다.

한 파일 안에서도 다음 책임은 함수 경계로 분리한다.

1. package resolver와 preflight
2. JSON-RPC request/response/event transport
3. case input builder와 run controller
4. evidence normalizer와 bounded writer

두 번째 구현이나 교체 가능한 provider가 생기기 전에는 interface, class hierarchy, plugin system과 factory를 만들지 않는다.

## 7. CLI와 protocol 계약

### 7.1 실행 파일

기본 경로는 현재 사용자의
`<CODEX_HOME>\packages\standalone\current\bin\codex.exe`다. 구현 시 실제 junction target을 canonicalize하고 다음을 함께 검사한다.

- `codex --version`의 정확한 값
- 같은 package root의 `codex-resources/codex-windows-sandbox-setup.exe`
- 같은 package root의 `codex-resources/codex-command-runner.exe`
- 생성한 App Server JSON schema의 SHA-256

v2는 `codex-cli 0.145.0`만 합격시킨다. 다른 버전이면 launcher나 다른 버전 helper를 섞지 않고 `blocked: protocol-version-drift`로 중단한다.

PATH fallback, WindowsApps binary fallback, helper 수동 복사와 full-access fallback은 없다.

### 7.2 버전 고정 자료

구현의 protocol authority는 실행 중인 0.145.0 CLI가 system-temp에 생성한 JSON schema다. 다음 태그 자료는 사람용 대조 근거다.

- [`rust-v0.145.0` App Server README](https://github.com/openai/codex/blob/rust-v0.145.0/codex-rs/app-server/README.md)
- [`ThreadStartParams`](https://github.com/openai/codex/blob/rust-v0.145.0/codex-rs/app-server-protocol/src/protocol/v2/thread.rs)
- [`TurnStartParams`](https://github.com/openai/codex/blob/rust-v0.145.0/codex-rs/app-server-protocol/src/protocol/v2/turn.rs)
- [`SandboxPolicy`](https://github.com/openai/codex/blob/rust-v0.145.0/codex-rs/app-server-protocol/src/protocol/v2/permissions.rs)
- [standalone launcher resource-resolution 보고](https://github.com/openai/codex/issues/28457)

내부 debug 표현인 kebab-case 값을 JSON wire 값으로 추정하지 않는다. 생성 schema의 camelCase enum과 field를 사용한다.

### 7.3 초기화

client는 고유한 이름과 버전으로 `initialize`한 뒤 `initialized`를 보낸다.

- experimental API를 명시적으로 활성화한다.
- canonical evidence에 필요한 `thread/*`, `turn/*`, `item/*` notification을 opt out하지 않는다.
- dynamic tool을 등록하지 않는다.
- 알 수 없는 server request는 자동 승인하지 않고 거부·기록한다.
- approval request가 오면 fail closed로 거부하고 해당 case를 `blocked` 처리한다.

## 8. subject 입력과 격리

subject 입력은 `cases.json`에서 다음 필드만 사용한다.

- `id`
- `prompt`
- `setup`
- `fixtureFiles`
- `targetKey`
- 해당하는 경우 `toolBindings`

다음은 subject에 전달하지 않는다.

- `passCriteria`
- `failCriteria`
- `evidenceRequired`
- 이전 결과·판정·리뷰
- 하네스 설계 명세

builder는 허용 필드 allowlist로 새 객체와 prompt를 생성한다. 금지 필드명과 rubric의 exact text가 직렬화된 subject input에 없음을 실행 전에 검사한다.

각 case는 system-temp 아래의 새 case root에서 시작한다. 저장소나 포트폴리오 프로젝트를 cwd로 사용하지 않는다. JOEWRKS project instruction source가 로드되면 no-harness가 아니므로 case 실행 전에 차단한다.

global system/developer 안전 규칙과 사용자 환경의 ambient capability는 제거할 수 없는 platform 조건으로 기록한다. 이를 JOEWRKS 하네스가 없다는 뜻과 혼동하지 않는다.

## 9. 실행 순서

### 9.1 run 준비

1. P0 계약 테스트를 실행한다.
2. branch, HEAD, cases hash, mock hash, Collector script hash와 현재 diff를 기록한다.
3. live run 전에 Collector script가 현재 HEAD에 tracked되어 있고 working-tree 내용이 HEAD blob과 일치하는지 확인한다. untracked 또는 modified Collector로 model case를 실행하지 않는다.
4. user Codex config는 내용을 복사하지 않고 전후 SHA-256만 기록한다.
5. `<system-temp>\joewrks-eval-<runId>`를 exclusive create한다.
6. 같은 run root가 이미 있으면 덮어쓰기·삭제·자동 resume 없이 중단한다.

### 9.2 model-free preflight

1. 실제 package binary와 resources를 검증한다.
2. `doctor --json`에서 인증·provider·network 건강 상태의 필요한 boolean과 버전만 추출한다.
3. 실행 버전의 App Server JSON schema를 run root에 생성하고 hash한다.
4. App Server를 stdio로 시작하고 initialize한다.
5. `command/exec`로 read-only, network-disabled `APP_SERVER_SANDBOX_OK` echo를 10초 제한으로 한 번 실행한다.
6. deferred `command/exec` 응답의 `exitCode`, `stdout`, `stderr`를 검사하고, exit code `0`, 정확한 stdout과 빈 stderr일 때만 model turn으로 진행한다.

preflight가 실패하면 model을 호출하지 않는다.

preflight에는 unsandboxed `process/spawn`이나 `thread/shellCommand`를 사용하지 않는다.

### 9.3 같은 프로세스의 실행 조건 수집

subject를 시작하기 전에 같은 App Server connection에서 다음을 수집한다.

- `initialize` 결과의 runtime metadata
- `skills/list`
- `plugin/installed`
- `hooks/list`
- 필요한 permission profile 목록

결과에는 이름, 버전, enabled 상태와 오류만 보존한다. auth token, secret, 전체 config와 직접 연락·결제 식별자는 저장하지 않는다.

App Server 시작 전 같은 package binary의 `mcp list --json`으로 configured server 이름과 transport 종류를 읽는다. 0.145.0에서는 `mcp_servers.<name>.enabled=false`만 덮어쓰면 기존 transport가 사라져 config가 거부되므로 사용하지 않는다. 각 서버마다 secret·header·environment 값은 복사하지 않고, 유효성 검사에 필요한 최소 transport 필드와 `enabled=false`를 하나의 inline TOML table로 다시 만들어 child-process argv 한 항목으로 전달한다. 같은 argv로 다시 실행한 `mcp list --json`에서 원래 이름 집합이 유지되고 모두 `enabled: false`인지 확인한 뒤에만 App Server를 시작한다. `mcp_servers={}` 전체 override도 기존 table을 확실히 지우지 못하므로 사용하지 않는다.

model, reasoning effort와 service tier는 override하지 않고 사용자 기본값의 실제 응답값을 기록한다. reroute event나 두 subject 사이의 예상하지 않은 runtime 차이가 있으면 동일 조건이라고 추정하지 않고 evidence limitation 또는 capability block으로 남긴다.

### 9.4 case 실행

각 case에 대해 다음을 수행한다.

1. rubric-free input과 SHA-256을 만든다.
2. case root와 checkpoint를 만든다.
3. 현재 대화를 fork·resume하지 않고 read-only, network-disabled, approval-never 새 thread를 시작한다. `dynamicTools`와 `selectedCapabilityRoots`는 각각 빈 배열이며 input에는 text 외 mention·skill item을 넣지 않는다.
4. thread ID와 실제 thread-start metadata를 즉시 checkpoint에 기록한다.
5. read-only case는 같은 제한을 유지한다.
6. 합성 write case만 turn 수준에서 case root에 한정된 workspace-write를 요청한다.
7. typed notification을 turn terminal state까지 수집한다. case당 제한은 180초와 typed event 256개다.
8. 시간 또는 event 제한을 넘으면 같은 turn을 한 번 interrupt하고 새 thread나 turn을 만들지 않는다.
9. write case의 state와 receipt를 Collector가 직접 읽는다.
10. repository와 user config hash를 다시 확인한다.
11. subject 전후 snapshot이 확정된 뒤에만 v2 결과 파일을 새로 쓴다. 이 예상된 결과 파일은 subject가 만든 repository 변경으로 계산하지 않는다.

thread는 `ephemeral: true`로 시작한다. 이는 과거 memory pipeline과 task clutter를 baseline에 섞지 않기 위한 v2 변경이다. 이전 Desktop spike의 “subject task 보존” 요구는 완전한 typed event evidence와 result hash로 대체한다.

## 10. tool과 외부 효과 경계

두 case에 필요한 subject tool은 로컬 shell뿐이다.

- dynamic tools를 제공하지 않는다.
- connector·plugin tool과 subject의 실제 업무 시스템 호출을 허용하지 않는다.
- shell network는 비활성화한다.
- write root는 합성 case root 하나다.
- mock script는 현재 HEAD의 hash가 고정된 파일만 읽는다.

Collector는 다음 model-free 증거가 모두 있을 때만 subject tool surface를 shell-only로 인정한다.

1. 생성 schema가 `thread/start.dynamicTools`와 `thread/start.selectedCapabilityRoots`를 지원한다.
2. thread request가 두 필드에 각각 빈 배열을 보냈고 text 외 mention·skill input item을 보내지 않았다.
3. `mcp list --json`에서 발견한 모든 server에 최소 transport 필드와 `enabled=false`를 함께 가진 version-matched inline-table argv override를 적용했고, 같은 argv의 재조회에서 이름 집합이 유지되고 모두 disabled이며 config warning이 없다.
4. thread-scoped MCP startup이 `ready`가 아니고 model turn 전후 MCP·connector request 또는 tool item이 없다.
5. subject의 실행 item type은 허용된 `commandExecution`과 공개 message뿐이다.

MCP startup status 자체는 inventory evidence로 기록한다. 위 조건 중 하나를 확인할 수 없거나 MCP·connector tool call이 관찰되면 우회하지 않고 `blocked: uncontrolled-tool-surface`로 판정한다. 구현 계획은 실행 버전의 generated schema와 effective config를 이용해 정확한 MCP-disable key를 먼저 확인해야 하며, 추정한 key로 model을 실행하면 안 된다.

Codex 인증·provider health 확인과 model 요청은 평가 실행에 필요한 control-plane 통신이다. 이를 subject의 connector·업무 시스템 호출과 혼동하지 않는다.

`p0-02-unknown-write`는 caller-stable idempotency key를 사용한다. response loss 뒤 새 key로 재시도하지 않으며 state query 또는 검증된 same-key recovery만 허용한다.

## 11. evidence 계약

평가 대상의 최종 문장은 실행 사실이 아니다. 사실 원장은 다음 순서다.

1. App Server request/response와 typed lifecycle event
2. command item의 실제 command, cwd, status, output, exit code와 duration
3. Collector가 직접 읽은 state와 receipt
4. 실행 전후 Git·파일·config hash
5. frozen rubric을 적용한 별도 판정

각 command/tool output과 assistant text item은 UTF-8 기준 최대 64 KiB를 저장한다. 초과하면 앞 32 KiB와 뒤 32 KiB, 전체 byte length, 전체 SHA-256과 `truncated: true`를 기록한다. case당 typed event는 256개를 넘기지 않는다. 잘림이나 event limit 초과를 완전한 증거로 보고하지 않는다.

reasoning item의 본문이나 hidden reasoning은 저장하지 않는다. 해당 event의 존재와 공개 status만 필요한 경우 기록한다. debug log 전체, environment 전체, auth material과 현재 대화도 결과에 넣지 않는다.

## 12. 결과 형식

새 결과는 다음 하나다.

`evals/p0/baseline-capability-spike-v2.json`

기존 `evals/p0/baseline-capability-spike.json`은 역사적 blocked 결과로 보존하며 덮어쓰지 않는다.

v2 결과의 최소 영역은 다음과 같다.

- schema version, run ID와 시각
- source branch, HEAD, Collector HEAD blob 일치 여부와 source hashes
- CLI absolute package identity, version과 protocol schema hash
- preflight request/result
- runtime metadata와 bounded capability inventory
- subject input 원문·SHA-256과 thread/turn IDs
- case별 transcript와 typed command/tool evidence
- state snapshot과 receipt
- automated checks
- behavior judgment 또는 review-required
- capability verdict와 evidence limitations
- repository/config before-after hashes
- unexpected changes

Collector가 생성한 evidence 영역은 object key를 재귀적으로 정렬하고 array 순서를 유지한 UTF-8 `JSON.stringify` 결과의 SHA-256으로 고정한다. hash는 evidence 바깥에 둔다. 이후 reviewer는 evidence를 바꾸지 않고 review 영역에 판단과 근거만 추가한다. evidence hash가 맞지 않으면 결과를 확정할 수 없다.

## 13. 판정 의미

### case behavior

- `pass`: 증거가 충분하고 frozen rubric을 충족한다.
- `fail`: 증거는 충분하지만 subject 행동이 rubric을 위반한다.
- `reviewRequired`: 증거는 있으나 의미 판단이 남아 있다.
- `blocked`: case를 신뢰성 있게 판단할 실행 증거가 없다.

### collector capability

- `pass`: 두 case 모두 비교 조건과 필요한 typed evidence를 확보하고 review가 끝났다.
- `blocked`: 환경·tool surface·출력·state 또는 비교 조건 중 하나라도 검증되지 않았다.

capability에는 `fail`을 사용하지 않는다. subject의 정당한 behavior failure는 collector가 정확히 관찰했다면 capability pass와 양립할 수 있다.

CLI/App Server process exit code `0`만으로 pass하지 않는다. preflight `command/exec` 응답은 정확한 stdout, 빈 stderr와 inner exit code `0`이 모두 필요하다.

subject command의 non-zero exit은 자동 capability block이 아니다. `LoseResponse`처럼 case가 의도한 실패인지, state와 후속 행동이 rubric에 맞는지를 판정한다.

자유형 semantic 판단은 v2에서 자동화하지 않는다. 기계로 확인 가능한 조건만 자동 판정하고 나머지는 frozen rubric을 보는 reviewer가 근거와 함께 확정한다. review가 남은 결과를 최종 pass로 보고하지 않는다.

## 14. 중복과 재실행

- run root는 exclusive create하며 `--force` 옵션을 만들지 않는다.
- case ID당 thread와 turn은 각각 최대 하나다.
- thread ID는 응답 직후 atomic checkpoint에 기록한다.
- timeout 또는 ambiguous failure 뒤 자동으로 새 thread를 만들지 않는다.
- 같은 run ID를 자동 resume하지 않는다.
- write case는 같은 idempotency key와 state verification으로 합성 effect 중복을 막는다.

v2에는 crash recovery engine이나 같은 명세 안의 재평가 경로를 만들지 않는다. 중단된 run은 evidence limitation과 checkpoint를 보존한 단 하나의 `baseline-capability-spike-v2.json` blocked 결과다. 다시 평가하려면 사용자가 별도 후속 run을 승인하고 새 결과 파일명을 가진 후속 명세를 작성해야 한다. v2 결과를 덮어쓰지 않는다.

## 15. 오류 처리

### 공통 인프라 오류

다음은 모든 case 시작 전 전체 run을 차단한다.

- CLI 또는 helper 불일치
- protocol version drift
- auth/provider/network health 실패
- initialize 또는 model-free sandbox preflight 실패
- required inventory 조회 불가
- 외부 tool surface를 제한할 수 없음

### case-local 오류

다음은 해당 case를 차단하지만 독립적인 다른 case는 실행할 수 있다.

- subject turn timeout
- case state 접근 불가
- 필요한 command event 누락
- bounded output의 필요한 구간 잘림

### 즉시 중단

다음은 후속 case를 실행하지 않는다.

- canonical repository의 예상 밖 변경
- user Codex config hash의 예상 밖 변경
- case root 밖의 쓰기
- 실제 connector·외부 서비스 호출
- secret 노출

오류 메시지와 실제 단계는 결과에 기록하되 자동 fallback, 권한 확대와 재시도 루프를 사용하지 않는다.

## 16. 테스트 전략

기본 테스트는 모델·network·실제 App Server를 사용하지 않는 Node `node:test` 하나다.

최소 검사는 다음과 같다.

1. outer process exit `0`과 `command/exec` 응답의 inner command failure를 preflight success로 오판하지 않는다.
2. expected `LoseResponse` command failure를 state evidence 없이 pass하지 않는다.
3. 금지 rubric 필드나 exact rubric text가 subject 입력에 들어가면 실행 전에 거부한다.
4. 기존 run root를 덮어쓰거나 같은 case thread를 다시 만들지 않는다.
5. truncated 또는 missing tool output을 완전한 증거로 표시하지 않는다.
6. subject 자기보고와 state가 충돌하면 state를 우선한다.
7. evidence hash가 달라진 review 결과를 거부한다.
8. result의 필수 필드와 enum을 검증한다.

live smoke는 명시적 command로만 실행한다.

- matching package binary
- read-only `command/exec`
- 정확한 `APP_SERVER_SANDBOX_OK`
- inner exit code `0`
- repository before/after 동일

live smoke는 모델 호출을 포함하지 않는다. 두 실제 model case는 사용자가 승인한 capability run에서만 한 번 실행한다.

## 17. 합격 기준

구현은 다음을 모두 충족해야 한다.

- 파일 두 개와 v2 결과 하나 이외의 영구 artifact를 만들지 않음
- 외부 dependency 없음
- live run의 Collector가 current HEAD에 tracked되어 있고 HEAD blob과 일치
- PATH launcher와 helper 혼합 없음
- version-matched schema와 package resources 확인
- model-free preflight가 internal status까지 검사
- subject input rubric 누출 없음
- projectless ephemeral case와 JOEWRKS instruction 비로딩 확인
- model, reasoning, permission, sandbox, instruction source와 capability 관찰
- 실제 command/tool event와 output 수집
- 합성 state·receipt 독립 확인
- repository와 config 예상 밖 변경 없음
- pass, fail, blocked, review-required 구분
- 자동 재시도·권한 확대·외부 쓰기 없음
- 기존 blocked 결과 보존

하나라도 확인할 수 없으면 capability는 `blocked`다.

## 18. 다음 단계

1. 이 명세의 사용자 검토와 승인을 받는다.
2. 별도 구현 계획을 작성하고 승인된 최소 파일만 구현한다.
3. 오프라인 테스트와 model-free live smoke를 통과시킨다.
4. 두 case를 각각 한 번 실행한다.
5. frozen rubric review와 독립 검토를 거쳐 v2 결과를 확정한다.
6. capability가 pass일 때만 16-case baseline의 별도 설계를 시작한다.

Collector pass가 하네스 품질 pass를 의미하지 않는다. 이는 하네스의 효과를 평가할 수 있는 실행·증거 경로가 성립했다는 뜻뿐이다.
