import { NextRequest, NextResponse } from 'next/server'
import { sendMagicLink } from '@/lib/auth/stack-auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    const success = await sendMagicLink(email)

    if (!success) {
      return NextResponse.json(
        { error: 'Erro ao enviar magic link. Tente novamente.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Magic link enviado! Verifique seu email.',
    })
  } catch (error) {
    console.error('Erro ao enviar magic link:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

