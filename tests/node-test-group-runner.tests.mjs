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
  validateHistoricalLocalTap,
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
  assert.equal(invocations.length, 3);
  assert.deepEqual(invocations[0], [
    "--test",
    "tests/design-visual-m2.tests.mjs",
    "tests/joeness-m4-historical-integrity.tests.mjs",
    "tests/skill-contracts.tests.mjs",
    "tests/thin-hybrid-core.tests.mjs",
  ]);
  assert.deepEqual(
    invocations.slice(1).map((invocation) =>
      invocation.filter((argument) => argument.endsWith(".tests.mjs"))),
    [
      ["tests/codex-app-server-collector.tests.mjs"],
      ["tests/design-vendor-integrity.tests.mjs"],
    ],
  );
  for (const invocation of invocations.slice(1)) {
    assert.equal(invocation[0], "--test");
    assert.equal(invocation[1], "--test-reporter=tap");
    const patternArguments = invocation.filter((argument) =>
      argument.startsWith("--test-name-pattern="));
    assert.equal(patternArguments.length, 1);
    const pattern = new RegExp(patternArguments[0].slice("--test-name-pattern=".length), "u");
    const file = invocation.at(-1);
    for (const { name } of HISTORICAL_LOCAL_CASES) {
      assert.equal(pattern.test(name), HISTORICAL_LOCAL_CASES.some(
        (entry) => entry.file === file && entry.name === name,
      ), name);
      assert.equal(pattern.test(`${name} portable current contract`), false, name);
    }
    assert.equal(pattern.test("an unrelated historical integrity case"), false);
  }
});

test("historical local TAP validation fails closed on missing renamed skip todo or duplicate results", () => {
  const expectedCases = [
    { file: "tests/example.tests.mjs", name: "expected historical case" },
  ];
  const invalidTap = [
    ["absent", "TAP version 13\n1..0\n# tests 0\n", /missing/iu],
    ["renamed", "TAP version 13\nok 1 - renamed historical case\n1..1\n", /unexpected pass.*missing/iu],
    ["skip", "TAP version 13\nok 1 - expected historical case # SKIP unavailable\n1..1\n", /skip/iu],
    ["todo", "TAP version 13\nok 1 - expected historical case # TODO pending\n1..1\n", /todo/iu],
    ["duplicate", "TAP version 13\nok 1 - expected historical case\nok 2 - expected historical case\n1..2\n", /duplicate/iu],
  ];
  for (const [condition, tap, expectedError] of invalidTap) {
    assert.throws(
      () => validateHistoricalLocalTap({
        file: "tests/example.tests.mjs",
        expectedCases,
        tap,
      }),
      expectedError,
      condition,
    );
  }
});

test("historical local TAP validation accepts every expected identity once as pass", () => {
  assert.equal(validateHistoricalLocalTap({
    file: "tests/example.tests.mjs",
    expectedCases: [
      { file: "tests/example.tests.mjs", name: "first historical case" },
      { file: "tests/example.tests.mjs", name: "second historical case" },
    ],
    tap: [
      "TAP version 13",
      "ok 1 - first historical case",
      "ok 2 - second historical case",
      "1..2",
      "# tests 2",
      "# pass 2",
      "# fail 0",
      "# skipped 0",
      "# todo 0",
      "",
    ].join("\n"),
  }), 2);
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
