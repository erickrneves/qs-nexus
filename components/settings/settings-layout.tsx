'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings, FileCode, Database } from 'lucide-react'
import { cn } from '@/lib/utils'

const settingsNav = [
  {
    name: 'Classificação',
    href: '/settings/classification',
    icon: FileCode,
    description: 'Configurar modelos e prompts de classificação',
  },
  {
    name: 'Schema de Template',
    href: '/settings/template-schema',
    icon: Database,
    description: 'Configurar schema dinâmico de templates',
  },
]

interface SettingsLayoutProps {
  children: React.ReactNode
}

export function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações do sistema de classificação e schemas de templates
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar Navigation */}
        <aside className="lg:w-64 lg:shrink-0">
          <nav className="space-y-1">
            {settingsNav.map(item => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <div className="flex flex-col">
                    <span>{item.name}</span>
                    <span className="text-xs opacity-70">{item.description}</span>
                  </div>
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}

