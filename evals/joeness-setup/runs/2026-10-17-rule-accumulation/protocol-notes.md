# Execution notes

Pre-run hashes:
- plan.md: e455b41fbb4872011552c06a91a6f7e3c3fcf4d47403ec4c84725deb81d93409
- fixtures.json: 1b125490715670de6824c3a88c2dbd470e0aac864cafda66eb4e6e1c59a9dcb8

g3 stage 1 dispatch accidentally rendered part of the common prohibition sentence
in Japanese (no external skills/additional agents/messages/commit/push). Immediately
sent the exact Korean clause as an in-turn correction, with no added scope, answer,
or creative advice. Preserve this deviation in actual-message provenance; no task
restart. Other prompts use the frozen Korean text. This is not a product defect.

Environment audit during stage 4: fork_turns=none removes conversational history,
but the host still injects the parent working directory's JOENESS Repository
AGENTS instructions. These include release/preservation boundaries and a prior
Bare/Core equivalence statement, not the setup runtime connection. Both arms
share this environment. Record role/instruction hashes in execution.json;
inspect equality rather than calling A a raw/uninstructed model. This common
priming and inherited repository context limit external validity. Do not rerun
or change prompts mid-experiment to conceal it.

All eight worker contexts received the same serialized root-instruction message
SHA-256 ca99f59181fe14b179dafaffc39278ab9452f6427d560f6ea61cb6c1e2a68ee8.
This does not establish an unprimed comparison; it establishes a shared measured
repository instruction block. The host's general developer instructions are
also present, so A means no project JOENESS setup treatment, not no instructions.

Natural trajectory difference: g4 (A notes) implemented backup in stage 1 before
the scheduled stage 3 request. Stage 3 therefore extended that existing feature.
This was not deleted or forced into a different history to improve symmetry.
The same requests do not imply equal intermediate code or equal work difficulty.
