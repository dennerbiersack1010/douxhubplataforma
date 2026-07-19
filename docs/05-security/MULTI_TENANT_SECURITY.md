---
title: Segurança Multiempresa e Permissões Iniciais
document_id: SEC-001
version: 0.10.0
status: Validado
last_updated: 2026-07-19
owner: DouxHub
related_documents:
  - ../03-modules/authentication/MODULE.md
  - ../00-project/CURRENT_STATE.md
---

# Segurança Multiempresa e Permissões Iniciais

## Escopo

Esta etapa cobre somente o ambiente das clínicas. Não existem funções, tabelas ou permissões do futuro DouxHub Control.

## Isolamento

- Todas as tabelas expostas ao cliente possuem Row Level Security habilitado.
- O usuário visualiza apenas clínicas nas quais possui vínculo ativo.
- `clinic_owner` e `clinic_admin` podem consultar membros, unidades, convites e auditoria da própria clínica.
- `clinic_employee` não possui permissão para gerenciar vínculos ou convites.
- Operações sensíveis de vínculo, convite e troca de contexto são feitas por funções `security definer` com validação de `auth.uid()` e e-mail do JWT.
- O frontend nunca recebe nem utiliza `SUPABASE_SERVICE_ROLE_KEY`.
- A chave service role é opcional e, quando configurada, é lida somente pela rota server-side responsável por solicitar ao Supabase Auth o envio do convite.
- O cookie `douxhub_active_membership` é `HttpOnly`, `SameSite=Lax` e `Secure` em produção. Ele melhora o roteamento, mas não concede autorização. Toda consulta continua sujeita ao RLS.

## Funções

| Função | Estado | Capacidade inicial |
|---|---|---|
| `clinic_owner` | Ativa | Gerenciar clínica, administradores, colaboradores e convites. |
| `clinic_admin` | Ativa | Gerenciar dados básicos, colaboradores e convites de colaborador da própria clínica. |
| `clinic_employee` | Ativa | Acesso limitado aos dados liberados por políticas futuras. |
| `receptionist`, `professional`, `commercial`, `financial`, `stock_manager` | Preparadas e inativas | Sem atribuição ou permissões nesta etapa. |

Não foram criadas `platform_owner`, `platform_admin` ou `platform_support`.

## Convites

1. Um proprietário ou administrador gera um token criptograficamente aleatório no servidor.
2. O banco armazena apenas SHA-256 do token.
3. O convite possui destinatário, clínica, função, validade e estado.
4. O Supabase Auth autentica o convidado e retorna para `/primeiro-acesso`.
5. `accept_clinic_invitation` compara o e-mail autenticado com o destinatário, verifica token, prazo e uso anterior.
6. O vínculo é criado ou reativado somente após essas validações.

Sem `SUPABASE_SERVICE_ROLE_KEY` server-side, o convite é registrado e a URL de redirecionamento é preparada, mas o envio automático pelo Supabase Auth não ocorre.

## Auditoria mínima

São registrados:

- `clinic.created`;
- `invitation.created`;
- `invitation.accepted`;
- `membership.role_changed`;
- `membership.activated`;
- `membership.deactivated`;
- `context.switched`.

## Aplicação e testes

1. As migrações `20260716213000_multi_tenant_clinics.sql`, `20260716233000_clinic_access_expansion.sql`, `20260716234500_fix_invitation_expiration_ambiguity.sql` e `20260716235000_fix_invitation_crypto_search_path.sql` foram aplicadas no projeto Supabase de produção.
2. `001_multi_tenant_contract.sql` retornou `multi_tenant_contract_ok`.
3. `002_clinic_access_flows.sql` retornou `clinic_access_flows_ok` e desfez os dados fictícios ao final.
4. A suíte comprovou isolamento de seleção e alteração entre clínicas, hierarquia das funções, proteção do proprietário, destinatário divergente, convite válido, expirado, revogado e reutilizado, zero/um/múltiplos vínculos, contexto ativo e auditoria.
5. Permanece pendente a validação manual autenticada na interface publicada e a entrega ponta a ponta dos links reais de e-mail.

## Proteção de rotas em camadas (corrigido em 17/07/2026)

O sistema de proteção de rotas foi corrigido e opera em três camadas independentes:

### Camada 1 — Proxy (borda)

O `proxy.ts` intercepta todas as requisições antes de chegarem ao React. A função `updateSession()` em `lib/supabase/middleware.ts` valida o JWT via `supabase.auth.getClaims()` e redireciona para `/login` quando não há identidade verificada. Não usa presença de cookie como atalho.

### Camada 2 — Layout server-side

O `app/(authenticated)/layout.tsx` é um Server Component que valida a sessão no servidor antes de renderizar qualquer conteúdo. Se não houver usuário, executa `redirect('/login')` imediatamente.

### Camada 3 — Banco de dados (RLS)

As tabelas vigentes, as cinco tabelas do Ciclo 1 e as três tabelas do Ciclo 2 possuem Row Level Security habilitado. Políticas revalidadas em 19/07/2026:
- Nenhuma tabela com política para o role `anon`.
- Todas as operações restritas ao role `authenticated`.
- Isolamento multiclínica garantido pelas condições das políticas (filtragem por `user_id` e `clinic_id`).

## Fundação da Etapa 3

`clinic_users`, `clinic_roles`, `clinic_user_role_assignments`, `clinic_user_units` e `access_profiles` preservam a fronteira de `clinic_id` com chaves estrangeiras compostas. Usuários autenticados possuem somente leitura e enxergam registros próprios ou gerenciáveis pelo contrato atual. O teste `006_clinic_access_profiles_foundation.sql` aprovou isolamento, ausência de escrita direta e sincronização retrocompatível.

A seleção de perfil ainda deverá adotar a nova entidade e validar permissões efetivas no servidor e no RLS. Permissões de interface nunca substituirão essas verificações.

## Fundação de permissões da Etapa 3

`permission_catalog`, `clinic_role_permissions` e `access_profile_permission_overrides` preservam catálogo global estável e fronteiras por clínica e perfil. Usuários autenticados possuem somente leitura. O cálculo efetivo aceita apenas perfil ativo da própria conta, valida clínica, função, unidade e atribuições e aplica negação explícita antes de concessões. O teste `007_clinic_permissions_foundation.sql` aprovou isolamento, escopos, conflito e ausência de escrita direta.

## Portão de equivalência da Etapa 3

As funções do Ciclo 3 derivam a conta exclusivamente de `auth.uid()` e não aceitam identificador de usuário do navegador. Cada vínculo é comparado com usuário da clínica, função, perfil, unidade, escopo e estados. Qualquer divergência torna o snapshot indisponível para adoção e a API responde de forma fechada. O teste `008_access_profile_equivalence_gate.sql` aprovou isolamento entre contas, inativação, manipulação de identificadores e rollback integral.

- modo suporte e perfis globais do DouxHub Control;
- arquitetura local-first, sincronização, conflitos e proteção do banco local;
- política definitiva de backup e restauração;
- política de retenção, criptografia e acesso a imagens, vídeos e documentos;
- processo formal de resposta a incidentes e auditoria operacional.

Esses tópicos permanecem planejados e deverão receber definição e validação próprias antes da implementação.
