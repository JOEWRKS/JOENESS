## 1.4.2 — 연결문에 Result 열 규칙 (2026-11-15)

45차 행동 A/B(`evals/joeness-setup/runs/2026-11-15-v141-behavior-ab2/report.md`)에서 JOEDESIGN DESIGN 템플릿이 먼저 깔린 프로젝트의 1.4.1 run 4회 중 기존 Rule Coverage 표에 Result 열을 더한 run은 0이었다. 그 규칙은 `SKILL.md`·`assets/DESIGN.md`에만 있고 에이전트가 매 턴 읽는 연결문에는 없었다(SKILL.md를 읽은 run 2/4). 사용자 결정으로 연결문에 넣는다.

- 연결문(`assets/AGENTS.md`) `<joedesign>` 안내 바로 뒤 두 줄: JOEDESIGN의 DESIGN 템플릿을 이미 쓰면 그 Rule Coverage 표가 DESIGN 규칙 표다. Result 열(최신 TASK 링크, 복사한 로그 없음)이 없으면 더하고, 두 번째 표는 만들지 않는다.
- `vendor/source-manifest.json`의 `assets/AGENTS.md` 해시와 `release.version` 갱신. `tests/joeness-setup-contract.tests.mjs`에 새 줄 존재 단언 1개. 스크립트·다른 자산·CLI는 바뀌지 않았다.

**확인된 것.** Node 106/106, Windows PowerShell 5.1 release·project-setup(28 cases)·install 스위트 exit 0(준비 커밋과 버전 커밋 양쪽). 저장소 밖 임시 프로젝트에서 빈 상태와 1.4.1 블록이 든 상태 모두 1.4.2 본문 `-Apply` → `-Check` `current`, 기계 경로 경고 없음, 블록 밖 사용자 텍스트 보존. 근거 `evals/joeness-setup/runs/2026-11-15-v142-prep/report.md`.

**확인되지 않은 것.** 행동 효과(유료 실행 0회): 에이전트가 새 줄을 보고 실제로 기존 표에 Result 열을 더하는지는 시험하지 않았다. PowerShell 7은 CI만 돈다. `-Check`는 그 프로젝트의 마지막 적용 기준선과만 비교하므로 1.4.1 블록이 든 프로젝트도 `current`로 나온다(기존 연결을 자동 갱신하지 않는 정책과 같음. 자산보다 낡은 블록을 알리는 기능은 없음). 기존 프로젝트 연결은 자동 갱신하지 않는다.
