# Active Task

document_id: TASK-002
last_updated: 2026-07-18
status: Em desenvolvimento

---

# Reestruturação da fundação da plataforma

## Objetivo

Reestruturar a fundação conceitual da DouxHub antes da construção dos módulos de negócio, separando conta autenticada, clínica, unidade, usuário da clínica, função, perfil de acesso, profissional e vínculo. A experiência futura será organizada por perfis, jornadas, trilhas e cards operacionais, sem tratar a DouxHub como um dashboard administrativo genérico.

## Estado encontrado

- Repositório oficial confirmado em `https://github.com/dennerbiersack1010/douxhubplataforma`.
- Branch oficial `main`, sincronizada com `origin/main` no início desta tarefa.
- Projeto Vercel oficial `douxhubplataforma`, domínio `douxhub.space` e vínculo local com o Project ID oficial confirmados.
- Projeto Supabase oficial confirmado pelo Project Ref documentado e pela variável pública local correspondente, sem registrar valores secretos neste documento.
- Login, callback de autenticação, persistência de sessão, cadastro, recuperação de senha, Resend e SMTP estão corrigidos e em produção; não devem ser refeitos sem erro comprovado.
- A interface interna, a seleção de perfil e a administração da clínica são técnicas e temporárias.
- Nenhum módulo de negócio está implementado; as rotas internas atuais são placeholders conscientes.

## Estrutura atual

- `auth.users` representa a conta autenticada.
- `user_profiles` mantém dados pessoais básicos da conta.
- `clinics` representa a empresa contratante.
- `clinic_units` representa uma unidade pertencente à clínica.
- `roles` contém funções globais pré-semeadas.
- `clinic_memberships` vincula uma conta a uma clínica, uma unidade opcional e uma única função.
- `clinic_invitations` controla convites por e-mail com hash de token, validade e aceite.
- `user_active_contexts` e o cookie HttpOnly de contexto registram o vínculo ativo.
- `audit_logs` registra ações sensíveis de clínica, unidade, vínculo, convite e contexto.
- A criação inicial usa a função transacional `create_initial_clinic`.
- A autorização existente combina validação server-side, funções PostgreSQL e Row Level Security (RLS).

## Problemas estruturais

1. `clinic_memberships` possui unicidade por `(user_id, clinic_id)` e armazena somente um `role_id` e um `unit_id`; isso não representa múltiplas funções e múltiplas unidades para a mesma pessoa.
2. Vínculo e perfil de acesso são tratados como a mesma entidade, impedindo contextos distintos dentro da mesma clínica.
3. Usuário da clínica e profissional ainda não são entidades separadas; não existe profissional sem conta nem configuração própria de agenda e especialidade.
4. As funções são globais e não possuem uma matriz versionada de permissões, módulos, escopos ou personalizações por clínica.
5. O onboarding solicita apenas clínica, responsável, e-mail, telefone e primeira unidade; não persiste etapas, progresso ou pendências.
6. A criação inicial bloqueia qualquer conta que já possua vínculo ativo, o que impede uma proprietária de administrar múltiplas clínicas pelo mesmo usuário.
7. A seleção de perfil seleciona automaticamente quando existe somente um vínculo e não aparece em todos os novos logins, contrariando a visão definida para “Quem está acessando?”.
8. O menu lateral é estático, igual para todas as funções e expõe rotas sem considerar permissões antes do clique.
9. Convites aceitam apenas `clinic_admin` e `clinic_employee`; os papéis operacionais preparados estão inativos e não atribuíveis.
10. Os estados de convite existentes são `pending`, `accepted`, `expired` e `revoked`; ainda não cobrem enviado, entregue, cancelado e reenviado.
11. A documentação anterior ainda prioriza o redesenho visual da seleção de perfil, mas a modelagem conceitual agora é dependência obrigatória e deve ocorrer antes do visual.

## Arquivos relacionados

- `supabase/migrations/20260716213000_multi_tenant_clinics.sql`
- `supabase/migrations/20260716233000_clinic_access_expansion.sql`
- `supabase/migrations/20260716234500_fix_invitation_expiration_ambiguity.sql`
- `supabase/migrations/20260716235000_fix_invitation_crypto_search_path.sql`
- `lib/clinic-context.ts`
- `lib/supabase/middleware.ts`
- `app/api/clinic-setup/route.ts`
- `app/api/clinic-admin/route.ts`
- `app/api/context/active/route.ts`
- `app/(context)/configurar-clinica/page.tsx`
- `app/(context)/selecionar-perfil/page.tsx`
- `app/(authenticated)/authenticated-shell.tsx`
- `components/clinic-setup-form.tsx`
- `components/clinic-admin-panel.tsx`
- `docs/03-modules/clinic-access/`
- `docs/05-security/MULTI_TENANT_SECURITY.md`

## Tabelas relacionadas

- `user_profiles`
- `clinics`
- `clinic_units`
- `roles`
- `clinic_memberships`
- `clinic_invitations`
- `user_active_contexts`
- `audit_logs`

Entidades planejadas que ainda precisam ser definidas documentalmente antes de migrações: modelos de função por clínica, permissões, atribuições de função, perfis de acesso, profissionais, vínculos com múltiplas unidades e progresso do onboarding.

## Riscos

- Quebrar o Login e o fluxo de sessão já corrigidos ao alterar a resolução pós-login.
- Invalidar vínculos, convites ou contextos ativos existentes durante a evolução do modelo.
- Criar permissões apenas visuais sem equivalência no servidor e no RLS.
- Confundir conta, colaborador e profissional e gerar duplicidade de pessoas.
- Aplicar migrações destrutivas em produção em vez de uma evolução incremental e retrocompatível.
- Iniciar telas definitivas sem referência visual aprovada, violando `DEC-001` e `DEC-002`.
- Registrar como implementada uma estrutura ainda apenas planejada.

## Primeira etapa de implementação

Executar primeiro uma etapa exclusivamente documental para definir o modelo conceitual e os contratos entre conta, clínica, unidade, usuário da clínica, função, permissão, perfil de acesso, profissional e vínculo. Essa documentação deve especificar cardinalidades, propriedade dos dados, estados, escopos de autorização, transição segura a partir das tabelas existentes e invariantes de RLS. Nenhuma migração será criada antes dessa definição.

## Próxima ação exata

1. Projetar o contrato de persistência do onboarding guiado e retomável.
2. Definir uma migração aditiva para progresso, dados da proprietária, clínica, unidade e funcionamento básico.
3. Especificar idempotência, RLS, retomada, abandono e compatibilidade com `create_initial_clinic`.
4. Criar testes de contrato antes de alterar a interface.

## Checkpoint de origem

- Estado inicial desta tarefa: `3853a06` — `docs: update ACTIVE_TASK after auth fixes and production deploy`.
- Resultado do `git pull origin main`: branch já estava atualizada.
- Código alterado neste checkpoint: nenhum.

## Resultado da Etapa 1

- Modelo conceitual definido e documentado.
- Conta, usuário da clínica e profissional separados.
- Funções por clínica, permissões e perfis de acesso definidos.
- Múltiplas funções e unidades previstas sem destruir o modelo atual.
- Decisões DEC-009 a DEC-012 registradas.
- Migrações e código: ainda não iniciados.

## Validação da Etapa 1

- Integridade documental: aprovada, sem identificadores duplicados ou status fora do padrão.
- ESLint: 0 erros e 4 avisos preexistentes sobre `<img>` nas telas públicas.
- TypeScript: aprovado com `tsc --noEmit`.
- Build de produção: aprovado com 34 páginas e Proxy ativo.
- Testes funcionais, de sessão e RLS: não reaplicáveis neste ciclo exclusivamente documental; o comportamento executável não foi alterado.
- Último erro: a primeira execução do build não pôde gravar `.next/trace-build` por restrição do ambiente local; a mesma execução autorizada foi concluída com sucesso. Não é erro do produto.

---

# Histórico preservado — TASK-001: autenticação e e-mails

## Tarefa atual

Corrigir o fluxo de login e autenticação da DouxHub. O usuário reportou que o login está "bugado" — login falha, redirecionamento não ocorre corretamente ou sessão não persiste após autenticação bem-sucedida.

---

## O que já existia antes da entrada desta sessão

- Next.js 16.2.10 (App Router) com TypeScript, ESLint e Tailwind CSS v4.
- Supabase como backend de autenticação (URL: NEXT_PUBLIC_SUPABASE_URL — não registrar valor).
- `components/login-form.tsx`: formulário de login funcional com react-hook-form + zod.
- `app/api/auth/post-login/route.ts`: endpoint POST que resolve memberships após login.
- `app/api/auth/logout/route.ts`: endpoint POST que faz signOut e limpa o cookie de contexto.
- `lib/supabase/middleware.ts`: lógica de proteção de rotas (reescrita nesta sessão).
- `proxy.ts`: interceptador de requisições (convenção Next.js 16).
- `app/(authenticated)/layout.tsx`: Server Component com validação de sessão.
- `app/(context)/`: route group para selecionar-perfil, sem-clinica, configurar-clinica.
- SMTP Resend ativo e testado (last_event: delivered).

---

## O que você tentou corrigir

Sessões anteriores (outra IA no repositório):
- Tentativa de corrigir o auth callback handler.
- Melhoria de logging no post-login.
- Correção para detectar e-mail já cadastrado no signup.
- Endpoints de cleanup de usuários de teste (criados e depois deletados localmente).

Esta sessão (atual):
- Reescrita do `lib/supabase/middleware.ts` para usar `getUser()` sem atalho por cookie.
- Conversão do `app/(authenticated)/layout.tsx` para Server Component com validação server-side.
- Criação do route group `app/(context)/` para selecionar-perfil sem sidebar do dashboard.
- Remoção de arquivos de debug/cleanup de usuários de teste.

---

## O que você efetivamente alterou

| Arquivo | Alteração |
|---|---|
| `lib/supabase/middleware.ts` | Reescrito: getUser() como única fonte de verdade |
| `app/(authenticated)/layout.tsx` | Convertido para Server Component com redirect server-side |
| `app/(authenticated)/authenticated-shell.tsx` | Criado: Client Component com lógica visual do layout |
| `app/(context)/layout.tsx` | Criado: layout mínimo server-side para rotas de contexto |
| `app/(context)/selecionar-perfil/page.tsx` | Criado: sem sidebar do dashboard |
| `app/(context)/sem-clinica/page.tsx` | Criado: sem sidebar do dashboard |
| `app/(context)/configurar-clinica/page.tsx` | Criado: sem sidebar do dashboard |
| `proxy.ts` | Matcher atualizado |
| `docs/00-project/CURRENT_STATE.md` | Versão 0.12.0 — SMTP e correção de segurança |
| `docs/00-project/CHANGELOG.md` | Versão 0.9.0 — SMTP e correção de segurança |
| `docs/05-security/MULTI_TENANT_SECURITY.md` | Versão 0.6.0 — proteção em camadas |

---

## Erro original

O usuário reportou:
1. Rotas internas carregam sem exigir login (em aba anônima).
2. `/selecionar-perfil` exibe a estrutura do Dashboard em vez da seleção de perfil.

Causa identificada:
- `lib/supabase/middleware.ts` usava `hasAuthCookie` como atalho inseguro antes de validar a sessão via `getUser()`.
- `app/(authenticated)/layout.tsx` era `'use client'` — conteúdo renderizava antes da validação.
- `/selecionar-perfil` estava dentro do route group `(authenticated)` herdando o layout com sidebar.

---

## Comportamento atual

Após as correções desta sessão:
- Build de produção: ✅ 33 páginas, 0 erros TypeScript, Proxy (Middleware) ativo.
- Lint: ✅ 0 erros, 4 warnings pré-existentes (img sem next/image).
- Deploy na Vercel: **pendente** — push para origin/main ainda não foi enviado com estas correções.
- Testes em produção com aba anônima: **pendente**.

O login em si (fluxo de autenticação por e-mail/senha) ainda está reportado como bugado — sem confirmação do erro exato após as últimas correções de middleware/layout.

---

## O que já funciona

- SMTP Resend ativo: confirmação de cadastro e recuperação de senha entregues (`last_event: delivered`).
- Estrutura de rotas: 33 rotas compilando sem erro.
- RLS no banco: 8 tabelas com RLS ativo, sem policy `anon`.
- Logout: `app/api/auth/logout/route.ts` funcional.
- Formulário de login: validação com zod, exibição de erros, toggle de senha.

---

## O que ainda não funciona

- **Fluxo completo de login não validado em produção** após as correções desta sessão.
- O bug específico reportado pelo usuário ("login bugado") não foi reproduzido com detalhamento — sem stack trace ou mensagem de erro exata.
- Testes manuais em aba anônima no endereço público ainda não realizados.

---

## Último teste executado

Build de produção local: `npm run build`

## Resultado do último teste

✅ Sucesso — 33 páginas, Proxy (Middleware) ativo, 0 erros TypeScript.

## Último erro encontrado

Nenhum erro de build. O erro de login reportado pelo usuário não foi reproduzido nesta sessão com detalhe suficiente para diagnóstico.

---

## Próxima ação exata

1. Fazer push para `origin/main` com o estado atual.
2. Aguardar deploy da Vercel.
3. **Pedir ao usuário que descreva o comportamento exato do bug de login** (mensagem de erro, tela que aparece, URL em que trava).
4. Reproduzir o erro localmente com `npm run dev`.
5. Identificar se o problema está em: signInWithPassword → post-login → redirect → middleware → cookie.

---

## Variáveis envolvidas

Nomes apenas — nunca valores:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ACTIVE_MEMBERSHIP_COOKIE`

---

## Estado do Login

✅ **Corrigido em 2026-07-18.** Causa raiz: middleware redirecionava `/api/auth/post-login` para HTML em vez de deixar a rota de API responder. Fix: early return para `/api/` no middleware.

## Estado da autenticação

✅ **Corrigido em 2026-07-18.** `auth/callback/route.ts` reescrito para propagar cookies de sessão diretamente no redirect response (antes os cookies eram perdidos e o usuário chegava ao login sem sessão).

## Estado do cadastro

✅ Funcional. Detecção de e-mail duplicado via `identities.length === 0`. E-mail de confirmação entregue via Resend/SMTP.

## Estado da recuperação de senha

✅ Funcional. E-mail entregue via Resend/SMTP (last_event: delivered).

## Estado do Resend

✅ Ativo. Domínio `auth.douxhub.space` verificado. Rate limit 100/h.

## Estado do SMTP do Supabase

✅ Ativo. Host `smtp.resend.com:465`. Site URL `https://douxhub.space`.

## Estado do deploy

✅ **Em produção.** Deployment `dpl_AF3FHyXE5fT4PpX2ixur57sN8LPD` (commit `50663a5`) promovido para `douxhub.space` em 2026-07-18 02:45.

Nota: o auto-deploy do GitHub parou de funcionar após 22:15 de 17/07. Cada push precisa de deploy manual via API Vercel ou reconexão do GitHub app no painel.

## Último commit em produção

`50663a5` — `fix: auth callback session cookies and login error handling`
Deployment Vercel: `dpl_AF3FHyXE5fT4PpX2ixur57sN8LPD` | Estado: READY | Target: production

## Próximo checkpoint

- Testar cadastro do zero em aba anônima em `douxhub.space`
- Confirmar e-mail e fazer login
- Verificar redirecionamento para `/configurar-clinica` ou `/selecionar-perfil`
- Se funcionar: fluxo de autenticação está completo
