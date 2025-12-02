'use client'

import { AppSidebar } from '@/components/layout/sidebar'
import { Navbar } from '@/components/layout/navbar'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { GlobalSearch } from '@/components/search/global-search'
import { KeyboardShortcuts } from '@/components/keyboard-shortcuts'
import { SidebarProvider, SidebarInset, useSidebar } from '@/components/ui/sidebar'
import { OrganizationProvider } from '@/lib/contexts/organization-context'
import { useCallback } from 'react'

interface DashboardLayoutClientProps {
  children: React.ReactNode
  userName?: string | null
  userEmail?: string | null
}

function DashboardLayoutContent({ children, userName, userEmail }: DashboardLayoutClientProps) {
  const { setOpenMobile } = useSidebar()

  const handleLinkClick = useCallback(() => {
    // Sempre fecha o mobile, o componente Sheet já controla se está mobile ou não
    setOpenMobile(false)
  }, [setOpenMobile])

  return (
    <>
      <GlobalSearch />
      <KeyboardShortcuts />
      <AppSidebar onLinkClick={handleLinkClick} />
      <SidebarInset>
        <Navbar userName={userName} userEmail={userEmail} />
        <div className="border-b border-[var(--qs-border)] bg-[var(--qs-card)] px-4 md:px-6 lg:px-8 py-3">
          <Breadcrumbs />
        </div>
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </>
  )
}

export function DashboardLayoutClient({ children, userName, userEmail }: DashboardLayoutClientProps) {
  return (
    <OrganizationProvider>
      <SidebarProvider>
        <DashboardLayoutContent userName={userName} userEmail={userEmail}>
          {children}
        </DashboardLayoutContent>
      </SidebarProvider>
    </OrganizationProvider>
  )
}

