#!/usr/bin/env node

// Production startup script for Hostinger
console.log('🚀 Iniciando AUTON® Servidor de Produção na Hostinger...');

// Set production environment
process.env.NODE_ENV = 'production';
const port = process.env.PORT || 5000;
const host = process.env.HOST || '0.0.0.0';

console.log(`📡 Configuração: ${host}:${port}`);
console.log(`🗄️ Database: ${process.env.DATABASE_URL ? 'Configurado' : 'Não configurado'}`);

// Import and start the server
import('./dist/index.js')
  .then(() => {
    console.log('✅ AUTON® Servidor iniciado com sucesso');
    console.log(`🌐 Servidor rodando em: http://${host}:${port}`);
    console.log('📊 Sistema pronto para simulações solares');
  })
  .catch((error) => {
    console.error('❌ Falha ao iniciar servidor:', error);
    console.error('🔧 Verifique:');
    console.error('   - Variáveis de ambiente (.env)');
    console.error('   - Conexão com banco PostgreSQL');
    console.error('   - Arquivos de build em ./dist/');
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 Recebido SIGTERM, encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📴 Recebido SIGINT, encerrando servidor...');
  process.exit(0);
});