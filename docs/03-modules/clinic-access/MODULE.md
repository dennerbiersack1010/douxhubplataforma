---
title: Acesso e Administração Inicial de Clínicas
document_id: MOD-CLINIC-001
version: 0.1.0
status: Implementado
last_updated: 2026-07-16
owner: DouxHub
related_documents:
  - FLOWS.md
  - DATA_MODEL.md
  - PERMISSIONS.md
  - STATES.md
  - BUSINESS_RULES.md
  - TESTS.md
  - ../../05-security/MULTI_TENANT_SECURITY.md
---

# Acesso e Administração Inicial de Clínicas

## Objetivo

Estabelecer o contexto multiempresa da DouxHub, permitindo que uma pessoa autenticada crie sua primeira clínica ou acesse uma ou mais clínicas por vínculo validado no servidor.

## Usuários e funcionalidades

O módulo atende proprietários, administradores e colaboradores. Estão implementados cadastro inicial de clínica e unidade, resolução pós-login, seleção de contexto, listagem básica de membros, convite, revogação, ativação, desativação e definição das funções iniciais.

## Dependências e integrações

Depende do Supabase Auth, PostgreSQL com Row Level Security (RLS), rotas server-side da aplicação e cookie `HttpOnly` de contexto. O cookie auxilia o roteamento e não substitui as políticas do banco.

## Limites

As telas `/configurar-clinica`, `/selecionar-perfil`, `/sem-clinica` e `/configuracoes/equipe` são interfaces técnicas temporárias. Não existem Dashboard definitivo, cobrança, módulos de negócio ou funções do DouxHub Control nesta etapa. O envio automático de convite depende de configuração server-side ainda não presente; sem ela, o convite e o link são preparados para envio externo.

## Status

A lógica, as migrações e os testes de banco estão implementados e validados. A validação visual definitiva e a validação ponta a ponta com links reais de e-mail permanecem pendentes.
