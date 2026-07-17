---
title: Guia de Documentação da DouxHub
document_id: DOC-001
version: 1.0.0
status: Definido
last_updated: 2026-07-16
owner: DouxHub
related_documents:
  - 00-project/PROJECT.md
  - 00-project/CURRENT_STATE.md
  - 00-project/DECISIONS.md
  - 00-project/CHANGELOG.md
---

# Guia de Documentação da DouxHub

## Fonte oficial

O diretório `docs/` é a fonte oficial e viva do projeto. Código, banco, interfaces e documentação devem permanecer coerentes. Uma tarefa somente é finalizada quando os documentos afetados refletem o estado real.

## Estrutura

- `00-project`: visão, estado, próxima etapa, decisões e histórico geral;
- `01-design-system`: padrões visuais, componentes, responsividade e acessibilidade;
- `02-screens`: documentação individual das telas aprovadas;
- `03-modules`: objetivo, fluxos, dados, permissões, regras, estados e testes por módulo;
- `04-doux`: arquitetura, capacidades e limites da inteligência Doux;
- `05-security`: autenticação, multiempresa, RLS, auditoria e proteção de dados;
- `06-prompts`: instruções e versões de prompts pertencentes ao produto;
- `07-architecture`: arquitetura, local-first, sincronização, conflitos e backup;
- `08-integrations`: contratos, autenticação, dados, erros e comportamento offline por integração;
- `09-operations`: implantação, suporte, monitoramento e rotinas operacionais;
- `10-release-notes`: notas de versões publicadas.

Arquivos existentes não devem ser movidos sem necessidade. Antes de criar um documento, deve-se confirmar que não existe equivalente. Histórico válido não deve ser apagado nem duplicado.

## Metadados obrigatórios

Todo documento deve iniciar com frontmatter contendo `title`, `document_id`, `version`, `status`, `last_updated`, `owner` e `related_documents`. Identificadores são únicos e datas ou versões só mudam quando o conteúdo muda.

## Status padronizados

Os únicos status permitidos são: Planejado, Definido, Em desenvolvimento, Implementado, Validado, Em produção, Suspenso e Descontinuado. “Implementado” indica existência no código; “Validado” exige testes aplicáveis; “Em produção” exige publicação e conferência no ambiente final.

## Versionamento

- `0.x`: documento em definição;
- `1.0`: conteúdo aprovado;
- `1.x`: ajustes compatíveis;
- `2.0`: mudança estrutural importante.

## Atualização por tarefa

1. Ler `AGENTS.md`, os documentos de `00-project`, o changelog e os documentos relacionados.
2. Comparar a implementação com a documentação.
3. Atualizar a tela ou módulo afetado.
4. Atualizar `CURRENT_STATE.md` e `CHANGELOG.md`.
5. Atualizar `NEXT_STEP.md` somente quando a etapa prioritária for encerrada.
6. Registrar em `DECISIONS.md` apenas decisões permanentes, com contexto, decisão e consequências.
7. Não incluir segredos, conteúdo de `.env`, dados pessoais ou afirmações não validadas.

## Telas e módulos

Cada tela aprovada deve possuir pasta própria em `02-screens`. Cada módulo deve possuir pasta própria em `03-modules`. Devem ser criados somente os arquivos necessários, usando os nomes e conteúdos definidos pela governança do projeto.

Na fase inicial, `SCREEN.md` ou `MODULE.md` pode consolidar comportamento, responsividade, estados, acessibilidade e testes quando a separação gerar repetição. Arquivos especializados devem ser criados assim que o conteúdo crescer, possuir ciclo de aprovação próprio ou precisar ser reutilizado por outros documentos.

## Preparação para PDF

A escrita deve ser profissional, objetiva e independente de conversas com agentes. Siglas devem ser definidas no primeiro uso; tabelas e diagramas Mermaid devem ser usados apenas quando melhorarem a compreensão; imagens devem usar caminhos relativos; nomes e conceitos devem permanecer consistentes. A consolidação em PDF é futura e não faz parte desta etapa.
