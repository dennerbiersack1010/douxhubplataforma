---
title: E-mails de Autenticação via Resend
document_id: INT-RESEND-003
version: 0.1.0
status: Em desenvolvimento
last_updated: 2026-07-17
owner: DouxHub
related_documents:
  - MODULE.md
  - CONFIGURATION.md
  - ../../03-modules/authentication/MODULE.md
  - ../../03-modules/authentication/FLOWS.md
---

# E-mails de Autenticação via Resend

## Escopo

Este documento cobre apenas os e-mails de autenticação enviados pelo Supabase Auth via SMTP personalizado do Resend. Campanhas de e-mail, marketing e notificações de produto não fazem parte deste escopo.

## Tipos de e-mail

### 1. Confirmação de cadastro

Enviado automaticamente pelo Supabase Auth após a criação de uma nova conta em `/cadastro`.

- **Remetente**: `DouxHub <...@auth.douxhub.space>`
- **Gatilho**: `supabase.auth.signUp()`
- **Conteúdo**: link de confirmação com token de acesso único
- **URL de retorno**: configurada no painel do Supabase Auth (deve apontar para o domínio correto da plataforma)
- **Validade do link**: conforme configuração do Supabase (padrão: 24 horas)

### 2. Recuperação de senha

Enviado quando o usuário solicita recuperação em `/recuperar`.

- **Remetente**: `DouxHub <...@auth.douxhub.space>`
- **Gatilho**: `supabase.auth.resetPasswordForEmail()` com `redirectTo: '/redefinir'`
- **Conteúdo**: link de redefinição com token de sessão temporária
- **URL de retorno**: `[domínio]/redefinir`
- **Validade do link**: conforme configuração do Supabase (padrão: 1 hora)

### 3. Convite de equipe

Enviado quando um proprietário ou administrador convida um novo membro em `/configuracoes/equipe`.

- **Remetente**: `DouxHub <...@auth.douxhub.space>`
- **Gatilho**: `supabase.auth.admin.inviteUserByEmail()` (via service role no servidor)
- **Conteúdo**: link de aceitação do convite
- **URL de retorno**: `[domínio]/primeiro-acesso`
- **Dependência**: requer `SUPABASE_SERVICE_ROLE_KEY` configurada exclusivamente no servidor

### 4. Alteração de e-mail (se habilitada)

Enviado caso a funcionalidade de alteração de e-mail seja ativada no Supabase.

- **Status**: não habilitada nesta etapa
- **Pré-requisito**: definir fluxo antes de habilitar

## Templates

Os templates de e-mail são gerenciados no painel do Supabase Auth:
**Authentication → Emails → Templates**

Os templates padrão do Supabase são utilizados sem customização nesta etapa. Devem ser verificados para garantir que:

- o link de confirmação aponta para o domínio correto da plataforma;
- o link de recuperação aponta para `[domínio]/redefinir`;
- o link de convite aponta para `[domínio]/primeiro-acesso`;
- o texto não contém referências ao Supabase ou identificadores técnicos internos.

## URLs de redirecionamento

As URLs de retorno dos links nos e-mails devem estar cadastradas como permitidas no painel do Supabase:
**Authentication → URL Configuration → Redirect URLs**

Devem incluir:
- o domínio oficial da plataforma (`douxhub.space`);
- o subdomínio Vercel (`douxhubplataforma.vercel.app`) como fallback técnico.

## Limitações conhecidas

- O Supabase não registra por padrão o conteúdo dos e-mails enviados; o Resend possui logs de entrega.
- Sem verificação do domínio, os e-mails podem ser marcados como spam.
- O convite depende de `SUPABASE_SERVICE_ROLE_KEY` no servidor; sem ela, o link é gerado mas não enviado automaticamente.
