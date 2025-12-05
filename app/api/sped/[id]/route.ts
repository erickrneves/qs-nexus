/**
 * API para gerenciar arquivos SPED
 * Métodos: GET, DELETE
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { spedFiles, ecdBalancoPatrimonial, ecdDRE } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

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

    // 2. Buscar arquivo SPED
    const [spedFile] = await db
      .select()
      .from(spedFiles)
      .where(eq(spedFiles.id, spedFileId))
      .limit(1)

    if (!spedFile) {
      return NextResponse.json({ error: 'Arquivo SPED não encontrado' }, { status: 404 })
    }

    return NextResponse.json(spedFile)
  } catch (error) {
    console.error('[SPED-GET] Erro:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    console.log(`[SPED-DELETE] Deletando arquivo SPED: ${spedFileId}`)

    // 2. Buscar arquivo SPED
    const [spedFile] = await db
      .select()
      .from(spedFiles)
      .where(eq(spedFiles.id, spedFileId))
      .limit(1)

    if (!spedFile) {
      return NextResponse.json({ error: 'Arquivo SPED não encontrado' }, { status: 404 })
    }

    // 3. Deletar dados processados (BP e DRE)
    console.log('[SPED-DELETE] Deletando BP...')
    await db
      .delete(ecdBalancoPatrimonial)
      .where(eq(ecdBalancoPatrimonial.spedFileId, spedFileId))

    console.log('[SPED-DELETE] Deletando DRE...')
    await db
      .delete(ecdDRE)
      .where(eq(ecdDRE.spedFileId, spedFileId))

    // 4. Deletar arquivo físico
    const filePath = join(process.cwd(), 'public', spedFile.filePath)
    if (existsSync(filePath)) {
      await unlink(filePath)
      console.log('[SPED-DELETE] Arquivo físico deletado')
    }

    // 5. Deletar registro do banco
    await db
      .delete(spedFiles)
      .where(eq(spedFiles.id, spedFileId))

    console.log('[SPED-DELETE] ✅ Arquivo SPED deletado com sucesso')

    return NextResponse.json({
      success: true,
      message: 'Arquivo SPED deletado com sucesso',
    })
  } catch (error) {
    console.error('[SPED-DELETE] ❌ Erro:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao deletar arquivo' },
      { status: 500 }
    )
  }
}
