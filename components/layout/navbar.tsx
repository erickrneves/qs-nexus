'use client'

import { User, Bell, Moon, Sun, LogOut } from 'lucide-react'
import { LogoutButton } from './logout-button'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

interface NavbarProps {
  userName?: string | null
  userEmail?: string | null
}

export function Navbar({ userName, userEmail }: NavbarProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-[var(--qs-border)] bg-[var(--qs-card)] px-4">
      {/* Sidebar Toggle */}
      <SidebarTrigger className="h-9 w-9 text-[var(--qs-text-muted)] hover:text-[var(--qs-text)] hover:bg-[var(--qs-muted)] rounded-lg" />
      
      {/* Separator */}
      <div className="h-5 w-px bg-[var(--qs-border)]" />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-[var(--qs-text-muted)] hover:text-[var(--qs-text)] hover:bg-[var(--qs-muted)]"
          onClick={toggleTheme}
          disabled={!mounted}
        >
          {mounted && theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          <span className="sr-only">Toggle dark mode</span>
        </Button>

        {/* Notifications */}
        <Button 
          variant="ghost" 
          size="icon-sm" 
          className="relative text-[var(--qs-text-muted)] hover:text-[var(--qs-text)] hover:bg-[var(--qs-muted)]"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--qs-error)]" />
          <span className="sr-only">Notificações</span>
        </Button>

        {/* Separator */}
        <div className="h-5 w-px bg-[var(--qs-border)] mx-1" />

        {/* User Profile */}
        <div className="flex items-center gap-3 rounded-xl border border-[var(--qs-border)] bg-[var(--qs-surface)] pl-1 pr-3 py-1 transition-colors hover:border-[var(--qs-border-hover)]">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--qs-primary)] text-white shadow-sm">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden flex-col sm:flex min-w-0">
            <span className="text-sm font-medium text-[var(--qs-text)] truncate max-w-[120px]">
              {userName || 'Usuário'}
            </span>
            <span className="text-xs text-[var(--qs-text-muted)] truncate max-w-[120px]">
              {userEmail || ''}
            </span>
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
  )
}
