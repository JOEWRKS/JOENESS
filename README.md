# JOENESS

> GPT-6 Astra-native / zero runtime

GPT-6 Astra에서는 JOENESS runtime 설치가 기본적으로 필요하지 않습니다.

JOENESS 연구에서 검증한 작업 안전 보정은 현재 Bare Astra에서 고유 이점을 입증하지 못했기 때문에 기본 runtime overlay를 제공하지 않습니다. 이는 Bare Astra에서 미래 실패가 불가능하다는 뜻이 아니라, 현재 증거로 별도 행동 규칙을 설치할 근거가 없다는 뜻입니다.

이 저장소는 Astra-native baseline, 이전 GPT-5.6 호환성, 평가 evidence, 기존 설치의 안전한 제거 경로를 보존합니다. `skills/**`와 `vendor/**`는 선택 가능한 미래 참고 자료 또는 역사 source이며 active runtime이나 기본 설치 항목이 아닙니다.

## Astra-native 상태 확인

새 환경에서는 다음 읽기 전용 확인만 필요합니다.

```powershell
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
```

JOENESS가 관리하는 runtime이나 상태가 없으면 `current`와 `changesRequired: false`를 반환합니다. Apply를 실행하라는 안내나 빈 설치를 만들지 않습니다.

`Apply`는 Astra-native 배포에서 지원되지 않는 명시적 no-op입니다. 파일을 설치하거나 기존 GPT-5.6 설치를 자동 제거하지 않습니다.

## 이전 GPT-5.6 설치 제거

`Check`가 정확히 지원되는 GPT-5.6 Control 설치를 확인하면 `legacy`를 반환하고 명시적 제거가 가능하다고 알립니다. 먼저 확인하세요.

```powershell
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
```

그 결과가 `legacy`일 때만 다음 제거 작업을 실행합니다.

```powershell
powershell.exe -NoProfile -File .\JOENESS.ps1 -Remove
```

Remove는 설치 manifest, ownership ledger, source hash, 관리 marker가 모두 정확할 때만 진행합니다. 영향을 받는 파일의 전체 변경 전 bytes를 백업하고 다시 읽어 확인한 뒤 JOENESS 소유 runtime과 상태만 제거합니다. `AGENTS.md`의 관리 block 밖 bytes, 관리 폴더 안의 비관리 파일, 그 밖의 사용자 소유 파일은 그대로 보존합니다.

파일이나 ownership 정보가 달라졌거나 출처를 확정할 수 없으면 `blocked`로 멈추며 자동 수정이나 부분 제거를 완료로 보고하지 않습니다.

## 보존 범위

- GPT-5.6 Control, Lean Candidate, Lean Readiness의 Git identity
- 1,690-byte Lean Kernel과 그 exact hash
- 기존 평가 결과와 거절·대체 이력
- TrackB Astra rebaseline 및 stress-falsification evidence
- 향후 선택을 위한 skills와 vendor source

평가 자료는 active distribution manifest에 포함되지 않습니다. 새로운 행동 규칙은 실제로 관찰된 Astra 실패와 그 규칙의 고유한 개선 증거가 있을 때만 검토합니다.

## English Guide

JOENESS requires no runtime installation by default for GPT-6 Astra.

The safety overlay studied by JOENESS did not demonstrate a unique benefit over Bare Astra in the current evidence. This does not claim that Bare Astra can never fail; it means the evidence does not justify installing a behavioral overlay now.

This repository preserves the Astra-native baseline, GPT-5.6 compatibility, evaluation evidence, and a fail-closed removal path for supported legacy installs. Files under `skills/**` and `vendor/**` are optional future references or historical source, not active runtime or default installation payload.

For a new environment, run only the read-only check:

```powershell
powershell.exe -NoProfile -File .\JOENESS.ps1 -Check
```

A clean Astra environment returns `current` with `changesRequired: false`. Apply is an explicit unsupported no-op and never installs an empty distribution or automatically removes a historical Control install.

For legacy removal, run Check first. Only an exact supported GPT-5.6 Control installation returns `legacy`. Then removal must be explicitly requested:

```powershell
powershell.exe -NoProfile -File .\JOENESS.ps1 -Remove
```

Remove validates exact ownership and source identities, backs up and reads back affected files, removes only JOENESS-owned bytes and state, preserves unmanaged and user-owned bytes, and verifies cleanup. Drifted, forged, or uncertain ownership returns `blocked` without repair or partial removal.
