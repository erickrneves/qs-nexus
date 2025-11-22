import { SettingsLayout } from '@/components/settings/settings-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileCode, Database } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Visão Geral</h2>
          <p className="text-muted-foreground">
            Escolha uma seção de configuração para começar
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileCode className="h-5 w-5" />
                <CardTitle>Classificação</CardTitle>
              </div>
              <CardDescription>
                Configure modelos de IA, prompts do sistema e funções de extração para classificação de documentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/settings/classification">Gerenciar Classificação</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                <CardTitle>Schema de Template</CardTitle>
              </div>
              <CardDescription>
                Configure o schema dinâmico de templates com campos personalizáveis e tipos Zod
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/settings/template-schema">Gerenciar Schema</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </SettingsLayout>
  )
}

