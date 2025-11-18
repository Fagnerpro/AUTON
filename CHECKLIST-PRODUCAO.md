# Checklist executável para preparação à produção — AUTON

Formato: cada tarefa tem: prioridade, responsável(s), estimativa, subtarefas e critérios de aceitação (CA).

## Prioridade Alta (P0) — requisito mínimo para operação segura (Mínimo Viável Seguro)
- Tarefa: Gerenciamento de Segredos e Variáveis de Ambiente
  - Responsável: DevOps / Eng. Backend
  - Estimativa: 1–2 dias
  - Subtarefas:
    - Remover qualquer segredo do repositório.
    - Configurar Secret Manager (ex.: GitHub Secrets, AWS Secrets Manager, Vault).
    - Validar que .env.example cobre todas variáveis exigidas, criar checklist de variáveis obrigatórias.
  - Critério de aceitação:
    - Nenhuma secret plain-text no repo.
    - Pipeline lê secrets do Secret Manager; deploy de staging usa secrets criptografados.

- Tarefa: HTTPS, Cookies e Hardening básico
  - Responsável: Eng. Backend / DevOps
  - Estimativa: 1 dia
  - Subtarefas:
    - Forçar HTTPS (redirecionamento).
    - Configurar cookies: Secure, HttpOnly, SameSite=strict (quando aplicável).
    - Adicionar helmet, express-rate-limit, cors configurado (lista de origens).
  - CA:
    - Requests em HTTP são redirecionados para HTTPS.
    - Cabeçalhos de segurança presentes (X-Frame-Options, X-Content-Type-Options, CSP mínimo).
    - Rate limiter aplicado em endpoints críticos (login, APIs públicas).

- Tarefa: Health Endpoint e Smoke Tests
  - Responsável: Eng. Backend
  - Estimativa: 0.5 dia
  - Subtarefas:
    - Implementar /health ou /api/health que valide: processo app, DB conectado, cache (Redis) OK.
    - Criar smoke test que chame health endpoint.
  - CA:
    - /health retorna 200 JSON com status OK e latência básica.
    - Smoke test no CI passa após deploy em staging.

## Prioridade Alta (P1) — infraestrutura e deploy minimum viable
- Tarefa: Dockerização (server + client) e docker-compose para dev
  - Responsável: Eng. Backend + Eng. Frontend
  - Estimativa: 1–2 dias
  - Subtarefas:
    - Criar Dockerfile para backend (build stage + runtime).
    - Criar Dockerfile para frontend e servir via Nginx.
    - docker-compose com Postgres (para dev), Redis, server, client.
  - CA:
    - Consegue rodar stack local com `docker-compose up --build` e acessar UI + endpoints.
    - Health check do server OK.

- Tarefa: CI básico (build + check + tests)
  - Responsável: Eng. Backend + Eng. Frontend
  - Estimativa: 2–4 dias
  - Subtarefas:
    - Pipeline executa: install, lint/tsc, tests, build (frontend + server).
    - Artefatos de build válidos (frontend build, server bundle).
  - CA:
    - PRs falham quando checks não passam.
    - Build artifacts gerados com sucesso.

- Tarefa: Build e push de imagens para registry
  - Responsável: DevOps
  - Estimativa: 0.5–1 dia
  - Subtarefas:
    - Configurar GitHub Secrets para AUTH do registry.
    - Workflow que constrói e envia imagens taggeadas (staging/prod).
  - CA:
    - Imagens aparecem no registry (GCR/ghcr/dockerhub) com tags.

## Prioridade Média (P2) — dados, sessões, migrations
- Tarefa: Migrations, backup e rollback (Drizzle)
  - Responsável: Eng. Backend / DBA
  - Estimativa: 2–3 dias
  - Subtarefas:
    - Validar drizzle-kit push e migrations.
    - Escrever playbook de rollback.
    - Testar backup/restore (dump).
  - CA:
    - Processo de migration documentado e testado (backup -> migrate -> rollback).

- Tarefa: Sessões & conexão DB para escala
  - Responsável: Eng. Backend
  - Estimativa: 1–2 dias
  - Subtarefas:
    - Mudar session store para Redis (recomendado) ou garantir pool adequado para Postgres.
    - Configurar connection pooling (pgbouncer) se usar Neon.
  - CA:
    - Sessões persistem em Redis; testes de carga não esgotam conexões DB.

## Prioridade Média (P3) — observability e segurança avançada
- Tarefa: Logs estruturados e erros (Sentry)
  - Responsável: Eng. Backend / SRE
  - Estimativa: 2 dias
  - Subtarefas:
    - Integrar Sentry (server + client).
    - Logs estruturados (pino/winston) enviados para um aggregator.
  - CA:
    - Erros aparecem no Sentry com contexto; logs pesquisáveis.

- Tarefa: Testes e CI expandido (unit + integração + E2E)
  - Responsável: QA / Eng. Fullstack
  - Estimativa: 2–3 semanas (iterações)
  - Subtarefas:
    - Escrever testes unitários para auth, pagamento, endpoints críticos.
    - Configurar E2E (Playwright/Cypress) cobrindo fluxos: signup, login, simulação, checkout.
  - CA:
    - Cobertura básica nos fluxos críticos; pipeline bloqueia deploy se E2E falhar em staging.

## Prioridade Baixa (P4) — performance, compliance e entrega
- Tarefa: Load Test e otimização
  - Responsável: Eng. Backend / SRE
  - Estimativa: 1–2 semanas
  - Subtarefas:
    - Rodar k6 para endpoints críticos, otimizar queries, índices.
  - CA:
    - App mantém latência aceitável sob target load.

- Tarefa: Pagamentos e Compliance (Stripe)
  - Responsável: Eng. Backend + Produto
  - Estimativa: 3–5 dias
  - Subtarefas:
    - Usar Stripe Checkout/Elements; validar webhooks seguros.
    - Documentar como reduzir escopo PCI.
  - CA:
    - Testes de pagamento em modo real (cards de teste) ok; webhooks validados.

## Observações finais
- MVP privado (beta) possível em 2–6 semanas com foco P0+P1.
- Produção robusta exige P2+P3 implementados (8–16 semanas dependendo equipe).