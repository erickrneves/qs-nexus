/**
 * SPED RAG Processor
 * Processa dados SPED para geração de embeddings e busca RAG
 * 
 * Fluxo:
 * 1. Recebe spedFileId após parse e salvamento em BD
 * 2. Busca dados contábeis (contas, saldos, lançamentos)
 * 3. Gera chunks inteligentes usando accounting-chunker
 * 4. Gera embeddings para cada chunk
 * 5. Salva chunks com vetores em template_chunks
 */

import { db } from '../db'
import { 
  spedFiles, 
  chartOfAccounts, 
  accountBalances, 
  journalEntries,
  journalItems 
} from '../db/schema/sped'
import { templates, templateChunks, documentFiles } from '../db/schema/rag'
import { eq } from 'drizzle-orm'
import { chunkByAccounts } from './accounting-chunker'
import { generateEmbeddings } from './embedding-generator'
import { generateSpedSummaryMarkdown } from './sped-classifier'

const BATCH_SIZE = 64 // Batch size para geração de embeddings
const MAX_TOKENS = 800 // Tokens máximos por chunk

export interface SpedRagProcessingProgress {
  step: number
  totalSteps: number
  progress: number
  message: string
}

export type SpedRagProgressCallback = (progress: SpedRagProcessingProgress) => void

/**
 * Processa arquivo SPED para RAG (chunking + embeddings)
 */
export async function processSpedForRag(
  spedFileId: string,
  onProgress?: SpedRagProgressCallback
): Promise<{ success: boolean; templateId?: string; error?: string; stats?: any }> {
  const totalSteps = 6

  const reportProgress = (
    step: number,
    message: string,
    progress: number
  ) => {
    if (onProgress) {
      onProgress({
        step,
        totalSteps,
        progress,
        message
      })
    }
  }

  try {
    // Etapa 1: Buscar arquivo SPED
    reportProgress(1, 'Buscando dados SPED...', 10)
    
    const [spedFile] = await db
      .select()
      .from(spedFiles)
      .where(eq(spedFiles.id, spedFileId))
      .limit(1)

    if (!spedFile) {
      return { success: false, error: 'Arquivo SPED não encontrado' }
    }

    // Etapa 2: Buscar dados contábeis
    reportProgress(2, 'Carregando dados contábeis...', 20)
    
    const accounts = await db
      .select()
      .from(chartOfAccounts)
      .where(eq(chartOfAccounts.spedFileId, spedFileId))

    const balances = await db
      .select()
      .from(accountBalances)
      .where(eq(accountBalances.spedFileId, spedFileId))

    const entries = await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.spedFileId, spedFileId))

    const items = await db
      .select()
      .from(journalItems)
      .where(eq(journalItems.journalEntryId, eq(journalEntries.id, journalEntries.id)))

    console.log(`[SPED-RAG] Dados carregados: ${accounts.length} contas, ${balances.length} saldos, ${entries.length} lançamentos`)

    // Etapa 3: Gerar chunks inteligentes
    reportProgress(3, 'Gerando chunks contábeis...', 40)
    
    // Gera chunks por contas individuais (para buscas específicas)
    const accountChunks = chunkByAccounts(
      accounts,
      balances,
      entries,
      items,
      spedFile,
      MAX_TOKENS
    )

    const allChunks = accountChunks

    console.log(`[SPED-RAG] Chunks gerados: ${accountChunks.length} por conta`)

    if (allChunks.length === 0) {
      return { success: false, error: 'Nenhum chunk foi gerado' }
    }

    // Etapa 4: Buscar ou criar template
    reportProgress(4, 'Criando template...', 50)
    
    // Buscar template existente (criado pela classificação)
    let [existingTemplate] = await db
      .select()
      .from(templates)
      .where(eq(templates.documentFileId, spedFileId))
      .limit(1)

    let templateId: string

    if (existingTemplate) {
      templateId = existingTemplate.id
      console.log(`[SPED-RAG] Usando template existente: ${templateId}`)
    } else {
      // Criar novo template se não existir
      // Primeiro, criar/buscar document_file
      let [docFile] = await db
        .select()
        .from(documentFiles)
        .where(eq(documentFiles.id, spedFileId))
        .limit(1)

      if (!docFile) {
        // Criar document_file temporário
        [docFile] = await db
          .insert(documentFiles)
          .values({
            organizationId: spedFile.organizationId,
            createdBy: spedFile.uploadedBy,
            filePath: spedFile.filePath,
            fileName: spedFile.fileName,
            fileHash: spedFile.fileHash,
            fileType: 'sped',
            status: 'completed',
            wordsCount: 0
          })
          .returning()
      }

      // Gerar markdown resumo
      const summaryMarkdown = generateSpedSummaryMarkdown({
        fileName: spedFile.fileName,
        cnpj: spedFile.cnpj,
        companyName: spedFile.companyName,
        periodStart: spedFile.periodStart.toISOString(),
        periodEnd: spedFile.periodEnd.toISOString(),
        fileType: spedFile.fileType,
        stats: {
          accounts: accounts.length,
          balances: balances.length,
          entries: entries.length,
          items: items.length,
          errors: 0
        },
        sampleAccounts: accounts.slice(0, 50).map(a => ({
          accountCode: a.accountCode,
          accountName: a.accountName,
          accountType: a.accountType || 'S'
        })),
        sampleBalances: balances.slice(0, 50).map(b => ({
          accountCode: b.accountCode,
          debitBalance: parseFloat(b.debitTotal) || 0,
          creditBalance: parseFloat(b.creditTotal) || 0
        }))
      })

      // Criar template
      [existingTemplate] = await db
        .insert(templates)
        .values({
          documentFileId: docFile.id,
          organizationId: spedFile.organizationId,
          createdBy: spedFile.uploadedBy,
          title: `SPED ${spedFile.fileType.toUpperCase()} - ${spedFile.companyName}`,
          markdown: summaryMarkdown,
          metadata: {
            cnpj: spedFile.cnpj,
            companyName: spedFile.companyName,
            periodStart: spedFile.periodStart.toISOString(),
            periodEnd: spedFile.periodEnd.toISOString(),
            fileType: spedFile.fileType,
            accountsCount: accounts.length,
            balancesCount: balances.length,
            entriesCount: entries.length
          }
        })
        .returning()

      templateId = existingTemplate.id
      console.log(`[SPED-RAG] Template criado: ${templateId}`)
    }

    // Etapa 5: Gerar embeddings
    reportProgress(5, `Gerando embeddings para ${allChunks.length} chunks...`, 70)
    
    const texts = allChunks.map(c => c.content)
    const embeddingResults = await generateEmbeddings(texts, BATCH_SIZE, templateId)

    console.log(`[SPED-RAG] Embeddings gerados: ${embeddingResults.length}`)

    // Combina chunks com embeddings
    const chunksWithEmbeddings = allChunks.map((chunk, idx) => ({
      ...chunk,
      embedding: embeddingResults[idx].embedding
    }))

    // Etapa 6: Salvar chunks com embeddings
    reportProgress(6, 'Salvando chunks no banco...', 90)
    
    // Deleta chunks existentes se houver (reprocessamento)
    await db
      .delete(templateChunks)
      .where(eq(templateChunks.templateId, templateId))

    // Insere chunks em batches
    const batchSize = 500
    for (let i = 0; i < chunksWithEmbeddings.length; i += batchSize) {
      const batch = chunksWithEmbeddings.slice(i, i + batchSize)
      
      await db.insert(templateChunks).values(
        batch.map(chunk => ({
          templateId,
          section: chunk.section || null,
          role: chunk.role || null,
          contentMarkdown: chunk.content,
          chunkIndex: chunk.chunkIndex,
          embedding: chunk.embedding
        }))
      )

      const progress = 90 + Math.floor((i / chunksWithEmbeddings.length) * 10)
      reportProgress(6, `Salvando chunks (${i + batch.length}/${chunksWithEmbeddings.length})...`, progress)
    }

    console.log(`[SPED-RAG] ${chunksWithEmbeddings.length} chunks salvos com embeddings`)

    reportProgress(6, 'Processamento RAG concluído!', 100)

    return {
      success: true,
      templateId,
      stats: {
        accounts: accounts.length,
        balances: balances.length,
        entries: entries.length,
        chunks: chunksWithEmbeddings.length,
        embeddings: embeddingResults.length
      }
    }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`[SPED-RAG] Erro ao processar SPED para RAG:`, errorMsg)
    return { success: false, error: errorMsg }
  }
}

/**
 * Reprocessa chunks e embeddings de um arquivo SPED existente
 */
export async function reprocessSpedRag(spedFileId: string): Promise<{ success: boolean; error?: string }> {
  console.log(`[SPED-RAG] Reprocessando RAG para SPED: ${spedFileId}`)
  return processSpedForRag(spedFileId)
}

