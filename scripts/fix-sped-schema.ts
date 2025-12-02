import postgres from 'postgres'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function main() {
  const sql = postgres(process.env.DATABASE_URL!)
  
  console.log('Adicionando colunas multi-tenant às tabelas SPED...\n')
  
  // Adicionar organization_id e uploaded_by a sped_files
  await sql.unsafe(`
    ALTER TABLE "sped_files" 
    ADD COLUMN IF NOT EXISTS "organization_id" uuid,
    ADD COLUMN IF NOT EXISTS "uploaded_by" uuid,
    ADD COLUMN IF NOT EXISTS "processed_at" timestamp;
  `)
  console.log('✓ Colunas adicionadas a sped_files')
  
  // Adicionar organization_id a chart_of_accounts
  await sql.unsafe(`
    ALTER TABLE "chart_of_accounts" 
    ADD COLUMN IF NOT EXISTS "organization_id" uuid,
    ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now();
  `)
  console.log('✓ Colunas adicionadas a chart_of_accounts')
  
  // Adicionar organization_id a account_balances
  await sql.unsafe(`
    ALTER TABLE "account_balances" 
    ADD COLUMN IF NOT EXISTS "organization_id" uuid;
  `)
  console.log('✓ Colunas adicionadas a account_balances')
  
  // Adicionar organization_id a journal_entries
  await sql.unsafe(`
    ALTER TABLE "journal_entries" 
    ADD COLUMN IF NOT EXISTS "organization_id" uuid;
  `)
  console.log('✓ Colunas adicionadas a journal_entries')
  
  // Adicionar organization_id a journal_items
  await sql.unsafe(`
    ALTER TABLE "journal_items" 
    ADD COLUMN IF NOT EXISTS "organization_id" uuid;
  `)
  console.log('✓ Colunas adicionadas a journal_items')
  
  // Criar índices
  await sql.unsafe(`
    CREATE INDEX IF NOT EXISTS "sped_files_org_idx" ON "sped_files"("organization_id");
    CREATE INDEX IF NOT EXISTS "sped_files_uploaded_by_idx" ON "sped_files"("uploaded_by");
    CREATE INDEX IF NOT EXISTS "coa_org_idx" ON "chart_of_accounts"("organization_id");
    CREATE INDEX IF NOT EXISTS "ab_org_idx" ON "account_balances"("organization_id");
    CREATE INDEX IF NOT EXISTS "je_org_idx" ON "journal_entries"("organization_id");
    CREATE INDEX IF NOT EXISTS "ji_org_idx" ON "journal_items"("organization_id");
  `)
  console.log('✓ Índices criados')
  
  // Verificar colunas de sped_files
  const columns = await sql`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'sped_files'
    ORDER BY ordinal_position
  `
  
  console.log('\n✅ Colunas de sped_files:')
  columns.forEach(c => console.log('   -', c.column_name))
  
  await sql.end()
  console.log('\n✅ Schema SPED corrigido com sucesso!')
}

main().catch(err => {
  console.error('❌ Erro:', err)
  process.exit(1)
})

