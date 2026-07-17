---
title: Permissões da Autenticação
document_id: MOD-AUTH-003
version: 0.1.0
status: Implementado
last_updated: 2026-07-16
owner: DouxHub
related_documents:
  - MODULE.md
  - FLOWS.md
  - ../../05-security/MULTI_TENANT_SECURITY.md
---

# Permissões da Autenticação

## Acesso público

Usuários sem sessão podem acessar introdução, Login, cadastro, recuperação, redefinição e primeiro acesso. Redefinição e primeiro acesso exigem tokens ou sessões temporárias válidas para concluir ações sensíveis.

## Acesso autenticado

Após autenticação, o servidor resolve os vínculos ativos. A sessão identifica o usuário, mas não concede acesso irrestrito a clínicas. O contexto ativo orienta o roteamento e as políticas RLS permanecem responsáveis pela autorização dos dados.

## Restrições

- o frontend não pode criar vínculos ou permissões por conta própria;
- convites só podem ser aceitos pelo destinatário autenticado;
- usuários sem vínculo ativo não acessam dados de clínica;
- service role não é utilizada no frontend;
- permissões globais do DouxHub Control não existem nesta etapa.
