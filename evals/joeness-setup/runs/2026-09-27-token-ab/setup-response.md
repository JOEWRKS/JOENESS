- 작업: 제품 기준에 맞게 라벨 대문자 표시 수정 완료
- 업데이트 파일: label.mjs, TASK.md, ISSUES.md
- 이슈: 공백 제거 후 소문자로 변환하던 코드
- 해결: 대문자 변환으로 수정, 관련 테스트 2개 통과
- 남은 문제: 없음
- 다음 작업: 없음

상세 보고

`toLowerCase()`를 `toUpperCase()`로 변경했습니다. `node --test cases/C/label.test.mjs`는 수정 전 1개 실패했고, 수정 후 2개 모두 통과했습니다. 공백 제거와 비문자열 입력 거부 동작도 유지됩니다.

확인된 원인·수정·검증을 [작업 기록](/D:/JOEWRKS/JOENESS-TokenAB-Setup-20260927/cases/C/TASK.md)과 [문제 기록](/D:/JOEWRKS/JOENESS-TokenAB-Setup-20260927/cases/C/ISSUES.md)에 남겼습니다. 다른 case와 기존 평가 기록은 변경하지 않았습니다.