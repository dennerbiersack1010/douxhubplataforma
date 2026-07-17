---
title: Movimento e Transições
document_id: DS-009
version: 0.1.0
status: Em desenvolvimento
last_updated: 2026-07-16
owner: DouxHub
related_documents:
  - DESIGN_SYSTEM.md
  - ../02-screens/intro/SCREEN.md
---

# Movimento e Transições

## Padrões existentes

- introdução audiovisual em tela cheia na rota principal;
- remoção instantânea do vídeo no frame final, revelando o Login já carregado;
- transições de cor e deslocamento de ícone entre 300 e 1.000 milissegundos nas telas públicas;
- indicador giratório apenas durante operações assíncronas.

## Regras

Movimento deve comunicar continuidade ou estado, sem atrasar ações. Novas animações exigem validação de legibilidade, desempenho e preferência por movimento reduzido antes de se tornarem padrão global.
