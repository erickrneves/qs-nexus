'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useOrganization } from '@/lib/contexts/organization-context'
import { toast } from 'react-hot-toast'
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Database,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'

interface Template {
  id: string
  name: string
  description: string
  baseType: 'document' | 'sped' | 'csv'
  category: string
  tableName: string
  fields: any[]
  sqlTableCreated: boolean
  documentsProcessed: number
  isActive: boolean
  isDefaultForBaseType: boolean
  createdAt: string
}

export default function TemplatesPage() {
  const { currentOrg } = useOrganization()
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (currentOrg?.id) {
      loadTemplates()
    }
  }, [currentOrg])

  const loadTemplates = async () => {
    if (!currentOrg?.id) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/templates?organizationId=${currentOrg.id}`)
      
      if (!response.ok) {
        throw new Error('Erro ao carregar templates')
      }

      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error('Error loading templates:', error)
      toast.error('Erro ao carregar templates')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (templateId: string) => {
    if (!confirm('Tem certeza que deseja deletar este template?')) return

    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Template deletado!')
        loadTemplates()
      } else {
        toast.error('Erro ao deletar template')
      }
    } catch (error) {
      toast.error('Erro ao deletar template')
    }
  }

  const getBaseTypeLabel = (baseType: string) => {
    switch (baseType) {
      case 'document': return 'Documentos'
      case 'sped': return 'SPED'
      case 'csv': return 'CSV'
      default: return baseType
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <FileText className="h-8 w-8" />
            Templates de Normalização
          </h1>
          <p className="text-muted-foreground">
            Gerencie templates que definem como os dados serão estruturados
          </p>
        </div>
        <Link href="/templates/novo">
          <Button size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Novo Template
          </Button>
        </Link>
      </div>

      {/* Alerta se não tiver organização */}
      {!currentOrg && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
          <CardContent className="pt-6">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              ⚠️ Selecione uma organização no menu lateral para visualizar templates
            </p>
          </CardContent>
        </Card>
      )}

      {currentOrg && (
        <>
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total de Templates</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{templates.length}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Templates Ativos</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {templates.filter(t => t.isActive).length}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Documentos Processados</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {templates.reduce((sum, t) => sum + (t.documentsProcessed || 0), 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Templates Disponíveis</CardTitle>
              <CardDescription>
                {templates.length} template(s) encontrado(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-1">Nenhum template encontrado</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Crie seu primeiro template para começar
                  </p>
                  <Link href="/templates/novo">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Template
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{template.name}</h3>
                            {template.isDefaultForBaseType && (
                              <Badge variant="outline" className="text-xs">
                                Padrão
                              </Badge>
                            )}
                            {!template.isActive && (
                              <Badge variant="secondary" className="text-xs">
                                Inativo
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">
                            {template.description}
                          </p>

                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Badge variant="outline">
                                {getBaseTypeLabel(template.baseType)}
                              </Badge>
                            </div>

                            {template.category && (
                              <div className="text-muted-foreground">
                                Categoria: <span className="font-medium">{template.category}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-1">
                              <Database className="h-3 w-3" />
                              <span className="text-muted-foreground">
                                Tabela: <span className="font-mono text-xs">{template.tableName}</span>
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span className="text-green-600 dark:text-green-400 text-xs">
                                JSONB (escalável)
                              </span>
                            </div>

                            <div className="text-muted-foreground">
                              {template.fields?.length || 0} campos
                            </div>

                            <div className="text-muted-foreground">
                              {template.documentsProcessed || 0} doc(s) processados
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Link href={`/templates/${template.id}`}>
                            <Button variant="outline" size="sm">
                              <Edit2 className="h-4 w-4 mr-2" />
                              Editar
                            </Button>
                          </Link>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(template.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

