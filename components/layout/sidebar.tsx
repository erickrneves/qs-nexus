'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Upload, FileText, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Upload', href: '/upload', icon: Upload },
  { name: 'Arquivos', href: '/files', icon: FileText },
  { name: 'Chat', href: '/chat', icon: MessageSquare },
]

interface SidebarProps {
  className?: string
  onLinkClick?: () => void
}

export function Sidebar({ className, onLinkClick }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn('flex h-full w-64 flex-col border-r bg-background', className)}>
      <div className="flex h-16 items-center border-b px-6">
        <h2 className="text-lg font-semibold">LegalWise RAG</h2>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map(item => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
