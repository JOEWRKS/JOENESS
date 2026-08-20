import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import {
  TEST_GROUPS,
  validateTaxonomy,
} from "../scripts/run-node-test-group.mjs";

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RUNNER = path.join(ROOT, "scripts", "run-node-test-group.mjs");

test("taxonomy classifies every Node test exactly once", async () => {
  const discoveredFiles = (await readdir(path.join(ROOT, "tests"), {
    withFileTypes: true,
  }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".tests.mjs"))
    .map((entry) => `tests/${entry.name}`)
    .sort();

  assert.deepEqual(validateTaxonomy({ discoveredFiles, groups: TEST_GROUPS }), {
    total: 30,
    groups: {
      "current-release": 19,
      "historical-integrity": 1,
      "historical-replay": 10,
    },
  });
});

test("taxonomy rejects unclassified and duplicate test ownership", () => {
  assert.throws(
    () => validateTaxonomy({
      discoveredFiles: ["tests/a.tests.mjs", "tests/b.tests.mjs"],
      groups: {
        "current-release": ["tests/a.tests.mjs"],
        "historical-integrity": [],
        "historical-replay": [],
      },
    }),
    /unclassified.*tests\/b\.tests\.mjs/iu,
  );

  assert.throws(
    () => validateTaxonomy({
      discoveredFiles: ["tests/a.tests.mjs"],
      groups: {
        "current-release": ["tests/a.tests.mjs"],
        "historical-integrity": [],
        "historical-replay": ["tests/a.tests.mjs"],
      },
    }),
    /duplicate.*tests\/a\.tests\.mjs/iu,
  );
});

test("historical replay refuses current-checkout direct execution", async () => {
  await assert.rejects(
    execFileAsync(process.execPath, [RUNNER, "historical-replay"], {
      cwd: ROOT,
      encoding: "utf8",
    }),
    (error) => {
      assert.equal(error.code, 2);
      assert.equal(error.stdout, "");
      assert.match(
        error.stderr,
        /historical-replay requires an exact historical commit\/blob environment;[\s\S]*current-checkout execution is intentionally unsupported/iu,
      );
      return true;
    },
  );
});
