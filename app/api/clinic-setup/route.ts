import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ACTIVE_MEMBERSHIP_COOKIE } from '@/lib/clinic-context'

interface SetupResult {
  clinic_id: string
  unit_id: string
  membership_id: string
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null) as {
    clinicName?: unknown
    responsibleName?: unknown
    email?: unknown
    phone?: unknown
    unitName?: unknown
  } | null

  const clinicName = typeof body?.clinicName === 'string' ? body.clinicName.trim() : ''
  const responsibleName = typeof body?.responsibleName === 'string' ? body.responsibleName.trim() : ''
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const phone = typeof body?.phone === 'string' ? body.phone.trim() : ''
  const unitName = typeof body?.unitName === 'string' ? body.unitName.trim() : ''

  if (
    clinicName.length < 2 ||
    responsibleName.length < 2 ||
    unitName.length < 2 ||
    !/^\S+@\S+\.\S+$/.test(email)
  ) {
    return NextResponse.json({ error: 'invalid_clinic_setup' }, { status: 400 })
  }

  const { data, error } = await supabase.rpc('create_initial_clinic', {
    p_name: clinicName,
    p_responsible_name: responsibleName,
    p_email: email,
    p_phone: phone || null,
    p_unit_name: unitName,
  })

  if (error) {
    const status = error.message.includes('active_membership_already_exists') ? 409 : 400
    return NextResponse.json({ error: 'clinic_setup_failed' }, { status })
  }

  const result = (Array.isArray(data) ? data[0] : data) as SetupResult | null
  if (!result?.membership_id) {
    return NextResponse.json({ error: 'clinic_setup_failed' }, { status: 503 })
  }

  const response = NextResponse.json({ redirectTo: '/dashboard' }, { status: 201 })
  response.cookies.set(ACTIVE_MEMBERSHIP_COOKIE, result.membership_id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  })
  return response
}
