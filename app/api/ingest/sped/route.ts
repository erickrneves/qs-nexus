import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { parseSpedFile, SpedParseResult } from '@/lib/services/sped-parser'
import { db } from '@/lib/db'
import {
  spedFiles,
  chartOfAccounts,
  accountBalances,
  journalEntries,
  journalItems,
} from '@/lib/db/schema/sped'
import { eq } from 'drizzle-orm'

export const maxDuration = 300 // 5 minutos para arquivos grandes

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Arquivo não fornecido' }, { status: 400 })
    }

    // Validar extensão
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.txt') && !fileName.endsWith('.sped')) {
      return NextResponse.json(
        { error: 'Formato inválido. Envie um arquivo .txt ou .sped' },
        { status: 400 }
      )
    }

    console.log(`\n=== INGESTÃO SPED: ${file.name} ===`)
    console.log(`Tamanho: ${(file.size / 1024 / 1024).toFixed(2)} MB`)

    // Salvar arquivo temporariamente
    const uploadDir = join(process.cwd(), 'uploads', 'sped')
    await mkdir(uploadDir, { recursive: true })

    const filePath = join(uploadDir, `${Date.now()}-${file.name}`)
    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    console.log(`Arquivo salvo em: ${filePath}`)

    // Parse do arquivo SPED
    console.log('Iniciando parse do SPED...')
    const parseResult = await parseSpedFile(filePath)

    console.log(`Parse concluído:`)
    console.log(`  - Contas: ${parseResult.stats.accounts}`)
    console.log(`  - Saldos: ${parseResult.stats.balances}`)
    console.log(`  - Lançamentos: ${parseResult.stats.entries}`)
    console.log(`  - Partidas: ${parseResult.stats.items}`)
    console.log(`  - Erros: ${parseResult.stats.errors}`)

    // Salvar no banco de dados
    console.log('Salvando no banco de dados...')

    // 1. Inserir arquivo SPED
    const [spedFile] = await db
      .insert(spedFiles)
      .values({
        ...parseResult.file,
        status: 'completed',
      })
      .returning()

    console.log(`Arquivo SPED criado: ${spedFile.id}`)

    // 2. Inserir plano de contas em batch
    if (parseResult.accounts.length > 0) {
      const accountsToInsert = parseResult.accounts.map(acc => ({
        ...acc,
        spedFileId: spedFile.id,
      }))

      // Inserir em batches de 500
      for (let i = 0; i < accountsToInsert.length; i += 500) {
        const batch = accountsToInsert.slice(i, i + 500)
        await db.insert(chartOfAccounts).values(batch)
      }
      console.log(`${parseResult.accounts.length} contas inseridas`)
    }

    // 3. Inserir saldos
    if (parseResult.balances.length > 0) {
      const balancesToInsert = parseResult.balances.map(bal => ({
        ...bal,
        spedFileId: spedFile.id,
      }))

      for (let i = 0; i < balancesToInsert.length; i += 500) {
        const batch = balancesToInsert.slice(i, i + 500)
        await db.insert(accountBalances).values(batch)
      }
      console.log(`${parseResult.balances.length} saldos inseridos`)
    }

    // 4. Inserir lançamentos
    if (parseResult.entries.length > 0) {
      for (const entry of parseResult.entries) {
        const [insertedEntry] = await db
          .insert(journalEntries)
          .values({
            ...entry,
            spedFileId: spedFile.id,
          })
          .returning()

        // 5. Inserir partidas do lançamento
        const items = parseResult.items.get(entry.entryNumber)
        if (items && items.length > 0) {
          const itemsToInsert = items.map(item => ({
            ...item,
            journalEntryId: insertedEntry.id,
          }))

          await db.insert(journalItems).values(itemsToInsert)
        }
      }
      console.log(`${parseResult.entries.length} lançamentos inseridos`)
    }

    console.log('=== INGESTÃO CONCLUÍDA ===\n')

    return NextResponse.json({
      success: true,
      fileId: spedFile.id,
      company: spedFile.companyName,
      cnpj: spedFile.cnpj,
      period: {
        start: spedFile.periodStart,
        end: spedFile.periodEnd,
      },
      stats: parseResult.stats,
      errors: parseResult.errors.slice(0, 10), // Primeiros 10 erros apenas
    })
  } catch (error) {
    console.error('Erro na ingestão SPED:', error)

    return NextResponse.json(
      {
        error: 'Erro ao processar arquivo SPED',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}

