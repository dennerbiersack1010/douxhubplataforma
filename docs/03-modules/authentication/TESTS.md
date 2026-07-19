---
title: Testes da Autenticação
document_id: MOD-AUTH-006
version: 0.4.0
status: Em desenvolvimento
last_updated: 2026-07-19
owner: DouxHub
related_documents:
  - MODULE.md
  - STATES.md
  - BUSINESS_RULES.md
---

# Testes da Autenticação

## Validados localmente

- campos vazios e formatos inválidos;
- requisitos e confirmação de senha;
- mostrar e ocultar senha;
- estados de carregamento e bloqueio de envio duplicado;
- token inválido ou expirado;
- responsividade sem overflow horizontal nas viewports testadas;
- lint, TypeScript e build de produção.

## Validados no ambiente oficial

- conexão da aplicação publicada com o Supabase Auth;
- criação real de conta;
- estado de sucesso e orientação para confirmação do e-mail;
- remoção do usuário fictício após a validação.

## Validados no Supabase por suíte transacional

- usuário sem clínica, com uma clínica e com múltiplas clínicas;
- criação da primeira clínica e unidade;
- convites válido, expirado, revogado, duplicado e reutilizado;
- isolamento de leitura e escrita entre clínicas;
- alteração de função, ativação, desativação, contexto ativo e auditoria.

`005_post_login_resolution.sql` foi aprovado no Supabase oficial em 19/07/2026 com `post_login_resolution_ok`. O contrato validou sessão anônima recusada e os quatro destinos: nenhuma associação, somente associação inativa, uma associação ativa e múltiplas associações. Também confirmou ativação e limpeza coerente do contexto.

## Validação de desempenho estrutural

- resolução de vínculos reduzida de até três chamadas ao banco para uma função transacional;
- validação redundante do usuário removida do endpoint de pós-login;
- `router.push` seguido de `router.refresh` substituído por uma única navegação;
- Proxy e layouts migrados de `getUser()` remoto para `getClaims()` verificado;
- `Server-Timing` adicionado à API para medição no ambiente publicado.

A medição autenticada foi executada em `douxhub.space` com uma conta técnica temporária e vínculo único:

- primeira execução válida até `/dashboard`: 3,81 segundos;
- segunda execução após logout completo: 1,26 segundo;
- destino e conteúdo do Dashboard confirmados nas duas execuções;
- conta, clínica, vínculo, perfis e auditorias temporários removidos após o teste.

Tentativas anteriores com uma fixture criada diretamente no schema Auth foram descartadas porque ainda não continham toda a identidade interna exigida pelo Supabase; elas não mediram o produto e não entram nos resultados.

## Pendentes de validação remota

- confirmação por e-mail (depende de SMTP personalizado Resend configurado no Supabase);
- envio e conclusão real de recuperação (depende de SMTP personalizado Resend configurado no Supabase);
- redefinição real de senha;
- convite válido e aceite completo;
- validação manual autenticada desses cenários na interface publicada.

O módulo não pode ser considerado integralmente validado enquanto os cenários remotos permanecerem pendentes.

## Plano de testes de e-mail

Consultar `docs/08-integrations/resend/TESTS.md` para o plano detalhado dos testes de envio real, incluindo pré-requisitos, cenários obrigatórios, verificações de segurança e tabela de resultados.
