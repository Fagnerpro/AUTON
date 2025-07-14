# 🚀 INSTRUÇÕES RÁPIDAS - Deploy AUTON® na Hostinger

## ⚡ Resumo Executivo

Você tem um sistema AUTON® completo pronto para produção. Aqui estão as etapas simplificadas:

### 1. 📁 Arquivos Necessários para Upload

Faça download/upload destes arquivos para a Hostinger:

```
📦 Arquivos principais:
├── 📁 client/               # Frontend React
├── 📁 server/               # Backend Express  
├── 📁 shared/               # Schemas compartilhados
├── 📄 package.json          # Dependências
├── 📄 package-lock.json     # Lock de versões
├── 📄 start-production.js   # Script de inicialização
├── 📄 drizzle.config.ts     # Config do banco
├── 📄 vite.config.ts        # Config do build
├── 📄 tsconfig.json         # Config TypeScript
└── 📄 .env                  # Variáveis (criar novo)
```

### 2. 🗄️ Configurar Banco PostgreSQL

No painel da Hostinger:
1. Crie banco PostgreSQL
2. Anote: usuário, senha, host, porta

### 3. 📝 Criar arquivo .env

Na raiz do projeto na Hostinger:

```bash
# Database - SUBSTITUA com seus dados reais
DATABASE_URL=postgresql://SEU_USUARIO:SUA_SENHA@SEU_HOST:5432/SEU_BANCO
PGHOST=SEU_HOST
PGPORT=5432
PGUSER=SEU_USUARIO  
PGPASSWORD=SUA_SENHA
PGDATABASE=SEU_BANCO

# JWT - OBRIGATÓRIO: Gere uma chave forte
JWT_SECRET=sua-chave-super-secreta-minimo-32-caracteres-aqui-123456789

# Produção
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Opcionais (funciona sem eles)
OPENAI_API_KEY=sua_chave_openai_opcional
STRIPE_SECRET_KEY=sua_chave_stripe_opcional
```

### 4. 🔧 Comandos no Terminal Hostinger

```bash
# 1. Acessar pasta do projeto
cd public_html

# 2. Instalar dependências
npm install

# 3. Fazer build da aplicação
npm run build

# 4. Configurar banco de dados
npm run db:push

# 5. Iniciar aplicação
npm start
```

### 5. ✅ Verificar se Funcionou

- Acesse: `https://seudominio.com`
- Deve aparecer a tela de login
- Crie uma conta de teste
- Faça uma simulação solar

## 🎯 URLs do Sistema

- **Login**: `https://seudominio.com/`
- **Dashboard**: `https://seudominio.com/dashboard`
- **Simulações**: `https://seudominio.com/simulation`
- **Relatórios**: `https://seudominio.com/reports`
- **API Status**: `https://seudominio.com/api/health`

## 🚨 Solução de Problemas

### Erro de Banco
```bash
# Testar conexão
psql "postgresql://usuario:senha@host:porta/banco" -c "SELECT 1;"
```

### Erro de Build
```bash
# Limpar e reinstalar
rm -rf node_modules dist
npm install
npm run build
```

### Verificar Logs
```bash
# Ver logs em tempo real
tail -f logs/app.log

# Ou verificar processo
ps aux | grep node
```

## 📱 Funcionalidades Incluídas

✅ **Sistema Completo:**
- Login/Registro de usuários
- Simulação solar (Residencial, Comercial, VE, Multi-unidades)
- Relatórios PDF/Excel/JSON
- Dashboard com estatísticas
- Planos Free/Premium
- Pagamentos Stripe
- Assistente IA (OpenAI)

✅ **Pronto para Produção:**
- Zero dados demo
- Senhas com hash bcrypt
- Tokens JWT seguros
- Validação Zod
- Proteção CORS
- Headers de segurança

## 🆘 Suporte

1. **Hostinger**: Use o chat de suporte deles
2. **Banco**: Verificar credenciais PostgreSQL
3. **DNS**: Configurar domínio para apontar para a aplicação
4. **SSL**: Ativar certificado HTTPS

---

**⚠️ IMPORTANTE**: Substitua TODAS as variáveis de exemplo no .env pelos seus valores reais da Hostinger!