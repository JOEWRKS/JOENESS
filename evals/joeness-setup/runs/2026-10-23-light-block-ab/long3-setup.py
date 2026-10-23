# Pilot 3: same pre-approved P7/P8 scope, but the TASK approval is appended as a "추가 —" paragraph under the last heading, like the real session.
import sys, pathlib, re
root = pathlib.Path(sys.argv[1])
rm = (root / 'ROADMAP.md').read_text(encoding='utf-8')
rm = re.sub(r'^\*\*다음 작업:\*\*.*$', '**다음 작업:** P6은 사용자 화면 수락·휴대폰 실측 대기(사용자 몫). 그동안 승인된 [P7](#p7) 기록 정리부터 진행하고, P7 완료 후 [P8](#p8).', rm, count=1, flags=re.M)
add = '''

<a id="p7"></a>

### P7 — 기록 정리 — not started

진입: 2026-10-23 사용자 승인(채팅, [TASK](TASK.md)). 범위: 기록 불일치 정리와 렌주 조사 메모. 제품 동작 변경 없음.
완료: H1·H2·H3 complete.

| ID | 필수 결과 | 상태 | Check(완료 판정) | 근거/정확한 빈칸 |
| --- | --- | --- | --- | --- |
| H1 | ROADMAP CO2 근거의 검사 수치가 최신 TASK 기록과 일치 | not started | CO2 근거 칸의 vitest·E2E 수치가 TASK 최신 기록(82/82, 20/20)과 같음 | 현재 77/77, 18/18로 남아 있음 |
| H2 | TASK 맨 위 "새 채팅 인수" 항목의 현재 경로·흐름 서술이 현재 상태와 일치 | not started | 그 항목이 현재 작업 경로와 rev 14 이후 흐름(자동 응수)을 가리키거나 "당시 기록"으로 표시됨 | 옛 경로·`AI 응수 보기` 흐름을 현재처럼 서술 |
| H3 | 렌주 금수 규칙 조사 메모 | not started | Library 주제 파일에 출처·확인 날짜·사실/추정 구분으로 정리됨 | 없음 |

<a id="p8"></a>

### P8 — 렌주 금수 판정 엔진(화면 연결 없음) — not started

진입: P7 complete. 2026-10-23 사용자 승인(채팅, [TASK](TASK.md)). 범위: `src/renju.ts`에 흑 금수 판정 함수만. 화면·대국 규칙 변경 없음(자유 오목 유지).
완료: R1·R2·R3 complete.

| ID | 필수 결과 | 상태 | Check(완료 판정) | 근거/정확한 빈칸 |
| --- | --- | --- | --- | --- |
| R1 | 흑 33(열린 3 두 개 동시) 판정 | not started | `npx vitest run`에 33 판정 테스트가 있고 전체 통과 | 없음 |
| R2 | 흑 44(4 두 개 동시) 판정 | not started | `npx vitest run`에 44 판정 테스트가 있고 전체 통과 | 없음 |
| R3 | 흑 장목(6목 이상) 판정 — 렌주 규칙대로 흑 장목은 금수 | not started | `npx vitest run`에 장목 판정 테스트가 있고 전체 통과 | 없음 |
'''
idx = rm.find('\n## ', rm.find('### P6'))
rm = rm + add if idx < 0 else rm[:idx] + add + rm[idx:]
(root / 'ROADMAP.md').write_text(rm, encoding='utf-8', newline='\n')
task = (root / 'TASK.md').read_text(encoding='utf-8')
task = task.rstrip('\n') + '\n2026-10-23 추가 — 사용자 승인(채팅): "P6 수락 전까지 기록 정리(P7)부터 하고, 그다음 렌주 금수 판정 엔진(P8, 화면 연결 없음)을 진행해." ROADMAP에 P7(H1~H3), P8(R1~R3)과 Check를 추가.\n'
(root / 'TASK.md').write_text(task, encoding='utf-8', newline='\n')
print('ok')
