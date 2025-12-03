#!/usr/bin/env tsx
/**
 * Teste do Pipeline Completo de SPED
 * Valida: Upload → Parse → BD → Classificação → Template (SEM embeddings atualmente)
 */

import { db } from '@/lib/db'
import { 
  spedFiles, 
  chartOfAccounts, 
  accountBalances, 
  journalEntries,
  journalItems 
} from '@/lib/db/schema/sped'
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

async function testSpedPipeline() {
  console.log('\n=== TESTE: Pipeline de SPED ===\n')

  try {
    // Etapa 1: Verificar arquivos SPED no banco
    console.log('📋 Etapa 1: Verificar arquivos SPED')
    
    const spedFilesList = await db
      .select()
      .from(spedFiles)
      .orderBy(desc(spedFiles.createdAt))
      .limit(5)

    logResult(
      'Arquivos SPED',
      spedFilesList.length > 0 ? 'pass' : 'fail',
      `Encontrados ${spedFilesList.length} arquivos SPED`,
      { 
        count: spedFilesList.length,
        files: spedFilesList.map(f => ({
          fileName: f.fileName,
          fileType: f.fileType,
          status: f.status,
          cnpj: f.cnpj
        }))
      }
    )

    if (spedFilesList.length === 0) {
      logResult('Pipeline SPED', 'skip', 'Nenhum arquivo SPED para testar')
      return
    }

    const spedFile = spedFilesList[0]

    // Etapa 2: Verificar plano de contas
    console.log('\n📋 Etapa 2: Verificar plano de contas')
    
    const accounts = await db
      .select()
      .from(chartOfAccounts)
      .where(eq(chartOfAccounts.spedFileId, spedFile.id))
      .limit(10)

    logResult(
      'Plano de Contas',
      accounts.length > 0 ? 'pass' : 'fail',
      `Encontradas ${accounts.length} contas para arquivo ${spedFile.fileName}`,
      {
        spedFileId: spedFile.id,
        accountsCount: accounts.length,
        sampleAccounts: accounts.slice(0, 3).map(a => ({
          code: a.accountCode,
          name: a.accountName,
          type: a.accountType
        }))
      }
    )

    // Etapa 3: Verificar saldos
    console.log('\n📋 Etapa 3: Verificar saldos contábeis')
    
    const balances = await db
      .select()
      .from(accountBalances)
      .where(eq(accountBalances.spedFileId, spedFile.id))
      .limit(10)

    logResult(
      'Saldos Contábeis',
      balances.length > 0 ? 'pass' : 'fail',
      `Encontrados ${balances.length} saldos`,
      {
        balancesCount: balances.length,
        sampleBalances: balances.slice(0, 3).map(b => ({
          accountCode: b.accountCode,
          debit: b.debitTotal,
          credit: b.creditTotal
        }))
      }
    )

    // Etapa 4: Verificar lançamentos contábeis
    console.log('\n📋 Etapa 4: Verificar lançamentos contábeis')
    
    const entries = await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.spedFileId, spedFile.id))
      .limit(10)

    logResult(
      'Lançamentos Contábeis',
      entries.length > 0 ? 'pass' : 'fail',
      `Encontrados ${entries.length} lançamentos`,
      {
        entriesCount: entries.length
      }
    )

    // Etapa 5: Verificar partidas de lançamentos
    console.log('\n📋 Etapa 5: Verificar partidas de lançamentos')
    
    if (entries.length > 0) {
      const items = await db
        .select()
        .from(journalItems)
        .where(eq(journalItems.journalEntryId, entries[0].id))
        .limit(10)

      logResult(
        'Partidas de Lançamentos',
        items.length > 0 ? 'pass' : 'fail',
        `Encontradas ${items.length} partidas para lançamento ${entries[0].entryNumber}`,
        {
          entryId: entries[0].id,
          itemsCount: items.length
        }
      )
    }

    // Etapa 6: Verificar template gerado (classificação)
    console.log('\n📋 Etapa 6: Verificar template de classificação')
    
    const spedTemplates = await db
      .select()
      .from(templates)
      .where(eq(templates.documentFileId, spedFile.id))
      .limit(1)

    logResult(
      'Template de Classificação',
      spedTemplates.length > 0 ? 'pass' : 'fail',
      spedTemplates.length > 0 
        ? `Template encontrado: ${spedTemplates[0].title}`
        : 'Nenhum template gerado',
      spedTemplates.length > 0 ? {
        templateId: spedTemplates[0].id,
        title: spedTemplates[0].title,
        hasMetadata: spedTemplates[0].metadata !== null
      } : undefined
    )

    // Etapa 7: Verificar chunks e embeddings (ESPERADO: NÃO EXISTIR atualmente)
    console.log('\n📋 Etapa 7: Verificar chunks e embeddings (NÃO IMPLEMENTADO)')
    
    if (spedTemplates.length > 0) {
      const chunks = await db
        .select()
        .from(templateChunks)
        .where(eq(templateChunks.templateId, spedTemplates[0].id))
        .limit(1)

      logResult(
        'Chunks e Embeddings SPED',
        'skip',
        chunks.length > 0 
          ? `⚠️  INESPERADO: Encontrados ${chunks.length} chunks (implementação futura)`
          : '❌ Como esperado: Nenhum chunk gerado (será implementado)',
        {
          chunksCount: chunks.length,
          note: 'Chunking e embeddings para SPED serão implementados na Fase 2'
        }
      )
    }

    // Etapa 8: Verificar status de processamento
    console.log('\n📋 Etapa 8: Verificar status de processamento')
    
    const completedFiles = spedFilesList.filter(f => f.status === 'completed')
    const failedFiles = spedFilesList.filter(f => f.status === 'failed')
    
    logResult(
      'Status de Processamento',
      completedFiles.length > 0 ? 'pass' : 'fail',
      `${completedFiles.length} completados, ${failedFiles.length} falhados`,
      {
        completed: completedFiles.length,
        failed: failedFiles.length,
        pending: spedFilesList.filter(f => f.status === 'pending').length,
        processing: spedFilesList.filter(f => f.status === 'processing').length
      }
    )

  } catch (error) {
    logResult(
      'Pipeline SPED',
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
testSpedPipeline().catch(error => {
  console.error('❌ Erro fatal:', error)
  process.exit(1)
})

