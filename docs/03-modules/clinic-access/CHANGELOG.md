---
title: Alterações do Módulo de Acesso às Clínicas
document_id: MOD-CLINIC-008
version: 0.6.0
status: Validado
last_updated: 2026-07-19
owner: DouxHub
related_documents:
  - MODULE.md
  - ../../00-project/CHANGELOG.md
---

# Alterações do Módulo de Acesso às Clínicas

## [0.6.0] - 19/07/2026

### Implementado

- perfil obrigatório no contexto ativo com vínculo de origem preservado;
- seleção e troca server-side auditadas;
- seleção explícita após todo Login com perfil disponível;
- invalidação do contexto após mudança relevante no vínculo;
- cookie `HttpOnly` auxiliar do perfil e compatibilidade controlada com o contrato legado.
- respostas privadas e sem cache em todos os estados da API de contexto.

### Validado

- contrato `009_active_access_profile_context.sql` aprovado com rollback integral;
- zero, um e múltiplos perfis, repetição, troca, auditoria, isolamento e revogação.
- produção `READY` no deployment `dpl_G1tQyousDG4yaN5ieXCF6r6y6a8c`, com proteção anônima e respostas sensíveis sem cache.

## [0.5.0] - 19/07/2026

### Implementado

- comparação rastreável entre vínculos vigentes e perfis sincronizados;
- listagem segura dos perfis ativos e válidos da própria conta;
- snapshot fail-closed com permissões efetivas e códigos explícitos de divergência;
- contrato server-side `GET /api/access-profiles` sem mudança de contexto ou navegação.
- tradução explícita da recusa de execução anônima do banco para `401 Unauthorized`.

### Validado

- contrato `008_access_profile_equivalence_gate.sql` aprovado com rollback integral;
- zero, um e múltiplos perfis, isolamento, inativação e manipulação de identificadores;
- autoridade de `clinic_memberships` e `user_active_contexts` preservada.
- produção `READY` no deployment `dpl_8CKaEoSvJbCzGBxESKTYchoWFhU3`, com API anônima `401` sem cache.

## [0.4.0] - 19/07/2026

### Implementado

- catálogo estável de permissões e escopos;
- matriz de concessões por função da clínica;
- concessões e negações personalizáveis por perfil;
- cálculo seguro de permissões efetivas com negação prevalente;
- RLS e leitura sem escrita direta para usuários autenticados.

### Validado

- contrato `007_clinic_permissions_foundation.sql` aprovado com rollback integral;
- isolamento, escopo, funções futuras sem concessões e retrocompatibilidade com o contexto vigente.

## [0.3.0] - 19/07/2026

### Implementado

- usuários da clínica separados do vínculo legado;
- funções copiadas e pertencentes à clínica;
- atribuições múltiplas de função e unidade;
- perfis de acesso com escopo de clínica ou unidade;
- ponte automática e rastreável a partir de `clinic_memberships`;
- RLS e leitura limitada ao próprio usuário ou gestores atuais.

### Validado

- contrato aprovado com `clinic_access_profiles_foundation_ok`;
- retrocompatibilidade, cardinalidades, isolamento e inativação sincronizada;
- nenhum usuário, senha ou colaborador fictício criado pelas funções padrão.

## [0.2.0] - 18/07/2026

### Definido

- separação entre conta, usuário da clínica, função, perfil de acesso e profissional;
- múltiplas funções, unidades e perfis por usuário da clínica;
- profissionais com ou sem conta;
- funções próprias por clínica e permissões por recurso, ação e escopo;
- seleção de perfil como contexto validado e auditado;
- transição aditiva a partir dos vínculos existentes.

### Implementação

Nenhum código ou banco foi alterado nesta versão documental.

## [0.1.0] - 16/07/2026

### Adicionado

- primeira clínica e unidade;
- contexto pós-login para zero, um ou múltiplos vínculos;
- administração técnica de membros e convites;
- rota protegida `/configuracoes/equipe`;
- revogação de convite e hierarquia entre proprietário, administrador e colaborador;
- suíte transacional de fluxos multiempresa.

### Segurança

- RLS e funções server-side para isolamento, convites, vínculos e contexto;
- hash de tokens, destinatário validado e prevenção de duplicidade, expiração e reutilização;
- correções de resolução de validade e do `search_path` criptográfico.
