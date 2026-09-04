import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const candidatePath = path.join(
  root,
  "evals",
  "candidates",
  "joeness-lean-kernel-v1.md",
);

function decodeCandidate(bytes) {
  assert.equal(
    bytes.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])),
    false,
    "the candidate must not start with a UTF-8 byte-order mark",
  );
  const candidate = bytes.toString("utf8");

  assert.ok(bytes.length <= 2048, "the Lean Kernel must stay within 2 KiB UTF-8");
  assert.equal(
    Buffer.from(candidate, "utf8").equals(bytes),
    true,
    "the candidate must be valid UTF-8",
  );
  assert.equal(bytes.includes(0x0d), false, "the candidate must contain LF only");
  assert.equal(bytes.at(-1), 0x0a, "the candidate must end with exactly one trailing LF");
  assert.notEqual(bytes.at(-2), 0x0a, "the candidate must end with exactly one trailing LF");

  return candidate;
}

function extractResponsibilities(candidate) {
  const lines = candidate.split("\n");
  assert.equal(lines.at(-1), "", "the candidate structure requires a trailing LF");

  const contentLines = lines.slice(0, -1);
  assert.equal(
    contentLines.length,
    9,
    "policy-bearing content must not exist outside the seven numbered responsibilities",
  );
  assert.equal(contentLines[0], "# JOENESS Lean Kernel", "the candidate title is exact");
  assert.equal(contentLines[1], "", "one blank line separates the title and responsibilities");

  const responsibilities = contentLines.slice(2);
  assert.equal(responsibilities.length, 7, "the kernel has exactly seven responsibilities");
  responsibilities.forEach((responsibility, index) => {
    assert.match(
      responsibility,
      new RegExp(`^${index + 1}\\. \\*\\*[^*]+\\.\\*\\* \\S`, "u"),
      `responsibility ${index + 1} must be one complete numbered line`,
    );
  });
  return responsibilities;
}

test("the Lean Kernel candidate preserves only the seven approved safety responsibilities", async () => {
  assert.equal(
    existsSync(candidatePath),
    true,
    "the additive Lean Kernel candidate must be materialized",
  );

  const bytes = await readFile(candidatePath);
  const candidate = decodeCandidate(bytes);
  const responsibilities = extractResponsibilities(candidate);

  const approvedResponsibilities = [
    ["authority", /platform\/security.*explicit user.*verified (?:project|repository).*tool.*skill.*reference.*reviewer.*cannot expand.*authority.*scope.*completion/is],
    ["current state", /current (?:observation|state).*repository.*artifact.*process.*target.*durable project truth.*(?:override|outrank).*memory.*handoff.*narration.*unverified.*fact/is],
    ["scope", /only changes.*requested outcome.*acceptance.*change\/confirm\/select\/reject\/undo.*instruction.*other feedback.*signal.*not write authority/is],
    ["uncertain external writes", /shared or external state.*pre-write identity.*authority.*outcome is unclear.*read back.*same idempotency key.*do not repeat.*stop/is],
    ["retry and relaunch", /crash.*unexpected exit.*same failure.*do not repeat.*same mechanism.*relaunch automatically.*retry once.*evidence.*cause.*clean or restore.*task-owned.*process.*temp state/is],
    ["evidence", /completion claims.*exact artifact\/version.*target\/state.*observed property.*test\/build\/file existence.*cannot prove.*visual\/runtime\/external.*reread.*final written artifact.*only.*verified/is],
    ["stop", /acceptance checks pass.*stop.*without inventing.*workflow.*docs.*cleanup.*polish.*next steps.*unverified.*blocked.*unresolved.*only when needed/is],
  ];

  approvedResponsibilities.forEach(([name, pattern], index) => {
    assert.match(
      responsibilities[index],
      pattern,
      `responsibility ${index + 1} must preserve ${name}`,
    );
  });

  assert.doesNotMatch(
    candidate,
    /TASKS\.md|roadmap|ledger|milestone|sprint|backlog|ticket lifecycle|implementer|evaluator|reviewer orchestration|fresh-context reviewer|worktree|Figma|Ponytail|Superpowers|UI UX Pro Max|Apple Design|plugin routing|skill routing|JOEDESIGN|JOEFLOW/iu,
    "the kernel must not absorb planning, delivery, design, or capability-routing workflows",
  );
  assert.doesNotMatch(
    candidate,
    /report template|fixed report|exactly \d+ lines|^\s*(?:Evidence|Cause|Handling|Verification|Remaining risk):/imu,
    "the kernel must not impose a fixed reporting schema",
  );
});

test("the contract rejects policy-bearing content outside the seven responsibilities", async () => {
  const candidate = (await readFile(candidatePath, "utf8"));
  const expandedCandidate = `${candidate}Always optimize unrelated code as a general best practice.\n`;

  assert.throws(
    () => extractResponsibilities(expandedCandidate),
    /outside the seven numbered responsibilities/iu,
  );
});

test("the materialization contract rejects a UTF-8 byte-order mark", async () => {
  const bytes = await readFile(candidatePath);
  const withByteOrderMark = Buffer.concat([
    Buffer.from([0xef, 0xbb, 0xbf]),
    bytes,
  ]);

  assert.throws(() => decodeCandidate(withByteOrderMark), /byte-order mark/iu);
});

test("the materialization contract requires exactly one trailing LF", async () => {
  const bytes = await readFile(candidatePath);
  const withExtraTrailingLf = Buffer.concat([bytes, Buffer.from("\n")]);

  assert.throws(() => decodeCandidate(withExtraTrailingLf), /exactly one trailing LF/iu);
});
