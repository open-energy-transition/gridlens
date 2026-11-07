#!/usr/bin/env python3
"""
Regenerate the app's merged dataset from the two raw source CSVs.

This is THE pipeline step between "research found a new organization" and
"the app shows it". Run this after editing data/raw/plexos_organizations.csv
or data/raw/upstream_baseline.csv (by hand, by a script, or by an LLM agent),
then review the diff, then rebuild the app.

Inputs:
  data/raw/plexos_organizations.csv   PLEXOS-specific research dataset, rich
                                       role/evidence taxonomy (see
                                       data/DATA_SCHEMA.md). This is where new
                                       PLEXOS-using organizations go.
  data/raw/upstream_baseline.csv      Simpler schema covering any energy
                                       system modelling tool (not just
                                       PLEXOS). This is where new
                                       non-PLEXOS-tool entries go, and is
                                       already in the app's own schema.

Outputs:
  data/catalogue_merged.csv           Human/LLM-readable merged dataset in
                                       the app's schema -- the real source of
                                       truth for what the app displays.
  src/data/catalogue.json             What App.tsx actually imports (a JSON
                                       mirror of catalogue_merged.csv, kept in
                                       sync by this script, never hand-edited).

Usage:
  python3 scripts/sync_dataset.py
  npm run sync-data   # same thing, via the package.json script alias

Always run scripts/validate_dataset.py BEFORE this, on the raw CSVs, so
malformed rows don't make it into the merged/app dataset.
"""
import csv
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PLEXOS_RAW = ROOT / "data" / "raw" / "plexos_organizations.csv"
UPSTREAM_RAW = ROOT / "data" / "raw" / "upstream_baseline.csv"
MERGED_CSV_OUT = ROOT / "data" / "catalogue_merged.csv"
APP_JSON_OUT = ROOT / "src" / "data" / "catalogue.json"

APP_SCHEMA = [
    "country_label", "institution_name", "official_website", "tool_name",
    "tool_category", "use_case", "evidence_strength", "source_type",
    "source_title", "source_date", "source_link", "exact_snippet_or_quote",
    "why_it_supports_the_claim", "notes", "dataset_origin",
    "decision_type", "decision_basis",
]

# --- Grid decision classification -------------------------------------
#
# "decision_type" answers "what grid decision is this tool used for?" --
# a different axis from tool_category (the model's technical class, e.g.
# production_cost_uc) or role (the organization's relationship to the
# tool, e.g. direct_user/commissioner). See data/DATA_SCHEMA.md for the
# full taxonomy and rationale.
#
# "decision_basis" flags how confidently we know this:
#   "documented" -- classified from real free-text use_case evidence
#                   (esm_usage_catalog rows have this; it's grounded in an
#                   actual quoted source).
#   "inferred"    -- classified from the organization's sector/category
#                    as a heuristic proxy (plexos_organization_catalogue
#                    rows only have role/category, not a documented use
#                    case description, so this is an approximation, not a
#                    verified claim).
#
# Keep this honest distinction visible in the UI -- don't present
# "inferred" the same way as "documented".

DECISION_TYPE_TEXT_RULES = [
    ("Transmission & Network Planning", [
        "transmission", "network planning", "interconnection", "distribution planning", "grid planning",
        "grid-code", "grid code", "grid connection", "connection stud", "powerfactory", "pss/e", "pss e",
        "rms ", "electromagnetic transient", " emt ", "emt stud", "compliance modelling", "dynamic model",
    ]),
    ("Market Operations & Price Formation", [
        "market simulation", "price formation", "spot price", "auction", "tariff", "market operations",
        "pld formation", "price discovery", "market price", "market modelling", "market/system modelling",
        "electricity market", "market simulator",
    ]),
    ("Capacity & Resource Planning", [
        "capacity expansion", "resource adequacy", "integrated resource plan", " irp ", "long-term planning",
        "investment planning", "generation planning", "capacity planning", "infrastructure planning",
        "generation expansion", "expansion planning", "least-cost", "prospectiva",
        "energy outlook", "energy planning", "supply-demand", "igcep", "prodesen",
    ]),
    ("Unit Commitment & Dispatch", [
        "unit commitment", "dispatch", "operation planning", "operational planning", "scheduling", "pmo",
        "day-ahead", "production cost",
    ]),
    ("Renewable Integration & Decarbonization", [
        "renewable integration", "decarbon", "net zero", "net-zero", "climate neutral",
        "variable renewable", "energy transition", "carbon-free", "cfe", "renewable optimisation",
        "renewable optimization", "phase-out", "100% renewable", "clean-electricity", "clean electricity",
    ]),
    ("Forecasting & Scenario Analysis", [
        "forecast", "scenario generation", "demand forecasting",
    ]),
    ("Policy & Regulatory Analysis", ["regulat", "policy", "ministry"]),
    ("Independent & Commissioned Studies", ["consultant", "consulting", "commissioned", "licens", "procurement"]),
    ("Academic & Research Studies", ["research", "academic", "thesis", "university"]),
]

DECISION_TYPE_CATEGORY_RULES = [
    ("Transmission & Network Planning", ["transmission", "tso", "distribution utility", "utility_distribution"]),
    ("Market Operations & Price Formation", ["iso", "rto", "system operator", "single_buyer", "single buyer"]),
    ("Policy & Regulatory Analysis", [
        "government", "regulat", "international", "intergovernmental", "development_bank",
        "development bank", "ngo", "non-profit", "not-for-profit", "financial institution", "funder",
    ]),
    ("Independent & Commissioned Studies", ["consultanc", "consultant", "vendor", "epc"]),
    ("Academic & Research Studies", ["academic", "research", "university", "think_tank", "think tank"]),
    ("Unit Commitment & Dispatch", [
        "generation", "generator", "ipp", "independent power producer", "utility",
        "vertically-integrated", "investor-owned",
    ]),
    ("Capacity & Resource Planning", [
        "oil & gas", "mining", "industrial", "trading", "developer", "giga",
        "datacenter", "hydrogen", "battery", "planning_agency", "planning agency",
    ]),
]

DECISION_TYPE_FALLBACK = "Other / General Modeling"


def classify_decision_from_text(use_case: str) -> str:
    """Classify a decision type from real free-text use_case evidence."""
    t = (use_case or "").lower()
    for label, keywords in DECISION_TYPE_TEXT_RULES:
        if any(kw in t for kw in keywords):
            return label
    return DECISION_TYPE_FALLBACK


def classify_decision_from_category(category: str) -> str:
    """Infer a decision type from an organization's sector when no
    free-text use case is available (PLEXOS-organization-catalogue rows)."""
    t = (category or "").strip().lower()
    if not t:
        return DECISION_TYPE_FALLBACK
    for label, keywords in DECISION_TYPE_CATEGORY_RULES:
        if any(kw in t for kw in keywords):
            return label
    return DECISION_TYPE_FALLBACK

# plexos_organizations.csv's `role` -> a short use_case phrase, since that
# raw schema doesn't have a free-text use_case field the way upstream_baseline
# does -- this keeps the app's "use_case" column populated for every record,
# not just the upstream-baseline ones.
ROLE_USE_CASE = {
    "direct_user": "Uses PLEXOS directly for its own grid/market planning or operations.",
    "commissioner": "Commissioned a PLEXOS-based study or engagement (did not model it directly).",
    "consultant_modeler": "Built or ran the PLEXOS model as a consultant/vendor for another organization.",
    "research_user": "Uses PLEXOS in an academic/research capacity (co-equal with the commissioning org).",
    "subject_of_study": "Passively modeled as the subject of someone else's PLEXOS study, not a user itself.",
    "qa_reviewer": "Reviewed or quality-assured a PLEXOS-based study for another organization.",
}

EVIDENCE_MAP = {
    "confirmed": "HIGH",
    "confirmed_direct_user": "HIGH",
    "confirmed_commissioner": "MEDIUM",
    "confirmed_consultant_modeler": "HIGH",
    "confirmed_research_user": "HIGH",
    "confirmed_subject_of_study": "MEDIUM",
    "confirmed_qa_reviewer": "MEDIUM",
    "probable": "MEDIUM",
    "probable_direct_user": "MEDIUM",
}


def load_csv(path: Path) -> list[dict]:
    with path.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def map_plexos_row(row: dict) -> dict:
    """Map one data/raw/plexos_organizations.csv row into the app schema."""
    role = (row.get("role") or "").strip()
    return {
        "country_label": row.get("country", "").strip(),
        "institution_name": row.get("organization_name", "").strip(),
        "official_website": "",
        "tool_name": "PLEXOS",
        "tool_category": "production_cost_uc",
        "use_case": ROLE_USE_CASE.get(role, row.get("notes", "").strip()),
        "evidence_strength": EVIDENCE_MAP.get((row.get("evidence_classification") or "").strip(), "MEDIUM"),
        "source_type": "research_finding",
        "source_title": "",
        "source_date": "",
        "source_link": row.get("source_url", "").strip(),
        "exact_snippet_or_quote": "",
        "why_it_supports_the_claim": row.get("notes", "").strip(),
        "notes": f"role={role}; status={row.get('status', '')}; candidate_id={row.get('candidate_id', '')}",
        "dataset_origin": "plexos_organization_catalogue",
        # No documented use-case text exists in this raw schema (ROLE_USE_CASE
        # is a generic templated sentence, too vague to keyword-classify) --
        # infer from the organization's sector instead, and say so honestly.
        "decision_type": classify_decision_from_category(row.get("category", "")),
        "decision_basis": "inferred",
    }


def map_upstream_row(row: dict) -> dict:
    """upstream_baseline.csv is already in the app schema; just tag its origin."""
    out = {k: row.get(k, "").strip() for k in APP_SCHEMA if k not in ("dataset_origin", "decision_type", "decision_basis")}
    out["dataset_origin"] = "esm_usage_catalog"
    # Real free-text use_case evidence exists here -- classify from it directly.
    out["decision_type"] = classify_decision_from_text(row.get("use_case", ""))
    out["decision_basis"] = "documented"
    return out


def main() -> int:
    if not PLEXOS_RAW.exists() or not UPSTREAM_RAW.exists():
        print(f"ERROR: missing raw input file(s) under {PLEXOS_RAW.parent}", file=sys.stderr)
        return 1

    plexos_rows = [map_plexos_row(r) for r in load_csv(PLEXOS_RAW) if (r.get("status") or "").strip() == "confirmed"]
    upstream_rows = [map_upstream_row(r) for r in load_csv(UPSTREAM_RAW) if r.get("institution_name", "").strip()]

    merged = upstream_rows + plexos_rows

    MERGED_CSV_OUT.parent.mkdir(parents=True, exist_ok=True)
    with MERGED_CSV_OUT.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=APP_SCHEMA)
        writer.writeheader()
        writer.writerows(merged)

    APP_JSON_OUT.parent.mkdir(parents=True, exist_ok=True)
    APP_JSON_OUT.write_text(json.dumps(merged, ensure_ascii=False, indent=None), encoding="utf-8")

    countries = {r["country_label"] for r in merged if r["country_label"]}
    institutions = {r["institution_name"] for r in merged if r["institution_name"]}
    print(f"Merged {len(merged)} records "
          f"({len(upstream_rows)} upstream + {len(plexos_rows)} PLEXOS-confirmed) "
          f"across {len(countries)} countries and {len(institutions)} institutions.")
    print(f"Wrote {MERGED_CSV_OUT.relative_to(ROOT)}")
    print(f"Wrote {APP_JSON_OUT.relative_to(ROOT)}")
    print("Next: npm run build, review the diff, then commit both the raw CSV "
          "change and the regenerated catalogue_merged.csv/catalogue.json together.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
