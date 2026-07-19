---
title: Fluxos do Onboarding
document_id: MOD-ONBOARD-003
version: 0.1.0
status: Em desenvolvimento
last_updated: 2026-07-18
owner: DouxHub
related_documents:
  - MODULE.md
  - DATA_MODEL.md
  - STATES.md
---

# Fluxos do Onboarding

## Iniciar ou retomar

1. O servidor valida a conta autenticada.
2. `start_or_resume_clinic_onboarding` retorna o rascunho ativo existente ou cria um novo.
3. Chamadas concorrentes retornam o mesmo rascunho ativo.
4. A aplicação abre `current_step` e preenche os dados já salvos.

## Salvar etapa

1. A futura API validará os campos da etapa com schema específico.
2. A função segura confirma propriedade, estado e ordem.
3. O bloco da etapa é substituído integralmente.
4. A etapa entra em `completed_steps`, `current_step` avança e `revision` aumenta.
5. Recarregar a página retoma o mesmo estado.

## Cancelar

1. A interface futura pede confirmação explícita.
2. A função valida que o rascunho ativo pertence ao usuário.
3. O estado muda para `cancelled`; nenhum dado é apagado.
4. Um novo início pode criar outro rascunho.

## Concluir

Planejado para ciclo posterior. A conclusão deverá validar todas as etapas, criar clínica e unidade uma única vez, configurar a proprietária, funções e perfil inicial, registrar auditoria e marcar o mesmo rascunho como `completed` na mesma transação quando possível.

