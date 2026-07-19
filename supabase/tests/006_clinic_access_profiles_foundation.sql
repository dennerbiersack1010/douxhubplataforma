-- Teste transacional da Etapa 3, Ciclo 1.
-- Execute após 20260719190000_clinic_access_profiles_foundation.sql.

begin;

do $$
declare v_table text; v_rls boolean;
begin
  foreach v_table in array array[
    'clinic_users', 'clinic_roles', 'clinic_user_role_assignments', 'clinic_user_units', 'access_profiles'
  ] loop
    if to_regclass('public.' || v_table) is null then raise exception 'foundation_table_missing:%', v_table; end if;
    select relrowsecurity into v_rls from pg_class where oid = ('public.' || v_table)::regclass;
    if not coalesce(v_rls, false) then raise exception 'foundation_rls_missing:%', v_table; end if;
  end loop;
  if has_table_privilege('authenticated', 'public.clinic_users', 'INSERT')
     or has_table_privilege('authenticated', 'public.clinic_roles', 'UPDATE')
     or has_table_privilege('authenticated', 'public.access_profiles', 'DELETE') then
    raise exception 'foundation_direct_write_granted';
  end if;
end;
$$;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', '60000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'foundation-owner-a@douxhub.test', crypt('Test!123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Foundation Owner A"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '60000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'foundation-owner-b@douxhub.test', crypt('Test!123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Foundation Owner B"}', now(), now());

create temp table foundation_test_state (key text primary key, value_uuid uuid);
grant all on table foundation_test_state to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub', '60000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.email', 'foundation-owner-a@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"60000000-0000-0000-0000-000000000001","email":"foundation-owner-a@douxhub.test","role":"authenticated"}', true);
insert into foundation_test_state (key, value_uuid)
select 'clinic_a', clinic_id from public.create_initial_clinic(
  'Clínica Fundação A', 'Foundation Owner A', 'foundation-owner-a@douxhub.test', '11999991001', 'Unidade Fundação A'
);

select set_config('request.jwt.claim.sub', '60000000-0000-0000-0000-000000000002', true);
select set_config('request.jwt.claim.email', 'foundation-owner-b@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"60000000-0000-0000-0000-000000000002","email":"foundation-owner-b@douxhub.test","role":"authenticated"}', true);
insert into foundation_test_state (key, value_uuid)
select 'clinic_b', clinic_id from public.create_initial_clinic(
  'Clínica Fundação B', 'Foundation Owner B', 'foundation-owner-b@douxhub.test', '11999991002', 'Unidade Fundação B'
);

reset role;
do $$
declare
  v_clinic_a uuid := (select value_uuid from foundation_test_state where key = 'clinic_a');
  v_user_a uuid;
  v_admin_role uuid;
  v_second_unit uuid := gen_random_uuid();
begin
  if (select count(*) from public.clinic_roles cr where cr.clinic_id = v_clinic_a)
     <> (select count(*) from public.roles) then
    raise exception 'clinic_role_templates_not_seeded';
  end if;

  select cu.id into v_user_a from public.clinic_users cu
  where cu.clinic_id = v_clinic_a and cu.user_id = '60000000-0000-0000-0000-000000000001'
    and cu.status = 'active' and cu.source_membership_id is not null;
  if v_user_a is null then raise exception 'legacy_clinic_user_not_synced'; end if;

  if not exists (
    select 1 from public.clinic_user_role_assignments a
    join public.clinic_roles r on r.id = a.clinic_role_id
    where a.clinic_user_id = v_user_a and a.is_active and r.key = 'clinic_owner'
  ) then raise exception 'legacy_role_assignment_not_synced'; end if;

  if not exists (
    select 1 from public.clinic_user_units u where u.clinic_user_id = v_user_a and u.is_active
  ) then raise exception 'legacy_unit_assignment_not_synced'; end if;

  if not exists (
    select 1 from public.access_profiles p
    where p.clinic_user_id = v_user_a and p.status = 'active' and p.scope = 'unit'
      and p.source_membership_id is not null
  ) then raise exception 'legacy_access_profile_not_synced'; end if;

  select cr.id into v_admin_role from public.clinic_roles cr
  where cr.clinic_id = v_clinic_a and cr.key = 'clinic_admin';
  insert into public.clinic_user_role_assignments
    (clinic_id, clinic_user_id, clinic_role_id, is_active)
  values (v_clinic_a, v_user_a, v_admin_role, true);

  insert into public.clinic_units (id, clinic_id, name, slug, status)
  values (v_second_unit, v_clinic_a, 'Unidade Fundação A 2', 'unidade-fundacao-a-2', 'active');
  insert into public.clinic_user_units (clinic_id, clinic_user_id, unit_id, is_active)
  values (v_clinic_a, v_user_a, v_second_unit, true);

  if (select count(*) from public.clinic_user_role_assignments a where a.clinic_user_id = v_user_a and a.is_active) <> 2
     or (select count(*) from public.clinic_user_units u where u.clinic_user_id = v_user_a and u.is_active) <> 2 then
    raise exception 'multiple_roles_or_units_not_supported';
  end if;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '60000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.email', 'foundation-owner-a@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"60000000-0000-0000-0000-000000000001","email":"foundation-owner-a@douxhub.test","role":"authenticated"}', true);
do $$
begin
  if exists (
    select 1 from public.clinic_users cu
    where cu.clinic_id = (select value_uuid from foundation_test_state where key = 'clinic_b')
  ) or exists (
    select 1 from public.access_profiles p
    where p.clinic_id = (select value_uuid from foundation_test_state where key = 'clinic_b')
  ) then raise exception 'foundation_cross_clinic_visibility'; end if;
end;
$$;

reset role;
update public.clinic_memberships m
set status = 'inactive'
where m.user_id = '60000000-0000-0000-0000-000000000001'
  and m.clinic_id = (select value_uuid from foundation_test_state where key = 'clinic_a');

do $$
begin
  if not exists (
    select 1 from public.clinic_users cu
    where cu.user_id = '60000000-0000-0000-0000-000000000001' and cu.status = 'inactive'
  ) or not exists (
    select 1 from public.access_profiles p
    join public.clinic_users cu on cu.id = p.clinic_user_id
    where cu.user_id = '60000000-0000-0000-0000-000000000001'
      and p.source_membership_id is not null and p.status = 'inactive'
  ) then raise exception 'legacy_status_update_not_synchronized'; end if;
end;
$$;

select 'clinic_access_profiles_foundation_ok' as result;
rollback;
