'use client'

/**
 * Componente de Visualização de Resultados ECD
 * 
 * Exibe BP e DRE com análises horizontal e vertical
 */

import { useState, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, TrendingUp, TrendingDown, Search, Filter, X } from 'lucide-react'
import { ECDDataTable } from './ecd-data-table'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface ECDResultsViewerProps {
  spedFileId: string
  bp: any[]
  dre: any[]
  metadata: {
    anos: number[]
    empresa?: string
  }
}

export function ECDResultsViewer({ spedFileId, bp, dre, metadata }: ECDResultsViewerProps) {
  const [activeTab, setActiveTab] = useState('bp')
  const [searchTerm, setSearchTerm] = useState('')
  const [showOnlyWithMovement, setShowOnlyWithMovement] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const handleDownloadBP = async () => {
    try {
      const response = await fetch(`/api/sped/${spedFileId}/download-bp`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `BP_5_anos_${spedFileId}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Erro ao baixar BP:', error)
    }
  }

  const handleDownloadDRE = async () => {
    try {
      const response = await fetch(`/api/sped/${spedFileId}/download-dre`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `DRE_5_anos_${spedFileId}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Erro ao baixar DRE:', error)
    }
  }

  // Filtrar dados BP
  const filteredBP = useMemo(() => {
    let filtered = [...bp]

    // Filtro de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(conta => 
        conta.codCta?.toLowerCase().includes(term) ||
        conta.codCtaRef?.toLowerCase().includes(term) ||
        conta.ctaDescricao?.toLowerCase().includes(term)
      )
    }

    // Filtro de apenas com movimento
    if (showOnlyWithMovement) {
      filtered = filtered.filter(conta => {
        const saldos = conta.saldos || {}
        return Object.values(saldos).some((valor: any) => Math.abs(valor) > 0.01)
      })
    }

    return filtered
  }, [bp, searchTerm, showOnlyWithMovement])

  // Filtrar dados DRE
  const filteredDRE = useMemo(() => {
    let filtered = [...dre]

    // Filtro de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(conta => 
        conta.codCta?.toLowerCase().includes(term) ||
        conta.codCtaRef?.toLowerCase().includes(term) ||
        conta.ctaDescricao?.toLowerCase().includes(term)
      )
    }

    // Filtro de apenas com movimento
    if (showOnlyWithMovement) {
      filtered = filtered.filter(conta => {
        const saldos = conta.saldos || {}
        return Object.values(saldos).some((valor: any) => Math.abs(valor) > 0.01)
      })
    }

    return filtered
  }, [dre, searchTerm, showOnlyWithMovement])

  // Calcular totais BP
  const totaisBP = useMemo(() => {
    const totais: Record<string, number> = {}
    metadata.anos.forEach(ano => {
      const total = bp.reduce((sum, conta) => {
        return sum + (conta.saldos?.[ano] || 0)
      }, 0)
      totais[ano] = total
    })
    return totais
  }, [bp, metadata.anos])

  // Calcular totais DRE
  const totaisDRE = useMemo(() => {
    const totais: Record<string, number> = {}
    metadata.anos.forEach(ano => {
      const total = dre.reduce((sum, conta) => {
        return sum + (conta.saldos?.[ano] || 0)
      }, 0)
      totais[ano] = total
    })
    return totais
  }, [dre, metadata.anos])

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="bp">
              Balanço Patrimonial ({filteredBP.length}/{bp.length})
            </TabsTrigger>
            <TabsTrigger value="dre">
              DRE ({filteredDRE.length}/{dre.length})
            </TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowFilters(!showFilters)} 
              variant="outline" 
              size="sm"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            {activeTab === 'bp' && (
              <Button onClick={handleDownloadBP} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download BP.xlsx
              </Button>
            )}
            {activeTab === 'dre' && (
              <Button onClick={handleDownloadDRE} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download DRE.xlsx
              </Button>
            )}
          </div>
        </div>

        {/* Filtros */}
        {showFilters && (
          <div className="rounded-lg border p-4 bg-muted/20 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Filtros</h4>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setShowOnlyWithMovement(false)
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Buscar por código ou descrição</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Digite para buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="flex items-end">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="movement"
                    checked={showOnlyWithMovement}
                    onCheckedChange={setShowOnlyWithMovement}
                  />
                  <Label htmlFor="movement" className="cursor-pointer">
                    Apenas contas com movimento
                  </Label>
                </div>
              </div>
            </div>
          </div>
        )}

        <TabsContent value="bp" className="space-y-4">
          <div className="rounded-lg border p-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-2">Balanço Patrimonial - {metadata.anos.length} anos</h3>
                <p className="text-sm text-muted-foreground">
                  Contas patrimoniais (Ativo e Passivo) com análise horizontal e vertical.
                  Anos: {metadata.anos.join(', ')}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground mb-1">Total Geral:</div>
                <div className="font-mono text-sm font-semibold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(totaisBP[metadata.anos[metadata.anos.length - 1]] || 0)}
                </div>
              </div>
            </div>
          </div>
          
          <ECDDataTable
            data={filteredBP}
            anos={metadata.anos}
            tipo="BP"
          />
        </TabsContent>

        <TabsContent value="dre" className="space-y-4">
          <div className="rounded-lg border p-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-2">Demonstração do Resultado - {metadata.anos.length} anos</h3>
                <p className="text-sm text-muted-foreground">
                  Contas de resultado (Receitas e Despesas) com análise horizontal e vertical.
                  Anos: {metadata.anos.join(', ')}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground mb-1">Resultado:</div>
                <div className={`font-mono text-sm font-semibold ${
                  (totaisDRE[metadata.anos[metadata.anos.length - 1]] || 0) > 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(totaisDRE[metadata.anos[metadata.anos.length - 1]] || 0)}
                </div>
              </div>
            </div>
          </div>
          
          <ECDDataTable
            data={filteredDRE}
            anos={metadata.anos}
            tipo="DRE"
          />
        </TabsContent>
      </Tabs>

      {/* Legenda */}
      <div className="rounded-lg border p-4 bg-muted/20 space-y-3">
        <h4 className="font-medium mb-2 text-sm">Legenda:</h4>
        
        {/* Variações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3 w-3 text-green-600" />
            <span>Variação positiva (crescimento)</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-3 w-3 text-red-600" />
            <span>Variação negativa (redução)</span>
          </div>
          <div>
            <span className="font-medium">AH:</span> Análise Horizontal (variação entre anos)
          </div>
          <div>
            <span className="font-medium">AV:</span> Análise Vertical (% sobre total)
          </div>
        </div>
        
        {/* Níveis de Analiticidade */}
        <div className="border-t pt-3">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Classificação de Contas (inferida automaticamente):
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-blue-500 text-white flex items-center justify-center text-[9px] font-bold border-2 border-blue-600">1</div>
              <div className="flex flex-col">
                <span className="font-medium">Sintética</span>
                <span className="text-[10px] text-muted-foreground">Totais principais</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-indigo-400 text-white flex items-center justify-center text-[9px] font-semibold border-2 border-indigo-500">2</div>
              <div className="flex flex-col">
                <span className="font-medium">Agregadora</span>
                <span className="text-[10px] text-muted-foreground">Grupos</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-slate-300 text-slate-700 flex items-center justify-center text-[9px] font-medium border-2 border-slate-400">3</div>
              <div className="flex flex-col">
                <span className="font-medium">Intermediária</span>
                <span className="text-[10px] text-muted-foreground">Subgrupos</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gray-200 text-gray-600 flex items-center justify-center text-[9px] border-2 border-gray-300">4</div>
              <div className="flex flex-col">
                <span className="font-medium">Subgrupo</span>
                <span className="text-[10px] text-muted-foreground">Divisões</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gray-100 text-gray-500 flex items-center justify-center text-[9px] border-2 border-gray-200">5</div>
              <div className="flex flex-col">
                <span className="font-medium">Analítica</span>
                <span className="text-[10px] text-muted-foreground">Detalhes</span>
              </div>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-muted-foreground italic">
            ℹ️ Classificação baseada em: profundidade do código, existência de contas filhas, 
            palavras-chave no nome e verificação de totalização
          </div>
        </div>
      </div>
    </div>
  )
}

