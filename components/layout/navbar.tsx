'use client'

import { User, Moon, Sun, Settings, Building2, Users, LogOut, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { NotificationPopover } from '@/components/notifications/notification-popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'

interface NavbarProps {
  userName?: string | null
  userEmail?: string | null
}

export function Navbar({ userName, userEmail }: NavbarProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-[var(--qs-border)] bg-[var(--qs-card)] px-4">
      {/* Sidebar Toggle */}
      <SidebarTrigger className="h-9 w-9 text-[var(--qs-text-muted)] hover:text-[var(--qs-text)] hover:bg-[var(--qs-muted)] rounded-lg" />
      
      {/* Separator */}
      <div className="h-5 w-px bg-[var(--qs-border)]" />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search Shortcut Hint */}
      <Button
        variant="outline"
        className="hidden md:flex items-center gap-2 text-sm text-muted-foreground border-dashed"
        onClick={() => {
          const event = new KeyboardEvent('keydown', {
            key: 'k',
            metaKey: true,
            ctrlKey: true,
          })
          document.dispatchEvent(event)
        }}
      >
        <span>Buscar...</span>
        <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

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
        <NotificationPopover />

        {/* Separator */}
        <div className="h-5 w-px bg-[var(--qs-border)] mx-1" />

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-3 rounded-xl border border-[var(--qs-border)] bg-[var(--qs-surface)] pl-1 pr-3 py-1 h-auto hover:border-[var(--qs-border-hover)] hover:bg-[var(--qs-surface)]"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--qs-primary)] text-white shadow-sm">
                <User className="h-4 w-4" />
              </div>
              <div className="hidden flex-col sm:flex min-w-0 items-start">
                <span className="text-sm font-medium text-[var(--qs-text)] truncate max-w-[120px]">
                  {userName || 'Usuário'}
                </span>
                <span className="text-xs text-[var(--qs-text-muted)] truncate max-w-[120px]">
                  {userEmail || ''}
                </span>
              </div>
              <ChevronDown className="h-3 w-3 text-[var(--qs-text-muted)] shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-card">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userName || 'Usuário'}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {userEmail || ''}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Administração
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => router.push('/settings')}
                className="cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push('/admin/organizations')}
                className="cursor-pointer"
              >
                <Building2 className="mr-2 h-4 w-4" />
                <span>Organizações</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push('/admin/users')}
                className="cursor-pointer"
              >
                <Users className="mr-2 h-4 w-4" />
                <span>Usuários</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
