-- DouxHub: conclusão transacional e idempotente do onboarding inicial.
-- Preserva o fluxo legado create_initial_clinic e conclui somente rascunhos validados.

create or replace function public.complete_clinic_onboarding(p_progress_id uuid)
returns table (clinic_id uuid, unit_id uuid, membership_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_progress public.clinic_onboarding_progress%rowtype;
  v_existing_membership_id uuid;
  v_clinic_id uuid := gen_random_uuid();
  v_unit_id uuid := gen_random_uuid();
  v_membership_id uuid;
  v_owner_role_id uuid;
  v_clinic_slug text;
  v_unit_slug text;
  v_user_email text;
  v_owner_name text;
  v_owner_phone text;
  v_trade_name text;
  v_legal_name text;
  v_cnpj text;
  v_clinic_phone text;
  v_clinic_email text;
  v_unit_name text;
  v_unit_phone text;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;

  select * into v_progress
  from public.clinic_onboarding_progress
  where id = p_progress_id and user_id = v_user_id
  for update;

  if not found then raise exception 'onboarding_progress_not_found'; end if;

  if v_progress.status = 'completed' then
    if v_progress.created_clinic_id is null or v_progress.created_unit_id is null then
      raise exception 'onboarding_completion_inconsistent';
    end if;
    select m.id into v_existing_membership_id
    from public.clinic_memberships m
    where m.user_id = v_user_id
      and m.clinic_id = v_progress.created_clinic_id
      and m.unit_id = v_progress.created_unit_id
      and m.status = 'active';
    if v_existing_membership_id is null then raise exception 'onboarding_completion_inconsistent'; end if;
    return query select v_progress.created_clinic_id, v_progress.created_unit_id, v_existing_membership_id;
    return;
  end if;

  if v_progress.status <> 'in_progress' then raise exception 'onboarding_progress_not_active'; end if;
  if v_progress.current_step <> 6
     or v_progress.completed_steps <> array[1,2,3,4,5]::smallint[] then
    raise exception 'onboarding_not_ready';
  end if;
  if exists (
    select 1 from public.clinic_memberships
    where user_id = v_user_id and status = 'active'
  ) then raise exception 'active_membership_already_exists'; end if;

  v_owner_name := trim(coalesce(v_progress.owner_data ->> 'fullName', ''));
  v_owner_phone := trim(coalesce(v_progress.owner_data ->> 'phone', ''));
  v_trade_name := trim(coalesce(v_progress.clinic_data ->> 'tradeName', ''));
  v_legal_name := trim(coalesce(v_progress.clinic_data ->> 'legalName', ''));
  v_cnpj := trim(coalesce(v_progress.clinic_data ->> 'cnpj', ''));
  v_clinic_phone := trim(coalesce(v_progress.clinic_data ->> 'phone', ''));
  v_clinic_email := lower(trim(coalesce(v_progress.clinic_data ->> 'email', '')));
  v_unit_name := trim(coalesce(v_progress.unit_data ->> 'name', ''));
  v_unit_phone := trim(coalesce(v_progress.unit_data ->> 'phone', ''));

  if char_length(v_owner_name) not between 3 and 160
     or char_length(v_owner_phone) not between 8 and 24
     or char_length(trim(coalesce(v_progress.owner_data ->> 'jobTitle', ''))) not between 2 and 100
     or coalesce((v_progress.owner_data ->> 'responsibilityConfirmed')::boolean, false) is not true
     or jsonb_typeof(v_progress.owner_data -> 'notifications') <> 'object' then
    raise exception 'invalid_owner_onboarding_data';
  end if;

  if char_length(v_trade_name) not between 2 and 160
     or char_length(v_legal_name) not between 2 and 200
     or v_cnpj !~ '^[0-9]{14}$'
     or char_length(v_clinic_phone) not between 8 and 24
     or v_clinic_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
     or jsonb_typeof(v_progress.clinic_data -> 'fiscalAddress') <> 'object'
     or char_length(trim(coalesce(v_progress.clinic_data ->> 'legalResponsible', ''))) not between 3 and 160
     or char_length(trim(coalesce(v_progress.clinic_data ->> 'clinicType', ''))) not between 2 and 100
     or jsonb_typeof(v_progress.clinic_data -> 'specialties') <> 'array'
     or jsonb_array_length(v_progress.clinic_data -> 'specialties') < 1 then
    raise exception 'invalid_clinic_onboarding_data';
  end if;

  if char_length(v_unit_name) not between 2 and 160
     or char_length(v_unit_phone) not between 8 and 24
     or jsonb_typeof(v_progress.unit_data -> 'address') <> 'object'
     or char_length(trim(coalesce(v_progress.unit_data ->> 'timeZone', ''))) not between 3 and 100
     or jsonb_typeof(v_progress.unit_data -> 'rooms') <> 'array' then
    raise exception 'invalid_unit_onboarding_data';
  end if;

  if jsonb_typeof(v_progress.operation_data -> 'workingDays') <> 'array'
     or jsonb_array_length(v_progress.operation_data -> 'workingDays') < 1
     or coalesce(v_progress.operation_data ->> 'opensAt', '') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
     or coalesce(v_progress.operation_data ->> 'closesAt', '') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
     or (v_progress.operation_data ->> 'closesAt') <= (v_progress.operation_data ->> 'opensAt')
     or jsonb_typeof(v_progress.operation_data -> 'paymentMethods') <> 'array'
     or jsonb_array_length(v_progress.operation_data -> 'paymentMethods') < 1 then
    raise exception 'invalid_operation_onboarding_data';
  end if;

  if coalesce(v_progress.team_data ->> 'nextAction', '') not in ('add_reception', 'add_professional', 'later') then
    raise exception 'invalid_team_onboarding_data';
  end if;

  select lower(email) into v_user_email from auth.users where id = v_user_id;
  if v_user_email is null then raise exception 'authentication_required'; end if;

  select id into v_owner_role_id
  from public.roles
  where key = 'clinic_owner' and is_enabled;
  if v_owner_role_id is null then raise exception 'owner_role_unavailable'; end if;

  v_clinic_slug := public.douxhub_slugify(v_trade_name);
  if v_clinic_slug = '' then v_clinic_slug := 'clinica'; end if;
  v_clinic_slug := v_clinic_slug || '-' || substr(replace(v_clinic_id::text, '-', ''), 1, 8);
  v_unit_slug := public.douxhub_slugify(v_unit_name);
  if v_unit_slug = '' then v_unit_slug := 'unidade'; end if;

  insert into public.clinics
    (id, name, slug, legal_name, document, email, phone, status, owner_user_id, settings, plan_code)
  values
    (v_clinic_id, v_trade_name, v_clinic_slug, v_legal_name, v_cnpj, v_clinic_email,
     v_clinic_phone, 'active', v_user_id,
     jsonb_strip_nulls(jsonb_build_object(
       'fiscal_address', v_progress.clinic_data -> 'fiscalAddress',
       'legal_responsible', v_progress.clinic_data -> 'legalResponsible',
       'technical_responsible', v_progress.clinic_data -> 'technicalResponsible',
       'clinic_type', v_progress.clinic_data -> 'clinicType',
       'specialties', v_progress.clinic_data -> 'specialties',
       'team_preparation', v_progress.team_data,
       'onboarding_schema_version', v_progress.schema_version
     )), 'unassigned');

  insert into public.clinic_units
    (id, clinic_id, name, slug, email, phone, address, status, settings)
  values
    (v_unit_id, v_clinic_id, v_unit_name, v_unit_slug, v_clinic_email, v_unit_phone,
     v_progress.unit_data -> 'address', 'active',
     jsonb_strip_nulls(jsonb_build_object(
       'time_zone', v_progress.unit_data -> 'timeZone',
       'internal_code', v_progress.unit_data -> 'internalCode',
       'rooms', v_progress.unit_data -> 'rooms',
       'operation', v_progress.operation_data,
       'onboarding_schema_version', v_progress.schema_version
     )));

  insert into public.user_profiles (user_id, full_name, display_name, email, phone, avatar_url, status)
  values (v_user_id, v_owner_name, v_owner_name, v_user_email, v_owner_phone,
          nullif(trim(coalesce(v_progress.owner_data ->> 'avatarUrl', '')), ''), 'active')
  on conflict (user_id) do update
    set full_name = excluded.full_name,
        display_name = coalesce(public.user_profiles.display_name, excluded.display_name),
        email = excluded.email,
        phone = excluded.phone,
        avatar_url = coalesce(excluded.avatar_url, public.user_profiles.avatar_url),
        status = 'active';

  insert into public.clinic_memberships (user_id, clinic_id, unit_id, role_id, status)
  values (v_user_id, v_clinic_id, v_unit_id, v_owner_role_id, 'active')
  returning id into v_membership_id;

  insert into public.user_active_contexts (user_id, membership_id, clinic_id, unit_id)
  values (v_user_id, v_membership_id, v_clinic_id, v_unit_id)
  on conflict (user_id) do update
    set membership_id = excluded.membership_id,
        clinic_id = excluded.clinic_id,
        unit_id = excluded.unit_id,
        selected_at = now();

  insert into public.audit_logs
    (clinic_id, unit_id, actor_user_id, action, entity_type, entity_id, metadata)
  values
    (v_clinic_id, null, v_user_id, 'clinic.created', 'clinic', v_clinic_id,
     jsonb_build_object('source', 'clinic_onboarding', 'progress_id', v_progress.id)),
    (v_clinic_id, v_unit_id, v_user_id, 'unit.created', 'clinic_unit', v_unit_id,
     jsonb_build_object('source', 'clinic_onboarding', 'progress_id', v_progress.id)),
    (v_clinic_id, v_unit_id, v_user_id, 'onboarding.completed', 'clinic_onboarding_progress', v_progress.id,
     jsonb_build_object('membership_id', v_membership_id));

  update public.clinic_onboarding_progress
  set status = 'completed',
      created_clinic_id = v_clinic_id,
      created_unit_id = v_unit_id,
      completed_at = now(),
      current_step = 6,
      revision = revision + 1
  where id = v_progress.id;

  return query select v_clinic_id, v_unit_id, v_membership_id;
end;
$$;

revoke all on function public.complete_clinic_onboarding(uuid) from public;
grant execute on function public.complete_clinic_onboarding(uuid) to authenticated;
