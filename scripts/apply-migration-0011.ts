/**
 * Script para aplicar migration 0011
 * Adiciona campos para extração programática
 */

import { sql } from 'drizzle-orm'
import { db } from '../lib/db'
import { readFileSync } from 'fs'
import { join } from 'path'

async function applyMigration() {
  try {
    console.log('🔄 Aplicando migration 0011...\n')
    
    // Ler arquivo SQL
    const migrationPath = join(process.cwd(), 'drizzle', '0011_add_extraction_rules.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')
    
    console.log('📄 SQL a ser executado:')
    console.log(migrationSQL)
    console.log('\n---\n')
    
    // Executar SQL
    await db.execute(sql.raw(migrationSQL))
    
    console.log('✅ Migration aplicada com sucesso!')
    
    // Verificar colunas criadas
    const result = await db.execute(sql`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'normalization_templates'
        AND column_name IN ('extraction_method', 'extraction_rules', 'script_code')
      ORDER BY column_name
    `)
    
    console.log('\n📊 Novas colunas criadas:')
    console.table(result.rows)
    
    console.log('\n🎉 Tudo pronto!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro ao aplicar migration:', error)
    process.exit(1)
  }
}

applyMigration()

