---
title: Usuários da Clínica
document_id: MOD-CLINIC-010
version: 0.2.0
status: Validado
last_updated: 2026-07-18
owner: DouxHub
related_documents:
  - CONCEPTUAL_MODEL.md
  - UNITS_AND_MEMBERSHIPS.md
  - ACCESS_PROFILES.md
---

# Usuários da Clínica

## Definição

Usuário da clínica é a relação entre uma pessoa autenticável e uma clínica. Ele não é a conta, a função, o perfil selecionado nem o profissional. Seu ciclo de vida pertence à clínica e preserva dados administrativos como início, status e origem do vínculo.

## Dados conceituais

- clínica;
- conta/pessoa associada;
- status `invited`, `active`, `inactive` ou `suspended`;
- data de início e, quando aplicável, término;
- telefone e nome de exibição específicos da clínica, sem duplicar a identidade global sem necessidade;
- criador, convite de origem e datas de auditoria.

## Regras

- Uma pessoa possui no máximo um usuário da clínica por clínica.
- O usuário da clínica pode possuir várias funções, unidades e perfis.
- Suspender o usuário remove o acesso a todos os perfis daquela clínica, sem apagar histórico.
- A proprietária usa a conta autenticada existente; o onboarding não cria uma segunda conta para ela.
- Aceitar convite ativa o usuário da clínica somente depois de validar o e-mail autenticado.
- A proprietária não define a senha de colaboradores.

## Estado de implementação

A fundação foi implementada em `clinic_users`. Cada `clinic_membership` vigente cria ou atualiza um usuário da clínica rastreável pelo campo `source_membership_id`. A aplicação ainda usa o vínculo legado como autoridade operacional até os próximos ciclos.
