# Setup-only 개발 후보의 Windows 출시 검사

검증 대상: `codex/joeness-context-routing`의 `e30f1fd67c0bfc73e089f1a30f89deaefe0e125e` (tree `9210ff6d8b85397c9ea6208a0b249ca43e01b215`). `vendor/source-manifest.json` SHA-256 `a9f83b60ef4890964ec0e232ce2825d5ba16772fba1fbd1e0017cf9e02d30c61`, 버전 `0.3.0-beta.3-dev`. Manifest가 지정한 단일 스킬 파일 9개의 SHA-256 불일치 0건. 검사 전 작업본은 미수정 상태였고 전체 Git 이력이 있었다.

## 로컬 Windows 실행

현재 후보 작업본에서 `.github/workflows/windows-ci.yml`과 같은 순서로 실행했다.

- Windows PowerShell: `tests/joeness-release.tests.ps1` PASS.
- PowerShell 7 및 Windows PowerShell: `tests/joeness-project-setup.tests.ps1` 각각 25개 안전성 사례 PASS.
- Windows PowerShell 및 PowerShell 7: `tests/joeness-install.tests.ps1` 각각 PASS.
- Node: setup contract/fixture 9 PASS, 0 FAIL.
- `git diff --check main...HEAD`: 종료 코드 0.

## 원격의 깨끗한 checkout

후보 브랜치만 원격에 올려 [Windows current release gate #193](https://github.com/JOEWRKS/JOENESS/actions/runs/36596244278)를 실행했다. GitHub Actions의 `windows-latest`에서 전체 이력 checkout, release contract, setup/package contract, diff whitespace 단계가 모두 `success`였고 run 전체 결론도 `success`다. 해당 run의 `head_sha`는 위 검증 대상과 일치한다. 기본 브랜치, 개인 설치, 출시 태그는 변경하지 않았다.

`README.md`는 Windows PowerShell·Git·Codex 지원 경계와 Git root/UTF-8 자동 설정, 비Git 폴더의 제한, 이전 설치 안전 갱신, 토큰·성능 보장 부재, 해제 방법을 이미 설명한다. 이번에 제품 소스나 안내 규칙은 변경하지 않았다.

## 남은 경계

이는 `-dev` 후보 한 커밋의 출시 검사 통과다. 정식 출시 버전/최종 커밋 고정, 변경 내용 리뷰, 기본 브랜치 반영, 반영본에서의 재설치 확인, 사용자 최종 출시는 미완이다. 해당 단계의 테스트를 이 결과로 대신 완료 처리하지 않는다.
