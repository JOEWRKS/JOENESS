import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import {
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPOSITORY_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const CASES_PATH = path.join(REPOSITORY_ROOT, "evals", "coding", "cases.json");
const RUNNER_RELATIVE_PATH = "evals/support/run-common-core-coding-ab.mjs";
const CASES_RELATIVE_PATH = "evals/coding/cases.json";
const EXPECTED_CODEX_VERSION = "codex-cli 0.145.0";
const PROCESS_OUTPUT_LIMIT = 2 * 1024 * 1024;
const FINAL_MESSAGE_LIMIT = 64 * 1024;
const WORKSPACE_FILE_LIMIT = 128;
const WORKSPACE_FILE_BYTES_LIMIT = 256 * 1024;
const WORKSPACE_TOTAL_BYTES_LIMIT = 1024 * 1024;
const TEST_TIMEOUT_MS = 30_000;
const MODEL_TIMEOUT_MS = 600_000;
const KNOWN_EVENT_TYPES = new Set([
  "thread.started",
  "turn.started",
  "item.started",
  "item.updated",
  "item.completed",
  "turn.completed",
]);
const FAILURE_EVENT_TYPES = new Set(["turn.failed", "error"]);
const ALLOWED_ITEM_TYPES = new Set([
  "reasoning",
  "agent_message",
  "todo_list",
  "file_change",
]);
const DISABLED_FEATURES = Object.freeze([
  "apps",
  "plugins",
  "multi_agent",
  "hooks",
  "skill_search",
  "skill_mcp_dependency_install",
  "shell_tool",
  "unified_exec",
  "code_mode",
  "code_mode_host",
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
const ISOLATION_FILES = Object.freeze([
  "auth.json",
  "cap_sid",
  ".sandbox/setup_marker.json",
  ".sandbox-secrets/sandbox_users.json",
]);
const SAFE_ENVIRONMENT_KEYS = Object.freeze([
  "ALLUSERSPROFILE",
  "APPDATA",
  "ComSpec",
  "LOCALAPPDATA",
  "NUMBER_OF_PROCESSORS",
  "OS",
  "Path",
  "PATHEXT",
  "PROCESSOR_ARCHITECTURE",
  "ProgramData",
  "ProgramFiles",
  "ProgramFiles(x86)",
  "ProgramW6432",
  "SystemDrive",
  "SystemRoot",
  "TEMP",
  "TMP",
  "TMPDIR",
  "windir",
]);
const CANDIDATES = Object.freeze({
  v1: Object.freeze({
    path: "evals/candidates/common-core-v1.md",
    sha256: "5aebc74bc795891c43bf785d9b34ae4d35d4a40bf46eddef3f6246d75919a495",
  }),
  v2: Object.freeze({
    path: "evals/candidates/common-core-v2.md",
    sha256: "a17e6f056fdf89373c3e726b326922241fc76f196c6f576028ded2b687912d3f",
  }),
});

export const RUN_MODES = Object.freeze([
  "run-v1-coding-ab-r1",
  "run-v2-coding-ab-r1",
  "run-v2-coding-ab-r2",
  "run-v1-coding-ab-r2",
]);
export const DIAGNOSTIC_MODE = "diagnose-v1-coding-patch-evidence-r1";
const CLI_MODES = Object.freeze([...RUN_MODES, DIAGNOSTIC_MODE]);

const RUN_CONFIGS = Object.freeze({
  ...Object.fromEntries(
    RUN_MODES.map((mode) => {
      const match = /^run-(v[12])-coding-ab-r([12])$/u.exec(mode);
      return [
        mode,
        Object.freeze({
          id: mode,
          candidateId: match[1],
          repetition: Number(match[2]),
          resultRelativePath: `evals/coding/results/${mode}.json`,
        }),
      ];
    }),
  ),
  [DIAGNOSTIC_MODE]: Object.freeze({
    id: DIAGNOSTIC_MODE,
    candidateId: "v1",
    repetition: 1,
    diagnostic: true,
    resultRelativePath:
      "evals/coding/diagnostics/diagnose-v1-coding-patch-evidence-r1-result.json",
    failureReceiptRelativePath:
      "evals/coding/diagnostics/diagnose-v1-coding-patch-evidence-r1-failure-receipt.json",
  }),
});

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function jsonBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

function comparablePath(value) {
  const resolved = path.resolve(value);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

export function assertSafeRelativePath(value) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.includes("\0") ||
    value.includes("\\") ||
    path.posix.isAbsolute(value) ||
    path.win32.isAbsolute(value)
  ) {
    throw new Error(`unsafe relative path: ${String(value)}`);
  }
  const segments = value.split("/");
  if (
    segments.some((segment) => segment === "" || segment === "." || segment === "..") ||
    path.posix.normalize(value) !== value
  ) {
    throw new Error(`unsafe relative path: ${value}`);
  }
  return value;
}

function containedPath(root, relative) {
  assertSafeRelativePath(relative);
  const destination = path.resolve(root, ...relative.split("/"));
  const relation = path.relative(path.resolve(root), destination);
  if (
    relation === "" ||
    relation === ".." ||
    relation.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relation)
  ) {
    throw new Error(`path escapes owned root: ${relative}`);
  }
  return destination;
}

async function requireDirectory(value, label) {
  const entry = await lstat(value);
  if (!entry.isDirectory() || entry.isSymbolicLink()) {
    throw new Error(`${label} must be a non-symbolic directory`);
  }
}

async function assertNoSymlinkSegments(root, relative) {
  assertSafeRelativePath(relative);
  let current = root;
  const rootEntry = await lstat(current);
  if (rootEntry.isSymbolicLink()) {
    throw new Error(`symbolic link is forbidden: ${current}`);
  }
  for (const segment of relative.split("/")) {
    current = path.join(current, segment);
    const entry = await lstat(current);
    if (entry.isSymbolicLink()) {
      throw new Error(`symbolic link is forbidden: ${current}`);
    }
  }
}

async function exists(value) {
  try {
    await lstat(value);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function writeFileMap(root, files, exclusive) {
  for (const [relative, content] of Object.entries(files)) {
    const destination = containedPath(root, relative);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, content, exclusive ? { flag: "wx" } : undefined);
  }
}

function validateFileMap(value, label) {
  if (!isPlainObject(value) || Object.keys(value).length === 0) {
    throw new Error(`${label} must be a non-empty object`);
  }
  let totalBytes = 0;
  for (const [relative, content] of Object.entries(value)) {
    assertSafeRelativePath(relative);
    if (relative === "AGENTS.md" || typeof content !== "string") {
      throw new Error(`${label} contains an invalid file: ${relative}`);
    }
    const bytes = Buffer.byteLength(content);
    if (bytes > WORKSPACE_FILE_BYTES_LIMIT) {
      throw new Error(`${label} file exceeds byte limit: ${relative}`);
    }
    totalBytes += bytes;
  }
  if (totalBytes > WORKSPACE_TOTAL_BYTES_LIMIT) {
    throw new Error(`${label} exceeds total byte limit`);
  }
}

function validateCaseCatalog(catalog) {
  if (!isPlainObject(catalog) || catalog.schemaVersion !== 1) {
    throw new Error("coding case catalog schema is invalid");
  }
  const expectedIds = [
    "feature-immutable-update",
    "maintenance-shared-parser",
    "frontend-responsive-accessible",
  ];
  if (
    !Array.isArray(catalog.cases) ||
    catalog.cases.length !== expectedIds.length ||
    catalog.cases.some((item, index) => item?.id !== expectedIds[index])
  ) {
    throw new Error("coding case ids or order are invalid");
  }
  for (const item of catalog.cases) {
    if (
      typeof item.title !== "string" ||
      typeof item.prompt !== "string" ||
      Buffer.byteLength(item.prompt) > 8 * 1024
    ) {
      throw new Error(`coding case metadata is invalid: ${item.id}`);
    }
    validateFileMap(item.files, `${item.id} files`);
    validateFileMap(item.hiddenFiles, `${item.id} hidden files`);
    validateFileMap(item.smokeSolution, `${item.id} smoke solution`);
    for (const key of Object.keys(item.smokeSolution)) {
      if (!item.allowedChangedPaths?.includes(key)) {
        throw new Error(`${item.id} smoke solution changes a disallowed path`);
      }
    }
    for (const listName of ["allowedChangedPaths", "protectedPaths"]) {
      if (!Array.isArray(item[listName]) || item[listName].length === 0) {
        throw new Error(`${item.id} ${listName} is invalid`);
      }
      for (const relative of item[listName]) assertSafeRelativePath(relative);
    }
    if (
      item.allowedChangedPaths.some((relative) =>
        item.protectedPaths.includes(relative),
      ) ||
      !item.protectedPaths.includes("AGENTS.md") ||
      !Array.isArray(item.visibleCommand) ||
      item.visibleCommand[0] !== "node" ||
      item.visibleCommand.length < 2 ||
      !Array.isArray(item.hiddenCommand) ||
      item.hiddenCommand[0] !== "node" ||
      item.hiddenCommand[1] !== "hidden-grade.mjs" ||
      !Object.hasOwn(item.hiddenFiles, "hidden-grade.mjs")
    ) {
      throw new Error(`coding case execution contract is invalid: ${item.id}`);
    }
  }
  return catalog;
}

export async function loadCaseCatalog(file = CASES_PATH) {
  return validateCaseCatalog(JSON.parse(await readFile(file, "utf8")));
}

export function buildSubjectPrompt(item) {
  const visibleFiles = Object.fromEntries(
    Object.entries(item.files).sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  );
  const visibleFilesJson = JSON.stringify(visibleFiles);
  const payload = {
    schemaVersion: 1,
    executionSurface: "patch-only-no-shell",
    task: item.prompt,
    allowedChangedPaths: [...item.allowedChangedPaths].sort(),
    visibleFiles,
  };
  return {
    text: JSON.stringify(payload, null, 2),
    visibleFilesSha256: sha256(visibleFilesJson),
    visibleFilesBytes: Buffer.byteLength(visibleFilesJson),
  };
}

export async function materializeCase(item, ownedRoot) {
  await requireDirectory(ownedRoot, "case root");
  const workspace = path.join(ownedRoot, "workspace");
  const hiddenDirectory = path.join(ownedRoot, "grader");
  if ((await exists(workspace)) || (await exists(hiddenDirectory))) {
    throw new Error("case materialization target already exists");
  }
  await mkdir(workspace);
  await writeFileMap(workspace, item.files, true);
  return {
    workspace,
    hiddenDirectory,
    hiddenGrader: path.join(hiddenDirectory, "hidden-grade.mjs"),
  };
}

export async function assertNoSymlinks(root) {
  const rootEntry = await lstat(root);
  if (!rootEntry.isDirectory() || rootEntry.isSymbolicLink()) {
    throw new Error("workspace root is a symbolic link or not a directory");
  }
  const queue = [root];
  while (queue.length > 0) {
    const current = queue.pop();
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const child = path.join(current, entry.name);
      const childStat = await lstat(child);
      if (childStat.isSymbolicLink()) {
        throw new Error(`symbolic link is forbidden: ${child}`);
      }
      if (childStat.isDirectory()) queue.push(child);
    }
  }
}

async function inspectWorkspace(root) {
  await assertNoSymlinks(root);
  let files = 0;
  let bytes = 0;
  const queue = [root];
  while (queue.length > 0) {
    const current = queue.pop();
    for (const entry of await readdir(current, { withFileTypes: true })) {
      if (entry.name === ".git") continue;
      const child = path.join(current, entry.name);
      const childStat = await lstat(child);
      if (childStat.isDirectory()) {
        queue.push(child);
      } else if (childStat.isFile()) {
        files += 1;
        bytes += childStat.size;
        if (childStat.size > WORKSPACE_FILE_BYTES_LIMIT) {
          throw new Error(`workspace file exceeds byte limit: ${child}`);
        }
      } else {
        throw new Error(`unsupported workspace entry: ${child}`);
      }
    }
  }
  if (files > WORKSPACE_FILE_LIMIT || bytes > WORKSPACE_TOTAL_BYTES_LIMIT) {
    throw new Error("workspace output exceeds bounded evidence limits");
  }
  return { files, bytes };
}

async function snapshotFiles(root, { skipGit = false } = {}) {
  const files = {};
  const queue = [{ absolute: root, relative: "" }];
  let totalBytes = 0;
  while (queue.length > 0) {
    const current = queue.pop();
    const entries = await readdir(current.absolute, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      if (skipGit && current.relative === "" && entry.name === ".git") continue;
      const relative = current.relative
        ? `${current.relative}/${entry.name}`
        : entry.name;
      const absolute = path.join(current.absolute, entry.name);
      const metadata = await lstat(absolute);
      if (metadata.isSymbolicLink()) {
        throw new Error(`symbolic link is forbidden: ${absolute}`);
      }
      if (metadata.isDirectory()) {
        queue.push({ absolute, relative });
      } else if (metadata.isFile()) {
        if (metadata.size > WORKSPACE_FILE_BYTES_LIMIT) {
          throw new Error(`snapshot file exceeds byte limit: ${relative}`);
        }
        totalBytes += metadata.size;
        if (totalBytes > PROCESS_OUTPUT_LIMIT) {
          throw new Error("snapshot exceeds total byte limit");
        }
        files[relative] = {
          bytes: metadata.size,
          sha256: sha256(await readFile(absolute)),
        };
      } else {
        throw new Error(`unsupported snapshot entry: ${relative}`);
      }
    }
  }
  const canonical = JSON.stringify(
    Object.fromEntries(
      Object.entries(files).sort(([left], [right]) =>
        left.localeCompare(right),
      ),
    ),
  );
  return { files, sha256: sha256(canonical), bytes: totalBytes };
}

async function snapshotWorkspaceTree(workspace) {
  return {
    working: await snapshotFiles(workspace, { skipGit: true }),
    git: await snapshotFiles(path.join(workspace, ".git")),
  };
}

function changedSnapshotPaths(before, after) {
  const paths = new Set([
    ...Object.keys(before.files),
    ...Object.keys(after.files),
  ]);
  return [...paths]
    .filter(
      (relative) =>
        JSON.stringify(before.files[relative] ?? null) !==
        JSON.stringify(after.files[relative] ?? null),
    )
    .sort();
}

async function runBoundedProcess(
  command,
  args,
  { cwd, env = process.env, input, timeoutMs = TEST_TIMEOUT_MS } = {},
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

    const stopForLimit = (chunks, chunk, streamName) => {
      const next =
        streamName === "stdout"
          ? (stdoutBytes += chunk.length)
          : (stderrBytes += chunk.length);
      if (next > PROCESS_OUTPUT_LIMIT) {
        outputExceeded = true;
        child.kill();
        return;
      }
      chunks.push(chunk);
    };
    child.stdout.on("data", (chunk) => stopForLimit(stdout, chunk, "stdout"));
    child.stderr.on("data", (chunk) => stopForLimit(stderr, chunk, "stderr"));
    child.on("error", (error) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(error);
      }
    });
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, timeoutMs);
    child.on("close", (exitCode, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const result = {
        exitCode,
        signal,
        stdout: Buffer.concat(stdout),
        stderr: Buffer.concat(stderr),
        wallClockMs: Math.round(performance.now() - started),
        outputExceeded,
        timedOut,
      };
      if (outputExceeded) {
        reject(new Error("child process output exceeded limit"));
      } else if (timedOut) {
        reject(new Error("child process timed out"));
      } else {
        resolve(result);
      }
    });
    if (input === undefined) child.stdin.end();
    else child.stdin.end(input, "utf8");
  });
}

function outputText(value) {
  return value.toString("utf8");
}

function serializableProcess(result) {
  return {
    exitCode: result.exitCode,
    signal: result.signal,
    stdout: outputText(result.stdout),
    stderr: outputText(result.stderr),
    wallClockMs: result.wallClockMs,
    outputExceeded: result.outputExceeded,
    timedOut: result.timedOut,
  };
}

async function runCommand(command, args, options) {
  const executable = command === "node" ? process.execPath : command;
  return await runBoundedProcess(executable, args, options);
}

async function runSuccessful(command, args, options, label) {
  const result = await runCommand(command, args, options);
  if (result.exitCode !== 0) {
    throw new Error(
      `${label} failed (${result.exitCode}): ${outputText(result.stderr)}`,
    );
  }
  return result;
}

function expandWorkspaceToken(value, workspace) {
  return value === "{{workspace}}" ? workspace : value;
}

export function buildGraderNodeArgs(args, readableRoots) {
  if (
    !Array.isArray(args) ||
    !Array.isArray(readableRoots) ||
    readableRoots.length === 0
  ) {
    throw new TypeError("grader arguments and readable roots are required");
  }
  return [
    "--permission",
    ...readableRoots.map(
      (root) => `--allow-fs-read=${path.resolve(root)}`,
    ),
    ...args,
  ];
}

function buildGraderEnvironment(source = process.env) {
  const allowed = [
    "ComSpec",
    "OS",
    "Path",
    "PATHEXT",
    "SystemDrive",
    "SystemRoot",
    "TEMP",
    "TMP",
    "windir",
  ];
  const entries = new Map(
    Object.entries(source).map(([key, value]) => [
      key.toUpperCase(),
      value,
    ]),
  );
  return {
    ...Object.fromEntries(
      allowed.flatMap((key) => {
        const value = entries.get(key.toUpperCase());
        return typeof value === "string" ? [[key, value]] : [];
      }),
    ),
    NO_COLOR: "1",
  };
}

export async function assertSafeImplementationFiles(
  workspace,
  changedPaths,
) {
  if (!Array.isArray(changedPaths) || changedPaths.length === 0) {
    throw new Error("implementation must change at least one file");
  }
  const forbidden =
    /(?:\b(?:import|from)\s*(?:\(\s*)?["'](?:node:)?(?:child_process|cluster|dgram|http|https|net|tls|worker_threads)\b|\brequire\s*\(\s*["'](?:node:)?(?:child_process|cluster|dgram|http|https|net|tls|worker_threads)\b|\bprocess\.env\b|\b(?:fetch|WebSocket|eval)\s*\(|\bnew\s+Function\s*\()/u;
  for (const relative of changedPaths) {
    assertSafeRelativePath(relative);
    if (!/\.[cm]?js$/u.test(relative)) continue;
    const bytes = await readFile(containedPath(workspace, relative));
    if (bytes.length > WORKSPACE_FILE_BYTES_LIMIT) {
      throw new Error(`implementation file exceeds limit: ${relative}`);
    }
    if (forbidden.test(bytes.toString("utf8"))) {
      throw new Error(`implementation uses a forbidden capability: ${relative}`);
    }
  }
}

async function runVisibleTest(item, workspace) {
  return await runCommand(
    item.visibleCommand[0],
    buildGraderNodeArgs(item.visibleCommand.slice(1), [workspace]),
    { cwd: workspace, env: buildGraderEnvironment() },
  );
}

async function removeOwnedDirectory(target, parent, label) {
  if (
    comparablePath(path.dirname(target)) !== comparablePath(parent) ||
    !(await exists(target))
  ) {
    if (!(await exists(target))) return;
    throw new Error(`${label} cleanup path is invalid`);
  }
  await requireDirectory(target, label);
  await rm(target, { recursive: true, force: false });
}

async function runHiddenTest(item, materialized) {
  const { hiddenDirectory, workspace } = materialized;
  if (await exists(hiddenDirectory)) {
    throw new Error("hidden grader must not exist before grading");
  }
  await mkdir(hiddenDirectory);
  try {
    await writeFileMap(hiddenDirectory, item.hiddenFiles, true);
    return await runCommand(
      item.hiddenCommand[0],
      buildGraderNodeArgs(
        item.hiddenCommand
          .slice(1)
          .map((argument) => expandWorkspaceToken(argument, workspace)),
        [hiddenDirectory, workspace],
      ),
      { cwd: hiddenDirectory, env: buildGraderEnvironment() },
    );
  } finally {
    await removeOwnedDirectory(
      hiddenDirectory,
      path.dirname(hiddenDirectory),
      "hidden grader",
    );
  }
}

async function applySmokeSolution(item, workspace) {
  await assertNoSymlinks(workspace);
  await writeFileMap(workspace, item.smokeSolution, false);
}

export function parseCodexJsonl(value) {
  if (typeof value !== "string" || Buffer.byteLength(value) > PROCESS_OUTPUT_LIMIT) {
    throw new Error("Codex JSONL exceeds input limit");
  }
  const lines = value.split(/\r?\n/u).filter((line) => line.length > 0);
  if (lines.length === 0 || lines.length > 4096) {
    throw new Error("Codex JSONL event count is invalid");
  }
  let threadId;
  let finalMessage = "";
  let usage;
  let lifecycle = "thread";
  const itemTypes = [];
  const fileChangePaths = [];
  for (const line of lines) {
    if (Buffer.byteLength(line) > 256 * 1024) {
      throw new Error("Codex JSONL line exceeds limit");
    }
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      throw new Error("Codex JSONL contains malformed JSON");
    }
    if (FAILURE_EVENT_TYPES.has(event?.type)) {
      throw new Error(`Codex terminal failure event: ${event.type}`);
    }
    if (!isPlainObject(event) || !KNOWN_EVENT_TYPES.has(event.type)) {
      throw new Error(`unsupported Codex JSON event: ${String(event?.type)}`);
    }
    if (Object.hasOwn(event, "usage") && event.type !== "turn.completed") {
      throw new Error("Codex usage is only allowed on the terminal event");
    }
    if (lifecycle === "terminal") {
      throw new Error("Codex lifecycle contains an event after terminal");
    }
    if (event.type === "thread.started") {
      if (
        lifecycle !== "thread" ||
        typeof event.thread_id !== "string" ||
        event.thread_id.length === 0
      ) {
        throw new Error("Codex lifecycle thread event is invalid");
      }
      threadId = event.thread_id;
      lifecycle = "turn";
    } else if (event.type === "turn.started") {
      if (lifecycle !== "turn") {
        throw new Error("Codex lifecycle turn event is invalid");
      }
      lifecycle = "items";
    } else if (event.type.startsWith("item.")) {
      if (lifecycle !== "items" || !isPlainObject(event.item)) {
        throw new Error("Codex lifecycle item event is invalid");
      }
      const { item } = event;
      if (
        typeof item.id !== "string" ||
        item.id.length === 0 ||
        typeof item.type !== "string"
      ) {
        throw new Error("Codex item identity is invalid");
      }
      if (!ALLOWED_ITEM_TYPES.has(item.type)) {
        throw new Error(`forbidden Codex item type: ${item.type}`);
      }
      if (!itemTypes.includes(item.type)) itemTypes.push(item.type);
      if (
        item.type === "agent_message" &&
        event.type === "item.completed"
      ) {
        if (
          typeof item.text !== "string" ||
          Buffer.byteLength(item.text) > FINAL_MESSAGE_LIMIT
        ) {
          throw new Error("Codex agent message is invalid or oversized");
        }
        finalMessage = item.text;
      }
      if (item.type === "file_change") {
        if (
          event.type !== "item.completed" ||
          item.status !== "completed" ||
          !Array.isArray(item.changes) ||
          item.changes.length === 0
        ) {
          throw new Error("Codex file_change evidence is missing paths");
        }
        for (const change of item.changes) {
          if (
            !isPlainObject(change) ||
            typeof change.path !== "string" ||
            change.path.length === 0 ||
            Buffer.byteLength(change.path) > 4096 ||
            !["add", "delete", "update"].includes(change.kind)
          ) {
            throw new Error("Codex file_change evidence is invalid");
          }
          fileChangePaths.push(change.path);
        }
      }
    } else if (event.type === "turn.completed") {
      if (lifecycle !== "items" || !isPlainObject(event.usage)) {
        throw new Error("Codex lifecycle terminal event is invalid");
      }
      usage = event.usage;
      lifecycle = "terminal";
    }
  }
  if (!threadId || lifecycle !== "terminal" || !isPlainObject(usage)) {
    throw new Error("Codex lifecycle is incomplete");
  }
  const readUsage = (key, fallback = 0) => {
    const number = usage[key] ?? fallback;
    if (!Number.isSafeInteger(number) || number < 0) {
      throw new Error(`Codex usage is invalid: ${key}`);
    }
    return number;
  };
  const inputTokens = readUsage("input_tokens");
  const cachedInputTokens = readUsage("cached_input_tokens");
  const outputTokens = readUsage("output_tokens");
  const reasoningOutputTokens = readUsage(
    "reasoning_output_tokens",
    usage.output_tokens_details?.reasoning_tokens ?? 0,
  );
  return {
    threadId,
    finalMessage,
    eventCount: lines.length,
    itemTypes,
    fileChangePaths: [...new Set(fileChangePaths)],
    patchOnly: true,
    inputTokens,
    cachedInputTokens,
    outputTokens,
    reasoningOutputTokens,
    totalTokens: inputTokens + outputTokens,
  };
}

export function buildCodexArgs(workspace, finalOutputPath) {
  return [
    "exec",
    "--ignore-user-config",
    "--ignore-rules",
    "--ephemeral",
    "--json",
    ...DISABLED_FEATURES.flatMap((feature) => ["--disable", feature]),
    "--model",
    "gpt-5.6-sol",
    "--sandbox",
    "workspace-write",
    "-c",
    'approval_policy="never"',
    "-c",
    "sandbox_workspace_write.network_access=false",
    "-c",
    "features.shell_tool=false",
    "-c",
    'model_reasoning_effort="low"',
    "-c",
    'service_tier="default"',
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

export async function copyIsolatedCodexHome(source, destination) {
  await requireDirectory(source, "source CODEX_HOME");
  if (await exists(destination)) {
    throw new Error("isolated CODEX_HOME already exists");
  }
  await mkdir(destination);
  try {
    for (const relative of ISOLATION_FILES) {
      const sourceFile = containedPath(source, relative);
      await assertNoSymlinkSegments(source, relative);
      const sourceEntry = await lstat(sourceFile);
      if (!sourceEntry.isFile() || sourceEntry.isSymbolicLink()) {
        throw new Error(`invalid CODEX_HOME identity file: ${relative}`);
      }
      const destinationFile = containedPath(destination, relative);
      await mkdir(path.dirname(destinationFile), { recursive: true });
      await copyFile(
        sourceFile,
        destinationFile,
        fsConstants.COPYFILE_EXCL,
      );
    }
    return [...ISOLATION_FILES];
  } catch (error) {
    await removeOwnedDirectory(
      destination,
      path.dirname(destination),
      "isolated CODEX_HOME",
    );
    throw error;
  }
}

export function buildChildEnvironment(
  source,
  isolatedCodexHome,
  identityHome,
) {
  const sourceEntries = new Map(
    Object.entries(source).map(([key, value]) => [key.toUpperCase(), value]),
  );
  const result = Object.fromEntries(
    SAFE_ENVIRONMENT_KEYS.flatMap((key) => {
      const value = sourceEntries.get(key.toUpperCase());
      return typeof value === "string" ? [[key, value]] : [];
    }),
  );
  return {
    ...result,
    CODEX_HOME: isolatedCodexHome,
    HOME: identityHome,
    USERPROFILE: identityHome,
    NO_COLOR: "1",
  };
}

function splitNul(buffer) {
  return outputText(buffer)
    .split("\0")
    .filter((value) => value.length > 0);
}

function normalizedWorkspacePath(workspace, reportedPath) {
  if (typeof reportedPath !== "string" || reportedPath.length === 0) {
    throw new Error("patch evidence contains an invalid path");
  }
  const absolute = path.isAbsolute(reportedPath)
    ? path.resolve(reportedPath)
    : path.resolve(workspace, reportedPath);
  const relation = path.relative(path.resolve(workspace), absolute);
  if (
    relation === "" ||
    path.isAbsolute(relation) ||
    relation === ".." ||
    relation.startsWith(`..${path.sep}`)
  ) {
    throw new Error("patch evidence escapes the workspace");
  }
  const relative = relation.split(path.sep).join("/");
  try {
    assertSafeRelativePath(relative);
  } catch {
    throw new Error("patch evidence contains an unsafe path");
  }
  return relative;
}

export function validatePatchEvidence({
  workspace,
  reportedPaths,
  gitPaths,
  snapshotPaths,
  allowedPaths,
}) {
  if (
    !Array.isArray(reportedPaths) ||
    !Array.isArray(gitPaths) ||
    !Array.isArray(snapshotPaths) ||
    !Array.isArray(allowedPaths)
  ) {
    throw new Error("patch evidence path sets are required");
  }
  const normalizeKnownRelative = (value) => {
    try {
      return normalizedWorkspacePath(workspace, value);
    } catch {
      throw new Error("patch evidence contains an invalid controller path");
    }
  };
  const reported = [...new Set(reportedPaths.map((value) =>
    normalizedWorkspacePath(workspace, value),
  ))].sort();
  const git = [...new Set(gitPaths.map(normalizeKnownRelative))].sort();
  const snapshot = [...new Set(snapshotPaths.map(normalizeKnownRelative))].sort();
  const allowed = [...new Set(allowedPaths.map(normalizeKnownRelative))].sort();
  const forbidden = (relative) =>
    relative === "AGENTS.md" ||
    relative === ".git" ||
    relative.startsWith(".git/") ||
    relative === "grader" ||
    relative.startsWith("grader/");
  const diagnostics = {
    reported,
    git,
    snapshot,
    allowed,
    reportedEmpty: reported.length === 0,
    forbiddenPath: [...reported, ...git, ...snapshot].some(forbidden),
    gitOutsideAllowed: git.some((relative) => !allowed.includes(relative)),
    reportedGitMismatch:
      JSON.stringify(reported) !== JSON.stringify(git),
    snapshotGitMismatch:
      JSON.stringify(snapshot) !== JSON.stringify(git),
  };
  if (
    diagnostics.reportedEmpty ||
    diagnostics.forbiddenPath ||
    diagnostics.gitOutsideAllowed ||
    diagnostics.reportedGitMismatch ||
    diagnostics.snapshotGitMismatch
  ) {
    const error = new Error(
      "patch evidence does not match the exact allowed paths",
    );
    error.patchEvidence = diagnostics;
    throw error;
  }
  return git;
}

export function claimsAutonomousTestExecution(message) {
  if (typeof message !== "string") return false;
  return message
    .split(/[\r\n.!?;]+|\bbut\b|하지만|그러나/iu)
    .some((sentence) => {
      if (
        /(?:\b(?:not|never|unable|cannot|couldn't|didn't)\b|않|못)/iu.test(
          sentence,
        )
      ) {
        return false;
      }
      return (
        /\b(?:tests?|test suite)\b.{0,48}\b(?:pass(?:ed)?|green|succeed(?:ed)?)\b/iu.test(
          sentence,
        ) ||
        /\b(?:ran|executed|verified)\s+(?:the\s+)?tests?\b/iu.test(sentence) ||
        /테스트(?:를|가|는|도)?[^.!?\n]{0,24}(?:실행|통과|성공)(?:했|함|완료|됨)/u.test(
          sentence,
        )
      );
    });
}

async function initializeGitRepository(workspace) {
  await runSuccessful("git", ["init", "--quiet"], { cwd: workspace }, "git init");
  await runSuccessful(
    "git",
    ["config", "user.name", "JOEWRKS Evaluation"],
    { cwd: workspace },
    "git config user.name",
  );
  await runSuccessful(
    "git",
    ["config", "user.email", "evaluation.invalid@example.invalid"],
    { cwd: workspace },
    "git config user.email",
  );
  await runSuccessful("git", ["add", "--all"], { cwd: workspace }, "git add");
  await runSuccessful(
    "git",
    ["commit", "--quiet", "-m", "fixture"],
    { cwd: workspace },
    "git commit",
  );
  return await readGitIdentity(workspace);
}

async function readGitIdentity(workspace) {
  const head = outputText(
    (
      await runSuccessful(
        "git",
        ["rev-parse", "HEAD"],
        { cwd: workspace },
        "git rev-parse",
      )
    ).stdout,
  ).trim();
  const tree = outputText(
    (
      await runSuccessful(
        "git",
        ["rev-parse", "HEAD^{tree}"],
        { cwd: workspace },
        "git rev-parse tree",
      )
    ).stdout,
  ).trim();
  return { head, tree };
}

async function collectChanges(workspace) {
  await runSuccessful(
    "git",
    ["add", "-N", "--all"],
    { cwd: workspace },
    "git add intent-to-add",
  );
  const names = await runSuccessful(
    "git",
    ["diff", "--name-only", "-z", "--no-renames", "HEAD", "--"],
    { cwd: workspace },
    "git diff names",
  );
  const changedPaths = splitNul(names.stdout);
  for (const relative of changedPaths) assertSafeRelativePath(relative);
  const diffResult = await runSuccessful(
    "git",
    ["diff", "--binary", "--no-ext-diff", "--no-renames", "HEAD", "--"],
    { cwd: workspace },
    "git diff",
  );
  const text = outputText(diffResult.stdout);
  return {
    changedPaths,
    diff: {
      text,
      bytes: diffResult.stdout.length,
      sha256: sha256(diffResult.stdout),
      truncated: false,
    },
  };
}

async function hashFiles(root, relatives) {
  return Object.fromEntries(
    await Promise.all(
      relatives.map(async (relative) => {
        const target = containedPath(root, relative);
        try {
          const entry = await lstat(target);
          if (!entry.isFile() || entry.isSymbolicLink()) return [relative, null];
          return [relative, sha256(await readFile(target))];
        } catch (error) {
          if (error?.code === "ENOENT") return [relative, null];
          throw error;
        }
      }),
    ),
  );
}

async function captureSource() {
  const statusResult = await runSuccessful(
    "git",
    ["status", "--porcelain=v1", "--untracked-files=all"],
    { cwd: REPOSITORY_ROOT },
    "source git status",
  );
  if (statusResult.stdout.length !== 0) {
    throw new Error("source repository must be clean before a live run");
  }
  const head = outputText(
    (
      await runSuccessful(
        "git",
        ["rev-parse", "HEAD"],
        { cwd: REPOSITORY_ROOT },
        "source HEAD",
      )
    ).stdout,
  ).trim();
  const objectFormat = outputText(
    (
      await runSuccessful(
        "git",
        ["rev-parse", "--show-object-format"],
        { cwd: REPOSITORY_ROOT },
        "source object format",
      )
    ).stdout,
  ).trim();
  const sourceFiles = [RUNNER_RELATIVE_PATH, CASES_RELATIVE_PATH];
  const snapshots = {};
  for (const relative of sourceFiles) {
    const bytes = await readFile(containedPath(REPOSITORY_ROOT, relative));
    const committed = (
      await runSuccessful(
        "git",
        ["show", `HEAD:${relative}`],
        { cwd: REPOSITORY_ROOT },
        `source binding ${relative}`,
      )
    ).stdout;
    if (!bytes.equals(committed)) {
      throw new Error(`source file is not bound to HEAD: ${relative}`);
    }
    snapshots[relative] = { path: relative, sha256: sha256(bytes) };
  }
  return { head, clean: true, objectFormat, snapshots };
}

async function loadCandidate(candidateId) {
  const frozen = CANDIDATES[candidateId];
  const bytes = await readFile(containedPath(REPOSITORY_ROOT, frozen.path));
  const actualSha256 = sha256(bytes);
  if (actualSha256 !== frozen.sha256) {
    throw new Error(`candidate hash mismatch: ${candidateId}`);
  }
  const committed = (
    await runSuccessful(
      "git",
      ["show", `HEAD:${frozen.path}`],
      { cwd: REPOSITORY_ROOT },
      `candidate binding ${candidateId}`,
    )
  ).stdout;
  if (!bytes.equals(committed)) {
    throw new Error(`candidate is not bound to HEAD: ${candidateId}`);
  }
  return {
    id: candidateId,
    path: frozen.path,
    expectedSha256: frozen.sha256,
    actualSha256,
    bytes: bytes.length,
    content: bytes,
  };
}

async function resolveCodexExecutable(sourceCodexHome) {
  const executable = await realpath(
    path.join(
      sourceCodexHome,
      "packages",
      "standalone",
      "current",
      "bin",
      "codex.exe",
    ),
  );
  const version = outputText(
    (
      await runSuccessful(
        executable,
        ["--version"],
        { env: process.env },
        "codex --version",
      )
    ).stdout,
  ).trim();
  if (version !== EXPECTED_CODEX_VERSION) {
    throw new Error(`Codex version drift: ${version}`);
  }
  return { executable, version };
}

export async function assertNoCredentialLeak(authFile, buffers) {
  if (!Array.isArray(buffers) || buffers.some((value) => !Buffer.isBuffer(value))) {
    throw new TypeError("credential evidence must be buffers");
  }
  const auth = JSON.parse(await readFile(authFile, "utf8"));
  const secrets = [];
  const visit = (value, key = "") => {
    if (
      typeof value === "string" &&
      value.length >= 16 &&
      /(?:token|secret|password|credential|key)/iu.test(key)
    ) {
      secrets.push(value);
    } else if (Array.isArray(value)) {
      for (const item of value) visit(item, key);
    } else if (isPlainObject(value)) {
      for (const [childKey, child] of Object.entries(value)) {
        visit(child, childKey);
      }
    }
  };
  visit(auth);
  const output = Buffer.concat(buffers).toString("utf8");
  if (secrets.some((secret) => output.includes(secret))) {
    throw new Error("credential-shaped auth content leaked into model evidence");
  }
}

async function readChangedFileBuffers(workspace, changedPaths) {
  const buffers = [];
  for (const relative of changedPaths) {
    const target = containedPath(workspace, relative);
    try {
      const metadata = await lstat(target);
      if (!metadata.isFile() || metadata.isSymbolicLink()) {
        throw new Error(`changed path is not a regular file: ${relative}`);
      }
      if (metadata.size > WORKSPACE_FILE_BYTES_LIMIT) {
        throw new Error(`changed file exceeds byte limit: ${relative}`);
      }
      buffers.push(await readFile(target));
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  return buffers;
}

async function readBoundedFile(file, limit) {
  const entry = await stat(file);
  if (!entry.isFile() || entry.size > limit) {
    throw new Error(`evidence file exceeds byte limit: ${file}`);
  }
  return await readFile(file);
}

async function runLiveCase({
  item,
  caseIndex,
  candidate,
  executable,
  codexVersion,
  sourceCodexHome,
  runId,
  diagnosticMode,
  failureReceiptPath,
  sourceHead,
}) {
  const ownedRoot = await mkdtemp(path.join(tmpdir(), "joewrks-coding-ab-"));
  const isolatedParent = path.join(sourceCodexHome, ".eval-runtime");
  const isolatedCodexHome = path.join(
    isolatedParent,
    `${runId}-${item.id}-codex-home`,
  );
  const identityHome = path.join(ownedRoot, "identity-home");
  let isolatedCreated = false;
  try {
    const materialized = await materializeCase(item, ownedRoot);
    await writeFile(
      path.join(materialized.workspace, "AGENTS.md"),
      candidate.content,
      { flag: "wx" },
    );
    await inspectWorkspace(materialized.workspace);
    const fixture = await initializeGitRepository(materialized.workspace);
    const beforeProtected = await hashFiles(
      materialized.workspace,
      item.protectedPaths,
    );
    const baselineVisible = await runVisibleTest(item, materialized.workspace);
    const baselineHidden = await runHiddenTest(item, materialized);
    if (baselineVisible.exitCode === 0 || baselineHidden.exitCode === 0) {
      throw new Error(`case baseline does not fail independently: ${item.id}`);
    }
    if (await exists(materialized.hiddenDirectory)) {
      throw new Error("hidden grader leaked before model execution");
    }
    const beforeTree = await snapshotWorkspaceTree(materialized.workspace);
    const subject = buildSubjectPrompt(item);

    await mkdir(isolatedParent, { recursive: true });
    await copyIsolatedCodexHome(sourceCodexHome, isolatedCodexHome);
    isolatedCreated = true;
    await mkdir(identityHome);
    for (const forbidden of ["config.toml", "plugins", "skills", ".agents"]) {
      if (await exists(path.join(isolatedCodexHome, forbidden))) {
        throw new Error(`isolated CODEX_HOME contains forbidden asset: ${forbidden}`);
      }
    }
    const finalOutputPath = path.join(ownedRoot, "final-message.txt");
    const codexProcess = await runBoundedProcess(
      executable,
      buildCodexArgs(materialized.workspace, finalOutputPath),
      {
        cwd: materialized.workspace,
        env: buildChildEnvironment(
          process.env,
          isolatedCodexHome,
          identityHome,
        ),
        input: subject.text,
        timeoutMs: MODEL_TIMEOUT_MS,
      },
    );
    if (await exists(materialized.hiddenDirectory)) {
      throw new Error("hidden grader appeared during model execution");
    }
    const workspaceSize = await inspectWorkspace(materialized.workspace);
    const parsed = parseCodexJsonl(outputText(codexProcess.stdout));
    const finalMessageBytes = await readBoundedFile(
      finalOutputPath,
      FINAL_MESSAGE_LIMIT,
    );
    const finalMessage = outputText(finalMessageBytes);
    if (parsed.finalMessage && parsed.finalMessage.trim() !== finalMessage.trim()) {
      throw new Error("Codex final message evidence disagrees");
    }
    const afterTree = await snapshotWorkspaceTree(materialized.workspace);
    if (beforeTree.git.sha256 !== afterTree.git.sha256) {
      throw new Error("model changed protected Git metadata");
    }
    const afterGit = await readGitIdentity(materialized.workspace);
    if (afterGit.head !== fixture.head || afterGit.tree !== fixture.tree) {
      throw new Error("model changed the frozen fixture HEAD");
    }
    const changes = await collectChanges(materialized.workspace);
    const snapshotPaths = changedSnapshotPaths(
      beforeTree.working,
      afterTree.working,
    );
    let validatedChangedPaths;
    try {
      validatedChangedPaths = validatePatchEvidence({
        workspace: materialized.workspace,
        reportedPaths: parsed.fileChangePaths,
        gitPaths: changes.changedPaths,
        snapshotPaths,
        allowedPaths: item.allowedChangedPaths,
      });
    } catch (error) {
      if (failureReceiptPath && error?.patchEvidence) {
        await writePatchEvidenceFailureReceipt({
          destination: failureReceiptPath,
          authFile: path.join(isolatedCodexHome, "auth.json"),
          mode: diagnosticMode,
          runId,
          sourceHead,
          candidateId: candidate.id,
          candidateSha256: candidate.actualSha256,
          caseId: item.id,
          caseIndex,
          codexProcess,
          diff: changes.diff,
          error,
        });
      }
      throw error;
    }
    await assertSafeImplementationFiles(
      materialized.workspace,
      validatedChangedPaths,
    );
    await assertNoCredentialLeak(
      path.join(isolatedCodexHome, "auth.json"),
      [
        codexProcess.stdout,
        codexProcess.stderr,
        finalMessageBytes,
        Buffer.from(changes.diff.text),
        ...(await readChangedFileBuffers(
          materialized.workspace,
          validatedChangedPaths,
        )),
      ],
    );
    const afterProtected = await hashFiles(
      materialized.workspace,
      item.protectedPaths,
    );
    const visible = await runVisibleTest(item, materialized.workspace);
    const hidden = await runHiddenTest(item, materialized);
    const protectedPathsUnchanged = item.protectedPaths.every(
      (relative) => beforeProtected[relative] === afterProtected[relative],
    );
    const changedPathsAllowed = validatedChangedPaths.every((relative) =>
      item.allowedChangedPaths.includes(relative),
    );
    const instructionUnchanged =
      afterProtected["AGENTS.md"] === candidate.actualSha256;
    const resolvedWorkspace = await realpath(materialized.workspace);
    const workspaceContained =
      path.relative(ownedRoot, resolvedWorkspace) === "workspace";
    const credentialRelation = path.relative(
      materialized.workspace,
      isolatedCodexHome,
    );
    const credentialPathOutsideWorkspace =
      path.isAbsolute(credentialRelation) ||
      credentialRelation === ".." ||
      credentialRelation.startsWith(`..${path.sep}`);
    const identityHomeEmpty = (await readdir(identityHome)).length === 0;
    const claimIntegrity = !claimsAutonomousTestExecution(finalMessage);

    return {
      caseId: item.id,
      promptSha256: sha256(subject.text),
      promptBytes: Buffer.byteLength(subject.text),
      visibleFilesSha256: subject.visibleFilesSha256,
      visibleFilesBytes: subject.visibleFilesBytes,
      visibleFilePaths: Object.keys(item.files).sort(),
      baseline: {
        gitHead: fixture.head,
        gitTree: fixture.tree,
        diff: { text: "", bytes: 0, sha256: sha256(""), truncated: false },
        changedPaths: [],
        fileTree: beforeTree.working,
        gitMetadataSha256: beforeTree.git.sha256,
        gitMetadata: beforeTree.git,
        visible: serializableProcess(baselineVisible),
        hidden: serializableProcess(baselineHidden),
      },
      metrics: {
        inputTokens: parsed.inputTokens,
        cachedInputTokens: parsed.cachedInputTokens,
        outputTokens: parsed.outputTokens,
        reasoningOutputTokens: parsed.reasoningOutputTokens,
        totalTokens: parsed.totalTokens,
        finalOutputBytes: finalMessageBytes.length,
        eventCount: parsed.eventCount,
        wallClockMs: codexProcess.wallClockMs,
      },
      process: {
        exitCode: codexProcess.exitCode,
        signal: codexProcess.signal,
        stderr: outputText(codexProcess.stderr),
        threadId: parsed.threadId,
        itemTypes: parsed.itemTypes,
        fileChangePaths: validatedChangedPaths,
        rawFileChangePaths: parsed.fileChangePaths,
        jsonlBytes: codexProcess.stdout.length,
        jsonlSha256: sha256(codexProcess.stdout),
      },
      finalMessage,
      changedPaths: validatedChangedPaths,
      diff: changes.diff,
      fileTree: afterTree.working,
      git: {
        head: afterGit.head,
        tree: afterGit.tree,
        metadataSha256: afterTree.git.sha256,
        metadata: afterTree.git,
      },
      tests: {
        visible: serializableProcess(visible),
        hidden: serializableProcess(hidden),
      },
      workspaceSize,
      integrity: {
        instructionUnchanged,
        changedPathsAllowed,
        protectedPathsUnchanged,
        noSymlinks: true,
        workspaceContained,
        safeImplementationFiles: true,
        patchOnlyToolSurface: parsed.patchOnly,
        claimIntegrity,
        gitMetadataUnchanged:
          beforeTree.git.sha256 === afterTree.git.sha256,
        fixtureHeadUnchanged:
          afterGit.head === fixture.head && afterGit.tree === fixture.tree,
        fullTreeDiffMatchesGit:
          JSON.stringify(snapshotPaths) ===
          JSON.stringify(validatedChangedPaths),
        noUserConfigPluginsOrSkills: true,
        credentialPathOutsideWorkspace,
        identityHomeEmpty,
        shellEnvPolicy:
          'inherit="core",ignore_default_excludes=false',
      },
      runtime: { codexVersion },
    };
  } finally {
    if (isolatedCreated && (await exists(isolatedCodexHome))) {
      await removeOwnedDirectory(
        isolatedCodexHome,
        isolatedParent,
        "isolated CODEX_HOME",
      );
    }
    if (await exists(ownedRoot)) {
      await removeOwnedDirectory(
        ownedRoot,
        path.dirname(ownedRoot),
        "case root",
      );
    }
  }
}

function sumMetrics(cases) {
  const keys = [
    "inputTokens",
    "cachedInputTokens",
    "outputTokens",
    "reasoningOutputTokens",
    "totalTokens",
    "finalOutputBytes",
    "eventCount",
    "wallClockMs",
  ];
  return Object.fromEntries(
    keys.map((key) => [
      key,
      cases.reduce((total, item) => total + item.metrics[key], 0),
    ]),
  );
}

async function runLive(mode) {
  const config = RUN_CONFIGS[mode];
  const resultPath = containedPath(REPOSITORY_ROOT, config.resultRelativePath);
  if (await exists(resultPath)) {
    throw new Error(`result already exists: ${config.resultRelativePath}`);
  }
  const failureReceiptPath = config.failureReceiptRelativePath
    ? containedPath(REPOSITORY_ROOT, config.failureReceiptRelativePath)
    : null;
  if (failureReceiptPath && (await exists(failureReceiptPath))) {
    throw new Error(
      `failure receipt already exists: ${config.failureReceiptRelativePath}`,
    );
  }
  const [catalog, source, candidate] = await Promise.all([
    loadCaseCatalog(),
    captureSource(),
    loadCandidate(config.candidateId),
  ]);
  const sourceCodexHome =
    process.env.CODEX_HOME || path.join(homedir(), ".codex");
  const { executable, version } = await resolveCodexExecutable(sourceCodexHome);
  const runId = randomUUID();
  const cases = [];
  for (const [caseIndex, item] of catalog.cases.entries()) {
    cases.push(
      await runLiveCase({
        item,
        caseIndex,
        candidate,
        executable,
        codexVersion: version,
        sourceCodexHome,
        runId,
        diagnosticMode: config.diagnostic ? config.id : null,
        failureReceiptPath,
        sourceHead: source.head,
      }),
    );
  }
  const [endingSource, endingCandidate] = await Promise.all([
    captureSource(),
    loadCandidate(config.candidateId),
  ]);
  if (
    endingSource.head !== source.head ||
    endingSource.objectFormat !== source.objectFormat ||
    endingSource.snapshots[RUNNER_RELATIVE_PATH].sha256 !==
      source.snapshots[RUNNER_RELATIVE_PATH].sha256 ||
    endingSource.snapshots[CASES_RELATIVE_PATH].sha256 !==
      source.snapshots[CASES_RELATIVE_PATH].sha256 ||
    endingCandidate.actualSha256 !== candidate.actualSha256
  ) {
    throw new Error("source identity changed during coding A/B collection");
  }
  const result = {
    schemaVersion: 1,
    kind: config.diagnostic
      ? "common-core-coding-diagnostic"
      : "common-core-coding-ab",
    id: config.id,
    runId,
    recordedAt: new Date().toISOString(),
    source: {
      head: source.head,
      clean: source.clean,
      objectFormat: source.objectFormat,
      runner: source.snapshots[RUNNER_RELATIVE_PATH],
      cases: source.snapshots[CASES_RELATIVE_PATH],
    },
    runtime: {
      codexVersion: version,
      model: "gpt-5.6-sol",
      reasoningEffort: "low",
      serviceTier: "default",
      approvalPolicy: "never",
      sandbox: "workspace-write",
      network: false,
      executionSurface: "patch-only-no-shell",
      shellTool: false,
      patchToolEvidence: "jsonl-file-change-hard-gate",
      ephemeral: true,
      ignoreUserConfig: true,
      ignoreRules: true,
      disabledFeatures: [...DISABLED_FEATURES],
      isolationFiles: [...ISOLATION_FILES],
      shellEnvPolicy: 'inherit="core",ignore_default_excludes=false',
    },
    candidate: {
      id: candidate.id,
      path: candidate.path,
      expectedSha256: candidate.expectedSha256,
      actualSha256: candidate.actualSha256,
      bytes: candidate.bytes,
    },
    repetition: config.repetition,
    cases,
    totals: sumMetrics(cases),
    checks: {
      sourceClean: source.clean,
      sourceBound: true,
      candidateHashMatch:
        candidate.expectedSha256 === candidate.actualSha256,
      allCasesCompleted: cases.length === catalog.cases.length,
      allBaselineTestsFail: cases.every(
        (item) =>
          item.baseline.visible.exitCode !== 0 &&
          item.baseline.hidden.exitCode !== 0,
      ),
      allVisibleTestsPass: cases.every(
        (item) => item.tests.visible.exitCode === 0,
      ),
      allHiddenTestsPass: cases.every(
        (item) => item.tests.hidden.exitCode === 0,
      ),
      noSymlinks: cases.every((item) => item.integrity.noSymlinks),
      safeImplementationFiles: cases.every(
        (item) => item.integrity.safeImplementationFiles,
      ),
      patchOnlyToolSurface: cases.every(
        (item) => item.integrity.patchOnlyToolSurface,
      ),
      claimIntegrity: cases.every(
        (item) => item.integrity.claimIntegrity,
      ),
      gitMetadataUnchanged: cases.every(
        (item) => item.integrity.gitMetadataUnchanged,
      ),
      fixtureHeadUnchanged: cases.every(
        (item) => item.integrity.fixtureHeadUnchanged,
      ),
      fullTreeDiffMatchesGit: cases.every(
        (item) => item.integrity.fullTreeDiffMatchesGit,
      ),
      outputWithinLimits: true,
      noUserConfigPluginsOrSkills: cases.every(
        (item) => item.integrity.noUserConfigPluginsOrSkills,
      ),
      credentialPathOutsideWorkspace: cases.every(
        (item) => item.integrity.credentialPathOutsideWorkspace,
      ),
      identityHomeEmpty: cases.every(
        (item) => item.integrity.identityHomeEmpty,
      ),
      shellEnvPolicy: cases.every(
        (item) =>
          item.integrity.shellEnvPolicy ===
          'inherit="core",ignore_default_excludes=false',
      ),
    },
  };
  await writeExclusiveJson(resultPath, result);
  return { resultPath, result };
}

export async function writePatchEvidenceFailureReceipt({
  destination,
  authFile,
  mode,
  runId,
  sourceHead,
  candidateId,
  candidateSha256,
  caseId,
  caseIndex,
  codexProcess,
  diff,
  error,
}) {
  if (!error?.patchEvidence) {
    throw new TypeError("patch evidence diagnostics are required");
  }
  const receipt = {
    schemaVersion: 1,
    kind: "common-core-coding-diagnostic-failure-receipt",
    diagnostic: { mode, runId },
    source: { head: sourceHead },
    candidate: { id: candidateId, sha256: candidateSha256 },
    case: { id: caseId, index: caseIndex },
    failureStage: "patch-evidence-validation",
    codex: {
      exitCode: codexProcess.exitCode,
      signal: codexProcess.signal,
      wallClockMs: codexProcess.wallClockMs,
    },
    evidence: {
      jsonl: {
        bytes: codexProcess.stdout.length,
        sha256: sha256(codexProcess.stdout),
      },
      diff: {
        bytes: diff.bytes,
        sha256: diff.sha256,
      },
    },
    patchEvidence: error.patchEvidence,
  };
  const bytes = jsonBytes(receipt);
  await assertNoCredentialLeak(authFile, [bytes]);
  await writeExclusiveBytes(destination, bytes);
}

async function writeExclusiveBytes(destination, bytes) {
  const parent = path.dirname(destination);
  await mkdir(parent, { recursive: true });
  if (comparablePath(await realpath(parent)) !== comparablePath(parent)) {
    throw new Error("result parent contains a symbolic link");
  }
  await writeFile(destination, bytes, { flag: "wx" });
}

export async function writeExclusiveJson(destination, value) {
  await writeExclusiveBytes(destination, jsonBytes(value));
}

export function parseCli(argv) {
  if (
    argv.length === 1 &&
    (argv[0] === "smoke" || CLI_MODES.includes(argv[0]))
  ) {
    return { mode: argv[0] };
  }
  throw new Error(
    `usage: node ${RUNNER_RELATIVE_PATH} <${["smoke", ...CLI_MODES].join("|")}>`,
  );
}

export async function runSmoke() {
  const catalog = await loadCaseCatalog();
  const cases = [];
  for (const item of catalog.cases) {
    const ownedRoot = await mkdtemp(path.join(tmpdir(), "joewrks-coding-smoke-"));
    try {
      const materialized = await materializeCase(item, ownedRoot);
      if (await exists(materialized.hiddenGrader)) {
        throw new Error("hidden grader was materialized before grading");
      }
      const beforeVisible = await runVisibleTest(item, materialized.workspace);
      const beforeHidden = await runHiddenTest(item, materialized);
      if (await exists(materialized.hiddenGrader)) {
        throw new Error("hidden grader remained after grading");
      }
      await applySmokeSolution(item, materialized.workspace);
      const afterVisible = await runVisibleTest(item, materialized.workspace);
      const afterHidden = await runHiddenTest(item, materialized);
      cases.push({
        caseId: item.id,
        before: {
          visible: serializableProcess(beforeVisible),
          hidden: serializableProcess(beforeHidden),
        },
        after: {
          visible: serializableProcess(afterVisible),
          hidden: serializableProcess(afterHidden),
        },
      });
    } finally {
      await removeOwnedDirectory(
        ownedRoot,
        path.dirname(ownedRoot),
        "smoke root",
      );
    }
  }
  const parsed = parseCodexJsonl(
    [
      JSON.stringify({ type: "thread.started", thread_id: "smoke-thread" }),
      JSON.stringify({ type: "turn.started" }),
      JSON.stringify({
        type: "item.completed",
        item: { id: "smoke-message", type: "agent_message", text: "done" },
      }),
      JSON.stringify({
        type: "turn.completed",
        usage: {
          input_tokens: 2,
          cached_input_tokens: 1,
          output_tokens: 3,
          reasoning_output_tokens: 1,
        },
      }),
    ].join("\n"),
  );
  let malformedRejected = false;
  try {
    parseCodexJsonl('{"type":"unknown"}\n');
  } catch {
    malformedRejected = true;
  }
  if (
    parsed.totalTokens !== 5 ||
    !malformedRejected ||
    cases.some(
      (item) =>
        item.before.visible.exitCode === 0 ||
        item.before.hidden.exitCode === 0 ||
        item.after.visible.exitCode !== 0 ||
        item.after.hidden.exitCode !== 0,
    )
  ) {
    throw new Error("coding A/B smoke contract failed");
  }
  return { modelCalls: 0, parserValidated: true, cases };
}

async function main() {
  const { mode } = parseCli(process.argv.slice(2));
  if (mode === "smoke") {
    const report = await runSmoke();
    process.stdout.write(
      `PASS: coding A/B smoke (${report.cases.length} cases, 0 model calls)\n`,
    );
    return;
  }
  const { resultPath } = await runLive(mode);
  process.stdout.write(
    `PASS: ${mode} -> ${path.relative(REPOSITORY_ROOT, resultPath)}\n`,
  );
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
