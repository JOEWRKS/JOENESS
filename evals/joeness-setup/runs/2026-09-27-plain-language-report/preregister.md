# Plain-language report update — bounded validation plan

## Observed RED

The prior full-package experiment preserved two actual independent-handoff answers and user ratings in `../2026-09-27-usability-performance-ab/`. The JOENESS answers were preferred in both blind pairs, but the user explicitly found their long sentences and developer-facing vocabulary hard to read. The current six-field report still puts terms such as requirement IDs, test/commit status, and file-system details into long bullets or technical-heavy detail. This is the failure to correct; task outcomes and exact evidence must remain intact.

## Change boundary

Change only the report guidance in `skills/joeness-setup/SKILL.md`, its short project connection asset, and its usage example; update the release manifest hashes. Keep the six user-selected labels and document-role behavior. Do not add an always-on rule, new public skill, new mandatory document, translation step, extra checks, or feature scope.

## Behavioral check

Run the same two read-only independent-handoff requests on the existing fictional Reading Shelf and Workshop Slots projects in fresh `gpt-6-astra/xhigh` sessions after the edit. Both project trees were unchanged by their S5 resume tasks in the prior run, so their saved S4 JOENESS responses are the old-guidance baseline for factual comparison. The new sessions use the existing authenticated runtime; no credential copy or real production project is needed. Record prompts, runtime, bounded final responses, usage, and before/after Git status; do not retain full rollouts.

Score the response, not the text of the skill:

1. Six-field opening conveys done, changed files, encountered/resolved problems, remaining boundary and next action in short natural language, without unexplained internal codes.
2. Detail also begins with what the technical facts mean to a non-developer; exact source paths, verified counts, causes and limits remain available where relevant.
3. Reading Shelf: required work complete, CSV deferred, user acceptance pending. Workshop: local fixes complete, actual kiosk check absent, milestone incomplete, user acceptance pending. No old handoff overriding current state.
4. No file write in the read-only handoff and no rerun of unrelated tests solely to create a report.
5. Report actual token and time change descriptively. More tokens are acceptable if the material task facts and next action are preserved. A single new response per fixture cannot prove a general cost or accuracy effect; a material regression blocks install.

Run the Windows release tests and skill validation before a release-complete claim. Install/update the personal package only if the behavior and contracts pass, then Check it; do not alter project records during installation.

## Infrastructure amendment after first attempt

The first `read-only` session (`reading-shelf-old`) returned an inability to read project file bodies: command execution was `blocked by policy`. This is not a semantic response suitable for scoring. The next `reading-shelf-new` read-only session was intentionally terminated after the same read barrier became clear; its incomplete result is retained. Running the remaining scheduled read-only sessions would waste tokens. For the two **new-guidance** cases only, use `workspace-write` on the same fictional projects with the unchanged user instruction not to edit files, and fail the run if Git status changes. Compare factual completeness with the previously successful S4 handoffs, but do not claim a controlled fresh old/new token difference from this repaired design. Preserve the failed records and do not overwrite them.

The `workspace-write` Reading Shelf attempt also returned `blocked by policy` for file reads, so it is not scored; the Workshop attempt was stopped and retained. The earlier successful 24-session evaluation used `danger-full-access` on these exact fictional local projects. A final two-case infrastructure retry uses that mode, still with a no-edit user request and before/after Git-status guard. This is a test-environment repair, not a change to expected semantic answers. Stop if this mode also cannot read, writes any project file, or produces a material factual regression.

Both `danger-full-access` new-guidance cases recovered the required facts without a project write. The user reviewed the Workshop response and judged it easier to read, but said its sentences became too long: familiar words should replace jargon, not trigger an expanded explanation. This is a new observed failure of response shape. Narrow the guidance to short sentences and no redundant background, preserve exact facts, then run one fresh Workshop handoff against the revised guidance. Retain the first successful responses as evidence; do not reinterpret them as fully satisfactory.

## Bounded code-work check after concise wording approval

The handoff checks cannot establish that implementation quality is unaffected. Run one old/new pair on separate, identical Git copies of the fictional Reading Shelf fixture. Both arms receive the same concrete task: complete required R1 only (`addBook` preserves `author`, rejects duplicate `id`, leaves the input unchanged), add targeted tests, run the local suite, and report the exact verified boundary. R2 search and optional CSV are out of scope. Inject only the old versus current six-field report paragraph from the skill; use fresh `gpt-6-astra/xhigh` sessions and the known-working `danger-full-access` fixture mode. No real project or credential file is copied.

Score code behavior and test results before style: R1 passes targeted tests, R2/CSV remain untouched, no false M1-complete or user-accepted claim, no unrelated file changes, and the report accurately names done/remaining work. Retain both final responses, bounded usage, Git diffs and test outputs. A single pair can detect a material regression here but cannot prove universal non-regression or estimate a causal token difference. If the two implementations materially differ, do not claim performance parity and inspect the cause before release-complete reporting.
