---
title: Configuração da Integração Resend
document_id: INT-RESEND-002
version: 0.1.0
status: Em desenvolvimento
last_updated: 2026-07-17
owner: DouxHub
related_documents:
  - MODULE.md
  - SECURITY.md
  - ../../00-project/CURRENT_STATE.md
---

# Configuração da Integração Resend

## Domínio de autenticação

O domínio utilizado para envio de e-mails de autenticação é `auth.douxhub.space`. Ele é independente do domínio principal da plataforma (`douxhub.space`) e do subdomínio de formulário (`formulario.douxhub.space`).

## Registros DNS verificados (17/07/2026)

| Tipo | Nome do registro | Destino verificado |
|---|---|---|
| TXT (DKIM) | `resend._domainkey.auth.douxhub.space` | Chave pública RSA publicada |
| MX | `send.auth.douxhub.space` | `feedback-smtp.sa-east-1.amazonses.com` (prioridade 10) |
| TXT (SPF) | `auth.douxhub.space` | A confirmar no painel Resend |

Os registros DKIM e MX foram confirmados via consulta DNS pública (Google DNS 8.8.8.8).

## Parâmetros SMTP

Os parâmetros abaixo são os valores oficiais do Resend para integração via SMTP, conforme documentação em https://resend.com/docs/send-with-smtp:

| Parâmetro | Valor |
|---|---|
| Host | `smtp.resend.com` |
| Porta | `465` |
| Segurança | SSL |
| Usuário | `resend` |
| Senha | API Key do Resend (não registrar aqui) |

## Configuração no Supabase Auth

A configuração é feita no painel do Supabase:
**Authentication → Emails → SMTP Settings → Enable Custom SMTP**

Campos necessários:
- **Sender Name**: `DouxHub`
- **Sender Email**: endereço do domínio verificado (`...@auth.douxhub.space`)
- **Host**: `smtp.resend.com`
- **Port**: `465`
- **Username**: `resend`
- **Password**: API Key do Resend (armazenada exclusivamente no Supabase, nunca em código ou documentação)

## API Key

A API Key do Resend utilizada para autenticação SMTP:

- é criada no painel do Resend com permissão **Sending access**;
- começa com o prefixo `re_`;
- é armazenada exclusivamente como senha SMTP no painel do Supabase;
- não deve ser registrada em código, documentação ou repositório;
- não deve ser enviada ao GitHub em nenhum arquivo.

## Endereço remetente

O endereço remetente deve pertencer ao domínio verificado no Resend (`auth.douxhub.space`). O endereço exato é definido no painel do Supabase e é o único configurado como remetente de todos os e-mails de autenticação.

## Limitações conhecidas

- O SMTP do Resend na região de São Paulo (`sa-east-1`) é referenciado pelo registro MX de feedback, mas o envio é roteado globalmente via `smtp.resend.com`.
- Sem a verificação completa do domínio no painel do Resend, o envio pode falhar ou cair em spam.
- O limite de envio depende do plano do Resend.
