#!/bin/bash
# ==============================================================
# smoke_test_production.sh — chequeos rápidos y seguros contra producción.
#
# Uso: bash scripts/smoke_test_production.sh [https://esencias.avilamotorepuesto.com.ar]
#
# - Solo hace pedidos GET/HEAD de solo lectura (no crea pedidos, no togglea
#   nada, no necesita secretos).
# - Termina con código de salida distinto de cero si algo falla —
#   pensado para correr después de cada despliegue (a mano o desde
#   update.sh) y para monitoreo periódico externo.
# ==============================================================

set -uo pipefail

BASE="${1:-https://esencias.avilamotorepuesto.com.ar}"
FALLOS=0

chequear() {
    local descripcion="$1" ruta="$2" esperado="$3"
    local code
    code=$(curl -s -o /dev/null -w "%{http_code}" -L --max-time 10 "${BASE}${ruta}")
    if [ "$code" = "$esperado" ]; then
        echo "✓ $descripcion ($ruta) -> $code"
    else
        echo "✗ $descripcion ($ruta) -> $code (esperado $esperado)"
        FALLOS=$((FALLOS + 1))
    fi
}

echo "== Smoke test de producción: $BASE =="
echo

chequear "HTTPS responde"            "/"                      200
chequear "Health (liveness)"         "/api/health/"           200
chequear "Health (readiness)"        "/api/health/ready/"     200
chequear "robots.txt"                "/robots.txt"            200
chequear "sitemap.xml"               "/sitemap.xml"           200
chequear "Catálogo API"              "/api/productos/"        200
chequear "Categorías API"            "/api/categorias/"       200
chequear "Panel admin (React)"       "/admin"                 200
chequear "Django Admin (login)"      "/django-admin/"         200
chequear "Estáticos Django"          "/static/admin/css/base.css" 200

echo
echo "-- Contenido esperado en /api/health/ready/ --"
BODY=$(curl -s --max-time 10 "${BASE}/api/health/ready/")
echo "$BODY"
if ! echo "$BODY" | grep -q '"status":"ok"'; then
    echo "✗ /api/health/ready/ no reporta status ok"
    FALLOS=$((FALLOS + 1))
fi

echo
echo "-- robots.txt no debe permitir rutas privadas --"
ROBOTS=$(curl -s --max-time 10 "${BASE}/robots.txt")
for ruta in "/admin" "/django-admin/" "/api/" "/pedido/"; do
    if echo "$ROBOTS" | grep -q "Disallow: $ruta"; then
        echo "✓ robots.txt bloquea $ruta"
    else
        echo "✗ robots.txt NO bloquea $ruta"
        FALLOS=$((FALLOS + 1))
    fi
done

echo
if [ "$FALLOS" -eq 0 ]; then
    echo "✅ Todo OK ($BASE)"
    exit 0
else
    echo "❌ $FALLOS chequeo(s) fallaron ($BASE)"
    exit 1
fi
