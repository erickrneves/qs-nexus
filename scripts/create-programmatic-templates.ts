/**
 * Criar templates pré-definidos para extração programática
 * SEM IA - CUSTO $0
 */

import { db } from '../lib/db'
import { normalizationTemplates, organizations } from '../lib/db/schema'
import { LEGAL_DOCUMENT_PRESETS } from '../lib/templates/legal-presets'
import { eq } from 'drizzle-orm'

async function createProgrammaticTemplates() {
  try {
    console.log('🔄 Criando templates programáticos...\n')
    
    // Buscar primeira organização
    const [org] = await db
      .select()
      .from(organizations)
      .limit(1)
    
    if (!org) {
      console.error('❌ Nenhuma organização encontrada!')
      process.exit(1)
    }
    
    console.log(`📍 Organização: ${org.name} (${org.id})`)
    console.log('')
    
    // Criar template para Lei Federal
    const leiFederal = LEGAL_DOCUMENT_PRESETS.lei_federal
    
    console.log('📝 Criando template: Lei Federal - Extração Programática')
    
    const [leiFederalTemplate] = await db
      .insert(normalizationTemplates)
      .values({
        organizationId: org.id,
        name: leiFederal.name,
        description: leiFederal.description,
        baseType: 'document',
        category: leiFederal.category,
        tableName: 'leis_federais_programaticas',
        fields: leiFederal.fields as any,
        extractionMethod: 'programmatic',
        extractionRules: leiFederal.extractionRules as any,
        isActive: true,
        isDefaultForBaseType: false,
        createdByMethod: 'system',
      })
      .returning()
    
    console.log(`✅ Template criado: ${leiFederalTemplate.id}`)
    console.log(`   - Método: ${leiFederalTemplate.extractionMethod}`)
    console.log(`   - Artigos: ${leiFederalTemplate.extractionRules?.artigos?.pattern}`)
    console.log(`   - Parágrafos: ${leiFederalTemplate.extractionRules?.paragrafos?.pattern}`)
    console.log(`   - Incisos: ${leiFederalTemplate.extractionRules?.incisos?.pattern}`)
    console.log('')
    
    // Criar template para Decreto
    const decreto = LEGAL_DOCUMENT_PRESETS.decreto
    
    console.log('📝 Criando template: Decreto - Extração Programática')
    
    const [decretoTemplate] = await db
      .insert(normalizationTemplates)
      .values({
        organizationId: org.id,
        name: decreto.name,
        description: decreto.description,
        baseType: 'document',
        category: decreto.category,
        tableName: 'decretos_programaticos',
        fields: decreto.fields as any,
        extractionMethod: 'programmatic',
        extractionRules: decreto.extractionRules as any,
        isActive: true,
        isDefaultForBaseType: false,
        createdByMethod: 'system',
      })
      .returning()
    
    console.log(`✅ Template criado: ${decretoTemplate.id}`)
    console.log(`   - Método: ${decretoTemplate.extractionMethod}`)
    console.log('')
    
    // Listar todos os templates programáticos
    const allProgrammaticTemplates = await db
      .select()
      .from(normalizationTemplates)
      .where(eq(normalizationTemplates.extractionMethod, 'programmatic'))
    
    console.log('📊 Templates programáticos no sistema:')
    console.table(
      allProgrammaticTemplates.map(t => ({
        Nome: t.name,
        Método: t.extractionMethod,
        Tabela: t.tableName,
        Categoria: t.category,
      }))
    )
    
    console.log('\n🎉 Templates programáticos criados com sucesso!')
    console.log('💰 Custo de extração: $0.00 (sem IA!)')
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }
}

createProgrammaticTemplates()

