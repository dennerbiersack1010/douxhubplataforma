---
title: Permissões Iniciais das Clínicas
document_id: MOD-CLINIC-004
version: 0.1.0
status: Implementado
last_updated: 2026-07-16
owner: DouxHub
related_documents:
  - MODULE.md
  - BUSINESS_RULES.md
  - ../../05-security/MULTI_TENANT_SECURITY.md
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
