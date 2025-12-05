'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'react-hot-toast'
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'

interface Template {
  id: string
  name: string
  description: string
  tableName: string
  sqlTableCreated: boolean
  fields: any[]
}

interface AssignTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string
  organizationId: string
  onSuccess: () => void
}

export function AssignTemplateDialog({
  open,
  onOpenChange,
  documentId,
  organizationId,
  onSuccess,
}: AssignTemplateDialogProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)

  useEffect(() => {
    if (open) {
      loadTemplates()
    }
  }, [open])

  const loadTemplates = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/templates?organizationId=${organizationId}`)
      
      if (!response.ok) {
        throw new Error('Erro ao carregar templates')
      }

      const data = await response.json()
      // Filtrar apenas templates de documentos
      const docTemplates = data.templates.filter((t: any) => t.baseType === 'document' && t.isActive)
      setTemplates(docTemplates)
    } catch (error) {
      console.error('Error loading templates:', error)
      toast.error('Erro ao carregar templates')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedTemplateId) {
      toast.error('Selecione um template')
      return
    }

    setIsAssigning(true)
    try {
      const response = await fetch(`/api/documents/${documentId}/assign-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplateId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao associar template')
      }

      toast.success('Template associado com sucesso!')
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Error assigning template:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao associar template')
    } finally {
      setIsAssigning(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Escolher Template de Normalização</DialogTitle>
          <DialogDescription>
            Selecione o template que define como os dados deste documento serão estruturados
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Nenhum template disponível
              </p>
              <Button
                variant="outline"
                onClick={() => window.open('/templates/novo', '_blank')}
              >
                Criar Novo Template
              </Button>
            </div>
          ) : (
            <RadioGroup value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <div className="space-y-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`border rounded-lg p-4 cursor-pointer transition ${
                      selectedTemplateId === template.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedTemplateId(template.id)}
                  >
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value={template.id} id={template.id} />
                      <div className="flex-1">
                        <Label
                          htmlFor={template.id}
                          className="font-medium cursor-pointer"
                        >
                          {template.name}
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {template.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <span className="text-muted-foreground">
                            Tabela: <span className="font-mono">{template.tableName}</span>
                          </span>
                          <span className="text-muted-foreground">
                            {template.fields?.length || 0} campos
                          </span>
                          {template.sqlTableCreated ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              Tabela criada
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-amber-600">
                              <AlertTriangle className="h-3 w-3" />
                              Tabela será criada
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedTemplateId || isAssigning}
          >
            {isAssigning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Associando...
              </>
            ) : (
              'Associar Template'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

