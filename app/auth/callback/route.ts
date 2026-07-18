import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Handler para callback de autenticação do Supabase.
 * Processa tokens de verificação de email, password reset, etc.
 *
 * Fluxo esperado:
 * - Signup: /auth/callback?code=xxx&type=signup → redireciona para /login
 * - Password Reset: /auth/callback?code=xxx&type=recovery → redireciona para /redefinir
 * - Email Change: /auth/callback?code=xxx&type=email_change → redireciona para /login
 *
 * IMPORTANTE: o response de redirect deve incluir os cookies de sessão
 * escritos pelo exchangeCodeForSession, senão o browser não fica autenticado.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Tratar erros explícitos
  if (error) {
    const redirectUrl = new URL('/login', request.nextUrl.origin)
    redirectUrl.searchParams.set('error', error)
    if (errorDescription) {
      redirectUrl.searchParams.set('error_description', errorDescription)
    }
    return NextResponse.redirect(redirectUrl)
  }

  // Se não há código, redirecionar para login
  if (!code) {
    return NextResponse.redirect(new URL('/login', request.nextUrl.origin))
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const cookieStore = await cookies()

  /**
   * Determinar destino antes de criar o response.
   */
  let redirectPath = '/login'
  if (type === 'recovery' || type === 'password_recovery') {
    redirectPath = '/redefinir'
  }

  const redirectUrl = new URL(redirectPath, request.nextUrl.origin)
  // flag para middleware não redirecionar
  redirectUrl.searchParams.set('fromAuth', 'true')

  /**
   * Criar o response de redirect PRIMEIRO, depois escrever os cookies
   * de sessão nele diretamente — isso garante que o browser receba os
   * cookies Set-Cookie junto com o redirect 302.
   */
  const response = NextResponse.redirect(redirectUrl)

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          // Escrever nos cookies do response (não do cookieStore)
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    })

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('[auth/callback] exchangeCodeForSession error:', exchangeError.message)
      const errorUrl = new URL('/login', request.nextUrl.origin)
      errorUrl.searchParams.set('error', 'invalid_code')
      return NextResponse.redirect(errorUrl)
    }

    return response
  } catch (err) {
    console.error('[auth/callback] Unexpected error:', err)
    return NextResponse.redirect(new URL('/login', request.nextUrl.origin))
  }
}
