# Active Task

document_id: TASK-002
last_updated: 2026-07-19
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

## Etapa 2 — ciclo 1: persistência do onboarding

### Problema isolado

O onboarding atual mantém os dados somente no formulário e cria a clínica no envio final. Se a proprietária abandonar ou atualizar a página, não existe rascunho, progresso retomável ou controle de ordem das etapas.

### Unidade lógica deste ciclo

- documentar o contrato de persistência;
- criar uma tabela aditiva de progresso por conta;
- permitir iniciar/retomar, salvar uma etapa e cancelar o rascunho por funções seguras;
- aplicar RLS para leitura exclusiva do próprio usuário;
- impedir escrita direta nas colunas do rascunho;
- criar teste transacional de contrato e isolamento.

### Fora deste ciclo

- interface guiada;
- conclusão transacional da clínica;
- alteração de `create_initial_clinic`;
- funções padrão por clínica;
- deploy ou aplicação da migração no Supabase de produção.

### Próxima ação exata do ciclo

Criar a migração `20260718120000_clinic_onboarding_progress.sql`, o teste `003_clinic_onboarding_progress.sql` e a documentação do módulo de onboarding; em seguida validar documentação, lint, TypeScript e build antes do checkpoint.

### Resultado do ciclo

- Migração aditiva de progresso criada.
- Início e retomada idempotentes implementados em função segura.
- Salvamento ordenado das etapas 1 a 5 implementado.
- Cancelamento preservando histórico implementado.
- RLS de leitura exclusiva e bloqueio de escrita direta configurados.
- Teste transacional de contrato, ordem, cancelamento e isolamento criado.
- Documentação específica criada em `docs/03-modules/clinic-onboarding/`.
- Aplicação no Supabase de produção: pendente.

### Último teste executado

`npm run build`

### Resultado do último teste

Build aprovado com 34 páginas e Proxy ativo. TypeScript aprovado. ESLint sem erros e com quatro avisos preexistentes sobre `<img>`.

### Último erro encontrado

Não há erro de aplicação. O teste SQL não foi executado porque a cópia oficial não possui Supabase CLI, PostgreSQL local ou configuração de conexão remota. Esse limite está documentado e impede marcar o contrato como validado no banco.

### Próxima ação exata

Criar o ciclo 2 da Etapa 2: schemas Zod e API server-side para iniciar/retomar, consultar, salvar e cancelar o rascunho, sem implementar ainda a conclusão transacional ou o visual definitivo.

## Etapa 2 — ciclo 2: validação e API do rascunho

### Problema isolado

A fundação de banco aceita objetos JSON porque ainda não existe uma camada server-side que valide campos, formatos e limites específicos de cada etapa. Também não existe endpoint autenticado para a futura interface consultar e alterar o próprio rascunho.

### Unidade lógica deste ciclo

- schemas Zod independentes para as etapas 1 a 5;
- validação de CNPJ, endereço, fuso, horários, dias e preferências;
- API autenticada para consultar, iniciar/retomar, salvar e cancelar;
- bloqueio do onboarding inicial para contas que já possuem vínculo ativo;
- respostas sem cache e erros públicos estáveis;
- nenhuma alteração na interface ou na conclusão transacional.

### Resultado do ciclo

- Schemas estritos implementados para as etapas 1 a 5.
- Validação de CNPJ com dígitos verificadores implementada.
- Endereços, fuso IANA, horários, políticas, pagamentos e preferências possuem limites server-side.
- API `GET`, `POST`, `PATCH` e `DELETE` implementada em `/api/clinic-onboarding`.
- Sessão e ausência de vínculo ativo são verificadas antes de qualquer operação.
- Respostas são privadas, sem cache e sem mensagens internas do banco.
- A interface e a conclusão transacional permanecem inalteradas.

### Último teste executado

`npm run build`

### Resultado do último teste

Build aprovado com 35 rotas/páginas e Proxy ativo. TypeScript aprovado. ESLint sem erros e com quatro avisos preexistentes. Smoke test dos cinco schemas aprovado com `clinic_onboarding_schema_smoke_ok`.

### Último erro encontrado

Na primeira execução remota, o teste chamou `save_clinic_onboarding_step` com literais `integer`, enquanto a função exige `smallint`. O teste foi corrigido com conversões explícitas nos três cenários e aprovado na execução seguinte. A migração não precisou de correção.

### Portão de validação concluído em 19/07/2026

- Projeto oficial confirmado no Supabase: DouxHub, Project Ref `ffailpkrmaxuqzbghsyi`, produção em `sa-east-1`.
- Migração `20260718120000_clinic_onboarding_progress.sql` aplicada pelo SQL Editor com sucesso.
- A aplicação pelo SQL Editor não foi registrada artificialmente na tabela de histórico da Supabase CLI; esse histórico deverá ser reconciliado antes de um futuro fluxo baseado em CLI.
- Teste `003_clinic_onboarding_progress.sql` executado no banco oficial.
- Resultado final: `clinic_onboarding_progress_ok`.
- Os usuários e registros artificiais do teste foram desfeitos pelo `rollback` do próprio contrato.
- O arquivo de teste foi ajustado para usar `smallint` explicitamente nas chamadas da função.
- Integridade documental aprovada com 61 documentos e 61 identificadores únicos.
- TypeScript aprovado; ESLint sem erros e com quatro avisos preexistentes sobre `<img>`.

## Etapa 2 — ciclo 3: interface técnica guiada

### Resultado do ciclo

- O formulário curto de `/configurar-clinica` foi substituído por uma jornada técnica de seis etapas.
- As cinco etapas de dados consomem `PATCH /api/clinic-onboarding` e a sexta delimita a preparação para conclusão.
- A tela consulta o rascunho existente e inicia outro somente quando necessário.
- O passo atual, os dados e a revisão são retomados a partir da resposta do servidor.
- Etapas anteriores podem ser revisadas e etapas futuras ficam desabilitadas.
- O cancelamento exige duas ações, preserva o histórico e permite iniciar novo rascunho.
- O modo estrito do React foi considerado; o início idempotente suporta carregamentos concorrentes sem prender a interface.
- O visual permanece explicitamente técnico e temporário.

### Validação

- ESLint: 0 erros e quatro avisos preexistentes sobre `<img>`.
- TypeScript: aprovado durante o build.
- Build: aprovado com 35 rotas/páginas e Proxy ativo.
- Teste manual autenticado e refresh real: pendentes.

### Próxima ação exata

Iniciar o Ciclo 4 da Etapa 2: definir e testar a conclusão transacional e idempotente que cria clínica, primeira unidade, vínculo de proprietária, função, contexto e auditoria, e marca o rascunho como concluído sem duplicidade.

## Etapa 2 — ciclo 4: conclusão transacional e idempotente

### Resultado

- Conclusão transacional implementada e aplicada no Supabase oficial.
- Clínica, primeira unidade, perfil pessoal, vínculo `clinic_owner`, contexto e auditoria são criados em uma única operação.
- Repetição devolve os mesmos identificadores sem duplicar registros.
- API e etapa 6 da interface foram conectadas à conclusão e ao Dashboard.
- Teste oficial aprovado com `clinic_onboarding_completion_ok` após correção de uma referência ambígua encontrada pela primeira execução.
- ESLint, TypeScript e build aprovados.

### Próxima ação exata

O ciclo foi publicado no commit `feefa06` e no deployment `dpl_DVEs9VDxi2Tb4vhiiuMboftnwGX7` (`READY`). O domínio oficial aprovou Login, proteção da rota de onboarding e recusa anônima da API. A próxima ação é iniciar a Etapa 3, Ciclo 1: migração aditiva e testes para usuários da clínica, atribuições de função e perfis de acesso.

## Correção de desempenho do Login

- Gargalo isolado em chamadas remotas sequenciais e navegação duplicada.
- Resolução consolidada em `resolve_post_login_context()` e protegida por `auth.uid()`.
- `getClaims()` adotado no Proxy e nos layouts; `getUser()` permanece disponível apenas quando dados atuais da conta forem realmente necessários.
- Contrato aprovado no Supabase oficial com `post_login_resolution_ok`.
- Publicado no commit `4cb08f4` e no deployment `dpl_A2fbaG7Nyyaw4BzRLq7tP6CYoVdf` (`READY`). Medições válidas até o Dashboard: 3,81 s e 1,26 s. Fixture removida integralmente.

## Etapa 3 — ciclo 1: fundação aditiva de acesso

### Resultado

- `clinic_users`, `clinic_roles`, `clinic_user_role_assignments`, `clinic_user_units` e `access_profiles` implementadas.
- Modelos de função copiados por clínica sem usuários fictícios.
- Vínculos atuais convertidos e sincronizados sem remoção ou troca de autoridade.
- Múltiplas funções e unidades, RLS e isolamento validados.
- Contrato aprovado com `clinic_access_profiles_foundation_ok`.

### Próxima ação exata

O Ciclo 1 foi publicado no commit `38ee817` e validado no domínio. A próxima ação é iniciar o Ciclo 2 da Etapa 3: catálogo de permissões, matriz por função e exceções de perfil, ainda sem migrar a seleção de contexto.

## Etapa 3 — ciclo 2: catálogo e matriz de permissões

### Resultado

- catálogo com dez chaves estáveis e escopos aprovados implementado;
- matriz inicial por função da clínica persistida sem concessões às funções futuras;
- concessões e negações personalizáveis por perfil implementadas;
- cálculo efetivo restrito ao próprio perfil ativo e com negação prevalente;
- RLS, ausência de escrita direta, isolamento e rollback validados com `clinic_permissions_foundation_ok`.
- commit `2f0389f` publicado no deployment `dpl_4SBuYeu6W7M3NxF7gNqLVvL5kCz2` (`READY`) e domínio oficial conferido.

### Próxima ação exata

Executar o Ciclo 3 da Etapa 3: camada de leitura e testes de equivalência entre `clinic_memberships` e os novos perfis, sem trocar ainda `user_active_contexts`, rotas, menus ou autorização vigente.

## Etapa 3 — ciclo 3: leitura segura e portão de equivalência

### Resultado

- comparação segura e rastreável de cada vínculo com usuário da clínica, função, perfil, unidade, escopo e estados;
- listagem limitada aos perfis ativos e válidos da conta autenticada, com permissões efetivas;
- snapshot agregado com `equivalence_ready`, perfis disponíveis e divergências explícitas;
- endpoint `GET /api/access-profiles` sem cache, com falha fechada para ausência de sessão, indisponibilidade ou divergência;
- migração aplicada no Supabase oficial e contrato `008_access_profile_equivalence_gate.sql` aprovado com `access_profile_equivalence_gate_ok` e rollback integral;
- ESLint, TypeScript e build de produção aprovados;
- `clinic_memberships`, `user_active_contexts`, Login, rotas e menus preservados.

### Próxima ação exata

Executar o Ciclo 4 da Etapa 3: adoção controlada do perfil validado no contexto ativo, preservando o vínculo de origem, auditoria e retorno seguro durante a transição.

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
