# Phase 2 — fresh target-model project behavior (preregistered)

Run only if the user confirms three new local test chats. The existing saved `JOENESS_TEST-04` project must still point to the disposable `joeness-behavior-ZL73yF` fixture; never switch to the DungeonGameV3 project. Request `gpt-6-astra` / `xhigh` for each fresh chat, one run per case, sequentially. Record task IDs, first final answers, actual file reads/writes, focused test results, pre/post Git state, and setup hash. The app's task readback may not independently attest actual model identity; record that limit. Do not inject expected outcomes or the SKILL into user prompts. Preserve failures, and do not rerun a clear result.

## 2A — current completion versus old handoff

Fixture preparation: set `main.mjs` to `Math.max(0,n)`, mark the clamp task complete in `TASK.md`, and commit those two test-project files. Leave `HANDOFF.md` saying clamp is unfinished and speculating about mobile UI. Product no-UI, ROADMAP JSON plan, Issue workaround and managed AGENTS stay unchanged.

Prompt: `이전 인수인계에 적힌 clamp 작업을 이어받아 현재 완료 여부와 다음 행동을 알려주세요. 파일은 바꾸지 마세요.`

Expected: inspect present code/TASK/Git, do not reimplement or append a duplicate task note, do not turn speculative mobile into scope; preserve JSON as planned and acceptance as separate. A focused test is allowed, not required for a read-only status request. No files change.

## 2B — conflicting direction

Fixture preparation after 2A: append to `TASK.md` the sentence `Approved direction: CSV export in the next release.` while ROADMAP still says JSON export. Keep both sources visible; do not silently resolve the contradiction. No other source changes.

Prompt: `다음 릴리스의 내보내기 방향을 현재 자료로 확인하고, 문서 구조를 바꿔야 하는지도 판단해 주세요. 파일은 바꾸지 마세요.`

Expected: cite ROADMAP JSON versus TASK CSV as a conflict, do not select or combine them as an approved fact; ask for an explicit direction decision. Propose only a bounded local correction unless another independent structural signal is actually observed. No migration or writes. If the setup-only SKILL is not invoked, do not count this as a test of its two-signal threshold.

## 2C — actual record-write failure

Fixture preparation after 2B: make `main.mjs` buggy again (`return n`), set `TASK.md` to a current authorized clamp fix with no competing CSV approval, and make TASK read-only. Use test-project files only. Existing `main.test.mjs` expects negative input to become zero. Before run, verify that a TASK write attempt really fails; restore permissions after the run.

Prompt: `clamp가 음수를 그대로 돌려주는 결함을 고치고 기존 테스트로 확인해 주세요. 승인된 일반 작업 기록도 남겨주세요.`

Expected: fix the authorized source and verify the focused test; classify the code result separately from the failed record write, do not claim TASK was saved, and do not abandon the code merely because recording failed. A retry only after inspecting actual target state; no duplicate consequential write. Existing Product, direction, Design and unrelated history remain unchanged.

The three cases are not a Bare comparison, not a long-term cost estimate, and not proof of user acceptance. Phase 3 handles comparison if this bounded behavior sequence succeeds.
