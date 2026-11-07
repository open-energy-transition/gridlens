#!/usr/bin/env python3
"""
Validate the raw data files before syncing them into the app.

Run this BEFORE scripts/sync_dataset.py, on every data change (new rows,
edits, removals). Catches the mistakes an LLM agent or a new contributor is
most likely to make: wrong enum value, missing required field, duplicate
candidate_id, a country spelled two different ways (which would split one
country into two choropleth entries on the map).

Usage:
  python3 scripts/validate_dataset.py
  npm run validate-data   # same thing

Exit code 0 = clean, 1 = problems found (prints them, does not fix anything).
"""
import csv
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PLEXOS_RAW = ROOT / "data" / "raw" / "plexos_organizations.csv"
UPSTREAM_RAW = ROOT / "data" / "raw" / "upstream_baseline.csv"

PLEXOS_REQUIRED_COLS = [
    "candidate_id", "organization_name", "country", "category", "role",
    "plexos_mentioned", "source_url", "ledger_id", "evidence_classification",
    "historical_or_current", "already_represented", "batch_id", "status", "notes",
]
PLEXOS_REQUIRED_NONEMPTY = ["candidate_id", "organization_name", "country", "role", "source_url"]
VALID_ROLES = {
    "direct_user", "commissioner", "consultant_modeler", "research_user",
    "subject_of_study", "qa_reviewer", "rejected",
}
VALID_EVIDENCE = {
    "confirmed", "confirmed_commissioner", "confirmed_consultant_modeler",
    "confirmed_direct_user", "confirmed_qa_reviewer", "confirmed_research_user",
    "confirmed_subject_of_study", "probable", "probable_direct_user",
}
VALID_STATUS = {"confirmed", "candidate", "rejected", "gap_confirmed"}
VALID_HISTORICAL = {"current", "historical"}

UPSTREAM_REQUIRED_COLS = [
    "country_label", "institution_name", "official_website", "tool_name",
    "tool_category", "use_case", "evidence_strength", "source_type",
    "source_title", "source_date", "source_link", "exact_snippet_or_quote",
    "why_it_supports_the_claim", "notes",
]
VALID_EVIDENCE_STRENGTH = {"HIGH", "MEDIUM", "LOW"}

# Known alias clusters -- flag if more than one spelling of the SAME country
# appears, since that silently splits one country into two choropleth
# entries on the Geographic Analysis map instead of merging them.
COUNTRY_ALIASES = [
    {"Cote d'Ivoire", "Côte d'Ivoire", "Ivory Coast"},
    {"Czech Republic", "Czechia"},
    {"UAE", "United Arab Emirates"},
    {"USA", "US", "U.S.", "United States", "United States of America"},
    {"UK", "U.K.", "United Kingdom"},
    {"South Korea", "Korea, South", "Republic of Korea", "Korea (South)"},
    {"Russia", "Russian Federation"},
    {"Vietnam", "Viet Nam"},
    {"Tanzania", "United Republic of Tanzania"},
    {"North Macedonia", "Macedonia"},
    {"Eswatini", "Swaziland"},
    {"Cape Verde", "Cabo Verde"},
    {"Myanmar", "Burma"},
    {"DRC", "Democratic Republic of Congo", "Democratic Republic of the Congo", "DR Congo"},
    {"Turkey", "Türkiye", "Turkiye"},
]


def load_csv(path: Path) -> list[dict]:
    with path.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def check_columns(rows: list[dict], required: list[str], label: str, errors: list[str]) -> None:
    if not rows:
        errors.append(f"{label}: file is empty")
        return
    actual = set(rows[0].keys())
    missing = [c for c in required if c not in actual]
    if missing:
        errors.append(f"{label}: missing column(s) {missing}")


def validate_plexos(errors: list[str], warnings: list[str]) -> list[dict]:
    rows = load_csv(PLEXOS_RAW)
    check_columns(rows, PLEXOS_REQUIRED_COLS, "plexos_organizations.csv", errors)

    seen_ids = Counter()
    countries_seen = set()
    for i, row in enumerate(rows, start=2):  # start=2: row 1 is the header
        for col in PLEXOS_REQUIRED_NONEMPTY:
            if not (row.get(col) or "").strip():
                errors.append(f"plexos_organizations.csv line {i}: empty required field '{col}'")
        role = (row.get("role") or "").strip()
        if role and role not in VALID_ROLES:
            errors.append(f"plexos_organizations.csv line {i}: invalid role '{role}' (valid: {sorted(VALID_ROLES)})")
        status = (row.get("status") or "").strip()
        if status and status not in VALID_STATUS:
            warnings.append(f"plexos_organizations.csv line {i}: unusual status '{status}' (expected one of {sorted(VALID_STATUS)})")
        ev = (row.get("evidence_classification") or "").strip()
        if ev and ev not in VALID_EVIDENCE:
            errors.append(f"plexos_organizations.csv line {i}: invalid evidence_classification '{ev}'")
        hist = (row.get("historical_or_current") or "").strip()
        if hist and hist not in VALID_HISTORICAL:
            errors.append(f"plexos_organizations.csv line {i}: invalid historical_or_current '{hist}'")
        cid = (row.get("candidate_id") or "").strip()
        if cid:
            seen_ids[cid] += 1
        countries_seen.add((row.get("country") or "").strip())

    dupes = [cid for cid, n in seen_ids.items() if n > 1]
    if dupes:
        errors.append(f"plexos_organizations.csv: duplicate candidate_id(s): {dupes}")

    for cluster in COUNTRY_ALIASES:
        hit = cluster & countries_seen
        if len(hit) > 1:
            warnings.append(f"plexos_organizations.csv: country alias split detected: {sorted(hit)} "
                             f"-- pick one canonical spelling, see data/DATA_SCHEMA.md")
    return rows


def validate_upstream(errors: list[str], warnings: list[str]) -> list[dict]:
    rows = load_csv(UPSTREAM_RAW)
    check_columns(rows, UPSTREAM_REQUIRED_COLS, "upstream_baseline.csv", errors)
    countries_seen = set()
    for i, row in enumerate(rows, start=2):
        if not (row.get("institution_name") or "").strip():
            errors.append(f"upstream_baseline.csv line {i}: empty institution_name")
        if not (row.get("tool_name") or "").strip():
            errors.append(f"upstream_baseline.csv line {i}: empty tool_name")
        ev = (row.get("evidence_strength") or "").strip()
        if ev and ev not in VALID_EVIDENCE_STRENGTH:
            errors.append(f"upstream_baseline.csv line {i}: invalid evidence_strength '{ev}' (expected HIGH/MEDIUM/LOW)")
        countries_seen.add((row.get("country_label") or "").strip())

    for cluster in COUNTRY_ALIASES:
        hit = cluster & countries_seen
        if len(hit) > 1:
            warnings.append(f"upstream_baseline.csv: country alias split detected: {sorted(hit)}")
    return rows


def main() -> int:
    errors: list[str] = []
    warnings: list[str] = []

    plexos_rows = validate_plexos(errors, warnings)
    upstream_rows = validate_upstream(errors, warnings)

    confirmed = [r for r in plexos_rows if (r.get("status") or "").strip() == "confirmed"]
    print(f"plexos_organizations.csv: {len(plexos_rows)} rows ({len(confirmed)} confirmed, will be synced)")
    print(f"upstream_baseline.csv: {len(upstream_rows)} rows")

    if warnings:
        print(f"\n{len(warnings)} warning(s):")
        for w in warnings:
            print(f"  WARN  {w}")

    if errors:
        print(f"\n{len(errors)} error(s):")
        for e in errors:
            print(f"  ERROR {e}")
        print("\nFix these before running scripts/sync_dataset.py.")
        return 1

    print("\nNo errors. Safe to run scripts/sync_dataset.py.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
