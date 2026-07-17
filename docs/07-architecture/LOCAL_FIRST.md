---
title: Arquitetura Local-first e Sincronização
document_id: ARC-002
version: 0.1.0
status: Planejado
last_updated: 2026-07-16
owner: DouxHub
related_documents:
  - ARCHITECTURE.md
  - ../00-project/PROJECT.md
---

# Arquitetura Local-first e Sincronização

O funcionamento local-first não está implementado. A aplicação atual depende dos serviços remotos configurados.

Antes da implementação devem ser definidos armazenamento local, criptografia, escopo offline por módulo, identificação de versões, fila de sincronização, tentativas, resolução de conflitos, exclusões, backup, restauração e comportamento de imagens, vídeos e documentos. Nenhuma dessas capacidades deve ser anunciada como disponível antes de testes de perda de conexão, conflito e recuperação.
