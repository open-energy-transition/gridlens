#!/usr/bin/env python3
"""
Export a compact institution+tool+country index from data/raw/catalogue.jsonl.

Give this file to every research agent/subagent BEFORE a new search wave as
context -- it lets them skip organizations that are already confirmed
instead of re-finding (and potentially near-duplicating, e.g. under a
slightly different name spelling) the same evidence. Regenerate it fresh
right before dispatching a new wave; it goes stale the moment new rows are
merged.

Usage:
  python3 scripts/export_known_institutions.py
  # writes research/known_institutions.csv
"""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATALOGUE_RAW = ROOT / "data" / "raw" / "catalogue.jsonl"
OUT = ROOT / "research" / "known_institutions.csv"


def main() -> int:
    rows = []
    with CATALOGUE_RAW.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))

    confirmed = [r for r in rows if (r.get("status") or "").strip() == "confirmed"]
    confirmed.sort(key=lambda r: (r.get("country_label", ""), r.get("institution_name", "")))

    with OUT.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["institution_name", "country_label", "tool_name", "role", "id"])
        for r in confirmed:
            writer.writerow([
                r.get("institution_name", ""), r.get("country_label", ""),
                r.get("tool_name", ""), r.get("role", ""), r.get("id", ""),
            ])

    print(f"Wrote {len(confirmed)} known institution+tool+country rows to {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
