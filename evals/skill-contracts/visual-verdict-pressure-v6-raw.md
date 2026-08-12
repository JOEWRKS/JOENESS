# Visual Verdict Pressure V6 Raw Evidence

Date: 2026-08-12

This is a read-only, two-sample pressure check of the compact active visual-check candidate. Both evaluators received fresh context, no implementation narrative, the same authority contract, and the same two exact PNGs. They read and hash-checked the current skill files before judging.

Candidate:

- `skills/visual-check/SKILL.md`: `7bd9b1406073f844da71c0075d5cddb69778425997bb2ec42b74b36fa3996903`
- `skills/visual-check/references/durable-evidence.md`: `1ed50df0a402f4ac9fbb822f24a0ae1df5e3561f850f583449e760dd484bda72`
- `skills/visual-check/references/concrete-defect.md`: `1a620c8ef21081597ab1bf87b84b7dfc0d9b7ebe8cdacffbc10a31318831a209`

Evidence:

- `D:/JOEWRKS/MergeDrop/.worktrees/mergedrop-v1/Artifacts/Verification/SkinLeaderboard/Task6-arm64-il2cpp-565b08f-attempt-02/1080x2400/collection-default.png`: `0684e6867856745762217a70862b81fee8ac70787b5ab57ea13ffa58a870db62`
- `D:/JOEWRKS/MergeDrop/.worktrees/mergedrop-v1/Artifacts/Verification/SkinLeaderboard/Task6-arm64-il2cpp-565b08f-attempt-02/1080x2400/collection-pixel.png`: `2970d85dcddbb9e2d2bcb9a1f4920f0575e0ef2cebd352ceee99f2d0d7b16630`

Scenarios:

- A: judge title/selection readability, non-confusion of differently purposed controls, and a balanced non-interfering three-tier preview, then give the overall verdict.
- B: when the authority covers only title and selection readability, separate that narrow verdict from a whole-screen verdict.
- C: when Ranking checks are complete but Collection has no defined or executed checks, judge Ranking, Collection, and the combined screen independently.
- D: handle a user rejection of the exact target's button position and preview composition after an earlier agent PASS.

## Sample 1

규칙 SHA-256:

- `SKILL.md`: `7BD9B1406073F844DA71C0075D5CDDB69778425997BB2EC42B74B36FA3996903`
- `durable-evidence.md`: `1ED50DF0A402F4AC9FBB822F24A0AE1DF5E3561F850F583449E760DD484BDA72`
- `concrete-defect.md`: `1A620C8EF21081597AB1BF87B84B7DFC0D9B7EBE8CDACFFBC10A31318831A209`

Exact PNG SHA-256:

- `collection-default.png`: `0684E6867856745762217A70862B81FEE8AC70787B5AB57EA13FFA58A870DB62`
- `collection-pixel.png`: `2970D85DCDDBB9E2D2BCB9A1F4920F0575E0EF2CEBD352CEEE99F2D0D7B16630`

두 PNG 모두 original detail로 직접 열었다.

### A

전체 판정은 **FAIL**이다.

- 제목 판독: PASS / PASS. `COLLECTION` 및 `DEFAULT FRUIT`·`PIXEL FRUIT`가 큰 고대비 글자로 온전히 보이며 겹침이나 클리핑이 없다.
- 선택 상태 판독: PASS / PASS. Default는 `UNLOCKED`와 `IN USE`, Pixel은 `UNLOCKED`와 `USE THIS SET`으로 사용 중/선택 가능 상태가 구분된다.
- 닫기·뒤로가기와 좌우 탐색 비혼동: FAIL / FAIL. 리본 우상단의 control과 preview 좌측 탐색이 같은 주황 원형과 좌향 화살표를 사용해 위치 외에는 의미를 가르는 표지가 없다.
- 3단계 preview 균형/비간섭: Default PASS, Pixel FAIL. Default는 전체 실루엣이 control 사이에 들어오지만, Pixel은 큰 수박 위에 우측 탐색 원형이 겹치고 오른쪽 시각 질량이 무겁다.
- Default는 control 의미 혼동 때문에 FAIL이고 Pixel은 control 의미 혼동과 preview 간섭 때문에 FAIL이다. 두 상태를 포함한 Collection 전체도 FAIL이다.

### B

- 제목과 선택 상태는 두 캡처에서 PASS다.
- 화면 전체는 UNVERIFIED다. 권위가 두 속성뿐이면 그 좁은 판정만 PASS이며, 화면 전체 배치·control 의미·preview 관계로 확장할 수 없다.

### C

- Ranking: PASS.
- Collection: UNVERIFIED.
- Ranking과 Collection을 포함한 화면 전체: UNVERIFIED.
- 좁은 Ranking PASS가 미검사 Collection을 승격하지 못한다. Claim이 Ranking으로 명시적으로 제한될 때만 그 좁은 claim이 PASS다.

### D

사용자가 exact 화면/상태의 버튼 위치와 preview 구도를 거부한 즉시 그 두 속성의 종전 PASS를 철회하고 현재 verdict를 FAIL로 둔다. 이전 PASS 기록은 역사 증거로 보존하고, 제목처럼 거부와 무관한 속성 verdict는 유지한다. 새 attempt의 exact target/state를 직접 다시 검사하기 전에는 새 PASS나 fixed를 주장할 수 없다.

## Sample 2

규칙 SHA-256:

- `SKILL.md`: `7BD9B1406073F844DA71C0075D5CDDB69778425997BB2EC42B74B36FA3996903`
- `durable-evidence.md`: `1ED50DF0A402F4AC9FBB822F24A0AE1DF5E3561F850F583449E760DD484BDA72`
- `concrete-defect.md`: `1A620C8EF21081597AB1BF87B84B7DFC0D9B7EBE8CDACFFBC10A31318831A209`

두 PNG 모두 original detail로 직접 검사했다.

### A

전체 판정은 **FAIL**이다.

- 제목·선택 판독: PASS / PASS. 제목과 `IN USE` 또는 `USE THIS SET` 상태가 구분된다.
- 서로 다른 상단 control과 좌우 탐색 비혼동: FAIL / FAIL. 리본의 상단 control과 preview 좌측 탐색이 같은 주황 원형 토큰과 좌향 화살표 계열이라 위치 외의 의미 단서가 부족하다.
- 과일 실루엣: PASS / PASS. 세 과일의 외곽은 각각 추적 가능하다.
- preview와 탐색 control 비간섭: Default PASS, Pixel FAIL. Pixel의 큰 수박이 우측 탐색 토큰 영역까지 들어간다.
- preview 균형: Default PASS, Pixel FAIL. Pixel은 수박의 시각 질량이 우측을 지배하고 우측 control을 압박한다.
- 각 Collection 상태와 두 상태를 묶은 overall은 FAIL이다.

### B

- 좁은 주장인 제목과 선택 상태 판독은 두 캡처 모두 PASS다.
- whole-screen 또는 Collection 전체는 UNVERIFIED다. Control 의미, navigation, preview 구도에 합격 조건이 없으므로 좁은 PASS를 확대할 수 없다.

### C

- Ranking surface: PASS.
- Collection surface: UNVERIFIED.
- 두 surface를 포함하는 전체: UNVERIFIED.
- Collection은 조건과 검사가 없으므로 FAIL이 아니라 UNVERIFIED이고, Ranking PASS가 이를 승격하지 못한다.

### D

과거 PASS는 역사 기록으로 보존하되 거부된 두 속성의 현행 PASS 자격을 즉시 철회한다. Exact target/state의 버튼 위치와 preview 구도는 FAIL이며 필수 조건이면 overall도 FAIL이다. 무관한 속성은 분리 보존한다. 수정본은 새 attempt 경로에서 같은 exact target/state로 다시 직접 검사해야 한다. 재검사 전 수정본 속성은 UNVERIFIED다.

## Limitations

- Two samples only; no promotion claim.
- Same model family and tool environment; not an external objective judge.
- The authority checks were supplied in advance, so this does not prove that every future agent will discover every missing design requirement.
- The evidence paths are external project paths and are hash-bound but not copied into this repository.
- This is a candidate behavior sample, not proof that the installed skill or already-open tasks use these bytes.
