import { db } from '../db/index'
import { documentFiles, templates } from '../db/schema/rag'
import { eq, and } from 'drizzle-orm'
import { deleteTemplate } from './store-embeddings'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'

export type FileStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'rejected'

export interface FileInfo {
  id: string
  filePath: string
  fileName: string
  fileHash: string
  status: FileStatus
  rejectedReason?: string | null
  wordsCount?: number | null
  processedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Calcula o hash SHA256 de um arquivo
 */
export function calculateFileHash(filePath: string): string {
  const content = readFileSync(filePath)
  return createHash('sha256').update(content).digest('hex')
}

/**
 * Normaliza o caminho do arquivo para ser relativo ao root do projeto
 */
export function normalizeFilePath(absolutePath: string, projectRoot: string): string {
  const relativePath = absolutePath.replace(projectRoot, '').replace(/^\//, '')
  return relativePath.startsWith('./') ? relativePath : `./${relativePath}`
}

/**
 * Converte um caminho relativo (salvo no banco) de volta para caminho absoluto
 */
export function denormalizeFilePath(relativePath: string, projectRoot: string): string {
  // Remove o prefixo ./ se existir
  const cleanPath = relativePath.startsWith('./') ? relativePath.slice(2) : relativePath
  
  // Se o caminho já é absoluto (começa com /), retorna diretamente
  if (cleanPath.startsWith('/')) {
    return cleanPath
  }
  
  // Resolve o caminho absoluto relativo ao projectRoot
  return resolve(projectRoot, cleanPath)
}

/**
 * Verifica se um arquivo já foi processado
 */
export async function checkFileProcessed(
  filePath: string,
  fileHash: string
): Promise<FileInfo | null> {
  const result = await db
    .select()
    .from(documentFiles)
    .where(and(eq(documentFiles.filePath, filePath), eq(documentFiles.fileHash, fileHash)))
    .limit(1)

  return result[0] || null
}

/**
 * Marca arquivo como em processamento
 */
export async function markFileProcessing(
  filePath: string,
  fileHash: string,
  fileName: string
): Promise<FileInfo> {
  const existing = await db
    .select()
    .from(documentFiles)
    .where(eq(documentFiles.filePath, filePath))
    .limit(1)

  if (existing[0]) {
    const [updated] = await db
      .update(documentFiles)
      .set({
        status: 'processing',
        fileHash,
        updatedAt: new Date(),
      })
      .where(eq(documentFiles.id, existing[0].id))
      .returning()
    return updated
  }

  const [inserted] = await db
    .insert(documentFiles)
    .values({
      filePath,
      fileName,
      fileHash,
      status: 'processing',
    })
    .returning()

  return inserted
}

/**
 * Marca arquivo como completo
 */
export async function markFileCompleted(
  filePath: string,
  templateId: string,
  wordsCount: number
): Promise<void> {
  await db
    .update(documentFiles)
    .set({
      status: 'completed',
      wordsCount,
      processedAt: new Date(),
      updatedAt: new Date(),
      rejectedReason: null, // Limpa motivo de rejeição quando processado com sucesso
    })
    .where(eq(documentFiles.filePath, filePath))
}

/**
 * Marca arquivo como rejeitado (nunca será reprocessado)
 */
export async function markFileRejected(filePath: string, reason: string): Promise<void> {
  const existing = await db
    .select()
    .from(documentFiles)
    .where(eq(documentFiles.filePath, filePath))
    .limit(1)

  if (existing[0]) {
    await db
      .update(documentFiles)
      .set({
        status: 'rejected',
        rejectedReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(documentFiles.id, existing[0].id))
  } else {
    // Se não existe, cria registro rejeitado
    await db.insert(documentFiles).values({
      filePath,
      fileName: filePath.split('/').pop() || filePath,
      fileHash: '', // Hash não importa para rejeitados
      status: 'rejected',
      rejectedReason: reason,
    })
  }
}

/**
 * Lista arquivos pendentes
 */
export async function getPendingFiles(): Promise<FileInfo[]> {
  return await db.select().from(documentFiles).where(eq(documentFiles.status, 'pending'))
}

/**
 * Lista arquivos rejeitados
 */
export async function getRejectedFiles(): Promise<FileInfo[]> {
  return await db.select().from(documentFiles).where(eq(documentFiles.status, 'rejected'))
}

/**
 * Retorna estatísticas gerais do processamento
 */
export async function getProcessingStatus() {
  const allFiles = await db.select().from(documentFiles)

  const stats = {
    total: allFiles.length,
    pending: allFiles.filter((f: (typeof allFiles)[0]) => f.status === 'pending').length,
    processing: allFiles.filter((f: (typeof allFiles)[0]) => f.status === 'processing').length,
    completed: allFiles.filter((f: (typeof allFiles)[0]) => f.status === 'completed').length,
    failed: allFiles.filter((f: (typeof allFiles)[0]) => f.status === 'failed').length,
    rejected: allFiles.filter((f: (typeof allFiles)[0]) => f.status === 'rejected').length,
  }

  return {
    ...stats,
    progress: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
  }
}

/**
 * Reseta status de um arquivo para permitir reprocessamento
 */
export async function resetFileStatus(filePath: string): Promise<boolean> {
  const existing = await db
    .select()
    .from(documentFiles)
    .where(eq(documentFiles.filePath, filePath))
    .limit(1)

  if (!existing[0]) {
    return false
  }

  await db
    .update(documentFiles)
    .set({
      status: 'pending',
      updatedAt: new Date(),
    })
    .where(eq(documentFiles.id, existing[0].id))

  return true
}

/**
 * Busca informações de um arquivo específico
 */
export async function getFileByPath(filePath: string): Promise<FileInfo | null> {
  const result = await db
    .select()
    .from(documentFiles)
    .where(eq(documentFiles.filePath, filePath))
    .limit(1)

  return result[0] || null
}

/**
 * Salva markdown temporário para uso posterior na classificação
 */
export function saveTemporaryMarkdown(fileHash: string, markdown: string): void {
  const tempDir = join(process.cwd(), 'data', 'markdown')
  if (!existsSync(tempDir)) {
    mkdirSync(tempDir, { recursive: true })
  }
  const filePath = join(tempDir, `${fileHash}.md`)
  writeFileSync(filePath, markdown, 'utf-8')
}

/**
 * Lê markdown temporário salvo
 */
export function readTemporaryMarkdown(fileHash: string): string | null {
  const filePath = join(process.cwd(), 'data', 'markdown', `${fileHash}.md`)
  if (!existsSync(filePath)) {
    return null
  }
  return readFileSync(filePath, 'utf-8')
}

/**
 * Remove markdown temporário após uso
 */
export function removeTemporaryMarkdown(fileHash: string): void {
  const filePath = join(process.cwd(), 'data', 'markdown', `${fileHash}.md`)
  if (existsSync(filePath)) {
    unlinkSync(filePath)
  }
}

/**
 * Interface para informações sobre o que foi deletado
 */
export interface DeleteFileResult {
  success: boolean
  fileDeleted: boolean
  templateDeleted: boolean
  chunksDeleted: boolean
  physicalFileDeleted: boolean
  markdownDeleted: boolean
  error?: string
}

/**
 * Deleta um arquivo completo e todos os seus dados relacionados
 * Ordem: template_chunks (com embeddings) → templates → document_files
 */
export async function deleteFile(fileId: string): Promise<DeleteFileResult> {
  try {
    // Buscar arquivo por ID
    const file = await db
      .select()
      .from(documentFiles)
      .where(eq(documentFiles.id, fileId))
      .limit(1)

    if (file.length === 0) {
      return {
        success: false,
        fileDeleted: false,
        templateDeleted: false,
        chunksDeleted: false,
        physicalFileDeleted: false,
        markdownDeleted: false,
        error: 'Arquivo não encontrado',
      }
    }

    const fileData = file[0]
    let templateDeleted = false
    let chunksDeleted = false

    // Buscar template associado (se existir)
    const template = await db
      .select()
      .from(templates)
      .where(eq(templates.documentFileId, fileId))
      .limit(1)

    // Se existe template, deletar chunks e template
    if (template.length > 0) {
      await deleteTemplate(template[0].id)
      templateDeleted = true
      chunksDeleted = true
    }

    // Deletar document_file
    await db.delete(documentFiles).where(eq(documentFiles.id, fileId))

    return {
      success: true,
      fileDeleted: true,
      templateDeleted,
      chunksDeleted,
      physicalFileDeleted: false, // Será tratado na API
      markdownDeleted: false, // Será tratado na API
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Error deleting file:', errorMessage)
    return {
      success: false,
      fileDeleted: false,
      templateDeleted: false,
      chunksDeleted: false,
      physicalFileDeleted: false,
      markdownDeleted: false,
      error: errorMessage,
    }
  }
}
