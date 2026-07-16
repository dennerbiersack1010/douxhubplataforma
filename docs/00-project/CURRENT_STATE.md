# Estado Atual (Current State)

## Etapa 1: Fundação Técnica e Estrutura Inicial (Concluída em 16/07/2026)

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
- **Páginas de Autenticação (Visual Temporário):**
  - `/login`: Tela de login básica
  - `/cadastro`: Tela de registro inicial
  - `/recuperar`: Tela de solicitação de recuperação de senha
  - `/redefinir`: Tela de redefinição de senha
- **Rotas Protegidas (Módulos Vazios):**
  - `/dashboard`, `/agenda`, `/pacientes`, `/comercial`, `/tratamentos`, `/financeiro`, `/produtos`, `/prontuarios`, `/equipe`, `/automacoes`, `/whatsapp`, `/relatorios`, `/integracoes`, `/configuracoes`
  - Cada rota exibe uma página padrão com a mensagem `"Módulo ainda não implementado."`

### 3. Layouts Globais
- **Layout Público (`app/layout.tsx`):** Estrutura global contendo fontes e estilos básicos do Tailwind.
- **Layout Autenticado (`app/(authenticated)/layout.tsx`):** Estrutura técnica incluindo área reservada para Sidebar, Header, Área de Conteúdo Principal e suporte a navegação mobile responsiva.

### 4. Ativos de Mídia
- **Vídeo de Introdução (Doux Intro):** Arquivo de introdução inserido em `public/intro/doux-intro.mp4` e sua versão otimizada em `public/intro/doux-intro.webm`.

## Etapa 2: Introdução Audiovisual (Concluída em 16/07/2026)

Implementação do fluxo mínimo e automático de introdução de marca em tela cheia na rota inicial (`/`) antes do login:
- **Fluxo e Roteamento:**
  - A página raiz `app/page.tsx` executa como um Client Component que exibe o vídeo `/intro/doux-intro.mp4` em tela cheia, com fundo preto e sem qualquer interface sobreposta (textos ou botões).
  - O vídeo possui os atributos `autoPlay`, `muted` (para viabilizar o autoplay sem interação nas diretrizes dos navegadores modernos) e `playsInline`.
  - Ao término da reprodução (`onEnded`) ou em caso de erro de carregamento (`onError`), o usuário é redirecionado imediatamente para a rota `/login`.

## Observações Importantes (Status de Design e Negócio)

- **Design System:** O Design System definitivo ainda não foi definido.
- **Telas de Autenticação:** As telas de autenticação atuais são temporárias.
- **Aprovação Visual:** Nenhuma tela visual definitiva foi aprovada.
- **Módulos de Negócio:** Nenhum módulo de negócio foi implementado.
