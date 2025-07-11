# AUTON® - Sistema Empresarial de Simulação Solar

## Overview
Sistema completo de simulação solar para empresas com React frontend, FastAPI backend inspirado, PostgreSQL database, e cálculos técnicos precisos baseados em parâmetros reais de mercado.

## Recent Changes (Janeiro 2025)
✓ **ACESSO RESTRITO**: Sistema implementado para permitir login apenas para usuários com assinatura
✓ **IA PREMIUM**: Assistente IA disponível exclusivamente para assinantes Premium
✓ **CONTROLE DE ACESSO**: Usuários com plano gratuito não podem fazer login - apenas modo demo
✓ **MENSAGENS PERSONALIZADAS**: Feedback específico para usuários sem assinatura
✓ **CORREÇÃO CRÍTICA**: Mapeamento de dados para estrutura aninhada do backend corrigido
✓ **DADOS TÉCNICOS**: Correção do display "N/D" - agora mostra valores reais das simulações
✓ **TRATAMENTO DE ERROS**: Sistema robusto de erro para API da IA com fallbacks
✓ **ASSISTENTE IA**: Sistema completo de orientações contextuais com OpenAI GPT-4o
✓ **SUPORTE CONTEXTUAL**: IA analisa simulações e fornece recomendações personalizadas
✓ **INTEGRAÇÃO INTELIGENTE**: Respostas técnicas baseadas em dados reais dos projetos
✓ **INTERFACE IA**: Página dedicada com multiple contextos (análise, preços, técnico)
✓ **CALCULADORA INTERATIVA**: Implementada calculadora de preços em tempo real com integração Stripe
✓ **PREÇOS DINÂMICOS**: Sistema de precificação baseado em configuração de sistema solar
✓ **STRIPE AVANÇADO**: Pagamentos customizados para sistemas solares além do plano Premium
✓ **NAVEGAÇÃO APRIMORADA**: Página de preços integrada ao menu principal
✓ **UX MELHORADA**: Fluxo completo Demo → Calculadora → Pagamento → Sistema
✓ **PRODUÇÃO**: Sistema totalmente limpo e preparado para deploy na Hostinger
✓ **REMOÇÃO**: Eliminados todos os dados de demonstração e credenciais de teste
✓ **DEPLOY**: Configurações específicas para Hostinger implementadas
✓ **AUTENTICAÇÃO**: Sistema JWT completo sem dados demo - pronto para usuários reais
✓ **SEGURANÇA**: Senhas hasheadas com bcrypt, validação Zod, proteção CORS
✓ **PLANOS**: Sistema de assinatura Free (5 simulações) e Premium (R$ 24,90/mês)
✓ **CORREÇÃO CRÍTICA**: Problemas de autenticação resolvidos - login e registro funcionando 100%
✓ **MODO DEMO**: Implementado sistema de demonstração para testes imediatos sem cadastro
✓ **API CORRIGIDA**: Tokens JWT agora validados corretamente pelo middleware
✓ **FRONTEND SIMPLIFICADO**: Landing page removida - sistema vai direto para login/dashboard
✓ **INTERFACE UNIFICADA**: Login, registro e demo em uma única página limpa
✓ Implementado engine de cálculo robusto com parâmetros técnicos centralizados
✓ Sistema multi-unidades implementado para construtoras/incorporadoras
✓ Geração de relatórios em PDF, Excel e JSON
✓ Fórmula de cálculo solar ajustada para padrões da indústria
✓ Interface específica com valores unitários e totais para empreendimentos

## Project Architecture

### Frontend (React + TypeScript)
- **Páginas**: Dashboard, Simulações, Relatórios, Configurações
- **Autenticação**: JWT com localStorage, middleware automático
- **Componentes**: shadcn/ui, formulários reativos, gráficos Recharts
- **Estado**: TanStack Query para cache inteligente

### Backend (Express + TypeScript)
- **APIs**: Autenticação, simulações, relatórios, usuários
- **Storage**: MemStorage com interface padronizada
- **Cálculos**: Engine centralizado em `shared/simulation-config.ts`
- **Relatórios**: Geração automática em múltiplos formatos

### Database Schema
- **users**: Perfis de usuário com empresa e preferências
- **simulations**: Projetos com parâmetros e resultados calculados
- **organizations**: Estrutura para empresas e equipes

## Technical Specifications

### Solar Calculation Engine
Localizado em `shared/simulation-config.ts`:
- **Irradiação solar**: Dados por estado brasileiro
- **Painéis**: 550Wp, 2.74m², eficiência 20.1%
- **Sistema**: Rendimento global 78%
- **Financeiro**: Tarifa R$0.75/kWh, aumento anual 8%
- **Regional**: Fatores de custo por localização

### Calculation Types
1. **Residencial**: Baseado em consumo mensal e área disponível
2. **Comercial**: Considera perfil de consumo diurno
3. **Recarga VE**: Calcula por quilometragem e eficiência do veículo
4. **Áreas Comuns**: Soma equipamentos (elevador, piscina, segurança)

### Authentication Flow
1. Login com email/senha retorna JWT
2. Token armazenado em localStorage
3. Middleware automático inclui Bearer token
4. Renovação transparente conforme necessário

## Metodologias de Cálculo Comparadas

### Nossa Implementação (AUTON®)
- **Fórmula**: `potencia = consumo_mensal / (irradiação × 30 × eficiencia_global)`
- **Eficiência**: 78% (perdas já incluídas)
- **Irradiação**: 5.8 kWh/m²/dia (Goiás)
- **Custo**: R$ 5,20/Wp (instalação completa)
- **Tarifa**: R$ 0,65/kWh

### Código Python Externo (Streamlit)
- **Fórmula**: `energia = (potencia_wp/1000) × irradiação × (eficiencia/100) × 0.90`
- **Eficiência**: 80% + fator 0.90 (perdas adicionais)
- **Irradiação**: 5.5 kWh/m²/dia (conservador)
- **Custo**: R$ 9,50/Wp (painéis) + R$ 1,50/Wp (inversores) + 10% instalação
- **Tarifa**: R$ 0,74593/kWh

### Diferenças Técnicas Principais
1. **Tratamento de perdas**: Nosso sistema aplica eficiência global vs. fator multiplicativo
2. **Estrutura de custos**: Custo unificado vs. componentes separados
3. **Dados climáticos**: CRESESB oficial vs. valores conservadores
4. **Modularidade**: Tipos específicos vs. sistema modular complexo

## User Preferences
- Interface em português brasileiro
- Foco em precisão técnica e financeira
- Relatórios detalhados com dados reais
- Cálculos baseados em padrões de mercado

## API Endpoints

### Autenticação
- `POST /api/auth/login` - Login com email/senha
- `POST /api/auth/register` - Registro de usuário
- `GET /api/auth/me` - Dados do usuário logado

### Simulações
- `GET /api/simulations` - Lista simulações do usuário
- `POST /api/simulations` - Cria nova simulação
- `PUT /api/simulations/:id` - Atualiza simulação
- `POST /api/simulations/:id/calculate` - Executa cálculos

### Relatórios
- `POST /api/reports/generate` - Gera relatório (PDF/Excel/JSON)

### Usuários
- `PUT /api/users/profile` - Atualiza perfil
- `PUT /api/users/preferences` - Salva preferências
- `GET /api/users/stats` - Estatísticas do usuário

### Pagamentos (Stripe)
- `POST /api/create-payment-intent` - Cria intenção de pagamento (Premium ou sistemas customizados)
- `POST /api/upgrade-to-premium` - Processa upgrade após pagamento bem-sucedido

### Assistente IA (OpenAI)
- `POST /api/ai/advice` - Orientações contextuais personalizadas
- `POST /api/ai/analyze-simulation/:id` - Análise específica de simulação
- `POST /api/ai/pricing-insights` - Insights financeiros e de precificação

## Current Status
- ✅ Sistema funcionando completamente
- ✅ Autenticação JWT operacional e testada
- ✅ Modo demonstração ativo - acesso imediato sem cadastro
- ✅ Registro e login funcionando perfeitamente
- ✅ Middleware de autenticação corrigido
- ✅ Cálculos precisos para todos os tipos
- ✅ Relatórios gerando corretamente
- ✅ Interface responsiva e intuitiva
- ✅ Navegação completa entre páginas
- ✅ **ASSISTENTE IA**: Sistema completo de orientações contextuais implementado
- ✅ **OPENAI INTEGRAÇÃO**: GPT-4o fornece suporte técnico e análise de simulações
- ✅ **INTERFACE IA**: Página dedicada com contextos múltiplos e perguntas rápidas
- ✅ **RECOMENDAÇÕES PERSONALIZADAS**: IA analisa dados do usuário e fornece insights
- ✅ **CALCULADORA INTERATIVA**: Sistema de preços em tempo real implementado
- ✅ **STRIPE INTEGRADO**: Pagamentos customizados para sistemas solares
- ✅ **FLUXO COMPLETO**: Demo → Calculadora → Personalização → Pagamento
- ✅ **DUAL MODE**: Planos Premium (R$ 24,90/mês) + Sistemas solares personalizados
- ✅ **UX OTIMIZADA**: Múltiplas opções de entrada para diferentes necessidades

## Sistema de Autenticação
- Interface de login simples e direta (sem landing page)
- Sistema JWT completo implementado
- Página única com login, registro e modo demo
- Planos Gratuito (5 simulações) e Premium (R$ 24,90/mês)
- Sem dados de demonstração - sistema limpo para produção
- Fluxo otimizado: Landing Page Externa → Login → Dashboard

## Next Steps
- Implementar backup automático de dados
- Adicionar integração com APIs externas de irradiação
- Expandir tipos de painéis disponíveis
- Implementar sistema de templates personalizados

## Deployment Notes - Hostinger
- **URL de Produção**: https://458ddcb5-57d1-473b-8847-a21f68742671.dev27.app-preview.com
- Sistema limpo e pronto para produção (sem dados demo)
- Todas as dependências instaladas
- Database PostgreSQL configurado
- Variáveis de ambiente configuradas
- Scripts de build e deploy criados
- Configuração específica para Hostinger implementada
- Sistema de autenticação JWT completo e seguro