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
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('E-mail ainda não confirmado. Verifique sua caixa de entrada.')
        } else {
          setError(signInError.message)
        }
        return
      }

      if (onLoginSuccess) {
        onLoginSuccess()
      }

      const contextResponse = await fetch('/api/auth/post-login', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
      })

      const contentType = contextResponse.headers.get('content-type') ?? ''

      // Resposta não é JSON: provavelmente recebemos HTML (redirect do middleware)
      if (!contentType.includes('application/json')) {
        console.error('[login] post-login retornou não-JSON:', {
          status: contextResponse.status,
          contentType,
          url: contextResponse.url,
        })
        setError('Erro interno ao processar login. Tente novamente.')
        return
      }

      if (!contextResponse.ok) {
        let errorMessage = 'Não foi possível carregar seus vínculos de acesso. Tente novamente.'
        try {
          const errorData = await contextResponse.json() as { error?: string }
          if (errorData.error === 'unauthorized') {
            errorMessage = 'Sua sessão expirou. Faça login novamente.'
          } else if (errorData.error === 'membership_resolution_failed') {
            errorMessage = 'Erro ao verificar seus acessos. Contate o suporte se o problema persistir.'
          }
        } catch {
          // ignorar erro ao parsear JSON
        }
        setError(errorMessage)
        return
      }

      const context = await contextResponse.json() as { redirectTo?: string }
      router.push(context.redirectTo || '/configurar-clinica')
      router.refresh()
    } catch (error) {
      console.error('[login] erro inesperado:', error)
      setError('Erro ao conectar com o servidor. Verifique sua conexão e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative w-full h-screen max-h-screen flex flex-col justify-between p-6 md:p-14 text-white select-none overflow-hidden font-sans">
      {/* Background Image */}
      <img
        src="/intro/doux-background-login.png"
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover z-[-2]"
        draggable="false"
      />

      {/* A foto permanece clara; degradês amplos preservam a leitura sem criar manchas. */}
      <div className="absolute inset-0 bg-black/[0.06] pointer-events-none z-[-1]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.38)_0%,rgba(0,0,0,0.18)_30%,rgba(0,0,0,0.04)_58%,rgba(0,0,0,0.08)_100%)] pointer-events-none z-[-1]" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/25 to-transparent pointer-events-none z-[-1]" />

      {/* Conteúdo Principal da Interface */}
      <div className="relative z-10 w-full my-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-full max-h-[620px] md:max-h-[580px]">
        
        {/* Lado Esquerdo: Logo no topo, Slogan na base */}
        <div className="flex flex-col justify-between items-start text-left h-full py-4 min-h-[160px] md:min-h-[480px]">
          {/* Logo DouxHub */}
          <div className="animate-fade-in duration-700">
            <img
              src="/intro/doux-logo.png"
              alt="DouxHub"
              className="w-[210px] h-[52px] md:w-[260px] md:h-[64px] object-cover object-[center_49%] -ml-7 md:-ml-[35px]"
              draggable="false"
            />
          </div>
          
          {/* Slogan */}
          <div className="mt-auto max-w-sm pt-6 md:pt-0 animate-fade-in duration-1000">
            <h2 className="text-xl md:text-[25px] font-light tracking-wide leading-relaxed text-zinc-300">
              A operação da sua clínica,
              <br />
              em um <span className="font-semibold text-white">único</span> lugar.
            </h2>
            {/* Linha horizontal dourada/bronze abaixo do texto */}
            <div className="w-12 h-[2px] bg-[#c4a988] mt-4" />
          </div>
        </div>

        {/* Lado Direito: Card de Login Translúcido */}
        <div className="w-full h-full flex items-center justify-center md:justify-end">
          <div className="w-full max-w-[420px] h-full max-h-[500px] md:max-h-[520px] p-8 md:p-10 bg-black/35 border border-zinc-800/40 rounded-3xl backdrop-blur-md flex flex-col justify-between transition-all duration-300 animate-fade-in duration-700">
            
            {/* Cabeçalho */}
            <div>
              <span className="text-zinc-300 font-light text-[13px] tracking-wide block">
                Bem-vindo à
              </span>
              <h1 className="text-[34px] font-semibold tracking-wide text-white leading-tight">
                Doux
              </h1>
            </div>

            {/* Mensagem de Erro */}
            {error && (
              <div className="my-2 p-3 bg-red-950/20 border border-red-900/40 text-red-400 rounded-lg text-xs leading-relaxed">
                {error}
              </div>
            )}

            {/* Formulário */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 flex-grow flex flex-col justify-center">
              {/* Campo E-mail */}
              <div className="space-y-1.5">
                <label className="block text-xs font-light text-zinc-300">
                  E-mail
                </label>
                <div className="relative">
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full px-4 py-3 pr-10 bg-white/90 border border-white/70 rounded-lg text-sm text-zinc-900 placeholder-zinc-500 focus:outline-none focus:border-white focus:bg-white transition-colors"
                    placeholder="Digite seu e-mail"
                    disabled={loading}
                  />
                  <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-600 pointer-events-none" />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-[10px] mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Campo Senha */}
              <div className="space-y-1.5">
                <label className="block text-xs font-light text-zinc-300">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    className="w-full px-4 py-3 pr-10 bg-white/90 border border-white/70 rounded-lg text-sm text-zinc-900 placeholder-zinc-500 focus:outline-none focus:border-white focus:bg-white transition-colors"
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
                <label className="flex items-center space-x-2 text-zinc-300 cursor-pointer select-none">
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
                    className="text-zinc-300 hover:text-white transition-colors font-light underline decoration-zinc-400/70 decoration-[1px] underline-offset-4"
                >
                  Esqueci minha senha
                </Link>
              </div>

              {/* Botão Entrar */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#e4e4e7] hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 font-medium rounded-lg text-sm transition-all duration-300 cursor-pointer flex justify-center items-center gap-2 group mt-2"
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

              {/* Ação secundária para quem ainda não possui acesso */}
              <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-zinc-300">
                <span className="font-light">Ainda não tem uma conta?</span>
                <Link
                  href="/cadastro"
                  className="rounded-md border border-white/25 px-2.5 py-1 font-medium text-white transition-colors hover:border-white/45 hover:bg-white/10"
                >
                  Criar minha conta
                </Link>
              </div>
            </form>

            {/* Proteção de Dados */}
            <div className="flex items-start gap-2.5 text-[10px] text-zinc-300 font-light leading-relaxed mt-4">
              <Lock className="w-4.5 h-4.5 text-zinc-400 shrink-0 mt-0.5" />
              <span>
                Seus dados estão protegidos com segurança de nível clínico e empresarial.
              </span>
            </div>

          </div>
        </div>
      </div>

      {/* Rodapé da Página na base absoluta */}
      <footer className="absolute bottom-6 left-0 right-0 text-center z-10 w-full text-[10px] text-zinc-300 font-light">
        <span>© {new Date().getFullYear()} DouxHub. Todos os direitos reservados.</span>
      </footer>
    </div>
  )
}
