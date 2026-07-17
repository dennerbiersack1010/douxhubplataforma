'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { MembershipOption } from '@/lib/clinic-context'

export default function SelecionarPerfilPage() {
  const router = useRouter()
  const [memberships, setMemberships] = useState<MembershipOption[]>([])
  const [loading, setLoading] = useState(true)
  const [selecting, setSelecting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadMemberships() {
      try {
        const response = await fetch('/api/context/active', { cache: 'no-store' })
        if (!response.ok) throw new Error('context_unavailable')
        const data = await response.json() as {
          memberships: MembershipOption[]
          emptyRedirectTo?: string | null
        }
        if (!active) return

        if (data.memberships.length === 0) {
          router.replace(data.emptyRedirectTo || '/sem-clinica')
          return
        }

        if (data.memberships.length === 1) {
          await selectMembership(data.memberships[0].id)
          return
        }

        setMemberships(data.memberships)
      } catch {
        if (active) setError('Não foi possível carregar os perfis disponíveis.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadMemberships()
    return () => { active = false }
    // selectMembership intentionally uses stable browser APIs during initial load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  async function selectMembership(membershipId: string) {
    if (selecting) return
    setSelecting(membershipId)
    setError(null)

    try {
      const response = await fetch('/api/context/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipId }),
      })
      if (!response.ok) throw new Error('invalid_context')

      router.replace('/dashboard')
      router.refresh()
    } catch {
      setError('Não foi possível selecionar este perfil.')
      setSelecting(null)
    }
  }

  return (
    <section className="w-full max-w-3xl space-y-6">
      <div className="p-4 bg-yellow-950/30 border border-yellow-800/60 rounded-lg">
        <p className="text-xs text-yellow-400 font-semibold uppercase tracking-wider">
          Interface técnica temporária
        </p>
        <p className="text-xs text-zinc-400 mt-1">
          A apresentação visual definitiva da Seleção de Perfil será criada após aprovação do design.
        </p>
      </div>

      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Selecionar clínica e perfil</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Escolha o contexto que deseja utilizar nesta sessão.
        </p>
      </div>

      {error && <div className="p-3 rounded border border-red-900/60 bg-red-950/30 text-red-300 text-sm">{error}</div>}

      {loading ? (
        <p className="text-sm text-zinc-400">Carregando vínculos...</p>
      ) : (
        <div className="space-y-3">
          {memberships.map((membership) => (
            <button
              key={membership.id}
              type="button"
              onClick={() => selectMembership(membership.id)}
              disabled={Boolean(selecting)}
              className="w-full text-left p-4 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
              <span className="block text-sm font-semibold text-zinc-100">{membership.clinicName}</span>
              <span className="block text-xs text-zinc-400 mt-1">
                {membership.roleName}{membership.unitName ? ` · ${membership.unitName}` : ''}
              </span>
              {selecting === membership.id && (
                <span className="block text-xs text-zinc-500 mt-2">Selecionando...</span>
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
