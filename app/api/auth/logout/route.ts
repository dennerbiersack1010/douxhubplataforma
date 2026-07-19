import { NextResponse } from 'next/server'
import { ACTIVE_ACCESS_PROFILE_COOKIE, ACTIVE_MEMBERSHIP_COOKIE } from '@/lib/clinic-context'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const response = NextResponse.json({ signedOut: true })
  response.cookies.delete(ACTIVE_MEMBERSHIP_COOKIE)
  response.cookies.delete(ACTIVE_ACCESS_PROFILE_COOKIE)
  return response
}
