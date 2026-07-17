---
title: Estados das Interfaces de Clínicas
document_id: MOD-CLINIC-005
version: 0.1.0
status: Implementado
last_updated: 2026-07-16
owner: DouxHub
related_documents:
  - MODULE.md
  - FLOWS.md
---

# Estados das Interfaces de Clínicas

- **Vazio:** usuário novo recebe o formulário de primeira clínica; usuário com vínculo apenas inativo recebe o estado sem clínica ativa.
- **Carregando:** formulários bloqueiam novo envio enquanto a operação server-side está em andamento.
- **Sucesso:** criação e seleção encaminham ao Dashboard técnico; convites e alterações atualizam a listagem temporária.
- **Erro:** mensagem segura é exibida sem revelar detalhes internos, token ou credenciais.
- **Sem permissão:** acesso direto à equipe por colaborador é redirecionado para o Dashboard; operações no banco também são recusadas.
- **Pendente:** convite pendente pode ser aceito ou revogado até a validade.
- **Expirado, revogado ou aceito:** convite não pode ser reutilizado.
- **Offline:** não há suporte offline nesta etapa; a operação informa indisponibilidade sem assumir sucesso.
- **Pendente de sincronização e conflito:** não se aplicam enquanto o módulo for exclusivamente remoto.

Todos os visuais internos são temporários e explicitamente identificados como técnicos.
