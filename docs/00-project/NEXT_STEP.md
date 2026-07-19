---
title: Próxima Etapa Prioritária
document_id: PRJ-003
version: 0.6.0
status: Planejado
last_updated: 2026-07-19
owner: DouxHub
related_documents:
  - CURRENT_STATE.md
  - DECISIONS.md
---

# Próximo Passo (Next Step)

A próxima etapa prioritária do desenvolvimento é:

- **Projetar e implementar o Ciclo 4 do onboarding: conclusão transacional e idempotente da primeira clínica e unidade.**

## Objetivo

Transformar o rascunho completo em clínica, primeira unidade, vínculo de proprietária, função, contexto e auditoria uma única vez, preservando o Login e os dados multiempresa já validados.

## Dependências

- modelo conceitual documentado em `docs/03-modules/clinic-access/`;
- persistência, migração aditiva e políticas RLS validadas no Supabase oficial;
- API autenticada `/api/clinic-onboarding` e schemas das cinco etapas implementados;
- interface técnica guiada, retomada e cancelamento confirmado implementados;
- contrato específico de conclusão definido antes da alteração do banco;
- referência visual aprovada antes de transformar a interface técnica em visual definitivo.

## Critérios de conclusão

- clínica e primeira unidade criadas uma única vez;
- proprietária configurada com função e perfil corretos;
- rascunho marcado como concluído na mesma operação ou com compensação documentada;
- contexto ativo e auditoria criados sem duplicidade;
- isolamento, RLS, refresh e abandono testados;
- documentação e changelog atualizados sem registrar planejamento como implementação.
