-- Testes transacionais dos fluxos multiempresa da DouxHub.
-- Todos os dados artificiais são revertidos ao final.

begin;

create temp table clinic_access_test_state (
  key text primary key,
  value_uuid uuid,
  value_text text
);
grant all on table clinic_access_test_state to authenticated;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'owner-a@douxhub.test', crypt('Test!123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Owner A"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'admin-a@douxhub.test', crypt('Test!123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Admin A"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'employee-a@douxhub.test', crypt('Test!123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Employee A"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'revoked-a@douxhub.test', crypt('Test!123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Revoked A"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'no-membership@douxhub.test', crypt('Test!123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"No Membership"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'owner-b@douxhub.test', crypt('Test!123456', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Owner B"}', now(), now());

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.email', 'owner-a@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001","email":"owner-a@douxhub.test","role":"authenticated"}', true);

insert into clinic_access_test_state (key, value_uuid)
select 'clinic_a', clinic_id from public.create_initial_clinic(
  'Clínica A', 'Owner A', 'owner-a@douxhub.test', '11999990001', 'Unidade Principal A'
);
insert into clinic_access_test_state (key, value_uuid)
select 'unit_a', id from public.clinic_units
where clinic_id = (select value_uuid from clinic_access_test_state where key = 'clinic_a');
insert into clinic_access_test_state (key, value_uuid)
select 'owner_a_membership', id from public.clinic_memberships
where clinic_id = (select value_uuid from clinic_access_test_state where key = 'clinic_a')
  and user_id = '10000000-0000-0000-0000-000000000001';

do $$
begin
  if not exists (
    select 1 from public.clinic_memberships m join public.roles r on r.id = m.role_id
    where m.id = (select value_uuid from clinic_access_test_state where key = 'owner_a_membership')
      and r.key = 'clinic_owner' and m.status = 'active'
  ) then raise exception 'clinic_owner_not_created'; end if;
  if not exists (
    select 1 from public.audit_logs
    where clinic_id = (select value_uuid from clinic_access_test_state where key = 'clinic_a')
      and action in ('clinic.created', 'unit.created')
    group by clinic_id having count(distinct action) = 2
  ) then raise exception 'initial_audit_missing'; end if;
end;
$$;

do $$
begin
  perform public.create_initial_clinic('Outra clínica', 'Owner A', 'owner-a@douxhub.test', null, 'Outra unidade');
  raise exception 'duplicate_initial_clinic_was_allowed';
exception when others then
  if sqlerrm = 'duplicate_initial_clinic_was_allowed' then raise; end if;
end;
$$;

insert into clinic_access_test_state (key, value_uuid)
select 'invite_admin', invitation_id from public.create_clinic_invitation(
  (select value_uuid from clinic_access_test_state where key = 'clinic_a'),
  'Admin A', 'admin-a@douxhub.test', 'clinic_admin', repeat('a', 40),
  (select value_uuid from clinic_access_test_state where key = 'unit_a'), now() + interval '7 days'
);
insert into clinic_access_test_state (key, value_uuid)
select 'invite_employee', invitation_id from public.create_clinic_invitation(
  (select value_uuid from clinic_access_test_state where key = 'clinic_a'),
  'Employee A', 'employee-a@douxhub.test', 'clinic_employee', repeat('b', 40),
  (select value_uuid from clinic_access_test_state where key = 'unit_a'), now() + interval '7 days'
);

do $$
begin
  perform public.create_clinic_invitation(
    (select value_uuid from clinic_access_test_state where key = 'clinic_a'),
    'Admin duplicado', 'admin-a@douxhub.test', 'clinic_admin', repeat('c', 40), null, now() + interval '7 days'
  );
  raise exception 'duplicate_pending_invitation_was_allowed';
exception when unique_violation then null;
end;
$$;

insert into clinic_access_test_state (key, value_uuid)
select 'invite_expired', invitation_id from public.create_clinic_invitation(
  (select value_uuid from clinic_access_test_state where key = 'clinic_a'),
  'Expirado', 'expired-a@douxhub.test', 'clinic_employee', repeat('e', 40), null, now() + interval '1 day'
);
insert into clinic_access_test_state (key, value_uuid)
select 'invite_revoked', invitation_id from public.create_clinic_invitation(
  (select value_uuid from clinic_access_test_state where key = 'clinic_a'),
  'Revoked A', 'revoked-a@douxhub.test', 'clinic_employee', repeat('r', 40), null, now() + interval '7 days'
);
select public.revoke_clinic_invitation((select value_uuid from clinic_access_test_state where key = 'invite_revoked'));

reset role;
update public.clinic_invitations
set created_at = now() - interval '2 days',
    expires_at = now() - interval '1 minute'
where id = (select value_uuid from clinic_access_test_state where key = 'invite_expired');

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
select set_config('request.jwt.claim.email', 'admin-a@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000002","email":"admin-a@douxhub.test","role":"authenticated"}', true);
insert into clinic_access_test_state (key, value_uuid)
values ('admin_a_membership', public.accept_clinic_invitation(repeat('a', 40)));

do $$
begin
  perform public.accept_clinic_invitation(repeat('a', 40));
  raise exception 'accepted_invitation_was_reused';
exception when others then
  if sqlerrm = 'accepted_invitation_was_reused' then raise; end if;
end;
$$;

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
select set_config('request.jwt.claim.email', 'employee-a@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000003","email":"employee-a@douxhub.test","role":"authenticated"}', true);
insert into clinic_access_test_state (key, value_uuid)
values ('employee_a_membership', public.accept_clinic_invitation(repeat('b', 40)));

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000004', true);
select set_config('request.jwt.claim.email', 'revoked-a@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000004","email":"revoked-a@douxhub.test","role":"authenticated"}', true);
do $$
begin
  perform public.accept_clinic_invitation(repeat('r', 40));
  raise exception 'revoked_invitation_was_accepted';
exception when others then
  if sqlerrm = 'revoked_invitation_was_accepted' then raise; end if;
end;
$$;

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000005', true);
select set_config('request.jwt.claim.email', 'expired-a@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000005","email":"expired-a@douxhub.test","role":"authenticated"}', true);
do $$
begin
  perform public.accept_clinic_invitation(repeat('e', 40));
  raise exception 'expired_invitation_was_accepted';
exception when others then
  if sqlerrm = 'expired_invitation_was_accepted' then raise; end if;
end;
$$;

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
select set_config('request.jwt.claim.email', 'admin-a@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000002","email":"admin-a@douxhub.test","role":"authenticated"}', true);

select * from public.create_clinic_invitation(
  (select value_uuid from clinic_access_test_state where key = 'clinic_a'),
  'Colaborador pendente', 'pending-employee@douxhub.test', 'clinic_employee', repeat('p', 40), null, now() + interval '7 days'
);

do $$
begin
  perform public.create_clinic_invitation(
    (select value_uuid from clinic_access_test_state where key = 'clinic_a'),
    'Admin proibido', 'forbidden-admin@douxhub.test', 'clinic_admin', repeat('f', 40), null, now() + interval '7 days'
  );
  raise exception 'admin_created_admin_invitation';
exception when others then
  if sqlerrm = 'admin_created_admin_invitation' then raise; end if;
end;
$$;

select public.update_clinic_member(
  (select value_uuid from clinic_access_test_state where key = 'employee_a_membership'), null, 'inactive'
);
select public.update_clinic_member(
  (select value_uuid from clinic_access_test_state where key = 'employee_a_membership'), null, 'active'
);

do $$
begin
  perform public.update_clinic_member(
    (select value_uuid from clinic_access_test_state where key = 'owner_a_membership'), null, 'inactive'
  );
  raise exception 'admin_changed_owner';
exception when others then
  if sqlerrm = 'admin_changed_owner' then raise; end if;
end;
$$;

do $$
begin
  perform public.update_clinic_member(
    (select value_uuid from clinic_access_test_state where key = 'employee_a_membership'), 'clinic_admin', null
  );
  raise exception 'admin_promoted_employee';
exception when others then
  if sqlerrm = 'admin_promoted_employee' then raise; end if;
end;
$$;

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
select set_config('request.jwt.claim.email', 'employee-a@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000003","email":"employee-a@douxhub.test","role":"authenticated"}', true);

do $$
begin
  if (select count(*) from public.clinics) <> 1 then raise exception 'employee_cross_clinic_visibility'; end if;
  if public.can_manage_clinic((select value_uuid from clinic_access_test_state where key = 'clinic_a')) then
    raise exception 'employee_has_management_permission';
  end if;
end;
$$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.email', 'owner-b@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"20000000-0000-0000-0000-000000000001","email":"owner-b@douxhub.test","role":"authenticated"}', true);
insert into clinic_access_test_state (key, value_uuid)
select 'clinic_b', clinic_id from public.create_initial_clinic(
  'Clínica B', 'Owner B', 'owner-b@douxhub.test', null, 'Unidade Principal B'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
select set_config('request.jwt.claim.email', 'employee-a@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000003","email":"employee-a@douxhub.test","role":"authenticated"}', true);
do $$
begin
  if exists (select 1 from public.clinics where id = (select value_uuid from clinic_access_test_state where key = 'clinic_b')) then
    raise exception 'clinic_b_visible_to_employee_a';
  end if;
  update public.clinics set name = 'Acesso indevido'
  where id = (select value_uuid from clinic_access_test_state where key = 'clinic_b');
  if found then raise exception 'clinic_b_updated_by_employee_a'; end if;
end;
$$;

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.email', 'owner-a@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001","email":"owner-a@douxhub.test","role":"authenticated"}', true);
select public.update_clinic_member(
  (select value_uuid from clinic_access_test_state where key = 'employee_a_membership'), 'clinic_admin', null
);
select public.update_clinic_member(
  (select value_uuid from clinic_access_test_state where key = 'employee_a_membership'), 'clinic_employee', null
);
select * from public.set_active_clinic_context(
  (select value_uuid from clinic_access_test_state where key = 'owner_a_membership')
);

select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.email', 'owner-b@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"20000000-0000-0000-0000-000000000001","email":"owner-b@douxhub.test","role":"authenticated"}', true);
select * from public.create_clinic_invitation(
  (select value_uuid from clinic_access_test_state where key = 'clinic_b'),
  'Owner A em B', 'owner-a@douxhub.test', 'clinic_admin', repeat('m', 40), null, now() + interval '7 days'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.email', 'owner-a@douxhub.test', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001","email":"owner-a@douxhub.test","role":"authenticated"}', true);
select public.accept_clinic_invitation(repeat('m', 40));

do $$
begin
  if (select count(*) from public.clinic_memberships where user_id = auth.uid() and status = 'active') <> 2 then
    raise exception 'multiple_clinic_memberships_not_created';
  end if;
  if (select count(*) from public.clinic_memberships where user_id = '10000000-0000-0000-0000-000000000005') <> 0 then
    raise exception 'no_membership_user_has_membership';
  end if;
  if not exists (select 1 from public.audit_logs where action = 'invitation.revoked') then
    raise exception 'revocation_audit_missing';
  end if;
  if not exists (select 1 from public.audit_logs where action = 'membership.role_changed') then
    raise exception 'role_change_audit_missing';
  end if;
end;
$$;

reset role;
select 'clinic_access_flows_ok' as result;
rollback;
