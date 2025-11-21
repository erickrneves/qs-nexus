# Arquitetura do Dashboard RAG

## Visão Geral

O Dashboard RAG é uma aplicação web completa construída com Next.js 14+ (App Router) que fornece uma interface moderna para gerenciar e visualizar o sistema RAG de documentos jurídicos. O dashboard integra-se perfeitamente com o sistema RAG existente, reutilizando serviços e banco de dados.

## Decisões de Arquitetura

### Framework e Tecnologias

- **Next.js 14+ (App Router)**: Framework React com renderização no servidor e roteamento baseado em arquivos
- **NextAuth.js v5 (beta)**: Sistema de autenticação com suporte a JWT
- **Tailwind CSS**: Framework CSS utilitário para estilização
- **shadcn/ui**: Biblioteca de componentes React reutilizáveis e acessíveis
- **Drizzle ORM**: Reutilização do ORM existente para acesso ao banco de dados
- **AI SDK**: Integração com OpenAI para chat RAG com streaming

### Estrutura de Rotas (App Router)

```
app/
├── (auth)/                    # Grupo de rotas de autenticação
│   ├── login/page.tsx        # Página de login
│   └── register/page.tsx     # Página de registro
│
├── (dashboard)/               # Grupo de rotas protegidas
│   ├── layout.tsx            # Layout compartilhado (sidebar + navbar)
│   ├── dashboard/page.tsx    # Dashboard principal (relatórios)
│   ├── upload/page.tsx       # Upload de arquivos
│   ├── files/page.tsx        # Lista de arquivos
│   ├── files/[id]/page.tsx   # Detalhes do arquivo
│   └── chat/page.tsx         # Chat RAG
│
└── api/                       # API Routes
    ├── auth/
    │   ├── [...nextauth]/route.ts  # NextAuth handler
    │   └── register/route.ts        # Registro de usuários
    ├── documents/
    │   ├── stats/route.ts     # Estatísticas do sistema
    │   ├── route.ts           # Listagem de documentos
    │   └── [id]/route.ts     # Detalhes de documento
    ├── upload/route.ts        # Upload de arquivos
    ├── process/
    │   ├── route.ts          # Iniciar processamento
    │   └── [jobId]/stream/route.ts  # SSE para progresso
    └── chat/route.ts          # Chat RAG com streaming
```

## Fluxo de Autenticação

### 1. Registro de Usuário

```
POST /api/auth/register
  ↓
Validação de email único
  ↓
Hash de senha (bcrypt)
  ↓
Criação em rag_users
  ↓
Redirecionamento para /login
```

### 2. Login

```
POST /api/auth/[...nextauth]
  ↓
NextAuth Credentials Provider
  ↓
Verificação de email/senha
  ↓
Geração de JWT
  ↓
Sessão criada
  ↓
Redirecionamento para /dashboard
```

### 3. Proteção de Rotas

O middleware (`middleware.ts`) protege todas as rotas que começam com:

- `/dashboard`
- `/upload`
- `/files`
- `/chat`

Rotas não autenticadas são redirecionadas para `/login`.

### Schema de Usuários

```typescript
// lib/db/schema/rag-users.ts
ragUsers = {
  id: uuid (PK)
  email: string (unique)
  password: string (hashed)
  name: string
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Nota**: A tabela `rag_users` foi criada separadamente para evitar conflitos com qualquer tabela `User` existente no sistema.

## Estrutura de APIs

### Autenticação

#### `POST /api/auth/register`

Registra novo usuário no sistema.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "senha123",
  "name": "Nome do Usuário"
}
```

**Response:**

```json
{
  "message": "Usuário criado com sucesso",
  "userId": "uuid"
}
```

#### `POST /api/auth/[...nextauth]`

Handler do NextAuth para autenticação (login/logout).

### Documentos

#### `GET /api/documents/stats`

Retorna estatísticas gerais do sistema.

**Response:**

```json
{
  "summary": {
    "total": 100,
    "pending": 10,
    "processing": 5,
    "completed": 80,
    "failed": 3,
    "rejected": 2,
    "progress": 80
  },
  "byArea": [...],
  "byDocType": [...],
  "gold": 50,
  "silver": 30,
  "recentFiles": [...]
}
```

**Cache**: 30 segundos (`revalidate = 30`)

#### `GET /api/documents?page=1&limit=20&status=completed&area=...&docType=...`

Lista documentos com paginação e filtros.

**Query Params:**

- `page`: Número da página (padrão: 1)
- `limit`: Itens por página (padrão: 20)
- `status`: Filtrar por status (pending, processing, completed, failed, rejected)
- `area`: Filtrar por área jurídica
- `docType`: Filtrar por tipo de documento

**Response:**

```json
{
  "files": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

**Cache**: 10 segundos (`revalidate = 10`)

#### `GET /api/documents/[id]`

Retorna detalhes completos de um documento.

**Response:**

```json
{
  "file": {...},
  "template": {...} | null,
  "chunks": [...]
}
```

**Cache**: 60 segundos (`revalidate = 60`)

### Upload e Processamento

#### `POST /api/upload`

Recebe arquivos via multipart/form-data.

**Request:** `FormData` com campo `files` (múltiplos arquivos)

**Validações:**

- Apenas arquivos `.docx`
- Tamanho máximo: 50MB por arquivo

**Response:**

```json
{
  "message": "N arquivo(s) enviado(s) com sucesso",
  "files": [
    {
      "name": "arquivo.docx",
      "size": 1024,
      "path": "/uploads/temp/arquivo.docx"
    }
  ]
}
```

#### `POST /api/process`

Inicia processamento de arquivos enviados.

**Request:**

```json
{
  "files": [
    {
      "name": "arquivo.docx",
      "path": "/uploads/temp/arquivo.docx"
    }
  ]
}
```

**Response:**

```json
{
  "jobId": "uuid",
  "message": "N arquivo(s) iniciado(s) para processamento",
  "files": [...]
}
```

**Nota**: Atualmente, a API apenas marca os arquivos como "processing" e copia para o diretório de processamento. A integração completa com o pipeline RAG (process → filter → classify → chunk → embed → store) está pendente.

#### `GET /api/process/[jobId]/stream`

Server-Sent Events (SSE) para acompanhar progresso do processamento.

**Response:** Stream de eventos SSE

**Eventos:**

- `progress`: Atualização de progresso
- `job-complete`: Processamento concluído

**Nota**: Atualmente implementado com simulação. Precisa ser conectado ao sistema de processamento real.

### Chat RAG

#### `POST /api/chat`

Chat com RAG usando busca vetorial e OpenAI.

**Request:**

```json
{
  "message": "Qual é a lei sobre...?",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

**Response:** Stream de texto (via AI SDK)

**Fluxo:**

1. Gera embedding da query usando `generateEmbedding`
2. Busca chunks similares no banco (cosine similarity via pgvector)
3. Constrói contexto RAG com chunks encontrados
4. Chama OpenAI (GPT-4o-mini) com contexto
5. Retorna resposta via streaming

## Fluxo RAG no Chat

```
Query do Usuário
  ↓
generateEmbedding(query)
  ↓
Busca vetorial (pgvector)
  SELECT ... ORDER BY embedding <=> query_embedding
  ↓
Chunks similares (similarity >= 0.7)
  ↓
Construção de contexto RAG
  ↓
Prompt para OpenAI:
  - Sistema: Instruções RAG
  - Contexto: Chunks encontrados
  - Histórico: Últimas 6 mensagens
  - Usuário: Query atual
  ↓
OpenAI GPT-4o-mini
  ↓
Streaming de resposta
```

### Serviços RAG

#### `lib/services/rag-search.ts`

**Função principal:**

```typescript
searchSimilarChunks(
  query: string,
  limit: number = 10,
  minSimilarity: number = 0.7
): Promise<SimilarChunk[]>
```

- Gera embedding da query
- Busca no banco usando operador `<=>` (cosine distance) do pgvector
- Retorna chunks ordenados por similaridade

**Função com filtros:**

```typescript
searchSimilarChunksWithFilters(
  query: string,
  options: {
    limit?: number;
    minSimilarity?: number;
    area?: string;
    docType?: string;
    onlyGold?: boolean;
  }
): Promise<SimilarChunk[]>
```

#### `lib/services/rag-chat.ts`

**Função principal:**

```typescript
chatWithRAG(
  message: string,
  history: Message[] = [],
  options: {...}
): Promise<ChatResponse>
```

- Orquestra busca RAG e geração de resposta
- Constrói contexto a partir de chunks
- Chama OpenAI com prompt estruturado

**Nota**: A API de chat (`/api/chat`) usa busca direta via `rag-search.ts` em vez de `rag-chat.ts` para ter mais controle sobre o streaming.

## Estrutura de Layout

### Layout Principal (`app/(dashboard)/layout.tsx`)

```
┌─────────────────────────────────────┐
│  Sidebar (desktop) │  Navbar        │
│                    ├───────────────┤
│                    │               │
│                    │   Content     │
│                    │   (children) │
│                    │               │
└─────────────────────────────────────┘
```

**Responsividade:**

- **Desktop**: Sidebar fixa à esquerda
- **Mobile**: Sidebar oculta, menu hamburger no Navbar (Sheet drawer)

### Componentes de Layout

#### `components/layout/Sidebar.tsx`

- Navegação principal
- Links: Dashboard, Upload, Arquivos, Chat
- Ícones (lucide-react)
- Estado ativo baseado em rota

#### `components/layout/Navbar.tsx`

- Logo/título do sistema
- UserButton (menu de usuário)
- Informações do usuário logado
- Menu hamburger (mobile)

#### `components/layout/LogoutButton.tsx`

- Botão de logout
- Usa `signOut` do NextAuth

## Integração com Sistema RAG Existente

### Serviços Reutilizados

- ✅ `lib/services/file-tracker.ts` - Tracking de arquivos
- ✅ `lib/services/docx-converter.ts` - Conversão DOCX → Markdown
- ✅ `lib/services/classifier.ts` - Classificação de documentos
- ✅ `lib/services/chunker.ts` - Chunking de documentos
- ✅ `lib/services/embedding-generator.ts` - Geração de embeddings
- ✅ `lib/services/store-embeddings.ts` - Armazenamento de embeddings
- ✅ `lib/db/schema/rag.ts` - Schemas do banco de dados
- ✅ `lib/db/index.ts` - Conexão Drizzle

### Banco de Dados

O dashboard usa o mesmo banco de dados Neon PostgreSQL:

- Tabelas existentes: `document_files`, `templates`, `template_chunks`
- Nova tabela: `rag_users` (autenticação)

### Pipeline de Processamento

**Status Atual:**

- ✅ Upload de arquivos funcionando
- ✅ Marcação de arquivos como "processing"
- ⚠️ **Pendente**: Integração completa com pipeline RAG
  - Processamento assíncrono
  - Execução dos scripts (process → filter → classify → chunk → embed → store)
  - Feedback de progresso real via SSE

## Decisões de Design

### UI/UX

- **shadcn/ui**: Todos os componentes seguem o design system do shadcn
- **Tailwind CSS**: Estilização via classes utilitárias
- **Mobile-first**: Design responsivo com breakpoints do Tailwind
- **Loading States**: Skeletons para melhor UX durante carregamento
- **Error Handling**: Error boundaries e mensagens amigáveis
- **Toasts**: Notificações via `react-hot-toast`

### Performance

- **Cache**: APIs usam `revalidate` para cache de respostas
- **Paginação**: Listagens sempre paginadas
- **Lazy Loading**: Componentes pesados carregados sob demanda
- **Streaming**: Chat usa streaming para melhor UX

### Segurança

- **Autenticação**: NextAuth com JWT
- **Hash de Senhas**: bcrypt
- **Validação**: Validação de inputs (formato, tamanho)
- **Proteção de Rotas**: Middleware protege rotas sensíveis
- **Sanitização**: Uploads validados antes de processamento

## Estrutura de Componentes

### Componentes UI (shadcn)

Localização: `components/ui/`

- `button.tsx`
- `card.tsx`
- `input.tsx`
- `badge.tsx`
- `progress.tsx`
- `table.tsx`
- `label.tsx`
- `select.tsx`
- `textarea.tsx`
- `scroll-area.tsx`
- `sheet.tsx`
- `skeleton.tsx`
- `tooltip.tsx`
- `alert-dialog.tsx`

### Componentes de Dashboard

Localização: `components/dashboard/`

- `stats-cards.tsx` - Cards de estatísticas
- `status-chart.tsx` - Gráfico de pizza (status)
- `area-chart.tsx` - Gráfico de barras (áreas)
- `recent-files.tsx` - Lista de arquivos recentes

### Componentes de Upload

Localização: `components/upload/`

- `file-upload.tsx` - Drag & drop, seleção múltipla
- `processing-progress.tsx` - Progresso via SSE

### Componentes de Arquivos

Localização: `components/files/`

- `file-list.tsx` - Tabela de arquivos com filtros

### Componentes de Chat

Localização: `components/chat/`

- `chat-interface.tsx` - Interface completa de chat

### Componentes de Layout

Localização: `components/layout/`

- `sidebar.tsx`
- `navbar.tsx`
- `logout-button.tsx`

### Componentes Utilitários

- `error-boundary.tsx` - Error boundary global
- `loading-skeletons.tsx` - Skeletons de loading
- `confirm-dialog.tsx` - Diálogo de confirmação

## Hooks Customizados

### `hooks/use-process-stream.ts`

Hook para gerenciar conexão SSE de processamento:

```typescript
const { progress, status, error } = useProcessStream(jobId)
```

## Variáveis de Ambiente

```env
# Banco de dados (existente)
DATABASE_URL=postgresql://...

# OpenAI (existente)
OPENAI_API_KEY=sk-...

# NextAuth (novo)
NEXTAUTH_SECRET=... # Gerar secret aleatório
NEXTAUTH_URL=http://localhost:3000
```

## Próximos Passos

1. **Integração Pipeline RAG**: Conectar API de processamento com pipeline completo
2. **Reprocessamento**: Funcionalidade para reprocessar arquivos falhados
3. **Melhorias de Performance**: Otimizações adicionais de cache e queries
4. **Testes**: Testes unitários e de integração (opcional)

## Referências

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js v5 Documentation](https://authjs.dev/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [AI SDK Documentation](https://ai-sdk.dev/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
