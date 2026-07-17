import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AuthenticatedShell from './authenticated-shell'

/**
 * Layout Server Component para rotas autenticadas.
 *
 * Valida a sessão no servidor antes de renderizar qualquer conteúdo.
 * O middleware.ts é a primeira camada de proteção; este layout é a segunda.
 *
 * Não confia em estado React, localStorage ou verificação client-side.
 */
export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <AuthenticatedShell>{children}</AuthenticatedShell>
}
