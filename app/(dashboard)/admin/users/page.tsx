'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Plus, UserPlus, Shield } from 'lucide-react'

export default function UsersPage() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Usuários
          </h1>
          <p className="text-muted-foreground">
            Gerencie usuários e permissões de acesso ao sistema
          </p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Placeholder */}
      <Card className="border-dashed">
        <CardContent className="pt-12 pb-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Shield className="h-16 w-16 text-muted-foreground opacity-50" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Gerenciamento de Usuários</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Esta funcionalidade está em desenvolvimento. Em breve você poderá criar, 
                editar e gerenciar usuários, definir roles e permissões por organização.
              </p>
            </div>
            <div className="flex gap-2 pt-4">
              <Button disabled variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Criar Usuário
              </Button>
              <Button disabled variant="outline">
                Gerenciar Permissões
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Roles Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Shield className="h-3 w-3 text-red-500" />
                <span className="font-medium">Admin</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-3 w-3 text-blue-500" />
                <span className="font-medium">Member</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-3 w-3 text-gray-500" />
                <span className="font-medium">Viewer</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Permissões</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Controle granular de acesso por organização e funcionalidade
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Multi-tenant</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Usuários podem ter diferentes roles em diferentes organizações
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

