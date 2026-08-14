import { lstat, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { types as utilTypes } from "node:util";
import {
  EVALUATION_PERMISSION_PROFILE,
  buildThreadStartRequest,
  classifyEventScope,
  containsCredentialText,
  diagnosticOwnData,
  listMcpServerStatus,
  normalizeEvent,
  parseThreadStartResponse,
  remoteControlSnapshotIsSafe,
  sanitizeDiagnosticEvidence,
  sha256,
  stableStringify,
  verifyMcpRuntimeIsInert,
} from "./collect-codex-app-server.mjs";

const FORBIDDEN_ITEM_TYPES = new Set([
  "commandExecution",
  "fileChange",
  "mcpToolCall",
  "webSearch",
  "collabAgentToolCall",
]);
const RETAINED_EVENT_LIMIT = 512;
const AGENT_MESSAGE_DELTA_FRAGMENT_LIMIT = 4096;
const AGENT_MESSAGE_DELTA_BYTE_LIMIT = 1024 * 1024;
const EVENT_METHOD_BUCKETS = Object.freeze([
  "account/rateLimits/updated",
  "item/agentMessage/delta",
  "item/commandExecution/outputDelta",
  "item/completed",
  "item/plan/delta",
  "item/reasoning/summaryPartAdded",
  "item/reasoning/summaryTextDelta",
  "item/reasoning/textDelta",
  "item/started",
  "remoteControl/status/changed",
  "serverRequest/resolved",
  "thread/started",
  "thread/status/changed",
  "thread/tokenUsage/updated",
  "turn/completed",
  "turn/plan/updated",
  "turn/started",
  "windowsSandbox/setupCompleted",
  "configWarning",
  "error",
  "guardianWarning",
  "hook/completed",
  "hook/started",
  "item/autoApprovalReview/completed",
  "item/autoApprovalReview/started",
  "item/fileChange/outputDelta",
  "item/fileChange/patchUpdated",
  "item/mcpToolCall/progress",
  "mcpServer/oauthLogin/completed",
  "mcpServer/startupStatus/updated",
  "model/rerouted",
  "thread/settings/updated",
  "turn/diff/updated",
  "warning",
  "windows/worldWritableWarning",
  "collector/serverRequest",
  "other",
]);
const EVENT_METHOD_BUCKET_SET = new Set(EVENT_METHOD_BUCKETS.slice(0, -1));
const ITEM_TYPE_BUCKETS = Object.freeze([
  "reasoning",
  "imageView",
  "commandExecution",
  "dynamicToolCall",
  "agentMessage",
  "userMessage",
  "mcpToolCall",
  "webSearch",
  "collabAgentToolCall",
  "fileChange",
  "other",
]);
const ITEM_TYPE_BUCKET_SET = new Set(ITEM_TYPE_BUCKETS.slice(0, -1));
const NORMALIZER_BLOCKER_CODES = new Set([
  "approval-requested",
  "hook-executed",
  "image-view-target-mismatch",
  "image-view-target-unverified",
  "message-delta-limit-exceeded",
  "required-command-missing",
  "required-cwd-missing",
  "required-exit-code-missing",
  "required-output-missing",
  "required-output-truncated",
  "required-status-missing",
  "runtime-drift",
  "runtime-error",
  "runtime-warning",
  "sandbox-setup-failed",
  "secret-shaped-output",
  "uncontrolled-control-plane",
  "uncontrolled-tool-surface",
  "unknown-item-type",
  "unknown-notification",
  "user-input-requested",
]);

function unique(values) {
  return [...new Set(values)];
}

function incrementCount(counts, key, amount = 1) {
  const next = (counts.get(key) ?? 0) + amount;
  if (!Number.isSafeInteger(next) || next < 0) {
    throw new Error("fresh evaluator event aggregate exceeded a safe integer");
  }
  counts.set(key, next);
}

function fixedHistogram(counts, buckets, label) {
  const entries = buckets.flatMap((bucket) => {
    const count = counts.get(bucket) ?? 0;
    return count === 0 ? [] : [{ [label]: bucket, count }];
  });
  return {
    eventCount: entries.reduce((sum, entry) => sum + entry.count, 0),
    entries,
  };
}

function deltaSummary(itemId, count, text) {
  return {
    itemId,
    count,
    byteLength: Buffer.byteLength(text, "utf8"),
    sha256: sha256(text),
  };
}

function messageDeltaKey(event, itemId) {
  return (
    typeof event?.threadId === "string" &&
    event.threadId &&
    typeof event?.turnId === "string" &&
    event.turnId &&
    typeof itemId === "string" &&
    itemId
  )
    ? stableStringify([event.threadId, event.turnId, itemId])
    : null;
}

function exactKeys(value, keys) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).sort().join("\0") === [...keys].sort().join("\0")
  );
}

function isJsonObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function readExactDataObject(value, keys) {
  if (
    value === null ||
    typeof value !== "object" ||
    utilTypes.isProxy(value) ||
    Array.isArray(value)
  ) {
    return null;
  }
  let prototype;
  let ownKeys;
  try {
    prototype = Object.getPrototypeOf(value);
    ownKeys = Reflect.ownKeys(value);
  } catch {
    return null;
  }
  if (
    (prototype !== Object.prototype && prototype !== null) ||
    ownKeys.length !== keys.length ||
    ownKeys.some((key) => typeof key !== "string" || !keys.includes(key))
  ) {
    return null;
  }
  const result = Object.create(null);
  for (const key of keys) {
    let descriptor;
    try {
      descriptor = Object.getOwnPropertyDescriptor(value, key);
    } catch {
      return null;
    }
    if (
      descriptor === undefined ||
      !Object.hasOwn(descriptor, "value") ||
      descriptor.enumerable !== true
    ) {
      return null;
    }
    result[key] = descriptor.value;
  }
  return result;
}

function readBoundedDataArray(value, maxLength) {
  if (utilTypes.isProxy(value) || !Array.isArray(value)) {
    return null;
  }
  let prototype;
  let lengthDescriptor;
  try {
    prototype = Object.getPrototypeOf(value);
    lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
  } catch {
    return null;
  }
  if (
    prototype !== Array.prototype ||
    lengthDescriptor === undefined ||
    !Object.hasOwn(lengthDescriptor, "value") ||
    !Number.isSafeInteger(lengthDescriptor.value) ||
    lengthDescriptor.value < 0 ||
    lengthDescriptor.value > maxLength
  ) {
    return null;
  }
  const length = lengthDescriptor.value;
  let ownKeys;
  try {
    ownKeys = Reflect.ownKeys(value);
  } catch {
    return null;
  }
  const expectedKeys = [
    ...Array.from({ length }, (_, index) => String(index)),
    "length",
  ];
  if (
    ownKeys.length !== expectedKeys.length ||
    ownKeys.some((key, index) => key !== expectedKeys[index])
  ) {
    return null;
  }
  const result = [];
  for (let index = 0; index < length; index += 1) {
    let descriptor;
    try {
      descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    } catch {
      return null;
    }
    if (
      descriptor === undefined ||
      !Object.hasOwn(descriptor, "value") ||
      descriptor.enumerable !== true
    ) {
      return null;
    }
    result.push(descriptor.value);
  }
  return result;
}

function cloneJson(value, label) {
  let text;
  try {
    text = stableStringify(value);
  } catch (cause) {
    throw new TypeError(`${label} must be JSON serializable`, { cause });
  }
  if (text === undefined) {
    throw new TypeError(`${label} must be JSON serializable`);
  }
  return JSON.parse(text);
}

function isPathInsideOrEqual(root, candidate) {
  const relative = path.relative(root, candidate);
  return (
    relative === "" ||
    (relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative))
  );
}

function validateDynamicTools(dynamicTools, dynamicToolController) {
  if (!Array.isArray(dynamicTools)) {
    throw new TypeError("fresh evaluator dynamic tools must be an array");
  }
  const names = new Set();
  for (const tool of dynamicTools) {
    if (
      !isJsonObject(tool) ||
      tool.type !== "function" ||
      typeof tool.name !== "string" ||
      !tool.name ||
      names.has(tool.name)
    ) {
      throw new TypeError("fresh evaluator dynamic tool descriptor is malformed");
    }
    cloneJson(tool, "fresh evaluator dynamic tool descriptor");
    names.add(tool.name);
  }
  if (
    (dynamicTools.length > 0 && typeof dynamicToolController !== "function") ||
    (dynamicTools.length === 0 && dynamicToolController !== undefined)
  ) {
    throw new TypeError(
      "fresh evaluator dynamic tool controller must exactly match configured tools",
    );
  }
  return names;
}

export function buildFreshEvaluatorThreadStartRequest(root, dynamicTools = []) {
  if (typeof root !== "string" || !path.isAbsolute(root)) {
    throw new TypeError("fresh evaluator root must be an absolute path");
  }
  if (!Array.isArray(dynamicTools)) {
    throw new TypeError("fresh evaluator dynamic tools must be an array");
  }
  const request = buildThreadStartRequest(root, dynamicTools);
  request.config.project_doc_max_bytes = 0;
  return request;
}

async function describeInput(root, input) {
  if (!Array.isArray(input) || input.length === 0) {
    throw new TypeError("fresh evaluator input must be a nonempty array");
  }
  const rootStat = await lstat(root);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) {
    throw new Error("fresh evaluator root must be a real directory");
  }
  const resolvedRoot = await realpath(root);
  const descriptors = [];
  const privateImages = [];
  let textCount = 0;
  for (const [index, entry] of input.entries()) {
    if (exactKeys(entry, ["type", "text"]) && entry.type === "text") {
      if (typeof entry.text !== "string" || !entry.text) {
        throw new TypeError("fresh evaluator text input is malformed");
      }
      textCount += 1;
      descriptors.push({
        index,
        type: "text",
        byteLength: Buffer.byteLength(entry.text),
        sha256: sha256(entry.text),
      });
      continue;
    }
    if (exactKeys(entry, ["type", "path"]) && entry.type === "localImage") {
      if (typeof entry.path !== "string" || !path.isAbsolute(entry.path)) {
        throw new TypeError("fresh evaluator local image path is malformed");
      }
      const fileStat = await lstat(entry.path);
      const resolvedFile = await realpath(entry.path);
      if (
        !fileStat.isFile() ||
        fileStat.isSymbolicLink() ||
        !isPathInsideOrEqual(resolvedRoot, resolvedFile)
      ) {
        throw new Error(
          "fresh evaluator local image must be an in-root regular file",
        );
      }
      const bytes = await readFile(entry.path);
      descriptors.push({
        index,
        type: "localImage",
        byteLength: bytes.length,
        sha256: sha256(bytes),
        absolute: true,
        withinResolvedRoot: true,
        regularFile: true,
        nonSymlink: true,
        readable: true,
        originalDetail: "unverified",
      });
      privateImages.push({ index, path: entry.path, resolvedPath: resolvedFile });
      continue;
    }
    throw new TypeError("fresh evaluator input descriptor is malformed");
  }
  if (textCount === 0) {
    throw new TypeError("fresh evaluator input requires text");
  }
  const evidence = {
    descriptors,
    requestSha256: sha256(stableStringify(descriptors)),
  };
  return {
    evidence,
    privateBinding: {
      root,
      resolvedRoot,
      images: privateImages,
    },
  };
}

function inputSnapshotsMatch(left, right) {
  if (
    stableStringify(left?.evidence) !== stableStringify(right?.evidence) ||
    left?.privateBinding?.root !== right?.privateBinding?.root ||
    left?.privateBinding?.resolvedRoot !== right?.privateBinding?.resolvedRoot
  ) {
    return false;
  }
  const leftImages = left.privateBinding.images;
  const rightImages = right.privateBinding.images;
  return (
    Array.isArray(leftImages) &&
    Array.isArray(rightImages) &&
    leftImages.length === rightImages.length &&
    leftImages.every(
      (image, index) =>
        image.index === rightImages[index]?.index &&
        image.path === rightImages[index]?.path &&
        image.resolvedPath === rightImages[index]?.resolvedPath,
    )
  );
}

function imageSnapshotsMatch(left, right, inputIndex) {
  if (
    left?.privateBinding?.root !== right?.privateBinding?.root ||
    left?.privateBinding?.resolvedRoot !== right?.privateBinding?.resolvedRoot
  ) {
    return false;
  }
  const leftImage = left.privateBinding.images.find(
    (image) => image.index === inputIndex,
  );
  const rightImage = right.privateBinding.images.find(
    (image) => image.index === inputIndex,
  );
  return (
    leftImage !== undefined &&
    rightImage !== undefined &&
    leftImage.path === rightImage.path &&
    leftImage.resolvedPath === rightImage.resolvedPath &&
    stableStringify(left.evidence.descriptors[inputIndex]) ===
      stableStringify(right.evidence.descriptors[inputIndex])
  );
}

function controllerLocalImageEvidence(initial, beforeTurn, postTurn = null) {
  return initial.privateBinding.images.map((image) => {
    const descriptor = initial.evidence.descriptors[image.index];
    const checkedBeforeTurnStart = beforeTurn !== null;
    const unchangedBeforeTurnStart =
      checkedBeforeTurnStart &&
      imageSnapshotsMatch(initial, beforeTurn, image.index);
    const readablePostTurn = postTurn !== null;
    const unchangedPostTurn =
      readablePostTurn &&
      imageSnapshotsMatch(initial, postTurn, image.index) &&
      imageSnapshotsMatch(beforeTurn, postTurn, image.index);
    return {
      inputIndex: image.index,
      byteLength: descriptor.byteLength,
      sha256: descriptor.sha256,
      absolute: descriptor.absolute,
      withinResolvedRoot: descriptor.withinResolvedRoot,
      regularFile: descriptor.regularFile,
      nonSymlink: descriptor.nonSymlink,
      readable: descriptor.readable,
      checkedBeforeThreadStart: true,
      checkedBeforeTurnStart,
      unchangedBeforeTurnStart,
      postTurnPreCleanup: {
        readable: readablePostTurn,
        unchanged: unchangedPostTurn,
      },
    };
  });
}

const IMAGE_DIAGNOSTIC_KEYS = Object.freeze([
  "status",
  "observationCount",
  "expectedTargetCount",
  "effectivePathMatch",
  "matchedInputIndex",
  "effectivePathAbsolute",
  "effectivePathWithinRoot",
  "modelArgumentAbsolute",
  "outerCategory",
  "reportedCategory",
  "privacy",
]);

function imageDiagnosticsAreSafe(
  value,
  expectedInputIndexes,
  stderrByteLength,
) {
  if (
    !exactKeys(value, IMAGE_DIAGNOSTIC_KEYS) ||
    !Array.isArray(expectedInputIndexes) ||
    !Number.isSafeInteger(value.observationCount) ||
    value.observationCount < 0 ||
    value.expectedTargetCount !== expectedInputIndexes.length ||
    !["MATCH", "MISMATCH", "UNVERIFIED"].includes(
      value.effectivePathMatch,
    ) ||
    !["VERIFIED", "UNVERIFIED"].includes(value.effectivePathAbsolute) ||
    !["VERIFIED", "UNVERIFIED"].includes(
      value.effectivePathWithinRoot,
    ) ||
    value.modelArgumentAbsolute !== "UNVERIFIED" ||
    !["unable-to-locate", "unable-to-read", "UNVERIFIED"].includes(
      value.outerCategory,
    ) ||
    ![
      "sandbox-helper-failed",
      "permission-denied",
      "not-found",
      "invalid-path",
      "unclassified",
      "UNVERIFIED",
    ].includes(value.reportedCategory) ||
    !exactKeys(value.privacy, [
      "rawPathPersisted",
      "pathDigestPersisted",
      "rawDiagnosticDigestPersisted",
    ]) ||
    value.privacy.rawPathPersisted !== false ||
    value.privacy.pathDigestPersisted !== false ||
    value.privacy.rawDiagnosticDigestPersisted !== false
  ) {
    return false;
  }
  if (value.status === "NO_ROUTER_IMAGE_ERROR") {
    return (
      value.observationCount === 0 &&
      value.effectivePathMatch === "UNVERIFIED" &&
      value.matchedInputIndex === null &&
      value.effectivePathAbsolute === "UNVERIFIED" &&
      value.effectivePathWithinRoot === "UNVERIFIED" &&
      value.outerCategory === "UNVERIFIED" &&
      value.reportedCategory === "UNVERIFIED"
    );
  }
  const stderrObserved =
    Number.isSafeInteger(stderrByteLength) && stderrByteLength > 0;
  if (value.status === "OBSERVED") {
    return (
      stderrObserved &&
      value.observationCount === 1 &&
      value.effectivePathMatch === "MATCH" &&
      expectedInputIndexes.includes(value.matchedInputIndex) &&
      value.effectivePathAbsolute === "VERIFIED" &&
      value.effectivePathWithinRoot === "VERIFIED" &&
      ["unable-to-locate", "unable-to-read"].includes(value.outerCategory) &&
      value.reportedCategory !== "UNVERIFIED"
    );
  }
  if (value.status !== "UNVERIFIED" || !stderrObserved) {
    return false;
  }
  return (
    value.matchedInputIndex === null &&
    value.effectivePathAbsolute === "UNVERIFIED" &&
    value.effectivePathWithinRoot === "UNVERIFIED" &&
    value.outerCategory === "UNVERIFIED" &&
    value.reportedCategory === "UNVERIFIED" &&
    ((value.effectivePathMatch === "MISMATCH" &&
      value.observationCount === 1) ||
      value.effectivePathMatch === "UNVERIFIED")
  );
}

const SUCCESSFUL_IMAGE_VIEW_KEYS = Object.freeze([
  "complete",
  "eventCount",
  "completedCount",
  "items",
  "blockers",
  "privacy",
]);
const SUCCESSFUL_IMAGE_VIEW_ITEM_KEYS = Object.freeze([
  "id",
  "matchedInputIndex",
  "eventCount",
  "startedCount",
  "completedCount",
  "complete",
]);
const SUCCESSFUL_IMAGE_VIEW_ITEM_LIMIT = 8;
const SUCCESSFUL_IMAGE_VIEW_EVENT_LIMIT = 16;
const SUCCESSFUL_IMAGE_VIEW_TEXT_BYTES = 128;
const SUCCESSFUL_IMAGE_VIEW_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/u;
const SUCCESSFUL_IMAGE_VIEW_BLOCKERS = new Set([
  "image-view-limit-exceeded",
  "image-view-invalid-id",
  "image-view-duplicate-started",
  "image-view-completed-without-started",
  "image-view-duplicate-completed",
  "image-view-extra-shape",
  "image-view-target-mismatch",
  "image-view-target-unverified",
  "image-view-target-drift",
  "image-view-lifecycle-incomplete",
]);

function validatedSuccessfulImageViews(value, expectedInputIndexes) {
  const snapshot = readExactDataObject(value, SUCCESSFUL_IMAGE_VIEW_KEYS);
  if (
    snapshot === null ||
    typeof snapshot.complete !== "boolean" ||
    !Number.isSafeInteger(snapshot.eventCount) ||
    snapshot.eventCount < 0 ||
    snapshot.eventCount > SUCCESSFUL_IMAGE_VIEW_EVENT_LIMIT ||
    !Number.isSafeInteger(snapshot.completedCount) ||
    snapshot.completedCount < 0 ||
    snapshot.completedCount > SUCCESSFUL_IMAGE_VIEW_ITEM_LIMIT ||
    snapshot.completedCount > snapshot.eventCount
  ) {
    return null;
  }
  const items = readBoundedDataArray(
    snapshot.items,
    SUCCESSFUL_IMAGE_VIEW_ITEM_LIMIT,
  );
  const blockers = readBoundedDataArray(
    snapshot.blockers,
    SUCCESSFUL_IMAGE_VIEW_EVENT_LIMIT,
  );
  const privacy = readExactDataObject(snapshot.privacy, [
      "rawPathPersisted",
      "pathDigestPersisted",
      "rawDiagnosticDigestPersisted",
    ]);
  if (
    items === null ||
    blockers === null ||
    privacy === null ||
    privacy.rawPathPersisted !== false ||
    privacy.pathDigestPersisted !== false ||
    privacy.rawDiagnosticDigestPersisted !== false
  ) {
    return null;
  }
  const validatedBlockers = [];
  for (const blocker of blockers) {
    if (
      typeof blocker !== "string" ||
      blocker.length < 1 ||
      blocker.length > SUCCESSFUL_IMAGE_VIEW_TEXT_BYTES ||
      Buffer.byteLength(blocker) > SUCCESSFUL_IMAGE_VIEW_TEXT_BYTES ||
      containsCredentialText(blocker) ||
      !SUCCESSFUL_IMAGE_VIEW_BLOCKERS.has(blocker)
    ) {
      return null;
    }
    validatedBlockers.push(blocker);
  }
  const ids = new Set();
  let eventCount = 0;
  let completedCount = 0;
  const validatedItems = [];
  for (const rawItem of items) {
    const item = readExactDataObject(rawItem, SUCCESSFUL_IMAGE_VIEW_ITEM_KEYS);
    if (
      item === null ||
      typeof item.id !== "string" ||
      item.id.length < 1 ||
      item.id.length > SUCCESSFUL_IMAGE_VIEW_TEXT_BYTES ||
      Buffer.byteLength(item.id) > SUCCESSFUL_IMAGE_VIEW_TEXT_BYTES ||
      !SUCCESSFUL_IMAGE_VIEW_ID_PATTERN.test(item.id) ||
      containsCredentialText(item.id) ||
      ids.has(item.id) ||
      !expectedInputIndexes.includes(item.matchedInputIndex) ||
      !Number.isSafeInteger(item.eventCount) ||
      item.eventCount < 1 ||
      !Number.isSafeInteger(item.startedCount) ||
      item.startedCount < 0 ||
      item.startedCount > SUCCESSFUL_IMAGE_VIEW_EVENT_LIMIT ||
      !Number.isSafeInteger(item.completedCount) ||
      item.completedCount < 0 ||
      item.completedCount > SUCCESSFUL_IMAGE_VIEW_EVENT_LIMIT ||
      item.eventCount !== item.startedCount + item.completedCount ||
      typeof item.complete !== "boolean" ||
      (item.complete &&
        (item.eventCount !== 2 ||
          item.startedCount !== 1 ||
          item.completedCount !== 1))
    ) {
      return null;
    }
    ids.add(item.id);
    eventCount += item.eventCount;
    completedCount += item.completedCount;
    validatedItems.push({
      id: item.id,
      matchedInputIndex: item.matchedInputIndex,
      eventCount: item.eventCount,
      startedCount: item.startedCount,
      completedCount: item.completedCount,
      complete: item.complete,
    });
  }
  if (
    snapshot.eventCount !== eventCount ||
    snapshot.completedCount !== completedCount ||
    snapshot.complete !==
      (validatedBlockers.length === 0 &&
        validatedItems.every(({ complete }) => complete))
  ) {
    return null;
  }
  return {
    complete: snapshot.complete,
    eventCount: snapshot.eventCount,
    completedCount: snapshot.completedCount,
    items: validatedItems,
    blockers: validatedBlockers,
    privacy: {
      rawPathPersisted: false,
      pathDigestPersisted: false,
      rawDiagnosticDigestPersisted: false,
    },
  };
}

function localImageDiagnosticBinding(snapshot) {
  return {
    root: snapshot.privateBinding.resolvedRoot,
    images: snapshot.privateBinding.images.map((image) => {
      const descriptor = snapshot.evidence.descriptors[image.index];
      return {
        inputIndex: image.index,
        sentPath: image.path,
        resolvedPath: image.resolvedPath,
        byteLength: descriptor.byteLength,
        sha256: descriptor.sha256,
      };
    }),
  };
}

function summarizeThreadStartRequest(request) {
  return {
    ephemeral: request.ephemeral === true,
    approvalPolicy: request.approvalPolicy,
    permissions: request.permissions,
    projectDocMaxBytes: request.config?.project_doc_max_bytes,
    selectedCapabilityRootCount: Array.isArray(request.selectedCapabilityRoots)
      ? request.selectedCapabilityRoots.length
      : null,
    dynamicToolCount: Array.isArray(request.dynamicTools)
      ? request.dynamicTools.length
      : null,
    runtimeWorkspaceRootCount: Array.isArray(request.runtimeWorkspaceRoots)
      ? request.runtimeWorkspaceRoots.length
      : null,
    environmentCount: Array.isArray(request.environments)
      ? request.environments.length
      : null,
  };
}

function durableThreadSummary(thread) {
  return {
    id: thread.id,
    model: thread.model,
    modelProvider: thread.modelProvider,
    reasoningEffort: thread.reasoningEffort,
    serviceTier: thread.serviceTier,
    activePermissionProfileId: thread.activePermissionProfile?.id ?? null,
    approvalPolicy: thread.approvalPolicy,
    approvalsReviewer: thread.approvalsReviewer,
    sandbox: thread.sandbox,
    ephemeral: thread.ephemeral,
    priorTurnCount: thread.priorTurnCount,
    instructionSourceCount: Array.isArray(thread.instructionSources)
      ? thread.instructionSources.length
      : null,
    runtimeWorkspaceRootCount: Array.isArray(thread.runtimeWorkspaceRoots)
      ? thread.runtimeWorkspaceRoots.length
      : null,
  };
}

function normalizeDynamicToolEvent(notification, allowedToolNames) {
  const params = notification?.params ?? {};
  const item = params.item;
  if (
    !["item/started", "item/completed"].includes(notification?.method) ||
    item?.type !== "dynamicToolCall"
  ) {
    return null;
  }
  const blockers = [];
  const argumentsValue = isJsonObject(item.arguments)
    ? cloneJson(item.arguments, "dynamic tool lifecycle arguments")
    : null;
  if (
    typeof params.threadId !== "string" ||
    !params.threadId ||
    typeof params.turnId !== "string" ||
    !params.turnId ||
    typeof item.id !== "string" ||
    !item.id ||
    typeof item.tool !== "string" ||
    !allowedToolNames.has(item.tool) ||
    argumentsValue === null
  ) {
    blockers.push("uncontrolled-tool-surface");
  }
  if (containsCredentialText(argumentsValue)) {
    blockers.push("secret-shaped-output");
  }
  const event = {
    method: notification.method,
    threadId: params.threadId,
    turnId: params.turnId,
    item: {
      id: item?.id,
      type: "dynamicToolCall",
      tool: item?.tool,
      arguments: argumentsValue,
      argumentsSha256:
        argumentsValue === null ? null : sha256(stableStringify(argumentsValue)),
      status: item?.status,
    },
    blockers,
  };
  if (notification.method === "item/started") {
    if (item.status !== "inProgress") blockers.push("required-status-missing");
  } else if (
    !["completed", "failed"].includes(item.status) ||
    typeof item.success !== "boolean" ||
    item.status !== (item.success ? "completed" : "failed") ||
    !Array.isArray(item.contentItems) ||
    item.contentItems.length !== 1 ||
    item.contentItems[0]?.type !== "inputText" ||
    typeof item.contentItems[0]?.text !== "string"
  ) {
    blockers.push("runtime-drift");
  } else {
    const responseText = item.contentItems[0].text;
    event.item.success = item.success;
    event.item.response = {
      byteLength: Buffer.byteLength(responseText),
      sha256: sha256(responseText),
    };
    if (containsCredentialText(responseText)) {
      blockers.push("secret-shaped-output");
    }
  }
  event.blockers = unique(blockers);
  event.complete = event.blockers.length === 0;
  return event;
}

function dynamicLifecycleMatches(events, toolEvidence) {
  const lifecycleEvents = events.filter(
    (event) => event.item?.type === "dynamicToolCall",
  );
  if (lifecycleEvents.length !== toolEvidence.length * 2) return false;
  if (new Set(toolEvidence.map(({ callId }) => callId)).size !== toolEvidence.length) {
    return false;
  }
  return toolEvidence.every((evidence) => {
    const lifecycle = lifecycleEvents.filter(
      (event) => event.item.id === evidence.callId,
    );
    return (
      lifecycle.length === 2 &&
      lifecycle[0].method === "item/started" &&
      lifecycle[1].method === "item/completed" &&
      lifecycle[0].item.status === "inProgress" &&
      lifecycle[1].item.status === evidence.status &&
      lifecycle.every(
        (event) =>
          event.item.tool === evidence.tool &&
          event.item.argumentsSha256 === evidence.argumentsSha256 &&
          stableStringify(event.item.arguments) ===
            stableStringify(evidence.arguments),
      ) &&
      lifecycle[1].item.response?.byteLength ===
        evidence.response.byteLength &&
      lifecycle[1].item.response?.sha256 === evidence.response.sha256
    );
  });
}

function summarizeThreadStart(response) {
  return {
    threadId:
      typeof response?.thread?.id === "string" ? response.thread.id : null,
    ephemeral: response?.thread?.ephemeral === true,
    priorTurnCount: Array.isArray(response?.thread?.turns)
      ? response.thread.turns.length
      : null,
    instructionSourceCount: Array.isArray(response?.instructionSources)
      ? response.instructionSources.length
      : null,
  };
}

function finalAgentText(message) {
  const value = message?.item?.text;
  if (
    !value ||
    value.truncated !== false ||
    typeof value.text !== "string" ||
    !value.text
  ) {
    throw new Error("fresh evaluator final agent text is missing or truncated");
  }
  return value.text;
}

function attachEvidence(error, evidence) {
  const primaryCause = {};
  for (const key of ["name", "code", "message", "details"]) {
    const property = diagnosticOwnData(error, key);
    if (property.found) {
      primaryCause[key] = sanitizeDiagnosticEvidence(property.value);
    }
  }
  if (Object.keys(primaryCause).length > 0) {
    evidence.primaryCause = primaryCause;
  }
  const failure = new Error("fresh evaluator turn validation failed", {
    cause: error,
  });
  failure.freshEvaluatorEvidence = evidence;
  return failure;
}

export async function runFreshEvaluatorTurn({
  session,
  root,
  input,
  outputSchema,
  dynamicTools = [],
  dynamicToolController,
  turnTimeoutMs = 180_000,
} = {}) {
  const events = [];
  const pending = [];
  const blockers = [];
  const toolEvidence = [];
  const evidence = {
    threadStart: { request: null, response: null },
    thread: null,
    turn: { id: null, request: null },
    input: null,
    outputSchema: null,
    events,
    eventCompaction: null,
    toolEvidence,
    mcpAfter: null,
    blockers,
    appServer: {
      processExitCode: null,
      stderr: null,
      remoteControl: null,
      imageDiagnostics: null,
      successfulImageViews: null,
    },
  };
  let allowedToolNames = new Set();
  let threadId = null;
  let turnId = null;
  let toolTurnId = null;
  let terminalEvent = null;
  let latestPreTerminalAgentMessage = null;
  let terminalAgentMessage = null;
  let terminalCount = 0;
  let primaryError = null;
  let closeError = null;
  const cleanupErrors = [];
  let unsubscribe = null;
  let unsubscribeCompletion = Promise.resolve();
  let deltaInterruptPromise = null;
  let releaseTool = null;
  let initialInputSnapshot = null;
  let turnStartInputSnapshot = null;
  let expectedLocalImageCount = 0;
  let successfulImageViewsMalformed = false;
  let successfulImageViewsIncomplete = false;
  let observedEventCount = 0;
  const methodCounts = new Map();
  const itemTypeCounts = new Map();
  const normalizerBlockerCodes = new Set();
  let normalizerBlockerUnmapped = false;
  const deltaGroupKeys = new Set();
  const deltaStates = new Map();
  const deltaObservations = new WeakMap();
  const completedAgentMessageCounts = new Map();
  let deltaFragmentCount = 0;
  let deltaByteLength = 0;
  let deltaTranscript = "";
  let deltaFragmentLimitExceeded = false;
  let deltaByteLimitExceeded = false;
  let deltaCollectionStopped = false;
  let resolveTerminal;
  const terminalPromise = new Promise((resolve) => {
    resolveTerminal = resolve;
  });

  function stopNotificationCollection() {
    const stop = unsubscribe;
    unsubscribe = null;
    if (typeof stop !== "function") return;
    try {
      unsubscribeCompletion = Promise.resolve(stop()).catch((error) => {
        cleanupErrors.push(error);
        blockers.push("cleanup-unsubscribe-failed");
      });
    } catch (error) {
      cleanupErrors.push(error);
      blockers.push("cleanup-unsubscribe-failed");
    }
  }

  function ensureDeltaOverflowInterrupt() {
    if (
      !deltaCollectionStopped ||
      deltaInterruptPromise !== null ||
      threadId === null ||
      turnId === null
    ) {
      return deltaInterruptPromise ?? Promise.resolve();
    }
    deltaInterruptPromise = session.client
      .request("turn/interrupt", { threadId, turnId }, 10_000)
      .catch((error) => {
        cleanupErrors.push(error);
        blockers.push("cleanup-turn-interrupt-failed");
      });
    return deltaInterruptPromise;
  }

  function countObservedEvent(event) {
    observedEventCount += 1;
    if (!Number.isSafeInteger(observedEventCount)) {
      throw new Error("fresh evaluator observed event count exceeded a safe integer");
    }
    const method = typeof event.method === "string" && EVENT_METHOD_BUCKET_SET.has(event.method)
      ? event.method
      : "other";
    incrementCount(methodCounts, method);
    if (typeof event.item?.type === "string") {
      const itemType = ITEM_TYPE_BUCKET_SET.has(event.item.type)
        ? event.item.type
        : "other";
      incrementCount(itemTypeCounts, itemType);
    }
  }

  function observeNormalizerBlockers(event) {
    for (const blocker of event.blockers) {
      if (NORMALIZER_BLOCKER_CODES.has(blocker)) {
        normalizerBlockerCodes.add(blocker);
      } else {
        normalizerBlockerUnmapped = true;
      }
    }
  }

  function buildEventCompactionEvidence() {
    const methodHistogram = fixedHistogram(
      methodCounts,
      EVENT_METHOD_BUCKETS,
      "method",
    );
    const itemTypeHistogram = fixedHistogram(
      itemTypeCounts,
      ITEM_TYPE_BUCKETS,
      "itemType",
    );
    if (methodHistogram.eventCount !== observedEventCount) {
      throw new Error("fresh evaluator method histogram is inconsistent");
    }
    const normalizerBlocker = {
      provenance: "adapter-normalization-fixed-enum",
      classification: normalizerBlockerUnmapped
        ? "unmapped"
        : normalizerBlockerCodes.size === 0
          ? "none"
          : normalizerBlockerCodes.size === 1
            ? [...normalizerBlockerCodes][0]
            : "multiple",
    };
    return {
      observedEventCount,
      retainedEventCount: events.length,
      retainedEventLimit: RETAINED_EVENT_LIMIT,
      retainedEventsOverLimit: events.length > RETAINED_EVENT_LIMIT,
      methodHistogram,
      itemTypeHistogram,
      agentMessageDelta: {
        groupCount: deltaGroupKeys.size,
        fragmentCount: deltaFragmentCount,
        byteLength: deltaByteLength,
        fragmentLimit: AGENT_MESSAGE_DELTA_FRAGMENT_LIMIT,
        byteLimit: AGENT_MESSAGE_DELTA_BYTE_LIMIT,
        fragmentLimitExceeded: deltaFragmentLimitExceeded,
        byteLimitExceeded: deltaByteLimitExceeded,
        rawTextRetained: false,
      },
      normalizerBlocker,
      rawPayloadRetained: false,
    };
  }

  function addEventBlockers(event, reasons) {
    if (reasons.length === 0) return;
    const additions = reasons.filter((reason) => !event.blockers.includes(reason));
    event.blockers = unique([...event.blockers, ...additions]);
    event.complete = false;
    blockers.push(...additions.filter((reason) => !blockers.includes(reason)));
  }

  function observeDelta(event) {
    if (event.method !== "item/agentMessage/delta") return null;
    const raw = exactKeys(event.messageDelta, ["itemId", "text"]) &&
      typeof event.messageDelta.itemId === "string" &&
      typeof event.messageDelta.text === "string";
    const summarized = exactKeys(event.messageDelta, [
      "itemId", "count", "byteLength", "sha256",
    ]) &&
      typeof event.messageDelta.itemId === "string" &&
      event.messageDelta.itemId.length > 0 &&
      Number.isSafeInteger(event.messageDelta.count) &&
      event.messageDelta.count > 0 &&
      Number.isSafeInteger(event.messageDelta.byteLength) &&
      event.messageDelta.byteLength >= 0 &&
      typeof event.messageDelta.sha256 === "string" &&
      /^[0-9a-f]{64}$/u.test(event.messageDelta.sha256);
    if (!raw && !summarized) return null;
    const itemId = event.messageDelta.itemId;
    const count = raw ? 1 : event.messageDelta.count;
    const byteLength = raw
      ? Buffer.byteLength(event.messageDelta.text, "utf8")
      : event.messageDelta.byteLength;
    deltaFragmentCount += count;
    deltaByteLength += byteLength;
    if (!Number.isSafeInteger(deltaFragmentCount) || !Number.isSafeInteger(deltaByteLength)) {
      addEventBlockers(event, ["message-delta-limit-exceeded"]);
      deltaFragmentLimitExceeded = true;
      deltaByteLimitExceeded = true;
    }
    deltaFragmentLimitExceeded ||= deltaFragmentCount > AGENT_MESSAGE_DELTA_FRAGMENT_LIMIT;
    deltaByteLimitExceeded ||= deltaByteLength > AGENT_MESSAGE_DELTA_BYTE_LIMIT;
    const key = messageDeltaKey(event, itemId);
    const overLimit = deltaFragmentLimitExceeded || deltaByteLimitExceeded;
    if (key !== null) deltaGroupKeys.add(key);
    if (!raw) {
      if (overLimit) {
        addEventBlockers(event, ["message-delta-limit-exceeded"]);
      }
      return { raw: false, itemId, count, byteLength, overLimit };
    }

    const text = event.messageDelta.text;
    const aggregateBlockers = [];
    if (overLimit) {
      aggregateBlockers.push("message-delta-limit-exceeded");
    }
    if (aggregateBlockers.length === 0) {
      const nextTranscript = deltaTranscript + text;
      if (containsCredentialText(nextTranscript)) {
        aggregateBlockers.push("secret-shaped-output");
        deltaTranscript = "";
      } else {
        deltaTranscript = nextTranscript;
      }
    } else {
      deltaTranscript = "";
    }
    event.messageDelta = deltaSummary(itemId, 1, text);
    addEventBlockers(event, aggregateBlockers);
    return { raw: true, itemId, text, count: 1, byteLength, overLimit };
  }

  function correlateDeltaCompletion(event) {
    if (
      event.method !== "item/completed" ||
      event.item?.type !== "agentMessage" ||
      typeof event.item.id !== "string"
    ) return;
    const key = messageDeltaKey(event, event.item.id);
    if (key === null) return;
    incrementCount(completedAgentMessageCounts, key);
    const completionCount = completedAgentMessageCounts.get(key);
    const state = deltaStates.get(key);
    if (!state) return;
    const finalText = event.item.text;
    const matches =
      completionCount === 1 &&
      state.closed === false &&
      finalText?.byteLength === state.event.messageDelta.byteLength &&
      finalText?.sha256 === state.event.messageDelta.sha256;
    if (!matches) {
      addEventBlockers(event, ["message-delta-lifecycle-mismatch"]);
      addEventBlockers(state.event, ["message-delta-lifecycle-mismatch"]);
      return;
    }
    state.closed = true;
    state.text = "";
  }

  function persistEvent(event) {
    const delta = deltaObservations.get(event) ?? null;
    const key = delta ? messageDeltaKey(event, delta.itemId) : null;
    if (delta?.overLimit === true) {
      const state = key === null ? null : deltaStates.get(key);
      if (state) {
        state.text = "";
        addEventBlockers(state.event, ["message-delta-limit-exceeded"]);
      }
      events.push(event);
      return;
    }
    const coalescible =
      delta?.raw === true &&
      key !== null &&
      event.complete === true &&
      event.postTerminal !== true &&
      event.threadId === threadId &&
      event.turnId === turnId;
    if (!coalescible) {
      events.push(event);
      correlateDeltaCompletion(event);
      return;
    }
    let state = deltaStates.get(key);
    if (
      state?.closed === true ||
      (key !== null && (completedAgentMessageCounts.get(key) ?? 0) > 0)
    ) {
      addEventBlockers(event, ["message-delta-lifecycle-mismatch"]);
      events.push(event);
      return;
    }
    if (!state) {
      events.push(event);
      state = {
        event,
        text: "",
        fragmentCount: 0,
        closed: false,
      };
      deltaStates.set(key, state);
    }
    const nextText = state.text + delta.text;
    state.fragmentCount += 1;
    state.event.messageDelta = deltaSummary(
      delta.itemId,
      state.fragmentCount,
      nextText,
    );
    state.text = nextText;
  }

  function processEvent(event, allowQueue = true) {
    if (event.item?.type === "userMessage" && Object.hasOwn(event.item, "text")) {
      event.item = {
        id: event.item.id,
        type: event.item.type,
        ...(event.item.status === undefined ? {} : { status: event.item.status }),
      };
    }
    const scope = classifyEventScope(event);
    if (
      allowQueue &&
      ((scope.threadScoped && threadId === null) ||
        (scope.turnScoped && turnId === null))
    ) {
      pending.push(event);
      return;
    }
    if (
      (scope.threadScoped && event.threadId !== threadId) ||
      (scope.turnScoped && event.turnId !== turnId)
    ) {
      event.blockers.push("foreign-event");
    }
    if (FORBIDDEN_ITEM_TYPES.has(event.item?.type)) {
      event.blockers.push("uncontrolled-tool-surface");
    }
    const postTerminal = terminalEvent !== null;
    if (postTerminal) {
      event.postTerminal = true;
      if (/^item\//u.test(String(event.method))) {
        event.blockers.push("post-terminal-event");
      }
    } else if (
      event.method === "item/completed" &&
      event.item?.type === "agentMessage"
    ) {
      latestPreTerminalAgentMessage = event;
    }
    event.blockers = unique(event.blockers);
    event.complete = event.blockers.length === 0;
    blockers.push(...event.blockers);
    persistEvent(event);
    if (
      event.method === "turn/completed" &&
      event.threadId === threadId &&
      event.turnId === turnId
    ) {
      terminalCount += 1;
      if (terminalCount === 1) {
        terminalEvent = event;
        terminalAgentMessage = latestPreTerminalAgentMessage;
        resolveTerminal(event);
      } else {
        blockers.push("duplicate-terminal-event");
      }
    }
  }

  function record(notification, allowQueue = true) {
    if (deltaCollectionStopped) return;
    let event;
    try {
      event =
        normalizeDynamicToolEvent(notification, allowedToolNames) ??
        normalizeEvent(notification);
    } catch {
      event = {
        method: null,
        threadId: null,
        turnId: null,
        complete: false,
        blockers: ["runtime-drift"],
      };
    }
    observeNormalizerBlockers(event);
    countObservedEvent(event);
    const delta = observeDelta(event);
    if (delta !== null) {
      deltaObservations.set(event, delta);
      if (delta.overLimit === true && !deltaCollectionStopped) {
        deltaCollectionStopped = true;
        stopNotificationCollection();
        void ensureDeltaOverflowInterrupt();
        resolveTerminal({ fatal: true });
      }
    }
    processEvent(event, allowQueue);
  }

  function flushPending() {
    const queued = pending.splice(0);
    for (const event of queued) processEvent(event, false);
  }

  try {
    if (
      !session?.client ||
      typeof session.client.request !== "function" ||
      typeof session.subscribe !== "function" ||
      typeof session.close !== "function" ||
      !Number.isSafeInteger(turnTimeoutMs) ||
      turnTimeoutMs < 1 ||
      !isJsonObject(outputSchema)
    ) {
      throw new TypeError("fresh evaluator turn input is malformed");
    }
    allowedToolNames = validateDynamicTools(
      dynamicTools,
      dynamicToolController,
    );
    if (dynamicTools.length > 0 && typeof session.setDynamicToolHandler !== "function") {
      throw new TypeError("fresh evaluator session lacks dynamic tool control");
    }
    const schemaValue = cloneJson(outputSchema, "fresh evaluator output schema");
    evidence.outputSchema = {
      value: schemaValue,
      byteLength: Buffer.byteLength(stableStringify(schemaValue)),
      sha256: sha256(stableStringify(schemaValue)),
    };
    const requestInput = cloneJson(input, "fresh evaluator turn input");
    initialInputSnapshot = await describeInput(root, requestInput);
    expectedLocalImageCount = initialInputSnapshot.privateBinding.images.length;
    evidence.input = { ...initialInputSnapshot.evidence };
    const threadStartRequest = buildFreshEvaluatorThreadStartRequest(
      root,
      dynamicTools,
    );
    evidence.threadStart.request = summarizeThreadStartRequest(threadStartRequest);
    if (!remoteControlSnapshotIsSafe(session.remoteControlSnapshot)) {
      blockers.push("unsafe-remote-control");
      throw new Error("fresh evaluator remote control is not safely disabled");
    }

    unsubscribe = session.subscribe(record, {
      afterCursor: Number.isSafeInteger(session.notificationCursor)
        ? session.notificationCursor
        : 0,
    });
    if (deltaCollectionStopped && unsubscribe !== null) {
      stopNotificationCollection();
      await unsubscribeCompletion;
    }
    const threadResponse = await session.client.request(
      "thread/start",
      threadStartRequest,
      30_000,
    );
    evidence.threadStart.response = summarizeThreadStart(threadResponse);
    threadId = evidence.threadStart.response.threadId;
    flushPending();
    if (
      evidence.threadStart.response.priorTurnCount !== 0 ||
      evidence.threadStart.response.instructionSourceCount !== 0
    ) {
      blockers.push("inherited-context");
    }
    const parsedThread = parseThreadStartResponse(
      threadResponse,
      threadStartRequest,
    );
    evidence.thread = durableThreadSummary(parsedThread);
    threadId = evidence.thread.id;
    if (blockers.includes("inherited-context")) {
      throw new Error("fresh evaluator thread inherited context");
    }

    if (dynamicTools.length > 0) {
      releaseTool = session.setDynamicToolHandler(async (message) => {
        const params = message?.params;
        if (
          message?.method !== "item/tool/call" ||
          params?.threadId !== threadId ||
          typeof params?.turnId !== "string" ||
          !params.turnId ||
          typeof params?.callId !== "string" ||
          !params.callId ||
          typeof params?.tool !== "string" ||
          !allowedToolNames.has(params.tool) ||
          !isJsonObject(params.arguments)
        ) {
          throw new Error("fresh evaluator dynamic tool request is uncontrolled");
        }
        toolTurnId ??= params.turnId;
        if (
          params.turnId !== toolTurnId ||
          toolEvidence.some(({ callId }) => callId === params.callId)
        ) {
          throw new Error("fresh evaluator dynamic tool identity is inconsistent");
        }
        const argumentsValue = cloneJson(
          params.arguments,
          "fresh evaluator dynamic tool arguments",
        );
        if (containsCredentialText(argumentsValue)) {
          throw new Error("fresh evaluator dynamic tool arguments contain credentials");
        }
        const response = await dynamicToolController({
          threadId: params.threadId,
          turnId: params.turnId,
          callId: params.callId,
          tool: params.tool,
          arguments: argumentsValue,
        });
        if (
          !isJsonObject(response) ||
          typeof response.success !== "boolean" ||
          !Array.isArray(response.contentItems) ||
          response.contentItems.length !== 1 ||
          response.contentItems[0]?.type !== "inputText" ||
          typeof response.contentItems[0]?.text !== "string"
        ) {
          throw new Error("fresh evaluator dynamic tool response is malformed");
        }
        const responseText = response.contentItems[0].text;
        if (containsCredentialText(responseText)) {
          throw new Error("fresh evaluator dynamic tool response contains credentials");
        }
        toolEvidence.push({
          callId: params.callId,
          tool: params.tool,
          arguments: argumentsValue,
          argumentsSha256: sha256(stableStringify(argumentsValue)),
          status: response.success ? "completed" : "failed",
          response: {
            byteLength: Buffer.byteLength(responseText),
            sha256: sha256(responseText),
          },
        });
        return response;
      });
    }

    try {
      turnStartInputSnapshot = await describeInput(root, requestInput);
    } catch (error) {
      blockers.push("input-provenance-readback-failed");
      throw new Error("fresh evaluator input provenance readback failed", {
        cause: error,
      });
    }
    const turnStartMatchesInitial = inputSnapshotsMatch(
      initialInputSnapshot,
      turnStartInputSnapshot,
    );
    if (!turnStartMatchesInitial) {
      blockers.push("input-provenance-changed");
      throw new Error("fresh evaluator input provenance changed before turn start");
    }
    if (expectedLocalImageCount > 0) {
      if (typeof session.bindLocalImageDiagnostics !== "function") {
        blockers.push("local-image-diagnostics-unavailable");
        throw new Error("fresh evaluator local image diagnostics are unavailable");
      }
      try {
        await session.bindLocalImageDiagnostics(
          localImageDiagnosticBinding(turnStartInputSnapshot),
        );
      } catch (error) {
        blockers.push("local-image-diagnostics-bind-failed");
        throw new Error("fresh evaluator local image diagnostics binding failed", {
          cause: error,
        });
      }
      evidence.input.controllerLocalImages = controllerLocalImageEvidence(
        initialInputSnapshot,
        turnStartInputSnapshot,
      );
    }
    const turnRequest = {
      threadId,
      input: requestInput,
      approvalPolicy: "never",
      permissions: EVALUATION_PERMISSION_PROFILE,
      outputSchema: schemaValue,
    };
    evidence.turn.request = {
      inputDescriptorCount: evidence.input.descriptors.length,
      inputRequestSha256: evidence.input.requestSha256,
      approvalPolicy: turnRequest.approvalPolicy,
      permissions: turnRequest.permissions,
      outputSchemaSha256: evidence.outputSchema.sha256,
    };
    const turnResponse = await session.client.request(
      "turn/start",
      turnRequest,
      turnTimeoutMs,
    );
    const turn = turnResponse?.turn ?? turnResponse;
    turnId = turn?.id ?? turn?.turnId ?? null;
    evidence.turn.id = turnId;
    if (typeof turnId !== "string" || !turnId) {
      throw new Error("fresh evaluator turn id is missing");
    }
    if (toolTurnId !== null && toolTurnId !== turnId) {
      blockers.push("dynamic-tool-lifecycle-mismatch");
    }
    flushPending();
    if (deltaCollectionStopped) {
      await Promise.all([
        unsubscribeCompletion,
        ensureDeltaOverflowInterrupt(),
      ]);
      throw new Error("fresh evaluator agent-message delta exceeded its bound");
    }

    let timeout;
    const timedOut = new Promise((resolve) => {
      timeout = setTimeout(() => resolve(null), turnTimeoutMs);
      timeout.unref?.();
    });
    const terminal = await Promise.race([terminalPromise, timedOut]);
    clearTimeout(timeout);
    if (deltaCollectionStopped) {
      await Promise.all([
        unsubscribeCompletion,
        ensureDeltaOverflowInterrupt(),
      ]);
      throw new Error("fresh evaluator agent-message delta exceeded its bound");
    }
    if (terminal === null) {
      blockers.push("missing-terminal-event");
      await session.client
        .request("turn/interrupt", { threadId, turnId }, 10_000)
        .catch(() => {});
      throw new Error("fresh evaluator turn timed out");
    }
    let postTurnInputSnapshot;
    try {
      postTurnInputSnapshot = await describeInput(root, requestInput);
    } catch (error) {
      if (expectedLocalImageCount > 0) {
        evidence.input.controllerLocalImages = controllerLocalImageEvidence(
          initialInputSnapshot,
          turnStartInputSnapshot,
        );
      }
      blockers.push("input-post-turn-readback-failed");
      throw new Error("fresh evaluator post-turn input readback failed", {
        cause: error,
      });
    }
    const postMatchesInitial = inputSnapshotsMatch(
      initialInputSnapshot,
      postTurnInputSnapshot,
    );
    const postMatchesTurnStart = inputSnapshotsMatch(
      turnStartInputSnapshot,
      postTurnInputSnapshot,
    );
    if (expectedLocalImageCount > 0) {
      evidence.input.controllerLocalImages = controllerLocalImageEvidence(
        initialInputSnapshot,
        turnStartInputSnapshot,
        postTurnInputSnapshot,
      );
    }
    if (!postMatchesInitial || !postMatchesTurnStart) {
      blockers.push("input-provenance-changed-after-turn");
      throw new Error("fresh evaluator input provenance changed after turn completion");
    }
    evidence.mcpAfter = await listMcpServerStatus(session.client, threadId);
    verifyMcpRuntimeIsInert(session.mcpInventory, evidence.mcpAfter);
  } catch (error) {
    primaryError = error;
  } finally {
    await unsubscribeCompletion;
    await (deltaInterruptPromise ?? Promise.resolve());
    try {
      await session?.close?.();
    } catch (error) {
      closeError = error;
      blockers.push("app-server-close-failed");
    }
    try {
      await releaseTool?.();
    } catch (error) {
      cleanupErrors.push(error);
      blockers.push("cleanup-dynamic-tool-release-failed");
    }
    try {
      await unsubscribe?.();
    } catch (error) {
      cleanupErrors.push(error);
      blockers.push("cleanup-unsubscribe-failed");
    }
    let processExitCode = null;
    let stderr = null;
    let remoteControl = null;
    let imageDiagnostics = null;
    let successfulImageViews = null;
    const expectedImageIndexes =
      initialInputSnapshot?.privateBinding.images.map(({ index }) => index) ?? [];
    for (const [label, snapshot] of [
      ["process-exit", () => session?.processExitCode ?? null],
      ["stderr", () => session?.stderr ?? null],
      ["remote-control", () => session?.remoteControlSnapshot ?? null],
      ["image-diagnostics", () => session?.imageDiagnostics ?? null],
      ["successful-image-views", () => session?.successfulImageViews ?? null],
    ]) {
      try {
        const value = snapshot();
        if (label === "process-exit") processExitCode = value;
        if (label === "stderr") stderr = value;
        if (label === "remote-control") remoteControl = value;
        if (label === "image-diagnostics") {
          imageDiagnostics =
            value === null
              ? null
              : cloneJson(value, "fresh evaluator image diagnostics");
        }
        if (label === "successful-image-views") {
          if (value === null) {
            successfulImageViews = null;
          } else {
            successfulImageViews = validatedSuccessfulImageViews(
              value,
              expectedImageIndexes,
            );
            successfulImageViewsMalformed = successfulImageViews === null;
            successfulImageViewsIncomplete =
              successfulImageViews?.complete === false;
          }
        }
      } catch (error) {
        cleanupErrors.push(error);
        blockers.push(`cleanup-${label}-snapshot-failed`);
      }
    }
    if (
      imageDiagnostics !== null &&
      !imageDiagnosticsAreSafe(
        imageDiagnostics,
        expectedImageIndexes,
        stderr?.byteLength,
      )
    ) {
      imageDiagnostics = null;
    }
    evidence.appServer = {
      processExitCode,
      stderr,
      remoteControl,
      imageDiagnostics,
      successfulImageViews,
    };
  }

  for (const [key, state] of deltaStates) {
    if (
      state.closed !== true ||
      completedAgentMessageCounts.get(key) !== 1
    ) {
      addEventBlockers(state.event, ["message-delta-lifecycle-mismatch"]);
    }
    state.text = "";
  }
  deltaTranscript = "";
  try {
    evidence.eventCompaction = buildEventCompactionEvidence();
  } catch (error) {
    primaryError ??= error;
    blockers.push("event-compaction-unverified");
  }
  if (pending.length > 0) blockers.push("unresolved-notification");
  if (terminalCount === 0) blockers.push("missing-terminal-event");
  if (terminalCount > 1) blockers.push("duplicate-terminal-event");
  if (terminalEvent !== null && terminalEvent.turn?.status !== "completed") {
    blockers.push("turn-not-completed");
  }
  if (!dynamicLifecycleMatches(events, toolEvidence)) {
    blockers.push("dynamic-tool-lifecycle-mismatch");
  }
  if (events.some((event) => event.complete !== true)) {
    blockers.push("runtime-control-blocker");
  }
  if (evidence.appServer.processExitCode === null) {
    blockers.push("app-server-exit-unverified");
  } else if (evidence.appServer.processExitCode !== 0) {
    blockers.push("app-server-nonzero-exit");
  }
  if (evidence.appServer.stderr?.truncated === true) {
    blockers.push("app-server-stderr-truncated");
  }
  if (evidence.appServer.stderr?.byteLength !== 0) {
    blockers.push("app-server-stderr");
  }
  if (!remoteControlSnapshotIsSafe(evidence.appServer.remoteControl)) {
    blockers.push("unsafe-remote-control");
  }
  if (
    expectedLocalImageCount > 0 &&
    evidence.appServer.imageDiagnostics === null
  ) {
    blockers.push("image-diagnostics-unverified");
  }
  if (
    successfulImageViewsMalformed ||
    successfulImageViewsIncomplete ||
    (expectedLocalImageCount > 0 &&
      evidence.appServer.successfulImageViews === null)
  ) {
    blockers.push("successful-image-view-unverified");
  }
  evidence.blockers = unique(blockers);

  if (
    primaryError !== null ||
    closeError !== null ||
    cleanupErrors.length > 0 ||
    evidence.blockers.length > 0
  ) {
    const failures = [primaryError, closeError, ...cleanupErrors].filter(Boolean);
    const cause =
      failures.length < 2
        ? failures[0] ?? new Error("fresh evaluator evidence is unsafe")
        : new AggregateError(failures, "fresh evaluator cleanup or turn failed", {
            cause: failures[0],
          });
    throw attachEvidence(
      cause,
      evidence,
    );
  }

  let outputText;
  let output;
  try {
    outputText = finalAgentText(terminalAgentMessage);
    output = JSON.parse(outputText);
  } catch (error) {
    throw attachEvidence(error, evidence);
  }
  return {
    ...evidence,
    output,
    outputText: {
      text: outputText,
      byteLength: Buffer.byteLength(outputText),
      sha256: sha256(outputText),
    },
  };
}
