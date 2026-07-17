---
title: Testes da Integração Resend
document_id: INT-RESEND-005
version: 0.1.0
status: Em desenvolvimento
last_updated: 2026-07-17
owner: DouxHub
related_documents:
  - MODULE.md
  - AUTH_EMAILS.md
  - ../../03-modules/authentication/TESTS.md
---

# Testes da Integração Resend

## Pré-requisitos para os testes

- Domínio `auth.douxhub.space` verificado no Resend (DKIM, SPF e MX)
- API Key de envio criada no Resend
- SMTP personalizado ativo e salvo no Supabase Auth
- Endereços de e-mail reais e distintos disponíveis para os testes

## Testes obrigatórios

### 1. Novo cadastro e confirmação de e-mail

- [ ] Criar nova conta em `/cadastro` com e-mail real
- [ ] Verificar que o e-mail de confirmação foi enviado
- [ ] Verificar o recebimento na caixa de entrada (e em spam)
- [ ] Confirmar que o remetente é `DouxHub <...@auth.douxhub.space>`
- [ ] Confirmar que o domínio do link de confirmação é correto
- [ ] Clicar no link e confirmar a conta
- [ ] Fazer login após a confirmação
- [ ] Remover o usuário de teste após a validação

### 2. Recuperação de senha

- [ ] Solicitar recuperação em `/recuperar` com e-mail existente
- [ ] Verificar que o e-mail de recuperação foi enviado
- [ ] Verificar o recebimento na caixa de entrada (e em spam)
- [ ] Confirmar que o remetente é `DouxHub <...@auth.douxhub.space>`
- [ ] Confirmar que o link aponta para `/redefinir`
- [ ] Clicar no link e redefinir a senha com sucesso
- [ ] Fazer login com a nova senha

### 3. Reenvio de confirmação

- [ ] Verificar se o fluxo de reenvio de confirmação está disponível
- [ ] Testar o reenvio quando aplicável
- [ ] Confirmar que o e-mail reenviado chega corretamente

### 4. Tentativas inválidas

- [ ] Solicitar recuperação com e-mail inexistente — confirmar mensagem segura (sem revelar existência)
- [ ] Tentar confirmar com link expirado — confirmar tratamento correto
- [ ] Tentar confirmar com link inválido — confirmar tratamento correto

### 5. Múltiplos destinatários

- [ ] Testar envio para pelo menos dois endereços diferentes
- [ ] Confirmar que o limite anterior de dois e-mails por hora não bloqueia os envios
- [ ] Confirmar que cada usuário recebe apenas o seu e-mail

### 6. Segurança e ausência de erros

- [ ] Confirmar ausência de segredos expostos no código HTML dos e-mails
- [ ] Confirmar ausência de erros no console do navegador durante os fluxos
- [ ] Confirmar ausência de erros nos logs do Supabase Auth
- [ ] Confirmar ausência de erros nos logs do painel do Resend
- [ ] Confirmar que a API Key não aparece em nenhuma resposta de rede

## Verificações pós-teste

- [ ] Remetente correto em todos os e-mails
- [ ] Domínio correto nos links de todos os e-mails
- [ ] Ausência de URLs do Supabase expostas nos links
- [ ] Ausência de links quebrados ou com parâmetros incorretos

## Resultados (a preencher após os testes)

| Cenário | Resultado | Data | Observações |
|---|---|---|---|
| Novo cadastro e confirmação | Pendente | — | — |
| Recuperação de senha | Pendente | — | — |
| Reenvio de confirmação | Pendente | — | — |
| Tentativas inválidas | Pendente | — | — |
| Múltiplos destinatários | Pendente | — | — |
| Ausência de erros e segredos | Pendente | — | — |

## Pendências identificadas

- Verificação do domínio no painel Resend
- Criação da API Key com permissão de envio
- Configuração do SMTP personalizado no Supabase
- Execução dos testes com e-mails reais
