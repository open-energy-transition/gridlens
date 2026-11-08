## What changed and why

<!-- One or two sentences. If this is a dataset change, name the organization(s) and link the evidence source(s) here. -->

## Type of change

- [ ] Dataset contribution (new/corrected/removed organization)
- [ ] App feature/fix
- [ ] Documentation

## Dataset contributions only

- [ ] Added/edited the line in `data/raw/catalogue.jsonl` (not the generated files)
- [ ] Ran `npm run sync-data` and committed the regenerated `data/catalogue_merged.csv` + `src/data/catalogue.json`
- [ ] Added a `src/data/changelog.json` entry per `CHANGELOG_MAINTENANCE.md`
- [ ] Every new/changed claim has a working source URL (linked above)

## App changes only

- [ ] `npm run build` passes with 0 TypeScript errors
- [ ] Screenshot attached if this is a visible UI change
- [ ] No new backend/server dependency or paid API introduced
