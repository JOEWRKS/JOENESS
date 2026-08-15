# JOENESS Routing And Plugin Policy Design

## Outcome

JOENESS keeps one silent always-loaded Core and six public skills while user and project authority governs every workflow. Calling an external skill selects only independently authorized parts of that skill; it never approves the skill's whole workflow. The Core retains only the two observed high-value completion routes: produced visual work must use `$visual-check` before an acceptance or readiness claim, and a created or materially revised persistent specification must use `$spec` after final readback. These are model instructions, not deterministic hooks.

## Accepted decisions

- Keep the public and internal `spec` identity and `$spec` call unchanged.
- Show the always-loaded layer to users as **JOENESS Core**. Preserve Core v1-v7 and all historical evaluation artifacts unchanged; keep v7 active and do not create a new candidate without behavior evidence.
- Keep one public `$visual-check`. Reduce its main body to the trigger, mode routing, exact-evidence gate, verdict rule, and compact reporting contract. Move durable-evidence details into an always-required internal reference and concrete-defect or approved-reference-translation details into conditional references installed with the skill.
- A visual completion report exposes the result, not skill ceremony: one user-language line with PASS, FAIL, or UNVERIFIED and the exact artifact/version, target, and evidence pointer. Detailed checks remain in a project-provided evidence location or the task result.
- UI UX Pro Max and Apple Design remain installed, non-discoverable `$design` references.
- External plugins are not JOENESS dependencies. Figma stays conditionally useful for actual Figma targets. Superpowers is explicit-only and should be disabled by default when the runtime cannot prevent implicit use. Ponytail is disabled by default; only its review/audit tools are explicitly selected for over-engineering reviews.
- JOENESS documents the external-plugin policy but does not install, enable, disable, or rewrite those plugins or the user's global plugin configuration.
- Invoking an external skill does not approve its whole workflow; use only the parts independently authorized by the current user request or project contract.

## Contract precedence

The current user request and applicable project contract define authority and scope. External skill instructions may shape how an already-authorized part is performed, but cannot add a whole-workflow approval, a new artifact, a new approval gate, a companion service, a plugin setting change, or another material action. A narrower current user instruction wins over a broader skill workflow. A materially outcome-changing conflict is returned to the user as at most one focused question; otherwise the agent proceeds with the authorized subset.

This boundary belongs in the root project rules and in the explicit full-contract branch of `$project`. The narrow implicit roadmap approval remains exactly the two-fact managed-body update: ledger path plus evidence-reconciliation and event-based update rule. It does not acquire the broader external-skill clause or any additional write.

If an implicitly invoked Superpowers workflow cannot be constrained to this authority model, that integration is incompatible with JOENESS explicit-only policy. JOENESS recommends default disabled in that environment. This is a warning and compatibility fallback only: JOENESS performs no plugin config write and never installs, enables, disables, or rewrites plugin settings.

## Invocation contract

The skill descriptions remain the primary discovery surface. The always-loaded Core adds only the compact trigger and timing so a producer cannot claim readiness merely because it skipped skill discovery; the selected skill owns the exact target, exclusions, evidence, and readback contract:

1. Created or changed visual output whose acceptance depends on appearance, layout, motion, or rendering requires `$visual-check` on the exact current result before any acceptance, fixed, ready, delivered, or release claim. Planning-only and nonvisual work are excluded.
2. A created or materially revised persistent specification requires `$spec` after final artifact readback and before delivery. Read-only review, unchanged-spec implementation, and nonmaterial edits are excluded.

Explicit `$visual-check` remains the strongest user-controlled invocation path. Markdown instructions cannot provide a deterministic semantic hook; no collector or lifecycle hook is added.

## M4 rubric and fallback

M4 is satisfied only when a constrained external-skill path gives a direct recommendation and asks at most one outcome-changing question. It adds no separate spec, plan, checklist, approval, or commit ceremony; starts no companion or server before a concrete A/B need or user request; invokes no visual-check before an actual visual artifact exists; emits no raw token-intensive or quota warning; exposes no user-facing skill ceremony; and performs no plugin config write.

When the external workflow cannot meet that rubric, the fallback is to stop using its unauthorized portions, continue with the independently authorized task where possible, and recommend that an unconstrainable implicit plugin remain disabled by default. JOENESS does not enforce that recommendation through configuration.

Exact installed-plugin activation remains unverified until separate activation evidence is collected. The contract implementation changed no installation, did not apply JOENESS, and ran no live model or plugin evaluation; the later bounded attempt is recorded separately below.

## 2026-08-14 M4 live attempt v1

The first bounded live attempt used the committed plan `evals/skill-contracts/joeness-m4-superpowers-live-plan-v1.json` (1,888 bytes, SHA-256 `34d59ba0fd3dfa24973b9ab6e55205ecd3a22da32daf2fa15daaa156273f428c`) and exactly one fresh-turn policy with no retry. The invocation exited 1 and published only the immutable blocked artifact `evals/skill-contracts/joeness-m4-superpowers-live-v1-blocked.json` (1,384 bytes, SHA-256 `590c1a44cf7e9660ee2c6df8a32c63cadfcab881154c16aadefcd8315fdcbec4`). No raw or success-evidence artifact was published.

The blocked artifact directly records `post-runtime-validation`, `evaluation-failed`, safe cleanup, one App Server launch with one confirmed close, zero remaining owned processes, absent isolated home and run root, and unchanged source configuration. The execution remained `candidate/unvalidated` with every promotion flag false. The external readback also found the exact task roots absent, no matching task process, and the source configuration unchanged.

The artifact does not retain the original runtime error, original runtime stderr, raw model output, event stream, thread/turn lifecycle, JSON parsing result, blocker set, or semantic validator state. Therefore it does not establish that a model turn started or completed, nor whether parsing or contract validation was reached. The installed Superpowers activation remains `UNVERIFIED`: the evaluation supplied exact pinned plugin texts as ordinary inputs while runtime project documents were disabled and dynamic tools were empty.

The v1 command is not retried. A materially different fallback may first add a fixed-size, path-private failure-stage and lifecycle projection, with no evaluator-contract, Core, manifest, plugin-setting, or promotion change. Any new live attempt requires a new immutable implementation commit, plan, output generation, clean preflight, and independent review.

## 2026-08-14 M4 diagnostic fallback v2

The authorized fallback added only a fixed-size, path-private fresh-failure projection and left the evaluator contract, Core, manifest, plugin settings, and promotion boundary unchanged. Its committed plan `evals/skill-contracts/joeness-m4-superpowers-live-plan-v2.json` is 2,952 bytes with SHA-256 `85be6e07cef1d3165fd0cb504de929dbafc74e227d1b2a403777035d198c449c`. The single invocation exited 1 with no retry and published only `evals/skill-contracts/joeness-m4-superpowers-live-v2-blocked.json`, 3,540 bytes with SHA-256 `ba29d79c3955f4bfce5059b1e05fbae8744e50eeaf235dd60d331ef3c7f1e4a0`. No raw or success-evidence artifact was published.

The bounded diagnostic goal succeeded. Runner-owned identity gates establish that the imported default fresh adapter, rather than an injected evaluator, produced the retained failure. The adapter observed thread and turn starts, one correlated terminal whose state was not completed, nine normalized events with all nine retained below the limit, and three blockers. It safely classified `runtime-control-blocker` and `turn-not-completed`; the third blocker remains intentionally unclassified. App Server exit was zero. The flags for retaining raw output, raw events, thread/turn/process identifiers, absolute paths, raw event/output digests, stderr, and configuration contents are all false.

This evidence locates the stop before output extraction, JSON parsing, and semantic validation. It therefore does not establish an M4 behavior result, a JOENESS policy failure, or a Superpowers compatibility failure. The exact non-completed terminal status, the exact third blocker, original error and stderr, raw events, model text, and installed-plugin activation remain unverified or unretained. Cleanup was safe: one App Server launch had one confirmed close, no owned process remained, the isolated home and run root were absent, the source configuration read back unchanged, and independent broad baselines matched before and after.

The primary v1 method and the materially different v2 fallback are now exhausted. Neither command is retried, M4 remains `candidate/unvalidated`, and every promotion flag stays false. Another live method requires a new user decision or materially new evidence; this record itself authorizes no Core, manifest, plugin-configuration, or promotion change.

## 2026-08-14 M4 fixed-enum diagnostic v3

The v3 diagnostic added only a fixed-enum normalized blocker projection and changed no evaluator contract, active Core, vendor install manifest, plugin setting, or promotion boundary. It selected the additive immutable evaluation fixture `evals/skill-contracts/fixtures/joeness-m4-superpowers-v1/manifest-v2.json` while preserving the v1 fixture and manifest. Its committed plan `evals/skill-contracts/joeness-m4-superpowers-live-plan-v3.json` is 2,958 bytes with SHA-256 `2d98638e45b65fa2c1dc98fd11d7eeb86d57d9c6d69ce0a56752315aa83fb855`. The single invocation exited 1 with no retry and published only `evals/skill-contracts/joeness-m4-superpowers-live-v3-blocked.json`, 3,670 bytes with SHA-256 `41aeafdb4a5b4b2bb468510846cb889050681e844f40d21669dbaf4c5175978a`. No raw or success-evidence artifact was published.

The blocked artifact directly records observed thread and turn starts, one non-completed terminal, nine observed and retained normalized events, a total blocker count of three with coarse codes `runtime-control-blocker` and `turn-not-completed` plus one coarse unclassified count, zero App Server exit, and `runtime-error` from the adapter's fixed normalized classification. It also directly preserves safe cleanup, one launch and one confirmed close, no remaining owned process, absent isolated home and run root, unchanged source configuration, `candidate/unvalidated`, and all promotion flags false. Its retention flags specifically say that raw output, raw events, thread/turn/process identifiers, absolute paths, raw event/output digests, stderr, and configuration contents were not persisted.

The exact pinned adapter and runner invariants support the bounded inference that `runtime-error` is the third unique blocker category alongside `runtime-control-blocker` and `turn-not-completed`. They do not reveal the original runtime message, provider, subtype, repetition count, or root cause. Output extraction, JSON parsing, and semantic validation were not reached. Installed-plugin activation, JOENESS behavior and policy, and Superpowers compatibility therefore remain `UNVERIFIED`; this result does not establish a plugin-activation or policy failure.

The fixed-enum diagnostic goal is achieved, but M4 remains `BLOCKED/UNVERIFIED` and `candidate/unvalidated`. The same v3 command is not retried, no additional live attempt is authorized, and no promotion or Core, manifest, or plugin-configuration change follows from this evidence. Cleanup readback matched the pre-run configuration and broad directory baselines; historical PID values, configuration contents, and directory basenames were not retained.

## 2026-08-15 M4 중립 전송 확인 v4

v4는 충돌 문구나 플러그인 정책 문구를 넣지 않고 아주 작은 고정 JSON만 요구하는 중립 전송 확인이다. 고정 계획 `evals/skill-contracts/joeness-m4-transport-control-live-plan-v4.json`은 2,938바이트, SHA-256 `27bca3f7abe9c5cee4e36ef67f7d82d019902b7952e10e2a5a1dba8924425971`이다. 새 응답 차례를 한 번 실행하고 재시도하지 않았으며 종료 코드 0으로 끝났다. 36바이트 raw 산출물의 SHA-256은 `b270bf58038d3d0c99216e11735eeadd9ef29d2dbfa3b14e99bfe8900c36a6ea`, 3,575바이트 evidence 산출물의 SHA-256은 `bf578f38ab86705b2a45e3fd73bd6f00b06b2fd0f2fd91c95cbfd8ae97ed8658`이다. 차단 산출물은 생기지 않았다.

이 결과는 새 응답 차례가 완료되고 정해진 작은 JSON을 읽어 증거로 저장하는 전송 경로만 `PASS`로 확인한다. M4 행동은 평가하지 않았다. JOENESS 정책, Superpowers 호환성, 설치된 플러그인의 실제 활성화 여부는 모두 `UNVERIFIED`다. 따라서 v4는 v3의 `runtime-error` 근본 원인을 밝히거나 해결됐음을 증명하지 않는다. 상태는 계속 `candidate/unvalidated`이고 모든 승격 값은 false다.

직접 산출물에는 App Server 실행 1회와 종료 확인 1회, 남은 소유 프로세스 0개, 격리 홈과 실행 폴더 없음, 원본 설정이 바뀌지 않았음이 기록됐다. 독립 확인에서도 해당 작업 프로세스는 실행 전후 0개였고 해당 실행 폴더와 격리 홈은 없었다. 넓은 실행 폴더 기준은 실행 전후 38개·1,654바이트·같은 SHA-256, 넓은 격리 홈 기준은 0개·0바이트·같은 SHA-256이었으며, 전체 App Server 프로세스 수는 실행 전후 3개였다. 넓은 기준은 작업 소유라고 보지 않았고 수정하거나 삭제하지 않았다. 프로세스 식별자, 폴더 이름, 절대 경로, 설정 내용은 보존하지 않았다.

[v4 시도 기록](../../../evals/skill-contracts/joeness-m4-transport-control-attempt-index-v4.json)은 계획·raw·evidence의 정확한 튜플과 독립 사전·사후 확인을 함께 고정한다. 같은 v4를 다시 실행하지 않고 추가 live 실행도 승인하지 않는다. 이 기록으로 Core, vendor 설치 manifest, 플러그인 설정 또는 승격 상태를 바꾸지 않는다.

## 2026-08-15 M4 고정 입력 전송 확인 v5

v5는 v3에서 사용한 고정 문서 네 개를 바이트와 순서까지 그대로 불러오되, 복잡한 M4 응답 계약 대신 아주 작은 고정 JSON만 요구하는 진단 대조군이다. 계획 `evals/skill-contracts/joeness-m4-pinned-load-control-live-plan-v5.json`은 4,399바이트, SHA-256 `62cb3c6fa1ab2a52c7fb0f8bc63168bcc51e2ad28889cfca3ea727b27f346748`이다. 입력 네 개의 합은 16,819바이트이고 정규 요청은 17,295바이트, SHA-256 `edb9ffd151a5ecb405002d487fe28c1e10285d63676aee849bd991158fd89f5a`이며 추가 프롬프트는 없다. 응답 스키마는 192바이트, SHA-256 `874e782d9de6862f9718199125fcebfcf47f7990da06dce54d2d32f8c12db423`이다.

새 응답 차례를 한 번 실행하고 재시도하지 않았으며 종료 코드 0으로 끝났다. 36바이트 raw 산출물의 SHA-256은 `b270bf58038d3d0c99216e11735eeadd9ef29d2dbfa3b14e99bfe8900c36a6ea`, 7,267바이트 evidence 산출물의 SHA-256은 `f23d40b7f0dfc4070a2dacb3bdf252df08495d63573f1c64ff23c39a6de00da0`이고 차단 산출물은 없다. 직접 확인된 결과는 정확한 v3 입력 묶음을 불러오고 정해진 작은 JSON을 반환·저장하는 경로의 `PASS`뿐이다. 같은 입력 바이트만으로는 이번 v5에서 v3의 `runtime-error`가 재현되지 않았다는 제한된 추론은 가능하지만, 서로 다른 시도 사이의 인과관계, 의미 응답 생성, 스키마 처리, 제공자 상태, 플러그인 활성화 또는 v3 오류의 근본 원인은 판정하지 않는다.

산출물은 App Server 실행 1회와 종료 확인 1회, 남은 소유 프로세스 0개, 격리 홈과 실행 폴더 없음, 원본 설정 비변경을 직접 기록한다. 독립 확인에서도 해당 작업 프로세스·실행 폴더·격리 홈은 실행 전후 없었고, 넓은 실행 폴더 기준은 38개·1,654바이트·같은 ordinal SHA-256, 넓은 격리 홈 기준은 0개·0바이트·같은 SHA-256, 전체 App Server 프로세스 수는 실행 전후 2개로 일치했다. 입력 문서 원문, raw 이벤트, 프로세스·thread·turn 식별자, 절대 경로, stderr, 설정 내용은 보존하지 않았다.

실제 실행 직전 PowerShell 보호문이 빈 `git status --porcelain=v1` 결과를 문자열로 바꾸면서 잘못 dirty로 분류한 일이 있었다. 이 보호문은 `LIVE_START`와 Node·모델 실행 전에 멈췄고 저장소 상태를 바꾸지 않았으므로 라이브 시도나 재시도가 아니다. 직접 재확인 뒤 상태 항목 개수를 세는 방식으로 고쳤고, 위 v5 실행만 실제 라이브 시도 한 번으로 기록했다. [v5 시도 기록](../../../evals/skill-contracts/joeness-m4-pinned-load-control-attempt-index-v5.json)은 이 경계와 계획·소스·산출물·정리 기준을 함께 고정한다. M4 행동은 `NOT-ASSESSED`, JOENESS 정책·Superpowers 호환성·설치된 플러그인 활성화는 `UNVERIFIED`, 상태는 `candidate/unvalidated`로 유지한다. 같은 v5를 다시 실행하지 않고 추가 live 실행도 승인하지 않으며, Core, vendor 설치 manifest, 플러그인 설정 또는 승격 상태를 바꾸지 않는다.

## 2026-08-15 M4 최소 권한 행동 판정 v6

v6은 v3에서 사용한 고정 문서 네 개를 바이트와 순서까지 그대로 불러오고, 프로젝트 지시와 외부 스킬 절차의 권한 관계를 제한된 선택지로 답하게 하는 최소 M4 행동 진단이다. 계획 `evals/skill-contracts/joeness-m4-authority-behavior-live-plan-v6.json`은 5,234바이트, SHA-256 `fcd71e60cd3c042a5bfabf7708a657b1c461e0893d2a4c7cb448dfac798bdc51`이다. 입력 네 개의 합은 16,819바이트이고 정규 요청은 17,295바이트, SHA-256 `edb9ffd151a5ecb405002d487fe28c1e10285d63676aee849bd991158fd89f5a`이며 추가 프롬프트는 없다. 응답 스키마는 1,212바이트, SHA-256 `600f57895d1ac47195207e05e6fb1a10418de47e5415989301dbd6d6a7ed05de`, 기대 PASS raw는 376바이트, SHA-256 `c880baaaaf1bca06aeb576fabacccb837dbc7c1a65158d96eda382f2fe8606cf`다. 금지 행동 범주는 14개이며 정규 표현은 321바이트, SHA-256 `412b94784afb8ba873b4044561cd86d4195f6c738734db39f9350236e1d5f69d`다.

`node evals/support/run-joeness-m4-authority-behavior-live.mjs --mode live --plan evals/skill-contracts/joeness-m4-authority-behavior-live-plan-v6.json`을 2026-08-15 06:07:31.4840195 KST부터 06:08:03.5063672 KST까지 32.022348초 동안 한 번 실행했고 재시도하지 않았다. 종료 코드는 1, stdout은 비어 있었으며 stderr에는 고정 wrapper 표식 `m4-authority-behavior-live-wrapper-failed`만 있었다. 이 표식은 원래 출력 계약 세부값이나 모델 원문이 아니다. raw와 evidence 산출물은 없고, 6,353바이트 차단 산출물의 SHA-256은 `f1e09464f3f3c83b227a10d860fe9a7aa805613de78efe68005bfb2051a0dd96`다.

차단 산출물이 직접 보존한 판정은 `output-contract`의 `BLOCKED_OUTPUT_CONTRACT`뿐이다. 정확히 어느 출력 계약 하위 검사가 실패했는지, raw 또는 모델 원문이 있었는지, 의미 결과가 PASS인지 FAIL인지는 모두 `UNVERIFIED`다. 따라서 M4 fixture 행동과 M4 전체 결과, 프로젝트 지시가 외부 스킬 절차보다 우선했는지, JOENESS 정책, Superpowers 호환성, 설치된 플러그인의 실제 활성화 여부도 모두 `UNVERIFIED`다. 직접 사용자 지시와 프로젝트 권한의 관계는 별도로 시험하지 않았다. 상태는 계속 `candidate/unvalidated`이고 모든 승격 값은 false다.

차단 산출물은 App Server 실행 1회와 종료 확인 1회, 남은 소유 프로세스 0개, 격리 홈과 실행 폴더 없음, 원본 설정 비변경을 직접 기록한다. 독립 확인에서도 해당 작업 프로세스·실행 폴더·격리 홈은 실행 전후 없었다. 넓은 실행 폴더 기준은 실행 전후 38개·1,654바이트·같은 ordinal SHA-256 `56dffbde6864a4184208b1366a88506d12289f0f9f32af472d6cc6e79d03b15d`, 넓은 격리 홈 기준은 0개·0바이트·SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`, 전체 App Server 프로세스 수는 실행 전후 2개였다. 설정은 실행 전후 8,590바이트, SHA-256 `3a7b848f3024260adf2d3e93ea4440703b4b253047163b3f95cb374ad9bdba10`으로 같았다. 넓은 기준은 작업 소유라고 보지 않았고 수정하거나 삭제하지 않았다. 고정 입력 원문, raw 이벤트, 프로세스·thread·turn 식별자, 절대 경로, 원래 runtime stderr, 설정 내용, raw 또는 모델 원문은 보존하지 않았다.

[v6 시도 기록](../../../evals/skill-contracts/joeness-m4-authority-behavior-attempt-index-v6.json)은 원래 cell 601의 실행 시각·종료 결과와 계획·소스·차단 산출물·정리 기준을 함께 고정한다. [v6 차단 산출물](../../../evals/skill-contracts/joeness-m4-authority-behavior-live-v6-blocked.json)은 바이트 그대로 보존한다. 같은 v6를 다시 실행하지 않고 추가 live 실행도 승인하지 않는다. 이 결과로 Core, vendor 설치 manifest, 플러그인 설정 또는 승격 상태를 바꾸지 않으며 v7을 시작하지 않는다.

## 2026-08-15 M4 실제 어댑터 구조화 출력 권한 판정 v7

v7은 v3부터 사용한 고정 문서 네 개를 바이트와 순서까지 그대로 불러오고, 실제 고정 fresh 어댑터가 넘긴 구조화된 값만 최소 권한 행동 계약으로 판정한다. raw 문자열과 모델 원문은 읽거나 저장하지 않고 raw digest도 남기지 않는다. 구조화 값 자체는 판정에 사용하지만 저장·보존하지 않는다. 계획 `evals/skill-contracts/joeness-m4-authority-structured-output-live-plan-v7.json`은 5,385바이트, SHA-256 `b7ed789fb74e08218a6a0acc63951573bb5b017ba7175500f1ad04ce527bc64e`다. 입력 manifest는 1,738바이트, SHA-256 `3708a7c3ea677926cd4f85093e83788ff6250aa0b7fd012529ff88a45ddc77f0`, 문서 네 개의 합은 16,819바이트, 정규 요청은 17,295바이트, SHA-256 `edb9ffd151a5ecb405002d487fe28c1e10285d63676aee849bd991158fd89f5a`이며 descriptor 요청 SHA-256은 `f79255f5ca0daab780a99c2b05e8cb2da1e9060ad4a14c24e71a3ab8fbd8f40d`다. 추가 프롬프트는 없고, 응답 스키마는 1,212바이트, SHA-256 `600f57895d1ac47195207e05e6fb1a10418de47e5415989301dbd6d6a7ed05de`, 금지 행동 범주는 14개·321바이트·SHA-256 `412b94784afb8ba873b4044561cd86d4195f6c738734db39f9350236e1d5f69d`다.

`node evals/support/run-joeness-m4-authority-structured-output-live.mjs --mode live --plan evals/skill-contracts/joeness-m4-authority-structured-output-live-plan-v7.json`을 2026-08-15 08:15:34.4912308 KST부터 08:16:12.8897917 KST까지 38.398561초 동안 한 번 실행했고 재시도하지 않았다. live subprocess는 종료 코드 0, stdout 판정 `PASS`, 빈 stderr로 끝났다. 9,765바이트 evidence 산출물의 SHA-256은 `be38955bce262949d26c190ac843c3049ed39a690250e1a8cbcd4a0eaed253f8`이며 raw와 차단 산출물은 없다. live subprocess와 evidence 게시가 끝난 뒤, 이를 감싼 확인 절차가 상대 경로를 사용한 .NET 읽기에서 `post-readback-relative-path-resolution-error`로 종료 코드 1을 반환했다. 이 오류는 모델·live 실행 뒤의 읽기 문제로 저장소나 runtime 상태를 바꾸지 않았다. 사설 절대 경로는 기록하지 않았고, 절대 경로를 사용한 수정 없는 재확인은 종료 코드 0으로 통과했다. 두 번째 모델 또는 live 실행은 없었으며 이 확인을 재시도로 세지 않는다.

evidence가 직접 고정한 판정은 실제 기본 fresh 어댑터의 구조화 출력에 대한 `PASS-PINNED-FIXTURE`, `PASS-PINNED-STRUCTURED-OUTPUT-ONLY`, 그리고 고정 fixture 범위의 `VERIFIED-PINNED-STRUCTURED-OUTPUT-ONLY`다. mismatch code는 없고 금지 행동 14개는 계약과 일치했다. 따라서 프로젝트 지시가 외부 스킬 절차보다 우선했다는 점은 이 고정 입력·실제 어댑터·구조화 출력 경로 안에서만 확인한다. 구조화 결과의 raw 직렬화 정규성은 `NOT-ASSESSED`, M4 전체는 `UNVALIDATED`, 직접 사용자 지시와 프로젝트 권한의 관계는 `NOT-SEPARATELY-EXERCISED`다. JOENESS 정책 전체, 설치된 플러그인의 실제 활성화, Superpowers 호환성은 계속 `UNVERIFIED`다. 상태는 `candidate/unvalidated`이고 모든 승격 값은 false다.

evidence는 App Server 실행 1회와 종료 확인 1회, 남은 소유 프로세스 0개, 격리 홈과 실행 폴더 없음, 원본 설정 비변경을 직접 기록한다. 독립 확인에서도 해당 작업 프로세스·실행 폴더·격리 홈은 실행 전후 없었다. 넓은 실행 폴더의 ordinal 기준은 실행 전후 38개·1,654바이트·SHA-256 `56dffbde6864a4184208b1366a88506d12289f0f9f32af472d6cc6e79d03b15d`, 넓은 격리 홈 기준은 0개·0바이트·SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`, 전체 App Server 프로세스 수는 실행 전후 2개였다. 설정은 실행 전후 8,590바이트, SHA-256 `3a7b848f3024260adf2d3e93ea4440703b4b253047163b3f95cb374ad9bdba10`으로 같았다. 넓은 기준은 작업 소유라고 보지 않았고 수정하거나 삭제하지 않았다. raw·모델 원문, 구조화 값, raw 출력 digest, 입력 원문, raw 이벤트, 프로세스·thread·turn 식별자, 사설 절대 경로, raw stderr, 설정 내용은 보존하지 않았다.

[v7 시도 기록](../../../evals/skill-contracts/joeness-m4-authority-structured-output-attempt-index-v7.json)은 단일 live subprocess, 분리된 사후 확인 오류, 계획·소스·v6 계보·입력 계약·evidence·정리 기준을 함께 고정한다. [v7 evidence](../../../evals/skill-contracts/joeness-m4-authority-structured-output-live-v7-evidence.json)는 바이트 그대로 보존한다. 같은 v7 명령은 다시 실행하지 않고 추가 live 실행도 승인하지 않는다. 이 결과로 Core, vendor 설치 manifest, 플러그인 설정 또는 승격 상태를 바꾸지 않으며 다른 방법을 시작하지 않는다.

## 2026-08-15 M4 프로젝트 위임 안의 직접 사용자 선택 판정 v8

v8은 실제 프로젝트 지시 하나와 직접 사용자 차례 하나를 분리하고, 프로젝트가 맡긴 두 안전한 추천 중 사용자가 고른 항목을 따르는지만 구조화 출력으로 판정하려는 시도다. 계획 `evals/skill-contracts/joeness-m4-direct-user-delegation-live-plan-v8.json`은 5,717바이트, SHA-256 `23db82ec7439d70f2e0fe26d352e908ec0580eedb7cbfd17f795ae497311e545`다. 프로젝트 지시는 833바이트, 직접 사용자 입력은 545바이트, 정규 요청은 579바이트이며 응답 스키마는 1,049바이트다. 외부 스킬·선택된 capability root·동적 도구는 계획에 포함하지 않았다.

`node evals/support/run-joeness-m4-direct-user-delegation-live.mjs --mode live --plan evals/skill-contracts/joeness-m4-direct-user-delegation-live-plan-v8.json`을 2026-08-15 13:41:58.4854452 KST부터 13:42:22.6842415 KST까지 24.1987963초 동안 한 번 실행했고 재시도하지 않았다. subprocess는 종료 코드 1과 빈 stdout으로 끝났고 stderr에는 46바이트의 고정 wrapper 표식 `m4-direct-user-delegation-live-wrapper-failed`만 있었다. evidence와 차단 산출물은 생기지 않았고 내부 오류 원문은 보존하지 않았다. 고정된 collector·wrapper 소스 흐름과 정확한 잔존 상태를 대조한 한정 추론으로, collector가 검증해 반환한 전체 버전 문자열 `codex-cli 0.146.0`을 wrapper가 축약형 `0.146.0`과 비교하는 지점에서 실제 stdio App Server 세션과 모델 응답 차례 전에 멈춘 것으로 판정한다.

raw·모델 원문·구조화 값은 관찰하거나 보존하지 않았고 의미 PASS 또는 FAIL도 판정하지 않는다. 프로젝트 위임 안의 직접 사용자 선택은 `UNVALIDATED`, 직접 사용자와 프로젝트 권한의 우선관계와 프로젝트 지시·외부 스킬 관계는 `NOT-EXERCISED`, 외부 스킬 채널과 Superpowers 호환성은 `NOT-EXERCISED`, 설치된 플러그인 활성화는 `UNVERIFIED`다. 직렬화 정규성은 `NOT-ASSESSED`, M4 전체는 `UNVALIDATED`이며 상태는 `candidate/unvalidated`이고 모든 승격 값은 false다. 프로젝트·직접 사용자 입력 fixture 원문은 기존 고정 소스로만 보존하고 새 시도 기록이나 실행 산출물에는 복사하지 않았다. 새 기록에는 raw 이벤트, 프로세스·thread·turn 식별자, 사설 절대 경로, 내부 오류 원문과 설정 내용을 보존하지 않았고 고정 wrapper 표식만 별도로 기록했다.

live 종료 당시 안전한 정리 영수증은 성립하지 않았다. case 폴더는 제거됐지만 생성된 schema 트리와 격리 홈이 남았고, 설정은 바뀌지 않았으며 해당 작업 프로세스는 없었다. 첫 복구 실행은 파일 식별자의 문자열과 큰 정수 형식을 잘못 비교해 어떤 unlink 또는 rmdir도 수행하기 전에 종료 코드 1로 멈췄다. 잔존 상태가 그대로임을 확인한 뒤 양쪽 형식을 정규화한 29,105바이트 복구 도구(SHA-256 `1ada026b534bf5d81ae65e70dc19a2e6806af90aa9cc8409b478b1c1532e0f9e`)를 수정 없는 검증으로 먼저 확인하고 복구를 한 번 실행했다. 복구는 종료 코드 0으로 끝났고 실행 폴더와 격리 홈은 없어졌으며 기존 격리 부모는 같은 식별자로 빈 상태를 유지했다. ordinal 실행 폴더 기준은 38개·1,654바이트·SHA-256 `56dffbde6864a4184208b1366a88506d12289f0f9f32af472d6cc6e79d03b15d`, 격리 홈 기준은 0개·0바이트·SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`로 복원됐다. App Server 프로세스 수는 live 전후 2개였고, 복구 직전에 고정한 2개 process snapshot의 SHA-256 `dfe58da4c1cf501ab0a11fbdbf64bd561647e972abd4b780ee086ab22871ec49`도 복구 뒤 같았다. 설정·Git·출력 부재도 다시 확인했고 임시 복구 도구는 제거했다. 이 별도 복구는 live 재시도가 아니다.

[v8 시도 기록](../../../evals/skill-contracts/joeness-m4-direct-user-delegation-attempt-index-v8.json)은 계획·소스·v7 계보·역할 분리 입력 계약·pre-open 실패·미완료 live 정리·별도 복구와 최종 기준을 함께 고정한다. 같은 v8 live 명령은 다시 실행하지 않고 추가 live 실행도 승인하지 않는다. 이 결과로 Core, vendor 설치 manifest, 플러그인 설정 또는 승격 상태를 바꾸지 않는다.

## Visual Check structure

The public body selects exactly one or more applicable modes:

- output completion;
- concrete defect verification;
- approved-reference translation;
- durable evidence for every mode;
- concrete-defect and approved-reference details only when their mode applies.

The completion gate derives the smallest sourced, falsifiable checks, inspects the exact native or runtime evidence, records PASS/FAIL/UNVERIFIED per required check, and applies FAIL before UNVERIFIED before PASS. Automated checks, filenames, captures, or reviewer claims never substitute for direct inspection. Unresolved checks block only dependent work.

## Validation

- Add RED contract tests before changing active sources.
- Preserve Core v1-v7 and the current evaluation history byte-for-byte.
- Keep active Core v7 under the 3,072-byte decision recorded in `2026-08-13-joeness-user-language-and-core-size-decision.md`. The active pointer remains v7; create no Core v8 until behavior evidence justifies a Core change.
- A later live evaluation must run fresh-context samples where the user does not name `$visual-check`, plus negative nonvisual and planning-only cases; M4 contract work does not run them.
- Score routing and actual visual verdict behavior separately. Mentioning a skill name is not a pass.
- Run the focused Node tests while editing, then the repository's documented release suite once before installation or release claims.

## Non-goals

- No new public skill, collector, visual daemon, screenshot framework, or project-specific art rule.
- No automatic plugin configuration changes.
- No Core v8, live model evaluation, plugin activation check, installation, or apply operation in M4 contract work.
- No rewrite of historical Core, skill, pressure, or incident evidence.
