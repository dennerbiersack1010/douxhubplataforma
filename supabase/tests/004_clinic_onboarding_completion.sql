-- Teste transacional da conclusão idempotente do onboarding.
-- Execute após 20260719120000_complete_clinic_onboarding.sql.

begin;

do $$
begin
  if to_regprocedure('public.complete_clinic_onboarding(uuid)') is null then
    raise exception 'complete_clinic_onboarding_missing';
  end if;
end;
$$;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', '40000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'completion-a@douxhub.test', crypt('Test!123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Owner Completion A"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '40000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'completion-b@douxhub.test', crypt('Test!123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Owner Completion B"}', now(), now());

set local role authenticated;
select set_config('request.jwt.claim.sub', '40000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.email', 'completion-a@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"40000000-0000-0000-0000-000000000001","email":"completion-a@douxhub.test","role":"authenticated"}', true);

create temp table completion_test_state (
  progress_id uuid primary key,
  clinic_id uuid,
  unit_id uuid,
  membership_id uuid
);
grant all on table completion_test_state to authenticated;

insert into completion_test_state (progress_id)
select (public.start_or_resume_clinic_onboarding()).id;

select public.save_clinic_onboarding_step(
  (select progress_id from completion_test_state), 1::smallint,
  '{"fullName":"Owner Completion A","phone":"11999990000","jobTitle":"Proprietária","responsibilityConfirmed":true,"notifications":{"email":true,"push":true,"whatsapp":false}}'::jsonb
);
select public.save_clinic_onboarding_step(
  (select progress_id from completion_test_state), 2::smallint,
  '{"tradeName":"Clínica Completion","legalName":"Clínica Completion LTDA","cnpj":"11222333000181","phone":"1133334444","email":"clinica-completion@douxhub.test","fiscalAddress":{"postalCode":"01310100","street":"Avenida Paulista","number":"1000","district":"Bela Vista","city":"São Paulo","state":"SP"},"legalResponsible":"Owner Completion A","clinicType":"Estética","specialties":["Estética facial"]}'::jsonb
);
select public.save_clinic_onboarding_step(
  (select progress_id from completion_test_state), 3::smallint,
  '{"name":"Unidade Paulista","phone":"1133334444","address":{"postalCode":"01310100","street":"Avenida Paulista","number":"1000","district":"Bela Vista","city":"São Paulo","state":"SP"},"timeZone":"America/Sao_Paulo","rooms":["Sala 1"]}'::jsonb
);
select public.save_clinic_onboarding_step(
  (select progress_id from completion_test_state), 4::smallint,
  '{"workingDays":["monday","tuesday","wednesday","thursday","friday"],"opensAt":"08:00","closesAt":"18:00","defaultAppointmentMinutes":60,"intervalMinutes":0,"minimumAdvanceHours":2,"confirmationPolicy":"Confirmar antes do atendimento.","cancellationPolicy":"Cancelar com antecedência.","paymentMethods":["pix","credit_card"]}'::jsonb
);
select public.save_clinic_onboarding_step(
  (select progress_id from completion_test_state), 5::smallint,
  '{"nextAction":"later"}'::jsonb
);

do $$
begin
  if (select current_step from public.clinic_onboarding_progress where id = (select progress_id from completion_test_state)) <> 6 then
    raise exception 'onboarding_not_prepared';
  end if;
end;
$$;

with completed as (
  select * from public.complete_clinic_onboarding((select progress_id from completion_test_state))
)
update completion_test_state s
set clinic_id = c.clinic_id, unit_id = c.unit_id, membership_id = c.membership_id
from completed c;

do $$
declare
  v_state completion_test_state%rowtype;
begin
  select * into v_state from completion_test_state;

  if not exists (
    select 1 from public.clinic_onboarding_progress
    where id = v_state.progress_id and status = 'completed'
      and created_clinic_id = v_state.clinic_id and created_unit_id = v_state.unit_id
      and completed_at is not null
  ) then raise exception 'onboarding_not_completed'; end if;

  if not exists (
    select 1 from public.clinics
    where id = v_state.clinic_id and owner_user_id = auth.uid()
      and name = 'Clínica Completion' and legal_name = 'Clínica Completion LTDA'
      and document = '11222333000181'
      and settings ->> 'clinic_type' = 'Estética'
  ) then raise exception 'completed_clinic_invalid'; end if;

  if not exists (
    select 1 from public.clinic_units
    where id = v_state.unit_id and clinic_id = v_state.clinic_id
      and name = 'Unidade Paulista' and address ->> 'city' = 'São Paulo'
      and settings ->> 'time_zone' = 'America/Sao_Paulo'
  ) then raise exception 'completed_unit_invalid'; end if;

  if not exists (
    select 1 from public.clinic_memberships m join public.roles r on r.id = m.role_id
    where m.id = v_state.membership_id and m.user_id = auth.uid()
      and m.clinic_id = v_state.clinic_id and m.unit_id = v_state.unit_id
      and m.status = 'active' and r.key = 'clinic_owner'
  ) then raise exception 'completed_membership_invalid'; end if;

  if not exists (
    select 1 from public.user_active_contexts
    where user_id = auth.uid() and membership_id = v_state.membership_id
      and clinic_id = v_state.clinic_id and unit_id = v_state.unit_id
  ) then raise exception 'completed_context_invalid'; end if;

  if (select count(*) from public.audit_logs where metadata ->> 'progress_id' = v_state.progress_id::text) <> 2
     or not exists (select 1 from public.audit_logs where entity_id = v_state.progress_id and action = 'onboarding.completed') then
    raise exception 'completed_audit_invalid';
  end if;
end;
$$;

do $$
declare
  v_state completion_test_state%rowtype;
  v_repeat record;
begin
  select * into v_state from completion_test_state;
  select * into v_repeat from public.complete_clinic_onboarding(v_state.progress_id);
  if v_repeat.clinic_id <> v_state.clinic_id
     or v_repeat.unit_id <> v_state.unit_id
     or v_repeat.membership_id <> v_state.membership_id then
    raise exception 'completion_not_idempotent';
  end if;
  if (select count(*) from public.clinics where owner_user_id = auth.uid()) <> 1
     or (select count(*) from public.clinic_memberships where user_id = auth.uid()) <> 1 then
    raise exception 'completion_duplicated_records';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '40000000-0000-0000-0000-000000000002', true);
select set_config('request.jwt.claim.email', 'completion-b@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"40000000-0000-0000-0000-000000000002","email":"completion-b@douxhub.test","role":"authenticated"}', true);

do $$
begin
  begin
    perform public.complete_clinic_onboarding((select progress_id from completion_test_state));
    raise exception 'cross_user_completion_allowed';
  exception when others then
    if sqlerrm <> 'onboarding_progress_not_found' then raise; end if;
  end;
end;
$$;

select public.start_or_resume_clinic_onboarding();
do $$
begin
  begin
    perform public.complete_clinic_onboarding(
      (select id from public.clinic_onboarding_progress where user_id = auth.uid() and status = 'in_progress')
    );
    raise exception 'incomplete_onboarding_completed';
  exception when others then
    if sqlerrm <> 'onboarding_not_ready' then raise; end if;
  end;
end;
$$;

reset role;
select 'clinic_onboarding_completion_ok' as result;
rollback;

