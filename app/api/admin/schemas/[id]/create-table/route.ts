import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createPhysicalTable } from '@/lib/services/schema-manager'

/**
 * POST /api/admin/schemas/[id]/create-table
 * Cria a tabela física no PostgreSQL
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, orgId } = await auth()
    
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const result = await createPhysicalTable(params.id, orgId)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('[API] Erro ao criar tabela física:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao criar tabela física' },
      { status: 500 }
    )
  }
}

