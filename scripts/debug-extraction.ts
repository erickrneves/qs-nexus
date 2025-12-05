import { db } from '../lib/db'
import { documents } from '../lib/db/schema/documents'
import { normalizationTemplates } from '../lib/db/schema/normalization-templates'
import { eq } from 'drizzle-orm'

async function debug() {
  const docId = 'd8557445-232a-4e24-82c1-aa5bd0510056'
  
  const [doc] = await db.select().from(documents).where(eq(documents.id, docId)).limit(1)
  
  if (doc?.normalizationTemplateId) {
    const [template] = await db
      .select()
      .from(normalizationTemplates)
      .where(eq(normalizationTemplates.id, doc.normalizationTemplateId))
      .limit(1)
    
    console.log('📋 Template usado:')
    console.log('   Nome:', template?.name)
    console.log('   Criado por:', template?.createdByMethod)
    console.log('   Prompt IA:', template?.aiPrompt?.substring(0, 100) + '...')
    console.log('')
    console.log('   Campos do template:')
    const fields = template?.fields as any[]
    fields?.forEach((f: any) => {
      console.log(`   - ${f.fieldName} (${f.fieldType})`)
      if (f.fieldType === 'object_array' && f.nestedSchema) {
        console.log('     Nested schema:')
        f.nestedSchema.forEach((nf: any) => {
          console.log(`       - ${nf.fieldName} (${nf.fieldType})`)
        })
      }
    })
  }
  
  process.exit(0)
}

debug()
