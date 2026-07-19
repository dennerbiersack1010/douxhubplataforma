-- DouxHub Etapa 3, Ciclo 2: catálogo, matriz de função e exceções de perfil.
-- A autorização vigente continua baseada em clinic_memberships até o portão de equivalência.

create type public.permission_scope as enum ('own', 'unit', 'clinic');
create type public.permission_override_effect as enum ('allow', 'deny');

alter table public.access_profiles
  add constraint access_profiles_id_clinic_unique unique (id, clinic_id);

create table public.permission_catalog (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text not null,
  allowed_scopes public.permission_scope[] not null,
  is_sensitive boolean not null default false,
  is_profile_customizable boolean not null default true,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint permission_catalog_key_format check (key ~ '^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$'),
  constraint permission_catalog_description_length check (char_length(trim(description)) between 3 and 240),
  constraint permission_catalog_allowed_scopes_not_empty check (cardinality(allowed_scopes) > 0)
);

create table public.clinic_role_permissions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  clinic_role_id uuid not null,
  permission_id uuid not null references public.permission_catalog(id) on delete restrict,
  scope public.permission_scope not null,
  source text not null default 'system_template',
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (clinic_role_id, clinic_id) references public.clinic_roles(id, clinic_id) on delete cascade,
  unique (clinic_role_id, permission_id, scope),
  constraint clinic_role_permissions_source_check check (source in ('system_template', 'clinic_customization'))
);

create table public.access_profile_permission_overrides (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  access_profile_id uuid not null,
  permission_id uuid not null references public.permission_catalog(id) on delete restrict,
  scope public.permission_scope not null,
  effect public.permission_override_effect not null,
  reason text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (access_profile_id, clinic_id) references public.access_profiles(id, clinic_id) on delete cascade,
  unique (access_profile_id, permission_id, scope),
  constraint access_profile_permission_reason_length check (reason is null or char_length(trim(reason)) between 3 and 240)
);

create index clinic_role_permissions_clinic_role_idx
  on public.clinic_role_permissions (clinic_id, clinic_role_id);
create index access_profile_permission_overrides_profile_idx
  on public.access_profile_permission_overrides (clinic_id, access_profile_id);

create trigger permission_catalog_set_updated_at before update on public.permission_catalog
for each row execute function public.set_updated_at();
create trigger clinic_role_permissions_set_updated_at before update on public.clinic_role_permissions
for each row execute function public.set_updated_at();
create trigger access_profile_permission_overrides_set_updated_at before update on public.access_profile_permission_overrides
for each row execute function public.set_updated_at();

insert into public.permission_catalog
  (key, description, allowed_scopes, is_sensitive, is_profile_customizable)
values
  ('clinic.read', 'Visualizar os dados da clínica disponíveis ao perfil.', array['unit', 'clinic']::public.permission_scope[], false, false),
  ('clinic_units.read', 'Visualizar as unidades vinculadas disponíveis ao perfil.', array['unit', 'clinic']::public.permission_scope[], false, false),
  ('clinic_settings.manage', 'Alterar configurações administrativas da clínica.', array['clinic']::public.permission_scope[], true, true),
  ('team_members.read', 'Visualizar membros da clínica.', array['clinic']::public.permission_scope[], true, true),
  ('team_admins.invite', 'Convidar administradores para a clínica.', array['clinic']::public.permission_scope[], true, true),
  ('team_employees.invite', 'Convidar colaboradores para a clínica.', array['clinic']::public.permission_scope[], true, true),
  ('team_employee_invitations.revoke', 'Revogar convites destinados a colaboradores.', array['clinic']::public.permission_scope[], true, true),
  ('team_members.role_update', 'Alterar funções permitidas de membros da clínica.', array['clinic']::public.permission_scope[], true, true),
  ('team_employees.status_update', 'Ativar ou desativar colaboradores da clínica.', array['clinic']::public.permission_scope[], true, true),
  ('context.switch', 'Trocar o próprio contexto ativo por outro contexto autorizado.', array['own']::public.permission_scope[], false, false);

create or replace function public.validate_permission_scope()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_allowed_scopes public.permission_scope[];
  v_enabled boolean;
  v_customizable boolean;
begin
  select pc.allowed_scopes, pc.is_enabled, pc.is_profile_customizable
    into v_allowed_scopes, v_enabled, v_customizable
  from public.permission_catalog pc
  where pc.id = new.permission_id;

  if not found or not v_enabled then raise exception 'permission_not_available'; end if;
  if not (new.scope = any(v_allowed_scopes)) then raise exception 'permission_scope_not_allowed'; end if;
  if tg_table_name = 'access_profile_permission_overrides' and not v_customizable then
    raise exception 'permission_not_profile_customizable';
  end if;
  return new;
end;
$$;

create trigger clinic_role_permissions_validate_scope
before insert or update of permission_id, scope on public.clinic_role_permissions
for each row execute function public.validate_permission_scope();
create trigger access_profile_permissions_validate_scope
before insert or update of permission_id, scope on public.access_profile_permission_overrides
for each row execute function public.validate_permission_scope();

create or replace function public.seed_clinic_role_permissions(p_clinic_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.clinic_role_permissions
    (clinic_id, clinic_role_id, permission_id, scope, source)
  select p_clinic_id, cr.id, pc.id, seed.scope, 'system_template'
  from (values
    ('clinic_owner', 'clinic.read', 'clinic'::public.permission_scope),
    ('clinic_owner', 'clinic_units.read', 'clinic'::public.permission_scope),
    ('clinic_owner', 'clinic_settings.manage', 'clinic'::public.permission_scope),
    ('clinic_owner', 'team_members.read', 'clinic'::public.permission_scope),
    ('clinic_owner', 'team_admins.invite', 'clinic'::public.permission_scope),
    ('clinic_owner', 'team_employees.invite', 'clinic'::public.permission_scope),
    ('clinic_owner', 'team_employee_invitations.revoke', 'clinic'::public.permission_scope),
    ('clinic_owner', 'team_members.role_update', 'clinic'::public.permission_scope),
    ('clinic_owner', 'team_employees.status_update', 'clinic'::public.permission_scope),
    ('clinic_owner', 'context.switch', 'own'::public.permission_scope),
    ('clinic_admin', 'clinic.read', 'clinic'::public.permission_scope),
    ('clinic_admin', 'clinic_units.read', 'clinic'::public.permission_scope),
    ('clinic_admin', 'clinic_settings.manage', 'clinic'::public.permission_scope),
    ('clinic_admin', 'team_members.read', 'clinic'::public.permission_scope),
    ('clinic_admin', 'team_employees.invite', 'clinic'::public.permission_scope),
    ('clinic_admin', 'team_employee_invitations.revoke', 'clinic'::public.permission_scope),
    ('clinic_admin', 'team_employees.status_update', 'clinic'::public.permission_scope),
    ('clinic_admin', 'context.switch', 'own'::public.permission_scope),
    ('clinic_employee', 'clinic.read', 'unit'::public.permission_scope),
    ('clinic_employee', 'clinic_units.read', 'unit'::public.permission_scope),
    ('clinic_employee', 'context.switch', 'own'::public.permission_scope)
  ) as seed(role_key, permission_key, scope)
  join public.clinic_roles cr on cr.clinic_id = p_clinic_id and cr.key = seed.role_key
  join public.permission_catalog pc on pc.key = seed.permission_key and pc.is_enabled
  on conflict (clinic_role_id, permission_id, scope) do nothing;
end;
$$;

create or replace function public.seed_clinic_role_permissions_after_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.seed_clinic_role_permissions(new.clinic_id);
  return new;
end;
$$;

create trigger clinic_roles_seed_permissions
after insert on public.clinic_roles
for each row execute function public.seed_clinic_role_permissions_after_insert();

do $$
declare v_clinic_id uuid;
begin
  for v_clinic_id in select c.id from public.clinics c loop
    perform public.seed_clinic_role_permissions(v_clinic_id);
  end loop;
end;
$$;

create or replace function public.get_effective_access_profile_permissions(p_access_profile_id uuid)
returns table (
  permission_key text,
  scope public.permission_scope,
  is_allowed boolean,
  source text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.access_profiles%rowtype;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;

  select ap.* into v_profile
  from public.access_profiles ap
  join public.clinic_users cu on cu.id = ap.clinic_user_id and cu.clinic_id = ap.clinic_id
  join public.clinics c on c.id = ap.clinic_id
  join public.clinic_roles cr on cr.id = ap.clinic_role_id and cr.clinic_id = ap.clinic_id
  where ap.id = p_access_profile_id
    and cu.user_id = auth.uid()
    and cu.status = 'active'
    and ap.status = 'active'
    and c.status = 'active'
    and cr.is_enabled
    and exists (
      select 1 from public.clinic_user_role_assignments cura
      where cura.clinic_user_id = ap.clinic_user_id
        and cura.clinic_role_id = ap.clinic_role_id
        and cura.is_active
    )
    and (
      ap.unit_id is null or exists (
        select 1
        from public.clinic_user_units cuu
        join public.clinic_units u on u.id = cuu.unit_id and u.clinic_id = cuu.clinic_id
        where cuu.clinic_user_id = ap.clinic_user_id
          and cuu.unit_id = ap.unit_id
          and cuu.is_active
          and u.status = 'active'
      )
    );

  if not found then raise exception 'access_profile_not_available'; end if;

  return query
  with candidates as (
    select crp.permission_id, crp.scope, true as role_grant,
           false as override_allow, false as override_deny
    from public.clinic_role_permissions crp
    where crp.clinic_role_id = v_profile.clinic_role_id
      and crp.clinic_id = v_profile.clinic_id
    union all
    select apo.permission_id, apo.scope, false,
           apo.effect = 'allow'::public.permission_override_effect,
           apo.effect = 'deny'::public.permission_override_effect
    from public.access_profile_permission_overrides apo
    where apo.access_profile_id = v_profile.id
      and apo.clinic_id = v_profile.clinic_id
  ), effective as (
    select c.permission_id, c.scope,
      bool_or(c.role_grant) as has_role_grant,
      bool_or(c.override_allow) as has_override_allow,
      bool_or(c.override_deny) as has_override_deny
    from candidates c
    group by c.permission_id, c.scope
  )
  select pc.key, e.scope,
    not e.has_override_deny and (e.has_role_grant or e.has_override_allow),
    case
      when e.has_override_deny then 'profile_deny'
      when e.has_override_allow then 'profile_allow'
      else 'clinic_role'
    end
  from effective e
  join public.permission_catalog pc on pc.id = e.permission_id
  where pc.is_enabled
  order by pc.key, e.scope;
end;
$$;

create or replace function public.access_profile_has_permission(
  p_access_profile_id uuid,
  p_permission_key text,
  p_scope public.permission_scope
)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select coalesce((
    select e.is_allowed
    from public.get_effective_access_profile_permissions(p_access_profile_id) e
    where e.permission_key = p_permission_key and e.scope = p_scope
  ), false);
$$;

alter table public.permission_catalog enable row level security;
alter table public.clinic_role_permissions enable row level security;
alter table public.access_profile_permission_overrides enable row level security;

create policy permission_catalog_select_authenticated
on public.permission_catalog for select to authenticated
using (is_enabled);

create policy clinic_role_permissions_select_member
on public.clinic_role_permissions for select to authenticated
using (public.is_clinic_member(clinic_id));

create policy access_profile_permission_overrides_select_self_or_manager
on public.access_profile_permission_overrides for select to authenticated
using (
  exists (
    select 1
    from public.access_profiles ap
    join public.clinic_users cu on cu.id = ap.clinic_user_id and cu.clinic_id = ap.clinic_id
    where ap.id = access_profile_id and cu.user_id = auth.uid()
  )
  or public.can_manage_clinic(clinic_id)
);

grant select on public.permission_catalog to authenticated;
grant select on public.clinic_role_permissions to authenticated;
grant select on public.access_profile_permission_overrides to authenticated;
grant execute on function public.get_effective_access_profile_permissions(uuid) to authenticated;
grant execute on function public.access_profile_has_permission(uuid, text, public.permission_scope) to authenticated;

revoke all on function public.validate_permission_scope() from public;
revoke all on function public.seed_clinic_role_permissions(uuid) from public;
revoke all on function public.seed_clinic_role_permissions_after_insert() from public;
revoke all on function public.get_effective_access_profile_permissions(uuid) from public;
revoke all on function public.access_profile_has_permission(uuid, text, public.permission_scope) from public;
grant execute on function public.get_effective_access_profile_permissions(uuid) to authenticated;
grant execute on function public.access_profile_has_permission(uuid, text, public.permission_scope) to authenticated;
