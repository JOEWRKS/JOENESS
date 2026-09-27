Case C를 현재 제품 기준인 **공백 제거 후 대문자 표시**로 수정했습니다.

- 원인: `normalizeLabel`이 `toLowerCase()`를 호출하고 있었습니다. 이를 `toUpperCase()`로 변경했습니다.
- 검증: `node --test cases/C/label.test.mjs` 실행 결과, 수정 전 1개 실패 → 수정 후 **2개 모두 통과**했습니다.
- 기록: [TASK.md](/D:/JOEWRKS/JOENESS-TokenAB-Bare-20260927/cases/C/TASK.md)와 [ISSUES.md](/D:/JOEWRKS/JOENESS-TokenAB-Bare-20260927/cases/C/ISSUES.md)에 원인·수정·검증과 재발 경위가 아직 확인되지 않았다는 한계를 남겼습니다.

다른 case와 기존 평가 기록은 변경하지 않았습니다.