# T009 — 후보 개인 설치·GEO 운영 확인

2026-10-07, 후보 `a6411e5266ae748bd140b3db2a88b4c07381e351`.
사용자 승인 turn `01a11689-79a2-7a72-9320-06070a0ba2e0`: 기존 방안대로 설치 후 검증, 필요한 보강 진행.
범위는 [protocol](protocol.md). 기존 원본 유지안의 GEO 한정 적용이며 새 제품 권한 이전은 아니다.

## 설치·연결

- 개인 설치의 기존 소유권은 정확한 `0812d768195d7189117a736c8c809eb6ee5f46f5` 패키지로 current 확인.
  후보로 바로 Check한 첫 결과는 manifest 차이에 따른 blocked였다. 충돌을 우회하거나 상태를 재작성하지 않고,
  기존 패키지 공식 Remove → 후보 공식 Apply → Check로 관리9파일/소유정보만 교체했다.
  [실제 결과](personal-application.json): removed/current/current, 사용 안내 출력 확인.
- 후보의 버전 문자열은 0.3.3이지만 정식 태그 0.3.3과 다른 bytes다. 정확한 후보는 위 commit과
  manifest SHA-256 `d2d23ac9b553d0039bea344681812650abb63ce955ff7274268629af1f9469bd`로 식별한다.
  새 릴리스·main 병합·태그 이동은 하지 않았다.
- GEO 담당이 작업 기록 저장 완료·연결2파일 편집 중 아님을 확인한 뒤, fresh Check의 정확한
  root/AGENTS/state 해시를 사용해 공식 helper로 적용했다. [결과](project-application.json): current/clean.
  AGENTS와 `.joeness/setup-state.json`만 변경. 기존 문단12개와 구역 밖 bytes 보존, 최종 AGENTS 6,885bytes.
  [추가 문구 포함한 관리 본문](managed-body.md)은 증거 사본이며 프로젝트 파일의 상대 링크를 그대로 담는다.
- 개인 전역 AGENTS 및 `joeness-setup` 외 **스킬 파일 428개** 불변. 428개의 스킬이라는 뜻이 아니다.
  GEO 추적 파일474개와 설치 단계의 보호 문서9개 불변. [적용 전](before.json), [적용 직후](after-apply.json).

기존 개인 관리 파일은 교체됐으며 기존 원본은 고정 Git 커밋과 임시 패키지 사본으로 복구 가능하다.
일반 Git 초기화·실제 프로젝트 이동·사용자 원문 삭제·전역 판단 Core 생성 없음.

## 검사 근거

[preflight-tests.json](preflight-tests.json): 정확한 후보의 Windows workflow 로컬 대응 명령을 실제 실행했다.

| 검사 | 결과 |
|---|---|
| Node 계약·fixture | 13/13 |
| PowerShell 5/7 연결 안전성 | 각각27/27 |
| PowerShell 5/7 설치 수명주기 | 각각 exit0 |
| Windows PowerShell 출시 계약 | PASS |
| 후보 원격 Windows gate | [run37614501451](https://github.com/JOEWRKS/JOENESS/actions/runs/37614501451), success, head=a6411e5 |

설치 후 관리9파일은 후보 manifest와 일치한다. GEO 제품 원본은 revision6 OPEN/UNAPPROVED,
SHA-256 `dfddf08111729e293f407b0b42f20621cc8c48bb648cb840b01e0f9dbf5466c8`.
앞선 T008의 합성 revision1이나 옛 GEO revision5를 현행 원본으로 잘못 사용하지 않았다.

## 운영 확인 — 한정 통과

GEO 기존 채팅에서 설치된 SKILL·현행 AGENTS를 명시 재독해하고 현재 Product/ROADMAP/TASK를 대조한다.
TASK의 한정 확인 기록만 추가하고 실제 불일치가 있으면 ROADMAP/ISSUES의 관련 사실만 정정하도록 요청했다.
새 정책 선택·제품 원본 수정·승인·구현·외부 조사·추가 설치·커밋은 허용하지 않았다.
실행 turn `01a11690-971e-7bd1-9eb3-b10d036dbe6e` 완료. [실제 응답](geo-response.md)과
[기록 추가분·판정](outcome.json), [최종 해시](after-verification.json)를 직접 대조했다.

- 담당자는 설치 SKILL·AGENTS와 실제 원본/로드맵/관련 기록을 읽었다. 현재 완성된 관찰·자료와
  아직 제안인 14개 구간, 미정 거래/정책, 미관찰 주문 직전 구간을 구분했다. 새 정책·승인을 만들지 않았다.
- 실제 변경은 TASK의 확인 절 추가뿐. 기존 TASK bytes 전체를 앞부분에서 그대로 유지했다.
  전 `b470e6a2250dbd4b8ed0dfa3440664406816cf031e6373b0ac3dc4f6f2fa2c12`,
  후 `05daeeb230a1b1b29b8a3d830373b625fe4f640435023ef64cb4be26f4f765b8`.
- Product·승인 이력·ROADMAP·ISSUES·DESIGN·Library·설정·코드·개인 스킬 보호 확인.
  기록 불일치가 없어 ROADMAP/ISSUES를 형식상 수정하지 않았다. 기존 validator 근거도 반복하지 않았다.
- 최종 원문 응답은 여섯 개의 짧은 하이픈 항목을 사용했다. compact wait 응답은 서식을 평문으로
  요약했으므로 그 표시만으로 형식 실패를 판단하지 않고 read_thread의 원문을 확인했다.
- 부모 검사 `node evals/joeness-setup/runs/2026-10-07-geo-connection-pilot/verify-evidence.mjs`: PASS.
  개인관리9/다른스킬파일428/추적파일474·제품revision6/기존기록·설정 보존과 실행 소스 불변 확인.
  QA도 live snapshot, TASK 원문·이전 prefix, 설치 해시와 정확한 원격 CI를 직접 재대조해 한정 통과했다.

이번 추가 확인에서 제품 동작 규칙을 더 수정할 근거는 발견하지 못했다. 설치/연결/한정 기록 확인은
완료하며 같은 시험을 반복하지 않는다. 정식 출시와 일반화된 운영 품질 보장은 별개다.

## 실패·한계

- 후보 첫 개인 Check의 소유 manifest 불일치는 기대한 fail-closed이며 옛 설치 드리프트로 판정하지 않는다.
- `gh` CLI는 없었다. 공개 GitHub Actions API로 정확한 commit의 성공을 확인했다.
  보조 커넥터 첫 호출은 필수 commit_sha 인수 누락으로 실패했으며 설치·검사 결과와 무관하다.
- 기존 채팅의 명시 재독해이지 새 채팅 자동 주입 시험이 아니다. 일반 행동 개선, 성능/토큰 절감,
  실제 동시 쓰기 안전성, 자동 crash recovery, 제품 정책 승인·최종 사용자 수락은 검증하지 않는다.
- 실제 코드 구현이나 새 기획 정책 작성이 아니라 **현행 프로젝트의 설치 후 운영 기록 확인**이다.
  확인할 결함이 없으면 제품 지침을 더 늘리거나 같은 중립 시험을 반복하지 않는다.
- 개인 도구는 다음 턴에서 사용할 수 있다. 기존 열린 채팅은 최신 지침이 자동 갱신됐다고 가정하지 않는다.
  이번 GEO 채팅만 명시 재독해를 요청했다. 다른 프로젝트의 AGENTS는 일괄 변경하지 않았다.
