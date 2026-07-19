---
title: Funções e Permissões das Clínicas
document_id: MOD-CLINIC-012
version: 0.3.0
status: Validado
last_updated: 2026-07-18
owner: DouxHub
related_documents:
  - CONCEPTUAL_MODEL.md
  - PERMISSIONS.md
  - ACCESS_PROFILES.md
  - ../../05-security/MULTI_TENANT_SECURITY.md
---

# Funções e Permissões das Clínicas

## Modelo

A plataforma mantém modelos de função. Cada clínica recebe cópias próprias desses modelos durante o onboarding e pode personalizá-las dentro dos limites de segurança. A função descreve responsabilidades; a permissão autoriza uma ação em um escopo.

## Funções padrão

- Proprietária;
- Administradora;
- Gestora de unidade;
- Recepção;
- Profissional;
- Comercial;
- Financeiro;
- Estoque;
- Marketing;
- Personalizado.

A criação dessas funções não cria contas, senhas ou colaboradores fictícios.

## Estrutura de permissão

Cada permissão deve possuir uma chave estável no formato `recurso.acao`, por exemplo `schedule.read`, `patients.update` ou `clinic.settings.manage`. O escopo pode ser `own`, `unit`, `clinic` ou outro escopo aprovado para o recurso. Permissões críticas devem ser verificadas na interface, nas rotas server-side e no banco.

## Composição

1. A função da clínica concede a base de permissões.
2. O perfil de acesso define clínica, unidade e função ativas.
3. Exceções explícitas do perfil podem conceder ou negar permissões personalizáveis.
4. Restrições estruturais e de RLS não podem ser removidas por personalização.
5. Em conflito, negação explícita prevalece.

## Limites administrativos

- A função Proprietária não pode ser removida pelo fluxo comum de equipe.
- Administradoras não podem ampliar as próprias permissões acima do permitido pela Proprietária.
- Nenhuma função pode acessar outra clínica.
- Permissões financeiras, de prontuário, integrações e segurança são sensíveis e exigem chaves específicas.
- Toda alteração de função ou permissão deve ser auditada com ator, alvo, estado anterior e novo estado.

## Estado de implementação

As funções por clínica e as atribuições múltiplas estão em `clinic_roles` e `clinic_user_role_assignments`. `permission_catalog` mantém as chaves e escopos; `clinic_role_permissions` mantém concessões por função; `access_profile_permission_overrides` mantém concessões ou negações personalizáveis.

O cálculo efetivo valida o perfil da própria conta e aplica negação explícita antes de qualquer concessão. Escrita administrativa, auditoria das alterações e adoção pelas rotas permanecem para ciclos posteriores.
