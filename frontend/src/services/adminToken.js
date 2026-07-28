// El access token del panel admin vive solo en memoria (nunca en
// localStorage): así una vulnerabilidad de XSS no puede leerlo de forma
// persistente. El refresh token vive en una cookie HttpOnly que el
// JavaScript ni siquiera puede leer — ver apps/productos/auth_views.py.
let accessToken = null

export function getAdminToken() {
  return accessToken
}

export function setAdminToken(token) {
  accessToken = token
}
