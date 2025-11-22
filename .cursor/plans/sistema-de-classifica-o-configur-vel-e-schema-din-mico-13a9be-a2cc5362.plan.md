<!-- a2cc5362-81bc-4ed5-b2bb-726fe123e3e0 58569b8e-1e1e-4f71-8433-abc8a170d7fa -->
# Sistema de Classificação Configurável e Schema Dinâmico

## Objetivos

1. **Classificação Configurável**: Suporte a múltiplos providers/modelos (OpenAI, Google/Gemini) com configuração via front-end
2. **Estimativa de Tokens**: Migrar de aproximação para tiktoken
3. **Código Refatorado**: Funções menores, semanticamente organizadas
4. **Truncamento Inteligente**: Baseado em limites de tokens do modelo com margem para output
5. **Front-end de Configuração**: System prompt, modelos, limites, função de extração
6. **Schema Dinâmico**: Template configurável no front-end com campos JSON no banco
7. **Tipos Zod Completos**: Suporte a todos os tipos Zod relevantes (string, number, boolean, date, bigint, enum, literal, union, array, object)
8. **Página de Configuração Unificada**: Página principal de settings com submenu para Classificação

## Estrutura do Plano

### Fase 1: Banco de Dados e Schema

#### 1.1 Nova Estrutura de Schema

- **Tabela `classification_configs`**: Armazena configurações de classificação
- `id`, `name`, `system_prompt`, `model_provider`, `model_name`, `max_input_tokens`, `max_output_tokens`, `extraction_function_code`, `is_active`, `created_at`, `updated_at`
- **Tabela `template_schema_configs`**: Define schema configurável dos templates
- `id`, `name`, `fields` (JSONB com array de definições de campos), `is_active`, `created_at`, `updated_at`
- **Refatorar tabela `templates`**: Migrar de colunas fixas para JSONB
- Manter colunas essenciais: `id`, `document_file_id`, `title`, `markdown`, `metadata` (JSONB com todos os campos configuráveis)
- Remover: `doc_type`, `area`, `jurisdiction`, `complexity`, `tags`, `summary`, `quality_score`, `is_gold`, `is_silver`
- Adicionar: `schema_config_id` (referência ao schema ativo)
- **Schema Padrão Inicial**: Criar schema padrão na migration com os campos atuais (docType, area, jurisdiction, complexity, tags, summary, qualityScore, isGold, isSilver) para que novos templates já nasçam com essa estrutura

#### 1.2 Migração de Dados

- **Migrations geradas com Drizzle ORM** (`npm run db:generate`)
- **MCP Neon usado APENAS para validações e verificações** (não para criar migrations)
- Passos da migration:

1. Criar novas tabelas: `classification_configs`, `template_schema_configs`
2. Adicionar coluna `metadata` JSONB na tabela `templates` (se não existir)
3. Adicionar coluna `schema_config_id` na tabela `templates`
4. **Criar schema padrão inicial** na tabela `template_schema_configs`:

   - Schema padrão com os campos atuais: `docType`, `area`, `jurisdiction`, `complexity`, `tags`, `summary`, `qualityScore`, `isGold`, `isSilver`
   - Este schema será usado como padrão para novos templates

5. **Migrar dados existentes**: Atualizar `metadata` JSONB com valores das colunas antigas:

- `doc_type` → `metadata->>'docType'`
- `area` → `metadata->>'area'`
- `jurisdiction` → `metadata->>'jurisdiction'`
- `complexity` → `metadata->>'complexity'`
- `tags` → `metadata->'tags'` (array)
- `summary` → `metadata->>'summary'`
- `quality_score` → `metadata->>'qualityScore'`
- `is_gold` → `metadata->>'isGold'`
- `is_silver` → `metadata->>'isSilver'`

6. **Associar templates existentes ao schema padrão**: Atualizar `schema_config_id` com o ID do schema padrão criado
7. Remover colunas antigas: `doc_type`, `area`, `jurisdiction`, `complexity`, `tags`, `summary`, `quality_score`, `is_gold`, `is_silver`
8. Remover enums: `doc_type`, `area`, `complexity` (DROP TYPE)

- **Validações com MCP Neon** (após migration):
- Usar `mcp_Neon_describe_table_schema` para validar estrutura antes/depois
- Usar `mcp_Neon_run_sql` para verificar dados migrados (SELECT queries)
- Usar `mcp_Neon_get_database_tables` para listar tabelas
- Validar que todos os dados foram migrados corretamente
- Validar que o schema padrão foi criado corretamente

### Fase 2: Backend - Classificação Refatorada

#### 2.1 Sistema de Modelos

- **Arquivo**: `lib/types/classification-models.ts`
- Reutilizar/enriquecer `ChatModel` enum
- Função `getClassificationModelProvider()` similar ao chat
- Interface para limites de tokens por modelo
- Mapeamento de modelos para seus limites de tokens

#### 2.2 Utilitários de Tokens

- **Arquivo**: `lib/utils/token-estimation.ts`
- Função `estimateTokensWithTiktoken(text: string, model: string): number`
- Suporte a diferentes encodings por modelo
- Fallback para aproximação se tiktoken falhar

#### 2.3 Funções de Extração

- **Arquivo**: `lib/services/content-extraction.ts`
- `extractClassificationRelevantContent(markdown: string, config?: ExtractionConfig): string`
- Função padrão (atual `extractClassificationRelevantContent`)
- Sistema para executar função customizada do banco (sandbox seguro)
- Validação de função antes de executar

#### 2.4 Lógica de Truncamento Inteligente

- **Arquivo**: `lib/services/content-truncation.ts`
- `calculateAvailableTokens(maxInputTokens: number, systemPromptTokens: number, userPromptTokens: number, outputMargin: number): number`
- `shouldUseExtraction(fullDocTokens: number, availableTokens: number): boolean`
- `truncateMarkdown(markdown: string, maxTokens: number): string` (refatorada)

#### 2.5 Classificador Refatorado

- **Arquivo**: `lib/services/classifier.ts` (refatoração completa)
- `loadClassificationConfig(configId?: string): Promise<ClassificationConfig>`
- `buildClassificationSchema(schemaConfig: TemplateSchemaConfig): z.ZodSchema`
- `prepareMarkdownContent(markdown: string, config: ClassificationConfig): Promise<string>`
- `classifyDocument(markdown: string, configId?: string, onProgress?: Callback): Promise<ClassificationResult>`
- Cada função com responsabilidade única

#### 2.6 Serviço de Configuração

- **Arquivo**: `lib/services/classification-config.ts`
- CRUD de configurações de classificação
- Validação de limites de tokens
- Validação de código JavaScript para função de extração
- Execução segura de função customizada

### Fase 3: Schema Dinâmico de Templates

#### 3.1 Tipos e Interfaces

- **Arquivo**: `lib/types/template-schema.ts`
- `FieldType`: Tipos Zod suportados baseados no ClassificationSchema atual:
- Tipos primitivos: 'string' | 'number' | 'boolean' | 'date' | 'bigint'
- Tipos complexos: 'enum' | 'literal' | 'array' | 'object' | 'union'
- `TemplateFieldDefinition`: 
- Campos base: { name, type, description, required?, defaultValue? }
- Para enum: { enumValues: string[] }
- Para literal: { literalValue: string | number | boolean }
- Para number: { min?, max? }
- Para array: { itemType: FieldType, itemConfig? }
- Para object: { objectFields: TemplateFieldDefinition[] }
- Para union: { unionTypes: FieldType[], unionConfigs? }
- `TemplateSchemaConfig`: { id, name, fields: TemplateFieldDefinition[] }
- `DynamicTemplateDocument`: Record<string, any> (campos dinâmicos)

#### 3.2 Geração de Schema Zod Dinâmico

- **Arquivo**: `lib/services/schema-builder.ts`
- `buildZodSchemaFromConfig(config: TemplateSchemaConfig): z.ZodSchema`
- Gera schema Zod baseado em definições de campos
- Suporte completo para todos os tipos:
- Primitivos: z.string(), z.number().min().max(), z.boolean(), z.date(), z.bigint()
- Enum: z.enum([...])
- Literal: z.literal(value)
- Array: z.array(schema) com suporte a arrays de objetos
- Object: z.object({...}) com campos aninhados
- Union: z.union([schema1, schema2, ...])
- Validação de tipos e enums
- Suporte a .describe() para documentação de campos

#### 3.3 Adaptação de Queries

- **Arquivo**: `lib/services/template-queries.ts`
- Funções para buscar templates com campos dinâmicos
- Filtros baseados em campos JSONB
- Migração de queries que usam `area`, `docType` para JSONB

#### 3.4 Serviço de Schema

- **Arquivo**: `lib/services/template-schema-service.ts`
- CRUD de configurações de schema
- Validação de definições de campos
- Migração de templates existentes para novo formato

### Fase 4: APIs Backend

#### 4.1 API de Configuração de Classificação

- **Arquivo**: `app/api/classification/configs/route.ts`
- GET: Listar configurações
- POST: Criar configuração
- **Arquivo**: `app/api/classification/configs/[id]/route.ts`
- GET: Obter configuração
- PUT: Atualizar configuração
- DELETE: Deletar configuração

#### 4.2 API de Schema de Template

- **Arquivo**: `app/api/template-schema/configs/route.ts`
- GET: Listar schemas
- POST: Criar schema
- **Arquivo**: `app/api/template-schema/configs/[id]/route.ts`
- GET, PUT, DELETE

#### 4.3 Atualizar API de Classificação

- **Arquivo**: `app/api/classification/classify/route.ts` (novo)
- POST: Classificar documento com configId opcional
- Usa configuração ativa se não especificado

### Fase 5: Front-end - Configuração

#### 5.1 Estrutura de Página de Configuração

- **Arquivo**: `app/(dashboard)/settings/page.tsx` (página principal)
- Layout com submenu lateral ou tabs
- Submenu "Classificação" para configurações de classificação
- Submenu "Schema de Template" para configurações de schema
- Navegação entre submenus mantendo contexto
- Adicionar item "Settings" no sidebar (`components/layout/sidebar.tsx`)

#### 5.2 Página de Configuração de Classificação

- **Arquivo**: `app/(dashboard)/settings/classification/page.tsx`
- Acessível via submenu "Classificação" na página de settings
- Lista de configurações
- Formulário para criar/editar:
- Nome da configuração
- System prompt (editor de texto grande)
- Seletor de modelo/provider
- Limites de tokens (input/output)
- Editor de código JavaScript para função de extração
- Preview de função padrão

#### 5.3 Página de Schema de Template

- **Arquivo**: `app/(dashboard)/settings/template-schema/page.tsx`
- Acessível via submenu "Schema de Template" na página de settings
- Lista de schemas
- Editor de schema com suporte completo a tipos Zod:
- Adicionar/remover campos
- Seletor de tipo de campo com todos os tipos suportados:
- Primitivos: string, number (com min/max), boolean, date, bigint
- Enum: com editor de lista de valores
- Literal: com input de valor literal
- Array: com seletor de tipo do item (primitivo ou objeto)
- Object: com editor de campos aninhados
- Union: com editor de múltiplos tipos
- Para cada tipo: configurações específicas (enumValues, min/max, itemType, etc.)
- Descrição do campo
- Campos obrigatórios/opcionais
- Preview do schema Zod gerado em tempo real

#### 5.4 Componentes Reutilizáveis

- **Arquivo**: `components/settings/settings-layout.tsx`
- Layout com submenu/tabs para navegação entre configurações
- **Arquivo**: `components/settings/code-editor.tsx`
- Editor de código JavaScript com syntax highlighting
- Validação básica
- **Arquivo**: `components/settings/model-selector.tsx`
- Seletor de provider/modelo
- Exibe limites de tokens do modelo
- **Arquivo**: `components/settings/field-type-selector.tsx`
- Seletor de tipo de campo Zod com descrições
- Mostra opções de configuração baseadas no tipo selecionado
- **Arquivo**: `components/settings/schema-field-editor.tsx`
- Editor de campo individual com todas as opções
- Suporte a campos aninhados (objetos, arrays de objetos)
- **Arquivo**: `components/settings/schema-preview.tsx`
- Preview do schema Zod gerado
- Validação visual do schema

### Fase 6: Adaptações e Migrações

#### 6.1 Atualizar Scripts

- **Arquivo**: `scripts/classify-documents.ts`
- Usar nova API de classificação
- Suportar configId opcional

#### 6.2 Atualizar Front-end Existente

- **Arquivo**: `app/(dashboard)/files/[id]/page.tsx`
- Exibir campos dinâmicos do template
- Adaptar para JSONB metadata
- **Arquivo**: `app/(dashboard)/files/page.tsx`
- Filtros adaptados para campos JSONB
- **Arquivo**: `components/files/file-list.tsx`
- Exibir campos dinâmicos

#### 6.3 Atualizar RAG Search

- **Arquivo**: `lib/services/rag-search.ts`
- Filtros baseados em campos JSONB
- Adaptar queries SQL

#### 6.4 Atualizar RAG Chat

- **Arquivo**: `lib/services/rag-chat.ts`
- Contexto adaptado para campos dinâmicos

### Fase 7: Dependências e Setup

#### 7.1 Instalar Dependências

- `tiktoken`: Para estimativa precisa de tokens
- Atualizar `package.json`

#### 7.2 Scripts de Migração e Validação

- **Migrations geradas com Drizzle ORM** (`npm run db:generate`) - processo padrão do projeto
- **MCP Neon usado APENAS para validações e verificações** (não para criar ou executar migrations)
- Passos:

1. Atualizar schema Drizzle (`lib/db/schema/rag.ts`)
2. Gerar migration com `npm run db:generate` (Drizzle ORM)
3. Executar migration com `npm run db:migrate` (Drizzle ORM)
4. **Validações com MCP Neon** (após migration):

- Usar `mcp_Neon_describe_table_schema` para validar estrutura antes/depois
- Usar `mcp_Neon_run_sql` para verificar dados migrados (SELECT queries)
- Usar `mcp_Neon_get_database_tables` para listar tabelas
- Validar que todos os dados foram migrados corretamente para JSONB
- Validar que o schema padrão foi criado e associado corretamente

5. Script de seed com schema padrão inicial (se necessário)

## Arquivos Principais a Modificar/Criar

### Novos Arquivos

- `lib/types/classification-models.ts`
- `lib/utils/token-estimation.ts`
- `lib/services/content-extraction.ts`
- `lib/services/content-truncation.ts`
- `lib/services/classification-config.ts`
- `lib/types/template-schema.ts`
- `lib/services/schema-builder.ts`
- `lib/services/template-queries.ts`
- `lib/services/template-schema-service.ts`
- `app/api/classification/configs/route.ts`
- `app/api/classification/configs/[id]/route.ts`
- `app/api/classification/classify/route.ts`
- `app/api/template-schema/configs/route.ts`
- `app/api/template-schema/configs/[id]/route.ts`
- `app/(dashboard)/settings/page.tsx` (página principal com submenu)
- `app/(dashboard)/settings/classification/page.tsx`
- `app/(dashboard)/settings/template-schema/page.tsx`
- `components/settings/settings-layout.tsx`
- `components/settings/code-editor.tsx`
- `components/settings/model-selector.tsx`
- `components/settings/field-type-selector.tsx`
- `components/settings/schema-field-editor.tsx`
- `components/settings/schema-preview.tsx`

### Arquivos a Modificar

- `lib/db/schema/rag.ts` (refatorar tabelas)
- `lib/services/classifier.ts` (refatoração completa)
- `lib/types/template-document.ts` (adaptar para dinâmico)
- `lib/services/rag-search.ts` (queries JSONB)
- `lib/services/rag-chat.ts` (campos dinâmicos)
- `scripts/classify-documents.ts` (usar nova API)
- `app/(dashboard)/files/[id]/page.tsx` (exibir campos dinâmicos)
- `app/(dashboard)/files/page.tsx` (filtros JSONB)
- `components/files/file-list.tsx` (campos dinâmicos)
- `components/layout/sidebar.tsx` (adicionar item Settings no menu)

## Considerações Importantes

1. **Segurança**: Validação rigorosa de código JavaScript customizado antes de executar (sandbox ou validação estática)
2. **Performance**: Índices JSONB para campos frequentemente filtrados (usar GIN indexes)
3. **Compatibilidade**: Manter fallbacks para código legado durante transição
4. **Validação**: Validação de schema antes de salvar configurações
5. **Default Schema**: Schema padrão inicial baseado no schema atual (docType, area, etc.) - deve ser criado na migration junto com a estrutura inicial
6. **MCP Neon**: Usar MCP Neon APENAS para validações e verificações:

- **NÃO usar para criar migrations**: Migrations devem ser geradas com Drizzle ORM (`npm run db:generate`)
- **NÃO usar para executar migrations**: Migrations devem ser executadas com Drizzle ORM (`npm run db:migrate`)
- **Usar para validações**: `mcp_Neon_describe_table_schema`, `mcp_Neon_get_database_tables`
- **Usar para verificar dados**: `mcp_Neon_run_sql` com queries SELECT para validar migrações
- **Usar para comparar schemas**: `mcp_Neon_compare_database_schema` (se necessário)
- Validar migrations antes de aplicar ao main branch

7. **Tipos Zod**: Suportar todos os tipos relevantes do Zod baseados no ClassificationSchema atual:

- Primitivos: string, number (com min/max), boolean, date, bigint
- Enum: z.enum([...]) com lista de valores
- Literal: z.literal(value) com valor específico
- Array: z.array(schema) com suporte a arrays de primitivos e objetos
- Object: z.object({...}) com campos aninhados
- Union: z.union([...]) com múltiplos tipos

8. **UI/UX**: Interface intuitiva para configurar tipos complexos:

- Editor visual para objetos aninhados
- Editor para arrays com tipo de item configurável
- Editor para unions com múltiplos tipos
- Preview em tempo real do schema Zod gerado

## Ordem de Implementação Recomendada

1. Fase 1: Banco de dados (schema + migration via Drizzle ORM)
2. Fase 2: Backend refatorado (classificação)
3. Fase 3: Schema dinâmico (tipos + serviços)
4. Fase 4: APIs backend
5. Fase 5: Front-end de configuração
6. Fase 6: Adaptações (scripts, front-end existente)
7. Fase 7: Dependências e finalização

## Documentação de Progresso

### Estrutura de Documentação

- **Localização**: `docs/implementation-progress/`
- **Arquivo principal**: `docs/implementation-progress/classificacao-configuravel-schema-dinamico.md`
- **Formato**: Documentação em Markdown com seções por fase

### Conteúdo da Documentação

A documentação deve ser atualizada **a cada fase concluída** e incluir:

1. **Status Geral**: Visão geral do progresso (ex: "Fase 1 concluída, Fase 2 em progresso")
2. **Por Fase**:

   - Status da fase (pendente, em progresso, concluída)
   - Arquivos criados/modificados
   - Funcionalidades implementadas
   - Decisões técnicas importantes
   - Problemas encontrados e soluções
   - Validações realizadas (com MCP Neon quando aplicável)

3. **Próximos Passos**: O que será feito na próxima fase
4. **Notas Técnicas**: Observações importantes sobre a implementação

### Atualização da Documentação

- **Quando atualizar**: Ao concluir cada fase ou sub-fase significativa
- **O que documentar**:
  - Arquivos criados com breve descrição
  - Funcionalidades implementadas
  - Mudanças em arquivos existentes
  - Validações realizadas (especialmente com MCP Neon)
  - Problemas e soluções
- **Formato**: Markdown estruturado com seções claras

### Exemplo de Estrutura

```markdown
# Sistema de Classificação Configurável e Schema Dinâmico - Progresso

## Status Geral
- Fase 1: ✅ Concluída
- Fase 2: 🔄 Em Progresso
- Fase 3: ⏳ Pendente
...

## Fase 1: Banco de Dados e Schema
### Status: ✅ Concluída
### Arquivos Criados:
- ...
### Arquivos Modificados:
- ...
### Funcionalidades:
- ...
### Validações:
- ...
```