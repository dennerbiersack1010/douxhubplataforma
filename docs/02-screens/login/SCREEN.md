---
title: Tela de Login
document_id: SCR-LOGIN-001
version: 1.2.0
status: Em produção
last_updated: 2026-07-19
owner: DouxHub
related_documents:
  - ../intro/SCREEN.md
  - ../cadastro/SCREEN.md
  - ../../03-modules/authentication/FLOWS.md
  - ../../01-design-system/DESIGN_SYSTEM.md
---

# Tela de Login

## Objetivo

Autenticar usuários da DouxHub e oferecer caminhos claros para recuperação de senha e criação de conta.

## Conteúdo e hierarquia

A tela aprovada utiliza fotografia de fundo, logo oficial, slogan, painel translúcido, campos de e-mail e senha, opção de lembrar acesso, recuperação de senha, ação principal “Entrar”, ação secundária de cadastro e aviso de proteção de dados.

## Ações

- `Entrar`: autentica e resolve o contexto ativo da clínica;
- `Esqueci minha senha`: abre `/recuperar`;
- `Criar minha conta`: abre `/cadastro` a partir da chamada “Ainda não tem uma conta?”. O cadastro reutiliza temporariamente a mesma linguagem visual do Login.

A ação de cadastro usa contorno claro, dimensão reduzida e menor ênfase que o botão principal para preservar a hierarquia do Login.

## Estados

- padrão: campos claros e vazios;
- validação: mensagem específica sob o campo;
- carregando: envio bloqueado e indicador no botão principal;
- erro de autenticação ou contexto: aviso no painel;
- sucesso: redirecionamento conforme vínculos ativos.

O indicador permanece ativo durante a resolução do contexto e é encerrado pela navegação seguinte. O fluxo não dispara mais uma atualização adicional da rota após o redirecionamento.

## Responsividade e acessibilidade

Desktop distribui marca e painel em duas colunas. Mobile mantém o formulário acessível na viewport. Campos possuem rótulos visíveis, ações são navegáveis por teclado e ícones não substituem o texto essencial.

## Critérios de aprovação

- campos mantêm fundo claro ao preencher ou apagar;
- recuperação e cadastro possuem foco visível e destino correto;
- o botão de cadastro não compete com “Entrar”;
- não há rolagem horizontal nas viewports suportadas;
- autenticação preserva mensagens de erro e resolução multiempresa.
