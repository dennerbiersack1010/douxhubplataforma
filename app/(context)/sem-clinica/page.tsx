export default function SemClinicaPage() {
  return (
    <section className="max-w-2xl w-full space-y-6">
      <div className="p-4 bg-yellow-950/30 border border-yellow-800/60 rounded-lg">
        <p className="text-xs text-yellow-400 font-semibold uppercase tracking-wider">
          Interface técnica temporária
        </p>
        <p className="text-xs text-zinc-400 mt-1">
          Esta tela representa somente o estado operacional de uma conta sem clínica ativa.
        </p>
      </div>

      <div className="p-6 rounded-lg border border-zinc-800 bg-zinc-900">
        <h1 className="text-xl font-semibold text-zinc-100">Nenhuma clínica disponível</h1>
        <p className="text-sm leading-relaxed text-zinc-400 mt-3">
          Sua conta ainda não possui um vínculo ativo com uma clínica. Solicite um convite ao administrador da clínica ou aguarde a ativação do seu acesso.
        </p>
      </div>
    </section>
  )
}
