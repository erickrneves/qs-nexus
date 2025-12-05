#!/usr/bin/env tsx

import { db } from '@/lib/db'
import { ecdPlanoReferencial } from '@/lib/db/schema/ecd-plano-referencial'
import { eq } from 'drizzle-orm'

async function testPlanoRef() {
  try {
    console.log('🧪 Testando acesso ao Plano Referencial...')
    
    const bp = await db.select().from(ecdPlanoReferencial).where(eq(ecdPlanoReferencial.tipo, 'BP')).limit(1)
    console.log('✅ Plano Referencial BP acessível:', bp.length > 0)
    if (bp.length > 0) {
      console.log('   Exemplo:', bp[0])
    }
    
    const dre = await db.select().from(ecdPlanoReferencial).where(eq(ecdPlanoReferencial.tipo, 'DRE')).limit(1)
    console.log('✅ Plano Referencial DRE acessível:', dre.length > 0)
    if (dre.length > 0) {
      console.log('   Exemplo:', dre[0])
    }
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }
}

testPlanoRef()

