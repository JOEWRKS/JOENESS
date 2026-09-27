- 작업: 라벨 대문자 표시 오류 수정
- 업데이트 파일: [label.mjs](/D:/JOEWRKS/JOENESS-ReportNoOpen-20260927/cases/C/label.mjs), [TASK.md](/D:/JOEWRKS/JOENESS-ReportNoOpen-20260927/cases/C/TASK.md), [ISSUES.md](/D:/JOEWRKS/JOENESS-ReportNoOpen-20260927/cases/C/ISSUES.md)
- 이슈: `toLowerCase()` 호출이 대문자 표시 기준 위반
- 해결: `toUpperCase()`로 수정, 관련 테스트 2개 통과
- 남은 문제: 없음
- 다음 작업: 없음

수정 전 테스트 실패로 오류를 재현했고, 수정 후 모두 통과했습니다. 공백 제거와 문자열 타입 검사는 유지했습니다.

확인된 원인·수정·검증을 작업 및 문제 기록에 남겼습니다. 다른 case와 기존 평가 기록은 변경하지 않았습니다.