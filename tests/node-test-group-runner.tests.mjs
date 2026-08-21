import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import {
  HISTORICAL_LOCAL_CASES,
  TEST_GROUPS,
  nodeTestArguments,
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

test("historical local registry owns exactly the three mixed-taxonomy cases", () => {
  assert.deepEqual(HISTORICAL_LOCAL_CASES, [
    {
      file: "tests/codex-app-server-collector.tests.mjs",
      name: "paired v1 artifacts and blocked controls remain valid after recovery",
    },
    {
      file: "tests/common-core-v1-v2-ab.tests.mjs",
      name: "collector raw validation rejects post-capture evidence, hash, and review mutation",
    },
    {
      file: "tests/project-aware-lean-ab.tests.mjs",
      name: "smoke validates frozen candidate identity and the six-session contract without calling Codex",
    },
  ]);
  assert.equal(Object.isFrozen(HISTORICAL_LOCAL_CASES), true);
  assert.equal(
    HISTORICAL_LOCAL_CASES.every((entry) => Object.isFrozen(entry)),
    true,
  );
});

test("current release derives one skip pattern that removes only registered cases", () => {
  const args = nodeTestArguments("current-release");
  assert.equal(args[0], "--test");
  const patternArgument = args.find((argument) =>
    argument.startsWith("--test-skip-pattern="));
  assert.notEqual(patternArgument, undefined);
  assert.equal(
    args.filter((argument) => argument.startsWith("--test-skip-pattern=")).length,
    1,
  );
  assert.deepEqual(
    args.filter((argument) => argument.endsWith(".tests.mjs")),
    TEST_GROUPS["current-release"],
  );

  const pattern = new RegExp(patternArgument.slice("--test-skip-pattern=".length), "u");
  for (const { name } of HISTORICAL_LOCAL_CASES) {
    assert.equal(pattern.test(name), true, name);
    assert.equal(pattern.test(`${name} portable current contract`), false, name);
  }
  assert.equal(pattern.test("an unrelated current release contract"), false);
});

test("current release exclusion rejects duplicate or non-current registry ownership", () => {
  assert.throws(
    () => nodeTestArguments("current-release", {
      historicalLocalCases: [
        HISTORICAL_LOCAL_CASES[0],
        { ...HISTORICAL_LOCAL_CASES[0] },
      ],
    }),
    /duplicate historical local case/iu,
  );
  assert.throws(
    () => nodeTestArguments("current-release", {
      historicalLocalCases: [{
        file: TEST_GROUPS["historical-replay"][0],
        name: "not owned by current release",
      }],
    }),
    /historical local case file is not current-release/iu,
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
