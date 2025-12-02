'use client'

import { signOut } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    await signOut({ redirectTo: '/login' })
    router.push('/login')
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="h-8 w-8 rounded-lg text-[var(--qs-text-muted)] hover:text-[var(--qs-error)] hover:bg-[var(--qs-error-light)] transition-all duration-200"
      onClick={handleLogout}
      title="Sair"
    >
      <LogOut className="h-4 w-4" />
    </Button>
  )
}
