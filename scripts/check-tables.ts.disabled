import postgres from 'postgres'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function main() {
  const sql = postgres(process.env.DATABASE_URL!)
  
  const tables = await sql`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND (tablename LIKE 'sped%' OR tablename = 'document_files')
    ORDER BY tablename
  `
  
  console.log('Tabelas encontradas:')
  tables.forEach(t => console.log('  -', t.tablename))
  
  // Verificar colunas de document_files
  const columns = await sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'document_files'
    ORDER BY ordinal_position
  `
  
  console.log('\nColunas de document_files:')
  columns.forEach(c => console.log('  -', c.column_name))
  
  await sql.end()
}

main().catch(console.error)

