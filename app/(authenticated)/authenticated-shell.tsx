'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Target,
  Activity,
  DollarSign,
  Package,
  FileText,
  UserCheck,
  Zap,
  MessageSquare,
  BarChart3,
  Link2,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  ShieldCheck,
} from 'lucide-react'

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Agenda', href: '/agenda', icon: Calendar },
  { name: 'Pacientes', href: '/pacientes', icon: Users },
  { name: 'Comercial', href: '/comercial', icon: Target },
  { name: 'Tratamentos', href: '/tratamentos', icon: Activity },
  { name: 'Financeiro', href: '/financeiro', icon: DollarSign },
  { name: 'Produtos', href: '/produtos', icon: Package },
  { name: 'Prontuários', href: '/prontuarios', icon: FileText },
  { name: 'Equipe', href: '/equipe', icon: UserCheck },
  { name: 'Administração da clínica', href: '/configuracoes/equipe', icon: ShieldCheck },
  { name: 'Automações', href: '/automacoes', icon: Zap },
  { name: 'WhatsApp', href: '/whatsapp', icon: MessageSquare },
  { name: 'Relatórios', href: '/relatorios', icon: BarChart3 },
  { name: 'Integrações', href: '/integracoes', icon: Link2 },
  { name: 'Configurações', href: '/configuracoes', icon: Settings },
]

export default function AuthenticatedShell({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email ?? null)
      }
    }
    getUser()
  }, [supabase])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  // Fechar menu mobile ao mudar de página
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileMenuOpen(false)
  }, [pathname])

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      {/* 1. SIDEBAR (DESKTOP) */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-zinc-800 bg-zinc-900 shrink-0">
        {/* Header da Sidebar */}
        <div className="h-16 flex items-center px-6 border-b border-zinc-800">
          <span className="text-lg font-bold tracking-wider text-violet-500">DOUXHUB</span>
        </div>

        {/* Menu de Navegação */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-violet-600/20 text-violet-400 border-l-2 border-violet-500'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Rodapé da Sidebar com Info do Usuário e Logout */}
        <div className="p-4 border-t border-zinc-800 space-y-2">
          {userEmail && (
            <div className="flex items-center space-x-2 px-2 py-1 text-xs text-zinc-500 overflow-hidden">
              <User className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{userEmail}</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-3 py-2 rounded text-sm font-medium text-red-400 hover:bg-zinc-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN LAYOUT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER (DESKTOP & MOBILE) */}
        <header className="h-16 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          {/* Lado esquerdo: Toggle Mobile / Page Title */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded hover:bg-zinc-800 focus:outline-none text-zinc-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <h2 className="text-sm lg:text-base font-semibold capitalize text-zinc-200">
              {menuItems.find((item) => item.href === pathname)?.name || 'DouxHub'}
            </h2>
          </div>

          {/* Lado direito: Área de notificações / perfil */}
          <div className="flex items-center space-x-4 text-xs text-zinc-500">
            <span>[Área Reservada para Header]</span>
          </div>
        </header>

        {/* CONTAINER DO CONTEÚDO PRINCIPAL */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-zinc-950">
          {/* Banner de aviso técnico */}
          <div className="mb-6 p-4 bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="text-xs text-yellow-500 font-semibold uppercase tracking-wider">
                ⚠️ Estrutura Técnica de Layout
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">
                Sidebar, header e navegação mobile prontos. Layout definitivo será aplicado após aprovação do design.
              </p>
            </div>
          </div>

          {children}
        </main>
      </div>

      {/* 3. SIDEBAR MOBILE (DRAWER) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          {/* Overlay de fundo */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer content */}
          <aside className="relative flex flex-col w-64 max-w-xs bg-zinc-900 border-r border-zinc-800 text-white h-full z-50">
            <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-800">
              <span className="text-lg font-bold tracking-wider text-violet-500">DOUXHUB</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-violet-600/20 text-violet-400 border-l-2 border-violet-500'
                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>

            <div className="p-4 border-t border-zinc-800 space-y-2">
              {userEmail && (
                <div className="flex items-center space-x-2 px-2 py-1 text-xs text-zinc-500 overflow-hidden">
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{userEmail}</span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 w-full px-3 py-2 rounded text-sm font-medium text-red-400 hover:bg-zinc-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
