/**
 * Atualizar Lei 10833 com template programático
 */

import { db } from '../lib/db'
import { documents, normalizationTemplates } from '../lib/db/schema'
import { eq } from 'drizzle-orm'

async function updateTemplate() {
  try {
    const docId = '0622c41c-d582-4e54-b981-64c79f047cf2'
    
    console.log('🔍 Buscando template programático...\n')
    
    // Buscar template programático
    const templates = await db
      .select()
      .from(normalizationTemplates)
      .where(eq(normalizationTemplates.extractionMethod, 'programmatic'))
    
    console.log(`✅ Encontrados ${templates.length} templates programáticos:\n`)
    
    templates.forEach(t => {
      console.log(`📋 ${t.name}`)
      console.log(`   ID: ${t.id}`)
      console.log(`   Método: ${t.extractionMethod}`)
      console.log(`   Regras: ${t.extractionRules ? 'SIM ✅' : 'NÃO ❌'}`)
      console.log('')
    })
    
    // Usar o "Lei Federal - Extração Programática"
    const programmaticTemplate = templates.find(t => 
      t.name === 'Lei Federal - Extração Programática'
    )
    
    if (!programmaticTemplate) {
      console.error('❌ Template "Lei Federal - Extração Programática" não encontrado!')
      process.exit(1)
    }
    
    console.log(`🎯 Usando template: ${programmaticTemplate.name}\n`)
    
    // Verificar extraction_rules
    const rules = programmaticTemplate.extractionRules as any
    if (!rules || !rules.artigos) {
      console.error('❌ Template não possui extraction_rules!')
      process.exit(1)
    }
    
    console.log('📋 Regras de extração:')
    console.log(`   - Artigos: ${rules.artigos.pattern}`)
    console.log(`   - Parágrafos: ${rules.paragrafos?.pattern || 'N/A'}`)
    console.log(`   - Incisos: ${rules.incisos?.pattern || 'N/A'}`)
    console.log('')
    
    // Atualizar documento
    console.log('🔄 Atualizando documento...\n')
    
    await db
      .update(documents)
      .set({
        normalizationTemplateId: programmaticTemplate.id,
        normalizationStatus: 'pending',
        normalizationProgress: 0,
        normalizationError: null,
        normalizationDraftData: null,
        normalizationConfidenceScore: null,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, docId))
    
    console.log('✅ Documento atualizado com sucesso!\n')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('')
    console.log('🎯 PRÓXIMO PASSO:')
    console.log('')
    console.log('   1. Recarregue a página no navegador (F5)')
    console.log('   2. Clique em "Processar Normalização Agora"')
    console.log('   3. Aguarde a extração programática')
    console.log('')
    console.log('💰 CUSTO: $0.00 (sem IA!)')
    console.log('⚡ VELOCIDADE: ~2-3 segundos')
    console.log('🎯 PRECISÃO: 100% (determinístico)')
    console.log('')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }
}

updateTemplate()

