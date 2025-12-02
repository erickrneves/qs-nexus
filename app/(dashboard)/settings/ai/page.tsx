'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, Workflow, Zap, Settings2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AISettingsPage() {
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
      <div className="grid gap-6 md:grid-cols-2">
        {/* Modelos de IA */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Modelos de IA
            </CardTitle>
            <CardDescription>
              Configure provedores de IA e parâmetros de geração
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <Settings2 className="h-12 w-12 text-muted-foreground opacity-50" />
              <p className="text-xs text-muted-foreground text-center">
                Em desenvolvimento
              </p>
              <Button size="sm" disabled variant="outline">
                Configurar Modelos
              </Button>
            </div>
          </CardContent>
        </Card>

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

        {/* Prompts Personalizados */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Prompts para Análises
            </CardTitle>
            <CardDescription>
              Biblioteca de prompts para análises especializadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <Settings2 className="h-12 w-12 text-muted-foreground opacity-50" />
              <p className="text-xs text-muted-foreground text-center">
                Em desenvolvimento
              </p>
              <Button size="sm" disabled variant="outline">
                Gerenciar Prompts
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Funcionalidades em Desenvolvimento
              </p>
              <p className="text-xs text-muted-foreground">
                As configurações avançadas de IA estão sendo implementadas. 
                Em breve você poderá configurar modelos personalizados, criar workflows 
                complexos e definir agentes especializados para suas análises.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

