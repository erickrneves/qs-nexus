/**
 * Verificar dados normalizados da Lei 10833
 */

import { db } from '../lib/db'
import { normalizedData } from '../lib/db/schema'
import { eq } from 'drizzle-orm'

async function checkNormalized() {
  try {
    const docId = 'a5e72651-fdfb-41a4-a1f4-7bb48f55edac'
    
    console.log('🔍 Buscando dados normalizados...\n')
    
    const records = await db
      .select()
      .from(normalizedData)
      .where(eq(normalizedData.documentId, docId))
    
    if (records.length === 0) {
      console.error('❌ Nenhum dado normalizado encontrado')
      process.exit(1)
    }
    
    console.log(`✅ Encontrados ${records.length} registro(s)\n`)
    
    records.forEach((rec, idx) => {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      console.log(`REGISTRO ${idx + 1}:`)
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
      
      const data = rec.data as any
      
      console.log(`📋 ID: ${rec.id}`)
      console.log(`📋 Template: ${rec.templateId}`)
      console.log(`📋 Created: ${rec.createdAt}`)
      console.log(`📋 Created By: ${rec.createdBy}`)
      console.log('')
      
      console.log(`📊 DADOS EXTRAÍDOS:`)
      console.log(`   Total de campos: ${Object.keys(data).length}`)
      console.log('')
      
      // Listar campos
      for (const [key, value] of Object.entries(data)) {
        if (key === 'artigos') {
          const artigos = value as any[]
          console.log(`   ✅ artigos: ${artigos.length} artigos`)
        } else if (Array.isArray(value)) {
          console.log(`   ✅ ${key}: [array com ${value.length} itens]`)
        } else if (typeof value === 'object' && value !== null) {
          console.log(`   ✅ ${key}: [objeto]`)
        } else {
          console.log(`   ✅ ${key}: ${value}`)
        }
      }
      console.log('')
      
      // Se tem artigos, mostrar detalhes
      if (data.artigos && Array.isArray(data.artigos)) {
        console.log(`📜 ARTIGOS EXTRAÍDOS:`)
        console.log(`   Total: ${data.artigos.length}`)
        console.log('')
        
        // Estatísticas
        let totalParagrafos = 0
        let totalIncisos = 0
        let totalAlineas = 0
        
        data.artigos.forEach((art: any) => {
          totalParagrafos += art.paragrafos?.length || 0
          art.paragrafos?.forEach((p: any) => {
            totalIncisos += p.incisos?.length || 0
            p.incisos?.forEach((inc: any) => {
              totalAlineas += inc.alineas?.length || 0
            })
          })
        })
        
        console.log(`   📊 Estatísticas:`)
        console.log(`      - Artigos: ${data.artigos.length}`)
        console.log(`      - Parágrafos: ${totalParagrafos}`)
        console.log(`      - Incisos: ${totalIncisos}`)
        console.log(`      - Alíneas: ${totalAlineas}`)
        console.log('')
        
        // Mostrar primeiros 3 artigos
        console.log(`   📋 PRIMEIROS 3 ARTIGOS:`)
        data.artigos.slice(0, 3).forEach((art: any, idx: number) => {
          console.log(`\n      ${idx + 1}. Art. ${art.numero}`)
          console.log(`         Caput: ${art.caput?.substring(0, 80)}${art.caput?.length > 80 ? '...' : ''}`)
          console.log(`         Parágrafos: ${art.paragrafos?.length || 0}`)
          if (art.paragrafos && art.paragrafos.length > 0) {
            console.log(`         └─ § ${art.paragrafos[0].numero}: ${art.paragrafos[0].texto?.substring(0, 60)}...`)
          }
        })
        console.log('')
        
        // Último artigo
        const lastArt = data.artigos[data.artigos.length - 1]
        console.log(`   📋 ÚLTIMO ARTIGO:`)
        console.log(`\n      Art. ${lastArt.numero}`)
        console.log(`      Caput: ${lastArt.caput?.substring(0, 80)}${lastArt.caput?.length > 80 ? '...' : ''}`)
        console.log(`      Parágrafos: ${lastArt.paragrafos?.length || 0}`)
        console.log('')
      }
    })
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('')
    
    // Calcular tamanho total dos dados
    const totalSize = JSON.stringify(records[0].data).length
    console.log(`💾 Tamanho total dos dados: ${(totalSize / 1024).toFixed(2)} KB`)
    console.log('')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }
}

checkNormalized()

