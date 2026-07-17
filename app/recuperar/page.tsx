'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as zod from 'zod'
import { ArrowRight, CheckCircle2, Mail } from 'lucide-react'
import AuthShell, {
  authButtonClassName,
  authInputClassName,
  authLinkClassName,
} from '@/components/auth-shell'
import { createClient } from '@/lib/supabase/client'

const recuperarSchema = zod.object({
  email: zod
    .string()
    .trim()
    .min(1, 'Informe seu e-mail')
    .email('Informe um e-mail válido'),
})

type RecuperarData = zod.infer<typeof recuperarSchema>

export default function RecuperarPage() {
  const supabase = useMemo(() => createClient(), [])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecuperarData>({
    resolver: zodResolver(recuperarSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (data: RecuperarData) => {
    if (loading || success) return

    setLoading(true)
    setError(null)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        data.email,
        { redirectTo: `${window.location.origin}/redefinir` }
      )

      if (resetError) {
        setError('Não foi possível enviar o link agora. Aguarde um instante e tente novamente.')
        return
      }

      setSuccess(true)
    } catch {
      setError('Não foi possível enviar o link agora. Aguarde um instante e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Recuperar acesso"
      description="Informe seu e-mail para receber o link de redefinição de senha."
      compact
    >
      {success ? (
        <div className="space-y-6 text-center" role="status" aria-live="polite">
          <div className="flex justify-center">
            <CheckCircle2 className="w-8 h-8 text-zinc-200" aria-hidden="true" />
          </div>
          <p className="text-sm leading-relaxed text-zinc-200">
            Enviamos um link de recuperação para o seu e-mail.
          </p>
          <p className="text-xs font-light leading-relaxed text-zinc-400">
            Verifique também as pastas de spam e lixo eletrônico.
          </p>
          <Link href="/login" className={authLinkClassName}>
            Voltar para o login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {error && (
            <div
              className="p-3 bg-red-950/25 border border-red-900/40 text-red-300 rounded-lg text-xs leading-relaxed"
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="recovery-email" className="block text-xs font-light text-zinc-300">
              E-mail
            </label>
            <div className="relative">
              <input
                id="recovery-email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className={authInputClassName}
                placeholder="Digite seu e-mail"
                disabled={loading}
                aria-invalid={Boolean(errors.email)}
              />
              <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-600 pointer-events-none" />
            </div>
            {errors.email && (
              <p className="text-red-400 text-[10px] mt-1" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          <button type="submit" disabled={loading} className={authButtonClassName}>
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-zinc-800 border-t-transparent rounded-full animate-spin" />
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <span>Enviar link</span>
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
