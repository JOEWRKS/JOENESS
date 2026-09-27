# Post-run rendered interaction diagnostic

This is a **supplement**, not a replacement for the preregistered eight-run A/B grades in [`../report.md`](../report.md). The agent runs were not repeated or rescored. All files here came from isolated historical MergeDrop copies; the active MergeDrop project, JOENESS Core, and installed skill were not changed.

## Actual pixels obtained

Unity Editor `6000.3.21f1` loaded the real `Assets/MergeDrop/Scenes/Game.unity` scene. The diagnostic test source is [`CollectionRenderedSmokeTests.cs`](CollectionRenderedSmokeTests.cs). It opened the collection, dispatched Unity's UI drag event to the collection carousel, asserted the selected set changed from `DEFAULT FRUIT` to `PIXEL FRUIT`, and captured before/after screen pixels in each arm. Direct visual inspection of the four PNGs found the same visible state transition in Bare and JOENESS. The after images are **not byte-identical** and no image-diff equivalence threshold was evaluated.

| Arm | Before PNG | SHA-256 | After PNG | SHA-256 |
| --- | --- | --- | --- | --- |
| Bare | [`screenshots/bare-before.png`](screenshots/bare-before.png) | `f3be90f54ffb7432720c30d2c719e0e20281347d388e5b800b135f604d6f2884` | [`screenshots/bare-after.png`](screenshots/bare-after.png) | `a6a2203fff52d03a199a929cdc9a9c1b20eff5d4cb1e0d634813d192f418300b` |
| JOENESS | [`screenshots/joeness-before.png`](screenshots/joeness-before.png) | `f3be90f54ffb7432720c30d2c719e0e20281347d388e5b800b135f604d6f2884` | [`screenshots/joeness-after.png`](screenshots/joeness-after.png) | `8370125b3d8cfd745201b3af87dadad5ca39970c632b3655f794b19ce25ae768` |

All four captured PNGs are **1101×510**, not the requested desktop **1440×900**. The Editor Game view kept its actual 1101×510 size despite `Screen.SetResolution`. Both desktop test results are therefore **FAIL (0/1)** on the exact-size assertion: [`Bare XML`](results/bare-desktop.xml), SHA-256 `5cbf1274d829393798050dfd56571e5f989537f069894e3ceae7bf432c2ec48f`; [`JOENESS XML`](results/joeness-desktop.xml), SHA-256 `c626913f05728b418514798ecf7d13a2dffc0c3596214c1639577b29534f3458`. Their teardown also logged an inactive `GameController` coroutine error. This does not invalidate the retained pixels, but it prevents a passing render-smoke claim.

The separate mobile-sized Editor attempt also **FAIL (0/1)**: requested **390×844**, actual width **1101**. Its [`XML`](results/bare-mobile-attempt.xml) SHA-256 is `ce2acfb922dd4ffc60279e6185c2269f31a6cc786f2356e0d02506470f606ea9`. No valid mobile-size screenshot was obtained.

## Standalone probe limitation

An isolated Windows player build with an explicit Game scene completed with zero build errors/warnings; the historical project's normal Editor build-scene list was empty, so this was a diagnostic build, not a release build. A hidden-player probe reported 1440×900 and `PIXEL FRUIT` in [`results/bare-hidden-player.txt`](results/bare-hidden-player.txt), but its before and after screenshots were identical, all-black PNGs (same SHA-256 `3a57f9d3166eec88ea9bea7463866f86074089c593043b8325ec6134b467daa5`). Those black files are deliberately **not** included as visual proof. This probe cannot verify desktop appearance.

## Bounded conclusion

- A real rendered interaction is visible at a common, non-target Editor viewport in both arms. No material visual difference was established there.
- Exact desktop 1440×900 rendering, mobile 390×844 rendering, touch-device behavior, and release-player visuals remain **unverified**.
- This supplemental work does **not** establish a JOENESS accuracy, performance, or visual-quality advantage over Bare. The original score and flaky-test adjudication remain unchanged.

A later, explicitly non-native [`offscreen-probe/report.md`](offscreen-probe/report.md) obtained readable 1440×900 and 390×844 diagnostic renders in both arms by temporarily routing the Canvas through a camera. It does not turn the failed native-size tests above into passes.
