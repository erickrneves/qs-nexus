import { encoding_for_model } from 'tiktoken'
import {
  ChartOfAccount,
  AccountBalance,
  JournalEntry,
  JournalItem,
  SpedFile,
} from '@/lib/db/schema/sped'
import { generateAccountMarkdown } from './sped-parser'

// ================================================================
// Tipos e Interfaces
// ================================================================

export interface AccountingChunk {
  content: string
  section?: string
  role?: AccountingRole
  chunkIndex: number
  metadata: AccountingChunkMetadata
}

export interface AccountingChunkMetadata {
  type: 'account' | 'balance_summary' | 'entry_batch' | 'financial_statement'
  accountCode?: string
  accountName?: string
  accountNature?: string
  periodStart?: string
  periodEnd?: string
  cnpj?: string
  companyName?: string
}

export type AccountingRole =
  | 'ativo_circulante'
  | 'ativo_nao_circulante'
  | 'passivo_circulante'
  | 'passivo_nao_circulante'
  | 'patrimonio_liquido'
  | 'receita_operacional'
  | 'receita_financeira'
  | 'despesa_operacional'
  | 'despesa_financeira'
  | 'resultado'
  | 'resumo'
  | 'outro'

// Limite de segurança para chunks (abaixo do limite de 8192 do modelo)
const MAX_TOKENS_PER_CHUNK = 8000
const DEFAULT_MAX_TOKENS = 800

// Encoder para text-embedding-3-small (usa cl100k_base)
const encoder = encoding_for_model('text-embedding-3-small')

// ================================================================
// Chunking por Contas Contábeis
// ================================================================

/**
 * Gera chunks inteligentes agrupados por conta contábil
 */
export function chunkByAccounts(
  accounts: ChartOfAccount[],
  balances: AccountBalance[],
  entries: JournalEntry[],
  items: JournalItem[],
  spedFile: SpedFile,
  maxTokens: number = DEFAULT_MAX_TOKENS
): AccountingChunk[] {
  const chunks: AccountingChunk[] = []

  // Mapear saldos e lançamentos por código de conta
  const balancesByAccount = new Map<string, AccountBalance>()
  for (const balance of balances) {
    balancesByAccount.set(balance.accountCode, balance)
  }

  const entriesByAccount = new Map<string, JournalEntry[]>()
  for (const item of items) {
    const entry = entries.find(e => e.id === item.journalEntryId)
    if (entry) {
      const list = entriesByAccount.get(item.accountCode) || []
      list.push(entry)
      entriesByAccount.set(item.accountCode, list)
    }
  }

  // Processar cada conta analítica (movimentável)
  const analyticAccounts = accounts.filter(a => a.accountType === 'A')

  for (const account of analyticAccounts) {
    const balance = balancesByAccount.get(account.accountCode)
    const accountEntries = entriesByAccount.get(account.accountCode) || []

    // Gerar markdown para a conta
    const markdown = generateAccountMarkdown(account, balance, accountEntries)

    // Verificar se cabe em um chunk
    const tokenCount = countTokens(markdown)

    if (tokenCount <= maxTokens) {
      chunks.push({
        content: markdown,
        section: `Conta ${account.accountCode}`,
        role: inferAccountingRole(account),
        chunkIndex: chunks.length,
        metadata: {
          type: 'account',
          accountCode: account.accountCode,
          accountName: account.accountName,
          accountNature: account.accountNature || undefined,
          periodStart: spedFile.periodStart,
          periodEnd: spedFile.periodEnd,
          cnpj: spedFile.cnpj,
          companyName: spedFile.companyName,
        },
      })
    } else {
      // Dividir em chunks menores
      const subChunks = splitAccountChunk(
        account,
        balance,
        accountEntries,
        maxTokens,
        spedFile
      )
      chunks.push(...subChunks.map((c, i) => ({ ...c, chunkIndex: chunks.length + i })))
    }
  }

  // Adicionar chunk de resumo do plano de contas
  const summaryChunk = generateChartSummaryChunk(accounts, spedFile)
  if (summaryChunk) {
    chunks.push({ ...summaryChunk, chunkIndex: chunks.length })
  }

  // Adicionar chunk de demonstração de resultados
  const demoResultChunk = generateDemoResultChunk(accounts, balances, spedFile)
  if (demoResultChunk) {
    chunks.push({ ...demoResultChunk, chunkIndex: chunks.length })
  }

  // Validar e dividir chunks que excedem o limite
  return validateAndSplitChunks(chunks, Math.min(maxTokens, MAX_TOKENS_PER_CHUNK))
}

// ================================================================
// Funções de Geração de Chunks Específicos
// ================================================================

/**
 * Divide conta em chunks menores quando excede limite
 */
function splitAccountChunk(
  account: ChartOfAccount,
  balance: AccountBalance | undefined,
  entries: JournalEntry[],
  maxTokens: number,
  spedFile: SpedFile
): AccountingChunk[] {
  const chunks: AccountingChunk[] = []
  const baseMetadata: AccountingChunkMetadata = {
    type: 'account',
    accountCode: account.accountCode,
    accountName: account.accountName,
    accountNature: account.accountNature || undefined,
    periodStart: spedFile.periodStart,
    periodEnd: spedFile.periodEnd,
    cnpj: spedFile.cnpj,
    companyName: spedFile.companyName,
  }

  // Chunk 1: Informações da conta + saldos
  let headerMarkdown = `## Conta: ${account.accountCode} - ${account.accountName}\n\n`
  headerMarkdown += `**Tipo:** ${account.accountType === 'S' ? 'Sintética' : 'Analítica'}\n`
  headerMarkdown += `**Nível:** ${account.accountLevel}\n`
  headerMarkdown += `**Natureza:** ${formatNature(account.accountNature)}\n\n`

  if (balance) {
    headerMarkdown += `### Saldos do Período\n`
    headerMarkdown += `- Saldo Inicial: R$ ${formatCurrency(balance.initialBalance)}\n`
    headerMarkdown += `- Total Débitos: R$ ${formatCurrency(balance.debitTotal)}\n`
    headerMarkdown += `- Total Créditos: R$ ${formatCurrency(balance.creditTotal)}\n`
    headerMarkdown += `- Saldo Final: R$ ${formatCurrency(balance.finalBalance)}\n`
  }

  chunks.push({
    content: headerMarkdown,
    section: `Conta ${account.accountCode} - Info`,
    role: inferAccountingRole(account),
    chunkIndex: 0,
    metadata: baseMetadata,
  })

  // Chunks de lançamentos em batches
  if (entries.length > 0) {
    const entriesPerChunk = 50 // ~50 lançamentos por chunk
    const entryBatches = []

    for (let i = 0; i < entries.length; i += entriesPerChunk) {
      entryBatches.push(entries.slice(i, i + entriesPerChunk))
    }

    entryBatches.forEach((batch, batchIndex) => {
      let batchMarkdown = `## Conta ${account.accountCode} - Lançamentos (Parte ${batchIndex + 1}/${entryBatches.length})\n\n`

      for (const entry of batch) {
        batchMarkdown += `- **${entry.entryDate}** | R$ ${formatCurrency(entry.entryAmount)}`
        if (entry.description) {
          batchMarkdown += ` | ${entry.description}`
        }
        batchMarkdown += '\n'
      }

      chunks.push({
        content: batchMarkdown,
        section: `Conta ${account.accountCode} - Lançamentos ${batchIndex + 1}`,
        role: inferAccountingRole(account),
        chunkIndex: 0,
        metadata: {
          ...baseMetadata,
          type: 'entry_batch',
        },
      })
    })
  }

  return chunks
}

/**
 * Gera chunk de resumo do plano de contas
 */
function generateChartSummaryChunk(
  accounts: ChartOfAccount[],
  spedFile: SpedFile
): AccountingChunk | null {
  const syntheticAccounts = accounts.filter(a => a.accountType === 'S' && a.accountLevel <= 2)

  if (syntheticAccounts.length === 0) return null

  let markdown = `# Estrutura do Plano de Contas\n\n`
  markdown += `**Empresa:** ${spedFile.companyName}\n`
  markdown += `**CNPJ:** ${formatCnpj(spedFile.cnpj)}\n`
  markdown += `**Período:** ${spedFile.periodStart} a ${spedFile.periodEnd}\n\n`

  markdown += `## Grupos Principais\n\n`

  // Agrupar por natureza
  const byNature = new Map<string, ChartOfAccount[]>()
  for (const acc of syntheticAccounts) {
    const nature = acc.accountNature || 'outro'
    const list = byNature.get(nature) || []
    list.push(acc)
    byNature.set(nature, list)
  }

  for (const [nature, accs] of byNature) {
    markdown += `### ${formatNature(nature)}\n\n`
    for (const acc of accs) {
      const indent = '  '.repeat(acc.accountLevel - 1)
      markdown += `${indent}- **${acc.accountCode}** ${acc.accountName}\n`
    }
    markdown += '\n'
  }

  return {
    content: markdown,
    section: 'Estrutura do Plano de Contas',
    role: 'resumo',
    chunkIndex: 0,
    metadata: {
      type: 'financial_statement',
      cnpj: spedFile.cnpj,
      companyName: spedFile.companyName,
      periodStart: spedFile.periodStart,
      periodEnd: spedFile.periodEnd,
    },
  }
}

/**
 * Gera chunk de demonstração de resultado (DRE simplificada)
 */
function generateDemoResultChunk(
  accounts: ChartOfAccount[],
  balances: AccountBalance[],
  spedFile: SpedFile
): AccountingChunk | null {
  // Filtrar contas de resultado
  const resultAccounts = accounts.filter(
    a =>
      a.accountNature === 'receita' ||
      a.accountNature === 'despesa' ||
      a.accountNature === 'resultado'
  )

  if (resultAccounts.length === 0) return null

  // Mapear saldos
  const balanceMap = new Map<string, AccountBalance>()
  for (const b of balances) {
    balanceMap.set(b.accountCode, b)
  }

  let markdown = `# Demonstração do Resultado (DRE) - Resumo\n\n`
  markdown += `**Empresa:** ${spedFile.companyName}\n`
  markdown += `**Período:** ${spedFile.periodStart} a ${spedFile.periodEnd}\n\n`

  // Totalizar por natureza
  let totalReceitas = 0
  let totalDespesas = 0

  for (const acc of resultAccounts) {
    if (acc.accountType !== 'A') continue

    const balance = balanceMap.get(acc.accountCode)
    if (!balance) continue

    const saldo = parseFloat(balance.finalBalance) || 0

    if (acc.accountNature === 'receita') {
      totalReceitas += saldo
    } else if (acc.accountNature === 'despesa') {
      totalDespesas += saldo
    }
  }

  markdown += `## Resumo\n\n`
  markdown += `| Descrição | Valor |\n`
  markdown += `|-----------|-------|\n`
  markdown += `| Total Receitas | R$ ${formatCurrency(totalReceitas)} |\n`
  markdown += `| Total Despesas | R$ ${formatCurrency(totalDespesas)} |\n`
  markdown += `| **Resultado** | **R$ ${formatCurrency(totalReceitas - totalDespesas)}** |\n\n`

  // Detalhamento de receitas
  markdown += `## Receitas\n\n`
  for (const acc of resultAccounts.filter(a => a.accountNature === 'receita' && a.accountType === 'A')) {
    const balance = balanceMap.get(acc.accountCode)
    if (balance) {
      markdown += `- ${acc.accountCode} ${acc.accountName}: R$ ${formatCurrency(balance.finalBalance)}\n`
    }
  }

  // Detalhamento de despesas
  markdown += `\n## Despesas\n\n`
  for (const acc of resultAccounts.filter(a => a.accountNature === 'despesa' && a.accountType === 'A')) {
    const balance = balanceMap.get(acc.accountCode)
    if (balance) {
      markdown += `- ${acc.accountCode} ${acc.accountName}: R$ ${formatCurrency(balance.finalBalance)}\n`
    }
  }

  return {
    content: markdown,
    section: 'Demonstração do Resultado',
    role: 'resultado',
    chunkIndex: 0,
    metadata: {
      type: 'financial_statement',
      cnpj: spedFile.cnpj,
      companyName: spedFile.companyName,
      periodStart: spedFile.periodStart,
      periodEnd: spedFile.periodEnd,
    },
  }
}

// ================================================================
// Funções de Inferência de Role
// ================================================================

/**
 * Infere o role contábil baseado na conta
 */
function inferAccountingRole(account: ChartOfAccount): AccountingRole {
  const nature = account.accountNature
  const code = account.accountCode

  // Baseado no código da conta (padrão ECD)
  if (code.startsWith('1')) {
    // Ativo
    if (code.startsWith('1.01') || code.startsWith('11')) {
      return 'ativo_circulante'
    }
    return 'ativo_nao_circulante'
  }

  if (code.startsWith('2')) {
    // Passivo
    if (code.startsWith('2.01') || code.startsWith('21')) {
      return 'passivo_circulante'
    }
    if (code.startsWith('2.02') || code.startsWith('22')) {
      return 'passivo_nao_circulante'
    }
    return 'patrimonio_liquido'
  }

  if (code.startsWith('3')) {
    return 'patrimonio_liquido'
  }

  if (code.startsWith('4') || nature === 'receita') {
    // Verificar se é financeira
    const name = account.accountName.toLowerCase()
    if (name.includes('financ') || name.includes('juro') || name.includes('rend')) {
      return 'receita_financeira'
    }
    return 'receita_operacional'
  }

  if (code.startsWith('5') || nature === 'despesa') {
    const name = account.accountName.toLowerCase()
    if (name.includes('financ') || name.includes('juro') || name.includes('tari')) {
      return 'despesa_financeira'
    }
    return 'despesa_operacional'
  }

  if (code.startsWith('6') || nature === 'resultado') {
    return 'resultado'
  }

  return 'outro'
}

// ================================================================
// Funções Utilitárias
// ================================================================

/**
 * Conta tokens usando tiktoken
 */
function countTokens(text: string): number {
  try {
    return encoder.encode(text).length
  } catch (error) {
    console.warn('Erro ao contar tokens:', error)
    return Math.ceil(text.length / 4)
  }
}

/**
 * Valida e divide chunks que excedem limite
 */
function validateAndSplitChunks(
  chunks: AccountingChunk[],
  maxTokens: number
): AccountingChunk[] {
  const validated: AccountingChunk[] = []

  for (const chunk of chunks) {
    const tokenCount = countTokens(chunk.content)

    if (tokenCount <= maxTokens) {
      validated.push(chunk)
    } else {
      // Dividir por parágrafos
      const paragraphs = chunk.content.split(/\n\n+/)
      let current = ''
      let partIndex = 0

      for (const para of paragraphs) {
        const combined = current ? `${current}\n\n${para}` : para

        if (countTokens(combined) > maxTokens && current) {
          validated.push({
            ...chunk,
            content: current,
            section: `${chunk.section} (Parte ${partIndex + 1})`,
            chunkIndex: validated.length,
          })
          current = para
          partIndex++
        } else {
          current = combined
        }
      }

      if (current) {
        validated.push({
          ...chunk,
          content: current,
          section: partIndex > 0 ? `${chunk.section} (Parte ${partIndex + 1})` : chunk.section,
          chunkIndex: validated.length,
        })
      }
    }
  }

  return validated
}

/**
 * Formata natureza da conta
 */
function formatNature(nature: string | null | undefined): string {
  const map: Record<string, string> = {
    ativo: 'Ativo',
    passivo: 'Passivo',
    patrimonio_liquido: 'Patrimônio Líquido',
    receita: 'Receita',
    despesa: 'Despesa',
    resultado: 'Resultado',
  }
  return nature ? map[nature] || nature : 'Não classificado'
}

/**
 * Formata valor monetário
 */
function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/**
 * Formata CNPJ
 */
function formatCnpj(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '')
  if (cleaned.length !== 14) return cnpj

  return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12)}`
}

// ================================================================
// Exportações
// ================================================================

export { countTokens, formatNature, formatCurrency, formatCnpj, inferAccountingRole }

