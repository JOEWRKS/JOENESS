import { spawnSync } from "node:child_process";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const TEST_GROUPS = Object.freeze({
  "current-release": Object.freeze([
    "tests/astra-native-closure.tests.mjs",
    "tests/codex-app-server-collector.tests.mjs",
    "tests/design-vendor-integrity.tests.mjs",
    "tests/joeness-lean-ab-plan.tests.mjs",
    "tests/lean-kernel-contract.tests.mjs",
    "tests/node-test-group-runner.tests.mjs",
  ]),
  "historical-integrity": Object.freeze([
    "tests/design-visual-m2.tests.mjs",
    "tests/joeness-m4-historical-integrity.tests.mjs",
    "tests/skill-contracts.tests.mjs",
    "tests/thin-hybrid-core.tests.mjs",
  ]),
  "historical-replay": Object.freeze([
    "tests/authority-role-separated-evaluator-turn.tests.mjs",
    "tests/common-core-coding-ab.tests.mjs",
    "tests/common-core-v1-v2-ab.tests.mjs",
    "tests/design-frontend-hybrid-routing.tests.mjs",
    "tests/design-frontend-routing.tests.mjs",
    "tests/design-visual-m2-b1-runner.tests.mjs",
    "tests/fresh-evaluator-turn.tests.mjs",
    "tests/joeness-m4-authority-behavior-eval.tests.mjs",
    "tests/joeness-m4-authority-behavior-live.tests.mjs",
    "tests/joeness-m4-authority-structured-output-eval.tests.mjs",
    "tests/joeness-m4-authority-structured-output-live.tests.mjs",
    "tests/joeness-m4-direct-user-delegation-eval.tests.mjs",
    "tests/joeness-m4-direct-user-delegation-live.tests.mjs",
    "tests/joeness-m4-pinned-load-control-eval.tests.mjs",
    "tests/joeness-m4-pinned-load-control-live.tests.mjs",
    "tests/joeness-m4-superpowers-eval.tests.mjs",
    "tests/joeness-m4-superpowers-live.tests.mjs",
    "tests/joeness-m4-transport-control-eval.tests.mjs",
    "tests/joeness-m4-transport-control-live.tests.mjs",
    "tests/project-aware-lean-ab.tests.mjs",
    "tests/ticket-evaluator-provenance.tests.mjs",
    "tests/ticket-m1b-fixture.tests.mjs",
    "tests/ticket-verdict.tests.mjs",
  ]),
});

export const HISTORICAL_LOCAL_CASES = Object.freeze([
  Object.freeze({
    file: "tests/codex-app-server-collector.tests.mjs",
    name: "paired v1 artifacts and blocked controls remain valid after recovery",
    expectedStatus: "fail",
    expectedOutputContains: "reviewed pass/fail case lacks complete evidence",
  }),
  Object.freeze({
    file: "tests/design-vendor-integrity.tests.mjs",
    name: "Control vendor and public-skill identities remain exact historical facts",
  }),
  Object.freeze({
    file: "tests/design-vendor-integrity.tests.mjs",
    name: "Control M4 preserves project workflow authority without promoting or expanding Core",
  }),
  Object.freeze({
    file: "tests/design-vendor-integrity.tests.mjs",
    name: "Control evaluation history remains available from its immutable Git owner",
  }),
  Object.freeze({
    file: "tests/design-vendor-integrity.tests.mjs",
    name: "operational skills bound handoff context and high-cost validation",
  }),
  Object.freeze({
    file: "tests/design-vendor-integrity.tests.mjs",
    name: "Git preserves exact vendor and active skill bytes on checkout",
  }),
]);

function escapeRegex(value) {
  return value.replace(/[\\^$.*+?()[\]{}|]/gu, "\\$&");
}

function historicalLocalSelection({ groups, historicalLocalCases }) {
  const currentReleaseFiles = new Set(groups["current-release"] ?? []);
  const identities = new Set();
  const files = new Set();
  const names = [];
  for (const entry of historicalLocalCases) {
    if (
      entry === null ||
      typeof entry !== "object" ||
      typeof entry.file !== "string" ||
      typeof entry.name !== "string" ||
      entry.file.length === 0 ||
      entry.name.length === 0
    ) {
      throw new Error("invalid historical local case");
    }
    const expectedStatus = entry.expectedStatus ?? "pass";
    if (expectedStatus !== "pass" && expectedStatus !== "fail") {
      throw new Error(`invalid historical local expected status: ${entry.file} :: ${entry.name}`);
    }
    if (
      expectedStatus === "fail" &&
      (typeof entry.expectedOutputContains !== "string" ||
        entry.expectedOutputContains.length === 0)
    ) {
      throw new Error(`expected historical failure lacks output marker: ${entry.file} :: ${entry.name}`);
    }
    if (
      expectedStatus === "pass" &&
      entry.expectedOutputContains !== undefined
    ) {
      throw new Error(`passing historical case cannot declare failure output: ${entry.file} :: ${entry.name}`);
    }
    if (!currentReleaseFiles.has(entry.file)) {
      throw new Error(`historical local case file is not current-release: ${entry.file}`);
    }
    const identity = `${entry.file}\0${entry.name}`;
    if (identities.has(identity)) {
      throw new Error(`duplicate historical local case: ${entry.file} :: ${entry.name}`);
    }
    identities.add(identity);
    files.add(entry.file);
    names.push(escapeRegex(entry.name));
  }
  return {
    files: [...files],
    pattern: names.length === 0 ? undefined : `^(?:${names.join("|")})$`,
  };
}

function historicalLocalSkipPattern(options) {
  return historicalLocalSelection(options).pattern;
}

function historicalLocalTestArguments({
  groups = TEST_GROUPS,
  historicalLocalCases = HISTORICAL_LOCAL_CASES,
} = {}) {
  const { files } = historicalLocalSelection({ groups, historicalLocalCases });
  return files.map((file) => {
    const names = historicalLocalCases
      .filter((entry) => entry.file === file)
      .map((entry) => escapeRegex(entry.name));
    return [
      "--test",
      "--test-reporter=tap",
      `--test-name-pattern=^(?:${names.join("|")})$`,
      file,
    ];
  });
}

export function validateHistoricalLocalTap({ file, expectedCases, tap }) {
  if (typeof file !== "string" || !Array.isArray(expectedCases) || typeof tap !== "string") {
    throw new Error("historical local result validation requires file, cases, and TAP output");
  }
  const expectedByName = new Map();
  for (const expectedCase of expectedCases) {
    if (expectedCase?.file !== file || typeof expectedCase.name !== "string") {
      throw new Error(`historical local result has invalid expected identity for ${file}`);
    }
    if (expectedByName.has(expectedCase.name)) {
      throw new Error(`historical local result has duplicate expected identity for ${file}`);
    }
    const expectedStatus = expectedCase.expectedStatus ?? "pass";
    if (expectedStatus !== "pass" && expectedStatus !== "fail") {
      throw new Error(`historical local result has invalid expected status for ${file}`);
    }
    if (
      expectedStatus === "fail" &&
      (typeof expectedCase.expectedOutputContains !== "string" ||
        expectedCase.expectedOutputContains.length === 0)
    ) {
      throw new Error(`historical local expected failure lacks output marker for ${file}`);
    }
    expectedByName.set(expectedCase.name, {
      expectedStatus,
      expectedOutputContains: expectedCase.expectedOutputContains,
    });
  }

  const results = [];
  const resultPattern = /^(not ok|ok) \d+ - (.*?)(?: # (SKIP|TODO)\b.*)?$/gimu;
  for (const match of tap.matchAll(resultPattern)) {
    results.push({
      name: match[2],
      status: match[3]?.toLowerCase() ?? (match[1] === "ok" ? "pass" : "fail"),
    });
  }

  const problems = [];
  for (const result of results) {
    if (!expectedByName.has(result.name)) {
      problems.push(`unexpected ${result.status}: ${result.name}`);
    }
  }
  for (const [name, expectation] of expectedByName) {
    const matches = results.filter((result) => result.name === name);
    if (matches.length === 0) {
      problems.push(`missing: ${name}`);
      continue;
    }
    if (matches.length !== 1) {
      problems.push(`duplicate (${matches.length}): ${name}`);
      continue;
    }
    const actualStatus = matches[0].status;
    if (actualStatus !== expectation.expectedStatus) {
      problems.push(`expected ${expectation.expectedStatus} but got ${actualStatus}: ${name}`);
      continue;
    }
    if (
      expectation.expectedStatus === "fail" &&
      !tap.includes(expectation.expectedOutputContains)
    ) {
      problems.push(`expected output marker missing: ${name}`);
    }
    if (actualStatus === "skip" || actualStatus === "todo") {
      problems.push(`${actualStatus}: ${name}`);
    }
  }
  if (problems.length > 0) {
    throw new Error(`historical local result invalid for ${file}: ${problems.join("; ")}`);
  }
  return expectedByName.size;
}

export function nodeTestArguments(
  group,
  {
    groups = TEST_GROUPS,
    historicalLocalCases = HISTORICAL_LOCAL_CASES,
  } = {},
) {
  const files = groups[group];
  if (!Array.isArray(files)) {
    throw new Error(`unknown Node test group: ${group}`);
  }
  const args = ["--test"];
  if (group === "current-release") {
    const pattern = historicalLocalSkipPattern({
      groups,
      historicalLocalCases,
    });
    if (pattern !== undefined) {
      args.push(`--test-skip-pattern=${pattern}`);
    }
  }
  args.push(...files);
  return args;
}

export function nodeTestInvocations(group, options = {}) {
  const invocations = [nodeTestArguments(group, options)];
  if (group === "historical-integrity") {
    invocations.push(...historicalLocalTestArguments(options));
  }
  return invocations;
}

export function validateTaxonomy({ discoveredFiles, groups = TEST_GROUPS }) {
  const discovered = [...discoveredFiles].sort();
  const discoveredSet = new Set(discovered);
  if (discoveredSet.size !== discovered.length) {
    throw new Error("duplicate discovered test path");
  }

  const owners = new Map();
  for (const [group, files] of Object.entries(groups)) {
    for (const file of files) {
      const fileOwners = owners.get(file) ?? [];
      fileOwners.push(group);
      owners.set(file, fileOwners);
    }
  }

  const duplicates = [...owners]
    .filter(([, fileOwners]) => fileOwners.length !== 1)
    .map(([file, fileOwners]) => `${file} (${fileOwners.join(", ")})`);
  const unclassified = discovered.filter((file) => !owners.has(file));
  const missing = [...owners.keys()].filter((file) => !discoveredSet.has(file));
  const problems = [];
  if (duplicates.length > 0) {
    problems.push(`duplicate classification: ${duplicates.join("; ")}`);
  }
  if (unclassified.length > 0) {
    problems.push(`unclassified tests: ${unclassified.join("; ")}`);
  }
  if (missing.length > 0) {
    problems.push(`classified tests missing from checkout: ${missing.join("; ")}`);
  }
  if (problems.length > 0) {
    throw new Error(problems.join("\n"));
  }

  return {
    total: discovered.length,
    groups: Object.fromEntries(
      Object.entries(groups).map(([group, files]) => [group, files.length]),
    ),
  };
}

async function discoverTests() {
  return (await readdir(path.join(ROOT, "tests"), { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".tests.mjs"))
    .map((entry) => `tests/${entry.name}`)
    .sort();
}

async function main() {
  const group = process.argv[2];
  const taxonomy = validateTaxonomy({
    discoveredFiles: await discoverTests(),
    groups: TEST_GROUPS,
  });

  if (group === "--check") {
    process.stdout.write(`${JSON.stringify({ status: "PASS", ...taxonomy })}\n`);
    return 0;
  }
  if (group === "historical-replay") {
    process.stderr.write(
      "historical-replay requires an exact historical commit/blob environment; " +
        "current-checkout execution is intentionally unsupported.\n",
    );
    return 2;
  }
  if (group !== "current-release" && group !== "historical-integrity") {
    process.stderr.write(
      "usage: node scripts/run-node-test-group.mjs " +
        "<--check|current-release|historical-integrity|historical-replay>\n",
    );
    return 2;
  }

  const invocations = nodeTestInvocations(group);
  for (const [index, args] of invocations.entries()) {
    const validatesHistoricalLocal = group === "historical-integrity" && index > 0;
    const result = spawnSync(process.execPath, args, {
      cwd: ROOT,
      encoding: validatesHistoricalLocal ? "utf8" : undefined,
      stdio: validatesHistoricalLocal ? ["inherit", "pipe", "pipe"] : "inherit",
    });
    if (result.error) {
      throw result.error;
    }
    if (result.signal) {
      process.stderr.write(`Node test group terminated by ${result.signal}.\n`);
      return 1;
    }
    if (validatesHistoricalLocal) {
      process.stdout.write(result.stdout);
      process.stderr.write(result.stderr);
      const file = args.at(-1);
      try {
        validateHistoricalLocalTap({
          file,
          expectedCases: HISTORICAL_LOCAL_CASES.filter((entry) => entry.file === file),
          tap: result.stdout,
        });
      } catch (error) {
        process.stderr.write(`${error.message}\n`);
        return 1;
      }
      continue;
    }
    if (result.status !== 0) {
      return result.status ?? 1;
    }
  }
  return 0;
}

const isMain =
  process.argv[1] !== undefined &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isMain) {
  process.exitCode = await main();
}
