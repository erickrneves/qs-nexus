# 🎯 Conceitos: Templates e Schemas

**Data:** 04/12/2025  
**Objetivo:** Esclarecer a diferença entre Templates de Normalização e Document Schemas

---

## 🤔 O Problema da Confusão

Durante o desenvolvimento, usamos várias nomenclaturas que geraram confusão:
- "Document Schema"
- "Template"
- "Classification Profile"
- "Processed Document"
- "Template Document"

Vamos esclarecer tudo de uma vez por todas.

---

## 📚 Definições Oficiais

### 1. **Template de Normalização** (Para o Usuário)

**O que é:** Um script/configuração que define COMO organizar dados de um documento.

**Analogia:** É como uma "receita de bolo" que diz:
- Quais ingredientes (dados) buscar
- Como misturar (organizar) esses ingredientes
- Qual formato final (estrutura) deve ter

**Exemplo Prático:**

```
Template: "Contrato de Prestação de Serviços"

Instruções:
1. Procure no documento o nome do CONTRATANTE
2. Procure no documento o nome do CONTRATADO
3. Procure o VALOR DO CONTRATO (em reais)
4. Procure a DATA DE ASSINATURA
5. Procure o PRAZO (em meses)

Organize assim:
{
  "contratante": "XYZ Ltda",
  "contratado": "João Silva",
  "valor": 50000,
  "data_assinatura": "2025-01-15",
  "prazo_meses": 12
}
```

**Para o Usuário:**
- É um "modelo" que ele escolhe ao fazer upload
- Define o que será extraído do documento
- Torna os dados estruturados e pesquisáveis

---

### 2. **Document Schema** (No Banco de Dados)

**O que é:** A definição técnica no banco de dados que o Template usa.

**Analogia:** É o "cadastro da receita" no sistema - inclui:
- Nome da receita
- Lista de ingredientes necessários
- Tipo de cada ingrediente
- Instruções para o processador (IA)

**Estrutura no BD:**

```sql
CREATE TABLE document_schemas (
  id UUID PRIMARY KEY,
  name TEXT,                    -- "Contratos de Prestação"
  base_type TEXT,               -- "document"
  category TEXT,                -- "juridico"
  table_name TEXT,              -- "contratos_prestacao"
  fields JSONB,                 -- Array de campos a extrair
  enable_rag BOOLEAN,           -- Habilitar busca semântica?
  is_active BOOLEAN,
  created_at TIMESTAMP
);
```

**Exemplo de `fields`:**

```json
[
  {
    "field_name": "contratante",
    "display_name": "Contratante",
    "field_type": "text",
    "is_required": true,
    "description": "Nome ou razão social do contratante"
  },
  {
    "field_name": "valor_contrato",
    "display_name": "Valor do Contrato (R$)",
    "field_type": "numeric",
    "is_required": false
  },
  {
    "field_name": "data_assinatura",
    "display_name": "Data de Assinatura",
    "field_type": "date",
    "is_required": false
  }
]
```

---

### 3. **Classification Profile** (Motor de IA)

**O que é:** Configuração específica de IA para extrair dados usando um Document Schema.

**Analogia:** É o "chef de cozinha" que vai seguir a receita. Define:
- Qual modelo de IA usar (GPT-4, Gemini)
- Como instruir a IA (prompt)
- Quão criativa ou precisa deve ser (temperature)

**Estrutura no BD:**

```sql
CREATE TABLE classification_profiles (
  id UUID PRIMARY KEY,
  document_schema_id UUID,      -- Link para o schema
  name TEXT,                    -- "profile_contratos_prestacao"
  system_prompt TEXT,           -- Instrução para IA
  model_provider TEXT,          -- "openai" ou "google"
  model_name TEXT,              -- "gpt-4"
  temperature DECIMAL,          -- 0.1 (preciso) a 1.0 (criativo)
  max_input_tokens INTEGER,
  max_output_tokens INTEGER
);
```

**Exemplo de `system_prompt`:**

```
Você é um especialista em análise de contratos.

Analise o documento e extraia os seguintes dados:
- contratante (obrigatório): Nome ou razão social do contratante
- contratado (obrigatório): Nome ou razão social do contratado
- valor_contrato: Valor total em reais
- data_assinatura: Data de assinatura do contrato
- prazo_meses: Prazo do contrato em meses

Retorne APENAS um objeto JSON válido com esses campos.
Se não encontrar algum campo, use null.
```

---

### 4. **Processed Document** (Resultado)

**O que é:** O documento depois de processado, com dados extraídos.

**Analogia:** É o "bolo pronto" - o resultado final após seguir a receita.

**Estrutura no BD:**

```sql
CREATE TABLE processed_documents (
  id UUID PRIMARY KEY,
  document_id UUID,             -- Link para documento original
  document_schema_id UUID,      -- Qual template foi usado
  title TEXT,                   -- Título extraído
  markdown TEXT,                -- Markdown normalizado
  metadata JSONB,               -- Dados extraídos
  custom_table_record UUID,     -- ID na tabela customizada
  created_at TIMESTAMP
);
```

**Exemplo de `metadata`:**

```json
{
  "contratante": "Empresa ABC Ltda",
  "contratado": "João Silva Consultoria",
  "valor_contrato": 75000.00,
  "data_assinatura": "2025-01-10",
  "prazo_meses": 12,
  "objeto": "Consultoria em TI"
}
```

---

### 5. **Document Chunks** (Fragmentos para Busca)

**O que é:** Pedaços do documento com vetores para busca semântica.

**Analogia:** São as "fatias do bolo" numeradas e catalogadas para encontrar rapidamente.

**Estrutura no BD:**

```sql
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY,
  processed_document_id UUID,
  chunk_index INTEGER,          -- Posição no documento
  content TEXT,                 -- Texto do fragmento
  embedding VECTOR(1536),       -- Vetor para busca
  token_count INTEGER,
  start_line INTEGER,
  end_line INTEGER
);
```

---

## 🔄 Fluxo Completo: Do Upload ao Banco

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USUÁRIO FAZ UPLOAD                                           │
├─────────────────────────────────────────────────────────────────┤
│ Arquivo: contrato-xyz.pdf                                       │
│ Template Escolhido: "Contratos de Prestação de Serviços"      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. SISTEMA CARREGA CONFIGURAÇÕES                                │
├─────────────────────────────────────────────────────────────────┤
│ SELECT * FROM document_schemas WHERE name = '...'              │
│ SELECT * FROM classification_profiles WHERE schema_id = '...'  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. CONVERSÃO                                                    │
├─────────────────────────────────────────────────────────────────┤
│ PDF → Markdown                                                  │
│ Output: "# Contrato\n\nEntre ABC Ltda (contratante)..."       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. CLASSIFICAÇÃO (IA)                                          │
├─────────────────────────────────────────────────────────────────┤
│ GPT-4 recebe:                                                   │
│ - System Prompt do Classification Profile                      │
│ - Markdown do documento                                         │
│ - Schema de campos a extrair                                    │
│                                                                 │
│ GPT-4 retorna:                                                  │
│ {                                                               │
│   "contratante": "ABC Ltda",                                   │
│   "contratado": "João Silva",                                  │
│   "valor_contrato": 75000,                                     │
│   "data_assinatura": "2025-01-10",                            │
│   "prazo_meses": 12                                            │
│ }                                                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. INDEXAÇÃO DUPLA                                             │
├─────────────────────────────────────────────────────────────────┤
│ A) Tabela Customizada (SQL queries):                           │
│    INSERT INTO contratos_prestacao                              │
│    (contratante, contratado, valor_contrato, ...)              │
│    VALUES ('ABC Ltda', 'João Silva', 75000, ...)               │
│                                                                 │
│ B) Tabelas RAG (busca semântica):                             │
│    INSERT INTO processed_documents (...)                        │
│    INSERT INTO document_chunks (content, embedding, ...)        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. RESULTADO FINAL                                             │
├─────────────────────────────────────────────────────────────────┤
│ ✅ Documento processado                                         │
│ ✅ Dados em formato estruturado (SQL)                          │
│ ✅ Dados em formato vetorial (RAG)                             │
│ ✅ Disponível para queries e busca semântica                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Resumo da Nomenclatura

| Termo no Código | Nome para Usuário | O que é |
|-----------------|-------------------|---------|
| `document_schemas` | Template de Normalização | Receita de como extrair dados |
| `classification_profiles` | (Interno) | Configuração da IA |
| `processed_documents` | Documento Processado | Resultado final com dados extraídos |
| `document_chunks` | (Interno) | Fragmentos para busca |
| Tabela customizada (ex: `contratos_prestacao`) | Dados Estruturados | Tabela SQL com campos extraídos |

---

## 💡 Analogia Completa: Padaria

Imagine que o sistema é uma **Padaria Automatizada**:

### 1. **Document Schema** = Receita de Bolo
- Lista de ingredientes necessários
- Quantidades de cada ingrediente
- Tipo de cada ingrediente (farinha, açúcar, ovos)

### 2. **Classification Profile** = Chef de Cozinha (IA)
- Lê a receita
- Sabe usar o forno (GPT-4)
- Tem experiência em fazer bolos (system prompt)
- Segue a receita ao pé da letra (temperature baixa)

### 3. **Upload de Documento** = Cliente traz ingredientes
- Cliente chega com um saco de ingredientes (PDF)
- Pede: "Faça um bolo usando a receita X"

### 4. **Conversão** = Organizar ingredientes na bancada
- Separar farinha, açúcar, ovos (extrair texto do PDF)
- Limpar e preparar (normalizar Markdown)

### 5. **Classificação** = Chef prepara o bolo
- Chef lê a receita (Classification Profile)
- Identifica cada ingrediente (extrai dados)
- Mede quantidades certas (estrutura JSON)

### 6. **Indexação** = Armazenar o bolo pronto
- **Vitrine (Tabela SQL):** Bolo exposto para venda (queries rápidas)
- **Catálogo (RAG):** Fotos e descrições detalhadas (busca semântica)

### 7. **Busca**
- **SQL:** "Me mostre todos os bolos de chocolate" (query estruturada)
- **RAG:** "Quero algo parecido com bolo de chocolate mas com menos açúcar" (busca semântica)

---

## 🔍 Quando Usar Cada Conceito

### Para Usuários (Interface):
✅ "Template de Normalização"  
✅ "Documento Processado"  
✅ "Dados Estruturados"  
✅ "Busca Semântica"

❌ "Document Schema"  
❌ "Classification Profile"  
❌ "Processed Document"  
❌ "Document Chunks"

### Para Desenvolvedores (Código):
✅ `document_schemas` (tabela)  
✅ `classification_profiles` (tabela)  
✅ `processed_documents` (tabela)  
✅ `document_chunks` (tabela)

### Para Documentação Técnica:
✅ "Schema de Documento" (quando explicando BD)  
✅ "Perfil de Classificação" (quando explicando IA)  
✅ "Indexação Dupla" (quando explicando armazenamento)

---

## 📊 Exemplo End-to-End

### Cenário: Empresa quer processar contratos

#### 1. Admin Cria Template

```
Nome: "Contratos de Prestação"
Tipo: Documentos
Campos:
  - Contratante (texto, obrigatório)
  - Contratado (texto, obrigatório)
  - Valor (número, opcional)
  - Data (data, opcional)
  - Prazo (número, opcional)

Modelo IA: GPT-4
Prompt: "Extraia dados de contratos de prestação de serviços..."
```

**No banco:** Cria `document_schemas` + `classification_profiles` + `contratos_prestacao` (tabela)

#### 2. Usuário Faz Upload

```
Acessa /upload
Seleciona: contrato-empresa-abc.pdf
Sistema sugere: "Contratos de Prestação" (auto-detecção)
Usuário confirma
Clica "Processar"
```

#### 3. Sistema Processa

```
[Upload] ✓ Salvo em /uploads/org/2025/12/abc123-contrato.pdf
[Conversão] ✓ PDF → Markdown (5234 palavras)
[Classificação] ✓ GPT-4 extraiu 5 campos
[Fragmentação] ✓ 12 chunks criados
[Vetorização] ✓ 12 embeddings gerados
[Indexação] ✓ Salvo em contratos_prestacao + processed_documents
```

#### 4. Dados Disponíveis

**Query SQL:**
```sql
SELECT contratante, valor_contrato, data_assinatura
FROM contratos_prestacao
WHERE valor_contrato > 50000
ORDER BY data_assinatura DESC;
```

**Busca Semântica (Chat):**
```
User: "Quais contratos mencionam serviços de TI?"
System: [busca vetorial] → retorna fragmentos relevantes
```

---

## ✅ Checklist de Compreensão

Você entendeu se conseguir responder:

- [ ] O que é um Template de Normalização para o usuário?
- [ ] Qual a diferença entre `document_schemas` e `classification_profiles`?
- [ ] Por que salvamos os dados em dois lugares (Indexação Dupla)?
- [ ] O que é um Document Chunk e para que serve?
- [ ] Quando usar queries SQL vs busca semântica?

---

**Mantido por:** Equipe de Desenvolvimento  
**Última atualização:** 04/12/2025  
**Status:** ✅ Documentação Completa

