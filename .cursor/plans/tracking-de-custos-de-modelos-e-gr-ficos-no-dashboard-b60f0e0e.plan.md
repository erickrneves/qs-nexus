<!-- b60f0e0e-5e24-485e-a81a-d8a2bcc3f913 c0168892-1be5-4f9d-82f8-d94e7b55c1cf -->
# Implementação de Tracking de Custos e Gráficos no Dashboard

## Objetivos

1. Adicionar estrutura de preços por modelo (input/output tokens)
2. Calcular custo durante classificação e armazenar na tabela templates
3. Criar gráficos no dashboard para visualizar custos por modelo, provider e evolução temporal

## Estrutura de Preços dos Modelos

Preços oficiais atualizados (2025):

**OpenAI:**
- `gpt-4o-mini`: $0.15 entrada / $0.60 saída (por 1M tokens)
- `gpt-4o`: $2.50 entrada / $10.00 saída (por 1M tokens)

**Google (preços oficiais da API Gemini - https://ai.google.dev/gemini-api/docs/pricing?hl=pt-br):**
- `gemini-2.5-flash`: $0.15 entrada / $0.60 saída (por 1M tokens) - Nível pago
- `gemini-2.0-flash`: $0.075 entrada / $0.30 saída (por 1M tokens) - Nível pago
- `gemini-2.5-flash-lite`: $0.0375 entrada / $0.15 saída (por 1M tokens) - Nível pago
- `gemini-2.0-flash-lite`: $0.0375 entrada / $0.15 saída (por 1M tokens) - Nível pago

## Implementação

### 1. Adicionar Estrutura de Preços

**Arquivo:** `lib/types/classification-models.ts`

- Adicionar interface `ModelPricing` com `inputPricePerMillion` e `outputPricePerMillion`
- Criar constante `MODEL_PRICING: Record<ChatModel, ModelPricing>` com preços de todos os modelos
- Criar função `getModelPricing(model: ClassificationModel): ModelPricing`
- Criar função `calculateCost(inputTokens: number, outputTokens: number, model: ClassificationModel): number`

### 2. Atualizar Schema do Banco

**Arquivo:** `lib/db/schema/rag.ts`

- Adicionar coluna `cost_usd: decimal('cost_usd', { precision: 10, scale: 4 })` na tabela `templates` (nullable para compatibilidade)

**Arquivo:** `lib/db/migrations/0005_add_cost_to_templates.sql` (nova migration)

- Adicionar coluna `cost_usd` do tipo `DECIMAL(10, 4)` na tabela `templates`
- **Nota**: Executar migration com Drizzle ORM (`npm run db:generate` e `npm run db:migrate`)
- **Validação**: Usar MCP Neon para validar estrutura após migration se necessário

### 3. Atualizar Classificador

**Arquivo:** `lib/services/classifier.ts`

- Importar funções de cálculo de custo
- Após obter `usage` do `generateObject`, calcular custo usando `calculateCost()`
- Adicionar `_cost` ao resultado retornado
- Atualizar interface `ClassificationResultWithModel` para incluir `_cost?: number`

### 4. Atualizar Store Embeddings

**Arquivo:** `lib/services/store-embeddings.ts`

- Adicionar parâmetro `cost?: number` na função `storeTemplate`
- Passar `cost` ao inserir template no banco

### 5. Atualizar RAG Processor e Scripts

**Arquivos:**

- `lib/services/rag-processor.ts`
- `scripts/classify-documents.ts`

- Extrair `_cost` do resultado da classificação
- Passar `cost` para `storeTemplate`

### 6. Atualizar API de Estatísticas

**Arquivo:** `app/api/documents/model-stats/route.ts`

- Adicionar queries para estatísticas de custos:
- `totalCost`: soma total de custos
- `costByProvider`: custo agregado por provider
- `costByModel`: custo agregado por modelo (top 10)
- Retornar dados de custo na resposta JSON

### 7. Criar Componentes de Gráficos de Custo

**Arquivos criados:**

- `components/dashboard/cost-chart.tsx` - Gráfico principal de custos
- Gráfico de barras empilhadas: custo total por provider
- Gráfico de barras: custo total por modelo (top 10)
- Gráfico de linha: evolução de custos ao longo do tempo (se houver dados temporais)
- Cards com totais: custo total, custo médio por documento

**Arquivo modificado:**

- `app/(dashboard)/dashboard/page.tsx`
- Adicionar seção "Análise de Custos" após seção de modelos/tokens
- Exibir gráficos de custo usando componente `CostChart`

### 8. Atualizar Documentação

**Arquivo:** `docs/implementation-progress/classificacao-configuravel-schema-dinamico.md`

- Adicionar Fase 9: Tracking de Custos
- Documentar preços configurados
- Documentar estrutura de dados e gráficos criados

## Decisões Técnicas

1. **Precisão de Custos**: Usar `DECIMAL(10, 4)` para armazenar custos (suporta até $999,999.9999)
2. **Cálculo de Custo**: `(inputTokens / 1_000_000) * inputPrice + (outputTokens / 1_000_000) * outputPrice`
3. **Gráficos**: Usar recharts (já instalado) para consistência com gráficos existentes
4. **Formatação**: Exibir custos em USD com 4 casas decimais ou formato monetário ($X.XX)
5. **Compatibilidade**: Coluna `cost_usd` nullable para templates antigos sem custo calculado

## Validações

- Verificar que cálculo de custo está correto para cada modelo
- Validar que custos são salvos corretamente no banco
- Verificar que gráficos exibem dados corretamente
- Testar com templates antigos (sem custo) para garantir compatibilidade
- **Migrations**: Usar MCP Neon para validar estrutura do banco após aplicar migrations
- **Preços**: Confirmar que todos os preços estão de acordo com a documentação oficial

### To-dos

- [ ] Adicionar estrutura de preços em classification-models.ts com constantes de preço por modelo e função de cálculo de custo
- [ ] Adicionar coluna cost_usd na tabela templates e criar migration SQL
- [ ] Atualizar classifier.ts para calcular e retornar custo na classificação
- [ ] Atualizar store-embeddings.ts para aceitar e salvar custo no banco
- [ ] Atualizar rag-processor.ts para extrair e passar custo para storeTemplate
- [ ] Atualizar scripts/classify-documents.ts para passar custo ao armazenar templates
- [ ] Atualizar API model-stats para incluir estatísticas de custos (total, por provider, por modelo)
- [ ] Criar componente CostChart com gráficos de barras (provider/modelo) e cards de totais
- [ ] Adicionar seção de análise de custos no dashboard com gráficos de custo
- [ ] Atualizar documentação de progresso com Fase 9: Tracking de Custos