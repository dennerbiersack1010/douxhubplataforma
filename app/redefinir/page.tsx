'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm, type UseFormRegisterReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as zod from 'zod'
import { ArrowRight, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import AuthShell, {
  authButtonClassName,
  authInputClassName,
  authLinkClassName,
} from '@/components/auth-shell'
import { createClient } from '@/lib/supabase/client'

const redefinirSchema = zod
  .object({
    password: zod.string().min(1, 'Informe a nova senha').min(6, 'Use pelo menos 6 caracteres'),
    confirmPassword: zod
      .string()
      .min(1, 'Confirme a nova senha')
      .min(6, 'Use pelo menos 6 caracteres'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas devem ser iguais',
    path: ['confirmPassword'],
  })

type RedefinirData = zod.infer<typeof redefinirSchema>
type TokenState = 'checking' | 'valid' | 'invalid' | 'expired'

function isExpiredMessage(message: string) {
  return /expired|otp_expired|expirado/i.test(message)
}

export default function RedefinirPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const initialized = useRef(false)
  const [tokenState, setTokenState] = useState<TokenState>('checking')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RedefinirData>({
    resolver: zodResolver(redefinirSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    let active = true

    async function validateRecoverySession() {
      const query = new URLSearchParams(window.location.search)
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const authError =
        query.get('error_description') ||
        query.get('error_code') ||
        hash.get('error_description') ||
        hash.get('error_code') ||
        ''

      if (authError) {
        if (active) setTokenState(isExpiredMessage(authError) ? 'expired' : 'invalid')
        return
      }

      const code = query.get('code')
      const tokenHash = query.get('token_hash')
      const type = query.get('type') || hash.get('type')
      const accessToken = hash.get('access_token')
      const refreshToken = hash.get('refresh_token')
      const hasRecoveryEvidence = Boolean(
        code ||
        (tokenHash && type === 'recovery') ||
        (accessToken && refreshToken && type === 'recovery')
      )

      if (!hasRecoveryEvidence) {
        if (active) setTokenState('invalid')
        return
      }

      let authFlowError: string | null = null
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        authFlowError = exchangeError?.message ?? null
      } else if (tokenHash && type === 'recovery') {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery',
        })
        authFlowError = verifyError?.message ?? null
      } else if (accessToken && refreshToken && type === 'recovery') {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        authFlowError = sessionError?.message ?? null
      }

      window.history.replaceState({}, '', '/redefinir')

      if (authFlowError) {
        if (active) setTokenState(isExpiredMessage(authFlowError) ? 'expired' : 'invalid')
        return
      }

      const { data, error: userError } = await supabase.auth.getUser()
      if (!active) return

      if (userError || !data.user) {
        setTokenState('invalid')
        return
      }

      setTokenState('valid')
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return
      if (event === 'PASSWORD_RECOVERY' && session?.user) setTokenState('valid')
    })

    void validateRecoverySession()

    return () => {
      active = false
      authListener.subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    if (!success) return

    const timeout = window.setTimeout(async () => {
      await supabase.auth.signOut({ scope: 'local' })
      router.replace('/login')
      router.refresh()
    }, 1800)

    return () => window.clearTimeout(timeout)
  }, [router, success, supabase])

  const onSubmit = async (data: RedefinirData) => {
    if (loading || success || tokenState !== 'valid') return

    setLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password,
      })

      if (updateError) {
        if (isExpiredMessage(updateError.message)) {
          setTokenState('expired')
        } else {
          setError('Não foi possível salvar a nova senha. Tente novamente.')
        }
        return
      }

      setSuccess(true)
    } catch {
      setError('Não foi possível salvar a nova senha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Criar nova senha" compact>
      {tokenState === 'checking' && (
        <div className="flex flex-col items-center gap-4 text-center" role="status">
          <span className="w-6 h-6 border-2 border-zinc-300 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-light text-zinc-300">Validando seu link...</p>
        </div>
      )}

      {(tokenState === 'invalid' || tokenState === 'expired') && (
        <div className="space-y-6 text-center" role="alert">
          <p className="text-sm leading-relaxed text-zinc-200">
            {tokenState === 'expired'
              ? 'Este link de redefinição expirou. Solicite um novo link para continuar.'
              : 'Este link de redefinição é inválido ou já foi utilizado.'}
          </p>
          <div className="flex flex-col gap-3 text-xs">
            <Link href="/recuperar" className={authButtonClassName}>
              Solicitar novo link
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className={authLinkClassName}>
              Voltar para o login
            </Link>
          </div>
        </div>
      )}

      {tokenState === 'valid' && success && (
        <div className="space-y-5 text-center" role="status" aria-live="polite">
          <div className="flex justify-center">
            <CheckCircle2 className="w-8 h-8 text-zinc-200" aria-hidden="true" />
          </div>
          <p className="text-sm leading-relaxed text-zinc-200">
            Sua senha foi alterada com sucesso.
          </p>
          <p className="text-xs font-light text-zinc-400">Redirecionando para o login...</p>
        </div>
      )}

      {tokenState === 'valid' && !success && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {error && (
            <div
              className="p-3 bg-red-950/25 border border-red-900/40 text-red-300 rounded-lg text-xs leading-relaxed"
              role="alert"
            >
              {error}
            </div>
          )}

          <PasswordField
            id="new-password"
            label="Nova senha"
            placeholder="Digite a nova senha"
            visible={showPassword}
            onToggle={() => setShowPassword((value) => !value)}
            disabled={loading}
            error={errors.password?.message}
            inputProps={register('password')}
          />

          <PasswordField
            id="confirm-new-password"
            label="Confirmar nova senha"
            placeholder="Digite a senha novamente"
            visible={showConfirmation}
            onToggle={() => setShowConfirmation((value) => !value)}
            disabled={loading}
            error={errors.confirmPassword?.message}
            inputProps={register('confirmPassword')}
          />

          <p className="text-[10px] font-light leading-relaxed text-zinc-400">
            A senha deve ter pelo menos 6 caracteres.
          </p>

          <button type="submit" disabled={loading} className={authButtonClassName}>
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-zinc-800 border-t-transparent rounded-full animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <span>Salvar nova senha</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>

          <div className="text-center text-xs pt-1">
            <Link href="/login" className={authLinkClassName}>
              Voltar para o login
            </Link>
          </div>
        </form>
      )}
    </AuthShell>
  )
}

interface PasswordFieldProps {
  id: string
  label: string
  placeholder: string
  visible: boolean
  onToggle: () => void
  disabled: boolean
  error?: string
  inputProps: UseFormRegisterReturn
}

function PasswordField({
  id,
  label,
  placeholder,
  visible,
  onToggle,
  disabled,
  error,
  inputProps,
}: PasswordFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-light text-zinc-300">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete="new-password"
          {...inputProps}
          className={authInputClassName}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={Boolean(error)}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-800 transition-colors focus:outline-none"
          disabled={disabled}
          aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
        >
          {visible ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
        </button>
      </div>
      {error && (
        <p className="text-red-400 text-[10px] mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
