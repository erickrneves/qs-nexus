'use client'

import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  X,
  FileText,
  Database,
  FileSpreadsheet,
} from 'lucide-react'

export type FileStatus = 'all' | 'pending' | 'processing' | 'completed' | 'failed' | 'rejected'
export type FileType = 'all' | 'docx' | 'pdf' | 'txt' | 'sped' | 'csv'
export type SortBy = 'fileName' | 'createdAt' | 'updatedAt' | 'wordsCount' | 'status'
export type SortOrder = 'asc' | 'desc'

interface FileFiltersProps {
  // Valores atuais
  search?: string
  status?: FileStatus
  fileType?: FileType
  sortBy?: SortBy
  sortOrder?: SortOrder

  // Callbacks
  onSearchChange?: (value: string) => void
  onStatusChange?: (value: FileStatus) => void
  onFileTypeChange?: (value: FileType) => void
  onSortByChange?: (value: SortBy) => void
  onSortOrderChange?: (value: SortOrder) => void
  onClearFilters?: () => void

  // Contadores
  totalCount?: number
  filteredCount?: number
}

const statusLabels: Record<FileStatus, string> = {
  all: 'Todos',
  pending: 'Pendente',
  processing: 'Processando',
  completed: 'Completo',
  failed: 'Falhou',
  rejected: 'Rejeitado',
}

const fileTypeLabels: Record<FileType, string> = {
  all: 'Todos',
  docx: 'DOCX',
  pdf: 'PDF',
  txt: 'TXT',
  sped: 'SPED',
  csv: 'CSV',
}

const sortByLabels: Record<SortBy, string> = {
  fileName: 'Nome do Arquivo',
  createdAt: 'Data de Criação',
  updatedAt: 'Última Atualização',
  wordsCount: 'Número de Palavras',
  status: 'Status',
}

export function FileFilters({
  search = '',
  status = 'all',
  fileType = 'all',
  sortBy = 'createdAt',
  sortOrder = 'desc',
  onSearchChange,
  onStatusChange,
  onFileTypeChange,
  onSortByChange,
  onSortOrderChange,
  onClearFilters,
  totalCount = 0,
  filteredCount = 0,
}: FileFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const hasActiveFilters = search !== '' || status !== 'all' || fileType !== 'all'
  const activeFiltersCount = [
    search !== '',
    status !== 'all',
    fileType !== 'all',
  ].filter(Boolean).length

  return (
    <div className="space-y-4">
      {/* Main Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar arquivos..."
            value={search}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="pl-9"
          />
          {search && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => onSearchChange?.('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Quick Status Filter */}
        <Select value={status} onValueChange={(value: FileStatus) => onStatusChange?.(value)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Advanced Filters Button */}
        <Popover open={showAdvanced} onOpenChange={setShowAdvanced}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge
                  variant="default"
                  className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">Filtros Avançados</h4>
                
                {/* File Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de Arquivo</label>
                  <Select value={fileType} onValueChange={(value: FileType) => onFileTypeChange?.(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(fileTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          <div className="flex items-center gap-2">
                            {value === 'docx' && <FileText className="h-3 w-3" />}
                            {value === 'pdf' && <FileText className="h-3 w-3" />}
                            {value === 'sped' && <Database className="h-3 w-3" />}
                            {value === 'csv' && <FileSpreadsheet className="h-3 w-3" />}
                            {label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    onClearFilters?.()
                    setShowAdvanced(false)
                  }}
                >
                  <X className="h-3 w-3 mr-2" />
                  Limpar Filtros
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Sort */}
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={(value: SortBy) => onSortByChange?.(value)}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(sortByLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => onSortOrderChange?.(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Results Counter */}
      {(hasActiveFilters || search) && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Mostrando <strong className="text-foreground">{filteredCount}</strong> de{' '}
            <strong className="text-foreground">{totalCount}</strong> arquivos
          </span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-auto p-0 text-primary hover:text-primary/80"
            >
              Limpar todos os filtros
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

