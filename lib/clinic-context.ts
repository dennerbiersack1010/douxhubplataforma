import type { SupabaseClient } from '@supabase/supabase-js'

export const ACTIVE_MEMBERSHIP_COOKIE = 'douxhub_active_membership'

export interface MembershipOption {
  id: string
  clinicId: string
  clinicName: string
  clinicSlug: string
  unitId: string | null
  unitName: string | null
  roleKey: string
  roleName: string
}

interface MembershipRow {
  id: string
  clinic_id: string
  unit_id: string | null
  clinics: { name: string; slug: string } | Array<{ name: string; slug: string }>
  clinic_units: { name: string; status: string } | Array<{ name: string; status: string }> | null
  roles: { key: string; name: string } | Array<{ key: string; name: string }>
}

function firstRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value
}

export async function listActiveMemberships(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('clinic_memberships')
    .select(`
      id,
      clinic_id,
      unit_id,
      clinics!inner(name, slug, status),
      clinic_units(name, status),
      roles!inner(key, name)
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .eq('clinics.status', 'active')
    .order('joined_at', { ascending: true })

  if (error) throw error

  return ((data ?? []) as unknown as MembershipRow[]).filter((row) => {
    const unit = firstRelation(row.clinic_units)
    return !unit || unit.status === 'active'
  }).map((row): MembershipOption => {
    const clinic = firstRelation(row.clinics)
    const unit = firstRelation(row.clinic_units)
    const role = firstRelation(row.roles)

    if (!clinic || !role) throw new Error('invalid_membership_relation')

    return {
      id: row.id,
      clinicId: row.clinic_id,
      clinicName: clinic.name,
      clinicSlug: clinic.slug,
      unitId: row.unit_id,
      unitName: unit?.name ?? null,
      roleKey: role.key,
      roleName: role.name,
    }
  })
}

export async function resolveNoActiveMembershipRedirect(
  supabase: SupabaseClient,
  userId: string
) {
  const { count, error } = await supabase
    .from('clinic_memberships')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) throw error
  return (count ?? 0) === 0 ? '/configurar-clinica' : '/sem-clinica'
}

export async function activateMembership(supabase: SupabaseClient, membershipId: string) {
  const { data, error } = await supabase.rpc('set_active_clinic_context', {
    p_membership_id: membershipId,
  })

  if (error) throw error
  const context = Array.isArray(data) ? data[0] : data
  if (!context) throw new Error('invalid_active_context')
  return context
}
