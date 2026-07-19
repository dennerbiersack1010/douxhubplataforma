import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ACTIVE_ACCESS_PROFILE_COOKIE, ACTIVE_MEMBERSHIP_COOKIE } from '@/lib/clinic-context'

type PostLoginResolution = {
  redirect_to: string
  membership_id: string | null
  active_membership_count: number
}

function postLoginResponse(body: unknown, status: number, startedAt: number) {
  const response = NextResponse.json(body, { status })
  response.headers.set('Cache-Control', 'private, no-store, max-age=0')
  response.headers.set('Server-Timing', `post-login;dur=${(performance.now() - startedAt).toFixed(1)}`)
  return response
}

export async function POST() {
  const startedAt = performance.now()
  const supabase = await createClient()

  try {
    const { data, error } = await supabase.rpc('resolve_post_login_context')
    if (error) {
      if (
        error.code === '42501' ||
        error.message.includes('authentication_required') ||
        error.message.includes('permission denied')
      ) {
        return postLoginResponse({ error: 'unauthorized' }, 401, startedAt)
      }
      if (error.message.includes('access_profile_equivalence_failed')) {
        return postLoginResponse({ error: 'access_profile_equivalence_failed' }, 409, startedAt)
      }
      throw error
    }

    const resolution = (Array.isArray(data) ? data[0] : data) as PostLoginResolution | null
    if (!resolution?.redirect_to) throw new Error('invalid_post_login_resolution')

    const response = postLoginResponse({
      redirectTo: resolution.redirect_to,
      activeProfileCount: resolution.active_membership_count,
    }, 200, startedAt)

    if (resolution.membership_id) {
      response.cookies.set(ACTIVE_MEMBERSHIP_COOKIE, resolution.membership_id, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 12,
      })
    } else {
      response.cookies.delete(ACTIVE_MEMBERSHIP_COOKIE)
    }
    response.cookies.delete(ACTIVE_ACCESS_PROFILE_COOKIE)
    return response
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[POST-LOGIN] membership resolution failed:', errorMessage)
    return postLoginResponse({ error: 'membership_resolution_failed' }, 503, startedAt)
  }
}
