-- DouxHub Etapa 3, Ciclo 3: leitura de perfis e portão de equivalência.
-- Não altera user_active_contexts nem a autoridade vigente de clinic_memberships.

create or replace function public.get_access_profile_equivalence()
returns table (
  membership_id uuid,
  access_profile_id uuid,
  clinic_id uuid,
  membership_status public.membership_status,
  is_equivalent boolean,
  is_selectable boolean,
  issue_code text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;

  return query
  with comparison as (
    select
      m.id as membership_id,
      ap.id as access_profile_id,
      m.clinic_id,
      m.status as membership_status,
      case
        when cu.id is null then 'clinic_user_missing'
        when a.id is null then 'role_assignment_missing'
        when ap.id is null then 'access_profile_missing'
        when legacy_role.id is null or assigned_role.key is distinct from legacy_role.key
          or profile_role.key is distinct from legacy_role.key then 'role_mismatch'
        when ap.clinic_user_id is distinct from cu.id
          or a.clinic_user_id is distinct from cu.id
          or ap.clinic_id is distinct from m.clinic_id
          or a.clinic_id is distinct from m.clinic_id then 'clinic_boundary_mismatch'
        when ap.unit_id is distinct from m.unit_id
          or ap.scope is distinct from (
            case when m.unit_id is null
              then 'clinic'::public.access_profile_scope
              else 'unit'::public.access_profile_scope
            end
          ) then 'profile_scope_mismatch'
        when m.unit_id is not null and (
          uu.id is null
          or uu.unit_id is distinct from m.unit_id
          or uu.clinic_user_id is distinct from cu.id
          or uu.clinic_id is distinct from m.clinic_id
        ) then 'unit_assignment_mismatch'
        when m.unit_id is null and coalesce(uu.is_active, false) then 'unexpected_active_unit_assignment'
        when m.status = 'active' and (
          cu.status is distinct from 'active'::public.clinic_user_status
          or not coalesce(a.is_active, false)
          or ap.status is distinct from 'active'::public.clinic_access_status
          or (m.unit_id is not null and not coalesce(uu.is_active, false))
        ) then 'active_state_mismatch'
        when m.status = 'inactive' and (
          cu.status is distinct from 'inactive'::public.clinic_user_status
          or coalesce(a.is_active, true)
          or ap.status is distinct from 'inactive'::public.clinic_access_status
          or coalesce(uu.is_active, false)
        ) then 'inactive_state_mismatch'
        when m.status = 'active' and clinic.status is distinct from 'active'::public.clinic_status
          then 'clinic_inactive'
        when m.status = 'active' and not coalesce(profile_role.is_enabled, false)
          then 'clinic_role_disabled'
        when m.status = 'active' and m.unit_id is not null
          and unit.status is distinct from 'active'::public.unit_status then 'unit_inactive'
        else 'equivalent'
      end as issue_code
    from public.clinic_memberships m
    left join public.roles legacy_role on legacy_role.id = m.role_id
    left join public.clinics clinic on clinic.id = m.clinic_id
    left join public.clinic_units unit on unit.id = m.unit_id and unit.clinic_id = m.clinic_id
    left join public.clinic_users cu on cu.source_membership_id = m.id
    left join public.clinic_user_role_assignments a on a.source_membership_id = m.id
    left join public.clinic_roles assigned_role
      on assigned_role.id = a.clinic_role_id and assigned_role.clinic_id = a.clinic_id
    left join public.access_profiles ap on ap.source_membership_id = m.id
    left join public.clinic_roles profile_role
      on profile_role.id = ap.clinic_role_id and profile_role.clinic_id = ap.clinic_id
    left join public.clinic_user_units uu on uu.source_membership_id = m.id
    where m.user_id = auth.uid()
  )
  select
    c.membership_id,
    c.access_profile_id,
    c.clinic_id,
    c.membership_status,
    c.issue_code = 'equivalent',
    c.membership_status = 'active' and c.issue_code = 'equivalent',
    c.issue_code
  from comparison c
  order by c.membership_id;
end;
$$;

create or replace function public.list_available_access_profiles()
returns table (
  access_profile_id uuid,
  source_membership_id uuid,
  clinic_id uuid,
  clinic_name text,
  clinic_slug text,
  unit_id uuid,
  unit_name text,
  role_key text,
  role_name text,
  profile_name text,
  profile_scope public.access_profile_scope,
  legacy_equivalent boolean,
  permissions jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;

  return query
  select
    ap.id,
    ap.source_membership_id,
    ap.clinic_id,
    clinic.name,
    clinic.slug,
    ap.unit_id,
    unit.name,
    role.key,
    role.name,
    ap.name,
    ap.scope,
    coalesce(eq.is_equivalent, false),
    coalesce((
      select jsonb_agg(
        jsonb_build_object('key', effective.permission_key, 'scope', effective.scope)
        order by effective.permission_key, effective.scope
      )
      from public.get_effective_access_profile_permissions(ap.id) effective
      where effective.is_allowed
    ), '[]'::jsonb)
  from public.access_profiles ap
  join public.clinic_users cu
    on cu.id = ap.clinic_user_id and cu.clinic_id = ap.clinic_id
  join public.clinics clinic on clinic.id = ap.clinic_id
  join public.clinic_roles role
    on role.id = ap.clinic_role_id and role.clinic_id = ap.clinic_id
  left join public.clinic_units unit
    on unit.id = ap.unit_id and unit.clinic_id = ap.clinic_id
  left join public.get_access_profile_equivalence() eq
    on eq.access_profile_id = ap.id
  where cu.user_id = auth.uid()
    and cu.status = 'active'
    and ap.status = 'active'
    and clinic.status = 'active'
    and role.is_enabled
    and exists (
      select 1
      from public.clinic_user_role_assignments assignment
      where assignment.clinic_user_id = ap.clinic_user_id
        and assignment.clinic_role_id = ap.clinic_role_id
        and assignment.is_active
    )
    and (
      ap.unit_id is null or (
        unit.status = 'active'
        and exists (
          select 1
          from public.clinic_user_units user_unit
          where user_unit.clinic_user_id = ap.clinic_user_id
            and user_unit.unit_id = ap.unit_id
            and user_unit.is_active
        )
      )
    )
  order by ap.created_at, ap.id;
end;
$$;

create or replace function public.get_access_profile_transition_snapshot()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membership_count integer;
  v_equivalent_count integer;
  v_equivalence_ready boolean;
  v_profiles jsonb;
  v_issues jsonb;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;

  select
    count(*)::integer,
    count(*) filter (where e.is_equivalent)::integer,
    coalesce(bool_and(e.is_equivalent), true)
  into v_membership_count, v_equivalent_count, v_equivalence_ready
  from public.get_access_profile_equivalence() e;

  select coalesce(jsonb_agg(to_jsonb(p) order by p.clinic_name, p.profile_name), '[]'::jsonb)
  into v_profiles
  from public.list_available_access_profiles() p;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'membership_id', e.membership_id,
      'access_profile_id', e.access_profile_id,
      'issue_code', e.issue_code
    ) order by e.membership_id
  ), '[]'::jsonb)
  into v_issues
  from public.get_access_profile_equivalence() e
  where not e.is_equivalent;

  return jsonb_build_object(
    'equivalence_ready', v_equivalence_ready,
    'legacy_membership_count', v_membership_count,
    'equivalent_membership_count', v_equivalent_count,
    'profiles', v_profiles,
    'issues', v_issues
  );
end;
$$;

revoke all on function public.get_access_profile_equivalence() from public;
revoke all on function public.list_available_access_profiles() from public;
revoke all on function public.get_access_profile_transition_snapshot() from public;
grant execute on function public.get_access_profile_equivalence() to authenticated;
grant execute on function public.list_available_access_profiles() to authenticated;
grant execute on function public.get_access_profile_transition_snapshot() to authenticated;
