import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/index'
import { documentFiles } from '@/lib/db/schema/rag'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth/config'
import { resetFileStatus, denormalizeFilePath } from '@/lib/services/file-tracker'
import { processFile } from '@/lib/services/rag-processor'

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

    // Verificar se arquivo está completed ou rejected
    if (fileData.status !== 'completed' && fileData.status !== 'rejected') {
      return NextResponse.json(
        { error: 'Apenas arquivos concluídos ou rejeitados podem ser reprocessados' },
        { status: 400 }
      )
    }

    // Resetar status
    const resetSuccess = await resetFileStatus(fileData.filePath)
    if (!resetSuccess) {
      return NextResponse.json({ error: 'Erro ao resetar status do arquivo' }, { status: 500 })
    }

    // Converter caminho relativo (do banco) para absoluto
    const PROJECT_ROOT = process.cwd()
    const absoluteFilePath = denormalizeFilePath(fileData.filePath, PROJECT_ROOT)

    // Reprocessar arquivo (assíncrono)
    processFile(absoluteFilePath)
      .then(result => {
        if (!result.success) {
          console.error(`Erro ao reprocessar arquivo ${absoluteFilePath}:`, result.error)
        }
      })
      .catch(error => {
        console.error(`Erro ao reprocessar arquivo ${absoluteFilePath}:`, error)
      })

    return NextResponse.json({
      success: true,
      message: 'Reprocessamento iniciado. O arquivo será processado em segundo plano.',
    })
  } catch (error) {
    console.error('Error reprocessing document:', error)
    return NextResponse.json({ error: 'Erro ao reprocessar documento' }, { status: 500 })
  }
}

