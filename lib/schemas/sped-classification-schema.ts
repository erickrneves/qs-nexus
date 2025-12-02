import { z } from 'zod'

/**
 * Schema de classificação para arquivos SPED
 * Foco em análise contábil, financeira e detecção de anomalias
 */
export const SpedClassificationSchema = z.object({
  // Identificação
  cnpj: z.string().describe('CNPJ da empresa'),
  companyName: z.string().describe('Razão social da empresa'),
  spedType: z.enum(['ECD', 'ECF', 'EFD-ICMS/IPI', 'EFD-Contribuições', 'Outro']).describe('Tipo de arquivo SPED'),
  
  // Período
  periodStart: z.string().describe('Data de início do período (YYYY-MM-DD)'),
  periodEnd: z.string().describe('Data de fim do período (YYYY-MM-DD)'),
  fiscalYear: z.number().int().describe('Ano fiscal'),
  
  // Métricas Financeiras (calculadas a partir do SPED)
  totalRevenue: z.number().describe('Receita total do período'),
  totalExpenses: z.number().describe('Despesas totais do período'),
  netProfit: z.number().describe('Lucro líquido (receita - despesa)'),
  totalAssets: z.number().describe('Ativo total'),
  totalLiabilities: z.number().describe('Passivo total'),
  equity: z.number().describe('Patrimônio líquido'),
  
  // Indicadores Financeiros (calculados)
  profitMargin: z.number().describe('Margem de lucro percentual'),
  debtRatio: z.number().describe('Índice de endividamento (passivo/ativo)'),
  liquidityRatio: z.number().describe('Índice de liquidez corrente'),
  returnOnAssets: z.number().describe('Retorno sobre ativos (ROA)'),
  
  // Análise de Risco (AI)
  riskLevel: z.enum(['baixo', 'medio', 'alto']).describe('Nível de risco fiscal/contábil'),
  riskFactors: z.array(z.string()).describe('Fatores de risco identificados'),
  suspiciousPatterns: z.array(z.string()).describe('Padrões suspeitos ou não usuais detectados'),
  anomalies: z.array(
    z.object({
      type: z.string().describe('Tipo de anomalia'),
      description: z.string().describe('Descrição da anomalia'),
      severity: z.enum(['info', 'warning', 'critical']).describe('Gravidade'),
      affectedAccounts: z.array(z.string()).optional().describe('Contas afetadas'),
    })
  ).describe('Anomalias detectadas'),
  
  // Qualidade dos Dados
  dataQuality: z.enum(['excelente', 'boa', 'regular', 'ruim']).describe('Avaliação geral da qualidade dos dados'),
  completenessScore: z.number().min(0).max(100).describe('Score de completude (0-100)'),
  consistencyIssues: z.array(z.string()).describe('Problemas de consistência encontrados'),
  
  // Destaques e Insights
  keyInsights: z.array(z.string()).describe('Principais insights e observações'),
  recommendations: z.array(z.string()).describe('Recomendações para análise ou correção'),
  
  // Tags e Categorização
  tags: z.array(z.string()).describe('Tags para categorização e busca'),
  summary: z.string().describe('Resumo executivo dos dados contábeis (2-3 parágrafos)'),
  
  // Observações sobre o Plano de Contas
  chartOfAccountsNotes: z.string().optional().describe('Observações sobre o plano de contas'),
  unusualAccounts: z.array(z.string()).optional().describe('Contas incomuns ou fora do padrão'),
})

export type SpedClassification = z.infer<typeof SpedClassificationSchema>

/**
 * Schema simplificado para campos obrigatórios do SPED
 * Usado quando não é possível calcular todos os indicadores
 */
export const SpedClassificationMinimalSchema = z.object({
  cnpj: z.string(),
  companyName: z.string(),
  spedType: z.enum(['ECD', 'ECF', 'EFD-ICMS/IPI', 'EFD-Contribuições', 'Outro']),
  periodStart: z.string(),
  periodEnd: z.string(),
  fiscalYear: z.number().int(),
  dataQuality: z.enum(['excelente', 'boa', 'regular', 'ruim']),
  completenessScore: z.number().min(0).max(100),
  tags: z.array(z.string()),
  summary: z.string(),
})

export type SpedClassificationMinimal = z.infer<typeof SpedClassificationMinimalSchema>

