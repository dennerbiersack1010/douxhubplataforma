'use client'

import { useEffect, useState, useRef } from 'react'
import LoginForm from '@/components/login-form'

export default function HomePage() {
  const [shouldRenderVideo, setShouldRenderVideo] = useState(false)
  const [introEnded, setIntroEnded] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // Checa se o usuário já viu a intro nesta sessão do navegador
    const seen = sessionStorage.getItem('doux_intro_seen')
    if (seen === 'true') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIntroEnded(true)
      // Atualiza a URL na barra de endereços de forma transparente e instantânea
      window.history.replaceState({}, '', '/login')
    } else {
      setShouldRenderVideo(true)
    }
  }, [])

  const finishIntro = () => {
    sessionStorage.setItem('doux_intro_seen', 'true')
    setIntroEnded(true)
    window.history.replaceState({}, '', '/login')
  }

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (video && video.duration) {
      // 120ms antes do vídeo terminar, já revelamos a tela de login por baixo para corte instantâneo e zero delay
      if (video.currentTime >= video.duration - 0.12) {
        finishIntro()
      }
    }
  }

  return (
    <main className="relative w-screen h-screen max-h-screen overflow-hidden bg-black select-none">
      {/* O login form e a imagem estática de fundo já ficam renderizados e prontos por baixo */}
      <div className="absolute inset-0 z-10 w-full h-full">
        <LoginForm />
      </div>

      {/* O vídeo de introdução é sobreposto em tela cheia apenas se ainda não foi visualizado nesta sessão */}
      {shouldRenderVideo && !introEnded && (
        <div className="absolute inset-0 z-50 w-full h-full bg-black">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            preload="auto"
            onTimeUpdate={handleTimeUpdate}
            onEnded={finishIntro}
            onError={finishIntro}
            className="w-full h-full object-cover block"
          >
            <source src="/intro/doux-intro.mp4" type="video/mp4" />
          </video>
        </div>
      )}
    </main>
  )
}
