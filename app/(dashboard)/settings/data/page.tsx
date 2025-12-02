'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileCode, Database, Settings2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function DataSettingsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Configurações de Dados</h1>
        <p className="text-muted-foreground">
          Gerencie classificações, schemas e regras de normalização de dados
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="classification" className="flex-1">
        <TabsList className="grid w-full max-w-lg grid-cols-2 bg-muted p-1">
          <TabsTrigger 
            value="classification" 
            className="flex items-center gap-2"
          >
            <FileCode className="h-4 w-4" />
            Classificação
          </TabsTrigger>
          <TabsTrigger 
            value="schema" 
            className="flex items-center gap-2"
          >
            <Database className="h-4 w-4" />
            Schema de Template
          </TabsTrigger>
        </TabsList>

        <TabsContent value="classification" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode className="h-5 w-5" />
                Configurações de Classificação
              </CardTitle>
              <CardDescription>
                Configure modelos de IA e prompts para classificação de documentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Settings2 className="h-16 w-16 text-muted-foreground opacity-50" />
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    As configurações de classificação foram movidas para páginas específicas por tipo de documento
                  </p>
                  <div className="flex gap-2 justify-center pt-2">
                    <Button asChild variant="outline">
                      <Link href="/settings/classification">
                        Gerenciar Classificações
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/settings/template-schema">
                        Gerenciar Schemas
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schema" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Schemas de Template
              </CardTitle>
              <CardDescription>
                Defina campos dinâmicos para extração estruturada de dados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Settings2 className="h-16 w-16 text-muted-foreground opacity-50" />
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Configure schemas personalizados para cada tipo de documento
                  </p>
                  <div className="flex gap-2 justify-center pt-2">
                    <Button asChild>
                      <Link href="/settings/template-schema">
                        Acessar Schemas
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

