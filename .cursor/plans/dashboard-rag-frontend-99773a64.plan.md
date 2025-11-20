<!-- 99773a64-abf9-4bc0-8e8c-6a72e5017967 a7614043-42cc-4ac9-9181-90ce803ce5f2 -->

# Dashboard RAG Frontend - Plano de Implementação

## Visão Geral

Criar um dashboard web completo em Next.js para gerenciar e visualizar o sistema RAG de documentos jurídicos. O dashboard incluirá autenticação, relatórios, upload de arquivos, processamento e interface de chat para testar o RAG.

## Acompanhamento de Progresso

**IMPORTANTE**: Durante a execução do plano:

1.  **Marcação de Tarefas**: Cada tarefa concluída será marcada como concluída alterando `- [ ]` para `- [x]` no arquivo do plano. Isso permite acompanhar o progresso em tempo real e identificar quais etapas já foram completadas.

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - `- [ ]` = Tarefa pendente
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - `- [x]` = Tarefa concluída

2.  **Confirmação entre Fases**: Ao final de cada **Fase** (Fase 1, Fase 2, etc.), o sistema perguntará ao usuário se deseja continuar para a próxima fase antes de prosseguir. Isso permite:

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Revisar o que foi feito
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Testar funcionalidades implementadas
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Fazer ajustes se necessário
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Pausar e retomar em outro momento

3.  **Passos Bem Definidos**: Cada fase está dividida em subseções numeradas (ex: 1.1, 1.2, 1.3) que representam passos claros e sequenciais. Cada passo contém tarefas específicas e acionáveis.

4.  **Documentação de Progresso**: A cada passo finalizado, é obrigatório documentar o progresso em `docs/implementation-progress/`:

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Criar/atualizar arquivo de progresso por fase (ex: `docs/implementation-progress/fase-1-setup.md`)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Documentar o que foi implementado, decisões tomadas, problemas encontrados e soluções
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Incluir exemplos de código quando relevante
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Manter histórico cronológico do desenvolvimento
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - **Formato**: Markdown com estrutura clara (data, tarefas concluídas, notas técnicas)

5.  **Documentação Técnica**: Após cada fase concluída, criar/atualizar documentação técnica em `/docs` seguindo a estrutura semântica existente:

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - **Arquitetura**: `docs/architecture/DASHBOARD.md` - Arquitetura do dashboard, decisões técnicas, estrutura de rotas, APIs
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - **Guias**: `docs/guides/dashboard.md` - Guias de uso do dashboard (autenticação, upload, chat, etc.)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - **Referência**: `docs/reference/dashboard-api.md` - Referência técnica das APIs do dashboard
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - **Atualizar**: `docs/INDEX.md` com links para nova documentação
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - Manter consistência com a documentação existente do projeto

## Estrutura do Projeto

### Decisões de Arquitetura

- **Framework**: Next.js 14+ (App Router)
- **Autenticação**: NextAuth.js com credenciais (email/senha)
- **Banco de Dados**: Reutilizar Neon PostgreSQL existente + nova tabela `rag_users` (evitar conflito com tabela `User` existente)
- **UI**: Tailwind CSS + shadcn/ui (componentes reutilizáveis)
- **API**: Next.js API Routes (App Router)
- **Upload**: Multipart/form-data com suporte a múltiplos arquivos e pastas

## Fase 1: Setup do Projeto Next.js (Integrado)

### 1.1. Integração Next.js no Projeto Atual

- [x] Instalar Next.js no projeto atual: `npm install next react react-dom`
- [x] Criar estrutura `app/` na raiz do projeto (não em pasta separada)
- [x] Configurar `next.config.js` para compatibilidade com scripts existentes
- [x] Atualizar `package.json` com scripts Next.js: - `dev`: `next dev` - `build`: `next build` - `start`: `next start`
- [x] Manter scripts RAG existentes intactos (`rag:process`, `rag:filter`, etc.)
- [x] Configurar TypeScript (já existe, apenas ajustar `tsconfig.json` se necessário)

### 1.2. Configuração de Tailwind e shadcn/ui

- [x] Instalar e configurar Tailwind CSS: - `npm install -D tailwindcss postcss autoprefixer` - Criado `tailwind.config.js` manualmente (CLI falhou devido a type: module) - Configurar `tailwind.config.js` com paths corretos
- [x] Instalar shadcn/ui: - Criado `components.json` manualmente - Configurar `components.json` - Instalar componentes base: Button, Card, Input, Badge, Progress, Table, Label, Select

### 1.3. Configuração de Ambiente

- [x] Verificar/criar `.env.local.example` e adicionar variáveis: - `DATABASE_URL` (já existe - manter) - `OPENAI_API_KEY` (já existe - manter) - `NEXTAUTH_SECRET` (novo - gerar secret aleatório) - `NEXTAUTH_URL` (novo - ex: `http://localhost:3000`)
- [x] Usuário deve copiar novas variáveis para `.env.local` existente (documentado)
- [x] Reutilizar conexão Drizzle existente em `lib/db/index.ts`

### 1.4. Estrutura de Pastas (Integrada)

```
lw-rag-system/
├── app/                    # NOVO - Next.js App Router
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── upload/
│   │   ├── files/
│   │   ├── files/[id]/
│   │   └── chat/
│   ├── api/
│   │   ├── auth/
│   │   ├── documents/
│   │   ├── upload/
│   │   ├── process/
│   │   │   └── [jobId]/
│   │   │       └── stream/  # SSE endpoint
│   │   └── chat/
│   └── layout.tsx
├── components/             # NOVO
│   ├── ui/ (shadcn components)
│   ├── dashboard/
│   ├── upload/
│   ├── files/
│   ├── chat/
│   └── layout/
├── hooks/                  # NOVO
│   └── useProcessStream.ts
├── lib/                    # EXISTENTE - reutilizar
│   ├── db/                 # EXISTENTE
│   │   └── schema/
│   │       └── rag-users.ts  # NOVO
│   ├── services/           # EXISTENTE - reutilizar todos
│   │   └── rag-search.ts   # NOVO
│   ├── auth/               # NOVO
│   └── utils/              # EXISTENTE
├── scripts/                # EXISTENTE - manter intacto
├── types/                  # EXISTENTE
└── ... (resto do projeto)
```

### 1.5. Documentação da Fase 1

- [x] Criar `docs/implementation-progress/fase-1-setup.md`: - Documentar instalação do Next.js - Configuração do Tailwind e shadcn/ui - Estrutura de pastas criada - Decisões técnicas (integração no projeto existente) - Problemas encontrados e soluções

## Fase 2: Autenticação

### 2.1. Schema de Usuários

- [x] Criar migration para tabela `rag_users`: - `id` (UUID) - `email` (unique) - `password` (hashed) - `name` - `createdAt`, `updatedAt`
- [x] Adicionar schema Drizzle em `lib/db/schema/rag-users.ts`

### 2.2. NextAuth.js Setup

- [x] Instalar `next-auth@beta` e dependências
- [x] Criar `lib/auth/config.ts` com configuração NextAuth v5
- [x] Configurar provider de credenciais
- [x] Criar API route `app/api/auth/[...nextauth]/route.ts`
- [x] Criar middleware para proteger rotas

### 2.3. Páginas de Autenticação

- [x] Criar `app/(auth)/login/page.tsx`: - Formulário de login - Validação básica (Zod pode ser adicionado depois) - Redirecionamento após login
- [x] Criar `app/(auth)/register/page.tsx`: - Formulário de registro - Hash de senha (bcrypt) - Validação de email único

### 2.4. Documentação da Fase 2

- [x] Atualizar `docs/implementation-progress/fase-2-autenticacao.md`: - Schema de usuários criado - Configuração do NextAuth.js - Páginas de autenticação implementadas - Decisões de segurança (hash de senha, validações)
- [ ] Atualizar `docs/architecture/DASHBOARD.md` (seção de autenticação) - PENDENTE

## Fase 3: Dashboard Principal (Relatórios)

### 3.1. API de Estatísticas

- [x] Criar `app/api/documents/stats/route.ts`: - Endpoint GET que retorna: - Total de documentos - Por status (pending, processing, completed, failed, rejected) - Por área jurídica - Por tipo de documento - Progresso geral (%) - Documentos GOLD/SILVER
- [x] Reutilizar lógica de `scripts/generate-status-report.ts`

### 3.2. Componentes de Dashboard

- [x] Criar `components/dashboard/StatsCards.tsx`: - Cards com métricas principais - Ícones e cores por status
- [x] Criar `components/dashboard/StatusChart.tsx`: - Gráfico de pizza com distribuição de status - Usar recharts
- [x] Criar `components/dashboard/AreaChart.tsx`: - Gráfico de barras de distribuição por área jurídica
- [x] Criar `components/dashboard/RecentFiles.tsx`: - Lista dos últimos arquivos processados - Link para detalhes

### 3.3. Página do Dashboard

- [x] Criar `app/(dashboard)/dashboard/page.tsx`: - Layout com sidebar/navbar (via layout.tsx) - Grid de componentes de estatísticas - Atualização automática (polling a cada 30 segundos)

### 3.4. Documentação da Fase 3

- [x] Atualizar `docs/implementation-progress/fase-3-dashboard.md`: - APIs de estatísticas implementadas - Componentes de dashboard criados - Integração com dados existentes
- [ ] Atualizar `docs/guides/dashboard.md` (seção de relatórios) - PENDENTE
- [ ] Atualizar `docs/reference/dashboard-api.md` (endpoints de estatísticas) - PENDENTE

## Fase 4: Upload de Arquivos

### 4.1. Componente de Upload

- [x] Criar `components/upload/FileUpload.tsx`: - Drag & drop de arquivos - Seleção múltipla de arquivos - Botão para escolher pasta (`<input webkitdirectory>`) - Preview de arquivos selecionados - Validação (apenas .docx) - Validação de tamanho (50MB)

### 4.2. API de Upload

- [x] Criar `app/api/upload/route.ts`: - POST endpoint para receber arquivos - Salvar arquivos temporariamente em `uploads/temp/` - Validar formato (.docx) - Retornar lista de arquivos recebidos
- [x] Implementar upload multipart/form-data
- [x] Limitar tamanho de arquivo (50MB por arquivo)

### 4.3. API de Processamento

- [x] Criar `app/api/process/route.ts`: - POST endpoint que recebe lista de arquivos - Para cada arquivo: - Copiar para diretório de processamento - Marcar como em processamento via `markFileProcessing` - Retornar job ID para tracking
- [x] Integrar parcialmente com serviços existentes: - `lib/services/file-tracker.ts` - ✅ Integrado - ⚠️ Pipeline completo (process → filter → classify → chunk → embed → store) - PENDENTE integração completa

### 4.4. API de Progresso via SSE (Server-Sent Events)

- [x] Criar `app/api/process/[jobId]/stream/route.ts`: - GET endpoint que retorna SSE stream - Enviar eventos em tempo real
- [x] Criar `hooks/use-process-stream.ts`: - Hook customizado para gerenciar conexão SSE
- [x] Criar `components/upload/processing-progress.tsx`: - Componente com barras de progresso - Lista de arquivos com status individual - Badges coloridos por status

### 4.5. Página de Upload

- [x] Criar `app/(dashboard)/upload/page.tsx`: - Componente FileUpload - Botão "Processar Arquivos" - Componente ProcessingProgress quando job ativo - Status em tempo real via SSE

### 4.6. Documentação da Fase 4

- [x] Atualizar `docs/implementation-progress/fase-4-upload.md`: - Componente de upload implementado - APIs de upload e processamento - Integração parcial com pipeline RAG existente - Decisões sobre upload de pastas e múltiplos arquivos - Sistema SSE para feedback de progresso
- [ ] Atualizar `docs/guides/dashboard.md` (seção de upload) - PENDENTE
- [ ] Atualizar `docs/reference/dashboard-api.md` (endpoints de upload/processamento) - PENDENTE

## Fase 5: Lista e Detalhes de Arquivos

### 5.1. API de Listagem

- [x] Criar `app/api/documents/route.ts`: - GET: Lista paginada de documentos - Query params: `page`, `limit`, `status`, `area`, `docType` - Retornar: `document_files` + join com `templates`
- [x] Criar `app/api/documents/[id]/route.ts`: - GET: Detalhes completos de um documento - Incluir: status, metadados, chunks, template completo

### 5.2. Componentes de Lista

- [x] Criar `components/files/FileList.tsx`: - Tabela com colunas: nome, status, área, tipo, data - Badges coloridos por status - Link para detalhes
- [ ] Criar `components/files/FileCard.tsx`: - Card para visualização em grid (alternativa) - OPCIONAL, NÃO IMPLEMENTADO

### 5.3. Página de Lista

- [x] Criar `app/(dashboard)/files/page.tsx`: - Componente FileList - Filtros por status - Integração com API

### 5.4. Página de Detalhes

- [x] Criar `app/(dashboard)/files/[id]/page.tsx`: - Informações do arquivo (status, hash, palavras) - Metadados do template (se processado) - Preview do markdown (truncado) - Lista de chunks (se disponível) - Botão "Reprocessar" (se falhou - funcionalidade pendente)

### 5.5. Documentação da Fase 5

- [x] Atualizar `docs/implementation-progress/fase-5-lista-detalhes.md`: - APIs de listagem e detalhes implementadas - Componentes de lista e detalhes - Filtros implementados
- [ ] Atualizar `docs/guides/dashboard.md` (seção de arquivos) - PENDENTE
- [ ] Atualizar `docs/reference/dashboard-api.md` (endpoints de documentos) - PENDENTE

## Fase 6: Chat RAG

### 6.1. Serviço de Busca RAG

- [x] Criar `lib/services/rag-search.ts`: - Função `searchSimilarChunks(query: string, limit: number)`: - Gerar embedding da query usando `generateEmbedding` - Buscar chunks similares no banco (cosine similarity) - Query SQL: `SELECT ... ORDER BY embedding <=> $1 LIMIT $2` - Retornar chunks com similaridade e contexto
- [x] Criar `lib/services/rag-chat.ts`: - Função `chatWithRAG(message: string, history: Message[])`: - Buscar chunks relevantes - Construir contexto para prompt - Chamar OpenAI (GPT-4o-mini) com contexto RAG - Retornar resposta

### 6.2. API de Chat

- [x] Criar `app/api/chat/route.ts`: - POST endpoint para mensagens - Usar AI SDK (`ai` package) - Integrar com `rag-search.ts` (busca direta na API) - Streaming de resposta (implementado)

### 6.3. Componente de Chat

- [x] Criar `components/chat/ChatInterface.tsx`: - Interface usando `useChat` hook do AI SDK - Input de mensagem (textarea auto-ajustável) - Histórico de conversa - Indicador de digitação - Botão de limpar

### 6.4. Página de Chat

- [x] Criar `app/(dashboard)/chat/page.tsx`: - Componente ChatInterface - Layout responsivo - Instruções de uso (na interface)

### 6.5. Documentação da Fase 6

- [x] Atualizar `docs/implementation-progress/fase-6-chat-rag.md`: - Serviços de busca RAG implementados - API de chat com streaming - Interface de chat - Integração com embeddings existentes
- [ ] Atualizar `docs/guides/dashboard.md` (seção de chat) - PENDENTE
- [ ] Atualizar `docs/reference/dashboard-api.md` (endpoint de chat) - PENDENTE
- [ ] Atualizar `docs/architecture/DASHBOARD.md` (fluxo RAG) - PENDENTE

## Fase 7: Layout e Navegação

### 7.1. Layout Principal

- [x] Criar `app/(dashboard)/layout.tsx`: - Sidebar com navegação - Navbar com user menu - Proteção de rotas (middleware)
- [x] Criar `components/layout/Sidebar.tsx`: - Links: Dashboard, Upload, Arquivos, Chat - Ícones (lucide-react)
- [x] Criar `components/layout/Navbar.tsx`: - Logo/título - UserButton (logout) - Informações do usuário logado

### 7.2. Responsividade

- [x] Mobile-first design
- [x] Sidebar colapsável em mobile (Sheet drawer)
- [x] Tabelas responsivas (cards em mobile)

### 7.3. Documentação da Fase 7

- [x] Atualizar `docs/implementation-progress/fase-7-layout-navegacao.md`: - Layout principal implementado - Componentes de navegação - Responsividade
- [ ] Atualizar `docs/architecture/DASHBOARD.md` (estrutura de layout) - PENDENTE

## Fase 8: Melhorias e Polimento

### 8.1. Tratamento de Erros

- [x] Error boundaries
- [x] Mensagens de erro amigáveis
- [x] Logging de erros

### 8.2. Performance

- [x] Loading states (skeletons)
- [x] Otimização de queries (índices já existem)
- [x] Cache de estatísticas (revalidate)

### 8.3. UX

- [x] Toasts/notificações (react-hot-toast) - melhorado
- [x] Confirmações para ações destrutivas
- [x] Tooltips e ajuda contextual

### 8.4. Testes (Opcional)

- [ ] Testes de componentes críticos - OPCIONAL, NÃO IMPLEMENTADO
- [ ] Testes de API - OPCIONAL, NÃO IMPLEMENTADO

### 8.5. Documentação Final da Fase 8

- [x] Atualizar `docs/implementation-progress/fase-8-melhorias.md`: - Melhorias implementadas - Tratamento de erros - Otimizações de performance - Melhorias de UX
- [ ] Finalizar `docs/architecture/DASHBOARD.md` (arquitetura completa) - PENDENTE
- [ ] Finalizar `docs/guides/dashboard.md` (guia completo) - PENDENTE
- [ ] Finalizar `docs/reference/dashboard-api.md` (referência completa) - PENDENTE
- [ ] Atualizar `docs/INDEX.md` com todas as novas seções - PENDENTE
- [ ] Revisar toda a documentação criada para consistência - PENDENTE

## Dependências Principais (Adicionar ao package.json existente)

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "next-auth": "^5.0.0",
    "@auth/drizzle-adapter": "^1.0.0",
    "bcryptjs": "^2.4.3",
    "@types/bcryptjs": "^2.4.6",
    "react-hook-form": "^7.48.0",
    "@hookform/resolvers": "^3.3.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "recharts": "^2.10.0",
    "react-hot-toast": "^2.4.0",
    "lucide-react": "^0.294.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.1.0"
  }
}
```

**Nota**: `ai`, `@ai-sdk/openai`, `drizzle-orm`, `postgres`, `zod` já existem no projeto.

## Arquivos Principais a Criar/Modificar

### Novos Arquivos

- `dashboard/app/(auth)/login/page.tsx`
- `dashboard/app/(auth)/register/page.tsx`
- `dashboard/app/(dashboard)/dashboard/page.tsx`
- `dashboard/app/(dashboard)/upload/page.tsx`
- `dashboard/app/(dashboard)/files/page.tsx`
- `dashboard/app/(dashboard)/files/[id]/page.tsx`
- `dashboard/app/(dashboard)/chat/page.tsx`
- `dashboard/app/api/auth/[...nextauth]/route.ts`
- `dashboard/app/api/documents/stats/route.ts`
- `dashboard/app/api/documents/route.ts`
- `dashboard/app/api/documents/[id]/route.ts`
- `dashboard/app/api/upload/route.ts`
- `dashboard/app/api/process/route.ts`
- `dashboard/app/api/chat/route.ts`
- `dashboard/lib/services/rag-search.ts`
- `dashboard/lib/services/rag-chat.ts`
- `dashboard/lib/db/schema/users.ts`
- `dashboard/lib/auth/config.ts`

### Arquivos a Reutilizar (do projeto RAG)

- `lib/services/file-tracker.ts`
- `lib/services/docx-converter.ts`
- `lib/services/classifier.ts`
- `lib/services/chunker.ts`
- `lib/services/embedding-generator.ts`
- `lib/services/store-embeddings.ts`
- `lib/db/schema/rag.ts`
- `lib/db/index.ts`

## Documentação

### Estrutura de Documentação

A documentação deve seguir a estrutura semântica existente em `/docs`:

```
docs/
├── implementation-progress/     # NOVO - Progresso da implementação
│   ├── fase-1-setup.md         # Progresso da Fase 1
│   ├── fase-2-autenticacao.md  # Progresso da Fase 2
│   ├── fase-3-dashboard.md     # Progresso da Fase 3
│   └── ...                     # Uma por fase
│
├── architecture/               # EXISTENTE
│   ├── ARQUITETURA.md         # Arquitetura geral (atualizar)
│   ├── DADOS.md               # Schema de dados (atualizar)
│   └── DASHBOARD.md            # NOVO - Arquitetura do dashboard
│
├── guides/                     # EXISTENTE
│   ├── classificacao.md       # Guias existentes
│   ├── paralelizacao.md
│   ├── troubleshooting.md
│   └── dashboard.md            # NOVO - Guia de uso do dashboard
│
└── reference/                  # EXISTENTE
    ├── concurrency-pool.md    # Referências existentes
    ├── worker-threads.md
    └── dashboard-api.md        # NOVO - Referência de APIs do dashboard
```

### Processo de Documentação

#### 1. Documentação de Progresso (`docs/implementation-progress/`)

**Quando**: Após cada passo (1.1, 1.2, 2.1, etc.) ser concluído

**O que documentar**:

- Data e hora da conclusão
- Tarefas específicas concluídas
- Arquivos criados/modificados
- Decisões técnicas tomadas
- Problemas encontrados e soluções
- Comandos executados (instalações, configurações)
- Exemplos de código quando relevante
- Próximos passos

**Formato**:

```markdown
# Fase X: [Nome da Fase]

## [Data] - Passo X.Y: [Nome do Passo]

### Tarefas Concluídas

- [x] Tarefa 1
- [x] Tarefa 2

### Arquivos Criados

- `caminho/arquivo.ts`

### Decisões Técnicas

- Decisão X: Justificativa...

### Problemas e Soluções

- Problema: Descrição...
- Solução: Como foi resolvido...

### Notas

- Observações relevantes...
```

#### 2. Documentação Técnica (`docs/`)

**Quando**: Após cada fase ser concluída

**Onde documentar**:

- **`docs/architecture/DASHBOARD.md`**: - Arquitetura do dashboard Next.js - Estrutura de rotas (App Router) - Fluxo de autenticação - Estrutura de APIs - Decisões de design (NextAuth, shadcn/ui, etc.) - Integração com sistema RAG existente

- **`docs/guides/dashboard.md`**: - Como usar o dashboard - Guia de autenticação - Como fazer upload de arquivos - Como usar o chat RAG - Navegação e funcionalidades - Troubleshooting específico do dashboard

- **`docs/reference/dashboard-api.md`**: - Referência completa das APIs - Endpoints disponíveis - Request/Response schemas - Exemplos de uso - Códigos de erro

- **Atualizar `docs/INDEX.md`**: - Adicionar links para nova documentação - Atualizar seção "Últimas Implementações" - Manter estrutura consistente

**Formato**: Seguir o padrão dos documentos existentes (README.md, ARQUITETURA.md, etc.)

### Checklist de Documentação

Após cada fase:

- [ ] Criar/atualizar arquivo em `docs/implementation-progress/`
- [ ] Criar/atualizar `docs/architecture/DASHBOARD.md` (se aplicável)
- [ ] Criar/atualizar `docs/guides/dashboard.md` (se aplicável)
- [ ] Criar/atualizar `docs/reference/dashboard-api.md` (se aplicável)
- [ ] Atualizar `docs/INDEX.md` com novos links
- [ ] Revisar consistência com documentação existente

## Notas de Implementação

1.  ✅ **Upload de Pasta**: Implementado com `<input type="file" webkitdirectory multiple />` - funcional (limitação do navegador, mas funciona)
2.  ⚠️ **Processamento Assíncrono**: Não implementado - Considerar fila de jobs (Bull/BullMQ) para processamento pesado (futuro)
3.  ✅ **Feedback de Progresso**:

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - ✅ SSE (Server-Sent Events) implementado (melhor que polling)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - ✅ Usar shadcn Progress para barras de progresso
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - ✅ Badges coloridos por status (pending, processing, completed, failed)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - ✅ Animações suaves com Tailwind transitions

4.  ✅ **Streaming**: Chat usa streaming do AI SDK para melhor UX
5.  ⚠️ **Segurança**:

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - ✅ Validar todos os inputs
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - ✅ Sanitizar uploads
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - ❌ Rate limiting não implementado (recomendado para produção)

6.  ✅ **Performance**:

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - ✅ Paginação obrigatória para listas grandes
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - ✅ Lazy loading de componentes pesados (skeletons)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - ✅ Cache nas APIs (revalidate)

7.  ✅ **shadcn/ui**: Todos os componentes usam shadcn para consistência visual
8.  ✅ **Tailwind**: Usar classes utilitárias do Tailwind, evitar CSS customizado quando possível
9.  ✅ **Design System**: Seguir padrões do shadcn (cores, espaçamentos, tipografia)
10. ✅ **Documentação**:

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - ✅ Documentação de progresso criada (fase-1 a fase-8)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - ✅ Documentação técnica completa criada:
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - docs/architecture/DASHBOARD.md
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - docs/guides/dashboard.md
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - docs/reference/dashboard-api.md
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                - ✅ INDEX.md atualizado com links
