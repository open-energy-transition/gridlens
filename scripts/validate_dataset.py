#!/usr/bin/env python3
"""
Validate data/raw/catalogue.jsonl before syncing it into the app.

Run this BEFORE scripts/sync_dataset.py, on every data change (new rows,
edits, removals). Catches the mistakes an LLM agent or a new contributor is
most likely to make: wrong enum value, missing required field, duplicate id,
a country spelled two different ways (which would split one country into two
choropleth entries on the map), a likely duplicate institution+tool pair.

The field-by-field contract lives in data/schema.json (required fields,
enums) -- this script reads that file as the single source of truth rather
than duplicating the enum lists here. data/DATA_SCHEMA.md explains the
rationale behind each field in prose.

Usage:
  python3 scripts/validate_dataset.py
  npm run validate-data   # same thing

Exit code 0 = clean, 1 = problems found (prints them, does not fix anything).
"""
import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATALOGUE_RAW = ROOT / "data" / "raw" / "catalogue.jsonl"
SCHEMA_PATH = ROOT / "data" / "schema.json"

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


def load_schema() -> dict:
    return json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))


def load_jsonl(path: Path) -> list[tuple[int, dict]]:
    rows = []
    with path.open(encoding="utf-8") as f:
        for lineno, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                rows.append((lineno, json.loads(line)))
            except json.JSONDecodeError as e:
                rows.append((lineno, {"__parse_error__": str(e)}))
    return rows


def main() -> int:
    if not CATALOGUE_RAW.exists():
        print(f"ERROR: missing {CATALOGUE_RAW}", file=sys.stderr)
        return 1

    schema = load_schema()
    props = schema["properties"]
    required = set(schema["required"])
    enums = {name: set(spec["enum"]) for name, spec in props.items() if "enum" in spec}
    known_fields = set(props.keys())

    errors: list[str] = []
    warnings: list[str] = []

    parsed = load_jsonl(CATALOGUE_RAW)
    seen_ids: Counter = Counter()
    countries_seen: set[str] = set()
    institution_tool_seen: Counter = Counter()

    for lineno, row in parsed:
        if "__parse_error__" in row:
            errors.append(f"catalogue.jsonl line {lineno}: invalid JSON ({row['__parse_error__']})")
            continue

        extra_fields = set(row.keys()) - known_fields
        if extra_fields:
            errors.append(f"catalogue.jsonl line {lineno}: unknown field(s) {sorted(extra_fields)} -- not in data/schema.json")

        for field in required:
            val = row.get(field)
            if val is None or (isinstance(val, str) and not val.strip()):
                errors.append(f"catalogue.jsonl line {lineno} (id={row.get('id','?')}): missing required field '{field}'")

        for field, allowed in enums.items():
            val = row.get(field, "")
            if val and val not in allowed:
                errors.append(f"catalogue.jsonl line {lineno} (id={row.get('id','?')}): invalid {field}='{val}' (valid: {sorted(allowed)})")

        if not (row.get("institution_category") or "").strip():
            warnings.append(f"catalogue.jsonl line {lineno} (id={row.get('id','?')}): institution_category is empty -- fill it in when you know the organization's sector")

        decision_type = (row.get("decision_type") or "").strip()
        decision_basis = (row.get("decision_basis") or "").strip()
        if decision_type and not decision_basis:
            warnings.append(
                f"catalogue.jsonl line {lineno} (id={row.get('id','?')}): decision_type is set but decision_basis "
                f"is blank -- sync_dataset.py will default it to 'documented', only correct if use_case/"
                f"exact_snippet_or_quote actually supports that decision_type"
            )

        rid = (row.get("id") or "").strip()
        if rid:
            seen_ids[rid] += 1

        country = (row.get("country_label") or "").strip()
        if country:
            countries_seen.add(country)

        if (row.get("status") or "").strip() == "confirmed":
            # Keyed on institution+tool+country -- institution+tool alone is too
            # noisy (a consultancy legitimately using the same tool across many
            # countries is not a duplicate; the same institution+tool+country
            # appearing twice almost always is).
            key = (
                row.get("institution_name", "").strip().lower(),
                row.get("tool_name", "").strip().lower(),
                row.get("country_label", "").strip().lower(),
            )
            if key != ("", "", ""):
                institution_tool_seen[key] += 1

    dupes = [rid for rid, n in seen_ids.items() if n > 1]
    if dupes:
        errors.append(f"catalogue.jsonl: duplicate id(s): {dupes}")

    dup_pairs = [k for k, n in institution_tool_seen.items() if n > 1]
    if dup_pairs:
        warnings.append(f"catalogue.jsonl: same institution+tool appears in multiple confirmed rows (check for a true duplicate): {dup_pairs}")

    for cluster in COUNTRY_ALIASES:
        hit = cluster & countries_seen
        if len(hit) > 1:
            warnings.append(f"catalogue.jsonl: country alias split detected: {sorted(hit)} -- pick one canonical spelling, see data/DATA_SCHEMA.md")

    confirmed = sum(1 for _, r in parsed if "__parse_error__" not in r and (r.get("status") or "").strip() == "confirmed")
    print(f"catalogue.jsonl: {len(parsed)} rows ({confirmed} confirmed, will be synced)")

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
