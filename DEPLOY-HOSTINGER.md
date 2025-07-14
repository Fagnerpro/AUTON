# 🚀 Deploy AUTON® na Hostinger - Guia Completo

## Pré-requisitos
- Acesso ao painel da Hostinger
- Banco PostgreSQL configurado
- Domínio configurado (opcional)

## 📋 Passo a Passo - Deploy na Hostinger

### 1. Preparar o Projeto para Upload

Primeiro, criar o build de produção:

```bash
# No terminal local
npm install
npm run build
```

### 2. Arquivos para Upload

Você precisa fazer upload dos seguintes arquivos/pastas:

```
📁 Estrutura para upload:
├── dist/                    # Pasta com build compilado
├── node_modules/           # Dependências (ou usar npm install no servidor)
├── package.json           # Dependências do projeto
├── package-lock.json      # Lock das versões
├── .env                   # Variáveis de ambiente (criar no servidor)
├── start-production.js    # Script de inicialização
└── hostinger-config.js    # Configurações específicas
```

### 3. Variáveis de Ambiente (.env)

Crie um arquivo `.env` na raiz do projeto com:

```bash
# Database - Configure com seus dados PostgreSQL da Hostinger
DATABASE_URL=postgresql://usuario:senha@localhost:5432/auton_db
PGHOST=localhost
PGPORT=5432
PGUSER=seu_usuario_db
PGPASSWORD=sua_senha_db
PGDATABASE=auton_db

# Autenticação
JWT_SECRET=sua-chave-secreta-super-forte-minimo-32-caracteres

# Ambiente
NODE_ENV=production
PORT=5000

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
```

### 4. Estrutura de Upload na Hostinger

#### Opção A: Via File Manager (Recomendado)
1. Acesse o painel da Hostinger
2. Vá em "File Manager"
3. Navegue até `public_html/`
4. Faça upload de todos os arquivos

#### Opção B: Via FTP
Use as credenciais FTP da Hostinger para upload

### 5. Configuração do Banco PostgreSQL

No painel da Hostinger:
1. Vá em "Databases" > "PostgreSQL"
2. Crie um novo banco: `auton_db`
3. Anote usuário, senha e host
4. Configure no arquivo `.env`

### 6. Instalação de Dependências

Conecte via SSH ou use o terminal da Hostinger:

```bash
cd public_html
npm install --production
```

### 7. Migração do Banco

```bash
# Sincronizar schema do banco
npm run db:push
```

### 8. Inicialização da Aplicação

A Hostinger usa PM2 ou similar. Configure o start script:

```bash
# Iniciar aplicação
npm start

# Ou usando PM2
pm2 start start-production.js --name "auton-app"
```

### 9. Configuração do Domínio

No painel da Hostinger:
1. Vá em "Domains"
2. Configure o domínio para apontar para a aplicação
3. Configure SSL/HTTPS

## 🔧 Scripts Úteis

### Script de Build Local
```bash
#!/bin/bash
# build-for-hostinger.sh

echo "🔄 Preparando para deploy na Hostinger..."

# Install e build
npm install
npm run build

# Criar package para upload
tar -czf auton-hostinger.tar.gz \
  dist/ \
  package.json \
  package-lock.json \
  start-production.js \
  hostinger-config.js

echo "✅ Arquivo auton-hostinger.tar.gz pronto para upload!"
```

### Script de Inicialização (start-production.js)
```javascript
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando AUTON® em produção...');

const server = spawn('node', ['dist/server/index.js'], {
  stdio: 'inherit',
  cwd: process.cwd(),
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: process.env.PORT || 5000
  }
});

server.on('close', (code) => {
  console.log(`Servidor encerrado com código ${code}`);
  if (code !== 0) {
    console.log('Reiniciando servidor...');
    // Auto-restart em caso de erro
    setTimeout(() => {
      require('./start-production.js');
    }, 5000);
  }
});
```

## 📱 Funcionalidades do Sistema

✅ **Sistema Completo Pronto para Produção:**
- Autenticação JWT segura
- Registro e login de usuários
- Planos Free (5 simulações) e Premium (R$ 24,90/mês)
- Sistema de simulação solar avançado
- Relatórios em PDF, Excel e JSON
- Assistente IA (OpenAI) para usuários Premium
- Pagamentos via Stripe
- Interface responsiva e moderna

## 🔒 Segurança Implementada

- Senhas com hash bcrypt
- Validação Zod em todas as entradas
- Proteção CORS configurada
- Headers de segurança
- Proteção contra SQL injection
- Rate limiting nas APIs

## 🎯 URLs da Aplicação

Após o deploy:
- **Aplicação**: `https://seudominio.com`
- **API Health**: `https://seudominio.com/api/health`
- **Login**: `https://seudominio.com/` (página principal)

## 🆘 Solução de Problemas

### Erro de Conexão com Banco
```bash
# Verificar variáveis
echo $DATABASE_URL

# Testar conexão
psql $DATABASE_URL -c "SELECT 1;"
```

### Erro de Dependências
```bash
# Limpar e reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Logs da Aplicação
```bash
# Ver logs em tempo real
pm2 logs auton-app

# Ver status
pm2 status
```

## 📞 Suporte

- Verificar logs no painel da Hostinger
- Usar o chat de suporte da Hostinger
- Verificar configurações de DNS e SSL

---

**Sistema 100% pronto para produção sem dados demo!**