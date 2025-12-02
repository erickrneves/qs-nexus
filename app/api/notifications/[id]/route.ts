import { NextRequest, NextResponse } from 'next/server'
import {
  markNotificationAsRead,
  deleteNotification,
} from '@/lib/services/notification-service'

/**
 * PUT /api/notifications/[id]
 * Marca notificação como lida
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notification = await markNotificationAsRead(params.id)
    return NextResponse.json({ notification })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return NextResponse.json(
      { error: 'Erro ao marcar notificação como lida' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/notifications/[id]
 * Deleta notificação
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteNotification(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting notification:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar notificação' },
      { status: 500 }
    )
  }
}

