import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { documents } from '@/lib/db/schema/documents'
import { eq } from 'drizzle-orm'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { hasPermission } from '@/lib/auth/permissions'
import { calculateFileHash, getDocumentType, getMimeType } from '@/lib/utils/file-upload'
import { getUploadPath, sanitizeFileName } from '@/lib/utils/storage-path'
import { processFile } from '@/lib/services/rag-processor'

/**
 * POST /api/documents/upload
 * Upload de documentos gerais (PDF, DOCX, TXT)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verificar permissão
    if (!hasPermission(session.user.globalRole || 'viewer', 'data.upload')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const organizationId = formData.get('organizationId') as string

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId é obrigatório' }, { status: 400 })
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    // Validar que o usuário pertence à organização
    if (session.user.globalRole !== 'super_admin' && session.user.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Você não tem acesso a esta organização' }, { status: 403 })
    }

    const uploadedDocs = []
    const errors: Array<{ fileName: string; error: string }> = []

    for (const file of files) {
      try {
        console.log(`[UPLOAD] Processando arquivo: ${file.name}, tamanho: ${file.size}, tipo: ${file.type}`)
        
        // Validar extensão
        const ext = file.name.split('.').pop()?.toLowerCase()
        const allowedExtensions = ['pdf', 'docx', 'doc', 'txt']
        
        if (!ext || !allowedExtensions.includes(ext)) {
          console.error(`[UPLOAD] Extensão não permitida: ${ext}`)
          throw new Error(`Extensão .${ext} não é suportada. Apenas PDF, DOCX, DOC e TXT são aceitos.`)
        }
        
        // Gerar hash e caminho
        const hash = await calculateFileHash(file)
        console.log(`[UPLOAD] Hash calculado: ${hash}`)
        
        const uploadPath = getUploadPath(organizationId, file.name, hash)
        console.log(`[UPLOAD] Upload path: ${uploadPath}`)
        
        const fullPath = join(process.cwd(), 'public', uploadPath)
        console.log(`[UPLOAD] Full path: ${fullPath}`)

        // Criar diretórios se não existirem
        const dir = fullPath.substring(0, fullPath.lastIndexOf('/'))
        console.log(`[UPLOAD] Criando diretório: ${dir}`)
        await mkdir(dir, { recursive: true })
        
        // Verificar se diretório foi criado
        if (!existsSync(dir)) {
          throw new Error(`Falha ao criar diretório: ${dir}`)
        }
        console.log(`[UPLOAD] Diretório criado com sucesso`)

        // Salvar arquivo
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        await writeFile(fullPath, buffer)
        
        // Verificar se arquivo foi salvo
        if (!existsSync(fullPath)) {
          throw new Error(`Falha ao salvar arquivo: ${fullPath}`)
        }
        console.log(`[UPLOAD] Arquivo salvo em disco: ${fullPath}`)

        // Criar registro no banco
        const documentType = getDocumentType(file.name)
        const mimeType = file.type || getMimeType(file.name)
        console.log(`[UPLOAD] Document type: ${documentType}, MIME type: ${mimeType}`)
        
        const [doc] = await db
          .insert(documents)
          .values({
            organizationId,
            uploadedBy: session.user.id,
            fileName: sanitizeFileName(file.name),
            originalFileName: file.name,
            filePath: uploadPath,
            fileSize: file.size,
            fileHash: hash,
            mimeType: mimeType,
            documentType: documentType,
            status: 'pending',
          })
          .returning()

        console.log(`[UPLOAD] Documento salvo no BD: ${doc.id}`)
        uploadedDocs.push(doc)
        
        // Iniciar processamento assíncrono em background
        console.log(`[UPLOAD] Iniciando processamento em background...`)
        processFile(
          fullPath,
          (progress) => {
            console.log(`[PROCESS ${doc.id}] [${progress.progress}%] ${progress.message}`)
          },
          {
            documentId: doc.id,
            organizationId,
            uploadedBy: session.user.id,
          }
        ).then(async (result) => {
          if (result.success) {
            // Atualizar status para completed
            await db
              .update(documents)
              .set({
                status: 'completed',
                processedAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(documents.id, doc.id))
            console.log(`[PROCESS ${doc.id}] ✅ Processamento concluído`)
          } else {
            // Atualizar status para failed
            await db
              .update(documents)
              .set({
                status: 'failed',
                errorMessage: result.error || 'Erro desconhecido',
                updatedAt: new Date(),
              })
              .where(eq(documents.id, doc.id))
            console.log(`[PROCESS ${doc.id}] ❌ Processamento falhou: ${result.error}`)
          }
        }).catch(async (error) => {
          console.error(`[PROCESS ${doc.id}] ❌ Erro no processamento:`, error)
          // Atualizar status para failed
          await db
            .update(documents)
            .set({
              status: 'failed',
              errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
              updatedAt: new Date(),
            })
            .where(eq(documents.id, doc.id))
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error(`❌ [UPLOAD] Erro ao processar arquivo ${file.name}:`, error)
        console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A')
        console.error('Tipo do erro:', typeof error)
        console.error('Nome do erro:', error instanceof Error ? error.name : 'N/A')
        console.error('Mensagem do erro:', errorMessage)
        
        errors.push({
          fileName: file.name,
          error: errorMessage
        })
        // Continuar com os próximos arquivos
      }
    }

    if (uploadedDocs.length === 0) {
      const errorDetails = errors.length > 0 
        ? errors.map(e => `${e.fileName}: ${e.error}`).join('; ')
        : 'Nenhum arquivo foi processado com sucesso'
      
      console.error('[UPLOAD] Nenhum arquivo processado. Erros:', errors)
      
      return NextResponse.json({ 
        error: 'Nenhum arquivo foi processado com sucesso',
        details: errorDetails,
        errors: errors
      }, { status: 500 })
    }

    // Se houve sucesso parcial, retorna sucesso com avisos
    const response: any = {
      message: `${uploadedDocs.length} arquivo(s) enviado(s) com sucesso`,
      documents: uploadedDocs,
    }
    
    if (errors.length > 0) {
      response.warnings = errors
      response.message += ` (${errors.length} arquivo(s) com erro)`
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Erro ao fazer upload' }, { status: 500 })
  }
}

