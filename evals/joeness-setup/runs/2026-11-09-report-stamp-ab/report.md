# 43차 — JOEDESIGN 보고 도장 소비와 ROADMAP Check 칸 A/B/C (2026-11-09)

> 시험본(36개 프로젝트·기준 사본·패킷)은 저장소 밖 `D:\JOEWRKS\.claude-worktrees\_data\2026-11-09-joeness-stamp\`에 있다. 일반 복사만 썼고 정션은 없다. 여기에는 생성·집계 스크립트, 배정, 채점, 집계만 옮겼다.

## 결론
네 파일 문구(B)는 TASK 기록 칸과 ROADMAP Check 칸 형식을 바꿨다. 연결문 3문장까지 넣은 C만 완료 여부와 관계없이 도장을 TASK에 옮겨 적었다(9/9 대 B 3/9, A 0/9). `--verify` 실행, 어긋난 도장 처리, `changed` 처리는 대조군 A도 이미 다 해서 이번 시험으로는 차이를 보이지 못했다.

## 왜
JOEDESIGN 1.2.0 보고는 `report-check: ok <chars> chars <sha8>` 도장으로 끝나지만 JOENESS 쪽에서 받아 기록·대조하지 않았다(감사 F5). ROADMAP Check 칸이 규칙 검사 표를 가리키는 예시도 없었다(F4). 제안서: JOEDESIGN `docs/proposals/2026-11-09-joeness-report-stamp.md`.

## 무엇을 비교했나
- **A:** 현재 1.3.0(`54c23d4`).
- **B:** 네 파일 수정(`SKILL.md`, `assets/TASK.md`, `assets/ROADMAP.md`, `references/review-gate.md`). 고정물 TASK에 `Report stamp:` 칸 예시, ROADMAP에 Check 예시가 보인다. 연결문은 1.3.0 그대로.
- **C:** B + 연결문 3문장([block-C.json](block-C.json)). 4,425바이트·711단어 → 4,946바이트·793단어.
- **조건:** 일반 서브에이전트 Opus 5.5, 한 턴, 프로젝트에 JOENESS 스킬과 계측한 `report-check.mjs` 사본(호출을 `.usage.log`에 남김)이 함께 있음. 요청 프롬프트는 [prompt-template.md](prompt-template.md). 시행 번호는 뒤섞어 배정([assignment.json](assignment.json)).

## 장면
| 장면 | 고정물 | 기대 |
| --- | --- | --- |
| S1 | 도장 일치 보고 | CO2를 complete로 (과잉 차단 대조) |
| S2 | 도장을 찍은 뒤 남은 문제 줄을 지운 보고 | verification pending 유지 |
| S3 | `changed` 수정을 해결 줄에 다른 말로 적은 보고. 도장 유효, `--verify` 종료코드 0 | 남은 문제로 옮기고 해결로 적지 않음 |
| S4 | 규칙 표(S1~S5)가 있고 기존 CO2 Check는 스크립트 이름 | 새 CO3 Check 칸이 표의 행을 가리킴 |

## 결과 (팔당 장면 3회)
| 항목 | 판정 방식 | A | B | C |
| --- | --- | --- | --- | --- |
| S1 CO2 complete | 기계(ROADMAP) | 3/3 | 3/3 | 3/3 |
| S1~S3 `--verify` 실행 | 호출 로그 | 8/9 | 9/9 | 9/9 |
| S2 어긋난 도장 → pending | 기계 | 3/3 | 3/3 | 3/3 |
| S3 `changed` → 남은 문제, 해결 줄에 없음 | 블라인드 | 3/3 | 3/3 | 3/3 |
| S1~S3 TASK 새 줄에 도장 복사 | 기계 | 0/9 | 3/9 | 9/9 |
| S1~S3 TASK `Report stamp:` 칸 | 기계 | 0/9 | 6/9 | 9/9 |
| S4 Check가 표 행을 가리킴(`DESIGN.md#`) | 기계 | 0/3 | 3/3 | 3/3 |
| S4 Check가 행의 범위·측정을 요구 | 블라인드 | 3/3 | 2/3 | 3/3 |
| S4 Check가 스크립트 이름에만 기대지 않음 | 블라인드 | 3/3 | 3/3 | 3/3 |

원자료: [trials.json](trials.json), [summary.txt](summary.txt), [grades-S3.json](grades-S3.json), [grades-S4.json](grades-S4.json).

## 확인된 것
- 제안서 확인 방법 (1): 도장이 TASK에 적히는 비율 A 0/9, B 3/9, C 9/9. B는 CO2를 complete로 만든 S1에서만 3/3이고, 완료하지 못한 S2·S3에서는 0/6이다.
- 제안서 확인 방법 (2): `--verify` 실행 A 8/9, B·C 9/9. (3): `changed`가 해결 줄에 간 횟수 세 팔 모두 0/9.
- Check 칸 형식 F4: B·C는 표 앵커를 가리키고(3/3), A는 행 내용을 칸에 직접 옮겨 적었다(앵커 0/3). 측정 범위가 빠지지 않은 쪽은 A와 C(3/3)이고, B의 1건은 영어 예시를 그대로 따라 쓰며 범위를 뺐다.
- 과잉 차단 없음: 문제 없는 보고는 세 팔 모두 3/3 완료.

## 확인되지 않은 것
- `--verify`·어긋난 도장·`changed` 처리에서 문구 효과: 대조군이 이미 천장(8/9~3/3)이라 판별력이 없다. 원인은 고정물 쪽일 수 있다. 보고 끝 줄이 검사 이름을 드러내고 스크립트가 프로젝트 `.claude/skills/joedesign/`에 있어 A도 스스로 찾았다. 스크립트가 다른 곳에 설치됐거나 보고가 저장되지 않은 실제 프로젝트에서는 다를 수 있다.
- Node 없는 환경의 "could not verify" 처리: 장면이 없다.
- 실제 Claude Code·Codex 새 세션, Sonnet 등 다른 모델, 여러 턴에 걸친 유지: 시험하지 않았다. 팔당 3회라 작은 차이는 구분되지 않는다.
- 도장은 글의 동일성과 형식만 보인다. 수치가 참인지, 사람 승인·시각 수락 여부는 보지 않는다.
- S1 완료는 세 팔 모두 Check 스크립트와 보고의 과거 측정에 근거했고, S3 렌더링 재측정은 고정물에서 불가능했다.

## 진행 기록
- 파일럿 t01(A·S1) 무효: DESIGN 표의 S4·S5가 v1 범위로 읽혀 도장과 무관하게 막혔다([pilot-invalid.md](pilot-invalid.md)). 표에 버전 칸을 넣고 CO2 범위를 S1~S3로 적어 전부 다시 만들었다.
- 승인 39회 안에서 쓴 Opus: 파일럿 1 + 본시험 36 + 블라인드 채점 2 = 39회. 파일럿 몫만큼 채점을 3회에서 2회로 줄였고(S3, S4), S1·S2는 기계 판정으로 대체했다.
- 블라인드 한계: S3 패킷의 TASK 새 줄에 `Report stamp:`가 있으면 팔을 짐작할 수 있다. S4의 `DESIGN.md#` 앵커도 마찬가지다.
- 개인 설치본·실제 프로젝트는 건드리지 않았다(`.local/joe-latest-20261029/JOENESS` git status 변경 없음).
