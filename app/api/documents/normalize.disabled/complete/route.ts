import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { documents } from '@/lib/db/schema/documents'
import { normalizationTemplates } from '@/lib/db/schema/normalization-templates'
import { eq } from 'drizzle-orm'
import { rename, mkdir } from 'fs/promises'
import { join, extname } from 'path'
import { existsSync } from 'fs'
import { auth } from '@/lib/auth/config'

// ================================================================
// POST /api/documents/normalize/complete
// Step 5: Salvamento final - move arquivo e cria registro no BD
// ================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { tempPath, hash, templateId, organizationId, fileName } = body

    if (!tempPath || !hash || !templateId || !organizationId || !fileName) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // Buscar template
    const [template] = await db
      .select()
      .from(normalizationTemplates)
      .where(eq(normalizationTemplates.id, templateId))
      .limit(1)

    if (!template) {
      return NextResponse.json(
        { error: 'Template não encontrado' },
        { status: 404 }
      )
    }

    // Criar diretório final
    const finalDir = join(process.cwd(), 'uploads', 'documents', organizationId)
    if (!existsSync(finalDir)) {
      await mkdir(finalDir, { recursive: true })
    }

    // Nome final do arquivo
    const ext = extname(fileName)
    const finalFileName = `${hash}${ext}`
    const finalPath = join(finalDir, finalFileName)

    // Mover arquivo de temp para final
    if (existsSync(tempPath)) {
      await rename(tempPath, finalPath)
    }

    // Detectar tipo de documento
    let documentType: 'pdf' | 'docx' | 'doc' | 'txt' | 'other' = 'other'
    if (ext === '.pdf') documentType = 'pdf'
    else if (ext === '.docx') documentType = 'docx'
    else if (ext === '.doc') documentType = 'doc'
    else if (ext === '.txt') documentType = 'txt'

    // Criar registro no banco
    const [document] = await db
      .insert(documents)
      .values({
        organizationId,
        uploadedBy: session.user.id,
        fileName: finalFileName,
        originalFileName: fileName,
        filePath: finalPath,
        fileSize: 0, // TODO: pegar do arquivo
        fileHash: hash,
        mimeType: 'application/octet-stream', // TODO: detectar
        documentType,
        status: 'pending',
        // Jornada de normalização
        normalizationTemplateId: templateId,
        normalizationStatus: 'completed',
        normalizationCompletedAt: new Date(),
        // Jornada de classificação
        classificationStatus: 'pending',
        isActive: true,
      })
      .returning()

    return NextResponse.json({
      success: true,
      documentId: document.id,
      message: 'Documento salvo com sucesso',
    })
  } catch (error) {
    console.error('Erro ao salvar documento:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar documento: ' + (error instanceof Error ? error.message : 'Erro desconhecido') },
      { status: 500 }
    )
  }
}

