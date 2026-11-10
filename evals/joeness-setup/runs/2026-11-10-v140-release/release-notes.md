## 1.4.0 — JOEDESIGN 보고 도장 소비와 Check 칸 예시 (2026-11-10)

JOEDESIGN 보고 끝의 도장 줄(`report-check: ok <chars> chars <sha8>`)을 JOENESS가 받아 기록하고 대조한다.
- 연결문(`assets/AGENTS.md`) 3문장: 저장된 JOEDESIGN 보고가 있는 항목은 `node <joedesign>/scripts/report-check.mjs --verify <file>` 종료코드 0 뒤에만 complete가 된다. 도장이 없거나 어긋나거나 Node·스크립트가 없으면 verification pending으로 둔다. 도장 줄은 TASK `Report stamp:`에 옮기고, 디자인 규칙의 ROADMAP Check는 스크립트 이름이 아니라 DESIGN 규칙 표의 행으로 적는다. `changed` 수정은 해결이 아니라 남은 문제다.
- `SKILL.md`, `assets/TASK.md`(`Report stamp:` 줄), `assets/ROADMAP.md`(Check 예시), `references/review-gate.md`(게이트 없는 경우의 도장 소비). 스크립트·스키마·계약은 그대로이고 review-gate를 대체하지 않는다.

**확인된 것.** 43차 A/B/C(Opus 5.5 한 턴, 1.3.0 / 네 파일 / 네 파일+연결문 × 4장면 × 3회 = 36회, 블라인드 채점 2회)에서 측정했다. 도장을 TASK에 복사한 비율은 0/9 · 3/9 · 9/9였다. 새 Check 칸이 규칙 표를 가리킨 비율은 0/3 · 3/3 · 3/3이었다. 문제없는 보고는 세 팔 모두 정상 완료(3/3)됐다. main `696c32a`의 Windows CI(run 42770997371)는 성공했다.

**확인되지 않은 것.** `--verify` 실행, 어긋난 도장의 pending 유지, `changed`를 남은 문제로 옮기는 행동은 대조군도 이미 해서(8/9~3/3) 문구 효과를 보이지 못했다. Node 없는 환경, 실제 새 세션, 다른 모델, 여러 턴에 걸친 유지도 시험하지 않았다. 도장은 글의 동일성과 형식만 보이며, 수치의 참이나 승인은 보이지 않는다.

근거: `evals/joeness-setup/runs/2026-11-09-report-stamp-ab/report.md`, `docs/CHANGELOG.md`. 기존 프로젝트 연결은 자동으로 갱신하지 않는다.
