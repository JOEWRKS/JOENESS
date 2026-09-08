# Historical runner RED evidence

Expected pre-fix state: the new test contract requires one exact historical-local case to be treated as an expected validator rejection, but `scripts/run-node-test-group.mjs` still assumes every historical-local case must pass. CI should therefore fail before the runner implementation changes.
