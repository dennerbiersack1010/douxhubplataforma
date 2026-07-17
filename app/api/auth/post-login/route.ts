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
  
  console.log('[POST-LOGIN] Starting post-login flow')
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('[POST-LOGIN] ❌ No user found:', userError)
    return NextResponse.json(
      { error: 'unauthorized', message: 'User session not found' },
      { status: 401 }
    )
  }

  console.log(`[POST-LOGIN] ✓ User authenticated: ${user.id} (${user.email})`)

  try {
    console.log('[POST-LOGIN] Fetching active memberships...')
    const memberships = await listActiveMemberships(supabase, user.id)
    console.log(`[POST-LOGIN] ✓ Found ${memberships.length} active membership(s)`)

    if (memberships.length === 0) {
      console.log('[POST-LOGIN] No active memberships, checking if any exist...')
      const redirectTo = await resolveNoActiveMembershipRedirect(supabase, user.id)
      console.log(`[POST-LOGIN] ✓ Redirecting to ${redirectTo}`)
      const response = NextResponse.json({ redirectTo })
      response.cookies.delete(ACTIVE_MEMBERSHIP_COOKIE)
      return response
    }

    if (memberships.length > 1) {
      console.log(`[POST-LOGIN] Multiple memberships found: ${memberships.map(m => m.id).join(', ')}`)
      console.log('[POST-LOGIN] ✓ Redirecting to /selecionar-perfil')
      const response = NextResponse.json({ redirectTo: '/selecionar-perfil' })
      response.cookies.delete(ACTIVE_MEMBERSHIP_COOKIE)
      return response
    }

    const membershipId = memberships[0].id
    console.log(`[POST-LOGIN] Activating single membership: ${membershipId}`)
    await activateMembership(supabase, membershipId)
    console.log(`[POST-LOGIN] ✓ Membership activated, redirecting to /dashboard`)
    
    const response = NextResponse.json({ redirectTo: '/dashboard' })
    response.cookies.set(ACTIVE_MEMBERSHIP_COOKIE, membershipId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 12,
    })
    return response
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[POST-LOGIN] ❌ Error during membership resolution:', errorMessage)
    console.error('[POST-LOGIN] ❌ Full error:', error)
    
    return NextResponse.json(
      {
        error: 'membership_resolution_failed',
        message: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
