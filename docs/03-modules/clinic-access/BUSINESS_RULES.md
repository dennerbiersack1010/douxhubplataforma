---
title: Regras de Negócio do Acesso às Clínicas
document_id: MOD-CLINIC-006
version: 0.2.0
status: Implementado
last_updated: 2026-07-16
owner: DouxHub
related_documents:
  - MODULE.md
  - DATA_MODEL.md
  - PERMISSIONS.md
---

# Regras de Negócio do Acesso às Clínicas

1. Toda autorização depende do banco e da sessão autenticada; estado do frontend e `localStorage` não concedem acesso.
2. O usuário só acessa clínicas às quais possua vínculo compatível com a operação.
3. A primeira clínica só pode ser criada por usuário sem vínculo ativo e cria automaticamente uma primeira unidade e o vínculo `clinic_owner`.
4. O proprietário não pode ser desativado nem ter sua função alterada pelo fluxo de equipe.
5. Administradores gerenciam somente colaboradores; proprietários podem gerenciar administradores e colaboradores.
6. Convites armazenam apenas o hash do token e exigem e-mail autenticado igual ao destinatário.
7. Só pode existir um convite pendente por clínica e e-mail. Convite expirado, revogado ou aceito não pode ser reutilizado.
8. O vínculo é criado ou reativado somente durante o aceite validado do convite.
9. O contexto ativo deve corresponder a um vínculo ativo do próprio usuário e é persistido no servidor.
10. O campo de plano da clínica é apenas preparatório; cobrança e gestão de assinatura não estão implementadas.

## Regras definidas para a evolução

11. Conta, usuário da clínica, função, perfil de acesso e profissional são entidades independentes.
12. Um usuário da clínica pode possuir várias funções, unidades e perfis autorizados.
13. Profissional pode existir sem conta; a associação com usuário da clínica não concede acesso automaticamente.
14. Funções padrão são modelos da clínica e não criam usuários ou senhas fictícias.
15. Todo novo Login concluído deverá passar pela seleção de perfil quando o novo modelo estiver implementado.
16. A evolução do vínculo atual será aditiva e retrocompatível; estas regras ainda não estão implementadas.
