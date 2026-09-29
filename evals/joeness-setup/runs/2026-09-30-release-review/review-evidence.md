# Setup-only 출시 전 독립 리뷰

검토 범위: `e6ff2c80024a2c75d8aef157ebc26ddaf5a0924c..748effa79b883cb7e41392bae97c5f79eb8980b1`. 읽기 전용 독립 리뷰는 설치기의 소유권·legacy 차단, 프로젝트 설정의 snapshot/rollback 보호, 기존 문서 보존을 긍정적으로 평가했고 Critical 0건을 보고했다. 아래 두 지적은 삭제하지 않고 수정 근거로 남긴다.

## 발견과 좁은 수정

1. Important: `AGENTS.md`의 관리 블록이 관찰된 초기 32 KiB 지침 범위 밖에 있으면 파일 전체가 이미 그 범위를 넘는다. 그런데 SKILL/README는 `-Relocate`로 자동 복구할 수 있다고 안내했다. 안전하게 기존 지침을 모두 보존하며 이 조건을 만족하는 재배치는 불가능하다. 자동 재배치 약속을 제거하고, 승인된 지침 정리 또는 연결 해제 뒤 재확인으로 안내를 바꿨다. 기존 helper의 `-Relocate`는 이 경우 계속 fail-closed이며 권장 경로가 아니다.
2. Minor: 미연결 `AGENTS.md`가 정확히 32,768 UTF-8 bytes이면 `-Check`가 `ready`라고 했으나, 비어 있지 않은 연결 구역을 추가하는 `-Apply`는 용량 초과로 막혔다. `UnconnectedExactWindowCannotAcceptManagedBlock` 테스트를 먼저 추가했다. 수정 전 `expected=blocked actual=ready`로 실패했고, 이후 Check가 최소 1자 연결 구역의 실제 구분자·줄바꿈 크기까지 고려하게 하자 두 PowerShell 버전에서 통과했다. 사전 확인은 최소 연결 가능성만 판정한다. 실제 제안 본문의 크기는 Apply 단계에서 다시 검사한다.

추가로 Apply가 불가능한 재배치를 권하던 차단 문구를 수정했다. 독립 리뷰어는 두 지적이 해소됐고 이 좁은 수정에서 새 병합 차단 문제는 없다고 재확인했다. 자동 이전 설치, 비Git·타 OS, 문서 자동 재편, 토큰 절감과 최종 출시 승인은 리뷰 범위 밖이다.

## 수정 후 로컬 검사

- Windows PowerShell: release contract PASS, project setup 26 PASS, installer lifecycle PASS.
- PowerShell 7: project setup 26 PASS, installer lifecycle PASS.
- Node: setup contract/fixture 9 PASS, 0 FAIL.
- Manifest에 고정된 단일 스킬 파일 9개 해시 일치, `git diff --check` 오류 0.

최종 커밋과 원격 Windows CI는 이 문서 작성 시점에 미확정이다. 통과 전에는 출시 완료로 판정하지 않는다.
