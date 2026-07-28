# Datos pendientes de completar — Esencias de la naturaleza

Esta lista es para el dueño del negocio. Nada de esto se inventó ni se
mostró en el sitio público — donde faltaba un dato, el texto se escribió
de forma genérica en vez de mostrar un marcador de "pendiente" visible al
cliente (ver `frontend/src/pages/Terminos.jsx` y `Privacidad.jsx`).

## 🔴 Crítico — afecta el funcionamiento real de la tienda

- **`WHATSAPP_NUMBER`** en `backend/.env` de producción todavía tiene el
  valor placeholder `549XXXXXXXXXX`. Mientras no se configure el número
  real, el botón "Coordinar por WhatsApp" del checkout, el botón flotante
  y "Consultar por WhatsApp" de cada producto abren un chat a un número que
  no existe. **Este es el dato más urgente para completar antes de anunciar
  la tienda públicamente.**
  - Editar en el servidor: `/srv/esencias/backend/.env` → `WHATSAPP_NUMBER=`
    (formato sin +, sin 0, sin 15 — ej. `5493834625390`)
  - Editar también `/srv/esencias/frontend/.env` → `VITE_WHATSAPP_NUMBER=`
  - Después: `sudo systemctl restart esencias` y volver a correr
    `npm run build:prerender` + publicar el release (ver `deploy/update.sh`).

## 🟡 Legales — para Términos y condiciones / Política de privacidad

- Razón social o nombre completo del titular del negocio
- CUIT
- Domicilio legal
- Jurisdicción / tribunales competentes ante un conflicto
- Email específico de contacto para temas de privacidad (o confirmar que
  se usa el mismo canal de la página de Contacto)
- Plazo de conservación de datos de pedidos y cuentas de usuario
- Fecha real desde la que rigen estos términos (para el "Última actualización")

Una vez que el dueño provea estos datos, hay que actualizar
`frontend/src/pages/Terminos.jsx` y `frontend/src/pages/Privacidad.jsx`
con la información real (agregando de vuelta las secciones específicas que
hoy se dejaron genéricas a propósito) y volver a desplegar.

## 🟢 Comercial — mejora la información al cliente, no bloquea nada

- Costo/tiempo de envío exactos (hoy `/envios` dice honestamente "se
  informa al coordinar por WhatsApp" — es verdad, pero si el dueño quiere
  publicar tarifas fijas, hay que dárselas al desarrollador)
- Instagram (`INSTAGRAM_URL` en `frontend/.env` está vacío — si tienen
  cuenta, agregarla para que aparezca en el header/footer)
- Tiempos de preparación de pedidos, si quieren comunicarlos en
  `/como-comprar` o en la página de seguimiento

## Ya configurado y confirmado en producción (no hace falta tocar)

- `SECRET_KEY`, credenciales de PostgreSQL, `GOOGLE_CLIENT_ID`,
  `MP_ACCESS_TOKEN` (actualmente es un token de **test**, no de producción
  — confirmar con el dueño si ya tiene una cuenta real de Mercado Pago
  vinculada antes de anunciar pagos online)
