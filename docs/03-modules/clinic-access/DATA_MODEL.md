---
title: Modelo de Dados de Acesso às Clínicas
document_id: MOD-CLINIC-003
version: 0.2.0
status: Implementado
last_updated: 2026-07-16
owner: DouxHub
related_documents:
  - MODULE.md
  - PERMISSIONS.md
  - ../../05-security/MULTI_TENANT_SECURITY.md
  - CONCEPTUAL_MODEL.md
---

# Modelo de Dados de Acesso às Clínicas

## Tabelas

- `clinics`: identificação, nome, razão social, documento, slug único, status, proprietário, contato, configurações, campo preparatório de plano e datas.
- `clinic_units`: unidades relacionadas à clínica, com nome, slug, status, contato, endereço em JSON, configurações e datas.
- `user_profiles`: perfil da pessoa autenticada, com nome, nome de exibição, e-mail, telefone, avatar, status e datas.
- `clinic_memberships`: vínculo único entre usuário e clínica, unidade opcional, função, status, entrada, autor do convite, último acesso e datas.
- `roles`: catálogo das funções iniciais e das funções futuras inativas.
- `clinic_invitations`: destinatário, clínica, unidade opcional, função, estado, hash único do token, validade, autores do convite e aceite e datas.
- `user_active_contexts`: contexto server-side selecionado por usuário.
- `audit_logs`: clínica, unidade, ator, usuário afetado, ação, entidade, metadados, IP, agente do navegador e data.

## Relacionamentos e integridade

Uma clínica possui unidades, vínculos, convites e auditorias. Cada usuário possui no máximo um vínculo por clínica e um contexto ativo. Slugs são normalizados; e-mails armazenados são normalizados; endereços e configurações devem ser objetos JSON. Há no máximo um convite pendente por clínica e e-mail, e a validade deve ser posterior à criação.

## Índices principais

Existem índices para vínculos por usuário/status e clínica/status, convites por e-mail/status, convite pendente único, auditorias por clínica/data e unidade/data.

## RLS e operações seguras

Todas as tabelas expostas possuem RLS. Consultas são limitadas ao próprio usuário ou às clínicas com vínculo permitido. Criação inicial, convites, aceite, gestão de vínculos e contexto ativo usam funções `security definer` com `search_path` explícito, validação de `auth.uid()` e, em convites, e-mail do JSON Web Token (JWT).

## Migrações

- `20260716213000_multi_tenant_clinics.sql`: base multiempresa, funções, RLS e auditoria.
- `20260716233000_clinic_access_expansion.sql`: primeira clínica, dados adicionais, `clinic_invitations`, regras hierárquicas e auditoria ampliada.
- `20260716234500_fix_invitation_expiration_ambiguity.sql`: correção de resolução do campo de validade.
- `20260716235000_fix_invitation_crypto_search_path.sql`: disponibilização segura da extensão criptográfica às funções de convite.

## Modelo-alvo definido

O modelo futuro adicionará, sem substituir imediatamente as tabelas atuais, usuários da clínica, funções por clínica, permissões, atribuições de função, associações com múltiplas unidades, perfis de acesso e profissionais. O contrato, as cardinalidades e a transição estão definidos em `CONCEPTUAL_MODEL.md` e nos documentos especializados relacionados. Nenhuma dessas novas entidades deve ser considerada implementada nesta versão.
