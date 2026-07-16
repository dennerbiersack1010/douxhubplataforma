'use client'

import { useState, useEffect, useRef } from 'react'
import LoginForm from '@/components/login-form'

export default function HomePage() {
  const [introActive, setIntroActive] = useState(true)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [fadeVideo, setFadeVideo] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Pré-carrega a imagem estática de fundo para evitar flash quando o vídeo acabar
  useEffect(() => {
    const img = new Image()
    img.src = '/intro/doux-background-login.png'
    img.onload = () => {
      setImageLoaded(true)
    }
  }, [])

  const handleVideoEnd = () => {
    // Inicia o fade-out do vídeo
    setFadeVideo(true)
    // Após a transição de opacidade do vídeo, desmontamos e mostramos o formulário
    setTimeout(() => {
      setIntroActive(false)
      setShowForm(true)
    }, 800) // 800ms de transição suave
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
      {/* Imagem de Fundo Estática (sempre montada por baixo para transição suave) */}
      {imageLoaded && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: "url('/intro/doux-background-login.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: !introActive || fadeVideo ? 1 : 0,
            transition: 'opacity 0.8s ease-in-out',
            zIndex: 1,
          }}
        />
      )}

      {/* Vídeo da Intro */}
      {introActive && (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          preload="auto"
          onEnded={handleVideoEnd}
          onError={handleVideoEnd}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            zIndex: 2,
            opacity: fadeVideo ? 0 : 1,
            transition: 'opacity 0.8s ease-in-out',
          }}
        >
          <source src="/intro/doux-intro.mp4" type="video/mp4" />
        </video>
      )}

      {/* Formulário de Login (revelado de forma suave) */}
      {showForm && (
        <div
          className="absolute inset-0 z-10 flex flex-col justify-between"
          style={{
            opacity: showForm ? 1 : 0,
            transition: 'opacity 1s ease-in-out',
          }}
        >
          <LoginForm />
        </div>
      )}
    </main>
  )
}
