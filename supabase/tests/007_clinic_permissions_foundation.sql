-- Teste transacional da Etapa 3, Ciclo 2.
-- Execute após 20260719200000_clinic_permissions_foundation.sql.

begin;

do $$
declare v_table text; v_rls boolean;
begin
  foreach v_table in array array[
    'permission_catalog', 'clinic_role_permissions', 'access_profile_permission_overrides'
  ] loop
    if to_regclass('public.' || v_table) is null then raise exception 'permission_table_missing:%', v_table; end if;
    select relrowsecurity into v_rls from pg_class where oid = ('public.' || v_table)::regclass;
    if not coalesce(v_rls, false) then raise exception 'permission_rls_missing:%', v_table; end if;
  end loop;

  if has_table_privilege('authenticated', 'public.permission_catalog', 'INSERT')
     or has_table_privilege('authenticated', 'public.clinic_role_permissions', 'UPDATE')
     or has_table_privilege('authenticated', 'public.access_profile_permission_overrides', 'DELETE') then
    raise exception 'permission_direct_write_granted';
  end if;

  if exists (
    select 1 from public.permission_catalog pc
    where pc.key !~ '^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$' or cardinality(pc.allowed_scopes) = 0
  ) then raise exception 'permission_catalog_contract_invalid'; end if;
end;
$$;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', '70000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'permissions-owner-a@douxhub.test', crypt('Test!123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Permissions Owner A"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '70000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'permissions-owner-b@douxhub.test', crypt('Test!123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Permissions Owner B"}', now(), now());

create temp table permissions_test_state (key text primary key, value_uuid uuid);
grant all on table permissions_test_state to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub', '70000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.email', 'permissions-owner-a@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"70000000-0000-0000-0000-000000000001","email":"permissions-owner-a@douxhub.test","role":"authenticated"}', true);
insert into permissions_test_state (key, value_uuid)
select 'clinic_a', clinic_id from public.create_initial_clinic(
  'Clínica Permissões A', 'Permissions Owner A', 'permissions-owner-a@douxhub.test', '11999992001', 'Unidade Permissões A'
);

select set_config('request.jwt.claim.sub', '70000000-0000-0000-0000-000000000002', true);
select set_config('request.jwt.claim.email', 'permissions-owner-b@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"70000000-0000-0000-0000-000000000002","email":"permissions-owner-b@douxhub.test","role":"authenticated"}', true);
insert into permissions_test_state (key, value_uuid)
select 'clinic_b', clinic_id from public.create_initial_clinic(
  'Clínica Permissões B', 'Permissions Owner B', 'permissions-owner-b@douxhub.test', '11999992002', 'Unidade Permissões B'
);

reset role;
insert into permissions_test_state (key, value_uuid)
select 'profile_a', ap.id
from public.access_profiles ap
join public.clinic_users cu on cu.id = ap.clinic_user_id
where cu.user_id = '70000000-0000-0000-0000-000000000001' and ap.status = 'active';
insert into permissions_test_state (key, value_uuid)
select 'profile_b', ap.id
from public.access_profiles ap
join public.clinic_users cu on cu.id = ap.clinic_user_id
where cu.user_id = '70000000-0000-0000-0000-000000000002' and ap.status = 'active';

do $$
declare
  v_clinic_a uuid := (select value_uuid from permissions_test_state where key = 'clinic_a');
begin
  if not exists (
    select 1
    from public.clinic_role_permissions crp
    join public.clinic_roles cr on cr.id = crp.clinic_role_id
    join public.permission_catalog pc on pc.id = crp.permission_id
    where cr.clinic_id = v_clinic_a and cr.key = 'clinic_owner'
      and pc.key = 'team_admins.invite' and crp.scope = 'clinic'
  ) then raise exception 'owner_permission_matrix_not_seeded'; end if;

  if exists (
    select 1
    from public.clinic_role_permissions crp
    join public.clinic_roles cr on cr.id = crp.clinic_role_id
    where cr.clinic_id = v_clinic_a and cr.key in ('receptionist', 'professional', 'commercial', 'financial', 'stock_manager')
  ) then raise exception 'future_role_received_permission'; end if;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '70000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.email', 'permissions-owner-a@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"70000000-0000-0000-0000-000000000001","email":"permissions-owner-a@douxhub.test","role":"authenticated"}', true);

do $$
declare
  v_profile_a uuid := (select value_uuid from permissions_test_state where key = 'profile_a');
begin
  if not public.access_profile_has_permission(v_profile_a, 'team_members.read', 'clinic') then
    raise exception 'role_permission_not_effective';
  end if;
end;
$$;

reset role;
insert into public.access_profile_permission_overrides
  (clinic_id, access_profile_id, permission_id, scope, effect, reason)
select ap.clinic_id, ap.id, pc.id, 'clinic', 'deny', 'Teste de precedência da negação'
from public.access_profiles ap
cross join public.permission_catalog pc
where ap.id = (select value_uuid from permissions_test_state where key = 'profile_a')
  and pc.key = 'team_members.read';

set local role authenticated;
select set_config('request.jwt.claim.sub', '70000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.email', 'permissions-owner-a@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"70000000-0000-0000-0000-000000000001","email":"permissions-owner-a@douxhub.test","role":"authenticated"}', true);
do $$
declare
  v_profile_a uuid := (select value_uuid from permissions_test_state where key = 'profile_a');
begin
  if public.access_profile_has_permission(v_profile_a, 'team_members.read', 'clinic') then
    raise exception 'explicit_deny_did_not_precede_role_grant';
  end if;
  if not exists (
    select 1 from public.get_effective_access_profile_permissions(v_profile_a) e
    where e.permission_key = 'team_members.read' and not e.is_allowed and e.source = 'profile_deny'
  ) then raise exception 'explicit_deny_source_missing'; end if;
end;
$$;

reset role;
delete from public.access_profile_permission_overrides
where access_profile_id = (select value_uuid from permissions_test_state where key = 'profile_a');
delete from public.clinic_role_permissions crp
using public.access_profiles ap, public.permission_catalog pc
where crp.clinic_role_id = ap.clinic_role_id
  and crp.permission_id = pc.id
  and ap.id = (select value_uuid from permissions_test_state where key = 'profile_a')
  and pc.key = 'team_admins.invite'
  and crp.scope = 'clinic';
insert into public.access_profile_permission_overrides
  (clinic_id, access_profile_id, permission_id, scope, effect, reason)
select ap.clinic_id, ap.id, pc.id, 'clinic', 'allow', 'Teste de concessão personalizada'
from public.access_profiles ap
cross join public.permission_catalog pc
where ap.id = (select value_uuid from permissions_test_state where key = 'profile_a')
  and pc.key = 'team_admins.invite';

set local role authenticated;
select set_config('request.jwt.claim.sub', '70000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.email', 'permissions-owner-a@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"70000000-0000-0000-0000-000000000001","email":"permissions-owner-a@douxhub.test","role":"authenticated"}', true);
do $$
declare
  v_profile_a uuid := (select value_uuid from permissions_test_state where key = 'profile_a');
  v_profile_b uuid := (select value_uuid from permissions_test_state where key = 'profile_b');
begin
  if not exists (
    select 1 from public.get_effective_access_profile_permissions(v_profile_a) e
    where e.permission_key = 'team_admins.invite' and e.is_allowed and e.source = 'profile_allow'
  ) then raise exception 'explicit_allow_not_effective'; end if;

  if exists (
    select 1 from public.clinic_role_permissions crp
    where crp.clinic_id = (select value_uuid from permissions_test_state where key = 'clinic_b')
  ) then raise exception 'cross_clinic_permission_matrix_visible'; end if;

  begin
    perform public.get_effective_access_profile_permissions(v_profile_b);
    raise exception 'cross_user_profile_function_allowed';
  exception when others then
    if sqlerrm <> 'access_profile_not_available' then raise; end if;
  end;
end;
$$;

reset role;
do $$
declare
  v_profile_a uuid := (select value_uuid from permissions_test_state where key = 'profile_a');
  v_permission_id uuid := (select id from public.permission_catalog where key = 'team_members.read');
  v_clinic_a uuid := (select value_uuid from permissions_test_state where key = 'clinic_a');
begin
  begin
    insert into public.access_profile_permission_overrides
      (clinic_id, access_profile_id, permission_id, scope, effect)
    values (v_clinic_a, v_profile_a, v_permission_id, 'unit', 'allow');
    raise exception 'invalid_permission_scope_accepted';
  exception when others then
    if sqlerrm <> 'permission_scope_not_allowed' then raise; end if;
  end;
end;
$$;

select 'clinic_permissions_foundation_ok' as result;
rollback;
