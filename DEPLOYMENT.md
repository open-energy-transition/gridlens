# Deploying GridLens

GridLens is a fully static, client-side app (no backend, no environment
variables, no secrets) — `npm run build` produces a `dist/` folder that can
be served from literally any static host. There's no one "correct" way to
deploy it; pick whichever of these fits:

## GitHub Pages (free, zero config beyond enabling it)

1. In the repo's Settings → Pages, set the source to "GitHub Actions".
2. Add a workflow (not included by default, to avoid assuming you want this
   specific host) that runs `npm run build` and deploys `dist/` via
   `actions/deploy-pages`. A minimal one:

   ```yaml
   name: Deploy to GitHub Pages
   on:
     push:
       branches: [main]
   permissions:
     contents: read
     pages: write
     id-token: write
   jobs:
     deploy:
       runs-on: ubuntu-latest
       environment:
         name: github-pages
         url: ${{ steps.deployment.outputs.page_url }}
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with: { node-version: 26, cache: npm }
         - run: npm ci
         - run: npm run build
         - uses: actions/configure-pages@v5
         - uses: actions/upload-pages-artifact@v3
           with: { path: dist }
         - id: deployment
           uses: actions/deploy-pages@v4
   ```

3. If deploying to `https://<org>.github.io/gridlens/` (a project page, not
   a custom domain), add `base: '/gridlens/'` to `vite.config.ts`'s
   `defineConfig` — otherwise asset paths will 404.

## Vercel / Netlify / Cloudflare Pages (also free tier, zero config)

All three auto-detect a Vite project. Point them at this repo, build
command `npm run build`, output directory `dist`. No environment variables
needed.

## Any other static host / CDN

```bash
npm run build
# upload the contents of dist/ to your host of choice
```

## What does NOT need to change between environments

Nothing — the dataset (`src/data/catalogue.json`) is bundled into the
build at build time, not fetched from an API at runtime. A new deploy is
required to publish a dataset update (run `npm run sync-data`, commit, then
redeploy) — there's no live database to update separately.
