---
title: API do Rascunho de Onboarding
document_id: MOD-ONBOARD-006
version: 0.2.0
status: Implementado
last_updated: 2026-07-19
owner: DouxHub
related_documents:
  - MODULE.md
  - DATA_MODEL.md
  - FLOWS.md
  - TESTS.md
---

# API do Rascunho de Onboarding

## Rota

`/api/clinic-onboarding`

Todas as operações exigem sessão válida, recusam contas com vínculo ativo e retornam `Cache-Control: private, no-store`.

| Método | Operação |
|---|---|
| `GET` | Consulta o rascunho ativo sem criar um novo. |
| `POST` | Inicia ou retoma idempotentemente o rascunho. |
| `PATCH` | Valida e salva uma etapa entre 1 e 5. |
| `DELETE` | Cancela o rascunho próprio, preservando histórico. |

## Validação

Os schemas em `lib/clinic-onboarding.ts` são estritos e removem a autoridade do payload bruto antes da chamada ao banco.

- Etapa 1: identidade, telefone, cargo, responsabilidade e notificações.
- Etapa 2: clínica, CNPJ validado por dígitos verificadores, contatos, endereço fiscal, responsáveis, tipo e especialidades.
- Etapa 3: primeira unidade, endereço, telefone, fuso IANA, código e salas.
- Etapa 4: dias, horários coerentes, durações, antecedência, políticas e pagamentos.
- Etapa 5: adicionar recepção, adicionar profissional ou continuar depois.

O e-mail da proprietária vem da sessão autenticada e não é aceito como autoridade no payload da Etapa 1.

## Erros públicos

- `unauthorized`;
- `onboarding_not_available`;
- `onboarding_unavailable`;
- `invalid_onboarding_request`;
- `invalid_onboarding_step_data`;
- `onboarding_progress_not_found`;
- `onboarding_step_out_of_order`.

Detalhes internos do banco e valores de variáveis não são devolvidos ao cliente.

## Consumidor atual

A interface técnica de `/configurar-clinica` consome os quatro métodos. O carregamento tenta `GET` antes de `POST`, cada formulário usa `PATCH` e o cancelamento confirmado usa `DELETE`.

## Dependência de implantação

A migração `20260718120000_clinic_onboarding_progress.sql` foi aplicada e validada no Supabase oficial. A interface ainda deve preservar o tratamento de indisponibilidade para falhas operacionais.
