-- DouxHub Etapa 3, Ciclo 1: fundação aditiva de usuários, funções e perfis.
-- Mantém clinic_memberships como contrato vigente e cria uma ponte sincronizada.

do $$
begin
  if not exists (
    select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'clinic_user_status'
  ) then
    create type public.clinic_user_status as enum ('invited', 'active', 'inactive', 'suspended');
  end if;
  if not exists (
    select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'clinic_access_status'
  ) then
    create type public.clinic_access_status as enum ('active', 'inactive');
  end if;
  if not exists (
    select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'access_profile_scope'
  ) then
    create type public.access_profile_scope as enum ('clinic', 'unit');
  end if;
end;
$$;

alter table public.clinic_units
  add constraint clinic_units_id_clinic_unique unique (id, clinic_id);

create table public.clinic_users (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  source_membership_id uuid unique references public.clinic_memberships(id) on delete set null,
  invitation_id uuid references public.clinic_invitations(id) on delete set null,
  status public.clinic_user_status not null default 'active',
  display_name text,
  phone text,
  origin text not null default 'legacy_membership',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, user_id),
  unique (id, clinic_id),
  constraint clinic_users_origin_check check (origin in ('legacy_membership', 'onboarding', 'invitation', 'manual')),
  constraint clinic_users_display_name_length check (display_name is null or char_length(trim(display_name)) between 2 and 160),
  constraint clinic_users_end_after_start check (ended_at is null or ended_at >= started_at)
);

create table public.clinic_roles (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  template_role_id uuid references public.roles(id) on delete set null,
  key text not null,
  name text not null,
  description text,
  priority smallint not null default 100,
  is_system boolean not null default true,
  is_enabled boolean not null default true,
  is_assignable boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, key),
  unique (id, clinic_id),
  constraint clinic_roles_key_format check (key ~ '^[a-z][a-z0-9_]*$'),
  constraint clinic_roles_name_length check (char_length(trim(name)) between 2 and 160)
);

create table public.clinic_user_role_assignments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  clinic_user_id uuid not null,
  clinic_role_id uuid not null,
  source_membership_id uuid unique references public.clinic_memberships(id) on delete set null,
  is_active boolean not null default true,
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (clinic_user_id, clinic_id) references public.clinic_users(id, clinic_id) on delete cascade,
  foreign key (clinic_role_id, clinic_id) references public.clinic_roles(id, clinic_id) on delete cascade,
  unique (clinic_user_id, clinic_role_id),
  constraint clinic_user_role_end_after_assignment check (ended_at is null or ended_at >= assigned_at)
);

create table public.clinic_user_units (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  clinic_user_id uuid not null,
  unit_id uuid not null,
  source_membership_id uuid unique references public.clinic_memberships(id) on delete set null,
  is_active boolean not null default true,
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (clinic_user_id, clinic_id) references public.clinic_users(id, clinic_id) on delete cascade,
  foreign key (unit_id, clinic_id) references public.clinic_units(id, clinic_id) on delete cascade,
  unique (clinic_user_id, unit_id),
  constraint clinic_user_units_end_after_assignment check (ended_at is null or ended_at >= assigned_at)
);

create table public.access_profiles (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  clinic_user_id uuid not null,
  clinic_role_id uuid not null,
  unit_id uuid,
  source_membership_id uuid unique references public.clinic_memberships(id) on delete set null,
  name text not null,
  scope public.access_profile_scope not null,
  status public.clinic_access_status not null default 'active',
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (clinic_user_id, clinic_id) references public.clinic_users(id, clinic_id) on delete cascade,
  foreign key (clinic_role_id, clinic_id) references public.clinic_roles(id, clinic_id) on delete cascade,
  foreign key (unit_id, clinic_id) references public.clinic_units(id, clinic_id) on delete cascade,
  constraint access_profiles_name_length check (char_length(trim(name)) between 2 and 200),
  constraint access_profiles_scope_unit_check check (
    (scope = 'clinic' and unit_id is null) or (scope = 'unit' and unit_id is not null)
  )
);

create index clinic_users_user_status_idx on public.clinic_users (user_id, status);
create index clinic_users_clinic_status_idx on public.clinic_users (clinic_id, status);
create index clinic_roles_clinic_enabled_idx on public.clinic_roles (clinic_id, is_enabled);
create index clinic_user_roles_user_active_idx on public.clinic_user_role_assignments (clinic_user_id, is_active);
create index clinic_user_units_user_active_idx on public.clinic_user_units (clinic_user_id, is_active);
create index access_profiles_user_status_idx on public.access_profiles (clinic_user_id, status);
create index access_profiles_clinic_status_idx on public.access_profiles (clinic_id, status);

create trigger clinic_users_set_updated_at before update on public.clinic_users
for each row execute function public.set_updated_at();
create trigger clinic_roles_set_updated_at before update on public.clinic_roles
for each row execute function public.set_updated_at();
create trigger clinic_user_role_assignments_set_updated_at before update on public.clinic_user_role_assignments
for each row execute function public.set_updated_at();
create trigger clinic_user_units_set_updated_at before update on public.clinic_user_units
for each row execute function public.set_updated_at();
create trigger access_profiles_set_updated_at before update on public.access_profiles
for each row execute function public.set_updated_at();

create or replace function public.seed_clinic_role_templates(p_clinic_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.clinic_roles
    (clinic_id, template_role_id, key, name, description, priority, is_system, is_enabled, is_assignable)
  select p_clinic_id, r.id, r.key, r.name, r.description, r.priority, true, r.is_enabled, r.is_assignable
  from public.roles r
  on conflict (clinic_id, key) do update
    set template_role_id = excluded.template_role_id,
        name = excluded.name,
        description = excluded.description,
        priority = excluded.priority,
        is_enabled = excluded.is_enabled,
        is_assignable = excluded.is_assignable;
end;
$$;

create or replace function public.seed_clinic_roles_after_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.seed_clinic_role_templates(new.id);
  return new;
end;
$$;

create trigger clinics_seed_role_templates
after insert on public.clinics
for each row execute function public.seed_clinic_roles_after_insert();

create or replace function public.sync_legacy_clinic_membership(p_membership_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membership public.clinic_memberships%rowtype;
  v_role public.roles%rowtype;
  v_clinic_user_id uuid;
  v_clinic_role_id uuid;
  v_unit_name text;
  v_profile_name text;
  v_is_active boolean;
begin
  select m.* into v_membership from public.clinic_memberships m where m.id = p_membership_id;
  if not found then return; end if;

  select r.* into v_role from public.roles r where r.id = v_membership.role_id;
  if not found then raise exception 'legacy_membership_role_missing'; end if;

  perform public.seed_clinic_role_templates(v_membership.clinic_id);
  v_is_active := v_membership.status = 'active';

  insert into public.clinic_users
    (clinic_id, user_id, source_membership_id, status, origin, started_at, created_by)
  values
    (v_membership.clinic_id, v_membership.user_id, v_membership.id,
     case when v_is_active then 'active'::public.clinic_user_status else 'inactive'::public.clinic_user_status end,
     'legacy_membership', v_membership.joined_at, v_membership.invited_by)
  on conflict (clinic_id, user_id) do update
    set source_membership_id = excluded.source_membership_id,
        status = excluded.status,
        ended_at = case when excluded.status = 'active' then null else now() end
  returning id into v_clinic_user_id;

  select cr.id into v_clinic_role_id
  from public.clinic_roles cr
  where cr.clinic_id = v_membership.clinic_id and cr.key = v_role.key;

  insert into public.clinic_user_role_assignments
    (clinic_id, clinic_user_id, clinic_role_id, source_membership_id, is_active, assigned_by, assigned_at, ended_at)
  values
    (v_membership.clinic_id, v_clinic_user_id, v_clinic_role_id, v_membership.id,
     v_is_active, v_membership.invited_by, v_membership.joined_at,
     case when v_is_active then null else now() end)
  on conflict (source_membership_id) do update
    set clinic_user_id = excluded.clinic_user_id,
        clinic_role_id = excluded.clinic_role_id,
        is_active = excluded.is_active,
        ended_at = excluded.ended_at;

  if v_membership.unit_id is not null then
    select u.name into v_unit_name from public.clinic_units u where u.id = v_membership.unit_id;
    if v_unit_name is null then raise exception 'legacy_membership_unit_missing'; end if;

    insert into public.clinic_user_units
      (clinic_id, clinic_user_id, unit_id, source_membership_id, is_active, assigned_by, assigned_at, ended_at)
    values
      (v_membership.clinic_id, v_clinic_user_id, v_membership.unit_id, v_membership.id,
       v_is_active, v_membership.invited_by, v_membership.joined_at,
       case when v_is_active then null else now() end)
    on conflict (source_membership_id) do update
      set clinic_user_id = excluded.clinic_user_id,
          unit_id = excluded.unit_id,
          is_active = excluded.is_active,
          ended_at = excluded.ended_at;
  else
    update public.clinic_user_units cuu
    set is_active = false, ended_at = coalesce(cuu.ended_at, now())
    where cuu.source_membership_id = v_membership.id;
  end if;

  v_profile_name := case
    when v_membership.unit_id is null then v_role.name
    else v_role.name || ' — ' || v_unit_name
  end;

  insert into public.access_profiles
    (clinic_id, clinic_user_id, clinic_role_id, unit_id, source_membership_id, name, scope, status, last_used_at)
  values
    (v_membership.clinic_id, v_clinic_user_id, v_clinic_role_id, v_membership.unit_id,
     v_membership.id, v_profile_name,
     case when v_membership.unit_id is null then 'clinic'::public.access_profile_scope else 'unit'::public.access_profile_scope end,
     case when v_is_active then 'active'::public.clinic_access_status else 'inactive'::public.clinic_access_status end,
     v_membership.last_access_at)
  on conflict (source_membership_id) do update
    set clinic_user_id = excluded.clinic_user_id,
        clinic_role_id = excluded.clinic_role_id,
        unit_id = excluded.unit_id,
        name = excluded.name,
        scope = excluded.scope,
        status = excluded.status,
        last_used_at = excluded.last_used_at;
end;
$$;

create or replace function public.sync_legacy_clinic_membership_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.sync_legacy_clinic_membership(new.id);
  return new;
end;
$$;

create trigger clinic_memberships_sync_access_foundation
after insert or update of role_id, unit_id, status on public.clinic_memberships
for each row execute function public.sync_legacy_clinic_membership_trigger();

do $$
declare v_clinic_id uuid; v_membership_id uuid;
begin
  for v_clinic_id in select c.id from public.clinics c loop
    perform public.seed_clinic_role_templates(v_clinic_id);
  end loop;
  for v_membership_id in select m.id from public.clinic_memberships m loop
    perform public.sync_legacy_clinic_membership(v_membership_id);
  end loop;
end;
$$;

alter table public.clinic_users enable row level security;
alter table public.clinic_roles enable row level security;
alter table public.clinic_user_role_assignments enable row level security;
alter table public.clinic_user_units enable row level security;
alter table public.access_profiles enable row level security;

create policy clinic_users_select_self_or_manager
on public.clinic_users for select to authenticated
using (user_id = auth.uid() or public.can_manage_clinic(clinic_id));

create policy clinic_roles_select_member
on public.clinic_roles for select to authenticated
using (public.is_clinic_member(clinic_id));

create policy clinic_user_role_assignments_select_self_or_manager
on public.clinic_user_role_assignments for select to authenticated
using (
  exists (select 1 from public.clinic_users cu where cu.id = clinic_user_id and cu.user_id = auth.uid())
  or public.can_manage_clinic(clinic_id)
);

create policy clinic_user_units_select_self_or_manager
on public.clinic_user_units for select to authenticated
using (
  exists (select 1 from public.clinic_users cu where cu.id = clinic_user_id and cu.user_id = auth.uid())
  or public.can_manage_clinic(clinic_id)
);

create policy access_profiles_select_self_or_manager
on public.access_profiles for select to authenticated
using (
  exists (select 1 from public.clinic_users cu where cu.id = clinic_user_id and cu.user_id = auth.uid())
  or public.can_manage_clinic(clinic_id)
);

grant select on public.clinic_users to authenticated;
grant select on public.clinic_roles to authenticated;
grant select on public.clinic_user_role_assignments to authenticated;
grant select on public.clinic_user_units to authenticated;
grant select on public.access_profiles to authenticated;

revoke all on function public.seed_clinic_role_templates(uuid) from public;
revoke all on function public.seed_clinic_roles_after_insert() from public;
revoke all on function public.sync_legacy_clinic_membership(uuid) from public;
revoke all on function public.sync_legacy_clinic_membership_trigger() from public;
