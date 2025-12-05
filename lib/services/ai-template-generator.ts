/**
 * AI Template Generator
 * 
 * Serviço para análise de documentos e geração automática de templates
 * usando OpenAI GPT-4
 */

import OpenAI from 'openai'
import { db } from '@/lib/db'
import { documents } from '@/lib/db/schema/documents'
import { eq } from 'drizzle-orm'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { convertDocument } from './document-converter'

// ================================================================
// Tipos e Interfaces
// ================================================================

export interface TemplateField {
  name: string
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'array'
  label: string
  description: string
  required: boolean
  validation?: {
    pattern?: string
    min?: number
    max?: number
    options?: string[]
  }
}

export interface TemplateAnalysisResult {
  suggestedName: string
  suggestedDescription: string
  fields: TemplateField[]
  previewData: Record<string, any>
  confidence: number
}

// ================================================================
// Funções Principais
// ================================================================

/**
 * Analisa a estrutura de um documento e sugere um template
 */
export async function analyzeDocumentStructure(
  documentId: string,
  userDescription: string
): Promise<TemplateAnalysisResult> {
  // Buscar documento do banco
  const [doc] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1)

  if (!doc) {
    throw new Error('Documento não encontrado')
  }

  // Construir caminho absoluto do arquivo
  const fullPath = join(process.cwd(), 'public', doc.filePath)
  
  console.log(`[AI] Analisando documento: ${doc.fileName}`)
  console.log(`[AI] Caminho relativo: ${doc.filePath}`)
  console.log(`[AI] Caminho absoluto: ${fullPath}`)
  
  // Verificar se arquivo existe
  if (!existsSync(fullPath)) {
    throw new Error(`Arquivo não encontrado: ${fullPath}`)
  }

  // Ler conteúdo do arquivo
  let documentContent: string

  try {
    // Tentar converter para Markdown se não for texto puro
    if (doc.mimeType?.includes('pdf') || doc.mimeType?.includes('word')) {
      const markdownPath = fullPath.replace(/\.[^.]+$/, '.md')
      try {
        if (existsSync(markdownPath)) {
          console.log(`[AI] Usando markdown existente: ${markdownPath}`)
          documentContent = readFileSync(markdownPath, 'utf-8')
        } else {
          console.log(`[AI] Convertendo documento para markdown...`)
          const converted = await convertDocument(fullPath)
          documentContent = converted.markdown
          console.log(`[AI] Conversão concluída. Tamanho: ${documentContent.length} caracteres`)
        }
      } catch (conversionError) {
        console.error(`[AI] Erro na conversão:`, conversionError)
        throw new Error(`Erro ao converter documento: ${conversionError instanceof Error ? conversionError.message : 'Erro desconhecido'}`)
      }
    } else {
      // Texto puro
      console.log(`[AI] Lendo arquivo de texto puro...`)
      documentContent = readFileSync(fullPath, 'utf-8')
    }
  } catch (error) {
    console.error(`[AI] Erro ao ler documento:`, error)
    throw new Error(`Erro ao ler documento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }

  // Limitar tamanho do conteúdo (GPT-4 tem limite de tokens)
  const maxContentLength = 15000 // ~4000 tokens
  if (documentContent.length > maxContentLength) {
    documentContent = documentContent.substring(0, maxContentLength) + '\n\n[... conteúdo truncado ...]'
  }

  // Chamar OpenAI para análise
  const analysis = await analyzeWithOpenAI(documentContent, userDescription)

  return analysis
}

/**
 * Extrai dados de um documento usando campos de template definidos
 */
export async function extractDataFromDocument(
  documentContent: string,
  templateFields: TemplateField[]
): Promise<Record<string, any>> {
  const openai = getOpenAIClient()

  const fieldsDescription = templateFields
    .map(f => `- ${f.name} (${f.type}): ${f.description}`)
    .join('\n')

  const prompt = `
Você é um especialista em extração de dados de documentos.

CAMPOS A EXTRAIR:
${fieldsDescription}

DOCUMENTO:
${documentContent.substring(0, 8000)}

INSTRUÇÕES:
1. Extraia os valores dos campos listados acima
2. Use o tipo correto (texto, número, data, boolean, etc)
3. Se um campo não estiver presente, use null
4. Retorne apenas JSON válido

FORMATO DE SAÍDA (JSON):
{
  "campo_1": "valor",
  "campo_2": 123,
  "campo_3": "2024-01-15",
  ...
}
`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente especializado em extração de dados estruturados de documentos. Sempre retorne JSON válido.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('OpenAI não retornou conteúdo')
    }

    const extractedData = JSON.parse(content)
    return extractedData
  } catch (error) {
    console.error('Erro ao extrair dados com OpenAI:', error)
    throw new Error(`Erro na extração: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }
}

/**
 * Valida uma API Key da OpenAI
 */
export async function validateOpenAiKey(apiKey: string): Promise<boolean> {
  try {
    const openai = new OpenAI({ apiKey })
    await openai.models.list()
    return true
  } catch {
    return false
  }
}

// ================================================================
// Funções Auxiliares Privadas
// ================================================================

/**
 * Analisa documento com OpenAI GPT-4
 */
async function analyzeWithOpenAI(
  documentContent: string,
  userDescription: string
): Promise<TemplateAnalysisResult> {
  const openai = getOpenAIClient()

  const prompt = `
Você é um especialista em análise de documentos e normalização de dados.

TAREFA:
Analise o documento fornecido e crie uma estrutura de dados JSONB para armazená-lo.

DESCRIÇÃO DO USUÁRIO:
${userDescription}

DOCUMENTO:
${documentContent}

INSTRUÇÕES:
1. Identifique todos os campos/informações relevantes no documento
2. Para cada campo, defina: nome (snake_case), tipo, rótulo, se é obrigatório
3. Extraia os valores atuais desses campos do documento
4. Sugira um nome e descrição para o template
5. Retorne no formato JSON especificado

TIPOS VÁLIDOS:
- text: texto curto ou longo
- number: números (inteiro ou decimal)
- date: datas (formato ISO)
- boolean: verdadeiro/falso
- select: lista de opções pré-definidas
- array: lista de valores

FORMATO DE SAÍDA (JSON):
{
  "suggestedName": "template_nome_descritivo",
  "suggestedDescription": "descrição clara e concisa",
  "fields": [
    {
      "name": "campo_exemplo",
      "type": "text|number|date|boolean|select|array",
      "label": "Rótulo Amigável",
      "description": "Para que serve este campo",
      "required": true,
      "validation": {
        "pattern": "regex_opcional",
        "min": 0,
        "max": 100,
        "options": ["opcao1", "opcao2"]
      }
    }
  ],
  "previewData": {
    "campo_exemplo": "valor extraído do documento atual"
  },
  "confidence": 0.95
}

IMPORTANTE: Retorne APENAS o JSON, sem texto adicional.
`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente especializado em análise de documentos e criação de esquemas de dados. Sempre retorne JSON válido e bem estruturado.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('OpenAI não retornou conteúdo')
    }

    const analysis: TemplateAnalysisResult = JSON.parse(content)

    // Validar estrutura
    if (!analysis.suggestedName || !analysis.fields || !Array.isArray(analysis.fields)) {
      throw new Error('Resposta da IA em formato inválido')
    }

    // Garantir confidence entre 0 e 1
    if (!analysis.confidence || analysis.confidence < 0 || analysis.confidence > 1) {
      analysis.confidence = 0.85
    }

    return analysis
  } catch (error) {
    console.error('Erro ao analisar com OpenAI:', error)
    throw new Error(`Erro na análise: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }
}

/**
 * Obtém cliente OpenAI configurado
 */
function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY não configurada. Configure em Settings > IA.')
  }

  return new OpenAI({ apiKey })
}

