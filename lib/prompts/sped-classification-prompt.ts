/**
 * System Prompt para classificação de arquivos SPED
 */
export const SPED_CLASSIFICATION_PROMPT = `Você é um especialista em contabilidade brasileira e análise de arquivos SPED (Sistema Público de Escrituração Digital).

Sua tarefa é analisar os dados contábeis do SPED ECD e extrair metadados estruturados, métricas financeiras e insights de análise.

## ANÁLISE OBRIGATÓRIA:

### 1. IDENTIFICAÇÃO
- Tipo de SPED (ECD, ECF, EFD)
- Empresa (CNPJ e razão social)
- Período fiscal

### 2. MÉTRICAS FINANCEIRAS
Calcule ou identifique a partir do plano de contas e saldos:

**Demonstração do Resultado (DRE)**:
- Receita Total (contas 3.x ou 4.x dependendo do plano)
- Despesas Totais (contas 4.x ou 5.x)
- Lucro/Prejuízo Líquido (receitas - despesas)

**Balanço Patrimonial**:
- Ativo Total (contas 1.x)
- Ativo Circulante (contas 1.1.x)
- Passivo Total (contas 2.x)
- Passivo Circulante (contas 2.1.x)
- Patrimônio Líquido (contas 3.x ou 2.3.x)

### 3. INDICADORES FINANCEIROS
Calcule:

- **Margem de Lucro** = (Lucro Líquido / Receita Total) × 100
- **Índice de Endividamento** = (Passivo Total / Ativo Total) × 100
- **Liquidez Corrente** = Ativo Circulante / Passivo Circulante
- **ROA (Retorno sobre Ativos)** = (Lucro Líquido / Ativo Total) × 100

### 4. ANÁLISE DE RISCO E ANOMALIAS

Identifique e classifique:

**Padrões Suspeitos**:
- Lançamentos contábeis sem partidas dobradas (débito ≠ crédito)
- Valores muito altos ou muito baixos em relação ao histórico
- Datas de lançamento fora do período declarado
- Contas sem movimentação esperada
- Saldos negativos em contas que deveriam ser positivas

**Níveis de Risco**:
- **Baixo**: Dados consistentes, sem anomalias significativas
- **Médio**: Algumas inconsistências menores ou dados incompletos
- **Alto**: Anomalias graves, dados inconsistentes ou suspeitas de irregularidade

**Tipos de Anomalia**:
- **Info**: Observações gerais, sem impacto
- **Warning**: Inconsistências que merecem atenção
- **Critical**: Problemas graves que exigem investigação imediata

### 5. QUALIDADE DOS DADOS

Avalie:
- **Excelente**: Dados completos, consistentes, bem estruturados
- **Boa**: Dados completos com pequenas inconsistências
- **Regular**: Dados parcialmente completos ou com inconsistências moderadas
- **Ruim**: Dados incompletos, muito inconsistentes ou com erros graves

**Completude** (0-100):
- 100%: Todos os registros esperados presentes
- 75-99%: Maioria dos registros presentes
- 50-74%: Registros parciais
- <50%: Dados muito incompletos

### 6. INSIGHTS E RECOMENDAÇÕES

Forneça:
- **Key Insights**: 3-5 observações principais sobre a situação financeira
- **Recomendações**: Ações sugeridas para análise ou correção
- **Destaques**: Pontos que merecem atenção especial

## OBSERVAÇÕES IMPORTANTES:

1. Se não houver dados suficientes para calcular um indicador, use 0 ou valores neutros
2. Baseie sua análise nos saldos das contas e na estrutura do plano de contas
3. Use terminologia contábil brasileira (ativo, passivo, receita, despesa)
4. Seja objetivo e técnico nas análises
5. Priorize identificação de riscos e anomalias que possam indicar problemas fiscais

## FORMATO DE SAÍDA:

Retorne um objeto JSON estruturado conforme o schema fornecido, com todos os campos preenchidos de forma precisa e profissional.
`

/**
 * Template fields para schema de SPED
 * Define os campos dinâmicos que serão salvos no banco
 */
export const SPED_SCHEMA_FIELDS: any[] = [
  {
    name: 'cnpj',
    type: 'string',
    label: 'CNPJ',
    required: true,
    description: 'CNPJ da empresa (somente números)',
  },
  {
    name: 'companyName',
    type: 'string',
    label: 'Razão Social',
    required: true,
    description: 'Nome completo da empresa',
  },
  {
    name: 'spedType',
    type: 'enum',
    label: 'Tipo de SPED',
    required: true,
    options: ['ECD', 'ECF', 'EFD-ICMS/IPI', 'EFD-Contribuições', 'Outro'],
    description: 'Tipo de arquivo SPED',
  },
  {
    name: 'periodStart',
    type: 'string',
    label: 'Início do Período',
    required: true,
    description: 'Data de início (YYYY-MM-DD)',
  },
  {
    name: 'periodEnd',
    type: 'string',
    label: 'Fim do Período',
    required: true,
    description: 'Data de fim (YYYY-MM-DD)',
  },
  {
    name: 'fiscalYear',
    type: 'number',
    label: 'Ano Fiscal',
    required: true,
    description: 'Ano fiscal de referência',
  },
  {
    name: 'totalRevenue',
    type: 'number',
    label: 'Receita Total',
    required: false,
    description: 'Receita total do período',
  },
  {
    name: 'totalExpenses',
    type: 'number',
    label: 'Despesas Totais',
    required: false,
    description: 'Despesas totais do período',
  },
  {
    name: 'netProfit',
    type: 'number',
    label: 'Lucro Líquido',
    required: false,
    description: 'Resultado líquido do período',
  },
  {
    name: 'totalAssets',
    type: 'number',
    label: 'Ativo Total',
    required: false,
    description: 'Total do ativo',
  },
  {
    name: 'totalLiabilities',
    type: 'number',
    label: 'Passivo Total',
    required: false,
    description: 'Total do passivo',
  },
  {
    name: 'equity',
    type: 'number',
    label: 'Patrimônio Líquido',
    required: false,
    description: 'Patrimônio líquido da empresa',
  },
  {
    name: 'profitMargin',
    type: 'number',
    label: 'Margem de Lucro (%)',
    required: false,
    description: 'Margem de lucro percentual',
  },
  {
    name: 'debtRatio',
    type: 'number',
    label: 'Índice de Endividamento (%)',
    required: false,
    description: 'Relação passivo/ativo em percentual',
  },
  {
    name: 'liquidityRatio',
    type: 'number',
    label: 'Liquidez Corrente',
    required: false,
    description: 'Ativo circulante / Passivo circulante',
  },
  {
    name: 'returnOnAssets',
    type: 'number',
    label: 'ROA (%)',
    required: false,
    description: 'Retorno sobre ativos',
  },
  {
    name: 'riskLevel',
    type: 'enum',
    label: 'Nível de Risco',
    required: true,
    options: ['baixo', 'medio', 'alto'],
    description: 'Avaliação de risco fiscal/contábil',
  },
  {
    name: 'riskFactors',
    type: 'array',
    label: 'Fatores de Risco',
    required: false,
    description: 'Lista de fatores de risco identificados',
  },
  {
    name: 'suspiciousPatterns',
    type: 'array',
    label: 'Padrões Suspeitos',
    required: false,
    description: 'Padrões incomuns ou suspeitos detectados',
  },
  {
    name: 'anomalies',
    type: 'array',
    label: 'Anomalias',
    required: false,
    description: 'Anomalias detectadas nos dados',
  },
  {
    name: 'dataQuality',
    type: 'enum',
    label: 'Qualidade dos Dados',
    required: true,
    options: ['excelente', 'boa', 'regular', 'ruim'],
    description: 'Avaliação da qualidade geral dos dados',
  },
  {
    name: 'completenessScore',
    type: 'number',
    label: 'Score de Completude',
    required: true,
    description: 'Percentual de completude dos dados (0-100)',
  },
  {
    name: 'consistencyIssues',
    type: 'array',
    label: 'Problemas de Consistência',
    required: false,
    description: 'Problemas de consistência identificados',
  },
  {
    name: 'keyInsights',
    type: 'array',
    label: 'Insights Principais',
    required: true,
    description: 'Principais insights e observações (3-5 itens)',
  },
  {
    name: 'recommendations',
    type: 'array',
    label: 'Recomendações',
    required: false,
    description: 'Recomendações de análise ou ação',
  },
  {
    name: 'tags',
    type: 'array',
    label: 'Tags',
    required: true,
    description: 'Tags para categorização (ex: alto-risco, lucro-baixo, inconsistencias)',
  },
  {
    name: 'summary',
    type: 'string',
    label: 'Resumo Executivo',
    required: true,
    description: 'Resumo executivo da situação contábil/financeira (2-3 parágrafos)',
  },
  {
    name: 'chartOfAccountsNotes',
    type: 'string',
    label: 'Observações sobre Plano de Contas',
    required: false,
    description: 'Comentários sobre a estrutura do plano de contas',
  },
  {
    name: 'unusualAccounts',
    type: 'array',
    label: 'Contas Incomuns',
    required: false,
    description: 'Contas fora do padrão ou nomenclatura incomum',
  },
]

