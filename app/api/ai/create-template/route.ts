import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { processDocumentWithAiTemplate } from '@/lib/services/normalization-processor'

/**
 * POST /api/ai/create-template
 * Cria template a partir da análise da IA e processa documento
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { documentId, templateData, saveAsReusable, applyToDocument } = body

    if (!documentId) {
      return NextResponse.json({ error: 'documentId é obrigatório' }, { status: 400 })
    }

    if (!templateData) {
      return NextResponse.json({ error: 'templateData é obrigatório' }, { status: 400 })
    }

    // Validar templateData
    if (!templateData.name || !templateData.fields || !Array.isArray(templateData.fields)) {
      return NextResponse.json(
        { error: 'templateData inválido - deve conter name e fields' },
        { status: 400 }
      )
    }

    const organizationId = session.user.organizationId || ''
    const userId = session.user.id

    console.log(`🤖 Criando template por IA para documento ${documentId}...`)
    console.log(`📋 Template: ${templateData.name}`)
    console.log(`💾 Salvar como reutilizável: ${saveAsReusable ? 'Sim' : 'Não'}`)

    // Processar documento com template criado por IA
    const result = await processDocumentWithAiTemplate(
      documentId,
      organizationId,
      userId,
      templateData,
      saveAsReusable || false,
      applyToDocument !== false // Default true
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erro ao criar template' },
        { status: 500 }
      )
    }

    console.log(`✅ Template criado e aplicado com sucesso`)

    return NextResponse.json({
      success: true,
      templateId: result.templateId,
      documentId: result.documentId,
      normalizedDataId: result.normalizedDataId,
    })
  } catch (error) {
    console.error('Error creating AI template:', error)
    return NextResponse.json(
      {
        error: 'Erro ao criar template',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}

