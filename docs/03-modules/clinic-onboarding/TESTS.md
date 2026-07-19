---
title: Testes do Onboarding
document_id: MOD-ONBOARD-005
version: 0.2.0
status: Em desenvolvimento
last_updated: 2026-07-18
owner: DouxHub
related_documents:
  - MODULE.md
  - DATA_MODEL.md
  - FLOWS.md
---

# Testes do Onboarding

## Contrato criado

`supabase/tests/003_clinic_onboarding_progress.sql` cobre transacionalmente:

- existência da tabela, RLS e funções;
- ausência de escrita direta para `authenticated`;
- início idempotente e retomada do mesmo rascunho;
- persistência e avanço da primeira etapa;
- recusa de etapa fora de ordem;
- isolamento de leitura e alteração entre duas contas;
- cancelamento com preservação do registro;
- rollback dos usuários e dados artificiais.

## Estado da validação

O arquivo de teste está implementado, mas ainda não foi executado em PostgreSQL porque esta cópia de trabalho não possui Supabase CLI, PostgreSQL local ou configuração de banco remoto. O módulo de testes permanece `Em desenvolvimento` até a execução real do contrato de banco.

Os schemas foram exercitados localmente com casos válidos para as cinco etapas e casos inválidos de CNPJ, fuso horário e intervalo de funcionamento. O teste retornou `clinic_onboarding_schema_smoke_ok`. TypeScript, ESLint e build também foram executados com sucesso; permanecem quatro avisos preexistentes sobre `<img>`.

## Testes futuros

- schemas server-side de cada tela;
- refresh e retomada em todas as etapas;
- dupla submissão e concorrência;
- conclusão idempotente;
- tentativa de acesso por outra conta ou clínica;
- sessão anônima;
- cancelamento confirmado;
- fluxo completo no domínio publicado.
