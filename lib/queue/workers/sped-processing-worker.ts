import { Worker, Job } from 'bullmq'
import { redisConnection, SpedProcessingJobData } from '../config'
import { parseSpedFile } from '@/lib/services/sped-parser'
import { db } from '@/lib/db'
import { spedFiles, chartOfAccounts, accountBalances, journalEntries, journalItems } from '@/lib/db/schema/sped'

/**
 * Worker para processamento assíncrono de arquivos SPED
 */

export const spedProcessingWorker = new Worker<SpedProcessingJobData>(
  'sped-processing',
  async (job: Job<SpedProcessingJobData>) => {
    const { fileId, filePath, organizationId, userId } = job.data

    console.log(`[SpedWorker] Processando arquivo ${fileId}`)

    try {
      // 1. Parse do arquivo SPED
      job.updateProgress(10)
      const parseResult = await parseSpedFile(filePath)

      console.log(`[SpedWorker] Parse concluído: ${parseResult.stats.accounts} contas, ${parseResult.stats.balances} saldos`)

      // 2. Salvar no banco de dados
      job.updateProgress(30)

      // Inserir arquivo SPED
      const [spedFile] = await db
        .insert(spedFiles)
        .values({
          ...parseResult.file,
          organizationId,
          uploadedBy: userId,
          status: 'completed',
        })
        .returning()

      job.updateProgress(40)

      // 3. Inserir plano de contas (batch)
      if (parseResult.accounts.length > 0) {
        const accountsWithOrg = parseResult.accounts.map((acc) => ({
          ...acc,
          spedFileId: spedFile.id,
          organizationId,
        }))

        await db.insert(chartOfAccounts).values(accountsWithOrg)
      }

      job.updateProgress(60)

      // 4. Inserir saldos (batch)
      if (parseResult.balances.length > 0) {
        const balancesWithOrg = parseResult.balances.map((bal) => ({
          ...bal,
          spedFileId: spedFile.id,
          organizationId,
        }))

        await db.insert(accountBalances).values(balancesWithOrg)
      }

      job.updateProgress(80)

      // 5. Inserir lançamentos e partidas (batch)
      if (parseResult.entries.length > 0) {
        const entriesWithOrg = parseResult.entries.map((entry) => ({
          ...entry,
          spedFileId: spedFile.id,
          organizationId,
        }))

        await db.insert(journalEntries).values(entriesWithOrg)

        // Inserir partidas
        const allItems: any[] = []
        parseResult.items.forEach((items, entryNumber) => {
          items.forEach((item) => {
            allItems.push({
              ...item,
              spedFileId: spedFile.id,
              organizationId,
            })
          })
        })

        if (allItems.length > 0) {
          await db.insert(journalItems).values(allItems)
        }
      }

      job.updateProgress(100)

      console.log(`[SpedWorker] Arquivo ${fileId} processado com sucesso`)

      return {
        success: true,
        fileId,
        spedFileId: spedFile.id,
        stats: parseResult.stats,
      }
    } catch (error) {
      console.error(`[SpedWorker] Erro ao processar ${fileId}:`, error)

      // Atualizar status do arquivo para failed
      await db
        .update(spedFiles)
        .set({
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
        })
        .where(eq(spedFiles.id, fileId))

      throw error
    }
  },
  {
    connection: redisConnection,
    concurrency: 3, // Processa até 3 SPEDs simultâneos
  }
)

// Event listeners
spedProcessingWorker.on('completed', (job) => {
  console.log(`[SpedWorker] Job ${job.id} completado`)
})

spedProcessingWorker.on('failed', (job, err) => {
  console.error(`[SpedWorker] Job ${job?.id} falhou:`, err)
})

export default spedProcessingWorker

