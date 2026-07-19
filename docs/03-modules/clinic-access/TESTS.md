---
title: Testes do Acesso às Clínicas
document_id: MOD-CLINIC-007
version: 0.4.0
status: Validado
last_updated: 2026-07-19
owner: DouxHub
related_documents:
  - MODULE.md
  - BUSINESS_RULES.md
  - ../../05-security/MULTI_TENANT_SECURITY.md
---

# Testes do Acesso às Clínicas

## Banco de dados

- `001_multi_tenant_contract.sql`: aprovado com `multi_tenant_contract_ok`.
- `002_clinic_access_flows.sql`: aprovado com `clinic_access_flows_ok` e rollback integral dos dados fictícios.
- `006_clinic_access_profiles_foundation.sql`: aprovado com `clinic_access_profiles_foundation_ok` e rollback integral.
- `007_clinic_permissions_foundation.sql`: aprovado com `clinic_permissions_foundation_ok` e rollback integral.
- `008_access_profile_equivalence_gate.sql`: aprovado com `access_profile_equivalence_gate_ok` e rollback integral.

A suíte funcional cobre usuário sem clínica, uma clínica, múltiplas clínicas, primeira clínica e unidade, proprietário, administrador convidando colaborador, convites válido, expirado, revogado, duplicado e reutilizado, destinatário incorreto, alteração de função, desativação e reativação, proteção do proprietário, restrições do administrador, bloqueio do colaborador, isolamento de leitura e escrita entre clínicas, contexto ativo e auditoria.

O contrato da Etapa 3 confirma cinco tabelas com RLS, ausência de escrita direta para `authenticated`, cópia das funções por clínica, backfill e sincronização dos vínculos atuais, múltiplas funções, múltiplas unidades, perfil de acesso rastreável, isolamento entre clínicas e propagação de inativação.

O contrato do Ciclo 2 confirma catálogo e escopos válidos, matriz inicial, funções futuras sem concessões, ausência de escrita direta, isolamento entre clínicas, cálculo restrito ao próprio perfil, concessão personalizada, negação prevalente e recusa de escopo incompatível.

O contrato do Ciclo 3 confirma conta sem perfil, múltiplos vínculos e perfis, permissões efetivas, isolamento entre contas, divergência de estado, propagação de inativação e recusa de manipulação de clínica ou função.

## Aplicação

- ESLint: aprovado sem erros; permanecem quatro avisos já existentes sobre `<img>` nas telas públicas.
- TypeScript: aprovado com `tsc --noEmit`.
- Build de produção: aprovado com todas as rotas geradas.
- Produção: raiz e transição para `/login` aprovadas; `/configurar-clinica` e `/configuracoes/equipe` recusaram acesso não autenticado; estados públicos de recuperação, redefinição inválida e primeiro acesso inválido foram confirmados.

## Pendências

- validar a entrega e o aceite ponta a ponta com links reais de e-mail;
- validar o visual definitivo das interfaces autenticadas;
- executar validação manual autenticada no ambiente publicado com contas reais controladas.
