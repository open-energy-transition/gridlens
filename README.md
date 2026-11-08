# GridLens

[![CI](https://github.com/open-energy-transition/gridlens/actions/workflows/ci.yml/badge.svg)](https://github.com/open-energy-transition/gridlens/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-brightgreen.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](.nvmrc)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![AI-agent ready](https://img.shields.io/badge/AI%20agent-ready-blueviolet.svg)](AGENTS.md)

*See who's using which energy models, where, and for what grid decisions.*

GridLens tracks real-world adoption of energy system modelling tools
(PLEXOS, PyPSA, and dozens more) by institutions worldwide — 509 records
and counting, each with a role, a grid decision, and an evidence source.
Built and maintained by [Open Energy Transition](https://openenergytransition.org/).
Fully client-side: no backend, no database, no paid APIs, no API keys —
everything runs in the browser against a static dataset.

This repo is the **canonical public home** for both the app and the
dataset behind it, replacing the earlier `esm-usage-catalog` prototype.

## Why this repo is designed the way it is

The dataset is never finished. Organizations adopt, drop, or switch tools;
new case studies surface; existing entries get corrected or removed as
evidence is re-checked. That's expected to keep happening — by human
contributors, and by scheduled LLM research agents running the same
playbook this dataset was originally built with. So the repo is structured
so **anyone, with their own AI coding agent and zero other context, can
clone it and start contributing immediately**:

- **`AGENTS.md`** is the single entry point for an AI agent: repo map,
  commands, both contribution workflows (data + app), and the
  non-negotiables (evidence standards, no backend, changelog discipline).
- **`data/DATA_SCHEMA.md`** documents every column, every enum value, and
  which of the two raw CSVs a new finding goes into.
- **`research/RESEARCH_PLAYBOOK.md`** distills the actual search techniques
  that found 419 organizations in this dataset's original research pass —
  not generic advice, but what specifically worked (development-bank
  procurement APIs, non-English source search, stale-negative re-checking,
  and why).
- **`scripts/validate_dataset.py`** + **`scripts/sync_dataset.py`** turn a
  raw CSV edit into a working app update deterministically — no manual
  pandas wrangling required.

See **`CONTRIBUTING.md`** for the concrete how-to, whichever kind of
contribution you're making.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
```

```bash
npm run build          # type-check (tsc -b) + production build into dist/
npm run test            # vitest, pure-logic regression tests
npm run validate-data   # check data/raw/*.csv before syncing
npm run sync-data       # regenerate data/catalogue_merged.csv + src/data/catalogue.json
```

Requirements: Node.js — version pinned in `.nvmrc` (`nvm use`), tested with
v26 — and npm (tested with v11). Python 3 stdlib only for the two data
scripts above (`csv`/`json`, no installs needed).

See `DEPLOYMENT.md` for how to actually publish a build (GitHub Pages,
Vercel, Netlify, or any static host — it's a zero-backend static app).

## What's inside the app

- **Overview** — top-N tools by record count, plus a "What's changed" feed
  of recent dataset additions/removals/reclassifications.
- **Geographic Analysis** — a zoomable/pannable world choropleth (sqrt color
  scale so low-count countries stay visible, not just the highest-count
  one), with a numerically-labeled legend and a top-15 country ranking.
- **Tools & Categories** — tool-category and evidence-strength breakdowns.
- **Institutions** — top institutions by record count.
- **Top Users by Tool** — an independent tool selector (defaults to PLEXOS)
  showing the biggest institutional/country users of that specific tool.
- **Records & Export** — a sortable, filterable, column-configurable table
  with a client-side CSV export.
- **Changelog** — the full history of dataset content changes (new/
  removed/reclassified organizations), separate from app-feature changes.
- **About** — purpose, methodology, data sources, GitHub link.

## Repository layout

```
AGENTS.md                      AI agent entry point — read this first
CONTRIBUTING.md                Human contribution guide
CHANGELOG_MAINTENANCE.md       src/data/changelog.json convention
DEPLOYMENT.md                  How to publish a build (GitHub Pages / Vercel / Netlify / any static host)
.nvmrc                         Pinned Node version

data/
  raw/catalogue.jsonl            The entire dataset, one JSON object per line — edit to add any finding
  raw/incoming/                   Staging dir for parallel research batches (see merge_batches.py)
  schema.json                     machine-checkable field contract (required fields, enums)
  catalogue_merged.csv            generated, do not hand-edit
  DATA_SCHEMA.md                  field reference + evidence standards

research/
  RESEARCH_PLAYBOOK.md            proven search techniques + taxonomy discipline + parallel-agent workflow
  world_country_checklist.csv     per-country coverage tracker
  known_institutions.csv          generated context export for research agents (npm run export-known-institutions)
  history/                        point-in-time reports from the original research build

scripts/
  validate_dataset.py              schema/enum/duplicate/alias checks
  sync_dataset.py                  regenerates the merged dataset + the app's bundled JSON
  merge_batches.py                 merges parallel research batches into catalogue.jsonl
  export_known_institutions.py     exports research/known_institutions.csv

src/                              React + TypeScript app (Vite + Tailwind v4)
  data/catalogue.json              generated, what the app actually imports
  data/changelog.json              dataset-change feed shown in the app
  types.ts, App.tsx, lib/, components/, sections/
```

## Tech stack

React 19 + TypeScript + Vite + Tailwind v4 + Recharts + `react-simple-maps`
(world choropleth, TopoJSON fetched at runtime from the free `world-atlas`
CDN package) + `lucide-react`. No state-management library, no router
(the active page is a single `useState`) — deliberately minimal given the
app's scope.

## License

MIT, for both the code and the dataset — see `LICENSE`.
