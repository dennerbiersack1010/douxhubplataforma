---
title: Modelo Conceitual de Identidade e Acesso
document_id: MOD-CLINIC-009
version: 0.2.0
status: Em desenvolvimento
last_updated: 2026-07-18
owner: DouxHub
related_documents:
  - MODULE.md
  - DATA_MODEL.md
  - CLINIC_USERS.md
  - PROFESSIONALS.md
  - ROLES_AND_PERMISSIONS.md
  - ACCESS_PROFILES.md
  - UNITS_AND_MEMBERSHIPS.md
---

# Modelo Conceitual de Identidade e Acesso

## Princípio central

A DouxHub separa autenticação, identidade, relação de trabalho, responsabilidade, contexto operacional e atuação profissional. Nenhuma dessas dimensões deve ser inferida apenas pela existência de uma conta ou por um campo único de função.

## Entidades

| Entidade | Responsabilidade | Estado atual |
|---|---|---|
| Conta | Autenticar uma pessoa por e-mail e senha no Supabase Auth. | Implementada em `auth.users`. |
| Pessoa | Manter identidade global da pessoa autenticada. | Parcialmente implementada em `user_profiles`. |
| Clínica | Representar a empresa contratante e a fronteira principal de isolamento. | Implementada em `clinics`. |
| Unidade | Representar um local físico ou operacional da clínica. | Implementada em `clinic_units`. |
| Usuário da clínica | Representar a relação da pessoa com uma clínica, independentemente de função ou unidade. | Conceitualmente misturado em `clinic_memberships`; evolução planejada. |
| Função | Agrupar responsabilidades e permissões dentro de uma clínica. | Catálogo global inicial em `roles`; modelo por clínica planejado. |
| Perfil de acesso | Representar uma opção selecionável de clínica, unidade e função para a pessoa. | Hoje o vínculo é usado como perfil; entidade própria planejada. |
| Profissional | Representar quem executa procedimentos e pode possuir agenda. | Não implementada. |
| Vínculo | Associar usuário da clínica a funções, unidades, perfis e estados. | Implementação atual limitada a uma função e uma unidade. |
| Permissão | Autorizar ação sobre módulo ou recurso em determinado escopo. | Não implementada como catálogo e matriz persistida. |

## Cardinalidades-alvo

- Uma conta possui zero ou uma pessoa global e pode participar de várias clínicas.
- Uma clínica possui uma ou mais unidades.
- Uma pessoa pode originar um usuário da clínica em cada clínica autorizada.
- Um usuário da clínica pode estar associado a várias unidades e funções.
- Um usuário da clínica pode possuir vários perfis de acesso.
- Cada perfil de acesso pertence a uma clínica, usa uma função e possui escopo de clínica inteira ou de uma unidade.
- Uma clínica pode possuir profissionais com ou sem conta de acesso.
- Um profissional pode atuar em várias unidades e pode, opcionalmente, estar ligado a um usuário da clínica.
- Uma função possui várias permissões; exceções explícitas podem ser aplicadas ao perfil sem enfraquecer restrições do servidor e do banco.

## Fluxo de autorização

1. A conta é autenticada.
2. O servidor lista somente perfis de acesso ativos pertencentes à pessoa autenticada.
3. A pessoa escolhe um perfil, mesmo quando existe apenas uma opção.
4. O servidor valida clínica, função, unidade, estado e permissões.
5. O contexto ativo persiste o identificador do perfil validado.
6. Menu e Home são derivados do contexto autorizado.
7. APIs e RLS repetem a autorização; ocultar itens na interface nunca é suficiente.

## Invariantes

- Nenhum identificador enviado pelo navegador concede acesso sem validação server-side.
- Toda entidade operacional pertence a uma clínica; quando aplicável, também a uma unidade.
- A unidade de um perfil deve pertencer à mesma clínica do usuário da clínica.
- Uma função padrão criada para a clínica não cria conta, senha ou pessoa fictícia.
- Convite e aceite nunca concedem acesso antes da validação do destinatário, validade e escopo.
- Profissional sem conta pode existir na operação, mas não pode autenticar nem receber permissões.
- Negação explícita de permissão prevalece sobre concessão personalizada.
- Mudanças de contexto, função, permissão, unidade e estado são auditáveis.

## Transição segura

A evolução será aditiva. As tabelas atuais permanecem válidas enquanto novas estruturas forem criadas e preenchidas. Cada `clinic_membership` existente deverá originar, de forma idempotente, um usuário da clínica, uma atribuição de função, uma associação de unidade e um perfil de acesso. A aplicação só deixará de usar o vínculo atual como contexto depois de testes de equivalência, RLS e rollback lógico. Não haverá remoção ou alteração destrutiva nesta fase de definição.

O Ciclo 1 iniciou essa transição pela ponte descrita. Usuários da clínica, funções, atribuições, unidades e perfis foram criados e preenchidos, mas permissões, profissionais e a troca da autoridade operacional ainda não foram implementados.
