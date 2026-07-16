# Registro de Alterações (Changelog)

Todas as alterações significativas no projeto DouxHub serão registradas neste documento.

## [Unreleased] - 16/07/2026

### Adicionado
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
- **Transição de Login Sem Flash:** Implementação de transição física local na rota raiz (`/`), montando o formulário por baixo do player de vídeo e ocultando o player de forma instantânea 120ms antes do final do vídeo. Atualiza a URL de forma invisível para `/login` via `window.history.replaceState` e gerencia a frequência de exibição com `sessionStorage` para rodar o vídeo apenas na primeira visita da sessão.
- **Tela de Login Premium e Unificada:** Criação do componente `LoginForm` com suporte à fonte `Raleway` (configurada como fonte principal da aplicação), logo prateada oficial `/intro/doux-logo.png` recortada via script PIL para remover margens vazias e exibida em tamanho ampliado no topo esquerdo, slogan com linha decorativa dourada, glassmorphism escuro com overlay de fundo clareada para 30% (`bg-black/30`), inputs transparentes, botão "Entrar" cinza claro com a seta para a direita (`ArrowRight`), rótulos em cinza claro (`text-zinc-300`) e divisória "ou" removida. A interface é 100% fiel à imagem de referência e adaptada à viewport sem gerar barras de rolagem.
- **Compatibilidade de Compilação:** Inclusão de fallbacks padrão nos inicializadores do Supabase Client para garantir que builds locais e deploys na Vercel compilem sem falhar por falta de variáveis de ambiente.
