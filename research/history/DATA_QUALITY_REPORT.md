# Data Quality Report — candidate_organizations.csv

**Date:** 2026-11-07
**Method:** Deterministic Python/csv-module validation (no LLM judgment used), scripts: `audit_csv.py` (read-only checks), `fix_csv.py` (applies fixes). Backup of pre-fix file saved as `candidate_organizations.csv.bak`.

## Scope checked
1. Malformed rows (column misalignment from unquoted commas in `organization_name`/`notes`)
2. Enum-field validity: `role`, `status`, `historical_or_current`, `plexos_mentioned`, `already_represented`
3. Exact duplicates: same `(organization_name, country)` AND same `role` AND same `source_url`
4. Required fields non-empty: `source_url`, `ledger_id`, `organization_name`, `candidate_id`
5. Country-name consistency (alias/variant clustering, e.g. "United States" vs "USA" vs "US")

## Findings

| Check | Before | Result |
|---|---|---|
| Row/column misalignment | 342 rows | **0 malformed rows** — no unquoted-comma column shifts found (the Europe/Brazil-batch bug did not recur here) |
| Invalid `role` values | — | 0 — all 342 rows use one of the 7 valid taxonomy values |
| Invalid `historical_or_current` | — | 0 — all values are `current`/`historical` |
| Invalid `status` | — | all 342 rows are `status=confirmed` (no other status values present in this file) |
| Boolean inconsistency: `plexos_mentioned` / `already_represented` | 154 cells across 77 rows (lines 217–297, batches `batch31_vendor_mining`–`batch35_us_irp_deepen`) used `Yes`/`No` instead of `true`/`false` | **Fixed** — normalized to `true`/`false` |
| Missing `source_url` / `ledger_id` / `organization_name` / `candidate_id` | 0 missing in any row | No action needed |
| True duplicates (same org + country + role + source_url) | 1 found: `American Electric Power (AEP)`, United States, `direct_user`, same source URL (`energyexemplar.com/.../aep-speeds-irp-updates-with-plexos-intelligence`), rows `ORG-VMINE-0001` (line 217) and `ORG-USIRP-0005` (line 302) | **Fixed** — removed `ORG-VMINE-0001`. Its own notes field explicitly said *"second AEP case study also exists ... same org, not separately rowed"* — a later batch (`batch35_us_irp_deepen`) re-added it anyway without checking the existing catalogue. Kept `ORG-USIRP-0005`, which has the more specific `evidence_classification` (`confirmed_direct_user` vs generic `confirmed`) and richer, independently-corroborating notes (two named AEP employees quoted). |
| Legitimate multi-engagement duplicates (same org+country, different role or source) | 8 found pre-fix, 7 remain post-fix: IES (Australia), MISO (US), NESO (UK), Eskom (South Africa), NEOM (Saudi Arabia), EWEC (UAE), Arup (UK) | **No action** — each pair has a distinct `role` and/or `source_url`, i.e. genuinely separate engagements, not accidental duplicates. Left as-is. |
| Country-name variants (e.g. US/USA/United States, UK/U.K., etc.) | 109 distinct country values checked against a known alias table (US, UK, South Korea, Czech Republic, Russia, UAE, Ivory Coast variants) | **0 variant collisions found** — every country already uses one canonical spelling throughout the file (e.g. only "United States" appears, never "USA"/"US"). |

## Fixes applied directly to `candidate_organizations.csv`
1. Normalized 154 boolean cells (`Yes`→`true`, `No`→`false`) in `plexos_mentioned` and `already_represented` across 77 rows, for consistency with the `true`/`false` convention used by the other 265 rows.
2. Removed 1 true duplicate row (`ORG-VMINE-0001`), keeping the better-evidenced duplicate (`ORG-USIRP-0005`).

## Row counts
- Before: 342 data rows
- After: 341 data rows (1 duplicate removed)
- Column count verified uniform (14 columns) across all 341 rows after fix.
- No duplicate `candidate_id` values remain.

## Not changed (flagged for awareness, not auto-fixed)
- 7 multi-engagement org/country pairs remain by design (different role and/or source per engagement) — correct per the catalogue's model of tracking multiple engagements for the same organization.
- All rows carry `status=confirmed`; no `rejected`/`pending` rows exist in this file to cross-check against a broader status lifecycle.

## Artifacts
- `audit_csv.py` — re-runnable deterministic validator (writes `audit_report.json`, currently cleaned up/not committed since it's a byproduct; re-run to regenerate).
- `fix_csv.py` — the fix script that was run once; idempotent-safe to re-run (second run would be a no-op since the bad values no longer exist).
- `candidate_organizations.csv.bak` — pre-fix backup of the full file.

---

# Second Data Quality Audit (post-expansion, 342 → 388 rows)

**Date:** 2026-11-07
**Trigger:** catalogue grew from 342 to 388 rows (46 new rows) via several merged batches with different source-file schemas, plus a new wave of `subject_of_study` rows. Re-ran the full deterministic checklist to catch issues the merges might have introduced.
**Method:** Deterministic Python/csv-module validation (no LLM judgment), scripts: `audit_csv2.py` (read-only checks, writes `audit_report2.json`), `fix_csv2.py` (applies fixes). Backup of pre-fix file saved as `candidate_organizations.csv.bak2`.

## Scope checked
1. Malformed rows — every row has exactly 14 columns matching the header (no unquoted-comma shifts)
2. Enum validity: `role` (7-value taxonomy incl. new `qa_reviewer`) and `status` (should be all `confirmed`)
3. True accidental duplicates: same `(organization_name, country, role, source_url)`
4. Required fields non-empty: `source_url`, `ledger_id`, `candidate_id`, `organization_name`, `country`, `role`
5. Country-name consistency, incl. alias clusters likely to appear in newly merged batches: Côte d'Ivoire/Ivory Coast, Czech Republic/Czechia, UAE/United Arab Emirates, US/USA/United States, UK/United Kingdom, South Korea variants, Russia/Russian Federation, DRC variants, Turkey/Türkiye, etc.
6. Boolean field consistency (`plexos_mentioned`, `already_represented` must be lowercase `true`/`false`)

## Findings

| Check | Before | Result |
|---|---|---|
| Row/column misalignment | 388 rows | **0 malformed rows** — every row has exactly 14 fields; the differently-schema'd merged batches (subject_of_study wave, linkedin batches, deepen batches) were all normalized to the master schema correctly before merge |
| Invalid `role` values | — | 0 — all 388 rows use one of the 7 valid taxonomy values. Distribution: `direct_user` 164, `research_user` 86, `consultant_modeler` 75, `commissioner` 36, `subject_of_study` 24, `qa_reviewer` 3 (new role from the taxonomy update, 0 found in the first audit's 342 rows — correctly populated in this merge wave), `rejected` 0 |
| Invalid `historical_or_current` | — | 0 — all values are `current` (317) / `historical` (71) |
| Invalid `status` | — | all 388 rows are `status=confirmed` — no non-confirmed rows leaked into the merge, as required |
| Boolean inconsistency: `plexos_mentioned` / `already_represented` | **2 cells found**, both on one row: `tech_dc_001` (Constellation Energy Generation LLC, `batch55_tech_datacenter`) — `plexos_mentioned=yes` and `already_represented=no` instead of `true`/`false`. This is a new, small regression from one of the post-first-audit merge batches (a single-row straggler, not a systemic batch-wide issue like the 154-cell one found in the first audit) | **Fixed** — normalized both cells to `true`/`false` |
| Missing `source_url` / `ledger_id` / `candidate_id` / `organization_name` / `country` / `role` | 0 missing in any of the 388 rows | No action needed |
| True duplicates (same org + country + role + source_url) | **0 found** — the duplicate class fixed in the first audit (AEP re-added by a later batch) did not recur; no new accidental re-additions detected across all 46 new rows | No action needed |
| Country-name alias collisions (Côte d'Ivoire/Ivory Coast, Czech Republic/Czechia, UAE/United Arab Emirates, US/UK variants, South Korea, Russia, DRC, Turkey, etc.) | 128 distinct country values across 388 rows, checked against 16 known alias clusters | **0 collisions found** — new `subject_of_study` rows and all differently-schema'd batches consistently used the catalogue's existing canonical spellings (`Cote d'Ivoire`, `Czech Republic`, `United Arab Emirates`, `United States`, `United Kingdom`, `South Korea`, `Russia`) rather than introducing variant forms |
| Duplicate `candidate_id` values | — | 0 — all 388 candidate IDs unique across every merged batch |

## Noted but not auto-fixed (flagged for awareness)
- A subset of newly-added rows (mostly `subject_of_study` and multi-country engagement rows from batches like `batch_africa_me01`, `batch_eafrica01`, regional-subject batches) use **descriptive/compound `country` values** rather than a single ISO-style country name, e.g. `"United States (California LTPP intervenor work)"`, `"Multi-country (West African Power Pool region: Benin, Cote d'Ivoire, Burkina Faso, ...)"`, `"Pan-European (44 TSO Members across 27 European countries)"`, `"Norway (global HQ; case study concerns PJM-region US project)"`. These are **not alias collisions** (no case duplicates a canonical spelling under a different name) and are not mechanically wrong, but they are schema-inconsistent with the single-country convention used by the other ~95% of rows. Left unchanged because splitting them into a clean single `country` value plus a separate region/context field would require judgment calls about which country is "primary" for each row — exactly the kind of fix this deterministic pass is scoped to avoid. Recommend a follow-up pass (human or LLM-assisted) to decide a `country` + `region_note` schema if these compound values keep recurring in future batches.
- `qa_reviewer` role (added to the taxonomy 2026-11-06) now has 3 populated rows; no further action needed, confirms the taxonomy update was picked up correctly in this merge wave.

## Fixes applied directly to `candidate_organizations.csv`
1. Normalized 2 boolean cells (`yes`→`true`, `no`→`false`) on row `tech_dc_001` (`plexos_mentioned`, `already_represented`).

## Row counts
- Before this audit: 388 data rows
- After this audit: 388 data rows (no rows removed — no true duplicates found this round)
- Column count verified uniform (14 columns) across all 388 rows after fix.
- No duplicate `candidate_id` values.

## Artifacts
- `audit_csv2.py` — re-runnable deterministic validator for this round (writes `audit_report2.json`).
- `fix_csv2.py` — the fix script that was run once; idempotent-safe to re-run (second run is a no-op, confirmed).
- `candidate_organizations.csv.bak2` — pre-fix backup of the full 388-row file taken before this audit's fix.


---

# Data Quality Report — Wave 3 (Third Audit) — candidate_organizations.csv

**Date:** 2026-11-07
**Method:** Deterministic Python/csv-module validation, no LLM judgment. Script: `audit_csv3.py` (new, reusable script extending the Wave 2 `audit_csv2.py` pattern; also cross-validates `world_country_checklist.csv`). Full machine-readable output: `audit_report3.json`.
**Backup:** `candidate_organizations.csv.bak` created before any fix was applied (420 rows, pre-fix snapshot).
**Row count at start of this audit:** 420 data rows (up from 388 at Wave 2).

## Scope checked
1. Malformed rows (column count mismatch vs. 14-column header)
2. `role` enum validity against the 7-value taxonomy (`direct_user, commissioner, consultant_modeler, research_user, subject_of_study, qa_reviewer, rejected`), and specifically whether any `rejected`-role rows exist in the master CSV (they must not — master should only hold confirmed rows)
3. `status` enum (`confirmed` only expected in master)
4. Boolean-like field normalization: `plexos_mentioned`, `already_represented` must be exactly `true`/`false`
5. Duplicate `candidate_id` values
6. Exact duplicate `(organization_name, country, role)` combinations (reported separately from duplicates that also share identical `source_url`, since different source URLs can represent legitimately distinct engagements)
7. Required fields present and non-empty: `candidate_id, organization_name, country, role, source_url`
8. Country-name alias consistency **within** `candidate_organizations.csv` (internal collisions, same cluster list as Wave 2: Ivory Coast/Côte d'Ivoire, Czechia/Czech Republic, UAE/United Arab Emirates, USA/US/United States, UK/United Kingdom, South Korea/Republic of Korea, Russia, Vietnam, Laos, Tanzania, North Macedonia, Eswatini, Cape Verde, Myanmar, DRC, Congo, Turkey clusters)
9. **New this wave:** Country-name alias consistency **between** `candidate_organizations.csv` and `world_country_checklist.csv`'s canonical country names
10. **New this wave:** `world_country_checklist.csv` internal integrity — do `covered + gap_confirmed + candidate_pending` sum to 200, and does every `covered` country have at least one matching row in `candidate_organizations.csv` (full programmatic cross-check of all 120 `covered` rows against all 420 candidate rows, not a sample)

## Findings

| Check | Result |
|---|---|
| Malformed rows (bad column count) | 0 |
| Invalid `role` values (outside the 7-value taxonomy) | 0 |
| `rejected`-role rows found in master CSV | **0** — confirmed clean; master correctly contains only confirmed rows |
| Invalid `status` values | 0 (all 420 rows `status=confirmed`) |
| Duplicate `candidate_id` values | 0 |
| Missing required fields | 0 |
| **Boolean-field normalization bug** | **8 bad cells found** — 4 rows (`ORG-ADBDM2-0001..0004`, batch `batch82_adb_deep_mine2`, lines 416–419) had `plexos_mentioned=yes` and `already_represented=no` instead of `true`/`false`. **FIXED** (see below). |
| Exact duplicate `(organization_name, country, role)` groups | 5 groups / 10 rows found — **all five involve different `source_url` values** (see table below), consistent with distinct independently-sourced engagements (e.g. a vendor case-study blog post *and* a separate regulatory filing both documenting the same org/country/role). **Not auto-fixed** — flagged for human judgment per instructions, since collapsing them would require editorial judgment about whether they're truly one engagement or two. |
| Country-alias collisions *within* `candidate_organizations.csv` | 0 — internal country naming is self-consistent this wave |
| Country-alias mismatches *between* `candidate_organizations.csv` and `world_country_checklist.csv` | **2 found** (see below) |
| `world_country_checklist.csv` status-count sum | 120 covered + 79 gap_confirmed + 1 candidate_pending = **200** ✓ correct |
| `covered` countries with no matching row in `candidate_organizations.csv` | **10 found** (see below) — programmatic full cross-check, not a sample |

### Exact duplicate `(organization_name, country, role)` groups (not auto-fixed, flagged)

| Org | Country | Role | Lines | Source URLs differ? |
|---|---|---|---|---|
| Midcontinent ISO (MISO) | United States | direct_user | 19, 224 | Yes — MISO's own RRA report vs. an Energy Exemplar vendor blog post |
| China EPPEI | Azerbaijan | consultant_modeler | 136, 409 | Yes — report.az article vs. ADB forum PDF + same report.az article |
| NEOM | Saudi Arabia | direct_user | 230, 291 | Yes — Energy Exemplar customer page vs. LinkedIn profile citations |
| EWEC | United Arab Emirates | direct_user | 240, 290 | Yes — Energy Exemplar blog vs. EWEC's own capacity-requirements report |
| Arup | United Kingdom | consultant_modeler | 323, 325 | Yes — NESO document vs. Ofgem market-modelling report |

These look like independently-discovered citations for the same underlying engagement surfaced by different research batches, rather than accidental copy-paste duplicates (no identical source_url in any pair). Recommend a future wave do a manual pass to decide whether each pair should be merged into a single row with multiple source URLs (per the `ORG-0003` AEMO precedent of keeping genuinely distinct engagements separate) — left untouched this wave per "no deletion without explicit confirmation."

### Country-alias mismatches vs. `world_country_checklist.csv` canonical names

1. Candidate CSV uses **"Cote d'Ivoire"**; checklist's canonical name is **"Ivory Coast"**. These refer to the same country but don't string-match, so the checklist's `covered` status for Ivory Coast doesn't get picked up by a naive join, and the candidate rows naming "Cote d'Ivoire" don't count toward that coverage total.
2. Candidate CSV uses **"Democratic Republic of Congo"**; checklist's canonical name is **"Democratic Republic of the Congo"** (also aliased in the checklist as "DRC"). Same mismatch class — missing "the" plus naming-convention drift.

Both are real alias mismatches that affect automated coverage counting (see next section) — flagged for a naming-standardization fix in a future wave (not auto-renamed here since it touches >1 row's `country` column across multiple batches and should be confirmed before bulk-editing).

### `covered` countries in `world_country_checklist.csv` with no matching row in `candidate_organizations.csv` (full cross-check of all 120 `covered` entries)

`Moldova, North Macedonia, Albania, Montenegro, Kosovo, Oman, Zambia` — **7 genuine gaps**: checklist marks these `covered` but no `candidate_organizations.csv` row has that exact country value. Note some of these *do* appear as part of composite multi-country notes/strings (e.g. a Balkans-regional row whose `country` field is itself a long descriptive string listing "Albania, Bosnia and Herzegovina, Kosovo, Moldova, Montenegro, North Macedonia, Serbia, Ukraine..." rather than one canonical country per row), so the underlying evidence may exist but isn't indexed in a way a programmatic per-country join can find it. This is a **structural/indexing issue**, not necessarily a false "covered" claim — flagged for review, not auto-fixed (would require splitting composite rows into per-country entries, an editorial decision).

`Ivory Coast, DRC, Democratic Republic of the Congo` — **3 of the 10** are the alias-mismatch cases already identified above (candidate CSV spells them differently). Not a real coverage gap, just a naming join failure.

Net: of 10 nominally-missing `covered` countries, 3 are alias-naming false positives and 7 are either genuine gaps or hidden inside composite/multi-country `country` field values that a straight per-row join can't resolve — recommend normalizing country-alias naming and splitting composite multi-country rows in a future wave.

## Fixes applied directly to `candidate_organizations.csv`

| Fix | Rows affected | Before → After |
|---|---|---|
| Normalize `plexos_mentioned`/`already_represented` `yes`/`no` → `true`/`false` | 4 rows (`ORG-ADBDM2-0001..0004`, lines 416–419), 8 cells total | `bad_boolean_cells: 8` → `bad_boolean_cells: 0` after re-run |

No rows were deleted or merged. No `country` values were renamed (flagged only, per instructions not to auto-fix ambiguous cases).

## Row counts (before → after)

- Total data rows: 420 → 420 (unchanged — no rows added or removed)
- Malformed rows: 0 → 0
- Bad boolean cells: 8 → 0 ✓ fixed and verified by re-running `audit_csv3.py`
- Duplicate candidate_ids: 0 → 0
- Rejected-role rows in master: 0 → 0 (none existed; confirmed clean)

## Not changed (flagged for awareness, not auto-fixed)

- 5 exact `(organization_name, country, role)` duplicate groups (10 rows) with differing `source_url` — ambiguous whether to merge; left as-is.
- 2 country-alias mismatches between `candidate_organizations.csv` and `world_country_checklist.csv` ("Cote d'Ivoire" vs "Ivory Coast"; "Democratic Republic of Congo" vs "Democratic Republic of the Congo"/"DRC") — left as-is, affects automated coverage-count joins.
- 7 `covered`-status countries in the checklist with no directly-matching candidate row (some may be addressed by composite multi-country rows that aren't split per-country) — left as-is.
- ~25 composite/multi-country `country` field values in `candidate_organizations.csv` (e.g. "Pan-European...", "Global", "France/United States/Global", Balkans-regional strings) that don't match any single checklist country verbatim — these are intentional multi-country descriptions, not bugs, but they reduce the reliability of any future automated per-country join against the checklist. Flagged for awareness only.

## Artifacts

- `audit_csv3.py` — new deterministic validator script (reusable for future waves)
- `audit_report3.json` — full machine-readable findings
- `candidate_organizations.csv.bak` — pre-fix backup (420 rows, pre-boolean-normalization)
