---
title: Onboarding Inicial da Clínica
document_id: MOD-ONBOARD-001
version: 0.2.0
status: Em desenvolvimento
last_updated: 2026-07-18
owner: DouxHub
related_documents:
  - DATA_MODEL.md
  - FLOWS.md
  - STATES.md
  - TESTS.md
  - API.md
  - ../clinic-access/CONCEPTUAL_MODEL.md
  - ../../05-security/MULTI_TENANT_SECURITY.md
---

# Onboarding Inicial da Clínica

## Objetivo

Conduzir a proprietária autenticada pela identificação pessoal, dados da clínica, primeira unidade, funcionamento básico, preparação da equipe e conclusão. O progresso deve sobreviver a atualização de página e abandono temporário sem criar clínicas duplicadas.

## Etapas definidas

1. Identificação da proprietária;
2. Dados da clínica;
3. Primeira unidade;
4. Funcionamento básico;
5. Preparação da equipe;
6. Conclusão.

## Ciclos implementados nesta versão

A migração `20260718120000_clinic_onboarding_progress.sql` implementa a fundação de rascunho: iniciar ou retomar, salvar uma etapa ordenada e cancelar. A leitura é limitada ao próprio usuário por Row Level Security (RLS), e escritas diretas são negadas; alterações passam por funções seguras vinculadas a `auth.uid()`.

A rota `/api/clinic-onboarding` e os schemas em `lib/clinic-onboarding.ts` implementam a camada server-side para consultar, iniciar/retomar, validar, salvar e cancelar. A API rejeita contas com vínculo ativo, não usa cache e não expõe erros internos.

## Ainda não implementado

- formulários das seis telas;
- upload de foto e logotipo;
- conclusão transacional da clínica e unidade;
- criação de funções padrão e perfil de acesso;
- aplicação e validação da nova migração no Supabase de produção.

O visual definitivo depende de referência aprovada. Até lá, qualquer interface será explicitamente técnica e temporária.
