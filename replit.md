# AUTON® - Sistema Empresarial de Simulação Solar

## Overview
Sistema completo de simulação solar para empresas com React frontend, FastAPI backend inspirado, PostgreSQL database, e cálculos técnicos precisos baseados em parâmetros reais de mercado.

## Recent Changes (Janeiro 2025)
✓ Corrigido sistema de autenticação JWT - tokens agora incluídos automaticamente nas requisições
✓ Implementado engine de cálculo robusto com parâmetros técnicos centralizados
✓ Adicionadas páginas funcionais de Relatórios e Configurações
✓ Criado sistema de geração de relatórios em PDF, Excel e JSON
✓ CORREÇÃO CRÍTICA: Fórmula de cálculo solar ajustada para padrões da indústria
✓ Parâmetros financeiros atualizados com valores realistas do mercado brasileiro 2024
✓ Erro React DOM na página Reports corrigido com download seguro
✓ Estrutura de resultados mapeada corretamente (technical_specs, financial_analysis)
✓ ANÁLISE METODOLÓGICA: Comparação com código Python externo validada

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

## Current Status
- ✅ Sistema funcionando completamente
- ✅ Autenticação JWT operacional
- ✅ Cálculos precisos para todos os tipos
- ✅ Relatórios gerando corretamente
- ✅ Interface responsiva e intuitiva
- ✅ Navegação completa entre páginas

## Testing Credentials
- Email: demo@auton.com
- Senha: demo123

## Next Steps
- Implementar backup automático de dados
- Adicionar integração com APIs externas de irradiação
- Expandir tipos de painéis disponíveis
- Implementar sistema de templates personalizados

## Deployment Notes
- Aplicação ready para deploy no Replit
- Todas as dependências instaladas
- Database PostgreSQL configurado
- Variáveis de ambiente configuradas