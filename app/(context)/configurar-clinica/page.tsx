import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { listActiveMemberships } from '@/lib/clinic-context'
import ClinicSetupForm from '@/components/clinic-setup-form'

export default async function ConfigurarClinicaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const memberships = await listActiveMemberships(supabase, user.id)
  if (memberships.length > 0) redirect('/dashboard')

  return <ClinicSetupForm defaultEmail={user.email ?? ''} />
}
