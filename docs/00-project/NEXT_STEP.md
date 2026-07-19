---
title: Próxima Etapa Prioritária
document_id: PRJ-003
version: 0.9.0
status: Planejado
last_updated: 2026-07-19
owner: DouxHub
related_documents:
  - CURRENT_STATE.md
  - DECISIONS.md
---

# Próximo Passo (Next Step)

A próxima etapa prioritária do desenvolvimento é:

- **Executar a Etapa 3, Ciclo 3: equivalência entre vínculos vigentes e perfis de acesso.**

## Objetivo

Criar uma camada segura de leitura e comparação que prove a equivalência entre `clinic_memberships` e os novos perfis, funções, unidades e permissões antes de qualquer troca da autoridade operacional.

## Dependências

- catálogo, matriz e cálculo de permissões efetivas aplicados e validados;
- `clinic_memberships` e `user_active_contexts` preservados como autoridade durante a comparação;
- discrepâncias tratadas como bloqueio, nunca corrigidas silenciosamente pelo navegador;
- nenhuma mudança visual definitiva, menu derivado de permissão ou troca do contexto ativo neste ciclo.

## Critérios de conclusão

- função segura para listar somente os perfis ativos da própria conta, com clínica, unidade, função e permissões efetivas;
- comparação rastreável entre cada vínculo vigente e seu perfil originado, cobrindo função, unidade e estado;
- resposta explícita para divergência ou perfil indisponível, sem fallback permissivo;
- testes para zero, um e múltiplos vínculos, isolamento entre contas, inativação e manipulação de identificadores;
- contrato de leitura server-side preparado sem alterar a navegação atual;
- critérios documentados para o futuro portão de adoção do novo contexto.
