'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

type Relation<T> = T | T[] | null

interface Role { key: string; name: string }
interface Unit { id: string; name: string; status: string }
interface Profile { user_id: string; full_name: string | null; email: string | null }
interface Member {
  id: string
  user_id: string
  status: 'active' | 'inactive'
  joined_at: string
  last_access_at: string | null
  roles: Relation<Role>
  clinic_units: Relation<{ name: string }>
}
interface Invitation {
  id: string
  full_name: string
  email: string
  status: string
  expires_at: string
  roles: Relation<Role>
}
interface AdminData {
  clinic: { id: string; name: string; slug: string; status: string; plan_code: string }
  currentRole: string
  members: Member[]
  profiles: Profile[]
  invitations: Invitation[]
  roles: Role[]
  units: Unit[]
}

function firstRelation<T>(value: Relation<T>): T | null {
  return Array.isArray(value) ? value[0] ?? null : value
}

export default function ClinicAdminPanel() {
  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [preparedRedirect, setPreparedRedirect] = useState<string | null>(null)

  const profiles = useMemo(
    () => new Map((data?.profiles ?? []).map((profile) => [profile.user_id, profile])),
    [data]
  )

  const loadData = useCallback(async () => {
    setError(null)
    try {
      const response = await fetch('/api/clinic-admin', { cache: 'no-store' })
      if (!response.ok) throw new Error('clinic_data_unavailable')
      setData(await response.json() as AdminData)
    } catch {
      setError('Não foi possível carregar os dados da clínica. Confirme o contexto ativo e suas permissões.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData()
  }, [loadData])

  async function createInvitation(formData: FormData) {
    if (saving) return
    setSaving(true)
    setError(null)
    setNotice(null)
    setPreparedRedirect(null)

    try {
      const response = await fetch('/api/clinic-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          email: formData.get('email'),
          roleKey: formData.get('roleKey'),
          unitId: formData.get('unitId'),
        }),
      })

      const result = await response.json() as { delivery?: 'sent' | 'prepared'; redirectUrl?: string }
      if (!response.ok) throw new Error('invitation_failed')

      if (result.delivery === 'sent') {
        setNotice('Convite criado e enviado pelo Supabase Auth.')
      } else {
        setNotice('Convite criado e preparado. O envio automático requer a chave server-only do Supabase.')
        setPreparedRedirect(result.redirectUrl ?? null)
      }
      await loadData()
    } catch {
      setError('Não foi possível criar o convite. Verifique se já existe um convite pendente para este e-mail.')
    } finally {
      setSaving(false)
    }
  }

  async function updateMember(membershipId: string, changes: { roleKey?: string; status?: string }) {
    if (saving) return
    setSaving(true)
    setError(null)
    setNotice(null)

    try {
      const response = await fetch('/api/clinic-admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipId, ...changes }),
      })
      if (!response.ok) throw new Error('member_update_failed')
      setNotice('Vínculo atualizado.')
      await loadData()
    } catch {
      setError('Não foi possível atualizar este vínculo. A função de proprietário não pode ser alterada nesta etapa.')
    } finally {
      setSaving(false)
    }
  }

  async function revokeInvitation(invitationId: string) {
    if (saving) return
    setSaving(true)
    setError(null)
    setNotice(null)

    try {
      const response = await fetch('/api/clinic-admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId, action: 'revoke' }),
      })
      if (!response.ok) throw new Error('invitation_revoke_failed')
      setNotice('Convite revogado.')
      await loadData()
    } catch {
      setError('Não foi possível revogar este convite com o perfil atual.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm text-zinc-400">Carregando administração da clínica...</p>

  return (
    <section className="max-w-5xl mx-auto space-y-6">
      <div className="p-4 bg-yellow-950/30 border border-yellow-800/60 rounded-lg">
        <p className="text-xs text-yellow-400 font-semibold uppercase tracking-wider">Interface técnica temporária</p>
        <p className="text-xs text-zinc-400 mt-1">Base funcional para validar dados, membros e convites. Não representa o layout definitivo.</p>
      </div>

      {error && <div className="p-3 border border-red-900/60 bg-red-950/30 rounded text-sm text-red-300">{error}</div>}
      {notice && <div className="p-3 border border-emerald-900/60 bg-emerald-950/20 rounded text-sm text-emerald-300">{notice}</div>}

      {data && (
        <>
          <div className="p-5 border border-zinc-800 bg-zinc-900 rounded-lg">
            <h1 className="text-lg font-semibold text-zinc-100">{data.clinic.name}</h1>
            <dl className="grid sm:grid-cols-3 gap-3 mt-4 text-xs">
              <div><dt className="text-zinc-500">Slug</dt><dd className="text-zinc-300 mt-1">{data.clinic.slug}</dd></div>
              <div><dt className="text-zinc-500">Status</dt><dd className="text-zinc-300 mt-1">{data.clinic.status}</dd></div>
              <div><dt className="text-zinc-500">Plano preparatório</dt><dd className="text-zinc-300 mt-1">{data.clinic.plan_code}</dd></div>
            </dl>
          </div>

          <form action={createInvitation} className="p-5 border border-zinc-800 bg-zinc-900 rounded-lg space-y-4">
            <div><h2 className="text-base font-semibold text-zinc-100">Convidar colaborador</h2><p className="text-xs text-zinc-500 mt-1">O convite expira em 7 dias e só pode ser aceito pelo e-mail informado.</p></div>
            <div className="grid md:grid-cols-2 gap-3">
              <TechnicalInput name="name" label="Nome" type="text" required />
              <TechnicalInput name="email" label="E-mail" type="email" required />
              <TechnicalSelect name="roleKey" label="Função" options={data.roles.map((role) => ({ value: role.key, label: role.name }))} />
              <TechnicalSelect name="unitId" label="Unidade opcional" options={[{ value: '', label: 'Todas / não definida' }, ...data.units.filter((unit) => unit.status === 'active').map((unit) => ({ value: unit.id, label: unit.name }))]} />
            </div>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-zinc-100 text-zinc-950 text-sm font-medium disabled:opacity-50">{saving ? 'Processando...' : 'Criar convite'}</button>
            {preparedRedirect && <div className="p-3 rounded border border-zinc-700 bg-zinc-950 text-xs text-zinc-400 break-all"><strong className="text-zinc-300">URL de redirecionamento preparada:</strong><br />{preparedRedirect}</div>}
          </form>

          <div className="p-5 border border-zinc-800 bg-zinc-900 rounded-lg overflow-x-auto">
            <h2 className="text-base font-semibold text-zinc-100 mb-4">Membros</h2>
            <table className="w-full min-w-[720px] text-xs">
              <thead className="text-left text-zinc-500 border-b border-zinc-800"><tr><th className="py-2">Pessoa</th><th>Função</th><th>Status</th><th>Último acesso</th><th>Ações</th></tr></thead>
              <tbody>
                {data.members.map((member) => {
                  const profile = profiles.get(member.user_id)
                  const role = firstRelation(member.roles)
                  const isOwner = role?.key === 'clinic_owner'
                  const canManageMember = !isOwner && (
                    data.currentRole === 'clinic_owner' || role?.key === 'clinic_employee'
                  )
                  return <tr key={member.id} className="border-b border-zinc-800/70 text-zinc-300">
                    <td className="py-3 pr-3"><span className="block">{profile?.full_name || 'Nome não informado'}</span><span className="text-zinc-500">{profile?.email || member.user_id}</span></td>
                    <td className="pr-3">{role?.name || '—'}</td>
                    <td className="pr-3">{member.status}</td>
                    <td className="pr-3">{member.last_access_at ? new Date(member.last_access_at).toLocaleString('pt-BR') : 'Nunca'}</td>
                    <td className="py-2 flex gap-2">
                      <select aria-label={`Função de ${profile?.full_name || member.user_id}`} disabled={saving || !canManageMember} value={role?.key || ''} onChange={(event) => updateMember(member.id, { roleKey: event.target.value })} className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1">
                        {data.roles.map((option) => <option key={option.key} value={option.key}>{option.name}</option>)}
                      </select>
                      <button type="button" disabled={saving || !canManageMember} onClick={() => updateMember(member.id, { status: member.status === 'active' ? 'inactive' : 'active' })} className="border border-zinc-700 rounded px-2 py-1 disabled:opacity-40">{member.status === 'active' ? 'Desativar' : 'Ativar'}</button>
                    </td>
                  </tr>
                })}
              </tbody>
            </table>
          </div>

          <div className="p-5 border border-zinc-800 bg-zinc-900 rounded-lg overflow-x-auto">
            <h2 className="text-base font-semibold text-zinc-100 mb-4">Convites recentes</h2>
            <table className="w-full min-w-[720px] text-xs"><thead className="text-left text-zinc-500 border-b border-zinc-800"><tr><th className="py-2">Nome</th><th>E-mail</th><th>Função</th><th>Status</th><th>Expira em</th><th>Ação</th></tr></thead><tbody>{data.invitations.map((invitation) => {
              const invitationRole = firstRelation(invitation.roles)
              const canRevoke = invitation.status === 'pending' && (data.currentRole === 'clinic_owner' || invitationRole?.key === 'clinic_employee')
              return <tr key={invitation.id} className="border-b border-zinc-800/70 text-zinc-300"><td className="py-3 pr-3">{invitation.full_name}</td><td className="pr-3">{invitation.email}</td><td className="pr-3">{invitationRole?.name || '—'}</td><td className="pr-3">{invitation.status}</td><td className="pr-3">{new Date(invitation.expires_at).toLocaleString('pt-BR')}</td><td><button type="button" disabled={saving || !canRevoke} onClick={() => revokeInvitation(invitation.id)} className="rounded border border-zinc-700 px-2 py-1 disabled:opacity-40">Revogar</button></td></tr>
            })}</tbody></table>
          </div>
        </>
      )}
    </section>
  )
}

function TechnicalInput({ name, label, type, required }: { name: string; label: string; type: string; required?: boolean }) {
  return <label className="text-xs text-zinc-400"><span className="block mb-1">{label}</span><input name={name} type={type} required={required} className="w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-700 text-zinc-200" /></label>
}

function TechnicalSelect({ name, label, options }: { name: string; label: string; options: Array<{ value: string; label: string }> }) {
  return <label className="text-xs text-zinc-400"><span className="block mb-1">{label}</span><select name={name} className="w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-700 text-zinc-200">{options.map((option) => <option key={`${name}-${option.value}`} value={option.value}>{option.label}</option>)}</select></label>
}
