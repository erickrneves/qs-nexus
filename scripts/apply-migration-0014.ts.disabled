#!/usr/bin/env tsx

import postgres from 'postgres'
import * as fs from 'fs'
import * as path from 'path'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') })

async function applyMigration() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  const sql = postgres(connectionString, { ssl: { rejectUnauthorized: false } })

  console.log('🔄 Aplicando migration 0014_create_plano_referencial_table.sql...')

  try {
    const migrationPath = path.join(process.cwd(), 'drizzle', '0014_create_plano_referencial_table.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    // Executar SQL completo de uma vez
    await sql.unsafe(migrationSQL)

    console.log('✅ Migration aplicada com sucesso!')
    console.log('📊 Tabela ecd_plano_referencial criada')
  } catch (error) {
    console.error('❌ Erro ao aplicar migration:', error)
    throw error
  } finally {
    await sql.end()
  }
}

applyMigration()
  .then(() => {
    console.log('✅ Processo concluído!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erro:', error)
    process.exit(1)
  })

