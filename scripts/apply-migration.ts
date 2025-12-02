import postgres from 'postgres'
import * as dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { join } from 'path'

dotenv.config({ path: '.env.local' })

async function main() {
  const sql = postgres(process.env.DATABASE_URL!)
  
  console.log('Lendo arquivo de migration...')
  const migrationSQL = readFileSync(
    join(process.cwd(), 'lib/db/migrations/0006_add_organization_and_sped.sql'),
    'utf-8'
  )
  
  console.log('Executando migration...')
  await sql.unsafe(migrationSQL)
  
  console.log('✓ Migration aplicada com sucesso!')
  
  // Verificar tabelas criadas
  const tables = await sql`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename LIKE 'sped%'
    ORDER BY tablename
  `
  
  console.log('\nTabelas SPED criadas:')
  tables.forEach(t => console.log('  ✓', t.tablename))
  
  // Verificar coluna organization_id
  const hasOrgId = await sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'document_files' 
    AND column_name = 'organization_id'
  `
  
  if (hasOrgId.length > 0) {
    console.log('\n✓ Coluna organization_id adicionada a document_files')
  }
  
  await sql.end()
}

main().catch(err => {
  console.error('Erro ao aplicar migration:', err)
  process.exit(1)
})

