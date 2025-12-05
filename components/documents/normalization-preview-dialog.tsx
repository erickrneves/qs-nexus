'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { NormalizedDataPreview } from './normalized-data-preview'
import { HierarchicalPreview } from './hierarchical-preview'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Sparkles,
  Edit,
  X,
  Loader2,
  FileText,
} from 'lucide-react'

interface NormalizationPreviewDialogProps {
  open: boolean
  onClose: () => void
  documentId: string
  draftData: Record<string, any>
  templateFields?: any[]
  confidenceScore?: number
  onApprove: () => Promise<void>
  onReprocess: () => void
}

export function NormalizationPreviewDialog({
  open,
  onClose,
  documentId,
  draftData,
  templateFields,
  confidenceScore = 0,
  onApprove,
  onReprocess,
}: NormalizationPreviewDialogProps) {
  const [isApproving, setIsApproving] = useState(false)

  if (!open) return null

  const handleApprove = async () => {
    setIsApproving(true)
    try {
      await onApprove()
      onClose()
    } catch (error) {
      console.error('Erro ao aprovar:', error)
    } finally {
      setIsApproving(false)
    }
  }

  const getConfidenceInfo = (score: number) => {
    if (score >= 90) return { color: 'bg-green-500', text: 'Excelente', icon: CheckCircle }
    if (score >= 70) return { color: 'bg-yellow-500', text: 'Bom', icon: AlertTriangle }
    return { color: 'bg-red-500', text: 'Revisar', icon: XCircle }
  }

  const confidenceInfo = getConfidenceInfo(confidenceScore)
  const ConfidenceIcon = confidenceInfo.icon

  const totalFields = Object.keys(draftData || {}).length
  const filledFields = Object.values(draftData || {}).filter(v => 
    v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)
  ).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Revisar Dados Extraídos
              </h2>
              <p className="text-muted-foreground mt-1">
                Confira os dados antes de salvar definitivamente
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Score de Confiança */}
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${confidenceInfo.color}`} />
              <span className="font-medium">Confiança:</span>
              <span className="text-2xl font-bold">{confidenceScore}%</span>
              <Badge variant="outline" className="ml-2">
                <ConfidenceIcon className="h-3 w-3 mr-1" />
                {confidenceInfo.text}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{filledFields}/{totalFields} campos preenchidos</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {draftData && Object.keys(draftData).length > 0 ? (
            <NormalizedDataPreview 
              data={draftData} 
              templateFields={templateFields}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-yellow-500" />
                  <p>Nenhum dado foi extraído</p>
                  <p className="text-sm mt-2">Tente reprocessar com um template diferente</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {confidenceScore < 70 && (
                <div className="flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Confiança baixa - Recomendamos revisar os dados</span>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onReprocess}>
                <Edit className="h-4 w-4 mr-2" />
                Reprocessar
              </Button>
              <Button 
                onClick={handleApprove}
                disabled={isApproving || filledFields === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Aprovando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aprovar e Salvar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

