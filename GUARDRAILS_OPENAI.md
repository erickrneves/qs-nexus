# 🚨 GUARDRAILS - Proteção contra Custos Altos com OpenAI

## ⚠️ PROBLEMA IDENTIFICADO

Foram gastos **$19 USD** na OpenAI devido a:
- Loops infinitos ou excessivos
- Processamento de documentos muito grandes sem limites
- Ausência de rate limiting
- Falta de validação antes de processar

## ✅ SOLUÇÕES IMPLEMENTADAS

### 1. Limites Rígidos (`lib/services/ai-guardrails.ts`)

```typescript
GUARDRAILS = {
  TEST_MODE_MAX_ARTICLES: 5,         // 🚨 APENAS 5 ARTIGOS DURANTE TESTES
  MAX_ARTICLES_PER_DOCUMENT: 100,    // Máximo 100 artigos por documento
  MAX_API_CALLS_PER_DOCUMENT: 20,    // Máximo 20 chamadas por documento
  MAX_API_CALLS_PER_HOUR: 30,        // Máximo 30 chamadas/hora (global)
  MAX_COST_PER_DOCUMENT: $0.20,      // Máximo $0.20 por documento
  API_CALL_TIMEOUT: 30000,           // Timeout de 30 segundos por chamada
}
```

### 2. Validação Antes de Processar

Antes de iniciar qualquer processamento:
- ✅ Valida número de artigos
- ✅ Estima custo total
- ✅ Verifica limites de chamadas
- ✅ Bloqueia se exceder limites

### 3. Rate Limiting

- Contador global de chamadas por hora
- Contador por documento
- Limpeza automática de contadores antigos

### 4. Modo de Teste

**🚨 IMPORTANTE:** Durante testes, apenas **5 artigos** são processados!

Para processar todos os artigos:
1. Abra `lib/services/ai-guardrails.ts`
2. Altere `TEST_MODE_MAX_ARTICLES: 5` para `TEST_MODE_MAX_ARTICLES: null`
3. Reinicie o servidor

### 5. Logging de Custos

Cada processamento mostra:
```
[GUARDRAIL] 💰 Custo estimado total: $0.0375
[GUARDRAIL] API call registrada para doc-123. Total: 5
```

### 6. Estatísticas de Uso

**API Endpoint:** `/api/ai/usage-stats`

Retorna:
```json
{
  "totalCalls": 15,
  "callsByDocument": {
    "doc-123": 5,
    "doc-456": 10
  },
  "estimatedTotalCost": 0.1125
}
```

## 🛡️ COMO USAR

### Ao Processar um Documento:

1. **Verifique os logs:**
   ```
   🚨 [GUARDRAIL] MODO DE TESTE: Processando apenas 5 artigos de 93
   [GUARDRAIL] 💰 Custo estimado total: $0.0375
   ```

2. **Se OK, continue:**
   - Sistema processa automaticamente
   - Respeita todos os limites
   - Para se atingir limites

3. **Se bloquear:**
   ```
   [GUARDRAIL] Limite de 20 chamadas por documento atingido
   ```
   - Aguarde 1 hora OU
   - Resete contador (ver abaixo)

### Resetar Contadores (Usar com CUIDADO!):

```typescript
import { resetCounter } from '@/lib/services/ai-guardrails'

// Resetar contador de um documento específico
resetCounter('document-id')

// Resetar TODOS os contadores (use apenas se necessário!)
resetCounter()
```

## 📊 Custos Estimados

### GPT-4 Turbo Pricing:
- Input: $0.01 / 1K tokens
- Output: $0.03 / 1K tokens

### Exemplo - Lei 10.833 (93 artigos):

**Modo ANTIGO (retorna texto completo):**
- Input: ~50K tokens × 9 batches = 450K tokens → $4.50
- Output: ~50K tokens × 9 batches = 450K tokens → $13.50
- **TOTAL: ~$18.00** 😱

**Modo NOVO (retorna apenas estrutura):**
- Input: ~50K tokens × 9 batches = 450K tokens → $4.50
- Output: ~3K tokens × 9 batches = 27K tokens → $0.81
- **TOTAL: ~$5.31** ✅ (70% economia)

**Modo NOVO + TEST_MODE (apenas 5 artigos):**
- Input: ~7.5K tokens → $0.075
- Output: ~1.5K tokens → $0.045
- **TOTAL: ~$0.12** 🎉 (99% economia)

## 🚀 RECOMENDAÇÕES

### Durante Desenvolvimento:
1. ✅ **SEMPRE** usar `TEST_MODE_MAX_ARTICLES: 5`
2. ✅ Monitorar logs de custo
3. ✅ Verificar `/api/ai/usage-stats` regularmente
4. ✅ Resetar contadores entre testes

### Em Produção:
1. ⚠️ Definir `TEST_MODE_MAX_ARTICLES: null` **APENAS** quando validado
2. ⚠️ Manter `MAX_COST_PER_DOCUMENT` baixo (ex: $1.00)
3. ⚠️ Monitorar custos na OpenAI Dashboard
4. ⚠️ Implementar billing alerts na OpenAI

## ❌ O QUE NÃO FAZER

- ❌ Processar documentos sem verificar número de artigos
- ❌ Desabilitar guardrails sem necessidade
- ❌ Ignorar logs de custo estimado
- ❌ Processar o mesmo documento múltiplas vezes seguidas
- ❌ Usar em produção sem testar em staging primeiro

## ✅ CHECKLIST Antes de Processar Documento Grande

- [ ] `TEST_MODE_MAX_ARTICLES` está ativo?
- [ ] Custo estimado é aceitável?
- [ ] Documento não foi processado recentemente?
- [ ] Limite de chamadas/hora não foi atingido?
- [ ] Logs estão sendo monitorados?

## 🆘 Se Gastar Muito Dinheiro

1. **PARE TUDO IMEDIATAMENTE:**
   ```bash
   pkill -f "next dev"
   ```

2. **Revise OpenAI Dashboard:**
   - https://platform.openai.com/usage

3. **Ajuste Limites:**
   - Diminua `MAX_COST_PER_DOCUMENT`
   - Diminua `MAX_API_CALLS_PER_HOUR`
   - Aumente `TEST_MODE_MAX_ARTICLES` apenas quando seguro

4. **Investigue Logs:**
   - Procure por loops
   - Identifique documentos problemáticos
   - Verifique timestamps das chamadas

---

**⚠️ LEMBRE-SE:** Cada chamada custa dinheiro. Sempre valide antes de processar!

