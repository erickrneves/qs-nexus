import { AppSidebar } from '@/components/layout/sidebar'
import { Navbar } from '@/components/layout/navbar'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { auth } from '@/lib/auth/config'
import { DashboardLayoutClient } from '@/components/layout/dashboard-layout-client'
import { NotificationToaster } from '@/components/notifications/notification-toaster'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  return (
    <DashboardLayoutClient 
      userName={session?.user?.name || null} 
      userEmail={session?.user?.email || null}
    >
      <NotificationToaster />
      {children}
    </DashboardLayoutClient>
  )
}
