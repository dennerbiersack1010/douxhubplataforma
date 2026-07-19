---
title: Profissionais da Clínica
document_id: MOD-CLINIC-011
version: 0.1.0
status: Definido
last_updated: 2026-07-18
owner: DouxHub
related_documents:
  - CONCEPTUAL_MODEL.md
  - CLINIC_USERS.md
  - UNITS_AND_MEMBERSHIPS.md
---

# Profissionais da Clínica

## Definição

Profissional é a pessoa cadastrada para executar procedimentos, participar de tratamentos e, quando configurado, possuir agenda. Profissional e usuário da clínica são entidades independentes.

## Cenários obrigatórios

- Recepcionista: usuário da clínica sem registro profissional.
- Profissional com acesso: profissional ligado a um usuário da clínica.
- Profissional sem acesso: aparece em agenda e operação, mas não possui conta nem permissões.
- Usuário com mais de uma responsabilidade: pode possuir funções administrativas e um único registro profissional na mesma clínica.

## Dados conceituais

- clínica e associação opcional ao usuário da clínica;
- nome e título exibido;
- especialidades e procedimentos;
- registro profissional, quando aplicável;
- configuração de agenda e duração padrão;
- unidades de atuação;
- status operacional e datas.

## Regras

- Um registro profissional sempre pertence a uma clínica.
- A ligação com conta é opcional e não concede acesso automaticamente.
- Unidades de atuação devem pertencer à mesma clínica.
- Desativação preserva histórico de agenda, tratamentos e prontuários.
- Dados clínicos e prontuários exigirão permissões próprias além da função `professional`.

## Estado de implementação

Definido documentalmente e ainda não implementado. Nenhuma tabela de profissionais existe no banco atual.

