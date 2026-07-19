-- Teste transacional do contrato de persistência do onboarding.
-- Execute após aplicar 20260718120000_clinic_onboarding_progress.sql.

begin;

do $$
begin
  if to_regclass('public.clinic_onboarding_progress') is null then
    raise exception 'clinic_onboarding_progress_missing';
  end if;
  if not (select relrowsecurity from pg_class where oid = 'public.clinic_onboarding_progress'::regclass) then
    raise exception 'clinic_onboarding_progress_rls_disabled';
  end if;
  if to_regprocedure('public.start_or_resume_clinic_onboarding()') is null
     or to_regprocedure('public.save_clinic_onboarding_step(uuid,smallint,jsonb)') is null
     or to_regprocedure('public.cancel_clinic_onboarding(uuid)') is null then
    raise exception 'onboarding_progress_functions_missing';
  end if;
  if has_table_privilege('authenticated', 'public.clinic_onboarding_progress', 'INSERT')
     or has_table_privilege('authenticated', 'public.clinic_onboarding_progress', 'UPDATE')
     or has_table_privilege('authenticated', 'public.clinic_onboarding_progress', 'DELETE') then
    raise exception 'onboarding_progress_direct_write_allowed';
  end if;
end;
$$;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', '30000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'onboarding-a@douxhub.test', crypt('Test!123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Owner Onboarding A"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '30000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'onboarding-b@douxhub.test', crypt('Test!123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Owner Onboarding B"}', now(), now());

set local role authenticated;
select set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.email', 'onboarding-a@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"30000000-0000-0000-0000-000000000001","email":"onboarding-a@douxhub.test","role":"authenticated"}', true);

create temp table onboarding_test_state (id uuid primary key);
grant all on table onboarding_test_state to authenticated;
insert into onboarding_test_state select (public.start_or_resume_clinic_onboarding()).id;

do $$
declare
  v_first uuid;
  v_resumed uuid;
begin
  select id into v_first from onboarding_test_state;
  select (public.start_or_resume_clinic_onboarding()).id into v_resumed;
  if v_first <> v_resumed then raise exception 'onboarding_resume_not_idempotent'; end if;
end;
$$;

select public.save_clinic_onboarding_step(
  (select id from onboarding_test_state), 1::smallint,
  '{"fullName":"Owner Onboarding A","phone":"11999990000"}'::jsonb
);

do $$
begin
  if not exists (
    select 1 from public.clinic_onboarding_progress
    where id = (select id from onboarding_test_state)
      and user_id = auth.uid()
      and current_step = 2
      and completed_steps = array[1]::smallint[]
      and owner_data ->> 'fullName' = 'Owner Onboarding A'
      and revision = 2
  ) then raise exception 'onboarding_step_not_persisted'; end if;

  begin
    perform public.save_clinic_onboarding_step(
      (select id from onboarding_test_state), 3::smallint, '{"unitName":"Unidade indevida"}'::jsonb
    );
    raise exception 'out_of_order_step_allowed';
  exception when others then
    if sqlerrm <> 'onboarding_step_out_of_order' then raise; end if;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000002', true);
select set_config('request.jwt.claim.email', 'onboarding-b@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"30000000-0000-0000-0000-000000000002","email":"onboarding-b@douxhub.test","role":"authenticated"}', true);

do $$
begin
  if exists (select 1 from public.clinic_onboarding_progress) then
    raise exception 'onboarding_cross_user_read_allowed';
  end if;
  begin
    perform public.save_clinic_onboarding_step(
      (select id from onboarding_test_state), 1::smallint, '{"fullName":"Intruso"}'::jsonb
    );
    raise exception 'onboarding_cross_user_update_allowed';
  exception when others then
    if sqlerrm <> 'onboarding_progress_not_found' then raise; end if;
  end;
end;
$$;

select public.start_or_resume_clinic_onboarding();
do $$
begin
  if (select count(*) from public.clinic_onboarding_progress) <> 1 then
    raise exception 'onboarding_user_scope_invalid';
  end if;
end;
$$;

select public.cancel_clinic_onboarding(id)
from public.clinic_onboarding_progress
where user_id = auth.uid() and status = 'in_progress';

do $$
begin
  if not exists (
    select 1 from public.clinic_onboarding_progress
    where user_id = auth.uid() and status = 'cancelled' and cancelled_at is not null
  ) then raise exception 'onboarding_cancellation_not_persisted'; end if;
end;
$$;

reset role;
select 'clinic_onboarding_progress_ok' as result;
rollback;
