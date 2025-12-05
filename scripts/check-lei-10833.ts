import { db } from '../lib/db'
import { documents } from '../lib/db/schema/documents'
import { normalizedData } from '../lib/db/schema/normalized-data'
import { normalizationTemplates } from '../lib/db/schema/normalization-templates'
import { eq, desc, like } from 'drizzle-orm'

async function checkLei10833() {
  try {
    console.log('🔍 Buscando documento "L10833.pdf" (hash: nyowcq...)...\n')

    // Buscar documento por nome ou hash
    const docs = await db
      .select()
      .from(documents)
      .where(like(documents.fileHash, 'nyowcq%'))
      .orderBy(desc(documents.createdAt))
      .limit(1)

    if (docs.length === 0) {
      console.log('❌ Documento não encontrado pelo hash!')
      console.log('Tentando buscar por nome do arquivo...\n')
      
      const docsByName = await db
        .select()
        .from(documents)
        .where(like(documents.originalFileName, '%10833%'))
        .orderBy(desc(documents.createdAt))
        .limit(1)

      if (docsByName.length === 0) {
        console.log('❌ Documento não encontrado!')
        
        // Listar últimos 10 documentos
        console.log('\n📋 Últimos 10 documentos:')
        const recent = await db
          .select({
            id: documents.id,
            fileName: documents.originalFileName,
            hash: documents.fileHash,
            normStatus: documents.normalizationStatus,
            createdAt: documents.createdAt,
          })
          .from(documents)
          .orderBy(desc(documents.createdAt))
          .limit(10)

        recent.forEach((doc, i) => {
          console.log(`\n${i + 1}. ${doc.fileName}`)
          console.log(`   Hash: ${doc.hash?.substring(0, 16)}...`)
          console.log(`   Status: ${doc.normStatus}`)
        })
        
        return
      }
      
      console.log('✅ Encontrado por nome!')
      docs.push(docsByName[0])
    }

    const doc = docs[0]
    console.log('✅ Documento encontrado!')
    console.log('━'.repeat(80))
    console.log('📄 INFORMAÇÕES DO DOCUMENTO:')
    console.log(`   ID: ${doc.id}`)
    console.log(`   Nome: ${doc.originalFileName}`)
    console.log(`   Hash: ${doc.fileHash}`)
    console.log(`   Tamanho: ${(doc.fileSize / 1024).toFixed(2)} KB`)
    console.log(`   Status Normalização: ${doc.normalizationStatus}`)
    console.log(`   Template ID: ${doc.normalizationTemplateId || 'Nenhum'}`)
    console.log(`   Upload em: ${new Date(doc.createdAt).toLocaleString('pt-BR')}`)
    console.log('━'.repeat(80))

    // Buscar template
    if (doc.normalizationTemplateId) {
      console.log('\n📋 TEMPLATE DE NORMALIZAÇÃO:')
      const template = await db
        .select()
        .from(normalizationTemplates)
        .where(eq(normalizationTemplates.id, doc.normalizationTemplateId))
        .limit(1)

      if (template.length > 0) {
        console.log(`   Nome: ${template[0].name}`)
        console.log(`   Descrição: ${template[0].description || 'Sem descrição'}`)
        console.log(`   Criado por: ${template[0].createdBy}`)
        console.log(`   Total de campos: ${Array.isArray(template[0].fields) ? template[0].fields.length : 0}`)
        
        if (Array.isArray(template[0].fields)) {
          console.log('\n   📝 Campos do Template:')
          template[0].fields.forEach((field: any, i: number) => {
            console.log(`      ${i + 1}. ${field.displayName || field.fieldName} (${field.fieldType})`)
            if (field.description) {
              console.log(`         ${field.description}`)
            }
          })
        }
      }
    } else {
      console.log('\n⚠️  Documento NÃO TEM template associado!')
    }

    // Buscar dados normalizados
    console.log('\n━'.repeat(80))
    console.log('💾 DADOS NORMALIZADOS (JSONB):')
    console.log('━'.repeat(80))
    
    const normalized = await db
      .select()
      .from(normalizedData)
      .where(eq(normalizedData.documentId, doc.id))
      .limit(1)

    if (normalized.length === 0) {
      console.log('\n❌ NENHUM DADO NORMALIZADO ENCONTRADO!')
      console.log('   O documento foi processado mas dados não foram salvos.')
      console.log('\n   Possíveis causas:')
      console.log('   - Normalização não foi executada')
      console.log('   - Erro durante a extração de dados')
      console.log('   - Template não compatível com o documento')
    } else {
      const data = normalized[0].data as any
      console.log('\n✅ DADOS ENCONTRADOS!')
      console.log(`   Record ID: ${normalized[0].id}`)
      console.log(`   Criado em: ${new Date(normalized[0].createdAt).toLocaleString('pt-BR')}`)
      
      // Analisar estrutura dos dados
      console.log('\n📊 ESTRUTURA DOS DADOS:')
      console.log(`   Total de campos preenchidos: ${Object.keys(data).length}`)
      
      // Procurar por artigos
      console.log('\n🔍 ANÁLISE DE ARTIGOS DA LEI:')
      
      let artigosEncontrados = 0
      let campoComArtigos = null
      
      for (const [key, value] of Object.entries(data)) {
        if (Array.isArray(value)) {
          console.log(`\n   Campo: "${key}"`)
          console.log(`   Tipo: Array com ${value.length} item(s)`)
          
          // Verificar se são artigos
          if (key.toLowerCase().includes('artig') || key.toLowerCase().includes('article')) {
            artigosEncontrados = value.length
            campoComArtigos = key
            
            console.log(`   ✅ ARTIGOS ENCONTRADOS: ${value.length}`)
            console.log('\n   Primeiros 5 artigos:')
            value.slice(0, 5).forEach((item: any, i: number) => {
              console.log(`\n   ${i + 1}. ${typeof item === 'object' ? JSON.stringify(item, null, 6) : item}`)
            })
            
            if (value.length > 5) {
              console.log(`\n   ... e mais ${value.length - 5} artigos`)
            }
          }
        }
      }
      
      if (artigosEncontrados === 0) {
        console.log('\n⚠️  NÃO FORAM ENCONTRADOS CAMPOS COM ARTIGOS!')
        console.log('\nCampos disponíveis:')
        Object.keys(data).forEach(key => {
          const value = data[key]
          const tipo = Array.isArray(value) ? `Array[${value.length}]` : typeof value
          console.log(`   - ${key}: ${tipo}`)
        })
      }
      
      console.log('\n━'.repeat(80))
      console.log('📄 PREVIEW COMPLETO DOS DADOS (JSONB):')
      console.log('━'.repeat(80))
      console.log(JSON.stringify(data, null, 2))
      console.log('━'.repeat(80))
      
      // Resumo final
      console.log('\n✅ RESUMO:')
      if (artigosEncontrados > 0) {
        console.log(`   ✅ ${artigosEncontrados} artigos salvos no campo "${campoComArtigos}"`)
        console.log(`   ✅ Dados armazenados em normalized_data (JSONB)`)
        console.log(`   ✅ Template ID: ${normalized[0].templateId}`)
      } else {
        console.log(`   ⚠️  Artigos não foram identificados como array separado`)
        console.log(`   📊 ${Object.keys(data).length} campos foram salvos`)
        console.log(`   💡 Os artigos podem estar dentro de outro campo ou em formato diferente`)
      }
    }

    console.log('\n✅ Análise concluída!')

  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    process.exit(0)
  }
}

checkLei10833()

