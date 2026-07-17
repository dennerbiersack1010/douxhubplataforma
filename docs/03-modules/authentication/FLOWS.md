---
title: Fluxos do Módulo de Autenticação
document_id: MOD-AUTH-002
version: 0.8.0
status: Implementado
last_updated: 2026-07-16
owner: DouxHub
related_documents:
  - MODULE.md
  - STATES.md
  - BUSINESS_RULES.md
  - ../../02-screens/intro/SCREEN.md
  - ../../02-screens/login/SCREEN.md
---

# Fluxos do Módulo de Autenticação

## Entrada pública

1. O usuário acessa `/`.
2. A introdução é reproduzida sobre o Login já carregado.
3. Ao final, o vídeo é removido e a URL passa a `/login` sem recarga.
4. O usuário informa credenciais ou escolhe recuperação ou cadastro.

## Pós-login

1. O Supabase valida as credenciais.
2. O servidor consulta vínculos ativos sujeitos às regras de segurança.
3. Sem qualquer vínculo, direciona para `/configurar-clinica`; com vínculos apenas inativos, direciona para `/sem-clinica`.
4. Com um vínculo, seleciona o contexto e direciona ao Dashboard.
5. Com múltiplos vínculos, direciona para `/selecionar-perfil`.

## Fluxos alternativos

- senha esquecida: `/recuperar` e `/redefinir`;
- usuário novo: `/cadastro`;
- convite de clínica: `/primeiro-acesso` com validação de destinatário, validade e uso único;
- erro de mídia na introdução: Login revelado imediatamente;
- falha de autenticação ou contexto: mensagem no painel, sem autorização apenas pelo cliente.
