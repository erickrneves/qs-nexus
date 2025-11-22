/**
 * Script para remover colunas antigas da tabela templates após migração de dados
 * 
 * Este script deve ser executado APÓS:
 * 1. Executar a migration do Drizzle (0002_chubby_big_bertha.sql)
 * 2. Executar o script de migração de dados (migrate-template-schema.ts)
 * 
 * O script:
 * 1. Valida que todos os templates têm metadata e schema_config_id
 * 2. Remove as colunas antigas (doc_type, area, jurisdiction, complexity, tags, summary, quality_score, is_gold, is_silver)
 * 3. Remove os enums que não são mais usados (doc_type, area, complexity)
 */

import postgres from 'postgres'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment variables')
}

const sql = postgres(process.env.DATABASE_URL)

async function removeOldColumns() {
  console.log('🗑️  Iniciando remoção de colunas antigas...\n')

  try {
    // 1. Validação: verificar se todos os templates têm metadata e schema_config_id
    console.log('🔍 Validando dados antes de remover colunas...')
    
    const validation = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(metadata) as with_metadata,
        COUNT(schema_config_id) as with_schema_id
      FROM templates
    `
    
    const total = parseInt(validation[0].total as string, 10)
    const withMetadata = parseInt(validation[0].with_metadata as string, 10)
    const withSchemaId = parseInt(validation[0].with_schema_id as string, 10)

    console.log(`   Total de templates: ${total}`)
    console.log(`   Templates com metadata: ${withMetadata}`)
    console.log(`   Templates com schema_config_id: ${withSchemaId}\n`)

    if (withMetadata !== total || withSchemaId !== total) {
      throw new Error(
        `Validação falhou: nem todos os templates têm metadata ou schema_config_id. ` +
        `Execute o script de migração de dados primeiro.`
      )
    }

    console.log('✅ Validação passou!\n')

    // 2. Remover índices das colunas antigas (se existirem)
    console.log('📝 Removendo índices das colunas antigas...')
    
    try {
      await sql`DROP INDEX IF EXISTS idx_templates_doc_type`
      await sql`DROP INDEX IF EXISTS idx_templates_area`
      console.log('✅ Índices removidos\n')
    } catch (error) {
      console.log('⚠️  Alguns índices podem não existir (continuando...)\n')
    }

    // 3. Remover colunas antigas
    console.log('🗑️  Removendo colunas antigas...')
    
    await sql`ALTER TABLE templates DROP COLUMN IF EXISTS doc_type`
    await sql`ALTER TABLE templates DROP COLUMN IF EXISTS area`
    await sql`ALTER TABLE templates DROP COLUMN IF EXISTS jurisdiction`
    await sql`ALTER TABLE templates DROP COLUMN IF EXISTS complexity`
    await sql`ALTER TABLE templates DROP COLUMN IF EXISTS tags`
    await sql`ALTER TABLE templates DROP COLUMN IF EXISTS summary`
    await sql`ALTER TABLE templates DROP COLUMN IF EXISTS quality_score`
    await sql`ALTER TABLE templates DROP COLUMN IF EXISTS is_gold`
    await sql`ALTER TABLE templates DROP COLUMN IF EXISTS is_silver`
    
    console.log('✅ Colunas antigas removidas\n')

    // 4. Remover enums que não são mais usados
    console.log('🗑️  Removendo enums não utilizados...')
    
    // Verificar se os enums ainda são usados em outras tabelas antes de remover
    const docTypeUsage = await sql`
      SELECT COUNT(*) as count FROM information_schema.columns 
      WHERE data_type = 'USER-DEFINED' 
        AND udt_name = 'doc_type'
    `
    const areaUsage = await sql`
      SELECT COUNT(*) as count FROM information_schema.columns 
      WHERE data_type = 'USER-DEFINED' 
        AND udt_name = 'area'
    `
    const complexityUsage = await sql`
      SELECT COUNT(*) as count FROM information_schema.columns 
      WHERE data_type = 'USER-DEFINED' 
        AND udt_name = 'complexity'
    `

    if (parseInt(docTypeUsage[0].count as string, 10) === 0) {
      await sql`DROP TYPE IF EXISTS doc_type`
      console.log('✅ Enum doc_type removido')
    } else {
      console.log('⚠️  Enum doc_type ainda está em uso (não removido)')
    }

    if (parseInt(areaUsage[0].count as string, 10) === 0) {
      await sql`DROP TYPE IF EXISTS area`
      console.log('✅ Enum area removido')
    } else {
      console.log('⚠️  Enum area ainda está em uso (não removido)')
    }

    if (parseInt(complexityUsage[0].count as string, 10) === 0) {
      await sql`DROP TYPE IF EXISTS complexity`
      console.log('✅ Enum complexity removido')
    } else {
      console.log('⚠️  Enum complexity ainda está em uso (não removido)')
    }

    console.log('\n✅ Remoção de colunas antigas concluída com sucesso!')

  } catch (error) {
    console.error('❌ Erro durante a remoção:', error)
    throw error
  } finally {
    await sql.end()
  }
}

// Executar remoção
removeOldColumns()
  .then(() => {
    console.log('\n✨ Processo finalizado!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Falha na remoção:', error)
    process.exit(1)
  })

