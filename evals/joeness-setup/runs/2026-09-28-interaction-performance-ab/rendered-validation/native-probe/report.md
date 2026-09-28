# Native Canvas render probe — bounded Windows A/B evidence

## Scope and parity

This follows the [failed hidden-player attempt](../report.md) and the [offscreen approximation](../offscreen-probe/report.md); neither earlier result was deleted or regraded. The original `ScreenSpaceOverlay` Canvas mode remains unchanged in these Windows player captures. Both arms use the same diagnostic source: [`CollectionPlayerRenderProbe.cs`](source/CollectionPlayerRenderProbe.cs), SHA-256 `d3b7cab061defe359a1376635b80819d3e9aae635e8ce099b011bf413baf7c72`. Bare was rebuilt and recaptured with that exact source after an initial exploratory native capture, so the table below uses only the source-matched runs. [`BuildRenderProbe.cs`](source/BuildRenderProbe.cs) builds the explicit real Game scene because the historical fixture has an empty normal build-scene list.

Environment: Unity `6000.3.21f1`, Windows x86_64 Development player, visible window on a 1920×1080 desktop, `-screen-fullscreen 0`, and the requested size passed both as player arguments and to `Screen.SetResolution`. The probe loads the real Game scene, opens the collection, dispatches a Unity UI drag to the carousel, asserts `DEFAULT FRUIT` → `PIXEL FRUIT`, then captures the actual player screen before/after. It does **not** simulate a human finger or use an Android/iOS device. The production MergeDrop checkout, JOENESS Core, installed skill, original A/B model runs, and original grades were not changed.

Both isolated diagnostic builds reported `Succeeded`, `errors=0`, `warnings=0` (local Bare build-log SHA-256 `01ebd757e3f6588a82a27687697bfdf86560dd24fbd2de238940a01943393c16`; JOENESS `53a8a56c23e98f83cbe2f3ce1271930c8737653a72ce5b5e625b0882147571a1`). The large builds/logs remain outside the repository; compact player results are in [`results/`](results/).

| Arm / player size | Before PNG (SHA-256) | After PNG (SHA-256) | Result |
| --- | --- | --- | --- |
| Bare 1440×900 | [`bare-desktop-before.png`](screenshots/bare-desktop-before.png) `6afdecf8d6d9849aa38774b5f4810e83b295d1f958e99d94c701b5d9d613bf8a` | [`bare-desktop-after.png`](screenshots/bare-desktop-after.png) `306f3c6152acdf9355d10c3377b9f15b6136f55a435d7be75bdb3d24c4437c07` | [`bare-desktop.txt`](results/bare-desktop.txt) |
| Bare 390×844 | [`bare-mobile-before.png`](screenshots/bare-mobile-before.png) `9ba05e91c966068da65d62ebee83cd8cc8920918503e914766fc64ba87aaf004` | [`bare-mobile-after.png`](screenshots/bare-mobile-after.png) `8d293cbd12f48c20da719de1792f941e15ec6f4021c6429583ae0bf55c873882` | [`bare-mobile.txt`](results/bare-mobile.txt) |
| JOENESS 1440×900 | [`joeness-desktop-before.png`](screenshots/joeness-desktop-before.png) `b48046aeb11f691b72f4e4c5ed6ecc37272bdae4037c252d0891533cd9c837e1` | [`joeness-desktop-after.png`](screenshots/joeness-desktop-after.png) `0b13d411157f66404cc861249313f0812de4045b94ef2c8f8e2ea7fa4ffe6ab8` | [`joeness-desktop.txt`](results/joeness-desktop.txt) |
| JOENESS 390×844 | [`joeness-mobile-before.png`](screenshots/joeness-mobile-before.png) `9ba05e91c966068da65d62ebee83cd8cc8920918503e914766fc64ba87aaf004` | [`joeness-mobile-after.png`](screenshots/joeness-mobile-after.png) `8d293cbd12f48c20da719de1792f941e15ec6f4021c6429583ae0bf55c873882` | [`joeness-mobile.txt`](results/joeness-mobile.txt) |

The existing [`../check-capture.mjs`](../check-capture.mjs) passed all four native pairs for PNG signature, exact dimensions, nontrivial bytes, and different before/after images. Direct visual inspection found the collection modal, fruit art, and text/action state visible at both sizes in both arms. The 390×844 pairs are byte-identical between arms; desktop after images differ in 313/1,296,000 pixels (0.0242%), within an 11×40 pixel region near the top-right icon. No material visual difference was observed. This small difference is not evidence of either arm's superiority.

Each player log also contains the same shutdown error: `Coroutine couldn't be started because the the game object 'GameController' is inactive!` The stack traces point to `GameController.OnDisable` → `GameAudio.SetPaused` → `FadeBgmTo`; it appears after the probe's success line in all four runs and was also seen in earlier diagnostics. It is an unresolved, common teardown issue, not a clean-console result.

## Validation status

- **Passed:** native Windows player rendering at 1440×900 and 390×844; scripted collection drag; inspectable before/after pixels in both arms.
- **Unverified:** physical touch, Android/iOS layout and safe areas, release configuration, and user acceptance. A mobile-sized Windows window is not a mobile device.
- **A/B conclusion unchanged:** Bare and JOENESS remain materially equivalent on this visual interaction; no JOENESS accuracy or efficiency gain was demonstrated. This diagnostic does not alter the preregistered grades.
