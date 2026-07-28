# Renderizado para buscadores (SEO) sin migrar a Next.js

## El problema

El frontend es una SPA (React + Vite): sin JavaScript, la respuesta HTTP
inicial es solo `<div id="root"></div>`. La mayoría de los crawlers modernos
(Googlebot) sí ejecutan JS y ven el contenido igual, pero:

- Bots más simples, algunos crawlers de IA, y varias herramientas de
  vista previa de links (algunas integraciones de mensajería/redes) **no**
  ejecutan JavaScript, o le dan prioridad al HTML crudo.
- Aun con Googlebot, servir HTML con contenido real desde el primer byte es
  más confiable y rápido de indexar que depender de la ejecución de JS.

## Opciones evaluadas

| Opción | Invasividad | Se descartó porque |
|---|---|---|
| Migrar a Next.js / Remix (SSR real) | Muy alta | Prohibido explícitamente — reescritura completa del frontend. |
| `vite-plugin-ssr` / `vite-react-ssg` | Alta | Requiere reestructurar el data-fetching de cada página a un modelo de "loaders" — toca todas las páginas existentes. |
| **Prerenderizado post-build con Playwright** (elegida) | Baja | Ya teníamos Playwright como devDependency; no toca ninguna página existente, es un paso extra opcional después del build. |
| No hacer nada | Ninguna | No cumple el requisito de que el HTML inicial tenga contenido útil. |

**Se eligió el prerenderizado post-build** por ser la opción menos invasiva
que sigue cumpliendo el objetivo, sin tocar arquitectura ni páginas.

## Cómo funciona

`npm run build:prerender` (en vez de `npm run build`):

1. Corre el build normal de Vite (`dist/`).
2. Levanta ese build con `vite preview` (servidor estático local).
3. Con Playwright (Chromium headless) visita cada página pública real:
   inicio, institucionales (`/sobre-nosotros`, `/envios`, `/contacto`), y
   **todas** las categorías y productos activos (consultados en vivo a la
   API — `VITE_API_URL`).
4. Por cada ruta, espera a que React termine de renderizar y **sobrescribe**
   `dist/<ruta>/index.html` con el HTML final (títulos, meta tags,
   JSON-LD ya resueltos por `react-helmet-async`, contenido real).

Nginx ya sirve `dist/` con `try_files $uri $uri/ /index.html`, así que una
carpeta `dist/productos/sahumerio-de-lavanda/index.html` se sirve
automáticamente para la ruta `/productos/sahumerio-de-lavanda` sin tocar la
config — el resto de las rutas no prerenderizadas (admin, checkout, rutas
dinámicas nuevas que se agreguen) siguen cayendo en el `index.html` genérico
de siempre.

Verificado manualmente: build + prerender de las 9 páginas del catálogo de
prueba, confirmando que cada `index.html` generado contiene el `<title>`,
`<meta description>` y JSON-LD específicos de esa página (no los genéricos
del `index.html` base).

## Limitaciones (documentadas explícitamente, como pidió el alcance)

1. **No es hidratación real.** React vuelve a montar todo desde cero al
   cargar el JS (no usa `hydrateRoot`) — hay un reemplazo de DOM, no un
   "enganche". Para SEO/previews no importa; para UX puede haber un
   parpadeo si el HTML prerenderizado difiere del primer render de React
   (debería ser idéntico si los datos no cambiaron entre el build y la
   visita del usuario).
2. **El HTML queda tan fresco como el último build.** Si cambia un precio
   o el stock después de deployar, ese cambio no se refleja en el HTML
   prerenderizado hasta el próximo build — el catálogo real (para usuarios
   con JS, es decir prácticamente todos) sigue viniendo siempre de la API en
   vivo. Esto solo afecta el snapshot que ve un crawler sin JS.
3. **Requiere la API accesible durante el build** (para listar categorías y
   productos activos a prerenderizar). Si la API no responde, el script
   sigue con las páginas estáticas y loguea una advertencia — no rompe el
   build.
4. **CORS**: el prerender levanta `vite preview` en `http://127.0.0.1:4173` y
   ese origen hace fetch a la API real (`VITE_API_URL`). Si el backend está
   en otro dominio (como en producción), `http://127.0.0.1:4173` tiene que
   estar en `CORS_ALLOWED_ORIGINS` del backend — si no, el navegador
   bloquea la respuesta (aunque el request HTTP haya dado 200) y las
   páginas de producto/categoría se prerenderizan con el título/descripción
   genéricos en vez de los reales, porque el fetch del lado de React falla y
   cae al estado "no encontrado". Encontrado corriendo el prerender real
   contra producción durante el despliegue de Fase 9. Es un origen loopback
   (no accesible desde internet) y los endpoints que expone ya son
   públicos de por sí, así que agregarlo no debilita la seguridad de CORS.
5. **No está enganchado al `npm run build` por defecto** (el que usa
   `deploy/update.sh`), para no arriesgar el pipeline de deploy actual sin
   que el equipo lo valide primero en el propio servidor. Adoptarlo：
   cambiar `npm run build` por `npm run build:prerender` en
   `deploy/update.sh` cuando se confirme que el tiempo extra del build
   (recorre N productos/categorías con un Chromium headless) es aceptable
   para el tamaño real del catálogo.
