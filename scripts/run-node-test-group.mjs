import { spawnSync } from "node:child_process";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const TEST_GROUPS = Object.freeze({
  "current-release": Object.freeze([
    "tests/authority-role-separated-evaluator-turn.tests.mjs",
    "tests/codex-app-server-collector.tests.mjs",
    "tests/common-core-coding-ab.tests.mjs",
    "tests/common-core-v1-v2-ab.tests.mjs",
    "tests/design-frontend-hybrid-routing.tests.mjs",
    "tests/design-frontend-routing.tests.mjs",
    "tests/design-vendor-integrity.tests.mjs",
    "tests/design-visual-m2-b1-runner.tests.mjs",
    "tests/design-visual-m2.tests.mjs",
    "tests/fresh-evaluator-turn.tests.mjs",
    "tests/joeness-m4-direct-user-delegation-eval.tests.mjs",
    "tests/joeness-m4-direct-user-delegation-live.tests.mjs",
    "tests/lean-kernel-contract.tests.mjs",
    "tests/node-test-group-runner.tests.mjs",
    "tests/project-aware-lean-ab.tests.mjs",
    "tests/skill-contracts.tests.mjs",
    "tests/thin-hybrid-core.tests.mjs",
    "tests/ticket-evaluator-provenance.tests.mjs",
    "tests/ticket-m1b-fixture.tests.mjs",
    "tests/ticket-verdict.tests.mjs",
  ]),
  "historical-integrity": Object.freeze([
    "tests/joeness-m4-historical-integrity.tests.mjs",
  ]),
  "historical-replay": Object.freeze([
    "tests/joeness-m4-authority-behavior-eval.tests.mjs",
    "tests/joeness-m4-authority-behavior-live.tests.mjs",
    "tests/joeness-m4-authority-structured-output-eval.tests.mjs",
    "tests/joeness-m4-authority-structured-output-live.tests.mjs",
    "tests/joeness-m4-pinned-load-control-eval.tests.mjs",
    "tests/joeness-m4-pinned-load-control-live.tests.mjs",
    "tests/joeness-m4-superpowers-eval.tests.mjs",
    "tests/joeness-m4-superpowers-live.tests.mjs",
    "tests/joeness-m4-transport-control-eval.tests.mjs",
    "tests/joeness-m4-transport-control-live.tests.mjs",
  ]),
});

export const HISTORICAL_LOCAL_CASES = Object.freeze([
  Object.freeze({
    file: "tests/codex-app-server-collector.tests.mjs",
    name: "paired v1 artifacts and blocked controls remain valid after recovery",
  }),
  Object.freeze({
    file: "tests/common-core-v1-v2-ab.tests.mjs",
    name: "collector raw validation rejects post-capture evidence, hash, and review mutation",
  }),
  Object.freeze({
    file: "tests/project-aware-lean-ab.tests.mjs",
    name: "smoke validates frozen candidate identity and the six-session contract without calling Codex",
  }),
]);

function escapeRegex(value) {
  return value.replace(/[\\^$.*+?()[\]{}|]/gu, "\\$&");
}

function historicalLocalSkipPattern({ groups, historicalLocalCases }) {
  const currentReleaseFiles = new Set(groups["current-release"] ?? []);
  const identities = new Set();
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
    if (!currentReleaseFiles.has(entry.file)) {
      throw new Error(`historical local case file is not current-release: ${entry.file}`);
    }
    const identity = `${entry.file}\0${entry.name}`;
    if (identities.has(identity)) {
      throw new Error(`duplicate historical local case: ${entry.file} :: ${entry.name}`);
    }
    identities.add(identity);
    names.push(escapeRegex(entry.name));
  }
  if (names.length === 0) {
    return undefined;
  }
  return `^(?:${names.join("|")})$`;
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

  const result = spawnSync(process.execPath, nodeTestArguments(group), {
    cwd: ROOT,
    stdio: "inherit",
  });
  if (result.error) {
    throw result.error;
  }
  if (result.signal) {
    process.stderr.write(`Node test group terminated by ${result.signal}.\n`);
    return 1;
  }
  return result.status ?? 1;
}

const isMain =
  process.argv[1] !== undefined &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isMain) {
  process.exitCode = await main();
}
