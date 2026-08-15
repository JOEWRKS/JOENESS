import { createHash } from "node:crypto";
import { lstat, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { types as utilTypes } from "node:util";
import {
  EVALUATION_PROJECT_DOC_MAX_BYTES,
  buildThreadStartRequest,
} from "./collect-codex-app-server.mjs";
import { runFreshEvaluatorTurn } from "./run-fresh-evaluator-turn.mjs";

export const AUTHORITY_ROLE_SEPARATED_EVALUATOR_ADAPTER_ID =
  "authority-role-separated-evaluator-turn-v1";

const OPTION_KEYS = Object.freeze([
  "session",
  "root",
  "input",
  "outputSchema",
  "projectInstruction",
]);
const PROJECT_INSTRUCTION_KEYS = Object.freeze([
  "relativePath",
  "bytes",
  "sha256",
]);
const PRIVACY = Object.freeze({
  absolutePathPersisted: false,
  rawProjectInstructionPersisted: false,
  rawUserInputPersisted: false,
  rawOutputPersisted: false,
  rawOutputDigestPersisted: false,
  eventPayloadPersisted: false,
});
const FORBIDDEN_JSON_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const BLOCKED_STAGES = new Set([
  "options-validation",
  "initial-project-binding",
  "before-thread-start",
  "before-thread-start-session",
  "after-thread-start",
  "after-thread-start-request-readback",
  "before-turn-start",
  "before-turn-start-session",
  "turn-request-clone",
  "turn-input-validation",
  "after-turn-start-session",
  "after-turn-start-request-readback",
  "after-turn-start-response",
  "before-auxiliary-request",
  "after-auxiliary-request",
  "session-runtime-provenance",
  "after-turn-completion",
  "fresh-turn",
  "post-validation",
  "session-cleanup",
  "unmapped",
]);

function fail(message) {
  throw new TypeError(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
}

function exactOwnData(value, keys, label) {
  if (
    value === null ||
    typeof value !== "object" ||
    utilTypes.isProxy(value) ||
    Array.isArray(value)
  ) {
    fail(`${label} must be an exact object`);
  }
  let prototype;
  let ownKeys;
  try {
    prototype = Object.getPrototypeOf(value);
    ownKeys = Reflect.ownKeys(value);
  } catch {
    fail(`${label} must be an exact object`);
  }
  if (
    (prototype !== Object.prototype && prototype !== null) ||
    ownKeys.length !== keys.length ||
    ownKeys.some((key) => typeof key !== "string" || !keys.includes(key))
  ) {
    fail(`${label} keys are invalid`);
  }
  const snapshot = Object.create(null);
  for (const key of keys) {
    let descriptor;
    try {
      descriptor = Object.getOwnPropertyDescriptor(value, key);
    } catch {
      fail(`${label}.${key} must be own data`);
    }
    if (
      descriptor === undefined ||
      !Object.hasOwn(descriptor, "value") ||
      descriptor.enumerable !== true
    ) {
      fail(`${label}.${key} must be own data`);
    }
    snapshot[key] = descriptor.value;
  }
  return snapshot;
}

function cloneJson(value, label, depth = 0, seen = new Set()) {
  if (depth > 24) fail(`${label} nesting is too deep`);
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail(`${label} number is invalid`);
    return value;
  }
  if (typeof value !== "object" || utilTypes.isProxy(value)) {
    fail(`${label} must be JSON data`);
  }
  if (seen.has(value)) fail(`${label} must not be cyclic`);
  seen.add(value);
  try {
    if (Array.isArray(value)) {
      let ownKeys;
      let descriptors;
      try {
        ownKeys = Reflect.ownKeys(value);
        descriptors = Object.getOwnPropertyDescriptors(value);
      } catch {
        fail(`${label} array is unsafe`);
      }
      const lengthDescriptor = descriptors.length;
      if (
        lengthDescriptor === undefined ||
        !Object.hasOwn(lengthDescriptor, "value") ||
        !Number.isSafeInteger(lengthDescriptor.value) ||
        lengthDescriptor.value < 0 ||
        lengthDescriptor.value > 4096 ||
        ownKeys.length !== lengthDescriptor.value + 1 ||
        ownKeys[lengthDescriptor.value] !== "length" ||
        ownKeys
          .slice(0, lengthDescriptor.value)
          .some((key, index) => key !== String(index))
      ) {
        fail(`${label} array is malformed`);
      }
      const clone = [];
      for (let index = 0; index < lengthDescriptor.value; index += 1) {
        const descriptor = descriptors[String(index)];
        if (
          descriptor === undefined ||
          !Object.hasOwn(descriptor, "value") ||
          descriptor.enumerable !== true
        ) {
          fail(`${label}[${index}] must be own data`);
        }
        clone.push(cloneJson(descriptor.value, `${label}[${index}]`, depth + 1, seen));
      }
      return clone;
    }
    let prototype;
    let ownKeys;
    try {
      prototype = Object.getPrototypeOf(value);
      ownKeys = Reflect.ownKeys(value);
    } catch {
      fail(`${label} object is unsafe`);
    }
    if (
      (prototype !== Object.prototype && prototype !== null) ||
      ownKeys.length > 4096 ||
      ownKeys.some((key) => typeof key !== "string")
    ) {
      fail(`${label} object is malformed`);
    }
    const clone = Object.create(null);
    for (const key of ownKeys) {
      if (FORBIDDEN_JSON_KEYS.has(key)) {
        fail(`${label}.${key} is forbidden`);
      }
      let descriptor;
      try {
        descriptor = Object.getOwnPropertyDescriptor(value, key);
      } catch {
        fail(`${label}.${key} must be own data`);
      }
      if (
        descriptor === undefined ||
        !Object.hasOwn(descriptor, "value") ||
        descriptor.enumerable !== true
      ) {
        fail(`${label}.${key} must be own data`);
      }
      Object.defineProperty(clone, key, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: cloneJson(descriptor.value, `${label}.${key}`, depth + 1, seen),
      });
    }
    return clone;
  } finally {
    seen.delete(value);
  }
}

function exactSingleTextInput(value) {
  const input = cloneJson(value, "authority role-separated input");
  const itemKeys =
    input.length === 1 && input[0] !== null && typeof input[0] === "object"
      ? Object.keys(input[0])
      : [];
  if (
    input.length !== 1 ||
    input[0] === null ||
    typeof input[0] !== "object" ||
    itemKeys.length !== 2 ||
    !itemKeys.includes("type") ||
    !itemKeys.includes("text") ||
    input[0].type !== "text" ||
    typeof input[0].text !== "string" ||
    input[0].text.length < 1 ||
    Buffer.byteLength(input[0].text) > EVALUATION_PROJECT_DOC_MAX_BYTES
  ) {
    fail("authority role-separated direct-user input is malformed");
  }
  return input;
}

function projectInstructionSnapshot(value) {
  const data = exactOwnData(
    value,
    PROJECT_INSTRUCTION_KEYS,
    "authority role-separated project instruction",
  );
  if (
    data.relativePath !== "AGENTS.md" ||
    !Number.isSafeInteger(data.bytes) ||
    data.bytes < 1 ||
    data.bytes > EVALUATION_PROJECT_DOC_MAX_BYTES ||
    typeof data.sha256 !== "string" ||
    !/^[0-9a-f]{64}$/u.test(data.sha256)
  ) {
    fail("authority role-separated project instruction tuple is invalid");
  }
  return {
    relativePath: data.relativePath,
    bytes: data.bytes,
    sha256: data.sha256,
  };
}

function samePath(left, right) {
  const normalize = (value) =>
    process.platform === "win32"
      ? path.normalize(value).toLocaleLowerCase("en-US")
      : path.normalize(value);
  return normalize(left) === normalize(right);
}

function identity(stat) {
  return {
    dev: stat.dev,
    ino: stat.ino,
    birthtimeNs: stat.birthtimeNs,
  };
}

function sameIdentity(left, right) {
  return (
    left.dev === right.dev &&
    left.ino === right.ino &&
    left.birthtimeNs === right.birthtimeNs
  );
}

async function realDirectoryTicket(target, label) {
  const stat = await lstat(target, { bigint: true });
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw new Error(`${label} must be a real directory`);
  }
  return {
    resolvedPath: await realpath(target),
    identity: identity(stat),
  };
}

async function projectBinding(root, expected) {
  const rootPath = path.resolve(root);
  const gitPath = path.join(rootPath, ".git");
  const projectPath = path.join(rootPath, expected.relativePath);
  const rootBefore = await realDirectoryTicket(rootPath, "authority role-separated root");
  if (!samePath(rootBefore.resolvedPath, rootPath)) {
    throw new Error("authority role-separated root is redirected");
  }
  const gitBefore = await realDirectoryTicket(gitPath, "authority role-separated .git");
  if (!samePath(gitBefore.resolvedPath, gitPath)) {
    throw new Error("authority role-separated .git is redirected");
  }
  const beforeStat = await lstat(projectPath, { bigint: true });
  if (
    !beforeStat.isFile() ||
    beforeStat.isSymbolicLink() ||
    beforeStat.nlink !== 1n
  ) {
    throw new Error("authority role-separated AGENTS.md must be a regular file");
  }
  const resolvedProject = await realpath(projectPath);
  if (!samePath(resolvedProject, projectPath)) {
    throw new Error("authority role-separated AGENTS.md is redirected");
  }
  const bytes = await readFile(projectPath);
  const afterStat = await lstat(projectPath, { bigint: true });
  const resolvedProjectAfter = await realpath(projectPath);
  const gitAfter = await realDirectoryTicket(gitPath, "authority role-separated .git");
  const rootAfter = await realDirectoryTicket(rootPath, "authority role-separated root");
  if (
    !sameIdentity(identity(beforeStat), identity(afterStat)) ||
    afterStat.nlink !== 1n ||
    !samePath(resolvedProject, resolvedProjectAfter) ||
    !sameIdentity(gitBefore.identity, gitAfter.identity) ||
    !samePath(gitBefore.resolvedPath, gitAfter.resolvedPath) ||
    !sameIdentity(rootBefore.identity, rootAfter.identity) ||
    !samePath(rootBefore.resolvedPath, rootAfter.resolvedPath) ||
    bytes.length !== expected.bytes ||
    sha256(bytes) !== expected.sha256
  ) {
    throw new Error("authority role-separated project binding changed");
  }
  const text = bytes.toString("utf8");
  if (!Buffer.from(text, "utf8").equals(bytes)) {
    throw new Error("authority role-separated AGENTS.md must be UTF-8");
  }
  return {
    root: rootBefore,
    git: gitBefore,
    project: {
      resolvedPath: resolvedProject,
      identity: identity(beforeStat),
    },
    text,
  };
}

function sameBinding(left, right) {
  return (
    samePath(left.root.resolvedPath, right.root.resolvedPath) &&
    sameIdentity(left.root.identity, right.root.identity) &&
    samePath(left.git.resolvedPath, right.git.resolvedPath) &&
    sameIdentity(left.git.identity, right.git.identity) &&
    samePath(left.project.resolvedPath, right.project.resolvedPath) &&
    sameIdentity(left.project.identity, right.project.identity) &&
    left.text === right.text
  );
}

function ownData(value, key, label) {
  if (value === null || typeof value !== "object" || utilTypes.isProxy(value)) {
    fail(`${label} is invalid`);
  }
  let descriptor;
  try {
    descriptor = Object.getOwnPropertyDescriptor(value, key);
  } catch {
    fail(`${label}.${key} must be own data`);
  }
  if (descriptor === undefined || !Object.hasOwn(descriptor, "value")) {
    fail(`${label}.${key} must be own data`);
  }
  return descriptor.value;
}

function sessionControlSnapshot(value) {
  if (
    value === null ||
    typeof value !== "object" ||
    utilTypes.isProxy(value) ||
    Array.isArray(value)
  ) {
    fail("authority role-separated session is invalid");
  }
  let descriptors;
  try {
    descriptors = Object.getOwnPropertyDescriptors(value);
  } catch {
    fail("authority role-separated session is invalid");
  }
  const requireData = (key) => {
    const descriptor = descriptors[key];
    if (
      descriptor === undefined ||
      !Object.hasOwn(descriptor, "value") ||
      descriptor.enumerable !== true
    ) {
      fail(`authority role-separated session.${key} must be own data`);
    }
    return descriptor.value;
  };
  const requireAccessor = (key) => {
    const descriptor = descriptors[key];
    if (
      descriptor === undefined ||
      typeof descriptor.get !== "function" ||
      utilTypes.isProxy(descriptor.get) ||
      descriptor.set !== undefined ||
      descriptor.enumerable !== true
    ) {
      fail(`authority role-separated session.${key} must be an own accessor`);
    }
    return descriptor.get;
  };
  const client = requireData("client");
  if (
    client === null ||
    typeof client !== "object" ||
    utilTypes.isProxy(client) ||
    Array.isArray(client)
  ) {
    fail("authority role-separated session client is invalid");
  }
  let requestDescriptor;
  try {
    requestDescriptor = Object.getOwnPropertyDescriptor(client, "request");
  } catch {
    fail("authority role-separated session client request is invalid");
  }
  const subscribe = requireData("subscribe");
  const close = requireData("close");
  const mcpInventory = requireData("mcpInventory");
  const notificationCursorGetter = requireAccessor("notificationCursor");
  const runtimeGetters = Object.fromEntries(
    [
      "remoteControlSnapshot",
      "processExitCode",
      "stderr",
      "imageDiagnostics",
      "successfulImageViews",
    ].map((key) => [key, requireAccessor(key)]),
  );
  if (
    requestDescriptor === undefined ||
    !Object.hasOwn(requestDescriptor, "value") ||
    requestDescriptor.enumerable !== true ||
    typeof requestDescriptor.value !== "function" ||
    utilTypes.isProxy(requestDescriptor.value) ||
    typeof subscribe !== "function" ||
    utilTypes.isProxy(subscribe) ||
    typeof close !== "function" ||
    utilTypes.isProxy(close) ||
    requestDescriptor.value === subscribe ||
    requestDescriptor.value === close ||
    subscribe === close
  ) {
    fail("authority role-separated session controls are invalid");
  }
  return {
    session: value,
    client,
    request: requestDescriptor.value,
    subscribe,
    close,
    mcpInventory,
    notificationCursorGetter,
    runtimeGetters,
    descriptors: {
      client: descriptors.client,
      subscribe: descriptors.subscribe,
      close: descriptors.close,
      mcpInventory: descriptors.mcpInventory,
      notificationCursor: descriptors.notificationCursor,
      request: requestDescriptor,
      runtime: Object.fromEntries(
        Object.keys(runtimeGetters).map((key) => [key, descriptors[key]]),
      ),
    },
  };
}

function descriptorMatches(left, right) {
  if (left === undefined || right === undefined) return false;
  for (const key of [
    "value",
    "get",
    "set",
    "enumerable",
    "configurable",
    "writable",
  ]) {
    if (left[key] !== right[key]) return false;
  }
  return true;
}

function sessionControlMatches(control) {
  let descriptors;
  let requestDescriptor;
  try {
    descriptors = Object.getOwnPropertyDescriptors(control.session);
    requestDescriptor = Object.getOwnPropertyDescriptor(control.client, "request");
  } catch {
    return false;
  }
  if (
    !descriptorMatches(descriptors.client, control.descriptors.client) ||
    !descriptorMatches(descriptors.subscribe, control.descriptors.subscribe) ||
    !descriptorMatches(descriptors.close, control.descriptors.close) ||
    !descriptorMatches(
      descriptors.mcpInventory,
      control.descriptors.mcpInventory,
    ) ||
    !descriptorMatches(
      descriptors.notificationCursor,
      control.descriptors.notificationCursor,
    ) ||
    !descriptorMatches(requestDescriptor, control.descriptors.request)
  ) {
    return false;
  }
  return Object.entries(control.runtimeGetters).every(
    ([key]) => descriptorMatches(descriptors[key], control.descriptors.runtime[key]),
  );
}

function readCapturedGetter(control, key) {
  return Reflect.apply(control.runtimeGetters[key], control.session, []);
}

function sanitizedThreadResponse(response, expectedPath, request) {
  const snapshot = cloneJson(response, "authority role-separated thread response");
  if (
    !Array.isArray(snapshot.instructionSources) ||
    snapshot.instructionSources.length !== 1 ||
    typeof snapshot.instructionSources[0] !== "string" ||
    !samePath(snapshot.instructionSources[0], expectedPath) ||
    snapshot.cwd !== request.cwd ||
    snapshot.thread?.cwd !== request.cwd ||
    snapshot.thread?.ephemeral !== true ||
    !Array.isArray(snapshot.thread?.turns) ||
    snapshot.thread.turns.length !== 0 ||
    snapshot.approvalPolicy !== request.approvalPolicy ||
    snapshot.approvalsReviewer !== request.approvalsReviewer ||
    stableStringify(snapshot.runtimeWorkspaceRoots) !==
      stableStringify(request.runtimeWorkspaceRoots) ||
    snapshot.activePermissionProfile?.id !== request.permissions ||
    snapshot.sandbox?.type !== "readOnly" ||
    snapshot.sandbox?.networkAccess !== false
  ) {
    throw new Error("authority role-separated instruction sources are invalid");
  }
  snapshot.instructionSources = [];
  return snapshot;
}

function roleSeparatedError(stage, closeCount) {
  const error = new Error("authority role-separated evaluator turn failed");
  error.authorityRoleSeparatedEvidence = {
    schemaVersion: 1,
    adapterId: AUTHORITY_ROLE_SEPARATED_EVALUATOR_ADAPTER_ID,
    status: "blocked",
    stage: BLOCKED_STAGES.has(stage) ? stage : "unmapped",
    sessionCloseCount: closeCount,
    privacy: { ...PRIVACY },
  };
  return error;
}

export function buildAuthorityRoleSeparatedThreadStartRequest(root) {
  if (typeof root !== "string" || !path.isAbsolute(root)) {
    throw new TypeError("authority role-separated root must be absolute");
  }
  const request = buildThreadStartRequest(root, []);
  request.config.project_doc_max_bytes = EVALUATION_PROJECT_DOC_MAX_BYTES;
  return request;
}

export async function runAuthorityRoleSeparatedEvaluatorTurn(options) {
  let stage = "options-validation";
  let session = null;
  let closeCount = 0;
  let closeStarted = false;
  let actualClose = null;
  let sessionControl = null;
  const closeOnce = async () => {
    if (closeStarted || actualClose === null) return;
    closeStarted = true;
    closeCount += 1;
    await Reflect.apply(actualClose, session, []);
  };

  try {
    const data = exactOwnData(
      options,
      OPTION_KEYS,
      "authority role-separated options",
    );
    sessionControl = sessionControlSnapshot(data.session);
    session = sessionControl.session;
    actualClose = sessionControl.close;
    if (typeof data.root !== "string" || !path.isAbsolute(data.root)) {
      fail("authority role-separated root must be absolute");
    }
    const root = path.resolve(data.root);
    const input = exactSingleTextInput(data.input);
    const outputSchema = cloneJson(
      data.outputSchema,
      "authority role-separated output schema",
    );
    if (
      outputSchema === null ||
      typeof outputSchema !== "object" ||
      Array.isArray(outputSchema)
    ) {
      fail("authority role-separated output schema is invalid");
    }
    const projectInstruction = projectInstructionSnapshot(data.projectInstruction);
    stage = "initial-project-binding";
    const initialBinding = await projectBinding(root, projectInstruction);
    const directUserText = input[0].text;
    if (
      initialBinding.text.includes(directUserText) ||
      directUserText.includes(initialBinding.text)
    ) {
      throw new Error("authority role-separated payloads overlap");
    }

    const actualRequest = sessionControl.request;
    const actualSubscribe = sessionControl.subscribe;
    let threadStartCount = 0;
    let turnStartCount = 0;
    let observedProjectSource = false;
    const requireSessionControl = (gate) => {
      stage = gate;
      if (!sessionControlMatches(sessionControl)) {
        throw new Error("authority role-separated session provenance changed");
      }
    };
    const requireBinding = async (gate) => {
      stage = gate;
      const current = await projectBinding(root, projectInstruction);
      if (!sameBinding(initialBinding, current)) {
        throw new Error("authority role-separated binding identity changed");
      }
    };
    const proxySession = {
      notificationCursor: Reflect.apply(
        sessionControl.notificationCursorGetter,
        session,
        [],
      ),
      mcpInventory: cloneJson(
        sessionControl.mcpInventory,
        "authority role-separated MCP inventory",
      ),
      client: {
        request: async (method, params, timeoutMs) => {
          if (method === "thread/start") {
            threadStartCount += 1;
            if (threadStartCount !== 1) {
              throw new Error("authority role-separated thread may start once");
            }
            await requireBinding("before-thread-start");
            requireSessionControl("before-thread-start-session");
            const request = cloneJson(
              params,
              "authority role-separated delegated thread request",
            );
            const expected = buildAuthorityRoleSeparatedThreadStartRequest(root);
            if (
              request.cwd !== root ||
              request.ephemeral !== true ||
              request.config?.project_doc_max_bytes !== 0 ||
              JSON.stringify(request.selectedCapabilityRoots) !== "[]" ||
              JSON.stringify(request.dynamicTools) !== "[]"
            ) {
              throw new Error("authority role-separated delegated thread request drifted");
            }
            request.config.project_doc_max_bytes = EVALUATION_PROJECT_DOC_MAX_BYTES;
            if (stableStringify(request) !== stableStringify(expected)) {
              throw new Error("authority role-separated thread request contract drifted");
            }
            const transportRequest = cloneJson(
              request,
              "authority role-separated thread transport request",
            );
            const requestSnapshot = stableStringify(transportRequest);
            const response = await Reflect.apply(actualRequest, sessionControl.client, [
              method,
              transportRequest,
              timeoutMs,
            ]);
            requireSessionControl("after-thread-start");
            if (stableStringify(transportRequest) !== requestSnapshot) {
              stage = "after-thread-start-request-readback";
              throw new Error("authority role-separated thread request changed in transport");
            }
            const safeResponse = sanitizedThreadResponse(
              response,
              initialBinding.project.resolvedPath,
              request,
            );
            observedProjectSource = true;
            await requireBinding("after-thread-start");
            return safeResponse;
          }
          if (method === "turn/start") {
            turnStartCount += 1;
            if (threadStartCount !== 1 || turnStartCount !== 1) {
              throw new Error("authority role-separated turn may start once");
            }
            await requireBinding("before-turn-start");
            requireSessionControl("before-turn-start-session");
            stage = "turn-request-clone";
            const request = cloneJson(
              params,
              "authority role-separated delegated turn request",
            );
            stage = "turn-input-validation";
            const delegatedInput = exactSingleTextInput(request.input);
            if (
              delegatedInput[0].type !== input[0].type ||
              delegatedInput[0].text !== input[0].text
            ) {
              throw new Error("authority role-separated direct-user input drifted");
            }
            const expectedTurn = {
              threadId: request.threadId,
              input,
              approvalPolicy: "never",
              permissions: buildAuthorityRoleSeparatedThreadStartRequest(root).permissions,
              outputSchema,
            };
            if (stableStringify(request) !== stableStringify(expectedTurn)) {
              throw new Error("authority role-separated turn request contract drifted");
            }
            const transportRequest = cloneJson(
              request,
              "authority role-separated turn transport request",
            );
            const requestSnapshot = stableStringify(transportRequest);
            const response = await Reflect.apply(actualRequest, sessionControl.client, [
              method,
              transportRequest,
              timeoutMs,
            ]);
            requireSessionControl("after-turn-start-session");
            if (stableStringify(transportRequest) !== requestSnapshot) {
              stage = "after-turn-start-request-readback";
              throw new Error("authority role-separated turn request changed in transport");
            }
            await requireBinding("after-turn-start-response");
            return cloneJson(
              response,
              "authority role-separated turn response",
            );
          }
          requireSessionControl("before-auxiliary-request");
          const transportRequest = cloneJson(
            params,
            "authority role-separated auxiliary request",
          );
          const requestSnapshot = stableStringify(transportRequest);
          const response = await Reflect.apply(actualRequest, sessionControl.client, [
            method,
            transportRequest,
            timeoutMs,
          ]);
          requireSessionControl("after-auxiliary-request");
          if (stableStringify(transportRequest) !== requestSnapshot) {
            throw new Error("authority role-separated auxiliary request changed in transport");
          }
          return cloneJson(
            response,
            "authority role-separated auxiliary response",
          );
        },
      },
      subscribe: (...args) => Reflect.apply(actualSubscribe, session, args),
      close: closeOnce,
    };
    for (const key of [
      "remoteControlSnapshot",
      "processExitCode",
      "stderr",
      "imageDiagnostics",
      "successfulImageViews",
    ]) {
      Object.defineProperty(proxySession, key, {
        enumerable: true,
        configurable: false,
        get: () => readCapturedGetter(sessionControl, key),
      });
    }

    stage = "fresh-turn";
    const freshResult = await runFreshEvaluatorTurn({
      session: proxySession,
      root,
      input,
      outputSchema,
      dynamicTools: [],
    });
    requireSessionControl("session-runtime-provenance");
    await requireBinding("after-turn-completion");
    if (
      !observedProjectSource ||
      threadStartCount !== 1 ||
      turnStartCount !== 1 ||
      closeCount !== 1
    ) {
      throw new Error("authority role-separated lifecycle is incomplete");
    }
    const output = cloneJson(
      ownData(freshResult, "output", "authority role-separated fresh result"),
      "authority role-separated structured output",
    );
    const appServer = cloneJson(
      ownData(freshResult, "appServer", "authority role-separated fresh result"),
      "authority role-separated app-server evidence",
    );
    if (
      appServer.processExitCode !== 0 ||
      appServer.stderr?.byteLength !== 0 ||
      appServer.remoteControl?.status !== "disabled"
    ) {
      throw new Error("authority role-separated runtime evidence is unsafe");
    }
    stage = "complete";
    return {
      schemaVersion: 1,
      adapterId: AUTHORITY_ROLE_SEPARATED_EVALUATOR_ADAPTER_ID,
      output: JSON.parse(stableStringify(output)),
      roles: {
        projectInstruction: {
          role: "project",
          instructionSourceCount: 1,
          relativePath: projectInstruction.relativePath,
          bytes: projectInstruction.bytes,
          sha256: projectInstruction.sha256,
        },
        directUser: {
          role: "user",
          descriptorCount: 1,
          type: "text",
          bytes: Buffer.byteLength(directUserText),
          sha256: sha256(directUserText),
        },
      },
      runtime: {
        freshTurnCount: 1,
        retryCount: 0,
        projectDocMaxBytes: EVALUATION_PROJECT_DOC_MAX_BYTES,
        dynamicToolCount: 0,
        selectedCapabilityRootCount: 0,
        priorTurnCount: 0,
        instructionSourceCount: 1,
        appServerExitCode: 0,
        stderrByteLength: 0,
        remoteControl: "DISABLED",
        sessionCleanup: "SAFE",
      },
      privacy: { ...PRIVACY },
    };
  } catch {
    stage = stage === "complete" ? "post-validation" : stage;
    try {
      await closeOnce();
    } catch {
      stage = "session-cleanup";
    }
    if (closeStarted && sessionControl !== null) {
      try {
        if (
          readCapturedGetter(sessionControl, "processExitCode") === null
        ) {
          stage = "session-cleanup";
        }
      } catch {
        stage = "session-cleanup";
      }
    }
    throw roleSeparatedError(stage, closeCount);
  }
}
