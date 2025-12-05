# QS Nexus

**Plataforma Multi-tenant de Análise Fiscal e Contábil com IA**

QS Nexus é um sistema RAG (Retrieval-Augmented Generation) multi-tenant com orquestração de agentes LangChain, especializado em análise de documentos SPED, fiscais e contábeis para consultoria tributária e empresarial.

[![Deploy no Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/erickrneves/qs-nexus)

## 🚀 Deploy Rápido

- **Heroku**: Ver [`DEPLOY.md`](./DEPLOY.md) para instruções completas
- **Docker**: `docker-compose up`
- **Local**: `npm install && npm run dev`

## Características

- 🔄 **Ingestão Multi-formato**: Suporte a SPED, CSV, TXT, PDF e DOCX
- 📊 **Normalização SQL**: Dados estruturados para queries analíticas
- 🔍 **Busca Vetorial**: Embeddings para busca semântica
- 🤖 **Agente Inteligente**: OpenAI Assistants com acesso a SQL e RAG
- 📈 **Dashboard Analítico**: Visualização de dados contábeis
- 🔐 **Autenticação Segura**: Stack Auth (Neon Auth)

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                       QS NEXUS                               │
├─────────────────────────────────────────────────────────────┤
│  INGESTÃO                                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │  SPED    │  │   CSV    │  │ PDF/TXT  │                   │
│  │ Parser   │  │  Parser  │  │ Parser   │                   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                   │
│       └────────────┬────────────┘                           │
│                    ▼                                         │
│  ┌─────────────────────────────────────────────────┐        │
│  │            Normalização de Dados                 │        │
│  └─────────────────────────────────────────────────┘        │
├─────────────────────────────────────────────────────────────┤
│  ARMAZENAMENTO (NeonDB)                                      │
│  ┌────────────────────┐  ┌────────────────────┐             │
│  │   SQL Normalizado  │  │   Vector Storage   │             │
│  └────────────────────┘  └────────────────────┘             │
├─────────────────────────────────────────────────────────────┤
│  ORQUESTRAÇÃO (OpenAI Assistants)                           │
│  ┌─────────────────────────────────────────────────┐        │
│  │  Agente com Tools: sql_query, vector_search     │        │
│  └─────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## Pré-requisitos

- Node.js 18+
- PostgreSQL com extensão pgvector (NeonDB recomendado)
- Conta OpenAI com API key
- Stack Auth configurado

## Instalação

```bash
npm install
```

## Configuração

1. Copie `.env.local.example` para `.env.local`
2. Configure as variáveis de ambiente:
   - `DATABASE_URL`: String de conexão do NeonDB
   - `OPENAI_API_KEY`: Chave da API OpenAI
   - `OPENAI_ASSISTANT_ID`: ID do Assistant configurado
   - `STACK_*`: Credenciais do Stack Auth

## Setup do Banco de Dados

### 1. Habilitar pgvector no Neon:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. Executar Migrations:

```bash
npm run db:migrate
```

## Uso

### Pipeline de Ingestão

```bash
# 1. Processar documentos (SPED/CSV/PDF → normalização)
npm run rag:process

# 2. Filtrar documentos
npm run rag:filter

# 3. Classificar documentos
npm run rag:classify

# 4. Gerar chunks
npm run rag:chunk

# 5. Gerar embeddings
npm run rag:embed

# 6. Armazenar no banco
npm run rag:store
```

### Desenvolvimento

```bash
npm run dev      # Inicia servidor de desenvolvimento
npm run build    # Build para produção
npm run start    # Inicia servidor de produção
```

### Utilitários

```bash
npm run rag:status        # Gerar relatório de status
npm run rag:reprocess     # Reprocessar arquivo específico
npm run db:studio         # Abrir Drizzle Studio
```

## 🔧 Configuração do Cursor (MCP GitHub)

Para desenvolvedores usando o Cursor IDE, você pode configurar a integração com GitHub via MCP (Model Context Protocol):

```bash
./scripts/setup-github-mcp.sh
```

Ou consulte a [documentação completa de configuração MCP](CONFIGURACAO_MCP.md).

Benefícios:
- 📋 Acesso direto a PRs, issues e commits via AI
- 🔍 Contexto enriquecido do repositório
- 🤖 Melhor compreensão do histórico do projeto

## Estrutura do Projeto

```
qs-nexus/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── (auth)/            # Páginas de autenticação
│   └── (dashboard)/       # Páginas do dashboard
├── components/            # Componentes React
├── lib/
│   ├── db/               # Schema e migrations
│   ├── services/         # Serviços principais
│   │   ├── sped-parser.ts
│   │   ├── csv-parser.ts
│   │   ├── agent-orchestrator.ts
│   │   └── ...
│   └── types/            # Tipos TypeScript
├── scripts/              # Scripts do pipeline
└── docs/                 # Documentação
```

## Formatos Suportados

### SPED (Sistema Público de Escrituração Digital)

- ECD (Escrituração Contábil Digital)
- ECF (Escrituração Contábil Fiscal)
- EFD (Escrituração Fiscal Digital)

### CSV

- Detecção automática de delimitador
- Suporte a múltiplos encodings
- Mapeamento configurável de colunas

### Documentos

- PDF (com OCR quando necessário)
- TXT
- DOCX

## Deploy

### Heroku

```bash
# Criar Procfile
echo "web: npm start" > Procfile

# Configurar variáveis no Heroku Dashboard
heroku config:set DATABASE_URL=...
heroku config:set OPENAI_API_KEY=...
```

## Licença

Proprietário - QS Consultoria © 2025
