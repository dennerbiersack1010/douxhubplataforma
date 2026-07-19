-- DouxHub Etapa 3, Ciclo 4: adoção controlada do perfil no contexto ativo.
-- Preserva membership_id como ponte rastreável durante a transição.

alter table public.user_active_contexts
  add column access_profile_id uuid;

update public.user_active_contexts context
set access_profile_id = profile.id
from public.access_profiles profile
where profile.source_membership_id = context.membership_id
  and profile.clinic_id = context.clinic_id;

do $$
begin
  if exists (select 1 from public.user_active_contexts where access_profile_id is null) then
    raise exception 'active_context_profile_backfill_incomplete';
  end if;
end;
$$;

alter table public.user_active_contexts
  alter column access_profile_id set not null,
  add constraint user_active_contexts_profile_clinic_fk
    foreign key (access_profile_id, clinic_id)
    references public.access_profiles(id, clinic_id);

create index user_active_contexts_profile_idx
  on public.user_active_contexts (access_profile_id);

create or replace function public.validate_active_access_profile_context()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid;
begin
  select ap.id
  into v_profile_id
  from public.access_profiles ap
  join public.clinic_users cu
    on cu.id = ap.clinic_user_id and cu.clinic_id = ap.clinic_id
  join public.clinic_memberships m
    on m.id = ap.source_membership_id and m.clinic_id = ap.clinic_id
  join public.clinics clinic on clinic.id = ap.clinic_id
  join public.clinic_roles role
    on role.id = ap.clinic_role_id and role.clinic_id = ap.clinic_id
  join public.clinic_user_role_assignments assignment
    on assignment.clinic_user_id = ap.clinic_user_id
   and assignment.clinic_role_id = ap.clinic_role_id
   and assignment.is_active
  left join public.clinic_units unit
    on unit.id = ap.unit_id and unit.clinic_id = ap.clinic_id
  left join public.clinic_user_units user_unit
    on user_unit.clinic_user_id = ap.clinic_user_id
   and user_unit.unit_id = ap.unit_id
   and user_unit.is_active
  where ap.id = coalesce(new.access_profile_id, ap.id)
    and ap.source_membership_id = new.membership_id
    and ap.clinic_id = new.clinic_id
    and ap.unit_id is not distinct from new.unit_id
    and cu.user_id = new.user_id
    and cu.status = 'active'
    and m.user_id = new.user_id
    and m.status = 'active'
    and clinic.status = 'active'
    and role.is_enabled
    and ap.status = 'active'
    and (ap.unit_id is null or (unit.status = 'active' and user_unit.id is not null))
  order by ap.id
  limit 1;

  if v_profile_id is null then raise exception 'invalid_active_access_profile_context'; end if;
  new.access_profile_id := v_profile_id;
  return new;
end;
$$;

create trigger user_active_contexts_validate_profile
before insert or update of membership_id, clinic_id, unit_id, access_profile_id
on public.user_active_contexts
for each row execute function public.validate_active_access_profile_context();

create or replace function public.invalidate_context_after_membership_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status is distinct from new.status
     or old.role_id is distinct from new.role_id
     or old.unit_id is distinct from new.unit_id then
    delete from public.user_active_contexts context
    where context.membership_id = new.id;
  end if;
  return new;
end;
$$;

create trigger clinic_memberships_invalidate_active_profile_context
after update of status, role_id, unit_id on public.clinic_memberships
for each row execute function public.invalidate_context_after_membership_change();

create or replace function public.set_active_access_profile_context(p_access_profile_id uuid)
returns table (
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
  v_profile record;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;

  if exists (
    select 1 from public.get_access_profile_equivalence() equivalence
    where not equivalence.is_equivalent
  ) then
    raise exception 'access_profile_equivalence_failed';
  end if;

  select profile.*
  into v_profile
  from public.list_available_access_profiles() profile
  where profile.access_profile_id = p_access_profile_id
    and profile.legacy_equivalent
    and profile.source_membership_id is not null;

  if not found then raise exception 'invalid_active_access_profile'; end if;

  insert into public.user_active_contexts
    (user_id, membership_id, access_profile_id, clinic_id, unit_id)
  values
    (v_user_id, v_profile.source_membership_id, v_profile.access_profile_id,
     v_profile.clinic_id, v_profile.unit_id)
  on conflict (user_id) do update
    set membership_id = excluded.membership_id,
        access_profile_id = excluded.access_profile_id,
        clinic_id = excluded.clinic_id,
        unit_id = excluded.unit_id,
        selected_at = now();

  update public.clinic_memberships membership
  set last_access_at = now()
  where membership.id = v_profile.source_membership_id;

  update public.access_profiles profile
  set last_used_at = now()
  where profile.id = v_profile.access_profile_id;

  insert into public.audit_logs
    (clinic_id, unit_id, actor_user_id, action, entity_type, entity_id, metadata)
  values
    (v_profile.clinic_id, v_profile.unit_id, v_user_id,
     'context.profile_switched', 'access_profile', v_profile.access_profile_id,
     jsonb_build_object(
       'membership_id', v_profile.source_membership_id,
       'role', v_profile.role_key,
       'source', 'access_profile_selection'
     ));

  return query select
    v_profile.access_profile_id,
    v_profile.source_membership_id,
    v_profile.clinic_id,
    v_profile.unit_id,
    v_profile.role_key;
end;
$$;

create or replace function public.set_active_clinic_context(p_membership_id uuid)
returns table (membership_id uuid, clinic_id uuid, unit_id uuid, role_key text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;

  select profile.access_profile_id
  into v_profile_id
  from public.list_available_access_profiles() profile
  where profile.source_membership_id = p_membership_id
    and profile.legacy_equivalent;

  if v_profile_id is null then raise exception 'invalid_active_context'; end if;

  return query
  select activated.membership_id, activated.clinic_id, activated.unit_id, activated.role_key
  from public.set_active_access_profile_context(v_profile_id) activated;
end;
$$;

create or replace function public.resolve_post_login_context()
returns table (redirect_to text, membership_id uuid, active_membership_count integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_snapshot jsonb;
  v_profile_count integer;
  v_has_any_membership boolean;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;

  v_snapshot := public.get_access_profile_transition_snapshot();
  if not coalesce((v_snapshot ->> 'equivalence_ready')::boolean, false) then
    delete from public.user_active_contexts context where context.user_id = v_user_id;
    raise exception 'access_profile_equivalence_failed';
  end if;

  select count(*)::integer
  into v_profile_count
  from public.list_available_access_profiles() profile
  where profile.legacy_equivalent
    and profile.source_membership_id is not null;
  delete from public.user_active_contexts context where context.user_id = v_user_id;

  if v_profile_count > 0 then
    return query select '/selecionar-perfil'::text, null::uuid, v_profile_count;
    return;
  end if;

  select exists (
    select 1 from public.clinic_memberships membership where membership.user_id = v_user_id
  ) into v_has_any_membership;

  return query select
    case when v_has_any_membership then '/sem-clinica' else '/configurar-clinica' end,
    null::uuid,
    0;
end;
$$;

revoke all on function public.validate_active_access_profile_context() from public;
revoke all on function public.invalidate_context_after_membership_change() from public;
revoke all on function public.set_active_access_profile_context(uuid) from public;
revoke all on function public.set_active_clinic_context(uuid) from public;
revoke all on function public.resolve_post_login_context() from public;
grant execute on function public.set_active_access_profile_context(uuid) to authenticated;
grant execute on function public.set_active_clinic_context(uuid) to authenticated;
grant execute on function public.resolve_post_login_context() to authenticated;
