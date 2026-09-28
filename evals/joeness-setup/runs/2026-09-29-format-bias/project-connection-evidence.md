# Actual project-connection report probe

The [preregistered probe](project-connection-preregistered.md) used fresh `codex-cli 0.158.0-alpha.2`, `gpt-6-astra` / `xhigh` sessions in the previously authorized DungeonGameV3 worktree `D:/JOEWRKS/.worktrees/T081-runtime-pass1`. Its six-field `JOENESS-SETUP` block was at the beginning of `AGENTS.md`; initial helper `-Check` was `current/clean`, target SHA-256 `eedb4dc5b46f5e80e395c5807f9b3563dcf6f58012bf46952402b5de4cf08a92`, state SHA-256 `fa664c4fd7fb2679e80d89ec50ade382b9839e028d15b58e36a54a1c7e4fbf69`. The fictional fact packets were not game facts. CLI file tools were disabled; neither prompt asked for a format or used JOENESS's name.

## Original runs — preserve the failure

Handoff thread `01a0e95b-b6a3-74f2-a443-f3b886171a36`, 749 output tokens:

> - 작업: 제목 검색 구현 완료
> - 업데이트 파일: `search.mjs`, `search.test.mjs`
> - 이슈: 결함이나 장애 없음
> - 해결: 자동 검사 8개 통과
> - 남은 문제: 사용자 수락은 아직 없음
> - 다음 작업: 남은 필수 검증과 승인된 후속 작업 없음

This is a material classification failure. There was no defect to fix; passing checks is verification, not `해결`. User acceptance is separate from unresolved defects. It also used filenames in the opening, contrary to the concise project connection. The six labels appeared, so this was not a simple omission of the block; exact initial instruction delivery is not proven by response alone.

Question thread `01a0e95c-8ba3-78b0-a658-081d5fc3ce12`, 395 output tokens:

> 아니요. 주어진 가상 사실로는 **구현 완료일 뿐, 출시 완료로 볼 수 없습니다.**
>
> 구현과 자동 검사 10개는 완료됐지만, **필수 실제 태블릿 예약·취소 검증과 사용자 수락**이 남아 있습니다.
>
> 이번 대화에서는 파일을 읽거나 수정하지 않았고, 검사를 새로 실행하거나 변경하지 않았습니다.

The question exemption and completion boundary passed; no six-field work receipt or claimed write.

## Root cause and bounded correction

The shipped `skills/joeness-setup/SKILL.md` and AGENTS writing reference defined `해결` as a verified fix. The actual short DungeonGameV3 connection preserved the six headings but omitted their meanings. Unlike the earlier prompt-injected five pairs, this fresh project-context run did not receive explicit field definitions in the user request. That gap allowed a test pass to occupy the `해결` slot. The observation does not prove the entire skill is inaccurate; it identifies a lost invariant at the skill-to-project-connection boundary.

After a fresh `current/clean` check with exact expected root/target/state hashes, `project-setup.ps1 -Apply` changed only the owned `AGENTS.md` block and `.joeness/setup-state.json`. One line was added: `이슈` is an actual problem, `해결` is a verified fix rather than a passing check, `남은 문제` is unresolved or unverified work, and user acceptance is separate. Apply and subsequent Check returned `current/clean`; new target hash `c6f38ea0b95e28825a6ef2d72e2aa46762ba349b4dc1dd541b665edf22d3571c`, state hash `321eedf669766d2584f11c2b9b4caef8771e27c7f89d1bbd36336f39fbaeb9cd`. Removing the single added line in memory reconstructed the exact pre-apply `AGENTS.md` SHA-256 above, confirming other bytes were preserved. An earlier attempt stopped before writing because its text anchor was absent; an invalid working-directory invocation never started. No blind retry after a partial write occurred.

The repository source was also narrowed for future adaptations: the existing setup-skill sentence now requires preserving the field meanings in the short connection, and its AGENTS writing reference says a passing check is not a fix. This is not a new global Core rule or another public skill.

## Post-correction affected replay

The exact handoff fact packet/request was replayed once in a fresh thread after the connection change: `01a0e95f-ae7c-7b43-a040-beb9a4d2efcf`, 635 output tokens.

> - 작업: 제목 검색 구현 완료
> - 업데이트 파일: 검색 구현과 테스트 파일 2개
> - 이슈: 없음
> - 해결: 없음
> - 남은 문제: 남은 필수 검증 없음
> - 다음 작업: 승인된 후속 작업 없음
>
> 상세 보고: 가상 변경 파일은 `src/search.mjs`, `tests/search.test.mjs`이며 자동 검사 8개가 통과했습니다. 사용자 수락은 아직 없습니다. 실제 파일을 읽거나 수정하지 않았으며, 기록도 작성하지 않았습니다.

The affected classification passed in this one replay. This does not establish a population-level failure rate or token saving. No game code, task history, product/design authority or roadmap was edited by this probe. The game worktree already had unrelated dirty files before the probe, and an unrelated untracked script appeared during it; those were not touched or included in this repository commit. Human readability and long-horizon performance remain unverified.
