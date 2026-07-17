import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Handler para callback de autenticação do Supabase.
 * Processa tokens de verificação de email, password reset, etc.
 * 
 * Fluxo esperado:
 * - Signup: /auth/callback?code=xxx&type=signup → redireciona para /login
 * - Password Reset: /auth/callback?code=xxx&type=recovery → redireciona para /redefinir
 * - Email Change: /auth/callback?code=xxx&type=email_change → redireciona para /login
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

  const supabase = await createClient()

  try {
    // Processar o código com o Supabase
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Auth callback error:', exchangeError)
      const redirectUrl = new URL('/login', request.nextUrl.origin)
      redirectUrl.searchParams.set('error', 'invalid_code')
      return NextResponse.redirect(redirectUrl)
    }

    // Determinar para onde redirecionar com base no tipo
    let redirectPath = '/login'

    if (type === 'recovery' || type === 'password_recovery') {
      redirectPath = '/redefinir'
    } else if (type === 'email_change') {
      redirectPath = '/login'
    } else if (type === 'signup') {
      redirectPath = '/login'
    }

    const redirectUrl = new URL(redirectPath, request.nextUrl.origin)
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('Unexpected auth callback error:', error)
    return NextResponse.redirect(new URL('/login', request.nextUrl.origin))
  }
}
