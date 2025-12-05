import { db } from '../lib/db'
import { sql } from 'drizzle-orm'
import { readFileSync } from 'fs'
import { join } from 'path'

async function applyMigration() {
  try {
    console.log('🚀 Aplicando migração 0009 - Tipos de campo hierárquicos...')

    const migrationPath = join(process.cwd(), 'drizzle', '0009_add_nested_field_types.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    await db.execute(sql.raw(migrationSQL))

    console.log('✅ Migração 0009 aplicada com sucesso!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro ao aplicar migração:', error)
    process.exit(1)
  }
}

applyMigration()

