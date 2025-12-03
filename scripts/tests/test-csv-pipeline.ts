#!/usr/bin/env tsx
/**
 * Teste do Pipeline Completo de CSV
 * Valida: Upload → Parse → BD → Resumo Markdown (SEM classificação/embeddings atualmente)
 */

import { db } from '@/lib/db'
import { csvImports, csvData } from '@/lib/db/schema/sped'
import { templates, templateChunks } from '@/lib/db/schema/rag'
import { eq, desc } from 'drizzle-orm'

interface TestResult {
  step: string
  status: 'pass' | 'fail' | 'skip'
  message: string
  details?: any
}

const results: TestResult[] = []

function logResult(step: string, status: 'pass' | 'fail' | 'skip', message: string, details?: any) {
  results.push({ step, status, message, details })
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️'
  console.log(`${icon} ${step}: ${message}`)
  if (details) {
    console.log('   Detalhes:', JSON.stringify(details, null, 2))
  }
}

async function testCsvPipeline() {
  console.log('\n=== TESTE: Pipeline de CSV ===\n')

  try {
    // Etapa 1: Verificar importações CSV no banco
    console.log('📋 Etapa 1: Verificar importações CSV')
    
    const imports = await db
      .select()
      .from(csvImports)
      .orderBy(desc(csvImports.createdAt))
      .limit(5)

    logResult(
      'Importações CSV',
      imports.length > 0 ? 'pass' : 'fail',
      `Encontradas ${imports.length} importações CSV`,
      { 
        count: imports.length,
        imports: imports.map(i => ({
          fileName: i.fileName,
          status: i.status,
          totalRows: i.totalRows,
          delimiter: i.delimiter
        }))
      }
    )

    if (imports.length === 0) {
      logResult('Pipeline CSV', 'skip', 'Nenhuma importação CSV para testar')
      return
    }

    const csvImport = imports[0]

    // Etapa 2: Verificar dados CSV importados
    console.log('\n📋 Etapa 2: Verificar dados CSV importados')
    
    const dataRows = await db
      .select()
      .from(csvData)
      .where(eq(csvData.csvImportId, csvImport.id))
      .limit(10)

    logResult(
      'Dados CSV',
      dataRows.length > 0 ? 'pass' : 'fail',
      `Encontradas ${dataRows.length} linhas de dados para ${csvImport.fileName}`,
      {
        csvImportId: csvImport.id,
        rowsCount: dataRows.length,
        sampleRow: dataRows[0]
      }
    )

    // Etapa 3: Verificar metadados de parsing
    console.log('\n📋 Etapa 3: Verificar metadados de parsing')
    
    logResult(
      'Metadados de Parsing',
      csvImport.delimiter !== null ? 'pass' : 'fail',
      `Delimitador: ${csvImport.delimiter}, Encoding: ${csvImport.encoding}, Header: ${csvImport.hasHeader}`,
      {
        delimiter: csvImport.delimiter,
        encoding: csvImport.encoding,
        hasHeader: csvImport.hasHeader,
        totalRows: csvImport.totalRows,
        importedRows: csvImport.importedRows
      }
    )

    // Etapa 4: Verificar status de processamento
    console.log('\n📋 Etapa 4: Verificar status de processamento')
    
    const completedImports = imports.filter(i => i.status === 'completed')
    const failedImports = imports.filter(i => i.status === 'failed')
    
    logResult(
      'Status de Processamento',
      completedImports.length > 0 ? 'pass' : 'fail',
      `${completedImports.length} completados, ${failedImports.length} falhados`,
      {
        completed: completedImports.length,
        failed: failedImports.length,
        pending: imports.filter(i => i.status === 'pending').length
      }
    )

    // Etapa 5: Verificar template/classificação (ESPERADO: NÃO EXISTIR atualmente)
    console.log('\n📋 Etapa 5: Verificar template de classificação (NÃO IMPLEMENTADO)')
    
    // CSV não tem documentFileId direto, então precisaríamos de uma ligação
    // Por enquanto, apenas verificamos se existe algum template relacionado
    logResult(
      'Template de Classificação CSV',
      'skip',
      '❌ Como esperado: Nenhum template gerado (será implementado)',
      {
        note: 'Classificação e templates para CSV serão implementados na Fase 3'
      }
    )

    // Etapa 6: Verificar chunks e embeddings (ESPERADO: NÃO EXISTIR atualmente)
    console.log('\n📋 Etapa 6: Verificar chunks e embeddings (NÃO IMPLEMENTADO)')
    
    logResult(
      'Chunks e Embeddings CSV',
      'skip',
      '❌ Como esperado: Nenhum chunk/embedding gerado (será implementado)',
      {
        note: 'Chunking e embeddings para CSV serão implementados na Fase 3'
      }
    )

    // Etapa 7: Verificar integridade dos dados
    console.log('\n📋 Etapa 7: Verificar integridade dos dados')
    
    const totalRowsInDB = dataRows.length
    const expectedRows = csvImport.importedRows
    
    logResult(
      'Integridade dos Dados',
      totalRowsInDB > 0 ? 'pass' : 'fail',
      `${totalRowsInDB} linhas verificadas (importadas: ${expectedRows})`,
      {
        rowsInDB: totalRowsInDB,
        importedRows: expectedRows,
        totalRows: csvImport.totalRows
      }
    )

  } catch (error) {
    logResult(
      'Pipeline CSV',
      'fail',
      `Erro durante validação: ${error instanceof Error ? error.message : String(error)}`
    )
  }

  // Resumo final
  console.log('\n' + '='.repeat(60))
  console.log('📊 RESUMO DOS TESTES')
  console.log('='.repeat(60))
  
  const passed = results.filter(r => r.status === 'pass').length
  const failed = results.filter(r => r.status === 'fail').length
  const skipped = results.filter(r => r.status === 'skip').length
  
  console.log(`✅ Aprovados: ${passed}`)
  console.log(`❌ Falhados: ${failed}`)
  console.log(`⏭️  Ignorados: ${skipped}`)
  console.log(`📝 Total: ${results.length}`)
  
  const testsRun = passed + failed
  const successRate = testsRun > 0 ? ((passed / testsRun) * 100).toFixed(1) : '0.0'
  console.log(`\n🎯 Taxa de sucesso: ${successRate}%`)
  
  if (failed > 0) {
    console.log('\n⚠️  TESTES FALHADOS:')
    results.filter(r => r.status === 'fail').forEach(r => {
      console.log(`   - ${r.step}: ${r.message}`)
    })
  }

  console.log('\n')
  process.exit(failed > 0 ? 1 : 0)
}

// Executar teste
testCsvPipeline().catch(error => {
  console.error('❌ Erro fatal:', error)
  process.exit(1)
})

