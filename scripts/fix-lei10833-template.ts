/**
 * Script para atribuir template programático à Lei 10833
 */

import { db } from '../lib/db'
import { documents, normalizationTemplates } from '../lib/db/schema'
import { eq, and } from 'drizzle-orm'

async function fixTemplate() {
  try {
    console.log('🔍 Buscando documento Lei 10833...\n')
    
    // Buscar documento pelo hash
    const [doc] = await db
      .select()
      .from(documents)
      .where(eq(documents.fileHash, '73Jxth'))
      .limit(1)
    
    if (!doc) {
      console.error('❌ Documento não encontrado com hash 73Jxth')
      process.exit(1)
    }
    
    console.log(`✅ Documento encontrado: ${doc.fileName}`)
    console.log(`   ID: ${doc.id}`)
    console.log(`   Template atual: ${doc.normalizationTemplateId || 'NENHUM'}`)
    console.log('')
    
    // Buscar template programático de Lei Federal
    console.log('🔍 Buscando template programático...\n')
    
    const [template] = await db
      .select()
      .from(normalizationTemplates)
      .where(
        and(
          eq(normalizationTemplates.name, 'Lei Federal - Extração Programática'),
          eq(normalizationTemplates.extractionMethod, 'programmatic')
        )
      )
      .limit(1)
    
    if (!template) {
      console.error('❌ Template programático não encontrado!')
      console.log('\nCriando template...')
      process.exit(1)
    }
    
    console.log(`✅ Template encontrado: ${template.name}`)
    console.log(`   ID: ${template.id}`)
    console.log(`   Método: ${template.extractionMethod}`)
    console.log(`   Regras: ${template.extractionRules ? 'SIM ✅' : 'NÃO ❌'}`)
    console.log('')
    
    // Verificar regras
    if (!template.extractionRules) {
      console.error('❌ Template não possui extraction_rules!')
      process.exit(1)
    }
    
    const rules = template.extractionRules as any
    console.log('📋 Regras de extração:')
    console.log(`   - Artigos: ${rules.artigos?.pattern || 'N/A'}`)
    console.log(`   - Parágrafos: ${rules.paragrafos?.pattern || 'N/A'}`)
    console.log(`   - Incisos: ${rules.incisos?.pattern || 'N/A'}`)
    console.log('')
    
    // Atualizar documento
    console.log('🔄 Atualizando documento...\n')
    
    await db
      .update(documents)
      .set({
        normalizationTemplateId: template.id,
        normalizationStatus: 'pending',
        normalizationProgress: 0,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, doc.id))
    
    console.log('✅ Documento atualizado com sucesso!')
    console.log('')
    console.log('🎯 PRÓXIMO PASSO:')
    console.log('   1. Recarregue a página /documentos/' + doc.id)
    console.log('   2. Clique em "Processar Normalização Agora"')
    console.log('   3. Aguarde extração (custo: $0.00)')
    console.log('')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }
}

fixTemplate()

