# Changelog maintenance

GridLens's landing page and `/changelog` page show a feed of **dataset
content changes only** — new organizations, removed organizations, role
reclassifications, and country-coverage expansions. It deliberately does
**not** show app/UI changes (new features, redesigns, bug fixes, icon
changes, etc.) — see the 7 Nov 2026 rework commit for why: it was modeled
directly on artificialanalysis.ai's own `/changelog`, which is 100% new
models/evaluations/methodology updates, zero entries about their own site's
UI.

## When to add an entry

Whenever the underlying dataset changes in one of these ways, add a new
entry to `src/data/changelog.json` in the **same commit/session** as the
data change:

- A new organization is added to the catalogue (confirmed direct_user,
  commissioner, consultant_modeler, researcher, or subject_of_study role)
- An organization is removed (evidence didn't hold up on review)
- An organization's role/classification is corrected (e.g. consultant_modeler
  -> research_user, or a rejected->confirmed reversal)
- Country coverage changes (new countries added to the tracked checklist,
  or a country's status changes)

Do **not** add an entry for: UI redesigns, new app features/pages, bug
fixes, performance work, dependency bumps, copy/grammar fixes. Those are
normal commits, not changelog-worthy.

## Entry format

Each entry in `src/data/changelog.json`:
```json
{
  "date": "7 Nov 2026",
  "tag": "added",
  "title": "UPME (Colombia) confirmed as a PLEXOS direct user",
  "description": "One sentence: what changed and the evidence/reason, specific enough to be useful."
}
```
- `tag` is one of: `added` (new org), `removed`, `reclassified`, `coverage`
  (country-list changes). Add a new tag + icon/style in
  `src/components/common/Changelog.tsx`'s `TAG_STYLES` map if a genuinely
  new category is needed — don't force an awkward fit into the existing 4.
- `date` uses real, known dates (`D Mon YYYY`) pulled from the actual
  change record (e.g. the catalogue repo's `progress.md`, a commit date).
  Never invent a specific day you don't actually know — fall back to a
  month or range (`"Oct–Nov 2026"`) instead of fabricating false precision.
- `title` should name the actual organization/entity, not a vague summary
  ("GRIDCo (Ghana Grid Company Limited) added", not "New African entity
  added").
- New entries go at the **top** of the array (most recent first) — the
  component doesn't sort, it trusts array order.

## Where the source of truth lives

The GridLens web app (`plexos-catalogue-web`) is a display layer over data
that's actually researched/maintained in the separate
`plexos-organization-catalogue` repo (`progress.md`, `candidate_organizations.csv`).
When that repo's catalogue is updated and re-merged into GridLens's
`src/data/catalogue.json`, that's the trigger to also update
`src/data/changelog.json` — read the relevant `progress.md` wave entries for
exact org names, dates, and reasoning rather than summarizing from memory.
