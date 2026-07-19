---
title: Próxima Etapa Prioritária
document_id: PRJ-003
version: 0.11.0
status: Planejado
last_updated: 2026-07-19
owner: DouxHub
related_documents:
  - CURRENT_STATE.md
  - DECISIONS.md
---

# Próximo Passo (Next Step)

A próxima etapa prioritária do desenvolvimento é:

- **Executar a Etapa 3, Ciclo 5: autorização server-side pelo perfil ativo.**

## Objetivo

Criar um contrato central de autorização que leia o perfil ativo validado e aplique permissões efetivas nas operações protegidas, começando pela administração da clínica sem alterar ainda os menus definitivos.

## Dependências

- perfil ativo persistido com vínculo de origem e seleção auditada;
- catálogo, matriz e permissões efetivas validados;
- RLS continua como limite superior e independente da autorização da aplicação;
- nenhuma autorização baseada apenas em cookie, estado do navegador ou item oculto de menu;
- menus definitivos, profissionais e módulos de negócio permanecem fora deste ciclo.

## Critérios de conclusão

- função ou helper central valida sessão, contexto ativo, perfil, clínica, escopo e chave de permissão;
- contexto ausente, revogado, divergente ou sem permissão falha de forma fechada;
- operações de administração da clínica passam a exigir as permissões efetivas correspondentes no servidor;
- compatibilidade com o vínculo de origem permanece explícita e não enfraquece as negações do perfil;
- testes cobrem proprietária, administradora, colaborador, negação personalizada, isolamento, contexto obsoleto e manipulação de identificadores;
- Login, seleção, onboarding e rotas não migradas continuam funcionais.
