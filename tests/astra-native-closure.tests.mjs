import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const HISTORICAL_COMMITS = [
  "80c79e9f4be91d730b1b3cdc62d7bf51508895e8",
  "0f8130b023f336d50bdc137ab9c49cf426790e87",
  "2491dd65b4491c0997aeb1fcdaf88777864f326a",
];

const TRACK_B = [
  {
    path: "evals/experiments/trackb-astra-minimal-rebaseline-spike-v1.json",
    bytes: 24625,
    sha256: "e5bf5b84633b9edb4bf2610dedb259b14f7e3b0cd603e26bf9adacbee1c77e52",
  },
  {
    path: "evals/experiments/trackb-astra-stress-falsification-v1.json",
    bytes: 20311,
    sha256: "0c569f75548a62f2148f0d5302e5929d2feb1a9ea1554941857a7e8335044009",
  },
];

const CONTROL_COMPATIBILITY = {
  commit: "80c79e9f4be91d730b1b3cdc62d7bf51508895e8",
  distributionManifest: {
    path: "vendor/source-manifest.json",
    bytes: 37845,
    sha256: "f7866fb42f3336e0bd82f01e0f3940ab8b6a5d5b55e4677b9306e461be3c0158",
  },
  activeCommonCore: {
    path: "evals/candidates/interaction-safety-core-v8.md",
    sha256: "41b3f8435c6077a9289e0c9d3315aa00d68a96e2e9add7168de6bb42f9730aea",
  },
  selection: {
    canonicalization: "ordinal-sorted localPath=sha256 UTF-8 lines joined by LF without trailing LF",
    activeSkillNames: ["design", "handoff", "project", "spec", "ticket", "visual-check"],
    wholeFileCount: 64,
    sha256: "f4a3c7fbacd8d6f8cfb1b958c094e73f5ba739a1bb633d3fff5614e34b8a7587",
  },
};

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

test("active distribution is the minimal Astra Independent Judgment identity", async () => {
  const manifest = JSON.parse(
    await readFile(path.join(ROOT, "vendor", "source-manifest.json"), "utf8"),
  );
  const core = await readFile(path.join(ROOT, "astra-judgment-core.md"));
  const coreText = core.toString("utf8");

  assert.deepEqual(manifest.release, {
    name: "JOENESS",
    version: "0.2-astra-judgment",
    entrypoint: "JOENESS.ps1",
  });
  assert.deepEqual(manifest.target, { model: "gpt-6-astra", reasoningEffort: "xhigh" });
  assert.equal(manifest.runtimeMode, "common-core");
  assert.deepEqual(manifest.activeCommonCore, {
    path: "astra-judgment-core.md",
    sha256: sha256(core),
  });
  assert.deepEqual(manifest.managedRuntimeFiles, []);
  assert.deepEqual(manifest.publicSkills, []);
  assert.deepEqual(manifest.defaultVendors, []);
  assert.equal(manifest.pluginRouting, null);
  assert.equal(Object.hasOwn(manifest, "evaluation"), false);
  assert.deepEqual(Object.keys(manifest).sort(), [
    "activeCommonCore",
    "compatibility",
    "defaultVendors",
    "managedRuntimeFiles",
    "pluginRouting",
    "publicSkills",
    "release",
    "runtimeMode",
    "schemaVersion",
    "target",
  ]);
  assert.deepEqual(Object.keys(manifest.compatibility), ["installIdentities"]);
  assert.deepEqual(manifest.compatibility.installIdentities.controlSixSkill, CONTROL_COMPATIBILITY);

  assert.equal(core.includes(13), false, "active core must be LF-only");
  assert.equal(core.at(-1), 10, "active core must end in LF");
  assert.match(coreText, /evidence to evaluate, not automatic corrections/iu);
  assert.match(coreText, /Do not change a prior conclusion merely because the user pushes back/iu);
  assert.match(coreText, /Explicit user decisions control where the user has authority/iu);
  assert.match(coreText, /Do not optimize for agreement/iu);
  assert.doesNotMatch(coreText, /JOEFLOW|JOEDESIGN|Figma|UI UX Pro Max|stage framework/iu);
});

test("TrackB evidence is preserved byte-for-byte", async () => {
  for (const identity of TRACK_B) {
    const bytes = await readFile(path.join(ROOT, ...identity.path.split("/")));
    assert.equal(bytes.length, identity.bytes, identity.path);
    assert.equal(sha256(bytes), identity.sha256, identity.path);
  }
});

test("historical closure identities remain readable while historical payloads stay inactive", async () => {
  for (const commit of HISTORICAL_COMMITS) {
    const { stdout } = await execFileAsync("git", ["cat-file", "-t", commit], {
      cwd: ROOT,
      encoding: "utf8",
    });
    assert.equal(stdout.trim(), "commit", commit);
  }

  const kernel = await readFile(
    path.join(ROOT, "evals", "candidates", "joeness-lean-kernel-v1.md"),
  );
  assert.equal(kernel.length, 1690);
  assert.equal(
    sha256(kernel),
    "0727f159bb33f67d40e4e0a1f1f391f76f96a6d980f7e1e6177df193208c3054",
  );

  const historicalBroadCore = await readFile(path.join(ROOT, "common-core.md"), "utf8");
  assert.doesNotMatch(historicalBroadCore, /^# JOENESS — Independent Judgment$/mu);
});
