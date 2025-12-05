'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Building2, 
  DollarSign, 
  Calendar,
  CheckCircle,
  XCircle,
  List,
  AlertCircle,
} from 'lucide-react'

interface NormalizedDataPreviewProps {
  data: Record<string, any>
  templateFields?: Array<{
    fieldName: string
    fieldType: string
    displayName?: string
    description?: string
  }>
}

export function NormalizedDataPreview({ data, templateFields }: NormalizedDataPreviewProps) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p>Nenhum dado normalizado disponível</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderValue = (value: any, fieldType?: string): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground italic">Não informado</span>
    }

    // Boolean
    if (typeof value === 'boolean') {
      return value ? (
        <Badge className="bg-green-500">
          <CheckCircle className="h-3 w-3 mr-1" />
          Sim
        </Badge>
      ) : (
        <Badge variant="secondary">
          <XCircle className="h-3 w-3 mr-1" />
          Não
        </Badge>
      )
    }

    // Array
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-muted-foreground italic">Lista vazia</span>
      }

      return (
        <div className="space-y-2 mt-2">
          {value.map((item, index) => (
            <div key={index} className="bg-muted p-3 rounded-lg">
              {typeof item === 'object' ? (
                <div className="space-y-1">
                  {Object.entries(item).map(([key, val]) => (
                    <div key={key} className="flex items-start gap-2">
                      <span className="text-sm font-medium text-muted-foreground min-w-[120px]">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span className="text-sm flex-1">{String(val)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <List className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm">{String(item)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )
    }

    // Object
    if (typeof value === 'object') {
      return (
        <div className="bg-muted p-3 rounded-lg mt-2 space-y-1">
          {Object.entries(value).map(([key, val]) => (
            <div key={key} className="flex items-start gap-2">
              <span className="text-sm font-medium text-muted-foreground min-w-[120px]">
                {key.replace(/_/g, ' ')}:
              </span>
              <span className="text-sm flex-1">{String(val)}</span>
            </div>
          ))}
        </div>
      )
    }

    // Date
    if (fieldType === 'date' || /^\d{4}-\d{2}-\d{2}/.test(String(value))) {
      return (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{new Date(String(value)).toLocaleDateString('pt-BR')}</span>
        </div>
      )
    }

    // Number/Currency
    if (typeof value === 'number' || /^R\$/.test(String(value))) {
      return (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{String(value)}</span>
        </div>
      )
    }

    // Default: text
    return <span>{String(value)}</span>
  }

  const getFieldInfo = (fieldName: string) => {
    return templateFields?.find(f => f.fieldName === fieldName)
  }

  const getIcon = (fieldName: string) => {
    const lower = fieldName.toLowerCase()
    if (lower.includes('party') || lower.includes('parties') || lower.includes('empresa')) {
      return <Building2 className="h-4 w-4" />
    }
    if (lower.includes('fee') || lower.includes('payment') || lower.includes('valor')) {
      return <DollarSign className="h-4 w-4" />
    }
    if (lower.includes('date') || lower.includes('data')) {
      return <Calendar className="h-4 w-4" />
    }
    return <FileText className="h-4 w-4" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📊 Dados Extraídos
        </CardTitle>
        <CardDescription>
          {Object.keys(data).length} campo(s) extraído(s) do documento
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {Object.entries(data).map(([fieldName, value]) => {
            const fieldInfo = getFieldInfo(fieldName)
            const displayName = fieldInfo?.displayName || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            
            return (
              <div key={fieldName} className="border-b pb-4 last:border-0">
                <div className="flex items-start gap-2 mb-2">
                  <div className="text-primary mt-0.5">
                    {getIcon(fieldName)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">
                      {displayName}
                    </h4>
                    {fieldInfo?.description && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {fieldInfo.description}
                      </p>
                    )}
                    <div className="text-sm">
                      {renderValue(value, fieldInfo?.fieldType)}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

