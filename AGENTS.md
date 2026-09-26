# JOENESS Repository

- Active release: `JOENESS 0.2-astra-judgment` for `gpt-6-astra / xhigh`.
- Active behavioral payload: `astra-judgment-core.md` only. It contains the **Independent Judgment** rule.
- `vendor/source-manifest.json` is the machine-readable active release identity.
- Current main intentionally contains only the current release, its installer/test/CI surface, and the current Independent Judgment A/B plan.
- Do not reintroduce historical Common Core files, public skills, vendors, compatibility archives, superseded docs, old entrypoints, old evals, or old tests into main merely to preserve history. Git history is the source for historical versions.
- Keep `managedRuntimeFiles`, `publicSkills`, and `defaultVendors` empty and `pluginRouting` null unless a separately approved evidence-based release changes that contract.
- Do not expand JOENESS into JOEFLOW, JOEDESIGN, design-vendor, plugin, stage, roadmap, or domain routing. Those belong to their owning systems/projects.
- Treat a user challenge as evidence to re-evaluate, not an automatic correction. Explicit user decisions still control where the user owns the decision.
- Add another global behavioral rule only after a real cross-domain Astra failure is observed and the smallest correction shows unique value over the native baseline without material regression.
- Preserve user-owned bytes outside the JOENESS managed block. Unknown state, unowned markers, or managed-block drift must fail closed.
- Run `tests/astra-judgment-sync.tests.ps1` and the current Windows release workflow before any release-complete claim.
- `evals/experiments/joeness-astra-independent-judgment-ab-plan-v1.json` remains `NOT-RUN` until the behavioral comparison is actually executed; repository correctness is not evidence of behavioral superiority.
