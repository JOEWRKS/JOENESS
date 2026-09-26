# JOENESS

> **0.2 Astra Judgment — GPT-6 Astra / xhigh — minimal current tree**

JOENESS 0.2는 GPT-6 Astra 위에 큰 작업 하네스를 다시 얹는 릴리스가 아니다. 현재 active runtime은 **Independent Judgment**라는 작은 행동 규칙 하나뿐이다.

이 규칙은 사용자가 질문하거나 반박했다는 이유만으로 에이전트가 기존 판단을 자동으로 뒤집는 현상을 줄인다. 반론을 받으면 목표, evidence, constraints, authority, trade-offs를 다시 검토하고, 기존 판단이 여전히 타당하면 유지하며 이유를 설명한다. 사용자가 결정권을 가진 범위에서 명시적으로 방향을 결정한 경우에는 그 결정을 따른다.

## Active release

Machine-readable identity: `vendor/source-manifest.json`

- release: `0.2-astra-judgment`
- model: `gpt-6-astra`
- reasoning effort: `xhigh`
- runtime mode: `common-core`
- active Common Core: `astra-judgment-core.md`
- managed whole-file runtime payload: 0
- public skills: 0
- default vendors: 0
- plugin routing: none

현재 active source는 `astra-judgment-core.md` 하나다.

## 왜 main이 작아졌나

이 저장소는 이전 JOENESS 개발 과정에서 broad Common Core, public skills, design vendors, compatibility material, 여러 세대의 A/B 실험, evaluator, handoff/spec/plan, 대규모 historical test를 main에 함께 보관해 왔다.

0.2의 실제 active surface가 하나의 규칙으로 축소된 뒤에도 그 역사 자료가 현재 제품처럼 보이는 문제가 남았다. 그래서 current main은 **현재 릴리스에 실제로 필요한 파일만** 보관한다.

다음 자료는 current main에서 제거되었다.

- historical `common-core.md`
- `skills/**`
- old design/vendor payloads
- GPT-5.6 compatibility payloads와 current-tree migration/removal logic
- superseded evals, candidates, fixtures, collectors
- superseded tests
- superseded docs / handoffs / specs / plans / task ledgers
- `JOENESS-0.1.ps1`, `harness.ps1` 같은 old entrypoint aliases

이 자료는 삭제된 역사가 아니다. **Git commit history에 그대로 남아 있으며**, 과거 버전 확인이 필요하면 해당 commit을 조회하거나 checkout한다. 현재 main에 archive 복사본을 다시 만들지 않는다.

## Current repository layout

```text
JOENESS/
├─ .github/
│  └─ workflows/
│     └─ windows-ci.yml
├─ evals/
│  └─ experiments/
│     └─ joeness-astra-independent-judgment-ab-plan-v1.json
├─ scripts/
│  └─ sync-harness.ps1
├─ tests/
│  └─ astra-judgment-sync.tests.ps1
├─ vendor/
│  └─ source-manifest.json
├─ .gitattributes
├─ .gitignore
├─ AGENTS.md
├─ JOENESS.ps1
├─ README.md
└─ astra-judgment-core.md
```

## 설치와 상태 확인

읽기 전용 확인:

```powershell
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
```

깨끗한 환경이면 `ready`와 `changesRequired: true`를 반환한다. `Check`는 관리 파일을 만들거나 수정하지 않는다.

명시적 설치:

```powershell
powershell.exe -NoProfile -File .\JOENESS.ps1 -Apply
```

`Apply`는 Codex 사용자 `AGENTS.md` 끝에 JOENESS 관리 marker로 감싼 exact Independent Judgment block 하나만 추가하고, 같은 Codex home에 최소 ownership state를 기록한다. 사용자 bytes는 관리 suffix 밖에서 그대로 보존된다.

설치 후:

```powershell
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
```

정확한 current install이면 `current`를 반환한다. 반복 `Apply`는 idempotent다.

제거:

```powershell
powershell.exe -NoProfile -File .\JOENESS.ps1 -Remove
```

정확한 현재 JOENESS managed suffix만 제거한다. 설치 후 사용자가 managed block 앞쪽의 자기 내용을 수정했다면 그 변경도 보존한다. marker drift, forged/unknown state, source mismatch 등은 자동 복구하지 않고 `blocked`로 실패한다.

## Historical installs

Current 0.2 main은 과거 GPT-5.6 / broad-harness install을 감지하거나 마이그레이션하거나 제거하기 위한 historical payload를 더 이상 싣지 않는다.

옛 설치를 다뤄야 한다면 **그 설치가 만들어진 historical commit의 installer와 source identity를 사용한다.** 이는 current main을 역사 호환 코드 저장소로 다시 키우지 않기 위한 의도적인 경계다.

대표적인 과거 commit도 Git history에서 계속 조회 가능하다.

- pre-cleanup JOENESS 0.2 main: `cb1bc9f9032cb8d1cc380369ca2305100e6c332b`
- historical GPT-5.6 Control identity: `80c79e9f4be91d730b1b3cdc62d7bf51508895e8`

## Behavioral evidence boundary

`evals/experiments/joeness-astra-independent-judgment-ab-plan-v1.json`은 현재 행동 비교 계획이다.

현재 상태:

- status: `NOT-RUN`
- results: `null`
- conclusion: `null`

따라서 이 저장소의 installer/CI가 통과한다는 사실은 **Independent Judgment가 Bare Astra보다 행동적으로 우월하다는 증거가 아니다.** 그 주장은 별도의 실제 A/B 실행과 결과 검토가 있어야 한다.

## Release verification

현재 release gate는 Windows에서 다음만 검증한다.

- checkout에 full Git history가 존재하는지
- current main surface가 허용된 최소 파일 집합과 정확히 일치하는지
- current manifest/core identity가 정확한지
- historical commits가 Git history에서 계속 조회 가능한지
- clean `Check → Apply → Check → repeat Apply → Remove → Check` lifecycle
- user bytes 보존
- unowned marker / drift / state tamper fail-closed
- injected write failure rollback
- base-wide `git diff --check`

과거 기능의 runtime regression suite는 current main release gate가 아니다. 과거 기능은 historical commit에서 재현한다.
