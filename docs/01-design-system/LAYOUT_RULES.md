---
title: Regras de Layout
document_id: DS-002
version: 0.1.0
status: Em desenvolvimento
last_updated: 2026-07-16
owner: DouxHub
related_documents:
  - DESIGN_SYSTEM.md
  - RESPONSIVE_RULES.md
---

# Regras de Layout (Layout Rules)

1. **Estrutura Técnica do Painel:**
   - Sidebar fixa na lateral esquerda (em telas grandes) para navegação entre os módulos.
   - Header fixo no topo com ações globais (busca, notificações, menu de perfil).
   - Área central de conteúdo com rolagem vertical independente.

2. **Área Reservada (Placeholders):**
   - Os componentes de layout (`Sidebar` e `Header`) devem ser definidos estruturalmente sem estilização visual definitiva, marcados como placeholders técnicos até a aprovação do design final.
   - As bordas e espaçamentos básicos devem seguir as diretrizes do Tailwind CSS e do Shadcn UI.
