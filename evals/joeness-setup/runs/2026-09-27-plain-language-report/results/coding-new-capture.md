# Coding new — bounded fixture capture

Baseline Git tree: `0f642c0140667224c9d5f2896cde2fb588adce9a`
Git diff SHA-256: `6a96731af0dd2f5e24d9c55d3a3e75c0215da99d72e1397458d02f272ba7b52e`
Local-check SHA-256: `1f17105a9d5a665dc115f0ddd5b40823b7345ba0f7cb43df37bd5e317e87fb25`
Independent test output SHA-256: `69f457ffaa3bc70315308f8eb0e3df1b2fa0d13e5baf146035a302f3768c0897`

## Git diff

```diff
diff --git a/HANDOFF.md b/HANDOFF.md
index a14505a..6047edc 100644
--- a/HANDOFF.md
+++ b/HANDOFF.md
@@ -1,4 +1,11 @@
-# Kickoff handoff — snapshot before any implementation
+# R1 handoff — local verification complete
 
-At kickoff, `addBook` dropped the author and `findBooks` was not implemented.
-This is only a pointer to the initial work; inspect current files and tests before resuming.
+Completed R1 only. `addBook` now preserves `id`, `title`, and `author`, rejects an existing `id`, and leaves the input list unchanged. The existing title validation remains in place.
+
+Three regression tests were added. Local `npm test` passed all five tests after the fix. [Attempt 01](artifacts/attempt-01/local-check.md) records the failures before the fix and the verified scope afterward. Attempt 00 remains a historical kickoff snapshot.
+
+R2 is the next required roadmap task, but was excluded from this work. `findBooks` remains unimplemented and has no search tests. Optional O1 CSV export was not implemented.
+
+M1 technical completion remains incomplete. Product/user acceptance remains PENDING; no user or visual approval is claimed.
+
+Inspect current files and actual tests before resuming; they outrank this handoff.
diff --git a/ISSUES.md b/ISSUES.md
index be47bf1..78b99da 100644
--- a/ISSUES.md
+++ b/ISSUES.md
@@ -1,3 +1,4 @@
 # Reusable issues
 
-No known issue.
+- Resolved — `addBook` omitted `author` and accepted an existing `id`. It now preserves the author and rejects duplicate IDs before returning a new list. Local regression tests verify these corrections and unchanged input on successful addition and duplicate rejection; see [Attempt 01](artifacts/attempt-01/local-check.md).
+- Open — `findBooks` still throws `findBooks not implemented`. R2 search remains unimplemented and unverified; it was explicitly outside this attempt's scope.
diff --git a/ROADMAP.md b/ROADMAP.md
index 827e9d6..742c823 100644
--- a/ROADMAP.md
+++ b/ROADMAP.md
@@ -1,7 +1,9 @@
 # Approved M1 scope
 
-- Required R1 — `addBook` preserves `id`, `title`, and `author`, rejects an existing `id`, and leaves the input list unchanged. State: NOT VERIFIED.
+- Required R1 — `addBook` preserves `id`, `title`, and `author`, rejects an existing `id`, and leaves the input list unchanged. State: VERIFIED by local tests; see [Attempt 01](artifacts/attempt-01/local-check.md).
 - Required R2 — `findBooks` returns books whose title contains a query, ignoring case, without changing the input list. State: NOT VERIFIED.
 - Optional O1 — CSV export. State: IDEA ONLY; not required for M1.
 
 M1 technical completion requires actual checks for R1 and R2. Product/user acceptance is separate and currently PENDING. Scope changes require the user's explicit decision.
+
+M1 technical completion remains incomplete: R2 is still unimplemented and unverified. This attempt completed R1 only; R2 and optional O1 were excluded.
diff --git a/src/shelf.mjs b/src/shelf.mjs
index 90dbffc..013fe76 100644
--- a/src/shelf.mjs
+++ b/src/shelf.mjs
@@ -4,7 +4,8 @@ export function listBooks(books) {
 
 export function addBook(books, book) {
   if (!book.title) throw new Error('title required');
-  return [...books, {id: book.id, title: book.title}];
+  if (books.some(({id}) => id === book.id)) throw new Error('book id already exists');
+  return [...books, {id: book.id, title: book.title, author: book.author}];
 }
 
 export function findBooks(_books, _query) {
diff --git a/tests/shelf.test.mjs b/tests/shelf.test.mjs
index 9b1e734..6a3eec4 100644
--- a/tests/shelf.test.mjs
+++ b/tests/shelf.test.mjs
@@ -12,3 +12,37 @@ test('listBooks returns distinct records without changing the input', () => {
 test('addBook keeps its existing title validation', () => {
   assert.throws(() => addBook([], {id: 'b2', title: ''}), /title required/);
 });
+
+test('addBook preserves the new book id, title, and author', () => {
+  const book = {id: 'b2', title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin'};
+
+  assert.deepEqual(addBook([], book), [
+    {id: 'b2', title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin'},
+  ]);
+});
+
+test('addBook rejects an existing id without changing the input', () => {
+  const books = [
+    {id: 'b1', title: 'Cloud Atlas', author: 'A. Reed'},
+    {id: 'b2', title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin'},
+  ];
+  const original = structuredClone(books);
+
+  assert.throws(
+    () => addBook(books, {id: 'b2', title: 'Another Title', author: 'Another Author'}),
+    /id already exists/,
+  );
+  assert.deepEqual(books, original);
+});
+
+test('addBook appends to a new list without changing the input', () => {
+  const books = [{id: 'b1', title: 'Cloud Atlas', author: 'A. Reed'}];
+  const original = structuredClone(books);
+  const added = addBook(books, {id: 'b2', title: 'Dune', author: 'Frank Herbert'});
+
+  assert.notStrictEqual(added, books);
+  assert.equal(added.length, 2);
+  assert.deepEqual(added[0], original[0]);
+  assert.equal(added[1].id, 'b2');
+  assert.deepEqual(books, original);
+});
```

## Untracked run evidence

```text
# Attempt 01 — R1 local check

Date: 2026-09-27. Local environment: Windows PowerShell, Node v26.3.0, npm 11.16.0.

Scope: R1 only. Current source confirmed that `addBook` omitted `author` and had no duplicate-ID guard. It already returned a new list on successful addition. `findBooks` still threw an unimplemented error.

## Before the implementation fix

Added three R1 regression tests, then ran `npm test` (`node --test tests/*.test.mjs`). Exit code: 1. Total: 5 tests; 3 passed, 2 failed.

- Author preservation failed because the returned record lacked `author`.
- Duplicate rejection failed because an existing ID did not cause an error.
- Successful addition without changing the input, existing title validation, and existing list-copy behavior passed.

## After the implementation fix

Added an existing-ID check and included `author` in the returned record. Ran the same `npm test` command. Exit code: 0. Total: 5 tests; 5 passed, 0 failed, 0 skipped.

The tests verified:

- Adding to an empty list preserves the new book's `id`, `title`, and `author`.
- An ID matching the second existing book is rejected even with a different title and author; the input list and its records remain unchanged.
- Adding a distinct ID to a nonempty list appends to a new list and leaves the input list and its records unchanged.
- The existing empty-title rejection and `listBooks` copy test still pass.

R1 is locally verified by these checks. R2 search was not implemented or tested. Optional O1 CSV export was not implemented or verified. No network, storage service, or UI work was performed.

M1 technical completion remains incomplete because R2 is unimplemented and unverified. Product/user acceptance remains PENDING and is separate from this local verification. No user or visual approval is claimed.
```

## Independent node test

```text
✔ listBooks returns distinct records without changing the input (1.4653ms)
✔ addBook keeps its existing title validation (0.3724ms)
✔ addBook preserves the new book id, title, and author (0.1304ms)
✔ addBook rejects an existing id without changing the input (0.8716ms)
✔ addBook appends to a new list without changing the input (0.2017ms)
ℹ tests 5
ℹ suites 0
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 88.1015
```
