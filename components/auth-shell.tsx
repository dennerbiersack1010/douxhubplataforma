import type { ReactNode } from 'react'

interface AuthShellProps {
  title: string
  description?: string
  children: ReactNode
  compact?: boolean
}

export const authInputClassName =
  'w-full px-4 py-3 pr-10 bg-white/90 border border-white/70 rounded-lg text-sm text-zinc-900 placeholder-zinc-500 focus:outline-none focus:border-white focus:bg-white transition-colors disabled:cursor-not-allowed disabled:opacity-70'

export const authButtonClassName =
  'w-full py-3 bg-[#e4e4e7] hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-medium rounded-lg text-sm transition-all duration-300 cursor-pointer flex justify-center items-center gap-2 group'

export const authLinkClassName =
  'text-zinc-300 hover:text-white transition-colors font-light underline decoration-zinc-400/70 decoration-[1px] underline-offset-4'

export default function AuthShell({
  title,
  description,
  children,
  compact = false,
}: AuthShellProps) {
  return (
    <main className="relative min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-black text-white font-sans">
      <img
        src="/intro/doux-background-login.png"
        alt=""
        aria-hidden="true"
        className="fixed inset-0 h-full w-full object-cover object-center z-0"
        draggable="false"
      />

      <div className="fixed inset-0 bg-black/[0.06] pointer-events-none z-0" />
      <div className="fixed inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.38)_0%,rgba(0,0,0,0.18)_30%,rgba(0,0,0,0.04)_58%,rgba(0,0,0,0.08)_100%)] pointer-events-none z-0" />
      <div className="fixed inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/25 to-transparent pointer-events-none z-0" />

      <div className="relative z-10 min-h-[100dvh] px-6 py-6 md:px-14 md:py-10 flex flex-col">
        <div className="w-full flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
          <section className="flex flex-col justify-between items-start text-left min-h-[170px] md:min-h-[480px] md:h-full md:max-h-[580px] py-1 md:py-4">
            <img
              src="/intro/doux-logo.png"
              alt="DouxHub"
              className="w-[210px] h-[52px] md:w-[260px] md:h-[64px] object-cover object-[center_49%] -ml-7 md:-ml-[35px]"
              draggable="false"
            />

            <div className="mt-auto max-w-sm pt-5 md:pt-0">
              <h2 className="text-lg md:text-[25px] font-light tracking-wide leading-relaxed text-zinc-300">
                A operação da sua clínica,
                <br />
                em um <span className="font-semibold text-white">único</span> lugar.
              </h2>
              <div className="w-12 h-[2px] bg-[#c4a988] mt-3 md:mt-4" />
            </div>
          </section>

          <section className="w-full flex items-center justify-center md:justify-end pb-8 md:pb-0">
            <div
              className={`w-full max-w-[420px] p-7 md:p-10 bg-black/35 border border-zinc-800/40 rounded-3xl backdrop-blur-md flex flex-col transition-all duration-300 ${
                compact ? 'md:min-h-[500px]' : 'md:min-h-[560px]'
              }`}
            >
              <header className="mb-6">
                <span className="text-zinc-300 font-light text-[13px] tracking-wide block">
                  DouxHub
                </span>
                <h1 className="text-[30px] md:text-[34px] font-semibold tracking-wide text-white leading-tight">
                  {title}
                </h1>
                {description && (
                  <p className="mt-3 text-xs md:text-sm font-light leading-relaxed text-zinc-300">
                    {description}
                  </p>
                )}
              </header>

              <div className="flex-1 flex flex-col justify-center">{children}</div>
            </div>
          </section>
        </div>

        <footer className="relative w-full text-center text-[10px] text-zinc-300 font-light pt-1">
          © {new Date().getFullYear()} DouxHub. Todos os direitos reservados.
        </footer>
      </div>
    </main>
  )
}
