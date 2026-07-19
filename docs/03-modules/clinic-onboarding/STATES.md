---
title: Estados do Onboarding
document_id: MOD-ONBOARD-004
version: 0.1.0
status: Definido
last_updated: 2026-07-18
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

Somente os estados de persistência e cancelamento possuem fundação de banco nesta versão. A interface ainda não foi implementada.

