-- Execute após aplicar 20260716213000_multi_tenant_clinics.sql.
-- Valida o contrato estrutural mínimo sem criar usuários reais.

do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'user_profiles', 'roles', 'clinics', 'clinic_units', 'clinic_memberships',
    'clinic_invitations', 'user_active_contexts', 'audit_logs'
  ] loop
    if to_regclass('public.' || v_table) is null then
      raise exception 'Tabela obrigatória ausente: %', v_table;
    end if;
  end loop;
end;
$$;

do $$
declare
  v_table text;
  v_rls boolean;
begin
  foreach v_table in array array[
    'user_profiles', 'roles', 'clinics', 'clinic_units', 'clinic_memberships',
    'clinic_invitations', 'user_active_contexts', 'audit_logs'
  ] loop
    select relrowsecurity into v_rls
    from pg_class
    where oid = ('public.' || v_table)::regclass;

    if not coalesce(v_rls, false) then
      raise exception 'RLS não habilitado: %', v_table;
    end if;
  end loop;
end;
$$;

do $$
begin
  if (select count(*) from public.roles where key in ('clinic_owner', 'clinic_admin', 'clinic_employee') and is_enabled) <> 3 then
    raise exception 'Funções iniciais da clínica não foram configuradas corretamente';
  end if;

  if exists (select 1 from public.roles where key in ('platform_owner', 'platform_admin', 'platform_support')) then
    raise exception 'Funções do DouxHub Control não podem existir nesta etapa';
  end if;

  if (select count(*) from public.roles where key in ('receptionist', 'professional', 'commercial', 'financial', 'stock_manager') and not is_enabled) <> 5 then
    raise exception 'Funções futuras não estão preparadas como inativas';
  end if;
end;
$$;

do $$
begin
  if to_regprocedure('public.create_initial_clinic(text,text,text,text,text)') is null
     or to_regprocedure('public.set_active_clinic_context(uuid)') is null
     or to_regprocedure('public.create_clinic_invitation(uuid,text,text,text,text,uuid,timestamptz)') is null
     or to_regprocedure('public.revoke_clinic_invitation(uuid)') is null
     or to_regprocedure('public.accept_clinic_invitation(text)') is null
     or to_regprocedure('public.update_clinic_member(uuid,text,public.membership_status)') is null then
    raise exception 'Uma ou mais funções seguras obrigatórias estão ausentes';
  end if;
end;
$$;

do $$
declare
  v_required text[] := array[
    'clinics.email', 'clinics.phone', 'clinics.legal_name', 'clinics.document',
    'clinic_units.email', 'clinic_units.phone', 'clinic_units.address',
    'user_profiles.display_name', 'user_profiles.avatar_url', 'user_profiles.phone', 'user_profiles.status',
    'audit_logs.unit_id', 'audit_logs.target_user_id', 'audit_logs.ip_address', 'audit_logs.user_agent'
  ];
  v_missing text[];
begin
  select array_agg(required_column)
  into v_missing
  from unnest(v_required) required_column
  where not exists (
    select 1
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = split_part(required_column, '.', 1)
      and c.column_name = split_part(required_column, '.', 2)
  );

  if v_missing is not null then
    raise exception 'Missing required columns: %', v_missing;
  end if;
end;
$$;

select 'multi_tenant_contract_ok' as result;
