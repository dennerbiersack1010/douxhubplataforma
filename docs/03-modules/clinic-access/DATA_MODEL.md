---
title: Modelo de Dados de Acesso às Clínicas
document_id: MOD-CLINIC-003
version: 0.4.0
status: Validado
last_updated: 2026-07-19
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
- `clinic_users`: relação única entre conta e clínica, com estado e origem rastreável no vínculo legado.
- `clinic_roles`: cópias por clínica dos modelos globais de função, sem criação de pessoas fictícias.
- `clinic_user_role_assignments`: atribuições múltiplas de função por usuário da clínica.
- `clinic_user_units`: associações múltiplas de unidade por usuário da clínica.
- `access_profiles`: opções rastreáveis de função e escopo de clínica ou unidade.
- `permission_catalog`: chaves estáveis, descrições, escopos, sensibilidade e personalização permitida.
- `clinic_role_permissions`: concessões de permissão e escopo pertencentes a uma função da clínica.
- `access_profile_permission_overrides`: concessões ou negações explícitas pertencentes a um perfil.

## Relacionamentos e integridade

Uma clínica possui unidades, vínculos, convites e auditorias. Cada usuário possui no máximo um vínculo por clínica e um contexto ativo. Slugs são normalizados; e-mails armazenados são normalizados; endereços e configurações devem ser objetos JSON. Há no máximo um convite pendente por clínica e e-mail, e a validade deve ser posterior à criação.

Na fundação nova, uma conta possui no máximo um `clinic_user` por clínica, que pode possuir várias atribuições de função, unidades e perfis. Chaves estrangeiras compostas impedem associações entre clínicas diferentes. O vínculo legado permanece referenciado por `source_membership_id` para equivalência e rollback lógico.

## Índices principais

Existem índices para vínculos por usuário/status e clínica/status, convites por e-mail/status, convite pendente único, auditorias por clínica/data e unidade/data.

## RLS e operações seguras

Todas as tabelas expostas possuem RLS. Consultas são limitadas ao próprio usuário ou às clínicas com vínculo permitido. Criação inicial, convites, aceite, gestão de vínculos e contexto ativo usam funções `security definer` com `search_path` explícito, validação de `auth.uid()` e, em convites, e-mail do JSON Web Token (JWT).

## Migrações

- `20260716213000_multi_tenant_clinics.sql`: base multiempresa, funções, RLS e auditoria.
- `20260716233000_clinic_access_expansion.sql`: primeira clínica, dados adicionais, `clinic_invitations`, regras hierárquicas e auditoria ampliada.
- `20260716234500_fix_invitation_expiration_ambiguity.sql`: correção de resolução do campo de validade.
- `20260716235000_fix_invitation_crypto_search_path.sql`: disponibilização segura da extensão criptográfica às funções de convite.
- `20260719190000_clinic_access_profiles_foundation.sql`: tabelas aditivas, funções por clínica, sincronização dos vínculos atuais, RLS e leitura segura.
- `20260719200000_clinic_permissions_foundation.sql`: catálogo, matriz por função, exceções por perfil, cálculo efetivo e RLS.

## Modelo-alvo definido

Usuários da clínica, funções, atribuições, múltiplas unidades, perfis, permissões efetivas e exceções possuem fundação persistida. Profissionais, APIs administrativas e adoção pelas rotas permanecem planejados. As tabelas atuais não foram substituídas.
