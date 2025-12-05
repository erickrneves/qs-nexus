import { NextRequest, NextResponse } from 'next/server'

// ================================================================
// POST /api/documents/normalize/create-table
// DEPRECADO: Com JSONB não precisamos mais criar tabelas!
// Mantido apenas para compatibilidade, mas sempre retorna sucesso
// ================================================================

export async function POST(request: NextRequest) {
  try {
    // Com JSONB, não criamos tabelas SQL dinâmicas
    // A tabela normalized_data é única e já existe
    return NextResponse.json({
      success: true,
      message: 'Usando arquitetura JSONB - tabela genérica já disponível',
    })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json(
      { error: 'Erro' },
      { status: 500 }
    )
  }
}

