---
title: Módulo de Autenticação
document_id: MOD-AUTH-001
version: 0.9.0
status: Implementado
last_updated: 2026-07-16
owner: DouxHub
related_documents:
  - FLOWS.md
  - PERMISSIONS.md
  - STATES.md
  - BUSINESS_RULES.md
  - TESTS.md
  - ../../05-security/MULTI_TENANT_SECURITY.md
  - ../../02-screens/login/SCREEN.md
  - ../../02-screens/cadastro/SCREEN.md
---

# Módulo de Autenticação

## Objetivo

Gerenciar entrada, cadastro, recuperação, redefinição, primeiro acesso e encaminhamento pós-login, preservando a separação entre autenticação e autorização por clínica.

## Usuários e funcionalidades

Atende usuários novos, usuários existentes e convidados por uma clínica. Possui Login, cadastro inicial, recuperação, redefinição, primeiro acesso e resolução de vínculos ativos.

## Dependências e integrações

O módulo depende do Supabase Auth, das variáveis públicas válidas do projeto Supabase e da base multiempresa aplicada. O frontend não utiliza service role.

## Limites e status

O código está implementado, compila e está conectado a um Supabase válido em produção. A criação real de conta foi validada no endereço oficial, e os cenários multiusuário de contexto, convite e RLS foram validados por uma suíte transacional no Supabase. Confirmação de e-mail, recuperação, redefinição e convite completo com links reais permanecem pendentes. O cadastro reutiliza temporariamente a identidade visual aprovada do Login; usuários novos sem vínculo seguem para a configuração técnica da primeira clínica.
