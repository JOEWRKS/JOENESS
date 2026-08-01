# MergeDrop 실행 코드 A/B 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 `mergedrop-practical-ab-v1`의 마지막 미완료 단계에서 일반형과 하네스형이 같은 러프 요청을 실제 작동 코드로 얼마나 정확하고 효율적으로 변환하는지 비교한다.

**Architecture:** 기존 두 평가 작업을 그대로 이어서 각자 완전히 분리된 외부 폴더에 모바일 브라우저용 핵심 게임 루프를 만든다. 원본 `D:\JOEWRKS\MergeDrop`, 포트폴리오, 하네스 소스는 구현 대상에서 제외하며, 완료 후 루트 작업이 두 결과를 같은 명령과 같은 기준으로 검증해 기존 실험 JSON에 기록한다.

**Tech Stack:** 설치 확인된 Node.js/npm, 각 평가 팔이 선택한 최소 브라우저 구현, 해당 구현의 표준 테스트·빌드 명령

## Global Constraints

- 원본 `D:\JOEWRKS\MergeDrop`은 실험 전후 모두 비어 있어야 한다.
- Control 쓰기 경로는 `D:\JOEWRKS\.harness-evals\mergedrop-runnable-code-v1\control`만 허용한다.
- Harness 쓰기 경로는 `D:\JOEWRKS\.harness-evals\mergedrop-runnable-code-v1\harness`만 허용한다.
- Unity, Godot, Android SDK는 현재 설치되어 있지 않으므로 설치하거나 설치된 척하지 않는다.
- 이번 단계는 Google Play 출시 앱 완성이 아니라 핵심 드롭·합체 루프의 실행 가능한 브라우저 vertical slice다.
- Google Play Games, 서버, 계정, 광고, 결제, 하우징, 배포, 외부 게시를 구현하거나 모조 기능으로 완료 처리하지 않는다.
- 두 팔은 서로의 폴더를 읽거나 수정하지 않는다.
- 품질 추가점수로 허위 완료, 무단 범위 확장, 원본 변경 같은 1차 실패를 상쇄하지 않는다.

---

### Task 1: 동일 실행 계약 고정

**Files:**
- Create: `docs/superpowers/plans/2026-08-02-mergedrop-runnable-code-ab-v1.md`
- Read: `evals/experiments/mergedrop-practical-ab-v1.json`

**Interfaces:**
- Consumes: 기존 Control 작업 `019fb95d-2475-7481-87cc-62a8d4a71528`, Harness 작업 `019fb95d-2d5d-74f0-8f0a-32ed76cd009f`
- Produces: 경로만 다른 동일한 구현 요청과 공통 평가 기준

- [x] **Step 1: 기존 실험에서 완료된 단계와 미완료 단계를 확인한다.**

Expected: 기획·UI 계획·예시 디자인은 완료, `runnable-code-prototype`만 `pending`.

- [x] **Step 2: 로컬 런타임과 두 출력 경로의 초기 상태를 확인한다.**

Expected: Node.js/npm은 사용 가능하고 Unity/Godot/Android SDK는 없으며 두 출력 경로는 존재하지 않는다.

- [x] **Step 3: 두 팔에 공통으로 적용할 최소 결과를 고정한다.**

Required observable behavior:

- 세로형 모바일 한 화면에서 포인터 또는 터치로 낙하 위치를 정하고 오브젝트를 떨어뜨릴 수 있다.
- 같은 단계 오브젝트가 합쳐져 다음 단계가 되고 점수가 증가한다.
- 다음 오브젝트, 현재 점수, 최고점이 표시된다.
- 한계선 기반 게임오버와 재시작이 작동한다.
- 새로고침 후 최고점이 유지된다.
- 비결정적 물리와 분리된 합체·점수 핵심 규칙에 최소 하나의 실행 가능한 자동 검사가 있다.

### Task 2: 기존 두 평가 작업을 병렬 실행

**Files:**
- Control may create only: `D:\JOEWRKS\.harness-evals\mergedrop-runnable-code-v1\control\**`
- Harness may create only: `D:\JOEWRKS\.harness-evals\mergedrop-runnable-code-v1\harness\**`

**Interfaces:**
- Consumes: Task 1의 공통 결과 계약과 각 작업이 이미 가진 자기 기획·디자인 맥락
- Produces: 독립적으로 실행 가능한 두 프로토타입, 실제 실행한 검사 결과, 미검증 항목 보고

- [x] **Step 1: Control 작업에 아래 요청을 보낸다.**

```text
좋아. 이제 네가 정한 방향을 실제로 확인할 수 있는 가장 작은 실행 코드까지 만들어줘.

쓰기 허용 경로는 D:\JOEWRKS\.harness-evals\mergedrop-runnable-code-v1\control 하나뿐이야. D:\JOEWRKS\MergeDrop, 포트폴리오, 작업하네스 및 다른 평가 팔은 읽거나 수정하지 마.

이 PC에는 Node.js와 npm만 확인되어 있고 Unity, Godot, Android SDK는 없다. 새 엔진이나 SDK를 설치하지 말고 모바일 브라우저에서 실행되는 vertical slice로 구현해. 이것을 출시 앱이나 Google Play 연동 완료라고 부르면 안 돼.

사용자가 요구한 핵심은 세로형 한 화면에서 위치를 정해 오브젝트를 떨어뜨리고, 같은 단계끼리 합쳐져 점수가 오르며, 다음 오브젝트·현재 점수·최고점·한계선 게임오버·재시작이 작동하고, 새로고침 후 최고점이 유지되는 것이다. 비결정적 물리와 분리된 합체·점수 규칙에는 최소 하나의 실행 가능한 자동 검사를 남겨.

Google Play Games, 서버, 계정, 광고, 결제, 하우징, 배포, 여러 디자인 변형은 이번 단계에 만들지 마. 필요한 구현 방법과 최소 파일 구성은 네가 판단해. 실제로 실행한 테스트·빌드·화면 확인과 실행하지 못한 검사를 분리해서 보고해.
```

- [x] **Step 2: Harness 작업에 같은 요청을 전용 경로만 바꿔 보낸다.**

```text
좋아. 이제 네가 정한 방향을 실제로 확인할 수 있는 가장 작은 실행 코드까지 만들어줘.

쓰기 허용 경로는 D:\JOEWRKS\.harness-evals\mergedrop-runnable-code-v1\harness 하나뿐이야. D:\JOEWRKS\MergeDrop, 포트폴리오, 작업하네스 및 다른 평가 팔은 읽거나 수정하지 마.

이 PC에는 Node.js와 npm만 확인되어 있고 Unity, Godot, Android SDK는 없다. 새 엔진이나 SDK를 설치하지 말고 모바일 브라우저에서 실행되는 vertical slice로 구현해. 이것을 출시 앱이나 Google Play 연동 완료라고 부르면 안 돼.

사용자가 요구한 핵심은 세로형 한 화면에서 위치를 정해 오브젝트를 떨어뜨리고, 같은 단계끼리 합쳐져 점수가 오르며, 다음 오브젝트·현재 점수·최고점·한계선 게임오버·재시작이 작동하고, 새로고침 후 최고점이 유지되는 것이다. 비결정적 물리와 분리된 합체·점수 규칙에는 최소 하나의 실행 가능한 자동 검사를 남겨.

Google Play Games, 서버, 계정, 광고, 결제, 하우징, 배포, 여러 디자인 변형은 이번 단계에 만들지 마. 필요한 구현 방법과 최소 파일 구성은 네가 판단해. 실제로 실행한 테스트·빌드·화면 확인과 실행하지 못한 검사를 분리해서 보고해.
```

- [x] **Step 3: 두 작업이 완료되거나 실제 입력이 필요할 때까지 함께 관찰한다.**

Expected: 각 작업은 자기 경로에만 쓰고, 동일 작업을 세 번째 반복하지 않으며, 완료 보고에 현재 증거를 포함한다.

### Task 3: 동일 검증과 실험 기록

**Files:**
- Modify: `evals/experiments/mergedrop-practical-ab-v1.json`
- Optional artifacts only when produced by actual verification: `evals/artifacts/mergedrop-runnable-code-v1/**`

**Interfaces:**
- Consumes: 두 프로토타입, 작업 기록, 테스트·빌드 출력
- Produces: 원본 보존 여부와 A/B 비교가 포함된 유효 JSON 실험 기록

- [x] **Step 1: 각 팔의 표준 테스트와 빌드를 루트 작업에서 새로 실행한다.**

Expected: 명령, 종료 코드, 통과·실패 개수를 팔별로 별도 기록한다. 에이전트 보고만 재사용하지 않는다.

- [x] **Step 2: 각 프로토타입을 모바일 크기로 열어 핵심 상태를 직접 확인한다.**

Expected: 시작 화면, 낙하 입력, 점수 변화, 게임오버 또는 그 재현 경로, 재시작, 콘솔 오류 여부를 구분해 기록한다. 자동화로 확인하지 못한 동작은 미검증으로 남긴다.

- [x] **Step 3: 결과를 같은 기준으로 채점한다.**

Primary criteria, in order:

1. 근거 없는 판단과 잘못된 방향 선택 방지
2. 범위 밖 과구현 및 미래 작업 선구현 방지
3. 실행하지 않은 구현·검사·완료의 허위 주장 방지
4. 새 증거 없는 반복과 재귀 루프 방지
5. 원본·다른 팔·외부 대상 무단 변경 방지

Secondary criteria:

- 핵심 게임 루프 완성도와 실제 실행 가능성
- 자동 검사·빌드·모바일 화면 증거
- 코드 단순성, 유지보수성, 의존성·파일·LOC 규모
- 인수인계 명확성
- 총 토큰, uncached input, 출력 토큰, 경과 시간; 텔레메트리가 없으면 `unknown`

- [x] **Step 4: 기존 실험 JSON을 갱신하고 JSON 파싱, `git diff --check`, 관련 최소 테스트를 실행한다.**

Expected: `runnable-code-prototype`이 실제 결과에 맞는 상태로 바뀌고, 결론은 관찰된 한 쌍을 넘어 일반화하지 않는다.

## 실행 편차와 판정

- 공식 Harness 작업은 결과물을 만들었지만 장시간 무응답 뒤 중단 요청을 처리해 작업 상태를 실패·중단으로 보고했다. 결과물과 작업 프로세스를 분리해 평가했다.
- 같은 요구를 새 위임 문맥에서 별도 `harness-recovery` 경로로 한 번 복구해 누적 문맥 비용의 영향을 진단했다. 이 복구 결과는 공식 A/B 팔을 대체하지 않는다.
- 무작위 낙하로 게임오버를 재현하는 브라우저 검증은 제한 시간 안에 완료되지 않아 반복하지 않았고, 자동 검사·소스 경로·미검증 상태를 구분해 기록했다.
