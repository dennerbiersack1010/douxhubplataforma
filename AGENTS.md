# Instruções para Agentes de IA (AGENTS.md)

Este documento define regras obrigatórias de comportamento para qualquer agente de Inteligência Artificial que trabalhe neste projeto.

## Diretrizes de Trabalho

1. **Leitura de Contexto:** Antes de realizar qualquer alteração, leia obrigatoriamente os seguintes documentos em `docs/00-project/`:
   - [PROJECT.md](file:///C:/Users/denne/.gemini/antigravity-ide/scratch/douxhubplataforma/docs/00-project/PROJECT.md)
   - [CURRENT_STATE.md](file:///C:/Users/denne/.gemini/antigravity-ide/scratch/douxhubplataforma/docs/00-project/CURRENT_STATE.md)
   - [NEXT_STEP.md](file:///C:/Users/denne/.gemini/antigravity-ide/scratch/douxhubplataforma/docs/00-project/NEXT_STEP.md)
   - [DECISIONS.md](file:///C:/Users/denne/.gemini/antigravity-ide/scratch/douxhubplataforma/docs/00-project/DECISIONS.md)

2. **Integridade das Funcionalidades:** Não reconstrua, altere ou refatore funcionalidades dadas como concluídas sem uma solicitação explícita do usuário.

3. **Criação de Layouts:** Não invente telas, cores, botões ou paletas visuais. Toda interface deve seguir uma referência de design aprovada pelo usuário ou descrita no `DESIGN_SYSTEM.md`.

4. **Imagens e Ativos:** Use apenas imagens de referência existentes no repositório ou fornecidas pelo usuário. Não use placeholders genéricos que alterem a identidade visual premium.

5. **Atualização da Documentação:** Ao finalizar qualquer etapa de alteração ou desenvolvimento, você deve atualizar obrigatoriamente:
   - [CURRENT_STATE.md](file:///C:/Users/denne/.gemini/antigravity-ide/scratch/douxhubplataforma/docs/00-project/CURRENT_STATE.md)
   - [NEXT_STEP.md](file:///C:/Users/denne/.gemini/antigravity-ide/scratch/douxhubplataforma/docs/00-project/NEXT_STEP.md)
   - [CHANGELOG.md](file:///C:/Users/denne/.gemini/antigravity-ide/scratch/douxhubplataforma/docs/00-project/CHANGELOG.md)

6. **Preservação de Decisões:** Decisões listadas no [DECISIONS.md](file:///C:/Users/denne/.gemini/antigravity-ide/scratch/douxhubplataforma/docs/00-project/DECISIONS.md) são leis do projeto e não podem ser violadas.

7. **Continuidade de Estado:** Sempre dê continuidade a partir do último estado estável da branch atual do GitHub.

## Manutenção da Documentação

1. A documentação em `docs/` é a fonte oficial e viva da DouxHub. Código e documentação devem permanecer coerentes.
2. Antes de qualquer tarefa, leia os documentos obrigatórios de `docs/00-project/`, o `CHANGELOG.md` e os documentos da tela ou módulo afetado.
3. Não considere uma tarefa concluída antes de atualizar a documentação correspondente, o `CURRENT_STATE.md` e o `CHANGELOG.md`. Atualize o `NEXT_STEP.md` somente quando a etapa prioritária tiver sido encerrada.
4. Não apague histórico, duplique documentos, mova arquivos sem necessidade, exponha dados sensíveis ou registre como implementado algo apenas planejado.
5. Telas e módulos devem usar apenas os status padronizados e possuir metadados, versionamento semântico, linguagem profissional e estrutura preparada para futura consolidação em PDF.
6. Novas decisões permanentes devem ser registradas no `DECISIONS.md`, sem reutilizar números nem apagar decisões anteriores.
7. Siga o padrão completo definido em `docs/DOCUMENTATION_GUIDE.md`.
