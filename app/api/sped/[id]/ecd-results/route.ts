/**
 * API para buscar resultados ECD (BP e DRE)
 * Método: GET
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import {
  ecdBalancoPatrimonial,
  ecdDRE,
  ecdPlanoReferencial,
} from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

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

    // 2. Buscar planos referenciais oficiais
    const planoRefBP = await db
      .select()
      .from(ecdPlanoReferencial)
      .where(eq(ecdPlanoReferencial.tipo, 'BP'))
    
    const planoRefDRE = await db
      .select()
      .from(ecdPlanoReferencial)
      .where(eq(ecdPlanoReferencial.tipo, 'DRE'))
    
    // Criar maps para lookup rápido
    const planoMapBP = new Map(planoRefBP.map(p => [p.codCtaRef, p]))
    const planoMapDRE = new Map(planoRefDRE.map(p => [p.codCtaRef, p]))

    // 3. Buscar BP (ordenado por código referencial)
    const bpRaw = await db
      .select()
      .from(ecdBalancoPatrimonial)
      .where(eq(ecdBalancoPatrimonial.spedFileId, spedFileId))
    
    // Enriquecer e ordenar BP
    const bp = bpRaw
      .map(conta => {
        const plano = planoMapBP.get(conta.codCtaRef || '')
        return {
          ...conta,
          // Enriquecer com dados oficiais
          descricaoOficial: plano?.descricao || null,
          nivelOficial: plano?.nivel || null,
          tipoContaOficial: plano?.tipoConta || null,
          isPadraoRFB: !!plano,
        }
      })
      .sort((a, b) => {
        const refA = a.codCtaRef || ''
        const refB = b.codCtaRef || ''
        return refA.localeCompare(refB)
      })

    // 4. Buscar DRE (ordenado por código referencial)
    const dreRaw = await db
      .select()
      .from(ecdDRE)
      .where(eq(ecdDRE.spedFileId, spedFileId))
    
    // Enriquecer e ordenar DRE
    const dre = dreRaw
      .map(conta => {
        const plano = planoMapDRE.get(conta.codCtaRef || '')
        return {
          ...conta,
          // Enriquecer com dados oficiais
          descricaoOficial: plano?.descricao || null,
          nivelOficial: plano?.nivel || null,
          tipoContaOficial: plano?.tipoConta || null,
          isPadraoRFB: !!plano,
        }
      })
      .sort((a, b) => {
        const refA = a.codCtaRef || ''
        const refB = b.codCtaRef || ''
        return refA.localeCompare(refB)
      })

    // 5. Identificar anos presentes
    const anosSet = new Set<number>()
    bp.forEach(c => {
      const saldos = c.saldos as Record<number, number>
      Object.keys(saldos).forEach(ano => anosSet.add(Number(ano)))
    })
    const anos = Array.from(anosSet).sort()

    return NextResponse.json({
      bp,
      dre,
      metadata: {
        anos,
        bpCount: bp.length,
        dreCount: dre.length,
      },
    })
  } catch (error) {
    console.error('[ECD-RESULTS] Erro:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

