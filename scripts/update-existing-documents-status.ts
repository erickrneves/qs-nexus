#!/usr/bin/env tsx

/**
 * Script de Atualização: Status de Documentos Existentes
 * 
 * Atualiza documentos existentes com novos campos de status duplo:
 * - normalizationStatus
 * - classificationStatus
 */

import { db } from '../lib/db'
import { documents } from '../lib/db/schema/documents'
import { documentFiles } from '../lib/db/schema/rag'
import { eq } from 'drizzle-orm'

async function main() {
  console.log('🔄 Atualizando status de documentos existentes...\n')

  try {
    // Buscar todos os documentos
    const allDocuments = await db
      .select()
      .from(documents)
      .where(eq(documents.isActive, true))

    console.log(`📊 Encontrados ${allDocuments.length} documentos para atualizar\n`)

    let updatedCount = 0
    let skippedCount = 0

    for (const doc of allDocuments) {
      console.log(`\n📄 Processando: ${doc.fileName}`)
      console.log(`   ID: ${doc.id}`)
      console.log(`   Status atual: ${doc.status}`)

      try {
        // Determinar status de normalização baseado no status atual
        let normalizationStatus: 'pending' | 'completed' | 'failed' = 'pending'
        let classificationStatus: 'pending' | 'completed' | 'failed' = 'pending'

        // Se documento tem dados salvos, considerar normalização completa
        if (doc.status === 'completed' || doc.status === 'processing') {
          normalizationStatus = 'completed'
        } else if (doc.status === 'failed') {
          normalizationStatus = 'failed'
        }

        // Verificar se tem chunks (classificação completa)
        const hasChunks = await db
          .select()
          .from(documentFiles)
          .where(eq(documentFiles.fileName, doc.fileName))
          .limit(1)

        if (hasChunks.length > 0) {
          classificationStatus = 'completed'
        } else if (doc.status === 'failed') {
          classificationStatus = 'failed'
        }

        // Atualizar documento
        await db
          .update(documents)
          .set({
            normalizationStatus,
            normalizationCompletedAt: normalizationStatus === 'completed' ? (doc.processedAt || doc.createdAt) : null,
            classificationStatus,
            classificationCompletedAt: classificationStatus === 'completed' ? doc.processedAt : null,
            updatedAt: new Date(),
          })
          .where(eq(documents.id, doc.id))

        console.log(`   ✅ Atualizado`)
        console.log(`      Normalização: ${normalizationStatus}`)
        console.log(`      Classificação: ${classificationStatus}`)

        updatedCount++
      } catch (error) {
        console.error(`   ❌ Erro ao atualizar documento ${doc.fileName}:`, error)
        skippedCount++
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log(`✅ Atualização concluída!`)
    console.log(`   Atualizados: ${updatedCount}`)
    console.log(`   Ignorados: ${skippedCount}`)
    console.log('='.repeat(60))
  } catch (error) {
    console.error('❌ Erro fatal na atualização:', error)
    process.exit(1)
  }

  process.exit(0)
}

main()

