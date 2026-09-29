# Setup-only 사용 경로 확인

2026-09-30. 저장된 중립 시험 프로젝트 `JOENESS_TEST-04`의 현재 연결을 사용했다. 실제 프로젝트, 개인 설치, 제품 스킬 소스는 변경하지 않았다. 앞선 설치·평소 TASK 기록·새 채팅 인수인계 증거를 재사용하고, 이번에는 연결 해제와 복원을 직접 확인했다.

## 이번 실행

- 개인 설치 `./JOENESS.ps1 -Check -CodexHome C:\Users\tjdwo\.codex`: `current`, 활성 스킬 `joeness-setup` 하나, blocker 0.
- 시험 프로젝트의 `project-setup.ps1 -Check`: `current`; 연결된 `AGENTS.md` SHA-256 `9da6e561ebc1c395e14fa2fcc2a4f1876d1e8b1ae8820caf3492fa4718abf474`, 상태 파일 SHA-256 `7180c0c98a976cb77f085b33ea222fab76c27acbf029ce201b78f910b36b32d0`.
- 정확한 대상·상태 해시로 `-Detach` 실행: `detached`, exit 0. `AGENTS.md`의 JOENESS 연결과 `.joeness/setup-state.json`만 해제됐다. 이후 `-Check`: `ready`, 연결 없음, blocker 0.
- 원래 연결 본문과 해제 후의 새 해시를 사용해 `-Apply` 실행: `current`, exit 0. 마지막 `-Check`: `current`, blocker 0, 위의 연결·상태 해시로 정확히 복원.
- 해제 전후 `PRODUCT.md`, `ROADMAP.md`, `TASK.md`, `ISSUES.md`의 SHA-256은 각각 `CC67F3BE441AE0E0DDED700C8AE0DE0EDC408F5CA08D0715566F7A98D7B2D1C9`, `8C1F5C0B2E519E452E6E388D43E2635264EDDB5E88BC6052096ADFEDCDD5AD6E`, `7C5592B7236C03E2838592A47FD7E267FDAABBC466E2FB761A85C1A831862975`, `B9CDCC70B44A2CEEA44DED684C43CEFCEB9D925A6094E31232362698D06BF1E3`로 동일했다.
- `tests/joeness-release.tests.ps1`: `PASS JOENESS setup-only release contract`, exit 0. 소스·개인 설치의 `skills/joeness-setup/SKILL.md` SHA-256은 모두 `60E4E335E688385A84D7D6A5A8D34BCF95AC0CD8D5A7FF56E67301EC79495355`.

## 사람에게 보이는 안내

처음 이해도 질문은 “방금 사용 흐름 설명”을 참조했으나 사용자가 “그 설명이 뭐야?”라고 되물었다. 가리키는 내용이 자명하다고 가정한 질문 설계 실패다. 설치 요청 → 변경안 확인·승인 → 문서별 기록 → 새 채팅 인수인계 → 연결 해제 순서를 같은 메시지에 다시 명시하고 재질문했다. 사용자는 그 설명을 이해했다고 답했지만, 나머지 MD 역할은 설명하지 않아도 되는지 지적했다. 실제로 짧은 설명에서 `DESIGN.md`가 빠졌고 기존 `PRODUCT.md`와 기본 다섯 역할의 관계도 빠졌다. 이어 `AGENTS`·`ROADMAP`·`TASK`·`ISSUES`·`DESIGN`의 역할, 디자인을 쓰지 않을 때의 처리, 기존 `PRODUCT.md`의 별도 위치를 설명했다. 사용자는 이 완전한 안내가 처음 쓰는 사람에게 `충분함`이라고 답했다. 기존 설치 안내에는 이 역할들이 이미 있으므로 스킬 규칙은 늘리지 않았다.

이번 사람 평가는 실제 결과를 전달받아 이해하는 범위다. 사용자가 혼자 안내문을 따라 수행하는 전 과정, 새 채팅 초기 지침의 원문, 일반 성능·토큰 이득, 정식 출시 승인은 검증하지 않았다.
