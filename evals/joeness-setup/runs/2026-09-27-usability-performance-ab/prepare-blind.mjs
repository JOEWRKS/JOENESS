// Redacts machine paths and treatment-identifying metadata from actual S4 answers.
// The A/B assignment is counterbalanced and revealed only after the human rating.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
function answer(fixture, arm) {
  const raw = readFileSync(join(root, 'responses', `${fixture}-${arm}-S4.md`), 'utf8');
  return raw
    .replace(/\[([^\]]+)\]\((?:\/?D:)[^)]+\)/g, '$1')
    .replace(/\b[0-9a-f]{7}\b/g, '기준 커밋')
    .replaceAll('.joeness/setup-state.json', '연결 상태 파일')
    .replace(/D:\/JOEWRKS\/JOENESS-Usability-Performance-AB-20260927\/projects\/(?:reading-shelf|workshop-slots)-(?:bare|joeness)\//g, '프로젝트/');
}
const pairs = [
  ['pair-1-reading-shelf.md', 'reading-shelf', 'bare', 'joeness'],
  ['pair-2-workshop-slots.md', 'workshop-slots', 'joeness', 'bare'],
];
for (const [filename, fixture, a, b] of pairs) {
  const text = [
    '# 인수인계 읽기 비교',
    '',
    '같은 초기 상태에서 각각 작업한 뒤 작성된 두 답변입니다. 출처와 컴퓨터 경로만 가렸고,',
    '설명 순서·내용·길이는 실제 답변 그대로입니다. 어느 쪽이 JOENESS인지',
    '평가가 끝날 때까지 공개하지 않습니다.',
    '',
    '## A',
    '',
    answer(fixture, a).trim(),
    '',
    '## B',
    '',
    answer(fixture, b).trim(),
    '',
  ].join('\n');
  writeFileSync(join(root, filename), text, 'utf8');
}
