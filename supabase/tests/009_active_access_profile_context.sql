-- Teste transacional da Etapa 3, Ciclo 4.
-- Execute após 20260719220000_active_access_profile_context.sql.

begin;

do $$
begin
  if has_function_privilege('anon', 'public.set_active_access_profile_context(uuid)', 'EXECUTE') then
    raise exception 'anonymous_profile_context_access';
  end if;
end;
$$;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', '90000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'context-owner-a@douxhub.test', crypt('Test!123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Context Owner A"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '90000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'context-owner-b@douxhub.test', crypt('Test!123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Context Owner B"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '90000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'context-empty@douxhub.test', crypt('Test!123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Context Empty"}', now(), now());

create temp table profile_context_test_state (key text primary key, value_uuid uuid);
grant all on table profile_context_test_state to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.email', 'context-owner-a@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"90000000-0000-0000-0000-000000000001","email":"context-owner-a@douxhub.test","role":"authenticated"}', true);
insert into profile_context_test_state (key, value_uuid)
select 'clinic_a', clinic_id from public.create_initial_clinic(
  'Clínica Contexto A', 'Context Owner A', 'context-owner-a@douxhub.test', '11999994001', 'Unidade Contexto A'
);

select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000002', true);
select set_config('request.jwt.claim.email', 'context-owner-b@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"90000000-0000-0000-0000-000000000002","email":"context-owner-b@douxhub.test","role":"authenticated"}', true);
insert into profile_context_test_state (key, value_uuid)
select 'clinic_b', clinic_id from public.create_initial_clinic(
  'Clínica Contexto B', 'Context Owner B', 'context-owner-b@douxhub.test', '11999994002', 'Unidade Contexto B'
);

do $$
begin
  if exists (
    select 1 from public.user_active_contexts context
    where context.user_id = '90000000-0000-0000-0000-000000000002'
      and context.access_profile_id is null
  ) then raise exception 'legacy_context_bridge_missing_profile'; end if;
end;
$$;

reset role;
insert into public.clinic_memberships (user_id, clinic_id, unit_id, role_id, status)
select
  '90000000-0000-0000-0000-000000000001', clinic.id, unit.id, role.id, 'active'
from public.clinics clinic
join public.clinic_units unit on unit.clinic_id = clinic.id
cross join public.roles role
where clinic.id = (select value_uuid from profile_context_test_state where key = 'clinic_b')
  and role.key = 'clinic_employee';

set local role authenticated;
select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000003', true);
select set_config('request.jwt.claim.email', 'context-empty@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"90000000-0000-0000-0000-000000000003","email":"context-empty@douxhub.test","role":"authenticated"}', true);
do $$
declare v_resolution record;
begin
  select * into v_resolution from public.resolve_post_login_context();
  if v_resolution.redirect_to <> '/configurar-clinica'
     or v_resolution.active_membership_count <> 0 then
    raise exception 'empty_profile_resolution_invalid';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.email', 'context-owner-a@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"90000000-0000-0000-0000-000000000001","email":"context-owner-a@douxhub.test","role":"authenticated"}', true);
do $$
declare v_resolution record;
begin
  select * into v_resolution from public.resolve_post_login_context();
  if v_resolution.redirect_to <> '/selecionar-perfil'
     or v_resolution.membership_id is not null
     or v_resolution.active_membership_count <> 2 then
    raise exception 'multiple_profile_resolution_invalid';
  end if;
  if exists (
    select 1 from public.user_active_contexts context
    where context.user_id = '90000000-0000-0000-0000-000000000001'
  ) then raise exception 'post_login_context_not_cleared'; end if;
end;
$$;

insert into profile_context_test_state (key, value_uuid)
select 'profile_a', profile.access_profile_id
from public.list_available_access_profiles() profile
where profile.clinic_id = (select value_uuid from profile_context_test_state where key = 'clinic_a');

insert into profile_context_test_state (key, value_uuid)
select 'profile_b_employee', profile.access_profile_id
from public.list_available_access_profiles() profile
where profile.clinic_id = (select value_uuid from profile_context_test_state where key = 'clinic_b')
  and profile.role_key = 'clinic_employee';

select * from public.set_active_access_profile_context(
  (select value_uuid from profile_context_test_state where key = 'profile_a')
);
select * from public.set_active_access_profile_context(
  (select value_uuid from profile_context_test_state where key = 'profile_a')
);

do $$
begin
  if (select count(*) from public.user_active_contexts context where context.user_id = '90000000-0000-0000-0000-000000000001') <> 1
     or not exists (
       select 1 from public.user_active_contexts context
       join public.access_profiles profile on profile.id = context.access_profile_id
       where context.user_id = '90000000-0000-0000-0000-000000000001'
         and profile.source_membership_id = context.membership_id
         and profile.clinic_id = context.clinic_id
         and profile.unit_id is not distinct from context.unit_id
     ) then raise exception 'profile_context_activation_invalid'; end if;
end;
$$;

select * from public.set_active_access_profile_context(
  (select value_uuid from profile_context_test_state where key = 'profile_b_employee')
);

reset role;
do $$
begin
  if not exists (
    select 1 from public.user_active_contexts context
    where context.user_id = '90000000-0000-0000-0000-000000000001'
      and context.access_profile_id = (select value_uuid from profile_context_test_state where key = 'profile_b_employee')
  ) then raise exception 'profile_context_switch_invalid'; end if;
  if (select count(*) from public.audit_logs log
      where log.actor_user_id = '90000000-0000-0000-0000-000000000001'
        and log.action = 'context.profile_switched') <> 3 then
    raise exception 'profile_context_audit_invalid';
  end if;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000002', true);
select set_config('request.jwt.claim.email', 'context-owner-b@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"90000000-0000-0000-0000-000000000002","email":"context-owner-b@douxhub.test","role":"authenticated"}', true);
do $$
declare v_resolution record;
begin
  select * into v_resolution from public.resolve_post_login_context();
  if v_resolution.redirect_to <> '/selecionar-perfil'
     or v_resolution.membership_id is not null
     or v_resolution.active_membership_count <> 1 then
    raise exception 'single_profile_resolution_invalid';
  end if;

  begin
    perform public.set_active_access_profile_context(
      (select value_uuid from profile_context_test_state where key = 'profile_a')
    );
    raise exception 'cross_account_profile_accepted';
  exception when others then
    if sqlerrm = 'cross_account_profile_accepted' then raise; end if;
  end;
end;
$$;

reset role;
update public.clinic_memberships membership
set status = 'inactive'
where membership.user_id = '90000000-0000-0000-0000-000000000001'
  and membership.clinic_id = (select value_uuid from profile_context_test_state where key = 'clinic_b');

do $$
begin
  if exists (
    select 1 from public.user_active_contexts context
    where context.user_id = '90000000-0000-0000-0000-000000000001'
  ) then raise exception 'revoked_profile_context_not_invalidated'; end if;
end;
$$;

select 'active_access_profile_context_ok' as result;
rollback;
