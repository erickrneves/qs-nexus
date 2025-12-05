import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { documents } from '@/lib/db/schema/documents'
import { eq } from 'drizzle-orm'

// ================================================================
// GET /api/documents/classify/progress
// Retorna o progresso da classificação
// ================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar documento
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1)

    if (!document) {
      return NextResponse.json(
        { error: 'Documento não encontrado' },
        { status: 404 }
      )
    }

    // Mapear status para progresso
    let progress = {
      step: document.classificationStatus || 'idle',
      message: '',
      progress: 0,
      totalChunks: document.totalChunks || 0,
      processedChunks: 0,
      error: document.classificationError,
    }

    switch (document.classificationStatus) {
      case 'pending':
        progress.message = 'Aguardando início'
        progress.progress = 0
        break
      case 'extracting':
        progress.message = 'Extraindo dados com IA...'
        progress.progress = 25
        break
      case 'chunking':
        progress.message = 'Fragmentando documento...'
        progress.progress = 50
        progress.processedChunks = Math.floor((document.totalChunks || 0) * 0.5)
        break
      case 'embedding':
        progress.message = 'Gerando embeddings...'
        progress.progress = 75
        progress.processedChunks = Math.floor((document.totalChunks || 0) * 0.75)
        break
      case 'completed':
        progress.message = 'Classificação concluída!'
        progress.progress = 100
        progress.processedChunks = document.totalChunks || 0
        break
      case 'failed':
        progress.message = 'Erro na classificação'
        progress.progress = 0
        break
      default:
        progress.message = 'Aguardando início'
        progress.progress = 0
    }

    return NextResponse.json({
      success: true,
      progress,
    })
  } catch (error) {
    console.error('Erro ao buscar progresso:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar progresso' },
      { status: 500 }
    )
  }
}

