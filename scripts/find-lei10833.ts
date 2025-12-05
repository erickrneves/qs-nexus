/**
 * Script para encontrar Lei 10833
 */

import { db } from '../lib/db'
import { documents } from '../lib/db/schema'
import { like } from 'drizzle-orm'

async function findDoc() {
  try {
    console.log('🔍 Buscando documentos com "10833"...\n')
    
    const docs = await db
      .select()
      .from(documents)
      .where(like(documents.fileName, '%10833%'))
    
    if (docs.length === 0) {
      console.log('❌ Nenhum documento encontrado com "10833" no nome')
      
      // Buscar por ID da URL
      console.log('\n🔍 Tentando buscar por ID da URL: 0622c4fc-d582-4e54-b981...\n')
      
      const docsByUrl = await db
        .select()
        .from(documents)
        .where(like(documents.id, '0622c4fc%'))
      
      if (docsByUrl.length > 0) {
        console.log(`✅ Encontrado ${docsByUrl.length} documento(s):\n`)
        docsByUrl.forEach(d => {
          console.log(`📄 ${d.fileName}`)
          console.log(`   ID: ${d.id}`)
          console.log(`   Hash: ${d.fileHash}`)
          console.log(`   Template ID: ${d.normalizationTemplateId || 'NENHUM'}`)
          console.log(`   Status: ${d.normalizationStatus || 'pending'}`)
          console.log('')
        })
      } else {
        console.log('❌ Nenhum documento encontrado')
      }
      
      process.exit(0)
    }
    
    console.log(`✅ Encontrado ${docs.length} documento(s):\n`)
    
    docs.forEach(d => {
      console.log(`📄 ${d.fileName}`)
      console.log(`   ID: ${d.id}`)
      console.log(`   Hash: ${d.fileHash}`)
      console.log(`   Template ID: ${d.normalizationTemplateId || 'NENHUM'}`)
      console.log(`   Status: ${d.normalizationStatus || 'pending'}`)
      console.log('')
    })
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }
}

findDoc()

