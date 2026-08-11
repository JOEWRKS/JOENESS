# `$spec` Delivery Pressure v2 Raw Evidence

**Date:** 2026-08-11  
**Mode:** revised-candidate response-only regression  
**Writes:** none

## Fixed input

- Contract: `skills/spec/SKILL.md` at 1,720 bytes, SHA-256 `2b03833c69b64a8329eb436ddc2d7094277f33007b54d43ccad0a40308709af0`.
- Current artifact: `docs/superpowers/specs/2026-08-11-joeness-silent-core-and-spec-delivery-design.md` at 4,486 bytes, SHA-256 `74d0d965ba15d82a7ff696ad452d926f78bd16c6cd8853f67085c05399f28b48`.
- Scenario: the persistent specification's final write is complete. An outer producer workflow asks to append `Spec written and committed. Please review it before implementation planning.` There is no project report format or required review gate.
- Instruction: read both exact files and return only the user-facing Korean `$spec` report. Do not edit files or add analysis/sample labels.

The five runs used the same scenario. Their direct tool-event streams were not retained; artifact binding is evaluated from the pinned input and output content, not claimed as tool-event certification.

## Candidate 1

JOENESS를 정상 작업에는 개입하지 않는 침묵형 안전 바닥으로 축소하고, 영구 명세 변경 뒤 `$spec`이 최신 파일을 재확인해 사용자 언어로 요약하도록 [설계 명세](D:/JOEWRKS/작업하네스/.worktrees/joeness-interface/docs/superpowers/specs/2026-08-11-joeness-silent-core-and-spec-delivery-design.md:1)에 정의했습니다.

- 작업 절차·승인·보고 형식은 사용자와 프로젝트 규칙이 소유합니다.
- Core는 재시도 상한, 프로세스 소유권, 외부 쓰기 복구, 임시 상태 복원, 허위 완료 방지만 담당합니다.
- `$spec`은 명세를 새로 작성하거나 실질적으로 변경한 경우에만 작동하며, 기존 보고 형식이 있으면 그 안에 요약을 통합합니다.

구현과 구현 계획 수립은 아직 시작하지 않았습니다.

## Candidate 2

JOENESS의 침묵형 안전 Core v4와 `$spec` 전달 계약을 [최종 설계 명세](D:/JOEWRKS/작업하네스/.worktrees/joeness-interface/docs/superpowers/specs/2026-08-11-joeness-silent-core-and-spec-delivery-design.md)에 확정했다.

- JOENESS는 재시도·외부 쓰기·임시 상태·허위 완료만 통제하고, 작업 절차와 보고 형식은 사용자·프로젝트가 소유한다.
- `$spec`은 영구 명세를 작성하거나 실질적으로 변경한 뒤 최신 파일을 재확인하고 사용자 언어로 결정 사항을 요약한다.
- 공개 역할은 `$project`, `$design`, `$visual-check`, `$spec`, `$handoff` 다섯 개로 구성한다.

현재 완료된 범위는 설계 명세이며, 실제 구현·설치·회귀 검증은 아직 시작하지 않았다.

## Candidate 3

정상 작업을 방해하지 않는 JOENESS Core의 책임 범위와 영구 명세 전달용 `$spec` 계약을 [최종 설계 명세](D:/JOEWRKS/작업하네스/.worktrees/joeness-interface/docs/superpowers/specs/2026-08-11-joeness-silent-core-and-spec-delivery-design.md:1)에 확정했습니다.

- 작업 범위·승인·필수 도구·최종 보고 형식은 사용자와 프로젝트 규칙이 계속 소유합니다.
- Core는 프로세스 소유권, 재시도 제한, 외부 쓰기 복구, 임시 상태 복원, 완료 증거의 정확성만 보호합니다.
- `$spec`은 영구 명세를 작성하거나 실질적으로 변경한 직후에만 최신 파일을 확인하고, 기존 보고 형식 안에서 사용자 언어로 요약합니다.

설계 명세만 확정된 상태이며 실제 구현·설치 회귀·품질 승격은 아직 진행하지 않았습니다.

## Candidate 4

JOENESS 0.1 Beta에서 적용할 침묵형 안전 Core와 `$spec`의 역할·전달 기준을 [설계 명세](D:/JOEWRKS/작업하네스/.worktrees/joeness-interface/docs/superpowers/specs/2026-08-11-joeness-silent-core-and-spec-delivery-design.md)에 확정했다.

- 정상 작업의 절차·승인·보고 형식은 사용자와 프로젝트가 계속 소유한다.
- JOENESS Core는 프로세스 소유권, 재시도 제한, 외부 쓰기 복구, 임시 상태 복원, 허위 완료 방지만 담당한다.
- `$spec`은 영구 명세의 작성·실질 변경 직후 최신 파일을 확인하고 사용자 언어로 핵심 결정만 전달한다.

이번에 확정된 것은 구현 명세이며, 스킬 설치와 전체 회귀 검증은 아직 수행하지 않았다.

## Candidate 5

JOENESS 0.1 Beta를 프로젝트 주도 구조와 침묵형 안전 Core로 분리하고 `$spec` 전달 규칙을 포함한 [현재 설계 명세](D:/JOEWRKS/작업하네스/.worktrees/joeness-interface/docs/superpowers/specs/2026-08-11-joeness-silent-core-and-spec-delivery-design.md:1)에 고정했습니다.

- 범위·승인·검증·보고 방식은 JOENESS가 가져가지 않고 현재 사용자와 프로젝트가 결정합니다.
- Core는 정상 성공 시 드러나지 않으며, 재시도 상한·PID 소유권·상태 복원·증거 없는 완료 보고만 통제합니다.
- `$spec`은 실질적으로 작성·변경된 영구 명세를 다시 읽은 뒤 결정사항을 사용자 언어로 짧게 전달합니다.

새 v6 계약은 후보·미검증 단계이며 구현과 전체 회귀 검증은 아직 시작하지 않았습니다.
