import OpenAI from 'openai'
import { searchSimilarChunks } from './rag-search'
import postgres from 'postgres'

// ================================================================
// Configuração
// ================================================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID

// Cliente SQL para queries
const sql = postgres(process.env.DATABASE_URL!)

// ================================================================
// Tipos e Interfaces
// ================================================================

export interface AgentMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AgentResponse {
  message: string
  toolCalls?: ToolCallResult[]
  threadId: string
  runId: string
}

export interface ToolCallResult {
  tool: string
  input: Record<string, unknown>
  output: unknown
  success: boolean
  error?: string
}

export interface SqlQueryResult {
  columns: string[]
  rows: Record<string, unknown>[]
  rowCount: number
  executionTime: number
}

export interface VectorSearchResult {
  chunks: Array<{
    content: string
    similarity: number
    metadata: Record<string, unknown>
  }>
  totalFound: number
}

// ================================================================
// Definição das Tools do Assistant
// ================================================================

export const ASSISTANT_TOOLS: OpenAI.Beta.AssistantTool[] = [
  {
    type: 'function',
    function: {
      name: 'sql_query',
      description: `Executa uma consulta SQL SELECT no banco de dados contábil normalizado.

Tabelas disponíveis:
- sped_files: Arquivos SPED processados (id, cnpj, company_name, period_start, period_end)
- chart_of_accounts: Plano de contas (account_code, account_name, account_type, account_level, account_nature)
- account_balances: Saldos por período (account_code, initial_balance, debit_total, credit_total, final_balance)
- journal_entries: Lançamentos contábeis (entry_number, entry_date, entry_amount, description)
- journal_items: Partidas do lançamento (account_code, amount, debit_credit)

IMPORTANTE: Apenas consultas SELECT são permitidas. Não use INSERT, UPDATE, DELETE ou DDL.`,
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Consulta SQL SELECT a ser executada',
          },
          limit: {
            type: 'number',
            description: 'Limite de resultados (padrão: 100, máximo: 1000)',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'vector_search',
      description: `Realiza busca semântica em documentos e chunks vetorizados usando embeddings.

Use esta ferramenta para:
- Encontrar informações em documentos de texto
- Buscar pareceres, contratos e outros documentos
- Encontrar contexto relevante que não está estruturado em SQL

A busca usa similaridade cosine para encontrar os chunks mais relevantes.`,
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Pergunta ou termo de busca em linguagem natural',
          },
          limit: {
            type: 'number',
            description: 'Número máximo de resultados (padrão: 5)',
          },
          minSimilarity: {
            type: 'number',
            description: 'Similaridade mínima de 0 a 1 (padrão: 0.5)',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyze_account',
      description: `Analisa a movimentação de uma conta contábil específica.

Retorna:
- Informações da conta (nome, natureza, tipo)
- Saldos (inicial, débitos, créditos, final)
- Principais lançamentos do período
- Análise de tendência se houver dados históricos`,
      parameters: {
        type: 'object',
        properties: {
          accountCode: {
            type: 'string',
            description: 'Código da conta contábil (ex: 1.01.01, 11111)',
          },
          spedFileId: {
            type: 'string',
            description: 'ID do arquivo SPED (opcional, usa o mais recente se não informado)',
          },
        },
        required: ['accountCode'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_financial_summary',
      description: `Obtém um resumo financeiro da empresa.

Retorna:
- Totais de Ativo, Passivo, Patrimônio Líquido
- Totais de Receitas e Despesas
- Resultado do período
- Principais contas por valor`,
      parameters: {
        type: 'object',
        properties: {
          spedFileId: {
            type: 'string',
            description: 'ID do arquivo SPED (opcional)',
          },
          cnpj: {
            type: 'string',
            description: 'CNPJ da empresa (opcional)',
          },
        },
        required: [],
      },
    },
  },
]

// ================================================================
// Handlers das Tools
// ================================================================

/**
 * Executa consulta SQL segura (apenas SELECT)
 */
async function handleSqlQuery(
  query: string,
  limit: number = 100
): Promise<SqlQueryResult> {
  const startTime = Date.now()

  // Validar query - apenas SELECT permitido
  const normalizedQuery = query.trim().toLowerCase()
  if (
    !normalizedQuery.startsWith('select') ||
    normalizedQuery.includes('insert') ||
    normalizedQuery.includes('update') ||
    normalizedQuery.includes('delete') ||
    normalizedQuery.includes('drop') ||
    normalizedQuery.includes('create') ||
    normalizedQuery.includes('alter') ||
    normalizedQuery.includes('truncate')
  ) {
    throw new Error('Apenas consultas SELECT são permitidas')
  }

  // Adicionar LIMIT se não existir
  const safeLimit = Math.min(limit, 1000)
  let finalQuery = query.trim()
  if (!normalizedQuery.includes('limit')) {
    finalQuery = `${finalQuery} LIMIT ${safeLimit}`
  }

  try {
    const result = await sql.unsafe(finalQuery)
    const executionTime = Date.now() - startTime

    return {
      columns: result.length > 0 ? Object.keys(result[0]) : [],
      rows: result as Record<string, unknown>[],
      rowCount: result.length,
      executionTime,
    }
  } catch (error) {
    throw new Error(`Erro na query SQL: ${error instanceof Error ? error.message : 'Desconhecido'}`)
  }
}

/**
 * Executa busca vetorial
 */
async function handleVectorSearch(
  query: string,
  limit: number = 5,
  minSimilarity: number = 0.5
): Promise<VectorSearchResult> {
  try {
    const chunks = await searchSimilarChunks(query, limit, minSimilarity)

    return {
      chunks: chunks.map(c => ({
        content: c.contentMarkdown,
        similarity: c.similarity,
        metadata: {
          title: c.templateTitle,
          section: c.section,
          role: c.role,
          docType: c.templateDocType,
          area: c.templateArea,
        },
      })),
      totalFound: chunks.length,
    }
  } catch (error) {
    throw new Error(`Erro na busca vetorial: ${error instanceof Error ? error.message : 'Desconhecido'}`)
  }
}

/**
 * Analisa conta específica
 */
async function handleAnalyzeAccount(
  accountCode: string,
  spedFileId?: string
): Promise<Record<string, unknown>> {
  // Buscar conta
  let accountQuery = `
    SELECT coa.*, sf.company_name, sf.period_start, sf.period_end
    FROM chart_of_accounts coa
    JOIN sped_files sf ON sf.id = coa.sped_file_id
    WHERE coa.account_code = $1
  `
  const params: unknown[] = [accountCode]

  if (spedFileId) {
    accountQuery += ' AND coa.sped_file_id = $2'
    params.push(spedFileId)
  }

  accountQuery += ' ORDER BY sf.period_end DESC LIMIT 1'

  const accounts = await sql.unsafe(accountQuery, params)

  if (accounts.length === 0) {
    return { error: `Conta ${accountCode} não encontrada` }
  }

  const account = accounts[0] as Record<string, unknown>
  const fileId = account.sped_file_id as string

  // Buscar saldo
  const balances = await sql.unsafe(
    `SELECT * FROM account_balances WHERE account_code = $1 AND sped_file_id = $2`,
    [accountCode, fileId]
  )

  // Buscar últimos lançamentos
  const entries = await sql.unsafe(
    `
    SELECT je.entry_date, je.entry_amount, ji.amount, ji.debit_credit, je.description
    FROM journal_items ji
    JOIN journal_entries je ON je.id = ji.journal_entry_id
    WHERE ji.account_code = $1 AND je.sped_file_id = $2
    ORDER BY je.entry_date DESC
    LIMIT 20
    `,
    [accountCode, fileId]
  )

  return {
    account: {
      code: account.account_code,
      name: account.account_name,
      type: account.account_type,
      level: account.account_level,
      nature: account.account_nature,
    },
    company: account.company_name,
    period: {
      start: account.period_start,
      end: account.period_end,
    },
    balance: balances.length > 0 ? balances[0] : null,
    recentEntries: entries,
    summary: {
      totalEntries: entries.length,
      totalDebits: entries
        .filter((e: Record<string, unknown>) => e.debit_credit === 'D')
        .reduce((sum: number, e: Record<string, unknown>) => sum + parseFloat(e.amount as string || '0'), 0),
      totalCredits: entries
        .filter((e: Record<string, unknown>) => e.debit_credit === 'C')
        .reduce((sum: number, e: Record<string, unknown>) => sum + parseFloat(e.amount as string || '0'), 0),
    },
  }
}

/**
 * Obtém resumo financeiro
 */
async function handleFinancialSummary(
  spedFileId?: string,
  cnpj?: string
): Promise<Record<string, unknown>> {
  // Encontrar arquivo SPED
  let fileQuery = 'SELECT * FROM sped_files WHERE status = $1'
  const params: unknown[] = ['completed']

  if (spedFileId) {
    fileQuery += ' AND id = $2'
    params.push(spedFileId)
  } else if (cnpj) {
    fileQuery += ' AND cnpj = $2'
    params.push(cnpj.replace(/\D/g, ''))
  }

  fileQuery += ' ORDER BY period_end DESC LIMIT 1'

  const files = await sql.unsafe(fileQuery, params)

  if (files.length === 0) {
    return { error: 'Nenhum arquivo SPED encontrado' }
  }

  const file = files[0] as Record<string, unknown>
  const fileId = file.id as string

  // Buscar totais por natureza
  const totals = await sql.unsafe(
    `
    SELECT 
      coa.account_nature,
      SUM(CAST(ab.final_balance AS DECIMAL)) as total
    FROM account_balances ab
    JOIN chart_of_accounts coa ON coa.account_code = ab.account_code AND coa.sped_file_id = ab.sped_file_id
    WHERE ab.sped_file_id = $1 AND coa.account_type = 'A'
    GROUP BY coa.account_nature
    `,
    [fileId]
  )

  // Mapear totais
  const totalsMap: Record<string, number> = {}
  for (const row of totals as Array<Record<string, unknown>>) {
    totalsMap[row.account_nature as string] = parseFloat(row.total as string) || 0
  }

  // Calcular resultado
  const receitas = totalsMap['receita'] || 0
  const despesas = totalsMap['despesa'] || 0
  const resultado = receitas - despesas

  return {
    empresa: {
      nome: file.company_name,
      cnpj: file.cnpj,
    },
    periodo: {
      inicio: file.period_start,
      fim: file.period_end,
    },
    balanco: {
      ativo: totalsMap['ativo'] || 0,
      passivo: totalsMap['passivo'] || 0,
      patrimonioLiquido: totalsMap['patrimonio_liquido'] || 0,
    },
    resultado: {
      receitas,
      despesas,
      lucroOuPrejuizo: resultado,
      margem: receitas > 0 ? ((resultado / receitas) * 100).toFixed(2) + '%' : '0%',
    },
    arquivoId: fileId,
  }
}

// ================================================================
// Orquestrador Principal
// ================================================================

/**
 * Processa tool calls do Assistant
 */
async function processToolCalls(
  toolCalls: OpenAI.Beta.Threads.Runs.RequiredActionFunctionToolCall[]
): Promise<OpenAI.Beta.Threads.Runs.ToolOutput[]> {
  const outputs: OpenAI.Beta.Threads.Runs.ToolOutput[] = []

  for (const toolCall of toolCalls) {
    const { name, arguments: args } = toolCall.function
    let output: unknown

    try {
      const parsedArgs = JSON.parse(args)

      switch (name) {
        case 'sql_query':
          output = await handleSqlQuery(parsedArgs.query, parsedArgs.limit)
          break

        case 'vector_search':
          output = await handleVectorSearch(
            parsedArgs.query,
            parsedArgs.limit,
            parsedArgs.minSimilarity
          )
          break

        case 'analyze_account':
          output = await handleAnalyzeAccount(parsedArgs.accountCode, parsedArgs.spedFileId)
          break

        case 'get_financial_summary':
          output = await handleFinancialSummary(parsedArgs.spedFileId, parsedArgs.cnpj)
          break

        default:
          output = { error: `Tool desconhecida: ${name}` }
      }
    } catch (error) {
      output = {
        error: error instanceof Error ? error.message : 'Erro ao executar tool',
      }
    }

    outputs.push({
      tool_call_id: toolCall.id,
      output: JSON.stringify(output),
    })
  }

  return outputs
}

/**
 * Cria ou recupera thread do Assistant
 */
export async function getOrCreateThread(threadId?: string): Promise<string> {
  if (threadId) {
    try {
      await openai.beta.threads.retrieve(threadId)
      return threadId
    } catch {
      // Thread não existe, criar nova
    }
  }

  const thread = await openai.beta.threads.create()
  return thread.id
}

/**
 * Envia mensagem e executa o Assistant
 */
export async function chat(
  message: string,
  threadId?: string
): Promise<AgentResponse> {
  if (!ASSISTANT_ID) {
    throw new Error('OPENAI_ASSISTANT_ID não configurado')
  }

  // Obter ou criar thread
  const actualThreadId = await getOrCreateThread(threadId)

  // Adicionar mensagem do usuário
  await openai.beta.threads.messages.create(actualThreadId, {
    role: 'user',
    content: message,
  })

  // Criar e executar run
  let run = await openai.beta.threads.runs.create(actualThreadId, {
    assistant_id: ASSISTANT_ID,
  })

  const toolCallResults: ToolCallResult[] = []

  // Aguardar conclusão (com tratamento de tool calls)
  while (run.status === 'in_progress' || run.status === 'queued' || run.status === 'requires_action') {
    if (run.status === 'requires_action') {
      const toolCalls = run.required_action?.submit_tool_outputs?.tool_calls

      if (toolCalls) {
        // Processar tool calls
        const outputs = await processToolCalls(toolCalls)

        // Registrar resultados
        for (let i = 0; i < toolCalls.length; i++) {
          const tc = toolCalls[i]
          const output = outputs[i]

          toolCallResults.push({
            tool: tc.function.name,
            input: JSON.parse(tc.function.arguments),
            output: JSON.parse(output.output),
            success: !JSON.parse(output.output).error,
            error: JSON.parse(output.output).error,
          })
        }

        // Submeter resultados
        run = await openai.beta.threads.runs.submitToolOutputs(actualThreadId, run.id, {
          tool_outputs: outputs,
        })
      }
    } else {
      // Aguardar
      await new Promise(resolve => setTimeout(resolve, 1000))
      run = await openai.beta.threads.runs.retrieve(actualThreadId, run.id)
    }
  }

  // Verificar status final
  if (run.status === 'failed') {
    throw new Error(`Run falhou: ${run.last_error?.message || 'Erro desconhecido'}`)
  }

  // Obter mensagem de resposta
  const messages = await openai.beta.threads.messages.list(actualThreadId, {
    order: 'desc',
    limit: 1,
  })

  const assistantMessage = messages.data[0]
  let responseText = ''

  if (assistantMessage && assistantMessage.role === 'assistant') {
    for (const content of assistantMessage.content) {
      if (content.type === 'text') {
        responseText += content.text.value
      }
    }
  }

  return {
    message: responseText,
    toolCalls: toolCallResults.length > 0 ? toolCallResults : undefined,
    threadId: actualThreadId,
    runId: run.id,
  }
}

/**
 * Configura o Assistant com as tools necessárias
 * Chamar uma vez na configuração inicial
 */
export async function configureAssistant(): Promise<void> {
  if (!ASSISTANT_ID) {
    throw new Error('OPENAI_ASSISTANT_ID não configurado')
  }

  await openai.beta.assistants.update(ASSISTANT_ID, {
    name: 'QS Nexus - Consultor de Dados',
    instructions: `Você é o QS Nexus, um assistente especializado em análise de dados contábeis e fiscais para consultoria tributária e empresarial.

Suas capacidades:
1. Consultar dados estruturados via SQL (plano de contas, saldos, lançamentos)
2. Buscar informações em documentos via busca vetorial (pareceres, contratos, regulamentações)
3. Analisar contas contábeis específicas
4. Gerar resumos financeiros

Diretrizes:
- Sempre valide os dados antes de fazer afirmações
- Use as ferramentas apropriadas para cada tipo de consulta
- Para dados numéricos/estruturados, prefira SQL
- Para contexto textual/documentos, use busca vetorial
- Apresente resultados de forma clara e organizada
- Cite as fontes quando usar dados específicos
- Formate valores monetários em BRL (R$)
- Use linguagem profissional mas acessível

Quando não encontrar dados:
- Informe claramente que os dados não foram encontrados
- Sugira possíveis motivos (período diferente, empresa não carregada, etc.)
- Ofereça alternativas de busca`,
    tools: ASSISTANT_TOOLS,
    model: 'gpt-4o',
  })
}

// ================================================================
// Exportações
// ================================================================

export {
  handleSqlQuery,
  handleVectorSearch,
  handleAnalyzeAccount,
  handleFinancialSummary,
  processToolCalls,
}

