# AUTON® - Sistema Empresarial de Simulação Solar

## Overview
AUTON® é um sistema completo de simulação solar empresarial, projetado para fornecer cálculos técnicos e financeiros precisos baseados em parâmetros reais de mercado. Ele integra um frontend React, um backend FastAPI-inspired, e um banco de dados PostgreSQL. O objetivo é auxiliar empresas na avaliação e planejamento de projetos solares, oferecendo relatórios detalhados, cenários de investimento e uma interface intuitiva. O sistema inclui funcionalidades para simulações residenciais, comerciais, recarga de veículos elétricos e áreas comuns, com planos de assinatura Free e Premium para acesso a recursos avançados, como o assistente de IA.

## User Preferences
- Interface em português brasileiro
- Foco em precisão técnica e financeira
- Relatórios detalhados com dados reais
- Cálculos baseados em padrões de mercado

## System Architecture

### UI/UX Decisions
The frontend is built with React and TypeScript, utilizing `shadcn/ui` for components, Recharts for data visualization, and TanStack Query for intelligent caching. The design prioritizes a clean, unified interface for login, registration, and demo access. Dynamic titles, contextual descriptions, and intuitive navigation enhance the user experience.

### Technical Implementations
- **Frontend**: React, TypeScript, shadcn/ui, Recharts, TanStack Query.
- **Backend**: Express.js, TypeScript, handling authentication, simulations, reports, and user management.
- **Authentication**: JWT-based with localStorage, automatic middleware, and transparent token renewal.
- **Solar Calculation Engine**: Centralized in `shared/simulation-config.ts`, considering solar irradiation data by Brazilian state, panel specifications (550Wp, 2.74m², 20.1% efficiency), global system yield (78%), and financial parameters (R$0.75/kWh tariff, 8% annual increase). Regional cost factors are also applied.
- **Calculation Types**:
    1. **Residencial**: Based on monthly consumption and available area.
    2. **Comercial**: Considers diurnal consumption profiles.
    3. **Recarga VE**: Calculates based on mileage and vehicle efficiency.
    4. **Áreas Comuns**: Sums equipment consumption (e.g., elevator, pool, security).
- **Report Generation**: Automatic generation of PDF, Excel, and JSON reports.
- **Multi-unit System**: Support for builders/developers.
- **Payment System**: Integrated with Stripe for premium subscriptions and custom solar system payments.
- **AI Assistant**: Contextual guidance and recommendations powered by OpenAI GPT-4o, available for Premium subscribers.

### System Design Choices
- **Database Schema**:
    - `users`: User profiles with company and preferences.
    - `simulations`: Projects with calculated parameters and results.
    - `organizations`: Structure for companies and teams.
- **Authentication Flow**: Login with email/password returns JWT, stored in localStorage, used via Bearer token in middleware.
- **Security**: Passwords hashed with bcrypt, Zod validation, CORS protection.
- **Access Control**: Subscription-based access (Free for 5 simulations, Premium for R$ 24,90/month).
- **Error Handling**: Robust error treatment for API and UI, including fallbacks.

## External Dependencies
- **PostgreSQL**: Primary database for all application data.
- **Stripe**: Payment gateway for subscriptions and custom solar system payments.
- **OpenAI GPT-4o**: Powers the AI Assistant for contextual advice and simulation analysis.
- **Recharts**: JavaScript charting library for data visualization in the frontend.
- **shadcn/ui**: UI component library for React.
- **TanStack Query**: Data fetching and caching library for React.