import { db } from '../lib/db'
import { documents } from '../lib/db/schema/documents'
import { normalizedData } from '../lib/db/schema/normalized-data'
import { normalizationTemplates } from '../lib/db/schema/normalization-templates'
import { eq, desc, like } from 'drizzle-orm'

async function checkDocumentData() {
  try {
    console.log('🔍 Buscando documento "MODELO - CONTRATO - PET"...\n')

    // Buscar documento
    const docs = await db
      .select()
      .from(documents)
      .where(like(documents.originalFileName, '%CONTRATO%PET%'))
      .orderBy(desc(documents.createdAt))
      .limit(1)

    if (docs.length === 0) {
      console.log('❌ Documento não encontrado!')
      
      // Listar últimos 5 documentos
      console.log('\n📋 Últimos 5 documentos uploadados:')
      const recent = await db
        .select({
          id: documents.id,
          fileName: documents.originalFileName,
          hash: documents.fileHash,
          normStatus: documents.normalizationStatus,
          templateId: documents.normalizationTemplateId,
          createdAt: documents.createdAt,
        })
        .from(documents)
        .orderBy(desc(documents.createdAt))
        .limit(5)

      recent.forEach((doc, i) => {
        console.log(`\n${i + 1}. ${doc.fileName}`)
        console.log(`   ID: ${doc.id}`)
        console.log(`   Hash: ${doc.hash?.substring(0, 16)}...`)
        console.log(`   Status: ${doc.normStatus}`)
        console.log(`   Template: ${doc.templateId || 'Nenhum'}`)
      })
      
      return
    }

    const doc = docs[0]
    console.log('✅ Documento encontrado!')
    console.log('📄 Informações do Documento:')
    console.log(`   ID: ${doc.id}`)
    console.log(`   Nome: ${doc.originalFileName}`)
    console.log(`   Hash: ${doc.fileHash?.substring(0, 16)}...`)
    console.log(`   Status Normalização: ${doc.normalizationStatus}`)
    console.log(`   Template ID: ${doc.normalizationTemplateId || 'Nenhum'}`)
    console.log(`   Record ID: ${doc.customTableRecordId || 'Nenhum'}`)

    // Buscar template
    if (doc.normalizationTemplateId) {
      console.log('\n📋 Template de Normalização:')
      const template = await db
        .select()
        .from(normalizationTemplates)
        .where(eq(normalizationTemplates.id, doc.normalizationTemplateId))
        .limit(1)

      if (template.length > 0) {
        console.log(`   Nome: ${template[0].name}`)
        console.log(`   Descrição: ${template[0].description}`)
        console.log(`   Criado por: ${template[0].createdBy}`)
        console.log(`   Campos:`)
        console.log(JSON.stringify(template[0].fields, null, 2))
      }
    }

    // Buscar dados normalizados
    console.log('\n💾 Dados Normalizados (JSONB):')
    const normalized = await db
      .select()
      .from(normalizedData)
      .where(eq(normalizedData.documentId, doc.id))
      .limit(1)

    if (normalized.length === 0) {
      console.log('   ❌ Nenhum dado normalizado encontrado na tabela normalized_data')
      console.log('\n⚠️  PROBLEMA: Documento foi processado mas dados não foram salvos em normalized_data!')
    } else {
      console.log('   ✅ Dados encontrados!')
      console.log(`   ID: ${normalized[0].id}`)
      console.log(`   Template ID: ${normalized[0].templateId}`)
      console.log('\n📊 PREVIEW DOS DADOS (JSONB):')
      console.log('━'.repeat(80))
      console.log(JSON.stringify(normalized[0].data, null, 2))
      console.log('━'.repeat(80))
    }

    console.log('\n✅ Consulta concluída!')

  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    process.exit(0)
  }
}

checkDocumentData()

