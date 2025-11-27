import { readFileSync, createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'
import { createHash } from 'node:crypto'
import {
  SpedFile,
  ChartOfAccount,
  AccountBalance,
  JournalEntry,
  JournalItem,
  NewSpedFile,
  NewChartOfAccount,
  NewAccountBalance,
  NewJournalEntry,
  NewJournalItem,
} from '@/lib/db/schema/sped'

// ================================================================
// Tipos e Interfaces
// ================================================================

export interface SpedParseResult {
  file: Omit<NewSpedFile, 'id'>
  accounts: Omit<NewChartOfAccount, 'id' | 'spedFileId'>[]
  balances: Omit<NewAccountBalance, 'id' | 'spedFileId'>[]
  entries: Omit<NewJournalEntry, 'id' | 'spedFileId'>[]
  items: Map<string, Omit<NewJournalItem, 'id' | 'journalEntryId'>[]> // entryNumber -> items
  errors: SpedParseError[]
  stats: SpedParseStats
}

export interface SpedParseError {
  line: number
  record: string
  message: string
  raw: string
}

export interface SpedParseStats {
  totalLines: number
  processedRecords: number
  accounts: number
  balances: number
  entries: number
  items: number
  skippedRecords: number
  errors: number
}

// Mapa de natureza da conta baseado no primeiro dígito
const ACCOUNT_NATURE_MAP: Record<string, ChartOfAccount['accountNature']> = {
  '1': 'ativo',
  '2': 'passivo',
  '3': 'patrimonio_liquido',
  '4': 'receita',
  '5': 'despesa',
  '6': 'resultado',
}

// ================================================================
// Parser Principal
// ================================================================

/**
 * Parse de arquivo SPED completo
 * Suporta ECD (Escrituração Contábil Digital)
 */
export async function parseSpedFile(filePath: string): Promise<SpedParseResult> {
  const result: SpedParseResult = {
    file: {
      fileName: filePath.split('/').pop() || 'unknown',
      filePath,
      fileHash: '',
      fileType: 'ecd',
      cnpj: '',
      companyName: '',
      stateCode: null,
      cityCode: null,
      periodStart: new Date().toISOString().split('T')[0],
      periodEnd: new Date().toISOString().split('T')[0],
      status: 'processing',
      errorMessage: null,
      totalRecords: 0,
      processedRecords: 0,
    },
    accounts: [],
    balances: [],
    entries: [],
    items: new Map(),
    errors: [],
    stats: {
      totalLines: 0,
      processedRecords: 0,
      accounts: 0,
      balances: 0,
      entries: 0,
      items: 0,
      skippedRecords: 0,
      errors: 0,
    },
  }

  // Calcular hash do arquivo
  const fileBuffer = readFileSync(filePath)
  result.file.fileHash = createHash('sha256').update(fileBuffer).digest('hex')

  // Criar readline stream para processar linha por linha
  const fileStream = createReadStream(filePath, { encoding: 'latin1' })
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  })

  let lineNumber = 0
  let currentEntry: Omit<NewJournalEntry, 'id' | 'spedFileId'> | null = null

  for await (const line of rl) {
    lineNumber++
    result.stats.totalLines++

    // Pular linhas vazias
    if (!line.trim()) continue

    try {
      // Parse da linha SPED (formato: |REGISTRO|CAMPO1|CAMPO2|...|)
      const fields = parseLine(line)
      if (fields.length < 2) continue

      const recordType = fields[1]

      switch (recordType) {
        case '0000':
          parseRecord0000(fields, result)
          break

        case 'C040':
          // Identificação do livro - ignorar por enquanto
          break

        case 'C050':
          parseRecordC050(fields, result)
          break

        case 'C051':
          parseRecordC051(fields, result)
          break

        case 'C052':
          // Centro de custo - atualizar última conta
          parseRecordC052(fields, result)
          break

        case 'I150':
          // Saldos periódicos - header do período
          break

        case 'I155':
          parseRecordI155(fields, result)
          break

        case 'I200':
          currentEntry = parseRecordI200(fields, result)
          break

        case 'I250':
          if (currentEntry) {
            parseRecordI250(fields, result, currentEntry.entryNumber)
          }
          break

        default:
          // Registros não mapeados - contabilizar como skipped
          result.stats.skippedRecords++
      }

      result.stats.processedRecords++
    } catch (error) {
      result.errors.push({
        line: lineNumber,
        record: line.substring(0, 50),
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        raw: line,
      })
      result.stats.errors++
    }
  }

  // Atualizar estatísticas finais
  result.file.totalRecords = result.stats.totalLines
  result.file.processedRecords = result.stats.processedRecords
  result.file.status = result.stats.errors > 0 ? 'completed' : 'completed'

  return result
}

// ================================================================
// Parsers de Registros Específicos
// ================================================================

/**
 * Parse de linha SPED - remove pipes vazios do início e fim
 */
function parseLine(line: string): string[] {
  // Remove | inicial e final e divide por |
  const cleanLine = line.replace(/^\|/, '').replace(/\|$/, '')
  return ['', ...cleanLine.split('|')]
}

/**
 * Registro 0000 - Abertura do Arquivo Digital
 */
function parseRecord0000(fields: string[], result: SpedParseResult): void {
  // |0000|LECD|01012024|31122024|EMPRESA|CNPJ|UF|IE|COD_MUN|...
  if (fields.length < 7) return

  result.file.fileType = fields[2]?.toLowerCase() === 'lecd' ? 'ecd' : 'ecd'
  result.file.periodStart = parseDate(fields[3]) || result.file.periodStart
  result.file.periodEnd = parseDate(fields[4]) || result.file.periodEnd
  result.file.companyName = cleanString(fields[5]) || 'Não informado'
  result.file.cnpj = fields[6]?.replace(/\D/g, '') || ''
  result.file.stateCode = fields[7] || null
  result.file.cityCode = fields[9] || null
}

/**
 * Registro C050 - Plano de Contas
 */
function parseRecordC050(fields: string[], result: SpedParseResult): void {
  // |C050|DT_ALT|COD_NAT|IND_CTA|NIVEL|COD_CTA|COD_CTA_SUP|CTA|
  if (fields.length < 9) return

  const accountCode = fields[6] || ''
  const accountLevel = parseInt(fields[5], 10) || 1
  const accountType = (fields[4] === 'S' ? 'S' : 'A') as 'S' | 'A'
  const accountName = cleanString(fields[8]) || 'Sem nome'
  const parentAccountCode = fields[7] || null

  // Determinar natureza baseado no primeiro dígito do código
  const firstDigit = accountCode.charAt(0)
  const accountNature = ACCOUNT_NATURE_MAP[firstDigit] || null

  result.accounts.push({
    accountCode,
    accountName,
    accountType,
    accountLevel,
    parentAccountCode,
    accountNature,
    referentialCode: null,
    costCenterCode: null,
    startDate: parseDate(fields[2]) || null,
    metadata: null,
  })

  result.stats.accounts++
}

/**
 * Registro C051 - Plano de Contas Referencial
 */
function parseRecordC051(fields: string[], result: SpedParseResult): void {
  // |C051|COD_ENT_REF|COD_CCUS|COD_CTA_REF|
  if (fields.length < 3) return

  // Atualiza a última conta com o código referencial
  const lastAccount = result.accounts[result.accounts.length - 1]
  if (lastAccount) {
    lastAccount.referentialCode = fields[3] || fields[2] || null
  }
}

/**
 * Registro C052 - Centro de Custo
 */
function parseRecordC052(fields: string[], result: SpedParseResult): void {
  // |C052|COD_CCUS|COD_AUX|
  if (fields.length < 3) return

  // Atualiza a última conta com o centro de custo
  const lastAccount = result.accounts[result.accounts.length - 1]
  if (lastAccount) {
    lastAccount.costCenterCode = fields[2] || null
  }
}

/**
 * Registro I155 - Detalhe dos Saldos Periódicos
 */
function parseRecordI155(fields: string[], result: SpedParseResult): void {
  // |I155|COD_CTA|COD_CCUS|VL_SLD_INI|IND_DC_INI|VL_DEB|VL_CRED|VL_SLD_FIN|IND_DC_FIN|
  if (fields.length < 9) return

  const accountCode = fields[2] || ''
  const initialBalance = parseDecimal(fields[4])
  const initialIndicator = fields[5] === 'D' ? 'D' : fields[5] === 'C' ? 'C' : null
  const debitTotal = parseDecimal(fields[6])
  const creditTotal = parseDecimal(fields[7])
  const finalBalance = parseDecimal(fields[8])
  const finalIndicator = fields[9] === 'D' ? 'D' : fields[9] === 'C' ? 'C' : null

  result.balances.push({
    chartOfAccountId: null, // Será vinculado depois
    accountCode,
    periodDate: result.file.periodEnd, // Usar fim do período
    initialBalance: initialBalance.toString(),
    debitTotal: debitTotal.toString(),
    creditTotal: creditTotal.toString(),
    finalBalance: finalBalance.toString(),
    initialBalanceIndicator: initialIndicator as 'D' | 'C' | null,
    finalBalanceIndicator: finalIndicator as 'D' | 'C' | null,
  })

  result.stats.balances++
}

/**
 * Registro I200 - Lançamento Contábil
 */
function parseRecordI200(
  fields: string[],
  result: SpedParseResult
): Omit<NewJournalEntry, 'id' | 'spedFileId'> {
  // |I200|NUM_LCTO|DT_LCTO|VL_LCTO|IND_LCTO|
  if (fields.length < 5) {
    throw new Error('Registro I200 incompleto')
  }

  const entry: Omit<NewJournalEntry, 'id' | 'spedFileId'> = {
    entryNumber: fields[2] || `AUTO_${Date.now()}`,
    entryDate: parseDate(fields[3]) || new Date().toISOString().split('T')[0],
    entryAmount: parseDecimal(fields[4]).toString(),
    entryType: fields[5] || 'N',
    description: null,
    documentNumber: null,
  }

  result.entries.push(entry)
  result.items.set(entry.entryNumber, [])
  result.stats.entries++

  return entry
}

/**
 * Registro I250 - Partidas do Lançamento
 */
function parseRecordI250(fields: string[], result: SpedParseResult, entryNumber: string): void {
  // |I250|COD_CTA|COD_CCUS|VL_DC|IND_DC|NUM_ARQ|COD_HIST_PAD|HIST|COD_PART|
  if (fields.length < 5) return

  const item: Omit<NewJournalItem, 'id' | 'journalEntryId'> = {
    chartOfAccountId: null, // Será vinculado depois
    accountCode: fields[2] || '',
    amount: parseDecimal(fields[4]).toString(),
    debitCredit: fields[5] === 'D' ? 'D' : 'C',
    itemDescription: cleanString(fields[8]) || null,
    contraAccountCode: null,
    costCenterCode: fields[3] || null,
  }

  const items = result.items.get(entryNumber)
  if (items) {
    items.push(item)
    result.stats.items++
  }
}

// ================================================================
// Funções Utilitárias
// ================================================================

/**
 * Parse de data no formato DDMMYYYY para YYYY-MM-DD
 */
function parseDate(dateStr: string | undefined): string | null {
  if (!dateStr || dateStr.length !== 8) return null

  const day = dateStr.substring(0, 2)
  const month = dateStr.substring(2, 4)
  const year = dateStr.substring(4, 8)

  // Validar
  const date = new Date(`${year}-${month}-${day}`)
  if (isNaN(date.getTime())) return null

  return `${year}-${month}-${day}`
}

/**
 * Parse de valor decimal (formato brasileiro ou americano)
 */
function parseDecimal(value: string | undefined): number {
  if (!value) return 0

  // Remove caracteres não numéricos exceto vírgula e ponto
  let cleaned = value.replace(/[^\d,.-]/g, '')

  // Trata formato brasileiro (1.234,56) vs americano (1,234.56)
  if (cleaned.includes(',') && cleaned.includes('.')) {
    // Se tem ambos, verifica qual é o decimal
    const lastComma = cleaned.lastIndexOf(',')
    const lastDot = cleaned.lastIndexOf('.')

    if (lastComma > lastDot) {
      // Formato brasileiro: 1.234,56
      cleaned = cleaned.replace(/\./g, '').replace(',', '.')
    } else {
      // Formato americano: 1,234.56
      cleaned = cleaned.replace(/,/g, '')
    }
  } else if (cleaned.includes(',')) {
    // Apenas vírgula - provavelmente decimal brasileiro
    cleaned = cleaned.replace(',', '.')
  }

  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

/**
 * Limpa string removendo caracteres especiais problemáticos
 */
function cleanString(str: string | undefined): string {
  if (!str) return ''

  // Remove caracteres de controle e normaliza encoding
  return str
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/\uFFFD/g, '') // Caractere de substituição
    .trim()
}

// ================================================================
// Funções de Geração de Markdown para RAG
// ================================================================

/**
 * Gera markdown estruturado para uma conta (para vetorização)
 */
export function generateAccountMarkdown(
  account: ChartOfAccount,
  balance?: AccountBalance,
  entries?: JournalEntry[]
): string {
  let markdown = `## Conta: ${account.accountCode} - ${account.accountName}\n\n`

  markdown += `**Tipo:** ${account.accountType === 'S' ? 'Sintética (Agrupadora)' : 'Analítica (Movimentável)'}\n`
  markdown += `**Nível:** ${account.accountLevel}\n`
  markdown += `**Natureza:** ${formatNature(account.accountNature)}\n`

  if (account.parentAccountCode) {
    markdown += `**Conta Superior:** ${account.parentAccountCode}\n`
  }

  if (account.referentialCode) {
    markdown += `**Código Referencial:** ${account.referentialCode}\n`
  }

  if (balance) {
    markdown += `\n### Saldos\n\n`
    markdown += `| Descrição | Valor |\n`
    markdown += `|-----------|-------|\n`
    markdown += `| Saldo Inicial | R$ ${formatCurrency(balance.initialBalance)} ${balance.initialBalanceIndicator || ''} |\n`
    markdown += `| Total Débitos | R$ ${formatCurrency(balance.debitTotal)} |\n`
    markdown += `| Total Créditos | R$ ${formatCurrency(balance.creditTotal)} |\n`
    markdown += `| Saldo Final | R$ ${formatCurrency(balance.finalBalance)} ${balance.finalBalanceIndicator || ''} |\n`
  }

  if (entries && entries.length > 0) {
    markdown += `\n### Movimentação (${entries.length} lançamentos)\n\n`
    const sample = entries.slice(0, 10)
    for (const entry of sample) {
      markdown += `- **${entry.entryDate}** - R$ ${formatCurrency(entry.entryAmount)}`
      if (entry.description) {
        markdown += ` - ${entry.description}`
      }
      markdown += `\n`
    }
    if (entries.length > 10) {
      markdown += `\n*... e mais ${entries.length - 10} lançamentos*\n`
    }
  }

  return markdown
}

/**
 * Formata natureza da conta para exibição
 */
function formatNature(nature: ChartOfAccount['accountNature']): string {
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

// ================================================================
// Exportações
// ================================================================

export { parseDate, parseDecimal, cleanString, formatCurrency, formatNature }

