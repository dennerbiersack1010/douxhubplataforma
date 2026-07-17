---
title: Tokens de Design
document_id: DS-004
version: 0.1.0
status: Em desenvolvimento
last_updated: 2026-07-16
owner: DouxHub
related_documents:
  - DESIGN_SYSTEM.md
  - COLORS.md
  - TYPOGRAPHY.md
  - SPACING.md
---

# Tokens de Design

## Estado atual

A base global utiliza variáveis CSS em `app/globals.css` para cores semânticas, raios, gráficos e sidebar. Tailwind CSS disponibiliza esses valores às classes da aplicação. O conjunto definitivo de tokens dos módulos internos ainda não foi aprovado.

## Grupos existentes

- cores semânticas: fundo, primeiro plano, card, popover, primária, secundária, muted, accent, destructive, borda, input e ring;
- raios: escala derivada de `--radius: 0.625rem`;
- tipografia: `--font-raleway` para texto e títulos e `--font-geist-mono` para conteúdo monoespaçado;
- sidebar e gráficos: variáveis preparatórias presentes nos temas claro e escuro.

## Regra de evolução

Novos valores reutilizáveis devem ser promovidos a tokens somente após aprovação visual. Valores específicos das telas públicas de autenticação permanecem documentados em `COLORS.md`, `SPACING.md` e `COMPONENTS.md` até a consolidação do Design System interno.
