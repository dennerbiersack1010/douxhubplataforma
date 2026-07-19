---
title: Próxima Etapa Prioritária
document_id: PRJ-003
version: 0.7.0
status: Planejado
last_updated: 2026-07-19
owner: DouxHub
related_documents:
  - CURRENT_STATE.md
  - DECISIONS.md
---

# Próximo Passo (Next Step)

A próxima etapa prioritária do desenvolvimento é:

- **Iniciar a Etapa 3, Ciclo 1: fundação aditiva de usuários da clínica, funções atribuíveis e perfis de acesso.**

## Objetivo

Evoluir o modelo atual, em que `clinic_memberships` concentra vínculo, unidade e uma única função, para a fundação documental já definida de usuários da clínica, múltiplas atribuições de função e perfis de acesso, sem quebrar vínculos existentes.

## Dependências

- onboarding guiado concluído e validado no Supabase oficial;
- modelo conceitual de conta, usuário da clínica, função, permissão, perfil e profissional documentado em `docs/03-modules/clinic-access/`;
- transição obrigatoriamente aditiva e retrocompatível com `clinic_memberships`;
- contrato e testes definidos antes de alterar interface ou autorização em produção;
- nenhuma mudança visual definitiva sem referência aprovada.

## Critérios de conclusão

- migração aditiva sem remover nem reinterpretar vínculos existentes;
- entidades e cardinalidades do modelo conceitual representadas no banco;
- retrocompatibilidade do Login, contexto ativo e onboarding comprovada;
- RLS e funções seguras cobrindo isolamento, múltiplas funções e unidades;
- testes transacionais de migração, compatibilidade e isolamento aprovados;
- nenhuma interface definitiva ou módulo de negócio criado neste ciclo.
