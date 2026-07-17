---
title: Decisões Permanentes do Projeto
document_id: PRJ-004
version: 0.3.0
status: Definido
last_updated: 2026-07-16
owner: DouxHub
related_documents:
  - PROJECT.md
  - ../DOCUMENTATION_GUIDE.md
---

# Decisões de Projeto (Decisions)

As seguintes diretrizes e decisões arquiteturais e operacionais foram estabelecidas para o desenvolvimento da DouxHub.

## DEC-001 — Aprovação visual antes da implementação

**Contexto:** Telas implementadas sem referência aprovada geram retrabalho e inconsistência.

**Decisão:** Toda tela deve ser definida visualmente por referência, mockup ou protótipo aprovado antes do início da implementação.

**Consequências:** Interfaces sem aprovação permanecem explicitamente técnicas ou temporárias e não podem ser tratadas como design definitivo.

## DEC-002 — Proibição de design autônomo por inteligência artificial

**Contexto:** A identidade visual da DouxHub deve permanecer sob direção do usuário.

**Decisão:** Nenhuma inteligência artificial pode inventar layouts, esquemas de cores ou padrões visuais sem referência previamente definida e aprovada.

**Consequências:** Novos padrões visuais exigem solicitação e validação antes de serem incorporados ao Design System.

## DEC-003 — Documentação como fonte oficial

**Contexto:** Diferentes agentes e etapas precisam compartilhar o mesmo estado do projeto.

**Decisão:** A documentação versionada no repositório é a fonte oficial da DouxHub.

**Consequências:** Código e documentação devem permanecer coerentes, e afirmações não registradas não substituem o estado documentado.

## DEC-004 — CRM sem Kanban tradicional

**Contexto:** O fluxo comercial de clínicas de estética exige um modelo operacional próprio.

**Decisão:** O CRM não utilizará o modelo tradicional de colunas Kanban, como “a fazer”, “em andamento” e “feito”.

**Consequências:** O modelo comercial deverá ser definido e aprovado especificamente na etapa do módulo Comercial.

## DEC-005 — Doux integrada e operável por voz

**Contexto:** A inteligência artificial é um diferencial transversal planejado para a plataforma.

**Decisão:** A inteligência artificial Doux será integrada às áreas do sistema e preparada para operação por comandos de voz.

**Consequências:** Escopo, permissões, privacidade, confirmações e auditoria devem ser definidos antes da implementação de cada capacidade.

## DEC-006 — Preservação de etapas implementadas

**Contexto:** Reconstruções não solicitadas podem remover comportamentos validados e quebrar continuidade.

**Decisão:** Módulos e etapas registrados como implementados não devem ser reconstruídos ou reescritos sem solicitação explícita.

**Consequências:** Alterações devem ser incrementais, preservar o histórico e respeitar decisões e referências existentes.

## DEC-007 — Introdução audiovisual na entrada pública

**Contexto:** A entrada da plataforma foi definida como uma continuidade visual entre vídeo e Login.

**Decisão:** A rota `/` reproduz `doux-intro.mp4` em tela cheia, sem som, e revela imediatamente o Login ao final ou em caso de erro.

**Consequências:** O Login deve permanecer carregado sob o vídeo, o acesso direto à raiz deve sempre reproduzir a introdução e a transição não deve apresentar atraso ou recarga perceptível.

## DEC-008 — Documentação viva e preparada para publicação

**Contexto:** A continuidade do projeto exige uma fonte oficial coerente com o código e preparada para futura consolidação em documentação profissional.

**Decisão:** A documentação versionada em `docs/` é a fonte oficial da DouxHub. Toda tarefa deve atualizar os documentos afetados, usar metadados e status padronizados e preservar histórico, decisões e referências aprovadas.

**Consequências:** Código e documentação passam a ser conferidos em conjunto. Uma tarefa não é considerada finalizada enquanto o estado real não estiver documentado. Nenhum PDF será gerado nesta etapa.
