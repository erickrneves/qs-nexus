/**
 * Programmatic Extractor
 * 
 * Extração 100% PROGRAMÁTICA - SEM IA - CUSTO $0
 * 
 * Usa apenas:
 * - Regex patterns
 * - Scripts JavaScript
 * - Lógica determinística
 * 
 * Benefícios:
 * - Custo ZERO (sem API calls)
 * - Velocidade máxima (processamento local)
 * - Escalável (milhares de documentos)
 * - Confiável (regras determinísticas)
 * - Texto 100% fiel ao original
 */

import { db } from '@/lib/db'
import { documents, normalizationTemplates } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { join } from 'path'
import { convertDocument } from './document-converter'

// ========================================
// INTERFACES
// ========================================

export interface ExtractionRules {
  artigos: {
    pattern: string
    extractor?: string
  }
  paragrafos?: {
    pattern: string
    extractor?: string
  }
  incisos?: {
    pattern: string
    extractor?: string
  }
  alineas?: {
    pattern: string
    extractor?: string
  }
  metadata?: {
    [key: string]: {
      pattern: string
      type: 'text' | 'date' | 'number'
    }
  }
}

export interface ExtractedArticle {
  numero: number
  caput: string
  paragrafos: ExtractedParagraph[]
}

export interface ExtractedParagraph {
  numero: string
  texto: string
  incisos: ExtractedInciso[]
}

export interface ExtractedInciso {
  numero: string
  texto: string
  alineas: ExtractedAlinea[]
}

export interface ExtractedAlinea {
  letra: string
  texto: string
}

// ========================================
// EXTRATORES PROGRAMÁTICOS
// ========================================

/**
 * Extrai artigos de documentos jurídicos usando REGEX
 */
export function extractArticles(content: string, pattern: string): ExtractedArticle[] {
  const regex = new RegExp(pattern, 'gim')
  const matches = [...content.matchAll(regex)]
  
  if (matches.length === 0) {
    console.log('[PROGRAMMATIC] Nenhum artigo encontrado com pattern:', pattern)
    return []
  }
  
  console.log(`[PROGRAMMATIC] Encontrados ${matches.length} artigos com regex`)
  
  const articles: ExtractedArticle[] = []
  const seenNumbers = new Set<number>()
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const articleNumber = parseInt(match[1])
    
    // Evitar duplicatas
    if (seenNumbers.has(articleNumber)) {
      continue
    }
    seenNumbers.add(articleNumber)
    
    // Extrair texto do artigo (até o próximo artigo)
    const start = match.index! + match[0].indexOf('Art.')
    const end = matches[i + 1]?.index || content.length
    const text = content.substring(start, end).trim()
    
    // Validar tamanho mínimo
    if (text.length < 20) {
      continue
    }
    
    articles.push({
      numero: articleNumber,
      caput: '', // Será preenchido depois
      paragrafos: [],
    })
  }
  
  console.log(`[PROGRAMMATIC] ${articles.length} artigos válidos após filtragem`)
  
  return articles.sort((a, b) => a.numero - b.numero)
}

/**
 * Extrai caput do artigo (texto antes do primeiro parágrafo)
 */
export function extractCaput(articleText: string): string {
  // Procurar pelo primeiro parágrafo
  const paragraphMatch = articleText.match(/§\s*(\d+|único)[ºª°]?\.?\s*/i)
  
  if (paragraphMatch && paragraphMatch.index) {
    // Há parágrafos - caput é o texto antes
    return articleText.substring(0, paragraphMatch.index).trim()
  }
  
  // Sem parágrafos - todo o texto é o caput
  return articleText.trim()
}

/**
 * Extrai parágrafos de um artigo usando REGEX
 */
export function extractParagraphs(articleText: string, pattern?: string): ExtractedParagraph[] {
  const defaultPattern = '§\\s*(\\d+|único)[ºª°]?\\.?\\s*'
  const regex = new RegExp(pattern || defaultPattern, 'gim')
  const matches = [...articleText.matchAll(regex)]
  
  if (matches.length === 0) {
    return []
  }
  
  const paragraphs: ExtractedParagraph[] = []
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const paragraphNumber = match[1]
    
    const start = match.index! + match[0].length
    const end = matches[i + 1]?.index || articleText.length
    const text = articleText.substring(start, end).trim()
    
    paragraphs.push({
      numero: paragraphNumber,
      texto: text,
      incisos: [],
    })
  }
  
  return paragraphs
}

/**
 * Extrai incisos de um parágrafo usando REGEX
 */
export function extractIncisos(paragraphText: string, pattern?: string): ExtractedInciso[] {
  const defaultPattern = '([IVX]+)\\s*[-–—]\\s*'
  const regex = new RegExp(pattern || defaultPattern, 'gm')
  const matches = [...paragraphText.matchAll(regex)]
  
  if (matches.length === 0) {
    return []
  }
  
  const incisos: ExtractedInciso[] = []
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const incisoNumber = match[1]
    
    const start = match.index! + match[0].length
    const end = matches[i + 1]?.index || paragraphText.length
    const text = paragraphText.substring(start, end).trim()
    
    incisos.push({
      numero: incisoNumber,
      texto: text,
      alineas: [],
    })
  }
  
  return incisos
}

/**
 * Extrai alíneas de um inciso usando REGEX
 */
export function extractAlineas(incisoText: string, pattern?: string): ExtractedAlinea[] {
  const defaultPattern = '([a-z])\\)\\s*'
  const regex = new RegExp(pattern || defaultPattern, 'gim')
  const matches = [...incisoText.matchAll(regex)]
  
  if (matches.length === 0) {
    return []
  }
  
  const alineas: ExtractedAlinea[] = []
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const alineaLetter = match[1]
    
    const start = match.index! + match[0].length
    const end = matches[i + 1]?.index || incisoText.length
    const text = incisoText.substring(start, end).trim()
    
    alineas.push({
      letra: alineaLetter,
      texto: text,
    })
  }
  
  return alineas
}

/**
 * Extrai metadados usando regex simples
 */
export function extractMetadata(
  content: string,
  metadataRules: Record<string, { pattern: string; type: string }>
): Record<string, any> {
  const metadata: Record<string, any> = {}
  
  for (const [fieldName, rule] of Object.entries(metadataRules)) {
    const regex = new RegExp(rule.pattern, 'im')
    const match = content.match(regex)
    
    if (match && match[1]) {
      let value = match[1].trim()
      
      // Converter tipo
      if (rule.type === 'number') {
        value = parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.'))
      } else if (rule.type === 'date') {
        // Manter como string, pode converter depois se necessário
        value = value
      }
      
      metadata[fieldName] = value
    } else {
      metadata[fieldName] = null
    }
  }
  
  return metadata
}

// ========================================
// EXTRATOR PRINCIPAL PARA LEIS
// ========================================

/**
 * Extrai TODOS os dados de uma lei usando APENAS REGEX
 * SEM IA - CUSTO $0 - VELOCIDADE MÁXIMA
 */
export async function extractLegalDocumentProgrammatically(
  content: string,
  rules: ExtractionRules
): Promise<Record<string, any>> {
  console.log('[PROGRAMMATIC] Iniciando extração programática...')
  const startTime = Date.now()
  
  // 1. Extrair artigos
  const articlesRaw = extractArticles(content, rules.artigos.pattern)
  console.log(`[PROGRAMMATIC] ${articlesRaw.length} artigos encontrados`)
  
  // 2. Dividir texto por artigos e extrair estrutura completa
  const articlePattern = new RegExp(rules.artigos.pattern, 'gim')
  const articleMatches = [...content.matchAll(articlePattern)]
  
  const articles: any[] = []
  
  for (let i = 0; i < articleMatches.length; i++) {
    const match = articleMatches[i]
    const articleNumber = parseInt(match[1])
    
    // Evitar duplicatas
    if (articles.find(a => a.numero === articleNumber)) {
      continue
    }
    
    // Extrair texto do artigo
    const start = match.index! + match[0].indexOf('Art.')
    const end = articleMatches[i + 1]?.index || content.length
    const articleText = content.substring(start, end).trim()
    
    // Validar tamanho mínimo
    if (articleText.length < 20) {
      continue
    }
    
    // Extrair caput
    const caput = extractCaput(articleText)
    
    // Extrair parágrafos
    const paragraphs = extractParagraphs(articleText, rules.paragrafos?.pattern)
    
    // Para cada parágrafo, extrair incisos
    paragraphs.forEach(p => {
      p.incisos = extractIncisos(p.texto, rules.incisos?.pattern)
      
      // Para cada inciso, extrair alíneas
      p.incisos.forEach(inc => {
        inc.alineas = extractAlineas(inc.texto, rules.alineas?.pattern)
      })
    })
    
    articles.push({
      numero: articleNumber,
      caput,
      paragrafos: paragraphs,
    })
    
    // Log de progresso a cada 10 artigos
    if ((i + 1) % 10 === 0) {
      console.log(`[PROGRAMMATIC] Processados ${i + 1}/${articleMatches.length} artigos...`)
    }
  }
  
  // 3. Extrair metadados (se definidos)
  const metadata = rules.metadata 
    ? extractMetadata(content, rules.metadata)
    : {}
  
  const elapsed = Date.now() - startTime
  console.log(`[PROGRAMMATIC] ✅ Extração concluída em ${elapsed}ms`)
  console.log(`[PROGRAMMATIC] Total: ${articles.length} artigos`)
  
  return {
    ...metadata,
    artigos: articles,
  }
}

// ========================================
// EXTRATOR GENÉRICO (BASEADO EM REGRAS)
// ========================================

/**
 * Extrator genérico que aplica regras customizadas
 * Suporta scripts JavaScript personalizados
 */
export async function extractWithCustomScript(
  content: string,
  scriptCode: string
): Promise<Record<string, any>> {
  console.log('[PROGRAMMATIC] Executando script customizado...')
  
  try {
    // Criar função a partir do script
    const extractorFunction = new Function('content', scriptCode)
    const result = extractorFunction(content)
    
    console.log('[PROGRAMMATIC] Script executado com sucesso')
    return result
  } catch (error) {
    console.error('[PROGRAMMATIC] Erro ao executar script:', error)
    throw new Error(`Erro no script de extração: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }
}

// ========================================
// FUNÇÃO PRINCIPAL
// ========================================

/**
 * Extrai dados do documento usando APENAS programação
 * SEM IA - CUSTO $0
 */
export async function extractProgrammatically(
  documentId: string,
  templateId: string,
  onProgress?: (progress: number, message: string) => void
): Promise<{
  success: boolean
  data?: Record<string, any>
  error?: string
  executionTime?: number
}> {
  const startTime = Date.now()
  
  try {
    onProgress?.(10, 'Carregando documento...')
    
    // 1. Buscar documento
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1)
    
    if (!document) throw new Error('Documento não encontrado')
    
    // 2. Buscar template
    const [template] = await db
      .select()
      .from(normalizationTemplates)
      .where(eq(normalizationTemplates.id, templateId))
      .limit(1)
    
    if (!template) throw new Error('Template não encontrado')
    
    onProgress?.(20, 'Convertendo documento...')
    
    // 3. Converter documento para texto
    const filePath = join(process.cwd(), 'public', document.filePath)
    const conversionResult = await convertDocument(filePath)
    const content = conversionResult.markdown
    
    console.log(`[PROGRAMMATIC] Documento convertido: ${content.length} chars`)
    
    onProgress?.(40, 'Aplicando regras de extração...')
    
    // 4. Aplicar extração programática
    let extractedData: Record<string, any>
    
    if (template.scriptCode) {
      // Usar script customizado
      console.log('[PROGRAMMATIC] Usando script customizado')
      extractedData = await extractWithCustomScript(content, template.scriptCode)
    } else if (template.extractionRules) {
      // Usar regras do template
      console.log('[PROGRAMMATIC] Usando regras do template')
      const rules = template.extractionRules as ExtractionRules
      extractedData = await extractLegalDocumentProgrammatically(content, rules)
    } else {
      throw new Error('Template não possui regras de extração nem script')
    }
    
    onProgress?.(100, 'Extração concluída!')
    
    const executionTime = Date.now() - startTime
    console.log(`[PROGRAMMATIC] ✅ Total execution time: ${executionTime}ms`)
    console.log(`[PROGRAMMATIC] 💰 Custo: $0.00 (sem IA!)`)
    
    return {
      success: true,
      data: extractedData,
      executionTime,
    }
  } catch (error) {
    console.error('[PROGRAMMATIC] Erro na extração:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

