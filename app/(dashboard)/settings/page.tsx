'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, Building2, Users, Shield, Bell, Palette, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function SettingsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configurações da Aplicação</h1>
            <p className="text-muted-foreground">
              Gerencie organizações, usuários e configurações gerais do sistema
            </p>
          </div>
        </div>
      </div>

      {/* Grid de Configurações */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Organizações */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Organizações
            </CardTitle>
            <CardDescription>
              Gerencie organizações e clientes do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/admin/organizations">
                Gerenciar Organizações
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Usuários */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Usuários
            </CardTitle>
            <CardDescription>
              Gerencie usuários e permissões de acesso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/admin/users">
                Gerenciar Usuários
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Segurança */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              Segurança
            </CardTitle>
            <CardDescription>
              Configurações de autenticação e segurança
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled variant="outline" className="w-full">
              Em Breve
            </Button>
          </CardContent>
        </Card>

        {/* Notificações */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              Notificações
            </CardTitle>
            <CardDescription>
              Configure preferências de notificações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled variant="outline" className="w-full">
              Em Breve
            </Button>
          </CardContent>
        </Card>

        {/* Aparência */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-muted-foreground" />
              Aparência
            </CardTitle>
            <CardDescription>
              Personalize tema e interface do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled variant="outline" className="w-full">
              Em Breve
            </Button>
          </CardContent>
        </Card>

        {/* Regionalização */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-muted-foreground" />
              Regionalização
            </CardTitle>
            <CardDescription>
              Idioma, fuso horário e formatos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled variant="outline" className="w-full">
              Em Breve
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <p className="text-sm font-medium">Outras Configurações</p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/settings/data">
                  Configurações de Dados
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/settings/ai">
                  Configurações de IA
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/settings/classification">
                  Classificação de Documentos
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/settings/template-schema">
                  Schemas de Template
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
