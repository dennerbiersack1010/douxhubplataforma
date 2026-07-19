---
title: Próxima Etapa Prioritária
document_id: PRJ-003
version: 0.4.0
status: Planejado
last_updated: 2026-07-18
owner: DouxHub
related_documents:
  - CURRENT_STATE.md
  - DECISIONS.md
---

# Próximo Passo (Next Step)

A próxima etapa prioritária do desenvolvimento é:

- **Projetar tecnicamente e implementar de forma incremental o onboarding guiado da proprietária, da clínica e da primeira unidade sobre o modelo conceitual definido.**

## Objetivo

Substituir a criação curta de clínica por um fluxo protegido, retomável e idempotente, preservando o Login, a autenticação e os dados multiempresa já validados.

## Dependências

- modelo conceitual documentado em `docs/03-modules/clinic-access/`;
- desenho de persistência do progresso antes da interface;
- migração aditiva e políticas RLS testadas;
- referência visual aprovada antes de transformar a interface técnica em visual definitivo.

## Critérios de conclusão

- progresso salvo e retomado com segurança;
- clínica e primeira unidade criadas uma única vez;
- proprietária configurada com função e perfil corretos;
- isolamento, RLS, refresh e abandono testados;
- documentação e changelog atualizados sem registrar planejamento como implementação.
