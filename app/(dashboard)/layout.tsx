import { Sidebar } from '@/components/layout/sidebar'
import { Navbar } from '@/components/layout/navbar'
import { auth } from '@/lib/auth/config'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  return (
    <div className="flex h-screen">
      {/* Sidebar desktop - escondida em mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar userName={session?.user?.name || null} userEmail={session?.user?.email || null} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
