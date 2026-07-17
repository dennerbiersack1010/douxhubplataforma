-- DouxHub: base multiempresa para clínicas, vínculos, convites e contexto ativo.
-- Esta migração não cria funções globais do futuro DouxHub Control.

create extension if not exists pgcrypto;

create type public.clinic_status as enum ('active', 'inactive', 'suspended');
create type public.unit_status as enum ('active', 'inactive');
create type public.membership_status as enum ('active', 'inactive');
create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'revoked');

create table public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  priority smallint not null default 100,
  is_enabled boolean not null default true,
  is_assignable boolean not null default true,
  created_at timestamptz not null default now(),
  constraint roles_key_format check (key ~ '^[a-z][a-z0-9_]*$')
);

insert into public.roles (id, key, name, description, priority, is_enabled, is_assignable)
values
  ('00000000-0000-0000-0000-000000000001', 'clinic_owner', 'Proprietário da clínica', 'Responsável principal pela clínica.', 10, true, false),
  ('00000000-0000-0000-0000-000000000002', 'clinic_admin', 'Administrador da clínica', 'Gerencia dados básicos, membros e convites.', 20, true, true),
  ('00000000-0000-0000-0000-000000000003', 'clinic_employee', 'Colaborador da clínica', 'Acesso inicial limitado ao ambiente da clínica.', 30, true, true),
  ('00000000-0000-0000-0000-000000000004', 'receptionist', 'Recepção', 'Função futura preparada, ainda não habilitada.', 40, false, false),
  ('00000000-0000-0000-0000-000000000005', 'professional', 'Profissional', 'Função futura preparada, ainda não habilitada.', 50, false, false),
  ('00000000-0000-0000-0000-000000000006', 'commercial', 'Comercial', 'Função futura preparada, ainda não habilitada.', 60, false, false),
  ('00000000-0000-0000-0000-000000000007', 'financial', 'Financeiro', 'Função futura preparada, ainda não habilitada.', 70, false, false),
  ('00000000-0000-0000-0000-000000000008', 'stock_manager', 'Gestão de estoque', 'Função futura preparada, ainda não habilitada.', 80, false, false);

create table public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status public.clinic_status not null default 'active',
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  settings jsonb not null default '{}'::jsonb,
  plan_code text not null default 'unassigned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinics_name_length check (char_length(trim(name)) between 2 and 160),
  constraint clinics_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint clinics_settings_object check (jsonb_typeof(settings) = 'object')
);

create table public.clinic_units (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null,
  slug text not null,
  status public.unit_status not null default 'active',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, slug),
  constraint clinic_units_name_length check (char_length(trim(name)) between 2 and 160),
  constraint clinic_units_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint clinic_units_settings_object check (jsonb_typeof(settings) = 'object')
);

create table public.clinic_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  unit_id uuid references public.clinic_units(id) on delete set null,
  role_id uuid not null references public.roles(id) on delete restrict,
  status public.membership_status not null default 'active',
  joined_at timestamptz not null default now(),
  invited_by uuid references auth.users(id) on delete set null,
  last_access_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, clinic_id)
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  unit_id uuid references public.clinic_units(id) on delete set null,
  name text not null,
  email text not null,
  role_id uuid not null references public.roles(id) on delete restrict,
  status public.invitation_status not null default 'pending',
  token_hash text not null unique,
  expires_at timestamptz not null,
  invited_by uuid not null references auth.users(id) on delete restrict,
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invitations_email_normalized check (email = lower(trim(email))),
  constraint invitations_name_length check (char_length(trim(name)) between 2 and 160),
  constraint invitations_expiration_after_creation check (expires_at > created_at)
);

create unique index invitations_one_pending_per_clinic_email
  on public.invitations (clinic_id, email)
  where status = 'pending';

create table public.user_active_contexts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  membership_id uuid not null references public.clinic_memberships(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  unit_id uuid references public.clinic_units(id) on delete set null,
  selected_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  clinic_id uuid references public.clinics(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_logs_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index clinic_memberships_user_status_idx on public.clinic_memberships (user_id, status);
create index clinic_memberships_clinic_status_idx on public.clinic_memberships (clinic_id, status);
create index invitations_email_status_idx on public.invitations (email, status);
create index audit_logs_clinic_created_idx on public.audit_logs (clinic_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_profiles_set_updated_at before update on public.user_profiles
for each row execute function public.set_updated_at();
create trigger clinics_set_updated_at before update on public.clinics
for each row execute function public.set_updated_at();
create trigger clinic_units_set_updated_at before update on public.clinic_units
for each row execute function public.set_updated_at();
create trigger clinic_memberships_set_updated_at before update on public.clinic_memberships
for each row execute function public.set_updated_at();
create trigger invitations_set_updated_at before update on public.invitations
for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_profiles (user_id, full_name, email)
  values (new.id, nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''), lower(new.email))
  on conflict (user_id) do update set email = excluded.email;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.handle_auth_user_email_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.user_profiles set email = lower(new.email) where user_id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_updated
after update of email on auth.users
for each row when (old.email is distinct from new.email)
execute function public.handle_auth_user_email_update();

create or replace function public.current_user_role_key(p_clinic_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select r.key
  from public.clinic_memberships m
  join public.roles r on r.id = m.role_id
  where m.user_id = auth.uid()
    and m.clinic_id = p_clinic_id
    and m.status = 'active'
  limit 1;
$$;

create or replace function public.is_clinic_member(p_clinic_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.clinic_memberships m
    where m.user_id = auth.uid()
      and m.clinic_id = p_clinic_id
      and m.status = 'active'
  );
$$;

create or replace function public.can_manage_clinic(p_clinic_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_user_role_key(p_clinic_id) in ('clinic_owner', 'clinic_admin'), false);
$$;

revoke all on function public.current_user_role_key(uuid) from public;
revoke all on function public.is_clinic_member(uuid) from public;
revoke all on function public.can_manage_clinic(uuid) from public;
grant execute on function public.current_user_role_key(uuid) to authenticated;
grant execute on function public.is_clinic_member(uuid) to authenticated;
grant execute on function public.can_manage_clinic(uuid) to authenticated;

alter table public.user_profiles enable row level security;
alter table public.roles enable row level security;
alter table public.clinics enable row level security;
alter table public.clinic_units enable row level security;
alter table public.clinic_memberships enable row level security;
alter table public.invitations enable row level security;
alter table public.user_active_contexts enable row level security;
alter table public.audit_logs enable row level security;

create policy user_profiles_select_self_or_managed_clinic
on public.user_profiles for select to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.clinic_memberships target
    where target.user_id = user_profiles.user_id
      and public.can_manage_clinic(target.clinic_id)
  )
);

create policy user_profiles_insert_self
on public.user_profiles for insert to authenticated
with check (user_id = auth.uid());

create policy user_profiles_update_self
on public.user_profiles for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy roles_select_authenticated
on public.roles for select to authenticated
using (true);

create policy clinics_select_member
on public.clinics for select to authenticated
using (public.is_clinic_member(id));

create policy clinics_update_manager
on public.clinics for update to authenticated
using (public.can_manage_clinic(id))
with check (public.can_manage_clinic(id));

create policy clinic_units_select_member
on public.clinic_units for select to authenticated
using (public.is_clinic_member(clinic_id));

create policy clinic_units_manage_admin
on public.clinic_units for all to authenticated
using (public.can_manage_clinic(clinic_id))
with check (public.can_manage_clinic(clinic_id));

create policy clinic_memberships_select_self_or_manager
on public.clinic_memberships for select to authenticated
using (user_id = auth.uid() or public.can_manage_clinic(clinic_id));

create policy invitations_select_recipient_or_manager
on public.invitations for select to authenticated
using (
  public.can_manage_clinic(clinic_id)
  or email = lower(coalesce(auth.jwt() ->> 'email', ''))
);

create policy user_active_contexts_select_self
on public.user_active_contexts for select to authenticated
using (user_id = auth.uid());

create policy audit_logs_select_manager
on public.audit_logs for select to authenticated
using (clinic_id is not null and public.can_manage_clinic(clinic_id));

grant select, insert, update on public.user_profiles to authenticated;
grant select on public.roles to authenticated;
grant select on public.clinics to authenticated;
grant update (name, status, settings, plan_code) on public.clinics to authenticated;
grant select, insert, update, delete on public.clinic_units to authenticated;
grant select on public.clinic_memberships to authenticated;
grant select on public.invitations to authenticated;
grant select on public.user_active_contexts to authenticated;
grant select on public.audit_logs to authenticated;

create or replace function public.create_clinic_with_owner(
  p_name text,
  p_slug text,
  p_settings jsonb default '{}'::jsonb,
  p_plan_code text default 'unassigned'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_clinic_id uuid;
  v_membership_id uuid;
  v_owner_role_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;

  select id into v_owner_role_id from public.roles where key = 'clinic_owner';

  insert into public.clinics (name, slug, owner_user_id, settings, plan_code)
  values (trim(p_name), lower(trim(p_slug)), v_user_id, coalesce(p_settings, '{}'::jsonb), coalesce(nullif(trim(p_plan_code), ''), 'unassigned'))
  returning id into v_clinic_id;

  insert into public.clinic_memberships (user_id, clinic_id, role_id, status)
  values (v_user_id, v_clinic_id, v_owner_role_id, 'active')
  returning id into v_membership_id;

  insert into public.user_active_contexts (user_id, membership_id, clinic_id)
  values (v_user_id, v_membership_id, v_clinic_id)
  on conflict (user_id) do update
    set membership_id = excluded.membership_id,
        clinic_id = excluded.clinic_id,
        unit_id = null,
        selected_at = now();

  insert into public.audit_logs (clinic_id, actor_user_id, action, entity_type, entity_id)
  values (v_clinic_id, v_user_id, 'clinic.created', 'clinic', v_clinic_id);

  return v_clinic_id;
end;
$$;

create or replace function public.set_active_clinic_context(p_membership_id uuid)
returns table (membership_id uuid, clinic_id uuid, unit_id uuid, role_key text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_membership public.clinic_memberships%rowtype;
  v_role_key text;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;

  select m.*
    into v_membership
  from public.clinic_memberships m
  join public.clinics c on c.id = m.clinic_id
  left join public.clinic_units u on u.id = m.unit_id
  where m.id = p_membership_id
    and m.user_id = v_user_id
    and m.status = 'active'
    and c.status = 'active'
    and (m.unit_id is null or u.status = 'active');

  if not found then raise exception 'invalid_active_context'; end if;

  select key into v_role_key
  from public.roles
  where id = v_membership.role_id;

  insert into public.user_active_contexts (user_id, membership_id, clinic_id, unit_id)
  values (v_user_id, v_membership.id, v_membership.clinic_id, v_membership.unit_id)
  on conflict (user_id) do update
    set membership_id = excluded.membership_id,
        clinic_id = excluded.clinic_id,
        unit_id = excluded.unit_id,
        selected_at = now();

  update public.clinic_memberships
  set last_access_at = now()
  where id = v_membership.id;

  insert into public.audit_logs (clinic_id, actor_user_id, action, entity_type, entity_id, metadata)
  values (v_membership.clinic_id, v_user_id, 'context.switched', 'clinic_membership', v_membership.id,
          jsonb_build_object('unit_id', v_membership.unit_id, 'role', v_role_key));

  return query select v_membership.id, v_membership.clinic_id, v_membership.unit_id, v_role_key;
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
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_role_id uuid;
  v_invitation_id uuid;
  v_expires_at timestamptz := coalesce(p_expires_at, now() + interval '7 days');
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if not public.can_manage_clinic(p_clinic_id) then raise exception 'insufficient_permission'; end if;
  if length(p_token) < 32 then raise exception 'invalid_invitation_token'; end if;
  if v_expires_at <= now() then raise exception 'invalid_expiration'; end if;

  select id into v_role_id
  from public.roles
  where key = p_role_key
    and is_enabled
    and is_assignable;

  if v_role_id is null then raise exception 'invalid_role'; end if;

  if p_unit_id is not null and not exists (
    select 1 from public.clinic_units where id = p_unit_id and clinic_id = p_clinic_id and status = 'active'
  ) then raise exception 'invalid_unit'; end if;

  update public.invitations
  set status = 'expired'
  where clinic_id = p_clinic_id and email = lower(trim(p_email))
    and status = 'pending' and expires_at <= now();

  insert into public.invitations (clinic_id, unit_id, name, email, role_id, token_hash, expires_at, invited_by)
  values (p_clinic_id, p_unit_id, trim(p_name), lower(trim(p_email)), v_role_id,
          encode(digest(p_token, 'sha256'), 'hex'), v_expires_at, v_user_id)
  returning id into v_invitation_id;

  insert into public.audit_logs (clinic_id, actor_user_id, action, entity_type, entity_id, metadata)
  values (p_clinic_id, v_user_id, 'invitation.created', 'invitation', v_invitation_id,
          jsonb_build_object('email', lower(trim(p_email)), 'role', p_role_key, 'unit_id', p_unit_id));

  return query select v_invitation_id, v_expires_at;
end;
$$;

create or replace function public.accept_clinic_invitation(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_invitation public.invitations%rowtype;
  v_membership_id uuid;
begin
  if v_user_id is null or v_email = '' then raise exception 'authentication_required'; end if;

  select * into v_invitation
  from public.invitations
  where token_hash = encode(digest(p_token, 'sha256'), 'hex')
  for update;

  if not found then raise exception 'invalid_invitation'; end if;
  if v_invitation.status <> 'pending' then raise exception 'invitation_already_used'; end if;
  if v_invitation.expires_at <= now() then raise exception 'invitation_expired'; end if;
  if v_invitation.email <> v_email then raise exception 'invitation_recipient_mismatch'; end if;

  insert into public.user_profiles (user_id, full_name, email)
  values (v_user_id, v_invitation.name, v_email)
  on conflict (user_id) do update
    set full_name = coalesce(nullif(public.user_profiles.full_name, ''), excluded.full_name),
        email = excluded.email;

  insert into public.clinic_memberships (user_id, clinic_id, unit_id, role_id, status, invited_by)
  values (v_user_id, v_invitation.clinic_id, v_invitation.unit_id, v_invitation.role_id, 'active', v_invitation.invited_by)
  on conflict (user_id, clinic_id) do update
    set unit_id = excluded.unit_id,
        role_id = excluded.role_id,
        status = 'active',
        invited_by = excluded.invited_by,
        joined_at = now()
  returning id into v_membership_id;

  update public.invitations
  set status = 'accepted', accepted_by = v_user_id, accepted_at = now()
  where id = v_invitation.id;

  insert into public.audit_logs (clinic_id, actor_user_id, action, entity_type, entity_id, metadata)
  values (v_invitation.clinic_id, v_user_id, 'invitation.accepted', 'invitation', v_invitation.id,
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
  v_current_role text;
  v_target_role text;
  v_new_role_id uuid;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;

  select m.* into v_membership
  from public.clinic_memberships m
  where m.id = p_membership_id
  for update;

  if not found then raise exception 'membership_not_found'; end if;

  select key into v_target_role
  from public.roles
  where id = v_membership.role_id;

  if not public.can_manage_clinic(v_membership.clinic_id) then raise exception 'insufficient_permission'; end if;

  v_current_role := public.current_user_role_key(v_membership.clinic_id);
  if v_target_role = 'clinic_owner' and (p_role_key is distinct from 'clinic_owner' or p_status = 'inactive') then
    raise exception 'clinic_owner_cannot_be_changed_here';
  end if;

  if p_role_key is not null and p_role_key <> v_target_role then
    if p_role_key = 'clinic_owner' then raise exception 'owner_transfer_not_available'; end if;
    if v_current_role = 'clinic_admin' and v_target_role = 'clinic_owner' then raise exception 'insufficient_permission'; end if;

    select id into v_new_role_id from public.roles
    where key = p_role_key and is_enabled and is_assignable;
    if v_new_role_id is null then raise exception 'invalid_role'; end if;

    update public.clinic_memberships set role_id = v_new_role_id where id = p_membership_id;
    insert into public.audit_logs (clinic_id, actor_user_id, action, entity_type, entity_id, metadata)
    values (v_membership.clinic_id, v_user_id, 'membership.role_changed', 'clinic_membership', p_membership_id,
            jsonb_build_object('from', v_target_role, 'to', p_role_key));
  end if;

  if p_status is not null and p_status <> v_membership.status then
    update public.clinic_memberships set status = p_status where id = p_membership_id;
    insert into public.audit_logs (clinic_id, actor_user_id, action, entity_type, entity_id, metadata)
    values (v_membership.clinic_id, v_user_id,
            case when p_status = 'active' then 'membership.activated' else 'membership.deactivated' end,
            'clinic_membership', p_membership_id,
            jsonb_build_object('from', v_membership.status, 'to', p_status));
  end if;
end;
$$;

revoke all on function public.create_clinic_with_owner(text, text, jsonb, text) from public;
revoke all on function public.set_active_clinic_context(uuid) from public;
revoke all on function public.create_clinic_invitation(uuid, text, text, text, text, uuid, timestamptz) from public;
revoke all on function public.accept_clinic_invitation(text) from public;
revoke all on function public.update_clinic_member(uuid, text, public.membership_status) from public;

grant execute on function public.create_clinic_with_owner(text, text, jsonb, text) to authenticated;
grant execute on function public.set_active_clinic_context(uuid) to authenticated;
grant execute on function public.create_clinic_invitation(uuid, text, text, text, text, uuid, timestamptz) to authenticated;
grant execute on function public.accept_clinic_invitation(text) to authenticated;
grant execute on function public.update_clinic_member(uuid, text, public.membership_status) to authenticated;
