/**
 * Verificar resultado da extração da Lei 10833
 */

import { db } from '../lib/db'
import { documents, normalizedData } from '../lib/db/schema'
import { eq } from 'drizzle-orm'

async function checkResult() {
  try {
    const docId = 'a5e72651-fdfb-41a4-a1f4-7bb48f55edac'
    
    console.log('🔍 Buscando documento...\n')
    
    const [doc] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, docId))
      .limit(1)
    
    if (!doc) {
      console.error('❌ Documento não encontrado')
      process.exit(1)
    }
    
    console.log('📄 DOCUMENTO:')
    console.log(`   Nome: ${doc.fileName}`)
    console.log(`   ID: ${doc.id}`)
    console.log(`   Hash: ${doc.fileHash}`)
    console.log(`   Template ID: ${doc.normalizationTemplateId}`)
    console.log(`   Status: ${doc.normalizationStatus}`)
    console.log(`   Confiança: ${doc.normalizationConfidenceScore}%`)
    console.log(`   Progress: ${doc.normalizationProgress}%`)
    console.log(`   Erro: ${doc.normalizationError || 'NENHUM'}`)
    console.log('')
    
    // Verificar se tem draft data
    if (doc.normalizationDraftData) {
      const draftData = doc.normalizationDraftData as any
      console.log('📊 DRAFT DATA:')
      console.log(`   Campos: ${Object.keys(draftData).length}`)
      console.log(`   Artigos: ${draftData.artigos?.length || 0}`)
      console.log(`   Origem: ${draftData.origem || 'N/A'}`)
      console.log(`   Número Lei: ${draftData.numero_lei || 'N/A'}`)
      console.log('')
      
      // Mostrar primeiros 3 artigos
      if (draftData.artigos && Array.isArray(draftData.artigos)) {
        console.log('📋 PRIMEIROS 3 ARTIGOS:')
        draftData.artigos.slice(0, 3).forEach((art: any, idx: number) => {
          console.log(`\n   ${idx + 1}. Artigo ${art.numero}:`)
          console.log(`      Caput: ${art.caput?.substring(0, 100)}...`)
          console.log(`      Parágrafos: ${art.paragrafos?.length || 0}`)
        })
        console.log('')
      }
      
      // Verificar se foi salvo em normalized_data
      console.log('🔍 Verificando normalized_data...\n')
      
      const normalizedRecords = await db
        .select()
        .from(normalizedData)
        .where(eq(normalizedData.documentId, docId))
      
      console.log(`   Registros em normalized_data: ${normalizedRecords.length}`)
      
      if (normalizedRecords.length > 0) {
        normalizedRecords.forEach((rec, idx) => {
          const recData = rec.data as any
          console.log(`\n   ${idx + 1}. ID: ${rec.id}`)
          console.log(`      Template: ${rec.templateId}`)
          console.log(`      Artigos: ${recData.artigos?.length || 0}`)
          console.log(`      Created: ${rec.createdAt}`)
        })
      }
    }
    
    console.log('')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }
}

checkResult()

