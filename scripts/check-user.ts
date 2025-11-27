import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import postgres from 'postgres'

async function main() {
  const sql = postgres(process.env.DATABASE_URL!)
  const users = await sql`SELECT id, email, name, LEFT(password, 30) as pwd_preview FROM rag_users`
  console.log('Usuários:', JSON.stringify(users, null, 2))
  await sql.end()
}

main()



