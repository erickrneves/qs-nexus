'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { Hexagon, ArrowRight, Database, MessageSquare, Shield, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--qs-bg)]">
        <div className="animate-pulse text-[var(--qs-text-muted)]">Carregando...</div>
      </div>
    )
  }

  return (
    <main className="flex flex-col min-h-screen bg-[var(--qs-bg)] overflow-hidden">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center flex-1 px-6 py-16 sm:py-24 relative">
        {/* Subtle background glow */}
        <div 
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-30 blur-3xl pointer-events-none"
          style={{ 
            background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(20,184,166,0.15) 50%, rgba(6,182,212,0.1) 100%)' 
          }}
        />
        
        {/* Logo/Icon Premium */}
        <div className="relative mb-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl gradient-icon shadow-[var(--qs-shadow-icon)] animate-scaleIn">
              <Hexagon className="w-8 h-8 text-white" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col">
              <h1 className="text-4xl sm:text-5xl font-bold text-[var(--qs-text)] tracking-tight">
                QS <span className="gradient-icon-text">Nexus</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Title and Description */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--qs-text)] mb-4">
            Inteligência de Dados
          </h2>
          <p className="text-lg text-[var(--qs-text-muted)] leading-relaxed">
            Sistema de análise inteligente para consultoria tributária e empresarial. 
            Combine SQL e busca semântica com agentes de IA.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <Link href="/login">
            <Button size="xl" className="min-w-[180px] group">
              Começar agora
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="xl" className="min-w-[180px]">
              Fazer login
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-5xl">
          {[
            { 
              icon: Database, 
              title: 'SQL + RAG', 
              desc: 'Consultas híbridas inteligentes',
              color: 'var(--qs-green)'
            },
            { 
              icon: MessageSquare, 
              title: 'Agentes IA', 
              desc: 'Análise conversacional avançada',
              color: 'var(--qs-teal)'
            },
            { 
              icon: Shield, 
              title: 'Multi-tenant', 
              desc: 'Isolamento e segurança de dados',
              color: 'var(--qs-blue-light)'
            },
            { 
              icon: Zap, 
              title: 'SPED Nativo', 
              desc: 'ECD, ECF, EFD processados',
              color: 'var(--qs-brand)'
            },
          ].map((feature, i) => (
            <div 
              key={i} 
              className="group relative bg-[var(--qs-card)] border border-[var(--qs-border)] rounded-2xl p-6 shadow-[var(--qs-shadow-sm)] hover:shadow-[var(--qs-shadow)] hover:border-[var(--qs-border-hover)] transition-all duration-300"
            >
              <div 
                className="flex items-center justify-center w-12 h-12 rounded-xl mb-4 transition-all duration-300 group-hover:scale-105"
                style={{ 
                  background: `linear-gradient(135deg, ${feature.color}15 0%, ${feature.color}25 100%)`,
                  boxShadow: `0 4px 12px ${feature.color}15`
                }}
              >
                <feature.icon 
                  className="w-6 h-6" 
                  style={{ color: feature.color }} 
                />
              </div>
              <h3 className="font-semibold text-[var(--qs-text)] mb-1">{feature.title}</h3>
              <p className="text-sm text-[var(--qs-text-muted)]">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-[var(--qs-text-tertiary)] border-t border-[var(--qs-border)]">
        © {new Date().getFullYear()} QS Consultoria • Todos os direitos reservados
      </footer>
    </main>
  )
}
