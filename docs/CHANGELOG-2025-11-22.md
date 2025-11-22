# Changelog - 22 de Novembro de 2025

## Tracking de Modelos e Tokens

### Adicionado

#### Logs de Debug
- Logs de debug quando `DEBUG=true` mostrando:
  - Provider usado (OpenAI/Google)
  - Modelo usado
  - Classification model
  - Tokens de input usados
  - Tokens de output usados
  - Total de tokens

#### Banco de Dados
- Coluna `model_provider` (enum: openai, google) na tabela `templates`
- Coluna `model_name` (text) na tabela `templates`
- Coluna `input_tokens` (integer) na tabela `templates`
- Coluna `output_tokens` (integer) na tabela `templates`
- Migration `0003_add_model_info_to_templates.sql`
- Migration `0004_add_token_usage_to_templates.sql`

#### API
- Endpoint `/api/documents/model-stats` para estatísticas de modelos e tokens:
  - Documentos por provider
  - Documentos por modelo
  - Total de tokens (input, output, total)
  - Tokens por provider
  - Tokens por modelo

#### Dashboard
- Seção "Estatísticas de Modelos e Tokens" no dashboard
- Gráfico de documentos por provider (`ProviderChart`)
- Gráfico de documentos por modelo (`ModelChart`)
- Gráfico de distribuição de tokens - Input vs Output (Pizza)
- Gráfico de tokens por provider (Barras empilhadas)
- Gráfico de tokens por modelo - Top 10 (Barras empilhadas)

### Modificado

#### Classificação
- `classifyDocument()` agora captura e retorna informações de modelo e tokens
- Logs de debug adicionados para rastreamento
- Informações de modelo e tokens passadas através do pipeline

#### Armazenamento
- `storeTemplate()` agora salva informações de modelo e tokens
- `createTemplateDocument()` agora aceita e preserva informações de modelo e tokens

#### Dashboard
- Página do dashboard atualizada para buscar e exibir estatísticas de modelos
- Busca de dados em paralelo (estatísticas gerais + estatísticas de modelos)

### Detalhes Técnicos

#### Captura de Tokens
- Usa objeto `usage` retornado pelo `generateObject` do AI SDK
- Captura `promptTokens` (input) e `completionTokens` (output)
- Funciona tanto no fluxo normal quanto no fallback (truncamento)

#### Compatibilidade
- Todas as novas colunas são nullable para compatibilidade com templates antigos
- Templates antigos continuam funcionando normalmente
- Novos templates terão informações de modelo e tokens preenchidas

#### Performance
- API de estatísticas com cache de 30 segundos
- Queries SQL otimizadas com GROUP BY
- Gráficos limitados a top 10 modelos para evitar sobrecarga visual

### Arquivos Criados

- `app/api/documents/model-stats/route.ts`
- `components/dashboard/provider-chart.tsx`
- `components/dashboard/model-chart.tsx`
- `components/dashboard/tokens-chart.tsx`
- `lib/db/migrations/0003_add_model_info_to_templates.sql`
- `lib/db/migrations/0004_add_token_usage_to_templates.sql`

### Arquivos Modificados

- `lib/services/classifier.ts`
- `lib/db/schema/rag.ts`
- `lib/services/store-embeddings.ts`
- `lib/services/rag-processor.ts`
- `scripts/classify-documents.ts`
- `app/(dashboard)/dashboard/page.tsx`
- `lib/db/migrations/meta/_journal.json`

### Benefícios

1. **Análise de Custos**: Visualização clara de uso de tokens por provider e modelo
2. **Otimização**: Identificação de modelos mais eficientes
3. **Debugging**: Logs detalhados para troubleshooting
4. **Rastreamento**: Histórico completo de qual modelo foi usado em cada classificação
5. **Métricas**: Dashboard com estatísticas visuais para tomada de decisão

### Próximos Passos

- Análise de custos por modelo
- Otimização de uso baseada em métricas
- Alertas de uso excessivo de tokens
- Relatórios de custos mensais

---

## Geração Dinâmica de Prompt do Schema

### Adicionado

#### Geração Automática de Prompt
- Função `generateSchemaPrompt()` que gera a seção "Extraia:" baseada no schema dinâmico
- Suporte a todos os tipos de campos (string, number, boolean, enum, literal, array, object, union)
- Formatação de campos aninhados recursivamente
- Formatação de arrays de objetos com estrutura detalhada

#### API de Preview
- Endpoint `/api/template-schema/prompt-preview` para obter preview do prompt gerado
- Suporte a schema específico via query parameter `schemaId`
- Retorna prompt formatado e informações do schema

#### Front-end
- Componente `SchemaPromptPreview` para exibir preview do prompt
- Preview adicionado na página de configuração de classificação
- Atualização automática quando schema ativo muda
- Mensagens de erro quando não há schema ativo

### Modificado

#### Classificação
- `classifyDocument()` agora gera e concatena prompt do schema automaticamente
- System prompt completo = system prompt + prompt do schema
- Cálculo de tokens atualizado para incluir prompt completo
- Função `prepareMarkdownContent()` atualizada para receber prompt completo

#### Página de Configuração
- Preview do prompt do schema exibido abaixo do campo System Prompt
- Mensagem informativa sobre concatenação automática

### Detalhes Técnicos

#### Geração de Prompt
- Formato: Lista numerada com campos em negrito
- Campos obrigatórios: `**Nome**`
- Campos opcionais: `**Nome** (opcional)`
- Descrições incluídas quando disponíveis
- Tipos formatados de forma legível (enum com valores, number com min/max, etc.)

#### Concatenação
- Separador: `\n\n` entre system prompt e prompt do schema
- Compatibilidade: Se não houver schema ativo, usa apenas system prompt
- Ordem: System prompt primeiro, depois prompt do schema

#### Cálculo de Tokens
- Prompt completo (system + schema) considerado no cálculo
- Tokens do schema prompt incluídos na estimativa
- Função `prepareMarkdownContent()` atualizada para considerar prompt completo

### Arquivos Criados

- `lib/services/schema-prompt-generator.ts`
- `app/api/template-schema/prompt-preview/route.ts`
- `components/settings/schema-prompt-preview.tsx`

### Arquivos Modificados

- `lib/services/classifier.ts`
- `app/(dashboard)/settings/classification/page.tsx`

### Benefícios

1. **Consistência**: Evita inconsistências entre schema e prompt manual
2. **Automação**: Atualização automática quando schema muda
3. **Preview**: Visualização em tempo real do prompt gerado
4. **Manutenção**: Não precisa atualizar prompt manualmente ao adicionar/remover campos
5. **Clareza**: Formatação legível e consistente do prompt

### Próximos Passos

- Melhorias na formatação de tipos complexos
- Opção de customizar formato do prompt gerado
- Histórico de mudanças no prompt do schema

