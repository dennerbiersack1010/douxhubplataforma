import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type TransitionSnapshot = {
  equivalence_ready: boolean
  legacy_membership_count: number
  equivalent_membership_count: number
  profiles: unknown[]
  issues: unknown[]
}

function noStoreJson(body: unknown, status: number) {
  const response = NextResponse.json(body, { status })
  response.headers.set('Cache-Control', 'private, no-store, max-age=0')
  return response
}

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_access_profile_transition_snapshot')

  if (error) {
    if (error.message.includes('authentication_required')) {
      return noStoreJson({ error: 'unauthorized' }, 401)
    }
    return noStoreJson({ error: 'access_profiles_unavailable' }, 503)
  }

  const snapshot = data as TransitionSnapshot | null
  if (!snapshot || typeof snapshot.equivalence_ready !== 'boolean') {
    return noStoreJson({ error: 'access_profiles_unavailable' }, 503)
  }

  if (!snapshot.equivalence_ready) {
    return noStoreJson({ error: 'access_profile_equivalence_failed', snapshot }, 409)
  }

  return noStoreJson({ snapshot }, 200)
}
