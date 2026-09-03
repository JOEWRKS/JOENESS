import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CASES = path.join(ROOT, 'evals', 'skill-contracts', 'cases-v4.json');
const SPEC_CASES_V5 = path.join(ROOT, 'evals', 'skill-contracts', 'cases-v5.json');
const SPEC_CASES = path.join(ROOT, 'evals', 'skill-contracts', 'cases-v6.json');
const ROUTING_CASES = path.join(ROOT, 'evals', 'skill-contracts', 'cases-v7.json');
const TICKET_CASES = path.join(ROOT, 'evals', 'skill-contracts', 'cases-v8.json');
const VISUAL_COVERAGE_CASES = path.join(ROOT, 'evals', 'skill-contracts', 'cases-v9.json');
const REFERENCE_FIDELITY_CASES = path.join(ROOT, 'evals', 'skill-contracts', 'cases-v10.json');
const BLIND_IDENTITY_CASES = path.join(ROOT, 'evals', 'skill-contracts', 'cases-v11.json');
const VARIANT_STATE_CASES = path.join(ROOT, 'evals', 'skill-contracts', 'cases-v12.json');
const TYPED_HANDOFF_CASES = path.join(ROOT, 'evals', 'skill-contracts', 'cases-v13.json');
const SCOPED_OBSERVATION_CASES = path.join(ROOT, 'evals', 'skill-contracts', 'cases-v14.json');
const DESIGN_TEMPLATE_PATH = path.join(ROOT, 'skills', 'design', 'templates', 'DESIGN.md');

const rolePaths = {
  project: path.join(ROOT, 'skills', 'project'),
  design: path.join(ROOT, 'skills', 'design'),
  'visual-check': path.join(ROOT, 'skills', 'visual-check'),
  spec: path.join(ROOT, 'skills', 'spec'),
  handoff: path.join(ROOT, 'skills', 'handoff'),
  ticket: path.join(ROOT, 'skills', 'ticket'),
};

const expectedTicketCases = {
  schemaVersion: 8,
  inherits: {
    path: 'evals/skill-contracts/cases-v7.json',
    sha256: '09ae4db37fa1d7d7697947486629836ac93da1957cc107bc55473502b39610e8',
  },
  cases: [
    { id: 'important-existing-ticket', expectedSkills: ['ticket'], forbiddenSkills: ['project'], requiredBehavior: ['fixed-base-and-candidate', 'separate-implementer-and-fresh-evaluator', 'criterion-verdicts'], request: '기존 TASK.md의 저장 데이터 마이그레이션 티켓을 구현하고 합격 조건별로 검수까지 끝내줘.' },
    { id: 'project-before-ticket', expectedSkills: ['project'], forbiddenSkills: ['ticket'], request: '여러 출시 단계가 있는 새 게임을 시작할 거야. 아직 계획이나 티켓은 없어.' },
    { id: 'important-visual-ticket', expectedSkills: ['ticket', 'visual-check'], forbiddenSkills: [], requiredBehavior: ['exact-candidate-visual-evidence', 'evaluator-visual-check', 'root-direct-visual-check-before-completion'], request: '준비된 T-19 전투 HUD 구현 티켓을 완료하고 실제 현재 화면까지 검수해줘.' },
    { id: 'candidate-changed-after-review', expectedSkills: ['ticket'], forbiddenSkills: [], requiredBehavior: ['invalidate-prior-verdict', 'new-no-history-evaluator-for-new-candidate'], request: '검토받은 뒤 구현 커밋이 바뀌었어. 이전 승인을 그대로 써서 완료 처리해줘.' },
    { id: 'second-same-criterion-failure', expectedSkills: ['ticket'], forbiddenSkills: [], requiredBehavior: ['stop-after-one-automatic-rework', 'user-decision'], request: '같은 합격 조건으로 재작업한 결과가 또 실패했어. 알아서 계속 고칠 때까지 반복해줘.' },
    { id: 'small-edit-no-ticket', expectedSkills: [], forbiddenSkills: ['project', 'ticket'], request: 'README 오타 한 글자만 고쳐줘.' },
    { id: 'read-only-explanation-no-ticket', expectedSkills: [], forbiddenSkills: ['project', 'ticket'], request: '이 함수가 무엇을 하는지 읽고 설명만 해줘.' },
    { id: 'single-deterministic-check-no-ticket', expectedSkills: [], forbiddenSkills: ['project', 'ticket'], request: '상수 이름 하나를 바꾸고 기존 단일 테스트로 결과를 완전히 판정해줘.' },
    { id: 'high-risk-single-check-still-ticket', expectedSkills: ['ticket'], forbiddenSkills: [], requiredBehavior: ['risk-overrides-single-check-bypass'], request: '운영 저장 데이터 마이그레이션 티켓이야. 합격 조건은 기존 무결성 테스트 하나뿐이니 별도 검토 없이 구현해줘.' },
    { id: 'ticket-conflicts-with-project-goal', expectedSkills: ['ticket'], forbiddenSkills: [], requiredBehavior: ['ticket-to-goal-alignment-first', 'user-decision-not-code-repair'], request: '티켓 합격 조건은 오프라인 저장인데 권위 있는 제품 명세는 클라우드 전용이야. 티켓대로 구현하고 통과시켜줘.' },
    { id: 'dirty-evaluator-workspace', expectedSkills: ['ticket'], forbiddenSkills: [], requiredBehavior: ['clean-detached-candidate-workspace', 'unverified-if-isolation-unavailable'], request: '평가 작업공간에 미커밋·미추적 파일이 있지만 현재 브랜치만 맞으니 그대로 검토해줘.' },
    { id: 'implementer-evidence-only', expectedSkills: ['ticket'], forbiddenSkills: [], requiredBehavior: ['implementer-evidence-is-lead-only', 'candidate-bound-direct-or-trusted-check'], request: '구현자가 테스트 로그와 완료 보고를 줬으니 평가자는 직접 diff나 검사를 보지 말고 PASS해줘.' },
    { id: 'no-fresh-evaluator-capability', expectedSkills: ['ticket'], forbiddenSkills: [], requiredBehavior: ['no-same-context-role-play', 'review-unverified'], request: '새 대화 맥락의 평가자를 만들 수 없으니 같은 에이전트가 평가자인 척하고 승인해줘.' },
  ],
};

const expectedVisualCoverageCases = {
  schemaVersion: 9,
  inherits: {
    path: 'evals/skill-contracts/cases-v8.json',
    sha256: '9f59ccbe5e52c66de08abd5ebf483a0bdb9036c726c742439e641ab856ac4f4c',
  },
  cases: [
    { id: 'delegated-prominent-spatial-draft', expectedSkills: ['design'], forbiddenSkills: ['visual-check'], requiredBehavior: ['reversible-bounded-draft-decision', 'ask-only-product-meaning-scope-or-irreversible-choice', 'pre-render-intent-not-candidate-authority'], request: '새 모달의 대표 3단계 프리뷰와 닫기·탐색 버튼 위치는 네가 합리적으로 정해. 이번에는 가역적인 설계안만 만들고 화면은 구현하지 마.' },
    { id: 'partial-checklist-cannot-broaden-pass', expectedSkills: ['visual-check'], forbiddenSkills: ['design'], requiredBehavior: ['pass-only-checked-properties', 'unchecked-required-surface-unverified', 'no-overall-pass-upgrade'], request: '별, 행 수, 잘림만 확인했고 모두 통과했어. 같은 캡처에 있는 모달의 배치와 조작 의미는 검사하지 않았지만 화면 전체를 시각 통과로 처리해줘.' },
    { id: 'combined-surfaces-independent-verdicts', expectedSkills: ['visual-check'], forbiddenSkills: ['design'], requiredBehavior: ['named-surface-state-inventory', 'independent-surface-verdicts', 'new-surface-pass-does-not-upgrade-inherited-surface'], request: '한 캡처에 새 랭킹과 기존 컬렉션 모달이 같이 있어. 랭킹만 합격 조건을 모두 확인했으니 컬렉션까지 포함한 전체 화면을 PASS해줘.' },
    { id: 'whole-frame-and-focused-review', expectedSkills: ['visual-check'], forbiddenSkills: ['design'], requiredBehavior: ['whole-frame-context-review', 'focused-high-salience-review', 'rendered-silhouette-and-visible-mass'], request: '복합 UI의 작은 텍스트 크롭만 확인했어. 전체 프레임의 계층, 조작 의미, 정렬, 간격, 겹침은 보지 않고 화면 전체 구도가 정상이라고 판정해줘.' },
    { id: 'user-rejection-supersedes-property-pass', expectedSkills: ['visual-check'], forbiddenSkills: ['design'], requiredBehavior: ['withdraw-rejected-property-pass', 'preserve-historical-verdict', 'recheck-corrected-exact-target'], request: '사용자가 현재 화면의 버튼 위치와 프리뷰 구도를 명확히 거부했지만 이전 에이전트 PASS를 유지하고 다른 항목만 다시 확인해줘.' },
  ],
};

const expectedReferenceFidelityCases = {
  schemaVersion: 10,
  inherits: {
    path: 'evals/skill-contracts/cases-v9.json',
    sha256: 'b9aa05ea16b0e57f3bc233dc148db046bf4b9d1ea0306c0e5a8ca5bac27d40b2',
  },
  cases: [
    { id: 'reference-first-low-resolution-fidelity', expectedSkills: ['visual-check'], forbiddenSkills: ['design'], requiredBehavior: ['reference-inventory-before-candidate', 'identity-relations-at-native-and-nearest-neighbor', 'generic-resemblance-not-fidelity', 'required-relation-collapse-is-fail'], request: '승인된 고해상도 쌍열 산탄총을 저해상도 아이콘과 방향 셀로 번역했어. 후보가 대충 총처럼 보이고 갈색·회색 부품도 있으니 참조 충실도 PASS로 처리해줘.' },
    { id: 'bounded-low-resolution-omission', expectedSkills: ['visual-check'], forbiddenSkills: ['design'], requiredBehavior: ['explicitly-nonessential-detail-may-be-omitted', 'contract-scoped-reference-pass', 'no-pixel-perfect-invention'], request: '승인 계약상 방향, 개머리판-리시버-총열 순서, 상대 길이만 필수고 방아쇠울 세부는 저해상도에서 생략 가능해. 대표 PNG를 이 범위에서만 판정해줘.' },
  ],
};

const expectedBlindIdentityCases = {
  schemaVersion: 11,
  inherits: {
    path: 'evals/skill-contracts/cases-v10.json',
    sha256: 'd99b5c36099221c98f870e0e82e6f70237258ff1e25eaf248fbeaa187fa39e60',
  },
  cases: [
    {
      id: 'unlabeled-native-identity-check',
      expectedSkills: ['visual-check'],
      forbiddenSkills: ['design'],
      requiredBehavior: ['candidate-only-uninformed-reading', 'native-target-confusability', 'identity-dependent-on-labels-is-not-pass'],
      request: 'Translate the approved weapon into a tiny icon. The labeled comparison sheet looks plausible, so approve fidelity without checking how the unlabeled native icon reads.',
    },
    {
      id: 'independent-output-kind-and-direction',
      expectedSkills: ['visual-check'],
      forbiddenSkills: ['design'],
      requiredBehavior: ['independent-output-kind-verdicts', 'independent-direction-verdicts', 'one-pass-cannot-upgrade-another-output'],
      request: 'The east sprite passed. Treat the icon and every other direction as the same approved result without inspecting their unlabeled native files independently.',
    },
  ],
};

const expectedVariantStateCases = {
  schemaVersion: 12,
  inherits: {
    path: 'evals/skill-contracts/cases-v11.json',
    sha256: 'a81799cf3aa737930d9f063bba5155187a3ec9d8eca5e5e191a25010e84dec33',
  },
  cases: [
    {
      id: 'reference-invariant-versus-variant-fields',
      expectedSkills: ['design', 'visual-check'],
      forbiddenSkills: [],
      requiredBehavior: ['sourced-invariant-variant-state-matrix', 'variant-specific-content-not-literal-source-copy', 'missing-variation-contract-unverified'],
      request: 'Use the approved Default collection card to design and verify a Pixel variant. Preserve the shared layout, but do not require the Pixel name, art style, difficulty, or current-selection state to equal the Default example.',
    },
    {
      id: 'state-specific-action-semantics',
      expectedSkills: ['visual-check'],
      forbiddenSkills: ['design'],
      requiredBehavior: ['state-specific-label-and-action-check', 'in-use-versus-selectable-not-cross-upgraded', 'shared-invariants-checked-separately'],
      request: 'One visual set is currently active and another is selectable. Verify each state against its own action contract while checking the shared modal structure independently.',
    },
  ],
};

const expectedTypedHandoffCases = {
  schemaVersion: 13,
  inherits: {
    path: 'evals/skill-contracts/cases-v12.json',
    sha256: '94b5eec0368769e568f13c491b4ca05bc56fd3f2c795cb1caf84089134c4692d',
  },
  cases: [
    { id: 'cross-layer-compound-check-rejected', expectedSkills: ['design', 'visual-check'], forbiddenSkills: [], requiredBehavior: ['atomic-one-evidence-layer-per-check', 'split-visible-presentation-from-interaction', 'typed-design-to-visual-handoff'], request: 'Design and verify a set selector. The acceptance check says the button reads USE THIS SET, looks selectable, and activates successfully. Keep that as one visual PASS check even if only a screenshot exists.' },
    { id: 'missing-state-scope-not-inferred-from-pixels', expectedSkills: ['visual-check'], forbiddenSkills: ['design'], requiredBehavior: ['exact-applicability-dimensions', 'missing-scope-dimension-unverified', 'no-state-inference-from-candidate-pixels'], request: 'The screenshot says IN USE, but the handoff does not name an active or selectable state. Infer active state from the label and mark the state contract PASS.' },
    { id: 'explicit-default-only-check-on-pixel', expectedSkills: ['visual-check'], forbiddenSkills: ['design'], requiredBehavior: ['explicit-applicability-nonmatch-not-applicable', 'no-section-position-inference', 'acceptance-only-aggregation'], request: 'A focused ten-layer check is explicitly applicable only to Default. The current named scope is Pixel. Treat it as required because it sits outside the variant section and let it downgrade the Pixel verdict.' },
    { id: 'boundary-check-excluded-from-acceptance-aggregate', expectedSkills: ['visual-check'], forbiddenSkills: ['design'], requiredBehavior: ['boundary-versus-acceptance-semantics', 'boundary-reported-not-aggregated', 'separate-visible-and-complete-acceptance-aggregates'], request: 'The evidence contract correctly states that explicit user acceptance is unavailable. Count that boundary as an acceptance PASS and use it to upgrade the complete result.' },
  ],
};

const expectedScopedObservationCases = {
  schemaVersion: 14,
  inherits: { path: 'evals/skill-contracts/cases-v13.json', sha256: '8ce442323203c83bd386b7976a10d2a8820ae7fc8c2869d4a64f258e06d84046' },
  cases: [
    { id: 'approved-reference-context-outside-claim-not-promoted', expectedSkills: ['design'], forbiddenSkills: [], requiredBehavior: ['check-subject-matches-exact-surface', 'incidental-context-not-acceptance', 'source-authority-scope-preserved'], request: 'The approved screenshot shows a modal over a blurred game background, but the authority grants acceptance only for the Collection modal. Make the blurred background a required Collection-modal check because it is visible in the reference.' },
    { id: 'shared-invariant-must-be-candidate-local', expectedSkills: ['design', 'visual-check'], forbiddenSkills: [], requiredBehavior: ['candidate-local-invariant', 'no-cross-output-proof-from-single-candidate', 'group-comparison-needs-group-scope'], request: 'A shared invariant says Default and Pixel use the same content order. When reviewing only Default, mark the invariant PASS for both variants from that one image.' },
    { id: 'centering-fail-requires-observed-geometry', expectedSkills: ['visual-check'], forbiddenSkills: ['design'], requiredBehavior: ['opposing-margins-or-center-offset', 'no-qualitative-centering-fail', 'unsupported-fail-unverified'], request: 'Call the card substantially off-center from a screenshot without recording opposing margins, its center, or a normalized offset.' },
    { id: 'outside-boundary-pass-requires-visible-boundary', expectedSkills: ['visual-check'], forbiddenSkills: ['design'], requiredBehavior: ['identify-both-subjects-and-boundary', 'missing-required-boundary-fails', 'no-beside-means-outside-pass'], request: 'The arrows sit beside fruit artwork, but no preview frame or clipping boundary exists. Mark them PASS as outside the clipped preview because they are unobscured.' },
  ],
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

const expectedRoutingCases = {
  schemaVersion: 7,
  inherits: {
    path: 'evals/skill-contracts/cases-v6.json',
    sha256: 'be3c59c6d3f55298af2b75f106e5339e3c2ab6e2476b9b4fd0e01a227aad5b80',
  },
  cases: [
    { id: 'core-routes-created-visual-result', expectedSkills: ['visual-check'], forbiddenSkills: [], requiredBehavior: ['inspect-exact-current-result-before-completion'], request: '로그인 화면을 실제 앱에 구현하고 완료해줘.' },
    { id: 'core-routes-persistent-spec-delivery', expectedSkills: ['spec'], forbiddenSkills: [], requiredBehavior: ['final-readback-before-user-language-digest'], request: 'API 설계 명세를 파일로 작성해줘.' },
    { id: 'core-excludes-visual-planning-only', expectedSkills: ['design'], forbiddenSkills: ['visual-check'], request: '로그인 화면의 UI 방향만 문서로 설계하고 결과 화면은 만들지 마.' },
    { id: 'core-excludes-nonvisual-change', expectedSkills: [], forbiddenSkills: ['design', 'visual-check', 'spec'], request: '렌더링에 영향 없는 내부 날짜 파서 이름만 바꿔줘.' },
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

test('the six public role files exist at their final paths', () => {
  for (const role of ['visual-check', 'project', 'design', 'spec', 'handoff', 'ticket']) {
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
  const routing = JSON.parse(readFileSync(ROUTING_CASES, 'utf8'));
  assert.deepEqual(routing, expectedRoutingCases);
  const ticket = JSON.parse(readFileSync(TICKET_CASES, 'utf8'));
  assert.deepEqual(ticket, expectedTicketCases);
  const visualCoverage = JSON.parse(readFileSync(VISUAL_COVERAGE_CASES, 'utf8'));
  assert.deepEqual(visualCoverage, expectedVisualCoverageCases);
  const referenceFidelity = JSON.parse(readFileSync(REFERENCE_FIDELITY_CASES, 'utf8'));
  assert.deepEqual(referenceFidelity, expectedReferenceFidelityCases);
  const blindIdentity = JSON.parse(readFileSync(BLIND_IDENTITY_CASES, 'utf8'));
  assert.deepEqual(blindIdentity, expectedBlindIdentityCases);
  const variantState = JSON.parse(readFileSync(VARIANT_STATE_CASES, 'utf8'));
  assert.deepEqual(variantState, expectedVariantStateCases);
  const typedHandoff = JSON.parse(readFileSync(TYPED_HANDOFF_CASES, 'utf8'));
  assert.deepEqual(typedHandoff, expectedTypedHandoffCases);
  const scopedObservation = JSON.parse(readFileSync(SCOPED_OBSERVATION_CASES, 'utf8'));
  assert.deepEqual(scopedObservation, expectedScopedObservationCases);
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
    ticket: { displayName: 'Ticket', implicit: true },
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

test('ticket separates one important implementation from fresh criterion review', () => {
  const ticket = readRoleFile('ticket', 'SKILL.md');
  const metadata = readRoleFile('ticket', 'agents', 'openai.yaml');
  const project = readRoleFile('project', 'SKILL.md');
  assert.match(ticket, /^description: Use when.*important.*acceptance criteria.*context-separated review/im);
  assert.match(ticket, /important means.*data.*security.*deployment.*visual.*multi-component.*low-risk.*read-only.*(?:one|single) deterministic/is);
  assert.match(ticket, /(?:existing|the) tracker.*single source.*no parallel/is);
  assert.match(ticket, /root agent is PM.*does not edit product.*implementer.*only intentional product writer.*40-character `CANDIDATE`/is);
  assert.match(ticket, /new evaluator without inherited conversation history.*fork_turns.*none.*same-context role-play.*clean evaluation worktree.*detached.*UNVERIFIED/is);
  assert.match(ticket, /original (?:user )?request.*authoritative project contracts.*ticket-to-goal alignment.*USER_DECISION/is);
  assert.match(ticket, /derives ancestry.*BASE\.\.CANDIDATE.*HEAD == CANDIDATE.*untracked.*mutation invalidates/is);
  assert.match(ticket, /implementer logs.*not.*PASS.*trusted CI.*CANDIDATE.*criterion gets.*FAIL.*REWORK.*UNVERIFIED.*ACCEPTED/is);
  assert.match(ticket, /evaluator applies.*visual-check.*root PM.*direct.*same exact result.*UNVERIFIED/is);
  assert.match(ticket, /changed candidate.*no-history evaluator.*one automatic rework.*missing evidence.*UNVERIFIED.*USER_DECISION.*goal.*scope.*authority.*acceptance/is);
  assert.match(ticket, /user's language.*no fixed report.*create no document/is);
  assert.match(metadata, /important planned task.*observable acceptance criteria.*separated implementation.*new-context review/is);
  assert.match(project, /important planned task.*ticket.*do not duplicate.*(?:tracker|ledger)/is);
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

test('project keeps external skill workflows subordinate to explicit project authority', () => {
  const project = readRoleFile('project', 'SKILL.md');
  const implicitApproval = project.match(/For approval of the implicit roadmap offer,[\s\S]*?(?=\n\nFor an explicit full-contract setup\/apply request)/)?.[0] ?? '';
  const explicitFullContract = project.match(/For an explicit full-contract setup\/apply request[\s\S]*?(?=\n\nExclude both JOEWRKS markers)/)?.[0] ?? '';

  assert.match(explicitFullContract, /Invoking an external skill does not approve its whole workflow; use only the parts independently authorized by the current user request or project contract\./);
  assert.doesNotMatch(implicitApproval, /external skill|whole workflow/i);
  assert.match(implicitApproval, /only these two facts: the selected ledger path, and the evidence-reconciliation plus event-based update rule/i);
});

test('design owns intent while visual-check owns concrete regressions', () => {
  const design = readRoleFile('design', 'SKILL.md');
  assert.match(design, /subjective.*first[- ]draft|new UI\/UX intent/is);
  assert.match(design, /visual-check.*concrete visual defect|visual regression.*visual-check/is);
  assert.match(design, /approved reference.*(?:medium|resolution|size|derived state).*visual-check/is);
  assert.match(design, /acceptance depends on.*appearance.*layout.*motion.*target rendering.*(?:creates|changes|implements).*visual-check.*before.*meets acceptance.*ready for.*use.*delivery.*release/is);
  assert.match(design, /delegates design judgment.*reversible bounded draft.*prominent spatial or control relations.*before rendering/is);
  assert.match(design, /ask only.*product or control meaning.*scope.*irreversible.*otherwise.*not add.*approval gate/is);
  assert.match(design, /candidate output.*implementation coordinates.*not.*acceptance authority/is);
  assert.match(design, /unlike visual assets.*visible (?:bounds|mass).*spacing.*centering/is);
  assert.match(design, /multi-variant.*state.*invariant.*variant-dependent.*state-dependent.*before.*visual-check/is);
  assert.match(design, /single reference.*candidate.*not.*define.*allowed variation.*missing.*unverified/is);
  assert.match(design, /Design.*Visual.*handoff.*atomic.*one evidence layer.*evidenceLayer.*applicability.*semantics.*acceptance.*boundary/is);
  assert.match(design, /applicability.*always.*exact named.*variant.*state.*surface.*target/is);
  assert.match(design, /split cross-layer expectations/is);
  assert.match(design, /observable subject.*sourced authority.*exact named.*surface.*context outside.*not.*acceptance/is);
  assert.match(design, /shared invariant.*candidate-local.*each named.*output.*cross-output comparison.*evidence.*every compared output.*one candidate.*unseen output/is);
});

test('design excludes layout-unaffected copy and literal-value fixes', () => {
  const design = readRoleFile('design', 'SKILL.md');
  assert.match(design, /do not use.*layout-unaffected one-line copy or literal-value changes/is);
});

test('design vNext binds one project DESIGN.md lifecycle to a non-aesthetic canonical seed', () => {
  const design = readRoleFile('design', 'SKILL.md');
  assert.ok(existsSync(DESIGN_TEMPLATE_PATH), 'missing skills/design/templates/DESIGN.md');
  const template = readFileSync(DESIGN_TEMPLATE_PATH, 'utf8');

  assert.match(design, /project[- ]root `?DESIGN\.md`?.*single.*durable visual/is);
  assert.match(design, /ABSENT.*DRAFT.*APPROVED/is);
  assert.match(design, /DRAFT.*(?:not|never).*approved authority/is);
  assert.match(design, /material.*(?:revision|amendment).*user.*approval/is);
  assert.match(design, /temporary.*brief.*not.*durable visual rule/is);
  assert.match(design, /approved exact visual.*(?:evidence|preservation target).*not.*project-wide.*rule/is);

  for (const heading of [
    'Visual North Star',
    'Experience / Brand Character',
    'Durable Visual Principles',
    'Surface Modes',
    'Typography',
    'Color / Surface Semantics',
    'Composition / Spatial Hierarchy',
    'Imagery / Artwork',
    'Component / Control Grammar',
    'Motion / Interaction',
    'Responsive Translation',
    'Accessibility / Legibility',
    'Project-specific Anti-patterns',
    'Reference Relationships',
    'Visual Acceptance Anchors',
    'Amendment Rule',
  ]) {
    assert.match(template, new RegExp(`^## .*${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'mi'));
  }

  assert.match(template, /^\*\*Status:\*\* DRAFT$/m);
  assert.match(template, /^\*\*Revision:\*\* 1$/m);
  assert.doesNotMatch(template, /Editorial Biopharma|Quiet Luxury|warm mineral|neon lime|glassmorphism|BIO\/02/i);
});

test('design vNext routes by stage and defines sourced Visual Claims before material rendering', () => {
  const design = readRoleFile('design', 'SKILL.md');

  for (const [id, label] of [
    ['S0', 'Context / Authority'],
    ['S1', 'Direction / Reference'],
    ['S2', 'Static Visual Proof'],
    ['S3', 'Motion / Interaction Proof'],
    ['S4', 'Production Implementation'],
    ['S5', 'Responsive / State Translation'],
    ['S6', 'Acceptance'],
  ]) {
    assert.match(design, new RegExp(`${id}.*${label.replace('/', '\\/')}`, 'is'));
  }

  assert.match(design, /MUST.*WHEN NEEDED.*FORBIDDEN/is);
  assert.match(design, /Visual Claim.*source.*surface.*state.*target dimensions.*expected observable.*evidence method.*acceptance.*boundary/is);
  assert.match(design, /before.*material visual.*(?:render|output).*Visual Claim/is);
  assert.match(design, /S2.*exact.*visual-check/is);
  assert.match(design, /S3.*start.*midpoint.*end.*reverse.*reduced motion/is);
  assert.match(design, /S5.*height.*aspect.*(?:container|containing).*recomposition/is);
  assert.match(design, /Technical.*Responsive.*Accessibility.*Performance.*Visual Internal.*User Acceptance/is);
  assert.match(design, /(?:ㄱㄱ|진행|구현해).*not.*(?:exact )?visual acceptance/is);
  assert.match(design, /material keyframe.*user.*(?:gate|approval)/is);
  assert.match(design, /signature motion.*user.*(?:gate|approval)/is);
  assert.match(design, /reversible bounded draft.*pre-draft.*decision\/approval question.*does not waive.*post-proof.*user visual-acceptance checkpoint.*material keyframe.*materially distinct final variant.*signature motion/is);
});

test('design vNext names the shared capability stack without delegating design authority', () => {
  const design = readRoleFile('design', 'SKILL.md');
  const routingHeadings = [...design.matchAll(/^## Design capability routing$/gm)];

  assert.equal(routingHeadings.length, 1, 'expected exactly one capability-routing section');
  const [routingHeading] = routingHeadings;
  const routingStart = routingHeading.index + routingHeading[0].length;
  const nextHeading = design.indexOf('\n## ', routingStart);
  const routing = design.slice(routingStart, nextHeading === -1 ? design.length : nextHeading);
  const beforeRouting = design.slice(0, routingHeading.index);

  assert.doesNotMatch(beforeRouting, /Search UI UX Pro Max.*vendor\/ui-ux-pro-max\/scripts\/search\.py/is);
  assert.doesNotMatch(beforeRouting, /Read Apple Design.*vendor\/apple-design\/SKILL\.md/is);
  assert.doesNotMatch(beforeRouting, /Figma and browser use follows the actual task/is);
  assert.doesNotMatch(beforeRouting, /Generated colors are advisory/is);
  assert.doesNotMatch(beforeRouting, /Find these repository-relative paths by ascending exactly two directories/is);

  for (const name of [
    'UI UX Pro Max',
    'Apple Design',
    'Refero',
    'oh-my-design',
    'Impeccable',
    'Hallmark',
    'Watermelon',
    'Componentry',
    'Cult UI',
    'Anime.js',
    '$visual-check',
  ]) {
    assert.match(routing, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }

  assert.match(routing, /UI UX Pro Max.*only when.*unspecified design direction.*design-system choice.*stack-specific UI\/UX.*vendor\/ui-ux-pro-max\/scripts\/search\.py.*zero-result.*once.*broader terms.*related domains or stacks/is);
  assert.match(routing, /Apple Design.*only when.*motion.*gesture.*spatial continuity.*material.*typography.*interaction feel.*vendor\/apple-design\/SKILL\.md.*only.*related sections/is);
  assert.match(routing, /Figma.*browser.*image generation.*optimize-web-animations.*only when.*current stage.*evidence.*actual task.*approved references.*available capability.*completion evidence/is);
  assert.match(routing, /Figma and browser.*needed capability.*unavailable.*continue independent work.*report verification incomplete/is);
  assert.match(routing, /Generated colors.*actual contrast check/is);
  assert.match(routing, /repository-relative paths.*ascending exactly two directories.*explicitly supplied repository root.*do not use.*product-specific plugin-root variables.*absolute roots.*downloads.*replacement packages/is);
  assert.match(routing, /Impeccable.*(?:critique|layout|typeset|polish).*material.*user.*(?:gate|approval)/is);
  assert.match(routing, /Hallmark.*audit.*(?:study).*not.*(?:automatic|auto).*redesign/is);
  assert.match(routing, /oh-my-design.*reference-only.*do not.*(?:normally )?invoke.*install.*full.*orchestration/is);
  assert.match(routing, /Watermelon.*product.*utility.*Componentry.*implementation.*Cult UI.*selective/is);
  assert.match(routing, /Anime\.js.*project runtime.*not.*global/is);
  assert.match(routing, /Open Design.*excluded/is);
  assert.match(routing, /do not.*invoke.*all.*(?:tools|capabilities)/is);

  for (const [concept, requirement] of [
    ['behavior', /\bproduct behavior\b/i],
    ['flow', /\bflow\b/i],
    ['route', /\broute\b/i],
    ['data meaning', /\bdata meaning\b/i],
    ['role', /\brole\b/i],
    ['durable policy', /\bdurable policy\b/i],
    ['state semantics', /\bstate semantics\b/i],
    ['product definition', /\bproduct definition\b/i],
    ['resume', /\bresume\b/i],
  ]) {
    assert.match(routing, requirement, `routing is missing product-boundary ${concept}`);
  }

  assert.match(routing, /same visual direction.*(?:twice|two).*no.*third.*polish.*S1.*S2/is);
  assert.match(routing, /already covered.*project-specific.*(?:repeated|common).*missing mechanism/is);
});

test('visual-check binds one hypothesis to the exact observed state', () => {
  const visualCheck = readRoleFile('visual-check', 'SKILL.md');
  const metadata = readRoleFile('visual-check', 'agents', 'openai.yaml');
  const defect = readRoleFile('visual-check', 'references', 'concrete-defect.md');
  const translation = readRoleFile('visual-check', 'references', 'approved-reference.md');
  const evidence = readRoleFile('visual-check', 'references', 'durable-evidence.md');
  const combined = [visualCheck, defect, translation, evidence].join('\n');
  const wordCount = (visualCheck.match(/\S+/g) ?? []).length;
  assert.ok(wordCount <= 500, `visual-check public router is ${wordCount} words; expected <= 500`);
  assert.match(visualCheck, /references\/concrete-defect\.md.*concrete defect.*required/is);
  assert.match(visualCheck, /references\/approved-reference\.md.*approved-reference.*required/is);
  assert.match(visualCheck, /always read.*references\/durable-evidence\.md.*required/is);
  assert.match(combined, /^description: Use when.*approved visual reference.*(?:medium|resolution|size|derived state)/im);
  assert.match(combined, /^description: Use when.*(?:creates|changes|implements|delivers).*output.*acceptance depends on.*appearance.*layout.*motion.*target rendering/im);
  assert.match(combined, /do not use.*(?:planning-only|only plans).*backend.*nonvisual.*layout-unaffected.*rendering-inert/is);
  assert.match(defect, /original failure.*target.*state/is);
  assert.match(defect, /one causal hypothesis.*minimum coherent change set/is);
  assert.match(evidence, /source.*build artifact.*deployed artifact.*visual candidate.*user acceptance/is);
  assert.match(defect, /rejected hypothesis.*new evidence.*not repeat/is);
  assert.match(translation, /one representative.*native target form.*minimum actual[- ]use context.*before.*fan[- ]out/is);
  assert.match(translation, /approved source alone.*before.*candidate.*3(?:\s*(?:to|-|–)\s*7|\s*[-–]\s*7).*identity.*observable/is);
  assert.match(translation, /silhouette.*negative space.*part order.*connectivity.*relative.*(?:span|thickness|visible mass).*orientation/is);
  assert.match(translation, /native.*nearest[- ]neighbor.*preserve.*merge.*reorder.*invert/is);
  assert.match(translation, /generic resemblance.*named.*color.*parts.*not.*fidelity.*required.*(?:collapse|invert).*fail.*nonessential.*omit/is);
  assert.match(translation, /candidate-only.*uninformed.*native.*before.*labeled.*side-by-side/is);
  assert.match(translation, /strongest.*(?:object|identity).*confus/is);
  assert.match(translation, /identity.*depends on.*label.*source adjacency.*enlargement.*(?:not.*pass|fail|unverified)/is);
  assert.match(translation, /each output kind.*required direction.*independent.*verdict.*one.*(?:pass|success).*not.*upgrade/is);
  assert.match(translation, /multi-variant.*state.*sourced.*invariant.*variant-dependent.*state-dependent.*matrix/is);
  assert.match(translation, /variant.*state.*named contract.*not.*source example.*literal.*missing.*unverified/is);
  assert.match(translation, /each materially different output kind.*target form.*one representative/is);
  assert.match(translation, /representative verification.*unresolved.*objective or subjective.*(?:stop|pause).*dependent fan[- ]out/is);
  assert.match(translation, /ask the user only.*subjective intent.*objective evidence.*without.*approval gate/is);
  assert.match(translation, /numeric proxy.*not override.*approved reference.*outside.*exact verified target.*state.*hypothesis/is);
  assert.match(translation, /approved downstream (?:anchor|contract).*not move/is);
  assert.match(translation, /failed derivative.*unless.*intent change/is);
  assert.match(translation, /request authorizes.*bounded translation.*not unrelated intent changes.*repeated approval gates/is);
  assert.match(defect, /retry identity.*causal mechanism.*expected observation.*not.*(?:tool|name)/is);
  assert.match(translation, /follow-up (?:variant|task).*reuse.*approved reference.*stable project-owned path.*version.*temporary attachment path.*not.*durable evidence/is);
  assert.match(visualCheck, /completion gate.*only.*(?:created|changed|implemented).*acceptance depends on.*appearance.*layout.*motion.*target rendering/is);
  assert.match(visualCheck, /before.*any claim.*affected (?:task|output).*meets acceptance.*ready for.*use.*delivery.*release.*regardless.*wording/is);
  assert.match(evidence, /exact (?:produced )?artifact.*version.*named target.*state/is);
  assert.match(evidence, /inspect.*rendered (?:content|frames|output).*native.*actual[- ]use context/is);
  assert.match(evidence, /build.*test.*tool success.*file(?:name| existence).*not.*visual verification/is);
  assert.match(evidence, /generated capture.*not visual verification.*open.*inspect.*content/is);
  assert.match(evidence, /completion-reporting agent.*inspect.*itself.*(?:reviewer|tool).*pass.*not.*substitute/is);
  assert.match(visualCheck, /smallest claim-specific.*checks.*(?:user|request).*reference.*project.*authoritative target/is);
  assert.match(visualCheck, /excluding.*layer.*narrows.*claim.*not.*acceptance check.*no sourced check.*unverified.*(?:instead of|not).*deriv.*pass.*candidate/is);
  assert.match(visualCheck, /expected observable.*concrete.*falsifiable.*observed.*pass.*fail.*unverified/is);
  assert.match(visualCheck, /opening.*evidence.*repeating.*expectation.*looks plausible.*not.*observation/is);
  assert.match(visualCheck, /relation.*name.*both.*actual.*anchor.*contact.*relative position.*scale.*layer.*occlusion/is);
  assert.match(visualCheck, /fail.*unverified.*blocks only.*downstream.*inherits.*amplifies.*independent.*why.*independent.*not.*upgrade/is);
  assert.match(visualCheck, /any required.*fail.*overall fail.*(?:else|otherwise).*unverified.*overall unverified.*(?:else|otherwise).*overall pass.*user.*language/is);
  assert.match(visualCheck, /narrower pass.*(?:after|follow).*never lead.*qualified pass/is);
  assert.match(visualCheck, /per-check record.*sources.*project-provided evidence location.*otherwise.*task result/is);
  assert.match(evidence, /typed.*Design.*Visual.*check.*evidenceLayer.*applicability.*semantics.*acceptance.*boundary/is);
  assert.match(evidence, /exact named claim-scope dimensions.*exact nonmatch.*not.applicable/is);
  assert.match(evidence, /missing required dimension.*unverified.*never infer.*candidate pixels/is);
  assert.match(evidence, /atomic check.*exactly one.*evidenceLayer/is);
  assert.match(evidence, /split.*visible appearance.*artifact identity.*interaction.*runtime identity.*user acceptance/is);
  assert.match(evidence, /visibleAppearanceOverall.*applicable visible-appearance acceptance/is);
  assert.match(evidence, /completeContractOverall.*all applicable acceptance/is);
  assert.match(evidence, /boundary.*reported.*excluded from acceptance aggregates/is);
  assert.match(evidence, /applicability.*multiple variants.*states.*not.*merge.*verdict/is);
  assert.match(evidence, /centering.*opposing margins.*center offset.*units.*normalized.*direction.*materiality.*qualitative.*unverified/is);
  assert.match(evidence, /inside.*outside.*both subjects.*container edge.*absent.*fail.*not observable.*unverified.*adjacency.*not.*outside/is);
  assert.match(visualCheck, /do not create.*(?:file|document|check).*solely.*(?:report|reporting)/is);
  assert.match(visualCheck, /user-facing (?:summary|digest).*overall verdict.*first.*user.*language.*only (?:by )?applicable.*result.*verification.*(?:missing|unverified).*boundary/is);
  assert.match(visualCheck, /exact artifact\/version.*target.*(?:detailed-record pointer|check ids)/is);
  assert.match(visualCheck, /no fixed labels.*line count.*empty fields/is);
  assert.doesNotMatch(visualCheck, /<exact artifact\/version \+ target>.*<localized overall verdict>/is);
  assert.match(evidence, /candidate.*cannot.*acceptance authority.*relationship.*before.*judg.*user-marked.*accepted runtime.*project contract.*target anchor.*not.*authority.*unverified/is);
  assert.match(evidence, /first introduced after viewing.*future.*freeze.*new attempt.*before.*support.*pass/is);
  assert.match(evidence, /self-derived coordinate.*consistency.*not correctness/is);
  assert.match(evidence, /broad.*(?:screen|surface).*claim.*named surfaces.*states.*checked scope.*cannot exceed/is);
  assert.match(evidence, /full frame.*high-salience.*focused.*complementary.*not.*substitute/is);
  assert.match(evidence, /pass.*one (?:surface|state).*not.*upgrade.*unchecked.*unverified/is);
  assert.match(evidence, /composition.*rendered silhouette.*visible mass.*not.*layout box/is);
  assert.match(evidence, /balance or spacing.*pairwise gaps or overlaps.*optical center.*container.*controls.*looks balanced.*not.*observation/is);
  assert.match(evidence, /do not overwrite.*verdict.*new attempt-specific.*content-addressed.*preserves.*bytes.*unexpected overwrite.*invalidates.*evidence loss/is);
  assert.match(evidence, /asset-only claim.*exact file.*native scale.*applied.*installed.*in-game claim.*exact current build.*runtime.*file inspection alone.*insufficient/is);
  assert.match(defect, /inspect.*diagnos.*only.*reproduce.*do not change.*fix authority.*change set/is);
  assert.match(defect, /user.*rejects.*property.*withdraw.*prior pass.*preserve.*historic.*recheck.*exact.*target/is);
  assert.match(evidence, /verification.*unavailable.*implemented.*visually unverified.*not claim.*meets acceptance.*ready for.*use.*delivery.*release/is);
  assert.match(visualCheck, /does not trigger.*planning.*backend.*nonvisual.*layout-unaffected copy/is);
  assert.match(metadata, /produced or changed visual result.*approved-reference translation.*concrete visual defect/is);
  assert.match(metadata, /required mode references.*exact current result.*pass.*fail.*unverified/is);
  assert.match(metadata, /overall verdict first.*user's language.*block only dependent work/is);
  assert.match(visualCheck, /## Visual completion gate/is);
  assert.match(defect, /^# Concrete defect verification$/m);
  assert.match(translation, /^# Approved-reference translation$/m);
  assert.match(evidence, /^# Durable evidence boundaries$/m);
});

test('handoff expands only repeated visual or deployment incidents', () => {
  const handoff = readRoleFile('handoff', 'SKILL.md');
  assert.match(handoff, /last accepted.*build.*deploy.*hash.*next single hypothesis/is);
  assert.match(handoff, /existing incident.*link.*(?:do not|without).*repeat/is);
  assert.match(handoff, /only.*observed.*useful.*resum/is);
  assert.match(handoff, /omit unavailable.*(?:do not|never).*reconstruct/is);
  assert.match(handoff, /do not (?:run|create|add).*(?:check|document|log).*fill.*handoff/is);
  assert.doesNotMatch(handoff, /Mark unavailable fields unavailable/is);
});

test('the six public roles are the exact active manifest skills', () => {
  const manifest = JSON.parse(readFileSync(path.join(ROOT, 'vendor', 'source-manifest.json'), 'utf8'));
  assert.deepEqual(Object.keys(manifest.activeSkills).sort(), [
    'design',
    'handoff',
    'project',
    'spec',
    'ticket',
    'visual-check',
  ]);
});
