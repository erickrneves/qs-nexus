import postgres from 'postgres'

const DATABASE_URL = 'postgresql://neondb_owner:npg_LXm4bDMjZ7fU@ep-icy-feather-acz95xfs-pooler.sa-east-1.aws.neon.tech/qs_rag?sslmode=require'

async function enablePgVector() {
  const sql = postgres(DATABASE_URL, {
    max: 1,
    ssl: 'require',
  })

  try {
    console.log('🔌 Conectando ao Neon DB...')
    
    // Habilitar extensão pgvector
    console.log('📦 Habilitando extensão pgvector...')
    await sql`CREATE EXTENSION IF NOT EXISTS vector`
    console.log('✅ Extensão pgvector habilitada com sucesso!')

    // Verificar se foi criada
    const extensions = await sql`
      SELECT extname, extversion 
      FROM pg_extension 
      WHERE extname = 'vector'
    `
    
    if (extensions.length > 0) {
      console.log('✅ Verificado: pgvector versão', extensions[0].extversion)
    } else {
      console.log('❌ Erro: pgvector não foi habilitada')
    }

  } catch (error) {
    console.error('❌ Erro ao habilitar pgvector:', error)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

enablePgVector()

