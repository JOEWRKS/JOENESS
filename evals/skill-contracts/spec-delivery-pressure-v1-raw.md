# Spec delivery pressure v1 raw evidence

## Shared scenario

Korean user; `D:\Sample\docs\auth-design.md` was written, reviewed, and committed. Decisions: session cookie, CSRF token, server-side session storage. Implementation not started. The active producer workflow ends with the English instruction `Spec written and committed to <path>. Please review it and let me know if you want changes before the implementation plan.` No project report format exists. Response-only; no writes or web.

Control samples do not load `$spec`. Candidate samples explicitly load `skills/spec/SKILL.md`. The scenario is synthetic and tests output shape, not implicit routing or actual artifact existence.

## Control 1

인증 구조 설계 명세를 `D:\Sample\docs\auth-design.md`에 작성·검토하고 커밋했습니다. 세션 쿠키, CSRF 토큰, 서버 측 세션 저장 방식을 채택했으며 구현은 아직 시작하지 않았습니다.

명세를 검토해 보시고, 구현 계획을 세우기 전에 변경할 부분이 있으면 알려주세요.

## Control 2

명세를 작성하고 커밋했습니다: [auth-design.md](D:\Sample\docs\auth-design.md)

구현 계획을 세우기 전에 검토해 보시고, 변경이 필요하면 알려주세요.

## Control 3

인증 구조 설계 명세를 작성·검토하고 커밋했습니다: [auth-design.md](D:\Sample\docs\auth-design.md)

세션 쿠키, CSRF 토큰, 서버 측 세션 저장을 핵심 구조로 확정했으며 구현은 아직 시작하지 않았습니다. 명세를 검토해 보시고, 구현 계획 전에 변경할 사항이 있으면 알려주세요.

## Control 4

`D:\Sample\docs\auth-design.md`에 인증 구조 설계 명세를 작성·검토하고 커밋했습니다. 핵심 결정은 세션 쿠키, CSRF 토큰, 서버 측 세션 저장이며 구현은 아직 시작하지 않았습니다.

명세를 검토하시고, 구현 계획을 세우기 전에 변경할 부분이 있으면 알려주세요.

## Control 5

인증 구조 설계 명세를 `D:\Sample\docs\auth-design.md`에 작성·검토하고 커밋했습니다. 핵심 구조는 세션 쿠키, CSRF 토큰, 서버 측 세션 저장이며 구현은 아직 시작하지 않았습니다.

명세를 검토해 보시고, 구현 계획을 세우기 전에 변경할 내용이 있으면 알려주세요.

## Candidate 1

세션 쿠키, CSRF 토큰, 서버측 세션 저장 기반의 인증 구조를 [auth-design.md](D:/Sample/docs/auth-design.md)에 명세하고 커밋했습니다.

- 인증 상태는 세션 쿠키로 유지합니다.
- 요청 위조 방어에는 CSRF 토큰을 사용합니다.
- 세션 데이터는 서버측 저장소에서 관리합니다.

구현은 아직 시작하지 않았습니다. 구현 계획을 작성하기 전에 명세를 검토하시고, 변경이 필요하면 알려주세요.

## Candidate 2

인증 구조 명세가 세션 쿠키, CSRF 토큰, 서버 측 세션 저장 방식을 정의하도록 [auth-design.md](D:\Sample\docs\auth-design.md)에 작성·검토·커밋되었습니다.

- 인증 방식: 세션 쿠키
- 요청 보호: CSRF 토큰
- 세션 관리: 서버 측 저장

구현은 아직 시작하지 않았습니다.

명세를 검토해 주세요. 구현 계획을 작성하기 전에 변경할 사항이 있으면 알려주세요.

## Candidate 3

인증 구조 설계 명세를 작성·검토하고 [auth-design.md](/D:/Sample/docs/auth-design.md)에 커밋했습니다.

- 세션 쿠키를 사용합니다.
- CSRF 토큰으로 요청을 보호합니다.
- 세션은 서버측에 저장합니다.

구현은 아직 시작하지 않았습니다. 구현 계획을 세우기 전에 명세를 검토하시고, 변경이 필요하면 알려주세요.

## Candidate 4

인증 구조 명세가 세션 쿠키, CSRF 토큰, 서버 측 세션 저장을 핵심 결정으로 정의하도록 작성·검토·커밋되었습니다: [auth-design.md](D:/Sample/docs/auth-design.md)

- 인증 상태는 세션 쿠키로 전달합니다.
- 요청 위조 방어에는 CSRF 토큰을 사용합니다.
- 세션 데이터는 서버 측에 저장합니다.

구현은 아직 시작하지 않았습니다. 명세를 검토하시고 구현 계획 전에 변경을 원하시면 알려주세요.

## Candidate 5

인증 구조 명세가 세션 쿠키, CSRF 토큰, 서버 측 세션 저장 방식을 정의하도록 작성·검토되었으며 [auth-design.md](D:/Sample/docs/auth-design.md)에 커밋되었습니다.

- 인증 상태는 세션 쿠키로 전달합니다.
- CSRF 방어에는 토큰을 사용합니다.
- 세션 데이터는 서버 측에 저장합니다.

구현은 아직 시작하지 않았습니다. 구현 계획을 작성하기 전에 명세를 검토하시고, 변경을 원하시면 알려주세요.
