'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Upload,
  MessageSquare,
  Database,
  Settings,
  HelpCircle,
  Hexagon,
  ChevronLeft,
  Workflow,
  BarChart,
  FileText,
  FileCheck,
  Building2,
  Users,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const navigationGroups = [
  {
    title: 'Principal',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Chat IA', href: '/chat', icon: MessageSquare },
    ],
  },
  {
    title: 'Dados',
    items: [
      { name: 'Upload', href: '/upload', icon: Upload },
      { name: 'Arquivos', href: '/files', icon: FileText },
      { name: 'SPED', href: '/sped', icon: Database },
    ],
  },
  {
    title: 'Análise e IA',
    items: [
      { name: 'Workflows', href: '/workflows', icon: Workflow },
      { name: 'Análises', href: '/analysis', icon: BarChart },
      { name: 'Relatórios', href: '/reports', icon: FileCheck },
    ],
  },
  {
    title: 'Administração',
    items: [
      { name: 'Configurações', href: '/settings', icon: Settings },
      { name: 'Organizações', href: '/admin/organizations', icon: Building2 },
      { name: 'Usuários', href: '/admin/users', icon: Users },
    ],
  },
]

interface AppSidebarProps {
  onLinkClick?: () => void
}

export function AppSidebar({ onLinkClick }: AppSidebarProps) {
  const pathname = usePathname()
  const { state, toggleSidebar } = useSidebar()
  const isCollapsed = state === 'collapsed'

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r border-[var(--qs-border)] bg-[var(--qs-surface)]"
    >
      {/* Header */}
      <SidebarHeader className="p-4 pb-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              size="lg" 
              asChild 
              className="h-auto py-3 hover:bg-[var(--qs-muted)] rounded-xl transition-all duration-200"
            >
              <Link href="/dashboard" onClick={onLinkClick} className="flex items-center gap-3">
                {/* Ícone com Gradiente Premium */}
                <div className="flex aspect-square size-10 items-center justify-center rounded-xl gradient-icon shrink-0">
                  <Hexagon className="size-5 text-white" />
                </div>
                <div className="flex flex-col gap-0.5 leading-tight overflow-hidden">
                  <span className="font-semibold text-base text-[var(--qs-text)] truncate">
                    QS <span className="gradient-icon-text font-bold">Nexus</span>
                  </span>
                  <span className="text-xs text-[var(--qs-text-muted)] truncate">Inteligência de Dados</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Collapse Toggle */}
      <div className="px-4 pb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="w-full justify-start gap-2 text-[var(--qs-text-muted)] hover:text-[var(--qs-text)] hover:bg-[var(--qs-muted)] rounded-lg h-8"
        >
          <ChevronLeft className={`size-4 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`} />
          {!isCollapsed && <span className="text-xs">Recolher</span>}
        </Button>
      </div>

      {/* Navigation */}
      <SidebarContent className="px-3">
        {navigationGroups.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel className="px-3 mb-2 text-[10px] font-semibold text-[var(--qs-text-tertiary)] uppercase tracking-widest">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {group.items.map(item => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                  const Icon = item.icon

                  const menuItem = (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        size="default"
                        className={`h-10 px-3 rounded-xl transition-all duration-200 cursor-pointer ${
                          isActive 
                            ? 'bg-[var(--gradient-sidebar)] text-white shadow-[var(--qs-shadow-primary)]' 
                            : 'text-[var(--qs-text-secondary)] hover:bg-[var(--qs-muted)] hover:text-[var(--qs-text)]'
                        }`}
                      >
                        <Link href={item.href} onClick={onLinkClick} className="flex items-center gap-3">
                          <Icon className="size-[18px] shrink-0" />
                          <span className="font-medium truncate">{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )

                  if (isCollapsed) {
                    return (
                      <Tooltip key={item.name} delayDuration={0}>
                        <TooltipTrigger asChild>
                          {menuItem}
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-[var(--qs-card)] border-[var(--qs-border)] text-[var(--qs-text)]">
                          {item.name}
                        </TooltipContent>
                      </Tooltip>
                    )
                  }

                  return menuItem
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer */}
      {!isCollapsed && (
        <SidebarFooter className="p-4 pt-2 border-t border-[var(--qs-border)]">
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center gap-3 rounded-xl bg-[var(--qs-muted)] p-3 text-xs">
                <div className="flex items-center justify-center w-2 h-2 rounded-full bg-[var(--qs-success)] animate-pulse" />
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  <span className="font-medium text-[var(--qs-text)] truncate">QS Nexus</span>
                  <span className="text-[var(--qs-text-tertiary)] truncate">v2.0.0 • Online</span>
                </div>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}

      <SidebarRail />
    </Sidebar>
  )
}
