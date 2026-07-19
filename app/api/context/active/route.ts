import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  ACTIVE_ACCESS_PROFILE_COOKIE,
  ACTIVE_MEMBERSHIP_COOKIE,
  activateAccessProfile,
  listActiveMemberships,
  resolveNoActiveMembershipRedirect,
} from '@/lib/clinic-context'

function contextJson(body: unknown, status = 200) {
  const response = NextResponse.json(body, { status })
  response.headers.set('Cache-Control', 'private, no-store, max-age=0')
  return response
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return contextJson({ error: 'unauthorized' }, 401)

  try {
    const memberships = await listActiveMemberships(supabase, user.id)
    const emptyRedirectTo = memberships.length === 0
      ? await resolveNoActiveMembershipRedirect(supabase, user.id)
      : null
    return contextJson({ memberships, emptyRedirectTo })
  } catch {
    return contextJson({ error: 'context_unavailable' }, 503)
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return contextJson({ error: 'unauthorized' }, 401)

  const body = await request.json().catch(() => null) as { accessProfileId?: unknown } | null
  if (!body || typeof body.accessProfileId !== 'string') {
    return contextJson({ error: 'invalid_access_profile' }, 400)
  }

  try {
    const context = await activateAccessProfile(supabase, body.accessProfileId)
    const response = contextJson({ redirectTo: '/dashboard' })
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
    return contextJson({ error: 'invalid_active_context' }, 403)
  }
}
