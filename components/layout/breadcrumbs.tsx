'use client'

import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Fragment } from 'react'

interface BreadcrumbItem {
  label: string
  href: string
}

// Mapeamento de rotas para labels em português
const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  chat: 'Chat IA',
  notifications: 'Notificações',
  upload: 'Upload',
  files: 'Arquivos',
  sped: 'SPED',
  csv: 'Planilhas CSV',
  settings: 'Configurações',
  admin: 'Administração',
  organizations: 'Organizações',
  users: 'Usuários',
  help: 'Ajuda',
  classification: 'Classificação',
  'template-schema': 'Schemas de Template',
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const paths = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = []

  let currentPath = ''
  for (const path of paths) {
    currentPath += `/${path}`
    breadcrumbs.push({
      label: routeLabels[path] || path.charAt(0).toUpperCase() + path.slice(1),
      href: currentPath,
    })
  }

  return breadcrumbs
}

export function Breadcrumbs() {
  const pathname = usePathname()

  // Não mostrar breadcrumbs na home ou login
  if (!pathname || pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/register')) {
    return null
  }

  const breadcrumbs = generateBreadcrumbs(pathname)

  // Se só tiver um nível, não mostrar
  if (breadcrumbs.length === 0) {
    return null
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-1 text-sm text-[var(--qs-text-muted)]">
      {/* Home */}
      <Link
        href="/dashboard"
        className="flex items-center hover:text-[var(--qs-text)] transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
        <span className="sr-only">Home</span>
      </Link>

      {/* Breadcrumb items */}
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1

        return (
          <Fragment key={item.href}>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            {isLast ? (
              <span className="font-medium text-[var(--qs-text)] truncate max-w-[200px]">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-[var(--qs-text)] transition-colors truncate max-w-[150px]"
              >
                {item.label}
              </Link>
            )}
          </Fragment>
        )
      })}
    </nav>
  )
}
