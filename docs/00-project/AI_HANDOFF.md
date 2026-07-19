# AI Handoff

document_id: HANDOFF-001
last_updated: 2026-07-18
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
3. post-login verifica memberships:
   - 0 memberships → `resolveNoActiveMembershipRedirect()` → `/configurar-clinica` ou `/sem-clinica`
   - 1 membership → `activateMembership()` → define cookie `douxhub_active_membership` → `/dashboard`
   - 2+ memberships → `/selecionar-perfil`
4. `router.push(redirectTo)` + `router.refresh()`

---

## Proteção de rotas (2 camadas)

**Camada 1 — proxy.ts** (Next.js 16, equivalente ao middleware.ts do Next.js 15):
- Chama `updateSession()` de `lib/supabase/middleware.ts`
- `updateSession()` usa `supabase.auth.getUser()` como única fonte de verdade
- Sem sessão + rota não-pública → redirect `/login`
- Com sessão + rota auth-only → redirect `/selecionar-perfil`
- Com sessão + sem contexto ativo + rota não-contextual → redirect `/selecionar-perfil`

**Camada 2 — layout.tsx** (Server Component):
- `app/(authenticated)/layout.tsx` e `app/(context)/layout.tsx`
- Ambos chamam `createClient()` + `getUser()` no servidor
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
- A migração ainda não foi aplicada e o teste ainda não foi executado no Supabase de produção.
- Não existe API por etapa, interface guiada ou conclusão transacional nova.
- Próximo ciclo: schemas Zod e API server-side para o rascunho; validar novamente antes de criar telas.

O problema anterior de Login foi resolvido pelos commits `db4642b` e `50663a5`. O callback passou a propagar cookies de sessão e o middleware deixou de redirecionar a API de pós-login para HTML. O commit `50663a5` foi publicado em produção; esse fluxo é histórico concluído e não é a tarefa ativa.

---

## Próxima ação para a IA que continuar

1. Ler os documentos do modelo conceitual em `docs/03-modules/clinic-access/`.
2. Projetar o contrato de persistência do onboarding guiado e retomável.
3. Definir migração aditiva, idempotência, RLS e compatibilidade com `create_initial_clinic`.
4. Criar testes de contrato antes de alterar a interface.
5. Preservar o Login e o fluxo de sessão existentes.

---

## Regras do projeto (obrigatórias)

- Ler `docs/00-project/PROJECT.md`, `CURRENT_STATE.md`, `NEXT_STEP.md`, `DECISIONS.md` antes de alterar.
- Não reconstruir funcionalidades já concluídas sem solicitação explícita.
- Não alterar Design System sem referência aprovada.
- Atualizar `CURRENT_STATE.md`, `CHANGELOG.md` e `ACTIVE_TASK.md` ao finalizar qualquer etapa.
- Não expor segredos em código, logs ou documentação.
- Commits pequenos e frequentes. Push após cada ciclo.
- Arquivo de regras completo: `AGENTS.md` na raiz do projeto.
