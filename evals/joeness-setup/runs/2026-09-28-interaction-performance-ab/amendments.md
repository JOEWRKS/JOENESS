# Runtime preflight correction

The first attempted `collection-swipe-r1-bare` invocation used the system
`codex-cli 0.146.0` and was rejected before any command or completed model turn:
HTTP 400, `gpt-6-astra` requires a newer Codex version. Its original result
record is retained under `runtime-preflight-failures/`; it reports no usage,
response, or file changes, and confirms the temporary login copy was removed.

The already installed app-bundled `codex-cli 0.158.0-alpha.2` was found at
`C:/Users/tjdwo/AppData/Local/OpenAI/Codex/bin/d23520d1e41bfb24/codex.exe`.
The preregistered case order, prompts, arms, and hidden oracles are unchanged.
Only the runtime path/version was corrected before the first valid model run.

## UI oracle correction after first completed agent run

The first hidden score for `collection-swipe-r1-bare` was invalid. Its synthetic
`PointerEventData` omitted `pressPosition`, although Unity supplies that value
for a real drag. The Bare agent used that valid starting position and therefore
failed this incomplete fixture (`Expected: Pixel; But was: Default`). The
original grade JSON and Unity XML/logs are preserved under
`invalid-oracle-grades/`, not counted as coding failure.

The oracle was changed only to set `pressPosition = start`; the agent prompt,
code, response, and runtime were not changed or rerun. Its source SHA-256 moved
from `ce65fe6f8021ab7453e3550d7d18930b9c3cdcf3d9e863b1fc793315edf31df9`
to `565495eb1d7d0356b353527612fbbe24f889e706b4d51d97e5f0f0c8ac646ca8`.
The corrected fixture again fails on the broken parent, passes on the
historical fix, and passes on an alternative valid implementation. Future arms
and the completed first Bare arm are scored with exactly these corrected bytes.

## PlayMode grader status-only drift

The first `restart-danger-r1-joeness` grading attempt ran both suites: hidden
PlayMode `2/2` and full EditMode `27/27`. The grader nevertheless stopped
because Unity touched `game/ProjectSettings/ProjectSettings.asset`, causing
`git status` to mark it modified although `git diff` showed no content change.
The original XML/logs are preserved under external `infrastructure-retries/`.
The agent was not rerun. The grader now requires exact pre/post content diff
and untracked-file equality, while recording status-only drift separately;
its scoring tests cover both drift and real changes. The same agent result is
regraded under this corrected infrastructure rule.

The same infrastructure warning recurred during `restart-danger-r1-bare`:
hidden PlayMode `2/2` and full EditMode `27/27` completed, but its grade was
stopped. Investigation found the grader had concatenated Git stderr warnings
into the captured diff string. Unity rewrote the file timestamp/line endings
without changing normalized Git content; after that, Git emitted an LF/CRLF
warning, making equal diffs appear different. The process runner now stores
stdout and stderr separately; a focused test proves warnings cannot change
the compared diff. This Bare agent was not rerun, and the initial grade
XML/logs remain under external `infrastructure-retries/`.
