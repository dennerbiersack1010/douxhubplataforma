---
title: Registro Geral de Alterações
document_id: PRJ-005
version: 0.17.0
status: Em desenvolvimento
last_updated: 2026-07-19
owner: DouxHub
related_documents:
  - CURRENT_STATE.md
  - DECISIONS.md
---

# Registro de Alterações (Changelog)

Todas as alterações significativas no projeto DouxHub serão registradas neste documento.

## [Unreleased] - 19/07/2026

### Login — redução do caminho crítico

- Consolidada a resolução pós-login em `resolve_post_login_context()` com uma única chamada ao banco.
- Removidas a validação remota duplicada do endpoint e a sequência `router.push` mais `router.refresh`.
- Proxy e layouts passaram a usar `getClaims()` verificado.
- Adicionados resposta sem cache e `Server-Timing` ao endpoint.
- Contrato `005_post_login_resolution.sql` aprovado com `post_login_resolution_ok`.

### Etapa 3 — Ciclo 1

- Adicionadas tabelas de usuários da clínica, funções por clínica, atribuições, unidades e perfis de acesso.
- Adicionada cópia automática dos modelos de função para cada clínica sem criação de pessoas fictícias.
- Adicionada sincronização rastreável e retrocompatível a partir de `clinic_memberships`.
- Múltiplas funções e unidades passaram a ser representáveis sem alterar a aplicação vigente.
- Adicionadas RLS, chaves estrangeiras compostas e somente leitura para `authenticated`.
- Contrato `006_clinic_access_profiles_foundation.sql` aprovado com `clinic_access_profiles_foundation_ok`.

### Identidade global — favicon

- Substituído o favicon padrão pelo ícone oficial da DouxHub em `app/icon.png`.
- Removido o ativo anterior `app/favicon.ico` para impedir concorrência entre ícones nos navegadores.
- Preservadas todas as rotas, interfaces e regras funcionais existentes.
- Publicado pelo commit `48e614b` no deployment `dpl_5tRmT5teWrEyYmi7hRBiw2dikA4w`, estado `READY`.
- Conferido no domínio oficial: um único link de favicon e ativo PNG respondendo `200 OK` com 50.801 bytes.

### Onboarding — conclusão transacional

- Adicionada `complete_clinic_onboarding` para criar clínica, unidade, perfil, vínculo de proprietária, contexto e auditoria na mesma transação.
- A conclusão é idempotente e devolve os mesmos identificadores quando repetida.
- Adicionado `PUT /api/clinic-onboarding`, cookie HttpOnly de contexto e redirecionamento para `/dashboard`.
- A etapa 6 da interface técnica recebeu a ação explícita “Criar clínica e entrar”.
- Adicionado `004_clinic_onboarding_completion.sql` para atomicidade, repetição, isolamento e rascunho incompleto.
- A primeira execução detectou referência ambígua no caminho idempotente; a consulta foi qualificada, reaplicada e aprovada.
- Migração aplicada no Supabase oficial e teste aprovado com `clinic_onboarding_completion_ok`; dados artificiais foram desfeitos por `rollback`.
- TypeScript, ESLint e build de produção aprovados com 35 rotas/páginas.
- Commit funcional `feefa06` enviado para `origin/main` e publicado pela Vercel no deployment `dpl_DVEs9VDxi2Tb4vhiiuMboftnwGX7`, estado `READY`.
- Domínio oficial conferido: Login disponível, onboarding protegido com redirecionamento anônimo e API recusando sessão ausente sem cache.

### Onboarding — persistência

- Adicionada migração aditiva para rascunho e progresso retomável do onboarding.
- Adicionadas funções seguras para iniciar/retomar, salvar etapas ordenadas e cancelar sem apagar histórico.
- Adicionada RLS de leitura exclusiva do proprietário e removida escrita direta para usuários autenticados.
- Adicionado teste transacional de contrato, idempotência, isolamento e cancelamento.
- Criada documentação específica do módulo em `docs/03-modules/clinic-onboarding/`.
- Migração aplicada no Supabase oficial e teste transacional aprovado com `clinic_onboarding_progress_ok`.
- Corrigidas as chamadas do teste para converter explicitamente os passos para `smallint`.
- Dados artificiais da validação foram integralmente desfeitos pelo `rollback` do contrato.

### Onboarding — API e validação

- Adicionados schemas server-side para identificação, clínica, unidade, funcionamento e preparação da equipe.
- Adicionadas validações de CNPJ, CEP, fuso, horários, limites operacionais e preferências.
- Adicionada `/api/clinic-onboarding` para consultar, iniciar/retomar, salvar e cancelar o próprio rascunho.
- Contas com vínculo ativo são recusadas pelo fluxo de onboarding inicial.
- Respostas da API são privadas, sem cache e usam erros públicos estáveis.
- Smoke test dos schemas, TypeScript, ESLint e build aprovados.

### Onboarding — interface técnica guiada

- Substituído o formulário curto de `/configurar-clinica` por cinco etapas de dados e uma sexta etapa de preparação.
- Adicionadas consulta, criação idempotente e retomada automática do rascunho.
- Adicionada navegação para revisar etapas já alcançadas, mantendo etapas futuras bloqueadas.
- Adicionados estados de carregamento, gravação, erro, confirmação e rascunho cancelado.
- Cancelamento passou a exigir confirmação em duas ações e preserva o registro histórico.
- A etapa de preparação informa explicitamente que a conclusão transacional permanece pendente.
- Criada documentação da tela em `docs/02-screens/configurar-clinica/SCREEN.md`.
- Build aprovado com 35 rotas/páginas; ESLint sem erros e sem avisos novos.

### Documentação

- Registrada a tarefa de reestruturação da fundação da plataforma, preservando integralmente o histórico de autenticação.
- Definida a separação entre conta, pessoa, usuário da clínica, função, perfil de acesso e profissional.
- Definidas múltiplas funções, unidades e perfis por usuário da clínica e profissionais com ou sem conta.
- Definido o modelo de funções próprias por clínica, permissões por recurso, ação e escopo e negação explícita prioritária.
- Definida a seleção obrigatória de perfil após novos logins e a validação server-side do contexto.
- Definida a transição aditiva e retrocompatível a partir de `clinic_memberships`, sem migração ou alteração de código nesta etapa.
- Adicionadas as decisões permanentes DEC-009 a DEC-012.

### Estado

- Login, autenticação, SMTP e interfaces públicas aprovadas permanecem inalterados.
- Onboarding evoluiu documentalmente, no banco, na API e na interface técnica; a conclusão transacional permanece planejada.
- Integridade documental, TypeScript e build aprovados; ESLint sem erros e com quatro avisos preexistentes.

## [Unreleased] - 17/07/2026

### Adicionado
- **Domínio próprio:** `douxhub.space` vinculado à Vercel; `formulario.douxhub.space` preservado.
- **Domínio de autenticação no Resend:** `auth.douxhub.space` verificado na região `sa-east-1`.
- **API Key SMTP:** criada com permissão `sending_access` restrita ao domínio `auth.douxhub.space`.
- **Documentação Resend:** `docs/08-integrations/resend/` com MODULE.md, CONFIGURATION.md, AUTH_EMAILS.md, SECURITY.md e TESTS.md.
- **Route group `app/(context)/`:** criado para `/selecionar-perfil`, `/sem-clinica` e `/configurar-clinica` com layout mínimo sem sidebar, com validação server-side de sessão.
- **`app/(authenticated)/authenticated-shell.tsx`:** Client Component extraido do layout autenticado, preservando toda a lógica visual.

### Corrigido
- **Falha crítica de proteção de rotas:** `lib/supabase/middleware.ts` reescrito para usar `supabase.auth.getUser()` como única fonte de verdade (sem atalho por presença de cookie).
- **Layout autenticado sem validação server-side:** `app/(authenticated)/layout.tsx` convertido para Server Component com `redirect('/login')` antes de renderizar qualquer conteúdo.
- **`/selecionar-perfil` exibindo sidebar do dashboard:** movido para route group `(context)` com layout mínimo independente.
- **Conflito de rotas duplicadas:** pastas `selecionar-perfil`, `sem-clinica` e `configurar-clinica` removidas de `app/(authenticated)/` após migração para `app/(context)/`.

### Concluído
- **SMTP personalizado ativo no Supabase:** host `smtp.resend.com`, porta 465, sender `DouxHub <nao-responda@auth.douxhub.space>`, rate limit 100/h.
- **Site URL atualizado para `https://douxhub.space`** com redirect URLs para ambos os domínios.
- **Testes de envio real aprovados:** confirmação de cadastro e recuperação de senha com `last_event: delivered` nos logs do Resend.

### Auditado
- **RLS:** todas as 8 tabelas do schema `public` com RLS ativo e políticas restritas a `authenticated`. Nenhuma política `anon` permissiva.

### Técnico
- **Build:** 33 páginas, 0 erros TypeScript, 0 erros ESLint, `ƒ Proxy (Middleware)` ativo confirmado.


## [0.6.0] - 16/07/2026

### Adicionado
- **Primeira Clínica e Unidade:** criada a rota técnica `/configurar-clinica` e a operação transacional segura que cria clínica, unidade, proprietário, perfil, contexto e auditoria para usuários ainda sem vínculo.
- **Administração Protegida da Equipe:** criada `/configuracoes/equipe` com validação server-side de contexto e função, listagem de membros, convite, revogação, ativação, desativação e função inicial permitida.
- **Suíte de Fluxos Multiempresa:** adicionado `002_clinic_access_flows.sql`, aprovado no Supabase de produção com `clinic_access_flows_ok` e rollback dos dados fictícios.
- **Documentação do Módulo de Clínicas:** criada a pasta `docs/03-modules/clinic-access/` com objetivo, fluxos, modelo, permissões, estados, regras, testes e changelog.
- **Supabase dedicado à DouxHub:** criado projeto de produção na região de São Paulo, com autenticação pública ativa, Row Level Security automático e exposição automática de novas tabelas desabilitada.
- **Base multiempresa aplicada:** executada a migração `20260716213000_multi_tenant_clinics.sql` no Supabase de produção e aprovado o contrato `001_multi_tenant_contract.sql` com resultado `multi_tenant_contract_ok`.
- **Fundação Técnica:** Next.js 16.2.10, TypeScript, Tailwind CSS v4, Shadcn UI e ESLint.
- **Integração Supabase:** Instalação de SDKs `@supabase/supabase-js` e `@supabase/ssr`.
- **Validação de Dados:** Instalação de `zod`, `react-hook-form` e `@hookform/resolvers`.
- **Estrutura de Clientes Supabase:** Criação de `lib/supabase/client.ts`, `server.ts` e `middleware.ts`.
- **Segurança e Proteção de Rotas:** Proxy de rede (`proxy.ts`) implementado redirecionando requisições não autenticadas de `/dashboard` e outras rotas autenticadas de volta para `/login`.
- **Rotas de Autenticação Básica (Visual Temporário):** Cadastro (`/cadastro`), Login (`/login`), Recuperar senha (`/recuperar`) e Redefinir senha (`/redefinir`).
- **Layout Técnico:** Estruturação do layout geral público e do layout estrutural autenticado com suporte para sidebar, header e navegação mobile responsiva.
- **Rotas Vazias de Negócio:** `/dashboard`, `/agenda`, `/pacientes`, `/comercial`, `/tratamentos`, `/financeiro`, `/produtos`, `/prontuarios`, `/equipe`, `/automacoes`, `/whatsapp`, `/relatorios`, `/integracoes` e `/configuracoes` com tela indicativa de "Módulo ainda não implementado".
- **Documentação de Projeto:** Criação do diretório `docs/` contendo documentação técnica inicial e regras de design.
- **Ativos de Mídia:** Adicionado vídeo de introdução da marca Doux (`public/intro/doux-intro.mp4` e versão WebM otimizada `public/intro/doux-intro.webm`).
- **Introdução Audiovisual:** Desenvolvido fluxo de introdução de marca mínimo e automático em tela cheia na rota raiz (`/`) reproduzindo o vídeo `/intro/doux-intro.mp4` antes de direcionar o usuário para o Login. O vídeo utiliza `autoPlay`, `muted` e `playsInline` para assegurar compatibilidade imediata com as políticas de autoplay de navegadores modernos, redirecionando para a rota `/login` no evento de término ou falha.
- **Transição de Login Sem Flash:** Implementação de transição física local na rota raiz (`/`), montando o formulário por baixo do player e removendo o vídeo somente no evento `ended`. A URL é atualizada de forma invisível para `/login` via `window.history.replaceState`, sem carregar outra página.
- **Tela de Login Premium e Unificada:** Criação do componente `LoginForm` com suporte à fonte `Raleway` (configurada como fonte principal da aplicação), logo prateada oficial `/intro/doux-logo.png` preservada no arquivo original e enquadrada apenas por CSS, slogan com linha decorativa dourada, glassmorphism escuro com overlay de fundo clareada para 30% (`bg-black/30`), inputs transparentes, botão "Entrar" cinza claro com a seta para a direita (`ArrowRight`), rótulos em cinza claro (`text-zinc-300`) e divisória "ou" removida. A interface é adaptada à viewport sem gerar barras de rolagem.
- **Compatibilidade de Compilação:** Inclusão de fallbacks padrão nos inicializadores do Supabase Client para garantir que builds locais e deploys na Vercel compilem sem falhar por falta de variáveis de ambiente.
- **Intro em Todo Acesso à Raiz:** Removido o bloqueio por `sessionStorage`; a rota `/` agora sempre reproduz o vídeo e revela o login já pré-carregado somente no frame final, atualizando a URL para `/login` sem navegação visível.
- **Logo Oficial Restaurada:** Substituído o recorte gerado anteriormente pelo arquivo original `logotipo douxhub.png`, preservado integralmente e enquadrado apenas por CSS na tela de login.
- **Refinamento Visual do Login:** Clareada a fotografia de fundo com overlay global de 6% e degradês amplos e sutis na lateral e no rodapé. A logo foi alinhada visualmente ao slogan, os inputs passaram a manter fundo claro, o link de recuperação recebeu sublinhado sutil e o copyright passou a usar a mesma cor do texto de boas-vindas.
- **Design Unificado das Telas de Autenticação:** Adicionado o `AuthShell`, que aplica às novas rotas o mesmo fundo, logo, degradês, painel translúcido, tipografia, campos, botões e comportamento responsivo do Login aprovado.
- **Recuperação de Acesso:** Finalizada a rota `/recuperar` com validações, carregamento, prevenção de envio duplicado, mensagens seguras de sucesso e erro e envio do link de recuperação do Supabase para `/redefinir`.
- **Redefinição de Senha:** Finalizada a rota `/redefinir` com validação de sessão e código, tratamento de token inválido ou expirado, mostrar/ocultar senhas, validação de requisitos e igualdade, atualização segura e retorno automático ao Login após o sucesso.
- **Primeiro Acesso por Convite:** Criada a rota `/primeiro-acesso` com validação de convites Supabase, e-mail somente leitura, nome, criação de senha, aceite obrigatório dos termos e conclusão do acesso sem onboarding adicional.
- **Rotas de Sessão Temporária:** Ajustado o proxy para permitir que recuperação e convite concluam seus fluxos sem redirecionamento prematuro ao Dashboard, mantendo a proteção das rotas internas.
- **Validação Técnica do Bloco de Autenticação:** ESLint executado sem erros, TypeScript aprovado, build de produção concluído e responsividade conferida em desktop, notebook, tablet e mobile. Os estados locais, de tokens inválidos/expirados e a criação real de conta foram validados; confirmação de e-mail, recuperação, redefinição e convite válido permanecem pendentes.
- **Ambiente de Produção:** Configuradas na Vercel as variáveis públicas `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` já existentes no ambiente local, sem alteração do `.env.local` e sem exposição de valores.
- **Base Multiempresa Versionada:** Criada migração Supabase com clínicas, unidades, perfis de usuário, vínculos, funções, convites, contexto ativo e auditoria.
- **Funções de Clínica:** Implementadas `clinic_owner`, `clinic_admin` e `clinic_employee`; funções operacionais futuras foram preparadas como inativas. Nenhuma função do DouxHub Control foi criada.
- **RLS Multiempresa:** Adicionadas políticas de isolamento e funções seguras para impedir acesso entre clínicas e retirar do frontend a autoridade sobre vínculo, convite e permissões.
- **Resolução Pós-login:** O Login passou a decidir o destino com base nos vínculos ativos: sem clínica, seleção automática ou Seleção de Perfil.
- **Contexto Ativo Seguro:** Adicionada persistência server-side em `user_active_contexts`, cookie `HttpOnly` para roteamento e auditoria das trocas de contexto.
- **Seleção de Perfil Temporária:** Criada `/selecionar-perfil` com lógica funcional e interface técnica explicitamente temporária.
- **Estado Sem Clínica:** Criada `/sem-clinica` para contas autenticadas sem vínculo ativo.
- **Administração Técnica da Clínica:** Criada `/administracao-clinica` para dados básicos, membros, convites, ativação, desativação e função inicial.
- **Convite Integrado:** Tokens aleatórios passam a ser armazenados somente como hash, com validação do destinatário e integração opcional de envio server-side pelo Supabase Auth.
- **Primeiro Acesso Multiempresa:** O aceite do convite cria o vínculo apenas após validar autenticação, token, e-mail, validade e uso anterior.
- **Auditoria Mínima:** Registradas criação de clínica, convites, aceite, mudança de função, ativação, desativação e troca de contexto.
- **Segurança e Testes de Contrato:** Adicionados `docs/02-security/MULTI_TENANT_SECURITY.md` e `supabase/tests/001_multi_tenant_contract.sql`.
- **Validação Multiusuário:** aprovados os cenários de zero, um e múltiplos vínculos, isolamento entre clínicas, hierarquia das funções, convites e auditoria no Supabase de produção.

### Alterado
- **Produção:** publicada a base ampliada de acesso às clínicas no domínio oficial, preservando a introdução e o Login aprovados e protegendo as novas rotas autenticadas.
- **Resolução Pós-login:** usuário novo sem vínculo segue para `/configurar-clinica`; vínculo único continua automático; múltiplos vínculos seguem para `/selecionar-perfil`; vínculos somente inativos seguem para `/sem-clinica`.
- **Convites e Hierarquia:** a entidade passou a se chamar `clinic_invitations`; proprietário pode gerenciar administradores e colaboradores, enquanto administrador gerencia somente colaboradores.
- **Configuração Supabase:** substituídas as variáveis públicas locais e do ambiente Production da Vercel pelo endereço e pela chave pública do projeto válido, sem expor valores sensíveis.
- **Ação para novos usuários:** o Login recebeu a chamada “Ainda não tem uma conta?” com o botão secundário “Criar minha conta”, conectado à rota `/cadastro` existente.
- **Ambiente de produção:** correção da introdução e nova ação de cadastro publicadas no endereço oficial `https://douxhubplataforma.vercel.app/`.
- **Visual do cadastro:** a rota `/cadastro` passou a reutilizar temporariamente a mesma identidade visual do Login por meio do `AuthShell`, preservando o fluxo funcional existente e adicionando controle acessível de visibilidade da senha.
- **Cadastro em produção:** a apresentação padronizada foi publicada no endereço oficial e teve rota, conteúdo principal e navegação de retorno confirmados.

### Corrigido
- **Validade de Convites:** eliminada a ambiguidade do campo `expires_at` nas funções PostgreSQL.
- **Criptografia de Convites:** ajustado o `search_path` seguro das funções para acessar a extensão criptográfica sem ampliar permissões.
- **Cadastro indisponível:** removida a dependência do antigo host Supabase sem resolução DNS; o cadastro voltou a criar contas no ambiente oficial.
- **Migração multiempresa:** corrigidas duas atribuições SQL incompatíveis com variáveis do tipo `record`, permitindo aplicar integralmente a migração no PostgreSQL do Supabase.
- **Mensagem de conectividade:** falhas de rede no cadastro agora exibem uma orientação compreensível em vez de `Failed to fetch`.
- **Carregamento da introdução:** arquivos `.mp4` e `.webm` foram retirados da interceptação do proxy, impedindo que a mídia pública fosse redirecionada indevidamente para o Login. Foram adicionados ouvintes nativos e uma confirmação idempotente nos 20 milissegundos finais, cobrindo também o término anterior à hidratação da interface.

### Segurança
- **Isolamento Validado:** confirmadas por RLS as recusas de leitura e alteração entre clínicas e de gestão por colaborador.
- **Proteção de Convites:** validados destinatário, hash do token, duplicidade, expiração, revogação, aceite único e prevenção de reutilização.
- **Proteção do Proprietário:** proprietário não pode ser desativado nem ter a função alterada pelo fluxo de equipe.

### Documentação
- **Validação Publicada:** registrado o resultado das verificações da entrada pública, autenticação e proteção das novas rotas no ambiente oficial.
- **Acesso às Clínicas:** atualizados estado atual, próxima etapa, autenticação, segurança multiempresa, integrações e documentação específica do módulo.
- **Governança documental:** adicionadas regras resumidas ao `AGENTS.md`, criado `docs/DOCUMENTATION_GUIDE.md`, incluídos metadados padronizados e iniciada a documentação das telas de Introdução e Login e do módulo de Autenticação.
- **Estrutura:** o documento de segurança multiempresa foi realocado para `docs/05-security/`, sem perda de conteúdo.
- **Tela de cadastro:** criada a documentação específica em `docs/02-screens/cadastro/SCREEN.md` e atualizados os documentos relacionados ao Login e à autenticação.
- **Design System:** criados documentos específicos para tokens, tipografia, cores, espaçamento, componentes, movimento e acessibilidade, registrando apenas padrões existentes e pendências de aprovação.
- **Áreas documentais:** adicionados documentos de escopo para Doux, prompts, arquitetura, local-first, integrações, operações e notas de versão, com recursos futuros marcados como planejados.
- **Autenticação:** adicionados documentos de permissões, estados, regras de negócio e testes, separando validações locais dos cenários remotos pendentes.
- **Decisões:** DEC-001 a DEC-007 convertidas para o formato padronizado de contexto, decisão e consequências, sem alteração de conteúdo ou numeração.
- **Estado do projeto:** corrigidas descrições antigas das telas públicas e substituído “concluída” por estados compatíveis com implementação, produção e validações pendentes.
