import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Layout para rotas de contexto (selecionar-perfil, sem-clinica, configurar-clinica).
 *
 * Estas rotas requerem sessão válida, mas NÃO requerem contexto de clínica ativo.
 * Usam layout mínimo sem sidebar para não confundir com o ambiente de trabalho.
 */
export default async function ContextLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()

  if (!claimsData?.claims?.sub) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4">
      {children}
    </div>
  )
}
