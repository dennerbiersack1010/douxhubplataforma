---
title: Testes do Onboarding
document_id: MOD-ONBOARD-005
version: 0.4.0
status: Em desenvolvimento
last_updated: 2026-07-19
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

O contrato foi executado no Supabase oficial em 19/07/2026, após a aplicação da migração `20260718120000_clinic_onboarding_progress.sql`. O resultado final foi `clinic_onboarding_progress_ok`.

A primeira execução falhou porque três chamadas usavam literais `integer` para o parâmetro `smallint` de `save_clinic_onboarding_step`. O teste foi corrigido com conversões explícitas `::smallint`; a migração e as funções não precisaram de alteração. A execução aprovada terminou com `rollback`, removendo os dois usuários e todos os rascunhos artificiais.

Os schemas foram exercitados localmente com casos válidos para as cinco etapas e casos inválidos de CNPJ, fuso horário e intervalo de funcionamento. O teste retornou `clinic_onboarding_schema_smoke_ok`. TypeScript, ESLint e build também foram executados com sucesso; permanecem quatro avisos preexistentes sobre `<img>`.

## Validação do Ciclo 3

- ESLint aprovado sem erros e sem avisos novos;
- TypeScript aprovado pelo build do Next.js;
- build de produção aprovado com 35 rotas/páginas e Proxy ativo;
- revisão estática dos estados de carregamento, gravação, retomada, preparação e cancelamento;
- risco de bloqueio pelo modo estrito do React identificado na revisão e removido antes do checkpoint;
- teste manual autenticado, refresh real e chamadas da interface contra produção permanecem pendentes.

## Testes futuros

- schemas server-side de cada tela;
- refresh e retomada em todas as etapas;
- dupla submissão e concorrência;
- conclusão idempotente;
- tentativa de acesso por outra conta ou clínica;
- sessão anônima;
- cancelamento confirmado;
- fluxo completo no domínio publicado.
