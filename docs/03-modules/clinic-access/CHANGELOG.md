---
title: Alterações do Módulo de Acesso às Clínicas
document_id: MOD-CLINIC-008
version: 0.1.0
status: Implementado
last_updated: 2026-07-16
owner: DouxHub
related_documents:
  - MODULE.md
  - ../../00-project/CHANGELOG.md
---

# Alterações do Módulo de Acesso às Clínicas

## [0.1.0] - 16/07/2026

### Adicionado

- primeira clínica e unidade;
- contexto pós-login para zero, um ou múltiplos vínculos;
- administração técnica de membros e convites;
- rota protegida `/configuracoes/equipe`;
- revogação de convite e hierarquia entre proprietário, administrador e colaborador;
- suíte transacional de fluxos multiempresa.

### Segurança

- RLS e funções server-side para isolamento, convites, vínculos e contexto;
- hash de tokens, destinatário validado e prevenção de duplicidade, expiração e reutilização;
- correções de resolução de validade e do `search_path` criptográfico.
