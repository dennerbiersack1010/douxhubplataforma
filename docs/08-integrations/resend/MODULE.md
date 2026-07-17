---
title: Módulo de Integração Resend
document_id: INT-RESEND-001
version: 0.1.0
status: Em desenvolvimento
last_updated: 2026-07-17
owner: DouxHub
related_documents:
  - CONFIGURATION.md
  - AUTH_EMAILS.md
  - SECURITY.md
  - TESTS.md
  - ../../03-modules/authentication/MODULE.md
  - ../../00-project/CURRENT_STATE.md
---

# Módulo de Integração Resend

## Objetivo

O Resend é utilizado como provedor de envio SMTP para os e-mails de autenticação do Supabase Auth. A integração garante que confirmações de cadastro, recuperação de senha e convites sejam enviados com domínio próprio da DouxHub, sem depender do SMTP padrão do Supabase, que possui limite de dois e-mails por hora.

## Finalidade exclusiva

Esta integração atende exclusivamente a e-mails transacionais de autenticação:

- confirmação de cadastro;
- recuperação de acesso;
- redefinição de senha;
- convite de equipe.

Não inclui e-mails de marketing, newsletters ou comunicações promocionais.

## Domínio utilizado

O domínio `auth.douxhub.space` foi criado no Resend para centralizar o envio de e-mails de autenticação, separando esse fluxo do domínio principal `douxhub.space`.

## Integração com Supabase Auth

O Resend é utilizado via SMTP personalizado do Supabase. Os e-mails são disparados diretamente pelo Supabase Auth usando as credenciais configuradas no painel de autenticação. Nenhuma chamada direta à API do Resend é feita pelo código da aplicação.

## Status atual

| Componente | Status |
|---|---|
| Domínio `auth.douxhub.space` criado no Resend | Concluído |
| Registro DKIM publicado na Hostinger | Confirmado via DNS público |
| Registro MX publicado na Hostinger | Confirmado via DNS público |
| Registro SPF | A verificar no painel Resend |
| Verificação do domínio no Resend | Pendente de confirmação manual |
| API Key de envio criada | Pendente |
| SMTP personalizado ativo no Supabase | Pendente |
| Testes de envio real | Pendentes |

## Referências

- Documentação SMTP do Resend: https://resend.com/docs/send-with-smtp
- Documentação SMTP do Supabase: https://supabase.com/docs/guides/auth/auth-smtp
- Configuração técnica: CONFIGURATION.md
- Tipos de e-mail: AUTH_EMAILS.md
- Regras de segurança: SECURITY.md
- Testes: TESTS.md
