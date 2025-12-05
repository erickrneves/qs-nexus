/**
 * API para processar ECD (Balanço Patrimonial e DRE)
 * Método: POST
 * 
 * Extração 100% programática - SEM IA - CUSTO $0
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { 
  spedFiles,
  ecdBalancoPatrimonial,
  ecdDRE,
} from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { join } from 'path'
import { extractECDProgrammatically } from '@/lib/services/ecd-programmatic-extractor'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Autenticação
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const userId = session.user.id
    const spedFileId = params.id

    console.log(`[PROCESS-ECD] Iniciando processamento para SPED ${spedFileId}`)

    // 2. Buscar arquivo SPED
    const [spedFile] = await db
      .select()
      .from(spedFiles)
      .where(eq(spedFiles.id, spedFileId))
      .limit(1)

    if (!spedFile) {
      return NextResponse.json({ error: 'Arquivo SPED não encontrado' }, { status: 404 })
    }

    console.log(`[PROCESS-ECD] Arquivo: ${spedFile.fileName}`)
    console.log(`[PROCESS-ECD] Organization: ${spedFile.organizationId}`)

    // 3. Extrair caminho do arquivo
    const filePath = join(process.cwd(), 'public', spedFile.filePath)
    console.log(`[PROCESS-ECD] Path: ${filePath}`)

    // 4. Processar ECD (PROGRAMÁTICO - CUSTO $0)
    console.log('[PROCESS-ECD] 💰 Usando extração PROGRAMÁTICA (custo $0)')
    
    const result = await extractECDProgrammatically(
      filePath,
      (progress, message) => {
        console.log(`[PROCESS-ECD] ${progress}% - ${message}`)
      }
    )

    if (!result.success) {
      console.error('[PROCESS-ECD] ❌ Erro na extração:', result.error)
      return NextResponse.json(
        { error: result.error || 'Erro ao processar ECD' },
        { status: 500 }
      )
    }

    console.log('[PROCESS-ECD] ✅ Extração concluída!')
    console.log(`[PROCESS-ECD] BP: ${result.bp?.length || 0} contas`)
    console.log(`[PROCESS-ECD] DRE: ${result.dre?.length || 0} contas`)
    console.log(`[PROCESS-ECD] Tempo: ${result.executionTime}ms`)
    console.log('[PROCESS-ECD] 💰 Custo: $0.00 (sem IA!)')

    // 5. Salvar BP em tabela relacional (BULK INSERT)
    if (result.bp && result.bp.length > 0) {
      console.log(`[PROCESS-ECD] Salvando ${result.bp.length} contas do BP...`)
      
      const bpValues = result.bp.map(conta => ({
        organizationId: spedFile.organizationId,
        spedFileId: spedFile.id,
        normalizedDataId: null, // SPED não usa normalized_data
        codCta: conta.cod_cta,
        codCtaRef: conta.cod_cta_ref,
        ctaDescricao: conta.cta,
        saldos: conta.saldos,
        ahAbs: conta.ah_abs,
        ahPerc: conta.ah_perc,
        avPerc: conta.av_perc,
        createdBy: userId,
      }))

      await db.insert(ecdBalancoPatrimonial).values(bpValues)
      console.log('[PROCESS-ECD] ✅ BP salvo!')
    }

    // 6. Salvar DRE em tabela relacional (BULK INSERT)
    if (result.dre && result.dre.length > 0) {
      console.log(`[PROCESS-ECD] Salvando ${result.dre.length} contas da DRE...`)
      
      const dreValues = result.dre.map(conta => ({
        organizationId: spedFile.organizationId,
        spedFileId: spedFile.id,
        normalizedDataId: null, // SPED não usa normalized_data
        codCta: conta.cod_cta,
        codCtaRef: conta.cod_cta_ref,
        ctaDescricao: conta.cta,
        saldos: conta.saldos,
        ahAbs: conta.ah_abs,
        ahPerc: conta.ah_perc,
        avPerc: conta.av_perc,
        createdBy: userId,
      }))

      await db.insert(ecdDRE).values(dreValues)
      console.log('[PROCESS-ECD] ✅ DRE salvo!')
    }

    // 7. Atualizar status do SPED file
    await db
      .update(spedFiles)
      .set({
        status: 'completed',
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(spedFiles.id, spedFileId))

    console.log('[PROCESS-ECD] 🎉 Processamento concluído com sucesso!')

    return NextResponse.json({
      success: true,
      spedFileId: spedFile.id,
      bp: {
        count: result.bp?.length || 0,
      },
      dre: {
        count: result.dre?.length || 0,
      },
      metadata: result.metadata,
      executionTime: result.executionTime,
      cost: 0.00, // SEM IA!
    })
  } catch (error) {
    console.error('[PROCESS-ECD] ❌ Erro:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}

