# Data schema

GridLens's dataset lives in two raw CSVs under `data/raw/`, gets merged by
`scripts/sync_dataset.py` into `data/catalogue_merged.csv`, and is mirrored
into `src/data/catalogue.json` (what the app actually imports — never edit
this JSON by hand, it's regenerated).

```
data/raw/plexos_organizations.csv   ──┐
                                        ├─▶ scripts/sync_dataset.py ─▶ data/catalogue_merged.csv ─▶ src/data/catalogue.json
data/raw/upstream_baseline.csv      ──┘
```

## Which raw file do I add a row to?

- **New organization using PLEXOS specifically** (direct user, consultant,
  commissioner, researcher, or passively studied) → `data/raw/plexos_organizations.csv`.
  This schema carries a role taxonomy and evidence classification tuned for
  PLEXOS-specific research (see `research/RESEARCH_PLAYBOOK.md` for how to
  find and verify one).
- **New organization using any other energy-system-modelling tool** (PyPSA,
  Antares, SWITCH, GridPath, etc.) → `data/raw/upstream_baseline.csv`. This
  schema is simpler and is already in the app's own display format.
- **Correcting or removing an existing row** → edit/delete the row in
  whichever raw file it lives in (check `dataset_origin` in
  `catalogue_merged.csv` or `notes` in the PLEXOS file to tell which), then
  re-run the sync. Never edit `catalogue_merged.csv` or `catalogue.json`
  directly — they get overwritten.

After any edit: `npm run validate-data` then `npm run sync-data`, then
`npm run build` to confirm the app still builds, then add a
`src/data/changelog.json` entry (see `CHANGELOG_MAINTENANCE.md`).

## `data/raw/plexos_organizations.csv` columns

| Column | Required | Meaning |
|---|---|---|
| `candidate_id` | yes | Unique ID for this row, e.g. `ORG-BATCH23-0001`. Must not collide with any existing ID. |
| `organization_name` | yes | The institution's name, in English where there's a common English name, otherwise its own name. |
| `country` | yes | Canonical country name. **Check for alias collisions** (e.g. "USA" vs "United States") — `scripts/validate_dataset.py` flags these, but pick one spelling before committing. Use `"Multi-country (...)"` for regional bodies (e.g. ENTSO-E, WAPP). |
| `category` | no | Free-text institution type, e.g. `"Transmission System Operator"`, `"Consultancy"`, `"Academic / Research Institution"`. Keep consistent with existing values where one already fits — don't invent a near-duplicate category. |
| `role` | yes | One of: `direct_user`, `commissioner`, `consultant_modeler`, `research_user`, `subject_of_study`, `qa_reviewer`, `rejected`. See role definitions below. |
| `plexos_mentioned` | no | `true`/`false` — whether the source explicitly names PLEXOS (vs. a generic "energy system model"). |
| `source_url` | yes | A working URL to the primary evidence (the organization's own document/page preferred over a vendor case study). |
| `ledger_id` | no | Free-text batch/session identifier for provenance (not machine-validated). |
| `evidence_classification` | yes | One of: `confirmed`, `confirmed_direct_user`, `confirmed_commissioner`, `confirmed_consultant_modeler`, `confirmed_research_user`, `confirmed_subject_of_study`, `confirmed_qa_reviewer`, `probable`, `probable_direct_user`. `probable*` rows are excluded from the app's dataset by `sync_dataset.py` (only `status=confirmed` rows sync) — use `probable` for leads worth tracking but not yet evidence-backed enough to publish. |
| `historical_or_current` | yes | `current` or `historical` — is the PLEXOS use still active, or a past engagement? |
| `already_represented` | no | `true`/`false` — internal dedup flag from the research process; `true` means this row duplicates an existing institution under a different name/batch. |
| `batch_id` | no | Which research batch/wave found this row (provenance only). |
| `status` | yes | `confirmed` (syncs into the app), `candidate` (not yet verified, excluded), `rejected` (evidence didn't hold up, excluded), `gap_confirmed` (actively searched, genuinely no evidence found — used for country-coverage tracking, not a row about an organization). |
| `notes` | no | Free text: caveats, the evidence quote/reasoning, anything a reviewer should know. |

### Role definitions

- `direct_user` — the organization runs PLEXOS itself for its own planning/operations.
- `commissioner` — the organization paid for/requested a PLEXOS study but didn't build the model itself.
- `consultant_modeler` — the organization built/ran the PLEXOS model as a vendor for someone else.
- `research_user` — academic/research use, typically co-equal with a commissioning org rather than a hired vendor.
- `subject_of_study` — the organization's grid/system was modeled in someone else's PLEXOS study; it did not commission or run anything itself. Use sparingly — only when there's no plausible commissioner/direct-user role for the same organization.
- `qa_reviewer` — reviewed/validated someone else's PLEXOS-based study.
- `rejected` — a candidate that was investigated and evidence did NOT hold up. Kept in the file (not deleted) so the search isn't repeated; `status` should also be `rejected`.

## `data/raw/upstream_baseline.csv` columns

Already the app's own display schema — every column here maps 1:1 onto what
`WorldMap`/`DataTable`/etc. read. See `src/types.ts`'s `CatalogueRecord`
interface for the authoritative field list.

| Column | Required | Meaning |
|---|---|---|
| `country_label` | yes | Display country name (same alias-collision caution as above). |
| `institution_name` | yes | The institution's name. |
| `official_website` | no | Institution's homepage. |
| `tool_name` | yes | e.g. `PyPSA`, `NEWAVE`, `Antares`. |
| `tool_category` | no | e.g. `production_cost_uc`, `capacity_expansion` — keep consistent with existing values. |
| `use_case` | yes | One sentence: what the tool is used for. |
| `evidence_strength` | yes | `HIGH`, `MEDIUM`, or `LOW`. |
| `source_type` | no | e.g. `news_release`, `academic_paper`, `procurement_notice`. |
| `source_title` | no | Title of the source document. |
| `source_date` | no | Date of the source (free text, not strictly validated). |
| `source_link` | yes | Working URL to the evidence. |
| `exact_snippet_or_quote` | no | A direct quote supporting the claim — strongly preferred over paraphrase. |
| `why_it_supports_the_claim` | yes | One sentence connecting the quote/source to the claim being made. |
| `notes` | no | Anything else a reviewer should know. |

## Evidence standards (applies to both files)

1. **First-person evidence beats third-party mentions.** An organization's
   own planning document, press release, or procurement record stating it
   uses a tool outranks a vendor's case-study page naming the same
   organization as a client.
2. **A direct quote is worth more than a paraphrase.** Prefer filling
   `exact_snippet_or_quote` / putting the quote in `notes` over summarizing.
3. **A rejected lead stays in the file as `status=rejected`**, not deleted —
   this prevents a future wave from re-investigating the same dead end from
   scratch. See `research/RESEARCH_PLAYBOOK.md`'s "stale negatives" section
   for when it's still worth re-checking a rejection.
4. **No fabrication.** If a plausible-sounding organization/claim can't be
   backed by a real, checkable URL, it doesn't go in the dataset — flag it
   in `research/world_country_checklist.csv` as a gap instead.
