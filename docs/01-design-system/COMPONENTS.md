---
title: Componentes Visuais
document_id: DS-008
version: 0.1.0
status: Em desenvolvimento
last_updated: 2026-07-16
owner: DouxHub
related_documents:
  - DESIGN_SYSTEM.md
  - ACCESSIBILITY.md
  - ../02-screens/login/SCREEN.md
---

# Componentes Visuais

## Componentes existentes

- `AuthShell`: estrutura reutilizável das telas públicas de cadastro, recuperação, redefinição e primeiro acesso;
- campos de autenticação: fundo claro persistente, borda clara, rótulo visível e ícone auxiliar;
- botão principal: fundo cinza claro, texto escuro, estado desabilitado e indicador de carregamento;
- link de apoio: texto claro com sublinhado sutil;
- painel: superfície preta translúcida, borda discreta, raio amplo e desfoque de fundo;
- mensagens: blocos de erro e sucesso com cor, borda e texto explícito.

## Limites

Esses componentes formam o padrão aprovado apenas para autenticação pública. Componentes do ambiente autenticado permanecem em definição e não devem copiar automaticamente essa composição.
