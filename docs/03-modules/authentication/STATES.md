---
title: Estados da Autenticação
document_id: MOD-AUTH-004
version: 0.1.0
status: Implementado
last_updated: 2026-07-16
owner: DouxHub
related_documents:
  - MODULE.md
  - FLOWS.md
---

# Estados da Autenticação

- **vazio:** formulários aguardam dados obrigatórios;
- **validação:** mensagens específicas aparecem junto aos campos;
- **carregando:** envio é bloqueado e o botão apresenta indicador;
- **sucesso:** cadastro orienta confirmação; redefinição e primeiro acesso encerram a sessão temporária e retornam ao Login;
- **erro:** falhas locais, credenciais inválidas, token inválido ou expirado e indisponibilidade do serviço possuem mensagens próprias;
- **sem clínica:** usuário autenticado segue para `/sem-clinica`;
- **um vínculo:** contexto é selecionado automaticamente;
- **múltiplos vínculos:** usuário segue para `/selecionar-perfil`;
- **sem permissão:** proxy e RLS impedem acesso às rotas ou aos dados protegidos;
- **offline:** não existe autenticação offline implementada;
- **pendente de sincronização e conflito:** não se aplicam ao estado atual, pois local-first ainda não foi implementado.
