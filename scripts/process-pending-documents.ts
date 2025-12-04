import postgres from 'postgres'
import dotenv from 'dotenv'
import { processFile } from '../lib/services/rag-processor'
import { join } from 'path'
import { existsSync } from 'fs'

dotenv.config({ path: '.env.local' })

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL não encontrada!')
    process.exit(1)
  }

  const sql = postgres(process.env.DATABASE_URL)
  const PROJECT_ROOT = process.cwd()
  
  try {
    console.log('🔍 Buscando documentos pendentes...\n')

    // Buscar documentos com status "pending" na tabela documents
    const pendingDocs = await sql`
      SELECT id, file_name, file_path, organization_id, uploaded_by, created_at
      FROM documents 
      WHERE status = 'pending'
      ORDER BY created_at ASC
    `
    
    console.log(`📁 Encontrados ${pendingDocs.length} documentos pendentes\n`)
    
    if (pendingDocs.length === 0) {
      console.log('✅ Nenhum documento pendente para processar!')
      await sql.end()
      return
    }

    // Processar cada documento
    for (const doc of pendingDocs) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      console.log(`📄 Processando: ${doc.file_name}`)
      console.log(`   ID: ${doc.id}`)
      console.log(`   Caminho: ${doc.file_path}`)
      console.log(`   Upload: ${new Date(doc.created_at).toLocaleString('pt-BR')}`)
      
      // Construir caminho completo do arquivo
      const fullPath = join(PROJECT_ROOT, 'public', doc.file_path)
      
      // Verificar se arquivo existe
      if (!existsSync(fullPath)) {
        console.log(`❌ Arquivo não encontrado: ${fullPath}`)
        
        // Marcar como failed
        await sql`
          UPDATE documents 
          SET status = 'failed', 
              error_message = 'Arquivo não encontrado no disco',
              updated_at = NOW()
          WHERE id = ${doc.id}
        `
        continue
      }
      
      console.log(`✅ Arquivo encontrado no disco`)
      
      // Atualizar status para "processing"
      await sql`
        UPDATE documents 
        SET status = 'processing', 
            updated_at = NOW()
        WHERE id = ${doc.id}
      `
      
      // Processar arquivo usando o RAG processor
      console.log(`⚙️  Iniciando processamento RAG...`)
      
      try {
        const result = await processFile(
          fullPath,
          (progress) => {
            console.log(
              `   [${progress.progress}%] ${progress.message}`
            )
          },
          {
            documentId: doc.id,
            organizationId: doc.organization_id,
            uploadedBy: doc.uploaded_by,
          }
        )
        
        if (result.success) {
          // Atualizar status para "completed"
          await sql`
            UPDATE documents 
            SET status = 'completed', 
                processed_at = NOW(),
                updated_at = NOW()
            WHERE id = ${doc.id}
          `
          console.log(`✅ Processamento concluído com sucesso!`)
          console.log(`   Template ID: ${result.templateId}`)
        } else {
          // Atualizar status para "failed"
          await sql`
            UPDATE documents 
            SET status = 'failed', 
                error_message = ${result.error || 'Erro desconhecido'},
                updated_at = NOW()
            WHERE id = ${doc.id}
          `
          console.log(`❌ Processamento falhou: ${result.error}`)
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido'
        console.log(`❌ Erro ao processar: ${errorMsg}`)
        
        // Marcar como failed
        await sql`
          UPDATE documents 
          SET status = 'failed', 
              error_message = ${errorMsg},
              updated_at = NOW()
          WHERE id = ${doc.id}
        `
      }
    }
    
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log('\n✅ Processamento de documentos pendentes concluído!')
    
  } catch (error) {
    console.error('❌ Erro:', error)
    throw error
  } finally {
    await sql.end()
  }
}

main().catch(console.error)

