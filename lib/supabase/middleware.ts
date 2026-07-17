import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { ACTIVE_MEMBERSHIP_COOKIE } from '@/lib/clinic-context'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Rotas públicas acessíveis sem autenticação.
 * Qualquer rota não listada aqui requer sessão válida.
 */
const PUBLIC_PATHS = new Set([
  '/',
  '/login',
  '/cadastro',
  '/recuperar',
  '/redefinir',
  '/primeiro-acesso',
])

/**
 * Prefixos públicos (e.g. /auth/callback?code=...)
 */
const PUBLIC_PREFIXES = ['/auth/']

/**
 * Rotas de contexto: já são protegidas (requerem sessão),
 * mas não requerem um contexto ativo para serem acessadas.
 */
const CONTEXT_PATHS = [
  '/selecionar-perfil',
  '/sem-clinica',
  '/configurar-clinica',
  '/administracao-clinica',
]

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

function isContextPath(pathname: string): boolean {
  return CONTEXT_PATHS.some((p) => pathname.startsWith(p))
}

function isAuthOnlyPath(pathname: string): boolean {
  return (
    pathname.startsWith('/login') ||
    pathname.startsWith('/cadastro') ||
    pathname.startsWith('/recuperar')
  )
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const pathname = request.nextUrl.pathname

  // Sem variáveis de ambiente — deixar passar sem crash
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  /**
   * IMPORTANTE: não executar lógica entre createServerClient e getUser().
   * Conforme documentação oficial do @supabase/ssr.
   */
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const publicPath = isPublic(pathname)
  const contextPath = isContextPath(pathname)
  const authOnlyPath = isAuthOnlyPath(pathname)

  // 1. Sem sessão acessando rota protegida → redireciona para /login
  if (!user && !publicPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // 2. Com sessão acessando rota só-pública (login/cadastro/recuperar) → redireciona
  if (user && authOnlyPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/selecionar-perfil'
    return NextResponse.redirect(url)
  }

  // 3. Com sessão, rota protegida não-contextual e sem contexto ativo → /selecionar-perfil
  const hasActiveContext = Boolean(
    request.cookies.get(ACTIVE_MEMBERSHIP_COOKIE)?.value
  )

  if (user && !publicPath && !contextPath && !hasActiveContext) {
    const url = request.nextUrl.clone()
    url.pathname = '/selecionar-perfil'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
