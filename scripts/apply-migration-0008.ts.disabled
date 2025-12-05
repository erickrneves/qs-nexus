import { db } from '../lib/db'
import { sql } from 'drizzle-orm'
import { readFileSync } from 'fs'
import { join } from 'path'

async function applyMigration() {
  try {
    console.log('🚀 Aplicando migração 0008 - Campos de draft...')

    const migrationPath = join(process.cwd(), 'drizzle', '0008_add_draft_fields.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    // Executar a migração
    await db.execute(sql.raw(migrationSQL))

    console.log('✅ Migração 0008 aplicada com sucesso!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro ao aplicar migração:', error)
    process.exit(1)
  }
}

applyMigration()

