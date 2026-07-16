'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as zod from 'zod'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const loginSchema = zod.object({
  email: zod.string().email('E-mail inválido'),
  password: zod.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
})

type LoginData = zod.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginData) => {
    setLoading(true)
    setError(null)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (signInError) {
        setError(signInError.message)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      setError('Erro interno do servidor. Tente novamente mais tarde.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white p-4">
      <div className="w-full max-w-md p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
        {/* Banner técnico temporário */}
        <div className="mb-6 p-3 bg-yellow-950/40 border border-yellow-800 text-yellow-500 rounded text-xs text-center">
          ⚠️ <strong>TEMPLATE VISUAL TEMPORÁRIO</strong><br />
          Esta tela possui apenas estrutura técnica funcional de autenticação.
          Será substituída pelo layout oficial após aprovação do design.
        </div>

        <h1 className="text-2xl font-bold text-center mb-6">Entrar no DouxHub</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-800 text-red-400 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">E-mail</label>
            <input
              type="email"
              {...register('email')}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded focus:outline-none focus:border-violet-500 text-white text-sm"
              placeholder="seuemail@exemplo.com"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Senha</label>
            <input
              type="password"
              {...register('password')}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded focus:outline-none focus:border-violet-500 text-white text-sm"
              placeholder="••••••"
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-800 disabled:opacity-50 text-white rounded font-medium text-sm transition-colors"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 flex flex-col space-y-2 text-center text-xs text-zinc-400">
          <Link href="/cadastro" className="hover:text-white transition-colors">
            Não tem uma conta? Cadastre-se
          </Link>
          <Link href="/recuperar" className="hover:text-white transition-colors">
            Esqueceu sua senha? Recuperar
          </Link>
        </div>
      </div>
    </div>
  )
}
