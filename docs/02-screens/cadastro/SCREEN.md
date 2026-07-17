---
title: Tela de Cadastro
document_id: SCR-CADASTRO-001
version: 0.3.0
status: Em produção
last_updated: 2026-07-16
owner: DouxHub
related_documents:
  - ../login/SCREEN.md
  - ../../03-modules/authentication/MODULE.md
  - ../../01-design-system/DESIGN_SYSTEM.md
---

# Tela de Cadastro

## Objetivo

Permitir a criação inicial de uma conta DouxHub preservando a mesma identidade visual aprovada para o Login enquanto o fluxo definitivo de aquisição e vínculo com clínicas ainda não foi definido.

## Conteúdo e hierarquia

A tela reutiliza o fundo fotográfico, a logo oficial, os degradês, o slogan, o painel translúcido, os campos claros e o botão principal do conjunto visual de autenticação. O formulário contém nome completo, e-mail e senha, seguido do retorno para usuários que já possuem conta e do aviso de proteção de dados.

## Ações e estados

- `Criar minha conta`: envia o cadastro ao Supabase Auth;
- `Mostrar senha` e `Ocultar senha`: alternam a visibilidade do campo;
- `Entrar`: retorna para `/login`;
- validação: apresenta mensagens abaixo dos campos;
- carregamento: bloqueia novo envio e apresenta indicador no botão;
- sucesso: orienta a confirmação do e-mail e oferece retorno ao Login;
- erro: apresenta mensagem no painel sem remover os dados já informados; falhas de conectividade exibem a orientação “Não foi possível conectar ao serviço de cadastro. Tente novamente em instantes.”, sem expor mensagens técnicas.

## Responsividade e acessibilidade

Desktop mantém a composição em duas colunas. Mobile reorganiza marca e formulário verticalmente com rolagem vertical quando necessária, sem overflow horizontal. Os campos possuem rótulos visíveis e o controle de senha possui nome acessível.

## Limites atuais

O visual é uma extensão temporária e deliberada do Login. O fluxo de cadastro definitivo, incluindo critérios comerciais e criação ou solicitação de clínica, ainda não foi definido.

## Critérios de aprovação

- identidade visual coerente com o Login;
- campos claros permanecem visíveis durante edição;
- validação, carregamento, sucesso e erro permanecem funcionais;
- retorno ao Login funciona;
- não há overflow horizontal nas viewports suportadas.
