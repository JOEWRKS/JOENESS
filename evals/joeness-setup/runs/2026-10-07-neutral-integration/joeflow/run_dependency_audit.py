"""T008 read-only JOEFLOW integration proof over a synthetic evidence copy.

This script imports the installed JOEFLOW runtime by absolute path, reads the
repository M6 dogfood only as an immutable approved test baseline, and writes
all generated artifacts beside this script. It never writes either source.
"""

from __future__ import annotations

import copy
import hashlib
import json
import subprocess
import sys
from pathlib import Path


HERE = Path(__file__).resolve().parent
INSTALLED = Path(r"C:\Users\tjdwo\.codex\skills\joewrks-product-definition")
REPOSITORY = Path(r"D:\JOEWRKS\JOEWRKS-Product")
DOGFOOD = REPOSITORY / "evals" / "core-semantic-closure-v2-m6" / "dogfood"
SOURCE_STATE = DOGFOOD / "product-definition" / "client-feedback-portal-dogfood-v2" / "state.json"
SOURCE_HANDOFF = DOGFOOD / "handoff-definition.json"

sys.path[:0] = [str(INSTALLED), str(INSTALLED / "scripts")]

from approval_v2 import (  # noqa: E402
    approval_manifest_digest,
    compute_approval_manifest,
    definition_digest,
)
from authority_binding_v2 import canonical_record_index, sha256_json  # noqa: E402
from discovery_v2 import build_discovery_baseline  # noqa: E402
from downstream_v2.seeds import build_closed_source_seed_inventory  # noqa: E402
from downstream_v21.audit import audit_action_contract_v21_against_state  # noqa: E402
from downstream_v21.compiler import compile_handoff_definition_v21  # noqa: E402
from integration_v2.dogfood_v21 import translate_handoff_v20_to_v21  # noqa: E402
from state_validation_v2 import evaluate_closure_v2, validate_state_v2  # noqa: E402


def canonical_bytes(value: object) -> bytes:
    return json.dumps(
        value,
        ensure_ascii=False,
        allow_nan=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")


def load_json(path: Path) -> dict[str, object]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(name: str, value: object) -> None:
    (HERE / name).write_bytes(canonical_bytes(value) + b"\n")


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def git(*args: str) -> str:
    return subprocess.check_output(
        ["git", *args], cwd=REPOSITORY, text=True, encoding="utf-8"
    ).strip()


def refresh_baseline(state: dict[str, object]) -> None:
    previous = state["discovery_baseline"]
    state["discovery_baseline"] = build_discovery_baseline(
        state,
        procedure_complete=previous["procedure_complete"],
        applicable_surface_classes_complete=previous[
            "applicable_surface_classes_complete"
        ],
    )


def make_open(state: dict[str, object], *, increment_revision: bool) -> None:
    state["project"]["definition_status"] = "OPEN"
    if increment_revision:
        state["project"]["definition_revision"] += 1
    state["approval"] = {"status": "UNAPPROVED"}
    refresh_baseline(state)


def binding_cell(state: dict[str, object], location: dict[str, object]) -> dict[str, object]:
    if location["scope"] == "CORE":
        row = next(
            row
            for row in state["coverage"]
            if row["feature_id"] == location["owner_ref"]
        )
        return row["cells"][location["axis"]]
    if location["scope"] == "GRILL":
        row = next(
            row
            for row in state["grill_coverage"]
            if row["target_ref"] == location["owner_ref"]
            and row["pack_id"] == location["pack_id"]
        )
        return row["axes"][location["axis"]]
    row = next(
        row
        for row in state["ux_coverage"]
        if row["screen_id"] == location["owner_ref"]
    )
    if location["scope"] == "UX_STATE":
        return row["states"][location["axis"]]
    action = next(
        action
        for action in row["actions"]
        if action["key"] == location["action_key"]
    )
    return action["cells"][location["axis"]]


def replace_pointer_value(record: dict[str, object], pointer: str) -> object:
    tokens = [
        token.replace("~1", "/").replace("~0", "~")
        for token in pointer[1:].split("/")
    ]
    target: object = record
    for token in tokens[:-1]:
        target = target[int(token)] if isinstance(target, list) else target[token]
    final = tokens[-1]
    old = target[int(final)] if isinstance(target, list) else target[final]
    if isinstance(old, str):
        new: object = old + " [T008 synthetic drift]"
    elif isinstance(old, bool):
        new = not old
    elif isinstance(old, list):
        new = [*old, "T008 synthetic drift"]
    elif isinstance(old, dict):
        new = {**old, "t008_synthetic_drift": True}
    elif isinstance(old, int):
        new = old + 1
    else:
        new = {"t008_changed_from": old}
    if isinstance(target, list):
        target[int(final)] = new
    else:
        target[final] = new
    return new


def consumer_index(contract: dict[str, object]) -> dict[str, list[dict[str, str]]]:
    indexed: dict[str, list[dict[str, str]]] = {}
    for kind, collection in (
        ("ACTION", contract["actions"]),
        ("LIFECYCLE", contract["lifecycles"]),
    ):
        id_key = "action_id" if kind == "ACTION" else "lifecycle_id"
        for item in collection:
            for field, spec in item["fields"].items():
                for ref in spec["source_seed_refs"]:
                    indexed.setdefault(ref, []).append(
                        {
                            "consumer_kind": kind,
                            "consumer_id": item[id_key],
                            "dependency_path": (
                                f"actions/{item[id_key]}/{field}"
                                if kind == "ACTION"
                                else f"lifecycles/{item[id_key]}/{field}"
                            ),
                        }
                    )
            if kind == "ACTION":
                for basis_field in (
                    "outcome_basis_seed_refs",
                    "acceptance_basis_seed_refs",
                ):
                    for ref in item["verification_basis"][basis_field]:
                        indexed.setdefault(ref, []).append(
                            {
                                "consumer_kind": kind,
                                "consumer_id": item[id_key],
                                "dependency_path": (
                                    f"actions/{item[id_key]}/verification_basis/"
                                    f"{basis_field}"
                                ),
                            }
                        )
    return indexed


def single_consumer_seeds(contract: dict[str, object]) -> list[dict[str, object]]:
    consumers = consumer_index(contract)
    seeds = {seed["seed_key"]: seed for seed in contract["source_seed_inventory"]}
    candidates = []
    for ref in sorted(consumers):
        distinct = {
            (item["consumer_kind"], item["consumer_id"])
            for item in consumers[ref]
        }
        if len(distinct) == 1 and ref in seeds:
            candidates.append(seeds[ref])
    if not candidates:
        raise AssertionError("no single-consumer seed available")
    return candidates


def drift_seed(state: dict[str, object], seed: dict[str, object]) -> None:
    record = canonical_record_index(state)[seed["record_id"]][1]
    new_value = replace_pointer_value(record, seed["pointer"])
    old_binding = {
        "record_id": seed["record_id"],
        "pointer": seed["pointer"],
        "value_sha256": seed["value_sha256"],
    }
    new_hash = sha256_json(new_value)
    updated = 0

    def visit(value: object) -> None:
        nonlocal updated
        if isinstance(value, dict):
            if all(value.get(key) == expected for key, expected in old_binding.items()):
                value["value_sha256"] = new_hash
                updated += 1
            for child in value.values():
                visit(child)
        elif isinstance(value, list):
            for child in value:
                visit(child)

    visit(state["coverage"])
    visit(state["grill_coverage"])
    visit(state["ux_coverage"])
    if updated == 0:
        raise AssertionError("target seed binding not found")


def main() -> None:
    state = load_json(SOURCE_STATE)
    source_handoff = load_json(SOURCE_HANDOFF)
    baseline_validation = validate_state_v2(state)
    baseline_closure = evaluate_closure_v2(state)
    assert baseline_validation == []
    assert baseline_closure["closed"] is True

    seeds = build_closed_source_seed_inventory(state)
    handoff = translate_handoff_v20_to_v21(source_handoff, seeds)
    compiled = compile_handoff_definition_v21(state, handoff)
    assert compiled["status"] == "AUTHORITY_READY_MACHINE_VERIFIED"
    contract = compiled["contract"]
    assert contract is not None

    baseline_manifest = compute_approval_manifest(state)
    baseline_definition_digest = definition_digest(state)
    baseline_manifest_digest = approval_manifest_digest(baseline_manifest)
    baseline_audit = audit_action_contract_v21_against_state(contract, state)
    assert baseline_audit == {
        "status": "CONFORMANT",
        "authority_revision_relation": "SAME_APPROVED_REVISION",
        "affected_consumers": [],
        "semantic_gaps": [],
        "errors": [],
    }

    unconsumed_evidence = {
        "id": "EVD-9500",
        "status": "CURRENT",
        "source_kind": "USER_CONFIRMED_INTENT",
        "locator": "synthetic:t008/unconsumed-observation",
        "claim": "T008 synthetic unconsumed observation; test-only and not product authority.",
        "confidence": "DIRECT",
        "authority_classes": ["INTENT"],
        "observed_version": None,
        "content_hash": None,
    }

    same_revision = copy.deepcopy(state)
    same_revision["evidence"].append(copy.deepcopy(unconsumed_evidence))
    refresh_baseline(same_revision)
    same_validation = validate_state_v2(same_revision)
    same_closure = evaluate_closure_v2(same_revision)
    same_definition_digest = definition_digest(same_revision)
    same_manifest_digest = approval_manifest_digest(
        compute_approval_manifest(same_revision)
    )
    same_audit = audit_action_contract_v21_against_state(contract, same_revision)
    assert same_validation == []
    assert same_closure["closed"] is True
    assert same_definition_digest == baseline_definition_digest
    assert same_manifest_digest == baseline_manifest_digest
    assert same_revision["approval"] == state["approval"]
    assert same_revision["approval_history"] == state["approval_history"]
    assert same_audit["status"] == "CONFORMANT"
    assert same_audit["authority_revision_relation"] == "SAME_APPROVED_REVISION"

    newer_open = copy.deepcopy(same_revision)
    make_open(newer_open, increment_revision=True)
    newer_validation = validate_state_v2(newer_open)
    newer_audit = audit_action_contract_v21_against_state(contract, newer_open)
    assert newer_validation == []
    assert newer_open["approval_history"] == state["approval_history"]
    assert newer_audit == {
        "status": "CONFORMANT",
        "authority_revision_relation": "OLDER_APPROVED_REVISION_UNAFFECTED",
        "affected_consumers": [],
        "semantic_gaps": [],
        "errors": [],
    }

    stale_approval_probe = None
    stale_approval_closure = None
    drifted = None
    drift_target = None
    drift_audit = None
    for candidate in single_consumer_seeds(contract):
        stale_probe = copy.deepcopy(state)
        drift_seed(stale_probe, candidate)
        closure_probe = evaluate_closure_v2(stale_probe)
        probe = copy.deepcopy(stale_probe)
        make_open(probe, increment_revision=True)
        audit = audit_action_contract_v21_against_state(contract, probe)
        if audit["status"] == "REENTRY_REQUIRED" and len(
            audit["affected_consumers"]
        ) == 1:
            stale_approval_probe = stale_probe
            stale_approval_closure = closure_probe
            drifted, drift_target, drift_audit = probe, candidate, audit
            break
    assert stale_approval_probe is not None and stale_approval_closure is not None
    assert drifted is not None and drift_target is not None and drift_audit is not None
    assert stale_approval_closure["closed"] is False
    assert stale_approval_closure["metrics"]["stale_approval"] == 1
    assert stale_approval_closure["metrics"]["missing_or_stale_approval_manifest"] == 1
    assert stale_approval_closure["metrics"]["semantic_change_without_revision_increment"] == 1
    assert stale_approval_probe["approval"] == state["approval"]
    assert stale_approval_probe["approval_history"] == state["approval_history"]
    assert drifted["approval_history"] == state["approval_history"]
    assert contract["source_authority"]["approved_definition_digest"] == baseline_definition_digest
    assert drift_audit["status"] == "REENTRY_REQUIRED"
    assert len(drift_audit["affected_consumers"]) == 1
    assert drift_audit["affected_consumers"][0]["consumer_id"] in {
        item["action_id"] for item in contract["actions"]
    } | {item["lifecycle_id"] for item in contract["lifecycles"]}
    assert len(contract["actions"]) + len(contract["lifecycles"]) > 1

    write_json("approved-baseline-state.json", state)
    write_json("handoff-definition-v21.json", handoff)
    write_json("action-contract-v21.json", contract)
    write_json("unconsumed-same-revision-state.json", same_revision)
    write_json("unconsumed-newer-open-state.json", newer_open)
    write_json(
        "consumed-drift-stale-approval-probe-state.json",
        stale_approval_probe,
    )
    write_json("consumed-drift-newer-open-state.json", drifted)

    results = {
        "evidence_kind": "T008_SYNTHETIC_INTEGRATION_PROOF_NOT_PRODUCT_AUTHORITY",
        "joeflow_only": True,
        "joeness_inputs": [],
        "new_user_approval_created": False,
        "baseline_is_read_only_copy_of_existing_approved_dogfood": True,
        "engine": {
            "installed_root": str(INSTALLED),
            "installed_skill_sha256": sha256(INSTALLED / "SKILL.md"),
            "semantic_freeze_contract_sha256": sha256(
                INSTALLED / "references" / "semantic-freeze-contract-v0.2.0.md"
            ),
            "downstream_v21_contract_sha256": sha256(
                INSTALLED / "references" / "downstream-v2.1-contract.md"
            ),
        },
        "repository_source": {
            "path": str(REPOSITORY),
            "branch": git("branch", "--show-current"),
            "head": git("rev-parse", "HEAD"),
            "tree": git("show", "-s", "--format=%T", "HEAD"),
            "source_skill_sha256": sha256(
                REPOSITORY / "skills" / "joewrks-product-definition" / "SKILL.md"
            ),
            "source_state": str(SOURCE_STATE),
            "source_state_sha256": sha256(SOURCE_STATE),
            "source_handoff": str(SOURCE_HANDOFF),
            "source_handoff_sha256": sha256(SOURCE_HANDOFF),
        },
        "baseline": {
            "revision": state["project"]["definition_revision"],
            "definition_digest": baseline_definition_digest,
            "manifest_digest": baseline_manifest_digest,
            "approval": state["approval"],
            "approval_history_sha256": hashlib.sha256(
                canonical_bytes(state["approval_history"])
            ).hexdigest(),
            "state_validation_errors": baseline_validation,
            "closure": baseline_closure["closed"],
            "compile_status": compiled["status"],
            "audit": baseline_audit,
        },
        "unconsumed_evidence_same_revision": {
            "state_validation_errors": same_validation,
            "closure": same_closure["closed"],
            "definition_digest_unchanged": same_definition_digest
            == baseline_definition_digest,
            "manifest_digest_unchanged": same_manifest_digest
            == baseline_manifest_digest,
            "approval_unchanged": same_revision["approval"] == state["approval"],
            "approval_history_unchanged": same_revision["approval_history"]
            == state["approval_history"],
            "audit": same_audit,
        },
        "unconsumed_evidence_newer_open_revision": {
            "state_validation_errors": newer_validation,
            "current_revision": newer_open["project"]["definition_revision"],
            "current_status": newer_open["project"]["definition_status"],
            "current_approval": newer_open["approval"],
            "source_approval_history_preserved": newer_open["approval_history"]
            == state["approval_history"],
            "audit": newer_audit,
        },
        "consumed_seed_drift": {
            "target_seed": drift_target,
            "target_seed_declared_consumers": consumer_index(contract)[
                drift_target["seed_key"]
            ],
            "stale_approval_probe": {
                "definition_digest_changed": stale_approval_closure[
                    "definition_digest"
                ] != baseline_definition_digest,
                "approval_control_preserved": stale_approval_probe["approval"]
                == state["approval"],
                "approval_history_preserved": stale_approval_probe[
                    "approval_history"
                ] == state["approval_history"],
                "closed": stale_approval_closure["closed"],
                "nonzero_metrics": {
                    key: value
                    for key, value in stale_approval_closure["metrics"].items()
                    if value
                },
                "errors": stale_approval_closure["errors"],
            },
            "current_revision": drifted["project"]["definition_revision"],
            "current_status": drifted["project"]["definition_status"],
            "source_approval_history_preserved": drifted["approval_history"]
            == state["approval_history"],
            "contract_source_authority_preserved": contract["source_authority"],
            "audit": drift_audit,
            "unaffected_consumer_count": (
                len(contract["actions"])
                + len(contract["lifecycles"])
                - len(drift_audit["affected_consumers"])
            ),
        },
    }
    write_json("audit-results.json", results)

    manifest = {
        path.name: sha256(path)
        for path in sorted(HERE.iterdir(), key=lambda item: item.name)
        if path.is_file() and path.name != "sha256-manifest.json"
    }
    write_json("sha256-manifest.json", manifest)
    print(json.dumps(results, ensure_ascii=False, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
