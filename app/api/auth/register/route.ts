import { NextResponse } from 'next/server'
import { db } from '@/lib/db/index'
import { ragUsers } from '@/lib/db/schema/rag-users'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Verificar se o email já existe
    const existingUser = await db.select().from(ragUsers).where(eq(ragUsers.email, email)).limit(1)

    if (existingUser.length > 0) {
      return NextResponse.json({ error: 'Este email já está em uso' }, { status: 400 })
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10)

    // Criar usuário
    const [newUser] = await db
      .insert(ragUsers)
      .values({
        name,
        email,
        password: hashedPassword,
      })
      .returning()

    return NextResponse.json(
      {
        message: 'Usuário criado com sucesso',
        user: { id: newUser.id, email: newUser.email, name: newUser.name },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 })
  }
}
