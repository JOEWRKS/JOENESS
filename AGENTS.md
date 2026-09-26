# JOENESS Repository

- Active release: `JOENESS 0.2` for `gpt-6-astra / xhigh`.
- Always-on payload: `astra-judgment-core.md` only (**Independent Judgment**). The sole public skill, `joeness-setup`, is project-scoped setup, not another global harness.
- `vendor/source-manifest.json` is the machine-readable active release identity.
- Keep current sources, setup spec/plan, bounded fixtures/evidence, installer/tests/CI and the Independent Judgment A/B plan. Historical 0.1 sources remain in Git history.
- Do not reintroduce historical Common Core files, public skills, vendors, compatibility archives, superseded docs, old entrypoints, old evals, or old tests into main merely to preserve history. Git history is the source for historical versions.
- Keep `managedRuntimeFiles` and `defaultVendors` empty, `pluginRouting` null, and `publicSkills` exactly `joeness-setup`. This setup release was explicitly approved.
- Do not expand JOENESS into JOEFLOW, JOEDESIGN, design-vendor, plugin, stage, or domain routing. Those belong to their owning systems/projects.
- Treat a user challenge as evidence to re-evaluate, not an automatic correction. Explicit user decisions still control where the user owns the decision.
- Add another global behavioral rule only after a real cross-domain Astra failure is observed and the smallest correction shows unique value over the native baseline without material regression.
- Preserve user-owned bytes outside the JOENESS managed block. Unknown state, unowned markers, or managed-block drift must fail closed.
- Run `tests/astra-judgment-sync.tests.ps1` and the current Windows release workflow before any release-complete claim.
- The Independent Judgment A/B has bounded run evidence under `evals/experiments/`. Bare and Core were materially equivalent in eight cases; do not claim behavioral superiority or treat repository correctness as behavioral evidence. Human goal-usefulness rating remains unverified.
