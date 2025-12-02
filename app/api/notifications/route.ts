import { NextRequest, NextResponse } from 'next/server'
import {
  listUserNotifications,
  countUnreadNotifications,
  markAllNotificationsAsRead,
  deleteReadNotifications,
} from '@/lib/services/notification-service'

/**
 * GET /api/notifications
 * Lista notificações do usuário
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Pegar userId da sessão
    // const session = await auth()
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    // }
    // const userId = session.user.id

    // Por enquanto, usar um userId fixo para desenvolvimento (UUID válido)
    const userId = '00000000-0000-0000-0000-000000000001'

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const onlyUnread = searchParams.get('unread') === 'true'

    const notifications = await listUserNotifications(userId, {
      limit,
      onlyUnread,
    })

    const unreadCount = await countUnreadNotifications(userId)

    return NextResponse.json({
      notifications,
      unreadCount,
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar notificações' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/notifications/mark-all-read
 * Marca todas notificações como lidas
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (body.action === 'mark_all_read') {
      const userId = '00000000-0000-0000-0000-000000000001' // TODO: pegar da sessão
      await markAllNotificationsAsRead(userId)
      return NextResponse.json({ success: true })
    }

    if (body.action === 'delete_read') {
      const userId = '00000000-0000-0000-0000-000000000001' // TODO: pegar da sessão
      await deleteReadNotifications(userId)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (error) {
    console.error('Error processing notification action:', error)
    return NextResponse.json(
      { error: 'Erro ao processar ação' },
      { status: 500 }
    )
  }
}

