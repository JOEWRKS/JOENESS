import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  access,
  lstat,
  mkdir,
  readFile,
  readdir,
  stat,
  writeFile,
} from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  assertNoCredentialLeak,
  buildChildEnvironment,
  copyIsolatedCodexHome,
  parseCodexJsonl,
  writeExclusiveJson,
} from "./run-common-core-coding-ab.mjs";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const defaultContractPath = path.join(
  repositoryRoot,
  "evals",
  "project-aware-lean",
  "contract-v1.json",
);
const processOutputLimit = 4 * 1024 * 1024;
const disabledFeatures = Object.freeze([
  "apps",
  "plugins",
  "multi_agent",
  "hooks",
  "skill_search",
  "skill_mcp_dependency_install",
  "browser_use",
  "browser_use_external",
  "browser_use_full_cdp_access",
  "in_app_browser",
  "computer_use",
  "standalone_web_search",
  "image_generation",
  "workspace_dependencies",
  "tool_suggest",
  "enable_mcp_apps",
  "tool_call_mcp_elicitation",
]);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function containedPath(root, relative) {
  if (
    typeof relative !== "string" ||
    relative.length === 0 ||
    path.isAbsolute(relative)
  ) {
    throw new Error("contract path must be relative");
  }
  const absolute = path.resolve(root, relative);
  const relation = path.relative(root, absolute);
  if (relation === ".." || relation.startsWith(`..${path.sep}`)) {
    throw new Error("contract path escapes repository root");
  }
  return absolute;
}

function parseCli(argv) {
  let mode;
  let runName;
  let contractPath = defaultContractPath;
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--smoke" || value === "--canary") {
      if (mode) throw new Error("only one mode is allowed");
      mode = value.slice(2);
    } else if (value === "--run") {
      if (mode) throw new Error("only one mode is allowed");
      mode = "run";
      runName = argv[index + 1];
      index += 1;
    } else if (value === "--contract") {
      const next = argv[index + 1];
      if (!next) throw new Error("--contract requires a path");
      contractPath = path.resolve(next);
      index += 1;
    } else {
      throw new Error(`unsupported argument: ${value}`);
    }
  }
  if (!mode) throw new Error("one mode is required");
  if (mode === "run" && runName !== "paired-r1") {
    throw new Error("the only scored run is paired-r1");
  }
  return { mode, runName, contractPath };
}

async function absoluteGitCommonDirectory(root) {
  try {
    const output = await runSuccessful(
      "git",
      [
        "-C",
        root,
        "rev-parse",
        "--is-inside-work-tree",
        "--path-format=absolute",
        "--git-common-dir",
      ],
      {},
      "repository identity",
    );
    const [insideWorkTree, commonDirectory] = output.split(/\r?\n/u);
    if (insideWorkTree !== "true" || !commonDirectory) return null;
    return path.resolve(commonDirectory);
  } catch {
    return null;
  }
}

export async function repositoryRootsMatch(contractRoot, runtimeRoot) {
  const expected = path.resolve(contractRoot);
  const actual = path.resolve(runtimeRoot);
  if (expected === actual) return true;
  const [expectedCommonDirectory, actualCommonDirectory] = await Promise.all([
    absoluteGitCommonDirectory(expected),
    absoluteGitCommonDirectory(actual),
  ]);
  return (
    expectedCommonDirectory !== null &&
    expectedCommonDirectory === actualCommonDirectory
  );
}

async function loadContract(contractPath) {
  const contract = JSON.parse(await readFile(contractPath, "utf8"));
  if (
    contract?.schemaVersion !== 1 ||
    contract?.evaluation !== "project-aware-lean-ab-v1" ||
    !Array.isArray(contract?.phases) ||
    contract.phases.length !== 3 ||
    contract?.runtime?.shellEnabled !== true ||
    contract?.runtime?.networkAccess !== false
  ) {
    throw new Error("project-aware Lean contract is invalid");
  }
  const expectedOrders = [
    ["control", "candidate"],
    ["candidate", "control"],
    ["control", "candidate"],
  ];
  if (
    contract.phases.some(
      (phase, index) =>
        JSON.stringify(phase.order) !== JSON.stringify(expectedOrders[index]) ||
        typeof phase.prompt !== "string" ||
        phase.prompt.length === 0,
    )
  ) {
    throw new Error("phase order or prompt contract is invalid");
  }
  if (!(await repositoryRootsMatch(contract.workspace.sourceRoot, repositoryRoot))) {
    throw new Error("contract source root does not match this repository");
  }
  const evaluationRoot = path.resolve(contract.workspace.evaluationRoot);
  const relation = path.relative(repositoryRoot, evaluationRoot);
  if (relation === "" || (!relation.startsWith("..") && !path.isAbsolute(relation))) {
    throw new Error("evaluation root must be outside the source repository");
  }
  return contract;
}

async function readCandidate(contract) {
  const active = await readFile(
    containedPath(repositoryRoot, contract.candidate.activePath),
  );
  const candidate = await readFile(
    containedPath(repositoryRoot, contract.candidate.path),
  );
  const activeSha256 = sha256(active);
  const candidateSha256 = sha256(candidate);
  const matchesActive = active.equals(candidate);
  if (
    candidate.length !== contract.candidate.bytes ||
    candidateSha256 !== contract.candidate.sha256
  ) {
    throw new Error("candidate identity does not match the frozen contract");
  }
  return { active, candidate, activeSha256, candidateSha256, matchesActive };
}

export function buildLifecycleCodexArgs(workspace, finalOutputPath, contract) {
  return [
    "exec",
    "--ignore-user-config",
    "--ignore-rules",
    "--ephemeral",
    "--json",
    ...disabledFeatures.flatMap((feature) => ["--disable", feature]),
    "--model",
    contract.runtime.model,
    "--sandbox",
    contract.runtime.sandbox,
    "-c",
    'windows.sandbox="unelevated"',
    "-c",
    `approval_policy="${contract.runtime.approvalPolicy}"`,
    "-c",
    `sandbox_workspace_write.network_access=${contract.runtime.networkAccess}`,
    "-c",
    "features.shell_tool=true",
    "-c",
    `model_reasoning_effort="${contract.runtime.reasoningEffort}"`,
    "-c",
    `service_tier="${contract.runtime.serviceTier}"`,
    "-c",
    'shell_environment_policy={inherit="core",ignore_default_excludes=false}',
    "-c",
    "notify=[]",
    "--cd",
    workspace,
    "--output-last-message",
    finalOutputPath,
    "-",
  ];
}

export function validateRunEvidence(result, contract) {
  if (
    result?.schemaVersion !== 1 ||
    result?.evaluation !== contract.evaluation ||
    result?.status !== "complete" ||
    result?.source?.unchanged !== true ||
    result.source.beforeHead !== result.source.afterHead ||
    result?.candidate?.sha256 !== contract.candidate.sha256 ||
    result.candidate.matchesActive !== true ||
    result.candidate.protectedAfterRun !== true ||
    !Array.isArray(result.sessions) ||
    result.sessions.length !== 6
  ) {
    throw new Error("run evidence is incomplete or inconsistent");
  }
  const expected = contract.phases.flatMap((phase, phaseIndex) =>
    phase.order.map((arm, orderIndex) => ({
      phaseId: phase.id,
      phaseIndex,
      orderIndex,
      arm,
      prompt: phase.prompt,
    })),
  );
  const threads = new Set();
  const workspaces = new Map();
  const signatures = new Set();
  for (let index = 0; index < result.sessions.length; index += 1) {
    const session = result.sessions[index];
    for (const key of ["phaseId", "phaseIndex", "orderIndex", "arm", "prompt"]) {
      if (session[key] !== expected[index][key]) {
        throw new Error(`session order mismatch: ${key}`);
      }
    }
    if (
      session.status !== "complete" ||
      typeof session.threadId !== "string" ||
      session.threadId.length === 0 ||
      threads.has(session.threadId)
    ) {
      throw new Error("every session must use a fresh thread");
    }
    threads.add(session.threadId);
    const priorWorkspace = workspaces.get(session.arm);
    if (priorWorkspace && priorWorkspace !== session.workspace) {
      throw new Error("each arm must retain one stable workspace");
    }
    workspaces.set(session.arm, session.workspace);
    signatures.add(session.runtimeSignature);
    if (
      !session.usage ||
      !["inputTokens", "cachedInputTokens", "outputTokens", "totalTokens"].every(
        (key) => Number.isSafeInteger(session.usage[key]) && session.usage[key] >= 0,
      ) ||
      typeof session.beforeSnapshotSha256 !== "string" ||
      typeof session.afterSnapshotSha256 !== "string"
    ) {
      throw new Error("session telemetry is invalid");
    }
  }
  if (workspaces.size !== 2 || signatures.size !== 1) {
    throw new Error("arms do not share one runtime contract");
  }
  return true;
}

async function runBoundedProcess(
  command,
  args,
  { cwd, env = process.env, input, timeoutMs = 30_000 } = {},
) {
  return await new Promise((resolve, reject) => {
    const started = performance.now();
    const child = spawn(command, args, {
      cwd,
      env,
      shell: false,
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
    const stdout = [];
    const stderr = [];
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let outputExceeded = false;
    let timedOut = false;
    let settled = false;
    const collect = (target, chunk, stream) => {
      if (stream === "stdout") stdoutBytes += chunk.length;
      else stderrBytes += chunk.length;
      if (stdoutBytes > processOutputLimit || stderrBytes > processOutputLimit) {
        outputExceeded = true;
        child.kill();
      } else {
        target.push(chunk);
      }
    };
    child.stdout.on("data", (chunk) => collect(stdout, chunk, "stdout"));
    child.stderr.on("data", (chunk) => collect(stderr, chunk, "stderr"));
    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    });
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, timeoutMs);
    child.on("close", (exitCode, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        exitCode,
        signal,
        stdout: Buffer.concat(stdout),
        stderr: Buffer.concat(stderr),
        wallClockMs: Math.round(performance.now() - started),
        outputExceeded,
        timedOut,
      });
    });
    child.stdin.end(input ?? "", "utf8");
  });
}

async function runSuccessful(command, args, options, label) {
  const result = await runBoundedProcess(command, args, options);
  if (result.exitCode !== 0 || result.timedOut || result.outputExceeded) {
    throw new Error(`${label} failed: ${result.stderr.toString("utf8")}`);
  }
  return result.stdout.toString("utf8").trim();
}

async function sourceState() {
  const [head, statusText] = await Promise.all([
    runSuccessful("git", ["-C", repositoryRoot, "rev-parse", "HEAD"], {}, "source HEAD"),
    runSuccessful(
      "git",
      ["-C", repositoryRoot, "status", "--porcelain=v1", "-z"],
      {},
      "source status",
    ),
  ]);
  return { head, statusSha256: sha256(statusText), statusText };
}

export async function snapshotWorkspace(
  workspace,
  contract,
  excludeTreatmentAgents,
) {
  const files = {};
  let totalBytes = 0;
  const queue = [workspace];
  while (queue.length > 0) {
    const current = queue.pop();
    const entries = await readdir(current, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      const relative = path.relative(workspace, absolute).split(path.sep).join("/");
      if (relative === ".git" || relative.startsWith(".git/")) continue;
      if (relative === "node_modules" || relative.startsWith("node_modules/")) {
        continue;
      }
      if (excludeTreatmentAgents && relative === "AGENTS.md") continue;
      const metadata = await lstat(absolute);
      if (metadata.isSymbolicLink()) {
        throw new Error(`workspace contains a symbolic link: ${relative}`);
      }
      if (metadata.isDirectory()) {
        queue.push(absolute);
      } else if (metadata.isFile()) {
        totalBytes += metadata.size;
        if (
          Object.keys(files).length + 1 > contract.workspace.fileLimit ||
          totalBytes > contract.workspace.totalBytesLimit
        ) {
          throw new Error("workspace exceeds the evaluation artifact limit");
        }
        files[relative] = {
          bytes: metadata.size,
          sha256: sha256(await readFile(absolute)),
        };
      } else {
        throw new Error(`unsupported workspace entry: ${relative}`);
      }
    }
  }
  const ordered = Object.fromEntries(
    Object.entries(files).sort(([left], [right]) => left.localeCompare(right)),
  );
  return {
    files: ordered,
    fileCount: Object.keys(ordered).length,
    bytes: totalBytes,
    sha256: sha256(JSON.stringify(ordered)),
  };
}

function changedPaths(before, after) {
  const paths = new Set([...Object.keys(before.files), ...Object.keys(after.files)]);
  return [...paths]
    .filter(
      (relative) =>
        JSON.stringify(before.files[relative] ?? null) !==
        JSON.stringify(after.files[relative] ?? null),
    )
    .sort();
}

async function ensureRuntime(contract) {
  const version = await runSuccessful("codex", ["--version"], {}, "Codex version");
  if (version !== contract.runtime.codexVersion) {
    throw new Error(`Codex version mismatch: ${version}`);
  }
  return version;
}

async function createRunRoot(contract, label) {
  const evaluationRoot = path.resolve(contract.workspace.evaluationRoot);
  await mkdir(evaluationRoot, { recursive: true });
  const runId = `${label}-${new Date().toISOString().replace(/[:.]/gu, "-")}-${randomUUID().slice(0, 8)}`;
  const runRoot = path.join(evaluationRoot, runId);
  await mkdir(runRoot);
  const seed = path.join(runRoot, "seed");
  await mkdir(seed);
  await runSuccessful("git", ["init", "-b", "main", seed], {}, "seed init");
  const fixedGitEnvironment = {
    ...process.env,
    GIT_AUTHOR_DATE: "2000-01-01T00:00:00Z",
    GIT_COMMITTER_DATE: "2000-01-01T00:00:00Z",
  };
  await runSuccessful(
    "git",
    [
      "-C",
      seed,
      "-c",
      "user.name=JOEWRKS Harness",
      "-c",
      "user.email=harness@example.invalid",
      "commit",
      "--allow-empty",
      "-m",
      "evaluation seed",
    ],
    { env: fixedGitEnvironment },
    "seed commit",
  );
  return { runId, runRoot, seed };
}

async function createArmWorkspace(runRoot, seed, arm, agentsContent) {
  const armRoot = path.join(runRoot, "arms", arm);
  await mkdir(armRoot, { recursive: true });
  const workspace = path.join(armRoot, "workspace");
  await runSuccessful(
    "git",
    ["clone", "--quiet", "--no-hardlinks", seed, workspace],
    {},
    `${arm} clone`,
  );
  if (agentsContent) {
    await writeFile(path.join(workspace, "AGENTS.md"), agentsContent, { flag: "wx" });
  }
  return workspace;
}

async function readIfPresent(file) {
  try {
    await access(file);
    return await readFile(file);
  } catch (error) {
    if (error?.code === "ENOENT") return Buffer.alloc(0);
    throw error;
  }
}

async function runSession({
  runRoot,
  contract,
  codexVersion,
  phase,
  phaseIndex,
  orderIndex,
  arm,
  workspace,
  treatmentSha256,
}) {
  const sessionId = `${phaseIndex + 1}-${orderIndex + 1}-${arm}`;
  const sessionRoot = path.join(runRoot, "sessions", sessionId);
  const codexHome = path.join(sessionRoot, "codex-home");
  const identityHome = path.join(sessionRoot, "identity-home");
  const temp = path.join(sessionRoot, "temp");
  await mkdir(identityHome, { recursive: true });
  await mkdir(temp);
  const sourceCodexHome = process.env.CODEX_HOME
    ? path.resolve(process.env.CODEX_HOME)
    : path.join(homedir(), ".codex");
  await copyIsolatedCodexHome(sourceCodexHome, codexHome);
  const environment = {
    ...buildChildEnvironment(process.env, codexHome, identityHome),
    TEMP: temp,
    TMP: temp,
    TMPDIR: temp,
  };
  const finalOutputPath = path.join(sessionRoot, "final.txt");
  const stdoutPath = path.join(sessionRoot, "events.jsonl");
  const stderrPath = path.join(sessionRoot, "stderr.txt");
  const before = await snapshotWorkspace(workspace, contract, arm === "candidate");
  const args = buildLifecycleCodexArgs(workspace, finalOutputPath, contract);
  const runtimeSignature = sha256(
    JSON.stringify({
      codexVersion,
      runtime: contract.runtime,
      disabledFeatures,
    }),
  );
  const processResult = await runBoundedProcess("codex", args, {
    cwd: workspace,
    env: environment,
    input: phase.prompt,
    timeoutMs: contract.workspace.sessionTimeoutMs,
  });
  const finalOutput = await readIfPresent(finalOutputPath);
  await assertNoCredentialLeak(path.join(codexHome, "auth.json"), [
    processResult.stdout,
    processResult.stderr,
    finalOutput,
  ]);
  await writeFile(stdoutPath, processResult.stdout, { flag: "wx" });
  await writeFile(stderrPath, processResult.stderr, { flag: "wx" });
  const after = await snapshotWorkspace(workspace, contract, arm === "candidate");
  let status = "complete";
  let evidence;
  let evidenceError;
  if (processResult.timedOut) status = "timed-out";
  else if (processResult.outputExceeded) status = "output-limit";
  else if (processResult.exitCode !== 0) status = "process-failed";
  else {
    try {
      evidence = parseCodexJsonl(processResult.stdout.toString("utf8"), {
        allowCommandExecution: true,
      });
    } catch (error) {
      status = "evidence-invalid";
      evidenceError = String(error?.message || error);
    }
  }
  let treatmentProtected = true;
  if (treatmentSha256) {
    const treatment = await readFile(path.join(workspace, "AGENTS.md"));
    treatmentProtected = sha256(treatment) === treatmentSha256;
    if (!treatmentProtected) status = "treatment-modified";
  }
  return {
    phaseId: phase.id,
    phaseIndex,
    orderIndex,
    arm,
    prompt: phase.prompt,
    workspace,
    status,
    exitCode: processResult.exitCode,
    signal: processResult.signal,
    timedOut: processResult.timedOut,
    outputExceeded: processResult.outputExceeded,
    wallClockMs: processResult.wallClockMs,
    runtimeSignature,
    threadId: evidence?.threadId ?? null,
    usage: evidence
      ? {
          inputTokens: evidence.inputTokens,
          cachedInputTokens: evidence.cachedInputTokens,
          uncachedInputTokens: evidence.inputTokens - evidence.cachedInputTokens,
          outputTokens: evidence.outputTokens,
          reasoningOutputTokens: evidence.reasoningOutputTokens,
          totalTokens: evidence.totalTokens,
        }
      : null,
    commandExecutions: evidence?.commandExecutions ?? [],
    fileChangePaths: evidence?.fileChangePaths ?? [],
    finalMessage: evidence?.finalMessage ?? finalOutput.toString("utf8"),
    evidenceError,
    treatmentProtected,
    beforeSnapshotSha256: before.sha256,
    afterSnapshotSha256: after.sha256,
    changedPaths: changedPaths(before, after),
    artifact: {
      fileCount: after.fileCount,
      bytes: after.bytes,
    },
    raw: {
      events: path.relative(runRoot, stdoutPath).split(path.sep).join("/"),
      stderr: path.relative(runRoot, stderrPath).split(path.sep).join("/"),
      final: path.relative(runRoot, finalOutputPath).split(path.sep).join("/"),
    },
  };
}

async function runSmoke(contractPath) {
  const contract = await loadContract(contractPath);
  const candidate = await readCandidate(contract);
  return {
    status: "smoke-ok",
    evaluation: contract.evaluation,
    activeSha256: candidate.activeSha256,
    candidateSha256: candidate.candidateSha256,
    candidateMatchesActive: candidate.matchesActive,
    phaseCount: contract.phases.length,
    sessionCount: contract.phases.length * 2,
    codexCalled: false,
  };
}

async function runCanary(contractPath) {
  const contract = await loadContract(contractPath);
  await readCandidate(contract);
  const codexVersion = await ensureRuntime(contract);
  const sourceBefore = await sourceState();
  const { runId, runRoot, seed } = await createRunRoot(contract, "canary");
  const token = `LEAN_CANARY_${randomUUID().replaceAll("-", "").toUpperCase()}`;
  const canaryAgents = Buffer.from(
    `# Evaluation Canary\n\nFor the canary request, reply with only \`${token}\`. Do not call tools.\n`,
    "utf8",
  );
  const workspaces = {
    control: await createArmWorkspace(runRoot, seed, "control", null),
    candidate: await createArmWorkspace(runRoot, seed, "candidate", canaryAgents),
  };
  const phase = {
    id: "instruction-canary",
    prompt:
      "If a project instruction supplies an evaluation canary token, reply with that token only. Otherwise reply with exactly CONTROL_NO_CANARY.",
  };
  const sessions = [];
  for (const [orderIndex, arm] of ["control", "candidate"].entries()) {
    sessions.push(
      await runSession({
        runRoot,
        contract,
        codexVersion,
        phase,
        phaseIndex: 0,
        orderIndex,
        arm,
        workspace: workspaces[arm],
        treatmentSha256: arm === "candidate" ? sha256(canaryAgents) : null,
      }),
    );
  }
  const sourceAfter = await sourceState();
  const controlMessage = sessions[0].finalMessage.trim();
  const candidateMessage = sessions[1].finalMessage.trim();
  const passed =
    sessions.every((session) => session.status === "complete") &&
    controlMessage === "CONTROL_NO_CANARY" &&
    candidateMessage === token &&
    sourceBefore.head === sourceAfter.head &&
    sourceBefore.statusSha256 === sourceAfter.statusSha256;
  const result = {
    schemaVersion: 1,
    evaluation: contract.evaluation,
    kind: "instruction-canary",
    status: passed ? "complete" : "failed",
    runId,
    tokenSha256: sha256(token),
    source: {
      beforeHead: sourceBefore.head,
      afterHead: sourceAfter.head,
      unchanged:
        sourceBefore.head === sourceAfter.head &&
        sourceBefore.statusSha256 === sourceAfter.statusSha256,
    },
    controlMessage,
    candidateMatchedToken: candidateMessage === token,
    sessions,
  };
  const resultPath = path.join(runRoot, "result.json");
  await writeExclusiveJson(resultPath, result);
  return { status: result.status, runId, resultPath };
}

async function runPaired(contractPath) {
  const contract = await loadContract(contractPath);
  const candidate = await readCandidate(contract);
  const codexVersion = await ensureRuntime(contract);
  const sourceBefore = await sourceState();
  const { runId, runRoot, seed } = await createRunRoot(contract, "paired-r1");
  const workspaces = {
    control: await createArmWorkspace(runRoot, seed, "control", null),
    candidate: await createArmWorkspace(
      runRoot,
      seed,
      "candidate",
      candidate.candidate,
    ),
  };
  const sessions = [];
  for (let phaseIndex = 0; phaseIndex < contract.phases.length; phaseIndex += 1) {
    const phase = contract.phases[phaseIndex];
    for (let orderIndex = 0; orderIndex < phase.order.length; orderIndex += 1) {
      const arm = phase.order[orderIndex];
      sessions.push(
        await runSession({
          runRoot,
          contract,
          codexVersion,
          phase,
          phaseIndex,
          orderIndex,
          arm,
          workspace: workspaces[arm],
          treatmentSha256:
            arm === "candidate" ? contract.candidate.sha256 : null,
        }),
      );
    }
  }
  const sourceAfter = await sourceState();
  const protectedAfterRun =
    sha256(await readFile(path.join(workspaces.candidate, "AGENTS.md"))) ===
    contract.candidate.sha256;
  const allComplete = sessions.every((session) => session.status === "complete");
  const result = {
    schemaVersion: 1,
    evaluation: contract.evaluation,
    kind: "paired-r1",
    status: allComplete ? "complete" : "observed-failure",
    runId,
    contractSha256: sha256(await readFile(contractPath)),
    source: {
      beforeHead: sourceBefore.head,
      afterHead: sourceAfter.head,
      beforeStatusSha256: sourceBefore.statusSha256,
      afterStatusSha256: sourceAfter.statusSha256,
      unchanged:
        sourceBefore.head === sourceAfter.head &&
        sourceBefore.statusSha256 === sourceAfter.statusSha256,
    },
    candidate: {
      sha256: candidate.candidateSha256,
      matchesActive: candidate.matchesActive,
      protectedAfterRun,
    },
    sessions,
  };
  if (result.status === "complete") validateRunEvidence(result, contract);
  const resultPath = path.join(runRoot, "result.json");
  await writeExclusiveJson(resultPath, result);
  return {
    status: result.status,
    runId,
    resultPath,
    sessions: sessions.map(({ phaseId, arm, status, wallClockMs, usage }) => ({
      phaseId,
      arm,
      status,
      wallClockMs,
      usage,
    })),
  };
}

async function main() {
  const { mode, contractPath } = parseCli(process.argv.slice(2));
  const result =
    mode === "smoke"
      ? await runSmoke(contractPath)
      : mode === "canary"
        ? await runCanary(contractPath)
        : await runPaired(contractPath);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  main().catch((error) => {
    process.stderr.write(`${error?.stack || error}\n`);
    process.exitCode = 1;
  });
}
