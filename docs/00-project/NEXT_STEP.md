---
title: Próxima Etapa Prioritária
document_id: PRJ-003
version: 0.10.0
status: Planejado
last_updated: 2026-07-19
owner: DouxHub
related_documents:
  - CURRENT_STATE.md
  - DECISIONS.md
---

# Próximo Passo (Next Step)

A próxima etapa prioritária do desenvolvimento é:

- **Executar a Etapa 3, Ciclo 4: adoção controlada do perfil de acesso como contexto operacional.**

## Objetivo

Introduzir o identificador do perfil no contexto ativo e na seleção server-side, mantendo a ponte com o vínculo vigente, auditoria e retorno seguro enquanto a nova autoridade é validada em produção.

## Dependências

- portão de equivalência do Ciclo 3 aplicado e validado;
- adoção permitida somente para snapshots com `equivalence_ready = true`;
- `source_membership_id` preservado para compatibilidade, rastreabilidade e retorno seguro;
- nenhuma autorização baseada apenas em cookie, estado do navegador ou item oculto de menu;
- mudança visual definitiva e profissionais permanecem fora deste ciclo.

## Critérios de conclusão

- contexto ativo passa a referenciar perfil validado e vínculo de origem durante a transição;
- seleção e troca de perfil são executadas no servidor, com auditoria e cookie `HttpOnly` apenas auxiliar;
- todo Login concluído passa pela resolução de perfis, incluindo o caso de uma única opção, conforme DEC-011;
- divergência, perfil inativo ou identificador manipulado falham de forma fechada, sem regressar automaticamente ao vínculo permissivo;
- testes cobrem zero, um e múltiplos perfis, troca, revogação, isolamento, repetição e rollback lógico;
- Login, onboarding e rotas protegidas continuam funcionais durante a adoção gradual.
