---
title: Operações da Plataforma
document_id: OPS-001
version: 0.3.0
status: Em desenvolvimento
last_updated: 2026-07-17
owner: DouxHub
related_documents:
  - ../00-project/CURRENT_STATE.md
  - ../08-integrations/INTEGRATIONS.md
  - ../05-security/MULTI_TENANT_SECURITY.md
---

# Operações da Plataforma

## Ambiente atual

A aplicação web é publicada na Vercel e utiliza um projeto Supabase dedicado na região de São Paulo. O ambiente Production possui somente as variáveis públicas necessárias à aplicação; valores de chaves, senhas e tokens não devem ser copiados para a documentação. Builds de produção executam compilação do Next.js e verificação TypeScript.

O endereço próprio `douxhub.space` está associado ao projeto da plataforma. O DNS é administrado pela Hostinger. `auth.douxhub.space` está reservado ao Resend e permanece pendente de verificação DNS antes da ativação do SMTP no Supabase.

## Rotina mínima de publicação

1. validar lint, TypeScript e build;
2. testar os fluxos afetados em viewport aplicável;
3. publicar no ambiente oficial;
4. conferir rota e conteúdo essenciais;
5. atualizar estado, changelog e documento da funcionalidade.

## Pendências

Monitoramento, alertas, rollback formal, backup operacional, suporte e resposta a incidentes ainda não possuem processo definitivo. O modo suporte do futuro DouxHub Control não está implementado.
