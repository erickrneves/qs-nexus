import postgres from 'postgres'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL não encontrada!')
    process.exit(1)
  }

  const sql = postgres(process.env.DATABASE_URL)
  
  try {
    console.log('🧹 Limpando documentos pendentes antigos...\n')

    // Marcar documentos pendentes sem arquivo no disco como failed
    const result = await sql`
      UPDATE documents 
      SET status = 'failed', 
          error_message = 'Arquivo não encontrado (upload anterior à correção do fluxo)',
          updated_at = NOW()
      WHERE status = 'pending' 
        AND created_at < '2025-12-04 13:50:00'
      RETURNING id, file_name, created_at
    `
    
    console.log(`📝 ${result.length} documento(s) marcado(s) como failed:\n`)
    
    for (const doc of result) {
      console.log(`   - ${doc.file_name}`)
      console.log(`     ID: ${doc.id}`)
      console.log(`     Upload: ${new Date(doc.created_at).toLocaleString('pt-BR')}`)
      console.log('')
    }
    
    console.log('✅ Limpeza concluída!')
    
  } catch (error) {
    console.error('❌ Erro:', error)
    throw error
  } finally {
    await sql.end()
  }
}

main().catch(console.error)

