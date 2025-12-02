'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface Organization {
  id: string
  name: string
  cnpj: string | null
  slug: string
  logoUrl: string | null
  isActive: boolean
}

interface OrganizationContextType {
  currentOrg: Organization | null
  organizations: Organization[]
  isLoading: boolean
  setCurrentOrg: (org: Organization | null) => void
  refreshOrganizations: () => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [currentOrg, setCurrentOrgState] = useState<Organization | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchOrganizations = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/organizations')
      if (response.ok) {
        const data = await response.json()
        setOrganizations(data.organizations || [])
        
        // Se não tem organização selecionada, selecionar a primeira
        if (!currentOrg && data.organizations && data.organizations.length > 0) {
          const savedOrgId = localStorage.getItem('selectedOrganizationId')
          const savedOrg = data.organizations.find((org: Organization) => org.id === savedOrgId)
          setCurrentOrgState(savedOrg || data.organizations[0])
        }
      }
    } catch (error) {
      console.error('Erro ao carregar organizações:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const setCurrentOrg = (org: Organization | null) => {
    setCurrentOrgState(org)
    if (org) {
      localStorage.setItem('selectedOrganizationId', org.id)
    } else {
      localStorage.removeItem('selectedOrganizationId')
    }
  }

  useEffect(() => {
    fetchOrganizations()
  }, [])

  return (
    <OrganizationContext.Provider
      value={{
        currentOrg,
        organizations,
        isLoading,
        setCurrentOrg,
        refreshOrganizations: fetchOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider')
  }
  return context
}

