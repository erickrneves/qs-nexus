'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  data?: any
  read: boolean
  readAt: string | null
  relatedEntityType: string | null
  relatedEntityId: string | null
  createdAt: string
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications')
      if (!response.ok) throw new Error('Failed to fetch notifications')
      
      const data = await response.json()
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
      })
      if (!response.ok) throw new Error('Failed to mark as read')
      
      // Atualiza localmente
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true, readAt: new Date().toISOString() } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' }),
      })
      if (!response.ok) throw new Error('Failed to mark all as read')
      
      // Atualiza localmente
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true, readAt: new Date().toISOString() }))
      )
      setUnreadCount(0)
      toast.success('Todas notificações marcadas como lidas')
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Erro ao marcar notificações como lidas')
    }
  }, [])

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete notification')
      
      // Remove localmente
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      toast.success('Notificação removida')
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Erro ao remover notificação')
    }
  }, [])

  const deleteReadNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_read' }),
      })
      if (!response.ok) throw new Error('Failed to delete read notifications')
      
      // Remove localmente
      setNotifications(prev => prev.filter(n => !n.read))
      toast.success('Notificações lidas removidas')
    } catch (error) {
      console.error('Error deleting read notifications:', error)
      toast.error('Erro ao remover notificações')
    }
  }, [])

  // Polling a cada 30 segundos para pegar novas notificações
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  return {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteReadNotifications,
  }
}

