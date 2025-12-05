/**
 * API para upload de arquivos SPED
 * Aceita: XLSX (compilados de ECD)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { spedFiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    // 1. Autenticação
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const userId = session.user.id
    const organizationId = session.user.organizationId

    if (!organizationId) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 400 })
    }

    // 2. Processar FormData
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    console.log(`[SPED-UPLOAD] Arquivo: ${file.name}, Tamanho: ${file.size}, Tipo: ${file.type}`)

    // 3. Validar extensão (apenas XLSX para ECD)
    const fileName = file.name
    const fileExtension = fileName.split('.').pop()?.toLowerCase()

    if (fileExtension !== 'xlsx') {
      return NextResponse.json(
        { error: 'Apenas arquivos XLSX são aceitos para SPED ECD' },
        { status: 400 }
      )
    }

    // 4. Validar tamanho (máximo 50MB)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Tamanho máximo: 50MB' },
        { status: 400 }
      )
    }

    // 5. Gerar hash do arquivo
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileHash = crypto
      .createHash('sha256')
      .update(buffer)
      .digest('hex')
      .substring(0, 6)

    console.log(`[SPED-UPLOAD] Hash: ${fileHash}`)

    // 6. Verificar se já existe arquivo com mesmo hash (apenas AVISO, não bloqueio)
    const existingFiles = await db
      .select()
      .from(spedFiles)
      .where(eq(spedFiles.fileHash, fileHash))

    let warningMessage = ''
    if (existingFiles.length > 0) {
      console.log(`[SPED-UPLOAD] ⚠️  Encontrados ${existingFiles.length} arquivo(s) com mesmo hash`)
      warningMessage = `⚠️ Este arquivo pode ser uma duplicata (${existingFiles.length} upload(s) anterior(es)).`
    }

    // 7. Criar diretório se não existir
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'sped', organizationId)
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // 8. Salvar arquivo no servidor
    const timestamp = Date.now()
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const savedFileName = `${timestamp}_${fileHash}_${sanitizedFileName}`
    const filePath = join(uploadsDir, savedFileName)
    const relativeFilePath = `uploads/sped/${organizationId}/${savedFileName}`

    await writeFile(filePath, buffer)
    console.log(`[SPED-UPLOAD] Arquivo salvo: ${relativeFilePath}`)

    // 9. Salvar registro no banco
    const [spedFile] = await db
      .insert(spedFiles)
      .values({
        organizationId,
        uploadedBy: userId,
        fileName: fileName,
        filePath: relativeFilePath,
        fileHash: fileHash,
        fileType: 'ecd',
        cnpj: '00.000.000/0000-00', // Placeholder - será extraído posteriormente
        companyName: 'A ser processado', // Será extraído posteriormente
        periodStart: '2024-01-01', // Placeholder - será extraído posteriormente
        periodEnd: '2024-12-31', // Placeholder - será extraído posteriormente
        status: 'pending',
        totalRecords: 0,
        processedRecords: 0,
      })
      .returning()

    console.log(`[SPED-UPLOAD] ✅ Registro criado: ${spedFile.id}`)

    return NextResponse.json({
      success: true,
      spedFileId: spedFile.id,
      fileName: fileName,
      fileHash: fileHash,
      message: warningMessage 
        ? `Arquivo SPED importado com sucesso! ${warningMessage}`
        : 'Arquivo SPED importado com sucesso! Clique para visualizar e processar.',
      warning: warningMessage || null,
    })
  } catch (error) {
    console.error('[SPED-UPLOAD] ❌ Erro:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro ao fazer upload',
      },
      { status: 500 }
    )
  }
}
