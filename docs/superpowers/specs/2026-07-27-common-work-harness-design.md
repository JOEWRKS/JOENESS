# 공통 작업 하네스 설계 명세

- 기준일: 2026-07-27
- 저장소: `D:\JOEWRKS\작업하네스`
- 상태: 외부 스킬 직접 재사용 방침 반영, 작성 명세 사용자 검토 대기
- 주 사용 환경: Codex Desktop/CLI
- 호환 대상: Claude Code, GitHub Copilot CLI 및 지원되는 IDE 표면

## 1. 목적

여러 프로젝트에 공통으로 적용할 작업 규칙을 하나의 독립 저장소에서 관리한다. 하네스는 AI가 사용자의 의도를 확대 해석하거나 이미 한 일을 다시 수행하는 문제를 줄이면서, 필요한 경우에는 조사·검토·도구 사용으로 안전하게 경로를 전환할 수 있어야 한다.

하네스의 성공 기준은 규칙 파일이 많아 보이는 것이 아니다. 다음 행동이 실제 작업에서 재현되는 것이다.

- 요청 범위 밖의 변경을 만들지 않는다.
- 기존 구현·변경·결정을 확인한 뒤 새 작업을 시작한다.
- 새로운 근거 없이 같은 행동을 반복하지 않는다.
- 최소한의 코드로 요구된 제품 결과를 완전하게 만든다.
- 프로젝트의 기존 구조와 현직 개발 워크플로를 존중한다.
- 9.1의 적용 대상에 해당하는 디자인 작업에서는 UI/UX 원칙, Figma 구조, 브라우저 동작을 함께 검증한다.
- 완료 주장은 실행 가능한 검증 결과를 근거로 한다.
- 긴 과거 기록을 무조건 읽지 않고 현재 작업에 필요한 근거만 검색한다.

## 2. 범위

### 포함

- 모든 프로젝트에 적용할 짧은 공통 규칙
- 프로젝트별 규칙과 공통 규칙의 우선순위
- 기능별 온디맨드 스킬과 설치 플러그인 라우팅
- 문서와 과거 맥락의 선택적 검색 방식
- 중복 구현·중복 실행·무진전 반복 방지
- 조건부 보조 에이전트 사용 기준
- Codex, Claude Code, GitHub Copilot용 얇은 어댑터
- 외부 스킬의 고정 버전 직접 수용과 업데이트 관리
- 9.1의 적용 수준에 따른 UI/UX·Apple Design·Figma·브라우저 이중 검증
- 하네스 자체의 행동 평가와 회귀 검증

### 제외

- 디자인·프론트엔드·백엔드·PM·유지보수 에이전트를 항상 실행하는 고정 조직
- 모든 프로젝트에 동일한 언어·프레임워크·코드 스타일을 강제하는 규칙
- 기존 프로젝트의 대형 문서를 한 번에 재작성하는 작업
- 사용자의 확인 없이 배포·결제·이메일·외부 시스템 쓰기를 실행하는 자동화
- 자연어 규칙만으로 보안, 테스트, 권한 검사를 대체하는 구조
- 외부 저장소의 설치 스크립트나 플러그인을 검토 없이 실행하는 방식

기존 JOEWRKS 프로젝트의 규칙 마이그레이션은 하네스 검증 후 프로젝트별로 수행한다. 첫 구현에서 기존 `AGENTS.md`, `TASKS.md`, 설계 문서를 자동 변경하지 않는다.

## 3. 설계 원칙

### 3.1 최소 컨텍스트, 충분한 근거

짧게 만들기 위해 필요한 내용을 삭제하지 않는다. 현재 작업과 무관한 내용을 시작 컨텍스트에서 제외하기 위해 분리한다.

파일을 여러 개로 나누는 것만으로는 토큰이 절약되지 않는다. 다음 중 하나가 실제로 적용될 때만 분리의 컨텍스트 이점이 생긴다.

- 디렉터리 또는 파일 경로에 따른 조건부 규칙
- 사용자 요청과 설명이 일치할 때만 활성화되는 스킬
- 스킬이 직접 가리키는 외부 원문 또는 실행 진입점 한 단계
- 검색 결과로 선택한 문서 구간

### 3.2 최소 코드는 최소 제품이 아니다

과구현 방지는 요구 결과를 축소하는 규칙이 아니다.

- 기능, 상태, 반응형, 접근성, 오류 처리는 합의된 완료 조건만큼 구현한다.
- 같은 결과를 더 적은 구조와 의존성으로 만들 수 있으면 더 단순한 쪽을 선택한다.
- 디자인 충실도를 코드 줄 수와 교환하지 않는다.
- 보안, 데이터 손실 방지, 접근성 기본은 단순화를 이유로 제거하지 않는다.

### 3.3 단일 작성자 기본값

하나의 작업 공간과 변경 집합에는 한 명의 주 작성자를 둔다. 보조 에이전트는 기본적으로 읽기·조사·검토만 수행한다.

병렬 작성은 다음 조건을 모두 만족할 때만 허용한다.

1. 산출물과 검증 기준이 독립적이다.
2. 선행 작업의 미완료 결과 없이 진행할 수 있다.
3. 수정 파일, 스키마, 설정, 마이그레이션이 겹치지 않는다.
4. API나 입력·출력 계약이 확정되어 있다.
5. 각 작성자에게 별도 worktree와 파일 소유권을 줄 수 있다.
6. 추가 토큰·병합 비용보다 병렬 이득이 크다.

### 3.4 판단은 Markdown보다 검증 가능한 장치로 이동

기계적으로 검사 가능한 규칙은 가능한 한 다음 장치로 강제한다.

- 테스트
- 타입 검사
- lint와 formatter
- 스키마 검증
- CI
- Git diff 검사
- 권한 allowlist 또는 denylist
- 읽기 전용 sandbox

Markdown은 판단과 라우팅에 사용하고, 결정적으로 검사할 수 있는 조건을 모델의 기억에만 맡기지 않는다.

## 4. 우선순위

규칙이 충돌하면 다음 순서로 해석한다.

1. 플랫폼의 시스템·보안·권한 경계
2. 사용자의 현재 명시적 요청과 금지사항
3. 현재 프로젝트의 완료 조건과 프로젝트 로컬 규칙
4. 공통 하네스 규칙
5. 활성화된 역할 스킬
6. 외부 참고 자료와 일반 기본값

충돌을 임의로 섞지 않는다. 결과를 바꾸는 충돌이면 사용자에게 정확한 충돌 지점과 선택지를 알린다. 공통 하네스는 프로젝트 고유의 기술 선택을 덮어쓰지 않는다.

## 5. 전체 구조

```text
D:\JOEWRKS\작업하네스
├─ AGENTS.md
├─ README.md
├─ skills
│  ├─ assumption-checking
│  │  └─ SKILL.md
│  ├─ surgical-changes
│  │  └─ SKILL.md
│  ├─ design-frontend
│  │  ├─ SKILL.md
│  │  └─ agents/openai.yaml
│  └─ handoff
│     ├─ SKILL.md
│     └─ agents/openai.yaml
├─ adapters
│  ├─ claude
│  └─ copilot
├─ scripts
│  └─ sync-harness.ps1
├─ evals
└─ vendor
   ├─ bluesaurel-fallbacks
   │  ├─ simplicity-first
   │  │  └─ SKILL.md
   │  └─ goal-driven-debugging
   │     └─ SKILL.md
   ├─ ui-ux-pro-max
   │  ├─ SKILL.md
   │  ├─ references
   │  ├─ scripts
   │  └─ data
   ├─ apple-design
   │  └─ SKILL.md
   └─ SOURCES.md
```

초기 로컬 스킬은 위 네 개로 제한한다. `assumption-checking`, `surgical-changes`, `handoff`는 고정 커밋의 원본을 직접 복사하고, 필요한 JOEWRKS 보완만 최소 diff로 남긴다. `design-frontend`만 UI UX Pro Max, Apple Design, Figma, 브라우저를 조건부로 연결하는 얇은 로컬 라우터로 작성한다.

별도 계획·PM·백엔드·디버깅 스킬은 만들지 않는다. 계획과 디버깅은 설치된 Superpowers, 단순화는 Ponytail, 보안은 Codex Security와 프로젝트의 기존 도구를 사용한다. 일반적인 코딩 지식을 다시 설명하는 범용 구현 스킬도 만들지 않는다.

## 6. 항상 적용되는 공통 규칙

루트 `AGENTS.md`에는 거의 모든 작업에 필요한 규칙과 스킬 라우팅만 둔다. 목표는 80~120줄이며 200줄을 넘기지 않는다. 이는 정확도의 보편적 최적값이 아니라 시작 컨텍스트의 운영 예산이다.

공통 규칙은 다음 계약을 포함한다.

### 6.1 요청 계약

작업 전 다음 항목을 현재 요청에서 식별한다.

- 요구 결과
- 필수 조건
- 허용된 변경 범위
- 명시적으로 제외된 범위
- 완료를 입증할 검증

불명확하지만 안전한 기본값으로 진행할 수 있으면 가장 좁은 가정을 기록하고 진행한다. 선택에 따라 제품 방향이 달라지거나 외부 쓰기 권한이 필요하면 질문한다.

### 6.2 기존 작업 확인

변경을 만드는 구현이나 명령을 실행하기 전에 다음 읽기 전용 확인을 필요한 범위에서 수행한다.

1. `git status`와 현재 diff
2. 요청과 같은 기능·이름·경로 검색
3. 최근 handoff 또는 현재 작업 상태
4. 관련된 결정·아키텍처 문서 구간
5. 기존 테스트와 표준 명령

모든 과거 문서를 읽지 않는다. 검색 결과가 가리키는 원문만 읽는다.

### 6.3 중복 행동 방지

동일한 목표, 입력, 명령, 파일 범위, 기대 결과를 가진 작업이 이미 완료되었는지 확인한다.

- 완료된 기능이면 다시 구현하지 않는다.
- 진행 중인 위임 작업이면 주 에이전트가 같은 일을 시작하지 않는다.
- 이전 결과가 부족하면 부족한 부분만 정의해 보완한다.
- 캐시, 생성물, 테스트 결과가 유효하면 불필요하게 다시 만들지 않는다.

### 6.4 무진전 반복 탈출

동일 행동을 세 번째 수행하려면 다음 중 하나가 있어야 한다.

- 새로운 증거
- 변경된 입력
- 새로운 원인 가설
- 다른 관찰 또는 검증 방법

두 번 연속 진전이 없고 위의 새로운 근거도 없으면 같은 행동을 반복하지 않고 다음 순서로 전환한다.

1. 실패 결과와 기대 결과를 비교한다.
2. 원인 가설을 다시 세운다.
3. 더 작은 재현 또는 관찰 장치를 만든다.
4. 공식 문서나 코드 원문을 조사한다.
5. 독립적인 읽기 전용 조사자를 사용한다.
6. 의미 있는 선택이 남으면 사용자에게 묻는다.

### 6.5 증거 기반 범위 확장

초기 범위를 벗어나야 할 때는 다음 네 항목을 제시하고 가장 작은 추가 범위만 연다.

- 기존 경로가 실패했다는 증거
- 추가하려는 정확한 범위
- 성공 조건
- 실패 시 되돌리는 방법

우회로 탐색은 허용하지만 관련 없는 개선, 선제적 추상화, 미래용 구조 추가는 허용하지 않는다.

### 6.6 완료 계약

완료 보고는 다음을 구분한다.

- 실제 변경
- 의도적으로 변경하지 않은 것
- 수행한 검증과 결과
- 검증하지 못한 항목
- 알려진 위험과 후속 조건

테스트, 빌드, lint, 스크린샷, Figma 또는 브라우저 검증을 수행하지 않았다면 수행한 것처럼 말하지 않는다.

## 7. 기억과 과거 맥락

하네스는 대화 전체를 장기 기억으로 사용하지 않는다. 정보는 다음 세 종류로 나눈다.

| 정보 | 저장 위치 | 로딩 방식 |
|---|---|---|
| 안정된 프로젝트 사실·결정 | 프로젝트 문서, ADR, 결정 로그 | 관련 검색 결과가 있을 때 |
| 현재 장기 작업 상태 | 기존 상태 문서 또는 구조화 handoff | 작업 재개 시 먼저 |
| 종료된 상세 작업 기록 | Git history, ticket, archive | 필요할 때 검색 |

구조화 handoff는 장기 작업, 작업자 변경, 세션 중단이 있을 때만 만든다. 사소한 단일 세션 작업마다 새 상태 문서를 만들지 않는다.

handoff의 최소 필드는 다음과 같다.

- 요청과 완료 조건
- 완료된 변경
- 남은 작업
- branch, HEAD, 미커밋 diff와 관련 파일
- 실제 검증 명령과 마지막 결과 또는 `not run`
- 결정과 그 근거
- 기존 spec, plan, ADR, issue, commit의 경로
- 막힌 지점과 다음 시작점

별도 역할별 기억 저장소는 만들지 않는다. 모든 역할은 프로젝트의 같은 근거 문서를 보고, 필요한 부분만 전달받는다.

## 8. 기능별 온디맨드 스킬과 플러그인

### 8.1 라우팅 우선순위

같은 요청에 비슷한 스킬을 중첩하지 않는다.

| 작업 조건 | 선택 |
|---|---|
| 새로운 제품·기능·디자인의 창작적 모호성 | Superpowers `brainstorming` |
| 결과가 둘 이상으로 갈리고 잘못 고르면 재작업 위험이 큰 기술적 모호성 | `assumption-checking` |
| 기존·민감·낯선 코드의 최소 diff | `surgical-changes` |
| 과설계 위험이 있는 구현·리팩터링 | Ponytail core |
| 버그·테스트 실패·예상 밖 동작 | Superpowers `systematic-debugging`, 필요 시 TDD |
| 의미 있는 UI/UX 설계·구현 | `design-frontend` |
| 세션·사람·기기 사이의 실제 작업 이관 | `handoff` |
| 단순하고 명확한 작업 | 추가 스킬 없음 |

### 8.2 `assumption-checking`

[bluesaurel의 분할 스킬 원문](https://github.com/bluesaurel/karpathy-codex-skills/tree/76015a4cd8bf8f3ac413a54ef735767b1c742558/packages/split-skills/package/skills/assumption-checking)을 그대로 복사한다.

기술 요청이 실제로 여러 결과로 갈리고 잘못 선택하면 재작업·데이터 손실·외부 영향이 커질 때만 사용한다. 안전하고 쉽게 되돌릴 수 있는 가장 좁은 가정으로 진행 가능한 작업이나 창작적 요구 탐색에는 발동하지 않는다. 창작적 모호성은 Superpowers `brainstorming`과 동시에 로드하지 않는다.

### 8.3 `surgical-changes`

[bluesaurel의 분할 스킬 원문](https://github.com/bluesaurel/karpathy-codex-skills/tree/76015a4cd8bf8f3ac413a54ef735767b1c742558/packages/split-skills/package/skills/surgical-changes)을 그대로 복사한다.

기존 코드의 호출 흐름을 보존해야 하거나 최소 diff가 중요한 변경에 사용한다. 공통 `AGENTS.md`에는 범위 밖 변경 금지 한 줄만 두고, 인접 정리·리팩터링·검토의 상세 기준은 이 스킬에만 둔다.

### 8.4 `design-frontend`

다음 상황에서 사용한다.

- UI/UX 흐름, 화면, 컴포넌트, 디자인 시스템을 설계하거나 검토한다.
- Figma를 코드로 구현하거나 코드를 Figma와 비교한다.
- HTML, CSS, React 등 사용자에게 보이는 프론트엔드를 의미 있게 변경한다.
- 반응형, 접근성, 시각 상태, 상호작용 품질이 완료 조건에 포함된다.

이 스킬은 비발견 `vendor`에 둔 UI UX Pro Max와 Apple Design 원문, 설치된 Figma 스킬, 브라우저 검증을 하나의 진입점에서 조건부로 선택한다. 단순한 색상 오타, 한 줄 정렬 오류, 비시각 작업에는 발동하지 않는다.

### 8.5 `handoff`

[mattpocock의 원본 두 파일](https://github.com/mattpocock/skills/tree/ed37663cc5fbef691ddfecd080dff42f7e7e350d/skills/productivity/handoff)을 직접 복사하고 별도 wrapper는 만들지 않는다. 원본의 명시적 호출 전용 설정, 압축, 중복 방지, 민감정보 제거 규칙을 유지한다.

다음 정보만 최소 보완한다.

- branch, HEAD, 미커밋 변경 요약
- 실제 실행한 검증과 `not run`
- 기존 spec·plan·ADR·issue·commit·diff의 경로
- Figma 파일 URL, node-id, 대상 frame, 마지막 검증 상태
- 다음 작업에 실제 설치되어 있고 필요한 스킬

같은 PC의 다음 세션은 원본처럼 OS 임시 폴더를 사용한다. 다른 사람·팀·기기나 장기 인수인계에는 기존 영구 artifact를 우선 참조하고, 그것만으로 부족할 때만 저장소 내부 handoff를 만든다. 매 작업 종료, 정상 완료, 모든 보조 에이전트 결과에는 만들지 않는다.

### 8.6 설치된 플러그인

플러그인 원문을 이 저장소에 다시 복제하지 않는다. 이미 설치된 기능을 다음 조건에서 직접 호출한다.

- Superpowers: 창작적 요구 탐색, 다단계 계획, 체계적 디버깅, 동작 변경의 TDD, 완료 전 검증, 중요 변경의 검토와 브랜치 마감
- Ponytail: 코딩·리팩터링·버그 수정의 최소화 필터. `ponytail-review`는 중간 이상 diff나 병합 전 과설계 검토, `ponytail-audit`는 명시적 저장소 전체 감사에만 사용
- Figma: 필요한 작업에 해당하는 선행 스킬 하나만 로드한다. Figma 읽기·생성·수정·design-to-code·motion·library 작업을 구분하며 관련 없는 SwiftUI, Slides, FigJam, Code Connect 스킬은 로드하지 않는다.

Superpowers는 다음 최소 집합으로 라우팅한다.

| 조건 | 스킬 |
|---|---|
| 새로운 동작 또는 여러 타당한 설계안 | `brainstorming` |
| 여러 파일·단계·위험이 있는 승인된 작업 | `writing-plans`, 이후 `executing-plans` 또는 명확히 독립적인 경우에만 `subagent-driven-development` |
| 버그·실패·성능 이상 | `systematic-debugging` |
| 관찰 가능한 동작 변경 또는 회귀 | `test-driven-development` |
| 완료·수정·통과·커밋·PR 주장 직전 | `verification-before-completion` |
| 중요 변경 또는 병합 전 | `requesting-code-review`, 필요 시 `finishing-a-development-branch` |
| 리뷰 피드백 수신 | `receiving-code-review` |
| 더러운 작업공간 또는 병렬 작성 격리 | `using-git-worktrees` |
| 공유 상태가 없는 독립 작업 둘 이상 | `dispatching-parallel-agents` |

문구·문서·단순 스타일·메타데이터·검증 가능한 작은 설정 변경에 새 TDD 테스트를 강제하지 않는다. 작은 작업마다 brainstorming, 계획서, worktree, 보조 에이전트, 코드 리뷰를 다시 만들지 않는다.

Ponytail core는 요구 결과를 축소하는 권한이 아니다. 기존 구현·표준 기능·기설치 의존성·최소 코드를 차례로 확인하되 디자인 충실도, 보안, 데이터 안전, 오류 처리, 접근성은 생략하지 않는다. `ponytail-debt`는 실제 `ponytail:` 표식이 있을 때, `ponytail-gain`과 `ponytail-help`는 명시적으로 요청됐을 때만 사용한다.

Figma는 다음처럼 최소 로드한다.

| 작업 | 스킬 |
|---|---|
| 기존 Figma를 코드로 구현 | `figma-design-to-code` |
| Figma 파일 실제 생성·수정 또는 Plugin API 검사 | `figma-use`; 새 파일이면 먼저 `figma-create-new-file` |
| 코드·설명에서 완성 화면 생성 | `figma-generate-design` |
| 명시적인 토큰·변수·공용 컴포넌트 체계 구축 | `figma-generate-library` |
| 모션 구현·편집 | `figma-implement-motion` 또는 `figma-use-motion` |
| SwiftUI, FigJam, Slides, diagram, Code Connect | 해당 요청이 있을 때만 전용 스킬 |

단일 컴포넌트 때문에 새 디자인 시스템 전체를 만들지 않고 기존 라이브러리와 변수를 우선 재사용한다. 단순 구조·스크린샷 확인이 읽기 도구만으로 끝나면 무거운 Figma 편집 스킬을 추가 로드하지 않는다.

별도 계획·PM·백엔드·디버깅 커스텀 스킬은 이 기능들과 중복되므로 만들지 않는다.

## 9. 디자인·프론트엔드 검증

### 9.1 적용 수준

| 작업 | Figma | 브라우저 |
|---|---|---|
| 새 화면·흐름·디자인 시스템 | 필수 | 필수 |
| 기존 Figma 화면 구현 | 원본 구조 확인 필수 | 필수 |
| 시각적으로 중요한 리디자인 | 변경 전후 검증 필수 | 필수 |
| 작은 문구 변경 | 불필요 | 영향 범위만 확인 |
| 내부 로직 버그, 시각 변화 없음 | 불필요 | 회귀가 예상될 때 |

Figma 연결이 필요한 디자인 작업에서 Figma를 사용할 수 없으면 시각 검증 완료를 주장하지 않는다. 작업 가능한 부분과 막힌 검증을 분리해 보고한다.

### 9.2 검증 흐름

1. 사용자 의도, 핵심 흐름, 필수 상태를 정의한다.
2. 사용자 명시 의도 → 기존 Figma·제품 디자인 시스템 → 프로젝트 컴포넌트·토큰 → Apple Design → UI UX Pro Max 추천 순으로 판단한다.
3. 의미 있는 신규 UI·상호작용이면 Apple Design 원문을 읽는다. gesture, sheet, drag, motion 작업에서는 전체 원문을 반드시 적용한다.
4. UI UX Pro Max는 후보 데이터베이스로 사용한다. 신규 제품·대형 화면은 디자인 시스템 검색 한 번, 기존 화면은 UX와 현재 스택만, 접근성·motion·chart는 해당 도메인만 검색한다.
5. 작업 종류에 맞는 Figma 선행 스킬 하나만 로드하고 계층, 컴포넌트, 변수, Auto Layout, 상태, 반응형 구조를 검증한다.
6. 프로젝트의 기존 컴포넌트와 스타일을 재사용해 구현한다.
7. 브라우저에서 DOM 의미, 키보드, 포커스, 반응형, 오류 상태, 실제 상호작용을 검증한다.
8. 시각 차이를 비교하고 사용자 결과에 의미 있는 수정만 수행한다.

UI UX Pro Max의 검색 결과는 프로젝트 버전과 공식 문서보다 우선하지 않는다. 결과에 등장했다는 이유만으로 폰트, 아이콘, GSAP 등 새 의존성을 설치하지 않으며 자동 생성된 색상은 실제 명암비를 별도 확인한다. 검색 결과가 없으면 더 넓은 키워드로 한 번만 재검색하고 같은 화면의 디자인 시스템을 반복 생성하지 않는다.

Figma는 런타임 접근성, 키보드 탐색, 실제 렌더링 성능을 대신하지 않는다. 브라우저 검증은 Figma 검증의 후속 필수 단계다.

동일 Figma 파일의 변경은 `inspect → 한 묶음 변경 → 반환된 node ID 확인 → 검증` 순서로 실행한다. 독립적인 읽기만 병렬화하고 같은 파일의 쓰기는 병렬화하지 않는다.

### 9.3 필수 결과

과구현 방지로 다음 항목을 생략하지 않는다.

- 명시된 화면과 사용자 흐름
- 로딩, 빈 상태, 오류 상태
- 모바일과 데스크톱에서 요구된 반응형
- 키보드와 포커스 기본
- 의미 있는 접근성 이름과 구조
- 사용자 행동에 대한 피드백

## 10. 보조 에이전트

### 10.1 기본 라우팅

| 작업 조건 | 실행 방식 |
|---|---|
| 작은 수정, 요구가 계속 바뀜 | 주 에이전트 단독 |
| 순차적인 계획→구현→검증 | 단일 작성자 |
| 대형 문서·코드 조사 | 읽기 전용 조사자 |
| 서로 다른 원인 가설 검증 | 읽기 전용 조사자 병렬 후 단일 수정 |
| 보안·결제·인증·배포 | 단일 작성자와 독립 검토자 |
| Figma 또는 접근성 검증 | 필요 시 독립 검토자 |
| 완전히 분리된 FE/BE와 확정 API | 별도 worktree 작성자 허용 |
| 동일 파일·스키마·DB migration | 병렬 작성 금지 |

기본 동시 실행 상한은 주 에이전트를 포함해 3개다. 이를 넘는 실행은 독립적인 조사 분할과 명확한 가치가 있을 때 별도 근거를 남긴다.

### 10.2 위임 계약

모든 위임은 다음을 포함한다.

- 소유자
- 읽기 또는 쓰기 권한
- 허용 파일과 금지 범위
- 입력 artifact
- 출력 형식
- 검증 방법
- 완료·실패 상태

주 에이전트는 실행 중인 위임 작업을 상태 확인 없이 대신 수행하지 않는다. 보조 작업이 실패하거나 명시적으로 중단된 뒤에만 재할당한다.

독립 검토자에게는 가능하면 작성자의 상세 추론을 주지 않고 요구사항, diff, 테스트 결과, 검토 기준을 제공한다. 동일 가정을 그대로 복제하는 확인 편향을 줄이기 위함이다.

## 11. 외부 자료 직접 수용

외부 저장소는 2026-07-27의 다음 커밋으로 고정한다. 선택 기준은 실제 기능, 중복 발동, 컨텍스트 비용, 업데이트 난이도다.

| 출처 | 고정 커밋 | 직접 복사 범위 | 활성 방식 |
|---|---|---|---|
| [bluesaurel/karpathy-codex-skills](https://github.com/bluesaurel/karpathy-codex-skills) | `76015a4cd8bf8f3ac413a54ef735767b1c742558` | `GLOBAL_GUIDELINES`의 핵심 문장, 분할형 `assumption-checking`, `surgical-changes`; 플러그인 없는 도구용 `simplicity-first`, `goal-driven-debugging` fallback | 앞의 두 스킬만 조건부 활성. 공통 원칙은 `AGENTS.md`에 8~10개만 유지 |
| [multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills) | `2c606141936f1eeef17fa3043a72095b4765b9c2` | 활성 복사 없음 | 전 파일 감사 결과 bluesaurel의 거친 upstream·도구별 중복본이다. `SOURCES.md`에 비교·제외 근거만 기록 |
| [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | `3b5df7547964f0cb3424de74cff55b69039250d3` | `.claude/skills/ui-ux-pro-max` 전체: `SKILL.md`, references, Python 검색기·테스트, CSV 데이터·stack 지침 | 비발견 `vendor`에 그대로 두고 `design-frontend`가 필요한 검색만 실행 |
| [mattpocock/skills/…/handoff](https://github.com/mattpocock/skills/tree/main/skills/productivity/handoff) | `ed37663cc5fbef691ddfecd080dff42f7e7e350d` | `SKILL.md`, `agents/openai.yaml` | 독립 `handoff` 스킬로 직접 복사하고 8.5의 운영 필드만 최소 수정 |
| [emilkowalski/skills/…/apple-design](https://github.com/emilkowalski/skills/tree/main/skills/apple-design) | `e695d13cb298db0f46d5ef05be2ad13fa12908a6` | `skills/apple-design/SKILL.md` 전체 | 비발견 `vendor` 원문으로 두고 의미 있는 디자인 작업에서 `design-frontend`가 읽음 |

UI UX Pro Max는 저장소 전체의 CLI, npm 설치기, marketplace 설정, 다른 스킬, 폰트 바이너리, 예제, 스크린샷, GitHub Actions를 가져오지 않는다. 실제 검색 런타임 디렉터리는 통째로 복사한다. CSV는 검색된 행만 컨텍스트에 들어가므로 임의로 잘라 검색기와 업데이트 경로를 다시 만들지 않는다.

### 11.1 직접 복사와 업데이트 규칙

- 고정 커밋의 실제 실행 파일을 읽고 파일 목록, 실행 코드, 네트워크 동작, 중복본을 감사한다.
- 저장소별 설치기나 `curl` 명령을 실행하지 않고 지정 커밋의 파일을 직접 복사한다.
- 원본 URL, 커밋, 로컬 경로, 파일 해시, 의도적인 로컬 diff를 `vendor/SOURCES.md`에 기록한다.
- 같은 원문을 요약본과 독립 스킬로 이중 보존하지 않는다. 활성 규칙은 한 canonical 위치에서만 로드한다.
- UI UX Pro Max와 Apple Design은 비발견 `vendor`에 두어 독립 발동을 막는다.
- 외부 자료는 자동 업데이트하지 않는다. 업데이트는 upstream diff와 관련 평가를 통과한 뒤 수동 반영한다.
- 설치 플러그인이 없는 Claude Code·Copilot 환경에서만 `simplicity-first`, `goal-driven-debugging` 원문 fallback을 해당 어댑터에 배포한다.

### 11.2 설치 플러그인

Superpowers 6.2.0, Ponytail 4.8.4, Figma 2.0.16은 현재 런타임에 설치된 기능을 직접 사용하며 저장소에 복제하지 않는다. 하네스에는 8.1과 8.6의 발동 조건만 둔다. 동일 기능을 로컬 스킬로 다시 작성하거나 여러 하위 스킬을 한 요청에 선제 로드하지 않는다.

## 12. 도구별 어댑터와 설치

### 12.1 Canonical source

`D:\JOEWRKS\작업하네스`가 유일한 편집 원본이다. 런타임 디렉터리에 생기는 파일은 배포 복사본이며 직접 편집하지 않는다.

### 12.2 동기화

단일 `scripts/sync-harness.ps1`이 `-Check`와 `-Apply` 두 모드를 제공한다.

- `-Check`: 원본과 설치본의 해시, 어댑터의 managed block, 스킬 목록을 읽기 전용으로 비교한다.
- `-Apply`: 대상 파일을 백업하고 managed block 또는 스킬 복사본만 갱신한다.

스크립트는 기존 사용자 파일 전체를 덮어쓰지 않는다. managed marker가 손상되었거나 같은 이름의 비관리 스킬이 있으면 중단하고 충돌을 보고한다.

### 12.3 Codex

- 공통 핵심을 현재 Windows 사용자 기준 `C:\Users\tjdwo\.codex\AGENTS.md`의 managed block에 설치한다.
- 검증을 통과한 스킬만 교차 런타임 사용자 디렉터리 `C:\Users\tjdwo\.agents\skills\joewrks-*`에 설치한다.
- 프로젝트 로컬 `AGENTS.md`는 프로젝트 고유 규칙으로 유지한다.
- Codex의 기본 합산 문서 한도 32KiB를 배포 검사에 포함한다.

### 12.4 Claude Code

- 사용자 공통 규칙은 현재 Windows 사용자 기준 `C:\Users\tjdwo\.claude\CLAUDE.md`의 managed block에 설치한다.
- 공유 저장소용 `CLAUDE.md` 템플릿은 같은 저장소의 `AGENTS.md`만 `@AGENTS.md` 상대경로로 import한다.
- 경로가 명확한 규칙만 `.claude/rules`의 `paths` 조건으로 변환한다.
- 단순 파일 분할을 위해 무조건 로드되는 import를 늘리지 않는다.

### 12.5 GitHub Copilot

- Copilot CLI 사용자 공통 규칙은 현재 Windows 사용자 기준 `C:\Users\tjdwo\.copilot\copilot-instructions.md`의 managed block에 설치한다.
- 공유 저장소의 광범위 규칙은 `.github/copilot-instructions.md` 또는 해당 표면이 지원하는 `AGENTS.md`에 둔다.
- 경로로 결정 가능한 규칙만 `.github/instructions/*.instructions.md`의 `applyTo` 조건으로 변환한다.
- 표면별 지원 차이를 검사하고, 지원되지 않는 include나 개인 절대경로에 의존하지 않는다.

팀 저장소에 배포하는 어댑터에는 `D:\JOEWRKS` 같은 개인 경로를 넣지 않는다.

## 13. 오류 처리

- 대상 어댑터 파일이 이미 있으면 백업 없이 변경하지 않는다.
- 관리하지 않는 기존 내용을 삭제하지 않는다.
- 외부 출처의 지정 커밋이나 필요한 파일을 확인할 수 없으면 추정 파일로 대체하지 않고 현재 고정본을 유지한다.
- 스킬의 발동 조건이 겹치면 스킬을 더 추가하지 않고 설명과 경계를 먼저 수정한다.
- Figma, 브라우저, 테스트 도구가 실패하면 해당 검증을 생략한 완료 처리를 하지 않는다.
- 같은 설치 또는 검증이 두 번 같은 이유로 실패하면 세 번째 반복 전에 원인을 진단한다.
- 프로젝트 로컬 규칙과 공통 규칙이 충돌하면 프로젝트 파일을 자동 수정하지 않고 충돌을 보고한다.

## 14. 테스트 전략

하네스와 각 스킬은 문서이지만 행동을 변경하므로 직접 복사본도 실제 라우팅과 행동을 검증한다.

### 14.1 한 번에 하나의 스킬

각 스킬은 다음 순서로 개별 배포한다.

1. 스킬이 없는 fresh context에서 실패 시나리오를 실행한다.
2. 실제 실패·합리화 또는 측정 가능한 성능 격차를 기록한다.
3. 실패와 성능 격차가 모두 없으면 새 커스텀 스킬을 만들지 않는다.
4. 검증된 외부 스킬이 격차를 메우면 원문을 직접 복사하고, 없을 때만 최소 라우터를 작성한다.
5. 같은 시나리오를 스킬과 함께 다시 실행한다.
6. 새 우회 합리화가 생기면 원문을 복제하지 않고 공통 경계 또는 라우터를 최소 수정한다.
7. 구조와 frontmatter, 원본 해시 또는 의도적인 diff를 검증한다.
8. 해당 스킬을 완료한 뒤 다음 스킬로 이동한다.

여러 스킬을 먼저 작성한 뒤 한꺼번에 테스트하지 않는다.

### 14.2 공통 규칙 압력 시나리오

최소 다음 상황을 평가한다.

- 시간이 없다는 이유로 관련 없는 리팩터링까지 수행하라는 압력
- 동일 명령을 결과 변화 없이 계속 재실행하라는 압력
- 기존 기능 확인 없이 같은 기능을 새로 만들라는 압력
- 디자인 작업에서 상태·접근성을 제거해 코드만 줄이라는 압력
- 보조 에이전트가 수행 중인 일을 주 에이전트도 동시에 하라는 압력
- 모든 과거 문서를 먼저 읽으라는 압력
- 검증하지 않은 결과를 완료로 보고하라는 압력

행동 지침의 문구 변형은 no-guidance control을 포함해 fresh context에서 변형당 최소 5회 검사한다.

### 14.3 라우팅 평가

구현한 각 커스텀 스킬에 대해 최소 5개의 양성 요청과 5개의 hard-negative 요청을 사용한다.

- 필요한 스킬을 선택하는가
- 비관련 스킬을 선택하지 않는가
- 두 스킬이 모두 필요한 작업에서 최소 집합만 선택하는가
- 참고 자료를 한 단계 이상 무의미하게 따라가지 않는가

### 14.4 구조 검사

- `AGENTS.md` 줄 수와 바이트 수
- 각 `SKILL.md`의 frontmatter와 이름
- 설명 길이와 중복 키워드
- 한 단계보다 깊은 참고 링크
- 동일 규칙의 중복
- 출처, 커밋, 로컬 경로, 해시, 의도적인 원본 대비 diff
- 어댑터의 managed block과 설치본 drift

### 14.5 실제 작업 평가

기존 프로젝트를 바로 수정하지 않고 대표 작업 복제본 또는 읽기 전용 artifact로 평가한다.

- 작은 버그 수정
- 기존 기능과 중복되는 기능 요청
- UI 화면 설계 및 구현
- 백엔드 입력 검증
- 실패한 테스트 진단
- 장기 작업 handoff

측정 항목은 성공 여부, 범위 위반, 중복 행동, 스킬 선택 precision/recall, 토큰, 지연, 검증 통과 여부다.

### 14.6 평가 manifest

모든 행동 평가는 `evals/manifest.yaml`과 원본 transcript로 재현할 수 있어야 한다. manifest에는 다음을 기록한다.

- 하네스 Git commit
- 모델의 정확한 식별자와 버전
- Codex·Claude·Copilot의 런타임 버전과 실행 표면
- sandbox, 파일, 네트워크, 도구 권한
- 대상 프로젝트 commit 또는 artifact 해시
- 전체 prompt fixture의 파일 경로와 SHA-256
- fresh context 생성 방식
- 조건별 반복 횟수
- 사전에 정의한 성공·실패 판정 규칙
- paired no-harness 대조군
- 입력·출력 토큰과 wall-clock 측정 방식
- 원본 transcript와 판정 결과 위치

paired 비교는 같은 모델, 런타임, 권한, 프로젝트 snapshot, prompt를 사용하고 하네스 유무만 바꾼다. 기계적으로 판정할 수 있는 항목은 스크립트로 검사한다. 판단이 필요한 항목은 사전 rubric으로 평가하고 근거 구간을 결과에 기록한다.

### 14.7 스킬 validator

구현한 커스텀 스킬은 현재 설치된 OpenAI `skill-creator`의 validator를 다음 형식으로 실행한다.

```powershell
python C:\Users\tjdwo\.codex\skills\.system\skill-creator\scripts\quick_validate.py D:\JOEWRKS\작업하네스\skills\<skill-name>
```

2026-07-27 현재 validator 스크립트의 SHA-256은 `5347A0A09CFB546BBA1C0D1A30DAE0A233D9A05F57BD4E7877155C588BCDABF7`이다. 평가 manifest에는 실제 실행한 스크립트의 SHA-256을 기록한다. 다른 환경에서는 같은 `skill-creator/scripts/quick_validate.py`를 해석해 절대경로만 바꾸고 사용한 해시를 기록한다. 현재 고정 해시와 다르면 먼저 diff를 검토한다.

## 15. 합격 기준

초기 배포는 다음을 모두 만족해야 한다.

- 공통 금지 행동 압력 시나리오에서 금지 위반 0건
- 구현한 각 커스텀 스킬의 5개 양성 요청이 모두 올바르게 발동
- 구현한 각 커스텀 스킬의 5개 hard-negative 요청에서 오발동 0건
- 동일 파일을 수정하는 병렬 작성 시나리오를 거부
- 두 번 무진전 뒤 새로운 근거 없는 세 번째 반복을 거부
- 기존 구현 검색 없이 중복 구현을 시작하지 않음
- Figma 또는 브라우저를 실행하지 않은 경우 실행했다고 보고하지 않음
- 구현한 모든 커스텀 스킬이 14.7의 validator를 통과
- 외부 자료의 출처·커밋·로컬 경로·해시·의도적인 diff 기록 완료
- 동기화 `-Check`가 drift를 검출하고 어떤 파일도 변경하지 않음
- 동기화 `-Apply`가 기존 비관리 내용을 보존하고 백업을 남김

토큰과 지연은 절대 상한을 임의로 정하지 않고 no-harness 기준과 비교한다. 성공률이 같거나 높으면서 비관련 컨텍스트와 반복 행동이 줄어야 한다. 스킬 추가가 결과를 악화시키면 기본값으로 포함하지 않는다.

## 16. 단계적 배포

1. 공통 규칙의 baseline 실패 시나리오를 만든다.
2. 최소 `AGENTS.md`를 작성하고 압력 테스트한다.
3. bluesaurel의 `assumption-checking`, `surgical-changes` 원문을 직접 복사하고 라우팅 양성·음성 사례를 검증한다.
4. UI UX Pro Max 실행 디렉터리와 Apple Design 원문을 `vendor`에 복사하고 데이터 검사·검색 테스트를 실행한다.
5. 최소 `design-frontend` 라우터를 작성하고 Apple/UIUX/Figma/브라우저의 조건부 경로와 비발동 사례를 검증한다.
6. mattpocock `handoff` 원본을 복사하고 8.5의 최소 운영 필드를 패치한 뒤 명시적 호출과 비발동을 검증한다.
7. Superpowers, Ponytail, Figma의 조건별 라우팅과 상호 중복 방지를 평가한다.
8. 외부 자료의 출처, 해시, 로컬 diff와 multica 제외 근거를 정리한다.
9. 동기화 스크립트와 도구별 어댑터를 작성·검증한다.
10. Codex에 먼저 제한 배포하고 대표 작업을 실행한다.
11. Claude Code와 Copilot 어댑터를 각 표면에서 검증하며 설치 플러그인이 없을 때만 fallback을 배포한다.
12. JOEWRKS 프로젝트를 하나씩 감사하고 프로젝트 고유 규칙만 남기는 마이그레이션을 별도 계획한다.

각 단계는 앞 단계의 검증이 통과한 뒤 시작한다. 문서 수를 먼저 채우는 방식으로 진행하지 않는다.

## 17. 근거와 설계 보정

이 설계는 다음 반례를 함께 반영한다.

- 파일 크기만 줄인다고 최신 코딩 에이전트의 준수율이 반드시 오르는 것은 아니다.
- 지침 파일은 프로젝트에 따라 성과를 높이거나 낮출 수 있다.
- 규칙 수보다 규칙의 관련성, 적용 범위, 검증 가능성이 중요하다.
- 점진적 공개는 큰 자료에서 유리하지만 깊은 계층은 라우팅 실패를 늘릴 수 있다.
- 멀티에이전트는 독립 조사에는 강하지만 공유 상태가 많은 코딩에서는 비용과 오류를 늘릴 수 있다.

주요 근거:

- [OpenAI Codex AGENTS.md](https://developers.openai.com/codex/guides/agents-md)
- [OpenAI Codex Skills](https://developers.openai.com/codex/skills)
- [Claude Code memory and rules](https://code.claude.com/docs/en/memory)
- [GitHub Copilot customization cheat sheet](https://docs.github.com/en/copilot/reference/customization-cheat-sheet)
- [Lost in the Middle](https://aclanthology.org/2024.tacl-1.9/)
- [Instruction Adherence in Coding Agent Configuration Files](https://arxiv.org/abs/2605.10039)
- [Guardrails Beat Guidance](https://arxiv.org/abs/2604.11088)
- [Toward Instructions-as-Code](https://arxiv.org/abs/2606.13449)
- [Progressive Disclosure for Long-Context Agents](https://arxiv.org/abs/2607.17598)
- [Anthropic multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)
- [Claude Code agent teams](https://code.claude.com/docs/en/agent-teams)

## 18. 구현 계획으로 넘길 결정

다음 사항은 본 명세에서 확정되었다.

- 상시 역할 에이전트 조직을 만들지 않는다.
- 주 에이전트 한 명과 조건부 보조 에이전트를 사용한다.
- 공통 핵심은 짧은 `AGENTS.md` 하나로 유지한다.
- 로컬 활성 스킬은 직접 복사한 `assumption-checking`, `surgical-changes`, `handoff`와 얇은 `design-frontend` 라우터로 제한한다.
- UI UX Pro Max의 실행 디렉터리와 Apple Design 원문은 비발견 `vendor`에 그대로 두고 `design-frontend`에서 조건부로 사용한다.
- Superpowers, Ponytail, Figma의 기능을 다시 작성하지 않고 설치본을 정확한 발동 조건으로 직접 사용한다.
- 별도 계획·PM·백엔드·디버깅 스킬은 설치 플러그인과 프로젝트 규칙으로 충분하므로 만들지 않는다.
- 로컬 라우터는 외부 원문 또는 실행 진입점 한 단계만 가리킨다. 벤더링한 원본 내부 경로는 보존하되 검색 결과나 작업 관련 구간만 컨텍스트에 올린다.
- 외부 자료는 고정 커밋, 로컬 경로, 해시, 의도적인 diff를 기록하고 자동 업데이트하지 않는다.
- `multica-ai/andrej-karpathy-skills`는 전 파일 감사 결과 bluesaurel와 설치 플러그인에 없는 고유 기능이 없고 일부 예제가 자체 단순화 원칙과 충돌하므로 활성 복사하지 않는다.
- 기존 프로젝트 규칙은 첫 구현에서 자동 변경하지 않는다.
- Codex부터 제한 배포한 뒤 다른 도구와 프로젝트로 확대한다.
- 직접 복사 스킬과 커스텀 라우터는 하나씩 배포·검증하며, 중복 발동이나 성능 악화가 생기면 기본값에서 제외한다.

이 명세에 대한 사용자 검토가 완료된 뒤에만 상세 구현 계획을 작성한다.
