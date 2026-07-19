---
title: Acesso e Administração Inicial de Clínicas
document_id: MOD-CLINIC-001
version: 0.5.0
status: Validado
last_updated: 2026-07-19
owner: DouxHub
related_documents:
  - FLOWS.md
  - DATA_MODEL.md
  - PERMISSIONS.md
  - STATES.md
  - BUSINESS_RULES.md
  - TESTS.md
  - CONCEPTUAL_MODEL.md
  - CLINIC_USERS.md
  - PROFESSIONALS.md
  - ROLES_AND_PERMISSIONS.md
  - ACCESS_PROFILES.md
  - UNITS_AND_MEMBERSHIPS.md
  - ../../05-security/MULTI_TENANT_SECURITY.md
---

# Acesso e Administração Inicial de Clínicas

## Objetivo

Estabelecer o contexto multiempresa da DouxHub, permitindo que uma pessoa autenticada crie sua primeira clínica ou acesse uma ou mais clínicas por vínculo validado no servidor.

## Usuários e funcionalidades

O módulo atende proprietários, administradores e colaboradores. Estão implementados cadastro inicial de clínica e unidade, resolução pós-login, seleção de contexto, listagem básica de membros, convite, revogação, ativação, desativação e definição das funções iniciais.

## Dependências e integrações

Depende do Supabase Auth, PostgreSQL com Row Level Security (RLS), rotas server-side da aplicação e cookie `HttpOnly` de contexto. O cookie auxilia o roteamento e não substitui as políticas do banco.

## Limites

As telas `/configurar-clinica`, `/selecionar-perfil`, `/sem-clinica` e `/configuracoes/equipe` são interfaces técnicas temporárias. Não existem Dashboard definitivo, cobrança, módulos de negócio ou funções do DouxHub Control nesta etapa. O envio automático de convite depende de configuração server-side ainda não presente; sem ela, o convite e o link são preparados para envio externo.

## Status

A lógica, as migrações e os testes de banco estão implementados e validados. A validação visual definitiva e a validação ponta a ponta com links reais de e-mail permanecem pendentes.

## Evolução aditiva iniciada em 19/07/2026

O Ciclo 1 da Etapa 3 implementou `clinic_users`, `clinic_roles`, `clinic_user_role_assignments`, `clinic_user_units` e `access_profiles`. Cada vínculo atual é convertido de forma rastreável e continua sincronizado por gatilho. `clinic_memberships` permanece como contrato vigente da aplicação; a leitura e o contexto ainda não migraram para as novas tabelas.

Funções globais são copiadas como modelos pertencentes a cada clínica sem criar contas ou colaboradores fictícios. Múltiplas funções e unidades já são representáveis.

O Ciclo 2 adicionou `permission_catalog`, `clinic_role_permissions` e `access_profile_permission_overrides`, além do cálculo seguro de permissões efetivas. A aplicação ainda não usa essa matriz para autorizar rotas ou montar menus; profissionais e adoção do novo contexto ficam para ciclos posteriores.

O Ciclo 3 adicionou a leitura server-side preparatória e o portão de equivalência. A API retorna apenas perfis próprios e falha de forma fechada diante de qualquer divergência. Nenhuma navegação ou autoridade operacional foi trocada.
