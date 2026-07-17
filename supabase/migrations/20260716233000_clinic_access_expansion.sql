-- DouxHub: expansão incremental da base multiempresa e do acesso às clínicas.
-- Não cria funções globais, cobrança ou recursos do DouxHub Control.

alter type public.clinic_status add value if not exists 'trial' before 'active';
alter type public.clinic_status add value if not exists 'canceled' after 'suspended';

do $$
begin
  if not exists (
    select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'user_profile_status'
  ) then
    create type public.user_profile_status as enum ('active', 'inactive', 'suspended');
  end if;
end;
$$;

alter table public.clinics
  add column if not exists legal_name text,
  add column if not exists document text,
  add column if not exists email text,
  add column if not exists phone text;

alter table public.clinics
  add constraint clinics_email_normalized
  check (email is null or email = lower(trim(email)));

alter table public.clinic_units
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists address jsonb;

alter table public.clinic_units
  add constraint clinic_units_email_normalized
  check (email is null or email = lower(trim(email))),
  add constraint clinic_units_address_object
  check (address is null or jsonb_typeof(address) = 'object');

alter table public.user_profiles
  add column if not exists display_name text,
  add column if not exists avatar_url text,
  add column if not exists phone text,
  add column if not exists status public.user_profile_status not null default 'active';

alter table public.invitations rename to clinic_invitations;
alter table public.clinic_invitations rename column name to full_name;
alter index public.invitations_one_pending_per_clinic_email rename to clinic_invitations_one_pending_per_clinic_email;
alter index public.invitations_email_status_idx rename to clinic_invitations_email_status_idx;
alter trigger invitations_set_updated_at on public.clinic_invitations rename to clinic_invitations_set_updated_at;
alter policy invitations_select_recipient_or_manager on public.clinic_invitations
  rename to clinic_invitations_select_recipient_or_manager;

alter table public.audit_logs
  add column if not exists unit_id uuid references public.clinic_units(id) on delete set null,
  add column if not exists target_user_id uuid references auth.users(id) on delete set null,
  add column if not exists ip_address inet,
  add column if not exists user_agent text;

create index if not exists audit_logs_unit_created_idx
  on public.audit_logs (unit_id, created_at desc)
  where unit_id is not null;

create or replace function public.douxhub_slugify(p_value text)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select trim(both '-' from regexp_replace(
    translate(lower(trim(p_value)),
      'áàâãäéèêëíìîïóòôõöúùûüçñ',
      'aaaaaeeeeiiiiooooouuuucn'),
    '[^a-z0-9]+', '-', 'g'
  ));
$$;

revoke all on function public.douxhub_slugify(text) from public;

create or replace function public.create_initial_clinic(
  p_name text,
  p_responsible_name text,
  p_email text,
  p_phone text,
  p_unit_name text
)
returns table (clinic_id uuid, unit_id uuid, membership_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_clinic_id uuid := gen_random_uuid();
  v_unit_id uuid := gen_random_uuid();
  v_membership_id uuid;
  v_owner_role_id uuid;
  v_clinic_slug text;
  v_unit_slug text;
  v_email text := lower(trim(coalesce(p_email, '')));
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if exists (select 1 from public.clinic_memberships where user_id = v_user_id and status = 'active') then
    raise exception 'active_membership_already_exists';
  end if;
  if char_length(trim(coalesce(p_name, ''))) not between 2 and 160 then raise exception 'invalid_clinic_name'; end if;
  if char_length(trim(coalesce(p_responsible_name, ''))) not between 2 and 160 then raise exception 'invalid_responsible_name'; end if;
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then raise exception 'invalid_clinic_email'; end if;
  if char_length(trim(coalesce(p_unit_name, ''))) not between 2 and 160 then raise exception 'invalid_unit_name'; end if;

  v_clinic_slug := public.douxhub_slugify(p_name);
  if v_clinic_slug = '' then v_clinic_slug := 'clinica'; end if;
  v_clinic_slug := v_clinic_slug || '-' || substr(replace(v_clinic_id::text, '-', ''), 1, 8);
  v_unit_slug := public.douxhub_slugify(p_unit_name);
  if v_unit_slug = '' then v_unit_slug := 'unidade'; end if;

  select id into v_owner_role_id from public.roles where key = 'clinic_owner' and is_enabled;
  if v_owner_role_id is null then raise exception 'owner_role_unavailable'; end if;

  insert into public.clinics (id, name, slug, email, phone, status, owner_user_id, settings, plan_code)
  values (v_clinic_id, trim(p_name), v_clinic_slug, v_email, nullif(trim(coalesce(p_phone, '')), ''),
          'active', v_user_id, '{}'::jsonb, 'unassigned');

  insert into public.clinic_units (id, clinic_id, name, slug, email, phone, status)
  values (v_unit_id, v_clinic_id, trim(p_unit_name), v_unit_slug, v_email,
          nullif(trim(coalesce(p_phone, '')), ''), 'active');

  insert into public.user_profiles (user_id, full_name, display_name, email, phone, status)
  values (v_user_id, trim(p_responsible_name), trim(p_responsible_name), v_email,
          nullif(trim(coalesce(p_phone, '')), ''), 'active')
  on conflict (user_id) do update
    set full_name = excluded.full_name,
        display_name = coalesce(public.user_profiles.display_name, excluded.display_name),
        email = excluded.email,
        phone = coalesce(excluded.phone, public.user_profiles.phone),
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

  insert into public.audit_logs (clinic_id, actor_user_id, action, entity_type, entity_id)
  values (v_clinic_id, v_user_id, 'clinic.created', 'clinic', v_clinic_id);

  insert into public.audit_logs (clinic_id, unit_id, actor_user_id, action, entity_type, entity_id)
  values (v_clinic_id, v_unit_id, v_user_id, 'unit.created', 'clinic_unit', v_unit_id);

  return query select v_clinic_id, v_unit_id, v_membership_id;
end;
$$;

create or replace function public.create_clinic_invitation(
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
set search_path = pg_catalog, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_actor_role text;
  v_role_id uuid;
  v_invitation_id uuid;
  v_expires_at timestamptz := coalesce(p_expires_at, now() + interval '7 days');
  v_email text := lower(trim(coalesce(p_email, '')));
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  v_actor_role := public.current_user_role_key(p_clinic_id);
  if v_actor_role not in ('clinic_owner', 'clinic_admin') then raise exception 'insufficient_permission'; end if;
  if p_role_key not in ('clinic_admin', 'clinic_employee') then raise exception 'invalid_role'; end if;
  if v_actor_role = 'clinic_admin' and p_role_key <> 'clinic_employee' then raise exception 'insufficient_permission'; end if;
  if char_length(trim(coalesce(p_name, ''))) not between 2 and 160 then raise exception 'invalid_name'; end if;
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then raise exception 'invalid_email'; end if;
  if length(coalesce(p_token, '')) < 32 then raise exception 'invalid_invitation_token'; end if;
  if v_expires_at <= now() then raise exception 'invalid_expiration'; end if;

  select id into v_role_id from public.roles
  where key = p_role_key and is_enabled and is_assignable;
  if v_role_id is null then raise exception 'invalid_role'; end if;

  if p_unit_id is not null and not exists (
    select 1 from public.clinic_units
    where id = p_unit_id and clinic_id = p_clinic_id and status = 'active'
  ) then raise exception 'invalid_unit'; end if;

  if exists (
    select 1 from public.clinic_memberships m
    join public.user_profiles p on p.user_id = m.user_id
    where m.clinic_id = p_clinic_id and p.email = v_email
  ) then raise exception 'membership_already_exists'; end if;

  update public.clinic_invitations ci
  set status = 'expired'
  where ci.clinic_id = p_clinic_id
    and ci.email = v_email
    and ci.status = 'pending'
    and ci.expires_at <= now();

  insert into public.clinic_invitations
    (clinic_id, unit_id, full_name, email, role_id, token_hash, expires_at, invited_by)
  values
    (p_clinic_id, p_unit_id, trim(p_name), v_email, v_role_id,
     encode(digest(p_token, 'sha256'), 'hex'), v_expires_at, v_user_id)
  returning id into v_invitation_id;

  insert into public.audit_logs
    (clinic_id, unit_id, actor_user_id, action, entity_type, entity_id, metadata)
  values
    (p_clinic_id, p_unit_id, v_user_id, 'invitation.created', 'clinic_invitation', v_invitation_id,
     jsonb_build_object('email', v_email, 'role', p_role_key));

  return query select v_invitation_id, v_expires_at;
end;
$$;

create or replace function public.revoke_clinic_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_invitation public.clinic_invitations%rowtype;
  v_actor_role text;
  v_target_role text;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  select * into v_invitation from public.clinic_invitations where id = p_invitation_id for update;
  if not found then raise exception 'invitation_not_found'; end if;
  v_actor_role := public.current_user_role_key(v_invitation.clinic_id);
  select key into v_target_role from public.roles where id = v_invitation.role_id;
  if v_actor_role not in ('clinic_owner', 'clinic_admin') then raise exception 'insufficient_permission'; end if;
  if v_actor_role = 'clinic_admin' and v_target_role <> 'clinic_employee' then raise exception 'insufficient_permission'; end if;
  if v_invitation.status <> 'pending' then raise exception 'invitation_not_pending'; end if;

  update public.clinic_invitations set status = 'revoked' where id = v_invitation.id;
  insert into public.audit_logs
    (clinic_id, unit_id, actor_user_id, action, entity_type, entity_id, metadata)
  values
    (v_invitation.clinic_id, v_invitation.unit_id, v_user_id,
     'invitation.revoked', 'clinic_invitation', v_invitation.id,
     jsonb_build_object('email', v_invitation.email, 'role', v_target_role));
end;
$$;

create or replace function public.accept_clinic_invitation(p_token text)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_invitation public.clinic_invitations%rowtype;
  v_membership_id uuid;
begin
  if v_user_id is null or v_email = '' then raise exception 'authentication_required'; end if;
  select * into v_invitation from public.clinic_invitations
  where token_hash = encode(digest(p_token, 'sha256'), 'hex') for update;
  if not found then raise exception 'invalid_invitation'; end if;
  if v_invitation.status = 'accepted' then raise exception 'invitation_already_used'; end if;
  if v_invitation.status = 'revoked' then raise exception 'invitation_revoked'; end if;
  if v_invitation.status <> 'pending' then raise exception 'invalid_invitation'; end if;
  if v_invitation.expires_at <= now() then raise exception 'invitation_expired'; end if;
  if v_invitation.email <> v_email then raise exception 'invitation_recipient_mismatch'; end if;

  insert into public.user_profiles (user_id, full_name, display_name, email, status)
  values (v_user_id, v_invitation.full_name, v_invitation.full_name, v_email, 'active')
  on conflict (user_id) do update
    set full_name = coalesce(nullif(public.user_profiles.full_name, ''), excluded.full_name),
        display_name = coalesce(public.user_profiles.display_name, excluded.display_name),
        email = excluded.email,
        status = 'active';

  insert into public.clinic_memberships
    (user_id, clinic_id, unit_id, role_id, status, invited_by)
  values
    (v_user_id, v_invitation.clinic_id, v_invitation.unit_id,
     v_invitation.role_id, 'active', v_invitation.invited_by)
  on conflict (user_id, clinic_id) do update
    set unit_id = excluded.unit_id,
        role_id = excluded.role_id,
        status = 'active',
        invited_by = excluded.invited_by,
        joined_at = now()
  returning id into v_membership_id;

  update public.clinic_invitations
  set status = 'accepted', accepted_by = v_user_id, accepted_at = now()
  where id = v_invitation.id;

  insert into public.audit_logs
    (clinic_id, unit_id, actor_user_id, target_user_id, action, entity_type, entity_id, metadata)
  values
    (v_invitation.clinic_id, v_invitation.unit_id, v_user_id, v_user_id,
     'invitation.accepted', 'clinic_invitation', v_invitation.id,
     jsonb_build_object('membership_id', v_membership_id));

  return v_membership_id;
end;
$$;

create or replace function public.update_clinic_member(
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
  v_user_id uuid := auth.uid();
  v_membership public.clinic_memberships%rowtype;
  v_actor_role text;
  v_target_role text;
  v_new_role_id uuid;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  select * into v_membership from public.clinic_memberships where id = p_membership_id for update;
  if not found then raise exception 'membership_not_found'; end if;
  select key into v_target_role from public.roles where id = v_membership.role_id;
  v_actor_role := public.current_user_role_key(v_membership.clinic_id);
  if v_actor_role not in ('clinic_owner', 'clinic_admin') then raise exception 'insufficient_permission'; end if;
  if v_target_role = 'clinic_owner' then raise exception 'clinic_owner_cannot_be_changed_here'; end if;
  if v_actor_role = 'clinic_admin' then
    if v_target_role <> 'clinic_employee' then raise exception 'insufficient_permission'; end if;
    if p_role_key is not null and p_role_key <> 'clinic_employee' then raise exception 'insufficient_permission'; end if;
  end if;
  if p_role_key = 'clinic_owner' then raise exception 'owner_transfer_not_available'; end if;

  if p_role_key is not null and p_role_key <> v_target_role then
    select id into v_new_role_id from public.roles
    where key = p_role_key and key in ('clinic_admin', 'clinic_employee') and is_enabled and is_assignable;
    if v_new_role_id is null then raise exception 'invalid_role'; end if;
    update public.clinic_memberships set role_id = v_new_role_id where id = p_membership_id;
    insert into public.audit_logs
      (clinic_id, unit_id, actor_user_id, target_user_id, action, entity_type, entity_id, metadata)
    values
      (v_membership.clinic_id, v_membership.unit_id, v_user_id, v_membership.user_id,
       'membership.role_changed', 'clinic_membership', p_membership_id,
       jsonb_build_object('from', v_target_role, 'to', p_role_key));
  end if;

  if p_status is not null and p_status <> v_membership.status then
    update public.clinic_memberships set status = p_status where id = p_membership_id;
    insert into public.audit_logs
      (clinic_id, unit_id, actor_user_id, target_user_id, action, entity_type, entity_id, metadata)
    values
      (v_membership.clinic_id, v_membership.unit_id, v_user_id, v_membership.user_id,
       case when p_status = 'active' then 'membership.activated' else 'membership.deactivated' end,
       'clinic_membership', p_membership_id,
       jsonb_build_object('from', v_membership.status, 'to', p_status));
  end if;
end;
$$;

revoke all on function public.create_clinic_with_owner(text, text, jsonb, text) from authenticated;
revoke all on function public.create_initial_clinic(text, text, text, text, text) from public;
revoke all on function public.revoke_clinic_invitation(uuid) from public;
grant execute on function public.create_initial_clinic(text, text, text, text, text) to authenticated;
grant execute on function public.revoke_clinic_invitation(uuid) to authenticated;
