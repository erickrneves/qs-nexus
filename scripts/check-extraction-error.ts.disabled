import { db } from '../lib/db'
import { documents } from '../lib/db/schema/documents'
import { eq } from 'drizzle-orm'

async function checkError() {
  const docId = 'aadcf0cf-923f-4d36-94e2-3a0245dbeb25'
  
  const [doc] = await db.select().from(documents).where(eq(documents.id, docId)).limit(1)
  
  if (doc) {
    console.log('📄 Status:', doc.normalizationStatus)
    console.log('❌ Erro:', doc.normalizationError)
    console.log('📊 Progresso:', doc.normalizationProgress + '%')
  }
  
  process.exit(0)
}

checkError()
