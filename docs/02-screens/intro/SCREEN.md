---
title: Tela de Introdução Audiovisual
document_id: SCR-INTRO-001
version: 1.1.0
status: Em produção
last_updated: 2026-07-16
owner: DouxHub
related_documents:
  - ../login/SCREEN.md
  - ../../03-modules/authentication/FLOWS.md
  - ../../00-project/DECISIONS.md
---

# Tela de Introdução Audiovisual

## Objetivo

Apresentar a marca DouxHub em tela cheia sempre que a rota principal `/` for acessada e entregar o usuário ao Login como continuidade visual do frame final.

## Conteúdo e hierarquia

O vídeo `/intro/doux-intro.mp4` ocupa toda a viewport, sem textos, controles ou botões sobrepostos. O Login permanece montado e carregado abaixo do vídeo.

## Comportamento

- reprodução automática, silenciosa e inline;
- nenhum registro em `sessionStorage`: todo acesso direto a `/` reinicia a introdução;
- ao término, o evento `ended` remove o vídeo e a URL passa a `/login` com `history.replaceState`, sem recarregar a página;
- ouvintes nativos e uma verificação idempotente nos últimos 20 milissegundos atuam como redundância para navegadores que não entreguem `ended` de forma confiável ou terminem a mídia antes da hidratação da interface;
- em falha de mídia, o Login é revelado para não bloquear o acesso;
- ativos `.mp4` e `.webm` são públicos e não passam pela proteção de rotas.

## Responsividade e acessibilidade

O vídeo usa preenchimento por recorte proporcional em qualquer viewport. O atributo silencioso viabiliza autoplay e evita áudio inesperado. Não há interação obrigatória.

## Critérios de aprovação

- acesso direto à raiz inicia o vídeo;
- o frame final e o fundo do Login não exibem flash, tela intermediária ou carregamento de rota;
- a URL final é `/login`;
- o fluxo funciona em desktop e mobile.
