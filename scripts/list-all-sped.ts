/**
 * Listar todos os arquivos SPED
 */

import { db } from '../lib/db'
import { spedFiles } from '../lib/db/schema'

async function listAll() {
  try {
    console.log('🔍 Listando todos os arquivos SPED...\n')
    
    const files = await db
      .select()
      .from(spedFiles)
      .orderBy(spedFiles.createdAt)
    
    console.log(`📊 Total: ${files.length} arquivo(s)\n`)
    
    if (files.length === 0) {
      console.log('❌ Nenhum arquivo SPED encontrado')
      process.exit(0)
    }
    
    files.forEach((file, idx) => {
      console.log(`${idx + 1}. ${file.fileName}`)
      console.log(`   ID: ${file.id}`)
      console.log(`   Hash: ${file.fileHash}`)
      console.log(`   CNPJ: ${file.cnpj}`)
      console.log(`   Status: ${file.status}`)
      console.log(`   Created: ${file.createdAt}`)
      console.log('')
    })
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }
}

listAll()

