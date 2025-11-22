<!-- 9ed9fbf5-0ea1-47ed-90a9-74854ca34bf1 eb5da3a9-8228-4493-bab5-45d160f077c4 -->
# Sistema de Classificação Configurável e Schema Dinâmico

## Objetivos

1. **Classificação Configurável**: Suporte a múltiplos providers/modelos (OpenAI, Google/Gemini) com configuração via front-end
2. **Estimativa de Tokens**: Migrar de aproximação para tiktoken
3. **Código Refatorado**: Funções menores, semanticamente organizadas
4. **Truncamento Inteligente**: Baseado em limites de tokens do modelo com margem para output
5. **Front-end de Configuração**: System prompt, modelos, limites, função de extração
6. **Schema Dinâmico**: Template configurável no front-end com campos JSON no banco

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

#### 1.2 Migração de Dados

- Script para limpar tabelas: `templates`, `template_chunks`
- Nova migration para estrutura refatorada
- Remover enums: `doc_type`, `area`, `complexity` (não serão mais usados)

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
- `FieldType`: 'string' | 'number' | 'boolean' | 'enum' | 'array'
- `TemplateFieldDefinition`: { name, type, description, enumValues?, required?, defaultValue? }
- `TemplateSchemaConfig`: { id, name, fields: TemplateFieldDefinition[] }
- `DynamicTemplateDocument`: Record<string, any> (campos dinâmicos)

#### 3.2 Geração de Schema Zod Dinâmico

- **Arquivo**: `lib/services/schema-builder.ts`
- `buildZodSchemaFromConfig(config: TemplateSchemaConfig): z.ZodSchema`
- Gera schema Zod baseado em definições de campos
- Validação de tipos e enums

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

#### 5.1 Página de Configuração Principal

- **Arquivo**: `app/(dashboard)/settings/page.tsx`
- Página principal com submenu lateral ou tabs
- Submenu/Tabs: "Classificação", "Schema de Template", etc.

#### 5.2 Subpágina de Configuração de Classificação

- **Arquivo**: `app/(dashboard)/settings/classification/page.tsx` (ou componente dentro de settings)
- Lista de configurações
- Formulário para criar/editar:
- Nome da configuração
- System prompt (editor de texto grande)
- Seletor de modelo/provider
- Limites de tokens (input/output)
- Editor de código JavaScript para função de extração
- Preview de função padrão

#### 5.3 Subpágina de Schema de Template

- **Arquivo**: `app/(dashboard)/settings/template-schema/page.tsx` (ou componente dentro de settings)
- Lista de schemas
- Editor de schema:
- Adicionar/remover campos
- Tipo de campo baseado em tipos Zod suportados:
- `string` (com opções: min, max, email, url, regex, etc.)
- `number` (com opções: min, max, int, float)
- `boolean`
- `enum` (lista de valores)
- `array` (de qualquer tipo, com min/max length)
- `object` (objeto aninhado)
- `date` (datetime)
- `optional` (wrapper para tornar campo opcional)
- `default` (valor padrão)
- Para cada tipo: opções específicas (min, max, description, etc.)
- Descrição do campo
- Campos obrigatórios/opcionais
- Preview do schema Zod gerado

#### 5.3 Componentes Reutilizáveis

- **Arquivo**: `components/settings/code-editor.tsx`
- Editor de código JavaScript com syntax highlighting
- Validação básica
- **Arquivo**: `components/settings/model-selector.tsx`
- Seletor de provider/modelo
- Exibe limites de tokens do modelo

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

#### 7.2 Scripts de Migração

- Script para limpar tabelas existentes
- Migration para nova estrutura
- Script de seed com schema padrão inicial

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
- `app/(dashboard)/settings/classification/page.tsx`
- `app/(dashboard)/settings/template-schema/page.tsx`
- `components/settings/code-editor.tsx`
- `components/settings/model-selector.tsx`

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

## Considerações Importantes

1. **Segurança**: Validação rigorosa de código JavaScript customizado antes de executar
2. **Performance**: Índices JSONB para campos frequentemente filtrados
3. **Compatibilidade**: Manter fallbacks para código legado durante transição
4. **Validação**: Validação de schema antes de salvar configurações
5. **Default Schema**: Schema padrão inicial baseado no schema atual (docType, area, etc.)

## Ordem de Implementação Recomendada

1. Fase 1: Banco de dados (schema + migration)
2. Fase 2: Backend refatorado (classificação)
3. Fase 3: Schema dinâmico (tipos + serviços)
4. Fase 4: APIs backend
5. Fase 5: Front-end de configuração
6. Fase 6: Adaptações (scripts, front-end existente)
7. Fase 7: Dependências e finalização

### To-dos

- [ ] Criar novas tabelas no schema: classification_configs, template_schema_configs e refatorar templates para usar JSONB
- [ ] Criar migration para nova estrutura e script para limpar tabelas existentes
- [ ] Implementar estimativa de tokens com tiktoken (lib/utils/token-estimation.ts)
- [ ] Criar sistema de modelos para classificação reutilizando ChatModel (lib/types/classification-models.ts)
- [ ] Refatorar extração de conteúdo em serviço separado com suporte a função customizada (lib/services/content-extraction.ts)
- [ ] Implementar lógica inteligente de truncamento baseada em limites do modelo (lib/services/content-truncation.ts)
- [ ] Criar serviço de configuração de classificação com CRUD (lib/services/classification-config.ts)
- [ ] Refatorar classifier.ts em funções menores usando novos serviços
- [ ] Criar tipos e interfaces para schema dinâmico de templates (lib/types/template-schema.ts)
- [ ] Implementar geração de schema Zod dinâmico (lib/services/schema-builder.ts)
- [ ] Criar funções de query adaptadas para campos JSONB (lib/services/template-queries.ts)
- [ ] Criar serviço CRUD para configurações de schema (lib/services/template-schema-service.ts)
- [ ] Criar APIs para configurações de classificação (GET, POST, PUT, DELETE)
- [ ] Criar API para classificar documentos usando configuração
- [ ] Criar APIs para configurações de schema de template (GET, POST, PUT, DELETE)
- [ ] Criar página de configuração de classificação no front-end com editor de código
- [ ] Criar página de editor de schema de template no front-end
- [ ] Atualizar scripts de classificação para usar nova API
- [ ] Atualizar páginas de arquivos para exibir campos dinâmicos do template
- [ ] Atualizar RAG search e chat para usar campos JSONB
- [ ] Instalar tiktoken e outras dependências necessárias