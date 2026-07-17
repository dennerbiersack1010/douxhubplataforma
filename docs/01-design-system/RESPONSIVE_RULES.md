---
title: Regras de Responsividade
document_id: DS-003
version: 0.1.0
status: Em desenvolvimento
last_updated: 2026-07-16
owner: DouxHub
related_documents:
  - DESIGN_SYSTEM.md
  - LAYOUT_RULES.md
---

# Regras de Responsividade (Responsive Rules)

1. **Visualização Mobile:**
   - A sidebar lateral é oculta em telas menores que `lg` (1024px).
   - Menu hambúrguer ou barra de navegação inferior preparada no header para abrir a gaveta (drawer/sheet) de navegação mobile.
   - Todo formulário ou tabela deve ajustar-se automaticamente para telas menores com rolagem horizontal interna ou quebra de fluxo apropriada.

2. **Visualização Desktop:**
   - Sidebar sempre visível com largura fixa.
   - Grid do painel principal se expande para ocupar a largura disponível, respeitando margens máximas para evitar esticamento excessivo em monitores ultra-wide.
