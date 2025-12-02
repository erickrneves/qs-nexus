import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { organizations, organizationMembers } from '@/lib/db/schema/organizations'
import { eq, and } from 'drizzle-orm'

/**
 * GET /api/organizations
 * Lista organizações do usuário autenticado
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Pegar userId da sessão autenticada
    // const session = await auth()
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    // }
    // const userId = session.user.id

    // Por enquanto, retornar todas as organizações ativas
    const allOrgs = await db
      .select()
      .from(organizations)
      .where(eq(organizations.isActive, true))
      .orderBy(organizations.name)

    return NextResponse.json({
      organizations: allOrgs,
    })
  } catch (error) {
    console.error('Error fetching organizations:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar organizações' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/organizations
 * Cria nova organização
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Verificar permissões (apenas admins)
    const body = await request.json()
    
    const { name, cnpj, slug, logoUrl, settings } = body

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Nome e slug são obrigatórios' },
        { status: 400 }
      )
    }

    const [org] = await db
      .insert(organizations)
      .values({
        name,
        cnpj,
        slug,
        logoUrl,
        settings: settings || {},
      })
      .returning()

    return NextResponse.json({ organization: org }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating organization:', error)
    
    if (error.code === '23505') { // Unique violation
      return NextResponse.json(
        { error: 'CNPJ ou slug já existe' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao criar organização' },
      { status: 500 }
    )
  }
}

