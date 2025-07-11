#!/bin/bash

# Script de build específico para deploy na Hostinger
echo "🔄 Iniciando build para Hostinger..."

# Instalar dependências
npm install --production=false

# Push schema para banco de dados
echo "📊 Sincronizando esquema do banco..."
npm run db:push

# Build do projeto
echo "🏗️ Fazendo build do frontend e backend..."
npm run build

# Criar pasta de assets se não existir
mkdir -p dist/client/assets

# Copiar arquivos estáticos necessários
cp -r client/public/* dist/client/ 2>/dev/null || true

echo "✅ Build completo para Hostinger!"
echo "📁 Arquivos prontos em: ./dist/"
echo "🚀 Pronto para deploy!"