/**
 * Verificar armazenamento hierárquico na tabela relacional
 */

import { db } from '../lib/db'
import { normalizedDataItems } from '../lib/db/schema'
import { eq, sql } from 'drizzle-orm'

async function checkHierarchical() {
  try {
    const normalizedDataId = 'a3f67eef-0ab7-4add-b05c-459a71fd5648'
    
    console.log('🔍 Verificando armazenamento hierárquico...\n')
    
    // Contar itens por tipo
    const counts = await db
      .select({
        itemType: normalizedDataItems.itemType,
        count: sql<number>`count(*)`,
      })
      .from(normalizedDataItems)
      .where(eq(normalizedDataItems.normalizedDataId, normalizedDataId))
      .groupBy(normalizedDataItems.itemType)
    
    console.log('📊 ITENS ARMAZENADOS NA TABELA RELACIONAL:\n')
    
    let total = 0
    counts.forEach((c) => {
      console.log(`   ${c.itemType}: ${c.count}`)
      total += Number(c.count)
    })
    
    console.log(`\n   TOTAL: ${total} registros`)
    console.log('')
    
    // Verificar tempo de inserção estimado
    const avgInsertTime = 40 // ms por registro (estimativa)
    const estimatedTime = (total * avgInsertTime) / 1000
    
    console.log('⏱️  ESTIMATIVA DE TEMPO:')
    console.log(`   - ${total} inserções em tabela relacional`)
    console.log(`   - ~${avgInsertTime}ms por inserção`)
    console.log(`   - Tempo total estimado: ~${estimatedTime.toFixed(1)}s`)
    console.log('')
    
    // Mostrar primeiros 5 artigos
    const items = await db
      .select()
      .from(normalizedDataItems)
      .where(eq(normalizedDataItems.normalizedDataId, normalizedDataId))
      .limit(5)
    
    console.log('📋 PRIMEIROS 5 ITENS:\n')
    items.forEach((item, idx) => {
      console.log(`   ${idx + 1}. ${item.itemType} - ${item.itemKey}`)
      console.log(`      Parent: ${item.parentId || 'ROOT'}`)
      console.log(`      Level: ${item.hierarchyLevel}`)
      console.log('')
    })
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }
}

checkHierarchical()

