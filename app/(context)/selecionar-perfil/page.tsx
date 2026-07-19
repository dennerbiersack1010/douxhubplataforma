'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AccessProfileOption } from '@/lib/clinic-context'

export default function SelecionarPerfilPage() {
  const router = useRouter()
  const [profiles, setProfiles] = useState<AccessProfileOption[]>([])
  const [loading, setLoading] = useState(true)
  const [selecting, setSelecting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadProfiles() {
      try {
        const response = await fetch('/api/access-profiles', { cache: 'no-store' })
        if (!response.ok) throw new Error('context_unavailable')
        const data = await response.json() as {
          snapshot: {
            legacy_membership_count: number
            profiles: AccessProfileOption[]
          }
        }
        if (!active) return

        const selectableProfiles = data.snapshot.profiles.filter(
          (profile) => profile.legacy_equivalent && profile.source_membership_id
        )

        if (selectableProfiles.length === 0) {
          router.replace(data.snapshot.legacy_membership_count === 0 ? '/configurar-clinica' : '/sem-clinica')
          return
        }

        setProfiles(selectableProfiles)
      } catch {
        if (active) setError('Não foi possível carregar os perfis disponíveis.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadProfiles()
    return () => { active = false }
  }, [router])

  async function selectProfile(accessProfileId: string) {
    if (selecting) return
    setSelecting(accessProfileId)
    setError(null)

    try {
      const response = await fetch('/api/context/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessProfileId }),
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
        <p className="text-sm text-zinc-400">Carregando perfis...</p>
      ) : (
        <div className="space-y-3">
          {profiles.map((profile) => (
            <button
              key={profile.access_profile_id}
              type="button"
              onClick={() => selectProfile(profile.access_profile_id)}
              disabled={Boolean(selecting)}
              className="w-full text-left p-4 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
              <span className="block text-sm font-semibold text-zinc-100">{profile.clinic_name}</span>
              <span className="block text-xs text-zinc-400 mt-1">
                {profile.role_name}{profile.unit_name ? ` · ${profile.unit_name}` : ''}
              </span>
              {selecting === profile.access_profile_id && (
                <span className="block text-xs text-zinc-500 mt-2">Selecionando...</span>
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
