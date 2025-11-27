import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import postgres from 'postgres'
import bcrypt from 'bcryptjs'

const sql = postgres(process.env.DATABASE_URL!)

async function createTestUser() {
  const hashedPassword = await bcrypt.hash('123456', 10)

  try {
    const existing = await sql`SELECT id FROM rag_users WHERE email = 'admin@qsconsultoria.com.br'`

    if (existing.length > 0) {
      console.log('Usuário já existe!')
      await sql.end()
      return
    }

    await sql`
      INSERT INTO rag_users (email, name, password)
      VALUES ('admin@qsconsultoria.com.br', 'Admin QS', ${hashedPassword})
    `

    console.log('✅ Usuário criado:')
    console.log('   Email: admin@qsconsultoria.com.br')
    console.log('   Senha: 123456')
  } catch (error) {
    console.error('Erro:', error)
  }

  await sql.end()
}

createTestUser()



