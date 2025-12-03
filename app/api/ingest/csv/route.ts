import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { parseCsvFile, CsvParseResult, generateCsvSummaryMarkdown } from '@/lib/services/csv-parser'
import { db } from '@/lib/db'
import { csvImports, csvData } from '@/lib/db/schema/sped'
import { processCsvForRag } from '@/lib/services/csv-rag-processor'

export const maxDuration = 120 // 2 minutos

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const delimiter = formData.get('delimiter') as string | null
    const hasHeader = formData.get('hasHeader') !== 'false'

    if (!file) {
      return NextResponse.json({ error: 'Arquivo não fornecido' }, { status: 400 })
    }

    // Validar extensão
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.txt')) {
      return NextResponse.json(
        { error: 'Formato inválido. Envie um arquivo .csv ou .txt' },
        { status: 400 }
      )
    }

    console.log(`\n=== INGESTÃO CSV: ${file.name} ===`)
    console.log(`Tamanho: ${(file.size / 1024 / 1024).toFixed(2)} MB`)

    // Salvar arquivo temporariamente
    const uploadDir = join(process.cwd(), 'uploads', 'csv')
    await mkdir(uploadDir, { recursive: true })

    const filePath = join(uploadDir, `${Date.now()}-${file.name}`)
    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    console.log(`Arquivo salvo em: ${filePath}`)

    // Parse do arquivo CSV
    console.log('Iniciando parse do CSV...')
    const parseResult = await parseCsvFile(filePath, {
      delimiter: delimiter || 'auto',
      hasHeader,
      maxRows: 10000, // Limite de linhas por arquivo
    })

    console.log(`Parse concluído:`)
    console.log(`  - Linhas: ${parseResult.stats.totalLines}`)
    console.log(`  - Processadas: ${parseResult.stats.processedRows}`)
    console.log(`  - Delimitador: ${parseResult.stats.detectedDelimiter}`)
    console.log(`  - Encoding: ${parseResult.stats.detectedEncoding}`)
    console.log(`  - Erros: ${parseResult.stats.errors}`)

    // Salvar no banco de dados
    console.log('Salvando no banco de dados...')

    // 1. Inserir registro de importação
    const [csvImport] = await db
      .insert(csvImports)
      .values({
        ...parseResult.import,
        status: 'completed',
      })
      .returning()

    console.log(`Importação CSV criada: ${csvImport.id}`)

    // 2. Inserir dados em batch
    if (parseResult.rows.length > 0) {
      const dataToInsert = parseResult.rows.map(row => ({
        ...row,
        csvImportId: csvImport.id,
      }))

      // Inserir em batches de 500
      for (let i = 0; i < dataToInsert.length; i += 500) {
        const batch = dataToInsert.slice(i, i + 500)
        await db.insert(csvData).values(batch)
      }
      console.log(`${parseResult.rows.length} linhas inseridas`)
    }

    // Gerar resumo markdown para RAG
    const summaryMarkdown = generateCsvSummaryMarkdown(parseResult)

    // Processar para RAG (classificação + chunks + embeddings) - assíncrono
    console.log('Iniciando processamento RAG...')
    processCsvForRag(csvImport.id, (progress) => {
      console.log(`  [RAG] Etapa ${progress.step}/${progress.totalSteps}: ${progress.message} (${progress.progress}%)`)
    })
      .then(ragResult => {
        if (ragResult.success) {
          console.log(`RAG processado com sucesso! Template: ${ragResult.templateId}`)
        } else {
          console.warn(`Erro no processamento RAG: ${ragResult.error}`)
        }
      })
      .catch(err => {
        console.error('Erro no processamento RAG:', err)
      })

    console.log('=== INGESTÃO CONCLUÍDA ===\n')

    return NextResponse.json({
      success: true,
      importId: csvImport.id,
      fileName: csvImport.fileName,
      stats: parseResult.stats,
      headers: parseResult.headers,
      sampleRows: parseResult.rows.slice(0, 5),
      summaryMarkdown,
      errors: parseResult.errors.slice(0, 10),
      message: 'CSV importado com sucesso. Processamento RAG em andamento...'
    })
  } catch (error) {
    console.error('Erro na ingestão CSV:', error)

    return NextResponse.json(
      {
        error: 'Erro ao processar arquivo CSV',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}

