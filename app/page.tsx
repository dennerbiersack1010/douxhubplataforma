'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    // Checa se o usuário já viu a intro nesta sessão do navegador
    const seen = sessionStorage.getItem('doux_intro_seen')
    if (seen === 'true') {
      router.replace('/login')
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShouldRender(true)
    }
  }, [router])

  const handleVideoEnd = () => {
    // Grava na sessão que a intro foi vista e redireciona de imediato
    sessionStorage.setItem('doux_intro_seen', 'true')
    router.replace('/login')
  }

  if (!shouldRender) {
    return (
      <main
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100dvh',
          backgroundColor: '#000',
        }}
      />
    )
  }

  return (
    <main
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100dvh',
        overflow: 'hidden',
        backgroundColor: '#000',
      }}
    >
      <video
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={handleVideoEnd}
        onError={handleVideoEnd}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      >
        <source src="/intro/doux-intro.mp4" type="video/mp4" />
      </video>
    </main>
  )
}
