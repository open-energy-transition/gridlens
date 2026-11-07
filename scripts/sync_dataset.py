#!/usr/bin/env python3
"""
Regenerate the app's merged dataset from data/raw/catalogue.jsonl.

This is THE pipeline step between "research found a new organization" and
"the app shows it". Run this after editing data/raw/catalogue.jsonl (by
hand, by a script, or by an LLM agent), then review the diff, then rebuild
the app.

Input:
  data/raw/catalogue.jsonl           One JSON object per line -- the single
                                      source of truth for every organization
                                      in the dataset, across every tool. See
                                      data/DATA_SCHEMA.md / data/schema.json
                                      for the field contract.

Outputs:
  data/catalogue_merged.csv          Human-readable merged dataset in the
                                      app's display schema -- generated,
                                      never hand-edited.
  src/data/catalogue.json            What App.tsx actually imports (a JSON
                                      mirror of catalogue_merged.csv, kept in
                                      sync by this script).

Usage:
  python3 scripts/sync_dataset.py
  npm run sync-data   # same thing, via the package.json script alias

Always run scripts/validate_dataset.py BEFORE this, so malformed rows don't
make it into the merged/app dataset.
"""
import csv
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATALOGUE_RAW = ROOT / "data" / "raw" / "catalogue.jsonl"
MERGED_CSV_OUT = ROOT / "data" / "catalogue_merged.csv"
APP_JSON_OUT = ROOT / "src" / "data" / "catalogue.json"

# The app only ever reads these fields (src/types.ts's CatalogueRecord) --
# everything else in catalogue.jsonl (id, institution_category, role,
# tool_explicitly_named, status, historical_or_current, batch_id) is
# research/provenance metadata that doesn't need its own UI yet.
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
# A contributor can set decision_type directly in catalogue.jsonl when
# they have real evidence for it (leave decision_basis blank -- this
# script fills it in as "documented"). If decision_type is left blank,
# this script infers one automatically and marks decision_basis
# "inferred" -- from the real use_case text when it's genuinely
# descriptive, otherwise (a generic role-based sentence, no institution
# category) from the organization's sector as a last-resort proxy.
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
    ("Transmission & Network Planning", ["utility_tso"]),
    ("Market Operations & Price Formation", ["utility_iso_rto"]),
    ("Policy & Regulatory Analysis", [
        "government_agency", "government_regulator", "international_body", "development_bank",
        "ngo_foundation",
    ]),
    ("Independent & Commissioned Studies", ["consultancy", "vendor"]),
    ("Academic & Research Studies", ["academic_research", "think_tank"]),
    ("Unit Commitment & Dispatch", ["utility_generation"]),
    ("Capacity & Resource Planning", ["energy_company_diversified", "project_developer"]),
]

DECISION_TYPE_FALLBACK = "Other / General Modeling"

# Role-based use_case sentences only kick in when a contributor hasn't
# written a specific one -- same fallback text PLEXOS-catalogue rows have
# always used, now generalized to apply regardless of tool_name.
ROLE_USE_CASE_FALLBACK = {
    "direct_user": "Uses the tool directly for its own grid/market planning or operations.",
    "commissioner": "Commissioned a tool-based study or engagement (did not model it directly).",
    "consultant_modeler": "Built or ran the model as a consultant/vendor for another organization.",
    "research_user": "Uses the tool in an academic/research capacity (co-equal with the commissioning org).",
    "subject_of_study": "Passively modeled as the subject of someone else's study, not a user itself.",
    "qa_reviewer": "Reviewed or quality-assured a tool-based study for another organization.",
}

# A use_case string that's just the generic fallback sentence (for ANY
# role) carries no real information to classify from -- fall back to
# sector-based inference instead of keyword-matching generic phrasing.
GENERIC_USE_CASE_TEXTS = set(ROLE_USE_CASE_FALLBACK.values())


def classify_decision_from_text(use_case):
    t = (use_case or "").lower()
    for label, keywords in DECISION_TYPE_TEXT_RULES:
        if any(kw in t for kw in keywords):
            return label
    return None


def classify_decision_from_category(category):
    t = (category or "").strip().lower()
    for label, keywords in DECISION_TYPE_CATEGORY_RULES:
        if any(kw == t for kw in keywords):
            return label
    return DECISION_TYPE_FALLBACK


def resolve_decision(row):
    """Return (decision_type, decision_basis) for one raw record."""
    decision_type = (row.get("decision_type") or "").strip()
    if decision_type:
        return decision_type, "documented"

    use_case = (row.get("use_case") or "").strip()
    if use_case and use_case not in GENERIC_USE_CASE_TEXTS:
        # Real, specific evidence exists even if it doesn't match any
        # keyword rule -- that's still "documented", just unclassified,
        # not grounds to fall back to a sector-based guess.
        classified = classify_decision_from_text(use_case)
        return (classified or DECISION_TYPE_FALLBACK), "documented"

    return classify_decision_from_category(row.get("institution_category", "")), "inferred"


def load_jsonl(path):
    rows = []
    with path.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def map_record(row):
    use_case = (row.get("use_case") or "").strip()
    if not use_case:
        use_case = ROLE_USE_CASE_FALLBACK.get((row.get("role") or "").strip(), "")
    decision_type, decision_basis = resolve_decision(row)
    return {
        "country_label": row.get("country_label", "").strip(),
        "institution_name": row.get("institution_name", "").strip(),
        "official_website": row.get("official_website", "").strip(),
        "tool_name": row.get("tool_name", "").strip(),
        "tool_category": row.get("tool_category", "").strip(),
        "use_case": use_case,
        "evidence_strength": row.get("evidence_strength", "").strip() or "MEDIUM",
        "source_type": row.get("source_type", "").strip(),
        "source_title": row.get("source_title", "").strip(),
        "source_date": row.get("source_date", "").strip(),
        "source_link": row.get("source_url", "").strip(),
        "exact_snippet_or_quote": row.get("exact_snippet_or_quote", "").strip(),
        "why_it_supports_the_claim": row.get("why_it_supports_the_claim", "").strip(),
        "notes": row.get("notes", "").strip(),
        "dataset_origin": row.get("batch_id", "").strip(),
        "decision_type": decision_type,
        "decision_basis": decision_basis,
    }


def main():
    if not CATALOGUE_RAW.exists():
        print(f"ERROR: missing {CATALOGUE_RAW}", file=sys.stderr)
        return 1

    raw_rows = load_jsonl(CATALOGUE_RAW)
    confirmed_rows = [r for r in raw_rows if (r.get("status") or "").strip() == "confirmed"]
    merged = [map_record(r) for r in confirmed_rows]

    MERGED_CSV_OUT.parent.mkdir(parents=True, exist_ok=True)
    with MERGED_CSV_OUT.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=APP_SCHEMA)
        writer.writeheader()
        writer.writerows(merged)

    APP_JSON_OUT.parent.mkdir(parents=True, exist_ok=True)
    APP_JSON_OUT.write_text(json.dumps(merged, ensure_ascii=False, indent=None), encoding="utf-8")

    countries = {r["country_label"] for r in merged if r["country_label"]}
    institutions = {r["institution_name"] for r in merged if r["institution_name"]}
    print(f"Merged {len(merged)} records (of {len(raw_rows)} total rows in catalogue.jsonl) "
          f"across {len(countries)} countries and {len(institutions)} institutions.")
    print(f"Wrote {MERGED_CSV_OUT.relative_to(ROOT)}")
    print(f"Wrote {APP_JSON_OUT.relative_to(ROOT)}")
    print("Next: npm run build, review the diff, then commit both the catalogue.jsonl "
          "change and the regenerated catalogue_merged.csv/catalogue.json together.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
