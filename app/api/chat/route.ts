import { NextRequest, NextResponse } from 'next/server'
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { searchSimilarChunks } from '@/lib/services/rag-search'
import { auth } from '@/lib/auth/config'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Constrói contexto RAG a partir de chunks similares
 */
function buildRAGContext(
  chunks: Array<{
    contentMarkdown: string
    templateTitle: string
    templateArea: string
    templateDocType: string
    section: string | null
    role: string | null
    similarity: number
  }>
): string {
  if (chunks.length === 0) {
    return 'Nenhum documento relevante encontrado na base de conhecimento.'
  }

  const contextParts = chunks.map((chunk, index) => {
    const sectionInfo = chunk.section ? ` (Seção: ${chunk.section})` : ''
    const roleInfo = chunk.role ? ` [${chunk.role}]` : ''

    return `
[Documento ${index + 1}]
Título: ${chunk.templateTitle}
Área: ${chunk.templateArea}
Tipo: ${chunk.templateDocType}${sectionInfo}${roleInfo}
Similaridade: ${(chunk.similarity * 100).toFixed(1)}%

Conteúdo:
${chunk.contentMarkdown}
`
  })

  return contextParts.join('\n---\n')
}

export async function POST(request: NextRequest) {
  try {
    // Verifica autenticação
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { message, history = [] } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Mensagem é obrigatória' }, { status: 400 })
    }

    // Busca chunks relevantes
    const chunks = await searchSimilarChunks(message, 10, 0.7)

    // Constrói contexto RAG
    const ragContext = buildRAGContext(chunks)

    // Constrói histórico de conversa
    const conversationHistory = history
      .slice(-6) // Últimas 6 mensagens
      .map(
        (msg: ChatMessage) => `${msg.role === 'user' ? 'Usuário' : 'Assistente'}: ${msg.content}`
      )
      .join('\n')

    // Prompt do sistema
    const systemPrompt = `Você é um assistente jurídico especializado em ajudar com documentos legais brasileiros.

Sua função é responder perguntas baseando-se APENAS nos documentos fornecidos no contexto abaixo. Se a informação não estiver no contexto, diga que não tem essa informação disponível.

INSTRUÇÕES:
- Use APENAS informações dos documentos fornecidos no contexto
- Cite os documentos quando fizer referências (ex: "Segundo o Documento 1...")
- Se não houver informação relevante no contexto, informe ao usuário
- Responda em português brasileiro
- Seja claro, objetivo e profissional
- Mantenha o contexto jurídico e formal quando apropriado

CONTEXTO DE DOCUMENTOS:
${ragContext}`

    // Prompt do usuário
    const userPrompt = conversationHistory
      ? `${conversationHistory}\n\nUsuário: ${message}`
      : message

    // Gera resposta com streaming
    const result = await streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
      maxTokens: 1000,
    })

    // Retorna stream
    return result.toDataStreamResponse()
  } catch (error) {
    console.error('Erro no chat:', error)
    return NextResponse.json({ error: 'Erro ao processar mensagem' }, { status: 500 })
  }
}
