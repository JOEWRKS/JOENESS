# Behavior-level performance A/B preflight — stopped before model runs

The intended comparison was the two previously invalid-oracle MergeDrop repairs,
with at most eight fresh GPT-6 Astra `xhigh` sessions (two cases, two arms, two
repetitions). No fresh model session was launched in this preflight. The first
case has a validated neutral oracle; the second does not. Therefore this run
does **not** measure JOENESS coding accuracy, time, or token cost.

## Case 1: unknown visual-set ID — oracle accepted

The bounded oracle is `oracles/VisualSetBehaviorOracleTests.cs`, SHA-256
`66916868ae213a893b115a07a7c4c1040552a66ca5cf1fb66e059bc40c63b2d5`.
It checks that invalid IDs cannot alias a known unlock bit or overwrite a
saved valid selection, while valid selection/unlock still works. It accepts
either explicit invalid-ID rejection or a safe non-aliasing bit value; it does
not require a particular exception or private field.

Focused Unity 6000.3.21f1 EditMode outcomes, each with the same oracle over a
separate historical source archive:

| Source | Focused result | XML SHA-256 |
| --- | --- | --- |
| Broken parent `9e3ad5158b247e8047698d969c9087644237bca3` | 2 passed / 4 failed | `1d09c86a806cfa9ae3ea7cbd319330cce900cc3fef5c0df7b52860d7490d787f` |
| Historical fix `71ada1a33bf2a5e7f1b311bf133c17edd37de7a8` | 6 passed / 0 failed | `293d48c75ed660937a45085581f2a168cb3b80722a3ab931d8335dcb6aedc18a` |
| Independent valid implementation from prior Bare run, returning zero instead of throwing for invalid `Bit` | 6 passed / 0 failed | `ba8a089f9551d00c06b51654d6cc0619285d939e7509a85a3f3d32e81c72b6c5` |

The four expected broken-parent failures were the two bit-alias and two
selection-preservation cases. The independent valid implementation is from
`2026-09-28-actual-performance-ab`, run `invalid-visual-set-write-r1-bare`.
Raw XML and Unity logs are preserved under the local isolated trial root
`D:/JOEWRKS/JOENESS-Behavior-AB-20260928/`; they were not copied into the
release package.

## Case 2: deferred ranking authentication — oracle blocked

The broken parent is `72fab347a4b6519a5216731e4700bcf0ddd4d8c5`;
the historical fix is `5010b0365cb3b25b0a92490f3ff9d7ddf6377316`.
The behavioral distinction is whether opening the game starts Google Play
Games authentication before the player opens Ranking. In the historical
`PlayGamesLeaderboard`, the actual `PlayGamesPlatform.Instance.Authenticate`
call is compiled only under `UNITY_ANDROID && !UNITY_EDITOR`. In Unity
EditMode, `AuthenticateOnce` changes only the private
`_authenticationStarted` field; the public `IsAuthenticated` stays false in
both broken and fixed versions. The old test reads that private field. Prior
agents removed the field while preventing startup authentication, so that
test produced a null-reflection failure unrelated to the player-visible
behavior. The historical fix removes the `AuthenticateOnce` call from
`GameController.Awake` and preserves the manual Ranking path.

A source-text prohibition or a private-field assertion would merely reproduce
the old implementation-coupled oracle. A genuine behavioral oracle here needs
an observable Android authentication boundary (for example an instrumented
device or an explicitly approved test seam). Neither is part of the approved
isolated EditMode fixture. No substitute oracle was invented, and no product
code or live MergeDrop worktree was changed.

## Decision

`PREFLIGHT_BLOCKED_BY_SECOND_ORACLE`. The pre-registered two-case A/B is
unstarted, not failed or passed. Resume only after a behaviorally observable
second case is chosen or an Android/test-seam approach is explicitly scoped;
freeze and validate its RED/GREEN oracle before spending model sessions.
