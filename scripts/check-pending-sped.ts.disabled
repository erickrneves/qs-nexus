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
    console.log('🔍 Verificando arquivos SPED com status pending...\n')

    const pendingFiles = await sql`
      SELECT id, file_name, file_path, cnpj, company_name, 
             status, error_message, created_at
      FROM sped_files 
      WHERE status = 'pending'
      ORDER BY created_at DESC
    `
    
    console.log(`📁 Arquivos SPED com status PENDING: ${pendingFiles.length}\n`)
    
    if (pendingFiles.length > 0) {
      for (const file of pendingFiles) {
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
        console.log(`Arquivo: ${file.file_name}`)
        console.log(`ID: ${file.id}`)
        console.log(`Caminho: ${file.file_path}`)
        console.log(`CNPJ: ${file.cnpj}`)
        console.log(`Empresa: ${file.company_name}`)
        console.log(`Status: ${file.status}`)
        console.log(`Erro: ${file.error_message || 'N/A'}`)
        console.log(`Upload: ${new Date(file.created_at).toLocaleString('pt-BR')}`)
        
        // Verificar se o arquivo existe no disco
        const fs = await import('fs/promises')
        const path = await import('path')
        
        const fullPath = path.join(process.cwd(), 'public', file.file_path)
        try {
          const stats = await fs.stat(fullPath)
          const sizeMB = (stats.size / 1024 / 1024).toFixed(2)
          console.log(`✅ Arquivo existe no disco (${sizeMB} MB)`)
        } catch {
          console.log(`❌ Arquivo NÃO encontrado no disco em: ${fullPath}`)
        }
        console.log('')
      }
      
      console.log('\n⚠️  PROBLEMA IDENTIFICADO:')
      console.log('   Os arquivos foram salvos via /api/sped/upload mas não foram processados.')
      console.log('   O endpoint /api/sped/upload apenas cria o registro no banco com status "pending".')
      console.log('   Ele NÃO faz o parsing e processamento do arquivo SPED.')
      console.log('\n💡 SOLUÇÃO:')
      console.log('   Use o endpoint /api/ingest/sped em vez de /api/sped/upload')
      console.log('   O /api/ingest/sped faz upload + processamento completo.')
    } else {
      console.log('✅ Nenhum arquivo pendente encontrado!')
    }
    
  } catch (error) {
    console.error('❌ Erro:', error)
    throw error
  } finally {
    await sql.end()
  }
}

main().catch(console.error)

