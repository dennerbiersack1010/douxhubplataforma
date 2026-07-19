---
title: Fluxos do Onboarding
document_id: MOD-ONBOARD-003
version: 0.4.0
status: Validado
last_updated: 2026-07-19
owner: DouxHub
related_documents:
  - MODULE.md
  - DATA_MODEL.md
  - STATES.md
---

# Fluxos do Onboarding

## Iniciar ou retomar

1. O servidor valida a conta autenticada.
2. `start_or_resume_clinic_onboarding` retorna o rascunho ativo existente ou cria um novo.
3. Chamadas concorrentes retornam o mesmo rascunho ativo.
4. A aplicação abre `current_step` e preenche os dados já salvos.

A interface executa a consulta ao abrir `/configurar-clinica` e inicia o rascunho automaticamente somente quando `GET` não encontra progresso ativo. O início permanece seguro em chamadas concorrentes porque a função do banco é idempotente.

## Salvar etapa

1. A API valida os campos da etapa com schema Zod específico.
2. A função segura confirma propriedade, estado e ordem.
3. O bloco da etapa é substituído integralmente.
4. A etapa entra em `completed_steps`, `current_step` avança e `revision` aumenta.
5. Recarregar a página retoma o mesmo estado.

Etapas salvas permanecem disponíveis para revisão. A interface não habilita etapas acima de `current_step`, e a validação do banco continua protegendo a ordem mesmo que o cliente seja contornado.

O `PATCH /api/clinic-onboarding` envia ao banco somente o objeto já validado e normalizado. Etapas à frente do progresso atual continuam bloqueadas pela função PostgreSQL.

## Cancelar

1. A interface pede confirmação explícita em duas ações.
2. A função valida que o rascunho ativo pertence ao usuário.
3. O estado muda para `cancelled`; nenhum dado é apagado.
4. Um novo início pode criar outro rascunho.

Após o cancelamento, a tela não reutiliza o registro cancelado e oferece uma ação separada para iniciar um novo onboarding.

## Preparar conclusão

Ao salvar a quinta etapa, `current_step` avança para 6. A tela informa que os dados estão preparados e permite revisar as etapas anteriores. Nenhuma clínica, unidade, função ou vínculo é criado antes da ação explícita de conclusão.

## Concluir

1. A interface envia o identificador do rascunho por `PUT`.
2. A API valida a sessão e chama `complete_clinic_onboarding`.
3. A função bloqueia o rascunho, confirma propriedade, estado e cinco etapas completas.
4. Clínica, unidade, perfil pessoal, vínculo `clinic_owner`, contexto e auditoria são criados na mesma transação.
5. O rascunho recebe os identificadores criados, `completed_at` e estado `completed`.
6. A API grava o cookie HttpOnly do vínculo e direciona para `/dashboard`.
7. Repetir a operação devolve os mesmos identificadores e não cria novos registros.

Contas diferentes não podem concluir o rascunho, e um rascunho incompleto recebe conflito sem alteração de dados.
