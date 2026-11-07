# Research playbook

How to find, verify, and add new organizations to the dataset — distilled
from ~25 research waves (Nov 2026) that grew the PLEXOS-specific dataset
from 0 to 419 confirmed organizations across 149 countries. Written for an
LLM agent (or a human) picking this up cold, with no other context.

## The loop

1. Pick a gap: an untracked country, a tool/region/sector not yet covered,
   or a `status=rejected`/`gap_confirmed` row worth re-checking (see "stale
   negatives" below).
2. Search using one or more of the techniques below. Prefer techniques that
   haven't been tried yet for this gap over repeating an exhausted one.
3. For each finding, write down: the organization, the country, the role
   (see `data/DATA_SCHEMA.md`), the source URL, and — critically — enough
   of a quote/paraphrase in `notes` that a future reviewer doesn't have to
   re-fetch the source to understand why it counts as evidence.
4. Append one JSON line to `data/raw/catalogue.jsonl` (one unified file
   for every tool, not just PLEXOS) with
   `status=confirmed` only if the evidence is solid; use `status=candidate`
   for a lead that needs a second look, `status=rejected` for a dead end
   (keep it, don't delete — see below).
5. Update `research/world_country_checklist.csv`: mark the country's
   `checklist_status` (`confirmed` / `gap_confirmed` / `not_started`).
6. Run `npm run validate-data` then `npm run sync-data`.
7. Add an entry to `src/data/changelog.json` per `CHANGELOG_MAINTENANCE.md`
   — every add/remove/reclassify gets a dated entry there, in the same
   session as the data change.
8. `npm run build` to confirm nothing broke, then commit everything
   together (raw CSV diff + regenerated merged CSV/JSON + changelog entry).

## Search techniques that have actually worked

Roughly in order of how much they've produced, based on this dataset's
build history:

1. **The organization's own first-person documents.** National grid
   operators, regulators, and utilities often publish their own planning
   documents, tender notices, or press releases stating which tool they use
   ("la UPME adquirió la herramienta PLEXOS" — Colombia's own 2020-2034
   expansion plan). This is the strongest evidence class and should be
   tried first, not last.
2. **Multilateral development bank procurement-notice APIs.** The World
   Bank's structured API
   (`search.worldbank.org/api/v2/procnotices?qterm=PLEXOS`) returns an
   authoritative, exhaustive count — not a sample — and was the single most
   productive technique discovered in this project (found GRIDCo/Ghana,
   confirmed Pakistan/Senegal/Indonesia entities, and definitively closed
   out large swaths of the search space as genuine negatives). IDB has a
   similar CKAN-based open-data API (`data.iadb.org`). ADB and AfDB have
   procurement databases but are harder to query programmatically
   (client-side JS / bot-protection / CSRF forms as of Nov 2026 — may be
   easier from a different network/browser environment; worth retrying
   rather than assuming still-blocked).
3. **LinkedIn staff-profile and job-posting search.** Searching for staff
   job titles/descriptions mentioning the tool by name at a target
   organization. Effective for confirming direct use when no public
   document exists.
4. **Vendor case-study archives.** Tool vendors (Energy Exemplar for
   PLEXOS, etc.) publish client case studies — useful as a *lead*, but
   weaker evidence than the organization's own words; verify with a second,
   independent source before marking `status=confirmed` on a vendor
   mention alone.
5. **Non-English-language search.** Searching national planning documents
   in the country's own language (Spanish, Portuguese, French, Arabic,
   etc.) found real hits in Latin America and Francophone Africa that
   English-only queries missed entirely. If a country's own-language
   government/utility planning-document site exists, searching it directly
   in that language is worth trying before giving up on a country.
6. **Academic paper acknowledgements/author affiliations.** Papers citing a
   country's PLEXOS model often credit the commissioning agency or the
   consultancy that built it in the acknowledgements, even when neither has
   a public-facing announcement.

## Role taxonomy discipline

See `data/DATA_SCHEMA.md` for the full definitions. The two mistakes this
project made and fixed:
- `subject_of_study` was initially never used (an unwritten "exclude rather
  than subject_of_study" convention had calcified across early batches) —
  it's a legitimate role for an organization passively modeled in someone
  else's study. Don't over-apply it either: only use it when there's no
  plausible direct-user/commissioner role for the same organization.
- `consultant_modeler` vs. `research_user` is a judgment call when an
  academic institution works alongside a commissioning agency as a
  co-equal partner rather than a hired vendor — lean `research_user` in
  that case (see the NEXT Group/South Korea reclassification in
  `src/data/changelog.json`).

## Stale negatives: when to re-check a rejection

A `status=rejected` or `gap_confirmed` row is not necessarily permanent.
Re-check when:
- A new search technique becomes available that wasn't tried before (e.g.
  a country was searched 4 times in English and rejected, but never in its
  own language — this reversed Colombia/UPME after 4 prior negatives).
- Significant time has passed and the organization may have adopted the
  tool since the last check.
Don't re-check a rejection with the *same* technique that already produced
it — that just re-confirms the same negative and wastes effort.

## Avoiding duplicates

Before adding a row, check `data/catalogue_merged.csv` for the same
institution name (watch for alias spellings — "National Grid ESO" renamed
to "NESO", abbreviations vs. full names) and the same country under a
different spelling (`scripts/validate_dataset.py` flags known alias
clusters, but new ones can appear — add them to the `COUNTRY_ALIASES` list
in that script if found).

## What "done" looks like for a research wave

Every country in `research/world_country_checklist.csv` has been searched
at least once (even a confirmed `gap_confirmed` is progress — it means a
future wave doesn't have to start from zero). A wave is genuinely
exhausted, not abandoned early, when multiple independent techniques (not
just one repeated) have come up empty.
