---
title: Estados do Onboarding
document_id: MOD-ONBOARD-004
version: 0.3.0
status: Implementado
last_updated: 2026-07-19
owner: DouxHub
related_documents:
  - MODULE.md
  - FLOWS.md
---

# Estados do Onboarding

- **Não iniciado:** não existe rascunho ativo.
- **Em andamento:** existe rascunho `in_progress` e uma etapa atual entre 1 e 6.
- **Etapa salva:** dados validados foram persistidos e podem ser retomados.
- **Carregando:** leitura ou gravação em curso; novo envio deve ser bloqueado.
- **Erro de validação:** campos inválidos não alteram o rascunho.
- **Conflito de ordem:** tentativa de pular uma etapa é recusada.
- **Cancelado:** rascunho preservado sem poder receber novas gravações.
- **Concluído:** clínica e unidade foram associadas ao rascunho finalizado.
- **Indisponível:** falha remota não deve ser apresentada como sucesso.

Os estados de persistência, retomada, navegação, erro, preparação e cancelamento possuem interface técnica implementada. O estado `Concluído` continua planejado para a operação transacional de criação da clínica.

## Estados da interface

- **Carregamento inicial:** consulta o rascunho antes de liberar os formulários.
- **Etapa futura:** controle visível e desabilitado até o avanço do servidor.
- **Etapa revisável:** etapa já alcançada pode ser aberta e salva novamente.
- **Salvando:** bloqueia navegação, novo envio e cancelamento concorrente.
- **Preparado:** etapa 6 informa o limite do ciclo e oferece revisão.
- **Confirmação de cancelamento:** exige voltar ou confirmar explicitamente.
- **Rascunho cancelado:** informa preservação do histórico e oferece novo início.

## Estados da API

- **Não autorizado:** sessão ausente ou inválida recebe `401`.
- **Não disponível para a conta:** vínculo ativo recebe `409`.
- **Dados inválidos:** envelope inválido recebe `400`; campos da etapa recebem `422` com caminhos e códigos seguros.
- **Fora de ordem:** recebe `409` sem alterar o rascunho.
- **Indisponível:** dependência de banco ausente ou falha operacional recebe `503`.
