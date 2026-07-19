---
title: Perfis de Acesso e Seleção de Contexto
document_id: MOD-CLINIC-013
version: 0.5.0
status: Validado
last_updated: 2026-07-19
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

A entidade `access_profiles` foi implementada e preenchida a partir dos vínculos atuais, com função, unidade opcional, escopo, estado e rastreabilidade. Exceções personalizáveis e o cálculo de permissões efetivas também estão persistidos e validados.

O Ciclo 3 adicionou uma leitura segura dos perfis disponíveis e um snapshot de equivalência. Cada vínculo legado recebe diagnóstico explícito; perfis divergentes não são selecionáveis e bloqueiam a resposta da API com `409`.

O Ciclo 4 adotou o perfil no contexto server-side. `user_active_contexts` mantém simultaneamente o perfil validado e o vínculo de origem; a interface técnica sempre apresenta a seleção, inclusive para uma única opção. O vínculo permanece como ponte compatível enquanto as autorizações da aplicação são migradas gradualmente.
