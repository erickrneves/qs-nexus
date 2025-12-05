#!/usr/bin/env tsx

/**
 * Script para aplicar migration SQL diretamente
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import postgres from 'postgres'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load env
config({ path: resolve(process.cwd(), '.env.local') })

async function main() {
  console.log('🔄 Aplicando migration no banco de dados...\n')

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL não encontrada')
    process.exit(1)
  }

  const sql = postgres(process.env.DATABASE_URL, {
    ssl: { rejectUnauthorized: false },
  })

  try {
    // Ler arquivo SQL
    const migrationPath = join(process.cwd(), 'drizzle', '0007_add_ai_fields_to_templates.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    console.log('📄 Executando SQL...\n')

    // Executar migration
    await sql.unsafe(migrationSQL)

    console.log('✅ Migration aplicada com sucesso!')
  } catch (error) {
    console.error('❌ Erro ao aplicar migration:', error)
    process.exit(1)
  } finally {
    await sql.end()
  }

  process.exit(0)
}

main()
