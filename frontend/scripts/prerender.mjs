// Prerenderizado post-build para SEO, sin migrar a Next.js.
//
// Qué hace: levanta el build de producción (dist/) con el servidor de
// "vite preview", visita con un Chromium headless (Playwright) cada página
// pública real (institucionales + categorías/productos activos traídos de
// la API), y sobrescribe el index.html correspondiente en dist/<ruta>/ con
// el HTML ya renderizado. Así un crawler que NO ejecuta JavaScript (o una
// vista previa de WhatsApp/redes sociales) recibe contenido real en vez de
// un <div id="root"></div> vacío.
//
// Limitaciones conocidas (ver docs/PRERENDER.md):
// - No es SSR real: no hay hidratación — React vuelve a renderizar todo
//   desde cero al cargar el JS. El usuario ve el HTML estático un instante
//   y después React "pisa" el DOM. Aceptable para SEO/previews, no para
//   apps que necesiten interactividad inmediata sin parpadeo.
// - El HTML queda tan fresco como el último build. Si cambian productos o
//   precios después de deployar, ese HTML prerenderizado queda desactualizado
//   hasta el próximo build (el catálogo real que ve el usuario JS-enabled
//   sigue viniendo de la API en vivo — esto solo afecta el snapshot inicial).
// - Requiere que la API esté accesible en el momento del build (VITE_API_URL).
//
// Uso: npm run build:prerender   (corre "vite build" y después este script)

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import axios from 'axios'
import { chromium } from 'playwright'
import { preview } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.resolve(__dirname, '..', 'dist')
const API_URL = (process.env.VITE_API_URL || 'http://localhost:8001/api').replace(/\/$/, '')
const RUTAS_ESTATICAS = ['/', '/sobre-nosotros', '/envios', '/contacto']

async function obtenerRutasDinamicas() {
  const rutas = []

  try {
    const { data: categorias } = await axios.get(`${API_URL}/categorias/`)
    rutas.push(...categorias.map(c => `/categoria/${c.slug}`))
  } catch (err) {
    console.warn('[prerender] No se pudieron obtener categorías, se omiten:', err.message)
  }

  try {
    let url = `${API_URL}/productos/?page_size=100`
    while (url) {
      const { data } = await axios.get(url)
      rutas.push(...data.results.map(p => `/productos/${p.slug}`))
      url = data.next
    }
  } catch (err) {
    console.warn('[prerender] No se pudieron obtener productos, se omiten:', err.message)
  }

  return rutas
}

function destinoParaRuta(ruta) {
  if (ruta === '/') return path.join(DIST_DIR, 'index.html')
  return path.join(DIST_DIR, ruta.replace(/^\//, ''), 'index.html')
}

async function main() {
  if (!fs.existsSync(DIST_DIR)) {
    console.error('[prerender] No existe dist/. Corré "vite build" primero (o usá "npm run build:prerender").');
    process.exit(1)
  }

  const rutas = [...RUTAS_ESTATICAS, ...await obtenerRutasDinamicas()]
  console.log(`[prerender] ${rutas.length} rutas a procesar.`)

  const server = await preview({ preview: { port: 4173, host: '127.0.0.1' }, logLevel: 'silent' })
  const base = `http://127.0.0.1:${server.config.preview.port}`

  const browser = await chromium.launch()
  const page = await browser.newPage()

  let ok = 0
  for (const ruta of rutas) {
    try {
      await page.goto(`${base}${ruta}`, { waitUntil: 'networkidle', timeout: 30000 })
      await page.waitForSelector('#root *', { timeout: 10000 })
      const html = await page.content()

      const destino = destinoParaRuta(ruta)
      fs.mkdirSync(path.dirname(destino), { recursive: true })
      fs.writeFileSync(destino, html)
      console.log(`  ✓ ${ruta}`)
      ok += 1
    } catch (err) {
      console.warn(`  ✗ ${ruta} — ${err.message}`)
    }
  }

  await browser.close()
  await new Promise(resolve => server.httpServer.close(resolve))

  console.log(`[prerender] Listo: ${ok}/${rutas.length} páginas prerenderizadas.`)
}

main().catch(err => {
  console.error('[prerender] Error inesperado:', err)
  process.exit(1)
})
