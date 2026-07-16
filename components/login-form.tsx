'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as zod from 'zod'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react'

const loginSchema = zod.object({
  email: zod.string().email('E-mail inválido'),
  password: zod.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  remember: zod.boolean().optional(),
})

type LoginData = zod.infer<typeof loginSchema>

interface LoginFormProps {
  onLoginSuccess?: () => void
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      remember: false,
    },
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
        if (signInError.message.includes('Invalid login credentials')) {
          setError('E-mail ou senha incorretos.')
        } else {
          setError(signInError.message)
        }
      } else {
        if (onLoginSuccess) {
          onLoginSuccess()
        }
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setError('Erro interno do servidor. Tente novamente mais tarde.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative w-full min-h-screen flex flex-col justify-between p-6 md:p-12 text-white select-none overflow-x-hidden">
      {/* Overlay escura para mobile para contraste de leitura */}
      <div className="absolute inset-0 bg-black/35 md:bg-black/10 pointer-events-none z-0" />

      {/* Conteúdo Principal (Grid no Desktop, Flex-col no Mobile) */}
      <div className="relative z-10 w-full my-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch pt-4 md:pt-0">
        
        {/* Coluna Esquerda: Logo e Slogan com Linha Dourada */}
        <div className="flex flex-col justify-between items-start text-left py-2 md:py-6 min-h-[180px] md:min-h-[480px]">
          {/* Logo Oficial da DouxHub */}
          <div className="animate-fade-in duration-700">
            <img
              src="/intro/doux-logo.png"
              alt="DouxHub Logo"
              className="h-10 md:h-[48px] w-auto object-contain -ml-2"
              draggable="false"
            />
          </div>
          
          {/* Slogan */}
          <div className="mt-auto max-w-sm pt-8 md:pt-0 animate-fade-in duration-1000">
            <h2 className="text-xl md:text-2xl font-light tracking-wide leading-relaxed text-zinc-300">
              A operação da sua clínica,
              <br />
              em um <span className="font-semibold text-white">único</span> lugar.
            </h2>
            {/* Linha Dourada/Bronze Decorativa */}
            <div className="w-12 h-[2px] bg-[#c4a988] mt-4" />
          </div>
        </div>

        {/* Coluna Direita: Formulário Translúcido Premium */}
        <div className="w-full flex items-center justify-center md:justify-end animate-fade-in duration-700">
          <div className="w-full max-w-[420px] p-8 md:p-10 bg-black/35 border border-zinc-800/40 rounded-2xl backdrop-blur-md transition-all duration-300">
            {/* Cabeçalho do Formulário */}
            <div className="mb-8">
              <span className="text-xs font-light text-zinc-400 tracking-wider">
                Bem-vindo à
              </span>
              <h1 className="text-3xl font-semibold tracking-wide text-white mt-0.5">
                Doux
              </h1>
            </div>

            {error && (
              <div className="mb-6 p-3.5 bg-red-950/20 border border-red-900/40 text-red-400 rounded-lg text-xs leading-relaxed">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Campo E-mail */}
              <div className="space-y-2">
                <label className="block text-xs font-light text-zinc-400">
                  E-mail
                </label>
                <div className="relative">
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full px-4 py-3 pr-10 bg-transparent border border-zinc-800/70 rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="Digite seu e-mail"
                    disabled={loading}
                  />
                  <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-[10px] mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Campo Senha */}
              <div className="space-y-2">
                <label className="block text-xs font-light text-zinc-400">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    className="w-full px-4 py-3 pr-10 bg-transparent border border-zinc-800/70 rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="Digite sua senha"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors focus:outline-none"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4.5 h-4.5" />
                    ) : (
                      <Eye className="w-4.5 h-4.5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-[10px] mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Lembrar acesso & Esqueci minha senha */}
              <div className="flex justify-between items-center text-xs pt-1">
                <label className="flex items-center space-x-2 text-zinc-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    {...register('remember')}
                    className="w-3.5 h-3.5 rounded border-zinc-800 bg-transparent text-white focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    disabled={loading}
                  />
                  <span className="font-light">Lembrar acesso</span>
                </label>
                <Link
                  href="/recuperar"
                  className="text-zinc-300 hover:text-white transition-colors font-light underline decoration-zinc-700 underline-offset-4"
                >
                  Esqueci minha senha
                </Link>
              </div>

              {/* Botão de Entrar */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#e4e4e7] hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 font-medium rounded-lg text-sm transition-all duration-300 cursor-pointer flex justify-center items-center gap-2 group"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-zinc-800 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Entrar</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>

              {/* Divisória 'ou' */}
              <div className="relative flex items-center justify-center my-6 text-[10px] uppercase tracking-widest text-zinc-600 w-full before:absolute before:left-0 before:right-0 before:h-[1px] before:bg-zinc-800/40 before:z-0 select-none">
                <span className="px-3 bg-[#0d0d0f] md:bg-[#121215] relative z-10 rounded">ou</span>
              </div>

              {/* Mensagem de Proteção de Dados */}
              <div className="flex items-start gap-2.5 text-[10px] text-zinc-500 font-light leading-relaxed">
                <Lock className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                <span>
                  Seus dados estão protegidos com segurança de nível clínico e empresarial.
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Rodapé Centralizado */}
      <footer className="relative z-10 w-full text-center text-[10px] text-zinc-500 font-light pt-8 md:pt-0">
        <span>© {new Date().getFullYear()} DouxHub. Todos os direitos reservados.</span>
      </footer>
    </div>
  )
}
