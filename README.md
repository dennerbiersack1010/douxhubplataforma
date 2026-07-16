# DouxHub - Plataforma Operacional para Clínicas de Estética

Este é o repositório oficial da plataforma **DouxHub**, uma solução completa de gestão operacional e técnica para clínicas de estética que integra agendamento, prontuário, CRM inteligente, automações e uma inteligência artificial inovadora operada por voz (Doux).

## Requisitos do Sistema

- **Next.js 15+ (App Router)**
- **Tailwind CSS v4**
- **TypeScript**
- **Supabase (Database & Auth)**

## Estrutura do Repositório

- `app/`: Contém as páginas, rotas e componentes da aplicação utilizando o padrão de App Router do Next.js.
  - `(authenticated)/`: Painel protegido para usuários logados.
  - Outras rotas públicas como `/login`, `/cadastro`, `/recuperar` e `/redefinir`.
- `components/`: Componentes globais e UI reutilizáveis (gerenciados pelo Shadcn UI).
- `docs/`: Pasta oficial contendo a especificação do projeto, decisões arquiteturais, sistema de design e histórico de alterações.
- `lib/`: Código de integração técnica (ex: Supabase client, utilitários globais).

## Configuração do Ambiente

1. Copie o arquivo `.env.example` para `.env.local` na raiz do projeto:
   ```bash
   cp .env.example .env.local
   ```
2. Insira suas credenciais do Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://sua-url-do-supabase.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
   ```
3. Instale as dependências:
   ```bash
   npm install
   ```
4. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## Orientação para IAs / Agentes Autónomos

Antes de realizar qualquer commit ou alteração no código, leia atentamente as instruções descritas no arquivo [AGENTS.md](file:///C:/Users/denne/.gemini/antigravity-ide/scratch/douxhubplataforma/AGENTS.md).
