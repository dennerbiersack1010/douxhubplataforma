---
title: Unidades e Vínculos Operacionais
document_id: MOD-CLINIC-014
version: 0.1.0
status: Definido
last_updated: 2026-07-18
owner: DouxHub
related_documents:
  - CONCEPTUAL_MODEL.md
  - CLINIC_USERS.md
  - ACCESS_PROFILES.md
---

# Unidades e Vínculos Operacionais

## Unidade

Unidade é uma entidade própria, mesmo quando a clínica possui apenas um endereço. Ela concentra endereço, contato, fuso horário, dias e horários de funcionamento, identificação interna, salas e configurações operacionais futuras.

## Vínculos

O vínculo operacional conecta o usuário da clínica às unidades e funções autorizadas. Uma pessoa pode possuir mais de uma função e atuar em mais de uma unidade. Perfis de acesso transformam essas autorizações em contextos selecionáveis.

## Regras

- Toda clínica criada possui ao menos uma unidade.
- A primeira unidade não deve ser confundida com os dados fiscais da clínica.
- Uma associação de unidade só pode referenciar a clínica do usuário da clínica.
- A desativação de uma unidade invalida perfis daquela unidade sem apagar histórico.
- Funções podem ter escopo de clínica inteira ou de unidade.
- O vínculo de Proprietária inclui a primeira unidade e pode possuir escopo de clínica inteira.
- Alterações de unidade, função, status e perfil são auditáveis.

## Transição do modelo atual

O `clinic_membership` atual será tratado como registro de compatibilidade durante a migração. Seu `unit_id` originará uma associação de unidade e seu `role_id` originará uma atribuição de função. A unicidade atual por usuário e clínica não será removida até que os novos vínculos tenham sido preenchidos, testados e adotados por todas as rotas.

