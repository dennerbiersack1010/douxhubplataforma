import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ClinicAdminPanel from '@/components/clinic-admin-panel'

type Relation<T> = T | T[] | null

function firstRelation<T>(value: Relation<T>): T | null {
  return Array.isArray(value) ? value[0] ?? null : value
}

export default async function ConfiguracoesEquipePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: active } = await supabase
    .from('user_active_contexts')
    .select('membership_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!active) redirect('/selecionar-perfil')

  const { data: membership } = await supabase
    .from('clinic_memberships')
    .select('status, roles!inner(key)')
    .eq('id', active.membership_id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  const role = firstRelation((membership?.roles ?? null) as Relation<{ key: string }>)
  if (!role || !['clinic_owner', 'clinic_admin'].includes(role.key)) redirect('/dashboard')

  return <ClinicAdminPanel />
}
