'use client'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface CodeEditorProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  description?: string
  defaultCode?: string
  showDefault?: boolean
  rows?: number
}

export function CodeEditor({
  label,
  value,
  onChange,
  placeholder,
  description,
  defaultCode,
  showDefault = false,
  rows = 12,
}: CodeEditorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="code-editor">{label}</Label>
        {showDefault && defaultCode && (
          <button
            type="button"
            onClick={() => onChange(defaultCode)}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Usar função padrão
          </button>
        )}
      </div>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <Textarea
        id="code-editor"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="font-mono text-sm"
      />
      {showDefault && defaultCode && (
        <Card className="mt-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Função Padrão</CardTitle>
            <CardDescription className="text-xs">
              Função de extração padrão usada quando nenhuma função customizada é fornecida
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <pre className="text-xs font-mono bg-muted p-3 rounded overflow-x-auto">
              <code>{defaultCode}</code>
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

