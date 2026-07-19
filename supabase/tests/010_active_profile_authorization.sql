-- Teste transacional da Etapa 3, Ciclo 5.
-- Execute após 20260719230000_active_profile_authorization.sql.

begin;

do $$
begin
  if has_function_privilege('anon', 'public.authorize_active_access_profile(text, public.permission_scope, uuid, uuid)', 'EXECUTE') then
    raise exception 'anonymous_authorization_access';
  end if;
  if has_function_privilege('authenticated', 'public.create_clinic_invitation_legacy(uuid, text, text, text, text, uuid, timestamptz)', 'EXECUTE') then
    raise exception 'legacy_invitation_bypass_available';
  end if;
end;
$$;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'auth-owner-a@douxhub.test', crypt('Test!123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Auth Owner A"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'auth-admin-a@douxhub.test', crypt('Test!123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Auth Admin A"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'auth-employee-a@douxhub.test', crypt('Test!123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Auth Employee A"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'auth-owner-b@douxhub.test', crypt('Test!123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Auth Owner B"}', now(), now());

create temp table authorization_test_state (key text primary key, value_uuid uuid);
grant all on table authorization_test_state to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.email', 'auth-owner-a@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000001","email":"auth-owner-a@douxhub.test","role":"authenticated"}', true);
insert into authorization_test_state (key, value_uuid)
select 'clinic_a', clinic_id from public.create_initial_clinic(
  'Clínica Autorização A', 'Auth Owner A', 'auth-owner-a@douxhub.test', '11999995001', 'Unidade Autorização A'
);

select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000004', true);
select set_config('request.jwt.claim.email', 'auth-owner-b@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000004","email":"auth-owner-b@douxhub.test","role":"authenticated"}', true);
insert into authorization_test_state (key, value_uuid)
select 'clinic_b', clinic_id from public.create_initial_clinic(
  'Clínica Autorização B', 'Auth Owner B', 'auth-owner-b@douxhub.test', '11999995004', 'Unidade Autorização B'
);

reset role;
insert into public.clinic_memberships (user_id, clinic_id, unit_id, role_id, status)
select fixture.user_id, clinic.id, unit.id, role.id, 'active'
from (values
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'clinic_admin'),
  ('a0000000-0000-0000-0000-000000000003'::uuid, 'clinic_employee')
) fixture(user_id, role_key)
cross join public.clinics clinic
join public.clinic_units unit on unit.clinic_id = clinic.id
join public.roles role on role.key = fixture.role_key
where clinic.id = (select value_uuid from authorization_test_state where key = 'clinic_a');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.email', 'auth-owner-a@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000001","email":"auth-owner-a@douxhub.test","role":"authenticated"}', true);
select * from public.authorize_active_access_profile('team_admins.invite', 'clinic');
select * from public.authorize_active_access_profile('team_admin_invitations.revoke', 'clinic');

do $$
begin
  begin
    perform public.authorize_active_access_profile(
      'team_members.read', 'clinic',
      (select value_uuid from authorization_test_state where key = 'clinic_b'), null
    );
    raise exception 'cross_clinic_target_accepted';
  exception when others then
    if sqlerrm = 'cross_clinic_target_accepted' then raise; end if;
  end;
end;
$$;

reset role;
insert into authorization_test_state (key, value_uuid)
select 'admin_profile', profile.id
from public.access_profiles profile
join public.clinic_users clinic_user on clinic_user.id = profile.clinic_user_id
where clinic_user.user_id = 'a0000000-0000-0000-0000-000000000002';
insert into authorization_test_state (key, value_uuid)
select 'employee_profile', profile.id
from public.access_profiles profile
join public.clinic_users clinic_user on clinic_user.id = profile.clinic_user_id
where clinic_user.user_id = 'a0000000-0000-0000-0000-000000000003';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000002', true);
select set_config('request.jwt.claim.email', 'auth-admin-a@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000002","email":"auth-admin-a@douxhub.test","role":"authenticated"}', true);
select * from public.set_active_access_profile_context(
  (select value_uuid from authorization_test_state where key = 'admin_profile')
);
select * from public.authorize_active_access_profile('team_employees.invite', 'clinic');

do $$
begin
  begin
    perform public.authorize_active_access_profile('team_admins.invite', 'clinic');
    raise exception 'admin_permission_expanded';
  exception when others then
    if sqlerrm = 'admin_permission_expanded' then raise; end if;
  end;
end;
$$;

reset role;
insert into public.access_profile_permission_overrides
  (clinic_id, access_profile_id, permission_id, scope, effect, reason, created_by)
select profile.clinic_id, profile.id, permission.id, 'clinic', 'deny', 'Teste de negação prevalente', 'a0000000-0000-0000-0000-000000000001'
from public.access_profiles profile
join public.permission_catalog permission on permission.key = 'team_employees.invite'
where profile.id = (select value_uuid from authorization_test_state where key = 'admin_profile');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000002', true);
select set_config('request.jwt.claim.email', 'auth-admin-a@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000002","email":"auth-admin-a@douxhub.test","role":"authenticated"}', true);
do $$
begin
  begin
    perform public.create_clinic_invitation(
      (select value_uuid from authorization_test_state where key = 'clinic_a'),
      'Negado Pela Matriz', 'deny-invite@douxhub.test', 'clinic_employee',
      repeat('d', 40), null, now() + interval '1 day'
    );
    raise exception 'profile_deny_bypassed';
  exception when others then
    if sqlerrm = 'profile_deny_bypassed' then raise; end if;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000003', true);
select set_config('request.jwt.claim.email', 'auth-employee-a@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000003","email":"auth-employee-a@douxhub.test","role":"authenticated"}', true);
select * from public.set_active_access_profile_context(
  (select value_uuid from authorization_test_state where key = 'employee_profile')
);
do $$
begin
  begin
    perform public.authorize_active_access_profile('team_members.read', 'clinic');
    raise exception 'employee_admin_read_accepted';
  exception when others then
    if sqlerrm = 'employee_admin_read_accepted' then raise; end if;
  end;
end;
$$;

reset role;
update public.clinic_user_role_assignments assignment
set is_active = false
where assignment.clinic_user_id = (
  select profile.clinic_user_id from public.access_profiles profile
  where profile.id = (select value_uuid from authorization_test_state where key = 'employee_profile')
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000003', true);
select set_config('request.jwt.claim.email', 'auth-employee-a@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000003","email":"auth-employee-a@douxhub.test","role":"authenticated"}', true);
do $$
begin
  begin
    perform public.authorize_active_access_profile('clinic.read', 'unit');
    raise exception 'stale_context_accepted';
  exception when others then
    if sqlerrm = 'stale_context_accepted' then raise; end if;
  end;
end;
$$;

select 'active_profile_authorization_ok' as result;
rollback;
