import { db } from '../lib/db'
import { documents } from '../lib/db/schema/documents'
import { normalizedData } from '../lib/db/schema/normalized-data'
import { normalizedDataItems } from '../lib/db/schema/normalized-data-items'
import { eq } from 'drizzle-orm'

async function checkArticles() {
  try {
    const documentId = 'd8557445-232a-4e24-82c1-aa5bd0510056'
    
    console.log('🔍 Verificando documento...\n')
    
    // 1. Buscar documento
    const [doc] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1)
    
    if (!doc) {
      console.log('❌ Documento não encontrado')
      process.exit(1)
    }
    
    console.log('📄 Documento:', doc.fileName)
    console.log('📊 Status normalização:', doc.normalizationStatus)
    console.log('🎯 Score de confiança:', doc.normalizationConfidenceScore + '%')
    console.log('📅 Concluído em:', doc.normalizationCompletedAt)
    console.log('')
    
    // 2. Buscar dados normalizados (JSONB)
    if (doc.customTableRecordId) {
      const [normalized] = await db
        .select()
        .from(normalizedData)
        .where(eq(normalizedData.id, doc.customTableRecordId))
        .limit(1)
      
      if (normalized) {
        const data = normalized.data as any
        
        console.log('📚 DADOS EXTRAÍDOS:')
        console.log('Campos disponíveis:', Object.keys(data).join(', '))
        console.log('')
        
        if (data.artigos && Array.isArray(data.artigos)) {
          console.log('✅ ARTIGOS ENCONTRADOS!')
          console.log('   Total:', data.artigos.length, 'artigos')
          console.log('')
          
          // Mostrar amostra
          console.log('📋 AMOSTRA:')
          data.artigos.slice(0, 10).forEach((art: any) => {
            const paragrafos = art.paragrafos?.length || 0
            const incisos = art.paragrafos?.reduce((sum: number, p: any) => sum + (p.incisos?.length || 0), 0) || 0
            console.log(`   Art. ${art.numero}: ${paragrafos} §, ${incisos} incisos`)
          })
          
          if (data.artigos.length > 10) {
            console.log('   ...')
            const ultimosArtigos = data.artigos.slice(-3)
            ultimosArtigos.forEach((art: any) => {
              console.log(`   Art. ${art.numero}`)
            })
          }
          
          // Contar estrutura completa
          let totalParagrafos = 0
          let totalIncisos = 0
          let totalAlineas = 0
          
          data.artigos.forEach((art: any) => {
            if (art.paragrafos) {
              totalParagrafos += art.paragrafos.length
              art.paragrafos.forEach((p: any) => {
                if (p.incisos) {
                  totalIncisos += p.incisos.length
                  p.incisos.forEach((i: any) => {
                    if (i.alineas) {
                      totalAlineas += i.alineas.length
                    }
                  })
                }
              })
            }
          })
          
          console.log('')
          console.log('📊 ESTRUTURA HIERÁRQUICA COMPLETA:')
          console.log('   🔹 Artigos:', data.artigos.length)
          console.log('   🔹 Parágrafos:', totalParagrafos)
          console.log('   🔹 Incisos:', totalIncisos)
          console.log('   🔹 Alíneas:', totalAlineas)
          console.log('   📦 TOTAL de elementos:', data.artigos.length + totalParagrafos + totalIncisos + totalAlineas)
        } else {
          console.log('⚠️  Campo "artigos" não encontrado')
        }
        
        // Verificar outros campos
        if (data.origem) {
          console.log('\n📍 Origem:', data.origem)
        }
      }
      
      // 3. Buscar dados relacionais
      const relationalItems = await db
        .select()
        .from(normalizedDataItems)
        .where(eq(normalizedDataItems.normalizedDataId, doc.customTableRecordId))
      
      console.log('')
      if (relationalItems.length > 0) {
        const artigos = relationalItems.filter(i => i.itemType === 'artigo')
        const paragrafos = relationalItems.filter(i => i.itemType === 'paragrafo')
        const incisos = relationalItems.filter(i => i.itemType === 'inciso')
        const alineas = relationalItems.filter(i => i.itemType === 'alinea')
        
        console.log('🗄️  TABELA RELACIONAL:')
        console.log('   Artigos:', artigos.length)
        console.log('   Parágrafos:', paragrafos.length)
        console.log('   Incisos:', incisos.length)
        console.log('   Alíneas:', alineas.length)
        console.log('   📦 TOTAL:', relationalItems.length, 'itens salvos')
      } else {
        console.log('⚠️  Nenhum item na tabela relacional')
        console.log('   (Armazenamento duplo não foi executado)')
      }
    } else {
      console.log('⚠️  Documento ainda não tem dados normalizados')
    }
    
    console.log('\n✅ Verificação concluída!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }
}

checkArticles()
