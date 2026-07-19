---
title: Tela de Configuração Inicial da Clínica
document_id: SCR-CONFIG-CLINIC-001
version: 0.2.0
status: Validado
last_updated: 2026-07-19
owner: DouxHub
related_documents:
  - ../../03-modules/clinic-onboarding/MODULE.md
  - ../../03-modules/clinic-onboarding/FLOWS.md
  - ../../03-modules/clinic-onboarding/STATES.md
  - ../../01-design-system/DESIGN_SYSTEM.md
---

# Tela de Configuração Inicial da Clínica

## Objetivo

Conduzir uma conta autenticada sem vínculo ativo pelas cinco etapas de dados do onboarding, preservando o progresso entre atualizações de página e sessões. A sexta etapa permite revisar ou criar a clínica e a primeira unidade de forma transacional.

## Natureza visual

A tela é explicitamente técnica e temporária. Ela reutiliza o padrão interno existente em tons de zinc, bordas simples, campos nativos e avisos de estado. Não representa um design definitivo e não adiciona padrões ao Design System.

## Estrutura

- aviso de interface técnica temporária;
- cabeçalho com revisão atual do rascunho;
- navegação pelas seis etapas, bloqueando etapas futuras;
- formulário específico para a etapa ativa;
- mensagens de erro e confirmação de salvamento;
- cancelamento protegido por confirmação em duas ações.

## Etapas

1. identificação da proprietária;
2. dados jurídicos e fiscais da clínica;
3. primeira unidade e endereço;
4. funcionamento, políticas e pagamentos;
5. preparação da equipe;
6. dados preparados, revisão e conclusão.

## Retomada e gravação

Ao abrir `/configurar-clinica`, a interface consulta `GET /api/clinic-onboarding`. Se não existir rascunho ativo, usa `POST` para iniciar um de forma idempotente. Cada formulário envia somente sua etapa por `PATCH`; após a resposta, a revisão e o passo atual são atualizados com os dados devolvidos pelo servidor.

Etapas já salvas podem ser revisadas. Etapas futuras permanecem desabilitadas e o banco continua sendo a autoridade sobre a ordem.

## Conclusão

A ação “Criar clínica e entrar” envia `PUT /api/clinic-onboarding`. Quando aprovada, a operação cria os registros iniciais uma única vez, ativa o vínculo da proprietária e direciona para `/dashboard`. A ação fica desabilitada durante o processamento e a repetição no servidor é idempotente.

## Cancelamento

A primeira ação apenas abre o aviso de confirmação. A segunda ação envia `DELETE /api/clinic-onboarding`. O registro é preservado como `cancelled`, a tela informa que o histórico não pode mais ser alterado e permite iniciar um novo onboarding.

## Estados acessíveis

- carregamento do progresso;
- erro remoto com `role="alert"`;
- confirmação de salvamento com `role="status"`;
- confirmação de cancelamento com `role="alert"`;
- controles desabilitados durante gravações;
- etapa ativa identificada por `aria-current="step"`.

## Limites atuais

- foto da proprietária e logotipo não possuem upload;
- endereço não possui busca automática por CEP;
- não houve validação manual autenticada em navegador neste ciclo;
- o visual definitivo depende de referência aprovada.
