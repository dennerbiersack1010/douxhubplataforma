'use client'

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

type StepNumber = 1 | 2 | 3 | 4 | 5
type VisibleStep = StepNumber | 6
type JsonRecord = Record<string, unknown>

type OnboardingProgress = {
  id: string
  status: 'in_progress' | 'completed' | 'cancelled'
  currentStep: number
  completedSteps: number[]
  steps: {
    owner: JsonRecord
    clinic: JsonRecord
    unit: JsonRecord
    operation: JsonRecord
    team: JsonRecord
  }
  schemaVersion: number
  revision: number
  startedAt: string
  updatedAt: string
}

type ApiErrorBody = {
  error?: string
  fields?: Array<{ path: string; code: string }>
}

const stepLabels = [
  'Proprietária',
  'Clínica',
  'Primeira unidade',
  'Funcionamento',
  'Equipe',
  'Preparação',
]

const weekDays = [
  ['monday', 'Segunda'],
  ['tuesday', 'Terça'],
  ['wednesday', 'Quarta'],
  ['thursday', 'Quinta'],
  ['friday', 'Sexta'],
  ['saturday', 'Sábado'],
  ['sunday', 'Domingo'],
] as const

const paymentMethods = [
  ['pix', 'Pix'],
  ['cash', 'Dinheiro'],
  ['credit_card', 'Cartão de crédito'],
  ['debit_card', 'Cartão de débito'],
  ['bank_transfer', 'Transferência'],
  ['installments', 'Parcelamento'],
  ['other', 'Outro'],
] as const

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {}
}

function textValue(record: JsonRecord, key: string, fallback = '') {
  const value = record[key]
  return typeof value === 'string' ? value : fallback
}

function numberValue(record: JsonRecord, key: string, fallback: number) {
  const value = record[key]
  return typeof value === 'number' ? value : fallback
}

function booleanValue(record: JsonRecord, key: string, fallback = false) {
  const value = record[key]
  return typeof value === 'boolean' ? value : fallback
}

function stringList(record: JsonRecord, key: string) {
  const value = record[key]
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function splitList(value: FormDataEntryValue | null) {
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function formText(data: FormData, key: string) {
  return String(data.get(key) ?? '').trim()
}

function formNumber(data: FormData, key: string) {
  return Number(data.get(key))
}

function errorMessage(body: ApiErrorBody, status: number) {
  if (body.error === 'invalid_onboarding_step_data') {
    const fields = body.fields?.map((field) => field.path).filter(Boolean)
    return fields?.length
      ? `Revise os campos: ${fields.join(', ')}.`
      : 'Revise os dados desta etapa antes de continuar.'
  }
  if (body.error === 'onboarding_step_out_of_order') return 'Conclua as etapas anteriores antes de avançar.'
  if (body.error === 'onboarding_not_available') return 'Esta conta já possui um vínculo ativo e não pode iniciar este onboarding.'
  if (status === 401) return 'Sua sessão expirou. Entre novamente para continuar.'
  return 'Não foi possível salvar o onboarding agora. Tente novamente.'
}

async function readResponse(response: Response) {
  const body = await response.json().catch(() => ({})) as ApiErrorBody & { progress?: OnboardingProgress | null }
  if (!response.ok) throw new Error(errorMessage(body, response.status))
  return body
}

export default function ClinicSetupForm({ defaultEmail }: { defaultEmail: string }) {
  const router = useRouter()
  const [progress, setProgress] = useState<OnboardingProgress | null>(null)
  const [activeStep, setActiveStep] = useState<VisibleStep>(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const startOrResume = useCallback(async () => {
    setLoading(true)
    setError(null)
    setCancelled(false)
    try {
      const response = await fetch('/api/clinic-onboarding', { method: 'POST' })
      const body = await readResponse(response)
      if (!body.progress) throw new Error('Não foi possível iniciar o onboarding.')
      setProgress(body.progress)
      setActiveStep(Math.min(body.progress.currentStep, 6) as VisibleStep)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível iniciar o onboarding.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const response = await fetch('/api/clinic-onboarding', { method: 'GET' })
        const body = await readResponse(response)
        if (!active) return
        let loadedProgress = body.progress
        if (!loadedProgress) {
          const startResponse = await fetch('/api/clinic-onboarding', { method: 'POST' })
          const startBody = await readResponse(startResponse)
          loadedProgress = startBody.progress
        }
        if (!active) return
        if (!loadedProgress) throw new Error('Não foi possível iniciar o onboarding.')
        setProgress(loadedProgress)
        setActiveStep(Math.min(loadedProgress.currentStep, 6) as VisibleStep)
      } catch (requestError) {
        if (!active) return
        setError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar o onboarding.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => { active = false }
  }, [])

  async function saveStep(step: StepNumber, payload: JsonRecord) {
    if (!progress || saving) return
    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch('/api/clinic-onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progressId: progress.id, step, payload }),
      })
      const body = await readResponse(response)
      if (!body.progress) throw new Error('Não foi possível atualizar o progresso.')
      setProgress(body.progress)
      setActiveStep(Math.min(body.progress.currentStep, 6) as VisibleStep)
      setMessage(`Etapa ${step} salva com segurança.`)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível salvar esta etapa.')
    } finally {
      setSaving(false)
    }
  }

  async function cancelProgress() {
    if (!progress || saving) return
    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch('/api/clinic-onboarding', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progressId: progress.id }),
      })
      await readResponse(response)
      setProgress(null)
      setCancelled(true)
      setShowCancelConfirm(false)
      setActiveStep(1)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível cancelar o rascunho.')
    } finally {
      setSaving(false)
    }
  }

  async function completeProgress() {
    if (!progress || saving) return
    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch('/api/clinic-onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progressId: progress.id }),
      })
      const body = await readResponse(response) as ApiErrorBody & { redirectTo?: string }
      router.replace(body.redirectTo ?? '/dashboard')
      router.refresh()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível concluir o onboarding.')
      setSaving(false)
    }
  }

  if (loading) {
    return <TechnicalPanel title="Preparando onboarding"><p className="text-sm text-zinc-400">Carregando seu progresso salvo…</p></TechnicalPanel>
  }

  if (cancelled) {
    return (
      <TechnicalPanel title="Rascunho cancelado">
        <p className="text-sm text-zinc-400">O histórico foi preservado e não poderá mais ser alterado.</p>
        {error && <ErrorNotice message={error} />}
        <button type="button" onClick={() => void startOrResume()} className={primaryButtonClass}>Iniciar novo onboarding</button>
      </TechnicalPanel>
    )
  }

  if (!progress) {
    return (
      <TechnicalPanel title="Onboarding indisponível">
        {error && <ErrorNotice message={error} />}
        <button type="button" onClick={() => void startOrResume()} className={primaryButtonClass}>Tentar novamente</button>
      </TechnicalPanel>
    )
  }

  const currentStep = Math.min(progress.currentStep, 6) as VisibleStep

  return (
    <section className="mx-auto w-full max-w-5xl space-y-5">
      <div className="rounded-lg border border-yellow-800/60 bg-yellow-950/30 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-yellow-400">Interface técnica temporária</p>
        <p className="mt-1 text-xs text-zinc-400">Fluxo guiado funcional. O visual definitivo dependerá de referência aprovada.</p>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Configuração inicial</p>
            <h1 className="mt-1 text-xl font-semibold text-zinc-100">Prepare sua clínica por etapas</h1>
            <p className="mt-1 text-sm text-zinc-400">O progresso é salvo no final de cada etapa e retomado automaticamente.</p>
          </div>
          <p className="text-xs text-zinc-500">Revisão {progress.revision}</p>
        </div>

        <ol className="mt-5 grid gap-2 sm:grid-cols-3 lg:grid-cols-6" aria-label="Etapas do onboarding">
          {stepLabels.map((label, index) => {
            const step = (index + 1) as VisibleStep
            const available = step <= currentStep
            const completed = progress.completedSteps.includes(step)
            return (
              <li key={label}>
                <button
                  type="button"
                  disabled={!available || saving}
                  onClick={() => setActiveStep(step)}
                  aria-current={activeStep === step ? 'step' : undefined}
                  className={`w-full rounded border px-3 py-2 text-left text-xs transition ${
                    activeStep === step
                      ? 'border-zinc-300 bg-zinc-800 text-zinc-100'
                      : available
                        ? 'border-zinc-700 bg-zinc-950 text-zinc-300 hover:border-zinc-500'
                        : 'cursor-not-allowed border-zinc-800 bg-zinc-950/50 text-zinc-600'
                  }`}
                >
                  <span className="block text-[10px] uppercase tracking-wider">{completed ? 'Salva' : `Etapa ${step}`}</span>
                  <span className="mt-1 block font-medium">{label}</span>
                </button>
              </li>
            )
          })}
        </ol>
      </div>

      {error && <ErrorNotice message={error} />}
      {message && <div role="status" className="rounded border border-emerald-900/60 bg-emerald-950/30 p-3 text-sm text-emerald-300">{message}</div>}

      <div key={`${progress.id}-${activeStep}-${progress.revision}`} className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
        {activeStep === 1 && <OwnerStep data={progress.steps.owner} defaultEmail={defaultEmail} saving={saving} onSave={(payload) => void saveStep(1, payload)} />}
        {activeStep === 2 && <ClinicStep data={progress.steps.clinic} saving={saving} onSave={(payload) => void saveStep(2, payload)} />}
        {activeStep === 3 && <UnitStep data={progress.steps.unit} saving={saving} onSave={(payload) => void saveStep(3, payload)} />}
        {activeStep === 4 && <OperationStep data={progress.steps.operation} saving={saving} onSave={(payload) => void saveStep(4, payload)} />}
        {activeStep === 5 && <TeamStep data={progress.steps.team} saving={saving} onSave={(payload) => void saveStep(5, payload)} />}
        {activeStep === 6 && <PreparationStep saving={saving} onComplete={() => void completeProgress()} onReview={(step) => setActiveStep(step)} />}
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
        {!showCancelConfirm ? (
          <button type="button" disabled={saving} onClick={() => setShowCancelConfirm(true)} className="text-sm text-red-300 underline underline-offset-4 disabled:opacity-50">Cancelar este rascunho</button>
        ) : (
          <div role="alert" className="space-y-3">
            <div>
              <p className="text-sm font-medium text-red-300">Confirmar cancelamento?</p>
              <p className="mt-1 text-xs text-zinc-400">O rascunho será preservado como cancelado, mas não poderá mais receber alterações.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={saving} onClick={() => setShowCancelConfirm(false)} className={secondaryButtonClass}>Voltar</button>
              <button type="button" disabled={saving} onClick={() => void cancelProgress()} className={dangerButtonClass}>{saving ? 'Cancelando…' : 'Confirmar cancelamento'}</button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function OwnerStep({ data, defaultEmail, saving, onSave }: StepProps & { defaultEmail: string }) {
  const notifications = asRecord(data.notifications)
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    onSave({
      fullName: formText(form, 'fullName'),
      phone: formText(form, 'phone'),
      jobTitle: formText(form, 'jobTitle'),
      responsibilityConfirmed: form.has('responsibilityConfirmed'),
      notifications: {
        email: form.has('notificationEmail'),
        push: form.has('notificationPush'),
        whatsapp: form.has('notificationWhatsapp'),
      },
    })
  }

  return (
    <StepForm title="1. Identificação da proprietária" description="Confirme quem será responsável pela configuração inicial." saving={saving} onSubmit={submit}>
      <FieldGrid>
        <TechnicalInput name="fullName" label="Nome completo" defaultValue={textValue(data, 'fullName')} required />
        <TechnicalInput name="phone" label="Telefone" type="tel" defaultValue={textValue(data, 'phone')} required />
        <TechnicalInput name="jobTitle" label="Cargo" defaultValue={textValue(data, 'jobTitle', 'Proprietária')} required />
        <TechnicalInput name="accountEmail" label="E-mail da conta" type="email" defaultValue={defaultEmail} readOnly />
      </FieldGrid>
      <Checkbox name="responsibilityConfirmed" label="Confirmo que sou responsável por esta configuração" defaultChecked={booleanValue(data, 'responsibilityConfirmed')} required />
      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>Notificações desejadas</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          <Checkbox name="notificationEmail" label="E-mail" defaultChecked={booleanValue(notifications, 'email', true)} />
          <Checkbox name="notificationPush" label="Push" defaultChecked={booleanValue(notifications, 'push', true)} />
          <Checkbox name="notificationWhatsapp" label="WhatsApp" defaultChecked={booleanValue(notifications, 'whatsapp')} />
        </div>
      </fieldset>
    </StepForm>
  )
}

function ClinicStep({ data, saving, onSave }: StepProps) {
  const address = asRecord(data.fiscalAddress)
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    onSave({
      tradeName: formText(form, 'tradeName'), legalName: formText(form, 'legalName'), cnpj: formText(form, 'cnpj'),
      phone: formText(form, 'phone'), email: formText(form, 'email'), legalResponsible: formText(form, 'legalResponsible'),
      technicalResponsible: formText(form, 'technicalResponsible') || undefined, clinicType: formText(form, 'clinicType'),
      specialties: splitList(form.get('specialties')),
      fiscalAddress: addressPayload(form),
    })
  }
  return (
    <StepForm title="2. Dados da clínica" description="Registre a identidade jurídica e o endereço fiscal." saving={saving} onSubmit={submit}>
      <FieldGrid>
        <TechnicalInput name="tradeName" label="Nome fantasia" defaultValue={textValue(data, 'tradeName')} required />
        <TechnicalInput name="legalName" label="Razão social" defaultValue={textValue(data, 'legalName')} required />
        <TechnicalInput name="cnpj" label="CNPJ" defaultValue={textValue(data, 'cnpj')} required />
        <TechnicalInput name="phone" label="Telefone da clínica" type="tel" defaultValue={textValue(data, 'phone')} required />
        <TechnicalInput name="email" label="E-mail da clínica" type="email" defaultValue={textValue(data, 'email')} required />
        <TechnicalInput name="clinicType" label="Tipo de clínica" defaultValue={textValue(data, 'clinicType')} required />
        <TechnicalInput name="legalResponsible" label="Responsável legal" defaultValue={textValue(data, 'legalResponsible')} required />
        <TechnicalInput name="technicalResponsible" label="Responsável técnico (opcional)" defaultValue={textValue(data, 'technicalResponsible')} />
      </FieldGrid>
      <TechnicalInput name="specialties" label="Especialidades, separadas por vírgula" defaultValue={stringList(data, 'specialties').join(', ')} required />
      <AddressFields title="Endereço fiscal" data={address} />
    </StepForm>
  )
}

function UnitStep({ data, saving, onSave }: StepProps) {
  const address = asRecord(data.address)
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    onSave({
      name: formText(form, 'name'), phone: formText(form, 'phone'), address: addressPayload(form),
      timeZone: formText(form, 'timeZone'), internalCode: formText(form, 'internalCode') || undefined,
      rooms: splitList(form.get('rooms')),
    })
  }
  return (
    <StepForm title="3. Primeira unidade" description="Defina a unidade inicial e seu fuso operacional." saving={saving} onSubmit={submit}>
      <FieldGrid>
        <TechnicalInput name="name" label="Nome da unidade" defaultValue={textValue(data, 'name')} required />
        <TechnicalInput name="phone" label="Telefone da unidade" type="tel" defaultValue={textValue(data, 'phone')} required />
        <TechnicalInput name="timeZone" label="Fuso horário IANA" defaultValue={textValue(data, 'timeZone', 'America/Sao_Paulo')} required />
        <TechnicalInput name="internalCode" label="Código interno (opcional)" defaultValue={textValue(data, 'internalCode')} />
      </FieldGrid>
      <TechnicalInput name="rooms" label="Salas, separadas por vírgula (opcional)" defaultValue={stringList(data, 'rooms').join(', ')} />
      <AddressFields title="Endereço da unidade" data={address} />
    </StepForm>
  )
}

function OperationStep({ data, saving, onSave }: StepProps) {
  const savedDays = stringList(data, 'workingDays')
  const savedPayments = stringList(data, 'paymentMethods')
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    onSave({
      workingDays: form.getAll('workingDays').map(String), opensAt: formText(form, 'opensAt'), closesAt: formText(form, 'closesAt'),
      defaultAppointmentMinutes: formNumber(form, 'defaultAppointmentMinutes'), intervalMinutes: formNumber(form, 'intervalMinutes'),
      minimumAdvanceHours: formNumber(form, 'minimumAdvanceHours'), confirmationPolicy: formText(form, 'confirmationPolicy'),
      cancellationPolicy: formText(form, 'cancellationPolicy'), paymentMethods: form.getAll('paymentMethods').map(String),
    })
  }
  return (
    <StepForm title="4. Funcionamento básico" description="Estabeleça horários e regras iniciais da operação." saving={saving} onSubmit={submit}>
      <fieldset className={fieldsetClass}><legend className={legendClass}>Dias de funcionamento</legend><div className="grid gap-2 sm:grid-cols-4">{weekDays.map(([value, label]) => <Checkbox key={value} name="workingDays" value={value} label={label} defaultChecked={savedDays.includes(value) || (!savedDays.length && !['saturday', 'sunday'].includes(value))} />)}</div></fieldset>
      <FieldGrid>
        <TechnicalInput name="opensAt" label="Abertura" type="time" defaultValue={textValue(data, 'opensAt', '08:00')} required />
        <TechnicalInput name="closesAt" label="Fechamento" type="time" defaultValue={textValue(data, 'closesAt', '18:00')} required />
        <TechnicalInput name="defaultAppointmentMinutes" label="Duração padrão (minutos)" type="number" min="5" max="480" defaultValue={String(numberValue(data, 'defaultAppointmentMinutes', 60))} required />
        <TechnicalInput name="intervalMinutes" label="Intervalo (minutos)" type="number" min="0" max="180" defaultValue={String(numberValue(data, 'intervalMinutes', 0))} required />
        <TechnicalInput name="minimumAdvanceHours" label="Antecedência mínima (horas)" type="number" min="0" max="2160" defaultValue={String(numberValue(data, 'minimumAdvanceHours', 2))} required />
      </FieldGrid>
      <TechnicalTextarea name="confirmationPolicy" label="Política de confirmação" defaultValue={textValue(data, 'confirmationPolicy', 'Confirmar o agendamento antes do atendimento.')} required />
      <TechnicalTextarea name="cancellationPolicy" label="Política de cancelamento" defaultValue={textValue(data, 'cancellationPolicy', 'Solicitar cancelamento com antecedência.')} required />
      <fieldset className={fieldsetClass}><legend className={legendClass}>Formas de pagamento</legend><div className="grid gap-2 sm:grid-cols-3">{paymentMethods.map(([value, label]) => <Checkbox key={value} name="paymentMethods" value={value} label={label} defaultChecked={savedPayments.includes(value) || (!savedPayments.length && value === 'pix')} />)}</div></fieldset>
    </StepForm>
  )
}

function TeamStep({ data, saving, onSave }: StepProps) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    onSave({ nextAction: formText(form, 'nextAction') })
  }
  return (
    <StepForm title="5. Preparação da equipe" description="Escolha a próxima ação após a configuração dos dados." saving={saving} onSubmit={submit}>
      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>Próxima ação</legend>
        <div className="space-y-2">
          <Radio name="nextAction" value="add_reception" label="Adicionar recepção" defaultChecked={textValue(data, 'nextAction') === 'add_reception'} />
          <Radio name="nextAction" value="add_professional" label="Adicionar profissional" defaultChecked={textValue(data, 'nextAction') === 'add_professional'} />
          <Radio name="nextAction" value="later" label="Continuar depois" defaultChecked={!textValue(data, 'nextAction') || textValue(data, 'nextAction') === 'later'} />
        </div>
      </fieldset>
    </StepForm>
  )
}

function PreparationStep({ saving, onComplete, onReview }: { saving: boolean; onComplete: () => void; onReview: (step: StepNumber) => void }) {
  return (
    <div className="space-y-4">
      <div><p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Etapa 6</p><h2 className="mt-1 text-lg font-semibold text-zinc-100">Dados preparados</h2></div>
      <div className="rounded border border-blue-900/60 bg-blue-950/30 p-4 text-sm text-blue-200">As cinco etapas foram salvas. A próxima ação criará a clínica, a primeira unidade e seu vínculo de proprietária em uma única operação.</div>
      <p className="text-sm text-zinc-400">Revise os dados ou conclua a configuração. Repetir a conclusão não criará registros duplicados.</p>
      <button type="button" disabled={saving} onClick={onComplete} className={primaryButtonClass}>{saving ? 'Concluindo configuração…' : 'Criar clínica e entrar'}</button>
      <div className="flex flex-wrap gap-2">{([1, 2, 3, 4, 5] as StepNumber[]).map((step) => <button key={step} type="button" onClick={() => onReview(step)} className={secondaryButtonClass}>Revisar etapa {step}</button>)}</div>
    </div>
  )
}

type StepProps = { data: JsonRecord; saving: boolean; onSave: (payload: JsonRecord) => void }

function StepForm({ title, description, saving, onSubmit, children }: { title: string; description: string; saving: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void; children: ReactNode }) {
  return <form onSubmit={onSubmit} className="space-y-5"><div><h2 className="text-lg font-semibold text-zinc-100">{title}</h2><p className="mt-1 text-sm text-zinc-400">{description}</p></div>{children}<button type="submit" disabled={saving} className={primaryButtonClass}>{saving ? 'Salvando…' : 'Salvar e continuar'}</button></form>
}

function TechnicalPanel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="mx-auto w-full max-w-2xl space-y-4 rounded-lg border border-zinc-800 bg-zinc-900 p-5"><h1 className="text-lg font-semibold text-zinc-100">{title}</h1>{children}</section>
}

function ErrorNotice({ message }: { message: string }) {
  return <div role="alert" className="rounded border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-300">{message}</div>
}

function FieldGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>
}

type InputProps = { name: string; label: string; type?: string; required?: boolean; readOnly?: boolean; defaultValue?: string; min?: string; max?: string }
function TechnicalInput({ name, label, type = 'text', required, readOnly, defaultValue, min, max }: InputProps) {
  return <label className="block text-xs text-zinc-400"><span className="mb-1 block">{label}</span><input name={name} type={type} required={required} readOnly={readOnly} defaultValue={defaultValue} min={min} max={max} className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-400 read-only:cursor-not-allowed read-only:bg-zinc-900" /></label>
}

function TechnicalTextarea({ name, label, defaultValue, required }: { name: string; label: string; defaultValue?: string; required?: boolean }) {
  return <label className="block text-xs text-zinc-400"><span className="mb-1 block">{label}</span><textarea name={name} required={required} defaultValue={defaultValue} rows={3} className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-400" /></label>
}

function Checkbox({ name, value, label, defaultChecked, required }: { name: string; value?: string; label: string; defaultChecked?: boolean; required?: boolean }) {
  return <label className="flex items-start gap-2 rounded border border-zinc-800 bg-zinc-950/60 p-3 text-sm text-zinc-300"><input className="mt-0.5 size-4 accent-zinc-200" type="checkbox" name={name} value={value} defaultChecked={defaultChecked} required={required} /><span>{label}</span></label>
}

function Radio({ name, value, label, defaultChecked }: { name: string; value: string; label: string; defaultChecked?: boolean }) {
  return <label className="flex items-center gap-2 rounded border border-zinc-800 bg-zinc-950/60 p-3 text-sm text-zinc-300"><input className="size-4 accent-zinc-200" type="radio" name={name} value={value} defaultChecked={defaultChecked} required /><span>{label}</span></label>
}

function AddressFields({ title, data }: { title: string; data: JsonRecord }) {
  return <fieldset className={fieldsetClass}><legend className={legendClass}>{title}</legend><FieldGrid><TechnicalInput name="postalCode" label="CEP" defaultValue={textValue(data, 'postalCode')} required /><TechnicalInput name="street" label="Logradouro" defaultValue={textValue(data, 'street')} required /><TechnicalInput name="number" label="Número" defaultValue={textValue(data, 'number')} required /><TechnicalInput name="complement" label="Complemento (opcional)" defaultValue={textValue(data, 'complement')} /><TechnicalInput name="district" label="Bairro" defaultValue={textValue(data, 'district')} required /><TechnicalInput name="city" label="Cidade" defaultValue={textValue(data, 'city')} required /><TechnicalInput name="state" label="UF" defaultValue={textValue(data, 'state')} required /></FieldGrid></fieldset>
}

function addressPayload(form: FormData) {
  return { postalCode: formText(form, 'postalCode'), street: formText(form, 'street'), number: formText(form, 'number'), complement: formText(form, 'complement') || undefined, district: formText(form, 'district'), city: formText(form, 'city'), state: formText(form, 'state') }
}

const primaryButtonClass = 'rounded bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50'
const secondaryButtonClass = 'rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 transition hover:border-zinc-500 disabled:opacity-50'
const dangerButtonClass = 'rounded border border-red-800 bg-red-950/50 px-3 py-2 text-sm font-medium text-red-200 transition hover:bg-red-950 disabled:opacity-50'
const fieldsetClass = 'space-y-3 rounded border border-zinc-800 p-4'
const legendClass = 'px-1 text-xs font-medium uppercase tracking-wider text-zinc-500'
