# JOENESS 2.0.0 — 저장소 정리·보안 검토·빠른 시작 (2026-11-19)

저장소 정리, 보안 검토 문서, 한 쪽 빠른 시작과 README 축약을 더한 판이다. **스킬 폴더 `skills/joeness-setup/**`(19개 파일)는 1.4.2와 바이트 단위로 같다**(트리 `73af9e5e1e55def3e56cfaf11d2657d7ad7a944d`). 에이전트가 읽는 글이 곧 도구의 동작이고 작은 동작 변화는 감당할 수 있는 시험으로 잡지 못하므로, 스킬 본문은 한 글자도 바꾸지 않았다. manifest는 `release.version`만 바뀌었다.

- 정리: 아무도 링크하지 않는 2026-09 `docs/superpowers` 초안 4개 삭제(이력에 남음). 2026-10-24~11-03 기록의 구동 스크립트 7개에서 홈 경로 15곳을 `~`로 가림. 측정 출력과 `evals/experiments`는 손대지 않음.
- [보안 검토](../../docs/SECURITY.md): 진짜 비밀값 0건(트리·이력 745커밋), 의존성 없음, CI 읽기 권한만. 옛 기록·Git 이력·커밋 메타데이터의 개인 식별자는 남김(이력 재작성 안 함). 스크립트별 신뢰 경계와 신고 방법.
- [빠른 시작](../../docs/QUICKSTART.md): Codex 설치, Claude Code 클론 연결, 프로젝트 연결, 상태 확인, 업그레이드(옛 패키지 `-Remove` → 새 패키지 `-Apply`), 연결 해제, 제거. README 233줄 → 139줄.

**확인된 것.** 스킬 폴더 트리 해시 `73af9e5`(= `JOENESS-v1.4.2`) 불변. manifest는 버전 한 줄만 다름. `JOENESS.ps1` 불변, `scripts/sync-harness.ps1`은 버전 핀 1줄. Node 106/106, Windows PowerShell 5.1 release·install·project-setup(28 cases) 종료 0. 스테이징한 줄에 사용자 이름·메일·`C:` 사용자 폴더 0건. 근거 [evals/v2-release-20261119/report.md](report.md).

**확인되지 않은 것.** PowerShell 7은 이 기계에 없어 GitHub Windows CI로만 돈다. 행동 시험 없음(스킬 본문 변경이 없으므로 하지 않았다). Claude Code 쪽 설치는 수동(clone + junction)이다. 옛 기록과 Git 이력의 개인 식별자는 그대로다(자세한 것은 SECURITY.md).

**업그레이드 주의.** 1.4.2 개인 설치본에서 2.0.0 패키지의 `-Check`는 `blocked`다. 1.4.2 패키지로 `-Remove`한 뒤 2.0.0으로 `-Apply`한다([빠른 시작 6절](../../docs/QUICKSTART.md)). 연결된 프로젝트의 `-Check`는 그대로 `current`다(연결문이 같아 갱신할 것이 없다).

**세션이 대신 내린 결정.** 삭제는 참조 0건인 초안 4개만, 나머지 기록은 보관 이동도 하지 않았다. 가림은 테스트·기록이 해시를 고정하지 않은 구동 스크립트 7개만. `SECURITY.md`는 루트 이름이 테스트에 고정돼 `docs/`에 두었다.
