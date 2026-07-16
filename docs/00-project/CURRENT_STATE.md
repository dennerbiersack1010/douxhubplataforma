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

Implementação do fluxo de introdução de marca em tela cheia na rota inicial (`/`) antes do login:
- **Componentes do Cliente:**
  - `components/brand-intro/brand-intro.tsx`: Player de vídeo em tela cheia com autoplay estrito. Se a reprodução com som for bloqueada pelo navegador, ele altera o vídeo para silencioso (`muted = true`) e retoma a reprodução automaticamente, sem telas de interação, cliques ou botões de pular.
  - `components/brand-intro/intro-gate.tsx`: Controle de sessão via `sessionStorage` (chave `doux_intro_seen`), detecção de preferências de redução de movimento (`prefers-reduced-motion`) e inicialização silenciosa em tela preta para evitar flashes visuais.
- **Roteamento:**
  - A rota raiz `/` renderiza o `IntroGate` para usuários não-autenticados, garantindo que o vídeo seja exibido apenas uma vez por sessão do navegador (via sessionStorage) e depois conduza o usuário diretamente para `/login`.
  - Usuários autenticados continuam sendo redirecionados diretamente ao `/dashboard` a partir do servidor.

## Observações Importantes (Status de Design e Negócio)

- **Design System:** O Design System definitivo ainda não foi definido.
- **Telas de Autenticação:** As telas de autenticação atuais são temporárias.
- **Aprovação Visual:** Nenhuma tela visual definitiva foi aprovada.
- **Módulos de Negócio:** Nenhum módulo de negócio foi implementado.
