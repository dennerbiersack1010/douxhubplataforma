-- Teste transacional da Etapa 3, Ciclo 3.
-- Execute após 20260719210000_access_profile_equivalence_gate.sql.

begin;

do $$
begin
  if has_function_privilege('anon', 'public.get_access_profile_equivalence()', 'EXECUTE')
     or has_function_privilege('anon', 'public.list_available_access_profiles()', 'EXECUTE')
     or has_function_privilege('anon', 'public.get_access_profile_transition_snapshot()', 'EXECUTE') then
    raise exception 'anonymous_equivalence_function_access';
  end if;
end;
$$;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', '80000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'equivalence-owner-a@douxhub.test', crypt('Test!123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Equivalence Owner A"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '80000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'equivalence-owner-b@douxhub.test', crypt('Test!123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Equivalence Owner B"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '80000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'equivalence-empty@douxhub.test', crypt('Test!123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Equivalence Empty"}', now(), now());

create temp table equivalence_test_state (key text primary key, value_uuid uuid);
grant all on table equivalence_test_state to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub', '80000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.email', 'equivalence-owner-a@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"80000000-0000-0000-0000-000000000001","email":"equivalence-owner-a@douxhub.test","role":"authenticated"}', true);
insert into equivalence_test_state (key, value_uuid)
select 'clinic_a', clinic_id from public.create_initial_clinic(
  'Clínica Equivalência A', 'Equivalence Owner A', 'equivalence-owner-a@douxhub.test', '11999993001', 'Unidade Equivalência A'
);

select set_config('request.jwt.claim.sub', '80000000-0000-0000-0000-000000000002', true);
select set_config('request.jwt.claim.email', 'equivalence-owner-b@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"80000000-0000-0000-0000-000000000002","email":"equivalence-owner-b@douxhub.test","role":"authenticated"}', true);
insert into equivalence_test_state (key, value_uuid)
select 'clinic_b', clinic_id from public.create_initial_clinic(
  'Clínica Equivalência B', 'Equivalence Owner B', 'equivalence-owner-b@douxhub.test', '11999993002', 'Unidade Equivalência B'
);

reset role;
insert into public.clinic_memberships (user_id, clinic_id, unit_id, role_id, status)
select
  '80000000-0000-0000-0000-000000000001',
  c.id,
  u.id,
  r.id,
  'active'
from public.clinics c
join public.clinic_units u on u.clinic_id = c.id
cross join public.roles r
where c.id = (select value_uuid from equivalence_test_state where key = 'clinic_b')
  and r.key = 'clinic_employee';

set local role authenticated;
select set_config('request.jwt.claim.sub', '80000000-0000-0000-0000-000000000003', true);
select set_config('request.jwt.claim.email', 'equivalence-empty@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"80000000-0000-0000-0000-000000000003","email":"equivalence-empty@douxhub.test","role":"authenticated"}', true);
do $$
declare v_snapshot jsonb := public.get_access_profile_transition_snapshot();
begin
  if (v_snapshot ->> 'equivalence_ready')::boolean is not true
     or (v_snapshot ->> 'legacy_membership_count')::integer <> 0
     or jsonb_array_length(v_snapshot -> 'profiles') <> 0 then
    raise exception 'zero_membership_snapshot_invalid';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '80000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.email', 'equivalence-owner-a@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"80000000-0000-0000-0000-000000000001","email":"equivalence-owner-a@douxhub.test","role":"authenticated"}', true);
do $$
declare v_snapshot jsonb := public.get_access_profile_transition_snapshot();
begin
  if (v_snapshot ->> 'equivalence_ready')::boolean is not true
     or (v_snapshot ->> 'legacy_membership_count')::integer <> 2
     or (v_snapshot ->> 'equivalent_membership_count')::integer <> 2
     or jsonb_array_length(v_snapshot -> 'profiles') <> 2
     or jsonb_array_length(v_snapshot -> 'issues') <> 0 then
    raise exception 'multiple_membership_equivalence_invalid:%', v_snapshot;
  end if;

  if exists (
    select 1 from public.list_available_access_profiles() p
    where p.clinic_id not in (
      (select value_uuid from equivalence_test_state where key = 'clinic_a'),
      (select value_uuid from equivalence_test_state where key = 'clinic_b')
    )
  ) then raise exception 'cross_account_profile_visible'; end if;

  if exists (
    select 1 from public.list_available_access_profiles() p
    where jsonb_array_length(p.permissions) = 0 or not p.legacy_equivalent
  ) then raise exception 'available_profile_contract_invalid'; end if;
end;
$$;

reset role;
update public.access_profiles ap
set status = 'inactive'
where ap.source_membership_id = (
  select m.id
  from public.clinic_memberships m
  where m.user_id = '80000000-0000-0000-0000-000000000001'
    and m.clinic_id = (select value_uuid from equivalence_test_state where key = 'clinic_a')
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '80000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.email', 'equivalence-owner-a@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"80000000-0000-0000-0000-000000000001","email":"equivalence-owner-a@douxhub.test","role":"authenticated"}', true);
do $$
declare v_snapshot jsonb := public.get_access_profile_transition_snapshot();
begin
  if (v_snapshot ->> 'equivalence_ready')::boolean is not false
     or jsonb_array_length(v_snapshot -> 'issues') <> 1
     or v_snapshot #>> '{issues,0,issue_code}' <> 'active_state_mismatch'
     or jsonb_array_length(v_snapshot -> 'profiles') <> 1 then
    raise exception 'divergence_not_blocked:%', v_snapshot;
  end if;
end;
$$;

reset role;
update public.clinic_memberships m
set status = 'inactive'
where m.user_id = '80000000-0000-0000-0000-000000000001'
  and m.clinic_id = (select value_uuid from equivalence_test_state where key = 'clinic_a');

set local role authenticated;
select set_config('request.jwt.claim.sub', '80000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.email', 'equivalence-owner-a@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"80000000-0000-0000-0000-000000000001","email":"equivalence-owner-a@douxhub.test","role":"authenticated"}', true);
do $$
declare v_snapshot jsonb := public.get_access_profile_transition_snapshot();
begin
  if (v_snapshot ->> 'equivalence_ready')::boolean is not true
     or (v_snapshot ->> 'legacy_membership_count')::integer <> 2
     or jsonb_array_length(v_snapshot -> 'profiles') <> 1 then
    raise exception 'inactive_membership_equivalence_invalid:%', v_snapshot;
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '80000000-0000-0000-0000-000000000002', true);
select set_config('request.jwt.claim.email', 'equivalence-owner-b@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"80000000-0000-0000-0000-000000000002","email":"equivalence-owner-b@douxhub.test","role":"authenticated"}', true);
do $$
begin
  if (select count(*) from public.list_available_access_profiles()) <> 1 then
    raise exception 'other_account_profile_count_invalid';
  end if;
  if exists (
    select 1 from public.list_available_access_profiles() p
    where p.clinic_id <> (select value_uuid from equivalence_test_state where key = 'clinic_b')
       or p.role_key <> 'clinic_owner'
  ) then raise exception 'other_account_profile_tampering'; end if;
end;
$$;

select 'access_profile_equivalence_gate_ok' as result;
rollback;
