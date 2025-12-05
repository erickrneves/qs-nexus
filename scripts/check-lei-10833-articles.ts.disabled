import { db } from '../lib/db'
import { documents } from '../lib/db/schema/documents'
import { normalizedData } from '../lib/db/schema/normalized-data'
import { normalizedDataItems } from '../lib/db/schema/normalized-data-items'
import { eq } from 'drizzle-orm'

async function checkArticles() {
  try {
    const documentId = '94fdf68d-0671-4e40-be23-fcf43d316bc3'
    
    console.log('🔍 Verificando Lei 10.833...\n')
    
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
    console.log('🎯 Score de confiança:', doc.normalizationConfidenceScore + '%\n')
    
    // 2. Buscar dados normalizados (JSONB)
    if (doc.customTableRecordId) {
      const [normalized] = await db
        .select()
        .from(normalizedData)
        .where(eq(normalizedData.id, doc.customTableRecordId))
        .limit(1)
      
      if (normalized) {
        const data = normalized.data as any
        
        if (data.artigos && Array.isArray(data.artigos)) {
          console.log('📚 DADOS JSONB:')
          console.log('   Total de artigos:', data.artigos.length)
          console.log('   Primeiros artigos:', data.artigos.slice(0, 5).map((a: any) => `Art. ${a.numero}`).join(', '))
          console.log('   Últimos artigos:', data.artigos.slice(-5).map((a: any) => `Art. ${a.numero}`).join(', '))
          
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
          
          console.log('\n📊 ESTRUTURA HIERÁRQUICA:')
          console.log('   Artigos:', data.artigos.length)
          console.log('   Parágrafos:', totalParagrafos)
          console.log('   Incisos:', totalIncisos)
          console.log('   Alíneas:', totalAlineas)
        } else {
          console.log('⚠️  Campo "artigos" não encontrado nos dados')
          console.log('Dados disponíveis:', Object.keys(data))
        }
      }
      
      // 3. Buscar dados relacionais
      const relationalItems = await db
        .select()
        .from(normalizedDataItems)
        .where(eq(normalizedDataItems.normalizedDataId, doc.customTableRecordId))
      
      if (relationalItems.length > 0) {
        const artigos = relationalItems.filter(i => i.itemType === 'artigo')
        const paragrafos = relationalItems.filter(i => i.itemType === 'paragrafo')
        const incisos = relationalItems.filter(i => i.itemType === 'inciso')
        const alineas = relationalItems.filter(i => i.itemType === 'alinea')
        
        console.log('\n📊 TABELA RELACIONAL (normalized_data_items):')
        console.log('   Artigos:', artigos.length)
        console.log('   Parágrafos:', paragrafos.length)
        console.log('   Incisos:', incisos.length)
        console.log('   Alíneas:', alineas.length)
        console.log('   TOTAL de itens:', relationalItems.length)
      } else {
        console.log('\n⚠️  Nenhum item encontrado na tabela relacional')
      }
    } else {
      console.log('⚠️  Documento ainda não tem dados normalizados')
    }
    
    // 4. Verificar draft
    if (doc.normalizationDraftData) {
      const draftData = doc.normalizationDraftData as any
      if (draftData.artigos) {
        console.log('\n📝 RASCUNHO (Draft):')
        console.log('   Artigos no draft:', draftData.artigos.length)
      }
    }
    
    console.log('\n✅ Verificação concluída!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }
}

checkArticles()
