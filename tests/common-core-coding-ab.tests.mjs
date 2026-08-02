import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  LITE_RUN_MODES,
  RUN_MODES,
  V9_RUN_MODES,
  V10_RUN_MODES,
  assertNoCredentialLeak,
  assertNoSymlinks,
  assertSafeImplementationFiles,
  assertSafeRelativePath,
  buildGraderNodeArgs,
  buildChildEnvironment,
  buildCodexArgs,
  buildLiteCaseCatalog,
  buildSubjectPrompt,
  claimsAutonomousTestExecution,
  copyIsolatedCodexHome,
  loadCaseCatalog,
  materializeCase,
  parseCli,
  parseCodexJsonl,
  runSmoke,
  validatePatchEvidence,
  writeExclusiveJson,
} from "../evals/support/run-common-core-coding-ab.mjs";

const EXPECTED_MODES = [
  "run-v1-coding-ab-r1",
  "run-v2-coding-ab-r1",
  "run-v2-coding-ab-r2",
  "run-v1-coding-ab-r2",
];

const EXPECTED_V9_MODES = [
  "run-v1-coding-ab-v9-r1",
  "run-v2-coding-ab-v9-r1",
  "run-v2-coding-ab-v9-r2",
  "run-v1-coding-ab-v9-r2",
];

const EXPECTED_V10_MODES = [
  "run-v1-coding-ab-v10-r1",
  "run-v2-coding-ab-v10-r1",
  "run-v2-coding-ab-v10-r2",
  "run-v1-coding-ab-v10-r2",
];

const EXPECTED_LITE_MODES = [
  "run-lite-control-r1",
  "run-lite-candidate-r1",
  "run-lite-candidate-r2",
  "run-lite-control-r2",
];

test("only repaired coding modes use the unelevated Windows sandbox override", () => {
  assert.deepEqual(RUN_MODES, EXPECTED_MODES);
  assert.deepEqual(V9_RUN_MODES, EXPECTED_V9_MODES);
  assert.deepEqual(V10_RUN_MODES, EXPECTED_V10_MODES);
  for (const mode of EXPECTED_MODES) {
    assert.ok(
      !buildCodexArgs(
        "C:\\fixture",
        "C:\\evidence\\final.txt",
        mode,
      ).includes('windows.sandbox="unelevated"'),
    );
  }
  for (const mode of EXPECTED_V9_MODES) {
    assert.deepEqual(parseCli([mode]), { mode });
    assert.ok(
      buildCodexArgs(
        "C:\\fixture",
        "C:\\evidence\\final.txt",
        mode,
      ).includes('windows.sandbox="unelevated"'),
    );
  }
  for (const mode of EXPECTED_V10_MODES) {
    assert.ok(
      buildCodexArgs(
        "C:\\fixture",
        "C:\\evidence\\final.txt",
        mode,
      ).includes('windows.sandbox="unelevated"'),
    );
  }
});

test("CLI exposes exactly two repetitions per candidate", () => {
  assert.deepEqual(RUN_MODES, EXPECTED_MODES);
  assert.deepEqual(parseCli(["smoke"]), { mode: "smoke" });
  for (const mode of EXPECTED_MODES) {
    assert.deepEqual(parseCli([mode]), { mode });
  }
  for (const mode of EXPECTED_V10_MODES) {
    assert.deepEqual(parseCli([mode]), { mode });
  }
  assert.throws(() => parseCli(["run-v1-coding-ab-r3"]), /usage:/);
});

test("Lite modes use ABBA order and a rough two-case profile", async () => {
  assert.deepEqual(LITE_RUN_MODES, EXPECTED_LITE_MODES);
  for (const mode of EXPECTED_LITE_MODES) {
    assert.deepEqual(parseCli([mode]), { mode });
    assert.ok(
      buildCodexArgs("C:\\fixture", "C:\\final.txt", mode).includes(
        'windows.sandbox="unelevated"',
      ),
    );
  }
  const full = await loadCaseCatalog();
  const lite = buildLiteCaseCatalog(full);
  assert.deepEqual(
    lite.cases.map(({ id }) => id),
    ["maintenance-shared-parser", "frontend-responsive-accessible"],
  );
  assert.equal(full.cases.length, 3);
  assert.equal(
    lite.cases[0].prompt,
    "limit 파싱 버그를 고쳐줘. 기존 호출부 API와 의존성은 그대로 유지해.",
  );
  assert.equal(
    lite.cases[1].prompt,
    "이 프로젝트 브라우저를 모바일과 데스크톱에서 실제로 쓸 수 있게 완성해줘. 기존 제목과 의존성 없는 구성을 유지해.",
  );
});

test("Lite outcome grader replays recorded rough frontend diffs without exact IDs", async () => {
  const repositoryRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
  );
  const catalog = buildLiteCaseCatalog(await loadCaseCatalog());
  const item = catalog.cases.find(
    ({ id }) => id === "frontend-responsive-accessible",
  );
  const grader = item.hiddenFiles["hidden-grade.mjs"];
  assert.doesNotMatch(grader, /menu-toggle|site-nav/u);

  for (const resultName of [
    "run-lite-control-r1.json",
    "run-lite-candidate-r1.json",
    "run-lite-candidate-r2.json",
    "run-lite-control-r2.json",
  ]) {
    const result = JSON.parse(
      await readFile(
        path.join(repositoryRoot, "evals", "coding", "results", resultName),
        "utf8",
      ),
    );
    const evidence = result.cases.find(({ caseId }) => caseId === item.id);
    assert.equal(evidence.diff.truncated, false);
    assert.equal(Buffer.byteLength(evidence.diff.text), evidence.diff.bytes);
    assert.equal(
      createHash("sha256").update(evidence.diff.text).digest("hex"),
      evidence.diff.sha256,
    );
    const subject = buildSubjectPrompt(item);
    assert.equal(subject.visibleFilesSha256, evidence.visibleFilesSha256);
    assert.equal(
      createHash("sha256").update(subject.text).digest("hex"),
      evidence.promptSha256,
    );

    const ownedRoot = await mkdtemp(path.join(tmpdir(), "lite-regrade-"));
    try {
      const materialized = await materializeCase(item, ownedRoot);
      const candidate = await readFile(
        path.join(repositoryRoot, ...result.candidate.path.split("/")),
      );
      assert.equal(
        createHash("sha256").update(candidate).digest("hex"),
        result.candidate.actualSha256,
      );
      await writeFile(path.join(materialized.workspace, "AGENTS.md"), candidate);
      const patchPath = path.join(ownedRoot, "recorded.patch");
      await writeFile(patchPath, evidence.diff.text);
      const check = spawnSync(
        "git",
        ["-c", "core.autocrlf=false", "apply", "--check", patchPath],
        {
        cwd: materialized.workspace,
        encoding: "utf8",
        },
      );
      assert.equal(check.status, 0, check.stderr);
      const apply = spawnSync(
        "git",
        ["-c", "core.autocrlf=false", "apply", patchPath],
        {
          cwd: materialized.workspace,
          encoding: "utf8",
        },
      );
      assert.equal(apply.status, 0, apply.stderr);

      for (const [relative, expected] of Object.entries(evidence.fileTree.files)) {
        const bytes = await readFile(
          path.join(materialized.workspace, ...relative.split("/")),
        );
        assert.equal(bytes.length, expected.bytes, `${resultName}: ${relative}`);
        assert.equal(
          createHash("sha256").update(bytes).digest("hex"),
          expected.sha256,
          `${resultName}: ${relative}`,
        );
      }

      await mkdir(materialized.hiddenDirectory);
      await writeFile(materialized.hiddenGrader, grader);
      const grade = spawnSync(
        process.execPath,
        buildGraderNodeArgs(
          ["hidden-grade.mjs", materialized.workspace],
          [materialized.hiddenDirectory, materialized.workspace],
        ),
        {
          cwd: materialized.hiddenDirectory,
          encoding: "utf8",
          env: { ...process.env, NO_COLOR: "1" },
        },
      );
      assert.equal(grade.status, 0, `${resultName}: ${grade.stderr}`);
      assert.match(grade.stdout, /hidden responsive outcome: pass/u);
    } finally {
      await rm(ownedRoot, { recursive: true, force: true });
    }
  }
});

test("Lite regrade report refuses promotion without an observed Control risk fix", async () => {
  const repositoryRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
  );
  const report = JSON.parse(
    await readFile(
      path.join(
        repositoryRoot,
        "evals",
        "experiments",
        "common-core-lite-coding-ab-v2.json",
      ),
      "utf8",
    ),
  );
  assert.equal(report.status, "complete");
  assert.equal(report.decision, "no-observed-benefit-do-not-promote");
  assert.equal(report.activationChanged, false);
  assert.equal(report.additionalModelCalls, 0);
  assert.equal(report.additionalModelTokens, 0);
  assert.deepEqual(report.regrade.outcomePasses, {
    control: { maintenance: 2, frontend: 2, possible: 4 },
    lite: { maintenance: 2, frontend: 2, possible: 4 },
  });
  assert.equal(report.regrade.controlRiskFailuresFixedByLite, 0);
  const predecessor = await readFile(
    path.join(repositoryRoot, ...report.predecessor.path.split("/")),
  );
  assert.equal(
    createHash("sha256").update(predecessor).digest("hex"),
    report.predecessor.sha256,
  );
  for (const evidence of report.evidence) {
    const bytes = await readFile(
      path.join(repositoryRoot, ...evidence.path.split("/")),
    );
    assert.equal(
      createHash("sha256").update(bytes).digest("hex"),
      evidence.sha256,
      evidence.path,
    );
  }
});

test("Codex invocation exposes only the internal patch surface", () => {
  const args = buildCodexArgs("C:\\fixture", "C:\\evidence\\final.txt");
  assert.deepEqual(args.slice(0, 5), [
    "exec",
    "--ignore-user-config",
    "--ignore-rules",
    "--ephemeral",
    "--json",
  ]);
  assert.ok(args.includes("gpt-5.6-sol"));
  assert.ok(args.includes("workspace-write"));
  assert.ok(args.includes('approval_policy="never"'));
  assert.ok(args.includes('sandbox_workspace_write.network_access=false'));
  assert.ok(args.includes('model_reasoning_effort="low"'));
  assert.ok(args.includes('service_tier="default"'));
  for (const feature of [
    "apps",
    "plugins",
    "multi_agent",
    "hooks",
    "skill_search",
    "shell_tool",
    "unified_exec",
    "code_mode",
    "code_mode_host",
    "browser_use",
    "in_app_browser",
    "computer_use",
    "standalone_web_search",
    "image_generation",
    "workspace_dependencies",
  ]) {
    const index = args.indexOf(feature);
    assert.ok(index > 0);
    assert.equal(args[index - 1], "--disable");
  }
  assert.ok(args.includes("features.shell_tool=false"));
  assert.equal(args.includes("apply_patch_freeform"), false);
  assert.equal(args.at(-1), "-");
});

test("only auth and Windows sandbox identity enter isolated CODEX_HOME", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "coding-ab-home-"));
  const source = path.join(root, "source");
  const destination = path.join(root, "isolated");
  await mkdir(path.join(source, ".sandbox"), { recursive: true });
  await mkdir(path.join(source, ".sandbox-secrets"), { recursive: true });
  await mkdir(path.join(source, "plugins"), { recursive: true });
  await mkdir(path.join(source, "skills"), { recursive: true });
  await writeFile(path.join(source, "auth.json"), "{}");
  await writeFile(path.join(source, "cap_sid"), "{}");
  await writeFile(path.join(source, ".sandbox", "setup_marker.json"), "{}");
  await writeFile(
    path.join(source, ".sandbox-secrets", "sandbox_users.json"),
    "{}",
  );
  await writeFile(path.join(source, "config.toml"), "instructions='leak'");
  await writeFile(path.join(source, "plugins", "plugin.txt"), "leak");
  await writeFile(path.join(source, "skills", "skill.txt"), "leak");

  const copied = await copyIsolatedCodexHome(source, destination);

  assert.deepEqual(copied, [
    "auth.json",
    "cap_sid",
    ".sandbox/setup_marker.json",
    ".sandbox-secrets/sandbox_users.json",
  ]);
  await assert.rejects(readFile(path.join(destination, "config.toml")), /ENOENT/);
  await assert.rejects(readFile(path.join(destination, "plugins")), /ENOENT/);
  await assert.rejects(readFile(path.join(destination, "skills")), /ENOENT/);
});

test("isolated CODEX_HOME rejects identity files reached through a junction", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "coding-ab-home-link-"));
  const source = path.join(root, "source");
  const outside = path.join(root, "outside");
  const destination = path.join(root, "isolated");
  await mkdir(path.join(source, ".sandbox"), { recursive: true });
  await mkdir(outside);
  await writeFile(path.join(source, "auth.json"), "{}");
  await writeFile(path.join(source, "cap_sid"), "{}");
  await writeFile(path.join(source, ".sandbox", "setup_marker.json"), "{}");
  await writeFile(path.join(outside, "sandbox_users.json"), "{}");
  await symlink(outside, path.join(source, ".sandbox-secrets"), "junction");

  await assert.rejects(
    copyIsolatedCodexHome(source, destination),
    /symbolic link/,
  );
});

test("model HOME is an empty identity directory, not the credential directory", () => {
  const env = buildChildEnvironment(
    { Path: "C:\\bin", CODEX_TOKEN: "must-not-pass" },
    "C:\\credential-home",
    "C:\\identity-home",
  );
  assert.equal(env.CODEX_HOME, "C:\\credential-home");
  assert.equal(env.HOME, "C:\\identity-home");
  assert.equal(env.USERPROFILE, "C:\\identity-home");
  assert.equal(env.CODEX_TOKEN, undefined);
});

test("case catalog has three cases and keeps hidden graders off disk until grading", async () => {
  const catalog = await loadCaseCatalog();
  assert.deepEqual(
    catalog.cases.map(({ id }) => id),
    [
      "feature-immutable-update",
      "maintenance-shared-parser",
      "frontend-responsive-accessible",
    ],
  );

  const root = await mkdtemp(path.join(tmpdir(), "coding-ab-case-"));
  const materialized = await materializeCase(catalog.cases[0], root);
  const relative = path.relative(
    materialized.workspace,
    materialized.hiddenGrader,
  );
  assert.ok(relative.startsWith(`..${path.sep}`));
  await assert.rejects(
    readFile(materialized.hiddenGrader),
    /ENOENT/,
  );
  await assert.rejects(
    readFile(path.join(materialized.workspace, "hidden-grade.mjs")),
    /ENOENT/,
  );
});

test("subject prompt deterministically includes only visible files and allowed paths", async () => {
  const { cases } = await loadCaseCatalog();
  for (const item of cases) {
    const subject = buildSubjectPrompt(item);
    const payload = JSON.parse(subject.text);
    const visibleFiles = Object.fromEntries(
      Object.entries(item.files).sort(([left], [right]) =>
        left.localeCompare(right),
      ),
    );
    const visibleJson = JSON.stringify(visibleFiles);
    assert.deepEqual(Object.keys(payload), [
      "schemaVersion",
      "executionSurface",
      "task",
      "allowedChangedPaths",
      "visibleFiles",
    ]);
    assert.deepEqual(payload.visibleFiles, visibleFiles);
    assert.deepEqual(
      payload.allowedChangedPaths,
      [...item.allowedChangedPaths].sort(),
    );
    assert.equal(
      subject.visibleFilesSha256,
      createHash("sha256").update(visibleJson).digest("hex"),
    );
    assert.equal(subject.visibleFilesBytes, Buffer.byteLength(visibleJson));
    assert.doesNotMatch(item.prompt, /\brun\b|실행/iu);
    for (const hidden of Object.values(item.hiddenFiles)) {
      assert.equal(subject.text.includes(hidden), false);
    }
    for (const solution of Object.values(item.smokeSolution)) {
      assert.equal(subject.text.includes(solution), false);
    }
    assert.equal(Object.hasOwn(payload, "visibleCommand"), false);
    assert.equal(Object.hasOwn(payload, "hiddenCommand"), false);
    assert.equal(Object.hasOwn(payload, "smokeSolution"), false);
  }
});

test("unsafe fixture paths and post-run symlinks are rejected", async () => {
  for (const unsafe of ["../escape", "/absolute", "C:\\escape", "a\\..\\b", ""]) {
    assert.throws(() => assertSafeRelativePath(unsafe), /unsafe relative path/);
  }

  const root = await mkdtemp(path.join(tmpdir(), "coding-ab-link-"));
  const target = path.join(root, "target");
  const link = path.join(root, "link");
  await mkdir(target);
  await symlink(target, link, "junction");
  await assert.rejects(assertNoSymlinks(root), /symbolic link/);
});

test("independent graders use Node permissions and reject network-capable implementation code", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "coding-ab-grade-"));
  const source = path.join(root, "src", "target.mjs");
  await mkdir(path.dirname(source), { recursive: true });
  const args = buildGraderNodeArgs(
    ["--test", "test/visible.test.mjs"],
    [root],
  );
  assert.equal(args[0], "--permission");
  assert.ok(args.some((value) => value === `--allow-fs-read=${root}`));
  assert.equal(args.includes("--allow-child-process"), false);
  await writeFile(source, 'import "node:http";\n');
  await assert.rejects(
    assertSafeImplementationFiles(root, ["src/target.mjs"]),
    /forbidden capability/,
  );
  await writeFile(source, "export const value = 1;\n");
  await assert.doesNotReject(
    assertSafeImplementationFiles(root, ["src/target.mjs"]),
  );
});

test("Codex JSONL parser accepts a started then completed file_change lifecycle", () => {
  const parsed = parseCodexJsonl(
    [
      JSON.stringify({ type: "thread.started", thread_id: "thread-1" }),
      JSON.stringify({ type: "turn.started" }),
      JSON.stringify({
        type: "item.started",
        item: {
          id: "item-1",
          type: "file_change",
          status: "in_progress",
        },
      }),
      JSON.stringify({
        type: "item.completed",
        item: {
          id: "item-1",
          type: "file_change",
          status: "completed",
          changes: [{ path: "src/todos.mjs", kind: "update" }],
        },
      }),
      JSON.stringify({
        type: "item.completed",
        item: { id: "item-2", type: "agent_message", text: "Implemented." },
      }),
      JSON.stringify({
        type: "turn.completed",
        usage: {
          input_tokens: 120,
          cached_input_tokens: 20,
          output_tokens: 30,
          reasoning_output_tokens: 10,
        },
      }),
      "",
    ].join("\n"),
  );

  assert.deepEqual(parsed, {
    threadId: "thread-1",
    finalMessage: "Implemented.",
    eventCount: 6,
    itemTypes: ["file_change", "agent_message"],
    fileChangePaths: ["src/todos.mjs"],
    patchOnly: true,
    inputTokens: 120,
    cachedInputTokens: 20,
    outputTokens: 30,
    reasoningOutputTokens: 10,
    totalTokens: 150,
  });
  assert.throws(
    () => parseCodexJsonl(`${JSON.stringify({ type: "unknown" })}\n`),
    /unsupported Codex JSON event/,
  );
});

test("Codex JSONL parser rejects external tools, failures, and invalid lifecycle", () => {
  const event = (type, extra = {}) => JSON.stringify({ type, ...extra });
  const thread = event("thread.started", { thread_id: "thread-1" });
  const turn = event("turn.started");
  const terminal = event("turn.completed", {
    usage: { input_tokens: 1, output_tokens: 1 },
  });
  for (const type of [
    "command_execution",
    "mcp_tool_call",
    "web_search",
    "dynamic_tool_call",
  ]) {
    assert.throws(
      () =>
        parseCodexJsonl(
          [
            thread,
            turn,
            event("item.completed", { item: { id: "item-1", type } }),
            terminal,
          ].join("\n"),
        ),
      /forbidden Codex item type/,
    );
  }
  for (const item of [
    {
      id: "file-1",
      type: "file_change",
      status: "failed",
      changes: [{ path: "src/target.mjs", kind: "update" }],
    },
    {
      id: "file-2",
      type: "file_change",
      status: "completed",
      changes: [{ path: "src/target.mjs", kind: "move" }],
    },
  ]) {
    assert.throws(
      () =>
        parseCodexJsonl(
          [
            thread,
            turn,
            event("item.completed", { item }),
            terminal,
          ].join("\n"),
        ),
      /file_change evidence/,
    );
  }
  for (const failure of ["error", "turn.failed"]) {
    assert.throws(
      () => parseCodexJsonl([thread, turn, event(failure)].join("\n")),
      /terminal failure event/,
    );
  }
  const invalidStreams = [
    [thread, terminal],
    [turn, thread, terminal],
    [thread, turn, terminal, event("item.completed", {
      item: { id: "late", type: "agent_message", text: "late" },
    })],
    [thread, turn, terminal, terminal],
    [thread, turn, event("item.completed", {
      usage: {},
      item: { id: "usage", type: "agent_message", text: "bad" },
    }), terminal],
  ];
  for (const stream of invalidStreams) {
    assert.throws(
      () => parseCodexJsonl(stream.join("\n")),
      /lifecycle|usage is only allowed|terminal/,
    );
  }
});

test("Codex JSONL parser records built-in shell evidence only when explicitly allowed", () => {
  const parsed = parseCodexJsonl(
    [
      JSON.stringify({ type: "thread.started", thread_id: "thread-shell" }),
      JSON.stringify({ type: "turn.started" }),
      JSON.stringify({
        type: "item.completed",
        item: {
          id: "command-1",
          type: "command_execution",
          command: "node --test",
          status: "completed",
          exit_code: 0,
          aggregated_output: "2 tests passed",
        },
      }),
      JSON.stringify({
        type: "item.completed",
        item: { id: "message-1", type: "agent_message", text: "Verified." },
      }),
      JSON.stringify({
        type: "turn.completed",
        usage: { input_tokens: 12, cached_input_tokens: 4, output_tokens: 3 },
      }),
    ].join("\n"),
    { allowCommandExecution: true },
  );

  assert.equal(parsed.patchOnly, false);
  assert.deepEqual(parsed.commandExecutions, [
    {
      command: "node --test",
      status: "completed",
      exitCode: 0,
      output: "2 tests passed",
    },
  ]);
});

test("patch evidence requires the exact allowed workspace paths", () => {
  const workspace = path.resolve("C:\\fixture");
  assert.deepEqual(
    validatePatchEvidence({
      workspace,
      reportedPaths: [path.join(workspace, "src", "target.mjs")],
      gitPaths: ["src/target.mjs"],
      snapshotPaths: ["src/target.mjs"],
      allowedPaths: ["src/target.mjs"],
    }),
    ["src/target.mjs"],
  );
  for (const reportedPath of [
    "../escape.mjs",
    path.resolve(workspace, "..", "source.mjs"),
    ".git/config",
    "AGENTS.md",
    "grader/hidden-grade.mjs",
  ]) {
    assert.throws(
      () =>
        validatePatchEvidence({
          workspace,
          reportedPaths: [reportedPath],
          gitPaths: [reportedPath],
          snapshotPaths: [reportedPath],
          allowedPaths: ["src/target.mjs"],
        }),
      /patch evidence/,
    );
  }
});

test("credential scan covers any evidence bytes, including diff and changed files", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "coding-ab-secret-"));
  const auth = path.join(root, "auth.json");
  const secret = "secret-token-1234567890";
  await writeFile(auth, JSON.stringify({ access_token: secret }));
  await assert.rejects(
    assertNoCredentialLeak(auth, [
      Buffer.from("stdout"),
      Buffer.from(`diff:${secret}`),
    ]),
    /credential-shaped auth content leaked/,
  );
  await assert.doesNotReject(
    assertNoCredentialLeak(auth, [Buffer.from("clean evidence")]),
  );
});

test("no-shell completion claims distinguish a disclosure from a false pass claim", () => {
  assert.equal(
    claimsAutonomousTestExecution("Implemented. I did not run tests because shell is disabled."),
    false,
  );
  assert.equal(
    claimsAutonomousTestExecution("Implemented and all tests passed."),
    true,
  );
  assert.equal(
    claimsAutonomousTestExecution("테스트를 실행했고 모두 통과했습니다."),
    true,
  );
  assert.equal(
    claimsAutonomousTestExecution("Verified the tests after the patch."),
    true,
  );
  assert.equal(
    claimsAutonomousTestExecution("I did not run tests; all tests passed."),
    true,
  );
});

test("result writer never overwrites evidence", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "coding-ab-result-"));
  const destination = path.join(root, "result.json");
  await writeExclusiveJson(destination, { ok: true });
  await assert.rejects(
    writeExclusiveJson(destination, { ok: false }),
    /EEXIST/,
  );
});

test("result writer rejects a symbolic parent instead of escaping its directory", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "coding-ab-result-link-"));
  const outside = path.join(root, "outside");
  const linkedParent = path.join(root, "results");
  await mkdir(outside);
  await symlink(outside, linkedParent, "junction");

  await assert.rejects(
    writeExclusiveJson(path.join(linkedParent, "result.json"), { ok: false }),
    /symbolic link/,
  );
  await assert.rejects(readFile(path.join(outside, "result.json")), /ENOENT/);
});

test("diagnostic mode writes one sanitized patch-evidence failure receipt", async () => {
  const runner = await import("../evals/support/run-common-core-coding-ab.mjs");
  assert.equal(
    typeof runner.writePatchEvidenceFailureReceipt,
    "function",
    "diagnostic failure receipt writer must exist",
  );
  assert.equal(
    runner.DIAGNOSTIC_MODE,
    "diagnose-v1-coding-patch-evidence-r1",
  );
  assert.deepEqual(parseCli([runner.DIAGNOSTIC_MODE]), {
    mode: runner.DIAGNOSTIC_MODE,
  });

  const root = await mkdtemp(path.join(tmpdir(), "coding-ab-diagnostic-"));
  const authFile = path.join(root, "auth.json");
  const destination = path.join(root, "receipts", "failure.json");
  await writeFile(
    authFile,
    JSON.stringify({ access_token: "secret-token-1234567890" }),
  );
  const workspace = path.join(root, "case-root", "workspace");
  let error;
  try {
    validatePatchEvidence({
      workspace,
      reportedPaths: [],
      gitPaths: ["src/outside.mjs"],
      snapshotPaths: ["src/target.mjs"],
      allowedPaths: ["src/target.mjs"],
    });
    assert.fail("patch evidence rejection was expected");
  } catch (caught) {
    error = caught;
  }
  assert.match(error.message, /patch evidence/);

  await runner.writePatchEvidenceFailureReceipt({
    destination,
    authFile,
    mode: "diagnose-v1-coding-patch-evidence-r1",
    runId: "diagnostic-run-id",
    sourceHead: "0123456789abcdef",
    candidateId: "v1",
    candidateSha256: "abcdef0123456789",
    caseId: "feature-immutable-update",
    caseIndex: 0,
    codexProcess: {
      exitCode: 0,
      signal: null,
      wallClockMs: 1234,
      stdout: Buffer.from('{"type":"turn.completed"}\n'),
    },
    diff: {
      bytes: 12,
      sha256: "diff-sha256",
    },
    error,
  });

  assert.deepEqual(JSON.parse(await readFile(destination, "utf8")), {
    schemaVersion: 1,
    kind: "common-core-coding-diagnostic-failure-receipt",
    diagnostic: {
      mode: "diagnose-v1-coding-patch-evidence-r1",
      runId: "diagnostic-run-id",
    },
    source: { head: "0123456789abcdef" },
    candidate: { id: "v1", sha256: "abcdef0123456789" },
    case: { id: "feature-immutable-update", index: 0 },
    failureStage: "patch-evidence-validation",
    codex: { exitCode: 0, signal: null, wallClockMs: 1234 },
    evidence: {
      jsonl: {
        bytes: 26,
        sha256:
          createHash("sha256")
            .update('{"type":"turn.completed"}\n')
            .digest("hex"),
      },
      diff: { bytes: 12, sha256: "diff-sha256" },
    },
    patchEvidence: {
      reported: [],
      git: ["src/outside.mjs"],
      snapshot: ["src/target.mjs"],
      allowed: ["src/target.mjs"],
      reportedEmpty: true,
      forbiddenPath: false,
      gitOutsideAllowed: true,
      reportedGitMismatch: true,
      snapshotGitMismatch: true,
    },
  });
});

test("smoke proves every fixture fails before and passes after its reference edit without a model call", async () => {
  const report = await runSmoke();
  assert.equal(report.modelCalls, 0);
  assert.equal(report.cases.length, 3);
  for (const item of report.cases) {
    assert.notEqual(item.before.visible.exitCode, 0);
    assert.notEqual(item.before.hidden.exitCode, 0);
    assert.equal(item.after.visible.exitCode, 0);
    assert.equal(item.after.hidden.exitCode, 0);
  }
  assert.equal(report.parserValidated, true);
});

test("Lite candidate stays bounded independently from the active core", async () => {
  const [control, lite] = await Promise.all([
    readFile(
      new URL("../evals/candidates/no-common-core.md", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../evals/candidates/common-core-lite-v1.md", import.meta.url),
      "utf8",
    ),
  ]);
  assert.equal(control, "\n");
  assert.ok((lite.match(/\S+/gu) ?? []).length <= 200);
  for (const pattern of [
    /smallest complete outcome/iu,
    /current Git status/iu,
    /evidence, not permission/iu,
    /Prevent duplicate effects/iu,
    /claim only checks actually run/iu,
  ]) {
    assert.match(lite, pattern);
  }
  assert.doesNotMatch(lite, /Figma|Apple Design|UI UX Pro Max/iu);
});
