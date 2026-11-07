# AGENTS.md — research/

Before searching for new organizations, read `research/RESEARCH_PLAYBOOK.md`
in full — it has the actual search techniques that found 419 organizations
in this dataset's original research pass. This file is just the auto-loaded
summary.

## The loop (short version)

1. Pick a gap from `world_country_checklist.csv` (`not_started` or
   `gap_confirmed` worth re-checking).
2. Search: try the organization's own first-person documents first
   (planning docs, procurement notices), then development-bank procurement
   APIs, then LinkedIn/vendor-archive/non-English-language search — see
   `RESEARCH_PLAYBOOK.md` for which have actually worked and why.
3. Add confirmed findings to `../data/raw/plexos_organizations.csv` (or
   `upstream_baseline.csv` for non-PLEXOS tools) — see `../data/AGENTS.md`.
4. Update this folder's `world_country_checklist.csv` with the country's
   new status.
5. `npm run sync-data`, add a changelog entry, `npm run build`, commit.

## Don't delete a rejected lead

A `status=rejected` row stays in the CSV (not deleted) so a future wave
doesn't repeat the same dead-end search. See `RESEARCH_PLAYBOOK.md`'s
"stale negatives" section for when it's actually worth re-checking one.

## `history/`

Point-in-time reports from the original research build. Historical
reference only — not maintained going forward, don't treat figures in
there as current without cross-checking the live dataset.
