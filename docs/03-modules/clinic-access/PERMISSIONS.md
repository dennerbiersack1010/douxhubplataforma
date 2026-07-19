---
title: Permissões Iniciais das Clínicas
document_id: MOD-CLINIC-004
version: 0.3.0
status: Validado
last_updated: 2026-07-16
owner: DouxHub
related_documents:
  - MODULE.md
  - BUSINESS_RULES.md
  - ../../05-security/MULTI_TENANT_SECURITY.md
  - ROLES_AND_PERMISSIONS.md
---

# Permissões Iniciais das Clínicas

| Ação | `clinic_owner` | `clinic_admin` | `clinic_employee` |
|---|---|---|---|
| Visualizar clínica e unidades vinculadas | Sim | Sim | Sim, leitura limitada |
| Visualizar membros | Sim | Sim | Não |
| Convidar administrador | Sim | Não | Não |
| Convidar colaborador | Sim | Sim | Não |
| Revogar convite permitido | Sim | Sim, somente colaborador | Não |
| Alterar função de administrador/colaborador | Sim | Não | Não |
| Ativar ou desativar colaborador | Sim | Sim | Não |
| Alterar ou desativar proprietário | Não | Não | Não |
| Trocar o próprio contexto ativo | Sim | Sim | Sim |

As funções `receptionist`, `professional`, `commercial`, `financial` e `stock_manager` estão preparadas, mas inativas e não atribuíveis. `platform_owner`, `platform_admin` e `platform_support` não existem neste módulo.

## Fundação da matriz efetiva

O catálogo e a matriz por função foram aplicados no banco. As chaves iniciais representam leitura da clínica e unidades, configurações, membros, convites, gestão permitida de colaboradores e troca do próprio contexto. Os escopos aprovados são `own`, `unit` e `clinic`.

A matriz acima continua descrevendo a autorização operacional vigente. Rotas, menus e `clinic_memberships` ainda não consultam a nova matriz; essa adoção depende de equivalência e portão posterior.
