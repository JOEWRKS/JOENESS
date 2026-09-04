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
  nodeTestInvocations,
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
    total: 32,
    groups: {
      "current-release": 5,
      "historical-integrity": 4,
      "historical-replay": 23,
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

test("historical local registry owns exactly the mixed current historical cases", () => {
  assert.deepEqual(HISTORICAL_LOCAL_CASES, [
    {
      file: "tests/codex-app-server-collector.tests.mjs",
      name: "paired v1 artifacts and blocked controls remain valid after recovery",
    },
    {
      file: "tests/design-vendor-integrity.tests.mjs",
      name: "Control vendor and public-skill identities remain exact historical facts",
    },
    {
      file: "tests/design-vendor-integrity.tests.mjs",
      name: "Control M4 preserves project workflow authority without promoting or expanding Core",
    },
    {
      file: "tests/design-vendor-integrity.tests.mjs",
      name: "Control evaluation history remains available from its immutable Git owner",
    },
    {
      file: "tests/design-vendor-integrity.tests.mjs",
      name: "operational skills bound handoff context and high-cost validation",
    },
    {
      file: "tests/design-vendor-integrity.tests.mjs",
      name: "Git preserves exact vendor and active skill bytes on checkout",
    },
  ]);
  assert.equal(Object.isFrozen(HISTORICAL_LOCAL_CASES), true);
  assert.equal(
    HISTORICAL_LOCAL_CASES.every((entry) => Object.isFrozen(entry)),
    true,
  );
});

test("historical integrity plans the owned group and exact mixed cases without executing them", () => {
  const invocations = nodeTestInvocations("historical-integrity");
  assert.equal(invocations.length, 2);
  assert.deepEqual(invocations[0], [
    "--test",
    "tests/design-visual-m2.tests.mjs",
    "tests/joeness-m4-historical-integrity.tests.mjs",
    "tests/skill-contracts.tests.mjs",
    "tests/thin-hybrid-core.tests.mjs",
  ]);
  assert.deepEqual(
    invocations[1].filter((argument) => argument.endsWith(".tests.mjs")),
    [
      "tests/codex-app-server-collector.tests.mjs",
      "tests/design-vendor-integrity.tests.mjs",
    ],
  );
  assert.equal(invocations[1][0], "--test");
  const patternArguments = invocations[1].filter((argument) =>
    argument.startsWith("--test-name-pattern="));
  assert.equal(patternArguments.length, 1);
  const pattern = new RegExp(patternArguments[0].slice("--test-name-pattern=".length), "u");
  for (const { name } of HISTORICAL_LOCAL_CASES) {
    assert.equal(pattern.test(name), true, name);
    assert.equal(pattern.test(`${name} portable current contract`), false, name);
  }
  assert.equal(pattern.test("an unrelated historical integrity case"), false);
});

test("current release derives one skip pattern that removes only registered cases", () => {
  const args = nodeTestArguments("current-release");
  assert.deepEqual(nodeTestInvocations("current-release"), [args]);
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
