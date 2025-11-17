# AUTON® - Sistema Empresarial de Simulação Solar

## Overview
AUTON® é um sistema completo de simulação solar empresarial, projetado para fornecer cálculos técnicos e financeiros precisos baseados em parâmetros reais de mercado. Ele integra um frontend React, um backend Express.js modular, e um banco de dados PostgreSQL. O objetivo é auxiliar empresas na avaliação e planejamento de projetos solares, oferecendo relatórios detalhados, cenários de investimento e uma interface intuitiva. O sistema inclui funcionalidades para simulações residenciais, comerciais, recarga de veículos elétricos e áreas comuns, com planos de assinatura Free e Premium para acesso a recursos avançados, como o assistente de IA.

## Recent Changes (November 2025)
- **Security Hardening**: Implemented automatic environment validation with fail-fast behavior for JWT_SECRET (32+ chars) and DATABASE_URL
- **Backend Modularization**: Refactored monolithic routes.ts into domain-specific modules (auth, simulations, payments, ai, reports)
- **Shared API Contracts**: Created shared/api.ts with Zod-validated DTOs for type-safe frontend/backend communication
- **Bug Fixes**: Fixed dashboard stats display and environment initialization order

## User Preferences
- Interface em português brasileiro
- Foco em precisão técnica e financeira
- Relatórios detalhados com dados reais
- Cálculos baseados em padrões de mercado

## System Architecture

### Backend Structure
- **Modular Routes** (`server/routes/`):
  - `auth.ts`: Authentication, user profile, password recovery
  - `simulations.ts`: CRUD operations for solar simulations
  - `payments.ts`: Stripe integration, subscriptions, checkouts
  - `ai.ts`: OpenAI-powered assistant endpoints
  - `reports.ts`: PDF, Excel, JSON report generation
  - `index.ts`: Centralized route registration
- **Middleware** (`server/middlewares/`):
  - `auth.ts`: JWT authentication, plan access control
- **Utilities** (`server/utils/`):
  - `solar-calculations.ts`: Centralized calculation logic
  - `report-generator.ts`: Report generation utilities
- **Configuration** (`server/config/`):
  - `env.ts`: Type-safe environment validation (auto-runs on import)

### Shared Contracts
- **API DTOs** (`shared/api.ts`):
  - AuthResponse, UserInfoResponse
  - SimulationResponse, UserStatsResponse, PlanAccessResponse
  - PaymentResponse, AIResponseSchema
  - All schemas validated with Zod

### Frontend Architecture
- **React + TypeScript** with strict type safety
- **TanStack Query** for data fetching with typed responses
- **shadcn/ui** components for consistent UI
- **Recharts** for data visualization
- **Type-safe hooks**: All API calls use shared DTOs

### Technical Implementations
- **Authentication**: JWT-based (30-day expiry) with localStorage, automatic middleware validation
- **Environment Validation**: Auto-validated on startup, ensures critical secrets are present
- **Solar Calculation Engine**: Centralized in `shared/simulation-config.ts` and `server/utils/solar-calculations.ts`
  - Solar irradiation data by Brazilian state
  - Panel specs: 550Wp, 2.74m², 20.1% efficiency
  - Global system yield: 78%
  - Financial params: R$0.75/kWh, 8% annual increase
  - Regional cost factors applied
- **Calculation Types**:
    1. **Residencial**: Monthly consumption + available area
    2. **Comercial**: Diurnal consumption profiles
    3. **Recarga VE**: Mileage + vehicle efficiency
    4. **Áreas Comuns**: Equipment consumption sum
- **Report Generation**: Automatic PDF, Excel (CSV), JSON reports
- **Multi-unit System**: Support for builders/developers
- **Payment System**: Stripe integration for subscriptions and custom payments
- **AI Assistant**: OpenAI GPT-4o powered, Premium-only feature

### System Design Choices
- **Database Schema**:
    - `users`: User profiles with company, plan, access control
    - `simulations`: Projects with parameters and calculated results
    - `organizations`: Multi-tenant structure for companies
- **Authentication Flow**: 
  - Login/register returns JWT token
  - Token stored in localStorage
  - All authenticated requests use Bearer token
  - Middleware validates token and checks plan access
- **Security**: 
  - Passwords hashed with bcrypt (10 rounds)
  - Zod validation on all inputs
  - Environment variables validated on startup
  - JWT_SECRET minimum 32 characters
  - CORS protection
- **Access Control**: 
  - Free: 5 simulations maximum
  - Premium: Unlimited simulations, R$ 24,90/month
  - Demo: 1 simulation, temporary access (2 per IP/24h)
- **Error Handling**: Robust error treatment with typed responses, fallbacks, and user-friendly messages

## External Dependencies
- **PostgreSQL**: Primary database for all application data.
- **Stripe**: Payment gateway for subscriptions and custom solar system payments.
- **OpenAI GPT-4o**: Powers the AI Assistant for contextual advice and simulation analysis.
- **Recharts**: JavaScript charting library for data visualization in the frontend.
- **shadcn/ui**: UI component library for React.
- **TanStack Query**: Data fetching and caching library for React.