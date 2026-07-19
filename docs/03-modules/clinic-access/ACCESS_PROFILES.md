---
title: Perfis de Acesso e Seleção de Contexto
document_id: MOD-CLINIC-013
version: 0.1.0
status: Definido
last_updated: 2026-07-18
owner: DouxHub
related_documents:
  - CONCEPTUAL_MODEL.md
  - CLINIC_USERS.md
  - ROLES_AND_PERMISSIONS.md
  - FLOWS.md
---

# Perfis de Acesso e Seleção de Contexto

## Definição

Perfil de acesso é uma opção autorizada exibida em “Quem está acessando?”. Ele combina usuário da clínica, clínica, função, escopo de unidade e permissões efetivas. Não representa outra conta e não permite acessar perfis de outras pessoas.

## Exemplos

- Proprietária — Visão geral da clínica;
- Gestora — Unidade Centro;
- Comercial — Unidade Centro;
- Profissional — Unidade Centro;
- Profissional — Unidade Zona Sul.

## Regras

- Todo novo Login concluído encaminha para seleção de perfil, inclusive quando existe uma única opção.
- O servidor retorna somente perfis ativos da conta autenticada.
- Um perfil de unidade referencia uma unidade ativa da mesma clínica.
- A seleção grava contexto server-side, cookie HttpOnly auxiliar, última escolha e auditoria.
- A Home e a navegação são derivadas do perfil validado.
- A ação “Trocar perfil” encerra o contexto atual sem encerrar a sessão da conta.
- Manipulação manual de identificadores é recusada no servidor e no banco.

## Estado de implementação

Hoje `/selecionar-perfil` lista `clinic_memberships`, escolhe automaticamente quando existe apenas um vínculo e grava esse vínculo em `user_active_contexts`. A experiência visual e a entidade própria de perfil ainda não estão implementadas.

