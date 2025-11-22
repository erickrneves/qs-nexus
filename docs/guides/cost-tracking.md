# Guia de Tracking de Custos

Este guia explica como o sistema rastreia e calcula custos de classificação de documentos usando diferentes modelos de IA.

## Visão Geral

O sistema calcula automaticamente o custo de cada classificação baseado em:
- **Modelo usado**: Cada modelo tem preços diferentes para tokens de entrada e saída
- **Tokens consumidos**: Quantidade de tokens de input e output usados na classificação
- **Preços por modelo**: Preços oficiais dos providers (OpenAI e Google)

O custo é calculado em tempo real durante a classificação e armazenado no banco de dados para análise posterior.

## Como Funciona

### Durante a Classificação

Quando um documento é classificado:

1. O sistema identifica o modelo usado (da configuração de classificação)
2. Executa a classificação usando o AI SDK
3. Captura os tokens usados (input e output) do objeto `usage` retornado
4. Calcula o custo usando a função `calculateCost()`:
   ```typescript
   cost = (inputTokens / 1_000_000) * inputPricePerMillion + 
          (outputTokens / 1_000_000) * outputPricePerMillion
   ```
5. Armazena o custo junto com o template no banco de dados

### Estrutura de Preços

Os preços são configurados em `lib/types/classification-models.ts` e são baseados nos preços oficiais dos providers:

#### OpenAI

- **gpt-4o-mini**: 
  - Input: $0.15 por 1M tokens
  - Output: $0.60 por 1M tokens
- **gpt-4o**: 
  - Input: $2.50 por 1M tokens
  - Output: $10.00 por 1M tokens

#### Google (Gemini)

- **gemini-2.5-flash**: 
  - Input: $0.15 por 1M tokens
  - Output: $0.60 por 1M tokens
- **gemini-2.0-flash**: 
  - Input: $0.075 por 1M tokens
  - Output: $0.30 por 1M tokens
- **gemini-2.5-flash-lite**: 
  - Input: $0.0375 por 1M tokens
  - Output: $0.15 por 1M tokens
- **gemini-2.0-flash-lite**: 
  - Input: $0.0375 por 1M tokens
  - Output: $0.15 por 1M tokens

**Nota**: Os preços podem mudar. Consulte os sites oficiais:
- OpenAI: https://openai.com/api/pricing
- Google: https://ai.google.dev/gemini-api/docs/pricing?hl=pt-br

### Logs de Debug

Quando `DEBUG=true` (variável de ambiente), o sistema exibe logs detalhados:

```
[CLASSIFIER] Provider: openai
[CLASSIFIER] Model: gpt-4o
[CLASSIFIER] Input tokens: 15234
[CLASSIFIER] Output tokens: 456
[CLASSIFIER] Total tokens: 15690
[CLASSIFIER] Cost: $0.0381
```

### Armazenamento no Banco

O custo é armazenado na tabela `templates`:

- `cost_usd`: DECIMAL(10, 4) - Custo total em USD (nullable para compatibilidade)

**Nota**: A coluna é nullable para compatibilidade com templates antigos criados antes desta implementação.

## Visualização no Dashboard

### Análise de Custos

O dashboard exibe uma seção completa de análise de custos com:

1. **Cards de Totais**:
   - **Custo Total**: Soma de todos os custos de classificação
   - **Custo Médio por Documento**: Média calculada dividindo o custo total pelo número de documentos

2. **Gráfico de Custos por Provider**: 
   - Gráfico de barras mostrando custo total por provider (OpenAI vs Google)
   - Útil para comparar custos entre providers

3. **Gráfico de Custos por Modelo (Top 10)**:
   - Gráfico de barras horizontal mostrando os 10 modelos mais caros
   - Exibe provider e custo total por modelo
   - Útil para identificar quais modelos estão consumindo mais recursos

### Acessando a Análise

1. Acesse o dashboard (`/dashboard`)
2. Role até a seção "Análise de Custos"
3. Visualize os gráficos interativos e métricas

## API de Estatísticas

### Endpoint

```
GET /api/documents/model-stats
```

### Resposta (inclui dados de custos)

```json
{
  "totalCost": 125.4567,
  "costByProvider": [
    { "provider": "openai", "cost": 100.2345 },
    { "provider": "google", "cost": 25.2222 }
  ],
  "costByModel": [
    { "model": "gpt-4o", "provider": "openai", "cost": 80.1234 },
    { "model": "gpt-4o-mini", "provider": "openai", "cost": 20.1111 },
    { "model": "gemini-2.0-flash", "provider": "google", "cost": 25.2222 }
  ],
  "byProvider": [...],
  "byModel": [...],
  "totalTokens": {...},
  "tokensByProvider": [...],
  "tokensByModel": [...]
}
```

### Cache

A API tem cache de 30 segundos para melhor performance.

## Casos de Uso

### Análise de Custos

Use as estatísticas para:

- **Identificar modelos mais caros**: Veja quais modelos estão consumindo mais recursos
- **Comparar providers**: Compare custos entre OpenAI e Google
- **Otimizar escolha de modelos**: Escolha modelos mais eficientes em custo-benefício
- **Prever custos futuros**: Estime custos baseado em volume de documentos

### Otimização

Use os dados para:

- **Reduzir custos**: Identifique modelos mais baratos que ainda atendem suas necessidades
- **Ajustar configurações**: Mude para modelos mais eficientes quando apropriado
- **Balancear qualidade e custo**: Encontre o equilíbrio ideal entre qualidade e custo

### Relatórios

Use os dados para:

- **Relatórios mensais**: Calcule custos mensais de classificação
- **Análise de tendências**: Acompanhe evolução de custos ao longo do tempo
- **Orçamento**: Planeje orçamento baseado em custos históricos

## Exemplos

### Verificar Custo de um Template Específico

```sql
SELECT 
  title,
  model_provider,
  model_name,
  input_tokens,
  output_tokens,
  cost_usd
FROM templates
WHERE id = 'template-id';
```

### Custo Total por Provider

```sql
SELECT 
  model_provider,
  COUNT(*) as total_documents,
  SUM(cost_usd) as total_cost,
  AVG(cost_usd) as avg_cost_per_document
FROM templates
WHERE cost_usd IS NOT NULL
GROUP BY model_provider;
```

### Top 10 Modelos Mais Caros

```sql
SELECT 
  model_name,
  model_provider,
  COUNT(*) as documents,
  SUM(cost_usd) as total_cost,
  AVG(cost_usd) as avg_cost
FROM templates
WHERE cost_usd IS NOT NULL
GROUP BY model_name, model_provider
ORDER BY total_cost DESC
LIMIT 10;
```

### Custo Médio por Modelo

```sql
SELECT 
  model_name,
  model_provider,
  AVG(cost_usd) as avg_cost,
  MIN(cost_usd) as min_cost,
  MAX(cost_usd) as max_cost,
  COUNT(*) as documents
FROM templates
WHERE cost_usd IS NOT NULL
GROUP BY model_name, model_provider
ORDER BY avg_cost DESC;
```

### Custo Total por Mês

```sql
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as documents,
  SUM(cost_usd) as total_cost,
  AVG(cost_usd) as avg_cost
FROM templates
WHERE cost_usd IS NOT NULL
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;
```

## Troubleshooting

### Custos Não Aparecem

Se os custos não aparecem:

1. **Verifique se a classificação foi feita após a implementação**: Templates antigos não terão custo calculado
2. **Verifique se o modelo tem preços configurados**: Modelos não suportados podem não ter preços
3. **Verifique os logs de debug**: Confirme que o cálculo está sendo executado
4. **Verifique se o AI SDK retornou tokens**: Sem tokens, não há como calcular custo

### Custos Parecem Incorretos

Se os custos parecem incorretos:

1. **Verifique os preços configurados**: Preços podem ter mudado nos sites oficiais
2. **Verifique os tokens**: Confirme que os tokens estão corretos
3. **Verifique o modelo usado**: Diferentes modelos têm preços diferentes
4. **Compare com preços oficiais**: Consulte os sites dos providers

### Gráficos Vazios

Se os gráficos estão vazios:

1. **Verifique se há templates com custo**: Use a query SQL acima para verificar
2. **Verifique se a API está retornando dados**: Teste o endpoint `/api/documents/model-stats`
3. **Verifique o console do navegador**: Pode haver erros JavaScript

## Melhores Práticas

1. **Monitore Regularmente**: Acompanhe custos para identificar tendências e anomalias
2. **Atualize Preços**: Mantenha os preços atualizados quando os providers mudarem
3. **Otimize Modelos**: Use modelos mais baratos quando a qualidade for suficiente
4. **Configure Alertas**: Considere criar alertas para custos excessivos
5. **Analise Tendências**: Use os dados para prever custos futuros
6. **Documente Decisões**: Documente por que escolheu um modelo específico

## Atualizando Preços

Se os preços dos providers mudarem, atualize o arquivo `lib/types/classification-models.ts`:

```typescript
const MODEL_PRICING: Record<ChatModel, ModelPricing> = {
  [ChatModel.OPENAI_GPT_4O_MINI]: {
    inputPricePerMillion: 0.15,  // Atualize aqui
    outputPricePerMillion: 0.60,  // Atualize aqui
  },
  // ... outros modelos
}
```

**Nota**: Preços antigos continuarão sendo usados para templates já classificados. Apenas novas classificações usarão os novos preços.

## Referências

- [Documentação de Progresso](../implementation-progress/classificacao-configuravel-schema-dinamico.md#fase-9-tracking-de-custos)
- [CHANGELOG](../CHANGELOG-2025-11-22.md)
- [Guia de Tracking de Modelos e Tokens](./model-tracking.md)
- [API de Estatísticas](../reference/dashboard-api.md)
- [OpenAI Pricing](https://openai.com/api/pricing)
- [Google Gemini Pricing](https://ai.google.dev/gemini-api/docs/pricing?hl=pt-br)

