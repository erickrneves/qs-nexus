'use client'

import { Check, ChevronsUpDown, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useOrganization } from '@/lib/contexts/organization-context'
import { useState } from 'react'

interface OrganizationSelectorProps {
  className?: string
  collapsed?: boolean
}

export function OrganizationSelector({ className, collapsed }: OrganizationSelectorProps) {
  const { currentOrg, organizations, setCurrentOrg, isLoading } = useOrganization()
  const [open, setOpen] = useState(false)

  const formatCNPJ = (cnpj: string | null) => {
    if (!cnpj || cnpj.length !== 14) return cnpj
    return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`
  }

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center h-12', className)}>
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--qs-green)]" />
      </div>
    )
  }

  if (organizations.length === 0) {
    return null
  }

  if (collapsed) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-center px-2 bg-[var(--qs-muted)] border-[var(--qs-border)] hover:bg-[var(--qs-muted)]/80"
          >
            <Building2 className="h-4 w-4 text-[var(--qs-green)]" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 bg-card" side="right" align="start">
          <Command>
            <CommandInput placeholder="Buscar organização..." />
            <CommandList>
              <CommandEmpty>Nenhuma organização encontrada.</CommandEmpty>
              <CommandGroup>
                {/* Opção "Todas" */}
                <CommandItem
                  onSelect={() => {
                    setCurrentOrg(null)
                    setOpen(false)
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      !currentOrg ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div>
                    <div className="font-medium">Todas as Organizações</div>
                    <div className="text-xs text-muted-foreground">Visão geral</div>
                  </div>
                </CommandItem>
                
                {organizations.map((org) => (
                  <CommandItem
                    key={org.id}
                    onSelect={() => {
                      setCurrentOrg(org)
                      setOpen(false)
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        currentOrg?.id === org.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{org.name}</span>
                      {org.cnpj && (
                        <span className="text-xs text-muted-foreground">
                          {formatCNPJ(org.cnpj)}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between bg-[var(--qs-muted)] border-[var(--qs-border)] hover:bg-[var(--qs-muted)]/80 h-auto min-h-[44px] py-2 max-w-full',
            className
          )}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
            <Building2 className="h-4 w-4 shrink-0 text-[var(--qs-green)]" />
            <div className="flex flex-col items-start flex-1 min-w-0 overflow-hidden max-w-full">
              <span 
                className="font-medium text-xs leading-[1.3] text-left block" 
                style={{ 
                  wordBreak: 'normal', 
                  overflowWrap: 'break-word',
                  whiteSpace: 'normal',
                  maxWidth: '150px',
                  width: '100%',
                  wordWrap: 'break-word'
                }}
              >
                {currentOrg ? currentOrg.name : 'Todas as Organizações'}
              </span>
              {currentOrg?.cnpj && (
                <span className="text-[9px] text-[var(--qs-text-tertiary)] mt-0.5 whitespace-nowrap">
                  {formatCNPJ(currentOrg.cnpj)}
                </span>
              )}
            </div>
          </div>
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0 bg-card" align="start">
        <Command>
          <CommandInput placeholder="Buscar organização..." className="text-xs" />
          <CommandList>
            <CommandEmpty className="text-xs py-6">Nenhuma organização encontrada.</CommandEmpty>
            <CommandGroup>
              {/* Opção "Todas" */}
              <CommandItem
                onSelect={() => {
                  setCurrentOrg(null)
                  setOpen(false)
                }}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    'mr-2 h-3.5 w-3.5 shrink-0',
                    !currentOrg ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <div>
                  <div className="font-medium text-xs">Todas as Organizações</div>
                  <div className="text-[10px] text-muted-foreground">Visão geral</div>
                </div>
              </CommandItem>
              
              {organizations.map((org) => (
                <CommandItem
                  key={org.id}
                  onSelect={() => {
                    setCurrentOrg(org)
                    setOpen(false)
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      'mr-2 h-3.5 w-3.5 shrink-0',
                      currentOrg?.id === org.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-medium text-xs break-words">{org.name}</span>
                    {org.cnpj && (
                      <span className="text-[10px] text-muted-foreground">
                        {formatCNPJ(org.cnpj)}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

