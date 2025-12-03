#!/usr/bin/env tsx
/**
 * Teste do Pipeline Completo de Documentos
 * Valida: Upload → Markdown → Classificação → Chunks → Embeddings → Banco
 */

import { db } from '@/lib/db'
import { documents } from '@/lib/db/schema/documents'
import { documentFiles, templates, templateChunks } from '@/lib/db/schema/rag'
import { eq, desc } from 'drizzle-orm'
import { processFile } from '@/lib/services/rag-processor'
import { join } from 'path'
import { existsSync } from 'fs'

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

async function testDocumentPipeline() {
  console.log('\n=== TESTE: Pipeline de Documentos ===\n')

  // Etapa 1: Verificar se há arquivos de teste disponíveis
  console.log('📋 Etapa 1: Verificar arquivos de teste')
  
  const testFilesDir = join(process.cwd(), 'data', 'process')
  if (!existsSync(testFilesDir)) {
    logResult('Arquivos de teste', 'skip', `Diretório de teste não encontrado: ${testFilesDir}`)
    return
  }

  // Etapa 2: Buscar documentos recentes no banco
  console.log('\n📋 Etapa 2: Buscar documentos processados recentemente')
  
  try {
    const recentDocs = await db
      .select()
      .from(documents)
      .orderBy(desc(documents.createdAt))
      .limit(5)

    logResult(
      'Documentos no banco',
      recentDocs.length > 0 ? 'pass' : 'fail',
      `Encontrados ${recentDocs.length} documentos`,
      { count: recentDocs.length, statuses: recentDocs.map(d => d.status) }
    )

    // Etapa 3: Verificar document_files
    console.log('\n📋 Etapa 3: Verificar document_files (tracking)')
    
    const docFiles = await db
      .select()
      .from(documentFiles)
      .orderBy(desc(documentFiles.createdAt))
      .limit(5)

    logResult(
      'Document Files',
      docFiles.length > 0 ? 'pass' : 'fail',
      `Encontrados ${docFiles.length} arquivos rastreados`,
      { 
        count: docFiles.length, 
        statuses: docFiles.map(d => ({ status: d.status, fileName: d.fileName }))
      }
    )

    // Etapa 4: Verificar templates gerados
    console.log('\n📋 Etapa 4: Verificar templates (classificações)')
    
    const docTemplates = await db
      .select()
      .from(templates)
      .orderBy(desc(templates.createdAt))
      .limit(5)

    logResult(
      'Templates',
      docTemplates.length > 0 ? 'pass' : 'fail',
      `Encontrados ${docTemplates.length} templates`,
      { 
        count: docTemplates.length,
        titles: docTemplates.map(t => t.title)
      }
    )

    // Etapa 5: Verificar chunks com embeddings
    console.log('\n📋 Etapa 5: Verificar chunks e embeddings')
    
    if (docTemplates.length > 0) {
      const templateId = docTemplates[0].id
      const chunks = await db
        .select()
        .from(templateChunks)
        .where(eq(templateChunks.templateId, templateId))
        .limit(10)

      const hasEmbeddings = chunks.filter(c => c.embedding !== null).length
      
      logResult(
        'Chunks e Embeddings',
        hasEmbeddings > 0 ? 'pass' : 'fail',
        `Template ${docTemplates[0].title}: ${chunks.length} chunks, ${hasEmbeddings} com embeddings`,
        {
          templateId,
          totalChunks: chunks.length,
          withEmbeddings: hasEmbeddings,
          embeddingDimension: chunks[0]?.embedding?.length || 0
        }
      )

      // Verificar dimensão do vetor
      if (chunks[0]?.embedding) {
        const dimension = chunks[0].embedding.length
        logResult(
          'Dimensão do vetor',
          dimension === 1536 ? 'pass' : 'fail',
          `Dimensão: ${dimension} (esperado: 1536)`,
          { dimension }
        )
      }
    } else {
      logResult('Chunks e Embeddings', 'skip', 'Nenhum template disponível para verificar')
    }

    // Etapa 6: Verificar metadata JSONB
    console.log('\n📋 Etapa 6: Verificar metadata JSONB')
    
    if (docTemplates.length > 0) {
      const template = docTemplates[0]
      const hasMetadata = template.metadata !== null
      
      logResult(
        'Metadata JSONB',
        hasMetadata ? 'pass' : 'fail',
        hasMetadata ? 'Metadata presente' : 'Metadata ausente',
        template.metadata
      )
    }

    // Etapa 7: Verificar custos e tokens
    console.log('\n📋 Etapa 7: Verificar rastreamento de custos')
    
    if (docTemplates.length > 0) {
      const withCost = docTemplates.filter(t => t.costUsd !== null)
      const withTokens = docTemplates.filter(t => t.inputTokens !== null)
      
      logResult(
        'Rastreamento de custos',
        withCost.length > 0 ? 'pass' : 'fail',
        `${withCost.length}/${docTemplates.length} templates com custo, ${withTokens.length}/${docTemplates.length} com tokens`,
        {
          templatesWithCost: withCost.length,
          templatesWithTokens: withTokens.length,
          totalTemplates: docTemplates.length
        }
      )
    }

  } catch (error) {
    logResult(
      'Pipeline de Documentos',
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
  
  const successRate = ((passed / (passed + failed)) * 100).toFixed(1)
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
testDocumentPipeline().catch(error => {
  console.error('❌ Erro fatal:', error)
  process.exit(1)
})

