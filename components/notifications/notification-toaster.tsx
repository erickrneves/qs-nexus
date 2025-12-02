'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { useNotifications } from '@/hooks/use-notifications'

/**
 * Componente que monitora novas notificações e mostra toasts
 * Deve ser incluído no layout principal
 */
export function NotificationToaster() {
  const { notifications } = useNotifications()
  const previousCountRef = useRef(0)
  const shownNotificationsRef = useRef(new Set<string>())

  useEffect(() => {
    if (notifications.length === 0) return

    // Detecta novas notificações
    const newNotifications = notifications.filter(
      n => !shownNotificationsRef.current.has(n.id) && 
           !n.read &&
           // Só mostra notificações dos últimos 2 minutos
           new Date().getTime() - new Date(n.createdAt).getTime() < 2 * 60 * 1000
    )

    newNotifications.forEach(notification => {
      // Marca como mostrada
      shownNotificationsRef.current.add(notification.id)

      // Escolhe tipo de toast baseado no tipo de notificação
      if (notification.type.includes('failed') || notification.type.includes('error')) {
        toast.error(notification.title, {
          description: notification.message,
          duration: 6000,
        } as any)
      } else if (notification.type.includes('complete') || notification.type.includes('success')) {
        toast.success(notification.title, {
          description: notification.message,
          duration: 5000,
        } as any)
      } else {
        toast(notification.title, {
          description: notification.message,
          duration: 4000,
        } as any)
      }
    })

    previousCountRef.current = notifications.length
  }, [notifications])

  return null // Componente invisível
}

