/**
 * Script para aplicar migration 0013
 * Remove constraint UNIQUE de file_hash em sped_files
 */

import { sql } from 'drizzle-orm'
import { db } from '../lib/db'
import { readFileSync } from 'fs'
import { join } from 'path'

async function applyMigration() {
  try {
    console.log('🔄 Aplicando migration 0013...\n')
    
    // Ler arquivo SQL
    const migrationPath = join(process.cwd(), 'drizzle', '0013_remove_unique_hash_constraint.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')
    
    console.log('📄 SQL a ser executado:')
    console.log(migrationSQL)
    console.log('\n---\n')
    
    // Executar SQL
    await db.execute(sql.raw(migrationSQL))
    
    console.log('✅ Migration aplicada com sucesso!')
    
    // Verificar constraints restantes
    const constraints = await db.execute(sql`
      SELECT conname, contype
      FROM pg_constraint
      WHERE conrelid = 'sped_files'::regclass
        AND conname LIKE '%hash%'
    `)
    
    console.log('\n📊 Constraints relacionadas a hash:')
    if (constraints.rows && constraints.rows.length > 0) {
      console.table(constraints.rows)
    } else {
      console.log('   ✅ Nenhuma constraint UNIQUE em file_hash (correto!)')
    }
    
    console.log('\n🎉 Agora é possível fazer re-upload de arquivos SPED!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro ao aplicar migration:', error)
    process.exit(1)
  }
}

applyMigration()

