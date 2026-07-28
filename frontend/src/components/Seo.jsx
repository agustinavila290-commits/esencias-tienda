import { Helmet } from 'react-helmet-async'
import { SITE_URL, TIENDA_NOMBRE } from '../config'

/**
 * Metadatos por página (title, description, canonical, Open Graph, Twitter
 * Card) + JSON-LD opcional. `path` es la ruta relativa (ej. "/productos/x")
 * usada para armar la URL canónica y absoluta de OG.
 */
export default function Seo({
  title,
  description,
  path = '',
  image = '/logo.jpg',
  type = 'website',
  noindex = false,
  jsonLd = null,
}) {
  const url = `${SITE_URL}${path}`
  const imagenAbsoluta = image.startsWith('http') ? image : `${SITE_URL}${image}`
  const tituloCompleto = title ? `${title} — ${TIENDA_NOMBRE}` : TIENDA_NOMBRE

  return (
    <Helmet>
      <html lang="es" />
      <title>{tituloCompleto}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:type" content={type} />
      <meta property="og:title" content={tituloCompleto} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={url} />
      <meta property="og:image" content={imagenAbsoluta} />
      <meta property="og:locale" content="es_AR" />
      <meta property="og:site_name" content={TIENDA_NOMBRE} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={tituloCompleto} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={imagenAbsoluta} />

      {jsonLd && (Array.isArray(jsonLd) ? jsonLd : [jsonLd]).map((bloque, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(bloque)}</script>
      ))}
    </Helmet>
  )
}
