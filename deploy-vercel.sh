#!/bin/bash
# Script de deploy a Vercel
# Uso: ./deploy-vercel.sh

set -e

echo "=========================================="
echo "  Deploy AIP PERÚ a Vercel"
echo "=========================================="
echo ""

# Verificar que vercel CLI esté instalado
if ! command -v vercel &> /dev/null; then
  echo "Instalando Vercel CLI..."
  npm install -g vercel
fi

# Verificar login
echo "Verificando autenticación con Vercel..."
if ! vercel whoami &> /dev/null; then
  echo "Necesitas iniciar sesión en Vercel."
  echo "Ejecutando: vercel login"
  vercel login
fi

echo ""
echo "✓ Autenticado como: $(vercel whoami)"
echo ""

# Configurar variables de entorno necesarias
echo "Configurando variables de entorno..."
echo "  - DATABASE_URL"

# Deploy a producción
echo ""
echo "Iniciando deploy a producción..."
echo "=========================================="
vercel --prod --yes

echo ""
echo "=========================================="
echo "✓ Deploy completado!"
echo "=========================================="
echo ""
echo "Para configurar variables de entorno en Vercel:"
echo "  vercel env add DATABASE_URL production"
echo ""
echo "O visita: https://vercel.com/dashboard → tu proyecto → Settings → Environment Variables"
