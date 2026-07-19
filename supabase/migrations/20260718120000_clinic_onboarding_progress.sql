-- DouxHub: persistência segura e retomável do onboarding inicial.
-- Esta migração é aditiva e não altera o fluxo de autenticação nem create_initial_clinic.

do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'clinic_onboarding_status'
  ) then
    create type public.clinic_onboarding_status as enum ('in_progress', 'completed', 'cancelled');
  end if;
end;
$$;

create table if not exists public.clinic_onboarding_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status public.clinic_onboarding_status not null default 'in_progress',
  current_step smallint not null default 1,
  completed_steps smallint[] not null default '{}'::smallint[],
  owner_data jsonb not null default '{}'::jsonb,
  clinic_data jsonb not null default '{}'::jsonb,
  unit_data jsonb not null default '{}'::jsonb,
  operation_data jsonb not null default '{}'::jsonb,
  team_data jsonb not null default '{}'::jsonb,
  created_clinic_id uuid references public.clinics(id) on delete set null,
  created_unit_id uuid references public.clinic_units(id) on delete set null,
  schema_version smallint not null default 1,
  revision integer not null default 1,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  cancelled_at timestamptz,
  constraint clinic_onboarding_current_step_range check (current_step between 1 and 6),
  constraint clinic_onboarding_completed_steps_range check (completed_steps <@ array[1,2,3,4,5]::smallint[]),
  constraint clinic_onboarding_owner_data_object check (jsonb_typeof(owner_data) = 'object'),
  constraint clinic_onboarding_clinic_data_object check (jsonb_typeof(clinic_data) = 'object'),
  constraint clinic_onboarding_unit_data_object check (jsonb_typeof(unit_data) = 'object'),
  constraint clinic_onboarding_operation_data_object check (jsonb_typeof(operation_data) = 'object'),
  constraint clinic_onboarding_team_data_object check (jsonb_typeof(team_data) = 'object'),
  constraint clinic_onboarding_schema_version_positive check (schema_version > 0),
  constraint clinic_onboarding_revision_positive check (revision > 0),
  constraint clinic_onboarding_completion_consistent check (
    (status = 'completed' and completed_at is not null and created_clinic_id is not null and created_unit_id is not null)
    or (status <> 'completed' and completed_at is null)
  ),
  constraint clinic_onboarding_cancellation_consistent check (
    (status = 'cancelled' and cancelled_at is not null)
    or (status <> 'cancelled' and cancelled_at is null)
  )
);

create unique index if not exists clinic_onboarding_one_active_per_user_idx
  on public.clinic_onboarding_progress (user_id)
  where status = 'in_progress';

create index if not exists clinic_onboarding_user_updated_idx
  on public.clinic_onboarding_progress (user_id, updated_at desc);

drop trigger if exists clinic_onboarding_progress_set_updated_at on public.clinic_onboarding_progress;
create trigger clinic_onboarding_progress_set_updated_at
before update on public.clinic_onboarding_progress
for each row execute function public.set_updated_at();

alter table public.clinic_onboarding_progress enable row level security;

create policy clinic_onboarding_progress_select_self
on public.clinic_onboarding_progress for select to authenticated
using (user_id = auth.uid());

grant select on public.clinic_onboarding_progress to authenticated;
revoke insert, update, delete on public.clinic_onboarding_progress from authenticated;

create or replace function public.start_or_resume_clinic_onboarding()
returns public.clinic_onboarding_progress
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_progress public.clinic_onboarding_progress%rowtype;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;

  insert into public.clinic_onboarding_progress (user_id)
  values (v_user_id)
  on conflict (user_id) where status = 'in_progress'
  do update set user_id = excluded.user_id
  returning * into v_progress;

  return v_progress;
end;
$$;

create or replace function public.save_clinic_onboarding_step(
  p_progress_id uuid,
  p_step smallint,
  p_payload jsonb
)
returns public.clinic_onboarding_progress
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_progress public.clinic_onboarding_progress%rowtype;
  v_completed_steps smallint[];
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if p_step not between 1 and 5 then raise exception 'invalid_onboarding_step'; end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then raise exception 'invalid_onboarding_payload'; end if;
  if octet_length(p_payload::text) > 100000 then raise exception 'onboarding_payload_too_large'; end if;

  select * into v_progress
  from public.clinic_onboarding_progress
  where id = p_progress_id and user_id = v_user_id and status = 'in_progress'
  for update;

  if not found then raise exception 'onboarding_progress_not_found'; end if;
  if p_step > v_progress.current_step then raise exception 'onboarding_step_out_of_order'; end if;

  select coalesce(array_agg(distinct item order by item), '{}'::smallint[])
  into v_completed_steps
  from unnest(v_progress.completed_steps || p_step) item;

  update public.clinic_onboarding_progress
  set owner_data = case when p_step = 1 then p_payload else owner_data end,
      clinic_data = case when p_step = 2 then p_payload else clinic_data end,
      unit_data = case when p_step = 3 then p_payload else unit_data end,
      operation_data = case when p_step = 4 then p_payload else operation_data end,
      team_data = case when p_step = 5 then p_payload else team_data end,
      completed_steps = v_completed_steps,
      current_step = greatest(current_step, least((p_step + 1)::smallint, 6::smallint)),
      revision = revision + 1
  where id = v_progress.id
  returning * into v_progress;

  return v_progress;
end;
$$;

create or replace function public.cancel_clinic_onboarding(p_progress_id uuid)
returns public.clinic_onboarding_progress
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_progress public.clinic_onboarding_progress%rowtype;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;

  update public.clinic_onboarding_progress
  set status = 'cancelled',
      cancelled_at = now(),
      revision = revision + 1
  where id = p_progress_id and user_id = v_user_id and status = 'in_progress'
  returning * into v_progress;

  if not found then raise exception 'onboarding_progress_not_found'; end if;
  return v_progress;
end;
$$;

revoke all on function public.start_or_resume_clinic_onboarding() from public;
revoke all on function public.save_clinic_onboarding_step(uuid, smallint, jsonb) from public;
revoke all on function public.cancel_clinic_onboarding(uuid) from public;
grant execute on function public.start_or_resume_clinic_onboarding() to authenticated;
grant execute on function public.save_clinic_onboarding_step(uuid, smallint, jsonb) to authenticated;
grant execute on function public.cancel_clinic_onboarding(uuid) to authenticated;

