---
title: Modelo de Dados do Onboarding
document_id: MOD-ONBOARD-002
version: 0.1.0
status: Implementado
last_updated: 2026-07-18
owner: DouxHub
related_documents:
  - MODULE.md
  - FLOWS.md
  - TESTS.md
---

# Modelo de Dados do Onboarding

## `clinic_onboarding_progress`

Tabela aditiva de rascunhos pertencentes à conta autenticada.

| Campo | Finalidade |
|---|---|
| `user_id` | Proprietário exclusivo do rascunho. |
| `status` | `in_progress`, `completed` ou `cancelled`. |
| `current_step` | Próxima etapa liberada, entre 1 e 6. |
| `completed_steps` | Etapas persistidas entre 1 e 5. |
| `owner_data` | Dados provisórios da proprietária. |
| `clinic_data` | Dados provisórios da clínica. |
| `unit_data` | Dados provisórios da primeira unidade. |
| `operation_data` | Horários, políticas e funcionamento. |
| `team_data` | Escolha de preparar equipe agora ou depois. |
| `created_clinic_id`, `created_unit_id` | Resultado futuro da conclusão transacional. |
| `schema_version`, `revision` | Evolução do formato e controle de atualização. |
| datas | Início, atualização, conclusão e cancelamento. |

Os blocos JSON devem ser objetos e possuem limite de tamanho na função de gravação. A validação semântica de cada campo será feita por schemas server-side no ciclo de API.

## Integridade

- No máximo um rascunho `in_progress` por usuário.
- Etapas não podem ser salvas à frente de `current_step`.
- Regravação de etapa concluída é permitida e incrementa `revision`.
- Estado concluído exige clínica, unidade e data de conclusão.
- Estado cancelado exige data de cancelamento.
- Não há permissão direta de `insert`, `update` ou `delete` para `authenticated`.

## Funções seguras

- `start_or_resume_clinic_onboarding()`;
- `save_clinic_onboarding_step(uuid, smallint, jsonb)`;
- `cancel_clinic_onboarding(uuid)`.

Todas usam `security definer`, `search_path` explícito e `auth.uid()` como autoridade.

