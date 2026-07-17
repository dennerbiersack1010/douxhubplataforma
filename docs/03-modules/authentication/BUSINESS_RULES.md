---
title: Regras de Negócio da Autenticação
document_id: MOD-AUTH-005
version: 0.1.0
status: Implementado
last_updated: 2026-07-16
owner: DouxHub
related_documents:
  - MODULE.md
  - PERMISSIONS.md
  - ../../05-security/MULTI_TENANT_SECURITY.md
---

# Regras de Negócio da Autenticação

1. E-mails devem possuir formato válido.
2. Senhas criadas ou redefinidas devem possuir no mínimo seis caracteres no estado atual.
3. Recuperação não deve revelar se determinado e-mail existe.
4. Redefinição exige sessão ou código de recuperação válido e não direciona ao Dashboard após o sucesso.
5. Primeiro acesso exige autenticação temporária, aceite dos termos e, quando vinculado a uma clínica, convite válido, não expirado e ainda não utilizado.
6. O e-mail autenticado deve coincidir com o destinatário do convite.
7. O destino pós-login depende exclusivamente dos vínculos ativos resolvidos no servidor.
8. Contexto salvo no navegador não substitui RLS nem validação server-side.
