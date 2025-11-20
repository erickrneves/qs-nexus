'use client'

import { User, Menu } from 'lucide-react'
import { LogoutButton } from './logout-button'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Sidebar } from './sidebar'
import { useState } from 'react'

interface NavbarProps {
  userName?: string | null
  userEmail?: string | null
}

export function Navbar({ userName, userEmail }: NavbarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-4">
        {/* Menu hamburger para mobile */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <Sidebar onLinkClick={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Logo/Título em mobile */}
        <h2 className="text-lg font-semibold md:hidden">LegalWise RAG</h2>

        {/* User info */}
        <div className="flex items-center gap-2">
          <User className="h-5 w-5" />
          <span className="hidden text-sm font-medium sm:inline">
            {userName || userEmail || 'Usuário'}
          </span>
        </div>
      </div>
      <LogoutButton />
    </div>
  )
}
