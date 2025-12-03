# Executor de Workflows com LangChain

Sistema completo de execução de workflows usando LangChain e LangGraph, com processamento assíncrono via BullMQ.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Componentes](#componentes)
- [Setup](#setup)
- [Uso](#uso)
- [Exemplos](#exemplos)
- [API Reference](#api-reference)

## 🎯 Visão Geral

O sistema implementa:

- ✅ **4 LangChain Tools** personalizadas para dados SPED/RAG
- ✅ **Workflow Engine** que executa grafos LangGraph
- ✅ **Sistema de Queue** com BullMQ para processamento assíncrono
- ✅ **Tracking de Steps** em tempo real
- ✅ **Métricas e Observabilidade** completas
- ✅ **3 Workflows de Exemplo** prontos para uso

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js API Routes                    │
│  /api/workflows/[id]/execute → Enfileira job            │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│                    BullMQ Queue (Redis)                  │
│  Gerencia jobs, retry, rate limiting                    │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│                   Workflow Worker                        │
│  Processa jobs assíncronamente                          │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│                  Workflow Engine                         │
│  Executa grafo LangGraph node por node                  │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│                  LangChain Tools                         │
│  sql_query │ vector_search │ document_analysis │ etc.   │
└─────────────────────────────────────────────────────────┘
```

## 📦 Componentes

### 1. LangChain Tools

#### SQL Query Tool
```typescript
import { sqlQueryTool } from '@/lib/orchestration/tools'

// Executa queries SQL seguras em dados SPED
const result = await sqlQueryTool.invoke({
  query: 'SELECT * FROM chart_of_accounts',
  organizationId: 'org-123',
})
```

**Recursos:**
- Sanitização automática de SQL
- Proteção contra SQL injection
- Filtro automático por `organizationId`
- Limite de 100 registros

#### Vector Search Tool
```typescript
import { vectorSearchTool } from '@/lib/orchestration/tools'

// Busca semântica em documentos
const result = await vectorSearchTool.invoke({
  query: 'cláusulas de rescisão',
  organizationId: 'org-123',
  limit: 10,
  threshold: 0.7,
})
```

**Recursos:**
- Busca por similaridade vetorial
- Integrado com serviço RAG existente
- Filtros por organização e tipo

#### Document Analysis Tool
```typescript
import { documentAnalysisTool } from '@/lib/orchestration/tools'

// Analisa documento com IA
const result = await documentAnalysisTool.invoke({
  documentId: 'doc-123',
  organizationId: 'org-123',
  analysisType: 'anomalies', // ou 'summary', 'key_points', 'compliance'
})
```

**Tipos de análise:**
- `summary`: Resumo executivo
- `key_points`: Pontos-chave
- `anomalies`: Detecção de anomalias
- `compliance`: Avaliação de conformidade

#### Data Validation Tool
```typescript
import { dataValidationTool } from '@/lib/orchestration/tools'

// Valida dados contábeis
const result = await dataValidationTool.invoke({
  organizationId: 'org-123',
  spedFileId: 'sped-123',
  validations: ['debit_credit_balance', 'account_hierarchy'],
  periodDate: '2024-01-31',
})
```

**Validações disponíveis:**
- `debit_credit_balance`: Débito = Crédito
- `account_hierarchy`: Hierarquia de contas
- `period_consistency`: Consistência de saldos
- `balance_integrity`: Integridade de saldos
- `missing_accounts`: Contas faltantes

### 2. Workflow Engine

Executa workflows definidos como grafos LangGraph:

```typescript
import { WorkflowEngine } from '@/lib/orchestration/workflow-engine'

const engine = new WorkflowEngine(graph, context)
const result = await engine.execute()
```

**Tipos de Nodes suportados:**
- `input`: Node de entrada
- `output`: Node de saída
- `tool`: Executa uma tool LangChain
- `llm`: Chamada LLM direta
- `condition`: Avaliação condicional
- `transform`: Transformação de dados

### 3. Queue System (BullMQ)

Sistema de filas para processamento assíncrono:

```typescript
import { enqueueWorkflow } from '@/lib/queue/queue-manager'

const { jobId } = await enqueueWorkflow({
  executionId: 'exec-123',
  workflowTemplateId: 'workflow-123',
  workflowName: 'Validação de Balancete',
  userId: 'user-123',
  organizationId: 'org-123',
  input: { periodDate: '2024-01-31' },
})
```

**Workers disponíveis:**
- `workflow-worker`: Execução de workflows
- `sped-worker`: Processamento SPED
- `embedding-worker`: Geração de embeddings

### 4. Métricas e Observabilidade

Sistema completo de tracking:

```typescript
import { metricsCollector } from '@/lib/orchestration/workflow-metrics'

// Obter métricas de uma execução
const metrics = metricsCollector.get('exec-123')

// Listar todas as métricas
const allMetrics = metricsCollector.listAll()
```

**Métricas coletadas:**
- Duração total
- Steps completados/falhados
- Tokens usados (por modelo)
- Custo (por modelo)
- Erros detalhados

## 🚀 Setup

### 1. Instalar Redis

```bash
# Opção 1: Redis Local
brew install redis
redis-server

# Opção 2: Upstash Redis (recomendado para produção)
# Criar conta em https://upstash.com
```

### 2. Configurar Variáveis de Ambiente

Adicione ao `.env.local`:

```bash
# Redis
REDIS_URL=redis://localhost:6379
# ou Upstash:
# REDIS_URL=rediss://default:***@***.upstash.io:6379

# Worker Config
WORKER_CONCURRENCY=5
WORKFLOW_WORKER_CONCURRENCY=3
SPED_WORKER_CONCURRENCY=2
EMBEDDING_WORKER_CONCURRENCY=5
WORKFLOW_TIMEOUT_MS=300000
WORKFLOW_MAX_RETRIES=3
```

### 3. Rodar Migrations e Seed

```bash
# Gerar migrations
npm run db:generate

# Aplicar migrations
npm run db:migrate

# Popular banco com workflows de exemplo
npm run db:seed
```

### 4. Iniciar Workers

```bash
# Em um terminal separado
npm run worker
```

### 5. Iniciar App

```bash
npm run dev
```

## 📘 Uso

### Criar Workflow Template

```typescript
import { createWorkflow } from '@/lib/services/workflow-service'

const workflow = await createWorkflow({
  name: 'Meu Workflow',
  description: 'Descrição do workflow',
  category: 'fiscal_analysis',
  tags: ['validacao', 'sped'],
  langchainGraph: {
    nodes: [
      {
        id: 'input',
        type: 'input',
        config: {},
      },
      {
        id: 'validate',
        type: 'tool',
        tool: 'data_validation',
        config: {
          validations: ['debit_credit_balance'],
        },
      },
      {
        id: 'output',
        type: 'output',
        config: {},
      },
    ],
    edges: [
      { source: 'input', target: 'validate' },
      { source: 'validate', target: 'output' },
    ],
    entryPoint: 'input',
  },
  inputSchema: { /* JSON Schema */ },
  outputSchema: { /* JSON Schema */ },
  organizationId: 'org-123',
  createdBy: 'user-123',
})
```

### Executar Workflow

```typescript
// Via API
const response = await fetch('/api/workflows/workflow-123/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    input: {
      organizationId: 'org-123',
      periodDate: '2024-01-31',
    },
  }),
})

const { execution, jobId } = await response.json()
```

### Monitorar Execução

```typescript
// Via API de status do job
const response = await fetch(`/api/jobs/${jobId}/status`)

// Via API de execuções
const response = await fetch('/api/workflows/executions')
const { executions } = await response.json()
```

### Obter Métricas

```typescript
// Métricas de uma execução
const response = await fetch(`/api/workflows/metrics?executionId=${executionId}`)
const { metrics } = await response.json()

// Métricas agregadas
const response = await fetch('/api/workflows/metrics')
const { summary, metrics } = await response.json()
```

## 📊 Exemplos de Workflows

### 1. Validação de Balancete

```json
{
  "nodes": [
    {
      "id": "input",
      "type": "input",
      "config": {}
    },
    {
      "id": "validate",
      "type": "tool",
      "tool": "data_validation",
      "config": {
        "validations": [
          "debit_credit_balance",
          "account_hierarchy",
          "period_consistency"
        ]
      }
    },
    {
      "id": "output",
      "type": "output",
      "config": {}
    }
  ],
  "edges": [
    { "source": "input", "target": "validate" },
    { "source": "validate", "target": "output" }
  ],
  "entryPoint": "input"
}
```

### 2. Análise de Documento

```json
{
  "nodes": [
    {
      "id": "input",
      "type": "input",
      "config": {}
    },
    {
      "id": "analyze",
      "type": "tool",
      "tool": "document_analysis",
      "config": {
        "analysisType": "anomalies"
      }
    },
    {
      "id": "output",
      "type": "output",
      "config": {}
    }
  ],
  "edges": [
    { "source": "input", "target": "analyze" },
    { "source": "analyze", "target": "output" }
  ],
  "entryPoint": "input"
}
```

### 3. Busca RAG Inteligente

```json
{
  "nodes": [
    {
      "id": "input",
      "type": "input",
      "config": {}
    },
    {
      "id": "search",
      "type": "tool",
      "tool": "vector_search",
      "config": {
        "limit": 10,
        "threshold": 0.7
      }
    },
    {
      "id": "synthesize",
      "type": "llm",
      "config": {
        "provider": "openai",
        "model": "gpt-4o-mini",
        "prompt": "Com base nos documentos encontrados, sintetize uma resposta clara e objetiva para: {{query}}"
      }
    },
    {
      "id": "output",
      "type": "output",
      "config": {}
    }
  ],
  "edges": [
    { "source": "input", "target": "search" },
    { "source": "search", "target": "synthesize" },
    { "source": "synthesize", "target": "output" }
  ],
  "entryPoint": "input"
}
```

## 🔌 API Reference

### POST /api/workflows/{id}/execute

Executa um workflow.

**Request:**
```json
{
  "input": {
    "organizationId": "org-123",
    "periodDate": "2024-01-31"
  }
}
```

**Response:**
```json
{
  "execution": {
    "id": "exec-123",
    "workflowId": "workflow-123",
    "status": "pending",
    "input": { ... },
    "jobId": "job-123"
  },
  "message": "Workflow enfileirado para execução"
}
```

### GET /api/workflows/executions

Lista execuções de workflows.

**Response:**
```json
{
  "executions": [
    {
      "id": "exec-123",
      "workflowId": "workflow-123",
      "status": "completed",
      "input": { ... },
      "output": { ... },
      "createdAt": "2024-01-15T10:00:00Z",
      "completedAt": "2024-01-15T10:02:30Z"
    }
  ],
  "total": 25
}
```

### GET /api/workflows/metrics

Obtém métricas de execuções.

**Response:**
```json
{
  "summary": {
    "totalExecutions": 100,
    "completedExecutions": 95,
    "failedExecutions": 5,
    "successRate": 95,
    "totalTokens": 150000,
    "totalCost": 0.75
  },
  "metrics": [ ... ]
}
```

## 🚀 Deploy

### Heroku

Adicione ao `Procfile`:

```
web: npm start
worker: npm run worker
```

Configure dynos:

```bash
heroku ps:scale web=1 worker=1
```

### Docker

```dockerfile
# Dockerfile já configurado no projeto

# Build
docker build -t qs-nexus .

# Run web
docker run -p 3000:3000 qs-nexus npm start

# Run worker
docker run qs-nexus npm run worker
```

## 🔍 Troubleshooting

### Redis Connection Error

```bash
# Verificar se Redis está rodando
redis-cli ping
# Deve retornar: PONG

# Verificar URL no .env.local
echo $REDIS_URL
```

### Worker não processa jobs

```bash
# Verificar logs do worker
npm run worker

# Verificar filas no Redis
redis-cli
> KEYS bull:*
```

### Workflow falha

```bash
# Checar logs
npm run dev

# Verificar métricas
curl http://localhost:3000/api/workflows/metrics

# Ver detalhes da execução
curl http://localhost:3000/api/workflows/executions
```

## 📚 Próximos Passos

- [ ] Implementar memória persistente em PostgreSQL
- [ ] Adicionar mais tools (email, webhooks, etc.)
- [ ] UI visual para criar workflows (drag-and-drop)
- [ ] Sistema de agendamento (cron workflows)
- [ ] Suporte a sub-workflows
- [ ] Rate limiting por organização
- [ ] Webhooks para notificações
- [ ] Exportar/importar workflows

