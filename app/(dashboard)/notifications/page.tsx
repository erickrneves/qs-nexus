'use client'

import { useNotifications } from '@/hooks/use-notifications'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, Check, CheckCheck, Trash2, Inbox, Loader2 } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

const notificationTypeLabels: Record<string, { label: string; variant: 'default' | 'destructive' | 'success' | 'warning' }> = {
  upload_complete: { label: 'Upload Concluído', variant: 'success' },
  upload_failed: { label: 'Upload Falhou', variant: 'destructive' },
  sped_complete: { label: 'SPED Processado', variant: 'success' },
  sped_failed: { label: 'SPED Falhou', variant: 'destructive' },
  classification_complete: { label: 'Classificação Completa', variant: 'success' },
  classification_failed: { label: 'Classificação Falhou', variant: 'destructive' },
  workflow_complete: { label: 'Workflow Completo', variant: 'success' },
  workflow_failed: { label: 'Workflow Falhou', variant: 'destructive' },
  system: { label: 'Sistema', variant: 'default' },
  info: { label: 'Informação', variant: 'default' },
}

const notificationIcons: Record<string, string> = {
  upload_complete: '📄',
  upload_failed: '❌',
  sped_complete: '💼',
  sped_failed: '⚠️',
  classification_complete: '🏷️',
  classification_failed: '🚫',
  workflow_complete: '✅',
  workflow_failed: '❌',
  system: '🔔',
  info: 'ℹ️',
}

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteReadNotifications,
  } = useNotifications()

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Notificações</h1>
          <p className="text-muted-foreground">
            Acompanhe o status de processamentos e atualizações do sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          {notifications.filter(n => n.read).length > 0 && (
            <Button variant="outline" size="sm" onClick={deleteReadNotifications}>
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Lidas
            </Button>
          )}
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Marcar Todas como Lidas
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      {notifications.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notifications.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Não Lidas</CardTitle>
              <Bell className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{unreadCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lidas</CardTitle>
              <CheckCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notifications.length - unreadCount}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notifications List */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Todas as Notificações</CardTitle>
          <CardDescription>
            Histórico completo de notificações do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Carregando notificações...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Inbox className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhuma notificação</p>
              <p className="text-sm text-muted-foreground mt-2">
                Quando houver atualizações, você verá aqui
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map(notification => {
                const typeInfo = notificationTypeLabels[notification.type] || { label: notification.type, variant: 'default' as const }
                const icon = notificationIcons[notification.type] || '📢'

                return (
                  <Card
                    key={notification.id}
                    className={cn(
                      'transition-all hover:shadow-md',
                      !notification.read && 'border-primary bg-primary/5'
                    )}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="text-3xl shrink-0">{icon}</div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-base">
                                {notification.title}
                              </CardTitle>
                              {!notification.read && (
                                <div className="h-2 w-2 rounded-full bg-primary" />
                              )}
                            </div>
                            <Badge variant={typeInfo.variant as any} className="text-xs">
                              {typeInfo.label}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              title="Marcar como lida"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            title="Remover"
                            className="hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      {notification.data && (
                        <div className="text-xs text-muted-foreground">
                          {notification.data.fileName && (
                            <p>📎 Arquivo: {notification.data.fileName}</p>
                          )}
                          {notification.data.stats && (
                            <div className="mt-1 flex gap-3">
                              {notification.data.stats.accounts && (
                                <span>Contas: {notification.data.stats.accounts}</span>
                              )}
                              {notification.data.stats.entries && (
                                <span>Lançamentos: {notification.data.stats.entries}</span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(notification.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                        {notification.readAt && (
                          <p className="text-xs text-muted-foreground">
                            Lida {formatDistanceToNow(new Date(notification.readAt), { addSuffix: true, locale: ptBR })}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

