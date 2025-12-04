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
    console.log('🔍 Verificando dados SPED no banco de dados...\n')

    // Verificar tabela sped_files
    const spedFiles = await sql`
      SELECT id, file_name, cnpj, company_name, status, 
             total_records, processed_records, created_at
      FROM sped_files 
      ORDER BY created_at DESC
      LIMIT 10
    `
    
    console.log('📁 ARQUIVOS SPED:')
    console.log(`   Total encontrado: ${spedFiles.length}`)
    
    if (spedFiles.length > 0) {
      console.log('\n   Últimos 10 arquivos:')
      spedFiles.forEach((file, i) => {
        console.log(`\n   ${i + 1}. ${file.file_name}`)
        console.log(`      ID: ${file.id}`)
        console.log(`      CNPJ: ${file.cnpj}`)
        console.log(`      Empresa: ${file.company_name}`)
        console.log(`      Status: ${file.status}`)
        console.log(`      Registros: ${file.processed_records || 0}/${file.total_records || 0}`)
        console.log(`      Upload: ${new Date(file.created_at).toLocaleString('pt-BR')}`)
      })
    } else {
      console.log('   ⚠️  Nenhum arquivo SPED encontrado no banco')
    }

    // Verificar contas
    const accountsCount = await sql`
      SELECT COUNT(*) as count FROM chart_of_accounts
    `
    console.log(`\n📊 PLANO DE CONTAS:`)
    console.log(`   Total de contas: ${accountsCount[0].count}`)

    // Verificar saldos
    const balancesCount = await sql`
      SELECT COUNT(*) as count FROM account_balances
    `
    console.log(`\n💰 SALDOS:`)
    console.log(`   Total de saldos: ${balancesCount[0].count}`)

    // Verificar lançamentos
    const entriesCount = await sql`
      SELECT COUNT(*) as count FROM journal_entries
    `
    console.log(`\n📝 LANÇAMENTOS:`)
    console.log(`   Total de lançamentos: ${entriesCount[0].count}`)

    // Verificar partidas
    const itemsCount = await sql`
      SELECT COUNT(*) as count FROM journal_items
    `
    console.log(`\n🔢 PARTIDAS:`)
    console.log(`   Total de partidas: ${itemsCount[0].count}`)

    // Verificar arquivos no sistema de arquivos
    console.log(`\n💾 ARQUIVOS NO DISCO:`)
    const fs = await import('fs/promises')
    const path = await import('path')
    
    const uploadDir = path.join(process.cwd(), 'uploads', 'sped')
    try {
      const files = await fs.readdir(uploadDir)
      console.log(`   Total de arquivos: ${files.length}`)
      
      if (files.length > 0) {
        console.log('\n   Últimos 5 arquivos:')
        const sortedFiles = files.slice(-5)
        for (const file of sortedFiles) {
          const stats = await fs.stat(path.join(uploadDir, file))
          const sizeMB = (stats.size / 1024 / 1024).toFixed(2)
          console.log(`      - ${file} (${sizeMB} MB)`)
        }
      }
    } catch (error) {
      console.log(`   ⚠️  Diretório não encontrado ou vazio`)
    }

    console.log('\n✅ Verificação concluída!')
    
  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error)
    throw error
  } finally {
    await sql.end()
  }
}

main().catch(console.error)

