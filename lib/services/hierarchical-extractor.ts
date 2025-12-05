/**
 * Hierarchical Extractor
 * 
 * Serviço especializado para extração de estruturas hierárquicas
 * de documentos jurídicos (leis, decretos, portarias, etc)
 */

import OpenAI from 'openai'

/**
 * Detecta se um documento é jurídico baseado no conteúdo
 */
export function isLegalDocument(content: string): boolean {
  const legalPatterns = [
    /Lei\s+n[ºª°]?\s*\d+/i,
    /Decreto\s+n[ºª°]?\s*\d+/i,
    /Portaria\s+n[ºª°]?\s*\d+/i,
    /Medida\s+Provisória/i,
    /Art\.\s*\d+[ºª°]?/i,
    /Artigo\s+\d+/i,
  ]
  
  return legalPatterns.some(pattern => pattern.test(content.substring(0, 2000)))
}

/**
 * Extrai chunks de artigos de um documento jurídico
 */
export function extractArticleChunks(content: string): ArticleChunk[] {
  // Padrão para identificar APENAS artigos verdadeiros (início de linha ou após quebra significativa)
  // (?:^|\n\s*) = início da linha ou nova linha com espaços
  // Art\.\s*(\d+)[ºª°]?\s* = Art. seguido do número
  const articlePattern = /(?:^|\n\s*)Art\.\s*(\d+)[ºª°]?\.?\s*/gim
  const matches = [...content.matchAll(articlePattern)]
  
  if (matches.length === 0) {
    console.log('[EXTRACT_CHUNKS] Nenhum artigo encontrado!')
    return []
  }
  
  console.log(`[EXTRACT_CHUNKS] Encontrados ${matches.length} artigos potenciais`)
  
  const chunks: ArticleChunk[] = []
  const seenNumbers = new Set<number>()
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const articleNumber = parseInt(match[1])
    
    // Evitar duplicatas (mesmos artigos referenciados múltiplas vezes)
    if (seenNumbers.has(articleNumber)) {
      continue
    }
    seenNumbers.add(articleNumber)
    
    const start = match.index! + match[0].indexOf('Art.')
    const end = matches[i + 1]?.index || content.length
    const text = content.substring(start, end).trim()
    
    // Validar que o texto tem um tamanho mínimo (evitar falsos positivos)
    if (text.length < 20) {
      continue
    }
    
    chunks.push({
      number: articleNumber,
      label: `Art. ${articleNumber}º`,
      text,
      startIndex: start,
      endIndex: end,
    })
  }
  
  console.log(`[EXTRACT_CHUNKS] Chunks válidos após filtragem: ${chunks.length}`)
  
  return chunks.sort((a, b) => a.number - b.number)
}

export interface ArticleChunk {
  number: number
  label: string
  text: string
  startIndex: number
  endIndex: number
}

/**
 * Gera prompt especializado para extração de leis
 */
export function generateLegalDocumentPrompt(
  documentChunk: string,
  extractAll: boolean = true
): string {
  return `
Você é um especialista em análise de documentos jurídicos brasileiros.

TAREFA:
Extraia a estrutura hierárquica completa do documento de lei fornecido.

ESTRUTURA HIERÁRQUICA A SEGUIR:
1. ARTIGO (nível 1)
   - numero: número do artigo
   - caput: texto principal do artigo (antes dos parágrafos)
   - paragrafos: array de parágrafos (se existirem)

2. PARÁGRAFO (nível 2)
   - numero: número do parágrafo (1, 2, 3... ou "único")
   - texto: texto do parágrafo
   - incisos: array de incisos (se existirem)

3. INCISO (nível 3)
   - numero: número romano (I, II, III...)
   - texto: texto do inciso
   - alineas: array de alíneas (se existirem)

4. ALÍNEA (nível 4)
   - letra: letra da alínea (a, b, c...)
   - texto: texto da alínea

${extractAll ? 'IMPORTANTE: Extraia TODOS os artigos do documento, não apenas os primeiros!' : ''}

DOCUMENTO:
${documentChunk}

FORMATO DE RESPOSTA (JSON):
{
  "artigos": [
    {
      "numero": 1,
      "caput": "texto do caput do artigo 1",
      "paragrafos": [
        {
          "numero": 1,
          "texto": "texto do parágrafo 1",
          "incisos": [
            {
              "numero": "I",
              "texto": "texto do inciso I",
              "alineas": [
                {
                  "letra": "a",
                  "texto": "texto da alínea a"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}

REGRAS:
1. Se um artigo não tem parágrafos, o campo "paragrafos" deve ser um array vazio []
2. Se um parágrafo não tem incisos, o campo "incisos" deve ser um array vazio []
3. Se um inciso não tem alíneas, o campo "alineas" deve ser um array vazio []
4. Para parágrafo único, use numero: "único"
5. Preserve a numeração exata (romana para incisos, letras para alíneas)
6. Retorne APENAS JSON válido, sem explicações adicionais
`.trim()
}

/**
 * Extrai artigos em batches para documentos grandes
 */
export async function extractArticlesInBatches(
  chunks: ArticleChunk[],
  openai: OpenAI,
  onProgress?: (current: number, total: number, message: string) => void
): Promise<any[]> {
  const BATCH_SIZE = 10 // Processar 10 artigos por vez
  const allArticles: any[] = []
  
  console.log(`[EXTRACT_BATCHES] Iniciando extração de ${chunks.length} artigos em batches de ${BATCH_SIZE}`)
  
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE)
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(chunks.length / BATCH_SIZE)
    
    console.log(`[EXTRACT_BATCHES] Processando batch ${batchNumber}/${totalBatches} (artigos ${i + 1}-${i + batch.length})`)
    
    onProgress?.(
      i + batch.length,
      chunks.length,
      `Extraindo artigos ${i + 1}-${i + batch.length} de ${chunks.length}...`
    )
    
    // Combinar artigos do batch em um único texto
    const batchText = batch.map(c => c.text).join('\n\n')
    console.log(`[EXTRACT_BATCHES] Tamanho do batch: ${batchText.length} chars`)
    
    try {
      console.log(`[EXTRACT_BATCHES] Chamando OpenAI para batch ${batchNumber}...`)
      const prompt = generateLegalDocumentPrompt(batchText, true)
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em análise de documentos jurídicos brasileiros. Sempre retorne JSON válido.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      })
      
      console.log(`[EXTRACT_BATCHES] OpenAI respondeu para batch ${batchNumber}`)
      
      const content = response.choices[0]?.message?.content
      if (!content) {
        console.warn(`[EXTRACT_BATCHES] Batch ${batchNumber}/${totalBatches}: OpenAI não retornou conteúdo`)
        continue
      }
      
      console.log(`[EXTRACT_BATCHES] Conteúdo recebido (${content.length} chars):`, content.substring(0, 200))
      
      // Tentar fazer parse do JSON com validação
      let result: any
      try {
        result = JSON.parse(content)
      } catch (parseError) {
        console.error(`[EXTRACT_BATCHES] ❌ Erro ao fazer parse do JSON do batch ${batchNumber}:`, parseError)
        console.error(`[EXTRACT_BATCHES] Conteúdo completo:`, content)
        console.warn(`[EXTRACT_BATCHES] Pulando batch ${batchNumber} devido a erro de parse`)
        continue
      }
      
      console.log(`[EXTRACT_BATCHES] Batch ${batchNumber}: Extraídos ${result.artigos?.length || 0} artigos`)
      
      if (result.artigos && Array.isArray(result.artigos)) {
        allArticles.push(...result.artigos)
      } else {
        console.warn(`[EXTRACT_BATCHES] Batch ${batchNumber}: Resposta não contém array 'artigos'`)
      }
    } catch (error) {
      console.error(`[EXTRACT_BATCHES] ❌ Erro no batch ${batchNumber}/${totalBatches}:`, error)
      // Continuar com próximo batch mesmo se este falhar
    }
  }
  
  console.log(`[EXTRACT_BATCHES] ✅ Extração concluída! Total de artigos: ${allArticles.length}`)
  return allArticles
}

/**
 * Divide conteúdo genérico em chunks respeitando limite de tokens
 */
export function splitIntoChunks(content: string, maxChunkSize: number = 40000): string[] {
  const chunks: string[] = []
  let currentChunk = ''
  const lines = content.split('\n')
  
  for (const line of lines) {
    if ((currentChunk + line).length > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim())
      }
      currentChunk = line
    } else {
      currentChunk += '\n' + line
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }
  
  return chunks
}

/**
 * Calcula score de confiança para dados hierárquicos
 */
export function calculateHierarchicalConfidence(extractedData: any, expectedFields: string[]): number {
  if (!extractedData || typeof extractedData !== 'object') {
    return 0
  }
  
  let totalFields = 0
  let filledFields = 0
  
  // Para arrays de artigos
  if (Array.isArray(extractedData.artigos)) {
    extractedData.artigos.forEach((artigo: any) => {
      // Artigo deve ter número e caput
      totalFields += 2
      if (artigo.numero) filledFields++
      if (artigo.caput && artigo.caput.length > 10) filledFields++
      
      // Contar parágrafos se existirem
      if (Array.isArray(artigo.paragrafos)) {
        artigo.paragrafos.forEach((paragrafo: any) => {
          totalFields += 2
          if (paragrafo.numero) filledFields++
          if (paragrafo.texto && paragrafo.texto.length > 10) filledFields++
        })
      }
    })
  }
  
  // Para outros campos esperados
  expectedFields.forEach(field => {
    totalFields++
    const value = extractedData[field]
    if (value !== null && value !== undefined && value !== '' && 
        !(Array.isArray(value) && value.length === 0)) {
      filledFields++
    }
  })
  
  return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0
}

