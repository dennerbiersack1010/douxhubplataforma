-- Teste transacional da resolução pós-login otimizada.
-- Execute após 20260719180000_optimize_post_login_resolution.sql.

begin;

do $$
begin
  if to_regprocedure('public.resolve_post_login_context()') is null then
    raise exception 'resolve_post_login_context_missing';
  end if;
  begin
    perform public.resolve_post_login_context();
    raise exception 'anonymous_post_login_allowed';
  exception when others then
    if sqlerrm <> 'authentication_required' then raise; end if;
  end;
end;
$$;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', '50000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'post-login-single@douxhub.test', crypt('Test!123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Post Login Single"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '50000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'post-login-none@douxhub.test', crypt('Test!123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Post Login None"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '50000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'post-login-inactive@douxhub.test', crypt('Test!123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Post Login Inactive"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '50000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'post-login-multiple@douxhub.test', crypt('Test!123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Post Login Multiple"}', now(), now());

create temp table post_login_test_state (
  key text primary key,
  value_uuid uuid
);
grant all on table post_login_test_state to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub', '50000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.email', 'post-login-single@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"50000000-0000-0000-0000-000000000001","email":"post-login-single@douxhub.test","role":"authenticated"}', true);
insert into post_login_test_state (key, value_uuid)
select 'clinic_single', clinic_id from public.create_initial_clinic(
  'Clínica Login Único', 'Post Login Single', 'post-login-single@douxhub.test', '11999990001', 'Unidade Login Único'
);

select set_config('request.jwt.claim.sub', '50000000-0000-0000-0000-000000000004', true);
select set_config('request.jwt.claim.email', 'post-login-multiple@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"50000000-0000-0000-0000-000000000004","email":"post-login-multiple@douxhub.test","role":"authenticated"}', true);
insert into post_login_test_state (key, value_uuid)
select 'clinic_multiple', clinic_id from public.create_initial_clinic(
  'Clínica Login Múltiplo', 'Post Login Multiple', 'post-login-multiple@douxhub.test', '11999990004', 'Unidade Login Múltiplo'
);

reset role;
insert into public.clinic_memberships (user_id, clinic_id, unit_id, role_id, status)
select '50000000-0000-0000-0000-000000000003', c.id, u.id, r.id, 'inactive'
from public.clinics c
join public.clinic_units u on u.clinic_id = c.id
join public.roles r on r.key = 'clinic_employee'
where c.id = (select value_uuid from post_login_test_state where key = 'clinic_single');

insert into public.clinic_memberships (user_id, clinic_id, unit_id, role_id, status)
select '50000000-0000-0000-0000-000000000004', c.id, u.id, r.id, 'active'
from public.clinics c
join public.clinic_units u on u.clinic_id = c.id
join public.roles r on r.key = 'clinic_admin'
where c.id = (select value_uuid from post_login_test_state where key = 'clinic_single');

set local role authenticated;
select set_config('request.jwt.claim.sub', '50000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.email', 'post-login-single@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"50000000-0000-0000-0000-000000000001","email":"post-login-single@douxhub.test","role":"authenticated"}', true);
do $$
declare v_result record;
begin
  select * into v_result from public.resolve_post_login_context();
  if v_result.redirect_to <> '/dashboard' or v_result.membership_id is null or v_result.active_membership_count <> 1 then
    raise exception 'single_membership_resolution_invalid';
  end if;
  if not exists (
    select 1 from public.user_active_contexts c
    where c.user_id = auth.uid() and c.membership_id = v_result.membership_id
  ) then raise exception 'single_membership_context_missing'; end if;
end;
$$;

select set_config('request.jwt.claim.sub', '50000000-0000-0000-0000-000000000002', true);
select set_config('request.jwt.claim.email', 'post-login-none@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"50000000-0000-0000-0000-000000000002","email":"post-login-none@douxhub.test","role":"authenticated"}', true);
do $$
declare v_result record;
begin
  select * into v_result from public.resolve_post_login_context();
  if v_result.redirect_to <> '/configurar-clinica' or v_result.membership_id is not null or v_result.active_membership_count <> 0 then
    raise exception 'no_membership_resolution_invalid';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '50000000-0000-0000-0000-000000000003', true);
select set_config('request.jwt.claim.email', 'post-login-inactive@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"50000000-0000-0000-0000-000000000003","email":"post-login-inactive@douxhub.test","role":"authenticated"}', true);
do $$
declare v_result record;
begin
  select * into v_result from public.resolve_post_login_context();
  if v_result.redirect_to <> '/sem-clinica' or v_result.membership_id is not null or v_result.active_membership_count <> 0 then
    raise exception 'inactive_membership_resolution_invalid';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '50000000-0000-0000-0000-000000000004', true);
select set_config('request.jwt.claim.email', 'post-login-multiple@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"50000000-0000-0000-0000-000000000004","email":"post-login-multiple@douxhub.test","role":"authenticated"}', true);
do $$
declare v_result record;
begin
  select * into v_result from public.resolve_post_login_context();
  if v_result.redirect_to <> '/selecionar-perfil' or v_result.membership_id is not null or v_result.active_membership_count <> 2 then
    raise exception 'multiple_membership_resolution_invalid';
  end if;
  if exists (select 1 from public.user_active_contexts c where c.user_id = auth.uid()) then
    raise exception 'multiple_membership_context_created';
  end if;
end;
$$;

reset role;
select 'post_login_resolution_ok' as result;
rollback;
