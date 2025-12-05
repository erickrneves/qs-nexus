import { db } from '../lib/db'
import { sql } from 'drizzle-orm'
import { readFileSync } from 'fs'
import { join } from 'path'

async function applyMigration() {
  try {
    console.log('🚀 Aplicando migração 0010 - Tabela normalized_data_items...')

    const migrationPath = join(process.cwd(), 'drizzle', '0010_create_normalized_items_table.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    await db.execute(sql.raw(migrationSQL))

    console.log('✅ Migração 0010 aplicada com sucesso!')
    console.log('📊 Tabela normalized_data_items criada para armazenamento relacional')
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro ao aplicar migração:', error)
    process.exit(1)
  }
}

applyMigration()

