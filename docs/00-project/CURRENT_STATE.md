---
title: Estado Atual da DouxHub
document_id: PRJ-002
version: 0.21.0
status: Validado
last_updated: 2026-07-19
owner: DouxHub
related_documents:
  - PROJECT.md
  - NEXT_STEP.md
  - CHANGELOG.md
---

# Estado Atual (Current State)

## Etapa 3 — Ciclo 2: catálogo e matriz de permissões (Validada em 19/07/2026)

- A migração `20260719200000_clinic_permissions_foundation.sql` criou o catálogo estável, a matriz por função da clínica e as exceções explícitas por perfil.
- Dez permissões compatíveis com as capacidades já existentes usam chaves `recurso.acao` e escopos `own`, `unit` ou `clinic`.
- A matriz inicial preserva proprietária, administradora e colaborador; funções futuras continuam sem concessões.
- Concessões e negações de perfil são limitadas a permissões personalizáveis e a escopos aprovados no catálogo.
- `get_effective_access_profile_permissions()` e `access_profile_has_permission()` validam conta, clínica, função, unidade, atribuições e estados ativos antes de calcular o resultado.
- Negação explícita prevalece sobre função e concessão personalizada; restrições estruturais e Row Level Security (RLS) permanecem superiores à matriz.
- As três tabelas novas possuem RLS e leitura limitada; `authenticated` não recebeu escrita direta.
- O contrato `007_clinic_permissions_foundation.sql` retornou `clinic_permissions_foundation_ok`, incluindo isolamento, escopo, concessão, negação prevalente e rollback integral.
- ESLint, TypeScript e build de produção foram aprovados; permanecem somente quatro avisos preexistentes sobre imagens públicas.
- `clinic_memberships`, `user_active_contexts`, rotas e menus continuam sendo a autoridade operacional vigente até um portão posterior de equivalência.

## Otimização do Login (Validada no Supabase em 19/07/2026)

- A causa estrutural da espera após a senha era a sequência de chamadas remotas: nova validação do usuário, listagem de vínculos, consulta adicional para vínculos inativos ou outra chamada para ativar contexto, seguida de `router.push` e `router.refresh`.
- `resolve_post_login_context()` passou a validar `auth.uid()`, resolver o destino e ativar ou limpar o contexto em uma única chamada transacional.
- O endpoint `/api/auth/post-login` não repete `getUser()`, não expõe detalhes internos, usa resposta sem cache e publica `Server-Timing`.
- Proxy e layouts usam `getClaims()` verificado, recomendado pelo Supabase para proteção server-side e potencialmente atendido por chaves em cache.
- O cliente executa somente `router.replace`; o indicador permanece até a navegação começar.
- A migração `20260719180000_optimize_post_login_resolution.sql` foi aplicada e `005_post_login_resolution.sql` retornou `post_login_resolution_ok` no projeto oficial.
- Build, TypeScript e ESLint foram aprovados.
- Os commits `4cb08f4` e `38ee817` foram publicados no deployment `dpl_A2fbaG7Nyyaw4BzRLq7tP6CYoVdf`, estado `READY`, target `production`, com alias `douxhub.space`.
- Uma conta técnica temporária com vínculo único confirmou o caminho completo até `/dashboard`: 3,81 segundos na primeira execução válida e 1,26 segundo após logout completo. A conta, a clínica e todos os registros associados foram removidos integralmente após a medição.

## Etapa 3 — Ciclo 1: fundação de usuários, funções e perfis (Validada em 19/07/2026)

- A migração aditiva `20260719190000_clinic_access_profiles_foundation.sql` criou `clinic_users`, `clinic_roles`, `clinic_user_role_assignments`, `clinic_user_units` e `access_profiles`.
- Funções globais são copiadas para cada clínica sem criar contas, senhas ou colaboradores fictícios.
- Vínculos atuais são convertidos e permanecem sincronizados por gatilho, com `source_membership_id` para rastreabilidade.
- Múltiplas funções e unidades por usuário da clínica já são representáveis.
- Chaves estrangeiras compostas e RLS preservam a fronteira da clínica; `authenticated` possui leitura, sem escrita direta nas tabelas novas.
- `clinic_memberships` continua sendo o contrato vigente da aplicação e do contexto ativo; não houve migração de leitura nem remoção.
- O contrato oficial retornou `clinic_access_profiles_foundation_ok` com rollback dos dados fictícios.
- A fundação aditiva está no commit `38ee817` e foi publicada no mesmo deployment de produção `dpl_A2fbaG7Nyyaw4BzRLq7tP6CYoVdf`.
- Catálogo de permissões, matriz de função, exceções de perfil, profissionais e adoção do novo contexto permanecem para ciclos posteriores.

## Identidade global — favicon oficial (19/07/2026)

- O favicon padrão anterior foi substituído pelo ícone oficial fornecido pela DouxHub.
- O arquivo original foi preservado em `app/icon.png`, usando a convenção nativa de metadados do Next.js para gerar o ícone exibido em abas, favoritos e atalhos compatíveis.
- A alteração é exclusivamente de identidade global e não modifica Login, onboarding, rotas ou regras de negócio.
- Commit `48e614b` enviado para `origin/main` e publicado no deployment `dpl_5tRmT5teWrEyYmi7hRBiw2dikA4w`, estado `READY`, target `production`.
- Em `douxhub.space/login`, o documento publica um único favicon apontando para `/icon.png`; o ativo respondeu `200 OK`, `Content-Type: image/png` e 50.801 bytes.

## Etapa 2 — Ciclo 4: conclusão transacional do onboarding (Validado em 19/07/2026)

- A função `complete_clinic_onboarding` transforma um rascunho pronto em clínica, primeira unidade, perfil pessoal, vínculo `clinic_owner`, contexto ativo e auditoria na mesma transação.
- A conclusão grava os identificadores no rascunho, muda o estado para `completed` e é idempotente: repetir a operação devolve os mesmos registros.
- `PUT /api/clinic-onboarding` expõe a operação de forma autenticada, grava o cookie HttpOnly do vínculo e direciona para `/dashboard`.
- A etapa 6 da interface técnica oferece revisão e a ação “Criar clínica e entrar”.
- A migração `20260719120000_complete_clinic_onboarding.sql` foi aplicada no Supabase oficial pelo SQL Editor.
- O contrato `004_clinic_onboarding_completion.sql` foi aprovado com `clinic_onboarding_completion_ok`, incluindo atomicidade, auditoria, repetição, isolamento entre contas, recusa de rascunho incompleto e rollback dos dados fictícios.
- ESLint, TypeScript e build de produção foram aprovados; o lint mantém somente quatro avisos preexistentes sobre imagens públicas.
- O commit funcional `feefa06` foi enviado para `origin/main` e publicado no deployment `dpl_DVEs9VDxi2Tb4vhiiuMboftnwGX7`, estado `READY`, target `production`.
- Os aliases `douxhub.space` e `douxhubplataforma.vercel.app` apontam para a entrega. O Login foi conferido, `/configurar-clinica` redirecionou visitante anônimo para `/login?next=%2Fconfigurar-clinica` e a API do onboarding respondeu `401 Unauthorized` com `Cache-Control: private, no-store, max-age=0` sem sessão.
- O fluxo manual autenticado completo no domínio publicado permanece pendente por exigir uma conta de teste confirmada e dados reais preenchidos na interface.

## Etapa 1: Fundação Técnica e Estrutura Inicial (Implementada em 16/07/2026)

O projeto foi inicializado do zero com a seguinte estrutura e configurações básicas:

### 1. Fundação Técnica
- **Next.js 16.2.10 (App Router)** com TypeScript, ESLint e Tailwind CSS v4 configurados.
- **Shadcn UI** inicializado utilizando o preset padrão e o componente de botão básico instalado em `components/ui/button.tsx`.
- **Dependências instaladas:**
  - `@supabase/supabase-js` e `@supabase/ssr` (infraestrutura Supabase)
  - `react-hook-form` e `@hookform/resolvers` (validação e gestão de formulários)
  - `zod` (esquemas de validação de dados)
  - `lucide-react` (biblioteca de ícones)
- **Supabase Clients** configurados para Browser e Servidor em `lib/supabase/`.
- **Proxy de Autenticação (Next.js 16.2.10 proxy.ts)** configurado para interceptação de rotas e proteção do painel `/dashboard` e demais rotas restritas.
- **Configuração de ambiente (.env.local / .env.example)** configurada com chaves do Supabase.

### 2. Estrutura de Rotas e Páginas
- **Páginas de Autenticação:**
  - `/login`: Login premium em produção;
  - `/cadastro`: cadastro funcional com identidade visual temporariamente alinhada ao Login;
  - `/recuperar`: solicitação de recuperação com o padrão visual público;
  - `/redefinir`: redefinição de senha com validação de sessão e o padrão visual público;
  - `/primeiro-acesso`: definição inicial de acesso por convite.
- **Rotas Protegidas (Módulos Vazios):**
  - `/dashboard`, `/agenda`, `/pacientes`, `/comercial`, `/tratamentos`, `/financeiro`, `/produtos`, `/prontuarios`, `/equipe`, `/automacoes`, `/whatsapp`, `/relatorios`, `/integracoes`, `/configuracoes`
  - Cada rota exibe uma página padrão com a mensagem `"Módulo ainda não implementado."`

### 3. Layouts Globais
- **Layout Público (`app/layout.tsx`):** Estrutura global contendo fontes e estilos básicos do Tailwind.
- **Layout Autenticado (`app/(authenticated)/layout.tsx`):** Estrutura técnica incluindo área reservada para Sidebar, Header, Área de Conteúdo Principal e suporte a navegação mobile responsiva.

### 4. Ativos de Mídia
- **Vídeo de Introdução (Doux Intro):** Arquivo de introdução inserido em `public/intro/doux-intro.mp4` e sua versão otimizada em `public/intro/doux-intro.webm`.

## Etapa 2: Introdução Audiovisual (Em produção desde 16/07/2026)

Implementação do fluxo mínimo e automático de introdução de marca em tela cheia na rota inicial (`/`) antes do login:
- **Fluxo e Roteamento:**
  - A página raiz `app/page.tsx` executa como um Client Component que exibe o vídeo `/intro/doux-intro.mp4` em tela cheia, com fundo preto e sem qualquer interface sobreposta (textos ou botões).
  - O vídeo possui os atributos `autoPlay`, `muted` (para viabilizar o autoplay sem interação nas diretrizes dos navegadores modernos) e `playsInline`.
  - Ao término da reprodução (`onEnded`) ou em caso de erro de carregamento (`onError`), o usuário é redirecionado imediatamente para a rota `/login`.

## Etapa 3: Transição Suave e Tela de Login Premium (Em produção desde 16/07/2026)

Implementação do fluxo definitivo e alinhado do login com a imagem de referência do usuário:
- **Suporte à Fonte Raleway:**
  - A fonte `Raleway` foi configurada como fonte principal do projeto em `app/layout.tsx` e remapeada para a classe `font-sans` em `app/globals.css`.
- **Transição Física Local Instantânea (`app/page.tsx`):**
  - Todo acesso à rota raiz (`/`) reproduz o vídeo de introdução `/intro/doux-intro.mp4` em tela cheia sobreposto à tela de login, que já permanece montada e carregada por baixo.
  - No evento `ended`, o player é removido no frame final e a URL é atualizada de forma transparente para `/login` via `window.history.replaceState`, sem navegação de página ou atraso de carregamento.
  - Não há persistência em `sessionStorage`: retornar ao link principal sempre reinicia a introdução.
- **Design de Login Fiel ao Mockup (`components/login-form.tsx`):**
  - Fundo mais claro e nítido com overlay global de apenas 6%. Degradês lineares amplos e suaves reforçam o contraste no lado da marca e junto ao rodapé sem formar manchas ou borrões sobre a fotografia.
  - Logo oficial original (`/intro/doux-logo.png`) copiada sem alteração de pixels do arquivo `logotipo douxhub.png` fornecido pelo usuário. O enquadramento das margens transparentes é feito apenas por CSS, sem recortar o ativo original.
  - Slogan *"A operação da sua clínica, em um único lugar."* (com "único" em negrito) acompanhado da linha horizontal dourada decorativa.
  - Card de login alto à direita com efeito glassmorphism escuro (`backdrop-blur-md bg-black/35`), título "Bem-vindo à Doux", inputs claros permanentes com ícones `Mail` e `Eye`/`EyeOff`, botão "Entrar" cinza claro com a seta para a direita (`ArrowRight`) e rodapé de segurança com ícone de cadeado.
  - Logo alinhada visualmente com o início do slogan, link "Esqueci minha senha" com sublinhado sutil e direitos reservados na mesma cor do texto "Bem-vindo à".
  - Rótulos e textos descritivos ajustados para um cinza bem claro (`text-zinc-300`) e divisória "ou" removida.
  - Interface responsiva sem rolagem vertical, ajustada na viewport (mobile reposiciona o formulário na base com overlay preta).
- **Tratamento de Build e Resiliência:**
  - Configurados placeholders padrão para as variáveis do Supabase nos arquivos de inicialização, permitindo que o build estático e o prerender passsem com sucesso em ambientes de CI/CD (Vercel) e offline.

## Etapa 4: Recuperação, Redefinição e Primeiro Acesso (Implementada em 16/07/2026; validação remota parcial)

- **Design unificado de autenticação:** criado o componente visual `components/auth-shell.tsx`, utilizado somente pelas novas telas para reproduzir o fundo, a logo, os degradês, a tipografia, o painel, os campos, os botões e a responsividade aprovados no Login, sem alterar o Login existente.
- **Recuperação de acesso (`/recuperar`):** formulário com validação de campo vazio e e-mail inválido, carregamento, bloqueio de envio duplicado, mensagem genérica de erro, confirmação de envio e integração com `resetPasswordForEmail`, usando `/redefinir` como URL de retorno.
- **Redefinição de senha (`/redefinir`):** validação da sessão de recuperação por código e eventos do Supabase, tratamento distinto de link inválido e expirado, campos com exibição/ocultação de senha, requisito mínimo de 6 caracteres, confirmação de igualdade, bloqueio de envio duplicado e atualização por `updateUser`. Após o sucesso, a sessão temporária é encerrada e o usuário retorna automaticamente ao Login, sem passar pelo Dashboard.
- **Primeiro acesso por convite (`/primeiro-acesso`):** validação de convites Supabase nos formatos PKCE, `token_hash` e tokens de sessão, preenchimento do e-mail somente leitura, nome, criação e confirmação de senha, aceite obrigatório dos termos e gravação de `full_name` e `terms_accepted_at` nos metadados do usuário. A sessão temporária é encerrada após a conclusão.
- **Proteção de rotas:** o proxy reconhece `/primeiro-acesso` como rota pública e permite que `/redefinir` e `/primeiro-acesso` permaneçam acessíveis durante suas sessões temporárias. As demais rotas autenticadas continuam protegidas.
- **Responsividade verificada:** sem overflow horizontal em notebook (1366×768), tablet (1024×768) e mobile (390×844); o fundo permanece centralizado, os textos legíveis e o formulário é mantido na parte inferior no mobile, com rolagem vertical disponível para conteúdos maiores e uso com teclado aberto.
- **Validações executadas:** ESLint sem erros, TypeScript sem erros e build de produção concluído com as 23 páginas geradas. Foram verificados os estados de campo vazio, e-mail inválido, erro de envio, token inválido, token expirado e convite inválido/expirado.
- **Validação remota parcial:** a aplicação está conectada a um projeto Supabase saudável na região de São Paulo. A criação de conta foi validada no endereço oficial e o usuário fictício foi removido após o teste. Confirmação de e-mail, recuperação, redefinição e aceite de convite com links reais continuam pendentes.

## Etapa 5: Base Multiempresa e Acesso às Clínicas (Validada no Supabase em 16/07/2026)

- **Migrações versionadas:** a base `20260716213000_multi_tenant_clinics.sql` foi ampliada por `20260716233000_clinic_access_expansion.sql`, `20260716234500_fix_invitation_expiration_ambiguity.sql` e `20260716235000_fix_invitation_crypto_search_path.sql`. O modelo utiliza `clinics`, `clinic_units`, `user_profiles`, `clinic_memberships`, `roles`, `clinic_invitations`, `user_active_contexts` e `audit_logs`.
- **Funções iniciais:** habilitadas `clinic_owner`, `clinic_admin` e `clinic_employee`. As funções `receptionist`, `professional`, `commercial`, `financial` e `stock_manager` existem apenas como registros inativos e não atribuíveis. Nenhuma função do DouxHub Control foi criada.
- **RLS e isolamento:** todas as tabelas expostas possuem RLS. Funções `security definer` validam o usuário autenticado para criação de clínica, contexto ativo, convite, aceite e gestão de membros. O destinatário do convite é validado pelo e-mail do JWT e o banco armazena apenas o hash do token.
- **Pós-login:** o Login consulta vínculos no servidor. Usuário novo sem vínculo segue para `/configurar-clinica`; usuário com vínculos somente inativos segue para `/sem-clinica`; vínculo único é selecionado automaticamente; múltiplos vínculos seguem para `/selecionar-perfil`.
- **Primeira clínica:** `/configurar-clinica` cria, em uma operação segura, a clínica, a primeira unidade, o perfil, o vínculo `clinic_owner`, o contexto ativo e os registros de auditoria.
- **Contexto ativo:** salvo em `user_active_contexts`, auditado no banco e referenciado por cookie `HttpOnly`. O cookie não concede autorização e as consultas permanecem sujeitas ao RLS.
- **Seleção de perfil:** rota `/selecionar-perfil` implementada com interface técnica temporária, seleção de clínica/função e redirecionamento para `/dashboard`.
- **Administração da clínica:** rota protegida `/configuracoes/equipe` implementada com interface técnica temporária para dados básicos, listagem de membros, criação e revogação de convite, ativação, desativação e mudança de função permitida. `/administracao-clinica` apenas redireciona para a rota atual.
- **Convites:** a rota server-side gera token aleatório, registra somente seu hash e, quando `SUPABASE_SERVICE_ROLE_KEY` estiver configurada exclusivamente no servidor, solicita o envio pelo Supabase Auth. Sem essa chave, prepara a URL de redirecionamento para envio externo.
- **Primeiro acesso:** o fluxo agora exige simultaneamente o convite do Supabase Auth e o token de vínculo da clínica; o vínculo é criado apenas pela função segura `accept_clinic_invitation` após validação do destinatário, validade e uso anterior.
- **Auditoria:** registrados criação de clínica, criação e aceite de convite, alteração de função, ativação, desativação e troca de contexto.
- **Testes de banco:** `001_multi_tenant_contract.sql` valida estrutura, RLS, funções e ausência do DouxHub Control; `002_clinic_access_flows.sql` valida os fluxos multiusuário e desfaz integralmente os dados fictícios.
- **Documentação de segurança:** mantida em `docs/05-security/MULTI_TENANT_SECURITY.md` com regras de isolamento, permissões, convite, auditoria e plano de testes.
- **Aplicação remota:** todas as migrações foram aplicadas com sucesso no projeto Supabase de produção. Os testes retornaram `multi_tenant_contract_ok` e `clinic_access_flows_ok` para usuário sem clínica, uma e múltiplas clínicas, convites, gestão de equipe, auditoria e isolamento de leitura e escrita entre clínicas.
- **Validação técnica:** ESLint sem erros, TypeScript sem erros e build de produção com 33 páginas concluído. Permanecem quatro avisos já existentes sobre `<img>` nas telas públicas.
- **Publicação:** versão publicada no domínio oficial. A raiz manteve a introdução e a transição automática para `/login`; recuperação e estados inválidos de redefinição e primeiro acesso responderam corretamente; `/configurar-clinica` e `/configuracoes/equipe` redirecionaram visitantes não autenticados ao Login.
- **Limitações atuais:** a entrega e o aceite com links reais de e-mail e a validação manual autenticada no ambiente publicado permanecem pendentes. As interfaces internas são técnicas e temporárias; Dashboard, cobrança, módulos de negócio e DouxHub Control não foram implementados.

## Correção da conectividade do cadastro e Supabase de produção (16/07/2026)

- Foi criado e configurado um projeto Supabase dedicado à DouxHub na região de São Paulo, com cadastro público habilitado, Row Level Security automático e exposição automática de novas tabelas desabilitada.
- As variáveis públicas locais e do ambiente Production da Vercel foram substituídas pelas credenciais públicas do novo projeto, sem registrar segredos na documentação.
- O cadastro publicado em `/cadastro` foi testado de ponta a ponta: o Supabase criou a conta e a interface exibiu a orientação para confirmação do e-mail. O usuário fictício foi removido após a validação.
- A mensagem técnica de falha de rede foi substituída por uma orientação clara ao usuário quando o serviço de cadastro estiver inacessível.
- ESLint foi executado sem erros, TypeScript foi aprovado, o build de produção foi concluído e a versão foi publicada no endereço oficial.

## Observações Importantes (Status de Design e Negócio)

- **Design System:** O Design System definitivo da plataforma em si (módulos internos) ainda não foi definido.
- **Aprovação Visual:** Nenhuma tela visual interna ou dashboard foi aprovado.
- **Módulos de Negócio:** Nenhum módulo de negócio foi implementado.

## Correção da entrada pública e ação de cadastro (16/07/2026)

- O proxy passou a excluir os ativos de vídeo `.mp4` e `.webm` da proteção de rotas. Assim, o vídeo da introdução volta a carregar na rota `/` e a transição local já aprovada revela o Login no frame final, sem nova navegação de página. O evento `ended` possui ouvintes nativos e uma redundância idempotente nos 20 milissegundos finais, inclusive para o caso em que a mídia termine antes da hidratação da interface.
- O Login recebeu uma ação secundária discreta com o texto “Ainda não tem uma conta?” e o botão “Criar minha conta”, direcionando para o cadastro existente em `/cadastro`.
- A introdução e o Login possuem documentação própria em `docs/02-screens/`; o fluxo de autenticação possui documentação inicial em `docs/03-modules/authentication/`.
- Publicação concluída em `https://douxhubplataforma.vercel.app/`. A raiz, o vídeo público e o Login responderam com sucesso; a transição e o comportamento responsivo foram validados localmente em navegador, e a presença da ação de cadastro foi confirmada no HTML de produção.

## Padronização visual temporária do cadastro (16/07/2026)

- A rota `/cadastro` deixou de usar o template técnico escuro e passou a reutilizar o `AuthShell` e os padrões visuais do Login: mesma fotografia, logo, degradês, painel translúcido, campos claros, tipografia, botões e responsividade.
- O fluxo funcional de criação de conta com Supabase Auth foi preservado, incluindo validações, carregamento, erro, confirmação de envio e retorno ao Login.
- O campo de senha recebeu controle acessível de mostrar e ocultar. A tela permanece temporária quanto ao fluxo de aquisição e vínculo inicial com clínicas.
- A atualização foi publicada em `https://douxhubplataforma.vercel.app/cadastro` e a rota, o título, a ação principal e o retorno ao Login foram confirmados no ambiente oficial.

## Organização documental (16/07/2026)

- Todos os documentos Markdown atuais possuem metadados padronizados, status permitido e versionamento semântico.
- O Design System passou a possuir documentos específicos para tokens, tipografia, cores, espaçamento, componentes, layout, responsividade, movimento e acessibilidade. Padrões ainda não aprovados permanecem identificados como em desenvolvimento.
- As áreas de Doux, prompts, arquitetura, integrações, operações e notas de versão receberam documentos de escopo, distinguindo claramente o que existe do que permanece planejado.
- A autenticação passou a documentar separadamente fluxos, permissões, estados, regras de negócio e testes. A criação real de conta foi validada; os demais testes remotos ainda pendentes permanecem identificados individualmente.
- As decisões DEC-001 a DEC-008 foram preservadas e padronizadas com contexto, decisão e consequências.
- Nenhum código, interface, banco de dados ou dependência foi alterado nesta organização documental.

## Domínio próprio e SMTP (Concluído — 17/07/2026)

- O domínio principal `douxhub.space` foi vinculado ao projeto `douxhubplataforma` na Vercel.
- O subdomínio `formulario.douxhub.space` foi preservado sem alteração.
- O domínio de autenticação `auth.douxhub.space` está verificado no Resend (status: `verified`, região `sa-east-1`).
- DKIM e MX confirmados via DNS público. SPF gerenciado pelo Resend.
- API Key de envio criada no Resend com permissão restrita (`sending_access`) para o domínio `auth.douxhub.space`.
- **SMTP personalizado ativo no Supabase Auth:**
  - Host: `smtp.resend.com`, porta 465, usuário `resend`.
  - Sender Name: `DouxHub`, Sender Email: `nao-responda@auth.douxhub.space`.
  - Rate limit de e-mail: 100 por hora (era 2).
  - Site URL atualizado para `https://douxhub.space`.
  - Redirect URLs: `https://douxhub.space/**` e `https://douxhubplataforma.vercel.app/**`.
- **Testes de envio real executados e confirmados:**
  - Confirmação de cadastro via Supabase: `last_event: delivered`.
  - Recuperação de senha via Supabase: `last_event: delivered`.
  - E-mail direto via Resend API: `last_event: delivered`.
- Documentação completa em `docs/08-integrations/resend/`.

## Segurança de rotas e autenticação (Corrigido — 17/07/2026)

### Causa da falha identificada e corrigida

O projeto usava `proxy.ts` corretamente (convenção do Next.js 16), mas a lógica de proteção em `lib/supabase/middleware.ts` tinha duas falhas críticas:

1. **Verificação de cookie sem validação real**: o código usava `hasAuthCookie` para detectar a presença de um cookie `sb-*-auth-token` e, se não encontrado, redirecionava para `/login`. Porém, se o cookie existia (mesmo expirado ou inválido), a lógica prosseguia sem bloquear. O `supabase.auth.getUser()` era chamado depois, mas a proteção de rotas não-públicas dependia da condição `!user && !isPublicRoute`, que era executada apenas na segunda passagem — criando uma janela de acesso indevido.

2. **Ausência de validação server-side no layout**: o `app/(authenticated)/layout.tsx` era `'use client'` e só validava o usuário via `useEffect` — o conteúdo já renderizava no servidor antes de qualquer verificação.

3. **`/selecionar-perfil` dentro do route group `(authenticated)`**: herdava o layout com sidebar e header do dashboard, exibindo a estrutura errada.

### Correções aplicadas

- **`lib/supabase/middleware.ts`**: reescrito para usar `supabase.auth.getUser()` como única fonte de verdade (sem atalho por cookie). Rotas públicas definidas explicitamente. Lógica sem loop de redirect. Inclui `/auth/` como prefixo público.
- **`app/(authenticated)/layout.tsx`**: convertido para Server Component. Valida sessão via `createClient()` + `getUser()` no servidor antes de renderizar. Redireciona para `/login` se não houver usuário válido.
- **`app/(authenticated)/authenticated-shell.tsx`**: criado como Client Component separado, contendo toda a lógica visual do layout (sidebar, header, menu mobile) — preservada integralmente.
- **Route group `app/(context)/`**: criado com layout mínimo (sem sidebar) para as rotas de contexto: `/selecionar-perfil`, `/sem-clinica`, `/configurar-clinica`. Valida sessão no servidor mas não exibe o ambiente de trabalho.
- **Pastas removidas de `(authenticated)`**: `selecionar-perfil`, `sem-clinica` e `configurar-clinica` foram removidas do grupo autenticado para evitar conflito de rotas.

### Proteção em camadas

| Camada | Mecanismo | Ação sem sessão |
|---|---|---|
| 1 — Proxy (borda) | `proxy.ts` → `updateSession()` | Redireciona para `/login` |
| 2 — Layout server | `layout.tsx` com `getUser()` | `redirect('/login')` |
| 3 — Banco (RLS) | Políticas em todas as tabelas | Bloqueia leitura/escrita |

### RLS auditado

Todas as 8 tabelas do schema `public` possuem RLS habilitado. Políticas verificadas:
- Nenhuma política com role `anon`.
- Políticas de SELECT/UPDATE/INSERT restritas a `authenticated`.
- Isolamento multiclínica via `user_id` e `clinic_id` nas condições das políticas.

### Build de produção após correção

- 0 erros de TypeScript.
- 0 erros de ESLint (4 warnings pré-existentes — `<img>` em auth-shell e login-form).
- 33 páginas geradas com sucesso.
- `ƒ Proxy (Middleware)` confirmado ativo no output do build.

## Reestruturação conceitual da plataforma (Definida — 18/07/2026)

- O projeto oficial, a branch `main`, o vínculo da Vercel, o domínio de produção e o Project Ref do Supabase foram reconfirmados antes da tarefa.
- A base implementada permanece composta por `user_profiles`, `clinics`, `clinic_units`, `roles`, `clinic_memberships`, `clinic_invitations`, `user_active_contexts` e `audit_logs`.
- Foi definido documentalmente o modelo-alvo que separa conta, pessoa, usuário da clínica, função, permissão, perfil de acesso e profissional.
- Foram definidas cardinalidades para múltiplas funções, unidades e perfis por usuário da clínica, além de profissionais com ou sem conta.
- Funções padrão serão modelos copiados para cada clínica; sua existência não cria usuários, senhas ou contas fictícias.
- Todo novo Login concluído deverá, em etapa futura, passar pela seleção de perfil, inclusive quando houver apenas uma opção.
- A migração futura será aditiva e retrocompatível. Nenhuma tabela, função, RLS ou fluxo de autenticação foi alterado nesta definição.
- Documentos específicos foram criados em `docs/03-modules/clinic-access/` para o modelo conceitual, usuários, profissionais, funções e permissões, perfis de acesso, unidades e vínculos.
- A validação documental, o ESLint, o TypeScript e o build de produção foram aprovados; o lint manteve quatro avisos preexistentes sobre imagens.
- Estado: **Definido documentalmente; ainda não implementado no banco ou na aplicação.**

## Onboarding guiado — fundação de persistência (Validada no Supabase — 19/07/2026)

- Criada a migração aditiva `20260718120000_clinic_onboarding_progress.sql`.
- A tabela `clinic_onboarding_progress` preserva rascunhos das cinco etapas de dados e prepara a sexta etapa de conclusão.
- Funções `start_or_resume_clinic_onboarding`, `save_clinic_onboarding_step` e `cancel_clinic_onboarding` usam `auth.uid()`, `security definer` e `search_path` explícito.
- RLS limita leitura ao próprio usuário e não há concessão de escrita direta para `authenticated`.
- Ordem das etapas, consistência de conclusão/cancelamento, tamanho do payload, revisão e rascunho ativo único possuem restrições.
- Criado `003_clinic_onboarding_progress.sql` para testar contrato, idempotência, persistência, ordem, isolamento e cancelamento com rollback.
- Documentação do módulo criada em `docs/03-modules/clinic-onboarding/`.
- Validação da aplicação: integridade documental aprovada, TypeScript aprovado, ESLint sem erros e build aprovado com 34 páginas.
- Estado remoto: **migração aplicada e contrato aprovado no Supabase oficial** com `clinic_onboarding_progress_ok`.
- A aplicação foi executada pelo SQL Editor; o histórico da Supabase CLI não foi alterado artificialmente e deverá ser reconciliado antes de um futuro fluxo por CLI.
- A primeira execução do teste expôs apenas um problema de tipagem no próprio contrato; as chamadas foram corrigidas com `::smallint` e aprovadas na execução seguinte.
- O teste executou com `rollback`, sem preservar usuários ou rascunhos artificiais.
- Interface e conclusão transacional ainda não implementadas.

### API e validação do rascunho

- Criados schemas Zod estritos em `lib/clinic-onboarding.ts` para as cinco etapas de dados.
- Criada `/api/clinic-onboarding` com consulta, início/retomada, gravação e cancelamento.
- A API exige sessão, recusa contas com vínculo ativo e retorna respostas privadas sem cache.
- O payload validado é normalizado antes da chamada às funções do banco.
- Smoke test de schemas, TypeScript, ESLint e build foram aprovados; o build contém 35 rotas/páginas.
- A API é consumida pela interface técnica guiada de `/configurar-clinica`.

### Interface técnica guiada

- O formulário curto foi substituído por cinco formulários de dados e uma sexta etapa de preparação.
- A tela consulta o rascunho ativo e inicia um novo somente quando necessário.
- O passo atual e os dados salvos são retomados após nova abertura da rota.
- Etapas anteriores podem ser revisadas; etapas futuras permanecem desabilitadas.
- Cada gravação atualiza a revisão exibida com a resposta do servidor.
- O cancelamento exige confirmação em duas ações, preserva o histórico e permite iniciar outro rascunho.
- A etapa 6 não cria clínica, unidade, vínculo ou função; a conclusão transacional permanece pendente.
- O visual é técnico e temporário, sem mudança no Design System.
- ESLint e build de produção foram aprovados; o build contém 35 rotas/páginas e o lint mantém quatro avisos preexistentes.
