/**
 * Script para limpar arquivos SPED duplicados
 * Mantém apenas o mais recente de cada hash
 */

import { db } from '../lib/db'
import { spedFiles } from '../lib/db/schema'
import { sql } from 'drizzle-orm'

async function cleanup() {
  try {
    console.log('🔍 Buscando arquivos SPED duplicados...\n')
    
    // Buscar todos os arquivos agrupados por hash
    const result = await db.execute(sql`
      SELECT 
        file_hash,
        COUNT(*) as total,
        ARRAY_AGG(id ORDER BY created_at DESC) as ids,
        ARRAY_AGG(file_name ORDER BY created_at DESC) as names
      FROM sped_files
      GROUP BY file_hash
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC
    `)
    
    const duplicates = (result.rows || result) as any[]
    
    if (!duplicates || duplicates.length === 0) {
      console.log('✅ Nenhum arquivo duplicado encontrado!')
      process.exit(0)
    }
    
    console.log(`📊 Encontrados ${duplicates.length} arquivos com duplicatas:\n`)
    
    let totalDeleted = 0
    
    for (const dup of duplicates) {
      console.log(`📄 Hash: ${dup.file_hash}`)
      console.log(`   Total: ${dup.total} cópias`)
      console.log(`   Arquivo: ${dup.names[0]}`)
      
      // IDs a deletar (todos exceto o primeiro = mais recente)
      const idsToDelete = dup.ids.slice(1)
      
      console.log(`   Mantendo: ${dup.ids[0]} (mais recente)`)
      console.log(`   Deletando: ${idsToDelete.length} cópia(s)`)
      
      // Deletar duplicatas
      for (const id of idsToDelete) {
        await db.execute(sql`DELETE FROM sped_files WHERE id = ${id}`)
        totalDeleted++
      }
      
      console.log('')
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('')
    console.log(`✅ Limpeza concluída!`)
    console.log(`   - Arquivos deletados: ${totalDeleted}`)
    console.log(`   - Arquivos mantidos: ${duplicates.length}`)
    console.log('')
    
    // Listar arquivos restantes
    const remaining = await db.execute(sql`
      SELECT file_name, file_hash, status, created_at
      FROM sped_files
      ORDER BY created_at DESC
      LIMIT 10
    `)
    
    console.log('📋 Arquivos restantes (últimos 10):')
    console.table(remaining.rows || remaining)
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }
}

cleanup()

