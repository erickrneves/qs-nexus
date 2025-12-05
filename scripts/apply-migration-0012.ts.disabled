/**
 * Script para aplicar migration 0012
 * Cria tabelas para ECD (Balanço Patrimonial e DRE)
 */

import { sql } from 'drizzle-orm'
import { db } from '../lib/db'
import { readFileSync } from 'fs'
import { join } from 'path'

async function applyMigration() {
  try {
    console.log('🔄 Aplicando migration 0012 (ECD Tables)...\n')
    
    // Ler arquivo SQL
    const migrationPath = join(process.cwd(), 'drizzle', '0012_create_ecd_tables.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')
    
    console.log('📄 SQL a ser executado:')
    console.log(migrationSQL.substring(0, 500) + '...\n')
    console.log('---\n')
    
    // Executar SQL
    await db.execute(sql.raw(migrationSQL))
    
    console.log('✅ Migration aplicada com sucesso!')
    
    // Verificar tabelas criadas
    const tables = await db.execute(sql`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN ('ecd_balanco_patrimonial', 'ecd_dre')
      ORDER BY tablename
    `)
    
    console.log('\n📊 Tabelas criadas:')
    console.table(tables.rows)
    
    // Verificar índices
    const indexes = await db.execute(sql`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename IN ('ecd_balanco_patrimonial', 'ecd_dre')
      ORDER BY tablename, indexname
    `)
    
    console.log('\n📑 Índices criados:')
    console.table(indexes.rows)
    
    console.log('\n🎉 Tudo pronto para processar ECDs!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro ao aplicar migration:', error)
    process.exit(1)
  }
}

applyMigration()

