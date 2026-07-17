-- Corrige a referência ambígua de expires_at na função de criação de convites.

create or replace function public.create_clinic_invitation(
  p_clinic_id uuid,
  p_name text,
  p_email text,
  p_role_key text,
  p_token text,
  p_unit_id uuid default null,
  p_expires_at timestamptz default (now() + interval '7 days')
)
returns table (invitation_id uuid, expires_at timestamptz)
language plpgsql
security definer
set search_path = pg_catalog, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_actor_role text;
  v_role_id uuid;
  v_invitation_id uuid;
  v_expires_at timestamptz := coalesce(p_expires_at, now() + interval '7 days');
  v_email text := lower(trim(coalesce(p_email, '')));
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  v_actor_role := public.current_user_role_key(p_clinic_id);
  if v_actor_role not in ('clinic_owner', 'clinic_admin') then raise exception 'insufficient_permission'; end if;
  if p_role_key not in ('clinic_admin', 'clinic_employee') then raise exception 'invalid_role'; end if;
  if v_actor_role = 'clinic_admin' and p_role_key <> 'clinic_employee' then raise exception 'insufficient_permission'; end if;
  if char_length(trim(coalesce(p_name, ''))) not between 2 and 160 then raise exception 'invalid_name'; end if;
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then raise exception 'invalid_email'; end if;
  if length(coalesce(p_token, '')) < 32 then raise exception 'invalid_invitation_token'; end if;
  if v_expires_at <= now() then raise exception 'invalid_expiration'; end if;

  select id into v_role_id from public.roles
  where key = p_role_key and is_enabled and is_assignable;
  if v_role_id is null then raise exception 'invalid_role'; end if;

  if p_unit_id is not null and not exists (
    select 1 from public.clinic_units
    where id = p_unit_id and clinic_id = p_clinic_id and status = 'active'
  ) then raise exception 'invalid_unit'; end if;

  if exists (
    select 1 from public.clinic_memberships m
    join public.user_profiles p on p.user_id = m.user_id
    where m.clinic_id = p_clinic_id and p.email = v_email
  ) then raise exception 'membership_already_exists'; end if;

  update public.clinic_invitations ci
  set status = 'expired'
  where ci.clinic_id = p_clinic_id
    and ci.email = v_email
    and ci.status = 'pending'
    and ci.expires_at <= now();

  insert into public.clinic_invitations
    (clinic_id, unit_id, full_name, email, role_id, token_hash, expires_at, invited_by)
  values
    (p_clinic_id, p_unit_id, trim(p_name), v_email, v_role_id,
     encode(digest(p_token, 'sha256'), 'hex'), v_expires_at, v_user_id)
  returning id into v_invitation_id;

  insert into public.audit_logs
    (clinic_id, unit_id, actor_user_id, action, entity_type, entity_id, metadata)
  values
    (p_clinic_id, p_unit_id, v_user_id, 'invitation.created', 'clinic_invitation', v_invitation_id,
     jsonb_build_object('email', v_email, 'role', p_role_key));

  return query select v_invitation_id, v_expires_at;
end;
$$;
