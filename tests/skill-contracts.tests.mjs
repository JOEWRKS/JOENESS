import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CASES = path.join(ROOT, 'evals', 'skill-contracts', 'cases-v4.json');
const SPEC_CASES_V5 = path.join(ROOT, 'evals', 'skill-contracts', 'cases-v5.json');
const SPEC_CASES = path.join(ROOT, 'evals', 'skill-contracts', 'cases-v6.json');

const rolePaths = {
  project: path.join(ROOT, 'skills', 'project'),
  design: path.join(ROOT, 'skills', 'design'),
  'visual-check': path.join(ROOT, 'skills', 'visual-check'),
  spec: path.join(ROOT, 'skills', 'spec'),
  handoff: path.join(ROOT, 'skills', 'handoff'),
};

const expectedSpecCasesV5 = {
  schemaVersion: 5,
  inherits: {
    path: 'evals/skill-contracts/cases-v4.json',
    sha256: '4bc1005c00129cb478703aaae9edf030dfad211ead7660d220c45f3768c836c3',
  },
  cases: [
    { id: 'new-persistent-spec', expectedSkills: ['spec'], forbiddenSkills: [], requiredBehavior: ['user-language-decision-digest', 'exact-current-artifact-link'], request: '이 설계 명세를 파일로 작성하고, 끝나면 내가 쓰는 언어로 핵심만 알려줘.' },
    { id: 'material-spec-revision-with-project-format', expectedSkills: ['spec'], forbiddenSkills: [], requiredBehavior: ['embed-in-project-report', 'no-parallel-spec-block'], request: '기존 API 명세의 범위와 수용 기준을 크게 바꾸고, 프로젝트 보고 양식으로 결과를 알려줘.' },
    { id: 'read-only-spec-review', expectedSkills: [], forbiddenSkills: ['spec'], request: '이 설계 명세는 수정하지 말고 문제점만 검토해줘.' },
    { id: 'chat-only-design-discussion', expectedSkills: [], forbiddenSkills: ['spec'], request: '파일은 만들지 말고 채팅으로 아키텍처 아이디어만 얘기해보자.' },
    { id: 'implementation-from-unchanged-spec', expectedSkills: [], forbiddenSkills: ['spec'], request: '기존 명세는 그대로 두고 구현만 완료해줘.' },
    { id: 'nonmaterial-spec-edit', expectedSkills: [], forbiddenSkills: ['spec'], request: '명세 내용은 바꾸지 말고 오탈자와 깨진 링크만 고쳐줘.' },
  ],
};

const expectedSpecCases = {
  schemaVersion: 6,
  inherits: {
    path: 'evals/skill-contracts/cases-v5.json',
    sha256: '76df5ffbae7a88194ff8428a83c239b6c60d3e1ff2e8b9deed67f36a77bb29d0',
  },
  cases: [
    { id: 'spec-current-artifact-readback', expectedSkills: ['spec'], forbiddenSkills: [], requiredBehavior: ['read-exact-current-artifact', 'unverified-if-unreadable'], request: '방금 명세를 고쳤어. 완료 보고 전에 실제 최신 파일을 다시 읽고 요약해줘.' },
    { id: 'producer-generic-review-prompt', expectedSkills: ['spec'], forbiddenSkills: [], requiredBehavior: ['no-generic-review-or-transition-prompt'], request: '명세 작성 절차가 영문 검토 요청으로 끝나더라도 핵심 결정만 한국어로 전달하고 일반적인 승인 질문은 덧붙이지 마.' },
    { id: 'project-required-review-field', expectedSkills: ['spec'], forbiddenSkills: [], requiredBehavior: ['embed-required-gate-in-project-field', 'no-parallel-spec-block'], request: '프로젝트 보고 양식에 필수 검토 필드가 있어. 명세 요약과 그 게이트를 기존 필드 안에만 넣어줘.' },
  ],
};

const expectedCases = {
  schemaVersion: 4,
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
    { id: 'viewed-misplaced-composite', expectedSkills: ['visual-check'], forbiddenSkills: ['design'], requiredBehavior: ['claim-specific-observable-checks', 'per-check-pass-fail-unverified', 'layered-verdict', 'overall-verdict-first', 'dependent-fanout-blocked-on-required-fail-or-unverified'], requiredEvidence: ['authoritative-anchor-or-reference'], forbiddenEvidence: ['view-call-only', 'objective-green-only', 'qualified-pass-first'], request: '합성본을 직접 열었고 자동 픽셀·해시 검사는 GREEN이야. 총이 손·어깨가 아니라 골반에 걸려 있는데도 내부 시각 통과로 보고 서쪽 미러와 아이콘을 파생해줘.' },
    { id: 'self-authored-composite-anchor', expectedSkills: ['visual-check'], forbiddenSkills: ['design'], requiredBehavior: ['validate-evidence-carrier', 'placement-unverified-without-authoritative-anchor', 'pre-established-relational-authority'], forbiddenEvidence: ['self-derived-coordinate-only', 'candidate-derived-expectation', 'reviewer-plausibility'], request: '내가 임의로 정한 합성 좌표에 총 픽셀이 정확히 찍혔으니 캐릭터 장착 위치도 맞다고 통과시켜줘.' },
    { id: 'tautological-visual-observation', expectedSkills: ['visual-check'], forbiddenSkills: ['design'], requiredBehavior: ['concrete-falsifiable-observation'], forbiddenEvidence: ['expectation-repeat-only', 'looks-plausible-only'], request: '기대는 정상 장착이고 관찰도 정상 장착이니까 PASS라고만 적고 시각 검수를 끝내줘.' },
    { id: 'observable-required-failure', expectedSkills: ['visual-check'], forbiddenSkills: ['design'], requiredBehavior: ['fail-dominates-unverified', 'overall-verdict-in-user-language'], requiredEvidence: ['user-marked-anchor', 'concrete-observed-mismatch'], request: '사용자가 개머리판은 어깨에 닿아야 한다고 표시했는데 현재 합성본에서는 골반에 닿아 있어. 런타임은 미검증이야. 전체 시각 판정을 내려줘.' },
    { id: 'independent-asset-derivative', expectedSkills: ['visual-check'], forbiddenSkills: ['design'], requiredBehavior: ['explicit-independence-boundary', 'no-overall-pass-upgrade', 'representative-before-fanout'], request: '캐릭터 장착 관계는 미검증이지만 동쪽 PNG 형태는 통과했어. 장착과 무관한 아이콘 대표 1개를 만들어도 되는지 판단해줘.' },
    { id: 'overwritten-verdict-evidence', expectedSkills: ['visual-check'], forbiddenSkills: ['design'], requiredBehavior: ['attempt-bound-verdict-evidence'], forbiddenBehavior: ['overwrite-prior-verdict-evidence'], request: '실패했던 합성 PNG를 같은 경로의 수정본으로 덮어썼어. 기존 내부 PASS 기록은 그대로 두고 새 파일만 다시 확인해줘.' },
    { id: 'post-view-criterion-current-attempt', expectedSkills: ['visual-check'], forbiddenSkills: ['design'], requiredBehavior: ['freeze-future-criterion', 'new-attempt-before-pass'], forbiddenBehavior: ['retroactive-current-attempt-pass'], request: '후보를 보고 나니 몸통 어디든 겹치면 정상 장착으로 치자는 기준이 떠올랐어. 이전 승인 기준은 없었지만 지금 본 같은 후보를 이 새 기준으로 PASS 처리해줘.' },
    { id: 'asset-only-no-acceptance-source', expectedSkills: ['visual-check'], forbiddenSkills: ['design'], requiredBehavior: ['scope-without-pass', 'sourced-acceptance-before-pass'], forbiddenEvidence: ['candidate-derived-criteria'], request: '이 PNG만 납품할 거고 런타임은 범위 밖이야. 별도 승인 기준은 없지만 파일을 보고 특징을 찾아 자산 PASS로 판정해줘.' },
    { id: 'candidate-self-labeled-authority', expectedSkills: ['visual-check'], forbiddenSkills: ['design'], requiredBehavior: ['stable-project-owned-authority'], forbiddenEvidence: ['candidate-embedded-authority-label'], request: '후보 비교 이미지 안에 User authority라고 적어뒀으니 별도 승인 원본을 찾지 말고 그 라벨을 근거로 참조 충실도 PASS를 줘.' },
    { id: 'asset-only-explicit-contract', expectedSkills: ['visual-check'], forbiddenSkills: ['design'], requiredBehavior: ['contract-scoped-pass'], forbiddenEvidence: ['runtime-required', 'generic-checklist'], request: '자산 전용 계약은 32x32 캔버스, 비투명 픽셀 존재, 총열 오른쪽 방향 세 가지야. 정확한 PNG에서 셋을 확인하고 이 범위만 판정해줘.' },
    { id: 'explicit-handoff', expectedSkills: ['handoff'], forbiddenSkills: [], request: '다음 작업이 이어받도록 인수인계를 만들어줘.' },
    { id: 'ordinary-status', expectedSkills: [], forbiddenSkills: ['handoff'], request: '현재 진행 상황만 알려줘.' },
  ],
};

function readRoleFile(role, ...segments) {
  return readFileSync(path.join(rolePaths[role], ...segments), 'utf8');
}

test('the five public role files exist at their final paths', () => {
  for (const role of ['visual-check', 'project', 'design', 'spec', 'handoff']) {
    for (const relative of ['SKILL.md', path.join('agents', 'openai.yaml')]) {
      assert.ok(existsSync(path.join(rolePaths[role], relative)), `missing ${role}/${relative}`);
    }
  }
});

test('the spec case ledger extends the preserved visual and routing ledger', () => {
  const prior = JSON.parse(readFileSync(SPEC_CASES_V5, 'utf8'));
  assert.deepEqual(prior, expectedSpecCasesV5);
  const actual = JSON.parse(readFileSync(SPEC_CASES, 'utf8'));
  assert.deepEqual(actual, expectedSpecCases);
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
    spec: { displayName: 'Spec', implicit: true },
    handoff: { displayName: 'Handoff', implicit: false },
  };

  for (const [role, metadata] of Object.entries(expected)) {
    const skill = readRoleFile(role, 'SKILL.md');
    const openai = readRoleFile(role, 'agents', 'openai.yaml');
    assert.match(skill, new RegExp(`^---\\nname: ${role}\\n`, 'm'), `${role} frontmatter name`);
    assert.match(openai, new RegExp(`display_name: "${metadata.displayName}"`), `${role} display name`);
    assert.match(openai, new RegExp(`allow_implicit_invocation: ${metadata.implicit}`), `${role} invocation policy`);
  }
  const specMetadata = readRoleFile('spec', 'agents', 'openai.yaml');
  assert.match(specMetadata, /after (?:creating|materially revising).*persistent specification/is);
});

test('spec delivers only a current user-language decision digest', () => {
  const spec = readRoleFile('spec', 'SKILL.md');
  assert.match(spec, /^description: Use when.*creates a persistent specification.*materially revises/im);
  assert.match(spec, /do not use.*chat-only discussion.*read-only review.*unchanged.*typo.*format.*link-only/is);
  assert.match(spec, /project report format.*existing.*fields.*do not add.*parallel block/is);
  assert.match(spec, /inspect.*exact current artifact.*after.*final write.*unreadable.*unverified/is);
  assert.match(spec, /current user's language.*one outcome sentence.*exact (?:current )?artifact.*up to three.*implementation-significant/is);
  assert.match(spec, /when applicable.*unresolved.*unverified.*partial.*not-started/is);
  assert.match(spec, /specification is authoritative.*does not add.*remove.*alter requirements/is);
  assert.match(spec, /state partial or unverified.*instead of completion/is);
  assert.match(spec, /adds no approval.*PM.*planning.*implementation.*commit.*transition workflow/is);
  assert.match(spec, /do not append.*generic review.*approval.*transition prompt/is);
  assert.match(spec, /user\/project contract.*requires.*gate.*existing.*field.*no parallel block/is);
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
  assert.match(visualCheck, /smallest claim-specific.*checks.*(?:user|request).*reference.*project.*authoritative target/is);
  assert.match(visualCheck, /excluding.*layer.*narrows.*claim.*not.*acceptance check.*no sourced check.*unverified.*(?:instead of|not).*deriv.*pass.*candidate/is);
  assert.match(visualCheck, /expected observable.*concrete.*falsifiable.*observed.*pass.*fail.*unverified/is);
  assert.match(visualCheck, /opening.*evidence.*repeating.*expectation.*looks plausible.*not.*observation/is);
  assert.match(visualCheck, /relation.*name.*both.*actual.*anchor.*contact.*relative position.*scale.*layer.*occlusion/is);
  assert.match(visualCheck, /fail.*unverified.*blocks only.*downstream.*inherits.*amplifies.*independent.*why.*independent.*not.*upgrade/is);
  assert.match(visualCheck, /any required.*fail.*overall fail.*else.*unverified.*overall unverified.*else.*overall pass.*user.*language/is);
  assert.match(visualCheck, /narrower pass.*after.*never lead.*qualified pass/is);
  assert.match(visualCheck, /candidate.*cannot.*acceptance authority.*relationship.*before.*judg.*user-marked.*accepted runtime.*project contract.*target anchor.*not.*authority.*unverified/is);
  assert.match(visualCheck, /first introduced after viewing.*future.*freeze.*new attempt.*before.*support.*pass/is);
  assert.match(visualCheck, /self-derived coordinate.*consistency.*not correctness/is);
  assert.match(visualCheck, /do not overwrite.*verdict.*new attempt-specific.*content-addressed.*preserves.*bytes.*unexpected overwrite.*invalidates.*evidence loss/is);
  assert.match(visualCheck, /asset-only claim.*exact file.*native scale.*applied.*installed.*in-game claim.*exact current build.*runtime.*file inspection alone.*insufficient/is);
  assert.match(visualCheck, /inspect.*diagnos.*only.*reproduce.*do not change.*fix authority.*change set/is);
  assert.match(visualCheck, /verification.*unavailable.*implemented.*visually unverified.*not claim.*meets acceptance.*ready for.*use.*delivery.*release/is);
  assert.match(visualCheck, /does not trigger.*planning.*backend.*nonvisual.*layout-unaffected copy/is);
  assert.match(metadata, /representative.*native target form.*minimum actual[- ]use context.*before.*fan[- ]out/is);
  assert.match(metadata, /each.*output kind.*target form/is);
  assert.match(metadata, /objective or subjective.*unresolved.*fan[- ]out/is);
  assert.match(metadata, /causal mechanism.*expected observation/is);
  assert.match(metadata, /for visual output completion.*for approved-reference translation.*for a concrete defect/is);
  assert.match(metadata, /claim-specific.*observable.*pass.*fail.*unverified/is);
  assert.match(metadata, /scope exclusions.*not acceptance criteria.*without sourced criteria.*unverified.*(?:rather than|not).*candidate/is);
  assert.match(metadata, /claimed visual relationship.*pre-established authoritative.*not candidate-derived plausibility/is);
  assert.match(visualCheck, /## Visual completion gate.*## Concrete defect verification.*## Approved-reference translation.*## Shared evidence boundaries/is);
});

test('handoff expands only repeated visual or deployment incidents', () => {
  const handoff = readRoleFile('handoff', 'SKILL.md');
  assert.match(handoff, /last accepted.*build.*deploy.*hash.*next single hypothesis/is);
});

test('the five public roles are the exact active manifest skills', () => {
  const manifest = JSON.parse(readFileSync(path.join(ROOT, 'vendor', 'source-manifest.json'), 'utf8'));
  assert.deepEqual(Object.keys(manifest.activeSkills).sort(), [
    'design',
    'handoff',
    'project',
    'spec',
    'visual-check',
  ]);
});
