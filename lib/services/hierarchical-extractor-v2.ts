/**
 * Hierarchical Extractor V2
 * 
 * NOVA ABORDAGEM OTIMIZADA:
 * - OpenAI retorna apenas ESTRUTURA (metadados)
 * - Script local extrai TEXTO usando a estrutura
 * 
 * Benefícios:
 * - Mais barato (menos tokens)
 * - Mais rápido (respostas menores)
 * - Mais confiável (sem truncamento)
 * - Texto 100% fiel ao original
 */

import OpenAI from 'openai'
import { safeApiCall, validateArticleCount, estimateCost, GUARDRAILS } from './ai-guardrails'

export interface ArticleChunk {
  number: number
  label: string
  text: string
  startIndex: number
  endIndex: number
}

/**
 * ETAPA 1: OpenAI mapeia apenas a ESTRUTURA (não o texto)
 */
export async function mapArticleStructure(
  articleText: string,
  openai: OpenAI
): Promise<ArticleStructure> {
  const prompt = `
Analise o texto do artigo de lei e identifique APENAS a ESTRUTURA hierárquica.
NÃO copie o texto - apenas mapeie a organização.

IDENTIFIQUE:
- Se há parágrafos (e seus números)
- Se há incisos em cada parágrafo (e seus números romanos)
- Se há alíneas em cada inciso (e suas letras)

TEXTO DO ARTIGO:
${articleText}

FORMATO DE RESPOSTA (JSON COMPACTO):
{
  "tem_paragrafos": true,
  "paragrafos": [
    {
      "numero": "1",
      "tem_incisos": true,
      "incisos": [
        {
          "numero": "I",
          "tem_alineas": true,
          "alineas": ["a", "b", "c"]
        },
        {
          "numero": "II",
          "tem_alineas": false
        }
      ]
    },
    {
      "numero": "único",
      "tem_incisos": false
    }
  ]
}

REGRAS:
- Retorne APENAS a estrutura (números/flags)
- NÃO inclua texto
- Se não há parágrafos: "tem_paragrafos": false, "paragrafos": []
- JSON válido apenas
`.trim()

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'Você analisa estruturas de documentos jurídicos. Retorne apenas JSON válido.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.1,
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('OpenAI não retornou conteúdo')
  }

  return JSON.parse(content)
}

/**
 * ETAPA 2: Script local extrai TEXTO usando a estrutura mapeada
 */
export function extractTextFromStructure(
  articleText: string,
  structure: ArticleStructure
): ExtractedArticle {
  const lines = articleText.split('\n')
  const result: ExtractedArticle = {
    caput: '',
    paragrafos: [],
  }

  // Extrair CAPUT (texto antes do primeiro parágrafo)
  const firstParagraphMatch = articleText.match(/§\s*\d+[ºª°]?/)
  if (firstParagraphMatch) {
    const captutEnd = firstParagraphMatch.index!
    result.caput = articleText.substring(0, captutEnd).trim()
  } else {
    // Se não há parágrafos, todo o texto é o caput
    result.caput = articleText.trim()
  }

  // Extrair PARÁGRAFOS (se existirem)
  if (structure.tem_paragrafos && structure.paragrafos.length > 0) {
    for (let i = 0; i < structure.paragrafos.length; i++) {
      const paragrafoStruct = structure.paragrafos[i]
      const paragrafoNum = paragrafoStruct.numero

      // Regex para encontrar o parágrafo
      const paragrafoRegex = new RegExp(
        `§\\s*${paragrafoNum === 'único' ? 'único|Único' : paragrafoNum}[ºª°]?\\.?\\s*`,
        'i'
      )
      const paragrafoMatch = articleText.match(paragrafoRegex)

      if (!paragrafoMatch) continue

      const startPos = paragrafoMatch.index! + paragrafoMatch[0].length

      // Encontrar onde o parágrafo termina (próximo parágrafo ou fim do texto)
      const nextParagrafo = structure.paragrafos[i + 1]
      let endPos = articleText.length

      if (nextParagrafo) {
        const nextRegex = new RegExp(
          `§\\s*${nextParagrafo.numero === 'único' ? 'único|Único' : nextParagrafo.numero}[ºª°]?\\.?\\s*`,
          'i'
        )
        const nextMatch = articleText.match(nextRegex)
        if (nextMatch && nextMatch.index! > startPos) {
          endPos = nextMatch.index!
        }
      }

      const paragrafoTexto = articleText.substring(startPos, endPos).trim()

      const paragrafo: ExtractedParagrafo = {
        numero: paragrafoNum,
        texto: '',
        incisos: [],
      }

      // Se tem incisos, extrair separadamente
      if (paragrafoStruct.tem_incisos && paragrafoStruct.incisos.length > 0) {
        const firstIncisoMatch = paragrafoTexto.match(/[IVX]+\s*[-–—]\s*/)
        if (firstIncisoMatch) {
          paragrafo.texto = paragrafoTexto.substring(0, firstIncisoMatch.index!).trim()

          // Extrair cada inciso
          for (let j = 0; j < paragrafoStruct.incisos.length; j++) {
            const incisoStruct = paragrafoStruct.incisos[j]
            const incisoNum = incisoStruct.numero

            const incisoRegex = new RegExp(`${incisoNum}\\s*[-–—]\\s*`, 'g')
            const incisoMatch = paragrafoTexto.match(incisoRegex)

            if (!incisoMatch) continue

            const incisoStartPos = paragrafoTexto.indexOf(incisoMatch[0]) + incisoMatch[0].length

            // Encontrar fim do inciso
            const nextInciso = paragrafoStruct.incisos[j + 1]
            let incisoEndPos = paragrafoTexto.length

            if (nextInciso) {
              const nextIncisoRegex = new RegExp(`${nextInciso.numero}\\s*[-–—]\\s*`)
              const nextIncisoMatch = paragrafoTexto.match(nextIncisoRegex)
              if (nextIncisoMatch && nextIncisoMatch.index! > incisoStartPos) {
                incisoEndPos = nextIncisoMatch.index!
              }
            }

            const incisoTexto = paragrafoTexto.substring(incisoStartPos, incisoEndPos).trim()

            const inciso: ExtractedInciso = {
              numero: incisoNum,
              texto: incisoTexto,
              alineas: [],
            }

            // Extrair alíneas se existirem
            if (incisoStruct.tem_alineas && incisoStruct.alineas.length > 0) {
              for (const alineaLetra of incisoStruct.alineas) {
                const alineaRegex = new RegExp(`${alineaLetra}\\)\\s*`, 'i')
                const alineaMatch = incisoTexto.match(alineaRegex)

                if (alineaMatch) {
                  const alineaStartPos = alineaMatch.index! + alineaMatch[0].length

                  // Encontrar fim da alínea (próxima alínea ou fim do inciso)
                  const alineaIndex = incisoStruct.alineas.indexOf(alineaLetra)
                  const nextAlinea = incisoStruct.alineas[alineaIndex + 1]
                  let alineaEndPos = incisoTexto.length

                  if (nextAlinea) {
                    const nextAlineaRegex = new RegExp(`${nextAlinea}\\)\\s*`, 'i')
                    const nextAlineaMatch = incisoTexto.match(nextAlineaRegex)
                    if (nextAlineaMatch && nextAlineaMatch.index! > alineaStartPos) {
                      alineaEndPos = nextAlineaMatch.index!
                    }
                  }

                  const alineaTexto = incisoTexto.substring(alineaStartPos, alineaEndPos).trim()

                  inciso.alineas.push({
                    letra: alineaLetra,
                    texto: alineaTexto,
                  })
                }
              }
            }

            paragrafo.incisos.push(inciso)
          }
        } else {
          paragrafo.texto = paragrafoTexto
        }
      } else {
        paragrafo.texto = paragrafoTexto
      }

      result.paragrafos.push(paragrafo)
    }
  }

  return result
}

/**
 * Processar batch de artigos com nova abordagem
 * COM GUARDRAILS para evitar custos excessivos
 */
export async function processArticleBatch(
  chunks: ArticleChunk[],
  openai: OpenAI,
  documentId: string,
  onProgress?: (current: number, total: number, message: string) => void
): Promise<any[]> {
  // GUARDRAIL 0: MODO DE TESTE - Limitar artigos
  let processChunks = chunks
  if (GUARDRAILS.TEST_MODE_MAX_ARTICLES !== null && chunks.length > GUARDRAILS.TEST_MODE_MAX_ARTICLES) {
    console.warn(`🚨 [GUARDRAIL] MODO DE TESTE: Processando apenas ${GUARDRAILS.TEST_MODE_MAX_ARTICLES} artigos de ${chunks.length}`)
    processChunks = chunks.slice(0, GUARDRAILS.TEST_MODE_MAX_ARTICLES)
  }
  
  // GUARDRAIL 1: Validar número de artigos
  const validation = validateArticleCount(processChunks.length)
  if (!validation.valid) {
    throw new Error(`[GUARDRAIL] ${validation.reason}`)
  }
  
  if (validation.warning) {
    console.warn(`[GUARDRAIL] ${validation.warning}`)
  }
  
  // GUARDRAIL 2: Estimar custo total
  const estimatedInputTokensPerArticle = 1500 // Média estimada
  const totalEstimatedCost = processChunks.length * estimateCost(estimatedInputTokensPerArticle, 300)
  console.log(`[GUARDRAIL] 💰 Custo estimado total: $${totalEstimatedCost.toFixed(4)}`)
  
  if (totalEstimatedCost > GUARDRAILS.MAX_COST_PER_DOCUMENT) {
    throw new Error(
      `[GUARDRAIL] Custo estimado ($${totalEstimatedCost.toFixed(2)}) excede limite de $${GUARDRAILS.MAX_COST_PER_DOCUMENT}`
    )
  }
  
  const allArticles: any[] = []

  console.log(`[EXTRACTOR_V2] Processando ${processChunks.length} artigos...`)

  for (let i = 0; i < processChunks.length; i++) {
    const chunk = processChunks[i]

    onProgress?.(i + 1, processChunks.length, `Processando Art. ${chunk.number}...`)

    try {
      console.log(`[EXTRACTOR_V2] Art. ${chunk.number}: Mapeando estrutura...`)

      // ETAPA 1: OpenAI retorna apenas estrutura (COM GUARDRAIL)
      const estimatedTokens = Math.ceil(chunk.text.length / 4) // Aproximação: 1 token = 4 chars
      const structure = await safeApiCall(
        documentId,
        () => mapArticleStructure(chunk.text, openai),
        estimatedTokens
      )

      console.log(`[EXTRACTOR_V2] Art. ${chunk.number}: Estrutura mapeada -`, {
        tem_paragrafos: structure.tem_paragrafos,
        qtd_paragrafos: structure.paragrafos.length,
      })

      // ETAPA 2: Script local extrai texto usando estrutura
      const extractedData = extractTextFromStructure(chunk.text, structure)

      console.log(`[EXTRACTOR_V2] Art. ${chunk.number}: Texto extraído`)

      allArticles.push({
        numero: chunk.number,
        caput: extractedData.caput,
        paragrafos: extractedData.paragrafos,
      })
    } catch (error) {
      console.error(`[EXTRACTOR_V2] ❌ Erro no Art. ${chunk.number}:`, error)
      // Adicionar artigo com estrutura mínima para não perder a sequência
      allArticles.push({
        numero: chunk.number,
        caput: chunk.text.trim(),
        paragrafos: [],
      })
    }
  }

  console.log(`[EXTRACTOR_V2] ✅ Processamento concluído! ${allArticles.length} artigos`)
  return allArticles
}

// Interfaces
export interface ArticleStructure {
  tem_paragrafos: boolean
  paragrafos: ParagrafoStructure[]
}

export interface ParagrafoStructure {
  numero: string
  tem_incisos: boolean
  incisos: IncisoStructure[]
}

export interface IncisoStructure {
  numero: string
  tem_alineas: boolean
  alineas: string[]
}

export interface ExtractedArticle {
  caput: string
  paragrafos: ExtractedParagrafo[]
}

export interface ExtractedParagrafo {
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

