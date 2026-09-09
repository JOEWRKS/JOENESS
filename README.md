# JOENESS

> **0.2 Astra Judgment — GPT-6 Astra / xhigh — minimal runtime**

JOENESS 0.2는 GPT-6 Astra에 큰 작업 하네스를 다시 얹는 릴리스가 아닙니다. 현재 active runtime은 **Independent Judgment**라는 작은 행동 규칙 하나뿐입니다.

이 규칙의 목적은 사용자가 질문하거나 반박했다는 이유만으로 에이전트가 기존 판단을 자동으로 뒤집는 현상을 줄이는 것입니다. 사용자의 명시적 결정권을 약화시키거나, 에이전트가 사용자를 상대로 불필요하게 논쟁하도록 만드는 규칙이 아닙니다.

## 왜 0.1의 zero-runtime 결정을 다시 열었나

`0.1-astra-native`는 당시의 증거에 따라 의도적으로 JOENESS behavioral runtime을 0으로 닫았습니다. 이전 broad Common Core가 Bare Astra 대비 고유한 실질 이점을 입증하지 못했기 때문입니다.

그 결정은 당시 기준으로 유효했습니다.

이후 실제 작업에서 별도의 Astra 실패가 반복 관찰됐습니다.

1. 에이전트가 근거를 가지고 결론을 냅니다.
2. 사용자가 질문·우려·취향·반론을 제시하지만 반드시 새 결정을 내린 것은 아닙니다.
3. 에이전트가 새로운 근거나 권한 변화 없이 기존 결론을 너무 쉽게 뒤집습니다.
4. 결과적으로 목표에 대한 독립 판단보다 대화상 동의가 우선되는 경우가 생깁니다.

0.2는 이 한 문제만 교정하기 위해 runtime을 최소 범위로 다시 엽니다.

## Active rule — Independent Judgment

현재 설치되는 규칙은 [`astra-judgment-core.md`](astra-judgment-core.md) 하나입니다.

핵심 의미는 네 가지입니다.

- 사용자 질문·반론·우려·취향은 **평가할 evidence**이지 자동 정정이 아닙니다.
- 반론을 받으면 목표, 현재 evidence, 제약, authority, trade-off를 기준으로 기존 판단을 다시 검토합니다.
- 사용자에게 결정권이 있는 범위에서 **명시적으로 방향을 결정하거나 지시한 경우에는 그 결정을 따릅니다.** 단순한 의심이나 반론과 명시적 결정은 구분합니다.
- 대화상 동의를 목표로 하지 않습니다. 중요한 단점, 모순, 잘못된 가정, 불필요한 작업이 있으면 사용자 제안에 반대하는 결론도 설명합니다.

짧게 말하면:

```text
사용자 반론 ≠ 자동 정정
사용자 명시 결정 ≠ 단순 반론

반론 → 재검토 → 기존 판단 유지 또는 근거를 가지고 수정
명시적 사용자 결정 → 사용자의 authority 범위에서 따름
```

## 0.2가 하지 않는 것

0.2는 다음을 active runtime으로 되살리지 않습니다.

- 역사적인 broad `common-core.md`
- 1,690-byte Lean Kernel
- JOENESS public skills
- UI/UX 또는 디자인 vendor routing
- plugin routing
- JOEFLOW workflow
- JOEDESIGN workflow
- stage/roadmap/reviewer framework
- 특정 도메인 규칙

현재 machine-readable distribution identity는 [`vendor/source-manifest.json`](vendor/source-manifest.json)입니다.

- release: `0.2-astra-judgment`
- model: `gpt-6-astra`
- reasoning effort: `xhigh`
- runtime mode: `common-core`
- active Common Core: `astra-judgment-core.md`
- managed whole-file runtime payload: 0
- public skills: 0
- default vendors: 0
- plugin routing: none

## 설치와 상태 확인

먼저 읽기 전용 Check를 실행합니다.

```powershell
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
```

깨끗한 Astra 환경에서 안전하게 설치할 수 있으면 `ready`와 `changesRequired: true`를 반환합니다. `Check`는 파일을 설치하거나 수정하지 않습니다.

명시적으로 Apply를 실행합니다.

```powershell
powershell.exe -NoProfile -File .\JOENESS.ps1 -Apply
```

Apply는 Codex 사용자 `AGENTS.md` 안의 JOENESS 관리 block에 Independent Judgment만 설치합니다. 사용자 소유 bytes는 관리 block 밖에서 보존하며, JOENESS ownership state와 정확한 distribution manifest identity를 함께 기록합니다.

설치 후 다시 확인합니다.

```powershell
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
```

정확한 설치는 `current`와 `changesRequired: false`를 반환합니다. 같은 버전에 다시 Apply해도 추가 변경을 만들지 않습니다.

제거하려면 명시적으로 Remove를 실행합니다.

```powershell
powershell.exe -NoProfile -File .\JOENESS.ps1 -Remove
```

Remove는 JOENESS가 정확히 소유한 managed block, state, 설치 manifest만 제거합니다. 영향을 받는 기존 bytes를 먼저 백업하고 write/readback을 검증하며, `AGENTS.md`의 관리 block 밖 사용자 bytes와 비관리 파일은 보존합니다.

ownership이나 내용이 drift됐거나 출처를 확정할 수 없으면 자동 수리하지 않고 `blocked`로 멈춥니다.

## 이전 GPT-5.6 Control 설치

기존 exact GPT-5.6 Control 설치는 계속 compatibility 대상으로 보존합니다.

현재 JOENESS가 exact Control 설치를 발견하면:

- `Check` → `legacy`
- `Apply` → `legacy` 상태를 유지하며 자동 덮어쓰기/자동 migration을 하지 않음
- 명시적 `Remove` → pinned historical identity가 정확할 때만 안전 제거
- 제거 후 0.2는 자동 설치되지 않으며 다시 `ready`가 됨

즉 **legacy 제거와 Astra Judgment 설치는 한 동작으로 합치지 않습니다.**

Drifted, forged, partial historical install은 계속 fail-closed입니다.

## Shared cross-system contracts

`docs/contracts/`는 JOEFLOW, Product Definition, JOEDESIGN 등 여러 시스템이 동일하게 알아야 하는 cross-system authority boundary를 보관합니다.

이 문서 영역과 JOENESS 0.2 runtime은 역할이 다릅니다. Shared contract를 읽는 행위가 behavioral runtime을 설치하거나 해당 시스템의 workflow를 JOENESS에 흡수한다는 뜻은 아닙니다.

현재 기준 계약은 [`docs/contracts/JOEWRKS_CROSS_SYSTEM_AUTHORITY_V1.md`](docs/contracts/JOEWRKS_CROSS_SYSTEM_AUTHORITY_V1.md)입니다.

## 버전 이력

### 0.2-astra-judgment — 2026-09-08

- Astra 실사용에서 관찰된 과도한 agreement/reversal 문제를 대상으로 runtime을 최소 재개
- Independent Judgment 하나만 active
- Check / Apply / Remove managed-block lifecycle 재활성화
- public skills / vendors / plugin routing은 계속 0
- exact GPT-5.6 Control removal compatibility 유지

### 0.1-astra-native — 2026-09-05

- Astra rebaseline과 stress falsification에서 broad JOENESS overlay의 고유 이점이 확인되지 않아 zero runtime으로 종료
- clean Astra에서 `Check = current`, Apply unsupported/no-op
- legacy GPT-5.6 Control은 explicit Remove만 지원

0.2는 0.1이 “틀렸기 때문에” 되돌리는 릴리스가 아닙니다. **새로 관찰된 실패에 대해 더 작은 교정을 추가하는 릴리스**입니다.

## 향후 규칙 추가 기준

JOENESS에 다음 행동 규칙을 추가하려면 최소한 다음이 필요합니다.

1. 실제 Astra 작업에서 material failure가 관찰될 것
2. 문제가 project-local/domain-local 규칙만으로 충분히 해결되는지 먼저 검토할 것
3. cross-domain global correction이 필요한 근거가 있을 것
4. 가능한 가장 작은 규칙으로 후보를 만들 것
5. Bare Astra baseline 대비 고유한 개선과 부작용을 별도로 검증할 것

“안전해 보인다”, “좋은 관행이다”, “있으면 유용할 것 같다”만으로 Common Core를 확장하지 않습니다.

현재 Independent Judgment의 행동 A/B 평가는 release identity와 분리된 experiment artifact로 관리합니다. 구현·설치 contract PASS와 모델 행동 superiority는 같은 주장이 아닙니다.

## 보존 범위

이 저장소는 다음 역사 자료를 계속 보존합니다.

- GPT-5.6 Control identity와 안전 제거 source
- Lean Candidate / Lean Readiness evidence
- 1,690-byte Lean Kernel과 exact identity
- TrackB Astra rebaseline / stress-falsification evidence
- 과거 broad Common Core와 skills/vendor source
- 선택·거절·대체 이력

역사 자료는 active distribution manifest에 자동 포함되지 않습니다.

---

## English Guide

JOENESS 0.2 Astra Judgment is a **minimal GPT-6 Astra runtime**. It does not restore the former broad harness. The only active behavioral payload is `astra-judgment-core.md`.

### Why runtime reopened

`0.1-astra-native` deliberately used zero behavioral runtime because the earlier broad overlay did not demonstrate unique material value over Bare Astra. That decision was valid under the evidence available at the time.

Later real work exposed a narrower recurring failure: Astra could treat user pushback, doubt, preference, or challenge as an automatic correction and reverse a reasoned conclusion without new evidence or a new authority decision.

`0.2-astra-judgment` targets only that failure.

### Independent Judgment

The rule requires the agent to:

- treat user challenges as evidence to evaluate, not automatic corrections;
- re-evaluate prior judgment against the goal, evidence, constraints, authority, and trade-offs;
- preserve explicit user decisions where the user owns the decision;
- avoid optimizing for agreement and surface material downsides or contradictions when relevant.

A challenge is not the same as an explicit decision. The rule is not permission to become argumentative or disobedient.

### Active distribution

- version: `0.2-astra-judgment`
- model: `gpt-6-astra`
- reasoning: `xhigh`
- active Common Core: one file
- public skills: none
- default vendors: none
- plugin routing: none
- historical broad Core: inactive

### Lifecycle

Run read-only `Check`, explicit `Apply`, then `Check` again. `Remove` deletes only exact JOENESS-owned state and preserves user-owned bytes outside the managed block. Drifted or uncertain ownership fails closed.

Exact historical GPT-5.6 Control installs are reported as `legacy`. They must be explicitly removed before installing the Astra Judgment overlay; JOENESS never auto-migrates them in one operation.

### Evidence policy

Future global rules require a real observed Astra failure, a reason the correction belongs globally rather than project-locally, the smallest viable rule, and evidence of unique benefit over the native baseline. Repository lifecycle verification does not by itself prove behavioral superiority.
