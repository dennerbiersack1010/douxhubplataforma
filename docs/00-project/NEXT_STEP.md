---
title: Próxima Etapa Prioritária
document_id: PRJ-003
version: 0.8.0
status: Planejado
last_updated: 2026-07-19
owner: DouxHub
related_documents:
  - CURRENT_STATE.md
  - DECISIONS.md
---

# Próximo Passo (Next Step)

A próxima etapa prioritária do desenvolvimento é:

- **Executar a Etapa 3, Ciclo 2: catálogo de permissões e matriz efetiva das funções por clínica.**

## Objetivo

Persistir chaves estáveis de permissão, escopos e a matriz concedida às funções por clínica, preparando exceções explícitas de perfil sem trocar ainda a autorização vigente da aplicação.

## Dependências

- fundação aditiva de usuários, funções, unidades e perfis aplicada e validada;
- `clinic_memberships` preservado como autoridade operacional durante a transição;
- chaves de permissão definidas antes de qualquer menu ou tela baseada nelas;
- negação explícita obrigatoriamente superior à concessão personalizada;
- nenhuma mudança visual definitiva ou migração da seleção de perfil neste ciclo.

## Critérios de conclusão

- catálogo com chaves `recurso.acao`, descrição e escopos permitidos;
- matriz de permissões por `clinic_role` com concessões rastreáveis;
- estrutura de exceções de perfil com concessão ou negação explícita;
- função segura para calcular permissões efetivas, preservando RLS estrutural;
- testes de isolamento, conflito, negação prevalente e retrocompatibilidade;
- aplicação ainda usando a autorização atual até portão posterior de equivalência.
