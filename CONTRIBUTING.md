# Contributing to GridLens

Thanks for considering a contribution. This repo accepts three kinds of
contributions, and the bar is different for each:

## 1. Dataset contributions (new/corrected/removed organizations)

This is the contribution type we expect most of — both from human
contributors and from scheduled LLM research agents.

**Quick start:**
1. Read `data/DATA_SCHEMA.md` — which CSV to edit, column meanings, enum
   values.
2. Read `research/RESEARCH_PLAYBOOK.md` — proven search techniques and
   evidence standards, so you're not starting from zero.
3. Append one JSON line to `data/raw/catalogue.jsonl` for the new
   organization/tool (any tool, not just PLEXOS — it's one unified file).
4. `npm run sync-data` to regenerate the merged dataset.
5. Add a `src/data/changelog.json` entry per `CHANGELOG_MAINTENANCE.md`.
6. Open a PR with: the `catalogue.jsonl` diff, the regenerated
   `data/catalogue_merged.csv` + `src/data/catalogue.json`, the changelog
   entry, and **a source URL for every new/changed claim** in the PR
   description.

**What gets a claim rejected in review:** no working source URL, a vendor
case-study mention with no independent corroboration for a `confirmed`
status (use `status=candidate` instead), or a country spelled differently
from its existing entries (splits the choropleth map — `npm run
validate-data` catches most of these).

## 2. App contributions (features, fixes, performance, design)

Standard GitHub flow: fork, branch, PR. Before opening a PR:
- `npm run build` must show 0 TypeScript errors.
- If it's a visible UI change, include a screenshot in the PR description.
- Match the existing Tailwind v4 / OET-brand conventions already in the
  codebase (see `AGENTS.md`'s "Workflow: contributing an app change")
  rather than introducing a new styling approach.
- No new backend/server dependency, no paid API keys — this app is
  intentionally zero-cost and client-side only.

## 3. Using your own AI agent (Claude Code, Codex, Cursor, etc.)

This repo is written to be picked up cold by an AI coding agent with zero
prior context:
- Point your agent at `AGENTS.md` first — it's the single entry point
  covering repo layout, commands, conventions, and both contribution
  workflows above in agent-actionable detail.
- Claude Code specifically: `data/AGENTS.md` and `research/AGENTS.md` are
  nested agent-context files that get auto-attached the moment Claude
  reads any file in those folders — you don't need to point it there
  manually. They're short pointers to the full `DATA_SCHEMA.md`/
  `RESEARCH_PLAYBOOK.md` reference docs, which aren't auto-loaded and
  should be read in full before editing data.
- `scripts/validate_dataset.py` and `scripts/sync_dataset.py` are meant to
  be run by an agent, not just a human — they're deterministic, exit
  non-zero on problems, and print exactly what's wrong.

If you're running a scheduled/weekly agent against this repo (the intended
long-term usage — see `AGENTS.md`'s "Weekly automated research" section),
have it open a PR scoped to one research wave's findings rather than
pushing to main or mixing dataset and app changes in one PR.

## Code of conduct

Be straightforward and evidence-based, same standard the dataset itself is
held to: no fabricated claims, no unverifiable sources, disagree on
substance not personalities. Issues and PRs that don't meet the evidence
bar in `data/DATA_SCHEMA.md` will be asked for a source, not merged as-is.

## Questions

Open a GitHub issue. For anything about the underlying mission/organization,
see the About page in the running app or
[openenergytransition.org](https://openenergytransition.org/).
