import { NextRequest, NextResponse } from 'next/server'
import { chat, getOrCreateThread } from '@/lib/services/agent-orchestrator'

// ================================================================
// API Route para Chat com Agente OpenAI Assistants
// ================================================================

export const maxDuration = 60 // Aumentar timeout para operações do Assistant

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, threadId } = body

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json({ error: 'Mensagem é obrigatória' }, { status: 400 })
    }

    console.log('\n=== QS NEXUS AGENT REQUEST ===')
    console.log(`Message: "${message}"`)
    console.log(`Thread ID: ${threadId || 'new'}`)
    console.log('==============================\n')

    // Executar chat com agente
    const response = await chat(message.trim(), threadId)

    console.log('\n=== QS NEXUS AGENT RESPONSE ===')
    console.log(`Thread ID: ${response.threadId}`)
    console.log(`Run ID: ${response.runId}`)
    console.log(`Tool Calls: ${response.toolCalls?.length || 0}`)
    console.log(`Response length: ${response.message.length} chars`)
    console.log('===============================\n')

    return NextResponse.json({
      message: response.message,
      threadId: response.threadId,
      toolCalls: response.toolCalls,
    })
  } catch (error) {
    console.error('Erro no agente:', error)

    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'

    return NextResponse.json(
      {
        error: 'Erro ao processar mensagem',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}

// Endpoint para criar nova thread
export async function PUT(request: NextRequest) {
  try {
    const threadId = await getOrCreateThread()

    return NextResponse.json({ threadId })
  } catch (error) {
    console.error('Erro ao criar thread:', error)

    return NextResponse.json({ error: 'Erro ao criar thread' }, { status: 500 })
  }
}

