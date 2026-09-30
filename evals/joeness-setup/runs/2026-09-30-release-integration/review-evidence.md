# JOENESS setup-only 개발 후보 통합 증거

Date: 2026-09-30. 범위: `0.3.0-beta.3-dev` 개발 후보의 문서 보정, 기본 브랜치 통합, 개인 설치 전환. 정식 출시 승인은 아니다.

- 기준 커밋: `0d7503b2ea03bf780c1723e945c84672ef0f6075`. `codex/joeness-03-release-docs`를 로컬 `main`에 fast-forward한 뒤 `origin/main`에 강제 푸시 없이 반영했다. 원격 `main`도 이 커밋을 가리켰다.
- 독립 읽기 전용 리뷰: Critical 0, Important 1. README 첫 문장이 이전 후보의 설치 증거를 현 후보의 검증처럼 읽히게 한 문제를 수정했다. 나머지 변경은 사용 안내 두 문서와 manifest의 안내 파일 해시다.
- 현 커밋의 로컬 검사: `joeness-release.tests.ps1` 통과, 프로젝트 연결 안전 사례 26건씩 Windows PowerShell·PowerShell 7 통과, 설치 수명주기 양쪽 통과, Node 9/9 통과. `git diff --check` 통과.
- 깨끗한 원격 Windows 검사: [후보 브랜치 run 36684122712](https://github.com/JOEWRKS/JOENESS/actions/runs/36684122712)와 [main run 36684492145](https://github.com/JOEWRKS/JOENESS/actions/runs/36684492145)가 같은 `0d7503b`에서 모두 `success`였다.
- 이전 개인 설치의 상태 파일 manifest SHA-256 `a9f83b60ef4890964ec0e232ce2825d5ba16772fba1fbd1e0017cf9e02d30c61`는 커밋 `e30f1fd`의 manifest와 같았다. 해당 소스에서 `Check: current` 후 `Remove: removed`를 실행했다. 현 `main`에서 `Check: ready → Apply: current → Check: current`를 확인했다. 알 수 없는 파일을 덮어쓰거나 전역 `AGENTS.md`를 수정하지 않았다.
- 현 manifest SHA-256: `2d37df63529ed08279470fa4ca3482344c8184bcec06ba7694e99d802b60bb21`. 개인 설치 상태와 일치하고, 관리 파일 9개에 해시 불일치는 0건이다. 설치된 공개 스킬은 `joeness-setup` 하나다.
- 설치된 연결 도구의 읽기 전용 확인: 기존 중립 Git 프로젝트 `joeness-setup-apply-20260930-a`가 `current/clean`이며 변경 대상은 없었다. 이번 통합 후 실제 새 채팅은 다시 실행하지 않았다.

남음: 정확한 정식 출시 식별자와 그 커밋의 설치·새 채팅 확인, 되돌리기·해제 안내, 사람 사용성의 미완 판정, 사용자 최종 출시 승인. 성능 우월성이나 토큰 절감은 입증되지 않았다.
