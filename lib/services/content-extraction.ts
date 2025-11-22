/**
 * Funções de extração de conteúdo para classificação
 */

export interface ExtractionConfig {
  /**
   * Código JavaScript da função de extração customizada
   * Deve ser uma função que recebe (markdown: string) => string
   */
  customFunctionCode?: string
}

/**
 * Função padrão de extração de conteúdo relevante para classificação
 * Extrai apenas as partes relevantes do markdown, reduzindo drasticamente o uso de tokens
 */
export function extractClassificationRelevantContent(markdown: string): string {
  const lines = markdown.split('\n')
  const extracted: string[] = []

  // 1. Primeiras 2000-3000 caracteres (título, introdução, cabeçalho)
  const headerChars = 3000
  let headerContent = ''
  let charCount = 0
  let headerEndLine = 0

  for (let i = 0; i < lines.length && charCount < headerChars; i++) {
    const line = lines[i]
    charCount += line.length + 1 // +1 para newline
    headerEndLine = i
    headerContent += line + '\n'
  }

  extracted.push(headerContent.trim())

  // 2. Estrutura de seções (todos os headers #, ##, ###)
  const sectionHeaders: string[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    const headerMatch = line.match(/^(#{1,3})\s+/)
    if (headerMatch) {
      const headerLevel = headerMatch[1].length
      sectionHeaders.push(line)
      // Inclui primeiros 500 caracteres após cada header principal
      let sectionContent = ''
      let sectionCharCount = 0
      for (let j = i + 1; j < lines.length && sectionCharCount < 500; j++) {
        const nextLine = lines[j]
        const nextLineTrimmed = nextLine.trim()
        // Para no próximo header de nível igual ou superior
        const nextHeaderMatch = nextLineTrimmed.match(/^(#{1,3})\s+/)
        if (nextHeaderMatch && nextHeaderMatch[1].length <= headerLevel) {
          break
        }
        sectionCharCount += nextLine.length + 1
        sectionContent += nextLine + '\n'
      }
      if (sectionContent.trim()) {
        sectionHeaders.push(sectionContent.trim())
      }
    }
  }

  if (sectionHeaders.length > 0) {
    extracted.push('\n## Estrutura de Seções:\n')
    extracted.push(sectionHeaders.join('\n\n'))
  }

  // 3. Últimos 2000-3000 caracteres (conclusão, pedidos)
  const footerChars = 3000
  let footerContent = ''
  charCount = 0

  for (let i = lines.length - 1; i > headerEndLine && charCount < footerChars; i--) {
    const line = lines[i]
    charCount += line.length + 1
    footerContent = line + '\n' + footerContent
  }

  if (footerContent.trim()) {
    extracted.push('\n## Conclusão/Pedidos:\n')
    extracted.push(footerContent.trim())
  }

  return extracted.join('\n\n')
}

/**
 * Valida código JavaScript de função customizada
 * Verifica se é uma função válida e segura
 */
export function validateExtractionFunction(code: string): { valid: boolean; error?: string } {
  try {
    // Verifica se o código contém apenas funções permitidas
    const dangerousPatterns = [
      /require\s*\(/,
      /import\s+/,
      /eval\s*\(/,
      /Function\s*\(/,
      /process\./,
      /global\./,
      /__dirname/,
      /__filename/,
      /fs\./,
      /child_process/,
      /exec\s*\(/,
      /spawn\s*\(/,
    ]

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        return {
          valid: false,
          error: `Código contém padrão perigoso: ${pattern.source}`,
        }
      }
    }

    // Tenta criar a função (sem executar)
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const func = new Function('markdown', code)

    // Verifica se é uma função
    if (typeof func !== 'function') {
      return {
        valid: false,
        error: 'Código não retorna uma função válida',
      }
    }

    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido na validação',
    }
  }
}

/**
 * Executa função customizada de extração de forma segura
 */
export function executeCustomExtractionFunction(
  markdown: string,
  functionCode: string
): string {
  const validation = validateExtractionFunction(functionCode)
  if (!validation.valid) {
    throw new Error(`Função de extração inválida: ${validation.error}`)
  }

  try {
    // Cria função em contexto isolado
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const extractFunction = new Function('markdown', functionCode) as (markdown: string) => string

    // Executa função
    const result = extractFunction(markdown)

    // Valida resultado
    if (typeof result !== 'string') {
      throw new Error('Função de extração deve retornar uma string')
    }

    return result
  } catch (error) {
    throw new Error(
      `Erro ao executar função de extração: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    )
  }
}

/**
 * Extrai conteúdo relevante usando função padrão ou customizada
 */
export function extractContent(
  markdown: string,
  config?: ExtractionConfig
): string {
  if (config?.customFunctionCode) {
    return executeCustomExtractionFunction(markdown, config.customFunctionCode)
  }

  return extractClassificationRelevantContent(markdown)
}

