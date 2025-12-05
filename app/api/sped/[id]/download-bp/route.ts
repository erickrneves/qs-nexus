/**
 * API para download do Balanço Patrimonial em XLSX
 * Método: GET
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { ecdBalancoPatrimonial } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { generateBPExcel } from '@/lib/utils/excel-generator'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Autenticação
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const spedFileId = params.id

    // 2. Buscar dados do BP
    const bp = await db
      .select()
      .from(ecdBalancoPatrimonial)
      .where(eq(ecdBalancoPatrimonial.spedFileId, spedFileId))

    if (bp.length === 0) {
      return NextResponse.json({ error: 'BP não encontrado. Processe o ECD primeiro.' }, { status: 404 })
    }

    // 3. Identificar anos
    const anosSet = new Set<number>()
    bp.forEach(c => {
      const saldos = c.saldos as Record<number, number>
      Object.keys(saldos).forEach(ano => anosSet.add(Number(ano)))
    })
    const anos = Array.from(anosSet).sort()

    // 4. Gerar XLSX
    const buffer = generateBPExcel(bp as any, anos)

    // 5. Retornar arquivo
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="BP_${anos[0]}_${anos[anos.length - 1]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('[DOWNLOAD-BP] Erro:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

