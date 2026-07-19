# AI Handoff

document_id: HANDOFF-001
last_updated: 2026-07-19
purpose: Permitir que outra IA continue o trabalho sem depender desta conversa.

---

## Contexto do projeto

**DouxHub** — plataforma SaaS de gestão para clínicas odontológicas.
- Stack: Next.js 16.2.10 (App Router), TypeScript, Tailwind CSS v4, Supabase, Resend.
- Repositório: `https://github.com/dennerbiersack1010/douxhubplataforma`
- Branch oficial: `main`
- Deploy: Vercel (projeto `douxhubplataforma`), domínio `douxhub.space`
- Supabase Project Ref: `ffailpkrmaxuqzbghsyi` (não expor credenciais)

---

## Estrutura de rotas

```
app/
  page.tsx                        → / (intro + redirect para /login)
  (public)/                       → login, cadastro, recuperar, redefinir, primeiro-acesso
  (authenticated)/                → rotas com sidebar (dashboard, agenda, etc.)
    layout.tsx                    → Server Component: valida sessão, redireciona para /login
    authenticated-shell.tsx       → Client Component: sidebar, header, mobile drawer
  (context)/                      → selecionar-perfil, sem-clinica, configurar-clinica
    layout.tsx                    → Server Component: valida sessão, sem sidebar
  api/
    auth/
      post-login/route.ts         → POST: resolve memberships, retorna redirectTo
      logout/route.ts             → POST: signOut + limpa cookie de contexto
    context/
      active/route.ts             → GET/POST: lista e ativa membership
```

---

## Fluxo de autenticação

1. Usuário preenche login-form.tsx → `supabase.auth.signInWithPassword()`
2. Se sucesso → chama `POST /api/auth/post-login`
3. post-login chama `resolve_post_login_context()` uma única vez:
   - 0 memberships → `resolveNoActiveMembershipRedirect()` → `/configurar-clinica` ou `/sem-clinica`
   - 1 membership → `activateMembership()` → define cookie `douxhub_active_membership` → `/dashboard`
   - 2+ memberships → `/selecionar-perfil`
4. `router.replace(redirectTo)` inicia uma única navegação.

---

## Proteção de rotas (2 camadas)

**Camada 1 — proxy.ts** (Next.js 16, equivalente ao middleware.ts do Next.js 15):
- Chama `updateSession()` de `lib/supabase/middleware.ts`
- `updateSession()` usa `supabase.auth.getClaims()` para verificar o JWT
- Sem sessão + rota não-pública → redirect `/login`
- Com sessão + rota auth-only → redirect `/selecionar-perfil`
- Com sessão + sem contexto ativo + rota não-contextual → redirect `/selecionar-perfil`

**Camada 2 — layout.tsx** (Server Component):
- `app/(authenticated)/layout.tsx` e `app/(context)/layout.tsx`
- Ambos chamam `createClient()` + `getClaims()` no servidor
- Sem usuário → `redirect('/login')`

---

## Cookie de contexto

Nome: `douxhub_active_membership`
Exportado de: `lib/clinic-context.ts`
Configuração: httpOnly, sameSite: lax, secure em produção, maxAge 12h

---

## Banco de dados (Supabase)

Tabelas no schema `public` (todas com RLS):
- `clinics`, `clinic_units`, `clinic_memberships`
- `clinic_invitations`, `roles`
- `user_profiles`, `user_active_contexts`
- `audit_logs`

Migrações em: `supabase/migrations/`
Testes SQL em: `supabase/tests/`

---

## SMTP / E-mail

- Provedor: Resend
- Domínio de envio: `auth.douxhub.space` (verificado)
- From: `DouxHub <nao-responda@auth.douxhub.space>`
- SMTP ativo no Supabase Auth: smtp.resend.com:465
- Rate limit: 100 e-mails/hora
- Status: ✅ testado — confirmação e recuperação entregues

---

## Estado atual da tarefa

### Reestruturação da fundação iniciada em 18/07/2026

- O projeto oficial está sincronizado em `main`; a pasta antiga conflitante não deve ser usada.
- O checkpoint inicial da reestruturação foi enviado no commit `3a64785`.
- A Etapa 1 definiu documentalmente conta, usuário da clínica, função, permissão, perfil de acesso, profissional, unidades e vínculos.
- O modelo atual de `clinic_memberships` permanece implementado e em produção; o modelo novo ainda não possui migração nem código.
- A próxima etapa é o onboarding guiado. Antes da interface, definir persistência de progresso, idempotência, migração aditiva e RLS.
- Não refazer Login, callback, sessão, Resend ou SMTP sem erro reproduzido.

### Etapa 2 — estado do onboarding

- Ciclo 1 implementou no repositório a persistência retomável em `clinic_onboarding_progress`.
- Migração: `20260718120000_clinic_onboarding_progress.sql`.
- Teste: `003_clinic_onboarding_progress.sql`.
- A migração foi aplicada no Supabase oficial em 19/07/2026.
- O teste foi aprovado com `clinic_onboarding_progress_ok`; seus dados artificiais foram revertidos.
- A aplicação ocorreu pelo SQL Editor. Não inserir uma linha artificial no histórico de migrações; reconciliar o histórico antes de adotar Supabase CLI nesse projeto.
- Não existe interface guiada ou conclusão transacional nova; a API por etapa foi implementada no ciclo seguinte.
- Próximo ciclo: schemas Zod e API server-side para o rascunho; validar novamente antes de criar telas.

Atualização do Ciclo 2:

- Schemas e API foram implementados em `lib/clinic-onboarding.ts` e `app/api/clinic-onboarding/route.ts`.
- A nova rota passou no build e ainda não é consumida pela interface.
- O portão obrigatório do banco foi concluído no projeto `ffailpkrmaxuqzbghsyi`.
- A primeira execução do teste revelou literais `integer` incompatíveis com o parâmetro `smallint`; as três chamadas foram corrigidas com conversão explícita e o teste passou na execução seguinte.
- Integridade documental, TypeScript e ESLint foram aprovados; o lint mantém quatro avisos preexistentes sobre `<img>`.
- Próximo ciclo: interface técnica guiada, retomada e confirmação de cancelamento; conclusão transacional fica para ciclo separado.

Atualização do Ciclo 3:

- `/configurar-clinica` agora usa uma interface técnica guiada com cinco etapas de dados e uma sexta etapa de preparação.
- A tela consulta, inicia/retoma, salva e cancela pela API já validada.
- Etapas salvas podem ser revisadas; etapas futuras ficam desabilitadas.
- O cancelamento exige confirmação em duas ações e oferece novo início após preservar o histórico.
- O build passou com 35 rotas/páginas; não houve teste manual autenticado.
- A conclusão transacional continua fora da interface e é a próxima unidade lógica.

Atualização do Ciclo 4:

- `20260719120000_complete_clinic_onboarding.sql` implementa a conclusão transacional e idempotente.
- `PUT /api/clinic-onboarding` e a etapa 6 da interface concluem o fluxo, ativam o vínculo e seguem para `/dashboard`.
- A migração foi aplicada no Supabase oficial pelo SQL Editor; não inserir histórico artificial da CLI.
- `004_clinic_onboarding_completion.sql` foi aprovado com `clinic_onboarding_completion_ok` após corrigir uma referência ambígua detectada na primeira execução.
- Commit funcional: `feefa06`, enviado para `origin/main`.
- Deployment: `dpl_DVEs9VDxi2Tb4vhiiuMboftnwGX7`, estado `READY`, target `production`, com alias `douxhub.space`.
- Verificação pública aprovada para Login, proteção de `/configurar-clinica` e `401` sem cache na API sem sessão.
- A Etapa 3, Ciclo 1 foi concluída no checkpoint atual.

### Otimização do Login e Etapa 3, Ciclo 1

- `20260719180000_optimize_post_login_resolution.sql` foi aplicada e aprovada com `post_login_resolution_ok`.
- A resolução pós-login agora usa uma chamada ao banco e uma navegação; o endpoint publica `Server-Timing`.
- `20260719190000_clinic_access_profiles_foundation.sql` foi aplicada no Supabase oficial.
- Cinco tabelas novas representam usuários, funções, atribuições, unidades e perfis sem substituir `clinic_memberships`.
- O teste `006_clinic_access_profiles_foundation.sql` foi aprovado com rollback.
- Commits: `4cb08f4` (Login) e `38ee817` (Etapa 3), enviados para `origin/main`.
- Deployment: `dpl_A2fbaG7Nyyaw4BzRLq7tP6CYoVdf`, `READY`, produção, alias `douxhub.space`.
- Login autenticado medido em 3,81 s no caminho frio e 1,26 s após logout; fixture removida integralmente.
- Próximo ciclo: catálogo e matriz de permissões; não migrar seleção de perfil antes do portão de equivalência.

### Etapa 3, Ciclo 2

- `20260719200000_clinic_permissions_foundation.sql` foi aplicada no Supabase oficial.
- Catálogo, matriz por função, exceções por perfil e cálculo efetivo foram implementados sem alterar a autoridade de `clinic_memberships`.
- `007_clinic_permissions_foundation.sql` foi aprovado com `clinic_permissions_foundation_ok` e rollback integral.
- Commit `2f0389f` enviado para `origin/main` e publicado no deployment `dpl_4SBuYeu6W7M3NxF7gNqLVvL5kCz2` (`READY`).
- `douxhub.space` aprovou o Login e a proteção anônima de `/configuracoes/equipe`.
- Próximo ciclo: leitura e equivalência dos novos perfis; não migrar `user_active_contexts`, rotas ou menus antes do portão documentado.

### Etapa 3, Ciclo 3

- `20260719210000_access_profile_equivalence_gate.sql` foi aplicada no Supabase oficial.
- As funções seguras listam perfis próprios disponíveis, com permissões efetivas, e comparam cada vínculo legado com sua estrutura sincronizada.
- `GET /api/access-profiles` responde sem cache e bloqueia divergências com `409`, sem fallback permissivo.
- `008_access_profile_equivalence_gate.sql` foi aprovado com `access_profile_equivalence_gate_ok` e rollback integral.
- ESLint, TypeScript e build foram aprovados; a rota `/api/access-profiles` compila como dinâmica.
- `clinic_memberships` e `user_active_contexts` permanecem como autoridade operacional.
- Commits `cd84447` e `18b0767` enviados para `origin/main`.
- Deployment `dpl_8CKaEoSvJbCzGBxESKTYchoWFhU3`, `READY`, produção, aliases `douxhub.space` e `douxhubplataforma.vercel.app`.
- Produção aprovada: API anônima `401` sem cache, Login disponível e rota de equipe redirecionada para autenticação.
- Próximo ciclo: adoção controlada do perfil no contexto ativo, mantendo vínculo de origem, auditoria e caminho seguro de retorno.

O problema anterior de Login foi resolvido pelos commits `db4642b` e `50663a5`. O callback passou a propagar cookies de sessão e o middleware deixou de redirecionar a API de pós-login para HTML. O commit `50663a5` foi publicado em produção; esse fluxo é histórico concluído e não é a tarefa ativa.

---

## Próxima ação para a IA que continuar

1. Ler `ACCESS_PROFILES.md`, `FLOWS.md` e `NEXT_STEP.md`.
2. Projetar a adoção dual do perfil no contexto ativo sem remover o vínculo de origem.
3. Criar testes de seleção, troca, revogação, isolamento, repetição e rollback lógico antes da interface.
4. Exigir `equivalence_ready` e falhar de forma fechada diante de qualquer divergência.
5. Manter visual definitivo, profissionais e módulos de negócio fora do ciclo.

---

## Regras do projeto (obrigatórias)

- Ler `docs/00-project/PROJECT.md`, `CURRENT_STATE.md`, `NEXT_STEP.md`, `DECISIONS.md` antes de alterar.
- Não reconstruir funcionalidades já concluídas sem solicitação explícita.
- Não alterar Design System sem referência aprovada.
- Atualizar `CURRENT_STATE.md`, `CHANGELOG.md` e `ACTIVE_TASK.md` ao finalizar qualquer etapa.
- Não expor segredos em código, logs ou documentação.
- Commits pequenos e frequentes. Push após cada ciclo.
- Arquivo de regras completo: `AGENTS.md` na raiz do projeto.
