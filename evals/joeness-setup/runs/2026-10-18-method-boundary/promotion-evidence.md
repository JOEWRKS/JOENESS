# 검증 후보의 제품 소스 채택

2026-10-18. 사용자 승인: 검증 후보를 제품에 반영하되 규칙 추가와 개인 설치 변경 금지.

결과: 기존 제품 경로에 있던 시험 후보를 수정 없이 채택. 이번 턴은 상태·승인 기록만 변경했다. `assets/AGENTS.md`는 기존 네 줄 교체 그대로이며 규칙 절·절차 추가 없음. 나머지16파일은 Git HEAD와 바이트 동일.

확인 기준 HEAD: `05aea4d52d822e78ceced566b6916dd55fc9e160` (새 커밋 아님).

| 확인 | 결과 |
|---|---|
| 제품17파일 vs 시험 fixtures.json의 후보 해시 | 17/17 일치 |
| 제품17파일 vs 현재 manifest | 17/17 일치 |
| 개인 설치17파일+상태 vs 시험 시작 기준 | 18/18 불변 |
| quick_validate | UTF-8 명시 후 통과 |
| git diff --check | 통과 |

정확한 해시:
- 제품 연결문: `75069615fdff4c686286cefa80d6ea380940b76a53ccdbf039350ba871f63163`
- manifest: `4d81e3954fa4c2ccd345573a05dee935a7933bf014d5420d045a301912d1de63`
- SKILL.md: `0f5db50f1f1ffc21359372cd49c72fcd05cc785869f995a7ac9e175f6696beba`

검증 재사용: [직전 후보 검증](review-evidence.md)의 실제 행동2사례·기능12/12·기존 Node99/99·Windows 계약/연결/격리 설치 결과. 실행 내용17파일이 동일하므로 모델·전체 검사를 반복하지 않음. 이전 실패와 한계는 유지.

이번 확인 중 기본 Python 인코딩 cp949로 quick_validate를 호출해 UnicodeDecodeError 발생. 파일 변경 없이 `python -X utf8 C:/Users/tjdwo/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/joeness-setup`으로 통과. 제품 결함으로 판정하지 않음.

제품 버전 필드는 1.0.1 유지하되 출시된1.0.1과 이 미배포 소스의 차이를 구분. 개인 설치·기존 프로젝트·커밋·푸시·태그·배포 없음. 사용자 소유 `docs/ISSUES.md` 해시 `d3c87c8fa0e2e34600ae12ff0b1c9ea1d503ca5a7f6a30db17ca8e8ea9b529c7` 유지. skill-creator의 최소 변경 원칙에 따라 추가 행동 규칙 없이 검증본 그대로 채택.
