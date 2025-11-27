'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Hexagon, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      })

      if (result?.error) {
        setError('Email ou senha invalidos')
      } else if (result?.ok) {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch {
      setError('Erro ao fazer login')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        setMagicLinkSent(true)
      } else {
        const data = await response.json()
        setError(data.error || 'Erro ao enviar link')
      }
    } catch {
      setError('Erro ao enviar magic link')
    } finally {
      setIsLoading(false)
    }
  }

  if (magicLinkSent) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--qs-success-light)] mb-4">
          <Mail className="w-8 h-8 text-[var(--qs-success)]" />
        </div>
        <h3 className="text-xl font-semibold text-[var(--qs-text)] mb-2">Verifique seu email</h3>
        <p className="text-[var(--qs-text-muted)]">
          Enviamos um link de acesso para <strong className="text-[var(--qs-text)]">{email}</strong>
        </p>
      </div>
    )
  }

  return (
    <Tabs defaultValue="password" className="w-full">
      <TabsList className="w-full mb-6">
        <TabsTrigger value="magic" className="flex-1 gap-2">
          <Sparkles className="w-4 h-4" />
          Magic Link
        </TabsTrigger>
        <TabsTrigger value="password" className="flex-1 gap-2">
          <Lock className="w-4 h-4" />
          Senha
        </TabsTrigger>
      </TabsList>

      <TabsContent value="magic">
        <form onSubmit={handleMagicLink} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--qs-text)]">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--qs-text-tertiary)]" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="pl-10"
              />
            </div>
          </div>
          
          <Button type="submit" className="w-full group" disabled={isLoading}>
            {isLoading ? 'Enviando...' : 'Enviar link'}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>

          <p className="text-center text-sm text-[var(--qs-text-tertiary)]">
            Voce recebera um link por email para entrar sem senha
          </p>
        </form>
      </TabsContent>

      <TabsContent value="password">
        <form onSubmit={handleCredentialsLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--qs-text)]">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--qs-text-tertiary)]" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--qs-text)]">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--qs-text-tertiary)]" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                required
                className="pl-10"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 text-sm text-[var(--qs-error)] bg-[var(--qs-error-light)] rounded-xl">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full group" disabled={isLoading}>
            {isLoading ? 'Entrando...' : 'Entrar'}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--qs-bg)] p-6 relative overflow-hidden">
      {/* Background glow */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ 
          background: 'linear-gradient(180deg, rgba(16,185,129,0.12) 0%, rgba(20,184,166,0.1) 50%, transparent 100%)' 
        }}
      />

      {/* Logo Header */}
      <div className="flex items-center gap-3 mb-8 relative z-10">
        <div className="flex items-center justify-center w-14 h-14 rounded-xl gradient-icon shadow-[var(--qs-shadow-icon)]">
          <Hexagon className="w-7 h-7 text-white" strokeWidth={1.5} />
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-[var(--qs-text)]">
            QS <span className="gradient-icon-text">Nexus</span>
          </span>
          <span className="text-sm text-[var(--qs-text-muted)]">Inteligencia de Dados</span>
        </div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md relative z-10">
        <div className="bg-[var(--qs-card)] border border-[var(--qs-border)] rounded-2xl p-8 shadow-[var(--qs-shadow-md)]">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-[var(--qs-text)]">Entrar</h2>
            <p className="text-sm text-[var(--qs-text-muted)] mt-1">Escolha como deseja acessar</p>
          </div>
          
          <Suspense fallback={<div className="text-center py-8 text-[var(--qs-text-muted)]">Carregando...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-8 text-sm text-[var(--qs-text-tertiary)] relative z-10">
        2025 QS Consultoria
      </p>
    </div>
  )
}
