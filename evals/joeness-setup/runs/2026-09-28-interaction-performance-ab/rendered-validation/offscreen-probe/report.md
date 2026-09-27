# Exact-size offscreen render probe — supplemental, not native acceptance

## Scope

This probe follows the failed native-size Editor and hidden-player attempts in [`../report.md`](../report.md). It uses the **same isolated collection-swipe-r2 Bare and JOENESS outputs** as that report, Unity `6000.3.21f1`, an explicit `Assets/MergeDrop/Scenes/Game.unity` scene, and Windows x86_64 diagnostic player builds. The original A/B model runs, grades, production MergeDrop checkout, JOENESS Core, and installed skill were not changed.

The original scene Canvas is `ScreenSpaceOverlay`. The hidden-player `ScreenCapture` files were black despite a valid `PIXEL FRUIT` state. For this bounded follow-up, [`source/CollectionPlayerRenderProbe.cs`](source/CollectionPlayerRenderProbe.cs) temporarily changes only the diagnostic copy's Canvas to `ScreenSpaceCamera`, renders it into a target-size `RenderTexture`, reads PNG bytes, then restores the original mode. The identical probe source was used in both arms (SHA-256 `f3334bb67a6beeaf8b97bea98d7d55131bdccec37bb1f9ce9e262a6ad193d038`). [`source/BuildRenderProbe.cs`](source/BuildRenderProbe.cs) built an explicit Game-scene player; no release configuration was changed.

This is **actual rendered UI in an offscreen approximation**, not proof of the original overlay-mode display on a real desktop or mobile device. Input is a scripted Unity UI drag event, not a physical swipe. The diagnostic build is not a release build.

## Results

Both diagnostic Windows builds reported `Succeeded`, `errors=0`, `warnings=0` in their local build logs (Bare log SHA-256 `3f41094700893d98ab0fbacef51d75260740cd7d34ceaf30fb3995f387f0d3ad`; JOENESS log SHA-256 `c19b16cfd7040ee409c44025dfd930cd27a9219795129b8fa4c97d1266c17d8b`). No build files or large logs were added to this repository. Each player asserted the real collection state changed from `DEFAULT FRUIT` to `PIXEL FRUIT` after drag, then wrote the small [`results/`](results/) records.

| Arm / target | Before PNG (SHA-256) | After PNG (SHA-256) | Probe result |
| --- | --- | --- | --- |
| Bare 1440×900 | [`bare-desktop-before.png`](screenshots/bare-desktop-before.png) `3b8dc9071de2481d5d818bde3a8ecdc1fdb6a77abf62cb829d927c478379f414` | [`bare-desktop-after.png`](screenshots/bare-desktop-after.png) `d64270bb4cc971de8df5e0126dca812b1efc5f3092a5952b3830c44c52d613c8` | [`bare-desktop.txt`](results/bare-desktop.txt) |
| Bare 390×844 | [`bare-mobile-before.png`](screenshots/bare-mobile-before.png) `baf43fa99f716aabc5cf86cbfbaeb96b17b29677e778efc4dbae524e53e1e062` | [`bare-mobile-after.png`](screenshots/bare-mobile-after.png) `19618d762a4e12881049c4a92648d4e4b6f8889d116e0dd0dbfd9d326f82773b` | [`bare-mobile.txt`](results/bare-mobile.txt) |
| JOENESS 1440×900 | [`joeness-desktop-before.png`](screenshots/joeness-desktop-before.png) `03a1e2f0b8b1db1eb152e8f0f39bfdf622380f635fe8aa5bb3e80e73c48787dc` | [`joeness-desktop-after.png`](screenshots/joeness-desktop-after.png) `3a60d6bfd90c6c16f1143de76cd9401b3f02ab36df1dc4ef4f7dd44911651248` | [`joeness-desktop.txt`](results/joeness-desktop.txt) |
| JOENESS 390×844 | [`joeness-mobile-before.png`](screenshots/joeness-mobile-before.png) `baf43fa99f716aabc5cf86cbfbaeb96b17b29677e778efc4dbae524e53e1e062` | [`joeness-mobile-after.png`](screenshots/joeness-mobile-after.png) `a167c3e8b1f2d0e98146be4c927b32492ce3856ec06865fdd977716bb055248e` | [`joeness-mobile.txt`](results/joeness-mobile.txt) |

The [`../check-capture.mjs`](../check-capture.mjs) sanity check rejected the previously black 1440×900 capture, then passed all four offscreen pairs for PNG dimensions, nontrivial file size, and differing before/after bytes. This check is **not** a visual-quality oracle. Direct inspection found the `DEFAULT FRUIT` → `PIXEL FRUIT` transition and complete collection modal in both sizes and both arms. In a supplemental pixel comparison of the after images, 311/1,296,000 desktop pixels and 839/329,160 mobile pixels differed; different frame timing or rendering noise remains possible. No material visual difference was identified in the inspected images, but the files are not byte-identical.

## Status and boundary

- **Passed, supplemental:** offscreen target-size capture and scripted collection interaction in both arms, with no black frames.
- **Still blocked for native visual acceptance:** original overlay-mode target-size screenshot, physical mobile touch, device-specific scaling/safe-area behavior, and release-player UI.
- **A/B interpretation unchanged:** no demonstrated JOENESS visual, accuracy, time, or token advantage. The preregistered grades and flaky-test adjudication remain authoritative for the original experiment.
