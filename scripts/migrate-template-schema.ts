/**
 * Script de migração de dados para o novo schema dinâmico de templates
 * 
 * Este script deve ser executado APÓS a migration do Drizzle que cria as novas tabelas
 * e adiciona a coluna schema_config_id na tabela templates.
 * 
 * O script:
 * 1. Cria o schema padrão inicial com os campos atuais
 * 2. Migra dados existentes das colunas fixas para JSONB metadata
 * 3. Associa templates existentes ao schema padrão
 */

import postgres from 'postgres'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment variables')
}

const sql = postgres(process.env.DATABASE_URL)

// Schema padrão inicial baseado nos campos atuais
const defaultSchemaFields = [
  {
    name: 'docType',
    type: 'enum',
    description: 'Tipo de documento',
    required: true,
    enumValues: [
      'peticao_inicial',
      'contestacao',
      'recurso',
      'parecer',
      'contrato',
      'modelo_generico',
      'outro',
    ],
  },
  {
    name: 'area',
    type: 'enum',
    description: 'Área do direito',
    required: true,
    enumValues: [
      'civil',
      'trabalhista',
      'tributario',
      'empresarial',
      'consumidor',
      'penal',
      'administrativo',
      'previdenciario',
      'outro',
    ],
  },
  {
    name: 'jurisdiction',
    type: 'string',
    description: 'Jurisdição',
    required: true,
    defaultValue: 'BR',
  },
  {
    name: 'complexity',
    type: 'enum',
    description: 'Complexidade do documento',
    required: true,
    enumValues: ['simples', 'medio', 'complexo'],
  },
  {
    name: 'tags',
    type: 'array',
    description: 'Tags do documento',
    required: false,
    itemType: 'string',
    defaultValue: [],
  },
  {
    name: 'summary',
    type: 'string',
    description: 'Resumo do documento',
    required: true,
  },
  {
    name: 'qualityScore',
    type: 'number',
    description: 'Score de qualidade (0-100)',
    required: false,
    min: 0,
    max: 100,
  },
  {
    name: 'isGold',
    type: 'boolean',
    description: 'Documento classificado como GOLD',
    required: false,
    defaultValue: false,
  },
  {
    name: 'isSilver',
    type: 'boolean',
    description: 'Documento classificado como SILVER',
    required: false,
    defaultValue: false,
  },
]

async function migrateTemplateSchema() {
  console.log('🚀 Iniciando migração de schema de templates...\n')

  try {
    // 1. Verificar se já existe schema padrão
    const existingSchema = await sql`
      SELECT id FROM template_schema_configs 
      WHERE name = 'Schema Padrão' AND is_active = true
      LIMIT 1
    `

    let defaultSchemaId: string

    if (existingSchema.length > 0) {
      console.log('✅ Schema padrão já existe, usando existente...')
      defaultSchemaId = existingSchema[0].id
    } else {
      // 2. Criar schema padrão inicial
      console.log('📝 Criando schema padrão inicial...')
      const result = await sql`
        INSERT INTO template_schema_configs (name, fields, is_active, created_at, updated_at)
        VALUES (
          'Schema Padrão',
          ${JSON.stringify(defaultSchemaFields)}::jsonb,
          true,
          NOW(),
          NOW()
        )
        RETURNING id
      `
      defaultSchemaId = result[0].id
      console.log(`✅ Schema padrão criado com ID: ${defaultSchemaId}\n`)
    }

    // 3. Verificar se há templates para migrar
    const templatesCount = await sql`
      SELECT COUNT(*) as count FROM templates
      WHERE metadata IS NULL OR metadata = '{}'::jsonb
    `
    const count = parseInt(templatesCount[0].count as string, 10)

    if (count === 0) {
      console.log('✅ Nenhum template precisa ser migrado.\n')
      return
    }

    console.log(`📊 Encontrados ${count} templates para migrar...\n`)

    // 4. Migrar dados existentes para JSONB metadata
    console.log('🔄 Migrando dados das colunas fixas para JSONB metadata...')
    
    const migrationResult = await sql`
      UPDATE templates
      SET 
        metadata = jsonb_build_object(
          'docType', doc_type::text,
          'area', area::text,
          'jurisdiction', COALESCE(jurisdiction, 'BR'),
          'complexity', complexity::text,
          'tags', COALESCE(tags, ARRAY[]::text[]),
          'summary', summary,
          'qualityScore', CASE WHEN quality_score IS NOT NULL THEN quality_score::numeric ELSE NULL END,
          'isGold', COALESCE(is_gold, false),
          'isSilver', COALESCE(is_silver, false)
        ),
        schema_config_id = ${defaultSchemaId},
        updated_at = NOW()
      WHERE metadata IS NULL OR metadata = '{}'::jsonb
        AND (doc_type IS NOT NULL OR area IS NOT NULL OR summary IS NOT NULL)
      RETURNING id
    `

    const migratedCount = migrationResult.length
    console.log(`✅ ${migratedCount} templates migrados com sucesso!\n`)

    // 5. Verificar templates que não foram migrados (sem dados nas colunas antigas)
    const notMigrated = await sql`
      SELECT COUNT(*) as count FROM templates
      WHERE (metadata IS NULL OR metadata = '{}'::jsonb)
        AND (doc_type IS NULL AND area IS NULL AND summary IS NULL)
    `
    const notMigratedCount = parseInt(notMigrated[0].count as string, 10)

    if (notMigratedCount > 0) {
      console.log(`⚠️  ${notMigratedCount} templates sem dados nas colunas antigas serão inicializados com metadata vazio...`)
      
      await sql`
        UPDATE templates
        SET 
          metadata = '{}'::jsonb,
          schema_config_id = ${defaultSchemaId},
          updated_at = NOW()
        WHERE (metadata IS NULL OR metadata = '{}'::jsonb)
          AND (doc_type IS NULL AND area IS NULL AND summary IS NULL)
      `
      console.log(`✅ Templates inicializados com metadata vazio.\n`)
    }

    // 6. Validação final
    console.log('🔍 Validando migração...')
    
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

    console.log(`\n📊 Estatísticas finais:`)
    console.log(`   Total de templates: ${total}`)
    console.log(`   Templates com metadata: ${withMetadata}`)
    console.log(`   Templates com schema_config_id: ${withSchemaId}`)

    if (withMetadata === total && withSchemaId === total) {
      console.log('\n✅ Migração concluída com sucesso!')
    } else {
      console.log('\n⚠️  Alguns templates podem não ter sido migrados corretamente.')
    }

  } catch (error) {
    console.error('❌ Erro durante a migração:', error)
    throw error
  } finally {
    await sql.end()
  }
}

// Executar migração
migrateTemplateSchema()
  .then(() => {
    console.log('\n✨ Processo finalizado!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Falha na migração:', error)
    process.exit(1)
  })

