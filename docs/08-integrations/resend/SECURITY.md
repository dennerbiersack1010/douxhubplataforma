---
title: Segurança da Integração Resend
document_id: INT-RESEND-004
version: 0.1.0
status: Em desenvolvimento
last_updated: 2026-07-17
owner: DouxHub
related_documents:
  - MODULE.md
  - CONFIGURATION.md
  - ../../05-security/MULTI_TENANT_SECURITY.md
---

# Segurança da Integração Resend

## Credenciais

### API Key do Resend

- A API Key utilizada para autenticação SMTP começa com o prefixo `re_`.
- É armazenada **exclusivamente** como senha SMTP no painel do Supabase Auth.
- Não deve ser registrada em: código-fonte, documentação, arquivos Markdown, comentários, logs ou qualquer outro local versionado.
- Não deve ser enviada ao GitHub em nenhum arquivo.
- Não deve ser exposta em variáveis de ambiente do lado do cliente (`NEXT_PUBLIC_`).
- Não deve aparecer em mensagens de resposta, relatórios de agentes ou conversas exportadas.

### Rotação

Em caso de comprometimento da API Key:
1. Revogar imediatamente no painel do Resend.
2. Criar nova API Key com o mesmo nome e permissão.
3. Atualizar a senha SMTP no painel do Supabase.
4. Verificar logs do Resend para envios não autorizados.

## Proteção de arquivos

O arquivo `.env.local` está no `.gitignore` e não é enviado ao repositório. Nenhuma credencial do Resend deve aparecer nesse arquivo, pois a chave é configurada exclusivamente no painel do Supabase.

## Domínio e autenticidade

- O domínio `auth.douxhub.space` utiliza DKIM para assinar os e-mails enviados.
- O registro MX de feedback (`send.auth.douxhub.space`) permite ao Resend processar notificações de entrega e bounces.
- Registros DNS não relacionados ao Resend não devem ser alterados.

## Isolamento de uso

- A API Key do Resend é criada com permissão **Sending access** apenas, sem acesso a domínios, webhooks ou configurações da conta.
- O Resend não tem acesso ao banco de dados, ao Supabase ou às variáveis de ambiente da aplicação.

## Monitoramento

- Os logs de entrega dos e-mails estão disponíveis no painel do Resend.
- Erros de SMTP são registrados nos logs do Supabase Auth.
- Nenhum dado pessoal dos usuários deve ser exposto nos logs.

## Regras proibidas

- Nunca expor a chave SMTP ou a API Key em código, documentação ou resposta de agente.
- Nunca usar permissão **Full access** para a API Key destinada ao SMTP.
- Nunca configurar o Resend como provedor de e-mails de marketing usando as mesmas credenciais de autenticação.
- Nunca alterar registros DNS da Hostinger sem mostrar antes o estado atual e o esperado, e sem preservar o site principal e o subdomínio de formulário.
