---
title: Fluxos de Acesso às Clínicas
document_id: MOD-CLINIC-002
version: 0.2.0
status: Implementado
last_updated: 2026-07-16
owner: DouxHub
related_documents:
  - MODULE.md
  - BUSINESS_RULES.md
  - STATES.md
---

# Fluxos de Acesso às Clínicas

## Pós-login

1. O servidor consulta vínculos ativos do usuário autenticado.
2. Sem vínculo e sem histórico de vínculo, encaminha para `/configurar-clinica`.
3. Sem vínculo ativo, mas com vínculo inativo, encaminha para `/sem-clinica`.
4. Com um vínculo ativo, grava o contexto seguro e encaminha para `/dashboard`.
5. Com mais de um vínculo ativo, encaminha para `/selecionar-perfil`.

## Primeira clínica

1. O usuário informa clínica, responsável, e-mail, telefone opcional e primeira unidade.
2. A rota server-side valida a sessão e os dados.
3. `create_initial_clinic` recusa usuários que já possuam vínculo ativo.
4. Em uma transação, cria clínica, unidade, perfil, vínculo de proprietário e contexto ativo.
5. Registra auditorias de criação da clínica e da unidade e encaminha para `/dashboard`.

## Convite e primeiro acesso

1. Um gestor informa nome, e-mail e função permitida.
2. O servidor gera token aleatório; o banco guarda somente o hash.
3. O destinatário conclui a autenticação em `/primeiro-acesso` e apresenta o token do vínculo.
4. O banco confere destinatário, estado, validade e uso anterior.
5. O vínculo só é criado ou reativado após todas as validações.
6. Convites expirados, revogados, duplicados ou já aceitos são recusados.

## Gestão de equipe

`/configuracoes/equipe` exige contexto ativo e função gestora. Proprietários gerenciam administradores e colaboradores; administradores gerenciam somente colaboradores. A rota antiga `/administracao-clinica` redireciona para a rota protegida atual.

## Troca de contexto

A seleção usa uma operação server-side sujeita ao RLS, atualiza `user_active_contexts`, registra auditoria, renova o cookie `HttpOnly` e encaminha para `/dashboard`.

## Fluxo-alvo de perfil

Após a evolução planejada, todo novo Login concluído seguirá para “Quem está acessando?”. O servidor listará somente perfis ativos da conta, validará função, unidade e permissões na seleção e registrará o perfil ativo. Esse fluxo está definido, mas ainda não implementado; o comportamento atual de seleção automática para vínculo único permanece em produção.
