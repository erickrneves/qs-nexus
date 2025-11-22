'use client'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getModelTokenLimits, parseClassificationModel } from '@/lib/types/classification-models'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ModelSelectorProps {
  provider: 'openai' | 'google'
  modelName: string
  onProviderChange: (provider: 'openai' | 'google') => void
  onModelChange: (modelName: string) => void
}

const openaiModels: { value: string; label: string }[] = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
]

const googleModels: { value: string; label: string }[] = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite' },
]

export function ModelSelector({
  provider,
  modelName,
  onProviderChange,
  onModelChange,
}: ModelSelectorProps) {
  const models = provider === 'openai' ? openaiModels : googleModels

  // Tenta obter limites de tokens do modelo
  let tokenLimits: { maxInputTokens: number; maxOutputTokens: number } | null = null
  try {
    const model = parseClassificationModel(modelName, provider)
    tokenLimits = getModelTokenLimits(model)
  } catch {
    // Modelo não encontrado, ignora
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="provider">Provider</Label>
        <Select value={provider} onValueChange={onProviderChange}>
          <SelectTrigger id="provider">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="openai">OpenAI</SelectItem>
            <SelectItem value="google">Google (Gemini)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="model">Modelo</Label>
        <Select value={modelName} onValueChange={onModelChange}>
          <SelectTrigger id="model">
            <SelectValue placeholder="Selecione um modelo" />
          </SelectTrigger>
          <SelectContent>
            {models.map(model => (
              <SelectItem key={model.value} value={model.value}>
                {model.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {tokenLimits && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Limites de Tokens</CardTitle>
            <CardDescription className="text-xs">
              Limites máximos para este modelo
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Input:</span>
                <span className="font-medium">{tokenLimits.maxInputTokens.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Output:</span>
                <span className="font-medium">{tokenLimits.maxOutputTokens.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

