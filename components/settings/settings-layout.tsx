'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileCode, Database } from 'lucide-react'
import { cn } from '@/lib/utils'

const settingsNav = [
  {
    name: 'Classificação',
    href: '/settings/classification',
    icon: FileCode,
    description: 'Modelos e prompts',
  },
  {
    name: 'Schema de Template',
    href: '/settings/template-schema',
    icon: Database,
    description: 'Campos dinâmicos',
  },
]

interface SettingsLayoutProps {
  children: React.ReactNode
}

export function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname()

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header com navegação horizontal */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações do sistema de classificação e schemas de templates
          </p>
        </div>

        {/* Navegação Horizontal (Tabs) */}
        <div className="border-b">
          <nav className="flex gap-6" aria-label="Tabs">
            {settingsNav.map(item => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group inline-flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )} />
                  <div className="flex flex-col items-start">
                    <span>{item.name}</span>
                    <span className="text-xs opacity-70">{item.description}</span>
                  </div>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">{children}</div>
    </div>
  )
}

