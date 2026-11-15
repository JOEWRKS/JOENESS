# Project roadmap

Project scope: direction pending. README.md describes the existing static request form (request body up to 500 characters; screen widths 360, 768, 1280); no overall delivery goal or stage order has been given. Decision needed from the user: the project goal and stage order.
Product authority: README.md (whole file).
Product revision / approval: none (README.md has no revision or approval record); read 2026-11-15.
Current stage: none set (direction pending). Requested work outside a stage: R1 not started.
Next eligible work: R1 — first settle the counter's undecided display (format, position, near-limit/limit state) with the user and add its DESIGN rule rows; then implement. No blocked dependency.
Status words: not started / in progress / verification pending / on hold / complete / removed from scope.

## Requested work (outside a stage; stage order undecided)

Source: user request 2026-11-15 (register as first TASK; implementation not yet requested).

| ID | Required outcome | Status | Check / completion criterion | Evidence or gap |
| --- | --- | --- | --- | --- |
| R1 | Request form (`src/index.html` `#body`) shows the current character count against the 500-character limit, updating as the user types and returning to 0 after a successful submit (`form.reset()`) | not started | Technical: in a browser, typing, pasting, deleting and submitting update the count to match `#body` length; 500 limit unchanged. Visual: DESIGN.md#rule-coverage counter rows (to be added once the display is decided) at 360/768/1280, states empty / typing / at limit, Spot check per row; result lines and stamp in TASK. Owner confirmation of the chosen display | Not implemented. Display format, position and limit-state styling undecided (README states only the 500 limit). See [TASK R1](TASK.md#r1--2026-11-15--요청-폼-글자-수-표시-등록) |

Scope decisions: none.
User acceptance: pending for R1's visible display.
Optional/later: none.
