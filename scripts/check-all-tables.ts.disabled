import postgres from 'postgres'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function main() {
  const sql = postgres(process.env.DATABASE_URL!)
  
  const tables = await sql`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename
  `
  
  console.log('Todas as tabelas no banco:')
  tables.forEach(t => console.log('  -', t.tablename))
  
  await sql.end()
}

main().catch(console.error)

