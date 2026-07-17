---
title: Visão Geral do Projeto DouxHub
document_id: PRJ-001
version: 0.3.0
status: Em desenvolvimento
last_updated: 2026-07-16
owner: DouxHub
related_documents:
  - CURRENT_STATE.md
  - NEXT_STEP.md
  - DECISIONS.md
  - ../07-architecture/ARCHITECTURE.md
  - ../04-doux/OVERVIEW.md
---

# DouxHub

DouxHub é uma plataforma operacional completa para clínicas de estética, projetada para otimizar a gestão de ponta a ponta e unificar a operação em um único ecossistema inteligente.

## Visão e objetivos

A plataforma busca concentrar a rotina clínica, administrativa, comercial e financeira em uma experiência consistente, segura e preparada para múltiplas clínicas e unidades. Seus objetivos são reduzir fragmentação operacional, preservar o histórico dos pacientes, apoiar decisões e automatizar tarefas recorrentes.

## Públicos

- proprietários e administradores de clínicas;
- colaboradores administrativos e recepção;
- profissionais clínicos;
- equipes comercial, financeira e de estoque;
- pacientes, apenas nos fluxos que vierem a ser definidos para interação externa.

## Ambientes e distribuição

A aplicação web é construída com Next.js e distribuída atualmente pela Vercel. O backend de autenticação e dados é preparado para Supabase. Uma distribuição desktop e o funcionamento local-first fazem parte da visão arquitetural, mas ainda não estão implementados nem validados.

## Visão arquitetural

A base atual utiliza frontend web com rotas públicas e autenticadas, autenticação Supabase, banco PostgreSQL com Row Level Security (RLS) e modelo multiempresa por clínica. Autorizações não devem depender somente do navegador. A arquitetura futura deverá prever sincronização segura entre dados locais e remotos, conflitos e operação offline, sem assumir esses recursos como existentes hoje.

## Módulos Integrados

A plataforma integrará os seguintes módulos e funcionalidades:
- **Agenda:** Gestão de consultas, profissionais e salas.
- **Pacientes:** Prontuário eletrônico completo, histórico de tratamentos e anamnese.
- **Comercial:** CRM inovador personalizado para estética (sem usar o modelo Kanban tradicional).
- **Tratamentos:** Registro de sessões, evolução de tratamentos e procedimentos executados.
- **Financeiro:** Controle de caixa, comissões, faturamento e contas a pagar/receber.
- **Produtos:** Gestão de estoque de insumos e produtos para revenda.
- **Prontuários:** Assinatura digital, fotos de evolução antes/depois e termos de consentimento.
- **Equipe:** Permissões de acesso, agendas de profissionais e metas de vendas.
- **Automações:** Mensagens automáticas de pós-procedimento, lembretes de retorno e aniversários.
- **WhatsApp:** Integração nativa para comunicação centralizada com o paciente.
- **Relatórios:** Dashboards analíticos de produtividade, faturamento e conversão do comercial.
- **Doux (Voz):** Assistente de inteligência artificial operado por voz integrado a toda a plataforma.

## Diferenciais definidos

- operação integrada para o segmento de estética;
- CRM sem o modelo tradicional de colunas Kanban;
- isolamento de dados entre clínicas;
- evolução clínica preparada para imagens, vídeos e documentos;
- assistente Doux integrado à plataforma e preparado para comandos de voz.

## DouxHub Control

O DouxHub Control será o ambiente global de propriedade e operação da plataforma. Ele não está implementado nesta etapa. Funções globais, painel do proprietário e modo suporte devem ser definidos e documentados antes da implementação.

## Doux

Doux é a inteligência artificial planejada para atuar de forma transversal na plataforma, inclusive por voz. Sua arquitetura, permissões, privacidade e limites operacionais ainda exigem definição específica antes do desenvolvimento funcional.

## Local-first, web e desktop

A experiência atual é web e depende dos serviços remotos configurados. Local-first, sincronização, resolução de conflitos, backup local e empacotamento desktop permanecem planejados e não devem ser tratados como implementados.
