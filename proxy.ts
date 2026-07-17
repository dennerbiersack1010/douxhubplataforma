import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Proxy de autenticação — convenção do Next.js 16 (proxy.ts).
 *
 * Este arquivo é o ponto de entrada do interceptador de requisições.
 * A lógica de proteção de rotas está em lib/supabase/middleware.ts.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - public assets (images, videos, fonts)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|woff|woff2|ttf|otf|ico)$).*)',
  ],
}
