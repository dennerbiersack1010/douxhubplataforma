# Decisões de Projeto (Decisions)

As seguintes diretrizes e decisões arquiteturais e operacionais foram estabelecidas para o desenvolvimento do DouxHub:

* **DEC-001:** Toda tela será definida visualmente (com referências visuais, mockups ou protótipos aprovados) antes de qualquer início de implementação de código.
* **DEC-002:** Nenhuma inteligência artificial (IA) poderá inventar designs, esquemas de cores ou layouts de forma autônoma sem uma referência previamente definida e aprovada pelo usuário.
* **DEC-003:** A documentação mantida no repositório (diretório `docs/` e arquivos associados) é a única fonte da verdade (Single Source of Truth) para qualquer IA que venha a atuar no projeto.
* **DEC-004:** O CRM da plataforma DouxHub não utilizará o modelo tradicional de colunas Kanban (por exemplo: a fazer, em andamento, feito). Um modelo operacional customizado para o mercado de estética será definido na etapa comercial correspondente.
* **DEC-005:** A inteligência artificial da plataforma, batizada de **Doux**, será integrada a todas as áreas do sistema e poderá ser totalmente operada por meio de comandos de voz.
* **DEC-006:** Módulos e etapas dadas como concluídas na documentação e no histórico não devem ser reconstruídas ou reescritas sem solicitação explícita.
* **DEC-007:** A entrada pública da DouxHub terá uma introdução audiovisual curta e automática antes do Login. Ela será exibida uma vez por sessão (via sessionStorage), conduzindo o usuário diretamente ao Login ao seu término, sendo ignorada para usuários autenticados ou com redução de movimento ativada.
