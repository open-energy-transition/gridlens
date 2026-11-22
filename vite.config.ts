import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'

const TOOLS: { name: string }[] = JSON.parse(fs.readFileSync('src/data/tools.json', 'utf-8'))
const slug = (n: string) => n.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const PAGE_NAMES: Record<string, string> = {
  '/': "GridLens — which tools model the grid, who uses them, and for which decisions",
  '/organizations': 'Organizations · GridLens',
  '/projects': 'Projects & data · GridLens',
  '/about': 'About & methodology · GridLens',
  '/about/changelog': 'Changelog · GridLens',
  '/about/contact': 'Contact · GridLens',
  '/about/legal': 'Legal & privacy · GridLens',
  ...Object.fromEntries(TOOLS.map((t) => [`/tools/${slug(t.name)}`, `${t.name} · GridLens`])),
  // Old address of a renamed tool (router.tsx RENAMED_SLUGS), still served with status 200.
  '/tools/digsilent-powerfactory': 'PowerFactory · GridLens',
}

// Each page gets its own index.html, so it is served with status 200.
const STATIC_ROUTES = Object.keys(PAGE_NAMES)

function spaRoutesPlugin() {
  return {
    name: 'spa-routes',
    closeBundle() {
      const dist = path.resolve('dist')
      const indexSrc = path.join(dist, 'index.html')
      if (!fs.existsSync(indexSrc)) return

      const baseHtml = fs.readFileSync(indexSrc, 'utf-8')

      for (const route of STATIC_ROUTES) {
        const routeDir = path.join(dist, route.replace(/^\//, '') || '')
        fs.mkdirSync(routeDir, { recursive: true })

        // Asset URLs are already absolute ("/assets/..."), so the copy works from nested paths.
        let html = baseHtml
        if (PAGE_NAMES[route]) {
          html = html.replace(
            /<title>.*?<\/title>/,
            `<title>${PAGE_NAMES[route]}</title>`
          )
        }

        fs.writeFileSync(path.join(routeDir, 'index.html'), html)
      }

      // GitHub Pages serves 404.html for any other path; the app then shows the overview.
      fs.writeFileSync(path.join(dist, '404.html'), baseHtml)
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), spaRoutesPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  base: '/',
})
