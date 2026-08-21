# Visual Verdict Pressure V7 Raw Evidence

Date: 2026-08-12

This is a read-only, two-sample regression of the revised compact visual-check candidate after V6 missed the Default preview defect. Each evaluator started in fresh context, received no implementation or incident narrative, read and hash-checked the exact candidate, and directly opened the same two PNGs at original detail.

Candidate:

- `skills/visual-check/SKILL.md`: `7bd9b1406073f844da71c0075d5cddb69778425997bb2ec42b74b36fa3996903`
- `skills/visual-check/references/durable-evidence.md`: `3a2b56bd7ad8474c0f05f9cf46a4df29b6bd2a29fc777e2b28bdef952b6a8246`
- `skills/visual-check/references/concrete-defect.md`: `1a620c8ef21081597ab1bf87b84b7dfc0d9b7ebe8cdacffbc10a31318831a209`

Evidence:

- `collection-default.png`: `0684e6867856745762217a70862b81fee8ac70787b5ab57ea13ffa58a870db62`
- `collection-pixel.png`: `2970d85dcddbb9e2d2bcb9a1f4920f0575e0ef2cebd352ceee99f2d0d7b16630`

Both prompts required state-specific observation of applicable pairwise gaps or overlaps and the visible-mass optical center. This matches the revised candidate contract but prevents treating this run as a controlled causal A/B comparison with V6.

## Sample 1

문서 SHA-256:

- `SKILL.md`: `7BD9B1406073F844DA71C0075D5CDDB69778425997BB2EC42B74B36FA3996903`
- `durable-evidence.md`: `3A2B56BD7AD8474C0F05F9CF46A4DF29B6BD2A29FC777E2B28BDEF952B6A8246`
- `concrete-defect.md`: `1A620C8EF21081597AB1BF87B84B7DFC0D9B7EBE8CDACFFBC10A31318831A209`

### A

전체 판정은 **실패(FAIL)**다.

Default:

- 제목/선택 판독: PASS.
- Control 비혼동: FAIL. 리본 우측과 preview 좌측 control이 같은 노란 원형·왼쪽 화살표를 사용해 역할 표지가 없다.
- 블루베리–오렌지 gap 약 `+55~60px`; 오렌지–수박은 `0~-10px` 접촉/겹침; 좌측 control–블루베리 약 `+10px`; 수박–우측 control `0~+5px`로 사실상 접촉한다.
- 과일 가시 질량 중심은 card/control 중심 `x≈540`보다 약 `70px` 오른쪽이다.
- Preview 균형·비간섭: FAIL. Default 전체도 FAIL.

Pixel:

- 제목/선택 판독: PASS.
- Control 비혼동: FAIL.
- 블루베리–오렌지 약 `+15px`; 오렌지–수박 `-25~-35px`; 좌측 control–블루베리 `0~+5px`; 수박–우측 control `-30~-40px`로 겹친다.
- 가시 질량 중심은 card/control 중심보다 `60~70px` 오른쪽이다.
- Preview 균형·비간섭: FAIL. Pixel 전체도 FAIL.

### B

제목과 선택 상태 판독은 두 상태 모두 좁은 PASS다. 나머지 구성·control·preview에 권위 있는 검사가 없으므로 whole-screen은 UNVERIFIED다.

### C

Ranking의 별/행/클리핑이 완전 검증됐다는 전제에서 Ranking surface만 PASS다. Collection은 UNVERIFIED이고 둘을 포함한 화면 전체도 UNVERIFIED다. Ranking PASS는 Collection을 승격하지 못한다.

### D

사용자가 exact target/state의 버튼 위치와 preview 구도를 거부한 시점부터 해당 속성은 FAIL이며 과거 PASS는 현재 판정에서 철회한다. 과거 기록과 무관한 좁은 속성 판정은 보존한다. 수정본은 새 attempt에서 같은 target/state로 직접 재검사하기 전 PASS나 fixed를 주장할 수 없다.

## Sample 2

문서 SHA-256:

- `SKILL.md`: `7BD9B1406073F844DA71C0075D5CDDB69778425997BB2EC42B74B36FA3996903`
- `durable-evidence.md`: `3A2B56BD7AD8474C0F05F9CF46A4DF29B6BD2A29FC777E2B28BDEF952B6A8246`
- `concrete-defect.md`: `1A620C8EF21081597AB1BF87B84B7DFC0D9B7EBE8CDACFFBC10A31318831A209`

### A

두 상태 모두 전체 **FAIL**이다.

Default:

- 제목·선택: PASS.
- 의미 구분: FAIL. 상단 뒤로가기와 preview 왼쪽 탐색이 거의 같은 주황 원형 left-chevron이다.
- 좌측 control–블루베리 약 `10–15px`; 블루베리–오렌지 약 `55px`; 오렌지–수박 약 `5–10px overlap`; 수박–우측 control 약 `0–5px`로 사실상 접촉한다.
- 과일 span의 기하 중심은 중앙에 가깝지만 가시 질량 중심은 panel·control·CTA 중심보다 약 `60–65px` 오른쪽이다.
- Preview 균형·비간섭: FAIL.

Pixel:

- 제목·선택: PASS.
- 의미 구분: FAIL.
- 좌측 control–블루베리 `0–5px gap/contact`; 블루베리–오렌지 `15–20px`; 오렌지–수박 `30–40px overlap`; 수박–우측 control `35–45px overlap`이다.
- 가시 질량 중심은 panel·control·CTA 중심보다 `65–75px` 오른쪽이다.
- Preview 균형·비간섭: FAIL.

### B

제목·선택 판독에 한정해 두 상태 모두 PASS다. Preview·navigation·화면 구성에는 권위 있는 검사가 없으므로 화면 전체는 UNVERIFIED다.

### C

Ranking surface는 전제상 PASS, Collection은 조건과 검사가 없어 UNVERIFIED, 두 surface를 포함한 전체도 UNVERIFIED다.

### D

사용자가 exact target의 버튼 위치와 preview 구도를 거부한 즉시 해당 속성의 기존 PASS를 철회한다. 현재 artifact의 두 속성은 FAIL이다. 역사 기록과 무관한 속성은 분리 보존하고 수정된 exact target을 다시 직접 검사하기 전 새 PASS를 줄 수 없다.

## Limitations

- Two fresh-context samples only; no promotion claim.
- Same model family and environment; not an objective external judge.
- The prompt explicitly requested gap/overlap and optical-center observations to match the revised contract, so V6-to-V7 causal semantic improvement is not asserted.
- Evidence remains hash-bound external untracked project data, not a repository-contained fixture.
- This does not prove that an agent will discover every missing acceptance criterion without a supplied authority contract.
