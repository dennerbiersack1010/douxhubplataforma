---
title: Estados da Autenticação
document_id: MOD-AUTH-004
version: 0.2.0
status: Validado
last_updated: 2026-07-19
owner: DouxHub
related_documents:
  - MODULE.md
  - FLOWS.md
---

# Estados da Autenticação

- **vazio:** formulários aguardam dados obrigatórios;
- **validação:** mensagens específicas aparecem junto aos campos;
- **carregando:** envio é bloqueado e o botão apresenta indicador;
- **resolvendo contexto:** após validar a senha, uma única operação segura determina o destino; o indicador permanece até a navegação começar;
- **sucesso:** cadastro orienta confirmação; redefinição e primeiro acesso encerram a sessão temporária e retornam ao Login;
- **erro:** falhas locais, credenciais inválidas, token inválido ou expirado e indisponibilidade do serviço possuem mensagens próprias;
- **sem clínica:** usuário autenticado segue para `/sem-clinica`;
- **um vínculo:** contexto é selecionado automaticamente;
- **múltiplos vínculos:** usuário segue para `/selecionar-perfil`;
- **sem permissão:** proxy e RLS impedem acesso às rotas ou aos dados protegidos;
- **offline:** não existe autenticação offline implementada;
- **pendente de sincronização e conflito:** não se aplicam ao estado atual, pois local-first ainda não foi implementado.
