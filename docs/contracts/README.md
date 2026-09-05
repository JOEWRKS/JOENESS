# Shared Contracts

`docs/contracts/` contains the small set of cross-system contracts that multiple JOEWRKS systems must read from the same source.

## What belongs here

Only rules that two or more systems must agree on, such as:

- domain ownership boundaries;
- cross-system handoff boundaries;
- re-entry/routing boundaries;
- progression evidence boundaries.

Current contract:

- `JOEWRKS_CROSS_SYSTEM_AUTHORITY_V1.md` — JOEFLOW / Product Definition / JOEDESIGN / implementation / verification / user-acceptance ownership and handoff contract.

## What does not belong here

Do not put domain-internal workflow here.

Examples that stay in their owning system/project:

- JOEFLOW state-machine implementation;
- Product Definition closure logic;
- JOEDESIGN direction/proof/refinement workflow;
- project `DESIGN.md` content;
- implementation conventions;
- project-specific policy;
- plugin/vendor routing.

## Runtime boundary

This directory does **not** reactivate JOENESS runtime, Common Core, public skills, vendor routing, or any historical behavioral overlay. The repository is only the physical host for these shared documents.

## Loading policy

Do not load the whole JOENESS repository to consume a shared contract. Read the exact referenced contract only when needed, normally at:

- project/system bootstrap;
- cross-system handoff;
- authority conflict;
- bounded re-entry;
- contract version change.

Normal bounded work inside one already-authorized domain should continue from its local authority without reloading shared history.

## Change rule

Keep this area deliberately small. A proposed rule belongs here only when two or more systems must share the same boundary. If it can live entirely inside one system, it must stay there.
