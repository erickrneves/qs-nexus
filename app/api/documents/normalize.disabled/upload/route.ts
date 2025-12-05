import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { createHash } from 'crypto'
import { existsSync } from 'fs'

// ================================================================
// POST /api/documents/normalize/upload
// Step 2: Pré-validação - valida arquivo e salva temporariamente
// ================================================================

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const organizationId = formData.get('organizationId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      )
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId é obrigatório' },
        { status: 400 }
      )
    }

    // Validar tipo de arquivo
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'text/plain',
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não suportado. Use PDF, DOCX, DOC ou TXT.' },
        { status: 400 }
      )
    }

    // Validar tamanho (50MB)
    const MAX_SIZE = 50 * 1024 * 1024 // 50MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Tamanho máximo: 50MB' },
        { status: 400 }
      )
    }

    // Ler arquivo
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Calcular hash
    const hash = createHash('sha256').update(buffer).digest('hex')

    // Criar diretório temporário
    const tempDir = join(process.cwd(), 'uploads', 'temp', organizationId)
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true })
    }

    // Salvar arquivo temporariamente
    const tempFileName = `${hash}_${Date.now()}_${file.name}`
    const tempPath = join(tempDir, tempFileName)
    await writeFile(tempPath, buffer)

    return NextResponse.json({
      success: true,
      data: {
        hash,
        size: file.size,
        type: file.type,
        tempPath: tempPath,
        isValid: true,
        message: 'Arquivo salvo temporariamente',
      },
    })
  } catch (error) {
    console.error('Erro no upload:', error)
    return NextResponse.json(
      { error: 'Erro ao processar arquivo' },
      { status: 500 }
    )
  }
}

