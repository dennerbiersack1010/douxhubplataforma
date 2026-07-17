'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as zod from 'zod'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowRight, Eye, EyeOff, Lock, Mail, UserRound } from 'lucide-react'
import AuthShell, {
  authButtonClassName,
  authInputClassName,
  authLinkClassName,
} from '@/components/auth-shell'

const cadastroSchema = zod.object({
  fullName: zod.string().min(2, 'Nome completo deve ter pelo menos 2 caracteres'),
  email: zod.string().email('E-mail inválido'),
  password: zod.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
})

type CadastroData = zod.infer<typeof cadastroSchema>

export default function CadastroPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CadastroData>({
    resolver: zodResolver(cadastroSchema),
  })

  const onSubmit = async (data: CadastroData) => {
    setLoading(true)
    setError(null)
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
        },
      })

      if (signUpError) {
        const isNetworkError = /failed to fetch|fetch failed|network/i.test(signUpError.message)
        setError(
          isNetworkError
            ? 'Não foi possível conectar ao serviço de cadastro. Tente novamente em instantes.'
            : signUpError.message
        )
      } else {
        setSuccess(true)
      }
    } catch (error) {
      console.error('Signup error:', error)
      setError('Erro ao conectar com o servidor. Verifique sua conexão e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Criar conta"
      description="Cadastre seus dados para começar a usar a DouxHub."
    >
      {error && (
        <div className="mb-4 rounded-lg border border-red-900/40 bg-red-950/20 p-3 text-xs leading-relaxed text-red-400">
          {error}
        </div>
      )}

      {success ? (
        <div className="space-y-5 text-center">
          <div className="rounded-lg border border-emerald-800/50 bg-emerald-950/25 p-4 text-sm leading-relaxed text-emerald-300">
            Cadastro realizado com sucesso. Verifique seu e-mail para confirmar a conta.
          </div>
          <Link href="/login" className={authButtonClassName}>
            <span>Ir para o Login</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-light text-zinc-300">Nome completo</label>
              <div className="relative">
                <input
                  type="text"
                  {...register('fullName')}
                  className={authInputClassName}
                  placeholder="Digite seu nome completo"
                  disabled={loading}
                />
                <UserRound className="pointer-events-none absolute right-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-zinc-600" />
              </div>
              {errors.fullName && (
                <p className="mt-1 text-[10px] text-red-400">{errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-light text-zinc-300">E-mail</label>
              <div className="relative">
                <input
                  type="email"
                  {...register('email')}
                  className={authInputClassName}
                  placeholder="Digite seu e-mail"
                  disabled={loading}
                />
                <Mail className="pointer-events-none absolute right-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-zinc-600" />
              </div>
              {errors.email && (
                <p className="mt-1 text-[10px] text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-light text-zinc-300">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className={authInputClassName}
                  placeholder="Crie uma senha"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 transition-colors hover:text-zinc-900 focus:outline-none"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-[10px] text-red-400">{errors.password.message}</p>
              )}
            </div>

            <button type="submit" disabled={loading} className={authButtonClassName}>
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-800 border-t-transparent" />
              ) : (
                <>
                  <span>Criar minha conta</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 text-center text-xs text-zinc-300">
            <span className="font-light">Já tem uma conta? </span>
            <Link href="/login" className={authLinkClassName}>Entrar</Link>
          </div>

          <div className="mt-5 flex items-start gap-2.5 text-[10px] font-light leading-relaxed text-zinc-300">
            <Lock className="mt-0.5 h-4.5 w-4.5 shrink-0 text-zinc-400" />
            <span>Seus dados estão protegidos com segurança de nível clínico e empresarial.</span>
          </div>
        </>
      )}
    </AuthShell>
  )
}
