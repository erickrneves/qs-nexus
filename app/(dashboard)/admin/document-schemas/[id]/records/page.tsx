'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Database, Download, ExternalLink, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface DocumentSchema {
  id: string
  name: string
  tableName: string
  fields: Array<{
    fieldName: string
    displayName: string
    fieldType: string
    isRequired: boolean
  }>
}

interface Record {
  id: string
  extracted_at: string
  confidence_score: number
  source_file_path: string
  [key: string]: any
}

export default function SchemaRecordsPage() {
  const params = useParams()
  const router = useRouter()
  
  const [schema, setSchema] = useState<DocumentSchema | null>(null)
  const [records, setRecords] = useState<Record[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalRecords, setTotalRecords] = useState(0)
  const pageSize = 25

  useEffect(() => {
    if (params.id) {
      loadSchema()
      loadRecords()
    }
  }, [params.id, page])

  const loadSchema = async () => {
    try {
      const res = await fetch(`/api/admin/document-schemas/${params.id}`)
      if (!res.ok) throw new Error('Erro ao carregar schema')
      
      const data = await res.json()
      setSchema(data.schema || data)
    } catch (error: any) {
      toast.error(error.message || 'Erro ao carregar schema')
    }
  }

  const loadRecords = async () => {
    setLoading(true)
    try {
      const offset = page * pageSize
      const res = await fetch(`/api/admin/schemas/${params.id}/records?limit=${pageSize}&offset=${offset}`)
      if (!res.ok) throw new Error('Erro ao carregar registros')
      
      const data = await res.json()
      setRecords(data.records || [])
      setTotalRecords(data.total || data.records?.length || 0)
    } catch (error: any) {
      toast.error(`Erro ao carregar registros: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (!records.length) return

    // Gerar CSV
    const customFields = schema?.fields.map(f => f.fieldName) || []
    const headers = ['Data Extração', 'Confiança', 'Arquivo', ...customFields]
    const csv = [
      headers.join(','),
      ...records.map(r => [
        new Date(r.extracted_at).toLocaleString('pt-BR'),
        r.confidence_score,
        r.source_file_path,
        ...customFields.map(f => JSON.stringify(r[f] || ''))
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${schema?.tableName}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()

    toast.success(`${records.length} registros exportados para CSV`)
  }

  const formatFieldValue = (value: any, fieldType: string) => {
    if (value === null || value === undefined) return '-'
    
    switch (fieldType) {
      case 'date':
        return new Date(value).toLocaleDateString('pt-BR')
      case 'numeric':
        return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(value)
      case 'boolean':
        return value ? '✓ Sim' : '✗ Não'
      default:
        return String(value)
    }
  }

  if (!schema) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  const customFields = schema.fields || []
  const totalPages = Math.ceil(totalRecords / pageSize)

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin/document-schemas')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Schemas
        </Button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Database className="h-8 w-8 text-blue-600" />
              {schema.name}
            </h1>
            <p className="text-gray-600 mt-2">
              Tabela: <code className="bg-gray-100 px-2 py-0.5 rounded font-mono text-sm">{schema.tableName}</code>
            </p>
            <p className="text-gray-500 mt-1">
              {totalRecords} registro(s) encontrado(s)
            </p>
          </div>

          <Button onClick={handleExport} disabled={records.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Tabela de Registros */}
      <Card>
        <CardHeader>
          <CardTitle>Dados Extraídos</CardTitle>
          <CardDescription>
            Registros extraídos automaticamente pela IA e salvos na tabela SQL
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-3 text-gray-600">Carregando registros...</span>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum registro encontrado</h3>
              <p className="text-gray-600">
                Faça upload de documentos com este schema para ver os dados extraídos aqui.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">Data/Hora</TableHead>
                      <TableHead className="w-[100px]">Confiança</TableHead>
                      {customFields.slice(0, 5).map(field => (
                        <TableHead key={field.fieldName}>
                          {field.displayName}
                          {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                        </TableHead>
                      ))}
                      <TableHead className="w-[80px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map(record => (
                      <TableRow key={record.id}>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(record.extracted_at).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={record.confidence_score >= 0.9 ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {Math.round(record.confidence_score * 100)}%
                          </Badge>
                        </TableCell>
                        {customFields.slice(0, 5).map(field => (
                          <TableCell key={field.fieldName}>
                            {formatFieldValue(record[field.fieldName], field.fieldType)}
                          </TableCell>
                        ))}
                        <TableCell>
                          {record.processed_document_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/files/${record.processed_document_id}`)}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-gray-600">
                    Página {page + 1} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Informações Adicionais */}
      {records.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Campos do Schema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {customFields.map(field => (
                <div key={field.fieldName} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <Badge variant="outline" className="text-xs">
                    {field.fieldType}
                  </Badge>
                  <span className="font-medium">{field.displayName}</span>
                  {field.isRequired && <span className="text-red-500 text-xs">obrigatório</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

