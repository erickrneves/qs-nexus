import { NextRequest, NextResponse } from 'next/server'

// ================================================================
// POST /api/documents/normalize/validate-table
// Step 4: Com JSONB, não precisamos mais validar tabelas!
// A tabela normalized_data já existe e serve para todos
// ================================================================

export async function POST(request: NextRequest) {
  try {
    // Com JSONB, sempre retornamos sucesso
    // A tabela normalized_data é única e já existe
    return NextResponse.json({
      success: true,
      exists: true,
      message: 'Usando tabela JSONB genérica - sempre disponível',
    })
  } catch (error) {
    console.error('Erro ao validar tabela:', error)
    return NextResponse.json(
      { error: 'Erro ao validar tabela' },
      { status: 500 }
    )
  }
}

