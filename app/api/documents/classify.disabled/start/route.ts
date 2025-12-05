import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { documents } from '@/lib/db/schema/documents'
import { classificationConfigs } from '@/lib/db/schema/classification-configs'
import { normalizationTemplates } from '@/lib/db/schema/normalization-templates'
import { eq, and } from 'drizzle-orm'
import { auth } from '@/lib/auth/config'

// ================================================================
// POST /api/documents/classify/start
// Inicia o processo de classificação (metadados + IA)
// ================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { documentId, organizationId } = body

    if (!documentId || !organizationId) {
      return NextResponse.json(
        { error: 'documentId e organizationId são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar documento
    const [document] = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.id, documentId),
          eq(documents.organizationId, organizationId)
        )
      )
      .limit(1)

    if (!document) {
      return NextResponse.json(
        { error: 'Documento não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se normalização foi concluída
    if (document.normalizationStatus !== 'completed') {
      return NextResponse.json(
        { error: 'Documento precisa estar normalizado antes da classificação' },
        { status: 400 }
      )
    }

    // Buscar config de classificação padrão para o template
    const [config] = await db
      .select()
      .from(classificationConfigs)
      .where(
        and(
          eq(classificationConfigs.normalizationTemplateId, document.normalizationTemplateId!),
          eq(classificationConfigs.isActive, true),
          eq(classificationConfigs.isDefault, true)
        )
      )
      .limit(1)

    if (!config) {
      // Se não tem config padrão, criar uma básica
      const [newConfig] = await db
        .insert(classificationConfigs)
        .values({
          organizationId,
          normalizationTemplateId: document.normalizationTemplateId!,
          name: 'Config Padrão',
          systemPrompt: 'Você é um assistente que extrai informações de documentos.',
          modelProvider: 'openai',
          modelName: 'gpt-4',
          temperature: '0.10',
          isActive: true,
          isDefault: true,
        })
        .returning()
      
      // Atualizar documento com config
      await db
        .update(documents)
        .set({
          classificationConfigId: newConfig.id,
          classificationStatus: 'extracting',
          updatedAt: new Date(),
        })
        .where(eq(documents.id, documentId))
    } else {
      // Atualizar documento com config existente
      await db
        .update(documents)
        .set({
          classificationConfigId: config.id,
          classificationStatus: 'extracting',
          updatedAt: new Date(),
        })
        .where(eq(documents.id, documentId))
    }

    // TODO: Adicionar à fila de processamento
    // Por ora, apenas muda o status
    // Em produção, adicionar job para processar em background

    return NextResponse.json({
      success: true,
      message: 'Classificação iniciada',
      documentId,
    })
  } catch (error) {
    console.error('Erro ao iniciar classificação:', error)
    return NextResponse.json(
      { error: 'Erro ao iniciar classificação' },
      { status: 500 }
    )
  }
}

