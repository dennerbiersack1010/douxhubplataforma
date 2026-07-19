import { randomBytes } from 'node:crypto'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { authorizeActiveProfile, type ActiveProfileAuthorizationFailure } from '@/lib/active-profile-authorization'

function json(body: unknown, status = 200) {
  const response = NextResponse.json(body, { status })
  response.headers.set('Cache-Control', 'private, no-store, max-age=0')
  return response
}

function authorizationError(failure: ActiveProfileAuthorizationFailure) {
  return json({ error: failure.error }, failure.status)
}

export async function GET() {
  const context = await authorizeActiveProfile('team_members.read', 'clinic')
  if ('error' in context) return authorizationError(context)

  const { supabase } = context
  const clinicResult = await supabase
    .from('clinics')
    .select('id, name, slug, status, plan_code, settings')
    .eq('id', context.clinicId)
    .single()
  if (clinicResult.error || !clinicResult.data) return json({ error: 'clinic_data_unavailable' }, 503)
  const clinic = clinicResult.data
  const [membersResult, invitationsResult, rolesResult, unitsResult] = await Promise.all([
    supabase
      .from('clinic_memberships')
      .select('id, user_id, unit_id, status, joined_at, last_access_at, roles!inner(key, name), clinic_units(name)')
      .eq('clinic_id', clinic.id)
      .order('joined_at', { ascending: true }),
    supabase
      .from('clinic_invitations')
      .select('id, full_name, email, status, expires_at, created_at, roles!inner(key, name), clinic_units(name)')
      .eq('clinic_id', clinic.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('roles')
      .select('key, name')
      .eq('is_enabled', true)
      .eq('is_assignable', true)
      .in('key', context.roleKey === 'clinic_owner' ? ['clinic_admin', 'clinic_employee'] : ['clinic_employee'])
      .order('priority', { ascending: true }),
    supabase
      .from('clinic_units')
      .select('id, name, status')
      .eq('clinic_id', clinic.id)
      .order('name', { ascending: true }),
  ])

  const firstError = membersResult.error || invitationsResult.error || rolesResult.error || unitsResult.error
  if (firstError) return json({ error: 'clinic_data_unavailable' }, 503)

  const userIds = (membersResult.data ?? []).map((member) => member.user_id)
  const { data: profiles, error: profilesError } = userIds.length
    ? await supabase.from('user_profiles').select('user_id, full_name, email').in('user_id', userIds)
    : { data: [], error: null }

  if (profilesError) return json({ error: 'clinic_data_unavailable' }, 503)

  return json({
    clinic,
    currentRole: context.roleKey,
    members: membersResult.data ?? [],
    profiles: profiles ?? [],
    invitations: invitationsResult.data ?? [],
    roles: rolesResult.data ?? [],
    units: unitsResult.data ?? [],
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as {
    name?: unknown
    email?: unknown
    roleKey?: unknown
    unitId?: unknown
  } | null

  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const roleKey = typeof body?.roleKey === 'string' ? body.roleKey : ''
  const unitId = typeof body?.unitId === 'string' && body.unitId ? body.unitId : null

  if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || !['clinic_admin', 'clinic_employee'].includes(roleKey)) {
    return json({ error: 'invalid_invitation_data' }, 400)
  }

  const permission = roleKey === 'clinic_admin' ? 'team_admins.invite' : 'team_employees.invite'
  const context = await authorizeActiveProfile(permission, 'clinic')
  if ('error' in context) return authorizationError(context)

  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await context.supabase.rpc('create_clinic_invitation', {
    p_clinic_id: context.clinicId,
    p_name: name,
    p_email: email,
    p_role_key: roleKey,
    p_token: token,
    p_unit_id: unitId,
    p_expires_at: expiresAt,
  })

  if (error) return json({ error: 'invitation_creation_failed' }, 409)

  const redirectUrl = `${request.nextUrl.origin}/primeiro-acesso?invitation=${encodeURIComponent(token)}`
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  let delivery: 'sent' | 'prepared' = 'prepared'

  if (supabaseUrl && serviceRoleKey) {
    const admin = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirectUrl,
      data: { full_name: name },
    })
    if (!inviteError) delivery = 'sent'
  }

  const invitation = Array.isArray(data) ? data[0] : data
  return json({ invitation, delivery, redirectUrl }, 201)
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null) as {
    membershipId?: unknown
    roleKey?: unknown
    status?: unknown
    invitationId?: unknown
    action?: unknown
  } | null

  const invitationId = typeof body?.invitationId === 'string' ? body.invitationId : ''
  if (body?.action === 'revoke' && invitationId) {
    const context = await authorizeActiveProfile('team_employee_invitations.revoke', 'clinic')
    if ('error' in context) return authorizationError(context)
    const { error } = await context.supabase.rpc('revoke_clinic_invitation', {
      p_invitation_id: invitationId,
    })
    if (error) return json({ error: 'invitation_revoke_failed' }, 403)
    return json({ revoked: true })
  }

  const membershipId = typeof body?.membershipId === 'string' ? body.membershipId : ''
  const roleKey = typeof body?.roleKey === 'string' ? body.roleKey : null
  const status = body?.status === 'active' || body?.status === 'inactive' ? body.status : null

  if (!membershipId || (roleKey === null && status === null)) {
    return json({ error: 'invalid_member_update' }, 400)
  }

  const requiredPermissions = [
    ...(roleKey === null ? [] : ['team_members.role_update']),
    ...(status === null ? [] : ['team_employees.status_update']),
  ]
  const [firstPermission, ...additionalPermissions] = requiredPermissions
  if (!firstPermission) return json({ error: 'invalid_member_update' }, 400)

  let context = await authorizeActiveProfile(firstPermission, 'clinic')
  if ('error' in context) return authorizationError(context)
  for (const permission of additionalPermissions) {
    const additional = await authorizeActiveProfile(permission, 'clinic')
    if ('error' in additional) return authorizationError(additional)
    context = additional
  }

  const { error } = await context.supabase.rpc('update_clinic_member', {
    p_membership_id: membershipId,
    p_role_key: roleKey,
    p_status: status,
  })

  if (error) return json({ error: 'member_update_failed' }, 403)
  return json({ updated: true })
}
