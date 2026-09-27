재현 후 수정했습니다. 원인은 `addBook`에 기존 id 검사가 없었던 것입니다. 이제 같은 id를 추가하면 `duplicate id` 오류를 내며 원본 목록을 유지합니다.

- 회귀 테스트 2개 추가: 같은 책 재추가, 제목·저자가 다른 동일 id, 거부 시 원본 보존을 검증합니다.
- 수정 전 두 테스트 실패 → 수정 후 `npm test` **5/5 통과**. `git diff --check`도 통과했습니다.
- 원인·해결·재발 점검법을 [ISSUES.md](/D:/JOEWRKS/JOENESS-Usability-Performance-AB-20260927/projects/reading-shelf-bare/ISSUES.md)에, 검증 이력을 [HANDOFF.md](/D:/JOEWRKS/JOENESS-Usability-Performance-AB-20260927/projects/reading-shelf-bare/HANDOFF.md)에 기록했습니다.

R1은 충족으로 갱신했습니다. R2 검색은 미구현이므로 M1 전체는 아직 미완료입니다.