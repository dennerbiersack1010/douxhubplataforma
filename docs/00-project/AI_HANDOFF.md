# AI Handoff

document_id: HANDOFF-001
last_updated: 2026-07-17
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

O usuário reportou que o login está "bugado". Correções de middleware e layout foram aplicadas nesta sessão, mas:

- **O bug específico não foi reproduzido com detalhamento** (sem stack trace, sem mensagem exata).
- **Deploy pendente** — as correções desta sessão ainda não chegaram à Vercel.
- Os commits de debug anteriores (outra IA) mostram que o problema estava provavelmente no fluxo post-login → membership resolution → redirect.

---

## Próxima ação para a IA que continuar

1. Confirmar que os arquivos desta sessão estão em `origin/main`.
2. Aguardar deploy da Vercel (automático após push).
3. **Pedir ao usuário a mensagem exata do erro de login** que ele vê.
4. Reproduzir em desenvolvimento com `npm run dev`.
5. Verificar logs do Supabase Auth em produção para identificar o ponto de falha.
6. Seguir o fluxo: signInWithPassword → post-login → redirect → middleware → cookie.

---

## Regras do projeto (obrigatórias)

- Ler `docs/00-project/PROJECT.md`, `CURRENT_STATE.md`, `NEXT_STEP.md`, `DECISIONS.md` antes de alterar.
- Não reconstruir funcionalidades já concluídas sem solicitação explícita.
- Não alterar Design System sem referência aprovada.
- Atualizar `CURRENT_STATE.md`, `CHANGELOG.md` e `ACTIVE_TASK.md` ao finalizar qualquer etapa.
- Não expor segredos em código, logs ou documentação.
- Commits pequenos e frequentes. Push após cada ciclo.
- Arquivo de regras completo: `AGENTS.md` na raiz do projeto.
