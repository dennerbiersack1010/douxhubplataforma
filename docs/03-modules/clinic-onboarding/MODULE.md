---
title: Onboarding Inicial da Clínica
document_id: MOD-ONBOARD-001
version: 0.5.0
status: Validado
last_updated: 2026-07-19
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

A migração foi aplicada no Supabase oficial em 19/07/2026 e o contrato transacional foi aprovado com `clinic_onboarding_progress_ok`. A persistência, a ordem das etapas, o isolamento por usuário e o cancelamento estão validados no banco.

A rota `/configurar-clinica` passou a consumir essa API em uma interface técnica guiada. Ela inicia ou retoma o rascunho, permite salvar e revisar as cinco etapas, abre a sexta etapa de preparação e exige confirmação em duas ações para cancelar.

A migração `20260719120000_complete_clinic_onboarding.sql` implementa a conclusão transacional e idempotente. Ela cria clínica, primeira unidade, perfil pessoal, vínculo `clinic_owner`, contexto ativo e auditoria, e marca o mesmo rascunho como concluído. Repetir a conclusão devolve os mesmos identificadores sem duplicar registros.

O método `PUT /api/clinic-onboarding` aciona a conclusão, grava o cookie HttpOnly do vínculo ativo e direciona para `/dashboard`. O contrato foi aplicado e aprovado no Supabase oficial com `clinic_onboarding_completion_ok`.

## Ainda não implementado

- upload de foto e logotipo;
- criação de funções padrão e perfil de acesso;

O visual definitivo depende de referência aprovada. Até lá, qualquer interface será explicitamente técnica e temporária.
