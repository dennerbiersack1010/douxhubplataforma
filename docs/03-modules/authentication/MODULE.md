---
title: Módulo de Autenticação
document_id: MOD-AUTH-001
version: 1.0.0
status: Implementado
last_updated: 2026-07-19
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

## Resolução pós-login otimizada

O destino após a autenticação é resolvido por `resolve_post_login_context()` em uma única chamada ao banco. A função usa `auth.uid()` como autoridade, conta somente vínculos válidos, limpa contextos incompatíveis e ativa o vínculo único na mesma transação. O endpoint retorna `Server-Timing` e respostas privadas sem cache.

As camadas de proteção do Proxy e dos layouts usam `getClaims()` para verificar o JSON Web Token (JWT), conforme a recomendação atual do Supabase para proteção server-side. O método evita a consulta obrigatória ao Auth em cada camada quando a chave assimétrica e o conjunto de chaves em cache estão disponíveis.

## Limites e status

O código está implementado, compila e está conectado a um Supabase válido em produção. A criação real de conta foi validada no endereço oficial, e os cenários multiusuário de contexto, convite e RLS foram validados por uma suíte transacional no Supabase. Confirmação de e-mail, recuperação, redefinição e convite completo com links reais permanecem pendentes. O cadastro reutiliza temporariamente a identidade visual aprovada do Login; usuários novos sem vínculo seguem para a configuração técnica da primeira clínica.
