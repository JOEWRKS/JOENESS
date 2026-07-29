import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const ROOT = path.resolve(import.meta.dirname, '..');
const CASES_PATH = path.join(ROOT, 'evals', 'design-frontend', 'cases.json');
const BASELINE_PATH = path.join(ROOT, 'evals', 'design-frontend', 'router-baseline.json');
const GITATTRIBUTES_PATH = path.join(ROOT, '.gitattributes');
const ROUTER_PATH = path.join(ROOT, 'skills', 'joewrks-design-frontend', 'SKILL.md');
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
  'uiUxDomains', 'uiUxSearchMode', 'uiUxStack', 'appleCriteria', 'figma', 'browser', 'forbiddenActions',
  'forbiddenCompletionClaims',
].sort();

function loadCases() {
  return JSON.parse(readFileSync(CASES_PATH, 'utf8'));
}

function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

test('design frontend fixtures define the ten-case routing contract', () => {
  const fixture = loadCases();
  assert.equal(fixture.schemaVersion, 1);
  assert.equal(fixture.cases.length, 10);
  assert.deepEqual(fixture.cases.map(({ id }) => id), [...POSITIVE_IDS, ...NEGATIVE_IDS]);

  for (const fixtureCase of fixture.cases) {
    assert.deepEqual(Object.keys(fixtureCase).sort(), CASE_FIELDS, fixtureCase.id);
    assert.ok(fixtureCase.request.trim(), `${fixtureCase.id}: empty model-facing request`);
    assert.doesNotMatch(fixtureCase.request, /\b(?:passCriteria|failCriteria|rubric|expectedRouterActivation)\b/i, `${fixtureCase.id}: evaluator rubric leaked into request`);
    assert.ok(fixtureCase.approvedScope.trim(), `${fixtureCase.id}: missing approved scope`);
    assert.ok(fixtureCase.visualAuthority.trim(), `${fixtureCase.id}: missing visual authority`);
    assert.ok(['design_system', 'domains', 'none'].includes(fixtureCase.uiUxSearchMode), `${fixtureCase.id}: invalid UI UX search mode`);
    assert.ok(fixtureCase.uiUxStack === null || typeof fixtureCase.uiUxStack === 'string', `${fixtureCase.id}: invalid UI UX stack`);
    assert.ok(['required', 'not_required'].includes(fixtureCase.figma), `${fixtureCase.id}: invalid Figma requirement`);
    assert.ok(['required', 'not_required'].includes(fixtureCase.browser), `${fixtureCase.id}: invalid browser requirement`);
    for (const field of ['uiUxDomains', 'appleCriteria', 'forbiddenActions', 'forbiddenCompletionClaims']) {
      assert.ok(Array.isArray(fixtureCase[field]), `${fixtureCase.id}: ${field} must be an array`);
    }
  }

  for (const fixtureCase of fixture.cases.slice(0, POSITIVE_IDS.length)) {
    assert.equal(fixtureCase.expectedRouterActivation, true, `${fixtureCase.id}: positive must activate router`);
    if (fixtureCase.uiUxSearchMode === 'design_system') {
      assert.deepEqual(fixtureCase.uiUxDomains, [], `${fixtureCase.id}: design-system search must not fan out into domains`);
    } else {
      assert.equal(fixtureCase.uiUxSearchMode, 'domains', `${fixtureCase.id}: positive needs a UI UX search mode`);
      assert.ok(fixtureCase.uiUxDomains.length, `${fixtureCase.id}: domain search needs UI UX domains`);
    }
    assert.ok(fixtureCase.appleCriteria.length, `${fixtureCase.id}: positive needs Apple criteria`);
    for (const criterion of fixtureCase.appleCriteria) {
      assert.ok(APPLE_SECTION_NAMES.has(criterion), `${fixtureCase.id}: non-section Apple criterion: ${criterion}`);
    }
  }
  for (const fixtureCase of fixture.cases.slice(POSITIVE_IDS.length)) {
    assert.equal(fixtureCase.expectedRouterActivation, false, `${fixtureCase.id}: hard negative must avoid router`);
    assert.deepEqual(fixtureCase.uiUxDomains, [], `${fixtureCase.id}: hard negative loads UI UX domains`);
    assert.deepEqual(fixtureCase.appleCriteria, [], `${fixtureCase.id}: hard negative loads Apple criteria`);
  }

  assert.deepEqual(fixture.cases[0].uiUxDomains, []);
  assert.equal(fixture.cases[0].uiUxSearchMode, 'design_system');
  assert.equal(fixture.cases[0].uiUxStack, null);
  assert.deepEqual(fixture.cases[1].uiUxDomains, ['ux']);
  assert.equal(fixture.cases[1].uiUxSearchMode, 'domains');
  assert.equal(fixture.cases[1].uiUxStack, 'react');
  assert.deepEqual(fixture.cases[2].uiUxDomains, ['style', 'color', 'typography', 'ux']);
  assert.equal(fixture.cases[2].uiUxSearchMode, 'domains');
  assert.equal(fixture.cases[2].uiUxStack, null);
  assert.deepEqual(fixture.cases[3].uiUxDomains, ['ux']);
  assert.equal(fixture.cases[3].uiUxSearchMode, 'domains');
  assert.equal(fixture.cases[3].uiUxStack, null);
  assert.deepEqual(fixture.cases[4].uiUxDomains, ['ux', 'gsap']);
  assert.equal(fixture.cases[4].uiUxSearchMode, 'domains');
  assert.equal(fixture.cases[4].uiUxStack, null);
  assert.equal(fixture.cases[7].browser, 'required');
  for (const fixtureCase of fixture.cases.slice(POSITIVE_IDS.length)) {
    assert.equal(fixtureCase.uiUxSearchMode, 'none', `${fixtureCase.id}: hard negative must not search UI UX data`);
    assert.deepEqual(fixtureCase.uiUxDomains, [], `${fixtureCase.id}: hard negative loads UI UX domains`);
    assert.equal(fixtureCase.uiUxStack, null, `${fixtureCase.id}: hard negative selects a UI UX stack`);
  }
});

test('router baseline is bound to the current fixture contract without a model run', () => {
  const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
  assert.deepEqual(Object.keys(baseline).sort(), ['casesSha256', 'modelRun', 'result', 'routerPath', 'schemaVersion', 'testPath']);
  assert.equal(baseline.schemaVersion, 1);
  assert.equal(baseline.routerPath, 'skills/joewrks-design-frontend/SKILL.md');
  assert.equal(baseline.testPath, 'tests/design-frontend-routing.tests.mjs');
  assert.equal(baseline.casesSha256, sha256(CASES_PATH), 'baseline cases hash is stale');
  assert.equal(baseline.modelRun, false);
  assert.equal(baseline.result, 'router_absent');
});

test('routing baseline inputs retain LF bytes on checkout', () => {
  const attributes = readFileSync(GITATTRIBUTES_PATH, 'utf8');
  assert.match(attributes, /^\/evals\/design-frontend\/\*\.json text eol=lf$/m);
  assert.match(attributes, /^\/tests\/design-frontend-routing\.tests\.mjs text eol=lf$/m);
});

test('joewrks-design-frontend candidate matches the routing contract', () => {
  assert.ok(existsSync(ROUTER_PATH), 'router_absent');
  const router = readFileSync(ROUTER_PATH, 'utf8');
  assert.match(router, /^---\r?\nname: joewrks-design-frontend\r?\n/m, 'router name must match its folder');
  assert.match(router, /meaningful UI\/UX|responsive-layout|accessibility|motion/i, 'router must define positive activation boundaries');
  assert.match(router, /nonvisual|one-line copy|handoff|backend/i, 'router must define hard-negative boundaries');
});
