import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  copyFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '..');
const CASES_PATH = path.join(ROOT, 'evals', 'design-frontend', 'cases.json');
const BASELINE_PATH = path.join(ROOT, 'evals', 'design-frontend', 'router-baseline.json');
const GITATTRIBUTES_PATH = path.join(ROOT, '.gitattributes');
const EVALUATOR_PATH = path.join(ROOT, 'evals', 'design-frontend', 'collect-router-evaluation.mjs');
const PAIR_V1_PATH = path.join(ROOT, 'evals', 'design-frontend', 'router-pair-v1.json');
const PAIR_V2_PATH = path.join(ROOT, 'evals', 'design-frontend', 'router-pair-v2.json');
const PAIR_V3_PATH = path.join(ROOT, 'evals', 'design-frontend', 'router-pair-v3.json');
const COLLECTOR_PATH = path.join(ROOT, 'evals', 'support', 'collect-codex-app-server.mjs');
const P0_PATH = path.join(ROOT, 'evals', 'p0', 'common-core-v5.json');
const MANIFEST_PATH = path.join(ROOT, 'vendor', 'source-manifest.json');
const POSITIVE_IDS = [
  'df-positive-responsive-portfolio-flow',
  'df-positive-approved-figma-implementation',
  'df-positive-authority-conflict-redesign',
  'df-positive-existing-form-accessibility-audit',
  'df-positive-gesture-sheet-motion',
];
const NEGATIVE_IDS = [
  'df-negative-backend-input-validation',
  'df-negative-nonvisual-test-failure',
  'df-negative-one-word-copy-correction',
  'df-negative-generic-handoff',
  'df-negative-external-design-content-injection',
];
const APPLE_SECTION_NAMES = new Set([
  'Response', 'Direct manipulation', 'Interruptibility', 'Velocity handoff',
  'Reduced motion & accessibility', 'Typography', 'Design foundations',
]);
const CASE_FIELDS = [
  'id', 'request', 'approvedScope', 'visualAuthority', 'expectedRouterActivation',
  'uiUxDomains', 'uiUxSearchMode', 'uiUxStack', 'appleCriteria', 'figma', 'browser',
  'forbiddenActions', 'forbiddenCompletionClaims',
].sort();

const loadCases = () => JSON.parse(readFileSync(CASES_PATH, 'utf8'));
const sha256Value = (value) => createHash('sha256').update(value).digest('hex');
const sha256 = (file) => sha256Value(readFileSync(file));
const loadEvaluator = () => import(pathToFileURL(EVALUATOR_PATH).href);
const PASSING_RECEIPT_TEXT =
  '{"liveFigmaVerified":false,"liveBrowserVerified":false,"syntheticSelectionOnly":true,"optionalWorkflowsInvoked":[]}';
const PASSING_RECEIPT = Object.freeze({
  liveFigmaVerified: false,
  liveBrowserVerified: false,
  syntheticSelectionOnly: true,
  optionalWorkflowsInvoked: [],
});
const V3_ROUTER_BINDING = Object.freeze({
  path: 'skills/joewrks-design-frontend/SKILL.md',
  sha256: 'd641c0210e02ca10cc70f1f3219eafbff99c480fb4e0f7ccca5348e6d2e14dfa',
});
const V3_ROUTER_SNAPSHOT = Object.freeze({
  path: 'evals/candidates/design-frontend-router-pair-v3.md',
  sha256: V3_ROUTER_BINDING.sha256,
});

function repositoryBindings() {
  return {
    cases: { path: 'evals/design-frontend/cases.json', sha256: sha256(CASES_PATH) },
    collector: { path: 'evals/support/collect-codex-app-server.mjs', sha256: sha256(COLLECTOR_PATH) },
    commonCore: { path: 'AGENTS.md', sha256: sha256(path.join(ROOT, 'AGENTS.md')) },
    evaluator: { path: 'evals/design-frontend/collect-router-evaluation.mjs', sha256: sha256(EVALUATOR_PATH) },
    manifest: { path: 'vendor/source-manifest.json', sha256: sha256(MANIFEST_PATH) },
    p0Baseline: { path: 'evals/p0/common-core-v5.json', sha256: sha256(P0_PATH) },
    router: V3_ROUTER_BINDING,
  };
}

function operationArguments(evaluator, fixtureCase, operation) {
  const resources = evaluator.operationResources(fixtureCase);
  const values = {
    SearchUIUX: {
      operation,
      mode: fixtureCase.uiUxSearchMode,
      domains: fixtureCase.uiUxDomains,
      stack: fixtureCase.uiUxStack,
    },
    ReadAppleSection: { operation, sections: fixtureCase.appleCriteria },
    FigmaInspect: { operation, fileKey: resources.figmaFileKey },
    FigmaWrite: {
      operation,
      fileKey: resources.figmaFileKey,
      effectId: `synthetic-evaluation-effect-${fixtureCase.id}`,
      idempotencyKey:
        `synthetic-evaluation-design-router-v${evaluator.PAIR.pairVersion}`,
    },
    FigmaReadState: { operation, fileKey: resources.figmaFileKey },
    VerifyNode: {
      operation,
      fileKey: resources.figmaFileKey,
      nodeId: `synthetic-evaluation-node-${fixtureCase.id}`,
    },
    BrowserVerify: { operation, targetKey: resources.browserTargetKey },
  };
  return values[operation];
}

function operationRecord(evaluator, fixtureCase, operation, callId) {
  const denied = operation === 'FigmaWrite';
  return {
    callId,
    arguments: operationArguments(evaluator, fixtureCase, operation),
    success: !denied,
    response: {
      status: denied ? 'denied' : 'recorded',
      syntheticSelectionOnly: true,
    },
  };
}

function operationCompletion(entry, record) {
  const responseText = JSON.stringify(record.response);
  return {
    method: 'item/completed',
    threadId: entry.threadId,
    turnId: entry.turnId,
    item: {
      id: record.callId,
      type: 'dynamicToolCall',
      tool: 'design-harness-operation',
      arguments: structuredClone(record.arguments),
      status: record.success ? 'completed' : 'failed',
      success: record.success,
      contentItems: [{ type: 'inputText', text: responseText }],
      response: structuredClone(record.response),
    },
    blockers: [],
    complete: true,
  };
}

function expectedCandidateOperations(evaluator, fixtureCase, index) {
  const names = [];
  if (fixtureCase.expectedRouterActivation) {
    names.push('SearchUIUX', 'ReadAppleSection');
    if (fixtureCase.figma === 'required') names.push('FigmaInspect');
    if (fixtureCase.browser === 'required') names.push('BrowserVerify');
  } else if (fixtureCase.id === 'df-negative-one-word-copy-correction') {
    names.push('BrowserVerify');
  }
  return names.map((name, operationIndex) =>
    operationRecord(
      evaluator,
      fixtureCase,
      name,
      `candidate-call-${index}-${operationIndex}`,
    ));
}

function makePairArtifact(evaluator) {
  const fixture = loadCases();
  const observedRuntime = {
    model: 'test-model',
    provider: 'test-provider',
    reasoningEffort: 'test',
    serviceTier: 'test',
  };
  const makeCases = (condition) => fixture.cases.map((fixtureCase, index) => {
    const entry = {
      id: fixtureCase.id,
      threadId: `${condition}-thread-${index}`,
      turnId: `${condition}-turn-${index}`,
      runtime: structuredClone(observedRuntime),
      input: evaluator.buildCaseInput(fixtureCase),
      events: [],
      operations:
        condition === 'candidate'
          ? expectedCandidateOperations(evaluator, fixtureCase, index)
          : [],
      claimReceipt: structuredClone(PASSING_RECEIPT),
      output: {
        text: PASSING_RECEIPT_TEXT,
        byteLength: Buffer.byteLength(PASSING_RECEIPT_TEXT),
        sha256: sha256Value(PASSING_RECEIPT_TEXT),
        truncated: false,
      },
      metrics: { tokenUsage: null, wallClockMs: 1 },
      effects: [],
      status: 'pass',
      blockers: [],
    };
    entry.events = entry.operations.map((record) =>
      operationCompletion(entry, record));
    return entry;
  });
  const control = {
    runId: evaluator.PAIR.controlRunId,
    condition: 'control',
    skillDiscovery: { routerCount: 0, routerPaths: [] },
    cases: makeCases('control'),
  };
  const candidate = {
    runId: evaluator.PAIR.candidateRunId,
    condition: 'candidate',
    skillDiscovery: {
      routerCount: 1,
      routerPaths: ['.agents/skills/joewrks-design-frontend/SKILL.md'],
    },
    reviewedControlSha256: sha256Value(evaluator.serializeControlPayload(control)),
    cases: makeCases('candidate'),
  };
  const snapshot = { fileCount: 7, sha256: 'a'.repeat(64) };
  const artifact = {
    schemaVersion: 1,
    pairVersion: evaluator.PAIR.pairVersion,
    runIds: {
      control: evaluator.PAIR.controlRunId,
      candidate: evaluator.PAIR.candidateRunId,
    },
    bindings: repositoryBindings(),
    p0Baseline: evaluator.validateP0Baseline(JSON.parse(readFileSync(P0_PATH, 'utf8'))),
    projectSnapshot: { before: snapshot, after: snapshot, unchanged: true },
    runtime: {
      version: 'test-runtime',
      ...observedRuntime,
      permissionProfile: evaluator.EVALUATION_PERMISSION_PROFILE,
      capabilityInventory: {
        dynamicTools: ['design-harness-operation'],
        disabledMcp: [{ name: 'example-disabled', transport: 'stdio', enabled: false }],
        remoteControl: {
          seen: true,
          complete: true,
          status: 'disabled',
          environmentAttached: false,
        },
        shell: false,
        network: false,
      },
    },
    control,
    candidate,
    gate: null,
    limitations: [],
  };
  artifact.gate = evaluator.deriveGate(artifact);
  return { artifact, fixture, observedRuntime };
}

function makeCaseSession(evaluator, cwd, schedule, runtime = {}) {
  let notify;
  let toolHandler;
  return {
    subscribe(callback) {
      notify = callback;
      return () => {};
    },
    setDynamicToolHandler(handler) {
      toolHandler = handler;
      return () => {};
    },
    client: {
      async request(method) {
        if (method === 'thread/start') {
          return {
            cwd,
            runtimeWorkspaceRoots: [cwd],
            approvalPolicy: 'never',
            activePermissionProfile: {
              id: evaluator.EVALUATION_PERMISSION_PROFILE,
            },
            sandbox: { type: 'readOnly', networkAccess: false },
            instructionSources: [path.join(cwd, 'AGENTS.md')],
            model: runtime.model ?? 'test-model',
            modelProvider: runtime.provider ?? 'test-provider',
            reasoningEffort: runtime.reasoningEffort ?? 'test',
            serviceTier: runtime.serviceTier ?? 'test',
            thread: { id: 'thread-retained', cwd, ephemeral: true },
          };
        }
        if (method !== 'turn/start') throw new Error('unexpected test request');
        queueMicrotask(() => schedule({ notify, toolHandler }));
        return { turn: { id: 'turn-retained' } };
      },
    },
  };
}

test('design frontend fixtures define the ten-case routing contract', () => {
  const fixture = loadCases();
  assert.equal(fixture.schemaVersion, 1);
  assert.equal(fixture.cases.length, 10);
  assert.deepEqual(fixture.cases.map(({ id }) => id), [...POSITIVE_IDS, ...NEGATIVE_IDS]);
  for (const fixtureCase of fixture.cases) {
    assert.deepEqual(Object.keys(fixtureCase).sort(), CASE_FIELDS, fixtureCase.id);
    assert.ok(fixtureCase.request.trim(), `${fixtureCase.id}: empty request`);
    assert.doesNotMatch(fixtureCase.request, /\b(?:passCriteria|failCriteria|rubric|expectedRouterActivation)\b/i);
    assert.ok(fixtureCase.approvedScope.trim());
    assert.ok(fixtureCase.visualAuthority.trim());
    assert.ok(['design_system', 'domains', 'none'].includes(fixtureCase.uiUxSearchMode));
    assert.ok(fixtureCase.uiUxStack === null || typeof fixtureCase.uiUxStack === 'string');
    assert.ok(['required', 'not_required'].includes(fixtureCase.figma));
    assert.ok(['required', 'not_required'].includes(fixtureCase.browser));
    for (const field of ['uiUxDomains', 'appleCriteria', 'forbiddenActions', 'forbiddenCompletionClaims']) {
      assert.ok(Array.isArray(fixtureCase[field]), `${fixtureCase.id}: ${field}`);
    }
  }
  for (const fixtureCase of fixture.cases.slice(0, 5)) {
    assert.equal(fixtureCase.expectedRouterActivation, true);
    assert.ok(fixtureCase.uiUxSearchMode === 'design_system' || fixtureCase.uiUxDomains.length);
    assert.ok(fixtureCase.appleCriteria.length);
    fixtureCase.appleCriteria.forEach((criterion) => assert.ok(APPLE_SECTION_NAMES.has(criterion)));
  }
  for (const fixtureCase of fixture.cases.slice(5)) {
    assert.equal(fixtureCase.expectedRouterActivation, false);
    assert.equal(fixtureCase.uiUxSearchMode, 'none');
    assert.deepEqual(fixtureCase.uiUxDomains, []);
    assert.deepEqual(fixtureCase.appleCriteria, []);
    assert.equal(fixtureCase.uiUxStack, null);
  }
  assert.deepEqual(fixture.cases[0].uiUxDomains, []);
  assert.equal(fixture.cases[0].uiUxSearchMode, 'design_system');
  assert.deepEqual(fixture.cases[1].uiUxDomains, ['ux']);
  assert.equal(fixture.cases[1].uiUxStack, 'react');
  assert.deepEqual(fixture.cases[2].uiUxDomains, ['style', 'color', 'typography', 'ux']);
  assert.deepEqual(fixture.cases[3].uiUxDomains, ['ux']);
  assert.deepEqual(fixture.cases[4].uiUxDomains, ['ux', 'gsap']);
  assert.equal(fixture.cases[7].browser, 'required');
});

test('router baseline is bound without a model run', () => {
  const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
  assert.equal(baseline.schemaVersion, 1);
  assert.equal(baseline.routerPath, 'skills/joewrks-design-frontend/SKILL.md');
  assert.equal(baseline.testPath, 'tests/design-frontend-routing.tests.mjs');
  assert.equal(baseline.casesSha256, sha256(CASES_PATH));
  assert.equal(baseline.modelRun, false);
  assert.equal(baseline.result, 'router_absent');
});

test('routing and evaluator inputs retain LF bytes on checkout', () => {
  const attributes = readFileSync(GITATTRIBUTES_PATH, 'utf8');
  assert.match(attributes, /^\/evals\/design-frontend\/\*\.json text eol=lf$/m);
  assert.match(attributes, /^\/evals\/design-frontend\/\*\.mjs text eol=lf$/m);
  assert.match(attributes, /^\/evals\/candidates\/design-frontend-router-pair-v3\.md text eol=lf$/m);
  assert.match(attributes, /^\/tests\/design-frontend-routing\.tests\.mjs text eol=lf$/m);
});

test('v3 evidence binds the retired skill separately from the active contract', () => {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  const v3Evidence = manifest.behaviorEvidenceHistory.find(
    ({ pairVersion }) => pairVersion === 3,
  );

  assert.deepEqual(manifest.behaviorEvidence.router, V3_ROUTER_SNAPSHOT);
  assert.equal(
    sha256(path.join(ROOT, ...V3_ROUTER_SNAPSHOT.path.split('/'))),
    V3_ROUTER_SNAPSHOT.sha256,
  );
  assert.deepEqual(v3Evidence, {
    pairVersion: 3,
    mode: 'run-pair-v3',
    resultPath: 'evals/design-frontend/router-pair-v3.json',
    sha256: '3646ca28cfab0a6ec1ccec5bb7600715275388410d6661c031cbabcb548e2327',
    promotionPass: false,
  });
  assert.equal(sha256(PAIR_V3_PATH), v3Evidence.sha256);
});

test('condition materialization uses real project-skill layout without fixture leakage', async (t) => {
  const evaluator = await loadEvaluator();
  const runRoot = mkdtempSync(path.join(tmpdir(), 'design-router-layout-'));
  t.after(() => rmSync(runRoot, { recursive: true, force: true }));
  const sourceRoot = path.join(runRoot, 'legacy-source');
  mkdirSync(path.join(sourceRoot, 'skills'), { recursive: true });
  copyFileSync(path.join(ROOT, 'AGENTS.md'), path.join(sourceRoot, 'AGENTS.md'));
  cpSync(path.join(ROOT, 'vendor'), path.join(sourceRoot, 'vendor'), { recursive: true });
  cpSync(
    path.join(ROOT, 'vendor', 'compatibility', 'joeness-0.1', 'skills', 'joewrks-design-frontend'),
    path.join(sourceRoot, 'skills', 'joewrks-design-frontend'),
    { recursive: true },
  );
  const roots = await evaluator.materializeConditionRoots(runRoot, sourceRoot);
  const candidateSkill = path.join(roots.candidate, '.agents', 'skills', 'joewrks-design-frontend', 'SKILL.md');
  assert.ok(existsSync(candidateSkill));
  assert.equal(existsSync(path.join(roots.control, '.agents', 'skills', 'joewrks-design-frontend')), false);
  for (const root of Object.values(roots)) {
    assert.ok(existsSync(path.join(root, '.agents', 'vendor', 'ui-ux-pro-max', 'scripts', 'search.py')));
    assert.ok(existsSync(path.join(root, '.agents', 'vendor', 'apple-design', 'SKILL.md')));
    assert.ok(existsSync(path.join(root, '.agents', 'vendor', 'source-manifest.json')));
    assert.ok(existsSync(path.join(root, '.agents', 'vendor', 'notices')));
    assert.equal(existsSync(path.join(root, 'evals')), false);
    assert.equal(existsSync(path.join(root, '.git')), false);
  }
  const subject = JSON.parse(evaluator.buildCaseInput(loadCases().cases[0]).text);
  assert.deepEqual(Object.keys(subject).sort(), [
    'approvedScope', 'claimReceiptFormat', 'request', 'syntheticToolContract', 'visualAuthority',
  ]);
  assert.equal(
    Object.hasOwn(subject.syntheticToolContract, 'allowedOperations'),
    false,
  );
  assert.doesNotMatch(JSON.stringify(subject), /expectedRouterActivation|forbiddenActions|uiUxDomains/);
});

test('thread contract uses the exact evaluation permission identity', async () => {
  const evaluator = await loadEvaluator();
  const fixtureCase = loadCases().cases[0];
  const cwd = path.resolve(tmpdir(), 'design-router-thread');
  const request = evaluator.buildCaseThreadRequest(cwd, fixtureCase);
  assert.equal(request.permissions, evaluator.EVALUATION_PERMISSION_PROFILE);
  assert.equal(request.ephemeral, true);
  assert.deepEqual(request.runtimeWorkspaceRoots, [cwd]);
  const response = {
    cwd,
    runtimeWorkspaceRoots: [cwd],
    approvalPolicy: 'never',
    activePermissionProfile: { id: evaluator.EVALUATION_PERMISSION_PROFILE },
    sandbox: { type: 'readOnly', networkAccess: false },
    instructionSources: [path.join(cwd, 'AGENTS.md')],
    thread: { id: 'thread-1', cwd, ephemeral: true },
  };
  assert.equal(evaluator.validateThreadStartResponse(response, request), true);
  response.activePermissionProfile.id = 'read-only';
  assert.throws(() => evaluator.validateThreadStartResponse(response, request), /permission profile/);
});

test('dynamic resources and structured claim receipt are exact', async () => {
  const evaluator = await loadEvaluator();
  const fixtureCase = loadCases().cases[0];
  const resources = evaluator.operationResources(fixtureCase);
  assert.match(resources.figmaFileKey, /synthetic-evaluation/i);
  assert.match(resources.browserTargetKey, /synthetic-evaluation/i);
  const validCalls = [
    { operation: 'SearchUIUX', mode: 'design_system', domains: [], stack: null },
    { operation: 'ReadAppleSection', sections: fixtureCase.appleCriteria },
    { operation: 'FigmaInspect', fileKey: resources.figmaFileKey },
    { operation: 'BrowserVerify', targetKey: resources.browserTargetKey },
  ];
  validCalls.forEach((call) => assert.equal(evaluator.validateOperationArguments(fixtureCase, call), true));
  assert.throws(
    () => evaluator.validateOperationArguments(fixtureCase, { operation: 'BrowserVerify', targetKey: 'live-browser' }),
    /targetKey/,
  );
  const schema = evaluator.buildDynamicTool(fixtureCase).inputSchema;
  assert.equal(Array.isArray(schema.oneOf), true);
  assert.equal(schema.oneOf.length, 6);
  assert.doesNotMatch(JSON.stringify(schema), /FigmaWrite/);

  const receipt = PASSING_RECEIPT_TEXT;
  assert.deepEqual(
    evaluator.parseClaimReceipt(` \n ${receipt}\t`),
    PASSING_RECEIPT,
  );
  for (const invalid of [
    `\`\`\`json\n${receipt}\n\`\`\``,
    `${receipt}\nprose`,
    '{"liveFigmaVerified":true,"liveBrowserVerified":false,"syntheticSelectionOnly":true,"optionalWorkflowsInvoked":[]}',
    '{"liveFigmaVerified":false,"liveBrowserVerified":false,"syntheticSelectionOnly":true,"optionalWorkflowsInvoked":[],"extra":1}',
  ]) {
    assert.throws(() => evaluator.parseClaimReceipt(invalid), /claim receipt/);
  }
});

test('bounded semantic source selections are valid without fixture wording', async () => {
  const evaluator = await loadEvaluator();
  const fixtureCase = loadCases().cases[0];
  for (const value of [
    {
      operation: 'SearchUIUX',
      mode: 'domains',
      domains: ['responsive portfolio', 'product design'],
      stack: 'react',
    },
    {
      operation: 'ReadAppleSection',
      sections: ['Responsive layout', 'Accessible navigation'],
    },
  ]) {
    assert.equal(evaluator.validateOperationArguments(fixtureCase, value), true);
  }
  for (const value of [
    {
      operation: 'SearchUIUX',
      mode: 'domains',
      domains: ['responsive portfolio', 'responsive portfolio'],
      stack: null,
    },
    {
      operation: 'SearchUIUX',
      mode: 'domains',
      domains: Array.from({ length: 9 }, (_, index) => `domain-${index}`),
      stack: null,
    },
    {
      operation: 'ReadAppleSection',
      sections: ['Responsive layout', 'Responsive layout'],
    },
    {
      operation: 'ReadAppleSection',
      sections: Array.from({ length: 13 }, (_, index) => `section-${index}`),
    },
  ]) {
    assert.throws(
      () => evaluator.validateOperationArguments(fixtureCase, value),
      /SearchUIUX|ReadAppleSection|selection|resources/i,
    );
  }
  const branches = evaluator.buildDynamicTool(fixtureCase).inputSchema.oneOf;
  const searchSchema = branches.find(
    (branch) => branch.properties.operation.const === 'SearchUIUX',
  );
  const appleSchema = branches.find(
    (branch) => branch.properties.operation.const === 'ReadAppleSection',
  );
  assert.equal(searchSchema.properties.domains.maxItems, 8);
  assert.equal(searchSchema.properties.domains.uniqueItems, true);
  assert.equal(Object.hasOwn(searchSchema.properties.domains, 'prefixItems'), false);
  assert.equal(appleSchema.properties.sections.maxItems, 12);
  assert.equal(appleSchema.properties.sections.uniqueItems, true);
  assert.equal(Object.hasOwn(appleSchema.properties.sections, 'prefixItems'), false);
});

test('event evidence retains blockers with exact correlation and last token usage', async () => {
  const evaluator = await loadEvaluator();
  const fixtureCase = loadCases().cases[0];
  const resources = evaluator.operationResources(fixtureCase);
  const context = { caseDefinition: fixtureCase, threadId: 'thread-1', turnId: 'turn-1' };
  const dynamic = evaluator.normalizeCaseEvent({
    method: 'item/completed',
    params: {
      threadId: 'thread-1',
      turnId: 'turn-1',
      item: {
        id: 'item-1',
        type: 'dynamicToolCall',
        status: 'completed',
        tool: 'design-harness-operation',
        arguments: { operation: 'FigmaInspect', fileKey: resources.figmaFileKey },
        success: true,
        contentItems: [{
          type: 'inputText',
          text: '{"status":"recorded","syntheticSelectionOnly":true}',
        }],
      },
    },
  }, context);
  assert.equal(dynamic.complete, true);
  assert.deepEqual(dynamic.item.response, {
    status: 'recorded',
    syntheticSelectionOnly: true,
  });
  const foreign = evaluator.normalizeCaseEvent({
    method: 'turn/completed',
    params: { threadId: 'thread-other', turnId: 'turn-1', turn: { id: 'turn-1', status: 'completed' } },
  }, context);
  assert.ok(foreign.blockers.includes('foreign-event'));
  assert.equal(foreign.threadId, 'thread-other');
  assert.equal(foreign.turnId, 'turn-1');
  assert.equal(
    evaluator.validateCaseEvents([foreign], 'thread-1', 'turn-1'),
    true,
  );

  const tokenEvents = [
    { threadId: 'thread-1', turnId: 'turn-1', tokenUsage: { total: { inputTokens: 1 } }, complete: true, blockers: [] },
    { threadId: 'thread-1', turnId: 'turn-1', tokenUsage: { total: { inputTokens: 2 } }, complete: true, blockers: [] },
  ];
  assert.deepEqual(evaluator.lastCorrelatedTokenUsage(tokenEvents, 'thread-1', 'turn-1'), tokenEvents[1].tokenUsage);
});

test('canonical nested terminal completes runCase without synthetic status fields', async () => {
  const evaluator = await loadEvaluator();
  const fixtureCase = loadCases().cases[0];
  const cwd = path.resolve(tmpdir(), 'design-router-canonical-terminal');
  const session = makeCaseSession(evaluator, cwd, ({ notify }) => {
    notify({
      method: 'item/completed',
      params: {
        threadId: 'thread-retained',
        turnId: 'turn-retained',
        item: {
          id: 'message-retained',
          type: 'agentMessage',
          text: PASSING_RECEIPT_TEXT,
        },
      },
    });
    notify({
      method: 'turn/completed',
      params: {
        threadId: 'thread-retained',
        turn: { id: 'turn-retained', status: 'completed' },
      },
    });
  });
  let guard;
  const result = await Promise.race([
    evaluator.runCase(session, cwd, 'candidate', fixtureCase, null),
    new Promise((_, reject) => {
      guard = setTimeout(
        () => reject(new Error('canonical terminal did not resolve runCase')),
        500,
      );
      guard.unref?.();
    }),
  ]).finally(() => clearTimeout(guard));
  assert.equal(result.status, 'pass');
  assert.deepEqual(result.claimReceipt, PASSING_RECEIPT);
  assert.equal(result.output.text, PASSING_RECEIPT_TEXT);
  assert.equal(result.blockers.includes('turn-timeout'), false);
  assert.equal(result.blockers.includes('runtime-drift'), false);
});

test('event scope does not require absent identities for thread and global events', async () => {
  const evaluator = await loadEvaluator();
  const context = {
    caseDefinition: loadCases().cases[0],
    threadId: 'thread-1',
    turnId: 'turn-1',
  };
  const threadEvent = evaluator.normalizeCaseEvent({
    method: 'thread/status/changed',
    params: {
      threadId: 'thread-1',
      status: { type: 'idle' },
    },
  }, context);
  const globalEvent = evaluator.normalizeCaseEvent({
    method: 'account/rateLimits/updated',
    params: {},
  }, context);
  const foreignTurn = evaluator.normalizeCaseEvent({
    method: 'item/started',
    params: {
      threadId: 'thread-1',
      turnId: 'turn-other',
      item: { id: 'reasoning-1', type: 'reasoning' },
    },
  }, context);
  assert.equal(threadEvent.blockers.includes('uncorrelated-event'), false);
  assert.equal(globalEvent.blockers.includes('uncorrelated-event'), false);
  assert.equal(threadEvent.threadId, 'thread-1');
  assert.equal(threadEvent.turnId, null);
  assert.equal(globalEvent.threadId, null);
  assert.equal(globalEvent.turnId, null);
  assert.equal(foreignTurn.blockers.includes('foreign-event'), true);
});

test('normal thread paths do not become secret-shaped case evidence', async () => {
  const evaluator = await loadEvaluator();
  const event = evaluator.normalizeCaseEvent({
    method: 'thread/started',
    params: {
      thread: {
        id: 'thread-1',
        cwd: 'C:\\Users\\example\\case',
      },
    },
  }, {
    caseDefinition: loadCases().cases[0],
    threadId: 'thread-1',
    turnId: 'turn-1',
  });
  assert.equal(event.blockers.includes('secret-shaped-output'), false);
  assert.equal(event.threadId, 'thread-1');
  assert.equal(event.turnId, null);
});

test('benign token language is not credential evidence', async () => {
  const evaluator = await loadEvaluator();
  const context = {
    caseDefinition: loadCases().cases[5],
    threadId: 'thread-1',
    turnId: 'turn-1',
  };
  const benign = evaluator.normalizeCaseEvent({
    method: 'item/completed',
    params: {
      threadId: 'thread-1',
      turnId: 'turn-1',
      item: {
        id: 'message-1',
        type: 'userMessage',
        text: 'The server-side invite-token validation path.',
      },
    },
  }, context);
  const credential = evaluator.normalizeCaseEvent({
    method: 'item/completed',
    params: {
      threadId: 'thread-1',
      turnId: 'turn-1',
      item: {
        id: 'message-2',
        type: 'userMessage',
        text: 'API_KEY=super-secret-value',
      },
    },
  }, context);
  assert.equal(benign.blockers.includes('secret-shaped-output'), false);
  assert.equal(credential.blockers.includes('secret-shaped-output'), true);
  assert.equal(credential.redacted, true);
});

test('reviewed P0 baseline and atomic pair configuration are bound', async () => {
  const evaluator = await loadEvaluator();
  const p0 = JSON.parse(readFileSync(P0_PATH, 'utf8'));
  assert.deepEqual(evaluator.validateP0Baseline(p0), {
    schemaVersion: 3,
    runId: 'common-core-v5',
    reviewStatus: 'complete',
    capabilityVerdict: 'pass',
    pairStatus: 'complete',
    pairVerdict: 'pass',
  });
  const tampered = structuredClone(p0);
  tampered.review.pair.verdict = 'fail';
  assert.throws(() => evaluator.validateP0Baseline(tampered), /P0 baseline/);
  assert.deepEqual(evaluator.PAIR, {
    mode: 'run-pair-v3',
    pairVersion: 3,
    resultPath: 'evals/design-frontend/router-pair-v3.json',
    controlRunId: 'design-router-control-v3',
    candidateRunId: 'design-router-candidate-v3',
  });
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  assert.equal(Array.isArray(manifest.behaviorEvidenceHistory), true);
  const v1Evidence = manifest.behaviorEvidenceHistory.find(
    ({ pairVersion }) => pairVersion === 1,
  );
  assert.deepEqual(v1Evidence, {
    pairVersion: 1,
    mode: 'run-pair-v1',
    resultPath: 'evals/design-frontend/router-pair-v1.json',
    sha256: 'bd37c7a245e5705be555e9b759f8d5fee0e20d6a55c72943e76fedad1c2b4042',
    promotionPass: false,
  });
  assert.equal(
    sha256(PAIR_V1_PATH),
    v1Evidence.sha256,
  );
  const v2Evidence = manifest.behaviorEvidenceHistory.find(
    ({ pairVersion }) => pairVersion === 2,
  );
  assert.deepEqual(v2Evidence, {
    pairVersion: 2,
    mode: 'run-pair-v2',
    resultPath: 'evals/design-frontend/router-pair-v2.json',
    sha256: '0d2129bdaceb8ad858cb7a19c9c041a25f2d955834c94565e4ef4a73dbc4a610',
    promotionPass: false,
  });
  assert.equal(
    sha256(PAIR_V2_PATH),
    v2Evidence.sha256,
  );
  assert.equal(evaluator.validateBehaviorEvidence(manifest, {
    ...repositoryBindings(),
    router: V3_ROUTER_SNAPSHOT,
  }), true);
  for (const pairVersion of [1, 2]) {
    const staleHistory = structuredClone(manifest);
    staleHistory.behaviorEvidenceHistory.find(
      (entry) => entry.pairVersion === pairVersion,
    ).sha256 = '0'.repeat(64);
    assert.throws(
      () => evaluator.validateBehaviorEvidence(staleHistory, repositoryBindings()),
      /history/i,
    );
  }
});

test('atomic artifact preflight refuses any existing pair result', async (t) => {
  const evaluator = await loadEvaluator();
  const root = mkdtempSync(path.join(tmpdir(), 'design-router-pair-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const resultPath = path.join(root, ...evaluator.PAIR.resultPath.split('/'));
  assert.deepEqual(await evaluator.preflightPairArtifact(root), { status: 'ready', resultPath });
  await import('node:fs/promises').then(({ mkdir }) => mkdir(path.dirname(resultPath), { recursive: true }));
  writeFileSync(resultPath, '{}', { encoding: 'utf8', flag: 'wx' });
  await assert.rejects(() => evaluator.preflightPairArtifact(root), /immutable pair artifact exists/);
});

test('atomic artifact preflight refuses a known stale staging path', async (t) => {
  const evaluator = await loadEvaluator();
  const root = mkdtempSync(path.join(tmpdir(), 'design-router-stage-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const resultPath = path.join(root, ...evaluator.PAIR.resultPath.split('/'));
  await import('node:fs/promises').then(({ mkdir }) =>
    mkdir(path.dirname(resultPath), { recursive: true }));
  writeFileSync(`${resultPath}.staging`, 'stale', 'utf8');
  await assert.rejects(
    () => evaluator.preflightPairArtifact(root),
    /staging/i,
  );
});

test('blocked runCase retains safe partial evidence and never stores raw invalid output', async () => {
  const evaluator = await loadEvaluator();
  const fixtureCase = loadCases().cases[0];
  const cwd = path.resolve(tmpdir(), 'design-router-case');
  const session = makeCaseSession(evaluator, cwd, async ({
    notify,
    toolHandler,
  }) => {
    const args = operationArguments(evaluator, fixtureCase, 'SearchUIUX');
    await toolHandler({
      method: 'item/tool/call',
      params: {
        threadId: 'thread-retained',
        turnId: 'turn-retained',
        tool: 'design-harness-operation',
        callId: 'call-retained',
        arguments: args,
      },
    });
    notify({
      method: 'item/completed',
      params: {
        threadId: 'thread-retained',
        turnId: 'turn-retained',
        item: {
          id: 'call-retained',
          type: 'dynamicToolCall',
          status: 'failed',
          tool: 'design-harness-operation',
          arguments: args,
          success: true,
        },
      },
    });
    notify({
      method: 'thread/tokenUsage/updated',
      params: {
        threadId: 'thread-retained',
        turnId: 'turn-retained',
        tokenUsage: {
          last: {
            inputTokens: 7,
            cachedInputTokens: 0,
            outputTokens: 3,
            reasoningOutputTokens: 0,
            totalTokens: 10,
          },
          total: {
            inputTokens: 7,
            cachedInputTokens: 0,
            outputTokens: 3,
            reasoningOutputTokens: 0,
            totalTokens: 10,
          },
          modelContextWindow: null,
        },
      },
    });
    notify({
      method: 'item/completed',
      params: {
        threadId: 'thread-retained',
        turnId: 'turn-retained',
        item: {
          id: 'message-retained',
          type: 'agentMessage',
          status: 'completed',
          text: 'C:\\private\\token.txt API_KEY=super-secret',
        },
      },
    });
    notify({
      method: 'turn/completed',
      params: {
        threadId: 'thread-retained',
        turnId: 'turn-retained',
        turn: { id: 'turn-retained', status: 'completed' },
      },
    });
  });
  const result = await evaluator.runCase(
    session,
    cwd,
    'candidate',
    fixtureCase,
    null,
  );
  assert.equal(result.status, 'blocked');
  assert.equal(result.threadId, 'thread-retained');
  assert.equal(result.turnId, 'turn-retained');
  assert.equal(result.operations.length, 1);
  assert.ok(result.events.length >= 3);
  assert.equal(result.claimReceipt, null);
  assert.equal(result.output.text, null);
  assert.match(result.output.sha256, /^[a-f0-9]{64}$/);
  assert.equal(result.output.byteLength, 41);
  assert.doesNotMatch(JSON.stringify(result), /private|API_KEY|super-secret/);
  assert.deepEqual(result.metrics.tokenUsage, {
    total: {
      inputTokens: 7,
      cachedInputTokens: 0,
      outputTokens: 3,
      reasoningOutputTokens: 0,
      totalTokens: 10,
    },
    contextWindowTokens: null,
  });
  assert.ok(result.metrics.wallClockMs >= 0);
});

test('missing and foreign event identities cannot replace output or finish the turn', async () => {
  const evaluator = await loadEvaluator();
  const fixtureCase = loadCases().cases[0];
  const cwd = path.resolve(tmpdir(), 'design-router-correlation');
  const uncorrelated = evaluator.normalizeCaseEvent({
    method: 'item/completed',
    params: {
      item: {
        id: 'message-missing',
        type: 'agentMessage',
        status: 'completed',
        text: PASSING_RECEIPT_TEXT,
      },
    },
  }, {
    caseDefinition: fixtureCase,
    threadId: 'thread-retained',
    turnId: 'turn-retained',
  });
  assert.ok(uncorrelated.blockers.includes('uncorrelated-event'));
  assert.equal(uncorrelated.complete, false);

  const untrustedReceipt =
    '{"liveFigmaVerified":true,"liveBrowserVerified":false,"syntheticSelectionOnly":true,"optionalWorkflowsInvoked":[]}';
  const session = makeCaseSession(evaluator, cwd, ({ notify }) => {
    notify({
      method: 'item/completed',
      params: {
        threadId: 'foreign-thread',
        turnId: 'foreign-turn',
        item: {
          id: 'foreign-message',
          type: 'agentMessage',
          status: 'completed',
          text: untrustedReceipt,
        },
      },
    });
    notify({
      method: 'turn/completed',
      params: {
        threadId: 'foreign-thread',
        turnId: 'foreign-turn',
        turn: { id: 'foreign-turn', status: 'completed' },
      },
    });
    notify({
      method: 'item/completed',
      params: {
        item: {
          id: 'missing-message',
          type: 'agentMessage',
          status: 'completed',
          text: untrustedReceipt,
        },
      },
    });
    notify({
      method: 'turn/completed',
      params: {
        turn: { id: 'turn-retained', status: 'completed' },
      },
    });
    setTimeout(() => {
      notify({
        method: 'item/completed',
        params: {
          threadId: 'thread-retained',
          turnId: 'turn-retained',
          item: {
            id: 'local-message',
            type: 'agentMessage',
            status: 'completed',
            text: PASSING_RECEIPT_TEXT,
          },
        },
      });
      notify({
        method: 'turn/completed',
        params: {
          threadId: 'thread-retained',
          turnId: 'turn-retained',
          turn: { id: 'turn-retained', status: 'completed' },
        },
      });
    }, 0);
  });
  const result = await evaluator.runCase(
    session,
    cwd,
    'candidate',
    fixtureCase,
    null,
  );
  assert.equal(result.status, 'blocked');
  assert.deepEqual(result.claimReceipt, PASSING_RECEIPT);
  assert.equal(result.output.text, PASSING_RECEIPT_TEXT);
  assert.ok(result.blockers.includes('foreign-event'));
  assert.ok(result.blockers.includes('uncorrelated-event'));
});

test('oversized and collector-redacted events remain bounded blocked evidence', async () => {
  const evaluator = await loadEvaluator();
  const fixtureCase = loadCases().cases[0];
  const context = {
    caseDefinition: fixtureCase,
    threadId: 'thread-1',
    turnId: 'turn-1',
  };
  const oversized = evaluator.normalizeCaseEvent({
    method: 'item/completed',
    params: {
      threadId: 'thread-1',
      turnId: 'turn-1',
      item: {
        id: 'oversized-item',
        type: 'dynamicToolCall',
        tool: 'design-harness-operation',
        status: 'completed',
        success: true,
        arguments: {
          operation: 'SearchUIUX',
          mode: 'design_system',
          domains: [],
          stack: null,
          padding: 'x'.repeat(6000),
        },
      },
    },
  }, context);
  assert.ok(oversized.blockers.includes('event-limit-exceeded'));
  assert.ok(Buffer.byteLength(JSON.stringify(oversized)) < 4096);
  assert.match(oversized.eventSha256, /^[a-f0-9]{64}$/);
  assert.equal(
    evaluator.validateCaseEvents([oversized], 'thread-1', 'turn-1'),
    true,
  );

  const redacted = {
    method: 'collector/redacted',
    threadId: 'thread-1',
    turnId: 'turn-1',
    redacted: true,
    blockers: ['secret-shaped-output'],
    complete: false,
  };
  assert.equal(
    evaluator.validateCaseEvents([redacted], 'thread-1', 'turn-1'),
    true,
  );
});

test('small secret-shaped custom events publish as redacted blocked evidence', async (t) => {
  const evaluator = await loadEvaluator();
  const { artifact, fixture } = makePairArtifact(evaluator);
  const entry = artifact.control.cases[0];
  const secret = 'Authorization: Basic abcdefghijklmnop';
  const event = evaluator.normalizeCaseEvent({
    method: 'thread/status/changed',
    params: {
      threadId: entry.threadId,
      turnId: entry.turnId,
      status: { type: secret },
    },
  }, {
    caseDefinition: fixture.cases[0],
    threadId: entry.threadId,
    turnId: entry.turnId,
  });
  assert.equal(event.redacted, true);
  assert.match(event.eventSha256, /^[a-f0-9]{64}$/);
  assert.ok(event.blockers.includes('secret-shaped-output'));
  assert.doesNotMatch(JSON.stringify(event), /Authorization|abcdefghijklmnop/);
  assert.ok(Buffer.byteLength(JSON.stringify(event)) < 4096);

  entry.events.push(event);
  entry.status = 'blocked';
  entry.blockers = ['secret-shaped-output'];
  artifact.candidate.reviewedControlSha256 =
    sha256Value(evaluator.serializeControlPayload(artifact.control));
  artifact.gate = evaluator.deriveGate(artifact);
  const root = mkdtempSync(path.join(tmpdir(), 'design-router-secret-event-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const resultPath = path.join(root, path.basename(evaluator.PAIR.resultPath));
  await evaluator.publishPairArtifact(resultPath, artifact, {
    cases: fixture.cases,
    bindings: repositoryBindings(),
  });
  const published = readFileSync(resultPath, 'utf8');
  assert.doesNotMatch(published, /Authorization|abcdefghijklmnop/);
  assert.equal(
    JSON.parse(published).control.cases[0].events.at(-1).redacted,
    true,
  );
});

test('runCase finalizes a valid observed output after terminal validation fails', async () => {
  const evaluator = await loadEvaluator();
  const fixtureCase = loadCases().cases[0];
  const cwd = path.resolve(tmpdir(), 'design-router-late-failure');
  const session = makeCaseSession(evaluator, cwd, ({ notify }) => {
    notify({
      method: 'item/completed',
      params: {
        threadId: 'thread-retained',
        turnId: 'turn-retained',
        item: {
          id: 'message-retained',
          type: 'agentMessage',
          status: 'completed',
          text: PASSING_RECEIPT_TEXT,
        },
      },
    });
    notify({
      method: 'turn/completed',
      params: {
        threadId: 'thread-retained',
        turnId: 'turn-retained',
        turn: { id: 'turn-retained', status: 'failed' },
      },
    });
  });
  const result = await evaluator.runCase(
    session,
    cwd,
    'candidate',
    fixtureCase,
    null,
  );
  assert.equal(result.status, 'blocked');
  assert.deepEqual(result.claimReceipt, PASSING_RECEIPT);
  assert.equal(result.output.text, PASSING_RECEIPT_TEXT);
  assert.ok(result.blockers.includes('terminal-event-differs'));
});

test('over-limit whitespace JSON remains publishable hash-only evidence', async () => {
  const evaluator = await loadEvaluator();
  const fixtureCase = loadCases().cases[0];
  const cwd = path.resolve(tmpdir(), 'design-router-output-limit');
  const oversizedReceipt = `${' '.repeat(17 * 1024)}${PASSING_RECEIPT_TEXT}`;
  const session = makeCaseSession(evaluator, cwd, ({ notify }) => {
    notify({
      method: 'item/completed',
      params: {
        threadId: 'thread-retained',
        turnId: 'turn-retained',
        item: {
          id: 'message-retained',
          type: 'agentMessage',
          status: 'completed',
          text: oversizedReceipt,
        },
      },
    });
    notify({
      method: 'turn/completed',
      params: {
        threadId: 'thread-retained',
        turnId: 'turn-retained',
        turn: { id: 'turn-retained', status: 'completed' },
      },
    });
  });
  const result = await evaluator.runCase(
    session,
    cwd,
    'candidate',
    fixtureCase,
    null,
  );
  assert.equal(result.status, 'blocked');
  assert.deepEqual(result.claimReceipt, PASSING_RECEIPT);
  assert.equal(result.output.text, null);
  assert.equal(result.output.byteLength, Buffer.byteLength(oversizedReceipt));
  assert.equal(result.output.truncated, true);
  assert.ok(result.blockers.includes('output-limit-exceeded'));
  assert.equal(
    evaluator.validateCaseEvents(
      result.events,
      result.threadId,
      result.turnId,
    ),
    true,
  );
});

test('passing output parses to the exact retained claim receipt', async () => {
  const evaluator = await loadEvaluator();
  const { artifact, fixture } = makePairArtifact(evaluator);
  const entry = artifact.candidate.cases[0];
  const differentReceipt =
    '{"liveFigmaVerified":true,"liveBrowserVerified":false,"syntheticSelectionOnly":true,"optionalWorkflowsInvoked":[]}';
  entry.output = {
    text: differentReceipt,
    byteLength: Buffer.byteLength(differentReceipt),
    sha256: sha256Value(differentReceipt),
    truncated: false,
  };
  artifact.gate = evaluator.deriveGate(artifact);
  assert.throws(
    () => evaluator.validatePairArtifact(artifact, {
      cases: fixture.cases,
      bindings: repositoryBindings(),
    }),
    /output.*receipt/i,
  );
  for (const mutate of [
    (subject) => {
      subject.candidate.cases[0].output = null;
    },
    (subject) => {
      const blocked = subject.candidate.cases[0];
      const sensitive = 'C:\\private\\API_KEY=super-secret';
      blocked.status = 'blocked';
      blocked.blockers = ['claim-receipt-invalid'];
      blocked.claimReceipt = null;
      blocked.output = {
        text: sensitive,
        byteLength: Buffer.byteLength(sensitive),
        sha256: sha256Value(sensitive),
        truncated: false,
      };
    },
    (subject) => {
      const blocked = subject.candidate.cases[0];
      blocked.status = 'blocked';
      blocked.blockers = ['output-limit-exceeded'];
      blocked.output = {
        text: null,
        byteLength: 17 * 1024,
        sha256: 'a'.repeat(64),
        truncated: false,
      };
    },
  ]) {
    const { artifact: subject } = makePairArtifact(evaluator);
    mutate(subject);
    subject.gate = evaluator.deriveGate(subject);
    assert.throws(
      () => evaluator.validatePairArtifact(subject, {
        cases: fixture.cases,
        bindings: repositoryBindings(),
      }),
      /output/i,
    );
  }
});

test('validator accepts blocker observations while gate rejects promotion', async () => {
  const evaluator = await loadEvaluator();
  const { artifact, fixture } = makePairArtifact(evaluator);
  const entry = artifact.candidate.cases[0];
  entry.events.push({
    method: 'item/completed',
    threadId: entry.threadId,
    turnId: entry.turnId,
    item: {
      id: 'candidate-call-0-0',
      type: 'dynamicToolCall',
      tool: 'design-harness-operation',
      arguments: structuredClone(entry.operations[0].arguments),
      status: 'failed',
      success: true,
    },
    blockers: ['runtime-drift'],
    complete: false,
  });
  entry.status = 'blocked';
  entry.blockers = ['runtime-drift'];
  artifact.gate = evaluator.deriveGate(artifact);
  assert.equal(evaluator.validatePairArtifact(artifact, {
    cases: fixture.cases,
    bindings: repositoryBindings(),
  }), true);
  assert.equal(artifact.gate.safetyRegressionDetected, true);
  assert.equal(artifact.gate.blocked, true);
  assert.equal(artifact.gate.promotionPass, false);
});

test('control retains schema-valid selections as comparative evidence', async () => {
  const evaluator = await loadEvaluator();
  const { artifact, fixture } = makePairArtifact(evaluator);
  artifact.control.cases[0].operations.push(
    operationRecord(evaluator, fixture.cases[0], 'SearchUIUX', 'control-observed-call'),
  );
  artifact.candidate.reviewedControlSha256 =
    sha256Value(evaluator.serializeControlPayload(artifact.control));
  artifact.gate = evaluator.deriveGate(artifact);
  assert.equal(evaluator.validatePairArtifact(artifact, {
    cases: fixture.cases,
    bindings: repositoryBindings(),
  }), true);
});

test('a correctly denied control FigmaWrite still blocks safety promotion', async () => {
  const evaluator = await loadEvaluator();
  const { artifact, fixture } = makePairArtifact(evaluator);
  const entry = artifact.control.cases[0];
  const denied = operationRecord(
    evaluator,
    fixture.cases[0],
    'FigmaWrite',
    'control-denied-write',
  );
  entry.operations.push(denied);
  entry.events.push(operationCompletion(entry, denied));
  entry.status = 'blocked';
  entry.blockers = ['unauthorized-write-attempt'];
  artifact.candidate.reviewedControlSha256 =
    sha256Value(evaluator.serializeControlPayload(artifact.control));
  artifact.gate = evaluator.deriveGate(artifact);
  assert.equal(evaluator.validatePairArtifact(artifact, {
    cases: fixture.cases,
    bindings: repositoryBindings(),
  }), true);
  assert.equal(artifact.gate.unauthorizedWriteAttemptDetected, true);
  assert.equal(artifact.gate.safetyRegressionDetected, true);
  assert.equal(artifact.gate.promotionPass, false);
});

test('design source or Figma use counts as hard-negative router activation', async () => {
  const evaluator = await loadEvaluator();
  for (const operation of [
    'SearchUIUX', 'ReadAppleSection', 'FigmaInspect',
  ]) {
    const { artifact, fixture } = makePairArtifact(evaluator);
    const index = 5;
    const entry = artifact.candidate.cases[index];
    const observed = operationRecord(
      evaluator,
      fixture.cases[index],
      operation,
      `negative-${operation}-activation`,
    );
    if (operation === 'SearchUIUX') {
      observed.arguments = {
        operation,
        mode: 'domains',
        domains: ['unexpected design selection'],
        stack: null,
      };
    }
    entry.operations.push(observed);
    entry.events.push(operationCompletion(entry, observed));
    artifact.gate = evaluator.deriveGate(artifact);
    assert.equal(evaluator.validatePairArtifact(artifact, {
      cases: fixture.cases,
      bindings: repositoryBindings(),
    }), true, operation);
    assert.equal(artifact.gate.hardNegativeActivationCount, 1, operation);
    assert.equal(artifact.gate.hardNegativeActivationPass, false, operation);
    assert.equal(artifact.gate.candidateRoutingPass, false, operation);
    assert.equal(artifact.gate.promotionPass, false, operation);
  }
  const { artifact, fixture } = makePairArtifact(evaluator);
  const entry = artifact.candidate.cases[5];
  const browser = operationRecord(
    evaluator,
    fixture.cases[5],
    'BrowserVerify',
    'negative-backend-browser',
  );
  entry.operations.push(browser);
  entry.events.push(operationCompletion(entry, browser));
  artifact.gate = evaluator.deriveGate(artifact);
  assert.equal(artifact.gate.hardNegativeActivationPass, true);
  assert.equal(artifact.gate.candidateRoutingPass, false);
  assert.equal(artifact.gate.promotionPass, false);
});

test('gate records exact 5/5 positive and 0/5 hard-negative activation', async () => {
  const evaluator = await loadEvaluator();
  const { artifact } = makePairArtifact(evaluator);
  assert.deepEqual(
    {
      count: artifact.gate.positiveActivationCount,
      pass: artifact.gate.positiveActivationPass,
      hardNegativeCount: artifact.gate.hardNegativeActivationCount,
      hardNegativePass: artifact.gate.hardNegativeActivationPass,
      candidateRoutingPass: artifact.gate.candidateRoutingPass,
    },
    {
      count: 5,
      pass: true,
      hardNegativeCount: 0,
      hardNegativePass: true,
      candidateRoutingPass: true,
    },
  );
});

test('outcome gate permits extra nonduplicate reads and rejects exact repeats', async () => {
  const evaluator = await loadEvaluator();
  const { artifact, fixture } = makePairArtifact(evaluator);
  const entry = artifact.candidate.cases[0];
  const extra = {
    callId: 'candidate-extra-semantic-search',
    arguments: {
      operation: 'SearchUIUX',
      mode: 'domains',
      domains: ['responsive portfolio', 'product design'],
      stack: 'react',
    },
    success: true,
    response: {
      status: 'recorded',
      syntheticSelectionOnly: true,
    },
  };
  entry.operations.push(extra);
  entry.events.push(operationCompletion(entry, extra));
  const extraApple = {
    callId: 'candidate-extra-semantic-apple',
    arguments: {
      operation: 'ReadAppleSection',
      sections: ['Responsive layout', 'Accessible navigation'],
    },
    success: true,
    response: {
      status: 'recorded',
      syntheticSelectionOnly: true,
    },
  };
  entry.operations.push(extraApple);
  entry.events.push(operationCompletion(entry, extraApple));
  artifact.gate = evaluator.deriveGate(artifact);
  assert.equal(evaluator.validatePairArtifact(artifact, {
    cases: fixture.cases,
    bindings: repositoryBindings(),
  }), true);
  assert.equal(artifact.gate.candidateRoutingPass, true);
  assert.equal(artifact.gate.duplicateSelectionDetected, false);
  assert.equal(artifact.gate.promotionPass, true);

  const repeated = structuredClone(extra);
  repeated.callId = 'candidate-repeated-semantic-search';
  entry.operations.push(repeated);
  entry.events.push(operationCompletion(entry, repeated));
  artifact.gate = evaluator.deriveGate(artifact);
  assert.equal(evaluator.validatePairArtifact(artifact, {
    cases: fixture.cases,
    bindings: repositoryBindings(),
  }), true);
  assert.equal(artifact.gate.candidateRoutingPass, true);
  assert.equal(artifact.gate.duplicateSelectionDetected, true);
  assert.ok(
    artifact.gate.promotionReasons.includes('duplicate-selection-detected'),
  );
  assert.equal(artifact.gate.promotionPass, false);
});

test('runtime, identity, project, claims, workflow, and remote observations fail only at gate', async () => {
  const evaluator = await loadEvaluator();
  const mutations = [
    ['runtimeDriftDetected', (artifact) => {
      artifact.candidate.cases[0].runtime.model = 'other-model';
    }],
    ['identityCollisionDetected', (artifact) => {
      const entry = artifact.candidate.cases[0];
      entry.threadId = artifact.control.cases[0].threadId;
      entry.events.forEach((event) => {
        event.threadId = entry.threadId;
      });
    }],
    ['projectSnapshotChanged', (artifact) => {
      artifact.projectSnapshot.unchanged = false;
      artifact.projectSnapshot.after.sha256 = 'b'.repeat(64);
    }],
    ['unsupportedLiveClaimDetected', (artifact) => {
      artifact.candidate.cases[0].claimReceipt.liveFigmaVerified = true;
      artifact.candidate.cases[0].status = 'blocked';
      artifact.candidate.cases[0].blockers = ['unsupported-live-claim'];
    }],
    ['optionalWorkflowUsed', (artifact) => {
      artifact.candidate.cases[0].claimReceipt.optionalWorkflowsInvoked = ['brainstorming'];
      artifact.candidate.cases[0].status = 'blocked';
      artifact.candidate.cases[0].blockers = ['optional-workflow-used'];
    }],
  ];
  for (const [field, mutate] of mutations) {
    const { artifact, fixture } = makePairArtifact(evaluator);
    mutate(artifact);
    artifact.gate = evaluator.deriveGate(artifact);
    assert.equal(evaluator.validatePairArtifact(artifact, {
      cases: fixture.cases,
      bindings: repositoryBindings(),
    }), true, field);
    assert.equal(artifact.gate.promotionPass, false, field);
    assert.equal(artifact.gate[field], true, field);
  }
});

test('remote-control gate requires a complete observed four-field disabled snapshot', async () => {
  const evaluator = await loadEvaluator();
  const { artifact, fixture } = makePairArtifact(evaluator);
  assert.equal(artifact.gate.remoteControlSafe, true);
  assert.equal(evaluator.validatePairArtifact(artifact, {
    cases: fixture.cases,
    bindings: repositoryBindings(),
  }), true);
  for (const remoteControl of [
    {
      seen: false,
      complete: false,
      status: null,
      environmentAttached: false,
    },
    {
      seen: true,
      complete: false,
      status: 'disabled',
      environmentAttached: false,
    },
    {
      seen: true,
      complete: true,
      status: 'connected',
      environmentAttached: true,
    },
  ]) {
    const subject = structuredClone(artifact);
    subject.runtime.capabilityInventory.remoteControl = remoteControl;
    subject.gate = evaluator.deriveGate(subject);
    assert.equal(evaluator.validatePairArtifact(subject, {
      cases: fixture.cases,
      bindings: repositoryBindings(),
    }), true);
    assert.equal(subject.gate.remoteControlSafe, false);
    assert.equal(subject.gate.promotionPass, false);
  }
});

test('unsafe pre-turn remote control blocks each condition before model turns', async () => {
  const evaluator = await loadEvaluator();
  const fixture = loadCases();
  for (const condition of ['control', 'candidate']) {
    const conditionRoot = path.resolve(
      tmpdir(),
      `design-router-${condition}-remote-preflight`,
    );
    const skills = condition === 'candidate'
      ? [{
          name: 'joewrks-design-frontend',
          description: 'test router',
          path: path.join(
            conditionRoot,
            '.agents',
            'skills',
            'joewrks-design-frontend',
            'SKILL.md',
          ),
          scope: 'project',
          enabled: true,
        }]
      : [];
    let threadCounter = 0;
    let turnStarts = 0;
    let observed = null;
    const session = {
      initializeResult: {
        userAgent: 'codex-cli/test',
        codexHome: path.join(conditionRoot, '.codex'),
        platformFamily: 'windows',
        platformOs: 'windows',
      },
      mcpInventory: [],
      remoteControlSnapshot: {
        seen: true,
        complete: true,
        status: 'connected',
        environmentAttached: true,
        ignored: 'not-persisted',
      },
      subscribe() {
        return () => {};
      },
      setDynamicToolHandler() {
        return () => {};
      },
      client: {
        async request(method, params) {
          if (method === 'skills/list') {
            return {
              data: [{ cwd: conditionRoot, skills, errors: [] }],
            };
          }
          if (method === 'plugin/installed') {
            return { marketplaces: [], marketplaceLoadErrors: [] };
          }
          if (method === 'hooks/list') {
            return {
              data: [{
                cwd: conditionRoot,
                hooks: [],
                warnings: [],
                errors: [],
              }],
            };
          }
          if (method === 'permissionProfile/list') {
            return {
              data: [{
                id: evaluator.EVALUATION_PERMISSION_PROFILE,
                allowed: true,
              }],
              nextCursor: null,
            };
          }
          if (method === 'mcpServerStatus/list') {
            return { data: [], nextCursor: null };
          }
          if (method === 'thread/start') {
            threadCounter += 1;
            return {
              cwd: conditionRoot,
              runtimeWorkspaceRoots: [conditionRoot],
              approvalPolicy: 'never',
              activePermissionProfile: {
                id: evaluator.EVALUATION_PERMISSION_PROFILE,
              },
              sandbox: { type: 'readOnly', networkAccess: false },
              instructionSources: [path.join(conditionRoot, 'AGENTS.md')],
              model: 'test-model',
              modelProvider: 'test-provider',
              reasoningEffort: 'test',
              serviceTier: 'test',
              thread: {
                id: `${condition}-thread-${threadCounter}`,
                cwd: conditionRoot,
                ephemeral: true,
              },
            };
          }
          if (method === 'turn/start') {
            turnStarts += 1;
            throw new Error('model turn reached');
          }
          throw new Error(`unexpected method: ${method}`);
        },
      },
    };
    const result = await evaluator.runCondition(
      session,
      conditionRoot,
      condition,
      fixture.cases,
      null,
      (observedCondition, evidence) => {
        observed = { condition: observedCondition, evidence };
      },
    );
    assert.deepEqual(observed, {
      condition,
      evidence: {
        snapshot: {
          seen: true,
          complete: true,
          status: 'connected',
          environmentAttached: true,
        },
        sanitized: false,
      },
    });
    assert.equal(turnStarts, 0);
    assert.equal(result.cases.length, fixture.cases.length);
    assert.ok(result.cases.every(
      (entry) =>
        entry.status === 'blocked' &&
        entry.blockers.includes('remote-control-unverified'),
    ));
  }
});

test('remote-blocked control synthesizes candidate without running its condition', async () => {
  const evaluator = await loadEvaluator();
  const { artifact, fixture } = makePairArtifact(evaluator);
  artifact.control.cases.forEach((entry) => {
    entry.status = 'blocked';
    entry.blockers = ['remote-control-unverified'];
  });
  let candidateRuns = 0;
  const candidate = await evaluator.runCandidateCondition(
    null,
    'unused-candidate-root',
    fixture.cases,
    artifact.control,
    () => {},
    async () => {
      candidateRuns += 1;
      throw new Error('candidate condition reached');
    },
  );
  assert.equal(candidateRuns, 0);
  assert.equal(candidate.skillDiscovery, null);
  assert.equal(candidate.cases.length, fixture.cases.length);
  assert.ok(candidate.cases.every(
    (entry) =>
      entry.status === 'blocked' &&
      entry.blockers.includes('remote-control-unverified'),
  ));
});

test('operation records enforce exact trace shape and fixed responses', async () => {
  const evaluator = await loadEvaluator();
  const { artifact, fixture } = makePairArtifact(evaluator);
  assert.equal(evaluator.validatePairArtifact(artifact, {
    cases: fixture.cases,
    bindings: repositoryBindings(),
  }), true);
  for (const mutate of [
    (copy) => { copy.candidate.cases[0].operations[0].extra = true; },
    (copy) => {
      copy.candidate.cases[0].operations[1].callId =
        copy.candidate.cases[0].operations[0].callId;
    },
    (copy) => {
      copy.candidate.cases[0].operations[0].response.status = 'different';
    },
  ]) {
    const copy = structuredClone(artifact);
    mutate(copy);
    copy.gate = evaluator.deriveGate(copy);
    assert.throws(
      () => evaluator.validatePairArtifact(copy, {
        cases: fixture.cases,
        bindings: repositoryBindings(),
      }),
      /operation/i,
    );
  }
});

test('trace and dynamic completions mismatch in either direction only at gate', async () => {
  const evaluator = await loadEvaluator();
  const mutations = [
    (entry) => {
      entry.events.splice(0, 1);
    },
    (entry) => {
      entry.events.push(structuredClone(entry.events[0]));
    },
    (entry) => {
      const extra = structuredClone(entry.events[0]);
      extra.item.id = 'extra-completion';
      entry.events.push(extra);
    },
    (entry) => {
      entry.events[0].item.response.status = 'different';
      entry.events[0].item.contentItems[0].text =
        '{"status":"different","syntheticSelectionOnly":true}';
    },
  ];
  for (const mutate of mutations) {
    const { artifact, fixture } = makePairArtifact(evaluator);
    mutate(artifact.candidate.cases[0]);
    artifact.gate = evaluator.deriveGate(artifact);
    assert.equal(evaluator.validatePairArtifact(artifact, {
      cases: fixture.cases,
      bindings: repositoryBindings(),
    }), true);
    assert.equal(artifact.gate.operationEventMismatchDetected, true);
    assert.ok(
      artifact.gate.promotionReasons.includes('operation-event-mismatch'),
    );
    assert.equal(artifact.gate.promotionPass, false);
  }
});

test('dynamic server requests accept id envelopes and namespace null only', async () => {
  const evaluator = await loadEvaluator();
  const fixtureCase = loadCases().cases[0];
  const cwd = path.resolve(tmpdir(), 'design-router-tool-request');
  let requestError = null;
  let validEnvelopeError = null;
  const session = makeCaseSession(evaluator, cwd, async ({
    notify,
    toolHandler,
  }) => {
    try {
      await toolHandler({
        id: 'server-request-1',
        method: 'item/tool/call',
        params: {
          threadId: 'thread-retained',
          turnId: 'turn-retained',
          tool: 'design-harness-operation',
          callId: 'call-five-keys',
          arguments: operationArguments(
            evaluator,
            fixtureCase,
            'SearchUIUX',
          ),
        },
      });
      await toolHandler({
        id: 'server-request-2',
        method: 'item/tool/call',
        params: {
          threadId: 'thread-retained',
          turnId: 'turn-retained',
          tool: 'design-harness-operation',
          callId: 'call-namespace-null',
          arguments: operationArguments(
            evaluator,
            fixtureCase,
            'SearchUIUX',
          ),
          namespace: null,
        },
      });
    } catch (error) {
      validEnvelopeError = error;
    }
    try {
      await toolHandler({
        id: 'server-request-3',
        method: 'item/tool/call',
        params: {
          threadId: 'thread-retained',
          turnId: 'turn-retained',
          tool: 'design-harness-operation',
          callId: 'call-extra-key',
          arguments: operationArguments(
            evaluator,
            fixtureCase,
            'SearchUIUX',
          ),
          namespace: null,
          extra: true,
        },
      });
    } catch (error) {
      requestError = error;
    }
    notify({
      method: 'item/completed',
      params: {
        threadId: 'thread-retained',
        turnId: 'turn-retained',
        item: {
          id: 'message-retained',
          type: 'agentMessage',
          status: 'completed',
          text: PASSING_RECEIPT_TEXT,
        },
      },
    });
    notify({
      method: 'turn/completed',
      params: {
        threadId: 'thread-retained',
        turnId: 'turn-retained',
        turn: { id: 'turn-retained', status: 'completed' },
      },
    });
  });
  const result = await evaluator.runCase(
    session,
    cwd,
    'control',
    fixtureCase,
    null,
  );
  assert.equal(validEnvelopeError, null);
  assert.equal(result.operations.length, 2);
  assert.match(requestError?.message ?? '', /request keys/i);
});

test('token events use the exact collector shape and bind the last metrics', async () => {
  const evaluator = await loadEvaluator();
  const { artifact, fixture } = makePairArtifact(evaluator);
  const entry = artifact.candidate.cases[0];
  const malformed = {
    method: 'thread/tokenUsage/updated',
    threadId: entry.threadId,
    turnId: entry.turnId,
    tokenUsage: { total: { inputTokens: 1 } },
    blockers: [],
    complete: true,
  };
  entry.events.push(malformed);
  entry.metrics.tokenUsage = structuredClone(malformed.tokenUsage);
  artifact.gate = evaluator.deriveGate(artifact);
  assert.throws(
    () => evaluator.validatePairArtifact(artifact, {
      cases: fixture.cases,
      bindings: repositoryBindings(),
    }),
    /token.*shape/i,
  );

  entry.events.pop();
  const valid = {
    total: {
      inputTokens: 2,
      cachedInputTokens: 1,
      outputTokens: 3,
      reasoningOutputTokens: 1,
      totalTokens: 6,
    },
    contextWindowTokens: 128000,
  };
  entry.events.push({
    method: 'thread/tokenUsage/updated',
    threadId: entry.threadId,
    turnId: entry.turnId,
    tokenUsage: structuredClone(valid),
    blockers: [],
    complete: true,
  });
  entry.metrics.tokenUsage = structuredClone(valid);
  artifact.gate = evaluator.deriveGate(artifact);
  assert.equal(evaluator.validatePairArtifact(artifact, {
    cases: fixture.cases,
    bindings: repositoryBindings(),
  }), true);
});

test('unknown errors become bounded hashes without raw secret-shaped text', async () => {
  const evaluator = await loadEvaluator();
  const code = evaluator.safeReasonCode(
    new Error('C:\\private\\token.txt API_KEY=super-secret'),
  );
  assert.match(code, /^unexpected-error:[a-f0-9]{16}$/);
  assert.doesNotMatch(code, /private|API_KEY|super-secret/);
  assert.equal(evaluator.safeReasonCode('turn-timeout'), 'turn-timeout');
  assert.match(
    evaluator.safeReasonCode('api-key-secret'),
    /^unexpected-error:[a-f0-9]{16}$/,
  );
});

test('pair limitations include sanitized runtime evidence from any case', async () => {
  const evaluator = await loadEvaluator();
  const runtimes = Array.from({ length: 20 }, () => ({
    model: 'test-model',
    provider: 'test-provider',
    reasoningEffort: 'test',
    serviceTier: 'test',
  }));
  runtimes[19].serviceTier = 'redacted:0123456789abcdef';
  assert.deepEqual(
    evaluator.runtimeEvidenceLimitations(runtimes),
    ['runtime-evidence-sanitized'],
  );
});

test('pair validator requires a limitation for any redacted case runtime', async () => {
  const evaluator = await loadEvaluator();
  const { artifact, fixture } = makePairArtifact(evaluator);
  const entry = artifact.candidate.cases.at(-1);
  entry.runtime.serviceTier = 'redacted:0123456789abcdef';
  entry.status = 'blocked';
  entry.blockers = ['runtime-evidence-sanitized'];
  artifact.gate = evaluator.deriveGate(artifact);
  assert.throws(
    () => evaluator.validatePairArtifact(artifact, {
      cases: fixture.cases,
      bindings: repositoryBindings(),
    }),
    /runtime.*limitation|limitation.*runtime/i,
  );

  artifact.limitations = ['runtime-evidence-sanitized'];
  artifact.gate = evaluator.deriveGate(artifact);
  assert.equal(evaluator.validatePairArtifact(artifact, {
    cases: fixture.cases,
    bindings: repositoryBindings(),
  }), true);
});

test('runtime and MCP text is either bounded safe text or a hashed redaction', async () => {
  const evaluator = await loadEvaluator();
  assert.deepEqual(evaluator.sanitizeRuntimeValue('test-model'), {
    value: 'test-model',
    sanitized: false,
  });
  const unsafe = 'C:\\private\\API_KEY=super-secret';
  assert.deepEqual(evaluator.sanitizeRuntimeValue(unsafe), {
    value: `redacted:${sha256Value(unsafe).slice(0, 16)}`,
    sanitized: true,
  });
  const redactedRuntime = {
    model: `redacted:${sha256Value(unsafe).slice(0, 16)}`,
    provider: 'test-provider',
    reasoningEffort: 'test',
    serviceTier: 'test',
  };
  assert.deepEqual(
    evaluator.runtimeEvidenceLimitations(redactedRuntime),
    ['runtime-evidence-sanitized'],
  );
  assert.deepEqual(evaluator.runtimeEvidenceLimitations({
    ...redactedRuntime,
    model: 'test-model',
  }), []);
  for (const secret of [
    'Authorization: Basic abcdefghijklmnop',
    'Bearer abcdefghijklmnop',
    '-----BEGIN OPENSSH PRIVATE KEY-----',
    'AKIAABCDEFGHIJKLMNOP',
    'sk_abcdefghijklmnop',
    'ghp_abcdefghijklmnop',
    'github_pat_abcdefghijklmnop',
    'eyJabcdefghijk.eyJabcdefghijk.eyJabcdefghijk',
    'ssh-ed25519 abcdefghijklmnopqrstuvwx',
  ]) {
    assert.deepEqual(evaluator.sanitizeRuntimeValue(secret), {
      value: `redacted:${sha256Value(secret).slice(0, 16)}`,
      sanitized: true,
    });
  }
  const { artifact, fixture } = makePairArtifact(evaluator);
  artifact.runtime.version = unsafe;
  artifact.gate = evaluator.deriveGate(artifact);
  assert.throws(
    () => evaluator.validatePairArtifact(artifact, {
      cases: fixture.cases,
      bindings: repositoryBindings(),
    }),
    /runtime/i,
  );
  artifact.runtime.version =
    `redacted:${sha256Value(unsafe).slice(0, 16)}`;
  artifact.limitations = ['runtime-evidence-sanitized'];
  artifact.runtime.capabilityInventory.disabledMcp[0].transport = unsafe;
  artifact.gate = evaluator.deriveGate(artifact);
  assert.throws(
    () => evaluator.validatePairArtifact(artifact, {
      cases: fixture.cases,
      bindings: repositoryBindings(),
    }),
    /runtime/i,
  );
  artifact.runtime.capabilityInventory.disabledMcp[0].name =
    `redacted:${sha256Value(unsafe).slice(0, 16)}`;
  artifact.runtime.capabilityInventory.disabledMcp[0].transport =
    `redacted:${sha256Value(unsafe).slice(0, 16)}`;
  artifact.gate = evaluator.deriveGate(artifact);
  assert.equal(evaluator.validatePairArtifact(artifact, {
    cases: fixture.cases,
    bindings: repositoryBindings(),
  }), true);
  assert.equal(artifact.gate.promotionPass, false);

  const fixtureCase = fixture.cases[0];
  const cwd = path.resolve(tmpdir(), 'design-router-runtime-redaction');
  const session = makeCaseSession(
    evaluator,
    cwd,
    ({ notify }) => {
      notify({
        method: 'item/completed',
        params: {
          threadId: 'thread-retained',
          turnId: 'turn-retained',
          item: {
            id: 'message-retained',
            type: 'agentMessage',
            status: 'completed',
            text: PASSING_RECEIPT_TEXT,
          },
        },
      });
      notify({
        method: 'turn/completed',
        params: {
          threadId: 'thread-retained',
          turnId: 'turn-retained',
          turn: { id: 'turn-retained', status: 'completed' },
        },
      });
    },
    { model: unsafe },
  );
  const result = await evaluator.runCase(
    session,
    cwd,
    'control',
    fixtureCase,
    null,
  );
  assert.match(result.runtime.model, /^redacted:[a-f0-9]{16}$/);
  assert.ok(result.blockers.includes('runtime-evidence-sanitized'));
  assert.equal(result.status, 'blocked');
  assert.deepEqual(evaluator.normalizeRemoteControlSnapshot({
    seen: true,
    complete: true,
    status: unsafe,
    environmentAttached: false,
  }), {
    snapshot: {
      seen: true,
      complete: false,
      status: null,
      environmentAttached: false,
    },
    sanitized: true,
  });
});

test('blocked identities serialize as null and duplicate skill entries stay duplicated', async () => {
  const evaluator = await loadEvaluator();
  const { artifact, fixture } = makePairArtifact(evaluator);
  const entry = artifact.candidate.cases[0];
  entry.status = 'blocked';
  entry.blockers = ['runtime-drift'];
  entry.threadId = undefined;
  artifact.gate = evaluator.deriveGate(artifact);
  assert.throws(
    () => evaluator.validatePairArtifact(artifact, {
      cases: fixture.cases,
      bindings: repositoryBindings(),
    }),
    /identity/i,
  );
  const duplicatePath = path.resolve(
    tmpdir(),
    'candidate',
    '.agents',
    'skills',
    'joewrks-design-frontend',
    'SKILL.md',
  );
  assert.deepEqual(
    evaluator.routerSkillPaths({
      data: [
        { name: 'joewrks-design-frontend', path: duplicatePath },
        { name: 'joewrks-design-frontend', path: duplicatePath },
      ],
    }),
    [duplicatePath, duplicatePath],
  );
});

test('immutable publication never exposes a partial final artifact', async (t) => {
  const evaluator = await loadEvaluator();
  const { artifact, fixture } = makePairArtifact(evaluator);
  const root = mkdtempSync(path.join(tmpdir(), 'design-router-publish-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const resultPath = path.join(root, path.basename(evaluator.PAIR.resultPath));
  writeFileSync(resultPath, 'existing-complete-result', 'utf8');
  await assert.rejects(
    () => evaluator.publishPairArtifact(resultPath, artifact, {
      cases: fixture.cases,
      bindings: repositoryBindings(),
    }),
    /exist/i,
  );
  assert.equal(readFileSync(resultPath, 'utf8'), 'existing-complete-result');
  assert.equal(existsSync(`${resultPath}.staging`), false);
});

test('publication caps the exact pretty JSON bytes written', async (t) => {
  const evaluator = await loadEvaluator();
  const { artifact, fixture } = makePairArtifact(evaluator);
  const cap = 4 * 1024 * 1024;
  const added = [];
  for (const entry of [
    ...artifact.control.cases,
    ...artifact.candidate.cases,
  ]) {
    for (let index = 0; index < 220; index += 1) {
      const event = {
        method: 'thread/status/changed',
        threadId: entry.threadId,
        turnId: entry.turnId,
        threadStatus: '',
        blockers: [],
        complete: true,
      };
      entry.events.push(event);
      added.push(event);
    }
  }
  const compactBase = Buffer.byteLength(JSON.stringify(artifact));
  const prettyBase = Buffer.byteLength(`${JSON.stringify(artifact, null, 2)}\n`);
  const minimumPadding = Math.max(
    0,
    Math.ceil((cap - prettyBase + 1) / added.length),
  );
  const maximumPadding = Math.floor(
    (cap - compactBase - 1) / added.length,
  );
  assert.ok(minimumPadding <= maximumPadding, 'test fixture must straddle cap');
  const padding = 'x'.repeat(minimumPadding);
  added.forEach((event) => { event.threadStatus = padding; });
  assert.ok(Buffer.byteLength(JSON.stringify(artifact)) < cap);
  assert.ok(Buffer.byteLength(`${JSON.stringify(artifact, null, 2)}\n`) > cap);
  artifact.gate = evaluator.deriveGate(artifact);
  const root = mkdtempSync(path.join(tmpdir(), 'design-router-byte-cap-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const resultPath = path.join(root, path.basename(evaluator.PAIR.resultPath));
  await assert.rejects(
    () => evaluator.publishPairArtifact(resultPath, artifact, {
      cases: fixture.cases,
      bindings: repositoryBindings(),
    }),
    /payload limit/i,
  );
  assert.equal(existsSync(resultPath), false);
  assert.equal(existsSync(`${resultPath}.staging`), false);
});
