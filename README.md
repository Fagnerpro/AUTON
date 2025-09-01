# AUTON® — Simulador de Dimensionamento Solar com Armazenamento (EV & Áreas Comuns)

O **AUTON®** é um simulador profissional para dimensionamento de sistemas **fotovoltaicos com baterias**, voltado a cenários de **recarga veicular elétrica (EV)** e **áreas comuns de empreendimentos**. Combina modelagem energética, módulo econômico-financeiro (payback, TIR, VPL), geração de relatórios executivos (PDF/Excel/JSON) e um **assistente de IA** para apoiar decisões técnicas e de investimento.

> **Stack**: React (Vite) • Node.js/Express • PostgreSQL + Drizzle ORM • PM2 • OpenAI API  
> **Deploy de referência**: Hostinger (SSH/PM2). Guia completo em `DEPLOY-HOSTINGER.md`.

---

## 🔍 Principais Recursos

- **Simulação energética** por perfil de carga, potência de carregadores, cenários de irradiação e curva horária.
- **Dimensionamento de baterias** (capacidade, ciclos, autonomia; degradação simplificada).
- **Módulo financeiro**: CAPEX/OPEX, **Payback**, **TIR**, **VPL**, análise de sensibilidade.
- **Relatórios executivos**: exportação **PDF**, **Excel** e **JSON**.
- **Autenticação JWT** (cadastro/login), planos **Free** e **Premium**.
- **Assistente IA (OpenAI)** para explicar resultados e sugerir otimizações de projeto.
- **Painel administrativo** para gestão de usuários, simulações e planos.
- **Segurança aplicada**: bcrypt, validação com Zod, CORS restrito, headers seguros, rate-limiting.

---

## 🧱 Arquitetura

- **Frontend**: `client/` (React + Vite)
- **Backend**: `server/` (Node.js + Express)
- **Código compartilhado**: `shared/`
- **Banco de dados**: PostgreSQL com **Drizzle ORM**
- **Process Manager**: **PM2** para produção
- **Relatórios**: geração em PDF/Excel/JSON
- **IA**: OpenAI API

Estrutura simplificada do repo:

