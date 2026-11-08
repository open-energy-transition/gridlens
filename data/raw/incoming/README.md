# data/raw/incoming/

Staging area for parallel research batches. See `scripts/merge_batches.py`'s
module docstring for the full workflow -- summary:

1. Before dispatching parallel research workers, give each one a unique id
   prefix to reserve (e.g. `W23-A-`, `W23-B-`).
2. Each worker writes its findings to its own file here, e.g.
   `W23-A.jsonl`, one JSON object per line, same schema as
   `../catalogue.jsonl` (see `../DATA_SCHEMA.md` / `../schema.json`).
3. Once all workers finish, run `python3 scripts/merge_batches.py` once to
   merge everything here into `../catalogue.jsonl` atomically (checks for
   id collisions and likely duplicates first, writes nothing if any id
   collision is found).
4. Then the normal pipeline: `npm run validate-data && npm run sync-data`.

Merged files get moved into `processed/` automatically, not deleted --
keep that as a historical record of which files fed which merge.

This directory should normally be empty (or contain only `processed/`) in
a committed state. Files sitting here uncommitted mean a merge hasn't
happened yet for that batch.
