import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CASES = path.join(ROOT, 'evals', 'skill-contracts', 'cases.json');

const rolePaths = {
  project: path.join(ROOT, 'skills', 'project'),
  design: path.join(ROOT, 'skills', 'design'),
  'visual-check': path.join(ROOT, 'skills', 'visual-check'),
  handoff: path.join(ROOT, 'skills', 'handoff'),
};

const expectedCases = {
  schemaVersion: 1,
  cases: [
    { id: 'long-project-no-ledger', expectedSkills: ['project'], forbiddenSkills: [], request: '여러 출시 단계가 있는 새 앱 프로젝트를 시작할 거야. 아직 계획 원장은 없어.' },
    { id: 'small-fix', expectedSkills: [], forbiddenSkills: ['project'], request: '오타 한 글자만 고쳐줘.' },
    { id: 'new-login-ui', expectedSkills: ['design'], forbiddenSkills: ['visual-check'], request: '새 로그인 화면의 UI와 반응형 동작을 설계해줘.' },
    { id: 'moving-frame-regression', expectedSkills: ['visual-check'], forbiddenSkills: ['design'], request: '걷는 중 동쪽 프레임만 반전돼. 기존 디자인은 바꾸지 마.' },
    { id: 'redesign-and-regression', expectedSkills: ['design', 'visual-check'], forbiddenSkills: [], request: '조준 보행 모션의 의도도 바꾸고 현재 방향 반전 결함도 검증해줘.' },
    { id: 'subjective-first-draft', expectedSkills: ['design'], forbiddenSkills: ['visual-check'], request: '첫 시안 분위기가 마음에 안 들어. 더 따뜻하게 다시 잡아줘.' },
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
  assert.deepEqual(JSON.parse(readFileSync(CASES, 'utf8')), expectedCases);
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
});

test('design excludes layout-unaffected copy and literal-value fixes', () => {
  const design = readRoleFile('design', 'SKILL.md');
  assert.match(design, /do not use.*layout-unaffected one-line copy or literal-value changes/is);
});

test('visual-check binds one hypothesis to the exact observed state', () => {
  const visualCheck = readRoleFile('visual-check', 'SKILL.md');
  assert.match(visualCheck, /original failure.*target.*state/is);
  assert.match(visualCheck, /one causal hypothesis.*minimum coherent change set/is);
  assert.match(visualCheck, /source.*build artifact.*deployed artifact.*visual candidate.*user acceptance/is);
  assert.match(visualCheck, /rejected hypothesis.*new evidence.*not repeat/is);
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
