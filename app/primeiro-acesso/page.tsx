'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useForm, type UseFormRegisterReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as zod from 'zod'
import { ArrowRight, CheckCircle2, Eye, EyeOff, Mail, UserRound } from 'lucide-react'
import AuthShell, { authButtonClassName, authInputClassName, authLinkClassName } from '@/components/auth-shell'
import { createClient } from '@/lib/supabase/client'

const primeiroAcessoSchema = zod.object({
  name: zod.string().trim().min(2, 'Informe seu nome'),
  email: zod.string().email('E-mail inválido'),
  password: zod.string().min(1, 'Informe a nova senha').min(6, 'Use pelo menos 6 caracteres'),
  confirmPassword: zod.string().min(1, 'Confirme a nova senha').min(6, 'Use pelo menos 6 caracteres'),
  terms: zod.boolean().refine((value) => value, 'É necessário aceitar os termos'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas devem ser iguais',
  path: ['confirmPassword'],
})

type PrimeiroAcessoData = zod.infer<typeof primeiroAcessoSchema>
type InviteState = 'checking' | 'valid' | 'invalid' | 'expired'

function isExpiredMessage(message: string) {
  return /expired|otp_expired|expirado/i.test(message)
}

export default function PrimeiroAcessoPage() {
  const supabase = useMemo(() => createClient(), [])
  const initialized = useRef(false)
  const [inviteState, setInviteState] = useState<InviteState>('checking')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [invitationToken, setInvitationToken] = useState<string | null>(null)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<PrimeiroAcessoData>({
    resolver: zodResolver(primeiroAcessoSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '', terms: false },
  })

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    let active = true

    async function validateInvitation() {
      const query = new URLSearchParams(window.location.search)
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const authError = query.get('error_description') || query.get('error_code') || hash.get('error_description') || hash.get('error_code') || ''

      if (authError) {
        if (active) setInviteState(isExpiredMessage(authError) ? 'expired' : 'invalid')
        return
      }

      const code = query.get('code')
      const clinicInvitationToken = query.get('invitation')
      const tokenHash = query.get('token_hash')
      const type = query.get('type') || hash.get('type')
      const accessToken = hash.get('access_token')
      const refreshToken = hash.get('refresh_token')
      const hasInvitationEvidence = Boolean(
        clinicInvitationToken &&
        (code || (tokenHash && type === 'invite') || (accessToken && refreshToken && type === 'invite'))
      )

      if (!hasInvitationEvidence) {
        if (active) setInviteState('invalid')
        return
      }

      setInvitationToken(clinicInvitationToken)

      let authFlowError: string | null = null
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        authFlowError = exchangeError?.message ?? null
      } else if (tokenHash && type === 'invite') {
        const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'invite' })
        authFlowError = verifyError?.message ?? null
      } else if (accessToken && refreshToken && type === 'invite') {
        const { error: sessionError } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        authFlowError = sessionError?.message ?? null
      }

      window.history.replaceState({}, '', '/primeiro-acesso')
      if (authFlowError) {
        if (active) setInviteState(isExpiredMessage(authFlowError) ? 'expired' : 'invalid')
        return
      }

      const { data, error: userError } = await supabase.auth.getUser()
      if (!active) return
      if (userError || !data.user?.email) {
        setInviteState('invalid')
        return
      }

      setValue('email', data.user.email, { shouldValidate: true })
      setValue('name', data.user.user_metadata?.full_name || data.user.user_metadata?.name || '')
      setInviteState('valid')
    }

    void validateInvitation()
    return () => { active = false }
  }, [setValue, supabase])

  const onSubmit = async (data: PrimeiroAcessoData) => {
    if (loading || success || inviteState !== 'valid' || !invitationToken) return
    setLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password,
        data: { full_name: data.name.trim(), terms_accepted_at: new Date().toISOString() },
      })

      if (updateError) {
        if (isExpiredMessage(updateError.message)) setInviteState('expired')
        else setError('Não foi possível concluir seu acesso. Tente novamente.')
        return
      }

      const { error: acceptanceError } = await supabase.rpc('accept_clinic_invitation', {
        p_token: invitationToken,
      })

      if (acceptanceError) {
        if (isExpiredMessage(acceptanceError.message)) setInviteState('expired')
        else setError('Não foi possível validar o vínculo deste convite. Solicite um novo convite à clínica.')
        return
      }

      await supabase.auth.signOut({ scope: 'local' })
      setSuccess(true)
    } catch {
      setError('Não foi possível concluir seu acesso. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Primeiro acesso" description="Confirme seus dados e crie uma senha para concluir seu acesso à DouxHub.">
      {inviteState === 'checking' && <StatusLoading text="Validando seu convite..." />}

      {(inviteState === 'invalid' || inviteState === 'expired') && (
        <div className="space-y-6 text-center" role="alert">
          <p className="text-sm leading-relaxed text-zinc-200">
            {inviteState === 'expired' ? 'Este convite expirou. Solicite um novo convite à clínica.' : 'Este convite é inválido ou já foi utilizado.'}
          </p>
          <Link href="/login" className={authLinkClassName}>Voltar para o login</Link>
        </div>
      )}

      {inviteState === 'valid' && success && (
        <div className="space-y-5 text-center" role="status" aria-live="polite">
          <div className="flex justify-center"><CheckCircle2 className="w-8 h-8 text-zinc-200" /></div>
          <p className="text-sm leading-relaxed text-zinc-200">Seu primeiro acesso foi concluído.</p>
          <Link href="/login" className={authButtonClassName}>Ir para o login <ArrowRight className="w-4 h-4" /></Link>
        </div>
      )}

      {inviteState === 'valid' && !success && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>
          {error && <AlertMessage>{error}</AlertMessage>}

          <TextField id="invite-name" label="Nome" type="text" placeholder="Digite seu nome" disabled={loading} error={errors.name?.message} inputProps={register('name')} icon={<UserRound className="w-4.5 h-4.5" />} autoComplete="name" />
          <TextField id="invite-email" label="E-mail" type="email" placeholder="E-mail do convite" disabled readOnly error={errors.email?.message} inputProps={register('email')} icon={<Mail className="w-4.5 h-4.5" />} autoComplete="email" />
          <PasswordField id="invite-password" label="Nova senha" visible={showPassword} onToggle={() => setShowPassword((value) => !value)} disabled={loading} error={errors.password?.message} inputProps={register('password')} />
          <PasswordField id="invite-confirm-password" label="Confirmar senha" visible={showConfirmation} onToggle={() => setShowConfirmation((value) => !value)} disabled={loading} error={errors.confirmPassword?.message} inputProps={register('confirmPassword')} />

          <p className="text-[10px] font-light leading-relaxed text-zinc-400">A senha deve ter pelo menos 6 caracteres.</p>

          <div>
            <label className="flex items-start gap-2.5 text-xs text-zinc-300 cursor-pointer">
              <input type="checkbox" {...register('terms')} disabled={loading} className="mt-0.5 w-3.5 h-3.5 rounded border-zinc-600 bg-transparent text-white focus:ring-0 focus:ring-offset-0" />
              <span className="font-light leading-relaxed">Li e aceito os termos de uso e a política de privacidade.</span>
            </label>
            {errors.terms && <p className="text-red-400 text-[10px] mt-1" role="alert">{errors.terms.message}</p>}
          </div>

          <button type="submit" disabled={loading} className={authButtonClassName}>
            {loading ? <><Spinner dark /><span>Concluindo...</span></> : <><span>Concluir acesso</span><ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" /></>}
          </button>
        </form>
      )}
    </AuthShell>
  )
}

function StatusLoading({ text }: { text: string }) {
  return <div className="flex flex-col items-center gap-4 text-center" role="status"><Spinner /><p className="text-xs font-light text-zinc-300">{text}</p></div>
}

function Spinner({ dark = false }: { dark?: boolean }) {
  return <span className={`w-5 h-5 border-2 ${dark ? 'border-zinc-800' : 'border-zinc-300'} border-t-transparent rounded-full animate-spin`} />
}

function AlertMessage({ children }: { children: ReactNode }) {
  return <div className="p-3 bg-red-950/25 border border-red-900/40 text-red-300 rounded-lg text-xs leading-relaxed" role="alert">{children}</div>
}

interface TextFieldProps {
  id: string; label: string; type: 'text' | 'email'; placeholder: string; disabled: boolean; readOnly?: boolean; error?: string; inputProps: UseFormRegisterReturn; icon: ReactNode; autoComplete: string
}

function TextField({ id, label, type, placeholder, disabled, readOnly, error, inputProps, icon, autoComplete }: TextFieldProps) {
  return <div className="space-y-1.5">
    <label htmlFor={id} className="block text-xs font-light text-zinc-300">{label}</label>
    <div className="relative">
      <input id={id} type={type} {...inputProps} className={authInputClassName} placeholder={placeholder} disabled={disabled} readOnly={readOnly} autoComplete={autoComplete} aria-invalid={Boolean(error)} />
      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none">{icon}</span>
    </div>
    {error && <p className="text-red-400 text-[10px] mt-1" role="alert">{error}</p>}
  </div>
}

interface PasswordFieldProps { id: string; label: string; visible: boolean; onToggle: () => void; disabled: boolean; error?: string; inputProps: UseFormRegisterReturn }

function PasswordField({ id, label, visible, onToggle, disabled, error, inputProps }: PasswordFieldProps) {
  return <div className="space-y-1.5">
    <label htmlFor={id} className="block text-xs font-light text-zinc-300">{label}</label>
    <div className="relative">
      <input id={id} type={visible ? 'text' : 'password'} autoComplete="new-password" {...inputProps} className={authInputClassName} placeholder={label === 'Nova senha' ? 'Digite a nova senha' : 'Digite a senha novamente'} disabled={disabled} aria-invalid={Boolean(error)} />
      <button type="button" onClick={onToggle} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-800 transition-colors focus:outline-none" disabled={disabled} aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}>
        {visible ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
      </button>
    </div>
    {error && <p className="text-red-400 text-[10px] mt-1" role="alert">{error}</p>}
  </div>
}
