-- DouxHub: resolução pós-login em uma única chamada segura ao banco.
-- Consolida contagem, destino e ativação do vínculo sem alterar o modelo vigente.

create or replace function public.resolve_post_login_context()
returns table (redirect_to text, membership_id uuid, active_membership_count integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_active_count integer;
  v_has_any_membership boolean;
  v_membership public.clinic_memberships%rowtype;
  v_role_key text;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;

  select count(*)::integer
  into v_active_count
  from public.clinic_memberships m
  join public.clinics c on c.id = m.clinic_id and c.status = 'active'
  left join public.clinic_units u on u.id = m.unit_id
  where m.user_id = v_user_id
    and m.status = 'active'
    and (m.unit_id is null or u.status = 'active');

  if v_active_count = 0 then
    select exists (
      select 1 from public.clinic_memberships m where m.user_id = v_user_id
    ) into v_has_any_membership;

    delete from public.user_active_contexts c where c.user_id = v_user_id;

    return query select
      case when v_has_any_membership then '/sem-clinica' else '/configurar-clinica' end,
      null::uuid,
      v_active_count;
    return;
  end if;

  if v_active_count > 1 then
    delete from public.user_active_contexts c where c.user_id = v_user_id;
    return query select '/selecionar-perfil'::text, null::uuid, v_active_count;
    return;
  end if;

  select m.*
  into v_membership
  from public.clinic_memberships m
  join public.clinics c on c.id = m.clinic_id and c.status = 'active'
  left join public.clinic_units u on u.id = m.unit_id
  where m.user_id = v_user_id
    and m.status = 'active'
    and (m.unit_id is null or u.status = 'active')
  order by m.joined_at, m.id
  limit 1;

  if not found then raise exception 'post_login_resolution_inconsistent'; end if;

  select r.key into v_role_key from public.roles r where r.id = v_membership.role_id;
  if v_role_key is null then raise exception 'post_login_resolution_inconsistent'; end if;

  insert into public.user_active_contexts (user_id, membership_id, clinic_id, unit_id)
  values (v_user_id, v_membership.id, v_membership.clinic_id, v_membership.unit_id)
  on conflict (user_id) do update
    set membership_id = excluded.membership_id,
        clinic_id = excluded.clinic_id,
        unit_id = excluded.unit_id,
        selected_at = now();

  update public.clinic_memberships m
  set last_access_at = now()
  where m.id = v_membership.id;

  insert into public.audit_logs
    (clinic_id, unit_id, actor_user_id, action, entity_type, entity_id, metadata)
  values
    (v_membership.clinic_id, v_membership.unit_id, v_user_id,
     'context.switched', 'clinic_membership', v_membership.id,
     jsonb_build_object('unit_id', v_membership.unit_id, 'role', v_role_key, 'source', 'post_login'));

  return query select '/dashboard'::text, v_membership.id, v_active_count;
end;
$$;

revoke all on function public.resolve_post_login_context() from public;
grant execute on function public.resolve_post_login_context() to authenticated;
