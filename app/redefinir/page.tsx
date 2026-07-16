'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as zod from 'zod'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const redefinirSchema = zod.object({
  password: zod.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  confirmPassword: zod.string().min(6, 'A confirmação de senha deve ter pelo menos 6 caracteres'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})

type RedefinirData = zod.infer<typeof redefinirSchema>

export default function RedefinirPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RedefinirData>({
    resolver: zodResolver(redefinirSchema),
  })

  const onSubmit = async (data: RedefinirData) => {
    setLoading(true)
    setError(null)
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password,
      })

      if (updateError) {
        setError(updateError.message)
      } else {
        setSuccess(true)
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

        <h1 className="text-2xl font-bold text-center mb-6">Nova Senha</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-800 text-red-400 rounded text-sm">
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center space-y-4">
            <div className="p-3 bg-green-950/40 border border-green-800 text-green-400 rounded text-sm">
              Sua senha foi redefinida com sucesso!
            </div>
            <Link href="/login" className="inline-block px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded text-sm font-medium transition-colors">
              Ir para o Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Nova Senha</label>
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

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Confirmar Senha</label>
              <input
                type="password"
                {...register('confirmPassword')}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded focus:outline-none focus:border-violet-500 text-white text-sm"
                placeholder="••••••"
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-800 disabled:opacity-50 text-white rounded font-medium text-sm transition-colors"
            >
              {loading ? 'Redefinindo...' : 'Atualizar senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
