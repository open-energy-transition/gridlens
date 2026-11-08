#!/usr/bin/env python3
"""
Merge one or more staged research-batch JSONL files into data/raw/catalogue.jsonl.

This exists so MULTIPLE PARALLEL research agents/subagents can run at once
without any of them touching data/raw/catalogue.jsonl directly -- concurrent
writers to the same file is a real corruption risk (interleaved writes,
race conditions on read-modify-write). Instead:

  1. Before dispatching parallel workers, reserve each one a unique id
     prefix (see "Reserving id prefixes" below) so there's zero id-collision
     risk even before merging.
  2. Each worker writes ONLY to its own file under data/raw/incoming/,
     one JSON object per line, same schema as catalogue.jsonl (see
     data/schema.json / data/DATA_SCHEMA.md).
  3. Once all workers finish, run this script ONCE to merge every file in
     data/raw/incoming/ into catalogue.jsonl atomically.
  4. Then run the normal pipeline: npm run validate-data && npm run sync-data.

This script does NOT do full schema validation (that's validate_dataset.py's
job, run it after merging) -- it only does the two things that are unsafe
to defer: id-collision detection and a same-institution+tool+country
near-duplicate warning, both across the incoming batches AND against the
existing catalogue.

Usage:
  python3 scripts/merge_batches.py              # merges everything in data/raw/incoming/
  python3 scripts/merge_batches.py --dry-run    # report what WOULD happen, write nothing

Reserving id prefixes (do this BEFORE dispatching parallel workers):
  Give worker N a prefix like "W<wave>-<N>-" (e.g. "W23-A-", "W23-B-") and
  tell it to id its new rows "W23-A-0001", "W23-A-0002", etc. As long as
  each worker's prefix is unique, merging is guaranteed collision-free
  without any coordination between workers while they run.
"""
import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATALOGUE_RAW = ROOT / "data" / "raw" / "catalogue.jsonl"
INCOMING_DIR = ROOT / "data" / "raw" / "incoming"
PROCESSED_DIR = INCOMING_DIR / "processed"


def load_jsonl(path: Path) -> list[dict]:
    rows = []
    with path.open(encoding="utf-8") as f:
        for lineno, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError as e:
                print(f"ERROR: {path.name} line {lineno}: invalid JSON ({e})", file=sys.stderr)
                sys.exit(1)
    return rows


def main() -> int:
    dry_run = "--dry-run" in sys.argv

    if not CATALOGUE_RAW.exists():
        print(f"ERROR: missing {CATALOGUE_RAW}", file=sys.stderr)
        return 1

    batch_files = sorted(INCOMING_DIR.glob("*.jsonl")) if INCOMING_DIR.exists() else []
    if not batch_files:
        print(f"No .jsonl files found in {INCOMING_DIR} -- nothing to merge.")
        return 0

    existing_rows = load_jsonl(CATALOGUE_RAW)
    existing_ids = {r.get("id", "") for r in existing_rows}
    existing_keys = {
        (r.get("institution_name", "").strip().lower(), r.get("tool_name", "").strip().lower(), r.get("country_label", "").strip().lower())
        for r in existing_rows
        if (r.get("status") or "").strip() == "confirmed"
    }

    all_new_rows: list[dict] = []
    seen_ids_this_merge: set[str] = set()
    errors: list[str] = []
    warnings: list[str] = []

    for batch_path in batch_files:
        batch_rows = load_jsonl(batch_path)
        print(f"{batch_path.name}: {len(batch_rows)} row(s)")
        for row in batch_rows:
            rid = (row.get("id") or "").strip()
            if not rid:
                errors.append(f"{batch_path.name}: a row is missing 'id'")
                continue
            if rid in existing_ids:
                errors.append(f"{batch_path.name}: id '{rid}' already exists in catalogue.jsonl -- id-prefix collision, pick a different reserved prefix")
                continue
            if rid in seen_ids_this_merge:
                errors.append(f"{batch_path.name}: id '{rid}' collides with another file in this same merge batch")
                continue
            seen_ids_this_merge.add(rid)

            if (row.get("status") or "").strip() == "confirmed":
                key = (row.get("institution_name", "").strip().lower(), row.get("tool_name", "").strip().lower(), row.get("country_label", "").strip().lower())
                if key in existing_keys:
                    warnings.append(f"{batch_path.name} (id={rid}): same institution+tool+country already confirmed in catalogue.jsonl -- check for a true duplicate: {key}")
                existing_keys.add(key)  # also catch duplicates WITHIN this merge run

            all_new_rows.append(row)

    if errors:
        print(f"\n{len(errors)} error(s) -- fix these before merging, nothing was written:")
        for e in errors:
            print(f"  ERROR {e}")
        return 1

    if warnings:
        print(f"\n{len(warnings)} warning(s):")
        for w in warnings:
            print(f"  WARN  {w}")

    print(f"\n{len(all_new_rows)} new row(s) across {len(batch_files)} file(s), 0 id collisions.")

    if dry_run:
        print("--dry-run: nothing written.")
        return 0

    with CATALOGUE_RAW.open("a", encoding="utf-8") as f:
        for row in all_new_rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
    print(f"Appended {len(all_new_rows)} row(s) to {CATALOGUE_RAW.relative_to(ROOT)}")

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    for batch_path in batch_files:
        shutil.move(str(batch_path), str(PROCESSED_DIR / batch_path.name))
    print(f"Moved {len(batch_files)} processed batch file(s) to {PROCESSED_DIR.relative_to(ROOT)}")
    print("\nNext: npm run validate-data && npm run sync-data")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
