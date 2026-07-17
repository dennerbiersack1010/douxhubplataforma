---
title: Registro de Integrações
document_id: INT-001
version: 0.5.0
status: Em desenvolvimento
last_updated: 2026-07-17
owner: DouxHub
related_documents:
  - ../00-project/PROJECT.md
  - ../03-modules/authentication/MODULE.md
  - ../07-architecture/ARCHITECTURE.md
  - resend/MODULE.md
---

# Registro de Integrações

## Integrações atuais

- **Supabase:** autenticação e base de dados conectadas a um projeto dedicado e saudável na região de São Paulo. A criação de conta, o contrato estrutural e os fluxos multiusuário de RLS foram validados remotamente. Os fluxos ponta a ponta com links reais de e-mail permanecem pendentes. Sem `SUPABASE_SERVICE_ROLE_KEY` no servidor, a aplicação prepara o convite e seu link, mas não solicita o envio automático pelo Supabase Auth.
- **Vercel:** distribuição da aplicação web no endereço oficial da DouxHub.
- **Domínio próprio:** `douxhub.space` está vinculado ao projeto web da plataforma. O subdomínio `formulario.douxhub.space` permanece isolado no projeto anterior.
- **Resend:** `auth.douxhub.space` está configurado como domínio de autenticação. Os registros DKIM (`resend._domainkey.auth.douxhub.space`) e MX (`send.auth.douxhub.space`) foram confirmados via DNS público em 17/07/2026. O registro SPF está pendente de confirmação no painel do Resend. A verificação final do domínio no painel do Resend, a criação da API Key de envio e a configuração do SMTP personalizado no Supabase estão pendentes. Documentação completa em `docs/08-integrations/resend/`.

## Integrações planejadas

WhatsApp e outras integrações de negócio citadas na visão do produto não estão implementadas. Cada integração futura deve possuir pasta própria com finalidade, autenticação, dados enviados e recebidos, webhooks, tentativas, segurança, dependência de internet, comportamento offline e limitações.
