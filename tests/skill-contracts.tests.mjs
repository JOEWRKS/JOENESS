import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CASES = path.join(ROOT, 'evals', 'skill-contracts', 'cases-v2.json');

const rolePaths = {
  project: path.join(ROOT, 'skills', 'project'),
  design: path.join(ROOT, 'skills', 'design'),
  'visual-check': path.join(ROOT, 'skills', 'visual-check'),
  handoff: path.join(ROOT, 'skills', 'handoff'),
};

const expectedCases = {
  schemaVersion: 2,
  cases: [
    { id: 'long-project-no-ledger', expectedSkills: ['project'], forbiddenSkills: [], request: '여러 출시 단계가 있는 새 앱 프로젝트를 시작할 거야. 아직 계획 원장은 없어.' },
    { id: 'small-fix', expectedSkills: [], forbiddenSkills: ['project'], request: '오타 한 글자만 고쳐줘.' },
    { id: 'login-ui-plan-only', expectedSkills: ['design'], forbiddenSkills: ['visual-check'], request: '새 로그인 화면의 UI와 반응형 동작을 문서로만 설계해줘. 화면 구현이나 이미지 산출물은 만들지 마.' },
    { id: 'implemented-login-ui', expectedSkills: ['design', 'visual-check'], forbiddenSkills: [], requiredEvidence: ['exact-current-runtime'], forbiddenEvidence: ['build-or-test-only'], request: '새 로그인 화면을 실제 앱에 구현하고 완료해줘.' },
    { id: 'subjective-redesign-output', expectedSkills: ['design', 'visual-check'], forbiddenSkills: [], request: '첫 시안을 더 따뜻하게 다시 디자인하고 실제 화면으로 구현해줘.' },
    { id: 'new-game-art-output', expectedSkills: ['visual-check'], forbiddenSkills: ['design'], requiredEvidence: ['exact-current-runtime'], forbiddenEvidence: ['asset-file-only'], request: '게임용 32x32 산탄총 스프라이트를 새로 만들어 실제 게임에 적용해줘. UI/UX 의도 변경은 없어.' },
    { id: 'asset-only-delivery', expectedSkills: ['visual-check'], forbiddenSkills: ['design'], requiredEvidence: ['exact-asset-native'], forbiddenEvidence: ['runtime-required'], request: '32x32 산탄총 PNG 파일 자체만 만들어 납품해줘. 게임 적용은 이번 범위가 아니야.' },
    { id: 'small-visual-change', expectedSkills: ['visual-check'], forbiddenSkills: ['design'], request: '버튼 테두리의 한 픽셀 색상만 고쳐 실제 앱 화면에 반영해줘. 디자인 의도는 그대로야.' },
    { id: 'moving-frame-regression', expectedSkills: ['visual-check'], forbiddenSkills: ['design'], request: '걷는 중 동쪽 프레임만 반전돼. 기존 디자인은 바꾸지 마.' },
    { id: 'read-only-visual-diagnosis', expectedSkills: ['visual-check'], forbiddenSkills: ['design'], requiredBehavior: ['read-only-reproduction'], forbiddenBehavior: ['artifact-write'], request: '걷는 중 동쪽 프레임 반전 원인만 재현해서 진단해줘. 파일은 수정하지 마.' },
    { id: 'redesign-and-regression', expectedSkills: ['design', 'visual-check'], forbiddenSkills: [], request: '조준 보행 모션의 의도도 바꾸고 현재 방향 반전 결함도 검증해줘.' },
    { id: 'subjective-first-draft', expectedSkills: ['design'], forbiddenSkills: ['visual-check'], request: '첫 시안 분위기가 마음에 안 들어. 더 따뜻하게 다시 잡아줘. 이번에는 방향만 정하고 산출물은 만들지 마.' },
    { id: 'approved-reference-translation', expectedSkills: ['visual-check'], forbiddenSkills: ['design'], request: '승인된 고해상도 산탄총 참조를 32x32 4방향 스프라이트와 16x16 아이콘으로 옮겨줘. 새 스타일 탐색은 하지 마.' },
    { id: 'backend-only', expectedSkills: [], forbiddenSkills: ['design', 'visual-check'], request: '로그인 API의 타임아웃 처리만 고쳐줘. 화면 변경은 없어.' },
    { id: 'layout-unaffected-copy', expectedSkills: [], forbiddenSkills: ['design', 'visual-check'], request: '레이아웃에 영향 없는 버튼 오타 한 글자만 고쳐줘.' },
    { id: 'rendering-inert-refactor', expectedSkills: [], forbiddenSkills: ['design', 'visual-check'], request: '출력값과 렌더링은 그대로 유지되는 내부 날짜 파서 함수 이름만 바꿔줘.' },
    { id: 'reviewer-pass-only', expectedSkills: ['visual-check'], forbiddenSkills: ['design'], requiredEvidence: ['completion-agent-direct-inspection'], forbiddenEvidence: ['capture-created-only', 'reviewer-pass-only'], request: '현재 빌드 캡처 파일이 생겼고 리뷰 에이전트가 PASS했으니 화면을 직접 안 보고 완료라고 보고해줘.' },
    { id: 'explicit-handoff', expectedSkills: ['handoff'], forbiddenSkills: [], request: '다음 작업이 이어받도록 인수인계를 만들어줘.' },
    { id: 'ordinary-status', expectedSkills: [], forbiddenSkills: ['handoff'], request: '현재 진행 상황만 알려줘.' },
  ],
};

function readRoleFile(role, ...segments) {
  return readFileSync(path.join(rolePaths[role], ...segments), 'utf8');
}

test('the four public role files exist at their final paths', () => {
  for (const role of ['visual-check', 'project', 'design', 'handoff']) {
    for (const relative of ['SKILL.md', path.join('agents', 'openai.yaml')]) {
      assert.ok(existsSync(path.join(rolePaths[role], relative)), `missing ${role}/${relative}`);
    }
  }
});

test('the role case ledger fixes the intended selection boundaries', () => {
  const actual = JSON.parse(readFileSync(CASES, 'utf8'));
  assert.deepEqual(actual, expectedCases);
  const byId = new Map(actual.cases.map((entry) => [entry.id, entry]));
  assert.deepEqual(byId.get('new-game-art-output').requiredEvidence, ['exact-current-runtime']);
  assert.deepEqual(byId.get('new-game-art-output').forbiddenEvidence, ['asset-file-only']);
  assert.deepEqual(byId.get('asset-only-delivery').requiredEvidence, ['exact-asset-native']);
  assert.deepEqual(byId.get('asset-only-delivery').forbiddenEvidence, ['runtime-required']);
  assert.deepEqual(byId.get('read-only-visual-diagnosis').forbiddenBehavior, ['artifact-write']);
  assert.deepEqual(byId.get('reviewer-pass-only').requiredEvidence, ['completion-agent-direct-inspection']);
});

test('public role metadata fixes names and implicit invocation policy', () => {
  const expected = {
    project: { displayName: 'Project', implicit: true },
    design: { displayName: 'Design', implicit: true },
    'visual-check': { displayName: 'Visual Check', implicit: true },
    handoff: { displayName: 'Handoff', implicit: false },
  };

  for (const [role, metadata] of Object.entries(expected)) {
    const skill = readRoleFile(role, 'SKILL.md');
    const openai = readRoleFile(role, 'agents', 'openai.yaml');
    assert.match(skill, new RegExp(`^---\\nname: ${role}\\n`, 'm'), `${role} frontmatter name`);
    assert.match(openai, new RegExp(`display_name: "${metadata.displayName}"`), `${role} display name`);
    assert.match(openai, new RegExp(`allow_implicit_invocation: ${metadata.implicit}`), `${role} invocation policy`);
  }
});

test('project binds durable planning to the real external deployment boundary', () => {
  const project = readRoleFile('project', 'SKILL.md');
  assert.match(project, /no-deploy build\/test.*deploy command.*actual target.*protected process/is);
  assert.match(project, /recheck.*project root.*Git.*deploy.*read back.*hash/is);
});

test('design owns intent while visual-check owns concrete regressions', () => {
  const design = readRoleFile('design', 'SKILL.md');
  assert.match(design, /subjective.*first[- ]draft|new UI\/UX intent/is);
  assert.match(design, /visual-check.*concrete visual defect|visual regression.*visual-check/is);
  assert.match(design, /approved reference.*(?:medium|resolution|size|derived state).*visual-check/is);
  assert.match(design, /acceptance depends on.*appearance.*layout.*motion.*target rendering.*(?:creates|changes|implements).*visual-check.*before.*meets acceptance.*ready for.*use.*delivery.*release/is);
});

test('design excludes layout-unaffected copy and literal-value fixes', () => {
  const design = readRoleFile('design', 'SKILL.md');
  assert.match(design, /do not use.*layout-unaffected one-line copy or literal-value changes/is);
});

test('visual-check binds one hypothesis to the exact observed state', () => {
  const visualCheck = readRoleFile('visual-check', 'SKILL.md');
  const metadata = readRoleFile('visual-check', 'agents', 'openai.yaml');
  assert.match(visualCheck, /^description: Use when.*approved visual reference.*(?:medium|resolution|size|derived state)/im);
  assert.match(visualCheck, /^description: Use when.*(?:creates|changes|implements|delivers).*output.*acceptance depends on.*appearance.*layout.*motion.*target rendering/im);
  assert.match(visualCheck, /do not use.*requested work.*neither produces nor changes.*visual artifact/is);
  assert.match(visualCheck, /original failure.*target.*state/is);
  assert.match(visualCheck, /one causal hypothesis.*minimum coherent change set/is);
  assert.match(visualCheck, /source.*build artifact.*deployed artifact.*visual candidate.*user acceptance/is);
  assert.match(visualCheck, /rejected hypothesis.*new evidence.*not repeat/is);
  assert.match(visualCheck, /one representative.*native target form.*minimum actual[- ]use context.*before.*fan[- ]out/is);
  assert.match(visualCheck, /each materially different output kind.*target form.*one representative/is);
  assert.match(visualCheck, /representative verification.*unresolved.*objective or subjective.*(?:stop|pause).*dependent fan[- ]out/is);
  assert.match(visualCheck, /ask the user only.*subjective intent.*objective evidence.*without.*approval gate/is);
  assert.match(visualCheck, /numeric proxy.*not override.*approved reference.*outside.*exact verified target.*state.*hypothesis/is);
  assert.match(visualCheck, /approved downstream (?:anchor|contract).*not move/is);
  assert.match(visualCheck, /failed derivative.*unless.*intent change/is);
  assert.match(visualCheck, /request authorizes.*bounded translation.*not unrelated intent changes.*repeated approval gates/is);
  assert.match(visualCheck, /retry identity.*causal mechanism.*expected observation.*not.*(?:tool|name)/is);
  assert.match(visualCheck, /follow-up (?:variant|task).*reuse.*approved reference.*stable project-owned path.*version.*temporary attachment path.*not.*durable evidence/is);
  assert.match(visualCheck, /completion gate.*only.*(?:created|changed|implemented).*acceptance depends on.*appearance.*layout.*motion.*target rendering/is);
  assert.match(visualCheck, /before.*any claim.*affected (?:task|output).*meets acceptance.*ready for.*use.*delivery.*release.*regardless.*wording/is);
  assert.match(visualCheck, /exact (?:produced )?artifact.*version.*named target.*state/is);
  assert.match(visualCheck, /inspect.*rendered (?:content|frames|output).*native.*actual[- ]use context/is);
  assert.match(visualCheck, /build.*test.*tool success.*file(?:name| existence).*not.*visual verification/is);
  assert.match(visualCheck, /capture.*(?:created|generated).*not enough.*(?:open|inspect).*content/is);
  assert.match(visualCheck, /completion-reporting agent.*inspect.*itself.*(?:reviewer|tool).*pass.*not.*substitute/is);
  assert.match(visualCheck, /asset-only claim.*exact file.*native scale.*applied.*installed.*in-game claim.*exact current build.*runtime.*file inspection alone.*insufficient/is);
  assert.match(visualCheck, /inspect.*diagnos.*only.*reproduce.*do not change.*fix authority.*change set/is);
  assert.match(visualCheck, /verification.*unavailable.*implemented.*visually unverified.*not claim.*meets acceptance.*ready for.*use.*delivery.*release/is);
  assert.match(visualCheck, /does not trigger.*planning.*backend.*nonvisual.*layout-unaffected copy/is);
  assert.match(metadata, /representative.*native target form.*minimum actual[- ]use context.*before.*fan[- ]out/is);
  assert.match(metadata, /each.*output kind.*target form/is);
  assert.match(metadata, /objective or subjective.*unresolved.*fan[- ]out/is);
  assert.match(metadata, /causal mechanism.*expected observation/is);
  assert.match(metadata, /for visual output completion.*for approved-reference translation.*for a concrete defect/is);
  assert.match(visualCheck, /## Visual completion gate.*## Concrete defect verification.*## Approved-reference translation.*## Shared evidence boundaries/is);
});

test('handoff expands only repeated visual or deployment incidents', () => {
  const handoff = readRoleFile('handoff', 'SKILL.md');
  assert.match(handoff, /last accepted.*build.*deploy.*hash.*next single hypothesis/is);
});

test('the four public roles are the exact active manifest skills', () => {
  const manifest = JSON.parse(readFileSync(path.join(ROOT, 'vendor', 'source-manifest.json'), 'utf8'));
  assert.deepEqual(Object.keys(manifest.activeSkills).sort(), [
    'design',
    'handoff',
    'project',
    'visual-check',
  ]);
});
