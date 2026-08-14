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
