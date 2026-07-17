import { randomBytes } from 'node:crypto'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Relation<T> = T | T[] | null

function firstRelation<T>(value: Relation<T>): T | null {
  return Array.isArray(value) ? value[0] ?? null : value
}

async function getManagerContext() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: 'unauthorized' as const, status: 401 as const }

  const { data: active, error: activeError } = await supabase
    .from('user_active_contexts')
    .select('membership_id, clinic_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (activeError || !active) return { error: 'active_context_required' as const, status: 409 as const }

  const { data: membership, error: membershipError } = await supabase
    .from('clinic_memberships')
    .select('id, status, roles!inner(key), clinics!inner(id, name, slug, status, plan_code, settings)')
    .eq('id', active.membership_id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  const role = firstRelation((membership?.roles ?? null) as Relation<{ key: string }>)
  const clinic = firstRelation((membership?.clinics ?? null) as Relation<{
    id: string
    name: string
    slug: string
    status: string
    plan_code: string
    settings: Record<string, unknown>
  }>)

  if (membershipError || !membership || !clinic || !role) {
    return { error: 'invalid_active_context' as const, status: 403 as const }
  }

  if (!['clinic_owner', 'clinic_admin'].includes(role.key)) {
    return { error: 'insufficient_permission' as const, status: 403 as const }
  }

  return { supabase, user, active, clinic, role }
}

export async function GET() {
  const context = await getManagerContext()
  if ('error' in context) return NextResponse.json({ error: context.error }, { status: context.status })

  const { supabase, clinic } = context
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
      .in('key', context.role.key === 'clinic_owner' ? ['clinic_admin', 'clinic_employee'] : ['clinic_employee'])
      .order('priority', { ascending: true }),
    supabase
      .from('clinic_units')
      .select('id, name, status')
      .eq('clinic_id', clinic.id)
      .order('name', { ascending: true }),
  ])

  const firstError = membersResult.error || invitationsResult.error || rolesResult.error || unitsResult.error
  if (firstError) return NextResponse.json({ error: 'clinic_data_unavailable' }, { status: 503 })

  const userIds = (membersResult.data ?? []).map((member) => member.user_id)
  const { data: profiles, error: profilesError } = userIds.length
    ? await supabase.from('user_profiles').select('user_id, full_name, email').in('user_id', userIds)
    : { data: [], error: null }

  if (profilesError) return NextResponse.json({ error: 'clinic_data_unavailable' }, { status: 503 })

  return NextResponse.json({
    clinic,
    currentRole: context.role.key,
    members: membersResult.data ?? [],
    profiles: profiles ?? [],
    invitations: invitationsResult.data ?? [],
    roles: rolesResult.data ?? [],
    units: unitsResult.data ?? [],
  })
}

export async function POST(request: NextRequest) {
  const context = await getManagerContext()
  if ('error' in context) return NextResponse.json({ error: context.error }, { status: context.status })

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
    return NextResponse.json({ error: 'invalid_invitation_data' }, { status: 400 })
  }

  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await context.supabase.rpc('create_clinic_invitation', {
    p_clinic_id: context.clinic.id,
    p_name: name,
    p_email: email,
    p_role_key: roleKey,
    p_token: token,
    p_unit_id: unitId,
    p_expires_at: expiresAt,
  })

  if (error) return NextResponse.json({ error: 'invitation_creation_failed' }, { status: 409 })

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
  return NextResponse.json({ invitation, delivery, redirectUrl }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const context = await getManagerContext()
  if ('error' in context) return NextResponse.json({ error: context.error }, { status: context.status })

  const body = await request.json().catch(() => null) as {
    membershipId?: unknown
    roleKey?: unknown
    status?: unknown
    invitationId?: unknown
    action?: unknown
  } | null

  const invitationId = typeof body?.invitationId === 'string' ? body.invitationId : ''
  if (body?.action === 'revoke' && invitationId) {
    const { error } = await context.supabase.rpc('revoke_clinic_invitation', {
      p_invitation_id: invitationId,
    })
    if (error) return NextResponse.json({ error: 'invitation_revoke_failed' }, { status: 403 })
    return NextResponse.json({ revoked: true })
  }

  const membershipId = typeof body?.membershipId === 'string' ? body.membershipId : ''
  const roleKey = typeof body?.roleKey === 'string' ? body.roleKey : null
  const status = body?.status === 'active' || body?.status === 'inactive' ? body.status : null

  if (!membershipId || (roleKey === null && status === null)) {
    return NextResponse.json({ error: 'invalid_member_update' }, { status: 400 })
  }

  const { error } = await context.supabase.rpc('update_clinic_member', {
    p_membership_id: membershipId,
    p_role_key: roleKey,
    p_status: status,
  })

  if (error) return NextResponse.json({ error: 'member_update_failed' }, { status: 403 })
  return NextResponse.json({ updated: true })
}
