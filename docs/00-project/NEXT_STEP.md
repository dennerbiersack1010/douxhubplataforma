---
title: Próxima Etapa Prioritária
document_id: PRJ-003
version: 0.5.0
status: Planejado
last_updated: 2026-07-19
owner: DouxHub
related_documents:
  - CURRENT_STATE.md
  - DECISIONS.md
---

# Próximo Passo (Next Step)

A próxima etapa prioritária do desenvolvimento é:

- **Implementar o Ciclo 3 do onboarding: interface técnica guiada, retomada do progresso e cancelamento confirmado sobre a API e a persistência já validadas.**

## Objetivo

Substituir a criação curta de clínica por um fluxo protegido, retomável e idempotente, preservando o Login, a autenticação e os dados multiempresa já validados.

## Dependências

- modelo conceitual documentado em `docs/03-modules/clinic-access/`;
- persistência, migração aditiva e políticas RLS validadas no Supabase oficial;
- API autenticada `/api/clinic-onboarding` e schemas das cinco etapas implementados;
- referência visual aprovada antes de transformar a interface técnica em visual definitivo.

## Critérios de conclusão

- progresso salvo e retomado com segurança;
- interface técnica capaz de abrir no passo atual e voltar aos passos concluídos;
- cancelamento somente após confirmação explícita;
- clínica e primeira unidade criadas uma única vez;
- proprietária configurada com função e perfil corretos;
- isolamento, RLS, refresh e abandono testados;
- documentação e changelog atualizados sem registrar planejamento como implementação.
