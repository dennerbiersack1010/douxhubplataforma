'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import LoginForm from '@/components/login-form'

export default function HomePage() {
  const [introEnded, setIntroEnded] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const finishedRef = useRef(false)

  const finishIntro = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    setIntroEnded(true)
    window.history.replaceState({}, '', '/login')
  }, [])

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (video?.duration && video.duration - video.currentTime <= 0.02) {
      finishIntro()
    }
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const syncFinalFrame = () => {
      if (video.ended || (video.duration && video.duration - video.currentTime <= 0.02)) {
        finishIntro()
      }
    }

    video.addEventListener('ended', finishIntro)
    video.addEventListener('timeupdate', syncFinalFrame)
    const hydrationCheck = window.setTimeout(syncFinalFrame, 0)

    return () => {
      window.clearTimeout(hydrationCheck)
      video.removeEventListener('ended', finishIntro)
      video.removeEventListener('timeupdate', syncFinalFrame)
    }
  }, [finishIntro])

  return (
    <main className="relative w-screen h-screen max-h-screen overflow-hidden bg-black select-none">
      {/* O login form e a imagem estática de fundo já ficam renderizados e prontos por baixo */}
      <div className="absolute inset-0 z-10 w-full h-full">
        <LoginForm />
      </div>

      {/* A rota raiz sempre reproduz a intro; o login permanece pronto por baixo. */}
      {!introEnded && (
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
