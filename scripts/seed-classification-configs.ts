// Load .env.local FIRST before importing db
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import postgres from 'postgres'
import { DOCX_CLASSIFICATION_PROMPT, DOCX_SCHEMA_FIELDS } from '../lib/prompts/docx-classification-prompt'
import { SPED_CLASSIFICATION_PROMPT, SPED_SCHEMA_FIELDS } from '../lib/prompts/sped-classification-prompt'

async function seedClassificationConfigs() {
  const sql = postgres(process.env.DATABASE_URL!)
  
  console.log('🌱 Criando configurações de classificação padrão...\n')

  try {
    // 1. Verificar se já existem configs ativas por tipo
    const existingJuridico = await sql`
      SELECT id, name FROM classification_configs 
      WHERE is_active = true AND document_type = 'juridico'
      LIMIT 1
    `
    
    const existingContabil = await sql`
      SELECT id, name FROM classification_configs 
      WHERE is_active = true AND document_type = 'contabil'
      LIMIT 1
    `
    
    if (existingJuridico.length > 0 && existingContabil.length > 0) {
      console.log(`✓ Já existem configurações ativas para ambos os tipos`)
      console.log(`   - Jurídico: ${existingJuridico[0].name}`)
      console.log(`   - Contábil: ${existingContabil[0].name}`)
      await sql.end()
      return
    }

    // 2. Criar Classification Config para Documentos Jurídicos
    let classConfigJuridico
    if (existingJuridico.length === 0) {
      console.log('Criando Classification Config - Documentos Jurídicos...')
      const [config] = await sql`
        INSERT INTO classification_configs (
          name,
          document_type,
          system_prompt,
          model_provider,
          model_name,
          max_input_tokens,
          max_output_tokens,
          is_active
        ) VALUES (
          'Classificação - Documentos Jurídicos',
          'juridico',
          ${DOCX_CLASSIFICATION_PROMPT},
          'openai',
          'gpt-4o-mini',
          120000,
          4000,
          true
        )
        RETURNING id, name
      `
      classConfigJuridico = config
      console.log(`✓ Classification Config criada: ${config.name}`)
    } else {
      classConfigJuridico = existingJuridico[0]
      console.log(`✓ Using existing: ${classConfigJuridico.name}`)
    }

    // 3. Criar Classification Config para SPED (Contábil)
    let classConfigContabil
    if (existingContabil.length === 0) {
      console.log('Criando Classification Config - SPED (Contábil)...')
      const [config] = await sql`
        INSERT INTO classification_configs (
          name,
          document_type,
          system_prompt,
          model_provider,
          model_name,
          max_input_tokens,
          max_output_tokens,
          is_active
        ) VALUES (
          'Classificação - SPED (Contábil)',
          'contabil',
          ${SPED_CLASSIFICATION_PROMPT},
          'openai',
          'gpt-4o-mini',
          120000,
          4000,
          true
        )
        RETURNING id, name
      `
      classConfigContabil = config
      console.log(`✓ Classification Config criada: ${config.name}`)
    } else {
      classConfigContabil = existingContabil[0]
      console.log(`✓ Using existing: ${classConfigContabil.name}`)
    }

    // 4. Criar Template Schema Config para Documentos Jurídicos
    const existingSchemaJuridico = await sql`
      SELECT id, name FROM template_schema_configs 
      WHERE is_active = true AND document_type = 'juridico'
      LIMIT 1
    `
    
    let schemaConfigJuridico
    if (existingSchemaJuridico.length === 0) {
      console.log('Criando Template Schema Config - Documentos Jurídicos...')
      const [config] = await sql`
        INSERT INTO template_schema_configs (
          name,
          document_type,
          fields,
          is_active
        ) VALUES (
          'Schema - Documentos Jurídicos',
          'juridico',
          ${JSON.stringify(DOCX_SCHEMA_FIELDS)}::jsonb,
          true
        )
        RETURNING id, name
      `
      schemaConfigJuridico = config
      console.log(`✓ Template Schema Config criada: ${config.name}`)
    } else {
      schemaConfigJuridico = existingSchemaJuridico[0]
      console.log(`✓ Using existing: ${schemaConfigJuridico.name}`)
    }

    // 5. Criar Template Schema Config para SPED
    const existingSchemaContabil = await sql`
      SELECT id, name FROM template_schema_configs 
      WHERE is_active = true AND document_type = 'contabil'
      LIMIT 1
    `
    
    let schemaConfigContabil
    if (existingSchemaContabil.length === 0) {
      console.log('Criando Template Schema Config - SPED (Contábil)...')
      const [config] = await sql`
        INSERT INTO template_schema_configs (
          name,
          document_type,
          fields,
          is_active
        ) VALUES (
          'Schema - SPED ECD',
          'contabil',
          ${JSON.stringify(SPED_SCHEMA_FIELDS)}::jsonb,
          true
        )
        RETURNING id, name
      `
      schemaConfigContabil = config
      console.log(`✓ Template Schema Config criada: ${config.name}`)
    } else {
      schemaConfigContabil = existingSchemaContabil[0]
      console.log(`✓ Using existing: ${schemaConfigContabil.name}`)
    }

    console.log('\n✅ Seed de configurações concluído com sucesso!')
    console.log('\n📋 Configurações criadas/verificadas:')
    console.log(`\n  Jurídico:`)
    console.log(`   - Classification: ${classConfigJuridico.name}`)
    console.log(`   - Schema: ${schemaConfigJuridico.name}`)
    console.log(`\n  Contábil (SPED):`)
    console.log(`   - Classification: ${classConfigContabil.name}`)
    console.log(`   - Schema: ${schemaConfigContabil.name}`)
    
  } catch (error) {
    console.error('❌ Erro ao criar configurações:', error)
    throw error
  } finally {
    await sql.end()
  }
}

seedClassificationConfigs().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})

