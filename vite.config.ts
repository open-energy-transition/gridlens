import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'

const STATIC_ROUTES = [
  '/', '/geographic', '/tools', '/grid-decisions',
  '/institutions', '/top-users', '/records', '/about', '/changelog',
]

const PAGE_NAMES: Record<string, string> = {
  '/': "GridLens — See who's using which energy models, where",
  '/geographic': 'Geographic Analysis · GridLens',
  '/tools': 'Tools & Categories · GridLens',
  '/grid-decisions': 'Grid Decisions · GridLens',
  '/institutions': 'Institutions · GridLens',
  '/top-users': 'Top Users by Tool · GridLens',
  '/records': 'Records & Export · GridLens',
  '/about': 'About · GridLens',
  '/changelog': 'Changelog · GridLens',
}

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

      // GitHub Pages serves 404.html for any other path (e.g. /top-users/<tool>);
      // the app then renders the right page from the URL.
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
