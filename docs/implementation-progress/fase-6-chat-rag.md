# Fase 6: Chat RAG

## 2024-11-20 - Passo 6.1: Serviço de Busca RAG

### Tarefas Concluídas

- [x] Criar `lib/services/rag-search.ts`:
  - Função `searchSimilarChunks(query, limit, minSimilarity)`:
    - Gera embedding da query usando `generateEmbedding`
    - Busca chunks similares no banco usando operador `<=>` (cosine similarity)
    - Query SQL raw usando postgres client diretamente
    - Retorna chunks com similaridade e contexto
  - Função `searchSimilarChunksWithFilters(query, options)`:
    - Versão com filtros adicionais (área, tipo de documento, apenas GOLD)
    - Permite refinar busca por contexto jurídico

### Arquivos Criados

- `lib/services/rag-search.ts` - Serviço de busca vetorial RAG

### Decisões Técnicas

- **Postgres Client Direto**: Usado `postgres` client diretamente para queries SQL raw, pois o Drizzle ORM não tem suporte nativo para o operador `<=>` do pgvector
- **Similaridade Mínima**: Padrão de 0.7 (70%) para filtrar resultados relevantes
- **Índice HNSW**: Aproveita o índice HNSW existente em `template_chunks.embedding` para busca otimizada
- **Cosine Similarity**: Usa operador `<=>` do pgvector que calcula distância cosseno (1 - distância = similaridade)

### Problemas e Soluções

- **Problema**: Drizzle ORM não suporta operador `<=>` do pgvector
- **Solução**: Usar client `postgres` diretamente para queries SQL raw com template literals
- **Problema**: Formato do embedding para PostgreSQL
- **Solução**: Passar array JavaScript diretamente, o postgres converte automaticamente para `vector(1536)`

### Notas

- Similaridade é calculada como `1 - (embedding <=> query_embedding)`
- Resultados são ordenados por menor distância (maior similaridade)
- Filtros opcionais permitem refinar busca por contexto jurídico específico

---

## 2024-11-20 - Passo 6.2: Serviço de Chat RAG

### Tarefas Concluídas

- [x] Criar `lib/services/rag-chat.ts`:
  - Função `chatWithRAG(message, history, options)`:
    - Busca chunks relevantes usando `searchSimilarChunks`
    - Constrói contexto RAG a partir dos chunks
    - Chama OpenAI (GPT-4o-mini) com contexto RAG
    - Retorna resposta com fontes utilizadas

### Arquivos Criados

- `lib/services/rag-chat.ts` - Serviço de orquestração do chat RAG

### Decisões Técnicas

- **Modelo**: GPT-4o-mini escolhido por ser mais barato e suficiente para chat
- **Contexto RAG**: Constrói contexto estruturado com informações de cada documento (título, área, tipo, seção, similaridade)
- **Histórico**: Mantém últimas 6 mensagens (3 turnos) para contexto conversacional
- **Prompt System**: Instruções claras para o modelo usar APENAS informações do contexto RAG
- **Fontes**: Retorna lista de fontes utilizadas para transparência

### Notas

- Contexto RAG inclui metadados dos documentos (título, área, tipo, seção) para melhor contexto
- Similaridade é exibida no contexto para o modelo entender relevância
- Sistema instruído a citar documentos quando fizer referências

---

## 2024-11-20 - Passo 6.3: API de Chat

### Tarefas Concluídas

- [x] Criar `app/api/chat/route.ts`:
  - POST endpoint para mensagens
  - Usa AI SDK (`streamText`) para streaming de resposta
  - Integra com `searchSimilarChunks` para busca RAG
  - Autenticação via NextAuth v5 (`auth()`)
  - Retorna stream de resposta em tempo real

### Arquivos Criados

- `app/api/chat/route.ts` - API de chat com streaming

### Decisões Técnicas

- **Streaming**: Usa `streamText` do AI SDK para resposta em tempo real (melhor UX)
- **Autenticação**: Verifica sessão usando `auth()` do NextAuth v5
- **Contexto RAG**: Busca chunks antes de gerar resposta
- **Prompt System**: Mesmo prompt do serviço `rag-chat.ts` para consistência
- **Error Handling**: Tratamento de erros com mensagens amigáveis

### Notas

- API retorna stream de dados usando `toDataStreamResponse()`
- Cliente usa `useChat` hook do AI SDK para consumir stream automaticamente
- Busca RAG é feita antes de gerar resposta para garantir contexto relevante

---

## 2024-11-20 - Passo 6.4: Componente de Chat

### Tarefas Concluídas

- [x] Criar `components/chat/chat-interface.tsx`:
  - Interface de chat usando `useChat` hook do AI SDK
  - Input de mensagem com textarea auto-ajustável
  - Histórico de conversa com scroll automático
  - Indicador de digitação (loading state)
  - Botão de limpar conversa
  - Suporte a Enter para enviar, Shift+Enter para nova linha

### Arquivos Criados

- `components/chat/chat-interface.tsx` - Componente de interface de chat

### Dependências Instaladas

- `@radix-ui/react-textarea` - Para componente Textarea (via shadcn)
- `@radix-ui/react-scroll-area` - Para componente ScrollArea (via shadcn)

### Decisões Técnicas

- **AI SDK Hook**: Usa `useChat` do `ai/react` para gerenciar estado e streaming automaticamente
- **Auto-scroll**: Scroll automático para última mensagem quando novas mensagens chegam
- **Textarea Auto-ajustável**: Altura ajusta automaticamente até 200px máximo
- **Layout**: Design responsivo com cards para mensagens (user vs assistant)
- **Loading State**: Indicador visual durante geração de resposta

### Notas

- Componente usa shadcn/ui para consistência visual
- Mensagens do usuário aparecem à direita (azul), assistente à esquerda (cinza)
- Textarea desabilita durante loading para evitar múltiplos envios

---

## 2024-11-20 - Passo 6.5: Página de Chat

### Tarefas Concluídas

- [x] Criar `app/(dashboard)/chat/page.tsx`:
  - Componente ChatInterface
  - Layout responsivo com container
  - Altura ajustada para viewport

### Arquivos Criados

- `app/(dashboard)/chat/page.tsx` - Página de chat

### Decisões Técnicas

- **Layout**: Container centralizado com altura ajustada ao viewport
- **Card**: Interface dentro de card para melhor visual
- **Responsividade**: Layout adapta-se a diferentes tamanhos de tela

### Notas

- Página integrada ao layout do dashboard (sidebar e navbar)
- Altura calculada para ocupar espaço disponível sem scroll externo

---

## Status da Fase 6

✅ **FASE 6 COMPLETA**

### Resumo da Implementação

A Fase 6 implementa um sistema completo de Chat RAG que permite aos usuários fazer perguntas sobre os documentos jurídicos processados. O sistema:

1. **Busca Vetorial**: Usa embeddings e pgvector para encontrar chunks relevantes
2. **Contexto RAG**: Constrói contexto estruturado com metadados dos documentos
3. **Geração de Resposta**: Usa GPT-4o-mini com contexto RAG para gerar respostas
4. **Streaming**: Respostas são transmitidas em tempo real para melhor UX
5. **Interface**: Interface de chat moderna e responsiva

### Funcionalidades Implementadas

- ✅ Busca de chunks similares usando pgvector
- ✅ Geração de contexto RAG estruturado
- ✅ Chat com streaming de respostas
- ✅ Interface de chat completa
- ✅ Autenticação integrada
- ✅ Histórico de conversa
- ✅ Limpeza de conversa

### Pendências

- [ ] Exibir fontes utilizadas na resposta (opcional)
- [ ] Filtros de busca por área/tipo de documento na interface (opcional)
- [ ] Histórico persistente de conversas (opcional)
