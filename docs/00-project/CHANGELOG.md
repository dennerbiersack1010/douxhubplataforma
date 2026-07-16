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
