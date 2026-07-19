import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  ACTIVE_ACCESS_PROFILE_COOKIE,
  ACTIVE_MEMBERSHIP_COOKIE,
  activateAccessProfile,
  listActiveMemberships,
  resolveNoActiveMembershipRedirect,
} from '@/lib/clinic-context'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const memberships = await listActiveMemberships(supabase, user.id)
    const emptyRedirectTo = memberships.length === 0
      ? await resolveNoActiveMembershipRedirect(supabase, user.id)
      : null
    return NextResponse.json({ memberships, emptyRedirectTo })
  } catch {
    return NextResponse.json({ error: 'context_unavailable' }, { status: 503 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null) as { accessProfileId?: unknown } | null
  if (!body || typeof body.accessProfileId !== 'string') {
    return NextResponse.json({ error: 'invalid_access_profile' }, { status: 400 })
  }

  try {
    const context = await activateAccessProfile(supabase, body.accessProfileId)
    const response = NextResponse.json({ redirectTo: '/dashboard' })
    response.headers.set('Cache-Control', 'private, no-store, max-age=0')
    response.cookies.set(ACTIVE_MEMBERSHIP_COOKIE, context.membership_id, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 12,
    })
    response.cookies.set(ACTIVE_ACCESS_PROFILE_COOKIE, context.access_profile_id, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 12,
    })
    return response
  } catch {
    return NextResponse.json({ error: 'invalid_active_context' }, { status: 403 })
  }
}
