// Script temporal de comparación visual — capturas antes/después de la renovación.
// Uso: node scripts/screenshot.mjs <baseUrl> <outDir> <label>
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const baseUrl = process.argv[2] || 'https://esencias.avilamotorepuesto.com.ar';
const outDir = process.argv[3] || './screenshots/before';
const label = process.argv[4] || 'before';

const PAGES = [
  { path: '/', name: 'inicio' },
  { path: '/categoria/marcos', name: 'categoria' },
  { path: '/productos/prueba-marcos', name: 'producto' },
  { path: '/como-comprar', name: 'como-comprar' },
  { path: '/preguntas-frecuentes', name: 'faq' },
  { path: '/pedido/ABC123', name: 'seguimiento' },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
for (const vp of VIEWPORTS) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await context.newPage();
  for (const p of PAGES) {
    try {
      await page.goto(baseUrl + p.path, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `${outDir}/${label}_${p.name}_${vp.name}.png`,
        fullPage: true,
      });
      console.log(`OK ${p.name} ${vp.name}`);
    } catch (err) {
      console.log(`FAIL ${p.name} ${vp.name}: ${err.message}`);
    }
  }
  await context.close();
}
await browser.close();
