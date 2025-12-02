import { generateObject } from 'ai'
import { getClassificationModelProvider } from '../types/classification-models'
import { SpedClassificationSchema } from '../schemas/sped-classification-schema'
import { loadConfigByDocumentType } from './classification-config'

/**
 * Gera um resumo markdown do arquivo SPED para classificação AI
 */
export function generateSpedSummaryMarkdown(data: {
  fileName: string
  cnpj: string
  companyName: string
  periodStart: string
  periodEnd: string
  fileType: string
  stats: {
    accounts?: number
    balances?: number
    entries?: number
    items?: number
  }
  sampleAccounts?: Array<{
    accountCode: string
    accountName: string
    accountType: string
  }>
  sampleBalances?: Array<{
    accountCode: string
    debitBalance: number
    creditBalance: number
  }>
}): string {
  const md = []
  
  md.push(`# Arquivo SPED ${data.fileType}`)
  md.push(``)
  md.push(`## Identificação`)
  md.push(`- **Arquivo:** ${data.fileName}`)
  md.push(`- **CNPJ:** ${data.cnpj}`)
  md.push(`- **Empresa:** ${data.companyName}`)
  md.push(`- **Período:** ${data.periodStart} a ${data.periodEnd}`)
  md.push(`- **Tipo:** ${data.fileType}`)
  md.push(``)
  md.push(`## Estatísticas`)
  md.push(`- **Contas Contábeis:** ${data.stats.accounts || 0}`)
  md.push(`- **Saldos:** ${data.stats.balances || 0}`)
  md.push(`- **Lançamentos:** ${data.stats.entries || 0}`)
  md.push(`- **Partidas:** ${data.stats.items || 0}`)
  md.push(``)
  
  if (data.sampleAccounts && data.sampleAccounts.length > 0) {
    md.push(`## Plano de Contas (Amostra)`)
    md.push(``)
    md.push(`| Código | Nome | Tipo |`)
    md.push(`|--------|------|------|`)
    data.sampleAccounts.slice(0, 20).forEach(acc => {
      md.push(`| ${acc.accountCode} | ${acc.accountName} | ${acc.accountType} |`)
    })
    md.push(``)
  }
  
  if (data.sampleBalances && data.sampleBalances.length > 0) {
    md.push(`## Saldos (Amostra)`)
    md.push(``)
    md.push(`| Conta | Débito | Crédito |`)
    md.push(`|-------|--------|---------|`)
    data.sampleBalances.slice(0, 20).forEach(bal => {
      md.push(`| ${bal.accountCode} | ${bal.debitBalance.toFixed(2)} | ${bal.creditBalance.toFixed(2)} |`)
    })
    md.push(``)
  }
  
  return md.join('\n')
}

/**
 * Classifica um arquivo SPED usando AI
 */
export async function classifySpedDocument(
  markdown: string,
  stats?: {
    accounts?: number
    balances?: number
    entries?: number
    items?: number
  }
) {
  // Carrega configuração de classificação para tipo 'contabil'
  const config = await loadConfigByDocumentType('contabil')
  
  // Obtem o provider do modelo
  const provider = getClassificationModelProvider(config.modelName as any)
  
  // Gera classificação usando AI
  const result = await generateObject({
    model: provider.model,
    schema: SpedClassificationSchema,
    system: config.systemPrompt,
    prompt: `Analise o seguinte arquivo SPED e extraia os metadados estruturados:

${markdown}

IMPORTANTE:
- Calcule os indicadores financeiros baseado nos saldos das contas
- Identifique padrões suspeitos ou anomalias
- Avalie a qualidade e completude dos dados
- Forneça insights e recomendações práticas

Retorne um objeto JSON conforme o schema fornecido.`,
    temperature: 0.1, // Baixa temperatura para resultados mais consistentes
  })
  
  return result.object
}

/**
 * Calcula métricas financeiras básicas a partir dos saldos das contas
 */
export function calculateFinancialMetrics(balances: Array<{
  accountCode: string
  debitBalance: number
  creditBalance: number
}>) {
  const metrics = {
    totalRevenue: 0,
    totalExpenses: 0,
    totalAssets: 0,
    totalLiabilities: 0,
    equity: 0,
    currentAssets: 0,
    currentLiabilities: 0,
  }
  
  balances.forEach(balance => {
    const code = balance.accountCode
    const netBalance = balance.debitBalance - balance.creditBalance
    
    // Ativo (1.x.x)
    if (code.startsWith('1')) {
      metrics.totalAssets += Math.abs(netBalance)
      
      // Ativo Circulante (1.1.x)
      if (code.startsWith('1.1')) {
        metrics.currentAssets += Math.abs(netBalance)
      }
    }
    
    // Passivo (2.x.x)
    else if (code.startsWith('2')) {
      // Passivo Circulante (2.1.x)
      if (code.startsWith('2.1')) {
        metrics.currentLiabilities += Math.abs(netBalance)
      }
      
      // Patrimônio Líquido (2.3.x ou 3.x dependendo do plano)
      if (code.startsWith('2.3') || code.startsWith('3')) {
        metrics.equity += Math.abs(netBalance)
      } else {
        metrics.totalLiabilities += Math.abs(netBalance)
      }
    }
    
    // Receitas (3.x ou 4.x dependendo do plano)
    else if (code.startsWith('3') || code.startsWith('4')) {
      if (!code.startsWith('3.0') && !code.startsWith('4.0')) { // Exclui contas de patrimônio
        metrics.totalRevenue += Math.abs(netBalance)
      }
    }
    
    // Despesas (4.x ou 5.x dependendo do plano)
    else if (code.startsWith('5') || code.startsWith('6')) {
      metrics.totalExpenses += Math.abs(netBalance)
    }
  })
  
  return {
    ...metrics,
    netProfit: metrics.totalRevenue - metrics.totalExpenses,
    profitMargin: metrics.totalRevenue > 0 
      ? ((metrics.totalRevenue - metrics.totalExpenses) / metrics.totalRevenue) * 100 
      : 0,
    debtRatio: metrics.totalAssets > 0 
      ? (metrics.totalLiabilities / metrics.totalAssets) * 100 
      : 0,
    liquidityRatio: metrics.currentLiabilities > 0 
      ? metrics.currentAssets / metrics.currentLiabilities 
      : 0,
    returnOnAssets: metrics.totalAssets > 0 
      ? ((metrics.totalRevenue - metrics.totalExpenses) / metrics.totalAssets) * 100 
      : 0,
  }
}

