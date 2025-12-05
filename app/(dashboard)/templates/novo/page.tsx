'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { FieldBuilder } from '@/components/templates/field-builder'
import { useOrganization } from '@/lib/contexts/organization-context'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Save, Plus } from 'lucide-react'
import type { NormalizationField } from '@/lib/db/schema/normalization-templates'

export default function NewTemplatePage() {
  const router = useRouter()
  const { currentOrg } = useOrganization()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    baseType: 'document' as 'document' | 'sped' | 'csv',
    category: '',
    tableName: '',
    isDefaultForBaseType: false,
  })

  const [fields, setFields] = useState<NormalizationField[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentOrg?.id) {
      toast.error('Selecione uma organização primeiro')
      return
    }

    if (!formData.name || !formData.tableName) {
      toast.error('Nome e nome da tabela são obrigatórios')
      return
    }

    if (fields.length === 0) {
      toast.error('Adicione pelo menos um campo')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          organizationId: currentOrg.id,
          fields,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao criar template')
      }

      const data = await response.json()
      toast.success('Template criado com sucesso!')
      router.push('/templates')
    } catch (error) {
      console.error('Error creating template:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao criar template')
    } finally {
      setIsSaving(false)
    }
  }

  // Gerar nome de tabela automaticamente
  const generateTableName = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9]+/g, '_') // Substitui caracteres especiais por _
      .replace(/^_+|_+$/g, '') // Remove _ no início e fim
  }

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      tableName: prev.tableName || generateTableName(name),
    }))
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/templates')}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            Novo Template de Normalização
          </h1>
          <p className="text-muted-foreground">
            Defina como os dados serão estruturados e armazenados
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>
              Dados de identificação do template
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Template *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex: Contratos de Prestação"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Ex: Jurídico, Contábil"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva para que serve este template..."
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="baseType">Tipo Base *</Label>
                <Select
                  value={formData.baseType}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, baseType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="document">Documentos</SelectItem>
                    <SelectItem value="sped">SPED</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tableName">Nome da Tabela *</Label>
                <Input
                  id="tableName"
                  value={formData.tableName}
                  onChange={(e) => setFormData(prev => ({ ...prev, tableName: e.target.value }))}
                  placeholder="Ex: contratos_prestacao"
                  required
                  pattern="[a-z0-9_]+"
                />
                <p className="text-xs text-muted-foreground">
                  Apenas letras minúsculas, números e underline
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isDefault"
                checked={formData.isDefaultForBaseType}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, isDefaultForBaseType: checked }))
                }
              />
              <Label htmlFor="isDefault" className="cursor-pointer">
                Template padrão para este tipo de documento
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Campos do Template */}
        <Card>
          <CardHeader>
            <CardTitle>Campos de Dados</CardTitle>
            <CardDescription>
              Defina quais campos serão armazenados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldBuilder
              fields={fields}
              onChange={setFields}
            />
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/templates')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>Salvando...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Criar Template
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

