---
title: Operações da Plataforma
document_id: OPS-001
version: 0.4.0
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

O endereço próprio `douxhub.space` está associado ao projeto da plataforma. O DNS é administrado pela Hostinger. `auth.douxhub.space` está verificado no Resend e o SMTP personalizado está ativo no Supabase.

O auto-deploy do GitHub não é considerado confiável no estado atual. Após cada push funcional, a publicação deve ser executada manualmente no projeto Vercel vinculado, acompanhada até `READY`, e os aliases e testes do domínio devem ser registrados. A entrega do Ciclo 4 do onboarding foi publicada no deployment `dpl_DVEs9VDxi2Tb4vhiiuMboftnwGX7`.

## Rotina mínima de publicação

1. validar lint, TypeScript e build;
2. testar os fluxos afetados em viewport aplicável;
3. publicar no ambiente oficial;
4. conferir rota e conteúdo essenciais;
5. atualizar estado, changelog e documento da funcionalidade.

## Pendências

Monitoramento, alertas, rollback formal, backup operacional, suporte e resposta a incidentes ainda não possuem processo definitivo. O modo suporte do futuro DouxHub Control não está implementado.
