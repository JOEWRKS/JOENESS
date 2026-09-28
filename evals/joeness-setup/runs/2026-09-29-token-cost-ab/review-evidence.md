# Setup proposal token-cost A/B — 2026-09-29

## Scope

One fresh run per arm on the unchanged disposable Git fixture `D:/JOEWRKS/JOENESS-Accuracy-Bare-20260927` (`64b73dddf616456d524bebf1a88b243899991924`). Both used `codex-cli 0.158.0-alpha.2`, `gpt-6-astra` / `xhigh`, the same Korean proposal-only prompt, ephemeral sessions, and disabled plugins/apps. Both were told not to modify files; fixture Git status was clean before and after. Two temporary `CODEX_HOME` directories shared the same authentication by local hard link. Bare had no JOENESS files. The other had only the package installed by `JOENESS.ps1 -Apply` (`-Check: current`), including the Independent Judgment Core and sole `joeness-setup` skill. The study changed neither the personal installation nor the fixture.

Prompt: “이 시험용 Git 프로젝트의 문서 역할과 기록 위치를 정리할 설정안만 제안해 주세요. 기존 파일을 확인하되, 스크립트 실행·파일 수정·설치·기록은 하지 마세요. 지금은 어느 사례도 구현하지 않습니다. 결과는 짧은 일상 언어로 핵심부터 보고해 주세요.”

The valid pair used the same CLI settings: `--disable plugins --disable apps exec --ephemeral -s danger-full-access -c approval_policy="never" -m gpt-6-astra -c model_reasoning_effort="xhigh" --json`. The disposable fixture was audited for writes after each arm. `danger-full-access` was necessary because Windows CLI policy rejected even read commands under `read-only` and `workspace-write` in the isolated homes; it is not a recommendation for ordinary work.

| Arm | CLI thread | Input tokens | Cached input (subset) | Output tokens | Total input + output | Completed file commands |
|---|---|---:|---:|---:|---:|---:|
| Bare | `01a0e934-e50d-7e32-8df8-4e38022a27ed` | 68,116 | 47,232 | 1,473 | 69,589 | 8 |
| JOENESS | `01a0e936-0231-7551-9a14-c44ae3608c42` | 77,568 | 64,896 | 2,173 | 79,741 | 12 |

Observed difference: JOENESS **+10,152 total tokens (+14.59%)**, comprising +9,452 input and +700 output tokens. Its tool outputs contained about 10,375 more characters. The JOENESS arm read the installed `SKILL.md` and made four more file commands; those observations suggest where overhead arose, but the experiment cannot assign an exact causal share to the Core, skill text, or stochastic exploration. Cached-input tokens are already included in input tokens; these raw counts are not a billing-price comparison.

## Outcome and limits

Both arms found the existing Product, task, roadmap and issue documents, recommended reusing them, kept user acceptance separate, and made no project changes. Bare gave a concise table and JOENESS gave the requested six-field summary plus a bounded `AGENTS.md` proposal. No material accuracy or safety difference was demonstrated in this case. This is one pair, not proof of general token overhead, savings, or behavioral superiority. Human readability was not rated in this run.

Invalid setup attempts are not part of the pair. An initial Bare run loaded a large unrelated plugin catalog and could not read files (126,669 input / 1,149 output tokens). Subsequent isolated `read-only` attempts still had file commands rejected; one completed at 42,057 input / 793 output tokens and another was interrupted without a usable total. A low-effort workspace-write environment probe also could not read files (26,297 input / 53 output tokens). These failures are preserved as environment/test-cost evidence, not attributed to JOENESS.

No production or personal-install files were changed for this A/B. Both temporary authentication hard links were removed and the original authentication file still exists. The temporary CLI homes still contain about 109 MB of generated caches at `C:/Users/tjdwo/.codex/eval-joeness-cost-95232d678cee436ba4ac9dd95ac091af`: the local execution policy rejected recursive shell cleanup. They are not part of the repository or the personal JOENESS installation and should be removed with the approved local cleanup mechanism when available.
