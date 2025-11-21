import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/index'
import { documentFiles, templates } from '@/lib/db/schema/rag'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth/config'
import { chunkMarkdown } from '@/lib/services/chunker'
import { generateEmbeddings } from '@/lib/services/embedding-generator'
import { deleteTemplateChunks, storeChunks } from '@/lib/services/store-embeddings'

const MAX_TOKENS = parseInt(process.env.CHUNK_MAX_TOKENS || '800', 10)
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '64', 10)

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const fileId = params.id

    // Buscar arquivo
    const file = await db.select().from(documentFiles).where(eq(documentFiles.id, fileId)).limit(1)

    if (file.length === 0) {
      return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 })
    }

    const fileData = file[0]

    // Verificar se arquivo está completed
    if (fileData.status !== 'completed') {
      return NextResponse.json(
        { error: 'Apenas arquivos concluídos podem ter chunks regenerados' },
        { status: 400 }
      )
    }

    // Buscar template associado
    const template = await db
      .select()
      .from(templates)
      .where(eq(templates.documentFileId, fileId))
      .limit(1)

    if (template.length === 0) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })
    }

    const templateData = template[0]

    if (!templateData.markdown) {
      return NextResponse.json({ error: 'Template não possui markdown' }, { status: 400 })
    }

    // Deletar chunks antigos
    await deleteTemplateChunks(templateData.id)

    // Gerar novos chunks
    const chunks = chunkMarkdown(templateData.markdown, MAX_TOKENS)

    if (chunks.length === 0) {
      return NextResponse.json({ error: 'Nenhum chunk gerado' }, { status: 400 })
    }

    // Gerar embeddings
    const texts = chunks.map(c => c.content)
    const embeddingResults = await generateEmbeddings(texts, BATCH_SIZE, templateData.id)

    // Combina chunks com embeddings
    const chunksWithEmbeddings = chunks.map((chunk, idx) => ({
      ...chunk,
      embedding: embeddingResults[idx].embedding,
    }))

    // Armazenar novos chunks
    await storeChunks(templateData.id, chunksWithEmbeddings)

    return NextResponse.json({
      success: true,
      message: `Chunks e embeddings regenerados com sucesso. ${chunks.length} chunks criados.`,
      chunksCount: chunks.length,
    })
  } catch (error) {
    console.error('Error regenerating chunks:', error)
    return NextResponse.json(
      { error: 'Erro ao regenerar chunks e embeddings' },
      { status: 500 }
    )
  }
}

