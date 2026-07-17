import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  ACTIVE_MEMBERSHIP_COOKIE,
  activateMembership,
  listActiveMemberships,
  resolveNoActiveMembershipRedirect,
} from '@/lib/clinic-context'

export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('Post-login: No user found', userError)
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const memberships = await listActiveMemberships(supabase, user.id)
    console.log(`Post-login: User ${user.id} has ${memberships.length} active memberships`)

    if (memberships.length === 0) {
      const redirectTo = await resolveNoActiveMembershipRedirect(supabase, user.id)
      console.log(`Post-login: No memberships, redirecting to ${redirectTo}`)
      const response = NextResponse.json({ redirectTo })
      response.cookies.delete(ACTIVE_MEMBERSHIP_COOKIE)
      return response
    }

    if (memberships.length > 1) {
      console.log(`Post-login: Multiple memberships, redirecting to /selecionar-perfil`)
      const response = NextResponse.json({ redirectTo: '/selecionar-perfil' })
      response.cookies.delete(ACTIVE_MEMBERSHIP_COOKIE)
      return response
    }

    await activateMembership(supabase, memberships[0].id)
    console.log(`Post-login: Single membership, activating ${memberships[0].id}`)
    const response = NextResponse.json({ redirectTo: '/dashboard' })
    response.cookies.set(ACTIVE_MEMBERSHIP_COOKIE, memberships[0].id, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 12,
    })
    return response
  } catch (error) {
    console.error('Post-login error:', error)
    return NextResponse.json(
      { error: 'membership_resolution_failed', details: String(error) },
      { status: 503 }
    )
  }
}
