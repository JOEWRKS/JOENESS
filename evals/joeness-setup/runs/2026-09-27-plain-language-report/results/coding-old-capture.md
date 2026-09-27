# Coding old — bounded fixture capture

Baseline Git tree: `0f642c0140667224c9d5f2896cde2fb588adce9a`
Git diff SHA-256: `e666cf7f223db7f84a02c735a1b6ae148665aa5eda819a46da477cffee742f74`
Local-check SHA-256: `811ebd1b87019d35c023248defa40c99fd5cca8747f31101e661363d3c55b9ff`
Independent test output SHA-256: `42200d01e404e355c7924810b67b8b055d665a533c3c82e7a342af8e73e0bcc5`

## Git diff

```diff
diff --git a/HANDOFF.md b/HANDOFF.md
index a14505a..f095f6e 100644
--- a/HANDOFF.md
+++ b/HANDOFF.md
@@ -1,4 +1,9 @@
-# Kickoff handoff — snapshot before any implementation
+# Current handoff — R1 local verification
 
-At kickoff, `addBook` dropped the author and `findBooks` was not implemented.
-This is only a pointer to the initial work; inspect current files and tests before resuming.
+- Completed only R1: `addBook` now preserves `id`, `title`, and `author`, rejects an existing `id`, and returns a new list without changing the input list or its records. Existing title validation remains in place.
+- Added regression tests for successful addition and duplicate rejection, including input preservation. The final `npm test` run passed all four tests. Run-specific evidence: `artifacts/attempt-01/local-check.md`.
+- R2 remains unimplemented and NOT VERIFIED. `findBooks` still throws an unimplemented error; no search behavior was tested. R2 is the next required roadmap task, outside this completed assignment.
+- Optional O1 CSV export remains IDEA ONLY; no implementation or verification was performed.
+- M1 technical completion has not been established. Product/user acceptance remains PENDING; no user or visual approval is claimed.
+
+The kickoff snapshot in `artifacts/attempt-00/local-check.md` is historical: its author-loss observation has been corrected, while search remains unimplemented. Inspect current files and actual test results before resuming.
diff --git a/ISSUES.md b/ISSUES.md
index be47bf1..cb72dc2 100644
--- a/ISSUES.md
+++ b/ISSUES.md
@@ -1,3 +1,4 @@
 # Reusable issues
 
-No known issue.
+- Resolved — `addBook` omitted `author` and accepted an existing `id`. Added author preservation and duplicate rejection, with passing regression tests. Successful addition and duplicate rejection both leave the input list and its records unchanged. Evidence: `artifacts/attempt-01/local-check.md`.
+- Open, outside this assignment — R2 title search remains unimplemented: source inspection confirms `findBooks` still throws an unimplemented error. Search behavior is NOT VERIFIED. M1 technical completion remains pending.
diff --git a/ROADMAP.md b/ROADMAP.md
index 827e9d6..711b628 100644
--- a/ROADMAP.md
+++ b/ROADMAP.md
@@ -1,6 +1,6 @@
 # Approved M1 scope
 
-- Required R1 — `addBook` preserves `id`, `title`, and `author`, rejects an existing `id`, and leaves the input list unchanged. State: NOT VERIFIED.
+- Required R1 — `addBook` preserves `id`, `title`, and `author`, rejects an existing `id`, and leaves the input list unchanged. State: VERIFIED by local tests; see `artifacts/attempt-01/local-check.md`.
 - Required R2 — `findBooks` returns books whose title contains a query, ignoring case, without changing the input list. State: NOT VERIFIED.
 - Optional O1 — CSV export. State: IDEA ONLY; not required for M1.
 
diff --git a/src/shelf.mjs b/src/shelf.mjs
index 90dbffc..afd0e05 100644
--- a/src/shelf.mjs
+++ b/src/shelf.mjs
@@ -4,7 +4,8 @@ export function listBooks(books) {
 
 export function addBook(books, book) {
   if (!book.title) throw new Error('title required');
-  return [...books, {id: book.id, title: book.title}];
+  if (books.some(({id}) => id === book.id)) throw new Error('duplicate id');
+  return [...books, {id: book.id, title: book.title, author: book.author}];
 }
 
 export function findBooks(_books, _query) {
diff --git a/tests/shelf.test.mjs b/tests/shelf.test.mjs
index 9b1e734..4a89028 100644
--- a/tests/shelf.test.mjs
+++ b/tests/shelf.test.mjs
@@ -12,3 +12,32 @@ test('listBooks returns distinct records without changing the input', () => {
 test('addBook keeps its existing title validation', () => {
   assert.throws(() => addBook([], {id: 'b2', title: ''}), /title required/);
 });
+
+test('addBook preserves book fields without changing the input list', () => {
+  const books = [{id: 'b1', title: 'Cloud Atlas', author: 'A. Reed'}];
+  const before = structuredClone(books);
+  const book = {id: 'b2', title: 'Night Garden', author: 'B. Lane'};
+
+  const result = addBook(books, book);
+
+  assert.deepEqual(books, before);
+  assert.notStrictEqual(result, books);
+  assert.deepEqual(result, [
+    {id: 'b1', title: 'Cloud Atlas', author: 'A. Reed'},
+    {id: 'b2', title: 'Night Garden', author: 'B. Lane'},
+  ]);
+});
+
+test('addBook rejects an existing id without changing the input list', () => {
+  const books = [
+    {id: 'b1', title: 'Cloud Atlas', author: 'A. Reed'},
+    {id: 'b2', title: 'Night Garden', author: 'B. Lane'},
+  ];
+  const before = structuredClone(books);
+
+  assert.throws(
+    () => addBook(books, {id: 'b2', title: 'Another Book', author: 'C. Park'}),
+    /duplicate id/,
+  );
+  assert.deepEqual(books, before);
+});
```

## Untracked run evidence

```text
# Attempt 01 — R1 local check

Scope: R1 only. No R2 search or optional O1 CSV implementation was authorized or performed. `PRODUCT.md` and `DESIGN.md` remain unchanged.

## Observed starting state

- Current source confirmed that `addBook` omitted `author` and had no duplicate-ID check. It already returned a new list using array spread.
- `findBooks` still threw `findBooks not implemented`, consistent with the kickoff snapshot. This is a source observation, not search behavior verification.
- Baseline `npm test`: 2 tests passed, 0 failed, exit code 0. These checked `listBooks` and existing title validation, not the full R1 contract.

## Changes and actual test runs

- Added two regression tests in `tests/shelf.test.mjs`:
  - Successful addition preserves the existing record and the new book's `id`, `title`, and `author`, returns a distinct list, and leaves the input list and records equal to a pre-call snapshot.
  - Adding an ID already present in the second input record throws `duplicate id`, even with a different title and author, and leaves the input list and records equal to a pre-call snapshot.
- With the new tests and before the source fix, `npm test`: 2 passed, 2 failed, exit code 1. Failures showed the missing author and missing duplicate-ID exception.
- Updated `src/shelf.mjs` to copy `author` and reject an existing ID using strict equality before returning the new list. Existing title validation was retained.
- After the source fix, `npm test`: 4 passed, 0 failed, 0 skipped, exit code 0. Both new regression tests and both existing tests passed.

## Verification boundary

R1 is verified by these local automated checks. R2 is unimplemented and NOT VERIFIED; no search tests were added or run. Optional O1 remains IDEA ONLY and was not implemented or checked. M1 technical completion has not been established. Product/user acceptance remains PENDING, and no visual approval is in scope or claimed.

The previous `artifacts/attempt-00/local-check.md` is retained as historical run evidence. Its author-loss observation no longer describes the current implementation.
```

## Independent node test

```text
✔ listBooks returns distinct records without changing the input (1.6185ms)
✔ addBook keeps its existing title validation (0.4512ms)
✔ addBook preserves book fields without changing the input list (0.2673ms)
✔ addBook rejects an existing id without changing the input list (0.1936ms)
ℹ tests 4
ℹ suites 0
ℹ pass 4
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 91.9639
```
