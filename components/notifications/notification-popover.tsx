'use client'

import { Bell, Check, CheckCheck, Trash2, X, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useNotifications } from '@/hooks/use-notifications'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { cn } from '@/lib/utils'

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

export function NotificationPopover() {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative text-[var(--qs-text-muted)] hover:text-[var(--qs-text)] hover:bg-[var(--qs-muted)]"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--qs-error)] text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className="sr-only">Notificações ({unreadCount} não lidas)</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-96 p-0 bg-card border-border shadow-xl" 
        align="end"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-card">
          <div>
            <h3 className="font-semibold">Notificações</h3>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {unreadCount} não {unreadCount === 1 ? 'lida' : 'lidas'}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-8 text-xs"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px] bg-card">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 bg-card">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-card">
              <Bell className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
              <p className="text-sm font-medium text-foreground">Nenhuma notificação</p>
              <p className="text-xs text-muted-foreground mt-1">
                Você está em dia!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border bg-card">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-4 transition-colors hover:bg-accent/80 bg-card',
                    !notification.read && 'bg-primary/10 hover:bg-primary/20'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl shrink-0">
                      {notificationIcons[notification.type] || '📢'}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-tight">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-snug">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </p>
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="h-6 px-2 text-xs"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="h-6 px-2 text-xs hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="border-t border-border p-2 bg-card">
            <Link href="/notifications">
              <Button variant="ghost" size="sm" className="w-full justify-center hover:bg-accent">
                <span className="text-foreground">Ver todas notificações</span>
                <ExternalLink className="h-3.5 w-3.5 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

