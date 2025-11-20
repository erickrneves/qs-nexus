import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { searchSimilarChunks, SimilarChunk } from './rag-search'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  message: string
  chunks: SimilarChunk[]
  sources: Array<{
    title: string
    area: string
    docType: string
    section: string | null
  }>
}

/**
 * Constrói contexto RAG a partir de chunks similares
 */
function buildRAGContext(chunks: SimilarChunk[]): string {
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

/**
 * Gera resposta do chat usando RAG
 * @param message Mensagem do usuário
 * @param history Histórico de mensagens (opcional)
 * @param options Opções de busca RAG
 * @returns Resposta do chat com contexto RAG
 */
export async function chatWithRAG(
  message: string,
  history: Message[] = [],
  options: {
    limit?: number
    minSimilarity?: number
    area?: string
    docType?: string
    onlyGold?: boolean
  } = {}
): Promise<ChatResponse> {
  // Busca chunks relevantes
  const chunks = await searchSimilarChunks(
    message,
    options.limit || 10,
    options.minSimilarity || 0.7
  )

  // Constrói contexto RAG
  const ragContext = buildRAGContext(chunks)

  // Constrói histórico de conversa para o prompt
  const conversationHistory = history
    .slice(-6) // Últimas 6 mensagens (3 turnos)
    .map(msg => `${msg.role === 'user' ? 'Usuário' : 'Assistente'}: ${msg.content}`)
    .join('\n')

  // Prompt do sistema com instruções RAG
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
  const userPrompt = conversationHistory ? `${conversationHistory}\n\nUsuário: ${message}` : message

  try {
    // Gera resposta usando OpenAI
    const { text } = await generateText({
      model: openai('gpt-4o-mini'), // Usa modelo mais barato para chat
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
      maxTokens: 1000,
    })

    // Extrai fontes dos chunks
    const sources = chunks.map(chunk => ({
      title: chunk.templateTitle,
      area: chunk.templateArea,
      docType: chunk.templateDocType,
      section: chunk.section,
    }))

    return {
      message: text,
      chunks,
      sources,
    }
  } catch (error) {
    console.error('Erro ao gerar resposta RAG:', error)
    throw new Error('Erro ao processar mensagem. Tente novamente.')
  }
}
