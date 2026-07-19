import { createClient } from '@/lib/supabase/server'

export type PermissionScope = 'own' | 'unit' | 'clinic'

export type ActiveProfileAuthorization = {
  supabase: Awaited<ReturnType<typeof createClient>>
  userId: string
  accessProfileId: string
  membershipId: string
  clinicId: string
  unitId: string | null
  roleKey: string
}

export type ActiveProfileAuthorizationFailure = {
  error: 'unauthorized' | 'active_context_required' | 'invalid_active_context' | 'insufficient_permission' | 'authorization_unavailable'
  status: 401 | 403 | 409 | 503
}

type AuthorizationRow = {
  user_id: string
  access_profile_id: string
  membership_id: string
  clinic_id: string
  unit_id: string | null
  role_key: string
}

function authorizationFailure(message: string, code?: string): ActiveProfileAuthorizationFailure {
  if (code === '42501' || message.includes('authentication_required') || message.includes('permission denied')) {
    return { error: 'unauthorized', status: 401 }
  }
  if (message.includes('active_context_required')) {
    return { error: 'active_context_required', status: 409 }
  }
  if (
    message.includes('invalid_active_context') ||
    message.includes('active_context_target_mismatch') ||
    message.includes('access_profile_equivalence_failed')
  ) {
    return { error: 'invalid_active_context', status: 403 }
  }
  if (message.includes('insufficient_permission')) {
    return { error: 'insufficient_permission', status: 403 }
  }
  return { error: 'authorization_unavailable', status: 503 }
}

export async function authorizeActiveProfile(
  permissionKey: string,
  scope: PermissionScope,
  target?: { clinicId?: string | null; unitId?: string | null },
): Promise<ActiveProfileAuthorization | ActiveProfileAuthorizationFailure> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('authorize_active_access_profile', {
    p_permission_key: permissionKey,
    p_scope: scope,
    p_target_clinic_id: target?.clinicId ?? null,
    p_target_unit_id: target?.unitId ?? null,
  })

  if (error) return authorizationFailure(error.message, error.code)

  const row = (Array.isArray(data) ? data[0] : data) as AuthorizationRow | null
  if (!row?.user_id || !row.access_profile_id || !row.membership_id || !row.clinic_id || !row.role_key) {
    return { error: 'authorization_unavailable', status: 503 }
  }

  return {
    supabase,
    userId: row.user_id,
    accessProfileId: row.access_profile_id,
    membershipId: row.membership_id,
    clinicId: row.clinic_id,
    unitId: row.unit_id,
    roleKey: row.role_key,
  }
}
