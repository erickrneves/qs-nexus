'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, Workflow, Zap, Settings2, Sparkles, Key, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'

export default function AISettingsPage() {
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('gpt-4-turbo-preview')
  const [testing, setTesting] = useState(false)
  const [keyStatus, setKeyStatus] = useState<'unknown' | 'valid' | 'invalid'>('unknown')

  // Carregar configurações do .env.local
  useEffect(() => {
    // Não mostramos a key real por segurança, apenas indicamos se existe
    const hasKey = process.env.NEXT_PUBLIC_HAS_OPENAI_KEY === 'true'
    if (hasKey) {
      setKeyStatus('valid')
    }
  }, [])

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      toast.error('Digite uma API Key primeiro')
      return
    }

    setTesting(true)
    try {
      // Testar conexão com OpenAI
      const response = await fetch('/api/ai/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      })

      if (response.ok) {
        setKeyStatus('valid')
        toast.success('Conexão com OpenAI validada!')
      } else {
        setKeyStatus('invalid')
        toast.error('API Key inválida')
      }
    } catch (error) {
      setKeyStatus('invalid')
      toast.error('Erro ao testar conexão')
    } finally {
      setTesting(false)
    }
  }

  const handleSaveKey = () => {
    toast.error('Configuração deve ser feita diretamente no arquivo .env.local')
    toast(
      'Adicione OPENAI_API_KEY=sua_chave_aqui no arquivo .env.local na raiz do projeto',
      { duration: 6000, icon: '📝' }
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configurações de IA</h1>
            <p className="text-muted-foreground">
              Configure modelos de IA, workflows e automações inteligentes
            </p>
          </div>
        </div>
      </div>

      {/* Grid de Configurações */}
      <div className="grid gap-6">
        {/* OpenAI API Key */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              OpenAI API Key
              {keyStatus === 'valid' && (
                <Badge variant="default" className="ml-2">
                  <Check className="h-3 w-3 mr-1" />
                  Configurada
                </Badge>
              )}
              {keyStatus === 'invalid' && (
                <Badge variant="destructive" className="ml-2">
                  <X className="h-3 w-3 mr-1" />
                  Inválida
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Configure sua chave da API OpenAI para usar recursos de IA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <div className="flex gap-2">
                <Input
                  id="api-key"
                  type="password"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="font-mono text-sm"
                />
                <Button onClick={handleTestConnection} disabled={testing || !apiKey.trim()}>
                  {testing ? 'Testando...' : 'Testar'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                A chave deve ser configurada no arquivo <code className="bg-muted px-1 py-0.5 rounded">.env.local</code>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Modelo</Label>
              <select
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="gpt-4-turbo-preview">GPT-4 Turbo (Recomendado)</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Mais rápido)</option>
              </select>
              <p className="text-xs text-muted-foreground">
                GPT-4 Turbo oferece melhor qualidade para análise de documentos
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Como Configurar
              </h4>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Obtenha sua API Key em <a href="https://platform.openai.com/api-keys" target="_blank" className="underline">platform.openai.com</a></li>
                <li>Crie ou edite o arquivo <code className="bg-white dark:bg-black px-1 py-0.5 rounded">.env.local</code> na raiz do projeto</li>
                <li>Adicione: <code className="bg-white dark:bg-black px-1 py-0.5 rounded">OPENAI_API_KEY=sua_chave_aqui</code></li>
                <li>Reinicie o servidor de desenvolvimento (<code className="bg-white dark:bg-black px-1 py-0.5 rounded">npm run dev</code>)</li>
              </ol>
            </div>

            {keyStatus === 'valid' && (
              <div className="bg-green-50 dark:bg-green-950 p-3 rounded border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✓ OpenAI configurada! Você já pode usar o recurso "Criar Template com IA"
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Outras Configurações */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Workflows */}
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5 text-primary" />
                Workflows e Orquestrações
              </CardTitle>
              <CardDescription>
                Configure fluxos de automação e orquestrações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 space-y-3">
                <Settings2 className="h-12 w-12 text-muted-foreground opacity-50" />
                <p className="text-xs text-muted-foreground text-center">
                  Em desenvolvimento
                </p>
                <Button size="sm" disabled variant="outline">
                  Gerenciar Workflows
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Agentes */}
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Agentes e Automações
              </CardTitle>
              <CardDescription>
                Configure agentes inteligentes e regras de automação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 space-y-3">
                <Settings2 className="h-12 w-12 text-muted-foreground opacity-50" />
                <p className="text-xs text-muted-foreground text-center">
                  Em desenvolvimento
                </p>
                <Button size="sm" disabled variant="outline">
                  Configurar Agentes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Recursos Disponíveis
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>✓ Criação automática de templates com IA</li>
                <li>✓ Análise inteligente de documentos</li>
                <li>✓ Extração de dados com GPT-4</li>
                <li>⏳ Workflows personalizados (em breve)</li>
                <li>⏳ Agentes especializados (em breve)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
