import { estimateTokensApproximate } from '../utils/token-estimation'

/**
 * Calcula tokens disponíveis para o conteúdo do documento
 * Considera system prompt, user prompt e margem para output
 */
export function calculateAvailableTokens(
  maxInputTokens: number,
  systemPromptTokens: number,
  userPromptTokens: number,
  outputMargin: number = 2000
): number {
  const reservedTokens = systemPromptTokens + userPromptTokens + outputMargin
  const available = maxInputTokens - reservedTokens

  // Garante que há pelo menos alguns tokens disponíveis
  return Math.max(available, 1000)
}

/**
 * Decide se deve usar extração de conteúdo ou truncamento direto
 */
export function shouldUseExtraction(fullDocTokens: number, availableTokens: number): boolean {
  // Se o documento é muito maior que o disponível, usa extração
  // Extração é mais eficiente quando há muita redução possível
  return fullDocTokens > availableTokens * 1.5
}

/**
 * Trunca markdown de forma inteligente, mantendo início e fim
 */
export function truncateMarkdown(markdown: string, maxTokens: number): string {
  const estimatedTokens = estimateTokensApproximate(markdown)

  if (estimatedTokens <= maxTokens) {
    return markdown
  }

  // Calcula quantos caracteres podemos manter
  const maxChars = maxTokens * 4
  const halfChars = Math.floor(maxChars / 2)

  // Mantém início e fim, removendo o meio
  const start = markdown.substring(0, halfChars)
  const end = markdown.substring(markdown.length - halfChars)

  // Tenta encontrar um ponto de quebra natural (fim de parágrafo)
  const lastNewlineInStart = start.lastIndexOf('\n\n')
  const firstNewlineInEnd = end.indexOf('\n\n')

  const truncatedStart = lastNewlineInStart > 0 ? markdown.substring(0, lastNewlineInStart) : start

  const truncatedEnd =
    firstNewlineInEnd > 0
      ? markdown.substring(markdown.length - halfChars + firstNewlineInEnd)
      : end

  return `${truncatedStart}\n\n[... conteúdo truncado por tamanho ...]\n\n${truncatedEnd}`
}

