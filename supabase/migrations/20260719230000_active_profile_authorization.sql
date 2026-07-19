-- DouxHub Etapa 3, Ciclo 5: autorização server-side pelo perfil ativo.
-- O contexto, o perfil e a permissão são derivados da sessão; cookies não concedem acesso.

insert into public.permission_catalog
  (key, description, allowed_scopes, is_sensitive, is_profile_customizable)
values
  ('team_admin_invitations.revoke', 'Revogar convites destinados a administradores.', array['clinic']::public.permission_scope[], true, true)
on conflict (key) do update set
  description = excluded.description,
  allowed_scopes = excluded.allowed_scopes,
  is_sensitive = excluded.is_sensitive,
  is_profile_customizable = excluded.is_profile_customizable,
  is_enabled = true;

insert into public.clinic_role_permissions
  (clinic_id, clinic_role_id, permission_id, scope, source)
select role.clinic_id, role.id, permission.id, 'clinic'::public.permission_scope, 'system_template'
from public.clinic_roles role
join public.permission_catalog permission on permission.key = 'team_admin_invitations.revoke'
where role.key = 'clinic_owner'
on conflict (clinic_role_id, permission_id, scope) do nothing;

create or replace function public.seed_clinic_owner_admin_revoke_permission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.key = 'clinic_owner' then
    insert into public.clinic_role_permissions
      (clinic_id, clinic_role_id, permission_id, scope, source)
    select new.clinic_id, new.id, permission.id, 'clinic'::public.permission_scope, 'system_template'
    from public.permission_catalog permission
    where permission.key = 'team_admin_invitations.revoke' and permission.is_enabled
    on conflict (clinic_role_id, permission_id, scope) do nothing;
  end if;
  return new;
end;
$$;

create trigger clinic_roles_seed_admin_revoke_permission
after insert on public.clinic_roles
for each row execute function public.seed_clinic_owner_admin_revoke_permission();

create or replace function public.authorize_active_access_profile(
  p_permission_key text,
  p_scope public.permission_scope,
  p_target_clinic_id uuid default null,
  p_target_unit_id uuid default null
)
returns table (
  user_id uuid,
  access_profile_id uuid,
  membership_id uuid,
  clinic_id uuid,
  unit_id uuid,
  role_key text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_context public.user_active_contexts%rowtype;
  v_role_key text;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;

  select context.*
  into v_context
  from public.user_active_contexts context
  where context.user_id = v_user_id;

  if not found then raise exception 'active_context_required'; end if;

  if p_target_clinic_id is not null and p_target_clinic_id <> v_context.clinic_id then
    raise exception 'active_context_target_mismatch';
  end if;
  if p_scope = 'unit' and p_target_unit_id is not null
     and p_target_unit_id is distinct from v_context.unit_id then
    raise exception 'active_context_target_mismatch';
  end if;

  select profile_role.key
  into v_role_key
  from public.access_profiles profile
  join public.clinic_users clinic_user
    on clinic_user.id = profile.clinic_user_id and clinic_user.clinic_id = profile.clinic_id
  join public.clinic_roles profile_role
    on profile_role.id = profile.clinic_role_id and profile_role.clinic_id = profile.clinic_id
  join public.clinic_user_role_assignments assignment
    on assignment.clinic_user_id = profile.clinic_user_id
   and assignment.clinic_role_id = profile.clinic_role_id
   and assignment.clinic_id = profile.clinic_id
  join public.clinic_memberships membership
    on membership.id = profile.source_membership_id and membership.clinic_id = profile.clinic_id
  join public.clinics clinic on clinic.id = profile.clinic_id
  left join public.clinic_units unit
    on unit.id = profile.unit_id and unit.clinic_id = profile.clinic_id
  left join public.clinic_user_units user_unit
    on user_unit.clinic_user_id = profile.clinic_user_id
   and user_unit.unit_id = profile.unit_id
   and user_unit.clinic_id = profile.clinic_id
  where profile.id = v_context.access_profile_id
    and profile.source_membership_id = v_context.membership_id
    and profile.clinic_id = v_context.clinic_id
    and profile.unit_id is not distinct from v_context.unit_id
    and clinic_user.user_id = v_user_id
    and clinic_user.status = 'active'
    and profile.status = 'active'
    and assignment.is_active
    and membership.user_id = v_user_id
    and membership.status = 'active'
    and clinic.status = 'active'
    and profile_role.is_enabled
    and (profile.unit_id is null or (unit.status = 'active' and user_unit.is_active));

  if not found then raise exception 'invalid_active_context'; end if;

  if not exists (
    select 1
    from public.get_access_profile_equivalence() equivalence
    where equivalence.membership_id = v_context.membership_id
      and equivalence.access_profile_id = v_context.access_profile_id
      and equivalence.clinic_id = v_context.clinic_id
      and equivalence.is_equivalent
      and equivalence.is_selectable
  ) then
    raise exception 'access_profile_equivalence_failed';
  end if;

  if not public.access_profile_has_permission(v_context.access_profile_id, p_permission_key, p_scope) then
    raise exception 'insufficient_permission';
  end if;

  return query select
    v_user_id,
    v_context.access_profile_id,
    v_context.membership_id,
    v_context.clinic_id,
    v_context.unit_id,
    v_role_key;
end;
$$;

alter function public.create_clinic_invitation(uuid, text, text, text, text, uuid, timestamptz)
  rename to create_clinic_invitation_legacy;
alter function public.revoke_clinic_invitation(uuid)
  rename to revoke_clinic_invitation_legacy;
alter function public.update_clinic_member(uuid, text, public.membership_status)
  rename to update_clinic_member_legacy;

revoke all on function public.create_clinic_invitation_legacy(uuid, text, text, text, text, uuid, timestamptz) from public, authenticated;
revoke all on function public.revoke_clinic_invitation_legacy(uuid) from public, authenticated;
revoke all on function public.update_clinic_member_legacy(uuid, text, public.membership_status) from public, authenticated;

create function public.create_clinic_invitation(
  p_clinic_id uuid,
  p_name text,
  p_email text,
  p_role_key text,
  p_token text,
  p_unit_id uuid default null,
  p_expires_at timestamptz default (now() + interval '7 days')
)
returns table (invitation_id uuid, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare v_permission_key text;
begin
  v_permission_key := case
    when p_role_key = 'clinic_admin' then 'team_admins.invite'
    else 'team_employees.invite'
  end;
  perform public.authorize_active_access_profile(v_permission_key, 'clinic', p_clinic_id, p_unit_id);
  return query select * from public.create_clinic_invitation_legacy(
    p_clinic_id, p_name, p_email, p_role_key, p_token, p_unit_id, p_expires_at
  );
end;
$$;

create function public.revoke_clinic_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_clinic_id uuid;
  v_unit_id uuid;
  v_target_role text;
begin
  select invitation.clinic_id, invitation.unit_id, role.key
  into v_clinic_id, v_unit_id, v_target_role
  from public.clinic_invitations invitation
  join public.roles role on role.id = invitation.role_id
  where invitation.id = p_invitation_id;
  if not found then raise exception 'invitation_not_found'; end if;

  perform public.authorize_active_access_profile(
    case when v_target_role = 'clinic_admin'
      then 'team_admin_invitations.revoke'
      else 'team_employee_invitations.revoke'
    end,
    'clinic', v_clinic_id, v_unit_id
  );
  perform public.revoke_clinic_invitation_legacy(p_invitation_id);
end;
$$;

create function public.update_clinic_member(
  p_membership_id uuid,
  p_role_key text default null,
  p_status public.membership_status default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_clinic_id uuid;
  v_unit_id uuid;
begin
  select membership.clinic_id, membership.unit_id
  into v_clinic_id, v_unit_id
  from public.clinic_memberships membership
  where membership.id = p_membership_id;
  if not found then raise exception 'membership_not_found'; end if;
  if p_role_key is null and p_status is null then raise exception 'invalid_member_update'; end if;

  if p_role_key is not null then
    perform public.authorize_active_access_profile(
      'team_members.role_update', 'clinic', v_clinic_id, v_unit_id
    );
  end if;
  if p_status is not null then
    perform public.authorize_active_access_profile(
      'team_employees.status_update', 'clinic', v_clinic_id, v_unit_id
    );
  end if;
  perform public.update_clinic_member_legacy(p_membership_id, p_role_key, p_status);
end;
$$;

revoke all on function public.authorize_active_access_profile(text, public.permission_scope, uuid, uuid) from public;
revoke all on function public.seed_clinic_owner_admin_revoke_permission() from public;
revoke all on function public.create_clinic_invitation(uuid, text, text, text, text, uuid, timestamptz) from public;
revoke all on function public.revoke_clinic_invitation(uuid) from public;
revoke all on function public.update_clinic_member(uuid, text, public.membership_status) from public;
grant execute on function public.authorize_active_access_profile(text, public.permission_scope, uuid, uuid) to authenticated;
grant execute on function public.create_clinic_invitation(uuid, text, text, text, text, uuid, timestamptz) to authenticated;
grant execute on function public.revoke_clinic_invitation(uuid) to authenticated;
grant execute on function public.update_clinic_member(uuid, text, public.membership_status) to authenticated;
