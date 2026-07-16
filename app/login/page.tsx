'use client'

import LoginForm from '@/components/login-form'

export default function LoginPage() {
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
      {/* Imagem de Fundo Estática */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: "url('/intro/doux-background-login.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 1,
        }}
      />

      {/* Formulário de Login */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between">
        <LoginForm />
      </div>
    </main>
  )
}
