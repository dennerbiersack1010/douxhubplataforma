'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ClinicSetupForm({ defaultEmail }: { defaultEmail: string }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(formData: FormData) {
    if (saving) return
    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/clinic-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicName: formData.get('clinicName'),
          responsibleName: formData.get('responsibleName'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          unitName: formData.get('unitName'),
        }),
      })

      if (!response.ok) throw new Error('clinic_setup_failed')
      router.replace('/dashboard')
      router.refresh()
    } catch {
      setError('Não foi possível cadastrar a clínica. Revise os dados ou confirme se sua conta já possui um vínculo ativo.')
      setSaving(false)
    }
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-lg border border-yellow-800/60 bg-yellow-950/30 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-yellow-400">Interface técnica temporária</p>
        <p className="mt-1 text-xs text-zinc-400">Fluxo funcional para cadastrar a primeira clínica e unidade. Não representa o layout definitivo.</p>
      </div>

      <form action={submit} className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900 p-5">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Configurar clínica</h1>
          <p className="mt-1 text-xs text-zinc-500">Sua conta será vinculada como proprietária da clínica.</p>
        </div>

        {error && <div role="alert" className="rounded border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-300">{error}</div>}

        <TechnicalInput name="clinicName" label="Nome da clínica" type="text" required />
        <TechnicalInput name="responsibleName" label="Nome do responsável" type="text" required />
        <TechnicalInput name="email" label="E-mail" type="email" defaultValue={defaultEmail} required />
        <TechnicalInput name="phone" label="Telefone opcional" type="tel" />
        <TechnicalInput name="unitName" label="Nome da primeira unidade" type="text" required />

        <button type="submit" disabled={saving} className="rounded bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 disabled:opacity-50">
          {saving ? 'Criando clínica...' : 'Criar clínica e primeira unidade'}
        </button>
      </form>
    </section>
  )
}

function TechnicalInput({ name, label, type, required, defaultValue }: {
  name: string
  label: string
  type: string
  required?: boolean
  defaultValue?: string
}) {
  return (
    <label className="block text-xs text-zinc-400">
      <span className="mb-1 block">{label}</span>
      <input name={name} type={type} required={required} defaultValue={defaultValue} className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-200" />
    </label>
  )
}
