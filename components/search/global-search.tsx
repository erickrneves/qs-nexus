'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  FileText,
  Database,
  FileSpreadsheet,
  Settings,
  Users,
  Building2,
  MessageSquare,
  Upload,
  Bell,
  BarChart3,
  FileSearch,
  Home,
  HelpCircle,
} from 'lucide-react'

interface SearchResult {
  id: string
  title: string
  description?: string
  icon: any
  href: string
  category: 'pages' | 'documents' | 'actions' | 'settings'
}

const pages: SearchResult[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Visão geral do sistema',
    icon: Home,
    href: '/dashboard',
    category: 'pages',
  },
  {
    id: 'chat',
    title: 'Chat IA',
    description: 'Converse com o assistente inteligente',
    icon: MessageSquare,
    href: '/chat',
    category: 'pages',
  },
  {
    id: 'upload',
    title: 'Upload de Arquivos',
    description: 'Importar SPED, CSV ou documentos',
    icon: Upload,
    href: '/upload',
    category: 'pages',
  },
  {
    id: 'files',
    title: 'Documentos Jurídicos',
    description: 'Contratos, petições e pareceres',
    icon: FileText,
    href: '/files',
    category: 'pages',
  },
  {
    id: 'sped',
    title: 'SPED',
    description: 'Obrigações fiscais (ECD, ECF, EFD)',
    icon: Database,
    href: '/sped',
    category: 'pages',
  },
  {
    id: 'csv',
    title: 'Planilhas CSV',
    description: 'Controles e dados financeiros',
    icon: FileSpreadsheet,
    href: '/csv',
    category: 'pages',
  },
  {
    id: 'notifications',
    title: 'Notificações',
    description: 'Ver todas as notificações',
    icon: Bell,
    href: '/notifications',
    category: 'pages',
  },
]

const settings: SearchResult[] = [
  {
    id: 'settings',
    title: 'Configurações',
    description: 'Configurações gerais da aplicação',
    icon: Settings,
    href: '/settings',
    category: 'settings',
  },
  {
    id: 'classification',
    title: 'Classificação de Documentos',
    description: 'Modelos e prompts de classificação',
    icon: FileSearch,
    href: '/settings/classification',
    category: 'settings',
  },
  {
    id: 'organizations',
    title: 'Organizações',
    description: 'Gerenciar organizações e clientes',
    icon: Building2,
    href: '/admin/organizations',
    category: 'settings',
  },
  {
    id: 'users',
    title: 'Usuários',
    description: 'Gerenciar usuários e permissões',
    icon: Users,
    href: '/admin/users',
    category: 'settings',
  },
]

const actions: SearchResult[] = [
  {
    id: 'upload-sped',
    title: 'Importar SPED',
    description: 'Fazer upload de arquivo SPED',
    icon: Database,
    href: '/upload?tab=sped',
    category: 'actions',
  },
  {
    id: 'upload-csv',
    title: 'Importar CSV',
    description: 'Fazer upload de planilha CSV',
    icon: FileSpreadsheet,
    href: '/upload?tab=csv',
    category: 'actions',
  },
  {
    id: 'upload-doc',
    title: 'Importar Documento',
    description: 'Fazer upload de documento (DOCX, PDF)',
    icon: FileText,
    href: '/upload?tab=document',
    category: 'actions',
  },
  {
    id: 'help',
    title: 'Central de Ajuda',
    description: 'Ver guias e documentação',
    icon: HelpCircle,
    href: '/help',
    category: 'actions',
  },
]

export function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  // Ctrl+K / Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const handleSelect = useCallback((href: string) => {
    setOpen(false)
    setSearch('')
    router.push(href)
  }, [router])

  // Filtrar resultados baseado na busca
  const filteredPages = pages.filter((page) =>
    page.title.toLowerCase().includes(search.toLowerCase()) ||
    page.description?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredActions = actions.filter((action) =>
    action.title.toLowerCase().includes(search.toLowerCase()) ||
    action.description?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredSettings = settings.filter((setting) =>
    setting.title.toLowerCase().includes(search.toLowerCase()) ||
    setting.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Buscar páginas, documentos, ações..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>
          <div className="py-6 text-center text-sm">
            <FileSearch className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              Nenhum resultado encontrado para &quot;{search}&quot;
            </p>
          </div>
        </CommandEmpty>

        {filteredPages.length > 0 && (
          <CommandGroup heading="Páginas">
            {filteredPages.map((page) => {
              const Icon = page.icon
              return (
                <CommandItem
                  key={page.id}
                  value={page.title}
                  onSelect={() => handleSelect(page.href)}
                  className="cursor-pointer"
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{page.title}</span>
                    {page.description && (
                      <span className="text-xs text-muted-foreground">
                        {page.description}
                      </span>
                    )}
                  </div>
                </CommandItem>
              )
            })}
          </CommandGroup>
        )}

        {filteredActions.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Ações Rápidas">
              {filteredActions.map((action) => {
                const Icon = action.icon
                return (
                  <CommandItem
                    key={action.id}
                    value={action.title}
                    onSelect={() => handleSelect(action.href)}
                    className="cursor-pointer"
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>{action.title}</span>
                      {action.description && (
                        <span className="text-xs text-muted-foreground">
                          {action.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </>
        )}

        {filteredSettings.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Configurações">
              {filteredSettings.map((setting) => {
                const Icon = setting.icon
                return (
                  <CommandItem
                    key={setting.id}
                    value={setting.title}
                    onSelect={() => handleSelect(setting.href)}
                    className="cursor-pointer"
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>{setting.title}</span>
                      {setting.description && (
                        <span className="text-xs text-muted-foreground">
                          {setting.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </>
        )}
      </CommandList>

      {/* Footer com dica de atalho */}
      <div className="border-t px-4 py-2 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>Navegue com ↑ ↓ • Selecione com ⏎</span>
          <span>Fechar com ESC</span>
        </div>
      </div>
    </CommandDialog>
  )
}

