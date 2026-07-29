# Codex App Server Evidence Collector v3 설계

- 상태: 사용자 진행 승인 — 구현 가능
- 상위 명세: `docs/superpowers/specs/2026-07-27-common-work-harness-design.md`
- 기존 Collector 설계: `docs/superpowers/specs/2026-07-28-codex-app-server-evidence-collector-design.md`
- 보존할 v2 증거: `evals/p0/baseline-capability-spike-v2.json`

## 1. 목적

v2에서 실행되지 않은 `p0-02-unknown-write` capability를 수정된 Collector로 실제 검증한다. v2 결과를 고치거나 재실행하지 않고 별도의 v3 one-shot 증거를 만든다.

v2는 `pressure-08-claim-integrity`의 의미적 pass를 기록했지만 정상 `userMessage` 완료와 `account/rateLimits/updated` 알림을 잘못 차단해 두 번째 case를 실행하지 못했다. 이 두 protocol shape는 커밋 `1437ca7`의 회귀 테스트로 수정됐다. 수정 자체는 미실행 capability의 통과 증거가 아니므로 새로운 end-to-end 평가가 필요하다.

## 2. 범위

### 포함

- 새 CLI mode `run-v3`
- 새 exclusive 결과 `evals/p0/baseline-capability-spike-v3.json`
- `runId: "v3"`인 기존 schema version 2 결과
- v2와 같은 두 frozen case, 순서, runtime control, permission profile, model 조건
- model-free smoke 뒤 승인된 v3 one-shot 한 번
- evidence 불변 read-only review

### 제외

- v2 결과 수정·삭제·덮어쓰기·재실행
- case, rubric, subject prompt 또는 dynamic tool 의미 변경
- retry·resume·force·overwrite mode
- v2와 v3 일부를 조합한 합성 capability pass
- 전체 16-case baseline과 하네스 본체 materialization
- 새 dependency, provider abstraction, DB, queue 또는 UI

## 3. 버전 계약

| 항목 | v3 값 |
|---|---|
| CLI mode | `run-v3` |
| run ID | `v3` |
| result schema | `2` |
| result path | `evals/p0/baseline-capability-spike-v3.json` |
| case IDs | `pressure-08-claim-integrity`, `p0-02-unknown-write` |
| result write | `wx` exclusive create |
| review initial state | `pending`, capability `blocked` |

현재 Collector의 `run-v2` CLI mode는 제거한다. v2 파일 존재 여부에만 재실행 방지를 맡기지 않는다. `smoke`와 `run-v3`만 유효하며 `run-v2`, `resume`, `force`, 추가 인수는 usage error다.

schema shape가 바뀌지 않으므로 `schemaVersion`은 2를 유지한다. 새 버전은 파일명과 `runId`로 구분한다. `validateResult`의 evidence·review 무결성 계약도 그대로 재사용한다.

## 4. 최소 구현

Collector 본문을 복사해 `runV3`를 새로 만들지 않는다. 하나의 immutable run configuration이 다음 값을 소유한다.

```js
{
  mode: "run-v3",
  runId: "v3",
  resultRelativePath: "evals/p0/baseline-capability-spike-v3.json",
  resultPath: "<repository-root>/evals/p0/baseline-capability-spike-v3.json"
}
```

기존 `runV2` 본문은 configuration을 받는 `runConfiguredEvaluation`으로 바꾼다. execution gate, exclusive temp root, result `runId`, result path와 stdout mode만 configuration에서 읽고 나머지 preflight·inventory·case·evidence 흐름은 그대로 둔다.

`createV2RunRoot`는 기존 단위 테스트와 역사 API를 위해 남기되 live main에서는 호출하지 않는다. v3는 기존 `createExclusiveRunRoot("v3")`를 직접 재사용한다.

## 5. 왜 두 case를 다시 실행하는가

`pressure-08`의 v2 의미 판정만 재사용하고 v3에서 `p0-02`만 실행하면 서로 다른 Collector source와 session의 증거를 하나의 capability로 합성해야 한다. 이는 current-source 우선과 동일 실행 조건을 약화하고 validator를 복잡하게 만든다.

v3의 두 case는 수정된 동일 Collector, 동일 App Server session과 runtime inventory 아래에서 각각 한 번 실행한다. 이는 근거·방법이 달라진 새 검증이며 무진전 반복이 아니다. 같은 v3 명세 안에서는 성공·blocked와 관계없이 재실행하지 않는다.

## 6. 실패와 리뷰

- v3 result가 이미 있으면 model·thread를 시작하지 않고 차단한다.
- fixed run root `%TEMP%\joewrks-eval-v3`가 이미 있으면 자동 삭제하지 않고 model·thread 시작 전에 차단한다.
- source, repository, config, permission profile, MCP, hook, remote-control 또는 sandbox 조건이 달라지면 fail-closed한다.
- 첫 case에서 session-fatal 또는 위험 drift가 생기면 두 번째 case는 `case-not-run`으로 기록하고 v3를 재실행하지 않는다.
- 생성된 evidence와 `evidenceSha256`은 reviewer가 변경하지 않는다.
- reviewer는 각 case를 frozen rubric에 대해 `pass` 또는 `fail`로 판정하고 존재하는 exact JSON Pointer를 남긴다.
- 두 case와 모든 control evidence가 완전할 때만 capability `pass`가 가능하다.
- case의 의미 판정 `fail`은 subject behavior 실패이며, 수집·통제 증거가 완전하면 Collector capability `pass`와 공존할 수 있다.

## 7. 검증

TDD 회귀 검사는 다음을 증명한다.

1. `run-v3`만 새 live mode로 허용된다.
2. `run-v2`는 usage error다.
3. v3 configuration은 정확한 mode, run ID와 별도 result path를 사용하며 immutable하다.
4. 알 수 없는 live mode에는 configuration을 만들지 않는다.
5. 완료된 `userMessage`의 본문 부재와 rate-limit telemetry는 수집기와 최종 validator에서 동일하게 passive lifecycle evidence로 취급한다.
6. 기존 Collector·P0 계약 검사를 모두 유지한다.

model-free smoke는 구현 commit 뒤 host runner에서 한 번 실행한다. smoke가 repository/config 불변, write/network isolation과 runtime control을 통과한 뒤에만 `run-v3`를 한 번 실행한다.

## 8. 합격 기준

- v2 result bytes와 Git history가 변경되지 않는다.
- `git diff HEAD --exit-code -- evals/p0/baseline-capability-spike-v2.json`이 staged 변경까지 포함해 v2 result 불변을 확인한다.
- CLI가 `smoke|run-v3` 외 mode를 거부한다.
- 새 result path는 v2와 다르고 기존 파일을 덮어쓰지 않는다.
- Node 전체 테스트, P0 PowerShell 계약, syntax와 diff 검사가 통과한다.
- smoke는 model turn과 v3 result를 만들지 않는다.
- v3는 두 case를 각 한 번만 시작한다.
- read-only review와 validator가 capability `pass`를 확인해야 다음 full baseline 단계로 이동한다.
- v3가 blocked면 사실과 limitation을 보존하고 새 승인·새 명세 없이 재실행하지 않는다.
