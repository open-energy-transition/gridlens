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
]

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
    }


def map_upstream_row(row: dict) -> dict:
    """upstream_baseline.csv is already in the app schema; just tag its origin."""
    out = {k: row.get(k, "").strip() for k in APP_SCHEMA if k != "dataset_origin"}
    out["dataset_origin"] = "esm_usage_catalog"
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
