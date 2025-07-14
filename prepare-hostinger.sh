#!/bin/bash

echo "📦 Preparando AUTON® para deploy na Hostinger..."

# Limpar build anterior
rm -rf dist/
rm -f auton-hostinger.tar.gz

# Instalar dependências
echo "📋 Instalando dependências..."
npm install

# Build da aplicação
echo "🏗️ Fazendo build da aplicação..."
npm run build

# Verificar se build foi criado
if [ ! -d "dist" ]; then
    echo "❌ Erro: Build não foi criado"
    exit 1
fi

# Criar estrutura para upload
echo "📁 Preparando arquivos para upload..."

# Criar arquivo .env de exemplo para produção
cat > .env.production << EOL
# Database - Configure com seus dados PostgreSQL da Hostinger
DATABASE_URL=postgresql://usuario:senha@localhost:5432/auton_db
PGHOST=localhost
PGPORT=5432
PGUSER=seu_usuario_db
PGPASSWORD=sua_senha_db
PGDATABASE=auton_db

# Autenticação
JWT_SECRET=sua-chave-secreta-super-forte-minimo-32-caracteres-aqui

# Ambiente
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# OpenAI (opcional - para IA)
OPENAI_API_KEY=sua_chave_openai

# Stripe (opcional - para pagamentos)
STRIPE_SECRET_KEY=sua_chave_stripe
STRIPE_PUBLISHABLE_KEY=sua_chave_publica_stripe

# Email (opcional - para reset de senha)
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=587
EMAIL_USER=noreply@seudominio.com
EMAIL_PASS=sua_senha_email

# App
APP_NAME=AUTON®
APP_URL=https://seudominio.com
EOL

# Criar package.json mínimo para produção
cat > package.production.json << EOL
{
  "name": "auton-solar",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node start-production.js",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "@neondatabase/serverless": "^0.9.4",
    "bcrypt": "^5.1.1",
    "drizzle-orm": "^0.33.0",
    "drizzle-kit": "^0.24.0",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "nodemailer": "^6.9.14",
    "openai": "^4.52.7",
    "stripe": "^15.12.0",
    "zod": "^3.23.8"
  }
}
EOL

# Criar arquivo compactado para upload
echo "🗜️ Criando arquivo para upload..."
tar -czf auton-hostinger.tar.gz \
    dist/ \
    package.production.json \
    start-production.js \
    hostinger-config.js \
    .env.production \
    drizzle.config.ts

echo ""
echo "✅ Preparação completa!"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Faça upload do arquivo: auton-hostinger.tar.gz"
echo "2. No servidor Hostinger, extraia: tar -xzf auton-hostinger.tar.gz"
echo "3. Renomeie: mv package.production.json package.json"
echo "4. Configure: mv .env.production .env (e edite com seus dados)"
echo "5. Instale dependências: npm install"
echo "6. Configure banco: npm run db:push"
echo "7. Inicie: npm start"
echo ""
echo "📖 Leia DEPLOY-HOSTINGER.md para instruções detalhadas"
echo ""
echo "🎯 Arquivo pronto: auton-hostinger.tar.gz"