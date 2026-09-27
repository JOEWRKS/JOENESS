# Attempt 00 — kickoff local check

The two existing tests passed at kickoff. This run-specific proof did not
exercise author preservation, duplicate IDs, or title search. It does not
establish completion of the approved milestone.

Observed source at this attempt: `addBook` returned `id` and `title` but not
`author`; `findBooks` threw an unimplemented error. Inspect current files
before relying on this snapshot.
