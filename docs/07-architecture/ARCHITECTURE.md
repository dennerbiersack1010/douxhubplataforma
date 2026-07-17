---
title: Arquitetura da Plataforma
document_id: ARC-001
version: 0.1.0
status: Em desenvolvimento
last_updated: 2026-07-16
owner: DouxHub
related_documents:
  - ../00-project/PROJECT.md
  - ../00-project/CURRENT_STATE.md
  - ../05-security/MULTI_TENANT_SECURITY.md
---

# Arquitetura da Plataforma

## Arquitetura implementada

A aplicação web usa Next.js com App Router e TypeScript. A interface é distribuída pela Vercel. Supabase fornece a base preparada para autenticação e PostgreSQL. Rotas públicas e autenticadas são separadas, e o proxy renova ou valida sessões antes do acesso às áreas restritas.

O modelo multiempresa está versionado em migração SQL e usa Row Level Security (RLS), funções seguras, vínculos por clínica e contexto ativo persistido no servidor. A aplicação remota da migração permanece pendente enquanto o ambiente Supabase configurado estiver indisponível.

## Arquitetura planejada

Local-first, banco local, sincronização, filas, resolução de conflitos, backup local e distribuição desktop ainda não foram definidos nem implementados. Esses tópicos devem receber contratos próprios antes do desenvolvimento.

## Princípios

- autorização validada no servidor e no banco;
- isolamento entre clínicas;
- frontend sem service role;
- documentação e migrações versionadas;
- recursos futuros registrados como planejados até validação real.
